/**
 * THE REVIEW GALLERY'S ARITHMETIC — the parts that decide what a person is asked
 * to judge, tested without a browser.
 *
 * The rendering half needs Chromium and is proved by planting (docs/reviews/README.md):
 * a null run, a one-word change, a one-rule style change. What is tested here is
 * the half that could quietly drop a difference on the way to the sheet — the
 * text diff, the grouping, which file a URL is served from — because a gallery
 * that loses a difference between capture and sheet shows a person a clean batch
 * that was not clean.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { lineDiff, hunks, compareCaptures, groupItems, fileFor, gameStates, statesFor, pagesOf, GAME }
  from '../tools/gallery.mjs';

test('the text diff reports a one-word change as one line out and one line in', () => {
  // The change Kevin missed in the blind review: a single word in a sentence.
  const before = 'Offside\nThe shot missed the net.\nIcing';
  const after = 'Offside\nThe shot went wide of the net.\nIcing';
  assert.deepEqual(lineDiff(before, after), [
    { op: ' ', line: 'Offside' },
    { op: '-', line: 'The shot missed the net.' },
    { op: '+', line: 'The shot went wide of the net.' },
    { op: ' ', line: 'Icing' },
  ]);
});

test('identical text is no difference, and a removed or added line is one', () => {
  assert.equal(lineDiff('a\nb', 'a\nb').filter(d => d.op !== ' ').length, 0);
  assert.deepEqual(lineDiff('a\nb\nc', 'a\nc').filter(d => d.op !== ' '), [{ op: '-', line: 'b' }]);
  assert.deepEqual(lineDiff('a\nc', 'a\nb\nc').filter(d => d.op !== ' '), [{ op: '+', line: 'b' }]);
});

test('the hunks keep every changed line and elide the unchanged middle', () => {
  const a = ['x1', 'keep', 'k2', 'k3', 'k4', 'k5', 'y1'].join('\n');
  const b = ['X1', 'keep', 'k2', 'k3', 'k4', 'k5', 'Y1'].join('\n');
  assert.equal(hunks(lineDiff(a, b)), ['- x1', '+ X1', '  keep', '…', '  k5', '- y1', '+ Y1'].join('\n'));
});

const cap = over => ({ text: 'same', domHash: 'h', ids: ['#a'], classes: ['.c'], errors: [], ...over });

test('a capture pair names what moved: text, the ids and classes, and NEW console errors', () => {
  assert.deepEqual(compareCaptures(cap(), cap()), { text: null, dom: null, errors: null });
  const d = compareCaptures(cap(), cap({ domHash: 'g', ids: ['#b'], classes: ['.c', '.d'],
                                          errors: ['pageerror: boom'] }));
  assert.deepEqual(d.dom.ids, { added: ['#b'], removed: ['#a'] });
  assert.deepEqual(d.dom.classes, { added: ['.d'], removed: [] });
  assert.deepEqual(d.errors, { added: ['pageerror: boom'], removed: [] });
  assert.equal(d.text, null, 'the text did not change and must not be reported as changing');
});

const r = (key, vp, over) => ({ key, vp, text: null, dom: null, errors: null, px: { changed: 0 }, ...over });

test('no difference anywhere is no item, and a pixel-only difference is not dropped', () => {
  assert.deepEqual(groupItems([r('index.html', [1, 1])]), []);
  // ⚠️ THE SHAPE THAT WOULD LOSE A STYLE CHANGE: no text, no document change,
  // only pixels. A grouping keyed on text alone would never emit it.
  const g = groupItems([r('index.html', [1, 1], { px: { changed: 12 } })]);
  assert.equal(g.length, 1);
});

test('one change seen on many states is one question, and different changes stay apart', () => {
  const same = { text: '- a\n+ b', px: { changed: 5 } };
  const g = groupItems([
    r('game.html?at=1', [1, 1], same), r('game.html?at=2', [1, 1], same),
    r('game.html?at=2', [2, 2], same),
    r('game.html?at=3', [1, 1], { text: '- c\n+ d', px: { changed: 5 } }),
    r('index.html', [1, 1], same),                       // same text, another page
  ]);
  assert.deepEqual(g.map(x => x.length).sort(), [1, 1, 3]);
});

test('a site path is served from the file Cloudflare Pages would serve', () => {
  assert.equal(fileFor('/'), 'index.html');
  assert.equal(fileFor('/game.html'), 'game.html');
  assert.equal(fileFor('/calendar'), 'calendar.html');
  assert.equal(fileFor('/lib/layer.js'), 'lib/layer.js');
});

test('the walk covers every page in src/, and the game page at every step-3 state', () => {
  const onDisk = readdirSync(new URL('../src/', import.meta.url)).filter(f => f.endsWith('.html'));
  const pages = pagesOf('HEAD');
  assert.ok(onDisk.every(p => pages.includes(p)), 'a page on disk is not walked');
  const states = statesFor(pages);
  const game = gameStates();
  assert.equal(game.length, 37, 'the step-3 record holds 37 replay states');
  assert.ok(game.every(s => s.startsWith(`game.html?game=${GAME}`)));
  assert.equal(states.length, pages.length - 1 + game.length);
});

test('a state that differs from ITSELF is never put to the judge', () => {
  // Batch 1, 2026-09-17: terrain-3d.html redraws a WebGL chart every animation
  // frame, differed from itself on 3 of 3 re-runs, and reached the sheet as a
  // question about a page no commit had touched.
  assert.deepEqual(groupItems([r('terrain-3d.html', [1, 1], { px: { changed: 900 }, unstable: true })]), []);
});

test('a page that grew or shrank is aligned by content: what only MOVED is not a change', async () => {
  const { rowBands } = await import('../tools/gallery.mjs');
  // Batch 1's front door: hero text 23px shorter, everything below slid up.
  const top = [1, 2, 3], below = Array.from({ length: 200 }, (_, k) => 100 + k);
  assert.deepEqual(rowBands([...top, 7, 7, 8, ...below], [...top, 9, ...below]),
    [{ a0: 3, a1: 6, b0: 3, b1: 4 }], 'only the rows with no counterpart are a change');
  assert.deepEqual(rowBands([...top, ...below], [...top, ...below]), []);
  // A pure insertion is a run with nothing on the before side.
  assert.deepEqual(rowBands([1, 2, 3], [1, 2, 5, 5, 3]), [{ a0: 2, a1: 2, b0: 2, b1: 4 }]);
  // Two edits far apart stay two; two a few rows apart are one.
  const far = rowBands([0, 1, ...below, 2], [0, 9, ...below, 8]);
  assert.equal(far.length, 2);
  assert.equal(rowBands([0, 1, 50, 51, 2], [0, 9, 50, 51, 8]).length, 1);
});

test('a band that only moved is split from one that changed, by structure and not by strength', async () => {
  const { splitMoved } = await import('../tools/gallery.mjs');
  const { moved, changed } = splitMoved([
    { a0: 208, a1: 300, b0: 208, b1: 300 },   // the hero redrawn in place: changed
    { a0: 691, a1: 787, b0: 691, b1: 765 },   // 22 rows shorter: changed
    { a0: 821, a1: 844, b0: 799, b1: 822 },   // same height, 22 rows up: moved
    { a0: 2321, a1: 2334, b0: 2298, b1: 2312 }, // one row taller — the fractional shift rounding: moved
  ]);
  assert.deepEqual(changed.map(x => x.a0), [208, 691]);
  assert.deepEqual(moved.map(x => x.a0), [821, 2321]);
});
