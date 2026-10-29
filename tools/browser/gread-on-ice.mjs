/**
 * THE POST-GOAL OVERLAY STAYS ON THE ICE.
 *
 * Kevin, 2026-10-29 (screenshot at ~1024px): `#gread` was absolutely positioned
 * against `.rinkbox`, whose height includes who/playdist/lbox under the svg, so
 * `top:66%` landed the countdown on the teaching text. The fix anchors it to
 * `.iceslot` (svg only). This check is the instrument that claim needs: a fake
 * document has no layout, so it cannot see the defect.
 *
 * Two widths (1024 and 390). At each, `#gread` is revealed with its hold copy
 * and its bounding box must lie inside the svg's — and must not reach `#who`.
 */
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';

export const NAME = 'gread-on-ice';
export const NEEDS_SITE = false;
/** A few CSS pixels of rounding between getBoundingClientRect edges. */
export const SLACK = 2;

export function readGread(html) {
  const m = /GREAD (\d+) (\d+) (\d+) (\d+) ICE (\d+) (\d+) (\d+) (\d+) WHO (\d+) W (\d+)/.exec(html);
  if (!m) return null;
  return {
    g: { top: +m[1], right: +m[2], bottom: +m[3], left: +m[4] },
    ice: { top: +m[5], right: +m[6], bottom: +m[7], left: +m[8] },
    whoTop: +m[9],
    width: +m[10],
  };
}

/** Every claim as its own sentence so a failure names the one that broke. */
export function judgeGread(m) {
  if (!m) return [{ ok: false, why: 'the probe never reported — the app did not run in the frame' }];
  const out = [];
  const want = (ok, why) => out.push({ ok, why });
  const { g, ice, whoTop, width } = m;
  const h = g.bottom - g.top, w = g.right - g.left;
  want(h > 20 && w > 40, `at ${width}px #gread measured ${w}x${h} — it is not on screen`);
  want(g.top + SLACK >= ice.top,
    `at ${width}px #gread top ${g.top} is above the ice top ${ice.top}`);
  want(g.bottom <= ice.bottom + SLACK,
    `at ${width}px #gread bottom ${g.bottom} is below the ice bottom ${ice.bottom} — it has left the rink`);
  want(g.left + SLACK >= ice.left,
    `at ${width}px #gread left ${g.left} is left of the ice left ${ice.left}`);
  want(g.right <= ice.right + SLACK,
    `at ${width}px #gread right ${g.right} is right of the ice right ${ice.right}`);
  want(g.bottom + SLACK <= whoTop,
    `at ${width}px #gread bottom ${g.bottom} reaches into #who (top ${whoTop}) — the countdown is on the text under the rink`);
  /* Under the centre circle: top of overlay should be in the lower half of the ice. */
  const mid = ice.top + (ice.bottom - ice.top) * 0.55;
  want(g.top >= mid - SLACK,
    `at ${width}px #gread top ${g.top} is above mid-ice ${Math.round(mid)} — it should sit under the centre circle`);
  return out;
}

const PROBE = (w, h) => `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head>
<body style="margin:0">
<iframe id="f" src="app.html" style="width:${w}px;height:${h}px;border:0;display:block"></iframe>
<script>
setTimeout(function () {
  var d = document.getElementById('f').contentDocument;
  var miss = 'GREAD 0 0 0 0 ICE 0 0 0 0 WHO 0 W ${w}';
  if (!d) { document.title = miss; return; }
  var g = d.getElementById('gread');
  var ice = d.getElementById('ice');
  var who = d.getElementById('who');
  if (!g || !ice || !who) { document.title = miss; return; }
  // Portrait phones hide the rink behind .rotate; showanyway is the same
  // escape the reader taps — without it getBoundingClientRect is 0x0 at 390.
  var rg = d.getElementById('rg');
  if (rg) rg.classList.add('showanyway');
  g.removeAttribute('hidden');
  var tap = d.getElementById('greadTap'), or = d.getElementById('greadOr');
  if (tap) tap.textContent = 'Tap Play to continue';
  if (or) or.textContent = 'or the replay continues in 3 seconds';
  var btn = d.getElementById('greadPause');
  if (btn) btn.textContent = 'Pause';
  void g.offsetHeight;
  var gr = g.getBoundingClientRect(), ir = ice.getBoundingClientRect(), wr = who.getBoundingClientRect();
  document.title = 'GREAD ' + Math.round(gr.top) + ' ' + Math.round(gr.right) + ' ' + Math.round(gr.bottom) + ' ' + Math.round(gr.left)
    + ' ICE ' + Math.round(ir.top) + ' ' + Math.round(ir.right) + ' ' + Math.round(ir.bottom) + ' ' + Math.round(ir.left)
    + ' WHO ' + Math.round(wr.top) + ' W ${w}';
}, 4000);
</script></body></html>`;

export async function check({ chrome, repo = process.cwd() }) {
  const dir = mkdtempSync('/tmp/rtg-gread-');
  copyFileSync(join(repo, 'src/read-the-game.html'), join(dir, 'app.html'));
  const server = await serve(dir);
  const widths = [[1024, 800], [390, 844]];
  try {
    let ok = true;
    for (const [w, h] of widths) {
      writeFileSync(join(dir, 'probe.html'), PROBE(w, h));
      const html = await dumpDom(`${server.url}/probe.html`, { chrome, budget: 18000 });
      const m = readGread(html);
      if (!m) { fail(`at ${w}px the probe never reported — the app did not run in the frame`); ok = false; continue; }
      say(`at ${m.width}px: gread ${m.g.left},${m.g.top}→${m.g.right},${m.g.bottom} `
        + `ice ${m.ice.left},${m.ice.top}→${m.ice.right},${m.ice.bottom} who@${m.whoTop}`);
      for (const v of judgeGread(m)) if (!v.ok) { fail(v.why); ok = false; }
    }
    if (ok) say('#gread sits on the ice at 1024 and 390');
    return ok;
  } finally { server.stop(); }
}
