/**
 * ⭐⭐ TWO CONVENTIONS A COLD READER CANNOT GUESS, AND BOTH WERE UNDOCUMENTED.
 *
 * Kevin set the gate: *"what would a cold reader of the repo think of our
 * artifacts?"* Walking the entry path a stranger takes — README, `docs/README.md`,
 * `architecture.md`, `CONTRIBUTING.md` — turned up two things used constantly and
 * explained nowhere:
 *
 * - **`CHENG` appears in 40 documents and `Kevin` in 37**, neither introduced. A
 *   reader hitting *"CHENG's ruling on as-played ends"* in the architecture file
 *   cannot tell whether that is a colleague, a consultant, a standard or a tool.
 * - **The ⭐/⚠️/⛔/✅ glyphs are used about 1,800 times** across comments and
 *   documents, and nothing said what they mean.
 *
 * Neither was a code defect and both are legibility defects, which for a project
 * whose entire pitch is *check our work* is the same thing.
 *
 * ⭐ THE SECOND TEST IS THE ONE WORTH HAVING. A legend that merely exists rots
 * the moment a fifth convention appears, and a fifth convention is exactly what a
 * reader cannot guess. So the glyphs actually in use are COUNTED and any of them
 * used more than the threshold must be in the table.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), 'utf8');

/**
 * More than forty uses makes a glyph a convention rather than a flourish.
 *
 * ⭐ NOT A TUNED NUMBER, AND THAT MATTERS HERE. The four documented marks are
 * used 1,020 / 531 / 141 / 79 times; the next glyph in the repo is used 16. The
 * threshold sits inside a fivefold gap, so it is a description of the data
 * rather than a constant somebody chose — which is the difference between a
 * definition and a knob, and this project has a rule about the difference.
 */
const CONVENTION_AT = 40;

/** Emoji and dingbats, with the variation selector folded away. */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu;
/** JS block comments, JS line comments, Python line comments. */
const COMMENT = /\/\*[\s\S]*?\*\/|^[ \t]*\/\/.*|^[ \t]*#.*/gm;

function walk(dir, out = []) {
  for (const e of readdirSync(new URL(dir + '/', ROOT))) {
    if (e === 'node_modules' || e === '.git' || e === '__pycache__') continue;
    const rel = `${dir}/${e}`;
    if (statSync(new URL(rel, ROOT)).isDirectory()) walk(rel, out);
    else if (/\.(js|mjs|py|md)$/.test(e)) out.push(rel);
  }
  return out;
}

test('⭐ the people in the design record are introduced somewhere', () => {
  const index = read('docs/README.md');
  const block = /<!-- people: legend -->([\s\S]*?)<!-- \/people -->/.exec(index);
  assert.ok(block, 'docs/README.md no longer introduces the names its documents argue between');

  for (const who of ['Kevin', 'CHENG'])
    assert.match(block[1], new RegExp(`\\*\\*${who}\\*\\*`),
                 `${who} is named in the design record and no longer introduced in its index`);

  /* ⛔ THE CORRELATION CAVEAT IS PART OF THE INTRODUCTION, NOT A FOOTNOTE.
     Describing CHENG as an adversarial reviewer without saying that reviewer
     shares a base model with the author would overstate the independence of
     every ruling recorded in these documents. */
  assert.match(block[1], /same base model/,
    'the CHENG entry no longer says the reviewer and the author share a base model, '
    + 'which is what stops a reader reading agreement between them as corroboration');
});

test('⭐⭐ every glyph used as a convention is in the legend', () => {
  const legend = /<!-- marks: legend -->([\s\S]*?)<!-- \/marks -->/.exec(read('CONTRIBUTING.md'));
  assert.ok(legend, 'CONTRIBUTING.md no longer defines the marks');
  const defined = new Set([...legend[1].matchAll(EMOJI)].map(m => m[0]));
  assert.ok(defined.size >= 3, `only ${defined.size} marks defined — the legend is not being read`);

  const counts = new Map();
  const files = ['src', 'builders', 'test', 'tools', 'docs'].flatMap(d => walk(d));
  assert.ok(files.length > 100, `only ${files.length} files walked — the scan is broken`);

  for (const f of files) {
    let text = read(f);
    /* ⭐ CODE IS SCANNED AS COMMENTS ONLY. The why-popup's markup contains 🚨 and
       the rink draws other glyphs; those are CONTENT, not annotation, and a scan
       that counted them would demand the legend define the page's own emoji. */
    if (!f.endsWith('.md')) text = (text.match(COMMENT) || []).join('\n');
    for (const m of text.matchAll(EMOJI)) counts.set(m[0], (counts.get(m[0]) || 0) + 1);
  }

  const undocumented = [...counts]
    .filter(([g, n]) => n > CONVENTION_AT && !defined.has(g))
    .sort((a, b) => b[1] - a[1])
    .map(([g, n]) => `${g} (${n} uses)`);

  assert.deepEqual(undocumented, [],
    `these glyphs are used more than ${CONVENTION_AT} times and are not in CONTRIBUTING.md's `
    + 'legend. A convention a reader has to infer is a convention they will infer wrongly — '
    + 'either define it there or stop using it:\n  ' + undocumented.join('\n  '));

  /* AND THE OTHER DIRECTION: a legend may not describe a convention nobody
     follows. Retiring a mark should delete its row, not leave a definition
     standing for a thing the repo no longer does. */
  const unused = [...defined].filter(g => (counts.get(g) || 0) === 0);
  assert.deepEqual(unused, [],
    'the legend defines marks that appear nowhere in the repo: ' + unused.join(' '));
});

test('⛔ …and the scan would notice a fifth convention', () => {
  /* THE CONTROL. Both assertions above pass by finding nothing, which is the
     shape that passes forever once the walk or the pattern stops working. Feed
     the same predicate a glyph over the threshold that the legend does not
     define, and require it named. */
  const defined = new Set(['⭐', '⛔']);
  const counts = new Map([['⭐', 900], ['⛔', 100], ['🐢', CONVENTION_AT + 1], ['📅', 16]]);
  const flagged = [...counts].filter(([g, n]) => n > CONVENTION_AT && !defined.has(g)).map(([g]) => g);
  assert.deepEqual(flagged, ['🐢'],
    'the threshold check does not flag an undocumented glyph over the line, or flags one under it');
});
