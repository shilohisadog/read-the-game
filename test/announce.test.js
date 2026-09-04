/**
 * ⭐⭐ THE PRECEDENCE LADDER, ASKED DIRECTLY — the half a rendered walk cannot see.
 *
 * `test/fixtures/dom-golden.json` now plays the whole game twice and pins the
 * caption pill through 15 states in the default replay and 29 with the slot layer
 * on. That catches the order CHANGING, and it caught a deliberate reorder at
 * frame 62 while every other walk stayed green. What it cannot do is exercise a
 * collision the reference game does not contain — and **most of them it does
 * not.** A goal that is also a kill frame, a penalty on an offside restart, an
 * icing and a kill on one event: each is legal, each is what the order exists to
 * decide, and the archive is not required to have handed us one.
 *
 * ⭐ That is the whole argument for the extraction, stated as a test file: a
 * function you can call takes any argument, and a page you must boot takes only
 * the game it was given. Every pair below is constructed, because constructing
 * them is now possible.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { announcement, ANNOUNCEMENTS } from '../src/lib/announce.js';

/** A frame that is nothing in particular, plus whichever conditions are named. */
const ask = (e, on = {}) => announcement(e, {
  isIcing: x => !!on.icing && x === e,
  isOffside: x => !!on.offside && x === e,
  isKill: x => !!on.kill && x === e,
  isSlot: x => !!on.slot && x === e,
  slotOn: on.slotOn !== false,
});
const ev = type => ({ type });

test('⭐ each condition alone produces its own announcement', () => {
  assert.equal(ask(ev('goal')), 'goal');
  assert.equal(ask(ev('penalty')), 'penalty');
  assert.equal(ask(ev('faceoff'), { icing: true }), 'icing');
  assert.equal(ask(ev('faceoff'), { offside: true }), 'offside');
  assert.equal(ask(ev('hit'), { kill: true }), 'kill');
  assert.equal(ask(ev('shot-on-goal'), { slot: true }), 'slot');
});

test('⛔ a frame with nothing to say says nothing, and so does no frame at all', () => {
  /* SILENCE IS AN ANSWER AND HAS TO BE ONE. `dwell` reads this to decide how long
     a frame lasts, so a rule that returned something for every event would give
     every ordinary hit a caption's pause and the replay would crawl. */
  assert.equal(ask(ev('hit')), null);
  assert.equal(ask(ev('giveaway')), null);
  assert.equal(announcement(null, {}), null);
  assert.equal(announcement(undefined, {}), null);
});

test('⭐⭐ the whole order, pair by pair, including collisions no game has given us', () => {
  /* ⛔ THIS IS THE POINT OF THE MODULE. Six ranks are fifteen pairs; the
     reference game contains one of them (a kill on a rule restart, once). The
     rest are legal, are what the order exists to decide, and were unreachable
     while this was an `else if` ladder inside a function you had to boot a page
     to run. Asserted as a LADDER rather than fifteen hand-written cases, so a
     rank inserted in the middle is checked against everything on both sides
     rather than against whichever neighbours somebody remembered. */
  const flag = { goal: null, penalty: null, icing: 'icing', offside: 'offside',
                 kill: 'kill', slot: 'slot' };
  const type = { goal: 'goal', penalty: 'penalty', icing: 'faceoff',
                 offside: 'faceoff', kill: 'hit', slot: 'shot-on-goal' };

  for (let hi = 0; hi < ANNOUNCEMENTS.length; hi++)
    for (let lo = hi + 1; lo < ANNOUNCEMENTS.length; lo++) {
      const a = ANNOUNCEMENTS[hi], b = ANNOUNCEMENTS[lo];
      /* The higher rank's event type wins the `type` field; both conditions are
         switched on. A goal that is also a kill frame is one event carrying both. */
      const e = ev(type[a]);
      const on = {};
      for (const k of [a, b]) if (flag[k]) on[flag[k]] = true;
      assert.equal(announcement(e, {
        isIcing: x => !!on.icing && x === e,
        isOffside: x => !!on.offside && x === e,
        isKill: x => !!on.kill && x === e,
        isSlot: x => !!on.slot && x === e,
        slotOn: true,
      }), a, `a frame that is both ${a} and ${b} announced the lower of the two`);
    }
});

test('⭐⭐ …and the ladder is proven to be an ORDER, not six independent tests', () => {
  /* ⚠️ THE PAIRWISE SWEEP ABOVE IS SATISFIED BY A FUNCTION THAT RETURNS THE
     FIRST-LISTED CONDITION IT FINDS — which is what this is, and is also what a
     WRONGLY ordered one would be. So the list itself has to be pinned, or the
     sweep is a mirror of `ANNOUNCEMENTS` and asserts nothing about hockey. This
     is the order as argued, written out, so changing it is a deliberate edit to
     a stated claim rather than a reordering nothing notices. */
  assert.deepEqual(ANNOUNCEMENTS,
    ['goal', 'penalty', 'icing', 'offside', 'kill', 'slot'],
    'the precedence order changed — the argument for it is in announce.js and '
    + 'moving a rank means amending that argument, not this list');
});

test('⭐⭐ the slot speaks only where the slot is drawn, and nothing else is gated', () => {
  /* A RULE IS NOT A METRIC. An icing applies whether or not anyone opted into
     measuring it, so it announces with every layer off. The slot is a region WE
     chose to paint: with the layer off the page has never mentioned it, and a
     pill naming it would answer a question the viewer was never shown.
     ⚠️ AND `dwell` READS THE SAME FLAG THROUGH THE SAME FUNCTION, which is what
     stops a silent frame being PACED as a speaking one. */
  assert.equal(ask(ev('shot-on-goal'), { slot: true, slotOn: false }), null);
  assert.equal(ask(ev('faceoff'), { icing: true, slotOn: false }), 'icing');
  assert.equal(ask(ev('hit'), { kill: true, slotOn: false }), 'kill');
  assert.equal(ask(ev('goal'), { slotOn: false }), 'goal');

  // And a shot that is not from the slot stays silent with the layer ON, which
  // is the other half: the flag gates the rule, it does not replace it.
  assert.equal(ask(ev('shot-on-goal'), { slot: false, slotOn: true }), null);
});

test('⭐ the ladder is asked about ONE event, which is what lets dwell share it', () => {
  /* ⚠️ THE SIGNATURE IS THE SEAM. `captioned` takes one event and nothing else,
     because `dwell(e)` has only an event to give it — a kill depends on the
     PREVIOUS frame, and widening the signature to carry that would have split
     the two readers apart. The conditions arrive pre-computed as predicates over
     the whole game, so this stays a question about one frame. Asserted here
     because it is a property an innocent-looking refactor would take away. */
  assert.equal(announcement.length, 2, 'announcement no longer takes (event, conditions)');
  const e = ev('hit');
  const conditions = { isIcing: () => false, isOffside: () => false,
                       isKill: x => x === e, isSlot: () => false, slotOn: false };
  assert.equal(announcement(e, conditions), 'kill');
  assert.equal(announcement(ev('hit'), conditions), null,
               'the answer depended on something other than the event it was handed');
});
