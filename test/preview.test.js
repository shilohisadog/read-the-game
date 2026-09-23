/**
 * The preview card — `docs/preview-page.md`, and `docs/preview-and-corsi.md`
 * §11–§12 for what it may say.
 *
 * ⏰ THE CALENDAR CANNOT TEST THIS EITHER, and worse than the daily block: a club
 * row needs a CURRENT SEASON, and there will not be one until 29 September. Every
 * branch below is a fixture, and the preseason branch — the one a reader meets
 * first — is exercised hardest.
 *
 * ⛔ THE RULE THIS FILE ENFORCES: a club row may only be drawn from games inside
 * the scope our numbers are computed over. Preseason is viewable and never
 * counted, so in preseason the rows say so rather than quoting last season.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { preview, CLUB_ROWS } from '../src/lib/preview.js';

const NOW = '2026-01-15T18:00:00Z';
const FIXTURE = { id: 2025020500, date: '2026-01-15', gameType: 2, state: 'FUT',
  away: 'BUF', home: 'PIT', startTimeUTC: '2026-01-16T00:00:00Z', venue: 'PPG Paints Arena' };
const schedule = (up = [FIXTURE]) => ({ asOf: NOW, upcoming: up, season: {} });

/** A club's season row, in the shape `teamSeasons` publishes. */
const club = (o = {}) => ({ games: 20, attempts: { for: 1000, against: 950 },
  slot: { count: 240, n: 500 }, dmen: { count: 320, n: 1000 },
  level5: { for: 400, against: 380 }, ...o });
const teams = (o = {}) => ({ scope: 'NHL regular season and playoffs',
  through: '2026-01-13',
  seasons: { 2025: { BUF: club(), PIT: club({ games: 18 }) } }, ...o });

/** measures.json: the census the league rows come from, and the MEASURED number
 *  of games each club row needs. Both are published; neither is typed into the
 *  page (Kevin, 2026-09-23). */
const measures = (o = {}) => ({ census: { games: 4192,
  whistles: { penalties: 30434, offsides: 18700, ppChances: 22720, ppGoals: 4982, shGoals: 560 },
  state: { pp: { goals: 5542, minutes: 42615.7 } } },
  settle: { target: 0.7, admission: 41, seasons: ['2023', '2024'],
    rows: { level5: { r: 0.73, games: 35 }, dmen: { r: 0.81, games: 23 },
            slot: { r: 0.72, games: 37 } } }, ...o });

const recent = (games = []) => ({ asOf: NOW, games });
const played = (o = {}) => ({ id: 2025020500, date: '2026-01-15', awayAb: 'BUF', homeAb: 'PIT',
  score: { a: 2, h: 3 }, attempts: { a: 55, h: 61 }, slot: { a: 12, h: 15 },
  located: { a: 30, h: 33 }, dAtt: { a: 18, h: 20 }, lvl5: { a: 30, h: 35 }, ...o });
const catalog = (games = []) => ({ games });

const docs = (o = {}) => ({ schedule: schedule(), teams: teams(), measures: measures(),
  recent: recent(), catalog: catalog(), ...o });

/* ------------------------------------------------------------- THE STATES */

test('⭐ before the game: the two clubs, the start, and no result', () => {
  const p = preview(2025020500, docs(), NOW);
  assert.equal(p.state, 'before');
  assert.equal(p.game.away, 'BUF');
  assert.equal(p.game.home, 'PIT');
  assert.equal(p.game.startTimeUTC, '2026-01-16T00:00:00Z', 'the instant, for the browser to localise');
  assert.equal(p.result, null);
});

test('a game that has started is under way, not "before"', () => {
  const p = preview(2025020500, docs(), '2026-01-16T01:00:00Z');
  assert.equal(p.state, 'underway');
  assert.equal(p.result, null, 'we hold nothing until the nightly runs');
});

test('⭐⭐ ONCE IT IS PLAYED THE SAME URL OPENS THE REPLAY — the reason this is one page', () => {
  /* A link posted at 6pm is read at 6pm and again next week. A page built for
     tonight's fixtures could not answer the second reading; this one can, because
     the catalog is the witness that the game exists.
     MUTATION: decide the state from the clock instead of the catalog, and a game
     that was postponed reads as played. */
  const p = preview(2025020500, docs({ catalog: catalog([
    { id: 2025020500, d: '2026-01-15', a: 'BUF', h: 'PIT', as: 2, hs: 3, v: 1, t: 2 }]) }),
    '2026-01-20T00:00:00Z');
  assert.equal(p.state, 'played');
  assert.deepEqual(p.result.score, { a: 2, h: 3 });
  assert.equal(p.result.watch, 'game.html?game=2025020500', 'the door to the replay');
});

test('a game we cannot find at all is a state, not a crash', () => {
  const p = preview(99, docs(), NOW);
  assert.equal(p.state, 'unknown');
  assert.equal(p.game, null);
});

/* --------------------------------------------------------- THE CLUB ROWS */

test('⭐ three club rows for each club, each with its own progress toward settling', () => {
  const p = preview(2025020500, docs(), NOW);
  for (const side of ['away', 'home']) {
    const rows = p.clubs[side].rows;
    assert.deepEqual(rows.map(r => r.key), CLUB_ROWS.map(r => r.key));
    for (const r of rows) {
      assert.ok(r.n > 0, `${r.key} has no denominator`);
      assert.ok(r.value > 0 && r.value < 1, `${r.key} is not a share`);
      assert.ok(r.games > 0 && r.need > 0);
      assert.equal(r.settled, r.games >= r.need);
    }
  }
});

test('⛔ A SHARE IS COUNT OVER COUNT, and the row carries both', () => {
  /* The card prints "320 of 1,000 attempts". A row that carried only a rate could
     not print its own evidence, and `preview-and-corsi.md` §11 requires the count
     with its n beside the league figure. */
  const p = preview(2025020500, docs(), NOW);
  const d = p.clubs.away.rows.find(r => r.key === 'dmen');
  assert.equal(d.count, 320);
  assert.equal(d.n, 1000);
  assert.equal(d.value, 0.32);
});

test('⭐⭐ THE NIGHTLY TAIL IS ADDED TO THE WEEKLY TABLE — otherwise the card is up to a week stale', () => {
  /* teams.json is rebuilt on Mondays; recent.json every night. The card says
     "20 of 35 games", so between Mondays it would be short with no symptom.
     MUTATION: ignore recent.json, and both figures below stay at the weekly value. */
  const after = played({ id: 2025020599, date: '2026-01-14', awayAb: 'BUF', homeAb: 'PIT' });
  const p = preview(2025020500, docs({ recent: recent([after]) }), NOW);
  const d = p.clubs.away.rows.find(r => r.key === 'dmen');
  assert.equal(d.count, 320 + 18, 'the away club played on the 14th, after the table was built');
  assert.equal(d.n, 1000 + 55);
  assert.equal(p.clubs.away.games, 21, 'and the game count moves with it');
});

test('⛔ …and a game the weekly table ALREADY HOLDS is not added twice', () => {
  /* MUTATION: merge by id-presence, or add every game in recent.json. The dates
     decide it: `through` is the newest game the table contains. */
  const before = played({ id: 2025020498, date: '2026-01-12', awayAb: 'BUF', homeAb: 'PIT' });
  const p = preview(2025020500, docs({ recent: recent([before]) }), NOW);
  assert.equal(p.clubs.away.rows.find(r => r.key === 'dmen').count, 320);
  assert.equal(p.clubs.away.games, 20);
});

test('⚠️ a record from an older run cannot be added, and is not counted as a game either', () => {
  /* recent.json grew four fields on 2026-09-22. A row written before that has the
     six it always had, and adding it would move the game count while leaving the
     numerators behind — a denominator that grew without its numerator, which is
     the shape that makes a share quietly wrong. */
  const old = { id: 2025020599, date: '2026-01-14', awayAb: 'BUF', homeAb: 'PIT',
    score: { a: 1, h: 2 }, attempts: { a: 50, h: 60 } };
  const p = preview(2025020500, docs({ recent: recent([old]) }), NOW);
  assert.equal(p.clubs.away.rows.find(r => r.key === 'dmen').count, 320);
  assert.equal(p.clubs.away.games, 20, 'a game we cannot measure is not a game we counted');
});

test('⛔⛔ PRESEASON SAYS SO — no current season, no club figures, and nothing borrowed', () => {
  /* Kevin and CHENG both ruled it: borrowing last season describes a different
     roster and is the stale-date defect chosen on purpose. Until 29 September
     `teams.json` has no 2026 season at all.
     MUTATION: fall back to the newest season present, and every row silently
     describes last year. */
  const pre = { ...FIXTURE, id: 2026010016, gameType: 1 };
  const p = preview(2026010016, docs({ schedule: schedule([pre]) }), NOW);
  assert.equal(p.state, 'before');
  assert.equal(p.game.preseason, true);
  for (const side of ['away', 'home']) {
    assert.equal(p.clubs[side].games, 0);
    for (const r of p.clubs[side].rows) {
      assert.equal(r.value, null, `${r.key} invented a figure from nothing`);
      assert.equal(r.n, 0);
    }
  }
});

/* ------------------------------------------------------- THE LEAGUE ROWS */

test('⭐ the league rows are archive figures, computed from the census, never typed', () => {
  const p = preview(2025020500, docs(), NOW);
  const by = Object.fromEntries(p.league.map(r => [r.key, r]));
  // per CLUB per game: the census pools both clubs, so the divisor is 2 x games
  assert.equal(by.penalties.perClubGame.toFixed(2), (30434 / (2 * 4192)).toFixed(2));
  assert.equal(by.offside.perClubGame.toFixed(2), (18700 / (2 * 4192)).toFixed(2));
  assert.equal(by.powerplay.chancesPerClubGame.toFixed(2), (22720 / (2 * 4192)).toFixed(2));
  assert.equal(by.powerplay.rate.toFixed(3), (4982 / 22720).toFixed(3));
});

test('⛔⛔ THE POWER-PLAY RATE EXCLUDES SHORT-HANDED GOALS, or it is three points wrong', () => {
  /* `census.state.pp.goals` is every goal scored while an advantage was on. Over
     three seasons that is 24.5% of chances against the league's own 21.9%.
     MUTATION: use `state.pp.goals` as the numerator. */
  const p = preview(2025020500, docs(), NOW);
  const pp = p.league.find(r => r.key === 'powerplay');
  assert.ok(pp.rate < 0.23, `the short-handed goals are in the numerator: ${pp.rate}`);
});

test('a census without the new counts leaves the league rows out rather than guessing', () => {
  /* measures.json is rebuilt WEEKLY. Between this shipping and the next derive the
     document has no `whistles` block at all, and a card that invented one would be
     publishing a figure nobody measured. */
  const p = preview(2025020500, docs({ measures: { census: { games: 4192 } } }), NOW);
  assert.deepEqual(p.league, []);
  assert.equal(p.state, 'before', 'and the rest of the card still renders');
});

test('⛔ every league row names the population it is drawn from', () => {
  const p = preview(2025020500, docs(), NOW);
  for (const r of p.league) assert.equal(r.games, 4192, `${r.key} lost its n`);
});

test('⭐ every club row carries the league\'s own figure for the same season', () => {
  /* A share with no base rate loses the argument: "32 of every 100" means nothing
     until the league's figure is beside it. THIS SEASON's league, not the
     archive's — the club figure beside it is this season's, and pairing the two
     would be two populations under one label.
     MUTATION: take the league share from the archive block, or drop it. */
  const p = preview(2025020500, docs(), NOW);
  const d = p.clubs.away.rows.find(r => r.key === 'dmen');
  // both fixture clubs are identical, so the league share IS the club share here
  assert.equal(d.league, 0.32);
  const lvl = p.clubs.home.rows.find(r => r.key === 'level5');
  assert.ok(lvl.league > 0 && lvl.league < 1);
});

test('⛔ in preseason the league figure is absent too, not zero', () => {
  const pre = { ...FIXTURE, id: 2026010016, gameType: 1 };
  const p = preview(2026010016, docs({ schedule: schedule([pre]) }), NOW);
  for (const r of p.clubs.away.rows) assert.equal(r.league, null);
});

test('⛔⛔ THE ADMISSION RULE RUNS, it is not remembered: a row that needs more than half a season is dropped', () => {
  /* `preview-and-corsi.md` §12, and it now applies to what the PIPELINE measured
     rather than to what I typed. If next summer's re-derivation says the slot
     needs 60 games, the row leaves the card by itself — a card that kept showing
     it would be presenting luck as a trait, which is the thing Kevin's principle
     forbids.
     MUTATION: ignore `admission` and render whatever the archive measured. */
  const m = measures();
  m.settle.rows.slot.games = 60;
  const p = preview(2025020500, docs({ measures: m }), NOW);
  assert.deepEqual(p.clubs.away.rows.map(r => r.key), ['level5', 'dmen'],
    'a row needing more than half a season stayed on the card');
});

test('⛔ a measure the archive cannot settle at ANY number of games is not a club row', () => {
  /* `gamesToTarget` answers null for a measure with no signal — the trailing push
     measured −0.03 over three seasons. A row with no target would print progress
     toward a number that does not exist. */
  const m = measures();
  m.settle.rows.dmen.games = null;
  const p = preview(2025020500, docs({ measures: m }), NOW);
  assert.deepEqual(p.clubs.home.rows.map(r => r.key), ['level5', 'slot']);
});

test('⚠️ before the pipeline has measured the targets, the rows show their figures and claim nothing', () => {
  /* measures.json is rebuilt weekly, so between this shipping and the next derive
     there is no `settle` block. The rows still carry their counts — those come
     from a different document — and no row says `settled`, because nothing has
     said what settled would mean. */
  const p = preview(2025020500, docs({ measures: { census: { games: 4192 } } }), NOW);
  assert.equal(p.clubs.away.rows.length, 3);
  for (const r of p.clubs.away.rows) {
    assert.equal(r.need, null);
    assert.equal(r.settled, false);
    assert.ok(r.value > 0, 'the figure itself is still there');
  }
});

test('⭐ the card never says who will win, and carries no word that forecasts', () => {
  /* The page this is linked from says the club with more shot attempts LOSES
     2,228 of 4,100 games. A preview that forecast would contradict it. This is a
     derived guard rather than a list of banned words in the copy: every value the
     module hands out is a count, a share, a game count or a label. */
  const p = preview(2025020500, docs(), NOW);
  const walk = (v, path) => {
    if (v == null) return;
    if (typeof v === 'string')
      assert.doesNotMatch(v, /\b(expect|should|likely|favou?r|predict|win|lose)\b/i,
        `${path} forecasts: ${v}`);
    else if (typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`);
  };
  walk(p, 'preview');
});
