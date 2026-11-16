import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
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
  await page.goto('http://127.0.0.1:4173/?debug=1&test=1', { waitUntil: 'networkidle' });
  await page.keyboard.press('F3');
  await page.locator('#start-button').click();
  const initial = await page.evaluate(() => window.__ride.snapshot());
  assert.equal(initial.traffic.length, 24);
  checks.push('24 live pooled traffic vehicles');
  await page.evaluate(() => {
    window.__ride.test.player({ s: 24, speed: 20 });
    window.__ride.test.traffic(
      Array.from({ length: 7 }, (_, type) => ({
        type,
        s: 48 + type * 17,
        dir: type % 2 ? -1 : 1,
        speed: 10 + type,
      })),
    );
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'artifacts/traffic-models.png' });
  checks.push('seven rendered vehicle types');
  await page.evaluate(() => {
    window.__ride.test.player({ s: 100, d: 2.3, speed: 50 });
    window.__ride.test.traffic([{ s: 108, speed: 0 }]);
    window.__ride.test.advance(0.4);
  });
  assert.equal((await page.evaluate(() => window.__ride.snapshot())).mode, 'crashed');
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'artifacts/collision.png' });
  checks.push('player collision triggers visible crash');
  await page.locator('#crash-recover').click();
  assert.equal((await page.evaluate(() => window.__ride.snapshot())).mode, 'running');
  checks.push('crash recovery returns to play');
  const near = await page.evaluate(() => {
    window.__ride.test.player({ s: 100, d: 3.8, speed: 45 });
    window.__ride.test.traffic([{ s: 108, speed: 0 }]);
    return window.__ride.test.advance(0.7);
  });
  assert.equal(near.mode, 'running');
  assert.ok(near.rideStats.near >= 1);
  checks.push('geometric close pass without collision');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile(
    'artifacts/traffic-results.json',
    JSON.stringify({ checks, errors, initial: initial.stats, near }, null, 2),
  );
  console.log(`PASS ${checks.length} traffic browser checks`);
} finally {
  await browser.close();
}
