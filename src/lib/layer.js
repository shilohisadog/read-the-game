/**
 * The layer contract — Doctrine §6 made into a type.
 *
 *   "each layer is a deterministic reducer over the event stream that returns
 *    something renderable plus its own countedEvents breakdown … That seam is
 *    why 'show me the work' and the teaching layer come for free."
 *
 * A layer reduces the WHOLE game and accounts for every event in it:
 *
 *   counted     [eventIndex]              what this metric counts
 *   surprising  [{id, why, derivedFrom}]  counted, but a novice's intuition
 *                                         predicts the opposite -- a subset of
 *                                         `counted`, never a fourth bucket
 *   excluded    [{id, why}]               and never silently
 *
 * Two rules, both learned the hard way.
 *
 * `excluded` holds IDS, not counts. Conservation over counts is weaker: you can
 * balance a ledger of totals while losing track of which events they were.
 *
 * The reducer is handed the FULL event stream, not a pre-filtered one. The app
 * used to drop 51 of 320 events before any layer ran, so conservation held
 * trivially over what survived and said nothing about what never arrived. A
 * property that cannot fail is worse than no property, because it looks like
 * rigour. (Doctrine §9.)
 *
 * `derivedFrom` exists because of the blocked-shot defect: the app shipped a
 * wrong number with a confident explanation attached, which is the most
 * expensive failure available. An explanation that cannot be checked is decoration.
 */

/**
 * The shootout, which is not a TYPE of event but a PLACE in the game.
 *
 * A shootout is a skills competition that decides a tied game; it is not play
 * within it. The league agrees in the only way that matters to us — its
 * boxscore excludes shootout attempts from shots on goal, and adds exactly one
 * goal to the winner however many attempts go in.
 *
 * This lives here rather than in each layer because all three need it and one
 * of them getting it wrong is a wrong number on screen. It is checked BEFORE
 * type-based reasons: a shootout goal is a perfectly good attempt by type, so
 * asking "is this an attempt?" first would count it.
 *
 * Only `pt` can express this. Period 5 is a shootout in the regular season and
 * a third overtime in the playoffs, so the period NUMBER cannot tell them apart
 * — which is why the extract carries the period type at all.
 */
export function inShootout(e) {
  return e.pt === 'SO'
    ? 'the shootout — a skills competition that decides the game, not play in it'
    : null;
}

/**
 * Who won the shootout, or null if nobody did.
 *
 * The winner converted more attempts. Verified against the archive: for all six
 * sampled shootout games, non-shootout goals plus one to this team reproduces
 * the boxscore exactly. A shootout runs until it is decided, so a tie should be
 * impossible — which is exactly why it returns null rather than picking a side.
 */
export function shootoutWinner(events, homeId, awayId) {
  let h = 0, a = 0;
  for (const e of events) {
    if (e.pt !== 'SO' || e.type !== 'goal') continue;
    if (e.own === homeId) h++; else if (e.own === awayId) a++;
  }
  if (h === a) return null;
  return h > a ? homeId : awayId;
}

/**
 * Every event type that IS a play but is not a shot attempt.
 *
 * LIVED IN TWO FILES, BYTE-IDENTICAL, until `tied.js` joined the browser bundle
 * and the syntax gate refused a script declaring `NOT_AN_ATTEMPT` twice. The
 * duplication was harmless only for as long as one of the two copies stayed out
 * of the page — which is the same shape as every other duplicated rule this
 * project has removed, and the reason the analysis tier has one implementation
 * of each. A collision that a build catches is the cheap version of a rule that
 * two files disagree about.
 */
export const NOT_AN_ATTEMPT = {
  hit: 'a hit — physical play, but not a shot attempt',
  faceoff: 'a faceoff — possession changes, no attempt on goal',
  giveaway: 'a giveaway — losing the puck is not a shot',
  takeaway: 'a takeaway — winning the puck is not a shot',
  penalty: 'a penalty — changes the game, but is not an attempt',
};

/** Every event type that is not a play — recorded, but nothing happened on the ice. */
export const NOT_A_PLAY = {
  'period-start': 'period start — not a play',
  'period-end': 'period end — not a play',
  'game-end': 'game over — not a play',
  'stoppage': 'play stopped — the whistle, not an event on the ice',
  'delayed-penalty': 'delayed penalty signalled — play continued',
};

/**
 * Does this result account for every event exactly once?
 *
 * Returns the evidence, not a boolean, so a failure says WHICH events were lost
 * or double-counted rather than only that the sums disagree.
 */
export function conservation(result, totalEvents) {
  const counted = new Set(result.counted);
  const excluded = new Set(result.excluded.map(x => x.id));

  const both = [...counted].filter(i => excluded.has(i));
  const missing = [];
  for (let i = 0; i < totalEvents; i++) {
    if (!counted.has(i) && !excluded.has(i)) missing.push(i);
  }
  // `surprising` annotates counted events; it must never introduce new ones.
  const strayS = result.surprising.map(s => s.id).filter(i => !counted.has(i));
  const noWhy = [
    ...result.excluded.filter(x => !x.why),
    ...result.surprising.filter(s => !s.why || !s.derivedFrom),
  ];

  return {
    ok: !both.length && !missing.length && !strayS.length && !noWhy.length
        && counted.size + excluded.size === totalEvents,
    total: totalEvents,
    counted: counted.size,
    excluded: excluded.size,
    inBoth: both,
    unaccounted: missing,
    surprisingNotCounted: strayS,
    missingExplanation: noWhy.length,
  };
}

/** Group an excluded list into {why: count} for display. */
export function summarise(excluded) {
  const out = {};
  for (const x of excluded) out[x.why] = (out[x.why] || 0) + 1;
  return out;
}
