/**
 * The per-game sentence — what this game was, and how ordinary that is.
 *
 * THE FINDING THAT SHAPES IT (docs/game-sentence.md §1). "They controlled play
 * and lost" happens in **1,527 of 3,855 games**. It is not a strange night; it is
 * hockey. So this sentence must not frame a game as remarkable, and the base rate
 * is not decoration hung off it — the rate IS the lesson. The novice's actual
 * misconception is *the team that played better wins*, and the archive refutes it
 * four times in ten.
 *
 * TWO NUMBERS, ONE CLAUSE (CHENG). Raw attempts and level control disagree often,
 * and the narrowing between them is the site's whole thesis at single-game scale:
 * 54.5% of games are lost by the team with more attempts, against 39.6% by the
 * team that controlled play while level. A sentence carrying only the second
 * hides the comparison that makes it mean anything.
 *
 * A FRACTION, NEVER A BARE PERCENTAGE. "243 of 708" carries its own denominator;
 * "34.3%" does not. This is what lets the reference class shrink safely as the
 * cutoff rises — at the far end the archive says **0 of 4**, which as a percentage
 * reads "0%: teams that dominant never lose" and is in fact four coin flips. It
 * also means no minimum-n threshold is needed, and a threshold would be a
 * parameter with no source.
 *
 * NEVER RENDERED AS A CHART, for the same reason. `n` falls monotonically but the
 * RATE does not: past k≈17 it drifts 30.7, 31.6, 31.8, 32.1, 32.7, 33.7, 34.2,
 * 38.7 on nothing but sample size. One row at a time, as a sentence, that cannot
 * mislead. Plotted, the eye interpolates and the wobble becomes a trend.
 *
 * AND NO CAUSAL CONNECTIVE BETWEEN THE GAME'S NUMBER AND THE RATE — no "so", no
 * "which means". CHENG offered this as a grammatical precaution; §8.3 gives it a
 * mechanism, which makes it a requirement. `level` counts attempts taken while
 * the score was level, so its size depends on how long the game STAYED level: a
 * team leading 3-0 early has few level attempts available to it whatever it then
 * does. A large edge means the game stayed close AND one team ran it — two
 * things. The description remains true; the reference class is selected on a
 * variable related to the outcome, so a causal reading is not merely unsupported,
 * it is specifically wrong. The two clauses are returned SEPARATELY so no edit can
 * join them with a conjunction.
 */

/**
 * Regular season (02) and playoffs (03) — the population every rate covers.
 *
 * Counted over the published catalog, 4,553 games:
 *
 *   01  preseason      320        04  All-Star squads      3
 *   02  regular      3,936        09  national sides      30
 *   03  playoffs       256        12                       1
 *                                 19  national sides       6
 *                                 20  national sides       1
 *
 * ONLY PRESEASON IS NAMED. The others are recognisable from the clubs they carry
 * — 09 is thirty games between national teams, 19 and 20 are CAN/FIN/SWE/USA —
 * but "this is the Olympics" is an inference from a roster, and a wrong one costs
 * more than the generic phrase saves. `not an NHL league game` is a claim the id
 * itself supports.
 */
const TYPE = {
  '01': 'a preseason game',
  '02': null,                        // in scope
  '03': null,                        // in scope
};

/** What kind of game this id names, for saying why a rate is absent. */
export function describeType(gameId) {
  const t = String(gameId).slice(4, 6);
  return t in TYPE ? TYPE[t] : 'not an NHL league game';
}

/** "30–18", never "62%". An en dash, because it is a score line and not a range. */
const pair = (a, b) => `${a}–${b}`;

/**
 * @param o.homeAb,awayAb   three-letter clubs
 * @param o.homeId,awayId   ids, so `diff`'s sign can be read
 * @param o.diff            level-control differential, HOME minus away
 * @param o.attempts        { [teamId]: count } over the whole game, all situations
 * @param o.score           { h, a } final, the league's own line
 * @param o.gameId          for scope
 * @param o.curve           measures.json `levelCurve`, or null if unavailable
 * @param o.shootout        true when the game was decided by a shootout, so the
 *                          scoreboard's winner is not what the play produced.
 *                          Caller supplies it from `inShootout`, the same
 *                          predicate every count uses — never from the period
 *                          number, which is a shootout in the regular season and
 *                          a third overtime in the playoffs.
 *
 * Returns `{ lead, rate, absent }`. `rate` and `absent` are mutually exclusive
 * and one of them is always present when there is an edge — a missing comparison
 * is stated, never silently dropped (CHENG). Silence about an omission is the
 * failure the ingest-state work spent two rounds fixing.
 */
export function sentenceFor(o) {
  const { homeAb, awayAb, homeId, awayId, diff, attempts, levelCounts,
          score, gameId, curve, shootout } = o;
  const level = Math.abs(diff);

  // NO EDGE IS A REAL ANSWER, and it is 264 of 4,119 games — one in sixteen.
  // There is nothing to compare, so nothing is compared.
  if (!level) {
    return { lead: 'Neither team controlled play while the score was level.',
             rate: null, absent: null };
  }

  const ledLevel = diff > 0 ? homeAb : awayAb;
  const lh = attempts[homeId], la = attempts[awayId];
  const ledAttempts = lh === la ? null : (lh > la ? homeAb : awayAb);
  const won = score.h === score.a ? null : (score.h > score.a ? homeAb : awayAb);

  // Both counts are stated from the side that LED them, so a reader never has to
  // work out which way a differential points.
  const lvl = diff > 0
    ? pair(levelCounts[homeId], levelCounts[awayId])
    : pair(levelCounts[awayId], levelCounts[homeId]);
  const att = ledAttempts === homeAb ? pair(lh, la) : pair(la, lh);

  // BOTH NUMBERS, and the copy changes shape when they disagree — which is the
  // instructive case and the one the site exists to show.
  let lead;
  if (!ledAttempts) {
    lead = `The attempts were even at ${pair(lh, la)}. ${ledLevel} led ${lvl} `
         + `while the score was level.`;
  } else if (ledAttempts === ledLevel) {
    lead = `${ledLevel} led the attempts ${att}, and led ${lvl} while the score `
         + `was level.`;
  } else {
    lead = `${ledAttempts} led the attempts ${att}, but ${ledLevel} led ${lvl} `
         + `while the score was level.`;
  }
  // A SHOOTOUT IS NOT PLAY, SO IT CANNOT BE REPORTED AS WHAT THE PLAY PRODUCED.
  //
  // Every count on this site already excludes the shootout — `inShootout` guards
  // Corsi, level control and the goal tally, and the league agrees, since its own
  // boxscore keeps shootout attempts out of shots on goal and adds exactly one
  // goal to the winner however many go in. The OUTCOME did not exclude it: the
  // won/lost clause reads the league's final score, which in these games IS the
  // shootout result. Measured on a real game, `2023020510`: DET 7 PHI 6 on the
  // scoreboard, **6–6 in play**, and this sentence said *"DET won."*
  //
  // The mirror case is the damaging one. Had the control leader lost that
  // shootout the sentence would have said *"DET lost"* — presenting a
  // coin-flip tiebreaker as an instance of the very thing the site exists to
  // demonstrate. That is not a small overstatement; it is recruiting a
  // non-hockey event as evidence about hockey.
  //
  // "Level when play ended" is a RULE, not an observation about this game: a
  // shootout happens only when the score is tied after overtime. ~6% of games
  // reach one (13 of 219 sampled), so this is roughly 250 games in the archive.
  if (shootout && won) {
    lead += ` The game was level when play ended; ${won} won the shootout.`;
  } else {
    lead += won === null ? ' The game ended level.'
          : won === ledLevel ? ` ${ledLevel} won.`
          : ` ${ledLevel} lost.`;
  }

  // THE REFERENCE CLASS, and the game supplies its own cutoff.
  const why = describeType(gameId);
  if (why) {
    return { lead, rate: null,
             absent: `No comparison shown — this is ${why}, and the archive's `
                   + `rates cover the NHL regular season and playoffs.` };
  }
  if (!curve || !curve.length) {
    // WHY IT IS ABSENT IS THE CALLER'S FACT, NOT OURS. A page that makes no
    // network requests at all has not "failed to load" anything, and saying so
    // would be a small untruth on the one page whose whole claim is that it
    // reaches nothing.
    return { lead, rate: null,
             absent: `No comparison shown — ${o.noCurveReason
                   || `the archive's rates could not be loaded`}.` };
  }
  const row = curve.find(r => r.k === level);
  if (!row || !row.n) {
    return { lead, rate: null,
             absent: `No comparison shown — the archive holds no other game with a `
                   + `lead this large.` };
  }
  return {
    lead,
    rate: `Of the games where a team led that count by ${level} or more, it lost `
        + `${row.count} of ${row.n}.`,
    absent: null,
    // THE ROW THAT PRODUCED THE SENTENCE, handed back rather than looked up
    // again by the caller. The game page draws this rate as well as saying it,
    // and the alternative was either a second `curve.find` on the page — one
    // domain rule in two places, which is the shape this project keeps removing
    // — or pulling all of archive.js into the game bundle for five lines.
    // Callers that only want the prose can ignore it; nothing may recompute it.
    row,
  };
}
