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
  const doc = { title: '', createElement: make,
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
      rows: { level5: { r: 0.73, games: 35 }, dmen: { r: 0.81, games: 23 },
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
  assert.match(said, /Power play/);
  assert.match(said, /5-on-5 CF% while the score was level/, 'a club row');
  assert.match(said, /12 of 35 games/, 'the progress, not a badge');
  assert.match(said, /Every Buffalo Sabres game we hold/);
  assert.match(ids.pvh1.textContent, /Buffalo Sabres at Pittsburgh Penguins/);
});

test('a census with no whistle counters drops the frame rather than inventing one', async () => {
  const { ids, settle } = run({ 'measures.json': { census: { games: 4192 } } },
    `?game=${GID}`, '2026-10-01T12:00:00Z');
  await settle();
  const said = textOf(ids.pv);
  assert.ok(!/What is normal/.test(said), said.slice(0, 200));
  assert.match(said, /Every Buffalo Sabres game we hold/, 'the rest of the page still renders');
});
