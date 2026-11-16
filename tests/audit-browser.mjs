import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base = process.env.RIDE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({
    args: process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu'] : [],
  }),
  errors = [],
  checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`${base}?debug=1&test=1&traffic=off&biome=mountain`, {
    waitUntil: 'networkidle',
  });
  await page.keyboard.press('F3');
  await page.locator('#start-button').click();
  await page.evaluate(() => window.__ride.test.player({ s: 1030, speed: 0 }));
  await page.keyboard.press('c');
  await page.keyboard.press('c');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'artifacts/bridge.png' });
  await page.evaluate(() => window.__ride.test.player({ s: 3100, speed: 0 }));
  await page.keyboard.press('c');
  await page.keyboard.press('c');
  await page.waitForTimeout(500);
  const tunnel = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(tunnel.atmosphere.headlight > 50);
  await page.screenshot({ path: 'artifacts/tunnel.png' });
  checks.push('bridge and mountain tunnel render; tunnel headlight activates');
  const cleanup = await page.evaluate(() => window.__ride.test.disposeCheck());
  assert.equal(cleanup.keys, 0);
  assert.equal(cleanup.position, 987);
  assert.equal(cleanup.debugRemoved, true);
  assert.equal(cleanup.geometries, 0);
  assert.equal(cleanup.textures, 0);
  checks.push('dispose releases GPU assets, keyboard handlers and UI handlers');
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true }),
      mobile = await context.newPage();
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(`${base}?debug=1&traffic=off`, { waitUntil: 'networkidle' });
    await mobile.keyboard.press('F3');
    const start = await mobile.locator('#start-button').boundingBox();
    assert.ok(
      start.y >= 0 && start.y + start.height <= viewport.height,
      'start button within mobile viewport',
    );
    await mobile.locator('#open-settings').tap();
    assert.ok(await mobile.locator('#settings').isVisible());
    await mobile.locator('#settings-close').tap();
    await mobile.locator('#start-button').tap();
    assert.ok(await mobile.locator('#touch-controls').isVisible());
    await mobile.screenshot({ path: `artifacts/mobile-${viewport.width}.png` });
    await mobile.locator('#pause-button').tap();
    assert.equal((await mobile.evaluate(() => window.__ride.snapshot())).mode, 'paused');
    await context.close();
  }
  checks.push('portrait and landscape touch layouts, settings and pause');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile(
    'artifacts/audit-results.json',
    JSON.stringify({ checks, errors, cleanup, tunnel: tunnel.stats }, null, 2),
  );
  console.log(`PASS ${checks.length} lifecycle and layout checks`);
} finally {
  await browser.close();
}
