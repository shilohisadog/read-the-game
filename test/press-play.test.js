/**
 * "Press Play" — the instruction that lives on the ice
 *
 * Kevin: "we should overlay 'Press Play' onto the rink, in rather large
 * lettering, so the first time visitor knows what the first step is."
 *
 * WHAT MAKES THIS TESTABLE RATHER THAN A MATTER OF TASTE is that it is a
 * CONDITION, not a tip: it is on screen exactly when the playhead sits at the
 * pre-game frame. That is recomputable from the playhead alone, so it obeys the
 * same rule as the empty-net note and the ends key, and it is the reason there
 * is no first-visit gate to test around.
 *
 * WHAT THIS FILE CANNOT SEE: the fake document has no CSS and no layout, so
 * nothing here proves the overlay is large, centred, or legible over the base
 * layer. That claim was made by looking — tools/pixels.sh at 390 and 1100 —
 * and it is not restated here as though a green test had established it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { app, PAGE_CSS, boot } from './helpers/page.js';

const at = d => +d.$('scrub').value;
const resting = d => d.document.getElementById('rg').classList.contains('atrest');

/* THE STYLESHEET WITH ITS PROSE REMOVED. A raw scan cannot tell a rule from a
   comment ABOUT a rule, and this project has already failed a correct file
   because its own comment quoted the broken line it had just replaced. */
const CSS = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, '');

test('the overlay is on screen at the pre-game frame and nowhere else', () => {
  const a = boot();

  // THE EXPECTED VALUE COMES FROM THE TRANSPORT, NOT FROM THE CLASS. `-1` is
  // read back off the scrubber after stepping below the first play, so this
  // test does not learn where the resting frame is from the thing it is
  // checking. If the floor ever moves, this reddens instead of following it.
  a.$('scrub').oninput({ target: { value: '0' } });
  a.$('back').click();
  assert.equal(at(a), -1, 'the pre-game frame is not where this test believes');
  assert.ok(resting(a), 'no instruction on the one frame that needs it');

  a.$('fwd').click();
  assert.equal(at(a), 0);
  assert.ok(!resting(a), 'the instruction survived the first play');

  a.$('scrub').oninput({ target: { value: String(+a.$('scrub').max) } });
  assert.ok(!resting(a), 'the instruction came back at the final horn');
});

test('pressing it starts the replay — and it is the real control, not a lookalike', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: '0' } });
  a.$('back').click();
  assert.ok(resting(a));

  a.$('pressplay').click();

  // TWO INDEPENDENT WITNESSES, because either alone is satisfied by a stub: the
  // playhead really left the resting frame, and the transport really entered
  // its playing state. A handler that only moved the playhead would pass the
  // first; one that only relabelled the button would pass the second.
  assert.ok(at(a) > -1, 'the overlay was pressed and the game did not start');
  assert.equal(a.$('play').textContent, '⏸ Pause', 'the transport is not playing');
});

test('it removes itself by being obeyed', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: '0' } });
  a.$('back').click();
  a.$('pressplay').click();
  assert.ok(!resting(a), 'the instruction is still on the ice over a running replay');
});

test('the class the renderer sets is actually defined in the stylesheet', () => {
  // The shape this project shipped once already with an SVG mask, and again with
  // an arrival naming an animation the CSS did not define: every DOM assertion
  // above passes against a page that draws NOTHING, because a class with no rule
  // is invisible and silent.
  assert.match(CSS, /#rg\s+\.pressplay\s*\{/, 'the overlay has no styles at all');
  assert.match(CSS, /#rg\.atrest\s+\.pressplay\s*\{[^}]*display:\s*flex/,
    'nothing in the stylesheet ever puts the overlay on screen');
});

test('the hero never shows it — it autoplays and has no button to press', () => {
  // The preview is the front door's five-second loop. An instruction to press a
  // control that is not on the frame would be false there, and false on the one
  // surface a stranger meets first.
  assert.match(CSS, /#rg\.preview\s+\.pressplay\s*,/,
    'the overlay is not in the list of game-view chrome the hero hides');
});

test('it is not a second tab stop for a command the page already offers', () => {
  // `#play` carries the real label and the real focus ring. A duplicate control
  // with the same action is noise to a screen reader, so this one is decorative
  // by declaration rather than by hoping nobody tabs to it.
  const tag = app.match(/<button class="pressplay"[^>]*>/);
  assert.ok(tag, 'the overlay is not in the shipped markup');
  assert.match(tag[0], /aria-hidden="true"/);
  assert.match(tag[0], /tabindex="-1"/);
});
