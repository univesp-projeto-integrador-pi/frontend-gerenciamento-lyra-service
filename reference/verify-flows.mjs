import assert from 'node:assert/strict';
import { launchBrowser, mockCredentials } from './test-browser.mjs';
const browser = await launchBrowser();
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const page = await browser.newPage({ viewport: { width: 1440, height: 1112 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(15000);
const field = name => page.getByLabel(new RegExp('^' + name));
async function address() { for (const [name, value] of [['CEP', '05422-001'], ['Logradouro', 'Rua de validação'], ['Número', '10'], ['Bairro', 'Centro'], ['Cidade / UF', 'São Paulo / SP']]) await field(name).fill(value); }
async function next() { await page.getByRole('button', { name: 'Próximo', exact: true }).click(); }
try {
  const { email, password } = mockCredentials();
  await page.goto(base); await page.locator('#email').fill(email); await page.locator('#password').fill(password); await page.getByRole('button', { name: 'Entrar', exact: true }).click(); await page.waitForURL('**/home');
  for (const [path, title] of [['/obras/nova', 'Adicionar obra'], ['/funcionarios/novo', 'Adicionar funcionário'], ['/docs/novo', 'Adicionar documento'], ['/alocacoes/nova', 'Alocar funcionário em obra'], ['/obras/inativas', 'Obras inativas'], ['/funcionarios/inativos', 'Funcionários inativos'], ['/configuracoes/perfil', 'Meu perfil'], ['/configuracoes/historico', 'Histórico de alterações']]) { await page.goto(base + path); await page.getByRole('heading', { name: title, exact: true }).waitFor(); }
  await page.goto(base + '/obras/nova');
  for (const [name, value] of [['Nome da obra', 'Obra de validação'], ['Apelido', 'Validação'], ['CBO', 'TEST-01'], ['Empresa responsável', 'Empresa de validação']]) await field(name).fill(value);
  await field('Início da obra').fill('2026-01-01'); await field('Previsão de término').fill('2027-01-01');
  await page.screenshot({ path: 'reference/validation/flow-work-step1.png', fullPage: true }); await next(); await address();
  for (const [name, value] of [['Engenheiro responsável', 'Responsável de teste'], ['Contato do engenheiro', '11999999999'], ['Administrativo responsável', 'Admin de teste'], ['Contato do administrativo', '11888888888']]) await field(name).fill(value);
  await page.getByRole('button', { name: 'Salvar obra', exact: true }).click(); await page.waitForURL(/\/obras\/[^/]+$/); const workId = page.url().split('/').at(-1);
  await page.getByRole('heading', { name: 'Obra de validação', exact: true }).waitFor();
  await page.goto(base + '/funcionarios/novo');
  await field('Nome completo').fill('Pessoa de validação'); await field('CPF').fill('529.982.247-25'); await field('Data de nascimento').fill('1993-08-22'); await field('Celular').fill('11999999999'); await address();
  await page.screenshot({ path: 'reference/validation/flow-employee-step1.png', fullPage: true }); await next();
  await field('Data de admissão').fill('2026-01-01'); await field('Código de registro').fill('TEST-01'); await field('Cargo').fill('Auxiliar'); await field('Horário de trabalho').fill('08:00 às 17:00');
  await page.screenshot({ path: 'reference/validation/flow-employee-step2.png', fullPage: true }); await next();
  await page.getByRole('checkbox', { name: 'Obra de validação', exact: true }).check();
  await page.screenshot({ path: 'reference/validation/flow-employee-step3.png', fullPage: true });
  await page.getByRole('button', { name: 'Salvar funcionário', exact: true }).click(); await page.waitForURL(/\/funcionarios\/[^/]+$/); const employeeId = page.url().split('/').at(-1);
  await page.getByRole('heading', { name: 'Pessoa de validação', exact: true }).waitFor();
  await page.screenshot({ path: 'reference/validation/flow-employee-details.png', fullPage: true });
  await page.getByRole('link', { name: 'Obras', exact: true }).last().click(); await page.getByRole('link', { name: 'Obra de validação', exact: true }).waitFor();
  await page.goto(base + `/docs/novo?funcionario=${employeeId}`); await field('Tipo de documento').selectOption('Ficha de EPI'); await field('Data de emissão').fill('2026-10-28'); await page.getByRole('checkbox', { name: 'Obra de validação', exact: true }).check(); await next();
  await page.getByRole('button', { name: 'Salvar documento', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'Anexe um arquivo' }).waitFor();
  await field('Selecionar arquivo').setInputFiles({ name: 'validacao.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await page.screenshot({ path: 'reference/validation/flow-document-file.png', fullPage: true });
  await page.getByRole('button', { name: 'Salvar documento', exact: true }).click(); await page.waitForURL(`**/funcionarios/${employeeId}/documentos`); await page.getByRole('button', { name: 'Ficha de EPI', exact: true }).waitFor();
  await page.goto(base + '/configuracoes/historico'); await page.screenshot({ path: 'reference/validation/flow-audit.png', fullPage: true }); await page.getByRole('button', { name: /ver detalhe/ }).first().click(); await page.getByRole('heading', { name: /Detalhe do evento/ }).waitFor();
  await page.goto(base + '/configuracoes/perfil'); await page.screenshot({ path: 'reference/validation/flow-profile.png', fullPage: true }); const toggle = page.getByRole('switch', { name: 'Resumo semanal' }); await toggle.click(); await page.getByRole('button', { name: 'Salvar alterações' }).click(); await page.getByRole('status').filter({ hasText: 'Preferências salvas' }).waitFor(); await page.reload(); await assert.equal(await toggle.getAttribute('aria-checked'), 'true');
  await page.goto(base + `/funcionarios/${employeeId}`); await page.getByRole('heading', { name: 'Pessoa de validação', exact: true }).waitFor();
  assert.ok(await page.getByText('Não informado', { exact: true }).count());
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage })); assert.ok(!storage.includes('529.982.247-25')); assert.ok(!storage.includes('%PDF')); assert.ok(!storage.includes('11999999999'));
  const records = await page.evaluate(async () => { const { createDataServices } = await import('/src/data/createDataServices.ts'); const s = await createDataServices(); return { employees: await s.employees.getAll(), works: await s.works.getAll(), allocations: await s.allocations.getAll(), documents: await s.documents.getAll() }; });
  assert.equal(records.employees.length, 1); assert.equal(records.works.length, 1); assert.equal(records.allocations.length, 1); assert.equal(records.allocations[0].workId, workId); assert.equal(records.documents.length, 1); assert.equal(records.documents[0].expiryDate, '2027-01-28');
  await page.goto(base + `/obras/${workId}/editar`); await field('Nome da obra').fill('Obra atualizada'); await next(); await field('Contato do engenheiro').fill('11999999999'); await field('Contato do administrativo').fill('11888888888'); await page.getByRole('button', { name: 'Salvar obra', exact: true }).click(); await page.getByRole('heading', { name: 'Obra atualizada', exact: true }).waitFor();
  await page.goto(base + '/obras'); await field('Buscar obra ou endereço').fill('inexistente'); await page.getByText('Nenhuma obra encontrada', { exact: true }).waitFor();
  await page.goto(base + `/obras/${workId}/editar`); await field('Status').selectOption('INTERROMPIDA'); await next(); await field('Contato do engenheiro').fill('11999999999'); await field('Contato do administrativo').fill('11888888888'); await field('Data de encerramento').fill('2026-10-28'); await field('Justificativa').fill('Interrupção de validação'); await page.getByRole('button', { name: 'Salvar obra', exact: true }).click(); await page.waitForURL(`**/obras/${workId}`);
  await page.goto(base + '/obras/inativas'); await page.getByRole('heading', { name: 'Obra atualizada', exact: true }).waitFor(); await page.getByText('Interrupção de validação', { exact: true }).waitFor(); await page.screenshot({ path: 'reference/validation/flow-inactive-works.png', fullPage: true });
  await page.goto(base + `/funcionarios/${employeeId}/editar`); await field('CPF').fill('529.982.247-25'); await field('Data de nascimento').fill('1993-08-22'); await field('Celular').fill('11999999999'); await address(); await next(); await field('Situação').selectOption('inactive'); await field('Data de demissão').fill('2026-10-28'); await next(); await page.getByRole('button', { name: 'Salvar funcionário', exact: true }).click(); await page.waitForURL(`**/funcionarios/${employeeId}`);
  await page.goto(base + '/funcionarios/inativos'); await page.getByRole('button', { name: 'Ver histórico', exact: true }).click(); await page.getByRole('heading', { name: 'Pessoa de validação · histórico do desligamento', exact: true }).waitFor(); await page.getByText('1 documentos preservados', { exact: true }).waitFor(); await page.screenshot({ path: 'reference/validation/flow-inactive-employees.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: all new routes, work/employee multi-step creation and work editing, allocation preservation, document validation/file selection/validity/linking, audit event detail, profile preferences persistence, empty search, reload persistence, sensitive fields excluded from storage, no browser errors. Fixtures exist only in this isolated browser context.');
} finally { await browser.close(); }
