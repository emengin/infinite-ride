import { Renderer } from '../rendering/Renderer.js';
import { RoadPath } from '../world/RoadPath.js';
import { WorldManager } from '../world/WorldManager.js';
import { MotorcyclePhysics } from '../motorcycle/MotorcyclePhysics.js';
import { MotorcycleModel } from '../motorcycle/MotorcycleModel.js';
import { CameraController } from '../rendering/CameraController.js';
import { InputManager } from './InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { FixedStep } from './FixedStep.js';
import { seedFromString } from './math.js';

export class Game {
  constructor(canvas) {
    this.mode = 'intro';
    this.fps = 60;
    this.lastTime = 0;
    this.frameId = 0;
    this.renderer = new Renderer(canvas);
    const query = new URLSearchParams(location.search),
      seedText = query.get('seed');
    const seed = seedText === null ? 7049 : seedFromString(seedText);
    this.path = new RoadPath(seed);
    this.world = new WorldManager(this.renderer.scene, this.path);
    this.physics = new MotorcyclePhysics(this.path);
    this.motorcycle = new MotorcycleModel();
    this.renderer.scene.add(this.motorcycle.root);
    this.camera = new CameraController(this.renderer.camera, this.path, this.world);
    this.fixed = new FixedStep();
    this.input = new InputManager((action) => this.action(action));
    this.ui = new UIManager({
      start: () => this.start(),
      pause: () => this.action('pause'),
      resume: () => this.setMode('running'),
      restart: () => this.start(),
      menu: () => this.mainMenu(),
      camera: () => this.action('camera'),
    });
    this.abort = new AbortController();
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden && this.mode === 'running') this.setMode('paused');
        this.lastTime = 0;
        this.fixed.reset();
      },
      { signal: this.abort.signal },
    );
    window.addEventListener(
      'blur',
      () => {
        if (this.mode === 'running') this.setMode('paused');
      },
      { signal: this.abort.signal },
    );
    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        this.setMode('paused');
        this.ui.error(
          'Grafik bağlantısı kesildi. Açık sekmeleri azaltıp oyunu yeniden yükleyebilirsin.',
        );
      },
      { signal: this.abort.signal },
    );
    this.setMode('intro');
    if (query.has('debug')) this.ui.toggleDebug();
    // Read-only observability for regression tests and local diagnostics.
    if (import.meta.env.DEV || query.has('debug'))
      Object.defineProperty(window, '__ride', {
        configurable: true,
        value: Object.freeze({ snapshot: () => this.snapshot() }),
      });
    this.frame = this.frame.bind(this);
    this.frameId = requestAnimationFrame(this.frame);
  }

  setMode(mode) {
    this.mode = mode;
    this.input.clear();
    this.fixed.reset();
    this.lastTime = 0;
    this.ui.mode(mode);
  }
  start() {
    this.physics.reset();
    this.camera.rebase(this.world.update(this.physics.state.s));
    this.camera.initialized = false;
    this.setMode('running');
  }
  mainMenu() {
    this.physics.reset();
    this.camera.rebase(this.world.update(24));
    this.camera.initialized = false;
    this.setMode('intro');
  }
  action(action) {
    if (action === 'pause' && this.mode !== 'intro')
      this.setMode(this.mode === 'running' ? 'paused' : 'running');
    if (action === 'camera' && this.mode !== 'intro') {
      this.camera.cycle();
      this.ui.toast(CAMERA_LABELS_TURKISH[this.camera.mode]);
    }
    if (action === 'recover' && this.mode === 'running') {
      this.physics.reset(this.physics.state.s, true);
      this.input.clear();
      this.camera.initialized = false;
      this.ui.toast('Motosiklet güvenle sağ şeride alındı.');
    }
    if (action === 'debug') this.ui.toggleDebug();
  }

  frame(time) {
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.1) : 1 / 60;
    this.lastTime = time;
    this.fps += (1 / Math.max(dt, 0.001) - this.fps) * 0.035;
    const input =
      this.mode === 'running' ? this.input.sample() : { throttle: 0, brake: 0, steer: 0 };
    if (this.mode === 'running') this.fixed.advance(dt, (step) => this.physics.update(step, input));
    this.camera.rebase(this.world.update(this.physics.state.s));
    const pose = this.physics.pose();
    this.world.toLocal(pose, this.motorcycle.root.position);
    this.motorcycle.root.position.y += 0.04;
    this.motorcycle.root.rotation.set(pose.pitch, -pose.heading, 0, 'YXZ');
    this.motorcycle.update(
      this.physics.state,
      input,
      this.mode === 'running' ? dt : 0,
      this.camera.mode === 1 && this.mode !== 'intro',
    );
    if (this.mode !== 'paused') this.camera.update(dt, this.physics, pose, this.mode === 'intro');
    this.renderer.render(this.motorcycle.root.position);
    this.ui.update(this.physics.state, input, this.camera.mode, time, this.stats());
    this.frameId = requestAnimationFrame(this.frame);
  }

  stats() {
    const info = this.renderer.webgl.info;
    return {
      fps: this.fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      chunks: this.world.chunks.length,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      recycled: this.world.recycled,
      origin: this.world.origin.s,
      seed: this.path.seed,
    };
  }
  snapshot() {
    return {
      mode: this.mode,
      physics: { ...this.physics.state },
      pose: this.physics.pose(),
      stats: this.stats(),
      camera: {
        mode: this.camera.mode,
        fov: this.renderer.camera.fov,
        position: this.renderer.camera.position.toArray(),
      },
      chunkIndices: this.world.chunks.map((c) => c.index).sort((a, b) => a - b),
    };
  }
  dispose() {
    cancelAnimationFrame(this.frameId);
    this.abort.abort();
    this.input.dispose();
    this.ui.dispose();
    this.world.dispose();
    this.motorcycle.dispose();
    this.renderer.dispose();
    delete window.__ride;
  }
}

const CAMERA_LABELS_TURKISH = ['Takip kamerası', 'Kask kamerası', 'Geniş takip kamerası'];
