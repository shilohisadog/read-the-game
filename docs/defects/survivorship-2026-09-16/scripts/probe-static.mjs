// Detector: the self-contained pages (rule diagrams, learn, goalie view, workshop).
// usage: node probe-static.mjs <site-src-dir> <work-dir>  -> JSON on stdout
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const { chromium } = await import('/tmp/rtg-pixels/node_modules/playwright/index.mjs');
const [SRC, WORK] = process.argv.slice(2);
const PAGES = ['empty-net', 'faceoffs', 'icing', 'offside', 'penalties', 'slot',
               'goalie-eye-view', 'what-you-can-see', 'workshop', 'terrain-3d'];
const h = v => createHash('sha1').update(v).digest('hex').slice(0, 16);
mkdirSync(WORK, { recursive: true });
for (const p of PAGES) writeFileSync(join(WORK, p + '.html'),
  readFileSync(join(SRC, p + '.html'), 'utf8').replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, ''));
const out = { states: {}, errors: [] };
const b = await chromium.launch({ channel: 'chromium' });
try {
  for (const [vw, vh] of [[1400, 900], [844, 390]]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    for (const p of PAGES) {
      try {
        await pg.goto('file://' + join(WORK, p + '.html'), { waitUntil: 'load', timeout: 15000 });
        await pg.waitForTimeout(250);
        out.states[`${vw}x${vh}/${p}`] = {
          dom: h(await pg.evaluate(() => { const b = document.body.cloneNode(true); b.querySelectorAll('script').forEach(s => s.remove()); return b.outerHTML; })),
          text: h(await pg.evaluate(() => document.body.innerText)),
          px: h(await pg.screenshot({ fullPage: true, animations: 'disabled' })) };
      } catch (e) { out.states[`${vw}x${vh}/${p}`] = { threw: String(e.message).slice(0, 100) }; }
    }
    await ctx.close();
  }
} catch (e) { out.errors.push(String(e.message).slice(0, 200)); }
await b.close();
process.stdout.write(JSON.stringify(out));
