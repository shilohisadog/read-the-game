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
  for (const name of ['rink.js', 'attribution.js']) {
    const src = read(`../src/lib/${name}`).replace(/export /g, '').trim();
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
