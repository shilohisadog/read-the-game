/**
 * EVERY PAGE IS PERMITTED TO RUN UNDER ITS OWN POLICY.
 *
 * The CSP must EXECUTE, not merely be present: a hash-pinned policy with a stale
 * hash is a blank page that passes every grep we could write, so the only honest
 * check is a real browser. This walks the built pages over `file://` and asks
 * whether the browser refused any of them anything.
 *
 * ⚠️ IT DOES NOT PROVE THE PAGE WORKS, and the difference cost us: over `file://`
 * the data fetch fails for its own reasons, so this was green while every visitor
 * saw "No data loaded yet" — R2 was sending no `Access-Control-Allow-Origin`.
 * `data-readable` closes that gap, against the deployed site.
 *
 * ⭐ THE CANARY FIRST, AND IT EARNED ITS KEEP ON ITS FIRST RUN. One page copied
 * with a comment inserted into its first script block — exactly what a hand-edited
 * page or a half-run builder produces — must be refused. The first version loaded
 * `file://<relative path>`, so Chrome read the directory as a HOSTNAME, fetched
 * nothing, and reported no violations for eleven pages in a row: green, fast, and
 * measuring nothing.
 */
import { mkdtempSync, copyFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { fail, say } from './lib.mjs';
import { consoleOf, refusals } from './csp-refusal.mjs';

export const NAME = 'pages-csp';
export const NEEDS_SITE = false;

/** The one edit that breaks a hash without changing what a page does. */
export function breakHash(html) {
  return html.replace('<script>', '<script>/*canary*/');
}

export async function walk(files, { chrome } = {}) {
  const refused = [];
  for (const f of files) {
    const log = await consoleOf(`file://${resolve(f)}`, { chrome, budget: 6000 });
    const r = refusals(log);
    if (r.length) refused.push({ page: basename(f), line: r[0].slice(0, 200) });
  }
  return refused;
}

export async function check({ chrome, repo = process.cwd() }) {
  const src = join(repo, 'src');
  const pages = readdirSync(src).filter(f => f.endsWith('.html')).map(f => join(src, f));

  const dir = mkdtempSync('/tmp/rtg-csp-canary-');
  const from = join(src, 'calendar.html'), to = join(dir, 'calendar.html');
  copyFileSync(from, to);
  const broken = breakHash(readFileSync(to, 'utf8'));
  if (broken === readFileSync(to, 'utf8')) return fail('the canary did not change the page it was meant to break');
  writeFileSync(to, broken);
  if (!(await walk([to], { chrome })).length) {
    return fail('a page with a deliberately stale hash raised NO violation — this probe is blind, and its green means nothing');
  }
  say('canary fired, so the probe can see a refusal');

  const refused = await walk(pages, { chrome });
  if (refused.length) {
    for (const r of refused) say(`REFUSED: ${r.page}\n    ${r.line}`);
    return fail('a shipped page is refused by its own policy — that is a blank page for every visitor');
  }
  say(`all ${pages.length} pages run under their own policy`);
  return true;
}
