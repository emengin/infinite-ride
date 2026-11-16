import * as THREE from 'three';
import { ROAD, LATERAL } from './RoadPath.js';
import { BIOMES } from './BiomeManager.js';
import { hash, noise } from '../core/math.js';
import { updateGeometry } from './RoadGenerator.js';

export class TerrainGenerator {
  constructor(path) {
    this.path = path;
    this.dummy = new THREE.Object3D();
    this.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
    this.resources = {
      crowns: [
        new THREE.IcosahedronGeometry(1, 1),
        new THREE.MeshStandardMaterial({ color: 0x4b674d, roughness: 1, flatShading: true }),
        144,
      ],
      needles: [
        new THREE.ConeGeometry(1, 1, 7),
        new THREE.MeshStandardMaterial({ color: 0x345c4e, roughness: 1, flatShading: true }),
        288,
      ],
      trunks: [
        new THREE.CylinderGeometry(0.11, 0.18, 1, 5),
        new THREE.MeshStandardMaterial({ color: 0x635447, roughness: 1 }),
        96,
      ],
      rocks: [
        new THREE.DodecahedronGeometry(1, 0),
        new THREE.MeshStandardMaterial({ color: 0x999d91, roughness: 1, flatShading: true }),
        64,
      ],
      shrubs: [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.MeshStandardMaterial({ color: 0x718659, roughness: 1, flatShading: true }),
        128,
      ],
      grass: [
        new THREE.ConeGeometry(1, 1, 3),
        new THREE.MeshStandardMaterial({ color: 0x9ca46e, roughness: 1 }),
        192,
      ],
    };
    this.palette = BIOMES.map((b) => [new THREE.Color(b.low), new THREE.Color(b.high)]);
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x347f89,
      metalness: 0.25,
      roughness: 0.27,
      transparent: true,
      opacity: 0.93,
    });
    this.color = new THREE.Color();
    this.tempColor = new THREE.Color();
    this.snow = new THREE.Color(0xcbd0c8);
  }
  create() {
    const group = new THREE.Group();
    const terrain = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    terrain.name = 'terrain';
    terrain.receiveShadow = true;
    group.add(terrain);
    for (const [name, [geometry, material, count]] of Object.entries(this.resources)) {
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      mesh.name = name;
      mesh.castShadow = ['crowns', 'needles', 'trunks'].includes(name);
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    const water = new THREE.Mesh(new THREE.BufferGeometry(), this.waterMaterial);
    water.name = 'water';
    group.add(water);
    return group;
  }
  rebuild(group, start, anchor) {
    const rows = ROAD.chunkLength / ROAD.step + 1,
      cols = LATERAL.length,
      positions = [],
      colors = [],
      indices = [];
    for (let r = 0; r < rows; r++) {
      const s = start + r * ROAD.step,
        b = this.path.biomes.sample(s);
      for (let c = 0; c < cols; c++) {
        const d = LATERAL[c],
          p = this.path.vertex(s, d);
        positions.push(p.x - anchor.x, p.y - anchor.y - 0.015, p.z - anchor.z);
        const shade = (noise(s / 38 + d / 24, this.path.seed + 49) + 1) / 2;
        this.color.setRGB(0, 0, 0);
        for (let i = 0; i < 4; i++) {
          this.tempColor
            .copy(this.palette[i][0])
            .lerp(this.palette[i][1], shade)
            .multiplyScalar(b.weights[i]);
          this.color.r += this.tempColor.r;
          this.color.g += this.tempColor.g;
          this.color.b += this.tempColor.b;
        }
        if (Math.abs(d) < 8) this.color.multiplyScalar(0.9);
        if (b.mountain > 0.1 && p.y > 75)
          this.color.lerp(this.snow, Math.min(0.7, (p.y - 75) / 180) * b.mountain);
        colors.push(this.color.r, this.color.g, this.color.b);
        if (r < rows - 1 && c < cols - 1) {
          const a = r * cols + c;
          indices.push(a, a + 1, a + cols, a + 1, a + cols + 1, a + cols);
        }
      }
    }
    const geo = group.getObjectByName('terrain').geometry;
    if (!geo.index) geo.setIndex(indices);
    updateGeometry(geo, positions, colors);
    const counts = Object.fromEntries(Object.keys(this.resources).map((k) => [k, 0]));
    const place = (name, p, scale, angle = 0) => {
      const mesh = group.getObjectByName(name),
        i = counts[name]++;
      this.dummy.position.set(p.x - anchor.x, p.y - anchor.y, p.z - anchor.z);
      this.dummy.rotation.set(0, angle, 0);
      this.dummy.scale.fromArray(scale);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(i, this.dummy.matrix);
    };
    for (let i = 0; i < 96; i++) {
      const id = start * 47 + i * 19,
        s = start + hash(id, this.path.seed) * 128,
        b = this.path.biomes.sample(s);
      if (hash(id + 9, this.path.seed) > b.trees * 0.91 + 0.02) continue;
      const d = (i % 2 ? -1 : 1) * (8.5 + hash(id + 1, this.path.seed) * 125);
      if (d > 0 && b.coast > 0.5) continue;
      const p = this.path.surface(s, d),
        height = 5 + hash(id + 2, this.path.seed) * 9,
        angle = hash(id + 3, this.path.seed) * 6.28;
      place('trunks', { ...p, y: p.y + height * 0.34 }, [1.1, height * 0.68, 1.1], angle);
      if (hash(id + 7, this.path.seed) < 0.7 + b.mountain * 0.25)
        for (let layer = 0; layer < 3; layer++) {
          place(
            'needles',
            { ...p, y: p.y + height * (0.45 + layer * 0.19) },
            [height * (0.23 - layer * 0.045), height * 0.5, height * (0.23 - layer * 0.045)],
            angle,
          );
        }
      else
        for (let layer = 0; layer < 2; layer++)
          place(
            'crowns',
            { x: p.x + layer * 0.5, y: p.y + height * (0.72 + layer * 0.12), z: p.z },
            [height * (0.29 - layer * 0.05), height * 0.25, height * 0.27],
            angle,
          );
    }
    for (let i = 0; i < 64; i++) {
      const id = start * 31 + i * 67,
        s = start + hash(id, this.path.seed + 1) * 128,
        b = this.path.biomes.sample(s);
      const distant = i >= 56,
        d =
          (i % 2 ? -1 : 1) *
          (distant
            ? 150 + hash(id + 1, this.path.seed) * 260
            : 7.9 + hash(id + 1, this.path.seed) * 90);
      if (d > 0 && b.coast > 0.6) continue;
      const p = this.path.surface(s, d),
        scale =
          (distant
            ? 12 + hash(id + 2, this.path.seed) * 33
            : 0.4 + hash(id + 2, this.path.seed) * 3.4) *
          (0.5 + b.rock);
      place(
        'rocks',
        { ...p, y: p.y + scale * 0.24 },
        [scale * 1.35, scale * (distant ? 1.4 : 0.7), scale],
        hash(id + 3, this.path.seed) * 6,
      );
    }
    for (let i = 0; i < 192; i++) {
      const id = start * 13 + i * 53,
        s = start + hash(id, this.path.seed + 3) * 128,
        d = (i % 2 ? -1 : 1) * (6.5 + hash(id + 1, this.path.seed) * 32),
        b = this.path.biomes.sample(s);
      if (d > 0 && b.coast > 0.5) continue;
      const p = this.path.surface(s, d),
        scale = 0.2 + hash(id + 2, this.path.seed) * 0.5;
      if (i < 128)
        place('shrubs', { ...p, y: p.y + scale * 0.45 }, [scale * 1.5, scale, scale * 1.3]);
      place(
        'grass',
        { ...p, y: p.y + 0.2 },
        [0.2, 0.4 + hash(id + 4, this.path.seed) * 0.4, 0.2],
        hash(id, this.path.seed) * 6,
      );
    }
    for (const name of Object.keys(counts)) {
      const mesh = group.getObjectByName(name);
      mesh.count = counts[name];
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    const water = group.getObjectByName('water'),
      wp = [];
    for (let s = start; s < start + 128; s += 4) {
      const vertices = [
        this.path.vertex(s, 18),
        this.path.vertex(s, 1000),
        this.path.vertex(s + 4, 18),
        this.path.vertex(s + 4, 1000),
      ];
      for (const i of [0, 1, 2, 1, 3, 2]) {
        const p = vertices[i];
        wp.push(p.x - anchor.x, 1 - anchor.y, p.z - anchor.z);
      }
    }
    updateGeometry(water.geometry, wp);
    water.visible = this.path.biomes.sample(start + 64).coast > 0.01;
  }
  dispose() {
    this.material.dispose();
    this.waterMaterial.dispose();
    for (const [g, m] of Object.values(this.resources)) {
      g.dispose();
      m.dispose();
    }
  }
}
