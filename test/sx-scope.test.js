/**
 * No reducer imports the screen transform — the leading indicator for a runtime rule.
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
 * canary — deliberately wrong input, and the step fails if it passes. Without
 * it, a checker whose pattern silently stopped matching would report a clean
 * tree forever, which is this project's most-repeated failure dressed as green.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const LIB = new URL('../src/lib/', import.meta.url);

/** Every module under src/lib, except the transform's own home. */
function reducers(dir = LIB, base = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...reducers(new URL(e.name + '/', dir), base + e.name + '/'));
    else if (e.name.endsWith('.js') && base + e.name !== 'rinkart.js')
      out.push({ name: base + e.name, src: readFileSync(new URL(e.name, dir), 'utf8') });
  }
  return out;
}

/**
 * Does this source import the rink art? Matches the specifier, not the symbol,
 * because `import * as R` and `import { SX }` are the same violation and a
 * symbol scan would miss the first.
 */
const importsRinkart = src =>
  /^[ \t]*import[^;]*?from\s*['"][^'"]*rinkart(?:\.js)?['"]/m.test(src)
  || /\bimport\s*\(\s*['"][^'"]*rinkart/.test(src);

test('⭐ no module under src/lib imports the rink art', () => {
  const mods = reducers();
  assert.ok(mods.length > 20, `only ${mods.length} modules scanned — the walk is not working`);

  const bad = mods.filter(m => importsRinkart(m.src)).map(m => m.name);
  assert.deepEqual(bad, [],
    'these library modules import rinkart.js, which exports the screen transform. '
    + 'A reducer that can read screen coordinates is a reducer whose counts move '
    + 'when the rink flips — see the ruling at the top of src/lib/rinkart.js.');
});

test('⭐⭐ …and the checker rejects a module that does import it', () => {
  /* THE CONTROL. Four spellings a real violation could take, each fed to the
     same predicate. If the pattern ever stops matching — a formatter indents the
     import, someone writes a namespace import, someone uses a dynamic one — this
     goes red rather than the check above going quietly, permanently green. */
  const violations = [
    `import { SX } from './rinkart.js';`,
    `  import { SX, SY } from '../rinkart.js';`,          // indented
    `import * as art from './rinkart.js';`,               // namespace
    `const art = await import('./rinkart.js');`,          // dynamic
  ];
  for (const v of violations)
    assert.equal(importsRinkart(v), true, `the checker did not catch: ${v.trim()}`);

  /* AND IT MUST NOT CATCH WHAT IT SHOULD NOT. A check that flags everything is
     as useless as one that flags nothing, and it would make the assertion above
     pass for the wrong reason. */
  const innocent = [
    `import { NET_X } from './rink.js';`,
    `// rinkart.js owns SX, and this module deliberately does not import it`,
    `const rinkartIsNotImportedHere = true;`,
  ];
  for (const v of innocent)
    assert.equal(importsRinkart(v), false, `the checker false-positived on: ${v.trim()}`);
});

test('⛔ and the transform is still exported, so this check has a subject', () => {
  /* If `SX` were ever encapsulated, this whole file would be checking a rule
     with nothing behind it — green because the danger was removed, which reads
     identically to green because the rule is held. Naming it keeps the two
     apart. Encapsulation was measured and rejected: learn-figures.mjs calls the
     transform 24 times directly. */
  const art = readFileSync(new URL('rinkart.js', LIB), 'utf8');
  assert.match(art, /export const SX=/, 'rinkart no longer exports SX — re-read the ruling');
});
