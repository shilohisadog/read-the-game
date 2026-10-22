/**
 * Challenges and league reviews (src/lib/challenge.js), and the sentence the color
 * line says on the first frame after one. Small games written out by hand; every
 * expected outcome is read from the events below, and checked a second way by the
 * restart: after a goal that counts, play restarts at centre ice.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges, reviewName, reviewSay } from '../src/lib/challenge.js';
import { colorNotes } from '../src/lib/color.js';

const HOME = 1, AWAY = 2;
const roster = {
  10: { tid: HOME, nm: 'Home10', pos: 'C' }, 20: { tid: AWAY, nm: 'Away20', pos: 'C' },
  21: { tid: AWAY, nm: 'Away21', pos: 'L' },
};
const ctx = { roster, homeId: HOME, awayId: AWAY, homeAb: 'HOM', awayAb: 'AWY' };
const ev = (type, s, extra = {}) => ({ type, per: 1, pt: 'REG', s, x: null, y: null, sit: '1551', ...extra });
const fo = (s, x, extra = {}) => ev('faceoff', s, { x, y: 0, own: HOME, actor: 10, ...extra });
const stop = (s, rsn, extra = {}) => ev('stoppage', s, { rsn, ...extra });
const goal = (s, own, actor) => ev('goal', s, { own, actor, x: own === HOME ? 80 : -80, y: 0 });
const lost = (s, own) => ev('penalty', s, { own, actor: own === AWAY ? 21 : 10, pen: 'delaying-game-unsuccessful-challenge', min: 2, sev: 'BEN' });
const game = events => ({ events, roster, shifts: [], teams: { home: { id: HOME, ab: 'HOM' }, away: { id: AWAY, ab: 'AWY' } } });
const noteAt = (events, k) => colorNotes(game(events), ctx, null).get(k);
// The second path: a goal that counts restarts at centre ice.
const centre = (events, r) => { const f = events.slice(r.at + 1).find(e => e.type === 'faceoff'); return !!f && f.x === 0 && f.y === 0; };

test('⭐ a goal that came off for offside: no goal event, the ruling at the same second, play restarts away from centre', () => {
  const E = [fo(0, 0), ev('hit', 10, { own: AWAY, actor: 20, x: 50, y: 0 }),
    stop(30, 'chlg-vis-off-side'), stop(30, 'offside'), fo(30, -20, { y: 22 })];
  const [r] = challenges(E, ctx);
  assert.equal(r.outcome, 'off');
  assert.equal(r.scorer, HOME, 'the goal was the bench that did not challenge');
  assert.equal(centre(E, r), false);
  assert.equal(noteAt(E, 4), 'HOM scored, but AWY challenged that HOM was offside prior to the goal. '
    + 'The review determined HOM was offside, so the goal came off. The score stays tied, 0–0.');
});

test('a goal that came off for goaltender interference names no ruling, and the score line names the leader', () => {
  const E = [fo(0, 0), goal(5, AWAY, 20), fo(5, 0), stop(40, 'chlg-vis-goal-interference'), fo(40, 20, { y: 22 })];
  assert.equal(challenges(E, ctx)[0].outcome, 'off');
  assert.equal(noteAt(E, 4), 'HOM scored, but AWY challenged that a HOM player interfered with the goaltender. '
    + 'The review determined a HOM player interfered with the goaltender, so the goal came off. AWY still leads 1–0.');
});

test('a missed stoppage names the ruling only where the league recorded one', () => {
  const named = [fo(0, 0), stop(20, 'chlg-hm-missed-stoppage'), stop(20, 'high-stick'), fo(20, 20, { y: 22 })];
  assert.equal(challenges(named, ctx)[0].ruling, 'high-stick');
  assert.equal(noteAt(named, 3), 'AWY scored, but HOM challenged that play should already have been stopped prior to the goal. '
    + 'The review determined play should have been stopped (a high stick on the puck), so the goal came off. The score stays tied, 0–0.');
  const bare = [fo(0, 0), stop(20, 'chlg-hm-missed-stoppage'), fo(20, 20, { y: 22 })];
  assert.match(noteAt(bare, 2), /determined play should have been stopped, so the goal came off/);
});

test('⭐ a goal that stood: the penalty for losing the challenge, said on the penalty frame with what follows', () => {
  const E = [fo(0, 0), goal(12, HOME, 10), stop(12, 'chlg-vis-goal-interference'), lost(12, AWAY), fo(12, 0, { sit: '1451' })];
  const [r] = challenges(E, ctx);
  assert.equal(r.outcome, 'stood');
  assert.equal(centre(E, r), true);
  assert.equal(noteAt(E, 3), 'HOM scored, and AWY challenged that a HOM player interfered with the goaltender. '
    + 'The review concluded the goal stands, and AWY takes a two-minute penalty for losing the challenge. '
    + 'AWY plays with fewer skaters for those two minutes: a "power play" for HOM.');
});

test('a goal recorded after the challenge stoppage is read the same way', () => {
  const E = [fo(0, 0), stop(12, 'chlg-vis-goal-interference'), goal(12, HOME, 10), lost(12, AWAY), fo(12, 0, { sit: '1441' })];
  assert.equal(challenges(E, ctx)[0].outcome, 'stood');
  assert.match(noteAt(E, 3), /^HOM scored, and AWY challenged .* losing the challenge\. Both teams keep the same number of skaters\.$/);
});

test('a team challenging to have its own goal count: it counts, or it does not and the team is penalised', () => {
  const counts = [fo(0, 0), stop(30, 'chlg-hm-goal-interference'), goal(30, HOME, 10), fo(30, 0)];
  const [a] = challenges(counts, ctx);
  assert.equal(a.outcome, 'awarded');
  assert.equal(centre(counts, a), true);
  assert.equal(noteAt(counts, 3), 'HOM challenged to have its goal count; the question was interference with the goaltender. '
    + 'The review concluded the goal counts.');
  const not = [fo(0, 0), stop(30, 'chlg-hm-goal-interference'), lost(30, HOME), fo(30, 69, { sit: '1541' })];
  const [b] = challenges(not, ctx);
  assert.equal(b.outcome, 'stayed-off');
  assert.equal(centre(not, b), false);
  assert.match(noteAt(not, 2), /^HOM challenged to have its goal count; the question was interference with the goaltender\. The review concluded the goal does not count, and HOM takes a two-minute penalty for losing the challenge\./);
});

test('a league review names no bench; one that took a goal off names no team', () => {
  const off = [fo(0, 0), stop(30, 'chlg-league-off-side'), stop(30, 'offside'), fo(30, 20, { y: 22 })];
  assert.equal(challenges(off, ctx)[0].outcome, 'off');
  assert.equal(noteAt(off, 3), 'The league reviewed a goal for offside. The review determined the play was offside, so the goal came off. The score stays tied, 0–0.');
  const gi = [fo(0, 0), stop(30, 'chlg-league-goal-interference'), fo(30, 20, { y: 22 })];
  assert.equal(noteAt(gi, 2), 'The league reviewed a goal for interference with the goaltender. '
    + 'The review determined a player interfered with the goaltender, so the goal came off. The score stays tied, 0–0.');
  const stood = [fo(0, 0), goal(30, AWAY, 20), stop(30, 'chlg-league-goal-interference'), fo(30, 0)];
  assert.equal(challenges(stood, ctx)[0].outcome, 'stood');
  assert.equal(noteAt(stood, 3), "The league reviewed AWY's goal for interference with the goaltender. The review concluded the goal stands.");
});

test('a review of the goal that ends the game is said on the goal itself', () => {
  const E = [fo(0, 0), goal(30, AWAY, 20), stop(30, 'chlg-league-off-side'), ev('period-end', 30), ev('game-end', 30)];
  assert.match(noteAt(E, 1), /That puts AWY ahead, 1–0\. The league reviewed AWY's goal for offside\. The review concluded the goal stands\.$/);
});

test('a challenge behind another whistle (the secondary reason) is read too; a puck over the glass is not about a goal', () => {
  const E = [fo(0, 0), stop(30, 'referee-or-linesman', { rsn2: 'chlg-vis-off-side' }), stop(30, 'offside'), fo(30, -20, { y: 22 }),
    stop(50, 'chlg-vis-puck-over-glass'), fo(50, 69, { y: 22 })];
  const rs = challenges(E, ctx);
  assert.equal(rs.length, 1);
  assert.equal(rs[0].outcome, 'off');
  assert.match(noteAt(E, 3), /^HOM scored, but AWY challenged/);
});

test('⭐ the stoppage card names the goal as what stopped play, and the teams instead of "home" and "visiting"', () => {
  const ab = id => (id === HOME ? 'HOM' : 'AWY');
  const off = challenges([fo(0, 0), stop(30, 'chlg-vis-off-side'), stop(30, 'offside'), fo(30, -20, { y: 22 })], ctx)[0];
  assert.equal(reviewName(off, ab), 'Goal, AWY challenged that HOM was offside prior to the goal');
  assert.equal(reviewSay(off, ab), 'Play stopped for a goal, and AWY challenged that HOM was offside prior to the goal.');
  const gi = challenges([fo(0, 0), goal(12, HOME, 10), stop(12, 'chlg-vis-goal-interference'), lost(12, AWAY), fo(12, 0)], ctx)[0];
  assert.equal(reviewName(gi, ab), 'Goal, AWY challenged that a HOM player interfered with the goaltender');
  const own = challenges([fo(0, 0), stop(30, 'chlg-hm-goal-interference'), goal(30, HOME, 10), fo(30, 0)], ctx)[0];
  assert.equal(reviewName(own, ab), 'Goal, HOM challenged to have it count');
  assert.equal(reviewSay(own, ab), 'Play stopped, and HOM challenged to have its goal count; the question was interference with the goaltender.');
  const lg = challenges([fo(0, 0), stop(30, 'chlg-league-missed-stoppage'), fo(30, 20, { y: 22 })], ctx)[0];
  assert.equal(reviewName(lg, ab), 'Goal, the league reviewed it for a missed stoppage');
  for (const r of [off, gi, own, lg]) assert.doesNotMatch(reviewName(r, ab) + reviewSay(r, ab), /home|visiting/i);
});

test('⭐ a coach\'s challenge carries the archive\'s counts, shown as counts; a league review does not', () => {
  const rates = { census: { games: 4345, reviews: { coach: 739, coachWon: 499, league: 54, leagueOff: 26 } } };
  const E = [fo(0, 0), stop(30, 'chlg-vis-off-side'), stop(30, 'offside'), fo(30, -20, { y: 22 })];
  assert.equal(colorNotes(game(E), ctx, rates).get(3), 'HOM scored, but AWY challenged that HOM was offside prior to the goal. '
    + 'The review determined HOM was offside, so the goal came off. The score stays tied, 0–0. '
    + 'Across the 4,345 games we have measured, coaches have won 499 of 739 challenges of a goal, about 2 in 3.');
  const L = [fo(0, 0), stop(30, 'chlg-league-off-side'), stop(30, 'offside'), fo(30, 20, { y: 22 })];
  assert.doesNotMatch(colorNotes(game(L), ctx, rates).get(3), /coaches/);
  assert.doesNotMatch(noteAt(E, 3), /coaches/, 'with no archive the counts are left out, not guessed');
});

test('the census counts each review once, and a coach wins on a goal taken off or its own goal made to count', async () => {
  const { censusGame, censusAdd, censusRates } = await import('../src/lib/census.js');
  const E = [fo(0, 0), stop(30, 'chlg-vis-off-side'), stop(30, 'offside'), fo(30, -20, { y: 22 }),     // won
    goal(40, HOME, 10), stop(40, 'chlg-vis-goal-interference'), lost(40, AWAY), fo(40, 0),             // lost
    stop(60, 'chlg-hm-goal-interference'), goal(60, HOME, 10), fo(60, 0),                              // won: own goal counts
    goal(80, AWAY, 20), stop(80, 'chlg-league-off-side'), fo(80, 0),                                    // league, stood
    stop(90, 'chlg-vis-puck-over-glass'), fo(90, 69, { y: 22 })];                                       // not a goal
  const c = censusGame(E, { ...ctx, shifts: [] });
  assert.deepEqual(c.reviews, { coach: 3, coachWon: 2, league: 1, leagueOff: 0 });
  const pub = censusRates(censusAdd(censusAdd({}, c), c)).reviews;
  assert.deepEqual({ ...pub, what: undefined }, { coach: 6, coachWon: 4, league: 2, leagueOff: 0, what: undefined });
  assert.match(pub.what, /as counts/);
});

test('a failed challenge names the games measured once: the power-play rate after it says "In those games"', () => {
  const rates = { census: { games: 4345, reviews: { coach: 726, coachWon: 490, league: 54, leagueOff: 26 },
    whistles: { ppGoals: 5275, ppChances: 24991 } } };
  const E = [fo(0, 0), goal(12, HOME, 10), stop(12, 'chlg-vis-goal-interference'), lost(12, AWAY), fo(12, 0, { sit: '1451' })];
  const note = colorNotes(game(E), ctx, rates).get(3);
  assert.equal(note.match(/games we have measured/g).length, 1, note);
  assert.match(note, /a "power play" for HOM\. In those games, about 1 power play in 5 ended in a goal\.$/);
});
