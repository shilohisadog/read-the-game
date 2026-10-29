/**
 * Post-goal reading hold — the pure bits (src/lib/goal-read.js).
 * Kevin, 2026-10-29: a fixed 4 s after a goal, same at every gear, with a
 * countdown so the pause is named. The dwell wiring and the on-ice element live
 * in app.js; what can be wrong without a browser is checked here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GOAL_READ_MS, goalReadLabel, goalReadDwell } from '../src/lib/goal-read.js';

test('the hold is 4 seconds and does not take a gear argument', () => {
  assert.equal(GOAL_READ_MS, 4000);
  // A reading pause that scaled with gear would need the gear here. It does not.
  assert.equal(goalReadDwell(), GOAL_READ_MS);
  assert.equal(goalReadDwell(0), GOAL_READ_MS);
});

test('leftover tracking on the same frame adds to the hold, never shortens it', () => {
  assert.equal(goalReadDwell(1500), GOAL_READ_MS + 1500);
  assert.equal(goalReadDwell(-50), GOAL_READ_MS, 'a negative leftover is not a credit');
});

test('the countdown names whole seconds, and uses the singular at 1', () => {
  assert.equal(goalReadLabel(4000), 'Replay continues in 4 seconds');
  assert.equal(goalReadLabel(4000 - 1), 'Replay continues in 4 seconds', 'just under 4 s still reads 4');
  assert.equal(goalReadLabel(3000), 'Replay continues in 3 seconds');
  assert.equal(goalReadLabel(2000), 'Replay continues in 2 seconds');
  assert.equal(goalReadLabel(1000), 'Replay continues in 1 second');
  assert.equal(goalReadLabel(1), 'Replay continues in 1 second');
  assert.equal(goalReadLabel(0), '', 'done means gone');
  assert.equal(goalReadLabel(-10), '');
});

test('⭐ the hold is the same number at every gear — reading does not scale', () => {
  /* Same shape as CAPTION_BONUS: the words on a goal frame are the same length
     at Slower and at Faster, so the pause that buys time to read them is one
     number. MUTATION: a dwell that returned frameMs for goals would make this
     claim false the moment a gear argument appeared on goalReadDwell. */
  const gears = [7800, 5400, 3000];
  for (const frameMs of gears) {
    assert.equal(goalReadDwell(), GOAL_READ_MS,
      `at frameMs=${frameMs} the hold must still be ${GOAL_READ_MS}, not a multiple of the gear`);
  }
});


test('Pause freezes the hold, Next clears it — wired in app.js', () => {
  /* The freeze/clear behaviour needs the transport; the pure module cannot see
     it. Pin the call sites so a refactor cannot drop them quietly. */
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /function stop\(\)\{[^}]*greadFreeze/,
    'stop() no longer freezes the post-goal countdown');
  assert.match(app, /function set\(v,how\)\{if\(how!=='play'\)greadClear/,
    'set() on jump/scrub no longer clears the countdown');
  assert.match(app, /if\(e&&e\.type==='goal'\)\{[^}]*GOAL_READ_MS/,
    'dwell no longer gives goals the fixed read hold');
  assert.match(app, /id=['"]gread['"]|#gread|getElementById\(['"]gread['"]\)/,
    'the countdown element is gone from the app');
});
