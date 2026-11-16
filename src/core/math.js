export const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
export const smooth = (x) => x * x * x * (x * (x * 6 - 15) + 10);

export function hash(x, seed = 0) {
  let n = Math.imul((x | 0) ^ seed, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function noise(x, seed = 0) {
  const i = Math.floor(x);
  return lerp(hash(i, seed), hash(i + 1, seed), smooth(x - i)) * 2 - 1;
}

export function seedFromString(text) {
  let seed = 2166136261;
  for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0;
}
