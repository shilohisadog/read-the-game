/**
 * THE INGEST TRIGGER — a Cloudflare cron that asks GitHub to run the nightly.
 *
 * ⏰ WHY IT EXISTS. Kevin's target is last night's games on the site by 10:00
 * Eastern, daily. `ingest.yml` asks for 07:23 / 08:53 / 10:23 UTC and GitHub
 * DEPRIORITISES scheduled workflows: over the 31 scheduled runs on record the
 * nightly started +0.3h to +10.3h late, median +3.9h. Three entries against
 * that tail reach the target about 90% of the time, and the remaining 10% is
 * GitHub's queue, which nothing in `ingest.yml` can shorten.
 *
 * `workflow_dispatch` is NOT deprioritised. A dispatch starts in seconds. So the
 * start time becomes ours, and the measurement that sizes the schedule lives in
 * docs/front-door.md §6.1.0 — the one place that owns those numbers. Do not
 * restate any of them here.
 *
 * ⭐⭐ IT COMPUTES NOTHING, AND THAT IS THE RULE THAT KEEPS IT ALLOWED.
 * `ingest.yml` says the extraction runs in GitHub rather than in a Worker
 * "because the extraction produces every number on the site, and a Worker is
 * code that is not in the thing being audited". That rule is about producing
 * numbers. This file produces none: it posts a constant body to a constant URL
 * at a constant time. Every decision about WHAT to ingest — the window, the
 * convergence, the halt — stays in the workflow, where the audit can see it. If
 * a future version of this file ever needs to know something about hockey, it
 * has become the thing that rule forbids.
 *
 * ⛔ AND IT HAS NO HTTP DOOR. A `fetch` handler that dispatched would be an
 * unauthenticated build trigger on the open internet: anyone who found the
 * hostname could run our pipeline as often as they liked. The handler below
 * exists only to answer 404, so that a workers.dev URL left enabled by accident
 * is inert rather than useful.
 *
 * ⚠️ WHAT HAPPENS WHEN IT BREAKS, WHICH IS THE PART WORTH READING. A revoked or
 * expired token makes the dispatch 401 and this throws. There is no monitoring
 * service in this project by design (Doctrine §3), so nothing pages anyone.
 * What happens instead is that `ingest.yml`'s OWN three crons still fire and the
 * site stays current at the old 90%, and the loudest signal available — the
 * freshness line on the front door, at STALE_HOURS — never trips. So the failure
 * of this Worker is SILENT and costs only the tail. That is the safe direction,
 * and it is also why the GitHub crons are not removed: they are the fallback,
 * not redundancy to be tidied away.
 */

/** The repository this triggers. Checked against `git remote` by the suite. */
export const OWNER = 'shilohisadog';
export const REPO = 'read-the-game';
export const WORKFLOW = 'ingest.yml';
export const REF = 'main';

/** GitHub answers a successful dispatch with 204 and an empty body. */
export const DISPATCH_OK = 204;

/**
 * The request, built so the suite can read it without a network.
 *
 * ⚠️ `User-Agent` IS NOT OPTIONAL. The GitHub API rejects a request without one
 * with 403 and a message about it, which reads exactly like a permissions
 * failure and sends you to the token first.
 */
export function dispatchRequest(token) {
  if (!token) throw new Error('no GITHUB_TOKEN bound — `wrangler secret put GITHUB_TOKEN`');
  return [
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': `${OWNER}-${REPO}-ingest-trigger`,
        'Content-Type': 'application/json',
      },
      /* ⭐ NO INPUTS. `ingest.yml` defaults the window to 14 days and the delay
         to 0, which is what a nightly wants. Passing them from here would put a
         second copy of the window in a file the audit does not read. */
      body: JSON.stringify({ ref: REF }),
    },
  ];
}

/**
 * Fire it. Throws on anything but 204 so the failure lands in Cloudflare's own
 * log rather than being swallowed into a quiet success.
 */
export async function fire(env, fetchImpl) {
  const [url, init] = dispatchRequest(env && env.GITHUB_TOKEN);
  const res = await fetchImpl(url, init);
  if (res.status !== DISPATCH_OK) {
    const body = await res.text().catch(() => '');
    throw new Error(`dispatch refused: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.status;
}

export default {
  async scheduled(event, env) {
    /* Awaited, not `waitUntil`ed: a rejected promise handed to waitUntil after
       the handler resolves is reported as a success by the runtime. */
    await fire(env, fetch);
  },
  async fetch() {
    return new Response('not a door\n', { status: 404 });
  },
};
