import test from 'node:test';
import assert from 'node:assert/strict';
import { TimeOfDay, TIMES } from '../src/world/TimeOfDay.js';
import { normalizeSettings } from '../src/core/SaveManager.js';
import { MotorcyclePhysics } from '../src/motorcycle/MotorcyclePhysics.js';
import { RoadPath } from '../src/world/RoadPath.js';
test('all daylight states are distinct and dynamic cycle is smooth and bounded', () => {
  const clock = new TimeOfDay('dynamic');
  const states = new Set();
  let previous = clock.sample();
  for (let i = 0; i < 7200; i++) {
    const p = clock.update(0.1);
    states.add(Math.floor(p.night * 10));
    for (const key of ['light', 'ambient', 'night', 'elevation', 'exposure']) {
      assert.ok(Number.isFinite(p[key]));
      assert.ok(Math.abs(p[key] - previous[key]) < 0.01);
    }
    previous = p;
  }
  assert.ok(states.size > 7);
  assert.equal(new TimeOfDay('night').sample().night, 1);
  assert.equal(Object.keys(TIMES).length, 4);
});
test('nitro supplies real acceleration, drains, locks at empty and recharges on release', () => {
  class StraightRoad extends RoadPath {
    center(s) {
      return { x: 0, y: 0, z: -s };
    }
  }
  const p = new StraightRoad(),
    normal = new MotorcyclePhysics(p),
    boost = new MotorcyclePhysics(p);
  normal.state.speed = boost.state.speed = 45;
  for (let i = 0; i < 120 * 3; i++) {
    normal.update(1 / 120, { throttle: 1 });
    boost.update(1 / 120, { throttle: 1, nitro: 1 });
  }
  assert.ok(boost.state.speed > normal.state.speed + 8);
  assert.ok(boost.state.nitro < 0.2);
  for (let i = 0; i < 120 * 2; i++) boost.update(1 / 120, { throttle: 1, nitro: 1 });
  assert.equal(boost.state.boosting, false);
  assert.equal(boost.state.boostLocked, true);
  const before = boost.state.nitro;
  for (let i = 0; i < 120; i++) boost.update(1 / 120, {});
  assert.ok(boost.state.nitro > before);
  assert.equal(boost.state.boostLocked, false);
});
test('settings reject corrupt values and sensitivity changes steering response', () => {
  const s = normalizeSettings({
    quality: 'invalid',
    traffic: 'nonsense',
    volume: 9,
    resolution: 0,
    sensitivity: 'NaN',
    camera: 9,
    time: 'night',
  });
  assert.equal(s.quality, 'high');
  assert.equal(s.volume, 1);
  assert.equal(s.resolution, 0.5);
  assert.equal(s.camera, 2);
  assert.equal(s.sensitivity, 1);
  assert.equal(s.time, 'night');
  const p = new RoadPath(),
    low = new MotorcyclePhysics(p),
    high = new MotorcyclePhysics(p);
  low.sensitivity = 0.6;
  high.sensitivity = 1.6;
  low.state.speed = high.state.speed = 20;
  for (let i = 0; i < 40; i++) {
    low.update(1 / 120, { steer: 1 });
    high.update(1 / 120, { steer: 1 });
  }
  assert.ok(high.state.d > low.state.d);
});
