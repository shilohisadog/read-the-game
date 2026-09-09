/**
 * THE GAME PAGE'S TWO COLUMNS — docs/game-page-fold.md, and what a node test can
 * hold about a layout.
 *
 * ⛔ WHAT THIS FILE CANNOT SEE: the layout. The fake document has no CSS, and
 * `tools/dom-golden.mjs` compares rendered DOM, which this change does not move.
 * `tools/pixels.sh` is the only instrument that can, and the numbers it produced
 * are in §10 of the document. What IS checkable here is the set of claims the
 * layout rests on — which blocks moved, which did not, and that there is one DOM
 * rather than two markup paths.
 *
 * ⭐ THAT LAST ONE IS CHENG's CONDITION ON THE WHOLE CHANGE: *"the moment a media
 * query requires a second markup path, you have two renderings that can disagree,
 * and this project's record on that is unambiguous. So: fine, and add the
 * assertion rather than relying on the discipline."* The assertion is here: the
 * wrapper is `display:contents` unconditionally, the grid exists only inside the
 * query, and the query hides nothing — so both widths render the same elements
 * with the same text and differ only in placement.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/game.html', import.meta.url), 'utf8');
const css = [...page.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

/** The direct children of `.side`, in order, named as the page names them. */
function sideChildren(html) {
  const at = html.indexOf('<div class="side">');
  assert.notEqual(at, -1, 'the game page has no side column');
  let depth = 0, i = at, out = [];
  const tag = /<(\/?)(div|p|details|details)[^>]*>/g;
  tag.lastIndex = at;
  for (let m; (m = tag.exec(html));) {
    if (m[1]) { depth--; if (depth === 0) break; continue; }
    depth++;
    if (depth === 2) {
      const a = m[0];
      out.push((a.match(/id="([^"]+)"/) || a.match(/class="([^"]+)"/) || [, '?'])[1]);
    }
  }
  return out;
}

test('⭐ the side column holds exactly what §3 rules movable', () => {
  // Derived from the built page, in order, so a block added to the wrapper by
  // hand shows up here rather than shipping unexamined.
  assert.deepEqual(sideChildren(page),
    ['newcomer', 'pickrow', 'lcap', 'zone zcue', 'zone znext', 'sharerow']);
});

test('⛔ …and the transport is NOT in it — CHENG\'s second clause', () => {
  /* THE RULE IS CONTENT *AND ENABLED STATE* INVARIANT UNDER PLAYHEAD MOVEMENT.
     The transport's labels never change; `◀ Prev` and `Next ▶` are DISABLED at
     the ends of the game, which is a function of the playhead and is the readout
     the pair was designed around. And independently: the transport and the
     scrubber are one control, the scrubber is unambiguously playhead-dependent,
     and splitting a control pair across a fold is worse than either placement. */
  const inside = page.slice(page.indexOf('<div class="side">'));
  const closes = inside.indexOf('\n</div>');
  const body = inside.slice(0, closes === -1 ? inside.length : closes);
  for (const control of ['class="transport"', 'id="scrub"', 'id="play"'])
    assert.ok(!body.includes(control), `${control} is in the side column`);
  assert.ok(page.includes('class="transport"'), 'the transport left the page entirely');
});

test('⭐ ONE DOM, REFLOWED — the wrapper is display:contents outside the query', () => {
  /* `display:contents` removes the wrapper's box, so below the breakpoint its
     children flow in `.wrap` exactly as direct children would. That is what
     makes this one rendering rather than two: same elements, same handlers, same
     state, and the only difference is where the boxes land. */
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const beforeQuery = bare.slice(0, bare.indexOf('@media (min-width:1180px)'));
  assert.match(beforeQuery, /#rg \.side\{display:contents\}/,
    'the side wrapper is not neutralised outside the media query — the phone gets a box it never had');
});

test('⭐ …and the query hides nothing, so both widths render the same elements', () => {
  // THE PAIRED HALF of the claim above, and the one that would catch a "fix"
  // that made the two widths agree by deleting something at one of them.
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const at = bare.indexOf('@media (min-width:1180px)');
  assert.notEqual(at, -1);
  let depth = 0, end = at;
  for (let i = bare.indexOf('{', at); i < bare.length; i++) {
    if (bare[i] === '{') depth++;
    else if (bare[i] === '}' && --depth === 0) { end = i; break; }
  }
  const block = bare.slice(at, end);
  assert.doesNotMatch(block, /display\s*:\s*none/,
    'the two-column query hides an element — the widths no longer render the same page');
});

test('⛔ the picker still defaults to Just events — CHENG\'s condition on q2', () => {
  /* WHAT MAKES DOCTRINE §6 STRUCTURAL RATHER THAN MAINTAINED: the base view
     cannot accidentally carry a metric, because *none* is a choice and it is the
     selected one. Moving the control must not quietly change what is selected. */
  const row = page.slice(page.indexOf('id="pickrow"'), page.indexOf('id="pickrow"') + 2200);
  const checked = [...row.matchAll(/id="(pk\w+)"[^>]*aria-checked="true"/g)].map(m => m[1]);
  assert.deepEqual(checked, ['pkNone'],
    'the layer selected on arrival is not "Just events"');
});
