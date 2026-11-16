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

export function roadBox(path, box) {
  const p = path.surface(box.s, box.d),
    previous = path.surface(box.prevS ?? box.s, box.prevD ?? box.d);
  return {
    ...box,
    s: -p.z,
    d: p.x,
    prevS: -previous.z,
    prevD: previous.x,
    headingError: path.frame(box.s).heading + (box.headingError || 0),
  };
}
export function distanceBoxes(a, b) {
  if (sweepBoxes({ ...a, prevS: a.s, prevD: a.d }, { ...b, prevS: b.s, prevD: b.d }) !== null)
    return -1;
  const corners = (box) => {
    const basis = axes(box.headingError || 0);
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([x, y]) => [
      box.s + basis[0][0] * x * box.halfLength + basis[1][0] * y * box.halfWidth,
      box.d + basis[0][1] * x * box.halfLength + basis[1][1] * y * box.halfWidth,
    ]);
  };
  const ac = corners(a),
    bc = corners(b);
  let best = Infinity;
  for (const [points, edges] of [
    [ac, bc],
    [bc, ac],
  ])
    for (const point of points)
      for (let i = 0; i < 4; i++) {
        const start = edges[i],
          end = edges[(i + 1) % 4],
          dx = end[0] - start[0],
          dy = end[1] - start[1],
          t = Math.max(
            0,
            Math.min(
              1,
              ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy),
            ),
          );
        best = Math.min(
          best,
          Math.hypot(point[0] - start[0] - dx * t, point[1] - start[1] - dy * t),
        );
      }
  return best;
}

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
    const contactBox = world ? roadBox(world.path, box) : box;
    for (const actor of traffic) {
      if (actor.active === false) continue;
      if (Math.abs(player.s - actor.s) > 35 + player.speed / 120 + actor.speed / 120) continue;
      if (sweepBoxes(contactBox, world ? roadBox(world.path, actor) : actor) !== null)
        return {
          kind: 'vehicle',
          actor: actor.id,
          severity: Math.min(1, Math.abs(player.speed - actor.speed * actor.dir) / 65),
        };
    }
    if (world) {
      const frame = world.path.frame(player.s),
        b = world.path.biomes.sample(player.s);
      const barrier =
        b.mountain > 0.35 ||
        b.coast > 0.35 ||
        Math.abs(frame.curvature) > 0.0016 ||
        world.path.structure(player.s).type;
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
