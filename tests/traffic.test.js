import test from 'node:test';
import assert from 'node:assert/strict';
import { RoadPath } from '../src/world/RoadPath.js';
import { TrafficSimulation, VEHICLES, DENSITIES } from '../src/traffic/TrafficSimulation.js';
import { accelerationFor, canOvertake } from '../src/traffic/TrafficAI.js';
import { sweepBoxes, CollisionSystem } from '../src/physics/CollisionSystem.js';

const path = new RoadPath();
const actor = (id, s, speed = 20, dir = 1) => ({
  id,
  active: true,
  type: 0,
  s,
  prevS: s,
  d: dir * 2.3,
  prevD: dir * 2.3,
  dir,
  speed,
  cruise: speed,
  halfWidth: 0.9,
  halfLength: 2.25,
  headingError: dir === 1 ? 0 : Math.PI,
  targetD: dir * 2.3,
  passing: null,
  cooldown: 0,
  closest: Infinity,
  passed: false,
  generation: 0,
});

test('traffic uses seven vehicle types, two directions, bounded density and distant spawn', () => {
  assert.equal(VEHICLES.length, 7);
  for (const density of Object.keys(DENSITIES)) {
    const sim = new TrafficSimulation(path, density);
    sim.reset(24);
    assert.equal(sim.actors.length, DENSITIES[density]);
    assert.ok(sim.actors.every((a) => a.s >= 184 && Math.abs(a.d) === 2.3));
    if (density !== 'off') {
      assert.equal(new Set(sim.actors.map((a) => a.type)).size, 7);
      assert.equal(new Set(sim.actors.map((a) => a.dir)).size, 2);
    }
  }
});

test('following AI brakes for stationary leader and rejects unsafe oncoming overtakes', () => {
  const car = actor(1, 0, 28),
    leader = actor(2, 20, 0),
    oncoming = actor(3, 120, 25, -1);
  assert.ok(accelerationFor(car, leader, path) < -5);
  assert.equal(canOvertake(car, leader, [car, leader, oncoming], { active: false }), false);
  assert.equal(canOvertake(car, leader, [car, leader], { active: false }), true);
  assert.equal(
    canOvertake(car, leader, [car, leader, actor(4, 55, 14)], { active: false }),
    false,
    'do not enter the opposing lane without a re-entry gap beyond a convoy',
  );
});

test('AI performs a complete safe overtake and returns to its own lane', () => {
  const sim = new TrafficSimulation(path, 'off');
  const fast = actor(1, 24, 30),
    slow = actor(2, 80, 12);
  sim.pool = [fast, slow];
  const player = { s: -200, prevS: -200, d: 2.3, speed: 0 };
  let opposite = false;
  for (let i = 0; i < 3600; i++) {
    sim.update(1 / 120, player);
    opposite ||= fast.d < -0.5;
  }
  assert.ok(opposite);
  assert.ok(fast.s > slow.s + 10);
  assert.ok(Math.abs(fast.d - 2.3) < 0.1);
});

test('swept oriented collision catches a high-speed crossing and permits a narrow miss', () => {
  const p = {
    s: 15,
    prevS: -15,
    d: 2.3,
    prevD: 2.3,
    halfWidth: 0.34,
    halfLength: 1.05,
    headingError: 0,
  };
  const car = actor(1, 0, 0);
  assert.notEqual(sweepBoxes(p, car), null);
  assert.equal(sweepBoxes({ ...p, d: 4, prevD: 4 }, car), null);
  assert.notEqual(sweepBoxes({ ...p, d: 3.25, prevD: 3.25, headingError: 0.4 }, car), null);
  assert.equal(new CollisionSystem().check({ ...p, speed: 63 }, [car], null)?.kind, 'vehicle');
});

test('close pass is awarded once and a collision-width pass earns no close-pass reward', () => {
  for (const [d, expected] of [
    [3.8, 1],
    [2.3, 0],
  ]) {
    const sim = new TrafficSimulation(path, 'off');
    sim.pool = [actor(1, 0, 0)];
    let near = 0;
    for (let s = -8; s < 10; s += 0.25) {
      near += sim
        .update(1 / 120, { s, prevS: s - 0.25, d, speed: 30 })
        .filter((e) => e.type === 'near').length;
    }
    assert.equal(near, expected);
  }
});

test('ten simulated minutes recycle a fixed traffic pool without overlapping same-lane cars', () => {
  const sim = new TrafficSimulation(path, 'extreme');
  sim.reset(24);
  const ids = sim.pool.map((a) => a.id);
  for (let i = 0; i < 6000; i++) {
    const s = 24 + i * 4.8;
    sim.update(0.1, { s, prevS: s - 4.8, d: 12, speed: 48 });
    assert.equal(sim.pool.length, 56);
    assert.ok(sim.actors.length <= 56);
    if (i % 20 === 0) {
      const active = sim.actors;
      for (let a = 0; a < active.length; a++)
        for (let b = a + 1; b < active.length; b++) {
          const x = active[a],
            y = active[b];
          if (Math.abs(x.d - y.d) < x.halfWidth + y.halfWidth)
            assert.ok(Math.abs(x.s - y.s) >= x.halfLength + y.halfLength - 0.01);
        }
    }
  }
  assert.deepEqual(
    sim.pool.map((a) => a.id),
    ids,
  );
  assert.ok(sim.spawned > 1000);
});
