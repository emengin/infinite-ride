import * as THREE from 'three';
import { ROAD } from './RoadPath.js';
import { hash } from '../core/math.js';

export function updateGeometry(geometry, positions, colors, uvs) {
  const update = (name, data, size) => {
    if (!data) return;
    const attribute = geometry.getAttribute(name);
    if (attribute && attribute.array.length === data.length) {
      attribute.array.set(data);
      attribute.needsUpdate = true;
    } else geometry.setAttribute(name, new THREE.Float32BufferAttribute(data, size));
  };
  update('position', positions, 3);
  update('color', colors, 3);
  update('uv', uvs, 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
}

export class RoadGenerator {
  constructor(path) {
    this.path = path;
    const size = 128;
    const pixels = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const n = Math.round(98 + hash(i, 71) * 35);
      pixels.set([n, n + 2, n + 1, 255], i * 4);
    }
    this.texture = new THREE.DataTexture(pixels, size, size);
    this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.needsUpdate = true;
    this.materials = {
      asphalt: new THREE.MeshStandardMaterial({
        color: 0x596263,
        map: this.texture,
        roughness: 0.97,
      }),
      shoulder: new THREE.MeshStandardMaterial({ color: 0x98927a, roughness: 1 }),
      lines: new THREE.MeshStandardMaterial({ color: 0xf0e8c7, roughness: 0.9 }),
    };
  }

  create() {
    const group = new THREE.Group();
    for (const [name, material] of Object.entries(this.materials)) {
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
      mesh.name = name;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }

  rebuild(group, start, anchor) {
    const strips = {
      asphalt: [
        [-ROAD.halfWidth, 0],
        [0, ROAD.halfWidth],
      ],
      shoulder: [
        [-ROAD.shoulder, -ROAD.halfWidth],
        [ROAD.halfWidth, ROAD.shoulder],
      ],
      lines: [
        [-4.27, -4.14],
        [4.14, 4.27],
      ],
    };
    for (const mesh of group.children) {
      const positions = [],
        uvs = [];
      const lift = mesh.name === 'lines' ? 0.045 : mesh.name === 'asphalt' ? 0.025 : 0.012;
      const quad = (s0, s1, d0, d1) => {
        const points = [
          this.path.roadPoint(s0, d0, lift),
          this.path.roadPoint(s0, d1, lift),
          this.path.roadPoint(s1, d0, lift),
          this.path.roadPoint(s1, d1, lift),
        ];
        const uv = [
          [d0 / 4, s0 / 4],
          [d1 / 4, s0 / 4],
          [d0 / 4, s1 / 4],
          [d1 / 4, s1 / 4],
        ];
        for (const i of [0, 1, 2, 1, 3, 2]) {
          const p = points[i];
          positions.push(p.x - anchor.x, p.y - anchor.y, p.z - anchor.z);
          // Modulo at a 128 m chunk boundary avoids ever-growing texture coordinates.
          uvs.push(uv[i][0], uv[i][1] - start / 4);
        }
      };
      for (let s = start; s < start + ROAD.chunkLength; s += ROAD.step) {
        for (const [d0, d1] of strips[mesh.name]) quad(s, s + ROAD.step, d0, d1);
        if (mesh.name === 'lines') {
          const width = (((s / 4) % 3) + 3) % 3 === 0 ? 0.07 : 0;
          quad(s, s + ROAD.step, -width, width);
        }
      }
      updateGeometry(mesh.geometry, positions, null, uvs);
    }
  }

  dispose() {
    Object.values(this.materials).forEach((m) => m.dispose());
    this.texture.dispose();
  }
}
