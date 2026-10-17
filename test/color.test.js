/**
 * The color line (src/lib/color.js). A small game written out by hand; every
 * expected note is worked out from the events below, not from the module.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { colorNotes } from '../src/lib/color.js';

const HOME = 1, AWAY = 2;
const roster = {
  10: { tid: HOME, nm: 'Home10', pos: 'C' }, 11: { tid: HOME, nm: 'Home11', pos: 'L' },
  12: { tid: HOME, nm: 'Home12', pos: 'R' }, 13: { tid: HOME, nm: 'Home13', pos: 'D' },
  14: { tid: HOME, nm: 'Home14', pos: 'D' }, 19: { tid: HOME, nm: 'HomeG', pos: 'G' },
  20: { tid: AWAY, nm: 'Away20', pos: 'C' }, 21: { tid: AWAY, nm: 'Away21', pos: 'L' },
  22: { tid: AWAY, nm: 'Away22', pos: 'R' }, 23: { tid: AWAY, nm: 'Away23', pos: 'D' },
  24: { tid: AWAY, nm: 'Away24', pos: 'D' }, 29: { tid: AWAY, nm: 'AwayG', pos: 'G' },
};
const ctx = { roster, homeId: HOME, awayId: AWAY, homeAb: 'HOM', awayAb: 'AWY' };
const RATES = { census: { shift: { mean: 47.8 }, whistles: { ppGoals: 5275, ppChances: 24991 } },
  slot: { scoredFromInside: { count: 19626, n: 168930 }, scoredFromOutside: { count: 6634, n: 201723 } } };
const ev = (type, s, x, extra = {}) => ({ type, per: 1, pt: 'REG', s, x, y: 0, sit: '1551', ...extra });
// Home attacks +x (home defends -x), so x > 25 is the AWY end.
const shiftsFor = (ids, tid, s, e) => ids.map(p => ({ p, t: tid, s, e }));

function game(events, shifts = []) {
  return { events, roster, shifts, teams: { home: { id: HOME, ab: 'HOM' }, away: { id: AWAY, ab: 'AWY' } } };
}
const notesOf = (g, rates = RATES) => [...colorNotes(g, ctx, rates).entries()];

test('a goal says what it does to the score, and how long the puck had stayed in that end', () => {
  const g = game([
    ev('faceoff', 0, 69, { own: HOME, actor: 10 }),             // AWY end
    ev('hit', 5, 70, { own: HOME, actor: 11 }),
    ev('missed-shot', 9, 40, { actor: 12 }),                    // 49 ft out: not the slot
    ev('goal', 12, 60, { own: HOME, actor: 10 }),               // 29 ft, centred: the slot
  ]);
  const notes = notesOf(g);
  assert.deepEqual(notes.at(-1), [3, 'That puts HOM ahead, 1–0. The puck had stayed in the AWY end for 4 events in a row before it went in.']);
});

test('a penalty says "power play" only when the record shows one side a skater short', () => {
  const pen = (sitAfter) => game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('penalty', 30, 10, { own: AWAY, actor: 21, min: 2 }),
    ev('faceoff', 30, -69, { own: HOME, actor: 10, sit: sitAfter })]);
  assert.equal(notesOf(pen('1451'))[0][1],
    'Away21 sits in the penalty box for 2 minutes. AWY plays with fewer skaters until then: a "power play" for HOM.'
    + ' Over the last three seasons, about 1 power play in 5 ended in a goal.');
  assert.equal(notesOf(pen('1441'))[0][1], 'Away21 sits in the penalty box for 2 minutes. Both teams keep the same number of skaters.');
  assert.equal(notesOf(pen('1451'), null)[0][1],
    'Away21 sits in the penalty box for 2 minutes. AWY plays with fewer skaters until then: a "power play" for HOM.',
    'with no archive, the base rate is left out rather than guessed');
});

test('after an icing: who may not change, how long they have been out, and the fresh skaters opposite', () => {
  const g = game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('stoppage', 30, null, { rsn: 'icing' }),
    ev('faceoff', 30, 69, { own: HOME, actor: 10 })],             // back in the AWY end: AWY iced it
    [...shiftsFor([20, 21, 22, 23, 24], AWAY, 2, 60), ...shiftsFor([10, 11, 12], HOME, 30, 70)]);
  assert.deepEqual(notesOf(g), [[2, 'AWY may not change players for this faceoff: its 5 skaters stay on, 28 seconds into their shift. HOM sent out 3 fresh skaters.']]);
});

test('another reason play stopped is explained the first time only; the pill covers offside', () => {
  const g = game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('stoppage', 10, null, { rsn: 'puck-in-netting' }), ev('faceoff', 10, 69, { own: HOME, actor: 10 }),
    ev('stoppage', 20, null, { rsn: 'puck-in-netting' }), ev('faceoff', 20, 69, { own: HOME, actor: 10 }),
    ev('stoppage', 30, null, { rsn: 'offside' }), ev('faceoff', 30, 20, { own: HOME, actor: 10 })]);
  const notes = notesOf(g);
  assert.equal(notes.length, 1);
  assert.match(notes[0][1], /^Why play stopped: /);
});

test('the slot: the base rate on a team\'s first shot from there, a count after', () => {
  const g = game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('shot-on-goal', 5, 80, { actor: 10 }), ev('takeaway', 9, -10, { own: AWAY, actor: 20 }),
    ev('shot-on-goal', 15, 80, { actor: 11 })]);
  assert.deepEqual(notesOf(g).map(n => n[1]), [
    'That shot came from the slot, the area right in front of the net. About 1 shot in 9 from there goes in; from farther out, about 1 in 30.',
    'Another shot from the slot: HOM\'s 2nd of the game.']);
});

test('the shift clock speaks once per group, when every skater is past the typical shift', () => {
  const g = game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('takeaway', 40, -40, { own: AWAY, actor: 20 }),            // 40 s: not yet
    ev('takeaway', 50, 40, { own: HOME, actor: 10 }),             // 50 s: every HOM skater past the mean, 48
    ev('takeaway', 55, -40, { own: AWAY, actor: 20 })],           // the same group: silence
    // (ends alternate, so no zone stretch speaks instead)
    shiftsFor([10, 11, 12, 13, 14], HOME, 0, 90));
  assert.deepEqual(notesOf(g), [[2, 'Every HOM skater on the ice has been out longer than a typical shift (about 48 seconds): 50 seconds each.']]);
});

test('the zone stretch counts events in a row and the attempts in that time, never who had the puck', () => {
  const g = game([ev('faceoff', 0, -69, { own: AWAY, actor: 20 }),   // HOM end
    ev('missed-shot', 4, -40, { actor: 21 }), ev('hit', 8, -50, { own: HOME, actor: 13 }),
    ev('blocked-shot', 12, -45, { actor: 22, blk: 14 })]);
  assert.deepEqual(notesOf(g).map(n => n[1]), [
    'The puck has stayed in the HOM end for 3 events in a row; in that time AWY has 1 shot attempt.',
    'The puck has stayed in the HOM end for 4 events in a row; in that time AWY has 2 shot attempts.']);
});

test('the next period opens with the totals so far', () => {
  const g = game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }), ev('shot-on-goal', 5, 40, { actor: 10 }),
    ev('period-end', 1200, null), ev('period-start', 1200, null, { per: 2 }),
    ev('faceoff', 1200, 0, { own: AWAY, actor: 20, per: 2 })]);
  assert.equal(notesOf(g).at(-1)[1],
    'After one period: shots on goal AWY 0, HOM 1; all shot attempts AWY 0, HOM 1; shots from the slot AWY 0, HOM 0.');
});

test('no note claims possession, intent or a judgement the record cannot make', () => {
  const g = game([ev('faceoff', 0, 69, { own: HOME, actor: 10 }), ev('hit', 5, 70, { own: HOME, actor: 11 }),
    ev('missed-shot', 9, 40, { actor: 12 }), ev('goal', 12, 60, { own: HOME, actor: 10 })],
    shiftsFor([10, 11, 12, 13, 14], HOME, -50, 90));
  for (const [, say] of notesOf(g)) assert.doesNotMatch(say, /\b(had|kept|controlled) the puck|tired|momentum|dominat|trying to/i, say);
});

test('after an icing, a skater who came on as the puck was iced leaves the seconds out', () => {
  const g = game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('stoppage', 30, null, { rsn: 'icing' }), ev('faceoff', 30, 69, { own: HOME, actor: 10 })],
    [...shiftsFor([20, 21, 22, 23], AWAY, 2, 60), ...shiftsFor([24], AWAY, 30, 60)]);
  assert.deepEqual(notesOf(g), [[2, 'AWY may not change players for this faceoff.']]);
});
