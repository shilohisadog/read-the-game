/**
 * ⭐⭐ THE BROADCAST HIGHLIGHT — and the property that makes it defensible is
 * about what the page does NOT do.
 *
 * Kevin, 2026-09-08: "I think it adds enough value/entertainment (plus the
 * visitor doesn't leave our site) that it's worth the effort to integrate."
 *
 * ⛔⛔ OPENING THE PLAYER CONTACTS THIRTEEN THIRD-PARTY HOSTS AND RUNS AN
 * ADVERTISEMENT. Measured in a real browser: imasdk.googleapis.com,
 * pubads.g.doubleclick.net, securepubads, pagead2.googlesyndication.com,
 * s0.2mdn.net, google-analytics, googletagmanager, onetrust, and Brightcove's
 * five. The player's static config declares only a GA tracker — reading it says
 * there are no ads — and the IMA SDK loads at play time. Looking found it;
 * nothing readable would have.
 *
 * So the claim this file exists to hold is: **collapsed, the section costs a
 * visitor no request to anybody.** That is asserted as "no iframe is in the DOM
 * until a press", which is the thing a unit test can actually see. The fake
 * document has no network, so this is the honest half; the browser step is where
 * the request count belongs.
 *
 * ⭐ AND THE REFERENCE GAME POSES BOTH CASES ON ITS OWN. Regenerating it after
 * the extractor learned `clip` gave it FIVE goals, FOUR with a highlight and ONE
 * without — so the present path and the 6.6%-absent path are both real data here
 * rather than fixtures anybody arranged. Only the case the league has never
 * produced (a clip on something that is not a goal) is planted, at the bottom.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { app, PAGE_CSS, boot, rich } from './helpers/page.js';

/** The reference game's own goals, and what the league published for each. */
const GOALS = rich.events.filter(e => e.type === 'goal');
const WITH = GOALS.filter(e => e.clip != null);
const WITHOUT = GOALS.filter(e => e.clip == null);

test('the fixture still poses both cases, or everything below is vacuous', () => {
  assert.ok(WITH.length >= 2, `only ${WITH.length} goals carry a clip`);
  assert.ok(WITHOUT.length >= 1,
    'every goal in the reference game now carries a highlight, so the absent '
    + 'case — 6.6% of goals archive-wide — is no longer tested by anything');
});

/** Press a mark on the ice. `#events` delegates, so the event carries the index. */
function fireMark(a, k) {
  (a.$('events')._on.click || []).forEach(fn => fn({ target: { dataset: { i: String(k) } } }));
}

/** Drive the page to the frame showing `ev`, using the app's own playable set. */
function frameOf(a) {
  const NOT = /const SKIP=new Set\(Object\.keys\(NOT_A_PLAY\)\)/;
  assert.match(app, NOT, 'the page no longer derives its playable set from NOT_A_PLAY');
  const scrub = a.$('scrub');
  for (let k = 0; k <= +scrub.max; k++) {
    scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
    if (a.$('clipbox').dataset.id) return k;
  }
  return null;
}

test('a goal with a published highlight gets a section, shut', () => {
  const a = boot();
  assert.ok(frameOf(a) != null, 'no frame in the whole game offers the highlight');

  const box = a.$('clipbox');
  assert.equal(box.hidden, false, 'the section is hidden on the goal it belongs to');
  assert.ok(!box.open, 'the section ships open, so the advertisement runs unbidden');
  assert.ok(WITH.some(e => String(e.clip) === String(box.dataset.id)),
    `the section points at ${box.dataset.id}, which is no goal in this game`);

  // ⭐ THE READER IS TOLD BEFORE THEY PRESS, NOT AFTER. Both facts a person needs
  // to decide are in the sentence: whose video it is, and that it carries an ad.
  const say = a.$('clipSay').textContent;
  assert.match(say, /NHL\.com/, 'the sentence does not say whose video this is');
  assert.match(say, /advertisement/,
    'the sentence does not warn that pressing it plays an advertisement — the one '
    + 'thing a reader cannot discover without pressing');
  assert.match(say, /press the goal on the ice/,
    'the sentence does not teach the click, and an affordance a novice must guess '
    + 'is worth nothing (§0.00-ζ)');
});

test('⛔ and nothing is fetched from anybody until it is pressed', () => {
  /* THE PROPERTY THE WHOLE FEATURE RESTS ON. The site ships no third-party script
     anywhere; opening this player contacts thirteen hosts. That cost has to be
     opt-in per press, which means the iframe cannot exist in the markup and cannot
     be built on render. */
  assert.doesNotMatch(app, /<iframe/i,
    'an iframe is in the shipped markup, so every visitor loads it whether or not '
    + 'they asked for video');

  const a = boot();
  frameOf(a);
  assert.equal(a.$('clipFrame').innerHTML, '',
    'the player is built on render, so arriving at a goal frame contacts Brightcove '
    + 'and Google before the reader has pressed anything');
});

test('pressing the goal on the ice opens it, and builds the frame then', () => {
  const a = boot();
  frameOf(a);

  /* ⛔⛔ THE LABEL, NOT THE MARK. `#events` holds the ring — a few pixels. The
     words a reader sees, "GOAL — Lapierre" with the assists, are `drawLabel`'s
     and live in `#labels`, 106×21px. The first build wired only `#events`: it
     opened on a 6px ring and did nothing on the thing that says GOAL, and Kevin
     pressed the label, which is what anybody would press. Both are asserted here
     because the one that passed a check was not the one a person could hit. */
  a.$('labels').click();
  assert.ok(a.$('clipbox').open, 'pressing the goal label does not open the section');
  assert.match(a.$('clipFrame').innerHTML, /<iframe/, 'nothing was built on open');
  assert.match(a.$('clipFrame').innerHTML, new RegExp(String(a.$('clipbox').dataset.id)),
    'the frame was built for a different clip than the one on this goal');

  // ⭐ THE URL IS BUILT FROM THE ID. `extract.py` stores the id and never the
  // league's sharing slug, so a stored URL here would mean the extract changed.
  assert.match(a.$('clipFrame').innerHTML, /players\.brightcove\.net/,
    'the embed points somewhere other than the player');

  /* ⭐⭐ AND THE PAGE ASKS TO BE TAKEN THERE. Kevin pressed the goal and the page
     did not move; the section is ~500px below the rink, so opening it without
     scrolling is a control that reports an effect the reader cannot see. WHERE it
     lands is the browser's claim and is measured there — this is the half a fake
     with no viewport can hold, and the half that was missing. */
  const asked = a.$('clipFrame').scrolled || a.$('clipbox').scrolled || [];
  assert.ok(asked.length,
    'opening the section never asked to be scrolled into view, so a reader who '
    + 'presses the goal sees nothing happen');
  assert.equal(asked[0].block, 'center', 'the section is brought to an edge, not into view');
});

test('…and the mark opens it too, while a mark that is not a goal does not', () => {
  const a = boot();
  const k = frameOf(a);

  fireMark(a, k);
  assert.ok(a.$('clipbox').open, 'pressing the goal mark does not open the section');

  // THE CONTROL. Every other mark on the ice must be inert, or the section opens
  // on a faceoff and the sentence above it is false.
  const b = boot();
  frameOf(b);
  const other = String(k > 0 ? k - 1 : k + 1);
  fireMark(b, +other);
  assert.ok(!b.$('clipbox').open,
    `pressing frame ${other}, which is not a goal with a clip, opened the player`);
});

test('closing tears the player down, which is what stops the advertisement', () => {
  const a = boot();
  frameOf(a);
  a.$('labels').click();
  assert.match(a.$('clipFrame').innerHTML, /<iframe/, 'nothing to tear down');

  const box = a.$('clipbox');
  box.open = false;
  (box._on.toggle || []).forEach(fn => fn({ target: box }));
  assert.equal(a.$('clipFrame').innerHTML, '',
    'closing the section leaves the player running — a reader who shuts it is left '
    + 'with audio playing under the rink');
});

test('⚠️ a goal the league published no highlight for shows nothing at all', () => {
  /* 6.6% OF GOALS ARCHIVE-WIDE, measured over 36 games and 228 goals — and one of
     this game's five, so it is real data rather than an arrangement. An absent
     key means the league published none; `extract.py` keeps that distinguishable
     from a read failure by leaving it out, and there is nothing true to say about
     a video that does not exist. */
  const a = boot();
  const scrub = a.$('scrub');
  const bare = WITHOUT[0];
  let seen = false;
  for (let k = 0; k <= +scrub.max; k++) {
    scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
    if (a.$('clk').textContent !== bare.rem) continue;
    seen = true;
    assert.equal(a.$('clipbox').hidden, true,
      `the goal at P${bare.per} ${bare.clock} has no published highlight and the `
      + 'page is offering one anyway');
  }
  assert.ok(seen, 'never reached the goal with no clip, so this proved nothing');
});

test('the section leaves the frame when the frame does', () => {
  const a = boot();
  const k = frameOf(a);
  const scrub = a.$('scrub');
  scrub.value = String(k + 1); scrub.oninput({ target: { value: scrub.value } });
  assert.equal(a.$('clipbox').hidden, true,
    'the section survives the goal it describes, so it now sits under an unrelated play');
  assert.equal(a.$('clipFrame').innerHTML, '',
    'the player survives the goal it describes and keeps playing');
});

test('⭐ it is the page’s own section idiom, not a lookalike', () => {
  /* Kevin asked for it "structured the same as Layers, The next play and Other
     games are". Those are `details.zone` + `summary.zh`, so this asserts the
     SHAPE rather than any styling of its own — if it stopped being a `zone` it
     would need its own rules and would drift from its neighbours. */
  assert.match(app, /<details class="zone zclip" id="clipbox" hidden><summary class="zh">/,
    'the clip section is no longer a zone with a zh summary');
  assert.match(PAGE_CSS, /#rg details\.zone>summary\{[^}]*min-height:44px/,
    'the shared summary rule is gone, so this section has no touch target');
  // AND IT BRINGS NO HEADER STYLING OF ITS OWN, which is the point of an idiom.
  assert.doesNotMatch(PAGE_CSS, /#rg \.zclip[^{]*\{/,
    'the clip section styles its own heading instead of inheriting the zone rules');
});

test('⛔ a clip on an event that is not a goal is ignored', () => {
  /* ⚠️ FOUND BY MUTATION, NOT BY THOUGHT. Widening `drawClip`'s condition from
     `e.type === 'goal' ? e.clip : null` to just `e.clip` passed every test above,
     because no non-goal event in any fixture carries the key — the guard was
     structurally untestable and would have gone green forever.

     IT IS NOT HYPOTHETICAL. `extract.py` only writes `clip` under `if t ==
     "goal"`, and a test there holds that line; but the app must not depend on the
     extractor's discipline to be correct about its own condition. Measured over
     11,613 plays in 36 games, no event type but `goal` carries one — so if the
     league starts putting a highlight on a save, this is the line that decides
     what happens, and it says nothing rather than guessing. */
  const g = JSON.parse(JSON.stringify(rich));
  const shot = g.events.find(e => e.type === 'shot-on-goal');
  assert.ok(shot, 'the reference game has no shot to plant one on');
  shot.clip = WITH[0].clip;
  for (const e of g.events) if (e.type === 'goal') delete e.clip;

  const a = boot(g, {});
  const scrub = a.$('scrub');
  for (let k = 0; k <= +scrub.max; k++) {
    scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
    assert.equal(a.$('clipbox').hidden, true,
      `frame ${k} offers a highlight for an event that is not a goal`);
  }
});
