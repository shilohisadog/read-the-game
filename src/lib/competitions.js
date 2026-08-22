/**
 * WHICH COMPETITION A GAME BELONGS TO, and whether it counts.
 *
 * The league carries `gameType` as a bare integer in characters 4–6 of the game
 * id and names it nowhere in the feed, so a human has to — in
 * `data/competitions.json`, which `derive.py` walks the whole archive against.
 * This file is the only code that reads a game's type or turns one into words.
 *
 * WHY IT IS ITS OWN MODULE. Three surfaces need it and they do not overlap: the
 * calendar names a night's competition, the verdict card says why a game gets no
 * comparison, and `archive.js` decides what enters a base rate. Each of them had
 * its own spelling of `String(id).slice(4, 6)` — `archive.js::inScope`,
 * `calendar.js::competitionOf` and a private `TYPE` map in `sentence.js` that
 * knew about preseason and nothing else. Three readings of one field is three
 * chances for them to disagree about the same game.
 *
 * NO TABLE LIVES HERE EITHER. `names` is passed in, from the JSON, because a
 * copy in JavaScript is the defect this project keeps almost building. Every
 * builder inlines the same file.
 */

/** The league's own gameType, read off the id. Never a lookup, never a date. */
export function typeOf(gameId) {
  return Number(String(gameId).slice(4, 6));
}

/**
 * Regular season (02) and playoffs (03) — the population every rate covers.
 *
 * Preseason, the all-star games, the Olympics and the 4 Nations Face-Off are
 * archived, derived and viewable, and never enter a computed number. A rate
 * pooled across preseason split squads, national sides under different roster
 * rules and an all-star exhibition is not a claim about NHL hockey; it is an
 * average over four competitions.
 */
export function isLeague(type) {
  return type === 2 || type === 3;
}

/**
 * The label for a competition, from the table in `data/competitions.json`.
 *
 * THE RAW FALLBACK IS A LAST RESORT, NOT THE POLICY. An unnamed type fails the
 * derive run loudly; this exists so that in the window between the league
 * inventing one and a human naming it, a reader sees `game type 21` rather than
 * `undefined`. Rendering raw was briefly the whole answer and that was wrong:
 * `gameType` is a small closed enum, so a value nobody has seen is an EVENT, not
 * the open-ended vocabulary a missed-shot reason is.
 *
 * Naming is not cosmetic. Lumping these under "preseason" — the tempting
 * shorthand, since 320 of 361 are — would be false on every Olympic and
 * 4 Nations night, which is 38 of the 60 dates the calendar makes visible at all.
 */
export function competitionOf(type, names) {
  // `names[type]` and not `names[String(type)]`: object keys ARE strings and the
  // lookup coerces, so the second form was a branch no mutation could reach.
  // The table arrives from JSON with string keys and the catalog carries `t` as
  // a number; that is one expression, not two.
  return (names && names[type]) || `game type ${type}`;
}

/**
 * ⭐ THE COMPETITIONS THIS SITE DELIBERATELY LEAVES OUT, named from the table.
 *
 * WHY THIS IS DERIVED AND NOT WRITTEN. The front door's limits block read
 * "Preseason, the Olympics and the 4 Nations Face-Off", and it had been wrong
 * since February 2024: the archive also holds four ALL-STAR games, which that
 * sentence never named. Nothing could see it — the sentence is prose in a
 * builder, and prose cannot be compared to a table by anything but a person
 * remembering to.
 *
 * That is the same shape as the deploy gate that exempted two pages by filename
 * and the night list that labelled a group only when it was not alone: a rule
 * written against the cases that existed, silently wrong when a fourth arrived.
 * The league mints a competition whenever it invents one — 19 and 20 in February
 * 2025, 9 in February 2026, both after this archive started — so a hand-written
 * list here is a claim with an expiry date nobody is told about.
 *
 * DISTINCT NAMES, because two types can share one: 4 and 12 are both all-star,
 * 19 and 20 are both 4 Nations. Ordered by the lowest type carrying each name,
 * so the order is stable and derived rather than chosen.
 */
export function excludedCompetitions(names) {
  const seen = new Map();
  for (const key of Object.keys(names || {})) {
    const type = Number(key);
    if (isLeague(type)) continue;
    const name = competitionOf(type, names);
    if (!seen.has(name) || seen.get(name) > type) seen.set(name, type);
  }
  return [...seen].sort((a, b) => a[1] - b[1]).map(([name]) => name);
}
