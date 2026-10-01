/**
 * THE VERDICT DOT LANDS WHERE THE SENTENCE SAYS.
 *
 * ⛔ THE DEFECT THIS EXISTS FOR. `test/render-preview.test.js` already reconciles the
 * two — it reads "it lost 243 of 708" out of the prose and requires the dot's own
 * position to be 34.3% — and it was GREEN while every visitor saw the dot pinned
 * to the far left of the track on every game in the archive. The card is a `<p>`,
 * so its parts are spans; a span is inline, ignores `height` and takes its width
 * from its content; `.vtrack`'s only children are absolutely positioned, so it had
 * no content, no width, and `left:34.3%` of zero pixels is zero. The markup was
 * right and the pixels were wrong, which is the gap a fake document cannot see
 * across. So this measures BOXES: the width of the track, and where in it the
 * dot's centre actually is.
 *
 * ⭐ THE CANARY IS THE DEFECT ITSELF — a copy of the page with `.vtrack` put back
 * to inline, injected before `</body>` (the page's own stylesheet is inside the
 * body, and a same-specificity rule placed in the head loses on document order: a
 * canary placed where it cannot win is a canary that always sings).
 *
 * ⚠️ AND "BOOTED" IS ITS OWN FIELD. It asked whether `#verdict` existed — but that
 * is in the static markup, so an empty one answers yes, and five games in a row
 * were reported as having no rate when they had never rendered. `#rg` is `hidden`
 * in the markup and unhidden by `reveal()`, so "the app is visible" IS "boot ran",
 * structurally, with no prose in the path.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, fail, say, serve } from './lib.mjs';
import { sitecopy } from './sitecopy.mjs';

export const NAME = 'verdict-dot';
/** A track narrower than this is the inline-span defect, not a layout choice: the card is 56ch in a 900px frame. */
export const MIN_TRACK = 200;
/** The dot may miss the sentence by this much, in percentage points of the track. */
export const TOLERANCE = 1.5;

export function readVerdict(html) {
  const m = /VERD (\d) (\d) (\d+) (-?[\d.]+) (\d+) (\d+)/.exec(html);
  return m ? { booted: +m[1], hasTrack: +m[2], width: +m[3], pct: +m[4], count: +m[5], n: +m[6] } : null;
}

/**
 * ⛔⛔⛔ THE PROBE READS THE SENTENCE, SO IT IS STATED ONCE AND TESTED IN GATES.
 *
 * This pattern lived as a literal inside the injected script — a template
 * literal, running only in a browser, only in deploy — and on 2026-09-30 the
 * verdict card started printing its figures with thousands separators. `(\d+)`
 * then matched the tail of `1,608 of 1,234` as `608 of 1`, the probe computed
 * 60800% of the track, and the deploy failed on a page that was working.
 *
 * ⚠️ AND THE TEST WRITTEN TO PREVENT EXACTLY THIS CHECKED THE OTHER HALF.
 * `shell.test.js` asserts the probe does not key on the game line's copy,
 * saying in its own message: *"if it keys on copy again, the next wording change
 * fails the deploy on a working site."* It does key on copy, twelve lines below
 * the line that test reads — a check whose claim is narrower than its message,
 * which is this repo's most expensive recurring shape.
 *
 * ⭐ SO THE PATTERN IS A VALUE, interpolated into the page script rather than
 * typed there, and `browser-checks.test.js` runs it against a sentence
 * `sentence.js` actually produced. A wording change now goes red in the suite,
 * where it costs a minute, instead of in the deploy, where it costs a release.
 * Commas are optional in the pattern so it reads both the old form and the new.
 */
/* ⚠⚠ `it lost` BECAME `lost`, 2026-10-01. The sentence now names both outcomes
   — "it won 848 and lost 531 of 1,379" — so the word before `lost` is a number,
   not `it`. The clause this reads was deliberately left intact inside the new
   wording for exactly this reason; the anchor moved by one word and no further.
   ⛔ THE DOT STILL TRACKS THE LOSS FIGURE, which is the point of this gate: the
   picture and the prose must be the same claim. A version of this that matched
   `won ([\d,]+)` would have checked the dot against the complement and gone green
   on a dot drawn at 61.5% — right-looking, and the opposite of what is drawn. */
export const LOST_RE = /lost ([\d,]+) of ([\d,]+)/;

/** The two figures the sentence states, as numbers. */
export const lostFrom = text => {
  const m = LOST_RE.exec(text || '');
  return m ? { count: +m[1].replace(/,/g, ''), n: +m[2].replace(/,/g, '') } : null;
};

/** Where the sentence says the dot belongs. */
export const wantPct = (count, n) => (count / n) * 100;

export function judgeVerdict(m) {
  if (!m || !m.booted) return { ok: false, why: 'the page never booted, so nothing was measured' };
  if (!m.hasTrack || !m.count) return { ok: null, why: 'the card shows no comparison, so there is no dot to place' };
  const want = wantPct(m.count, m.n);
  const bad = [];
  if (m.width < MIN_TRACK) bad.push(`the track is ${m.width}px wide — it has collapsed`);
  if (Math.abs(m.pct - want) > TOLERANCE) bad.push(`the dot sits at ${m.pct}% of the track; the sentence says ${want.toFixed(1)}%`);
  return bad.length ? { ok: false, why: bad.join('; ') }
                    : { ok: true, note: `it lost ${m.count} of ${m.n} (${want.toFixed(1)}%); the track is ${m.width}px and the dot's centre is at ${m.pct}%` };
}

export function judgeCanary(m) {
  if (!m || !m.booted) return { ok: false, why: 'the canary page never booted, so its verdict proves nothing' };
  return m.width >= MIN_TRACK
    ? { ok: false, why: `the canary's collapsed track measured ${m.width}px — this step cannot detect the defect` }
    : { ok: true, note: `canary: an inline .vtrack measures ${m.width}px — this gate can fail` };
}

export const probeHtml = (page, id) => `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head>
<body style="margin:0">
<iframe id="f" src="${page}?game=${id}" style="width:900px;height:2400px;border:0"></iframe>
<script>
window.onerror = function (m) { document.title = 'VERD throw ' + m; };
setTimeout(function () {
  try {
    var d = document.getElementById('f').contentDocument;
    var rg = d.getElementById('rg'), v = d.getElementById('verdict');
    var booted = rg && !rg.hidden ? 1 : 0;
    /* THE CARD IS THE LAST FRAME'S CONTENT, so the probe has to reach the last
       frame: the page opens at the faceoff and the card is display:none until the
       replay ends. Drive the real scrubber — the class is what is under test. */
    var sc = d.getElementById('scrub');
    if (sc) { sc.value = sc.max; sc.oninput({ target: { value: sc.value } }); }
    /* \u2b50\u2b50 AND THE CARD LIVES IN AN OVERLAY SINCE 2026-10-01, so reaching the last
       frame is no longer enough to reach the card. This step measures a REAL
       BOUNDING BOX -- that is the whole reason it exists, after the dot sat at 0%
       on every game while the number behind it was right -- and a hidden panel
       reports zero width, which would fail this step on healthy pages.
       \u26a0\ufe0f CLICKED EXPLICITLY RATHER THAN TRUSTING THE AUTO-OPEN. The panel does
       open itself at the horn, but only when no other overlay is on screen; a
       gate that depended on that would be testing the courtesy rather than the
       dot, and would go red the day the courtesy is conditioned on anything
       else. Opening it here states what this probe needs. */
    var sp = d.getElementById('sumPanel'), sb = d.getElementById('sum');
    if (sp && sp.hidden && sb) sb.click();
    var tr = d.querySelector('#rg .vtrack'), pt = d.getElementById('vpt');
    var m = (v && v.textContent || '').match(${LOST_RE});
    if (!booted || !tr || !pt || !m) { document.title = 'VERD ' + booted + ' 0 0 0 0 0'; return; }
    var a = tr.getBoundingClientRect(), b = pt.getBoundingClientRect();
    /* The CENTRE of the dot as a fraction of its track. \`.vpt\` is
       translate(-50%,-50%), so its left edge is not its position — and reading
       style.left back would only re-report what the script wrote, which is the
       number that was already green while the pixels were wrong. */
    var pct = a.width ? ((b.left + b.width / 2 - a.left) / a.width * 100) : -1;
    /* COMMAS STRIPPED BEFORE THE TITLE. The title is parsed back by readVerdict
       with a digits-only pattern, so a comma there would break the outer read as
       surely as it broke the inner one. One place strips, one place reads. */
    document.title = 'VERD 1 1 ' + Math.round(a.width) + ' ' + pct.toFixed(1)
      + ' ' + m[1].replace(/,/g, '') + ' ' + m[2].replace(/,/g, '');
  } catch (e) { document.title = 'VERD throw ' + e.message; }
}, 6000);
</script></body></html>`;

export async function check({ site, chrome, dir }) {
  const work = dir || (await import('node:fs')).mkdtempSync('/tmp/rtg-verdict-');
  // Five recent games, because the card legitimately shows no track when the
  // archive holds no comparable lead — and a step that accepted that silently
  // would be measuring nothing. If none of five draw one, that is worth a red.
  const { ids } = await sitecopy(site, work, { games: 5 });
  writeFileSync(join(work, 'game-canary.html'),
    readFileSync(join(work, 'game.html'), 'utf8')
      .replace('</body>', '<style>#rg .vtrack{display:inline}</style></body>'));

  const server = await serve(work);
  try {
    let anyBooted = false, measured = null, chosen = null;
    for (const id of [...ids].reverse()) {
      writeFileSync(join(work, `probe-real-${id}.html`), probeHtml('game.html', id));
      const m = readVerdict(await dumpDom(`${server.url}/probe-real-${id}.html`, { chrome }));
      if (m && m.booted) anyBooted = true;
      const v = judgeVerdict(m);
      if (v.ok === null) { say(`${id}: ${v.why}`); continue; }
      if (!v.ok && (!m || !m.booted)) { say(`${id}: ${v.why}`); continue; }
      measured = m; chosen = id;
      if (v.ok) say(`game ${id}: ${v.note}`); else fail(v.why);
      if (!v.ok) return false;
      break;
    }
    if (!anyBooted) return fail('not one of the pages booted — this step measured nothing at all');
    if (!chosen) return fail('the pages booted but none drew a rate — nothing was measured');

    writeFileSync(join(work, `probe-canary-${chosen}.html`), probeHtml('game-canary.html', chosen));
    const c = judgeCanary(readVerdict(await dumpDom(`${server.url}/probe-canary-${chosen}.html`, { chrome })));
    if (c.ok) { say(c.note); return true; }
    return fail(c.why);
  } finally { server.stop(); }
}
