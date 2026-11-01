/**
 * Post-goal reading hold (src/lib/goal-read.js for the copy, app.js for the wiring):
 * a fixed GOAL_READ_MS on a goal Play reaches, a three-line countdown under centre ice,
 * and one control — the main button reads Pause throughout.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GOAL_READ_MS, goalReadLines } from '../src/lib/goal-read.js';
import { boot } from './helpers/page.js';

test('the countdown is three lines: tap Pause, otherwise the Replay, continues — singular at 1', () => {
  assert.deepEqual(goalReadLines(20000), {
    tap: 'Tap Pause to stay,',
    mid: 'otherwise the Replay',
    or: 'continues in 20 seconds',
  });
  assert.equal(goalReadLines(20000 - 1).or, 'continues in 20 seconds', 'just under 20 s still reads 20');
  assert.equal(goalReadLines(1000).or, 'continues in 1 second');
  assert.equal(goalReadLines(1).or, 'continues in 1 second');
  assert.equal(goalReadLines(0), null, 'done means gone');
  assert.equal(goalReadLines(-10), null);
});

test('the countdown has no control of its own, and sits inside the ice', () => {
  const markup = readFileSync(new URL('../builders/build_main.py', import.meta.url), 'utf8');
  const gread = /<div id="gread"[\s\S]*?<\/div>/.exec(markup)[0];
  assert.doesNotMatch(gread, /<button/, 'a second pause control is back on the ice');
  assert.match(markup, /class="iceslot"[\s\S]*id="gread"[\s\S]*<\/div>\s*<\/div>/,
    '#gread must sit inside .iceslot with the svg so % top is of the ice');
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

test('⭐ during the hold the button reads Pause, and the countdown names it', () => {
  const a = boot(undefined, undefined, '', null, undefined, { motion: true });
  toGoalHold(a);
  assert.equal(a.$('play').textContent, '⏸ Pause', 'the button must say what pressing it does');
  assert.equal(a.$('greadTap').textContent, 'Tap Pause to stay,');
  assert.equal(a.$('greadMid').textContent, 'otherwise the Replay');
  assert.match(a.$('greadOr').textContent, /^continues in \d+ seconds$/);
  assert.ok(!a.$('gread').hidden);
});

test('⭐ Pause during the hold stays on the goal with no countdown; Play then moves on', () => {
  const a = boot(undefined, undefined, '', null, undefined, { motion: true });
  toGoalHold(a);
  const at = +a.$('scrub').value;
  a.$('play').click();
  assert.equal(+a.$('scrub').value, at, 'Pause left the goal');
  assert.equal(a.wait, null, 'Pause left a timer that will move on');
  assert.ok(a.$('gread').hidden, 'a countdown is still showing on a paused replay');
  assert.match(a.$('play').textContent, /Play/);
  a.$('play').click();
  assert.ok(+a.$('scrub').value > at, 'Play did not move on from the paused goal');
  assert.match(a.$('play').textContent, /Pause/);
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

test('⭐ Play on a goal the reader is resting on leaves it, with no fresh hold', () => {
  const a = boot(undefined, undefined, '', null, undefined, { motion: true });
  const k = a.timeline.findIndex(e => e && e.type === 'goal');
  a.at(k, () => {});
  a.$('play').click();
  assert.ok(+a.$('scrub').value > k, 'Play held the goal the reader had already read');
  assert.ok(a.wait < GOAL_READ_MS, `the next frame waited ${a.wait}`);
  assert.ok(a.$('gread').hidden, 'the countdown came up on a goal Play left');
  // Paired: a goal Play arrives at still holds.
  const b = boot(undefined, undefined, '', null, undefined, { motion: true });
  toGoalHold(b);
  assert.ok(b.wait >= GOAL_READ_MS);
});

test('⭐ a frame that announces nothing does not keep the frame before it’s pill', () => {
  const a = boot(undefined, undefined, '', null, undefined, { motion: true });
  const cap = a.$('caption'), icing = () => cap.classList.contains('on') && /Icing/.test(cap.innerHTML);
  a.$('play').click();
  let n = 0;
  while (!icing() && n++ < 800) if (!a.advance(1)) break;
  assert.ok(icing(), 'no icing pill drawn in the reference game — this test cannot see the defect');
  const k = +a.$('scrub').value;
  a.advance(1);
  assert.ok(+a.$('scrub').value > k);
  assert.match(cap.innerHTML, /Icing/, 'the next frame said something of its own; pick a quieter one');
  assert.ok(!cap.classList.contains('on'), 'the icing pill rode onto the frame after it');
});
