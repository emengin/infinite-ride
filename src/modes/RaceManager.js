import { MotorcyclePhysics } from '../motorcycle/MotorcyclePhysics.js';
import { clamp } from '../core/math.js';

export class RaceManager {
  constructor(path, length = 3000) {
    this.path = path;
    this.length = length;
    this.reset();
  }
  reset(start = 24) {
    this.start = start;
    this.countdown = 3;
    this.time = 0;
    this.checkpoint = 0;
    this.finished = false;
    this.finishTime = null;
    this.rivals = [
      { name: 'NOVA', pace: 56, lane: 1.0 },
      { name: 'ATLAS', pace: 53, lane: 2.6 },
      { name: 'ECHO', pace: 58, lane: 3.8 },
    ].map((personality, i) => {
      const physics = new MotorcyclePhysics(this.path, { roadAssist: true });
      physics.reset(start + 5 + i * 4);
      physics.state.d = personality.lane;
      return {
        ...personality,
        id: 100 + i,
        type: 6,
        dir: 1,
        halfWidth: 0.36,
        halfLength: 1.08,
        active: true,
        physics,
        finishTime: null,
        targetLane: personality.lane,
        passLeaderId: null,
      };
    });
  }
  get actors() {
    return this.rivals.map((r) => ({
      ...r.physics.state,
      id: r.id,
      type: 6,
      dir: 1,
      active: r.physics.state.s < this.start + this.length + 200,
      halfWidth: r.halfWidth,
      halfLength: r.halfLength,
      finishTime: r.finishTime,
    }));
  }
  tickCountdown(dt) {
    this.countdown = Math.max(0, this.countdown - dt);
    return this.countdown === 0;
  }
  update(dt, player, traffic = []) {
    if (this.finished) return;
    this.time += dt;
    const participants = [
      ...traffic,
      ...this.actors,
      { ...player, halfWidth: 0.36, halfLength: 1.08, id: 'player', dir: 1 },
    ];
    for (const rival of this.rivals) {
      if (rival.finishTime !== null) {
        const st = rival.physics.state;
        st.prevS = st.s;
        st.prevD = st.d;
        st.s += (st.speed * dt) / this.path.frame(st.s).metric;
        continue;
      }
      const st = rival.physics.state;
      const curve = Math.max(
        Math.abs(this.path.frame(st.s + 25).curvature),
        Math.abs(this.path.frame(st.s + 55).curvature),
      );
      let target = Math.min(rival.pace, Math.sqrt(7.2 / Math.max(0.0001, curve))),
        lane = rival.targetLane;
      const clearCorridor = (destination) =>
        participants.every((a) => {
          if (a.id === rival.id || a.active === false) return true;
          const ds = a.s - st.s;
          if (ds < -18 || ds > (a.dir < 0 ? 260 : 45)) return true;
          const min = Math.min(st.d, destination) - a.halfWidth - 0.6,
            max = Math.max(st.d, destination) + a.halfWidth + 0.6;
          return a.d < min || a.d > max;
        });
      if (rival.passLeaderId !== null) {
        const passed = participants.find((a) => a.id === rival.passLeaderId);
        const incoming = participants.some(
          (a) => a.dir < 0 && a.s > st.s && a.s - st.s < 240 && Math.abs(a.d - lane) < 2,
        );
        if (
          (!passed || st.s > passed.s + passed.halfLength + 20 || incoming) &&
          clearCorridor(rival.lane)
        ) {
          lane = rival.lane;
          rival.passLeaderId = null;
        }
      }
      const leader = participants
        .filter(
          (a) =>
            a.id !== rival.id &&
            a.s > st.s &&
            a.s - st.s < 75 &&
            Math.abs(a.d - st.d) < a.halfWidth + 0.56,
        )
        .sort((a, b) => a.s - b.s)[0];
      if (
        leader &&
        rival.passLeaderId === null &&
        leader.dir === 1 &&
        leader.s - st.s > 35 &&
        leader.speed < target - 2
      ) {
        const choices = [rival.lane, 1.0, 2.6, 3.8, -2.3];
        const open = choices.find((d) => Math.abs(d - st.d) > 0.8 && clearCorridor(d));
        if (open !== undefined) {
          lane = open;
          rival.passLeaderId = leader.id;
        }
      }
      rival.targetLane = lane;
      if (leader)
        target = Math.min(
          target,
          Math.max(
            0,
            leader.speed * (leader.dir ?? 1) + (leader.s - st.s - leader.halfLength - 12) * 0.55,
          ),
        );
      const steer = clamp((lane - st.d) * 0.7, -1, 1),
        throttle = clamp(0.4 + (target - st.speed) * 0.35, 0, 1),
        brake = clamp((st.speed - target) / 6, 0, 1);
      st.prevS = st.s;
      st.prevD = st.d;
      rival.physics.update(dt, { throttle, brake, steer });
      if (st.s >= this.start + this.length) {
        rival.finishTime = this.time;
      }
    }
    const progress = player.s - this.start;
    while (this.checkpoint < 3 && progress >= (this.checkpoint + 1) * 750) this.checkpoint++;
    if (progress >= this.length) {
      this.finished = true;
      this.finishTime = this.time;
    }
  }
  position(player) {
    return (
      1 + this.rivals.filter((r) => r.finishTime !== null || r.physics.state.s > player.s).length
    );
  }
  penalty() {
    this.time += 3;
  }
  snapshot(player) {
    return {
      countdown: this.countdown,
      time: this.time,
      length: this.length,
      progress: Math.max(0, player.s - this.start),
      checkpoint: this.checkpoint,
      position: this.position(player),
      finished: this.finished,
      rivals: this.rivals.map((r) => ({
        name: r.name,
        s: r.physics.state.s,
        finishTime: r.finishTime,
      })),
    };
  }
}
