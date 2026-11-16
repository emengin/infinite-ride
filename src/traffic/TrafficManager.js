import * as THREE from 'three';
import { TrafficSimulation } from './TrafficSimulation.js';
import { VehicleFactory } from './VehicleFactory.js';
import { hash } from '../core/math.js';

const PALETTE = [0xe2ddd2, 0x386c83, 0xa64a35, 0x465453, 0xc5a868, 0x799083, 0x9dabb0, 0x373c49];
export class TrafficManager {
  constructor(scene, path, world, density = 'medium') {
    this.scene = scene;
    this.path = path;
    this.world = world;
    this.simulation = new TrafficSimulation(path, density);
    this.factory = new VehicleFactory();
    this.root = new THREE.Group();
    scene.add(this.root);
    this.meshes = this.factory.models.map((model) =>
      Object.fromEntries(
        Object.entries(model).map(([name, geometry]) => {
          const mesh = new THREE.InstancedMesh(geometry, this.factory.materials[name], 56);
          mesh.count = 0;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.root.add(mesh);
          return [name, mesh];
        }),
      ),
    );
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.reset(24);
  }
  reset(s) {
    this.simulation.reset(s);
  }
  update(dt, player, extra = []) {
    return this.simulation.update(dt, player, extra);
  }
  render(extra = []) {
    const counts = Array(7).fill(0),
      o = this.world.origin;
    for (const a of [...this.simulation.pool, ...extra]) {
      if (!a.active) continue;
      const p = this.path.surface(a.s, a.d),
        f = this.path.frame(a.s),
        i = counts[a.type]++;
      this.dummy.position.set(p.x - o.x, p.y - o.y + 0.035, p.z - o.z);
      this.dummy.rotation.set(f.pitch * a.dir, -f.heading - a.headingError, 0, 'YXZ');
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      for (const [name, mesh] of Object.entries(this.meshes[a.type])) {
        mesh.setMatrixAt(i, this.dummy.matrix);
        if (name === 'paint') {
          this.color.setHex(
            PALETTE[Math.floor(hash(a.id + 7, this.path.seed) * PALETTE.length) % PALETTE.length],
          );
          mesh.setColorAt(i, this.color);
        }
      }
    }
    this.meshes.forEach((model, type) =>
      Object.values(model).forEach((mesh) => {
        mesh.count = counts[type];
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
      }),
    );
  }
  dispose() {
    this.scene.remove(this.root);
    this.root.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
    });
    this.factory.dispose();
  }
}
