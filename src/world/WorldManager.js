import * as THREE from 'three';
import { ROAD } from './RoadPath.js';
import { RoadGenerator } from './RoadGenerator.js';
import { TerrainGenerator } from './TerrainGenerator.js';
import { RoadFurniture } from './RoadFurniture.js';

export class WorldManager {
  constructor(scene, path) {
    this.scene = scene;
    this.path = path;
    this.road = new RoadGenerator(path);
    this.terrain = new TerrainGenerator(path);
    this.furniture = new RoadFurniture(path);
    this.origin = { x: 0, y: 0, z: 0, s: NaN };
    this.chunks = [];
    this.recycled = 0;
    for (let i = 0; i < ROAD.behind + ROAD.ahead + 1; i++) {
      const group = new THREE.Group(),
        road = this.road.create(),
        terrain = this.terrain.create();
      const furniture = this.furniture.create();
      group.add(terrain, road, furniture);
      scene.add(group);
      this.chunks.push({ index: null, group, road, terrain, furniture, anchor: null });
    }
    this.update(24);
  }

  update(s) {
    const index = Math.floor(s / ROAD.chunkLength);
    const originS = Math.floor(s / ROAD.originInterval) * ROAD.originInterval;
    let delta = null;
    if (originS !== this.origin.s) {
      const p = this.path.center(originS);
      delta = { x: p.x - this.origin.x, y: p.y - this.origin.y, z: p.z - this.origin.z };
      this.origin = { ...p, s: originS };
    }
    const required = new Set();
    for (let i = index - ROAD.behind; i <= index + ROAD.ahead; i++) required.add(i);
    for (const chunk of this.chunks) if (required.has(chunk.index)) required.delete(chunk.index);
    for (const chunk of this.chunks) {
      if (
        chunk.index !== null &&
        chunk.index >= index - ROAD.behind &&
        chunk.index <= index + ROAD.ahead
      )
        continue;
      const next = required.values().next().value;
      required.delete(next);
      chunk.index = next;
      chunk.anchor = this.path.center(next * ROAD.chunkLength);
      this.road.rebuild(chunk.road, next * ROAD.chunkLength, chunk.anchor);
      this.terrain.rebuild(chunk.terrain, next * ROAD.chunkLength, chunk.anchor);
      this.furniture.rebuild(chunk.furniture, next * ROAD.chunkLength, chunk.anchor);
      this.recycled++;
    }
    // CPU meshes retain their small chunk-local coordinates. A rebase only moves groups.
    for (const chunk of this.chunks) {
      const a = chunk.anchor,
        o = this.origin;
      chunk.group.position.set(a.x - o.x, a.y - o.y, a.z - o.z);
    }
    return delta;
  }

  toLocal(p, target) {
    return target.set(p.x - this.origin.x, p.y - this.origin.y, p.z - this.origin.z);
  }

  setBiome(choice, s) {
    this.path.biomes.set(choice);
    this.chunks.forEach((c) => {
      c.index = null;
    });
    this.origin.s = NaN;
    return this.update(s);
  }

  dispose() {
    for (const chunk of this.chunks) {
      chunk.group.traverse((object) => {
        // Shared instanced geometries are owned by TerrainGenerator.
        if (object.isMesh && !object.isInstancedMesh) object.geometry.dispose();
        if (object.isInstancedMesh) object.dispose();
      });
      this.scene.remove(chunk.group);
    }
    this.road.dispose();
    this.terrain.dispose();
    this.furniture.dispose();
  }
}
