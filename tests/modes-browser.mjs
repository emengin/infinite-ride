import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base = process.env.RIDE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({
  args: process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu'] : [],
});
const errors = [],
  checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`${base}?debug=1&test=1&traffic=off`, {
    waitUntil: 'networkidle',
  });
  await page.keyboard.press('F3');
  await page.locator('[data-mode-choice="free"]').click();
  await page.locator('#start-button').click();
  const free = await page.evaluate(() => window.__ride.test.drive(60));
  assert.equal(free.mode, 'running');
  assert.ok(free.physics.distance > 1500);
  checks.push('free ride drives >1.5 km without forced ending');
  await page.keyboard.press('Escape');
  await page.locator('#end-ride').click();
  assert.ok(await page.locator('#results').isVisible());
  await page.locator('#result-menu').click();
  await page.locator('[data-mode-choice="rush"]').click();
  await page.locator('#start-button').click();
  await page.evaluate(() => {
    window.__ride.test.player({ s: 100, d: 3.8, speed: 45 });
    window.__ride.test.traffic([{ s: 108, speed: 0 }]);
    window.__ride.test.advance(0.8);
  });
  const scored = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(scored.session.score > 250);
  assert.ok(await page.locator('#score-panel').isVisible());
  checks.push('rush rewards overtaking and close pass');
  await page.evaluate(() => {
    window.__ride.test.player({ s: 200, d: 2.3, speed: 40 });
    window.__ride.test.traffic([{ s: 205, speed: 0 }]);
    window.__ride.test.advance(0.3);
  });
  assert.equal((await page.evaluate(() => window.__ride.snapshot())).mode, 'results');
  assert.ok(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('infinite-ride:records')).rush.score > 250,
    ),
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'artifacts/rush-results.png' });
  checks.push('rush collision ends run and persists record');
  await page.locator('#result-menu').click();
  await page.locator('[data-mode-choice="race"]').click();
  await page.locator('#start-button').click();
  assert.equal((await page.evaluate(() => window.__ride.snapshot())).mode, 'countdown');
  await page.keyboard.down('w');
  await page.waitForTimeout(3200);
  await page.keyboard.up('w');
  assert.equal((await page.evaluate(() => window.__ride.snapshot())).mode, 'running');
  checks.push('race countdown and held throttle transition');
  const grid = await page.evaluate(() => window.__ride.test.drive(20));
  assert.equal(grid.mode, 'running');
  assert.equal(grid.race.rivals.length, 3);
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'artifacts/race-riding.png' });
  const finished = await page.evaluate(() => window.__ride.test.drive(140));
  assert.equal(finished.mode, 'results', JSON.stringify(finished));
  assert.equal(finished.race.checkpoint, 3);
  assert.equal(finished.race.finished, true);
  assert.ok(finished.result.position >= 1 && finished.result.position <= 4);
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'artifacts/race-results.png' });
  checks.push('full 3 km race reaches all checkpoints and real finish');
  await page.locator('#result-retry').click();
  const retry = await page.evaluate(() => window.__ride.snapshot());
  assert.equal(retry.mode, 'countdown');
  assert.equal(retry.race.checkpoint, 0);
  assert.equal(retry.physics.distance, 0);
  checks.push('race restart resets countdown, progress and riders');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile(
    'artifacts/modes-results.json',
    JSON.stringify({ checks, errors, free, scored, finished }, null, 2),
  );
  console.log(`PASS ${checks.length} mode browser checks`);
} finally {
  await browser.close();
}
