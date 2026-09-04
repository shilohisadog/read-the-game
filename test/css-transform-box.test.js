/**
 * ⛔⛔ EVERY SCALING ANIMATION ON THE ICE MUST SAY WHAT IT SCALES ABOUT.
 *
 * Kevin, 2026-09-04, watching the replay: *"the puck… it now looks like it's
 * coming from off the rink onto its current event, then again from off the rink
 * to the next spot of the next event."* He was right about what he saw and wrong
 * about when it began — the puck's markup is byte-identical on all 269 played
 * frames to the build before the decomposition, as are this stylesheet and the
 * per-frame pace, all three checked rather than argued. It had been that way
 * since the animation was written.
 *
 * ⭐ THE MECHANISM, AND IT IS WHY THIS IS A RULE RATHER THAN A FIX. On an SVG
 * element a CSS transform resolves against the VIEW BOX with an origin of `0 0`,
 * not against the element's own box. So `transform:scale(2)` on a circle at
 * (80, 64.5) starts it at (160, 129) — past the right boards and below the ice on
 * a 200×85 rink — and the animation slides it diagonally into place. `.ev`,
 * `.fig` and `.gk` all set `transform-box:fill-box` and pop about their own
 * centres, which is what every one of these animations means. The puck alone was
 * missed, and nothing anywhere could tell you: **the suite has no pixels, and a
 * rendered-DOM walk cannot see a stylesheet at all.** It took a person watching.
 *
 * ⭐⭐ SO THE GUARD IS DERIVED FROM THE STYLESHEET, NEVER FROM A LIST. Any rule
 * that runs an animation whose keyframes scale must resolve `transform-box:
 * fill-box`. A list would have to be remembered; this cannot be, because the next
 * scaling animation brings its own entry with it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_CSS, boot } from './helpers/page.js';

/** `name` → true if its keyframes ever scale. Translations are unaffected. */
function scalingKeyframes(css) {
  const out = new Set();
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g))
    if (/transform\s*:[^;}]*\bscale\(/.test(m[2])) out.add(m[1]);
  return out;
}

/** Every `selector { … }` rule as a pair, top level only. */
function rules(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  for (const m of stripped.matchAll(/([^{}@]+)\{([^{}]*)\}/g))
    out.push({ sel: m[1].trim().replace(/\s+/g, ' '), body: m[2] });
  return out;
}

test('⭐ the stylesheet still contains the animations this is about', () => {
  /* WITHOUT THIS, EVERY ASSERTION BELOW PASSES ON A PAGE WITH NO ANIMATIONS AT
     ALL — green because there is nothing to check, which reads exactly like green
     because the rule is held. */
  const scaling = scalingKeyframes(PAGE_CSS);
  assert.ok(scaling.size >= 5,
    `only ${scaling.size} scaling animations found — the scan is broken, not the page`);
  assert.ok(scaling.has('pj'), 'the puck animation is gone, so this file has lost its subject');
});

/** The class names a rule's selector requires, e.g. `#rg .puck.jump` → [puck, jump]. */
const classesOf = sel => [...sel.matchAll(/\.([\w-]+)/g)].map(m => m[1]);

/**
 * Every distinct `class="…"` the page writes INSIDE the rink's SVG, across a
 * played walk with the slot layer on.
 *
 * ⚠️ THIS IS WHAT MAKES THE CHECK ABOUT SVG RATHER THAN ABOUT CSS. The rule only
 * bites on SVG elements: an HTML element's transform already resolves against its
 * own border box, so `#rg .bump` and `#rg .pressplay` scale correctly and needing
 * `transform-box` from them would be noise. A stylesheet cannot tell you which is
 * which — the markup can, and it is the markup the rule is about.
 */
function svgClassSets() {
  const a = boot(null, null, '?layer=slot');
  const out = new Set();
  a.$('play').click();
  for (let k = 0; k < 150 && a.advance(1) === 1; k++)
    for (const id of ['events', 'puck', 'netmen', 'rink', 'whistles', 'lines', 'cue', 'labels']) {
      const el = a.$(id);
      if (!el) continue;
      for (const s of (el.innerHTML || '').matchAll(/class="([^"]+)"/g))
        out.add(s[1].split(/\s+/).filter(Boolean).join(' '));
    }
  return [...out].map(s => new Set(s.split(' ')));
}

test('⛔⛔ every SVG mark given a scaling animation resolves transform-box:fill-box', () => {
  const scaling = scalingKeyframes(PAGE_CSS);
  const all = rules(PAGE_CSS);
  const sets = svgClassSets();
  assert.ok(sets.length > 8, `only ${sets.length} class sets seen in the SVG — the walk is not drawing`);

  /* ⚠️ CO-OCCURRENCE, NOT SELECTOR PREFIXES, AND THE FIRST DRAFT GOT THIS WRONG.
     It compared selector STRINGS, so `#rg .flare{animation:flare}` looked
     uncovered even though `#rg .ev{transform-box:fill-box}` applies to the very
     same element — every mark is `class="ev fig att cur a pop"`. That draft
     reported nine offenders of which one was real: a checker that flags
     everything is as useless as one that flags nothing, and it would have made
     the puck's genuine defect indistinguishable from noise. The question is about
     an ELEMENT, so it is asked of the classes an element actually carries. */
  const boxed = new Set(all.filter(r => /transform-box\s*:\s*fill-box/.test(r.body))
                           .flatMap(r => r.sel.split(',').flatMap(classesOf)));

  const bad = [];
  for (const r of all) {
    const anim = /animation\s*:\s*([\w-]+)/.exec(r.body);
    if (!anim || !scaling.has(anim[1])) continue;
    for (const sel of r.sel.split(',').map(s => s.trim())) {
      const need = classesOf(sel);
      if (!need.length) continue;
      for (const set of sets)
        if (need.every(c => set.has(c)) && ![...set].some(c => boxed.has(c)))
          bad.push(`${sel} (animation: ${anim[1]}) on class="${[...set].join(' ')}"`);
    }
  }

  assert.deepEqual([...new Set(bad)], [],
    'these SVG marks scale without saying what they scale ABOUT. On an SVG element a '
    + 'CSS transform resolves against the view box with an origin of 0 0, so scale(2) '
    + 'doubles the coordinates and the mark flies in from off the rink instead of '
    + 'popping in place. Add `transform-box:fill-box;transform-origin:center` — see the '
    + 'comment above #rg .puck in src/app.css.');
});

test('⭐⭐ …and the checker rejects a rule that scales without it', () => {
  /* THE CONTROL. This check is a scan over a stylesheet, and a scan whose pattern
     silently stops matching reports a clean page forever — this project's
     most-repeated failure dressed as green. Two fixtures: the defect exactly as
     it shipped, and the fixed form, so the checker is proven to separate them
     rather than merely to be quiet. */
  const defect = `#rg .puck{fill:#000}#rg .puck.jump{animation:pj .3s ease}`
               + `@keyframes pj{0%{transform:scale(2)}100%{transform:scale(1)}}`;
  const fixed = `#rg .puck{fill:#000;transform-box:fill-box;transform-origin:center}`
              + `#rg .puck.jump{animation:pj .3s ease}`
              + `@keyframes pj{0%{transform:scale(2)}100%{transform:scale(1)}}`;

  /** The same predicate as the test above, over a supplied stylesheet and markup. */
  const offenders = (css, sets) => {
    const scaling = scalingKeyframes(css), all = rules(css), out = [];
    const boxed = new Set(all.filter(r => /transform-box\s*:\s*fill-box/.test(r.body))
                             .flatMap(r => r.sel.split(',').flatMap(classesOf)));
    for (const r of all) {
      const anim = /animation\s*:\s*([\w-]+)/.exec(r.body);
      if (!anim || !scaling.has(anim[1])) continue;
      const need = classesOf(r.sel);
      for (const set of sets)
        if (need.length && need.every(c => set.has(c)) && ![...set].some(c => boxed.has(c)))
          out.push(r.sel);
    }
    return [...new Set(out)];
  };
  const onIce = [new Set(['puck', 'jump'])];

  assert.deepEqual(offenders(defect, onIce), ['#rg .puck.jump'],
    'the checker did not catch the defect in the exact form it shipped in');
  assert.deepEqual(offenders(fixed, onIce), [],
    'the checker flags the FIXED form too, so a red result would prove nothing');

  /* ⭐ AND THE FALSE POSITIVE THAT KILLED THE FIRST DRAFT, PINNED AS A CASE. An
     animation class riding on a class that IS boxed — `class="ev fig att cur a
     pop"` — must not be reported. The first version compared selector strings
     and flagged all six arrival animations, which is how a real defect gets lost
     among noise. */
  const arrival = `#rg .ev{transform-box:fill-box;transform-origin:center}`
                + `#rg .pop{animation:pop .3s ease}`
                + `@keyframes pop{0%{transform:scale(2.6)}100%{transform:scale(1)}}`;
  assert.deepEqual(offenders(arrival, [new Set(['ev', 'fig', 'att', 'cur', 'a', 'pop'])]), [],
    'the checker flags a mark that inherits transform-box from a class it carries');

  /* AND A TRANSLATION IS NOT A SCALE. `transform-box` changes what a percentage
     origin resolves against; a pure translate is unaffected, and flagging one
     would push a meaningless property onto every moving element on the page. */
  const translate = `#rg .x{animation:sl 1s ease}@keyframes sl{to{transform:translate(2px,0)}}`;
  assert.deepEqual(offenders(translate, [new Set(['x'])]), [],
    'the checker flags a translation, which does not need transform-box');
});
