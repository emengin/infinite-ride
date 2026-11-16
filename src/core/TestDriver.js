import { VEHICLES } from '../traffic/TrafficSimulation.js';

// Explicit ?test=1 only. Scenario arrangement and accelerated fixed-step driving
// exercise the same game systems as keyboard input; never used by normal play.
export function createTestDriver(game) {
  return Object.freeze({
    resetPerformance() {
      game.performance.apply(game.settings);
      game.lastTime = 0;
      game.fps = 60;
    },
    disposeCheck() {
      game.dispose();
      game.physics.state.s = 987;
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
      document.getElementById('start-button').click();
      return {
        keys: game.input.keys.size,
        position: game.physics.state.s,
        debugRemoved: !window.__ride,
        geometries: game.renderer.webgl.info.memory.geometries,
        textures: game.renderer.webgl.info.memory.textures,
      };
    },
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
    drive(seconds, targetSpeed = 30) {
      for (let i = 0; i < Math.round(seconds * 120); i++) {
        if (game.mode !== 'running') break;
        const st = game.physics.state,
          curve = Math.max(
            Math.abs(game.path.frame(st.s + 30).curvature),
            Math.abs(game.path.frame(st.s + 60).curvature),
          );
        let target = Math.min(targetSpeed, Math.sqrt(7 / Math.max(curve, 0.0001)));
        const actors = [
          ...game.traffic.simulation.actors,
          ...(game.playMode === 'race' ? game.race.actors : []),
        ];
        for (const a of actors)
          if (a.s > st.s && Math.abs(a.d - st.d) < a.halfWidth + 0.6)
            target = Math.min(
              target,
              Math.max(0, a.speed * a.dir + (a.s - st.s - a.halfLength - 5) * 0.55),
            );
        game.step(1 / 120, {
          throttle: Math.max(0, Math.min(1, 0.4 + (target - st.speed) * 0.3)),
          brake: Math.max(0, Math.min(1, (st.speed - target) / 5)),
          steer: Math.max(-1, Math.min(1, (2.3 - st.d) * 0.65)),
        });
        if (i % 120 === 0) game.camera.rebase(game.world.update(st.s));
      }
      game.camera.rebase(game.world.update(game.physics.state.s));
      return game.snapshot();
    },
  });
}
