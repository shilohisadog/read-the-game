/**
 * The homepage, RUN — not grepped.
 *
 * The page was rebuilt around one sentence from Kevin: *"the normal use case will
 * be for a team fan to come to the site and load their team's last game and watch
 * it."* That gives the design a target which is a number, so it is a test:
 *
 *      TWO CLICKS FROM A COLD LOAD TO WATCHING YOUR TEAM'S LAST GAME.
 *
 * A page that drifts to three has lost the thing it was rebuilt for, and no
 * amount of correct markup would tell us.
 *
 * Everything the page shows is fetched — the team set, the games, the rates, the
 * freshness. So these tests execute the real script against fake documents and
 * read what it rendered, the way test/shell.test.js does for game.html. Grepping
 * the built HTML for a team name would prove nothing: there are none in it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

/** The smallest DOM that can answer what this page asks of one. */
function fakeDom() {
  const make = (tag) => ({
    tag, className: '', href: '', textContent: '', style: {}, attrs: {}, kids: [],
    appendChild(n) { this.kids.push(n); return n; },
    setAttribute(k, v) { this.attrs[k] = v; },
  });
  const ids = {};
  return {
    ids,
    document: {
      createElement: make,
      getElementById(id) { return (ids[id] = ids[id] || make('div#' + id)); },
    },
  };
}

/** Everything rendered under an id, flattened, in document order. */
function walk(node, out = []) {
  if (!node) return out;
  out.push(node);
  node.kids.forEach(k => walk(k, out));
  return out;
}
const textOf = n => walk(n).map(x => x.textContent).filter(Boolean).join(' ');
const linksOf = n => walk(n).filter(x => x.href).map(x => x.href);

const CATALOG = { games: [
  { id: 2023020100, d: '2024-01-05', a: 'BUF', h: 'TOR', as: 2, hs: 5, ash: 30, hsh: 20, t: 2, v: 1 },
  { id: 2023020200, d: '2024-02-09', a: 'TOR', h: 'BUF', as: 1, hs: 4, ash: 22, hsh: 33, t: 2, v: 1 },
  { id: 2023020300, d: '2024-03-11', a: 'BUF', h: 'OTT', as: 0, hs: 1, ash: 40, hsh: 12, t: 2, v: 0, r: 'validation' },
  // Out of scope: preseason, and the Olympics. Neither may reach a surface.
  { id: 2023010001, d: '2023-09-24', a: 'BUF', h: 'CBJ', as: 3, hs: 2, ash: 25, hsh: 25, t: 1, v: 1 },
  { id: 2025090030, d: '2026-02-22', a: 'SVK', h: 'FIN', as: 4, hs: 1, ash: 25, hsh: 40, t: 9, v: 1 },
]};

const MEASURES = {
  rule: 'even-strength shot attempts taken while the score was level, in regulation',
  featured: [{ id: 2023020867, ab: 'DAL', edge: 33 }],
  baseRates: {
    moreShotsOnGoalLost: { what: 'the team with more shots on goal lost',
      population: 'NHL regular season and playoffs', n: 3957, count: 1811, rate: 0.4577 },
    moreAttemptsLost: { what: 'the team with more shot attempts lost',
      population: 'NHL regular season and playoffs', n: 4029, count: 2194, rate: 0.5445 },
    moreLevelControlLost: { what: 'the team that controlled play while the score was level lost',
      population: 'NHL regular season and playoffs', n: 3855, count: 1527, rate: 0.3961 },
  },
};

const INDEX = {
  dataThrough: '2026-06-14', lastRun: new Date().toISOString(), halted: null,
  coverage: { windowDays: 14, finalInWindow: 0, gamesInWindow: 0,
              heldInWindow: 0, erroredInWindow: 0, refusedInWindow: 0 },
};

function run({ search = '', docs = {} } = {}) {
  const { ids, document } = fakeDom();
  const fetch = url => {
    const key = Object.keys(docs).find(k => url.includes(k));
    return Promise.resolve(key
      ? { ok: true, json: () => Promise.resolve(docs[key]) }
      : { ok: false, json: () => Promise.resolve(null) });
  };
  new Function('document', 'fetch', 'location', script)(document, fetch, { search });
  return { ids, settle: () => new Promise(r => setTimeout(r, 0)) };
}

const ALL = { 'catalog.json': CATALOG, 'measures.json': MEASURES, 'index.json': INDEX };

test('the team grid is read from the archive, never typed', () => {
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    const chips = walk(r.ids.teams).filter(n => n.className === 'chip');
    // BUF, TOR and OTT play in-scope games. CBJ appears ONLY in a preseason game
    // and SVK/FIN only at the Olympics — so a grid built from the raw catalog
    // instead of the in-scope one would have five or six chips, not three.
    assert.deepEqual(chips.map(c => c.textContent), ['BUF', 'OTT', 'TOR']);
    assert.deepEqual(chips.map(c => c.href), ['?team=BUF', '?team=OTT', '?team=TOR']);
  });
});

test('every chip is coloured and named, so a blank one cannot ship quietly', () => {
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    for (const c of walk(r.ids.teams).filter(n => n.className === 'chip')) {
      assert.match(c.style.background, /^#[0-9A-F]{6}$/i, `${c.textContent} has no colour`);
      assert.ok(c.style.color, `${c.textContent} has no ink`);
      assert.ok(c.attrs['aria-label'] && c.attrs['aria-label'] !== c.textContent,
        `${c.textContent} has no accessible name`);
    }
  });
});

test('TWO CLICKS: a team chip, then the top game, and you are watching', () => {
  // The design target, asserted end to end. Click one is the chip's href; click
  // two is the first row of the team view it leads to.
  const cold = run({ docs: ALL });
  return cold.settle().then(() => {
    const chip = walk(cold.ids.teams).find(n => n.textContent === 'BUF');
    assert.equal(chip.href, '?team=BUF', 'click 1');

    const team = run({ search: '?team=BUF', docs: ALL });
    return team.settle().then(() => {
      const first = walk(team.ids.main).find(n => n.tag === 'a' && /^game\.html/.test(n.href));
      assert.equal(first.href, 'game.html?game=2023020200', 'click 2 — the most recent');
    });
  });
});

test('a team view lists that team newest first, and nobody else', () => {
  const r = run({ search: '?team=BUF', docs: ALL });
  return r.settle().then(() => {
    const rows = walk(r.ids.main).filter(n => n.tag === 'li');
    assert.equal(rows.length, 3, 'three in-scope games, preseason excluded');
    const text = textOf(r.ids.main);
    assert.doesNotMatch(text, /Columbus/, 'a preseason opponent must not appear');
    const ids = linksOf(r.ids.main).filter(h => h.startsWith('game.html'));
    assert.deepEqual(ids, ['game.html?game=2023020200', 'game.html?game=2023020100'],
      'newest first, and the refused game is not a link');
  });
});

test('a refused game is listed with its reason, not hidden', () => {
  // Doctrine 9. A schedule that hides what we cannot show is a map of our
  // successes — and inside the scope that argument is unchanged.
  const r = run({ search: '?team=BUF', docs: ALL });
  return r.settle().then(() => {
    const t = textOf(r.ids.main);
    assert.match(t, /cannot show it/, 'the refusal is stated');
    assert.match(t, /validation/, 'and it names the check that stopped it');
  });
});

test('the result reads from the team you asked about, not from the home side', () => {
  // MUTATION GUARD. BUF lost 2-5 away and won 4-1 at home. A view that read the
  // home column would say "beat Toronto" for the away loss — plausible, wrong,
  // and invisible without checking a game the team did not host.
  const r = run({ search: '?team=BUF', docs: ALL });
  return r.settle().then(() => {
    const t = textOf(r.ids.main);
    assert.match(t, /Beat Toronto Maple Leafs/, 'the home win');
    assert.match(t, /Lost to Toronto Maple Leafs/, 'and the away loss');
  });
});

test('an unknown team says so instead of rendering an empty page', () => {
  const r = run({ search: '?team=ZZZ', docs: ALL });
  return r.settle().then(() => {
    assert.match(textOf(r.ids.main), /no regular-season or playoff games/i);
  });
});

test('a relocated team explains itself rather than trailing off', () => {
  const cat = { games: [{ id: 2023020400, d: '2024-01-20', a: 'ARI', h: 'BUF',
                          as: 1, hs: 2, ash: 20, hsh: 30, t: 2, v: 1 }] };
  const r = run({ search: '?team=ARI', docs: { ...ALL, 'catalog.json': cat } });
  return r.settle().then(() => {
    assert.match(textOf(r.ids.main), /relocated to utah/i);
  });
});

test('every rate is published with its denominator and population', () => {
  // A rate without its reference class is the thing this site teaches against.
  // Shipping one bare would be us committing it on our own front page.
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    const t = textOf(r.ids.rates);
    // The percentages must agree with the counts printed beside them, so they are
    // recomputed here rather than copied from the fixture. The first version of
    // this test asserted 54.5% against a fixture whose stored `rate` was rounded
    // to 0.5445, and the page — which trusted that field — rendered 54.4%.
    for (const k of Object.keys(MEASURES.baseRates)) {
      const r = MEASURES.baseRates[k];
      assert.ok(t.includes((r.count / r.n * 100).toFixed(1) + '%'),
        `${k}: the shown percentage must follow from ${r.count} of ${r.n}`);
      assert.ok(t.includes(`${r.count} of ${r.n}`), `${k}: denominator`);
    }
    assert.match(t, /NHL regular season and playoffs/);
  });
});

test('the start-here link points at the measured featured game', () => {
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    assert.equal(r.ids.start.href, 'game.html?game=2023020867');
  });
});

test('a missing measurement is stated, and the rest of the page still works', () => {
  // Partial failure must not be total failure: a fan looking for their team does
  // not care that the archive-wide rates are unavailable.
  const r = run({ docs: { 'catalog.json': CATALOG, 'index.json': INDEX } });
  return r.settle().then(() => {
    assert.match(textOf(r.ids.rates), /could not be loaded/i);
    assert.equal(walk(r.ids.teams).filter(n => n.className === 'chip').length, 3,
      'the team grid is unaffected');
    // The script must not have touched start-here at all — its fallback lives in
    // the markup, so a page with no measurement still offers a game to watch.
    assert.equal(r.ids.start, undefined, 'the script left start-here alone');
    assert.match(html, /id="start" href="game\.html"/,
      'and the markup carries a working fallback');
  });
});

test('an unreachable archive is a stated condition, not a blank page', () => {
  const r = run({ docs: {} });
  return r.settle().then(() => {
    assert.match(textOf(r.ids.teams), /could not be loaded/i);
    assert.match(String(r.ids.state.textContent), /No data loaded yet\./);
    assert.equal(r.ids.state.attrs['data-state'], 'empty');
  });
});

test('the freshness line is fetched, and reports what it was given', () => {
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    assert.match(String(r.ids.state.textContent), /Data through 14 June 2026\./);
    assert.equal(r.ids.state.attrs['data-state'], 'quiet');
  });
});
