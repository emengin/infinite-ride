import { VEHICLES } from '../traffic/TrafficSimulation.js';

// Explicit ?test=1 only. Scenario arrangement and accelerated fixed-step driving
// exercise the same game systems as keyboard input; never used by normal play.
export function createTestDriver(game) {
  return Object.freeze({
    player(values) {
      game.physics.reset(values.s ?? 24);
      Object.assign(game.physics.state, values);
      game.physics.state.prevS = game.physics.state.s;
      game.physics.state.prevD = game.physics.state.d;
      game.camera.rebase(game.world.update(game.physics.state.s));
      game.camera.initialized = false;
      game.setMode('running');
    },
    traffic(vehicles) {
      const sim = game.traffic.simulation;
      sim.density = 'off';
      sim.pool.forEach((a) => (a.active = false));
      vehicles.forEach((values, i) => {
        const c = VEHICLES[values.type ?? 0],
          dir = values.dir ?? 1;
        Object.assign(sim.pool[i], {
          active: true,
          type: values.type ?? 0,
          speed: values.speed ?? 20,
          cruise: values.speed ?? 20,
          s: values.s,
          prevS: values.s,
          d: values.d ?? dir * 2.3,
          prevD: values.d ?? dir * 2.3,
          dir,
          halfWidth: c.width / 2,
          halfLength: c.length / 2,
          headingError: dir === 1 ? 0 : Math.PI,
          targetD: values.d ?? dir * 2.3,
          passing: null,
          cooldown: 30,
          closest: Infinity,
          passed: false,
        });
      });
    },
    advance(seconds, input = { throttle: 1 }) {
      for (let i = 0; i < Math.round(seconds * 120); i++) {
        if (game.mode !== 'running') break;
        game.step(1 / 120, input);
        if (i % 120 === 0) game.camera.rebase(game.world.update(game.physics.state.s));
      }
      game.camera.rebase(game.world.update(game.physics.state.s));
      return game.snapshot();
    },
  });
}
