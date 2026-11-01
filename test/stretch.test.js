/**
 * A play, faceoff to faceoff (src/lib/stretch.js). Every expectation below is
 * counted by hand from the events written out in this file.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { liveRun, markable, playAt, plays, zoneRuns, ZONE_RUN } from '../src/lib/stretch.js';

const HOME = 1, AWAY = 2;
const roster = { 10: { tid: HOME }, 20: { tid: AWAY } };
const ctx = { roster, homeId: HOME, awayId: AWAY };
const ev = (type, s, x, extra = {}) => ({ type, per: 1, pt: 'REG', s, x, y: 0, ...extra });

// Home defends -x, so x < -25 is the HOM end and x > 25 the AWY end.
const GAME = [
  ev('period-start', 0, null),                     // 0
  ev('faceoff', 0, 0, { actor: 10 }),              // 1  play A opens, neutral
  ev('hit', 12, 60, { actor: 20 }),                // 2  AWY end
  ev('shot-on-goal', 20, 70, { actor: 10 }),       // 3  HOM attempt, on goal, AWY end
  ev('missed-shot', 31, 80, { actor: 10 }),        // 4  HOM attempt, AWY end
  ev('stoppage', 40, null, { rsn: 'icing' }),      // 5  closes A
  ev('faceoff', 40, -69, { actor: 20 }),           // 6  play B opens, HOM end
  ev('blocked-shot', 45, -40, { actor: 20 }),      // 7  AWY attempt, HOM end
  ev('goal', 50, -80, { actor: 20, own: AWAY }),   // 8  AWY attempt, on goal, HOM end
  ev('faceoff', 50, 0, { actor: 10 }),             // 9  play C opens
  ev('period-end', 60, null),                      // 10 closes C
];

test('plays run from a faceoff to the event before the next one, or to the period end', () => {
  assert.deepEqual(plays(GAME), [{ from: 1, to: 5 }, { from: 6, to: 8 }, { from: 9, to: 10 }]);
  assert.equal(playAt(plays(GAME), 0), null, 'nothing before the first faceoff');
  assert.deepEqual(playAt(plays(GAME), 7), { from: 6, to: 8 });
});

test('a shootout is never part of a play', () => {
  const g = [...GAME.slice(0, 10), ev('shot-on-goal', 0, 80, { actor: 10, pt: 'SO', per: 5 })];
  assert.deepEqual(plays(g).at(-1), { from: 9, to: 9 });
  assert.equal(markable(g.at(-1)), false);
});

test('zone stretches: events in a row in one zone, inside one play', () => {
  const [A, B] = plays(GAME);
  // Play A: faceoff at centre (neutral), then three events past the AWY blue line.
  assert.deepEqual(zoneRuns(GAME, A, A.to, ctx).map(r => [r.end, r.marks, r.secs]), [['n', 1, 0], ['a', 3, 19]]);
  assert.equal(ZONE_RUN, 3);
  assert.equal(liveRun(zoneRuns(GAME, A, 3, ctx)), null, 'two in a row is not yet a stretch');
  const live = liveRun(zoneRuns(GAME, A, 4, ctx));
  assert.deepEqual([live.end, live.marks, live.att, live.onGoal], ['a', 3, { a: 0, h: 2 }, { a: 0, h: 1 }]);
  assert.deepEqual(zoneRuns(GAME, B, B.to, ctx).map(r => r.end), ['h'], 'play B never leaves the HOM end');
});

