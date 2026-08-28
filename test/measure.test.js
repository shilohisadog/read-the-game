/**
 * The pipeline's analysis driver, and the seam that lets it exist.
 *
 * THE PROPERTY THESE TESTS PROTECT is that there is ONE implementation of every
 * domain rule. `builders/measure.mjs` ranks 4,119 games with the same modules the
 * browser renders with — what an attempt is, whose it is, what even strength
 * means, what the shootout is not. The plan of record put a Python copy in
 * derive.py, and the scratch script it grew from opened by promising to "mirror
 * src/lib/strength.js exactly". A comment promising to mirror is a drift vector.
 * `KNOWN_SITUATIONS` has gained codes twice; nothing would have failed.
 *
 * That seam stays open only while the analysis tier runs outside a browser, which
 * is one accidental `document.` away from closing. So it is asserted, not assumed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { measureGame, stable, firstAtClock, endedIn, measureAll } from '../builders/measure.mjs';
import { TEAMS } from '../src/lib/teams.js';
import { summarise, slotShare, distribution, perGame, quantile, shareAtOrBelow } from '../src/lib/archive.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { danger } from '../src/lib/layers/danger.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { whistle } from '../src/lib/layers/whistle.js';
import { teamSeasons } from '../src/lib/team-season.js';

/**
 * The analysis tier: the modules the PIPELINE imports, directly or transitively.
 * Named explicitly rather than globbed — a glob would quietly widen the claim to
 * files this test has never checked, which is the failure mode the whole project
 * keeps paying for.
 */
const TIER = [
  'archive.js', 'attribution.js', 'layer.js', 'rink.js', 'strength.js', 'team-season.js',
  // competitions.js joined when archive.js stopped spelling `slice(4, 6)` itself
  // and asked it instead. CAUGHT BY THIS TEST, for the second time — the tier
  // goes stale in the same edit that changes the graph, every time.
  'competitions.js',
  // teams.js joined the tier when measure.mjs started checking that every club
  // in the archive has an entry. THIS TEST CAUGHT THAT IMPORT, which is the
  // list working: the guard was added and the tier went stale in the same edit.
  'teams.js',
  'layers/blocked.js', 'layers/corsi.js', 'layers/danger.js', 'layers/goaltending.js',
  'layers/tied.js',
  // whistle.js joined when the per-game distributions did: `measures.json` could
  // say a shot attempt is blocked 27.7% of the time and could not say whether 55
  // stoppages was a normal night, because nothing had ever counted them.
  // CAUGHT BY THIS TEST, third time — the tier goes stale in the same edit that
  // changes the graph, every time.
  'layers/whistle.js',
];

test('the analysis tier runs outside a browser', () => {
  for (const f of TIER) {
    const src = readFileSync(new URL(`../src/lib/${f}`, import.meta.url), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');   // comments may say "document"
    assert.doesNotMatch(code, /\bdocument\b|\bwindow\b|\bnavigator\b|createElement/,
      `${f} reaches for the DOM — the pipeline can no longer call it`);
  }
});

test('the tier list covers every module the pipeline actually pulls in', () => {
  // A hand-written list goes stale silently. Walk the import graph from the two
  // entry points and assert the list is not missing anything.
  const seen = new Set();
  const walk = spec => {
    if (seen.has(spec)) return;
    seen.add(spec);
    const src = readFileSync(new URL(`../src/lib/${spec}`, import.meta.url), 'utf8');
    for (const m of src.matchAll(/from\s+'([^']+)'/g)) {
      const p = m[1].replace(/^\.\.\//, '').replace(/^\.\//, spec.includes('/') ? 'layers/' : '');
      if (p.endsWith('.js')) walk(p);
    }
  };
  // THE ROOTS ARE READ FROM THE DRIVER, not typed here. They used to be three
  // hand-written entry points, which is the same staleness this test exists to
  // catch, one level up: measure.mjs grew three imports and the roots would have
  // gone on walking the old graph and reporting nothing missing.
  const driver = readFileSync(new URL('../builders/measure.mjs', import.meta.url), 'utf8');
  const roots = [...driver.matchAll(/from '\.\.\/src\/lib\/([^']+)'/g)].map(m => m[1]);
  assert.ok(roots.length >= 4, `only ${roots.length} lib imports found in the driver`);
  for (const r of roots) walk(r);
  const missing = [...seen].filter(f => !TIER.includes(f));
  assert.deepEqual(missing, [], `TIER is missing modules the pipeline imports`);
});

/**
 * A minimal game that keeps the two shot measures APART. The first version of
 * this fixture happened to give attempts and shots-on-goal the same totals, so
 * the disagreement test below passed on nothing. A blocked shot is an attempt and
 * not a shot on goal, which is exactly what makes the measures diverge in real
 * games — so the fixture contains one.
 */
const GAME = {
  game: { id: 2023020001 },
  teams: { home: { id: 10, ab: 'HME' }, away: { id: 20, ab: 'AWY' } },
  roster: { 1: { nm: 'H', tid: 10, pos: 'C' }, 2: { nm: 'A', tid: 20, pos: 'L' } },
  quoted: { src: 'boxscore', home: { score: 0, sog: 2 }, away: { score: 1, sog: 1 } },
  events: [
    { type: 'shot-on-goal', actor: 1, own: 10, per: 1, s: 10, sit: '1551', pt: 'REG' },
    { type: 'blocked-shot', actor: 1, own: 20, per: 1, s: 15, sit: '1551', pt: 'REG' },
    { type: 'goal', actor: 2, own: 20, per: 1, s: 20, sit: '1551', pt: 'REG' },
    { type: 'shot-on-goal', actor: 1, own: 10, per: 1, s: 30, sit: '1551', pt: 'REG' },
  ],
};

test('a measured game quotes the league and counts our own attempts', () => {
  const r = measureGame(GAME);
  assert.deepEqual(r.score, { h: 0, a: 1 }, 'score comes from the quoted boxscore');
  assert.deepEqual(r.sog, { h: 2, a: 1 }, 'and so do shots on goal — never re-derived');
  assert.deepEqual(r.attempts, { h: 3, a: 1 },
    'attempts are ours, at all strengths — and the blocked shot belongs to the '
    + 'SHOOTER, whose team is HOME, though the feed marks it own=20');
  assert.equal(r.level, 1,
    'home shot and blocked attempt while level, away goal while level; the home '
    + 'shot after that goal was taken while trailing and does not count');
});

/**
 * ⭐ WHERE THE GOALS COME FROM, AND THE DENOMINATOR IS THE WHOLE OF IT.
 *
 * The base layer has shaded the slot since it was built and the legend has only
 * ever said WHERE it is. The reason is this share, and it existed nowhere a page
 * could read while being quoted in a design document as settled — the shape that
 * shipped a wrong Corsi count once.
 *
 * BOTH HALVES. The numerator alone is satisfied by counting every goal in the
 * slot; what makes the figure honest is that a goal the feed gives NO COORDINATE
 * for is left out of the denominator too, rather than scored as "not from the
 * slot" and biasing the share downwards. So the fixture carries one of each.
 */
test('the slot share counts placed goals, and an unplaced goal is in neither half', () => {
  const g = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
  const real = measureGame(g);
  assert.ok(real.goals.placed > 0, 'the reference game scores no goal this can be about');
  assert.ok(real.goals.slot <= real.goals.placed, 'more goals from the slot than were placed');
  assert.equal(real.goals.slot + (real.goals.placed - real.goals.slot), real.goals.placed);

  // THE SAME GAME WITH ONE GOAL'S COORDINATES REMOVED. Not a synthesised event:
  // stripping x from a real goal is the exact thing the feed does to us, and it
  // must move `placed` and `unplaced` together and leave the RATE's meaning
  // intact rather than counting the goal as a miss.
  const blind = JSON.parse(JSON.stringify(g));
  const firstGoal = blind.events.find(e => e.type === 'goal' && e.x != null);
  assert.ok(firstGoal, 'no placed goal to blind');
  const wasInSlot = measureGame(g).goals.slot;
  firstGoal.x = null; firstGoal.y = null;
  const after = measureGame(blind);
  assert.equal(after.goals.unplaced, real.goals.unplaced + 1, 'the blinded goal was not counted as unplaced');
  assert.equal(after.goals.placed, real.goals.placed - 1, 'the blinded goal stayed in the denominator');
  assert.ok(after.goals.slot <= wasInSlot, 'a goal with no coordinate was counted as being in the slot');
});

test('the published archive states where the goals come from, with its rule', () => {
  // THE ARITHMETIC, on the function itself. `summarise` filters to in-scope ids
  // first, so hand-made records would have to carry an id, a score and a level
  // before this could see them — a fixture built to get past a gate rather than
  // to state a claim.
  const agg = slotShare([
    { goals: { slot: 3, placed: 4, unplaced: 1 } },
    { goals: { slot: 1, placed: 4, unplaced: 0 } },
    { /* an older record shape, carrying no goal placement at all */ },
  ]);
  assert.equal(agg.count, 4);
  assert.equal(agg.n, 8, 'the denominator is placed goals, not every goal');
  assert.equal(agg.rate, 0.5);
  assert.equal(agg.unplaced, 1, 'the goals it could not speak for are not published');
  assert.equal(agg.games, 2, 'a record with no goal placement was counted anyway');
  assert.match(agg.what, /33 ft/, 'the share does not state the rule it was measured by');
  assert.match(agg.what, /GOALS, not games/, 'the share does not name its own unit');

  // AND AN EMPTY ARCHIVE IS NOT A FINDING OF ZERO — the rule stated at `share`.
  assert.equal(slotShare([]).rate, null);

  // AND IT REACHES THE PUBLISHED DOCUMENT, through the whole path a real run
  // takes: an extract, `measureGame`, `summarise`. Without this half the
  // arithmetic above could be perfect in a function nothing calls.
  const g = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
  const doc = summarise([measureGame(g)]);
  assert.ok(doc.slot && doc.slot.n > 0,
    'the archive summary carries no slot share, so no page can read one');
  assert.equal(doc.slot.n, measureGame(g).goals.placed);
});

test('the two shot measures are computed separately and may disagree', () => {
  // If `attempts` were ever derived from `sog` or vice versa, the site's central
  // finding — that the two point in opposite directions — would be unfalsifiable.
  const r = measureGame(GAME);
  assert.notDeepEqual(r.attempts, r.sog);
});

test('stable() sorts keys, so the same input is the same bytes', () => {
  assert.equal(stable({ b: 1, a: 2 }), '{"a":2,"b":1}');
  assert.equal(stable({ a: 2, b: 1 }), stable({ b: 1, a: 2 }));
  assert.equal(stable({ z: [3, { y: 1, x: 2 }] }), '{"z":[3,{"x":2,"y":1}]}');
});

test('a game with no quoted boxscore is skipped, never guessed', () => {
  // measureGame reads the league's line and does not reconstruct it. Reaching
  // into events for a score here would be the second implementation all over
  // again, one field at a time.
  assert.throws(() => measureGame({ ...GAME, quoted: undefined }));
});

test('only the full-archive job may publish the measurement', () => {
  // THE CATALOG BUG, ONE DOCUMENT OVER. The nightly holds raw for one night and
  // extracts for none, so a nightly that wrote measures.json would publish a
  // ranking over a handful of games — and a partial ranking is worse than none,
  // because it looks like an answer. derive.yml is the only job that sees the
  // whole archive, which is why it is also the only one that measures.
  //
  // Asserted rather than observed: nothing about running `node measure.mjs` in
  // ingest.yml would fail, and the wrong ranking would simply appear.
  const wf = f => readFileSync(new URL(`../.github/workflows/${f}`, import.meta.url), 'utf8');
  assert.doesNotMatch(wf('ingest.yml'), /measure\.mjs|measures\.json/,
    'the nightly must neither compute nor upload the archive measurement');
  // Anchor on the INVOCATIONS, not the file names. The first version compared
  // `indexOf('derive.py')` with `indexOf('measure.mjs')` and failed on a correct
  // workflow, because a comment above the node setup step mentions measure.mjs.
  // A check that reads prose as if it were order is not checking order.
  const derive = wf('derive.yml');
  const at = re => derive.search(re);
  assert.ok(at(/node builders\/measure\.mjs/) > -1, 'derive.yml is where it runs');
  assert.ok(at(/python3 builders\/derive\.py/) < at(/node builders\/measure\.mjs/),
    'and it runs AFTER derive, over the extracts derive just wrote');
});

/* ------------------------------------------------- the recording convention
   `firstAtClock` watches every extract for a faceoff recorded before its own
   stoppage. It went into measure.mjs untested, and a mutation that blanked it
   survived a full suite run -- which is the finding, not the fix. */

const RICH = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));

test('a real game has no draw recorded before its own whistle', () => {
  assert.deepEqual(firstAtClock(RICH.events), []);
});

test('and a game that did would be reported — the half that proves the above', () => {
  // MUTATION IN THE DATA, not in the code. Move ONE stoppage to sit after the
  // draw it caused, at the same clock, and the watcher must name it. Without
  // this, "no game in the archive breaks the convention" and "the function
  // always returns nothing" are the same green.
  const evs = RICH.events.map(e => ({ ...e }));
  const i = evs.findIndex((e, k) => e.type === 'faceoff' && k > 0
                                  && evs[k - 1].type === 'stoppage'
                                  && evs[k - 1].rem === e.rem);
  assert.ok(i > 0, 'the reference game should hold a stoppage-then-draw pair at one clock');
  [evs[i - 1], evs[i]] = [evs[i], evs[i - 1]];
  assert.deepEqual(firstAtClock(evs), [i - 1],
    'the draw is now first at its clock and must be named, by index');
});

test('a draw that is genuinely alone at its clock is still reported', () => {
  // The convention says a draw follows a whistle. A draw with nothing before it
  // at that second is the same defect wearing a different shape, and a watcher
  // that only looked for reordering would miss it.
  assert.deepEqual(firstAtClock([{ per: 1, rem: '20:00', type: 'faceoff' }]), [0]);
});

/* ---------------------------------------------------------------- attemptMix
 *
 * What an attempt turned into, aggregated over the archive. This is the number
 * the blocked-shots layer ships INSTEAD of a blocks-leader win rate, which is
 * not publishable at any sample size (docs/blocked-shots-layer.md §5, §7).
 */

test('the mix accounts for every attempt corsi counted, and nothing else', () => {
  // CONSERVATION, so the four buckets cannot quietly disagree with the total the
  // page shows. `attempts` is corsi's own per-team tally; `mix` is the same
  // events sorted by what they became.
  for (const f of readdirSync(new URL('fixtures/extracts', import.meta.url))
                   .filter(f => f.endsWith('.json'))) {
    const g = JSON.parse(readFileSync(new URL(`fixtures/extracts/${f}`, import.meta.url), 'utf8'));
    const m = measureGame(g);
    const summed = Object.values(m.mix).reduce((a, b) => a + b, 0);
    assert.equal(summed, m.attempts.h + m.attempts.a,
      `${f}: the mix totals ${summed} against ${m.attempts.h + m.attempts.a} attempts`);
    assert.ok(summed > 50, `${f}: only ${summed} attempts — the fixture is not a real game`);
  }
});

test('THE MIX IS CORSI\'S RULING, NOT A COUNT OF EVENT TYPES — the shootout proves it', () => {
  // THE MUTATION THIS FORBIDS is the obvious implementation: walk `g.events` and
  // tally `e.type`. It gives the right answer on most games and the wrong one
  // here, because a shootout is not play — every attempt in it is unblocked and
  // from the slot, so counting them would push the published share of attempts
  // that reach the goalie UP by exactly the games that went to a shootout.
  //
  // ~6% of games reach one. A rule checked only on the other 94% is a rule
  // checked on a sample, which is the defect this whole file exists against.
  const g = JSON.parse(readFileSync(
    new URL('fixtures/extracts/2023020207.json', import.meta.url), 'utf8'));
  const TYPES = ['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot'];
  const naive = {};
  for (const t of TYPES) naive[t] = g.events.filter(e => e.type === t).length;
  const shootout = g.events.filter(e => e.pt === 'SO' && TYPES.includes(e.type)).length;
  assert.ok(shootout > 0, 'this fixture must actually carry a shootout, or the test proves nothing');

  const m = measureGame(g);
  const counted = Object.values(m.mix).reduce((a, b) => a + b, 0);
  const naiveTotal = Object.values(naive).reduce((a, b) => a + b, 0);
  assert.ok(counted < naiveTotal,
    `the mix (${counted}) is not smaller than a raw type count (${naiveTotal}) — `
    + 'the shootout is being counted as hockey');
  assert.ok(naiveTotal - counted >= shootout,
    `the raw count exceeds the mix by ${naiveTotal - counted}, which does not cover `
    + `the ${shootout} shootout attempts`);
});

test('the archive shares are of ATTEMPTS, carry their n, and cannot be read as an outcome', () => {
  const records = readdirSync(new URL('fixtures/extracts', import.meta.url))
    .filter(f => f.endsWith('.json'))
    .map(f => measureGame(JSON.parse(readFileSync(
      new URL(`fixtures/extracts/${f}`, import.meta.url), 'utf8'))));
  const mix = summarise(records).attemptMix;

  const n = mix.reachedTheGoalie.n;
  assert.equal(n, Object.values(mix.byType).reduce((a, b) => a + b, 0));
  assert.equal(mix.reachedTheGoalie.count + mix.neverReachedTheGoalie.count, n,
    'reached + never-reached must be every attempt, or one of them is a different population');
  assert.equal(mix.reachedTheGoalie.count, mix.byType.goal + mix.byType['shot-on-goal'],
    'reaching the goalie is a save or a goal — the league\'s own shots-on-goal pair');
  assert.ok(mix.blocked.count <= mix.neverReachedTheGoalie.count,
    'a blocked shot never reached the goalie, so it cannot outnumber the ones that did not');

  // THE UNIT IS IN THE SENTENCE. Every other `n` in measures.json counts games;
  // this one counts attempts, and a reader who carries the games meaning across
  // is out by a factor of ~120.
  for (const k of ['reachedTheGoalie', 'neverReachedTheGoalie', 'blocked'])
    assert.match(mix[k].what, /n counts ATTEMPTS, not games/,
      `${k} does not say what its n counts`);

  // And no outcome word may appear: the whole reason this number is publishable
  // is that there is no winner in it. "won"/"lost" here would mean somebody had
  // reintroduced the rate CHENG ruled out.
  for (const k of ['reachedTheGoalie', 'neverReachedTheGoalie', 'blocked'])
    assert.doesNotMatch(mix[k].what, /\bwon\b|\blost\b|\bwin\b/i,
      `${k} describes an outcome — the blocks-leader rate is not publishable`);

  assert.equal(mix.games, records.length);
});

test('an empty archive measures NOTHING rather than zero', () => {
  // Same rule `rateOf` holds: 0 reads as a finding.
  const mix = summarise([]).attemptMix;
  assert.equal(mix.reachedTheGoalie.n, 0);
  assert.equal(mix.reachedTheGoalie.rate, null);
  assert.equal(mix.games, 0);
});

/* ─────────────────────────────────────────────────────────────────────────────
 * PER-TEAM SEASONS — the document a next-opponent card reads.
 *
 * These protect four properties the design discussion settled, each of which is
 * a thing an ordinary-looking simplification would break:
 *   1. counts sum, fractions do not
 *   2. the slot's denominator excludes what has no location
 *   3. a block belongs to whoever made it
 *   4. seasons never pool
 * ────────────────────────────────────────────────────────────────────────────*/

/**
 * A game built to make the measures DISAGREE, for the same reason GAME above
 * contains a blocked shot: a fixture where every count coincides tests nothing.
 *
 * HOME shoots from the slot (x=70 is 19 ft out) and from the point (x=20 is
 * 69 ft out); AWAY's only located shot is wide of the slot. HOME's blocked
 * attempt is at slot coordinates ON PURPOSE — a blocked shot's (x,y) is the
 * block point, so if it ever reaches the slot count the numbers will look
 * plausible and be wrong.
 */
const SEASON_GAME = {
  game: { id: 2023020001, date: '2023-10-11' },
  teams: { home: { id: 10, ab: 'HME' }, away: { id: 20, ab: 'AWY' } },
  roster: {
    1: { nm: 'Hshooter', tid: 10, pos: 'C' },
    2: { nm: 'Ashooter', tid: 20, pos: 'L' },
    3: { nm: 'Ablocker', tid: 20, pos: 'D' },
    8: { nm: 'Hgoalie', tid: 10, pos: 'G' },
    9: { nm: 'Agoalie', tid: 20, pos: 'G' },
  },
  quoted: { src: 'boxscore', home: { score: 2, sog: 2 }, away: { score: 1, sog: 1 } },
  events: [
    // HOME, from the slot, saved by AWAY's goalie
    { type: 'shot-on-goal', actor: 1, own: 10, x: 70, y: 0, goalie: 9, per: 1, s: 10, sit: '1551', pt: 'REG' },
    // HOME, from the point — an attempt, located, and NOT the slot
    { type: 'missed-shot', actor: 1, own: 10, x: 20, y: 0, per: 1, s: 15, sit: '1551', pt: 'REG' },
    // HOME, blocked by an AWAY defender, recorded AT SLOT COORDINATES
    { type: 'blocked-shot', actor: 1, own: 10, blk: 3, x: 72, y: 2, per: 1, s: 20, sit: '1551', pt: 'REG' },
    // AWAY, wide of the slot, beats HOME's goalie
    { type: 'goal', actor: 2, own: 20, x: -70, y: 40, goalie: 8, per: 1, s: 30, sit: '1551', pt: 'REG' },
    // HOME, from the slot, scores
    { type: 'goal', actor: 1, own: 10, x: 75, y: 5, goalie: 9, per: 2, s: 1300, sit: '1551', pt: 'REG' },
    // HOME's empty-net goal — no goalie in net, so NOT a shot anyone faced.
    // Placed at x=40 (49 ft out) rather than x=60, which is 29 ft and therefore
    // genuinely IN the slot: the danger layer counts an empty-net goal as a slot
    // shot and is right to, since it measures where the chance came from and has
    // no opinion about the net. The first draft of this fixture put it there by
    // accident and the test read as a bug in the layer.
    { type: 'goal', actor: 1, own: 10, x: 40, y: 0, per: 3, s: 3500, sit: '1551', pt: 'REG' },
  ],
};

test('the slot is counted over located UNBLOCKED attempts, never over all attempts', () => {
  const r = measureGame(SEASON_GAME);
  assert.deepEqual(r.slot, { h: 2, a: 0 },
    'home scored and shot from the slot; the blocked attempt at x=72,y=2 is NOT '
    + 'a slot shot, because that coordinate is where it was stopped');
  assert.deepEqual(r.located, { h: 4, a: 1 },
    'four located home attempts — slot shot, point shot, slot goal, empty-net '
    + 'goal — and the blocked one is in neither part of the fraction');
  assert.ok(r.located.h < r.attempts.h,
    'the slot denominator must be SMALLER than attempts, or the blocked shot leaked in');
});

test('a block is credited to the team that made it, not the team that took the shot', () => {
  const r = measureGame(SEASON_GAME);
  assert.deepEqual(r.blocks, { h: 0, a: 1 },
    'HOME shot it and an AWAY defender blocked it — the block is AWAY’s');
  // The event's own owner points the other way, which is what makes this worth
  // a test: reading `own` would credit the wrong bench and look reasonable.
  assert.equal(r.attempts.h, 5,
    'and the ATTEMPT still belongs to the shooter — all five home attempts, '
    + 'including the blocked one the block was credited against');
});

test('an empty-net goal is an attempt and is not a shot the goalie faced', () => {
  const r = measureGame(SEASON_GAME);
  const away = r.goalies.find(k => k.side === 'a');
  assert.equal(away.faced, 2, 'AWAY’s goalie faced the slot shot and the slot goal — not the empty-netter');
  assert.equal(away.saves, 1);
  assert.equal(r.mix.goal, 3, 'while all three goals are still shot ATTEMPTS');
});

test('⭐ the goalie rows SUM to the team line, and the mean of their fractions does not', () => {
  // THE PROPERTY THE WHOLE PRESENTATION RESTS ON. Carolina 2023-24: five goalies
  // whose fractions average to 92.2% against a true 90.5%, because Perets went
  // 1 of 1. Counts sum; percentages do not. A future simplification to
  // `mean(rows)` would be wrong by up to 1.7 points and would look fine.
  const busy = { pid: 8, nm: 'Busy', side: 'h', faced: 100, saves: 90, date: '2023-10-11' };
  const cameo = { pid: 9, nm: 'Cameo', side: 'h', faced: 1, saves: 1, date: '2023-10-12' };
  const rec = d => ({ id: 2023020001, date: d, end: 'REG', homeAb: 'HME', awayAb: 'AWY',
    score: { h: 1, a: 0 }, sog: { h: 1, a: 0 }, attempts: { h: 1, a: 0 },
    blocks: { h: 0, a: 0 }, slot: { h: 0, a: 0 }, located: { h: 0, a: 0 }, level: 0, goalies: [] });
  const a = { ...rec('2023-10-11'), goalies: [busy] };
  const b = { ...rec('2023-10-12'), id: 2023020002, goalies: [cameo] };
  const t = teamSeasons([a, b]).seasons['2023'].HME;

  assert.equal(t.saves.count, 91, 'saves add');
  assert.equal(t.saves.n, 101, 'and so do shots faced');
  assert.equal(t.saves.count, t.goalies.reduce((n, k) => n + k.saves, 0),
    'the team line IS the column sum — not a separate computation of it');

  const team = t.saves.count / t.saves.n;
  const mean = t.goalies.reduce((n, k) => n + k.saves / k.faced, 0) / t.goalies.length;
  assert.notEqual(team.toFixed(4), mean.toFixed(4),
    'if these ever agree the fixture has stopped testing anything — the whole '
    + 'reason rows carry raw counts is that averaging them gives a different number');
  assert.ok(mean > team, 'and the cameo flatters the average, which is the direction that misleads');
});

test('goalie rows are ordered by shots faced — a fact — and never by rate', () => {
  const t = teamSeasons([{
    id: 2023020001, date: '2023-10-11', end: 'REG', homeAb: 'HME', awayAb: 'AWY',
    score: { h: 1, a: 0 }, sog: { h: 1, a: 0 }, attempts: { h: 1, a: 0 },
    blocks: { h: 0, a: 0 }, slot: { h: 0, a: 0 }, located: { h: 0, a: 0 }, level: 0,
    goalies: [
      { pid: 9, nm: 'Perfect', side: 'h', faced: 1, saves: 1, date: '2023-10-11' },
      { pid: 8, nm: 'Workhorse', side: 'h', faced: 100, saves: 90, date: '2023-10-11' },
    ],
  }]).seasons['2023'].HME;
  assert.deepEqual(t.goalies.map(k => k.nm), ['Workhorse', 'Perfect'],
    'by workload. By rate, the one-shot goalie would top every list in the league '
    + 'and the ordering would be a claim the feed never made');
});

test('every goalie row is dated, not only the ones we can tell moved', () => {
  const g = (id, d, pid) => ({ id, date: d, end: 'REG', homeAb: 'HME', awayAb: 'AWY',
    score: { h: 1, a: 0 }, sog: { h: 1, a: 0 }, attempts: { h: 1, a: 0 },
    blocks: { h: 0, a: 0 }, slot: { h: 0, a: 0 }, located: { h: 0, a: 0 }, level: 0,
    goalies: [{ pid, nm: 'G' + pid, side: 'h', faced: 10, saves: 9, date: d }] });
  const t = teamSeasons([g(2023020001, '2023-10-11', 8), g(2023020002, '2023-12-20', 8),
                         g(2023020003, '2023-11-01', 9)]).seasons['2023'].HME;
  const by = Object.fromEntries(t.goalies.map(k => [k.pid, k]));
  assert.equal(by[8].last, '2023-12-20', 'the LAST appearance, not the first');
  assert.equal(by[8].games, 2);
  // The row that no rule would have dated: never seen elsewhere, so we cannot
  // say he left — and he is exactly the row that misleads without a date.
  assert.equal(by[9].last, '2023-11-01');
  assert.ok(!('alsoFor' in by[9]), 'and we claim nothing about why he stopped appearing');
});

test('a goalie who tended for two teams is stated on both — from the other appearance, not a guess', () => {
  const g = (id, homeAb, pid) => ({ id, date: '2023-10-11', end: 'REG', homeAb, awayAb: 'OPP',
    score: { h: 1, a: 0 }, sog: { h: 1, a: 0 }, attempts: { h: 1, a: 0 },
    blocks: { h: 0, a: 0 }, slot: { h: 0, a: 0 }, located: { h: 0, a: 0 }, level: 0,
    goalies: [{ pid, nm: 'Mover', side: 'h', faced: 10, saves: 9, date: '2023-10-11' }] });
  const s = teamSeasons([g(2023020001, 'SJS', 7), g(2023020002, 'NJD', 7)]).seasons['2023'];
  assert.deepEqual(s.SJS.goalies[0].alsoFor, ['NJD']);
  assert.deepEqual(s.NJD.goalies[0].alsoFor, ['SJS']);
});

const wl = (id, end, hs, as) => ({ id, date: '2024-01-01', end, homeAb: 'HME', awayAb: 'AWY',
  score: { h: hs, a: as }, sog: { h: 1, a: 0 }, attempts: { h: 1, a: 0 },
  blocks: { h: 0, a: 0 }, slot: { h: 0, a: 0 }, located: { h: 0, a: 0 }, level: 0, goalies: [] });

test('⭐ an overtime loss is an OTL in the regular season and a plain L in the playoffs', () => {
  // THE RELATIONSHIP, IN ONE TEST. Splitting this across two tests that each pin
  // their own constant would leave the thing that matters — that the bucket
  // depends on the game TYPE — unchecked by either of them.
  const reg = teamSeasons([wl(2023020001, 'OT', 1, 2)]).seasons['2023'].HME.record;
  const post = teamSeasons([wl(2023030001, 'OT', 1, 2)]).seasons['2023'].HME.record;
  assert.deepEqual(reg.reg, { w: 0, l: 0, otl: 1, undecided: 0 }, 'regular season: an OTL');
  assert.deepEqual(post.post, { w: 0, l: 1, undecided: 0 }, 'playoffs: the league has no OTL');
  assert.ok(!('otl' in post.post), 'and no bucket that could quietly receive one');
});

test('a shootout loss is an OTL, and the ending is read from the period TYPE', () => {
  const t = teamSeasons([wl(2023020001, 'SO', 1, 2)]).seasons['2023'].HME.record.reg;
  assert.equal(t.otl, 1);
  // `endedIn` is the reason this works, and it is checked against a second
  // witness: the period NUMBER, which cannot tell a shootout from an overtime.
  assert.equal(endedIn([{ per: 4, pt: 'OT' }, { per: 5, pt: 'SO' }]), 'SO');
  assert.equal(endedIn([{ per: 4, pt: 'OT' }]), 'OT');
  assert.equal(endedIn([{ per: 3, pt: 'REG' }]), 'REG');
});

test('the record conserves — every game a team played lands in exactly one bucket', () => {
  const t = teamSeasons([
    wl(2023020001, 'REG', 3, 1), wl(2023020002, 'REG', 0, 2),
    wl(2023020003, 'OT', 1, 2), wl(2023020004, 'SO', 1, 2), wl(2023030005, 'OT', 0, 1),
  ]).seasons['2023'].HME;
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  assert.equal(sum(t.record.reg) + sum(t.record.post), t.games,
    'a game that reached no bucket, or two, is a silently wrong record');
  assert.deepEqual(t.record.reg, { w: 1, l: 1, otl: 2, undecided: 0 });
});

test('a game with no winner is counted as undecided, never bucketed as a loss', () => {
  // It cannot happen in NHL data. If it ever does, the honest outcome is a
  // visible zero-sum failure rather than a record that is quietly out by one.
  const t = teamSeasons([wl(2023020001, 'REG', 2, 2)]).seasons['2023'].HME;
  assert.equal(t.record.reg.undecided, 1);
  assert.equal(t.record.reg.l, 0);
});

test('seasons never pool, and out-of-scope games never enter', () => {
  const t = teamSeasons([
    wl(2023020001, 'REG', 3, 1),
    wl(2024020001, 'REG', 3, 1),
    wl(2023010001, 'REG', 3, 1),     // preseason
  ]);
  assert.deepEqual(Object.keys(t.seasons).sort(), ['2023', '2024']);
  assert.equal(t.seasons['2023'].HME.games, 1,
    'the preseason game is archived and viewable and enters no computed number');
  assert.equal(t.seasons['2024'].HME.games, 1);
});

test('⭐ the archive baseline is the SAME number in both documents', () => {
  // Two documents publishing one quantity is the shape this project keeps
  // repairing. They are equal because one function computes it, and this test
  // fails the moment somebody re-derives either side.
  const rs = [{ ...measureGame(SEASON_GAME) }];
  assert.deepEqual(teamSeasons(rs).archive.saveFraction,
                   summarise(rs).attemptMix.saveFraction);
});

test('⭐ the archive save fraction is NOT the division the counts beside it invite', () => {
  // 5.0% of goals in play are scored into an empty net. SEASON_GAME contains
  // exactly one, so the seductive division is available here and must not match.
  const mix = summarise([measureGame(SEASON_GAME)]).attemptMix;
  const seductive = mix.byType['shot-on-goal'] / (mix.byType['shot-on-goal'] + mix.byType.goal);
  assert.notEqual(mix.saveFraction.rate, seductive,
    'goal + shot-on-goal counts the empty-netter as a shot somebody could have saved');
  assert.equal(mix.saveFraction.n, 3, 'three shots were actually faced');
  assert.equal(mix.saveFraction.count, 1);
  assert.match(mix.saveFraction.what, /n counts SHOTS FACED, not games/);
  assert.match(mix.saveFraction.what, /NOT goals \+ shots on goal/,
    'the wrong division has to be named where the right answer is published');
});

test('every published team share states the unit its n counts', () => {
  const arch = teamSeasons([measureGame(SEASON_GAME)]).archive;
  for (const [k, v] of Object.entries(arch)) {
    assert.match(v.what, /n counts (ATTEMPTS|SHOTS FACED), not games/, `${k} does not say what its n counts`);
    assert.doesNotMatch(v.what, /\bwon\b|\blost\b|\bwin\b/i, `${k} describes an outcome`);
  }
});

test('an empty archive measures NOTHING per team, rather than zero', () => {
  const t = teamSeasons([]);
  assert.deepEqual(t.seasons, {});
  assert.equal(t.archive.saveFraction.rate, null);
  assert.equal(t.archive.slotShare.rate, null);
});


/* ---------------------------------------------------------------------------
 * THE TABLE NOBODY DERIVES, CHECKED WHERE THE ARCHIVE IS
 *
 * teams.js claimed "the next relocation or expansion team fails loudly instead
 * of rendering a blank chip". It did not: the completeness test in
 * test/teams.test.js compares TEAMS to a hand-pinned fixture, so a new club
 * would have rendered grey and left every check green until a human re-pinned
 * the list. Same hole an unnamed gameType sat in, one file over.
 *
 * The driver is the only thing that walks every extract, so the day-it-happens
 * half of the guard lives here.
 * ------------------------------------------------------------------------- */

test('a club the team table has never heard of is reported by name', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rtg-clubs-'));
  const g = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
  g.game = { id: 2025020001, date: '2026-01-10', type: 2, src: {} };
  g.teams.home.ab = 'PDX';            // an expansion club, exactly the case
  writeFileSync(join(dir, '2025020001.json'), JSON.stringify(g));
  const { unnamedClubs } = measureAll(dir);
  assert.deepEqual(unnamedClubs, ['PDX']);
});

test('and a full archive of known clubs reports none', () => {
  // MUTATION GUARD. A check that fired on every run would be turned off within
  // a week, and then the expansion team would arrive invisibly.
  const dir = mkdtempSync(join(tmpdir(), 'rtg-clubs-'));
  const g = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
  g.game = { id: 2025020001, date: '2026-01-10', type: 2, src: {} };
  writeFileSync(join(dir, '2025020001.json'), JSON.stringify(g));
  const { unnamedClubs } = measureAll(dir);
  assert.deepEqual(unnamedClubs, []);
  assert.ok(TEAMS[g.teams.home.ab] && TEAMS[g.teams.away.ab],
            'the fixture must use clubs the table names, or this proves nothing');
});

test('a club is collected even from a game that is OUT OF SCOPE', () => {
  // A relocation is likeliest to show up first in preseason, and those games
  // never enter a computed number — so collecting only measured games would
  // make the check blindest exactly where the club first appears.
  const dir = mkdtempSync(join(tmpdir(), 'rtg-clubs-'));
  const g = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
  g.game = { id: 2025010001, date: '2025-09-24', type: 1, src: {} };   // preseason
  g.teams.away.ab = 'PDX';
  writeFileSync(join(dir, '2025010001.json'), JSON.stringify(g));
  const { records, unnamedClubs } = measureAll(dir);
  assert.equal(records.length, 0, 'the preseason game is correctly not measured');
  assert.deepEqual(unnamedClubs, ['PDX'], 'and its club is still seen');
});

/**
 * ⭐ THE REFERENCE CLASS COUNTS THE SAME THING THE CHIP DOES.
 *
 * The selector puts a live count on each lens, and that count is
 * `LEDGER[id](slice).counted.length`. A distribution built on any other quantity
 * would be a number about a different thing wearing the same label — the defect
 * this project has shipped in every other medium: CONTROL against shots on goal,
 * two rates on one screen, the chip and the counter disagreeing 7.8-fold.
 *
 * THE PATH IS INDEPENDENT (H1): the expected value comes from the reducer, and
 * the LENS SET comes from the page's own `LEDGER` table, so a lens added to the
 * selector with no distribution behind it fails here rather than shipping a
 * count nothing can say a normal night for.
 */
test('every lens the selector counts has a distribution of the same quantity', () => {
  const page = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
  const onPage = /const LEDGER=\{([\s\S]*?)\};/.exec(page)[1]
    .match(/(\w+):/g).map(s => s.slice(0, -1)).sort();
  /* ⚠️ ON THE REFERENCE GAME, NOT THE MINIMAL FIXTURE. `GAME` holds four events
     and no stoppage, so the whistle half of this compared 0 to 0 — vacuous, and
     a mutation swapping the field it reads sailed through. Every lens is
     asserted non-zero below for that reason: a check that cannot tell a right
     field from a wrong one on the data it runs is not a check about the field. */
  const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
  const rec = measureGame(rich);
  /* ⭐ THE SAME IDS, WITH NO RENAME AT ALL. The first version keyed two of the
     five to their human labels (`attempts`, `stoppages`) and this assertion had
     to carve out an exception for each — which is a test describing a second
     vocabulary rather than refusing one. */
  assert.deepEqual(onPage, Object.keys(rec.lens).sort(),
    'the selector shows a lens with no per-game distribution behind it, or vice versa');

  const ctx = { roster: rich.roster, homeId: rich.teams.home.id,
                awayId: rich.teams.away.id, evenOnly: false };
  const mods = { corsi, slot: danger, blocked, goaltending, whistle };
  for (const [k, mod] of Object.entries(mods)) {
    assert.equal(rec.lens[k], mod.reduce(rich.events, ctx).counted.length,
      `${k}: the distribution's unit is not the number the chip shows`);
    assert.ok(rec.lens[k] > 0,
      `${k}: this game holds none, so the assertion above compared 0 to 0`);
  }
});

/**
 * ⭐ THE HISTOGRAM IS THE RAW MATERIAL, and the derived figures are checked
 * against the values themselves rather than against each other.
 *
 * `quantile` and `shareAtOrBelow` walk the published counts; this walks the
 * SORTED VALUES, which is a different route to the same answer. A histogram that
 * lost a game, or an off-by-one in `start`, moves one and not the other.
 */
test('the derived figures agree with the values the histogram was built from', () => {
  const vals = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4];
  const d = distribution(vals, 'a made-up count');
  assert.equal(d.n, vals.length, 'the histogram lost or invented a game');
  assert.equal(d.counts.reduce((a, b) => a + b, 0), vals.length, 'the counts do not sum to n');
  assert.equal(d.min, 1); assert.equal(d.max, 9); assert.equal(d.start, d.min);

  const sorted = [...vals].sort((a, b) => a - b);
  for (const q of [0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
    const want = sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)];
    assert.equal(quantile(d, q), want, `the ${q} quantile disagrees with the values`);
  }
  for (let v = 0; v <= 10; v++)
    assert.equal(shareAtOrBelow(d, v), sorted.filter(x => x <= v).length / sorted.length,
      `the share at or below ${v} disagrees with the values`);

  // ⭐ NEAREST-RANK, so every answer is a night somebody played. An interpolated
  // median of 4.5 here would be a count no game in the population holds.
  assert.ok(Number.isInteger(quantile(d, 0.5)), 'the median is not a value that occurred');

  // An empty population publishes no shape, and null is not zero.
  const none = distribution([], 'nothing');
  assert.equal(none.n, 0);
  assert.equal(none.min, null, 'an empty population was given a minimum of 0');
  assert.equal(quantile(none, 0.5), null, 'an empty population was given a median');
  assert.equal(shareAtOrBelow(none, 5), null, 'an empty population was given a rank');
});

/**
 * ⭐ SCOPED PER SEASON, AND THE SEASONS DO NOT MIX. Measured over a 600-game
 * sample against a 200-split random control: pooling moves a game's rank by up
 * to 15 points on attempts, blocked and goaltending, against 7–11 points of
 * sampling noise. See `perGame` in archive.js for the table.
 *
 * The mechanism is asserted with disjoint values rather than with real data, so
 * this cannot pass because two seasons happened to look alike.
 */
test('a season is measured against itself, and says which season it is', () => {
  const rec = (id, n) => ({ id, lens: { corsi: n, slot: n, blocked: n, goaltending: n, whistle: n } });
  const out = perGame([rec(2023020001, 10), rec(2023020002, 12), rec(2024020001, 90)]);
  assert.deepEqual(Object.keys(out).sort(), ['2023', '2024'], 'the seasons were pooled or dropped');
  assert.equal(out['2023'].corsi.n, 2);
  assert.equal(out['2024'].corsi.max, 90, 'a season took a value from another season');
  assert.equal(out['2023'].corsi.max, 12, 'a season took a value from another season');
  assert.match(out['2023'].corsi.population, /2023-24/,
    'the distribution does not name the season it measures, so it reads as the archive');
  assert.match(out['2024'].corsi.population, /2024-25/);
  assert.match(out['2023'].corsi.what, /n counts GAMES/,
    'the unit is not stated, and every other n in this file counts events');

  // A record from before `lens` existed contributes nothing, rather than a zero:
  // "not measured" and "there were none" are different facts.
  const older = perGame([rec(2023020001, 10), { id: 2023020003 }]);
  assert.equal(older['2023'].corsi.n, 1, 'an unmeasured game was counted as a zero');
});
