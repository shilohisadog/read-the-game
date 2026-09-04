/**
 * The HTML escaper, which had no test of its own until 2026-09-04.
 *
 * ⚠️ IT WAS A ONE-LINE LOCAL INSIDE `boot`, USED THIRTY TIMES, ON A PAGE THAT
 * RENDERS STRINGS THE LEAGUE CONTROLS. Player names, penalty descriptions and
 * club names all reach `innerHTML` through it. Nothing had ever asserted it
 * escapes anything — the only coverage was incidental, through pages that
 * happened to render a string with no special character in it.
 *
 * It surfaced while scoping the work panel's extraction: the first thing that had
 * to move was not the cluster but this, because every markup module extracted
 * from `boot` needs it and passing an escaper as a parameter makes a primitive
 * into an argument.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ESC } from '../src/lib/esc.js';

test('⭐ the four characters that can break out of markup are escaped', () => {
  assert.equal(ESC('<script>'), '&lt;script&gt;');
  assert.equal(ESC('a & b'), 'a &amp; b');
  assert.equal(ESC('say "hi"'), 'say &quot;hi&quot;');
  assert.equal(ESC('<img src="x" onerror="alert(1)">'),
               '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
});

test('⭐ the ampersand is escaped FIRST, so nothing is double-escaped by ordering', () => {
  /* A replacement that handled `<` before `&` would turn `<` into `&lt;` and then
     that `&` into `&amp;lt;`. One pass over a character class cannot make that
     mistake, and this is the assertion that says so rather than trusting it. */
  assert.equal(ESC('&lt;'), '&amp;lt;');
  assert.equal(ESC('a<b&c>d'), 'a&lt;b&amp;c&gt;d');
});

test('⭐ it coerces, because the page hands it whatever the feed had', () => {
  /* `String(s)` is load-bearing: an event field that is missing arrives as
     `undefined` and a bare `.replace` would throw mid-render, taking the frame
     with it. Rendering the word is ugly; a blank page is worse. */
  assert.equal(ESC(undefined), 'undefined');
  assert.equal(ESC(null), 'null');
  assert.equal(ESC(34), '34');
});

test('⭐ ordinary text is returned untouched', () => {
  /* An escaper that mangled normal strings would be caught by every page test,
     but stating it here means the character class can be widened deliberately
     rather than by accident. */
  for (const s of ['Eriksson Ek', "O'Reilly", 'Tripping', '5-on-4', 'é ü ø'])
    assert.equal(ESC(s), s);
});

test('⛔ the apostrophe is NOT escaped, and that is a constraint on every caller', () => {
  /* `&#39;` only matters inside a single-quoted attribute. Every attribute this
     project emits is double-quoted, so escaping it would be noise in thirty
     places to guard a shape we do not write. But the constraint is real, and an
     unstated constraint is one somebody breaks — so it is stated here and
     enforced by the test below. */
  assert.equal(ESC("O'Reilly"), "O'Reilly");
});

test('⭐⭐ …and no call site puts escaped text inside a single-quoted attribute', () => {
  /* THE HALF THAT MAKES THE CONSTRAINT REAL. The test above documents a gap; this
     one asserts the gap is not reachable. Without it, "we only write
     double-quoted attributes" is a habit rather than a property — the same
     distinction that made CHENG demand `SX` be unreachable rather than unused. */
  const files = ['src/app.js', ...readdirSync(new URL('../src/lib/', import.meta.url))
    .filter(n => n.endsWith('.js')).map(n => `src/lib/${n}`)];
  assert.ok(files.length > 20, `only ${files.length} files scanned — the walk is broken`);

  /* `attr='${ESC(x)}'` and `attr='" + ESC(x) + "'` — an ESC call opening inside a
     single-quoted attribute value. */
  const UNSAFE = /=\s*'[^']*\$\{[^}]*\bESC\s*\(/;
  const bad = files.filter(f => UNSAFE.test(readFileSync(new URL('../' + f, import.meta.url), 'utf8')));
  assert.deepEqual(bad, [],
    'these files interpolate escaped text into a SINGLE-quoted attribute, where ESC does not '
    + 'protect it — an apostrophe in a player or team name would close the attribute early:\n  '
    + bad.join('\n  '));

  // The scan must be able to see one.
  assert.equal(UNSAFE.test(`<b title='${'${ESC(name)}'}'>`), true,
               'the single-quote scan does not detect the shape it exists to forbid');
  assert.equal(UNSAFE.test('<b title="${ESC(name)}">'), false,
               'the scan flags a double-quoted attribute, which is the safe and normal case');
});
