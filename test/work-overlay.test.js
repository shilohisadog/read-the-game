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

/**
 * ⭐ THE WAY BACK OUT — 2026-08-31. Kevin: *"aligning show me the work with
 * learning cards, and making them bi-directional."*
 *
 * ⚠️ THESE EXIST BECAUSE A MUTATION SURVIVED. `learn.test.js` checks the MAP
 * that the row is built from, and a mutation dropping `#${c.id}` from the href —
 * so every link landed on the top of the learn page instead of on the card —
 * passed the whole suite. Checking the ingredients is not checking the dish.
 */
/**
 * ⛔⛔ ONE ROW AT A TIME, AND THIS IS THE SECOND TIME THAT MATTERED. These tests
 * announced "the Learn More row" and scanned every `<a href=` in the PANEL,
 * which was the same claim while there was one row of links in it. Adding the
 * door to the work made them red — correctly, and for the wrong reason: nothing
 * they were about had changed. A check that reads a wider surface than it names
 * is the project's dominant failure mode arriving as a false alarm rather than
 * as a false pass, which is the lucky half of it.
 */
function rowOf(html, cls) {
  const i = html.indexOf(`class="${cls}"`);
  if (i < 0) return '';
  const end = html.indexOf('</p>', i);
  return html.slice(i, end < 0 ? html.length : end);
}
const hrefsIn = row => [...row.matchAll(/<a href="([^"]+)"/g)].map(m => m[1]);
const textIn = row => [...row.matchAll(/<a href="[^"]+">([^<]+)<\/a>/g)].map(m => m[1]);

test('⭐ the row renders a real anchored link per card, for the layer that is on', () => {
  const a = boot(rich, null, '?layer=slot');
  // ⚠️ THE PLAYHEAD FIRST. `renderWork` returns early at `at < 0`, so a panel
  // opened on the pre-game frame is empty by design — and three assertions
  // about its contents failed for that reason before they could say anything.
  a.$('scrub').oninput({ target: { value: '120' } });
  a.$('work').click();
  const html = a.$('workBody').innerHTML;
  assert.match(html, /class="wlearn"/, 'the Learn More row never rendered');
  const hrefs = hrefsIn(rowOf(html, 'wlearn'));
  assert.deepEqual(hrefs, ['/what-you-can-see.html#slot'],
    'the slot layer must link to the slot card, by anchor');
  // ⚠️ AND THE TEXT IS THE CARD'S TITLE, NOT ITS KEY. `slot` and `empty-net` are
  // table keys; this project has already shipped a raw `descKey` to a screen
  // once. A mutation printing `c.id` here survived until this line existed.
  const text = textIn(rowOf(html, 'wlearn'));
  assert.deepEqual(text, ['Shots from the slot'],
    'the row is printing the card key rather than its title');
});

test('⭐⭐ and the layer carries a door to the archive figure behind what it counts', () => {
  /* ⭐⭐⭐ KEVIN, 2026-09-24: *"every layer should have a link (i.e. door) to a
     'how we count' page."* The two lines above it in the panel are this layer's
     own rule and they are complete — what it counts, who it credits — and they
     say nothing about what ORDINARY looks like. A viewer watching a figure build
     in front of them cannot tell from this panel whether it is high.

     ⛔ AND IT IS THE SLOT'S ATTEMPT SHARE, NOT ITS CONVERSION. Three published
     measurements carry the word slot; this layer counts attempts taken from
     there, so that is the one it opens.
     MUTATION: point `danger.work` at `slotGoals` and this names it. */
  const a = boot(rich, null, '?layer=slot');
  a.$('scrub').oninput({ target: { value: '120' } });
  a.$('work').click();
  const row = rowOf(a.$('workBody').innerHTML, 'wwork');
  assert.ok(row, 'the Slot layer renders no door to the work');
  assert.deepEqual(hrefsIn(row), ['/how-we-measure.html#m-slotAttempts']);
  assert.deepEqual(textIn(row), ['How many shot attempts are taken from the slot'],
    'the door prints a key rather than the name of the figure it opens');
});

test('⭐⭐ a layer reporting three measurements opens three, not the first of them', () => {
  /* Stoppages names the rule that stopped play, and penalties, offsides and
     icings are three archive figures with three denominators. One door would
     have to pick, and picking silently answers a question the reader did not
     ask. This is the case `work` is a LIST for.
     MUTATION: render only `work[0]` and this fires. */
  const a = boot(rich, null, '?layer=whistle');
  a.$('scrub').oninput({ target: { value: '120' } });
  a.$('work').click();
  const row = rowOf(a.$('workBody').innerHTML, 'wwork');
  assert.deepEqual(hrefsIn(row).slice().sort(),
    ['/how-we-measure.html#m-icing', '/how-we-measure.html#m-offside',
     '/how-we-measure.html#m-penalties']);
  assert.equal(new Set(hrefsIn(row)).size, 3, 'two doors lead to the same section');
});

test('⭐ every layer a viewer can switch on carries one, including the ones with no card', () => {
  /* ⚠️ THE ONE THAT WOULD HAVE BEEN MISSED. Blocked has no learn card, so it
     renders no Learn More row at all — and a panel with neither row is a layer
     whose number a viewer cannot follow anywhere. The two rows are independent
     and this is what says so.
     MUTATION: gate the door on `cards` being non-empty and this fires. */
  for (const [layer, want] of [['corsi', 'm-attempts'], ['blocked', 'm-attempts'],
                               ['goaltending', 'm-saves'], ['zonestart', 'm-zoneStarts']]) {
    const a = boot(rich, null, `?layer=${layer}`);
    a.$('scrub').oninput({ target: { value: '120' } });
    a.$('work').click();
    const row = rowOf(a.$('workBody').innerHTML, 'wwork');
    assert.ok(row, `${layer} renders no door to the work`);
    assert.deepEqual(hrefsIn(row), [`/how-we-measure.html#${want}`]);
  }
});

test('⭐ Stoppages links to all four of its cards, and each carries its own anchor', () => {
  // The layer the map is 4-to-1 on. A row that lists one, or four links that
  // share a fragment, both look fine and teach the wrong thing.
  const a = boot(rich, null, '?layer=whistle');
  a.$('scrub').oninput({ target: { value: '120' } });
  a.$('work').click();
  const hrefs = hrefsIn(rowOf(a.$('workBody').innerHTML, 'wlearn'));
  assert.deepEqual(hrefs.slice().sort(), [
    '/what-you-can-see.html#faceoffs', '/what-you-can-see.html#icing',
    '/what-you-can-see.html#offside', '/what-you-can-see.html#penalties']);
  assert.equal(new Set(hrefs).size, 4, 'two of the links point at the same card');
  for (const h of hrefs)
    assert.match(h, /#[a-z-]+$/, `${h} lands on the page, not on a card`);
  const text = textIn(rowOf(a.$('workBody').innerHTML, 'wlearn'));
  assert.deepEqual(text.slice().sort(), ['Faceoffs', 'Icing', 'Offside', 'Penalties'],
    'the row prints card keys rather than the titles the learn page shows');
});

test('a layer with no card renders no row at all', () => {
  const a = boot(rich, null, '?layer=blocked');
  a.$('scrub').oninput({ target: { value: '120' } });
  a.$('work').click();
  const html = a.$('workBody').innerHTML;
  assert.ok(html.length > 100, 'the panel drew nothing, so this proves nothing');
  assert.doesNotMatch(html, /class="wlearn"/,
    'an empty Learn More row advertises a gap the Blocked layer has');
});
