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
import { readFileSync } from 'node:fs';
import { preview, CLUB_ROWS, POSSESSION_FAMILY } from '../src/lib/preview.js';
import { censusGame, censusAdd, censusRates } from '../src/lib/census.js';

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

test('⛔ a game that has started says STARTED, and never says it is under way', () => {
  /* THE STATE WAS `underway` AND THAT IS A CLAIM WITH AN EXPIRY. A game ends
     about two and a half hours after it starts, and the archive does not hold it
     until the night is ingested — up to thirteen hours later — so the page told
     a reader a finished game was live. Kevin saw exactly that on the live site
     on 23 September 2026. It was also a real-time claim on a site whose whole
     position is that it is a replay and never live.

     MUTATION: rename the state back and the first assertion fires; give it an
     elapsed-time cutoff and the last one does. */
  const p = preview(2025020500, docs(), '2026-01-16T01:00:00Z');
  assert.equal(p.state, 'started');
  assert.equal(p.result, null, 'we hold nothing until the nightly runs');
  const late = preview(2025020500, docs(), '2026-01-17T12:00:00Z');
  assert.equal(late.state, 'started',
    'a day later and still not in the archive — nothing here learns a game has ENDED');
});

/* ------------------------------------------------- WHEN COUNTING BEGINS */

test('⛔ before the opener the card says WHEN its numbers start, quoting the league', () => {
  /* Both columns read "No games counted yet this season." and stopped, for the
     ten days between the first preseason game and the opener — true, and to a
     reader indistinguishable from a page that is broken.
     MUTATION: type the date into the module instead of reading `schedule.json`,
     and changing the fixture below stops moving the answer. */
  const sched = { ...schedule(), season: { regularSeasonStartDate: '2026-09-29' } };
  const p = preview(2025020500, docs({ schedule: sched }), '2026-09-23T12:00:00Z');
  assert.equal(p.counting.startsOn, '2026-09-29');
  assert.equal(p.counting.started, false);
});

test('on the opener and after it, the card stops promising a start date', () => {
  const sched = { ...schedule(), season: { regularSeasonStartDate: '2026-09-29' } };
  for (const now of ['2026-09-29T00:01:00Z', '2026-11-02T12:00:00Z']) {
    assert.equal(preview(2025020500, docs({ schedule: sched }), now).counting.started, true, now);
  }
});

test('a schedule with no season block promises nothing rather than inventing a date', () => {
  // The same degradation the front door makes when fixtures carry no date.
  const p = preview(2025020500, docs(), NOW);
  assert.equal(p.counting.startsOn, null);
  assert.equal(p.counting.started, false);
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

test('⭐ a club row per admitted measure, each with its own progress toward settling', () => {
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
  // EVERY row, not a count typed here: with no settle block nothing is admitted
  // or rejected, so the card shows what it measures and claims nothing about it.
  assert.equal(p.clubs.away.rows.length, CLUB_ROWS.length);
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

/* ------------------------------------- THE DOCUMENT THE PIPELINE REALLY WRITES
 *
 * ⛔⛔ EVERY FIXTURE ABOVE IS HAND-WRITTEN, AND ONE OF THEM WAS A LIE. The
 * `measures()` helper types out a `census.whistles` block, and for a day nothing
 * in the pipeline produced one: `censusRates` — the only projection that reaches
 * `measures.json` — did not publish the counters `censusGame` had been summing.
 * The league rows could not draw on the live site, and this suite was green
 * throughout, because a fixture is free to invent the producer's output.
 *
 * So this one asks the producer. It is slower and it is the only test here that
 * would have failed.
 */
test('⛔⛔ the league rows draw from a census this repo actually PRODUCES', () => {
  const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
  const real = censusRates(censusAdd({}, censusGame(rich.events, { roster: rich.roster,
    homeId: rich.teams.home.id, awayId: rich.teams.away.id,
    homeAb: rich.teams.home.ab, awayAb: rich.teams.away.ab })));

  const p = preview(2025020500, docs({ measures: { census: real } }), NOW);
  const keys = p.league.map(r => r.key);
  /* ⭐ THE THREE ORIGINALS LEAD, IN ORDER, AND EVERY OTHER KEY MUST BE ONE THE
     RENDERER KNOWS HOW TO DRAW. A row the module emits and the renderer has no
     branch for renders as an empty tile — which is the shape of defect that put
     an unstyled page in front of Kevin in the first place. `attempts` is absent
     here because it comes from `attemptMix`, which is measure.mjs's, not the
     census's; the renderer test covers that one. */
  assert.deepEqual(keys.slice(0, 3), ['powerplay', 'penalties', 'offside'],
    'a real census must produce the three original rows, in the order the card prints them');
  const KNOWN = new Set(['powerplay', 'penalties', 'offside', 'icing', 'attempts', 'shift', 'hits']);
  for (const k of keys) assert.ok(KNOWN.has(k), `no renderer branch draws ${k}`);
  assert.ok(keys.includes('hits'), 'the census publishes hits, so the frame must pick them up');
  /* ⛔ AND THE PAIRED HALF: `shift` is ABSENT here, correctly. The fixture is one
     game with no shift chart attached, so `census.shift.n` is 0 and the row
     withholds rather than printing a median of nothing. A guard that only ever
     sees data present has never been shown to work. */
  assert.ok(!keys.includes('shift'),
    'a shift row was drawn from a fixture that carries no shifts');

  // ⭐ AND THE FIGURES MUST BE FINITE, not NaN from a missing denominator — the
  // renderer calls .toFixed() on these and NaN would reach the page as "NaN".
  for (const r of p.league) {
    for (const [k, v] of Object.entries(r)) {
      if (typeof v === 'number') assert.ok(Number.isFinite(v), `${r.key}.${k} is ${v}`);
    }
  }
  // MUTATION: publish whistles as rates instead of counts and this fires, because
  // the card's two divisions both need the raw chance count.
  const pp = p.league.find(r => r.key === 'powerplay');
  assert.ok(pp.chances > 0 && Number.isInteger(pp.chances), 'chances is a raw count');
  assert.ok(pp.rate > 0 && pp.rate < 1, `a success rate, got ${pp.rate}`);
});

/* ------------------------------------ THE MEASURES WE DELIBERATELY WITHHOLD */

test('⭐⭐ the possession family contains the row it explains, plus the ones we do not show', () => {
  /* The card shows one possession row and says the others are the same
     measurement. That claim is only checkable if the published agreement figure
     was computed over the SHOWN row and the withheld ones TOGETHER — a matrix of
     three measures none of which is on the card would prove nothing about the
     card.
     MUTATION: drop `CLUB_ROWS.find(...)` from the head of the list and the first
     assertion fires. */
  assert.equal(POSSESSION_FAMILY[0].key, 'level5', 'the family must lead with the row we print');
  assert.equal(POSSESSION_FAMILY[0], CLUB_ROWS.find(r => r.key === 'level5'),
    'it must be the SAME definition the card draws, not a second copy of it');
  assert.deepEqual(POSSESSION_FAMILY.map(r => r.key), ['level5', 'corsi', 'fenwick', 'sog']);
  for (const r of POSSESSION_FAMILY) {
    assert.equal(typeof r.ofGame, 'function', `${r.key} has no per-game form`);
    assert.ok(r.label, `${r.key} has no label for the methods page`);
  }
});

test('⛔⛔ unblocked attempts subtract the OTHER side’s blocks, which is what the field means', () => {
  /* `measureGame` credits a block to the team that MADE it — the defending team
     — so the blocks that removed home attempts are the away side's. Subtracting
     a side's own blocks produces a Fenwick share that moves the wrong way, and it
     is plausible enough to survive review: both versions are shares, both sum to
     one, both look like Fenwick.
     MUTATION: swap `g.blocks.a` for `g.blocks.h` and the home share becomes
     25/37 rather than 22/37 — a five-point error in a figure published as the
     proof that we checked our work. */
  const g = { attempts: { h: 30, a: 20 }, blocks: { h: 5, a: 8 },
              sog: { h: 12, a: 9 } };
  const fen = POSSESSION_FAMILY.find(r => r.key === 'fenwick');
  assert.deepEqual(fen.ofGame(g, 'h'), { count: 22, n: 37 });
  assert.deepEqual(fen.ofGame(g, 'a'), { count: 15, n: 37 });

  const corsi = POSSESSION_FAMILY.find(r => r.key === 'corsi');
  assert.deepEqual(corsi.ofGame(g, 'h'), { count: 30, n: 50 });
  const sog = POSSESSION_FAMILY.find(r => r.key === 'sog');
  assert.deepEqual(sog.ofGame(g, 'a'), { count: 9, n: 21 });
});

test('⛔ a game whose boxscore carried no figure contributes NOTHING, not a zero share', () => {
  /* The league's shot line is quoted, not derived, and `measureGame` stores null
     rather than guessing. A row that returned `{count: 0, n: 0}` as `0 of 0` is
     harmless; one that returned `{count: 0, n: 1}` would score the club at zero
     percent for that night and drag a full-season figure down invisibly.
     MUTATION: drop the `Number.isFinite` guard and `n` becomes NaN, which
     silently poisons every sum it reaches. */
  const sog = POSSESSION_FAMILY.find(r => r.key === 'sog');
  for (const bad of [{ h: null, a: 9 }, { h: 12, a: undefined }, { h: 0, a: 0 }]) {
    assert.deepEqual(sog.ofGame({ sog: bad }, 'h'), { count: 0, n: 0 },
      `a missing shot line was read as ${JSON.stringify(bad)}`);
  }
});

test('⛔ nothing withheld is ever rendered as a club row', () => {
  /* The whole point of the family is that it is NOT on the card. A withheld
     measure that leaked into CLUB_ROWS would be the one defect this disclosure
     cannot survive: the page would print four rows while the text beside them
     explained that it prints one. */
  const shown = new Set(CLUB_ROWS.map(r => r.key));
  for (const r of POSSESSION_FAMILY.slice(1)) {
    assert.ok(!shown.has(r.key), `${r.key} is withheld and also on the card`);
  }
});
