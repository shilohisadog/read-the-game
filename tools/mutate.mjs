/**
 * THE MUTATION ENGINE, IN THE REPO — plant a recorded defect in today's code,
 * run the checks, and say which of them noticed.
 *
 * ⭐ WHY IT EXISTS. docs/test-program.md §8.2 accepts the program only if
 * "detection does not regress": the 187 random defects the survivorship
 * experiment planted (docs/survivorship-experiment.md) must still be caught per
 * function at least 52 / 45 / 28 times. Step 6 then deleted tests, rewrote the
 * counter tests and removed 24 ids — and the engine that could answer the
 * question lived in a scratch directory that no longer exists
 * (docs/defects/survivorship-2026-09-16/scripts/ is the method as run, with dead
 * paths). This is that engine again, runnable, with its paths as arguments.
 *
 * WHAT IT DOES NOT DO, so a result is not read as more than it is: the step-3
 * run also probed published numbers and a real browser, which is how it split
 * the uncaught into ESCAPED and nothing-observable. This runs the COMMIT-STAGE
 * detectors only — the build, the JS suite, the Python suite and the extract
 * gates — which is exactly the population §8.2's numbers count ("caught by
 * suite/build"). A mutant these miss is "not caught", not "escaped".
 *
 * THE RECORD IS RELOCATED, NEVER RE-SAMPLED. A mutant is (file, offset, token
 * before, token after) in the code of the base commit. Offsets into a file that
 * has changed since point at the wrong token, so each is carried to HEAD through
 * `git diff` line by line: a mutant on a line the diff did not touch keeps its
 * column; one on a changed or deleted line is GONE — its code no longer exists as
 * it was, and planting a different token there would be a different experiment.
 *
 *   node tools/mutate.mjs relocate <base> <record-dir> <out.json>
 *   node tools/mutate.mjs run <relocated.json> <results.jsonl> [--workers N] [--only id,id]
 *   node tools/mutate.mjs report <relocated.json> <results.jsonl> <record-dir>
 *
 * Worktrees go in RTG_MUTATE_WORK (default /tmp/rtg-mutate), never in the repo.
 */
import { execFileSync, spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const WORK = process.env.RTG_MUTATE_WORK || '/tmp/rtg-mutate';

/** The step-3 build, verbatim: generators only, no `--verify` (a mutant changes the bytes by design). */
export const BUILD = 'export PYTHONDONTWRITEBYTECODE=1; node builders/attribution.mjs >/dev/null && node builders/learn-doors.mjs >/dev/null && node builders/learn-figures.mjs >/dev/null && python3 builders/build_main.py >/dev/null && python3 builders/build_index.py >/dev/null && python3 builders/build_3d.py >/dev/null';
/** A detector that fails on ANY change, right or wrong — not a catcher (test-program.md §11.2 Q4). */
export const CHANGE_DETECTORS = new Set(['dom-golden.test.js']);

// ------------------------------------------------------------------ offsets

/** Offsets are UTF-16 units for JavaScript (how the step-3 lexer counted) and code points for Python. */
const units = (lang, s) => (lang === 'py' ? [...s] : s);
function tokenAtExact(lang, src, at, from) {
  if (lang === 'py') return [...src].slice(at, at + [...from].length).join('') === from;
  return src.slice(at, at + from.length) === from;
}
/** [line (1-based), column in units] of an offset. */
export function lineCol(lang, src, at) {
  const u = units(lang, src);
  let line = 1, start = 0;
  for (let k = 0; k < at; k++) if (u[k] === '\n') { line++; start = k + 1; }
  return [line, at - start];
}
function offsetOf(lang, src, line, col) {
  const u = units(lang, src);
  let l = 1, k = 0;
  while (l < line && k < u.length) { if (u[k] === '\n') l++; k++; }
  return k + col;
}

/**
 * Where an old line is in the new file, from a zero-context unified diff
 * (`git diff -U0`). Returns the new line number, or null if the line was changed
 * or deleted. A line below a hunk moves by that hunk's net size.
 *
 * ⚠️ GIT'S TWO EDGE CASES, which are the whole difficulty: a pure INSERTION
 * (`-a,0`) names the old line it comes AFTER, so old line `a` itself is
 * untouched; a pure DELETION (`+c,0`) names the new line it comes after.
 */
export function mapLine(diff, oldLine) {
  let shift = 0;
  for (const m of diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)) {
    const a = +m[1], b = m[2] === undefined ? 1 : +m[2];
    const c = +m[3], d = m[4] === undefined ? 1 : +m[4];
    if (b > 0 && oldLine >= a && oldLine < a + b) return null;
    const oldAfter = b === 0 ? a + 1 : a + b;
    const newAfter = d === 0 ? c + 1 : c + d;
    if (oldLine < oldAfter) break;
    shift = newAfter - oldAfter;
  }
  return oldLine + shift;
}

export function relocate(base, recordDir) {
  const load = f => JSON.parse(readFileSync(join(recordDir, f), 'utf8'));
  const final = load('final-syntactic.json');
  const planted = new Map([...load('mutants-A.json').mutants, ...load('mutants-B.json').mutants].map(m => [m.id, m]));
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
  const cache = new Map();
  const files = f => {
    if (!cache.has(f)) cache.set(f, { old: git('show', `${base}:${f}`), now: readFileSync(join(ROOT, f), 'utf8'),
                                      diff: git('diff', '-U0', base, '--', f) });
    return cache.get(f);
  };
  return final.map(r => {
    const m = planted.get(r.id);
    if (!m) throw new Error(`${r.id} is in the record's outcomes but not in its mutants`);
    const f = files(m.file);
    if (!tokenAtExact(m.lang, f.old, m.at, m.from)) throw new Error(`${r.id}: "${m.from}" is not at ${m.at} in ${m.file}@${base} — wrong base`);
    const [line, col] = lineCol(m.lang, f.old, m.at);
    const out = { id: m.id, pop: m.pop, cls: m.cls, lang: m.lang, file: m.file, from: m.from, to: m.to,
                  was: { line, at: m.at, final: r.final, jsFail: r.jsFail || [] } };
    const nl = mapLine(f.diff, line);
    if (nl === null) return { ...out, status: 'gone' };
    const at = offsetOf(m.lang, f.now, nl, col);
    if (!tokenAtExact(m.lang, f.now, at, m.from)) return { ...out, status: 'gone', why: 'the token moved within its line' };
    return { ...out, status: nl === line ? 'same' : 'moved', line: nl, at };
  });
}

// ------------------------------------------------------------------ running

function sh(cmd, cwd, seconds) {
  return new Promise(done => {
    const p = spawn('bash', ['-c', cmd], { cwd });
    let out = '';
    p.stdout.on('data', d => { out += d; if (out.length > 4e6) out = out.slice(-2e6); });
    p.stderr.on('data', d => { out += d; if (out.length > 4e6) out = out.slice(-2e6); });
    const t = setTimeout(() => p.kill('SIGKILL'), seconds * 1000);
    p.on('close', code => { clearTimeout(t); done({ code: code === null ? 'TIMEOUT' : code, out }); });
  });
}
export const failingFiles = out =>
  [...new Set([...out.matchAll(/location: '.*?\/test\/([\w.-]+\.test\.js)/g)].map(x => x[1]))];

function applyTo(dir, m) {
  const p = join(dir, m.file);
  const src = readFileSync(p, 'utf8');
  if (!tokenAtExact(m.lang, src, m.at, m.from)) throw new Error(`${m.id}: site text moved in the worktree`);
  const u = units(m.lang, src);
  const len = m.lang === 'py' ? [...m.from].length : m.from.length;
  const head = m.lang === 'py' ? u.slice(0, m.at).join('') : src.slice(0, m.at);
  const tail = m.lang === 'py' ? u.slice(m.at + len).join('') : src.slice(m.at + len);
  writeFileSync(p, head + m.to + tail);
}

/** The commit-stage detectors, in the order and form step 3 ran them. */
async function detect(dir, lang) {
  const r = {};
  const b = await sh(BUILD, dir, 180); r.build = b.code;
  if (b.code !== 0) r.buildTail = b.out.slice(-300);
  const js = await sh('node --test --test-concurrency=4 test/*.test.js 2>&1', dir, 400);
  r.js = js.code; r.jsFail = js.code === 0 ? [] : failingFiles(js.out);
  /* ⛔⛔ A CATCH MUST REPRODUCE, AND TWICE IT DID NOT. Running three worktrees at
     once — each a build plus a 4-way suite — made `homepage.test.js` go red under
     load on two mutants (`s20260916-82`, `s20260916-96`) that are NOT caught: both
     came back `not-caught` at `--workers 1`, and the same suite passes with either
     planted. A false CAUGHT is the worst error this engine can make: it reports
     detection the suite does not have, which is the exact claim the whole program
     rests on. So a red is confirmed by re-running JUST the files that failed — the
     narrow re-run costs a second or two, and only mutants that went red pay it.
     A red that does not reproduce is recorded as `flaky` and NOT counted as a
     catch. (docs/defects/blind-spots-2026-09-17/) */
  if (js.code !== 0 && r.jsFail.length) {
    const again = await sh(`node --test ${r.jsFail.map(f => `test/${f}`).join(' ')} 2>&1`, dir, 300);
    if (again.code === 0) { r.flaky = r.jsFail; r.js = 0; r.jsFail = []; }
    else r.jsFail = failingFiles(again.out);
  }
  if (lang === 'py') {
    const py = await sh('PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s test -p "test_*.py" 2>&1', dir, 300);
    r.py = py.code;
    for (const g of ['verify', 'validate', 'vocab'])
      r['extract_' + g] = (await sh(`python3 builders/extract.py --${g} >/dev/null 2>&1`, dir, 200)).code;
  }
  return r;
}

export function outcome(r) {
  if (r.error) return 'engine-error';
  if (r.build !== 0 && r.build != null) return 'build-error';
  const real = (r.jsFail || []).filter(f => !CHANGE_DETECTORS.has(f));
  const jsRed = r.js !== 0 && r.js != null;
  if (jsRed && (real.length || !(r.jsFail || []).length)) return 'suite';
  if (r.py !== 0 && r.py != null) return 'suite';
  if (jsRed) return 'change-detector';
  if (r.extract_verify !== 0 && r.extract_verify != null) return 'change-detector';
  if ([r.extract_validate, r.extract_vocab].some(x => x !== 0 && x != null)) return 'extract-gate';
  return 'not-caught';
}
export const CAUGHT = new Set(['suite', 'build-error']);

async function run(relocatedFile, resultsFile, { workers = 3, only = null } = {}) {
  const all = JSON.parse(readFileSync(relocatedFile, 'utf8'));
  const done = new Set(existsSync(resultsFile)
    ? readFileSync(resultsFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).id) : []);
  const queue = all.filter(m => m.status !== 'gone' && !done.has(m.id) && (!only || only.has(m.id)));
  mkdirSync(WORK, { recursive: true });
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT }).toString().trim();
  const dirs = [];
  for (let w = 0; w < workers; w++) {
    const dir = join(WORK, `w${w}`);
    if (existsSync(dir)) { execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: ROOT }); rmSync(dir, { recursive: true, force: true }); }
    execFileSync('git', ['worktree', 'add', '-q', '--detach', dir, head], { cwd: ROOT });
    dirs.push(dir);
  }
  // ⛔ THE CONTROL FIRST. An unmutated worktree whose checks are red would make
  // every mutant "caught"; the run refuses to start rather than report that.
  const control = await detect(dirs[0], 'py');
  if (outcome(control) !== 'not-caught')
    throw new Error(`the unmutated tree is not green (${outcome(control)}: ${JSON.stringify(control).slice(0, 300)}) — nothing below would mean anything`);
  process.stderr.write(`  control green at ${head.slice(0, 7)}; ${queue.length} mutants, ${workers} workers\n`);
  let next = 0, n = 0;
  await Promise.all(dirs.map(async dir => {
    while (next < queue.length) {
      const m = queue[next++];
      const r = { id: m.id, pop: m.pop, file: m.file, line: m.line, from: m.from, to: m.to, head };
      try {
        await sh('git checkout -q -- . && git clean -fdq', dir, 60);
        applyTo(dir, m);
        Object.assign(r, await detect(dir, m.lang));
      } catch (e) { r.error = String(e.message).slice(0, 300); }
      await sh('git checkout -q -- . && git clean -fdq', dir, 60);
      r.outcome = outcome(r);
      appendFileSync(resultsFile, JSON.stringify(r) + '\n');
      process.stderr.write(`  ${++n}/${queue.length} ${m.id} ${m.pop} ${r.outcome}\n`);
    }
  }));
  for (const dir of dirs) execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: ROOT });
}

// ------------------------------------------------------------------ report

export function compare(relocated, results) {
  const R = new Map(results.map(r => [r.id, r]));
  const rows = {};
  for (const m of relocated) {
    const t = rows[m.pop] ||= { n: 0, gone: 0, wasCaught: 0, applicable: 0, caughtBefore: 0, caughtNow: 0, lost: [], gained: [] };
    t.n++;
    const before = CAUGHT.has(m.was.final);
    if (before) t.wasCaught++;
    if (m.status === 'gone') { t.gone++; continue; }
    const r = R.get(m.id);
    if (!r) continue;
    t.applicable++;
    const now = CAUGHT.has(r.outcome);
    if (before) t.caughtBefore++;
    if (now) t.caughtNow++;
    if (before && !now) t.lost.push({ id: m.id, file: m.file, line: m.line, change: `${m.from} → ${m.to || '∅'}`, was: m.was.jsFail, now: r.outcome, jsFail: r.jsFail });
    if (!before && now) t.gained.push({ id: m.id, file: m.file, line: m.line, was: m.was.final, now: r.jsFail });
  }
  return rows;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'relocate') {
  const [base, record, out] = args;
  const rel = relocate(base, record);
  writeFileSync(out, JSON.stringify(rel, null, 1) + '\n');
  const c = {};
  for (const m of rel) c[`${m.pop} ${m.status}`] = (c[`${m.pop} ${m.status}`] || 0) + 1;
  console.log(c);
} else if (cmd === 'run') {
  const [rel, res, ...rest] = args;
  const opt = { workers: 3, only: null };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--workers') opt.workers = +rest[++i];
    if (rest[i] === '--only') opt.only = new Set(rest[++i].split(','));
  }
  run(rel, res, opt).catch(e => { console.error(e.message); process.exit(1); });
} else if (cmd === 'report') {
  const [rel, res] = args;
  const relocated = JSON.parse(readFileSync(rel, 'utf8'));
  const results = readFileSync(res, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  console.log(JSON.stringify(compare(relocated, results), null, 1));
}
