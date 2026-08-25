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
    // ONLY AN IFRAME HAS A contentWindow. The hero accepts its attempt totals
    // only from the frame it made, and giving every element one would have made
    // that check pass for any sender -- the invents-elements defect above, in a
    // property instead of an id.
    ...(tag === 'iframe' ? { contentWindow: { isFrame: true } } : {}),
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

/* THE GAME THE HERO PICKS, DERIVED THE WAY THE PAGE DERIVES IT -- newest, in
   scope, published. A typed literal here would be a test pinning its own answer:
   add a newer row to the fixture and the constant silently names the wrong game
   while every assertion still passes. */
const NEWEST_ID = CATALOG.games
  .filter(g => g.v && /^(02|03)$/.test(String(g.id).slice(4, 6)))
  .sort((a, b) => (a.d === b.d ? a.id - b.id : (a.d < b.d ? -1 : 1)))
  .pop().id;

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

const ORIGIN = 'https://readthegame.co';

function run({ search = '', docs = {} } = {}) {
  const { ids, document } = fakeDom();
  const fetch = url => {
    const key = Object.keys(docs).find(k => url.includes(k));
    return Promise.resolve(key
      ? { ok: true, json: () => Promise.resolve(docs[key]) }
      : { ok: false, json: () => Promise.resolve(null) });
  };
  /* THE FRAME TALKS BACK. The hero's sentence is about shot attempts, which only
     the preview frame can compute -- so the page listens, and a harness with no
     `window` could not boot it at all, let alone see the message. */
  const heard = {};
  const win = { addEventListener: (t, fn) => (heard[t] = heard[t] || []).push(fn) };
  new Function('document', 'fetch', 'location', 'window', script)(
    document, fetch, { search, origin: ORIGIN }, win);
  const frame = () => (ids.heroframe && ids.heroframe.kids[0]) || null;
  return {
    ids,
    settle: () => new Promise(r => setTimeout(r, 0)),
    /** Deliver what the preview frame posts. Defaults are the honest case; a
        test overrides them to check that a forged sender is refused. */
    post: (data, o = {}) => (heard.message || []).forEach(fn => fn({
      origin: 'origin' in o ? o.origin : ORIGIN,
      source: 'source' in o ? o.source : (frame() && frame().contentWindow),
      data })),
  };
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

test('the date browse arrives WITH the chips, and never dangles without them', async () => {
  // C1's front-door entry (docs/discovery.md §10.4). It is revealed by drawGrid
  // rather than sitting in the markup, and this test is why: `#teams-h`, its
  // note and the empty `.teams` div all stay on screen when a team is chosen,
  // so a statically-visible line would hang under an empty box on every team
  // page saying "or browse by date" for no reason.
  //
  // TWO HALVES, AND EITHER ALONE IS SATISFIED BY A BUG. "The script never
  // touched it" only means hidden if the markup says hidden — so the markup is
  // asserted too, in the same test, rather than trusted.
  assert.match(html, /<p class="bydate" id="bydate" hidden>/,
    'the line is hidden until something reveals it');
  const front = run({ docs: ALL });
  await front.settle();
  assert.equal(front.ids.bydate.hidden, false, 'shown on the front door');
  const team = run({ search: '?team=BUF', docs: ALL });
  await team.settle();
  assert.equal(team.ids.bydate, undefined,
    'never even asked for on a team page, so the markup’s hidden stands');
});

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
/* THE MEASURE IS ATTEMPTS NOW, AND IT ARRIVES FROM THE FRAME. The catalog's
   shots are deliberately NOT what this reads: the loop above the sentence counts
   attempts, so the sentence counts attempts, and the only thing that can compute
   them is the preview. `ash`/`hsh` stay on the row and are ignored on purpose --
   if the page ever reads them again this fixture makes the wrong number
   obvious, because they disagree with the posted totals. */
function heroRelation({ aAtt, hAtt, as, hs, count, n }) {
  const cat = { games: [{ id: 2023020200, d: '2024-02-09', a: 'TOR', h: 'BUF',
                          as, hs, ash: 9, hsh: 9, t: 2, v: 1 }] };
  const measures = { ...MEASURES, baseRates: { ...MEASURES.baseRates,
    moreAttemptsLost: { what: 'the team with more shot attempts lost',
      population: 'NHL regular season and playoffs', n, count } } };
  const r = run({ docs: { ...ALL, 'catalog.json': cat, 'measures.json': measures } });
  return r.settle().then(() => {
    r.post({ rtg: 'attempts', game: 2023020200, a: aAtt, h: hAtt });
    return textOf(r.ids.herorel);
  });
}
// The attempts leader loses 20% of the time — so the leader USUALLY WINS, 80%.
const LEADERS_WIN = { count: 200, n: 1000 };
// And the mirror: the leader loses 80% of the time.
const LEADERS_LOSE = { count: 800, n: 1000 };
// TOR away, BUF home. `aAtt`/`hAtt` are attempts, `as`/`hs` goals.
const BUF_LED_SHOTS = { aAtt: 22, hAtt: 33 };

/**
 * ⭐ RETARGETED 2026-08-25, AND THE HALF THAT MATTERED IS KEPT.
 *
 * This asserted "That is the usual outcome." — a sentence that classified THIS
 * game against the rate, and therefore stated who won. Kevin, reading the front
 * door: "we still give away the outcome of the game." The clause is gone.
 *
 * WHAT SURVIVES IS THE MUTATION THE OLD TEST EXISTED FOR: the rate's own
 * direction is READ, not assumed. The archive publishes every rate as "lost",
 * so a caption saying the leader WINS must print 100 minus that. A hard-coded
 * "leaders usually lose" passes half of this and fails the other half.
 *
 * WHAT IS NEW is the claim the change is about, and it needs the four fixtures
 * the old test used: whichever way the game went, the caption must not say.
 */
test('the hero caption reads the rate BOTH WAYS and never states this outcome', () =>
  Promise.all([
    heroRelation({ ...BUF_LED_SHOTS, as: 1, hs: 4, ...LEADERS_WIN }),
    heroRelation({ ...BUF_LED_SHOTS, as: 4, hs: 1, ...LEADERS_WIN }),
    heroRelation({ ...BUF_LED_SHOTS, as: 4, hs: 1, ...LEADERS_LOSE }),
    heroRelation({ ...BUF_LED_SHOTS, as: 1, hs: 4, ...LEADERS_LOSE }),
  ]).then(([winnerLed, winnerTrailed, ledAndLost, ledAndWon]) => {
    // Same rate, opposite games: the caption must be IDENTICAL, because the
    // only thing it is allowed to describe is the archive.
    assert.equal(winnerLed, winnerTrailed,
      'the caption changed with the result — it is still describing this game');
    assert.equal(ledAndLost, ledAndWon);

    // AND THE PERCENTAGE IS THE ONE IT JUST NAMED.
    assert.match(winnerLed, /wins 80\.0% of the time/);
    assert.match(ledAndLost, /loses 80\.0% of the time/);
    for (const t of [winnerLed, ledAndLost])
      assert.ok(t.includes('1,000 games'), `the denominator is missing: ${t}`);

    // THE SPOILER, NAMED. BUF led attempts in every fixture; in two of them BUF
    // won and in two BUF lost, so any verb of outcome would have to appear.
    for (const t of [winnerLed, winnerTrailed, ledAndLost, ledAndWon])
      assert.doesNotMatch(t, /\b(won|lost|usual outcome|the game was level)\b/,
        `the caption states how the game ended: "${t}"`);
  }));

test('with no attempts leader there is nothing to say, and it says nothing', () =>
  Promise.all([
    // Equal attempts: there is no leader, so there is no subject for the rate.
    heroRelation({ aAtt: 30, hAtt: 30, as: 1, hs: 4, ...LEADERS_WIN }),
    // ⭐ A GAME THAT ENDED LEVEL USED TO BE SILENT TOO, AND THAT RULE RETIRED
    // WITH ITS REASON. The caption classified this game against the rate, and a
    // draw could not be classified. It no longer classifies anything — the rate
    // is a fact about the archive — so the only thing that can withhold it is
    // having no leader. When you delete a condition, say which one and why.
    heroRelation({ ...BUF_LED_SHOTS, as: 3, hs: 3, ...LEADERS_WIN }),
  ]).then(([noLeader, levelGame]) => {
    assert.equal(noLeader, '', `equal attempts were given a rate anyway: ${noLeader}`);
    assert.match(levelGame, /wins 80\.0% of the time/,
      'a level game lost its rate — that condition was about the outcome clause');
  }));

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
/**
 * ⭐ THE HERO PREFERS A GAME WHOSE REPLAY REACHES A GOAL — AND SAYS SO.
 *
 * The loop now ends on the first goal instead of running out a budget (Kevin:
 * "let's end the hero replay right after the goal ... maybe 10 seconds between
 * the start of the replay and the goal"), so the front door picks the most
 * recent game that HAS one in reach. `hl` is that distance, written by
 * derive.py.
 *
 * BOTH BRANCHES, BECAUSE THE SENTENCE ABOVE THE RINK IS DIFFERENT IN EACH. The
 * kicker used to be a fixed line in the markup reading "The most recent game in
 * the archive", and that line survived the selection rule changing underneath it
 * — true for as long as the hero was the newest game, false the moment it was
 * not. It is now written by whichever branch fired, and neither test alone can
 * tell a page that picks correctly from one that always prints one sentence.
 */
test('the hero takes an older game to get a goal, and the kicker says which rule ran', () => {
  // 2023020100 is OLDER than the newest in-scope game, and it is the only row
  // with a loop inside the window. Choosing it is therefore a real preference,
  // not the newest game wearing a new field.
  const cat = { games: CATALOG.games.map(g =>
    g.id === 2023020100 ? { ...g, hl: 5 } : g) };
  assert.notEqual(2023020100, NEWEST_ID,
    'the qualifying game must not also be the newest, or this proves nothing');
  const r = run({ docs: { ...ALL, 'catalog.json': cat } });
  return r.settle().then(() => {
    assert.equal(r.ids.herogo.href, 'game.html?game=2023020100',
      'the hero ignored the game whose replay reaches a goal');
    assert.match(r.ids.herokick.textContent, /up to its first goal/,
      'the kicker still describes the rule that did not run');
  });
});

test('and with no game in reach it falls back to the newest, and says THAT', () => {
  // No row carries `hl`, which is the state of the published catalog until the
  // archive is re-derived — and a front door with no game is worse than one that
  // opens quietly, so the fallback is the behaviour, not an error.
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    assert.equal(r.ids.herogo.href, 'game.html?game=' + NEWEST_ID);
    assert.match(r.ids.herokick.textContent, /most recent game/,
      'the kicker promised a goal the fallback loop will not reach');
  });
});

test('a loop OUTSIDE the window is not a hero', () => {
  // The floor exists because `hl` is an estimate that can only run long, and the
  // ceiling because the loop has to fit in the taste. A row carrying the field
  // is not automatically eligible — otherwise the window is decoration.
  //
  // ⚠️ AWAITED, AND THAT IS NOT A DETAIL. Written as a bare `.then()` inside the
  // loop, every assertion below settles AFTER the test has already passed, and
  // the whole case is green without running — the "tests that pass by not
  // running" shape this project has been bitten by before. Promise.all is what
  // makes the loop a check.
  return Promise.all([1, 2, 9, 30].map(hl => {
    const cat = { games: CATALOG.games.map(g =>
      g.id === 2023020100 ? { ...g, hl } : g) };
    const r = run({ docs: { ...ALL, 'catalog.json': cat } });
    return r.settle().then(() => {
      assert.equal(r.ids.herogo.href, 'game.html?game=' + NEWEST_ID,
        `a loop of ${hl} plays was accepted — it is outside [3,8]`);
    });
  }));
});

test('the front door leads with the most recent game, and it PLAYS', () => {
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    assert.equal(r.ids.hero.hidden, false, 'the hero never appeared');
    // 2023020200 is the newest in-scope viewable game in the fixture: TOR at BUF,
    // BUF 4-1. Not 2023020300 (refused, and later) and not the Olympics game
    // (later still, and out of scope).
    // WAS /^TOR 1, BUF 4 — 9 February 2024$/. The hero no longer prints the
    // final score: the loop builds to a goal and the line under it used to
    // answer the question that loop is asking. Both clubs and the date still
    // come from the catalog, which is what this assertion was ever about.
    assert.match(r.ids.heroline.textContent, /^TOR at BUF — 9 February 2024$/);
    assert.doesNotMatch(r.ids.heroline.textContent, /\d\D+\d.*—/,
      'the hero line is stating a score again');
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
    // ABSENT UNTIL THE FRAME SPEAKS, which is the site's own idiom -- the verdict
    // card is absent until the horn. Asserted before posting, because a sentence
    // that rendered on the catalog's shots and then rewrote itself would be
    // worse than either version.
    // NOT-YET-WRITTEN IS STRONGER THAN EMPTY HERE. This fake registers an id the
    // first time the page asks for it, so an untouched #herosub is absent from
    // `ids` entirely -- which proves the page never even reached for it.
    assert.ok(!home.ids.herosub || home.ids.herosub.textContent === '',
      'the sentence rendered before any measure existed');
    home.post({ rtg: 'attempts', game: NEWEST_ID, a: 22, h: 33 });
    // WAS `..., 33 to 22, and won.` — the outcome came off on 2026-08-25.
    assert.match(home.ids.herosub.textContent, /^BUF took more shot attempts, 33 to 22\.$/);
  });

  // BUF away, 30 attempts to 20, and lost 2-5.
  //
  // ⭐ THE DOCTRINE §9 HALF OF THIS RETIRED, AND SAY WHY RATHER THAN JUST
  // DELETING IT. The concern was selective honesty: the leader LOSING is the
  // site's thesis at its smallest, so it had to be said in the same shape as
  // the winning case or we would be showing only the surprising half. The
  // sentence no longer names the outcome in EITHER case, so there is no half to
  // select — §9 is satisfied structurally instead of by symmetry.
  // WHAT THIS STILL PROVES is the mutation it was written for: the page reads
  // the LEADER and not the home side. Home leads above, away leads here, and a
  // page that printed `g.h` unconditionally passes one and fails the other.
  const AWAY = { games: [CATALOG.games[0]] };
  const away = run({ docs: { ...ALL, 'catalog.json': AWAY } });
  const p2 = away.settle().then(() => {
    away.post({ rtg: 'attempts', game: AWAY.games[0].id, a: 30, h: 20 });
    assert.match(away.ids.herosub.textContent, /^BUF took more shot attempts, 30 to 20\.$/);
    assert.doesNotMatch(away.ids.herosub.textContent, /\b(won|lost)\b/,
      'the away-leader arm still states the result');
  });

  // And an even shot count says so rather than picking a side.
  const EVEN = { games: [{ ...CATALOG.games[1], ash: 27, hsh: 27 }] };
  const even = run({ docs: { ...ALL, 'catalog.json': EVEN } });
  const p3 = even.settle().then(() => {
    even.post({ rtg: 'attempts', game: EVEN.games[0].id, a: 27, h: 27 });
    assert.match(even.ids.herosub.textContent, /^Both teams took 27 shot attempts\.$/);
  });

  /* ⭐ AND IT IS REFUSED FROM ANYWHERE ELSE. The totals decide a sentence on the
     front door, so the page takes them only from the frame it made, at its own
     origin. Without this the checks are three lines nothing exercises. */
  const forged = run({ docs: ALL });
  const p4 = forged.settle().then(() => {
    forged.post({ rtg: 'attempts', game: NEWEST_ID, a: 99, h: 1 }, { origin: 'https://evil.example' });
    assert.ok(!forged.ids.herosub || forged.ids.herosub.textContent === '',
      'a cross-origin sender was believed');
    forged.post({ rtg: 'attempts', game: NEWEST_ID, a: 99, h: 1 }, { source: { isFrame: true } });
    assert.ok(!forged.ids.herosub || forged.ids.herosub.textContent === '',
      'a sender that is not our frame was believed');
    forged.post({ rtg: 'attempts', game: NEWEST_ID + 1, a: 99, h: 1 });
    assert.ok(!forged.ids.herosub || forged.ids.herosub.textContent === '',
      'totals for a DIFFERENT game were used');
  });
  return Promise.all([p1, p2, p3, p4]);
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
  // RETARGETED, NOT DELETED. This used to read the paragraph under an <h1>; the
  // <h1> is gone and the sentence became it. Kevin: "I think we lead with the
  // 'Every game since 2023' [sentence]". The claim is unchanged — the first
  // thing on the page says what the page is — so the test follows the sentence,
  // the same move as the attribution guard when the ice sublines were retired.
  const h1 = html.match(/<h1 class="says">([\s\S]*?)<\/h1>/);
  assert.ok(h1, 'the one sentence is no longer the page\'s heading');
  assert.ok(h1[1].length > 60, `"${h1[1]}" is not a sentence`);
  // AND IT IS FIRST. Anything above it is chrome, not content.
  const body = html.slice(html.indexOf('<div class="wrap">'));
  assert.ok(body.indexOf('<h1 class="says">') < body.indexOf('<main'),
    'something content-shaped sits above the sentence that says what this is');
  // NO TYPED NUMBERS: every count here is fetched and rendered, so a number in
  // static copy is a claim that goes stale between deploys. "since 2023" is a
  // scope claim, and scope does not move.
  assert.doesNotMatch(h1[1].replace(/since 2023/, ''), /\d[\d,]{2,}/,
    'a count was typed into copy that cannot be re-derived');
});

test('the one figure left on the front page carries its denominator', () => {
  // ALSO RETARGETED. "Every rate is published with its denominator and
  // population" read the three-bar scale, which Kevin cut. The DOCTRINE does not
  // retire with the element that happened to carry it — a rate without its
  // reference class is the thing this site teaches against. The hero caption is
  // now the only place the front page prints a figure, and it is computed:
  // "That is the usual outcome. Across 3,957 games the shot leader wins 54.2%."
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    r.post({ rtg: 'attempts', game: NEWEST_ID, a: 22, h: 33 });
    const cap = textOf(r.ids.herorel);   // #herorel is where drawHero writes it
    const pct = cap.match(/(\d+\.\d)%/);
    assert.ok(pct, `the hero caption prints no rate: "${cap.slice(0, 120)}"`);
    // The denominator must be in the SAME sentence, not merely on the page.
    const sentence = cap.split(/(?<=\.)\s/).find(x => x.includes(pct[0]));
    assert.match(sentence, /Across [\d,]+ games/,
      `"${sentence}" prints a rate with no reference class`);
  });
});

/* ------------------------------------------------------------------------
   TEN TESTS RETIRED HERE ON 2026-08-17, WITH THEIR SUBJECT.

   Kevin, with a screenshot of everything above the rink: "this is the area I
   would like removed... I think we lead with the 'Every game since 2023'
   [sentence], and then the promo rink, then the teams, then 'What this site
   does and does not claim', then the footer."

   So the <h1>, the thesis, and the three-bar scale are gone from the front
   door, and every assertion whose subject was one of those went with them:
   the published rates and their denominators, the 50% mark, the shared
   reference class, the payoff line, the missing-measurement statement, and
   the argument wrapper with its team-page hiding.

   NOT SILENTLY, AND NOT ALL OF THEM. Two were RETARGETED rather than deleted,
   because their subject survived somewhere else on the page: "the page states
   what it is" now reads the <h1> the one sentence became, and the
   denominator rule now reads the hero caption, which is the only place a
   figure is still printed. A doctrine does not retire because the element
   that happened to carry it did.
   --------------------------------------------------------------------- */

/* THESE TWO FOLLOWED THE CONTENT TO ITS OWN PAGE (2026-08-17).
   Kevin moved "What you can see here" off the home page: "I like the content,
   but not on the home page." The claims are unchanged and neither is about the
   FRONT page specifically — one says the site names what it teaches, the other
   says the league's rules and our own measurements are never merged. So they
   read what-you-can-see.html now. Deleting them because the markup moved would
   have retired a doctrine over an address. */
const learn = readFileSync(new URL('../src/what-you-can-see.html', import.meta.url), 'utf8');

test('every concept the site teaches is NAMED, on the page that exists to name them', () => {
  // The list is the layers and the whistle rules that actually exist. If one is
  // added or removed, this is where the page and the product fall out of step.
  for (const word of ['Icing', 'Offside', 'Faceoffs', 'Penalties', 'empty net',
                      'Control', 'Shots from the slot', 'Goaltending'])
    assert.ok(learn.includes(word), `the concepts page never mentions ${word}`);
});

test('and the page is REACHABLE, or naming them is worth nothing', () => {
  // A page nothing links to is a page nobody reads. The concepts used to be on
  // the front door; now they are one click away, and that click has to exist.
  assert.match(html, /href="\/what-you-can-see\.html"/,
    'the home page does not link to the page that names what the site teaches');
});

test('the rules and OUR measurements are kept apart', () => {
  // Merging them would let our measurements borrow the rulebook's authority.
  // Icing is the NHL's; "shots from the slot" is a rule we wrote, and the page
  // has to say which is which.
  // READ THE WHOLE PAGE, NOT A SLICE OF IT. This used to cut `.conc` out with a
  // non-greedy match up to the first `</div>`, which was correct while the
  // groups were flat `<ul>`s and silently truncated to the FIRST group the day
  // they became grids of cards -- so the test failed on a page that was right.
  // `.ck` appears nowhere else on this page, so the slice bought nothing.
  const block = learn;
  const heads = [...block.matchAll(/class="ck">([\s\S]*?)<\/p>/g)].map(m => m[1]);
  assert.equal(heads.length, 2, 'the two kinds of concept are not separated');
  assert.match(heads[0], /rules/i, "the first group is not named as the league's");
  assert.match(heads[1], /we count|our own/i, 'the second group does not say it is ours');

  const [game, ours] = block.split(heads[1]);
  for (const w of ['Icing', 'Offside', 'Penalties']) assert.ok(game.includes(w), `${w} is not under the rules`);
  for (const w of ['Control', 'Goaltending']) assert.ok(ours.includes(w), `${w} is not under our own`);
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

/* ────────────────────────────────────────────────────────────────────────────
   A URL THAT NAMES A CLUB HAS ALREADY ASKED

   Kevin, with a screenshot of `?team=WSH`: "the home page info crept onto the
   game page, which I don't care for." Measured live before it was changed:
   0.90 screens of front-door argument above "← All teams" at 1100px, 1.24 at
   390px, with the club's own name below the fold at both. `More WSH games` on
   a game page is the only route into that view.
   ──────────────────────────────────────────────────────────────────────────── */

