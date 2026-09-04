/**
 * HTML escaping, for the one direction this site actually needs it.
 *
 * ⭐ IT MOVED OUT OF `boot` BECAUSE EVERY EXTRACTED MARKUP MODULE NEEDS IT.
 * It was a one-line local used thirty times, which is fine while everything
 * lives in one function and wrong the moment anything leaves: threading an
 * escaper through every factory as a parameter would make it an argument
 * instead of a primitive. Found while scoping the work panel's extraction —
 * the first thing that had to move was not the cluster, it was this.
 *
 * ⚠️ AND IT HAD NO TEST OF ITS OWN, on a page that renders strings the LEAGUE
 * controls — player names, penalty descriptions, team names — into `innerHTML`.
 * `test/esc.test.js` is the first direct coverage it has had.
 *
 * ⛔ IT DOES NOT ESCAPE THE APOSTROPHE, WHICH IS A CONSTRAINT ON THE CALLER,
 * NOT AN OVERSIGHT. `&#39;` matters only inside a single-quoted attribute, and
 * every attribute this project emits is double-quoted. Interpolating this into
 * `attr='…'` would be unsafe, so `test/esc.test.js` states the rule and
 * `test/inline-handlers.test.js` already forbids the other half of that hazard.
 */

/** `s` as text safe to interpolate into element content or a "double-quoted" attribute. */
export function ESC(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
