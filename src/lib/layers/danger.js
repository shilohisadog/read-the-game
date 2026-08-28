/**
 * High danger — a geometric RULE, not a model.
 *
 * Doctrine §7: inside 33 feet of the attacking net and inside the slot (|y| ≤ 22).
 * A rule, because a viewer can check it with a ruler; expected goals is a model
 * and is the thing this project exists as an alternative to.
 *
 * The exclusions carry the measurement, not just the verdict — "48 ft from the
 * net" teaches where the line is, "not high danger" teaches nothing.

 * THE NAME CHANGED, AND THE REASON IS NOT COSMETIC.
 *
 * This was called "high-danger", which is a TERM OF ART already in use with
 * definitions that are not ours. Ours is a pure location test — an unblocked
 * shot (goal, shot on goal or miss) taken within 33 ft of the attacking net and
 * inside ±22 ft of centre — with no rush bonus, no rebound bonus and no shot
 * quality weighting. Published definitions elsewhere score attempts on a point
 * system and adjust for those things, so our count will disagree with a count a
 * curious reader looks up, and they will conclude we are WRONG rather than
 * DIFFERENT. That is the exact opposite of what this site trades on (CHENG).
 *
 * "Shots from the slot" says what the rule does, a novice can picture it, and it
 * borrows nobody's authority. "Chance" is avoided for the same reason
 * "high-danger" is: "scoring chance" is loaded in the same way.
 *
 * The INTERNAL names stay — `isHighDangerEvent`, `isHighDanger`, `HIGH_DANGER_FT`
 * are vocabulary between our own modules, and only the user-facing label makes a
 * claim to a reader.
 *
 * EXCEPT `id`, WHICH STOPPED BEING INTERNAL. The deep-link seam spends layer
 * ids as URL tokens (`?layer=slot`), and a URL is the most public surface we
 * have: it survives copy-paste, screenshots and forum posts long after page
 * copy changes. Shipping `danger` and renaming it later is a broken bookmark,
 * and an id is not exempt from carrying somebody else's definition just because
 * it is not rendered. So this one moved with the label; the rest did not.
 */
import { shootingTeam, SHOT_TYPES } from '../attribution.js';
import { attackDirection, distanceToNet, HIGH_DANGER_FT, SLOT_HALF_WIDTH } from '../rink.js';
import { NOT_A_PLAY, inShootout } from '../layer.js';
import { whyNotEven } from '../strength.js';

export const danger = {
  id: 'slot',
  label: '＋ Shots from the slot',

  reduce(events, ctx) {
    const counted = [], surprising = [], excluded = [];

    // `play` first, matching the precedence in the other two layers: an event
    // that is outside play is excluded for THAT reason, whatever else is also
    // true of it. Omitting it here left exclusions with no `why` at all, which
    // the conservation check caught — it requires a human-written reason on
    // every excluded event, not merely that the counts balance.
    /* ⚠️ `|y|` IS MATHS, AND `why` IS PROSE. These strings are read by a person
       in the work panel -- "38 ft out and wide of the slot (|y|=33 ft)" shipped
       absolute-value notation to a novice learning what the slot is. `y` off
       the centre line is the thing being said, so it says that.
       `derivedFrom` KEEPS THE NOTATION on purpose: it is the computation, not
       the sentence, and a verification surface that hides its arithmetic behind
       prose is the thing this project exists to be the opposite of. */
    const push = (id, dims, detail) =>
      /* ⭐ THE DIMENSION VOCABULARY, AND THE ORDER IS THE PRECEDENCE. `play` --
         outside play at all. `type` -- a different kind of event. `strength` --
         the wrong situation. `limit` -- a real candidate the FEED cannot place.
         `geometry` -- a real candidate that failed OUR rule. The last two are
         what the panel promotes, because they are the only exclusions where a
         viewer could have expected the event to count. */
      excluded.push({ id, why: dims.play || dims.type || dims.strength
                             || dims.limit || dims.geometry,
                      ...(detail ? { detail } : {}), dims });

    events.forEach((e, id) => {
      const notEven = ctx.evenOnly ? whyNotEven(e, ctx) : null;
      // First, and before the geometry. A shootout attempt is taken from the
      // slot by definition, so every one of them would score as high-danger --
      // the single worst place for this to leak, because the number would look
      // entirely plausible.
      const notPlay = inShootout(e);
      if (notPlay) {
        /* ⚠️ AND THE TYPE QUESTION IS STILL ASKED, because the shootout contains
           events that are not plays at all — its own `period-start` and
           `period-end`. Returning on `play` alone filed those as a near miss on
           a layer about shots from the slot: a period start is not a candidate
           for anything, and the panel promotes on any dimension but `type`.
           Twelve rows across the fixture corpus, the tail of the same defect
           Kevin found on Blocked. Both dimensions are true of the event, so
           both are recorded, and `type` is what disqualifies it. */
        const alsoType = !SHOT_TYPES.has(e.type) ? NOT_A_PLAY[e.type] : null;
        push(id, { play: notPlay, ...(alsoType ? { type: alsoType } : {}),
                   ...(notEven ? { strength: notEven } : {}) });
        return;
      }
      if (!SHOT_TYPES.has(e.type) || e.x == null) {
        /* ⭐ A BLOCKED SHOT IS EXCLUDED BY A LIMIT, NOT BY ITS TYPE, and the
           distinction is CHENG's: "two of these are hockey, one is us." A
           faceoff is not a slot shot because it is a different kind of event.
           A blocked shot IS a shot -- we know who took it, verified 44 of 44 --
           and it is out because the feed records where the puck STOPPED and not
           where it was struck. That is a limit of the data, and labelling it
           `type` filed it with the faceoffs, where it collapsed into a line
           about things that were never candidates. It is the most interesting
           exclusion on the page and it was being hidden by its own dimension. */
        const rest = notEven ? { strength: notEven } : {};
        push(id, e.type === 'blocked-shot'
               ? { limit: 'blocked before it got there — the feed records where the '
                        + 'puck stopped, not where the shot was taken', ...rest }
               : { type: NOT_A_PLAY[e.type] || `not a shot on the net (${e.type})`,
                   ...rest });
        return;
      }
      if (notEven) { push(id, { strength: notEven }); return; }
      const team = shootingTeam(e, ctx.roster);
      if (team == null) {
        push(id, { type: 'shooter not identified in the feed' });
        return;
      }

      const d = distanceToNet(e.x, e.y, attackDirection(team, ctx.homeId));
      const near = d <= HIGH_DANGER_FT;
      const central = Math.abs(e.y) <= SLOT_HALF_WIDTH;

      if (near && central) {
        counted.push(id);
        if (e.type === 'missed-shot') {
          surprising.push({
            id,
            why: 'it missed the net and still counts — danger is about where the '
               + 'chance came from, not whether it went in',
            derivedFrom: `distance=${d.toFixed(1)}ft, |y|=${Math.abs(e.y)}`,
          });
        }
        return;
      }
      /* ⚠️ A REASON THAT NAMES A RULE GROUPS; A REASON THAT NAMES THE EVENT DOES
         NOT -- and these named the event. Each string carried THIS shot's
         distance, so `summarise` grouped 276 exclusions into 49 rows of which
         32 appeared exactly once, and the work panel ran to 3,176px at 390 by
         the final whistle. Every other layer renders 10 to 13 rows.

         ⭐ THE DIMENSION WAS ALSO MISLABELLED, which is why it could not be
         grouped by anything else. A shot 36 ft out is rejected by GEOMETRY, not
         by its type, and `dims` exists to name which dimension rejected an
         event -- all 276 said `type`. So: `why` is the rule, categorical and
         groupable; `detail` is this shot's measurement, which the panel shows
         as one example per group. The specificity CHENG valued -- "36 against
         33 teaches the rule better than the rule statement does" -- survives,
         once per group instead of once per shot. */
      push(id,
        { geometry: !near && !central
              ? `outside the slot on both counts — beyond ${HIGH_DANGER_FT} ft and wide of it`
          : !near
              ? `outside the ${HIGH_DANGER_FT} ft line`
              : `in close but wide of the slot — the slot reaches ${SLOT_HALF_WIDTH} ft either side` },
        !near && !central
              ? `${d.toFixed(0)} ft out and ${Math.abs(e.y)} ft off centre`
          : !near
              ? `${d.toFixed(0)} ft from the net`
              : `${Math.abs(e.y)} ft off centre`);
    });

    return { counted, surprising, excluded };
  },
};
