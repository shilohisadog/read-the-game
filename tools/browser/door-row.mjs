/**
 * THE THREE DOORS UNDER THE RINK SHARE ONE ROW, SO THEY SHARE ONE LAYOUT.
 *
 * ⛔ THE DEFECT THIS EXISTS FOR, found by Kevin on the live site 2026-10-02:
 * `What this game was` did not line up with `How we counted` and `Is that a lot?`
 * beside it. Measured before it was touched — all three BOXES were identical
 * (290x44 at the same top) and the LABEL inside the third sat 5px from its left
 * edge and 7px from its top, against 89–102px and 14px for the other two.
 *
 * ⭐ WHY NO TEST COULD HAVE HELD IT. The cause was an absence: `#rg .lxw`
 * declared no `display`, so the two doors that are always present took the UA's
 * `block` for a `<button>`, which centres its contents on both axes by machinery
 * no other display type has. The third is hidden until the horn, so its reveal
 * rule HAD to name a display value — and `flex` turned that one button into a
 * flex container whose start-aligned default replaced the centring it inherited
 * from nobody. Every one of those facts is a COMPUTED STYLE and a BOX. The suite
 * runs against a fake document with no CSS and no layout: it cannot see any of
 * them, which is `docs/looking-at-pixels.md`'s whole subject.
 *
 * ⚠️ SO IT ASSERTS TWO DIFFERENT CLAIMS, because either alone is weak:
 *
 *   SAME — the three doors resolve to the same display, the same cross-axis and
 *   main-axis alignment. This is the divergence the defect WAS, and it fires
 *   however the row is laid out next.
 *
 *   CENTRED — each label's centre sits on its own door's centre, both axes. This
 *   one has a path to its expected value that does not run through the other two
 *   doors: a door's centre comes from the flex row that sizes it. Without it,
 *   three doors drifting TOGETHER would pass — the shape `mechanize-the-review`
 *   #31 names, a picture checked only against its neighbour in the same picture.
 *
 * ⚠️ AND IT NEEDS A LAYER ON. `.lbox.empty .lxw{visibility:hidden}` — with
 * `Just events` selected the box has no ledger and all three doors are invisible,
 * so a probe that forgot to pick a layer would measure three hidden buttons and
 * report that they agreed. `visible` is read back and judged.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromeRun, fail, findChrome, say, serve } from './lib.mjs';

export const NAME = 'door-row';
export const NEEDS_SITE = false;

/** How far a label's centre may sit from its door's, in CSS pixels, on either axis. */
export const TOLERANCE = 2;

/**
 * ⭐ THE CANARY IS THE DEFECT ITSELF, restored declaration for declaration.
 *
 * ⛔⛔ AND IT MAY NOT BE A SHORTER VERSION OF IT. Injecting only `display:block`
 * would leave `align-items:center` from the live rule applying to the third door,
 * which is still `display:flex` — so the canary would render CENTRED and pass,
 * and a canary that cannot sing proves the check works when it does not. The
 * alignment properties are returned to their initial values alongside, which is
 * the state the page was actually in.
 *
 * ⚠️ INJECTED BEFORE `</body>`, because this page's stylesheet is inside the
 * body: a same-specificity rule placed in the head loses on document order.
 */
export const CANARY = '#rg .lxw{display:block;align-items:normal;justify-content:normal}'
                    + '#rg.ended .lxw.lxwe{display:flex}';

export function probeHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head>
<body style="margin:0">
<iframe id="f" src="read-the-game.html" style="width:1100px;height:900px;border:0"></iframe>
<script type="text/plain" id="out">pending</script>
<script>
setTimeout(function () {
  var d = document.getElementById('f').contentDocument;
  var r = { booted: false, ended: false, doors: [] };
  try {
    /* THE PAGE IS VISIBLE ONLY ONCE IT HAS BOOTED -- \`#rg\` ships hidden and
       \`reveal()\` unhides it, so this is "boot ran" with no prose in the path. */
    var rg = d.getElementById('rg');
    r.booted = !!rg && !rg.hidden;
    /* A LAYER, OR THE DOORS ARE INVISIBLE. See the note on \`.lbox.empty\`. */
    var pk = d.querySelector('#rg .pk[data-l="goaltending"]');
    if (pk) pk.click();
    var s = d.getElementById('scrub');
    s.value = s.max;
    s.dispatchEvent(new Event('input'));
    r.ended = rg.classList.contains('ended');
    /* \u26d4 THE SUMMARY OPENS ITSELF AT THE HORN, AND THE DOOR THEN READS
       "Hide". The first run of this probe measured that -- a four-letter label in
       a 290px door, which is a different question from the one Kevin asked. The
       panel is closed again so the row under test carries the three real labels,
       and \`labels\` is reported so a probe that stops closing it cannot quietly
       go back to measuring the short one. */
    var sp = d.getElementById('sumPanel');
    if (sp && !sp.hidden) d.getElementById('sum').click();
    r.doors = [].map.call(d.querySelectorAll('#rg .lxw'), function (b) {
      var box = b.getBoundingClientRect();
      var rng = d.createRange();
      rng.selectNodeContents(b);
      var lab = rng.getBoundingClientRect();
      var cs = d.defaultView.getComputedStyle(b);
      return {
        id: b.id,
        text: (b.textContent || '').trim(),
        visible: cs.visibility === 'visible' && cs.display !== 'none',
        display: cs.display, align: cs.alignItems, justify: cs.justifyContent,
        /* CENTRES, NOT EDGES. A label's measured WIDTH varies with how the
           browser boxes an anonymous flex item; where its centre falls does not,
           and the centre is what "lined up" means. */
        dx: Math.round((lab.left + lab.width / 2) - (box.left + box.width / 2)),
        dy: Math.round((lab.top + lab.height / 2) - (box.top + box.height / 2)),
        box: Math.round(box.width) + 'x' + Math.round(box.height)
      };
    });
  } catch (e) { r.err = String(e); }
  document.getElementById('out').textContent = JSON.stringify(r);
}, 6000);
</script></body></html>`;
}

export function readDoors(html) {
  const m = /<script type="text\/plain" id="out">([\s\S]*?)<\/script>/.exec(html);
  if (!m || m[1] === 'pending') return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/**
 * ⚠️ EVERY REFUSAL HERE IS A DIFFERENT FACT, and the message says which. "The
 * doors do not line up" over a page that never booted is a false report about a
 * working site, which is how `preview-fits` learned to state `booted` first.
 */
export function judgeDoors(r, { tolerance = TOLERANCE } = {}) {
  const out = [];
  const ok = (ok_, why) => out.push({ ok: ok_, why });
  if (!r) return [{ ok: false, why: 'door-row: the probe wrote nothing — the page did not run' }];
  if (r.err) return [{ ok: false, why: `door-row: the probe threw — ${r.err}` }];
  ok(r.booted, 'door-row: the replay never booted, so the row measured is not the one a reader sees');
  ok(r.ended, 'door-row: the replay never reached the horn, and the third door does not exist before it');
  ok(r.doors.length === 3, `door-row: expected three doors under the rink, found ${r.doors.length}`);
  if (!r.booted || !r.ended || r.doors.length !== 3) return out;
  for (const d of r.doors)
    ok(d.visible, `door-row: "${d.text}" is not visible — a layer must be on, or three hidden buttons agree about nothing`);
  /* ⛔ AND THE LABELS MUST BE THE ONES A READER SEES. Every door reads `Hide`
     while its own panel is open, and the summary opens ITSELF at the horn — so a
     probe that forgets to close it measures a four-letter word in a 290px box and
     reports on a row nobody has. */
  ok(!r.doors.some(d => d.text === 'Hide'),
    `door-row: a door still reads "Hide" — a panel is open, so this is not the row Kevin reported on`);
  /* SAME: the divergence the defect was. */
  const key = d => `${d.display}/${d.align}/${d.justify}`;
  const keys = [...new Set(r.doors.map(key))];
  ok(keys.length === 1,
    `door-row: the three doors are laid out differently — ${r.doors.map(d => `${d.text}: ${key(d)}`).join(' · ')}`);
  /* CENTRED: a path to the expectation that does not run through the siblings. */
  for (const d of r.doors) {
    ok(Math.abs(d.dx) <= tolerance,
      `door-row: "${d.text}" sits ${d.dx}px off the horizontal centre of its own ${d.box} door`);
    ok(Math.abs(d.dy) <= tolerance,
      `door-row: "${d.text}" sits ${d.dy}px off the vertical centre of its own ${d.box} door`);
  }
  return out;
}

/**
 * ⛔⛔ THE POLICY COMES OFF BOTH COPIES, AND THE FIRST RUN IS WHY.
 *
 * The canary PASSED on its first run and the reason was not the CSS: the page's
 * `style-src` is pinned to two hashes, so the injected `<style>` was refused and
 * the canary measured an unmodified page. A canary that cannot sing reports that
 * the check works at exactly the moment it does not.
 *
 * ⭐ IT IS STRIPPED FROM THE SUBJECT TOO, so the only difference between the
 * two measurements is the rule under test. The policy's own correctness is a
 * separate claim with its own check — `tools/browser/csp-refusal.mjs` against the
 * real page, and set-equality in `test/shell.test.js` — which is the same
 * division `docs/looking-at-pixels.md` §5 settles: this tool can tell you the
 * layout is right and cannot tell you the CSP is.
 */
export const unpin = html => html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g, '');

async function measure(dir, chrome, extraCss) {
  const page = unpin(readFileSync(join(dir, 'read-the-game.html'), 'utf8'));
  writeFileSync(join(dir, 'read-the-game.html'),
    extraCss ? page.replace('</body>', `<style>${extraCss}</style></body>`) : page);
  writeFileSync(join(dir, 'probe.html'), probeHtml());
  const srv = await serve(dir);
  try {
    const { out } = await chromeRun(['--headless', '--no-sandbox', '--disable-gpu',
      '--virtual-time-budget=20000', '--dump-dom', `${srv.url}/probe.html`], { chrome });
    return readDoors(out);
  } finally { srv.stop(); }
}

export async function check({ chrome = findChrome(), repo = process.cwd() } = {}) {
  const src = join(repo, 'src/read-the-game.html');
  const dir = mkdtempSync('/tmp/rtg-doors-');
  try {
    cpSync(src, join(dir, 'read-the-game.html'));
    const r = await measure(dir, chrome, null);
    if (r && r.doors) for (const d of r.doors)
      say(`${(d.text || d.id).padEnd(20)} ${d.box} ${d.display}/${d.align}/${d.justify}`
        + `  label off centre by ${d.dx}x${d.dy}px`);
    let ok = true;
    for (const v of judgeDoors(r)) if (!v.ok) { fail(v.why); ok = false; }
    /* ⛔ AND THE CANARY MUST FAIL. A check that passes on the defect it was
       written for is a check that is not running. */
    const can = mkdtempSync('/tmp/rtg-doors-canary-');
    try {
      cpSync(src, join(can, 'read-the-game.html'));
      const c = await measure(can, chrome, CANARY);
      const rejected = judgeDoors(c).some(v => !v.ok);
      say(`canary (the defect restored): ${rejected ? 'rejected, as it must be' : 'ACCEPTED'}`);
      if (!rejected) { fail('door-row: the canary passed — this check cannot see the defect it exists for'); ok = false; }
    } finally { rmSync(can, { recursive: true, force: true }); }
    return ok;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
