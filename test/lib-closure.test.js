/**
 * EVERY PAGE INLINES EVERY MODULE IT NEEDS, IN AN ORDER THAT RESOLVES.
 *
 * ⛔⛔⛔ THE DEFECT THIS EXISTS FOR, and the builders have been warning about it
 * in prose for weeks. Both inliners strip `import` lines — node reads these as
 * real ES modules for the tests, the browser gets them concatenated — so a page
 * that inlines `preview.js` and not the file `preview.js` imports from produces
 * a page that BUILDS CLEANLY and throws `leagueRows is not defined` at render
 * time. `build_methods` already carries the sentence: *"a module this page needs
 * and does not name is a `ReferenceError` at render time rather than a build
 * failure — which is exactly how this broke the moment the anchor moved into a
 * file of its own."* It then happened again on 2026-09-26, to `preview.html`,
 * when `leagueRows` moved into a file of its own. Twice is a class.
 *
 * ⭐⭐ AND THE ORDER IS PART OF THE CLAIM, NOT A SEPARATE ONE. The modules are
 * CONCATENATED, so a `const` at the top level of one is in its temporal dead
 * zone until its own line runs. `function` declarations hoist and would hide
 * this; `CLUB_ROWS` and `DERIVATION` do not. The `LIB` list in `build_main.py`
 * is full of hand-written comments pinning order — *"AFTER rink.js, which owns
 * BLUE_LINE_X"*, *"LAST, and it has to be"* — which is the rule being kept by
 * memory. This checks it.
 *
 * ⚠️ IT READS THE BUILDERS RATHER THAN THE BUILT PAGES, on purpose. A built page
 * is one flat script: by the time the modules are concatenated, the question
 * "which file was this name supposed to come from" has been erased. The lists
 * are the artifact that can be wrong.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const LIBDIR = new URL('../src/lib/', import.meta.url);

/** The modules one file imports, as the inliners' own regex sees them. */
function importsOf(name) {
  const src = readFileSync(new URL(name, LIBDIR), 'utf8');
  return [...src.matchAll(/^[ \t]*import[^;]*?from\s+'([^']+)'[ \t]*;/gm)]
    .map(m => m[1])
    .filter(p => p.startsWith('.'))
    /* `./x.js` from `layers/y.js` means `layers/x.js`; the builders resolve it
       the same way, and a bare name here would look like a top-level module. */
    .map(p => p.replace(/^\.\//, name.includes('/') ? 'layers/' : '').replace(/^\.\.\//, ''));
}

/**
 * Every `_lib(...)` argument list in `build_index.py`, plus its default.
 *
 * ⚠️ THE CALL SITES ARE FOUND, NOT LISTED. A page added tomorrow with a short
 * module list is exactly the case this should catch, and a hand-written list of
 * call sites would not see it — the staleness this file is about, one level up.
 */
function indexLists() {
  const py = read('../builders/build_index.py');
  const out = [];
  for (const m of py.matchAll(/_lib\(([^)]*)\)/g)) {
    const names = [...m[1].matchAll(/"([^"]+\.js)"/g)].map(x => x[1]);
    // `def _lib(*names)` itself, and `_lib()` which falls back to its default.
    if (/^\s*\*names\s*$/.test(m[1])) continue;
    out.push(names.length ? names : defaultLib(py));
  }
  assert.ok(out.length >= 4, `only ${out.length} _lib() call sites found — the regex has drifted`);
  return out;
}

function defaultLib(py) {
  const m = /names or \(([^)]*)\)/.exec(py);
  assert.ok(m, 'the _lib() default tuple could not be read');
  return [...m[1].matchAll(/"([^"]+\.js)"/g)].map(x => x[1]);
}

/** `build_main.py`'s `LIB`, which both replay pages inline. */
function mainList() {
  const py = read('../builders/build_main.py');
  const i = py.indexOf('LIB = [');
  assert.ok(i > 0, 'build_main.py has no LIB list');
  const body = py.slice(i, py.indexOf(']', i));
  const names = [...body.matchAll(/"([^"]+\.js)"/g)].map(x => x[1]);
  assert.ok(names.length > 20, `LIB parsed as only ${names.length} modules`);
  return names;
}

const ALL = [...indexLists().map((l, n) => [`build_index _lib() #${n + 1}`, l]),
             ['build_main LIB', mainList()]];

test('⛔⛔⛔ every module a page inlines has its own imports inlined beside it', () => {
  /* MUTATION: drop "anchors.js" from the methods page's list and this fires —
     which is the exact edit that shipped a broken `how-we-measure.html` once,
     and the exact shape that shipped a broken `preview.html` a fortnight later. */
  const broken = [];
  for (const [where, list] of ALL) {
    for (const name of list) {
      if (!existsSync(new URL(name, LIBDIR))) {
        broken.push(`${where}: names ${name}, which is not in src/lib`);
        continue;
      }
      for (const need of importsOf(name)) {
        if (!list.includes(need)) broken.push(`${where}: ${name} imports ${need}, which the page does not inline`);
      }
    }
  }
  assert.deepEqual(broken, [], 'a page inlines a module whose imports it does not carry\n  '
    + broken.join('\n  '));
});

test('⛔⛔ and it inlines them FIRST, because the files are concatenated', () => {
  /* ⭐ NOT A STYLE RULE. `const CLUB_ROWS = [...]` at a module's top level is in
     its temporal dead zone until that line runs, so a page listing `preview.js`
     before `league-rows.js` throws on load — while a graph of nothing but
     `function` declarations would hoist and hide it. The distinction is why this
     is checked rather than trusted to the comments in `LIB`.
     MUTATION: move "rink.js" to the end of LIB and this fires. */
  const wrong = [];
  for (const [where, list] of ALL) {
    for (const name of list) {
      if (!existsSync(new URL(name, LIBDIR))) continue;
      for (const need of importsOf(name)) {
        const a = list.indexOf(need), b = list.indexOf(name);
        if (a >= 0 && a > b) wrong.push(`${where}: ${name} (#${b + 1}) imports ${need} (#${a + 1}), which is inlined AFTER it`);
      }
    }
  }
  assert.deepEqual(wrong, [], 'a module is inlined before the one it imports\n  ' + wrong.join('\n  '));
});
