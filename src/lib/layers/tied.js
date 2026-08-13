/**
 * Control while the score was level — even-strength shot attempts, tied score,
 * regulation only.
 *
 * WHAT THIS MEASURES AND WHY IT IS NARROWED THREE TIMES. Raw shot attempts do not
 * measure control; they measure who was behind. Over a 140-game sample the team
 * with more attempts LOST about 60% of the time, because falling behind is what
 * makes a team shoot. So each exclusion below exists because it changed the
 * answer, not because it felt rigorous:
 *
 *   score level   removes the chasing. This is the whole point: an attempt taken
 *                 while trailing is evidence of the scoreboard, not of play.
 *   even strength an extra skater is not dictating play. Without this the
 *                 ranking partly measured who drew penalties.
 *   regulation    TWO reasons, and "level" here means THE SCORE, never the
 *                 skater count — dropping that subject is what made this comment
 *                 read as a claim that overtime is always even strength, which
 *                 it is not: 8.6% of overtime is a power play.
 *
 *                 One, the score is level throughout overtime, so every overtime
 *                 attempt would land in the "while level" bucket for no reason
 *                 but the game having gone there. Measured over 1,029 overtime
 *                 events: **zero** attempts taken while the score was not level.
 *                 (The 74 untied overtime events are all period-end/game-end,
 *                 the bookkeeping after the winning goal.)
 *
 *                 Two, 3-on-3 PASSES the even-strength test — three equals three
 *                 — so without this the metric would silently mix two different
 *                 games under one label.
 *
 *                 THIS LINE USED TO CARRY A SECOND REASON AND IT WAS WRONG.
 *                 It said regular-season OT runs "at attempt rates far above
 *                 5-on-5", and built the game-type bias argument on top of that.
 *                 Measured over 219 raw feeds (50 reaching overtime):
 *
 *                   regular regulation  24,239 attempts / 12,420 min = 1.95/min
 *                   regular overtime       284 attempts /   143.9 min = 1.97/min
 *                   playoff regulation   1,466 attempts /     720 min = 2.04/min
 *                   playoff overtime       135 attempts /    69.5 min = 1.94/min
 *
 *                 Regular-season overtime runs at 1.01x its own regulation, not
 *                 "far above" it. The STRUCTURAL half of the claim is true and
 *                 measured — regular-season OT is 3-on-3 in 82.3% of events,
 *                 playoff OT is 5-on-5 in 93.8% — but the rate difference the
 *                 exclusion was partly justified on does not exist. An unmeasured
 *                 claim propped up a correct decision, which is the arrangement
 *                 that survives review longest and teaches the least.
 *
 * TWO CONSUMERS, ONE IMPLEMENTATION. builders/measure.mjs ranks the whole archive
 * with this module; the browser can show the same number on a game page. See
 * docs/architecture.md §2 — a Python copy in derive.py was the plan, and the
 * scratch script it grew from opened by promising to "mirror strength.js exactly",
 * which is a claim with no check behind it.
 */
import { corsiTeam } from '../attribution.js';
import { NOT_A_PLAY, NOT_AN_ATTEMPT, inShootout } from '../layer.js';
import { whyNotEven } from '../strength.js';


export const tiedControl = {
  id: 'tied-control',
  label: 'control while the score was level',

  /** The rule, in one sentence, for printing next to the number it produced. */
  rule: 'even-strength shot attempts taken while the score was level, in regulation',

  /**
   * @param events  the whole game, in order
   * @param ctx     { roster, homeId, awayId, homeAb, awayAb }
   *
   * `evenOnly` is NOT a parameter here. Even strength is part of the definition
   * of this measurement, and making it optional would let a caller ask for a
   * number that has this one's name and not its meaning.
   */
  reduce(events, ctx) {
    const { roster, homeId, awayId } = ctx;
    const t = { [homeId]: 0, [awayId]: 0 };
    const counted = [], excluded = [];
    let hs = 0, as = 0;

    events.forEach((e, id) => {
      // THE SCORE IS READ BEFORE IT IS UPDATED. A goal is taken while the game
      // is still level — it is the thing that ends the tie. Applying it first
      // would drop one attempt per lead change and leave a plausible-looking
      // count, which is the kind of error nothing downstream can see.
      const level = hs === as;

      // Before the type question: a shootout goal is a perfectly good attempt BY
      // TYPE, and asking "is this an attempt?" first counts it. That is exactly
      // how the shootout contaminated all three layers once already.
      const notPlay = inShootout(e);
      const team = corsiTeam(e, roster);
      const notAttempt = team == null
        ? (NOT_AN_ATTEMPT[e.type] || NOT_A_PLAY[e.type] || `not an attempt (${e.type})`)
        : null;
      // Regulation only. `pt` is the only field that can say this: period 5 is a
      // shootout in the regular season and a third overtime in the playoffs.
      const notReg = e.pt && e.pt !== 'REG' && e.pt !== 'SO'
        // "LEVEL" MEANS THE SCORE, and this line dropped the subject. Kevin read
        // it as even strength and objected that overtime has 4-on-3 — which is
        // true, 8.6% of overtime is a power play. Both statements are correct
        // about different things, and the copy is what made them collide. If a
        // reader who knows hockey reads it that way, a novice will.
        ? `overtime — the SCORE is level throughout it, so every attempt would `
          + `count; and regular-season overtime is 3-on-3, not 5-on-5`
        : null;
      const notLevel = level ? null
        : `the score was not level — an attempt taken while behind is evidence `
          + `of the scoreboard, not of control`;
      const notEven = whyNotEven(e, ctx);

      // The shootout moves the scoreboard by exactly one, at the end. Counting
      // its goals into the running score would retroactively un-level a game
      // that was tied when every one of its attempts was taken.
      if (e.type === 'goal' && e.pt !== 'SO') (e.own === homeId ? hs++ : as++);

      if (notPlay || notAttempt || notReg || notLevel || notEven) {
        // ALL applicable dimensions, one entry. Picking a single reason hides
        // the others; listing the event once per reason breaks conservation.
        const dims = {};
        if (notPlay) dims.play = notPlay;
        if (notAttempt) dims.type = notAttempt;
        if (notReg) dims.period = notReg;
        if (notLevel) dims.state = notLevel;
        if (notEven) dims.strength = notEven;
        excluded.push({ id, why: notPlay || notAttempt || notReg || notLevel || notEven, dims });
        return;
      }
      t[team]++;
      counted.push(id);
    });

    // Stated from the HOME side, the way a scoreboard reads. A caller comparing
    // two teams must not have to remember which way the sign points.
    return { t, counted, excluded, diff: t[homeId] - t[awayId] };
  },
};
