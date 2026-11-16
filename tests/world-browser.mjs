import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  args: process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu'] : [],
});
const results = [],
  errors = [];
await mkdir('artifacts', { recursive: true });
try {
  for (const biome of ['forest', 'coastal', 'mountain', 'highland']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.goto(`http://127.0.0.1:4173/?biome=${biome}&debug=1`, { waitUntil: 'networkidle' });
    await page.keyboard.press('F3');
    await page.locator('#start-button').click();
    await page.keyboard.press('c');
    await page.keyboard.press('c');
    await page.waitForTimeout(1000);
    const snap = await page.evaluate(() => window.__ride.snapshot());
    assert.ok(snap.stats.drawCalls > 0);
    assert.ok(await page.locator('#error').isHidden());
    await page.screenshot({ path: `artifacts/biome-${biome}.png` });
    results.push({ biome, stats: snap.stats });
    await page.close();
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile('artifacts/world-results.json', JSON.stringify({ results, errors }, null, 2));
  console.log('PASS four biome renders, no browser errors');
} finally {
  await browser.close();
}
