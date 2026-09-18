/**
 * THE STATES A PROBE HAS TO VISIT — and the assertion that it got there.
 *
 * ⭐ WHY. The survivorship experiment planted 187 defects and left 19 a reader
 * could see that nothing caught (docs/survivorship-experiment.md §4). Its
 * diagnosis was that they cluster in states no probe entered: the Tabletop
 * figure style, animation timing, and gestures.
 *
 * ⛔⛔ THE FIRST VERSION OF THIS FILE BELIEVED THAT DIAGNOSIS AND MEASURED
 * NOTHING — 0 of the 10 surviving escapes, on six states, and the states were
 * not the reason. What re-planting them actually showed (2026-09-17,
 * docs/defects/blind-spots-2026-09-17/):
 *
 *   - **there is no animation to sample.** `T` in `src/app.js` is declared `0`
 *     and never assigned again; there is no loop. `figMascot`'s bob is
 *     `Math.sin(t*1.7 + px*0.02)*u*0.30`, so it is a CONSTANT per-x offset. A
 *     planted change to the bob's AMPLITUDE moves 938 of 1,884 frame-states; a
 *     planted change to its `t` multiplier — which is `s20260916-23`, one of the
 *     19 — moves nothing, and never can. The blind spot was a dead subject.
 *   - **a state named by a FRACTION OF THE SCRUB is not a state.** The first
 *     version sampled 0.55, which on the reference game is frame 147, a faceoff.
 *     Faceoffs are not drawn as figures (`marks.js`: only the current attempt
 *     is), so every probe that was supposed to exercise the figure code was
 *     looking at a circle. ⭐ THAT IS THE RULE THIS FILE NOW KEEPS: a state names
 *     the SUBJECT it needs, seeks a frame that has it, and FAILS if it never
 *     found one — rather than reporting a clean hash of the wrong frame.
 *   - **most of what is left is not a state at all.** Of the 10 escapes still
 *     plantable, 3 are equivalent, 1 is dead code, 1 is on another page, 2 need a
 *     different SPECIMEN (a short-handed goal; Philadelphia, the only one of 33
 *     clubs whose contrast falls in the mutated band), and 2 are gestures. Only
 *     the last two are what this file can close.
 *
 * SO THIS IS A WITNESS CHECK, NOT A CHANGE DETECTOR. Each state asserts a claim
 * that a real defect has broken or could break — a figure is drawn on an attempt,
 * a goal frame says the club AND the word AND the siren, a mark with a door opens
 * one, a double-click steps by exactly one frame. `walkFrames` below is the other
 * half: the full frame × layer sweep used to MEASURE an instrument, which is a
 * different job from gating (docs/test-program.md §7.2).
 */
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromeRun, dumpDom, fail, findChrome, say, serve } from './lib.mjs';

export const NAME = 'replay-states';
export const NEEDS_SITE = false;
export const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 16);

/**
 * How much of a clickable mark must really be pressable, as a percentage of its
 * own bounding box. ⭐ MEASURED, NOT CHOSEN: 44 clickable marks in the reference
 * game sit between 32% and 35% at both 1100x900 and 844x390, because a figure is
 * a stick figure in a square box. The floor is set below the measured minimum so
 * it reports a REAL thinning rather than the ordinary shape of a figure.
 */
export const HIT_FLOOR = 25;

/** The six layer pickers the replay ships. ⚠️ The zone layer's key is `zonestart`. */
export const LAYERS = ['none', 'corsi', 'slot', 'blocked', 'goaltending', 'whistle', 'zonestart'];

/**
 * Each state: what to turn on, the SUBJECT to seek, and what must then be true.
 *
 *   setup   `data-l` layer keys and `data-t` trail keys to click first
 *   seek    a selector inside `#events`; the probe scrubs from frame 0 until a
 *           frame matches, and the state FAILS if no frame ever does
 *   gesture dispatched at `document.elementFromPoint`, never at an element by id
 *   claims  read after the gesture, judged by `judgeStates`
 */
export const STATES = [
  {
    key: 'opening',
    at: 0,
    why: 'the opening faceoff — the hero starts here, so it is the first thing a novice sees',
  },
  {
    key: 'attempt-figure',
    seek: '.fig.att',
    why: 'a shot attempt is drawn as a PLAYER, and 135 of the reference game\'s 269 frames draw one. '
       + 'No probe before this one entered a figure frame, which is why every figure defect escaped',
  },
  {
    key: 'goal-figure',
    seek: '.fig.goal',
    why: 'a goal is a figure with its arms up, and its label must name the club, the word and the siren '
       + '(Kevin, 2026-09-17: "we still don\'t say GOAL - CAR - Goal Scorer")',
  },
  {
    key: 'slot-door',
    setup: { layer: 'slot' },
    seek: '.clickable',
    gesture: 'click-mark',
    why: '⛔ THE DEFECT THIS EXISTS FOR WAS LIVE IN BOTH READERS. A mark drawn as a FIGURE is a '
       + '`<g data-i>` with children, so `ev.target.dataset.i` was undefined and clicking a goal\'s own '
       + 'mark opened nothing while the caption invited it (src/app.js, `closest` not `ev.target`)',
  },
  {
    key: 'mark-swallows-step',
    setup: { layer: 'slot' },
    seek: '.clickable',
    then: { layer: 'none' },
    gesture: 'dblclick-mark',
    why: '⛔ A DOUBLE PRESS ON A MARK MUST NOT REACH THROUGH THE DOOR IT OPENED — and the other '
       + 'half of that rule is that WITHOUT a door the same gesture steps. With no layer on a slot '
       + 'mark has no door, so a double-click on it steps the replay like any other. Widening '
       + '`doorAt` from `hdOn && isHD(e)` to `||` swallows it instead and the replay silently stops '
       + 'answering a gesture — `s20260916-82`, one of the 19 escapes, and the only one of them a '
       + 'browser state was finally able to reach',
  },
  {
    key: 'step-back',
    seek: '.fig.att',
    gesture: 'dblclick-left',
    why: 'a double-click on the left half steps back exactly one frame (DBL_BACK) — a branch only a second event reaches',
  },
  {
    key: 'step-forward',
    seek: '.fig.att',
    gesture: 'dblclick-right',
    why: 'and the right half steps forward exactly one (DBL_FWD), which is the other half of the same handler',
  },
];

/**
 * The probe page: it frames the subject, drives it, and writes what it found
 * into the document where `--dump-dom` will print it.
 *
 * ⛔ THE GESTURE IS DISPATCHED AT `elementFromPoint`, NEVER AT AN ELEMENT BY ID
 * (CHENG's ruling, test-program.md §11.2 Q3): dispatching to the element directly
 * clicks through an overlay a person could not, which is the `force: true` trap.
 * A dispatch that lands on an unexpected element is a finding, not a retry.
 */
export function probeHtml(state) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head>
<body style="margin:0">
<iframe id="f" src="${state.page || 'read-the-game.html'}" style="width:1100px;height:900px;border:0"></iframe>
<script type="text/plain" id="out">pending</script>
<script>
var S = ${JSON.stringify({ at: state.at ?? null, seek: state.seek || null, setup: state.setup || null, then: state.then || null, gesture: state.gesture || null })};
function fire(doc, type, x, y, detail) {
  var el = doc.elementFromPoint(x, y);
  if (!el) return { on: 'nothing at ' + x + ',' + y };
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: detail || 1, view: doc.defaultView }));
  return { on: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.getAttribute('class') ? '.' + el.getAttribute('class').trim().replace(/\\s+/g, '.') : '') };
}
setTimeout(function () {
  var f = document.getElementById('f'), d = f.contentDocument;
  var r = { entered: false, frame: null, note: '', land: '', scrubBefore: null, scrubAfter: null, why: 0, whyText: 0, label: '' };
  try {
    var s = d.getElementById('scrub');
    if (S.setup && S.setup.layer) d.querySelector('#rg .pk[data-l="' + S.setup.layer + '"]').click();
    if (S.setup && S.setup.trails) d.querySelector('#rg .tbtn[data-t="' + S.setup.trails + '"]').click();
    var at = function (k) { s.value = k; s.dispatchEvent(new Event('input')); };
    /* SEEK THE SUBJECT. Scrubbing from 0 rather than guessing an index keeps the
       state true of a different game, and keeps the failure honest: a subject that
       is nowhere in the replay reports NOT ENTERED instead of a tidy hash. */
    if (S.seek) {
      for (var k = 0; k <= +s.max; k++) {
        at(k);
        if (d.querySelector('#events ' + S.seek)) { r.entered = true; r.frame = k; break; }
      }
      if (!r.entered) r.note = 'no frame in ' + (+s.max + 1) + ' draws ' + S.seek;
    } else { at(S.at || 0); r.entered = true; r.frame = S.at || 0; }
    if (r.entered) {
      /* ⭐ SEEK IN ONE STATE, ACT IN ANOTHER. The mark has to be FOUND with the slot
         layer on — that is what makes it a mark with a door — and then pressed with
         the layer off, which is the condition the claim is actually about. */
      if (S.then && S.then.layer) d.querySelector('#rg .pk[data-l="' + S.then.layer + '"]').click();
      r.scrubBefore = +s.value;
      var lab = d.querySelector('#labels text');
      r.label = lab ? lab.textContent : '';
      if (S.gesture) {
        var ice = d.getElementById('ice') || d.getElementById('rink');
        var b = ice.getBoundingClientRect(), y = b.top + b.height / 2;
        if (S.gesture === 'dblclick-left') r.land = fire(d, 'dblclick', b.left + b.width * 0.25, y, 2).on;
        if (S.gesture === 'dblclick-right') r.land = fire(d, 'dblclick', b.left + b.width * 0.75, y, 2).on;
        if (S.gesture === 'dblclick-mark') {
          /* The same aim-where-a-person-can-hit sweep as click-mark, then a double
             press ON the mark rather than on open ice. */
          var dm = d.querySelector('#events ' + (S.seek || '[data-i]')) || d.querySelector('#events [data-i]');
          if (!dm) { r.land = 'no mark on the ice at this frame'; }
          else {
            var did = dm.getAttribute('data-i'), db = dm.getBoundingClientRect(), dhit = 0, dn = 0, daim = null;
            for (var ax = 0; ax < 9; ax++) for (var ay = 0; ay < 9; ay++) {
              var qx = db.left + db.width * (ax + 0.5) / 9, qy = db.top + db.height * (ay + 0.5) / 9;
              dn++;
              var qe = d.elementFromPoint(qx, qy), qo = qe && qe.closest('[data-i]');
              if (qo && qo.getAttribute('data-i') === did) { dhit++; if (!daim) daim = [qx, qy]; }
            }
            r.hitPct = Math.round(dhit / dn * 100);
            r.box = Math.round(db.width) + 'x' + Math.round(db.height);
            r.land = daim ? fire(d, 'dblclick', daim[0], daim[1], 2).on : 'no point in the mark\\'s own box is the mark';
          }
        }
        if (S.gesture === 'click-mark') {
          /* ⛔ AIM WHERE A PERSON CAN ACTUALLY HIT, AND SAY WHAT FRACTION THAT IS.
             A mark drawn as a figure is a stick figure in a square box: clicking
             the box's CENTRE lands between its legs, on a faceoff dot painted
             under it, and reports "the door did not open" about a page whose door
             is fine. Measured on the reference game: 33% of a clickable mark's box
             is the mark (44 marks, min 32%, max 35%, identical at 1100x900 and at
             844x390). So the probe sweeps the box, clicks the first point that is
             really the mark, and carries the fraction — which is the number that
             falls if a mark ever becomes unhittable. Nothing here uses force. */
          var m = d.querySelector('#events ' + (S.seek || '[data-i]'));
          var id = m.getAttribute('data-i'), mb = m.getBoundingClientRect(), hit = 0, n = 0, aim = null;
          for (var gx = 0; gx < 9; gx++) for (var gy = 0; gy < 9; gy++) {
            var x = mb.left + mb.width * (gx + 0.5) / 9, y = mb.top + mb.height * (gy + 0.5) / 9;
            n++;
            var el = d.elementFromPoint(x, y), own = el && el.closest('[data-i]');
            if (own && own.getAttribute('data-i') === id) { hit++; if (!aim) aim = [x, y]; }
          }
          r.hitPct = Math.round(hit / n * 100);
          r.box = Math.round(mb.width) + 'x' + Math.round(mb.height);
          r.land = aim ? fire(d, 'click', aim[0], aim[1], 1).on : 'no point in the mark\\'s own box is the mark';
        }
      }
    }
  } catch (e) { r.note = 'threw: ' + e.message; }
  setTimeout(function () {
    var d = document.getElementById('f').contentDocument;
    try {
      var s = d.getElementById('scrub');
      r.scrubAfter = s ? +s.value : null;
      var bk = d.getElementById('whyBk'), wc = d.getElementById('whyContent');
      r.why = bk && bk.classList.contains('on') ? 1 : 0;
      r.whyText = wc ? (wc.textContent || '').trim().length : 0;
    } catch (e) { r.note = (r.note ? r.note + '; ' : '') + 'read threw: ' + e.message; }
    var body = d.body.cloneNode(true);
    body.querySelectorAll('script').forEach(function (n) { n.remove(); });
    document.getElementById('out').textContent =
      'JSON ' + JSON.stringify(r) + '\\nTEXT ' + d.body.innerText + '\\nDOM ' + body.outerHTML;
    document.title = 'STATE ok';
  }, 300);
}, 3000);
</script></body></html>`;
}

/** What the probe reported, split into its record and the two hashed signals. */
export function readState(html) {
  const m = /<script type="text\/plain" id="out">([\s\S]*?)<\/script>/.exec(html);
  if (!m || m[1].trim() === 'pending') return null;
  const body = m[1];
  const rec = /^JSON ([^\n]*)/.exec(body);
  const text = /\nTEXT ([\s\S]*?)\nDOM /.exec(body);
  const dom = /\nDOM ([\s\S]*)$/.exec(body);
  if (!rec || !text || !dom) return null;
  let parsed; try { parsed = JSON.parse(rec[1]); } catch { return null; }
  return { ...parsed, text: hash(text[1]), dom: hash(dom[1]) };
}

/**
 * Every claim as its own sentence, so a failure names the one that broke.
 * ⭐ ENTERING IS ITSELF A CLAIM, and it is first: a state that never found its
 * subject has measured nothing, and the honest report of that is red.
 */
export function judgeStates(seen) {
  const out = [];
  const want = (ok, why) => out.push({ ok, why });
  for (const s of STATES) {
    const r = seen[s.key];
    if (!r) { want(false, `${s.key}: the probe never reported — the app did not run in the frame`); continue; }
    if (!r.entered) { want(false, `${s.key}: never entered its subject — ${r.note || 'no reason given'}`); continue; }

    if (s.key === 'attempt-figure')
      want(/\bBUF|MIN|·/.test(r.label) && r.label.length > 3,
        `attempt-figure: frame ${r.frame} draws a figure but its label reads "${r.label}" — the mark and the sentence disagree`);

    if (s.key === 'goal-figure') {
      want(/GOAL/.test(r.label), `goal-figure: the label on goal frame ${r.frame} does not say GOAL — it reads "${r.label}"`);
      want(/🚨/.test(r.label), `goal-figure: the label on goal frame ${r.frame} has lost its siren — "${r.label}"`);
      want(/^[^·]*[A-Z]{3}\s*·/.test(r.label),
        `goal-figure: the label does not name the club before the event — "${r.label}". Every other event tags its team; a goal did not, and Kevin found it from the live site`);
    }

    if (s.key === 'slot-door') {
      want(r.hitPct > 0,
        `slot-door: NO point inside the mark's own ${r.box} box is the mark — it is covered, and no one can open its door`);
      want(r.hitPct == null || r.hitPct >= HIT_FLOOR,
        `slot-door: only ${r.hitPct}% of the mark's ${r.box} box can be pressed (the floor is ${HIT_FLOOR}%) — the target has thinned`);
      want(r.why === 1, `slot-door: pressing a clickable mark on frame ${r.frame} did not open the why-card (landed on ${r.land})`);
      want(r.whyText > 20, `slot-door: the why-card opened holding ${r.whyText} characters — it is empty`);
    }

    if (s.key === 'mark-swallows-step') {
      want(r.hitPct > 0, `mark-swallows-step: no point in the mark's own ${r.box} box is the mark`);
      /* ⚠️ THE DIRECTION IS DATA, NOT A CLAIM. A double press steps back on the ice's
         left half and forward on its right, so which way this mark steps depends on
         where the shot was taken. What the claim is about is that the gesture is not
         SWALLOWED: exactly one frame, either way. */
      want(Math.abs(r.scrubAfter - r.scrubBefore) === 1,
        `mark-swallows-step: with NO layer on, a double press on a mark moved frame ${r.scrubBefore} to `
        + `${r.scrubAfter} — one step either way was due, so the mark swallowed a gesture it has no door `
        + `for (landed on ${r.land})`);
      want(r.why === 0, 'mark-swallows-step: a why-card opened with no layer on — the mark has a door it should not have');
    }

    if (s.key === 'step-back')
      want(r.scrubAfter === r.scrubBefore - 1,
        `step-back: a double-click on the left half moved frame ${r.scrubBefore} to ${r.scrubAfter}, not ${r.scrubBefore - 1} (landed on ${r.land})`);

    if (s.key === 'step-forward')
      want(r.scrubAfter === r.scrubBefore + 1,
        `step-forward: a double-click on the right half moved frame ${r.scrubBefore} to ${r.scrubAfter}, not ${r.scrubBefore + 1} (landed on ${r.land})`);
  }
  return out;
}

/** Render every state from a directory holding the page. */
export async function capture({ dir, chrome = findChrome(), states = STATES }) {
  const server = await serve(dir);
  const out = {};
  try {
    for (const s of states) {
      const file = `probe-${s.key.replace(/\W/g, '_')}.html`;
      // The probe and the subject must share an origin or the frame is opaque,
      // so the probe is written INTO the copy rather than served beside it.
      writeFileSync(join(dir, file), probeHtml(s));
      const dom = await dumpDom(`${server.url}/${file}`, { chrome, budget: 25000 });
      out[s.key] = readState(dom) || { entered: false, note: 'the probe never reported' };
    }
  } finally { server.stop(); }
  return out;
}

/**
 * THE MEASURING INSTRUMENT, not the gate: every frame of every layer, hashed.
 *
 * ⭐ IT IS PROVEN SENSITIVE AND DETERMINISTIC, which is the only reason a silence
 * from it means anything: three planted changes move it (a goal mark's radius, 93
 * of 1,884 frame-states; the figure's shadow ellipse, 945; the bob's amplitude,
 * 938) and the same page walked three times gives byte-identical output.
 */
export async function walkFrames(pageFile, { chrome = findChrome(), layers = LAYERS } = {}) {
  const probe = `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head><body style="margin:0">
<iframe id="f" src="read-the-game.html" style="width:1100px;height:900px;border:0"></iframe>
<script type="text/plain" id="out">pending</script>
<script>
setTimeout(function () {
  var d = document.getElementById('f').contentDocument, s = d.getElementById('scrub'), rows = [];
  function h(x) { var v = 5381, i = x.length; while (i) v = (v * 33 ^ x.charCodeAt(--i)) >>> 0; return v.toString(16); }
  function snap(tag) {
    for (var k = 0; k <= +s.max; k++) {
      s.value = k; s.dispatchEvent(new Event('input'));
      var rg = d.getElementById('rg');
      rows.push(tag + ' ' + k + ' ' + (rg ? rg.innerHTML.length : 0) + ' ' + h(rg ? rg.innerHTML : ''));
    }
  }
  ${JSON.stringify(layers)}.forEach(function (l) {
    var p = d.querySelector('#rg .pk[data-l="' + l + '"]');
    if (!p) { rows.push('MISSING-LAYER ' + l); return; }
    p.click(); snap(l);
  });
  var t = d.querySelector('#rg .tbtn[data-t="all"]'); if (t) { t.click(); snap('trails'); }
  document.getElementById('out').textContent = rows.join('\\n');
  document.title = 'ok';
}, 3000);
</script></body></html>`;
  const dir = mkdtempSync('/tmp/rtg-walk-');
  cpSync(pageFile, join(dir, 'read-the-game.html'));
  writeFileSync(join(dir, 'walk.html'), probe);
  const server = await serve(dir);
  try {
    const dom = (await chromeRun(['--headless', '--no-sandbox', '--disable-gpu',
      '--virtual-time-budget=120000', '--dump-dom', `${server.url}/walk.html`], { chrome })).out;
    const m = /<script type="text\/plain" id="out">([\s\S]*?)<\/script>/.exec(dom);
    return !m || m[1].trim() === 'pending' ? null : m[1].trim().split('\n');
  } finally { server.stop(); rmSync(dir, { recursive: true, force: true }); }
}

export async function check({ chrome, repo = process.cwd() }) {
  const dir = mkdtempSync('/tmp/rtg-states-');
  try {
    cpSync(join(repo, 'src/read-the-game.html'), join(dir, 'read-the-game.html'));
    const seen = await capture({ dir, chrome });
    for (const s of STATES) {
      const r = seen[s.key] || {};
      say(`${s.key.padEnd(15)} ${r.entered ? `frame ${String(r.frame).padStart(3)}` : 'NOT ENTERED'}`
        + `${r.land ? `, gesture landed on ${r.land}` : ''}`
        + `${r.scrubBefore != null && r.scrubAfter !== r.scrubBefore ? `, frame ${r.scrubBefore} → ${r.scrubAfter}` : ''}`
        + `${r.label ? `, "${r.label}"` : ''}`);
    }
    let ok = true;
    for (const v of judgeStates(seen)) if (!v.ok) { fail(v.why); ok = false; }
    return ok;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
