/**
 * HOW A LIST DISCLOSES A SHOT COUNT THE LEAGUE DISAGREES WITH ITSELF ABOUT.
 *
 * ⭐⭐ SPLIT OUT OF `archive.js`, 2026-09-28, beside `scope.js` and for the same
 * reason — but they are two files and not one, because they answer two
 * questions. `scope.js` is *which games are in the population*. This is *how a
 * row admits that one of its figures is contested*. Merging them would make a
 * "things the list pages happen to need" module, which is a bag named after its
 * consumers rather than its subject, and the next thing a list page needs would
 * land in it by default.
 *
 * ⚠️ IT IS PRESENTATION, AND THAT IS WHY IT LEFT `archive.js`. Nothing here
 * measures anything: it is a mark, a count of rows carrying the mark, and the
 * sentence that explains the mark. The archive-wide figures it used to sit
 * among are a different kind of thing entirely.
 *
 * `archive.js` re-exports all three, so nothing that imported them from there
 * had to move.
 */

/**
 * ⭐ THE SHOT COUNT ON A LIST ROW IS THE LEAGUE'S, AND ON 73 GAMES IT IS THE
 * ONE THE GAME PAGE DISCLOSES AS DISPUTED (D10).
 *
 * `derive.py` puts `u: 1` on a catalog row when the league's play-by-play and
 * the league's own boxscore disagree about shots on goal, and its comment says
 * exactly why the flag exists:
 *
 *   "`u` so a LIST can mark it without opening the extract. The calendar and
 *    the team page both show many games at once and neither fetches an extract
 *    to draw a row; without this the disclosure would exist only on the page
 *    you already committed to opening."
 *
 * THAT SENTENCE WAS TRUE. The flag was populated on 73 rows, correct, and read
 * by exactly one thing in the repo -- `builders/health.mjs`, counting it for the
 * build list. The reader it was created for was never written.
 *
 * AND THE GAP IS NOT COSMETIC, because `ash`/`hsh` are the BOXSCORE's numbers.
 * The game page shows the event log, which is what a replay IS. So the two
 * surfaces printed different figures for the same game with nothing anywhere
 * saying why -- measured on four of the 73:
 *
 *   VAN at FLA  list 31-36   page 31-37
 *   COL at NYI  list 38-32   page 39-32
 *   COL at ARI  list 31-32   page 31-33
 *   FLA at CGY  list 34-24   page 34-25
 *
 * That is C7's defect already shipped: two figures that look like one claim,
 * and a reader who notices concludes we cannot count.
 *
 * ONE WORDING, TWO SURFACES. The calendar's night list and the team browse
 * render the same row from the same field; giving each its own sentence is how
 * the next one gets written unamended, which is the rule the game page's own
 * standing sentence was built on.
 *
 * A MARK ON THE NUMBER AND A NOTE UNDER THE LIST, which is the idiom both pages
 * already use for the dashed out-of-scope count. The mark sits ON the figure it
 * qualifies rather than beside the row, because the claim is about that figure
 * and nothing else on the line.
 */
export const DISPUTED_MARK = '*';

/** How many rows on this list carry the disagreement. */
export function disputedCount(rows) {
  return (rows || []).filter(g => g && g.u === 1 && g.v === 1).length;
}

/**
 * The note, once, under a list that contains at least one.
 *
 * IT NAMES WHOSE NUMBER IS ON SCREEN. "The population is welded to the number"
 * is the fix that has now worked six times, and here the population is a
 * DOCUMENT: the figure in the row is the boxscore's, and the game page shows
 * the event log. Saying only "these disagree" would leave the reader unable to
 * tell which one they are looking at, which is the whole defect.
 */
export function disputedNote(n) {
  if (!n) return null;
  // ⭐ KEYED TO THE MARK, NOT TO A POSITION. The first wording said "the figure
  // ABOVE is the boxscore's", which was true only while the note sat under the
  // list -- and looking at it showed why it cannot: on a team page with 82 rows
  // the note landed at y=7401 on a 390px phone, seven thousand pixels below the
  // mark it explains. That is D9's y=1222 one page over.
  //
  // So the note goes ABOVE the list, where a reader meets it on the way down,
  // and the sentence names the mark instead of pointing at a neighbour. A
  // sentence whose truth depends on where it is printed is a sentence that goes
  // wrong the first time anything moves.
  return `${DISPUTED_MARK} In ${n} ${n === 1 ? 'game' : 'games'} below, the `
    + `league's own event log and boxscore disagree about the shot count. `
    + `A shot figure marked ${DISPUTED_MARK} is the boxscore's; open the game `
    + `and it shows both, and says which one it replays.`;
}
