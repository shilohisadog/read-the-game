/**
 * What the whole archive says — the collection, not a game.
 *
 * Everything here is a SORT or a COUNT over numbers the league quoted and events
 * we counted. Nothing is modelled, nothing is estimated, and the rule that
 * produced each number travels with it, because a rate without its reference
 * class is precisely what Doctrine §8 exists to stop.
 *
 * SCOPE. NHL regular season and playoffs only. Preseason, the Olympics, the
 * 4 Nations Face-Off and the All-Star game are archived, derived and viewable —
 * and never enter a computed number. A base rate pooled across preseason split
 * squads, national teams under different roster rules and an All-Star game is
 * not a claim about NHL hockey; it is an average over four competitions.
 *
 * THIS DECIDES WHAT A NOVICE SEES FIRST, which makes its failure mode "choosing
 * well from a bad rule" rather than crashing. See test/archive.test.js for the
 * two guards that run in opposite directions.
 */

import { typeOf, isLeague } from './competitions.js';
import { distribution } from './distribution.js';

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

/**
 * A base rate, stated so it cannot be quoted without its reference class.
 *
 * `n` counts only games where the measure HAD an edge — 162 real games have
 * equal shots on goal, and there is no honest way to say whether the team with
 * more shots lost one of them. Counting them as "did not lose" would shift the
 * rate; dropping them without adjusting `n` would misstate it.
 *
 * `rate` is null rather than 0 over an empty population: 0 reads as a measured
 * finding, and "we measured nothing" is a different statement from "it never
 * happened".
 */
function eligible(g, pick) {
  const [h, a] = pick(g);
  if (h === a) return null;                 // no edge — not a case, either way
  if (g.score.h === g.score.a) return null; // no winner; NHL games always have one
  // `edge` is the size of the lead on the measure, sign discarded: the question
  // is how lopsided the game was, not which bench it favoured.
  return { edge: Math.abs(h - a), lost: (h > a) !== (g.score.h > g.score.a) };
}

function rateOf(records, pick, what) {
  let n = 0, count = 0;
  for (const g of records) {
    const e = eligible(g, pick);
    if (!e) continue;
    n++;
    if (e.lost) count++;                    // led the measure, lost
  }
  return { what, population: POPULATION, n, count, rate: n ? count / n : null };
}

/**
 * The same question asked at every cutoff: of the games where a team led control
 * while level BY k OR MORE, how many did it lose?
 *
 * WHY A CURVE AND NOT A BUCKETING. The per-game sentence needs a reference class
 * for THIS game's edge, and +1 and +33 cannot honestly share one — the published
 * 39.6% counts them the same. Buckets (1–3, 4–7, 8+) would be boundaries WE chose;
 * "k or more, for every k" is a complete function with no choices in it, and the
 * game supplies k. That is the difference between a threshold and a lookup.
 *
 * WHAT THE TAIL IS, said here because the number will be read without this file.
 * `n` falls away fast, and a fraction over ten games carries almost no
 * information: at n=10 a 95% interval around the base rate spans roughly 17% to
 * 68%. Shrinking `n` does not bias the estimate — it widens it — so the tail is
 * not "thin", it is UNINFORMATIVE, and the danger is that it reads as specific
 * (CHENG). Two consequences, both binding on anything that renders this:
 *
 *   the rate is printed as a FRACTION, never a bare percentage. "6 of 10" is
 *   self-limiting in a way "41%" is not, and it needs no minimum-n threshold —
 *   which would be a parameter with no source.
 *
 *   it is never drawn as a CHART. The tail will not be monotone in RATE and will
 *   wobble on sample size alone; plotted, the eye interpolates and the wobble
 *   reads as a trend. One row at a time, as a sentence, it cannot.
 *
 * `n` IS monotone — it can only fall as k rises, because the population is nested
 * — and that is asserted in the tests as a structural invariant.
 *
 * Each game is counted in its own reference class. This describes the archive
 * rather than predicting anything, so removing a game from the population it
 * belongs to would make the count wrong to avoid a problem it does not have.
 */
export function levelCurve(records) {
  const cases = [];
  for (const g of records) {
    const e = eligible(g, x => [x.level, 0]);
    if (e) cases.push(e);
  }
  const max = cases.reduce((m, c) => Math.max(m, c.edge), 0);
  const rows = [];
  for (let k = 1; k <= max; k++) {
    let n = 0, count = 0;
    for (const c of cases) {
      if (c.edge < k) continue;
      n++;
      if (c.lost) count++;
    }
    rows.push({ k, n, count });
  }
  return rows;
}

/**
 * The row a game with this edge should be read against, or null.
 *
 * Null when the archive holds no game that lopsided — which happens only for a
 * game the measured set does not contain, such as one ingested since the last
 * derive. A page that gets null must SAY the comparison is missing rather than
 * printing "0 of 0" or quietly dropping the clause.
 */
export function rowFor(curve, diff) {
  const k = Math.abs(diff);
  if (!k) return null;
  return curve.find(r => r.k === k) || null;
}

/**
 * Every lens's per-game count, distributed, keyed by SEASON and then by the
 * page's own lens ids. See the measurement above for why the season key exists.
 */
export function perGame(records) {
  // Keyed by the PAGE'S lens ids, so the selector and the reference class name
  // the same things — the human label is the chip's, and lives in `what`.
  /* Each lens twice: the full statement of what was counted, and the NOUN a
     sentence uses. Both travel with the number for the same reason the
     population does — a summary that says "55 goaltending" is a label nobody
     wrote, and one that reaches for its own wording is a second vocabulary. */
  const said = {
    corsi: ['shot attempts by both clubs in one game, at all strengths', 'shot attempts'],
    slot: ['shot attempts from inside the slot, both clubs, in one game', 'shots from the slot'],
    blocked: ['attempts a body stopped, both clubs, in one game', 'blocked shots'],
    goaltending: ['shots the two goaltenders faced between them in one game',
                  'shots the goaltenders faced'],
    whistle: ['whistles that stopped play in one game', 'stoppages'],
  };
  const bySeason = {};
  for (const g of records) (bySeason[season(g.id)] ||= []).push(g);
  const out = {};
  for (const y of Object.keys(bySeason).sort()) {
    // ⭐ THE POPULATION IS WELDED TO THE NUMBER, and here that is the whole
    // point: these figures are narrower than every other `population` in this
    // file, and a reader who carries the archive-wide meaning across would be
    // quoting a season as though it were the league.
    const pop = `${POPULATION}, ${seasonLabel(y)}`;
    out[y] = {};
    for (const k of Object.keys(said)) {
      // A record written before `lens` existed contributes nothing rather than a
      // zero: "we did not measure it" and "there were none" are different facts,
      // which is why `distribution` filters on Number.isInteger.
      out[y][k] = { ...distribution(bySeason[y].map(g => g.lens?.[k]),
                                    `${said[k][0]} (n counts GAMES, not events)`, pop),
                    noun: said[k][1] };
    }
  }
  return out;
}

/**
 * WHAT AN ATTEMPT TURNED INTO, over every attempt in the archive.
 *
 * A DIFFERENT KIND OF NUMBER FROM `rateOf`, and the difference is the whole
 * reason it is publishable. Every other figure in this file is an OUTCOME rate:
 * a team led some measure, and won or lost. This is a SHARE OF A POPULATION —
 * of all the attempts taken, this many were stopped by a body. There is no
 * winner in it, so there is no causal reading available to misread.
 *
 * That distinction is what killed the number this was written instead of.
 * "The team that blocked more won X% of the time" was the obvious rate and it is
 * not publishable at any sample size: the team that blocks more is the team that
 * attempted fewer 81.7% of the time, and the archive already says the attempts
 * leader loses 54.5%. The reference class is "teams that were being outshot", and
 * once stated honestly the sentence teaches nothing (CHENG,
 * docs/blocked-shots-layer.md §5 and §7).
 *
 * `n` HERE COUNTS ATTEMPTS, NOT GAMES, which is a different unit from every
 * other `n` in this file. It is named in `what` for that reason: a reader who
 * carries the games meaning across will be out by a factor of 120.
 */
/**
 * A share of a population, stated with the unit its `n` counts.
 *
 * Extracted because three different populations now need one — attempts, shots
 * a goalie faced, unblocked attempts with a location — and a second spelling of
 * `{ what, population, n, count, rate }` is a second chance to omit the `what`.
 */
export function share(count, n, what) {
  // `rate: null` over an empty population, for the reason stated at `rateOf`:
  // 0 reads as a finding, and "we measured nothing" is a different statement.
  return { what, population: POPULATION, n, count, rate: n ? count / n : null };
}

/**
 * ⭐ THE SAVE FRACTION, AND IT IS NOT A DIVISION OF THE TWO COUNTS BESIDE IT.
 *
 * `attemptMix.byType` publishes 211,764 shots on goal and 25,105 goals. Dividing
 * them looks exactly like the archive save fraction and is wrong by 0.47 points:
 * 5.0% of goals in play are scored into an EMPTY NET (101 of 2,028 over a
 * 325-game sample), and a goal nobody was in position to save is not a save
 * chance. The league excludes them and so must we.
 *
 * THERE IS NO BAD CODE PATH TO DELETE, which is what makes this shape new.
 * `byType` is correct — corsi is obliged to count an empty-net goal as a shot
 * attempt, and would be defective if it did not. Both operands are right; their
 * ratio is a third quantity nobody sanctioned. The defect is not a rule that
 * went missing from a second implementation, it is a plausible division left
 * available with no answer published next to it.
 *
 * So the fix is to publish the sanctioned number HERE, in the same object as
 * the counts that invite the wrong one — supply the right figure rather than
 * warn against the wrong one, the same move as an invariant instead of a
 * disclaimer. The arithmetic comes from `goaltending.js`, whose `&& e.goalie`
 * guard has excluded the empty net since long before anything read it, and
 * which is the ONLY place that rule is allowed to live.
 */
export function saveShare(records) {
  let faced = 0, saves = 0;
  for (const g of records) {
    if (!g.goalies) continue;         // an older record shape: counted, never guessed at
    for (const k of g.goalies) { faced += k.faced; saves += k.saves; }
  }
  return share(saves, faced,
    'of the shots a goalie actually faced, this many were saved — an empty-net '
    + 'goal is not among them, and neither is a shootout attempt '
    + '(n counts SHOTS FACED, not games, and is NOT goals + shots on goal)');
}

/**
 * ⭐ WHERE THE GOALS COME FROM — the one number the shaded slot needs and the
 * site has never published.
 *
 * The base layer paints a lozenge in front of each net and the legend has only
 * ever said WHERE it is: "within 33 ft of the net, between the dots". That is a
 * definition, not a reason. The reason is this share, and until now it existed
 * nowhere a page could read — not here, not in `measures.json`, not on any
 * surface — while being quoted in a design document as though it were settled.
 * That is the shape that shipped a wrong Corsi count once.
 *
 * THE DENOMINATOR IS PLACED GOALS, NOT ALL GOALS. A goal the feed gives no
 * coordinate for is neither inside the slot nor outside it; counting it in the
 * denominator would score it as "not from the slot" and quietly bias the share
 * downwards. `unplaced` is published beside the rate so the gap is stated rather
 * than hidden — the same reason `attemptMix` publishes `saveFraction` next to
 * the counts that invite the wrong division.
 */
/**
 * ⚠️⚠️ AND THE SHARE ABOVE DOES NOT SURVIVE THE FIRST OBJECTION ANYBODY MAKES.
 *
 * "Three of every four goals come from the slot" invites exactly one reply —
 * *"well, that is where everybody shoots"* — and the reply is half right.
 * Measured over a 600-game sample with this file's own rule, **46.8% of the
 * unblocked, located attempts are already inside the slot** (24,264 of 51,815)
 * against 76.4% of the goals. The effect is real, and the goals share alone
 * cannot show that it is: a share with no base rate beside it is a number that
 * is correct and loses the argument.
 *
 * So the base rate is published in the same object, which is `saveShare`'s move
 * exactly — supply the figure that settles it rather than warn against the one
 * that does not.
 *
 * ⭐ AND THE CONVERSION IS THE SANCTIONED DIVISION, CHECKED RATHER THAN ASSUMED.
 * `saveShare` exists because two correct counts had a ratio nobody sanctioned,
 * so the same question is asked here. In `builders/measure.mjs` the per-game
 * `slot` comes from `danger.reduce(events, lay)` and `located` from
 * `corsi.reduce(events, {...ctx, evenOnly: false})` filtered to `SHOT_TYPES`
 * with a coordinate — and `lay` sets `evenOnly: false` too. `danger` counts
 * exactly corsi's counted set narrowed to those same shot types with a
 * coordinate, so `slot` is a SUBSET of `located` and `goals.slot` a subset of
 * both. Numerator and denominator are the same population, which is the whole
 * of the test. `test/archive.test.js` asserts the containment per game rather
 * than trusting this paragraph.
 *
 * ⛔ EVERY RATIO HERE IS REPRODUCIBLE FROM THE PUBLISHED COUNTS. `count`/`n` on
 * each share, plus `attempts`, are enough for a reader to recompute all three
 * without trusting any of them — which is the only meaning of "locked in" that
 * survives somebody actually checking.
 */
/**
 * ⭐⭐ HOW FAR OUT EACH KIND OF ATTEMPT IS RECORDED — the site's sharpest piece of
 * self-disclosure, and until now it existed only in a comment.
 *
 * `src/lib/attribution.js` explains that a blocked shot's coordinate is the
 * BLOCKER's, not the shooter's, and therefore nearer the net than the shot was
 * taken. It cites a median 24.2 ft against 33.4 for a shot on goal — over an
 * EIGHTY-GAME SAMPLE, in prose, published nowhere a page could read. A reader
 * had to take the disclaimer on trust, which is the one thing this site asks of
 * nobody.
 *
 * ⛔ NO THRESHOLD, DELIBERATELY. "Beyond 50 ft" was the tempting form and 50 is a
 * number we would have chosen — a parameter with no source, which is the defect
 * `docs/game-sentence.md` §3 removed from the goalie card rather than argued
 * separately. A distribution states the whole shape and lets the reader pick the
 * cut; the blue line, if anyone wants one, is 64 ft out (`NET_X - BLUE_LINE_X`)
 * and comes from the rink rather than from us.
 *
 * A SHARE OF A POPULATION, NOT AN OUTCOME RATE — the distinction `attemptMix`
 * turns on. There is no winner in it, so there is no causal reading to misread.
 */
export function reachOf(records) {
  const by = {};
  for (const g of records) {
    if (!g.reach) continue;      // an older record shape: counted, never guessed at
    for (const [type, ds] of Object.entries(g.reach)) (by[type] ||= []).push(...ds);
  }
  const out = {};
  for (const type of Object.keys(by).sort()) {
    out[type] = distribution(by[type],
      `feet from the attacking net at which a ${type.replace(/-/g, ' ')} is RECORDED `
      + '(n counts EVENTS, not games; for a blocked shot this is where the puck was '
      + 'stopped, which is the BLOCKER\'s position and not where the shot was taken)',
      POPULATION);
    out[type].unit = 'events';
  }
  return out;
}

/**
 * ⭐ WHAT A GOALTENDER'S NIGHT LOOKS LIKE — as two integers, never as a rate.
 *
 * The novice question behind the goaltending card is "is .900 good?", and the
 * card deliberately does not answer it in those terms: `docs/game-sentence.md`
 * §3 made it print "33 of 35" always, because a percentage over a small
 * denominator needs a minimum-n threshold and twenty was a number we chose.
 *
 * So the anchor is published in the card's own idiom. Shots faced and goals
 * allowed are both INTEGERS, which `distribution` takes unchanged, and a reader
 * forms the fraction themselves — which is the whole of what the fraction rule
 * asks for.
 *
 * ⛔ AND NO MINIMUM-SHOTS FILTER, WHICH IS A MEASURED CHOICE RATHER THAN A
 * PREFERENCE. Over a 600-game sample the middle half of the save fraction is
 * .857-.935 with no filter, .857-.935 above ten shots faced and .864-.938 above
 * twenty. The threshold does not move the answer, so the honest form is the one
 * that does not have one. `test/measure.test.js` pins the population as EVERY
 * appearance.
 *
 * `n` HERE COUNTS GOALTENDER APPEARANCES, not games — two per game when both
 * teams' starters go the distance, more when anybody is pulled. Named in `what`
 * for the reason `attemptMix` names its own unit.
 */
export function goalieNight(records) {
  const faced = [], allowed = [];
  for (const g of records) {
    if (!g.goalies) continue;    // an older record shape: counted, never guessed at
    for (const k of g.goalies) { faced.push(k.faced); allowed.push(k.faced - k.saves); }
  }
  const said = '(n counts GOALTENDER APPEARANCES, not games, and excludes the shootout)';
  const one = (v, what) => {
    const d = distribution(v, what + ' ' + said, POPULATION);
    d.unit = 'appearances';
    return d;
  };
  return {
    faced: one(faced, 'shots one goaltender faced in one game'),
    allowed: one(allowed, 'goals one goaltender allowed in one game'),
  };
}

export function slotShare(records) {
  let goalsIn = 0, goalsPlaced = 0, unplaced = 0, seen = 0;
  let attIn = 0, attPlaced = 0, attSeen = 0;
  /* ⚠️⚠️ THE CONVERSIONS GET A THIRD PAIR OF ACCUMULATORS, AND A TEST FOUND OUT
     WHY. A record carrying goal placement but NOT attempt placement puts its
     goals in the conversion's numerator while its attempts never enter the
     denominator — `saveShare`'s defect exactly, rebuilt one function away, and
     no arithmetic check on the goals share or the base rate can see it. So a
     conversion counts a game only when the game supplied BOTH halves. In a real
     run every record carries both and all three agree; this makes that true by
     construction rather than by luck. */
  let cIn = 0, cGoalsIn = 0, cPlaced = 0, cGoalsPlaced = 0;
  for (const g of records) {
    if (g.goals) {               // an older record shape: counted, never guessed at
      seen++;
      goalsIn += g.goals.slot; goalsPlaced += g.goals.placed; unplaced += g.goals.unplaced;
    }
    // Counted under its OWN guard, so a record carrying one half and not the
    // other cannot silently shrink the other's denominator.
    if (g.slot && g.located) {
      attSeen++;
      attIn += g.slot.h + g.slot.a;
      attPlaced += g.located.h + g.located.a;
    }
    if (g.goals && g.slot && g.located) {
      cIn += g.slot.h + g.slot.a;
      cPlaced += g.located.h + g.located.a;
      cGoalsIn += g.goals.slot;
      cGoalsPlaced += g.goals.placed;
    }
  }
  const GEOM = 'within 33 ft of the attacking net and inside 22 ft of centre';
  return {
    ...share(goalsIn, goalsPlaced,
      'of the goals scored in play whose location the feed records, this many were '
      + `taken from inside the slot — ${GEOM} `
      + '(n counts GOALS, not games, and excludes the shootout)'),
    games: seen,
    unplaced,
    // ⭐ THE BASE RATE. Without it the goals share is unfalsifiable by a reader.
    attempts: share(attIn, attPlaced,
      'of the unblocked shot attempts whose location the feed records, this many were '
      + `taken from inside the slot — ${GEOM} `
      + '(n counts ATTEMPTS, not games, and a blocked shot is excluded because the '
      + 'coordinate the feed records for one is the BLOCKER\'s, not the shooter\'s)'),
    // ⭐⭐ AND THE ANSWER TO "that is just where everybody shoots": the same
    // attempt is far likelier to score from inside than from outside.
    scoredFromInside: share(cGoalsIn, cIn,
      'of the unblocked attempts taken from INSIDE the slot, this many were goals '
      + '(n counts ATTEMPTS, not games, over the games carrying BOTH goal and '
      + 'attempt placement)'),
    scoredFromOutside: share(cGoalsPlaced - cGoalsIn, cPlaced - cIn,
      'of the unblocked attempts taken from OUTSIDE the slot, this many were goals '
      + '(n counts ATTEMPTS, not games, over the games carrying BOTH goal and '
      + 'attempt placement)'),
    attemptGames: attSeen,
  };
}

function attemptMix(records) {
  const t = { goal: 0, 'shot-on-goal': 0, 'missed-shot': 0, 'blocked-shot': 0 };
  let games = 0;
  for (const g of records) {
    if (!g.mix) continue;      // an older record shape: counted, never guessed at
    games++;
    for (const k of Object.keys(t)) t[k] += g.mix[k] || 0;
  }
  const n = t.goal + t['shot-on-goal'] + t['missed-shot'] + t['blocked-shot'];
  const reached = t.goal + t['shot-on-goal'];
  const of = (count, what) => share(count, n, what);
  return {
    games,
    byType: t,
    // The goalie faced it: a goal or a save. The league's "shots on goal" is
    // exactly this pair, which is why goals are added rather than counted apart.
    reachedTheGoalie: of(reached,
      'of all shot attempts, this many reached the goalie (n counts ATTEMPTS, not games)'),
    neverReachedTheGoalie: of(n - reached,
      'of all shot attempts, this many never reached the goalie — blocked or missed '
      + '(n counts ATTEMPTS, not games)'),
    blocked: of(t['blocked-shot'],
      'of all shot attempts, this many were blocked by a body (n counts ATTEMPTS, not games)'),
    // Deliberately in THIS object and not a tidier one. See saveShare: it exists
    // to stand next to `byType`, whose two counts invite a division that is
    // wrong by half a point of save percentage.
    saveFraction: saveShare(records),
  };
}

/**
 * @param records  per-game measurements from builders/measure.mjs:
 *                 { id, homeAb, awayAb, score{h,a}, sog{h,a}, attempts{h,a}, level }
 *                 `level` is home-minus-away control while the score was level.
 */
export function summarise(records) {
  const games = records.filter(g => inScope(g.id));

  // The featured list: teams that controlled play while the score was level and
  // LOST. Controlling and winning is not a paradox and not a lesson — without
  // that condition the top of the list fills with teams that dominated and won.
  const featured = [];
  for (const g of games) {
    if (g.score.h === g.score.a) continue;
    const homeLost = g.score.h < g.score.a;
    const edge = homeLost ? g.level : -g.level;   // the loser's control edge
    if (edge > 0) {
      featured.push({ id: g.id, ab: homeLost ? g.homeAb : g.awayAb, edge });
    }
  }
  // Ties broken by id so the file diffs cleanly and input order cannot change
  // the output. Determinism is a property we assert, not one we hope for.
  featured.sort((x, y) => y.edge - x.edge || x.id - y.id);

  return {
    rule: 'even-strength shot attempts taken while the score was level, in regulation',
    scope: POPULATION,
    featured: featured.slice(0, 10),
    // The reference class for a single game's edge. See levelCurve.
    levelCurve: levelCurve(games),
    // What those attempts turned into. A share of a population, not an outcome
    // rate — see attemptMix for why that distinction is load-bearing.
    attemptMix: attemptMix(games),
    // Where the goals come from. A share of a population, like attemptMix, and
    // the reason the base layer shades the slot at all.
    slot: slotShare(games),
    // ⭐ HOW FAR OUT EACH KIND OF ATTEMPT IS RECORDED. The one number that makes
    // the blocked-shot coordinate legible rather than merely disclaimed.
    reach: reachOf(games),
    // ⭐ AND WHAT A GOALTENDER'S NIGHT LOOKS LIKE, as two integers rather than a
    // rate — see `goalieNight`.
    goalieNight: goalieNight(games),
    // ⭐ AND WHAT A NORMAL NIGHT LOOKS LIKE — a distribution rather than a rate,
    // which is the one thing no figure above can be asked. See `perGame`.
    perGame: perGame(games),
    baseRates: {
      moreShotsOnGoalLost:
        rateOf(games, g => [g.sog.h, g.sog.a], 'the team with more shots on goal lost'),
      moreAttemptsLost:
        rateOf(games, g => [g.attempts.h, g.attempts.a],
               'the team with more shot attempts lost'),
      // `level` is already a differential, so home's side is the value itself
      // and away's is zero: positive means home led the measure, negative away,
      // and exactly zero is no edge — which `rateOf` drops from `n`.
      moreLevelControlLost:
        rateOf(games, g => [g.level, 0],
               'the team that controlled play while the score was level lost'),
    },
  };
}

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
