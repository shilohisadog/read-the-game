/**
 * ⭐ WHERE A FIGURE'S DOOR LANDS, AND NOTHING ELSE.
 *
 * ⛔⛔ WHY THIS IS ITS OWN FILE, 2026-09-24. The preview card writes work-door
 * hrefs and the methods page writes the matching section ids, so the two must
 * agree on one spelling — and the way that was guaranteed was to inline the
 * whole of `methods.js` into the card's page. That was cheap while `methods.js`
 * was a table of ten derivations. The moment `PRINTED` was added it cost
 * `preview.html` 12KB of prose it can never render: every caveat, every
 * argument, on the one page of this site that exists to be pasted into a chat
 * window. A page carrying a tenth of its weight in code it cannot reach is the
 * asset-caching argument arriving from the other side.
 *
 * ⚠️ SO THE RULE IS UNCHANGED AND THE FILE IS SMALLER: there is still exactly
 * one spelling of the anchor, and both sides still call it rather than asserting
 * agreement between two literals. `methods.js` imports from here and re-states
 * nothing.
 */

/**
 * ⭐⭐ WHICH DERIVATION EXPLAINS WHICH ROW, DECLARED RATHER THAN MATCHED BY NAME.
 *
 * ⛔⛔ THE DEFECT THIS CLOSES, 2026-09-24. Every entry used to be found by
 * `DERIVATION[row.key]`, so a row and a derivation were the same thing whenever
 * they happened to share a string. The card's `slot` row is A CLUB'S SHARE OF
 * ITS ATTEMPTS TAKEN FROM THE SLOT; the front door, `what-you-can-see` and
 * `slot.html` all print a different measurement that is also called slot — HOW
 * OFTEN A SHOT FROM THERE GOES IN, 11.4%. Two measurements, two denominators,
 * one word. Under string matching, giving the second one a derivation would have
 * silently handed it the first one's, and the door would have opened on a
 * confident, wrong explanation — worse than no door.
 *
 * ⚠️ AND THE ROW KEY IS NOT OURS TO RENAME, which is why the DERIVATION moved
 * instead. `preview.js` reads `settle.rows[row.key]` out of the published
 * `measures.json`, whose live keys are `dmen`, `level5`, `slot`. Renaming the
 * row would leave that lookup undefined until `derive.yml` next republished —
 * Mondays 15:47 UTC — so a rename that reads as cosmetic would have degraded a
 * live card for days. A derivation key is internal and costs nothing.
 *
 * ⭐ A NEW ROW WITH NO ENTRY HERE IS A BUILD FAILURE, not a silent fallback: the
 * gate requires this map to cover everything `keysOf()` reports.
 */
const EXPLAINS = {
  level5: 'level5', dmen: 'dmen', slot: 'slotShare',
  powerplay: 'powerplay', penalties: 'penalties', offside: 'offside',
  icing: 'icing', attempts: 'attempts', shift: 'shift', hits: 'hits',
};

/** The derivation that explains a row, or undefined if none is declared. */
export function explains(rowKey) {
  return EXPLAINS[rowKey];
}

/** Every row the card can draw, as declared here. */
export const EXPLAINED_ROWS = Object.keys(EXPLAINS);

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
 * The anchor for a ROW, which is the form every caller outside this module
 * holds. It exists so that no caller has to know a row key and a derivation key
 * are different things — the one place that knows is `EXPLAINS`.
 */
export function anchorFor(rowKey) {
  return anchorOf(explains(rowKey));
}
