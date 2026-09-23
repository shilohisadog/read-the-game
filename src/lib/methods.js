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
    count: 'shots this team tried while both sides had five skaters and a goalie '
         + 'on the ice, and the score was tied',
    of: 'both teams\u2019 attempts under those same two conditions \u2014 so 50% means '
      + 'the two traded shots evenly',
    why: 'It is the closest thing hockey has to "who had the puck": a team that is '
       + 'shooting is a team that has it. We only count it while the score is tied '
       + 'because a team that is losing throws everything at the net, so a whole '
       + 'season of it mostly tells you who spent more time behind.',
    caveat: 'We divide by games played. What we should divide by is minutes of '
          + 'five-on-five ice time, which we cannot work out from the league\u2019s '
          + 'feed yet \u2014 so our figure quietly includes time spent on power plays '
          + 'and penalty kills. This is the strongest fair criticism of this '
          + 'number and we have not answered it.' },
  dmen: {
    count: 'shot attempts taken by a player the roster lists as a defenceman',
    of: 'every shot attempt by that team',
    why: 'You can see this one from the first shift: does the puck keep going back '
       + 'out to the blue line, or does this team work it down low? And it is close '
       + 'to independent of who has the puck, so it tells you something the number '
       + 'above does not.',
    caveat: 'Defenceman is what the roster says, not a judgement about where a '
          + 'player actually played. A forward who spent the season up on the point '
          + 'still counts here as a forward.' },
  slot: {
    count: 'shot attempts from inside the slot \u2014 the area in front of the net '
         + 'that most goals come from',
    of: 'that team\u2019s attempts the league recorded a location for',
    why: 'Where a team shoots from, rather than how often. The slot we use is the '
       + 'same shape the replay shades, so you can watch a shot being counted '
       + 'instead of taking our word for it.',
    caveat: 'The location is the league\u2019s, written down by hand in the building. '
          + 'Attempts with no location recorded are left out of both halves of the '
          + 'division rather than counted as "outside".' },

  /* -------------------------------------------------------- the league frame */
  powerplay: {
    unit: 'goals for every 100 power plays',
    label: 'How often a power play produces a goal',
    count: 'power-play goals',
    of: 'power plays',
    why: 'The most consequential thing that happens away from open play \u2014 and '
       + 'the number new fans guess far too high. Most power plays end with '
       + 'nothing at all.',
    caveat: 'Power-play goals, not every goal scored while a team was on a power '
          + 'play. The second includes goals scored BY the short-handed team, and '
          + 'reads about three points higher than the league\u2019s own figure.' },
  penalties: {
    unit: 'penalties, per team per game',
    label: 'How many penalties a team takes',
    count: 'penalties called',
    of: 'two teams per game, so the answer is per team per game',
    why: 'This is the number the power-play figure sits against, and the gap '
       + 'between them is worth knowing: taking a penalty does not always hand '
       + 'the other team a power play.',
    caveat: 'About a quarter of penalties never give the other team a power play. '
          + 'Offsetting minors, misconducts, and penalties taken while a team is '
          + 'already short-handed are the obvious explanations \u2014 and we have '
          + 'measured none of them, so we state the gap and do not explain it.' },
  offside: {
    unit: 'times offside, per team per game',
    label: 'How often a team is offside',
    count: 'times play was stopped for offside',
    of: 'two teams per game',
    why: 'The first rule that makes a newcomer ask why play just stopped \u2014 and '
       + 'the reason a team carrying the puck up the ice sometimes slows down at a '
       + 'blue line for no visible reason.',
    caveat: 'The league\u2019s feed does not label a stoppage "offside". We work it '
          + 'out from where the restart faceoff was placed, plus the rule. That is '
          + 'a dependable reading, but it is a reading.' },
  icing: {
    unit: 'icings, per team per game',
    label: 'How often a team ices the puck',
    count: 'times play was stopped for icing',
    of: 'two teams per game',
    why: 'The other stoppage a newcomer cannot read, and the one with a '
       + 'consequence you can watch: the team that iced it may not change its '
       + 'line, so tired players have to stay out for the faceoff.',
    caveat: 'Read the same way as offside, from the restart faceoff and the rule, '
          + 'and it carries the same risk. Where our reading disagrees with the '
          + 'rulebook, that is evidence about our reading first.' },
  attempts: {
    unit: 'of every 100 attempts reached the goalie',
    label: 'Where a shot attempt ends',
    count: 'attempts of each ending \u2014 reached the goalie, blocked, missed',
    of: 'every shot attempt in the archive',
    why: 'This is the one figure here that is a clean split of a whole, so it is '
       + 'the one that can honestly be drawn as a single bar. It also frames the '
       + 'possession number above: about half of all attempts never reach the '
       + 'goalie at all.',
    caveat: 'Whether an attempt "missed" rather than "was saved" is a person in '
          + 'the arena making a call. We measured how much that judgement varies '
          + 'from building to building, and it is why no number we show beside a '
          + 'team is built on it.' },
  shift: {
    unit: 'seconds',
    label: 'How long a shift lasts',
    count: 'the middle shift length, in seconds',
    of: 'every shift in the archive with a start and an end recorded',
    why: 'The most bewildering thing about a first hockey game is that nobody '
       + 'stays on the ice. Players change every forty-odd seconds, while play is '
       + 'still going, and nothing on the broadcast explains it.',
    caveat: 'The middle half means the 25th to the 75th percentile \u2014 a '
          + 'definition, not a band we chose. Games whose record carries no shift '
          + 'information are left out of the count rather than treated as zero.' },
  hits: {
    unit: 'hits, per team per game',
    label: 'How many hits a team lands',
    count: 'hits credited to a team',
    of: 'two teams per game',
    why: 'You will hear "they are really taking it to them physically" all night. '
       + 'This is our answer: we looked, and hitting more does not go with having '
       + 'the puck more.',
    caveat: 'Hits are counted by each home rink\u2019s own crew, and the same teams '
          + 'are credited with about 4% more hits at home than away. A number we '
          + 'know depends on who is scoring it does not get printed as though it '
          + 'were clean.' },
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
