// A bounded accumulator prevents a tab switch from causing a physics time jump.
export class FixedStep {
  constructor(step = 1 / 120) {
    this.step = step;
    this.accumulator = 0;
  }

  advance(delta, update) {
    this.accumulator += Math.min(Math.max(delta, 0), 0.1);
    let steps = 0;
    while (this.accumulator + 1e-10 >= this.step) {
      update(this.step);
      this.accumulator -= this.step;
      steps++;
    }
    return steps;
  }

  reset() {
    this.accumulator = 0;
  }
}
