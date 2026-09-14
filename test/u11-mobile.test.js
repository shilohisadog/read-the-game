/**
 * U11 — the rink goes edge to edge on a phone.
 *
 * ⭐ WHAT THIS FILE CAN AND CANNOT PROVE, said first because the gap is the
 * whole reason the defect survived so long. The node fake has no CSS and no
 * layout, so **no test here can measure a pixel**. The geometry was established
 * in a real browser and is recorded in `docs/status.md` U11 with its numbers:
 * the ice goes 320.8x136.3 -> 386x164 at 390, and the board falls from 118% of
 * the ice to 92%.
 *
 * What IS checkable here is the thing most likely to rot: the full-bleed works
 * by cancelling the page's horizontal chrome with an equal negative margin, and
 * those are TWO SEPARATE DECLARATIONS THAT MUST AGREE. Change the page padding
 * without changing the cancel and the rink either overflows the viewport or
 * stops reaching the edge — silently, on a surface no unit test can see. So the
 * assertion is the RELATIONSHIP between them, never a pinned number: a literal
 * copy of `15.6px` here would be a second constant free to agree with a wrong
 * first one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_CSS, app, SCRIPT } from './helpers/page.js';

/** The horizontal padding `#rg` applies to the page. */
const pagePad = () => {
  const m = /#rg\{[^}]*padding:clamp\([^)]*\)\s+(clamp\([^)]*\))/.exec(PAGE_CSS);
  assert.ok(m, '#rg no longer sets a two-value padding, so the cancel below has no subject');
  return m[1];
};

/** The horizontal padding `.wrap` adds inside it. */
const wrapPad = () => {
  const m = /#rg \.wrap\{[^}]*padding:0 (\d+)px/.exec(PAGE_CSS);
  assert.ok(m, '.wrap no longer sets a horizontal padding');
  return m[1] + 'px';
};

/* ⚠️ THE RULE IS FOUND BY WHAT IT DOES, NOT BY BEING FIRST. This took the first
   `#rg:not(.preview) .rinkbox{...}` in the stylesheet, and on 2026-09-13 the
   landscape-phone layout added an earlier one (`grid-column:2`) -- so every test
   below started reporting on a rule with no opinion about bleed at all. A probe
   whose subject is "the first match" has its subject chosen by file order. */
const bleedRule = () => {
  const all = [...PAGE_CSS.matchAll(/#rg:not\(\.preview\) \.rinkbox\{([^}]*)\}/g)]
    .map(m => m[1]).filter(body => body.includes('margin-inline'));
  assert.equal(all.length, 1,
    `${all.length} rules bleed the rink card — the probe cannot say which is the subject`);
  return all[0];
};

test('the rink cancels exactly the chrome the page puts beside it', () => {
  /* IF THESE TWO EVER DISAGREE the rink is wrong in one of two ways and both are
     invisible from here: too little margin and it stops short of the edge (the
     U11 defect returning quietly), too much and the page scrolls sideways. */
  const rule = bleedRule();
  const m = /margin-inline:calc\(-1 \* \(([^)]*\)?[^)]*)\)\)/.exec(rule);
  assert.ok(m, `the rink card has no margin-inline cancel: "${rule}"`);
  const cancels = m[1].replace(/\s+/g, '');
  const expected = (pagePad() + '+' + wrapPad()).replace(/\s+/g, '');
  assert.equal(cancels, expected,
    `the rink cancels "${cancels}" but the page applies "${expected}" — ` +
    `the rink either stops short of the edge or pushes the page sideways`);
});

test('the full-bleed rink drops the edges it can no longer close', () => {
  // A card border that runs off the screen reads as a rendering fault rather
  // than as a decision. This is not decoration: it is the difference between
  // "edge to edge on purpose" and "the layout broke".
  const rule = bleedRule();
  assert.match(rule, /border-radius:0/, 'the card keeps rounded corners it cannot show');
  assert.match(rule, /border-left-width:0/, 'a border still runs off the left edge');
  assert.match(rule, /border-right-width:0/, 'a border still runs off the right edge');
});

test('the full-bleed applies to the phone and leaves the hero alone', () => {
  /* TWO SCOPES, BOTH LOAD-BEARING. `@media(max-width:520px)` because the desktop
     board is already 42% of the ice and needs nothing; `:not(.preview)` because
     the homepage hero renders the same markup at card size, where an edge-to-edge
     rink would break out of the card containing it. The same pairing the mobile
     board rules already use, one block up. */
  /* ⚠️ THE SAME CORRECTION AS `bleedRule` ABOVE. `indexOf` found the FIRST
     `#rg:not(.preview) .rinkbox{` and on 2026-09-13 that became the landscape
     layout's `grid-column:2` — so this reported on the query around a rule that
     has no opinion about bleed, and failed a stylesheet that was correct. */
  const bleeds = [...PAGE_CSS.matchAll(/#rg:not\(\.preview\) \.rinkbox\{([^}]*)\}/g)]
    .filter(m => m[1].includes('margin-inline'));
  assert.equal(bleeds.length, 1, `${bleeds.length} rules bleed the rink card`);
  const i = bleeds[0].index;
  assert.ok(i > 0, 'no full-bleed rule');
  const before = PAGE_CSS.slice(0, i);
  const lastQuery = before.lastIndexOf('@media');
  const lastClose = before.lastIndexOf('}\n#rg{');
  assert.ok(lastQuery > lastClose,
    'the full-bleed rule is not inside a media query — it would apply on a desktop too');
  assert.match(PAGE_CSS.slice(lastQuery, i), /max-width:520px/,
    'the full-bleed rule is in a media query, but not the phone one');
});

test('the score scales with the frame instead of holding a constant', () => {
  /* ⭐ THIS IS THE MECHANISM U11 DIAGNOSED, not a style preference. The board
     held 160.6px at 360, 390 and 430 alike because its type is set in `rem`, and
     `rem` does not care how wide the screen is — while the ice, being width-
     bound, shrank underneath it. A `clamp` gives the score the same relationship
     to the viewport the rink already has. The ceiling means no width that reads
     well today changes at all. */
  const m = /#rg:not\(\.preview\) \.board \.sc\{font-size:clamp\(([^)]*)\)\}/.exec(PAGE_CSS);
  assert.ok(m, 'the score is back to a constant font size');
  const [min, , max] = m[1].split(',').map(s => s.trim());
  assert.match(min, /rem$/, 'the floor is not a rem, so the score can vanish on a narrow phone');
  assert.match(max, /rem$/, 'the ceiling is not a rem');
  assert.ok(parseFloat(min) < parseFloat(max),
    `clamp(${m[1]}) has a floor at or above its ceiling, so it never scales`);
});

test('the penalty seat is untouched — its reservation is a ruling, not slack', () => {
  /* ⚠️ THE SEAT RESERVES 31px ON EVERY FRAME AND THAT IS DELIBERATE. Kevin,
     2026-08-27: "the scoreboard adjusts heights when the penalty is being
     displayed, that shouldn't happen." Measured then, the board took four
     heights in one game — 117 / 161 / 195 / 213 — and the rink stepped down each
     time.
     Every board-shrinking route worth 40px ran back through this seat, and
     taking it would have re-opened a defect he reported himself. This asserts
     the reservation survived the U11 work, because the tempting fix is one
     `:empty` away and it looks like a free 44px. */
  assert.match(PAGE_CSS, /#rg \.pens\{[^}]*min-height:31px/,
    'the penalty seat no longer holds its ground — the board will resize mid-replay again');
  assert.doesNotMatch(PAGE_CSS, /\.pens:empty\{[^}]*display:none/,
    'an :empty rule is collapsing the penalty seat, which is the shift Kevin reported');
});

/* ─────────────── THE LANDSCAPE PHONE — THE LAPTOP'S COLUMNS, INVERTED ───────
 * Kevin, 2026-09-13: *"I have decided portrait isn't salvageable… can we
 * replicate the laptop approach on mobile, with the controls side by side with
 * the rink?"* and *"a rotate prompt would be the best portrait approach."*
 *
 * Measured (docs/mobile.md §4c): stacked landscape gives 762×324 of ice — 3.90×
 * portrait — with the caption 1.52 screens down. Beside a 260px column the ice
 * is 480×204 and the rink, its sentence, the board, Play, Prev/Next and the
 * scrubber all land on one screen. Width is taken FROM the rink on purpose,
 * because the rink's height IS its width × 0.425.
 */
const LAND = (() => {
  const css = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const at = css.indexOf('@media (orientation:landscape) and (max-height:500px){');
  assert.notEqual(at, -1, 'the landscape-phone layout is gone');
  let d = 0;
  for (let k = css.indexOf('{', at); k < css.length; k++) {
    if (css[k] === '{') d++;
    else if (css[k] === '}' && --d === 0) return css.slice(at, k + 1);
  }
  throw new assert.AssertionError({ message: 'the landscape block is never closed' });
})();

test('⛔ every landscape rule exempts the preview, because the HERO is landscape', () => {
  /* ⚠️ THE TRAP IS IN THE QUERY ITSELF. `orientation` is a property of the
     DOCUMENT's viewport, and the front door's hero is an iframe measured at
     315×220 on a portrait phone — landscape, under 500px tall, a match. Without
     `:not(.preview)` the preview would take the game page's two-column layout
     inside a box with no second column to give, on the one surface a stranger
     sees first. Verified in a browser: the hero reports `preview:true`,
     `rink 301×122`, unchanged.
     The header rules are the exception and are named: the chrome lives OUTSIDE
     `#rg`, so no `#rg` selector can reach it, and the preview has no header at
     all (`test/render-preview.test.js`: preview takes the shared chrome off). */
  const selectors = LAND
    .slice(LAND.indexOf('{') + 1, -1)
    .split('}').map(s => s.split('{')[0].trim()).filter(Boolean)
    .flatMap(s => s.split(',').map(x => x.trim()));
  assert.ok(selectors.length >= 6,
    `only ${selectors.length} selectors found — this probe lost its subject`);
  const unguarded = selectors.filter(s =>
    !s.startsWith('#rg:not(.preview)') && !s.startsWith('header.sitehdr'));
  assert.deepEqual(unguarded, [],
    'these landscape rules would reach the front door\'s hero, which is an ' +
    'iframe that is itself landscape and under 500px tall');
});

test('⭐ the rink takes the second column and everything else takes the first', () => {
  // The `.side` wrapper is `display:contents` at this width, so its children are
  // already grid items of `.wrap` — pulling only the rink across leaves every
  // other block to flow down column one in document order, and `#who` travels
  // with the rink because it lives inside it. Placing two dozen children by hand
  // would be a second statement of the document's shape.
  assert.match(LAND, /#rg:not\(\.preview\) \.wrap\{[^}]*grid-template-columns:minmax\(0,(\d+)px\) minmax\(0,1fr\)/,
    'the landscape layout is not two columns');
  assert.match(LAND, /#rg:not\(\.preview\) \.rinkbox\{[^}]*grid-column:2/,
    'the rink is not in the second column');
  assert.match(LAND, /#rg:not\(\.preview\) \.side > \*\{[^}]*grid-column:1/,
    "the side column's children were left to auto-place, which alternates columns");
  // ⛔ AND THE SPAN IS NOT `1 / -1`. With no explicit rows `-1` resolves to line
  // 1 and collapses the span — the defect the 1360 rule records having hit.
  const span = /#rg:not\(\.preview\) \.rinkbox\{[^}]*grid-row:1\/span (\d+)/.exec(LAND);
  assert.ok(span, 'the rink does not span the rows beside it');
  assert.ok(+span[1] >= 30, `the rink spans ${span[1]} rows, fewer than this wrap can hold`);
});

test('⭐ the board is stacked by BOTH the narrow phone and the narrow column', () => {
  /* The board breaks because its COLUMN is narrow, not because the viewport is:
     in the landscape layout it sits in 260px while the viewport is 844, and the
     three-across grid put `CAR` through the column edge and the `1` outside the
     card. A comma is a media query OR, so the stacked shape reviewed for a phone
     is REUSED rather than restated — two copies would be two things to keep in
     step. */
  const css = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const q = /@media\(max-width:520px\),\(orientation:landscape\) and \(max-height:500px\)\{/.exec(css);
  assert.ok(q, 'the board no longer stacks on both conditions');
  assert.ok(css.slice(q.index, q.index + 400).includes('.board{grid-template-columns:1fr 1fr'),
    'the query that carries both conditions is not the one that stacks the board');
});

/* ─────────────────────────── THE PORTRAIT ROTATE PROMPT ────────────────────── */

test('⭐ portrait on a phone asks for a rotation, and is not a wall', () => {
  assert.match(app, /<div class="rotate" id="rotate">/, 'the prompt is gone from the markup');
  assert.match(app, /<button class="rotgo" id="rotgo"/, 'the way past it is gone');

  const css = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  // Hidden by default, everywhere. The media query is what reveals it, so a
  // viewport that is not a phone held upright never sees it at all.
  assert.match(css, /#rg \.rotate\{display:none\}/,
    'the prompt is not hidden by default — every other viewport would carry it');
  const at = css.indexOf('@media (orientation:portrait) and (max-width:560px){');
  assert.notEqual(at, -1, 'the prompt has no viewport that asks for it');
  const block = css.slice(at, css.indexOf('.side > *{display:none}', at) + 24);
  assert.match(block, /#rg:not\(\.preview\):not\(\.showanyway\) \.rotate\{display:block\}/,
    'the prompt is not revealed, or is revealed in the preview, or ignores the dismiss');

  /* ⛔ THE ESCAPE IS LOAD-BEARING. A reader with orientation lock on is not
     making a mistake, and a prompt that cannot be dismissed decides on their
     behalf whether they are able to turn their phone. */
  assert.match(SCRIPT, /\$\('rotgo'\)\.onclick=\(\)=>[^;]*classList\.add\('showanyway'\)/,
    'pressing "Show it anyway" does nothing');
  assert.match(block, /:not\(\.showanyway\)[^{]*\.wrap > \*:not\(\.rotate\):not\(\.board\)/,
    'the dismiss does not bring the page back');

  /* ⭐ AND THE SCOREBOARD IS EXEMPT, so a reader arriving from a shared link can
     see they reached the right game before being asked to do anything. */
  assert.match(block, /:not\(\.board\)/, 'the prompt hides the board too — the page says nothing');
  // ⚠️ `.side` is display:contents here, so its children are named rather than
  // hidden with their wrapper: when you hide a container, enumerate what was
  // inside it. This file carries that scar already.
  assert.match(block, /\.side > \*\{display:none\}/,
    'the layer controls stay on screen behind the prompt, with no rink to control');
});

/* ───────────── THE TYPE SCALES WITH ITS COLUMN, NOT WITH THE VIEWPORT ───────
 * Kevin, on the shipped landscape view: *"The scoreboard appears to be 2/3 the
 * size of the rink, it looks way too big, same with the controls (text and
 * button sizing)… we need to scale down everything on the phone."*
 *
 * Measured before touching anything: at 844×350 EVERY type size on this page was
 * identical to a 1400×900 laptop's — score 28.8px in both, chips 14.4, clock
 * 12.48, every transport button 13.28, the caption 13.12. The board came to 0.57
 * of the rink's height here against 0.31 there.
 *
 * ⛔ IT IS U11's OWN DEFECT IN A NEW VIEWPORT. That work replaced a rem constant
 * with `clamp(1.6rem,5.4vw,2.2rem)` because "rem does not care how wide the
 * screen is" — and assumed viewport width IS element width. In landscape the
 * viewport is 844 and the board is in 230, so `vw` pins the clamp at its ceiling
 * and hands a phone the laptop's score beside half the laptop's rink.
 */
test('⭐ the landscape score is sized for its column, and not in vw', () => {
  const css = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const base = /#rg \.sc\{font-size:([\d.]+)rem/.exec(css);
  assert.ok(base, 'the base score size is gone — nothing to be smaller than');
  const land = /#rg:not\(\.preview\) \.board \.sc\{font-size:([\d.]+)rem\}/.exec(LAND);
  assert.ok(land, 'the landscape phone gets the page-wide score size again');
  assert.ok(+land[1] < +base[1],
    `the landscape score is ${land[1]}rem against a base of ${base[1]}rem — not smaller`);
  /* ⛔ AND IT IS A FIXED SIZE RATHER THAN A SECOND `vw` CLAMP. `vw` is the
     viewport, and the viewport is the one thing that does NOT describe this
     element here — that is the whole defect being repaired. A clamp would have
     looked like the careful fix and reproduced it. */
  assert.doesNotMatch(land[0], /vw/,
    'the landscape score is sized in vw, which is the measurement that was wrong');
});

test('⛔ the type pass never shrinks a tap target', () => {
  /* Text comes down; the finger does not. A landscape phone is still a phone,
     and `render-notes.test.js` holds the 44px floor for the selector chips on
     the grounds that "the surface whose reviewer is on a phone" is the one that
     cannot afford to lose it. The padding reduction and the floor are in the
     SAME declaration so the two can never drift apart. */
  const rule = /#rg:not\(\.preview\) \.transport button\{([^}]*)\}/.exec(LAND);
  assert.ok(rule, 'the transport type is no longer scaled for its column');
  assert.match(rule[1], /padding:/,
    'the padding is untouched, so there was never anything threatening the floor');
  assert.match(rule[1], /min-height:44px/,
    'the buttons lost their padding and nothing holds them at 44px');
});

test('⭐ every size the landscape block sets is a shrink, never a growth', () => {
  /* The block exists to take weight OFF this column. A rule that raised a size
     would be doing the opposite of what it is for, and would be invisible here
     among two dozen declarations — so the direction is asserted rather than
     read. Sizes are compared against the same property elsewhere in the sheet.
     ⚠️ COUNTED, so a block that stops setting sizes fails instead of passing on
     an empty list — the vacuous shape this suite keeps finding in itself. */
  const sizes = [...LAND.matchAll(/font-size:([\d.]+)rem/g)].map(m => +m[1]);
  assert.ok(sizes.length >= 6,
    `only ${sizes.length} sized rules in the landscape block — the probe lost its subject`);
  const tooBig = sizes.filter(v => v > 1.3);
  assert.deepEqual(tooBig, [],
    `these landscape sizes are larger than anything a 230px column should carry: ${tooBig}`);
});
