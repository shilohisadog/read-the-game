/**
 * ONE LANDING, DRAWN ONCE — the scrubber's gesture, and the memo under every draw
 *
 * ⭐⭐⭐ WHY THIS FILE EXISTS. Kevin, 2026-10-04, replaying a game: *"when it
 * plays continuously and event by event it plays fine, but when I tap the
 * scrubber to a different time, the replay appears to go through two loops for
 * each event."*
 *
 * He was right, and the cause is a property of the control rather than of this
 * code: A NATIVE RANGE REPORTS ONE TAP TWICE. Measured with a real mouse press
 * on the real page (`tools/browser/one-tap.mjs`):
 *
 *     pointerdown=280   input=110   pointerup=110   change=110
 *
 * `oninput` drew frame 110 as a scrub and `onchange` drew it again as a jump,
 * 108ms later. The label's entrance animation ran TWICE, 117ms apart, and the
 * mark was drawn plain and then re-drawn popping. Two loops.
 *
 * ⛔⛔ AND NOTHING IN THIS SUITE COULD SEE IT, FOR TWO REASONS WORTH KEEPING.
 * The first is that every probe and test here drives the scrubber by dispatching
 * `input` ALONE — half of a gesture no hand can make — so the pair was never
 * exercised. The second is that the visible damage is an ANIMATION RESTARTING,
 * which is not a DOM state at all: the document after two draws is identical to
 * the document after one. So the tests below assert the two things that ARE
 * checkable here — how many times a frame is drawn, and how many times an
 * element is written — and the animation itself is measured in a browser by
 * `one-tap`, which presses the control with a trusted event and counts
 * `animationstart`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { app, boot } from './helpers/page.js';

/** A tap, as the browser actually delivers one. */
function tap(d, k) {
  const s = d.$('scrub');
  s.onpointerdown();
  s.value = String(k);
  s.oninput({ target: { value: s.value } });
  s.onchange({ target: { value: s.value } });
}

/** A drag: pressed once, reporting every value it crosses, released on the last. */
function drag(d, from, to) {
  const s = d.$('scrub');
  s.onpointerdown();
  for (let k = from; k <= to; k++) {
    s.value = String(k);
    s.oninput({ target: { value: s.value } });
  }
  s.onchange({ target: { value: s.value } });
}

/* ⭐ THE FRAME IS COUNTED BY ITS WRITES, which the fake element already tracks
   for the caption's sake. `#events` is the right subject: it is rewritten on
   every draw of the frame and nothing else writes it. */
const draws = d => d.$('events').writes;

test('a tap on the scrubber draws the frame it lands on exactly once', () => {
  const d = boot();
  const before = draws(d);
  tap(d, 110);
  assert.equal(draws(d) - before, 1,
    'one tap drew the frame more than once — this is the defect: `input` and '
    + '`change` report the same value, and both were drawn');
  assert.equal(+d.$('scrub').value, 110, 'the tap did not land where it was aimed');
});

test('and it lands as a moment, so the play is called', () => {
  /* ⭐ THE POINT OF DRAWING IT ONCE IS THAT THE ONE DRAW IS THE JUMP, not the
     scrub. A fix that simply dropped the second draw would leave the landing
     uncaptioned and unflourished — the frame would arrive silently, which is a
     different defect wearing this one's fix. */
  const d = boot();
  const goal = d.every((_, at) => at.ev.type).indexOf('goal');
  assert.ok(goal > 0, 'the reference game must hold a goal for this to mean anything');
  tap(d, goal);
  assert.match(d.$('events').innerHTML, /\bflare\b/,
    'the tap landed on a goal and the ice did not call it');
});

test('a drag still follows the thumb, and is called once at the end', () => {
  /* A DRAG PASSES THROUGH PLAYS; A RELEASE LANDS ON ONE — unchanged, and the
     reason the first report of a gesture is withheld rather than the whole of
     `oninput`: the ice has to follow a drag or the control is dead in the hand.
     THE FIRST REPORT IS THE ONE WITHHELD, so a drag over n values draws n-1 of
     them and then its landing: n in total, same as before, one of them a jump. */
  const d = boot();
  const before = draws(d);
  drag(d, 100, 109);
  assert.equal(draws(d) - before, 10, 'the ice did not track the drag');
  assert.equal(+d.$('scrub').value, 109);
});

test('a lone synthetic input still draws, because it is not a gesture', () => {
  /* ⛔ THIS IS THE BLAST RADIUS, AND IT IS DELIBERATELY ZERO. Every probe in
     `tools/browser` and a dozen tests here drive the scrubber with `input` and
     no pointer — `summary-marks` reaches the horn that way, `states` seeks that
     way. A report that arrives with no gesture under it is not a gesture, so it
     is drawn, and all of them keep working. The day one of them sends the pair a
     real tap sends, it gets a real tap's behaviour. */
  const d = boot();
  const before = draws(d);
  d.$('scrub').oninput({ target: { value: '120' } });
  assert.equal(draws(d) - before, 1, 'a synthetic input drew nothing — every probe is now blind');
  assert.equal(+d.$('scrub').value, 120);
});

test('keyboard arrows report the same pair, and are one landing too', () => {
  // `keydown` begins a gesture for the same reason `pointerdown` does: an arrow
  // key fires `input` AND `change` for one press, which is the identical double.
  const d = boot();
  const s = d.$('scrub');
  const before = draws(d);
  s.onkeydown();
  s.value = '130';
  s.oninput({ target: { value: s.value } });
  s.onchange({ target: { value: s.value } });
  assert.equal(draws(d) - before, 1, 'one arrow press drew the frame twice');
});

test('a subtree whose markup did not change is not rewritten', () => {
  /* ⭐⭐ THE RULE UNDER EVERY DRAW, and it is not about performance: REPLACING AN
     ELEMENT RESTARTS ITS ENTRANCE ANIMATION. `drawNetmen` had reasoned this out
     for the goaltenders since it was written and was the only drawing function
     that had; `put` is that memo generalised.
     THE SUBJECT IS A SECOND DRAW OF ONE FRAME, which is what a layer toggle, a
     strength change and a drag's release all produce. */
  const d = boot();
  d.$('scrub').oninput({ target: { value: '140' } });
  const was = { events: d.$('events').writes, labels: d.$('labels').writes,
                netmen: d.$('netmen').writes, puck: d.$('puck').writes };
  // The same frame again, by the route a layer toggle takes.
  d.$('scrub').oninput({ target: { value: '140' } });
  for (const [id, n] of Object.entries(was))
    assert.equal(d.$(id).writes, n,
      `#${id} was rewritten for a frame that had not changed, which restarts its `
      + 'entrance animation on screen');
});

test('and it still rewrites when the markup DOES change', () => {
  /* ⛔ THE OTHER HALF, AND NEITHER IS SAFE ALONE. A memo that never writes
     passes the test above perfectly and ships a frozen rink. This repo has the
     paired-test pattern written down for exactly this shape. */
  const d = boot();
  d.$('scrub').oninput({ target: { value: '140' } });
  const was = d.$('events').writes;
  d.$('scrub').oninput({ target: { value: '141' } });
  assert.equal(d.$('events').writes, was + 1, 'a new frame did not reach the ice');
});

test('every writer of a memoised element goes through the memo', () => {
  /* ⛔⛔ THE TRAP IN A MEMO KEYED BY ELEMENT: a SECOND writer that assigns
     `innerHTML` directly leaves the memo holding a string that is not on screen,
     and the next `put` of that string is skipped — so the stale content stays.
     `#draws` and `#whistles` each have two writers (the layer's own draw
     function, and `render` clearing them when the layer is off), which is
     exactly the pair that would strand nine face-off rings on the ice after the
     chip was switched off. */
  const code = app.split('<script>').pop();
  for (const id of ['events', 'labels', 'netmen', 'puck', 'lines', 'cue', 'draws', 'whistles']) {
    const direct = new RegExp(`\\$\\('${id}'\\)\\.innerHTML\\s*=`);
    assert.doesNotMatch(code, direct,
      `#${id} is written directly as well as through \`put\`, so the memo can go stale`);
  }
  // And the clearing path is the one that proves it: turn a layer off, twice.
  const d = boot();
  d.$('scrub').oninput({ target: { value: '140' } });
  const empty = d.$('draws').innerHTML;
  assert.equal(empty, '', 'the zone-start layer is off by default, so this starts empty');
});
