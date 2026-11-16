import { clamp } from '../core/math.js';

// Shared arcade transmission readout keeps the tachometer and engine sound in sync.
export function engineReadout(speed, throttle = 0) {
  const kmh = speed * 3.6;
  const index = Math.min(5, Math.floor(kmh / 38));
  return {
    gear: kmh < 2 ? 'N' : String(index + 1),
    rpm: 1200 + clamp((kmh - index * 38) / 38, 0, 1) * 6800 + index * 450 + throttle * 1100,
  };
}
