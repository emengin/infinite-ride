import { smooth, lerp } from '../core/math.js';
export const TIMES = {
  sunrise: {
    top: [0.21, 0.36, 0.49],
    horizon: [0.91, 0.62, 0.4],
    sun: [1, 0.64, 0.36],
    light: 2.2,
    ambient: 1.2,
    night: 0,
    elevation: 0.16,
    exposure: 1,
  },
  day: {
    top: [0.23, 0.49, 0.63],
    horizon: [0.72, 0.82, 0.78],
    sun: [1, 0.89, 0.68],
    light: 3,
    ambient: 1.7,
    night: 0,
    elevation: 0.8,
    exposure: 1,
  },
  sunset: {
    top: [0.22, 0.25, 0.42],
    horizon: [0.93, 0.48, 0.29],
    sun: [1, 0.46, 0.2],
    light: 1.8,
    ambient: 1.05,
    night: 0.15,
    elevation: 0.1,
    exposure: 1,
  },
  night: {
    top: [0.014, 0.034, 0.075],
    horizon: [0.035, 0.075, 0.12],
    sun: [0.44, 0.61, 0.83],
    light: 0.45,
    ambient: 0.48,
    night: 1,
    elevation: 0.55,
    exposure: 1.2,
  },
};
export class TimeOfDay {
  constructor(choice = 'day') {
    this.choice = choice;
    this.elapsed = 0;
  }
  update(dt) {
    this.elapsed += dt;
    return this.sample();
  }
  sample() {
    const ids = Object.keys(TIMES);
    let a, b, t;
    if (this.choice === 'dynamic') {
      const phase = this.elapsed / 180,
        i = Math.floor(phase);
      a = TIMES[ids[i % 4]];
      b = TIMES[ids[(i + 1) % 4]];
      t = smooth(phase - i);
    } else {
      a = b = TIMES[this.choice] || TIMES.day;
      t = 0;
    }
    const result = {};
    for (const name of Object.keys(a))
      result[name] = Array.isArray(a[name])
        ? a[name].map((v, i) => lerp(v, b[name][i], t))
        : lerp(a[name], b[name], t);
    return result;
  }
}
