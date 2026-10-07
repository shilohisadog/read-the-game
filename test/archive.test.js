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
import { inScope, summarise, levelCurve, rowFor, playerSeasons } from '../src/lib/archive.js';
/* ⚠️ THE TARGET IS READ FROM THE MODULE THAT DECLARES IT. Pinning 0.7 here would
   be a second statement of the one policy in `reliability.js`, and a test holding
   its own copy of a constant is how a rename passes. */
import { TARGET } from '../src/lib/reliability.js';

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

/* ---------------------------------------------------------------------------
 * PER-PLAYER SEASONS — the preview's player block, 2026-10-07.
 *
 * Kevin asked for a "Player to watch" card and for the four standard figures.
 * What settled the design was the MEASUREMENT: split-half over 706 skaters, by
 * `reliability.js` at the declared 0.7, put attempts at 6 games, shots on goal
 * at 10, assists at 24 and goals at 33 — all inside the 41 the club rows are
 * admitted under. The same measurement said NO to goaltenders.
 * ------------------------------------------------------------------------- */

/** One game's worth of player rows, in the shape `measureGame` emits. */
const pg = (id, rows) => ({ id, players: rows });
const sk = (p, over) => ({ p, t: 'AAA', nm: `P${p}`, n: p, pos: 'C',
                           g: 0, a: 0, s: 0, c: 0, ...over });

test('⭐ a season is the sum of the games, and games played is the denominator', () => {
  const recs = [
    pg(2023020001, [sk(1, { g: 1, a: 0, s: 3, c: 5 }), sk(2, {})]),
    pg(2023020002, [sk(1, { g: 0, a: 2, s: 1, c: 4 })]),
    pg(2023030001, [sk(1, { g: 1, a: 0, s: 2, c: 2 })]),
  ];
  const out = playerSeasons(recs, 1);
  const one = out.clubs.AAA.find(r => r.p === 1);
  assert.deepEqual([one.gp, one.g, one.a, one.s, one.c], [3, 2, 2, 6, 11]);
  /* ⛔ THE PLAYER WHO DID NOTHING STILL PLAYED, and his row is the reason the
     rates are honest: a denominator of "games he recorded something in" would
     divide by the games a player was good in, which flatters exactly the player
     this card is most likely to name. */
  const two = out.clubs.AAA.find(r => r.p === 2);
  assert.equal(two.gp, 1, 'a dressed skater with no events is still a game played');
  assert.equal(two.g + two.a + two.s + two.c, 0);
});

test('⛔ the per-game sequence never reaches the published document', () => {
  /* `each` exists only so the split-half below can run. It is one object per
     player per GAME — tens of thousands of rows over the archive — and the whole
     point of this document is that it is a few hundred. */
  const recs = [pg(2023020001, [sk(1, { g: 1 })]), pg(2023030001, [sk(1, { g: 2 })])];
  const out = playerSeasons(recs, 1);
  assert.ok(!JSON.stringify(out).includes('"each"'), '`each` was published');
  assert.ok(out.clubs.AAA[0].gp, 'and the row that carried it is still here');
});

test('⛔⛔ the AXIS is measured over FINISHED seasons only', () => {
  /* ⚠️ `reliability.js`'s rule, reused rather than restated: a season is complete
     when the archive holds a PLAYOFF game for it. "What a skater does over a full
     season" is not a question October can answer, and an axis built from it would
     put every player at an extreme in week one.
     MUTATION: let the unfinished season into the pool and `n` moves. */
  const finished = [pg(2023020001, [sk(1, { g: 4 })]), pg(2023030001, [sk(1, { g: 0 })])];
  const open = [pg(2026020001, [sk(9, { g: 9 })]), pg(2026020002, [sk(9, { g: 9 })])];
  const out = playerSeasons([...finished, ...open], 1);
  assert.equal(out.season, '2026', 'the clubs block is the season being previewed');
  assert.equal(out.range.g.n, 1, 'only the finished season may enter the axis');
  assert.equal(out.range.g.max, 2, '4 goals in 2 games — the open season is not in here');
});

test('⛔ a figure that does not repeat gets no `need`, and the card draws no ink', () => {
  /* `gamesToTarget` answers null when a measure has no signal, and that answer is
     carried rather than softened: a null need means the bar is drawn at zero ink.
     A number invented here would be the card asserting what the measurement
     declined to. */
  const recs = [];
  for (let i = 0; i < 40; i++) {
    // every player identical, so nothing can correlate with anything
    recs.push(pg(2023020000 + i, [sk(1, { g: 1 }), sk(2, { g: 1 }), sk(3, { g: 1 })]));
  }
  recs.push(pg(2023030001, [sk(1, {}), sk(2, {}), sk(3, {})]));
  const out = playerSeasons(recs, 4);
  assert.equal(out.need.g, null, 'a measure with no spread cannot settle at any n');
});

test('⭐ the published policy is carried, never re-chosen', () => {
  const out = playerSeasons([pg(2023020001, [sk(1, { g: 1 })]),
                             pg(2023030001, [sk(1, {})])], 7);
  assert.equal(out.qualify, 7, 'the admission handed in is the one published');
  assert.equal(out.target, TARGET, 'and the target is reliability.js’s, not a second one');
});
