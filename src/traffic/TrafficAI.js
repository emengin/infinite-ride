import { clamp } from '../core/math.js';

export function accelerationFor(vehicle, leader, path) {
  const curve = Math.abs(path.frame(vehicle.s + vehicle.dir * 30).curvature);
  const curveLimit = Math.sqrt(4.8 / Math.max(curve, 0.0001));
  const target = Math.min(vehicle.cruise, curveLimit);
  let acceleration = 2.6 * (1 - (vehicle.speed / Math.max(1, target)) ** 4);
  if (leader) {
    const gap = Math.max(
      0.2,
      (leader.s - vehicle.s) * vehicle.dir - vehicle.halfLength - leader.halfLength,
    );
    const closing =
      vehicle.speed - Math.max(0, leader.speed * (leader.dir === vehicle.dir ? 1 : -1));
    const desired =
      4 + vehicle.speed * 1.2 + Math.max(0, (vehicle.speed * closing) / (2 * Math.sqrt(2.6 * 6)));
    acceleration -= 2.6 * (desired / gap) ** 2;
  }
  return clamp(acceleration, -10, 2.6);
}

export function canOvertake(vehicle, leader, actors, player) {
  if (!leader || leader.speed > vehicle.cruise - 4 || vehicle.dir < 0 || vehicle.cooldown > 0)
    return false;
  const target = -vehicle.dir * 2.3;
  return [...actors, player].every((other) => {
    if (!other.active || other === vehicle || other === leader) return true;
    const ds = (other.s - vehicle.s) * vehicle.dir;
    if (other.dir !== vehicle.dir && ds > -50 && ds < (vehicle.speed + other.speed) * 10 + 60)
      return false;
    return !(Math.abs(other.d - target) < 2.4 && ds > -45 && ds < 130);
  });
}
