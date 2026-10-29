/**
 * Post-goal reading hold — the pure bits (src/lib/goal-read.js).
 * Kevin, 2026-10-29: a fixed 20 s after a goal, same at every gear, with a
 * three-line soft-pause countdown (tap Play / otherwise the Replay / continues). The dwell wiring
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

test('the countdown is three lines: tap Play, otherwise the Replay, continues — singular at 1', () => {
  assert.deepEqual(goalReadLines(20000), {
    tap: 'Tap Play to continue,',
    mid: 'otherwise the Replay',
    or: 'continues in 20 seconds',
  });
  assert.deepEqual(goalReadLines(20000 - 1), {
    tap: 'Tap Play to continue,',
    mid: 'otherwise the Replay',
    or: 'continues in 20 seconds',
  }, 'just under 20 s still reads 20');
  assert.equal(goalReadLines(1000).or, 'continues in 1 second');
  assert.equal(goalReadLines(1).or, 'continues in 1 second');
  assert.equal(goalReadLines(0), null, 'done means gone');
  assert.equal(goalReadLines(-10), null);
  assert.equal(goalReadLabel(3000),
    'Tap Play to continue,\notherwise the Replay\ncontinues in 3 seconds');
  assert.match(goalReadLines(5000).mid, /Replay/, 'capital R in Replay');
});

test('⭐ the hold is the same number at every gear — reading does not scale', () => {
  const gears = [7800, 5400, 3000];
  for (const frameMs of gears) {
    assert.equal(goalReadDwell(), GOAL_READ_MS,
      `at frameMs=${frameMs} the hold must still be ${GOAL_READ_MS}, not a multiple of the gear`);
  }
});

test('Play continues, overlay Pause freezes, Next clears — wired in app.js', () => {
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /function greadSkip\(/,
    'greadSkip (tap-Play-to-continue while ticking) is gone');
  assert.match(app, /function greadFreeze\(/,
    'greadFreeze (overlay Pause) is gone');
  assert.match(app, /function greadResume\(/,
    'greadResume (overlay Resume / main Play after freeze) is gone');
  assert.match(app, /greadPause.*onclick|\$\('greadPause'\)/,
    'the overlay Pause button is not wired');
  assert.match(app, /function stop\(\)\{[^}]*greadClear/,
    'stop() no longer clears the post-goal countdown (Next/scrub path)');
  assert.match(app, /function set\(v,how\)\{if\(how!=='play'\)greadClear/,
    'set() on jump/scrub no longer clears the countdown');
  assert.match(app, /if\(e&&e\.type==='goal'\)\{[^}]*GOAL_READ_MS/,
    'dwell no longer gives goals the fixed read hold');
  assert.match(app, /\$\('greadPause'\)|getElementById\(['"]greadPause['"]\)/,
    'the overlay Pause button is not reached from app.js');
  const markup = readFileSync(new URL('../builders/build_main.py', import.meta.url), 'utf8');
  assert.match(markup, /<button type="button" id="greadPause"/,
    'the overlay Pause button is gone from the markup');
  assert.match(markup, /aria-label="Pause the goal reading hold"/,
    'the overlay Pause button lost its aria-label');
  assert.match(markup, /class="iceslot"[\s\S]*id="gread"[\s\S]*<\/div>\s*<\/div>/,
    '#gread must sit inside .iceslot with the svg so % top is of the ice');
  assert.match(markup, /id="greadMid"/,
    'the three-line overlay needs #greadMid');
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
  assert.equal(a.$('greadTap').textContent, 'Tap Play to continue,');
  assert.equal(a.$('greadMid').textContent, 'otherwise the Replay');
  assert.match(a.$('greadOr').textContent, /continues in \d+ seconds/);
  assert.equal(a.$('greadPause').textContent, 'Pause');
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

test('overlay Pause freezes the hold; Play then resumes it', () => {
  const a = boot(undefined, undefined, '', null, undefined, { motion: true });
  toGoalHold(a);
  const at = +a.$('scrub').value;
  const before = a.wait;
  assert.ok(before >= GOAL_READ_MS);
  assert.equal(a.$('greadPause').textContent, 'Pause');
  assert.match(a.$('greadPause').getAttribute('aria-label') || '', /Pause/i);
  a.$('greadPause').click();
  assert.equal(a.wait, null, 'overlay Pause must clear the auto-continue timer');
  assert.equal(+a.$('scrub').value, at, 'freeze must stay on the goal frame');
  assert.equal(a.$('greadPause').textContent, 'Resume',
    'after overlay Pause the overlay button reads Resume');
  assert.match(a.$('greadPause').getAttribute('aria-label') || '', /Resume/i);
  assert.match(a.$('play').textContent, /Play/,
    'main control still reads Play while the hold is frozen');
  assert.match(a.$('greadOr').textContent, /continues in \d+ seconds/,
    'frozen overlay still names the remaining hold');
  assert.equal(a.$('greadMid').textContent, 'otherwise the Replay');
  // Play resumes the remaining hold (does not skip past the goal).
  a.$('play').click();
  assert.equal(+a.$('scrub').value, at, 'Resume must not leave the goal yet');
  assert.ok(a.wait != null && a.wait > 0 && a.wait <= before,
    `resumed wait should be the remainder, got ${a.wait}`);
  assert.equal(a.$('greadPause').textContent, 'Pause',
    'after Resume the overlay button reads Pause again');
  assert.equal(a.advance(1), 1);
  assert.ok(+a.$('scrub').value > at, 'after the resumed hold, replay continues');
});
