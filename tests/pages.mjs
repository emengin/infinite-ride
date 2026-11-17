import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Serve the exact production files under an arbitrary repo name, as Pages does.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const prefix = '/renamed-infinite-ride/';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
};
const errors = [],
  requests = [];
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith(prefix)) {
    res.writeHead(404).end();
    return;
  }
  const relative = decodeURIComponent(pathname.slice(prefix.length)) || 'index.html';
  const file = resolve(root, relative);
  if (!file.startsWith(resolve(root) + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res
      .writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
      .end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  headless: true,
  args:
    process.platform === 'win32'
      ? ['--use-angle=d3d11', '--enable-gpu']
      : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(request.url()));
  page.on('response', (response) => {
    requests.push(response.url());
    if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  const url = `http://127.0.0.1:${server.address().port}${prefix}?debug=1`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ride?.snapshot().stats.drawCalls > 0);
  assert.ok(await page.locator('#error').isHidden());
  await page.locator('#start-button').click();
  await page.keyboard.down('w');
  await page.waitForTimeout(1200);
  await page.keyboard.up('w');
  const snapshot = await page.evaluate(() => window.__ride.snapshot());
  assert.ok(snapshot.physics.speed > 5);
  assert.ok(requests.every((url) => new URL(url).pathname.startsWith(prefix)));
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../artifacts/pages-results.json', import.meta.url),
    JSON.stringify({ prefix, requests, errors, snapshot }, null, 2),
  );
  console.log(
    `PASS Production game loads and drives at ${prefix} (${requests.length} requests, no errors)`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
