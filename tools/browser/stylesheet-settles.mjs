/**
 * WHAT ONLY A STYLESHEET CAN SETTLE.
 *
 * `test/render-*.test.js` boot the same bundle against a fake document and cover
 * the markup; what they STRUCTURALLY CANNOT SEE is CSS. This is for exactly the
 * claims that live there:
 *
 *   - the layer caption is REVEALED by a rule, so a fake document calling it
 *     "rendered" cannot tell you a visitor sees it — and a caption that is always
 *     empty passes "it changed" while one that never changes passes "it has
 *     height", so both are asserted together;
 *   - the layer box is a FIXED height, so it can CLIP. The unit test forbids
 *     `line-clamp` and `text-overflow`, which is a check with no instrument for
 *     the axis in question: the first build truncated three of six sentences at
 *     360px through `height` plus overflow, with the suite green;
 *   - one height across all six layer states — Kevin: "consistent space
 *     utilization so the graphics don't adjust based on which layer is selected";
 *   - the caption pill clears the box (the first build omitted the rink's padding
 *     from the offset and the pill sat 4px inside it);
 *   - ⭐ the hero's pill, AS A FRACTION OF THE ICE, at both hero widths. Kevin:
 *     "the icing caption pill displays in the middle of the rink, was that
 *     intentional?" It was not — the preview hides the layer box while leaving
 *     `--lboxh` at 120px, so the pill floated over a 129px rink: 95.8% up at 390,
 *     34.2% at 900. One width would have described the wrong bug;
 *   - which club's mark is white. The markup says only `class="att a"` and
 *     `class="att h"`; the sweater convention is entirely a stylesheet decision,
 *     and it is the only thing separating five matchups whose clubs share a hex.
 *
 * `read-the-game.html`, because it carries its game inside it: no network, no
 * CORS, no catalog. Served over http so the probe may reach into the frame.
 */
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';

export const NAME = 'stylesheet-settles';
export const NEEDS_SITE = false;
/** The pill belongs in the band under the ice: the ice is 129px on the hero and one pill is ~30px. */
export const PILL_CEILING = 25;

export function readIce(html) {
  const m = /ICE (\d+) (\d+) (\d+) (\d+) BOX (\d+) (\d+) (-?\d+) HERO (-?\d+) (-?\d+) MOVED (\d) VIS (\S+) HOST ([^ <]+)/.exec(html);
  if (!m) return null;
  return { shut: +m[1], open: +m[2], rings: +m[3], text: +m[4], clipped: +m[5], heights: +m[6],
           clear: +m[7], heroPill390: +m[8], heroPill900: +m[9], moved: +m[10], visitor: m[11], host: m[12] };
}

/** Every claim, as its own sentence, so a failure names the one that broke. */
export function judgeIce(m) {
  if (!m) return [{ ok: false, why: 'the probe never reported — the app did not run in the frame' }];
  const out = [];
  const want = (ok, why) => out.push({ ok, why });
  want(m.shut > 10, `the base view has no caption (${m.shut}px) — its marks are unnamed`);
  want(m.open > 10, `a layer is on and its caption is ${m.open}px tall — the CSS is hiding it`);
  want(m.text >= 40, `the caption is visible and explains nothing (${m.text} chars)`);
  want(m.moved === 1, 'the caption never changed when the layer went on — the control is mute');
  want(m.rings >= 1, 'no whistle mark reached the ice in a real browser');
  want(m.clipped === 0, `${m.clipped} of six layers has its sentence CLIPPED by the box's fixed height — a box that hides half a sentence about the numbers beside it is worse than a taller box`);
  want(m.heights === 1, `the box takes ${m.heights} different heights across the six layers — the requirement is that the graphics do not adjust based on which layer is selected`);
  want(m.clear >= 0, `the caption pill overlaps the layer box by ${Math.abs(m.clear)}px — the offset has lost a term`);
  for (const [w, pct] of [[390, m.heroPill390], [900, m.heroPill900]])
    want(pct <= PILL_CEILING, `at ${w}px the hero's caption pill sits ${pct}% up the rink — it is printing over the ice`);
  // The visitor wears white and the host wears its colour. A PAIR: "the visitor is
  // white" is also satisfied by a page that paints everything white, which is the
  // same defect being fixed — both clubs in one colour.
  want(m.visitor !== 'absent', 'no visitor mark was drawn, so nothing was checked');
  want(m.visitor === 'absent' || m.visitor.startsWith('rgb(255,255,255)'),
    `the visitor mark is painted ${m.visitor}, not white — the sweater convention is not reaching the ice, and the five matchups whose clubs share a hex (FLA/WSH, DET/NJD, BOS/NSH, EDM/WPG, TOR/VAN) would render as one colour`);
  want(m.visitor !== m.host, `both clubs are painted identically (${m.visitor}) — the page cannot tell them apart, which is the defect this convention exists to fix`);
  return out;
}

const PROBE = `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head>
<body style="margin:0">
<iframe id="f" src="app.html" style="width:1100px;height:900px;border:0"></iframe>
<!-- The hero at the phone width (390 at aspect-ratio 200/140) and at the laptop
     width (900 at 200/117): the same offset reads completely differently on a
     129px rink and a 363px one. -->
<iframe id="pv" src="app.html?preview=1" style="width:390px;height:273px;border:0"></iframe>
<iframe id="pvw" src="app.html?preview=1" style="width:900px;height:527px;border:0"></iframe>
<script>
setTimeout(function () {
  var d = document.getElementById('f').contentDocument;
  var p = d.getElementById('lcap');
  var h = function () { return Math.round(p.getBoundingClientRect().height); };
  var shut = h();
  var base = (p.textContent || '').trim();
  /* DRIVEN THROUGH THE CONTROL A VISITOR USES, not a parked row behind it. */
  d.querySelector('#rg .pk[data-l="whistle"]').click();
  /* Sweep rather than pick a moment: a whistle is placed by the faceoff that
     restarts play, so any single frame is entitled to hold none. */
  var s = d.getElementById('scrub'), open = 0, rings = 0, text = 0, moved = 0;
  for (var k = 1; k <= 20; k++) {
    s.value = Math.round(+s.max * k / 20);
    s.dispatchEvent(new Event('input'));
    open = Math.max(open, h());
    rings = Math.max(rings, d.getElementById('whistles').querySelectorAll('circle').length);
    text = Math.max(text, (p.textContent || '').trim().length);
    if ((p.textContent || '').trim() !== base) moved = 1;
  }
  /* Trails on, so both clubs have marks in the same frame. */
  d.querySelector('#rg .tbtn[data-t="all"]').click();
  s.value = Math.round(+s.max * 0.55);
  s.dispatchEvent(new Event('input'));
  var paint = function (sel) {
    var n = d.querySelector('#rg #events ' + sel);
    if (!n) return 'absent';
    var c = getComputedStyle(n);
    return (c.fill + '|' + c.stroke).replace(/ /g, '');
  };
  var f = document.getElementById('f');
  f.style.width = '360px';
  var clipped = 0, heights = {};
  ['none','corsi','slot','blocked','goaltending','whistle'].forEach(function (l) {
    d.querySelector('#rg .pk[data-l="' + l + '"]').click();
    s.value = s.max; s.dispatchEvent(new Event('input'));
    var bx = d.getElementById('lbox');
    if (bx.scrollHeight > bx.clientHeight + 1) clipped++;
    heights[Math.round(bx.getBoundingClientRect().height)] = 1;
  });
  /* CSS bottom is measured from the rink box's padding box, so the offset needs the
     box height AND the rink's padding. Negative means overlap. */
  var bx = d.getElementById('lbox').getBoundingClientRect();
  var cp = d.querySelector('#rg .caption').getBoundingClientRect();
  var clear = Math.round(bx.top - cp.bottom);
  f.style.width = '1100px';

  /* The hero's pill as a FRACTION of the ice it sits on: 0 is the bottom edge,
     and a pixel threshold would be a constant nobody could check. */
  var upAt = function (id) {
    var doc = document.getElementById(id).contentDocument;
    var cap = doc.querySelector('#rg .caption');
    var ice = doc.querySelector('#rg .rinkbox svg').getBoundingClientRect();
    cap.classList.add('on'); cap.textContent = 'probe';
    var r = cap.getBoundingClientRect();
    return Math.round(((ice.bottom - r.bottom) / ice.height) * 100);
  };
  document.title = 'ICE ' + shut + ' ' + open + ' ' + rings + ' ' + text
    + ' BOX ' + clipped + ' ' + Object.keys(heights).length + ' ' + clear
    + ' HERO ' + upAt('pv') + ' ' + upAt('pvw')
    + ' MOVED ' + moved
    + ' VIS ' + paint('.att.a') + ' HOST ' + paint('.att.h');
}, 4000);
</script></body></html>`;

export async function check({ chrome, repo = process.cwd() }) {
  const dir = mkdtempSync('/tmp/rtg-ice-');
  copyFileSync(join(repo, 'src/read-the-game.html'), join(dir, 'app.html'));
  writeFileSync(join(dir, 'probe.html'), PROBE);
  const server = await serve(dir);
  try {
    const m = readIce(await dumpDom(`${server.url}/probe.html`, { chrome, budget: 25000 }));
    if (m) {
      say(`caption, base view : ${m.shut}px tall`);
      say(`caption, layer on  : ${m.open}px tall, holding ${m.text} characters, changed=${m.moved}, ${m.rings} whistle marks on the ice`);
      say(`layer box, 360px   : ${m.heights} distinct height(s) over six states, ${m.clipped} clipped, pill clears it by ${m.clear}px`);
      say(`hero pill          : ${m.heroPill390}% up the ice at 390, ${m.heroPill900}% at 900`);
      say(`marks              : visitor ${m.visitor}, host ${m.host}`);
    }
    let ok = true;
    for (const v of judgeIce(m)) if (!v.ok) { fail(v.why); ok = false; }
    return ok;
  } finally { server.stop(); }
}
