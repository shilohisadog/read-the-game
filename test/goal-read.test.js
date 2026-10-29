/**
 * Post-goal reading hold — the pure bits (src/lib/goal-read.js).
 * Kevin, 2026-10-29: a fixed 20 s after a goal, same at every gear, with a
 * two-line soft-pause countdown (tap Play, or auto-continue). The dwell wiring
 * and the on-ice element live in app.js; what can be wrong without a browser is
 * checked here, plus a harness walk for tap-to-continue and auto-continue.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GOAL_READ_MS, goalReadLabel, goalReadLines, goalReadDwell } from '../src/lib/goal-read.js';
import { boot } from './helpers/page.js';

test('the hold is 20 seconds and does not take a gear argument', () => {
  assert.equal(GOAL_READ_MS, 20000);
  assert.equal(goalReadDwell(), GOAL_READ_MS);
  assert.equal(goalReadDwell(0), GOAL_READ_MS);
});

test('leftover tracking on the same frame adds to the hold, never shortens it', () => {
  assert.equal(goalReadDwell(1500), GOAL_READ_MS + 1500);
  assert.equal(goalReadDwell(-50), GOAL_READ_MS, 'a negative leftover is not a credit');
});

test('the countdown is two lines: tap Play, and or-continues with singular at 1', () => {
  assert.deepEqual(goalReadLines(20000), {
    tap: 'Tap Play to continue',
    or: 'or the replay continues in 20 seconds',
  });
  assert.deepEqual(goalReadLines(20000 - 1), {
    tap: 'Tap Play to continue',
    or: 'or the replay continues in 20 seconds',
  }, 'just under 20 s still reads 20');
  assert.equal(goalReadLines(1000).or, 'or the replay continues in 1 second');
  assert.equal(goalReadLines(1).or, 'or the replay continues in 1 second');
  assert.equal(goalReadLines(0), null, 'done means gone');
  assert.equal(goalReadLines(-10), null);
  assert.equal(goalReadLabel(3000),
    'Tap Play to continue\nor the replay continues in 3 seconds');
});

test('⭐ the hold is the same number at every gear — reading does not scale', () => {
  const gears = [7800, 5400, 3000];
  for (const frameMs of gears) {
    assert.equal(goalReadDwell(), GOAL_READ_MS,
      `at frameMs=${frameMs} the hold must still be ${GOAL_READ_MS}, not a multiple of the gear`);
  }
});

test('Play continues the hold, Next clears it — wired in app.js (no freeze)', () => {
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /function togglePlay\(\)\{if\(playing&&GREAD&&greadRem\(\)>0\)\{greadSkip/,
    'togglePlay no longer skips the hold when Play is pressed during it');
  assert.match(app, /function stop\(\)\{[^}]*greadClear/,
    'stop() no longer clears the post-goal countdown (Next/scrub path)');
  assert.doesNotMatch(app, /function greadFreeze/,
    'greadFreeze came back — soft hold has no Pause-freeze');
  assert.match(app, /function set\(v,how\)\{if\(how!=='play'\)greadClear/,
    'set() on jump/scrub no longer clears the countdown');
  assert.match(app, /if\(e&&e\.type==='goal'\)\{[^}]*GOAL_READ_MS/,
    'dwell no longer gives goals the fixed read hold');
  assert.match(app, /id=['"]gread['"]|#gread|getElementById\(['"]gread['"]\)/,
    'the countdown element is gone from the app');
  assert.match(app, /Tap Play to continue|goalReadLines/,
    'the soft-pause overlay copy is gone');
});

/** Advance the harness play loop until the pending dwell is a goal hold. */
function toGoalHold(a) {
  a.$('play').click();
  let guard = 0;
  while (guard++ < 800) {
    const ev = a.now().ev;
    if (ev && ev.type === 'goal' && a.wait != null && a.wait >= GOAL_READ_MS) return;
    if (!a.advance(1)) break;
  }
  assert.ok(false, `never reached a goal hold (last wait=${a.wait}, type=${a.now().ev && a.now().ev.type})`);
}

test('tapping Play during the hold continues immediately', () => {
  const a = boot(undefined, undefined, '', null, undefined, { motion: true });
  toGoalHold(a);
  const at = +a.$('scrub').value;
  assert.match(a.$('play').textContent, /Play/,
    'during the hold the button must read Play so the overlay matches');
  assert.doesNotMatch(a.$('play').textContent, /Pause/);
  const overlay = a.$('gread').innerHTML;
  assert.match(overlay, /Tap Play to continue/);
  assert.match(overlay, /or the replay continues in \d+ seconds/);
  a.$('play').click();
  assert.ok(+a.$('scrub').value > at, 'Play during the hold did not leave the goal frame');
  assert.match(a.$('play').textContent, /Pause/,
    'after skipping the hold the replay must be playing again (Pause)');
});

test('the replay auto-continues when the hold reaches 0', () => {
  const a = boot(undefined, undefined, '', null, undefined, { motion: true });
  toGoalHold(a);
  const at = +a.$('scrub').value;
  assert.ok(a.wait >= GOAL_READ_MS, `hold wait was ${a.wait}`);
  assert.equal(a.advance(1), 1, 'the dwell timer did not fire');
  assert.ok(+a.$('scrub').value > at, 'auto-continue did not leave the goal frame');
  assert.match(a.$('play').textContent, /Pause/,
    'after auto-continue the replay must still be playing');
});
