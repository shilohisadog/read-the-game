#!/usr/bin/env python3
"""The site index. THE generator; src/index.html is output.

Cloudflare Pages serves a folder verbatim: a request for `/` is answered with
`/index.html` or with a 404. There is no directory listing, which is what the
local `python3 -m http.server` was quietly providing while we developed -- so
the root worked here and would have 404'd in production, with only the deep
links alive. This file closes that gap.

WHY A BUILDER AND NOT A HAND-WRITTEN FILE. Every other page in src/ is
generated, and the one time we hand-edited generated HTML it silently reverted
on the next build (see builders/legacy/). The index links to the apps by
filename, so it has a real invariant to hold: a link here that names a file
that does not exist is a 404 in production, and the --verify gate plus
test/index.test.js exist to make that impossible to ship.

  python3 builders/build_index.py            -> src/index.html
  python3 builders/build_index.py --verify   -> build, compare, do not write
"""
import hashlib, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "index.html"

# The reference game, stated in one place. These are facts from data/rich.json,
# not decoration -- the index makes claims about them and the tests check them.
GAME = {
    "id": "2023020204",
    "date": "10 November 2023",
    "away": "MIN", "home": "BUF",
    "away_goals": 2, "home_goals": 3,
    "away_shots": 35, "home_shots": 25,
}

# THE app. Everything else on the page is secondary to this link.
MAIN = {
    "href": "read-the-game.html",
    "title": "Watch the game",
    "blurb": "Press play. The game replays shot by shot on the ice, with a running "
             "count of who is generating chances and why each event does or does not "
             "count toward it.",
}

# The earlier views. These are kept because each one answers a question the main
# app does not, but they are explorations and the page says so rather than
# presenting seven equal front doors.
VIEWS = [
    ("goalie-view.html", "The goalie view",
     "Minnesota outshot Buffalo and lost. This is the save-by-save reason why."),
    ("on-the-ice.html", "On the ice",
     "Who was actually out there, read from the shift charts."),
    ("active-play.html", "Active play",
     "Following the puck between whistles, and who touched it."),
    ("goalie-eye-view.html", "From the crease",
     "The same shots, seen from where the goalie stood."),
    ("terrain-3d.html", "Where the chances came from",
     "Shot locations as terrain — height is attempts, not danger."),
]

# Not a view of the game at all. Labelled as what it is so nobody clicks it
# expecting hockey.
BENCH = ("figure-bench.html", "Figure bench",
         "A development tool: the two player styles side by side on blank ice.")

# The honest limits, on the page rather than in a README nobody opens.
# Doctrine §9 -- selective honesty is worse than none, because it looks rigorous.
LIMITS = [
    ("One game, not a season.",
     f"Everything here is {GAME['away']} at {GAME['home']}, {GAME['date']}. "
     "A single game cannot tell you what is normal, so nothing here claims to."),
    ("A replay, not live coverage.",
     "The game is over. Nothing on this site fetches anything while you watch it — "
     "the events were pulled once, checked, and built into the page."),
    ("Nothing is modelled or invented.",
     "Every mark traces to a recorded event. There is no expected-goals number, "
     "because that would be our estimate presented as the game's fact."),
    ("The counting is shown, including what it drops.",
     "Each layer accounts for all 320 events in the game: the ones it counts, and "
     "the ones it excludes with the reason. The totals have to reconcile."),
]

T = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Read the Game — hockey, made legible</title>
<meta name="description" content="A single NHL game, replayed so a new fan can see what the numbers are made of. Nothing modelled, nothing invented.">
<style>
:root{--ice:#eef4f8;--bg:#f4f7fa;--ink:#0f1a23;--muted:#5b6d7a;--edge:#ccd8e0;
 --min:#12885a;--buf:#bd8c12;--red:#c8102e;--blue:#3a5a9c}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
 color:var(--ink);background:var(--bg);line-height:1.55;
 padding:clamp(18px,4vw,44px) clamp(14px,4vw,22px)}
.wrap{max-width:900px;margin:0 auto}
.eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
h1{font-size:clamp(1.8rem,4vw,2.5rem);letter-spacing:-.025em;font-weight:800;margin:0 0 12px;text-wrap:balance}
.lede{font-size:1.05rem;color:var(--muted);margin:0 0 22px;max-width:62ch}
.lede b{color:var(--ink);font-weight:600}
h2{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);
 font-weight:700;margin:34px 0 12px}

/* The scoreboard is the hook: 35 shots to 25, and the team with 25 won. */
.board{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;
 background:#fff;border:1px solid var(--edge);border-radius:13px;padding:13px 18px;
 box-shadow:0 5px 18px rgba(16,32,45,.07);margin-bottom:26px}
.tm{display:flex;flex-direction:column;align-items:center;gap:3px}
.tm .ab{font-weight:800;letter-spacing:.05em;font-size:.9rem}
.tm.a .ab{color:var(--min)}.tm.h .ab{color:var(--buf)}
.tm .sh{font-size:.72rem;color:var(--muted);font-variant-numeric:tabular-nums}
.sc{font-family:ui-monospace,Menlo,monospace;font-size:2.1rem;font-weight:700;
 font-variant-numeric:tabular-nums;line-height:1}
.mid{text-align:center;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}

.hero{display:block;text-decoration:none;color:inherit;background:#fff;
 border:1px solid var(--edge);border-radius:15px;padding:22px 24px;
 box-shadow:0 6px 22px rgba(16,32,45,.08);transition:transform .15s ease,box-shadow .15s ease}
.hero:hover,.hero:focus-visible{transform:translateY(-2px);box-shadow:0 12px 30px rgba(16,32,45,.13)}
.hero .t{font-size:1.35rem;font-weight:800;letter-spacing:-.015em;margin:0 0 7px}
.hero .t::after{content:" \2192";color:var(--blue)}
.hero p{margin:0;color:var(--muted);max-width:58ch}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:12px}
.card{display:block;text-decoration:none;color:inherit;background:#fff;
 border:1px solid var(--edge);border-radius:12px;padding:15px 17px;
 box-shadow:0 4px 14px rgba(16,32,45,.06);transition:border-color .15s ease,transform .15s ease}
.card:hover,.card:focus-visible{border-color:var(--blue);transform:translateY(-1px)}
.card .t{font-weight:700;margin:0 0 5px}
.card p{margin:0;font-size:.86rem;color:var(--muted)}
.card.tool{background:#eef2f5;border-style:dashed}

.limits{display:grid;gap:11px;margin:0;padding:0;list-style:none}
.limits li{background:#fff;border:1px solid var(--edge);border-left:3px solid var(--blue);
 border-radius:0 10px 10px 0;padding:12px 16px}
.limits b{display:block;font-size:.93rem;margin-bottom:2px}
.limits span{font-size:.87rem;color:var(--muted)}

a:focus-visible{outline:2px solid var(--blue);outline-offset:3px}
footer{margin-top:38px;padding-top:18px;border-top:1px solid var(--edge);
 font-size:.79rem;color:var(--muted);max-width:70ch}
footer a{color:var(--blue)}
footer p{margin:0 0 8px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<div class="wrap">
<p class="eyebrow">Read the Game</p>
<h1>__H1__</h1>
<p class="lede">__LEDE__</p>

<div class="board">
  <div class="tm a"><span class="ab">__AWAY__</span><span class="sh">__AWAY_SHOTS__ shots</span></div>
  <div class="mid"><div class="sc">__AWAY_G__&ndash;__HOME_G__</div>Final</div>
  <div class="tm h"><span class="ab">__HOME__</span><span class="sh">__HOME_SHOTS__ shots</span></div>
</div>

<a class="hero" href="__MAIN_HREF__">
  <p class="t">__MAIN_TITLE__</p>
  <p>__MAIN_BLURB__</p>
</a>

<h2>Other ways to look at the same game</h2>
<div class="grid">
__VIEWS__
</div>

<h2>What this does and does not claim</h2>
<ul class="limits">
__LIMITS__
</ul>

<footer>
<p>Play-by-play and shift data for NHL game __GAME_ID__, retrieved once from the
league&rsquo;s public game-feed endpoints and built into these pages. Not affiliated with,
endorsed by, or a product of the National Hockey League or any club. Team abbreviations
and colours are used to identify the teams; no league or club logos or marks appear here.</p>
<p>Source, method and the rules this is built under:
<a href="https://github.com/shilohisadog/read-the-game">github.com/shilohisadog/read-the-game</a></p>
</footer>
</div>
</body>
</html>
"""

H1 = "Watch a hockey game and see what the numbers are made of"

LEDE = ("Hockey is fast, and most of what decides a game is invisible unless someone "
        "points at it. This replays <b>one real game</b> slowly enough to follow, and "
        "shows its work: every count is traceable to a recorded event, and every event "
        "it leaves out says why.")


def _views():
    out = []
    for href, title, blurb in VIEWS:
        out.append(f'  <a class="card" href="{href}"><p class="t">{title}</p><p>{blurb}</p></a>')
    href, title, blurb = BENCH
    out.append(f'  <a class="card tool" href="{href}"><p class="t">{title}</p><p>{blurb}</p></a>')
    return "\n".join(out)


def _limits():
    return "\n".join(f"  <li><b>{h}</b><span>{b}</span></li>" for h, b in LIMITS)


def build():
    return (T.replace("__H1__", H1)
             .replace("__LEDE__", LEDE)
             .replace("__AWAY_SHOTS__", str(GAME["away_shots"]))
             .replace("__HOME_SHOTS__", str(GAME["home_shots"]))
             .replace("__AWAY_G__", str(GAME["away_goals"]))
             .replace("__HOME_G__", str(GAME["home_goals"]))
             .replace("__AWAY__", GAME["away"])
             .replace("__HOME__", GAME["home"])
             .replace("__MAIN_HREF__", MAIN["href"])
             .replace("__MAIN_TITLE__", MAIN["title"])
             .replace("__MAIN_BLURB__", MAIN["blurb"])
             .replace("__VIEWS__", _views())
             .replace("__LIMITS__", _limits())
             .replace("__GAME_ID__", GAME["id"]))


def main():
    html = build()

    # A link to a file that does not exist is a 404 in production. Cheapest
    # possible gate, run on every build, before the byte comparison.
    missing = [h for h, *_ in [(MAIN["href"],), *VIEWS, BENCH]
               if not (ROOT / "src" / h).exists()]
    if missing:
        print("BROKEN LINKS -- these files do not exist: " + ", ".join(missing))
        return 1

    if "--verify" in sys.argv:
        current = OUT.read_text() if OUT.exists() else ""
        same = current == html
        h = lambda s: hashlib.sha256(s.encode()).hexdigest()[:16]
        print(f"built  {len(html.encode()):>7} bytes  sha {h(html)}")
        print(f"onDisk {len(current.encode()):>7} bytes  sha {h(current)}")
        print("BYTE-IDENTICAL" if same else "DIFFERS -- gate FAILED")
        return 0 if same else 1

    OUT.write_text(html)
    print(f"wrote {OUT} {len(html.encode())} bytes; {len(VIEWS) + 2} links checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
