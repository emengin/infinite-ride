import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VEHICLES } from './TrafficSimulation.js';

export class VehicleFactory {
  constructor() {
    this.materials = {
      paint: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4, roughness: 0.34 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x29444c, metalness: 0.55, roughness: 0.2 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x252c2c, roughness: 0.8 }),
      head: new THREE.MeshStandardMaterial({
        color: 0xfff4cd,
        emissive: 0xffebb5,
        emissiveIntensity: 0.6,
      }),
      tail: new THREE.MeshStandardMaterial({
        color: 0xb4281b,
        emissive: 0xe83422,
        emissiveIntensity: 0.5,
      }),
    };
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.sphere = new THREE.SphereGeometry(1, 10, 7);
    this.wheel = new THREE.CylinderGeometry(1, 1, 1, 12);
    this.dummy = new THREE.Object3D();
    this.models = VEHICLES.map((config, type) => this.build(config, type));
    this.box.dispose();
    this.sphere.dispose();
    this.wheel.dispose();
  }
  build(c, type) {
    const parts = Object.fromEntries(Object.keys(this.materials).map((k) => [k, []]));
    const add = (part, p, scale, geometry = this.box, rotation = [0, 0, 0]) => {
      this.dummy.position.fromArray(p);
      this.dummy.scale.fromArray(scale);
      this.dummy.rotation.set(...rotation);
      this.dummy.updateMatrix();
      const g = geometry.toNonIndexed();
      g.applyMatrix4(this.dummy.matrix);
      g.deleteAttribute('uv');
      parts[part].push(g);
    };
    const w = c.width,
      l = c.length;
    if (type === 6) {
      add('paint', [0, 0.85, -0.1], [0.5, 0.42, 1.25], this.sphere);
      add('trim', [0, 0.94, 0.5], [0.48, 0.12, 0.7]);
      add('trim', [0, 1.27, 0.28], [0.52, 0.58, 0.34], this.sphere, [0.25, 0, 0]);
      add('paint', [0, 1.76, 0.05], [0.4, 0.43, 0.43], this.sphere);
      add('glass', [0, 1.8, -0.13], [0.34, 0.16, 0.1], this.sphere);
      for (const z of [-0.78, 0.78])
        add('trim', [0, 0.32, z], [0.31, 0.16, 0.31], this.wheel, [0, 0, Math.PI / 2]);
      add('head', [0, 0.99, -0.77], [0.2, 0.1, 0.08]);
      add('tail', [0, 0.97, 0.82], [0.22, 0.08, 0.08]);
    } else {
      add('paint', [0, 0.65, 0], [w, 0.52, l * 0.93]);
      add('trim', [0, 0.36, 0], [w * 0.93, 0.19, l * 0.89]);
      if (type === 4) {
        add('paint', [0, 1.22, -l * 0.32], [w, 1.38, l * 0.27]);
        add('glass', [0, 1.56, -l * 0.464], [w * 0.83, 0.6, 0.04]);
        add('paint', [0, 1.92, l * 0.16], [w * 0.98, 2.8, l * 0.65]);
        add('trim', [0, 0.65, l * 0.15], [w * 0.9, 0.2, l * 0.67]);
        for (const x of [-1, 1])
          add('glass', [x * w * 0.505, 1.58, -l * 0.33], [0.025, 0.6, l * 0.18]);
      } else if (type === 5) {
        add('paint', [0, 1.72, 0], [w, 2.3, l * 0.96]);
        add('glass', [0, 2.12, -l * 0.488], [w * 0.85, 1.14, 0.035]);
        for (const x of [-1, 1])
          for (let i = 0; i < 7; i++)
            add('glass', [x * w * 0.505, 2.25, -l * 0.35 + i * l * 0.115], [0.03, 0.95, l * 0.094]);
        add('trim', [0, 1.13, 0], [w * 1.01, 0.13, l * 0.96]);
      } else {
        const roofY = type === 2 ? 1.52 : type === 3 ? 1.01 : 1.22,
          roofH = type === 2 ? 0.56 : 0.42;
        add('paint', [0, roofY, -0.04], [w * 0.78, 0.16, l * 0.44]);
        add('glass', [0, roofY - roofH * 0.5, -0.02], [w * 0.8, roofH, l * 0.46]);
        for (const x of [-1, 1]) {
          add('paint', [x * w * 0.42, roofY - roofH * 0.45, 0.02], [0.09, roofH, l * 0.43]);
          add(
            'paint',
            [x * w * 0.38, roofY - roofH * 0.45, -l * 0.22],
            [0.09, roofH, 0.11],
            this.box,
            [-0.35, 0, 0],
          );
          add('trim', [x * w * 0.54, 0.95, -l * 0.17], [0.17, 0.1, 0.24]);
          for (const z of [-l * 0.12, l * 0.15])
            add('trim', [x * w * 0.507, 0.75, z], [0.025, 0.025, 0.23]);
        }
        if (type === 3) add('paint', [0, 1.03, l * 0.36], [w * 0.98, 0.07, 0.24]);
      }
      const wheelR = type >= 4 ? 0.46 : type === 2 ? 0.38 : 0.32;
      for (const x of [-1, 1])
        for (const z of [-l * 0.31, l * 0.31]) {
          add('trim', [x * w * 0.47, wheelR, z], [wheelR, 0.24, wheelR], this.wheel, [
            0,
            0,
            Math.PI / 2,
          ]);
          add(
            'glass',
            [x * w * 0.53, wheelR, z],
            [wheelR * 0.55, 0.025, wheelR * 0.55],
            this.wheel,
            [0, 0, Math.PI / 2],
          );
        }
      for (const x of [-1, 1]) {
        add('head', [x * w * 0.34, 0.73, -l * 0.475], [w * 0.22, 0.16, 0.04]);
        add('tail', [x * w * 0.36, 0.76, l * 0.475], [w * 0.17, 0.14, 0.04]);
      }
      add('trim', [0, 0.57, -l * 0.478], [w * 0.4, 0.16, 0.035]);
      add('head', [0, 0.5, l * 0.48], [0.35, 0.1, 0.04]);
    }
    return Object.fromEntries(
      Object.entries(parts).map(([name, geometries]) => {
        const merged = mergeGeometries(geometries);
        geometries.forEach((g) => g.dispose());
        return [name, merged];
      }),
    );
  }
  dispose() {
    Object.values(this.materials).forEach((m) => m.dispose());
    this.models.forEach((model) => Object.values(model).forEach((g) => g.dispose()));
  }
}
