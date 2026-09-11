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
import { readFileSync, readdirSync } from 'node:fs';

const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
// EVERY BUILT PAGE, so a front-door link can be resolved against what exists
// rather than merely matched as a string — see the rules-strip tests below.
const SRC_DIR = new URL('../src/', import.meta.url);
const PAGES = new Set(readdirSync(SRC_DIR).filter(f => f.endsWith('.html')));
const PAGE_SRC = new Map([...PAGES].map(f =>
  [f, readFileSync(new URL(f, SRC_DIR), 'utf8')]));
const PAGES_TO_CHECK = Object.fromEntries(['index.html','game.html','read-the-game.html','goalie-eye-view.html']
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
function heroRelation({ aAtt, hAtt, as, hs, count, n, level }) {
  const cat = { games: [{ id: 2023020200, d: '2024-02-09', a: 'TOR', h: 'BUF',
                          as, hs, ash: 9, hsh: 9, t: 2, v: 1 }] };
  const measures = { ...MEASURES, baseRates: { ...MEASURES.baseRates,
    moreAttemptsLost: { what: 'the team with more shot attempts lost',
      population: 'NHL regular season and playoffs', n, count },
    /* `level` is optional: passing null REMOVES the second rate, which is the
       only way to test that the hero degrades to the single sentence rather
       than printing a dangling connective. */
    ...(level === undefined ? {} : { moreLevelControlLost: level }) } };
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

    /* AND THE FIGURE IS THE ONE IT JUST NAMED. A FRACTION SINCE 2026-09-10, not
       a percentage — the hero now states two rates with DIFFERENT denominators
       and a pair of percentages would print one `n` between them.

       ⭐ AND THE FRACTION IS THE SHARPER PROBE HERE, which the percentage was
       not. Both fixtures print the same COUNT — `LEADERS_WIN` is 200 of 1,000 so
       the leader takes 800, `LEADERS_LOSE` is 800 of 1,000 so the leader loses
       800 — so the only thing separating these two assertions is the VERB, which
       is precisely the direction this test exists to pin. */
    assert.match(winnerLed, /wins 800 of 1,000 games/);
    assert.match(ledAndLost, /loses 800 of 1,000 games/);

    // THE SPOILER, NAMED. BUF led attempts in every fixture; in two of them BUF
    // won and in two BUF lost, so any verb of outcome would have to appear.
    for (const t of [winnerLed, winnerTrailed, ledAndLost, ledAndWon])
      assert.doesNotMatch(t, /\b(won|lost|usual outcome|the game was level)\b/,
        `the caption states how the game ended: "${t}"`);
  }));

/**
 * ⭐⭐ THE LAST CONDITION WENT ON 2026-09-09, AND IT WAS COSTING THE SITE ITS
 * ONLY CLAIM.
 *
 * This test used to assert the opposite of what it asserts now — that equal
 * attempts produce `''`. The reasoning was "no leader, no subject for the rate",
 * which is the CLASSIFYING caption's logic outliving the classifying caption:
 * it is only coherent while the sentence is about this game. Once the sentence
 * describes the archive and nothing else, a tie here is not a fact about the
 * archive and cannot withhold one.
 *
 * ⛔ WHAT MADE IT URGENT WAS A SCREENSHOT, NOT AN ARGUMENT. The live hero on
 * 2026-09-09 is CAR at VGK, 9 June 2026, **tied 52–52 on attempts** — so the
 * front door read `Both teams took 52 shot attempts.` and then stopped, with the
 * flagship finding rendering empty. The hero moves only when the archive does
 * and the archive does not move until the season opens, so this was the whole
 * claim of the front page for three months, with every test in this file green.
 *
 * ⭐ THE GENERAL SHAPE, because it is the third time here: a condition survived
 * the reason that justified it. The cure that worked was not re-reading the
 * code — it was asking what the branch DOES when it fires.
 *
 * WHAT STILL WITHHOLDS THE RATE is zero attempts on both sides, and that one is
 * about this game: the rate sits under a count of the hero's own attempts, and
 * with no count above it, it is a statistic with nothing to be about.
 */
test('a tie still states the archive rate — the rate is about the ARCHIVE', () =>
  Promise.all([
    // Equal attempts: no leader, and the rate is unchanged by that.
    heroRelation({ aAtt: 30, hAtt: 30, as: 1, hs: 4, ...LEADERS_WIN }),
    // A game that ended level. Silent once, for the outcome clause's sake.
    heroRelation({ ...BUF_LED_SHOTS, as: 3, hs: 3, ...LEADERS_WIN }),
    // The leader case, as the control: the same rate, the same words.
    heroRelation({ ...BUF_LED_SHOTS, as: 1, hs: 4, ...LEADERS_WIN }),
  ]).then(([noLeader, levelGame, hasLeader]) => {
    assert.match(noLeader, /wins 800 of 1,000 games/,
      'the hero states no finding at all when the two teams tie on attempts');
    assert.match(levelGame, /wins 800 of 1,000 games/,
      'a level game lost its rate — that condition was about the outcome clause');

    // ⭐ AND IT IS THE SAME SENTENCE. A tie must not earn its own wording, or the
    // page would be describing THIS game again by choosing how to phrase itself.
    assert.equal(noLeader, hasLeader,
      'the tie gets a different sentence — the caption is describing the game again');
    // The denominator travels with it, on every branch.
    assert.ok(noLeader.includes('of 1,000 games'), `the denominator is missing: ${noLeader}`);
  }));

test('⭐ …but a hero that counted nothing still says nothing', () =>
  // THE PAIRED HALF, and it is the condition that survives. "Always print the
  // rate" is satisfied by a page that prints it under an empty scoreboard, which
  // is a statistic with nothing to be about — and it is what this change would
  // have shipped if the gate had simply been deleted rather than narrowed.
  heroRelation({ aAtt: 0, hAtt: 0, as: 1, hs: 4, ...LEADERS_WIN })
    .then(none => assert.equal(none, '',
      `a rate was printed for a hero with no attempts counted: ${none}`)));

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
  // `ha` JOINED THE SEED ON 2026-09-11. The rule reads two fields now — a loop
  // inside the window AND a counter that reaches the floor — so a row carrying
  // only `hl` no longer qualifies, and seeding only `hl` would make this test
  // assert the fallback while claiming to assert the preference.
  const cat = { games: CATALOG.games.map(g =>
    g.id === 2023020100 ? { ...g, hl: 5, ha: 4 } : g) };
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
  // ⚠️ THE COUNTER IS HELD ABOVE ITS FLOOR SO THE WINDOW IS THE ONLY VARIABLE.
  // Without `ha` these rows would be rejected for the OTHER reason and the test
  // would pass no matter what the window did — a check satisfied by the wrong
  // mechanism, which is this project's most-repeated defect.
  return Promise.all([1, 2, 9, 30].map(hl => {
    const cat = { games: CATALOG.games.map(g =>
      g.id === 2023020100 ? { ...g, hl, ha: 9 } : g) };
    const r = run({ docs: { ...ALL, 'catalog.json': cat } });
    return r.settle().then(() => {
      assert.equal(r.ids.herogo.href, 'game.html?game=' + NEWEST_ID,
        `a loop of ${hl} plays was accepted — it is outside [3,8]`);
    });
  }));
});

/**
 * ⭐⭐ THE COUNTER FLOOR — AND THE PAIR IS WHAT MAKES IT A CHECK.
 *
 * `hl` counts PLAYS and the h1 promises "the counts built in front of you", so
 * the hero is chosen on the attempt counter as well as the loop length. The two
 * come apart: measured over the whole archive, inside [3,8] the counter reaches
 * a median of 3 and a p10 of 2, and the hero live on 2026-09-11 reached 2.
 *
 * NEITHER HALF IS SAFE ALONE, the same shape as the ends-switching pair.
 * "A low counter is rejected" is satisfied by a rule that rejects the game for
 * its LOOP, or for being the wrong id, or by a page that never picks anything;
 * "a high counter is accepted" is satisfied by a rule that ignores the counter
 * entirely. The two rows differ in `ha` and in nothing else, so only a reader
 * that actually reads `ha` passes both.
 */
test('a game whose counter never gets going is not a hero, and one that does IS', () => {
  const seed = ha => ({ games: CATALOG.games.map(g =>
    g.id === 2023020100 ? { ...g, hl: 5, ha } : g) });
  const below = run({ docs: { ...ALL, 'catalog.json': seed(2) } });
  const above = run({ docs: { ...ALL, 'catalog.json': seed(3) } });
  return Promise.all([
    below.settle().then(() => {
      assert.equal(below.ids.herogo.href, 'game.html?game=' + NEWEST_ID,
        'a loop whose counter moves twice was accepted as the front door');
      assert.match(below.ids.herokick.textContent, /most recent game/,
        'it fell back, so the kicker must say so rather than promise a goal');
    }),
    above.settle().then(() => {
      assert.equal(above.ids.herogo.href, 'game.html?game=2023020100',
        'the SAME game one attempt higher was rejected — the floor is off by one '
        + 'or the counter is not being read at all');
    }),
  ]);
});

test('a loop with no counter recorded is not a hero either', () => {
  // The migration state, stated as behaviour rather than left to be discovered:
  // `ha` arrives with a derivation, so between the reader deploying and that run
  // finishing every row carries `hl` and none carries `ha`. The front door falls
  // back to the newest game and says so — exactly what `hl` itself did on its
  // first day. A reader treating the absence as "no opinion" would be kinder for
  // half an hour and would hide the field disappearing forever.
  const cat = { games: CATALOG.games.map(g =>
    g.id === 2023020100 ? { ...g, hl: 5 } : g) };
  const r = run({ docs: { ...ALL, 'catalog.json': cat } });
  return r.settle().then(() => {
    assert.equal(r.ids.herogo.href, 'game.html?game=' + NEWEST_ID);
  });
});

/**
 * ⭐⭐ THE MOVING PICTURE IS A DOOR.
 *
 * Measured in a real browser on 2026-09-11: the frame is 26.9% of a 1325x959
 * laptop screen and 21.1% of a 390x844 phone — the largest element on the page
 * and the only one that moves — and clicking the middle of it went nowhere, with
 * the cursor still reading `auto`. On the phone the one content link was at
 * y=739 of an 844px fold.
 *
 * ⚠️ THE DESTINATION IS COMPARED AGAINST THE BUTTON'S, NOT TYPED. An id typed
 * here passes on the day the hero rule changes and the rectangle keeps opening
 * last week's game — the two must agree because they are the same offer, so the
 * assertion is that they agree.
 */
test('the hero rectangle opens the same game its button does', () => {
  const r = run({ docs: ALL });
  return r.settle().then(() => {
    const hit = walk(r.ids.heroframe).find(n => /\bherohit\b/.test(n.className || ''));
    assert.ok(hit, 'the moving picture is not a door — nothing covers the frame');
    // ⚠️ THE TAG, BECAUSE THE FAKE DOM LETS ANY ELEMENT CARRY AN `href`. Swapping
    // `el('a', …)` for `el('span', …)` left every assertion below green while the
    // rectangle stopped being clickable in a browser — a mutation that landed,
    // survived, and was only caught by running it. A door is an anchor.
    assert.equal(hit.tag, 'a',
      `the overlay is a <${hit.tag}> — only an anchor navigates`);
    assert.equal(hit.href, r.ids.herogo.href,
      'the rectangle and the button offer different games');
    // AND IT IS AN AFFORDANCE, NOT A SECOND LINK. `Watch the whole game` sits
    // directly under it with the same destination, so a keyboard or screen
    // reader user meeting this as well would meet one offer twice with nothing
    // to tell the two apart — the duplicate-funnel defect in accessible clothing.
    assert.equal(hit.attrs['aria-hidden'], 'true',
      'the overlay is in the accessibility tree, duplicating the button');
    assert.equal(hit.attrs.tabindex, '-1',
      'the overlay is in the tab order, duplicating the button');
  });
});

/**
 * ⛔ THE PAGE NEVER NAMED THE SPORT.
 *
 * Measured 2026-09-11: "hockey" appeared ZERO times in the visible front door.
 * It appeared once in the whole file — the `<title>`, "Read the Game — hockey,
 * made legible" — which is the most welcoming sentence the site has and was
 * rendering where only a browser tab shows it. A page whose whole purpose is a
 * newcomer to the sport did not say which sport.
 *
 * ⚠️ THE VISIBLE PAGE, WITH `<title>` AND SCRIPT STRIPPED. Grepping the file
 * would pass on the state this test exists to forbid — the word was always in
 * the file. What is asserted is that a reader meets it.
 */
test('the front door says which sport it is about, ABOVE the legal small print', () => {
  /* ⛔⛔ THE FIRST VERSION OF THIS TEST WAS VACUOUS AND WOULD HAVE PASSED ON THE
     DEFECT IT WAS WRITTEN FOR. It grepped the whole visible page for "hockey" —
     and the footer has always carried "not affiliated with … the National Hockey
     League" plus a `ReadTheGameOfHockey@` address. So the page that said the word
     ZERO times where a reader meets it as a promise said it twice in the legal
     line at the bottom, and the check could not tell those apart.
     THE FOOTER IS EXCLUDED, and that is the whole point: a disclaimer naming the
     league is not the page telling a newcomer what this is about. */
  const src = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  const body = src
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<footer[\s\S]*?<\/footer>/g, '');
  assert.doesNotMatch(body, /National Hockey League/,
    'the footer survived the strip — this check is reading the legal line again');
  const visible = body.replace(/<[^>]*>/g, ' ');
  assert.ok(visible.replace(/\s+/g, ' ').trim().length > 400,
    'almost nothing survived the strip — this check has lost its subject');
  assert.match(visible, /hockey/i,
    'the front door never names the sport outside its own footer — the one place '
    + 'it said "hockey" was the <title>, which only a browser tab renders');
});

/**
 * ⛔ AND IT PRINTED ITS OWN NAME TWICE.
 *
 * The eyebrow read "Read the Game" — 40px under the wordmark "Read the Game",
 * inside the first 270px of a phone screen. Not a duplicate LINK (the nav's was
 * that, and went the same day) but a duplicate STATEMENT, spending the one slot
 * a reader's eye reaches first on something they had just read.
 *
 * ⚠️ A COUNT, NOT AN ABSENCE. Asserting the eyebrow says something particular
 * pins today's copy and forbids tomorrow's; what is actually wrong is saying it
 * TWICE, so that is what is counted. The wordmark itself must still be there —
 * hence `1` rather than `<= 1`.
 */
test('the front door prints the wordmark once', () => {
  const visible = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ');
  const n = (visible.match(/Read the Game/g) || []).length;
  assert.equal(n, 1,
    `the visible front door says "Read the Game" ${n} times — the masthead is the `
    + 'one place the site names itself');
});

/**
 * ⭐⭐ THE TEACHING IS ONE CLICK FROM THE FRONT DOOR.
 *
 * Measured 2026-09-11: fourteen learn cards and six drawn rule pages were
 * reachable ONLY through `/what-you-can-see.html`, and NOTHING on the site
 * linked to a rule page at all — twenty teaching artifacts behind a single
 * 129x27 nav link. The front door offered one game, thirty-two three-letter club
 * codes and a calendar.
 *
 * ⚠️ EACH DESTINATION IS RESOLVED AGAINST THE BUILT PAGES, not just matched as a
 * string. A strip of links to `/offside.html` looks perfect in the markup and is
 * four 404s if the rule builder stops emitting them, which is the shape that put
 * `__PLACEHOLDER__` on a production page once.
 */
test('the front door opens onto the rules, and every one of them exists', () => {
  /* ⚠️ THE OPEN TAG IS MATCHED LOOSELY AND `hidden` IS ASSERTED SEPARATELY.
     The first draft anchored on the exact string `<section class="learnin">`, so
     a mutation adding `hidden` to the tag failed this test — by breaking the
     REGEX, not by being detected. A check that goes red for the wrong reason is
     one refactor away from going green for the wrong reason, and this file has
     already shipped two vacuous assertions today. */
  const open = /<section class="learnin"([^>]*)>/.exec(html);
  assert.ok(open, 'the rules strip is gone from the front door');
  assert.doesNotMatch(open[1], /\bhidden\b/,
    'the rules strip ships hidden — present in the markup and absent to a reader');
  const strip = /<section class="learnin"[^>]*>([\s\S]*?)<\/section>/.exec(html);
  const hrefs = [...strip[1].matchAll(/href="\/([a-z-]+)\.html"/g)].map(m => m[1]);
  const rules = hrefs.filter(h => h !== 'what-you-can-see');
  assert.ok(rules.length >= 3,
    `the strip names ${rules.length} rules — it was built to name three`);
  for (const r of rules)
    assert.ok(PAGES.has(r + '.html'),
      `the front door links to /${r}.html and no such page is built`);
});

/**
 * ⛔ THE STRIP PROMOTES THE RULES HALF ONLY, AND THE SPLIT IS THE POINT.
 *
 * `LEARN_CARDS` keeps two groups apart deliberately — its own comment calls the
 * split "the page's best idea": the first group is HOCKEY, the second is OURS,
 * and merging them "would let our measurements borrow the rulebook's authority".
 * A front-door strip mixing both with no heading between them does exactly that,
 * so the builder refuses a non-rules id with a SystemExit and this asserts the
 * artifact it produces.
 */
test('the strip never promotes one of OUR measurements as if it were a rule', () => {
  const learn = PAGE_SRC.get('what-you-can-see.html');
  const strip = /<section class="learnin"[^>]*>([\s\S]*?)<\/section>/.exec(html)[1];
  // The measurement half, read off the learn page's own grouping rather than
  // restated here — the `ours` cards are the ones under the second heading.
  const ours = learn.slice(learn.indexOf('each showing its work'));
  const ourIds = [...ours.matchAll(/<a class="card" id="([a-z-]+)"/g)].map(m => m[1]);
  assert.ok(ourIds.length >= 6,
    `found ${ourIds.length} measurement cards — this check has lost its subject`);
  for (const id of ourIds)
    assert.doesNotMatch(strip, new RegExp(`href="/${id}\\.html"`),
      `the strip offers \`${id}\`, which is one of OUR measurements, beside the rules`);
});

/**
 * ⭐ THE COUNT IN THE LINK IS THE COUNT ON THE PAGE IT OPENS.
 *
 * "All 14 lessons" is a promise about another document, and the two are built by
 * different functions. Counted on the learn page's own artifact rather than
 * against `LEARN_CARDS`, so this is two BUILT PAGES agreeing — a shared constant
 * would let both drift together, which is the mirror this project keeps finding.
 */
test('the front door promises as many lessons as the learn page holds', () => {
  const learn = PAGE_SRC.get('what-you-can-see.html');
  const onLearnPage = [...learn.matchAll(/<a class="card" id="[a-z-]+"/g)].length;
  assert.ok(onLearnPage >= 10,
    `counted ${onLearnPage} cards on the learn page — this check has lost its subject`);
  const promised = /All (\d+) lessons/.exec(html);
  assert.ok(promised, 'the front door no longer says how many lessons there are');
  assert.equal(Number(promised[1]), onLearnPage,
    `the front door promises ${promised[1]} lessons and the page it opens has ${onLearnPage}`);
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
  // ⚠️ THE ANCHOR IS A PATTERN, NOT A LITERAL. This read `'<div class="wrap">'`
  // and went red on 2026-09-09 when the home page's wrap gained a second class
  // (`wrap front`, so the widened fold cannot reach the three other BODY
  // templates in build_index.py). `indexOf` returned -1, `slice(-1)` handed the
  // test the document's LAST CHARACTER, and both sides of the comparison became
  // -1 — a failure with nothing wrong, on a check whose subject is ORDER and has
  // no opinion about class attributes at all.
  const wrapAt = html.search(/<div class="wrap[^"]*">/);
  assert.notEqual(wrapAt, -1, 'the page body no longer opens with a .wrap');
  const body = html.slice(wrapAt);
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
    /* ⛔ FRACTIONS, AND THE DOCTRINE IS BETTER SERVED BY THEM THAN IT WAS BY THE
       PERCENTAGE. This used to find a `54.2%` and then look for `Across N games`
       in the same sentence — one reference class, stated once, up front. The hero
       now carries TWO rates with different denominators, so each figure carries
       its own inline and the check is no longer "is there an n somewhere near"
       but "does EVERY sentence with a figure in it carry that figure's own n". */
    assert.doesNotMatch(cap, /%/,
      `the hero caption prints a percentage, which hides its denominator: "${cap.slice(0, 140)}"`);
    assert.ok(/[\d,]+ of [\d,]+/.test(cap),
      `the hero caption prints no figure at all: "${cap.slice(0, 140)}"`);
    for (const sentence of cap.split(/(?<=\.)\s/)) {
      if (!/\d/.test(sentence)) continue;
      assert.match(sentence, /[\d,]+ of [\d,]+/,
        `"${sentence}" prints a figure with no reference class`);
    }
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


/* ------------------------------------------------------------- THE DAILY BLOCK
 * The one element on this page whose content is a function of the date. The
 * three states and every sentence in them are tested against fixtures in
 * test/daily.test.js; what is tested HERE is the half that file cannot see —
 * that the page fetches the document, renders what the module decided, and puts
 * the block where the stylesheet expects to find it.
 */
const RECENT = { asOf: new Date().toISOString(), games: [
  { id: 2025020801, date: '2026-01-14', awayAb: 'BOS', homeAb: 'TOR',
    score: { a: 2, h: 3 }, attempts: { a: 60, h: 48 } },
  { id: 2025020802, date: '2026-01-14', awayAb: 'MIN', homeAb: 'COL',
    score: { a: 4, h: 1 }, attempts: { a: 55, h: 41 } },
]};
const SCHEDULE = { asOf: new Date().toISOString(), upcoming: [],
  season: { preSeasonStartDate: '2099-09-19', regularSeasonStartDate: '2099-09-29' } };

test('the daily block renders last night from recent.json, with doors', async () => {
  const r = run({ docs: { ...ALL, 'recent.json': RECENT, 'schedule.json': SCHEDULE } });
  await r.settle(); await r.settle();
  assert.equal(r.ids.daily.hidden, false, 'the block never revealed itself');
  assert.match(r.ids.dailykick.textContent, /2 games$/);
  assert.match(r.ids.dailysay.textContent, /lost 1 of the 2\./);
  const rows = r.ids.dailylist.kids;
  assert.equal(rows.length, 2, 'one door per game');
  assert.deepEqual(rows.map(a => a.href),
    ['game.html?game=2025020801', 'game.html?game=2025020802']);
});

test('⛔ THE NIGHTLY COUNT AND THE ARCHIVE RATE ARE NEVER IN ONE SENTENCE', async () => {
  /* CHENG's q2 as it reaches a reader. The module cannot break this on its own —
     it never sees the archive figure — so the check has to be on the PAGE, where
     both are rendered and where the adjacency lives. The archive's rate keeps
     `#herorel`; the night's counts keep `#dailysay`; neither element may carry
     the other's kind of number. */
  const r = run({ docs: { ...ALL, 'recent.json': RECENT, 'schedule.json': SCHEDULE } });
  await r.settle(); await r.settle();
  // The rate is written only once the preview frame reports the game's attempts,
  // so it has to be delivered or the control below is vacuous.
  r.post({ rtg: 'attempts', game: NEWEST_ID, a: 30, h: 22 });
  // THE CONTROL, and it moved from a percentage to a fraction with the caption.
  assert.match(textOf(r.ids.herorel), /[\d,]+ of [\d,]+ games/,
    'the archive rate must still be on the page, or this test proves nothing');
  for (const id of ['dailykick', 'dailysay']) {
    assert.doesNotMatch(r.ids[id].textContent, /%/, `${id} printed a rate`);
    assert.doesNotMatch(r.ids[id].textContent, /\d\.\d/, `${id} printed a decimal`);
  }
  assert.doesNotMatch(textOf(r.ids.herorel), /last night/i,
    'the archive sentence took on the night as its subject');
});

/** Was the block revealed? The fake document only mints an element when the
 *  script asks for it, so an untouched `#daily` is ABSENT rather than hidden —
 *  and `assert.equal(ids.daily.hidden, true)` would throw on the very case it is
 *  asking about. Both shapes mean the same thing to a reader: no block. */
const shown = r => !!(r.ids.daily && r.ids.daily.hidden === false);

test('a team page gets no slate — it is a question already asked', async () => {
  const docs = { ...ALL, 'recent.json': RECENT, 'schedule.json': SCHEDULE };
  const team = run({ search: '?team=BUF', docs });
  await team.settle(); await team.settle();
  assert.equal(shown(team), false, 'a league-wide slate interrupted a team page');
  // THE CONTROL, and without it "never show it" passes: the same documents on
  // the front door do produce the block.
  const front = run({ docs });
  await front.settle(); await front.settle();
  assert.equal(shown(front), true);
});

test('no recent.json and no schedule.json: the block stays hidden, page intact', async () => {
  // `grab` answers null for anything that 404s, so this is the state a deploy
  // reaches the morning a document is renamed — and the rest of the fold must
  // not depend on it.
  const r = run({ docs: ALL });
  await r.settle(); await r.settle();
  assert.equal(shown(r), false, 'a state fired with nothing to read');
  assert.match(textOf(r.ids.heroline), / at /, 'the hero stopped rendering with it');
});

test('⚠️ THE BLOCK IS INSIDE THE HERO, which is what the grid rule requires', () => {
  /* `.daily:not([hidden]){grid-column:1;grid-row:6}` places it in the card's
     sixth row — the slack the frame leaves in column one. That rule is a claim
     about ANCESTRY: move `#daily` out to be a sibling of the card and the
     selector still matches, the declarations still parse, and the block silently
     lands full-width underneath instead. Nothing else here would go red.
     The walk is over tag depth rather than a substring search, because the hero
     contains nested divs and "appears after" is not "is inside". */
  const main = html.slice(html.indexOf('<main id="main">'), html.indexOf('</main>'));
  const bare = main.replace(/<!--[\s\S]*?-->/g, '');   // comments name these ids too
  let depth = 0, heroAt = null, ok = false;
  for (const m of bare.matchAll(/<(\/?)([a-z]+)([^>]*)>/g)) {
    const closing = m[1] === '/', attrs = m[3];
    if (closing) { depth -= 1; if (heroAt !== null && depth <= heroAt) heroAt = null; continue; }
    if (/\/$/.test(attrs) || m[2] === 'br' || m[2] === 'img') continue;  // void
    if (/id="hero"/.test(attrs)) heroAt = depth;
    if (/id="daily"/.test(attrs)) ok = heroAt !== null && depth > heroAt;
    depth += 1;
  }
  assert.ok(ok, '#daily is not inside #hero — the grid rule places it nowhere');
  assert.match(html, /\.daily:not\(\[hidden\]\)\{[^}]*grid-row:6/,
    'the rule that consumes the placement is gone');
});


/**
 * ⛔⛔ THE HERO ANSWERS ITS OWN PARADOX, AND UNTIL 2026-09-10 IT DID NOT.
 *
 * `moreLevelControlLost` was computed by `archive.js`, published in
 * `measures.json`, and read by NOTHING — so the front door stated that the team
 * with more shot attempts usually loses and stopped there. A novice's only
 * available conclusion from that is *shot counts are meaningless*, which is the
 * opposite of the truth reached from entirely true data: the same failure as a
 * filtered list with no base rate, and we held the correction the whole time.
 *
 * CHENG, ruling on whether answering it defuses the hook: *"the hook is not the
 * mystery, it is that two honest counts of nearly the same thing land on
 * opposite sides of 50%. An unresolved 54.3% is a curiosity; the pair is an
 * argument."*
 *
 * ⛔ AND EACH FIGURE CARRIES ITS OWN `n`, WHICH IS THE WHOLE REASON THESE ARE
 * FRACTIONS. The two rates have DIFFERENT denominators — a game with no
 * level-play edge is not in the second — so a pair of percentages would print
 * one reference class between them and silently attribute it to both.
 */
test('⛔ the hero states BOTH rates, each with its own denominator', () =>
  heroRelation({ ...BUF_LED_SHOTS, as: 1, hs: 4, ...LEADERS_LOSE,
                 level: { what: 'the team that controlled play while the score was level lost',
                          population: 'NHL regular season and playoffs', n: 900, count: 300 } })
    .then(cap => {
      // The leader loses 800 of 1,000 …
      assert.match(cap, /loses 800 of 1,000 games/, `the first rate is missing: "${cap}"`);
      // … and while the score was level the same club WINS 600 of 900. Different
      // verb AND different denominator, which is the entire point of the pair.
      assert.match(cap, /wins 600 of 900/, `the level-control rate is missing: "${cap}"`);
      assert.match(cap, /while the score was level/,
        'the second rate does not say what makes it different from the first');
      // ⭐ THE CONNECTIVE IS READ, NEVER ASSUMED. These two rates point opposite
      // ways, so the sentence may say so. A hard-coded "turns over" would be a
      // welded claim that outlives the data that justified it.
      assert.match(cap, /turns over/, `the reversal is not named: "${cap}"`);
      assert.doesNotMatch(cap, /%/, 'a percentage would hide the two denominators');
    }));

test('⭐ …and when the archive stops reversing, the sentence stops saying it does', () =>
  heroRelation({ ...BUF_LED_SHOTS, as: 1, hs: 4, ...LEADERS_LOSE,
                 level: { what: 'the team that controlled play while the score was level lost',
                          population: 'NHL regular season and playoffs', n: 900, count: 700 } })
    .then(cap => {
      // Both rates now point the SAME way, so "turns over" would be false.
      assert.match(cap, /loses 800 of 1,000 games/);
      assert.match(cap, /loses 700 of 900/);
      assert.match(cap, /and it holds/, `the connective still claims a reversal: "${cap}"`);
      assert.doesNotMatch(cap, /turns over/,
        'the caption asserts a reversal the archive is not showing');
    }));

test('⭐ …and a hero with no second rate says the first one alone', () =>
  heroRelation({ ...BUF_LED_SHOTS, as: 1, hs: 4, ...LEADERS_LOSE, level: null })
    .then(cap => {
      assert.match(cap, /loses 800 of 1,000 games/, 'the first rate went with the second');
      assert.doesNotMatch(cap, /while the score was level|turns over|and it holds/,
        `a dangling clause survived the missing rate: "${cap}"`);
    }));
