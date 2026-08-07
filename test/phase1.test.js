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
 * UPDATED FOR PHASE 2. The fixture still pins the numbers -- tallies, goals and
 * goalie lines at all 270 scrubber positions -- because those must never move.
 * What Phase 2 deliberately changed is the ledger's SHAPE: `counted` now folds
 * in blocked shots (with `surprising` annotating rather than partitioning), and
 * `excluded` lists ids with written reasons instead of counting event types.
 * Those assertions were retired here and replaced by real conservation over all
 * 320 events in layers.test.js.
 *
 * A golden file is a refactor gate, not a statement that the behaviour is
 * correct. Do not treat a passing golden test as evidence the numbers are
 * right; that is what attribution.test.js and rink.test.js are for.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corsi } from '../src/lib/layers/corsi.js';
import { goaltending } from '../src/lib/layers/goaltending.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const golden = JSON.parse(readFileSync(new URL('./fixtures/phase1-golden.json', import.meta.url)));

const ctx = { roster: rich.roster, homeId: rich.teams.home.id, awayId: rich.teams.away.id };
const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
const EV = [], EVI = [];
rich.events.forEach((e, n) => { if (!SKIP.has(e.type)) { EV.push(e); EVI.push(n); } });
// Phase 2: layers reduce the FULL stream. The scrubber still walks EV, so a
// frame is the full-game prefix ending at that playable event.
const upto = k => k < 0 ? [] : rich.events.slice(0, EVI[k] + 1);

test('the event list the app reduces is unchanged', () => {
  assert.equal(EV.length, golden.evCount);
});

test('Corsi shows the same numbers at every scrubber position, after Phase 2', () => {
  // The counter animates, so a change that lands the right total while ticking
  // differently is a visible regression. What Phase 2 deliberately changed:
  // `counted` now includes blocked shots (surprising annotates rather than
  // partitions), and `excluded` lists ids with reasons instead of counting
  // types. The TALLIES must not move, and that is what the golden still pins.
  for (const f of golden.frames) {
    const L = corsi.reduce(upto(f.k - 1), ctx);
    assert.deepEqual(L.t, f.t, `tallies at frame ${f.k}`);
    assert.equal(L.hs, f.hs, `home goals at frame ${f.k}`);
    assert.equal(L.as, f.as, `away goals at frame ${f.k}`);
    assert.equal(L.counted.length, f.nCounted + f.nSurprising,
      `attempts at frame ${f.k} (Phase 2 folded surprising into counted)`);
    assert.equal(L.surprising.length, f.nSurprising, `surprising at frame ${f.k}`);
  }
});

test('goaltending shows the same numbers at every position, after Phase 2', () => {
  for (const f of golden.frames) {
    assert.deepEqual(goaltending.reduce(upto(f.k - 1), ctx).g, f.goalies,
      `goalie stats at frame ${f.k}`);
  }
});

test('the same events are still classified the same way', () => {
  // Identity, not just counts. Golden indices are into EV; map them across.
  const L = corsi.reduce(rich.events, ctx);
  const expected = [...golden.finalCountedIdx, ...golden.finalSurprisingIdx]
    .map(k => EVI[k]).sort((a, b) => a - b);
  assert.deepEqual([...L.counted].sort((a, b) => a - b), expected);
});

test('every blocked shot is surprising, and nothing else is', () => {
  const L = corsi.reduce(rich.events, ctx);
  assert.ok(L.surprising.every(s => rich.events[s.id].type === 'blocked-shot'));
  assert.equal(L.surprising.length, rich.events.filter(e => e.type === 'blocked-shot').length);
});

test('the weak conservation this file used to assert is now obsolete', () => {
  // Kept as a marker. The old property measured counted+excluded against EV --
  // a list with 51 events already removed -- so it could not fail in the way
  // that mattered. Real conservation over all 320 lives in layers.test.js.
  assert.equal(EV.length, 269);
  assert.equal(rich.events.length, 320);
});
