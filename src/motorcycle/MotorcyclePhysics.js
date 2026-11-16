import { clamp, damp } from '../core/math.js';
import { ROAD } from '../world/RoadPath.js';

export class MotorcyclePhysics {
  constructor(path) {
    this.path = path;
    this.sensitivity = 1;
    this.reset();
  }

  reset(s = 24, keepDistance = false) {
    const old = this.state;
    this.state = {
      s,
      d: 2.3,
      speed: 0,
      headingError: 0,
      steer: 0,
      lean: 0,
      acceleration: 0,
      yawRate: 0,
      offroad: false,
      distance: keepDistance ? old.distance : 0,
      maxSpeed: keepDistance ? old.maxSpeed : 0,
      nitro: keepDistance ? old.nitro : 1,
      boosting: false,
      boostLocked: false,
    };
  }

  update(dt, input) {
    const st = this.state;
    const frame = this.path.frame(st.s);
    st.offroad = Math.abs(st.d) > ROAD.halfWidth;
    const grip = st.offroad ? 0.44 : 1;
    const throttle = clamp(input.throttle || 0, 0, 1);
    const brake = clamp(input.brake || 0, 0, 1);
    if (!input.nitro) st.boostLocked = false;
    st.boosting =
      !!input.nitro &&
      !st.boostLocked &&
      throttle > 0 &&
      st.speed > 5 &&
      !st.offroad &&
      st.nitro > 0;
    st.nitro = clamp(st.nitro + (st.boosting ? -0.28 : 0.075) * dt, 0, 1);
    if (st.nitro === 0) st.boostLocked = true;
    const drag = 0.38 + 0.00105 * st.speed * st.speed;
    const power = 10.2 * (1 - st.speed / 98) * (st.offroad ? 0.38 : 1);
    const slope = Math.sin(frame.pitch) * 9.81;
    st.acceleration =
      throttle * power -
      (st.boosting ? -8 : 0) -
      brake * 15.5 * (st.offroad ? 0.7 : 1) -
      drag -
      slope -
      (st.offroad ? 2.8 + st.speed * 0.045 : 0);
    // No spontaneous rolling or reversing at standstill.
    st.speed = clamp(st.speed + st.acceleration * dt, 0, st.boosting ? 73 : Math.max(63, st.speed));
    if (st.speed === 0) st.acceleration = 0;
    st.steer = damp(st.steer, clamp(input.steer || 0, -1, 1), 11, dt);

    // Assisted bicycle steering. The base yaw follows the road; player input
    // changes heading before it changes lateral position. Grip limits road yaw.
    const targetHeading = st.steer * (0.32 / (1 + st.speed / 27)) * this.sensitivity;
    const roadYaw = frame.curvature * st.speed * Math.cos(st.headingError);
    const wantedYaw = roadYaw + (targetHeading - st.headingError) * 3.8;
    const maxYaw = (10.8 * grip) / Math.max(st.speed, 5);
    st.yawRate = clamp(wantedYaw, -maxYaw, maxYaw);
    st.headingError = clamp(st.headingError + (st.yawRate - roadYaw) * dt, -0.72, 0.72);
    const advance =
      (st.speed * Math.cos(st.headingError)) /
      Math.max(0.65, frame.metric * (1 - frame.curvature * st.d));
    st.s += advance * dt;
    st.d += Math.sin(st.headingError) * st.speed * dt;
    // A generous recoverable corridor, far outside the asphalt.
    if (Math.abs(st.d) > 26) {
      st.d = clamp(st.d, -26, 26);
      st.headingError = -Math.sign(st.d) * 0.16;
      st.speed = Math.min(st.speed, 7);
    }
    const targetLean =
      -clamp(Math.atan((st.speed * st.yawRate) / 9.81), -0.67, 0.67) * clamp(st.speed / 6, 0, 1);
    st.lean = damp(st.lean, targetLean, 7.5, dt);
    st.distance += st.speed * dt;
    st.maxSpeed = Math.max(st.maxSpeed, st.speed);
  }

  pose() {
    const st = this.state;
    const f = this.path.frame(st.s);
    const p = this.path.surface(st.s, st.d);
    const front = this.path.surface(st.s + 0.84, st.d);
    const back = this.path.surface(st.s - 0.84, st.d);
    return {
      ...p,
      heading: f.heading + st.headingError,
      pitch: Math.atan2(front.y - back.y, Math.hypot(front.x - back.x, front.z - back.z)),
    };
  }
}
