/**
 * A WORK DOOR LANDS ON THE SECTION IT NAMES, NOT ON THE PAGE HEADER.
 *
 * ⛔⛔⛔ THE DEFECT, FOUND BY KEVIN ON THE LIVE SITE, 2026-10-03: *"in the what is
 * normal section, we provide a doorway into the how we measure page. but, each
 * link just goes to the page header, not the specific section of each metric
 * being explained."*
 *
 * ⚠️ AND NOTHING WAS WRONG WITH EITHER END. The preview writes
 * `/how-we-measure.html#m-<key>`, the methods page gives each section
 * `id="m-<key>"`, both call `anchorOf` so they cannot drift, and
 * `test/methods.test.js` already proves every door has a section. All true, all
 * green, and every door landed on the header — because `how-we-measure.html` is
 * a SHELL. Its sections are drawn after `measures.json` is fetched, and a browser
 * resolves a fragment while parsing the document, when `#hm` is still empty. It
 * finds nothing, gives up, and never looks again.
 *
 * ⭐⭐ THE DEFECT LIVES IN THE GAP BETWEEN TWO CORRECT THINGS, which is why no
 * test could see it and why this one is a browser. The subject is not a string
 * or an id: it is whether the reader ends up looking at the right paragraph.
 *
 * ⛔ AND THE CSP PINS `script-src` BY HASH, which cost an hour on the first
 * attempt: editing the page's data origin changes the script's bytes, so the
 * hash no longer matches, the browser refuses the whole script and the page
 * renders empty. It looks exactly like a fetch that failed. The CSP comes off
 * before anything else is touched — the same lesson `door-row` paid for.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';
import { EXPLAINED_ROWS, anchorFor } from '../../src/lib/anchors.js';

export const NAME = 'methods-deeplink';
export const NEEDS_SITE = false;

/** How far from the top of the viewport a landed section may sit, in pixels. */
export const SLACK = 90;

/* ⭐ THE CANARY IS THE DEFECT ITSELF: scroll back to the top after the page has
   drawn, which is exactly where every door used to leave a reader. It is a
   function the reporter calls, not a timed statement — a canary that fires
   before the thing it breaks exists does nothing, which this repo has now paid
   for once. */
export const CANARY = "window.__canary = function(){ window.scrollTo(0, 0); };";

const REPORT = `
(function(){
  setTimeout(function(){
    if (window.__canary) window.__canary();
    var want = (location.hash || '').slice(1);
    var el = want ? document.getElementById(want) : null;
    var r = el ? el.getBoundingClientRect() : null;
    var p = document.createElement('p');
    p.id = 'deepout';
    p.textContent = 'DEEP ' + JSON.stringify({
      hash: want,
      found: !!el,
      /* How far the section's top sits from the top of the viewport. Zero-ish is
         "the reader is looking at it"; a big number is "it is somewhere below". */
      top: r ? Math.round(r.top) : null,
      scrolled: Math.round(window.scrollY || 0),
      /* AND WHERE THE KEYBOARD IS. A reader who follows a link and is left
         focused on the document has not been taken anywhere, whatever the
         scrollbar says — the next Tab goes to the top of the page. */
      focused: (document.activeElement && document.activeElement.id) || null,
      /* THE PAGE MUST HAVE DRAWN AT ALL. A shell that fetched nothing has no
         sections, and "the door did not land" would then be true and useless. */
      sections: document.querySelectorAll('[id^="m-"]').length,
      /* AND THE DOCUMENT MUST BE TALL ENOUGH FOR LANDING TO MEAN ANYTHING. If
         everything fits on one screen there is nowhere to scroll to and every
         door "lands" by doing nothing. */
      tall: Math.round(document.documentElement.scrollHeight),
      view: Math.round(window.innerHeight)
    });
    document.body.appendChild(p);
  }, 1500);
})();`;

export function readDeep(html) {
  const m = /DEEP (\{.*?\})<\/p>/s.exec(html);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/**
 * ⛔ THE JUDGEMENT IS SEPARATE FROM THE READING, so the rule can be pushed at
 * with readings this repo made up and no browser anywhere near it.
 */
export function judgeDeep(d, slack = SLACK) {
  if (!d) return ['the page reported nothing — the probe measured nothing'];
  const bad = [];
  if (!d.hash) bad.push('the probe asked for no fragment, so it proved nothing');
  if (!d.sections) {
    bad.push('the methods page drew no sections at all, so "the door did not land" '
      + 'would be true for a reason that has nothing to do with the door');
    return bad;
  }
  /* ⛔ AND THE PAGE MUST BE SCROLLABLE. On a document that fits the viewport every
     fragment "lands" without moving, and this check would pass on a page whose
     deep links are broken. */
  if (!(d.tall > d.view + slack)) {
    bad.push(`the document is ${d.tall}px in a ${d.view}px viewport — there is nowhere `
      + 'to scroll to, so landing on a section means nothing here');
    return bad;
  }
  if (!d.found) {
    bad.push(`#${d.hash} names no section on the page, so the door is dead rather `
      + 'than merely mis-landing');
    return bad;
  }
  if (Math.abs(d.top) > slack) {
    bad.push(`#${d.hash} is ${d.top}px from the top of the viewport after load — the `
      + 'reader followed a door to a specific measurement and is looking at '
      + 'something else. The sections are drawn after measures.json arrives, so the '
      + 'browser resolved the fragment against an empty page and gave up.');
  }
  /* ⭐ AND THE KEYBOARD CAME TOO. Scrolling a section into view moves the EYE; a
     reader on a keyboard or a screen reader is still at the top of the document
     and their next Tab proves it. Asserted because the page claims it: the fix
     sets `tabIndex` and calls `focus`, and a claim nothing checks is a comment.
     ⚠️ Checked only when the landing itself worked — focus is a second property
     of a door that arrived, not a second way of saying it did not. */
  if (!bad.length && d.focused !== d.hash) {
    bad.push(`#${d.hash} was scrolled to but focus is on ${d.focused ? '#' + d.focused
      : 'the document'} — a reader on a keyboard has not been taken anywhere, and `
      + 'their next Tab starts from the top of the page.');
  }
  return bad;
}

function build(work, canary) {
  const root = new URL('../../', import.meta.url).pathname;
  mkdirSync(work, { recursive: true });
  writeFileSync(join(work, 'measures.json'),
    readFileSync(join(root, 'data/measures.json'), 'utf8'));
  let html = readFileSync(join(root, 'src/how-we-measure.html'), 'utf8');
  /* ⛔ CSP FIRST. It pins `script-src` by hash, so changing the data origin below
     would otherwise make the browser refuse the whole page script. */
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  html = html.replace(/"https:\/\/data\.readthegame\.co"/g, '""');
  html = html.replace('</body>', `<script>${canary || ''}${REPORT}</script></body>`);
  writeFileSync(join(work, 'how-we-measure.html'), html);
}

export async function check({ chrome, work = '/tmp/rtg-methods-deeplink' }) {
  /* ⭐ EVERY DOOR THE PREVIEW CAN WRITE, not one chosen as representative. They
     are generated from the same list the card is, so a row added tomorrow is
     checked tomorrow without anybody remembering to add it here. */
  const doors = EXPLAINED_ROWS.map(anchorFor);
  let ok = true;
  for (const kind of ['subject', 'canary']) {
    const dir = join(work, kind);
    build(dir, kind === 'canary' ? CANARY : null);
    const server = await serve(dir);
    try {
      const bad = [];
      for (const anchor of doors) {
        const d = readDeep(await dumpDom(
          `${server.url}/how-we-measure.html#${anchor}`, { chrome, budget: 9000 }));
        judgeDeep(d).forEach(m => bad.push(m));
      }
      if (kind === 'subject') {
        if (bad.length) { bad.forEach(m => fail(m)); ok = false; }
        else say(`${doors.length} work doors, each landing on the section it names`);
      } else if (!bad.length) {
        fail('THE CANARY PASSED. Scrolling back to the top after the page draws is '
          + 'exactly where every door used to leave a reader, and this probe saw '
          + 'nothing — so it is not measuring what it claims to.');
        ok = false;
      } else {
        say(`canary: ${bad.length} door(s) caught landing away from their section — as they must`);
      }
    } finally { server.stop(); }
  }
  return ok;
}
