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
import { readFileSync } from 'node:fs';
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
  /* ⭐ `.cbar`'s SIX CHILDREN ARRIVED HERE ON 2026-09-09, and the note they
     replace said they could not. It read: the bar is parked on the game page and
     lit on the front door, the difference is one `:not(.preview)`, and that is a
     specificity fact across two contexts which `darkClasses` deliberately does
     not model — so a ledger line would be a claim the instrument cannot support.
     THE SCOPING IS GONE, so the gap it named is gone with it. The bar is parked
     on both surfaces now, `darkClasses` reads it as dark on the one surface it
     models, and these six become exactly what this ledger is for: elements the
     renderer still writes into, deliberately, behind a park. */
  ba: 'the away half of the split bar — still written, so un-parking needs no rewiring',
  bh: 'the home half of the split bar',
  pa: 'the away attempts figure',
  ph: 'the home attempts figure',
  pName: 'the unit the two figures count — still set, and read by the preview test',
  pMode: 'the situation they count under',
  // The Attempts layer's counters, parked 2026-08-27 with the rest.
  cA: 'the away attempts count', mA: 'and the situation it counts under',
  cH: 'the home attempts count', mH: 'and the situation it counts under',
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
  assert.ok(dark.includes('pboxes'),
    'the penalty-box row reads as lit — the darkness model has lost its subject');

  const writes = new Set([...APP_JS.matchAll(/\$\('([\w-]+)'\)|getElementById\('([\w-]+)'\)/g)]
    .map(m => m[1] || m[2]));

  const unlisted = buriedIds(PAGE, dark)
    .filter(b => writes.has(b.id) && !(b.id in ENUMERATED));

  assert.deepEqual(unlisted, [],
    'the renderer writes into an element the stylesheet hides, and nobody said so. ' +
    'Either move it out of the parked container, or add it to ENUMERATED with a reason.');
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
  assert.match(CSS, /(?:^|[,\s])#rg\.corsi \.cbar\s*,/,
    'the cbar park is scoped away from the preview again — the hero is back to '
    + 'drawing a 100%/0% bar under a caption that says the game was even');
  assert.doesNotMatch(CSS, /#rg:not\(\.preview\)\.corsi \.cbar/,
    'the preview exception is back in the stylesheet');

  /* ⚠️ AND THE PAIRED HALF, DERIVED. "Hide the bar" is satisfied by a hero that
     grows a different attempts readout tomorrow — the counters are parked by the
     same rule, but a NEW element would not be. So the claim is about the whole
     board: nothing in the preview may carry a running figure whose window is the
     loop rather than the game. */
  const previewHides = [...CSS.replace(/\/\*[\s\S]*?\*\//g, ' ')
    .matchAll(/([^{}]*)\{[^}]*display:none[^}]*\}/g)]
    .flatMap(m => m[1].split(',').map(x => x.trim()));
  for (const sel of ['#rg.corsi .counters', '#rg.corsi .cbar'])
    assert.ok(previewHides.includes(sel),
      `${sel} is not parked, so the preview can show a loop-window figure again`);
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
