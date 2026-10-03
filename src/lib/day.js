/**
 * A DATE, AS A READER WOULD WRITE IT. "2023-11-10" -> "10 November 2023".
 *
 * ⭐ ITS OWN FILE SO THE REPLAY CAN HAVE IT WITHOUT THE FRONT DOOR'S STATE
 * MODEL. This lived in `ingest-state.js`, which is 10 KB of pipeline-state prose
 * the replay page has no use for, and the replay now has to date its own
 * measurements (ruling 8, 2026-10-03). The alternatives were both worse: inline
 * the 10 KB into `game.html` for one function, or write a second month table
 * beside the first — and a second spelling of a date is this build's own subject
 * matter. ~400 bytes, one implementation, both bundles.
 */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

/** "2023-11-10" -> "10 November 2023", or null for anything that is not one.
 *  PARSED BY HAND rather than with `Date`, which would apply the viewer's
 *  timezone to a date that has none and can slip a day westward. */
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}
