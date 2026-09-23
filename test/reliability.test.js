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
import { reliability, gamesToTarget, spreadOf, TARGET, ADMISSION, SEASON_GAMES } from '../src/lib/reliability.js';

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
