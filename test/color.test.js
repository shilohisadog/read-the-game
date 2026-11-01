/**
 * The color line (src/lib/color.js). A small game written out by hand; every
 * expected note is worked out from the events below, not from the module.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { colorNotes, stayRetell } from '../src/lib/color.js';

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
const RATES = { census: { games: 4345, shift: { mean: 47.8 }, whistles: { ppGoals: 5275, ppChances: 24991 } },
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
  assert.deepEqual(notes.at(-1), [3, 'A shot from 29 feet. That puts HOM ahead, 1–0. The puck had stayed in the AWY end for 4 events in a row before it went in.']);
});

test('a penalty says "power play" only when the record shows one side a skater short', () => {
  const pen = (sitAfter) => game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('penalty', 30, 10, { own: AWAY, actor: 21, min: 2 }),
    ev('faceoff', 30, -69, { own: HOME, actor: 10, sit: sitAfter })]);
  assert.equal(notesOf(pen('1451'))[0][1],
    'Away21 sits in the penalty box for 2 minutes. AWY plays with fewer skaters until then: a "power play" for HOM.'
    + ' Across the 4,345 games we have measured, about 1 power play in 5 ended in a goal.');
  assert.equal(notesOf(pen('1441'))[0][1], 'Away21 sits in the penalty box for 2 minutes. Both teams keep the same number of skaters.');
  assert.equal(notesOf(pen('1451'), null)[0][1],
    'Away21 sits in the penalty box for 2 minutes. AWY plays with fewer skaters until then: a "power play" for HOM.',
    'with no archive, the base rate is left out rather than guessed');
});

/* Away short is `1451` (away goalie, 4 away skaters, 5 home, home goalie); home short is `1541`. */
const ppGame = (sit, pens, goalOwn = HOME) => game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
  ...pens.map(([own, actor, pen, sev = 'MIN', min = 2, at = 30]) => ev('penalty', at, 10, { own, actor, pen, sev, min })),
  ev('faceoff', 30, 0, { own: HOME, actor: 10, sit }),
  ev('goal', 60, goalOwn === HOME ? 60 : -60, { own: goalOwn, actor: goalOwn === HOME ? 10 : 20, sit })]);
const goalNote = g => notesOf(g, { ...RATES, census: { ...RATES.census, whistles: { ...RATES.census.whistles, shGoals: 600 } } }).at(-1)[1];

test('⭐ a power-play goal says so in skaters, who was in the box and for what, and how often that pays', () => {
  assert.match(goalNote(ppGame('1451', [[AWAY, 21, 'tripping']])),
    / HOM had 5 skaters to AWY's 4, because Away21 was in the penalty box for tripping: a "power play"\. Across the 4,345 games we have measured, about 1 power play in 5 ended in a goal\.$/);
});

test('a goal scored a skater short says that, with its own rate', () => {
  // 24,991 power plays over 600 goals by the team short: 1 in 42.
  assert.match(goalNote(ppGame('1541', [[HOME, 11, 'hooking']])),
    / HOM had 4 skaters to AWY's 5, because Home11 was in the penalty box for hooking: a goal scored "shorthanded"\. Across the 4,345 games we have measured, about 1 power play in 42 ended in a goal for the team with fewer skaters\.$/);
});

test('a misconduct leaves nobody short, so it is not named as the reason', () => {
  assert.match(goalNote(ppGame('1451', [[AWAY, 21, 'tripping'], [AWAY, 22, 'misconduct', 'MIS', 10]])),
    /because Away21 was in the penalty box for tripping: a "power play"/);
});

test('penalties offset at the same second against the other side are not the reason either', () => {
  assert.match(goalNote(ppGame('1451', [[AWAY, 21, 'tripping', 'MIN', 2, 20], [AWAY, 22, 'roughing'], [HOME, 11, 'roughing']])),
    /, because Away21 was in the penalty box for tripping: a "power play"/);
});

test('⭐ and when the record cannot say WHICH penalty an offset cancelled, nobody is named', () => {
  // Two away minors and one home minor at one second: the league does not say which away one it cancels.
  const say = goalNote(ppGame('1451', [[AWAY, 21, 'tripping'], [AWAY, 22, 'roughing'], [HOME, 11, 'roughing']]));
  assert.match(say, / HOM had 5 skaters to AWY's 4: a "power play"\./);
  assert.doesNotMatch(say, /because/);
});

test('when the box does not account for the gap, the goal gives the skaters and names nobody', () => {
  const say = goalNote(ppGame('1451', [[AWAY, 21, 'tripping'], [AWAY, 22, 'hooking']]));
  assert.match(say, / HOM had 5 skaters to AWY's 4: a "power play"\./);
  assert.doesNotMatch(say, /because/);
});

test('an even-strength goal says nothing about skaters', () => {
  assert.doesNotMatch(goalNote(ppGame('1551', [])), /skaters|power play/);
});

test('after an icing: who may not change, how long they have been out, and the fresh skaters opposite', () => {
  const g = game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('stoppage', 30, null, { rsn: 'icing' }),
    ev('faceoff', 30, 69, { own: HOME, actor: 10 })],             // back in the AWY end: AWY iced it
    [...shiftsFor([20, 21, 22, 23, 24], AWAY, 2, 60), ...shiftsFor([10, 11, 12], HOME, 30, 70)]);
  assert.deepEqual(notesOf(g), [[2, 'AWY may not change players for this face-off: its 5 skaters stay on, 28 seconds into their shift. HOM sent out 3 fresh skaters.']]);
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
    'A shot from 9 feet. That shot came from the slot, the area right in front of the net. About 1 shot in 9 from there goes in; from farther out, about 1 in 30.',
    'A shot from 9 feet. Another shot from the slot: HOM\'s 2nd of the game.']);
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
    'A shot from 49 feet.',                     // AWY attacks -x: 89 - 40
    'The puck has stayed in the HOM end for 3 events in a row; in that time AWY has 1 shot attempt.',
    // The blocked shot gets no type or distance: the league records only where it was blocked.
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
  assert.deepEqual(notesOf(g), [[2, 'AWY may not change players for this face-off.']]);
});

test('a shot opens with its type and its distance to the net it was shot at', () => {
  const g = game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('shot-on-goal', 5, 55, { actor: 10, y: 0, st: 'wrist' }),        // HOM shoots at +89: 34 ft
    ev('takeaway', 9, 0, { own: AWAY, actor: 20 }),
    ev('missed-shot', 12, -59, { actor: 21, y: 40, st: 'slap' }),       // AWY shoots at -89: hypot(30, 40) = 50
    ev('takeaway', 14, 0, { own: HOME, actor: 10 }),
    ev('shot-on-goal', 20, 88, { actor: 11, y: 0, st: 'tip-in' }),      // 1 ft
    ev('takeaway', 22, 0, { own: AWAY, actor: 20 }),
    ev('shot-on-goal', 30, null, { actor: 21, st: 'cradle' }),          // no coordinates: the type alone
    ev('takeaway', 32, 0, { own: HOME, actor: 10 }),
    ev('shot-on-goal', 40, 49, { actor: 12, y: 0, st: 'knuckler' })]);  // a type we have no words for
  const say = Object.fromEntries(notesOf(g, null));
  assert.equal(say[1], 'A wrist shot from 34 feet.');
  assert.equal(say[3], 'A slapshot from 50 feet.');
  assert.equal(say[5], 'A tipped shot from 1 foot.');
  assert.equal(say[7], 'A lacrosse-style "Michigan".');
  assert.equal(say[9], 'A shot from 40 feet.');
});

test('a long run of play: once past 3 in 4 runs’ events, again past 9 in 10 runs’ seconds', () => {
  const rates = { census: { runLength: { runs: 100, events: { p75: 3, p90: 5 }, secs: { p75: 60, p90: 100 } } } };
  const hit = (s, x, own) => ev('hit', s, x, { own, actor: own === HOME ? 11 : 21 });
  const g = game([ev('stoppage', 0, null), ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    hit(10, 40, HOME), hit(20, -40, AWAY), hit(30, 40, HOME),          // the 4th mark passes 3
    hit(50, -40, AWAY), hit(90, 40, HOME),                              // nothing new to say
    hit(101, -40, AWAY), hit(130, 40, HOME)]);                          // 101 s passes 100, once
  assert.deepEqual(notesOf(g, rates), [
    [4, '4 events and 30 seconds of play since the last whistle.'],
    [7, 'Still no whistle after 1:41 of play and 7 events.']]);
});

test('the first run of a period counts from the period’s start, and no archive means no long-run note', () => {
  const rates = { census: { runLength: { runs: 100, events: { p75: 2, p90: 5 }, secs: { p75: 60, p90: 999 } } } };
  const g = game([ev('period-start', 0, null), ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('hit', 10, 40, { own: HOME, actor: 11 }), ev('hit', 75, -40, { own: AWAY, actor: 21 })]);
  assert.deepEqual(notesOf(g, rates), [[3, '3 events and 1:15 of play since the period began.']]);
  assert.deepEqual(notesOf(g, null), []);
});

test('a recount after the puck left replaces the stay, or removes it when the new run is short', () => {
  const ctx2 = { awayAb: 'AWY', homeAb: 'HOM' };
  const lead = 'A wrist shot from 42 feet. That puts HOM ahead, 1–0. The puck had stayed in the AWY end for 3 events in a row before it went in.';
  assert.equal(stayRetell(lead, null, ctx2, 'a'), 'A wrist shot from 42 feet. That puts HOM ahead, 1–0.');
  const again = { end: 'a', marks: 4, att: { a: 0, h: 3 } };
  assert.equal(stayRetell(lead, again, ctx2, 'a'),
    'A wrist shot from 42 feet. That puts HOM ahead, 1–0. The puck had stayed in the AWY end for 4 events in a row before it went in.');
  assert.equal(stayRetell(lead, again, ctx2, 'h'),
    'A wrist shot from 42 feet. That puts HOM ahead, 1–0.', 'a stay in the other end is not how this goal went in');
  const live = 'The puck has stayed in the HOM end for 4 events in a row; in that time AWY has 2 shot attempts.';
  assert.equal(stayRetell(live, null, ctx2, null), '');
  assert.equal(stayRetell(live, { end: 'h', marks: 3, att: { a: 1, h: 0 } }, ctx2, null),
    'The puck has stayed in the HOM end for 3 events in a row; in that time AWY has 1 shot attempt.');
  assert.equal(stayRetell('That puts HOM ahead, 1–0.', null, ctx2, 'a'), 'That puts HOM ahead, 1–0.');
});

/* What came just before a goal (Kevin, 2026-11-01): a save with play going on, a face-off, long shifts.
   Measured over 1,395 tracked goals of 2026-27: about 10%, 9% and 19% (of goals with shift records). */
const lastNote = g => notesOf(g).at(-1)[1];

test('a goal soon after a save, with no whistle between, says it was a second chance', () => {
  const at = (shotS, extra = [], by = 12) => game([ev('faceoff', 0, 69, { own: AWAY, actor: 20 }),
    ev('shot-on-goal', shotS, 70, { actor: by, goalie: 29 }), ...extra, ev('goal', 22, 80, { own: HOME, actor: 10 })]);
  assert.match(lastNote(at(20)), / AwayG had stopped a HOM shot 2 seconds before, and play went on: a second chance, called a "rebound"\.$/);
  assert.match(lastNote(at(19)), /stopped a HOM shot 3 seconds before/, 'the cut-off is inclusive');
  assert.doesNotMatch(lastNote(at(18)), /rebound/, 'four seconds is past the cut-off');
  assert.doesNotMatch(lastNote(at(20, [ev('stoppage', 21, null), ev('faceoff', 21, 69, { own: HOME, actor: 10 })])), /rebound/,
    'a whistle between the save and the goal');
  assert.doesNotMatch(lastNote(at(20, [], 22)), /rebound/, 'the save was of the other team’s shot');
});

test('a goal soon after a face-off says so, and who won it', () => {
  const at = (s, own) => game([ev('faceoff', 0, 69, { own, actor: own === HOME ? 10 : 20 }), ev('goal', s, 80, { own: HOME, actor: 10 })]);
  assert.match(lastNote(at(6, AWAY)), / It came 6 seconds after the face-off, which AWY won\.$/);
  assert.match(lastNote(at(10, HOME)), /It came 10 seconds after the face-off, which HOM won\./);
  assert.doesNotMatch(lastNote(at(11, HOME)), /face-off/);
});

test('a goal against skaters out over a minute gives their seconds and the typical shift, never "tired"', () => {
  const at = s => game([ev('faceoff', 0, 0, { own: AWAY, actor: 20 }), ev('goal', s, 80, { own: HOME, actor: 10 })],
    [...shiftsFor([20, 21], AWAY, 0, 200), ...shiftsFor([22, 23, 24], AWAY, s - 30, 200), ...shiftsFor([10, 11, 12, 13, 14], HOME, 0, 200)]);
  assert.match(lastNote(at(70)), / 2 of the AWY skaters had been on the ice over a minute \(70 seconds each\); a typical shift is about 48 seconds\.$/);
  assert.doesNotMatch(lastNote(at(60)), /over a minute/, 'sixty seconds is not over a minute');
  assert.doesNotMatch(lastNote(at(70)), /HOM skaters|tired/i, 'the scoring team’s shifts, or a judgement');
});

test('the power-play sentence names who sat in the box: a goalie’s penalty is served by a skater', () => {
  /* 2026020225: Greaves (CBJ's goalie) took delay of game, Fantilli served it, and DAL scored on the
     power play. The sentence said "because Greaves was in the penalty box". */
  const g = (actor, srv, sev = 'MIN') => game([ev('faceoff', 0, 0, { own: HOME, actor: 10 }),
    ev('penalty', 30, 10, { own: AWAY, actor, srv, pen: 'delaying-game-puck-over-glass', sev, min: 2 }),
    ev('faceoff', 30, 0, { own: HOME, actor: 10, sit: '1451' }),
    ev('goal', 60, 60, { own: HOME, actor: 10, sit: '1451' })]);
  assert.match(lastNote(g(29, 21)), /, because Away21 was in the penalty box, serving AwayG’s penalty for delay of game/);
  assert.doesNotMatch(lastNote(g(29, 21)), /AwayG was in the penalty box/);
  assert.match(lastNote(g(null, 21, 'BEN')), /, because Away21 was in the penalty box, serving a bench penalty for delay of game/);
  assert.match(lastNote(g(22, undefined)), /, because Away22 was in the penalty box for delay of game/, 'a skater who serves his own');
  assert.equal(notesOf(g(29, 21))[0][1].split(' AWY plays')[0],
    'AwayG takes a penalty. A goalie does not go to the penalty box, so a teammate serves it: Away21 sits there for 2 minutes.');
  assert.equal(notesOf(g(null, 21, 'BEN'))[0][1].split(' AWY plays')[0],
    'AWY takes a bench penalty, so a skater serves it: Away21 sits in the penalty box for 2 minutes.');
});
