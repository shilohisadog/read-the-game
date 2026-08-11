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
import { measureGame, stable } from '../builders/measure.mjs';

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
