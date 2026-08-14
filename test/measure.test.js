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
import { measureGame, stable, firstAtClock } from '../builders/measure.mjs';
import { summarise } from '../src/lib/archive.js';

/**
 * The analysis tier: the modules the PIPELINE imports, directly or transitively.
 * Named explicitly rather than globbed — a glob would quietly widen the claim to
 * files this test has never checked, which is the failure mode the whole project
 * keeps paying for.
 */
const TIER = [
  'archive.js', 'attribution.js', 'layer.js', 'rink.js', 'strength.js',
  'layers/corsi.js', 'layers/danger.js', 'layers/goaltending.js', 'layers/tied.js',
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
  walk('layers/corsi.js'); walk('layers/tied.js'); walk('archive.js');
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
