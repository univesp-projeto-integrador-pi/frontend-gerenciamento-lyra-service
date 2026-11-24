import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEnv } from 'vite';
const root=process.cwd();
const pkg=JSON.parse(readFileSync('package.json','utf8'));
// Isolate shell overrides: verify the committed defaults, then explicit Vite precedence.
const saved={...process.env};
try {
  for(const key of Object.keys(process.env)) if(key.startsWith('VITE_')) delete process.env[key];
  for(const mode of ['development','api','production']) {
    const env=loadEnv(mode,root);
    assert.equal(env.VITE_AUTH_MODE,'api',mode);
    assert.equal(env.VITE_DATA_MODE,'api',mode);
    assert.equal(env.VITE_API_URL, mode === 'production' ? '' : 'http://localhost:3000', mode);
  }
  const mock=loadEnv('mock',root);
  assert.equal(mock.VITE_AUTH_MODE,'mock');
  assert.equal(mock.VITE_DATA_MODE,'local');
  process.env.VITE_API_URL='https://configured.example.test';
  assert.equal(loadEnv('development',root).VITE_API_URL,process.env.VITE_API_URL);
  assert.equal(loadEnv('production',root).VITE_API_URL,process.env.VITE_API_URL);
  for(const script of ['dev','dev:api','dev:mock']) {
    assert.match(pkg.scripts[script],/--host localhost/);
    assert.match(pkg.scripts[script],/--port 5173/);
    assert.match(pkg.scripts[script],/--strictPort/);
  }
  assert.match(pkg.scripts['dev:mock'],/--mode mock/);
  assert.doesNotMatch(pkg.scripts.dev,/--mode mock/);
  console.log('PASS: default development/production/API use real services; mock is explicit; fixed origin/strict port; process overrides honored. Configuration regression only.');
} finally {
  for(const key of Object.keys(process.env)) if(key.startsWith('VITE_')) delete process.env[key];
  for(const [key,value] of Object.entries(saved)) if(key.startsWith('VITE_')) process.env[key]=value;
}
