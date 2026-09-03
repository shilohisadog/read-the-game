/**
 * Blocked shots — the same event the control layer already counts, read from the
 * other side of it.
 *
 * WHY THIS LAYER EXISTS, AND IT IS ONE SENTENCE. Over the whole archive —
 * 500,720 attempts in 4,192 games — **51.8% of shot attempts never reach the
 * goalie at all, and 27.7% are blocked by a body.** A novice reading "58
 * attempts" on the scoreboard hears 58 chances; about thirty of them never got
 * there. This layer is that correction, made visible on the ice.
 *
 * WHAT IT DELIBERATELY DOES NOT SHOW, and this is the design decision the layer
 * was built around. The obvious number is "the team that blocked more won X% of
 * the time", and it is not publishable at any sample size. The team that blocks
 * more is the team that ATTEMPTED FEWER 81.7% of the time, and the archive
 * already reports that the attempts leader loses 54.3%. So the reference class
 * for a blocks-leader win rate is "teams that were being outshot", and once
 * that is said honestly the sentence teaches nothing. CHENG's ruling was that it
 * is *uninterpretable, not merely uncertain* — a bigger sample buys precision on
 * a number that still does not mean what a reader will take it to mean.
 * (docs/blocked-shots-layer.md §5, §7.)
 *
 * A SHARE OF A POPULATION IS NOT AN OUTCOME RATE. What ships instead has no
 * winner in it, so there is no causal reading available to misread. That is the
 * whole difference, and `archive.js::attemptMix` states it at the source.
 *
 * THE COORDINATE IS NOT WHERE THE SHOT WAS TAKEN. A blocked shot's (x, y) is the
 * BLOCK POINT — where the puck was stopped, between the shooter and the net, so
 * systematically nearer the net than the shot that produced it. Measured over an
 * 80-game random sample: a median 24.2 ft against 33.4 for a shot on goal, and
 * only 6.1% recorded beyond 50 ft, while the point shot is the most-blocked shot
 * in hockey and the blue line is ~64 ft out. Which is why this layer names the
 * BLOCKER rather than the shooter: the mark is the blocker's position, and a
 * label naming the shooter invites the reading that it is his. The attribution
 * of the ATTEMPT is unchanged and still belongs to the shooter — that is
 * corsi's business and it is correct there.
 */
import { NOT_A_PLAY, inShootout } from '../layer.js';
import { whyNotEven } from '../strength.js';

/**
 * Why an attempt that happened was not blocked. Its own vocabulary, because
 * "not an attempt" is the wrong sentence for a shot that reached the goalie —
 * it was an attempt, and it got through.
 */
const NOT_BLOCKED = {
  goal: 'a goal — it beat every stick and every body in the way',
  'shot-on-goal': 'reached the goalie — nothing stopped it on the way',
  'missed-shot': 'missed the net on its own — wide or high, not blocked',
  hit: 'a hit — physical play, but nothing was shot',
  faceoff: 'a faceoff — possession changes, nothing was shot',
  giveaway: 'a giveaway — losing the puck is not a shot',
  takeaway: 'a takeaway — winning the puck is not a shot',
  penalty: 'a penalty — changes the game, but nothing was shot',
};

export const blocked = {
  id: 'blocked',
  label: '＋ Blocked shots',

  /**
   * @param events  the whole game, in order
   * @param ctx     { roster, homeId, awayId, evenOnly }
   *
   * Returns, beyond the contract:
   *   t          blocks CREDITED to each team — the team that did the blocking,
   *              which is the defending team and therefore NOT `e.own`
   *   teammate   ids where the blocker was on the SHOOTING team
   *   unknown    ids where the blocker cannot be resolved from the roster
   */
  reduce(events, ctx) {
    const { roster, homeId, awayId } = ctx;
    const t = { [homeId]: 0, [awayId]: 0 };
    const counted = [], surprising = [], excluded = [], teammate = [], unknown = [];

    events.forEach((e, id) => {
      /* Before the type question, exactly as corsi does it: a shootout attempt
         can be blocked by type and is not play.

         ⚠️ AND `NOT_A_PLAY` IS A `type`, NOT A `play`. This said `inShootout(e)
         || NOT_A_PLAY[e.type]` where corsi and goaltending say `inShootout(e)`
         alone, so a period start was recorded here as **`play` AND `type`** and
         elsewhere as `type` alone. Measured, because the first version of this
         comment claimed it was `play` INSTEAD of `type` and that was wrong: 51
         of 51 carried both.

         ⭐ SO THIS IS A VOCABULARY FIX, NOT THE FIX. What put those 51 whistles
         and period starts under "Close, but not counted" was the panel
         promoting on the extra `play` — repaired in `isNearMiss`, and repaired
         there whatever this layer records. What is wrong HERE is that `play`
         means outside play altogether, which is the shootout; a period start is
         a different KIND of event, which is what `type` means and what the other
         three layers already called it. A dimension that means one thing in four
         layers and another in the fifth is the drift that fed the defect. */
      const notPlay = inShootout(e);
      const notBlocked = e.type === 'blocked-shot'
        ? null
        : (NOT_BLOCKED[e.type] || NOT_A_PLAY[e.type] || `nothing was blocked (${e.type})`);
      const notEven = ctx.evenOnly ? whyNotEven(e, ctx) : null;

      if (notPlay || notBlocked || notEven) {
        const dims = {};
        if (notPlay) dims.play = notPlay;
        if (notBlocked) dims.type = notBlocked;
        if (notEven) dims.strength = notEven;
        excluded.push({ id, why: notPlay || notBlocked || notEven, dims });
        return;
      }

      counted.push(id);

      // WHO STOPPED IT. `blk` is the blocking player. This comment used to say
      // it was present on 2,599 of 2,599 blocked shots across an 80-game random
      // sample, and reasoned that "always so far" is not "always" -- so an
      // unresolvable blocker is recorded rather than assumed away or silently
      // credited to the defending side.
      //
      // THE CAUTION WAS RIGHT AND THE EVIDENCE WAS NOT. Re-probed over 928
      // extracts covering all 715 dates in the archive: 30,546 of 30,550, and
      // the four exceptions are real -- 2023-10-30, 2025-01-07, 2025-01-14,
      // 2026-01-16, four dates across three seasons. This branch is not
      // hypothetical; it fires in production, and no per-date probe could have
      // found four events in 300,000. See docs/on-the-ice.md section 9.
      const shooter = roster[e.actor], blocker = roster[e.blk];
      if (e.blk == null || !blocker) { unknown.push(id); return; }

      // 7.8% OF BLOCKS ARE BY A TEAMMATE — 202 of 2,599 — and they are real
      // hockey: a point shot hits the winger screening the goalie. The shot is
      // still blocked and still an attempt, but NOBODY DEFENDED IT, so crediting
      // a team here would hand the shooting side a defensive block of its own
      // shot. It is counted, uncredited, and said out loud.
      if (shooter && blocker.tid === shooter.tid) {
        teammate.push(id);
        /* ⚠️ AND THE REASON HAS TO SAY WHAT IT IS COUNTED IN, because it sits
           under a heading that says COUNTED. It read "…so no defender stopped
           this one and neither team is credited with the block" — every word
           true, and read against that heading it says the opposite of it.
           Kevin: "the header says counted."

           ⭐ BOTH HALVES, IN ORDER: a body stopped it, so it IS one of the
           blocks this layer counts; no DEFENDER did, so no club's column gets
           it. That is the whole reason it is filed as surprising rather than
           excluded, and the sentence never said the first half out loud. */
        surprising.push({
          id,
          why: `blocked by a teammate — ${blocker.nm} was in front of his own`
             + ` side's shot. A body stopped it, so it is counted here; but no`
             + ` defender did, so neither club is credited with the block`,
          derivedFrom: `roster[event.blk].tid === roster[event.actor].tid `
                     + `(blk=${e.blk}, actor=${e.actor})`,
        });
        return;
      }

      t[blocker.tid]++;
    });

    return { t, counted, surprising, excluded, teammate, unknown };
  },
};
