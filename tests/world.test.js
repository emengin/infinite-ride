import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BiomeManager, BIOMES } from '../src/world/BiomeManager.js';
import { RoadPath } from '../src/world/RoadPath.js';
import { WorldManager } from '../src/world/WorldManager.js';

test('four distinct biomes and smooth deterministic transition weights', () => {
  const b = new BiomeManager(),
    ids = new Set();
  for (let s = 0; s < 8000; s += 7) {
    const p = b.sample(s);
    ids.add(p.id);
    assert.ok(Math.abs(p.weights.reduce((a, b) => a + b, 0) - 1) < 1e-9);
    const next = b.sample(s + 0.001);
    p.weights.forEach((w, i) => assert.ok(Math.abs(w - next.weights[i]) < 0.0001));
  }
  assert.equal(ids.size, 4);
  for (const biome of BIOMES) {
    b.set(biome.id);
    assert.equal(b.sample(1e7).id, biome.id);
  }
});

test('all biomes preserve the road contact surface; coast has a seabed and mountains rise', () => {
  for (const biome of BIOMES) {
    const p = new RoadPath(7049, biome.id);
    for (let s = 0; s < 3000; s += 19) {
      assert.ok(Math.abs(p.surface(s, 2.3).y - p.roadPoint(s, 2.3).y) < 1e-8);
      assert.ok(Number.isFinite(p.surface(s, 120).y));
    }
  }
  assert.ok(new RoadPath(7049, 'coastal').surface(24, 80).y < 0);
  assert.ok(
    new RoadPath(7049, 'mountain').surface(24, 260).y >
      new RoadPath(7049, 'highland').surface(24, 260).y + 10,
  );
});

test('changing biome retains pooled objects and bounds every instance count', () => {
  const path = new RoadPath(),
    world = new WorldManager(new THREE.Scene(), path),
    ids = world.chunks.map((c) => c.group.uuid);
  for (const biome of BIOMES) {
    world.setBiome(biome.id, 24);
    assert.deepEqual(
      world.chunks.map((c) => c.group.uuid),
      ids,
    );
    for (const c of world.chunks)
      c.group.traverse((o) => {
        if (o.isInstancedMesh) assert.ok(o.count <= o.instanceMatrix.count);
      });
  }
  world.dispose();
});

test('bridge and tunnel road contacts remain continuous and tunnels keep camera clearance', () => {
  const p = new RoadPath(7049, 'mountain');
  assert.equal(p.structure(1080).type, 'bridge');
  assert.equal(p.structure(3100).type, 'tunnel');
  for (const s of [1024, 1056, 1152, 3072, 3100, 3200, 3300, 3328])
    for (const d of [-4.3, 0, 2.3, 4.3])
      assert.ok(Math.abs(p.surface(s, d).y - p.roadPoint(s, d).y) < 1e-8);
  assert.ok(p.terrainHeight(1080, 14, p.center(1080).y) < p.center(1080).y - 10);
  assert.ok(p.terrainHeight(3100, 14, p.center(3100).y) > p.center(3100).y + 10);
});
