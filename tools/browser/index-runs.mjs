/**
 * THE FRONT DOOR'S SCRIPT IS PERMITTED TO RUN.
 *
 * Two claims, and the second is what has actually been proving anything: the
 * browser refused nothing under our own policy, AND the page's placeholder was
 * replaced by the script. A hash-pinned policy with a stale hash blanks the page
 * while every grep of ours still passes.
 *
 * ⛔ THE FIRST CLAIM WAS BLIND FOR AS LONG AS IT EXISTED. Chrome routes console
 * output nowhere without `--enable-logging=stderr --log-level=0`, so the grep for
 * a refusal could not match and never had. It was found by the canary in the
 * live policy check — which is the entire argument for canaries. The pattern is
 * the clause both Chrome wordings share (`csp-refusal.mjs` carries the history).
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { dumpDom, fail, say } from './lib.mjs';
import { consoleOf, refusals } from './csp-refusal.mjs';
import { stateOf } from './data-readable.mjs';

export const NAME = 'index-runs';
export const NEEDS_SITE = false;

/**
 * The script ran if it replaced the markup's placeholder. Over `file://` the data
 * fetch fails for its own reasons, so WHAT it says is not the claim here — only
 * that it said something of its own.
 */
export function judgeRan(before, after) {
  if (!before) return { ok: false, why: 'src/index.html has no freshness placeholder to replace — this check has lost its subject' };
  if (after === before) return { ok: false, why: `the script never ran: the placeholder still reads "${before}"` };
  return { ok: true, note: `placeholder "${before}" became "${after}" — the script is permitted by the policy` };
}

export async function check({ chrome, repo = process.cwd() }) {
  const file = resolve(join(repo, 'src/index.html'));
  const before = stateOf(readFileSync(file, 'utf8'));
  const rendered = await dumpDom(`file://${file}`, { chrome, budget: 8000 });
  const log = await consoleOf(`file://${file}`, { chrome, budget: 8000 });
  const bad = refusals(log);
  if (bad.length) {
    fail('the browser refused something under our own CSP');
    say(bad[0].slice(0, 200));
    return false;
  }
  const v = judgeRan(before, stateOf(rendered));
  if (!v.ok) return fail(v.why);
  say(v.note);
  return true;
}
