import assert from 'node:assert/strict';
import { launchBrowser } from './test-browser.mjs';
export const browser = await launchBrowser(); const base = process.env.TEST_RECORDS_URL || 'http://127.0.0.1:5187'; const origin = 'http://127.0.0.1:3000'; const errors = [];
export async function setup(role = 'ADMIN') {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1112 } }); page.setDefaultTimeout(15000); page.on('pageerror', e => errors.push(e.message));
  const state = { role, uid: 1, employeeId: 7, session: true, reads: [], writes: [], failWorks: false, works: [{ id: 1, nome: 'Obra integrada', endereco: 'Rua da API, 10', status: 'EM_ANDAMENTO', dataInicio: null, dataFim: null }, { id: 2, nome: 'Segunda obra', endereco: null, status: 'PLANEJADA', dataInicio: null, dataFim: null }], employees: [{ id: 7, nome: 'Pessoa integrada', email: 'pessoa@example.test', cargo: 'Auxiliar', salario: '9999999999.99' }], allocations: [{ id: 1, funcionarioId: 7, obraId: 1, criadoEm: '2026-11-09T12:00:00Z' }] };
  const employeeDto = v => { const { salario, ...withoutSalary } = v; return { ...(state.role === 'GESTOR' ? withoutSalary : v), alocacoes: state.allocations.filter(a => a.funcionarioId === v.id).map(a => ({ id: a.id, obra: state.works.find(w => w.id === a.obraId) })) }; };
  const workDto = v => ({ ...v, ...(state.role !== 'FUNCIONARIO' && { alocacoes: state.allocations.filter(a => a.obraId === v.id).map(a => ({ id: a.id, funcionario: state.employees.find(e => e.id === a.funcionarioId) })) }) });
  const allocationDto = v => ({ ...v, funcionario: state.employees.find(e => e.id === v.funcionarioId), obra: state.works.find(w => w.id === v.obraId) });
  await page.route(origin + '/api/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname; const method = request.method();
    const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-Token' };
    const respond = (status, value) => route.fulfill({ status, headers, ...(status === 204 ? {} : { contentType: 'application/json', body: JSON.stringify(value) }) });
    if (method === 'OPTIONS') return respond(204);
    if (path === '/api/auth/me') return respond(state.session ? 200 : 401, state.session ? { id: state.uid, email: state.role.toLowerCase() + '@example.test', papel: state.role, funcionarioId: state.employeeId, precisaTrocarSenha: false } : { message: 'Não autenticado.' });
    if (path === '/api/csrf-token') return respond(200, { token: 'crud-csrf' });
    if (path === '/api/auth/logout') { state.session = false; return respond(204); }
    const [, , resource, rawId] = path.split('/'); const id = rawId && Number(rawId);
    if (method === 'GET') {
      state.reads.push(path);
      if (resource === 'auditoria') return respond(state.role === 'ADMIN' ? 200 : 403, state.role === 'ADMIN' ? [] : { message: 'Acesso negado.' });
      if (resource === 'obras') {
        if (state.failWorks) return respond(500, { message: 'Erro interno.' });
        const visible = state.works.filter(w => state.role !== 'FUNCIONARIO' || state.allocations.some(a => a.obraId === w.id && a.funcionarioId === state.employeeId));
        return id ? respond(visible.some(w => w.id === id) ? 200 : 404, visible.some(w => w.id === id) ? workDto(visible.find(w => w.id === id)) : { message: 'Obra não encontrada.' }) : respond(200, visible.map(workDto));
      }
      if (resource === 'funcionarios') {
        if (!id && state.role === 'FUNCIONARIO') return respond(403, { message: 'Acesso negado.' });
        const visible = state.employees.filter(e => state.role !== 'FUNCIONARIO' || e.id === state.employeeId);
        return id ? respond(visible.some(e => e.id === id) ? 200 : 404, visible.some(e => e.id === id) ? employeeDto(visible.find(e => e.id === id)) : { message: 'Funcionário não encontrado.' }) : respond(200, visible.map(employeeDto));
      }
      if (resource === 'alocacoes') { const visible = state.allocations.filter(a => state.role !== 'FUNCIONARIO' || a.funcionarioId === state.employeeId); return id ? respond(200, allocationDto(visible.find(a => a.id === id))) : respond(200, visible.map(allocationDto)); }
      return respond(404, { message: 'Rota não encontrada.' });
    }
    assert.equal(request.headers()['x-csrf-token'], 'crud-csrf');
    const body = request.postData() ? request.postDataJSON() : undefined; state.writes.push({ path, method, body });
    if (state.role === 'FUNCIONARIO' || resource === 'funcionarios' && state.role !== 'ADMIN') return respond(403, { message: 'Acesso negado.' });
    if (resource === 'obras') {
      if (method === 'DELETE') { state.works = state.works.filter(w => w.id !== id); state.allocations = state.allocations.filter(a => a.obraId !== id); return respond(204); }
      assert.ok(Object.keys(body).every(k => ['nome', 'endereco', 'status', 'dataInicio', 'dataFim'].includes(k)));
      const v = method === 'POST' ? { id: Math.max(0, ...state.works.map(w => w.id)) + 1, endereco: null, status: 'PLANEJADA', dataInicio: null, dataFim: null, ...body } : Object.assign(state.works.find(w => w.id === id), body);
      if (method === 'POST') state.works.push(v); return respond(method === 'POST' ? 201 : 200, workDto(v));
    }
    if (resource === 'funcionarios') {
      assert.ok(!body || Object.keys(body).every(k => ['nome', 'email', 'cargo', 'salario'].includes(k)));
      if (method === 'DELETE') { state.employees = state.employees.filter(e => e.id !== id); state.allocations = state.allocations.filter(a => a.funcionarioId !== id); return respond(204); }
      if (body.salario !== undefined) assert.equal(typeof body.salario, 'string');
      const v = method === 'POST' ? { id: Math.max(0, ...state.employees.map(e => e.id)) + 1, cargo: null, salario: null, ...body } : Object.assign(state.employees.find(e => e.id === id), body);
      if (method === 'POST') state.employees.push(v); return respond(method === 'POST' ? 201 : 200, employeeDto(v));
    }
    if (resource === 'alocacoes') {
      if (method === 'DELETE') { state.allocations = state.allocations.filter(a => a.id !== id); return respond(204); }
      assert.deepEqual(Object.keys(body).sort(), ['funcionarioId', 'obraId']);
      const v = method === 'POST' ? { id: Math.max(0, ...state.allocations.map(a => a.id)) + 1, criadoEm: '2026-11-09T12:00:00Z', ...body } : Object.assign(state.allocations.find(a => a.id === id), body);
      if (method === 'POST') state.allocations.push(v); return respond(method === 'POST' ? 201 : 200, allocationDto(v));
    }
    return respond(404, { message: 'Rota não encontrada.' });
  });
  return { page, state };
}
export { base, errors };
