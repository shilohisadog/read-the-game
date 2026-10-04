/**
 * THE SHARING CARD — the picture a link to this site arrives with.
 *
 * ⭐⭐⭐ WHY IT EXISTS. Kevin, 2026-10-04, about to post the first link to this
 * site anywhere public: *"I was thinking of pasting the following link … onto
 * X.com, what do you think?"* Measured before answering: the page's unfurl is
 * correct and game-specific, it spoils no result, and it carries **no image at
 * all** — `twitter:card` was `summary`, a text-only box. A site whose entire
 * argument is a picture, arriving in public as a paragraph.
 *
 * ⛔ AND THE REASON IT HAD NONE HAD EXPIRED. `builders/page.py` said: *"No
 * og:image yet: we have no artwork we are allowed to ship, since club marks are
 * off the table by design."* True when it was written, and no longer: the rink
 * below is drawn by `furniture()` — the SAME function that paints the ice on
 * every replay — and carries no club mark, no logo, no sweater colour. We own
 * every line in it. "A reason that expired without being re-examined" is a shape
 * this repo has logged before.
 *
 * ⛔⛔ WHAT THIS CARD DELIBERATELY DOES NOT DRAW: SHOTS.
 * The obvious card is a shot chart, and it is the wrong one. The card sits
 * directly beside a title naming ONE GAME — "Washington Capitals at Tampa Bay
 * Lightning" — so any scatter of marks on it is read as THAT game's chart, and
 * one image serves every link on the site. It would be a claim about a game it
 * knows nothing about. Inventing the positions would be worse: this project's
 * whole promise is that nothing is modelled and nothing is invented, and a
 * decorative shot chart on the sharing card would break that promise in the one
 * place a stranger meets it first.
 *
 * ⭐ SO THE CARD IS THE EMPTY SHEET AND OUR OWN PAINT. The slot lozenge is a
 * measurement of ours rather than the league's, which is exactly what the site is
 * for, and an empty rink makes no claim about any game.
 *
 * ⛔⛔ AND IT IS `furniture(id, 'slot')`, NOT `furniture(id, true)` — WHICH THE
 * FIRST RENDER OF THIS CARD GOT WRONG AND LOOKING IS WHAT CAUGHT IT. `true` also
 * paints the blue-line BANDS, and `#rg .zoneband{display:none}` means the base
 * ice does not draw them: they appear only under the Zone starts layer. So the
 * card advertised a rink the site does not show until you turn something on —
 * a second surface describing the first and disagreeing with it, which is the
 * defect `test/key-matches-the-ice.test.js` was written for THE SAME DAY. The
 * third value exists for exactly this: the lozenge alone.
 *
 *   node tools/card.mjs           render src/card.png, reporting what it wrote
 *   node tools/card.mjs --check   verify the shipped PNG matches this artwork
 *
 * ⚠️ IT IS NOT PART OF `npm run build`. The build is byte-identical-on-rebuild
 * and a rasteriser is not: font rendering differs between this laptop and a CI
 * runner, so the same SVG gives different PNG bytes in two places. The PNG is a
 * committed ASSET, regenerated deliberately, and `--check` asks the only
 * question that matters — was it made from the artwork that is in the file now.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { furniture } from '../src/lib/rinkart.js';
import { findChrome, serve } from './browser/lib.mjs';
import { evaluate, page } from './browser/cdp.mjs';

/* ⭐ 1200x630 IS THE SIZE EVERY PLATFORM CROPS FROM, and 2:1-ish is also the
   rink's own proportion, which is why the sheet fits here without being
   squeezed. `og:image:width`/`height` are declared from these same two numbers
   so the markup cannot disagree with the file. */
export const WIDTH = 1200;
export const HEIGHT = 630;

/** Where it is written, and the path the pages reference. */
export const PNG = new URL('../src/card.png', import.meta.url);
export const SITE = 'https://readthegame.co';
export const HREF = `${SITE}/card.png`;

/* The sentence a reader meets if the image never loads, and the one a screen
   reader gets instead of it. It describes the PICTURE, not the site. */
/* ⚠️ AND IT DESCRIBES WHAT IS DRAWN, which it did not for one render: it named
   "the zones either side of each blue line" while the artwork beside it had just
   stopped painting them. Alt text is the copy nobody looks at, so it is the copy
   that goes stale — `test/card.test.js` holds it to the picture. */
export const ALT = 'An empty NHL rink with the slot shaded in front of each net — '
  + 'the one region this site paints on the ice, and measures shots against.';

/**
 * The card, as SVG. Pure: no browser, no filesystem, so a test can read it.
 *
 * ⭐ THE RINK IS `furniture()`, NOT A DRAWING OF ONE. The same call the replay
 * makes, in the same 200x85 coordinate space, so the ice on the card and the ice
 * on the page cannot drift apart — a card that quietly stopped matching the
 * product would be the "two surfaces describing one thing" defect in the one
 * place nobody looks.
 */
export function cardSvg() {
  /* ⚠️ THE RINK'S COORDINATE SPACE IS 200x85 AND IS NOT NEGOTIABLE — `SX`/`SY`
     map feet into it. So it is PLACED by a transform rather than redrawn at
     another scale, which is what `builders/learn-figures.mjs` does for the rule
     diagrams and for the same reason. */
  /* ⚠️ THE SHEET CLEARS THE FOOTER, which the first render did not: the boards
     ran behind both lines of type and the card read as a mistake. The rink is
     200x85, so its height follows its width and the only free number is where it
     starts. */
  const rinkW = 940, rinkH = rinkW * 85 / 200;          // 940 x 400
  const rinkX = (WIDTH - rinkW) / 2, rinkY = 168;
  const scale = rinkW / 200;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" `
    + `viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="system-ui,-apple-system,&quot;Segoe UI&quot;,Roboto,sans-serif">`
    + '<style>'
    /* THE RINK, RESTATED FROM app.css — the same numbers, because it is the same
       ice. `builders/build_index.py`'s FIGCSS says this of the rule diagrams and
       makes the same restatement; a shared function does not carry a stylesheet. */
    + '.boards{fill:#eef4f8;stroke:#ccd8e0;stroke-width:1.1}'
    /* ⚠️ THE SAME OPACITY THE ICE USES, not a bolder one chosen because this is a
       poster. `#rg .slotzone{opacity:.09}`. A card that paints our own measurement
       more strongly than the product does is the product misrepresented in the one
       picture a stranger sees first, and the words below do the work instead. */
    + '.slotzone{fill:#e0932a;opacity:.09}'
    + '.ln{fill:none;stroke-linecap:round}'
    + '.ln.red{stroke:#c8102e;stroke-width:.7;opacity:.5}'
    + '.ln.blue{stroke:#3a5a9c;stroke-width:.9;opacity:.5}'
    + '.ln.thick{stroke-width:1.1;opacity:.6}'
    + '.fdot{fill:#c8102e;opacity:.6}.fdot.ctr{fill:#3a5a9c}'
    + '</style>'
    + `<rect width="${WIDTH}" height="${HEIGHT}" fill="#f4f7fa"/>`
    + `<g transform="translate(${rinkX} ${rinkY}) scale(${scale})">${furniture('card', 'slot')}</g>`
    /* ⭐ THE WORDMARK AND THE TAGLINE ARE THE SITE'S OWN, not a second phrasing
       invented for this one surface. `src/index.html` has read "Read the Game —
       hockey, made legible" since it was built. */
    + `<text x="80" y="92" font-size="62" font-weight="800" fill="#0f1a23" letter-spacing="-1">Read the Game</text>`
    + `<text x="80" y="134" font-size="30" font-weight="500" fill="#5b6d7a">hockey, made legible</text>`
    /* ⚠️ THE PROMISE, AND IT IS THE ONE LINE WORTH SPENDING THE SPACE ON. It is
       what the site is FOR, it is already the homepage's own description, and on
       a card beside a hockey title it is the only sentence that says why this is
       not another stats page. */
    + `<text x="${WIDTH - 80}" y="${HEIGHT - 34}" text-anchor="end" font-size="27" font-weight="600" fill="#5b6d7a">Nothing modelled, nothing invented.</text>`
    + `<text x="80" y="${HEIGHT - 34}" font-size="27" font-weight="700" fill="#3a5a9c">readthegame.co</text>`
    + '</svg>';
}

/** The artwork's identity: what `--check` holds the shipped PNG to. */
export const sourceHash = () => createHash('sha256').update(cardSvg()).digest('hex').slice(0, 16);

/* ─── PNG, enough of it ────────────────────────────────────────────────────── */

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/* ⛔ A CRC32 BY HAND, because this Node has no `zlib.crc32` and this repo takes
   no dependencies. It is the standard table-driven routine; the PNG spec's
   polynomial, nothing of ours. */
const TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
export function crc32(buf) {
  let c = -1;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** Walk a PNG's chunks. Returns [] for anything that is not one. */
export function chunks(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 8 || !buf.subarray(0, 8).equals(SIG)) return [];
  const out = [];
  let at = 8;
  while (at + 8 <= buf.length) {
    const len = buf.readUInt32BE(at);
    const type = buf.subarray(at + 4, at + 8).toString('latin1');
    const data = buf.subarray(at + 8, at + 8 + len);
    if (at + 12 + len > buf.length) break;
    out.push({ type, data });
    at += 12 + len;
    if (type === 'IEND') break;
  }
  return out;
}

/** The declared pixel size, read from IHDR — null when this is not a PNG. */
export function pngSize(buf) {
  const ihdr = chunks(buf).find(c => c.type === 'IHDR');
  return ihdr && ihdr.data.length >= 8
    ? { w: ihdr.data.readUInt32BE(0), h: ihdr.data.readUInt32BE(4) } : null;
}

/** A `tEXt` value by keyword, or null. */
export function pngText(buf, key) {
  for (const c of chunks(buf)) {
    if (c.type !== 'tEXt') continue;
    const z = c.data.indexOf(0);
    if (z > 0 && c.data.subarray(0, z).toString('latin1') === key)
      return c.data.subarray(z + 1).toString('latin1');
  }
  return null;
}

/**
 * Return the PNG with a `tEXt` chunk added before IEND.
 *
 * ⭐ THE FILE CARRIES ITS OWN PROVENANCE, which is why this is worth twenty
 * lines. `--check` asks "was this made from the artwork in the file now" and can
 * answer from the PNG ALONE — no sidecar to keep in step, nothing to lose when
 * the file moves, and the answer travels with the artefact.
 */
export function withText(buf, key, value) {
  const body = Buffer.concat([Buffer.from(key, 'latin1'), Buffer.from([0]), Buffer.from(value, 'latin1')]);
  const chunk = Buffer.alloc(body.length + 12);
  chunk.writeUInt32BE(body.length, 0);
  chunk.write('tEXt', 4, 'latin1');
  body.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + body.length)), 8 + body.length);
  // IEND is the last 12 bytes of a well-formed PNG; the new chunk goes before it.
  return Buffer.concat([buf.subarray(0, buf.length - 12), chunk, buf.subarray(buf.length - 12)]);
}

/* ─── judging, with no browser anywhere near it ────────────────────────────── */

export const STAMP = 'rtg-source';

/** What is wrong with this file, as sentences. Empty means it is good. */
export function judgeCard(buf, want = sourceHash()) {
  if (!buf || !buf.length) return ['there is no card at src/card.png at all — run `node tools/card.mjs`'];
  const size = pngSize(buf);
  if (!size) return ['src/card.png is not a PNG — every platform that reads it will show nothing'];
  const bad = [];
  if (size.w !== WIDTH || size.h !== HEIGHT)
    bad.push(`the card is ${size.w}x${size.h} and the markup declares ${WIDTH}x${HEIGHT} — `
      + 'a platform told one size and served another crops the other one');
  /* ⛔ A CARD THAT IS TECHNICALLY A PNG AND VISUALLY NOTHING. A blank 1200x630
     compresses to a few hundred bytes, so a floor here catches a render that
     produced an empty page — which is what a failed font load, a refused
     stylesheet or a mistimed screenshot all look like. */
  if (buf.length < 8000)
    bad.push(`the card is only ${buf.length} bytes, which is not a drawing — the render produced a blank`);
  const made = pngText(buf, STAMP);
  if (!made) bad.push(`the card carries no ${STAMP} stamp, so there is no way to tell what it was made from`);
  else if (made !== want)
    bad.push(`the card was made from artwork ${made} and this file now holds ${want} — `
      + 'the picture a link arrives with is not the picture in the repo; run `node tools/card.mjs`');
  return bad;
}

/* ─── rendering ────────────────────────────────────────────────────────────── */

/**
 * Rasterise the card with the same headless Chrome the browser probes use.
 *
 * ⚠️ THE SVG IS SERVED, NOT INLINED IN A `data:` URL. A data URL is its own
 * opaque origin with its own restrictions, and this page needs none of that; the
 * probes' own `serve()` is already here and already proves the file it answers.
 */
export async function render({ chrome = findChrome() } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rtg-card-'));
  try {
    writeFileSync(join(dir, 'index.html'),
      '<!doctype html><meta charset="utf-8">'
      + `<style>html,body{margin:0;padding:0;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}</style>`
      + cardSvg());
    const srv = await serve(dir);
    let browser = null;
    try {
      browser = await page(`${srv.url}/index.html`, { chrome, width: WIDTH, height: HEIGHT });
      const { cdp } = browser;
      await cdp.send('Emulation.setDeviceMetricsOverride',
        { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
      /* THE FONTS HAVE TO BE DOWN BEFORE THE SHUTTER. `document.fonts.ready`
         answers that directly rather than this file guessing at a duration. */
      await evaluate(cdp, 'document.fonts ? document.fonts.ready.then(() => true) : true');
      const shot = await cdp.send('Page.captureScreenshot',
        { format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 } });
      return withText(Buffer.from(shot.data, 'base64'), STAMP, sourceHash());
    } finally { if (browser) browser.stop(); srv.stop(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

/* ─── CLI ──────────────────────────────────────────────────────────────────── */

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const check = process.argv.includes('--check');
  if (check) {
    let buf = null;
    try { buf = readFileSync(PNG); } catch { /* judged as missing below */ }
    const bad = judgeCard(buf);
    for (const m of bad) console.log(`::error::${m}`);
    if (!bad.length) console.log(`  the sharing card is ${WIDTH}x${HEIGHT}, `
      + `${(buf.length / 1024).toFixed(1)}KB, made from artwork ${sourceHash()}`);
    process.exit(bad.length ? 1 : 0);
  } else {
    const png = await render();
    writeFileSync(PNG, png);
    const bad = judgeCard(png);
    for (const m of bad) console.log(`::error::${m}`);
    console.log(`  wrote src/card.png — ${WIDTH}x${HEIGHT}, ${(png.length / 1024).toFixed(1)}KB, `
      + `artwork ${sourceHash()}`);
    process.exit(bad.length ? 1 : 0);
  }
}
