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
import { whyMarkup } from '../src/lib/why.js';
import { goalieCards } from '../src/lib/goalie-card.js';

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

/* A roster field left raw inside a template that is HTML. `.nm` is a name.
   `p.n` is a jersey. A bare `.n` is also a count this page prints (`d.n`
   face-offs), so that shape is not what this looks for. Templates with no
   `<` are text, and the caller escapes those (playSaid). */
function skipString(src, j) {
  const q = src[j++];
  while (j < src.length) {
    if (src[j] === '\\') { j += 2; continue; }
    if (src[j] === q) return j + 1;
    j++;
  }
  return j;
}
function scanExpr(src, j, bad) {
  let braces = 1;
  while (j < src.length && braces) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (c === "'" || c === '"') { j = skipString(src, j); continue; }
    if (c === '`') { j = scanTemplate(src, j, bad); continue; }
    if (c === '{') braces++;
    else if (c === '}') { braces--; if (!braces) return j; }
    j++;
  }
  return j;
}
function scanTemplate(src, i, bad) {
  let j = i + 1;
  const exprs = [];
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '`') {
      if (src.slice(i, j + 1).includes('<')) {
        for (const ex of exprs) {
          const rest = ex.replace(/\bESC\s*\(\s*(?:[^()]|\([^()]*\))*\)/g, '');
          if (/\.nm\b|\bp\.n\b/.test(rest)) bad.push('${' + ex + '}');
        }
      }
      return j + 1;
    }
    if (c === '$' && src[j + 1] === '{') {
      const open = j + 2;
      const close = scanExpr(src, open, bad);
      exprs.push(src.slice(open, close));
      j = close + 1;
      continue;
    }
    j++;
  }
  return src.length;
}
function rawRosterInHtml(src) {
  const bad = [];
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '');
  for (let i = 0; i < stripped.length; i++) {
    if (stripped[i] !== '`') continue;
    i = scanTemplate(stripped, i, bad) - 1;
  }
  return bad;
}

test('⭐ a player name or jersey interpolated into HTML goes through ESC', () => {
  const files = ['src/app.js', 'src/lib/why.js', 'src/lib/goalie-card.js'];
  const bad = [];
  for (const f of files) {
    const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    for (const hit of rawRosterInHtml(src)) bad.push(`${f}: ${hit}`);
  }
  assert.deepEqual(bad, [],
    'these interpolate a roster name or jersey into HTML without ESC:\n  ' + bad.join('\n  '));

  assert.deepEqual(rawRosterInHtml('`<b>${p.nm}</b>`'), ['${p.nm}'],
    'the scan does not see a raw name');
  assert.deepEqual(rawRosterInHtml('`<b>${p.n}</b>`'), ['${p.n}'],
    'the scan does not see a raw jersey');
  assert.deepEqual(rawRosterInHtml('`<b>${ESC(p.nm)} ${ESC(p.n)}</b>`'), [],
    'the scan flags a name that is escaped');
  assert.deepEqual(rawRosterInHtml('`<b>${ESC(p.nm)} ${p.n}</b>`'), ['${p.n}'],
    'escaping the name must not hide the jersey beside it');
  assert.deepEqual(rawRosterInHtml('`${p.nm}`'), [],
    'a template with no markup is text, and this scan is not about it');
  assert.deepEqual(rawRosterInHtml('`<b>${d.n}</b>`'), [],
    'a count named n is not a jersey');
});

test('⭐ a hostile roster name cannot break out of the why-popup or a goalie card', () => {
  const name = '<img src=x onerror=alert(1)>', jersey = '1"><svg>';
  const why = whyMarkup(
    { x: -75, y: 2, own: 1, per: 1, rem: '12:00', type: 'shot-on-goal', actor: 7 },
    { dir: 1, AID: 2, AAB: 'AAA', HAB: 'H<B', AWAYCOL: '#111111', HOMECOL: '#eeeeee',
      R: { 7: { n: jersey, nm: name } } });
  assert.equal(why.includes(name), false, 'the why-popup interpolated the raw name');
  assert.equal(why.includes(jersey), false, 'the why-popup interpolated the raw jersey');
  assert.ok(why.includes(ESC(name)) && why.includes(ESC(jersey)) && why.includes(ESC('H<B')),
    'the escaped name, jersey, or club is missing from the why-popup');

  const card = goalieCards(['g'], { g: { nm: name, n: jersey, tid: 1 } },
    { g: { f: 2, s: 1, gl: 1, hf: 0, hs: 0 } },
    { AID: 2, AAB: 'AAA', HAB: 'H<B', mode: 'all situations' });
  assert.equal(card.includes(name), false, 'the goalie card interpolated the raw name');
  assert.equal(card.includes(jersey), false, 'the goalie card interpolated the raw jersey');
  assert.ok(card.includes(ESC(name)) && card.includes(ESC(jersey)) && card.includes(ESC('H<B')),
    'the escaped name, jersey, or club is missing from the goalie card');
});
