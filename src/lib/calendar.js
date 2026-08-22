/**
 * The archive by DATE — a month of cells, and what is inside one.
 *
 * Pure functions over catalog rows. No DOM, no fetch, no rendering decisions:
 * the calendar's open questions were all about what a cell SAYS, and none of
 * them changes what has to be computed. See docs/discovery.md §10.
 *
 * WHY THIS IS A GRID AND THE TEAM PAGE IS A LIST, measured rather than chosen.
 * A team's season fills 40% of a calendar at a maximum of ONE game per cell, so
 * the cell carries a single bit in a 46px box while the existing list row
 * already carries opponent, result, score and shots. The league fills 68% at a
 * median of 5 and a maximum of 16, where a cell carries a COUNT — which is what
 * a small box is good at, and the variation is itself information.
 *
 * THE TWO COUNTS NEVER ADD. The front door promises that preseason, the
 * Olympics and the 4 Nations Face-Off are "left out of every number here", so
 * they are a separate mark rather than a term in the cell's count (CHENG). That
 * keeps 60 otherwise-invisible dates reachable without editing a disclosure to
 * fit a feature — which is itself the standing rule this came from.
 *
 * AND A CELL COUNTS WHAT WE HOLD, not what we can show. A schedule that listed
 * only the games that worked would be a map of our successes (Doctrine 9), and
 * the team page already refuses to be one.
 */

import { inScope } from './archive.js';
// competitionOf lives in competitions.js: the verdict card names the same
// thing from the same table, and two lookups is two chances to disagree.
import { competitionOf } from './competitions.js';

/** 'YYYY-MM-DD' -> 'YYYY-MM'. String arithmetic, never a Date. */
export function monthOf(date) {
  return String(date).slice(0, 7);
}

/**
 * Day of week, 0 = Sunday.
 *
 * VIA Date.UTC AND getUTCDay, NEVER Date.parse. '2023-11-10' parses as UTC
 * midnight, and in any timezone west of Greenwich `getDay()` on that value
 * answers for the 9th — a calendar silently shifted by one column for every
 * reader in the Americas, which is most of them. The site already learned this
 * once; game.html formats its date by hand for exactly this reason.
 */
export function weekdayOf(date) {
  const [y, m, d] = String(date).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Days in a month, computed. A 12-entry table would be wrong every leap year. */
export function daysInMonth(month) {
  const [y, m] = String(month).split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const pad = n => String(n).padStart(2, '0');

/**
 * Every date we hold a game for, with the two counts kept apart.
 *
 * `shown` and `held` are BOTH carried. `held` is what the cell counts; the
 * difference is what the leaf has to explain. Deriving one from the other at
 * the render site is how a disclosure quietly becomes optional.
 */
export function nightsOf(games) {
  const out = new Map();
  for (const g of games || []) {
    if (!g || !g.d) continue;
    let n = out.get(g.d);
    if (!n) {
      n = { date: g.d, inScope: { held: 0, shown: 0 }, other: { held: 0, shown: 0, types: [] } };
      out.set(g.d, n);
    }
    const side = inScope(g.id) ? n.inScope : n.other;
    side.held += 1;
    if (g.v === 1) side.shown += 1;
    // RAW TYPES, NOT LABELS. Naming happens where the table is, so this file
    // cannot drift from it and a night carrying an unnamed competition still
    // computes correctly rather than half-rendering a string.
    if (side === n.other && !side.types.includes(g.t)) side.types.push(g.t);
  }
  return out;
}

/**
 * The months a stepper can walk, in order, INCLUDING the empty ones.
 *
 * An offseason is a true and ordinary fact about hockey; a stepper that skipped
 * July would tell a reader the season is continuous. 4 of the 34 months in the
 * span have no games at all.
 */
export function monthsIn(games) {
  const seen = [...nightsOf(games).keys()].map(monthOf).sort();
  if (!seen.length) return [];
  const [y0, m0] = seen[0].split('-').map(Number);
  const [y1, m1] = seen[seen.length - 1].split('-').map(Number);
  const all = [];
  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1);) {
    all.push(`${y}-${pad(m)}`);
    m += 1; if (m > 12) { m = 1; y += 1; }
  }
  return all;
}

/**
 * One month as weeks of cells, Sunday first.
 *
 * Leading and trailing blanks are `null` rather than borrowed days from the
 * neighbouring months: a cell showing "3" for the 31st of the previous month is
 * a click that leaves the month you are looking at, and the count in it would be
 * read as belonging to this one.
 */
export function monthGrid(games, month, nights = nightsOf(games)) {
  const days = daysInMonth(month);
  const first = weekdayOf(`${month}-01`);
  const cells = Array.from({ length: first }, () => null);
  for (let d = 1; d <= days; d++) {
    const date = `${month}-${pad(d)}`;
    const n = nights.get(date);
    cells.push({
      date,
      day: d,
      // WHAT THE CELL PRINTS. Two numbers that are never summed: `count` is the
      // NHL games we hold, `other` is everything archived and not counted.
      count: n ? n.inScope.held : 0,
      other: n ? n.other.held : 0,
      types: n ? n.other.types : [],
      // True when the night holds games and none of them can be opened. The
      // leaf needs a STATE for this, not a list of rows nobody can click.
      dead: !!n && (n.inScope.shown + n.other.shown) === 0,
      held: n ? n.inScope.held + n.other.held : 0,
    });
  }
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * What is inside one cell: the night's games, NHL first, each knowing whether
 * it can be opened.
 *
 * Sorted by id within each group so the list is stable — the catalog's own
 * order is not guaranteed and a list that reshuffles between visits is a list a
 * reader cannot return to.
 */
export function nightOf(games, date) {
  const rows = (games || []).filter(g => g && g.d === date)
    .map(g => ({ ...g, scope: inScope(g.id) ? 'nhl' : 'other',
                 type: inScope(g.id) ? null : g.t,
                 shown: g.v === 1 }))
    .sort((a, b) => (a.scope === b.scope ? a.id - b.id : a.scope === 'nhl' ? -1 : 1));
  const shown = rows.filter(r => r.shown).length;
  return {
    date,
    rows,
    shown,
    held: rows.length,
    // `dead` is not "no rows" — it is "rows, none of which go anywhere". The
    // two need different sentences and only one of them is about us.
    dead: rows.length > 0 && shown === 0,
  };
}

/**
 * The season a MONTH belongs to: '2023-09' -> 2023, '2024-06' -> 2023.
 *
 * A DATE RULE, WHICH THE REST OF THIS SITE REFUSES TO USE, and the exception is
 * earned rather than convenient. `archive.season()` reads the season off the
 * game id because a date needs a cutover and the cutover is ours to get wrong.
 * The stepper walks the EMPTY months too — 4 of the 34 in the span have no
 * games at all — and July has no game to ask, so a rule is the only thing that
 * can answer for it.
 *
 * SO IT WAS CHECKED AGAINST THE ONE ANSWER THAT IS NOT OURS: for every game in
 * the live catalog, does this rule agree with the season in its id? **0 of 4,553
 * disagree** (2026-08-21). A disagreement would not crash anything — it would
 * quietly file a game under the wrong tab, which is the failure that never gets
 * reported. test/calendar.test.js pins the two boundaries, June and July.
 */
export function seasonOfMonth(month) {
  const [y, m] = String(month).split('-').map(Number);
  return m >= 7 ? y : y - 1;
}

/**
 * What a month holds that is NOT counted anywhere on this site — by raw type.
 *
 * WHY THE MONTH AND NOT THE CELL. A cell is about 48 CSS px wide on a 390px
 * phone (measured: 4vw body padding, 7 columns, 4px gaps), which holds a number
 * and no label at all. "3 preseason" needs about 55px and would be false on 38
 * of the 60 dates besides. So the label is named ONCE, under the grid, and the
 * cell carries only the count.
 *
 * THAT ONLY WORKS BECAUSE THE ARCHIVE ALLOWS IT, and it was measured before it
 * was designed: 9 months hold out-of-scope games and **every one of them holds
 * exactly one competition** — 0 of 9 mix (2026-08-21). The same is true per
 * date, 0 of 62. This still returns a LIST, because that is a fact about
 * today's archive and not a rule the league has agreed to; a month that ever
 * mixes gets both names printed rather than one of them silently winning.
 *
 * COUNTED PER GAME, NOT PER NIGHT, which is why this walks the rows again
 * instead of summing `nights`. A night carries a SET of types and a single
 * held-count, so attributing that count to its types means dividing — and
 * dividing a game count between two competitions would print "1.5 preseason".
 * Every game knows its own type; nothing has to be apportioned.
 *
 * Raw types, never labels — see nightsOf. Sorted by count, then by type, so the
 * order is stable and the biggest thing is named first.
 */
export function otherInMonth(games, month) {
  const by = new Map();
  for (const g of games || []) {
    if (!g || !g.d || inScope(g.id) || monthOf(g.d) !== month) continue;
    by.set(g.t, (by.get(g.t) || 0) + 1);
  }
  return [...by].map(([type, games]) => ({ type, games }))
    .sort((a, b) => b.games - a.games || a.type - b.type);
}
