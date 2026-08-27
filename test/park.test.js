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
  // ⚠️ `.cbar`'s SIX CHILDREN ARE NOT HERE, and their absence is the model's
  // limit made visible. The bar is parked on the game page and lit on the front
  // door, and the difference is one `:not(.preview)` — a specificity fact across
  // two contexts, which `darkClasses` deliberately does not model. So it reads
  // the bar as lit, which is true of the surface it can see. The game page's
  // half is covered by the third test in this file instead, which asserts the
  // scoping directly. A ledger line here would be a claim the instrument cannot
  // support, which is worse than a gap it names.
  // The Attempts layer's counters, parked 2026-08-27 with the rest.
  cA: 'the away attempts count', mA: 'and the situation it counts under',
  cH: 'the home attempts count', mH: 'and the situation it counts under',
  // The old layer menu. Parked whole; every control in it goes dark by design,
  // and the SELECTOR is what a visitor uses now.
  zLayersOn: 'the zone summary said what was on inside it',
  lyCorsi: 'the old row', lyHd: 'the old row', lyGoalie: 'the old row',
  lyWhistle: 'the old row', lyBlock: 'the old row',
  nSit: 'the even-strength note, "N attempts have dropped out so far"',
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
 * ⭐ THE PARK WAS WRITTEN FOR THE GAME PAGE AND APPLIED TO TWO SURFACES.
 *
 * The hero boots `corsiOn=true`, so the preview wears the `corsi` class, so
 * `#rg.corsi .cbar{display:none}` took the front door's split bar and its
 * CONTROL/SHOT ATTEMPTS readout with it. That left a scoreboard with no bar
 * above a sentence about attempts — the precise pair `app.js` names in "AND
 * THE BOARD NAMES ITS UNIT", where the fix for it was originally written.
 *
 * `render-preview.test.js` asserts `pName`'s textContent, which is set by the
 * script and says nothing about whether a stylesheet shows it. Two mechanisms,
 * one observable, proves neither — so this asserts the other one.
 */
test('parking the layer displays does not reach the front-door hero', () => {
  assert.match(CSS, /#rg:not\(\.preview\)\.corsi \.cbar/,
    'the cbar park is not scoped away from the preview — the hero loses its bar');
  assert.doesNotMatch(CSS, /(?:^|[,\s])#rg\.corsi \.cbar\s*\{[^}]*display:none/,
    'an unscoped cbar park is still in the stylesheet');
});
