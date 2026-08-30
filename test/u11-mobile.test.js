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
import { PAGE_CSS } from './helpers/page.js';

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

const bleedRule = () => {
  const m = /#rg:not\(\.preview\) \.rinkbox\{([^}]*)\}/.exec(PAGE_CSS);
  assert.ok(m, 'the full-bleed rule for the rink card is gone');
  return m[1];
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
  const i = PAGE_CSS.indexOf('#rg:not(.preview) .rinkbox{');
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
