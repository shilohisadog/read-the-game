/**
 * The calendar page, RUN — not grepped.
 *
 * Nothing on this page is in the markup: the month, the cells, the counts and
 * every sentence are rendered from a catalog fetched at load time. So these
 * tests execute the real inlined script against a fake document and read what
 * it rendered, exactly as test/homepage.test.js does and for the same reason —
 * grepping the built HTML for "February" would prove nothing, there is none in
 * it.
 *
 * The arithmetic underneath lives in src/lib/calendar.js and is tested in
 * test/calendar.test.js. What is tested HERE is the part that only exists on
 * the page: which sentence appears, and whether a disclosure can go missing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../src/calendar.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const PAGE_IDS = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

/** The one table, read from the file derive.py reads. Never re-typed. */
const NAMES = JSON.parse(
  readFileSync(new URL('../data/competitions.json', import.meta.url))).names;

/* The same fake as homepage.test.js, and the same reasons for its two refusals:
   it answers only for ids the built page actually carries, so a reference to a
   deleted element is a null here exactly as it is in a browser. */
function fakeDom() {
  const make = (tag) => ({
    tag, className: '', href: '', textContent: '', style: {}, attrs: {}, kids: [],
    hidden: false,
    appendChild(n) { this.kids.push(n); return n; },
    setAttribute(k, v) { this.attrs[k] = v; },
  });
  const ids = {};
  return { ids, document: {
    createElement: make,
    getElementById(id) {
      if (!PAGE_IDS.has(id)) return null;
      return (ids[id] = ids[id] || make('div#' + id));
    },
  } };
}

function walk(node, out = []) {
  if (!node) return out;
  out.push(node);
  node.kids.forEach(k => walk(k, out));
  return out;
}
/** Everything a SIGHTED reader sees, in document order. */
const textOf = n => walk(n).map(x => x.textContent).filter(Boolean).join(' ');
/** Everything a screen reader is told, which is a different set of strings. */
const spokenOf = n => walk(n).map(x => x.attrs['aria-label']).filter(Boolean).join(' ');
const linksOf = n => walk(n).filter(x => x.href).map(x => x.href);
const withClass = (n, c) => walk(n).filter(x => (x.className || '').split(' ').includes(c));

/**
 * A catalog row in the shape the browser receives.
 *
 * `t` IS DERIVED FROM THE ID, not passed in, because that is how the archive
 * really is: 0 of 4,553 live rows have a `t` that disagrees with characters 4-6
 * of the id (checked 2026-08-21). A fixture free to contradict it would let a
 * test pass on a game that cannot exist.
 */
const row = (id, d, extra = {}) => ({
  id, d, a: 'BUF', h: 'TOR', as: 2, hs: 3, ash: 28, hsh: 31,
  t: Number(String(id).slice(4, 6)), v: 1, ...extra,
});
const NHL = (n, d, extra) => row(2025020000 + n, d, extra);
const PRE = (n, d, extra) => row(2025010000 + n, d, extra);
const OLY = (n, d, extra) => row(2025090000 + n, d, extra);

function run(games, search = '') {
  const { ids, document } = fakeDom();
  const fetch = url => Promise.resolve(url.includes('catalog.json')
    ? { ok: true, json: () => Promise.resolve({ games }) }
    : { ok: false, json: () => Promise.resolve(null) });
  new Function('document', 'fetch', 'location', script)(
    document, fetch, { search, origin: 'https://readthegame.co' });
  return { ids, settle: () => new Promise(r => setTimeout(r, 0)) };
}

/* A month that holds every shape at once: NHL nights, an out-of-scope night,
   a mixed night, a refused game and a night nothing can be shown on. */
const MONTH = [
  NHL(1, '2026-02-02'), NHL(2, '2026-02-02'), NHL(3, '2026-02-03'),
  // 4 February holds one shown and one refused, which is the case 24 nights in
  // the live archive are in — and a different case from a night nothing can be
  // shown on. The first draft of this fixture had only the refused one, so the
  // test named "inside a LIVE night" was measuring a dead one.
  NHL(4, '2026-02-04', { v: 0, r: 'validation' }), NHL(12, '2026-02-04'),
  OLY(5, '2026-02-11'), OLY(6, '2026-02-11'), OLY(7, '2026-02-11'),
  OLY(8, '2026-02-12', { v: 0, r: 'validation' }),
  OLY(9, '2026-02-12', { v: 0, r: 'vocabulary' }),
  NHL(10, '2026-02-13'), OLY(11, '2026-02-13'),
];

test('a month renders a cell per night, and the two counts are never added', async () => {
  const { ids, settle } = run(MONTH, '?month=2026-02');
  await settle();
  const cells = withClass(ids.main, 'cell').filter(c => c.href);
  // 13 February holds one of each. THE CELL MUST NOT SAY 2.
  const mixed = cells.find(c => c.href === '?date=2026-02-13');
  const numbers = walk(mixed).map(x => x.textContent).filter(t => /^\d+$/.test(t));
  assert.deepEqual(numbers, ['13', '1', '1'],
    'the day, the NHL count and the uncounted count — three separate marks');
  assert.ok(!numbers.includes('2'), 'the two counts were summed');
});

test('⭐ an out-of-scope group is ALWAYS labelled, even when it is the whole night', async () => {
  // THE DEFECT THIS CATCHES SHIPPED IN THE FIRST DRAFT AND IS THE WORST KIND:
  // the heading rendered only when a night held more than one group, which is
  // fine for the "NHL" label and wrong for this one, because this one is a
  // DISCLOSURE. 60 of the 62 out-of-scope dates in the archive hold nothing
  // else, so the sentence went missing on exactly the dates that need it.
  const { ids, settle } = run(MONTH, '?date=2026-02-11');
  await settle();
  const said = textOf(ids.main);
  assert.match(said, /Olympics/);
  assert.match(said, /not counted in any number here/);
});

test('an NHL-only night carries no group heading, because it names nothing', async () => {
  // The other half of the rule, and without it the test above is satisfied by
  // a page that labels everything — which would put "NHL" over every list on
  // the site for no reader's benefit.
  const { ids, settle } = run(MONTH, '?date=2026-02-03');
  await settle();
  assert.equal(withClass(ids.main, 'gk').length, 0);
});

test('a night where nothing can be shown is a STATE, and offers no dead rows', async () => {
  const { ids, settle } = run(MONTH, '?date=2026-02-12');
  await settle();
  assert.equal(withClass(ids.main, 'dead').length, 1);
  assert.equal(walk(ids.main).filter(n => n.tag === 'li').length, 0,
    'a list of rows nobody can click is a dead end wearing a working list’s clothes');
  assert.equal(linksOf(ids.main).filter(h => h.includes('game.html')).length, 0);
  // Both gates on that night are named — one sentence per REASON, not per game.
  const said = textOf(ids.main);
  assert.match(said, /did not pass/);
  assert.match(said, /have not read yet/);
});

test('a refused game inside a live night is listed with its reason, never hidden', async () => {
  // Doctrine 9. The team page already refuses to be a map of our successes and
  // this is the same archive seen from the other axis.
  const { ids, settle } = run(MONTH, '?date=2026-02-04');
  await settle();
  const said = textOf(ids.main);
  assert.match(said, /Cannot be shown/);
  // The playable one is still playable — a refusal beside it must not make the
  // whole night unreachable, which is what the dead STATE would have done.
  assert.equal(linksOf(ids.main).filter(h => h.includes('game.html')).length, 1);
  assert.equal(withClass(ids.main, 'dead').length, 0);
  assert.equal(withClass(ids.main, 'uncounted').length, 0,
    'these are NHL games; the uncounted mark belongs only to what is out of scope');
});

test('⭐ a name from the table is never inflected, for EVERY name in it', async () => {
  // WHY THIS IS AN INVARIANT AND NOT A DISCLAIMER. The names are DISPLAY names:
  // "Olympics", "playoffs", "4 Nations". `plural(n, name + ' game')` printed
  // "4 Olympics games" and would print "3 playoffs games"; an article gives "in
  // the preseason" against "in the Olympics". Every one of those is a sentence
  // someone writes because it reads fine for the name in front of them.
  //
  // So the rule is uniform and mechanical: no name from that table is ever
  // immediately followed by " game". It holds for "preseason games" too, which
  // WOULD read fine — and that is the point, because a rule that is right for
  // some names by luck is the one that breaks on the name the league mints next.
  for (const [type, name] of Object.entries(NAMES)) {
    const id = Number(`2025${String(type).padStart(2, '0')}0001`);
    const games = [row(id, '2026-02-11'), row(id + 1, '2026-02-11', { v: 0, r: 'validation' })];
    for (const search of ['?month=2026-02', '?date=2026-02-11']) {
      const { ids, settle } = run(games, search);
      await settle();
      const said = textOf(ids.main) + ' ' + spokenOf(ids.main);
      assert.ok(!new RegExp(name + ' games?\\b', 'i').test(said),
        `"${name}" was inflected on ${search}: ${said.slice(0, 200)}`);
    }
  }
});

test('the screen reader is told what the dashed box means, since it cannot see it', async () => {
  // The two counts are distinguished VISUALLY by a dashed border, which is
  // nothing at all to a reader who is not looking. Same finding as the arrows:
  // the fix for something the eye resolves is not always more contrast.
  const { ids, settle } = run(MONTH, '?month=2026-02');
  await settle();
  const spoken = withClass(ids.main, 'cell').map(c => c.attrs['aria-label']).filter(Boolean);
  const mixed = spoken.find(s => /13 February/.test(s));
  assert.match(mixed, /1 NHL game/);
  assert.match(mixed, /not counted here: Olympics/);
});

test('⭐ no percentage reaches this page, because a date selects on no outcome', async () => {
  // docs/discovery.md §10.3, as an invariant rather than a sentence in a doc.
  // The base-rate requirement attaches to selection on an OUTCOME, not to
  // selection — so a rate here would be a comparison the reader did not ask
  // for, which is the C7 defect. The boundary is real and named: if a cell or a
  // row ever surfaces an outcome marker, this test is what has to be argued
  // with first.
  for (const search of ['?month=2026-02', '?date=2026-02-13', '?date=2026-02-12', '']) {
    const { ids, settle } = run(MONTH, search);
    await settle();
    assert.ok(!/%/.test(textOf(ids.main)), `a percentage appeared on ${search || 'the default'}`);
  }
});

test('a month we hold nothing for is said out loud, not silently swapped', async () => {
  const { ids, settle } = run(MONTH, '?month=2030-01');
  await settle();
  const said = textOf(ids.main);
  assert.match(said, /We hold nothing for January 2030/);
  assert.match(said, /February 2026/, 'and it says which month it is showing instead');
});

test('a date with no games says so, rather than rendering an empty list', async () => {
  const { ids, settle } = run(MONTH, '?date=2026-02-19');
  await settle();
  assert.match(textOf(ids.main), /No games in the archive on this date/);
  assert.equal(withClass(ids.main, 'dead').length, 0,
    '"nothing happened" and "nothing can be shown" are different statements');
});

test('the default month is the most recent one we hold, never a typed date', async () => {
  const later = [...MONTH, NHL(20, '2026-04-08')];
  const { ids, settle } = run(later, '');
  await settle();
  assert.match(textOf(ids.main), /April 2026/);
});

test('an unreachable archive is a stated condition, not an empty calendar', async () => {
  const { ids, settle } = run([], '');
  await settle();
  assert.match(textOf(ids.main), /could not be loaded/);
  assert.equal(withClass(ids.main, 'cell').length, 0);
});

test('the offseason is walked, and the empty month says so before the grid', async () => {
  const spread = [...MONTH, NHL(30, '2026-10-08')];
  const { ids, settle } = run(spread, '?month=2026-07');
  await settle();
  const shown = walk(ids.main).filter(n => n.textContent || n.className === 'cal');
  const note = shown.findIndex(n => /No games in the archive this month/.test(n.textContent));
  const grid = shown.findIndex(n => n.className === 'cal');
  assert.ok(note !== -1 && grid !== -1);
  assert.ok(note < grid, 'told after 31 blank boxes is told too late on a phone');
});

/* ─────────────────────────────────────────────────────────────────────────
   D10 — the disclosure that had a field, a purpose, and no reader.
   ───────────────────────────────────────────────────────────────────────── */

test('A NIGHT MARKS THE GAMES THE LEAGUE DISAGREES WITH ITSELF ABOUT', async () => {
  // ⭐ `derive.py` writes `u: 1` onto a catalog row when the league's play-by-play
  // and the league's own boxscore disagree about shots on goal — 73 live rows —
  // and its comment says exactly why the flag exists:
  //
  //   "`u` so a LIST can mark it without opening the extract. The calendar and
  //    the team page both show many games at once and neither fetches an extract
  //    to draw a row; WITHOUT THIS THE DISCLOSURE WOULD EXIST ONLY ON THE PAGE
  //    YOU ALREADY COMMITTED TO OPENING."
  //
  // That sentence was TRUE. The flag was populated, correct, and read by exactly
  // one thing in the repo — health.mjs, counting it for the build list. The
  // reader it was created for was never written.
  //
  // AND IT IS NOT COSMETIC, because `ash`/`hsh` are the BOXSCORE's numbers while
  // the game page replays the EVENT LOG. Measured on four of the 73: the list
  // said 31–36 and the page said 31–37; 38–32 against 39–32; 31–32 against
  // 31–33; 34–24 against 34–25. Two figures that look like one claim, which is
  // C7's defect already shipped.
  const games = [NHL(1, '2026-02-02'), NHL(2, '2026-02-02', { u: 1 })];
  const { ids, settle } = run(games, '?date=2026-02-02');
  await settle();
  const marked = walk(ids.main).filter(x => /shots\*/.test(x.textContent || ''));
  assert.equal(marked.length, 1, 'exactly the disputed row carries the mark');
  const text = textOf(ids.main);
  assert.match(text, /event log and boxscore disagree/i, 'the mark means nothing alone');
  assert.match(text, /marked \* is the boxscore's/i,
    'a reader cannot tell WHICH of the two numbers is on screen');
  // ⭐ AND THE NOTE COMES FIRST, which is a MEASUREMENT and not a preference:
  // under an 82-row team page the note rendered at y=7401 on a 390px phone,
  // seven thousand pixels below the mark it explains. Same defect as D9's
  // y=1222, one page over. The wording names the mark rather than pointing at
  // a neighbour, so it stays true wherever it sits.
  const order = walk(ids.main).map(x => x.textContent || '');
  const noteAt = order.findIndex(t => /disagree about the shot count/.test(t));
  const markAt = order.findIndex(t => /shots\*/.test(t));
  assert.ok(noteAt !== -1 && markAt !== -1, 'both the note and the mark must render');
  assert.ok(noteAt < markAt,
    'the explanation renders after the mark it explains — a reader has to '
    + 'scroll an unbounded distance to find out what the asterisk means');
});

test('and a night with no disagreement says nothing at all', async () => {
  // MUTATION GUARD, and the verdict card's rule: a sentence that renders on
  // every night is a sentence a reader learns to skip, and then the one night
  // it matters goes past unread.
  const { ids, settle } = run([NHL(1, '2026-02-02'), NHL(2, '2026-02-02')],
                              '?date=2026-02-02');
  await settle();
  const text = textOf(ids.main);
  assert.doesNotMatch(text, /disagree/i);
  assert.doesNotMatch(text, /shots\*/);
});

test('a refused row is never counted as disputed', async () => {
  // A game we do not show cannot mislead anybody about its shot count, and
  // counting it would put "in 1 game here" above a list where no such figure
  // appears — a note whose antecedent is not on the page.
  const games = [NHL(1, '2026-02-02'),
                 NHL(2, '2026-02-02', { u: 1, v: 0, r: 'validation' })];
  const { ids, settle } = run(games, '?date=2026-02-02');
  await settle();
  assert.doesNotMatch(textOf(ids.main), /disagree/i);
});

test('THE COUNT IN THE NOTE IS THE COUNT ON THE PAGE', async () => {
  // ⭐ The note says "in N games here". If N were computed over anything but the
  // rows actually rendered, it would be a figure describing a different
  // population than its sentence implies — which is D8, exactly, one layer down
  // and in prose instead of JSON.
  const games = [NHL(1, '2026-02-02', { u: 1 }), NHL(2, '2026-02-02', { u: 1 }),
                 NHL(3, '2026-02-02'), OLY(4, '2026-02-02', { u: 1 })];
  const { ids, settle } = run(games, '?date=2026-02-02');
  await settle();
  const marks = walk(ids.main).filter(x => /shots\*/.test(x.textContent || '')).length;
  assert.equal(marks, 3, 'the fixture must actually contain three of them');
  assert.match(textOf(ids.main), /In 3 games below/,
    'the note counted something other than what it is standing over');
});
