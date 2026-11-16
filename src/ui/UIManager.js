import { CAMERA_LABELS } from '../rendering/CameraController.js';
import { MODES } from '../modes/SessionManager.js';

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
    bind('result-retry', 'restart');
    bind('result-menu', 'menu');
    bind('end-ride', 'finish');
    bind('open-settings', 'settings');
    bind('pause-settings', 'settings');
    bind('settings-close', 'closeSettings');
    bind('how-to-play', 'help');
    bind('help-close', 'closeHelp');
    document.getElementById('settings-form').addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
        const form = event.currentTarget,
          values = {};
        for (const element of form.elements) if (element.name) values[element.name] = element.value;
        actions.applySettings(values);
      },
      { signal: this.abort.signal },
    );
    document
      .getElementById('settings-form')
      .addEventListener('input', () => this.settingOutputs(), { signal: this.abort.signal });
    document.querySelectorAll('[data-mode-choice]').forEach((button) =>
      button.addEventListener('click', () => actions.selectMode(button.dataset.modeChoice), {
        signal: this.abort.signal,
      }),
    );
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
    document.getElementById('results').hidden = mode !== 'results';
    this.elements['touch-controls'].hidden = mode !== 'running' || !this.touch;
    const button = document.getElementById('pause-button');
    button.hidden = mode === 'intro';
    button.setAttribute('aria-label', mode === 'paused' ? 'Sürüşe dön' : 'Duraklat');
    const focusId = { intro: 'start-button', paused: 'resume-button' }[mode];
    if (focusId) document.getElementById(focusId).focus({ preventScroll: true });
    else document.activeElement?.blur();
  }

  selectMode(mode) {
    document.querySelectorAll('[data-mode-choice]').forEach((button) => {
      button.classList.toggle('selected', button.dataset.modeChoice === mode);
      button.setAttribute('aria-pressed', String(button.dataset.modeChoice === mode));
    });
    document.getElementById('mode-description').textContent = MODES[mode].description;
    document.getElementById('mode-label').textContent = MODES[mode].label;
  }
  session(session, race, mode) {
    const score = document.getElementById('score-panel');
    score.hidden = session.mode !== 'rush';
    document.getElementById('score').textContent = Math.floor(session.score).toLocaleString(
      'tr-TR',
    );
    document.getElementById('combo').textContent = `×${session.combo.toFixed(1)}`;
    const panel = document.getElementById('race-panel');
    panel.hidden = !race;
    document.getElementById('countdown').hidden = mode !== 'countdown';
    if (race) {
      document.getElementById('countdown').textContent = String(Math.ceil(race.countdown) || 'GO');
      document.getElementById('race-position').textContent = `${race.position} / 4`;
      document.getElementById('race-time').textContent = formatTime(race.time);
      document.getElementById('race-progress').style.width =
        `${Math.min(100, (race.progress / race.length) * 100)}%`;
      document.getElementById('checkpoint-label').textContent =
        `${race.checkpoint} / 3 CHECKPOINT · ${Math.max(0, (race.length - race.progress) / 1000).toFixed(2)} KM`;
    }
  }
  result(result, record) {
    document.getElementById('result-title').textContent =
      result.mode === 'race'
        ? result.position === 1
          ? 'Zirve senin.'
          : 'Yarış tamamlandı.'
        : result.mode === 'rush'
          ? 'Riskin karşılığı.'
          : 'İyi yolculuktu.';
    document.getElementById('result-mode').textContent = MODES[result.mode].label;
    const stats = [
      ['MESAFE', `${(result.distance / 1000).toFixed(2)} km`],
      ['MAKSİMUM HIZ', `${Math.round(result.maxSpeed * 3.6)} km/h`],
      ['SÜRE', formatTime(result.time)],
      ['SOLLAMA', result.overtakes],
      ['YAKIN GEÇİŞ', result.near],
    ];
    if (result.mode === 'rush') stats.unshift(['SKOR', result.score.toLocaleString('tr-TR')]);
    if (result.mode === 'race') stats.unshift(['SIRALAMA', `${result.position} / 4`]);
    const grid = document.getElementById('result-stats');
    grid.replaceChildren();
    for (const [label, value] of stats) {
      const item = document.createElement('div'),
        small = document.createElement('span'),
        strong = document.createElement('strong');
      small.textContent = label;
      strong.textContent = String(value);
      item.append(small, strong);
      grid.append(item);
    }
    document.getElementById('result-record').textContent = record
      ? record.best
        ? 'YENİ KİŞİSEL REKOR'
        : result.mode === 'rush'
          ? `EN İYİ SKOR · ${record.record.score}`
          : `EN İYİ · ${record.record.position}. / ${formatTime(record.record.time)}`
      : 'THE ROAD NEVER ENDS.';
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
    document.getElementById('nitro-fill').style.width = `${state.nitro * 100}%`;
    document.getElementById('nitro-label').textContent = state.boosting
      ? 'BOOST'
      : `NITRO · ${Math.round(state.nitro * 100)}%`;
    document.documentElement.style.setProperty(
      '--speed-effect',
      String(Math.max(0, Math.min(0.28, (state.speed - 38) / 110))),
    );
    if (!e.debug.hidden)
      e.debug.textContent = `INFINITE RIDE / AŞAMA 1\n${stats.fps.toFixed(0)} FPS · ${stats.drawCalls} draw calls\n${stats.triangles.toLocaleString()} triangles\n${stats.chunks} chunks · ${stats.geometries} geometries\n${stats.recycled} chunk fills\ns ${state.s.toFixed(1)} m · d ${state.d.toFixed(2)} m\norigin ${stats.origin} m · seed ${stats.seed}\nheading ${state.headingError.toFixed(3)} · lean ${state.lean.toFixed(3)}`;
  }

  settings(values, visible, locked = false) {
    document.getElementById('settings').hidden = !visible;
    if (!visible) return;
    const form = document.getElementById('settings-form');
    for (const element of form.elements)
      if (element.name) {
        element.value = values[element.name];
        element.disabled = locked && ['traffic', 'biome'].includes(element.name);
      }
    document.getElementById('settings-lock').hidden = !locked;
    this.settingOutputs();
    document.getElementById('settings-close').focus();
  }
  settingOutputs() {
    const form = document.getElementById('settings-form');
    for (const output of form.querySelectorAll('output')) {
      const value = Number(form.elements[output.dataset.for].value);
      output.textContent =
        output.dataset.for === 'sensitivity'
          ? `${value.toFixed(1)}×`
          : `${Math.round(value * 100)}%`;
    }
  }
  help(visible) {
    document.getElementById('help').hidden = !visible;
    if (visible) document.getElementById('help-close').focus();
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

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
}
