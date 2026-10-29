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
import { inScope, summarise, playerSeasons } from '../src/lib/archive.js';
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

test('an empty archive is a stated condition, not a crash', () => {
  const s = summarise([]);
  assert.equal(s.baseRates.moreLevelControlLost.n, 0);
  assert.equal(s.baseRates.moreLevelControlLost.rate, null,
    'a rate over nothing is null, never 0 — 0 would read as a measured finding');
});

test('out-of-scope games never reach a base rate', () => {
  // Both are GENUINE paradoxes — home controlled by 50 and lost. They are
  // excluded only because of scope, so this test cannot pass for the other
  // reason. The first version used the wrong sign and would have passed even if
  // inScope() did nothing.
  const s = summarise([
    rec(2023010001, { level: 50, score: { h: 0, a: 1 } }),   // preseason
    rec(2025090030, { level: 50, score: { h: 0, a: 1 } }),   // Olympics
  ]);
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

test('⭐ each row carries its latest game, each club its own, and a dressed scorer is kept', async () => {
  // The preview names only a player whose `last` equals his club's `lastGame`.
  // Five AAA players outscore #9 overall; only #9 dressed for the last game, so
  // he must survive the top-three cut or the preview has nobody to name.
  const dg = (id, date, rows) => ({ id, date, homeAb: 'AAA', awayAb: 'BBB', players: rows });
  const out = playerSeasons([
    dg(2026020001, '2026-10-01', [1, 2, 3, 4, 5].map(p => sk(p, { g: 3, a: 3, s: 9, c: 9 }))),
    dg(2026020002, '2026-10-03', [sk(9, { g: 1 })]),
  ], 1);
  assert.deepEqual(out.lastGame, { AAA: '2026-10-03', BBB: '2026-10-03' });
  const nine = out.clubs.AAA.find(r => r.p === 9);
  assert.ok(nine, 'the only skater who dressed last game was cut from the document');
  assert.equal(nine.last, '2026-10-03');
  assert.equal(out.clubs.AAA.find(r => r.p === 1).last, '2026-10-01');
});
