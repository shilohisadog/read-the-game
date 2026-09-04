/**
 * A JavaScript lexer, because `src/app.js` must never be measured by regex again.
 *
 * ⭐⭐ WHY THIS EXISTS. Until 2026-09-04 `src/app.js` was a build template, so no
 * parser could load it and every question about a 3,300-line file was answered
 * by text-matching. Four answers in one review were wrong, and the first of them
 * is the one this file is calibrated against: `(?<![.\w])i\s*=` admits a hyphen,
 * so every `data-i="${k}"` in the mark-drawing code counted as a write to the
 * playhead, and "70 write sites" became a number Kevin started designing around.
 * The playhead has two.
 *
 * The general form of that mistake -- Kevin's, and it is the sharpest sentence
 * of the review -- is that A CODEBASE THAT CAN ONLY BE ANALYSED BY REGEX WILL BE
 * ANALYSED BY REGEX, BADLY. Making the file a module removed the cause. This
 * removes the excuse.
 *
 * ⚠️ WHAT THIS IS NOT. It is a LEXER, not a parser: it answers "does this
 * identifier appear as a token here", never "what does this identifier mean".
 * It does not know scope, so it cannot tell a shadowed local from a free
 * reference, and any caller asking a question about BINDING must say so and
 * handle it. Lexical questions it answers exactly; semantic ones it must not be
 * asked. Its control lives in `test/app-imports.test.js`.
 */

const ID_START = c => /[A-Za-z_$]/.test(c);
const ID_PART = c => /[A-Za-z0-9_$]/.test(c);

/**
 * Tokens after which a `/` opens a REGEX rather than dividing.
 *
 * This is the one genuinely hard part of lexing JavaScript, and getting it
 * wrong is silent: mistake `a / b / c` for a regex and everything between the
 * slashes disappears from the token stream, taking real identifiers with it.
 */
const REGEX_OK = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'do', 'else', 'yield', 'await',
  '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*',
  '%', '<', '>', '~', '^', '=>', '&&', '||', '??', '===', '!==', '==', '!=',
]);

const THREE = ['===', '!==', '**=', '...', '&&=', '||=', '??='];
const TWO = ['=>', '&&', '||', '??', '==', '!=', '<=', '>=', '++', '--',
             '+=', '-=', '*=', '/=', '?.', '**'];

/**
 * Every identifier token in `src`, each tagged with what it is doing there.
 *
 *   {name, member, key}
 *     member — preceded by `.` or `?.`, so it is a property, not a reference
 *     key    — an object-literal key written `name:`, likewise not a reference
 *
 * Comments, string bodies, regex literals and template TEXT are dropped;
 * `${...}` inside a template is lexed as the code it is.
 */
export function lex(src) {
  const out = [];
  walk(src, t => { if (t.t === 'id') out.push({ name: t.v, member: t.member, key: t.key }); });
  return out;
}

/**
 * Every token in `src`, handed to `emit` in order. The scanner both public
 * questions are built on.
 *
 * ⭐ ONE SCANNER, TWO QUESTIONS. `lex` asks which identifiers appear; `specifiers`
 * asks which modules are imported. Both need the same hard part — knowing when a
 * `/` opens a regex, and when a quote opens a body that is not code — and written
 * twice the two would agree right up until one of them was fixed.
 *
 *   {t, v, member, key}
 *     t       'id' | 'str' | 'num' | 're' | 'op'
 *     v       the identifier name, the raw string BODY, or the operator text
 *     member  identifiers only — preceded by `.` or `?.`
 *     key     identifiers only — an object-literal key written `name:`
 */
export function walk(src, emit) {
  let prev = null;            // last significant token, for the regex/divide call
  let i = 0;
  const n = src.length;

  while (i < n) {
    const c = src[i];

    if (/\s/.test(c)) { i++; continue; }

    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2; continue;
    }

    if (c === '"' || c === "'") {
      const q = c; i++;
      const s = i;
      while (i < n && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      emit({ t: 'str', v: src.slice(s, i) });
      i++; prev = '<str>'; continue;
    }

    if (c === '`') { i = template(src, i, emit); prev = '<tmpl>'; continue; }

    if (c === '/') {
      if (prev === null || REGEX_OK.has(prev)) {
        i++;
        let inClass = false;
        while (i < n) {
          if (src[i] === '\\') { i += 2; continue; }
          if (src[i] === '[') inClass = true;
          else if (src[i] === ']') inClass = false;
          else if (src[i] === '/' && !inClass) { i++; break; }
          else if (src[i] === '\n') break;              // unterminated: not a regex
          i++;
        }
        while (i < n && /[a-z]/.test(src[i])) i++;      // flags
        emit({ t: 're' }); prev = '<re>'; continue;
      }
      i++; emit({ t: 'op', v: '/' }); prev = '/'; continue;
    }

    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      while (i < n && /[0-9a-fA-FxXoObBeE._n]/.test(src[i])) {
        if ((src[i] === 'e' || src[i] === 'E') && /[+-]/.test(src[i + 1] || '')) i++;
        i++;
      }
      emit({ t: 'num' }); prev = '<num>'; continue;
    }

    if (ID_START(c)) {
      const s = i;
      while (i < n && ID_PART(src[i])) i++;
      const name = src.slice(s, i);
      let j = i;
      while (j < n && /\s/.test(src[j])) j++;
      emit({
        t: 'id',
        v: name,
        member: prev === '.' || prev === '?.',
        // `{name: …}` and `{a, name: …}` only. Over-cautious on purpose: this
        // flag can only ever DISCARD a candidate, so a false positive costs a
        // name we would have imported and a false negative costs nothing.
        key: src[j] === ':' && (prev === '{' || prev === ','),
      });
      prev = name; continue;
    }

    const three = src.slice(i, i + 3), two = src.slice(i, i + 2);
    if (THREE.includes(three)) { i += 3; emit({ t: 'op', v: three }); prev = three; continue; }
    if (TWO.includes(two)) { i += 2; emit({ t: 'op', v: two }); prev = two; continue; }
    i++; emit({ t: 'op', v: c }); prev = c;
  }
}

/** A template literal: skip its text, walk each `${…}`. Returns the index after it. */
function template(src, i, emit) {
  const n = src.length;
  i++;                                          // past the opening backtick
  while (i < n) {
    if (src[i] === '\\') { i += 2; continue; }
    if (src[i] === '`') return i + 1;
    if (src[i] === '$' && src[i + 1] === '{') {
      const start = i + 2;
      const end = closeBrace(src, start);
      walk(src.slice(start, end), emit);
      i = end + 1; continue;
    }
    i++;
  }
  return i;
}

/** Index of the `}` closing an interpolation opened at `start`, nesting-aware. */
function closeBrace(src, start) {
  const n = src.length;
  let i = start, depth = 1;
  while (i < n && depth > 0) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return i; }
    else if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < n && src[i] !== q) { if (src[i] === '\\') i++; i++; }
    } else if (c === '`') { i = template(src, i, () => {}) - 1; }
    else if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    else if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i++;
    }
    i++;
  }
  return i;
}

/**
 * The identifier names `src` REFERENCES — member accesses and object keys removed.
 *
 * ⚠️ Still not a scope analysis: a local named `parse` and an imported `parse`
 * are one entry here. Callers that care must check for a declaration themselves.
 */
export function referenced(src) {
  const s = new Set();
  for (const t of lex(src)) if (!t.member && !t.key) s.add(t.name);
  return s;
}

/**
 * Every module specifier `src` imports — static, re-exported, or dynamic.
 *
 * ⭐⭐ WHY THIS IS NOT A REGEX, AND THE REASON IS IN THIS REPO'S OWN HISTORY.
 * The check that used this before matched `^[ \t]*import…from '…'` on raw text,
 * which is safe only by being anchored at the start of a line — and PROSE
 * IMPERSONATING CODE has broken three things here already. `src/lib/marks.js`
 * has a header paragraph about importing `rinkart.js`; `src/lib/rinkart.js`
 * carries the ruling about who may import it. A scanner that reads comments as
 * code reports those, and one loosened to stop reporting them starts missing
 * real imports. Neither failure announces itself.
 *
 * A specifier is a string literal in exactly one of three positions:
 *
 *   import … from 'x'   ·   export … from 'x'      the token before it is `from`
 *   import 'x'                                     the token before it is `import`
 *   import('x')                                    `import` then `(`
 *
 * ⚠️ STATIC ONLY, AND THAT IS A REAL LIMIT. `import(expr)` where `expr` is not a
 * literal returns nothing here, because there is nothing to return. A caller
 * building an import GRAPH must therefore treat a computed import as an edge it
 * cannot see, and say so rather than reporting a complete walk.
 */
export function specifiers(src) {
  const out = [];
  let prev = null, prev2 = null;
  const isWord = (t, w) => t && t.t === 'id' && !t.member && t.v === w;
  walk(src, t => {
    if (t.t === 'str'
        && (isWord(prev, 'from') || isWord(prev, 'import')
            || (prev && prev.t === 'op' && prev.v === '(' && isWord(prev2, 'import'))))
      out.push(t.v);
    prev2 = prev; prev = t;
  });
  return out;
}
