/**
 * ⛔⛔ A NUMBER THE CODE OWNS MUST NOT BE TYPED INTO THE SENTENCE THAT DESCRIBES IT.
 *
 * `docs/status.md` §0.00-α, item 3: the copy standard now has to reach into
 * `src/lib`, because user-facing prose moved there when Q11 gave each layer its
 * own description. CHENG thought that was *"arguably better, since that is where
 * the copy checker can reach it."* This is the checker, and the first thing it
 * found is the sentence that move was made for.
 *
 * ⚠️⚠️ THE COMMENT ABOVE `danger.counts` SAID THE PROBLEM WAS FIXED. In its own
 * words: *"These lived in hidden markup inside the parked layer menu until then,
 * which meant `HIGH_DANGER_FT` could move in `rink.js` and the sentence
 * describing it would not."* The description then landed eighteen lines below an
 * `import { HIGH_DANGER_FT }` — and still read `attempts from within 33 ft of the
 * net`. **Relocating two facts into one file puts them where a reader can compare
 * them. It does not make one derive from the other, and only the second is a
 * check.** Same shape as every expired reason this project has caught: the
 * premise changed, the conclusion did not move.
 *
 * FIVE SURFACES STATED IT, none derived it, and they are three different tiers:
 *
 *   src/lib/layers/danger.js   the layer's own description of what it counts
 *   src/lib/archive.js         quoted into `measures.json`'s `what` strings —
 *                              the document a reader checks us with
 *   builders/learn-figures.mjs the slot diagram's label AND its first step
 *   builders/build_main.py     "What the marks mean", on every game page
 *
 * The first three are JavaScript and now import the constant. The fourth is
 * Python and cannot, so `build_main.py` READS it out of `rink.js` into a
 * `__SLOT_FT__` marker — asserted unique in both directions, because
 * `str.replace` cannot fail.
 *
 * ⭐⭐ AND THE INSTRUMENT WAS BLIND BEFORE IT WAS WRITTEN. Every one of the 19
 * feet-phrases in this corpus lives in a TEMPLATE literal, and `tools/jslex.mjs`
 * dropped template text — correctly, while every question asked of it was about
 * code. A first draft of this file would have scanned string bodies, matched
 * **zero** of them, and reported a clean corpus forever. `walk` now emits `tstr`;
 * its control is in `test/app-imports.test.js`. *An instrument aimed at one axis
 * reads as coverage for all of them* — the sixth entry on that list, and the
 * first one caught before it shipped rather than after.
 *
 * ⛔ WHAT THIS DOES NOT CLAIM, stated because a scan's silence is the thing that
 * misleads:
 *
 *   - The anchor is the UNIT. `33 ft` is seen; a bare `33`, or "thirty-three
 *     feet", is not. A sentence stating a distance without saying it is one is
 *     out of reach of any scanner that is not also a reader.
 *   - It only knows values the constants hold TODAY. A prose figure that matches
 *     no constant is left alone — it is a measurement, and measurements are
 *     `quoted-figures.test.js`'s subject, checked against `data/measures.json`.
 *   - The Python tier is CHECKED, not derived: the last test reads the built
 *     pages and requires the number a visitor sees to be the current one. If
 *     `HIGH_DANGER_FT` moves and the Python string does not, that goes red — the
 *     drift alarm — but a coincidence of values would pass it quietly.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { walk } from '../tools/jslex.mjs';
import * as rink from '../src/lib/rink.js';

const ROOT = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), 'utf8');

/** A number written next to a unit of length, anywhere in a run of prose. */
const QUANTITY = /(\d+(?:\.\d+)?)\s*(ft|feet|foot)\b/g;

/**
 * Every length `rink.js` owns, as `value → the names holding it`.
 *
 * ⭐ DERIVED FROM THE MODULE, AND THE ONE EXCLUSION IS DERIVED FROM THE NAME. The
 * rink is a geometry module and its bare numbers are feet; `ENDS_NOTE_SECONDS`
 * says in its own name that it is not, and treating it as a length would have
 * this file demanding that "90 ft" be interpolated from a duration. So a name
 * that declares a different unit is dropped — which means a constant added
 * tomorrow is covered by default, and one added in seconds excludes itself.
 *
 * ⚠️ TWO NAMES SHARE A VALUE (`NET_X` and `GOAL_LINE_X` are both 89, deliberately
 * — "the same line, named for the rule that uses it"). So this is keyed by value
 * and carries every name, because the message has to name what a reader should
 * reach for and there is more than one right answer.
 */
const NOT_A_LENGTH = /_(SECONDS|MS|PX|DEG)$/;
const DISTANCES = new Map();
for (const [name, v] of Object.entries(rink))
  if (typeof v === 'number' && !NOT_A_LENGTH.test(name))
    DISTANCES.set(v, [...(DISTANCES.get(v) || []), name]);

/** Every module whose strings can reach a reader: the app, the library, the builders. */
function corpus() {
  const out = ['src/app.js'];
  const walkDir = d => {
    for (const f of readdirSync(new URL(d, ROOT), { withFileTypes: true })) {
      // `builders/legacy/` is kept as history and builds nothing. Scanning it
      // would report defects on pages that have not existed for months.
      if (f.isDirectory()) { if (f.name !== 'legacy') walkDir(`${d}${f.name}/`); }
      else if (/\.m?js$/.test(f.name)) out.push(`${d}${f.name}`);
    }
  };
  walkDir('src/lib/');
  walkDir('builders/');
  return out;
}

/**
 * The prose in `src`: quoted string bodies and template TEXT, never code and
 * never comments. `walk` decides which is which, so this file does not have to.
 */
function prose(src) {
  const out = [];
  walk(src, t => { if (t.t === 'str' || t.t === 'tstr') out.push(t.v); });
  return out;
}

/** Every place `src` types a length that `rink.js` already holds. */
function typed(src) {
  const out = [];
  for (const s of prose(src))
    for (const m of s.matchAll(QUANTITY)) {
      const names = DISTANCES.get(Number(m[1]));
      if (names) out.push({ said: m[0], names });
    }
  return out;
}

test('⛔⛔ no sentence types a distance that rink.js owns', () => {
  const bad = [];
  for (const f of corpus())
    for (const hit of typed(read(f)))
      bad.push(`${f}: "${hit.said}" is ${hit.names.join(' / ')}`);

  assert.deepEqual(bad, [],
    'these sentences state a number that lives in src/lib/rink.js. Import the '
    + 'constant and interpolate it, so the constant moving moves the sentence:\n  '
    + `${bad.join('\n  ')}\n`
    + 'If the number is a MEASUREMENT rather than a rule, it belongs in '
    + 'data/measures.json and in test/quoted-figures.test.js, not typed here either.');
});

test('⭐ …and the scan has a subject: the corpus still talks about distance', () => {
  /* WITHOUT THIS THE TEST ABOVE IS SATISFIED BY A BROKEN SCANNER, which is this
     repo's most-repeated failure wearing green. And the floor is asserted on the
     TEMPLATE channel on purpose: all 19 of the corpus's feet-phrases are template
     text, so if `walk` ever stops emitting `tstr` the check above goes silently
     blind while every assertion in it still passes.

     ⭐ THE NUMBER IS A FLOOR AGAINST A DEAD SCANNER, NOT A CLAIM ABOUT HOW MUCH
     COPY THERE SHOULD BE. The gap it sits in is 19 against 0, not a threshold
     anybody tuned; the count may move freely above it. */
  let templated = 0, quoted = 0;
  for (const f of corpus())
    walk(read(f), t => {
      if (!/\b(ft|feet|foot)\b/.test(t.v || '')) return;
      if (t.t === 'tstr') templated++; else if (t.t === 'str') quoted++;
    });

  assert.ok(templated >= 5,
    `only ${templated} template runs in the whole corpus mention feet (plus ${quoted} `
    + 'quoted). The scanner is reading nothing, or the copy is gone — either way the '
    + 'test above proves nothing. See tools/jslex.mjs on `tstr`.');
});

test('⭐⭐ …and the checker separates the defect from the fix', () => {
  /* THE CONTROL. Every assertion above is a scan that reports nothing, and a scan
     whose pattern stops matching reports nothing forever. Both forms are pinned:
     the defect EXACTLY as it shipped, and the corrected line exactly as it now
     stands, so the checker is proven to tell them apart rather than merely to be
     quiet. `HIGH_DANGER_FT` is interpolated into the fixtures rather than typed,
     because a control that hard-codes 33 stops being a control the day the
     constant moves — which is the very event it exists to cover. */
  const FT = rink.HIGH_DANGER_FT;

  const shipped = `export const danger = {\n`
                + `  counts: 'attempts from within ${FT} ft of the net, between the face-off dots',\n};`;
  assert.deepEqual(typed(shipped).map(h => h.said), [`${FT} ft`],
    'the checker does not catch the defect in the form it actually shipped in');

  const fixed = 'export const danger = {\n'
              + '  counts: `attempts from within ${HIGH_DANGER_FT} ft of the net, '
              + 'between the face-off dots`,\n};';
  assert.deepEqual(typed(fixed), [],
    'the checker flags the CORRECTED form, so a red result would prove nothing');

  /* ⚠️ A COMMENT IS NOT COPY, and this repo has shipped prose impersonating code
     three times. `danger.js` discusses "38 ft out and wide of the slot" and "a
     shot 36 ft out" in its own comments; flagging those would put the file in a
     state where the only way to go green is to stop explaining itself. */
  assert.deepEqual(typed(`// within ${FT} ft of the net\n/* ${FT} feet */ const a=1;`), [],
    'the checker reads comments as copy');

  /* AND A DISTANCE THE CONSTANTS DO NOT HOLD IS LEFT ALONE. "a shot 36 ft out" is
     an example, not a rule, and demanding a constant for it would push a fake
     one into rink.js. This is the limit the header states, asserted rather than
     described so that widening the rule has to be deliberate. */
  const notOurs = Math.max(...DISTANCES.keys()) + 1;
  assert.deepEqual(typed(`const s = 'a shot ${notOurs} ft out is rejected by geometry';`), [],
    `${notOurs} ft matches no rink constant and must not be reported`);

  /* AND THE QUOTED CHANNEL IS PROVEN LIVE HERE, because the corpus no longer has
     a single example of it — every real feet-phrase is a template now. Without
     this, `str` could stop being scanned and nothing would say so. */
  assert.equal(prose(`const s='${FT} ft';`).length, 1, 'quoted string bodies are not being read');
});

test('⭐ what a VISITOR sees states the number as it stands today', () => {
  /* THE TIER THE SCAN ABOVE CANNOT REACH. `builders/build_main.py` writes the
     "What the marks mean" panel and is Python: it cannot import a JavaScript
     constant, so it reads one into `__SLOT_FT__`. This is the alarm that says the
     read is still working — and it asks the question of the ARTIFACT rather than
     of the builder, so it also covers the JavaScript half actually reaching the
     page rather than merely being written correctly.

     ⭐ AND `measures.json` IS IN HERE BECAUSE IT IS PUBLISHED. It is the file the
     site invites a reader to check us with; a stale geometry inside its `what`
     strings is a wrong number in the one place we ask to be checked. */
  const pages = readdirSync(new URL('src/', ROOT)).filter(f => f.endsWith('.html'));
  assert.ok(pages.length >= 10, `only ${pages.length} built pages found`);

  const said = [];
  const collect = (where, text) => {
    for (const m of text.matchAll(QUANTITY)) said.push({ where, said: m[0], n: Number(m[1]) });
  };
  for (const p of pages) {
    // Markup only: the bundled script is the JS tier, already covered above, and
    // its interpolations would arrive here as the source text rather than a value.
    const html = read(`src/${p}`)
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    collect(`src/${p}`, html);
  }
  collect('data/measures.json', read('data/measures.json'));

  assert.ok(said.length >= 3,
    `only ${said.length} foot-distances found across ${pages.length} pages and measures.json — `
    + 'the slot is described in words on the game page, the slot diagram and the '
    + 'published measures, so finding none means this is reading the wrong text');

  const stale = said.filter(s => !DISTANCES.has(s.n));
  assert.deepEqual(stale, [],
    'a reader is being shown a distance that no rink.js constant holds. Either the '
    + 'constant moved and this surface did not follow it — for the Python tier that '
    + 'is builders/build_main.py and its __SLOT_FT__ marker, for measures.json it is '
    + 'a derive run that has not been made — or the page is quoting a measurement, '
    + 'which belongs in data/measures.json with its n.');
});
