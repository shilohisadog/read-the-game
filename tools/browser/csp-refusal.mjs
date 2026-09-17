/**
 * THE POLICY'S OWN VERDICT, READ BACK — does the live page get refused anything?
 *
 * ⛔ WHY IT EXISTS. Every other browser check STRIPS the CSP, and has to: framing a
 * page or rewriting its data origin changes the script's bytes, so the pinned hash
 * no longer matches and the browser blanks the page. Which means nothing we had
 * could see a violation — and thirteen were live. `game.html` shipped thirteen
 * `style=` attributes under a `style-src` naming only hashes, and there is no such
 * thing as a hash for an attribute. The browser refused all thirteen, said so in a
 * console nobody was reading, and rendered the page: the team swatches computed to
 * rgba(0,0,0,0) and the verdict dot sat at the far left of its track on every game
 * in the archive. `test/document.test.js` forbids the attribute at build time,
 * which closes that instance; this closes the CLASS.
 *
 * ⭐ THE CANARY IS NOT DECORATION. A console grep that has never matched is
 * indistinguishable from a console that is not being captured, and this whole
 * check is one grep of one log. So a page with the same SHAPE of policy — hashes
 * only — and one inline style on it: the check FAILS IF THAT COMES BACK CLEAN.
 *
 * ⚠️ AND THE PATTERN IS THE CLAUSE BOTH WORDINGS SHARE. The canary went red twice
 * and was right both times: Chrome routes console output nowhere without
 * `--enable-logging`, and then Chrome CHANGED THE WORDING ("Applying inline style
 * violates the following…" replaced "Refused to apply inline style… because it
 * violates…"). Grepping the verb was grepping a sentence Chrome no longer writes.
 * The shared clause also excludes INFORMATIONAL messages, which the earlier
 * pattern matched ("the directive 'frame-ancestors' is ignored" is a warning).
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromeRun, fail, say } from './lib.mjs';

export const NAME = 'csp-refusal';
export const VIOLATION = 'violates the following Content Security Policy';

/**
 * ONE EXCEPTION, AND IT USED TO BE TWO. The implicit `/favicon.ico` request is
 * browser-initiated and reported inconsistently; the page did not ask for it.
 * `cloudflareinsights` was the second until Kevin turned Web Analytics off — and a
 * named exception that outlives its reason is an allowance nobody remembers
 * granting, which would let the NEXT injection through in silence.
 */
export const refusals = log => log.split('\n')
  .filter(l => l.toLowerCase().includes(VIOLATION.toLowerCase()))
  .filter(l => !/favicon/i.test(l));

/** Load a page with the console captured. The log is the subject here, not the DOM. */
export async function consoleOf(url, { chrome, budget = 20000 } = {}) {
  const r = await chromeRun(['--headless', '--no-sandbox', '--disable-gpu',
    '--enable-logging=stderr', '--log-level=0', `--virtual-time-budget=${budget}`, '--dump-dom', url], { chrome });
  return r.err;
}

/** A hash-only policy and one inline style: no attribute can ever match any hash. */
export const CANARY_HTML = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'sha256-3w1CAvQ0dwQ8i7dr8jNAwLnzsQpx8bLTPjB7C4yRcVs='">
<title>canary</title></head>
<body><p style="color:#c00">this style must be refused</p></body></html>`;

export async function check({ site, chrome, page = '/game', cb = process.env.GITHUB_RUN_ID || Date.now() }) {
  const dir = mkdtempSync('/tmp/rtg-csp-');
  writeFileSync(join(dir, 'canary.html'), CANARY_HTML);
  const canary = await consoleOf(`file://${join(dir, 'canary.html')}`, { chrome, budget: 4000 });
  if (!refusals(canary).length) {
    fail('the canary\'s refusal was never captured — this check cannot see a violation');
    console.log('  an inline style under a hash-only style-src MUST be reported, and was not.');
    console.log('  either the console is not reaching stderr, or the wording moved again.');
    console.log(canary.split('\n').filter(l => /CONSOLE/i.test(l)).slice(0, 5).join('\n') || '  (no CONSOLE lines at all)');
    return false;
  }
  say('canary: a refused inline style is visible to this check');

  const live = refusals(await consoleOf(`${site}${page}?cb=${cb}-csp`, { chrome }));
  if (live.length) {
    fail(`the live page was refused something by its own CSP: ${live[0].slice(0, 200)}`);
    console.log('  static styling belongs in the stylesheet; dynamic styling goes');
    console.log('  through the CSSOM (el.style.x = y), which no policy restricts.');
    return false;
  }
  say(`${site}${page} ran under its real policy with nothing unexpected refused`);
  return true;
}
