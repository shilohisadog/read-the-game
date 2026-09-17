/**
 * THE PAGES FIT A PHONE, MEASURED IN A BROWSER.
 *
 * Eight of nine pages once shipped with no viewport meta, so a phone laid them
 * out at ~980px and scaled the result down until the text was unreadable. Nothing
 * failed: every test passed, every page rendered, and the only symptom was on a
 * device the author was not using.
 *
 * ⛔ THE FIRST VERSION OF THIS CHECK WAS ITSELF THE BUG IT EXISTS TO CATCH. It
 * asked Chrome for a 360px window; headless Chrome enforces a minimum width and
 * reported 500px, so it measured 485 against 500 and went green having tested a
 * screen 40% wider than the one it named. The width is IMPOSED in an iframe now,
 * and the frame's own width is asserted before any verdict.
 *
 * ⭐ TWO CANARIES, BECAUSE THEY ANSWER DIFFERENT QUESTIONS (CHENG): "a canary
 * proves the RULER works. It says nothing about whether the SUBJECT is there."
 *   - `canary` is 900px of content in a 360px frame and MUST overflow;
 *   - `gamenosubj` is the game page with its extract path broken — the exact
 *     state this gate once passed in — and MUST report no scoreboard.
 * Every real page must report a subject, or "it fits" is a claim about a blank.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';
import { sitecopy } from './sitecopy.mjs';

export const NAME = 'phone-fit';
export const WIDTH = 360, HEIGHT = 740;

/** The probe reports four numbers; this reads them back. */
export function readFit(html) {
  const m = /FIT (\d+) (\d+) (\d+) (\d+)/.exec(html);
  return m ? { frame: +m[1], client: +m[2], scroll: +m[3], subject: +m[4] } : null;
}

/**
 * What a page's four numbers mean. Pure, so the cases that have actually happened
 * — a page framed at the wrong width, a page with nothing on it, a canary that
 * failed to overflow — are testable without a browser.
 */
export function judgeFit(page, m, { width = WIDTH } = {}) {
  if (!m) return { ok: false, why: `${page.name} never reported a width — the probe did not run` };
  if (m.frame !== width) return { ok: false, why: `${page.name} was framed at ${m.frame}px, not the ${width}px this check claims` };
  const over = m.scroll > m.client + 1;
  if (page.kind === 'nosubject') {
    return m.subject === 0
      ? { ok: true, note: `${page.name}: no extract, no scoreboard, subject reported as 0 — the subject check can fail` }
      : { ok: false, why: `${page.name} reported a ${m.subject}px scoreboard with no extract — the subject check is broken, and every "it fits" is unverified` };
  }
  if (page.kind === 'overflow') {
    return over
      ? { ok: true, note: `${page.name}: 900px in ${m.client}px correctly reported as overflow — the check can fail` }
      : { ok: false, why: `${page.name} did NOT report overflow — this gate cannot detect one` };
  }
  if (m.subject <= 0) return { ok: false, why: `${page.name} laid out with NO SUBJECT — this gate measured a page with nothing on it, which is how a 25px overflow shipped` };
  if (over) return { ok: false, why: `${page.name} needs ${m.scroll}px in a ${m.client}px viewport — it scrolls sideways` };
  return { ok: true, note: `${page.name}: framed ${width}px, laid out at ${m.client}px, content needs ${m.scroll}px, subject ${m.subject}px` };
}

const probeHtml = (src, width, height) => `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head>
<body style="margin:0">
<iframe id="f" src="${src}" style="width:${width}px;height:${height}px;border:0"></iframe>
<script>
setTimeout(function () {
  var f = document.getElementById('f'), idoc = f.contentDocument;
  var d = idoc.documentElement;
  /* Three numbers, because they are different claims. The FRAME is what we
     imposed. The CLIENT width is the layout viewport inside it, which a desktop
     scrollbar makes ~15px narrower — a phone's overlay scrollbar takes none, so
     measuring against the client width is STRICTER than a real device. SCROLL is
     what the content actually needs.
     AND A FOURTH: is there anything under the ruler? Each page has its own
     subject — game.html carries the scoreboard, which is the element that
     overflows; index.html has no #rg at all (its replay is a nested iframe) so
     its subject is the hero block. */
  var rg = idoc.getElementById('rg');
  var bd = idoc.querySelector('#rg .board') || idoc.querySelector('.hero');
  var subj = (bd && (!rg || !rg.hidden)) ? Math.round(bd.getBoundingClientRect().height) : 0;
  document.title = 'FIT ' + f.clientWidth + ' ' + d.clientWidth + ' ' + d.scrollWidth + ' ' + subj;
}, 4000);
</script></body></html>`;

export async function check({ site, chrome, dir }) {
  const work = dir || (await import('node:fs')).mkdtempSync('/tmp/rtg-phone-');
  await sitecopy(site, work);
  // The 900px bar that must overflow, and the game page whose extract cannot resolve.
  writeFileSync(join(work, 'canary.html'),
    '<!doctype html><html><head><meta charset="utf-8"><title>canary</title></head>' +
    '<body style="margin:0"><div style="width:900px;height:20px;background:#c00"></div></body></html>');
  writeFileSync(join(work, 'gamenosubj.html'),
    readFileSync(join(work, 'game.html'), 'utf8').replaceAll('/extract/', '/nosuch/'));

  const pages = [
    { name: 'index.html', kind: 'real' },
    { name: 'game.html', kind: 'real' },
    { name: 'gamenosubj.html', kind: 'nosubject' },
    { name: 'canary.html', kind: 'overflow' },   // canaries LAST: they prove the two above can fail
  ];
  for (const p of pages) writeFileSync(join(work, `probe-${p.name}`), probeHtml(p.name, WIDTH, HEIGHT));

  const server = await serve(work);
  let ok = true;
  try {
    for (const p of pages) {
      const v = judgeFit(p, readFit(await dumpDom(`${server.url}/probe-${p.name}`, { chrome })));
      if (v.ok) say(v.note); else { fail(v.why); ok = false; }
    }
  } finally { server.stop(); }
  return ok;
}
