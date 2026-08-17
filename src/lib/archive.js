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

/** Regular season (02) and playoffs (03), read from the id — never a lookup. */
export function inScope(gameId) {
  const t = String(gameId).slice(4, 6);
  return t === '02' || t === '03';
}

/** Playoffs (03), read from the same field, because the OTL bucket turns on it. */
export function isPlayoff(gameId) {
  return String(gameId).slice(4, 6) === '03';
}

/**
 * The season a game belongs to, read from the id — never a lookup and never a
 * date. A season spans two calendar years, so a date would need a cutover rule
 * and the cutover moves; the id's first four digits are the league's own answer.
 */
export function season(gameId) {
  return String(gameId).slice(0, 4);
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
