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
export class SaveManager {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.available = true;
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
      this.storage?.setItem(`infinite-ride:${key}`, JSON.stringify(value));
      return true;
    } catch {
      this.available = false;
      return false;
    }
  }
  settings() {
    const value = this.read('settings', {});
    return { ...DEFAULT_SETTINGS, ...(value && typeof value === 'object' ? value : {}) };
  }
  record(mode, result) {
    const records = this.read('records', {}),
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
