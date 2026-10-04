/**
 * THE KEY DRAWS THE MARK THE RINK DRAWS
 *
 * ⭐⭐⭐ WHY THIS FILE EXISTS. Kevin, 2026-10-04, reading the live sidebar: *"is
 * the colour combination for 'blocked' in the sidebar correct?"* It was not, and
 * the way it was wrong is the reason this is a gate rather than a one-line fix.
 *
 * `marks.js` has said since 2026-09 that a blocked shot is *"an attempt,
 * ANNOTATED, and the annotation is a separate ring rather than the mark's own
 * stroke"* — because drawn the old way *"a visitor's blocked shot is a white dot
 * with an orange ring and no team colour anywhere on it, which on the ice reads
 * as a third club."* Kevin found that one in a real game too. **The ice was
 * repaired and the key was not.** `.k-blkv` stayed exactly as that sentence
 * describes it, so for a month the legend taught a reader to recognise a mark
 * the rink had stopped drawing.
 *
 * ⭐⭐ THE RULE, AND IT IS THE ONLY ONE THAT COULD HAVE CAUGHT IT: a key swatch
 * and the thing it keys must be made of THE SAME COLOURS. Not similar, not
 * "both bluish" — the same set of tokens, because every one of them is a
 * variable whose value is the club's own and changes from game to game. A key
 * that names a colour the rink does not use for that mark is an instruction to
 * misread the ice.
 *
 * ⛔ IT IS A SET, NOT A SPELLING. Where the mark puts a colour — `fill`,
 * `stroke`, a gradient stop, a box-shadow ring — is a drawing decision that
 * differs between an SVG circle and a 10px HTML span, and demanding they match
 * would be asserting the implementation. WHICH colours appear is the claim a
 * reader can check by looking at both.
 *
 * ⚠️ WHAT THIS CANNOT TELL YOU: whether the swatch looks like the mark. It
 * cannot see a ring drawn inside where the rink draws it outside, or a glyph so
 * small the ring swallows the fill. That is `docs/looking-at-pixels.md`'s
 * division, and the swatches were measured in a browser when this landed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_CSS } from './helpers/page.js';

/* ⛔ COMMENTS STRIPPED FIRST. The stylesheet records this very defect and quotes
   the broken rule to do it, so a scan of raw text finds the old colours inside
   the explanation of their removal — the monitor-armed-against-itself shape,
   which this repo has now logged seven times. */
const CSS = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, ' ');

/** Every `sel { body }` in the sheet, as a flat list. */
const RULES = [...CSS.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .map(m => ({ sel: m[1].trim(), body: m[2] }));

/**
 * The colours one selector paints with.
 *
 * ⚠️ ONLY THE PROPERTIES THAT PUT INK ON THE MARK. `background`, `fill`,
 * `stroke` and `box-shadow` are the mark; `opacity`, `border-radius` and
 * `animation` are not, and `color` never dresses one of these.
 */
const INK = /(?:^|;)\s*(?:background|background-color|background-image|fill|stroke|box-shadow)\s*:([^;]*)/g;

function coloursOf(pattern) {
  const found = new Set();
  let hit = 0;
  for (const r of RULES) {
    if (!pattern.test(r.sel)) continue;
    hit++;
    for (const m of r.body.matchAll(INK)) {
      for (const v of m[1].matchAll(/var\(--[\w-]+\)|#[0-9a-f]{3,8}\b/gi)) found.add(v[0].toLowerCase());
    }
  }
  return { found, hit };
}

/* ⭐ THE TABLE IS THE CLAIM, and each row was read off the stylesheet rather
   than remembered. A mark on the ice is often TWO rules — the circle and its
   annotation ring, or the circle and its bullseye core — because that is how the
   renderer composes it; the key draws one swatch, so the union is what must
   agree. */
const PAIRS = [
  ['home shot', /\.k-h\b/, [/#rg \.att\.h\b/]],
  ['visitor shot', /\.k-a\b/, [/#rg \.att\.a\b/]],
  /* ⛔⛔ THE ROW THAT WAS WRONG. A blocked shot is the attempt's own mark plus
     `.ring.blk` outside it, so the key needs the club's colours AND the flag. */
  ['blocked, home', /\.k-blk\b/, [/#rg \.att\.h\b/, /#rg \.ring\.blk\b/]],
  ['blocked, visitor', /\.k-blkv\b/, [/#rg \.att\.a\b/, /#rg \.ring\.blk\b/]],
  ['goal, home', /\.k-g\b(?!v)/, [/#rg \.goal\.h\b/, /#rg \.core\.h\b/]],
  ['goal, visitor', /\.k-gv\b/, [/#rg \.goal\.a\b/, /#rg \.core\.a\b/]],
  /* ⚠️ THE PUCK'S WHITE OUTLINE IS A CONTRAST DEVICE, NOT PART OF THE MARK. On
     the ice a near-black disc crosses the blue line, the crease, the slot tint
     and the red centre line, and the white stroke is what keeps its EDGE
     readable over all of them. The key sits on a white sidebar, where that
     stroke is the background — drawing it would add a rule whose only job is to
     satisfy this test. So it is exempted, by name and with the reason, and the
     exemption is checked below for going stale. */
  ['the puck', /\.k-p\b/, [/#rg \.puck$/], { '#fff': 'a contrast stroke against the ice; the key sits on white' }],
  ['the next play', /\.k-cue\b/, [/#rg \.cuef\b/]],
];

test('⭐⭐⭐ every key swatch is made of the colours its mark is made of', () => {
  /* MUTATION: drop `var(--away)` from `.k-blkv` — which is the page as it
     shipped until today — and this fires naming the visitor's blocked shot and
     the colour the ice uses that the key does not. */
  assert.ok(RULES.length > 200, `only ${RULES.length} CSS rules parsed — the sheet did not load`);
  const wrong = [];
  for (const [what, key, inkSelectors, except = {}] of PAIRS) {
    const swatch = coloursOf(key);
    assert.ok(swatch.hit, `${what}: the key has no rule at all, so nothing was compared`);
    assert.ok(swatch.found.size, `${what}: the key's rule paints with no colour — the harvest missed it`);
    const mark = new Set();
    for (const sel of inkSelectors) {
      const got = coloursOf(sel);
      assert.ok(got.hit, `${what}: no rink rule matched ${sel}, so this row checked nothing`);
      for (const c of got.found) mark.add(c);
    }
    /* ⛔ AN EXEMPTION THAT IS NO LONGER NEEDED IS A HOLE NOBODY CAN SEE. If the
       rink stops painting an exempted colour, the entry below stops describing
       anything and would silently go on excusing whatever took its place — the
       "a dead branch reads as coverage" shape. So each one must still name a
       colour the ice really uses. */
    for (const c of Object.keys(except)) assert.ok(mark.has(c),
      `${what}: "${c}" is exempted "${except[c]}", and the ice no longer paints it — `
      + 'delete the exemption rather than leaving it to excuse something else');
    for (const c of mark) if (!swatch.found.has(c) && !(c in except))
      wrong.push(`${what}: the ice paints it with ${c} and the key does not — `
        + `the key has ${[...swatch.found].join(' ')}`);
    /* ⛔ AND THE OTHER DIRECTION, WHICH IS THE ONE THAT SHIPPED. `.k-blkv` wore
       `var(--flag)` and NOTHING else of the club's: a key may not introduce a
       colour the mark does not have, or it describes a third team. */
    for (const c of swatch.found) if (!mark.has(c))
      wrong.push(`${what}: the key paints it with ${c} and the ice never does — `
        + `the ice has ${[...mark].join(' ')}`);
  }
  assert.deepEqual(wrong, [], 'the sidebar key and the rink disagree about what a mark looks like:'
    + `\n  ${wrong.join('\n  ')}`);
});

test('⛔ and the block annotation is the same colour on both, which is the whole repair', () => {
  /* The narrow version of the rule above, kept separate because it is the one
     Kevin found and the one with a quotable history. Stated as its own claim so
     that widening or narrowing the table above cannot quietly retire it. */
  const flag = /var\(--flag\)/;
  for (const k of [/\.k-blk\b/, /\.k-blkv\b/]) {
    const { found } = coloursOf(k);
    assert.ok([...found].some(c => flag.test(c)),
      `${k} does not carry var(--flag), which is what \`.ring.blk\` draws around a blocked shot`);
  }
  const { found: visitor } = coloursOf(/\.k-blkv\b/);
  assert.ok(visitor.has('var(--away)'),
    "the visitor's blocked swatch has no club colour on it — which is a white dot with "
    + 'an orange ring, the exact mark `marks.js` says reads as a third club');
  const { found: home } = coloursOf(/\.k-blk\b/);
  assert.ok(home.has('var(--home)'), "the home blocked swatch has no club colour on it");
});
