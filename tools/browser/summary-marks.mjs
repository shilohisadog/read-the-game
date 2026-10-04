/**
 * EVERY CLUB ON THE SUMMARY CARD HAS A MARK OF ITS OWN, AND A READER CAN SEE IT.
 *
 * ⭐⭐⭐ WHY THIS EXISTS. Kevin, 2026-10-04: *"now we collapse the metrics into
 * totals for the game and that doesn't really help understand 'what this game
 * was'… maybe compare each team's metrics."* The card now draws a mark per club
 * on one rail, against a per-TEAM-GAME reference class built for it.
 *
 * ⛔⛔ AND THE DEFECT THAT CANNOT BE SEEN FROM THE DOM IS AN OVERLAP. Two clubs
 * tie on a lens constantly — the same number of blocks, the same number of draws
 * — and two dots at one position are ONE dot. The DOM would say two marks exist,
 * each at the correct percentage, with the correct colours, and the reader would
 * see a single mark and conclude the clubs were different. `test/overlay-archive
 * -door.test.js` asserts the positions and is structurally blind to this: it is
 * the "verifying an ATTRIBUTE is not verifying VISIBILITY" shape this repo has
 * paid for more than once.
 *
 * ⭐ SO THE CHECK IS PIXELS. Each mark is rasterised and compared against the
 * rail beside it, and the two club marks on a row are required to be separable —
 * which the stylesheet achieves by putting them on different LINES while leaving
 * the horizontal position, the datum, untouched.
 *
 * ⚠️ NO BACKTICKS IN THE SAMPLER'S COMMENTS. It lives inside a template literal
 * and this repo has terminated that string twice.
 */
import { cpSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';

export const NAME = 'summary-marks';
export const NEEDS_SITE = false;

/* ⭐ THE GAME THE PROBE READS, AND IT IS ONE THE SUITE ALREADY VETTED. A fixture
   built to make a picture work is a picture that works on a fixture, so this is a
   published extract copied byte-for-byte from the archive — and rather than add a
   ninth, it reuses `test/fixtures/extracts`, whose README states why each of the
   eight is there. 2025030214 is a playoff game, so its season's per-team-game
   classes are a FINISHED season's: ~2,800 team-games, the widest and most stable
   reference the archive holds. The narrow October case is covered one tier down,
   by `test/overlay-archive-door.test.js` against whatever season is current. */
export const GAME = 2025030214;

/** How far apart two marks must be, in pixels, to be two marks. */
export const APART = 4;
/** How different a mark must be from the rail beside it to be visible at all. */
export const INK = 40;

/* ⭐ THE CANARY PUTS THE CLUB MARKS BACK ON ONE LINE, which is the card as it
   would be with the stylesheet's vertical split removed — every tie in the
   archive collapsing to a single dot. It also drags them to one position, so a
   row whose clubs differ collapses too: the probe must catch BOTH, and a canary
   that only moved one would leave the other claim unfalsifiable. */
export const CANARY =
  "window.__canary = function(){"
  + "document.querySelectorAll('.strack').forEach(function(t){"
  + "var m = t.querySelectorAll('.spt');"
  + "if (m.length < 2) return;"
  + "for (var k = 0; k < m.length; k++) {"
  + "m[k].style.top = '50%'; m[k].style.left = m[0].style.left; }});};";

const SAMPLER = `
(function(){
  /* ⭐ DRIVEN THROUGH THE SCRUBBER, which is the control a reader has — not a
     function the page happens to expose. The summary opens itself at the horn, so
     reaching the horn is the whole of the setup. */
  function toTheHorn(){
    var s = document.getElementById('scrub');
    if (!s) return false;
    s.value = s.max;
    s.dispatchEvent(new Event('input'));
    return true;
  }
  function go(){
    if (!toTheHorn()) return emit([]);
    if (window.__canary) window.__canary();
    var out = [];
    var rows = document.querySelectorAll('.srows li');
    for (var r = 0; r < rows.length; r++) {
      var li = rows[r];
      var track = li.querySelector('.strack');
      if (!track) continue;
      var label = (li.querySelector('b') || {}).textContent || ('row ' + r);
      var tb = track.getBoundingClientRect();
      var pts = track.querySelectorAll('.spt');
      var marks = [];
      for (var k = 0; k < pts.length; k++) {
        var b = pts[k].getBoundingClientRect();
        marks.push({ cls: pts[k].className.split(/\\s+/).pop(),
          cx: b.left + b.width / 2, cy: b.top + b.height / 2,
          w: b.width, h: b.height });
      }
      out.push({ label: label, marks: marks,
        box: { x: tb.left, y: tb.top, w: tb.width, h: tb.height } });
    }
    emit(out);
  }
  function emit(out){
    var p = document.createElement('p');
    p.id = 'summarks';
    p.textContent = 'SUMMARKS ' + JSON.stringify(out);
    document.body.appendChild(p);
  }
  setTimeout(go, 1400);
})();`;

export function readRows(html) {
  const m = /SUMMARKS (\[.*?\])<\/p>/s.exec(html);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/**
 * ⛔ THE JUDGEMENT IS SEPARATE FROM THE READING, so the rule can be pushed at with
 * rows this repo made up and no browser anywhere near it.
 */
export function judgeRows(rows, apart = APART, ink = INK) {
  if (!rows || !rows.length) return ['the card drew no rows at all — the probe measured nothing'];
  const bad = [];
  let pairs = 0, singles = 0;
  for (const r of rows) {
    const where = r.label || 'a row';
    if (!r.marks || !r.marks.length) { bad.push(`${where}: a rail with no mark on it`); continue; }
    for (const m of r.marks) {
      if (!(m.w > 2 && m.h > 2)) bad.push(`${where}: the ${m.cls} mark rendered ${m.w}x${m.h}px`);
      /* ⛔ AND ON ITS OWN RAIL. A mark positioned outside the track it belongs to
         is pointing at a scale the reader cannot see. */
      if (m.cx < r.box.x - 2 || m.cx > r.box.x + r.box.w + 2)
        bad.push(`${where}: the ${m.cls} mark is at x=${Math.round(m.cx)} and its rail `
          + `runs ${Math.round(r.box.x)}–${Math.round(r.box.x + r.box.w)}`);
    }
    if (r.marks.length === 1) { singles++; continue; }
    if (r.marks.length !== 2) { bad.push(`${where}: ${r.marks.length} marks on one rail`); continue; }
    pairs++;
    /* ⭐⭐ THE CLAIM THE DOM CANNOT MAKE. Two marks are two marks only if a reader
       can see two. Separated horizontally is enough; when the clubs tie, the
       stylesheet's vertical split is the only thing left holding them apart. */
    const [p, q] = r.marks;
    const dx = Math.abs(p.cx - q.cx), dy = Math.abs(p.cy - q.cy);
    if (dx < apart && dy < apart)
      bad.push(`${where}: its two club marks are ${dx.toFixed(1)}px apart across and `
        + `${dy.toFixed(1)}px down — they are drawn on top of each other, so the row `
        + 'shows a reader one mark where two clubs are being compared');
    if (p.cls === q.cls)
      bad.push(`${where}: both marks carry the class ${p.cls}, so nothing says which `
        + 'club is which');
  }
  if (!bad.length && !pairs)
    bad.push('not one row drew a mark per club — the card is back to game totals, or '
      + 'this fixture no longer reaches the rows that split');
  if (!bad.length && !singles)
    bad.push('every row split by club, including the one that cannot: a stoppage names '
      + 'a rule and never a team, so exactly one row must carry a single mark');
  return bad;
}

function build(work, canary) {
  const root = new URL('../../', import.meta.url).pathname;
  mkdirSync(work, { recursive: true });
  /* ⛔⛔ THE SHELL, NOT THE INLINED PAGE, AND THAT IS THE WHOLE SETUP. The first
     draft served `read-the-game.html`, which says of itself that it *"carries a
     single game and never asks for the archive"* — so `RATES` is undefined there,
     every row's reference class is null, no rail is drawn, and the probe reported
     "the card drew no rows". It was right: there are none on that page. The card's
     scales only exist where the archive does, which is the shell.
     ⭐ AND THE ARCHIVE IS THE REAL ONE. `data/measures.json` is the document the
     site publishes, so the per-team-game classes the marks are placed on are the
     ones a reader meets — an invented histogram here would let the picture pass
     against a shape the pipeline never produces. */
  const dir = join(root, 'src');
  writeFileSync(join(work, 'measures.json'), readFileSync(join(root, 'data/measures.json')));
  cpSync(join(dir, 'read-the-game.html'), join(work, 'read-the-game.html'));
  /* ⭐ A REAL GAME, AND THE SHELL FETCHES IT THE WAY IT FETCHES EVERY OTHER ONE.
     The extract is one of the archive's own, copied in beside the measurement, so
     the counts the card prints are counts of hockey that was played. GAME is the
     most recent regular-season game the published catalog holds; see the note on
     it below. */
  mkdirSync(join(work, 'extract'), { recursive: true });
  cpSync(join(root, 'test/fixtures/extracts', `${GAME}.json`),
         join(work, 'extract', `${GAME}.json`));
  writeFileSync(join(work, 'catalog.json'), JSON.stringify({ games: [] }));
  let html = readFileSync(join(dir, 'game.html'), 'utf8');
  /* ⛔ THE CSP COMES OFF — the page pins `script-src`, so an injected sampler is
     REFUSED and the probe would measure an unmodified page: a canary that cannot
     sing. The lesson `door-row` paid for. */
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  html = html.replace(/"https:\/\/data\.readthegame\.co"/g, '""');
  html = html.replace('</body>', `<script>${canary || ''}${SAMPLER}</script></body>`);
  writeFileSync(join(work, 'index.html'), html);
  return `/index.html?game=${GAME}`;
}

export async function check({ chrome, work = '/tmp/rtg-summary-marks' }) {
  let ok = true;
  for (const kind of ['subject', 'canary']) {
    const dir = join(work, kind);
    const path = build(dir, kind === 'canary' ? CANARY : null);
    const server = await serve(dir);
    try {
      /* ⭐ THE SUMMARY OPENS ITSELF AT THE HORN, so the probe drives the page to
         the last frame the way a reader does — through the scrubber, which is the
         control a reader has — rather than calling a function the page happens to
         export. */
      const html = await dumpDom(`${server.url}${path}`, { chrome, budget: 12000 });
      const rows = readRows(html);
      const bad = judgeRows(rows);
      if (kind === 'subject') {
        if (bad.length) { bad.forEach(m => fail(m)); ok = false; }
        else say(`${rows.length} rows: ${rows.filter(r => r.marks.length === 2).length} `
          + `drawing a mark per club, ${rows.filter(r => r.marks.length === 1).length} `
          + 'belonging to neither');
      } else if (!bad.length) {
        fail('THE CANARY PASSED. Putting both club marks on one line and one position '
          + 'is the card every tie in the archive would draw, and this probe saw '
          + 'nothing — so it is not measuring what it claims to.');
        ok = false;
      } else say(`canary: ${bad.length} caught — as they must. First: ${bad[0]}`);
    } finally { server.stop(); }
  }
  return ok;
}
