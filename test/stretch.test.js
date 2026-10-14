/**
 * A play, faceoff to faceoff (src/lib/stretch.js). Every expectation below is
 * counted by hand from the events written out in this file.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { endOf, markable, playAt, playLine, playTally, plays } from '../src/lib/stretch.js';

const HOME = 1, AWAY = 2;
const roster = { 10: { tid: HOME }, 20: { tid: AWAY } };
const ctx = { roster, homeId: HOME, awayId: AWAY };
const names = { a: 'AWY', h: 'HOM', awayId: AWAY, homeId: HOME, reason: r => ({ icing: 'Icing' })[r] || r };
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

test('the tally counts marks, attempts, shots on goal and ends, up to the playhead', () => {
  const [A, B] = plays(GAME);
  assert.deepEqual(playTally(GAME, A, A.to, ctx), {
    marks: 4, secs: 31, att: { a: 0, h: 2 }, onGoal: { a: 0, h: 1 }, end: { a: 3, h: 0, n: 1 } });
  assert.deepEqual(playTally(GAME, A, 2, ctx).marks, 2, 'stops at the playhead');
  assert.deepEqual(playTally(GAME, B, B.to, ctx), {
    marks: 3, secs: 10, att: { a: 2, h: 0 }, onGoal: { a: 1, h: 0 }, end: { a: 0, h: 3, n: 0 } });
});

test('a play ends at its goal, its penalty, its stoppage or the period, in that order', () => {
  const [A, B, C] = plays(GAME);
  assert.deepEqual(endOf(GAME, A), { kind: 'stoppage', rsn: 'icing' });
  assert.deepEqual(endOf(GAME, B), { kind: 'goal', team: AWAY });
  assert.deepEqual(endOf(GAME, C), { kind: 'period' });
  const pen = [ev('faceoff', 0, 0), ev('stoppage', 5, null, { rsn: 'icing' }), ev('penalty', 5, 10, { own: HOME })];
  assert.deepEqual(endOf(pen, { from: 0, to: 2 }), { kind: 'penalty', team: HOME }, 'the penalty outranks its stoppage');
});

test('the line, running and finished', () => {
  const [A, B] = plays(GAME);
  assert.equal(playLine(playTally(GAME, A, 4, ctx), null, names),
    'This play · 31s since the faceoff · HOM 2 attempts (1 on goal), AWY 0 · 3 of 4 events in the AWY end');
  assert.equal(playLine(playTally(GAME, A, A.to, ctx), endOf(GAME, A), names),
    'Last play · 31s · HOM 2 attempts (1 on goal), AWY 0 · 3 of 4 events in the AWY end · ended: icing');
  assert.equal(playLine(playTally(GAME, B, B.to, ctx), endOf(GAME, B), names),
    'Last play · 10s · AWY 2 attempts (1 on goal), HOM 0 · 3 of 3 events in the HOM end · ended: AWY goal');
});

test('the line says nothing it cannot count', () => {
  const [A] = plays(GAME);
  assert.equal(playLine(playTally(GAME, A, 1, ctx), null, names), '', 'a lone faceoff is not yet a play to sum up');
  // A tie for the busiest zone names none of them.
  const tie = [ev('faceoff', 0, 0), ev('hit', 5, 60, { actor: 20 }), ev('hit', 9, -60, { actor: 10 })];
  assert.equal(playLine(playTally(tie, { from: 0, to: 2 }, 2, ctx), null, names),
    'This play · 9s since the faceoff · no attempts');
});
