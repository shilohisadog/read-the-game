/**
 * WHICH GAMES COUNT, AND WHAT TO CALL THE SET THEY MAKE.
 *
 * ⭐⭐ SPLIT OUT OF `archive.js` SO A LIST PAGE CAN CARRY IT, 2026-09-28 — the
 * second time this exact surgery has been done and the first one wrote down why:
 * `distribution.js` says *"SPLIT OUT OF archive.js SO THE GAME PAGE CAN CARRY IT
 * … the MECHANISM lives here, small enough to ship."* Same reasoning, different
 * mechanism.
 *
 * ⛔ WHAT IT COST BEFORE THE SPLIT. The front door and the calendar each inlined
 * the whole of `archive.js` — every season-wide rate, histogram and base rate —
 * to call `inScope`, a one-line predicate. `archive.js` imports `rink.js` and
 * `distribution.js`, so those came too. Measured on the built front door: the
 * three modules are 21,426 bytes gzipped, **27.1% of the page a stranger lands
 * on**, and neither page computes a single archive-wide figure.
 *
 * ⚠️ THE LINE IS A SUBJECT, NOT A SIZE. What lives here is *which games are in
 * the population and how that population is named* — the question a LIST asks.
 * What stays in `archive.js` is *what the population says* — the question a
 * summary asks. A cut made to hit a byte target would put `disputedCount` here
 * too, and that is a different subject; it has its own file for the same reason.
 *
 * `archive.js` re-exports all of these, so nothing that imported them from there
 * had to move.
 */
import { typeOf, isLeague } from './competitions.js';

/**
 * Regular season (02) and playoffs (03), read from the id — never a lookup.
 *
 * The reading of the field moved to competitions.js, where the calendar and the
 * verdict card read it too; this stays exported because half the repo imports
 * `inScope` from here and moving the NAME would be churn for no gain. What went
 * away is the third spelling of `String(id).slice(4, 6)`.
 */
export function inScope(gameId) {
  return isLeague(typeOf(gameId));
}

/** Playoffs (03), read from the same field, because the OTL bucket turns on it. */
export function isPlayoff(gameId) {
  return typeOf(gameId) === 3;
}

/**
 * The season a game belongs to, read from the id — never a lookup and never a
 * date. A season spans two calendar years, so a date would need a cutover rule
 * and the cutover moves; the id's first four digits are the league's own answer.
 */
export function season(gameId) {
  return String(gameId).slice(0, 4);
}

/**
 * How a season is WRITTEN: 2023 -> '2023-24'. Takes the season, not a game.
 *
 * HERE RATHER THAN IN A PAGE because two pages now print it — the team browse
 * and the calendar's season tabs — and a season written '2023-2024' on one and
 * '2023-24' on the other is the kind of divergence nobody files a bug about and
 * everybody notices. Accepts a string or a number, because `season()` above
 * returns a string and a page reading the id itself has a number.
 */
export function seasonLabel(y) {
  const n = Number(y);
  return `${n}-${String(n + 1).slice(2)}`;
}

export const POPULATION = 'NHL regular season and playoffs';
