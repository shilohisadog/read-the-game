/**
 * Where to look next — the five-foot circle on the next event's spot.
 *
 * ⭐ THE ONE FAILURE THAT WOULD MAKE THIS FEATURE WORSE THAN NOTHING is the
 * circle promising a spot the mark then misses. A viewer who learns to trust it
 * and is sent to the wrong place is worse off than one who was never told
 * anything. So that is what the first test measures, and it measures it the only
 * way that proves anything: BOTH NUMBERS COME OUT OF THE DOM.
 *
 * There is no coordinate arithmetic anywhere in this file. A test that computed
 * `AX(e.x, e.per)` and compared it to the page's `AX(e.x, e.per)` would be a
 * mirror — one path from the code under test to the expected value, which
 * `docs/status.md` §H2 says is not a test at all. Here the expected value is
 * produced by a DIFFERENT part of the page (the event renderer) at a DIFFERENT
 * moment (one frame later), and the check is that they agree.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { app, PAGE_CSS, boot } from './helpers/page.js';

const seek = (d, v) => d.$('scrub').oninput({ target: { value: String(v) } });

/** Every cx/cy pair in a chunk of SVG, in document order. No parsing of ours. */
const points = html => [...html.matchAll(/cx="(-?[\d.]+)"\s+cy="(-?[\d.]+)"/g)]
  .map(m => ({ x: +m[1], y: +m[2] }));

const cuePoint = d => { const p = points(d.$('cue').innerHTML); return p.length ? p[0] : null; };

test('the circle sits exactly where the next mark lands', () => {
  const d = boot();
  const last = +d.$('scrub').max;
  let checked = 0, agreed = 0, worst = 0;

  for (let i = 0; i < last; i++) {
    seek(d, i);
    const cue = cuePoint(d);
    if (!cue) continue;
    seek(d, i + 1);
    // The mark for the frame we just moved to. An ATTEMPT renders as a figure
    // with no cx/cy of its own, so those frames are skipped -- `drawCue` has one
    // code path and does not know the event's type, so the population that can
    // be read still exercises all of it.
    const mark = points(d.$('events').innerHTML)[0];
    if (!mark) continue;
    checked++;
    const off = Math.hypot(cue.x - mark.x, cue.y - mark.y);
    worst = Math.max(worst, off);
    // A tenth of a foot: both sides are printed with toFixed(1).
    if (off <= 0.1) agreed++;
  }

  assert.ok(checked >= 40, `only ${checked} frames could be read — the walk proves nothing`);
  assert.equal(agreed, checked,
    `${checked - agreed} of ${checked} circles pointed somewhere the mark did not land ` +
    `(worst miss ${worst.toFixed(1)} ft)`);
});

test('the circle is one event AHEAD, not on the event being watched', () => {
  /* THE TEST ABOVE PASSES IF THE CIRCLE IS DRAWN ON THE CURRENT MARK TOO.
     Seek to i, read the cue; seek to i+1, read the mark: a circle that simply
     tracked the CURRENT event would satisfy that comparison at every frame,
     because the thing it drew at i+1 is the thing being compared. The offset is
     the entire feature and it needs its own instrument. */
  const d = boot();
  let checked = 0, ahead = 0;
  for (let i = 5; i < 60; i++) {
    seek(d, i);
    const cue = cuePoint(d);
    const here = points(d.$('events').innerHTML)[0];
    if (!cue || !here) continue;
    checked++;
    if (Math.hypot(cue.x - here.x, cue.y - here.y) > 0.1) ahead++;
  }
  assert.ok(checked >= 15, `only ${checked} frames were readable`);
  // Two consecutive events CAN share a coordinate, so this is a majority claim
  // rather than a universal one -- but a circle drawn on the current mark would
  // score zero, not a near miss.
  assert.ok(ahead > checked * 0.7,
    `only ${ahead} of ${checked} circles were somewhere other than the current mark`);
});

test('no circle once there is no next event', () => {
  const d = boot();
  seek(d, +d.$('scrub').max);
  assert.equal(d.$('cue').innerHTML, '',
    'the final frame still points at something after the game');
});

test('a goal is not suppressed — the circle precedes it like anything else', () => {
  /* ⚠️ IF THE CIRCLE PRECEDED EVERY EVENT EXCEPT A GOAL, ITS ABSENCE WOULD
     ANNOUNCE ONE. That is a spoiler through a side channel, the same leak
     `drawBoxes` refuses when it declines to count a penalty clock down to its
     true end. Kevin ruled it out explicitly on 2026-08-28.
     The goals are found by walking the ice, not by filtering the extract, so
     this cannot agree with a wrong idea of which events are goals. */
  const d = boot();
  const last = +d.$('scrub').max;
  const goals = [];
  for (let i = 0; i <= last; i++) {
    seek(d, i);
    if (/class="ev [^"]*\bgoal\b/.test(d.$('events').innerHTML)) goals.push(i);
  }
  assert.ok(goals.length >= 3, `only ${goals.length} goals were found on the ice`);
  for (const g of goals) {
    if (g === 0) continue;
    seek(d, g - 1);
    assert.notEqual(cuePoint(d), null,
      `the frame before the goal at ${g} had no circle — its absence is the tell`);
  }
});

test('the circle carries an edge, and the edge holds its width on a phone', () => {
  /* A FILL ALONE IS A SMUDGE WITH NO LOCATION, which is exactly how the first
     version failed in front of Kevin: "I can't tell which area the next event is
     going to be." The ring is what makes it a place.
     `non-scaling-stroke` is load-bearing rather than tidy: the rink is 200 units
     wide at every screen size, so a stroke in user units thins with the viewport
     — and 390px is the one place where five feet is nine pixels across and the
     ring is all there is to see. The node suite cannot see a pixel, so this
     asserts the declaration that makes the pixel possible. */
  assert.match(PAGE_CSS, /#rg \.cuer\{[^}]*vector-effect:non-scaling-stroke/,
    'the ring scales with the rink again — it thins to nothing on a phone');
  assert.match(PAGE_CSS, /#rg \.cuef\{[^}]*opacity:\.1/,
    'the fill is no longer faint');
});

test('the circle takes a colour no hockey fact uses', () => {
  /* Red and blue are lines, amber is the slot, and the two greys are the clubs:
     every colour on that ice means something about the GAME. This one means
     something about US, and a `display:` claim wearing a hockey colour is the
     confusion the provenance tags exist to prevent. */
  const cue = PAGE_CSS.match(/--cue:(#[0-9a-f]{6})/i);
  assert.ok(cue, 'no --cue token');
  for (const other of ['--red', '--blue', '--hd', '--home', '--away']) {
    const m = PAGE_CSS.match(new RegExp(other + ':(#[0-9a-f]{6})', 'i'));
    assert.notEqual(cue[1].toLowerCase(), m && m[1].toLowerCase(),
      `--cue is ${other} — the circle is wearing a colour that means something about hockey`);
  }
});

test('the ring can be switched off, and switching it off empties the ice', () => {
  /* ⭐ THIS IS A DOCTRINE CONTROL, NOT A PREFERENCE ONE. The ring is the only
     thing on the site drawn from knowledge of what happens next, and a page
     whose claim is "nothing is invented" has to be able to show a replay with
     that one lookahead removed. A toggle that changed a class but left the
     circle drawn would satisfy an aria check and fail the promise. */
  const d = boot();
  seek(d, 30);
  assert.notEqual(cuePoint(d), null, 'no ring to switch off at frame 30');

  const btn = c => [...d.document.querySelectorAll('#rg .cbtn')].find(b => b.dataset.c === c);
  btn('off').click();
  assert.equal(d.$('cue').innerHTML, '', 'the ring is still on the ice after being switched off');
  assert.equal(btn('off').getAttribute('aria-pressed'), true, 'the pressed button is not the chosen one');

  btn('on').click();
  assert.notEqual(cuePoint(d), null, 'the ring did not come back');
});

test('the closed drawer says which way the ring is set', () => {
  // A control you cannot see must still be able to say what it is doing --
  // the rule `zTrailsOn` already follows, for the same reason: the ice must
  // never carry something with nothing on screen accounting for it.
  const d = boot();
  const btn = c => [...d.document.querySelectorAll('#rg .cbtn')].find(b => b.dataset.c === c);
  const said = () => d.$('zCueOn').textContent;
  const on = said();
  assert.ok(on && on.length, 'the drawer summary says nothing about the ring');
  btn('off').click();
  assert.notEqual(said(), on, `the summary reads "${said()}" whichever way the ring is set`);
});

test('the ring is named in the key a viewer can actually see', () => {
  /* Kevin, 2026-08-29: "we need to identify what the green circle represents
     somewhere (obvious, so the viewer knows what they are looking at/for)".

     ⚠️ AND THE FIRST ATTEMPT PUT IT SOMEWHERE INVISIBLE. `.zref` — "What the
     marks mean" — is PARKED (`#rg .zref{display:none}`, §20), so an entry added
     to its `.areas` list ships in the markup and reaches nobody. What a viewer
     sees is `capFor('none')`, which harvests the children of `.zref .legend`
     into the Just events caption under the selector. So the entry has to be a
     `.legend` child, and this asserts it lands in the RENDERED caption rather
     than merely in the file. The node suite cannot see `display:none`; this
     works around that by checking the output of the code that does the moving. */
  const d = boot();
  const cap = d.$('lcap').innerHTML;
  assert.match(cap, /k-cue/, 'the visible key never mentions the ring');
  assert.match(cap, /next play/i, 'the ring is in the key with no name on it');
  assert.match(PAGE_CSS, /#rg \.k-cue\{/, 'the swatch has no style, so the key shows a blank');
});

test('the page names the ring where a newcomer will be, and admits it is ours', () => {
  /* Three surfaces, and they do three different jobs rather than repeating one:
     the key NAMES it, the newcomer block says what to DO with it, and the
     control's note says WHERE IT COMES FROM. That last one is the doctrine
     sentence — every other thing on that ice is a fact about hockey and this is
     us reading a line ahead. */
  const d = boot();
  assert.match(d.$('newcomer').innerHTML, /green ring/i,
    'the newcomer block never names the ring');
  assert.match(d.$('nCue').textContent, /read ahead/i,
    'the control describes the ring without admitting where it comes from');
});

test('the group is under the marks, so a mark is never hidden by its own circle', () => {
  // SVG paints in document order. `cue` after `events` would draw the hint on
  // top of the thing it is pointing at.
  const svg = app.match(/<svg viewBox="0 0 200 85">([\s\S]*?)<\/svg>/)[1];
  assert.ok(svg.indexOf('id="cue"') < svg.indexOf('id="events"'),
    'the circle is painted over the mark it is announcing');
});
