/**
 * A VISITOR CAN ACTUALLY READ THE DATA.
 *
 * ⭐ THE CHECK THAT WOULD HAVE CAUGHT THE CORS BUG. Every byte check proves the
 * bytes we published are the bytes we committed; none of them proves a BROWSER
 * can use them. The data lives on another origin, and `curl` cannot see a CORS
 * failure — it does not send an `Origin` header and does not enforce the answer.
 * So this loads the site as a visitor does and requires the freshness line to say
 * something real: "No data loaded yet" on a site holding 4,000 games means the
 * data could not be read, whatever the reason.
 *
 * ⚠️ IT RETRIES, BECAUSE A DEPLOY IS NOT INSTANT. A hostname answers 200 with the
 * previous build for a few seconds after a deploy, and an empty first paint is
 * not a failure until the page has had its chance. Eight attempts, eight seconds
 * apart; the cache-buster keeps an edge cache from answering all eight the same.
 */
import { dumpDom, fail, say, sleep } from './lib.mjs';

export const NAME = 'data-readable';

/** The freshness line as the page rendered it — the one sentence that says the data arrived. */
export function stateOf(html) {
  const m = /id="state"[^>]*>([^<]*)/.exec(html);
  return m ? m[1].trim() : '';
}

/**
 * What a rendered state means. Split from the loop so a test can hand it the
 * sentences a real page produces — including the one the CORS failure produced,
 * which is the whole reason this check exists.
 */
export function judge(state) {
  if (!state) return { ok: false, why: 'the page did not render its freshness line at all' };
  if (state.includes('Data through')) return { ok: true, why: state };
  return { ok: false, why: `the freshness line says "${state}"` };
}

export async function check({ site, chrome, attempts = 8, wait = 8000, cb = process.env.GITHUB_RUN_ID || Date.now() }) {
  let last = { ok: false, why: 'never ran' };
  for (let i = 1; i <= attempts; i++) {
    const html = await dumpDom(`${site}/?cb=${cb}-${i}`, { chrome });
    last = judge(stateOf(html));
    if (last.ok) { say(`the site reports: ${last.why}`); return true; }
    say(`attempt ${i}: ${last.why}`);
    if (i < attempts) await sleep(wait);
  }
  fail(`a visitor cannot read the data — ${last.why}`);
  console.log('  if the line says "No data loaded yet", check the R2 CORS policy (the r2-cors workflow)');
  return false;
}
