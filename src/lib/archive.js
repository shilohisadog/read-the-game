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

const POPULATION = 'NHL regular season and playoffs';

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
function rateOf(records, pick, what) {
  let n = 0, count = 0;
  for (const g of records) {
    const [h, a] = pick(g);
    if (h === a) continue;                 // no edge — not a case, either way
    if (g.score.h === g.score.a) continue; // no winner; NHL games always have one
    n++;
    if ((h > a) !== (g.score.h > g.score.a)) count++;   // led the measure, lost
  }
  return { what, population: POPULATION, n, count, rate: n ? count / n : null };
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
