export class InputManager {
  constructor(onAction) {
    this.keys = new Set();
    this.touches = new Map();
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    const actions = {
      Escape: 'pause',
      KeyC: 'camera',
      KeyV: 'camera',
      KeyR: 'recover',
      F3: 'debug',
    };
    const handled = new Set([
      'KeyW',
      'KeyS',
      'KeyA',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ShiftLeft',
      'ShiftRight',
      ...Object.keys(actions),
    ]);
    window.addEventListener(
      'keydown',
      (event) => {
        if (
          !handled.has(event.code) ||
          (/INPUT|SELECT|TEXTAREA/.test(event.target.tagName) &&
            !['Escape', 'F3'].includes(event.code))
        )
          return;
        event.preventDefault();
        this.keys.add(event.code);
        if (!event.repeat && actions[event.code]) onAction(actions[event.code]);
      },
      options,
    );
    window.addEventListener('keyup', (event) => this.keys.delete(event.code), options);
    window.addEventListener('blur', () => this.clear(), options);
    document.querySelectorAll('[data-control]').forEach((button) => {
      button.addEventListener(
        'pointerdown',
        (event) => {
          event.preventDefault();
          button.setPointerCapture(event.pointerId);
          this.touches.set(event.pointerId, button.dataset.control);
          button.classList.add('active');
        },
        options,
      );
      const release = (event) => {
        this.touches.delete(event.pointerId);
        button.classList.remove('active');
      };
      button.addEventListener('pointerup', release, options);
      button.addEventListener('pointercancel', release, options);
      button.addEventListener('lostpointercapture', release, options);
    });
  }

  sample() {
    const active = (control, ...codes) =>
      [...this.touches.values()].includes(control) || codes.some((c) => this.keys.has(c));
    return {
      throttle: +active('throttle', 'KeyW', 'ArrowUp'),
      brake: +active('brake', 'KeyS', 'ArrowDown'),
      nitro: +active('nitro', 'ShiftLeft', 'ShiftRight'),
      steer: +active('right', 'KeyD', 'ArrowRight') - +active('left', 'KeyA', 'ArrowLeft'),
    };
  }

  clear() {
    this.keys.clear();
    this.touches.clear();
    document.querySelectorAll('[data-control]').forEach((b) => b.classList.remove('active'));
  }
  dispose() {
    this.clear();
    this.abort.abort();
  }
}
