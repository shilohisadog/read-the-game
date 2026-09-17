/**
 * THE REVIEW GALLERY — what a batch of commits changed on the pages a visitor
 * opens, found by a machine and put in front of a person to JUDGE.
 *
 * ⭐⭐ WHY THE MACHINE SPOTS AND THE PERSON JUDGES. Kevin's blind review of
 * planted defects (docs/survivorship-experiment.md §5) measured both halves:
 * he NOTICED 7 of 13 visual differences — missing a one-word change and a
 * 4,214px one while catching a 21px one — and, once he had noticed one, picked
 * the wrong side 6 of 7 times. A person is a poor spotter and a good judge. So
 * this tool does the spotting exhaustively and asks one question per
 * difference: is the AFTER side wrong?
 *
 * WHAT IT RENDERS. The committed `src/` of two commits — BASE (the last batch
 * reviewed, `docs/reviews/LAST`) and HEAD — in real Chromium, every page, at a
 * laptop and a phone-landscape viewport; the game page at the step-3 replay
 * states on the reference game. The pages are served BYTE FOR BYTE as
 * committed, CSP included: requests to readthegame.co are answered from
 * `git show`, requests to the data origin from ONE snapshot shared by both
 * sides. ⭐ So every difference on the sheet is the CODE'S — the data cannot
 * move between the two renders, because it is the same bytes.
 *
 * ⚠️ WHAT IT CANNOT SEE, so a clean sheet is not read as more than it is:
 *   - a changed NUMBER — both sides get the same published data; the figures
 *     change at the weekly derive, and are gated by tools/published_ranges.py;
 *   - states no walk visits — a click, a gesture, a non-default figure style
 *     (docs/test-program.md §7.2 — a walk is evidence about the states it visited);
 *   - motion — the clock is paused, advanced the same 10 s on both sides, and
 *     one frame is shot.
 *
 * ⭐ IT CHECKS ITSELF ON EVERY STATE: HEAD is rendered twice, and a state that
 * differs from itself is NOT put to the judge — it is listed as one the tool
 * could not compare. ⛔ This was a one-in-five sample until batch 1, where
 * `terrain-3d.html` (a WebGL chart redrawn every animation frame) differed from
 * itself on 3 of 3 re-runs, fell outside the sample, and reached the sheet as a
 * question about a page no commit had touched. A sampled self-check is evidence
 * about the states it sampled.
 *
 * NOT A DEPENDENCY. Playwright lives in the scratch directory tools/pixels.sh
 * installs (RTG_PIXELS_WORK, default /tmp/rtg-pixels) and is imported only when
 * a run starts; package.json stays at zero. `test/gallery.test.js` imports the
 * arithmetic — the diff, the grouping, the walk — which needs no browser.
 *
 *   node tools/gallery.mjs                      LAST..HEAD → docs/reviews/<today>/
 *   node tools/gallery.mjs BASE HEAD            an explicit range
 *     --out DIR                                 where the sheet goes
 *     --only PATTERN                            states whose key contains PATTERN
 *     --plant FILE::OLD::NEW                    replace OLD with NEW in HEAD's FILE
 *                                               (proof runs only; repeatable)
 *     --strip-csp                               both sides, for a plant inside a
 *                                               hashed <style>/<script>
 *     --keep                                    also save every full-page capture
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const WORK = process.env.RTG_PIXELS_WORK || '/tmp/rtg-pixels';
const SITE = 'https://readthegame.co';
const DATA = 'https://data.readthegame.co';
/** The learn doors' reference game (MIN at BUF), and the game step 3's states were written for. */
export const GAME = '2023020204';
export const VIEWPORTS = [[1400, 900], [844, 390]];

/**
 * The step-3 replay states (docs/defects/survivorship-2026-09-16/data/states.json),
 * read from the record rather than restated, so the gallery walks exactly what the
 * survivorship probes walked on the game page.
 */
export function gameStates() {
  const raw = JSON.parse(readFileSync(join(ROOT,
    'docs/defects/survivorship-2026-09-16/data/states.json'), 'utf8'));
  return raw.map(s => `game.html?game=${GAME}${s ? '&' + s.slice(1) : ''}`);
}

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'buffer', maxBuffer: 1 << 28 });
const gitText = (...a) => git(...a).toString('utf8').trim();

/** Every page either side ships, so a page added or deleted in the batch is walked too. */
export function pagesOf(commit) {
  return gitText('ls-tree', '--name-only', commit, 'src/')
    .split('\n').map(p => p.replace(/^src\//, '')).filter(p => p.endsWith('.html'));
}

export function statesFor(pages) {
  const out = [];
  for (const p of [...pages].sort()) {
    if (p === 'game.html') out.push(...gameStates());
    else out.push(p);
  }
  return out;
}

/** A URL path on the site → the file in `src/` that Cloudflare Pages would serve. */
export function fileFor(pathname) {
  let p = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (p === '' || p.endsWith('/')) p += 'index.html';
  if (!/\.[a-z0-9]+$/i.test(p)) p += '.html';
  return p;
}

// ------------------------------------------------------------------ diffing

/** Line diff by longest common subsequence: [{op:' '|'-'|'+', line}]. */
export function lineDiff(a, b) {
  const A = a.split('\n'), B = b.split('\n');
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ op: ' ', line: A[i] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push({ op: '-', line: A[i++] });
    else out.push({ op: '+', line: B[j++] });
  }
  while (i < n) out.push({ op: '-', line: A[i++] });
  while (j < m) out.push({ op: '+', line: B[j++] });
  return out;
}

/** Only the changed lines, with one line of context, as a unified-ish block. */
export function hunks(diff, context = 1) {
  const keep = new Set();
  diff.forEach((d, k) => {
    if (d.op !== ' ') for (let c = k - context; c <= k + context; c++) keep.add(c);
  });
  const lines = [];
  let last = -2;
  diff.forEach((d, k) => {
    if (!keep.has(k)) return;
    if (k !== last + 1 && lines.length) lines.push('…');
    lines.push(`${d.op} ${d.line}`);
    last = k;
  });
  return lines.join('\n');
}

const setDiff = (a, b) => ({ added: [...b].filter(x => !a.has(x)).sort(),
                             removed: [...a].filter(x => !b.has(x)).sort() });

/**
 * One state's two captures → what differs. Pixels are compared separately (in
 * the browser, where the PNGs can be decoded without a dependency).
 */
export function compareCaptures(a, b) {
  const text = a.text === b.text ? null : hunks(lineDiff(a.text, b.text));
  const dom = a.domHash === b.domHash ? null : {
    ids: setDiff(new Set(a.ids), new Set(b.ids)),
    classes: setDiff(new Set(a.classes), new Set(b.classes)),
  };
  const errs = setDiff(new Set(a.errors), new Set(b.errors));
  return { text, dom, errors: errs.added.length || errs.removed.length ? errs : null };
}

// ----------------------------------------------------------------- the browser

async function launch() {
  const pw = join(WORK, 'node_modules/playwright/index.mjs');
  if (!existsSync(pw)) {
    throw new Error(`Playwright is not installed in ${WORK} — run tools/pixels.sh once, which installs it there (never into the repo)`);
  }
  const { chromium } = await import(pw);
  const libs = join(WORK, 'libs/root/usr/lib/x86_64-linux-gnu');
  return chromium.launch({ channel: 'chromium',
    env: { ...process.env, LD_LIBRARY_PATH: `${libs}:${process.env.LD_LIBRARY_PATH || ''}` } });
}

/**
 * A render context for one commit. Site requests are answered from `git show`;
 * data requests from the shared snapshot (fetched once, on first ask, so the
 * tool never has to predict which documents a page reads — tools/pixels.sh
 * learned that twice); every other host is refused and recorded.
 */
async function sideContext(browser, { commit, vp, snap, plants, stripCsp, time }) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] },
    deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' });
  /* ⛔ `install` ALONE DOES NOT STOP TIME — the fake clock still flows in real
     time between the steps below, so how many animation frames a page ran
     depended on how long a screenshot took. Found on terrain-3d.html, which turns
     a little every frame: 5 renders gave 3 different images and once a different
     angle; paused, 10 of 10 were identical. Paused, the only time that passes is
     the `runFor` below, the same on both sides. */
  await ctx.clock.install({ time: time - 1000 });
  await ctx.clock.pauseAt(time);
  const blocked = new Set();
  const missing = new Set();
  await ctx.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === SITE) {
      const file = fileFor(url.pathname);
      let body;
      try { body = git('show', `${commit}:src/${file}`); }
      catch { missing.add(file); return route.fulfill({ status: 404, body: 'not in this commit' }); }
      if (file.endsWith('.html')) {
        let s = body.toString('utf8');
        if (stripCsp) s = s.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
        for (const p of plants.filter(p => p.file === file)) {
          if (!s.includes(p.old)) throw new Error(`plant: "${p.old}" is not in ${file} at ${commit}`);
          s = s.replace(p.old, p.new);
        }
        body = Buffer.from(s, 'utf8');
      }
      const type = file.endsWith('.html') ? 'text/html; charset=utf-8'
        : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css'
        : file.endsWith('.json') ? 'application/json' : 'application/octet-stream';
      return route.fulfill({ status: 200, contentType: type, body });
    }
    if (url.origin === DATA) {
      const key = url.pathname.replace(/^\/+/, '');
      if (!snap.docs.has(key)) {
        const r = await fetch(url.href);
        snap.docs.set(key, { status: r.status, body: Buffer.from(await r.arrayBuffer()),
                             type: r.headers.get('content-type') || 'application/json' });
      }
      const d = snap.docs.get(key);
      return route.fulfill({ status: d.status, contentType: d.type, body: d.body,
        headers: { 'access-control-allow-origin': '*' } });
    }
    blocked.add(url.host);
    return route.abort();
  });
  return { ctx, blocked, missing };
}

/** Load a state, let it settle on the fake clock, and capture what a visitor would see. */
async function capture(ctx, key) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + String(e.message).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });
  await page.goto(`${SITE}/${key}`, { waitUntil: 'load', timeout: 30000 });
  // Fetches resolve on the real network; timers wait for the fake clock. Alternate
  // until both are quiet, the same number of steps on both sides.
  for (let i = 0; i < 4; i++) {
    await page.waitForLoadState('networkidle').catch(() => {});
    await ctx.clock.runFor(2500);
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  const frames = [];
  for (const f of page.frames()) {
    try {
      frames.push(await f.evaluate(() => {
        const body = document.body;
        if (!body) return null;
        const clone = body.cloneNode(true);
        clone.querySelectorAll('script').forEach(s => s.remove());
        const ids = [...body.querySelectorAll('[id]')].map(e => e.id);
        const classes = [...new Set([...body.querySelectorAll('[class]')]
          .flatMap(e => [...e.classList]))];
        return { url: location.pathname, text: body.innerText,
                 dom: clone.outerHTML, ids, classes };
      }));
    } catch { /* a frame that navigated away mid-capture has nothing to say */ }
  }
  const got = frames.filter(Boolean);
  const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  const tag = (f, i) => i === 0 ? '' : `[frame ${f.url}] `;
  return {
    text: got.map((f, i) => (i ? `\n── inside the frame ${f.url} ──\n` : '') + f.text).join(''),
    domHash: createHash('sha1').update(got.map(f => f.dom).join('\0')).digest('hex'),
    ids: got.flatMap((f, i) => f.ids.map(x => tag(f, i) + '#' + x)),
    classes: got.flatMap((f, i) => f.classes.map(x => tag(f, i) + '.' + x)),
    errors: [...new Set(errors)],
    png,
  };
}

/**
 * ⭐ WHEN A PAGE CHANGES HEIGHT, EVERYTHING BELOW THE CHANGE MOVES — and a
 * comparison by position calls all of it changed. Batch 1's front door lost 23px
 * of hero text at 844×390 and the sheet showed 22% of the page as one 1,960px
 * crop of content that had only slid up. So rows are aligned first, by content:
 * `a` and `b` are one hash per pixel row, and what comes back is the runs of rows
 * that have NO counterpart — [{a0, a1, b0, b1}], half-open, in each image's own
 * coordinates. A run that exists on one side only has a0 === a1 or b0 === b1.
 */
export function rowBands(a, b, { gap = 30, limit = 4000 } = {}) {
  const n = a.length, m = b.length;
  let p = 0;
  while (p < n && p < m && a[p] === b[p]) p++;
  let q = 0;
  while (q < n - p && q < m - p && a[n - 1 - q] === b[m - 1 - q]) q++;
  const A = a.slice(p, n - q), B = b.slice(p, m - q);
  if (!A.length && !B.length) return [];
  if (A.length > limit || B.length > limit) return [{ a0: p, a1: n - q, b0: p, b1: m - q }];
  const L = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--)
    for (let j = B.length - 1; j >= 0; j--)
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const bands = [];
  let i = 0, j = 0, open = null;
  const close = () => { if (open) { bands.push(open); open = null; } };
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { close(); i++; j++; continue; }
    if (!open) open = { a0: p + i, a1: p + i, b0: p + j, b1: p + j };
    if (j >= B.length || (i < A.length && L[i + 1][j] >= L[i][j + 1])) open.a1 = p + ++i;
    else open.b1 = p + ++j;
  }
  close();
  // Runs a few matched rows apart are one change — a line of blank background
  // between two edited lines is not a reason to ask twice.
  const merged = [];
  for (const band of bands) {
    const last = merged[merged.length - 1];
    if (last && band.a0 - last.a1 < gap && band.b0 - last.b1 < gap) { last.a1 = band.a1; last.b1 = band.b1; }
    else merged.push({ ...band });
  }
  return merged;
}

/**
 * ⛔ AND ALIGNMENT IS NOT ENOUGH, because a page rarely moves by whole pixels.
 * Batch 1's content below the hero moved by 22 and then 23 rows — a fractional
 * shift — so its text was re-antialiased and matched nothing: 17 bands, each
 * differing by up to 240 of 255 on thousands of pixels, as strongly as the real
 * change. NO THRESHOLD SEPARATES THAT FROM A REAL EDIT, so none is used. The
 * split is structural: a band at a NONZERO offset whose height is unchanged (to
 * the row a fractional shift rounds by) only moved.
 * ⚠️ The price, stated on every sheet that pays it: a style change INSIDE content
 * that also moved looks exactly like this and is not shown. Its words are still
 * compared, by the text diff.
 */
export function splitMoved(bands) {
  const moved = [], changed = [];
  for (const x of bands) {
    const same = Math.abs((x.a1 - x.a0) - (x.b1 - x.b0)) <= 1;
    (same && x.b0 !== x.a0 ? moved : changed).push(x);
  }
  return { moved, changed };
}

/**
 * Decode two PNGs in a blank page and find where they differ: the changed-pixel
 * count, up to three regions (changed 20px cells, joined when they touch), and
 * before/after crops of each with the changed box outlined on both.
 */
async function comparePixels(lab, a, b) {
  return lab.evaluate(async ([A, B, BANDS, SPLIT]) => {
    const load = async b64 => createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
    const [ia, ib] = await Promise.all([load(A), load(B)]);
    const W = Math.max(ia.width, ib.width), H = Math.max(ia.height, ib.height);
    const paint = img => {
      const c = new OffscreenCanvas(W, H), g = c.getContext('2d');
      g.fillStyle = '#ff00ff'; g.fillRect(0, 0, W, H);        // outside a shorter page
      g.drawImage(img, 0, 0);
      return { c, d: g.getImageData(0, 0, W, H).data };
    };
    const pa = paint(ia), pb = paint(ib);
    const toB64 = async c => {
      const blob = await c.convertToBlob({ type: 'image/png' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    };
    if (ia.height !== ib.height && ia.width === ib.width) {
      const rowBands = (0, eval)('(' + BANDS + ')'), splitMoved = (0, eval)('(' + SPLIT + ')');
      const hashes = (img, h) => {
        const g = new OffscreenCanvas(W, h).getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, W, h).data, out = new Array(h);
        for (let y = 0; y < h; y++) {
          let x = 2166136261;
          for (let o = y * W * 4, e = o + W * 4; o < e; o++) x = Math.imul(x ^ d[o], 16777619);
          out[y] = x >>> 0;
        }
        return { d, out };
      };
      const ha = hashes(ia, ia.height), hb = hashes(ib, ib.height);
      const split = splitMoved(rowBands(ha.out, hb.out));
      const bands = split.changed.sort((p, q) =>
        Math.max(q.a1 - q.a0, q.b1 - q.b0) - Math.max(p.a1 - p.a0, p.b1 - p.b0));
      const rows = bands.reduce((t, x) => t + Math.max(x.a1 - x.a0, x.b1 - x.b0), 0);
      const result = { changed: rows * W, rows, aligned: true, total: W * H,
                       moved: split.moved.length,
                       movedRows: split.moved.reduce((t, x) => t + (x.b1 - x.b0), 0),
                       sizeA: [ia.width, ia.height], sizeB: [ib.width, ib.height], regions: [],
                       more: Math.max(0, bands.length - 3) };
      const PAD = 140, scale = Math.min(1, 1000 / W);
      const crop = (img, h0, h1, full) => {
        const top = Math.max(0, h0 - PAD), bot = Math.min(full, h1 + PAD);
        const c = new OffscreenCanvas(Math.round(W * scale), Math.max(1, Math.round((bot - top) * scale)));
        const g = c.getContext('2d');
        g.drawImage(img, 0, top, W, bot - top, 0, 0, c.width, c.height);
        g.strokeStyle = '#e0115f'; g.lineWidth = 2;
        g.strokeRect(1, (h0 - top) * scale + 1, c.width - 2, Math.max(2, (h1 - h0) * scale - 2));
        return c;
      };
      for (const x of bands.slice(0, 3)) {
        result.regions.push({ x: 0, y: x.b0, w: W, h: x.b1 - x.b0, beforeRows: [x.a0, x.a1],
          before: await toB64(crop(ia, x.a0, x.a1, ia.height)), after: await toB64(crop(ib, x.b0, x.b1, ib.height)) });
      }
      return result;
    }
    const CELL = 20, cw = Math.ceil(W / CELL), ch = Math.ceil(H / CELL);
    const cells = new Uint8Array(cw * ch);
    let changed = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (pa.d[o] !== pb.d[o] || pa.d[o + 1] !== pb.d[o + 1] || pa.d[o + 2] !== pb.d[o + 2]) {
        changed++; cells[((y / CELL) | 0) * cw + ((x / CELL) | 0)] = 1;
      }
    }
    const result = { changed, total: W * H, sizeA: [ia.width, ia.height], sizeB: [ib.width, ib.height], regions: [] };
    if (!changed) return result;
    // Connected groups of changed cells, touching within two cells, as boxes.
    const seen = new Uint8Array(cw * ch), boxes = [];
    for (let s = 0; s < cells.length; s++) {
      if (!cells[s] || seen[s]) continue;
      const stack = [s]; seen[s] = 1;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
      while (stack.length) {
        const k = stack.pop(), cx = k % cw, cy = (k / cw) | 0; n++;
        x0 = Math.min(x0, cx); y0 = Math.min(y0, cy); x1 = Math.max(x1, cx); y1 = Math.max(y1, cy);
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
          const nk = ny * cw + nx;
          if (cells[nk] && !seen[nk]) { seen[nk] = 1; stack.push(nk); }
        }
      }
      boxes.push({ x: x0 * CELL, y: y0 * CELL, w: Math.min(W, (x1 + 1) * CELL) - x0 * CELL,
                   h: Math.min(H, (y1 + 1) * CELL) - y0 * CELL, cells: n });
    }
    boxes.sort((p, q) => q.w * q.h - p.w * p.h);
    const MAXW = 1000, PAD = 140;   // enough of the page around a change to tell WHERE it is
    for (const bx of boxes.slice(0, 3)) {
      const x = Math.max(0, bx.x - PAD), y = Math.max(0, bx.y - PAD);
      const w = Math.min(W, bx.x + bx.w + PAD) - x, h = Math.min(H, bx.y + bx.h + PAD) - y;
      const scale = Math.min(1, MAXW / w, 1400 / h);
      const crop = src => {
        const c = new OffscreenCanvas(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
        const g = c.getContext('2d');
        g.drawImage(src.c, x, y, w, h, 0, 0, c.width, c.height);
        g.strokeStyle = '#e0115f'; g.lineWidth = 2;
        g.strokeRect((bx.x - x) * scale + 1, (bx.y - y) * scale + 1, bx.w * scale - 2, bx.h * scale - 2);
        return c;
      };
      result.regions.push({ x: bx.x, y: bx.y, w: bx.w, h: bx.h,
                            before: await toB64(crop(pa)), after: await toB64(crop(pb)) });
    }
    result.more = Math.max(0, boxes.length - 3);
    return result;
  }, [a.toString('base64'), b.toString('base64'), rowBands.toString(), splitMoved.toString()]);
}

// -------------------------------------------------------------------- the run

function parseArgs(argv) {
  const o = { plants: [], stripCsp: false, only: null, out: null, keep: false, pos: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--only') o.only = argv[++i];
    else if (a === '--strip-csp') o.stripCsp = true;
    else if (a === '--keep') o.keep = true;
    else if (a === '--plant') {
      const [file, old, neu] = argv[++i].split('::');
      if (neu === undefined) throw new Error('--plant wants FILE::OLD::NEW');
      o.plants.push({ file, old, new: neu });
    } else o.pos.push(a);
  }
  return o;
}

const vpName = vp => `${vp[0]}×${vp[1]}`;

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const lastFile = join(ROOT, 'docs/reviews/LAST');
  const baseRef = o.pos[0] || (existsSync(lastFile) ? readFileSync(lastFile, 'utf8').trim() : null);
  if (!baseRef) throw new Error('no BASE given and docs/reviews/LAST does not exist');
  const base = gitText('rev-parse', '--verify', `${baseRef}^{commit}`);
  const head = gitText('rev-parse', '--verify', `${o.pos[1] || 'HEAD'}^{commit}`);
  const today = new Date().toISOString().slice(0, 10);
  const out = o.out || join(ROOT, 'docs/reviews', today);
  mkdirSync(join(out, 'img'), { recursive: true });

  const pages = [...new Set([...pagesOf(base), ...pagesOf(head)])];
  let states = statesFor(pages);
  if (o.only) states = states.filter(s => s.includes(o.only));
  const time = Date.now();
  const snap = { docs: new Map() };
  const browser = await launch();
  const lab = await (await browser.newContext()).newPage();
  const started = Date.now();
  const results = [];
  const blocked = new Set(), missing = { base: new Set(), head: new Set() };
  const noise = [];

  for (const vp of VIEWPORTS) {
    const sides = {
      base: await sideContext(browser, { commit: base, vp, snap, plants: [], stripCsp: o.stripCsp, time }),
      head: await sideContext(browser, { commit: head, vp, snap, plants: o.plants, stripCsp: o.stripCsp, time }),
    };
    for (const k of states) {
      const a = await capture(sides.base.ctx, k);
      const b = await capture(sides.head.ctx, k);
      const again = await capture(sides.head.ctx, k);
      const d2 = compareCaptures(b, again);
      const p2 = await comparePixels(lab, b.png, again.png);
      const unstable = !!(d2.text || d2.dom || d2.errors || p2.changed);
      const diff = compareCaptures(a, b);
      const px = await comparePixels(lab, a.png, b.png);
      results.push({ key: k, vp, ...diff, px, unstable });
      noise.push(unstable ? { key: k, vp } : null);
      if (o.keep) {
        mkdirSync(join(out, 'full'), { recursive: true });
        const stem = `${vp[0]}-${k.replace(/[^a-z0-9]+/gi, '_')}`;
        writeFileSync(join(out, 'full', `${stem}-base.png`), a.png);
        writeFileSync(join(out, 'full', `${stem}-head.png`), b.png);
      }
      process.stderr.write(`  ${vpName(vp)} ${k}${unstable ? '  ⚠️ differs from itself' : diff.text || diff.dom || diff.errors || px.changed ? '  ← differs' : ''}\n`);
    }
    for (const s of ['base', 'head']) {
      sides[s].blocked.forEach(h => blocked.add(h));
      sides[s].missing.forEach(f => missing[s].add(f));
      await sides[s].ctx.close();
    }
  }
  await browser.close();

  writeSheet({ out, base, head, states, results, noise, snap, blocked, missing, time,
               seconds: Math.round((Date.now() - started) / 1000), plants: o.plants, stripCsp: o.stripCsp });
}

// ------------------------------------------------------------------- the sheet

const short = c => c.slice(0, 7);
const pageOf = key => key.split('?')[0];
/** How a state is named on the sheet: the query for a game state, nothing for a whole page. */
const where = r => `${vpName(r.vp)}${r.key.includes('?') ? ' ' + r.key.replace(/^[^?]*\?/, '') : ''}`;
const fence = s => '```diff\n' + s.replace(/```/g, "'''") + '\n```';

/** Differences with the same text, document and error change on the same page are ONE question. */
export function groupItems(results) {
  const groups = new Map();
  for (const r of results) {
    if (r.unstable) continue;
    if (!r.text && !r.dom && !r.errors && !r.px.changed) continue;
    const sig = JSON.stringify([pageOf(r.key), r.text, r.dom, r.errors, !!r.px.changed]);
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(r);
  }
  return [...groups.values()];
}

function writeSheet(run) {
  const { out, base, head, states, results, noise, snap, blocked, missing, time } = run;
  const commits = gitText('log', '--format=%h %s', `${base}..${head}`, '--', 'src/');
  const touching = page => gitText('log', '--format=%h', `${base}..${head}`, '--', `src/${page}`)
    .split('\n').filter(Boolean);
  const groups = groupItems(results);
  const visible = groups.filter(g => g.some(r => r.text || r.errors || r.px.changed));
  const docOnly = groups.filter(g => !visible.includes(g));
  const differing = results.filter(r => !r.unstable && (r.text || r.dom || r.errors || r.px.changed)).length;
  const sampled = noise.length, noisy = noise.filter(Boolean);
  const stateList = g => g.length <= 4 ? g.map(r => `\`${where(r)}\``).join(', ')
    : `${g.length} states — ${VIEWPORTS.map(vp => `${g.filter(r => r.vp === vp).length} at ${vpName(vp)}`).join(', ')}`;

  const L = [];
  L.push(`# Review — ${short(base)}..${short(head)}`, '');
  L.push(`**For Kevin.** Every item below is a difference the machine found between the site as it was at \`${short(base)}\` and as it is at \`${short(head)}\`, on the pages a visitor opens, in real Chromium. **You are not asked to find anything — only to judge: is the AFTER side wrong?** Answer \`y\`, \`n\` or \`?\` after the arrow, and add a note if you like. A \`y\` is a defect report.`, '');
  L.push('## The batch', '');
  L.push(commits ? commits.split('\n').map(c => `- \`${c.slice(0, 7)}\` ${c.slice(8)}`).join('\n') : '- ⚠️ no commit in this range changed `src/`', '');
  L.push('## The instrument, this run', '');
  L.push(`- **${results.length} page states** (${states.length} states × ${VIEWPORTS.length} viewports: ${VIEWPORTS.map(vpName).join(', ')}) — **${results.length - differing - noisy.length} identical, ${differing} differ${noisy.length ? `, ${noisy.length} could not be compared` : ''}**, grouped into **${visible.length} items to judge** and **${docOnly.length} document-only changes** (nothing on screen).`);
  L.push(`- **It checked itself:** every state rendered twice at \`${short(head)}\` — ${noisy.length ? `**${noisy.length} of ${sampled} differed from themselves** and are listed at the end, not asked about.` : `**0 of ${sampled} differed**, so a difference below is not the tool redrawing.`}`);
  L.push(`- Data: one snapshot of \`${DATA}\` served to both sides — ${[...snap.docs.keys()].sort().map(k => `\`${k}\``).join(', ') || 'none requested'}. Clock fixed at ${new Date(time).toISOString()}; clock paused, advanced exactly 10 s after load; motion reduced.`);
  if (blocked.size) L.push(`- Other hosts refused (not rendered): ${[...blocked].sort().map(h => `\`${h}\``).join(', ')}.`);
  for (const s of ['base', 'head']) if (missing[s].size) L.push(`- ⚠️ Requested but not in ${s === 'base' ? short(base) : short(head)}: ${[...missing[s]].sort().map(f => `\`${f}\``).join(', ')}.`);
  if (run.plants.length || run.stripCsp) L.push(`- ⚠️ **PROOF RUN, NOT A REVIEW:** ${run.stripCsp ? 'CSP stripped on both sides; ' : ''}${run.plants.map(p => `planted in ${p.file}: \`${p.old}\` → \`${p.new}\``).join('; ')}.`);
  L.push('- ⚠️ This browser has no emoji font: an emoji draws as an empty box, identically on both sides — a box is not a defect.');
  L.push(`- ⚠️ It cannot see a changed number (both sides read the same published data), a state no walk visits (clicks, gestures, the Tabletop style), or motion. ${run.seconds} s.`, '');

  let n = 0;
  if (visible.length) L.push('## Judge these', '');
  for (const g of visible) {
    n++;
    const first = g.find(r => r.px.changed) || g[0];
    const page = pageOf(first.key);
    const t = touching(page);
    L.push(`### ${n}. \`${page}\` — ${g.length} state${g.length > 1 ? 's' : ''}`, '');
    L.push(`States: ${stateList(g)}`, '');
    L.push(`Commits in this batch that touched \`src/${page}\`: ${t.length ? t.map(c => `\`${c}\``).join(', ') : 'none'}`, '');
    if (first.errors) {
      if (first.errors.added.length) L.push(`⛔ **New errors in the browser console:**`, '', ...first.errors.added.map(e => `- \`${e}\``), '');
      if (first.errors.removed.length) L.push(`Errors that went away:`, '', ...first.errors.removed.map(e => `- \`${e}\``), '');
    }
    if (first.text) L.push('**Text a reader sees** (`-` before, `+` after):', '', fence(first.text), '');
    const pxs = g.filter(r => r.px.changed);
    const shown = [];
    for (const vp of VIEWPORTS) { const r = pxs.find(x => x.vp === vp); if (r) shown.push(r); }
    for (const r of shown) {
      const pct = (100 * r.px.changed / r.px.total).toFixed(2);
      const size = r.px.sizeA.join('×') === r.px.sizeB.join('×') ? '' : ` · page size ${r.px.sizeA.join('×')} → ${r.px.sizeB.join('×')}`;
      const amount = r.px.aligned
        ? `${r.px.rows.toLocaleString('en-US')} rows of pixels have no counterpart (${pct}% of the page)`
          + (r.px.moved ? `; ⚠️ ${r.px.moved} band${r.px.moved > 1 ? 's' : ''} (${r.px.movedRows} rows) below a height change only moved, redrawn a fraction of a pixel off, and are not shown — a style change inside them would be missed here; their words are in the text diff` : '')
        : `${r.px.changed.toLocaleString('en-US')} px changed (${pct}% of the page)`;
      L.push(`**Pixels, \`${where(r)}\`** — ${amount}${size}${r.px.more ? ` · ${r.px.more} more region${r.px.more > 1 ? 's' : ''} not shown` : ''}`, '');
      r.px.regions.forEach((reg, k) => {
        const stem = `item${n}-${r.vp[0]}-r${k + 1}`;
        writeFileSync(join(out, 'img', `${stem}-before.png`), Buffer.from(reg.before, 'base64'));
        writeFileSync(join(out, 'img', `${stem}-after.png`), Buffer.from(reg.after, 'base64'));
        L.push(`| before | after |`, '|---|---|', `| ![before](img/${stem}-before.png) | ![after](img/${stem}-after.png) |`, '');
        L.push(reg.beforeRows
          ? `<sub>rows ${reg.beforeRows[0]}–${reg.beforeRows[1]} before, ${reg.y}–${reg.y + reg.h} after, outlined</sub>`
          : `<sub>region at x ${reg.x}, y ${reg.y}, ${reg.w}×${reg.h}px, outlined</sub>`, '');
      });
    }
    if (first.dom) {
      const d = first.dom, parts = [];
      if (d.ids.removed.length) parts.push(`ids removed ${d.ids.removed.map(x => `\`${x}\``).join(' ')}`);
      if (d.ids.added.length) parts.push(`ids added ${d.ids.added.map(x => `\`${x}\``).join(' ')}`);
      if (d.classes.removed.length) parts.push(`classes removed ${d.classes.removed.map(x => `\`${x}\``).join(' ')}`);
      if (d.classes.added.length) parts.push(`classes added ${d.classes.added.map(x => `\`${x}\``).join(' ')}`);
      L.push(`Document: ${parts.join('; ') || 'changed, with the same ids and classes'}`, '');
    }
    L.push('**Is the after side wrong?** → ', '', 'Notes → ', '');
  }

  if (docOnly.length) {
    L.push('## Changed in the document, nothing on screen', '');
    L.push('Not a question — nothing a reader sees moved. Listed so a removal that was meant to be invisible can be seen to be.', '');
    L.push('| page | states | ids removed | ids added | classes removed | classes added |', '|---|---|---|---|---|---|');
    for (const g of docOnly) {
      const d = g[0].dom || { ids: { added: [], removed: [] }, classes: { added: [], removed: [] } };
      const cell = xs => xs.length ? xs.map(x => `\`${x}\``).join(' ') : '—';
      L.push(`| \`${pageOf(g[0].key)}\` | ${stateList(g)} | ${cell(d.ids.removed)} | ${cell(d.ids.added)} | ${cell(d.classes.removed)} | ${cell(d.classes.added)} |`);
    }
    L.push('');
  }
  if (noisy.length) {
    L.push('## Could not be compared — the page differs from itself', '');
    L.push('Rendered twice at the same commit, these did not come out the same, so a difference against the earlier commit says nothing about the code. **Nothing on these states was reviewed.**', '');
    L.push(...noisy.map(n => `- \`${n.key.split('?')[0]}\` \`${where(n)}\``), '');
  }
  if (!visible.length && !docOnly.length) L.push('## Nothing differs', '', 'Every state rendered identically on both sides.', '');
  L.push('## When you are done', '', `Tell Claude the sheet is judged. Every \`y\` becomes a defect with its fix; then \`docs/reviews/LAST\` moves to \`${short(head)}\` and the next batch starts there.`, '');
  writeFileSync(join(out, 'review.md'), L.join('\n'));
  writeFileSync(join(out, 'run.json'), JSON.stringify({ base, head, time, seconds: run.seconds,
    states: results.length, differing, items: visible.length, documentOnly: docOnly.length,
    selfCheck: { sampled, noisy: noisy.length }, data: [...snap.docs.keys()].sort(),
    plants: run.plants, stripCsp: run.stripCsp }, null, 1) + '\n');
  process.stderr.write(`\n  ${results.length} states, ${differing} differ → ${visible.length} items, ${docOnly.length} document-only; self-check ${noisy.length}/${sampled} noisy\n  ${join(out, 'review.md')}\n`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch(e => { console.error(e); process.exit(1); });
}
