import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.RIDE_URL || 'http://127.0.0.1:4173/';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  args: process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu'] : [],
});
const checks = [],
  errors = [],
  layouts = [];
const attach = (page) => {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
};
async function inside(page, selector) {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  assert.ok(
    box &&
      box.x >= -1 &&
      box.y >= -1 &&
      box.x + box.width <= viewport.width + 1 &&
      box.y + box.height <= viewport.height + 1,
    `${selector} stays inside ${viewport.width}x${viewport.height}: ${JSON.stringify(box)}`,
  );
}
async function capture(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `artifacts/ui-${name}.png` });
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  attach(page);
  await page.goto(`${base}?debug=1&test=1&traffic=off`, { waitUntil: 'networkidle' });
  await page.keyboard.press('F3');
  await capture(page, 'desktop-menu');
  for (const selector of ['.menu-rail', '.launch-dock', '#start-button', '.mode-brief'])
    await inside(page, selector);
  await page.keyboard.press('ArrowDown');
  assert.equal(
    await page.locator('[data-mode-choice="rush"]').getAttribute('aria-pressed'),
    'true',
  );
  assert.equal(await page.locator('#menu-mode-name').textContent(), 'TRAFFIC RUSH');
  await page.keyboard.press('ArrowDown');
  assert.equal(
    await page.locator('[data-mode-choice="race"]').getAttribute('aria-pressed'),
    'true',
  );
  await page.locator('[data-mode-choice="free"]').click();
  await page.locator('#biome-select').selectOption('coastal');
  assert.equal(await page.locator('#menu-route-name').textContent(), 'SAHİL YOLU');
  await page.locator('#open-settings').click();
  await page.locator('#settings-form [type="submit"]').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'settings-close');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.type), 'submit');
  await page.locator('#settings-close').focus();
  await capture(page, 'desktop-settings');
  await inside(page, '.settings-panel');
  await page.locator('#settings-close').click();
  await page.locator('#how-to-play').click();
  await capture(page, 'desktop-controls');
  await page.keyboard.press('Escape');
  await page.locator('#start-button').focus();
  await page.keyboard.press('Enter');
  assert.equal((await page.evaluate(() => window.__ride.snapshot())).mode, 'running');
  checks.push('keyboard mode selection, route feedback, help, settings and Enter start');

  for (const s of [24, 260, 600, 1100, 2500]) {
    const outcome = await page.evaluate((s) => {
      window.__ride.test.player({ s, speed: 20 });
      const before = window.__ride.snapshot();
      const after = window.__ride.test.advance(0.7, { throttle: 0.5, steer: 0 });
      return { before, after };
    }, s);
    assert.ok(Math.abs(outcome.after.pose.heading - outcome.before.pose.heading) < 1e-10);
    assert.equal(outcome.after.physics.yawRate, 0);
    assert.equal(outcome.after.physics.lean, 0);
  }
  checks.push('no automatic steering or lean at five different road curvatures');
  await page.evaluate(() => window.__ride.test.player({ s: 24, speed: 18 }));
  await page.keyboard.down('d');
  await page.waitForTimeout(170);
  await page.keyboard.up('d');
  const turning = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(turning.physics.yawRate > 0 && turning.physics.lean < 0);
  await page.waitForTimeout(1900);
  const settled = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(settled.physics.yawRate >= 0 && settled.physics.yawRate < 0.00001);
  await page.waitForTimeout(250);
  const still = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(Math.abs(still.pose.heading - settled.pose.heading) < 0.00001);
  checks.push('real keyboard steering releases smoothly without automatic countersteering');
  await page.keyboard.press('r');
  await capture(page, 'desktop-hud');
  await page.keyboard.press('Escape');
  await capture(page, 'desktop-pause');
  await inside(page, '.pause-panel');
  assert.ok(!(await page.locator('#pause-max').textContent()).includes('NaN'));
  await page.locator('#end-ride').click();
  assert.ok(await page.locator('#pause-button').isHidden());
  await capture(page, 'desktop-results');
  await page.locator('#result-menu').click();
  if (await page.locator('#fullscreen-button').isVisible()) {
    await page.locator('#fullscreen-button').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    assert.ok(await page.evaluate(() => !!document.fullscreenElement));
    await page.locator('#fullscreen-button').click();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.ok(await page.evaluate(() => !document.fullscreenElement));
    checks.push('fullscreen toggle enters and exits');
  }
  checks.push('HUD, pause telemetry and result actions remain functional');

  for (const size of [
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1024, height: 600 },
    { width: 390, height: 844 },
    { width: 360, height: 740 },
    { width: 844, height: 390 },
  ]) {
    const context = await browser.newContext({
      viewport: size,
      isMobile: size.width < 1000,
      hasTouch: size.width < 1000,
    });
    const mobile = await context.newPage();
    attach(mobile);
    await mobile.goto(`${base}?debug=1&traffic=off`, { waitUntil: 'networkidle' });
    await mobile.keyboard.press('F3');
    for (const selector of ['.menu-rail', '.launch-dock', '#start-button'])
      await inside(mobile, selector);
    for (const mode of ['rush', 'race', 'free']) {
      await mobile.locator(`[data-mode-choice="${mode}"]`).click();
      assert.equal(
        await mobile.locator(`[data-mode-choice="${mode}"]`).getAttribute('aria-pressed'),
        'true',
      );
    }
    await capture(mobile, `${size.width}-menu`);
    await mobile.locator('#open-settings').click();
    await inside(mobile, '.settings-panel');
    await capture(mobile, `${size.width}-settings`);
    await mobile.locator('#settings-form [name="volume"]').scrollIntoViewIfNeeded();
    await mobile.locator('#settings-form [name="volume"]').fill('.25');
    await mobile.locator('#settings-form [type="submit"]').click();
    await mobile.locator('#start-button').click();
    await capture(mobile, `${size.width}-hud`);
    await inside(mobile, '.speedometer');
    if (size.width < 1000) {
      for (const selector of [
        '[data-control="throttle"]',
        '[data-control="left"]',
        '#touch-camera',
      ])
        await inside(mobile, selector);
      const buttons = await mobile.locator('#touch-controls button').evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, right: box.right, bottom: box.bottom };
        }),
      );
      for (let a = 0; a < buttons.length; a++)
        for (let b = a + 1; b < buttons.length; b++) {
          const x = buttons[a],
            y = buttons[b];
          assert.ok(
            x.right <= y.x || y.right <= x.x || x.bottom <= y.y || y.bottom <= x.y,
            'touch buttons never overlap',
          );
        }
    }
    await mobile.locator('#pause-button').click();
    await capture(mobile, `${size.width}-pause`);
    await inside(mobile, '#resume-button');
    await inside(mobile, '#end-ride');
    await mobile.locator('#end-ride').click();
    await capture(mobile, `${size.width}-results`);
    await inside(mobile, '#result-retry');
    await inside(mobile, '#result-menu');
    await mobile.locator('#result-menu').click();
    assert.ok(await mobile.locator('#intro').isVisible());
    layouts.push(`${size.width}x${size.height}`);
    await context.close();
  }
  checks.push(
    'six desktop/portrait/landscape layouts: clickable modes, settings, visible HUD and controls',
  );
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/interface-results.json',
    JSON.stringify({ checks, layouts, errors }, null, 2),
  );
  console.log(`PASS ${checks.length} interface and manual steering checks`);
} finally {
  await browser.close();
}
