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
import { boot, rich, PAGE_CSS, HERO_GAME } from './helpers/page.js';
import { NOT_A_PLAY, framed } from '../src/lib/layer.js';

const derive = readFileSync(new URL('../builders/derive.py', import.meta.url), 'utf8');
const appjs = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
/* The game with a goal in reach is the harness's HERO_GAME -- fixture 2024030413
   less its first hit, putting the goal on play 8 (see test/helpers/page.js). */
const early = HERO_GAME;

/**
 * The set literal named in the Python tier, read from the source rather than restated.
 *
 * ⏹ IT MOVED FILES ON 2026-09-30. `PLAYABLE_SKIP` lived in `derive.py` while
 * derive was its only reader; the final horn needing to know what the last PLAY
 * was made `extract.py` a second reader, and derive already imports extract — so
 * the set went to the module that knows what an event means and derive now reads
 * it. This check follows the definition rather than the filename it used to be in.
 */
const pyExtract = readFileSync(new URL('../builders/extract.py', import.meta.url), 'utf8');
function pySet(name) {
  const m = new RegExp(`^${name} = \\{([^}]*)\\}`, 'm').exec(pyExtract);
  assert.ok(m, `extract.py no longer defines ${name} — this check has lost its subject`);
  return new Set([...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]));
}

/* ⭐ AND derive MUST STILL READ IT RATHER THAN RESTATE IT, which is the property
   the move was made to keep. A copy pasted back into derive.py would satisfy
   every assertion below while the two drifted apart again. */
test('the Python tier states what is not a play exactly once', () => {
  assert.match(derive, /^PLAYABLE_SKIP = E\.PLAYABLE_SKIP/m,
    'derive.py defines its own not-a-play set again instead of reading extract.py\'s');
});
const same = (a, b) => a.size === b.size && [...a].every(x => b.has(x));

/**
 * The playable stream, computed HERE from the canonical module — a second path
 * to the frame index that does not run the code under test. If this asked the
 * app which frame the goal was on and then checked the app stopped there, it
 * would be a mirror: the two sides would move together.
 */
const playable = g => g.events.filter(e => e.pt !== 'SO' && framed(e));

test('the builder and the renderer agree on what a play is', () => {
  // derive.py decides which games can be heroes by counting plays.
  // ⏹ And attempts, until 2026-09-17: the loop opened one play before the first
  // attempt. It opens at the faceoff now, derive.py no longer holds the set, and
  // its half of this test left with it.
  // It is Python and the renderer is JavaScript, so the vocabulary is spelled
  // twice — and a builder holding a private idea of what the page plays is how
  // the index and the page come to disagree. Compared against the MODULES, not
  // against a restatement of them in this file.
  assert.ok(same(pySet('PLAYABLE_SKIP'), new Set(Object.keys(NOT_A_PLAY))),
    'derive.py skips different events than src/lib/layer.js calls not-a-play');
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
  /* ⏹ AND THE DERIVATION MOVED UP A LEVEL ON 2026-09-30. app.js builds no set at
     all now: it asks `framed`, layer.js's own predicate, because *is this a
     play* and *does this get a frame* stopped having the same answer at the
     final horn. The property pinned here is unchanged — no private copy of the
     vocabulary in the renderer — and it is pinned one step harder, because a
     predicate cannot be half-restated the way a set can. */
  assert.match(code, /if\(framed\(e\)\)\{EV\.push\(e\)/,
    'the renderer states the not-a-play set itself again instead of deriving it');
  assert.doesNotMatch(code, /const SKIP=new Set\(\[/,
    'a literal not-a-play set is back in the renderer');
});

test('the preview STOPS ON THE GOAL', () => {
  const a = boot(early, null, '?preview=1');
  const EV = playable(early);
  const goal = EV.findIndex(e => e.type === 'goal');
  assert.equal(goal, 8, 'the goal is meant to sit on the hero window\u2019s upper bound, play 8');
  assert.equal(Number(a.$('scrub').value), goal,
    'the hero loop should end on the first goal, not where the budget ran out');
});

test('⭐ a goal beyond the old thirty-second budget is STILL where the loop ends', () => {
  // Kevin, 2026-09-17: "the hero always needs to end with a goal." The search was
  // bounded by BUDGET_MS, so a far goal was never reached and the loop restarted
  // on whatever frame the time ran out. The reference game's first goal is play
  // 73 -- minutes past any budget -- which is what makes it the hard case.
  const a = boot(rich, null, '?preview=1');
  const EV = playable(rich);
  const goal = EV.findIndex(e => e.type === 'goal');
  const budget = Number(/const BUDGET_MS=(\d+)/.exec(appjs)[1]);
  assert.ok(goal * 3600 > budget,
    `the first goal is play ${goal}, inside the budget — this cannot tell a bounded search from an unbounded one`);
  assert.equal(Number(a.$('scrub').value), goal, 'the loop stopped short of the goal');
});

test('and only a game with no goal to stop on runs its budget', () => {
  // The paired half: "it ends on the goal" is satisfied by a loop that always
  // runs to the last frame. With every goal removed there is nothing to stop
  // on, and the loop must end early, inside the budget, not at the game's end.
  const g = { ...rich, events: rich.events.filter(e => e.type !== 'goal') };
  const a = boot(g, null, '?preview=1');
  const at = Number(a.$('scrub').value), EV = playable(g);
  assert.ok(at > 0, 'the preview drew nothing at all');
  assert.ok(at < EV.length - 1, `a goalless loop ran to frame ${at} of ${EV.length} — the budget no longer bounds it`);
});

/* ⭐ AND A SHOOTOUT GOAL IS NOT A GOAL TO STOP ON: it is not a place on the ice,
   and derive.py already skips it. A game whose only goals came in the shootout
   runs its budget rather than looping to the end of the game. */
test('a game whose only goals are in the shootout runs its budget', () => {
  const g = { ...rich, events: rich.events.map(e => e.type === 'goal' ? { ...e, pt: 'SO' } : e) };
  const a = boot(g, null, '?preview=1');
  const at = Number(a.$('scrub').value);
  // THE SCRUBBER'S TIMELINE KEEPS SHOOTOUT EVENTS, so the goal is found on it the
  // way the page finds it -- not through `playable` above, which drops them. A
  // loop that stops anywhere short of the game's end would satisfy "not the last
  // frame"; the claim is that it stops SHORT OF THE GOAL. (A version checking only
  // the last frame stayed green with the shootout exclusion deleted.)
  const onTimeline = g.events.filter(e => !NOT_A_PLAY[e.type]).findIndex(e => e.type === 'goal');
  assert.ok(onTimeline > 0, 'the shootout-marked goal is not on the timeline, so this proves nothing');
  assert.ok(at > 0 && at < onTimeline,
    `the loop ran to frame ${at}, chasing the shootout goal at ${onTimeline}`);
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

/* ⏹ `the attempts derive.py publishes are the attempts the counter reaches` LIVED
   HERE until 2026-09-17. `ha` — the attempts inside the hero loop — fed a hero
   rule about a counter the hero no longer shows; Kevin dropped the rule and the
   field went with it (docs/status.md). */
