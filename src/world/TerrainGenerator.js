import * as THREE from 'three';
import { ROAD, LATERAL } from './RoadPath.js';
import { hash, noise } from '../core/math.js';
import { updateGeometry } from './RoadGenerator.js';

export class TerrainGenerator {
  constructor(path) {
    this.path = path;
    this.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
    // Sparse original scenery supports depth in the core. Full biomes are Stage 2.
    this.crownGeometry = new THREE.IcosahedronGeometry(1, 1);
    this.trunkGeometry = new THREE.CylinderGeometry(0.11, 0.19, 1, 5);
    this.rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    this.crownMaterial = new THREE.MeshStandardMaterial({
      color: 0x506850,
      roughness: 1,
      flatShading: true,
    });
    this.trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x655949, roughness: 1 });
    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0a18a,
      roughness: 1,
      flatShading: true,
    });
    this.dummy = new THREE.Object3D();
    this.lowColor = new THREE.Color(0x8e9b65);
    this.highColor = new THREE.Color(0xaeb27b);
  }

  create() {
    const group = new THREE.Group();
    const terrain = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    terrain.receiveShadow = true;
    terrain.name = 'terrain';
    const crowns = new THREE.InstancedMesh(this.crownGeometry, this.crownMaterial, 32);
    const trunks = new THREE.InstancedMesh(this.trunkGeometry, this.trunkMaterial, 16);
    const rocks = new THREE.InstancedMesh(this.rockGeometry, this.rockMaterial, 14);
    crowns.castShadow = trunks.castShadow = true;
    crowns.name = 'crowns';
    trunks.name = 'trunks';
    rocks.name = 'rocks';
    group.add(terrain, crowns, trunks, rocks);
    return group;
  }

  rebuild(group, start, anchor) {
    const rows = ROAD.chunkLength / ROAD.step + 1,
      cols = LATERAL.length;
    const positions = [],
      colors = [],
      indices = [];
    const color = new THREE.Color();
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const s = start + r * ROAD.step,
          d = LATERAL[c],
          p = this.path.vertex(s, d);
        positions.push(p.x - anchor.x, p.y - anchor.y - 0.015, p.z - anchor.z);
        const shade = (noise(s / 65 + d / 45, this.path.seed + 49) + 1) / 2;
        color.copy(this.lowColor).lerp(this.highColor, shade);
        if (Math.abs(d) < 8) color.multiplyScalar(0.92);
        colors.push(color.r, color.g, color.b);
        if (r < rows - 1 && c < cols - 1) {
          const a = r * cols + c,
            b = a + 1,
            c0 = a + cols,
            e = c0 + 1;
          indices.push(a, b, c0, b, e, c0);
        }
      }
    const geometry = group.children[0].geometry;
    if (!geometry.index) geometry.setIndex(indices);
    updateGeometry(geometry, positions, colors);
    const [, crowns, trunks, rocks] = group.children;
    const dummy = this.dummy;
    for (let i = 0; i < 16; i++) {
      const id = start * 47 + i * 19;
      const s = start + hash(id, this.path.seed) * ROAD.chunkLength;
      const side = i % 2 === 0 ? -1 : 1;
      const d = side * (16 + hash(id + 1, this.path.seed) * 108);
      const p = this.path.surface(s, d),
        height = 3.5 + hash(id + 2, this.path.seed) * 3.8;
      dummy.position.set(p.x - anchor.x, p.y - anchor.y + height * 0.37, p.z - anchor.z);
      dummy.rotation.set(0, hash(id + 3, this.path.seed) * 6.28, 0);
      dummy.scale.set(1, height * 0.74, 1);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      for (let layer = 0; layer < 2; layer++) {
        dummy.position.set(
          p.x - anchor.x + layer * 0.6,
          p.y - anchor.y + height * (0.72 + layer * 0.16),
          p.z - anchor.z,
        );
        dummy.scale.set(
          height * (0.34 - layer * 0.07),
          height * 0.3,
          height * (0.31 - layer * 0.04),
        );
        dummy.updateMatrix();
        crowns.setMatrixAt(i * 2 + layer, dummy.matrix);
      }
    }
    for (let i = 0; i < 14; i++) {
      const id = start * 31 + i * 67;
      const s = start + hash(id, this.path.seed + 1) * ROAD.chunkLength;
      const d = (i % 2 ? -1 : 1) * (9 + hash(id + 1, this.path.seed + 1) * 58);
      const p = this.path.surface(s, d),
        scale = 0.4 + hash(id + 2, this.path.seed) * 1.1;
      dummy.position.set(p.x - anchor.x, p.y - anchor.y + scale * 0.23, p.z - anchor.z);
      dummy.rotation.set(0.2, hash(id + 3, this.path.seed) * 6, 0);
      dummy.scale.set(scale * 1.4, scale * 0.8, scale);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    for (const mesh of [crowns, trunks, rocks]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  dispose() {
    for (const resource of [
      this.material,
      this.crownGeometry,
      this.trunkGeometry,
      this.rockGeometry,
      this.crownMaterial,
      this.trunkMaterial,
      this.rockMaterial,
    ])
      resource.dispose();
  }
}
