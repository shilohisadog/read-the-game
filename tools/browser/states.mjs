/**
 * THE STATES A PROBE HAS TO VISIT — including the three nobody was visiting.
 *
 * ⭐ WHY. The survivorship experiment planted 187 defects and left 19 that a
 * reader could see and nothing caught (docs/survivorship-experiment.md §4). They
 * are not scattered: they cluster in states no probe ever entered.
 *
 *   - ⏹ the non-default **Tabletop** figure style held EIGHT of the 19 — and on
 *     2026-09-17 Kevin deleted it with the goaltender's-eye view, the only surface
 *     that could select it (docs/status.md). A blind spot over unreachable code is
 *     closed by deleting the code, not by instrumenting it;
 *   - **motion**. Every probe ran with `prefers-reduced-motion` and one settled
 *     frame, and the figures' wobble and bob are `motion ? Math.sin(t·…) : 0` —
 *     so the code that moves them was never once executed;
 *   - **gestures**. Double-click steps the replay and a click on a mark opens a
 *     door; both are branches only a second event reaches.
 *
 * ⚠️ A WALK IS EVIDENCE ABOUT THE STATES IT VISITED, AND ABOUT NO OTHERS. That is
 * the property this module exists to widen, so each state says what it enters and
 * how — and `docs/defects/blind-spots-2026-09-17/` records how many of the 19 the
 * new ones actually catch, which is the measurement, not the intention.
 *
 * TWO SIGNALS PER STATE: the DOM (and the text a reader sees) for anything drawn
 * as elements — which on this rink is everything, because the marks are real nodes
 * drawn by SvgPen — and a screenshot where a state asks for one.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromeRun, findChrome, serve } from './lib.mjs';

export const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 16);

/**
 * The states, each naming what it enters. `page` is served from the copy handed
 * to `capture`; `seed` runs before the page's own scripts (localStorage); `after`
 * runs inside the probe once the page has settled, and is where a gesture lives.
 */
export const STATES = [
  { key: 'replay/opening', page: 'read-the-game.html' },
  { key: 'replay/mid', page: 'read-the-game.html', at: 0.55 },
  { key: 'replay/moving', page: 'read-the-game.html', at: 0.55, advance: 1200,
    why: 'motion left running and sampled after it has moved — every earlier probe ran reduced and settled' },
  { key: 'replay/step-back', page: 'read-the-game.html', at: 0.55, gesture: 'dblclick-left',
    why: 'the double-click that steps backwards — a branch only a second event reaches' },
  { key: 'replay/step-forward', page: 'read-the-game.html', at: 0.55, gesture: 'dblclick-right',
    why: 'and forwards, which is the other half of the same handler' },
  { key: 'replay/mark-door', page: 'read-the-game.html', at: 0.55, gesture: 'click-mark',
    why: 'a click on a mark, which opens the why-card or the clip' },
];

/**
 * The probe page: it frames the subject, drives it, and writes what it found into
 * the document where `--dump-dom` will print it.
 *
 * ⛔ THE GESTURE IS DISPATCHED AT `elementFromPoint`, NEVER AT AN ELEMENT BY ID
 * (CHENG's ruling, test-program.md §11.2 Q3): dispatching to the element directly
 * clicks through an overlay a person could not, which is the `force: true` trap.
 * A dispatch that lands on an unexpected element is a finding, not a retry.
 */
export function probeHtml(state) {
  const at = state.at == null ? 'null' : state.at;
  return `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head>
<body style="margin:0">
<iframe id="f" src="${state.page}" style="width:1100px;height:900px;border:0"></iframe>
<script type="text/plain" id="out">pending</script>
<script>
function fire(doc, type, x, y, detail) {
  var el = doc.elementFromPoint(x, y);
  if (!el) return 'nothing at ' + x + ',' + y;
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: detail || 1, view: doc.defaultView }));
  return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.getAttribute('class') ? '.' + el.getAttribute('class').replace(/\\s+/g, '.') : '');
}
setTimeout(function () {
  var f = document.getElementById('f'), d = f.contentDocument, note = '';
  try {
    var sc = d.getElementById('scrub');
    if (${at} !== null && sc) { sc.value = Math.round(+sc.max * ${at}); sc.dispatchEvent(new Event('input')); }
    var g = ${JSON.stringify(state.gesture || null)};
    if (g) {
      var ice = d.getElementById('ice') || d.getElementById('rink');
      var r = ice.getBoundingClientRect();
      var y = r.top + r.height / 2;
      if (g === 'dblclick-left') note = fire(d, 'dblclick', r.left + r.width * 0.25, y, 2);
      if (g === 'dblclick-right') note = fire(d, 'dblclick', r.left + r.width * 0.75, y, 2);
      if (g === 'click-mark') {
        var m = d.querySelector('#events [data-i]');
        if (!m) { note = 'no mark on the ice at this frame'; }
        else { var b = m.getBoundingClientRect(); note = fire(d, 'click', b.left + b.width / 2, b.top + b.height / 2, 1); }
      }
    }
  } catch (e) { note = 'threw: ' + e.message; }
  setTimeout(function () {
    var d = document.getElementById('f').contentDocument;
    var body = d.body.cloneNode(true);
    body.querySelectorAll('script').forEach(function (s) { s.remove(); });
    document.getElementById('out').textContent =
      'NOTE ' + (note || '-') + '\\nTEXT ' + d.body.innerText + '\\nDOM ' + body.outerHTML;
    document.title = 'STATE ok';
  }, ${state.advance || 0} + 250);
}, 3000);
</script></body></html>`;
}

/** What the probe reported, split into the two signals and the gesture's landing. */
export function readState(html) {
  const m = /<script type="text\/plain" id="out">([\s\S]*?)<\/script>/.exec(html);
  if (!m || m[1].trim() === 'pending') return null;
  const body = m[1];
  const note = /^NOTE ([^\n]*)/.exec(body);
  const text = /\nTEXT ([\s\S]*?)\nDOM /.exec(body);
  const dom = /\nDOM ([\s\S]*)$/.exec(body);
  if (!text || !dom) return null;
  return { note: note ? note[1] : '', text: hash(text[1]), dom: hash(dom[1]) };
}

/**
 * Render every state from a directory holding the pages and their data.
 * ⚠️ The clock is NOT paused here the way the review gallery pauses it: these
 * states exist to let time pass. What makes them comparable is that every state
 * is given the same settle and the same `advance`, and the pixel signal is only
 * read where the drawing is a canvas.
 */
export async function capture({ dir, chrome = findChrome(), states = STATES, shots = null }) {
  const server = await serve(dir);
  const probes = mkdtempSync('/tmp/rtg-states-');
  const out = {};
  try {
    for (const s of states) {
      writeFileSync(join(probes, `${s.key.replace(/\W/g, '_')}.html`), probeHtml(s));
    }
    const probeServer = await serve(probes);
    try {
      for (const s of states) {
        const file = `${s.key.replace(/\W/g, '_')}.html`;
        // The probe and the subject must share an origin, or the frame is opaque:
        // the probe files are copied INTO the site copy rather than served beside it.
        writeFileSync(join(dir, file), probeHtml(s));
        const seeded = s.seed ? `${server.url}/${file}` : `${server.url}/${file}`;
        if (s.seed) {
          // localStorage is per-origin, so a page on this origin must set it first.
          writeFileSync(join(dir, `seed-${file}`),
            `<!doctype html><meta charset="utf-8"><title>seed</title><script>${s.seed};location.replace('${file}')</script>`);
        }
        const url = s.seed ? `${server.url}/seed-${file}` : seeded;
        const dom = (await chromeRun(['--headless', '--no-sandbox', '--disable-gpu',
          '--virtual-time-budget=20000', '--dump-dom', url], { chrome })).out;
        const rec = readState(dom) || { note: 'the probe never reported', text: null, dom: null };
        if (s.pixels) {
          const png = join(probes, `${s.key.replace(/\W/g, '_')}.png`);
          await chromeRun(['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
            '--window-size=1100,900', `--screenshot=${png}`, '--virtual-time-budget=20000', url], { chrome });
          try { rec.px = hash(readFileSync(png)); if (shots) writeFileSync(join(shots, `${s.key.replace(/\W/g, '_')}.png`), readFileSync(png)); }
          catch { rec.px = null; }
        }
        out[s.key] = rec;
      }
    } finally { probeServer.stop(); }
  } finally { server.stop(); rmSync(probes, { recursive: true, force: true }); }
  return out;
}

/** Which states differ between two captures, and on which signal. */
export function differences(base, now) {
  const out = [];
  for (const k of Object.keys(base)) {
    const a = base[k], b = now[k] || {};
    const on = ['dom', 'text', 'px'].filter(f => a[f] != null && a[f] !== b[f]);
    if (on.length) out.push({ key: k, on });
  }
  return out;
}
