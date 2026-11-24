import assert from 'node:assert/strict';
import { browser, base, errors, setup } from './api-crud-fixture.mjs';
async function open(page) {
  await page.goto(base + '/obras/1');
  await page.getByRole('button', { name: 'Excluir obra', exact: true }).click();
  return page.getByRole('alertdialog');
}
try {
  for (const role of ['ADMIN', 'GESTOR']) {
    const { page, state } = await setup(role);
    let modal = await open(page);
    await modal.getByText(/funcionários continuarão cadastrados/).waitFor();
    assert.ok((await modal.innerText()).includes('Obra integrada'));
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Cancelar');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('alertdialog').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Excluir obra');
    assert.equal(state.writes.length, 0);
    await page.setViewportSize({ width: 390, height: 700 });
    modal = await open(page);
    const bounds = await modal.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
    if (role === 'ADMIN') await page.screenshot({ path: 'reference/validation/work-deletion-mobile.png' });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 1112 });
    modal = await open(page);
    await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal(state.works.length, 2);
    assert.equal(state.writes.length, 0);

    for (const failure of [403, 404, 'network']) {
      await page.route('**/api/obras/1', async (route, request) => {
        if (request.method() !== 'DELETE') return route.fallback();
        if (failure === 'network') return route.abort('failed');
        return route.fulfill({ status: failure, contentType: 'application/json', body: JSON.stringify({ message: 'Falha controlada.' }), headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
      });
      modal = await open(page);
      await modal.getByRole('button', { name: 'Excluir obra', exact: true }).click();
      await modal.getByRole('alert').waitFor();
      assert.equal(state.works.length, 2);
      assert.equal(state.allocations.length, 1);
      await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await page.unroute('**/api/obras/1');
    }

    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let deletes = 0;
    await page.route('**/api/obras/1', async (route, request) => {
      if (request.method() !== 'DELETE') return route.fallback();
      deletes++;
      assert.equal(request.headers()['x-csrf-token'], 'crud-csrf');
      assert.equal(request.postData(), null);
      await gate;
      return route.fallback();
    });
    modal = await open(page);
    await modal.getByRole('button', { name: 'Excluir obra', exact: true }).click();
    await modal.getByRole('button', { name: 'Excluindo…', exact: true }).waitFor();
    assert.ok(await modal.getByRole('button', { name: 'Cancelar', exact: true }).isDisabled());
    await page.keyboard.press('Escape');
    assert.equal(await modal.count(), 1);
    await modal.getByRole('button', { name: 'Excluindo…', exact: true }).evaluate(button => { button.click(); button.click(); });
    assert.equal(deletes, 1);
    assert.equal(state.works.length, 2);
    release();
    await page.waitForURL('**/obras');
    await page.getByRole('status').filter({ hasText: 'Os funcionários foram preservados' }).waitFor();
    assert.equal(state.works.length, 1);
    assert.equal(state.allocations.length, 0);
    assert.equal(state.employees.length, 1);
    assert.equal(state.writes.filter(w => w.method === 'DELETE').length, 1);
    assert.equal(state.writes.find(w => w.method === 'DELETE').path, '/api/obras/1');
    await page.getByRole('heading', { name: 'Segunda obra', exact: true, level: 3 }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Obra integrada', exact: true }).count(), 0);
    await page.getByRole('link', { name: 'Visão geral', exact: true }).click();
    await page.waitForURL('**/home');
    await page.getByRole('heading', { name: 'Segunda obra', exact: true, level: 3 }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Obra integrada', exact: true }).count(), 0);
    await page.goto(base + '/funcionarios/7/obras');
    await page.getByText('Nenhum funcionário alocado.', { exact: true }).waitFor();
    assert.equal(state.employees[0].id, 7);
    await page.goto(base + '/obras/2');
    await page.getByRole('button', { name: 'Excluir obra', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir obra', exact: true }).click();
    await page.waitForURL('**/obras');
    await page.getByText('Nenhuma obra cadastrada', { exact: true }).waitFor();
    await page.close();
  }
  const employee = await setup('FUNCIONARIO');
  await employee.page.goto(base + '/obras/1');
  await employee.page.getByRole('heading', { name: 'Dados da obra', exact: true }).waitFor();
  assert.equal(await employee.page.getByRole('button', { name: 'Excluir obra', exact: true }).count(), 0);
  assert.equal(employee.state.writes.length, 0);
  await employee.page.close();

  const expired = await setup();
  const modal = await open(expired.page);
  await expired.page.route('**/api/obras/1', async (route, request) => {
    if (request.method() !== 'DELETE') return route.fallback();
    expired.state.session = false;
    return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Não autenticado."}', headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
  });
  await modal.getByRole('button', { name: 'Excluir obra', exact: true }).click();
  await expired.page.waitForURL('**/login');
  assert.equal(expired.state.works.length, 2);
  await expired.page.close();
  assert.deepEqual(errors, []);
  console.log('PASS: exclusão de obras — permissões, modal/foco/Escape, cancelamento, CSRF, duplicação, falhas, cascata e consistência (HTTP controlado).');
} finally { await browser.close(); }
