/**
 * ⭐⭐ THE SAFETY ARGUMENT FOR DECOMPOSING `boot()`, AND ITS CONTROL.
 *
 * Step 1 was safe because `--verify` proved the built page did not change by one
 * byte. **Step 2 has no such property** — moving a cluster out of `boot` moves
 * its body above the function and rewrites every call site, so the bytes change
 * by construction. This is what replaces it: the rendered DOM at every scrubber
 * position, pinned, so an extraction that changes what reaches the screen is red
 * rather than argued about.
 *
 * ⚠️ AND THE CONTROL IS NOT OPTIONAL HERE. CHENG's condition, and it names the
 * failure exactly: *"prove the harness can fail by perturbing one attribute and
 * watching it go red, or the walk is satisfied by a comparison of two empty
 * strings."* This project has shipped that failure — a mutation harness that
 * disarmed three alarms while 150 tests stayed green, an element-hiding test
 * satisfied by either of two mechanisms. A comparison of two things produced by
 * the same broken capture is green for the worst possible reason.
 *
 * So three of the four tests below are about the instrument rather than the page.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { capture, differences, read } from '../tools/dom-golden.mjs';
import { LAYER_TOKENS } from '../src/lib/deeplink.js';

const gold = read();
const made = capture();

test('⭐ the rendered DOM is identical to the golden, frame for frame', () => {
  const diff = differences(gold, made);
  assert.deepEqual(diff, [],
    'the page renders something different from the committed golden. If that was '
    + 'deliberate, run `node tools/dom-golden.mjs`, READ what it prints, and commit '
    + 'the fixture with the change that caused it. If it was not, a refactor moved '
    + 'more than code.\n'
    + diff.map(d => `  #${d.id} ${d.at === null ? '' : `frame ${d.at}`}`).join('\n'));
});

/* ⚠️ THE TWO CONTROLS BELOW COMPARE `made` WITH A BENT COPY OF `made`, NEVER WITH
   THE GOLDEN, AND THAT IS DELIBERATE. The first draft used the golden as the
   baseline; when a real page change was made to check this file end to end, all
   three tests went red together. A control that dies whenever its subject dies
   adds no information — it cannot tell "the comparator works and the page moved"
   from "the comparator is broken". These two are about `differences()` and must
   stay green while the test above is red. */

test('⭐⭐ …and the comparison can fail — one changed hash is caught', () => {
  /* Without this, a capture that silently stopped recording would compare empty
     to empty and pass forever, which is this repo's most-repeated defect wearing
     green. Perturb one element at one frame and require it named. */
  const varying = Object.keys(made.el).find(id => Array.isArray(made.el[id]));
  assert.ok(varying, 'no element varies across the game — the capture is not capturing');

  const bent = { ...made, el: { ...made.el, [varying]: [...made.el[varying]] } };
  const at = bent.el[varying].findIndex((v, i, a) => i > 0 && v !== a[i - 1]);
  assert.ok(at > 0, `#${varying} never actually changes value, so bending it proves nothing`);
  bent.el[varying][at] = 'deadbeefdead';

  const diff = differences(made, bent);
  assert.equal(diff.length, 1, `expected exactly one difference, got ${diff.length}`);
  assert.equal(diff[0].id, varying);
  assert.equal(diff[0].at, at, 'the difference was reported at the wrong frame');
});

test('⭐⭐ …and an element that stops being written is caught', () => {
  /* THE OTHER DIRECTION, and the one a refactor is likelier to cause: a cluster
     moved out of boot and its wiring not reconnected, so the element is simply
     never touched. A check that only compares keys present in BOTH captures
     would call that a pass. */
  const [dropped] = Object.keys(made.el);
  const short = { ...made, el: { ...made.el } };
  delete short.el[dropped];

  const diff = differences(made, short);
  assert.equal(diff.length, 1);
  assert.equal(diff[0].id, dropped);
  assert.equal(diff[0].now, '(absent)');
});

test('⭐⭐ …and a changed popup markup is caught', () => {
  /* ⛔ THE POPUP NEEDED ITS OWN CONTROL BECAUSE IT NEEDED ITS OWN PASS. The
     scrubber walk never touches `#whyContent` — it renders only on a click — so
     the first version of this golden covered 86 elements and gave ZERO coverage
     of the cluster it was built to protect. Captured-but-never-compared would
     have been the next way to get that wrong, so the diff is exercised here. */
  const [k] = Object.keys(made.popup.at);
  assert.ok(k !== undefined, 'no click ever rendered the popup — the pass is not passing');

  const bent = { ...made, popup: { ...made.popup, at: { ...made.popup.at, [k]: 'deadbeef/dead' } } };
  const diff = differences(made, bent);
  assert.equal(diff.length, 1, `expected exactly one difference, got ${diff.length}`);
  assert.equal(diff[0].id, 'whyContent');
  assert.equal(diff[0].at, `click ${k}`);
});

test('⭐⭐ …and a change inside one layer\'s walk is caught, and named by layer', () => {
  /* ⛔ THE LAYER WALKS WERE ADDED BECAUSE THE BASE WALK DOES NOT REACH THEM.
     Booting with no layer selected leaves `whichPick()` at `none`, so `#workBody`
     was never written and the layer box under the rink held one value for all 269
     frames. The show-me-the-work panel — the surface this project's promise
     actually rests on — was entirely outside a fixture that claimed to pin what
     the page draws. Second time the same way: `#whyContent` was missing because
     it opens on a CLICK, this because it opens on a CHOICE. */
  const [layer] = Object.keys(made.layers);
  assert.ok(layer, 'no layer walks captured at all');
  const varying = Object.keys(made.layers[layer].el).find(id => Array.isArray(made.layers[layer].el[id]));
  assert.ok(varying, `nothing varies across the ${layer} walk`);

  const bent = JSON.parse(JSON.stringify(made));
  bent.layers[layer].el[varying][10] = 'deadbeefdead';
  const diff = differences(made, bent);
  assert.equal(diff.length, 1, `expected exactly one difference, got ${diff.length}`);
  assert.equal(diff[0].id, `${layer}/${varying}`,
               'the difference is not attributed to the layer that produced it');
});

test('⛔ the golden is not trivially satisfiable', () => {
  /* A fixture of one frame, or of elements that never change, would pass the
     test above against almost any refactor. What makes the walk worth running is
     that it covers the whole game and that the page's main surfaces really do
     move across it — so both are asserted rather than assumed. */
  assert.ok(gold.frames > 200, `only ${gold.frames} frames pinned — that is a sample, not a walk`);
  assert.equal(gold.frames, made.frames, 'the walk length changed, so the two are not comparable');

  const varying = Object.keys(gold.el).filter(id => Array.isArray(gold.el[id]));
  assert.ok(varying.length > 10,
            `only ${varying.length} elements change across the whole game — the capture is too shallow`);

  /* Named, because "some elements vary" is satisfied by a clock. These are the
     surfaces a decomposition of the drawing code would break. */
  for (const id of ['events', 'rink', 'puck', 'per'])
    assert.ok(Array.isArray(gold.el[id]),
              `#${id} is constant across the whole game, which cannot be true of a replay`);

  /* ⛔ AND THE INTERACTION PASS HAS TO HAVE HAPPENED. A pass that opened nothing
     would store `{}`, compare `{}` to `{}`, and pass forever — which is exactly
     the state this golden shipped in for its first hour, undetected, because the
     scrubber walk simply never clicks anything. The reference game has 44 slot
     shots; a floor well under that catches a pass that half-works without
     pinning a number that moves when the fixture game does. */
  assert.ok(gold.popup.rendered > 20,
            `only ${gold.popup.rendered} clicks rendered the why-popup — the interaction pass is broken`);
  assert.equal(gold.popup.rendered, made.popup.rendered,
               'the popup renders a different number of times than the golden records');

  /* ⛔ AND EVERY LAYER IS WALKED WITH ITS PANEL OPEN. The layer list is derived
     from `deeplink.js`, which derives it from the layer objects, so a sixth layer
     is covered the day it exists — but a pass that silently stopped opening the
     panel would store an empty delta and compare nothing to nothing, which is the
     shape that passes forever. So the panel is required to vary. */
  const layers = Object.keys(gold.layers);
  assert.deepEqual(layers.sort(), [...LAYER_TOKENS].sort(),
                   'the golden does not walk every layer the URL vocabulary knows');
  for (const l of layers) {
    const wb = gold.layers[l].el.workBody;
    assert.ok(Array.isArray(wb) && new Set(wb).size > 100,
      `the ${l} walk did not render a changing work panel — the panel is the surface this `
      + 'fixture exists to protect, and an empty delta compares nothing to nothing');
  }
});
