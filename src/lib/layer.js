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
