/**
 * Rink geometry.
 *
 * Coordinates in the extract are already normalized so the HOME team defends the
 * -x end and the AWAY team defends +x, in every period. (Teams switch ends each
 * period in the raw feed; extraction undoes that using `homeTeamDefendingSide`.)
 *
 * A team's *attacking* net therefore sits at x = +89 for home and x = -89 for
 * away, and distance has to be measured to the net a team is shooting AT.
 *
 * The bug this replaces used `89 - Math.abs(x)`, which measures to whichever net
 * is *nearer*. That is correct for shots taken in the attacking half and wrong
 * for every shot taken in a team's own half -- three events in the reference
 * game were mis-measured by up to 123 feet. It happened not to change any
 * high-danger classification, because all three also failed the slot test, so
 * the count was right by luck. Luck is not a test.
 */

export const NET_X = 89;
export const GOAL_LINE_X = 89;      // the same line; named for the rule that uses it
export const BLUE_LINE_X = 25;      // zone boundary, and what an offside is about
export const CENTRE_X = 0;
export const SLOT_HALF_WIDTH = 22;   // feet either side of centre
export const HIGH_DANGER_FT = 33;    // Doctrine section 7: a rule, not a model

/** +1 if this team attacks toward +x, -1 if toward -x. */
export function attackDirection(teamId, homeTeamId) {
  return teamId === homeTeamId ? 1 : -1;
}

/** Feet from (x,y) to the net this team is shooting at. */
export function distanceToNet(x, y, dir) {
  return Math.hypot(NET_X - x * dir, y);
}

/**
 * Doctrine section 7: high danger is a geometric RULE, not an expected-goals
 * model -- inside 33 feet and inside the slot -- so that a viewer can check it
 * with a ruler.
 */
export function isHighDanger(x, y, dir) {
  return distanceToNet(x, y, dir) <= HIGH_DANGER_FT && Math.abs(y) <= SLOT_HALF_WIDTH;
}

/**
 * THE DISCLOSURE THE PAGE HAS OWED SINCE THE ENDS DECISION.
 *
 * `docs/ends-switching.md` committed to this sentence in §6, worked out its
 * wording in §7.5 and listed it as step 4 in §8. It was never built. What
 * shipped instead was the `ATTACKS →` indicator, which states the convention
 * WITHOUT the disclosure that makes it honest -- so the arrows made the
 * contradiction sharper rather than safer, and every argument since has compared
 * one-direction WITHOUT its mitigation against as-played.
 *
 * TWO SENTENCES, TWO KINDS, which is the pattern the shootout notice opened.
 * The first is about hockey and its subject is a rule; the second is about US --
 * what we did to the data and why. Every other provenance tag we own (`rule:`,
 * `field:`) points into the game or the feed. `display:` points at the renderer,
 * and saying which is which is the difference between a statement and an excuse.
 *
 * IT IS NOT AN ALTERNATIVE TO THE CONTROL, it is a prerequisite for it (CHENG).
 * Whichever way the default is eventually ruled, a reader has to be told what
 * the screen is doing, so this sentence is never thrown away. And it is easier
 * to write for as-played than for one-direction -- there it need only say what
 * just happened -- which is an argument the ends decision should weigh.
 *
 * `from` IS DATA, NOT COPY. Rendered on the ice it ran the note to 176px on a
 * 390px phone -- taller than the rink it sits above, on a page Kevin had just
 * called overcrowded. `LINK_NOTES`, the other member of this family, renders
 * only its `text` and keeps `from` for the tests and the record; that precedent
 * was right and this broke it. Measured, not guessed.
 *
 * WHEN, NOT WHETHER: a note appears when the thing it explains happens. The
 * moment a viewer asks "why didn't they switch?" is the start of the second
 * period, so that is where this appears, and it stands down again once the
 * period is under way. The arrows carry the convention permanently; this
 * carries the explanation, briefly, at the one instant it is the answer to a
 * question somebody is actually asking.
 */
export const ENDS_NOTE = {
  rule: 'The teams just changed ends, as they do every period.',
  display: 'We hold the rink the same way all game, so the marks stay comparable.',
  from: 'display: the feed records which end each team defended and the extract '
      + 'normalizes it away, so the rink is held in one direction',
};

/** How long the disclosure stands, in seconds of play after a period begins. */
export const ENDS_NOTE_SECONDS = 90;

/**
 * Should the ends disclosure be showing at this moment?
 *
 * @param {{per:number, s:number}} e   the event being rendered
 * @param {number} periodStart         elapsed seconds at which `e`'s period began
 *
 * NOT IN THE FIRST PERIOD, because nothing has changed yet and a sentence about
 * a switch that has not happened is furniture. `periodStart` is passed in rather
 * than computed from the period number: regulation periods are 1200 seconds and
 * overtime is not, so deriving it would be a rule with no source in the data.
 */
export function endsNoteShowing(e, periodStart) {
  if (!e || !(e.per > 1)) return false;
  return e.s - periodStart < ENDS_NOTE_SECONDS;
}
