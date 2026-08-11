/**
 * Control while the score was level.
 *
 * WHY THIS MODULE EXISTS AT ALL. The featured game on the homepage is chosen by
 * ranking every game in the archive on this number, so it decides what a novice
 * sees first. Three earlier versions of that rule were wrong in ways only
 * measurement caught:
 *
 *   raw shot advantage in a loss   selected 50-16 blowouts -- and the team with
 *                                  more ATTEMPTS loses ~60% of the time, because
 *                                  falling behind is what makes you shoot
 *   tied, but any strength         partly measured who drew penalties
 *   tied, but overtime included    regular-season OT is 3-on-3, so every OT
 *                                  attempt landed in the tied bucket at rates
 *                                  far above 5-on-5 -- and playoff OT is 5-on-5,
 *                                  so the bias was UNEVEN across gameType
 *
 * So the exclusions here are not fastidiousness. Each one changed the ranking.
 *
 * AND IT IS ONE IMPLEMENTATION. The pipeline ranks 4,119 games with this exact
 * module through builders/measure.mjs; the browser can show the same number on a
 * game page. A Python copy in derive.py was the plan until the architecture
 * audit -- see docs/architecture.md §2. The scratch script that copy grew from
 * opened with "mirrors src/lib/strength.js exactly", which is a promise with no
 * check behind it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { tiedControl } from '../src/lib/layers/tied.js';

const HOME = 10, AWAY = 20;
const ROSTER = {
  1: { nm: 'Home Shooter', tid: HOME, pos: 'C' },
  2: { nm: 'Away Shooter', tid: AWAY, pos: 'L' },
};
const CTX = { roster: ROSTER, homeId: HOME, awayId: AWAY, homeAb: 'HME', awayAb: 'AWY' };

/** An attempt. `sit` defaults to 5-on-5, `pt` to regulation. */
const shot = (actor, o = {}) => ({
  type: 'shot-on-goal', actor, own: ROSTER[actor].tid,
  per: 1, s: 100, sit: '1551', pt: 'REG', ...o,
});
const goal = (actor, o = {}) => shot(actor, { type: 'goal', ...o });

const run = events => tiedControl.reduce(events, CTX);

test('attempts with the score level are counted for the shooting team', () => {
  const r = run([shot(1), shot(1), shot(2)]);
  assert.equal(r.t[HOME], 2);
  assert.equal(r.t[AWAY], 1);
  assert.equal(r.diff, 1, 'diff is stated from the HOME side, like the scoreboard');
});

test('the goal that breaks the tie is itself counted', () => {
  // It was taken while the game was level. Applying the goal before judging its
  // own state would silently drop one attempt per lead change, and the error
  // would be invisible because the count would still look plausible.
  const r = run([goal(1)]);
  assert.equal(r.t[HOME], 1, 'the go-ahead goal happened while the score was level');
});

test('once someone leads, attempts stop counting and say why', () => {
  const r = run([goal(1), shot(1), shot(2)]);
  assert.equal(r.t[HOME], 1, 'only the goal, taken while level');
  assert.equal(r.t[AWAY], 0);
  assert.equal(r.excluded.length, 2);
  for (const x of r.excluded) assert.match(x.why, /level|tied|lead/i);
});

test('the score returns to level and counting resumes', () => {
  // A guard against implementing "level" as "before the first goal", which passes
  // every test above and is wrong in most real games.
  //
  // AND THE EQUALISER ITSELF DOES NOT COUNT. It was taken while trailing, which
  // is exactly the state this measurement excludes — the go-ahead goal counts
  // because the game was level when it was taken, and the tying goal does not
  // because it was not. This test asserted the opposite on its first run and the
  // implementation was right; the asymmetry is the rule working, not a bug.
  const r = run([goal(1), shot(1), goal(2), shot(2)]);
  assert.equal(r.t[HOME], 1, 'the go-ahead goal, taken while level');
  assert.equal(r.t[AWAY], 1, 'NOT the equaliser (taken while behind) — the shot after it');
  const eq = r.excluded.find(x => x.id === 2);
  assert.ok(eq.dims.state, 'the tying goal is excluded for score state, and says so');
});

test('overtime is excluded even though it is always level', () => {
  // THE CONFOUND THAT MOVED THE RANKINGS. OT is tied by definition, and
  // regular-season OT is 3-on-3. Without this, any game that reached OT gets its
  // number inflated by a period played under different rules.
  const r = run([shot(1, { pt: 'OT', per: 4, sit: '1331' })]);
  assert.equal(r.t[HOME], 0);
  assert.match(r.excluded[0].why, /overtime/i);
  assert.ok(r.excluded[0].dims.period, 'the reason is a period dimension, not a strength one');
});

test('a power play while level is not control, and the reason is readable', () => {
  // 1451 = away 4 skaters, home 5 -> the home team has the advantage.
  const r = run([shot(1, { sit: '1451' })]);
  assert.equal(r.t[HOME], 0);
  assert.match(r.excluded[0].dims.strength, /HME were on the power play — 5 skaters against 4/);
});

test('a pulled goalie while level is excluded too', () => {
  const r = run([shot(1, { sit: '1560' })]);
  assert.equal(r.t[HOME], 0);
  assert.match(r.excluded[0].dims.strength, /pulled their goalie/);
});

test('the shootout is excluded before the type question', () => {
  // A shootout goal is a perfectly good attempt BY TYPE. Asking "is it an
  // attempt?" first counts it, which is how the shootout contaminated all three
  // layers once already.
  const r = run([goal(1, { pt: 'SO', per: 5 })]);
  assert.equal(r.t[HOME], 0);
  assert.ok(r.excluded[0].dims.play, 'excluded as not-play, not as not-an-attempt');
});

test('attribution goes through the SHOOTER, never eventOwnerTeamId', () => {
  // MUTATION GUARD. This project shipped a wrong Corsi number by "correcting"
  // blocked-shot attribution. `own` is deliberately set to the WRONG team here:
  // a reading that trusts it credits the wrong side, and nothing else would tell.
  const r = run([{ type: 'blocked-shot', actor: 1, own: AWAY,
                   per: 1, s: 100, sit: '1551', pt: 'REG' }]);
  assert.equal(r.t[HOME], 1, 'the shooter is a HOME player, so it is a HOME attempt');
  assert.equal(r.t[AWAY], 0);
});

test('every event is accounted for exactly once', () => {
  // Conservation, the property that makes "show me the work" checkable.
  const events = [
    shot(1), goal(2), shot(1, { sit: '1451' }), shot(2, { pt: 'OT', per: 4 }),
    { type: 'faceoff', actor: 1, own: HOME, per: 1, s: 1, sit: '1551', pt: 'REG' },
    { type: 'stoppage', actor: null, own: null, per: 1, s: 2, sit: '1551', pt: 'REG' },
  ];
  const r = run(events);
  const ids = [...r.counted, ...r.excluded.map(x => x.id)].sort((a, b) => a - b);
  assert.deepEqual(ids, events.map((_, i) => i), 'no event lost, none counted twice');
});

test('an event excluded for several reasons carries all of them', () => {
  // A power-play attempt in overtime after someone led is three separate facts.
  // Picking one silently hides the others; listing it three times breaks
  // conservation. Same rule corsi.js follows.
  const r = run([goal(1), shot(1, { pt: 'OT', per: 4, sit: '1451' })]);
  const x = r.excluded.find(e => e.id === 1);
  assert.ok(x.dims.period && x.dims.state && x.dims.strength,
    `expected period, state and strength dimensions, got ${Object.keys(x.dims)}`);
});

test('an unreadable situation code excludes rather than guesses', () => {
  const r = run([shot(1, { sit: '9999' })]);
  assert.equal(r.t[HOME], 0, 'a code we cannot read is not evidence of even strength');
  assert.ok(r.excluded[0].dims.strength);
});

test('the shootout does not move the running score', () => {
  // The scoreboard gains exactly one from a shootout, and it happens at the end.
  // If shootout goals incremented the running score, a 0-0 game going to a
  // shootout would retroactively stop being level.
  const r = run([goal(1, { pt: 'SO', per: 5 }), goal(1, { pt: 'SO', per: 5 }), shot(2)]);
  assert.equal(r.t[AWAY], 1, 'the game was still level when the away shot was taken');
});
