import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const prefix = '/infinite-ride/';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(root, pathname.slice(prefix.length) || 'index.html');
    if (!file.startsWith(resolve(root) + sep)) {
      res.writeHead(404).end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const local = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  args:
    process.platform === 'win32'
      ? ['--use-angle=d3d11', '--enable-gpu']
      : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const checks = [],
  errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // A non-loopback browser origin exercises the exact public-host code path.
  // Only test requests are routed locally; the production files are unchanged.
  await context.route('http://infinite-ride.test/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: local + url.pathname + url.search });
    await route.fulfill({ response });
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('http://infinite-ride.test/infinite-ride/?debug=1&test=1&traffic=off', {
    waitUntil: 'networkidle',
  });
  assert.ok(await page.locator('#error').isHidden());
  assert.equal(await page.evaluate(() => typeof window.__ride), 'undefined');
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  assert.ok(csp.includes("script-src 'self'") && csp.includes("connect-src 'none'"));
  assert.ok(!csp.includes("'unsafe-eval'"));
  checks.push('public host does not expose debug or mutable test APIs, even with query flags');
  await page.keyboard.press('F3');
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: fileURLToPath(new URL('../artifacts/publish-menu.png', import.meta.url)),
  });
  await page.locator('#start-button').click();
  await page.keyboard.down('w');
  await page.waitForTimeout(1600);
  await page.keyboard.up('w');
  assert.ok(Number(await page.locator('#speed').textContent()) > 10);
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#pause').isVisible());
  await page.locator('#pause-settings').click();
  await page.locator('#settings-form [name="volume"]').fill('0');
  await page.locator('#settings-form [type="submit"]').click();
  await page.locator('#resume-button').click();
  await page.keyboard.press('c');
  assert.equal(await page.evaluate(() => typeof window.__ride), 'undefined');
  assert.deepEqual(errors, [], 'normal public gameplay has no console/runtime errors');
  checks.push('public production build supports driving, pause, settings and camera under CSP');

  await page.evaluate(() => {
    window.__securityViolations = [];
    document.addEventListener('securitypolicyviolation', (event) =>
      window.__securityViolations.push(event.effectiveDirective),
    );
    const script = document.createElement('script');
    script.textContent = 'window.__inlineTestExecuted = true';
    document.head.append(script);
  });
  const denied = await page.evaluate(async () => {
    try {
      await fetch('https://example.invalid/security-test');
      return false;
    } catch {
      return true;
    }
  });
  await page.waitForTimeout(100);
  assert.ok(await page.evaluate(() => !window.__inlineTestExecuted));
  const violations = await page.evaluate(() => window.__securityViolations);
  assert.ok(denied && violations.includes('script-src-elem') && violations.includes('connect-src'));
  checks.push('browser blocks an inline script and an outbound connection');
  await context.close();

  const loopback = await browser.newPage();
  await loopback.goto(local + prefix + '?debug=1&test=1', { waitUntil: 'networkidle' });
  assert.equal(await loopback.evaluate(() => typeof window.__ride?.test?.drive), 'function');
  checks.push('explicit loopback test automation remains available for regression tests');
  await loopback.close();
  await writeFile(
    new URL('../artifacts/security-results.json', import.meta.url),
    JSON.stringify(
      { checks, normalGameplayErrors: [], expectedPolicyViolations: violations, csp },
      null,
      2,
    ),
  );
  console.log(`PASS ${checks.length} production security browser checks`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
