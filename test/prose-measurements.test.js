/**
 * ⛔⛔⛔ A PUBLISHED MEASUREMENT MAY NOT BE TYPED INTO A SENTENCE A READER SEES.
 *
 * Kevin, 2026-09-30, the night the season opened: *"any number contained on the
 * site is derived (calculated) starting with league provided data... we shouldn't
 * have any constants or enumerations of constants anywhere in the code, no?"*
 *
 * The working form is the split he ratified on 2026-09-23, because the strong
 * version would delete the guards that protect the pipeline:
 *
 *   a MEASUREMENT   the archive can answer it. Derive, publish, read. This file.
 *   a POLICY        a choice nothing can derive (SLOT_HALF_WIDTH). Declared once.
 *   a RULEBOOK FACT stated by a document outside us (NET_X). Declared once, cited.
 *   a VOCABULARY    KNOWN_PENALTIES, whose INCOMPLETENESS is the alarm. Hand-written
 *                   on purpose — derive it from the feed and it can never fire.
 *
 * ⭐⭐ WHY A CHECK WAS NOT ENOUGH, which is the thing this file exists to fix.
 * `layer-copy.test.js` already read `measures.json` and required the zone-start
 * caption to quote the published figures, so they could not rot silently. But a
 * test that a typed number is STILL CORRECT leaves a typed number: from the night
 * the season opened that gate would have gone red every Monday and a person would
 * have retyped five figures by hand. A treadmill is not a guard. The only figure
 * that cannot drift is the one nobody wrote down.
 *
 * ⭐⭐ THE INSTRUMENT IS A LEXER, AND THE LINE-BASED VERSION WAS USELESS. Grepping
 * source lines for published values returns 411 hits, almost all of them JSDoc
 * continuation lines and coincidences — a pixel measurement of `189` matching
 * `reach.blocked-shot.max`. `tools/jslex.mjs` drops comments by construction, so
 * the scanner cannot read an explanation of a defect as the defect. That is the
 * same trap `prose-constants.test.js` names in its own header, one axis over.
 *
 * ⛔ WHAT THIS DOES NOT COVER, stated because a scan's silence is what misleads:
 *
 *   - DISTINCTIVE TOKENS ONLY: a comma or a decimal point, and three digits. So
 *     `1,394`, `165,420`, `48.2` and `0.52` are seen; `5`, `60` and `1.5` are not,
 *     because prose says those about hockey and no scanner can tell which is which.
 *   - THE PYTHON TIER IS OUT OF REACH OF THIS SHAPE OF CHECK, and that was
 *     measured rather than assumed: the same scan over `builders/*.py` returns 24
 *     candidate lines, and every one is either JavaScript inside a Python string
 *     (`yaw=-0.52` colliding with a published rate) or comment text inside an
 *     emitted CSS/JS block. The builders emit code and commentary AS strings, so
 *     string-level scanning there is dominated by coincidence. Hand-triaged on
 *     2026-09-30: zero live prose figures, and the front door's `over 4,192 games`
 *     is interpolated from `__ARCHIVE_GAMES__`.
 *   - It knows the values the document holds TODAY. A figure that matches nothing
 *     published is invisible here — that is `quoted-figures.test.js`'s subject.
 *
 * ⚠️ AND THERE IS DELIBERATELY NO ALLOWLIST. The expected false positive is a CSS
 * length in a template literal colliding with a rate (`font-size:1.25rem` against
 * `census.pace.trailingLift`); there are none today. An empty escape hatch is
 * untested machinery that invites its own use, so the first genuine coincidence
 * should add one WITH its reason. Until then the answer to a red here is to derive
 * the number, which is the answer nearly every time.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { walk } from '../tools/jslex.mjs';

const ROOT = new URL('../', import.meta.url);
const M = JSON.parse(readFileSync(new URL('data/measures.json', ROOT), 'utf8'));

/** Every number the published document holds, with the path that names it. */
function leaves(o, p = '', out = []) {
  if (o && typeof o === 'object') { for (const k of Object.keys(o)) leaves(o[k], p ? `${p}.${k}` : k, out); return out; }
  if (typeof o === 'number' && Number.isFinite(o)) out.push({ p, v: o });
  return out;
}

/** A token is distinctive if prose could not plausibly hold it by accident. */
const distinctive = t => /[.,]/.test(t) && t.replace(/\D/g, '').length >= 3;

/** Every way this site prints a published figure → the fields that hold it. */
function renderings() {
  const forms = new Map();
  const add = (t, p) => {
    if (!distinctive(t)) return;
    if (!forms.has(t)) forms.set(t, new Set());
    forms.get(t).add(p);
  };
  for (const { p, v } of leaves(M)) {
    if (Number.isInteger(v)) add(v.toLocaleString('en-US'), p);
    else {
      add(String(v), p); add(v.toFixed(2), p); add(v.toFixed(3), p);
      add((v * 100).toFixed(1), p); add(`${(v * 100).toFixed(1)}%`, p);
    }
  }
  return forms;
}

/** Published figures found inside STRING bodies — comments are dropped by the lexer. */
function scan(src, forms, where) {
  const hits = [];
  walk(src, tok => {
    if (tok.t !== 'str' && tok.t !== 'tstr') return;
    for (const [t, paths] of forms)
      if (tok.v.includes(t)) hits.push({ where, token: t, paths: [...paths], say: tok.v.trim().slice(0, 110) });
  });
  return hits;
}

/** Every module whose strings can reach a reader. Same corpus shape as prose-constants. */
function corpus() {
  const out = ['src/app.js'];
  const dir = d => {
    for (const e of readdirSync(new URL(d, ROOT), { withFileTypes: true })) {
      if (e.isDirectory()) { if (!/legacy|node_modules/.test(e.name)) dir(`${d}${e.name}/`); continue; }
      if (/\.(js|mjs)$/.test(e.name)) out.push(`${d}${e.name}`);
    }
  };
  dir('src/lib/'); dir('builders/');
  return [...new Set(out)];
}

test('⭐⭐ THE SCANNER FINDS A PLANTED FIGURE, AND IGNORES ONE IN A COMMENT', () => {
  /* ⛔⛔ A SCAN THAT REPORTS ZERO NEEDS A CONTROL OR IT IS NOT EVIDENCE. This file
     would otherwise pass forever if `walk` stopped emitting string bodies, if the
     corpus resolved to nothing, or if `distinctive` rejected everything — three
     silent failures that all look exactly like a clean repo.

     ⭐ BOTH DIRECTIONS, because the instrument has two ways to be wrong: blind to
     prose, or unable to tell prose from the words about prose. The line-based
     version this replaced failed the second way, 411 times. */
  const forms = renderings();
  assert.ok(forms.size > 50, `only ${forms.size} distinctive published figures — the document did not resolve`);

  const [token] = [...forms.keys()];
  const planted = `const a = 'we counted ${token} of them';\n`
                + `/* and this comment says ${token} and must not count */\n`
                + `// nor this one, ${token}\n`;
  const found = scan(planted, forms, 'planted');
  assert.equal(found.length, 1,
    `the scanner saw ${found.length} occurrences of a planted "${token}" where exactly one is in a string`);
  assert.match(found[0].say, /we counted/, 'the scanner matched the comment instead of the sentence');
});

test('⛔⛔⛔ no published measurement is typed into a string a reader can see', () => {
  /* MUTATION, and it was run: against `src/app.js` as it stood before the
     zone-start caption was derived, this reports 6 — `165,420`, `1.683`, `1.163`
     and `0.52`, the figures that sentence had typed into it since the layer
     shipped. Against the derived version it reports 0. */
  const forms = renderings();
  const hits = corpus().flatMap(f => scan(readFileSync(new URL(f, ROOT), 'utf8'), forms, f));
  assert.deepEqual(hits.map(h => `${h.where}: "${h.token}" is ${h.paths[0]} — ${h.say}`), [],
    'a figure the archive publishes is typed into prose. Read it from the document '
    + 'instead: it is a MEASUREMENT, and the next derive will move it.');
});
