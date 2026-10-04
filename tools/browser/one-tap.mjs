/**
 * ONE TAP ON THE SCRUBBER PLAYS THE PLAY ONCE.
 *
 * ⭐⭐⭐ WHY THIS EXISTS. Kevin, 2026-10-04: *"when it plays continuously and
 * event by event it plays fine, but when I tap the scrubber to a different time,
 * the replay appears to go through two loops for each event."*
 *
 * He was right. A native range reports one tap TWICE —
 *
 *     pointerdown=280   input=110   pointerup=110   change=110
 *
 * — the same value from `input` and from `change`, 108ms apart, so the page drew
 * frame 110 as a scrub and then drew it again as a jump. The label's entrance
 * animation ran twice, 117ms apart, and the mark was drawn plain and then
 * re-drawn popping.
 *
 * ⛔⛔ AND IT IS INVISIBLE TO EVERY OTHER CHECK HERE, FOR TWO REASONS.
 *
 * The first is the GESTURE: every probe in this directory drives the scrubber by
 * dispatching `input` alone, which is half of a gesture no hand can make, so the
 * pair was never exercised. `tools/browser/cdp.mjs` presses the control with a
 * trusted event instead, which is the first thing in this repo that can.
 *
 * The second is the PROPERTY. The damage is an ANIMATION RESTARTING, and the
 * document after two draws is byte-identical to the document after one — so no
 * assertion about the DOM, however careful, can see it. `animationstart` is the
 * property the claim is actually about, and counting it is the whole check. That
 * is the 2026-10-04 lesson applied the same day it was learned: name the
 * property the claim is about, then check THAT one.
 *
 * ⚠️ NO BACKTICKS IN THE WATCHER'S COMMENTS. It lives inside a template literal
 * and this repo has terminated that string twice.
 */
import { cpSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fail, say, serve, findChrome } from './lib.mjs';
import { boxOf, evaluate, page, tap } from './cdp.mjs';

export const NAME = 'one-tap';
export const NEEDS_SITE = false;

/* THE GAME IS ONE THE SUITE ALREADY VETTED — see `summary-marks` for why a
   fixture built to make a picture work is a picture that works on a fixture.
   Any of the eight would do here: this check is about the control, not the
   hockey, and it asks only that the frame it lands on have something on it. */
export const GAME = 2025030214;

/* WHERE ON THE TRACK. Four tenths along is mid-second-period on any game and
   lands on a frame with a located event, a label and a puck; the far ends are
   the pre-game rink and the horn, where there is deliberately nothing to draw
   and a probe would measure an empty page. */
export const ALONG = 0.4;

/* HOW LONG THE POINTER IS DOWN, and the judgement below is derived FROM it
   rather than from a number chosen to make the check pass. `input` fires at the
   press and `change` at the release, so this IS the gap between the two reports
   -- measured at 108ms from a real hand, and this is the probe's own hand. A
   landing drawn once starts every animation it starts in a single rendering
   frame; a landing drawn twice spreads them across the hold. Half the hold is
   therefore a bound no correct page can reach and no doubled page can avoid. */
export const HOLD = 90;

/**
 * What the page animates for one tap, counted by name.
 *
 * ⭐ THE WATCHER IS A LISTENER, NOT A POLL. A 0.28s fade restarted 117ms in is
 * never two animations at one instant — at any moment there is exactly one —
 * so `document.getAnimations()` reports a correct page and a broken one
 * identically. The START is the event, and it is the only observable.
 */
const WATCHER = `
(function(){
  window.__anim = [];
  window.__ev = [];
  var t0 = performance.now();
  var at = function(){ return Math.round(performance.now() - t0); };
  document.addEventListener('animationstart', function(e){
    window.__anim.push({ name: e.animationName, at: at() });
  }, true);
  var s = document.getElementById('scrub');
  if (s) ['pointerdown','input','change'].forEach(function(t){
    s.addEventListener(t, function(){ window.__ev.push(t + '=' + s.value); });
  });
  window.__armed = function(){ window.__anim = []; window.__ev = []; return true; };
})();`;

/* ⛔⛔ THE CANARY SPENDS THE WITHHELD REPORT, WHICH IS THE PAGE AS IT SHIPPED.
 *
 * The fix withholds the FIRST value a gesture reports, because a tap reports
 * exactly one and a drag reports many. So the canary dispatches a synthetic
 * `input` from `pointerdown` — the page's own handler has already begun the
 * gesture by then — and the real report that follows is the gesture's SECOND,
 * which is drawn. The frame is then drawn at the press and again at the release,
 * 90ms apart: the defect, restored, without patching a line of the page.
 *
 * ⚠️ AND IT HAS TO BE AT THE PRESS. The first version of this canary dispatched
 * from `pointerup`, which is microseconds before `change` — so both draws landed
 * in one beat, the probe saw nothing, and THE CANARY PASSED. It was measuring a
 * doubled page as a correct one. What the reader sees is two beats, and two
 * beats need the gap the gesture itself provides.
 *
 * ⚠️⚠️ AND IT TOOK THREE WRONG VERSIONS TO GET HERE, EACH OF WHICH PASSED.
 *
 * The second dispatched synchronously from a `pointerdown` listener and ran
 * BEFORE the page's own `onpointerdown`. The trace said so — `pointerdown=-1
 * input=-1 input=110 change=110`, every animation in one beat — and the reason
 * is a fact about this page worth keeping: THE SHELL WIRES ITS CONTROLS AFTER
 * THE FETCH. `#scrub` is in the static markup, so an injected script finds it at
 * parse time and registers first, while the page assigns its handler properties
 * only once the extract has arrived, and a property handler is a listener
 * registered when the property was set.
 *
 * The third used `setTimeout(..., 0)`, which reproduced the defect when this
 * probe ran alone and NOT when it ran after eight others: the timer slipped past
 * the 90ms release, so the synthetic report arrived after `change` rather than
 * before it. A FLAKY CANARY IS WORSE THAN NO CANARY — it passes often enough to
 * be believed.
 *
 * The fourth used `queueMicrotask`, which is worse than a timer and taught the
 * thing actually worth knowing: MICROTASKS DRAIN BETWEEN LISTENERS, not after
 * the dispatch. The JS stack empties as each listener returns, so a microtask
 * queued from the first listener still runs before the second — ahead of the
 * page's handler again, same single beat.
 *
 * ⭐ SO IT ASSUMES NO ORDER AT ALL. Two synthetic reports, dispatched
 * synchronously from the real one and guarded against re-entry, mean the page
 * draws at the press whichever way the listeners are ordered: if ours runs
 * first, the nested pair spends the withheld report and makes a real one; if
 * ours runs second, the real report was already spent and the first nested one
 * is drawn. Either way a draw lands at the press and `change` draws again 90ms
 * later, which is the defect, restored, without patching a line of the page.
 *
 * ⚠️ IT IS WRITTEN AGAINST THE CONTROL, NOT AGAINST THE FIX. A canary naming the
 * variable or the handler the fix introduced would die the day either is
 * renamed — and this repo has had a canary stop singing for exactly that reason
 * (`door-row`, the day `.lxwe` moved). `#scrub`, `pointerdown` and `input` are
 * the control a reader touches, and the day those change this check should break
 * loudly rather than approve.
 */
export const CANARY = `
(function(){
  var s = document.getElementById('scrub');
  if (!s) return;
  var inside = false;
  s.addEventListener('input', function(){
    if (inside) return;
    inside = true;
    s.dispatchEvent(new Event('input'));
    s.dispatchEvent(new Event('input'));
    inside = false;
  });
})();`;

/**
 * ⛔ THE JUDGEMENT IS SEPARATE FROM THE READING, so the rule can be pushed at
 * with counts this repo made up and no browser anywhere near it.
 */
export function judgeTap({ anim, ev }, hold = HOLD) {
  const bad = [];
  if (!ev || !ev.length) return ['the tap reported no events at all — the press did not reach the control'];
  /* THE SUBJECT MUST BE PRESENT. A frame that draws nothing animates nothing,
     and "no animation ran twice" is then true of a blank rink. */
  if (!anim || !anim.length)
    return [`the tap drew nothing: ${ev.join(' ')} — a frame with no mark, no label and `
      + 'no puck cannot say whether it was drawn once or twice'];
  const pair = ev.filter(e => e.startsWith('input=') || e.startsWith('change='));
  if (pair.length < 2)
    bad.push(`the control reported ${pair.join(' ')} — this check is about the pair a real `
      + 'tap sends, and only one of them arrived');
  /* ⭐⭐⭐ THE CLAIM IS ONE BEAT, AND THIS IS THE ONLY THING THAT CAN SEE IT.
     A frame drawn once starts every animation it starts in ONE rendering frame:
     the marks, the label, the puck, the goaltenders and the caption are all
     written inside a single synchronous `render`, so their starts share a
     timestamp. Drawn twice, the second draw lands a hold later and the arrival
     reaches the reader as two beats — which is exactly the words Kevin used.
     ⚠️ IT IS NOT "NO ANIMATION RAN TWICE", and the first version of this check
     was, which the canary caught by PASSING. `put` means a frame drawn twice
     rewrites only the subtrees whose markup differs — so on the doubled page the
     label fades once and the mark simply appears and then pops 110ms later. No
     name repeats, and the reader still sees two beats. The spread is the
     property the complaint is about. */
  const ats = anim.map(a => a.at);
  const spread = Math.max(...ats) - Math.min(...ats);
  if (spread > hold / 2) {
    const beats = [...new Set(ats)].sort((x, y) => x - y);
    bad.push(`one tap arrived in ${beats.length} beats, ${spread}ms apart: `
      + beats.map(t => `${t}ms [${anim.filter(a => a.at === t).map(a => a.name).join(' ')}]`).join(' then ')
      + ' — the frame was drawn more than once and the reader sees the play twice');
  }
  /* ⭐ AND NO SINGLE ANIMATION RESTARTS, which is the `put` half of the same
     fix: a subtree rewritten with identical markup replays its entrance.
     ⚠️ THIS RULE'S CANARY IS NOT HERE. Breaking `put` is not reachable from the
     page -- no script a canary can inject makes the renderer rewrite an
     unchanged subtree -- so it is falsified one tier down, in
     `test/render-redraw.test.js`, where two mutations of `put` are killed by the
     paired tests. Said out loud because a rule whose canary is somewhere else
     looks exactly like a rule with no canary at all. */
  const times = {};
  for (const a of anim) (times[a.name] = times[a.name] || []).push(a.at);
  for (const [name, when] of Object.entries(times)) {
    /* ⚠️ COUNTED PER NAME, AND IN TIME. Six counters ticking at once is six
       starts of `pkn` on six different elements and is CORRECT. Two starts in
       the same millisecond are two elements arriving together; two starts apart
       in time are one thing drawn twice. */
    const gap = Math.max(...when) - Math.min(...when);
    if (when.length > 1 && gap > 0)
      bad.push(`"${name}" ran ${when.length} times for one tap, ${gap}ms apart `
        + `(at ${when.join('ms, ')}ms) — the reader sees it arrive twice`);
  }
  return bad;
}

/**
 * ⭐ THE SHELL, NOT THE INLINED PAGE, and the archive is the real one — the same
 * setup `summary-marks` argues for at length, and for the same reason: a figure
 * invented here would let the control pass against a page no reader meets.
 */
function build(work, canary) {
  const root = new URL('../../', import.meta.url).pathname;
  mkdirSync(work, { recursive: true });
  writeFileSync(join(work, 'measures.json'), readFileSync(join(root, 'data/measures.json')));
  mkdirSync(join(work, 'extract'), { recursive: true });
  cpSync(join(root, 'test/fixtures/extracts', `${GAME}.json`), join(work, 'extract', `${GAME}.json`));
  writeFileSync(join(work, 'catalog.json'), JSON.stringify({ games: [] }));
  let html = readFileSync(join(root, 'src/game.html'), 'utf8');
  /* ⛔ THE CSP COMES OFF — the page pins `script-src`, so the watcher would be
     REFUSED and the probe would measure an unmodified page: a canary that cannot
     sing. The lesson `door-row` paid for, and it comes off BOTH copies so the
     only difference between them is the rule under test. */
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  html = html.replace(/"https:\/\/data\.readthegame\.co"/g, '""');
  html = html.replace('</body>', `<script>${WATCHER}${canary || ''}</script></body>`);
  writeFileSync(join(work, 'index.html'), html);
  return `/index.html?game=${GAME}`;
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function measure(dir, chrome, canary) {
  const path = build(dir, canary);
  const server = await serve(dir);
  let browser = null;
  try {
    browser = await page(`${server.url}${path}`, { chrome });
    const { cdp } = browser;
    /* THE PAGE FETCHES ITS GAME, so the probe waits for the control to exist and
       to have a game's worth of frames on it rather than for a duration. */
    const deadline = Date.now() + 20000;
    let frames = 0;
    while (Date.now() < deadline && frames < 10) {
      await wait(200);
      frames = +(await evaluate(cdp, '(document.getElementById("scrub")||{}).max||0'));
    }
    if (frames < 10) throw new Error(`the shell never loaded a game — scrub.max=${frames}`);
    /* ⛔ AND THE ICE MUST BE ON SCREEN. Portrait is ruled out, so the page hides
       the replay behind a rotate prompt and every box is 0x0 — which an earlier
       run of this probe measured and reported as "the press did not reach the
       control". A width is IMPOSED here (cdp.mjs opens 1280x1000), never
       requested, which is the rule every probe in this directory follows. */
    /* ⛔⛔ AND IT IS SCROLLED TO FIRST, WHICH THE FIRST RUN OF THIS PROBE
       TAUGHT. `getBoundingClientRect` is viewport-relative: the transport sits
       below the fold on a 1000px window, so the rect came back at y=1197, the
       press was dispatched at a point outside the window, and the probe reported
       "the press did not reach the control" — which was true, and said nothing
       about the page. A reader scrolls to the control before touching it; so
       does this. */
    await evaluate(cdp, 'document.getElementById("scrub").scrollIntoView({block:"center"})');
    await wait(200);
    const box = await boxOf(cdp, '#scrub');
    if (!box) throw new Error('#scrub has no box on screen — the replay is not laid out');
    const view = await evaluate(cdp, '({w:innerWidth,h:innerHeight})');
    /* ⛔ AND THE POINT IS INSIDE THE WINDOW, CHECKED. A press at a point the
       window does not contain is delivered to nothing and reports exactly what a
       working page reports: silence. */
    const px = box.x + box.w * ALONG, py = box.y + box.h / 2;
    if (px < 0 || py < 0 || px > view.w || py > view.h)
      throw new Error(`the control is at (${Math.round(px)}, ${Math.round(py)}) in a `
        + `${view.w}x${view.h} window — a press there reaches nothing`);
    await evaluate(cdp, 'window.__armed()');
    await tap(cdp, px, py, HOLD);
    // Long enough for a second draw to land and announce itself: the measured
    // gap is ~110ms and the longest animation on the ice is 1.3s.
    await wait(1500);
    return { anim: await evaluate(cdp, 'window.__anim'), ev: await evaluate(cdp, 'window.__ev') };
  } finally {
    if (browser) browser.stop();
    server.stop();
  }
}

export async function check({ chrome = findChrome(), work = '/tmp/rtg-one-tap' } = {}) {
  let ok = true;
  for (const kind of ['subject', 'canary']) {
    const read = await measure(join(work, kind), chrome, kind === 'canary' ? CANARY : null);
    const bad = judgeTap(read);
    if (kind === 'subject') {
      if (bad.length) { bad.forEach(m => fail(m)); ok = false; }
      else say(`one tap: ${read.ev.join(' ')} — ${read.anim.length} animation(s), `
        + `all within ${Math.max(...read.anim.map(a => a.at)) - Math.min(...read.anim.map(a => a.at))}ms: one beat`);
    } else if (!bad.length) {
      /* ⛔ AND IT SAYS WHAT IT SAW. A canary that merely reports "I passed"
         leaves you guessing at which of the gesture's five events landed where,
         and this one cost three wrong guesses before the trace was printed. */
      const beats = [...new Set(read.anim.map(a => a.at))].sort((x, y) => x - y);
      fail('THE CANARY PASSED. Drawing the frame once as a scrub and again as a jump '
        + 'is the page as it shipped until 2026-10-04, and this probe saw nothing — '
        + 'so it is not measuring what it claims to. It measured: '
        + `${read.ev.join(' ')} / `
        + beats.map(t => `${t}ms [${read.anim.filter(a => a.at === t).map(a => a.name).join(' ')}]`).join(' then '));
      ok = false;
    } else say(`canary: ${bad.length} caught — as it must. First: ${bad[0]}`);
  }
  return ok;
}
