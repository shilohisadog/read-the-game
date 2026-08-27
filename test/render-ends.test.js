/**
 * The ends: the disclosure, and B1 as-played
 *
 * The scoreboard's direction arrows were removed 2026-08-25 (Kevin: "very
 * little visual or educational gain"), and the test that checked them against
 * where the host's shots actually land went with them. What replaced that
 * information is the goaltenders, whose creases say the same thing wordlessly.
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { WHY, whistle } from '../src/lib/layers/whistle.js';
import { rich, SCRIPT, fakeDom, bundle, boot } from './helpers/page.js';

test('the ends disclosure appears at a period boundary and nowhere else', () => {
  // THE SENTENCE docs/ends-switching.md AGREED IN SECTION 6 AND NEVER BUILT.
  // Asserted through the real renderer, because the bundle holds it as two
  // concatenated literals -- a source-text check on it fails while the page is
  // right, which is exactly the difference between the source and the rendering.
  const a = boot();
  const notes = a.every(d => d.$('endnote').innerHTML);
  const shown = notes.filter(Boolean);

  assert.ok(shown.length > 0, 'the disclosure never appears at all');
  assert.ok(shown.length < notes.length,
            'it is permanent furniture, which is the thing it must not be');
  assert.equal(notes[0], '', 'nothing to disclose at the opening faceoff');

  for (const h of shown) {
    assert.ok(/changed ends/.test(h), 'the hockey sentence');
    // The `display:` tag is DATA and stays off the ice -- asserted on the object
    // in box.test.js. Painting it here cost 176px on a 390px phone.
    assert.ok(!/display:/.test(h), 'the provenance string must not reach the ice');
    // AND THE DEFAULT SAYS NOTHING ABOUT WHAT WE DID, because it did nothing:
    // the rink just turned over in front of the reader and this captions it.
    assert.ok(!/hold the rink the same way/.test(h),
      'as-played disclosed a transform it did not make');
  }

  // THE CONTROL CARRIES BOTH SENTENCES, and this is the half CHENG warned would
  // be invisible if only the default were tested. One-direction shows the reader
  // nothing changing, so its sentence is the ONLY thing standing between the
  // page and the silent transform its whole thesis is against.
  const fixed = boot(null, null, '?ends=fixed')
    .every(d => d.$('endnote').innerHTML).filter(Boolean);
  assert.ok(fixed.length > 0, 'the control never discloses anything at all');
  for (const h of fixed) {
    assert.ok(/changed ends/.test(h), 'the control lost the hockey sentence');
    assert.ok(/hold the rink the same way/.test(h), 'the control lost the one about what we did');
    assert.ok(!/display:/.test(h), 'the provenance string must not reach the ice');
  }

  // IT IS A BLOCK PER PERIOD, NOT A SCATTER. A count of shown frames alone would
  // pass if the note blinked on and off at random moments; what makes it a
  // period-boundary disclosure is that it occupies one contiguous run at the top
  // of each period after the first. Three periods in the reference game, so two.
  let runs = 0;
  for (let k = 0; k < notes.length; k++) if (notes[k] && !notes[k - 1]) runs++;
  assert.equal(runs, 2,
    `the disclosure appears in ${runs} runs; a 3-period game has 2 later periods`);
});

test('on a blocked shot the figure wears the BLOCKER’s sweater, not the shooter’s', () => {
  // KEVIN, WATCHING THE HERO: "text says CAR, visual shows Vegas." The label
  // named the blocker and the figure was drawn in the shooter's colours, so the
  // two halves of one play named two different teams.
  //
  // The deeper fault was that the figure is the only mark on this rink that
  // depicts a PERSON, and the coordinate on a blocked shot is the BLOCKER's --
  // a median 25.0 ft from the attacked net against 34.3 for a shot on goal.
  // A shooter figure there stands on the wrong player's skates.
  const a = boot();
  const rows = a.every(d => ({ ev: d.$('events').innerHTML, lab: d.$('labels').innerHTML }));
  const AB = { a: rich.teams.away.ab, h: rich.teams.home.ab };

  let checked = 0;
  const drawn = { a: 0, h: 0 };
  for (const r of rows) {
    const m = /<g class="ev fig ([^"]*)"/.exec(r.ev);
    if (!m || !/\bblkd\b/.test(m[1])) continue;
    const cls = m[1].split(/\s+/);
    const side = cls.includes('a') ? 'a' : cls.includes('h') ? 'h' : null;
    assert.ok(side, `a blocked-shot figure carries no team class: ${m[1]}`);
    drawn[side]++;
    // THE RELATIONSHIP, which is the thing that was broken. Two tests each
    // pinning its own half would both pass while they disagreed with each other.
    const named = /\b([A-Z]{3})\b/.exec(r.lab);
    if (named) {
      assert.equal(named[1], AB[side],
        `the label says ${named[1]} and the figure wears ${AB[side]}`);
      checked++;
    }
  }
  assert.ok(checked > 0, 'no blocked shot was ever drawn as a figure with a label');

  // THE CLASS IS NOT THE SWEATER. A mutation that fixed the class and left the
  // JERSEY COLOUR as the shooter's survived every assertion above -- which is
  // precisely the symptom Kevin reported, a figure in the wrong team's colours.
  // So the colour is tied to the class here: each side must use exactly one
  // jersey across ALL figures, blocked and unblocked alike, and the two sides
  // must differ. Drawing a blocked shot in the other team's colour puts two
  // jerseys under one side and fails.
  const jerseys = { a: new Set(), h: new Set() };
  for (const r of rows) {
    const m = /<g class="ev fig ([^"]*)"[\s\S]*?<\/g>/.exec(r.ev);
    if (!m) continue;
    const cls = m[1].split(/\s+/);
    const side = cls.includes('a') ? 'a' : cls.includes('h') ? 'h' : null;
    if (!side) continue;
    for (const c of m[0].matchAll(/fill="(#[0-9a-fA-F]{6})"/g)) jerseys[side].add(c[1]);
  }
  const only = s => [...s].filter(c => !jerseys[s === jerseys.a ? 'h' : 'a'].has(c));
  const aOnly = [...jerseys.a].filter(c => !jerseys.h.has(c));
  const hOnly = [...jerseys.h].filter(c => !jerseys.a.has(c));
  assert.equal(aOnly.length, 1, `the away figures use ${aOnly.length} distinct jerseys: ${aOnly}`);
  assert.equal(hOnly.length, 1, `the home figures use ${hOnly.length} distinct jerseys: ${hOnly}`);
  assert.notEqual(aOnly[0], hOnly[0], 'the two sides must not share a sweater');

  // A COUNT DISCRIMINATES WHERE A PREDICATE CANNOT. "The figure has a team
  // class" is satisfied by the shooter's team just as happily. In this game the
  // two sides block different numbers, so drawing the shooter instead of the
  // blocker swaps these totals -- derived from the roster, never typed.
  const want = { a: 0, h: 0 }, shooters = { a: 0, h: 0 };
  for (const e of rich.events) {
    if (e.type !== 'blocked-shot' || e.blk == null) continue;
    const b = rich.roster[String(e.blk)], s = rich.roster[String(e.actor)];
    if (!b) continue;
    want[b.tid === rich.teams.away.id ? 'a' : 'h']++;
    if (s) shooters[s.tid === rich.teams.away.id ? 'a' : 'h']++;
  }
  // THE GUARD THAT MADE THIS TEST HONEST. The first version asserted the two
  // SIDES blocked different amounts, and they do not -- this game is 22-22, so
  // it failed and said so rather than passing vacuously. What separates blocker
  // from shooter is that the two DISTRIBUTIONS differ: 22-22 against 26-18.
  assert.notDeepEqual(want, shooters,
    'blocker and shooter split identically here, so no count can tell them apart');
  assert.deepEqual(drawn, want,
    `figures drawn ${JSON.stringify(drawn)}, blockers are ${JSON.stringify(want)}, `
    + `shooters are ${JSON.stringify(shooters)}`);
});

test('a blocked shot with no blocker recorded stays a dot, not a guess with a face', () => {
  // Four blocked shots in 30,550 carry no blocking player. For those we cannot
  // say whose position the coordinate is, so no figure is drawn -- and this is
  // the one case the reference game cannot exercise, because all 44 of its
  // blocks name a blocker. Constructed rather than hoped for.
  const stripped = JSON.parse(JSON.stringify(rich));
  const target = stripped.events.find(e => e.type === 'blocked-shot');
  assert.ok(target, 'the reference game has a blocked shot to strip');
  delete target.blk;
  const a = boot(stripped);
  const figs = a.every(d => d.$('events').innerHTML)
                .flatMap(h => [...h.matchAll(/<g class="ev fig ([^"]*)"/g)].map(m => m[1]));
  for (const cls of figs) {
    assert.ok(!/\bnull\b|\bundefined\b/.test(cls),
              `a figure was drawn with no team: "${cls}"`);
  }
  // AND THE OTHER BLOCKED SHOTS STILL GET THEIR FIGURE -- otherwise "no figure"
  // would pass by drawing none at all.
  assert.ok(figs.some(c => /\bblkd\b/.test(c)),
            'stripping one blocker must not silence every blocked-shot figure');
});

/**
 * ⭐ THE FIRST FRAME IS A STATE, NOT A PLAY.
 *
 * Kevin, on a BUF @ WSH replay he had just opened: "we identify WSH as 'won the
 * faceoff', even before the game has started." The board read PERIOD 1 · 20:00
 * LEFT -- the clock a period carries before it starts -- and the ice already
 * announced who had won the draw.
 *
 * NOTHING THERE IS FALSE, which is why it survived. The league stamps the
 * opening faceoff at 00:00 elapsed and a real clock reads 20:00 until the puck
 * is dropped, so "won the draw" and "20:00 left" are the league's own record of
 * one instant. What was wrong is that this frame was the RESTING state: the
 * thing a visitor is handed before pressing anything, presented as the state of
 * the world rather than as a play they chose to watch. The page's own headline
 * is "watch first", and it was opening on a result.
 *
 * IT IS THE SAME RULE THE VERDICT CARD ALREADY FOLLOWS -- absent until there is
 * one. build_main.py's comment for that card claimed opening on the faceoff was
 * "the same move", and it was not: the card became absent, the caption did not.
 *
 * The answer was already written down and unreachable. `upto()` has a `k<0`
 * branch, every read of `cur` in `render` is guarded, `drawBoxes(null)` empties
 * both boxes and `periodLabel(null)` returns 'Pre-game' -- all of it dead code,
 * because `set()` clamped the playhead at zero and boot went straight to the
 * first play.
 */
test('the game opens before the first play, and narrates nothing', () => {
  const a = boot();
  assert.equal(a.$('per').textContent, 'Pre-game');
  assert.equal(a.$('clk').textContent, '20:00');
  // THE DEFECT ITSELF is this one line. Everything below is the state that
  // sentence was sitting on top of.
  assert.equal(a.$('labels').innerHTML, '',
               'the ice narrated a play before the viewer asked for one');
  assert.equal(a.$('events').innerHTML, '', 'a mark was on the ice before the first play');
  assert.equal(a.$('puck').innerHTML, '', 'the puck was placed before the draw');
  assert.equal(String(a.$('aSc').textContent), '0');
  assert.equal(String(a.$('hSc').textContent), '0');
  // ⭐ THE PENALTY DISPLAY MOVED TO THE SCOREBOARD (2026-08-27) and stopped
  // being a box that says `empty`: it is ABSENT when nobody is sitting, which is
  // 80.4% of rendered events. So the pre-game claim is now emptiness of the
  // slot, not a class on a box that is always there.
  assert.equal(a.$('penA').innerHTML, '', 'a penalty was served before the game');
  assert.equal(a.$('penH').innerHTML, '', 'a penalty was served before the game');
  // AND IT IS NOT A BLANK PAGE. Both goaltenders are in their creases, so the
  // frame says "about to start" rather than "nothing loaded" -- which is the
  // whole reason to have one. A novice gets two teams, two nets and two
  // directions to read before anything moves.
  assert.ok(a.$('netmen').innerHTML.length > 0,
            'the goaltenders left the ice along with the puck');
  assert.equal(a.$('back').disabled, true, 'there is nothing behind the first frame');
});

test('a link to the opening faceoff still lands on it', () => {
  // THE NINE DOORS. What changed is the ABSENCE of `at=`, never `at=` itself.
  // A learn-page door asks for a moment; if it now landed one frame early the
  // door would open onto an empty rink, which is the failure mode B2 was ruled
  // against for the same reason -- the feature breaking, not a side effect.
  const a = boot(null, null, '?at=1-20:00');
  assert.match(a.$('labels').innerHTML, /Won the faceoff/,
               'an explicit link to 20:00 in the first period stopped showing the draw');
  assert.equal(a.$('per').textContent, 'Period 1');
});

test('the first step forward lands on the opening draw', () => {
  const a = boot();
  a.$('fwd').click();
  assert.match(a.$('labels').innerHTML, /Won the faceoff/);
  assert.equal(a.$('per').textContent, 'Period 1');
  // THE PAIRING IS KEPT, DELIBERATELY. The draw really is won at 20:00, and
  // moving the clock to make the sentence sit better would be inventing a time.
  // What changed is who asked for the frame.
  assert.equal(a.$('clk').textContent, '20:00');
});

test('pressing play starts the hockey, it does not wait out an empty frame', () => {
  // A viewer who presses Play has asked for the game. Resting on the pre-game
  // frame for a full dwell would answer that with 1.8 seconds of empty ice: the
  // opening frame is an orientation, not a countdown.
  const a = boot();
  a.$('play').click();
  assert.match(a.$('labels').innerHTML, /Won the faceoff/,
               'Play left the viewer looking at an empty rink');
});

test('the pre-game frame is not on the timeline — frame zero is still a play', () => {
  // The lazy version of this fix promotes `period-start` into EV. That would put
  // a second empty frame at index 0, shift every index behind it, and move the
  // frames the scrubber addresses. The guard is what frame zero DRAWS rather
  // than how many frames there are: a period-start carries no coordinate, so it
  // can place no puck and write no label, and it would fail both reads here.
  const a = boot();
  const first = a.at(0, d => ({ lab: d.$('labels').innerHTML, puck: d.$('puck').innerHTML }));
  assert.match(first.lab, /Won the faceoff/, 'frame zero stopped being the opening draw');
  assert.match(first.puck, /class="puck/, 'frame zero drew no puck, so it is not a play');
});

test('the hero opens on hockey, never on the pre-game frame', () => {
  // WHAT THIS DOES AND DOES NOT CHECK, because the first version of it checked
  // nothing. It was written to protect a `|| PREVIEW` term in the boot's opening
  // frame, and removing that term left it green: the preview loop sets its own
  // frame synchronously in both branches, so the pre-game state is overwritten
  // before this can ever observe it. The term was deleted as dead.
  //
  // What survives is the claim worth having, and it has a real instrument: the
  // hero must open on a PLAY. Silence the preview loop's opening call and this
  // goes red, because the boot frame underneath it is now the empty rink.
  const a = boot(null, null, '?preview=1');
  assert.notEqual(a.$('per').textContent, 'Pre-game', 'the hero opened on an empty rink');
  assert.ok(a.$('events').innerHTML.length > 0, 'the hero drew no hockey');
});

/**
 * ⭐ WHAT LIBRARY CODE CAN AND CANNOT REACH — B1's first condition, instrumented.
 *
 * CHENG, ruling on as-played ends: `SX` must be made LEXICALLY unreachable from
 * library scope, "not merely unused", because §7.3 measured that it holds by
 * habit and the modules are inlined into one shared scope. A reducer that named
 * `SX` would find it, and a reducer that reads screen coordinates is a reducer
 * whose counts move when the rink flips -- which is the one thing as-played must
 * not be able to do.
 *
 * AUDITED FIRST, AND THE PREMISE WAS HALF WRONG. The modules do share one
 * SCRIPT, but not one SCOPE: build_main.py inlines `__LIB__` ABOVE
 * `function boot(G,RATES){`, and `SX` is a `const` in boot's body. A function
 * declared at top level can never see a binding inside another function's body,
 * whenever it is called. So the guard already exists.
 *
 * WHICH IS EXACTLY WHY IT NEEDED A TEST. A rule nobody has broken is not a
 * guard; it is a habit that has not been tested. This is the instrument, and it
 * is two-sided ON PURPOSE: a probe in library position must throw, AND the same
 * probe inside boot must resolve. Without the second half, "it threw" would be
 * satisfied by a probe that was simply broken -- the mutation-that-measures-the-
 * harness this file has been bitten by before.
 */
const PROBE_AT = 'function boot(G,RATES){';

function probeGlobals() {
  const dom = fakeDom();
  const win = { postMessage: () => {} };
  win.parent = { postMessage: () => {} };
  return { globals: {
    document: dom.document, matchMedia: () => ({ matches: true }),
    setTimeout: () => 1, clearTimeout: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    location: { search: '', origin: 'https://x' }, window: win }, win };
}

test('a library module cannot reach SX — the rink transform is not in its scope', () => {
  assert.equal(SCRIPT.split(PROBE_AT).length - 1, 1,
               'the probe anchor must appear exactly once, or it is being inserted somewhere else');
  const { globals } = probeGlobals();
  // Inserted immediately BEFORE boot, which is where every src/lib module lands.
  const src = SCRIPT.replace(PROBE_AT, 'function __probe(){return SX(0);}\n' + PROBE_AT);
  const probe = bundle(globals, src, '__probe');
  assert.throws(probe, ReferenceError,
    'a module in library position resolved SX — the rink transform leaks into reducer scope, '
    + 'and a reducer that can read screen coordinates is one whose counts move when the rink flips');
});

test('...and the same probe inside boot resolves, so the test above is not passing on a broken probe', () => {
  const { globals, win } = probeGlobals();
  const src = SCRIPT.replace(PROBE_AT, PROBE_AT + 'window.__probe=function(){return SX(0);};');
  const b = bundle(globals, src);
  b(rich);
  assert.equal(typeof win.__probe, 'function', 'the probe was never installed, so this proves nothing');
  // SX(x)=100-x, so the centre-ice line lands at 100 on a 200-wide viewBox.
  assert.equal(win.__probe(), 100,
    'the probe cannot read SX even from inside boot, so the throw above is about the probe, not the scope');
});

/**
 * ⭐ B1 — THE RINK TURNS OVER, AND NOTHING THAT COUNTS MOVES.
 *
 * Two tests, and neither is safe alone. Invariance is trivially satisfied by a
 * flip that does nothing, and "it flipped" is satisfied by a flip that also
 * moved the arithmetic. They are written as a pair on purpose.
 *
 * The reference game's `sides` is {1:left, 2:right, 3:left}. `_norm` rotated the
 * `right` period, so as-played rotates it back and leaves periods one and three
 * alone -- which is what makes this fixture able to express the flip at all, and
 * why the second period is asserted separately from the first and third.
 */
const puckAt = d => {
  const m = /cx="(-?[\d.]+)" cy="(-?[\d.]+)"/.exec(d.$('puck').innerHTML);
  return m ? { x: +m[1], y: +m[2] } : null;
};

function walkRink(search) {
  const a = boot(null, null, search);
  return a.every(d => ({ per: d.$('per').textContent, puck: puckAt(d),
                         nets: d.$('rink').innerHTML.length && d.$('netmen').innerHTML }));
}

test('as-played rotates the periods the arena rotated, and only those', () => {
  const played = walkRink('?ends=as-played');
  const fixed = walkRink('?ends=fixed');
  assert.equal(played.length, fixed.length);

  let rotated = 0, held = 0;
  for (let k = 0; k < fixed.length; k++) {
    const p = played[k], f = fixed[k];
    if (!p.puck || !f.puck) continue;
    if (p.per === 'Period 2') {
      // THE EXACT RELATIONSHIP, NOT MERELY "DIFFERENT". SX(x)=100-x, and the
      // rotation sends x to -x, so SX(-x)=100+x and the two screen positions
      // must SUM to 200. Likewise SY(y)=42.5-y, so the pair sums to 85. A flip
      // that moved a mark anywhere else would satisfy "differs" and fail here.
      assert.equal(p.puck.x + f.puck.x, 200, `frame ${k}: x did not rotate about centre ice`);
      assert.equal(p.puck.y + f.puck.y, 85, `frame ${k}: y did not rotate about centre ice`);
      rotated++;
    } else {
      assert.deepEqual(p.puck, f.puck,
        `frame ${k} (${p.per}) moved, and the feed says that period was not rotated`);
      held++;
    }
  }
  assert.ok(rotated > 20, `only ${rotated} rotated frames — the fixture is not exercising the flip`);
  assert.ok(held > 20, `only ${held} held frames — the control is not being exercised`);
});

test('the ends toggle never reaches a count', () => {
  // THE INVARIANCE CLAIM, END TO END. Not "reducers ignore x" -- `danger` and
  // `goaltending` legitimately read it, on normalized input. The claim is that
  // the MODE is applied at draw time, downstream of every count, so no reducer
  // can see it. Every layer is switched on, because a reducer nobody rendered is
  // a reducer this cannot speak for.
  const walk = search => {
    const a = boot(null, null, search);
    ['lyCorsi', 'lyHd', 'lyGoalie', 'lyWhistle', 'lyBlock'].forEach(id => a.$(id).click());
    return a.every(d => JSON.stringify({
      aSc: String(d.$('aSc').textContent), hSc: String(d.$('hSc').textContent),
      cA: String(d.$('cA').textContent), cH: String(d.$('cH').textContent),
      pa: String(d.$('pa').textContent), ph: String(d.$('ph').textContent),
      nSit: d.$('nSit').textContent,
      goalies: d.$('goaliePanel').innerHTML,
      whistle: d.$('whistlePanel').innerHTML,
      block: d.$('blockPanel').innerHTML,
    }));
  };
  const played = walk('?ends=as-played'), fixed = walk('?ends=fixed');
  assert.equal(played.length, fixed.length);
  assert.ok(played.length > 100, 'the walk must cover the game, not a sample');
  for (let k = 0; k < fixed.length; k++) {
    assert.equal(played[k], fixed[k],
      `frame ${k}: a count moved when the rink turned over, so the mode reached a reducer`);
  }
});

/**
 * ⭐ B1 — THE TRAIL ENDS WITH THE PERIOD, BUT ONLY WHEN THE ENDS DO.
 *
 * A mark says "this team attempted from here". Accumulated on a rink that turns
 * over, one team's attempts pile up at BOTH ends and the picture stops being a
 * shot chart. §5 of docs/ends-switching.md answered this before the flip
 * existed: scope to the period, because the frame ended.
 *
 * The control keeps the whole game, and that is not symmetry for its own sake —
 * one-direction never changed frames, so its whole-game map is exactly what it
 * claims to be, and CHENG's condition 2 keeps that picture because the Control
 * layer has no other one.
 */
function trailPeriods(search) {
  const a = boot(null, null, search);
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
  // The LAST frame of the game: every earlier period is behind it, so if any
  // mark from one survives, this is where it shows.
  const max = +a.$('scrub').max;
  a.$('scrub').oninput({ target: { value: String(max) } });
  const ids = [...a.$('events').innerHTML.matchAll(/data-i="(\d+)"/g)].map(m => +m[1]);
  const per = new Set(ids.map(k => EV_PLAYABLE[k] && EV_PLAYABLE[k].per).filter(Boolean));
  return { per: [...per].sort(), marks: ids.length, label: a.GROUPS['#rg .tbtn']
    .find(b => b.dataset.t === 'all').textContent };
}
// The page's own playable timeline, rebuilt here from the fixture so the test
// can say which PERIOD a `data-i` belongs to without asking the page.
const SKIPPED = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
const EV_PLAYABLE = rich.events.filter(e => !SKIPPED.has(e.type));

test('as-played clears the trail at each period change; the control keeps the game', () => {
  const played = trailPeriods('?ends=as-played');
  const fixed = trailPeriods('?ends=fixed');

  assert.deepEqual(played.per, [3],
    `at the last frame as-played still shows marks from periods ${played.per.join(',')}`);
  assert.deepEqual(fixed.per, [1, 2, 3],
    `the control lost its whole-game map — it shows only ${fixed.per.join(',')}`);
  assert.ok(fixed.marks > played.marks * 2,
    `the control holds ${fixed.marks} marks and as-played ${played.marks}; that is not a whole game`);
});

test('the button says what it does, in each mode', () => {
  // "Keep every mark" is FALSE under as-played. A note explaining a label that
  // contradicts itself is the decaying disclaimer this project prefers an
  // invariant to, so the label states the truth instead.
  assert.match(trailPeriods('?ends=as-played').label, /this period/i);
  assert.match(trailPeriods('?ends=fixed').label, /every mark/i);
});

test('each mode promises only what it delivers', () => {
  const note = search => {
    const a = boot(null, null, search);
    a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
    return a.$('nTrails').textContent;
  };
  const played = note('?ends=as-played'), fixed = note('?ends=fixed');
  assert.match(played, /clears when the teams change ends/i);
  assert.match(played, /shooting the other way/i, 'and says why, in hockey terms');
  assert.doesNotMatch(played, /by the third period/i,
    'as-played promises a whole-game chart it clears three times');
  assert.match(fixed, /by the third period/i, 'the control stopped promising its chart');
});

test('the whistle layer is exempt, because its marks carry no direction', () => {
  // "Play restarted at this dot" is a fact about a PLACE -- no team, no
  // attacking end -- and `marks()` already keys on the arena position, so
  // accumulating across periods counts one physical dot correctly. Scoping it
  // would throw away a true count to be consistent with a rule that does not
  // apply to it.
  const a = boot(null, null, '?ends=as-played');
  a.$('lyWhistle').click();
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  const counts = [...a.$('whistles').innerHTML.matchAll(/class="whn"[^>]*>(\d+)</g)].map(m => +m[1]);
  const total = (a.$('whistles').innerHTML.match(/class="wh[\s"]/g) || []).length;
  assert.ok(total > 5, `only ${total} restart marks survived to the last frame`);
  assert.ok(counts.some(n => n > 2),
    `no dot stacked past 2 (${counts.join(',')}) — the whole-game count did not survive`);
});
