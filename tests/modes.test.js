import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionManager } from '../src/modes/SessionManager.js';
import { RaceManager } from '../src/modes/RaceManager.js';
import { SaveManager } from '../src/core/SaveManager.js';
import { RoadPath } from '../src/world/RoadPath.js';

test('rush scores distance, speed, overtakes, close passes, opposing lane and combo; crashes end it', () => {
  const s = new SessionManager();
  s.reset('rush');
  const player = { speed: 40, d: 2.3, maxSpeed: 40, distance: 100 };
  s.update(1, player, [{ type: 'near' }, { type: 'overtake' }]);
  assert.ok(s.score > 350);
  assert.equal(s.combo, 1.5);
  assert.equal(s.near, 1);
  assert.equal(s.overtakes, 1);
  const before = s.score;
  s.update(1, { ...player, d: -2.3 });
  assert.ok(s.score - before > 30);
  s.update(8, player);
  assert.equal(s.combo, 1);
  s.collision();
  assert.equal(s.finished, true);
  assert.equal(s.combo, 1);
  const score = s.score;
  s.update(1, player);
  assert.equal(s.score, score);
});
test('free ride has no scoring pressure and sessions reset completely', () => {
  const s = new SessionManager();
  s.update(30, { speed: 25, d: 2.3 });
  assert.equal(s.score, 0);
  s.reset('race');
  assert.equal(s.time, 0);
  assert.equal(s.finished, false);
});
test('race countdown, three different AI riders, checkpoints, positions and finish all work', () => {
  const path = new RoadPath(),
    race = new RaceManager(path);
  race.tickCountdown(2);
  assert.equal(race.countdown, 1);
  assert.equal(race.tickCountdown(1), true);
  assert.equal(race.rivals.length, 3);
  assert.equal(new Set(race.rivals.map((r) => r.pace)).size, 3);
  const player = { s: 24, d: 2.3, speed: 22 };
  for (let i = 0; i < 120 * 150; i++) {
    player.s += 22 / 120;
    race.update(1 / 120, player);
    if (race.finished) break;
  }
  assert.equal(race.checkpoint, 3);
  assert.equal(race.finished, true);
  assert.ok(race.finishTime > 130 && race.finishTime < 140);
  assert.ok(race.position(player) >= 1 && race.position(player) <= 4);
  assert.ok(
    race.rivals.every((r) => Number.isFinite(r.physics.state.s) && Math.abs(r.physics.state.d) < 5),
  );
  race.reset();
  assert.equal(race.time, 0);
  assert.equal(race.checkpoint, 0);
  assert.equal(race.finished, false);
});
test('high scores persist, lower scores do not replace them, unavailable storage is harmless', () => {
  const map = new Map(),
    storage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v) };
  const save = new SaveManager(storage);
  assert.equal(save.record('rush', { score: 400 }).best, true);
  assert.equal(save.record('rush', { score: 100 }).best, false);
  assert.equal(new SaveManager(storage).read('records', {}).rush.score, 400);
  map.set('infinite-ride:settings', 'broken-json');
  assert.equal(save.settings().traffic, 'medium');
  const blocked = new SaveManager({
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  });
  assert.deepEqual(blocked.read('records', {}), {});
  assert.equal(blocked.write('records', {}), false);
});
