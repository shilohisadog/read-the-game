/**
 * THE HERO LOOP: does the front door end on the goal, and does it only end
 * there when there IS one?
 *
 * The homepage preview used to run BUDGET_MS and stop wherever thirty seconds
 * ran out. Kevin: "let's end the hero replay right after the goal ... maybe 10
 * seconds between the start of the replay and the goal". A goal is the only
 * event this renderer gives a real moment to, and a stranger who watches ten
 * seconds of the front door should get it.
 *
 * TWO GAMES, OPPOSITE OUTCOMES. "It ends on the goal" is satisfied by a loop
 * that always ends on the last frame it can reach, and "it runs its budget" is
 * satisfied by a loop that never looks for a goal at all. Neither game alone
 * separates the mechanism from the accident; the pair does.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot, rich, PAGE_CSS } from './helpers/page.js';
import { NOT_A_PLAY } from '../src/lib/layer.js';
import { ATTEMPT_TYPES } from '../src/lib/attribution.js';

const derive = readFileSync(new URL('../builders/derive.py', import.meta.url), 'utf8');
const appjs = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const early = JSON.parse(readFileSync(
  new URL('./fixtures/extracts/2024030413.json', import.meta.url)));

/** The set literal named in derive.py, read from the source rather than restated. */
function pySet(name) {
  const m = new RegExp(`^${name} = \\{([^}]*)\\}`, 'm').exec(derive);
  assert.ok(m, `derive.py no longer defines ${name} — this check has lost its subject`);
  return new Set([...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]));
}
const same = (a, b) => a.size === b.size && [...a].every(x => b.has(x));

/**
 * The playable stream, computed HERE from the canonical module — a second path
 * to the frame index that does not run the code under test. If this asked the
 * app which frame the goal was on and then checked the app stopped there, it
 * would be a mirror: the two sides would move together.
 */
const playable = g => g.events.filter(e => e.pt !== 'SO' && !NOT_A_PLAY[e.type]);

test('the builder and the renderer agree on what a play is, and what an attempt is', () => {
  // derive.py decides which games can be heroes by counting plays and attempts.
  // It is Python and the renderer is JavaScript, so the vocabulary is spelled
  // twice — and a builder holding a private idea of what the page plays is how
  // the index and the page come to disagree. Compared against the MODULES, not
  // against a restatement of them in this file.
  assert.ok(same(pySet('PLAYABLE_SKIP'), new Set(Object.keys(NOT_A_PLAY))),
    'derive.py skips different events than src/lib/layer.js calls not-a-play');
  assert.ok(same(pySet('ATTEMPT_TYPES'), ATTEMPT_TYPES),
    'derive.py counts different events as attempts than src/lib/attribution.js');
  /* ⭐ THE RENDERER'S THIRD STATEMENT IS GONE, AND THIS PINS THAT IT STAYS GONE.
     app.js typed the same five literals; it derives them from `NOT_A_PLAY` now,
     so the two cannot disagree BY CONSTRUCTION rather than by this check
     happening to pass. What is worth asserting is therefore the derivation
     itself — a literal set creeping back is the regression, and it is the shape
     that let a THIRD copy (learn-doors.mjs, counting ordinals over the raw list)
     drift far enough to put two learn cards on one frame.
     ⚠️ COMMENTS STRIPPED FIRST: the note above this line in app.js quotes the old
     literal form, and a scan that cannot tell code from a mention of code is not
     a check about code. */
  const code = appjs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  assert.match(code, /const SKIP=new Set\(Object\.keys\(NOT_A_PLAY\)\)/,
    'the renderer states the not-a-play set itself again instead of deriving it');
  assert.doesNotMatch(code, /const SKIP=new Set\(\[/,
    'a literal not-a-play set is back in the renderer');
});

test('the preview STOPS ON THE GOAL', () => {
  const a = boot(early, null, '?preview=1');
  const EV = playable(early);
  const goal = EV.findIndex(e => e.type === 'goal');
  assert.ok(goal > 0, 'the fixture must contain a goal, or this proves nothing');
  assert.equal(Number(a.$('scrub').value), goal,
    'the hero loop should end on the first goal, not where the budget ran out');
});

test('and a game with no goal in reach still runs its budget', () => {
  // rich.json's first goal is far outside the window (derive.py scores it as no
  // hero at all). The loop must therefore NOT be sitting on a goal — otherwise
  // "stops on the goal" above is satisfied by a loop that stops anywhere.
  const a = boot(rich, null, '?preview=1');
  const EV = playable(rich);
  const at = Number(a.$('scrub').value);
  assert.ok(at > 0, 'the preview drew nothing at all');
  assert.notEqual(EV[at].type, 'goal',
    'this game has no goal in reach, so the loop cannot be ending on one');
  assert.ok(EV.slice(0, at + 1).every(e => e.type !== 'goal'),
    'a goal inside the window would make this fixture the wrong control');
});

test('the last frame is held longer than the goal caption it is showing', () => {
  // The hold and the caption are set in different files and different languages.
  // A hold shorter than the caption cuts the payoff off mid-sentence — and the
  // number is read out of the stylesheet here rather than restated, so moving
  // the animation moves this check with it.
  const cap = /@keyframes cap\{/.test(PAGE_CSS)
    && /\.caption\.on\{animation:cap ([\d.]+)s/.exec(PAGE_CSS);
  assert.ok(cap, 'the goal caption animation is gone — this check has lost its subject');
  const hold = /const GOAL_HOLD_MS=(\d+)/.exec(appjs);
  assert.ok(hold, 'the preview no longer names its hold — this check has lost its subject');
  assert.ok(Number(hold[1]) > Number(cap[1]) * 1000,
    `the loop restarts after ${hold[1]}ms but the caption runs for ${cap[1]}s`);
});

/**
 * ⭐ THE NUMBER THE HEADLINE PROMISES, FROM derive.py TO THE PIXELS.
 *
 * `hl` is a proxy: it counts PLAYS, and the h1 promises "the counts built in
 * front of you" — which is the attempt counter, not the play count. Those come
 * apart. Measured over 300 archive extracts inside the shipped [3, 8] window the
 * counter reaches a median of 3 with a p10 of 2 and a p90 of 5, so one loop
 * length admits both a front door whose number moves five times and one where it
 * moves twice. `ha` is the thing itself, and this is the end of its chain.
 *
 * ⭐⭐ PAIRED WITH test_derive.py's `test_the_published_numbers_for_a_real_game`,
 * WHICH REACHES THE SAME TWO LITERALS DOWN A DIFFERENT PATH. That one is
 * derive.py's arithmetic over the same fixture; this one boots the real renderer
 * and reads the board a visitor would read. They share the literals and nothing
 * else — neither calls the other — so a drift in either language fails here or
 * there rather than moving both sides together. `hl` alone has been guarded that
 * way since it shipped; the second field arrives with the same pair.
 */
test('the attempts derive.py publishes are the attempts the counter reaches', () => {
  const a = boot(early, null, '?preview=1');
  const EV = playable(early);
  const at = Number(a.$('scrub').value);
  // Stated here rather than inherited from the test above: a figure read off
  // "wherever the loop happened to stop" is about a frame, not about the loop.
  assert.equal(EV[at].type, 'goal',
    'the loop must be sitting on its final goal frame or this counts nothing');
  /* ⚠️ `hl` IS NOT `at`, AND THE FIRST DRAFT OF THIS ASSERTED THAT IT WAS.
     `hl` is the DISTANCE from the opening frame to the goal; `at` is the goal's
     absolute index in the playable stream, which is larger by however many plays
     precede the opening frame — 9 against 8 on this fixture. Checking the
     distance here would mean restating the renderer's start rule in the test,
     which is the mirror this file's header refuses. The distance is pinned on
     the Python side; what THIS side can see that Python cannot is the board. */

  /* ⚠️ WHAT THIS FIXTURE'S WINDOW CAN AND CANNOT SEPARATE, STATED RATHER THAN
     IMPLIED. Its eight plays are hit, SHOT, faceoff, hit, SHOT, faceoff, SHOT,
     faceoff, GOAL — three shots on goal and the goal, and no missed or blocked
     shot anywhere in it. So this check cannot tell a counter that honours the
     whole attempt vocabulary from one that counts only shots on goal; a mutation
     removing blocked shots from the reducer leaves it green, which was verified
     rather than assumed. That half is covered synthetically, on the Python side,
     by `test_every_kind_of_attempt_moves_the_counter`. What this one covers is
     the chain: derive.py's number is the number a visitor's board reaches. */
  const shown = Number(a.$('cA').textContent) + Number(a.$('cH').textContent);
  assert.equal(shown, 4,
    `derive.py publishes ha: 4 for this game; the board reaches ${shown}`);
});
