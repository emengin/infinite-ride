import { hash, clamp } from '../core/math.js';
import { accelerationFor, canOvertake } from './TrafficAI.js';

export const VEHICLES = [
  { id: 'sedan', width: 1.8, length: 4.5, height: 1.45, cruise: 24 },
  { id: 'hatchback', width: 1.73, length: 3.8, height: 1.5, cruise: 22 },
  { id: 'suv', width: 1.98, length: 4.85, height: 1.85, cruise: 23 },
  { id: 'sport', width: 1.92, length: 4.4, height: 1.2, cruise: 31 },
  { id: 'truck', width: 2.45, length: 9.5, height: 3.4, cruise: 19 },
  { id: 'bus', width: 2.45, length: 10.8, height: 3.1, cruise: 20 },
  { id: 'motorcycle', width: 0.72, length: 2.15, height: 1.9, cruise: 29 },
];
export const DENSITIES = { off: 0, low: 12, medium: 24, high: 38, extreme: 56 };

export class TrafficSimulation {
  constructor(path, density = 'medium') {
    this.path = path;
    this.pool = Array.from({ length: 56 }, (_, id) => ({ id, active: false, generation: 0 }));
    this.events = [];
    this.density = density in DENSITIES ? density : 'medium';
    this.elapsed = 0;
    this.spawned = 0;
  }
  reset(s = 24) {
    this.elapsed = 0;
    this.events.length = 0;
    for (const a of this.pool) a.active = false;
    this.fill(s, true);
  }
  setDensity(value, s) {
    this.density = value in DENSITIES ? value : 'medium';
    this.reset(s);
  }
  get actors() {
    return this.pool.filter((a) => a.active);
  }
  fill(s, initial = false) {
    let count = this.pool.reduce((n, a) => n + !!a.active, 0);
    for (const actor of this.pool) {
      if (count >= DENSITIES[this.density]) break;
      if (actor.active) continue;
      const index = actor.id + actor.generation * 71,
        dir = hash(index + 1, this.path.seed) > 0.48 ? 1 : -1;
      let spawnS =
        s +
        (initial
          ? 160 + (count / Math.max(1, DENSITIES[this.density] - 1)) * 760
          : 850 + hash(index + 9, this.path.seed) * 150);
      let valid = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        if (
          this.pool.every(
            (a) =>
              !a.active ||
              Math.abs(a.d - dir * 2.3) > 2.8 ||
              Math.abs(a.s - spawnS) > a.halfLength + 14,
          )
        ) {
          valid = true;
          break;
        }
        spawnS += 19;
      }
      if (!valid || spawnS > s + 1120) continue;
      const type = (actor.id + actor.generation) % 7,
        config = VEHICLES[type];
      Object.assign(actor, {
        active: true,
        type,
        dir,
        s: spawnS,
        prevS: spawnS,
        d: dir * 2.3,
        prevD: dir * 2.3,
        speed: config.cruise * (0.83 + hash(index + 3, this.path.seed) * 0.2),
        cruise: config.cruise * (0.87 + hash(index + 4, this.path.seed) * 0.25),
        halfWidth: config.width / 2,
        halfLength: config.length / 2,
        headingError: dir === 1 ? 0 : Math.PI,
        targetD: dir * 2.3,
        passing: null,
        cooldown: 2 + hash(index, this.path.seed) * 6,
        closest: Infinity,
        passed: false,
      });
      actor.generation++;
      count++;
      this.spawned++;
    }
  }
  update(dt, player) {
    this.elapsed += dt;
    this.events.length = 0;
    const actors = this.actors;
    const playerActor = { ...player, dir: 1, active: true, halfWidth: 0.36, halfLength: 1.08 };
    const participants = [...actors, playerActor];
    for (const a of actors) {
      a.prevS = a.s;
      a.prevD = a.d;
      a.cooldown -= dt;
      let leader = null,
        gap = Infinity;
      for (const other of participants) {
        if (other === a || Math.abs(other.d - a.d) > a.halfWidth + other.halfWidth + 0.5) continue;
        const ahead = (other.s - a.s) * a.dir;
        if (ahead > 0 && ahead < gap) {
          leader = other;
          gap = ahead;
        }
      }
      a.acceleration = accelerationFor(a, leader, this.path);
      if (
        a.passing === null &&
        gap < 90 &&
        gap > 14 &&
        canOvertake(a, leader, actors, playerActor)
      ) {
        a.passing = leader.id ?? 'player';
        a.passUntil = this.elapsed + 10;
        a.targetD = -a.dir * 2.3;
        a.cooldown = 15;
      }
      if (a.passing !== null) {
        const target = actors.find((o) => o.id === a.passing) || playerActor;
        const incoming = actors.some(
          (o) =>
            o !== a &&
            o.dir !== a.dir &&
            (o.s - a.s) * a.dir > 0 &&
            (o.s - a.s) * a.dir < (a.speed + o.speed) * 4 + 15,
        );
        if (
          (a.s - target.s) * a.dir > target.halfLength + a.halfLength + 14 ||
          this.elapsed > a.passUntil ||
          incoming
        ) {
          const home = a.dir * 2.3;
          const clear = [...actors, playerActor].every(
            (o) =>
              o === a ||
              Math.abs(o.d - home) > 2 ||
              Math.abs(o.s - a.s) > o.halfLength + a.halfLength + 7,
          );
          if (clear) {
            a.targetD = home;
            a.passing = null;
          } else if (incoming) a.acceleration = -10;
        }
      }
    }
    for (const a of actors) {
      a.speed = clamp(a.speed + a.acceleration * dt, 0, 40);
      a.s += (a.dir * a.speed * dt) / this.path.frame(a.s).metric;
      const lateral = clamp(a.targetD - a.d, -1.65 * dt, 1.65 * dt);
      a.d += lateral;
      a.headingError =
        (a.dir === 1 ? 0 : Math.PI) + Math.atan2(lateral / dt, Math.max(a.speed, 2)) * a.dir;
    }
    // Hard nonpenetration constraint backs up the continuous car-following AI.
    for (let iteration = 0; iteration < 2; iteration++)
      for (let i = 0; i < actors.length; i++)
        for (let j = i + 1; j < actors.length; j++) {
          const a = actors[i],
            b = actors[j],
            min = a.halfLength + b.halfLength + 0.5;
          if (Math.abs(a.d - b.d) >= a.halfWidth + b.halfWidth + 0.18 || Math.abs(a.s - b.s) >= min)
            continue;
          if (a.dir === b.dir) {
            const follower = (a.s - b.s) * a.dir < 0 ? a : b,
              front = follower === a ? b : a;
            follower.s = front.s - a.dir * min;
            follower.speed = Math.min(follower.speed, front.speed);
          } else {
            const passing = Math.sign(a.d) !== a.dir ? a : b;
            passing.d = passing.dir * 2.3;
            passing.targetD = passing.d;
            passing.passing = null;
            passing.speed *= 0.8;
          }
        }
    for (const a of actors) {
      const relative = player.s - a.s,
        previous = (player.prevS ?? player.s) - a.prevS,
        extent = a.halfLength + 1.08;
      if (Math.abs(relative) < extent + 3) {
        const width =
          0.36 * Math.abs(Math.cos(player.headingError || 0)) +
          1.08 * Math.abs(Math.sin(player.headingError || 0));
        a.closest = Math.min(a.closest, Math.abs(player.d - a.d) - a.halfWidth - width);
      }
      if (!a.passed && previous <= extent && relative > extent) {
        a.passed = true;
        if (a.dir === 1) this.events.push({ type: 'overtake', actor: a.id });
        if (a.closest > 0 && a.closest < 0.95 && player.speed > 12)
          this.events.push({ type: 'near', actor: a.id, clearance: a.closest });
      }
      if (a.s < player.s - 220 || a.s > player.s + 1160) a.active = false;
    }
    this.fill(player.s);
    return this.events;
  }
}
