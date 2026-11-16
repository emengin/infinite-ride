const axes = (angle) => [
  [Math.cos(angle), Math.sin(angle)],
  [-Math.sin(angle), Math.cos(angle)],
];
const radius = (box, axis) => {
  const local = axes(box.headingError || 0);
  return (
    Math.abs(axis[0] * local[0][0] + axis[1] * local[0][1]) * box.halfLength +
    Math.abs(axis[0] * local[1][0] + axis[1] * local[1][1]) * box.halfWidth
  );
};

// Swept SAT for oriented boxes in the longitudinal/lateral road frame.
export function sweepBoxes(a, b) {
  let enter = 0,
    exit = 1;
  const ds0 = (a.prevS ?? a.s) - (b.prevS ?? b.s),
    dd0 = (a.prevD ?? a.d) - (b.prevD ?? b.d);
  const ds1 = a.s - b.s,
    dd1 = a.d - b.d;
  for (const axis of [...axes(a.headingError || 0), ...axes(b.headingError || 0)]) {
    const extent = radius(a, axis) + radius(b, axis);
    const start = ds0 * axis[0] + dd0 * axis[1],
      velocity = (ds1 - ds0) * axis[0] + (dd1 - dd0) * axis[1];
    if (Math.abs(velocity) < 1e-10) {
      if (Math.abs(start) > extent) return null;
      continue;
    }
    let t0 = (-extent - start) / velocity,
      t1 = (extent - start) / velocity;
    if (t0 > t1) [t0, t1] = [t1, t0];
    enter = Math.max(enter, t0);
    exit = Math.min(exit, t1);
    if (enter > exit) return null;
  }
  return enter >= 0 && enter <= 1 ? enter : null;
}

export class CollisionSystem {
  check(player, traffic, world) {
    const box = { ...player, halfWidth: 0.34, halfLength: 1.05 };
    for (const actor of traffic) {
      if (Math.abs(player.s - actor.s) > 35 + player.speed / 120 + actor.speed / 120) continue;
      if (sweepBoxes(box, actor) !== null)
        return {
          kind: 'vehicle',
          actor: actor.id,
          severity: Math.min(1, Math.abs(player.speed - actor.speed * actor.dir) / 65),
        };
    }
    if (world) {
      const frame = world.path.frame(player.s),
        b = world.path.biomes.sample(player.s);
      const barrier = b.mountain > 0.35 || b.coast > 0.35 || Math.abs(frame.curvature) > 0.0016;
      if (barrier && Math.abs(player.d) > 0.55 + 4.6 && Math.abs(player.d) < 7)
        return { kind: 'barrier', severity: Math.min(1, player.speed / 50) };
      for (const chunk of world.chunks) {
        if (Math.abs(chunk.index * 128 - player.s) > 180) continue;
        for (const obstacle of chunk.terrain.userData.obstacles || []) {
          if (
            Math.abs(player.s - obstacle.s) < obstacle.halfLength + 2 &&
            sweepBoxes(box, obstacle) !== null
          )
            return { kind: 'scenery', severity: Math.min(1, player.speed / 50) };
        }
      }
    }
    return null;
  }
}
