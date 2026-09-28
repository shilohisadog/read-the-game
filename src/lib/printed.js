/**
 * EVERY FIGURE THE REST OF THE SITE PRINTS, AND THE ARITHMETIC BEHIND IT.
 *
 * ⭐⭐⭐ WHY THIS IS NOT IN `methods.js` ANY MORE — 2026-09-26. It was, and the
 * split is the same move `anchors.js` made in the same week, for the same
 * measured reason. Kevin's overlay puts this table on the REPLAY: pressing
 * `Is that a lot?` beside a layer draws that layer's figures over the rink. The
 * replay therefore has to carry whatever `printed()` needs — and `methods.js`
 * imports `CLUB_ROWS`, `POSSESSION_FAMILY` and `leagueRows` from `preview.js`
 * for its OTHER half, the preview card's derivation catalogue, which the replay
 * never draws. Inlining the whole of it would have put 63KB on `game.html` to
 * reach 18KB of it, and left the game page holding a second module it uses no
 * part of.
 *
 * ⛔ AND THE ALTERNATIVE WAS WORSE THAN BYTES. Shipping `methods.js` without
 * `preview.js` beside it would have WORKED — `CLUB_ROWS` is referenced only
 * inside functions the replay never calls — which is exactly the kind of thing
 * that works until somebody adds one call. A module whose correctness depends on
 * which of its functions a page happens to invoke is not a module.
 *
 * The line is a real one: what is in this file is the figures the site PRINTS
 * and the published arithmetic behind them. What stayed in `methods.js` is the
 * derivation catalogue for the preview card's rows. `methods.js` imports and
 * re-exports these three, so nothing that already read them had to change.
 */
import { anchorOf } from './anchors.js';

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
  slotAttempts: {
    /* ⛔⛔ THE THIRD MEASUREMENT CALLED "SLOT", AND THE REASON IT IS ITS OWN
       ENTRY. `slotGoals` is how often a shot from there goes in; the CARD's
       `slot` row is one club's share of its own attempts taken from there, and
       this is the LEAGUE's share of every located attempt. Three denominators,
       one noun. The figure under the drawing on `slot.html` first pointed at the
       card row's derivation, which is the same definition over a different
       population — so the door resolved, rendered, and would have answered a
       reader's "where did 46.7% come from?" with r = 0.72 over 38 games. Caught
       by the gate that requires a door's section to show a number the copy
       shows, which is the one check here that is not circular. */
    label: 'How many shot attempts are taken from the slot',
    where: 'The note under the drawing on the Shots from the slot rule page.',
    reads: [
      { is: 'Taken from inside the slot', at: ['slot', 'attempts'],
        num: 'count', den: 'n', out: 'rate', as: 'ratio', unit: '%' },
    ],
    why: 'It is the reply to the obvious objection. "Shots from the slot go in '
       + 'three and a half times as often" invites "that is because that is '
       + 'where everybody shoots" — and the reply is half right, which is '
       + 'worth printing rather than arguing with. Nearly half of all located '
       + 'attempts are already taken from inside it, and the conversion gap '
       + 'survives that.',
    caveat: 'A blocked attempt is not in either count, and that is not '
          + 'tidiness: the coordinate the feed records for a block is where the '
          + 'puck was STOPPED, which is the blocker\u2019s position rather than '
          + 'the shooter\u2019s. Counting those would put attempts in the slot '
          + 'that were taken from the point. The boundary is also ours — 33 '
          + 'feet from the net and 22 from centre — drawn on coordinates a '
          + 'person in the building recorded.' },
  saves: {
    /* ⭐ THE ONE ENTRY HERE THAT IS NOT ON A STATIC PAGE. Every other figure in
       this table is printed in prose the builder substitutes; this one is
       printed by the REPLAY, once per game, by the Goaltending layer. A reader
       watching a save percentage build in front of them has exactly the same
       question a reader of the front door does, and until now the layer could
       only answer it with its own counting rule — true, and silent about what
       ordinary looks like. */
    label: 'How often a goaltender makes the save',
    /* ⚠️ NO `where`, AND THAT IS NOT AN OMISSION. This figure is printed on no
       static page at all — the Goaltending layer builds it in front of a viewer,
       once per game — and the line saying so is DERIVED from the layer
       descriptors rather than typed here. A `where` would have been the same
       sentence twice on one screen, which is the defect `FIGURE_CLAUSE` closed
       on the front door. The gate requires a figure to say where a reader met
       it; it does not require that sentence to be typed. */
    reads: [
      { is: 'Saved', at: ['attemptMix', 'saveFraction'],
        num: 'count', den: 'n', out: 'rate', as: 'ratio', unit: '%' },
    ],
    why: 'It is the number a first-time watcher will hear all night and the one '
       + 'they are least equipped to read: .900 sounds like a school grade and '
       + 'is in fact roughly average. Printing what ordinary is turns the '
       + 'figure on screen from a score into a comparison.',
    /* ⚠️ THIS SAID "THE DENOMINATOR", AND THE COLD-READER GATE CAUGHT IT. That
       is a word only we use, on the page whose whole subject is being checkable
       by somebody who does not work here. What it divides by can be said in the
       words a reader already has. */
    caveat: 'What it divides by is the shots the goaltender actually FACED, so '
          + 'an empty-net goal is in neither half and a shootout attempt is out '
          + 'altogether. It also treats every shot as one shot: a tip from the '
          + 'edge of the crease and a point shot through clean air count the '
          + 'same, which is most of what separates two goaltenders with the '
          + 'same number.' },
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
    /* ⛔⛔⛔ THIS PROSE POINTED AT THINGS THE READER CANNOT SEE, and both
       surfaces that print it are surfaces where they are not on screen. It read
       *"It prices the blue-line band"* and *"which is what the shaded band is
       drawn around"*. On `how-we-measure.html` there is no rink at all; in the
       overlay over the replay there is one and the panel sets it to
       `visibility:hidden` — measured on production 2026-09-28, both the band and
       the ice, while those exact sentences were on screen.

       ⭐⭐ THE COST WAS A FALSE BUG REPORT FROM THE PERSON WHO BUILT IT. Kevin
       read this card with the Zone starts layer ON and concluded the shading had
       been removed, because the only place the band was named was a paragraph
       covering it up. When a sentence's referent is invisible, a reader does not
       conclude *I cannot see it* — they conclude *it is not there*.

       ⭐ AND IT NAMES NO GEOMETRY, deliberately. The band's width has exactly one
       source — `ZONE_BAND_FT` in `rink.js`, measured off the paint — and
       spelling "five feet either side" here would be a fourth prose copy of a
       constant, which is the open debt this project already carries for the
       slot. The sentence says what the QUESTION is; the shape stays where it is
       defined. */
    why: 'It prices the place a face-off is taken. A novice is told that where a '
       + 'draw happens matters; this says by how much, in the only currency the '
       + 'record holds — shot attempts before the next whistle.',
    caveat: 'It says nothing at all about the contest AT the blue line, which is '
          + 'a different question and one the record cannot answer: holding a '
          + 'line produces no event, so there is nothing to count. And a draw in '
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
