import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { launchBrowser } from './test-browser.mjs';
const browser = await launchBrowser();
const base = process.env.TEST_RECORDS_URL || 'http://127.0.0.1:5187';
const testPassword = randomUUID();
const nextPassword = randomUUID();
const sessionId = randomUUID();
const origin = 'http://127.0.0.1:3000';
const faults = [];
async function setup({ firstAccess = false } = {}) {
  const page = await browser.newPage();
  page.on('pageerror', error => faults.push(error.message));
  const state = { session: false, firstAccess, disabled: false, tokens: 0, protected: 0, logins: [], passwords: [], expire: false, logoutFail: false, cookieSeen: false };
  await page.route(origin + '/api/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname; const method = request.method();
    const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-Token' };
    const reply = (status, body, extra = {}) => route.fulfill({ status, headers: { ...headers, ...extra }, ...(status === 204 ? {} : { contentType: 'application/json', body: JSON.stringify(body) }) });
    if (method === 'OPTIONS') return reply(204);
    const user = { id: 11, email: 'admin@example.test', papel: 'ADMIN', funcionarioId: 7, precisaTrocarSenha: state.firstAccess };
    if (path === '/api/csrf-token') { state.tokens++; return reply(200, { token: 'csrf-auth-' + state.tokens }); }
    if (path === '/api/auth/me') { state.cookieSeen ||= Boolean(request.headers().cookie?.includes('sid=')); return reply(state.session ? 200 : 401, state.session ? user : { message: 'Não autenticado.' }); }
    if (method !== 'GET') assert.match(request.headers()['x-csrf-token'], /^csrf-auth-/);
    if (path === '/api/auth/login') {
      const body = request.postDataJSON(); state.logins.push(body);
      assert.deepEqual(Object.keys(body).sort(), ['email', 'senha']);
      if (body.senha === 'incorreta' || state.disabled) return reply(401, { message: 'Credenciais inválidas.' });
      state.session = true;
      const { funcionarioId, ...loginUser } = user;
      return reply(200, loginUser, { 'Set-Cookie': `sid=${sessionId}; HttpOnly; SameSite=Lax; Path=/` });
    }
    if (path === '/api/auth/trocar-senha') { const body = request.postDataJSON(); assert.deepEqual(Object.keys(body).sort(), ['novaSenha', 'senhaAtual']); state.passwords.push(body); state.firstAccess = false; return reply(204); }
    if (path === '/api/auth/logout') { if (state.logoutFail) return reply(500, { message: 'Erro interno.' }); state.session = false; return reply(204, undefined, { 'Set-Cookie': 'sid=; HttpOnly; Max-Age=0; Path=/' }); }
    state.protected++;
    if (state.expire || !state.session) { state.session = false; return reply(401, { message: 'Não autenticado.' }); }
    if (state.firstAccess) return reply(403, { message: 'Troque a senha provisória antes de continuar.' });
    return reply(200, []);
  });
  return { page, state };
}
async function login(page, password = testPassword) {
  await page.locator('#email').fill(' ADMIN@EXAMPLE.TEST ');
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
try {
  const { page, state } = await setup();
  await page.goto(base + '/home'); await page.waitForURL('**/login'); assert.equal(state.protected, 0);
  await login(page, 'incorreta'); await page.getByRole('alert').filter({ hasText: 'Credenciais inválidas' }).waitFor(); assert.equal(state.session, false);
  state.disabled = true; await login(page); await page.getByRole('alert').filter({ hasText: 'Credenciais inválidas' }).waitFor();
  state.disabled = false; await login(page); await page.waitForURL('**/home');
  assert.equal(state.logins.at(-1).email, 'admin@example.test'); assert.ok(state.tokens >= 2);
  assert.ok(state.cookieSeen, 'GET /me after login must send the HttpOnly cookie');
  await page.getByRole('button', { name: 'Perfil de admin@example.test' }).click();
  await page.getByRole('link', { name: 'Abrir meu perfil' }).waitFor();
  await page.reload(); await page.waitForURL('**/home');
  await page.getByRole('button', { name: 'Perfil de admin@example.test' }).click();
  state.logoutFail = true; await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Não foi possível encerrar' }).waitFor(); assert.ok(page.url().endsWith('/home'));
  state.logoutFail = false; await page.getByRole('button', { name: 'Sair', exact: true }).click(); await page.waitForURL('**/login'); assert.equal(state.session, false);
  await login(page); await page.waitForURL('**/home'); await page.waitForLoadState('networkidle'); state.expire = true;
  await page.evaluate(async () => { const { createDataServices } = await import('/src/data/createDataServices.ts'); try { await (await createDataServices()).works.getAll(); } catch {} });
  await page.waitForURL('**/login');
  const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  assert.ok(!storage.includes(sessionId) && !storage.includes(testPassword) && !storage.includes('csrf-auth-'));
  await page.close();
  const { page: first, state: firstState } = await setup({ firstAccess: true });
  await first.goto(base + '/login'); await login(first); await first.waitForURL('**/alterar-senha'); assert.equal(firstState.protected, 0);
  await first.getByLabel('Senha provisória', { exact: true }).fill(testPassword);
  await first.getByLabel('Nova senha', { exact: true }).fill(nextPassword);
  await first.getByLabel('Confirme a nova senha').fill(nextPassword);
  await first.getByRole('button', { name: 'Salvar nova senha' }).click(); await first.waitForURL('**/home');
  assert.ok(firstState.tokens >= 3); assert.equal(firstState.passwords.length, 1); await first.close();

  const http = await browser.newPage();
  await http.route(origin + '/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const h = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-Token' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: h });
    if (path === '/api/auth/me') return route.fulfill({ status: 401, headers: h, contentType: 'application/json', body: '{"message":"Não autenticado."}' });
    return route.fulfill({ status: 200, headers: h, contentType: 'application/json', body: '{"token":"unit-csrf"}' });
  });
  await http.goto(base + '/login');
  const result = await http.evaluate(async () => {
    const { ApiClient } = await import('/src/api/ApiClient.ts');
    const client = new ApiClient('http://127.0.0.1:3000');
    const original = window.fetch; let posts = 0; let csrf = 0; let nextStatus = 200; let message = ''; let offline = false;
    window.fetch = async (_url, options) => {
      if (offline) throw new TypeError('offline');
      if (String(_url).endsWith('/csrf-token')) { csrf++; await new Promise(resolve => setTimeout(resolve, 10)); return new Response(JSON.stringify({ token: 'unit-token' }), { status: 200 }); }
      if (options.method === 'POST') posts++;
      if (nextStatus === 204) return new Response(null, { status: 204 });
      return new Response(JSON.stringify(nextStatus >= 400 ? { message } : []), { status: nextStatus });
    };
    try {
      await Promise.all([client.request('/api/obras', 'POST', { nome: 'A' }), client.request('/api/obras', 'POST', { nome: 'B' })]);
      const sharedCsrf = csrf; const codes = [];
      for (const status of [400, 401, 403, 404, 409, 429, 500]) { nextStatus = status; message = 'Falha controlada'; try { await client.request('/api/obras'); } catch (error) { codes.push(error.status); } }
      nextStatus = 403; message = 'Acesso negado.'; let authorization;
      try { await client.request('/api/obras', 'POST', {}); } catch (error) { authorization = error.kind; }
      const beforeCsrf = csrf; message = 'Token CSRF inválido ou ausente.'; let csrfKind;
      try { await client.request('/api/obras', 'POST', {}); } catch (error) { csrfKind = error.kind; }
      nextStatus = 204; const empty = await client.request('/api/auth/logout', 'POST');
      offline = true; let network;
      try { await client.request('/api/obras'); } catch (error) { network = error.kind; }
      return { sharedCsrf, codes, authorization, csrfKind, renewed: csrf > beforeCsrf, empty: empty === undefined, posts, network };
    } finally { window.fetch = original; }
  });
  assert.equal(result.sharedCsrf, 1); assert.deepEqual(result.codes, [400, 401, 403, 404, 409, 429, 500]);
  assert.equal(result.authorization, 'http'); assert.equal(result.csrfKind, 'csrf'); assert.ok(result.renewed); assert.ok(result.empty); assert.equal(result.posts, 5); assert.equal(result.network, 'network');
  await http.close(); assert.deepEqual(faults, []);
  console.log('PASS: HTTP JSON/204/400/401/403/404/409/429/500/network, shared in-memory CSRF and renewal without mutation retries, cookie login + /me binding, invalid/disabled login, session reload, logout failure/success, expiry, mandatory password change, protected request gate, no credentials in storage. Controlled HTTP only.');
} finally { await browser.close(); }
