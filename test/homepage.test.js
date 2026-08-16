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
const PAGES_TO_CHECK = Object.fromEntries(['index.html','game.html','read-the-game.html','goalie-view.html','goalie-eye-view.html']
  .map(f => [f, readFileSync(new URL('../src/' + f, import.meta.url), 'utf8')]));
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

/** Every id the built page actually carries. See getElementById below. */
const PAGE_IDS = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

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
      /* A DOCUMENT THAT INVENTS ELEMENTS CANNOT SEE A REFERENCE TO A DELETED
         ONE. This returned a fresh div for ANY id, so `$('start').href = …`
         against markup with no #start assigned happily to a phantom here and
         threw `Cannot set property of null` in a browser -- taking the whole
         hero down with it, silently, with every test green. Caught the day
         #start was deleted, by the deletion, and not by anything here.
         So the fake now models the REAL document: the ids it answers to are
         parsed out of the built page, and anything else is null, exactly as a
         browser reports it. Same rule as the absent `hidden` on the game page's
         fake — a fake that can only express one state makes every assertion
         about the other one vacuous. */
      getElementById(id) {
        if (!PAGE_IDS.has(id)) return null;
        return (ids[id] = ids[id] || make('div#' + id));
      },
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

/** BUF across three seasons; ARI stops after 2023-24, as it really does. */
const MULTI = { games: [
  { id: 2023020100, d: '2024-01-05', a: 'BUF', h: 'TOR', as: 2, hs: 5, ash: 30, hsh: 20, t: 2, v: 1 },
  { id: 2024020100, d: '2025-01-05', a: 'BUF', h: 'TOR', as: 3, hs: 1, ash: 28, hsh: 26, t: 2, v: 1 },
  { id: 2025020100, d: '2026-01-05', a: 'TOR', h: 'BUF', as: 0, hs: 2, ash: 19, hsh: 35, t: 2, v: 1 },
  { id: 2025020101, d: '2026-01-09', a: 'BUF', h: 'OTT', as: 1, hs: 2, ash: 41, hsh: 18, t: 2, v: 1 },
  { id: 2023020400, d: '2024-01-20', a: 'ARI', h: 'BUF', as: 1, hs: 2, ash: 20, hsh: 30, t: 2, v: 1 },
]};
const MULTI_DOCS = { ...ALL, 'catalog.json': MULTI };

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
    // READ FROM THE SCALE, which is now the only place the rates are drawn. The
    // three-row list this used to read differed from the scale by one string —
    // the population — repeated three times, and is deleted. The claim is
    // unchanged and is the one that matters: nothing here is published without
    // its denominator and its reference class.
    const t = textOf(r.ids.scale);
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

/**
 * IS THIS GAME THE USUAL CASE — the caption CHENG required to be computed.
 *
 * The thesis now sits directly above the hero, so the hero reads as an instance
 * of it. The hero is the most recent game, which means some nights confirm the
 * rate and some contradict it: "the caption must handle both, which means the
 * relationship has to be computed, not written." A hand-authored clause here
 * would be the #start defect a third time — copy asserting a relationship the
 * data is free to invert overnight.
 *
 * So the fixtures invert it deliberately. Every arm below is reachable from real
 * data, and three of them are unreachable from the default fixture, which is
 * exactly how the first pass left them untested.
 */
function heroRelation({ ash, hsh, as, hs, count, n }) {
  const cat = { games: [{ id: 2023020200, d: '2024-02-09', a: 'TOR', h: 'BUF',
                          as, hs, ash, hsh, t: 2, v: 1 }] };
  const measures = { ...MEASURES, baseRates: { ...MEASURES.baseRates,
    moreShotsOnGoalLost: { what: 'the team with more shots on goal lost',
      population: 'NHL regular season and playoffs', n, count } } };
  const r = run({ docs: { ...ALL, 'catalog.json': cat, 'measures.json': measures } });
  return r.settle().then(() => textOf(r.ids.herorel));
}
// The shot leader loses 20% of the time — so the leader USUALLY WINS, 80%.
const LEADERS_WIN = { count: 200, n: 1000 };
// And the mirror: the leader loses 80% of the time.
const LEADERS_LOSE = { count: 800, n: 1000 };
// TOR away, BUF home. `ash`/`hsh` are shots, `as`/`hs` goals.
const BUF_LED_SHOTS = { ash: 22, hsh: 33 };

test('the hero caption says whether THIS game went the usual way, both ways round', () =>
  Promise.all([
    heroRelation({ ...BUF_LED_SHOTS, as: 1, hs: 4, ...LEADERS_WIN }),
    heroRelation({ ...BUF_LED_SHOTS, as: 4, hs: 1, ...LEADERS_WIN }),
    heroRelation({ ...BUF_LED_SHOTS, as: 4, hs: 1, ...LEADERS_LOSE }),
    heroRelation({ ...BUF_LED_SHOTS, as: 1, hs: 4, ...LEADERS_LOSE }),
  ]).then(([winnerLed, winnerTrailed, ledAndLost, ledAndWon]) => {
    // Leader won, and leaders usually win.
    assert.match(winnerLed, /That is the usual outcome\./);
    // Leader lost, and leaders usually win. Same rate, opposite game.
    assert.match(winnerTrailed, /That is not the usual outcome\./);
    // THE RATE'S OWN DIRECTION IS READ, NOT ASSUMED. Same two games again
    // against a rate that runs the other way, and both verdicts must flip —
    // which a hard-coded "leaders usually lose" cannot do.
    assert.match(ledAndLost, /That is the usual outcome\./,
      'the leader lost and leaders usually lose, and the page called it unusual');
    assert.match(ledAndWon, /That is not the usual outcome\./);

    // AND THE PERCENTAGE IS THE ONE IT JUST NAMED. The archive publishes every
    // rate as "lost"; a caption that says the leader WINS must show 100 − that,
    // or it is a correct sentence with the wrong number welded to it.
    assert.match(winnerLed, /wins 80\.0% of the time/);
    assert.match(ledAndLost, /loses 80\.0% of the time/);
    for (const t of [winnerLed, ledAndLost])
      assert.ok(t.includes('1,000 games'), `the denominator is missing: ${t}`);
  }));

test('a game the rate cannot classify gets silence, not a guess', () =>
  Promise.all([
    // Equal shots: there is no leader, so there is no relationship to state.
    heroRelation({ ash: 30, hsh: 30, as: 1, hs: 4, ...LEADERS_WIN }),
    // A game that ended level: no outcome to compare the rate against. The
    // archive holds these, and neither arm is reachable from the default
    // fixture — which is why both survived the first mutation pass.
    heroRelation({ ...BUF_LED_SHOTS, as: 3, hs: 3, ...LEADERS_WIN }),
  ]).then(([noLeader, noWinner]) => {
    assert.equal(noLeader, '', `equal shots were classified anyway: ${noLeader}`);
    assert.equal(noWinner, '', `a level game was classified anyway: ${noWinner}`);
  }));

test('the rates share one reference class, and a disagreement is SHOWN', () => {
  // The population used to ride on every row of a list that no longer exists.
  // Stating it once is only honest while the three rows agree — if they ever
  // differ, printing the first would publish two rates under a reference class
  // belonging to one of them, which is the thing this site teaches against.
  const same = run({ docs: ALL });
  return same.settle().then(() => {
    const t = textOf(same.ids.scale);
    assert.equal((t.match(/NHL regular season and playoffs/g) || []).length, 1,
      'the population is repeated, which is what the deleted list was doing');

    const split = { ...MEASURES, baseRates: { ...MEASURES.baseRates,
      moreLevelControlLost: { ...MEASURES.baseRates.moreLevelControlLost,
                              population: 'NHL regular season only' } } };
    const r = run({ docs: { ...ALL, 'measures.json': split } });
    return r.settle().then(() => {
      const u = textOf(r.ids.scale);
      assert.match(u, /NHL regular season and playoffs/);
      assert.match(u, /NHL regular season only/,
        'two reference classes, and the page showed one of them');
    });
  });
});

test('the hero is the ONLY route to the game it shows, and both halves agree', () => {
  // THIS TEST HAS BEEN WRONG TWICE AND THE HISTORY IS THE POINT.
  //
  // v1 asserted `game.html?game=2023020867` — right when written, because the
  // hero WAS featured[0] and so was a second "New to hockey? Start with the game
  // at the top" link. §5.2 made the hero most-recent, the link's href stayed on
  // featured[0], and this test went green straight through it: a literal id
  // cannot see a relationship, it only ever knew the answer.
  //
  // v2 pinned the relationship instead — frame, hero button and novice link name
  // ONE game. Correct, and it outlived its subject by a day: CHENG's reorder put
  // the thesis above the hero, which made the second link a button to the same
  // place 2.4 screens lower, and it was deleted.
  //
  // So v3 asserts what is now true and is the reason the link went: there is one
  // route to this game, the frame and the button agree on which game it is, and
  // NOTHING ELSE ON THE PAGE offers a second door to it. That last clause is the
  // part a literal could never have carried.
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    const id = h => { const m = String(h || '').match(/game=(\d+)/); return m && m[1]; };
    const frame = walk(r.ids.heroframe).find(n => n.tag === 'iframe');
    const top = id(frame.src);
    assert.ok(top, 'the hero frame names no game, so there is no game at the top');
    assert.equal(id(r.ids.herogo.href), top, "the hero's own button leaves its own game");

    // NO SECOND DOOR TO IT, from anywhere on the page. Collected across EVERY id
    // the script touched rather than by walking `main`: this fake stores ids
    // flat, so #herogo is not a child of #main here even though it is in the
    // real document, and a walk from one root would have missed the very link
    // the deleted one used to duplicate.
    const routes = [...new Set(Object.values(r.ids).flatMap(n => walk(n))
      .map(x => x.href).filter(h => id(h) === top))];
    assert.equal(routes.length, 1,
      `${routes.length} doors to the same game: ${routes.join(', ')}`);

    // And the deleted element is really gone, markup and script both, so it
    // cannot come back as a phantom the fake would have invented.
    assert.doesNotMatch(html, /id="start"/, 'the second link is back in the markup');
    assert.doesNotMatch(script, /\$\('start'\)/, 'the script still reaches for it');
  });
});

test('a missing measurement is stated, and the rest of the page still works', () => {
  // Partial failure must not be total failure: a fan looking for their team does
  // not care that the archive-wide rates are unavailable.
  const r = run({ docs: { 'catalog.json': CATALOG, 'index.json': INDEX } });
  return r.settle().then(() => {
    assert.match(textOf(r.ids.scale), /could not be loaded/i);
    assert.equal(walk(r.ids.teams).filter(n => n.className === 'chip').length, 3,
      'the team grid is unaffected');
    // AND THE NOVICE LINK STILL OFFERS A GAME. It used to be set from the
    // measurement, so a missing measurement left it on the markup's fallback;
    // it is now set from the CATALOG, beside the hero it names, so it survives
    // exactly what the hero survives. That is the point of the move — the
    // archive-wide rates being unavailable has nothing to do with which game is
    // at the top of the page.
    // AND THE HERO SURVIVES IT. The hero is built from the CATALOG; the rates
    // come from the measurement. A visitor who cannot be told the archive-wide
    // finding can still be handed a game to watch, which is the conversion.
    const frame = walk(r.ids.heroframe).find(n => n.tag === 'iframe');
    assert.ok(frame, 'a missing measurement took the hero down with it');
    assert.match(r.ids.herogo.href, /^game\.html\?game=\d+$/, 'and its button still names a game');
    // The caption that COMPARES this game to the rate cannot be written without
    // the rate, so it says nothing rather than guessing.
    assert.equal(textOf(r.ids.herorel), '',
      'the page claimed this game was usual or unusual with no rate to judge by');
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


test('a team opens on its most recent season, not on 259 rows', () => {
  // WHAT THE LIVE DATA SHOWED. Buffalo have 259 games in the archive, and the
  // first build rendered every one of them — a wall, and the opposite of the
  // brief. The season is the unit a hockey fan thinks in, so it is the unit here.
  const r = run({ search: '?team=BUF', docs: MULTI_DOCS });
  return r.settle().then(() => {
    const rows = walk(r.ids.main).filter(n => n.tag === 'li');
    assert.equal(rows.length, 2, 'only 2025-26');
    // FIVE, not four: the ARI-at-BUF row is a Buffalo game too. Counting the
    // fixture by eye got this wrong before the code did.
    assert.match(textOf(r.ids.main), /5 games in the archive/,
      'the full count is still stated, so nothing looks hidden');
  });
});

test('another season is one click, and the URL carries it', () => {
  const r = run({ search: '?team=BUF&season=2023', docs: MULTI_DOCS });
  return r.settle().then(() => {
    const ids = linksOf(r.ids.main).filter(h => h.startsWith('game.html'));
    assert.deepEqual(ids, ['game.html?game=2023020400', 'game.html?game=2023020100'],
      'both 2023-24 games, newest first — including the one Arizona visited for');
    const bar = walk(r.ids.main).filter(n => /season=/.test(n.href));
    assert.deepEqual(bar.map(a => a.textContent), ['2025-26', '2024-25', '2023-24'],
      'newest first, and every season this team played is reachable');
    assert.equal(bar.find(a => a.className === 'on').textContent, '2023-24',
      'the one you are looking at is marked');
  });
});

test('a team defaults to ITS newest season, not the archive\'s', () => {
  // MUTATION GUARD, and it is the Arizona case. Defaulting to the newest season
  // in the archive would show a fan an empty page for a club we hold 82 games of
  // — and the empty page would look like a bug in the data, not in the default.
  const r = run({ search: '?team=ARI', docs: MULTI_DOCS });
  return r.settle().then(() => {
    assert.equal(walk(r.ids.main).filter(n => n.tag === 'li').length, 1);
    assert.match(textOf(r.ids.main), /relocated to utah/i);
  });
});

test('a season switcher does not appear for a team with one season', () => {
  const r = run({ search: '?team=OTT', docs: MULTI_DOCS });
  return r.settle().then(() => {
    assert.equal(walk(r.ids.main).filter(n => /season=/.test(n.href)).length, 0,
      'one season needs no switcher — furniture with nothing to do');
  });
});

test('an unknown season falls back rather than showing nothing', () => {
  const r = run({ search: '?team=BUF&season=1998', docs: MULTI_DOCS });
  return r.settle().then(() => {
    assert.equal(walk(r.ids.main).filter(n => n.tag === 'li').length, 2,
      'a season we do not hold lands on the newest we do');
  });
});

/**
 * THE HERO IS A GAME, PLAYING — and it is the MOST RECENT one.
 *
 * It used to be `featured[0]`, the archive's largest level-control upset. Only 2
 * games in 4,119 clear that threshold, so the slot would have read "19 February
 * 2024" for years: a rule that updates twice per three seasons is a literal with
 * extra steps, which is the defect docs/homepage.md §1 flagged in the hard-coded
 * hero before it. Recency is MORE deterministic — the same rule the game page
 * already uses, unable to be typed, refreshing nightly with no deploy.
 *
 * WHAT THE OLD TESTS HELD, and where each went, because a rewrite is where
 * coverage disappears silently:
 *   - "named from the catalog"        → kept, below, against the new rule
 *   - "reads the score home or away"  → kept as the SHOT LEADER, home or away.
 *                                       That test existed because a mutation
 *                                       survived; the mutation still applies.
 *   - "names no game when none"       → kept: an archive with nothing in scope
 *   - "a hero the catalog cannot confirm" → GONE BY CONSTRUCTION. The hero is now
 *                                       read FROM the catalog, so it cannot name
 *                                       a game the catalog lacks. The half that
 *                                       still bites — a REFUSED game must never
 *                                       be chosen — is asserted below.
 */
test('the front door leads with the most recent game, and it PLAYS', () => {
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    assert.equal(r.ids.hero.hidden, false, 'the hero never appeared');
    // 2023020200 is the newest in-scope viewable game in the fixture: TOR at BUF,
    // BUF 4-1. Not 2023020300 (refused, and later) and not the Olympics game
    // (later still, and out of scope).
    assert.match(r.ids.heroline.textContent, /^TOR 1, BUF 4 — 9 February 2024$/);
    assert.equal(r.ids.herogo.href, 'game.html?game=2023020200');

    // THE FRAME IS THE REAL RENDERER, not a recording — and it is built in
    // script, so its id comes from the catalog and it never loads for a visitor
    // who does not reach a game.
    const frame = walk(r.ids.heroframe).find(n => n.tag === 'iframe');
    assert.ok(frame, 'the hero has no moving picture at all');
    assert.equal(frame.src, 'game.html?game=2023020200&preview=1');
    assert.equal(frame.attrs.loading, 'lazy', 'the frame loads eagerly on every visit');
    assert.ok(frame.attrs.title && /TOR/.test(frame.attrs.title), 'the frame is unnamed to a screen reader');
  });
});

test('the shot line reads the LEADER, home or away, and says it both ways round', () => {
  // THE MUTATION THAT SURVIVED ONCE ALREADY, in the same slot: the fixture's
  // newest game has the HOME side leading shots, so reading the home side is
  // indistinguishable from reading the leader. The second fixture has the away
  // side leading, and losing.
  const home = run({ docs: ALL });
  const p1 = home.settle().then(() => {
    assert.match(home.ids.herosub.textContent, /^BUF put more shots on goal, 33 to 22, and won\.$/);
  });

  // BUF away, 30 shots to 20, and lost 2-5. The shot leader losing is the site's
  // thesis at its smallest — and it must be said in the same shape as the
  // winning case, or we are only showing the surprising half (Doctrine §9).
  const AWAY = { games: [CATALOG.games[0]] };
  const away = run({ docs: { ...ALL, 'catalog.json': AWAY } });
  const p2 = away.settle().then(() => {
    assert.match(away.ids.herosub.textContent, /^BUF put more shots on goal, 30 to 20, and lost\.$/);
  });

  // And an even shot count says so rather than picking a side.
  const EVEN = { games: [{ ...CATALOG.games[1], ash: 27, hsh: 27 }] };
  const even = run({ docs: { ...ALL, 'catalog.json': EVEN } });
  const p3 = even.settle().then(() => {
    assert.match(even.ids.herosub.textContent, /^Both teams put 27 shots on goal\.$/);
  });
  return Promise.all([p1, p2, p3]);
});

test('a refused or out-of-scope game is never the hero', () => {
  // The fixture is built for this: the refused game (2024-03-11) and the Olympic
  // game (2026-02-22) are both LATER than the one that should win, so a `newest`
  // that forgot either filter would pick the wrong game rather than none.
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    assert.doesNotMatch(r.ids.herogo.href, /2023020300/, 'a refused game became the front door');
    assert.doesNotMatch(r.ids.herogo.href, /2025090030/, 'an Olympic game became the front door');
  });
});

/** Shown means the code REVEALED it. An untouched element is not shown either —
 *  the markup ships it `hidden`, and the fake only creates ids the script asks
 *  for, so `!ids.hero` and `ids.hero.hidden` are the same fact. */
const heroShown = r => !!(r.ids.hero && r.ids.hero.hidden === false);

test('the hero names no game when the archive holds none it may show', () => {
  // A hero with a typed fallback is a claim that outlives its data. Absent is the
  // honest state, and the rest of the page still works.
  const NONE = { games: CATALOG.games.filter(g => !g.v || String(g.id).slice(4, 6) !== '02') };
  const r = run({ docs: { ...ALL, 'catalog.json': NONE } });
  return r.settle().then(() => {
    assert.equal(heroShown(r), false, 'a hero appeared with nothing behind it');
    assert.equal(walk(r.ids.heroframe).filter(n => n.tag === 'iframe').length, 0,
      'a frame was created for a game that cannot be shown');
  });
});

test('a team view shows no hero — that visitor already chose', () => {
  const r = run({ search: '?team=BUF', docs: ALL });
  return r.settle().then(() => {
    assert.equal(heroShown(r), false, 'a featured game on a page the fan already chose');
    // Paired, so "no hero" cannot pass because the page rendered nothing at all.
    assert.ok(linksOf(r.ids.main).some(h => /^game\.html/.test(h)),
      'the team view itself did not render');
  });
});

/**
 * THREE POINTS ON ONE SCALE, WITH 50% MARKED — and the two conditions that keep
 * it on the right side of the rule we wrote against plotting the cumulative
 * curve. That curve had ~35 points, a continuous domain and an uninformative
 * tail; this has three, a NOMINAL domain and n in the thousands.
 */
test('the scale marks 50% and places every point at its own measured rate', () => {
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    const scale = r.ids.scale;
    assert.equal(scale.hidden, false, 'the scale never rendered');
    const pts = walk(scale).filter(n => /(^| )pt( |$)/.test(n.className));
    assert.equal(pts.length, 3, 'one point per rate');
    // Positions are the rates themselves, recomputed here from count and n.
    const want = ['moreShotsOnGoalLost', 'moreAttemptsLost', 'moreLevelControlLost']
      .map(k => (MEASURES.baseRates[k].count / MEASURES.baseRates[k].n * 100).toFixed(1) + '%');
    assert.deepEqual(pts.map(p => p.style.left), want);
    // The 50% mark, once per row, is the whole point of the picture.
    assert.equal(walk(scale).filter(n => n.className === 'half').length, 3);
    // And the side of 50% each falls on is encoded, not left to the eye alone.
    assert.deepEqual(pts.map(p => /hi/.test(p.className)), [false, true, false],
      'only "more shot attempts" is above 50%');
  });
});

test('NO CONNECTING LINE, and every point keeps its own fraction', () => {
  // The two conditions, asserted rather than remembered. A segment between the
  // points is what asserts a continuum, and there is no measure BETWEEN "shots on
  // goal" and "shot attempts" for a continuum to run through.
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    const nodes = walk(r.ids.scale);
    for (const n of nodes)
      assert.ok(!/^(line|path|polyline|svg)$/.test(n.tag),
        `the scale drew a <${n.tag}>, which asserts a continuum that does not exist`);
    const fracs = nodes.filter(n => n.className === 'f').map(n => n.textContent);
    assert.equal(fracs.length, 3, 'every point carries its own fraction');
    for (const f of fracs)
      assert.match(f, /^\d+ of \d+ — \d+\.\d%$/, `"${f}" lost its denominator`);
  });
});

test('the payoff is stated, and it is computed from the count and the denominator', () => {
  // All three rates are published as "lost", which keeps them comparable — and
  // means the site never once says the thing a newcomer came for. 3855 − 1527.
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    const key = walk(r.ids.scale).find(n => n.className === 'key');
    assert.ok(key, 'the payoff line is missing');
    // The payoff must name the row it inverts, not arrive as a fourth number:
    // three rows read "lost" and this reads "won", and a reader scanning
    // 45.8 / 54.5 / 39.6 / 60.4 should not have to work out which way each runs.
    assert.match(textOf(key), /the same games counted the other way/);
    assert.match(textOf(key), /60\.4% — 2328 of 3855 — they won\./);
    assert.doesNotMatch(textOf(key), /\bso\b|\btherefore\b|\bbecause\b|\bproving\b/i,
      'the payoff argues instead of reporting');
  });
});

/**
 * THE PAGE SAYS WHAT IT IS, AND NAMES WHAT IT TEACHES.
 *
 * Kevin: "the home page doesn't give much of a clue as to what the purpose of
 * the website is — no mention of icing, offsides, faceoffs, corsi, high danger
 * shots, goalie views." Counted on the shipped page before this change: icing 0,
 * offside 0, Corsi 0, high-danger 0, empty net 0, penalty 0. That is a measured
 * gap, not a matter of taste — a site that teaches you to read hockey named
 * almost nothing it teaches.
 */
test('the page states what it is, above everything else', () => {
  const body = html.match(/<h1>([\s\S]*?)<h2/)[1];
  assert.match(body, /class="says"/, 'nothing above the fold says what this is');
  const says = body.match(/class="says">([\s\S]*?)<\/p>/)[1];
  assert.ok(says.length > 60, `"${says}" is not a sentence`);
  // NO TYPED NUMBERS, the same rule the thesis paragraph carries: every count on
  // this page is fetched and rendered, so a number in static copy is a claim
  // that goes stale between deploys. "since 2023" is a scope claim, and scope
  // does not move.
  assert.doesNotMatch(says.replace(/since 2023/, ''), /\d[\d,]{2,}/,
    'a count was typed into copy that cannot be re-derived');
});

test('every concept the site teaches is NAMED on the front page', () => {
  // The list is the layers and the whistle rules that actually exist. If one is
  // added or removed, this is where the page and the product fall out of step.
  for (const word of ['Icing', 'Offside', 'Faceoffs', 'Penalties', 'empty net',
                      'Control', 'Shots from the slot', 'Goaltending'])
    assert.ok(html.includes(word), `the front page never mentions ${word}`);
});

test('the rules and OUR measurements are kept apart', () => {
  // Merging them would let our measurements borrow the rulebook's authority.
  // Icing is the NHL's; "shots from the slot" is a rule we wrote, and the page
  // has to say which is which.
  const block = html.match(/<div class="conc">([\s\S]*?)<\/div>/)[1];
  const heads = [...block.matchAll(/class="ck">([\s\S]*?)<\/p>/g)].map(m => m[1]);
  assert.equal(heads.length, 2, 'the two kinds of concept are not separated');
  assert.match(heads[0], /rules/i, 'the first group is not named as the league\'s');
  assert.match(heads[1], /we count|our own/i, 'the second group does not say it is ours');

  // And each concept sits under the right heading.
  const [game, ours] = block.split(heads[1]);
  for (const w of ['Icing', 'Offside', 'Penalties']) assert.ok(game.includes(w), `${w} is not under the rules`);
  for (const w of ['Control', 'Shots from the slot', 'Goaltending'])
    assert.ok(ours.includes(w), `${w} is not listed as ours`);
});

test('the borrowed term is gone from every page a reader sees', () => {
  // "High-danger" is a term of art with published definitions that are not ours,
  // so our count would disagree with a count a reader looks up and they would
  // conclude we are wrong rather than different. Internal identifiers keep the
  // old name; only user-facing copy changed, so this checks the copy.
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    const visible = page
      .replace(/<script>[\s\S]*?<\/script>/g, '')   // identifiers and comments
      .replace(/<style>[\s\S]*?<\/style>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(visible, /high[- ]danger/i,
      `${name} still shows a reader the borrowed term`);
  }
});
