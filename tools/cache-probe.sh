#!/usr/bin/env bash
#
# DOES A REPEAT VISITOR GET CURRENT DATA, OR OUR LAST ANSWER? Ask a real
# browser, because curl cannot be asked this question at all.
#
#   tools/cache-probe.sh                    # against production
#   tools/cache-probe.sh https://…          # against somewhere else
#
# WHY curl IS THE WRONG INSTRUMENT. curl has no HTTP cache. Hand it an ETag and
# the origin answers 304 with an empty body -- it always could, and it always
# did. That proves the CAPABILITY exists, not that a visitor ever reaches it.
# The site had this exact blind spot once before with CORS (see r2-cors.yml):
# curl does not apply CORS either, so every check we had passed while every
# visitor saw an error. Twice now the check has been blind to the axis in
# question. This one uses the thing the reader uses.
#
# WHAT IT FOUND, 2026-08-21, BEFORE ANY CHANGE. Every object carried
# Last-Modified and none carried Cache-Control -- the precondition for
# HEURISTIC freshness (RFC 9111 4.2.2), where the browser invents a policy
# because we declined to state one. Chrome's is 10% of the object's age. All
# five data files were answered from the browser's own store with the origin
# never asked, and `derive.yml` corrects published numbers.
#
# WHY THE OBVIOUS MEASUREMENTS READ ZERO. Resource Timing blanks every SIZE
# field for a cross-origin response with no Timing-Allow-Origin, and R2 sends
# none -- so transferSize is 0 whether the bytes flew across an ocean or came
# out of a local file. Two attempts at this measurement read zero everywhere and
# meant nothing. DURATION is not blanked, and it separates the cases by sixty
# times. Byte counts come from CDP instead, which sees the real network layer.
#
# EVERY RUN VALIDATES ITS OWN INSTRUMENT. The `reload` row is forced to the
# network on the same URL in the same session; if it does not show a round trip
# the probe is broken and no other row on the page means anything.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${RTG_PIXELS_WORK:-${TMPDIR:-/tmp}/rtg-pixels}"
DATA="${1:-https://data.readthegame.co}"
SITE="${2:-https://readthegame.co}"
mkdir -p "$WORK"

# Playwright and its browser live outside the repo. package.json says "Zero
# dependencies, deliberately" and this must not be the thing that ends that.
if [ ! -d "$WORK/node_modules/playwright" ]; then
  echo "  installing playwright into $WORK (not into the repo)"
  ( cd "$WORK" && npm init -y >/dev/null 2>&1 && npm i playwright@latest >/dev/null 2>&1 )
  ( cd "$WORK" && npx playwright install chromium >/dev/null 2>&1 )
fi
if [ ! -d "$WORK/libs/root" ]; then
  mkdir -p "$WORK/libs" && ( cd "$WORK/libs"
    apt-get download libnspr4 libnss3 libasound2t64 >/dev/null 2>&1 \
      || apt-get download libnspr4 libnss3 libasound2 >/dev/null 2>&1 || true
    for d in *.deb; do [ -e "$d" ] && dpkg-deb -x "$d" root; done )
fi
export LD_LIBRARY_PATH="$WORK/libs/root/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

cat > "$WORK/cache-probe.mjs" <<'EOF'
import { chromium } from 'playwright';
const [DATA, SITE] = process.argv.slice(2);

const browser = await chromium.launch();
// ONE context for the whole run. A fresh context per navigation gives each page
// its own empty cache, every fetch is a miss, and the result is indistinguishable
// from the failure we are looking for.
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Byte counts from the network layer. Resource Timing cannot supply these
// cross-origin; CDP is not subject to Timing-Allow-Origin.
const bytes = new Map(), stat = new Map(), urlOf = new Map();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
cdp.on('Network.responseReceived', e => { urlOf.set(e.requestId, e.response.url); stat.set(e.requestId, e.response.status); });
cdp.on('Network.loadingFinished', e => {
  const u = urlOf.get(e.requestId);
  if (u) bytes.set(u, [...(bytes.get(u) || []), { wire: e.encodedDataLength, status: stat.get(e.requestId) }]);
});

await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });

const id = await page.evaluate(async d => {
  const c = await (await fetch(d + '/catalog.json', { cache: 'reload' })).json();
  return c.games.filter(g => g.v === 1).at(-1).id;
}, DATA);

const FILES = ['catalog.json', 'index.json', 'measures.json', 'teams.json', `extract/${id}.json`];

const time = (u, mode) => page.evaluate(async ([u, m]) => {
  const t = [];
  for (let i = 0; i < 3; i++) {
    const a = performance.now();
    await fetch(u, m === 'default' ? {} : { cache: m });
    t.push(performance.now() - a);
  }
  return Math.round(Math.min(...t));
}, [u, mode]);

console.log(`\n  ${DATA}\n`);
console.log('  file                            reload    default   repeat-body   the origin was');
console.log('                                 (control)  (tested)   (wire B)');
let stale = 0, broken = 0, resent = 0;
for (const f of FILES) {
  const u = `${DATA}/${f}`;
  await time(u, 'reload');                       // prime, and warm the connection
  const ctl = await time(u, 'reload');
  bytes.delete(u);
  const def = await time(u, 'default');
  const wire = (bytes.get(u) || []).slice(-1)[0];
  // INSTRUMENT CHECK, per row. A forced-network fetch that returns instantly
  // means the probe is not measuring the network and the row beside it is void.
  if (ctl < 8) { broken++; console.log(`  ${f.padEnd(30)} ${String(ctl+'ms').padStart(7)}   — CONTROL DID NOT REACH THE NETWORK; row is void`); continue; }
  const asked = def * 4 >= ctl;
  if (!asked) stale++;
  if (asked && wire && wire.wire > 2000) resent++;
  console.log(`  ${f.padEnd(30)} ${String(ctl+'ms').padStart(7)}  ${String(def+'ms').padStart(8)}  ${String(wire ? wire.wire : '-').padStart(10)}   ${asked ? 'asked' : 'NEVER ASKED'}`);
}

// TWO FAILURES THAT POINT IN OPPOSITE DIRECTIONS, and only one of them looks
// like a problem. Re-sending the body is waste. Answering without asking is a
// correctness fault on a site that corrects its own numbers -- and it is the
// quiet one, because it presents as a fast page.
console.log('');
if (broken)      console.log(`  VOID — ${broken} row(s) had no working control; fix the probe before reading this.`);
else if (stale)  console.log(`  RED — ${stale} of ${FILES.length} answered without asking. A corrected number can be served stale.`);
else if (resent) console.log(`  AMBER — every file revalidated (never stale), but ${resent} re-sent the whole body.`);
else             console.log(`  GREEN — every file revalidated and no body was re-sent: current AND cheap.`);
await browser.close();
process.exitCode = (broken || stale) ? 1 : 0;
EOF

cd "$WORK" && node cache-probe.mjs "$DATA" "$SITE"
