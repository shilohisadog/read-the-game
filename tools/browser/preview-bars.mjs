/**
 * A BAR ON THE PREVIEW CARD IS ONE SHAPE, IN ONE TONE.
 *
 * ⛔⛔⛔ THE DEFECT, FOUND BY KEVIN ON TONIGHT'S PREVIEW, 2026-10-03: *"definitely
 * looks like something is amiss with our calculations, or else I don't understand
 * how to read the line graphs."* Nothing was amiss with the calculations — the
 * league total of the measure conserves to exactly 50.00% over 7,872 club-games.
 *
 * The bar's fill is `fill-opacity: games / need`, which is Kevin's ruled ramp and
 * is right. On a preview in OCTOBER that ratio is 1/35, so the bar was painted at
 * THREE PER CENT and what a reader actually saw inside the outline was the shaded
 * band showing through it. The band's edge then landed mid-bar as a crisp colour
 * step — and a step inside a bar reads as a FILL LEVEL, which is the one thing it
 * was not. Measured off his screenshot: every bar changed tone at x≈965px and the
 * band edge computes to x=970px.
 *
 * ⚠️ AND NOTHING ANYWHERE LOOKED AT THIS CHART. `grep trackFor test/ tools/`
 * returned nothing on the day it broke: 1,600 tests, fourteen browser probes, and
 * the one picture on the page a novice is sent to had no check of any kind. This
 * is that check, and it is pixels on purpose — every structural fact about the
 * markup was already true while the picture was unreadable.
 *
 * ⭐ WHY A FIXTURE AND NOT THE LIVE SITE. The dangerous case needs a club far
 * from the league figure, a low game count, and a band edge falling inside the
 * bar. Waiting for the schedule to produce one means a probe that passes all
 * summer because there is nothing to draw — "a check that can only pass in
 * conditions that expire", logged here twice. The fixture is tonight's card: the
 * real page, the real `trackFor`, and the numbers Kevin was looking at.
 */
import { mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';

export const NAME = 'preview-bars';
export const NEEDS_SITE = false;

/** How far two sampled pixels may differ per channel and still be "one tone". */
export const TOLERANCE = 6;
/** Points sampled across each bar's interior. */
export const SAMPLES = 24;

/**
 * ⭐ THE CANARY IS THE DEFECT ITSELF, RESTORED: delete the opaque backdrop from
 * every bar and the page is byte-for-byte what Kevin was reading.
 *
 * ⛔⛔ AND IT IS A FUNCTION THE SAMPLER CALLS, NOT A STATEMENT. The first version
 * ran at script-parse time — before the page had fetched anything, before a
 * single bar existed — so it removed nothing, the subject and the canary were the
 * same page, and the canary PASSED. That is this repo's canary shape in a third
 * costume: after "a canary the page's own CSP blocks" and "a canary that set only
 * `display`", now **a canary that fires before the thing it breaks exists.**
 * Hooking it to the sampler removes the timing from the question entirely.
 */
export const CANARY =
  "window.__canary = function(){"
  + "document.querySelectorAll('.pvsvg').forEach(function(s){"
  + "s.querySelectorAll('rect[fill=\"#fff\"]').forEach(function(r){r.remove();});});};";

/**
 * TONIGHT'S CARD, AS DATA — the numbers Kevin was reading, exactly.
 *
 * WSH 4 of 10 and TBL 2 of 8 on `level5`; 15 of 43 and 23 of 63 on `dmen`; 21 of
 * 34 and 23 of 39 on `slot`, one game each.
 *
 * ⛔ TWO FILLER CLUBS, AND THEY ARE NOT PADDING. `leagueShares` sums over every
 * club in the season bucket, so a fixture holding only the two clubs in the game
 * puts the league figure BETWEEN them — and the first version of this probe drew
 * four bars of ZERO WIDTH, because each club's figure was the league's. The
 * fillers put the league where the real card has it (50%, 31%, 50%), which is
 * what makes a bar long enough to cross a band edge and the picture dangerous.
 * `judgeBars` requires that crossing rather than trusting this arithmetic.
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
    /* level5 totals 20 for / 20 against -> 50%, which it is by construction over a
       real league; dmen 64 of 206 -> 31%; slot 64 of 128 -> 50%. */
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

/** The sampler, run in the page: every bar's interior, read off a canvas. */
const SAMPLER = `
(function(){
  function go(){
    /* THE CANARY FIRES HERE, with the bars on screen and immediately before they
       are measured. See CANARY. */
    if (window.__canary) window.__canary();
    var out = [];
    var svgs = document.querySelectorAll('.pvsvg');
    for (var i = 0; i < svgs.length; i++) {
      var svg = svgs[i];
      /* THE BAR IS THE RECT WITH A STROKE — the outline is drawn once per bar and
         nothing else in this picture is stroked. Locating the subject, not
         deciding what colour it should be. */
      var bar = svg.querySelector('rect[stroke]');
      if (!bar) { out.push({ bar: false }); continue; }
      /* The band-edge marks, by their own fill, in viewBox units. */
      var EDGEX = [];
      svg.querySelectorAll('rect[fill="#8fb0cc"]').forEach(function (m) {
        EDGEX.push((+m.getAttribute('x')) + (+m.getAttribute('width')) / 2);
      });
      var box = svg.getBoundingClientRect();
      var W = Math.round(box.width), H = Math.round(box.height);
      if (!(W > 40 && H > 4)) { out.push({ tiny: true, w: W, h: H }); continue; }
      var clone = svg.cloneNode(true);
      clone.setAttribute('width', W); clone.setAttribute('height', H);
      var url = 'data:image/svg+xml;charset=utf-8,'
        + encodeURIComponent(new XMLSerializer().serializeToString(clone));
      (function (bar, W, H, url, out, EDGEX) {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          c.width = W; c.height = H;
          var g = c.getContext('2d');
          g.drawImage(img, 0, 0, W, H);
          /* The bar in viewBox units is x..x+width of 100; convert to pixels and
             inset past the stroke and the rounded corners. */
          var x0 = (+bar.getAttribute('x')) / 100 * W;
          var x1 = x0 + (+bar.getAttribute('width')) / 100 * W;
          var pad = Math.max(2, (x1 - x0) * 0.08);
          var a = Math.round(x0 + pad), b = Math.round(x1 - pad);
          var y = Math.round(H / 2);
          /* ⚠️ AS MANY SAMPLES AS THE BAR HAS PIXELS, up to the cap. The first
             version demanded ${SAMPLES} pixels of span and skipped four of the six
             bars on a 800px headless viewport — a probe that reports "0 pixels
             sampled" is honest, but a probe that silently sampled only the widest
             bar would have been the real trap. The floor is 6: below that there
             is no interior to speak of and the bar is a sliver. */
          var n = Math.min(${SAMPLES}, b - a + 1);
          var seen = [];
          if (n >= 6) {
            for (var k = 0; k < n; k++) {
              var px = Math.round(a + (b - a) * k / (n - 1));
              var d = g.getImageData(px, y, 1, 1).data;
              seen.push([d[0], d[1], d[2]]);
            }
          }
          /* ⭐ AND EVERY BAND EDGE MUST STILL BE VISIBLE. Making the bar opaque
             hides the band wherever they overlap — and in this very card both
             bars lie across the band's lower edge — so the boundary is drawn as
             its own mark on top. Checked as PIXELS, not as a rect that exists:
             a mark painted under something is in the DOM and not on the screen.
             Each edge is compared against the page four pixels either side. */
          var edges = [];
          EDGEX.forEach(function (ex) {
            var p0 = Math.round(ex / 100 * W);
            if (p0 < 5 || p0 > W - 5) return;
            var mid = g.getImageData(p0, y, 1, 1).data;
            var lft = g.getImageData(p0 - 4, y, 1, 1).data;
            var rgt = g.getImageData(p0 + 4, y, 1, 1).data;
            var off = function (u, v) { return Math.max(Math.abs(u[0] - v[0]),
              Math.abs(u[1] - v[1]), Math.abs(u[2] - v[2])); };
            edges.push({ x: p0, from: Math.min(off(mid, lft), off(mid, rgt)) });
          });
          out.push({ bar: true, w: W, span: [a, b], px: seen, edges: edges });
          done();
        };
        img.onerror = function () { out.push({ img: false }); done(); };
        img.src = url;
      })(bar, W, H, url, out, EDGEX);
    }
    var want = svgs.length;
    function done() {
      if (out.length < want) return;
      var p = document.createElement('p');
      p.id = 'barsout';
      p.textContent = 'BARS ' + JSON.stringify(out);
      document.body.appendChild(p);
    }
    if (!want) done();
  }
  setTimeout(go, 1200);
})();`;

export function readBars(html) {
  const m = /BARS (\[.*?\])<\/p>/s.exec(html);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/**
 * ⛔ THE JUDGEMENT IS SEPARATE FROM THE READING, so the rule can be unit-tested
 * against pixel rows this repo made up, with no browser anywhere near it.
 */
export function judgeBars(bars, tol = TOLERANCE) {
  if (!bars || !bars.length) return ['the page drew no bars at all — the probe measured nothing'];
  const bad = [];
  let measured = 0;
  bars.forEach((b, i) => {
    if (!b.bar) { bad.push(`bar ${i}: the page drew no outlined bar (${JSON.stringify(b)})`); return; }
    if (!b.px || b.px.length < 4) {
      bad.push(`bar ${i}: only ${(b.px || []).length} pixels sampled across span `
        + `${JSON.stringify(b.span)} of a ${b.w}px track — too narrow to judge, so this `
        + 'probe is not looking at it');
      return;
    }
    measured++;
    const [r0, g0, b0] = b.px[0];
    for (const [r, g, bl] of b.px) {
      if (Math.abs(r - r0) > tol || Math.abs(g - g0) > tol || Math.abs(bl - b0) > tol) {
        bad.push(`bar ${i} changes tone across its own interior — rgb(${r0},${g0},${b0}) to `
          + `rgb(${r},${g},${bl}). That step is the shaded band showing through a bar drawn `
          + 'at low opacity, and a reader sees it as a fill level.');
        return;
      }
    }
  });
  /* ⭐⭐ AND THE BAND'S BOUNDARY IS STILL ON SCREEN. Making the bar opaque hides
     the band wherever the two overlap, and the caption tells the reader to look
     for exactly that boundary — *"a bar past it is beyond anything a full season
     has produced"*. `build_index.py` already carries a comment about this card
     describing "a word for something usually invisible"; a boundary that can be
     covered is the same defect with the covering done by us. */
  let edgesSeen = 0;
  bars.forEach((b, i) => (b.edges || []).forEach(e => {
    edgesSeen++;
    if (e.from <= tol) {
      bad.push(`bar ${i}: the band edge at x=${e.x} is invisible — it differs from the `
        + `page four pixels either side by ${e.from}, under the ${tol} tolerance. The `
        + 'caption tells the reader to look for that boundary.');
    }
  }));
  /* ⛔ AND IT MUST HAVE MEASURED SOMETHING. Every assertion above is vacuous on a
     page that rendered no bars, which is the shape this repo pays for most. The
     edges are counted separately: this card's axis is wider than the band on two
     of its three rows, so marks are expected and their absence is not a quiet
     pass. */
  if (!measured) bad.push('no bar was sampled — the probe proved nothing');
  if (!edgesSeen) bad.push('not one band-edge mark was found on any row — either the '
    + 'marks are gone or the fixture no longer draws an axis wider than its band, and '
    + 'both make this check vacuous');
  return bad;
}

/** The page, with its data served beside it. */
function build(work, canary) {
  const root = new URL('../../', import.meta.url).pathname;
  mkdirSync(work, { recursive: true });
  const measures = JSON.parse(readFileSync(join(root, 'data/measures.json'), 'utf8'));
  const docs = fixture(measures);
  for (const [name, doc] of Object.entries(docs))
    writeFileSync(join(work, name), JSON.stringify(doc));
  let html = readFileSync(join(root, 'src/preview.html'), 'utf8');
  /* ⛔ THE CSP COMES OFF, and this is the lesson `door-row` paid for: the page
     pins `script-src`, so an injected sampler is REFUSED and the probe measures
     an unmodified page — a canary that cannot sing. */
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  /* The data origin becomes this server, so `grab` reads the fixture. */
  html = html.replace(/"https:\/\/data\.readthegame\.co"/g, '""');
  html = html.replace('</body>', `<script>${canary || ''}${SAMPLER}</script></body>`);
  writeFileSync(join(work, 'preview.html'), html);
  return '/preview.html?game=2026020099';
}

export async function check({ chrome, work = '/tmp/rtg-preview-bars' }) {
  let ok = true;
  for (const kind of ['subject', 'canary']) {
    const dir = join(work, kind);
    const path = build(dir, kind === 'canary' ? CANARY : null);
    const server = await serve(dir);
    try {
      const html = await dumpDom(`${server.url}${path}`, { chrome, budget: 9000 });
      const bars = readBars(html);
      const bad = judgeBars(bars);
      if (kind === 'subject') {
        if (bad.length) { bad.forEach(m => fail(m)); ok = false; }
        else say(`${bars.length} bars, each one tone across its interior`);
      } else if (!bad.length) {
        fail('THE CANARY PASSED. Removing the opaque backdrop restores the exact defect '
          + 'Kevin read on 2026-10-03 and this probe saw nothing, so it is not measuring '
          + 'what it claims to.');
        ok = false;
      } else {
        say(`canary: ${bad.length} bar(s) caught showing the band through them — as they must`);
      }
    } finally { server.stop(); }
  }
  return ok;
}
