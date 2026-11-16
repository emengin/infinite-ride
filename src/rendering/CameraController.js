import * as THREE from 'three';
import { damp } from '../core/math.js';

export const CAMERA_LABELS = ['TAKİP KAMERASI', 'KASK KAMERASI', 'GENİŞ TAKİP'];

export class CameraController {
  constructor(camera, path, world) {
    this.camera = camera;
    this.path = path;
    this.world = world;
    this.mode = 0;
    this.initialized = false;
    this.target = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.smoothedLook = new THREE.Vector3();
    this.shift = new THREE.Vector3();
    this.previousPosition = new THREE.Vector3();
  }
  cycle() {
    this.mode = (this.mode + 1) % CAMERA_LABELS.length;
    this.initialized = false;
  }
  rebase(delta) {
    if (!delta) return;
    this.shift.set(delta.x, delta.y, delta.z);
    this.camera.position.sub(this.shift);
    this.smoothedLook.sub(this.shift);
    this.previousPosition.sub(this.shift);
  }

  update(dt, physics, pose, menu = false) {
    const st = physics.state,
      o = this.world.origin;
    const p = { x: pose.x - o.x, y: pose.y - o.y, z: pose.z - o.z };
    if (this.initialized) {
      // Inherit translation before smoothing the framing. Otherwise 200 km/h
      // adds ~8 m of lag and makes the motorcycle disappear into the distance.
      this.shift.set(p.x, p.y, p.z).sub(this.previousPosition);
      this.camera.position.add(this.shift);
      this.smoothedLook.add(this.shift);
    }
    this.previousPosition.set(p.x, p.y, p.z);
    const forward = { x: Math.sin(pose.heading), z: -Math.cos(pose.heading) };
    const right = { x: Math.cos(pose.heading), z: Math.sin(pose.heading) };
    const helmet = this.mode === 1 && !menu;
    if (menu) {
      this.target.set(
        p.x + right.x * 4.5 - forward.x * 4.8,
        p.y + 2.7,
        p.z + right.z * 4.5 - forward.z * 4.8,
      );
      this.look.set(p.x, p.y + 1, p.z);
    } else if (helmet) {
      // At visor height above the tank, with the head hidden, never inside the fairing.
      this.target.set(p.x - forward.x * 0.08, p.y + 1.9, p.z - forward.z * 0.08);
      this.look.set(
        p.x + forward.x * 38,
        p.y + 1.9 + Math.sin(pose.pitch) * 38 - 9.5,
        p.z + forward.z * 38,
      );
      this.target.x += Math.sin(st.lean) * 0.09 * right.x;
      this.target.z += Math.sin(st.lean) * 0.09 * right.z;
    } else {
      const wide = this.mode === 2;
      const portrait = this.camera.aspect < 0.8;
      const distance = (wide ? 10 : 5.9) + (portrait ? 2.4 : 0) + st.speed * 0.022;
      const side = wide ? 2.3 : 0;
      this.target.set(
        p.x - forward.x * distance + right.x * side,
        p.y + (wide ? 4.6 : 2.55) + (portrait ? 0.5 : 0),
        p.z - forward.z * distance + right.z * side,
      );
      const ahead = this.path.surface(st.s + 8 + st.speed * 0.1, st.d);
      this.look.set(ahead.x - o.x, ahead.y - o.y + 0.9, ahead.z - o.z);
      // The camera samples the terrain underneath its own route position.
      const floor = this.path.surface(st.s - distance, st.d + side).y - o.y + 0.8;
      this.target.y = Math.max(this.target.y, floor);
    }
    if (st.offroad && !menu && st.speed > 1) {
      const t = performance.now() * 0.001,
        amount = Math.min(0.055, st.speed * 0.0017);
      this.target.y += Math.sin(t * 71) * amount;
      this.target.x += Math.sin(t * 53) * amount * 0.5;
    }
    const rate = helmet ? 24 : menu ? 3.2 : 7.5;
    const alpha = this.initialized ? 1 - Math.exp(-rate * dt) : 1;
    this.camera.position.lerp(this.target, alpha);
    this.smoothedLook.lerp(this.look, this.initialized ? 1 - Math.exp(-10 * dt) : 1);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.smoothedLook);
    if (helmet) this.camera.rotateZ(st.lean * 0.13);
    const fov = menu
      ? 48
      : (helmet ? 69 : this.mode === 2 ? 60 : 57) + Math.min(st.speed / 63, 1) * 12;
    this.camera.fov = damp(this.camera.fov, fov, 4, dt);
    this.camera.updateProjectionMatrix();
    this.initialized = true;
  }
}
