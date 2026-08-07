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
  for (const name of ['rink.js', 'attribution.js', 'layers/corsi.js', 'layers/goaltending.js']) {
    const src = read(`../src/lib/${name}`)
      .split('\n').filter(l => !l.startsWith('import ')).join('\n')
      .replace(/export /g, '').trim();
    assert.ok(app.includes(src),
      `${name} must be inlined byte-for-byte, so it cannot drift from the tested source`);
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
  assert.ok(app.includes('function lens(evs){return corsiLens(evs,CTX);}'),
    'Corsi goes through the module');
  assert.ok(app.includes('function goalieStats(evs){return goaltendingLens(evs,CTX);}'),
    'goaltending goes through the module');
  assert.ok(!/const t=\{\[HID\]:0,\[AID\]:0\}/.test(app),
    'the old inline reducer body is gone');
});

test('no ES module syntax leaks into the browser bundle', () => {
  // The modules import each other; the browser gets them concatenated. A stray
  // `import` line is a blank page, and a self-contained artifact has no console
  // anyone will see.
  assert.ok(!/^import /m.test(app), 'no import statements');
  assert.ok(!/^export /m.test(app), 'no export statements');
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
