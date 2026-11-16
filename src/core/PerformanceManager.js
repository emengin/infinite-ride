import { clamp } from './math.js';
export class PerformanceManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.settings = { quality: 'high', resolution: 1 };
    this.scale = 1;
    this.elapsed = 0;
    this.samples = 0;
    this.total = 0;
  }
  apply(settings) {
    this.settings = settings;
    this.scale = 1;
    this.elapsed = 0;
    this.samples = 0;
    this.total = 0;
    this.renderer.webgl.shadowMap.enabled = settings.quality !== 'low';
    this.resize();
  }
  resize() {
    const cap = { low: 1, medium: 1.3, high: 1.65 }[this.settings.quality] || 1.65;
    this.pixelRatio =
      Math.min(globalThis.devicePixelRatio || 1, cap) * this.settings.resolution * this.scale;
    this.renderer.webgl.setPixelRatio(this.pixelRatio);
    this.renderer.resize();
  }
  update(dt, running) {
    if (!running) return;
    this.elapsed += dt;
    this.total += dt;
    this.samples++;
    if (this.elapsed < 3) return;
    const fps = this.samples / this.total;
    const old = this.scale;
    if (fps < 43) this.scale = clamp(this.scale - 0.12, 0.58, 1);
    else if (fps > 58) this.scale = clamp(this.scale + 0.04, 0.58, 1);
    if (old !== this.scale) this.resize();
    this.elapsed = 0;
    this.total = 0;
    this.samples = 0;
  }
}
