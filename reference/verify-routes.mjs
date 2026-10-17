import { launchBrowser } from './test-browser.mjs';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
try {
  await page.goto(base + '/');
  await page.waitForURL('**/login');
  await page.locator('#password').fill('exemplo');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  assert.equal(await page.locator('#password').getAttribute('type'), 'text');
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  assert.equal(await page.locator('#password').getAttribute('type'), 'password');
  const source = readFileSync('src/auth/MockAuthService.ts', 'utf8');
  await page.locator('#email').fill(source.match(/email: '([^']+)'/)[1]);
  await page.locator('#password').fill(source.match(/password: '([^']+)'/)[1]);
  await page.evaluate(() => { window.__marker = 'same-document'; });
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/home');
  const routes = [
    { label: 'Obras', route: '/obras', empty: 'Nenhuma obra cadastrada', card: /^Obras / },
    { label: 'Funcionários', route: '/funcionarios', empty: 'Nenhum funcionário cadastrado', card: /^Funcionários / },
    { label: 'Docs', route: '/docs', empty: 'Nenhum documento cadastrado', card: /^Documentos / },
    { label: 'EPI', route: '/epi', empty: 'Nenhum EPI cadastrado', card: /^EPIs / },
  ];
  for (const route of routes) {
    await page.getByRole('link', { name: route.label, exact: true }).click();
    await page.waitForURL('**' + route.route);
    assert.equal(await page.evaluate(() => window.__marker), 'same-document');
    assert.equal(await page.getByRole('link', { name: route.label, exact: true }).getAttribute('aria-current'), 'page');
    await page.getByText(route.empty, { exact: true }).waitFor();
    const images = await page.locator('img').evaluateAll(async elements => {
      await Promise.all(elements.map(element => element.decode()));
      return elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height, naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight }));
    });
    assert.ok(images.every(image => image.width === image.naturalWidth && image.height === image.naturalHeight));
    await page.getByRole('link', { name: 'Visão geral', exact: true }).click();
    await page.waitForURL('**/home');
    await page.getByRole('button', { name: route.card }).click();
    await page.waitForURL('**' + route.route);
    await page.goBack();
    await page.waitForURL('**/home');
    await page.goForward();
    await page.waitForURL('**' + route.route);
    await page.goto(base + route.route);
    await page.getByText(route.empty, { exact: true }).waitFor();
    await page.getByRole('link', { name: 'Visão geral', exact: true }).click();
    await page.waitForURL('**/home');
    await page.evaluate(() => { window.__marker = 'same-document'; });
  }
  await page.getByRole('button', { name: 'Perfil de Admin' }).click();
  await page.getByRole('region', { name: 'Informações do perfil' }).waitFor();
  await page.keyboard.press('Escape');
  await page.goto(base + '/login');
  await page.waitForURL('**/home');
  assert.deepEqual(errors, []);
  console.log('PASS: login, password visibility, SPA routes, dynamic empty states, Home cards, active navigation, history, original SVG geometry, profile, no browser errors.');
} finally { await browser.close(); }
