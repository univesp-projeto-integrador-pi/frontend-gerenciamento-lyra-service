import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from './validation/node_modules/playwright/index.mjs';

export async function launchBrowser() {
  await mkdir('reference/validation', { recursive: true });
  const configured = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const executablePath = configured || (process.platform === 'win32' && existsSync(edge) ? edge : undefined);
  return chromium.launch({ executablePath, headless: true });
}

export function mockCredentials() {
  const email = process.env.VITE_MOCK_EMAIL?.trim().toLowerCase();
  const password = process.env.VITE_MOCK_PASSWORD;
  if (!email?.endsWith('.test') || !password) {
    throw new Error('Set the same synthetic VITE_MOCK_EMAIL and VITE_MOCK_PASSWORD for Vite and this test.');
  }
  return { email, password };
}
