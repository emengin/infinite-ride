import test from 'node:test';
import assert from 'node:assert/strict';
import { RoadPath } from '../src/world/RoadPath.js';
import { RaceManager } from '../src/modes/RaceManager.js';
import { TrafficSimulation } from '../src/traffic/TrafficSimulation.js';
import { sweepBoxes } from '../src/physics/CollisionSystem.js';
test('race AI handles live traffic and finished riders clear the finish line', () => {
  const path = new RoadPath(),
    race = new RaceManager(path),
    traffic = new TrafficSimulation(path, 'medium');
  traffic.reset(24);
  const player = { s: 24, d: 2.3, prevS: 24, speed: 22, halfWidth: 0.36, halfLength: 1.08 };
  let overlaps = 0;
  for (let i = 0; i < 120 * 145; i++) {
    player.prevS = player.s;
    player.s += 22 / 120;
    traffic.update(1 / 120, player, race.actors);
    race.update(1 / 120, player, traffic.actors);
    if (i % 12 === 0) {
      const rivals = race.actors.filter((a) => a.active);
      for (const a of rivals)
        for (const b of [...traffic.actors, ...rivals]) {
          if (a.id === b.id || Math.abs(a.s - b.s) > 12) continue;
          if (
            sweepBoxes({ ...a, prevS: a.s, prevD: a.d }, { ...b, prevS: b.s, prevD: b.d }) !== null
          )
            overlaps++;
        }
    }
    if (race.finished) break;
  }
  assert.equal(race.finished, true);
  assert.equal(overlaps, 0, `NPC overlap samples ${overlaps}`);
  assert.ok(
    race.rivals.filter((r) => r.finishTime !== null).every((r) => r.physics.state.speed > 0),
  );
});
