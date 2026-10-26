import { launchBrowser } from './test-browser.mjs';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const source = readFileSync('src/auth/MockAuthService.ts', 'utf8');
const email = source.match(/email: '([^']+)'/)[1];
const password = source.match(/password: '([^']+)'/)[1];
const name = source.match(/name: '([^']+)'/)[1];
const mockId = source.match(/id: '([^']+)'/)[1];
const key = readFileSync('src/auth/mockSession.ts', 'utf8').match(/MOCK_SESSION_KEY = '([^']+)'/)[1];
for (const file of readdirSync('dist/assets').filter(file => file.endsWith('.js'))) {
  const bundle = readFileSync('dist/assets/' + file, 'utf8');
  assert.ok(!bundle.includes(mockId) && !bundle.includes(password), 'Production must exclude the mock account implementation and password; the visual profile may display the email');
}
writeFileSync('reference/validation/auth-harness.html', '<!doctype html><html><body><div id="root"></div><script type="module" src="./auth-harness.tsx"></script></body></html>');
writeFileSync('reference/validation/auth-harness.tsx', `import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '/src/auth/AuthContext';
import { DataProvider } from '/src/data/DataContext';
import App from '/src/App';
import '/src/styles.css';
history.replaceState({}, '', '/home');
function Probe() { const auth = useAuth(); useEffect(() => { window.__logout = auth.logout; }, [auth.logout]); return null; }
createRoot(document.getElementById('root')!).render(<AuthProvider><DataProvider><App /><Probe /></DataProvider></AuthProvider>);`);
const browser = await launchBrowser();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
async function fillLogin() {
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
}
try {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
  for (const route of ['/home', '/obras', '/funcionarios', '/docs', '/epi']) {
    await page.goto(base + route);
    await page.waitForURL('**/login');
  }
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('incorreta');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').textContent(), /E-mail ou senha incorretos/);
  assert.equal(await page.evaluate(key => sessionStorage.getItem(key), key), null);
  await fillLogin();
  await page.locator('#password').press('Enter');
  await page.getByRole('button', { name: 'Entrando…' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Entrando…' }).isDisabled(), true);
  await page.waitForURL('**/home');
  const saved = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key);
  assert.equal(saved.email, email);
  assert.equal(saved.name, name);
  assert.equal(Object.hasOwn(saved, 'password'), false);
  assert.equal(JSON.stringify(saved).includes(password), false);
  await page.reload();
  await page.getByRole('heading', { name: 'Visão geral', exact: true }).waitFor();
  await page.goto(base + '/login');
  await page.waitForURL('**/home');
  await page.goto(base + '/reference/validation/auth-harness.html');
  await page.getByRole('heading', { name: 'Visão geral', exact: true }).waitFor();
  await page.waitForFunction(() => typeof window.__logout === 'function');
  await page.evaluate(() => window.__logout());
  await page.waitForURL('**/login');
  assert.equal(await page.evaluate(key => sessionStorage.getItem(key), key), null);
  await page.goto(base + '/epi');
  await page.waitForURL('**/login');
  await page.evaluate(key => sessionStorage.setItem(key, '{invalid'), key);
  await page.goto(base + '/home');
  await page.waitForURL('**/login');
  assert.equal(await page.evaluate(key => sessionStorage.getItem(key), key), null);
  await page.evaluate(key => sessionStorage.setItem(key, JSON.stringify({ id: 'intruder', email: 'invalid', name: 'invalid' })), key);
  await page.goto(base + '/home');
  await page.waitForURL('**/login');
  assert.equal(await page.evaluate(key => sessionStorage.getItem(key), key), null);
  for (const url of [process.env.TEST_DISABLED_URL || 'http://127.0.0.1:5174', process.env.TEST_PRODUCTION_URL || 'http://127.0.0.1:5175']) {
    await page.goto(url + '/home');
    await page.waitForURL('**/login');
    await page.evaluate(({ key, saved }) => sessionStorage.setItem(key, JSON.stringify(saved)), { key, saved });
    await page.reload();
    await page.getByRole('heading', { name: 'Acesse sua conta' }).waitFor();
    assert.equal(await page.evaluate(key => sessionStorage.getItem(key), key), null);
    await fillLogin();
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.match(await page.getByRole('alert').textContent(), /indisponível/);
    assert.equal(await page.evaluate(key => sessionStorage.getItem(key), key), null);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: valid/invalid login, Enter and loading, all protected routes, restored session, guest redirect, context logout, malformed sessions, mock disabled, production blocked, no password persisted, no browser errors.');
} finally { await browser.close(); }
