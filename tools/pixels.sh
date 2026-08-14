#!/usr/bin/env bash
#
# LOOK AT THE PAGE. Screenshot and measure the built site in a real browser, at
# real viewport widths, from this machine.
#
#   tools/pixels.sh                 # 360 and 1100
#   tools/pixels.sh 360 768 1400    # any widths you like
#
# WHY THIS EXISTS. Three renderings of the homepage preview shipped broken in a
# row -- a blur, a cropped rink, and a scoreboard eating 56% of a phone frame --
# and all 419 tests stayed green through every one of them. They had to: the
# fake document the unit tests run against has no CSS and no layout, so it
# cannot see a pixel. The reasoning behind each fix was sound and the rendering
# was wrong, three times, and the only thing that broke the pattern was looking.
#
# The measurement that ended it took one run:
#
#     frame 856x462 (desktop)   scoreboard 87px   19% of the box
#     frame 287x155 (phone)     scoreboard 87px   56% of the box
#
# The same absolute height in both -- the board's type is set in rem, and rem
# does not care how wide the frame is. Nobody was going to derive that.
#
# WHY IT IS NOT A DEPENDENCY. package.json says "Zero dependencies,
# deliberately", and `npm test` is node's own runner. That stays true: Playwright
# and its browser go into $WORK (a scratch directory outside the repo), not into
# package.json, and nothing in `npm run gates` imports any of it. This is a tool
# you reach for, not a thing the build needs.
#
# WHAT IT CANNOT TELL YOU. It renders the LOCAL build with the CSP stripped and
# the data origin rewritten to a relative path (see below). It is not a check on
# production, it has no opinion about what looks good, and it asserts nothing.
# It shows you the page and prints its geometry. The judging is yours.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${RTG_PIXELS_WORK:-${TMPDIR:-/tmp}/rtg-pixels}"
ORIGIN="https://data.readthegame.co"
WIDTHS=("$@"); [ ${#WIDTHS[@]} -eq 0 ] && WIDTHS=(360 1100)

mkdir -p "$WORK/site"

# ---------------------------------------------------------------- the browser
# Playwright ships a chromium but not the system libraries it links against, and
# `playwright install-deps` wants root. These three are the only ones missing on
# a stock Ubuntu/WSL image; `apt-get download` needs no privileges, and dpkg-deb
# unpacks into a directory we then put on LD_LIBRARY_PATH.
if [ ! -d "$WORK/node_modules/playwright" ]; then
  echo "  installing playwright into $WORK (not into the repo)"
  ( cd "$WORK" && npm init -y >/dev/null 2>&1 && npm i playwright@latest >/dev/null 2>&1 )
  ( cd "$WORK" && npx playwright install chromium >/dev/null 2>&1 )
fi
if [ ! -d "$WORK/libs/root" ]; then
  echo "  fetching the shared libraries chromium needs (no root required)"
  mkdir -p "$WORK/libs" && ( cd "$WORK/libs"
    apt-get download libnspr4 libnss3 libasound2t64 >/dev/null 2>&1 \
      || apt-get download libnspr4 libnss3 libasound2 >/dev/null 2>&1 || true
    for d in *.deb; do [ -e "$d" ] && dpkg-deb -x "$d" root; done )
fi
export LD_LIBRARY_PATH="$WORK/libs/root/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

# ------------------------------------------------------------------ the site
# Built fresh, because a screenshot of a stale artifact is a screenshot of a
# question nobody asked.
( cd "$REPO" && npm run build >/dev/null )
cd "$WORK/site"
cp "$REPO/src/index.html" "$REPO/src/game.html" .
for d in catalog.json measures.json index.json; do
  [ -s "$WORK/$d" ] || curl -sS --fail "$ORIGIN/$d" -o "$WORK/$d"
  cp "$WORK/$d" .
done

# The policy is hash-pinned over the script's exact bytes, and the next line
# rewrites those bytes -- so the hash would no longer match and the browser
# would refuse the page. A blank screenshot proves nothing, so the CSP comes off
# first. Its correctness is a separate claim, tested in test/shell.test.js.
sed -i 's#<meta http-equiv="Content-Security-Policy"[^>]*>##' index.html game.html
sed -i "s#$ORIGIN##g" index.html game.html

# THE GAME ITSELF, and this is the trap that cost three runs. The origin is now a
# relative path, so the shell asks for /extract/<id>.json. Without that file it
# 404s, boot() never runs, the preview class is never added -- and the harness
# happily reports tidy geometry for an ERROR PAGE. Three "no change" runs after a
# real CSS edit, on a page that had never started. measure.mjs below refuses to
# report unless #rg carries the preview class.
mkdir -p extract
ID=$(python3 -c "
import json
g=[x for x in json.load(open('catalog.json'))['games'] if x.get('v') and x.get('t') in (2,3)]
g.sort(key=lambda x:(x['d'],x['id']))
print(g[-1]['id'])")
[ -s "extract/$ID.json" ] || curl -sS --fail "$ORIGIN/extract/$ID.json" -o "extract/$ID.json"

# A server, not file://. The hero is an iframe of a sibling page and the fetches
# are relative; file:// origins make both of those behave differently.
PORT="${RTG_PIXELS_PORT:-8099}"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1

cat > "$WORK/measure.mjs" <<'EOF'
import { chromium } from 'playwright';
const [port, ...widths] = process.argv.slice(2);
const out = process.env.RTG_PIXELS_OUT;
const b = await chromium.launch({ channel: 'chromium' });
for (const raw of widths) {
  const w = Number(raw);
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const problems = [];
  p.on('pageerror', e => problems.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') problems.push(m.text().slice(0, 140)); });
  await p.goto(`http://localhost:${port}/index.html`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);

  let hero = { note: 'no hero frame on this page' };
  try {
    hero = await p.frameLocator('.heroframe iframe').locator('#rg').evaluate(el => {
      const box = s => { const n = el.querySelector(s), r = n && n.getBoundingClientRect();
                         return r ? Math.round(r.width) + 'x' + Math.round(r.height) : null; };
      return {
        booted: el.classList.contains('preview'),   // see the comment in pixels.sh
        frame: innerWidth + 'x' + innerHeight,
        board: box('.board'), rinkBox: box('.rinkbox svg'),
        scrollsSideways: document.documentElement.scrollWidth > innerWidth + 1,
        tallerThanFrame: document.documentElement.scrollHeight > innerHeight + 1,
      };
    });
    if (!hero.booted) hero.WARNING = 'the preview never booted — these numbers describe an error page';
  } catch (e) { hero = { note: String(e).slice(0, 120) }; }

  console.log(`\n${w}px  ${JSON.stringify(hero)}`);
  if (problems.length) console.log('      console:', [...new Set(problems)].slice(0, 4));
  await p.screenshot({ path: `${out}/page-${w}.png`, fullPage: true });
  const hasHero = await p.locator('.hero').count();
  if (hasHero) await p.locator('.hero').screenshot({ path: `${out}/hero-${w}.png` });
  await ctx.close();
}
await b.close();
EOF

# Run it from $WORK, so `import playwright` resolves out of the scratch
# directory's node_modules and the repo stays dependency-free.
mkdir -p "$WORK/shots"
( cd "$WORK" && RTG_PIXELS_OUT="$WORK/shots" node measure.mjs "$PORT" "${WIDTHS[@]}" )

echo
echo "  screenshots in $WORK/shots"
ls -1 "$WORK/shots"
