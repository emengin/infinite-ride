import { lerp, noise, clamp } from '../core/math.js';

export const ROAD = Object.freeze({
  halfWidth: 4.6,
  shoulder: 5.8,
  step: 4,
  chunkLength: 128,
  behind: 2,
  ahead: 9,
  originInterval: 512,
});
export const LATERAL = [
  -650, -420, -260, -170, -110, -70, -42, -24, -14, -8, -5.8, -4.6, 0, 4.6, 5.8, 8, 14, 24, 42, 70,
  110, 170, 260, 420, 650,
];

/** The road, terrain mesh and physics all sample this single deterministic surface.
 * s is longitudinal route coordinate in metres; d is lateral offset (right positive).
 * Only small coordinates relative to an origin are ever sent to the GPU.
 */
export class RoadPath {
  constructor(seed = 7049) {
    this.seed = seed;
  }

  center(s) {
    return {
      x:
        110 * noise(s / 690 + 1.3, this.seed) +
        34 * noise(s / 270 + 5.8, this.seed + 5) +
        7 * noise(s / 125 + 8.2, this.seed + 7),
      y: 17 + 15 * noise(s / 530 + 2.4, this.seed + 13) + 4 * noise(s / 210 + 7.1, this.seed + 11),
      z: -s,
    };
  }

  frame(s) {
    const a = this.center(s - 0.25),
      b = this.center(s + 0.25);
    const dx = (b.x - a.x) / 0.5,
      dy = (b.y - a.y) / 0.5;
    const horizontalMetric = Math.hypot(dx, 1);
    const prev = this.center(s - 2),
      next = this.center(s + 2),
      here = this.center(s);
    const ddx = (next.x - 2 * here.x + prev.x) / 4;
    return {
      ...here,
      dx,
      dy,
      rx: 1 / horizontalMetric,
      rz: dx / horizontalMetric,
      heading: Math.atan2(dx, 1),
      pitch: Math.atan2(dy, horizontalMetric),
      metric: Math.hypot(dx, dy, 1),
      curvature: ddx / horizontalMetric ** 3,
    };
  }

  terrainHeight(s, d, roadY) {
    const distance = Math.abs(d);
    if (distance <= ROAD.shoulder) return roadY;
    const blend = Math.min(1, (distance - ROAD.shoulder) / 36);
    const hills =
      7 +
      noise(s / 140 + distance / 190, this.seed + 22) * 12 +
      noise(s / 60 + d / 80, this.seed + 25) * 3 +
      (distance / 19) * (0.6 + noise(s / 360 + d / 300, this.seed + 31) * 0.55);
    return roadY + blend * hills;
  }

  vertex(s, d) {
    const f = this.frame(s);
    return { x: f.x + f.rx * d, y: this.terrainHeight(s, d, f.y), z: -s + f.rz * d };
  }

  // Barycentric interpolation follows the SAME diagonal as the rendered grid.
  // In particular, no invisible, flat collision plane exists underneath the road.
  surface(s, d) {
    const s0 = Math.floor(s / ROAD.step) * ROAD.step;
    const t = (s - s0) / ROAD.step;
    d = clamp(d, LATERAL[0], LATERAL.at(-1));
    let column = 0;
    while (column < LATERAL.length - 2 && LATERAL[column + 1] < d) column++;
    const d0 = LATERAL[column],
      d1 = LATERAL[column + 1];
    const u = (d - d0) / (d1 - d0);
    const a = this.vertex(s0, d0),
      b = this.vertex(s0, d1);
    const c = this.vertex(s0 + ROAD.step, d0),
      e = this.vertex(s0 + ROAD.step, d1);
    const p = {};
    for (const axis of ['x', 'y', 'z']) {
      p[axis] =
        t + u <= 1
          ? a[axis] + t * (c[axis] - a[axis]) + u * (b[axis] - a[axis])
          : e[axis] + (1 - t) * (b[axis] - e[axis]) + (1 - u) * (c[axis] - e[axis]);
    }
    return p;
  }

  roadPoint(s, d = 0, lift = 0) {
    // Road strips interpolate the same cross sections as the terrain.
    const s0 = Math.floor(s / ROAD.step) * ROAD.step;
    const t = (s - s0) / ROAD.step;
    const a = this.vertex(s0, d),
      b = this.vertex(s0 + ROAD.step, d);
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) + lift, z: lerp(a.z, b.z, t) };
  }
}
