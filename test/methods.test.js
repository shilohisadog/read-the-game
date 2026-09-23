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
import { methods, keysOf, anchorOf, EXPLAINED } from '../src/lib/methods.js';
import { CLUB_ROWS, leagueRows } from '../src/lib/preview.js';

/* ------------------------------------------------------------------ FIXTURE */

/** A measures.json carrying EVERY counter, so `keysOf` reports the full set. */
const MEASURES = {
  attemptMix: { games: 4192, byType: { 'shot-on-goal': 215529, goal: 25597,
    'blocked-shot': 138880, 'missed-shot': 120714 } },
  census: { games: 4192,
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
  assert.deepEqual([...drawn].sort().filter(k => !EXPLAINED.includes(k)), [],
    'a figure is drawn on the card with no derivation on the methods page');
  assert.deepEqual(EXPLAINED.filter(k => !drawn.includes(k)), [],
    'the methods page explains a figure the card cannot draw');
  assert.equal(drawn.length, new Set(drawn).size, 'a key is drawn twice');
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
    const sec = nodes.find(n => n.id === anchorOf(key));
    assert.ok(sec, `no section for ${key}`);
    const said = walk(sec).map(n => n.textContent).filter(Boolean).join(' ');
    assert.match(said, /What is wrong with it/, `${key} rendered without its caveat`);
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
