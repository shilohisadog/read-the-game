/**
 * ⛔ NO PAGE MAY CARRY AN INLINE EVENT HANDLER, BECAUSE OUR OWN CSP FORBIDS THEM.
 *
 * `builders/page.py::csp` emits `script-src` as a SHA-256 hash of each script
 * element, with no `'unsafe-inline'` and no `'unsafe-hashes'`. A hash authorises
 * a script ELEMENT; it never authorises a handler ATTRIBUTE. So an `onclick=` in
 * generated markup is not merely unfashionable here — **it cannot run**, in any
 * browser, ever.
 *
 * ⚠️ WRITTEN BECAUSE ONE SHIPPED AND NOBODY NOTICED. The why-popup's ✕ carried
 * `onclick="hideWhy()"` for its whole life. It was dead twice over: the attribute
 * was blocked by the policy, and `hideWhy` is a local of `boot`, so the call it
 * names could not have resolved from global scope even if the policy allowed it.
 * The backdrop click still closed the popup, so nothing looked broken — a dead
 * affordance rather than a trap, which is the version that survives longest.
 * Fifth of that shape in this repo, and the second found by the headers-and-
 * stylesheet half of the program rather than by reading the script.
 *
 * ⭐ THE CHECK BELONGS ON THE ARTIFACT, NOT ON A SOURCE FILE. The handler was
 * written in `src/lib/why.js`, but it could equally come from any builder, any
 * template, or a page this test has never heard of — so what is asserted is the
 * property of every page we ship, walked from disk.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const SRC = new URL('../src/', import.meta.url);
const pages = readdirSync(SRC).filter(n => n.endsWith('.html'));

/**
 * An inline handler attribute: ` onclick="…"`, ` onmouseover='…'`.
 *
 * Anchored on the leading space and the `=` so it cannot match the words
 * `onclick` or `.onclick =` inside a script — the page's own JavaScript assigns
 * `.onclick` properties all over, and those are fine: they are set by hashed
 * script, not parsed as attributes.
 */
const INLINE = /\s(on[a-z]{2,})\s*=\s*["']/g;

test('⛔ no built page carries an inline event handler', () => {
  assert.ok(pages.length > 8, `only ${pages.length} pages found — the walk is not working`);

  const found = [];
  for (const name of pages) {
    const html = readFileSync(new URL(name, SRC), 'utf8');
    for (const m of html.matchAll(INLINE)) {
      const at = html.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, ' ');
      found.push(`${name}: ${m[1]}=  …${at}…`);
    }
  }
  assert.deepEqual(found, [],
    'these pages carry inline event handlers, which our own Content-Security-Policy '
    + 'blocks — `script-src` is a script hash with no \'unsafe-hashes\', so the handler '
    + 'never runs and the control it is attached to does nothing at all:\n  '
    + found.join('\n  '));
});

test('⭐⭐ …and the scan really matches one when it is there', () => {
  /* THE CONTROL. A pattern that quietly stopped matching would report a clean
     tree forever, which is the failure this repo has shipped more than any other.
     Four spellings a real handler takes, and three innocent lines it must not
     flag — `.onclick =` in script is how this page legitimately binds. */
  const bad = [
    '<button onclick="hideWhy()">x</button>',
    "<a onmouseover='go()'>x</a>",
    '<div  onkeydown = "k()" >',
    '<button\n  onclick="f()">',
  ];
  for (const s of bad)
    assert.equal([...s.matchAll(INLINE)].length, 1, `the scan missed: ${s.trim()}`);

  const ok = [
    "$('play').onclick=()=>step(1);",
    'el.addEventListener("click", hideWhy);',
    '<span class="lononce">a word that starts with on</span>',
  ];
  for (const s of ok)
    assert.equal([...s.matchAll(INLINE)].length, 0, `the scan false-positived on: ${s.trim()}`);
});
