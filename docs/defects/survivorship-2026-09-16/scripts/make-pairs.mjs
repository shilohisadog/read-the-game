// Builds Kevin's blind review sheet: screenshot pairs and published-value pairs, A/B in random order.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, symlinkSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const { chromium } = await import('/tmp/rtg-pixels/node_modules/playwright/index.mjs');

const S = '/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad';
const CLONE = join(S, 'mut');
const REPO = '/home/twojandk/projects/read-the-game';
const OUT = join(REPO, 'docs/defects/review-2026-09-16');
const IMG = join(OUT, 'img');
const sh = (cmd, cwd = CLONE) => spawnSync('bash', ['-lc', cmd], { cwd, encoding: 'utf8', timeout: 300000 });
const BUILD = 'export PYTHONDONTWRITEBYTECODE=1; node builders/attribution.mjs >/dev/null && node builders/learn-doors.mjs >/dev/null && node builders/learn-figures.mjs >/dev/null && python3 builders/build_main.py >/dev/null && python3 builders/build_index.py >/dev/null && for b in build_gv build_3d; do python3 builders/$b.py >/dev/null || exit 1; done';
const restore = () => sh('git checkout -q -- . && git clean -fdq -e .probe');
const apply = m => {
  for (const x of [m, ...(m.also || [])]) {
    const p = join(CLONE, x.file); const s = readFileSync(p, 'utf8');
    if (x.find != null) { if (s.split(x.find).length !== 2) throw new Error('find not unique ' + x.id); writeFileSync(p, s.replace(x.find, x.replace)); }
    else if (x === m) { if (s.slice(m.at, m.at + m.from.length) !== m.from) throw new Error('site moved ' + m.id); writeFileSync(p, s.slice(0, m.at) + m.to + s.slice(m.at + m.from.length)); }
  }
};
let seed = 20260916; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const states = JSON.parse(readFileSync(join(S, 'states.json'), 'utf8'));
const STATIC = ['empty-net', 'faceoffs', 'icing', 'offside', 'penalties', 'slot', 'goalie-eye-view', 'what-you-can-see', 'workshop'];
const b = await chromium.launch({ channel: 'chromium' });

async function captureAll(tag) {
  const dir = join(S, 'cap', tag); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const strip = f => readFileSync(join(CLONE, 'src', f), 'utf8').replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
  writeFileSync(join(dir, 'app.html'), strip('read-the-game.html'));
  for (const p of STATIC) writeFileSync(join(dir, p + '.html'), strip(p + '.html'));
  const shots = {};
  for (const [vw, vh] of [[1400, 900], [844, 390]]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    const targets = [...states.map((s, k) => ({ key: `replay${k}`, url: 'app.html' + s, label: s || '(opening frame)' })),
                     ...STATIC.map(p => ({ key: p, url: p + '.html', label: p }))];
    for (const t of targets) {
      await pg.goto('file://' + join(dir, t.url), { waitUntil: 'load', timeout: 20000 });
      await pg.waitForTimeout(250);
      const buf = await pg.screenshot({ fullPage: true, animations: 'disabled' });
      shots[`${vw}-${t.key}`] = { buf, label: `${vw}×${vh} · ${t.label}` };
    }
    await ctx.close();
  }
  return shots;
}

// Crop both images to the bounding box of their pixel difference (+ margin), in a real canvas.
async function cropPair(bufA, bufB, pad = 60) {
  const ctx = await b.newContext(); const pg = await ctx.newPage();
  const res = await pg.evaluate(async ([a, c, pad]) => {
    const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + src; });
    const [ia, ib] = await Promise.all([load(a), load(c)]);
    const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
    const grab = img => { const cv = new OffscreenCanvas(w, h); const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const da = grab(ia), db = grab(ib);
    let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4;
      if (da[k] !== db[k] || da[k + 1] !== db[k + 1] || da[k + 2] !== db[k + 2]) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = Math.min(w, 700) - 1; y1 = Math.min(h, 400) - 1; }
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    // a sliver has no context: at least 700x350, centred on the change, clamped to the image
    const grow = (a, b, min, lim) => { const need = min - (b - a + 1); if (need <= 0) return [a, b];
      let na = a - Math.floor(need / 2), nb = b + Math.ceil(need / 2);
      if (na < 0) { nb -= na; na = 0; } if (nb > lim - 1) { na -= nb - (lim - 1); nb = lim - 1; } return [Math.max(0, na), nb]; };
    [x0, x1] = grow(x0, x1, 700, w); [y0, y1] = grow(y0, y1, 350, h);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, scale = Math.min(1, 900 / cw, 700 / ch);
    const out = async img => { const cv = new OffscreenCanvas(Math.round(cw * scale), Math.round(ch * scale)); const g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, x0, y0, cw, ch, 0, 0, cv.width, cv.height);
      const blob = await cv.convertToBlob({ type: 'image/png' }); const ab = new Uint8Array(await blob.arrayBuffer());
      let s = ''; for (const v of ab) s += String.fromCharCode(v); return btoa(s); };
    return { diffPixels: n, box: [x0, y0, cw, ch], a: await out(ia), b: await out(ib) };
  }, [bufA.toString('base64'), bufB.toString('base64'), pad]);
  await ctx.close();
  return { ...res, a: Buffer.from(res.a, 'base64'), b: Buffer.from(res.b, 'base64') };
}

function publishJson(tag) {
  const w = join(S, 'pubjson', tag); rmSync(w, { recursive: true, force: true }); mkdirSync(w, { recursive: true });
  symlinkSync(join(S, 'games/extract'), join(w, 'extract'));
  sh(`node builders/measure.mjs --out ${w}`);
  const o = {}; for (const f of ['measures.json', 'teams.json']) o[f] = JSON.parse(readFileSync(join(w, f), 'utf8'));
  return o;
}
function leaves(v, p = '', out = {}) {
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) leaves(x, p ? `${p}.${k}` : k, out);
  else out[p] = v;
  return out;
}

// ------------------------------------------------------------------------------------------------
const M = {};
for (const f of ['mutants-A.json', 'mutants-B.json', 'mutants-hand.json']) for (const m of JSON.parse(readFileSync(join(S, f), 'utf8')).mutants) M[m.id] = m;
const VISUAL = ['s20260916-18', 's20260916-22', 's20260916-39', 's20260916-54', 's20260916-100',
                's916-2', 's916-5', 's916-7', 's916-9', 's916-10', 's916-60', 's916-26', 'BC3', 'NULL'];
const NUMBERS = ['s20260916-3', 's20260916-19', 's20260916-20', 's916-3', 's916-4'];

rmSync(OUT, { recursive: true, force: true }); mkdirSync(IMG, { recursive: true });
restore(); if (sh(BUILD).status !== 0) throw new Error('clean build failed');
const base = await captureAll('clean');
const basePub = publishJson('clean');

// shuffle items so ids do not reveal kind; keep controls mixed in
const items = [...VISUAL].sort(() => rnd() - 0.5);
const key = [];
let n = 0;
const md = [];
for (const id of items) {
  n++;
  let shots = base, picked = null;
  if (id !== 'NULL') {
    restore(); apply(M[id]);
    if (sh(BUILD).status !== 0) throw new Error('build failed for ' + id);
    shots = await captureAll(id);
    restore();
    const changed = Object.keys(base).filter(k => !base[k].buf.equals(shots[k].buf));
    picked = changed.find(k => k.startsWith('1400')) || changed[0];
    if (!picked) throw new Error('no changed capture for ' + id);
  } else {
    picked = '1400-replay10';
  }
  const pair = await cropPair(base[picked].buf, shots[picked].buf);
  const mutantIsA = rnd() < 0.5;
  writeFileSync(join(IMG, `v${n}-A.png`), mutantIsA ? pair.b : pair.a);
  writeFileSync(join(IMG, `v${n}-B.png`), mutantIsA ? pair.a : pair.b);
  key.push({ item: `V${n}`, id, planted: id === 'NULL' ? 'neither (identical)' : (mutantIsA ? 'A' : 'B'), capture: picked, diffPixels: pair.diffPixels, box: pair.box });
  md.push(`### V${n}. ${base[picked].label}`, '', '| A | B |', '|---|---|', `| ![A](img/v${n}-A.png) | ![B](img/v${n}-B.png) |`, '',
          'Differ? → ', 'If they differ — is one of them wrong, and which? → ', '');
  console.log('visual', n, id, picked, pair.diffPixels);
}
const nmd = [];
let k2 = 0;
for (const id of NUMBERS) {
  k2++;
  restore(); apply(M[id]);
  const mp = publishJson(id); restore();
  const rows = [];
  for (const f of ['measures.json', 'teams.json']) {
    const la = leaves(basePub[f]), lb = leaves(mp[f]);
    for (const p of new Set([...Object.keys(la), ...Object.keys(lb)])) if (JSON.stringify(la[p]) !== JSON.stringify(lb[p])) rows.push([`${f} → ${p}`, la[p], lb[p]]);
  }
  const mutantIsA = rnd() < 0.5;
  key.push({ item: `N${k2}`, id, planted: mutantIsA ? 'A' : 'B', differing: rows.length });
  nmd.push(`### N${k2}. ${rows.length} published value(s) differ${rows.length > 8 ? ' — the first 8 shown' : ''}`, '', '| published figure | A | B |', '|---|---|---|');
  for (const [p, clean, mut] of rows.slice(0, 8)) {
    const [a, bb] = mutantIsA ? [mut, clean] : [clean, mut];
    nmd.push(`| \`${p}\` | ${JSON.stringify(a)} | ${JSON.stringify(bb)} |`);
  }
  nmd.push('', 'Is one of these plainly wrong, and which? → ', '');
  console.log('number', k2, id, rows.length);
}
await b.close();
restore();

const head = [
  '# Review sheet — what the planted defects actually changed', '',
  '**For Kevin. 2026-09-16. Blind.** Each item is a pair, **A** and **B**, in random order: one is the site as it is, the other has a small defect planted in the code. You are not told which. One visual pair is a control with **no** difference at all, and one is a control with a deliberate one.', '',
  '**Visual items** are cropped to the region where the two screenshots differ (with a margin), taken in real Chrome from the built site. Answer two things: *do they differ?* (`y` / `n` / `?`) and, if so, *is one of them wrong — `A`, `B`, `neither` (just different), or `?`*.', '',
  '**Number items** are values from `measures.json` / `teams.json` — the documents the site publishes — computed over 52 real games. Answer: *is one of them plainly wrong — `A`, `B`, `neither`, or `?`*. "I can\'t tell without context" is a useful answer.', '',
  '---', '', '## Visual', '',
];
writeFileSync(join(OUT, 'review.md'), [...head, ...md, '---', '', '## Published numbers', '', ...nmd].join('\n'));
writeFileSync(join(S, 'review-key-SEALED.json'), JSON.stringify(key, null, 1));
console.log('done', OUT);
