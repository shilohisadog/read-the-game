/**
 * THE RULER FOR ROW 7 — a stylesheet change that no reader can see.
 *
 *   node tools/css-noop.mjs            # rewrites src/app.css in place
 *   npm run build && npm test          # every red is off-subject, by construction
 *   git checkout src/app.css && npm run build
 *
 * ⭐ WHY THIS AND NOT THE CHURN REPLAYS. `docs/test-program.md` §8.1 replays two
 * intended changes — a period-label wording change and the `.counters` deletion —
 * and neither touches the stylesheet, so neither can measure row 7. Both also
 * need a judgement about which failures are "off-subject"; §8 says so plainly
 * ("the kinds are CC's judgement ... not checked by a second reader").
 *
 * This needs no judgement. It rewrites `a{x;y;z}` as `a{x}a{y;z}`: same selector,
 * same specificity, same cascade order, the same declarations in the same order.
 * Every element's computed style is therefore unchanged BY CONSTRUCTION, so a
 * test that goes red is red about the TEXT of the stylesheet and nothing else.
 *
 * ⚠️ TWO BUGS THIS RULER HAD FIRST, both of them the defect it exists to measure:
 *   1. `sel` is everything since the last `}`, so the first draft duplicated a
 *      closing brace and unbalanced the file — `css-parse.test.js` caught it.
 *   2. It split inside COMMENTS, inventing selectors (`.js`, `.test`) out of
 *      prose — `css-orphans.test.js` caught it. The sixth time this stylesheet's
 *      comments have been read as markup.
 * Both are recorded rather than quietly fixed: those two files are doing real
 * work, and neither is part of the 20 this measures.
 *
 * MEASURED 2026-09-20, before any migration: 292 rules split, **20 tests red
 * across 15 files**, with `css-parse` and `css-orphans` GREEN — which is the
 * evidence the rewritten sheet is well-formed and orphans nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const p = process.argv[2] || 'src/app.css';
const src = readFileSync(p, 'utf8');
const SKIP = /@(keyframes|font-face|supports|media|import|charset|property)/;
let out = '', i = 0, split = 0;
while (i < src.length) {
  const c = src.indexOf('/*', i), brace = src.indexOf('{', i);
  if (brace < 0) { out += src.slice(i); break; }
  if (c >= 0 && c < brace) {                    // a comment before the next rule
    const end = src.indexOf('*/', c + 2);
    if (end < 0) { out += src.slice(i); break; }
    out += src.slice(i, end + 2); i = end + 2; continue;
  }
  const sel = src.slice(i, brace);
  if (SKIP.test(sel)) { out += src.slice(i, brace + 1); i = brace + 1; continue; }
  const close = src.indexOf('}', brace);
  if (close < 0) { out += src.slice(i); break; }
  const body = src.slice(brace + 1, close);
  const decls = body.split(';').filter(s => s.trim());
  const name = sel.slice(sel.lastIndexOf('}') + 1).trim();
  if (decls.length >= 2 && !body.includes('{') && !body.includes('/*')
      && name && !/[}/*]/.test(name)) {
    out += `${sel}{${decls[0]}}${name}{${decls.slice(1).join(';')}}`;
    split++;
  } else out += src.slice(i, close + 1);
  i = close + 1;
}
writeFileSync(p, out);
console.log('rules split:', split);
