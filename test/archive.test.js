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
import { inScope, summarise } from '../src/lib/archive.js';

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
