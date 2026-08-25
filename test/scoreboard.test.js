/**
 * The scoreboard on a phone
 *
 * Kevin, photographing his phone against a laptop camera because the defect
 * would not reproduce in a screenshot: "not only does it overflow, I don't think
 * it looks very 'professional'... the whole vibe of the scoreboard (on mobile)
 * just doesn't appeal to me."
 *
 * Full audit, every measurement, and CHENG's review: docs/scoreboard-mobile.md.
 *
 * ⚠️ WHAT THIS FILE CANNOT SEE. The fake document has no CSS and no layout, so
 * nothing here proves the board fits, or that it is shorter than the ice, or
 * that a word is not clipped. Those are browser claims and they are made in two
 * other places on purpose: by looking (tools/pixels.sh, at 320/360/375/390/1100)
 * and by deploy.yml's fit gate, which now fetches an extract so it measures a
 * page that BOOTED. What is checkable here is that the rules exist, that they
 * are scoped where they were meant to be scoped, and that removing a word did
 * not remove the information.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { app, PAGE_CSS, boot } from './helpers/page.js';

/* Comments stripped: a raw scan cannot tell a rule from a comment ABOUT a rule,
   and this repo has already failed a correct file for exactly that. */
const CSS = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
/** The one `@media(max-width:520px)` block that carries the board rules. */
const PHONE = (() => {
  // Every 520px query, then the ONE that carries the board. Written this way
  // rather than as an index-of on a literal because the stylesheet is authored
  // with newlines and a scan for `…){#rg .board` finds nothing the moment it is
  // formatted — a test that cannot find its subject reports innocence.
  const re = /@media\s*\(max-width:520px\)\s*\{/g;
  for (let m; (m = re.exec(CSS)); ) {
    let d = 0;
    for (let k = m.index + m[0].length - 1; k < CSS.length; k++) {
      if (CSS[k] === '{') d++;
      else if (CSS[k] === '}' && --d === 0) {
        const block = CSS.slice(m.index, k + 1);
        if (block.includes('#rg .board')) return block;
        break;
      }
    }
  }
  throw new assert.AssertionError({
    message: 'no 520px query carries the board — every test below is about nothing' });
})();

test('the score keeps the guarantee the monospace family was there to give', () => {
  const rule = CSS.match(/#rg \.sc\{[^}]*\}/);
  assert.ok(rule, 'the score has no rule at all');
  // ⭐ THE POINT OF THE CHANGE. Monospace existed so the digit would not reflow
  // when the score changes. `tabular-nums` does that on a proportional face, and
  // it was already on this rule — so dropping the family is only safe while the
  // property stays. Deleting BOTH is the regression this guards.
  assert.match(rule[0], /font-variant-numeric:\s*tabular-nums/,
    'the score can now reflow when it changes — the reason monospace was here is gone too');
  assert.doesNotMatch(rule[0], /monospace/,
    'the score is back to a typewriter face');
});

test('the 150px floor is lifted on a phone, where it is the thing that overflows', () => {
  // 72 + 150 + 72 + 28 = 322 against 277 available at 360. The hero already
  // zeroes this (`#rg.preview .mid{min-width:0}`); the game page never did.
  assert.match(CSS, /#rg \.mid\{min-width:150px\}/, 'the desktop floor is gone — that is a different change');
  assert.match(PHONE, /#rg \.mid\{[^}]*min-width:0/, 'the phone layout still carries the 150px floor');
});

test('the board becomes two rows, so the three-element column stops existing', () => {
  assert.match(PHONE, /grid-template-columns:1fr 1fr/);
  assert.match(PHONE, /grid-template-areas:"away home" "state state"/);
  assert.match(PHONE, /#rg \.tm\{[^}]*flex-direction:row/,
    'the team stack is still a column, which is the thing that did not fit');
});

test('the WORD goes and the INFORMATION stays', () => {
  // Two mechanisms, asserted where only each can be responsible (H2). A CSS scan
  // can only show that nothing hides the arrow; it cannot show the arrow has
  // anything in it. The renderer is the other half.
  assert.match(PHONE, /#rg \.tm \.atk \.aw\{display:none\}/, 'the label is not hidden on a phone');
  assert.doesNotMatch(PHONE, /\.atk\{[^}]*display:none/, 'the whole direction indicator is hidden on a phone');
  assert.doesNotMatch(PHONE, /\.ar\{[^}]*display:none/, 'the arrow itself is hidden on a phone');

  const a = boot();
  assert.ok(a.$('aAtk').textContent.trim(), 'the visitor has no direction arrow at all');
  assert.ok(a.$('hAtk').textContent.trim(), 'the host has no direction arrow at all');
  assert.notEqual(a.$('aAtk').textContent.trim(), a.$('hAtk').textContent.trim(),
    'both teams are attacking the same way');
});

test('the mirroring is scoped to the phone, because `order` reorders a column too', () => {
  // Above 520px `.tm` is still a flex COLUMN, and `order` applies there just as
  // well — a global rule would silently restack badge/score/arrow on the desktop
  // board nobody has complained about.
  assert.match(PHONE, /#rg \.tm\.a \.atk\{order:1\}/);
  assert.match(PHONE, /#rg \.tm\.h \.atk\{order:3\}/);
  const outside = CSS.replace(PHONE, '');
  assert.doesNotMatch(outside, /#rg \.tm\.[ah] [^{]*\{[^}]*order:/,
    'an `order` rule escaped the phone block and is restacking the desktop board');
});

test('the phone breakpoint is the one that already exists, not a competing width', () => {
  // A second query for the same job at a neighbouring width is how the
  // penalty-box fix lost an afternoon: `@media (max-width:560px)` was added while
  // `520px` already existed further down, and the existing one won.
  // ⚠️ SCOPED TO THE BOARD, and the first version of this test was not — it
  // asserted over every query on the PAGE and failed on `@media(max-width:420px)`
  // in the shared chrome (builders/page.py), which sets header and footer padding
  // and has nothing to do with the scoreboard. A guard that fails on a correct,
  // unrelated rule teaches people to widen it until it means nothing.
  const boardQueries = [];
  const re = /@media\s*\(max-width:(\d+)px\)\s*\{/g;
  for (let m; (m = re.exec(CSS)); ) {
    let d = 0;
    for (let k = m.index + m[0].length - 1; k < CSS.length; k++) {
      if (CSS[k] === '{') d++;
      else if (CSS[k] === '}' && --d === 0) {
        const block = CSS.slice(m.index, k + 1);
        if (/#rg \.(board|tm|mid|sc)\b/.test(block)) boardQueries.push(m[1]);
        break;
      }
    }
  }
  assert.deepEqual([...new Set(boardQueries)], ['520'],
    `the scoreboard is being restyled at more than one width: ${boardQueries.join(', ')}`);
});
