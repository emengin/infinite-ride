import { CAMERA_LABELS } from '../rendering/CameraController.js';

export class UIManager {
  constructor(actions) {
    this.elements = Object.fromEntries(
      [
        'intro',
        'hud',
        'pause',
        'speed',
        'distance',
        'gear',
        'speed-bar',
        'drive-label',
        'surface-label',
        'camera-label',
        'toast',
        'debug',
        'touch-controls',
        'error',
        'error-message',
      ].map((id) => [id, document.getElementById(id)]),
    );
    this.abort = new AbortController();
    const bind = (id, action) =>
      document
        .getElementById(id)
        .addEventListener('click', actions[action], { signal: this.abort.signal });
    bind('start-button', 'start');
    bind('pause-button', 'pause');
    bind('resume-button', 'resume');
    bind('reset-button', 'restart');
    bind('menu-button', 'menu');
    bind('touch-camera', 'camera');
    bind('crash-recover', 'recover');
    document
      .getElementById('reload-button')
      .addEventListener('click', () => window.location.reload(), { signal: this.abort.signal });
    this.touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    this.lastUpdate = -1;
    this.toastTimer = null;
  }

  mode(mode) {
    document.body.dataset.mode = mode;
    for (const key of ['intro', 'pause'])
      this.elements[key].hidden = mode !== (key === 'intro' ? 'intro' : 'paused');
    this.elements.hud.hidden = mode === 'intro';
    document.getElementById('crash').hidden = mode !== 'crashed';
    this.elements['touch-controls'].hidden = mode !== 'running' || !this.touch;
    const button = document.getElementById('pause-button');
    button.hidden = mode === 'intro';
    button.setAttribute('aria-label', mode === 'paused' ? 'Sürüşe dön' : 'Duraklat');
    const focusId = { intro: 'start-button', paused: 'resume-button' }[mode];
    if (focusId) document.getElementById(focusId).focus({ preventScroll: true });
    else document.activeElement?.blur();
  }

  update(state, input, camera, now, stats) {
    if (now - this.lastUpdate < 65) return;
    this.lastUpdate = now;
    const e = this.elements,
      kmh = Math.round(state.speed * 3.6);
    e.speed.textContent = String(kmh).padStart(3, '0');
    e.distance.textContent = (state.distance / 1000).toFixed(2);
    e.gear.textContent = kmh < 2 ? 'N' : String(Math.min(6, Math.floor(kmh / 38) + 1));
    e['speed-bar'].style.width = `${Math.min(100, (kmh / 226.8) * 100)}%`;
    e['drive-label'].textContent = input.brake
      ? 'FREN'
      : state.offroad
        ? 'DÜŞÜK TUTUŞ'
        : input.throttle
          ? 'GAZ'
          : 'SERBEST';
    e['surface-label'].textContent = state.offroad ? 'TOPRAK · DÜŞÜK TUTUŞ' : 'ASFALT · İYİ TUTUŞ';
    e['surface-label'].style.color = state.offroad ? '#e9cf88' : '';
    e['camera-label'].textContent = CAMERA_LABELS[camera];
    if (!e.debug.hidden)
      e.debug.textContent = `INFINITE RIDE / AŞAMA 1\n${stats.fps.toFixed(0)} FPS · ${stats.drawCalls} draw calls\n${stats.triangles.toLocaleString()} triangles\n${stats.chunks} chunks · ${stats.geometries} geometries\n${stats.recycled} chunk fills\ns ${state.s.toFixed(1)} m · d ${state.d.toFixed(2)} m\norigin ${stats.origin} m · seed ${stats.seed}\nheading ${state.headingError.toFixed(3)} · lean ${state.lean.toFixed(3)}`;
  }

  toast(message) {
    clearTimeout(this.toastTimer);
    this.elements.toast.textContent = message;
    this.elements.toast.hidden = false;
    this.toastTimer = setTimeout(() => {
      this.elements.toast.hidden = true;
    }, 2400);
  }
  toggleDebug() {
    this.elements.debug.hidden = !this.elements.debug.hidden;
  }
  error(message) {
    this.elements['error-message'].textContent = message;
    this.elements.error.hidden = false;
  }
  dispose() {
    this.abort.abort();
    clearTimeout(this.toastTimer);
  }
}
