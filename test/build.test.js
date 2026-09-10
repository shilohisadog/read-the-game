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
import { declarations } from '../tools/jslex.mjs';

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

test('the caption precedence is stated ONCE in the shipped page', () => {
  /* ⭐⭐ THE SAME THREE ASSERTIONS AS `isNearMiss` ABOVE, FOR THE SAME REASON AND
     WITH A SHARPER ONE UNDERNEATH. Until 2026-09-04 the ladder deciding which
     sentence a frame gets lived in `render` as an `else if` chain, and
     `captioned()` held the SAME six conditions as a disjunction. Two statements
     of one rule, both shipped, and the page is only coherent while they agree:
     `dwell` reads `captioned` to decide how long a frame lasts, so a condition
     added to the ladder and forgotten in the predicate produces a caption with
     no pause behind it — a sentence gone before it can be read, which is the
     defect `docs/event-timing.md` exists about.
     So: the page delegates, the bundle carries the rule, and the bundle states
     it once. The last is the one that would have caught the old shape. */
  assert.ok(app.includes('function captioned(e){return announcement(e,rank())!==null;}'),
    'captioned() no longer asks the precedence rule — if it has grown its own copy '
    + 'of the conditions, that is the two-statements shape coming back');
  assert.match(app, /function announcement\(e, \{ isIcing, isOffside, isKill, isSlot, slotOn \}\)/,
    'the precedence rule is missing from the bundle');
  for (const [rank, once] of [['goal', /return 'goal'/g], ['penalty', /return 'penalty'/g],
                              ['icing', /return 'icing'/g], ['offside', /return 'offside'/g],
                              ['kill', /return 'kill'/g], ['slot', /return 'slot'/g]])
    assert.equal((app.match(once) || []).length, 1,
      `the shipped page decides "${rank}" in more than one place`);
  assert.ok(!/else if\(cur&&ICING\.has\(cur\)\)/.test(app),
    'the old inline caption ladder is still in the bundle');
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


/**
 * ⭐⭐ THE BUNDLE IS ONE SCOPE, AND NOTHING SAID SO.
 *
 * `_inline` strips each module's imports, drops its `export` keywords and
 * concatenates. The browser therefore does not get twenty-seven module scopes,
 * it gets ONE, and every top-level name in `src/lib` shares it. Two modules
 * declaring the same name is a live hazard with no symptom:
 *
 *   function  redeclaration is SILENT — sloppy mode and strict mode alike, the
 *             last one simply wins. Verified, not assumed.
 *   const     redeclaration is a SyntaxError, which kills the page and would
 *             take all 1,100 tests with it.
 *
 * ⭐ SO THE ONLY DANGEROUS HALF IS THE SILENT ONE, and it is exactly the half no
 * existing check can see. The loud half needs no guard: it cannot reach a
 * commit. This guard exists for the quiet one.
 *
 * ⚠️ IT HAS BITTEN ONCE ALREADY. `layers/whistle.js` declares its own `zoneOf`;
 * `census.js` grew a second one with a different signature, the later won, and
 * the fix was a rename to `attackZone`. `whistle.js` also publishes `marks`,
 * `latest`, `restarts` and `WHY` into this shared namespace — four names generic
 * enough that a new layer could plausibly reach for any of them.
 *
 * ⭐ AND THE SECOND PROPERTY IS THE ONE THAT ACTUALLY EXPLAINS A LAYER BREAKING
 * A DIFFERENT LAYER. `src/app.js` ships as a single `boot()` whose whole body is
 * written at column zero, so its 146 names are function LOCALS. A local cannot
 * overwrite a bundle name — it SHADOWS it, for the entire function, from the
 * first line. Declare `marks` anywhere inside `boot` and every caller of the
 * whistle layer's `marks` silently gets the wrong one, with no error, no throw,
 * and nothing for a `try/catch` to catch. That is the shape of the regression
 * that made a zone-start draw call guarded by `if(zoneOn)` cost the whistle
 * layer its rings.
 *
 * Both hold today (135 bundle names, 146 boot locals, 0 and 0). Five shadows
 * existed when this was written -- `ARRIVE`, `ATT`, `PLURAL`, `UNIT_PX`,
 * `figStyle`, every one a byte-identical copy of a non-exported lib internal and
 * every one DEAD, left behind when `marks.js` and `work.js` were extracted. They
 * were removed rather than allowed for: an allowlist of known collisions is the
 * pinned fixture this repo has been bitten by before.
 */
test('⭐ the declaration scanner can fail — the control for the two guards below', () => {
  const names = src => declarations(src, 0).map(d => d.name);

  /* ⚠️ THE SHAPE THAT PRODUCED A FALSE FINDING, FIRST. A line-anchored regex
     reads every column-zero declaration as top-level, and `src/app.js` writes
     its entire body at column zero INSIDE `boot` -- so that scanner reports 146
     top-level names where there is one, and a review built on it filed 31
     collisions that do not exist. Same family as the 70 write sites. */
  assert.deepEqual(names('function boot(){\nconst LENS=1;\nfunction draw(){}\n}'), ['boot'],
    'declarations at depth 0 must not include a function body, however it is indented');
  assert.deepEqual(declarations('function boot(){\nconst LENS=1;\n}', 1).map(d => d.name), ['LENS'],
    'depth 1 must reach the body — otherwise the shadow guard below is vacuous');

  // A DECLARATOR LIST DECLARES EVERY NAME IN IT. `strength.js` ships
  // `export const SKATERS_MIN = 3, SKATERS_MAX = 6;` and a scanner that takes
  // only the first name is blind to half of it.
  assert.deepEqual(names('const A = 1, B = 2;'), ['A', 'B']);
  // ...but a comma inside parens or braces declares nothing.
  assert.deepEqual(names('const f = (a, b) => a + b;'), ['f']);
  assert.deepEqual(names('const T = {a: 1, b: 2};'), ['T']);
  assert.deepEqual(names('const g = function h(){};'), ['g'],
    'a named function EXPRESSION does not declare its own name in this scope');

  // The lexer's own job: none of these are code.
  assert.deepEqual(names('/* const GHOST = 1; */\nconst real = 1;'), ['real']);
  assert.deepEqual(names('const s = "const GHOST = 1";'), ['s']);
  assert.deepEqual(names('const r = /const GHOST = 1/;'), ['r']);

  // AND THE POSITIVE DIRECTION, or the guards below pass by finding nothing.
  assert.deepEqual(names('function marks(){}\nconst latest = 1;\nclass P {}\nlet q;'),
                   ['marks', 'latest', 'P', 'q']);
});

test('⭐ no two bundled modules declare the same top-level name', () => {
  const lib = bundled();
  const owner = new Map();
  const clashes = [];
  let scanned = 0;
  for (const name of lib) {
    /* The builder's own import-stripping, because what collides is what the
       browser gets. An import binding is not a declaration in the bundle -- it
       is satisfied by the concatenation itself. */
    const src = read(`../src/lib/${name}`)
      .replace(/^[ \t]*import(?=[\s{'"*])[^;]*?;[ \t]*$/gm, '');

    /* ⚠️ THE DOCUMENTED HOLE, WATCHED RATHER THAN ASSUMED AWAY. `declarations`
       cannot see a destructured binding, because the `{` that opens it raises
       the brace depth. No LIB module has one today; the day one does, this says
       so instead of quietly under-reporting.

       ⛔ ANCHORED AT COLUMN ZERO, AND THE FIRST DRAFT WAS NOT. With `\s*` in
       front it matched `  const { ab, own, opp } = relativeTo(s, ctx);` inside a
       function in `strength.js` and reported a top-level destructure that does
       not exist -- the same over-broad-pattern failure this whole guard is
       about, committed inside the guard. Column zero is not a stylistic guess:
       `_inline` states and depends on it ("Every export in this repo is a
       declaration at column zero"). */
    assert.equal(/^(?:export )?(?:const|let|var)\s*[{[]/m.test(src), false,
      `${name} destructures at top level, which the declaration scanner cannot see`);

    for (const { name: id, kind } of declarations(src, 0)) {
      scanned++;
      if (owner.has(id)) clashes.push(`${id} (${kind}) — declared by both ${owner.get(id)} and ${name}`);
      else owner.set(id, name);
    }
  }
  assert.ok(scanned >= 120, `only ${scanned} declarations found across ${lib.length} modules — the scan has stopped seeing them`);
  assert.deepEqual(clashes, [],
    'two modules in the one browser scope declare the same name. A duplicate '
    + '`function` is silent and last-one-wins, so the loser simply stops working '
    + 'with no error anywhere — this is the `zoneOf` defect');
});

test('⭐ nothing inside boot() shadows a name the bundle declares', () => {
  const owner = new Set();
  for (const name of bundled()) {
    const src = read(`../src/lib/${name}`).replace(/^[ \t]*import(?=[\s{'"*])[^;]*?;[ \t]*$/gm, '');
    for (const d of declarations(src, 0)) owner.add(d.name);
  }
  const appSrc = read('../src/app.js');
  const ANCHOR = '\nexport function boot(';
  assert.equal(appSrc.split(ANCHOR).length - 1, 1,
    'the anchor must appear exactly once, or the wrong half of app.js is scanned');
  const shipped = appSrc.slice(appSrc.indexOf(ANCHOR));

  assert.deepEqual(declarations(shipped, 0).map(d => d.name), ['boot'],
    'the shipped half of app.js declares one name — if this changes, the depth '
    + 'the shadow scan uses is no longer the right one');

  const locals = [...new Set(declarations(shipped, 1).map(d => d.name))];
  assert.ok(locals.length >= 100, `only ${locals.length} locals found inside boot — the scan has stopped seeing them`);
  const shadows = locals.filter(n => owner.has(n)).sort();
  assert.deepEqual(shadows, [],
    'a local inside boot() has the same name as something the bundle declares. '
    + 'It shadows it for the WHOLE function from the first line, so every use of '
    + 'the library one silently becomes the local — no error, nothing to catch');
});
