/**
 * "Show me the work" is an overlay on the ice — 2026-08-31.
 *
 * Kevin, playing through a game: *"I clicked on show me the work and the
 * information shows up well below the ice, which gives the vibe that it's
 * disjointed from the play on the ice… let's overlay it over the ice, make them
 * mutually exclusive."*
 *
 * ⭐ WHAT THIS FILE CAN AND CANNOT PROVE, first, because the whole change is
 * layout and **this harness has no CSS and no layout**. Every number below was
 * measured in a real Chromium and lives in the commit message and the comments
 * beside the rules; nothing here can see a pixel. What IS checkable is the set
 * of things most likely to rot silently:
 *
 *   the panel is INSIDE the card (structure — if it moves out, absolute
 *   positioning silently re-anchors to the page and the overlay lands anywhere);
 *   the card is the containing block (a RELATIONSHIP between two declarations);
 *   the open state has ONE owner (there are two ways to close it);
 *   opening stops the replay (behaviour);
 *   and the panel carries its own way out (behaviour — the card's own button is
 *   underneath the overlay, so without this the panel opens and cannot close).
 *
 * ⚠️ TWO DEFECTS IN THIS CHANGE WERE FOUND BY LOOKING AND COULD NOT HAVE BEEN
 * FOUND HERE, which is why that paragraph is not a disclaimer. A seven-pixel
 * stripe of rink showed below the panel at 1100; and the panel was inset by
 * `--rinkpad` while U11 overrides the card's horizontal padding to 2px, so the
 * layer box showed 8px of itself down each edge. Both elements were
 * individually correct in the DOM in both cases.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, rich, app, PAGE_CSS } from './helpers/page.js';

/**
 * The rule body for a selector, WITH ITS COMMENTS STRIPPED.
 *
 * ⚠️ The strip is not tidying. On 2026-08-31 the identical helper in
 * `render-strength-pill.test.js` passed a mutation, because the rule it read
 * carried a comment quoting the very declaration the test asserted. None of the
 * three rules read here happens to carry a comment today, so this changes no
 * result — it removes the way they would stop being checks if one ever did.
 */
const ruleFor = (sel) => {
  const re = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
  const m = re.exec(PAGE_CSS);
  assert.ok(m, `no rule for ${sel} — this guard has lost its subject`);
  return m[1].replace(/\/\*[\s\S]*?\*\//g, '');
};

test('the panel is inside the rink card, not a sibling of it', () => {
  // An absolutely positioned element anchors to its nearest positioned
  // ancestor. Moved out of `.rinkbox` it would anchor to the page instead and
  // the overlay would land somewhere unrelated — while every DOM assertion
  // about its contents kept passing.
  const card = /<div class="rinkbox"[\s\S]*?<div class="work" id="workPanel"/.exec(app);
  assert.ok(card, 'the work panel is no longer rendered inside .rinkbox');
});

test('⭐ the card is the containing block — a relationship, not two constants', () => {
  // These two declarations only work as a pair. Drop `position:relative` from
  // the card and the panel escapes to the page; the failure is invisible to
  // every other test here because both rules remain individually valid.
  assert.match(ruleFor('#rg .rinkbox'), /position:relative/,
    '.rinkbox stopped being a containing block, so the overlay anchors to the page');
  assert.match(ruleFor('#rg:not(.preview) .work'), /position:absolute/,
    'the work panel is no longer an overlay');
});

test('⭐ the overlay spans the card rather than copying its padding', () => {
  // THE DEFECT THIS REPLACED: `left:var(--rinkpad);right:var(--rinkpad)` looks
  // like it matches the card and does not — U11 overrides the horizontal
  // padding to 2px below 520px while `--rinkpad` stays 10, so the layer box
  // behind the panel showed 8px of itself down each edge.
  const r = ruleFor('#rg:not(.preview) .work');
  assert.match(r, /inset:0 0 auto 0/, 'the overlay no longer spans the card');
  assert.doesNotMatch(r, /(left|right):var\(--rinkpad\)/,
    'the overlay is inset by a copied padding constant again');
});

test('⭐ the ice is hidden while the work is open, and by visibility not display', () => {
  // `display:none` would collapse the svg, and the card sizes to it — which is
  // the shift this whole change exists to remove, reintroduced by its own fix.
  const r = ruleFor('#rg:not(.preview).working .rinkbox svg,\n#rg:not(.preview).working .caption');
  assert.match(r, /visibility:hidden/);
  assert.doesNotMatch(r, /display:none/, 'hiding the ice would collapse the card');
});

test('⭐ ONE OWNER for the open state — closing by lens change clears everything', () => {
  // There are two ways to close: the button, and `closeWork()` when the lens
  // returns to `none`. The overlay added a third thing to undo — the class that
  // hides the ice — and toggling it in the button handler alone would have left
  // the rink invisible with nothing over it.
  const a = boot(rich, null, '?layer=corsi');
  a.$('work').click();
  assert.equal(a.$("rg").classList.contains("working"), true, 'the class never went on');
  // Through the one-of-N selector the page actually listens to, not the id —
  // `getElementById` hands back a different stub from the group the handler is
  // bound to, so clicking the id would have tested nothing.
  a.$$('#rg .pk').find(b => b.dataset.l === 'none').click();
  assert.equal(a.$('workPanel').hidden, true, 'the panel stayed open');
  assert.equal(a.$("rg").classList.contains("working"), false,
    'the ice is still hidden with no panel over it');
  assert.equal(a.$('work').textContent, 'Show me the work', 'the button still says Hide');
});

test('⭐ opening the work stops the replay', () => {
  // The panel covers the ice, so a running replay would advance behind it and
  // the reader would come back to a game that had moved without them.
  const a = boot(rich, null, '?layer=corsi');
  a.$('play').click();
  assert.match(a.$('play').textContent, /Pause/, 'the replay never started');
  a.$('work').click();
  assert.match(a.$('play').textContent, /Play/, 'the replay kept running behind the panel');
  assert.equal(a.advance(1), 0, 'a frame was still scheduled');
});

test('⭐ and it does NOT restart itself when the panel closes', () => {
  // A replay that resumes on its own is the page moving under someone, which is
  // the thing this change exists to remove.
  const a = boot(rich, null, '?layer=corsi');
  a.$('play').click();
  a.$('work').click();
  a.$('work').click();
  assert.match(a.$('play').textContent, /Play/, 'the replay restarted itself');
});

test('⭐ the overlay carries its own way out, and it appears with the panel', () => {
  // BLOCKING DEFECT, found by looking: the card's `Hide the work` button lives
  // in `.lbox`, which the overlay covers. At 390 the panel is ~680px over a
  // 314px card, so the only closer was underneath the thing it closes — while
  // every DOM assertion about that button passed, because it existed, was
  // labelled correctly and still fired. It was simply invisible.
  const a = boot(rich, null, '?layer=corsi');
  a.$('work').click();
  assert.equal(a.$('workPanel').hidden, false, 'the panel never opened');
  a.$('workClose').click();
  assert.equal(a.$('workPanel').hidden, true, 'the overlay’s closer does not close it');
  assert.equal(a.$("rg").classList.contains("working"), false, 'the ice stayed hidden');
});

/**
 * ⭐ AND IT IS STATIC MARKUP RATHER THAN innerHTML, WHICH THIS FILE DISCOVERED.
 *
 * The first version built the closer into `renderWork`'s markup string and
 * wired it with `panel.querySelector('.wx')`. Three tests above went red with
 * *"$(...).querySelector is not a function"* — the fake models elements by id
 * and gives them no `querySelector`, so the control was unreachable from every
 * test here AND the app threw on the way to drawing it.
 *
 * The harness limit was the useful signal, not an obstacle: **a control only a
 * browser can wire is a control only a browser can catch breaking.** Static,
 * with an id, wired once at boot, like every other control on this page.
 */
test('the closer is static markup with an id, not built into the panel’s innerHTML', () => {
  assert.match(app, /<div class="work" id="workPanel" hidden><button class="wx" id="workClose"[^>]*>[^<]*<\/button><div id="workBody"><\/div><\/div>/,
    'the closer is no longer static markup as the panel’s first child');
  // AND THE BODY IS A SEPARATE ELEMENT so `renderWork` cannot wipe the button.
  assert.match(app, /\$\('workBody'\)\.innerHTML=/,
    'renderWork writes over the panel itself again, which deletes its own closer');
  assert.doesNotMatch(app, /class="wx"[^>]*\sonclick=/,
    'the closer uses an inline handler, which the page’s CSP refuses');
});
