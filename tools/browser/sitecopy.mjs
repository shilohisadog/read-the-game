/**
 * A LOCAL COPY OF THE DEPLOYED SITE, with the data beside it, for the checks that
 * must FRAME a page to measure it.
 *
 * ⚠️ WHY A COPY AT ALL. A width has to be IMPOSED — headless Chrome enforces a
 * minimum window size and will silently grade a wider screen — so the page is
 * loaded in an iframe of exactly the width claimed. Framing is same-origin work,
 * and the shipped page's CSP pins script hashes, so the copy strips the policy
 * and rewrites the data origin to a relative path. Both are separately tested:
 * the policy by `tools/browser/csp-refusal.mjs` against the REAL page, the origin
 * by the byte-diff step. A check that framed the live origin instead would be
 * measuring a page the CSP had blanked.
 *
 * ⛔ AND IT SERVES EVERY DOCUMENT THE PAGE FETCHES. `tools/pixels.sh` learned this
 * twice: without `extract/<id>.json` the shell 404s, `boot()` never runs, and
 * since D9 the app is HIDDEN — so a gate framed an error page, measured `#rg` at
 * height 0, found no overflow and passed, at exactly the width where the
 * scoreboard overflowed by 25px. The extracts are a WINDOW of recent games, never
 * a prediction of which one the page will choose: a tool that restates the rule it
 * observes breaks silently the day the rule moves.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultGameId, download, recentGameIds, say } from './lib.mjs';

export const DATA_ORIGIN = 'https://data.readthegame.co';
/** Every archive-level document the two pages read. Missing one renders a real but WRONG state. */
export const DOCS = ['catalog.json', 'measures.json', 'index.json', 'schedule.json', 'recent.json'];

/** The pages as the site serves them, with the policy stripped and the origin made relative. */
export function localise(html) {
  return html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g, '')
             .replaceAll(DATA_ORIGIN, '');
}

export async function sitecopy(site, dir, { games = 10, cb = process.env.GITHUB_RUN_ID || Date.now() } = {}) {
  mkdirSync(join(dir, 'extract'), { recursive: true });
  for (const [name, url] of [['index.html', `${site}/?cb=${cb}`], ['game.html', `${site}/game?cb=${cb}`]]) {
    await download(url, join(dir, name));
    writeFileSync(join(dir, name), localise(readFileSync(join(dir, name), 'utf8')));
  }
  await Promise.all(DOCS.map(d => download(`${DATA_ORIGIN}/${d}`, join(dir, d))));
  /* ⛔⛔ THE WINDOW IS NOT THE PAGE'S PICK, AND ON 2026-09-20 THEY PARTED.
     `recentGameIds` filters to `t === 2 || t === 3` — regular season and
     playoffs — and the game page filters on nothing but `v`. That difference was
     invisible for months because the newest viewable game was always a playoff
     game. The first preseason games published on 2026-09-19, the page's default
     became a type-1 game whose extract this function had not copied, and
     `phone-fit` found a game page with no scoreboard on it. It refused to
     measure rather than reporting "it fits", which is the only reason this was
     caught at all.
     ⭐ SO THE PICK IS COPIED EXPLICITLY, derived by running the PAGE's own
     `pick()`. The window stays — other checks want a spread of games — but what
     makes the page boot is now named rather than hoped for. */
  const win = await recentGameIds(join(dir, 'catalog.json'), games);
  const opens = await defaultGameId(join(dir, 'catalog.json'), join(dir, 'game.html'));
  const ids = [...new Set([...win, opens])];
  await Promise.all(ids.map(id => download(`${DATA_ORIGIN}/extract/${id}.json`, join(dir, 'extract', `${id}.json`))));
  say(`copied the site and ${ids.length} extracts, so the pages can boot`
    + ` (the page opens ${opens}${win.includes(opens) ? '' : ', which the window does not carry'})`);
  return { dir, ids, opens };
}
