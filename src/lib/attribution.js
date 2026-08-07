/**
 * Whose attempt is this?
 *
 * This module exists because getting it wrong shipped a wrong number on the
 * project's flagship claim, so the reasoning is written down rather than assumed.
 *
 * On `api-web.nhle.com`, a blocked shot's `eventOwnerTeamId` is the SHOOTER's
 * team. Verified against `rosterSpots` -- an independent source, not our own
 * extract, so the check is not circular:
 *
 *     2023-24  MIN @ BUF   44/44 blocks credited to the shooter
 *     2025-26  MTL @ BUF   25/25
 *     2025-26  NYR @ MIN   34/34
 *
 * Older NHL endpoints credited the BLOCKER, which is where the folklore comes
 * from. It was true once; it is not true here. The app previously "corrected"
 * for it by flipping attribution on blocks, which turned a correct number into
 * an incorrect one: Corsi read MIN 72 / BUF 63 when it should read MIN 80 /
 * BUF 55.
 *
 * The defence against that happening again is not to trust the team field at
 * all. We resolve attribution from the SHOOTING PLAYER, so this stays correct
 * even if `eventOwnerTeamId` semantics drift a third time. `actor` on a blocked
 * shot is the shooter (44/44 in the reference game).
 */

export const ATTEMPT_TYPES = new Set(['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot']);

/** Attempts that reached the net area -- everything except blocked shots. */
export const SHOT_TYPES = new Set(['goal', 'shot-on-goal', 'missed-shot']);

/**
 * The team that took the shot, resolved through the player.
 * Returns null when the actor is unknown -- callers must decide, never guess.
 */
export function shootingTeam(ev, roster) {
  const p = roster[ev.actor];
  return p ? p.tid : null;
}

/**
 * The team credited with a Corsi attempt, or null if this event is not an
 * attempt at all. No flip. See the module comment for why.
 */
export function corsiTeam(ev, roster) {
  if (!ATTEMPT_TYPES.has(ev.type)) return null;
  return shootingTeam(ev, roster);
}
