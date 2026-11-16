import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base = process.env.RIDE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({
    args: process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu'] : [],
  }),
  errors = [],
  samples = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`${base}?debug=1&test=1&traffic=extreme`, { waitUntil: 'networkidle' });
  await page.keyboard.press('F3');
  await page.locator('#start-button').click();
  const cdp = await page.context().newCDPSession(page);
  for (let i = 0; i < 12; i++) {
    const snapshot = await page.evaluate(() => window.__ride.test.drive(120, 32));
    assert.equal(
      snapshot.mode,
      'running',
      `soak at block ${i}: ${JSON.stringify({ mode: snapshot.mode, lastCrash: snapshot.lastCrash, physics: snapshot.physics })}`,
    );
    if (i > 0)
      assert.ok(
        snapshot.physics.distance > samples.at(-1).distance + 500,
        'traffic keeps advancing',
      );
    await page.waitForTimeout(600);
    await cdp.send('HeapProfiler.collectGarbage');
    const heap = await cdp.send('Runtime.getHeapUsage'),
      after = await page.evaluate(() => window.__ride.snapshot());
    samples.push({
      block: i,
      simulatedSeconds: (i + 1) * 120,
      distance: after.physics.distance,
      heap: heap.usedSize,
      stats: after.stats,
    });
    assert.equal(after.stats.chunks, 12);
    assert.equal(after.stats.trafficPool, 56);
    assert.ok(after.stats.geometries < 180);
    console.log(
      `SOAK ${(after.physics.distance / 1000).toFixed(2)} km · ${(heap.usedSize / 1048576).toFixed(1)} MiB · ${after.stats.geometries} geometries`,
    );
  }
  const warm = samples.slice(2),
    growth = Math.max(...warm.map((s) => s.heap)) - Math.min(...warm.map((s) => s.heap));
  assert.ok(growth < 8 * 1048576, `JS heap growth ${(growth / 1048576).toFixed(2)} MiB`);
  // A separate wall-clock interval measures actual render pacing, not accelerated simulation throughput.
  await page.evaluate(() => {
    window.__ride.test.realtimeDrive(32);
    window.__ride.test.resetPerformance();
  });
  await page.waitForTimeout(1000);
  const pacing = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const frames = [],
          start = performance.now();
        let previous = start;
        function frame(now) {
          frames.push(now - previous);
          previous = now;
          if (now - start < 12000) requestAnimationFrame(frame);
          else {
            frames.sort((a, b) => a - b);
            resolve({
              seconds: (now - start) / 1000,
              frames: frames.length,
              averageFPS: frames.length / ((now - start) / 1000),
              p95FrameMs: frames[Math.floor(frames.length * 0.95)],
            });
          }
        }
        requestAnimationFrame(frame);
      }),
  );
  const final = await page.evaluate(() => window.__ride.snapshot());
  assert.equal(final.mode, 'running', 'real-time pacing interval keeps driving');
  await page.evaluate(() => window.__ride.test.realtimeDrive(null));
  assert.ok(final.physics.distance > 15000);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile(
    'artifacts/soak-results.json',
    JSON.stringify({ samples, growthBytes: growth, pacing, errors, final: final.stats }, null, 2),
  );
  console.log(
    JSON.stringify(
      { distanceKm: final.physics.distance / 1000, growthMiB: growth / 1048576, pacing },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
