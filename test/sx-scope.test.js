/**
 * No module that COUNTS may import the screen transform — the leading indicator
 * for a runtime rule.
 *
 * ⭐ THE PROPERTY IS RUNTIME, AND IT LIVES IN `test/render-ends.test.js`: a probe
 * in library position must throw on `SX`, and the same probe inside `boot` must
 * resolve. That pair is the authority and this file does not replace it.
 *
 * This is the cheaper, earlier check. CHENG, 2026-09-03: *"the runtime probe
 * asks can a reducer reach `SX` in the shipped artifact. The static check asks
 * did anyone write an import. A static import would be the mechanism by which
 * the runtime property breaks, so catching it earlier is cheaper. Two checks,
 * one property, and the runtime one is the authority."*
 *
 * ⭐⭐ AND A STATIC CHECK CAN BE TWO-SIDED, WHICH IS THE PART I DID NOT KNOW HOW
 * TO DO. I asked whether the probe's second half — the control proving the probe
 * can fail — has any equivalent for a static check. It does, and the control
 * does not have to be static: **feed the same checker a fixture that violates
 * the rule and assert it is rejected.** Same shape as the deploy gate's 900px
 * canary — deliberately wrong input, and the step fails if it passes.
 *
 * ── 2026-09-04: TWO CHECKS, BECAUSE THE PROPERTY HAS TWO EDGES ────────────────
 *
 * CHENG raised that the directory ban had gone over-broad: his rule was about
 * modules that COUNT, and `src/lib` had stopped being that set — six modules in
 * it produce markup. His fix was to walk the import graph down from each layer's
 * `reduce()` instead. **That is now the first check below, and it is a real
 * strengthening: it follows edges that LEAVE `src/lib`, which a per-directory
 * scan cannot see.**
 *
 * ⚠️ BUT IT DOES NOT REPLACE THE DIRECTORY BAN, AND MEASURING SAID SO. The six
 * layers' closures are ten of twenty-six modules — the layers plus `layer.js`,
 * `attribution.js`, `rink.js`, `strength.js`. Thirteen of the sixteen outside are
 * analysis too, and one of them is `census.js`, which is where every archive-wide
 * figure the site publishes is counted (`builders/measure.mjs` → `measures.json`).
 * Narrowing to the closure alone would have dropped the guard from all thirteen
 * to buy relief for six presentation modules that **do not import `rinkart.js`
 * and never asked to** — a trade of real coverage for a hypothetical.
 *
 * So the directory ban stays until a presentation module actually needs the
 * transform, and that day it gets an exemption argued on its own facts rather
 * than a rule loosened in advance. Both checks are here; each catches something
 * the other cannot; and the closure walk's control is what proves it works,
 * because **while the ban holds, the closure walk cannot go red on its own** and
 * a check with no way to fire is indistinguishable from a check that is green.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path/posix';
import { specifiers } from '../tools/jslex.mjs';

const LIB = new URL('../src/lib/', import.meta.url);
const ART = 'rinkart.js';

/** Every `.js` under `src/lib`, as paths relative to it. */
function modules(dir = LIB, base = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...modules(new URL(e.name + '/', dir), base + e.name + '/'));
    else if (e.name.endsWith('.js')) out.push(base + e.name);
  }
  return out;
}

const source = name => readFileSync(new URL(name, LIB), 'utf8');

/** A reader over the real library, for the walk below. */
const onDisk = name => { try { return source(name); } catch { return null; } };

/**
 * Every module reachable from `root` by static import, `root` included.
 *
 * `read` returns a module's source or null, so the same walk runs over the real
 * library and over a synthetic graph in the control. ⚠️ **An edge the walk cannot
 * follow is REPORTED, not skipped** — an unreadable path or a bare specifier is
 * exactly where a violation would hide, and a walk that quietly stops at one
 * reports a clean closure that is merely a short one.
 */
function closure(root, read) {
  const seen = new Set(), blind = [], stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    if (seen.has(cur)) continue;
    seen.add(cur);
    const src = read(cur);
    if (src == null) { blind.push(`${cur} (unreadable)`); continue; }
    for (const spec of specifiers(src)) {
      if (!spec.startsWith('.')) { blind.push(`${spec} (from ${cur})`); continue; }
      stack.push(join(dirname(cur), spec));
    }
  }
  return { seen, blind };
}

/**
 * The layer modules — the roots of the walk — RESOLVED BY NODE, NOT READ AS TEXT.
 *
 * ⚠️ THE FIRST DRAFT MATCHED `reduce\s*\(events` ON THE SOURCE AND FOUND TWO
 * MODULES THAT ARE NOT LAYERS. `census.js` and `archive.js` CALL `corsi.reduce(
 * events, …)` — they consume a layer rather than being one — and `archive.js`'s
 * only match was inside a comment describing where its numbers come from. Two
 * failures in one line: a declaration and a call read the same to a regex, and
 * prose reads the same as code. A layer is a thing that HAS a `reduce`, which is
 * a question about the module's exports, so it is asked of the exports.
 */
async function layers() {
  const out = [];
  for (const m of modules()) {
    const ns = await import(new URL(m, LIB));
    const isLayer = v => v && typeof v === 'object' && !Array.isArray(v)
                      && typeof v.reduce === 'function';
    if (Object.values(ns).some(isLayer)) out.push(m);
  }
  return out;
}

test('⭐⭐ nothing a layer’s reduce() can reach imports the rink art', async () => {
  const roots = await layers();
  assert.ok(roots.length >= 5, `only ${roots.length} layers found — the walk has no roots`);

  const reached = new Set(), blind = [];
  for (const r of roots) {
    const c = closure(r, onDisk);
    for (const m of c.seen) reached.add(m);
    blind.push(...c.blind);
  }

  assert.deepEqual(blind, [],
    'the import walk hit an edge it could not follow, so the closure below is a '
    + 'walk that stopped early rather than a walk that finished clean');

  assert.equal(reached.has(ART), false,
    `${ART} is reachable from a layer's reduce(). A reducer that can read screen `
    + 'coordinates is a reducer whose counts move when the rink flips — see the '
    + 'ruling at the top of src/lib/rinkart.js.');
});

test('⭐ …and a layer written anywhere is still a root', async () => {
  /* ⛔ THE ROOTS ARE DERIVED, NEVER LISTED. A hand-kept list of layer files is a
     cache of the layer set, and this repo's own finding is that a document
     quoting the system is a cache of the system. Every module carrying a
     `reduce(events…)` is a root wherever it sits, so a seventh layer is covered
     the moment it exists rather than the moment someone remembers this file. */
  const roots = await layers();
  const dir = modules().filter(m => m.startsWith('layers/'));
  assert.deepEqual(roots.filter(m => !dir.includes(m)), [],
    'a module outside src/lib/layers exports something with a reduce() — which is '
    + 'fine, and it is a root above, but say so here so the surprise is recorded '
    + 'rather than absorbed');
  assert.deepEqual(dir.filter(m => !roots.includes(m)), [],
    'a file in src/lib/layers is NOT being treated as a layer, so the walk has fewer '
    + 'roots than the directory implies');
});

test('⭐ no analysis module imports the rink art', () => {
  /* THE DIRECTORY BAN, KEPT DELIBERATELY. See the header: the layer closure is
     ten of twenty-six modules, and `census.js` — which counts every figure in
     `measures.json` — is not one of them. */
  const bad = modules()
    .filter(m => m !== ART)
    .filter(m => specifiers(source(m)).some(s => s.replace(/^.*\//, '') === ART));

  assert.deepEqual(bad, [],
    'these library modules import rinkart.js, which exports the screen transform. '
    + 'If one of them is presentation rather than analysis, that is an argument to '
    + 'make in the open — amend this check and say which module and why — not a '
    + 'rule to loosen so an import compiles.');
});

test('⭐⭐ the walk rejects a violation two modules deep', () => {
  /* THE CONTROL, AND IT IS DOING THE WHOLE JOB HERE. While the directory ban
     holds, the closure walk above can never go red on the real library, so
     nothing about it being green is evidence that it works. The graph below is
     where it is proven able to fail — and the transitive case is the one the
     per-directory scan could never see: `layers/x` imports `helper`, `helper`
     imports the transform, and neither line is a layer importing rinkart. */
  const graph = g => name => (name in g ? g[name] : null);

  const clean = {
    'layers/x.js': `import { corsiTeam } from '../attribution.js';\nexport const x = { reduce(events, ctx) { return corsiTeam(events); } };`,
    'attribution.js': `export const corsiTeam = e => e;`,
  };
  assert.equal(closure('layers/x.js', graph(clean)).seen.has(ART), false,
               'the walker flagged a clean graph, so a red result proves nothing');
  assert.deepEqual(closure('layers/x.js', graph(clean)).blind, [],
                   'the walker called a complete graph incomplete');

  const transitive = {
    'layers/x.js': `import { pos } from '../helper.js';\nexport const x = { reduce(e) { return pos(e); } };`,
    'helper.js': `import { SX } from './rinkart.js';\nexport const pos = e => SX(e.x);`,
    [ART]: `export const SX = x => 100 - x;`,
  };
  assert.equal(closure('layers/x.js', graph(transitive)).seen.has(ART), true,
    'a reducer reached the screen transform through one hop and the walk did not see it');

  /* And every spelling a direct violation could take, since the walk is only as
     good as the specifier extractor underneath it. */
  for (const line of [
    `import { SX } from '../rinkart.js';`,
    `  import { SX, SY } from '../rinkart.js';`,           // indented
    `import * as art from '../rinkart.js';`,               // namespace
    `const art = await import('../rinkart.js');`,          // dynamic
    `export { SX } from '../rinkart.js';`,                 // re-export
    `import '../rinkart.js';`,                             // side effect only
  ])
    assert.equal(closure('layers/x.js', graph({ 'layers/x.js': line, [ART]: '' })).seen.has(ART),
                 true, `the walk did not catch: ${line.trim()}`);

  /* ⛔ AND IT MUST NOT CATCH PROSE ABOUT AN IMPORT, which is not a hypothetical:
     `src/lib/marks.js` has a paragraph about importing rinkart and `rinkart.js`
     carries the ruling naming itself. A checker that reads those as code is one
     someone loosens until it stops reading real imports too. */
  for (const line of [
    `/* imported from '../rinkart.js' once, and no longer */ export const x = 1;`,
    `// do not import from '../rinkart.js'`,
    `const path = '../rinkart.js'; export const x = path.length;`,
  ])
    assert.equal(closure('layers/x.js', graph({ 'layers/x.js': line, [ART]: '' })).seen.has(ART),
                 false, `the walk false-positived on: ${line.trim()}`);
});

test('⭐ …and an edge it cannot follow is reported rather than passed', () => {
  /* A walk that silently ignores what it cannot read returns a clean closure for
     a module it never opened. Both blind spots must announce themselves: a
     missing file, and a bare specifier pointing outside this repo's zero
     dependencies. */
  const missing = closure('layers/x.js',
    n => (n === 'layers/x.js' ? `import { q } from '../gone.js';` : null));
  assert.deepEqual(missing.blind, ['gone.js (unreadable)']);

  const bare = closure('layers/x.js',
    n => (n === 'layers/x.js' ? `import { readFileSync } from 'node:fs';` : null));
  assert.deepEqual(bare.blind, ['node:fs (from layers/x.js)']);
});

test('⛔ and the transform is still exported, so this check has a subject', () => {
  /* If `SX` were ever encapsulated, this whole file would be checking a rule
     with nothing behind it — green because the danger was removed, which reads
     identically to green because the rule is held. Naming it keeps the two
     apart. Encapsulation was measured and rejected: learn-figures.mjs calls the
     transform 24 times directly. */
  assert.match(source(ART), /export const SX=/,
               'rinkart no longer exports SX — re-read the ruling');
});
