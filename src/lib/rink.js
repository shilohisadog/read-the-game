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
