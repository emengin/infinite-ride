import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RoadPath, ROAD, LATERAL } from '../src/world/RoadPath.js';
import { RoadGenerator } from '../src/world/RoadGenerator.js';
import { WorldManager } from '../src/world/WorldManager.js';
import { MotorcyclePhysics } from '../src/motorcycle/MotorcyclePhysics.js';
import { FixedStep } from '../src/core/FixedStep.js';
import { CameraController } from '../src/rendering/CameraController.js';

const close = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);
const path = new RoadPath(7049);
class StraightRoad extends RoadPath {
  center(s) {
    return { x: 0, y: 0, z: -s };
  }
}

test('same seed produces identical road; different seeds change it', () => {
  const a = new RoadPath(7049),
    b = new RoadPath(7049),
    c = new RoadPath(9);
  for (const s of [0, 128, 999, 100000, 1e7]) assert.deepEqual(a.frame(s), b.frame(s));
  assert.notDeepEqual(a.center(500), c.center(500));
});

test('road is continuous, bounded in slope/curvature and non-flat over 100 km', () => {
  let min = Infinity,
    max = -Infinity,
    maxCurve = 0;
  for (let s = 0; s <= 100000; s += 9.7) {
    const f = path.frame(s);
    assert.ok(Math.abs(f.dx) < 1.3);
    assert.ok(Math.abs(f.pitch) < 0.25);
    assert.ok(Number.isFinite(f.curvature));
    min = Math.min(min, f.y);
    max = Math.max(max, f.y);
    maxCurve = Math.max(maxCurve, Math.abs(f.curvature));
    const epsilon = 0.00001,
      a = path.surface(s - epsilon, 2.3),
      b = path.surface(s + epsilon, 2.3);
    assert.ok(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) < 0.001);
  }
  assert.ok(max - min > 12);
  assert.ok(maxCurve < 0.014);
});

test('physics surface uses the exact terrain triangle interpolation', () => {
  for (const s of [3.3, 127.9, 128, 128.1, 511.2, 1048576.1])
    for (const d of [-25, -8.1, 0, 2.3, 4.6, 5.8, 11, 35]) {
      const s0 = Math.floor(s / 4) * 4,
        t = (s - s0) / 4;
      let i = 0;
      while (LATERAL[i + 1] < d) i++;
      const d0 = LATERAL[i],
        d1 = LATERAL[i + 1],
        u = (d - d0) / (d1 - d0);
      const points = [
        path.vertex(s0, d0),
        path.vertex(s0, d1),
        path.vertex(s0 + 4, d0),
        path.vertex(s0 + 4, d1),
      ];
      const weights = t + u <= 1 ? [1 - t - u, u, t, 0] : [0, 1 - t, 1 - u, t + u - 1];
      const actual = path.surface(s, d);
      for (const key of ['x', 'y', 'z'])
        close(
          actual[key],
          points.reduce((sum, p, j) => sum + p[key] * weights[j], 0),
          1e-6,
        );
    }
});

test('adjacent road meshes join without cracks, including far coordinates', () => {
  const generator = new RoadGenerator(path),
    a = generator.create(),
    b = generator.create();
  for (const start of [0, 128, 512, 1000064]) {
    const anchorA = path.center(start),
      anchorB = path.center(start + 128);
    generator.rebuild(a, start, anchorA);
    generator.rebuild(b, start + 128, anchorB);
    const p = a.children[0].geometry.getAttribute('position'),
      q = b.children[0].geometry.getAttribute('position');
    // Last quad's two end vertices correspond to first quad's start vertices.
    for (const [i, j] of [
      [p.count - 10, 0],
      [p.count - 8, 1],
      [p.count - 4, 6],
      [p.count - 2, 7],
    ]) {
      close(p.getX(i) + anchorA.x, q.getX(j) + anchorB.x, 1e-4);
      close(p.getY(i) + anchorA.y, q.getY(j) + anchorB.y, 1e-4);
      close(p.getZ(i) + anchorA.z, q.getZ(j) + anchorB.z, 1e-4);
    }
  }
  for (const group of [a, b]) group.traverse((o) => o.geometry?.dispose());
  generator.dispose();
});

test('throttle accelerates progressively; coasting and brakes decelerate', () => {
  const b = new MotorcyclePhysics(new StraightRoad(7049));
  b.update(1 / 120, { throttle: 1 });
  assert.ok(b.state.speed > 0 && b.state.speed < 0.1);
  for (let i = 0; i < 120 * 8; i++) b.update(1 / 120, { throttle: 1 });
  assert.ok(b.state.speed > 35 && b.state.speed < 60);
  const speed = b.state.speed;
  for (let i = 0; i < 120; i++) b.update(1 / 120, {});
  assert.ok(b.state.speed < speed && b.state.speed > speed - 5);
  const before = b.state.speed;
  for (let i = 0; i < 120; i++) b.update(1 / 120, { brake: 1 });
  assert.ok(b.state.speed < before - 12);
  for (let i = 0; i < 120 * 5; i++) b.update(1 / 120, { brake: 1 });
  assert.equal(b.state.speed, 0);
});

test('steering changes heading before lateral position; no sideways sliding at standstill', () => {
  const b = new MotorcyclePhysics(path),
    d = b.state.d;
  for (let i = 0; i < 120; i++) b.update(1 / 120, { steer: 1, brake: 1 });
  close(b.state.d, d);
  b.reset();
  b.state.speed = 22;
  const start = b.state.d;
  for (let i = 0; i < 60; i++) b.update(1 / 120, { steer: 1, throttle: 0.4 });
  assert.ok(b.state.headingError > 0);
  assert.ok(b.state.d > start + 0.4);
  assert.ok(b.state.lean < 0);
});

test('AI-only road assist follows curves and visible elevation for 10 km at 80 km/h', () => {
  const b = new MotorcyclePhysics(path, { roadAssist: true });
  for (let i = 0; i < 120 * 470; i++) {
    // Speed regulation in the test driver; actual player uses throttle/brake.
    const throttle = Math.max(0, Math.min(1, 0.35 + (22.22 - b.state.speed) * 0.3));
    b.update(1 / 120, { throttle });
    assert.ok(Math.abs(b.state.d - 2.3) < 0.05);
    if (i % 120 === 0) close(b.pose().y, path.surface(b.state.s, b.state.d).y);
  }
  assert.ok(b.state.distance > 10000);
});

test('player never steers or leans automatically as road curvature changes', () => {
  for (const s of [24, 260, 600, 1100, 2500]) {
    const bike = new MotorcyclePhysics(path);
    bike.reset(s);
    bike.state.speed = 22;
    const heading = bike.pose().heading;
    for (let i = 0; i < 120; i++) bike.update(1 / 120, { throttle: 0.5 });
    close(bike.pose().heading, heading);
    close(bike.state.lean, 0);
    close(bike.state.yawRate, 0);
    close(bike.state.steer, 0);
  }
});

test('releasing steering settles without countersteering, oscillation or road correction', () => {
  const bike = new MotorcyclePhysics(new StraightRoad(7049));
  bike.state.speed = 18;
  for (let i = 0; i < 24; i++) bike.update(1 / 120, { steer: 1 });
  let previous = bike.state.heading;
  for (let i = 0; i < 240; i++) {
    bike.update(1 / 120, {});
    assert.ok(bike.state.yawRate >= 0);
    assert.ok(bike.state.heading >= previous);
    previous = bike.state.heading;
  }
  assert.ok(bike.state.yawRate < 1e-7);
  const settled = bike.state.heading;
  for (let i = 0; i < 120; i++) bike.update(1 / 120, {});
  close(bike.state.heading, settled);
  assert.ok(Math.abs(bike.state.lean) < 1e-7);
});

test('outer world boundary stops the player without turning them toward the road', () => {
  const bike = new MotorcyclePhysics(path);
  bike.state.d = 25.99;
  bike.state.heading += 0.5;
  bike.state.speed = 30;
  const heading = bike.state.heading;
  for (let i = 0; i < 10; i++) bike.update(1 / 120, {});
  close(bike.state.d, 26);
  close(bike.state.speed, 0);
  close(bike.state.heading, heading);
});

test('off-road has less acceleration and recover resets safely without losing distance', () => {
  const road = new MotorcyclePhysics(path),
    dirt = new MotorcyclePhysics(path);
  dirt.state.d = 9;
  for (let i = 0; i < 600; i++) {
    road.update(1 / 120, { throttle: 1 });
    dirt.update(1 / 120, { throttle: 1 });
  }
  assert.ok(dirt.state.offroad);
  assert.ok(dirt.state.speed < road.state.speed * 0.6);
  const distance = dirt.state.distance,
    s = dirt.state.s;
  dirt.reset(s, true);
  close(dirt.state.s, s);
  close(dirt.state.distance, distance);
  assert.equal(dirt.state.d, 2.3);
  assert.equal(dirt.state.speed, 0);
});

test('fixed physics is invariant at 30, 60 and 144 rendering FPS', () => {
  const states = [30, 60, 144].map((fps) => {
    const b = new MotorcyclePhysics(path),
      clock = new FixedStep();
    for (let frame = 0; frame < fps * 16; frame++)
      clock.advance(1 / fps, (dt) => b.update(dt, { throttle: 1, steer: 0 }));
    return b.state;
  });
  for (const s of states.slice(1))
    for (const key of ['s', 'd', 'speed', 'distance', 'lean']) close(s[key], states[0][key]);
});

test('tab suspension is bounded; reset discards stale accumulated time', () => {
  const clock = new FixedStep();
  let steps = 0;
  clock.advance(300, () => steps++);
  assert.equal(steps, 12);
  clock.advance(0.004, () => {});
  clock.reset();
  close(clock.accumulator, 0);
});

test('high-speed follow camera retains its framing through a floating-origin rebase', () => {
  const scene = new THREE.Scene(),
    world = new WorldManager(scene, path);
  const physics = new MotorcyclePhysics(path),
    camera = new THREE.PerspectiveCamera(57, 16 / 9, 0.08, 1600);
  const controller = new CameraController(camera, path, world);
  for (let i = 0; i < 1200; i++) {
    physics.state.s = 24 + i;
    physics.state.speed = 60;
    controller.rebase(world.update(physics.state.s));
    const pose = physics.pose();
    controller.update(1 / 60, physics, pose);
    const local = world.toLocal(pose, new THREE.Vector3());
    assert.ok(camera.position.distanceTo(local) < 11);
    assert.ok(camera.position.y > local.y + 1);
  }
  assert.ok(camera.fov > 65);
  world.dispose();
});

test('50 km of chunk recycling plus a 10,000 km rebase keeps resources bounded', () => {
  const scene = new THREE.Scene(),
    world = new WorldManager(scene, path);
  const groups = new Set(world.chunks.map((c) => c.group.uuid));
  const bufferIds = new Set();
  world.chunks.forEach((c) =>
    c.group.traverse((o) => {
      if (o.isMesh) bufferIds.add(o.geometry.uuid);
    }),
  );
  const expected = ROAD.behind + ROAD.ahead + 1;
  const check = (s) => {
    world.update(s);
    assert.equal(world.chunks.length, expected);
    assert.equal(scene.children.length, expected);
    const indices = world.chunks.map((c) => c.index).sort((a, b) => a - b),
      index = Math.floor(s / 128);
    assert.deepEqual(
      indices,
      Array.from({ length: expected }, (_, i) => index - ROAD.behind + i),
    );
    for (const c of world.chunks) {
      assert.ok(groups.has(c.group.uuid));
      assert.ok(Math.abs(c.group.position.z) < 1600);
      c.group.traverse((o) => {
        if (o.isMesh) assert.ok(bufferIds.has(o.geometry.uuid));
      });
    }
    const local = world.toLocal(path.surface(s, 2.3), new THREE.Vector3());
    assert.ok(Math.abs(local.z) < 600);
  };
  for (let s = 0; s <= 50000; s += 128) check(s);
  check(10000000);
  check(24);
  assert.ok(world.recycled > 400);
  world.dispose();
  assert.equal(scene.children.length, 0);
});

test('downward raycasts hit the visible asphalt exactly at the physics contact height', () => {
  for (const biome of ['forest', 'coastal', 'mountain', 'highland']) {
    const path = new RoadPath(7049, biome),
      world = new WorldManager(new THREE.Scene(), path),
      ray = new THREE.Raycaster(),
      down = new THREE.Vector3(0, -1, 0);
    for (const s of [24.3, 127.9, 128.1, 511.4, 1080.2, 3100.7, 9999.3]) {
      world.update(s);
      world.scene.updateMatrixWorld(true);
      const p = path.surface(s, 2.3),
        local = world.toLocal(p, new THREE.Vector3());
      ray.set(local.clone().add(new THREE.Vector3(0, 2, 0)), down);
      const hits = ray.intersectObjects(world.chunks.map((c) => c.road.getObjectByName('asphalt')));
      assert.ok(hits.length > 0);
      close(hits[0].point.y, local.y + 0.025, 0.0001);
    }
    world.dispose();
  }
});
