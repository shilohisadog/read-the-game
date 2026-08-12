/**
 * Archive-level analysis: what the whole collection says.
 *
 * This is the module that decides which game a novice sees first, and that makes
 * it the highest-leverage code on the site. The failure it must not have is not a
 * crash — it is CHOOSING WELL FROM A BAD RULE, which looks like success.
 *
 * Two guards run in opposite directions, and the second is the one that is easy
 * to forget:
 *
 *   the LOW end   the rule must be able to return a boring answer, and say so
 *   the HIGH end  a spectacular answer must not be an artifact. Every earlier
 *                 version of this rule returned something spectacular and wrong
 *
 * Base rates are here rather than on the page because a rate published without
 * its denominator and its population is the thing Doctrine §8 exists to stop —
 * and this project has already had a review assert "41%" with no query behind it
 * in the sentence recommending that base rates be published.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { inScope, summarise, levelCurve, rowFor } from '../src/lib/archive.js';

/** A per-game measurement, as builders/measure.mjs produces it. */
const rec = (id, o = {}) => ({
  id,
  homeAb: 'HME', awayAb: 'AWY',
  score: { h: 2, a: 1 },        // home wins unless overridden
  sog: { h: 20, a: 30 },
  attempts: { h: 40, a: 50 },
  level: 0,                     // home-minus-away control while level
  ...o,
});

test('scope is regular season and playoffs, read from the game id', () => {
  assert.equal(inScope(2023020204), true, 'regular season');
  assert.equal(inScope(2023030416), true, 'playoffs');
  assert.equal(inScope(2023010001), false, 'preseason');
  assert.equal(inScope(2025090030), false, 'the Olympics');
  assert.equal(inScope(2024019999), false, 'the 4 Nations / All-Star oddities');
  assert.equal(inScope('2023020204'), true, 'a string id reads the same');
});

test('the featured game is the LOSING team with the biggest control edge', () => {
  // `level` is home-minus-away, so HOME controlled by 30 — and lost 1-2. The
  // first version of this fixture set level to -30, meaning AWAY controlled and
  // AWAY won, which is not a paradox at all. The implementation was right and the
  // fixture was incoherent.
  const s = summarise([
    rec(2023020001, { level: 30, score: { h: 1, a: 2 } }),
    rec(2023020002, { level: 5, score: { h: 3, a: 0 } }),   // controlled AND won
  ]);
  assert.equal(s.featured[0].id, 2023020001);
  assert.equal(s.featured[0].edge, 30);
  assert.equal(s.featured[0].ab, 'HME', 'the team that controlled play and lost');
});

test('a team that controlled play and WON is not featured', () => {
  // The rule is about the scoreboard disagreeing. Without this, the top of the
  // list fills with teams that dominated and won, which is not a paradox and not
  // a lesson.
  const s = summarise([rec(2023020001, { level: 40, score: { h: 5, a: 0 } })]);
  assert.equal(s.featured.length, 0, 'nothing to feature — nobody controlled play and lost');
});

test('the rule can return a boring answer, and the answer says so', () => {
  // CHENG's mutation, and the low-end guard. If the sharpest thing in the whole
  // archive is +1, the page must print +1 rather than dressing it up.
  const s = summarise([rec(2023020001, { level: 1, score: { h: 0, a: 1 } })]);
  assert.equal(s.featured[0].edge, 1);
  assert.equal(s.featured.length, 1);
});

test('an empty archive is a stated condition, not a crash', () => {
  const s = summarise([]);
  assert.deepEqual(s.featured, []);
  assert.equal(s.baseRates.moreLevelControlLost.n, 0);
  assert.equal(s.baseRates.moreLevelControlLost.rate, null,
    'a rate over nothing is null, never 0 — 0 would read as a measured finding');
});

test('out-of-scope games never reach the featured list or a base rate', () => {
  // Both are GENUINE paradoxes — home controlled by 50 and lost. They are
  // excluded only because of scope, so this test cannot pass for the other
  // reason. The first version used the wrong sign and would have passed even if
  // inScope() did nothing.
  const s = summarise([
    rec(2023010001, { level: 50, score: { h: 0, a: 1 } }),   // preseason
    rec(2025090030, { level: 50, score: { h: 0, a: 1 } }),   // Olympics
  ]);
  assert.deepEqual(s.featured, []);
  assert.equal(s.baseRates.moreLevelControlLost.n, 0);
});

test('every base rate carries its numerator, denominator and population', () => {
  const s = summarise([
    rec(2023020001, { sog: { h: 30, a: 20 }, score: { h: 0, a: 1 } }),  // more sog, lost
    rec(2023020002, { sog: { h: 30, a: 20 }, score: { h: 1, a: 0 } }),  // more sog, won
  ]);
  const r = s.baseRates.moreShotsOnGoalLost;
  assert.equal(r.n, 2);
  assert.equal(r.count, 1);
  assert.equal(r.rate, 0.5);
  assert.ok(r.population, 'a rate without its reference class is what we teach against');
});

test('games with no edge are excluded from the denominator, not counted as losses', () => {
  // 162 real games have equal shots on goal. Counting them as "did not lose"
  // would quietly shift the rate; dropping them silently would misstate n.
  const s = summarise([
    rec(2023020001, { sog: { h: 25, a: 25 }, score: { h: 1, a: 0 } }),
    rec(2023020002, { sog: { h: 30, a: 20 }, score: { h: 0, a: 1 } }),
  ]);
  assert.equal(s.baseRates.moreShotsOnGoalLost.n, 1, 'the equal-shots game is not in n');
  assert.equal(s.baseRates.moreShotsOnGoalLost.count, 1);
});

test('the three base rates are measured over the same population, independently', () => {
  // They must be able to DISAGREE — that disagreement is the site's thesis. A
  // shared filter that accidentally aligned them would hide the finding.
  const s = summarise([
    rec(2023020001, { sog: { h: 30, a: 20 }, attempts: { h: 20, a: 60 },
                      score: { h: 1, a: 0 } }),
  ]);
  assert.equal(s.baseRates.moreShotsOnGoalLost.count, 0, 'more sog and won');
  assert.equal(s.baseRates.moreAttemptsLost.count, 1, 'more attempts and lost');
});

test('the result is deterministic — same input, same bytes', () => {
  const games = [
    rec(2023020003, { level: 7, score: { h: 0, a: 1 } }),
    rec(2023020001, { level: 7, score: { h: 0, a: 1 } }),
    rec(2023020002, { level: 9, score: { h: 0, a: 1 } }),
  ];
  const a = JSON.stringify(summarise(games));
  const b = JSON.stringify(summarise([...games].reverse()));
  assert.equal(a, b, 'input order must not change the output');
  const ids = summarise(games).featured.map(f => f.id);
  assert.deepEqual(ids, [2023020002, 2023020001, 2023020003],
    'ties broken by game id, so the file diffs cleanly');
});

test('the rule travels with the numbers it produced', () => {
  const s = summarise([rec(2023020001, { level: 3, score: { h: 0, a: 1 } })]);
  assert.match(s.rule, /even-strength.*level.*regulation/i,
    'the featured number is meaningless without the sentence that made it');
});

/* ------------------------------------------------------------------ *
 * The reference class for ONE game's edge (docs/game-sentence.md §3a).
 * ------------------------------------------------------------------ */

/** A game with a given level-control edge and a given outcome for its leader. */
const lvl = (level, leaderLost, id = 2023020001) => ({
  id, homeAb: 'HME', awayAb: 'AWY',
  // home leads the measure when level > 0; make home lose when the leader lost.
  score: (level > 0) === leaderLost ? { h: 1, a: 2 } : { h: 2, a: 1 },
  sog: { h: 0, a: 0 }, attempts: { h: 0, a: 0 }, level,
});

test('the curve at k=1 is the published base rate, by two paths', () => {
  // The one assertion that ties the new number to the old one. An off-by-one in
  // the accumulation shows up here and nowhere else, because every other row has
  // nothing independent to be checked against.
  const games = [lvl(5, true), lvl(-3, true), lvl(12, false), lvl(1, false),
                 lvl(0, true), lvl(-20, true)];
  const s = summarise(games);
  const first = s.levelCurve[0];
  assert.equal(first.k, 1);
  assert.equal(first.n, s.baseRates.moreLevelControlLost.n);
  assert.equal(first.count, s.baseRates.moreLevelControlLost.count);
});

test('the population can only shrink as the cutoff rises', () => {
  // A STRUCTURAL INVARIANT of a cumulative count, and cheap. It catches an
  // off-by-one in the tail, where the rates wobble on sample size alone and
  // nobody could tell a wrong row from a small one by looking (CHENG).
  const games = [lvl(1, true), lvl(2, false), lvl(2, true), lvl(7, true),
                 lvl(-7, false), lvl(-15, true), lvl(31, true)];
  const curve = summarise(games).levelCurve;
  assert.equal(curve.length, 31, 'a row for every cutoff up to the largest edge');
  for (let i = 1; i < curve.length; i++) {
    assert.ok(curve[i].n <= curve[i - 1].n,
      `k=${curve[i].k} has n=${curve[i].n} against k=${curve[i - 1].k}'s ${curve[i - 1].n}`);
    assert.ok(curve[i].count <= curve[i - 1].count, 'and so can the losses');
    assert.ok(curve[i].count <= curve[i].n, 'losses never exceed the population');
  }
  assert.equal(curve[curve.length - 1].n, 1, 'the largest edge is its own class');
});

test('the sign of the edge is discarded — lopsided is lopsided', () => {
  // +12 for the home side and +12 for the visitors are the same question.
  const a = summarise([lvl(12, true), lvl(3, false)]).levelCurve;
  const b = summarise([lvl(-12, true), lvl(-3, false)]).levelCurve;
  assert.deepEqual(a, b);
});

test('a game with no edge has no reference class, and is told so', () => {
  const curve = summarise([lvl(4, true), lvl(9, false)]).levelCurve;
  assert.equal(rowFor(curve, 0), null, 'zero is not a cutoff — there is nothing to compare');
  assert.equal(rowFor(curve, 4).n, 2);
  assert.equal(rowFor(curve, 9).n, 1);
});

test('an edge the archive has never seen returns null, not an empty fraction', () => {
  // A game ingested since the last derive can be more lopsided than anything in
  // the measured set. "0 of 0" is not a base rate; the page must say the
  // comparison is missing.
  const curve = summarise([lvl(4, true)]).levelCurve;
  assert.equal(rowFor(curve, 40), null);
});

test('the curve is empty when nothing is measurable, rather than absent', () => {
  const curve = summarise([lvl(0, true)]).levelCurve;
  assert.deepEqual(curve, []);
  assert.equal(rowFor(curve, 3), null);
});
