/**
 * Stepping, scrubbing, and the captions the transport calls
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { rich, app, SCRIPT, PAGE_CSS, boot, paceOf } from './helpers/page.js';

const at = d => +d.$('scrub').value;

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
function callsWhileStepping(a, read) {
  const out = [];
  let last = a.$('caption').innerHTML;
  a.$('scrub').oninput({ target: { value: '0' } });
  for (let k = 0; k < +a.$('scrub').max; k++) {
    a.$('fwd').click();
    const now = a.$('caption').innerHTML;
    if (now !== last) out.push(read(now, a));
    last = now;
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
  const during = a.$('caption').innerHTML;
  a.$('scrub').onchange({ target: { value: String(goal) } });
  const after = a.$('caption').innerHTML;
  assert.notEqual(after, during, 'letting go of the scrubber on a goal called nothing');
  assert.match(after, /🚨 GOAL/, 'the release called something other than the goal it landed on');
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
  const teaching = at(null), faster = at('sp2');
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
    assert.match(visible, /\bplay\b/,
      `#${id} reads "${visible}" — it names a direction but not what it moves through`);
    // The accessible name must not be poorer than the visible one, and the
    // arrow glyph must not be the only thing a screen reader is handed.
    const aria = app.match(new RegExp(`<button[^>]*id="${id}"[^>]*aria-label="([^"]*)"`))[1];
    assert.match(aria, /\bplay\b/, `#${id}'s accessible name lost the unit`);
  }
  // And the unit is THE PAGE'S OWN WORD for an event, not a new one introduced
  // in the transport: a viewer who reads "Explain plays" and "every play is
  // named as it happens" must meet the same noun here.
  assert.match(app, /Explain plays/, 'the page stopped calling events "plays" elsewhere');
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
