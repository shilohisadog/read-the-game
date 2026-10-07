/**
 * The preview page, RUN — not grepped.
 *
 * ⛔⛔ WHY THIS FILE EXISTS AT ALL. `test/preview.test.js` drives the MODULE, and
 * it was green on 23 September 2026 while the live page showed two clubs, two
 * links and nothing else. Every defect Kevin found that morning was in the
 * renderer — the sentence an empty column prints, the status a started game
 * claims, the disclosure a preseason game never made — and the renderer had no
 * test at all. The module deciding correctly is not the page saying so.
 *
 * The harness is `test/calendar-page.test.js`'s, for the same reason it has one:
 * nothing on this page is in the markup. The page is three ids and a script.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
/* ⚠️ THE MODULE ITSELF, not the page's inlined copy of it. This file drives the
   RENDERER, and for one claim below that is not enough: `leagueRows()` is shared
   with the replay, and "the card stopped drawing a row" and "the module stopped
   producing it" look identical from here. */
import { leagueRows } from '../src/lib/league-rows.js';

const html = readFileSync(new URL('../src/preview.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const PAGE_IDS = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

/* ⭐⭐⭐ THE DIAGRAM SET AND THE OTHER SURFACE THAT READS IT — the two documents
   that make the door tests below non-circular.

   `data/learn-figures.json` is keyed by CARD ID and is the only statement of
   which lessons own a rule diagram. `what-you-can-see.html` is the OTHER reader
   of the same rule, built down a different path in `build_index.py`, and it was
   RIGHT for the eleven days the preview was wrong -- so asking the two surfaces
   to agree is a check neither one can satisfy alone. */
const FIGURES = JSON.parse(
  readFileSync(new URL('../data/learn-figures.json', import.meta.url), 'utf8'));
const learnPage = readFileSync(
  new URL('../src/what-you-can-see.html', import.meta.url), 'utf8');
const cardHref = id =>
  (new RegExp(`<a class="card" id="${id}" href="([^"]+)"`).exec(learnPage) || [])[1];
const DOORS = JSON.parse(/var DOORS = (\{[\s\S]*?\});/.exec(html)[1]);

function fakeDom() {
  const make = (tag) => ({
    tag, className: '', href: '', textContent: '', style: {}, attrs: {}, kids: [],
    appendChild(n) { this.kids.push(n); return n; },
    setAttribute(k, v) { this.attrs[k] = v; },
  });
  const ids = {};
  // ⚠️ THE TRACK IS SVG, and `createElementNS` is a different method. The first
  // run of this harness had only `createElement`, so every test that reached the
  // chart threw inside the renderer — which the suite reports as an assertion
  // failure on whatever came after, not as "the page did not draw".
  const doc = { title: '', createElement: make, createElementNS: (_ns, t) => make(t),
    getElementById(id) {
      // Only ids the built page really carries, so a reference to a deleted
      // element is a null here exactly as it is in a browser.
      if (!PAGE_IDS.has(id)) return null;
      return (ids[id] = ids[id] || make('div#' + id));
    } };
  return { ids, document: doc };
}

function walk(node, out = []) {
  if (!node) return out;
  out.push(node);
  node.kids.forEach(k => walk(k, out));
  return out;
}
const textOf = n => walk(n).map(x => x.textContent).filter(Boolean).join(' ');

/* ------------------------------------------------------------- FIXTURES */

const GID = 2026020100;
const OPENER = '2026-09-29';
const FIXTURE = { id: GID, date: '2026-10-02', gameType: 2, state: 'FUT',
  away: 'BUF', home: 'PIT', startTimeUTC: '2026-10-03T00:00:00Z' };

const club = (o = {}) => ({ games: 12, attempts: { for: 600, against: 590 },
  slot: { count: 140, n: 300 }, dmen: { count: 190, n: 600 },
  level5: { for: 240, against: 230 }, ...o });

const DOCS = {
  'schedule.json': { asOf: '2026-10-01T12:00:00Z', upcoming: [FIXTURE],
    season: { preSeasonStartDate: '2026-09-19', regularSeasonStartDate: OPENER } },
  'teams.json': { through: '2026-10-01',
    seasons: { 2026: { BUF: club(), PIT: club({ games: 11 }) } } },
  'measures.json': {
    attemptMix: { games: 4192, byType: { 'shot-on-goal': 215529, goal: 25597,
      'blocked-shot': 138880, 'missed-shot': 120714 } },
    census: { games: 4192,
      shift: { n: 3101105, median: 46, p25: 34, p75: 59, underMinute: 0.759 },
      hits: { n: 4192, r: -0.07, opposite: 0.481, totalHits: 188512 },
      whistles: { penalties: 30434, offsides: 18700, ppChances: 22720, ppGoals: 4982, shGoals: 560 } },
    settle: { target: 0.7, admission: 41, seasons: ['2023', '2024'],
      rows: { level5: { r: 0.73, games: 35, clubRange: { min: 0.44, max: 0.57, median: 0.5, n: 96 } },
              dmen: { r: 0.81, games: 23, clubRange: { min: 0.26, max: 0.38, median: 0.32, n: 96 } },
              slot: { r: 0.72, games: 37 } } } },
  'recent.json': { asOf: '2026-10-01T12:00:00Z', games: [] },
  'catalog.json': { games: [] },
};

/**
 * Render the page against a set of documents.
 *
 * ⚠️ THE CLOCK IS A FOURTH PARAMETER, NOT A GLOBAL. The page reads the moment in
 * `boot`'s `.then` — asynchronously, which is right, since the browser's clock is
 * the only one it has. The first draft of this harness swapped `global.Date` and
 * restored it in a `finally`, so the restore always won the race and every
 * time-dependent test silently ran against the real clock: two of them passed
 * for the wrong reason and two failed. Binding `Date` in the function's own
 * scope cannot race, and it touches nothing outside this call.
 */
function run(over = {}, search = `?game=${GID}`, at = null) {
  const docs = { ...DOCS, ...over };
  const { ids, document } = fakeDom();
  const fetch = url => {
    const name = url.split('/').pop();
    const body = Object.prototype.hasOwnProperty.call(docs, name) ? docs[name] : null;
    return Promise.resolve(body == null
      ? { ok: false, json: () => Promise.resolve(null) }
      : { ok: true, json: () => Promise.resolve(body) });
  };
  const Real = Date;
  const Clock = at ? class extends Real {
    constructor(...a) { super(...(a.length ? a : [at])); }
    static now() { return new Real(at).getTime(); }
  } : Real;
  new Function('document', 'fetch', 'location', 'Date', script)(
    document, fetch, { search, origin: 'https://readthegame.co' }, Clock);
  return { ids, document, settle: () => new Promise(r => setTimeout(r, 0)) };
}

/* ---------------------------------------------------- THE EMPTY COLUMNS */

test('⛔ an empty column says WHEN counting starts, not only that it is empty', async () => {
  /* THE DEFECT, FROM THE LIVE SITE, 23 September 2026: both columns read
     "No games counted yet this season." and stopped. It is true — preseason is
     excluded from every number here — and to a reader it is indistinguishable
     from a page that has failed to load.

     MUTATION THIS MUST FAIL AGAINST: drop the clause and only the first
     assertion survives; type the date instead of reading `schedule.json` and
     the last one, which moves the feed's date, fires. */
  /* ⛔⛔⛔ THE CLOCK IS PINNED, AND IT WAS NOT UNTIL 2026-09-29 — the morning the
     2026-27 regular season opened, which is the date this fixture names. The
     sentence only renders while `!counting.started`, so on 29 September the
     branch became unreachable and this test failed against CORRECT code: the
     page had stopped promising a start date because the season had started.
     ⭐ A test whose subject is a BEFORE state must own the instant it runs at.
     `run()` has taken a clock since the test directly below was written; this one
     simply never passed it, and read as green for as long as the season was out.
     Shape 10 in `memory/mechanize-the-review.md`, in its other direction: not a
     check that cannot fail, but one that could only ever pass in conditions that
     expire. `tools/clock-sweep.sh` exists for this class. */
  const BEFORE = '2026-09-20T12:00:00Z';
  const { ids, settle } = run({ 'teams.json': { through: '2026-09-18', seasons: {} } },
    `?game=${GID}`, BEFORE);
  await settle();
  const said = textOf(ids.pv);
  assert.match(said, /No games counted yet this season/, 'the subject must be on the page');
  assert.match(said, /the regular season starts 29 September 2026/);

  const moved = run({ 'teams.json': { through: '2026-09-18', seasons: {} },
    'schedule.json': { ...DOCS['schedule.json'],
      season: { regularSeasonStartDate: '2026-10-07' } } }, `?game=${GID}`, BEFORE);
  await moved.settle();
  assert.match(textOf(moved.ids.pv), /starts 7 October 2026/,
    'the date is the feed’s, so moving the feed moves the sentence');
});

test('once the season has begun an empty column promises no start date', async () => {
  /* A club with nothing counted AFTER the opener is a different fact, and the
     sentence that explains the first would be a false promise about the second.
     MUTATION: drop the `started` test in `countingFrom` and this fires. */
  const { ids, settle } = run({ 'teams.json': { through: '2026-12-01', seasons: {} } },
    `?game=${GID}`, '2026-12-02T12:00:00Z');
  await settle();
  const said = textOf(ids.pv);
  assert.match(said, /No games counted yet this season\./);
  assert.ok(!/regular season starts/.test(said), said.slice(0, 200));
});

/* ------------------------------------------------------- THE DISCLOSURE */

test('⛔ a preseason game says its numbers count for nothing, as every other surface does', async () => {
  /* The calendar cell, the night list and the front door all name preseason as
     out of the numbers. This page printed the bare word "Preseason" and left a
     novice to guess why both columns were empty.
     MUTATION: delete the note and the second assertion fires while the first,
     which only checks the eyebrow, still passes — which is why both are here. */
  const pre = { ...FIXTURE, id: 2026010024, gameType: 1, date: '2026-09-22',
    away: 'CBJ', home: 'BUF', startTimeUTC: '2026-09-22T23:00:00Z' };
  const { ids, settle } = run({ 'schedule.json': { ...DOCS['schedule.json'], upcoming: [pre] },
    'teams.json': { through: '2026-09-18', seasons: {} } },
    '?game=2026010024', '2026-09-23T12:00:00Z');
  await settle();
  assert.match(textOf(ids.pvwhen), /Preseason/);
  assert.match(textOf(ids.pv), /Nothing in a preseason game is counted in any number/);
});

test('a counted game makes no such disclosure', async () => {
  // The paired half: a note that appears on every game teaches nothing.
  const { ids, settle } = run();
  await settle();
  assert.ok(!/preseason/i.test(textOf(ids.pv) + ' ' + textOf(ids.pvwhen)));
});

/* ----------------------------------------------------- THE STARTED GAME */

test('⛔⛔ a game that started never claims to be under way', async () => {
  /* "Under way" was true for about two and a half hours and then stayed on the
     page for up to thirteen more, because nothing here learns a game has ENDED
     until the night is ingested. Kevin read it on a game finished the previous
     evening. It was also a live claim on a site that is a replay and never live.

     MUTATION: restore the status word and the second assertion fires. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-03T23:00:00Z');
  await settle();
  const said = textOf(ids.pvwhen) + ' ' + textOf(ids.pv);
  assert.match(said, /Started /, 'the subject: the page must say the game began');
  assert.ok(!/under way/i.test(said), said.slice(0, 200));
  assert.match(said, /No score here yet/, 'and why there is no result beside it');
});

test('a game that has not started shows its start and no score note', async () => {
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const said = textOf(ids.pvwhen) + ' ' + textOf(ids.pv);
  assert.ok(!/Started /.test(said), said.slice(0, 200));
  assert.ok(!/No score here yet/.test(said));
});

/* ------------------------------------------------------- THE FULL CARD */

test('with a season under way the page draws both frames and both clubs', async () => {
  /* The happy path, asserted so that every "does not say X" above has a subject.
     A page that rendered nothing at all would pass most of this file. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const said = textOf(ids.pv);
  assert.match(said, /What is normal/, 'the league frame');
  assert.match(said, /penalties a team takes/, 'the merged penalty tile');
  assert.match(said, /power plays produce a goal/, 'and the power play inside it');
  assert.match(said, /times a team is offside/, 'the offside tile');
  assert.match(said, /shot attempts reach the goalie/, 'the attempt partition');
  /* ⛔ AND THE TWO THAT WERE TAKEN OFF, ASSERTED AS ABSENT — 2026-10-07. Kevin:
     *"I think I want to remove some of the 'What is normal' cards to create space
     for the per-player cards … let's keep that merged card, offsides, icing and
     attempts (since each of those have a diagram associated with them)."*
     A presence-only list cannot tell a tile that was removed from one that is
     quietly still drawn, which is the half that matters when the reason for
     removing it was SPACE. */
  assert.doesNotMatch(said, /is how long a shift lasts/, 'the shift tile is off this card');
  assert.doesNotMatch(said, /hits a team lands/, 'and so is the hits tile');
  assert.match(said, /5-on-5 CF% while the score was level/, 'a club row');
  assert.match(said, /BUF 12 games · PIT 11 games\. This figure needs 35 before it holds steady/,
    'both teams\u2019 game counts on one line, with the target named once');
  assert.match(said, /Every Buffalo Sabres game we hold/);
  assert.match(ids.pvh1.textContent, /Buffalo Sabres at Pittsburgh Penguins/);
});

test('⛔ every figure in the league frame carries its unit', async () => {
  /* THE DEFECT, read off the live page once the frame could finally draw:
     "Power play — about 22 of power plays produce a goal". `pct()` returns a bare
     number because the club rows below supply their own unit ("22 of every 100"),
     and this sentence forgot to — so the one figure on the card that is a
     PERCENTAGE was the one with nothing saying so.

     MUTATION: drop "of every 100" and the second assertion fires. The first is
     here because a frame that failed to render would pass the second vacuously. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const said = textOf(ids.pv);
  assert.match(said, /power plays produce a goal/, 'the subject: the tile must be on the page');
  assert.match(said, /\d+\s+of every 100/, 'the share names its unit');
  assert.ok(!/\d+ of power plays/.test(said), said.slice(0, 200));
  // The two per-game figures are counts, not shares, and must not grow a "of 100".
  assert.match(said, /\d+\.\d\s+a game/, 'penalties stay a plain rate with its unit');
});

test('a census with no whistle counters drops the frame rather than inventing one', async () => {
  const { ids, settle } = run({ 'measures.json': { census: { games: 4192 } } },
    `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const said = textOf(ids.pv);
  assert.ok(!/What is normal/.test(said), said.slice(0, 200));
  assert.match(said, /Every Buffalo Sabres game we hold/, 'the rest of the page still renders');
});

/* ------------------------------------------------------------- THE CHART */

const rectsIn = n => walk(n).filter(x => x.tag === 'rect').map(x => x.attrs);

test('⭐⭐ the measure row draws BEFORE the season, because the axis is itself measured', async () => {
  /* Kevin, 2026-09-23: *"I think I want to show each row, even if it's currently
     blank, just to get a feel for what the UX will look like."* The site's rule is
     that nothing is drawn on an empty population — and this row is not empty. The
     shaded band is the min and max of the full-season figures real clubs posted
     over three seasons, so the axis carries real data and only the two club bars
     are missing.

     MUTATION: skip the row when every club value is null and the first two
     assertions fire; drop the band rect and the third does. */
  const { ids, settle } = run({ 'teams.json': { through: '2026-09-18', seasons: {} } },
    `?game=${GID}`, '2026-09-23T12:00:00Z');
  await settle();
  const said = textOf(ids.pv);
  assert.match(said, /5-on-5 CF% while the score was level/, 'the measure is named');
  assert.match(said, /no games yet/, 'and each club says it has nothing on it');
  assert.match(said, /Across a full season teams ranged from 44% to 57% in 96 team-seasons/,
    'the caption names the span AND what it was measured over');
  // ⛔ AND NO BAR IS DRAWN FOR A CLUB WITH NO FIGURE. The row is a template, and a
  // template that draws a club's bar at zero would be inventing a measurement.
  const filled = rectsIn(ids.pv).filter(r => r['fill-opacity'] != null);
  assert.equal(filled.length, 0, 'a club with no games was given a bar');
});

test('⛔ no league tick before the season has a league figure', async () => {
  /* Substituting the three-season figure would be two populations wearing one
     label — the trap `leagueShares` already names. So the tick is absent and the
     header says so. MUTATION: fall back to the archive median and this fires. */
  const { ids, settle } = run({ 'teams.json': { through: '2026-09-18', seasons: {} } },
    `?game=${GID}`, '2026-09-23T12:00:00Z');
  await settle();
  assert.match(textOf(ids.pv), /no league figure yet this season/);
});

test('⭐⭐ the bar\'s ink is games over need, so twelve games cannot look like sixty', async () => {
  /* Kevin ruled the ramp. It is continuous and derived — no cliff, which is
     CHENG's P1, and no chosen floor, because the outline carries visibility.
     The fixture gives both clubs 12 games; level5 needs 35 and dmen needs 23,
     so the SAME club must render fainter on the row that needs more.
     MUTATION: make the opacity constant and the inequality fires; floor it at a
     typed minimum and the exact ratios do. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const op = rectsIn(ids.pv).filter(r => r['fill-opacity'] != null)
    .map(r => Number(r['fill-opacity']));
  /* FOUR, not six, and the missing pair is the degradation working: the fixture
     gives `slot` no `clubRange`, and both clubs hold the identical slot figure, so
     that row has no span to draw on and falls back to text. A zero-width axis puts
     every value on one pixel, which is a chart that lies about being a chart. */
  assert.equal(op.length, 4, 'two drawable measures, two clubs — four bars');
  const level5 = op.slice(0, 2), dmen = op.slice(2);
  assert.ok(level5.every(v => v < 1) && dmen.every(v => v < 1), 'nothing has settled at 12 games');
  assert.ok(level5[0] < dmen[0],
    `35 games to settle must draw fainter than 23: ${level5[0]} vs ${dmen[0]}`);
  assert.equal(level5[0].toFixed(3), (12 / 35).toFixed(3), 'the ramp is games/need, nothing else');
});

test('a settled row is drawn at full strength and never past it', async () => {
  // The paired half: a ramp with no ceiling would keep darkening past 1.
  const many = { games: 60, attempts: { for: 3000, against: 2900 },
    slot: { count: 700, n: 1500 }, dmen: { count: 950, n: 3000 },
    level5: { for: 1200, against: 1150 } };
  const { ids, settle } = run({ 'teams.json': { through: '2026-12-01',
    seasons: { 2026: { BUF: many, PIT: many } } } }, `?game=${GID}`, '2026-12-02T12:00:00Z');
  await settle();
  const op = rectsIn(ids.pv).filter(r => r['fill-opacity'] != null)
    .map(r => Number(r['fill-opacity']));
  assert.ok(op.length > 0, 'no bars were drawn at all');
  assert.ok(op.every(v => v === 1), `an opacity above 1 is not a stronger claim: ${op}`);
  /* ⚠️ THE WORD WAS `settled` UNTIL 2026-10-03, and it was a badge: `60 of 23
     games · settled`, a fraction whose top is bigger than its bottom, next to
     the one house word Kevin stopped reading `how-we-measure.html` over. The
     ink claim above is what this test is for; this line is the text claim that
     the row has passed its target, now said in the league note's own words. */
  assert.match(textOf(ids.pv), /BUF 60 games · PIT 60 games\. This figure needs \d+ before it holds steady/);
});

test('⛔⛔ every number on the footnote is told what it counts, and told once', async () => {
  /* ⛔⛔⛔ KEVIN, THREE ROUNDS IN ONE DAY, and each round was the same defect one
     layer out:
       "10 attempts, 43 attempts and 34 attempts… it confuses me why that's the
        case"          → the attempts figure had a noun, and all three were the SAME noun
       "go ahead and fix the other numbers"
                       → `1 of 35 games` reads as season progress; 35 had no noun
       "now we have this wall of text that isn't very inviting to a novice"
                       → the nouns were right and printed TWICE, once per team

     ⭐⭐ SO THE RULE IS BOTH HALVES AT ONCE: every figure is named, and nothing is
     named twice. The population and the target belong to the MEASURE, so they are
     stated once and both teams' numbers follow them; a per-team line that carried
     them was the same seventy characters printed under each team.

     ⛔ AND IT RUNS IN BOTH STATES. An earlier version of this check swept only the
     fixture where no row had reached its target, so the word it forbade was not on
     the page to catch and restoring the defect PASSED. A check is only evidence in
     the state that produces the defect. */
  const SETTLED = { games: 60, attempts: { for: 3000, against: 2900 },
    slot: { count: 700, n: 1500 }, dmen: { count: 950, n: 3000 },
    level5: { for: 1200, against: 1150 } };
  const states = [
    ['still forming', {}, '2026-10-01T12:00:00Z'],
    ['past its target', { 'teams.json': { through: '2026-12-01',
      seasons: { 2026: { BUF: SETTLED, PIT: SETTLED } } } }, '2026-12-02T12:00:00Z'],
  ];
  for (const [what, data, now] of states) {
    const { ids, settle } = run(data, `?game=${GID}`, now);
    await settle();
    /* ⛔ SCOPED TO THE TEAM-ROW CARDS AND TO THEIR FOOTNOTE. The league tiles above
       them say "the puck less in 42 of every 100 games" — a share with its own
       noun — and a sweep of the whole page catches it and then gets weakened until
       it says nothing. This card has already had that exact defect: a check
       announcing "the track" scanned the page and caught the attempt-mix tile. */
    const cards = walk(ids.pv).filter(x => (x.className || '').split(' ').includes('pvm'));
    assert.ok(cards.length >= 2, `${what}: ${cards.length} team cards — nothing to sweep`);
    let judged = 0;
    for (const card of cards) {
      const foot = walk(card).find(x => (x.className || '').split(' ').includes('pvfoot'));
      assert.ok(foot, `${what}: a team card drew no footnote`);
      const lines = foot.kids.map(k => k.textContent);

      // ① THE COUNTS, with the population they came out of, on the same line.
      const counts = lines.filter(l => /^Of .+: [A-Z]{2,3} [\d,]+ of [\d,]+/.test(l));
      assert.equal(counts.length, 1,
        `${what}: ${counts.length} lines state the counts and the population they `
        + `came from; it must be exactly one:\n    ${lines.join('\n    ')}`);
      assert.match(counts[0], /^Of attempts\b/,
        `${what}: "${counts[0]}" does not begin by naming the attempts it counted`);

      // ② THE GAMES, with the target they are measured against, once.
      const games = lines.filter(l => /\b\d+ games?\b/.test(l));
      assert.equal(games.length, 1,
        `${what}: ${games.length} lines carry a game count; the target belongs to `
        + `the measure, so it is said once:\n    ${lines.join('\n    ')}`);
      assert.match(games[0], / This figure needs \d+ before it holds steady\.$/,
        `${what}: "${games[0]}" leaves a reader to guess whether that game count is `
        + 'the season, the archive, or a target');
      /* ⛔ AND NO TEAM IS ABBREVIATED AWAY. Both teams appear on both lines, or
         "said once" has quietly become "said about one team". */
      for (const ab of ['BUF', 'PIT'])
        for (const l of [counts[0], games[0]])
          assert.ok(l.includes(ab + ' '), `${what}: ${ab} is missing from "${l}"`);

      // ③ NOTHING REPEATS. The wall was the same sentence under each team.
      assert.equal(new Set(lines).size, lines.length,
        `${what}: a footnote line is printed twice:\n    ${lines.join('\n    ')}`);
      assert.ok(lines.length <= 3,
        `${what}: ${lines.length} footnote lines — this card is a wall of text again:`
        + `\n    ${lines.join('\n    ')}`);
      judged++;
    }
    assert.ok(judged >= 2, `${what}: ${judged} cards judged`);
  }
});

test('⭐ measure-first: both clubs sit inside one row, not in two stacked blocks', async () => {
  /* The structural repair. Grouped club-first, the one comparison the card exists
     to make was the one the layout forbade.
     MUTATION: go back to a block per club and the ordering assertion fires. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const rows = walk(ids.pv).filter(x => (x.className || '').split(' ').includes('pvm'));
  /* THREE, not two: the fixture's `slot` still needs 37 games, inside the
     41-game admission. The live archive measures 42 and the card drops it — the
     fixture keeps it admitted on purpose, so this suite exercises a third row
     and the admission rule stays tested where it belongs, in preview.test.js. */
  assert.equal(rows.length, 3, 'one row per admitted measure');
  for (const r of rows) {
    const said = textOf(r);
    assert.ok(/BUF/.test(said) && /PIT/.test(said), `both clubs must be in one row: ${said}`);
  }
});

test('⛔ the axis names its own ends, so a full-width band is not an empty meter', async () => {
  /* FOUND BY LOOKING, not by a test — which is the point of this one existing.
     Before the season the axis and the shaded band are the same span, because
     every club-season sits inside it by construction. So the track rendered as
     one flat pale bar and read as an empty progress meter. A chart with no axis
     labels is the defect `mixRow` already names one page over.
     MUTATION: drop the `.pvends` row and the assertions fire; hard-code the
     endpoints and the second one, which uses a different fixture range, does. */
  const { ids, settle } = run({ 'teams.json': { through: '2026-09-18', seasons: {} } },
    `?game=${GID}`, '2026-09-23T12:00:00Z');
  await settle();
  const ends = walk(ids.pv).filter(x => (x.className || '').split(' ').includes('pvends'));
  assert.equal(ends.length, 2, 'one scale under each drawable measure');
  /* level5's fixture range is .44–.57, dmen's is .26–.38 — the labels are the
     axis's own endpoints, so they differ per row and cannot be typed once.
     ⭐ AND THEY CARRY THE UNIT, since 2026-10-03. Kevin, on the live card: *"I
     don't know what the 35 and 37 mean at the right side of the line graph, no
     idea."* Every figure in this picture was a bare number — the club's value,
     both axis ends — beside a header that said `league 31%`. The `%` is not
     decoration here; it is the difference between an axis and four loose
     numbers. */
  assert.deepEqual(ends.map(e => textOf(e)), ['44% 57%', '26% 38%']);
});

test('⛔ nothing is painted across the track but the rail itself', () => {
  /* ⛔⛔⛔ KEVIN REMOVED THE SHADED BAND, 2026-10-03: *"I'd remove the shading
     aspect of the graph, it still isn't easily understandable… I don't think the
     shading is necessary."* Removing the rect and the sentence is easy; keeping
     them gone is the part that needs a check, and mutating the band back in was
     caught by NOTHING — the wording tests pass, the probe passes, and the page
     quietly undoes a ruling.

     ⭐ THE RULE IS POSITIVE AND GEOMETRIC, not a banned colour. What made the
     band unreadable was that it painted a REGION of the track, which composes
     with everything drawn over it and competes with the marks for the same
     meaning. So: exactly one rect may span the track, and that is the rail. Any
     second wide rect is a region, whatever colour it is and whatever it is for.
     MUTATION: restore the band rect and this names its width. */
  return (async () => {
    /* ⛔⛔⛔ THE FIXTURE PUTS A CLUB OUTSIDE THE RANGE, AND THAT IS THE WHOLE
       TEST. With every club inside it, the band spanned the entire axis — x=0,
       width=100 — which is geometrically indistinguishable from the rail, so
       restoring the band passed this check. The band is only a REGION when the
       axis is wider than the range, which is exactly when it was drawn and
       exactly when it misled. A check written against the easy state would have
       approved the thing it was written to forbid. */
    const wild = { games: 6, attempts: { for: 300, against: 290 },
      slot: { count: 70, n: 150 }, dmen: { count: 95, n: 300 },
      level5: { for: 710, against: 290 } };
    const { ids, settle } = run({ 'teams.json': { through: '2026-10-01',
      seasons: { 2026: { BUF: wild, PIT: club() } } } },
      `?game=${GID}`, '2026-10-01T12:00:00Z');
    await settle();
    /* ⚠️ SCOPED TO THE CLUB TRACKS, and the first draft was not — it walked the
       whole preview and caught the attempt-mix tile's stacked bar, which is a
       different chart doing a legitimate thing. A check that announces "the
       track" and scans the page is broader than its own name, which is this
       repo's dominant failure mode; it happened to fail loudly rather than
       quietly, which is luck and not design. */
    /* ⚠️ SCOPED BY THE CARD, after two wrong tries that the vacuity guard and the
       failure message caught in turn. `.pvsvg` is set with `setAttribute`, so an
       SVG element's class is in the attribute bag and `className` is empty — zero
       tracks. And filtering by TAG picks up the attempt-mix tile in the league
       strip, which is also an `svg` and legitimately draws three stacked
       segments. The club rows are the `.pvm` cards, which are plain divs. */
    const tracks = walk(ids.pv).filter(x => (x.className || '').split(' ').includes('pvm'));
    assert.ok(tracks.length >= 2, `only ${tracks.length} club tracks drawn — nothing to check`);
    const notRail = tracks.flatMap(t => rectsIn(t))
      .filter(r => Number(r.width) > 5)
      .filter(r => !(Number(r.width) >= 99 && Number(r.x || 0) <= 1));
    assert.deepEqual(notRail.map(r => `x=${r.x} w=${r.width} fill=${r.fill}`), [],
      'something is painted across part of the track besides the rail — a region '
      + 'like that composes with whatever is drawn over it and competes with the '
      + 'club marks for the same meaning, which is why the band went');
  })();
});

test('⭐⭐ every card says what a full season looks like, the same way', () => {
  /* ⛔⛔⛔ THIS TEST HAS BEEN REWRITTEN TWICE IN ONE DAY, BY TWO RULINGS, and both
     are kept because the path is the lesson.

     IT FIRST DEMANDED THE OPPOSITE: the caption opened `Shaded:` when a club sat
     outside the band and `The scale:` when the band filled the track, so that a
     word naming a visual was not used when the visual was not there. Kevin:
     *"2 of the three metrics say 'shaded' and one says 'the scale', shouldn't
     they be consistent?"* The reasoning was sound and MIS-SITED — the fact that
     varies is whether a CLUB is outside the band, not what the band is called.

     THEN THE BAND ITSELF WENT. Kevin, the same day: *"I'd remove the shading
     aspect of the graph… I don't think the shading is necessary."* And the
     sentence it carried could not survive him asking what it meant: *"'a mark
     outside it' — that sentence can't be true, since the game in question should
     be included, hence it's the top of the scale, not outside of it, no?"*

     ⭐ THE ANSWER IS THAT IT WAS TRUE AND SHOULD NOT HAVE BEEN PRINTED. The band
     was full-SEASON figures and the mark is a club after ONE GAME, so the mark is
     not in that population and really can fall outside it — which means nearly
     every club is outside it in October, and the card announced sampling noise in
     the language of a record. Kevin's own objection is the second half: `lo`/`hi`
     stretch to hold the clubs, so a club past the band BECOMES the end of the
     scale, and the picture said "this is the end" while the words said "outside".

     ⭐ WHAT IS LEFT IS ONE SENTENCE, IDENTICAL EVERYWHERE, and no conditional at
     all. The range still defines the axis — the ends are figures real clubs
     posted rather than a span somebody chose — and it is said in words.
     MUTATION: make any card word it differently and the first pair fires; print
     a second span-related sentence and the last one does. */
  return (async () => {
    const inside = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
    await inside.settle();
    const said1 = textOf(inside.ids.pv);
    const opens = said1.match(/Across a full season teams ranged from/g) || [];
    assert.ok(opens.length >= 2,
      `only ${opens.length} cards carry the shared sentence — they have drifted apart`);
    assert.ok(!/Shaded:|The scale:|shaded band/.test(said1),
      'the band is back, or a card is naming it differently from its neighbours');

    /* ⭐ AND A CLUB WAY OUTSIDE WHAT ANY FULL SEASON PRODUCED CHANGES NOTHING.
       That used to add a sentence; it is the case the sentence was wrong about,
       and it is here as the control — the wording must not move. */
    const wild = { games: 6, attempts: { for: 300, against: 290 },
      slot: { count: 70, n: 150 }, dmen: { count: 95, n: 300 },
      level5: { for: 710, against: 290 } };
    const out = run({ 'teams.json': { through: '2026-10-01',
      seasons: { 2026: { BUF: wild, PIT: club() } } } }, `?game=${GID}`, '2026-10-01T12:00:00Z');
    await out.settle();
    const said2 = textOf(out.ids.pv);
    assert.match(said2, /Across a full season teams ranged from/,
      'the shared sentence went missing on a card with a club outside the range');
    assert.ok(!/beyond anything a full season has produced|outside it/.test(said2),
      'the card is telling a reader their club is past a band it no longer draws');
  })();
});

/* -------------------------------------------------------- THE LEARN DOORS */

test('⭐ every tile and every measure row is a door into the lesson behind it', async () => {
  /* Kevin: "the cards need to also serve as a front door to the learning cards"
     and "the graph should also be a front door to a CF% learning card."
     MUTATION: drop a `learnLink` call and the count fires; point a row at a card
     id that has no door and `_preview_doors` exits the BUILD, which is the half
     this test cannot reach and does not pretend to. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const has = (x, c) => (x.className || '').split(' ').includes(c);
  const doors = walk(ids.pv).filter(x => has(x, 'pvlearn'));
  /* ⛔ THE COUNT USED TO BE THE LITERAL 7, AND A LITERAL CANNOT SURVIVE THE CARD
     CHANGING SHAPE -- which it did on 2026-10-07, when two tiles came off and two
     merged into one. The claim was never "there are seven"; it is "every tile and
     every row has a door", so that is what is asserted, and it holds whatever the
     card is made of next. ⚠️ Both counts are floored so it cannot pass by drawing
     nothing, which is how this family of check goes vacuous. */
  const tiles = walk(ids.pv).filter(x => has(x, 'pvtile'));
  const rows = walk(ids.pv).filter(x => has(x, 'pvm'));
  assert.ok(tiles.length >= 3 && rows.length === 3,
    `${tiles.length} tiles and ${rows.length} measure rows — the card did not draw`);
  assert.equal(doors.length, tiles.length + rows.length,
    'every tile and every measure row carries exactly one lesson door');
  for (const d of doors) {
    /* ⛔⛔⛔ THIS ASSERTION USED TO BE AN `OR` -- *a rule page OR a replay deep
       link* -- and an `or` over the two possible answers is satisfied by ALWAYS
       GIVING THE SAME ONE. Every door on this page was a replay link for eleven
       days while this test passed under the title "a door into the lesson behind
       it". The shape, for the file that keeps them: A CHECK THAT ACCEPTS EITHER
       ANSWER MEASURES NOTHING. Which answer each row must give is pinned per row
       below; this one only asks that the href is a destination at all. */
    assert.match(d.href, /^\/[a-z-]+\.html$|^\/game\.html\?game=\d+&at=/,
      `a door leads nowhere useful: ${d.href}`);
    assert.match(d.textContent, /→$/, 'a door is marked as one');
  }
});

test('⭐⭐⭐ a preview door and the learn page\'s own card for one lesson land in the SAME place', () => {
  /* ⛔⛔⛔ THE DEFECT THIS EXISTS FOR, found by Kevin from the live page on
     2026-10-04: *"on a preview page ... I thought the doors such as 'What a power
     play is' went to the learning page for a power play, it doesn't do that
     anymore."* NONE of the preview card's eight doors reached a rule page; all
     eight dropped the reader into a replay frame.

     ⭐ THE CAUSE WAS A NAME, NOT A RULE. `_card_href` decided "has a diagram ->
     lead to the diagram" from a dict handed in by the caller, and TWO UNRELATED
     THINGS in that builder are called `figures`: the diagram set keyed by card
     id, and `learn-doors.json["figures"]`, which is measured figure VALUES with
     one key, `unreached`. `_learn` passed the first and `_preview_doors` passed
     the second, so the question was asked correctly on one surface and answered
     `false` for everything on the other. The set is now internal to
     `_card_href`, which is why no caller can get it wrong again -- and this is
     the check that says the two surfaces agree regardless.

     ⚠️ WHY THE LEARN PAGE IS A FAIR ORACLE. It is built down a different path and
     was CORRECT for the whole eleven days the preview was wrong, so this cannot
     be satisfied by both surfaces sharing one mistake about a single row. It
     would not catch `_card_href` itself being wrong -- the per-row assertions
     below carry that half.

     MUTATION: hand `_preview_doors` any other dictionary and all four rows fire. */
  const shared = Object.keys(DOORS).filter(k => cardHref(k));
  assert.ok(shared.length >= 4,
    `only ${shared.length} preview rows share a card id with the learn page, so this `
    + 'test has lost its subject -- did a card id get renamed?');
  for (const id of shared) {
    assert.equal(DOORS[id], cardHref(id),
      `the preview sends "${id}" to ${DOORS[id]} and the learn page sends the same `
      + `lesson to ${cardHref(id)} -- one rule, two answers`);
  }
});

test('⭐⭐ the power-play tile opens the lesson, because Kevin keeps the hockey word on the door', () => {
  /* Kevin, 2026-10-04, asked whether the tile should adopt the page's plainer
     wording, since `penalties.html` says "a skater short" six times and never
     says "power play": *"I prefer to keep 'What a power play is' since that's
     the terminology the hockey world uses. We can use the explanatory wording on
     the learning page itself."*

     ⭐ SO THE DOOR AND THE DESTINATION ARE DELIBERATELY IN DIFFERENT REGISTERS:
     the door speaks the language a reader arrives with, the page teaches it in
     the language the site explains things in. That makes it the one row whose
     destination cannot be derived from its own key, so it is pinned here, by the
     card it is meant to open rather than by a typed href. */
  assert.ok(/power play/i.test(script),
    'the preview no longer says "power play" anywhere, so this ruling has lost its subject');
  assert.equal(DOORS.powerplay, cardHref('penalties'),
    'the power-play tile does not open the penalties lesson');
  assert.equal(DOORS.powerplay, '/penalties.html',
    'the penalties lesson is no longer a page of its own');
});

test('⛔⛔ every lesson that owns a diagram is reached AS a diagram, and no other page is invented', () => {
  /* The two halves the cross-surface check cannot make:

     1. A row whose lesson owns a rule diagram must lead to that diagram. This is
        the half that was false for all five such rows, and it is stated against
        `data/learn-figures.json` -- the only document that says which lessons
        have one -- rather than against the builder that reads it.
     2. A door that names a page must name a page this repo actually builds. A
        typo ships a dead link that looks completely normal, which is the failure
        `_preview_doors` already refuses at BUILD time for card ids and could not
        see for page names. */
  const pages = new Set(Object.keys(FIGURES));
  assert.ok(pages.size >= 5, 'the diagram set is suspiciously small');
  let asPage = 0;
  for (const [row, href] of Object.entries(DOORS)) {
    const m = /^\/([a-z-]+)\.html$/.exec(href);
    if (m) {
      asPage++;
      assert.ok(pages.has(m[1]),
        `the "${row}" door opens /${m[1]}.html, which owns no rule diagram`);
      assert.ok(html.length && readFileSync(new URL(`../src/${m[1]}.html`, import.meta.url)).length > 0,
        `the "${row}" door opens a page this repo does not build`);
    } else if (pages.has(row)) {
      assert.fail(`"${row}" owns a rule diagram and the preview sends it to a replay `
        + `frame (${href}) instead of /${row}.html`);
    }
  }
  assert.ok(asPage >= 5,
    `only ${asPage} of the preview's doors open a lesson page; five rows own a diagram `
    + '(power play, penalties, offside, icing, slot), so this is the defect of 2026-10-04 back');
});

test('⭐⭐⭐ a door that promises a term lands on a page that USES that term', () => {
  /* ⛔⛔⛔ KEVIN, 2026-10-04, the moment the power-play door started working:
     *"I also just noticed the Power Play door opens the Penalties card, if that's
     intentional (which is fine), we need to explain the relationship between a
     penalty and a power play, I would suggest in the text at the top of the
     page."*

     He is right, and the gap was total: `penalties.html` said **"a skater short"
     six times and "power play" zero**. So a reader who clicked a door reading
     "What a power play is" arrived at a page that never used the phrase and had
     no way to tell whether it had landed in the right place. ⭐ FIXING THE DOOR
     IN THE MORNING CREATED THIS IN THE AFTERNOON: while every door opened a
     replay frame the promise was never tested against a destination, because
     there was no destination to test it against.

     ⭐⭐ THE RULE, which `penalties-lede-open` already stated in another form:
     **a term a door offers to explain must appear on the page the door opens.**
     The label is a promise made in the reader\'s vocabulary; the page may teach it
     in plainer words -- Kevin\'s own ruling, *"we can use the explanatory wording
     on the learning page itself"* -- but it must at least NAME the thing, or the
     two surfaces are about different subjects.

     ⚠️ DERIVED FROM THE LABEL, NEVER FROM A LIST. A table of terms here would be
     a third spelling to keep in step; the label on the page is the promise, so
     the promise is parsed out of it. Doors that open a replay frame are skipped:
     `game.html` is a shell and its words arrive from the archive at runtime. */
  const labels = [...script.matchAll(/learnLink\('([a-z0-9]+)',\s*'([^']+)'/g)]
    .map(m => ({ key: m[1], label: m[2] }));
  assert.ok(labels.length >= 4, `only ${labels.length} labelled doors found on the card`);
  let checked = 0;
  for (const { key, label } of labels) {
    const term = /^What (?:an? )?(.+?) (?:is|means|costs)$/.exec(label);
    if (!term) continue;                       // "See an attempt being counted"
    const href = DOORS[key];
    assert.ok(href, `the "${label}" door has no destination at all`);
    if (!/^\/([a-z-]+)\.html$/.test(href)) continue;   // a replay frame explains itself
    checked++;
    const dest = readFileSync(
      new URL(`../src/${href.slice(1)}`, import.meta.url), 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.match(dest, new RegExp(term[1].replace(/\s+/g, '\\s+'), 'i'),
      `the door says "${label}" and opens ${href}, a page that never uses the words `
      + `"${term[1]}" -- a reader cannot tell they arrived in the right place`);
  }
  assert.ok(checked >= 3,
    `only ${checked} promises were checkable; the doors stopped opening lesson pages`);
});

test('⛔ the CF% row reaches the Control layer — now through the diagram', async () => {
  /* ⚠️⚠️ THIS TEST USED TO ASSERT THE OPPOSITE, AND ITS PREMISE WAS MINE AND IS
     NOW FALSE. It read: *"There is no Corsi rule page and there does not need to
     be: `control` is a door onto the exact frame where the Control layer counts
     an attempt. A diagram would explain the metric; the replay shows it
     happening."* `_preview_doors` made the same argument in a comment.

     ⭐ KEVIN REOPENED IT, 2026-10-04: *"let's brainstorm if we can figure out how
     to diagram the control rows … I'd like everything to be consistent, if at all
     possible."* The Control rows were the last doors on this card still opening a
     replay frame while the other six opened lessons. The answer was that a
     diagram of the RATIO is impossible and a diagram of the DEFINITION is not —
     what counts as an attempt — so `control.html` exists now and this row leads
     to it. The old test went red exactly as its own mutation note predicted,
     which is the only reason the argument got re-read instead of re-asserted.

     ⭐⭐ AND IT IS REPLACED RATHER THAN DELETED, because the half of it that was
     load-bearing survives the change: a reader who follows this row must still
     end up on the ice WITH THE CONTROL LAYER ON. That guarantee has simply moved
     one hop further out, so the test follows the whole chain instead of stopping
     at the first link — which makes it strictly stronger than what it replaces.
     The same move as the goaltender's net-fit rule in `render-board.test.js`: a
     rule whose premise expires is rewritten against the thing it was protecting.

     MUTATION: point the row anywhere else, or drop `layer=corsi` from the rule
     page's own door, and one of the two halves fires. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const rows = walk(ids.pv).filter(x => (x.className || '').split(' ').includes('pvm'));
  const cf = rows.find(r => /CF%/.test(textOf(r)));
  const door = walk(cf).find(x => (x.className || '').split(' ').includes('pvlearn'));
  assert.ok(door, 'the CF% row has no door at all');
  assert.equal(door.href, '/control.html',
    `the CF% row opens ${door.href} — the lesson behind it is what counts as an attempt`);

  /* ⛔ AND THE SECOND HOP IS READ OFF THE BUILT PAGE, not from the door table
     the first hop came from. Asserting both ends against one document is the
     circularity this project keeps catching: `learn-doors.json` writes the href
     AND would be the thing under test. The page on disk is what a reader gets. */
  const page = readFileSync(new URL('../src/control.html', import.meta.url), 'utf8');
  const onward = [...page.matchAll(/href="(\/game\.html\?[^"]+)"/g)].map(m => m[1]);
  assert.equal(onward.length, 1,
    `control.html offers ${onward.length} ways into the replay — "then a real `
    + 'example" is one example, and two would need a sentence saying which is which');
  assert.match(onward[0], /layer=corsi/,
    `the diagram sends the reader to ${onward[0]}, which does not turn the Control `
    + 'layer on — the page explains what an attempt is and then shows one being missed');
});

/* ---------------------------------------------- THE FRAME KEVIN ASKED TO GROW */

test('⭐ the attempt partition is a stacked bar, and its three parts sum to the whole', async () => {
  /* The one figure on this card that can honestly be a stacked bar: three shares
     of one defined whole. `byType` sums to the attempt total exactly, which is
     what makes the bar a partition rather than three numbers side by side.
     MUTATION: drop a part and the widths stop reaching 100. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  // ⚠️ `svgEl` sets class with setAttribute, so it lands in attrs, not className —
  // the same split that made the first version of this check find nothing.
  const bar = walk(ids.pv).find(x => (x.attrs && x.attrs.class) === 'pvmix');
  assert.ok(bar, 'no stacked bar was drawn');
  const w = walk(bar).filter(x => x.tag === 'rect').map(r => Number(r.attrs.width));
  assert.equal(w.length, 3, 'reached the goalie, blocked, missed');
  assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 100) < 0.01,
    `a partition must fill the bar, got ${w.reduce((a, b) => a + b, 0)}`);
  // 215,529 + 25,597 of 500,720 = 48.2%, and the first rect must be that share.
  assert.ok(Math.abs(w[0] - 48.16) < 0.05, `the goalie share is wrong: ${w[0]}`);
  /* ⛔⛔⛔ THIS ASSERTION WAS BEING SATISFIED BY A DIFFERENT TILE ENTIRELY, and
     removing the hits tile is what exposed it. It read `match(textOf(ids.pv),
     /48 of every 100/)` over the WHOLE card, and the string it matched was the
     hits tile's *"has the puck less in 48 of every 100 games"* — one text node,
     single-spaced. The attempts tile renders its own figure as a `<p>` plus a
     `<span>`, which `textOf` joins with a space, so "48  of every 100" never
     matched and never had to. Both figures are 48 by coincidence this week.
     ⭐ THE SHAPE: a whole-page regex in a test named for one tile. Scoped to the
     tile that owns the bar, and tolerant of the split the renderer actually
     makes, it can only pass for the right reason. */
  const tile = walk(ids.pv).find(x => (x.className || '').split(' ').includes('pvtile')
    && walk(x).some(y => (y.attrs && y.attrs.class) === 'pvmix'));
  assert.ok(tile, 'the stacked bar is not inside a tile');
  assert.match(textOf(tile), /48\s+of every 100\s+shot attempts reach the goalie/);
});

test('⛔⛔ the hits row is off the CARD and still in the MODULE', async () => {
  /* ⚠️ THIS TEST HAS CHANGED SUBJECT, AND SAYING SO IS THE POINT. It used to
     assert that the hits tile printed its measured NULL together with the
     +4% home-rink premium — *a figure we KNOW is scorer-dependent may not be
     printed as though it were clean*. Kevin took the tile off the card on
     2026-10-07 to make room for the per-player block, so that assertion has no
     subject here any more.

     ⭐⭐ WHAT IT GUARDS NOW IS THE REAL RISK OF THAT CHANGE. `leagueRows()` is
     SHARED: the replay's `Is that a lot?` overlay draws four of its rows. The
     obvious way to drop a tile would have been to stop producing the row — and
     that would have silently stripped it from a surface nobody was looking at,
     which is this project's most expensive recurring defect. The card filters;
     the module still answers. Both halves are asserted, so neither can rot.

     ⏭ AND THE PREMIUM RULE NEEDS A HOME ON WHATEVER SURFACE STILL PRINTS HITS.
     It is not this one. Not asserted here rather than asserted weakly: a check
     aimed at a figure this page no longer draws would pass forever and protect
     nothing. */
  const { ids, settle } = run({}, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const said = textOf(ids.pv);
  assert.ok(!/hits a team lands/.test(said), 'the card still draws the hits tile');
  assert.ok(!/4% more hits/.test(said), 'and so its premium has nothing to qualify');

  // THE MODULE, ASKED DIRECTLY — the half the page cannot show.
  const rows = leagueRows(DOCS['measures.json']);
  const hits = rows.filter(r => r.key === 'hits');
  assert.equal(hits.length, 1,
    'leagueRows no longer produces a hits row — the replay overlay reads these too');
  assert.ok(hits[0].perClubGame > 0, 'the row is produced but carries no figure');
});

test('a census missing a counter drops that tile rather than drawing a figure from nothing', async () => {
  /* ⚠️ THIS USED TO BE AIMED AT THE SHIFT TILE, which came off the card on
     2026-10-07. The RULE it protects did not come off with it: a measures
     document written before a counter existed must leave the tile out, never
     print a number derived from an absent field. Re-pointed at a tile the card
     still draws, so it keeps a live subject.

     ⭐ THE ICING ROW IS THE RIGHT SUBJECT because `leagueRows()` already makes it
     conditional — `w.icings ? [...] : []` — and the published fixture carries no
     `icings` at all, which is itself the degradation in the wild. So the test
     ADDS the counter, proves the tile appears, then takes it away and proves it
     does not. Both halves, or "it is missing" proves nothing about why. */
  const base = DOCS['measures.json'];
  const withIcings = { ...base,
    census: { ...base.census, whistles: { ...base.census.whistles, icings: 35500 } } };

  const on = run({ 'measures.json': withIcings }, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await on.settle();
  assert.match(textOf(on.ids.pv), /times a team ices the puck/,
    'with the counter present the tile must draw, or the half below proves nothing');

  const off = run({ 'measures.json': base }, `?game=${GID}`, '2026-10-01T12:00:00Z');
  await off.settle();
  const said = textOf(off.ids.pv);
  assert.ok(!/times a team ices the puck/.test(said), said.slice(0, 200));
  assert.match(said, /times a team is offside/, 'the rest of the frame still draws');
});
