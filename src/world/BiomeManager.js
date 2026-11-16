import { clamp, smooth } from '../core/math.js';

export const BIOMES = [
  {
    id: 'forest',
    label: 'Forest Road',
    subtitle: 'Çam ormanları',
    low: 0x526947,
    high: 0x91a56c,
    fog: 0xbed0c2,
    trees: 1,
    rock: 0.25,
    coast: 0,
    mountain: 0,
    curve: 0.94,
  },
  {
    id: 'highland',
    label: 'Highland Road',
    subtitle: 'Açık yaylalar',
    low: 0x92955c,
    high: 0xc1b779,
    fog: 0xd9dec6,
    trees: 0.22,
    rock: 0.3,
    coast: 0,
    mountain: 0.12,
    curve: 0.82,
  },
  {
    id: 'mountain',
    label: 'Mountain Pass',
    subtitle: 'Zirvelere doğru',
    low: 0x70776b,
    high: 0xa5a794,
    fog: 0xc8d6da,
    trees: 0.38,
    rock: 1,
    coast: 0,
    mountain: 1,
    curve: 1.0,
  },
  {
    id: 'coastal',
    label: 'Coastal Road',
    subtitle: 'Ufka uzanan kıyı',
    low: 0x9c9c70,
    high: 0xd4c69a,
    fog: 0xc6dedc,
    trees: 0.16,
    rock: 0.7,
    coast: 1,
    mountain: 0.1,
    curve: 0.9,
  },
];

export class BiomeManager {
  constructor(choice = 'auto') {
    this.set(choice);
  }
  set(choice) {
    this.choice = BIOMES.some((b) => b.id === choice) ? choice : 'auto';
  }
  sample(s) {
    let a, b, t;
    if (this.choice !== 'auto') {
      a = b = BIOMES.findIndex((b) => b.id === this.choice);
      t = 0;
    } else {
      const section = Math.floor((s + 900) / 1800),
        local = s + 900 - section * 1800;
      a = ((section % 4) + 4) % 4;
      b = (a + 1) % 4;
      t = smooth(clamp((local - 1350) / 450, 0, 1));
    }
    const weights = [0, 0, 0, 0];
    weights[a] += 1 - t;
    weights[b] += t;
    const dominant = BIOMES[t > 0.5 ? b : a],
      result = { weights, ...dominant };
    for (const name of ['trees', 'rock', 'coast', 'mountain', 'curve'])
      result[name] = weights.reduce((n, w, i) => n + w * BIOMES[i][name], 0);
    return result;
  }
}
