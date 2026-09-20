/**
 * THE BROWSER CHECKS' SHARED PARTS — a real Chrome, a local server, and the
 * conventions every check follows.
 *
 * ⭐ WHY THESE LEFT `deploy.yml`. The release gate's browser checks were ~800
 * lines of bash and in-page JavaScript inside YAML: runnable only by pushing,
 * testable not at all, and duplicated the day a second check needed the same
 * probe. They are the same checks, moved where they can be run on a laptop
 * against any site — `node tools/browser/run.mjs <check> --site <url>` — and
 * where the JUDGING is a function a test can call with numbers it invents.
 *
 * ⚠️ WHAT MUST NOT CHANGE IN THE MOVE, because each was earned by a defect:
 *   - every check that measures a page also measures a CANARY that must fail,
 *     and a SUBJECT that must be present (an empty page overflows nothing);
 *   - a width is IMPOSED in an iframe, never requested from the browser, which
 *     enforces a minimum window size and silently grades another screen;
 *   - the data the page fetches is served from disk, and the list is a WINDOW of
 *     recent games rather than a prediction of which one the page will pick.
 *
 * NOT A DEPENDENCY: Chrome comes from the runner (`google-chrome`), or from
 * `$CHROME`, or from a Playwright install outside the repo when there is one.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { homedir } from 'node:os';

/** GitHub reads `::error::` from the log; locally it is just a line that says what broke. */
export const fail = msg => { console.log(`::error::${msg}`); return false; };
export const say = msg => console.log(`  ${msg}`);

export function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  for (const c of ['google-chrome', 'chromium', 'chromium-browser']) {
    if (spawnSync('command', ['-v', c], { shell: true }).status === 0) return c;
  }
  const pw = join(homedir(), '.cache/ms-playwright');
  if (existsSync(pw)) {
    for (const d of readdirSync(pw).filter(d => d.startsWith('chromium-'))) {
      for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
        const p = join(pw, d, sub);
        if (existsSync(p)) return p;
      }
    }
  }
  throw new Error('no Chrome: set $CHROME, or install google-chrome (the runner has one)');
}

/**
 * Load a URL in headless Chrome and return the rendered document.
 * `--virtual-time-budget` lets the page's own timers run without waiting in real
 * time; `--dump-dom` prints the document AFTER scripts have had that budget.
 */
export function chromeRun(args, { chrome = findChrome(), timeout = 120 } = {}) {
  /* ⛔ ASYNC, NOT `spawnSync`. The checks that FRAME a page serve it from an HTTP
     server in this same process, and a synchronous child blocks node's event loop
     — so the server never answered, Chrome got nothing, and every probe reported
     "the probe did not run". Found in the move out of YAML, where bash had a
     separate process per server and could not have this bug. */
  return new Promise(done => {
    const p = spawn(chrome, args, { env: { ...process.env, LD_LIBRARY_PATH: `/tmp/rtg-pixels/libs/root/usr/lib/x86_64-linux-gnu:${process.env.LD_LIBRARY_PATH || ''}` } });
    let out = '', err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    const t = setTimeout(() => p.kill('SIGKILL'), timeout * 1000);
    p.on('close', () => { clearTimeout(t); done({ out, err }); });
  });
}

export async function dumpDom(url, { chrome = findChrome(), budget = 15000, timeout = 120 } = {}) {
  const r = await chromeRun(['--headless', '--no-sandbox', '--disable-gpu',
    `--virtual-time-budget=${budget}`, '--dump-dom', url], { chrome, timeout });
  return r.out;
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
                '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

/**
 * A static server for the directory a check assembled.
 * ⛔ IT PROVES THE SERVER IS ITS OWN. A step once copied a port from another
 * step, its own server died with EADDRINUSE behind `>/dev/null`, and Chrome
 * measured 404s from somebody else's directory for two red deploys. Port 0 lets
 * the OS choose a free one, so there is no port to collide over.
 */
export function serve(dir) {
  const server = createServer((req, res) => {
    const path = join(dir, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!existsSync(path) || statSync(path).isDirectory()) { res.writeHead(404); return res.end('not here'); }
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    createReadStream(path).pipe(res);
  });
  return new Promise(done => server.listen(0, '127.0.0.1', () =>
    done({ url: `http://127.0.0.1:${server.address().port}`, stop: () => server.close() })));
}

/** Fetch a URL to a file, failing loudly: a check that silently reads a 404 proves nothing. */
export async function download(url, path) {
  const { writeFile } = await import('node:fs/promises');
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} — HTTP ${r.status}`);
  await writeFile(path, Buffer.from(await r.arrayBuffer()));
}

/** The most recent games the archive publishes — a WINDOW, never a prediction of the page's pick. */
export async function recentGameIds(catalogPath, n = 10) {
  const { readFile } = await import('node:fs/promises');
  const cat = JSON.parse(await readFile(catalogPath, 'utf8'));
  return cat.games.filter(g => g.v && (g.t === 2 || g.t === 3))
    .sort((a, b) => (a.d === b.d ? a.id - b.id : (a.d < b.d ? -1 : 1)))
    .slice(-n).map(g => g.id);
}

/**
 * The game the PAGE opens when no `?game=` is given, by RUNNING THE PAGE'S OWN
 * RULE rather than restating it.
 *
 * ⛔⛔ WHY THIS EXISTS, 2026-09-20. `recentGameIds` above says in its own
 * docstring that it is "a WINDOW, never a prediction of the page's pick" — and
 * `sitecopy` depended on it to be exactly that, because the copied extracts are
 * what lets the game page boot at all. The two agreed only while no preseason
 * games existed: the window filters to `t === 2 || t === 3` (regular season and
 * playoffs) and the page filters on NOTHING but `v`. The first preseason games
 * of the 2026-27 season published on 2026-09-19, the page's default became a
 * type-1 game whose extract nobody had copied, and `phone-fit` measured a page
 * with no scoreboard on it. The gate was right; this function was the gap.
 *
 * ⭐ DERIVED, NOT COPIED. The rule is four lines and the temptation is to write
 * them again here — which would be a second answer free to drift from the first,
 * and drift is the entire defect above. `pick()` is extracted from the built
 * page and evaluated, so if the page changes how it chooses, this follows.
 */
export async function defaultGameId(catalogPath, pageHtmlPath) {
  const { readFile } = await import('node:fs/promises');
  const cat = JSON.parse(await readFile(catalogPath, 'utf8'));
  const html = await readFile(pageHtmlPath, 'utf8');
  const src = /function pick\(c\)\{[\s\S]*?\n\}/.exec(html);
  if (!src) throw new Error(`no pick() in ${pageHtmlPath} — the page chooses its game some other way now`);
  // eslint-disable-next-line no-new-func
  return new Function(`${src[0]}; return pick;`)()(cat);
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
