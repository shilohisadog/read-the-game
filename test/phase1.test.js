/**
 * Phase 1: the extraction must not change a single number on screen.
 *
 * test/fixtures/phase1-golden.json was captured from the SHIPPED implementation
 * before any code moved -- every scrubber position, every tally, every goalie
 * line. These tests replay the extracted modules against it.
 *
 * That makes "behaviour preserved" a measurement rather than a belief, which
 * matters here more than usual: the app renders numbers I cannot see, so
 * "looks the same" is not available to me as evidence.
 *
 * NOTE ON WHAT THIS FIXTURE IS. It pins CURRENT behaviour, including behaviour
 * we already know is wrong -- `excluded` counts by type instead of listing ids,
 * and the caller hands us an event list with 51 events already removed. Phase 2
 * changes both on purpose and will update this fixture. A golden file is a
 * refactor gate, not a statement that the behaviour is correct. Do not treat a
 * passing golden test as evidence the numbers are right; that is what
 * attribution.test.js and rink.test.js are for.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corsiLens } from '../src/lib/layers/corsi.js';
import { goaltendingLens } from '../src/lib/layers/goaltending.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const golden = JSON.parse(readFileSync(new URL('./fixtures/phase1-golden.json', import.meta.url)));

const ctx = { roster: rich.roster, homeId: rich.teams.home.id, awayId: rich.teams.away.id };
const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
const EV = rich.events.filter(e => !SKIP.has(e.type));

test('the event list the app reduces is unchanged', () => {
  assert.equal(EV.length, golden.evCount);
});

test('Corsi matches the shipped implementation at every scrubber position', () => {
  // Not just the final number -- the counter animates, and a refactor that got
  // the total right while ticking differently would be a visible regression.
  for (const f of golden.frames) {
    const L = corsiLens(EV.slice(0, f.k), ctx);
    assert.deepEqual(L.t, f.t, `tallies at frame ${f.k}`);
    assert.equal(L.hs, f.hs, `home goals at frame ${f.k}`);
    assert.equal(L.as, f.as, `away goals at frame ${f.k}`);
    assert.deepEqual(L.excluded, f.excluded, `exclusions at frame ${f.k}`);
    assert.equal(L.counted.length, f.nCounted, `counted at frame ${f.k}`);
    assert.equal(L.surprising.length, f.nSurprising, `surprising at frame ${f.k}`);
  }
});

test('goaltending matches the shipped implementation at every position', () => {
  for (const f of golden.frames) {
    assert.deepEqual(goaltendingLens(EV.slice(0, f.k), ctx), f.goalies,
      `goalie stats at frame ${f.k}`);
  }
});

test('the same events land in counted and surprising, not just the same count', () => {
  const L = corsiLens(EV, ctx);
  assert.deepEqual(L.counted.map(e => EV.indexOf(e)), golden.finalCountedIdx);
  assert.deepEqual(L.surprising.map(e => EV.indexOf(e)), golden.finalSurprisingIdx);
});

test('every blocked shot is surprising, and nothing else is', () => {
  // The one classification rule this layer encodes. Worth pinning separately
  // from the golden, because the golden would happily preserve a wrong rule.
  const L = corsiLens(EV, ctx);
  assert.ok(L.surprising.every(e => e.type === 'blocked-shot'));
  assert.equal(L.surprising.length, EV.filter(e => e.type === 'blocked-shot').length);
});

test('conservation holds over the events this lens is given', () => {
  // Deliberately weak, and labelled so. It conserves over EV, not over the game
  // -- the 51 events dropped upstream are invisible here. Phase 2 binds this to
  // loadGame() output, at which point the property can actually fail.
  const L = corsiLens(EV, ctx);
  const excluded = Object.values(L.excluded).reduce((a, b) => a + b, 0);
  assert.equal(L.counted.length + L.surprising.length + excluded, EV.length);
  assert.equal(EV.length, 269);
  assert.equal(rich.events.length, 320, 'and 51 events never reach the ledger');
});
