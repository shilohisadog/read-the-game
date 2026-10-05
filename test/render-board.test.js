/**
 * The scoreboard, the disclosure copy, the goaltenders, the nets and the painted ice
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { colourOf } from '../src/lib/teams.js';
import { NET_X } from '../src/lib/rink.js';
import { SX, BOARD } from '../src/lib/rinkart.js';
import { whistle } from '../src/lib/layers/whistle.js';
import { readFileSync, readdirSync } from 'node:fs';
import { rich, app, SCRIPT, PAGE_CSS, prose, boot , pickLayer } from './helpers/page.js';

test('no bare percentage survives in the layer box', () => {
  // The rule the goalie card and the per-game sentence already follow, applied
  // to the surface where the denominator is smallest and moves fastest: early in
  // a game one attempt swings the share ~2.5 points, and "58%" asserts a
  // precision that "11 – 8" does not claim (CHENG).
  // ⏹ Read off the scoreboard's split bar until 2026-09-17, when the parked bar
  // was removed; the layer box is where these figures are shown.
  const a = boot();
  pickLayer(a, 'corsi');
  for (const [xa, xh, note] of a.sweep(d => [d.$('lxA').textContent, d.$('lxH').textContent,
                                             d.$('lxN').textContent])) {
    assert.match(String(xa), /^\d+$/, `the away figure reads "${xa}"`);
    assert.match(String(xh), /^\d+$/, `the home figure reads "${xh}"`);
    assert.match(String(note), /· all situations\.$/, 'every site carrying this number carries its mode');
  }
});

test('the strength mode reaches the layer box', () => {
  /* ⏹ THE CHIPS WENT ON 2026-09-07 and the FILTER did not, so the mode is
     entered the way a visitor can still enter it: `?strength=even`. Driving a
     control the page no longer has is the trap this repo hit in August — the fake
     document invents an element for any selector, so the click would have been a
     no-op and this test would have asserted the DEFAULT mode while claiming to
     assert the other one. */
  const a = boot(null, null, '?strength=even');
  pickLayer(a, 'corsi');
  // At a frame with something counted: before the first attempt the note says
  // "Press play — nothing has been counted yet." and names no mode, correctly.
  a.at(a.timeline.length - 1, d => assert.match(String(d.$('lxN').textContent), /· even strength\.$/));
});

test('each mode discloses what it actually does, and neither borrows the other', () => {
  // A REAL TRANSFORMATION OF RECORDED COORDINATES, undisclosed on a page whose
  // thesis is that nothing is transformed silently (CHENG). Teams switch ends
  // every period in the arena; here each attacks the same net all game.
  //
  // The sentence used to be a 128px permanent paragraph under the controls and
  // is now a legend key that arrives at the first period change — but THE CLAIM
  // MUST SURVIVE THE MOVE, which is what this asserts and the tests below do
  // not. Whitespace-collapsed, because HTML collapses it and the source wraps:
  // the first version of this test failed on a line break inside its own
  // sentence, which is a test asserting a fact about the source file rather
  // than the page.
  // ASSERTED THROUGH THE RENDERER, NOT THE SOURCE. This read the markup between
  // </style> and <script>, and the sentence now comes from rink.js by way of the
  // mode -- so a source check would fail while the page was right. That is the
  // same lesson the boundary-note test below already carries, applied here.
  const fixedKey = boot(null, null, '?ends=fixed').$('endsKey').textContent;
  assert.match(fixedKey, /ends are held fixed/i, 'the transformation is no longer disclosed');
  assert.match(fixedKey, /switch each period/i, 'and what the arena does instead is not said');

  // AND THE DEFAULT MUST NOT INHERIT IT. As-played holds nothing fixed, so
  // saying it would be a disclosure of a transform that is not happening --
  // which is worse than silence, because it reads as rigour.
  const playedKey = boot(null, null, '?ends=as-played').$('endsKey').textContent;
  assert.doesNotMatch(playedKey, /held fixed/i,
    'as-played claims to hold the ends fixed, and it turns the rink over');
  assert.match(playedKey, /switch ends every period/i);
});

test('the legend shows the mark the ice actually draws', () => {
  // The legend advertised a siren for a goal. The ice draws a bullseye; the
  // siren appears only in the caption for the current event, so a viewer looking
  // for it on the rink is looking for something that is not there.
  const legend = app.match(/<div class="legend">([\s\S]*?)<\/div>/)[1];
  assert.doesNotMatch(legend, /🚨/, 'no mark the rink does not draw');
  assert.match(legend, /class="k-g"/, 'a swatch for the goal instead');
});

/**
 * What a VISITOR reads: the markup, with the stylesheet and the script removed.
 *
 * A copy gate over the whole file is a copy gate over the source comments, which
 * legitimately discuss the app's own history — the first version of the test
 * below failed on a comment explaining why trails have two settings.
 */

test('the controls explain themselves without referring to their own history', () => {
  // Changelog voice: "a shot chart nobody asked for", "that older behaviour, on
  // purpose". A first-time visitor has no idea there was an older behaviour
  // (CHENG). The explanation of what each control DOES was the good part and
  // stays; the apology for the past comes out.
  assert.doesNotMatch(prose, /used to stay on the ice|older behaviour|nobody asked for/,
    'the page is apologising to itself');
  // AND THE RENDERED NOTES, now that the copy lives there. The notes moved out
  // of permanent markup into the moment of use (R Q3), so a gate reading only
  // the markup would have quietly stopped covering the sentences it was written
  // for. NOT a grep over the whole script: this file's own comment above says
  // why — the source comments legitimately discuss the app's history, and the
  // first version of this test failed on one. Read what a VISITOR is shown.

  // ⭐ AND THIS HALF REVERSED ON 2026-08-25. It used to REQUIRE the note to be
  // empty until the control had been used, which is the 2026-08-16 rule applied
  // to the wrong category: right for a STATE (the empty-net note describes
  // something on screen now) and wrong for a CONTROL (a button has to be
  // predictable before the click, or it is a dare). docs/below-the-rink-2.md
  // §4.2, and CHENG's wording for it: a note about the ICE fires when the ice
  // shows it, a note about a CONTROL is available before it is pressed.
  const a = boot();
  assert.ok(a.$('nTrails').textContent,
    'the trails control explains itself only after you have already used it');
  // NOT PINNED TO ONE MODE'S WORDING. What this test is about is that BOTH
  // states explain the control; WHICH promise each mode makes is asserted below,
  // where the promise and the behaviour are checked together.
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
  assert.match(a.$('nTrails').textContent, /stays on the ice|as they happen/i,
    'flipping the trails control explains nothing');
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'off').click();
  assert.ok(a.$('nTrails').textContent, 'the note left with the setting');

  // Every note a visitor can actually be shown, in the state that shows it.
  // BOTH STATES OF EACH, because "explains itself" is now a claim about the
  // default too — and the default is the state every first-time visitor is in.
  // `nFig` LEFT WITH ITS CONTROL on 2026-08-26 — Kevin removed the Players and
  // Narration pickers, so the two notes this used to walk have no button to be
  // about. ⏹ AND `nSit` LEFT THE SAME WAY ON 2026-09-07: Kevin removed the All
  // situations / Even strength only chips — *"we are making an 'advanced' toggle
  // available to a novice, without really explaining what the relative importance
  // of the toggle is"* — and a note explaining a control nobody can press has
  // nothing to be about. The FILTER survives on `?strength=even`; only the chip
  // and its sentence went. What remains is every note a visitor can still be
  // shown, which is the claim this test has always been making.
  const shown = [];
  for (const id of ['nTrails']) shown.push(a.$(id).textContent);
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
  for (const id of ['nTrails']) shown.push(a.$(id).textContent);
  for (const text of shown) {
    assert.ok(text, 'a control was switched and explained nothing');
    assert.doesNotMatch(text, /used to|older behaviour|nobody asked for|no longer/i,
      `the changelog voice reached a visitor: "${text}"`);
  }
});

/**
 * ⭐ TWO CONTROLS LEFT, AND ONE OF THEM TOOK NOTHING WITH IT.
 *
 * Kevin, 2026-08-26: "for display options, I vote to remove players and
 * narration." Both are gone from this page. What this asserts is the part that
 * is easy to get wrong in a deletion — WHAT WAS INSIDE THE CONTAINER:
 *
 *   narration  `labelsOn` gated the ice's naming of every event. The pill's
 *              goal branch used to be reachable only with it off; it survives
 *              because `place()` returns nothing for a shootout event, which
 *              render-transport now proves against a real shootout fixture.
 *   players    the one figure this rink draws is `figMascot`; the second style
 *              went with the goaltender's-eye view on 2026-09-17
 */
test('the figure picker and the narration pair are gone, and nothing is orphaned', () => {
  for (const cls of ['fbtn', 'nbtn']) {
    assert.doesNotMatch(app, new RegExp(`class="[^"]*\\b${cls}\\b`),
      `the ${cls} control is back on the page`);
    assert.doesNotMatch(SCRIPT, new RegExp(`querySelectorAll\\('#rg \\.${cls}'\\)`),
      `the page still queries .${cls}, so a control was half-removed`);
  }
  assert.doesNotMatch(SCRIPT, /localStorage\.setItem\('rtg\.fig'/,
    'the page still writes a figure preference no control on it can set');

  /* ⏹ AND THE ALTERNATIVE FIGURE NO LONGER HAS A HOME EITHER. This used to require
     that `src/goalie-eye-view.html` still offered the tabletop style — "without
     this the deletion above would read as a licence to delete figTabletop too,
     which would break a page nobody was looking at". Nobody was looking at it
     because nothing linked to it: the page went on 2026-09-17 and the figure with
     it. What is asserted now is that NO page offers a figure picker, which is the
     claim that keeps the deletion honest in both directions. */
  for (const f of readdirSync(new URL('../src/', import.meta.url)).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /data-f="tabletop"/, `${f} offers a figure the module no longer has`);
  }
});

/**
 * ⭐ AND TRAILS IS BEHIND A DISCLOSURE, SO ITS SUMMARY CARRIES ITS SETTING.
 *
 * The rule the layer menu established when everything below the rink collapsed:
 * a control you cannot see must still be able to say what it is doing, or the
 * ice fills with marks and nothing on screen accounts for them.
 */
test('the trails summary says which setting is on, in the button\'s own words', () => {
  const a = boot();
  const label = () => a.$('zTrailsOn').textContent;
  const btn = t => a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === t);

  assert.equal(label(), btn('off').textContent.toLowerCase(),
    'the summary does not report the setting the page opened with');
  btn('all').click();
  assert.equal(label(), btn('all').textContent.toLowerCase(),
    'the summary kept reporting a setting that is no longer on');

  // QUOTED FROM THE BUTTON, NOT RE-DERIVED. `Keep every mark` becomes `Keep this
  // period` under as-played, and a badge with its own spelling of the state is
  // how a readout starts disagreeing with the control it reports.
  const played = boot(null, null, '?ends=as-played');
  const on = played.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all');
  on.click();
  assert.equal(played.$('zTrailsOn').textContent, on.textContent.toLowerCase());
});

/* ⭐⭐ THE DRAWN EXTENT OF A FIGURE, 2026-10-04. The goaltender stopped being
   three named parts (`gkbody` + `gkhead` + `gkstick`) and became `FIG.goalie`,
   drawn through a pen into anonymous paths. A rule that can only see named parts
   would have had to be deleted at exactly the moment the drawing changed, which
   is when it is most needed — so this reads the geometry instead, and asks a
   STRONGER question than before: the old version could not see a blocker or a
   shadow sticking out past the post, and this can.

   ⚠️ ARCS CARRY THEIR OWN EXTREMES. SvgPen renders a circle as two `A` sweeps
   whose endpoints are its left and right edges, so the crown of a head is never
   an explicit coordinate — it is `y - ry` off the arc command. Reading only the
   M/L/Q points understates a figure by a head radius, which would let a
   goaltender poke through the crossbar and pass. */
function drawnExtent(svg) {
  let top = Infinity, bot = -Infinity;
  /* ⚠️ THE TRANSFORM MAY CARRY MORE THAN THE TRANSLATE. A skater leans, so his
     group reads `translate(x,y) rotate(r)` and a pattern demanding the closing
     quote straight after the translate simply never matched — the group was
     treated as unplaced and the figure measured 48 feet. The goaltender does NOT
     lean, so he measured correctly throughout and the bug looked like a defect in
     the skater\'s SIZE rather than in the ruler. */
  const parts = svg.split(/<g transform="translate\(([-\d.]+),([-\d.]+)\)[^"]*"[^>]*>/);
  let ty = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 && i % 3 === 1) continue;                       // the x of a translate
    if (i > 0 && i % 3 === 2) { ty = +parts[i]; continue; }   // the y of a translate
    const chunk = parts[i], off = i === 0 ? 0 : ty;
    for (const m of chunk.matchAll(/A([\d.]+),([\d.]+) \d \d \d ([-\d.]+),([-\d.]+)/g)) {
      top = Math.min(top, off + +m[4] - +m[2]); bot = Math.max(bot, off + +m[4] + +m[2]); }
    for (const m of chunk.matchAll(/[MLQ]\s*[-\d.]+,([-\d.]+)/g)) {
      top = Math.min(top, off + +m[1]); bot = Math.max(bot, off + +m[1]); }
  }
  return { top, bot };
}
/** Each goaltender's markup, left to right, read from `#netmen`. */
function netmen(svg) {
  const men = [...svg.matchAll(/<g class="gk">([\s\S]*?)(?=<g class="gk">|$)/g)].map(m => m[1]);
  return men.map(one => {
    const tx = /<g transform="translate\(([-\d.]+),/.exec(one);
    const fills = [...one.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/g)].map(m => m[1].toLowerCase());
    return { x: tx ? +tx[1] : NaN, fills, ...drawnExtent(one) };
  }).sort((p, q) => p.x - q.x);
}

test('a goaltender stands in each crease, and the sides agree with the scoreboard', () => {
  // THE FIGURE REPLACED THE TEXT. "WSH net" written up the post was clutter doing
  // a job a figure does better (Kevin): a goaltender in the crease says the net is
  // defended, and the club's colour says whose — which is how a viewer reads a
  // real rink rather than a labelled diagram.
  // AT THE FIRST EVENT, not at boot: the app opens on the LAST event of the game,
  // where Minnesota has already pulled its goalie — so reading the boot state
  // would have been reading the one frame in the game with an empty net.
  const a = boot();
  const opening = a.every(d => d.$('netmen').innerHTML)[0];
  const gks = netmen(opening);
  assert.equal(gks.length, 2, 'both nets are defended at the opening faceoff');

  // The host is on the RIGHT, and so is the host's badge on the scoreboard. The
  // agreement is the point: the same club on the same side of one screen.
  const [visitor, host] = gks;
  /* ⭐⭐ BOTH GOALTENDERS NOW WEAR THEIR OWN CLUB'S COLOUR, and that is a change.
     The glyph gave the visitor a WHITE body with a club-coloured outline, after
     the real sweater convention. The figure that replaced it on 2026-10-04 is the
     same drawing the SHOOTER uses, and `marks.js` has always painted a shooter in
     his club's colour whichever end he came from — so keeping the white visitor
     would have been the one place on the ice where two people of the same kind
     were coloured by different rules. The identity claim is unchanged and is what
     this still checks: the man in each crease carries his own club's colour, and
     he is on the side the scoreboard says he is. */
  assert.ok(host.fills.includes(colourOf(a.$('hAb').textContent).toLowerCase()),
    "the host's goaltender does not wear the host's own colour");
  assert.ok(visitor.fills.includes(colourOf(a.$('aAb').textContent).toLowerCase()),
    "the visitor's goaltender does not wear the visitor's colour");
  assert.notDeepEqual(host.fills, visitor.fills,
    'both goaltenders are painted identically, so the colour identifies nobody');
  assert.ok(host.x > 100 && visitor.x < 100, 'host right, visitor left');

  /* ⭐⭐ THE VERTICAL TAG IS BACK, AND THIS ASSERTION USED TO FORBID IT.
     It read `doesNotMatch(/class="netlab"/, 'the vertical tag is gone')`, pinning
     76e7a86 (2026-08-13, 11:12): *"put a goalie in front of the net and the
     ambiguity resolves, so the text tags can go... a goaltender standing in the
     crease says the net is defended AND THE CLUB'S COLOUR SAYS WHOSE."*

     ⛔ THAT PREMISE IS THE ONE KEVIN DISPROVED, from his own phone, on MTL at
     CAR: *"the hero game is two red or white colored teams... it's super
     difficult to figure out who's end is who's."* The club's colour says whose
     only when the two clubs have different colours, and eleven of the 33 are red.

     So the element returns — but NOT the element that was deleted, and the three
     differences are what this test now pins instead of the ban:

       BEHIND the net, not on it. 52f9b5c put the tag at `SX(-89)+2` = 191, inside
       the net's own 189..193 body, competing with the mesh, the strands, the post
       and the goaltender standing in front of all three. It now sits in the strip
       between the net's BACK and the boards, which is empty ice.

       UNDER the game, not over it. It is the first child of the first `<g>`, so
       the 3.5% of placed events that land behind a goal line (420 of 12,024 over
       41 archive games) draw across it.

       BESIDE the goaltender, not instead of him. Both August commits treated the
       two as alternatives — one shipped the tag and dropped the captions, the
       next shipped the figure and dropped the tag. Kevin's complaint is that
       NEITHER is sufficient alone: the figure says the net is defended, the fill
       says host or visitor, and only the LETTERS survive two clubs in red. The
       goalie assertions above and these run in one test on purpose. */
  const tags = [...a.$('rink').innerHTML.matchAll(
    /<text class="netlab" x="([-\d.]+)"[^>]*>([^<]+)</g)]
    .map(m => ({ x: +m[1], ab: m[2] })).sort((p, q) => p.x - q.x);
  assert.equal(tags.length, 2, 'one tag per net');
  assert.equal(tags[1].ab, a.$('hAb').textContent, 'the host is named at the host end');
  assert.equal(tags[0].ab, a.$('aAb').textContent, 'the visitor at the visitor end');

  // BEHIND THE NET AND INSIDE THE BOARDS, derived from the same geometry the net
  // is — not from 196 and 4 typed here, which would be this test agreeing with a
  // number rather than with a position.
  const back = 4, half = SX(-NET_X);                   // the net is 4 deep
  assert.ok(tags[1].x > half + back && tags[1].x < BOARD.x + BOARD.w,
    `the host tag is between the net's back and the boards, not on the net`);
  assert.ok(tags[0].x < SX(NET_X) - back && tags[0].x > BOARD.x,
    `the visitor tag likewise`);

  // AND IT IS THE DEEPEST INK ON THE ICE. `#rink` is the first <g> in the svg and
  // the tag is the first thing in it, so everything the game draws covers it.
  assert.match(a.$('rink').innerHTML.slice(a.$('rink').innerHTML.indexOf('<g class="netg">')),
    /^<g class="netg"><text class="netlab"/, 'the tag is not first inside the net group');

  // ⛔ THE TWO-WORD FORM STAYS DELETED. 52f9b5c wrote `WSH net` up the post; the
  // noun was the clutter Kevin named, and the goaltender does say `net` already.
  assert.doesNotMatch(app, /\$\{ab\} net</, 'the "WSH net" copy came back');
});

test('the goaltender LEAVES when the feed says the goalie was pulled', () => {
  // NOT DECORATION. `sit` is [awayGoalie][awaySkaters][homeSkaters][homeGoalie] on
  // every event — all 320 of them in the reference game — and Minnesota pulls at
  // 01:40 of the third, the code reading 0651 for the last twenty events. The
  // emptiest net in hockey stops being something a novice has to be told about.
  const a = boot();
  const walk = a.every((d, at) => ({ type: at.ev.type, html: d.$('netmen').innerHTML,
    gks: (d.$('netmen').innerHTML.match(/<g class="gk">/g) || []).length }));
  /* ⛔⛔ THE HORN IS NOT A PLAY, SO IT IS NOT PART OF THIS CLAIM. Kevin, on a
     finished game, 2026-10-04: the pulled-goalie surfaces are "true with 1 second
     left… but after the game is over, that becomes moot." The rink now draws
     nobody at the horn, so a walk that pooled it with the game would read "both
     nets empty" — a code no feed emits — into a frame where nobody is claiming
     anything. See `layer.js::notAPlay`. */
  const play = walk.filter(f => f.type !== 'game-end');
  assert.ok(play.length > 200, `only ${play.length} play frames walked`);
  const counts = new Set(play.map(f => f.gks));
  assert.ok(counts.has(2), 'both goalies are in net for most of the game');
  assert.ok(counts.has(1), 'and one net is empty at the end — the pull is in the data');
  assert.ok(!counts.has(0), 'never both, which no situation code in this game says');

  // The one that leaves is the VISITOR's, which is what 0651 means.
  const last = play[play.length - 1].html;
  assert.equal((last.match(/<g class="gk">/g) || []).length, 1);
  assert.match(last, new RegExp(`fill="${colourOf(a.$('hAb').textContent)}"`),
    'the host keeps its goaltender');

  /* AND THE HORN ITSELF, which is the paired half: without it this test passes on
     a page that simply stopped drawing goaltenders at all. */
  const horn = walk.filter(f => f.type === 'game-end');
  assert.equal(horn.length, 1, `${horn.length} horn frames — the walk is not reaching it`);
  assert.equal(horn[0].gks, 0,
    'the game is over and the rink still says which net is defended');
});

test('a missing situation code never empties a net', () => {
  // An empty net drawn on a guess would be the most dramatic thing on the ice
  // invented from nothing. Absent evidence is not evidence of absence.
  assert.match(app, /if\(!sit\|\|sit\[3\]!=='0'\)/, 'the host goalie stays when sit is missing');
  assert.match(app, /if\(!sit\|\|sit\[0\]!=='0'\)/, 'and so does the visitor');
});

test('the goal flash is its own element, so the net cannot vanish', () => {
  // The old markup put the flash animation on a HIDDEN duplicate of the net.
  // Once the net became always-visible, animating it would have run the net's
  // own opacity 0 -> .85 -> 0 on every goal: the net disappearing and coming
  // back, which reads as a rendering fault rather than a celebration.
  const a = boot();
  const rink = a.$('rink').innerHTML;
  for (const id of ['netHome', 'netAway']) {
    const m = rink.match(new RegExp(`<path id="${id}"[^>]*>`));
    assert.ok(m, `${id} must exist for flashNet to find`);
    assert.match(m[0], /class="flashpath"/, 'the flash is a separate path');
    assert.match(m[0], /opacity="0"/, 'and it starts invisible');
  }
  // The net's own body must NOT be the thing carrying the id.
  assert.doesNotMatch(rink, /<path class="mesh" id=/, 'the net itself is never flashed');
  // BY ROLE, NOT BY SIDE. `netL`/`netR` were screen names for data facts, and
  // reflecting the rink turns that kind of name into a lie without changing a
  // character of it.
  assert.match(app, /const net=scorer===AID\?\$\('netHome'\):\$\('netAway'\)/,
    "a visitor goal lights the HOST's net, whichever side that is drawn on");
});

test('the goaltenders are redrawn only when they change', () => {
  // Rewriting them every frame restarts the entrance animation on every event —
  // a goaltender flickering three hundred times a game. It also makes the
  // animation mean something: it fires when a goalie arrives or leaves, and at
  // no other moment.
  /* ⭐ THE RULE IS NOW SHARED, so this reads the shared spelling. `drawNetmen`
     held the only memo in the file until 2026-10-04, when a tap on the scrubber
     showed the same entrance animation restarting on the label and the shot line
     — the subtrees that had no memo. `put` is that memo generalised, and
     `test/render-redraw.test.js` holds the rule itself; this asserts only that
     the goaltenders go through it. */
  assert.match(app, /put\(\$\('netmen'\),out\.join\(''\)\)/, 'the goaltenders go through `put`');
  assert.match(app, /if\(WROTE\.get\(el\)===html\)return false;/, 'unchanged markup touches no DOM');

  // And the state still tracks the game: two, then one after the pull.
  const a = boot();
  const seen = a.every((d, at) => ({ type: at.ev.type,
    gks: (d.$('netmen').innerHTML.match(/<g class="gk">/g) || []).length }));
  const play = seen.filter(f => f.type !== 'game-end').map(f => f.gks);
  assert.deepEqual([...new Set(play)].sort(), [1, 2],
    'exactly two states across the game itself');
  assert.equal(play[0], 2);
  assert.equal(play[play.length - 1], 1);
  // THREE STATES ACROSS THE TIMELINE, and the third is the horn: nobody at all.
  assert.equal(seen[seen.length - 1].gks, 0, 'the horn still has a goaltender in it');
});

/**
 * A SYNTHESISED shootout, and synthesised on purpose (CHENG).
 *
 * The reference game carries `pt: 'REG'` on all 320 events, so every local test,
 * every fixture and every mutation ever run here has been on a game with no
 * shootout — which is exactly why the defect survived. Reaching into the archive
 * for `2023020510` would fix that today and leave the test depending on a game
 * remaining published tomorrow. So the case is built here.
 *
 * The coordinates are the ones the feed really produces, taken from that game:
 * attempts at BOTH ends (+75, -73, +76, -83), which is the thing that cannot be
 * true — every shootout attempt is taken at one end.
 */
function withShootout() {
  const g = JSON.parse(JSON.stringify(rich));
  const shot = g.events.find(e => e.type === 'shot-on-goal' && e.x != null);
  const HID = g.teams.home.id, AID = g.teams.away.id;
  const at = [[75, 1, 'missed-shot', AID], [-73, 0, 'missed-shot', HID],
              [76, -1, 'goal', AID], [-83, -7, 'missed-shot', HID]];
  for (const [x, y, type, own] of at) {
    g.events.push({ ...shot, per: 5, pt: 'SO', type, own, x, y,
                    s: 4800, clock: '00:00', rem: '00:00' });
  }
  return { game: g, added: at.length };
}

test('overtime is NAMED, and says how many skaters are on the ice', () => {
  // Kevin: if overtime is not surfaced, show something for the fourth period.
  // Overtime IS surfaced — its events are real play, drawn and counted. What was
  // never said is that it is overtime, or the thing that actually changes:
  // measured over 219 raw feeds, regular-season overtime is 3-on-3 in 82.3% of
  // its events. Four skaters leave and the page said "Period 4".
  const g = JSON.parse(JSON.stringify(rich));
  const shot = g.events.find(e => e.type === 'shot-on-goal' && e.x != null);
  //                     per  pt     sit     what the label must say
  const CASES = [[4, 'OT', '1331', 'Overtime · 3-on-3'],
                 [4, 'OT', '1551', 'Overtime · 5-on-5'],   // playoff overtime
                 [4, 'OT', '1431', 'Overtime · 4-on-3'],   // a penalty in overtime
                 [5, 'OT', '1551', '2OT · 5-on-5'],        // playoffs run past one
                 [6, 'OT', '1551', '3OT · 5-on-5']];
  for (const [per, pt, sit, want] of CASES)
    g.events.push({ ...shot, per, pt, sit, s: 3600 + per * 60, rem: '05:00' });
  g.events.push({ ...shot, per: 5, pt: 'SO', sit: '1010', s: 4800, rem: '00:00' });

  const a = boot(g);
  const labels = a.every(d => d.$('per').textContent);
  const tail = labels.slice(-(CASES.length + 1));
  for (let k = 0; k < CASES.length; k++)
    assert.equal(tail[k], CASES[k][3], `period ${CASES[k][0]} ${CASES[k][2]}`);
  assert.equal(tail[CASES.length], 'Shootout', 'and the shootout is named, not "Period 5"');

  // REGULATION IS UNTOUCHED, and it carries no skater count — the strength layer
  // is what explains a power play, and two answers to one question is worse than
  // one. Without this the fix could have been "always append the situation".
  assert.equal(labels[0], 'Period 1');
  for (const l of labels.slice(0, -(CASES.length + 1)))
    assert.match(l, /^Period [123]$/, `regulation label became "${l}"`);

  // THE COUNT IS AWAY-THEN-HOME, the scoreboard's own order. `sit` is
  // [awayGoalie][awaySkaters][homeSkaters][homeGoalie], so 1431 is 4 away
  // skaters against 3 home — reading it the other way names the wrong side of a
  // power play, which this project has shipped once already.
  assert.equal(tail[2], 'Overtime · 4-on-3');
});

test('a shootout attempt NEVER becomes a mark on the ice', () => {
  // THE COUNTING PATHS ALREADY KNEW. `inShootout` lives in layer.js and its own
  // comment says it is there "because all three need it". Three reducers called
  // it; the DRAWING path never did, and painted attempts at coordinates that are
  // not positions on the ~6% of games that reach a shootout.
  const { game, added } = withShootout();
  const a = boot(game);
  const last = +a.$('scrub').max;
  // The four appended events are all drawable types, so they occupy the final
  // timeline slots. Identifying them by INDEX rather than by coordinate keeps
  // this from accidentally passing because a regulation play sat elsewhere.
  const soIdx = new Set(Array.from({ length: added }, (_, k) => String(last - k)));
  assert.equal(soIdx.size, added);

  const frames = a.every(d => d.$('events').innerHTML);
  for (const html of frames)
    for (const m of html.matchAll(/data-i="(\d+)"/g))
      assert.ok(!soIdx.has(m[1]), `a shootout attempt was drawn on the ice (data-i=${m[1]})`);

  // The puck is the third site that read a coordinate directly, so it moved to a
  // place the puck had not been.
  const pucks = a.every(d => d.$('puck').innerHTML);
  for (let k = last - added + 1; k <= last; k++)
    assert.equal(pucks[k], '', `the puck jumped to a shootout coordinate at frame ${k}`);
  /* ⛔ AND THE CONTROL FRAME IS FOUND, NOT COUNTED BACKWARDS. It used to be
     `last - added` — the slot immediately before the appended block — which was
     the last regulation play until 2026-09-30, when the final horn became a
     frame of its own and slid into that position. The horn draws no puck, which
     is correct, so a positional control turned a passing check into a failing
     one without anything about the shootout changing. The claim was always *a
     real play still draws a puck*; it now asks for one. */
  const real = pucks.findLastIndex((html, k) => k < last - added + 1 && html !== '');
  assert.ok(real >= 0, 'no frame in this fixture draws a puck at all, so the control is vacuous');
  assert.ok(pucks[real] !== '', 'and the puck is still drawn for real play');

  // AND THE ICE SAYS SO, rather than going quietly blank. Removing the marks
  // without a word would leave the replay ending level while the scoreboard
  // reads a goal higher, with nothing accounting for the difference.
  const notes = a.every(d => d.$('noplace').innerHTML);
  assert.equal(notes[last - added], '', 'nothing is said during ordinary play');
  for (let k = last - added + 1; k <= last; k++) {
    /* ⚠️ THE CLAIM, NOT THE SENTENCE. This pinned the copy verbatim and went red
       on 2026-10-01 for a pure reword — Kevin: *"I don't want to call it a
       'skills' competition, let's just say competition. Also the end of the
       sentence doesn't make much sense, '… not play in it'."* What this test is
       named for is that the ice SAYS SOMETHING rather than going quietly blank,
       and the two facts it must carry are which part of the game this is and that
       it is outside the play. Those are asserted; the wording is free to improve
       without this going red on work it has no opinion about. */
    assert.match(notes[k], /Shootout/i, 'the ice does not name what it is showing');
    assert.match(notes[k], /not part of the play/i,
      'the note does not say the shootout sits outside the play, which is the '
      + 'reason the marks are missing');
    assert.match(notes[k], /coordinates the feed records for them are not positions/,
      'the disclosure has to say what we did, not only what a shootout is');
  }
});

/**
 * ⛔⛔ A SHOOTOUT CODE IS NOT A SITUATION ON THE ICE — and `strength.js` said so
 * as though it were already handled. Its comment over the penalty-shot branch:
 *
 *   "`pt === 'SO'` carries the shootout, and `inShootout` removes those before
 *    strength is consulted — so in practice this branch describes the REGULATION
 *    penalty shot"
 *
 * `inShootout` removes shootout events from the COUNTING LAYERS, which is where
 * it was written and where all three of its callers were. The scoreboard pill and
 * the ice note read the CURRENT EVENT directly and were never covered by it, so a
 * shootout attempt coded `1010` — one shooter, one goalie, which is exactly what
 * a shootout looks like to four digits — lit the board with `BOS PENALTY SHOT`
 * and printed "BOS has pulled the goaltender for an extra attacker" under the
 * ice. Found by Kevin on a live preseason game, 2026-10-01. True of the function,
 * false of the system.
 *
 * ⭐ THE CONTROL IS THE WHOLE TEST. A guard that blanked the pill and the note on
 * every frame would satisfy the shootout half forever, and an empty net in
 * regulation is the thing those two surfaces EXIST to report — it is also a code
 * with a zero in a goalie digit, which is what makes it the right control and not
 * a comfortable one.
 */
test('the shootout lights no strength badge and empties no net', () => {
  const { game, added } = withShootout();
  const a = boot(game);
  const last = +a.$('scrub').max;

  const pills = a.every(d => (d.$('ppill').hidden ? '' : d.$('ppill').textContent));
  const notes = a.every(d => d.$('iceNote').textContent);
  for (let k = last - added + 1; k <= last; k++) {
    assert.equal(pills[k], '',
      `the scoreboard narrated a shootout code as a game state at frame ${k}: ${pills[k]}`);
    assert.equal(notes[k], '',
      `the page claimed a pulled goaltender during the shootout at frame ${k}: ${notes[k]}`);
  }

  /* THE CONTROL: a real empty net in regulation must still be reported, or the
     assertions above are satisfied by a page that says nothing ever. */
  const ev = game.events.map(e => ({ ...e }));
  const reg = ev.findIndex(e => e.pt !== 'SO' && e.sit);
  assert.ok(reg >= 0, 'the fixture holds no regulation event with a situation code');
  ev[reg] = { ...ev[reg], sit: '1550' };          // home goalie pulled, six skaters
  const b = boot({ ...game, events: ev });
  const ctrl = b.every(d => d.$('iceNote').textContent);
  assert.ok(ctrl.some(t => /pulled the goaltender/.test(t)),
    'an empty net in regulation went unreported, so the shootout assertions above '
    + 'are passing on a page that reports nothing at all');
});

/**
 * ⛔⛔ A NOTE TIME-BOXED IN GAME TIME MET A STRETCH OF THE GAME THAT HAS NONE.
 *
 * `endsNoteShowing` stands the period-change note down once `ENDS_NOTE_SECONDS`
 * of play have passed. Every shootout attempt is stamped at the same second — the
 * clock does not run — so `e.s - periodStart` never grew, the window never
 * closed, and a note written to appear for ninety seconds appeared on every frame
 * of the shootout, with the board's chip lit beside it the whole way. Kevin saw
 * it on a live preseason game, 2026-10-01, and ruled the shape: one mention of
 * the goaltenders changing ends at the transition, nothing after, no chip — and
 * the sixty minutes before it left exactly as they are.
 *
 * ⭐ THE CONTROL IS HALF THE RULING. "Don't change the behavior during the
 * regular 60 minutes between periods" is a requirement, not a courtesy, so a fix
 * that silenced the note everywhere satisfies every shootout assertion here and
 * breaks the thing he asked to keep. Both halves are checked off ONE boot.
 */
test('the shootout gets one word at its transition, and the periods keep theirs', () => {
  const { game, added } = withShootout();
  const a = boot(game);
  const last = +a.$('scrub').max;
  const first = last - added + 1;                 // the first shootout frame

  const notes = a.every(d => d.$('endnote').innerHTML);
  const pills = a.every(d => (d.$('endpill').hidden ? '' : 'lit'));

  assert.match(notes[first], /goaltenders change ends/i,
    'the transition into the shootout says nothing about the goaltenders');
  assert.doesNotMatch(notes[first], /teams have just changed ends|teams just changed ends/i,
    'the shootout still carries the period-change sentence');

  for (let k = first; k <= last; k++) {
    assert.equal(pills[k], '', `the board lit "Ends changed" in the shootout at frame ${k}`);
    if (k > first) assert.equal(notes[k], '',
      `the shootout note persisted past its transition at frame ${k}: ${notes[k]}`);
  }

  /* ⭐ THE CONTROL — a real period change still says what it always said. Found
     by looking for it rather than counted from an index, because the frame a
     period starts on moves whenever the timeline does. */
  const per = notes.findIndex((t, k) => k < first && /changed ends/i.test(t));
  assert.ok(per >= 0,
    'no period change said anything at all, so the assertions above are passing '
    + 'on a page that never shows this note');
  assert.equal(pills[per], 'lit', 'a real period change no longer signals at the board');
});

test('every face-off spot the feed uses is painted on the ice', () => {
  // Kevin: "the rink doesn't have face off circles in their zones." The four
  // end-zone CIRCLES were there; eight of the nine SPOTS were not, and a circle
  // with no dot in it is not what anyone recognises as a face-off circle.
  //
  // THE CLAIM IS ABOUT THE FEED, so the expectation is derived FROM the feed and
  // never typed. Across the archive every draw lands on one of nine coordinates —
  // 2,134 of them over 39 games spanning the three seasons — and the reference
  // game reaches eight of the nine, so the ninth would go unguarded if this test
  // only asked "is every spot used here drawn". It asks the containment the other
  // way round too: nothing is painted that the feed never uses.
  const a = boot();
  const rink = a.$('rink').innerHTML;
  const drawn = new Set([...rink.matchAll(/class="fdot[^"]*" cx="([\d.]+)" cy="([\d.]+)"/g)]
    .map(m => `${100 - +m[1]},${42.5 - +m[2]}`));   // back through SX/SY into the data frame
  assert.equal(drawn.size, 9, `nine spots on an NHL rink, ${drawn.size} drawn`);

  // 1. EVERY SPOT THE REFERENCE GAME ACTUALLY USES IS DRAWN.
  const used = new Set(rich.events.filter(e => e.type === 'faceoff' && e.x != null)
    .map(e => `${e.x},${e.y}`));
  assert.ok(used.size >= 8, `the reference game should exercise most spots, got ${used.size}`);
  for (const spot of used) assert.ok(drawn.has(spot), `a draw happens at ${spot}, unpainted`);

  // 2. AND NOTHING IS DRAWN THAT THE FEED DOES NOT USE. Without this the test
  //    passes for a rink covered in dots. The ninth spot the reference game never
  //    reaches is named here, so the pair of checks pins the set exactly.
  const measured = new Set(['-69,-22', '-69,22', '69,-22', '69,22',
                            '-20,-22', '-20,22', '20,-22', '20,22', '0,0']);
  for (const spot of drawn) assert.ok(measured.has(spot), `${spot} is painted, and no draw happens there`);
  assert.equal([...measured].filter(s => !used.has(s)).length, 1,
    'exactly one measured spot is unused in the reference game — the case the archive covers and this game does not');

  // THE NEUTRAL ZONE HAS SPOTS AND NO CIRCLES, which is the rink's own
  // arrangement. Circling them would be tidier and wrong.
  const circles = new Set([...rink.matchAll(/class="ln (?:red|blue)" cx="([\d.]+)" cy="([\d.]+)" r="15"/g)]
    .map(m => `${100 - +m[1]},${42.5 - +m[2]}`));
  assert.equal(circles.size, 5, 'four end-zone circles and centre ice');
  for (const spot of ['-20,-22', '-20,22', '20,-22', '20,22'])
    assert.ok(!circles.has(spot), `${spot} is a neutral-zone spot and carries no circle`);
  for (const spot of ['-69,-22', '-69,22', '69,-22', '69,22', '0,0'])
    assert.ok(circles.has(spot), `${spot} should be circled`);
});

test('a whistle mark lands ON a painted spot, not on blank ice', () => {
  // This is why the spots are not decoration. The whistle layer places every mark
  // at the faceoff that RESTARTS play, so each mark should coincide with paint —
  // and the ones that were landing on nothing were the neutral-zone offsides,
  // 89.8% of all offside restarts across the archive.
  const a = boot();
  pickLayer(a, 'whistle');
  const spots = new Set([...a.$('rink').innerHTML.matchAll(/class="fdot[^"]*" cx="([\d.]+)" cy="([\d.]+)"/g)]
    .map(m => `${(+m[1]).toFixed(1)},${(+m[2]).toFixed(1)}`));
  const marks = new Set(a.every(d => [...d.$('whistles').innerHTML
    .matchAll(/class="wh[\s"][^>]*cx="([\d.]+)" cy="([\d.]+)"/g)]
    .map(m => `${m[1]},${m[2]}`)).flat());
  assert.ok(marks.size >= 5, `the layer should draw marks in several places, got ${marks.size}`);
  for (const m of marks) assert.ok(spots.has(m), `a whistle mark sits at ${m}, where there is no spot`);
  // And the neutral zone specifically, because those are the four that were bare.
  const NEUTRAL = new Set(['80.0,64.5', '80.0,20.5', '120.0,64.5', '120.0,20.5']);
  assert.ok([...marks].some(m => NEUTRAL.has(m)),
    'no mark landed in the neutral zone, so this test never covered the spots that were missing');
});

test('every person on the ice is a person\'s height, measured against the net', () => {
  /* ⭐⭐⭐ KEVIN, 2026-10-05: *"is the net size scaled accurately to the rink size?
     Since the goalie is scaled to the net, the players appear quite a bit larger
     than the goalie, let\'s ensure the net scale is accurate, then work backwards
     to the size of the skaters."*

     MEASURED: the rink is 200x85 units for 200x85 feet, so ONE UNIT IS ONE FOOT
     and every figure\'s height is readable in feet. The net was right — a 6 ft
     mouth, a goal line 11 ft off the boards — but its depth was 4 ft against the
     rulebook\'s 44 inches, and THE PEOPLE WERE BADLY WRONG: a skater stood NINE
     FEET and a goaltender FOUR, on the same sheet.

     ⛔ WHAT THIS TEST USED TO SAY, AND WHY IT IS GONE. It required the goaltender
     to fill under 90% of the goal mouth — written in good faith when the figure
     was 8.1 units and genuinely dwarfed the net (Kevin, from a screen capture:
     *"the goalie figures are bigger than the net"*). But fitting a PERSON to a
     piece of EQUIPMENT is what made him two thirds of life size, and the rule
     could not see the skater beside him at half again over it. **A RATIO TO THE
     NEAREST OBJECT IS NOT A SCALE.** The replacement is an absolute one, and the
     net is still the yardstick — only now because six feet of goal mouth and six
     feet of goaltender are THE SAME MEASUREMENT, both out of the rulebook.

     ⚠️ AND IT IS NOT CIRCULAR: the heights come out of the rendered markup and
     the yardstick out of the drawn POSTS, so `PLAYER_FT` moving on its own cannot
     keep this green. */
  const a = boot();
  const posts = [...a.$('rink').innerHTML.matchAll(
    /class="post"[^>]*y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/g)]
    .map(m => ({ top: +m[1], bot: +m[2] }));
  assert.equal(posts.length, 2, 'two nets to be measured against');
  const mouthFt = posts[0].bot - posts[0].top;
  assert.ok(Math.abs(mouthFt - 6) < 0.01,
    `the goal mouth is ${mouthFt} units where the rulebook says 6 feet — the `
    + 'yardstick this test measures people with has itself drifted');

  const men = netmen(a.every(d => d.$('netmen').innerHTML)[0]);
  assert.equal(men.length, 2, 'both goaltenders present at the opening faceoff');

  for (let i = 0; i < men.length; i++) {
    const { top, bot } = men[i];
    const tall = bot - top;
    /* A six-foot man and a six-foot goal mouth are the same number of feet, so
       the two are compared directly. The 15% band is slack for the shadow under
       his skates and the crown of his mask, not room for a policy to move in. */
    assert.ok(Math.abs(tall - mouthFt) / mouthFt < 0.15,
      `goaltender ${i} stands ${tall.toFixed(2)} ft beside a ${mouthFt} ft goal mouth `
      + '— he is not a person\'s height on a rink drawn one unit to the foot');
    // CENTRED on the mouth, which is what keeps him in the net rather than above it.
    const off = Math.abs((top + bot) / 2 - (posts[i].top + posts[i].bot) / 2);
    assert.ok(off <= 0.35, `goaltender ${i} sits ${off.toFixed(2)} off the mouth's centre`);
  }

  /* ⭐⭐ AND THE HALF THE OLD RULE COULD NOT SEE: the skater. This is the actual
     defect Kevin reported — not that either figure was wrong on its own, but that
     two men on one sheet were 2.25x apart. Both are measured from the page.
     MUTATION: give `FIG_SZ` and `GK_SZ` different values and this fires. */
  const withFigures = a.every(d => d.$('events').innerHTML).find(h => /class="ev fig/.test(h));
  assert.ok(withFigures, 'no frame of this game drew a shot figure to measure');
  /* ⚠️ ONE FIGURE, NOT THE FRAME. A lazy `</g>` stops inside the figure\'s own
     nested transform groups and a greedy one swallows every mark on the ice — the
     first attempt measured a skater 48 feet tall, which is what a regex reporting
     the whole events layer looks like. Split on the marks themselves. */
  const one = withFigures.split(/<g class="ev fig/)[1] || '';
  const skater = drawnExtent(one.split(/<(?:g|circle|path|line) class="ev /)[0]);
  assert.ok(Number.isFinite(skater.top), 'the skater drew nothing this could measure');
  const skaterTall = skater.bot - skater.top;
  const gkTall = men[0].bot - men[0].top;
  assert.ok(Math.abs(skaterTall - gkTall) / gkTall < 0.2,
    `a skater stands ${skaterTall.toFixed(2)} ft and a goaltender ${gkTall.toFixed(2)} ft — `
    + 'two people on one sheet are different heights');
});

test('the net is equipment: behind the goal line, six feet across, with netting', () => {
  // THESE ASSERTIONS EXISTED AND I DELETED THEM, by rewriting the test they lived
  // in into the goaltender test above. They guard an error that was actually
  // shipped for the rink's whole life — the nets drawn on the ICE side of the
  // goal line, 11 feet across — so they get their own test now rather than riding
  // along inside one about something else.
  const rink = boot().$('rink').innerHTML;
  assert.match(rink, /class="mesh"/, 'the net has a body');
  assert.match(rink, /class="strand"/, 'with netting in it, not a solid slab');
  assert.match(rink, /class="post"/, 'and posts');
  assert.match(rink, /class="crease"/, 'and it stands in a crease');
  assert.doesNotMatch(rink, /class="crease" x=/, 'the rounded-rectangle chip is gone');

  // BOTH nets are open. Filled with the club colour the host's rendered as a solid
  // block while the visitor's read as equipment, so the sweater convention moved
  // to the goaltender, where it does identity work.
  const fills = [...rink.matchAll(/class="mesh"[^>]*fill="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(fills, ['#fff', '#fff'], 'neither net is a coloured slab');

  // BEHIND THE GOAL LINE. A net whose body reaches into the playing surface
  // swallows every shot mark in front of it.
  const bodies = [...rink.matchAll(/class="mesh" d="M ([\d.]+) [\d.]+ L ([\d.]+) /g)]
    .map(m => ({ mouth: +m[1], back: +m[2] })).sort((p, q) => p.mouth - q.mouth);
  assert.equal(bodies.length, 2, 'one body per net');
  assert.equal(bodies[0].mouth, 11, 'the left mouth is on the goal line');    // SX(89)
  assert.ok(bodies[0].back < bodies[0].mouth,
    `the left net reaches to ${bodies[0].back}, on the ice side of ${bodies[0].mouth}`);
  assert.equal(bodies[1].mouth, 189, 'the right mouth is on the goal line');  // SX(-89)
  assert.ok(bodies[1].back > bodies[1].mouth,
    `the right net reaches to ${bodies[1].back}, on the ice side of ${bodies[1].mouth}`);

  // Six feet across, which is what a net is. It was eleven.
  const across = rink.match(/class="post"[^>]*y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/);
  assert.equal(+across[2] - +across[1], 6, 'a net is 6 feet wide, not 11');
});

test('every mark the stylesheet cuts a key for is NAMED to the reader', () => {
  // AN UNEXPLAINED MARK ON THE ICE IS A DOCTRINE VIOLATION, and two were
  // shipping. `.k-blk` and `.k-hd` were both defined in the stylesheet and
  // appeared nowhere in the markup: the blocked-shot ring and the slot ring were
  // drawn on every game and named in no legend. CHENG confirmed `k-blk`
  // independently — "styled, drawn, and never named".
  //
  // The blocked-shot one was the worse of the two, because the mark is not where
  // a reader will think it is. See docs/blocked-shots-layer.md §3: the
  // coordinate on a blocked shot is the BLOCK POINT, a median 24.2 ft from the
  // net against 33.4 for a shot on goal, so the ring sits nearer the net than
  // the shot that produced it — around a mark whose label names the shooter.
  //
  // The rule is read off the stylesheet rather than kept in a list here, so a
  // key added for a mark nobody explains fails on the day it is added. That is
  // the only version of this check that closes; a hand-maintained list is the
  // same defect with more steps.
  /* ⚠️ EXCEPT THE ONES ONLY THE CAPTION DRAWS. `k-rl` is placed by `#rg .lcap
     i.k-rl` — the rule-line swatch inside the layer caption, which appears with
     the whistle layer and names itself in the sentence beside it rather than in
     the legend. It had a row swatch too until 2026-09-07, when the parked layer
     menu was deleted; losing that did not lose the naming, and this sweep is
     about the LEGEND, whose subject it never was. */
  const keys = [...new Set([...PAGE_CSS.matchAll(/\.(k-[a-z]+)\s*\{/g)].map(m => m[1]))]
    .filter(k => k !== 'k-rl');
  assert.ok(keys.length >= 7, `only ${keys.length} legend keys found — the sweep is broken`);
  for (const k of keys)
    assert.match(app, new RegExp(`class="${k}"`),
      `.${k} is styled and drawn, and the reader is never told what it means`);
});
