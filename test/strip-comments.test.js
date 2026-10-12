/**
 * The built pages ship without comments; the source keeps them.
 * Kevin, 2026-10-12: comments are for the source, and ~600 KB of the game
 * page's 784 KB of script was comment shipped to every reader.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripJs, stripCss, stripHtml } from '../tools/strip-comments.mjs';

test('js: comments go, everything that only LOOKS like one stays', () => {
  const src = [
    "const a = 1; // trailing",
    "/* block */ const b = '/* not a comment */';",
    'const c = "// nor this";',
    'const d = `tmpl // ${a /* inside */ + b} /* text */`;',
    'const r = /\\/\\/[a-z]*/g;            // a regex with slashes',
    'const q = a / b / c;',
  ].join('\n');
  const out = stripJs(src);
  for (const gone of ['trailing', 'block', 'a regex with slashes'])
    assert.ok(!out.includes(gone), `"${gone}" survived`);
  for (const kept of ["'/* not a comment */'", '"// nor this"', '`tmpl // ${a /* inside */ + b} /* text */`',
                      '/\\/\\/[a-z]*/g', 'a / b / c'])
    assert.ok(out.includes(kept), `${kept} was damaged`);
});

test('js: a block comment holding a line break still separates statements', () => {
  /* Automatic semicolon insertion treats a multi-line comment as a line break;
     deleting it outright would join `x = 1` to the next line. */
  const out = stripJs('let x = 1/*\n*/let y = 2');
  assert.match(out, /1\s*\n\s*let y/);
  assert.equal(stripJs('a/**/b').replace(/\s/g, ' '), 'a b', 'two tokens must not fuse');
});

test('css: comments go, strings and urls stay', () => {
  const out = stripCss("a{color:red}/* note */b::after{content:'/* x */'}c{background:url(/*y*/)}");
  assert.ok(!out.includes('note'));
  assert.ok(out.includes("content:'/* x */'"));
});

test('html: comments go outside script and style, the email markers stay', () => {
  const html = '<p>a<!-- why -->b</p><!--email_off--><a>m</a><!--/email_off-->'
    + '<script>var s="<!-- kept -->"; // gone\n</script><style>/* gone */p{}</style>';
  const out = stripHtml(html);
  assert.ok(!out.includes('why') && !out.includes('gone'));
  assert.ok(out.includes('<!--email_off-->') && out.includes('<!--/email_off-->'),
    "Cloudflare's email protection reads these markers");
  assert.ok(out.includes('"<!-- kept -->"'));
});

test('⭐ every built page ships with no script or stylesheet comment', () => {
  for (const f of ['game.html', 'read-the-game.html', 'index.html', 'how-we-measure.html', 'calendar.html']) {
    const h = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    const scripts = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
    assert.equal(stripJs(scripts), scripts, `${f} ships script comments`);
    const css = [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
    assert.equal(stripCss(css), css, `${f} ships stylesheet comments`);
  }
});
