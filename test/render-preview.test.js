/**
 * The next-up card, the verdict, and the five-second preview the front door frames
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { TEAMS, colourOf } from '../src/lib/teams.js';
import { whistle } from '../src/lib/layers/whistle.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { rich, app, PAGE_CSS, prose, bundle, boot, delaysOf, paceOf } from './helpers/page.js';
import { measureGame } from '../builders/measure.mjs';
import { perGame } from '../src/lib/archive.js';
import { mostUnusual } from '../src/lib/distribution.js';
import { danger } from '../src/lib/layers/danger.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { goaltending } from '../src/lib/layers/goaltending.js';

test('the game page offers a way onward, and it is about THIS game', () => {
  // THE DEFECT THIS EXISTS FOR: game.html shipped with zero href attributes. It
  // is the LANDING page — the shareable unit of this site is a game — so a
  // stranger arriving from a shared link had no route to anything.
  //
  // CHENG's ruling put the funnel BELOW the rink rather than in a nav bar above
  // it: the stranger arrives before the game, the viewer exists during it, and
  // the moment that matters is when the game ENDS, at peak curiosity.
  const a = boot();
  const nav = a.$('nextup').innerHTML;
  const links = [...nav.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(links.length >= 3, `only ${links.length} ways onward from a game page`);

  // BOTH CLUBS IN THIS GAME, named — not a generic "browse teams". A visitor has
  // been given a reason to care about exactly two teams and these are they.
  const home = a.$('hAb').textContent, away = a.$('aAb').textContent;
  assert.ok(links.includes(`/?team=${home}`), `no route to more ${home} games`);
  assert.ok(links.includes(`/?team=${away}`), `no route to more ${away} games`);
  assert.match(nav, new RegExp(`More ${home} games`));
  assert.match(nav, new RegExp(`More ${away} games`));
  assert.ok(links.includes('/'), 'no route to the archive');

  // THE TEAMS ARE READ, NEVER ASSUMED. A block that hard-coded the reference
  // game's two clubs would satisfy everything above on this fixture and be wrong
  // on all 4,552 others — the same defect class as the hero game typed into a
  // builder as a literal.
  assert.doesNotMatch(app, /More BUF games|More MIN games/,
    'the club names are compiled in rather than read from the game');

  // And the swatches carry each club's own colour, so the two rows are
  // distinguishable without reading — the sweater convention, applied here.
  //
  // THREE HOPS, BECAUSE THE COLOUR NO LONGER TRAVELS IN THE MARKUP. It used to
  // be `style="background:#154734"`, which this page's CSP refuses — the live
  // swatches computed to rgba(0, 0, 0, 0). So the markup names a SIDE, the
  // stylesheet maps that side to a custom property, and `paint()` sets the
  // property to the club's colour. Each hop is checked here, because a chain
  // is only as good as the link nobody looked at.
  const sides = [...nav.matchAll(/class="sw ([ah])"/g)].map(m => m[1]);
  assert.deepEqual(sides, ['a', 'h'], 'the swatches do not name a side');
  assert.match(PAGE_CSS, /#rg \.nextup a \.sw\.a\{background:var\(--away\)\}/);
  assert.match(PAGE_CSS, /#rg \.nextup a \.sw\.h\{background:var\(--home\)\}/);
  const v = a.$('rg').style._v;
  assert.equal(v['--away'], colourOf(away));
  assert.equal(v['--home'], colourOf(home));
  assert.notEqual(colourOf(away), colourOf(home), 'this fixture cannot tell the two apart');
});

test('the game summary is a card, and its rate is DRAWN as well as said', () => {
  // Kevin: the summary is the best thing on the page and nobody can find it. It
  // was a small centred paragraph in muted type between the ledger and the
  // footer. And "Of the games where a team led that count by 12 or more, it lost
  // 243 of 708" is a true sentence a reader has to do arithmetic on to feel — so
  // it gets one dot on a 0–100 track with 50% marked, the same idiom the
  // homepage uses, rather than a second visual language for the same kind of
  // number.
  // The reference game's level-control differential, and a curve row for it. The
  // shell fetches this; the inlined page never does, so it is supplied here.
  const CURVE = [{ k: 12, n: 708, count: 243 }, { k: 1, n: 3855, count: 1527 }];
  const a = boot(rich, { levelCurve: CURVE });
  const v = a.$('verdict').innerHTML;
  assert.match(v, /class="vk">What this game was</, 'the card does not say what it is');
  assert.match(v, /class="lead"/);

  assert.match(v, /class="vpt[^"]*" id="vpt"/, 'the rate is stated but never drawn');
  // AND ITS POSITION COMES THROUGH THE CSSOM, not a style attribute the page's
  // own CSP refuses. Written as an attribute, this dot sat at the far left of
  // its track on every game in the archive while this test read the number it
  // was supposed to have. The markup was right and the pixels were wrong, which
  // is the only reason a defect that obvious survived — so the assertion now
  // reads the property the browser actually applies.
  const left = a.$('vpt').style.left;
  assert.ok(left, 'the dot was never positioned');
  // THE DOT IS THE FRACTION IN THE SENTENCE. Read both out of the page and
  // reconcile them, so a dot that drifts from its own prose fails here.
  const frac = v.match(/it lost (\d+) of (\d+)/);
  assert.ok(frac, 'the fraction left the sentence');
  assert.equal(left, (+frac[1] / +frac[2] * 100).toFixed(1) + '%',
    'the dot sits somewhere the sentence does not say');
  assert.match(v, /class="vhalf"/, '50% is not marked, which is the whole point of the track');

  // NO CONNECTING LINE — one point cannot have one, and the rule that forbids it
  // on the homepage is the same rule here.
  for (const tag of ['line', 'path', 'polyline'])
    assert.doesNotMatch(v, new RegExp(`<${tag}\\b`), `the card drew a <${tag}>`);
});

test('a game with no comparison gets no picture of one', () => {
  // The absent branch: a preseason game keeps its own numbers, is told why there
  // is no rate, and must not be given a track with nothing on it.
  const g = JSON.parse(JSON.stringify(rich));
  g.game = { ...(g.game || {}), id: 2023010001 };          // preseason
  const v = boot(g).$('verdict').innerHTML;
  assert.match(v, /not a regular-season or playoff game \(preseason\)/);
  assert.doesNotMatch(v, /class="vtrack"/, 'an empty track was drawn anyway');
  assert.match(v, /class="vk">What this game was</, 'and the card still says what it is');
});

test('⭐ the competition table reaches the card in the BUILT page, not just the lib', () => {
  // END TO END, and it is the only thing that can see this. `sentence.js` is
  // handed the table by app.js from a `const COMPETITIONS` the BUILDER inlines
  // from data/competitions.json — three files, two languages, one seam. A unit
  // test passing NAMES by hand proves the function works and says nothing about
  // whether the page ever hands it over: with the inlining removed, the lib
  // tests all stay green and every visitor reads "game type 4".
  const g = JSON.parse(JSON.stringify(rich));
  g.game = { ...(g.game || {}), id: 2024040001 };          // an all-star game
  const v = boot(g).$('verdict').innerHTML;
  assert.match(v, /\(all-star\)/, 'the built page fell back to the raw type');
  assert.doesNotMatch(v, /game type/, 'the table did not reach the page');
});

test('PREVIEW hides everything but the game, and plays by itself', () => {
  // The homepage had no motion at all, on a site whose product is animation, so
  // a visitor had to click through to discover the thing existed (CHENG). This
  // is the five-second taste — and it is an iframe of THIS renderer rather than
  // a recorded video, so there is no second drawing path to keep in step.
  const a = boot(rich, null, '?game=2023020204&preview=1');
  assert.ok(a.$('rg').classList.contains('preview'), 'the preview class never went on');

  // ONE RENDERER STILL: preview must be a class and a loop, not a different
  // drawing path. The rink and the marks are drawn by exactly the same code, so
  // they are present as usual.
  assert.match(a.$('rink').innerHTML, /class="mesh"/, 'the rink is not drawn in preview');
  assert.ok(a.$('netmen').innerHTML.length > 0, 'the goaltenders are missing');

  // And the ordinary page is NOT in preview, which is the paired half.
  const plain = boot();
  assert.equal(plain.$('rg').classList.contains('preview'), false);
});

test('⭐ the preview runs with the Control layer ON, so the hero shows what the h1 promises', () => {
  // THE HEADLINE AND THE HERO USED TO DISAGREE. The h1 offers "the counts built
  // in front of you, so you can see where a number comes from" and the frame
  // below it ran with no layer at all -- the one configuration that is not the
  // stated conversion. Nothing failed; the front door simply advertised the
  // base view.
  const a = boot(rich, null, '?game=2023020204&preview=1');
  assert.ok(a.$('rg').classList.contains('corsi'),
    'the preview is running the base view — the counts are nowhere on the hero');

  // THROUGH setCorsi, NOT PAST IT. The on-state is a class, a button label and
  // an aria value; a preview that set only the class would look right and leave
  // the other two saying the layer is off. This is the half that catches it.
  // String() because the fake stores what setCorsi passed -- a boolean -- while
  // a real DOM stores "true". Asserting either spelling would pin the harness
  // rather than the behaviour.
  assert.equal(String(a.$('lyCorsi').getAttribute('aria-pressed')), 'true');
  assert.equal(a.$('stCorsi').textContent, 'On',
    'the layer row still says the layer is off');

  // ⭐ AND THE BOARD NAMES ITS UNIT. In preview `.counters` is hidden, so this is
  // the ONLY element that can say what the two figures count. Without it the
  // board said CONTROL, the sentence under the rink said shots on goal, and a
  // reader had no way to know those were different quantities -- which reads as
  // an error rather than a distinction.
  assert.match(a.$('pName').textContent, /attempt/i,
    'the preview board names no unit — CONTROL is a name, not a unit');
  // AND THE GAME PAGE IS UNCHANGED, which is the paired half. Checked in the
  // MARKUP, not through a boot: the default label is a text node the document
  // ships with, and this fake's elements start empty -- so asserting it through
  // `boot()` would only be measuring what the harness cannot see.
  assert.match(app, /id="pName">CONTROL</,
    'the game page no longer names the layer — CONTROL is the useful word there, '
    + 'because .counters carries the unit two inches below it');

  // EXACTLY ONE, because the conversion is stated as one metric layer turned on.
  // Three layers at once is a different claim about the product, and without
  // this the preview could quietly acquire them one at a time with nothing
  // failing -- which a mutation adding a second layer proved.
  for (const off of ['slot', 'goalie', 'whistle', 'blocked']) {
    assert.equal(a.$('rg').classList.contains(off), false,
      `the preview turned on ${off} as well — the taste is one layer, not a pile`);
  }

  // AND THE ORDINARY PAGE IS UNTOUCHED, which is the paired half: turning it on
  // for the hero must not turn it on for a visitor who opened a game to watch it.
  assert.equal(plainOff().$('rg').classList.contains('corsi'), false,
    'the full page now opens with a layer already applied');
});

test('⭐ the control bar claims nothing before anything has been counted', () => {
  // A REAL DEFECT, FOUND BY LOOKING AT THE FRONT DOOR. `tot=a+h||1` avoided the
  // division by zero and then drew the result anyway: at 0-0 it made pa=0, so
  // the whole bar rendered in the HOME colour and the opening faceoff announced
  // that one team held all of the control before a puck had been shot. It was
  // on the hero, in the first frame of every visit.
  //
  // NOT A PREVIEW BUG -- it is what the layer does at the start of any game, so
  // it is checked on the ordinary page where a visitor meets it.
  const a = boot();
  a.$('lyCorsi').click();
  // Numeric, because the fake stores what the page assigned -- a number -- and
  // a real DOM stores a string. Pinning either spelling would test the harness.
  assert.equal(+a.$('cA').textContent, 0, 'the fixture is past the opening faceoff');
  assert.equal(+a.$('cH').textContent, 0, 'and this test is no longer about zero');
  assert.equal(a.$('ba').style.width, '0%', 'the away segment claims a share of nothing');
  assert.equal(a.$('bh').style.width, '0%', 'the home segment claims a share of nothing');

  // THE PAIRED HALF: once there IS a population, the bar is drawn and the two
  // segments account for all of it. Without this the rule above is satisfied by
  // a bar that never renders at all.
  const sc = a.$('scrub');
  sc.value = sc.max;
  sc.oninput({ target: { value: sc.value } });
  assert.notEqual(+a.$('cA').textContent + +a.$('cH').textContent, 0,
    'nothing was counted, so the paired half proves nothing');
  const w = s => +String(s).replace('%', '');
  assert.equal(w(a.$('ba').style.width) + w(a.$('bh').style.width), 100,
    'the bar no longer accounts for the whole population');
});

/** A plain boot, named because two tests want the same negative half. */
function plainOff() { return boot(); }

// `the preview asks for nothing it does not show` used to live here as a regex
// over the shell's source, pinned to the exact expression that tested for
// preview. It now runs the bootstrap and watches the network instead — see
// test/shell.test.js. A behaviour a test can OBSERVE beats a spelling it has to
// recognise, and the move was forced by the spelling changing.


test('the preview is hidden by CSS, not by deleting the app', () => {
  // If preview removed elements rather than hiding them, every other test in
  // this file would be asserting against a page that no longer exists in the
  // shipped bundle. Pin the mechanism: one rule, hiding the controls.
  const hides = app.match(/#rg\.preview [^{]*\{display:none!important\}/);
  assert.ok(hides, 'preview does not hide the controls with CSS');
  // `.lede` was here until the paragraph it named was replaced by the
  // first-visit block (it duplicated that block's job, went stale naming
  // four layers when there were five, and cost 245px above the rink).
  // ⭐ `.zone` REPLACED FOUR OF THESE on 2026-08-25 and that is worth stating,
  // because a rule that hides a WRAPPER is a rule nobody has to remember to
  // extend. `.layers`, `.figpick`, `.hint` and `.foot` were each named here; the
  // next block added below the rink would have had to be added here too, and the
  // preview is exactly the surface where nobody would notice it was not.
  for (const cls of ['.transport', '.zone', '.verdict', '.nextup', '.newcomer',
                     // Added when Kevin found the rink cropped: these are real
                     // height in a box sized for a rink, and neither is part of
                     // a five-second taste.
                     '.legend', '.goalies'])
    assert.ok(hides[0].includes(cls), `preview leaves ${cls} on screen`);
});

/* ------------------------------------------------- the preview's PACE
   Kevin, twice. On 115ms an event: "a blur of activity, looks like it's 100x
   real-time." On a slower chosen constant of 430ms: "definitely better, still
   2 or 3x too fast." The answer was never a third guess -- it was to stop
   choosing. The preview now waits `dwell(e)`, the same function the replay
   waits, so it cannot be fast or slow RELATIVE TO THE PRODUCT and it eases for
   the big moments instead of ticking.

   THIS TEST DOES NOT RESTATE dwell, and that is the point of it. A test
   asserting "the delay is 1300ms" would be a second copy of the pace, free to
   agree with a wrong first copy. So it measures the ORDINARY PLAY LOOP with the
   same recorder and asserts the preview draws from what it saw -- which stays
   true if dwell changes, and goes red the moment a constant reappears. */



test('the preview waits on the replay, not on a number somebody picked', () => {
  const TICKS = 6;
  const preview = delaysOf('?preview=1', TICKS).delays;
  assert.ok(preview.length >= TICKS, `the preview never scheduled: ${preview}`);

  // What the ORDINARY transport waits over the same opening events, measured
  // with the same recorder. `play()` is what a viewer presses, so this is the
  // product's pace observed rather than described.
  // TICKS, not 0: the recorder's budget is what lets the transport STEP, and
  // with 0 it schedules once and stops -- one dwell value, which the preview's
  // second wait would then fail against for no reason but the harness.
  const plain = delaysOf('', TICKS);
  plain.dom.$('play').onclick();
  const replay = new Set(plain.delays);
  assert.ok(replay.size > 0, 'the ordinary play loop never scheduled anything');

  for (const d of preview.slice(0, TICKS)) {
    assert.ok(replay.has(d),
      `the preview waited ${d}ms, which the replay never waits: ${[...replay].join(', ')}`);
  }
});

/* THIS GUARD MOVED OFF THE PREVIEW, AND THE REASON IS A MEASUREMENT.
 *
 * It used to read the preview's first 14 waits and assert they were not all the
 * same value -- "a constant wearing dwell's name". Under the tier list that was
 * robust: a shot on goal was enough to break the tie, and 43 of 59 games across
 * the archive (72.9%) carry one inside the preview's opening window.
 *
 * Under the pacing rule in docs/event-timing.md the frame is long only when it
 * carries a caption, and captions are goals and penalties. MEASURED over the
 * same 59 games: a goal or a penalty lands inside the first 7 plays in 9 of them
 * -- 15.3% -- and the median index of the first captioned event is 26, four
 * times the window. So on roughly six nights in seven the front door's loop is
 * legitimately uniform, and the old assertion would have failed for a page that
 * was working exactly as designed.
 *
 * It passed on the reference game, which has a penalty at index 2 -- the MINIMUM
 * of that distribution. A test that arrives where it already was is true for the
 * wrong reason, and this one would have been.
 *
 * THE PROPERTY IT PROTECTS IS REAL AND STILL WORTH A TEST: `dwell` must not
 * collapse to one number, because the test above (the preview draws from the
 * replay) passes trivially if both sides return the same constant. So the guard
 * now watches the WHOLE REPLAY, where a captioned frame is guaranteed by the
 * game rather than by luck of the opening. */
test('dwell does not collapse to a constant — the whole replay, not the opening', () => {
  const { rows } = paceOf(160);
  const seen = new Set(rows.map(r => r.ms));
  assert.ok(seen.size > 1,
    `every wait in the walk was ${rows[0].ms}ms — that is a constant wearing dwell's name`);
  // AND the two values must be the two the rule produces, not any two: a stray
  // third tier creeping back in is the thing this replaced.
  assert.equal(seen.size, 2,
    `the pace produced ${seen.size} distinct waits (${[...seen].sort((a, b) => a - b).join(', ')}); the rule has two states`);
});

test('⭐ the preview begins where the layer first counts something', () => {
  // KEVIN REFRESHED THE FRONT DOOR AND THE COUNTER SAT AT 0-0 FOR THE WHOLE LOOP.
  // Measured over 230 games: the counter is still empty after 14s in 6% of them
  // -- and the hero is the most recent game, so between June and October that is
  // one frozen fixture and the tail is the whole experience. The reference game
  // here opens with plays that count for nothing, exactly as the live one did.
  //
  // THE START IS THE FIX, NOT THE LENGTH: at the same budget the live hero went
  // from a counter of 0 to a counter of 4, while stretching the loop to 30s from
  // the faceoff also only reached 4.
  const { at } = delaysOf('?preview=1', 40);
  assert.ok(at[0] > 0,
    'the preview still opens at the faceoff — if the game happens to start with '
    + 'attempts this is vacuous, so the assertion below says it is not');

  // AND IT SKIPS NOTHING THE LAYER COUNTS, which is what keeps the counter
  // honest: it is still 0-0 on the first frame and still moves in front of you.
  const a = boot(rich, null, '?game=2023020204&preview=1');
  const sc = a.$('scrub');
  const countAt = k => { sc.value = String(k); sc.oninput({ target: { value: sc.value } });
                         return +a.$('cA').textContent + +a.$('cH').textContent; };

  // IT OPENS ON ZERO AND MOVES ON THE VERY NEXT FRAME. Both halves matter and
  // neither is sufficient: opening on the first attempt shows a counter reading
  // 1 before the viewer has seen anything happen, and opening any earlier is the
  // dead air this whole change exists to skip.
  assert.equal(countAt(at[0]), 0, 'the loop opens with the count already moved');
  assert.notEqual(countAt(at[0] + 1), 0,
    'the second frame still counts nothing — the start is not adjacent to the first attempt');
});

test('the preview is a taste: it restarts inside about half a minute', () => {
  // The pace tests above cannot see the WINDOW, and a mutation proved it --
  // replacing the time-derived window with a fixed 44 events survived them
  // both. At the replay's pace that is a 57-second loop on the front door: not
  // a blur, but not a taste either, and nothing said so.
  //
  // THE RESTART IS FOUND BY THE SCRUBBER GOING BACKWARDS, not by matching the
  // pause's value. Recognising it by `=== 1500` would put a second copy of that
  // constant in here, free to agree with a wrong first copy.
  //
  // It used to look for a return to ZERO, and that stopped being the marker when
  // the loop began starting at the layer's first counted event instead of the
  // opening faceoff. Zero was never the property -- going back was.
  //
  // A RANGE, NOT A VALUE. How long the loop runs is a visual judgement and the
  // one number left in the preview; pinning it exactly would just be that same
  // second copy. The bounds are what the thing has to be to be the thing: long
  // enough to read as hockey, short enough that a stranger sees it loop.
  const { delays, at } = delaysOf('?preview=1', 40);
  const back = at.findIndex((v, k) => k > 0 && v < at[k - 1]);
  assert.ok(back > 0, `the preview never looped in 40 ticks: ${at.join(',')}`);
  assert.ok(back >= 4, `only ${back} events fit — that is a slideshow, not a replay`);
  // AND IT RESTARTS WHERE IT BEGAN, not at the faceoff. A loop that rewinds past
  // its own start replays the dead plays the start rule exists to skip -- every
  // pass after the first -- and a mutation proved nothing else here noticed.
  assert.equal(at[back], at[0],
    `the loop restarts at ${at[back]} but began at ${at[0]} — it rewinds past its own start`);
  const playing = delays.slice(0, back - 1).reduce((a, b) => a + b, 0);
  // THE UPPER BOUND IS WHAT THIS TEST IS FOR, and it moved once, deliberately:
  // Kevin raised the budget from 14s to 30s because the loop was too short to
  // follow. The bound is not "the current value plus a bit" -- it is set to keep
  // rejecting the 57-second loop that a fixed 44-event window produced, which is
  // the drift that motivated the test in the first place.
  assert.ok(playing > 5000 && playing < 35000,
    `the preview window runs ${(playing / 1000).toFixed(1)}s before looping`);
});

/* ------------------------------------------- the preview CANNOT crop the rink
   Kevin: "the bottom 1/3 of the rink is clipped off within the frame."
   The frame is sized by aspect-ratio on the homepage, and that arithmetic
   cannot hold: the rink scales with WIDTH while the scoreboard's height is set
   in points, so at a narrow column the fixed chrome takes a bigger share of a
   smaller box and pushes the ice past the edge. A ratio measured at one width
   is a constant that drifts with the viewport.

   WHAT THESE TESTS CAN AND CANNOT SEE, stated so the green is not read as more
   than it is: the fake document has no CSS and no layout, so nothing here has
   ever seen a pixel. They pin the MECHANISM -- that the page is built to fit
   whatever box it is handed, rather than to be handed the right one -- and
   whether it looks right is a question for a browser and for Kevin. */

test('the preview fits the rink to its box instead of trusting the box', () => {
  // A viewBox with the default preserveAspectRatio letterboxes rather than
  // crops, so an svg told to fill a bounded height always draws the WHOLE rink.
  // The default rule is `height:auto`, which is exactly what cannot be bounded.
  // THE BOUNDING MECHANISM CHANGED WHEN THE PENALTY BAND ARRIVED, and the
  // PROPERTY did not. `height:100%` bounded the svg against the rink box while
  // the svg was its only child. It is not any more: `.rinkbox` is now a flex
  // COLUMN holding the ice and the band, and `height:100%` there makes the svg
  // demand the whole box and push the band out of it. `flex:1 1 auto` with
  // `min-height:0` bounds it against what is LEFT, which is the same guarantee
  // over a container that now has two children. Verified in a browser: 343x141
  // at 390px, 884x389 at 1100px, whole rink drawn, nothing cropped.
  assert.match(app, /#rg\.preview \.rinkbox svg\{[^}]*flex:1 1 auto/,
    'the preview rink is still free to grow past its container');
  assert.match(app, /#rg\.preview \.rinkbox svg\{[^}]*min-height:0/,
    'and a flex child without min-height:0 refuses to shrink');
  assert.match(app, /#rg\.preview \.rinkbox\{[^}]*min-height:0/,
    'a flex child without min-height:0 refuses to shrink, which is the crop');
  assert.match(app, /#rg\.preview \.wrap\{[^}]*flex-direction:column/,
    'nothing gives the rink box a bounded height to fit into');
});

test('preview takes the shared chrome off, from where the chrome is defined', () => {
  // The header and footer live in page.py and are OUTSIDE #rg, so no #rg rule
  // can reach them. The page sets a class on <body> and page.py owns the rule --
  // a .sitehdr selector inside build_main.py would be a second place chrome is
  // decided.
  assert.match(app, /body\.previewing \.sitehdr,body\.previewing \.sitefoot\{display:none\}/,
    'the chrome rule is missing or has moved out of page.py');
  const d = boot(null, null, '?preview=1');
  assert.ok(d.document.body.classList.contains('previewing'),
    'the page never told the document it was a preview');
  const plain = boot(null, null, '');
  assert.equal(plain.document.body.classList.contains('previewing'), false,
    'the ordinary page must keep its chrome — the paired half');
});

test('the preview chrome scales with the frame, so the ice cannot be crowded out', () => {
  // MEASURED IN A REAL BROWSER, then pinned here as a mechanism. At 200/108 the
  // scoreboard was 87px inside an 856px-wide frame and 87px inside a 287px one
  // -- the same absolute height in both, because its type is set in rem and rem
  // does not care how wide the frame is. The rink then shrank into what was
  // left: 96px of a 155px box on a phone.
  //
  // `min(Xvw, <today>)` is the shape that matters. vw inside the frame IS the
  // frame's width, so the chrome scales on the same axis the rink does; the cap
  // is today's value, so the desktop rendering cannot move. A plain vw would
  // have changed both, and only one of them was wrong.
  for (const sel of ['\\.sc', '\\.tm \\.ab', '\\.gs']) {
    const re = new RegExp(`#rg\\.preview [^{]*${sel}\\{[^}]*font-size:min\\(`);
    assert.match(app, re, `the preview does not scale ${sel} with its frame`);
  }
  assert.match(app, /#rg\.preview \.pagelede\{display:none/,
    'the tagline is still introducing a five-second taste');
  assert.match(app, /#rg\.preview \.mid\{min-width:0\}/,
    'the middle column still has a px floor, which overflows a 360px frame');
  // A cap that is not a cap would let the desktop drift, so check one by value.
  assert.match(app, /#rg\.preview \.sc\{font-size:min\([^)]*,2\.2rem\)/,
    'the score is no longer capped at the size it renders today');
});

test('the homepage gives a narrow frame the extra height its rink needs', () => {
  const index = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  // BOTH RATIOS GREW WHEN THE PENALTY BAND JOINED THE CHROME, and the reason the
  // narrow one grew MORE is the reason this test exists: a fixed cost eats a
  // larger share of a narrow frame. At 200/128 the ice was 27px short of its own
  // aspect and letterboxed -- white space either side, which reads as a smaller
  // rink rather than a tighter one.
  assert.match(index, /@media \(max-width:520px\)\{\.heroframe iframe\{aspect-ratio:200\/140\}\}/,
    'one aspect ratio cannot serve both — the chrome is a bigger share of a narrow frame');
  assert.match(index, /\.heroframe iframe\{[^}]*aspect-ratio:200\/117/,
    'the wide frame lost its ratio');
  // AND THE NARROW FRAME MUST STAY THE TALLER OF THE TWO. Two literals cannot
  // see that relationship; if a later edit moves one, this is what notices.
  const wide = +/\.heroframe iframe\{[^}]*aspect-ratio:200\/(\d+)/.exec(index)[1];
  const narrow = +/max-width:520px\)\{\.heroframe iframe\{aspect-ratio:200\/(\d+)/.exec(index)[1];
  assert.ok(narrow > wide,
    `the narrow frame (${narrow}) must be relatively taller than the wide one (${wide})`);
});

/* ---------------------------------------------- what a play label may say
   Kevin: "we don't need the subtext on the event, just the event itself... the
   descriptive elements of the site should provide the clarifying details."
   True of six of nine. The three that stayed are not descriptions -- they say
   whether the event COUNTS, which is the only claim on the ice that a novice
   cannot get from the label. The rule is asserted rather than remembered,
   because the next row added to the table will be argued from whatever is
   already there. */

// A second line is earned ONLY by correcting a misreading of a counter the
// viewer can see moving. The attempts counter goes up on a block and on a miss,
// which is the surprise. `hit` was in this list and should not have been: there
// is no hits counter on the page, so "not a shot" answered a question nobody
// had -- explaining a metric we do not show is noise wearing the shape of rigour.

/**
 * ⭐ THE PER-GAME SUMMARY — §32.6's last item, on the card that already fires at
 * the right moment. §31.7b is why it belongs HERE and not beside a counter:
 * "Show me the work" answers *where did 34 come from*, this answers *how unusual
 * is 34*, and they are Doctrine §8's two halves split by scope.
 *
 * THE DISTRIBUTIONS ARE BUILT FROM THE REAL FIXTURE EXTRACTS, not invented — a
 * made-up histogram would test the formatting and nothing else, which is the
 * warning `CURVE_AND_MIX` carries in its own docstring. Small `n` is not a
 * problem to hide from: the sentence is a FRACTION for exactly that reason, and
 * a nine-game season says so by construction.
 */
test('the card says how this game sat in its season, or that it was ordinary', () => {
  const dir = new URL('./fixtures/extracts/', import.meta.url);
  const recs = readdirSync(dir).filter(f => f.endsWith('.json'))
    .map(f => measureGame(JSON.parse(readFileSync(new URL(f, dir), 'utf8'))));
  const dists = perGame(recs);
  const y = String(rich.game.id).slice(0, 4);
  assert.ok(dists[y], `the fixture corpus holds no ${y} game to compare against`);

  const a = boot(rich, { levelCurve: [{ k: 12, n: 708, count: 243 }], perGame: dists });
  const v = a.$('verdict').innerHTML;
  const line = /<span class="rate season">([\s\S]*?)<\/span>/.exec(v);
  assert.ok(line, 'the card says nothing about how the game sat in its season');

  /* ⭐ THE PATH IS INDEPENDENT (H1): the expectation comes from the library
     called directly on the same counts, never from the page's own arithmetic. */
  const ctx = { roster: rich.roster, homeId: rich.teams.home.id,
                awayId: rich.teams.away.id, evenOnly: false };
  const counts = { corsi: corsi.reduce(rich.events, ctx).counted.length,
                   slot: danger.reduce(rich.events, ctx).counted.length,
                   blocked: blocked.reduce(rich.events, ctx).counted.length,
                   goaltending: goaltending.reduce(rich.events, ctx).counted.length,
                   whistle: whistle.reduce(rich.events, ctx).counted.length };
  const U = mostUnusual(dists[y], counts);
  if (U) {
    // (the branch actually taken is asserted below; see the both-branches test)
    assert.ok(line[1].includes(`${U.count} ${U.noun}`),
      `the card names a different count than the measurement: ${line[1]}`);
    assert.ok(line[1].includes(`${U.n} of the ${U.of} game`),
      `the card does not state the fraction it is claiming: ${line[1]}`);
    // ⭐ A FRACTION, NEVER A BARE PERCENTAGE — levelCurve's rule, and the reason
    // no minimum-n guard is needed anywhere in this feature.
    assert.doesNotMatch(line[1], /\d%/, 'the season comparison was printed as a percentage');
  } else {
    assert.match(line[1], /middle half/, 'an ordinary game was not told it was ordinary');
  }

  /* ⭐ AND THE COUNT IT COMPARES IS THE CHIP'S OWN. Without this the sentence
     could be right about the archive and about a different quantity. */
  const chip = a.$('n_' + (U ? U.lens : 'corsi'));
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  if (U) assert.equal(+a.$('n_' + U.lens).textContent, U.count,
    'the summary compares a number the selector never shows');
  assert.ok(chip, 'the lens named by the summary has no chip');
});

/**
 * ⛔ AND WITH NO DISTRIBUTIONS IT SAYS NOTHING — the verdict card's standing
 * rule, the LIVE state until the pipeline next derives, and the permanent state
 * of the inlined page, which never asks for the archive at all.
 */
test('a page with no distributions makes no claim about the season', () => {
  for (const rates of [undefined, null, { levelCurve: [] }, { perGame: {} }]) {
    const v = boot(rich, rates).$('verdict').innerHTML;
    assert.doesNotMatch(v, /class="rate season"/,
      `rates=${JSON.stringify(rates)}: a season claim was made with nothing to compare against`);
    assert.doesNotMatch(v, /middle half/, 'an ordinary-night sentence with no season behind it');
    assert.match(v, /class="vk">What this game was</, 'and the card itself went missing');
  }
});

/**
 * ⚠️ BOTH BRANCHES, FORCED — and this is the test that would have caught the
 * defect the one above missed.
 *
 * That test reads `if (U) … else …`, so it renders whichever branch the fixture
 * corpus happens to produce. Nine fixture games made the reference game
 * ORDINARY, the else-branch ran, and the finding branch — the one that calls
 * `ESC` — was never executed by any test. In a browser it threw `Cannot access
 * 'ESC' before initialization`, aborted boot, and surfaced as a dead scrubber.
 * Green suite, broken page, found by looking.
 *
 * ⭐ A TEST THAT BRANCHES ON THE DATA IT HAPPENS TO GET IS NOT A TEST OF EITHER
 * BRANCH. Both are constructed here, so both are rendered.
 */
test('both the unusual and the ordinary sentence actually render', () => {
  const flat = n => ({ what: 'made up', population: 'p', unit: 'games', n: 100,
                       min: 1, max: 100, start: 1,
                       counts: Array.from({ length: 100 }, () => 1), noun: n });
  const y = String(rich.game.id).slice(0, 4);
  const lenses = { corsi: 'shot attempts', slot: 'shots from the slot',
                   blocked: 'blocked shots', goaltending: 'shots the goaltenders faced',
                   whistle: 'stoppages' };
  const dists = Object.fromEntries(Object.entries(lenses).map(([k, n]) => [k, flat(n)]));

  // ORDINARY: every real count lands inside 25..75 of a flat 1..100 spread only
  // if it happens to; so the ordinary case is built by making the middle half
  // cover everything the game can hold.
  const wide = Object.fromEntries(Object.entries(lenses).map(([k, n]) =>
    [k, { ...flat(n), min: 0, start: 0, max: 999,
          counts: Array.from({ length: 1000 }, () => 1), n: 1000 }]));
  const ordinary = boot(rich, { perGame: { [y]: wide } }).$('verdict').innerHTML;
  assert.match(ordinary, /middle half/, 'the ordinary sentence never rendered');

  // UNUSUAL: a distribution every real count sits above.
  const low = Object.fromEntries(Object.entries(lenses).map(([k, n]) =>
    [k, { ...flat(n), min: 0, start: 0, max: 1, counts: [50, 50], n: 100 }]));
  const found = boot(rich, { perGame: { [y]: low } }).$('verdict').innerHTML;
  assert.match(found, /class="rate season"/, 'the finding sentence never rendered');
  /* ⭐ ABOVE EVERYTHING READS AS A SENTENCE. "more than 100 of the 100 games"
     is precise, self-checking, and looks like arithmetic that went wrong —
     found on the Cup Final in a browser, not here. */
  assert.match(found, /higher than all 100 games this season/,
    'a count above every game in the population is stated as a fraction of itself');
  assert.doesNotMatch(found, /undefined|\[object/, 'the sentence rendered a hole');

  /* AND THE ORDINARY FRACTION IS STILL A FRACTION when the game has NOT beaten
     everything — the two forms are one rule with a boundary, so both are pinned
     or the boundary is free to move. */
  /* 80 games at zero and 20 far above, so every real count in this game is
     ABOVE the middle half (p75 = 0) and BELOW the top of the range — the case
     the fraction wording exists for. The first attempt put p25 at 0 and p75 at
     400, which made every count ORDINARY and the assertion below unreachable. */
  const some = Object.fromEntries(Object.entries(lenses).map(([k, n]) =>
    [k, { ...flat(n), min: 0, start: 0, max: 400,
          counts: Array.from({ length: 401 }, (_, i) => i === 0 ? 80 : (i === 400 ? 20 : 0)),
          n: 100 }]));
  const part = boot(rich, { perGame: { [y]: some } }).$('verdict').innerHTML;
  assert.match(part, /more than 80 of the 100 games this season/,
    'a count inside the range is not stated as a fraction of the population');
  assert.doesNotMatch(part, /\d%/, 'the season comparison was printed as a percentage');

  // ⭐ AND A DOCUMENT WITH NO NOUN SAYS NOTHING RATHER THAN NAMING A LENS ID.
  const nameless = Object.fromEntries(Object.entries(low).map(([k, d]) =>
    [k, { ...d, noun: undefined }]));
  const quiet = boot(rich, { perGame: { [y]: nameless } }).$('verdict').innerHTML;
  assert.doesNotMatch(quiet, /whistle|corsi/, 'a lens id was shown to a reader');
});
