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

/**
 * The label for a competition, from the table in `data/competitions.json`.
 *
 * NO TABLE LIVES IN THIS FILE. `derive.py` reads that JSON and is the only thing
 * that walks the whole archive, so it is the only place that can catch a new
 * competition the day it lands — and a second copy here is the defect this
 * project keeps almost building. The page gets the same file inlined.
 *
 * THE RAW FALLBACK IS A LAST RESORT, NOT THE POLICY. An unnamed type fails the
 * derive run loudly; this exists so that in the window between the league
 * inventing one and a human naming it, a reader sees `game type 21` rather than
 * `undefined`. Rendering raw was briefly the whole answer here and that was
 * wrong: `gameType` is a small closed enum, so a value nobody has seen is an
 * EVENT, not the open-ended vocabulary a missed-shot reason is.
 *
 * Naming is not cosmetic. Lumping these under "preseason" — the tempting
 * shorthand, since 320 of 361 are — would be false on every Olympic and
 * 4 Nations night, which is 38 of the 60 dates this makes visible at all.
 */
export function competitionOf(type, names) {
  // `names[type]` and not `names[String(type)]`: object keys ARE strings and the
  // lookup coerces, so the second form was a branch no mutation could reach.
  // The table arrives from JSON with string keys and the catalog carries `t` as
  // a number; that is one expression, not two.
  return (names && names[type]) || `game type ${type}`;
}

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
