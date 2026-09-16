/**
 * THE DEFECT CORPUS, VALIDATED AND COUNTED — every figure in `docs/defect-corpus.md`.
 *
 * The corpus is `docs/defects/*.jsonl`: one line per documented defect, extracted
 * on 2026-09-16 from the commit history, `docs/` and the developer's notes. It is
 * FROZEN — a snapshot to decide a test architecture against, not a live ledger —
 * so the figures below do not drift unless someone edits the files, and if they
 * do, this is what re-derives them.
 *
 * ⚠️ THE LABELS ARE ONE EXTRACTOR'S JUDGEMENT EACH. `found_by`, `oracle` and
 * `nature` were assigned by a model reading the source, and a 16-entry spot-check
 * is the only audit so far. Quote category-level shares, never decimals.
 *
 *   node tools/defect-corpus.mjs           validate, then print every table
 *   node tools/defect-corpus.mjs --check   validate only; non-zero on any defect in the corpus itself
 */
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../docs/defects/', import.meta.url);
const FIELDS = ['slug', 'what', 'surface', 'date', 'shipped', 'found_by', 'missed_by',
                'nature', 'oracle', 'source', 'quote'];
/* ⭐ EACH FILE'S SOURCES MUST COME FROM ITS OWN SCOPE. The extractors shared a
   scratch folder and one helper script overwrote another's, so entries landed in
   the wrong file for a while. Every file was checked by hand afterwards; this
   makes the check permanent rather than a thing that was once true. */
const SCOPE = {
  'git.jsonl': s => s.startsWith('git:'),
  'notes.jsonl': s => s.startsWith('memory/'),
  'docs-status.jsonl': s => s.startsWith('docs/status.md:'),
};
const inDocs = s => /^(docs\/[\w.-]+\.md|README\.md|CONTRIBUTING\.md|DOCTRINE\.md):\d+/.test(s);

const files = readdirSync(DIR).filter(f => f.endsWith('.jsonl')).sort();
const problems = [];
const corpus = {};
for (const f of files) {
  const rows = [];
  readFileSync(new URL(f, DIR), 'utf8').split('\n').forEach((line, k) => {
    if (!line.trim()) return;
    let r;
    try { r = JSON.parse(line); } catch { problems.push(`${f}:${k + 1} is not JSON`); return; }
    const gone = FIELDS.filter(x => !(x in r));
    if (gone.length) problems.push(`${f}:${k + 1} (${r.slug}) lacks ${gone.join(', ')}`);
    const ok = SCOPE[f] || inDocs;
    if (typeof r.source !== 'string' || !ok(r.source)) problems.push(`${f}:${k + 1} (${r.slug}) cites "${r.source}", outside this file's scope`);
    rows.push(r);
  });
  const seen = new Set();
  for (const r of rows) { if (seen.has(r.slug)) problems.push(`${f}: slug "${r.slug}" appears twice`); seen.add(r.slug); }
  corpus[f] = rows;
}
if (files.length !== 7) problems.push(`expected 7 corpus files, found ${files.length} — the directory scan is not what the document describes`);

const unsure = JSON.parse(readFileSync(new URL('unsure.json', DIR), 'utf8'));
for (const [f, slugs] of Object.entries(unsure)) {
  if (f.startsWith('_')) continue;
  const have = new Set((corpus[f] || []).map(r => r.slug));
  for (const s of slugs) if (!have.has(s)) problems.push(`unsure.json names "${s}", which ${f} does not contain`);
}

if (problems.length) {
  console.error(`THE CORPUS HAS ${problems.length} PROBLEM(S):\n  ` + problems.join('\n  '));
  process.exit(1);
}
if (process.argv.includes('--check')) { console.log(`corpus ok: ${files.length} files, ${Object.values(corpus).flat().length} entries`); process.exit(0); }

// ---- the tables -------------------------------------------------------------
const head = v => (typeof v === 'string' ? v.split(':')[0].trim() : String(v));
const HUMAN = new Set(['kevin-looking', 'kevin-question']);
const MODEL = new Set(['cc-audit', 'cc-measurement', 'cheng-review']);
const TOOL = new Set(['test-suite', 'ci-gate', 'pipeline-alarm', 'browser-check', 'mutation']);
const finder = r => { const f = head(r.found_by); return HUMAN.has(f) ? 'Kevin (looking or asking)' : MODEL.has(f) ? 'model review' : TOOL.has(f) ? 'instrument: ' + f : 'other or unknown'; };
const tally = (rows, key) => {
  const m = new Map(); for (const r of rows) m.set(key(r), (m.get(key(r)) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
};
const table = (title, rows, key) => {
  console.log(`\n${title}  (n=${rows.length})`);
  for (const [k, v] of tally(rows, key)) console.log(`  ${String(v).padStart(4)}  ${(100 * v / rows.length).toFixed(0).padStart(3)}%  ${k}`);
};

console.log('files:'); for (const f of files) console.log(`  ${String(corpus[f].length).padStart(4)}  ${f}`);
const git = corpus['git.jsonl'];
const live = git.filter(r => r.shipped === 'live');
const rest = files.filter(f => f !== 'git.jsonl').flatMap(f => corpus[f]);
table('COMMITS — who found it', git, finder);
table('COMMITS — what knew the right answer', git, r => head(r.oracle));
table('COMMITS — what kind of defect', git, r => head(r.nature));
table('COMMITS THAT REACHED THE LIVE SITE — who found it', live, finder);
table('COMMITS THAT REACHED THE LIVE SITE — what knew the right answer', live, r => head(r.oracle));
table('DOCS + NOTES (overlapping, includes pre-commit catches) — who found it', rest, finder);
table('DOCS + NOTES — what knew the right answer', rest, r => head(r.oracle));
