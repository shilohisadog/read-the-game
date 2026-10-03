/**
 * EVERY MARK ON THE PREVIEW CARD SITS AT THE NUMBER PRINTED BESIDE IT.
 *
 * ⛔⛔⛔ THE DEFECT, FOUND BY KEVIN ON THE LIVE CARD OVER TWO READINGS,
 * 2026-10-03: *"I am still having a hard time wrapping my head around a graph
 * where the lines stop at the same point, but the numbers say 40 / 25."*
 *
 * He was describing the encoding exactly. Each club's mark was a BAR drawn from
 * the league figure to the club's value, so its length was the GAP between them.
 * On a card where both clubs sit below the league every bar ends on the league
 * tick — two clubs at 40% and 25% stopped at the same place — and the longer bar
 * belonged to the club further from average. Defensible as a chart of distance;
 * unreadable as a chart of a value, which is what the number beside it is.
 *
 * ⭐ AND A BAR COULD NOT BE THE FIX EITHER. The axis starts at the lowest
 * club-season, not at zero, so a bar grown from the left edge gives the lowest
 * club no bar at all and makes every length a lie about its own proportion. A
 * value on a truncated axis has one honest encoding: WHERE IT SITS. So the card
 * draws a mark at the value, and this probe is the promise that it does.
 *
 * ⚠️ THE CHECK IS A RECONCILIATION, which is the only shape worth having here.
 * The printed figure, the printed axis ends and the mark's position are all read
 * off the RENDERED page by separate paths, and the arithmetic that must hold
 * between them is done here. Nothing compares the renderer with itself — the
 * trap `verdict-dot` was written for, one surface over.
 *
 * ⚠️ AND NOTHING ANYWHERE LOOKED AT THIS CHART UNTIL TODAY. `grep trackFor test/
 * tools/` returned nothing: 1,600 tests, fourteen browser probes, and the one
 * picture on the page a novice is sent to had no check of any kind.
 *
 * ⏭ IT ALSO CHECKED THAT THE SHADED BAND'S EDGES STAYED VISIBLE, until Kevin had
 * the band removed the same day: *"I don't think the shading is necessary."* The
 * track now carries a rail, the league tick and the two club marks, so there is
 * no boundary left to lose. Those assertions went rather than being kept green
 * against nothing.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';

export const NAME = 'preview-marks';
export const NEEDS_SITE = false;

/** How far a mark's centre may sit from its number, in percent of the track. */
export const TOLERANCE = 2;
/**
 * How much CLUB INK a mark must carry — the largest per-channel difference
 * between any pixel of the mark and the track beside it.
 *
 * ⛔ "DIFFERS FROM THE TRACK" WAS NOT ENOUGH, AND THE MUTATION PROVED IT. Deleting
 * the outline leaves a mark whose fill is `games / need` — 1/35 in October, so
 * effectively white — over the opaque white backdrop the band-showing-through fix
 * put there. That still differs from the pale track by about 20 per channel, so a
 * white NOTCH passed a visibility check while carrying none of the club's colour.
 * Measured on the fixture: with the outline the largest difference is about 150,
 * without it about 20. 60 sits well clear of both, and the mark's whole job at a
 * low game count is to be visible AS THE CLUB'S.
 */
export const INK = 60;

/* ⭐ THE CANARY IS THE OLD ENCODING, RESTORED: put every mark back on the league
   tick and the card is what Kevin was reading — marks that stop at the same
   point while the numbers differ. A probe that cannot see that cannot pass.
   ⛔ It is a FUNCTION the sampler calls, not a statement: an earlier canary here
   ran at script-parse time, before the page had fetched anything, so it removed
   nothing and subject and canary were the same page. Hook the canary to the
   measurement, never to a clock. */
export const CANARY =
  "window.__canary = function(){"
  + "document.querySelectorAll('.pvsvg').forEach(function(s){"
  + "var tick = s.querySelector('rect[fill=\"#2b3b46\"]'); if (!tick) return;"
  + "var to = +tick.getAttribute('x');"
  /* ⚠️ ALL THREE RECTS OF THE MARK, not just the outlined one. The mark is a
     white backdrop, a translucent fill and an outline stacked at one geometry;
     an earlier canary moved only the stroked rect, the probe located the mark by
     its FILL, and the canary PASSED — it had displaced something the check was
     no longer looking at. A canary must break the thing the probe measures. */
  + "s.querySelectorAll('rect[fill-opacity], rect[stroke], rect[fill=\"#fff\"]')"
  + ".forEach(function(m){"
  + "m.setAttribute('x', to - (+m.getAttribute('width')) / 2);});});};";

/**
 * TONIGHT'S CARD, AS DATA — the numbers Kevin was reading, exactly.
 *
 * ⛔ TWO FILLER CLUBS, AND THEY ARE NOT PADDING. `leagueShares` sums over every
 * club in the season bucket, so a fixture holding only the two clubs in the game
 * puts the league figure BETWEEN them. The fillers put it where the real card has
 * it (50%, 31%, 50%), which is what makes one club sit outside the band and the
 * axis wider than it — the shape this picture is hardest to read in.
 */
export function fixture(measures) {
  const club = (lf, la, dc, dn, sc, sn) => ({ games: 1,
    level5: { for: lf, against: la }, dmen: { count: dc, n: dn },
    slot: { count: sc, n: sn },
    attempts: { for: 50, against: 50 }, blocks: { count: 0, n: 1 },
    saves: { count: 0, n: 1 }, record: { reg: { w: 1, l: 0, otl: 0, undecided: 0 },
      post: { w: 0, l: 0, undecided: 0 } }, goalies: [] });
  const seasons = { 2026: {
    WSH: club(4, 6, 15, 43, 21, 34),
    TBL: club(2, 6, 23, 63, 23, 39),
    /* level5 totals 20 for / 20 against -> 50%; dmen 64 of 206 -> 31%;
       slot 64 of 128 -> 50%. Asserted in test/browser-checks.test.js. */
    AAA: club(8, 4, 13, 50, 10, 27),
    BBB: club(6, 4, 13, 50, 10, 28),
  } };
  return {
    'schedule.json': { upcoming: [{ id: 2026020099, away: 'WSH', home: 'TBL',
      startTimeUTC: '2099-10-03T23:00:00Z', date: '2099-10-03', gameType: 2 }] },
    'catalog.json': { games: [] },
    'recent.json': { asOf: '2099-10-03T11:00:00Z', games: [] },
    'teams.json': { through: '2099-10-02', scope: 'fixture', seasons: seasons, archive: {} },
    'measures.json': measures,
  };
}

/** The sampler, run in the page: every row's number, its axis, and its mark. */
const SAMPLER = `
(function(){
  function go(){
    if (window.__canary) window.__canary();
    var out = [];
    var cards = document.querySelectorAll('.pvm');
    for (var c = 0; c < cards.length; c++) {
      var card = cards[c];
      var label = (card.querySelector('.pvlab') || {}).textContent || '?';
      /* THE AXIS, READ OFF THE PAGE — the two numbers printed under the track. */
      var ends = card.querySelector('.pvends');
      var es = ends ? ends.querySelectorAll('span') : [];
      var lo = es.length > 1 ? parseFloat(es[0].textContent) : null;
      var hi = es.length > 1 ? parseFloat(es[1].textContent) : null;
      var svgs = card.querySelectorAll('.pvsvg');
      var vals = card.querySelectorAll('.pvv');
      for (var i = 0; i < svgs.length; i++) {
        var svg = svgs[i];
        /* LOCATED BY ITS FILL, NOT BY ITS OUTLINE, and the difference is a whole
           assertion. The first version found the mark by its stroke -- so
           deleting the outline, which is the one thing holding a mark drawn at
           3% opacity, ALSO deleted the probe's ability to find it. The mutation
           was caught, but as "this row is not being checked", never as "the mark
           has gone invisible". A locator that disappears with the defect cannot
           report the defect. fill-opacity is on the mark's fill and on nothing
           else in this picture.
           NOTE: no backticks anywhere in this script -- it lives inside a
           template literal, and the first draft of this very comment terminated
           the string it is written in. */
        var mark = svg.querySelector('rect[fill-opacity]') || svg.querySelector('rect[stroke]');
        var printed = vals[i] ? parseFloat(vals[i].textContent) : null;
        var box = svg.getBoundingClientRect();
        var W = Math.round(box.width), H = Math.round(box.height);
        out.push({ label: label, lo: lo, hi: hi, printed: printed, w: W, h: H,
          at: mark ? (+mark.getAttribute('x')) + (+mark.getAttribute('width')) / 2 : null,
          wide: mark ? +mark.getAttribute('width') : null });
      }
    }
    /* ⭐ AND THE PIXELS, so "the mark is there" is not taken on the DOM's word. */
    var pend = out.length;
    if (!pend) return emit(out);
    var svgs2 = document.querySelectorAll('.pvsvg');
    for (var k = 0; k < svgs2.length; k++) {
      (function (svg, rec) {
        var box = svg.getBoundingClientRect();
        var W = Math.round(box.width), H = Math.round(box.height);
        if (!(W > 40 && H > 4) || rec.at == null) { rec.ink = null; if (!--pend) emit(out); return; }
        var clone = svg.cloneNode(true);
        clone.setAttribute('width', W); clone.setAttribute('height', H);
        var img = new Image();
        img.onload = function () {
          var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
          var g = cv.getContext('2d');
          g.drawImage(img, 0, 0, W, H);
          var y = Math.round(H / 2);
          var px = Math.min(W - 1, Math.max(0, Math.round(rec.at / 100 * W)));
          var off = function (u, v) { return Math.max(Math.abs(u[0] - v[0]),
            Math.abs(u[1] - v[1]), Math.abs(u[2] - v[2])); };
          /* The track well clear of the mark on whichever side has room. */
          var away = px > W / 2 ? Math.max(0, px - 30) : Math.min(W - 1, px + 30);
          var base = g.getImageData(away, y, 1, 1).data;
          /* ACROSS THE WHOLE MARK, TAKING THE LARGEST DIFFERENCE. Sampling only
             the centre reads the FILL, which at this game count is nearly white;
             the outline is what actually carries the mark and it lives at the
             edges. A centre-only reading called a white notch visible. */
          var half = Math.max(1, Math.round((rec.wide || 1.8) / 100 * W / 2));
          var most = 0;
          for (var s2 = -half; s2 <= half; s2++) {
            var at2 = px + s2;
            if (at2 < 0 || at2 >= W) continue;
            most = Math.max(most, off(g.getImageData(at2, y, 1, 1).data, base));
          }
          rec.ink = most;
          if (!--pend) emit(out);
        };
        img.onerror = function () { rec.ink = null; if (!--pend) emit(out); };
        img.src = 'data:image/svg+xml;charset=utf-8,'
          + encodeURIComponent(new XMLSerializer().serializeToString(clone));
      })(svgs2[k], out[k]);
    }
  }
  function emit(out) {
    var p = document.createElement('p');
    p.id = 'marksout';
    p.textContent = 'MARKS ' + JSON.stringify(out);
    document.body.appendChild(p);
  }
  setTimeout(go, 1200);
})();`;

export function readMarks(html) {
  const m = /MARKS (\[.*?\])<\/p>/s.exec(html);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/**
 * ⛔ THE JUDGEMENT IS SEPARATE FROM THE READING, so the rule can be pushed at
 * with rows this repo made up and no browser anywhere near it.
 */
export function judgeMarks(rows, tol = TOLERANCE, ink = INK) {
  if (!rows || !rows.length) return ['the page drew no rows at all — the probe measured nothing'];
  const bad = [];
  let reconciled = 0;
  rows.forEach((r, i) => {
    const where = `${r.label || 'row ' + i}`;
    if (r.printed == null || r.lo == null || r.hi == null || r.at == null) {
      bad.push(`${where}: the page printed ${JSON.stringify({ value: r.printed, lo: r.lo,
        hi: r.hi, at: r.at })} — something the reconciliation needs is missing, so this `
        + 'row is not being checked at all');
      return;
    }
    if (!(r.hi > r.lo)) { bad.push(`${where}: the axis runs ${r.lo} to ${r.hi}`); return; }
    /* ⭐ THE ARITHMETIC THAT MUST HOLD. The printed figure is rounded to whole
       percent, so half a point of the axis is allowed for that on top of `tol`. */
    const want = 100 * (r.printed - r.lo) / (r.hi - r.lo);
    const slack = tol + 50 / (r.hi - r.lo);
    if (Math.abs(r.at - want) > slack) {
      bad.push(`${where}: the card prints ${r.printed}% on an axis of ${r.lo}–${r.hi}%, `
        + `which is ${want.toFixed(1)}% along the track — and the mark is at `
        + `${r.at.toFixed(1)}%. The picture and the number disagree about where this `
        + 'club is.');
      return;
    }
    reconciled++;
    /* ⭐ AND IT IS ACTUALLY ON SCREEN. The fill is `games / need` — 1/35 on a
       preview in October — so the mark is nearly transparent and the outline is
       all that carries it. A mark nobody can see reconciles perfectly. */
    if (r.ink != null && r.ink < ink) {
      bad.push(`${where}: the mark at ${r.at.toFixed(1)}% differs from the track beside `
        + `it by only ${r.ink} — at this game count the fill is near zero and the `
        + 'outline is the only thing holding it, so it has gone invisible.');
    }
  });
  /* ⛔ AND IT MUST HAVE MEASURED SOMETHING. Every assertion above is vacuous on a
     page that drew nothing, which is the shape this repo pays for most.
     ⚠️ ONLY WHEN NOTHING ELSE FAILED, and that is not softening it. A row that
     fails its reconciliation RETURNS before its edges are read, so a card with
     one misplaced mark would otherwise also be told its band edges are missing —
     a true statement about this run and a false one about the page, reported
     beside the real fault. "Nothing failed and nothing was checked" is the state
     worth a message; "something failed" already has one. */
  if (!bad.length && !reconciled) {
    bad.push('not one mark was reconciled against its number — the probe proved nothing');
  }
  return bad;
}

function build(work, canary) {
  const root = new URL('../../', import.meta.url).pathname;
  mkdirSync(work, { recursive: true });
  const measures = JSON.parse(readFileSync(join(root, 'data/measures.json'), 'utf8'));
  for (const [name, doc] of Object.entries(fixture(measures)))
    writeFileSync(join(work, name), JSON.stringify(doc));
  let html = readFileSync(join(root, 'src/preview.html'), 'utf8');
  /* ⛔ THE CSP COMES OFF, and this is the lesson `door-row` paid for: the page
     pins `script-src`, so an injected sampler is REFUSED and the probe measures
     an unmodified page — a canary that cannot sing. */
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  html = html.replace(/"https:\/\/data\.readthegame\.co"/g, '""');
  html = html.replace('</body>', `<script>${canary || ''}${SAMPLER}</script></body>`);
  writeFileSync(join(work, 'preview.html'), html);
  return '/preview.html?game=2026020099';
}

export async function check({ chrome, work = '/tmp/rtg-preview-marks' }) {
  let ok = true;
  for (const kind of ['subject', 'canary']) {
    const dir = join(work, kind);
    const path = build(dir, kind === 'canary' ? CANARY : null);
    const server = await serve(dir);
    try {
      const rows = readMarks(await dumpDom(`${server.url}${path}`, { chrome, budget: 9000 }));
      const bad = judgeMarks(rows);
      if (kind === 'subject') {
        if (bad.length) { bad.forEach(m => fail(m)); ok = false; }
        else say(`${rows.length} marks, each sitting at the number printed beside it`);
      } else if (!bad.length) {
        fail('THE CANARY PASSED. Putting every mark back on the league tick restores the '
          + 'exact card Kevin could not read — marks stopping at the same point while the '
          + 'numbers differ — and this probe saw nothing, so it is not measuring what it '
          + 'claims to.');
        ok = false;
      } else {
        say(`canary: ${bad.length} mark(s) caught sitting away from their number — as they must`);
      }
    } finally { server.stop(); }
  }
  return ok;
}
