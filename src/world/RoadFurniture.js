import * as THREE from 'three';
import { ROAD } from './RoadPath.js';

export class RoadFurniture {
  constructor(path) {
    this.path = path;
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.metal = new THREE.MeshStandardMaterial({
      color: 0xb4bfb7,
      metalness: 0.55,
      roughness: 0.5,
    });
    this.white = new THREE.MeshStandardMaterial({ color: 0xe5e9d7, roughness: 0.8 });
    this.sign = new THREE.MeshStandardMaterial({ color: 0xe4d27c, roughness: 0.8 });
    this.dummy = new THREE.Object3D();
  }
  create() {
    const group = new THREE.Group();
    for (const [name, material, count] of [
      ['rails', this.metal, 64],
      ['posts', this.metal, 64],
      ['markers', this.white, 32],
      ['signs', this.sign, 2],
    ]) {
      const mesh = new THREE.InstancedMesh(this.box, material, count);
      mesh.name = name;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }
  rebuild(group, start, anchor) {
    const counts = { rails: 0, posts: 0, markers: 0, signs: 0 };
    const place = (name, s, d, y, scale, rotation = 0) => {
      const p = this.path.roadPoint(s, d),
        f = this.path.frame(s),
        mesh = group.getObjectByName(name),
        o = this.dummy;
      o.position.set(p.x - anchor.x, p.y - anchor.y + y, p.z - anchor.z);
      o.rotation.set(f.pitch, -f.heading + rotation, 0, 'YXZ');
      o.scale.fromArray(scale);
      o.updateMatrix();
      mesh.setMatrixAt(counts[name]++, o.matrix);
    };
    for (let offset = 0; offset < 128; offset += 8) {
      const s = start + offset,
        b = this.path.biomes.sample(s),
        f = this.path.frame(s);
      for (const side of [-1, 1]) {
        if (
          b.mountain > 0.35 ||
          b.coast > 0.35 ||
          Math.abs(f.curvature) > 0.0016 ||
          this.path.structure(s).type
        ) {
          place('rails', s + 4, side * 5.55, 0.78, [0.1, 0.2, 8.15]);
          place('posts', s, side * 5.55, 0.4, [0.12, 0.8, 0.12]);
        }
        if (offset % 16 === 0) place('markers', s, side * 5.13, 0.43, [0.12, 0.85, 0.12]);
      }
    }
    const curve = this.path.frame(start + 64).curvature;
    place('posts', start + 58, 6.7, 1, [0.08, 2, 0.08]);
    place('signs', start + 58, 6.7, 2, [0.65, 0.65, 0.07], Math.PI / 4);
    // Raised arrow/chevron on the warning sign.
    place('markers', start + 57.94, 6.7, 2, [0.08, 0.35, 0.08], curve > 0 ? -0.45 : 0.45);
    for (const mesh of group.children) {
      mesh.count = counts[mesh.name];
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }
  dispose() {
    this.box.dispose();
    this.metal.dispose();
    this.white.dispose();
    this.sign.dispose();
  }
}
