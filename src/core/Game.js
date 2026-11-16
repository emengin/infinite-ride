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
import { TrafficManager } from '../traffic/TrafficManager.js';
import { CollisionSystem } from '../physics/CollisionSystem.js';
import { createTestDriver } from './TestDriver.js';
import { SaveManager } from './SaveManager.js';
import { SessionManager, MODES } from '../modes/SessionManager.js';
import { RaceManager } from '../modes/RaceManager.js';
import { RaceRenderer } from '../modes/RaceRenderer.js';

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
    this.path = new RoadPath(seed, query.get('biome') || 'auto');
    this.world = new WorldManager(this.renderer.scene, this.path);
    this.physics = new MotorcyclePhysics(this.path);
    this.traffic = new TrafficManager(
      this.renderer.scene,
      this.path,
      this.world,
      query.get('traffic') || 'medium',
    );
    this.collisions = new CollisionSystem();
    this.save = new SaveManager();
    this.session = new SessionManager();
    this.playMode = query.get('mode') in MODES ? query.get('mode') : 'free';
    this.race = new RaceManager(this.path);
    this.raceRenderer = new RaceRenderer(this.renderer.scene, this.path, this.world);
    this.rideStats = { overtakes: 0, near: 0, crashes: 0 };
    this.motorcycle = new MotorcycleModel();
    this.renderer.scene.add(this.motorcycle.root);
    this.camera = new CameraController(this.renderer.camera, this.path, this.world);
    this.fixed = new FixedStep();
    this.input = new InputManager((action) => this.action(action));
    this.ui = new UIManager({
      start: () => this.start(),
      pause: () => this.action('pause'),
      resume: () => this.setMode(this.resumeMode || 'running'),
      restart: () => this.start(),
      menu: () => this.mainMenu(),
      camera: () => this.action('camera'),
      recover: () => this.recover(),
      selectMode: (value) => this.selectMode(value),
      finish: () => this.finish('ended'),
    });
    this.selectMode(this.playMode);
    document.getElementById('biome-select').value = this.path.biomes.choice;
    document.getElementById('traffic-select').value = this.traffic.simulation.density;
    document
      .getElementById('traffic-select')
      .addEventListener(
        'change',
        (event) => this.traffic.simulation.setDensity(event.target.value, this.physics.state.s),
        { signal: this.ui.abort.signal },
      );
    document.getElementById('biome-select').addEventListener(
      'change',
      (event) => {
        this.camera.rebase(this.world.setBiome(event.target.value, this.physics.state.s));
        this.camera.initialized = false;
      },
      { signal: this.ui.abort.signal },
    );
    this.abort = new AbortController();
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden && ['running', 'countdown'].includes(this.mode)) {
          this.resumeMode = this.mode;
          this.setMode('paused');
        }
        this.lastTime = 0;
        this.fixed.reset();
      },
      { signal: this.abort.signal },
    );
    window.addEventListener(
      'blur',
      () => {
        if (['running', 'countdown'].includes(this.mode)) {
          this.resumeMode = this.mode;
          this.setMode('paused');
        }
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
        value: Object.freeze({
          snapshot: () => this.snapshot(),
          ...(query.get('test') === '1' ? { test: createTestDriver(this) } : {}),
        }),
      });
    this.frame = this.frame.bind(this);
    this.frameId = requestAnimationFrame(this.frame);
  }

  setMode(mode, keepInput = false) {
    this.mode = mode;
    if (!keepInput) this.input.clear();
    this.fixed.reset();
    this.lastTime = 0;
    this.ui.mode(mode);
  }
  start() {
    this.physics.reset();
    this.session.reset(this.playMode);
    this.race.reset(this.physics.state.s);
    this.resumeMode = 'running';
    this.traffic.reset(this.physics.state.s);
    this.rideStats = { overtakes: 0, near: 0, crashes: 0 };
    this.camera.rebase(this.world.update(this.physics.state.s));
    this.camera.initialized = false;
    this.setMode(this.playMode === 'race' ? 'countdown' : 'running');
  }
  mainMenu() {
    this.physics.reset();
    this.camera.rebase(this.world.update(24));
    this.camera.initialized = false;
    this.setMode('intro');
  }
  action(action) {
    if (action === 'pause' && ['running', 'paused', 'countdown'].includes(this.mode)) {
      if (this.mode === 'paused') this.setMode(this.resumeMode || 'running');
      else {
        this.resumeMode = this.mode;
        this.setMode('paused');
      }
    }
    if (action === 'camera' && this.mode !== 'intro') {
      this.camera.cycle();
      this.ui.toast(CAMERA_LABELS_TURKISH[this.camera.mode]);
    }
    if (action === 'recover' && ['running', 'crashed'].includes(this.mode)) this.recover();
    if (action === 'debug') this.ui.toggleDebug();
  }

  recover() {
    this.session.penalty();
    if (this.playMode === 'race') this.race.penalty();
    this.physics.reset(this.physics.state.s, true);
    this.traffic.reset(this.physics.state.s);
    this.camera.initialized = false;
    this.setMode('running');
    this.ui.toast('Motosiklet güvenle sağ şeride alındı.');
  }
  step(dt, input) {
    const st = this.physics.state;
    st.prevS = st.s;
    st.prevD = st.d;
    this.physics.update(dt, input);
    const events = this.traffic.update(dt, st, this.playMode === 'race' ? this.race.actors : []);
    if (this.playMode === 'race') this.race.update(dt, st, this.traffic.simulation.actors);
    const hit = this.collisions.check(
      st,
      [...this.traffic.simulation.actors, ...(this.playMode === 'race' ? this.race.actors : [])],
      this.world,
    );
    if (hit && st.speed > 1) {
      this.rideStats.crashes++;
      this.lastCrash = hit;
      this.session.collision();
      st.speed = 0;
      if (this.playMode === 'rush') this.finish('crash');
      else this.setMode('crashed');
      this.ui.toast(
        hit.kind === 'vehicle'
          ? 'Araçla çarpıştın. R ile yola dön.'
          : 'Yol kenarına çarptın. R ile yola dön.',
      );
      return;
    }
    this.session.update(dt, st, events);
    for (const event of events) {
      if (event.type === 'near') {
        this.rideStats.near++;
        this.ui.toast(`Yakın geçiş · ${event.clearance.toFixed(2)} m`);
      }
      if (event.type === 'overtake') this.rideStats.overtakes++;
    }
    if (this.playMode === 'race' && this.race.finished) this.finish('finish');
  }

  selectMode(value) {
    this.playMode = value in MODES ? value : 'free';
    this.session.reset(this.playMode);
    this.ui.selectMode(this.playMode);
  }
  finish(reason) {
    this.session.finished = true;
    this.result = this.session.result(this.physics.state, {
      reason,
      ...(this.playMode === 'race'
        ? { time: this.race.time, position: this.race.position(this.physics.state) }
        : {}),
    });
    const record = this.playMode === 'free' ? null : this.save.record(this.playMode, this.result);
    this.setMode('results');
    this.ui.result(this.result, record);
  }

  frame(time) {
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.1) : 1 / 60;
    this.lastTime = time;
    this.fps += (1 / Math.max(dt, 0.001) - this.fps) * 0.035;
    if (this.mode === 'countdown' && this.race.tickCountdown(dt)) this.setMode('running', true);
    const input =
      this.mode === 'running' ? this.input.sample() : { throttle: 0, brake: 0, steer: 0 };
    if (this.mode === 'running')
      this.fixed.advance(dt, (step) => {
        if (this.mode === 'running') this.step(step, input);
      });
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
    if (this.mode === 'crashed') this.motorcycle.leanRoot.rotation.z = 0.95;
    if (this.mode !== 'paused') this.camera.update(dt, this.physics, pose, this.mode === 'intro');
    this.traffic.render(this.playMode === 'race' && this.mode !== 'intro' ? this.race.actors : []);
    this.raceRenderer.update(this.race, this.playMode === 'race' && this.mode !== 'intro');
    this.renderer.render(this.motorcycle.root.position);
    const biome = this.path.biomes.sample(this.physics.state.s);
    this.renderer.environment(biome);
    document.getElementById('biome-label').textContent = biome.label;
    this.ui.update(this.physics.state, input, this.camera.mode, time, this.stats());
    this.ui.session(
      this.session,
      this.playMode === 'race' ? this.race.snapshot(this.physics.state) : null,
      this.mode,
    );
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
      traffic: this.traffic.simulation.actors.length,
      trafficPool: this.traffic.simulation.pool.length,
    };
  }
  snapshot() {
    return {
      mode: this.mode,
      playMode: this.playMode,
      session: { score: this.session.score, combo: this.session.combo, time: this.session.time },
      race: this.playMode === 'race' ? this.race.snapshot(this.physics.state) : null,
      result: this.result || null,
      rideStats: { ...this.rideStats },
      traffic: this.traffic.simulation.actors.map((a) => ({
        id: a.id,
        type: a.type,
        s: a.s,
        d: a.d,
        dir: a.dir,
        speed: a.speed,
      })),
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
    this.traffic.dispose();
    this.raceRenderer.dispose();
    this.motorcycle.dispose();
    this.renderer.dispose();
    delete window.__ride;
  }
}

const CAMERA_LABELS_TURKISH = ['Takip kamerası', 'Kask kamerası', 'Geniş takip kamerası'];
