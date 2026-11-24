import { randomUUID } from 'node:crypto';
import { launchBrowser } from './test-browser.mjs';
import assert from 'node:assert/strict';
const browser = await launchBrowser();
const base = process.env.TEST_USERS_URL || 'http://127.0.0.1:5186';
const temporaryPassword = randomUUID();
const nextPassword = randomUUID();
const errors = [];
const messages = [];
async function setup(papel = 'ADMIN', precisaTrocarSenha = false) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1224 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => messages.push(message.text()));
  const state = { papel, precisaTrocarSenha, users: [], creates: [], gets: 0, patches: [], resets: [], denial: false, duplicate: false, session: true, tokens: 0 };
  await page.route('http://127.0.0.1:3000/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-Token' };
    const respond = (status, json) => route.fulfill({ status, headers, ...(status === 204 ? {} : { contentType: 'application/json', body: JSON.stringify(json) }) });
    if (method === 'OPTIONS') return respond(204);
    if (path === '/api/csrf-token') { state.tokens++; return respond(200, { token: 'csrf-test-' + state.tokens }); }
    const auth = { id: 1, email: 'admin@example.test', papel: state.papel, precisaTrocarSenha: state.precisaTrocarSenha, funcionarioId: null };
    if (path === '/api/auth/me') return respond(state.session ? 200 : 401, state.session ? auth : { message: 'Não autenticado.' });
    if (method !== 'GET') assert.match(request.headers()['x-csrf-token'], /^csrf-test-/);
    if (path === '/api/auth/login') { assert.deepEqual(Object.keys(request.postDataJSON()).sort(), ['email', 'senha']); state.session = true; return respond(200, auth); }
    if (path === '/api/auth/logout') { state.session = false; return respond(204); }
    if (path === '/api/auth/trocar-senha') {
      assert.deepEqual(Object.keys(request.postDataJSON()).sort(), ['novaSenha', 'senhaAtual']);
      state.precisaTrocarSenha = false; return respond(204);
    }
    if (state.denial || state.papel !== 'ADMIN') return respond(403, { message: 'Acesso negado.' });
    if (path === '/api/usuarios' && method === 'GET') { state.gets++; return respond(200, state.users); }
    if (path === '/api/usuarios' && method === 'POST') {
      const body = request.postDataJSON();
      state.creates.push(body);
      assert.ok(Object.keys(body).every(key => ['email', 'papel', 'funcionarioId', 'senhaTemporaria'].includes(key)));
      if (state.duplicate) return respond(409, { message: 'Já existe um usuário com este e-mail.' });
      const user = { id: state.users.length + 2, email: body.email || 'vinculado@example.test', papel: body.papel, ativo: true, precisaTrocarSenha: true, funcionario: body.funcionarioId ? { id: body.funcionarioId, nome: 'Funcionário vinculado' } : null, criadoEm: '2026-01-01T00:00:00.000Z', bloqueadoAte: null };
      state.users.push(user); return respond(201, user);
    }
    const match = path.match(/^\/api\/usuarios\/(\d+)(\/redefinir-senha)?$/);
    if (match) {
      const id = Number(match[1]);
      if (match[2] && method === 'POST') { state.resets.push({ id, keys: Object.keys(request.postDataJSON()) }); return respond(204); }
      if (method === 'PATCH') { const body = request.postDataJSON(); state.patches.push({ id, body }); Object.assign(state.users.find(user => user.id === id), body); return respond(200, state.users.find(user => user.id === id)); }
    }
    return respond(404, { message: 'Rota não encontrada.' });
  });
  return { page, state };
}
try {
  const { page, state } = await setup();
  await page.goto(base + '/configuracoes/usuarios');
  await page.getByRole('heading', { name: 'Adicionar usuário', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Configurações', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await page.getByText('Informe o e-mail ou o ID de um funcionário.', { exact: true }).waitFor();
  await page.getByText('A senha temporária deve ter de 10 a 128 caracteres.', { exact: true }).waitFor();
  assert.equal(state.creates.length, 0);
  await page.getByLabel('Nome', { exact: true }).fill('Nome somente visual');
  await page.getByLabel(/E-mail/).fill(' NOVO@EXAMPLE.TEST ');
  await page.getByLabel('Senha temporária *', { exact: true }).fill(temporaryPassword);
  await page.getByRole('radio', { name: /Gestor/ }).check();
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
  await page.screenshot({ path: 'reference/settings-users.png', fullPage: true });
  const images = await page.locator('img[src*="/settings/"]').evaluateAll(elements => elements.map(image => ({ loaded: image.complete && image.naturalWidth > 0, width: image.width, height: image.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })));
  assert.ok(images.every(image => image.loaded && image.width === image.naturalWidth && image.height === image.naturalHeight));
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await page.getByRole('heading', { name: 'Usuários cadastrados' }).waitFor();
  await page.getByRole('cell').filter({ hasText: 'novo@example.test' }).first().waitFor();
  assert.deepEqual(state.creates[0], { email: 'novo@example.test', papel: 'GESTOR', senhaTemporaria: temporaryPassword });
  assert.ok(state.gets >= 2);
  await page.getByRole('status').filter({ hasText: 'Usuário cadastrado' }).waitFor();
  const stored = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  assert.ok(!JSON.stringify(stored).includes(temporaryPassword));
  await page.getByRole('combobox', { name: 'Papel de novo@example.test' }).selectOption('FUNCIONARIO');
  await page.getByText('Usuário atualizado.', { exact: true }).waitFor();
  assert.deepEqual(state.patches[0], { id: 2, body: { papel: 'FUNCIONARIO' } });
  await page.getByRole('button', { name: 'Desativar', exact: true }).click();
  await page.getByRole('button', { name: 'Ativar', exact: true }).waitFor();
  assert.deepEqual(state.patches[1], { id: 2, body: { ativo: false } });
  await page.getByRole('button', { name: 'Redefinir senha', exact: true }).click();
  await page.getByLabel('Nova senha temporária').fill(temporaryPassword);
  await page.getByRole('button', { name: 'Redefinir', exact: true }).click();
  await page.getByText('Usuário atualizado.', { exact: true }).waitFor();
  assert.deepEqual(state.resets[0], { id: 2, keys: ['senhaTemporaria'] });
  await page.getByRole('button', { name: 'Adicionar usuário', exact: true }).click();
  await page.getByLabel(/E-mail/).fill('novo@example.test');
  await page.getByLabel('Senha temporária *', { exact: true }).fill(temporaryPassword);
  state.duplicate = true;
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Já existe um usuário' }).waitFor();
  state.duplicate = false; state.denial = true;
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'permissão' }).waitFor();
  state.denial = false;
  await page.getByLabel(/E-mail/).fill('');
  await page.getByLabel('ID do funcionário (opcional)').fill('7');
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await page.getByRole('cell').filter({ hasText: 'vinculado@example.test' }).first().waitFor();
  assert.equal(state.creates.at(-1).funcionarioId, 7);
  assert.ok(!('email' in state.creates.at(-1)));
  await page.close();
  for (const role of ['GESTOR', 'FUNCIONARIO']) {
    const { page: denied, state: deniedState } = await setup(role);
    await denied.goto(base + '/configuracoes/usuarios');
    await denied.waitForURL('**/home');
    assert.equal(await denied.getByRole('link', { name: 'Configurações', exact: true }).count(), 0);
    assert.equal(deniedState.gets, 0);
    await denied.close();
  }
  const { page: empty } = await setup();
  await empty.goto(base + '/configuracoes/usuarios');
  await empty.getByRole('button', { name: 'Usuários', exact: true }).click();
  await empty.getByText('Nenhum usuário cadastrado na fonte consultada.', { exact: true }).waitFor();
  await empty.close();
  const { page: first, state: firstState } = await setup('ADMIN', true);
  await first.goto(base + '/configuracoes/usuarios');
  await first.waitForURL('**/alterar-senha');
  assert.equal(firstState.gets, 0);
  await first.getByLabel('Senha provisória', { exact: true }).fill(temporaryPassword);
  await first.getByLabel('Nova senha', { exact: true }).fill(nextPassword);
  await first.getByLabel('Confirme a nova senha').fill(nextPassword);
  await first.getByRole('button', { name: 'Salvar nova senha' }).click();
  await first.waitForURL('**/home');
  assert.equal(firstState.precisaTrocarSenha, false);
  await first.getByRole('link', { name: 'Configurações', exact: true }).click();
  await first.getByRole('heading', { name: 'Adicionar usuário', exact: true }).waitFor();
  await first.close();
  const { page: loginPage, state: loginState } = await setup();
  loginState.session = false;
  await loginPage.goto(base + '/configuracoes/usuarios');
  await loginPage.waitForURL('**/login');
  await loginPage.locator('#email').fill('admin@example.test');
  await loginPage.locator('#password').fill(temporaryPassword);
  await loginPage.getByRole('button', { name: 'Entrar', exact: true }).click();
  await loginPage.waitForURL('**/home');
  assert.equal(loginState.tokens, 2, 'CSRF is renewed immediately after login');
  await loginPage.getByRole('link', { name: 'Configurações', exact: true }).click();
  await loginPage.getByRole('heading', { name: 'Adicionar usuário', exact: true }).waitFor();
  await loginPage.getByLabel('E-mail', { exact: true }).fill('rotacao@example.test');
  await loginPage.getByLabel('Senha temporária *', { exact: true }).fill(temporaryPassword);
  await loginPage.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await loginPage.getByRole('heading', { name: 'Usuários cadastrados' }).waitFor();
  assert.equal(loginState.tokens, 2, 'CSRF must be renewed after login regenerates the session');
  await loginPage.close();
  assert.deepEqual(errors, []);
  assert.ok(messages.every(message => !message.includes(temporaryPassword)));
  console.log('PASS: ADMIN access, GESTOR/FUNCIONARIO blocked, field validation, exact create/PATCH/reset contracts, cookie/CSRF requests, duplicate/forbidden handling, optional employee link, list refresh/empty state, mandatory password change, original assets, no password in storage/logs. HTTP responses are controlled fixtures; no remote records created.');
} finally { await browser.close(); }
