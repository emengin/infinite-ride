export const DEFAULT_SETTINGS = {
  quality: 'high',
  resolution: 1,
  traffic: 'medium',
  volume: 0.45,
  camera: 0,
  sensitivity: 1,
  time: 'day',
  biome: 'auto',
  weather: 'clear',
};
export function normalizeSettings(value = {}) {
  const result = { ...DEFAULT_SETTINGS };
  const choices = {
    quality: ['low', 'medium', 'high'],
    traffic: ['off', 'low', 'medium', 'high', 'extreme'],
    time: ['sunrise', 'day', 'sunset', 'night', 'dynamic'],
    biome: ['auto', 'forest', 'coastal', 'mountain', 'highland'],
    weather: ['clear', 'haze'],
  };
  for (const [key, values] of Object.entries(choices))
    if (values.includes(value[key])) result[key] = value[key];
  for (const [key, min, max] of [
    ['resolution', 0.5, 1.5],
    ['volume', 0, 1],
    ['camera', 0, 2],
    ['sensitivity', 0.6, 1.6],
  ]) {
    const n = Number(value[key]);
    if (Number.isFinite(n)) result[key] = Math.max(min, Math.min(max, n));
  }
  result.camera = Math.round(result.camera);
  return result;
}
export class SaveManager {
  constructor(storage) {
    this.available = true;
    try {
      this.storage = storage ?? globalThis.localStorage;
      if (!this.storage) this.available = false;
    } catch {
      this.available = false;
      this.storage = null;
    }
  }
  read(key, fallback) {
    try {
      const value = JSON.parse(this.storage?.getItem(`infinite-ride:${key}`) || 'null');
      return value ?? fallback;
    } catch {
      this.available = false;
      return fallback;
    }
  }
  write(key, value) {
    try {
      if (!this.storage) return false;
      this.storage?.setItem(`infinite-ride:${key}`, JSON.stringify(value));
      return true;
    } catch {
      this.available = false;
      return false;
    }
  }
  settings() {
    const value = this.read('settings', {});
    return normalizeSettings(value && typeof value === 'object' ? value : {});
  }
  record(mode, result) {
    const raw = this.read('records', {});
    const records = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {},
      current = records[mode];
    const best =
      mode === 'race'
        ? !current ||
          result.position < current.position ||
          (result.position === current.position && result.time < current.time)
        : !current || result.score > current.score;
    if (best) {
      records[mode] = result;
      this.write('records', records);
    }
    return { best, record: records[mode] };
  }
}
