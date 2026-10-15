/**
 * SEAL TONIGHT'S EDITION (docs/editions-design.md): the five documents the dated
 * pages read and the three dated pages as deployed, staged for upload under
 * `editions/<date>/`. The date is the league's game date of the newest game the
 * measurement covers.
 *
 *   node tools/seal-edition.mjs <stage-dir>
 *
 * Writes nothing to the bucket: the workflow uploads the staged files, data and
 * pages first, then the manifest, then the index, so an edition with a manifest
 * is always complete. Prints `date=` and `seal=1|0` for GITHUB_OUTPUT; `seal=0`
 * when that date is already sealed, because the first seal wins.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA = 'https://data.readthegame.co';
export const DATA_FILES = ['measures.json', 'teams.json', 'players.json', 'schedule.json', 'recent.json'];
export const PAGE_FILES = ['preview.html', 'game.html', 'how-we-measure.html'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const sha = buf => createHash('sha256').update(buf).digest('hex');

/** The edition's date, or a reason it cannot be sealed: the three measured documents must name one night. */
export function editionDate(docs) {
  const p = name => JSON.parse(docs[name].toString('utf8'));
  const m = p('measures.json').dataThrough, t = p('teams.json').through, pl = p('players.json').through;
  if (!DATE.test(m || '')) return { error: `measures.json has no dataThrough date (${m})` };
  if (t !== m || pl !== m) return { error: `the documents are from different nights: measures ${m}, teams ${t}, players ${pl}` };
  return { date: m };
}

/** Every object to upload, keyed by bucket path, and the manifest that lists them. */
export function planEdition({ date, docs, pages, commit, run, sealedAt }) {
  const files = {};
  for (const n of DATA_FILES) files[`editions/${date}/data/${n}`] = docs[n];
  for (const n of PAGE_FILES) files[`editions/${date}/pages/${n}`] = pages[n];
  const manifest = { date, dataThrough: date, sealedAt, commit, run,
    files: Object.fromEntries(Object.entries(files).map(([k, b]) => [k.slice(`editions/${date}/`.length), sha(b)])) };
  return { files, manifest };
}

/** The index with `date` added: sorted, no repeats. */
export function addToIndex(index, date) {
  const have = ((index && index.editions) || []).filter(d => DATE.test(d));
  return { editions: [...new Set([...have, date])].sort() };
}

async function get(name) {
  const r = await fetch(`${DATA}/${name}?cb=${Date.now()}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function main(stage) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const docs = {};
  for (const n of DATA_FILES) {
    docs[n] = await get(n);
    if (!docs[n]) throw new Error(`${n} is not published`);
  }
  const d = editionDate(docs);
  if (d.error) throw new Error(d.error);
  if (await get(`editions/${d.date}/manifest.json`)) {
    console.log(`date=${d.date}`); console.log('seal=0');
    console.error(`  ${d.date} is already sealed; the first seal wins`);
    return;
  }
  const pages = Object.fromEntries(PAGE_FILES.map(n => [n, readFileSync(join(root, 'src', n))]));
  const { files, manifest } = planEdition({ date: d.date, docs, pages,
    commit: process.env.GITHUB_SHA || null, run: process.env.GITHUB_RUN_ID || null,
    sealedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z') });
  for (const [k, b] of Object.entries(files)) { mkdirSync(dirname(join(stage, k)), { recursive: true }); writeFileSync(join(stage, k), b); }
  writeFileSync(join(stage, `editions/${d.date}/manifest.json`), JSON.stringify(manifest, null, 1) + '\n');
  const index = await get('editions/index.json');
  writeFileSync(join(stage, 'editions/index.json'),
    JSON.stringify(addToIndex(index && JSON.parse(index.toString('utf8')), d.date)) + '\n');
  console.log(`date=${d.date}`); console.log('seal=1');
  console.error(`  staged ${Object.keys(files).length} files for ${d.date}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main(process.argv[2] || 'edition-stage').catch(e => { console.error(`::error::${e.message}`); process.exit(1); });
}
