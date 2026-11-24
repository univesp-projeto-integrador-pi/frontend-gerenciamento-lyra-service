import assert from 'node:assert/strict';
import { browser, base, errors, setup } from './api-crud-fixture.mjs';

try {
  const { page, state } = await setup();
  await page.goto(base + '/home'); const cards = page.locator('section[aria-labelledby="home-works-title"]');
  await cards.getByRole('heading', { name: 'Obra integrada' }).waitFor();
  await cards.getByText('1 alocados', { exact: true }).waitFor(); assert.match(await page.getByRole('button', { name: /^Funcionários / }).innerText(), /— em campo/); assert.equal(await cards.getByText('1 em campo', { exact: true }).count(), 0);
  await page.goto(base + '/funcionarios/7'); await page.getByText('R$ 9.999.999.999,99', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Editar funcionário', exact: true }).click(); await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByLabel('Salário (opcional)').fill('1234567890,12'); await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar funcionário', exact: true }).click(); await page.waitForURL('**/funcionarios/7');
  assert.equal(state.writes.find(w => w.path === '/api/funcionarios/7' && w.method === 'PUT').body.salario, '1234567890.12');
  await page.getByRole('navigation', { name: 'Detalhes do funcionário' }).getByRole('link', { name: 'Obras', exact: true }).click();
  await page.getByRole('button', { name: 'Editar vínculo', exact: true }).click(); await page.getByRole('combobox', { name: 'Obra do vínculo de Pessoa integrada' }).selectOption('2'); await page.getByRole('button', { name: 'Salvar vínculo', exact: true }).click();
  await page.getByRole('link', { name: 'Segunda obra', exact: true }).waitFor(); assert.equal(state.allocations[0].obraId, 2);
  await page.getByRole('button', { name: 'Excluir vínculo', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click(); assert.equal(state.allocations.length, 1);
  await page.getByRole('button', { name: 'Excluir vínculo', exact: true }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir permanentemente', exact: true }).click();
  await page.getByText('Nenhum funcionário alocado.', { exact: true }).waitFor(); assert.equal(state.allocations.length, 0);
  await page.goto(base + '/alocacoes/nova?obra=1&funcionario=7'); await page.getByRole('button', { name: 'Salvar alocação', exact: true }).click(); await page.waitForURL('**/funcionarios/7/obras'); await page.getByRole('link', { name: 'Obra integrada', exact: true }).waitFor();
  await page.goto(base + '/obras/nova'); await page.getByLabel(/^Nome da obra/).fill('Obra nova sem datas'); await page.getByRole('button', { name: 'Próximo', exact: true }).click(); await page.getByLabel('Endereço da obra').fill('Rua efetivamente persistida');
  await page.getByRole('button', { name: 'Salvar obra', exact: true }).click(); await page.waitForURL('**/obras/3');
  assert.equal(state.works.at(-1).endereco, 'Rua efetivamente persistida'); assert.equal(state.works.at(-1).dataInicio, null);
  await page.getByRole('button', { name: 'Excluir obra', exact: true }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir obra', exact: true }).click(); await page.waitForURL('**/obras'); assert.equal(state.works.length, 2);
  await page.goto(base + '/funcionarios/novo'); await page.getByLabel(/^Nome completo/).fill('Outro funcionário'); await page.getByLabel(/^E-mail/).fill('outro@example.test'); await page.getByRole('button', { name: 'Próximo', exact: true }).click(); await page.getByLabel(/^Cargo/).fill('Técnico'); await page.getByRole('button', { name: 'Próximo', exact: true }).click(); await page.getByRole('button', { name: 'Salvar funcionário', exact: true }).click(); await page.waitForURL('**/funcionarios/8');
  await page.getByRole('button', { name: 'Excluir funcionário', exact: true }).click(); await page.getByRole('alertdialog').getByText(/não pode ser desfeita/).waitFor(); await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir permanentemente', exact: true }).click(); await page.waitForURL('**/funcionarios'); assert.equal(state.employees.length, 1);
  await page.goto(base + '/home'); state.failWorks = true; await page.goto(base + '/obras'); await page.getByRole('alert').filter({ hasText: 'Não foi possível concluir' }).waitFor(); assert.equal(await page.getByText('Nenhuma obra cadastrada', { exact: true }).count(), 0); state.failWorks = false;
  await page.goto(base + '/docs'); await page.getByRole('alert').filter({ hasText: 'não possui endpoints' }).waitFor(); assert.ok(await page.getByRole('button', { name: 'Adicionar documento', exact: true }).isDisabled());
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage })); assert.ok(!storage.includes('1234567890.12') && !storage.includes('Obra integrada'));
  await page.goto(base + '/funcionarios/7'); await page.getByText('R$ 1.234.567.890,12', { exact: true }).waitFor();
  state.role = 'GESTOR'; await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.getByRole('button', { name: 'Perfil de gestor@example.test' }).waitFor(); await page.waitForLoadState('networkidle');
  assert.equal(await page.getByText('R$ 1.234.567.890,12', { exact: true }).count(), 0);
  state.uid = 2; state.role = 'FUNCIONARIO'; state.employeeId = null;
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.waitForURL('**/home');
  await page.getByRole('button', { name: 'Perfil de funcionario@example.test' }).waitFor(); await page.waitForLoadState('networkidle');
  assert.ok(!(await page.locator('main').innerText()).includes('Pessoa integrada'));
  assert.equal(await page.getByText('R$ 1.234.567.890,12', { exact: true }).count(), 0);
  await page.goto(base + '/obras'); await page.getByText('Nenhuma obra cadastrada', { exact: true }).waitFor();
  const inspection = page.locator('section[aria-label="Resumo das obras"] article').filter({ hasText: 'Vistoria hoje' });
  assert.equal(await inspection.locator('p').first().innerText(), '—');
  await page.close();
  for (const role of ['GESTOR', 'FUNCIONARIO']) {
    const { page: scoped, state: scopedState } = await setup(role); await scoped.goto(base + '/funcionarios/7'); await scoped.getByRole('heading', { name: 'Pessoa integrada', exact: true }).waitFor(); await scoped.waitForLoadState('networkidle');
    assert.equal(scopedState.reads.filter(path => path === '/api/auditoria').length, 0);
    assert.equal(await scoped.getByRole('link', { name: 'Editar funcionário', exact: true }).count(), 0);
    if (role === 'GESTOR') assert.equal(await scoped.getByText('R$ 9.999.999.999,99', { exact: true }).count(), 0);
    else { assert.equal(scopedState.reads.filter(path => path === '/api/funcionarios').length, 0); await scoped.goto(base + '/home'); await scoped.locator('section[aria-labelledby="home-works-title"]').getByRole('heading', { name: 'Obra integrada', exact: true }).waitFor(); assert.equal(await scoped.getByText('1 alocados', { exact: true }).count(), 0); }
    await scoped.close();
  }
  assert.deepEqual(errors, []); console.log('PASS: stateful API CRUD works/employees/allocations, optional dates and persisted address, exact salary precision/role privacy, physical delete confirmation and cancel, cross-module updates, unavailable documents, errors distinct from empty, no API records in localStorage, scoped reads without forbidden queries. HTTP fixtures only.');
} catch (error) { const page = browser.contexts().flatMap(c => c.pages()).at(-1); if (page) console.log('DIAGNOSTIC', page.url(), (await page.locator('main').innerText()).slice(0, 3500)); throw error; } finally { await browser.close(); }