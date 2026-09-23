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
import { CLUB_ROWS, POSSESSION_FAMILY, leagueRows } from './preview.js';

/**
 * What each figure is COUNTED FROM, in the words a reader can check us on.
 *
 * `count` and `of` are the numerator and the denominator. They are prose and not
 * code, which is a real weakness: nothing forces the sentence to match the
 * arithmetic, and the only defence is that the arithmetic lives one file away in
 * the row's own `of`/`ofGame`. Where the two could plausibly diverge the sentence
 * names the FIELD, so a reader can grep for it.
 */
const DERIVATION = {
  /* ---------------------------------------------------------- the club rows */
  level5: {
    count: 'shot attempts by this club while the situation code was 1551 and the score was level',
    of: 'both clubs’ attempts under the same two conditions',
    why: 'It is the closest thing hockey has to "who had the puck", and it is the '
       + 'one industry label on this site. The level-score condition is not '
       + 'decoration: every club that is losing pushes, so a season’s raw figure '
       + 'flatters whoever trailed most.',
    caveat: 'The denominator is per game rather than per sixty minutes of 5-on-5, '
          + 'because we cannot yet derive time on ice by situation. That is the '
          + 'strongest remaining attack on this number and we have not answered it.' },
  dmen: {
    count: 'shot attempts taken by a player the roster lists as a defenceman',
    of: 'every shot attempt by that club',
    why: 'It is a shape a novice can see from the first shift — whether the puck '
       + 'goes back to the line or stays low — and it is nearly independent of '
       + 'possession, so it says something the CF% row does not.',
    caveat: 'Position is the roster’s word, not a judgement about where a player '
          + 'actually played. A forward who spent a season on the point counts as '
          + 'a forward here.' },
  slot: {
    count: 'shot attempts whose recorded coordinate falls inside the slot',
    of: 'that club’s attempts that carry a coordinate at all',
    why: 'Where a team shoots from, rather than how often. The slot is the same '
       + 'polygon the replay shades, so a reader can watch it being counted.',
    caveat: 'The coordinate is the league’s, recorded by hand in the building, and '
          + 'attempts with no coordinate are excluded from both halves rather than '
          + 'counted as outside.' },

  /* -------------------------------------------------------- the league frame */
  powerplay: {
    unit: 'goals for every 100 power plays',
    label: 'How often a power play produces a goal',
    count: 'power-play goals',
    of: 'power plays',
    why: 'The single most consequential thing that happens away from open play, '
       + 'and the figure a novice most often guesses wrongly high.',
    caveat: 'Power-play goals, not goals scored during a power play — the second '
          + 'includes short-handed goals and reads about three points higher than '
          + 'the league’s own figure.' },
  penalties: {
    unit: 'penalties, per club per game',
    label: 'How many penalties a team takes',
    count: 'penalty events in the archive',
    of: 'two per game, so the figure is per club per game',
    why: 'It is the number the power-play tile is measured against, and the gap '
       + 'between them is itself worth teaching.',
    caveat: 'About a quarter of penalties start no power play — offsetting minors, '
          + 'misconducts and penalties taken while already short-handed are the '
          + 'obvious candidates and NONE of them is measured here, so we state the '
          + 'gap and do not explain it.' },
  offside: {
    unit: 'times offside, per club per game',
    label: 'How often a team is offside',
    count: 'stoppages the rulebook attributes to offside',
    of: 'two per game',
    why: 'The first rule that makes a newcomer ask why play stopped, and the '
       + 'one that explains why a team carrying the puck up the ice sometimes '
       + 'slows down at a blue line for no visible reason.',
    caveat: 'Attributed by the restart faceoff’s location plus the rule, not by a '
          + 'label in the feed.' },
  icing: {
    unit: 'icings, per club per game',
    label: 'How often a team ices the puck',
    count: 'stoppages the rulebook attributes to icing',
    of: 'two per game',
    why: 'The other stoppage a newcomer cannot read, and the one with a visible '
       + 'consequence: the offending club may not change its line.',
    caveat: 'Same attribution as offside, and it inherits the same risk — a proxy '
          + 'that disagrees with the rule is evidence about the proxy first.' },
  attempts: {
    unit: 'of every 100 attempts reached the goalie',
    label: 'Where a shot attempt ends',
    count: 'shot attempts of each ending — reached the goalie, blocked, missed',
    of: 'every shot attempt in the archive',
    why: 'It is the one figure on the card that is a true partition, so it is the '
       + 'one that can honestly be drawn as a stacked bar. It also frames the CF% '
       + 'row: most attempts never become a shot.',
    caveat: 'Whether an attempt MISSED rather than was SAVED is a person in the '
          + 'arena deciding. We measured how building-dependent that judgement is '
          + 'and it is why no club row is built on it.' },
  shift: {
    unit: 'seconds',
    label: 'How long a shift lasts',
    count: 'the median length of a shift, in seconds',
    of: 'every shift in the archive that carries a start and an end',
    why: 'The most bewildering thing about a first hockey game is that nobody '
       + 'stays on the ice.',
    caveat: 'The middle half is the 25th to 75th percentile — a definition, not a '
          + 'chosen band. Games whose extract carries no shift block are absent '
          + 'from the denominator rather than counted as zero.' },
  hits: {
    unit: 'hits, per club per game',
    label: 'How many hits a team lands',
    count: 'hit events credited to a club',
    of: 'two per game',
    why: 'A novice will hear "they are really taking it to them physically" all '
       + 'night. This is our answer: we looked, and it does not go with having '
       + 'the puck.',
    caveat: 'Counted by each home rink’s own crew, which records about 4% more '
          + 'hits at home than the same clubs record away. A figure we know is '
          + 'scorer-dependent is not printed as though it were clean.' },
};

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
  return [...CLUB_ROWS.map(r => r.key), ...leagueRows(measures).map(r => r.key)];
}

/** Every key this module can explain. The gate compares the two. */
export const EXPLAINED = Object.keys(DERIVATION);

/**
 * ⭐ THE ANCHOR A FIGURE'S DOOR POINTS AT, stated once.
 *
 * The card writes this href and the page writes this id. Two spellings of one
 * string is the shape of dead link that looks completely normal, so there is one
 * spelling and both sides call it.
 */
export function anchorOf(key) {
  return 'm-' + key;
}

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

  const club = CLUB_ROWS.map(r => {
    const pub = (s && s.rows && s.rows[r.key]) || null;
    return { key: r.key, anchor: anchorOf(r.key),
             ...DERIVATION[r.key],
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
             clubRange: pub ? pub.clubRange || null : null };
  });

  const frame = leagueRows(measures).map(row => {
    /* THE n, WHICHEVER FORM THIS ROW CARRIES IT IN. A shift row counts shifts and
       a whistle row counts games; both are "what it was measured over" and the
       page prints the one the row actually has. */
    const over = row.games != null ? { n: row.games, unit: 'games' }
               : row.n != null ? { n: row.n, unit: 'shifts' } : null;
    return { key: row.key, anchor: anchorOf(row.key), ...DERIVATION[row.key],
      /* ⭐⭐⭐ THE DIVISION, CARRIED FROM THE ROW THAT DID IT. This is the whole
         point of the page: "power-play goals out of power plays" is a sentence,
         and "5,011 ÷ 22,872 = 21.9" is the work. The row computed it once and
         this passes it along; nothing here divides. */
      work: row.work || null,
      /* ⛔ AND THE ARCHIVE SIZE IS DROPPED WHEN IT IS THE DENOMINATOR AGAIN. The
         shift row is counted over 3.1 million shifts and divided by nothing, so
         printing "3,101,105 shifts it was counted over" beside "the middle value
         of 3,101,105" is the same number twice wearing two labels. */
      over: over && row.work && row.work.n === over.n ? null : over,
      /* ⚠️ AND THE NOUN SURVIVES THE SUPPRESSION. Dropping `over` also dropped
         the only word that said WHAT was counted, so the page read "the middle
         value of 3,101,105" — a number with no unit, on the page whose whole
         subject is what our numbers are made of. Found by looking at it. */
      population: over ? over.unit : null };
  });

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

  return { policy, club, league: frame, family,
           /* The archive the league frame was counted over, so the page can say
              it once above the tiles instead of on each of them. */
           games: c && c.games != null ? c.games : null };
}
