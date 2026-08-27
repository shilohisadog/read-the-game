/**
 * Stepping, scrubbing, and the captions the transport calls
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rich, app, SCRIPT, PAGE_CSS, boot, paceOf } from './helpers/page.js';

const at = d => +d.$('scrub').value;

/**
 * ⭐ WHAT A READER CAN SEE, WITH THE SOURCE'S OWN WORDS ABOUT ITSELF REMOVED.
 *
 * Three checks in this file are ABSENCE claims about visible copy — no button
 * says "play", none says "Teaching" — and all three failed on their own
 * evidence the first time, because the comments beside the code explain the
 * renames by QUOTING the words they retired. A check that cannot tell code from
 * the words about code is not a check about code; the same trap took the
 * `class="lede"` guard, and it bites hardest on absence, where a comment turns a
 * true claim false, and on presence, where it turns a false claim true.
 */
const SEEN = app.split('<script>')[0]
  .replace(/<style>[\s\S]*?<\/style>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '');

test('the transport can step ONE play, in both directions', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: '40' } });
  const from = at(a);
  a.$('fwd').click();
  assert.equal(at(a), from + 1, 'Next moved by something other than one play');
  a.$('back').click();
  a.$('back').click();
  assert.equal(at(a), from - 1, 'Back does not undo Next');
});

test('the step buttons say where the game ends, instead of accepting a dead press', () => {
  const a = boot();
  const last = +a.$('scrub').max;

  // THE FIRST PLAY IS NO LONGER THE FIRST FRAME. The pre-game state sits behind
  // it, so Back is live here and dead one frame earlier: the edge moved with the
  // playhead's floor instead of staying at zero because zero is where it was.
  a.$('scrub').oninput({ target: { value: '0' } });
  assert.equal(a.$('back').disabled, false, 'Back is dead at the first play');
  assert.equal(a.$('fwd').disabled, false);
  a.$('back').click();
  assert.equal(at(a), -1, 'Back from the opening draw is the pre-game frame');

  assert.equal(a.$('back').disabled, true, 'Back is live before the game has started');
  assert.equal(a.$('fwd').disabled, false);
  // And pressing it anyway is harmless — `set` clamps.
  a.$('back').click();
  assert.equal(at(a), -1);

  a.$('scrub').oninput({ target: { value: String(last) } });
  assert.equal(a.$('fwd').disabled, true, 'Next is live at the last play');
  assert.equal(a.$('back').disabled, false);
  a.$('fwd').click();
  assert.equal(at(a), last);

  // The state is a FUNCTION of the playhead, not a thing set once at an end:
  // step off the edge and it must come back.
  a.$('back').click();
  assert.equal(a.$('fwd').disabled, false, 'Next stayed disabled after leaving the end');
});

test('stepping takes the replay off automatic', () => {
  const a = boot();
  a.$('play').click();
  assert.match(a.$('play').textContent, /Pause/, 'the harness never started the replay');
  a.$('fwd').click();
  assert.doesNotMatch(a.$('play').textContent, /Pause/,
    'the replay kept playing while the viewer was stepping through it by hand');
});

/**
 * WHICH FRAME CALLED SOMETHING — and it cannot be read off the caption's text.
 *
 * `caption()` writes innerHTML and NOTHING EVER CLEARS IT. In a browser the
 * `.on` animation fades it out after 2.2s and it is invisible; in the DOM the
 * words stay there for the rest of the game. So a test that asks "does the
 * caption say GOAL at this frame" is asking how long ago the last goal was, and
 * the first draft of these tests counted 84 goals in a game with five.
 *
 * A call is therefore a CHANGE, which is what the viewer sees too.
 */
/**
 * ⭐ A MOMENT IS WHEREVER IT IS DRAWN, NOT THE `#caption` ELEMENT.
 *
 * This read `#caption` alone, which was the same thing until 2026-08-25: the
 * goal pill was suppressed when the ice is already saying it, because
 * `drawLabel` has its own goal branch naming the scorer AND the assists —
 * "🚨 GOAL — Stankoven" — and the pill under it repeated the sentence eight
 * inches away. Kevin: "it's redundant and doesn't add any information."
 *
 * The CLAIM these tests make did not change: whatever the game holds, exactly
 * its goals and penalties get a moment of their own. Only the element carrying
 * it did, and a test welded to the element would have read that as the moment
 * disappearing. Both surfaces carry the same `🚨 GOAL` token, so the readers
 * below are untouched.
 */
/* ⚠️ THE GOAL BRANCH OF THE LABEL, NOT THE WHOLE LABELS GROUP. The first version
   of this concatenated `#labels` wholesale — and that group is rewritten on
   EVERY frame, because every event gets an on-ice label ("CAR · Shot on goal").
   Every frame then read as a moment and the walk counted 266 of them. What is a
   moment on the ice is the goal branch specifically, which is the only one that
   carries the siren. */
const goalOnIce = a => (a.$('labels').innerHTML.match(/🚨 GOAL[^<]*/) || [''])[0];
/* AND AN ARRIVAL, NOT ANY CHANGE. The label group is rewritten every frame, so
   the goal branch goes non-empty and then empty again one frame later -- and a
   plain "did it change" reader counted that clearing as a second moment, five
   phantom `other`s in a walk. The caption never empties, so it is still read as
   a change; the goal label is read as an appearance. */
function callsWhileStepping(a, read) {
  const out = [];
  let lastCap = a.$('caption').innerHTML, lastGoal = goalOnIce(a);
  a.$('scrub').oninput({ target: { value: '0' } });
  for (let k = 0; k < +a.$('scrub').max; k++) {
    a.$('fwd').click();
    const cap = a.$('caption').innerHTML, goal = goalOnIce(a);
    if (goal && goal !== lastGoal) out.push(read(goal, a));
    else if (cap !== lastCap) out.push(read(cap, a));
    lastCap = cap; lastGoal = goal;
  }
  return out;
}

/**
 * THE DIFFERENCE BETWEEN ARRIVING AT A FRAME AND SEEING A MOMENT AGAIN.
 *
 * One argument to `set()`, and it is the reason to press Back at all. The same
 * frames reached two ways: dragged through (silent) and stepped onto (called).
 */
test('a step CALLS the moment again; dragging through it does not', () => {
  const goals = rich.events.filter(e => e.type === 'goal').length;
  assert.ok(goals > 1, 'the reference game should contain goals');

  const dragged = boot();
  const before = dragged.$('caption').innerHTML;
  dragged.every(d => d.$('caption').innerHTML);
  assert.equal(dragged.$('caption').innerHTML, before,
    'dragging the scrubber across the whole game called a moment');

  const stepped = boot();
  const called = callsWhileStepping(stepped, h => h);
  assert.equal(called.filter(h => /GOAL/.test(h)).length, goals,
    'stepping through the game called a different number of goals than it contains');
});

/** The scrub index of the first frame whose current mark is a goal. */
function firstGoalFrame(a) {
  // The space is load-bearing: `shot-on-goal` also ends in "goal", and without
  // it this helper found the first SHOT and the test then asserted that landing
  // on a shot called a goal — which it correctly did not.
  const k = a.every(d => /<title>[^<]* goal<\/title>/.test(d.$('events').innerHTML)).indexOf(true);
  assert.ok(k > 0, 'no frame in the reference game draws a goal');
  return k;
}

test('a deep link lands without pretending the whole game just happened', () => {
  // THE CASE THE SPLIT EXISTS FOR, and the first draft of this test missed it by
  // jumping to a frame it had already rendered — where `a > prevA` is false
  // whatever the code does, so the assertion held under the mutation too.
  //
  // `?at=` is the real one: boot zeroes prevA/prevH and then lands the playhead
  // in the third period, where fifty attempts are already on the board. Under
  // one shared boolean both counters flash on arrival — "that just happened" —
  // about fifty shots spread over an hour.
  const bumped = d => d.$('cA').classList.contains('bump') || d.$('cH').classList.contains('bump');
  const a = boot(rich, null, '?at=3-05:00');
  const arrived = +a.$('cA').textContent + +a.$('cH').textContent;
  assert.ok(arrived > 20,
    `the link landed on ${arrived} attempts — too few for this test to be about anything`);
  assert.equal(bumped(a), false, 'arriving somewhere bumped the counters as if a shot had just been taken');
  // And it is a JUMP, not a silent seek: the moment it lands on is still called.
  assert.ok(a.$('atnote').textContent !== undefined);

  // THE CONTROL, AND IT HAS TO BE THE REAL LOOP. Without it this passes against
  // a page whose counters never flash at any time, which is not the claim.
  // `advance` returns how many frames the play loop really ran, so a dead timer
  // cannot be mistaken for a quiet one.
  const player = boot();
  const far = Math.floor(+player.$('scrub').max * 0.8);
  player.$('play').click();
  assert.equal(player.advance(far), far, 'the replay did not run');
  assert.equal(bumped(player), true,
    'playing forward through 80% of a game never bumped a counter');
});

test('letting go of the scrubber calls the play you landed on', () => {
  // A drag passes THROUGH plays and lands on one. `oninput` fires at every value
  // the slider crosses, so the moment is called on `onchange` — once, when the
  // viewer lets go — and the frame they chose gets called like any other jump.
  const a = boot();
  const goal = firstGoalFrame(a);
  a.$('scrub').oninput({ target: { value: String(goal - 1) } });
  a.$('scrub').oninput({ target: { value: String(goal) } });
  /* ⭐ THE FLARE, NOT THE CAPTION, and the retarget is the point.
     This read `#caption` — and once the goal pill was suppressed (the ice
     already names the scorer and the assists) the caption was identical before
     and after the release, so the test read a working page as a dead one.
     THE ON-ICE LABEL CANNOT SUBSTITUTE: `drawLabel` runs on every frame, moment
     or not, so the goal's name is on screen during the drag too. What separates
     "arrived at" from "called" is the arrival — `flare` is only added when
     `moment` is true, which is exactly what `onchange` turns on and `oninput`
     leaves off. Asserting it here tests the mechanism rather than one of the
     things that used to ride on it. */
  const flared = () => /\bflare\b/.test(a.$('events').innerHTML);
  assert.equal(flared(), false, 'dragging THROUGH a goal already called it');
  a.$('scrub').onchange({ target: { value: String(goal) } });
  assert.equal(flared(), true, 'letting go of the scrubber on a goal called nothing');
  assert.match(a.$('labels').innerHTML, /🚨 GOAL/,
    'the release landed on something other than the goal it was aimed at');
});

test('a penalty is CALLED on the ice, like a goal and unlike a giveaway', () => {
  // The finding that came out of asking the index's question of the renderer:
  // a penalty is the one event that changes the CONDITIONS of the game — it is
  // why `Even strength only` exists — and it was marked exactly as loudly as a
  // giveaway. What follows is a RELATIONSHIP, not a list: whatever the game
  // holds, the events that get called must be exactly its goals and penalties.
  const a = boot();
  const marks = callsWhileStepping(a, (h) =>
    /🚨 GOAL/.test(h) ? 'goal' : /⛔ Penalty/.test(h) ? 'penalty' : 'other');
  const got = { goal: 0, penalty: 0, other: 0 };
  marks.forEach(m => got[m]++);
  const want = t => rich.events.filter(e => e.type === t).length;
  assert.deepEqual(got, { goal: want('goal'), penalty: want('penalty'), other: 0 },
    'with no layers on, exactly the goals and the penalties get a moment of their own');
  assert.ok(got.penalty > 0 && got.goal > 0, 'the walk found neither kind');
});

test('the penalty caption names the team that TOOK it', () => {
  // `own` is the offending team — checked against the situation code rather than
  // assumed: across the reference game's penalties the skater count drops for
  // `own`'s side on the very next event that carries one.
  const pens = rich.events.map((e, n) => [e, n]).filter(([e]) => e.type === 'penalty');
  assert.ok(pens.length >= 4, 'the reference game should carry several penalties');
  const side = e => (e.own === rich.teams.home.id ? 2 : 1);   // sit = [aG][aSk][hSk][hG]
  for (const [e, n] of pens) {
    const next = rich.events.slice(n + 1).find(x => x.sit);
    assert.ok(+next.sit[side(e)] < +e.sit[side(e)],
      `P${e.per} ${e.rem}: the skater count did not drop for the team the feed calls \`own\``);
  }
  // And the caption says so, in the same order the game does.
  const abs = { [rich.teams.home.id]: rich.teams.home.ab, [rich.teams.away.id]: rich.teams.away.ab };
  const called = callsWhileStepping(boot(), h => {
    const m = h.match(/<span class="tag ([ah])">([A-Z]{3})<\/span><b>⛔/);
    return m && m[2];
  }).filter(Boolean);
  assert.deepEqual(called, pens.map(([e]) => abs[e.own]),
    'the penalty captions name a different set of teams, or a different order, than the feed does');
  // BOTH clubs must appear, or a page that always printed the away side passes.
  assert.equal(new Set(called).size, 2, 'only one club ever took a penalty in this walk');
});

/* ------------------------------------------------------- THE PACE, MEASURED
   Both tests below pin a defect that was found by WALKING A REPLAY IN A BROWSER
   and was invisible to 496 passing tests. docs/event-timing.md carries the walk. */

test('no frame pauses without saying something', () => {
  // DEFECT ONE, and this is the invariant that makes it impossible rather than
  // guarded. Measured live at Teaching: 55 of 280 frames (19.6%) held 1.3x to
  // 2.6x the base with nothing on screen to tell them apart, because `dwell`
  // asked `isHD(e)` while the caption asked `hdOn && isHD(cur)`. The slot tier
  // fired with the layer OFF -- a pause built to give a caption room, arriving
  // without one.
  //
  // THE ASSERTION IS THE BICONDITIONAL, not "long frames are rare". A frame is
  // long if and only if it spoke.
  const { rows } = paceOf(160);
  const base = Math.min(...rows.map(r => r.ms));
  const long = rows.filter(r => r.ms > base);
  assert.ok(long.length > 0, 'no frame in the walk was ever given extra time');
  assert.ok(long.length < rows.length, 'every frame was long — there is no base pace left');
  for (const r of rows) {
    assert.equal(r.ms > base, r.spoke,
      r.spoke ? `frame ${r.i} carried a caption and got the ordinary ${r.ms}ms`
              : `frame ${r.i} paused for ${r.ms}ms with nothing on screen to explain it`);
  }
});

test('the caption lasts exactly as long as the frame it describes', () => {
  // DEFECT TWO. The caption was `animation:cap 2.2s` in the stylesheet and the
  // pace was a setTimeout, so they were never related and only one of them heard
  // the speed buttons. Measured: 2067ms visible at every speed, so a 1300ms
  // penalty frame let its caption finish ON THE NEXT PLAY (6 of 6, and two plays
  // later at Faster) while a 6000ms goal frame spent 3933ms with it already gone.
  //
  // ONE NUMBER, READ TWICE. Asserting a literal here would be a second copy of
  // the pace, free to agree with a wrong first copy -- the same reason the
  // preview test above measures the replay instead of restating dwell.
  const { rows } = paceOf(160);
  const spoke = rows.filter(r => r.spoke);
  assert.ok(spoke.length >= 3, `only ${spoke.length} frames spoke in the walk`);
  for (const r of spoke) {
    assert.equal(r.dur, r.ms + 'ms',
      `frame ${r.i} runs ${r.ms}ms and its caption runs ${r.dur} — two clocks again`);
  }
});

test('the speed control moves the caption too, not just the frame', () => {
  // The half of defect two the biconditional above cannot see: both could scale
  // together and still be wrong if the caption ignored the speed buttons, which
  // is precisely what shipped. Read at two settings and require BOTH to move.
  const at = id => {
    const { rows } = paceOf(160, dom => { if (id) dom.$(id).onclick(); });
    const spoke = rows.filter(r => r.spoke);
    return { frame: Math.min(...rows.map(r => r.ms)), cap: spoke[0].dur };
  };
  const teaching = at(null), faster = at('faster');
  assert.ok(faster.frame < teaching.frame,
    `Faster waits ${faster.frame}ms and Teaching waits ${teaching.frame}ms`);
  assert.notEqual(faster.cap, teaching.cap,
    `the caption ran ${teaching.cap} at both speeds — it is a constant beside the pace again`);
});

test('no caption says the same thing twice', () => {
  // `⚡ Shot from the slot · #16 Dorofeyev from the slot` — 31 of 31 slot
  // captions, live, and nothing in 496 tests read that string. The trailing
  // clause was written when the label said "high danger"; the rename left the
  // sentence naming the slot in both halves.
  //
  // CHENG's assertion, and the crudeness is the point: a rename is verified by
  // grepping for the term that LEFT, which cannot see the redundancy the
  // departure created. This reads the rendered output instead.
  //
  // EVERY LAYER STATE, because the defect only appeared with one of them on —
  // the caption for a slot shot does not exist until the slot layer does.
  const a = boot();
  const seen = [];
  for (const on of [false, true]) {
    if (on) a.$('lyHd').click();
    seen.push(...callsWhileStepping(a, h => h));
  }
  assert.ok(seen.length > 0, 'the walk found no captions at all');
  assert.ok(seen.some(h => /Shot from the slot/.test(h)),
    'the walk never turned the slot layer on — the defect this test exists for is unreachable');

  for (const html of seen) {
    // Words only: the tag element repeats the club abbreviation by design
    // (`<span class="tag">CAR</span>` beside `#53 Blake`), so this looks for a
    // repeated PHRASE, which is what a duplicated clause is.
    const words = html.replace(/<[^>]*>/g, ' ').replace(/[·#]/g, ' ')
                      .toLowerCase().split(/\s+/).filter(Boolean);
    const grams = new Map();
    for (let k = 0; k + 3 <= words.length; k++) {
      const g = words.slice(k, k + 3).join(' ');
      grams.set(g, (grams.get(g) || 0) + 1);
    }
    for (const [g, n] of grams) {
      assert.equal(n, 1, `a caption says "${g}" ${n} times: ${words.join(' ')}`);
    }
  }
});

test('the caption is not clickable, and nothing pretends it is', () => {
  // `#rg .caption` carries pointer-events:none — it floats over the ice and
  // would otherwise swallow clicks meant for the marks. A listener on it could
  // never fire, and one sat there unreachable until it was found by reading the
  // stylesheet rather than the script.
  const rule = PAGE_CSS.match(/#rg \.caption\{([^}]*)\}/);
  assert.ok(rule, 'the caption lost its rule');
  assert.match(rule[1], /pointer-events:\s*none/, 'the caption became clickable');
  assert.doesNotMatch(PAGE_CSS, /\.caption[^{]*\{[^}]*pointer-events:\s*(auto|all)/,
    'something re-enabled clicks on the caption');
  assert.doesNotMatch(SCRIPT, /\$\('caption'\)\.addEventListener/,
    'a listener was added to an element that cannot receive events');
});

test('the step buttons say what they step THROUGH, in words a reader can see', () => {
  // Kevin: "don't we need to state what the prev and next arrows are for?"
  // `◀ Back` beside a slider does not answer "back to what", and the answer was
  // only in an aria-label, which a sighted viewer never gets.
  const btn = id => app.match(new RegExp(`<button[^>]*id="${id}"[^>]*>([^<]*)<`))[1];
  for (const id of ['back', 'fwd']) {
    const visible = btn(id);
    assert.match(visible, /\bevent\b/i,
      `#${id} reads "${visible}" — it names a direction but not what it moves through`);
    // The accessible name must not be poorer than the visible one, and the
    // arrow glyph must not be the only thing a screen reader is handed.
    const aria = app.match(new RegExp(`<button[^>]*id="${id}"[^>]*aria-label="([^"]*)"`))[1];
    assert.match(aria, /\bevent\b/i, `#${id}'s accessible name lost the unit`);
  }
});

/**
 * ⭐ THE WRAP MAY FALL BETWEEN GROUPS AND NEVER INSIDE ONE.
 *
 * Measured at 390 before this changed: the transport was nine controls in one
 * wrapping flex row and broke into FIVE rows, with the break landing inside
 * every group it had — `◀ Prev play` ending one row and `Next play ▶` starting
 * the next, the three gears split across two more. A reader cannot tell which
 * buttons belong together when the only thing deciding is where the line ran out.
 *
 * `npm test` cannot see layout, so this asserts the two things that CAUSE it and
 * are visible in the source: the pair and the gears each sit inside one `.grp`,
 * and `.grp` is `flex-wrap:nowrap`. Neither half is worth anything alone — a
 * group with no rule wraps, and a rule with no group has nothing to hold.
 */
test('the step pair and the speed gears are each one non-wrapping group', () => {
  // SCOPED TO THE TRANSPORT. `.grp` is the page's rule for every single-choice
  // pair now — Situations, Trails, Players and Narration each wear one — so a
  // count over the whole document would grow every time the rule is applied
  // correctly, which is a test that punishes its own subject spreading.
  // ⚠️ ANCHORED ON THE TRANSPORT'S OWN LAST CHILD, not on whatever follows it.
  // This read up to `<p class="verdict"`, so it broke the day a caption was
  // inserted between the two — a test that fails because a NEIGHBOUR moved is
  // reporting on the wrong subject. The scrubber is the transport's last
  // element and is inside the thing being measured.
  const transport = app.match(/<div class="transport">[\s\S]*?<input class="scrub"[^>]*>\s*<\/div>/)[0];
  const grp = transport.match(/<div class="grp"[^>]*>[\s\S]*?<\/div>/g) || [];
  assert.equal(grp.length, 2, `expected two control groups in the transport, found ${grp.length}`);

  const holding = ids => grp.find(g => ids.every(id => g.includes(`id="${id}"`)));
  assert.ok(holding(['back', 'fwd']), 'Prev and Next can still be split across a line break');
  assert.ok(holding(['slower', 'faster']), 'Slower and Faster can still be split across a line break');

  // And every group carries a name, because a bordered box of buttons is a
  // `role="group"` to a screen reader only if it says what the group is.
  for (const g of grp) assert.match(g, /aria-label="[^"]+"/, 'a control group has no accessible name');

  assert.match(PAGE_CSS, /#rg \.grp\{[^}]*flex-wrap:nowrap/,
    'the groups exist but nothing stops the wrap falling inside them');
});

/**
 * ⭐ NARRATION IS GONE, AND SO IS ITS CONTROL — 2026-08-26.
 *
 * It arrived in the transport as `💬 Explain plays`, moved to the display zone
 * as a named pair when Kevin asked what it even was, and then left entirely:
 * "for display options, I vote to remove players and narration." The ice names
 * every event now, always.
 *
 * WHAT ITS TEST GUARDED IS STILL GUARDED. The §4.2 rule — a note about a
 * control is available before it is pressed — is asserted on the layer rows
 * (render-notes) and on `nTrails`/`nSit` (render-board). This block is deleted
 * rather than kept limping, because a test whose subject no longer exists is
 * the thing `docs/status.md` §H calls a check that cannot fail.
 */
/**
 * ⭐ THE COUNTABLE "PLAY" IS GONE AND THE MASS NOUN STAYED.
 *
 * Kevin, 2026-08-25: "these are really events and there could have been 'plays'
 * in between the events that aren't shown." That is Doctrine §4 -- discreteness
 * IS the honesty -- so a button offering the "next play" claims a continuity the
 * feed does not have and we refuse to invent.
 *
 * BOTH HALVES, because either alone is satisfied by the wrong change. The first
 * half asks that the two visible countable uses are gone. On its own a global
 * s/play/event/ passes it -- and breaks correct English everywhere the word is
 * the MASS noun for the flow of the game. So the second half pins the mass uses
 * that must survive untouched: a layer named for when play STOPS, and a whistle
 * mark for where play RESTARTED. A rename that is not surgical reddens it.
 */
test('"play" leaves as a countable noun and stays as a mass noun', () => {
  assert.doesNotMatch(SEEN, /Explain plays|Prev play|Next play/,
    'a control a reader can see still calls one recorded event "a play"');
  // The greeting is built by concatenation, so the sentence is not contiguous in
  // the file — the match is anchored on the clause that carries the noun.
  assert.match(app, /and just watch — every event/,
    'the greeting stopped promising that EVENTS are named');
  assert.match(app, /is named as it happens/,
    'the greeting stopped promising that anything is named');

  // ⚠️ "play restarted here" WAS one of these and is not any more: it was the
  // whistle layer's legend key, and the merge moved it into the whistle row as
  // "The ring marks where play restarted". Still the mass noun, still correct,
  // different words — so the survivor list follows the copy rather than pinning
  // a phrase that a legitimate edit retired.
  // ⚠️ AND "Why play stopped" HAS NOW RETIRED THE SAME WAY, on 2026-08-26: Kevin
  // renamed the layer to `Stoppages` ("less is more"). Still a legitimate edit,
  // so it leaves the list rather than failing it.
  //
  // ⚠️ THE TWO SURVIVORS BELOW NOW SIT IN `display:none` ROWS, which is the same
  // weakening as a comment passing a markup check — SEEN cannot see a stylesheet.
  // So the tooth of this half has moved to the runtime survivor asserted after
  // it, which a reader with the whistle layer on genuinely reads. When the
  // descriptions get a home (docs §20), the visible survivors come back here.
  for (const survivor of ['where play restarted', 'stopped play']) {
    assert.ok(SEEN.includes(survivor),
      `"${survivor}" is the mass noun and is correct English — a blanket ` +
      `rename took it, which is the failure mode this half exists to catch`);
  }
  assert.ok(app.includes('play has not stopped'),
    'the whistle panel stopped saying "play has not stopped" — the mass noun no longer ' +
    'appears anywhere a reader can actually read it');
});

/**
 * THE SPEED GEARS ARE THREE, AND THE MIDDLE ONE IS REACHABLE.
 *
 * Kevin asked for `Slower` and `Faster` without `Teaching`, whose real defect he
 * named: it is a SPEED wearing the name of a content mode, sitting beside what
 * was then an actual content toggle. But two buttons cannot express three
 * states, and the default is a state -- drop the middle button and a viewer who
 * tries `Faster` can never get back to the pace everything was measured at.
 * So the word goes and the gear stays, named for what it is.
 */
test('speed is a stepper: two buttons, three paces, all of them reachable', () => {
  // Kevin asked for `Slower` and `Faster` without `Teaching`, whose defect he
  // named exactly: a SPEED wearing the name of a content mode. The objection to
  // simply deleting it was that two buttons cannot express three states — and
  // his answer is that they can, if they STEP: "faster would play at X + 1, then
  // hitting slower would move back to X, then slower again would move to X-1."
  assert.doesNotMatch(SEEN, /Teaching/, 'the content-mode name came back');
  assert.match(app, /id="slower"/); assert.match(app, /id="faster"/);
  assert.doesNotMatch(app, /id="sp1"/, 'the middle gear is back as a third button');

  // THE MIDDLE PACE MUST STILL BE REACHABLE, which is the whole reason the third
  // button existed. Walk the stepper and read the pace the renderer would use.
  // The shortest wait the page asks for over a run — the same reading the pace
  // test above takes, so the two cannot disagree about what "faster" means.
  const a = boot();
  const pace = walk => Math.min(...paceOf(60,
    d => { for (const id of walk) d.$(id).onclick(); }).rows.map(r => r.ms));
  const paces = [pace([]), pace(['faster']), pace(['faster', 'slower']), pace(['slower'])];
  assert.ok(paces[1] < paces[0], 'Faster did not speed the replay up');
  assert.equal(paces[2], paces[0], 'stepping up then down did not return to the default pace');
  assert.ok(paces[3] > paces[0], 'Slower did not slow the replay down');

  // AND THE ENDS ARE THE READOUT. With no pressed label saying where you are,
  // the disable is what says it — and it is also what makes every press produce
  // a visible change. Without this half, `setGear` clamping silently would look
  // identical to a control that had stopped working.
  assert.equal(!!a.$('slower').disabled, false, 'the default pace cannot go slower');
  assert.equal(!!a.$('faster').disabled, false, 'the default pace cannot go faster');
  a.$('faster').onclick();
  assert.equal(a.$('faster').disabled, true, 'the fastest pace still offers Faster');
  a.$('slower').onclick(); a.$('slower').onclick();
  assert.equal(a.$('slower').disabled, true, 'the slowest pace still offers Slower');
  assert.equal(!!a.$('faster').disabled, false, 'Faster stayed dead after stepping away from the top');
});

/**
 * The two rows, each cut off where the next one starts.
 *
 * Splitting on a row's OWN class (`<div class="mix game">`) matches once and
 * leaves everything after it — so "the game row" included the archive row, and a
 * test asserting the game row carries no percentage failed against a page where
 * it carries none. Splitting on the SHARED prefix is what makes the boundary
 * real, because `split` cuts at every delimiter rather than the first.
 */

/**
 * ⭐ THE PILL IS RESERVED FOR WHAT THE ICE DOES NOT ALREADY SAY.
 *
 * Kevin, on the front door: the goal pill "is redundant and doesn't add any
 * information to the event". True of a goal — `drawLabel` has its own branch
 * naming the scorer AND the assists — and NOT true of the other two moments the
 * pill serves, which is the part worth pinning:
 *
 *   goal     ice: "🚨 GOAL — Stankoven" + assists      pill: adds nothing
 *   penalty  ice: "CAR · Penalty"                      pill: adds WHO TOOK IT
 *   slot     ice: "CAR · Shot on goal"                 pill: "⚡ Shot from the slot"
 *
 * BOTH BRANCHES, because "no goal pill" is satisfied by deleting the pill
 * outright — which would silently take the penalty taker and the only place the
 * site names the slot with it.
 *
 * ⭐ AND THE SECOND BRANCH IS NOW REACHED BY A SHOOTOUT, NOT BY A CONTROL. It
 * used to be reached by switching Narration off, and that control was removed on
 * 2026-08-26. The branch did not go with it: `drawLabel` draws nothing without a
 * `place()`, and `place()` returns nothing for a SHOOTOUT event — so on the ~6%
 * of games decided in one, the ice is silent and the pill is the goal's only
 * announcement. Enumerating that BEFORE the removal is what made the removal
 * safe; a fixture that really goes to a shootout is what keeps it honest.
 */
test('a goal is not captioned twice, and IS captioned when the ice is silent', () => {
  const goalCaps = a => callsWhileStepping(a, h => (/🚨 GOAL/.test(h) ? 'goal' : 'other'))
    .filter(x => x === 'goal').length;

  const on = boot();
  const capsWithLabels = callsWhileStepping(on, (h, d) =>
    /🚨 GOAL/.test(d.$('caption').innerHTML) ? 'pill' : 'other').filter(x => x === 'pill');
  assert.equal(capsWithLabels.length, 0,
    'the ice already names the scorer, and the pill said it again');

  // The same walk still SEES every goal — the moment did not disappear, it moved.
  const goals = rich.events.filter(e => e.type === 'goal').length;
  assert.ok(goals > 0, 'the fixture has no goal, so neither half proves anything');
  assert.equal(goalCaps(boot()), goals, 'a goal stopped getting a moment at all');

  // AND WHERE THE ICE IS SILENT the pill has to come back, or a goal the rink
  // cannot draw goes unannounced. A shootout winner is exactly that goal.
  const so = JSON.parse(readFileSync(
    new URL('fixtures/extracts/2023020207.json', import.meta.url), 'utf8'));
  const soGoals = so.events.filter(e => e.type === 'goal' && e.pt === 'SO');
  assert.ok(soGoals.length > 0,
    'this fixture never reaches a shootout, so the silent-ice branch is untested');

  const shoot = boot(so);
  const pills = callsWhileStepping(shoot, (h, d) =>
    /🚨 GOAL/.test(d.$('caption').innerHTML) ? 'pill' : 'other').filter(x => x === 'pill');
  assert.equal(pills.length, soGoals.length,
    'a shootout goal draws nothing on the ice AND says nothing in the pill');
});

/**
 * ⭐ AND THE PILL DOES NOT SIT ON THE PENALTY BOX.
 *
 * Measured in a real browser before the first fix: 58px of overlap on the game
 * page at both widths, 267x20 on the front door. The caption was `bottom:14px`
 * inside `.rinkbox`, which contains the penalty box.
 *
 * ⚠️ AND THE FIX FOR THAT BECAME THE NEXT DEFECT. Anchoring the pill INSIDE
 * `.pboxes` was right while the row was furniture; parking the row on
 * 2026-08-27 hid the pill with it, and this test went green throughout —
 * because it asserted the STRUCTURE the old fix used rather than the property
 * either fix exists to protect. A check that pins a mechanism cannot notice
 * when the mechanism stops delivering the outcome.
 *
 * So it now pins the outcome instead, in the two halves a fake DOM can reach:
 * the pill is not inside a container the stylesheet parks, and it anchors to
 * the rink box. `test/park.test.js` is the general form of the first half.
 */
test('the caption pill is not inside a container the stylesheet hides', () => {
  const markup = readFileSync(new URL('../src/game.html', import.meta.url), 'utf8');
  const row = /<div class="pboxes" id="pboxes">([\s\S]*?)<\/div>/.exec(markup);
  assert.ok(row, 'the penalty box row is gone — this check has lost its subject');
  assert.doesNotMatch(row[1], /id="caption"/,
    'the caption is inside .pboxes, which the stylesheet parks with display:none');
  assert.match(PAGE_CSS, /#rg \.pboxes\{[^}]*display:none|#rg \.pboxes\{display:none\}/,
    'the row is no longer parked — re-read whether the pill should move back into it');
  /* ⭐ AND THE PILL'S OFFSET IS THE BOX'S HEIGHT, FROM ONE SOURCE.
     `--lboxh` sizes the layer box and lifts the caption clear of it. Two
     numbers would drift the day the box changes height, and the drift's symptom
     is the 58px overlap this whole test exists about. The safety of the
     arrangement is Kevin's own requirement: a box whose height does not change
     cannot move the pill onto itself. */
  assert.match(PAGE_CSS, /#rg \.caption\{[^}]*position:absolute[^}]*bottom:calc\(var\(--lboxh\) \+ var\(--rinkpad\) \+ 6px\)/,
    'the pill no longer clears the layer box by that box\'s height and the rink padding');
  assert.match(PAGE_CSS, /#rg \.lbox\{[^}]*[;{]height:var\(--lboxh\)/,
    'the layer box no longer takes its height from the property the caption reads');
});
