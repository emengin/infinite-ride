import { clamp } from '../core/math.js';
import { engineReadout } from '../motorcycle/engine.js';

export class AudioManager {
  constructor() {
    this.context = null;
    this.volume = 0.45;
    this.sources = [];
    this.effectCount = 0;
    this.params = { rpm: 1200, wind: 0 };
    this.enabled = true;
  }
  async start() {
    try {
      if (!this.context) {
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContext) {
          this.enabled = false;
          return;
        }
        const c = (this.context = new AudioContext());
        this.master = c.createGain();
        this.master.gain.value = 0;
        this.master.connect(c.destination);
        this.engineGain = c.createGain();
        this.engineGain.gain.value = 0.025;
        this.engineFilter = c.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 1600;
        this.engineFilter.Q.value = 0.6;
        this.engineGain.connect(this.engineFilter);
        this.engineFilter.connect(this.master);
        this.engine = c.createOscillator();
        this.engine.type = 'sawtooth';
        this.engine.frequency.value = 40;
        this.engine.connect(this.engineGain);
        this.engine.start();
        this.sub = c.createOscillator();
        this.sub.type = 'triangle';
        this.sub.frequency.value = 20;
        this.sub.connect(this.engineGain);
        this.sub.start();
        this.sources.push(this.engine, this.sub);
        const buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate),
          data = buffer.getChannelData(0);
        let previous = 0;
        for (let i = 0; i < data.length; i++) {
          const white = Math.random() * 2 - 1;
          previous = (previous + 0.07 * white) / 1.07;
          data[i] = previous * 3;
        }
        this.noise = buffer;
        const wind = c.createBufferSource();
        wind.buffer = buffer;
        wind.loop = true;
        this.windGain = c.createGain();
        this.windGain.gain.value = 0;
        const filter = c.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 550;
        wind.connect(filter);
        filter.connect(this.windGain);
        this.windGain.connect(this.master);
        wind.start();
        this.sources.push(wind);
        this.traffic = c.createOscillator();
        this.traffic.type = 'triangle';
        this.traffic.frequency.value = 80;
        this.trafficGain = c.createGain();
        this.trafficGain.gain.value = 0;
        this.traffic.connect(this.trafficGain);
        this.trafficGain.connect(this.master);
        this.traffic.start();
        this.sources.push(this.traffic);
        this.analyser = c.createAnalyser();
        this.analyser.fftSize = 256;
        this.master.connect(this.analyser);
        this.samples = new Float32Array(256);
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      this.enabled = false;
    }
  }
  update(state, input, running, actors = []) {
    if (!this.context || !this.enabled) return;
    const c = this.context,
      t = c.currentTime;
    const { rpm } = engineReadout(state.speed, input.throttle);
    this.params = { rpm, wind: clamp(state.speed / 65, 0, 1) };
    const set = (param, value, rate = 0.08) => param.setTargetAtTime(value, t, rate);
    set(this.master.gain, this.volume, 0.12);
    set(this.engine.frequency, rpm / 30);
    set(this.sub.frequency, rpm / 60);
    set(this.engineGain.gain, running ? 0.018 + input.throttle * 0.024 + state.speed * 0.00025 : 0);
    set(this.engineFilter.frequency, 600 + input.throttle * 1800 + state.speed * 18);
    set(
      this.windGain.gain,
      running
        ? (state.speed / 63) ** 2 * 0.32 +
            (state.offroad ? 0.035 : 0) +
            (input.brake && state.speed > 18 ? 0.025 : 0)
        : 0,
    );
    let closest = Infinity,
      relative = 0;
    for (const a of actors) {
      const distance = Math.hypot(a.s - state.s, (a.d - state.d) * 3);
      if (distance < closest) {
        closest = distance;
        relative = state.speed - a.speed * a.dir;
      }
    }
    set(this.trafficGain.gain, running && closest < 55 ? 0.025 * (1 - closest / 55) : 0);
    set(this.traffic.frequency, 65 + Math.abs(relative) * 1.2);
  }
  effect(kind) {
    if (!this.context || !this.enabled || this.effectCount >= 8) return;
    const c = this.context,
      t = c.currentTime,
      gain = c.createGain();
    gain.connect(this.master);
    this.effectCount++;
    let node;
    if (kind === 'crash' || kind === 'near') {
      node = c.createBufferSource();
      node.buffer = this.noise;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = kind === 'crash' ? 1400 : 2800;
      node.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(kind === 'crash' ? 0.65 : 0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'crash' ? 0.5 : 0.24));
    } else {
      node = c.createOscillator();
      node.type = 'sine';
      node.frequency.setValueAtTime(kind === 'checkpoint' ? 800 : 480, t);
      node.frequency.exponentialRampToValueAtTime(kind === 'checkpoint' ? 1200 : 650, t + 0.12);
      node.connect(gain);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    }
    node.onended = () => {
      node.disconnect();
      gain.disconnect();
      this.effectCount--;
    };
    node.start();
    node.stop(t + (kind === 'crash' ? 0.55 : 0.28));
  }
  snapshot() {
    let rms = 0;
    if (this.analyser) {
      this.analyser.getFloatTimeDomainData(this.samples);
      for (const x of this.samples) rms += x * x;
      rms = Math.sqrt(rms / this.samples.length);
    }
    return {
      state: this.context?.state || 'not-started',
      enabled: this.enabled,
      volume: this.volume,
      rms,
      ...this.params,
      sources: this.sources.length,
      effects: this.effectCount,
    };
  }
  dispose() {
    this.sources.forEach((s) => {
      try {
        s.stop();
        s.disconnect();
      } catch {}
    });
    this.context?.close().catch(() => {});
  }
}
