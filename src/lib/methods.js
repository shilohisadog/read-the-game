/**
 * Where every figure on the preview card comes from, and what is wrong with it.
 *
 * ⭐⭐ THE RULE THIS MODULE EXISTS TO MAKE MECHANICAL. Kevin, 2026-09-23: *"every
 * metric and number needs to have an opportunity for a critic to 'be shown the
 * work' and the work needs to be squared away."* When I audited the card against
 * that the same afternoon, five of its seven league tiles carried a door and
 * **every one of those doors led to a LESSON rather than to the WORK** — a link
 * to `penalties.html` teaches what a penalty is and says nothing about how 3.7 a
 * game was counted. Two tiles had no door at all, and the most attackable number
 * on the card, *"14 of 35 games"*, was naked.
 *
 * ⛔ SO THE LIST OF FIGURES AND THE LIST OF DERIVATIONS ARE ONE LIST. A methods
 * page maintained beside the card is a methods page that goes stale the first
 * time a row is added, and the staleness is invisible: both pages render fine.
 * `keysOf()` below reports exactly what the card can draw, `DERIVATION` must
 * cover it, and `test/methods.test.js` fails the build when it does not. That is
 * the gate rather than the intention.
 *
 * ⛔ AND EVERY NUMBER HERE IS READ, NEVER RESTATED. This module divides nothing
 * and counts nothing; it pairs published figures with the sentence that says what
 * they were divided by. A methods page that computed its own version of a figure
 * would be a second implementation of the measurement, which is the one defect
 * that would make the page worse than having none.
 *
 * ⚠️ THE `caveat` FIELD IS NOT DECORATION AND MAY NOT BE LEFT EMPTY TO BE TIDY.
 * Where we know a figure is dirty — hits are counted by the home rink's own crew
 * — the page says so in the same breath as the number. A criticism we have
 * already conceded internally and did not print is a criticism a reader is
 * entitled to think we were hiding.
 */
import { CLUB_ROWS, PLAYER_ROWS, POSSESSION_FAMILY, leagueRows } from './preview.js';
import { anchorOf, anchorFor, explains, EXPLAINED_ROWS } from './anchors.js';
/* ⭐ RE-EXPORTED, NOT RE-STATED. The prose table and the league join moved to
   `derivation.js` so the replay's overlay can carry them without this file; see
   that header. Two statements rather than `export … from`, because the builders'
   inliner strips the import line. */
import { DERIVATION, EXPLAINED, explainedLabel, leagueFigures } from './derivation.js';
export { DERIVATION, EXPLAINED, explainedLabel };
/* ⭐ RE-EXPORTED, NOT RE-STATED. The table moved to `printed.js` so the replay
   can carry it without `preview.js` (see that file's header). Every caller that
   already read these three from here still does; `_module()` strips the import
   and turns the re-export into a harmless no-op, which is why this is two
   statements rather than `export … from`. */
import { PRINTED, PRINTED_KEYS, printed } from './printed.js';
export { PRINTED, PRINTED_KEYS, printed };



/**
 * ⭐ EVERY KEY THE CARD CAN DRAW, ASKED OF THE CARD RATHER THAN LISTED BY HAND.
 *
 * The club keys come from `CLUB_ROWS` directly. The league keys cannot: they are
 * emitted conditionally by `leagueRows()`, one per published counter, so a
 * document that predates a counter renders fewer tiles. Calling the card's own
 * function means this answers what a READER is actually looking at — and the gate
 * gets the full set simply by handing it a complete document.
 *
 * ⛔ A SECOND LIST OF KEYS HERE WOULD DEFEAT THE WHOLE MODULE. The failure this
 * is built against is a methods page that silently stops covering a row; a
 * hand-written list is that failure with extra steps.
 */
export function keysOf(measures) {
  /* ⭐ THE PLAYER ROWS ARE UNCONDITIONAL, unlike the league rows. A league row is
     emitted only when the census carries its counter, so an older document draws
     fewer; the four player rows are a fixed set the card either draws or does
     not, and a document with no `players.json` means no BLOCK rather than fewer
     rows inside one. */
  return [...CLUB_ROWS.map(r => r.key), ...PLAYER_ROWS.map(r => r.key),
          ...leagueRows(measures).map(r => r.key)];
}




/* ⭐ RE-EXPORTED, NOT RE-STATED. Every caller outside this file holds
   `methods.js` as the one place that knows about derivations, and moving the
   anchor into its own file is a page-weight decision rather than a change to
   that. ⛔ `export … from` IS NOT USED: `_module()` in the builder strips import
   lines and deletes the word `export`, which would leave the browser a bare
   `{ … } from './anchors.js';`. Two statements survive that transform. */
export { anchorOf, anchorFor, explains, EXPLAINED_ROWS };

/**
 * The page's content: the policy, then one entry per figure, then the family.
 *
 * @param measures  the published `measures.json`
 * @returns {{policy, club, league, family}} — `null` fields where the document
 *          predates the figure, which is the degradation every other surface makes.
 */
export function methods(measures) {
  const s = (measures && measures.settle) || null;
  const c = (measures && measures.census) || null;

  const policy = s ? { target: s.target, admission: s.admission, probes: s.probes || [],
                       half: s.half, seasons: s.seasons || [],
                       /* ⚠️ THE CLUB-SEASONS BEHIND THE INSTRUMENT, taken off a row
                          rather than stored twice. Every row is measured over the
                          same population; reading it from the first one that has it
                          keeps one number in one place. */
                       clubSeasons: Object.values(s.rows || {})
                         .map(r => r.clubSeasons).find(n => n != null) || null } : null;

  /* ⭐⭐⭐ THE EVIDENCE FOR A CLAIM THE PROSE USED TO JUST MAKE. `baseRates` has
     been published since the site began and the front door reads it; nothing
     else did. A figure explaining WHY a measure is defined the way it is belongs
     next to that measure, and it is the difference between "a losing team throws
     everything at the net" (which we do not measure) and two counts a reader can
     check. Only `level5` has one; a row without evidence renders without it,
     rather than being given a figure that is not about it. */
  const base = (measures && measures.baseRates) || {};
  const EVIDENCE = {
    level5: [base.moreAttemptsLost, base.moreLevelControlLost]
      .filter(b => b && b.count != null && b.n),
  };

  const club = CLUB_ROWS.map(r => {
    const pub = (s && s.rows && s.rows[r.key]) || null;
    return { key: r.key, anchor: anchorFor(r.key),
             ...DERIVATION[explains(r.key)],
             /* ⛔ THE CARD'S LABEL WINS, AND IT IS SET AFTER THE SPREAD ON PURPOSE.
                A methods page that names a row differently from the row it explains
                is a page a reader cannot match up — and the spread would silently
                take precedence if this sat above it. */
             label: r.label,
             /* ⛔ `admitted` IS RECOMPUTED FROM THE PUBLISHED FIGURES rather than
                inferred from the row being present. A reader checking our work
                needs to see the rule applied, not to be told the outcome. */
             admitted: !!(pub && pub.games != null && policy && pub.games <= policy.admission),
             r: pub ? pub.r : null, games: pub ? pub.games : null,
             alternate: pub ? pub.alternate || null : null,
             atTarget: pub ? pub.atTarget || null : null,
             clubRange: pub ? pub.clubRange || null : null,
             /* The published `what` string travels WITH the count, so the page
                never restates what a base rate is about. A sentence describing
                a figure, typed somewhere other than where the figure is made, is
                the drift this module exists to avoid. */
             evidence: (EVIDENCE[r.key] || []).length ? EVIDENCE[r.key] : null };
  });

  /* ⭐⭐⭐ ONE SECTION FOR FOUR ROWS, AND THAT IS WHY `EXPLAINS` MAPS THEM ALL TO
     `playerRate`. Goals, assists, shots on goal and shot attempts per player are
     the SAME DIVISION with four numerators, so four sections would be one
     explanation printed four times with a word changed -- and, since the anchor
     is derived from the DERIVATION key, four sections would also share one id.
     The numerators are named inside the section instead. */
  const player = DERIVATION.playerRate
    ? [{ key: 'playerRate', anchor: anchorOf('playerRate'), ...DERIVATION.playerRate,
         numerators: PLAYER_ROWS.map(r => r.noun) }]
    : [];

  const frame = leagueFigures(measures);

  /* ⭐⭐ WHY THERE IS ONE POSSESSION ROW, AS A RANGE RATHER THAN AN ASSERTION.
     The weakest agreement in the family is the honest headline: if even the least
     similar pair moves together at 0.84, printing four of them shows one piece of
     evidence four times. `min` is taken over the ABSOLUTE value because a
     differential runs opposite to a share and is no less the same measurement
     for it — though no member of the published family is currently signed that
     way, and a future one would make this line load-bearing. */
  const fam = s && s.family && s.family.pairs && s.family.pairs.length ? s.family : null;
  const family = fam ? {
    clubSeasons: fam.clubSeasons,
    members: POSSESSION_FAMILY.map(r => ({ key: r.key, label: r.label,
      shown: CLUB_ROWS.some(c2 => c2.key === r.key) })),
    pairs: fam.pairs,
    min: Math.min(...fam.pairs.map(p => Math.abs(p.r))),
    max: Math.max(...fam.pairs.map(p => Math.abs(p.r))),
  } : null;

  return { policy, club, player, league: frame, family,
           /* ⭐ THE THIRD SECTION RIDES ALONG rather than being a second fetch.
              The page grabs one document and calls one function; a surface that
              had to remember to call two would eventually call one. */
           printed: printed(measures),
           /* The archive the league frame was counted over, so the page can say
              it once above the tiles instead of on each of them. */
           games: c && c.games != null ? c.games : null };
}
