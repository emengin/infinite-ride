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
  await page.goto(`${base}?debug=1&test=1&traffic=off`, {
    waitUntil: 'networkidle',
  });
  await page.keyboard.press('F3');
  assert.equal((await page.evaluate(() => window.__ride.snapshot())).audio.state, 'not-started');
  checks.push('audio waits for user interaction');
  await page.locator('#how-to-play').click();
  assert.ok(await page.locator('#help').isVisible());
  await page.locator('#help-close').click();
  await page.locator('#open-settings').click();
  const form = page.locator('#settings-form');
  await form.locator('[name="biome"]').selectOption('coastal');
  await form.locator('[name="time"]').selectOption('night');
  await form.locator('[name="quality"]').selectOption('medium');
  await form.locator('[name="camera"]').selectOption('1');
  await form.locator('[name="resolution"]').fill('.75');
  await form.locator('[name="volume"]').fill('.35');
  await form.locator('[name="sensitivity"]').fill('1.4');
  await page.screenshot({ path: 'artifacts/settings.png' });
  await form.locator('[type="submit"]').click();
  const setting = await page.evaluate(() => window.__ride.snapshot());
  assert.equal(setting.settings.time, 'night');
  assert.equal(setting.settings.biome, 'coastal');
  assert.equal(setting.stats.pixelRatio, 0.75);
  assert.equal(setting.camera.mode, 1);
  checks.push('settings affect rendering, camera, biome and controls');
  await page.locator('#start-button').click();
  await page.waitForTimeout(600);
  const idle = await page.evaluate(() => window.__ride.snapshot());
  assert.equal(idle.audio.state, 'running');
  assert.ok(idle.audio.rms > 0);
  assert.ok(idle.atmosphere.headlight > 50);
  checks.push('synthesized audio signal and real nighttime headlight');
  await page.keyboard.down('w');
  await page.waitForTimeout(6500);
  const moving = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(moving.audio.rpm > idle.audio.rpm);
  assert.ok(moving.audio.wind > idle.audio.wind);
  checks.push('engine RPM and wind track driving');
  await page.keyboard.down('Shift');
  await page.waitForTimeout(900);
  const boost = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(boost.physics.boosting);
  assert.ok(boost.physics.nitro < 0.9);
  await page.keyboard.up('Shift');
  await page.keyboard.up('w');
  checks.push('keyboard nitro drains its visible meter');
  await page.screenshot({ path: 'artifacts/night-helmet.png' });
  await page.keyboard.press('r');
  const frames = [];
  for (const time of ['sunrise', 'day', 'sunset', 'night']) {
    await page.keyboard.press('Escape');
    await page.locator('#pause-settings').click();
    await form.locator('[name="time"]').selectOption(time);
    await form.locator('[name="camera"]').selectOption('2');
    await form.locator('[name="quality"]').selectOption('high');
    await form.locator('[name="resolution"]').fill('1');
    await form.locator('[type="submit"]').click();
    await page.locator('#resume-button').click();
    await page.waitForTimeout(500);
    const snap = await page.evaluate(() => window.__ride.snapshot());
    assert.equal(snap.atmosphere.time, time);
    await page.screenshot({ path: `artifacts/time-${time}.png` });
    frames.push({
      time,
      night: snap.atmosphere.night,
      headlight: snap.atmosphere.headlight,
      fps: snap.stats.fps,
    });
  }
  checks.push('sunrise, day, sunset, night render independently');
  await page.keyboard.press('Escape');
  await page.locator('#pause-settings').click();
  await form.locator('[name="volume"]').fill('0');
  await form.locator('[type="submit"]').click();
  await page.locator('#resume-button').click();
  await page.waitForTimeout(1100);
  const muted = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(muted.audio.rms < 0.0001);
  checks.push('volume zero mutes generated output');
  await page.reload({ waitUntil: 'networkidle' });
  const saved = await page.evaluate(() => window.__ride.snapshot());
  assert.equal(saved.settings.time, 'night');
  assert.equal(saved.settings.volume, 0);
  assert.equal(saved.camera.mode, 2);
  checks.push('settings survive reload');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile(
    'artifacts/polish-results.json',
    JSON.stringify({ checks, errors, setting, idle, moving, boost, frames, muted }, null, 2),
  );
  console.log(`PASS ${checks.length} polish browser checks`);
} finally {
  await browser.close();
}
