/**
 * The archive by date — the grid, the cell, and what is inside one.
 *
 * These are pure functions, so every test here is arithmetic over rows. The
 * rendering questions (where the calendar lives, what the mark reads) are
 * settled in docs/discovery.md §10 and none of them reaches this file.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  monthOf, weekdayOf, daysInMonth,
  nightsOf, monthsIn, monthGrid, nightOf, seasonOfMonth, otherInMonth,
} from '../src/lib/calendar.js';
// The naming of a competition moved to its own module when the verdict card
// needed the same answer from the same table. Tested here still, because the
// calendar is what has to render it.
import { competitionOf } from '../src/lib/competitions.js';
import { season, seasonLabel } from '../src/lib/archive.js';

/**
 * The one table, read from the file derive.py reads.
 *
 * NOT RE-TYPED HERE. A second copy is what makes a name in the page disagree
 * with the set the pipeline validates against, and the whole point of moving
 * this out of calendar.js was that there be exactly one.
 */
const NAMES = JSON.parse(
  readFileSync(new URL('../data/competitions.json', import.meta.url))).names;

/** Catalog rows, in the shape the browser actually receives. */
const row = (id, d, extra = {}) => ({ id, d, a: 'BUF', h: 'MIN', hs: 2, as: 1,
                                      hsh: 30, ash: 28, t: Number(String(id).slice(4, 6)) === 2 ? 2 : 1,
                                      v: 1, ...extra });
const NHL = (n, d, extra) => row(2023020000 + n, d, { t: 2, ...extra });
const PRE = (n, d, extra) => row(2023010000 + n, d, { t: 1, ...extra });
const OLY = (n, d, extra) => row(2025090000 + n, d, { t: 9, ...extra });

test('a date holds two counts and they are never added together', () => {
  // THE WHOLE POINT OF THE SEPARATE MARK. The front door promises preseason,
  // the Olympics and the 4 Nations are "left out of every number here", so a
  // cell that printed 12 for 9 NHL games and 3 preseason would make that
  // sentence false — and the fix for that must not be to edit the sentence.
  const g = [NHL(1, '2023-11-10'), NHL(2, '2023-11-10'), PRE(1, '2023-11-10')];
  const [cell] = monthGrid(g, '2023-11').flat().filter(c => c && c.date === '2023-11-10');
  assert.equal(cell.count, 2, 'NHL games are the count');
  assert.equal(cell.other, 1, 'and the rest is a separate mark');
  assert.notEqual(cell.count, 3, 'they must not have been summed');
});

test('the mark names the competition, and "preseason" is wrong for 38 of the dates', () => {
  // 320 of 361 out-of-scope games are preseason, which makes "preseason" the
  // tempting shorthand and false on every Olympic and 4 Nations night — 38 of
  // the 60 dates this feature exists to make visible.
  const g = [OLY(1, '2026-02-11'), OLY(2, '2026-02-11')];
  const [cell] = monthGrid(g, '2026-02').flat().filter(c => c && c.date === '2026-02-11');
  assert.deepEqual(cell.types, [9], 'the grid carries the raw type, never a label');
  assert.equal(competitionOf(9, NAMES), 'Olympics');
  assert.equal(competitionOf(19, NAMES), '4 Nations');
  assert.equal(competitionOf(4, NAMES), 'all-star');
});

test('an unnamed gameType degrades to itself — but that is the last resort, not the policy', () => {
  /* THE POLICY IS IN derive.py, WHICH GOES RED. This only covers the window
     between the league inventing a competition and a human naming it, so a
     reader sees `game type 77` rather than `undefined`.

     Rendering raw was briefly the WHOLE answer here, and that was wrong.
     `gameType` is a small closed enum — the league mints a code when it invents
     a competition, 19 and 20 for the 4 Nations in 2025, 9 for the Olympics in
     2026 — so an unseen value is an event, not the open-ended vocabulary a
     missed-shot reason is. Nothing watched it: the vocabulary gate covers five
     fields inside the play-by-play, and this is a property of the game. */
  assert.equal(NAMES['77'], undefined, 'the fixture must use an unnamed type');
  assert.equal(competitionOf(77, NAMES), 'game type 77');
  assert.equal(competitionOf(77, undefined), 'game type 77', 'and with no table at all');
  const [cell] = monthGrid([row(2023770001, '2024-03-03', { t: 77 })], '2024-03')
    .flat().filter(c => c && c.date === '2024-03-03');
  assert.deepEqual(cell.types, [77], 'the grid still computes; only the label is missing');
});

test('the table names every gameType the live archive holds', () => {
  // The pinned half. derive.py is the half that fires the day the league
  // invents something, because it walks the archive and this file cannot.
  for (const t of ['1', '2', '3', '4', '9', '12', '19', '20']) {
    assert.ok(NAMES[t], `gameType ${t} is in the archive and has no name`);
  }
});

test('a label is never baked into the grid', () => {
  // MUTATION GUARD on the split. If monthGrid resolved names itself it would
  // need its own copy of the table, which is the drift this was moved to avoid.
  const [cell] = monthGrid([row(2023090001, '2026-02-11', { t: 9 })], '2026-02')
    .flat().filter(c => c && c.date === '2026-02-11');
  assert.deepEqual(cell.types, [9]);
  assert.equal(JSON.stringify(cell).includes('Olympics'), false,
               'the grid must not know what 9 is called');
});

test('a cell counts what we HOLD, not what we can show', () => {
  // Doctrine 9: a schedule listing only the games that worked is a map of our
  // successes. The team page already refuses to be one.
  const g = [NHL(1, '2024-01-13'), NHL(2, '2024-01-13', { v: 0, r: 'validation' })];
  const [cell] = monthGrid(g, '2024-01').flat().filter(c => c && c.date === '2024-01-13');
  assert.equal(cell.count, 2, 'the refused game still happened and we still hold it');
});

test('a night where nothing can be opened is a STATE, not two dead rows', () => {
  // Measured on the live catalog: 10 such nights, ALL of them Olympic, and all
  // of them reachable only because the separate-mark ruling put out-of-scope
  // games on the calendar. Without that inclusion this case is unreachable;
  // with it, it is the first thing a reader clicking February 2026 hits.
  const g = [OLY(1, '2026-02-11', { v: 0, r: 'validation' }),
             OLY(2, '2026-02-11', { v: 0, r: 'validation' })];
  const leaf = nightOf(g, '2026-02-11');
  assert.equal(leaf.held, 2);
  assert.equal(leaf.shown, 0);
  assert.equal(leaf.dead, true);
});

test('a night with SOME unshowable games is not dead', () => {
  // MUTATION GUARD. `dead` defined as "contains a refusal" would fire on 24
  // real nights that have perfectly clickable games on them, and send a reader
  // an apology instead of a list.
  const g = [NHL(1, '2024-01-13'), NHL(2, '2024-01-13', { v: 0, r: 'validation' })];
  const leaf = nightOf(g, '2024-01-13');
  assert.equal(leaf.dead, false);
  assert.equal(leaf.shown, 1);
});

test('a date with no games at all is not "dead" — nothing happened', () => {
  // Two different sentences: "we hold games here and cannot show them" is about
  // US, "there was no hockey" is about hockey. A single empty-state would say
  // the first on 200 nights where the second is true.
  const leaf = nightOf([NHL(1, '2024-01-13')], '2024-01-14');
  assert.equal(leaf.held, 0);
  assert.equal(leaf.dead, false);
});

test('empty months are walked, not skipped', () => {
  // An offseason is a true and ordinary fact about hockey. Measured: 4 of the
  // 34 months in the archive's span hold no games at all, and a stepper that
  // jumped over them would tell a reader the season is continuous.
  const months = monthsIn([NHL(1, '2024-06-20'), NHL(2, '2024-10-05')]);
  assert.deepEqual(months, ['2024-06', '2024-07', '2024-08', '2024-09', '2024-10']);
});

test('the grid never borrows a day from the month either side', () => {
  // A cell reading "3" for the 31st of last month is a click that leaves the
  // month you are looking at, and its count would be read as belonging to this
  // one. Blanks are blank.
  const weeks = monthGrid([], '2024-02');
  const cells = weeks.flat();
  assert.equal(cells.length % 7, 0, 'whole weeks');
  assert.ok(cells.every(c => c === null || c.date.startsWith('2024-02')),
            'every non-blank cell belongs to this month');
  assert.equal(cells.filter(Boolean).length, 29, '2024 is a leap year');
});

test('days in a month are computed, including February in a leap year', () => {
  assert.equal(daysInMonth('2024-02'), 29);
  assert.equal(daysInMonth('2025-02'), 28);
  assert.equal(daysInMonth('2100-02'), 28, 'the century rule, which a table gets wrong');
  assert.equal(daysInMonth('2023-11'), 30);
});

test('⭐ the weekday holds in a timezone west of Greenwich — IMPOSED, not inherited', () => {
  /* THE TRAP, AND THEN THE TRAP UNDER THE TRAP.

     '2023-11-10' parses as UTC midnight, so `new Date(s).getDay()` answers for
     the NINTH anywhere in the Americas — a calendar silently rotated one column
     for most of its readers, on a page whose only job is which day a game was on.

     The first version of this test asserted the values and stopped there. It
     caught the bug on my machine (America/New_York) and I checked what it did
     elsewhere: mutating `weekdayOf` to the broken form and running under TZ=UTC
     gave ZERO failures. CI runs UTC. So the guard with the star on it protected
     nobody in the pipeline — a check with no instrument for the axis it names,
     which is this project's other named failure mode.

     So the timezone is IMPOSED here rather than requested. `process.env.TZ` is
     honoured at runtime by Node 16+, verified in this process below: the same
     date string must produce a different `getDay()` in the two zones, or the
     lever this test pulls is not connected and everything after it is void. */
  const prior = process.env.TZ;
  try {
    process.env.TZ = 'America/Los_Angeles';
    const la = new Date('2023-11-10').getDay();
    process.env.TZ = 'UTC';
    const utc = new Date('2023-11-10').getDay();
    assert.notEqual(la, utc, 'the TZ lever is not connected; this test proves nothing');

    // Now the real assertion, in the zone that breaks the naive implementation.
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(weekdayOf('2023-11-10'), 5, 'Friday, in Los Angeles too');
    assert.equal(weekdayOf('2023-11-12'), 0, 'Sunday — the column the grid starts on');
    assert.equal(weekdayOf('2023-11-11'), 6, 'Saturday — the last column');
    assert.equal(monthGrid([], '2023-11')[0].filter(c => c === null).length, 3,
                 '1 Nov 2023 was a Wednesday, from Los Angeles');
  } finally {
    if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior;
  }
});

test('the grid puts the first of the month in the right column', () => {
  // The consequence of the test above, at the level a reader would notice: if
  // the weekday were off by one, every date in the month sits under the wrong
  // heading and nothing else in the file would fail.
  const weeks = monthGrid([], '2023-11');
  assert.equal(weeks[0].filter(c => c === null).length, 3, '1 Nov 2023 was a Wednesday');
  assert.equal(weeks[0][3].date, '2023-11-01');
});

test('the night list puts NHL first and is stable within each group', () => {
  // The catalog's order is not guaranteed, and a list that reshuffles between
  // visits is one a reader cannot return to.
  const g = [PRE(9, '2023-10-05'), NHL(4, '2023-10-05'), NHL(2, '2023-10-05')];
  const leaf = nightOf(g, '2023-10-05');
  assert.deepEqual(leaf.rows.map(r => r.scope), ['nhl', 'nhl', 'other']);
  assert.deepEqual(leaf.rows.map(r => r.id), [2023020002, 2023020004, 2023010009]);
  assert.equal(leaf.rows[2].type, 1);
  assert.equal(competitionOf(leaf.rows[2].type, NAMES), 'preseason');
  assert.equal(leaf.rows[0].type, null, 'an NHL game is not a competition footnote');
});

test('nightsOf keeps held and shown apart rather than deriving one at the end', () => {
  // The difference between them is what the leaf has to explain. Recomputing it
  // at the render site is how a disclosure quietly becomes optional.
  const g = [NHL(1, '2024-01-13'), NHL(2, '2024-01-13', { v: 0 }), PRE(1, '2024-01-13', { v: 0 })];
  const n = nightsOf(g).get('2024-01-13');
  assert.deepEqual(n.inScope, { held: 2, shown: 1 });
  assert.equal(n.other.held, 1);
  assert.equal(n.other.shown, 0);
});

test('monthOf is string arithmetic and never a Date', () => {
  assert.equal(monthOf('2023-11-10'), '2023-11');
  assert.equal(monthOf('2024-01-01'), '2024-01');
});


/* ---------------------------------------------------------------------------
   THE STEPPER: which season a month belongs to, and what a month holds that is
   never counted. Both exist for the PAGE, and both are arithmetic, so they are
   tested here rather than looked at.
   --------------------------------------------------------------------------- */

test('⭐ the month→season rule agrees with the game id, at both boundaries', () => {
  // THE ONLY ANSWER THAT IS NOT OURS is the one in the id, and this rule is
  // allowed to disagree with it — silently, filing a game under a tab nobody
  // will think to check. So the two are compared rather than each pinned to a
  // literal: a test whose subject is a constant is testing the answer.
  const june = { id: 2023030417, d: '2024-06-24' };     // a playoff final
  const july = { id: 2024010001, d: '2024-07-02' };     // hypothetical, and the point
  for (const g of [june, july]) {
    assert.equal(seasonOfMonth(monthOf(g.d)), Number(season(g.id)),
      `${g.d} filed under ${seasonLabel(seasonOfMonth(monthOf(g.d)))}, `
      + `id says ${seasonLabel(season(g.id))}`);
  }
  // And the cutover is where it is claimed to be, not one month either side.
  assert.equal(seasonOfMonth('2024-06'), 2023);
  assert.equal(seasonOfMonth('2024-07'), 2024);
});

test('an out-of-scope count is per GAME, never apportioned between competitions', () => {
  // THE ARCHIVE HAS NEVER MIXED — 0 of 9 months, measured 2026-08-21 — so this
  // is the case reality does not supply and the code must still be right for.
  // An earlier version summed the NIGHT's count once per type present, which
  // divides: two competitions on one night would have printed 1.5 each.
  //
  // THE FIXTURE IS DELIBERATELY LOPSIDED, and it was not the first time. With
  // 2 preseason and 1 Olympic, biggest-first and lowest-type-first produce the
  // SAME order, so dropping the count from the sort left this green — a test
  // that arrives where it already was. The bigger group is now the higher type.
  const games = [
    OLY(1, '2024-02-01'), OLY(2, '2024-02-01'), PRE(3, '2024-02-01'),
    NHL(4, '2024-02-02'),
  ];
  assert.deepEqual(otherInMonth(games, '2024-02'),
    [{ type: 9, games: 2 }, { type: 1, games: 1 }]);
  // The NHL game is in neither row, and the two rows do not sum to the night.
  assert.equal(otherInMonth(games, '2024-02').reduce((n, r) => n + r.games, 0), 3);
});

test('a month with nothing out of scope says so with an empty list, not a zero row', () => {
  const games = [NHL(1, '2024-03-01'), NHL(2, '2024-03-02')];
  assert.deepEqual(otherInMonth(games, '2024-03'), []);
});

test('otherInMonth names no competition — the caller does', () => {
  // Same guard as the grid's. A label baked in here would be a second copy of
  // data/competitions.json, which is the whole reason competitionOf takes it.
  const rows = otherInMonth([PRE(1, '2024-09-24')], '2024-09');
  assert.deepEqual(Object.keys(rows[0]).sort(), ['games', 'type']);
  assert.equal(competitionOf(rows[0].type, NAMES), 'preseason');
});

test('the month a game is in decides its column, not the month asked for', () => {
  // A row from a neighbouring month must not leak into the count — the same
  // rule the grid holds for borrowed days, asserted where the arithmetic is.
  const games = [PRE(1, '2024-09-30'), PRE(2, '2024-10-01')];
  assert.deepEqual(otherInMonth(games, '2024-09'), [{ type: 1, games: 1 }]);
  assert.deepEqual(otherInMonth(games, '2024-10'), [{ type: 1, games: 1 }]);
});
