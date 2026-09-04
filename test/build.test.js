/**
 * Does the fix actually reach the thing people open?
 *
 * The module tests prove the reducers are right. They say nothing about whether
 * the built app uses them -- and this project has already shipped a builder that
 * ran clean while writing nothing at all. So pin the artifact too.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const app = read('../src/read-the-game.html');


/** The modules the browser actually receives, read from the builder rather than typed. */
function bundled() {
  const py = read('../builders/build_main.py');
  const block = /^LIB = \[([\s\S]*?)\]/m.exec(py);
  assert.ok(block, 'LIB has moved or changed shape in build_main.py');
  const lib = [...block[1].matchAll(/"([^"]+\.js)"/g)].map(m => m[1]);
  assert.ok(lib.length >= 15, `LIB lists only ${lib.length} modules`);
  return lib;
}

test('the shipped app carries the library verbatim, not a copy', () => {
  // Compares CONTENT, not the builder's stripping method. An earlier version
  // reproduced the builder's exact transformation, which meant it could only
  // agree with the builder rather than check it -- the same flaw as the leak
  // guard below. Here: every substantive line of the module must appear in the
  // bundle, whatever the builder did to the blank lines around it.
  /* ⚠️ AN IMPORT CAN SPAN LINES, and the first version of this filter only
     dropped the line that STARTS one. `rinkart.js` wraps its import of the rink
     constants across two lines, so the continuation survived the filter and was
     demanded of a bundle that correctly does not contain it — a false failure
     the moment this test was widened past its five hand-picked modules.

     ⭐ IT IS A LINE STATE MACHINE, NOT THE BUILDER'S REGEX, on purpose. This
     test exists to CHECK the builder, and an earlier version of it reproduced
     the builder's exact transformation, which meant it could only ever agree
     with it. Two implementations of "what is an import statement" is the point
     here, not the defect. */
  const substantive = t => {
    const out = [];
    let inImport = false;
    for (const l of t.split('\n')) {
      if (inImport) { if (l.includes(';')) inImport = false; continue; }
      if (/^\s*import\s/.test(l)) { if (!l.includes(';')) inImport = true; continue; }
      if (l.trim()) out.push(l.replace(/^export /, ''));
    }
    return out;
  };

  /* ⚠️ EVERY BUNDLED MODULE, NOT FIVE OF THEM — AND THE SAMPLE COST US ONE.
     This test named five modules by hand, and on 2026-09-04 the builder was found
     to be deleting the word "export" from PROSE: `_inline` used a blanket
     `replace("export ", "")`, and `rinkart.js` says "the obvious alternative --
     export only drawing functions" in a comment. The page shipped that sentence
     with the word missing, for as long as the comment had existed.

     This check would have caught it on the first build. It did not, because
     `rinkart.js` was not one of the five. ⭐ A RULE DERIVED FROM A SAMPLE IS
     STILL A SAMPLE — the repo's own §5, and the sample here was a list somebody
     typed. The list is read from the builder now, so a module added to the
     bundle is covered the moment it is added. */
  for (const name of [...bundled(), 'rinkart.js']) {
    for (const line of substantive(read(`../src/lib/${name}`))) {
      assert.ok(app.includes(line),
        `${name}: line missing from the bundle, so the shipped code has drifted `
        + `from the tested source -> ${line.trim().slice(0, 60)}`);
    }
  }
});

test('neither defect can reappear in the shipped app', () => {
  assert.ok(!app.includes('HID+AID-e.own'),
    'the blocked-shot attribution flip is gone');
  assert.ok(!app.includes('89-Math.abs(e.x)'),
    'the nearer-net distance bug is gone, including inside the why-popup');
});

test('the app reduces through the extracted modules, not a copy', () => {
  // Phase 1's whole point. If someone reinlines a reducer here, the golden test
  // keeps passing -- it tests the modules -- while the app quietly diverges.
  assert.ok(app.includes('function lens(k){return corsi.reduce(upto(k),CTX);}'),
    'Corsi goes through the layer');
  assert.ok(app.includes('function goalieStats(k){return goaltending.reduce(upto(k),CTX).g;}'),
    'goaltending goes through the layer');
  assert.ok(app.includes('drawWhistles(whistle.reduce(upto(i),CTX))'),
    'the whistle layer goes through the layer, on the full stream');
  // The GROUPING is the layer's, not the page's. A mark on the wrong dot is the
  // kind of wrong that looks completely right, so the rule that decides where
  // marks go must be the one test/whistle.test.js exercises.
  assert.ok(app.includes('marks(W,{trails:trails,dir:DIR})'),
    'and the page asks the layer what to draw rather than deciding for itself');
  assert.ok(!/const t=\{\[HID\]:0,\[AID\]:0\}/.test(app),
    'the old inline reducer body is gone');
  // Phase 2: the ledger must be rendered FROM the ledger, not from a hand-kept
  // list of event types that can go stale when a rule changes.
  /* ⭐ THE PAGE ASKS THE LAYER HOW TO GROUP. It now groups the NEAR-MISSES --
     the exclusions a viewer could plausibly have expected to count -- and
     collapses the rest to a count, so the argument is `near` rather than
     `L.excluded`. The claim is unchanged: the reasons come from the ledger and
     the grouping from `layer.js`, never from a list kept in the renderer. */
  assert.ok(app.includes('summarise(near)'),
    'show-me-the-work reads the layer\'s own exclusion reasons');
  /* ⭐ AND THE SPLIT IS THE LIBRARY'S RULE, NOT THE PAGE'S. This used to pin the
     predicate's text inside `renderWork`, which is where it was written — and
     it was written a SECOND time in test/lbox.test.js, so the page and the
     check guarding it could drift. `isNearMiss` lives in layer.js now, and the
     three assertions are: the page delegates, the bundle carries the library's
     definition, and there is exactly ONE statement of it in the shipped bytes. */
  assert.ok(app.includes('const isNear=isNearMiss;'),
    'the near-miss split is not made from the reducer\'s own dimensions');
  assert.match(app, /const isNearMiss = x =>\s*!x\.dims\?\.type && Object\.keys/,
    'the library rule is missing from the bundle, or `type` no longer disqualifies');
  assert.equal((app.match(/Object\.keys\(x\.dims/g) || []).length, 1,
    'the near-miss rule is stated more than once in the shipped page');
  assert.ok(!/exL=\{hit:/.test(app),
    'the hardcoded exclusion labels are gone');
});

test('no ES module syntax leaks into the browser bundle', () => {
  // The modules import each other; the browser gets them concatenated. A stray
  // `import` line is a blank page, and a self-contained artifact has no console
  // anyone will see.
  // NOT anchored to line start. The previous version was `/^import /m`, which
  // encoded the SAME assumption as the builder's stripper -- column zero plus a
  // trailing space -- so it could only fail on inputs the builder already
  // handled. An indented import passed both. A test that shares an assumption
  // with its subject tests the assumption once, not twice.
  assert.ok(!/\bimport\s*[{'"(*]/.test(app), 'no import statements, indented or otherwise');
  assert.ok(!/\bexport\s+(default|const|function|class|\{)/.test(app), 'no export statements');
});

test('the app no longer tells the viewer we flip blocked-shot attribution', () => {
  // This copy survived the code fix by three commits: "The feed credits the
  // blocker; we flip it." The feed credits the SHOOTER and we flip nothing.
  // A wrong explanation beside a right number is the failure this project
  // exists to avoid, so it gets a test rather than a careful reading.
  assert.ok(!app.includes('we flip it'), 'the false method claim is gone');
  assert.ok(!/feed credits the blocker/i.test(app), 'and so is its premise');
});

test('the teaching claim and the arithmetic agree', () => {
  // This claim was true-in-intent and false-in-fact for the app's entire life:
  // it told the viewer a blocked shot counts for the shooter while the code
  // credited the blocker, and it shipped a wrong flagship number. It is only
  // allowed to exist because the code now matches it -- so tie the two together.
  //
  // IT MOVED SURFACES ON 2026-08-16 and this test moved with it. The claim used
  // to be a second line on the ice ("still an attempt — for the shooter") and
  // went when Kevin retired the ice subtext; it lives in the work panel now.
  // The SAFEGUARD is not about a surface -- it is that the page must not tell a
  // reader how attribution works while the reducer does something else -- so what
  // this test follows is the sentence, wherever the sentence is.
  assert.ok(app.includes('All credited to the shooter.'),
    'nothing on the page still tells the reader who a blocked attempt belongs to');
  assert.ok(app.includes('corsiTeam(e,R)'),
    'and Corsi resolves through the shooter, which is what makes the claim true');
});

/**
 * ⭐⭐ THE BUNDLE'S MODULE ORDER IS A HAND-WRITTEN LIST, AND NOTHING DERIVED IT.
 *
 * `build_main.py` builds the browser bundle by regex-stripping `import`/`export`
 * and concatenating `LIB` in order. So the app's real dependency graph exists
 * only as that Python list — `src/app.js` has ZERO imports and ZERO exports, and
 * every JavaScript tool inherits the blindness: madge reports eleven of these
 * modules as orphans, knip reports thirteen live exports as unused, and node's
 * coverage cannot see app.js at all.
 *
 * ⚠️ WHICH MAKES `LIB` THE SHAPE THIS PROJECT CONDEMNS IN ITS OWN WORDS —
 * `derive.yml`: *"an enumeration is a list somebody has to remember to extend"*.
 * Its ordering constraints are maintained by comments (*"AFTER rink.js, which
 * owns BLUE_LINE_X"*) and its only alarm is a runtime failure somewhere else:
 * build_main.py's own note records a module being added to LIB and
 * `render-ends.test.js` breaking as a result.
 *
 * ⭐ THE FIX ALREADY EXISTS ONE FILE OVER. `measure.test.js` walks the real
 * import graph and asserts its hand-written `TIER` list is complete — a guard
 * that has caught staleness FIVE times, each time in the same edit that changed
 * the graph. This is that guard for `LIB`, and it derives both properties rather
 * than restating them:
 *
 *   CLOSURE  — every module a LIB member imports is itself in LIB, or the
 *              browser gets a bundle referring to something that is not there.
 *   ORDER    — a dependency is concatenated BEFORE its dependent. Function
 *              declarations hoist and would survive a wrong order; a top-level
 *              `const` does not, which is exactly what the BLUE_LINE_X comment
 *              is hand-maintaining.
 *
 * Both hold today (25 edges, 0 violations). Nothing was broken; the invariant
 * was simply un-instrumented, which is how this project has been bitten before.
 */
test('⭐ the bundle list is closed and ordered, derived from the real imports', () => {
  const py = read('../builders/build_main.py');
  const block = /^LIB = \[([\s\S]*?)\]/m.exec(py);
  assert.ok(block, 'LIB has moved or changed shape in build_main.py');
  const lib = [...block[1].matchAll(/"([^"]+\.js)"/g)].map(m => m[1]);
  assert.ok(lib.length >= 15, `LIB lists only ${lib.length} modules`);
  const pos = new Map(lib.map((n, i) => [n, i]));

  // posix-normalise a specifier against its importer's own directory, so
  // `layers/danger.js` importing '../rink.js' resolves to `rink.js`.
  const resolve = (from, spec) => {
    const parts = from.split('/').slice(0, -1).concat(spec.split('/'));
    const out = [];
    for (const p of parts) {
      if (p === '.' || p === '') continue;
      if (p === '..') out.pop(); else out.push(p);
    }
    return out.join('/');
  };

  let edges = 0;
  const missing = [], disordered = [];
  for (const name of lib) {
    const src = read(`../src/lib/${name}`);
    for (const m of src.matchAll(/^\s*import[^;]*?from\s+'([^']+)'/gm)) {
      const dep = resolve(name, m[1]);
      if (!pos.has(dep)) { missing.push(`${name} imports ${dep}, which LIB does not carry`); continue; }
      edges++;
      if (pos.get(dep) > pos.get(name))
        disordered.push(`${name} (#${pos.get(name)}) needs ${dep} (#${pos.get(dep)}), which is concatenated AFTER it`);
    }
  }
  assert.ok(edges >= 20, `only ${edges} import edges found — the parse has stopped seeing them`);
  assert.deepEqual(missing, [],
    'the browser bundle would reference a module it does not contain');
  assert.deepEqual(disordered, [],
    'a module is concatenated before something it depends on — a top-level const '
    + 'would be undefined at load, and only a hoisted function would survive it');
});
