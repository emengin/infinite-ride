export const MODES = {
  free: { label: 'FREE RIDE', description: 'Yolculuk senin ritminde.' },
  rush: { label: 'TRAFFIC RUSH', description: 'Yakın geç. Riski puana çevir.' },
  race: { label: 'RACE', description: '3 rakip. 3 kilometre. Bir bitiş çizgisi.' },
};
export class SessionManager {
  constructor() {
    this.reset('free');
  }
  reset(mode) {
    this.mode = mode in MODES ? mode : 'free';
    this.score = 0;
    this.combo = 1;
    this.streak = 0;
    this.comboTime = 0;
    this.time = 0;
    this.overtakes = 0;
    this.near = 0;
    this.crashes = 0;
    this.maxSpeed = 0;
    this.finished = false;
  }
  update(dt, state, events = []) {
    if (this.finished) return;
    this.time += dt;
    this.maxSpeed = Math.max(this.maxSpeed, state.speed);
    if (this.mode === 'rush')
      this.score +=
        (state.speed * 0.3 +
          Math.max(0, state.speed - 27) * 1.7 +
          (state.d < -0.4 ? state.speed * 0.5 : 0)) *
        dt *
        this.combo;
    this.comboTime = Math.max(0, this.comboTime - dt);
    if (this.comboTime === 0) {
      this.streak = 0;
      this.combo = 1;
    }
    for (const event of events) {
      if (event.type === 'overtake') {
        this.overtakes++;
        if (this.mode === 'rush') this.score += 75 * this.combo;
      }
      if (event.type === 'near') {
        this.near++;
        if (this.mode === 'rush') this.score += 250 * this.combo;
      }
      if (this.mode === 'rush') {
        this.streak++;
        this.combo = Math.min(5, 1 + Math.floor(this.streak / 2) * 0.5);
        this.comboTime = 7;
      }
    }
  }
  collision() {
    this.crashes++;
    this.combo = 1;
    this.streak = 0;
    this.comboTime = 0;
    if (this.mode === 'rush') this.finished = true;
  }
  penalty() {
    this.combo = 1;
    this.streak = 0;
    this.comboTime = 0;
    this.score = Math.max(0, this.score - 200);
  }
  result(state, extra = {}) {
    return {
      mode: this.mode,
      distance: state.distance,
      maxSpeed: Math.max(this.maxSpeed, state.maxSpeed),
      score: Math.floor(this.score),
      time: this.time,
      overtakes: this.overtakes,
      near: this.near,
      crashes: this.crashes,
      ...extra,
    };
  }
}
