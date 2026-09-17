/**
 * ⭐ WHEN YOU HIDE A CONTAINER, ENUMERATE WHAT WAS INSIDE IT.
 *
 * This project wrote that rule down after hiding a block and losing the note
 * that was its only home. On 2026-08-27 it broke the rule again, one layer
 * deeper and with no instrument watching: `.pboxes` was parked, and `#caption`
 * — the pill that announces a penalty, an unplaced goal and a slot shot — was
 * a CHILD of it. A `display:none` parent cannot be overridden by a child, so
 * for one commit every one of those announcements was written into a dark
 * element (98 penalties and 4 shootout goals across the seven fixture games),
 * while `dwell()` still held the replay open to give each one room.
 *
 * ⭐ THE POINT OF THIS FILE IS THAT THE LEDGER IS THE ENUMERATION. A live
 * element inside a parked container is not automatically wrong — the whole
 * `zlayers` zone is parked on purpose and everything in it is meant to be
 * dark. What is wrong is a live element going dark that NOBODY LISTED. So the
 * check is not "no writes into hidden boxes"; it is "every write into a hidden
 * box is on this list, with a reason." Adding a line here is the act of
 * enumerating, and it costs the ten seconds that were missing.
 *
 * ⚠️ WHAT THE DARKNESS MODEL DOES AND DOES NOT KNOW. It reads the shipped
 * stylesheet, groups declarations by selector context, takes the LAST display
 * for each — every rule here is `#rg …`, so within one context last-wins is
 * the whole cascade — and calls a class dark when `#rg .cls` ends at `none`
 * and no other context mentioning that class ends at anything else. That is
 * why `.whybk` and `.pressplay` are not dark: a state class lights them. It
 * does NOT evaluate specificity across differing contexts, so a park that only
 * applies at one breakpoint or under one state will read as unconditional.
 * The model is deliberately blunt in the safe direction: it over-reports, and
 * an over-report costs a line on the ledger.
 *
 * ⭐ AND IT WAS PROVEN AGAINST THE REAL DEFECT, not a synthetic one. Run
 * against `src/game.html` as of 6b3d655 it prints `caption YES pboxes`; run
 * against this commit it does not. The mutation is a git revision.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { app as PAGE, PAGE_CSS } from './helpers/page.js';

const APP_JS = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

/**
 * ⭐ COMMENTS COME OUT FIRST, AND THIS IS THE FIFTH TIME.
 * `app.css` quotes `#rg .pboxes{display:none}` inside a comment explaining the
 * park. A rule scanner that does not strip comments reads the explanation as a
 * declaration — and the first run of this file did exactly that, which is how
 * `.pboxes` came back "not parked" on a page that parks it.
 */
const CSS = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, ' ');

/** Every selector context that sets `display`, mapped to its LAST value. */
function displayContexts(css) {
  const ctx = new Map();
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const d = /(?:^|;)\s*display:\s*([\w-]+)/.exec(m[2]);
    if (!d) continue;
    for (const part of m[1].split(',')) ctx.set(part.trim(), d[1]);
  }
  return ctx;
}

/** Classes that are hidden in the base state with nothing anywhere lighting them. */
function darkClasses(css) {
  const ctx = displayContexts(css), dark = [];
  for (const [sel, val] of ctx) {
    const m = /^#rg\s+\.([\w-]+)$/.exec(sel);
    if (!m || val !== 'none') continue;
    const lit = [...ctx].some(([s, v]) =>
      v !== 'none' && new RegExp(`\\.${m[1]}(?![\\w-])`).test(s));
    if (!lit) dark.push(m[1]);
  }
  return dark;
}

const VOID = new Set(['input', 'br', 'img', 'meta', 'link', 'hr', 'use', 'path', 'source']);

/**
 * Every id in the markup that sits inside a dark container without being dark
 * itself. A tag-stack walk rather than a regex, because ANCESTRY is the whole
 * question and a regex cannot see it — which is precisely why no existing
 * check could have found this.
 */
function buriedIds(html, dark) {
  const stack = [], out = [];
  for (const m of html.matchAll(
    /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g)) {
    if (m[0].startsWith('<!--')) continue;
    const [, close, tag, attrs, selfclose] = m;
    if (close) {
      for (let k = stack.length - 1; k >= 0; k--)
        if (stack[k].tag === tag) { stack.length = k; break; }
      continue;
    }
    const cls = (/class="([^"]*)"/.exec(attrs) || [, ''])[1].split(/\s+/).filter(Boolean);
    const id = (/id="([^"]*)"/.exec(attrs) || [, ''])[1];
    if (id && !cls.some(c => dark.includes(c))) {
      const under = stack.filter(s => s.cls.some(c => dark.includes(c)));
      if (under.length) out.push({ id, under: under.map(s => s.cls.join('.')).join(' > ') });
    }
    if (!VOID.has(tag) && !selfclose) stack.push({ tag, cls, id });
  }
  return out;
}

/**
 * THE LEDGER. An id here is one the renderer writes into a container the
 * stylesheet currently parks, and the sentence is why that is intended.
 * Un-parking a zone should DELETE lines from this list, never leave them.
 */
const ENUMERATED = {
  /* ⭐ THE ROTATE PROMPT'S WAY OUT (2026-09-13). `.rotate` is `display:none`
     until a portrait phone asks for it, so this button is inside a parked
     container by construction and the renderer binds a handler to it at boot --
     exactly the shape this ledger exists to make deliberate. It is not parked in
     the sense the removed counters were: it is a control that only one viewport is
     ever offered, and the handler has to exist before the viewport is known,
     because a stylesheet reveals it without telling the script. */
  rotgo: 'dismisses the portrait rotate prompt — revealed by media query, never by JS',
  // ✅ `.cbar`'s SIX CHILDREN AND THE FOUR COUNTER IDS LEFT ON 2026-09-17 —
  // removed from the page, not lit: `#lbox` had shown the same figures since the
  // afternoon they were parked. The second test in this file is what said so.
  // ✅ THE OLD LAYER MENU'S SIX LINES LEFT ON 2026-09-07, and the second test in
  // this file is what would have caught them staying: the menu was DELETED, so
  // its ids are not merely back in the light, they are not on the page at all.
  // A ledger that only ever grows describes a page that no longer exists.
  // ⭐ `work` AND `workPanel` LEFT THIS LIST ON 2026-08-27, and the second test
  // in this file is what said so — they moved out of the parked menu into the
  // layer box and the space under the rink, so their ledger lines were stale
  // the moment the markup changed. A ledger that only ever grows is a document
  // describing a page that no longer exists.
  // The reference and display zones.
  slotSay: 'the slot card computes its own census sentence',
  zTrailsOn: 'the trails zone summary',
  nTrails: 'the trails note',
};

test('every live element inside a parked container is on the ledger', () => {
  const dark = darkClasses(CSS);
  /* ⚠️ THE SENTINEL MOVED WHEN ITS SUBJECT WAS DELETED. This named `pboxes` until
     2026-09-15, when the penalty band under the ice came out — and a sentinel
     naming a class no page produces goes quietly false, which is the one failure
     it exists to prevent. `blockpanel` is parked by the same rule and is still on
     the page. */
  assert.ok(dark.includes('blockpanel'),
    'the blocked panel reads as lit — the darkness model has lost its subject');

  const writes = new Set([...APP_JS.matchAll(/\$\('([\w-]+)'\)|getElementById\('([\w-]+)'\)/g)]
    .map(m => m[1] || m[2]));

  const unlisted = buriedIds(PAGE, dark)
    .filter(b => writes.has(b.id) && !(b.id in ENUMERATED));

  assert.deepEqual(unlisted, [],
    'the renderer writes into an element the stylesheet hides, and nobody said so. ' +
    'Either move it out of the parked container, or add it to ENUMERATED with a reason.');
});

/**
 * ⭐⭐ THE HIDDEN-READS RATCHET — T2's trigger, ruled 2026-09-17
 * (docs/test-program.md §11.2 Q5).
 *
 * T2 ("no test may read an element no reader can see") was NOT built: it is a
 * CSS parser standing in for a browser, and visibility claims are moving to the
 * preview stage instead. The risk of not building it is the `.pboxes` incident
 * again — tests quietly leaning on elements a stylesheet has hidden — so the
 * trigger is that risk, counted: every (hidden id, test file) pair where a test
 * READS an element inside a parked container. CHENG's first trigger, "a commit
 * adds display:none", would have fired on 52 commits in six weeks.
 *
 * It uses THIS FILE's darkness model, so it adds no second parser. It fails when
 * the count GROWS — a new test leaning on the dark — and when it FALLS, so the
 * ceiling is lowered in the same commit that earned it and the slack cannot be
 * spent later. If it grows and the read is deliberate, that is the day to build T2.
 *
 * Reads are `$('id')`, `getElementById('id')`, the fake page's own `.get('id')`,
 * and a `'#id'` selector. `smoke.test.js` read through `.get(`, and a first
 * count without it missed eight pairs. 31 on 2026-09-17 before seam B; 5 after
 * the `.counters`/`.cbar` removal the same day.
 */
const HIDDEN_READS_CEILING = 5;

test('⭐⭐ tests lean on hidden elements no more than they did — the T2 trigger', () => {
  const buried = [...new Set(buriedIds(PAGE, darkClasses(CSS)).map(b => b.id))];
  const dir = new URL('./', import.meta.url);
  const pairs = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.test.js') && f !== 'park.test.js')) {
    const text = readFileSync(new URL(f, dir), 'utf8');
    for (const id of buried) {
      const q = `['"\`]${id}['"\`]`;
      if (new RegExp(`\\$\\(\\s*${q}|getElementById\\(\\s*${q}|\\.get\\(\\s*${q}|['"\`]#${id}\\b`).test(text))
        pairs.push(`${id} <- ${f}`);
    }
  }
  // THE COUNTER MUST SEE A READ IT IS KNOWN TO HAVE, or a broken pattern reads as progress.
  // ⚠️ THE SENTINEL MOVED WHEN ITS SUBJECT WAS DELETED, like the one above: it was
  // `cA <- smoke.test.js` until #cA was removed on 2026-09-17. `slotSay` is a
  // deliberate reference-zone read on this file's own ledger.
  assert.ok(pairs.includes('slotSay <- render-notes.test.js'),
    'the counter no longer sees render-notes.test.js reading #slotSay — the patterns are broken, not the suite fixed');
  assert.ok(pairs.length <= HIDDEN_READS_CEILING,
    `${pairs.length} test reads of hidden elements, ceiling ${HIDDEN_READS_CEILING} — a test started `
    + `leaning on something no reader can see. Move it to the visible element, or if it is deliberate, `
    + `this is the trigger to build T2.\n  ${pairs.join('\n  ')}`);
  assert.equal(pairs.length, HIDDEN_READS_CEILING,
    `only ${pairs.length} hidden reads remain — lower HIDDEN_READS_CEILING to ${pairs.length} in this commit`);
});

/**
 * ⭐ AND THE LEDGER IS NOT ALLOWED TO ROT. An id listed here that is no longer
 * buried means a zone came back and the list did not — which turns the ledger
 * into a document that describes a page that no longer exists, the same defect
 * class as a build list that is a cache of the code.
 */
test('the ledger lists nothing that is already back in the light', () => {
  const buried = new Set(buriedIds(PAGE, darkClasses(CSS)).map(b => b.id));
  const stale = Object.keys(ENUMERATED).filter(id => !buried.has(id));
  assert.deepEqual(stale, [],
    'these ids are no longer inside a parked container — delete their ledger lines');
});

/**
 * ⛔⛔ THE SCOPING WAS REVERSED ON 2026-09-09, AND MEASURING THE HERO IS WHY.
 *
 * This test used to assert the OPPOSITE — that `#rg:not(.preview).corsi .cbar`
 * kept the front door's split bar lit — because parking it unscoped had once
 * left a scoreboard with no bar above a sentence about attempts. That fix was
 * right about the pair and wrong about which half to restore.
 *
 * Sampled on the live hero every 700ms across an 18-second loop: the bar reads
 * 0-0, then `1 - 0` for about FIFTEEN OF THE EIGHTEEN SECONDS, then 2-0, then
 * restarts — beside a sentence reading "Both teams took 52 shot attempts". And
 * the bar is proportional (`width:(pa)%`), so at 1-0 it draws ENTIRELY ONE
 * COLOUR: a picture asserting one club took every attempt in a game its own
 * caption calls 52-52.
 *
 * ⭐ THE DIAGNOSIS IS THE WINDOW, NOT THE SURFACE. A split bar is a whole-game
 * instrument and the preview is a ten-second loop, so it can only ever show the
 * extreme. The unit is still named where the number is: `#herosub` says "Both
 * teams took 52 shot attempts", computed over the whole game and posted from
 * this frame — so what left the hero is a contradicting picture, not the fact.
 */
test('⛔ the hero shows no metric readout at all — it has no window for one', () => {
  /* ⏹ THIS ASSERTED THE `.cbar` AND `.counters` PARKS UNTIL 2026-09-17, when both
     were removed (docs/test-program.md §8): they were the hero's loop-window
     readout, and a bar that read `1 - 0` beside a caption saying 52-52 is why the
     hero has none. The claim survives the removal and is about the whole board —
     nothing in the preview may carry a running figure whose window is the loop
     rather than the game.

     ⚠️ SO THE ELEMENTS ARE GONE, AND THE ONE THAT CARRIES RUNNING FIGURES NOW IS
     THE LAYER BOX. It must be hidden in the preview, and the removed ids must not
     come back into the markup under a new parent. */
  const previewHides = [...CSS.replace(/\/\*[\s\S]*?\*\//g, ' ')
    .matchAll(/([^{}]*)\{[^}]*display:none[^}]*\}/g)]
    .flatMap(m => m[1].split(',').map(x => x.trim()));
  assert.ok(previewHides.includes('#rg.preview .lbox'),
    'the layer box is not hidden in the preview, so the hero can show a loop-window figure again');
  for (const id of ['cA', 'cH', 'pa', 'ph', 'ba', 'bh'])
    assert.doesNotMatch(PAGE, new RegExp(`id="${id}"`),
      `#${id} is back in the markup — a removed running figure has returned`);
});

/**
 * ⛔⛔ AND A RULE THAT LIGHTS AN ELEMENT INSIDE A PARKED CONTAINER IS INERT.
 *
 * The strength control — *All situations / Even strength only* — was written
 * into the layer menu by B2, on the ruling that a control follows the layer it
 * belongs to. `#rg.corsi .figpick.sit{display:flex}` says exactly that and is
 * still there. Then the menu was parked (`#rg .zlayers{display:none}`) and the
 * control went with it. **A descendant cannot un-hide itself**, so the rule
 * stayed correct and became inert: the buttons were wired at boot, `render`
 * wrote their note into `#nSit` on every frame, and the filter was reachable
 * only by typing `?strength=even` into the URL.
 *
 * ⭐⭐ TWO INSTRUMENTS, AND IT FELL BETWEEN THEM — which is the finding, not the
 * defect. `layers.test.js` asserts the show-rule names exactly the layers whose
 * reducers read `evenOnly`; it is right, it is derived from the reducer sources,
 * and **it has no instrument for ancestry**. The check above this one walks
 * ancestry — a tag stack, deliberately, "because ANCESTRY is the whole question"
 * — and **only records elements that have an `id`**, because it models *live* as
 * *the renderer writes to it by id*. The strength buttons are
 * `<button class="lyr sbtn">`: no id, reached by `querySelectorAll`. So one
 * instrument could not see the axis and the other could not see the element.
 * Neither was wrong. **The gap was their intersection**, and that is a different
 * failure from a check being too weak.
 *
 * ⚠️ `#nSit` WAS ON THE LEDGER THE WHOLE TIME, which is the part worth sitting
 * with. The instrument fired, a human wrote *"the even-strength note"* beside it,
 * and the enumeration was accepted — without anyone asking whether the CONTROL
 * that note describes had gone dark too. **Enumerating is not the same as
 * reading what you enumerated.**
 *
 * The rule here needs no ledger, because unlike a dark write it can never be
 * intentional: a declaration that cannot take effect is a declaration someone
 * believes is taking effect.
 */
test('⛔⛔ no rule tries to light an element that a parked ancestor hides', () => {
  const dark = darkClasses(CSS);
  assert.ok(dark.length > 0, 'no parked containers found — the darkness model has no subject');

  /* ⭐ THE SIGNAL IS A STATE-GATED REVEAL, NOT ANY STYLED DESCENDANT, and the
     first draft got that wrong: it flagged `#rg .pb` inside `.pboxes` and
     `#rg .cc` inside `.counters` — ordinary layout on children of a container
     that is parked on purpose, which is not a lie about anything. Nine
     offenders, one real. A checker that reports everything buries the finding.

     What cannot be intentional is the pair: a class with a `display:none`
     DEFAULT and a separate context that turns it on. That pair says *this is off
     until something switches it on* — and inside a parked ancestor the switch
     can never fire. `.figpick.sit` is exactly that shape:
     `#rg .figpick.sit{display:none}` plus `#rg.corsi .figpick.sit{display:flex}`. */
  const off = new Set(), on = new Map();
  for (const [sel, val] of displayContexts(CSS)) {
    const m = [...sel.matchAll(/\.([\w-]+)/g)];
    if (!m.length) continue;
    const cls = m[m.length - 1][1];
    if (val === 'none') off.add(cls); else on.set(cls, sel);
  }
  const lit = new Map([...on].filter(([c]) => off.has(c)));
  assert.ok(lit.size > 0,
    'no state-gated reveals found at all — the scan is broken, not the page');

  /* Walk the markup for any element carrying one of those classes while sitting
     inside a parked container. Same tag-stack walk as `buriedIds`, asking about
     CLASSES rather than ids — which is the half that was missing. */
  const VOIDT = VOID, stack = [], bad = [];
  for (const m of PAGE.matchAll(
    /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g)) {
    if (m[0].startsWith('<!--')) continue;
    const [, close, tag, attrs, selfclose] = m;
    if (close) {
      for (let k = stack.length - 1; k >= 0; k--)
        if (stack[k].tag === tag) { stack.length = k; break; }
      continue;
    }
    const cls = (/class="([^"]*)"/.exec(attrs) || [, ''])[1].split(/\s+/).filter(Boolean);
    const under = stack.filter(s => s.cls.some(c => dark.includes(c)));
    if (under.length && !cls.some(c => dark.includes(c)))
      for (const c of cls)
        if (lit.has(c))
          bad.push(`${lit.get(c)} — but .${c} sits inside ${under.map(s => '.' + s.cls.join('.')).join(' > ')}`);
    if (!VOIDT.has(tag) && !selfclose) stack.push({ tag, cls });
  }

  /**
   * ⭐ THE ACCEPTED ONES, WITH REASONS — the same shape as the ledger above and
   * for the same reason: an inert reveal inside a zone parked ON PURPOSE is not
   * a defect, it is a rule left behind with its zone. What is a defect is one
   * nobody listed. Un-parking a zone should DELETE lines here, never leave them.
   */
  const INERT = {
    lds: 'the .areas reference cards inside .zref — NOT the layer definitions, '
       + 'which moved onto the layer objects on 2026-09-07. Two surfaces have '
       + 'always shared this class, which is what made a blanket strip of it take '
       + 'two cards with it that day.',
    asay: 'inside .zref, "What the marks mean", parked 2026-08-27',
    legend: 'inside .zref, likewise — the legend keys moved into the layer box',
    figpick: 'inside .zdisp, "Trails", parked with its zone; the .sit variant left '
           + 'this list on 2026-09-06 when the strength control was moved out',
  };
  const unlisted = [...new Set(bad)].filter(b => !(b.match(/\.([\w-]+) sits inside/) || [])[1]
                                             || !(INERT[b.match(/\.([\w-]+) sits inside/)[1]]));

  assert.deepEqual(unlisted, [],
    'these rules set a display that cannot take effect, because an ancestor is parked. '
    + 'A descendant cannot un-hide itself, so the rule reads as shipped and does nothing — '
    + 'either move the element out of the parked container or delete the rule that lies about it.');
});

test('⭐ …and that check is proven able to fail, against the defect as it shipped', () => {
  /* THE CONTROL, AND IT IS THE REAL MARKUP. `.figpick.sit` put back inside a
     parked `.zlayers`, with the show-rule untouched — which is the tree exactly
     as it stood at 22800e3. If this stops being caught, the check above has
     stopped asking about ancestry. */
  const dark = ['zlayers'];
  const lit = new Map([['sit', '#rg.corsi .figpick.sit']]);
  const html = '<div id="rg"><details class="zone zlayers">'
             + '<div class="figpick sit"><span class="fnote" id="nSit"></span></div>'
             + '</details></div>';
  const stack = [], bad = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|[^>"])*?)(\/?)>/g)) {
    const [, close, tag, attrs, selfclose] = m;
    if (close) {
      for (let k = stack.length - 1; k >= 0; k--)
        if (stack[k].tag === tag) { stack.length = k; break; }
      continue;
    }
    const cls = (/class="([^"]*)"/.exec(attrs) || [, ''])[1].split(/\s+/).filter(Boolean);
    const under = stack.filter(s => s.cls.some(c => dark.includes(c)));
    if (under.length && !cls.some(c => dark.includes(c)))
      for (const c of cls) if (lit.has(c)) bad.push(c);
    if (!VOID.has(tag) && !selfclose) stack.push({ tag, cls });
  }
  assert.deepEqual(bad, ['sit'],
    'the ancestry check does not catch the defect in the shape it actually shipped in');
});
