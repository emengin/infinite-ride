import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { damp } from '../core/math.js';

/** Original procedural IR/600. All lengths are metres; forward is local -Z. */
export class MotorcycleModel {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'IR-600 motorcycle';
    this.leanRoot = new THREE.Group();
    this.root.add(this.leanRoot);
    this.body = new THREE.Group();
    this.leanRoot.add(this.body);
    const material = (color, metalness = 0, roughness = 0.5) =>
      new THREE.MeshStandardMaterial({ color, metalness, roughness });
    this.materials = {
      paint: material(0xc8ed56, 0.42, 0.31),
      dark: material(0x20272a, 0.3, 0.43),
      rubber: material(0x171d20, 0, 0.92),
      metal: material(0xaab8bb, 0.8, 0.3),
      black: material(0x11191b, 0.1, 0.6),
      suit: material(0x283339, 0.05, 0.75),
      stripe: material(0xe7e9da, 0.1, 0.46),
      visor: material(0x182e37, 0.65, 0.17),
      lamp: new THREE.MeshStandardMaterial({
        color: 0xf9ffe8,
        emissive: 0xe9f7db,
        emissiveIntensity: 1.1,
      }),
      tail: new THREE.MeshStandardMaterial({
        color: 0xe93629,
        emissive: 0xff2415,
        emissiveIntensity: 0.7,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: 0x7dabb1,
        metalness: 0.3,
        roughness: 0.16,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    };
    this.geometries = new Set();
    this.unitBox = new THREE.BoxGeometry(1, 1, 1);
    this.unitSphere = new THREE.SphereGeometry(1, 16, 10);
    this.unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
    [this.unitBox, this.unitSphere, this.unitCylinder].forEach((g) => this.geometries.add(g));
    const m = this.materials;
    const body = this.body;
    this.rearWheel = this.wheel(body, 0, 0.34, 0.86);
    this.frontSteer = new THREE.Group();
    this.frontSteer.position.set(0, 0, -0.88);
    body.add(this.frontSteer);
    this.frontWheel = this.wheel(this.frontSteer, 0, 0.34, 0);
    // Swingarm, trellis frame and engine.
    for (const side of [-1, 1]) {
      this.beam(body, [side * 0.17, 0.41, 0.86], [side * 0.2, 0.65, 0.12], 0.048, m.dark);
      this.beam(body, [side * 0.22, 0.65, 0.12], [side * 0.22, 0.95, -0.48], 0.035, m.metal);
      this.beam(body, [side * 0.22, 0.65, 0.12], [side * 0.18, 1.02, 0.52], 0.035, m.dark);
      this.beam(this.frontSteer, [side * 0.18, 0.35, 0], [side * 0.18, 1.14, 0.18], 0.035, m.metal);
      this.beam(this.frontSteer, [side * 0.18, 0.35, 0], [side * 0.18, 0.72, 0.08], 0.052, m.dark);
    }
    this.sphere(body, [0, 0.65, 0.1], [0.27, 0.24, 0.32], m.dark);
    this.sphere(body, [0, 1.04, -0.08], [0.29, 0.25, 0.43], m.paint);
    this.box(body, [0, 1.12, 0.45], [0.38, 0.09, 0.48], m.black, [-0.08, 0, 0]);
    this.fairing(body, m.paint);
    this.box(body, [0, 1.12, 0.79], [0.3, 0.1, 0.32], m.paint, [-0.13, 0, 0]);
    this.box(body, [0, 1.1, 0.96], [0.26, 0.045, 0.05], m.tail);
    this.box(body, [0, 0.88, 1.12], [0.14, 0.12, 0.04], m.dark, [-0.3, 0, 0]);
    this.beam(body, [0.22, 0.53, 0.3], [0.34, 0.55, 0.92], 0.075, m.metal);
    this.beam(body, [0.34, 0.55, 0.92], [0.34, 0.58, 1.06], 0.055, m.black);
    this.box(body, [0, 0.59, -0.53], [0.42, 0.11, 0.55], m.dark);
    for (const side of [-1, 1]) {
      this.box(body, [side * 0.17, 1.0, -0.91], [0.16, 0.055, 0.05], m.lamp, [0.1, 0, side * 0.16]);
      this.box(body, [side * 0.265, 0.83, -0.39], [0.018, 0.07, 0.36], m.dark, [0.15, 0, 0]);
      this.beam(body, [side * 0.2, 0.7, 0.29], [side * 0.35, 0.7, 0.32], 0.025, m.metal);
      this.beam(
        this.frontSteer,
        [side * 0.12, 1.13, 0.2],
        [side * 0.38, 1.17, 0.21],
        0.025,
        m.dark,
      );
      this.box(this.frontSteer, [side * 0.36, 1.17, 0.21], [0.13, 0.045, 0.065], m.rubber);
      this.beam(body, [side * 0.2, 1.16, -0.7], [side * 0.42, 1.3, -0.73], 0.015, m.dark);
      this.sphere(body, [side * 0.43, 1.31, -0.73], [0.09, 0.042, 0.045], m.visor);
    }
    this.box(body, [0, 1.18, -0.62], [0.19, 0.08, 0.1], m.black, [-0.45, 0, 0]);
    this.box(body, [0, 1.218, -0.6], [0.14, 0.008, 0.06], m.lamp, [-0.45, 0, 0]);
    this.sphere(body, [0, 1.19, -0.8], [0.25, 0.24, 0.045], m.glass, [-0.42, 0, 0]);

    this.rider = new THREE.Group();
    body.add(this.rider);
    this.hips = this.sphere(this.rider, [0, 1.23, 0.45], [0.22, 0.17, 0.23], m.suit);
    this.torso = this.sphere(
      this.rider,
      [0, 1.55, 0.12],
      [0.25, 0.39, 0.17],
      m.suit,
      [-0.45, 0, 0],
    );
    this.box(this.rider, [0, 1.64, 0.274], [0.12, 0.2, 0.025], m.paint, [-0.45, 0, 0]);
    this.head = new THREE.Group();
    this.head.position.set(0, 1.98, -0.16);
    this.rider.add(this.head);
    this.sphere(this.head, [0, 0, 0], [0.205, 0.235, 0.24], m.stripe, [-0.15, 0, 0]);
    this.sphere(this.head, [0, 0.005, -0.157], [0.185, 0.105, 0.13], m.visor, [-0.13, 0, 0]);
    this.box(this.head, [0, 0.18, -0.02], [0.07, 0.04, 0.25], m.paint, [-0.2, 0, 0]);
    for (const side of [-1, 1]) {
      this.beam(this.rider, [side * 0.18, 1.24, 0.47], [side * 0.32, 0.94, -0.03], 0.105, m.suit);
      this.beam(this.rider, [side * 0.32, 0.94, -0.03], [side * 0.26, 0.67, 0.36], 0.075, m.suit);
      this.box(this.rider, [side * 0.27, 0.68, 0.26], [0.14, 0.14, 0.29], m.black, [0.1, 0, 0]);
      this.beam(this.rider, [side * 0.22, 1.66, 0.02], [side * 0.35, 1.4, -0.23], 0.075, m.suit);
      this.beam(this.rider, [side * 0.35, 1.4, -0.23], [side * 0.36, 1.18, -0.63], 0.06, m.suit);
      this.sphere(this.rider, [side * 0.36, 1.18, -0.63], [0.065, 0.055, 0.085], m.black);
    }
    this.pitch = 0;
    if (typeof document !== 'undefined') {
      this.instrumentCanvas = document.createElement('canvas');
      this.instrumentCanvas.width = 256;
      this.instrumentCanvas.height = 128;
      this.instrumentContext = this.instrumentCanvas.getContext('2d');
      this.instrumentTexture = new THREE.CanvasTexture(this.instrumentCanvas);
      this.instrumentTexture.colorSpace = THREE.SRGBColorSpace;
      this.instrumentMaterial = new THREE.MeshBasicMaterial({
        map: this.instrumentTexture,
        toneMapped: false,
      });
      const geometry = new THREE.PlaneGeometry(0.23, 0.115);
      this.geometries.add(geometry);
      this.instrument = this.mesh(
        body,
        geometry,
        this.instrumentMaterial,
        [0, 1.237, -0.58],
        null,
        [-0.65, 0, 0],
      );
      this.instrument.castShadow = false;
      this.instrument.receiveShadow = false;
      this.lastInstrumentSpeed = -1;
    }
    // Static pieces sharing paint/metal/etc. render in one call per material.
    // Steering, wheel spin and rider visibility keep their separate transforms.
    for (const group of [
      this.rearWheel,
      this.frontWheel,
      this.frontSteer,
      this.head,
      this.rider,
      this.body,
    ]) {
      this.mergeStatic(group, new Set([this.torso, this.instrument]));
    }
  }

  mesh(parent, geometry, material, position, scale, rotation) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    if (position) mesh.position.fromArray(position);
    if (scale) mesh.scale.fromArray(scale);
    if (rotation) mesh.rotation.set(...rotation);
    parent.add(mesh);
    return mesh;
  }
  box(parent, p, s, m, r) {
    return this.mesh(parent, this.unitBox, m, p, s, r);
  }
  sphere(parent, p, s, m, r) {
    return this.mesh(parent, this.unitSphere, m, p, s, r);
  }
  beam(parent, a, b, radius, material) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      delta = end.clone().sub(start);
    const mesh = this.mesh(
      parent,
      this.unitCylinder,
      material,
      start.clone().add(end).multiplyScalar(0.5).toArray(),
      [radius, delta.length(), radius],
    );
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return mesh;
  }

  wheel(parent, x, y, z) {
    const wheel = new THREE.Group();
    wheel.position.set(x, y, z);
    parent.add(wheel);
    const tire = new THREE.TorusGeometry(0.252, 0.083, 10, 24);
    const rim = new THREE.TorusGeometry(0.215, 0.021, 6, 20);
    const disc = new THREE.CylinderGeometry(0.167, 0.167, 0.012, 20);
    [tire, rim, disc].forEach((g) => this.geometries.add(g));
    this.mesh(wheel, tire, this.materials.rubber, null, null, [0, Math.PI / 2, 0]);
    this.mesh(wheel, rim, this.materials.metal, null, null, [0, Math.PI / 2, 0]);
    this.mesh(wheel, disc, this.materials.metal, [0.06, 0, 0], null, [0, 0, Math.PI / 2]);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      this.beam(
        wheel,
        [0, 0, 0],
        [0, Math.cos(angle) * 0.21, Math.sin(angle) * 0.21],
        0.018,
        this.materials.dark,
      );
    }
    return wheel;
  }

  fairing(parent, material) {
    const sections = [
      [-0.98, 0.98, 0.14, 0.13],
      [-0.6, 0.94, 0.31, 0.24],
      [-0.12, 0.85, 0.31, 0.29],
      [0.35, 0.9, 0.23, 0.2],
      [0.65, 0.96, 0.16, 0.11],
    ];
    const positions = [],
      indices = [];
    for (const [z, y, w, h] of sections) {
      for (const [dx, dy] of [
        [-0.7, 1],
        [0.7, 1],
        [1, 0.25],
        [0.65, -1],
        [-0.65, -1],
        [-1, 0.25],
      ])
        positions.push(dx * w, y + dy * h, z);
    }
    for (let r = 0; r < sections.length - 1; r++)
      for (let i = 0; i < 6; i++) {
        const a = r * 6 + i,
          b = r * 6 + ((i + 1) % 6),
          c = a + 6,
          d = b + 6;
        indices.push(a, c, b, b, c, d);
      }
    // Close the nose and tail so the fairing remains solid in every camera.
    for (let i = 1; i < 5; i++) {
      indices.push(0, i, i + 1);
      indices.push(24, 24 + i + 1, 24 + i);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    this.geometries.add(geo);
    return this.mesh(parent, geo, material);
  }

  mergeStatic(group, excluded) {
    const byMaterial = new Map();
    for (const child of [...group.children]) {
      if (!child.isMesh || excluded.has(child)) continue;
      child.updateMatrix();
      const copy = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
      copy.applyMatrix4(child.matrix);
      copy.deleteAttribute('uv');
      if (!byMaterial.has(child.material)) byMaterial.set(child.material, []);
      byMaterial.get(child.material).push(copy);
      group.remove(child);
    }
    for (const [material, parts] of byMaterial) {
      const geometry = mergeGeometries(parts);
      parts.forEach((g) => g.dispose());
      this.geometries.add(geometry);
      this.mesh(group, geometry, material);
    }
  }

  update(state, input, dt, helmet = false) {
    this.leanRoot.rotation.z = state.lean;
    this.pitch = damp(this.pitch, state.acceleration * 0.004, 8, dt);
    this.body.rotation.x = this.pitch;
    this.frontSteer.rotation.y = -state.steer * 0.17;
    const turn = (state.speed * dt) / 0.335;
    this.frontWheel.rotation.x -= turn;
    this.rearWheel.rotation.x -= turn;
    this.head.visible = !helmet;
    this.torso.visible = !helmet;
    this.materials.tail.emissiveIntensity = input.brake ? 3.5 : 0.7;
    const kmh = Math.round(state.speed * 3.6);
    if (this.instrumentContext && kmh !== this.lastInstrumentSpeed) {
      this.lastInstrumentSpeed = kmh;
      const context = this.instrumentContext;
      context.fillStyle = '#0b1d20';
      context.fillRect(0, 0, 256, 128);
      context.fillStyle = '#d9fa65';
      context.font = 'bold 68px monospace';
      context.textAlign = 'center';
      context.fillText(String(kmh).padStart(3, '0'), 128, 83);
      context.fillStyle = '#92c0b7';
      context.font = '18px monospace';
      context.fillText('IR/600    KM/H', 128, 113);
      context.fillStyle = '#d9fa65';
      context.fillRect(20, 12, Math.min(216, kmh), 5);
      this.instrumentTexture.needsUpdate = true;
    }
  }

  dispose() {
    this.geometries.forEach((g) => g.dispose());
    Object.values(this.materials).forEach((m) => m.dispose());
    this.instrumentTexture?.dispose();
    this.instrumentMaterial?.dispose();
  }
}
