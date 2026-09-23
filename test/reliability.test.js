/**
 * How many games a figure needs before it describes the club — MEASURED.
 *
 * ⛔ THE RULE THIS FILE EXISTS FOR (Kevin, 2026-09-23): *"there should never be
 * hard coded values, anywhere … everything should derive from ingested,
 * calculated, or applicable variables."* The card's progress counts were typed
 * from a probe I ran by hand; they are now computed from the archive. What stays
 * declared is POLICY — the 0.7 target and the half-season admission rule — and
 * those are choices, not measurements.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { reliability, agreement, gamesToTarget, spreadOf, TARGET, ADMISSION, SEASON_GAMES } from '../src/lib/reliability.js';

/* A club-season of games, with a per-game share this club holds at `p`, jittered
   by `noise` so the halves agree to a degree the test controls. */
let seed = 1;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
function games(yr, ab, n, p, noise) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = Math.min(0.95, Math.max(0.05, p + (rnd() - 0.5) * noise));
    out.push({ id: +(`${yr}02${String(i).padStart(4, '0')}`), date: `${yr}-10-${String(1 + (i % 28)).padStart(2, '0')}`,
      homeAb: ab, awayAb: 'ZZZ', share: { h: v, a: 1 - v } });
  }
  return out;
}
/* ⚠️ `ofGame`, THE NAME THE CARD'S ROWS ACTUALLY CARRY. This fixture said `of`,
   which is the SEASON-total form, and the module called `of` too — so the pair
   agreed with each other and threw on the first real record. The test now uses
   the production name, and `preview.js` is where both are defined. */
const ROW = [{ key: 'x', ofGame: (g, side) => ({ count: Math.round(g.share[side] * 100), n: 100 }) }];
/** A finished season needs a playoff game in the archive — that is the signal. */
const playoff = yr => ({ id: +(`${yr}030111`), date: `${yr + 1}-05-01`, homeAb: 'AAA', awayAb: 'BBB',
  share: { h: 0.5, a: 0.5 } });

test('⭐ a measure that repeats needs fewer games than one that does not', () => {
  const steady = [], noisy = [];
  for (let c = 0; c < 20; c++) {
    const ab = 'C' + c;
    steady.push(...games(2023, ab, 20, 0.3 + c * 0.01, 0.02));
    noisy.push(...games(2023, ab, 20, 0.4, 0.6));
  }
  steady.push(playoff(2023)); noisy.push(playoff(2023));
  const a = reliability(steady, ROW).rows.x, b = reliability(noisy, ROW).rows.x;
  assert.ok(a.r > b.r, `a stable measure did not out-repeat a random one: ${a.r} vs ${b.r}`);
  assert.ok(a.games < 41, `a club trait needed ${a.games} games`);
  assert.ok(b.games == null || b.games > a.games, 'noise settled as fast as signal');
});

test('⛔ A MEASURE WITH NO SIGNAL SETTLES AT NO NUMBER OF GAMES, and says null', () => {
  /* The trailing push measured -0.03 over three seasons; there is no game count
     at which a coin describes a club. A number here would be the card promising
     that waiting fixes luck. */
  assert.equal(gamesToTarget(0, 41), null);
  assert.equal(gamesToTarget(-0.2, 41), null);
  assert.ok(gamesToTarget(0.8, 41) < gamesToTarget(0.5, 41), 'a stronger half-season needs fewer games');
});

test('⛔⛔ AN UNFINISHED SEASON IS NOT IN THE ESTIMATE — that is what pins the counts', () => {
  /* CHENG's P2: the counts may not move inside a season. A season is complete
     when the archive holds a PLAYOFF game for it, read from the games and not
     from a clock, so the estimate re-derives itself after a Cup final and never
     between Tuesdays.
     MUTATION: include every season, and each new night moves every card's
     denominator by a hair for a reason no reader can see. */
  const done = [], running = [];
  for (let c = 0; c < 20; c++) {
    done.push(...games(2023, 'C' + c, 20, 0.3 + c * 0.01, 0.02));
    running.push(...games(2025, 'C' + c, 20, 0.3 + c * 0.01, 0.02));
  }
  done.push(playoff(2023));
  const both = reliability([...done, ...running], ROW);
  assert.deepEqual(both.seasons, ['2023'], 'a season still being played was counted');
  const alone = reliability(done, ROW);
  assert.equal(both.rows.x.clubSeasons, alone.rows.x.clubSeasons,
    'the running season changed the estimate');
});

test('the policy values are declared, and the admission rule is half a season', () => {
  /* These are the two numbers nothing derives — they are choices. The rule is
     that they are named and reasoned where they live, not that they vanish. */
  assert.equal(TARGET, 0.7);
  assert.equal(SEASON_GAMES, 82);
  assert.equal(ADMISSION, 41, 'the admission rule is half a season, not a tuned number');
});

/* ---------------------------------------------- THE AXIS THE CARD IS DRAWN ON */

test('⭐ the club-season spread is min..max, because a band would clip real clubs', () => {
  /* A bar needs a span, and the tempting span is a round number of points either
     side of the league — a constant nobody measured. This publishes the span the
     league actually occupies. It is min..max rather than p10–p90 because the
     picture's job is to say how far apart clubs GET, and clipping a fifth of them
     off the ends requires choosing which fifth.
     MUTATION: switch to a quantile band and the first two assertions fire. */
  const xs = [0.44, 0.47, 0.50, 0.51, 0.53, 0.58];
  const s = spreadOf(xs);
  assert.equal(s.min, 0.44, 'the lowest club-season is the low edge');
  assert.equal(s.max, 0.58, 'and the highest is the high edge');
  assert.equal(s.n, 6, 'a span drawn from six clubs is not the claim ninety-six would make');
  assert.ok(s.median >= s.min && s.median <= s.max);
});

test('a spread of nothing is null, not a zero-width axis', () => {
  // Nothing is drawn on an empty population — a bar with min === max would be a
  // chart whose every value sits on the same pixel.
  assert.equal(spreadOf([]), null);
  assert.equal(spreadOf([NaN, null, undefined]), null);
});

test('⛔ every club row publishes a spread alongside its settle count', () => {
  /* The renderer reads `clubRange` off the same row as `games`. A row that
     published one and not the other would draw a bar with no axis.
     MUTATION: drop `clubRange` from the row and this fires. */
  const rows = [{ key: 'k', ofGame: (g, side) => ({ count: g.v[side], n: 10 }) }];
  const recs = [];
  for (let i = 0; i < 8; i++) {
    recs.push({ id: 2023020000 + i, date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      homeAb: 'AAA', awayAb: 'BBB', v: { h: 4 + (i % 3), a: 6 - (i % 3) } });
  }
  recs.push({ id: 2023030001, date: '2024-05-01', homeAb: 'AAA', awayAb: 'BBB',
    v: { h: 5, a: 5 } });                       // a playoff game: the season is finished
  const out = reliability(recs, rows);
  assert.ok(out.rows.k.clubRange, 'no spread was published');
  assert.ok(out.rows.k.clubRange.n > 0);
  assert.ok(out.rows.k.clubRange.min <= out.rows.k.clubRange.max);
});

/* ------------------------------ THE BIAS THE DOC SPECIFIED AND THE CODE DROPPED */

test('⛔⛔⛔ a league-wide drift between seasons is NOT read as a club trait', () => {
  /* THE DEFECT, FOUND 2026-09-23 BY AN ADVERSARIAL RE-MEASUREMENT, and the repo
     knew the answer the whole time: `docs/preview-and-corsi.md` §11.2 specifies
     "each season centred before pooling so a league-wide shift is not read as a
     club trait", and this file shipped without it. The gap was visible in the
     documents — the doc records the slot row at 37 games and the code computed
     42, while `dmen` and `level5` matched exactly, because their league level
     barely moves and a share of both clubs' totals cannot move at all.

     It cost a real row: `missed` measures 33 games pooled and 113 centred,
     because the league's miss rate rose 15% across three seasons. It shipped.

     THE FIXTURE MAKES THE TWO ANSWERS DIFFER IN SIGN, which no tolerance can
     paper over. Two seasons whose league levels are far apart (0.20 and 0.40),
     and inside each season a club's first half is PERFECTLY ANTI-correlated with
     its second. Pooled, the season gap alone drives r strongly positive and the
     measure looks like the most reliable thing in hockey. Centred, the truth
     survives: r is negative and no number of games ever reaches the target.

     MUTATION: drop the `centre()` calls and `r` comes back above +0.9. */
  const CLUBS = ['AAA', 'BBB', 'CCC', 'DDD'];
  // (first-half share, second-half share) — within a season, higher first means
  // lower second, so the honest correlation is negative.
  const SHAPE = [[-0.02, +0.02], [+0.02, -0.02], [-0.01, +0.01], [+0.01, -0.01]];
  const LEVEL = { 2023: 0.20, 2024: 0.40 };   // the league-wide drift

  const recs = [];
  for (const yr of [2023, 2024]) {
    for (let p = 0; p < 2; p++) {                       // two fixed pairings
      const home = CLUBS[p * 2], away = CLUBS[p * 2 + 1];
      for (let i = 0; i < 8; i++) {                     // 8 games, mid = 4
        const halfIdx = i < 4 ? 0 : 1;
        const v = {};
        for (const [ab, k] of [[home, p * 2], [away, p * 2 + 1]]) {
          v[ab === home ? 'h' : 'a'] = LEVEL[yr] + SHAPE[k][halfIdx];
        }
        recs.push({ id: Number(`${yr}02${String(i + p * 10).padStart(4, '0')}`),
          date: `${yr + 1}-01-${String(i + 1 + p * 10).padStart(2, '0')}`,
          homeAb: home, awayAb: away, v });
      }
    }
    // a playoff game, which is how this module learns the season is complete
    recs.push({ id: Number(`${yr}030001`), date: `${yr + 1}-05-01`,
      homeAb: CLUBS[0], awayAb: CLUBS[1], v: { h: LEVEL[yr], a: LEVEL[yr] } });
  }

  const rows = [{ key: 'drifty',
    ofGame: (g, side) => ({ count: Math.round(g.v[side] * 1000), n: 1000 }) }];
  const out = reliability(recs, rows);

  assert.equal(out.seasons.length, 2, 'both seasons must be counted as finished');
  assert.equal(out.rows.drifty.clubSeasons, 8, 'four clubs, two seasons');
  assert.ok(out.rows.drifty.r < 0,
    `the season gap was read as club signal: r = ${out.rows.drifty.r}`);
  assert.equal(out.rows.drifty.games, null,
    'a measure with no within-season signal must settle at no number of games');
});

test('⭐ and centring leaves a measure whose league level is flat exactly where it was', () => {
  /* THE PAIRED HALF, and it is why nobody noticed the bug: centring is a no-op on
     a stable measure. Same shape as above with ONE league level, so the only
     signal is the club's own — which must survive untouched. */
  const CLUBS = ['AAA', 'BBB'];
  const recs = [];
  for (const yr of [2023, 2024]) {
    for (let i = 0; i < 8; i++) {
      const hi = i < 4;
      recs.push({ id: Number(`${yr}02${String(i).padStart(4, '0')}`),
        date: `${yr + 1}-01-${String(i + 1).padStart(2, '0')}`,
        homeAb: 'AAA', awayAb: 'BBB',
        // AAA is consistently high in both halves, BBB consistently low
        v: { h: 0.60, a: 0.40 } });
    }
    recs.push({ id: Number(`${yr}030001`), date: `${yr + 1}-05-01`,
      homeAb: 'AAA', awayAb: 'BBB', v: { h: 0.6, a: 0.4 } });
  }
  const rows = [{ key: 'steady',
    ofGame: (g, side) => ({ count: Math.round(g.v[side] * 1000), n: 1000 }) }];
  const out = reliability(recs, rows);
  assert.ok(out.rows.steady.r > 0.99,
    `a club that is itself in both halves must still read as reliable: ${out.rows.steady.r}`);
});

/* ------------------------- THE TWO SENSITIVITIES, AND WHY THEY ARE PUBLISHED */

/**
 * Twelve clubs that each CHANGE at midseason, by an amount that is their own.
 *
 * ⚠️ THE SWING HAS TO VARY BETWEEN CLUBS, AND THE FIRST DRAFT MISSED IT. With
 * every club swinging by the same ±0.06 the swing is a constant offset, which a
 * correlation cannot see at all: both splittings returned exactly r = 1 and the
 * test that was supposed to separate them passed nothing. A chronological split
 * is only penalised by change it cannot predict, so the swing is scrambled
 * against the club's level rather than shared by all of them.
 *
 * Alternate halves each draw five games from both regimes, so they see the level
 * and none of the change; chronological halves see one regime each.
 */
function swingy() {
  const recs = [];
  for (let c = 0; c < 12; c++) {
    const base = 0.40 + c * 0.010;               // the club's own level
    const swing = (((c * 5) % 12) - 5.5) * 0.006; // its own change, scrambled against it
    for (let i = 0; i < 20; i++) {
      const v = base + (i < 10 ? swing : -swing);
      recs.push({ id: Number(`202302${String(c * 20 + i).padStart(4, '0')}`),
        date: `2024-01-${String(1 + i).padStart(2, '0')}`,
        homeAb: 'C' + c, awayAb: `Z${c}_${i}`,   // a one-game away club is dropped
        v: { h: v, a: 1 - v } });
    }
  }
  recs.push({ id: 2023030001, date: '2024-05-01', homeAb: 'C0', awayAb: 'C1',
    v: { h: 0.5, a: 0.5 } });
  return recs;
}
const SWING_ROW = [{ key: 'swings',
  ofGame: (g, side) => ({ count: Math.round(g.v[side] * 100000), n: 100000 }) }];

test('⭐⭐ the ALTERNATE split is published beside the one we use, and it flatters', () => {
  /* Criticism 1 in `docs/what-settles.md` §5: a chronological split charges real
     mid-season change against the measure, so every count we publish is too
     high. That is CORRECT and deliberate, and the only honest answer is to
     publish what the other splitting says — the size of the criticism, not a
     rebuttal of it.

     The fixture is a club that CHANGES at midseason: high for the first half,
     low for the second. Alternate halves cannot see that — each gets both
     regimes — so they agree almost perfectly, while chronological halves
     disagree by construction. Nothing else distinguishes the two splittings.

     MUTATION: point `SPLITS.alternate` at the chronological cut and the two
     answers become identical, which the first assertion forbids. */
  const r = reliability(swingy(), SWING_ROW).rows.swings;

  assert.ok(r.alternate.r > r.r,
    `alternate halves must flatter a mid-season change: ${r.alternate.r} vs ${r.r}`);
  assert.ok(r.alternate.games < r.games,
    `and must therefore ask for fewer games: ${r.alternate.games} vs ${r.games}`);
  assert.equal(r.alternate.clubSeasons, r.clubSeasons,
    'both splittings must run over the SAME club-seasons, or the gap is partly population');
});

test('⛔ the published count is the CONSERVATIVE one, never the flattering one', () => {
  /* The card reads `games`. If that field ever carried the alternate estimate a
     row would claim to be settled sooner than it has earned, which is the whole
     failure the chronological split exists to prevent — and it would be
     invisible, because both numbers are plausible.
     MUTATION: publish `gamesToTarget(alt.r, half)` as `games` and this fires. */
  const out = reliability(swingy(), SWING_ROW);
  const r = out.rows.swings;
  assert.equal(r.games, gamesToTarget(r.r, out.half),
    'the published count must be stepped up from the chronological correlation');
  assert.notEqual(r.games, r.alternate.games, 'the fixture must distinguish the two');
});

test('⭐ what the answer would be at a different threshold, published beside it', () => {
  /* Criticism 2: r = 0.7 is a declared policy and nothing derives it. CONCEDED,
     and answered by showing the reader how much of "35 games" is the choice.
     MUTATION: step the probes up from the alternate correlation and the middle
     assertion fires, because the probe band would no longer bracket `games`. */
  const recs = [];
  for (let c = 0; c < 20; c++) recs.push(...games(2023, 'C' + c, 20, 0.3 + c * 0.01, 0.05));
  recs.push(playoff(2023));
  const out = reliability(recs, ROW);
  const at = Object.fromEntries(out.rows.x.atTarget.map(p => [p.target, p.games]));

  assert.deepEqual(out.probes, [0.6, 0.8], 'the probe band is declared policy');
  assert.deepEqual(out.rows.x.atTarget.map(p => p.target), [0.6, 0.8]);
  assert.ok(at[0.6] < out.rows.x.games && out.rows.x.games < at[0.8],
    `the published count must sit inside its own probe band: ${at[0.6]} / ${out.rows.x.games} / ${at[0.8]}`);
});

/* -------------------------------------- ONE MEASUREMENT WEARING FOUR NAMES */

/** Club-seasons in which two measures are whatever the caller says they are. */
function pairFixture(perSeason) {
  const recs = [];
  for (const [yr, clubs] of Object.entries(perSeason)) {
    clubs.forEach(([x, y], c) => {
      for (let i = 0; i < 10; i++) {
        recs.push({ id: Number(`${yr}02${String(c * 10 + i).padStart(4, '0')}`),
          date: `${Number(yr) + 1}-01-${String(1 + i).padStart(2, '0')}`,
          homeAb: 'C' + c, awayAb: `Z${yr}_${c}_${i}`,       // one game each: dropped
          x: { h: x, a: 1 - x }, y: { h: y, a: 1 - y } });
      }
    });
    recs.push({ id: Number(`${yr}030001`), date: `${Number(yr) + 1}-05-01`,
      homeAb: 'C0', awayAb: 'C1', x: { h: 0.5, a: 0.5 }, y: { h: 0.5, a: 0.5 } });
  }
  return recs;
}
const PAIR_ROWS = ['x', 'y'].map(k => ({ key: k,
  ofGame: (g, side) => ({ count: Math.round(g[k][side] * 1000), n: 1000 }) }));

test('⭐⭐ two names for one measurement read as one, and two measurements do not', () => {
  /* The figure Kevin asked for: *"as long as we quantify what 'possession family'
     means."* Corsi and CF% are not shown side by side because they agree; this
     is the test that the number saying so can tell agreement from independence.
     MUTATION: return `pearson(x, y)` of the RAW per-game values rather than the
     club-season figures and the separation collapses. */
  const same = pairFixture({ 2023: Array.from({ length: 16 },
    (_, c) => [0.40 + c * 0.01, 0.40 + c * 0.01 + (c % 2 ? 0.002 : -0.002)]) });
  const apart = pairFixture({ 2023: Array.from({ length: 16 },
    (_, c) => [0.40 + c * 0.01, 0.40 + ((c * 7) % 16) * 0.01] ) });

  const a = agreement(same, PAIR_ROWS), b = agreement(apart, PAIR_ROWS);
  assert.equal(a.pairs.length, 1, 'two measures make exactly one pair');
  assert.deepEqual([a.pairs[0].a, a.pairs[0].b], ['x', 'y']);
  assert.ok(a.pairs[0].r > 0.98, `two names for one thing must agree: ${a.pairs[0].r}`);
  assert.ok(Math.abs(b.pairs[0].r) < 0.5,
    `two different things must not: ${b.pairs[0].r}`);
  assert.equal(a.pairs[0].n, 16, 'the pair carries the club-seasons it was measured over');
});

test('⛔⛔⛔ the agreement figure is CENTRED TOO, or it measures the calendar', () => {
  /* THE SAME DEFECT THAT PUT A ROW ON THE CARD THAT SHOULD NOT HAVE BEEN THERE
     (§1 of `docs/what-settles.md`), in the place it would do the most damage: a
     disclosure computed with the bug we just fixed is worse than no disclosure,
     because it is published as the proof that we checked.

     Two measures that move OPPOSITELY inside every season, whose league levels
     both rise across seasons. Uncentred the drift dominates and they look like
     one measurement; centred they are opposites.
     MUTATION: drop `centre()` from `agreement` and r flips sign. */
  const LEVEL = { 2023: 0.30, 2024: 0.50, 2025: 0.70 };
  const perSeason = {};
  for (const [yr, base] of Object.entries(LEVEL)) {
    perSeason[yr] = Array.from({ length: 12 }, (_, c) => {
      const swing = (c - 5.5) * 0.004;
      return [base + swing, base - swing];         // opposite within the season
    });
  }
  const out = agreement(pairFixture(perSeason), PAIR_ROWS);
  assert.equal(out.clubSeasons, 36, 'twelve clubs, three seasons');
  assert.ok(out.pairs[0].r < -0.9,
    `the league drift was read as agreement between two measures: ${out.pairs[0].r}`);
});

test('every unordered pair appears once, and nothing is paired with itself', () => {
  /* A matrix printed on the methods page with a duplicated or missing cell is a
     legibility defect on the one page whose job is to be checked. */
  const rows = ['a', 'b', 'c', 'd'].map(k => ({ key: k,
    ofGame: (g, side) => ({ count: Math.round(g.x[side] * 1000), n: 1000 }) }));
  const out = agreement(pairFixture({ 2023: Array.from({ length: 8 },
    (_, c) => [0.4 + c * 0.01, 0.5]) }), rows);
  assert.equal(out.pairs.length, 6, 'four measures make six pairs');
  const seen = out.pairs.map(p => [p.a, p.b].sort().join('|'));
  assert.equal(new Set(seen).size, 6, 'a pair was repeated');
  assert.ok(!out.pairs.some(p => p.a === p.b), 'a measure was paired with itself');
});
