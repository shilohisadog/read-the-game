/**
 * ⭐⭐ THE IMPORT LIST AT THE TOP OF `src/app.js` IS A CLAIM, AND THE SHIPPED PAGE
 * CANNOT FALSIFY IT.
 *
 * `builders/build_main.py` strips those imports and satisfies them by
 * concatenating the twenty library modules above the function instead. So in the
 * built page every one of those names resolves whether it was declared or not:
 * delete an import and nothing breaks, nothing goes red, and nothing anywhere
 * says the file's own statement of what it needs has stopped being true.
 *
 * That is the exact shape this repo keeps being bitten by -- a declaration that
 * can rot with no instrument watching -- and it is the shape `src/app.js` was
 * made a module (2026-09-04) to get OUT of. A stale import list hands back the
 * same unmeasurable file wearing module clothes.
 *
 * So both directions are asserted, and neither is safe alone: completeness alone
 * is satisfied by importing every export of every module, and minimality alone
 * is satisfied by importing nothing.
 *
 * ⚠️ THE INSTRUMENT IS CHECKED FIRST. `tools/jslex.mjs` was written for this, and
 * an unchecked scanner is how "70 write sites" happened. Its control is the first
 * test below, and it includes the literal shape that produced that false finding.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { referenced } from '../tools/jslex.mjs';

const LIB = new URL('../src/lib/', import.meta.url);
const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

/**
 * Where the shipped half of the file begins.
 *
 * The preamble -- the imports and the prose about them -- is not shipped, so it
 * must not be scanned either: `import { SX } from …` mentions `SX`, and counting
 * that as a use would make the completeness test pass for every name handed to
 * it. `build_main.py` holds this same anchor and asserts it is unique for the
 * same reason, as does `render-ends.test.js`; all three assert rather than
 * assume, because an anchor that silently matches twice is this repo's oldest
 * build failure.
 */
const ANCHOR = '\nexport function boot(';

/** The half of the file that reaches a browser. */
function shipped() {
  assert.equal(src.split(ANCHOR).length - 1, 1,
               'the anchor must appear exactly once, or the wrong half of the file is scanned');
  return src.slice(src.indexOf(ANCHOR));
}

/** `[name, module]` for every name the preamble declares. */
function declaredImports() {
  const out = [];
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/lib\/([^']+)'/g))
    for (const raw of m[1].split(',')) {
      const name = raw.trim();
      if (name) out.push([name, m[2]]);
    }
  assert.ok(out.length > 40,
            `only ${out.length} imports parsed — the scan is broken, not the file`);
  return out;
}

/** Every bundled module and what it really exports, resolved by node, not read as text. */
async function bundledModules() {
  const py = readFileSync(new URL('../builders/build_main.py', import.meta.url), 'utf8');
  const at = py.indexOf('LIB = [');
  const files = [...py.slice(at, py.indexOf(']', at)).matchAll(/"([^"]+\.js)"/g)].map(m => m[1]);
  files.push('rinkart.js');
  assert.ok(files.length > 15, 'the LIB list did not parse out of the builder');
  return Promise.all(files.map(async file => ({
    file, exports: Object.keys(await import(new URL(file, LIB))),
  })));
}

test('⭐ the lexer is right about the shapes that fooled a regex', () => {
  const t = (js, must, mustNot) => {
    const names = referenced(js);
    for (const m of must) assert.ok(names.has(m), `missed ${m} in ${JSON.stringify(js)}`);
    for (const m of mustNot) assert.ok(!names.has(m), `wrongly found ${m} in ${JSON.stringify(js)}`);
  };

  // THE ONE THAT STARTED THIS. `data-i="${k}"` is not a use of `i`, and reading
  // it as one is how the playhead grew from two write sites to seven, and from
  // there into a refactor plan Kevin was asked to approve.
  t('el.innerHTML=`<b data-i="${k}">x</b>`;', ['el', 'k'], ['i', 'b', 'x', 'data']);

  t('// SX is only mentioned here\nconst a=1;', ['a'], ['SX']);
  t('/* SX SY */ const b=NET_X;', ['NET_X'], ['SX', 'SY']);
  t('const s="SX", r=/SX/g;', ['s', 'r'], ['SX']);
  t('obj.SX; obj?.SY;', ['obj'], ['SX', 'SY']);
  t('const LENS={corsi:corsi};', ['corsi', 'LENS'], []);          // the value is a use
  t('const o={SX:1};', ['o'], ['SX']);                            // the key is not
  t('const p={corsi, danger};', ['corsi', 'danger'], []);         // shorthand IS a use
  t('let x=a/b/c;', ['a', 'b', 'c'], []);                         // division, not a regex
  t('return /a\\/b/.test(z);', ['z'], ['a', 'b']);                // regex, not division
  t('f(`${g(`${h}`)}`);', ['f', 'g', 'h'], []);                   // nested templates
  t('const HX=1, HY=2; let lastHD=null;', ['lastHD', 'HX', 'HY'], []);
});

test('⭐ every library name src/app.js uses is one it imports', async () => {
  const body = shipped();
  const uses = referenced(body);
  const declared = new Set(declaredImports().map(([n]) => n));

  // A name the file declares for itself shadows the library one, and importing
  // it would be the false statement rather than the fix. There are none today;
  // this is here so that stays a measurement rather than an assumption.
  const own = new Set(
    [...body.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]));

  const missing = [];
  for (const mod of await bundledModules())
    for (const name of mod.exports)
      if (name !== 'default' && !declared.has(name) && !own.has(name) && uses.has(name))
        missing.push(`${name} (from ${mod.file})`);

  assert.deepEqual(missing.sort(), [],
    'src/app.js uses these library names without importing them. The built page works anyway — '
    + 'build_main.py concatenates the modules, so every name resolves — which is exactly why '
    + 'nothing else in this repo would ever tell you.');
});

test('⭐ …and every name it imports is one it actually uses', () => {
  const uses = referenced(shipped());
  const dead = declaredImports()
    .filter(([name]) => !uses.has(name))
    .map(([n, f]) => `${n} (from ${f})`);

  assert.deepEqual(dead, [],
    'these imports are declared and never used. An unused import is a false statement about '
    + 'what this file depends on, and it survives every other check in the repo.');
});
