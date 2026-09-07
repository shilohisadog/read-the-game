/**
 * Control (Corsi) — shot attempts, as a reduction over the whole game.
 *
 * Corsi counts every attempt on goal: goals, shots on goal, shots that missed,
 * and shots that were blocked. It is a rough proxy for which team had the puck
 * in the other team's end, which is why the app calls it "control" rather than
 * its real name — a novice has no reason to know what a Corsi is.
 *
 * Phase 2: reduces the FULL event stream and accounts for every event. See
 * ../layer.js for why that matters.
 */
import { corsiTeam, ATTEMPT_TYPES } from '../attribution.js';
import { NOT_A_PLAY, NOT_AN_ATTEMPT, inShootout, shootoutWinner } from '../layer.js';
import { whyNotEven } from '../strength.js';


export const corsi = {
  /**
   * ⭐ WHAT THIS LAYER COUNTS, AND HOW IT CREDITS IT — the layer's own words.
   *
   * CHENG's ruling, 2026-09-06: *"the layer owns what it counts and why; the page
   * owns how that reads."* These lived in hidden markup inside the parked layer
   * menu until then, which meant `HIGH_DANGER_FT` could move in `rink.js` and the
   * sentence describing it would not. A description is a property of the RULE.
   *
   * ⚠️ `credits` IS THE ONE TWO LAYERS CAN LEGITIMATELY DISAGREE ON — Attempts
   * credits a blocked shot to the SHOOTER and Blocked credits it to the BLOCKER,
   * both correctly for their own question — so it belongs beside the reducer that
   * makes the choice, not in a panel that would have to remember it.
   */
  counts: 'every shot attempt the league recorded: on goal, missed, or blocked, because all three are the team moving the puck at the net',
  credits: 'A blocked attempt is credited to the club that shot it — the shot was still taken, it just never arrived.',
  id: 'corsi',
  label: '＋ Control (Corsi)',

  /**
   * @param events  the whole game, in order
   * @param ctx     { roster, homeId, awayId, homeAb, awayAb, evenOnly }
   *
   * `evenOnly` is a second DIMENSION of exclusion, not a second list. An event
   * that is both a non-attempt and non-even-strength -- a hit on the power play
   * -- appears once, carrying both reasons. Double-listing it would break
   * conservation; picking one reason silently would hide the other.
   */
  reduce(events, ctx) {
    const { roster, homeId, awayId } = ctx;
    const t = { [homeId]: 0, [awayId]: 0 };
    const counted = [], surprising = [], excluded = [];
    let hs = 0, as = 0;

    events.forEach((e, id) => {
      // The scoreboard counts goals scored in PLAY. Every successful shootout
      // attempt is its own `goal` event, but a shootout moves the scoreboard by
      // exactly one — a sampled game had three attempts score. Counting them
      // here would have put a 6-4 on screen for a game that finished 4-3.
      if (e.type === 'goal' && e.pt !== 'SO') (e.own === homeId ? hs++ : as++);

      // Before the type question, because a shootout goal is a perfectly good
      // attempt BY TYPE and would otherwise be counted as one.
      const notPlay = inShootout(e);
      const team = corsiTeam(e, roster);
      const notAttempt = team == null
        ? (NOT_AN_ATTEMPT[e.type] || NOT_A_PLAY[e.type] || `not an attempt (${e.type})`)
        : null;
      const notEven = ctx.evenOnly ? whyNotEven(e, ctx) : null;

      if (notPlay || notAttempt || notEven) {
        const dims = {};
        if (notPlay) dims.play = notPlay;
        if (notAttempt) dims.type = notAttempt;
        if (notEven) dims.strength = notEven;
        excluded.push({ id, why: notPlay || notAttempt || notEven, dims });
        return;
      }
      t[team]++;
      counted.push(id);

      if (e.type === 'blocked-shot') {
        // The one place a novice's intuition points the wrong way — and the
        // place this project once shipped a wrong number with a confident
        // explanation attached. `derivedFrom` is what makes it checkable.
        const p = roster[e.actor];
        surprising.push({
          id,
          why: `blocked, but it still counts — an attempt belongs to the SHOOTER`
             + `${p ? `, ${p.nm}` : ''}, not the player who blocked it`,
          derivedFrom: `roster[event.actor].tid (actor=${e.actor})`,
        });
      }
    });

    // Exactly one goal to whoever converted more attempts — never one per
    // attempt, and never one to nobody.
    const won = shootoutWinner(events, homeId, awayId);
    if (won === homeId) hs++; else if (won === awayId) as++;

    return { t, counted, surprising, excluded, hs, as };
  },
};

/** Attempt types, re-exported so callers need not reach into attribution. */
export { ATTEMPT_TYPES };
