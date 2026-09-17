/**
 * A VISITOR CAN ACTUALLY WATCH A GAME.
 *
 * The shell is the page a link points at, so it is the page a stranger meets
 * first — and the only one that fetches a GAME rather than a freshness line.
 * Everything before it proves the bytes are ours; this proves a browser can turn
 * them into hockey, against the real data origin, where `curl` cannot see a CORS
 * failure and a `file://` render fails for its own reasons.
 *
 * ⭐ WHAT THE PAGE SHOULD SAY IS DERIVED FROM THE CATALOG IT READS, never typed
 * here — a hard-coded expectation is the defect one level up. Both halves are
 * checked, the clubs AND the date: checking only that SOMETHING rendered is what
 * let a wrong date pass.
 *
 * ⚠️ AN EMPTY EXPECTATION IS NOT A PASSING ONE. This once derived its expectation
 * in a subshell feeding `read`, which succeeds on empty input, so a thrown
 * traceback left a blank expectation and the final match became vacuous — every
 * string contains "". The expectation is asserted before it is used.
 *
 * ⚠️ AND IT WAITS FOR THIS BUILD FIRST. A hostname answers 200 with the previous
 * build for a few seconds after a deploy; without the wait this reported on
 * yesterday's page and passed.
 */
import { dumpDom, fail, say, sleep } from './lib.mjs';
import { DATA_ORIGIN } from './sitecopy.mjs';

export const NAME = 'watch-a-game';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

/** The newest viewable game, as the catalog states it — the page's own source. */
export function expectation(catalog) {
  const v = (catalog.games || []).filter(g => g.v);
  if (!v.length) throw new Error('the published catalog names no viewable game');
  v.sort((a, b) => (a.d === b.d ? a.id - b.id : (a.d < b.d ? -1 : 1)));
  const g = v[v.length - 1];
  const [y, m, d] = g.d.split('-');
  return { id: g.id, teams: `${g.a} at ${g.h}`, date: `${+d} ${MONTHS[+m - 1]} ${y}` };
}

/** The game line as the shell rendered it. Its placeholder is an em-dash, so emptiness is not the signal. */
export function gameLineOf(html) {
  const m = /id="gl"[^>]*>([^<]*)/.exec(html);
  return m ? m[1].trim() : '';
}

/**
 * ⚠️ THE PATTERN IS THE GAME LINE'S OWN GRAMMAR — "AWAY at HOME". It used to also
 * require the word "final", and on 2026-08-25 the line stopped printing the
 * result (a replay that states its ending before you press play is a recap): every
 * page then measured as never-booted and a working site failed its own deploy.
 */
export const GAME_LINE = ' at ';

/** A blank expectation would make the comparison below vacuous — every string contains "". */
export const usable = want => !!want && want.teams.includes(GAME_LINE) && !!want.date;

export function judgeLine(line, want) {
  if (!usable(want)) return { ok: false, why: 'the expectation is blank, so this check would pass on anything' };
  if (!line) return { ok: false, why: 'the shell never rendered a game line' };
  if (line.includes('could not be loaded')) return { ok: false, why: `the shell says: ${line}` };
  if (!line.includes(GAME_LINE)) return { ok: false, why: `the line reads "${line}"` };
  for (const part of [want.teams, want.date])
    if (!line.includes(part)) return { ok: false, why: `the shell rendered "${line}", which does not contain "${part}"` };
  return { ok: true, note: `the shell reports: ${line} — and it matches the catalog on both clubs and date` };
}

export async function check({ site, chrome, attempts = 8, wait = 8000, cb = process.env.GITHUB_RUN_ID || Date.now() }) {
  const res = await fetch(`${DATA_ORIGIN}/catalog.json?cb=${cb}`);
  if (!res.ok) return fail(`the catalog could not be read — HTTP ${res.status}`);
  let want;
  try { want = expectation(await res.json()); }
  catch (e) { return fail(`cannot derive what the page should say from catalog.json: ${e.message}`); }
  if (!usable(want)) return fail('the expectation is blank, so the check below would pass on anything');
  say(`the catalog says the newest viewable game is ${want.teams} on ${want.date}`);

  let last = { ok: false, why: 'never ran' };
  for (let i = 1; i <= attempts; i++) {
    last = judgeLine(gameLineOf(await dumpDom(`${site}/game?cb=${cb}-${i}`, { chrome, budget: 20000 })), want);
    if (last.ok) { say(last.note); return true; }
    say(`attempt ${i}: ${last.why}`);
    if (i < attempts) await sleep(wait);
  }
  fail(`the shell never rendered the game — ${last.why}`);
  console.log(`  it fetches catalog.json and extract/*.json from ${DATA_ORIGIN};`);
  console.log('  if this is silent, check the R2 CORS policy (the r2-cors workflow)');
  return false;
}
