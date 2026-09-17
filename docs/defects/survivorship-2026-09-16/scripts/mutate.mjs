// The survivorship experiment's engine.
//   node mutate.mjs sample <seed> <nLib> <nApp> <nPy> > mutants.json
//   node mutate.mjs run <mutants.json> <results.jsonl> [from] [to]
import { readFileSync, writeFileSync, appendFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { walk } from './jslex-pos.mjs';

const S = '/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad';
const CLONE = join(S, 'mut');
const PRISTINE = '/home/twojandk/projects/read-the-game';

// ---------- seeded RNG ----------
function rng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- JS sites ----------
const SWAP = { '<': '<=', '<=': '<', '>': '>=', '>=': '>', '===': '!==', '!==': '===', '==': '!=', '!=': '==',
               '&&': '||', '||': '&&', '??': '||', '+': '-', '-': '+', '*': '/', '/': '*', '%': '*' };
const CLASS = op => ['<', '<=', '>', '>='].includes(op) ? 'boundary' : ['===', '!==', '==', '!='].includes(op) ? 'equality'
  : ['&&', '||', '??'].includes(op) ? 'logical' : op === '!' ? 'negation' : 'arithmetic';
function tokensOf(src) {
  const t = [];
  walk(src, x => { if (x.at != null && (x.t === 'op' || x.t === 'num')) t.push({ t: x.t, v: x.v, at: x.at, end: x.end }); });
  return t;
}
function jsSites(file) {
  const src = readFileSync(join(PRISTINE, file), 'utf8');
  const sites = [];
  for (const k of tokensOf(src)) {
    const text = src.slice(k.at, k.end);
    if (k.t === 'op') {
      if (text !== k.v) continue;                               // mis-positioned (template interior)
      if (SWAP[k.v]) {
        if ((k.v === '+' || k.v === '-') && (src[k.end] === '=' || src[k.end] === k.v || src[k.at - 1] === k.v)) continue; // += ++
        if (k.v === '/' ) continue;                              // regex/divide ambiguity: skip divides entirely
        sites.push({ file, at: k.at, from: k.v, to: SWAP[k.v], cls: CLASS(k.v) });
      } else if (k.v === '!' && src[k.end] !== '=') {
        sites.push({ file, at: k.at, from: '!', to: '', cls: 'negation' });
      }
    } else if (/^\d+(\.\d+)?$/.test(text)) {
      const n = Number(text);
      const to = Number.isInteger(n) ? String(n === 0 ? 1 : n === 1 ? 0 : n + 1) : String(+(n * 2).toFixed(6));
      sites.push({ file, at: k.at, from: text, to, cls: 'literal' });
    }
  }
  return sites.map(s => ({ ...s, line: src.slice(0, s.at).split('\n').length, lang: 'js' }));
}
function validJsMutant(file, m) {
  const src = readFileSync(join(PRISTINE, file), 'utf8');
  const mut = src.slice(0, m.at) + m.to + src.slice(m.at + m.from.length);
  const a = tokensOf(src).map(x => src.slice(x.at, x.end)), b = tokensOf(mut).map(x => mut.slice(x.at, x.end));
  if (m.to === '') return a.length === b.length + 1;
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
  return diff === 1;
}

// ---------- Python sites (the real tokenizer) ----------
function pySites(file) {
  const py = `
import tokenize, io, json, sys
src = open(sys.argv[1]).read()
lines = src.split('\\n'); offs=[0]
for l in lines: offs.append(offs[-1]+len(l)+1)
SW = {'<':'<=','<=':'<','>':'>=','>=':'>','==':'!=','!=':'==','+':'-','-':'+','*':'//','and':'or','or':'and'}
out=[]
for t in tokenize.generate_tokens(io.StringIO(src).readline):
    at = offs[t.start[0]-1]+t.start[1]
    if t.type == tokenize.OP and t.string in SW:
        cls = 'boundary' if t.string in '< <= > >=' .split() else 'equality' if t.string in ('==','!=') else 'arithmetic'
        out.append(dict(at=at, frm=t.string, to=SW[t.string], cls=cls, line=t.start[0]))
    elif t.type == tokenize.NAME and t.string in ('and','or'):
        out.append(dict(at=at, frm=t.string, to=SW[t.string], cls='logical', line=t.start[0]))
    elif t.type == tokenize.NAME and t.string == 'not':
        out.append(dict(at=at, frm='not ', to='', cls='negation', line=t.start[0]))
    elif t.type == tokenize.NUMBER and t.string.isdigit():
        n=int(t.string); out.append(dict(at=at, frm=t.string, to=str(1 if n==0 else 0 if n==1 else n+1), cls='literal', line=t.start[0]))
print(json.dumps(out))`;
  const r = spawnSync('python3', ['-c', py, join(PRISTINE, file)], { encoding: 'utf8' });
  return JSON.parse(r.stdout).map(s => ({ file, at: s.at, from: s.frm, to: s.to, cls: s.cls, line: s.line, lang: 'py' }));
}

function sample(seed, nLib, nApp, nPy) {
  const R = rng(seed);
  const pick = (sites, n, valid) => {
    const chosen = []; const pool = [...sites];
    while (chosen.length < n && pool.length) {
      const m = pool.splice(Math.floor(R() * pool.length), 1)[0];
      if (!valid || valid(m)) chosen.push(m);
    }
    return chosen;
  };
  const libFiles = [...readdirSync(join(PRISTINE, 'src/lib')).filter(f => f.endsWith('.js')).map(f => 'src/lib/' + f),
                    ...readdirSync(join(PRISTINE, 'src/lib/layers')).map(f => 'src/lib/layers/' + f)];
  const lib = libFiles.flatMap(jsSites), app = jsSites('src/app.js'), py = pySites('builders/extract.py');
  const v = m => validJsMutant(m.file, m);
  const vpy = m => readFileSync(join(PRISTINE, m.file), 'utf8').slice(m.at, m.at + m.from.length) === m.from;
  const out = [
    ...pick(lib, nLib, v).map(m => ({ ...m, pop: 'calculate' })),
    ...pick(app, nApp, v).map(m => ({ ...m, pop: 'display' })),
    ...pick(py, nPy, vpy).map(m => ({ ...m, pop: 'interpret' })),
  ].map((m, i) => ({ id: `s${seed}-${i + 1}`, kind: 'syntactic', ...m }));
  return { seed, sites: { calculate: lib.length, display: app.length, interpret: py.length }, mutants: out };
}

// ---------- running ----------
const sh = (cmd, t = 240) => {
  const r = spawnSync('bash', ['-lc', cmd], { cwd: CLONE, encoding: 'utf8', timeout: t * 1000, maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status === null ? 'TIMEOUT' : r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const BUILD = 'export PYTHONDONTWRITEBYTECODE=1; node builders/attribution.mjs >/dev/null && node builders/learn-doors.mjs >/dev/null && node builders/learn-figures.mjs >/dev/null && python3 builders/build_main.py >/dev/null && python3 builders/build_index.py >/dev/null && for b in build_gv build_3d; do python3 builders/$b.py >/dev/null || exit 1; done';

function apply(m) {
  const p = join(CLONE, m.file);
  const src = readFileSync(p, 'utf8');
  if (m.find != null) {                      // hand-written mutant: exact unique find/replace
    const n = src.split(m.find).length - 1;
    if (n !== 1) throw new Error(`find string occurs ${n} times in ${m.file}`);
    writeFileSync(p, src.replace(m.find, m.replace));
  } else {
    if (src.slice(m.at, m.at + m.from.length) !== m.from) throw new Error('site text moved');
    writeFileSync(p, src.slice(0, m.at) + m.to + src.slice(m.at + m.from.length));
  }
}
function restore() { sh('git checkout -q -- . && git clean -fdq -e .probe'); }
const failingFiles = out => [...new Set([...out.matchAll(/location: '.*?\/test\/([\w.-]+\.test\.js)/g)].map(x => x[1]))];

function runOne(m, base) {
  const r = { id: m.id, kind: m.kind, pop: m.pop, cls: m.cls, file: m.file, line: m.line, from: m.from, to: m.to, note: m.note };
  restore(); apply(m);
  const extra = (m.also || []); for (const x of extra) apply(x);
  for (const t of (m.removeTests || [])) sh(`rm -f ${t}`);
  const b = sh(BUILD, 120); r.build = b.code;
  if (b.code !== 0) { r.buildTail = b.out.slice(-300); }
  if (!m.probesOnly) {
  const js = sh('node --test test/*.test.js 2>&1', 240);
  r.js = js.code; r.jsFail = js.code === 0 ? [] : failingFiles(js.out);
  r.jsFailCount = (js.out.match(/^# fail (\d+)/m) || [])[1];
  }
  if (m.lang === 'py' || m.runPy) {
    const py = sh('PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s test -p "test_*.py" 2>&1', 240);
    r.py = py.code; r.pyFail = [...py.out.matchAll(/^(FAIL|ERROR): (\S+) \((\S+)\)/gm)].map(x => x[3]).slice(0, 5);
    for (const g of ['verify', 'validate', 'vocab']) r['extract_' + g] = sh(`python3 builders/extract.py --${g} >/dev/null 2>&1`, 180).code;
  }
  if (m.gates) {
    for (const g of ['refcheck', 'health -- --check', 'tiers -- --check', 'snapshots -- --check', 'corpus'])
      r['gate_' + g.split(' ')[0]] = sh(`npm run ${g} >/dev/null 2>&1`, 180).code;
  }
  if (m.lang !== 'py') {
    const nb = sh(`node ${S}/probe-numbers.mjs ${CLONE} ${S}/games/extract`, 180);
    try {
      const N = JSON.parse(nb.out);
      r.numChanged = Object.keys(base.numbers.components).filter(k => N.components[k] !== base.numbers.components[k]).length;
      r.numThrew = Object.values(N.components).filter(v => String(v).startsWith('THREW')).length;
      r.invBroken = Object.keys(base.numbers.invariants).filter(k => (N.invariants[k] || []).some(x => x === 0));
      r.numErrors = N.errors;
    } catch { r.numProbe = nb.code; }
    const killed = r.build !== 0 || r.js !== 0;
    if (!killed || m.alwaysBrowser) {
      const br = sh(`LD_LIBRARY_PATH=/tmp/rtg-pixels/libs/root/usr/lib/x86_64-linux-gnu node ${S}/probe-browser.mjs ${CLONE} ${S}/states.json`, 400);
      try {
        const B = JSON.parse(br.out).states;
        const ch = f => Object.keys(base.browser.states).filter(k => (B[k] || {})[f] !== base.browser.states[k][f]).length;
        r.domChanged = ch('dom'); r.textChanged = ch('text'); r.pxChanged = ch('px'); r.fullChanged = ch('full');
        r.pageErrors = Object.values(B).filter(x => (x.err || []).length || x.threw).length;
      } catch { r.browserProbe = br.code; }
      const baseStatic = JSON.parse(readFileSync(join(S, 'base-static.json'), 'utf8'));
      const sp = sh(`LD_LIBRARY_PATH=/tmp/rtg-pixels/libs/root/usr/lib/x86_64-linux-gnu node ${S}/probe-static.mjs ${CLONE}/src ${S}/static-work`, 200);
      try {
        const B = JSON.parse(sp.out).states;
        const ch = f => Object.keys(baseStatic.states).filter(k => (B[k] || {})[f] !== baseStatic.states[k][f]);
        r.sDom = ch('dom').length; r.sText = ch('text').length; r.sPx = ch('px').length;
        r.sPages = [...new Set([...ch('dom'), ...ch('px')].map(k => k.split('/')[1]))];
      } catch { r.staticProbe = sp.code; }
    }
  }
  restore();
  return r;
}

// Re-plant a mutant, rebuild, and run ONLY the static-page probe.
function staticOne(m, baseStatic) {
  restore(); apply(m); for (const x of (m.also || [])) apply(x);
  const b = sh(BUILD, 120);
  const r = { id: m.id, build: b.code };
  const p = sh(`LD_LIBRARY_PATH=/tmp/rtg-pixels/libs/root/usr/lib/x86_64-linux-gnu node ${S}/probe-static.mjs ${CLONE}/src ${S}/static-work`, 200);
  try {
    const B = JSON.parse(p.out).states;
    const ch = f => Object.keys(baseStatic.states).filter(k => (B[k] || {})[f] !== baseStatic.states[k][f]);
    r.sDom = ch('dom').length; r.sText = ch('text').length; r.sPx = ch('px').length; r.sPages = [...new Set(ch('dom').map(k => k.split('/')[1]))];
  } catch { r.staticProbe = p.code; }
  restore();
  return r;
}
const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'static') {
  const [file, outFile] = args;
  const ids = new Set(args.slice(2));
  const baseStatic = JSON.parse(readFileSync(join(S, 'base-static.json'), 'utf8'));
  for (const m of JSON.parse(readFileSync(file, 'utf8')).mutants.filter(m => ids.has(m.id))) {
    const r = staticOne(m, baseStatic);
    appendFileSync(outFile, JSON.stringify(r) + '\n');
    console.log(m.id, 'static dom', r.sDom, 'text', r.sText, 'px', r.sPx, (r.sPages || []).join(','));
  }
}
if (cmd === 'sample') {
  process.stdout.write(JSON.stringify(sample(+args[0], +args[1], +args[2], +args[3]), null, 1));
} else if (cmd === 'run') {
  const [file, resultsFile, from = 0, to = 1e9] = args;
  const list = JSON.parse(readFileSync(file, 'utf8')).mutants.slice(+from, +to);
  const base = { numbers: JSON.parse(readFileSync(join(S, 'base-numbers.json'), 'utf8')),
                 browser: JSON.parse(readFileSync(join(S, 'base-browser.json'), 'utf8')) };
  const done = new Set(existsSync(resultsFile) ? readFileSync(resultsFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).id) : []);
  for (const m of list) {
    if (done.has(m.id)) continue;
    let r; try { r = runOne(m, base); } catch (e) { restore(); r = { id: m.id, error: String(e.message) }; }
    appendFileSync(resultsFile, JSON.stringify(r) + '\n');
    console.log(new Date().toISOString().slice(11, 19), m.id, m.pop, m.file + ':' + m.line, `${m.from}→${m.to}`, 'build', r.build, 'js', r.js, 'num', r.numChanged, 'vis', r.textChanged ?? '-', r.pxChanged ?? '-');
  }
}
