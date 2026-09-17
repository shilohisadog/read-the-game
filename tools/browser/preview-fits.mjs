/**
 * THE FRONT DOOR'S PREVIEW FITS ITS FRAME.
 *
 * The hero is a page inside a page, and nothing measuring the OUTER document can
 * see into it: a rink squashed to a sliver, or cropped by its frame, costs the
 * outer page not one pixel of width. Three renderings of this feature shipped
 * broken — a blur, a crop, and a scoreboard eating 56% of a phone frame — and the
 * whole suite stayed green through all three, because the fake document the unit
 * tests run against has no CSS and no layout.
 *
 * ⛔ THE PREVIEW MUST BE PROVED TO HAVE BOOTED BEFORE ANY GEOMETRY IS BELIEVED. A
 * page that failed to load renders no preview at all, and the probe would report
 * tidy numbers for the error state. So the probe emits the ANSWER — is this frame
 * in preview mode — rather than a class list for someone else to parse: the day
 * `#rg` carried a second class, a positional parse turned every box red.
 *
 * ⭐ THE SCOREBOARD MAY NOT EAT THE ICE. It was 87px of a 155px frame on a phone
 * (56%) while being 87px of 462px on a desktop — the same absolute height in both,
 * which was the whole defect. A third is generous and still catches it.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';
import { sitecopy } from './sitecopy.mjs';

export const NAME = 'preview-fits';
/** Phone, laptop, and a box so short the scoreboard must fail the third rule. */
export const BOXES = [{ w: 287, h: 184, kind: 'real' }, { w: 856, h: 462, kind: 'real' }, { w: 287, h: 60, kind: 'canary' }];

export function readPreview(html) {
  const m = /PREV ([a-z+]+) (\d+) (\d+) (\d+) (\d+) (\d+)/.exec(html);
  return m ? { mode: m[1], frameW: +m[2], frameH: +m[3], scrollW: +m[4], scrollH: +m[5], board: +m[6] } : null;
}

export function judgePreview(box, m) {
  const at = `${box.w}x${box.h}`;
  if (!m) return { ok: false, why: `the preview probe never reported at ${at}` };
  if (m.mode !== 'preview') return { ok: false, why: `at ${at} the frame is not in preview mode (#rg class "${m.mode}") — it never booted` };
  const bad = [];
  if (m.scrollW > m.frameW + 1) bad.push(`the preview scrolls sideways inside its own frame (${m.scrollW} > ${m.frameW})`);
  if (m.scrollH > m.frameH + 1) bad.push(`the preview is taller than its frame — the rink is cropped (${m.scrollH} > ${m.frameH})`);
  if (m.board * 3 > m.frameH) bad.push(`the scoreboard is ${m.board}px of a ${m.frameH}px frame — over a third of the taste is chrome`);
  if (box.kind === 'canary') {
    return bad.length
      ? { ok: true, note: `canary: ${m.board}px of chrome in a ${m.frameH}px frame correctly rejected — this gate can fail` }
      : { ok: false, why: 'the canary was accepted — this gate cannot detect a crowded frame' };
  }
  return bad.length ? { ok: false, why: `${at}: ${bad.join('; ')}` }
                    : { ok: true, note: `${at}: content needs ${m.scrollW}x${m.scrollH}, scoreboard ${m.board}px` };
}

const probeHtml = (id, w, h) => `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head>
<body style="margin:0">
<iframe id="f" src="game.html?game=${id}&preview=1" style="width:${w}px;height:${h}px;border:0"></iframe>
<script>
window.onerror = function (m) { document.title = 'PREVERR ' + m; };
setTimeout(function () {
  try {
    var f = document.getElementById('f'), d = f.contentDocument, w = f.contentWindow;
    var rg = d.getElementById('rg'), b = d.querySelector('.board');
    /* ONE TOKEN, ALWAYS: the ANSWER, not a state for someone else to interpret. */
    var mode = !rg ? 'norg' : rg.classList.contains('preview') ? 'preview'
             : ((rg.className || 'noclass').replace(/\\s+/g, '+'));
    document.title = 'PREV ' + mode + ' ' + w.innerWidth + ' ' + w.innerHeight + ' ' +
      d.documentElement.scrollWidth + ' ' + d.documentElement.scrollHeight + ' ' +
      (b ? Math.round(b.getBoundingClientRect().height) : 0);
  } catch (e) { document.title = 'PREVTHROW ' + e.message; }
}, 6000);
</script></body></html>`;

export async function check({ site, chrome, dir }) {
  const work = dir || (await import('node:fs')).mkdtempSync('/tmp/rtg-preview-');
  const { ids } = await sitecopy(site, work, { games: 1 });
  const id = ids[ids.length - 1];
  say(`newest viewable game is ${id}`);
  for (const b of BOXES) writeFileSync(join(work, `prev-${b.w}-${b.h}.html`), probeHtml(id, b.w, b.h));

  const server = await serve(work);
  let ok = true;
  try {
    for (const b of BOXES) {
      const v = judgePreview(b, readPreview(await dumpDom(`${server.url}/prev-${b.w}-${b.h}.html`, { chrome })));
      if (v.ok) say(v.note); else { fail(v.why); ok = false; }
    }
  } finally { server.stop(); }
  return ok;
}
