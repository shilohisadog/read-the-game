/**
 * WHAT EACH FIGURE IS COUNTED FROM — THE PROSE, AND THE LEAGUE ROWS IT DESCRIBES.
 *
 * ⭐⭐ WHY THIS LEFT `methods.js` — 2026-09-26, the same week and the same reason
 * as `anchors.js`, `printed.js` and `league-rows.js`. Kevin's `Is that a lot?`
 * overlay draws a layer's methods-page section over the rink, and four of the
 * seven layer doors land on league rows — attempts, penalties, offsides, icings.
 * The replay therefore needs this table and the join below; it does not need
 * `methods()`, which resolves the preview card's CLUB rows and pulls `CLUB_ROWS`
 * in with it.
 *
 * ⛔ AND `leagueFigures` IS HERE RATHER THAN IN THE OVERLAY. `methods()` calls
 * it for the methods page and the replay calls it for the panel; written twice,
 * the two surfaces would be free to join a row to its prose differently, which
 * is precisely the drift the shared renderer was extracted to stop.
 */
import { anchorFor, explains } from './anchors.js';
import { leagueRows } from './league-rows.js';
import { PRINTED } from './printed.js';

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
    why: 'It is the closest thing hockey has to "who had the puck": a team that '
       + 'is shooting is a team that has it.',
    /* ⛔⛔ THIS SENTENCE USED TO EXPLAIN THE SCORE CONDITION BY A MECHANISM WE DO
       NOT MEASURE — "a team that is losing throws everything at the net". Kevin
       caught it: *"We don't measure that, nor can we 'show the work'
       conclusively that that's the case, so why do we include that snippet?"*
       He is right, and on this page of all pages. The replacement is not a
       deletion: the archive has counted the EFFECT for as long as the site has
       existed, it is the front door's own headline, and it was sitting one
       document away. So the claim is made by two published counts instead of by
       an assertion about what teams do. `evidence` in `methods()` reads them. */
    evidenceLead: 'Why the score has to be tied \u2014 the site\u2019s own count, over '
                + 'every game it holds. Two different counts of two different '
                + 'things, so the totals differ:',
    evidenceTail: 'Shot attempts on their own point the wrong way: the team with '
                + 'more of them lost slightly more often than it won. Filter to '
                + 'even strength with the score level and that turns around. '
                + 'That is what the condition is doing.',
    caveat: 'An attempt is an attempt. A point shot from sixty feet counts here '
          + 'exactly the same as a tip at the edge of the crease, and this number '
          + 'cannot tell them apart \u2014 which is why the slot number below exists '
          + 'alongside it. It is also a slice of the game rather than the game: '
          + 'strictly five skaters a side, and only while the score is tied.' },
  dmen: {
    count: 'shot attempts taken by a player the roster lists as a defenceman',
    of: 'every shot attempt by that team',
    why: 'You can see this one from the first shift: does the puck keep going back '
       + 'out to the blue line, or does this team work it down low? And it is close '
       + 'to independent of who has the puck, so it tells you something the number '
       + 'above does not.',
    caveat: 'Two things. Defenceman is what the roster says, not a judgement '
          + 'about where a player actually played \u2014 a forward who spent the '
          + 'season up on the point still counts here as a forward. And this one '
          + 'counts every attempt a team took, including on the power play, where '
          + 'the setup puts more pucks on the points: a team that draws a lot of '
          + 'penalties is partly being described by its power play.' },
  slotShare: {
    count: 'shot attempts from inside the slot \u2014 the area in front of the net '
         + 'that most goals come from',
    of: 'that team\u2019s attempts the league recorded a location for',
    why: 'Where a team shoots from, rather than how often. The slot we use is the '
       + 'same shape the replay shades, so you can watch a shot being counted '
       + 'instead of taking our word for it.',
    caveat: 'The location is the league\u2019s, written down by hand in the '
          + 'building. Attempts with no location recorded are left out of both '
          + 'halves of the division rather than counted as "outside". And like '
          + 'the number above it, this counts every situation, so a team with a '
          + 'lot of power-play time is partly being described by its power play.' },

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
    caveat: 'About a quarter of penalties never give the other team a power '
          + 'play. Offsetting minors, misconducts, and penalties taken while a '
          + 'team is already short-handed are the obvious explanations, and we '
          + 'have counted none of them. That is not a limit of the feed \u2014 all '
          + 'three look countable from what we already store, and we have simply '
          + 'not done it. So we state the gap and do not explain it.' },
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
    /* ⛔ "so tired players have to stay out" WAS HERE AND HAS BEEN CUT TWICE.
       Kevin: *"I remember we cut this phrase once, but it snuck back in."* We
       measure shift lengths; we do not measure fatigue, and whether the players
       caught out there are tired is exactly the kind of thing this page is for
       refusing. The RULE is the consequence, and the rule is checkable. */
    why: 'The other stoppage a newcomer cannot read, and the one whose '
       + 'consequence you can watch: the team that iced the puck may not change '
       + 'its line before the faceoff, and the faceoff is all the way back in '
       + 'its own end.',
    caveat: 'Read the same way as offside, from the restart faceoff and the rule, '
          + 'and it carries the same risk. Where our reading disagrees with the '
          + 'rulebook, that is evidence about our reading first.' },
  attempts: {
    unit: 'of every 100 attempts reached the goalie',
    label: 'Where a shot attempt ends',
    count: 'attempts of each ending \u2014 reached the goalie, blocked, missed',
    of: 'every shot attempt in the archive',
    /* ⛔⛔ THIS PROSE NAMED TWO THINGS THAT ARE NOT THERE, and they were not there
       on EITHER surface. It promised a single bar — nothing draws one, here or on
       the methods page — and it pointed at "the possession number above", where
       what sits above is how often a team ices the puck. Kevin, 2026-09-30,
       reading the Attempts door: *"there is no 'possession number'."*

       ⭐ IT WAS WRITTEN FOR A NEIGHBOUR IT NO LONGER HAS. A `why` travels with its
       figure to every surface that draws it, so a sentence about what is beside it
       is a sentence that is true in at most one place. This one says only what is
       true of the figure itself, wherever it is read.

       ⚠️ AND IT CANNOT GO STALE. It used to state the share in words — "about half"
       — beside a number published weekly, so a feed that moved to 60% would have
       left the prose quietly wrong. It now describes THE REST of the split, which
       is whatever the printed figure is not. */
    /* ⛔⛔⛔ AND THE FIRST REWRITE OVER-CLAIMED IN THE OTHER DIRECTION. It said an
       attempt "ends in exactly one of three ways: it reaches the goalie, a
       DEFENDER blocks it, or it misses the net" — a taxonomy of the ICE, and
       false. Kevin, 2026-09-30: *"the shot could be deflected by a teammate, the
       shot could hit a teammate too, there are (at least) 5 ways a shot attempt
       could end."* Right, and the tell was already in the document: the archive's
       own published description of that bucket reads *blocked by a BODY*, which
       is the hedge my sentence removed.

       ⭐ WHAT IS TRUE IS A FACT ABOUT THE RECORD, AND IT IS ALREADY GATED. Every
       attempt carries exactly one of the four recorded types and they sum to the
       denominator — `test/measure.test.js`, *the archive shares are of ATTEMPTS*,
       asserts both halves against the producer, so it holds for any archive and
       not merely for this week's. That is the property this sentence rests on,
       and it survives the ice being messier than three words. The numbers are
       deliberately NOT quoted here: a sum typed into a comment beside a document
       rewritten every Monday is a claim with a half-life.

       ⏹ AND THE MESSINESS MOVED TO THE CAVEAT, which is the section that asks
       what could be wrong with it — rather than being answered by a `why` that
       simply did not mention it. */
    why: 'Every attempt in the archive is filed as ending one of three ways \u2014 it '
       + 'reached the goaltender, a body blocked it, or it missed the net \u2014 and '
       + 'the three account for all of them with none left over. That is what '
       + 'makes the figure above readable on its own: an attempt it does not '
       + 'count is one the goaltender never had to face.',
    /* ⛔ AND THE CAVEAT SPOKE TO THE WRONG READER. Kevin: *"this sentence doesn't
       really talk to our audience \u2014 even though it's geared toward the
       #fancystats crowd, it still needs to be understandable by all."* It leaned
       on two scorer's categories in quotation marks, named the person only as
       "a person in the arena", and closed on house vocabulary. Same three claims,
       said the way you would say them out loud: it is a human call, we measured
       how far apart the rinks are, and that measurement constrains what we are
       willing to publish. */
    caveat: 'Three headings are coarser than what happens on the ice \u2014 a puck '
          + 'deflected off a teammate still has to be filed under one of them \u2014 '
          + 'and somebody in the arena decides which. Whether a shot that did not '
          + 'go in was stopped by the goaltender or simply missed the net is that '
          + 'person\u2019s call, and rinks do not all make it the same way. We '
          + 'measured how far apart they are, which is why we never put a number '
          + 'beside a club when that judgement is what the number rests on.' },
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
 * A LEAGUE ROW JOINED TO THE WORDS THAT EXPLAIN IT — one per published counter.
 *
 * ⛔ THE ROW COMPUTED ITS OWN DIVISION AND THIS PASSES IT ALONG; NOTHING HERE
 * DIVIDES. "power-play goals out of power plays" is a sentence and
 * "5,011 ÷ 22,872 = 21.9" is the work, and two spellings of one division is how
 * a card and its own explanation come to disagree about what the card says.
 */
export function leagueFigures(measures) {
  return leagueRows(measures).map(row => {

    /* THE n, WHICHEVER FORM THIS ROW CARRIES IT IN. A shift row counts shifts and
       a whistle row counts games; both are "what it was measured over" and the
       page prints the one the row actually has. */
    const over = row.games != null ? { n: row.games, unit: 'games' }
               : row.n != null ? { n: row.n, unit: 'shifts' } : null;
    return { key: row.key, anchor: anchorFor(row.key),
      ...DERIVATION[explains(row.key)],
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
}

/** Every key this table can explain. The gate compares it against the card. */
export const EXPLAINED = Object.keys(DERIVATION);

/**
 * What a figure is called, for a surface that links to it rather than renders it.
 *
 * ⭐ THE REPLAY'S LAYER DOORS NEED THIS AT BUILD TIME. Stoppages opens three
 * sections — penalties, offsides, icings — and three links all reading "How we
 * counted this" would be a menu with no labels on it. The labels are baked into
 * `data/layer-rules.json` by node and injected, so the game page carries the
 * label and not the machinery that produced it.
 */
export function explainedLabel(key) {
  const e = DERIVATION[key] || PRINTED[key];
  return e ? e.label : null;
}

export { DERIVATION };
