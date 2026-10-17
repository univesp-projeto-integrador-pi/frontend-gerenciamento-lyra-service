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
