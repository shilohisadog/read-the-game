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
 * `nature` were assigned by a model reading the source. ⛔ A BLIND HUMAN RELABEL
 * OF 30 (scored at the bottom of this file) found `oracle` NOT REPRODUCIBLE and
 * `found_by` reliable only as "Kevin versus anyone else" — read those tables with
 * that result beside them.
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

/* ⭐⭐ THE HUMAN RELABEL, 2026-09-16 — the one check on these labels not made by
   the model that made them. Kevin labelled 30 random commit entries BLIND (the
   extractor's labels were sealed until he finished); the key is what was sealed.
   Parsed and scored here so the agreement figures in docs/defect-corpus.md are
   derived, never typed. */
const SHEET = readFileSync(new URL('relabel-2026-09-16.md', DIR), 'utf8');
const KEY = JSON.parse(readFileSync(new URL('relabel-2026-09-16-key.json', DIR), 'utf8'));
const answers = new Map();
const blocks = SHEET.split(/^### (\d+)\. /m);
for (let k = 1; k < blocks.length; k += 2) {
  const pick = q => (new RegExp(q + '\\? → *(\\S*)').exec(blocks[k + 1]) || [])[1];
  answers.set(+blocks[k], { real: pick('Real'), who: pick('Found by'), oracle: pick('Could have known') });
}
const gitSlugs = new Set((corpus['git.jsonl'] || []).map(r => r.slug));
if (KEY.length !== 30 || answers.size !== 30) problems.push(`the relabel has ${answers.size} answered entries and a key of ${KEY.length}; both should be 30`);
for (const k of KEY) {
  if (!gitSlugs.has(k.slug)) problems.push(`the relabel key names "${k.slug}", which git.jsonl does not contain`);
  const a = answers.get(k.n);
  if (!a || !a.real || !a.who || !a.oracle) problems.push(`relabel entry ${k.n} is not fully answered`);
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

// ---- the human relabel --------------------------------------------------------
{
  const COARSE = { B: 'visual', E: 'visual', L: 'data', H: 'data', D: 'code', R: 'code', P: 'production', N: 'novice' };
  const score = (same, a, b) => {
    const both = KEY.filter(k => a(k) !== '?' && b(k) !== '?');
    return `${both.filter(k => same(a(k), b(k))).length} of ${both.length}`;
  };
  const ans = k => answers.get(k.n);
  console.log(`\nHUMAN RELABEL — 30 random commit entries, labelled blind by Kevin`);
  const real = [...answers.values()].map(a => a.real);
  console.log(`  real defect?  yes ${real.filter(x => x === 'y').length} · no ${real.filter(x => x === 'n').length} · unsure ${real.filter(x => x === '?').length}`
    + `  (the extractors flagged ${KEY.filter(k => k.unsure).length} of these 30 as unsure)`);
  console.log(`  found by, exact (Kevin / model review / automated)      ${score((x, y) => x === y, k => ans(k).who, k => k.who)}`);
  console.log(`  found by, Kevin versus anyone else                      ${score((x, y) => (x === 'K') === (y === 'K'), k => ans(k).who, k => k.who)}`);
  console.log(`  could have known, exact (8 categories)                  ${score((x, y) => x === y, k => ans(k).oracle, k => k.O)}`);
  console.log(`  could have known, coarse (visual/data/code/production)  ${score((x, y) => COARSE[x] === COARSE[y], k => ans(k).oracle, k => k.O)}`);
  const vis = KEY.filter(k => ans(k).oracle === 'B');
  console.log(`  of the ${vis.length} Kevin said a real BROWSER could have caught, the extractor said a human eye on ${vis.filter(k => k.O === 'E').length}`);
}
