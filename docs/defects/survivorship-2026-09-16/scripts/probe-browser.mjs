// Detector: does anything VISIBLE change in a real browser?
// usage: LD_LIBRARY_PATH=... node probe-browser.mjs <clone-root> <states.json>  -> JSON on stdout
// For each state (a deep-link query string) and each viewport, records hashes of:
//   dom   — body.outerHTML (anything in the document, visible or not)
//   text  — body.innerText (what a reader can see as text; respects display:none)
//   px    — a screenshot
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const { chromium } = await import('/tmp/rtg-pixels/node_modules/playwright/index.mjs');

const [ROOT, STATES] = process.argv.slice(2);
const h = v => createHash('sha1').update(v).digest('hex').slice(0, 16);
const states = JSON.parse(readFileSync(STATES, 'utf8'));
const dir = join(ROOT, '.probe'); mkdirSync(dir, { recursive: true });
// The CSP pins script hashes; a mutated bundle would be BLOCKED by it, which would
// make the CSP the detector. Strip it from both baseline and mutant alike.
const page0 = readFileSync(join(ROOT, 'src/read-the-game.html'), 'utf8')
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
writeFileSync(join(dir, 'app.html'), page0);

const out = { states: {}, errors: [] };
const b = await chromium.launch({ channel: 'chromium' });
try {
  for (const [vw, vh] of [[1400, 900], [844, 390]]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
    for (const s of states) {
      errs.length = 0;
      try {
        await p.goto('file://' + join(dir, 'app.html') + s, { waitUntil: 'load', timeout: 15000 });
        await p.waitForTimeout(250);
        const dom = await p.evaluate(() => { const b = document.body.cloneNode(true); b.querySelectorAll('script').forEach(s => s.remove()); return b.outerHTML; });
        const text = await p.evaluate(() => document.body.innerText);
        const px = await p.screenshot({ animations: 'disabled' });
        const full = await p.screenshot({ animations: 'disabled', fullPage: true });
        out.states[`${vw}x${vh}${s}`] = { dom: h(dom), text: h(text), px: h(px), full: h(full), err: errs.slice(0, 2) };
      } catch (e) { out.states[`${vw}x${vh}${s}`] = { threw: String(e.message).slice(0, 120) }; }
    }
    await ctx.close();
  }
} catch (e) { out.errors.push(String(e.message).slice(0, 200)); }
await b.close();
process.stdout.write(JSON.stringify(out));
