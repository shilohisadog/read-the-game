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
import { app, PAGE_CSS, boot, rich, markClick, frameOf } from './helpers/page.js';

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

/** Step the playhead to an absolute frame, the way the scrubber does. */
const seek = (a, k) => {
  const s = a.$('scrub'); s.value = String(k);
  s.oninput({ target: { value: s.value } });
};

/** Drive the page to the frame showing `ev`, using the app's own playable set. */
/* `frameOf` moved to test/helpers/page.js on 2026-09-11 — the transport tests
   need the same subject, and two copies of a search is two chances to drift. */

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

  /* ⛔ THE CHILD, WHICH IS WHAT A BROWSER ACTUALLY HANDS OVER. A goal is drawn as
     a figure — a `<g data-i>` around a `<path>` — so the click target never
     carries the index and the handler has to walk up to find it. This exact case
     was dead on the live site while the old test was green. */
  markClick(a, k);
  assert.ok(a.$('clipbox').open,
    'pressing the goal MARK does not open the section — the handler is reading '
    + 'ev.target rather than the element carrying data-i, so every figure-shaped '
    + 'mark (which is every goal) is unclickable');

  // …and the carrier itself still works, for marks that are a bare circle.
  const c = boot(); frameOf(c); markClick(c, k, { leaf: false });
  assert.ok(c.$('clipbox').open, 'a mark that carries the index directly is now dead');

  // THE CONTROL. Every other mark on the ice must be inert, or the section opens
  // on a faceoff and the sentence above it is false.
  const b = boot();
  frameOf(b);
  const other = String(k > 0 ? k - 1 : k + 1);
  markClick(b, +other);
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
  /* ⚠️ THIS CHECK WAS `clipbox.hidden === true` UNTIL 2026-09-09, and that
     assertion expired when the offer stopped being a property of the frame. The
     box now carries the most recent goal that HAS a highlight, so at a goal with
     none it may well be on screen — naming an earlier goal, which is exactly what
     it is for. What must still be true is the part that was ever about honesty:
     nothing on the page offers a video for THIS goal. */
  const a = boot();
  const scrub = a.$('scrub');
  const bare = WITHOUT[0];
  let seen = false;
  for (let k = 0; k <= +scrub.max; k++) {
    scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
    if (a.$('clk').textContent !== bare.rem) continue;
    seen = true;
    assert.equal(a.$('rg').classList.contains('hasclip'), false,
      `the goal at P${bare.per} ${bare.clock} has no published highlight and the ice `
      + 'is offering a click on it anyway');
    const say = a.$('clipbox').hidden ? '' : a.$('clipSay').textContent;
    assert.doesNotMatch(say, /press the goal on the ice/,
      'the sentence tells the reader to press a goal that opens nothing');
    if (say) assert.doesNotMatch(say, new RegExp(bare.rem.replace(':', '\\:')),
      `the offer names the goal at ${bare.rem}, for which the league published no video`);
  }
  assert.ok(seen, 'never reached the goal with no clip, so this proved nothing');
});

test('⏪ seeking back before the first goal takes the offer away again', () => {
  /* ⚠️ THIS TEST USED TO BE "the section leaves the frame when the frame does",
     and it asserted the defect Kevin reported: the offer vanished one frame past
     the goal, 3.6 seconds after it appeared. The behaviour it guarded is gone on
     purpose and the check is replaced rather than deleted, because the property
     underneath it is still real — THE BOX IS A FUNCTION OF THE PLAYHEAD AND NOT A
     LATCH. "Most recent goal" has to run backwards too, or seeking to the start
     leaves an offer up for a goal that has not been scored yet, which is the
     foreknowledge leak this page spends real effort avoiding. */
  const a = boot();
  const k = frameOf(a);
  a.$('labels').click();
  assert.ok(a.$('clipbox').open, 'the setup failed — nothing was open to tear down');
  seek(a, 0);
  assert.equal(a.$('clipbox').hidden, true,
    'the offer survives a seek to before the goal, so the page is advertising a '
    + 'highlight of something that has not happened');
  assert.equal(a.$('clipFrame').innerHTML, '',
    'the player survives a seek to before the goal and keeps playing');
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

test('⭐ a goal with a highlight says so where the line is otherwise blank', () => {
  /* ⛔ THE CIRCULARITY THIS FIXES. `#clipSay` teaches the click — "or press the
     goal on the ice" — and a reader can only read it once they have already found
     the section, which is no use to the reader who has not. Kevin asked for a line
     under the rink; this is that line, in the slot a goal leaves empty. */
  const a = boot();
  const k = frameOf(a);
  const who = a.$('who');
  assert.match(who.innerHTML, /wclip/,
    'a goal with a published highlight says nothing about it under the rink');
  assert.match(who.innerHTML, /highlight/i, 'the line does not name what it offers');

  // AND IT IS THE THIRD DOOR, not just a label.
  const before = a.$('clipbox').open;
  (who._on.click || []).forEach(fn => fn({ target: { closest: sel => (sel === '.wclip' ? {} : null) } }));
  assert.equal(before, false, 'the section was already open, so this proves nothing');
  assert.ok(a.$('clipbox').open, 'the line under the rink is a label and not a door');
});

test('⛔ …and it is silent on a goal the league published nothing for', () => {
  /* 6.6% ARCHIVE-WIDE, and one of the reference game's five. A link that is
     sometimes a promise and sometimes nothing is worse than no link — it teaches
     a reader to press something that will not be there next time. */
  const a = boot();
  const scrub = a.$('scrub');
  const bare = WITHOUT[0];
  let seen = false;
  for (let k = 0; k <= +scrub.max; k++) {
    scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
    if (a.$('clk').textContent !== bare.rem) continue;
    seen = true;
    assert.doesNotMatch(a.$('who').innerHTML, /wclip/,
      `the goal at P${bare.per} ${bare.clock} has no highlight and the line offers one`);
  }
  assert.ok(seen, 'never reached the goal with no clip');
});

test('⛔ …and on no other frame in the game', () => {
  /* THE CONTROL. "It appears on goals" is satisfied by a line that appears
     everywhere, and this row carries the active player's sentence on 92.8% of
     frames — so a leak here would overwrite real content, not empty space. */
  const a = boot();
  const scrub = a.$('scrub');
  const goalClocks = new Set(WITH.map(e => e.rem));
  let offered = 0;
  for (let k = 0; k <= +scrub.max; k++) {
    scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
    if (!a.$('who').innerHTML.includes('wclip')) continue;
    offered++;
    assert.ok(goalClocks.has(a.$('clk').textContent),
      `frame ${k} offers a highlight and is not a goal that has one`);
  }
  assert.ok(offered >= 2, `the line never appeared (${offered}) — this proved nothing`);
});

test('⭐ the row cannot grow, because the Play button is under it', () => {
  /* ⚠️ THIS FEATURE HAS NEARLY RE-INTRODUCED THE 2026-09-07 JITTER TWICE — once by
     mounting the section above the transport, once here. `#rg .who` reserves its
     height on every frame, so a goal filling it moves nothing; a button that
     brought its own padding, border or line-height would undo exactly that. The
     fake DOM has no layout, so this asserts the STYLESHEET, which is the half it
     can hold — the browser step measures the rest. */
  assert.match(PAGE_CSS, /#rg \.who\{[^}]*min-height:[\d.]+rem/,
    'the active-player row no longer reserves its height, so a goal makes the page jump');
  const rule = /#rg \.wclip\{([^}]*)\}/.exec(PAGE_CSS);
  assert.ok(rule, 'the highlight line has no rule of its own at all');
  assert.match(rule[1], /font:inherit/, 'the link sets its own font, so the row resizes on a goal');
  assert.match(rule[1], /line-height:inherit/, 'the link sets its own line-height');
  assert.match(rule[1], /padding:0/, 'the link adds padding inside a row of reserved height');
  assert.doesNotMatch(rule[1], /border:(?!0)/, 'the link draws a border, which adds height');
});

/* ------------------------------------------------------- ⭐ THE OFFER PERSISTS
 *
 * Kevin, watching a replay run: *"when 'playing' through the game and a goal
 * occurs, the link to the NHL highlight appears briefly but then goes away
 * (since the replay continues to play), that's rather odd."*
 *
 * ⛔ IT IS THE HIT-TARGET DEFECT IN A FOURTH FORM, and every test in this file
 * was green through it — because every one of them drives the playhead TO the
 * goal frame and stops. The control was present, correctly labelled and
 * technically pressable, and at 3.6 seconds a frame a person could not press it.
 * A test that only ever visits the one frame where a control works cannot see
 * that it works nowhere else.
 */

test('⭐ the highlight stays offered after the replay moves past the goal', () => {
  const a = boot();
  const k = frameOf(a);
  assert.ok(k != null && k + 3 <= +a.$('scrub').max, 'no room to advance past the goal');
  const id = a.$('clipbox').dataset.id;

  for (const step of [1, 2, 3]) {
    seek(a, k + step);
    assert.equal(a.$('clipbox').hidden, false,
      `${step} frame(s) past the goal the offer had vanished — about ${(step * 3.6).toFixed(1)}s`);
    assert.equal(a.$('clipbox').dataset.id, id, 'it swapped to a different clip');
  }
});

test('⛔ …but the click target on the ice does NOT persist — the paired half', () => {
  /* `hasclip` is what puts `cursor:pointer` on the goal figure, and the goal is
     only drawn while it is the current frame. Making it sticky alongside the box
     would advertise a click target on marks that open nothing, which is this same
     defect inverted — and "make the offer persist" is satisfied by a version that
     does exactly that. */
  const a = boot();
  const k = frameOf(a);
  assert.equal(a.$('rg').classList.contains('hasclip'), true,
    'the goal frame does not mark the ice as clickable');
  seek(a, k + 1);
  assert.equal(a.$('rg').classList.contains('hasclip'), false,
    'the ice still advertises a clickable goal one frame after the goal left it');

  // …and the sentence drops the clause that names the affordance, with it.
  assert.doesNotMatch(a.$('clipSay').textContent, /press the goal on the ice/,
    'the sentence still tells the reader to press a goal that is not on the ice');
});

test('⭐ the sentence names WHICH goal, because "this goal" stops being true', () => {
  /* A box that outlives its frame cannot say "this goal": the playhead has moved
     and the reader has no way to tell which one it means. The club and the clock
     are what the scoreboard was showing when it went in, so the sentence points
     back at something the reader watched. */
  const a = boot();
  const k = frameOf(a);
  const goal = rich.events.filter(e => e.type === 'goal' && e.clip != null)
    .find(e => String(e.clip) === String(a.$('clipbox').dataset.id));
  assert.ok(goal, 'the box points at no goal in the fixture');
  seek(a, k + 1);
  const say = a.$('clipSay').textContent;
  const ab = goal.own === rich.teams.home.id ? rich.teams.home.ab : rich.teams.away.ab;
  assert.match(say, new RegExp(ab), `the sentence does not name the club that scored: ${say}`);
  assert.match(say, new RegExp(goal.rem.replace(':', '\\:')),
    `the sentence does not name the clock the board was showing: ${say}`);
  assert.doesNotMatch(say, /this goal/,
    'the sentence still says "this goal" while the playhead is somewhere else');
});

test('⛔ an open player is not slammed shut by the next frame', () => {
  /* `shutClip()` ran on EVERY render. That was harmless while the box lived for a
     single frame and is the whole feature broken now: a reader who presses play,
     opens the highlight and keeps watching would have had it torn down under them
     3.6 seconds later — and torn down means the video stops. */
  const a = boot();
  const k = frameOf(a);
  a.$('labels').click();
  assert.ok(a.$('clipbox').open, 'the setup failed — nothing was open to survive');
  seek(a, k + 1);
  assert.ok(a.$('clipbox').open, 'the next frame closed the player a reader had opened');
  assert.match(a.$('clipFrame').innerHTML, /<iframe/, 'the player was torn down mid-video');
});

test('⭐ …but a NEW goal resets it, so the shut player is the right one', () => {
  /* THE OTHER DIRECTION, and without it "never shut" passes the test above. When
     a second goal takes the box over, an open player from the first would sit
     under a sentence about the second — and would go on playing the wrong clip. */
  const a = boot();
  const first = frameOf(a);
  const firstId = a.$('clipbox').dataset.id;
  a.$('labels').click();
  assert.ok(a.$('clipbox').open);

  const max = +a.$('scrub').max;
  let next = null;
  for (let k = first + 1; k <= max; k++) {
    seek(a, k);
    if (a.$('clipbox').dataset.id !== firstId) { next = k; break; }
  }
  assert.ok(next != null, 'the fixture has only one goal with a clip past this point');
  assert.ok(!a.$('clipbox').open, 'the player for the previous goal was left open and running');
  assert.equal(a.$('clipFrame').innerHTML, '', 'the previous goal’s iframe survived the swap');
});

test('before any goal there is no offer at all', () => {
  // THE CONTROL for "most recent goal": at frame 0 there is no most-recent
  // anything, and a box pointing at a goal that has not happened would be the
  // foreknowledge leak this project spends real effort avoiding.
  const a = boot();
  seek(a, 0);
  assert.equal(a.$('clipbox').hidden, true, 'the offer is up before any goal was scored');
});
