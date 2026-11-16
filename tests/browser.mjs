import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.RIDE_URL || 'http://127.0.0.1:4173/';
const artifacts = new URL('../artifacts/', import.meta.url);
await mkdir(artifacts, { recursive: true });
// Windows headless Chromium otherwise chooses SwiftShader even with a usable GPU.
const browser = await chromium.launch({
  headless: true,
  args: process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu'] : [],
});
const errors = [],
  failures = [],
  checks = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('requestfailed', (request) =>
  failures.push(`${request.url()}: ${request.failure()?.errorText}`),
);
page.on('response', (response) => {
  if (response.status() >= 400) failures.push(`${response.url()}: HTTP ${response.status()}`);
});
const snapshot = () => page.evaluate(() => window.__ride.snapshot());
const check = (label, condition) => {
  assert.ok(condition, label);
  checks.push(label);
  console.log(`PASS ${label}`);
};
try {
  await page.goto(`${base}?debug=1&test=1&traffic=off`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ride?.snapshot().stats.drawCalls > 0);
  const gpu = await page.evaluate(() => {
    const gl = document.querySelector('#game').getContext('webgl2'),
      ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'Not reported';
  });
  await page.keyboard.press('F3');
  await page.waitForTimeout(400);
  check('WebGL scene loads without error overlay', await page.locator('#error').isHidden());
  await page.screenshot({
    path: new URL('01-intro.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'),
  });
  await page.locator('#start-button').click();
  await page.waitForTimeout(300);
  const idle = await snapshot();
  check(
    'Motorcycle stays still without throttle',
    idle.mode === 'running' && idle.physics.speed === 0,
  );
  await page.keyboard.down('w');
  await page.waitForTimeout(7000);
  const mid = await snapshot();
  check(
    'Keyboard throttle drives forward and updates HUD',
    mid.physics.distance > 120 &&
      mid.physics.speed > 35 &&
      +(await page.locator('#speed').textContent()) > 120,
  );
  await page.waitForTimeout(9000);
  await page.keyboard.up('w');
  const fast = await snapshot();
  check(
    'Infinite road recycles chunks and rebases origin during real driving',
    fast.physics.distance > 600 &&
      fast.stats.origin >= 512 &&
      fast.stats.recycled > 12 &&
      fast.stats.chunks === 12,
  );
  check('Camera responds to speed with increased FOV', fast.camera.fov > idle.camera.fov + 7);
  // Camera-to-rider distance can also be checked after an origin rebase using the road s.
  check(
    'Camera keeps motorcycle close at high speed',
    Math.abs(fast.camera.position[2] + fast.physics.s - fast.stats.origin) < 12,
  );
  await page.screenshot({
    path: new URL('02-riding.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'),
  });
  await page.keyboard.down('d');
  await page.waitForTimeout(350);
  await page.keyboard.up('d');
  const steering = await snapshot();
  check(
    'Steering changes heading and lateral position',
    steering.physics.d > fast.physics.d + 0.2 && steering.physics.headingError > 0.015,
  );
  await page.evaluate(
    (distance) => window.__ride.test.player({ s: 24, d: -6.1, speed: 20, distance }),
    fast.physics.distance,
  );
  await page.waitForTimeout(100);
  const dirt = await snapshot();
  check('Leaving the asphalt changes grip state', dirt.physics.offroad);
  const beforeBrake = dirt.physics.speed;
  await page.keyboard.down('s');
  await page.waitForTimeout(1600);
  await page.keyboard.up('s');
  check('Brake slows the motorcycle', (await snapshot()).physics.speed < beforeBrake - 10);
  await page.keyboard.press('r');
  await page.waitForTimeout(200);
  const recovered = await snapshot();
  check(
    'R returns to road while preserving journey distance',
    recovered.physics.d === 2.3 &&
      recovered.physics.speed === 0 &&
      recovered.physics.distance >= dirt.physics.distance,
  );
  await page.keyboard.press('c');
  await page.waitForTimeout(400);
  check('Helmet camera switches correctly', (await snapshot()).camera.mode === 1);
  await page.screenshot({
    path: new URL('03-helmet.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'),
  });
  await page.keyboard.press('c');
  await page.waitForTimeout(400);
  check('Wide camera switches correctly', (await snapshot()).camera.mode === 2);
  await page.screenshot({
    path: new URL('04-wide.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'),
  });
  await page.keyboard.press('Escape');
  const paused = await snapshot();
  await page.keyboard.down('w');
  await page.waitForTimeout(400);
  await page.keyboard.up('w');
  check(
    'Pause freezes physics and blocks throttle',
    (await snapshot()).physics.s === paused.physics.s && (await page.locator('#pause').isVisible()),
  );
  await page.locator('#resume-button').click();
  check('Resume restores gameplay', (await snapshot()).mode === 'running');
  // Browser focus loss must release held input and pause, not leave the throttle stuck.
  await page.keyboard.down('w');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('w');
  check('Losing focus automatically pauses', (await snapshot()).mode === 'paused');
  await page.locator('#reset-button').click();
  await page.waitForTimeout(200);
  check('Restart resets journey', (await snapshot()).physics.distance === 0);
  await page.keyboard.press('Escape');
  await page.locator('#menu-button').click();
  check('Return to start screen works', await page.locator('#intro').isVisible());
  const desktop = await snapshot();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', (error) => errors.push(error.message));
  mobile.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  mobile.on('requestfailed', (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  await mobile.goto(`${base}?debug=1`, { waitUntil: 'networkidle' });
  await mobile.keyboard.press('F3');
  await mobile.locator('#start-button').tap();
  check('Touch controls appear on mobile', await mobile.locator('#touch-controls').isVisible());
  const cdp = await mobileContext.newCDPSession(mobile);
  const pedal = await mobile.locator('[data-control="throttle"]').boundingBox();
  const right = await mobile.locator('[data-control="right"]').boundingBox();
  const gasPoint = { x: pedal.x + pedal.width / 2, y: pedal.y + pedal.height / 2, id: 1 };
  const steerPoint = { x: right.x + right.width / 2, y: right.y + right.height / 2, id: 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [gasPoint] });
  await mobile.waitForTimeout(1200);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [gasPoint, steerPoint],
  });
  await mobile.waitForTimeout(500);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check(
    'Touch throttle moves motorcycle',
    (await mobile.evaluate(() => window.__ride.snapshot())).physics.speed > 5,
  );
  check(
    'Multitouch supports throttle and steering together',
    (await mobile.evaluate(() => window.__ride.snapshot())).physics.d > 2.5,
  );
  await mobile.screenshot({
    path: new URL('05-mobile.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'),
  });
  await mobileContext.close();
  check(
    'No browser JavaScript, WebGL or request errors',
    errors.length === 0 && failures.length === 0,
  );
  await writeFile(
    new URL('browser-results.json', artifacts),
    JSON.stringify({ url: base, gpu, checks, errors, failures, desktop, riding: fast }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        checks: checks.length,
        drivingDistance: fast.physics.distance,
        kmh: fast.physics.speed * 3.6,
        fps: fast.stats.fps,
        drawCalls: fast.stats.drawCalls,
        geometries: fast.stats.geometries,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await page
    .screenshot({ path: new URL('failure.png', artifacts).pathname.replace(/^\/(\w:)/, '$1') })
    .catch(() => {});
  console.error({ errors, failures });
  throw error;
} finally {
  await browser.close();
}
