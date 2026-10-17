/**
 * Editions (docs/editions-design.md): the routing at the edge, the seal, and the
 * links that carry a date. Expectations are written out by hand.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { editionPage, editionFor, cardUrl } from '../functions/_middleware.js';
import { editionDate, planEdition, addToIndex, DATA_FILES, PAGE_FILES } from '../tools/seal-edition.mjs';
import { parse } from '../src/lib/deeplink.js';

const R = 'https://readthegame.co';

test('a dated link names a stored page only on the three dated paths, with a real date', () => {
  assert.deepEqual(editionPage(`${R}/preview?game=1&asof=2026-10-14`), { asof: '2026-10-14', file: 'preview.html' });
  assert.deepEqual(editionPage(`${R}/game.html?game=1&asof=2026-10-14`), { asof: '2026-10-14', file: 'game.html' });
  assert.deepEqual(editionPage(`${R}/how-we-measure?asof=2026-10-14`), { asof: '2026-10-14', file: 'how-we-measure.html' });
  assert.equal(editionPage(`${R}/icing.html?asof=2026-10-14`), null, 'learn pages are not dated');
  assert.equal(editionPage(`${R}/preview?game=1`), null);
  assert.equal(editionPage(`${R}/preview?game=1&asof=../../x`), null, 'a junk date reaches the bucket');
});

test('an undated preview goes to the newest edition before its game, or the newest one', () => {
  const index = { editions: ['2026-10-12', '2026-10-13', '2026-10-14'] };
  assert.equal(editionFor({ played: false, date: '2026-10-16' }, index), '2026-10-14');
  assert.equal(editionFor({ played: true, date: '2026-10-14' }, index), '2026-10-13',
    'a played game opens what its preview said going in');
  assert.equal(editionFor({ played: true, date: '2026-10-12' }, index), null, 'nothing was saved before it');
  assert.equal(editionFor({ played: false }, null), null, 'no index, no redirect');
  assert.equal(editionFor({ played: false }, { editions: ['junk'] }), null);
});

test('the link card keeps the moment and the edition, and nothing else', () => {
  assert.equal(cardUrl('preview', 7, `${R}/preview?game=7&asof=2026-10-14&cb=123`),
    `${R}/preview?game=7&asof=2026-10-14`);
  assert.equal(cardUrl('game', 7, `${R}/game?game=7&at=2-18:52&layer=slot`), `${R}/game?game=7&at=2-18%3A52`);
  assert.equal(cardUrl('game', 7, `${R}/game?game=7`), `${R}/game?game=7`);
});

const doc = o => Buffer.from(JSON.stringify(o));
const night = (m, t = m, p = m) => ({ 'measures.json': doc({ dataThrough: m }), 'teams.json': doc({ through: t }),
  'players.json': doc({ through: p }), 'schedule.json': doc({}), 'recent.json': doc({}) });

test('a seal refuses documents from different nights', () => {
  assert.deepEqual(editionDate(night('2026-10-14')), { date: '2026-10-14' });
  assert.match(editionDate(night('2026-10-14', '2026-10-13')).error, /different nights/);
  assert.match(editionDate(night(null)).error, /no dataThrough/);
});

test('an edition holds the five documents and the three pages, each hashed in its manifest', () => {
  const pages = Object.fromEntries(PAGE_FILES.map(n => [n, Buffer.from(`<html>${n}</html>`)]));
  const { files, manifest } = planEdition({ date: '2026-10-14', docs: night('2026-10-14'), pages,
    commit: 'abc', run: '9', sealedAt: '2026-10-15T14:00:00Z' });
  assert.deepEqual(Object.keys(files).sort(), [
    ...DATA_FILES.map(n => `editions/2026-10-14/data/${n}`),
    ...PAGE_FILES.map(n => `editions/2026-10-14/pages/${n}`)].sort());
  assert.equal(Object.keys(manifest.files).length, 8);
  assert.match(manifest.files['pages/preview.html'], /^[0-9a-f]{64}$/);
  assert.equal(manifest.sealedAt, '2026-10-15T14:00:00Z', 'a dated preview reads its clock from here');
});

test('the index gains a date once, in order', () => {
  assert.deepEqual(addToIndex(null, '2026-10-14'), { editions: ['2026-10-14'] });
  assert.deepEqual(addToIndex({ editions: ['2026-10-14', '2026-10-12'] }, '2026-10-13'),
    { editions: ['2026-10-12', '2026-10-13', '2026-10-14'] });
  assert.deepEqual(addToIndex({ editions: ['2026-10-14'] }, '2026-10-14'), { editions: ['2026-10-14'] });
});

test('a replay link reads its date, and refuses one that is not a date', () => {
  assert.equal(parse('?game=1&asof=2026-10-14').asof, '2026-10-14');
  const bad = parse('?game=1&asof=yesterday');
  assert.equal(bad.asof, null);
  assert.ok(bad.problems.some(p => /asof/.test(p)));
});

test('the seal is the deploy\'s last step, only when the nightly asks, and writes the manifest after the files', () => {
  const y = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  const at = y.indexOf("- name: seal tonight's edition");
  assert.ok(at > 0, 'no seal step');
  assert.ok(y.indexOf('- name:', at + 1) < 0, 'a step runs after the seal, so an unverified deploy could be sealed');
  const step = y.slice(at);
  assert.match(step, /if: github\.event_name == 'workflow_dispatch' && inputs\.seal/);
  const order = ['/data"', '/pages"', 'manifest.json"', 'editions/index.json'].map(k => step.indexOf(k));
  assert.ok(order.every(i => i > 0) && order.every((v, k) => !k || v > order[k - 1]),
    'the manifest or the index is uploaded before the files it lists');
  assert.match(step, /immutable/);
  assert.doesNotMatch(step, /\| *tee/, 'a pipe would hide the seal\'s exit code');
});

/* The methods page, run with a permissive fake DOM: only the edition line and the fetches are read. */
function runMethods(search, byPath) {
  const html = readFileSync(new URL('../src/how-we-measure.html', import.meta.url), 'utf8');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  const ids = {};
  const stub = () => new Proxy({ textContent: '', hidden: true, style: {}, kids: [] }, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains: () => false };
      if (k === 'querySelectorAll' || k === 'getElementsByTagName') return () => [];
      if (k === 'querySelector' || k === 'closest') return () => null;
      if (k === 'appendChild') return c => (t.kids.push(c), c);
      return typeof k === 'string' ? () => stub() : undefined;
    },
    set(t, k, v) { t[k] = v; return true; } });
  const document = new Proxy({}, { get(_, k) {
    if (k === 'getElementById') return id => (ids[id] = ids[id] || stub());
    if (k === 'createElement' || k === 'createElementNS' || k === 'createTextNode') return () => stub();
    if (k === 'querySelectorAll') return () => [];
    return stub(); } });
  const asked = [];
  const fetch = url => {
    const path = url.replace(/^https:\/\/data\.readthegame\.co\//, '');
    asked.push(path);
    const body = byPath[path];
    return Promise.resolve(body ? { ok: true, json: () => Promise.resolve(body) } : { ok: false, json: () => Promise.resolve(null) });
  };
  try {
    new Function('document', 'fetch', 'location', 'window', 'history', script)(
      document, fetch, { search, hash: '', origin: R }, { addEventListener() {} }, { replaceState() {} });
  } catch { /* the drawing may need a real DOM; the fetch and the line are set first */ }
  return { ids, asked, settle: () => new Promise(r => setTimeout(r, 0)) };
}

test('a dated methods page reads that night\'s measurements and says so', async () => {
  const saved = { 'editions/2026-10-14/data/measures.json': { dataThrough: '2026-10-14' } };
  const m = runMethods('?asof=2026-10-14', { ...saved, 'editions/index.json': { editions: ['2026-10-14', '2026-10-15'] } });
  await m.settle();
  assert.deepEqual(m.asked, ['editions/2026-10-14/data/measures.json', 'editions/index.json']);
  assert.equal(m.ids.hmedition.hidden, false);
  assert.deepEqual(m.ids.hmedition.kids.map(k => k.textContent), ['Figures as of October 14, 2026. ', 'See today\u2019s \u2192']);
  // The newest edition is today's figures, so it says nothing (Kevin, 2026-10-17).
  const newest = runMethods('?asof=2026-10-14', { ...saved, 'editions/index.json': { editions: ['2026-10-13', '2026-10-14'] } });
  await newest.settle();
  assert.equal(newest.ids.hmedition.hidden, true);
  assert.deepEqual(newest.ids.hmedition.kids, []);
  const gone = runMethods('?asof=2026-09-01', { 'measures.json': { dataThrough: '2026-10-14' } });
  await gone.settle();
  assert.deepEqual(gone.asked, ['editions/2026-09-01/data/measures.json', 'editions/index.json', 'measures.json']);
  assert.match(gone.ids.hmedition.textContent, /No saved version exists for September 1, 2026/);
  const now = runMethods('', { 'measures.json': { dataThrough: '2026-10-14' } });
  await now.settle();
  assert.deepEqual(now.asked, ['measures.json'], 'an undated methods page reads anything but today\'s');
});
