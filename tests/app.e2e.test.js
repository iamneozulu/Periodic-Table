import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { resolve } from 'path';

const PORT = 5198;
const BASE = `http://localhost:${PORT}`;
const TIMEOUT = 60000;

let server;
let browser;
let page;

function waitForServer(url, retries = 30) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url).then(() => resolve()).catch(() => {
        if (n <= 0) reject(new Error('Server did not start'));
        else setTimeout(() => attempt(n - 1), 500);
      });
    };
    attempt(retries);
  });
}

beforeAll(async () => {
  server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: resolve(import.meta.dirname, '..'),
    stdio: 'pipe',
  });
  server.stderr.on('data', () => {});

  await waitForServer(BASE);

  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
}, 30000);

afterAll(async () => {
  if (page) await page.close();
  if (browser) await browser.close();
  if (server) server.kill();
}, 10000);

describe('E2E: Periodic Table loads and is operable', () => {
  it('loads, hides the loader, and shows the scene + UI', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });

    const loader = page.locator('#loader');
    await loader.waitFor({ state: 'hidden', timeout: TIMEOUT });
    expect(await loader.isVisible()).toBe(false);

    await page.waitForSelector('canvas', { timeout: 5000 });
    const canvas = page.locator('canvas');
    expect(await canvas.isVisible()).toBe(true);

    const legend = page.locator('#legend');
    await legend.waitFor({ state: 'visible', timeout: 5000 });
    expect(await legend.isVisible()).toBe(true);

    const swatches = page.locator('#legend .swatch');
    expect(await swatches.count()).toBeGreaterThan(0);

    const search = page.locator('#search');
    await search.waitFor({ state: 'visible', timeout: 5000 });
    expect(await search.isVisible()).toBe(true);

    const random = page.locator('#random');
    await random.waitFor({ state: 'visible', timeout: 5000 });
    expect(await random.isVisible()).toBe(true);
  }, TIMEOUT + 10000);

  it('searches for an element, flies to it, and opens/closes the viewer', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForSelector('canvas', { timeout: TIMEOUT });

    const search = page.locator('#search');
    await search.fill('oxygen');

    const results = page.locator('#search-results .result');
    await results.first().waitFor({ state: 'visible', timeout: 5000 });
    expect(await results.first().isVisible()).toBe(true);
    expect((await results.first().textContent()).toLowerCase()).toContain('oxygen');

    await results.first().click();
    expect(await search.inputValue()).toBe('');

    await page.waitForTimeout(900);

    await page.mouse.click(640, 360);

    const overlay = page.locator('.viewer-overlay');
    await overlay.waitFor({ state: 'visible', timeout: 5000 });
    expect(await overlay.isVisible()).toBe(true);

    const close = page.locator('.viewer-close');
    await close.waitFor({ state: 'visible', timeout: 5000 });
    await close.click();

    await overlay.waitFor({ state: 'hidden', timeout: 5000 });
    expect(await overlay.isVisible()).toBe(false);
  }, TIMEOUT + 10000);
});