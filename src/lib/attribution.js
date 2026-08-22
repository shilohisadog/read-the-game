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

/**
 * Attempts that reached the net area -- everything except blocked shots.
 *
 * AND THE EXCLUSION IS LOAD-BEARING, not tidiness. The slot rule is geometric:
 * within 33 ft of the net and inside +/-22 ft of centre. A blocked shot's
 * coordinate is NOT where the shot was taken -- it is where the puck was
 * stopped, which is between the shooter and the net and therefore nearer the
 * net than the shot itself. Measured over an 80-game random sample
 * (docs/blocked-shots-layer.md §3): a blocked shot records a median 24.2 ft
 * against 33.4 for a shot on goal, and only 6.1% beyond 50 ft -- while the point
 * shot is the most-blocked shot in hockey and the blue line is ~64 ft out.
 *
 * So including blocked shots here would let a point shot stopped 24 ft out
 * satisfy "from the slot" on a coordinate that describes the BLOCKER's
 * position. The rule would still be checkable with a ruler and it would be
 * measuring the wrong thing, which is the worst kind of wrong this site can be.
 *
 * The behaviour was already correct; the REASON was inherited and unstated,
 * which is how a correct behaviour gets refactored away by someone tidying up
 * (CHENG). `test/layers.test.js` pins it.
 */
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

/**
 * ⭐ C8 — WHAT ACTUALLY HAPPENED TO THE PUCK, instead of one phrase for ten.
 *
 * `missed-shot` is the league's own typeDescKey — a shot that did not force the
 * goalie to play the puck — and the page said "Missed shot" for every one of
 * them. Measured over 2,574 missed shots in 89 games, that phrase is FALSE for
 * about one in ten:
 *
 *   wide-left 38.3%   wide-right 35.0%   above-crossbar 5.6%
 *   high-and-wide-right 5.4%   high-and-wide-left 5.0%
 *   hit-left-post 2.7%   hit-right-post 2.6%   short 2.5%
 *   hit-crossbar 2.0%   failed-bank-attempt 0.9%
 *
 * A puck off the POST did not miss the net, it hit it — 7.3% — and a shot
 * recorded `short` never reached the net at all, another 2.5%.
 *
 * THE SENTENCE DESCRIBES, IT DOES NOT CLASSIFY. "Hit the post" is what a viewer
 * just watched; "missed the net" is a bucket the ledger puts it in. One narrator,
 * many ledgers, applied to a label.
 *
 * LEFT AND RIGHT ARE DROPPED ON PURPOSE. The mark is already on the ice at the
 * side it went; saying it again is the caption repeating what the rink shows,
 * which is the same defect the "⚡ Shot from the slot · … from the slot" rename
 * left behind.
 *
 * `failed-bank-attempt` KEEPS THE LEAGUE'S OWN NOUN. It is a shot from behind
 * the goal line — 23 of 24 at or past it, median 3 ft past — and every plainer
 * phrasing invents an intention ("tried to bank it in") or an outcome ("came off
 * the net") that the feed does not record. It is also SEASON-BOUNDED: zero in
 * 2023 across 881 missed shots, then 9 and 15.
 */
export const MISS_SAID = {
  'wide-left': 'Shot went wide',
  'wide-right': 'Shot went wide',
  'high-and-wide-left': 'High and wide',
  'high-and-wide-right': 'High and wide',
  'above-crossbar': 'Over the crossbar',
  'hit-left-post': 'Hit the post',
  'hit-right-post': 'Hit the post',
  'hit-crossbar': 'Hit the crossbar',
  short: 'Shot came up short',
  'failed-bank-attempt': 'Failed bank attempt',
};

/**
 * The sentence for one missed shot, or the plain phrase when the feed gave none.
 *
 * AN UNKNOWN VALUE RENDERS RAW, hyphens turned to spaces — the same last resort
 * `RSN` uses for a stoppage reason and `competitionOf` for a gameType, and for
 * the same reason: the league mints vocabulary under us, `extract.py`'s
 * `KNOWN_MISSES` gate turns the run red the day it does, and in the window
 * between those two a reader should see the league's word rather than a phrase
 * of ours that might be wrong about it.
 *
 * NO `miss` AT ALL is a different case from an unknown one and gets the old
 * generic phrase: 0 of 31 in the reference game carry none, but an older extract
 * predates the field entirely and must still read.
 */
export function missSay(ev) {
  const m = ev && ev.miss;
  if (!m) return 'Missed shot';
  return MISS_SAID[m] || String(m).replace(/-/g, ' ');
}
