import { launchBrowser } from './test-browser.mjs';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const authSource = readFileSync('src/auth/MockAuthService.ts', 'utf8');
const email = authSource.match(/email: '([^']+)'/)[1];
const password = authSource.match(/password: '([^']+)'/)[1];
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
context.setDefaultTimeout(15000);
const errors = [];
context.on('page', other => other.on('pageerror', error => errors.push(error.message)));
page.on('pageerror', error => errors.push(error.message));
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
async function services() { await page.evaluate(async () => { window.__dataServices = await (await import('/src/data/createDataServices.ts')).createDataServices(); }); }
async function createWork(input) { return page.evaluate(async input => window.__dataServices.works.create(input), input); }
const homeList = () => page.locator('section[aria-labelledby="home-works-title"]');
try {
  await page.goto(base + '/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/home');
  console.log('Checking empty collections');
  await homeList().getByText('Nenhuma obra cadastrada').waitFor();
  assert.equal(await homeList().locator('article').count(), 0);
  assert.ok(!/Residencial Aurora|Edifício Horizonte|Galpão Logístico Norte|ASO de João/.test(await page.locator('body').textContent()));
  for (const key of ['works', 'employees', 'documents', 'equipment']) {
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem('cleanpro.' + key)), key), []);
  }
  await page.screenshot({ path: 'reference/home-empty.png', fullPage: true });
  await services();
  console.log('Checking WorkService CRUD and persistence');
  // Synthetic inputs exist only in this isolated browser context, never as app seeds.
  const work = await createWork({ name: 'Obra de validação', location: 'Local de validação', progress: 37.5, workers: 4, manager: 'Responsável de validação', attention: true, active: true });
  assert.match(work.id, /^[0-9a-f-]{36}$/);
  await homeList().getByRole('heading', { name: work.name }).waitFor();
  const progress = homeList().getByRole('progressbar');
  assert.equal(await progress.getAttribute('aria-valuenow'), '37.5');
  assert.equal(await progress.locator('div').evaluate(element => element.style.width), '37.5%');
  assert.equal(await homeList().locator('article').evaluate(element => Math.round(element.getBoundingClientRect().height)), 344);
  assert.ok(!('barWidth' in await page.evaluate(async id => window.__dataServices.works.getById(id), work.id)));
  await page.reload();
  await homeList().getByRole('heading', { name: work.name }).waitFor();
  await services();
  assert.equal((await page.evaluate(async id => window.__dataServices.works.getById(id), work.id)).progress, 37.5);
  const second = await createWork({ name: 'Outra obra de validação', progress: 0 });
  await homeList().getByRole('heading', { name: second.name }).waitFor();
  assert.equal(await homeList().locator('article').count(), 2);
  await page.evaluate(async id => window.__dataServices.works.update(id, { name: 'Obra atualizada', progress: 100, workers: 0 }), work.id);
  await homeList().getByRole('heading', { name: 'Obra atualizada' }).waitFor();
  assert.equal(await homeList().getByRole('progressbar', { name: 'Progresso de Obra atualizada' }).getAttribute('aria-valuenow'), '100');
  assert.equal(await page.evaluate(async id => { try { await window.__dataServices.works.update(id, { progress: -1 }); return false; } catch { return true; } }, work.id), true);
  assert.equal(await page.evaluate(async () => { try { await window.__dataServices.works.create({ name: 'Inválida', progress: 101 }); return false; } catch { return true; } }), true);
  await page.getByRole('link', { name: 'Obras', exact: true }).click();
  await page.waitForURL('**/obras');
  await page.getByRole('heading', { name: 'Obra atualizada' }).waitFor();
  assert.equal(await page.getByRole('heading', { level: 3 }).count(), 2);
  await page.screenshot({ path: 'reference/works-data.png', fullPage: true });
  console.log('Checking cross-tab changes and invalid storage');
  // A second tab mutation propagates via the real storage event.
  const tab = await context.newPage();
  await tab.goto(base + '/login');
  await tab.evaluate(async id => { const services = await (await import('/src/data/createDataServices.ts')).createDataServices(); await services.works.update(id, { name: 'Alterada em outra aba' }); }, work.id);
  await page.getByRole('heading', { name: 'Alterada em outra aba' }).waitFor();
  await tab.close();
  await page.evaluate(async id => window.__dataServices.works.delete(id), second.id);
  await page.waitForFunction(() => document.querySelectorAll('h3').length === 1);
  const stored = await page.evaluate(() => localStorage.getItem('cleanpro.works'));
  await page.evaluate(() => { localStorage.setItem('cleanpro.works', '{invalid'); window.dispatchEvent(new StorageEvent('storage', { key: 'cleanpro.works', storageArea: localStorage })); });
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').textContent(), /Nenhum registro foi apagado/);
  assert.equal(await page.evaluate(() => localStorage.getItem('cleanpro.works')), '{invalid');
  assert.equal(await page.getByRole('heading', { level: 3 }).count(), 0);
  await page.evaluate(stored => localStorage.setItem('cleanpro.works', stored), stored);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByRole('heading', { name: 'Alterada em outra aba' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('cleanpro.works')), stored);
  // Render the retained row models from service data, not hardcoded arrays.
  console.log('Checking dynamic tables');
  await page.evaluate(async () => {
    await window.__dataServices.employees.create({ name: 'Pessoa de validação', role: 'Função informada', work: 'Obra informada', record: 'Registro informado', status: 'Em campo' });
    await window.__dataServices.documents.create({ title: 'Documento de validação', type: 'PGR', collaborator: 'Obra informada', validity: 'Validade informada', owner: 'Responsável informado', status: 'Atenção' });
    await window.__dataServices.equipment.create({ name: 'EPI de validação', ca: '123', employee: 'Pessoa de validação', condition: 'Condição informada', owner: 'Responsável informado', kind: 'helmet', replace: true, stockLow: false });
  });
  for (const [route, name] of [['/funcionarios', 'Pessoa de validação'], ['/docs', 'Documento de validação'], ['/epi', 'EPI de validação']]) {
    await page.goto(base + route);
    await page.getByRole('cell').filter({ hasText: name }).first().waitFor();
    assert.equal(await page.getByRole('row').count(), 2);
  }
  await page.goto(base + '/home');
  await homeList().getByRole('heading', { name: 'Alterada em outra aba' }).waitFor();
  await page.getByRole('heading', { name: 'Documento de validação · Validade informada' }).waitFor();
  // Reopen the page: localStorage survives a page lifecycle, while auth stays separate.
  const session = await page.evaluate(() => sessionStorage.getItem('cleanpro.mock-session'));
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(base + '/login');
  await reopened.evaluate(session => sessionStorage.setItem('cleanpro.mock-session', session), session);
  await reopened.goto(base + '/home');
  await reopened.getByRole('heading', { name: 'Alterada em outra aba', exact: true, level: 3 }).waitFor();
  assert.equal(await reopened.locator('section[aria-labelledby="home-works-title"] article').count(), 1);
  await reopened.close();

  // Injectable service proves loading/error are distinct without using localStorage.
  console.log('Checking injected loading/error states');
  writeFileSync('reference/validation/data-states.html', '<!doctype html><html><body><div id="root"></div><script type="module" src="./data-states.tsx"></script></body></html>');
  writeFileSync('reference/validation/data-states.tsx', `import React from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom'; import { DataProvider } from '/src/data/DataContext'; import { HomeWorkList } from '/src/components/home/HomeWorkList'; import '/src/styles.css';
const empty = { getAll: async () => [], getById: async () => undefined, create: async () => {}, update: async () => {}, delete: async () => {} };
const works = { ...empty, getAll: () => new Promise((resolve, reject) => { window.__resolveWorks = resolve; window.__rejectWorks = reject; }) };
createRoot(document.getElementById('root')!).render(<BrowserRouter><DataProvider services={{ works, employees: empty, documents: empty, equipment: empty }}><HomeWorkList /></DataProvider></BrowserRouter>);`);
  const states = await context.newPage();
  await states.goto(base + '/reference/validation/data-states.html');
  await states.getByText('Carregando registros…').waitFor();
  await states.evaluate(() => window.__rejectWorks(new Error('Falha de consulta controlada')));
  await states.getByRole('alert').waitFor();
  await states.getByRole('button', { name: 'Tentar novamente' }).click();
  await states.getByText('Carregando registros…').waitFor();
  await states.evaluate(() => window.__resolveWorks([]));
  await states.getByText('Nenhuma obra cadastrada').waitFor();
  assert.deepEqual(errors, []);
  for (const file of readdirSync('dist/assets').filter(file => file.endsWith('.js'))) {
    assert.ok(!readFileSync('dist/assets/' + file, 'utf8').includes('cleanpro.works'), 'Production must exclude the local mock implementation');
  }
  console.log('PASS: empty collections, no demo records, typed service CRUD, UUIDs, dynamic WorkCard height/progress, reload and reopen persistence, same-tab and cross-tab updates, invalid data preserved, retry, dynamic tables/alerts, injected loading/error states, production excludes local mock.');
} finally { await browser.close(); }
