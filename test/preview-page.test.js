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

const html = readFileSync(new URL('../src/preview.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const PAGE_IDS = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

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
  'measures.json': { census: { games: 4192,
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
  const { ids, settle } = run({ 'teams.json': { through: '2026-09-18', seasons: {} } });
  await settle();
  const said = textOf(ids.pv);
  assert.match(said, /No games counted yet this season/, 'the subject must be on the page');
  assert.match(said, /the regular season starts 29 September 2026/);

  const moved = run({ 'teams.json': { through: '2026-09-18', seasons: {} },
    'schedule.json': { ...DOCS['schedule.json'],
      season: { regularSeasonStartDate: '2026-10-07' } } });
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
  assert.match(said, /power plays produce a goal/, 'the power-play tile');
  assert.match(said, /penalties a team takes/, 'the penalties tile');
  assert.match(said, /times a team is offside/, 'the offside tile');
  assert.match(said, /5-on-5 CF% while the score was level/, 'a club row');
  assert.match(said, /12 of 35 games/, 'the progress, not a badge');
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
  assert.match(said, /Shaded: what clubs did over a full season, 44 to 57 across 96 club-seasons/);
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
  assert.match(textOf(ids.pv), /settled/);
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
  // level5's fixture range is .44–.57, dmen's is .26–.38 — the labels are the
  // axis's own endpoints, so they differ per row and cannot be typed once.
  assert.deepEqual(ends.map(e => textOf(e)), ['44 57', '26 38']);
});
