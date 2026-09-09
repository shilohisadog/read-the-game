/**
 * ⛔ A STYLESHEET THAT DOES NOT PARSE LOSES A RULE, AND THE PAGE STILL RENDERS.
 *
 * On 2026-08-17 `d401e68` removed the three-point scale from the home page. The
 * deletion was line-based and four of those rules were written across two lines,
 * so their FIRST lines went and their continuations stayed:
 *
 *     /* …the number is the claim. *\/
 *      gap:2px 12px;align-items:baseline}
 *      white-space:nowrap;flex-shrink:0}
 *
 * ⭐ WHAT THAT COSTS IS NOT THE ORPHANS — IT IS THE NEXT REAL RULE. A CSS parser
 * meeting declarations at the top level starts a qualified rule and consumes
 * everything until it finds a `{`. The next `{` in the file belonged to
 * `.hero`, so the browser built one rule whose selector was
 * `gap:2px 12px;…} … .hero`, found it invalid, and dropped it. **The home page's
 * hero card had no background, border, radius, padding or shadow on the live
 * site for twenty-three days**, and every one of 1,100 tests stayed green,
 * because the markup, the classes and the declarations were all still there —
 * only the parse was broken.
 *
 * ⚠️ AND `css-orphans.test.js` COULD NOT SEE IT. That test asks whether a class
 * in a rule is one the page can produce. Here the classes were fine and the
 * SELECTORS were missing, which is the opposite defect. The pair is the point:
 * one checks that every rule describes the page, this one checks that every rule
 * is a rule.
 *
 * It was found by asking a browser for `document.styleSheets[1].cssRules` while
 * building something else — not by any check in this repo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const SRC = new URL('../src/', import.meta.url);
const PAGES = readdirSync(SRC).filter(f => f.endsWith('.html')).sort();

/** Comments removed the way a CSS parser removes them: a scan, and no nesting.
 *  A regex here is not good enough — `/\*[\s\S]*?\*\/` pairs delimiters greedily
 *  across a malformed file and reports damage in the wrong place, which is what
 *  the first draft of this did. */
function stripComments(css) {
  let out = '', i = 0;
  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      const j = css.indexOf('*/', i + 2);
      i = j === -1 ? css.length : j + 2;
    } else { out += css[i++]; }
  }
  return out;
}

const sheetsOf = html => [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);

test('⭐ every stylesheet this site ships parses — braces balance and never go negative', () => {
  assert.ok(PAGES.length >= 10, `only ${PAGES.length} pages found`);
  const bad = [];
  for (const page of PAGES) {
    const sheets = sheetsOf(readFileSync(new URL(page, SRC), 'utf8'));
    assert.ok(sheets.length > 0, `${page} ships no stylesheet at all`);
    for (const [n, sheet] of sheets.entries()) {
      const css = stripComments(sheet);
      let depth = 0, floor = 0;
      for (const ch of css) {
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; floor = Math.min(floor, depth); }
      }
      // A NEGATIVE FLOOR IS THE STRAY `}` — the shape that actually shipped.
      // A NON-ZERO END is an unclosed block, which swallows every rule after it.
      if (floor < 0) bad.push(`${page} sheet ${n}: ${-floor} stray closing brace(s)`);
      if (depth !== 0) bad.push(`${page} sheet ${n}: ends ${depth} block(s) open`);
    }
  }
  assert.deepEqual(bad, [], `stylesheets that do not parse:\n${bad.join('\n')}`);
});

test('⭐ …and no rule’s selector is a declaration — the half that names the defect', () => {
  /* THE BALANCE CHECK ALONE IS NOT ENOUGH. Delete the selector of a rule written
     on ONE line and the braces still balance perfectly — the orphan is a complete
     `{…}` block with nothing, or a declaration, for a prelude, and the parser
     still eats the rule that follows. So this asks the question directly: every
     prelude is a SELECTOR, and a selector is never empty and never contains a
     semicolon.

     ⚠️ THE FIRST DRAFT OF THIS TEST DID NOT DO WHAT THIS PARAGRAPH SAYS. It
     checked `prelude.includes(';')` only, at depth 0 only — so `{background:…}`,
     the one-line case the paragraph is about, sailed through it, and so would any
     selector-less rule inside an `@media`. Caught by mutating for it rather than
     by reading, which is §H1 in `docs/status.md`: name the path from the code to
     the expected value, and if the only path is the one you had in mind, the
     check is a mirror of your intention. */
  const bad = [];
  for (const page of PAGES) {
    for (const [n, sheet] of sheetsOf(readFileSync(new URL(page, SRC), 'utf8')).entries()) {
      const css = stripComments(sheet);
      let preludeStart = 0;
      for (let i = 0; i < css.length; i++) {
        if (css[i] === '{' || css[i] === '}') {
          if (css[i] === '{') {
            const prelude = css.slice(preludeStart, i).trim();
            // An at-rule's prelude (`@media (min-width:700px)`) is a selector for
            // this purpose: non-empty, and no semicolon.
            if (!prelude || prelude.includes(';'))
              bad.push(`${page} sheet ${n}: "${(prelude || '<empty>').replace(/\s+/g, ' ').slice(0, 70)}"`);
          }
          preludeStart = i + 1;
        }
      }
    }
  }
  assert.deepEqual(bad, [], `a rule has no selector, or a declaration is being read as one:\n${bad.join('\n')}`);
});
