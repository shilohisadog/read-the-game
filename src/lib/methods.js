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
import { anchorOf, anchorFor, explains, EXPLAINED_ROWS } from './anchors.js';

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
 * ⭐⭐⭐ THE FIGURES THE REST OF THE SITE PRINTS, AND WHY THEY ARE A SECOND TABLE.
 *
 * `DERIVATION` explains the preview card's rows, and `keysOf()` asks the CARD
 * what those are so that the two lists cannot drift apart. The front door and
 * `what-you-can-see.html` print seventeen more figures that are not card rows at
 * all — how often a shot from the slot goes in, what the power play does to the
 * pace, what the scoreboard does to it, what a zone start is worth — and on
 * 2026-09-24 not one of them had a door to anything. A reader following Kevin's
 * standing rule from the front door arrived at a LESSON, which teaches what the
 * thing is and says nothing about how it was counted. That is the same
 * conflation `methods.js` was built to end, one surface further out.
 *
 * ⛔⛔ AND AN ENTRY HERE MAY NOT TYPE ITS OWN `count` AND `of`. Every row in
 * `DERIVATION` carries two sentences written HERE, one file away from the
 * arithmetic that makes them true, and the only thing stopping them drifting is
 * that somebody re-reads both. For these four there is no need to take that
 * risk: `archive.js` has always published a `what` beside its shares, and as of
 * 2026-09-24 `census.js` does too — in the same document this page already
 * fetches. So the sentence a reader is shown IS the sentence the measurement
 * travels with, read at render time, and `test/methods.test.js` fails an entry
 * that grows a `count` or an `of`. `why` and `caveat` stay written here because
 * they are ARGUMENTS about a figure rather than descriptions of it, and an
 * argument has no published field to read.
 *
 * ⭐ EACH `read` NAMES ITS THREE FIELDS RATHER THAN INFERRING THEM. `count ÷ n`,
 * `attempts ÷ minutes` and `atk ÷ n` are three spellings of one idea and the
 * document is not going to unify them; a resolver that guessed which field was
 * the numerator would be a second place the shape of the archive is written
 * down. Naming them makes the path greppable: a reader can open `measures.json`
 * at `census.endZone`, find `atk` and `n`, and do the division themselves.
 *
 * ⚠️ `is` IS A LABEL AND NOT A DESCRIPTION. It says WHICH published object a
 * line is reading — "on the power play", not what a power play is — because the
 * field name (`ppFor`) is ours and means nothing to a reader. Anything that
 * describes the MEASUREMENT belongs in the published `what`.
 */
const PRINTED = {
  slotGoals: {
    label: 'How often a shot from the slot goes in',
    where: 'The front door, the Shots from the slot card on What you can '
         + 'see here, and the Shots from the slot rule page.',
    reads: [
      { is: 'From inside the slot', at: ['slot', 'scoredFromInside'],
        num: 'count', den: 'n', out: 'rate', as: 'ratio', unit: '%' },
      { is: 'From outside it', at: ['slot', 'scoredFromOutside'],
        num: 'count', den: 'n', out: 'rate', as: 'ratio', unit: '%' },
    ],
    why: 'It is what turns the shaded patch in front of the net from a piece of '
       + 'decoration into a fact. A first-time watcher is told that shots from '
       + 'there are better ones; this says how much better, and the answer is a '
       + 'factor of three and a half rather than a nudge.',
    caveat: 'Three things, and the third is the one that matters. Blocked '
          + 'attempts are out of both counts, so this is how often a shot that '
          + 'got through goes in, not how often a shot is worth taking. The '
          + 'boundary is our line drawn on the league’s coordinates, and '
          + 'those coordinates are recorded by a person in the building. And it '
          + 'counts where a shot was TAKEN, not what a team did to get there: a '
          + 'shot from the slot is partly the reward for something that already '
          + 'went right, so this cannot tell you that the same shot moved '
          + 'twenty feet in would go in three times as often.' },
  pace: {
    /* ⛔ THIS LABEL SAID "an hour of hockey" AND THAT IS A DIFFERENT NUMBER.
        `census.pace` counts one CLUB's attempts against the minutes that club
        played, so an hour of even-strength hockey holds about 117 of these
        between the two of them — not 59. A label on the methods page that
        doubles a figure is the worst place on the site to be loose. */
    label: 'How many shot attempts a club takes in an hour',
    /* ⛔ AND THIS USED TO CLAIM THE GAME PAGE TOO. It does not print this
       figure: the box under the ice counts attempts, and the per-60 rate is
       printed on exactly one surface. Measured by grepping the built pages for
       the substituted clause, after a first version asserted the surface from
       memory — which is the flattering direction on a question nobody had
       asked. ⏭ The gate that makes this mechanical arrives with the doors. */
    where: 'The All situations card on What you can see here.',
    reads: [
      { is: 'On the power play', at: ['census', 'pace', 'ppFor'],
        said: ['census', 'pace'], num: 'attempts', den: 'minutes', out: 'per60',
        as: 'scaled', denUnit: 'minutes', unit: 'per 60 minutes' },
      { is: 'At even strength', at: ['census', 'pace', 'even'],
        said: ['census', 'pace'], num: 'attempts', den: 'minutes', out: 'per60',
        as: 'scaled', denUnit: 'minutes', unit: 'per 60 minutes' },
      { is: 'A skater short', at: ['census', 'pace', 'ppAgainst'],
        said: ['census', 'pace'], num: 'attempts', den: 'minutes', out: 'per60',
        as: 'scaled', denUnit: 'minutes', unit: 'per 60 minutes' },
    ],
    why: 'Because the box under the ice counts every situation together, and a '
       + 'club that has spent ten minutes on the power play is not being '
       + 'compared like for like with one that has not. This is the size of '
       + 'that effect, so a reader can tell how much of an attempt lead is the '
       + 'team and how much is the referee.',
    caveat: 'A rate over minutes is not a rate over chances: a power play is '
          + 'also a period of play in which one club is TRYING to shoot, and '
          + 'this cannot separate the extra skater from the intent. The two '
          + 'sides of a penalty are divided by the same minutes on purpose, '
          + 'counted once from each side, which is why the pair can be read '
          + 'against each other and why neither can be added to the other.' },
  scoreEffects: {
    label: 'What the scoreboard does to the same number',
    where: 'The front door, and the Score effects card on '
         + 'What you can see here.',
    reads: [
      { is: 'While trailing', at: ['census', 'pace', 'evenTrail'],
        said: ['census', 'pace'], num: 'attempts', den: 'minutes', out: 'per60',
        as: 'scaled', denUnit: 'minutes', unit: 'per 60 minutes' },
      { is: 'While the score is level', at: ['census', 'pace', 'evenTied'],
        said: ['census', 'pace'], num: 'attempts', den: 'minutes', out: 'per60',
        as: 'scaled', denUnit: 'minutes', unit: 'per 60 minutes' },
      { is: 'While leading', at: ['census', 'pace', 'evenLead'],
        said: ['census', 'pace'], num: 'attempts', den: 'minutes', out: 'per60',
        as: 'scaled', denUnit: 'minutes', unit: 'per 60 minutes' },
    ],
    /* ⚠️ IT USED TO SAY "the first figure on this page", which is a claim about
       ORDER rather than about a measurement, and the order is decided by
       `CLUB_ROWS` two files away. Naming the figure costs nothing and cannot
       drift. */
    why: 'It is the evidence behind the condition on the 5-on-5 number above. '
       + 'That one is measured only while the score is level, '
       + 'and this is why: the same clubs, at the same strength, take a '
       + 'measurably different number of attempts depending on nothing but the '
       + 'scoreboard. Part of any attempt lead is the time a club spent behind.',
    caveat: 'These three are cut out of even strength, so the pulled goalie — '
          + 'which is a club trailing with six skaters — is not in them. That '
          + 'is deliberate, because it is the obvious reply to the finding. What '
          + 'remains is still a description and not a cause: a club that is '
          + 'behind is also, on average, the weaker club that night, and this '
          + 'measurement cannot take that apart.' },
  zoneStarts: {
    label: 'What a face-off in one end is worth',
    where: 'The front door, and The attacking zone card on '
         + 'What you can see here.',
    reads: [
      { is: 'The club attacking that end', at: ['census', 'endZone'],
        num: 'atk', den: 'n', out: 'atkPerDraw', as: 'ratio',
        unit: 'attempts per face-off' },
      { is: 'The club defending it', at: ['census', 'endZone'],
        num: 'def', den: 'n', out: 'defPerDraw', as: 'ratio',
        unit: 'attempts per face-off' },
    ],
    why: 'It prices the blue-line band. A novice is told that where a face-off '
       + 'is taken matters; this says by how much, in the only currency the '
       + 'record holds — shot attempts before the next whistle.',
    caveat: 'It says nothing at all about the contest AT the line, which is '
          + 'what the shaded band is drawn around: holding a blue line produces '
          + 'no event in the record, so there is nothing to count. And a draw in '
          + 'one end is not randomly assigned — the club already pressing is '
          + 'the club that gets them — so part of this gap is the teams and '
          + 'not the place.' },
};

/**
 * ⭐ ONE FIELD OUT OF THE PUBLISHED DOCUMENT, OR NULL.
 *
 * Every read is null-safe the whole way down, because a document that predates a
 * field is the ordinary case on this site and not an error: `measures.json` is
 * republished weekly and the page is fetched by whoever arrives. The page
 * degrades by saying which half is missing — see `printed()`.
 */
function at(measures, path) {
  return path.reduce((o, k) => (o == null ? null : o[k]), measures);
}

/**
 * ⭐ THE TABLE ITSELF IS EXPORTED SO THE GATE CAN LOOK AT IT, and that is not a
 * convenience. `printed()` builds its result field by field, so an entry that
 * grew a typed `count` would never reach the output and a test reading the
 * OUTPUT would report the rule as kept — a check asking a narrower question than
 * it announces, which is the failure this project keeps paying for. The rule is
 * about what is WRITTEN here, so the gate reads what is written here.
 */
export { PRINTED };

/** Every figure printed elsewhere on the site that this page explains. */
export const PRINTED_KEYS = Object.keys(PRINTED);

/**
 * The entries for the third section: one per figure, each carrying the published
 * arithmetic and the published sentence that says what it is.
 *
 * ⛔ A READ WHOSE NUMBERS OR WHOSE SENTENCE ARE MISSING IS DROPPED AND COUNTED,
 * never rendered half-built. The alternative — a figure with no sentence — is a
 * number with no derivation, on the one page that exists to refuse those, so
 * `missing` travels out and the page says which half it lost.
 *
 * ⭐⭐ AND A PUBLISHED SENTENCE IS PRINTED ONCE PER PAGE, NOT ONCE PER FIGURE.
 * `pace` and `scoreEffects` are two different figures cut out of ONE published
 * measurement, so they read one `what` between them — and rendering it under
 * both would put the same paragraph on the page twice. That is the defect
 * `FIGURE_CLAUSE` closed on the front door the day before this was written,
 * arriving from the other direction: not one statement written twice, but one
 * statement READ twice. So the first entry to reach a sentence prints it and
 * every later one carries `sameAs`, the anchor of the section that has it.
 */
export function printed(measures) {
  /* path → the anchor of the first entry that printed that sentence. Built as
     the list is walked, which is why this is a map rather than a second pass:
     the order entries are rendered in IS the order they claim a sentence in. */
  const seen = {};
  return PRINTED_KEYS.map(key => {
    const e = PRINTED[key];
    const anchor = anchorOf(key);
    const groups = [], missing = [];
    e.reads.forEach(r => {
      const o = at(measures, r.at);
      const from = (r.said || r.at).join('.');
      const sentence = at(measures, r.said || r.at);
      const path = r.at.join('.');
      /* ⛔ THE REASON TRAVELS WITH THE PATH. The page says out loud what it
         could not show, and "no description published for X" and "no figures
         published for X" are two different confessions — one of them ours to
         fix in `census.js` and the other a stale document. A single `missing`
         list would have the page announcing a narrower claim than it knows. */
      if (!o || o[r.num] == null || !o[r.den] || o[r.out] == null) {
        missing.push({ path, why: 'figures' }); return;
      }
      if (!sentence || !sentence.what) {
        missing.push({ path, why: 'description' }); return;
      }
      /* ⭐ GROUPED UNDER THE SENTENCE THAT DESCRIBES THEM, not listed and then
         described. The published `what` for the slot reads "…this many were
         goals", and "this many" has to have a number immediately above it or
         the reader is reassembling the page in their head. Three rates that
         share one sentence group under it; two that have one each sit under
         their own. */
      let g = groups.find(x => x.from === from);
      if (!g) {
        groups.push(g = { from, what: sentence.what, sameAs: seen[from] || null,
                          lines: [] });
        if (!seen[from]) seen[from] = anchor;
      }
      g.lines.push({ is: r.is, from: path, as: r.as, unit: r.unit,
                     denUnit: r.denUnit || null,
                     count: o[r.num], n: o[r.den], value: o[r.out] });
    });
    return { key, anchor, label: e.label, where: e.where,
             why: e.why, caveat: e.caveat, groups,
             lines: groups.reduce((n, g) => n + g.lines.length, 0),
             missing: missing.length ? missing : null };
  });
}

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

  const frame = leagueRows(measures).map(row => {
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
           /* ⭐ THE THIRD SECTION RIDES ALONG rather than being a second fetch.
              The page grabs one document and calls one function; a surface that
              had to remember to call two would eventually call one. */
           printed: printed(measures),
           /* The archive the league frame was counted over, so the page can say
              it once above the tiles instead of on each of them. */
           games: c && c.games != null ? c.games : null };
}
