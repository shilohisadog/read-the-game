/**
 * RUN A BROWSER CHECK — the same one the release gate runs, from anywhere.
 *
 *   node tools/browser/run.mjs data-readable --site https://readthegame.co
 *   node tools/browser/run.mjs --list
 *
 * `deploy.yml` calls exactly this, so what CI runs and what a laptop runs are
 * the same file rather than two statements of one check that drift apart.
 * ⭐ The exit code is the gate: 0 is pass, 1 is fail, and the failure is printed
 * as `::error::`, which GitHub shows against the step and a terminal shows plainly.
 */
import { findChrome } from './lib.mjs';

export const CHECKS = {
  'data-readable': () => import('./data-readable.mjs'),
  'watch-a-game': () => import('./watch-a-game.mjs'),
  'phone-fit': () => import('./phone-fit.mjs'),
  'preview-fits': () => import('./preview-fits.mjs'),
  'verdict-dot': () => import('./verdict-dot.mjs'),
  'csp-refusal': () => import('./csp-refusal.mjs'),
  // Local checks: they read the built pages in `src/`, before anything is deployed.
  'pages-csp': () => import('./pages-csp.mjs'),
  'index-runs': () => import('./index-runs.mjs'),
  'stylesheet-settles': () => import('./stylesheet-settles.mjs'),
  'replay-states': () => import('./states.mjs'),
};

function args(argv) {
  const o = { names: [], site: null, chrome: null, list: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--site') o.site = argv[++i].replace(/\/+$/, '');
    else if (a === '--chrome') o.chrome = argv[++i];
    else if (a === '--list') o.list = true;
    else o.names.push(a);
  }
  return o;
}

/* ⛔ THE CLI RUNS ONLY WHEN THIS FILE IS THE ENTRY POINT. `CHECKS` is imported by
   test/browser-checks.test.js to prove the workflow and the tool name the same
   checks — and a module that parses argv at import time answered that import by
   printing its list and exiting 1, failing the test file before its first
   assertion. */
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const o = args(process.argv.slice(2));
  if (o.list || !o.names.length) {
    console.log(Object.keys(CHECKS).join('\n'));
    process.exit(o.list ? 0 : 1);
  }
  for (const n of o.names) if (!CHECKS[n]) { console.log(`::error::no such check: ${n} (have: ${Object.keys(CHECKS).join(', ')})`); process.exit(1); }
  const chrome = o.chrome || findChrome();
  let ok = true;
  for (const n of o.names) {
    const mod = await CHECKS[n]();
    /* A check either reads a DEPLOYED site or the built pages in `src/`. Asking a
       site check to run without one would measure the wrong thing quietly. */
    if (mod.NEEDS_SITE !== false && !o.site) {
      console.log(`::error::${n} needs --site: it runs against a deployed site`);
      process.exit(1);
    }
    console.log(`— ${n}${mod.NEEDS_SITE === false ? ' against the built pages in src/' : ` against ${o.site}`}`);
    ok = (await mod.check({ site: o.site, chrome })) && ok;
  }
  process.exit(ok ? 0 : 1);
}
