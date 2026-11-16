import * as THREE from 'three';
import { updateGeometry } from './RoadGenerator.js';

export class RoadStructures {
  constructor(path) {
    this.path = path;
    this.dummy = new THREE.Object3D();
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.rim = new THREE.TorusGeometry(7.8, 0.32, 5, 24, Math.PI);
    this.concrete = new THREE.MeshStandardMaterial({
      color: 0x969f9a,
      roughness: 0.93,
      side: THREE.DoubleSide,
    });
    this.interior = new THREE.MeshStandardMaterial({
      color: 0x696f70,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    this.led = new THREE.MeshStandardMaterial({
      color: 0xf8e0ac,
      emissive: 0xffdb8c,
      emissiveIntensity: 2,
    });
  }
  create() {
    const group = new THREE.Group();
    for (const [name, mat] of [
      ['deck', this.concrete],
      ['tunnel', this.interior],
    ]) {
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      mesh.name = name;
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
    for (const [name, geo, mat, count] of [
      ['pillars', this.box, this.concrete, 8],
      ['rims', this.rim, this.concrete, 2],
      ['lamps', this.box, this.led, 8],
    ]) {
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.name = name;
      mesh.count = 0;
      mesh.castShadow = name === 'pillars';
      group.add(mesh);
    }
    return group;
  }
  rebuild(group, start, anchor) {
    const info = this.path.structure(start + 64),
      bridge = info.type === 'bridge',
      tunnel = info.type === 'tunnel';
    group.visible = bridge || tunnel;
    const deck = group.getObjectByName('deck'),
      roof = group.getObjectByName('tunnel');
    deck.visible = bridge;
    roof.visible = tunnel;
    const positions = [],
      quad = (points) => {
        for (const i of [0, 1, 2, 1, 3, 2]) {
          const p = points[i];
          positions.push(p.x - anchor.x, p.y - anchor.y, p.z - anchor.z);
        }
      };
    const point = (s, d, y = 0) => {
      const p = this.path.roadPoint(s, d);
      return { ...p, y: p.y + y };
    };
    for (let s = start; s < start + 128; s += 4) {
      const a = point(s, -5.8, -0.06),
        b = point(s, 5.8, -0.06),
        c = point(s + 4, -5.8, -0.06),
        d = point(s + 4, 5.8, -0.06),
        down = (p) => ({ ...p, y: p.y - 0.65 });
      quad([a, b, c, d]);
      quad([a, c, down(a), down(c)]);
      quad([b, down(b), d, down(d)]);
      quad([down(a), down(c), down(b), down(d)]);
    }
    updateGeometry(deck.geometry, positions);
    const rp = [],
      indices = [],
      segments = 24;
    for (let row = 0; row <= 32; row++) {
      const s = start + row * 4,
        f = this.path.frame(s);
      for (let col = 0; col <= segments; col++) {
        const angle = (col / segments) * Math.PI,
          d = Math.cos(angle) * 7.5,
          y = Math.sin(angle) * 7.5 + 0.15;
        rp.push(f.x + f.rx * d - anchor.x, f.y + y - anchor.y, -s + f.rz * d - anchor.z);
        if (row < 32 && col < segments) {
          const a = row * (segments + 1) + col;
          indices.push(a, a + 1, a + segments + 1, a + 1, a + segments + 2, a + segments + 1);
        }
      }
    }
    if (!roof.geometry.index) roof.geometry.setIndex(indices);
    updateGeometry(roof.geometry, rp);
    const counts = { pillars: 0, rims: 0, lamps: 0 };
    const place = (name, s, d, y, scale) => {
      const p = point(s, d, y),
        f = this.path.frame(s),
        o = this.dummy,
        mesh = group.getObjectByName(name);
      o.position.set(p.x - anchor.x, p.y - anchor.y, p.z - anchor.z);
      o.rotation.set(0, -f.heading, 0);
      o.scale.fromArray(scale);
      o.updateMatrix();
      mesh.setMatrixAt(counts[name]++, o.matrix);
    };
    if (bridge)
      for (let offset = 16; offset < 128; offset += 32)
        for (const side of [-1, 1])
          place('pillars', start + offset, side * 4.3, -12, [0.85, 23, 0.85]);
    if (tunnel) {
      for (const s of [start, start + 128]) place('rims', s, 0, 0.15, [1, 1, 1]);
      for (let offset = 16; offset < 128; offset += 32)
        for (const side of [-1, 1])
          place('lamps', start + offset, side * 6, 4.15, [0.15, 0.16, 1.5]);
    }
    for (const name of Object.keys(counts)) {
      const mesh = group.getObjectByName(name);
      mesh.count = counts[name];
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }
  dispose() {
    this.box.dispose();
    this.rim.dispose();
    this.concrete.dispose();
    this.interior.dispose();
    this.led.dispose();
  }
}
