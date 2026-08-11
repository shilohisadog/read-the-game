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

test('the shipped app carries the library verbatim, not a copy', () => {
  // Compares CONTENT, not the builder's stripping method. An earlier version
  // reproduced the builder's exact transformation, which meant it could only
  // agree with the builder rather than check it -- the same flaw as the leak
  // guard below. Here: every substantive line of the module must appear in the
  // bundle, whatever the builder did to the blank lines around it.
  const substantive = t => t
    .split('\n')
    .filter(l => l.trim() && !/^\s*import\s/.test(l))
    .map(l => l.replace(/^export /, ''));

  for (const name of ['rink.js', 'attribution.js', 'layers/corsi.js', 'layers/goaltending.js',
                      'layers/whistle.js']) {
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
  assert.ok(app.includes('marks(W,{trails:trails})'),
    'and the page asks the layer what to draw rather than deciding for itself');
  assert.ok(!/const t=\{\[HID\]:0,\[AID\]:0\}/.test(app),
    'the old inline reducer body is gone');
  // Phase 2: the ledger must be rendered FROM the ledger, not from a hand-kept
  // list of event types that can go stale when a rule changes.
  assert.ok(app.includes('summarise(L.excluded)'),
    'show-me-the-work reads the layer\'s own exclusion reasons');
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

test('the teaching label and the arithmetic agree', () => {
  // This line was true-in-intent and false-in-fact for the app's entire life:
  // it told the viewer a blocked shot counts for the shooter while the code
  // credited the blocker. It is only allowed to exist because the code now
  // matches it -- so tie the two together.
  assert.ok(app.includes('still an attempt — for the shooter'),
    'the label is present');
  assert.ok(app.includes('corsiTeam(e,R)'),
    'and Corsi resolves through the shooter, which is what makes the label true');
});
