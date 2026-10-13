/**
 * The per-page documents, each an exact projection of `catalog.json` and
 * `index.json`, so a page downloads what it draws instead of the whole catalog.
 *
 *   front.json             the front door, plus what every page shares
 *   team/{AB}.json         every catalog row naming that team, verbatim
 *   calendar/{YYYY-MM}.json every catalog row dated in that month, verbatim
 *
 * Rows are copied, never reshaped: a page reading a slice reads the same row it
 * would have found in the catalog. `builders/page-docs.mjs --verify` rebuilds
 * these from the published catalog and index and requires identical bytes.
 */
import { teamsIn, heroOf, newestOf } from './front.js';
import { monthsIn, monthOf } from './calendar.js';

/** The index fields the status line reads (`ingest-state.js`). */
export const STATUS_KEYS = ['dataThrough', 'lastRun', 'halted', 'coverage'];

export function pageDocs(catalog, index) {
  const games = (catalog && catalog.games) || [];
  const docs = {};

  const status = {};
  for (const k of STATUS_KEYS) status[k] = index && k in index ? index[k] : null;
  const held = [...new Set(games.filter(g => g.d).map(g => monthOf(g.d)))].sort();
  const hero = heroOf(games);
  docs['front.json'] = {
    teams: teamsIn(games),
    hero,
    newest: newestOf(games),
    status,
    calendar: { months: monthsIn(games), held },
  };

  const byTeam = {};
  for (const g of games) {
    for (const ab of new Set([g.a, g.h])) {
      if (ab) (byTeam[ab] ||= []).push(g);
    }
  }
  for (const ab of Object.keys(byTeam)) {
    docs[`team/${ab}.json`] = { team: ab, games: byTeam[ab] };
  }

  const byMonth = {};
  for (const g of games) {
    if (g.d) (byMonth[monthOf(g.d)] ||= []).push(g);
  }
  for (const m of Object.keys(byMonth)) {
    docs[`calendar/${m}.json`] = { month: m, games: byMonth[m] };
  }
  return docs;
}
