import assert from 'node:assert/strict';
import { launchBrowser } from './test-browser.mjs';
const browser = await launchBrowser(); const base = process.env.TEST_RECORDS_URL || 'http://127.0.0.1:5187'; const errors = [];
async function setup(role = 'ADMIN') {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1112 } }); page.on('pageerror', error => errors.push(error.message));
  const state = { role, session: true, writes: [], gets: [], deny: false, work: { id: 1, nome: 'Obra da API', endereco: 'Endereço da API', status: 'EM_ANDAMENTO', dataInicio: '2026-01-01T00:00:00Z', dataFim: '2027-01-01T00:00:00Z', alocacoes: [] }, employee: { id: 7, nome: 'Funcionário da API', email: 'employee@example.test', cargo: 'Auxiliar', alocacoes: [] } };
  await page.route('http://127.0.0.1:3000/api/**', async route => {
    const request = route.request(); const method = request.method(); const path = new URL(request.url()).pathname;
    const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-Token' };
    const respond = (status, value) => route.fulfill({ status, headers, ...(status === 204 ? {} : { contentType: 'application/json', body: JSON.stringify(value) }) });
    if (method === 'OPTIONS') return respond(204);
    if (path === '/api/auth/me') return respond(state.session ? 200 : 401, state.session ? { id: 1, email: 'admin@example.test', papel: state.role, funcionarioId: 7, precisaTrocarSenha: false } : { message: 'Não autenticado.' });
    if (path === '/api/csrf-token') return respond(200, { token: 'csrf-records-test' });
    if (!state.session) return respond(401, { message: 'Não autenticado.' });
    if (method === 'GET') { state.gets.push(path); if (path === '/api/obras') return respond(200, [state.work]); if (path === '/api/obras/1') return respond(200, state.work); if (path === '/api/funcionarios') return respond(state.role === 'FUNCIONARIO' ? 403 : 200, state.role === 'FUNCIONARIO' ? { message: 'Acesso negado.' } : [state.employee]); if (path === '/api/funcionarios/7') return respond(200, state.employee); if (path === '/api/alocacoes') return respond(200, []); if (path === '/api/auditoria') return respond(state.role === 'ADMIN' ? 200 : 403, state.role === 'ADMIN' ? [{ id: 1, usuarioId: 1, acao: 'PUT /api/obras/:id', recurso: 'obras', recursoId: 1, detalhes: { campos: ['nome'] }, criadoEm: '2026-10-28T12:00:00Z' }] : { message: 'Acesso negado.' }); return respond(404, { message: 'Registro não encontrado.' }); }
    assert.equal(request.headers()['x-csrf-token'], 'csrf-records-test'); const body = request.postDataJSON(); state.writes.push({ path, method, body });
    if (state.deny) return respond(403, { message: 'Acesso negado.' });
    if (path.startsWith('/api/obras')) { assert.ok(Object.keys(body).every(key => ['nome', 'endereco', 'status', 'dataInicio', 'dataFim'].includes(key))); state.work = { ...state.work, ...body }; return respond(method === 'POST' ? 201 : 200, state.work); }
    if (path.startsWith('/api/funcionarios')) { assert.ok(Object.keys(body).every(key => ['nome', 'email', 'cargo'].includes(key))); state.employee = { ...state.employee, ...body }; return respond(method === 'POST' ? 201 : 200, state.employee); }
    if (path === '/api/alocacoes') { assert.deepEqual(Object.keys(body).sort(), ['funcionarioId', 'obraId']); return respond(201, { id: 1, ...body, criadoEm: '2026-10-28T12:00:00Z' }); }
    return respond(404, { message: 'Registro não encontrado.' });
  }); return { page, state };
}
try {
  const { page, state } = await setup(); await page.goto(base + '/home'); await page.getByRole('heading', { name: 'Visão geral', exact: true }).waitFor();
  await page.evaluate(async () => { const { createDataServices } = await import('/src/data/createDataServices.ts'); const s = await createDataServices(); const w = await s.works.create({ name: 'Obra cadastrada', location: 'Rua API', state: 'EM_ANDAMENTO', code: 'NAO-ENVIAR', engineerPhone: 'NAO-ENVIAR' }); if (w.id !== '1') throw new Error('ID da obra'); await s.works.update('1', { name: 'Obra atualizada', reason: 'NAO-ENVIAR' }); await s.employees.create({ name: 'Pessoa API', email: 'pessoa@example.test', role: 'Auxiliar', work: 'Sem alocação', record: 'NAO-ENVIAR', status: 'Pendente', cpf: 'NAO-ENVIAR' }); await s.employees.update('7', { name: 'Pessoa atualizada', cpf: 'NAO-ENVIAR' }); await s.allocations.create({ employeeId: '7', workId: '1', startDate: '2030-01-01', endDate: '2031-01-01', reason: 'NAO-ENVIAR' }); });
  assert.deepEqual(state.writes.map(v => v.method), ['POST', 'PUT', 'POST', 'PUT', 'POST']); assert.ok(!JSON.stringify(state.writes).includes('NAO-ENVIAR'));
  await page.goto(base + '/obras/nova'); await page.getByLabel(/^Nome da obra/).fill('Nova obra visual'); await page.getByLabel(/^Início da obra/).fill('2026-01-01'); await page.getByLabel(/^Previsão de término/).fill('2027-01-01'); await page.getByRole('button', { name: 'Próximo', exact: true }).click(); await page.getByRole('button', { name: 'Salvar obra', exact: true }).click(); await page.waitForURL('**/obras/1');
  await page.goto(base + '/funcionarios/novo'); await page.getByLabel(/^Nome completo/).fill('Funcionário visual API'); await page.getByLabel(/^E-mail/).fill('visual@example.test'); await page.getByRole('button', { name: 'Próximo', exact: true }).click(); await page.getByLabel(/^Cargo/).fill('Auxiliar'); await page.getByRole('button', { name: 'Próximo', exact: true }).click(); await page.getByRole('button', { name: 'Salvar funcionário', exact: true }).click(); await page.waitForURL('**/funcionarios/7');
  state.deny = true; await page.goto(base + '/obras/1/editar'); await page.getByLabel(/^Nome da obra/).fill('Negada'); await page.getByRole('button', { name: 'Próximo', exact: true }).click(); await page.getByRole('button', { name: 'Salvar obra', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'permissão' }).waitFor(); await page.close();
  for (const role of ['GESTOR', 'FUNCIONARIO']) {
    const { page: denied, state: r } = await setup(role);
    for (const path of ['/funcionarios/novo', '/funcionarios/7/editar', '/configuracoes/usuarios', '/configuracoes/historico', ...(role === 'FUNCIONARIO' ? ['/obras/nova', '/obras/1/editar', '/alocacoes/nova', '/docs/novo', '/funcionarios/8'] : [])]) { await denied.goto(base + path); await denied.waitForURL('**/home'); }
    if (role === 'GESTOR') { await denied.goto(base + '/obras/nova'); await denied.getByRole('heading', { name: 'Adicionar obra', exact: true }).waitFor(); }
    else { assert.ok(!r.gets.includes('/api/funcionarios/8')); await denied.goto(base + '/funcionarios/7'); await denied.getByRole('heading', { name: 'Pessoa atualizada', exact: true }).count(); await denied.getByRole('heading', { name: 'Funcionário da API', exact: true }).waitFor(); assert.equal(await denied.getByRole('link', { name: 'Editar funcionário', exact: true }).count(), 0); }
    assert.deepEqual(r.writes, []); await denied.close();
  }
  const { page: guest, state: g } = await setup(); g.session = false; await guest.goto(base + '/obras/nova'); await guest.waitForURL('**/login'); assert.deepEqual(g.gets, []); await guest.close();
  assert.deepEqual(errors, []); console.log('PASS: exact API POST/PUT payloads, numeric IDs, response decoding, CSRF, API work/employee forms, 403 handling, ADMIN/GESTOR/FUNCIONARIO route restrictions and employee ownership, no protected requests before login. Controlled HTTP fixtures only; no backend records created.');
} finally { await browser.close(); }
