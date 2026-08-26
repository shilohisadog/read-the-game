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
import { whistle } from '../src/lib/layers/whistle.js';
import { readFileSync } from 'node:fs';
import { rich, app, SCRIPT, PAGE_CSS, prose, boot } from './helpers/page.js';

test('no bare percentage survives on the scoreboard', () => {
  // The rule the goalie card and the per-game sentence already follow, applied
  // to the surface where the denominator is smallest and moves fastest: early in
  // a game one attempt swings the share ~2.5 points, and "58%" asserts a
  // precision that "11 – 8" does not claim (CHENG).
  const a = boot();
  a.$('lyCorsi').click();
  for (const [pa, ph, mode] of a.sweep(d => [d.$('pa').textContent, d.$('ph').textContent,
                                             d.$('pMode').textContent])) {
    assert.match(String(pa), /^\d+$/, `the control figure reads "${pa}"`);
    assert.match(String(ph), /^\d+$/, `the control figure reads "${ph}"`);
    assert.equal(mode, 'ALL SITUATIONS', 'every site carrying this number carries its mode');
  }
});

test('the strength mode reaches the scoreboard, not only the counters', () => {
  const a = boot();
  a.$('lyCorsi').click();
  a.GROUPS['#rg .sbtn'][1].click();                 // even strength only
  assert.equal(a.$('pMode').textContent, 'EVEN STRENGTH');
  assert.equal(a.$('mA').textContent, 'EVEN STRENGTH', 'and the two agree');
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
  // about. What remains is every note a visitor can still be shown.
  const shown = [];
  for (const id of ['nTrails', 'nSit']) shown.push(a.$(id).textContent);
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
  a.GROUPS['#rg .sbtn'].find(b => b.dataset.s === 'even').click();
  for (const id of ['nTrails', 'nSit']) shown.push(a.$(id).textContent);
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
 *   players    `figTabletop` is NOT dead code — `src/goalie-eye-view.html`
 *              offers both figures and carries its own copy of the module. What
 *              went is the control and the cross-page `rtg.fig` preference: a
 *              setting made on another page, applied here through a control this
 *              page no longer has, is state nothing on screen accounts for.
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

  // AND THE ALTERNATIVE FIGURE STILL HAS A HOME. Without this the deletion above
  // would read as a licence to delete `figTabletop` too, which would break a
  // page nobody was looking at.
  const gv = readFileSync(new URL('../src/goalie-eye-view.html', import.meta.url), 'utf8');
  assert.match(gv, /data-f="tabletop"/,
    'the goalie view no longer offers the tabletop figure, so it really is dead code now');
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
  const gks = [...opening.matchAll(
    /<rect class="gkbody" x="([-\d.]+)"[^>]*fill="([^"]+)" stroke="([^"]+)"/g)]
    .map(m => ({ x: +m[1], fill: m[2], stroke: m[3] })).sort((p, q) => p.x - q.x);
  assert.equal(gks.length, 2, 'both nets are defended at the opening faceoff');

  // The host is on the RIGHT, and so is the host's badge on the scoreboard. The
  // agreement is the point: the same club on the same side of one screen.
  const [visitor, host] = gks;
  assert.equal(host.fill, colourOf(a.$('hAb').textContent), "the host's own colour");
  assert.equal(visitor.fill, '#fff', 'the visitor wears white, like the sweaters');
  assert.equal(visitor.stroke, colourOf(a.$('aAb').textContent), 'trimmed in its club colour');
  assert.ok(host.x > 100 && visitor.x < 100, 'host right, visitor left');

  // And no text tag survives.
  assert.doesNotMatch(a.$('rink').innerHTML, /class="netlab"/, 'the vertical tag is gone');
  assert.doesNotMatch(app, /\$\{ab\} net</, 'and so is the copy that built it');
});

test('the goaltender LEAVES when the feed says the goalie was pulled', () => {
  // NOT DECORATION. `sit` is [awayGoalie][awaySkaters][homeSkaters][homeGoalie] on
  // every event — all 320 of them in the reference game — and Minnesota pulls at
  // 01:40 of the third, the code reading 0651 for the last twenty events. The
  // emptiest net in hockey stops being something a novice has to be told about.
  const a = boot();
  const counts = new Set(a.every(d =>
    (d.$('netmen').innerHTML.match(/class="gkbody"/g) || []).length));
  assert.ok(counts.has(2), 'both goalies are in net for most of the game');
  assert.ok(counts.has(1), 'and one net is empty at the end — the pull is in the data');
  assert.ok(!counts.has(0), 'never both, which no situation code in this game says');

  // The one that leaves is the VISITOR's, which is what 0651 means.
  const last = a.every(d => d.$('netmen').innerHTML).pop();
  assert.equal((last.match(/class="gkbody"/g) || []).length, 1);
  assert.match(last, new RegExp(`fill="${colourOf(a.$('hAb').textContent)}"`),
    'the host keeps its goaltender');
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
  assert.match(app, /if\(now===netmenAre\)return;/, 'unchanged frames touch no DOM');

  // And the state still tracks the game: two, then one after the pull.
  const a = boot();
  const seen = a.every(d => (d.$('netmen').innerHTML.match(/class="gkbody"/g) || []).length);
  assert.deepEqual([...new Set(seen)].sort(), [1, 2],
    'exactly two states across the whole game');
  assert.equal(seen[0], 2);
  assert.equal(seen[seen.length - 1], 1);
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
  assert.ok(pucks[last - added] !== '', 'and the puck is still drawn for real play');

  // AND THE ICE SAYS SO, rather than going quietly blank. Removing the marks
  // without a word would leave the replay ending level while the scoreboard
  // reads a goal higher, with nothing accounting for the difference.
  const notes = a.every(d => d.$('noplace').innerHTML);
  assert.equal(notes[last - added], '', 'nothing is said during ordinary play');
  for (let k = last - added + 1; k <= last; k++) {
    assert.match(notes[k], /skills competition that decides the game, not play in it/);
    assert.match(notes[k], /coordinates the feed records for them are not positions/,
      'the disclosure has to say what we did, not only what a shootout is');
  }
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
  a.$('lyWhistle').click();
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

test('the goaltender FITS INSIDE the net it defends, and is centred on the mouth', () => {
  // Kevin, from one screen capture: "the goalie figures are bigger than the net."
  // Measured, they were — 8.1 units tall in front of a 6-foot mouth, 135% of the
  // thing they defend, and centred at 41.8 against the mouth's 42.5, so high as
  // well as large. THIS IS THE THIRD TIME PIXELS FOUND WHAT THE SUITE COULD NOT.
  //
  // The size of a glyph has no source in the feed, so there is no number here to
  // assert as correct. The RELATIONSHIP is assertable: a goaltender defending a
  // net fits in it. Both sides of the comparison are read out of the rendered
  // markup — the mouth from the POST, the figure from its own parts — so this
  // cannot pass by agreeing with a constant it copied from the code.
  const a = boot();
  const posts = [...a.$('rink').innerHTML.matchAll(
    /class="post"[^>]*y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/g)]
    .map(m => ({ top: +m[1], bot: +m[2] }));
  assert.equal(posts.length, 2, 'two nets to be measured against');

  const opening = a.every(d => d.$('netmen').innerHTML)[0];
  const body = [...opening.matchAll(/class="gkbody"[^>]*y="([\d.]+)"[^>]*height="([\d.]+)"/g)]
    .map(m => ({ top: +m[1], bot: +m[1] + +m[2] }));
  const head = [...opening.matchAll(/class="gkhead"[^>]*cy="([\d.]+)" r="([\d.]+)"/g)]
    .map(m => ({ top: +m[1] - +m[2], bot: +m[1] + +m[2] }));
  const stick = [...opening.matchAll(/class="gkstick"[^>]*y1="([\d.]+)"[^>]*y2="([\d.]+)"/g)]
    .map(m => ({ top: Math.min(+m[1], +m[2]), bot: Math.max(+m[1], +m[2]) }));
  assert.equal(body.length, 2, 'both goaltenders present at the opening faceoff');
  assert.equal(head.length, 2);
  assert.equal(stick.length, 2);

  for (let i = 0; i < 2; i++) {
    const mouth = posts[i];
    const parts = [body[i], head[i], stick[i]];
    const top = Math.min(...parts.map(p => p.top));
    const bot = Math.max(...parts.map(p => p.bot));
    assert.ok(top >= mouth.top,
      `goaltender ${i} reaches ${top}, above the crossbar at ${mouth.top}`);
    assert.ok(bot <= mouth.bot,
      `goaltender ${i} reaches ${bot}, past the post at ${mouth.bot}`);
    // And it must be CLEARLY smaller, not merely non-overflowing — a figure that
    // exactly filled the mouth would pass the two checks above and still read as
    // a goaltender wearing the net.
    const fill = (bot - top) / (mouth.bot - mouth.top);
    assert.ok(fill < 0.9, `goaltender ${i} fills ${(fill * 100).toFixed(0)}% of the mouth`);
    // CENTRED. The old figure sat 0.68 high, which is what made it read as
    // standing above the net rather than in it.
    const off = Math.abs((top + bot) / 2 - (mouth.top + mouth.bot) / 2);
    assert.ok(off <= 0.2, `goaltender ${i} sits ${off.toFixed(2)} off the mouth's centre`);
  }
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
  const keys = [...new Set([...PAGE_CSS.matchAll(/\.(k-[a-z]+)\s*\{/g)].map(m => m[1]))];
  assert.ok(keys.length >= 7, `only ${keys.length} legend keys found — the sweep is broken`);
  for (const k of keys)
    assert.match(app, new RegExp(`class="${k}"`),
      `.${k} is styled and drawn, and the reader is never told what it means`);
});
