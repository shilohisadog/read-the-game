/**
 * THE MUTATION ENGINE'S BOOKKEEPING — the parts that decide which recorded defect
 * lands on which token of today's code, and what counts as caught.
 *
 * A relocation that is off by one line plants a DIFFERENT defect and reports it
 * under the old one's name, and the paired comparison (caught then, caught now)
 * would silently compare two experiments. So the line map is checked against git
 * itself, not only against diffs written by hand.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mapLine, lineCol, outcome, failingFiles, compare } from '../tools/mutate.mjs';

test('an untouched line keeps its number above every hunk, and moves by the net size below', () => {
  const diff = '@@ -5,2 +5,4 @@\n-x\n-y\n+x\n+y\n+z\n+w\n';
  assert.equal(mapLine(diff, 4), 4);
  assert.equal(mapLine(diff, 5), null, 'a changed line is gone');
  assert.equal(mapLine(diff, 6), null);
  assert.equal(mapLine(diff, 7), 9, 'two lines became four, so everything below moves down two');
});

test('the line map agrees with git on insertions, deletions and changes — every line of a real diff', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mutate-map-'));
  try {
    const old = Array.from({ length: 40 }, (_, k) => `line ${k + 1}`);
    const now = [...old];
    now.splice(30, 3);                        // delete old 31-33
    now.splice(20, 1, 'changed 21');          // change old 21
    now.splice(10, 0, 'new A', 'new B');      // insert after old 10
    now.splice(0, 0, 'new top');              // insert before old 1
    writeFileSync(join(dir, 'a'), old.join('\n') + '\n');
    writeFileSync(join(dir, 'b'), now.join('\n') + '\n');
    let diff = '';
    try { execFileSync('git', ['diff', '--no-index', '-U0', 'a', 'b'], { cwd: dir }); }
    catch (e) { diff = e.stdout.toString(); }         // exit 1 means "they differ"
    assert.match(diff, /^@@/m, 'git produced no hunks — this test would check nothing');
    // The second path: where each old line's TEXT actually is in the new file.
    for (let k = 1; k <= old.length; k++) {
      const want = now.indexOf(old[k - 1]);
      assert.equal(mapLine(diff, k), want < 0 ? null : want + 1, `old line ${k} ("${old[k - 1]}")`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('columns are counted in the units each language recorded: UTF-16 for JavaScript, code points for Python', () => {
  const src = 'é🏒\nab<c';
  assert.deepEqual(lineCol('js', src, src.indexOf('<')), [2, 2]);
  assert.deepEqual(lineCol('py', src, [...src].indexOf('<')), [2, 2]);
  assert.notEqual(src.indexOf('<'), [...src].indexOf('<'), 'the sample has no astral character, so the two units agree and this proves nothing');
});

test('caught means a build or a real test — never the DOM golden alone, and never a gate', () => {
  assert.equal(outcome({ build: 0, js: 1, jsFail: ['dom-golden.test.js'] }), 'change-detector');
  assert.equal(outcome({ build: 0, js: 1, jsFail: ['dom-golden.test.js', 'layers.test.js'] }), 'suite');
  assert.equal(outcome({ build: 2, js: 0, jsFail: [] }), 'build-error');
  assert.equal(outcome({ build: 0, js: 0, jsFail: [], py: 0, extract_verify: 0, extract_validate: 1, extract_vocab: 0 }), 'extract-gate');
  assert.equal(outcome({ build: 0, js: 0, jsFail: [], py: 1 }), 'suite');
  assert.equal(outcome({ build: 0, js: 0, jsFail: [] }), 'not-caught');
  // A red suite whose failing file could not be read is still red.
  assert.equal(outcome({ build: 0, js: 1, jsFail: [] }), 'suite');
});

test('failing test files are read from the runner output', () => {
  const out = "not ok 3 - x\n  location: '/w/test/layers.test.js:12:1'\nnot ok 4\n  location: '/w/test/dom-golden.test.js:9:1'\n  location: '/w/test/layers.test.js:40:1'";
  assert.deepEqual(failingFiles(out), ['layers.test.js', 'dom-golden.test.js']);
});

test('the comparison is PAIRED: a lost catch names the mutant, and a gone mutant is not counted as either', () => {
  const rel = [
    { id: 'a', pop: 'display', status: 'same', file: 'f', line: 1, from: '<', to: '<=', was: { final: 'suite', jsFail: ['x.test.js'] } },
    { id: 'b', pop: 'display', status: 'gone', file: 'f', from: '+', to: '-', was: { final: 'suite', jsFail: [] } },
    { id: 'c', pop: 'display', status: 'moved', file: 'f', line: 9, from: '1', to: '0', was: { final: 'no-observable', jsFail: [] } },
  ];
  const res = [{ id: 'a', outcome: 'not-caught', jsFail: [] }, { id: 'c', outcome: 'suite', jsFail: ['y.test.js'] }];
  const t = compare(rel, res).display;
  assert.equal(t.n, 3); assert.equal(t.gone, 1); assert.equal(t.applicable, 2);
  assert.equal(t.caughtBefore, 1); assert.equal(t.caughtNow, 1);
  assert.deepEqual(t.lost.map(x => x.id), ['a']);
  assert.deepEqual(t.gained.map(x => x.id), ['c']);
});
