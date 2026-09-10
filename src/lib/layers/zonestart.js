/**
 * Zone starts — where each run of play began, and who won the draw there.
 *
 * ⭐ THE MARK NEEDS NO THRESHOLD, WHICH IS RARE ON THIS SITE. Every faceoff sits
 * on a painted dot: over a stratified 224-game sample, 2,388 of 2,388 draws land
 * on exactly nine positions — three distinct `(|x|,|y|)` pairs, which are the
 * four end-zone dots, the four neutral-zone dots and centre ice. There is nothing
 * to derive, no radius to choose, and A READER CAN CHECK THE MARK AGAINST THE
 * PAINT. That is the same property that made the slot shading defensible, and it
 * is why this was the most finished idea on `docs/layer-ideas.md`.
 *
 * ⭐⭐ AND THE LESSON IS ALREADY MEASURED OVER THE WHOLE ARCHIVE, which almost
 * nothing else here can say on the day it ships. `measures.json`'s
 * `census.endZone`, over **165,420 end-zone draws**:
 *
 * The attacking club's shot attempts before the next whistle, PER DRAW:
 *
 *     having WON the draw                                 1.683
 *     having LOST it                                      1.163
 *     what winning is worth, therefore                    0.52
 *
 * ⛔⛔ AND THE OBVIOUS SENTENCE IS AN OVER-CLAIM, which this file shipped for a
 * day. *"Where the draw is taken is worth 2.2x what winning it is"* reads as a
 * PLACE effect measured against not being there — and this table has no such
 * baseline. It fixes the END and varies only the winner; there is no neutral- or
 * defensive-zone comparison anywhere in it. `zoneWorth` is a LEVEL and
 * `winningWorth` is a DIFFERENCE, and writing both with a `+` is what made a
 * reader parse it as *losing gets you more*. Kevin, from the live page: *"even I
 * can't quite figure out what we're trying to say."*
 *
 * ⭐ WHAT IT DOES SUPPORT IS A DECOMPOSITION OF ONE NUMBER: of the 1.683 an
 * attacking club gets from an offensive-zone draw, 1.163 arrives whether or not
 * it wins, and THAT part is 2.2x the 0.52 winning adds. Same ratio, and a claim
 * the measurement can carry.
 *
 * ⛔ THE COMPARISON IS THE LAYER'S REASON FOR EXISTING, and CHENG made it a
 * condition: the mark shows both the place and the winner, and the caption states
 * the ratio. *"Showing the winner without the comparison is where it would become
 * who took it"* — a different and much weaker lesson, since who wins draws is the
 * archive's cleanest null at 50.4%.
 *
 * ⭐ AND IT EXPLAINS THAT NULL, which is the best thing this layer does. Winning
 * faceoffs predicts nothing over a season because the season total ADDS UP
 * QUANTITIES WITH OPPOSITE SIGNS: the uncontrolled table reads 2.395x in the
 * offensive zone and 0.712x in the defensive, so a club that wins more draws in
 * both has gained in one and lost in the other.
 *
 * ⛔ THE UNCONTROLLED TABLE MAY NOT BE QUOTED ON A SURFACE, and `census.js` says
 * why in its own words: the same physical draw lands in the O row or the D row
 * DEPENDING ONLY ON WHO WON IT, so `faceoffZone` cannot separate *being there*
 * from *winning there*. `endZone` fixes the end and splits by winner, which is
 * the version a sentence may use.
 *
 * WHAT THE FEED GIVES US, and it is less than it looks:
 *
 *   `own` is the club that WON the draw and `actor` is the player — both on
 *   100% of faceoffs. **`losingPlayerId` is a field `extract.py` drops**, so the
 *   centre who lost cannot be named. A draw therefore has one club and never
 *   two, which is why this layer credits rather than compares.
 *
 *   the zone is NOT a feed field. `zone` exists on penalties only; everything
 *   else is derived from `x` — and that is better, because `BLUE_LINE_X` is the
 *   same constant the blue-line band is painted from.
 */
import { NOT_A_PLAY, inShootout } from '../layer.js';
import { whyNotEven } from '../strength.js';
import { attackDirection, attackZone } from '../rink.js';


/** What a non-faceoff event is, said in the layer's own vocabulary. */
const NOT_A_DRAW = {
  'shot-on-goal': 'a shot, not a faceoff',
  'blocked-shot': 'a shot, not a faceoff',
  'missed-shot': 'a shot, not a faceoff',
  goal: 'a goal, not a faceoff',
  hit: 'a hit, not a faceoff',
  giveaway: 'a giveaway, not a faceoff',
  takeaway: 'a takeaway, not a faceoff',
  penalty: 'a penalty, not a faceoff',
  stoppage: 'the whistle that caused a draw, not the draw itself',
};

export const zonestart = {
  /**
   * ⭐ WHAT THIS LAYER COUNTS, AND HOW IT CREDITS IT — the layer's own words,
   * per CHENG's ruling that the layer owns what it counts and the page owns how
   * that reads.
   */
  counts: 'every faceoff, and for the club that won it, whether that draw was in its offensive zone, the neutral zone, or its defensive zone',
  credits: 'Each draw is credited to the club that won it, in the zone that club was attacking toward — so the same dot is an offensive-zone start for one club and a defensive-zone start for the other. The league records the winner and not the loser, so a draw has one club and never two.',
  id: 'zonestart',
  label: '＋ Zone starts',

  /**
   * @param events  the whole game, in order
   * @param ctx     { roster, homeId, awayId, evenOnly }
   *
   * Returns, beyond the contract:
   *   t        draws won by each club
   *   z        draws won per club per zone, `{ [teamId]: { O, N, D } }` — the
   *            zone is always from the WINNER's point of view
   *   zones    every counted draw's zone, by id, so a renderer need not re-derive
   *   unplaced ids of draws we counted and could not place
   */
  reduce(events, ctx) {
    const { homeId, awayId } = ctx;
    const t = { [homeId]: 0, [awayId]: 0 };
    const z = { [homeId]: { O: 0, N: 0, D: 0 }, [awayId]: { O: 0, N: 0, D: 0 } };
    const counted = [], surprising = [], excluded = [], unplaced = [];
    const zones = {};

    events.forEach((e, id) => {
      /* THE SAME THREE DIMENSIONS EVERY LAYER EXCLUDES ON, in the same order and
         with the same vocabulary — `play` is the shootout, `type` is the kind of
         event, `strength` is the filter. A layer that invented a fourth would be
         a layer the work panel cannot explain. */
      const notPlay = inShootout(e);
      const notDraw = e.type === 'faceoff'
        ? null
        : (NOT_A_DRAW[e.type] || NOT_A_PLAY[e.type] || `not a faceoff (${e.type})`);
      /* ⚠️ THE STRENGTH FILTER IS NOT DECORATION HERE. A reader who turns Even
         strength on is asking exactly the right question and must get an honest
         answer rather than a total that quietly mixes even play with the power
         play.

         ⛔⛔ AND `census.drawStrength` MUST NOT BE QUOTED AS THE REASON, for two
         separate faults found 2026-09-10. It carries the winner-vs-loser attempt
         ratio after a draw, split by strength — but its `pp` bucket accumulates
         ONLY draws the advantaged club WON (`e.own === s.advantage`), so it has
         no lost-the-draw control and cannot separate *winning the draw* from
         *being on the power play*. Most of that ratio is the power play. It is
         the identical missing-baseline fault `endZone` was corrected for, in the
         table one line below it.

         ⚠️⚠️ AND THE STALENESS CLAIM THAT USED TO BE HERE WAS BACKWARDS, which
         is worth more than the claim was. It read: *"the figures typed here were
         STALE — this comment said 4.302x / 1.273x over n=22,790 / 190,144;
         measures.json says 4.16 and 1.272 over 21,704 / 188,421."* A derive run
         on 2026-09-10 published 4.302 and 1.273 over 22,790 and 190,144 — the
         comment's own numbers, exactly. **The comment was current and
         `data/measures.json` was the stale artifact**, because `strength.js`
         stopped leaving 4,151.9 minutes unclassifiable and every figure derived
         from the situation codes moved with it.

         ⛔ THE MISTAKE WAS THE REFERENCE, NOT THE ARITHMETIC. A committed
         derived file was treated as the archive, and it is a CACHE of the
         archive — `guard where the archive is` is exactly this rule, and it was
         broken by the person quoting it. No archive figure is typed here now,
         which is right for a different reason than the one first given: not
         because this one had rotted, but because nothing in a comment can say
         when it did. Read `measures.json`. */
      const notEven = ctx.evenOnly ? whyNotEven(e, ctx) : null;

      if (notPlay || notDraw || notEven) {
        const dims = {};
        if (notPlay) dims.play = notPlay;
        if (notDraw) dims.type = notDraw;
        if (notEven) dims.strength = notEven;
        excluded.push({ id, why: notPlay || notDraw || notEven, dims });
        return;
      }

      counted.push(id);

      /* ⭐ A DRAW WE CANNOT PLACE IS COUNTED AND SAID OUT LOUD, never dropped and
         never defaulted to a zone. `unplaced` is the whistle layer's own answer
         to the same question — *"we know this happened and cannot place it" is a
         different claim from "nothing happened"* — and the two failures here are
         different: a missing `own` means we do not know who won it, a missing `x`
         means we do not know where it was. Either way the count is honest and the
         zone is absent. */
      if (e.own == null || e.x == null || t[e.own] === undefined) {
        unplaced.push(id);
        surprising.push({
          id,
          why: e.own == null || t[e.own] === undefined
            ? 'the feed did not record which club won this draw, so it is counted '
            + 'and credited to neither'
            : 'the feed recorded no coordinate for this draw, so it is counted '
            + 'and placed in no zone',
          derivedFrom: `event.own=${e.own}, event.x=${e.x}`,
        });
        return;
      }

      /* ⛔ THE ZONE IS FROM THE WINNER'S POINT OF VIEW, and it has to be, because
         the same dot is an offensive-zone start for one club and a defensive-zone
         start for the other. `attackDirection` and `attackZone` are the SAME two
         functions the archive census used to produce the 1.163 / 0.52 figures, so
         the mark on the ice and the sentence under it are answering with one
         rule. A local `x > BLUE_LINE_X` here would be a second answer, free to
         disagree with the number it is supposed to illustrate. */
      const zone = attackZone(e.x, attackDirection(e.own, homeId));
      zones[id] = zone;
      z[e.own][zone] += 1;
      t[e.own] += 1;
    });

    return { t, z, zones, counted, surprising, excluded, unplaced };
  },
};
