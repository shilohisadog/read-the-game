/**
 * THE PREVIEW CARD AS IT WILL LOOK, BEFORE IT IS DEPLOYED.
 *
 * ⭐⭐ WHY THIS IS NOT `sitecopy`. That tool copies the DEPLOYED site and frames
 * it, which answers "is production right". This one renders the build in `src/`
 * against the LIVE archive, which answers the question you actually have while
 * changing the card: is this change right, before anybody sees it. The two are
 * different questions and only one of them can be asked before a push.
 *
 * ⛔ IT EXISTS BECAUSE THE CARD CANNOT BE RENDERED LOCALLY WITHOUT HELP. The page
 * fetches `data.readthegame.co`, and R2's CORS allowlist is the live origin — so
 * a local server gets a blocked fetch and the card degrades to *"We have no
 * record of that game"*, which looks exactly like a broken build. The data is
 * therefore served from the SAME origin as the page, and `localise` (shared with
 * `sitecopy`, not restated) strips the pinned CSP and makes the origin relative.
 * ⚠️ Nothing here is published. The real policy is checked against the real page
 * by `tools/browser/csp-refusal.mjs`.
 *
 * ⛔⛔ AND IT SERVES EVERY DOCUMENT THE PAGE ASKS FOR, which is the lesson
 * `sitecopy`'s own header records and which this tool then had to learn again:
 * built with two of them, the card rendered every club row as *"no games yet"* —
 * a real page in a WRONG state, indistinguishable in a screenshot from a defect
 * in the published data. The per-game club figures live in `recent.json` and the
 * club names in `teams.json`; a missing fetch is a FAILURE here, never a skip.
 *
 * ⚠️ `teams.json` IS NOT IN `sitecopy.DOCS` AND THAT IS CORRECT. The two pages
 * that tool copies inline their team table at build time; the preview is the one
 * page that fetches it. Adding it there would have been a fix to something that
 * was not broken.
 *
 *   node tools/browser/preview-shot.mjs <gameId> <out.png> [width] [height]
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromeRun, fail, say, serve } from './lib.mjs';
import { DATA_ORIGIN, DOCS, localise } from './sitecopy.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
/** What the preview asks for, which is `DOCS` plus the one table only it fetches. */
const WANT = [...new Set([...DOCS, 'teams.json'])];

async function grab(name, to) {
  const r = await fetch(`${DATA_ORIGIN}/${name}`);
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status} — a card drawn without it is a wrong page, not a missing one`);
  writeFileSync(to, Buffer.from(await r.arrayBuffer()));
}

export async function previewShot(gameId, out, { width = 900, height = 2400 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rtg-preview-'));
  cpSync(join(ROOT, 'src'), dir, { recursive: true });
  mkdirSync(join(dir, 'extract'), { recursive: true });
  await Promise.all(WANT.map(d => grab(d, join(dir, d))));

  /* THE GAME'S OWN EXTRACT, AND EVERY GAME ITS TWO CLUBS HAVE PLAYED. The card
     reads the season from `recent.json`, so the extracts are not strictly needed
     today — they are served because the page is free to start reading them and a
     harness that breaks on that would break silently, in the direction of
     looking fine. */
  const cat = JSON.parse(readFileSync(join(dir, 'catalog.json'), 'utf8')).games;
  const me = cat.find(g => g.id === Number(gameId));
  if (!me) throw new Error(`${gameId} is not in the published catalog`);
  const season = String(gameId).slice(0, 4);
  const mine = cat.filter(g => !g.r && String(g.id).startsWith(season)
    && [g.a, g.h].some(ab => ab === me.a || ab === me.h));
  await Promise.all(mine.map(async g => {
    const r = await fetch(`${DATA_ORIGIN}/extract/${g.id}.json`);
    if (r.ok) writeFileSync(join(dir, 'extract', `${g.id}.json`), Buffer.from(await r.arrayBuffer()));
  }));

  const page = join(dir, 'preview.html');
  const before = readFileSync(page, 'utf8');
  const after = localise(before);
  // A LOCALISE THAT CHANGED NOTHING means the policy or the origin moved and this
  // would be framing a page the CSP had blanked. Stated, because it is silent.
  if (after === before) throw new Error('localise() changed nothing — the harness would prove nothing');
  writeFileSync(page, after);

  const s = await serve(dir);
  const r = await chromeRun(['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--screenshot=${out}`, `--window-size=${width},${height}`, '--virtual-time-budget=12000',
    `${s.url}/preview.html?game=${gameId}`]);
  s.stop();
  if (!existsSync(out)) throw new Error(`no screenshot was written: ${r.err.slice(0, 300)}`);
  return { out, bytes: statSync(out).size, games: mine.length, dir };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [gameId, out, w, h] = process.argv.slice(2);
  if (!gameId || !out) {
    console.log('usage: node tools/browser/preview-shot.mjs <gameId> <out.png> [width] [height]');
    process.exit(2);
  }
  try {
    const r = await previewShot(gameId, out, { width: +(w || 900), height: +(h || 2400) });
    say(`${r.out} — ${r.bytes} bytes, ${r.games} club games served`);
  } catch (e) {
    fail(e.message);
    process.exit(1);
  }
}
