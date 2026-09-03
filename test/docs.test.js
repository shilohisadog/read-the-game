/**
 * The design record's index, checked against the directory it describes.
 *
 * ⚠️⚠️ WRITTEN BECAUSE `docs/` HAD NO MAP AND ITS STATUS LINES HAD DRIFTED THE
 * WRONG WAY. On 2026-09-03, SEVEN documents opened with "Nothing here is built"
 * while describing things that were live — the slot page, the calendar, the
 * active-player line, the nightly ingest, the mobile scoreboard, the layer
 * surface and the penalties page. Every one of those sentences was true when it
 * was written. None had been re-examined.
 *
 * That is the worst possible direction for the error: a reader trusting the
 * record would conclude the site LACKS features it has. Same class as the
 * architecture doc's 5.3× stale tier table and the README still advertising a
 * retired label — a claim that outlived its premise.
 *
 * ⭐ WHAT A TEST CAN AND CANNOT DO HERE, because the difference is the whole
 * design. It cannot know whether "shipped" is still true — that is a judgement
 * about the world, and pretending to derive it would be a check built from a
 * model of its input rather than the input. What it CAN do is refuse to let the
 * index and the directory diverge, which is the half that drifts mechanically:
 * a document added and never listed is invisible, and a document listed and
 * deleted is a link into nothing.
 *
 * So the prose is a person's judgement and stays a person's judgement; the
 * membership is arithmetic and is checked.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../docs/', import.meta.url);
const INDEX = readFileSync(new URL('README.md', DIR), 'utf8');

/** Every markdown file in docs/, except the index itself. */
const onDisk = readdirSync(DIR)
  .filter(f => f.endsWith('.md') && f !== 'README.md')
  .sort();

/** Every docs-relative markdown link the index makes. */
const linked = [...INDEX.matchAll(/\]\((?!\.\.\/)([\w.-]+\.md)(?:#[\w-]*)?\)/g)]
  .map(m => m[1]);

test('every document in docs/ is on the index, and every index entry exists', () => {
  assert.ok(onDisk.length > 20,
    `only ${onDisk.length} documents found — the directory scan is not working`);
  assert.ok(linked.length > 20,
    `only ${linked.length} links parsed out of the index — the link scan is not working`);

  const unlisted = onDisk.filter(f => !linked.includes(f));
  assert.deepEqual(unlisted, [],
    'these documents exist and the index does not mention them — a document '
    + 'nobody can find is a document nobody reviews');

  const missing = [...new Set(linked)].filter(f => !onDisk.includes(f));
  assert.deepEqual(missing, [],
    'the index links to documents that are not there — either restore them or '
    + 'delete the lines, but do not leave a map of a place that no longer exists');
});

test('no document is listed twice', () => {
  // Two rows for one file means one of them is wrong about it, and a reader has
  // no way to tell which. It also breaks the count in the test above by masking
  // an unlisted file behind a duplicate.
  const seen = new Set(), dupes = [];
  for (const f of linked) {
    if (seen.has(f)) dupes.push(f);
    else seen.add(f);
  }
  assert.deepEqual(dupes, [], 'listed more than once');
});

/**
 * ⭐ THE ONE STATUS CLAIM THAT *IS* MECHANICALLY CHECKABLE.
 *
 * "Nothing here is built" is a claim about the world and mostly beyond a test.
 * But a document that says it while ALSO carrying the shipped banner added when
 * it turned out to be false is simply contradicting itself on the same page,
 * and that a test can see. This is what stops the banners from being quietly
 * removed later, leaving the false line standing alone again.
 */
test('no document both claims nothing is built and records that it shipped', () => {
  let checked = 0;
  for (const f of onDisk) {
    const head = readFileSync(new URL(f, DIR), 'utf8').split('\n').slice(0, 20).join('\n');
    if (!/SHIPPED — status added/.test(head)) continue;
    checked++;
    assert.match(head, /Nothing here is built|nothing built/,
      `${f}: carries a shipped banner explaining a stale "nothing is built" line, `
      + 'but that line is gone — delete the banner too, or it explains nothing');
  }
  assert.equal(checked, 7,
    `${checked} documents carry the shipped banner; seven were corrected on `
    + '2026-09-03. If that number moved, say so here deliberately.');
});
