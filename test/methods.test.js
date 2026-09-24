/**
 * ⭐⭐⭐ THE GATE BEHIND KEVIN'S STANDING RULE: show the work, or do not print it.
 *
 * 2026-09-23: *"every metric and number needs to have an opportunity for a critic
 * to 'be shown the work' and the work needs to be squared away."* The failure
 * mode that rule has to survive is not disagreement, it is DRIFT — someone adds a
 * row to the card next spring, both pages render perfectly, and the new figure is
 * the one number on the site a reader cannot check. Nothing about the page looks
 * broken, so nothing catches it but this file.
 *
 * ⛔ SO THE ASSERTION IS THE WHOLE ROUND TRIP, NOT THE HALVES. It is not enough
 * that `methods.js` covers the keys and not enough that the page renders. This
 * runs the preview card's real inlined script, collects every href it wrote into
 * a work door, runs the methods page's real inlined script, collects every
 * section id it wrote, and requires the first set to resolve inside the second.
 * A test that checked either side alone would pass with the two pages disagreeing
 * about how the anchor is spelled — which is exactly the shape of dead link that
 * looks completely normal.
 *
 * ⚠️ AND IT ASSERTS THE PAGE CONCEDES. The arguments against our method are the
 * reason this page exists; a version that quietly dropped them would still render
 * every figure and still pass a coverage check.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { methods, keysOf, anchorOf, anchorFor, explains, EXPLAINED, EXPLAINED_ROWS,
         printed, PRINTED_KEYS, PRINTED } from '../src/lib/methods.js';
import { CLUB_ROWS, leagueRows } from '../src/lib/preview.js';

/* ------------------------------------------------------------------ FIXTURE */

/** A measures.json carrying EVERY counter, so `keysOf` reports the full set. */
const MEASURES = {
  attemptMix: { games: 4192, byType: { 'shot-on-goal': 215529, goal: 25597,
    'blocked-shot': 138880, 'missed-shot': 120714 } },
  /* ⭐ THE SLOT AND THE CENSUS RATES ARE HERE BECAUSE THE THIRD SECTION READS
     THEM. Shapes copied from the published document, `what` sentences included —
     a fixture that carried the numbers and not the sentences would exercise the
     degradation path and call it the happy one. */
  slot: {
    scoredFromInside: { count: 19304, n: 168910, rate: 0.11428571428571428,
      population: 'NHL regular season and playoffs',
      what: 'of the unblocked attempts taken from INSIDE the slot, this many were goals' },
    scoredFromOutside: { count: 6293, n: 192930, rate: 0.032618047996682734,
      population: 'NHL regular season and playoffs',
      what: 'of the unblocked attempts taken from OUTSIDE the slot, this many were goals' },
    attempts: { count: 168910, n: 361840, rate: 0.4668085341587442,
      population: 'NHL regular season and playoffs',
      what: 'of the unblocked shot attempts whose location the feed records, this '
          + 'many were taken from inside the slot' } },
  census: { games: 4192,
    pace: { what: 'shot attempts taken in one situation, out of the minutes played '
              + 'in that situation, scaled to sixty',
      even: { attempts: 406964, minutes: 416349.7, per60: 58.647 },
      ppFor: { attempts: 67517, minutes: 42615.7, per60: 95.059 },
      ppAgainst: { attempts: 9268, minutes: 42615.7, per60: 13.049 },
      evenTrail: { attempts: 140384, minutes: 132482.4, per60: 63.579 },
      evenTied: { attempts: 149096, minutes: 151384.9, per60: 59.093 },
      evenLead: { attempts: 117484, minutes: 132482.4, per60: 53.207 } },
    endZone: { what: 'shot attempts taken before the next whistle after an '
                 + 'end-zone face-off, out of every end-zone face-off',
      atk: 235614, def: 126603, n: 165420, atkPerDraw: 1.424, defPerDraw: 0.765 },
    shift: { n: 3101105, median: 46, p25: 34, p75: 59, underMinute: 0.759 },
    hits: { n: 4192, r: -0.07, opposite: 0.481, totalHits: 188512 },
    whistles: { penalties: 30827, offsides: 18700, icings: 35930,
                ppChances: 22872, ppGoals: 4982, shGoals: 560 } },
  settle: { target: 0.7, admission: 41, probes: [0.6, 0.8], half: 41,
    seasons: ['2023', '2024', '2025'],
    rows: {
      level5: { r: 0.735, games: 35, clubSeasons: 96,
        clubRange: { min: 0.428, max: 0.617, median: 0.497, n: 96, games: 7872 },
        alternate: { r: 0.86, games: 14, clubSeasons: 96 },
        atTarget: [{ target: 0.6, games: 23 }, { target: 0.8, games: 60 }] },
      dmen: { r: 0.806, games: 23, clubSeasons: 96,
        clubRange: { min: 0.249, max: 0.389, median: 0.324, n: 96, games: 7872 },
        alternate: { r: 0.90, games: 12, clubSeasons: 96 },
        atTarget: [{ target: 0.6, games: 15 }, { target: 0.8, games: 39 }] },
      slot: { r: 0.720, games: 38, clubSeasons: 96,
        clubRange: { min: 0.413, max: 0.546, median: 0.470, n: 96, games: 7872 },
        alternate: { r: 0.79, games: 25, clubSeasons: 96 },
        atTarget: [{ target: 0.6, games: 25 }, { target: 0.8, games: 65 }] } },
    family: { clubSeasons: 96, pairs: [
      { a: 'level5', b: 'corsi', r: 0.95, n: 96 },
      { a: 'level5', b: 'fenwick', r: 0.90, n: 96 },
      { a: 'level5', b: 'sog', r: 0.85, n: 96 },
      { a: 'corsi', b: 'fenwick', r: 0.96, n: 96 },
      { a: 'corsi', b: 'sog', r: 0.91, n: 96 },
      { a: 'fenwick', b: 'sog', r: 0.97, n: 96 }] } },
};

/* ------------------------------------------- THE LIST AND THE LIST ARE ONE LIST */

test('⛔⛔⛔ every figure the card can draw is explained, and nothing else is', () => {
  /* THE DEFECT THIS PREVENTS, which was live until today: a figure with no door
     to its derivation. Kevin's rule is not "most figures"; a reader who finds one
     naked number has learned that the site's pitch is decorative.
     ⚠️ AND THE OTHER DIRECTION MATTERS TOO. An explanation for a figure the card
     no longer draws is a section a reader can reach from nowhere, describing a
     number they will never see — the stale-claim defect on the one page whose job
     is to be checked.
     MUTATION: add a CLUB_ROW or a league counter without a DERIVATION entry and
     the first assertion names it. */
  const drawn = keysOf(MEASURES);
  assert.ok(drawn.length >= 8,
    `only ${drawn.length} figures reported — the fixture is not a full document, so neither `
    + 'direction below proves anything');
  assert.deepEqual([...drawn].sort().filter(k => !explains(k)), [],
    'a figure is drawn on the card with no derivation DECLARED for it in EXPLAINS');
  assert.deepEqual(EXPLAINED_ROWS.filter(k => !drawn.includes(k)), [],
    'EXPLAINS declares a derivation for a row the card cannot draw');
  assert.equal(drawn.length, new Set(drawn).size, 'a key is drawn twice');

  /* ⭐⭐ AND THE MAP MUST LAND. A declared mapping to a derivation that does not
     exist is worse than the string matching it replaced: the spread yields
     `undefined`, every field goes missing, and the section renders empty rather
     than absent — which the door-resolves test below would still pass, because
     the id is written from the same map.
     MUTATION: point any EXPLAINS value at a name DERIVATION does not carry. */
  const unresolved = EXPLAINED_ROWS.map(explains).filter(d => !EXPLAINED.includes(d));
  assert.deepEqual(unresolved, [],
    'EXPLAINS points a row at a derivation that does not exist');
});

test('⛔ no figure reaches the page without a caveat, and none of them is filler', () => {
  /* ⚠️ THE FIELD EXISTS TO BE UNCOMFORTABLE. Kevin: the work has to be squared
     away, which means the known weaknesses are printed in the same block as the
     number rather than conceded in a repo file nobody opens. An empty `caveat`
     renders a block that reads as though nothing is wrong with the figure.
     MUTATION: blank any `caveat` and this fires; write "None" and the length
     check does. */
  const m = methods(MEASURES);
  for (const f of [...m.club, ...m.league]) {
    /* ⚠️ THE NUMERATOR AND DENOMINATOR ARE ALLOWED TO BE SHORT. "power plays" is
       the whole truth about what the power-play tile divides by, and demanding a
       longer sentence would buy padding. What may NOT be short is the reasoning
       and the concession, which are the two fields a reader came for. */
    for (const field of ['label', 'count', 'of']) {
      assert.equal(typeof f[field], 'string', `${f.key}.${field} is missing`);
      assert.ok(f[field].trim().length > 4, `${f.key}.${field} says nothing: ${f[field]}`);
    }
    for (const field of ['why', 'caveat']) {
      assert.equal(typeof f[field], 'string', `${f.key}.${field} is missing`);
      assert.ok(f[field].trim().length > 60 && /[a-z]{4}/.test(f[field]),
        `${f.key}.${field} is a placeholder: ${f[field]}`);
    }
  }
});

test('the methods page names each club row exactly as the card names it', () => {
  /* Two names for one row is a reader who cannot match the explanation to the
     figure. The card's label wins, and it is applied AFTER the derivation spread
     for that reason.
     MUTATION: move `label: r.label` above the spread and the club rows take the
     methods page's own wording, which this catches. */
  const m = methods(MEASURES);
  for (const r of CLUB_ROWS) {
    assert.equal(m.club.find(c => c.key === r.key).label, r.label);
  }
});

test('⛔ the admission rule is shown being APPLIED, not asserted', () => {
  /* A reader checking our work needs the rule and the number in the same place,
     so `admitted` is recomputed from the published figures rather than inferred
     from the row being present. A row that is on the card BECAUSE it passed, and
     also says it passed because it is on the card, has proved nothing.
     MUTATION: set `admitted: true` and the second assertion fires. */
  const m = methods(MEASURES);
  assert.ok(m.club.every(c => c.admitted), 'every shown row must clear the rule');
  const over = JSON.parse(JSON.stringify(MEASURES));
  over.settle.rows.slot.games = 42;                  // above the 41-game rule
  assert.equal(methods(over).club.find(c => c.key === 'slot').admitted, false,
    'a row needing more than half a season was still reported as admitted');
});

test('⭐⭐ the possession family is quantified, and it includes the row it explains', () => {
  /* Kevin's condition for showing it once: *"as long as we quantify what
     'possession family' means (so a novice can connect the dots)."* The number
     that does that is the WEAKEST pair — if even the least similar two agree
     that strongly, the case for one row is made.
     MUTATION: report `min` over the signed r rather than the absolute and a
     future family member that runs the other way collapses the headline to a
     negative number the sentence around it cannot survive. */
  const f = methods(MEASURES).family;
  assert.equal(f.pairs.length, 6, 'four members make six pairs');
  assert.ok(f.members.some(m => m.shown && m.key === 'level5'),
    'the family must contain the row the card actually prints');
  assert.equal(f.members.filter(m => !m.shown).length, 3, 'three are withheld');
  assert.ok(Math.abs(f.min - 0.85) < 1e-9, `min must be the weakest pair, got ${f.min}`);
  assert.ok(Math.abs(f.max - 0.97) < 1e-9, `max must be the strongest pair, got ${f.max}`);

  const signed = JSON.parse(JSON.stringify(MEASURES));
  signed.settle.family.pairs[0].r = -0.95;
  assert.ok(methods(signed).family.min > 0.5,
    'a measure running the other way is no less the same measurement');
});

test('⛔ a document that predates these fields degrades — it does not throw or invent', () => {
  /* The published document in the bucket right now has no `family`, no
     `alternate` and no `atTarget`, because the run that produces them has not
     happened yet. Every other surface on this site degrades row by row rather
     than failing whole, and the page a critic lands on may not be the exception.
     MUTATION: read `s.family.pairs` without the guard and this throws. */
  const bare = { census: { games: 10 }, settle: { target: 0.7, admission: 41,
    seasons: ['2023'], rows: { level5: { r: 0.7, games: 30, clubSeasons: 96 } } } };
  const m = methods(bare);
  assert.equal(m.family, null, 'no family figure must be invented');
  assert.equal(m.club.find(c => c.key === 'level5').alternate, null);
  assert.equal(m.club.find(c => c.key === 'dmen').games, null, 'an unmeasured row claims nothing');
  assert.deepEqual(methods({}).club.map(c => c.games), [null, null, null]);
  assert.equal(methods(null).policy, null);
  assert.deepEqual(methods(null).league, [], 'no census, no league frame');
});

/* ----------------------------------------------- THE PAGES, RUN AND COMPARED */

/** The harness of `preview-page.test.js`: nothing on either page is in markup. */
function pageOf(name) {
  const html = readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
  return { html, script: html.match(/<script>([\s\S]*?)<\/script>/)[1],
           ids: new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1])) };
}

function fakeDom(pageIds) {
  const make = tag => ({
    tag, className: '', href: '', id: '', textContent: '', attrs: {}, kids: [],
    appendChild(n) { this.kids.push(n); return n; },
    setAttribute(k, v) { this.attrs[k] = v; },
  });
  const ids = {};
  const doc = { title: '', createElement: make, createElementNS: (_n, t) => make(t),
    getElementById(id) {
      if (!pageIds.has(id)) return null;
      return (ids[id] = ids[id] || make('div#' + id));
    } };
  return { ids, document: doc };
}
const walk = (n, out = []) => { if (n) { out.push(n); n.kids.forEach(k => walk(k, out)); } return out; };

function render(name, docs, search = '') {
  const page = pageOf(name);
  const { ids, document } = fakeDom(page.ids);
  const fetch = url => {
    const key = url.split('/').pop();
    const body = Object.prototype.hasOwnProperty.call(docs, key) ? docs[key] : null;
    return Promise.resolve(body == null ? { ok: false, json: () => Promise.resolve(null) }
                                        : { ok: true, json: () => Promise.resolve(body) });
  };
  new Function('document', 'fetch', 'location', 'Date', page.script)(
    document, fetch, { search, origin: 'https://readthegame.co' }, Date);
  return { ids, page, settle: () => new Promise(r => setTimeout(r, 0)) };
}

const GID = 2026020100;
const CARD_DOCS = {
  'schedule.json': { asOf: '2026-10-01T12:00:00Z',
    upcoming: [{ id: GID, date: '2026-10-02', gameType: 2, away: 'BUF', home: 'PIT',
                 startTimeUTC: '2026-10-03T00:00:00Z' }],
    season: { regularSeasonStartDate: '2026-09-29' } },
  'teams.json': { through: '2026-10-01', seasons: { 2026: {
    BUF: { games: 12, slot: { count: 140, n: 300 }, dmen: { count: 190, n: 600 },
           level5: { for: 240, against: 230 } },
    PIT: { games: 11, slot: { count: 130, n: 290 }, dmen: { count: 180, n: 580 },
           level5: { for: 230, against: 235 } } } } },
  'measures.json': MEASURES,
  'recent.json': { asOf: '2026-10-01T12:00:00Z', games: [] },
  'catalog.json': { games: [] },
};

test('⛔⛔⛔ EVERY WORK DOOR THE CARD WRITES LANDS ON A SECTION THAT EXISTS', async () => {
  /* THE GATE. Both pages are rendered for real and their output compared; nothing
     here trusts a constant. On 23 September 2026 the card had ten figures and
     zero work doors, and the reason the gap survived a green suite is that every
     check asked a narrower question than the rule does.

     MUTATION: change `anchorOf` to return the bare key and the methods page's ids
     move with it, so this still passes — correctly, because the two sides agreed.
     Spell the href by hand in the card instead (`'#m-' + key`) and a later change
     to `anchorOf` breaks this immediately, which is the point. */
  const card = render('preview.html', CARD_DOCS, `?game=${GID}`);
  await card.settle();
  const rendered = walk(card.ids.pv);
  const doors = rendered.filter(n => n.className === 'pvwork').map(n => n.href);
  assert.ok(doors.length >= 10, `the card drew only ${doors.length} work doors`);

  const page = render('how-we-measure.html', { 'measures.json': MEASURES });
  await page.settle();
  const sections = new Set(walk(page.ids.hm).map(n => n.id).filter(Boolean));

  for (const href of doors) {
    const [path, frag] = href.split('#');
    assert.equal(path, '/how-we-measure.html', `a work door points at ${path}`);
    assert.ok(sections.has(frag),
      `the card links to #${frag} and the methods page has no such section `
      + `(it has ${[...sections].join(', ')})`);
  }

  /* AND THE OTHER DIRECTION: every figure the card drew got a door, not most of
     them. Counting doors alone would pass a card that drew twelve figures and
     doored ten. */
  const figures = rendered.filter(n => n.className === 'pvtile' || n.className === 'pvm');
  assert.equal(doors.length, figures.length,
    `${figures.length} figures on the card, ${doors.length} of them with a door to the work`);
});

test('⛔ the methods page renders a section for every figure, named and caveated', async () => {
  const page = render('how-we-measure.html', { 'measures.json': MEASURES });
  await page.settle();
  const nodes = walk(page.ids.hm);
  for (const key of keysOf(MEASURES)) {
    const sec = nodes.find(n => n.id === anchorFor(key));
    assert.ok(sec, `no section for ${key}`);
    const said = walk(sec).map(n => n.textContent).filter(Boolean).join(' ');
    assert.match(said, /What could be wrong with it/, `${key} rendered without its caveat`);
    assert.match(said, /Counted/, `${key} rendered without saying what it counts`);
  }
});

test('⭐ the page shows the sensitivity of its own answer, in games', async () => {
  /* Arguments 1 and 2 are only conceded if the SIZE of them is on the page. A
     paragraph saying "our threshold is a choice" with no alternative number
     beside it concedes nothing a reader can use.
     MUTATION: drop the `alternate` and `atTarget` blocks from `clubNums` and the
     page still renders every figure — and this fires. */
  const page = render('how-we-measure.html', { 'measures.json': MEASURES });
  await page.settle();
  const said = walk(page.ids.hm).map(n => n.textContent).filter(Boolean).join(' ');
  assert.match(said, /14 games/, 'the alternate-split count for level5 is missing');
  assert.match(said, /23 games/, 'the r = 0.6 count for level5 is missing');
  assert.match(said, /60 games/, 'the r = 0.8 count for level5 is missing');
  assert.match(said, /question 1/, 'the gentler-test count must point at the question it answers');
  assert.match(said, /question 2/);
  assert.match(said, /0\.85/, 'the weakest pair in the possession family is the headline');
});

test('⛔⛔ the arguments AGAINST us are in the page itself, not fetched', async () => {
  /* ⚠️ THE CONCESSIONS ARE STATIC MARKUP ON PURPOSE. A reader who arrives to
     check our work when the data origin is unreachable must still find the
     criticisms; if they lived in the script they would vanish with the figures,
     and the page would degrade into one that only makes claims.
     MUTATION: move any of these into the rendered part and this fires. */
  const { html } = pageOf('how-we-measure.html');
  const body = html.slice(0, html.indexOf('<script>'));
  for (const said of ['Yes, and on purpose', 'Nowhere. It is a choice',
                      'Half a fact, half a choice', 'the criticism we agree with most',
                      'it changed what is on the card', 'we found it ourselves',
                      'It rejects the standings']) {
    assert.ok(body.includes(said), `the page no longer concedes: ${said}`);
  }
  assert.ok(body.includes('what-settles.md'), 'the full search must be linked');
});

test('a page whose figures cannot be fetched still explains, and says the counts are missing', async () => {
  /* ⛔ THE HALF THAT IS CODE AND THE HALF THAT IS DATA FAIL DIFFERENTLY, and the
     page has to say which one went. The derivations are `DERIVATION` and render
     whatever happens; every count beside them comes from the bucket. A reader who
     came to check our work and found derivations with no numbers and no
     explanation would reasonably conclude we never had any.
     MUTATION: drop the notice and this fires; print a zero instead of omitting
     the count and the second assertion does. */
  const page = render('how-we-measure.html', {});
  await page.settle();
  const said = walk(page.ids.hm).map(n => n.textContent).filter(Boolean).join(' ');
  assert.match(said, /could not be loaded/);
  assert.match(said, /shot attempts from the slot/, 'the derivations must still be there');
  assert.ok(!/NaN|undefined|\bnull\b/.test(said), said);
  assert.ok(!/\bgames to settle|\b0 games\b/.test(said), 'a missing count must be absent, not zero');
});

test('⛔⛔⛔ EVERY LEAGUE FIGURE PRINTS ITS OWN DIVISION, not a promise of one', () => {
  /* THE DEFECT I FOUND BY LOOKING AT THE RENDERED PAGE, an hour after writing it.
     Each block said "Counted: power-play goals / Out of: power plays" and then
     showed 4,192 — the archive size — and nothing else. A page called *how this
     is counted* that never performs the arithmetic is the hollow version of
     Kevin's rule, and it read as complete.
     ⛔ AND THE DIVISION IS THE ROW'S, NOT A SECOND ONE. `work.value` is what the
     card itself prints; if this page divided again the two could disagree and
     the disagreement would be invisible.
     MUTATION: compute `count / n` here and the last assertion still passes —
     which is why the check is IDENTITY against the card's own field, not equality
     with a recomputed number. */
  const m = methods(MEASURES);
  const rows = Object.fromEntries(leagueRows(MEASURES).map(r => [r.key, r]));
  for (const f of m.league) {
    assert.ok(f.work, `${f.key} reaches the methods page with no arithmetic`);
    assert.equal(typeof f.unit, 'string', `${f.key} has no unit for its figure`);
    assert.deepEqual(f.work, rows[f.key].work,
      `${f.key} does not carry the work the card's own row computed`);
    if (f.work.count != null) {
      assert.ok(Math.abs(f.work.value - f.work.count / f.work.n) < 1e-12,
        `${f.key}'s published value is not its own numerator over its own denominator`);
    }
  }
  /* The one row that is a percentile rather than a ratio says so by having no
     numerator — writing a median as a division would be arithmetic we did not do. */
  assert.equal(m.league.find(f => f.key === 'shift').work.count, null);
  assert.equal(m.league.find(f => f.key === 'shift').work.value, 46);
  assert.ok(m.league.filter(f => f.work.count == null).length === 1,
    'only the median may be published without a numerator');

  /* ⚠️ AND THIS LAST ONE IS A SOURCE ASSERTION, WHICH IS WEAK, AND IT IS HERE
     ANYWAY. `deepEqual` above cannot tell a value passed through from the same
     value divided a second time — two correct implementations agree, right up
     until one of them is edited. The property that matters is that this module
     does not divide at all, and the only place that is visible is the line that
     hands the row's own object along. If the field is ever renamed, rename it
     here too rather than deleting the check. */
  const src = readFileSync(new URL('../src/lib/methods.js', import.meta.url), 'utf8');
  assert.match(src.replace(/\/\*[\s\S]*?\*\//g, ''), /work:\s*row\.work/,
    'methods.js must pass the row\u2019s division along, never compute its own');
});

test('⛔ the league frame carries what it was counted over, in its own unit', () => {
  /* "Measured over 4,192 games" under a shift figure would be false — shifts are
     counted in shifts, and there are three million of them. A page that prints
     one n for every figure is printing the wrong one for some of them.
     MUTATION: fall back to `c.games` for every row and the shift assertion fires. */
  const m = methods(MEASURES);
  const by = Object.fromEntries(m.league.map(r => [r.key, r]));
  assert.deepEqual(by.penalties.over, { n: 4192, unit: 'games' });
  /* ⛔ AND IT IS DROPPED WHERE IT WOULD BE THE SAME NUMBER TWICE. The shift row
     is divided by nothing, so its population is already the denominator in the
     work line; printing "3,101,105 shifts it was counted over" beside "the
     middle value of 3,101,105" is one number wearing two labels. */
  assert.equal(by.shift.over, null);
  assert.equal(by.shift.work.n, 3101105);
  /* ⛔ BUT THE NOUN SURVIVES. Suppressing the cell also removed the only word
     naming what 3,101,105 counts, and the page rendered "the middle value of
     3,101,105" — a bare number on the page about where numbers come from.
     MUTATION: drop `population` and this fires. */
  assert.equal(by.shift.population, 'shifts');
  assert.equal(by.penalties.population, 'games');
  assert.equal(leagueRows(MEASURES).length, m.league.length,
    'the page must explain exactly the tiles the card drew');
});


/* --------------------------------------------- WHO THE PAGE IS WRITTEN FOR */

test('⛔⛔⛔ the page is written for a hockey fan, not for us', async () => {
  /* KEVIN, READING THE FIRST VERSION AND STOPPING A FEW PARAGRAPHS IN: *"it's not
     really in a public facing tone, it's more of an internal type phrasing…
     the title of the first blurb is '…if it settles…', I doubt a novice hockey
     fan is going to grasp what 'settles' means right away."*

     ⭐ AND IT IS THE SAME DEFECT AS A NAKED NUMBER. This page exists so a reader
     can check our work; a reader who has to learn our vocabulary first cannot.
     A legibility defect here IS a correctness defect, which is what the
     cold-reader rule already says about every other surface.

     ⚠️ WHY A WORD LIST RATHER THAN A JUDGEMENT. Tone cannot be asserted, but the
     specific house words that made the page unreadable can be, and they are the
     ones that will creep back — every one below was in the first draft. A word
     that earns its place can be removed from this list in the same commit that
     reintroduces it, deliberately and in writing.

     ⛔ IT READS WHAT A READER SEES, not the source. Scanning the file would trip
     over `measures.settle`, `policy.admission` and `clubRange`, which are
     identifiers a reader never meets — and a check that cannot tell those apart
     from prose gets weakened until it says nothing. */
  const page = render('how-we-measure.html', { 'measures.json': MEASURES });
  await page.settle();
  const rendered = walk(page.ids.hm).map(n => n.textContent).filter(Boolean).join(' ');

  const { html } = pageOf('how-we-measure.html');
  const staticBody = html.slice(0, html.indexOf('<script>'))
    .replace(/<!--[\s\S]*?-->/g, ' ')        // builder comments are not the page
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\w./-]+\.(?:md|js|py|html)\b/g, ' ');   // a filename is a citation

  const seen = (staticBody + ' ' + rendered).replace(/&[a-z]+;/g, ' ');
  const HOUSE = ['settle', 'admission', 'club-season', 'club-game', 'chronolog',
                 'centred', 'centered', 'reliabilit', 'spearman', 'pearson',
                 'collinear', 'orthogon', 'club row', 'league row', 'denominator',
                 'per-game', 'doctrine', 'CLUB_ROWS'];
  const found = HOUSE.filter(w => new RegExp(w, 'i').test(seen));
  assert.deepEqual(found, [],
    `the page speaks to a reader in words only we use: ${found.join(', ')}`);

  /* AND THE PLAIN VERSION IS ACTUALLY THERE — a word list alone would pass a page
     that had deleted the explanation rather than rewritten it. */
  assert.match(rendered, /Is that the team, or is it just ten games\?/);
  assert.match(rendered, /beside a team\u2019s name/);
});

test('⛔ the front door has ONE door to the methods page, in the block that asks for it', () => {
  /* KEVIN, AFTER THE FIRST PLACEMENT: *"I would have thought you would have put
     the card in the what this (site) does and does not claim?"* He is right, and
     the section's own heading is the argument — a reader there is already asking
     what we claim, and *how did you count it* is the next sentence.

     ⛔ AND ONE DOOR, NOT TWO. It briefly had a card in the measurement strip as
     well, which is the duplicate funnel `_NAV`'s own comment names ("a second
     copy of the same link 40px lower"). Two routes to one page teach a reader
     that the two are different places.

     ⚠️ THE FIRST VERSION OF THIS ENTRY WAS ALREADY IN THE RIGHT BLOCK AND DID NOT
     READ AS A DOOR — fourth of five, link buried mid-sentence in the same grey
     as the prose around it. So this asserts the link is the LAST thing in the
     last limit, not merely that it exists somewhere in the list. A door nobody
     recognises as a door is the same as no door.

     MUTATION: add a second link anywhere on the page and the count fires; move
     the entry out of `.limits` and the placement assertion does. */
  const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  const doors = [...html.matchAll(/href="\/?how-we-measure\.html"/g)];
  assert.equal(doors.length, 1, `the front door has ${doors.length} routes to one page`);

  const list = html.slice(html.indexOf('<ul class="limits">'),
                          html.indexOf('</ul>', html.indexOf('<ul class="limits">')));
  assert.ok(list.includes('how-we-measure.html'),
    'the door is not in "What this does and does not claim"');
  const items = list.split('<li>').slice(1);
  assert.ok(items[items.length - 1].includes('how-we-measure.html'),
    'the door must be the LAST limit — it is the one that answers the others');
  assert.match(items[items.length - 1], /how-we-measure\.html[^<]*">[^<]*&rarr;<\/a>\s*<\/span>/,
    'the link must END the entry and carry an arrow, not sit buried in the prose');

  /* AND THE SECTION STILL SAYS WHAT IT IS. A door added to a block whose heading
     had drifted would be a door in the wrong room. */
  assert.match(html, /<h2>What this does and does not claim<\/h2>/);
});

test('⛔⛔ every "see question N" resolves to a question that exists on the page', () => {
  /* The figures point at the questions by number and the questions are nine
     screens below them, so they are links. A link to `#q8` would look completely
     normal and go nowhere — the same dead-link shape as a work door pointing at a
     section that was never written, one page in.
     MUTATION: reference question 8, or drop an `id="qN"`, and this fires. */
  const html = readFileSync(new URL('../src/how-we-measure.html', import.meta.url), 'utf8');
  const ids = new Set([...html.matchAll(/<h2 id="(q\d+)">/g)].map(m => m[1]));
  assert.ok(ids.size >= 7, `only ${ids.size} questions carry an anchor`);
  for (const [, ref] of html.matchAll(/'#q' \+ (\w+)/g)) {
    assert.ok(ref, 'the anchor must be built from the question number');
  }
  /* The numbers the renderer actually passes, read out of the source so a new
     cross-reference cannot be added without an anchor to land on. */
  for (const [, n] of html.matchAll(/\}, (\d)\)\);/g)) {
    assert.ok(ids.has('q' + n), `a figure links to question ${n} and there is none`);
  }
  assert.match(html, /href="#criticisms"/,
    'the top of the page must point at the questions at the foot of it');
});

test('⭐⭐ the score condition is argued with published counts, not with a mechanism', async () => {
  /* KEVIN, ON THE CF% ROW: *"we say this … because a team that is losing throws
     everything at the net. We don't measure that, nor can we 'show the work'
     conclusively that that's the case, so why do we include that snippet?"* He is
     right, and on this page above all. The fix was not to delete the claim — the
     archive has counted the EFFECT since the site began, in `baseRates`, which
     the front door reads and nothing else did.

     ⛔ AND THE DESCRIPTION TRAVELS WITH THE COUNT. `what` is written where the
     rate is computed (`archive.js`); a sentence describing a base rate, typed on
     this page instead, is a second account of one finding.
     MUTATION: type either sentence into the renderer and the identity check
     against the published strings fires. */
  const m = methods({ ...MEASURES, baseRates: {
    moreAttemptsLost: { count: 2228, n: 4100, rate: 0.543,
      what: 'the team with more shot attempts lost' },
    moreLevelControlLost: { count: 1560, n: 3925, rate: 0.397,
      what: 'the team that controlled play while the score was level lost' } } });
  const lvl = m.club.find(c => c.key === 'level5');
  assert.equal(lvl.evidence.length, 2);
  assert.equal(lvl.evidence[0].what, 'the team with more shot attempts lost');
  assert.ok(lvl.evidenceLead && lvl.evidenceTail, 'the counts need a sentence around them');
  assert.equal(m.club.find(c => c.key === 'dmen').evidence, null,
    'a row with no base rate of its own must not borrow one');

  /* ⛔ AND IT DEGRADES: the published document had no `baseRates` for the first
     weeks of this page's life, and a missing block may not take the page down. */
  assert.equal(methods(MEASURES).club.find(c => c.key === 'level5').evidence, null);

  const page = render('how-we-measure.html', { 'measures.json': { ...MEASURES,
    baseRates: { moreAttemptsLost: { count: 2228, n: 4100,
      what: 'the team with more shot attempts lost' } } } });
  await page.settle();
  const said = walk(page.ids.hm).map(n => n.textContent).filter(Boolean).join(' ');
  assert.match(said, /2,228 of 4,100/, 'the count must be rendered with its n');
  assert.match(said, /the team with more shot attempts lost/);
  assert.ok(!/throws everything at the net/.test(said),
    'the unmeasured mechanism must not have come back');
});

test('⭐ a team-season is spelled out as its own arithmetic, and only when it is true', async () => {
  /* Kevin: *"We should be crystal clear about what 'team-seasons' are, e.g. there
     are 32 teams and we hold 3 seasons of data, hence 32 x 3 = 96."*
     ⛔ THE MULTIPLICATION IS ONLY CLAIMED WHEN IT COMES OUT WHOLE. A season the
     league played with an odd number of clubs — an expansion year, a relocation
     mid-season — would otherwise have this page asserting a tidy sum that is not
     true, which is the one thing a methods page may not do.
     MUTATION: drop the Number.isInteger guard and the second case prints
     "one for each of the 31.67 teams". */
  const page = render('how-we-measure.html', { 'measures.json': MEASURES });
  await page.settle();
  const said = walk(page.ids.hm).map(n => n.textContent).filter(Boolean).join(' ');
  assert.match(said, /96 team-seasons/);
  assert.match(said, /one for each of the 32 teams, in each of the 3 finished seasons/);

  const odd = JSON.parse(JSON.stringify(MEASURES));
  odd.settle.rows.level5.clubSeasons = 95;
  odd.settle.rows.dmen.clubSeasons = 95;
  odd.settle.rows.slot.clubSeasons = 95;
  const p2 = render('how-we-measure.html', { 'measures.json': odd });
  await p2.settle();
  const said2 = walk(p2.ids.hm).map(n => n.textContent).filter(Boolean).join(' ');
  assert.match(said2, /95 team-seasons/);
  assert.ok(!/one for each of the/.test(said2),
    'a sum that does not come out whole must not be asserted');
});

/* ------------------------- THE FIGURES THE REST OF THE SITE PRINTS (§ THIRD) */

test('⛔⛔⛔ a printed figure reads its description; it does not carry one of its own', () => {
  /* ⭐⭐⭐ KEVIN'S RULING, 2026-09-24: *"always go with the proper, transparent
     approach."* Every row on the card carries a `count` and an `of` written in
     `methods.js`, one file away from the arithmetic that makes them true, and
     nothing but a re-reading stops the two drifting. These four do not have to
     take that risk — `archive.js` and `census.js` publish a `what` beside each
     figure — so the sentence a reader sees IS the one the measurement travels
     with.

     MUTATION: give any PRINTED entry a `count:` and the first assertion names
     it; that is the whole defence, because a typed sentence is exactly what
     would be reached for the next time a figure is added in a hurry. */
  /* ⛔ READ AT THE TABLE, NOT AT THE RESULT. `printed()` builds its output field
     by field, so a typed `count` would never appear there and this test would
     report the rule as kept while the rule was broken — the narrower-claim
     defect, inside the check written to prevent it. Caught by mutating. */
  for (const key of PRINTED_KEYS) {
    for (const forbidden of ['count', 'of', 'what', 'said']) {
      assert.ok(!(forbidden in PRINTED[key]),
        `PRINTED.${key} types its own \`${forbidden}\` — that sentence belongs `
        + 'in the published document, beside the arithmetic that makes it true');
    }
  }
  const out = printed(MEASURES);
  assert.equal(out.length, PRINTED_KEYS.length);
  for (const e of out) {
    assert.ok(e.groups.length, `${e.key} read nothing out of the document`);
    for (const g of e.groups) {
      /* AND THE SENTENCE IS THE DOCUMENT'S, CHARACTER FOR CHARACTER. Resolving a
         path and then rendering something else would pass a shape check. */
      const said = g.from.split('.').reduce((o, k) => o[k], MEASURES).what;
      assert.equal(g.what, said, `${e.key} shows a sentence the document does not carry at ${g.from}`);
    }
  }
});

test('⛔⛔⛔ the arithmetic printed beside a figure is the arithmetic that made it', () => {
  /* ⭐⭐ THE CHECK THAT IS NOT ABOUT SHAPE. Every other assertion here would pass
     a page printing three published numbers that have nothing to do with each
     other — which is precisely what a wrong `num`/`den` would produce, and it
     would look completely normal: three real figures, correctly formatted, in a
     row. So the numerator and denominator are DIVIDED here and required to
     produce the published result.

     ⚠️ TWO SHAPES, BECAUSE A RATE PER SIXTY IS NOT A QUOTIENT. 67,517 ÷ 42,615.7
     is 1.58, not 95.06. A test that divided everything would have forced the
     page to print the 1.58, and the page would have been wrong in the same way
     the test was.

     MUTATION: swap `num` and `den` on any read, or point `out` at a neighbouring
     field, and this fires with the key named. */
  for (const e of printed(MEASURES)) {
    for (const g of e.groups) {
      for (const l of g.lines) {
        const got = l.as === 'scaled' ? (l.count / l.n) * 60 : l.count / l.n;
        assert.ok(Math.abs(got - l.value) < Math.max(0.001, Math.abs(l.value) * 0.001),
          `${e.key}/${l.is}: the page shows ${l.count} and ${l.n} beside ${l.value}, `
          + `but they make ${got.toFixed(4)}`);
      }
    }
  }
});

test('⛔⛔ the paths are checked against the REAL published document, not the fixture', () => {
  /* ⭐⭐ THE FIXTURE CANNOT CATCH A RENAMED FIELD, because I would rename it in
     both. `census.js` publishes `atk`, `def` and `n`; if a future reducer calls
     one of them something else, every test above still passes and the live page
     silently loses a figure — the shape of failure this whole module exists
     against, one file further out.

     ⚠️ `data/measures.json` IS A CACHE AND NOT THE ARCHIVE, which is why this
     asserts only that the SHAPE resolves and asserts nothing about the values.
     The cache is refreshed from the origin, so a field that vanished upstream
     shows up here within a derive.

     MUTATION: point any `at` path at a field name that does not exist and this
     names it. */
  const live = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url), 'utf8'));
  const out = printed(live);
  for (const e of out) {
    assert.equal(e.missing, null,
      `${e.key} cannot be read out of the published document: `
      + JSON.stringify(e.missing));
    /* ⚠️ ONE LINE IS ENOUGH AND THIS USED TO DEMAND TWO. Every entry happened to
       have a pair when it was written, so the bar was set at the shape the data
       had rather than at the claim — and `slotAttempts`, which is one share of
       one population, failed a test that meant to check it read ANYTHING. The
       real assertion is `missing === null` directly above. */
    assert.ok(e.lines >= 1, `${e.key} read nothing out of the published document`);
  }
  /* AND THE DIVISION REPRODUCES FROM THE PUBLISHED FILE. This is the claim the
     zone numerators were published for: 235,614 ÷ 165,420 = 1.424, from a
     document a reader can fetch. */
  for (const e of out) {
    for (const g of e.groups) {
      for (const l of g.lines) {
        const got = l.as === 'scaled' ? (l.count / l.n) * 60 : l.count / l.n;
        assert.ok(Math.abs(got - l.value) < Math.max(0.001, Math.abs(l.value) * 0.001),
          `${e.key}/${l.is} does not reproduce from the published file`);
      }
    }
  }
});

test('⛔ a figure with no published sentence is not printed at all', () => {
  /* ⭐ THE RULE APPLIED TO OURSELVES. `census.js` published no `what` on nine
     sub-objects until 24 September 2026, and the four derivations that needed
     them were hand-written for exactly that reason. If a sentence goes missing
     again the page must lose the figure and SAY so, rather than print a number
     with nothing behind it on the one page that refuses those.
     MUTATION: render the figure anyway when `what` is absent and this fires. */
  const gone = JSON.parse(JSON.stringify(MEASURES));
  delete gone.census.pace.what;
  const pace = printed(gone).find(e => e.key === 'pace');
  assert.equal(pace.lines, 0, 'a figure was printed with no published description');
  assert.deepEqual(pace.missing.map(m => m.why), ['description', 'description', 'description']);
  assert.ok(pace.why.length > 60, 'the argument does not depend on the document and must survive');

  /* AND THE OTHER DIRECTION READS DIFFERENTLY, because they are two different
     confessions: one of them ours to fix in a reducer, the other a stale file. */
  const bare = JSON.parse(JSON.stringify(MEASURES));
  delete bare.census.endZone.atk;
  assert.deepEqual(printed(bare).find(e => e.key === 'zoneStarts').missing.map(m => m.why),
    ['figures']);
  assert.equal(printed(null).find(e => e.key === 'pace').lines, 0);
  assert.equal(printed({}).find(e => e.key === 'slotGoals').groups.length, 0);
});

test('⛔ no printed figure collides with a card row, on the page or in the anchor', () => {
  /* The defect one namespace above this one: `slot` the row and `slot` the
     conversion rate are two measurements with one word, and the fix was to stop
     matching keys by string. A PRINTED key that collided with a derivation key
     would put two sections on the page with the same `id`, and the browser would
     silently resolve every door to the first.
     MUTATION: rename `slotGoals` to `slotShare` and this fires. */
  const anchors = [...EXPLAINED, ...PRINTED_KEYS].map(anchorOf);
  assert.equal(anchors.length, new Set(anchors).size,
    'two sections would be written with the same id');
});

test('⛔ every printed figure reaches the page with its work, its source and its caveat', async () => {
  /* ⚠️ THE ROUND TRIP, NOT THE HALVES. `printed()` returning good data proves
     nothing about what a reader sees; the renderer is a separate file that can
     drop any field silently. This runs the page's real inlined script.
     MUTATION: delete the `hmcav` block from `printedBlock` and this fires. */
  const page = render('how-we-measure.html', { 'measures.json': MEASURES });
  await page.settle();
  const nodes = walk(page.ids.hm);
  for (const key of PRINTED_KEYS) {
    const sec = nodes.find(n => n.id === anchorOf(key));
    assert.ok(sec, `no section for ${key}`);
    const said = walk(sec).map(n => n.textContent).filter(Boolean).join(' ');
    assert.match(said, /What could be wrong with it/, `${key} rendered without its caveat`);
    assert.match(said, /Where this appears/, `${key} does not say where a reader met it`);
    assert.match(said, /÷|in .* minutes =/, `${key} rendered without its arithmetic`);
  }
  /* THE PUBLISHED NUMBERS THEMSELVES, FORMATTED — a section could render every
     label above and no figures at all. */
  const all = nodes.map(n => n.textContent).filter(Boolean).join(' ');
  for (const want of ['19,304 ÷ 168,910 = 11.4%', '235,614 ÷ 165,420 = 1.42 attempts per face-off',
                      '67,517 in 42,615.7 minutes = 95.06 per 60 minutes']) {
    assert.ok(all.includes(want), `the page does not show: ${want}`);
  }
  /* ⛔ 0.765 ATTEMPTS PER FACE-OFF IS NOT 76.5%. `fig()` reads anything under 1
     as a share, which is right for every figure it was written for and wrong
     for this one. MUTATION: use `fig` in `readLine` and this fires. */
  assert.ok(all.includes('0.77 attempts per face-off'), 'a rate under 1 was printed as a percentage');
  assert.ok(!all.includes('76.5'), 'a rate under 1 was multiplied by a hundred');
});

test('⛔⛔ one published sentence is printed once on the page, and the second links to it', async () => {
  /* ⭐⭐ THE SAME DEFECT AS THE FRONT DOOR'S, FROM THE OTHER SIDE. `FIGURE_CLAUSE`
     closed "one statement written twice"; this closes "one statement READ
     twice". `pace` and `scoreEffects` are two cuts of a single published
     measurement, so its description belongs under one of them with a link from
     the other.
     MUTATION: drop the `sameAs` branch from `printedBlock` and the count is 2. */
  const page = render('how-we-measure.html', { 'measures.json': MEASURES });
  await page.settle();
  const nodes = walk(page.ids.hm);
  const all = nodes.map(n => n.textContent).filter(Boolean).join(' ');
  const said = MEASURES.census.pace.what;
  const hits = all.split(said).length - 1;
  assert.equal(hits, 1, `the same published sentence is on the page ${hits} times`);

  const second = nodes.find(n => n.id === anchorOf('scoreEffects'));
  const links = walk(second).filter(n => n.href).map(n => n.href);
  assert.ok(links.includes('#' + anchorOf('pace')),
    `the second cut must link to the section that carries the sentence, got ${links.join(', ')}`);
});

/**
 * ⭐⭐ EVERY SURFACE THAT PRINTS A FIGURE, AND THE SHAPE ITS DOOR SITS IN.
 *
 * Measured rather than listed: every placeholder `_archive()` publishes was
 * replaced with a unique marker, the site rebuilt and the built pages grepped.
 * Three pages print figures — `what-you-can-see.html` (17), `index.html` (14,
 * one of which is the size of the archive) and `slot.html` (7). The other five
 * rule pages print none, which is the fact that killed the first dispersion
 * plan.
 *
 * ⛔ THE REGEXES ARE PER SURFACE ON PURPOSE, AND THE COUNT IS CHECKED. A single
 * clever pattern that walked backwards from each door would quietly stop
 * matching when a surface's markup changed, and a test that finds three doors
 * where twelve exist passes. So the doors matched here are counted against every
 * `class="cw"` on disk, and a shortfall names the difference.
 */
const DOOR = /<p class="cw"><a href="\/how-we-measure\.html#m-([^"]+)">/;
const SURFACES = [
  { page: 'what-you-can-see.html', what: 'a learn card',
    re: new RegExp('<div class="cardw"><a class="card" id="[^"]+"[^>]*>'
      + '<p class="t">[^<]*<\\/p><p>([\\s\\S]*?)<\\/p>[\\s\\S]*?' + DOOR.source, 'g') },
  { page: 'index.html', what: 'a front-door tile',
    re: new RegExp('<div class="cardw"><a class="ccard"[^>]*><span class="lt">[^<]*<\\/span>'
      + '<span class="ld">([\\s\\S]*?)<\\/span><\\/a>' + DOOR.source, 'g') },
  { page: 'slot.html', what: 'a rule page’s lede',
    re: new RegExp('<p class="rlede">([\\s\\S]*?)<\\/p>\\s*' + DOOR.source, 'g') },
  { page: 'slot.html', what: 'the note under a rule page’s drawing',
    re: new RegExp('<p class="dgnote">([\\s\\S]*?)<\\/p>\\s*<\\/figure>\\s*' + DOOR.source, 'g') },
];
/** Every door on the site, as {copy, key, where} — matched, then counted. */
function everyDoor() {
  const out = [];
  for (const s of SURFACES) {
    const html = readFileSync(new URL(`../src/${s.page}`, import.meta.url), 'utf8');
    for (const m of html.matchAll(s.re)) {
      out.push({ copy: m[1], key: m[2], where: `${s.page} / ${s.what}` });
    }
  }
  return out;
}

test('⛔⛔ every door the site writes was found by this file, not most of them', () => {
  /* ⭐ THE CHECK ON THE CHECKS. Both tests below iterate what `everyDoor()`
     returns, so a surface whose markup drifted out of its pattern would be
     silently exempted from every assertion about doors — and both would still
     pass, on fewer doors. The pages are the ones the marker census found; a new
     one that starts printing figures has to be added here.
     MUTATION: break any pattern above and this names the shortfall. */
  const PAGES = ['index.html', 'what-you-can-see.html', 'slot.html', 'icing.html',
                 'offside.html', 'penalties.html', 'faceoffs.html', 'empty-net.html'];
  const onDisk = PAGES.reduce((n, f) => n
    + (readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')
        .match(/<p class="cw">/g) || []).length, 0);
  const found = everyDoor();
  assert.equal(found.length, onDisk,
    `${onDisk} work doors are on disk and these patterns match ${found.length} `
    + `(${found.map(d => d.where).join(', ')})`);
  assert.ok(onDisk >= 12, `only ${onDisk} doors on the whole site`);
});

test('⛔⛔⛔ EVERY WORK DOOR ON THE SITE LANDS ON A SECTION THAT EXISTS', async () => {
  /* ⭐⭐⭐ THE SECOND SURFACE, AND THE SAME GATE. The preview card's doors have
     been checked end to end since 23 September; `what-you-can-see.html` printed
     17 measured figures with no door to anything at all, so a reader following
     Kevin's rule from the front page reached a LESSON — which teaches what the
     thing is and says nothing about how it was counted.

     ⭐⭐ AND THIS IS THE SEAM BETWEEN PYTHON AND JAVASCRIPT. `build_index.py`
     writes `#m-<key>` because it cannot call `anchorOf`, and the methods page
     writes its ids by calling it. Two literals agreeing is the dead link that
     looks completely normal — the same arrangement `_excluded()` has with
     `excludedCompetitions`, asserted rather than assumed.

     MUTATION: change `anchorOf` to return anything but `'m-' + key` and this
     fires, because the page's ids move and the builder's hrefs do not. Change
     `METHODS_ANCHOR` in the builder and it fires from the other side. */
  const doors = everyDoor().map(d => 'm-' + d.key);
  assert.ok(doors.length >= 12, `only ${doors.length} work doors across the site`);

  const page = render('how-we-measure.html', { 'measures.json': MEASURES });
  await page.settle();
  const sections = new Set(walk(page.ids.hm).map(n => n.id).filter(Boolean));

  for (const frag of doors) {
    assert.ok(sections.has(frag),
      `a card links to #${frag} and the methods page renders no such section `
      + `(it has ${[...sections].join(', ')})`);
  }
  /* AND THE FRAGMENT IS THE ONE `anchorOf` SPELLS, not merely one that happens to
     exist. A door pointing at a real section for the WRONG figure resolves
     perfectly and explains the wrong number — worse than a dead link. */
  const known = new Set([...EXPLAINED, ...PRINTED_KEYS].map(anchorOf));
  for (const frag of doors) {
    assert.ok(known.has(frag),
      `#${frag} is not a spelling \`anchorOf\` produces for any figure we explain`);
  }
});

test('⛔⛔⛔ a door opens the work behind THE NUMBER THE CARD PRINTS', async () => {
  /* ⭐⭐⭐ THE CHECK THAT IS NOT CIRCULAR, AND IT IS THE ONLY ONE HERE THAT ISN'T.
     Every other assertion about these doors is computed from the same table the
     builder writes them from, so it proves the renderer works and proves nothing
     about the MAPPING. A door aimed at the wrong derivation resolves perfectly,
     renders perfectly, and answers "where did that come from?" with a confident
     description of a different measurement — strictly worse than no door. That
     is not hypothetical: `slot` the card row and `slot` the conversion rate are
     two measurements with one word, and string matching would have paired them.

     ⭐ SO THE TWO ENDS ARE READ INDEPENDENTLY. The numbers come off the BUILT
     card, substituted from `measures.json` by Python; the numbers behind the
     door come from `methods()` in JavaScript. They meet only if the door is
     aimed at the measurement the card is about.

     MUTATION: point `__ZONE_ATK__` at `pace` in FIGURE_DERIVATION, rebuild, and
     this fires — where every other door test still passes, because both of their
     ends moved together. */
  const live = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url), 'utf8'));
  const m = methods(live);
  const shown = {};
  for (const e of printed(live)) {
    shown[e.key] = e.groups.flatMap(g => g.lines.flatMap(l => [l.count, l.n, l.value]));
  }
  for (const r of m.league) {
    const w = r.work || {};
    shown[r.key] = [w.count, w.n, w.value, r.over && r.over.n].filter(v => v != null);
  }
  /* ⚠️ A CLUB ROW PUBLISHES ITS STEADINESS AND ITS GAMES, NOT A COUNT — so a
     figure printed in prose can never match one, and a door aimed at a club row
     is caught here rather than looking plausible. Not theoretical: the figure
     under the drawing on `slot.html` pointed at `slotShare` for an hour, and
     46.7% would have opened on r = 0.72 over 38 games. */
  for (const c of m.club) shown[c.key] = [c.r, c.games].filter(v => v != null);

  /* ⚠️ ONE DECLARED EXCEPTION, WITH THE REASON AND A CHECK ON THE REASON. The
     `blocked` card's "75 of 135" is counted in the ONE GAME it opens, not across
     the archive, so it cannot match an archive figure and should not. The door
     is still right — `m-attempts` is where the rule for what an attempt's ending
     means is written — but the reader has to be told the number is one game's,
     or they will read our archive split as the figure they just saw. That
     sentence is the thing this exception rests on, so it is asserted rather than
     trusted. */
  const ONE_GAME = /never reached the goaltender/;

  const doors = everyDoor();
  assert.ok(doors.length >= 12, `only ${doors.length} doors found — the markup moved`);

  for (const { copy, key, where } of doors) {
    const text = copy.replace(/&[a-z]+;/g, ' ');
    if (ONE_GAME.test(text)) {
      assert.match(text, /in this game/,
        `${where} is excused from matching an archive figure because its number `
        + 'is one game’s — and it no longer says so, so a reader will read the '
        + 'archive split behind the door as the number they just saw');
      continue;
    }
    const onCard = [...text.matchAll(/\d[\d,]*\.?\d*/g)]
      .map(x => parseFloat(x[0].replace(/,/g, '')));
    const behind = (shown[key] || []).filter(v => v != null);
    assert.ok(behind.length, `#m-${key} shows no published figures at all`);
    assert.ok(onCard.length, `${where} carries a work door and prints no figure`);
    /* ROUNDED AT EVERY PRECISION THE SITE USES, because the card prints 95 and
       the work prints 95.059 — the same measurement, formatted for two readers. */
    const met = onCard.filter(g => behind.some(h =>
      [0, 1, 2, 3].some(d => Math.abs(g - Number(h.toFixed(d))) < 1e-9)));
    assert.ok(met.length,
      `${where} prints [${onCard}] and its door opens #m-${key}, which shows `
      + `[${behind.map(h => +h.toFixed(3))}] — not one number in common, so the door `
      + 'explains a different measurement from the one the reader just read');
  }
});
