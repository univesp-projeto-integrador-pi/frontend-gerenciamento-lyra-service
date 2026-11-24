import assert from 'node:assert/strict';
import { launchBrowser } from './test-browser.mjs';
const base='http://localhost:5173';
const module=await(await fetch(base+'/src/api/config.ts')).text();
const env=JSON.parse(module.match(/import\.meta\.env = (\{[^\n]+?\});/)[1]);
assert.equal(env.VITE_AUTH_MODE,'api');assert.equal(env.VITE_DATA_MODE,'api');assert.equal(env.VITE_API_URL,'http://localhost:3000');
const health=await fetch('http://localhost:3000/health',{headers:{Origin:base}});
assert.equal(health.status,200);assert.equal(health.headers.get('access-control-allow-origin'),base);assert.equal(health.headers.get('access-control-allow-credentials'),'true');
const unauthenticated=await fetch('http://localhost:3000/api/obras',{headers:{Origin:base}});
assert.equal(unauthenticated.status,401);
const browser=await launchBrowser();
try{
 const page=await browser.newPage();
 const api=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().startsWith('http://localhost:3000/api/'))api.push({path:new URL(r.url()).pathname,method:r.method()});});
 await page.goto(base+'/home');await page.waitForURL('**/login');await page.locator('#email').waitFor();await page.waitForLoadState('networkidle');
 assert.ok(api.some(r=>r.path==='/api/auth/me'&&r.method==='GET'));
 assert.ok(api.every(r=>r.method==='GET'||r.method==='OPTIONS'));
 assert.ok(!api.some(r=>r.path==='/api/obras'));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({realHTTP:true,interception:false,frontend:base,effectiveMode:env.MODE,auth:env.VITE_AUTH_MODE,data:env.VITE_DATA_MODE,apiOrigin:env.VITE_API_URL,health:health.status,cors:true,unauthenticatedWorks:unauthenticated.status,protectedRouteRedirect:true,browserErrors:errors.length,businessMutations:0}));
}finally{await browser.close();}
