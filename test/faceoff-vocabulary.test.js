/* ONE WORD FOR ONE THING (Kevin, 2026-10-18): a reader meets "face-off", never
   "faceoff", and "draw" (the noun) only in the one line that teaches it. The verb
   "to draw" is fine. Code names (`faceoff`, the league's event type) are not prose. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const TEACH = /often just called the draw/;
const FACEOFF = /\bfaceoffs?\b/i;
const DRAW_NOUN = /\b(the|a|each|every|one|this|opening|first|next|restart|any) draws?\b|\b[\d,]+ draws\b|\bdraws? (won|taken|here)\b/i;

const bad = text => {
  const t = text.replace(TEACH, '');
  return [FACEOFF, DRAW_NOUN].map(re => (re.exec(t) || [])[0]).filter(Boolean);
};

test('the built pages say face-off, and draw only where it is taught', () => {
  const found = [];
  for (const f of readdirSync(new URL('src/', ROOT)).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(new URL(`src/${f}`, ROOT), 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
    for (const w of bad(text)) found.push(`${f}: "${w}"`);
  }
  assert.deepEqual(found, []);
});

test('the scripts’ prose says face-off, and never the noun draw', () => {
  const files = ['src/app.js', ...readdirSync(new URL('src/lib/', ROOT)).filter(f => f.endsWith('.js')).map(f => `src/lib/${f}`),
    ...readdirSync(new URL('src/lib/layers/', ROOT)).filter(f => f.endsWith('.js')).map(f => `src/lib/layers/${f}`)];
  const found = [];
  for (const f of files) {
    const src = readFileSync(new URL(f, ROOT), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
    // A string with a space in it is a sentence; one without is a name.
    for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) {
      const s = m[1] ?? m[2];
      if (s.includes(' ')) for (const w of bad(s)) found.push(`${f}: "${w}" in ${JSON.stringify(s.slice(0, 80))}`);
    }
  }
  assert.deepEqual(found, []);
});

test('the one teaching line is still there', () => {
  const page = readFileSync(new URL('src/faceoffs.html', ROOT), 'utf8');
  assert.match(page, TEACH);
});
