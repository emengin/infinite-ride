import * as THREE from 'three';
export class RaceRenderer {
  constructor(scene, path, world) {
    this.scene = scene;
    this.path = path;
    this.world = world;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.pole = new THREE.MeshStandardMaterial({ color: 0xe5e8d7, metalness: 0.4, roughness: 0.5 });
    this.flag = new THREE.MeshStandardMaterial({
      color: 0xd9fa65,
      emissive: 0xd9fa65,
      emissiveIntensity: 0.15,
    });
    this.dark = new THREE.MeshStandardMaterial({ color: 0x182326, roughness: 0.8 });
    const box = (x, y, z, w, h, d, mat) => {
      const mesh = new THREE.Mesh(this.geometry, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      this.root.add(mesh);
    };
    box(-5.4, 2.3, 0, 0.15, 4.6, 0.15, this.pole);
    box(5.4, 2.3, 0, 0.15, 4.6, 0.15, this.pole);
    box(0, 4.3, 0, 11, 0.7, 0.12, this.flag);
    for (let i = 0; i < 18; i++)
      for (let j = 0; j < 2; j++)
        if ((i + j) % 2 === 0)
          box(-5.2 + i * 0.6, 4.15 + j * 0.3, -0.073, 0.6, 0.3, 0.015, this.dark);
  }
  update(race, visible) {
    this.root.visible = visible;
    if (!visible) return;
    const target =
      race.checkpoint < 3 ? race.start + (race.checkpoint + 1) * 750 : race.start + race.length;
    const p = this.path.surface(target, 0),
      f = this.path.frame(target);
    this.world.toLocal(p, this.root.position);
    this.root.rotation.set(f.pitch, -f.heading, 0, 'YXZ');
    this.flag.color.setHex(race.checkpoint < 3 ? 0xd9fa65 : 0xf2e6c2);
  }
  dispose() {
    this.scene.remove(this.root);
    this.geometry.dispose();
    this.pole.dispose();
    this.flag.dispose();
    this.dark.dispose();
  }
}
