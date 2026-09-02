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
import base64, hashlib, json, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import page as P

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "index.html"

# The page fetches its own freshness from R2 at load time. It must NOT be baked
# in at build time: Pages serves code and R2 serves data, and a state baked into
# a deployed page would be a lie by the following morning. It is also why this
# is the one page that makes a network request, and why it carries a CSP.
DATA_ORIGIN = "https://data.readthegame.co"

def _module(name):
    """Inline a real ES module for the browser. node imports it for tests; the
    browser gets it with the module syntax stripped."""
    src = (ROOT / "src" / "lib" / name).read_text()
    body = re.sub(r"^[ \t]*import(?=[\s{'\"*])[^;]*?;[ \t]*$", "", src, flags=re.M)
    return body.replace("export ", "")

def _csp(html, *, connect=DATA_ORIGIN):
    """Delegates to page.csp — see there for why there is only one copy.

    `connect` defaults to the data origin because the two pages that fetch are
    the ones this builder was written for. The learn and workshop pages pass
    None: they read nothing, and a policy naming a reach a page does not use is
    what the deploy gate now reads as permission to call out.
    """
    return P.csp(html, connect=connect)

# THE PAGE NAMES NO GAME AND NO TEAM.
#
# It used to compile MIN at BUF into the markup -- score, shots, date -- because
# there was one game. There are 4,553 now, and every one of those literals was a
# claim that went stale. The page is a SHELL: it reads the catalog and the
# measurement at load time and renders whatever the archive currently holds.
# Same rule game.html already follows, and the same reason.

# The workshop. Kept, because each answers a question the main app does not, and
# demoted, because they were competing with the front door.
WORKSHOP = [
    ("read-the-game.html", "The reference game",
     "MIN at BUF, 10 November 2023, compiled in — the one page that works offline."),
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

# The honest limits, on the page rather than in a README nobody opens.
# Doctrine 9 -- selective honesty is worse than none, because it looks rigorous.
#
# THE FIRST ONE USED TO BE FALSE. It read "One game, not a season. Everything here
# is MIN at BUF" long after the archive held three seasons -- a stale claim inside
# the block whose entire job is stating limits, which is the worst place for one.
LIMITS = [
    # ⭐ THE EXCLUDED COMPETITIONS ARE GENERATED FROM data/competitions.json.
    #
    # This sentence used to name "Preseason, the Olympics and the 4 Nations
    # Face-Off" and it had been wrong since February 2024: the archive also holds
    # four ALL-STAR games, which it never mentioned. Nothing could catch that.
    # Prose in a builder cannot be compared to a table by anything except a
    # person remembering to -- and the block whose entire job is stating limits
    # is the worst possible place for a limit that goes quietly stale. This same
    # list already shipped "One game, not a season" long after the archive held
    # three, which is the same defect in the same four lines.
    #
    # A competition the league invents next February appears here the day someone
    # names it, and until they do, derive.py's nightly run is red.
    #
    # AND IT SAYS WHERE THEY ARE. Until 2026-08-21 this sentence promised those
    # games were "in the archive" with no surface anywhere that could show one.
    # The calendar is that surface, so the disclosure points at it: a limit a
    # reader can go and inspect is a different kind of claim from one they have
    # to take on trust.
    ("Regular season and playoffs, three seasons.",
     "2023-24 through 2025-26. Other competitions in the archive &mdash; "
     "__EXCLUDED__ &mdash; are deliberately left out of every number here. They "
     "are different competitions, and averaging across them would describe none. "
     "<a href=\"calendar.html\">They are on the calendar</a>, counted separately "
     "and never added to an NHL total."),
    ("A replay, not live coverage.",
     "Every game here is over. Nothing is fetched from the league while you watch; "
     "the events were pulled once, checked against the league's own boxscore, and "
     "stored."),
    ("Nothing is modelled or invented.",
     "Every mark traces to a recorded event. There is no expected-goals number, "
     "because that would be our estimate presented as the game's fact."),
    ("We say what we could not read.",
     "Games we hold but cannot show are listed anyway, with the check that stopped "
     "them. A schedule that hid them would be a map of our successes."),
]

TITLE = "Read the Game — hockey, made legible"
DESC = ("Three seasons of NHL games, replayed so a new fan can see what the numbers are made of. Nothing modelled, nothing invented.")

# The style and the policy are page-specific head content; the document
# shell itself lives in builders/page.py so there is one definition of
# what a complete, mobile-correct page is. Eight copies of a head is
# eight places for the next missing meta to hide.
STYLE = r"""<style>
:root{--ice:#eef4f8;--bg:#f4f7fa;--ink:#0f1a23;--muted:#5b6d7a;--edge:#ccd8e0;
 --min:#12885a;--buf:#bd8c12;--red:#c8102e;--blue:#3a5a9c}
*{box-sizing:border-box}
/* ⭐ THE CHROME IS FLUSH TO THE TOP, AND THE GUTTER MOVED BELOW IT.
   Kevin, 2026-08-27, comparing the two pages: "I much prefer the no padding, it
   tightens up the top of the page, which looks better than the home page, let's
   default to that." The game page had never carried this rule -- it ran on the
   browser's default 8px body margin -- so the site header sat 44px down and
   inset 22px here and flush there. Same header markup, different box.

   THE PADDING IS NOT DELETED, IT IS MOVED: `.wrap` takes it, so the header and
   footer go edge to edge and the CONTENT keeps the breathing room it had. A
   `body{padding:0}` on its own would have run the text into the viewport edge on
   a phone, which is the version of this change that looks tidy in a diff. */
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
 color:var(--ink);background:var(--bg);line-height:1.55;padding:0}
.wrap{max-width:900px;margin:0 auto;box-sizing:content-box;
 padding:clamp(18px,4vw,44px) clamp(14px,4vw,22px)}
.eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
h1{font-size:clamp(1.8rem,4vw,2.5rem);letter-spacing:-.025em;font-weight:800;margin:0 0 12px;text-wrap:balance}
h1.says{font-weight:400;letter-spacing:normal}
.says{font-size:1.06rem;line-height:1.5;color:var(--ink);margin:0 0 22px;max-width:56ch}
.says b{font-weight:700}
.conc{margin:0 0 26px}
.conc .ck{margin:0 0 7px;font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;
 color:var(--muted);font-weight:700}
.conc .ck+ul{margin:0 0 18px}
.clist{list-style:none;padding:0;display:grid;gap:6px;
 grid-template-columns:repeat(auto-fill,minmax(255px,1fr))}
.clist li{background:#fff;border:1px solid var(--edge);border-radius:9px;
 padding:9px 13px;font-size:.86rem;color:var(--muted)}
.clist li b{color:var(--ink);font-weight:650}
.cnote{font-size:.84rem;color:var(--muted);margin:0;max-width:62ch}
.lede{font-size:1.05rem;color:var(--muted);margin:0 0 22px;max-width:62ch}
.lede b{color:var(--ink);font-weight:600}
h2{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);
 font-weight:700;margin:34px 0 12px}

/* THE TEAM GRID IS ONE OBJECT, not thirty-three. Uniform chips, no typing, one
   click. Google-clean was the brief: above the fold is this and one link. */
.teams{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));
 gap:7px;margin:0 0 26px}
.chip{display:flex;align-items:center;justify-content:center;height:46px;
 border-radius:9px;text-decoration:none;font-weight:800;letter-spacing:.06em;
 font-size:.9rem;border:1px solid rgba(0,0,0,.12);
 transition:transform .12s ease,box-shadow .12s ease}
.chip:hover,.chip:focus-visible{transform:translateY(-2px);box-shadow:0 6px 16px rgba(16,32,45,.18)}

/* A team's games. The top row is the thing you press play on -- two clicks from
   a cold load to watching, which is the number this page was rebuilt for. */
.crumb{margin:0 0 14px;font-size:.85rem}
.crumb a{color:var(--blue);text-decoration:none}
.teamhead{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 4px}
.teamhead h2{margin:0;font-size:1.4rem;letter-spacing:-.02em;text-transform:none;
 color:var(--ink);font-weight:800}
.note{font-size:.86rem;color:var(--muted);margin:0 0 16px;max-width:62ch}
.seasons{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
.seasons a{font-size:.8rem;text-decoration:none;color:var(--muted);padding:4px 10px;
 border:1px solid var(--edge);border-radius:999px;background:#fff}
.seasons a.on{color:#fff;background:var(--blue);border-color:var(--blue);font-weight:700}
.seasons a:hover{border-color:var(--blue);color:var(--blue)}
.seasons a.on:hover{color:#fff}
.games{list-style:none;margin:0 0 26px;padding:0;display:grid;gap:6px}
.games li{background:#fff;border:1px solid var(--edge);border-radius:10px}
.games a,.games .off{display:grid;grid-template-columns:8.5rem 1fr auto;gap:12px;
 align-items:center;padding:11px 15px;text-decoration:none;color:inherit;font-size:.9rem}
.games a:hover,.games a:focus-visible{border-radius:10px;background:var(--ice)}
.games .d{color:var(--muted);font-variant-numeric:tabular-nums;font-size:.83rem}
.games .m{font-weight:600}
.games .r{font-variant-numeric:tabular-nums;color:var(--muted);font-size:.83rem}
.games li.first{border-color:var(--blue);box-shadow:0 4px 16px rgba(58,90,156,.14)}
.games li.first .m::after{content:" — press play";color:var(--blue);font-weight:600}
.games li.no{background:#f1f4f6}
.games .off{color:var(--muted)}

/* THREE POINTS ON ONE SCALE, AND DELIBERATELY NOT A LINE CHART.
   We refuse to plot the cumulative curve because its tail values are
   uninformative (n=10 gives a 9%-70% band) and its domain is continuous, so a
   line invites reading a value at k=17 that was never computed. Neither holds
   here: n is 3,957 / 4,029 / 3,855, and the domain is NOMINAL -- there is no
   measure BETWEEN "shots on goal" and "shot attempts", so interpolation is not
   misleading, it is meaningless, which is what makes it safe (CHENG).
   Two conditions, and they are enforced by a test: no connecting segment, and
   every point carries its own fraction. */
/* THE FRACTION IS THE PART THAT MUST SURVIVE (CHENG).
   Label and fraction share one row, and the label is the long one -- "the team
   that controlled play while the score was level lost". On a 360px screen a
   space-between row squeezes whichever child can give, and the one that can give
   is the number. So the row WRAPS, the fraction never breaks across lines
   mid-way, and below 30rem the two stack outright: the label takes the width it
   needs and the fraction sits underneath at full size. The track is decoration
   around the number; the number is the claim. */
 gap:2px 12px;align-items:baseline}
 white-space:nowrap;flex-shrink:0}
 transform:translate(-50%,-50%);border:2px solid #fff;box-shadow:0 1px 3px rgba(16,32,45,.3)}
/* The axis ends are the least load-bearing thing here, so they are the ones
   allowed to shrink and wrap. Order of sacrifice: end labels, then the track,
   never the fraction. */
 font-size:.72rem;color:var(--muted);margin-top:2px;font-variant-numeric:tabular-nums}
/* ONE REFERENCE CLASS FOR ALL THREE ROWS, said once. It used to ride on every
   row of a list that no longer exists. */

/* THE HERO IS A GAME. Read from the archive, never typed. */
.hero{background:#fff;border:1px solid var(--edge);border-radius:13px;
 padding:18px 20px 20px;margin:0 0 26px;box-shadow:0 4px 16px rgba(16,32,45,.06)}
.herokick{margin:0 0 7px;font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;
 color:var(--muted);font-weight:700}
/* The frame carries the rink's own aspect, so it does not letterbox on a phone
   or crop on a desktop. 200x85 is the rink; the scoreboard above it takes the
   rest, measured from the rendered page rather than guessed. */
.heroframe{margin:0 0 13px;background:var(--ice);border:1px solid var(--edge);
 border-radius:10px;overflow:hidden}
.heroframe iframe{display:block;width:100%;aspect-ratio:200/117;border:0}
/* A TALLER FRAME ON A PHONE, because the scoreboard inside it is not
   proportional even after it was made to shrink. Measured in a real browser:
   the chrome is 87px of an 856px-wide frame (10%) and 49px of a 287px one
   (17%), so one ratio cannot serve both -- at 200/108 the phone's rink fits
   the height and leaves empty ice down both sides. 200/128 gives the narrow
   frame the room its rink actually wants; the wide one is already exact. */
/* TALLER WHERE THE CHROME COSTS MORE -- and this breakpoint already existed,
   which is why a second query for the same job lost to it silently. The
   scoreboard and the penalty band are the frame's fixed furniture; the rink is
   what is left, and a fixed cost eats proportionally more of a narrow frame.
   128 left the ice 27px short of its own aspect, so it letterboxed -- narrower
   than the frame with white space either side, which reads as a SMALLER rink
   rather than a tighter one. Measured at 390 and 1100, not reasoned. */
@media (max-width:520px){.heroframe iframe{aspect-ratio:200/140}}
.heroline{margin:0 0 6px;font-size:1.22rem;line-height:1.35;font-weight:700;max-width:34ch}
.herosub{margin:0 0 4px;font-size:.9rem;color:var(--muted);max-width:56ch}
/* THE HERO'S RELATION TO THE RATE ABOVE IT. Same size and colour as .herosub,
   because it is the second half of the same thought and a louder treatment would
   make one game argue with 3,957. The verdict itself is bold; the rate that
   settles it is not. */
.herorel:empty{display:none}
.herorel{margin:0 0 15px;font-size:.9rem;color:var(--muted);max-width:56ch}
.herorel b{color:var(--ink);font-weight:650}
.herogo{display:inline-block;background:var(--ink);color:#fff;text-decoration:none;
 font-weight:700;padding:11px 18px;border-radius:9px;font-size:.95rem}
.herogo:hover,.herogo:focus{background:var(--blue)}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:12px}
.card{display:block;text-decoration:none;color:inherit;background:#fff;
 border:1px solid var(--edge);border-radius:12px;padding:15px 17px;
 /* ⭐ ROOM ABOVE THE CARD A READER JUST ARRIVED AT. Every card is now an anchor
    target -- the work panel links back to `#<card-id>` -- and without this the
    browser parks it flush with the top edge, which reads as a rendering glitch
    rather than as an arrival. It is only ever consumed on a `#hash` landing. */
 scroll-margin-top:16px}
.card:hover,.card:focus-visible{border-color:var(--blue)}
.card .t{font-weight:700;margin:0 0 5px}
.card p{margin:0;font-size:.86rem;color:var(--muted)}

/* THE TWO GROUPS ARE MADE TO LOOK DIFFERENT, not merely ordered. The split is
   the page's whole argument -- what the league does, against what we chose to
   count -- and a uniform grid flattens two kinds of claim into one row of
   cards. The measurement group takes the blue left edge that already means
   "our claim" on `.limits`, so the distinction is one a reader has met before. */
.grid.learn{margin:0 0 20px}
.grid.learn.ours .card{border-left:3px solid var(--blue)}
.card .at{margin-top:8px;font-size:.72rem;letter-spacing:.05em;color:var(--muted);
 font-variant-numeric:tabular-nums}

/* THE CALENDAR (C1). In the shared sheet because the learn page's selectors
   already are: one stylesheet for the pages this builder emits, so there is one
   place a colour or an edge is defined. */
.months{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 14px}
.months a{font-size:.76rem;text-decoration:none;color:var(--muted);padding:3px 8px;
 border:1px solid var(--edge);border-radius:999px;background:#fff}
.months a.on{color:#fff;background:var(--ink);border-color:var(--ink);font-weight:700}
.months a.nil{opacity:.55}
.months a:hover{border-color:var(--blue);color:var(--blue)}
.months a.on:hover{color:#fff}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:0 0 14px}
.cal .dow{font-size:.62rem;letter-spacing:.07em;text-transform:uppercase;
 color:var(--muted);text-align:center;padding:2px 0}
.cell{position:relative;display:flex;flex-direction:column;align-items:center;
 justify-content:center;gap:2px;min-height:54px;padding:12px 2px 4px;
 background:#fff;border:1px solid var(--edge);border-radius:8px;
 text-decoration:none;color:inherit}
.cell .dy{position:absolute;top:2px;left:5px;font-size:.6rem;color:var(--muted);
 font-variant-numeric:tabular-nums;line-height:1}
/* THE COUNT WE MAKE CLAIMS ABOUT: full ink, and the only thing in the cell that
   is ever summed anywhere on this site. */
.cell .n{font-size:1.1rem;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
/* AND THE ONE WE DO NOT. A dashed edge rather than only a colour, so the
   difference survives a reader who cannot separate the two hues -- the label
   itself is under the grid, where there is room to be right about which
   competition it is. */
.cell .o{font-size:.64rem;font-weight:700;line-height:1.5;color:var(--muted);
 border:1px dashed #9fb3c0;border-radius:5px;padding:0 4px;
 font-variant-numeric:tabular-nums}
.cell.pad{background:transparent;border:0}
.cell.void{background:transparent;border-color:transparent}
a.cell:hover,a.cell:focus-visible{border-color:var(--blue);
 box-shadow:0 4px 12px rgba(58,90,156,.14)}
/* A cell is 48px square-ish on a phone, which is all there is. Given room it
   should look like a calendar rather than a row of flat slots -- 125x54 read as
   a table with the lines rubbed out. */
@media (min-width:700px){.cell{min-height:78px}.cell .n{font-size:1.3rem}}
.offnote{font-size:.84rem;color:var(--muted);margin:0 0 22px;max-width:62ch}
.offnote b{color:var(--ink);font-weight:650}
.gk{margin:0 0 7px;font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;
 color:var(--muted);font-weight:700}
/* The NAME shouts; the qualifier after it does not. A whole sentence in
   letter-spaced capitals wrapped to two lines of shouting at 390px. */
.gk span{text-transform:none;letter-spacing:normal;font-weight:400}
/* A DEAD END, WHICH IS A STATE AND NOT A LIST. Same furniture as `.limits` --
   a claim of ours, on the blue edge -- because that is what it is. */
.dead{background:#fff;border:1px solid var(--edge);border-left:3px solid var(--blue);
 border-radius:10px;padding:12px 14px;margin:0 0 22px;font-size:.88rem;
 color:var(--muted);max-width:62ch}
.dead b{display:block;color:var(--ink);font-weight:650;margin-bottom:2px}
/* The night list is a MATCHUP and a RESULT; the team page's list leads with a
   date, which on a page whose heading IS the date would be the same word twice. */
.games.night a,.games.night .off{grid-template-columns:1fr auto}
/* A REFUSED ROW STACKS. Its right-hand cell is a sentence, not a score, and
   `auto` gave it whatever it asked for -- which squeezed "Arizona Coyotes at
   Los Angeles Kings" into a five-line column beside it. */
.games.night .off{grid-template-columns:1fr;gap:3px}
.games.night li.uncounted{border-left:3px dashed #9fb3c0}
/* D10's note, in the same voice as the dashed-count note above it: a small
   qualifying sentence under the list, not a warning. The disagreement is the
   LEAGUE's, between its own two documents, and we are reporting it rather
   than apologising for it. */
p.disputed{font-size:.8rem;color:#5d6f7c;margin:10px 0 0;max-width:62ch}
.bydate{margin:14px 0 0;font-size:.9rem}
.bydate a{color:var(--blue);text-decoration:none;font-weight:600}
.bydate a:hover{text-decoration:underline}
.limits{display:grid;gap:11px;margin:0;padding:0;list-style:none}
.limits li{background:#fff;border:1px solid var(--edge);border-left:3px solid var(--blue);
 border-radius:0 10px 10px 0;padding:12px 16px}
.limits b{display:block;font-size:.93rem;margin-bottom:2px}
.limits span{font-size:.87rem;color:var(--muted)}

.state{font-size:.83rem;color:var(--muted);margin:0 0 22px;padding:9px 14px;
 background:#fff;border:1px solid var(--edge);border-left:3px solid var(--edge);
 border-radius:0 9px 9px 0;max-width:70ch}
.state[data-state="stalled"],.state[data-state="halted"]{border-left-color:var(--flag,#d9662b)}
.state[data-state="behind"]{border-left-color:var(--buf)}
.state[data-state="current"],.state[data-state="quiet"]{border-left-color:var(--min)}
.state b{color:var(--ink);font-weight:600}
a:focus-visible{outline:2px solid var(--blue);outline-offset:3px}
footer{margin-top:38px;padding-top:18px;border-top:1px solid var(--edge);
 font-size:.79rem;color:var(--muted);max-width:70ch}
footer a{color:var(--blue)}
footer p{margin:0 0 8px}
/* NARROW SCREENS. The three-column game row is 8.5rem of date plus a result plus
   a score — about 300px of content before it starts squeezing, which is most of a
   360px phone once padding is taken off. Below 30rem it stacks, and the chips get
   smaller so a row of them still fits without the grid forcing a scrollbar.

   This is where the whole site was wrong until Kevin asked about phones: not the
   CSS, but the missing viewport meta above it. Without that, none of this applies
   at all -- the phone lays out at ~980px and scales the result down. */
@media (max-width:30rem){
  .games a,.games .off{grid-template-columns:1fr auto;gap:2px 10px;padding:10px 12px}
  .games .d{grid-column:1/-1;order:-1}
  .games .m{font-size:.92rem}
  .games li.first .m::after{content:""}
  .games li.first .m::before{content:"▶ ";color:var(--blue)}
  .teams{grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:6px}
  .chip{height:42px;font-size:.82rem}
  .rates li{flex-direction:column;gap:2px}
}
/* ⚠️ `animation`, NOT JUST `transition`. This rule said `transition:none` alone
   for as long as it has existed, and that was harmless only because these pages
   carried ZERO @keyframes -- an un-reachable gap reads exactly like a working
   guard. The learn page's rule diagrams animate, so it became live the moment
   the first figure shipped. app.css:1127 has always had the blanket form; this
   is the same rule, finally saying the same thing. */
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>"""

# THE FOUR THINGS EVERY PAGE SCRIPT ON THIS SITE NEEDS, DEFINED ONCE.
#
# They were inline in BODY until the calendar page needed the same four, and a
# second `when()` in the same file is precisely the divergence this builder's
# own docstring argues against for the stylesheet. `MON` in particular: two
# spellings of the month names is how one page says "Feb" and another "February"
# for a reason nobody can find.
#
# ES5 ON PURPOSE, like the page scripts they live in. The inlined modules above
# them are modern; these are hand-written and match their surroundings.
HELPERS = r"""  var $ = function (id) { return document.getElementById(id); };
  var ORIGIN = __ORIGIN__;
  var MON = ['January','February','March','April','May','June','July','August',
             'September','October','November','December'];

  function when(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : (d || '');
  }
  function grab(name) {
    return fetch(ORIGIN + '/' + name, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }"""

BODY = r"""<div class="wrap">
<p class="eyebrow">Read the Game</p>
<!-- WHAT THIS IS, IN ONE SENTENCE, WHICH THE PAGE DID NOT SAY AT ALL.
     A stranger's questions are, in order: what is this, why should I care, what
     do I do. Only the third had an answer above the fold, and it was a button. -->
<h1 class="says">__SAYS__</h1>

<!-- THE PAGE NOW LEADS WITH THE GAME. Kevin, with a screenshot of everything
     above the rink: "this is the area I would like removed... I think we lead
     with the 'Every game since 2023' [sentence]". So one sentence says what this
     is, and the next thing a visitor meets is hockey moving.
     Rendered by script from the catalog, because the team set is a fact about
     the archive and not a list to type. Thirty-three today: Arizona relocated to
     Utah inside the window this archive covers. -->
<main id="main">
  <!-- THE HERO IS A GAME, and it is READ, never typed.
       docs/homepage.md §1 already flagged the old typed-in hero as "the same
       shape as the hard-coded date we just pulled out of game.html". Both
       ingredients are already in memory: `featured` is published in
       measures.json (teams that controlled play while the score was level AND
       LOST, sorted by edge) and the catalog is fetched anyway for the grid. So
       this costs zero extra requests and cannot go stale. -->
  <div class="hero" id="hero" hidden>
    <!-- ⭐ EMPTY IN THE MARKUP, AND WRITTEN FROM SCRIPT LIKE EVERY OTHER LINE
         IN THIS BLOCK. It read "The most recent game in the archive", which was
         true for exactly as long as the hero WAS the most recent game. The hero
         now prefers one whose replay reaches a goal, which is a median of zero
         days behind and occasionally several -- and a fixed sentence describing
         a rule that has two branches is false in one of them. Which branch fired
         is known only to `hero()`, so the sentence is written there. -->
    <p class="herokick" id="herokick"></p>
    <!-- THE REAL RENDERER, FRAMED. Not a recorded video: no binary asset to go
         stale, no media-src in the policy, nothing to re-record when the rink
         changes, and every mark still traces to a recorded event. The frame is
         created in script AFTER the catalog says which game is newest, which
         also means it never loads for a visitor who does not reach it. -->
    <div class="heroframe" id="heroframe"></div>
    <p class="heroline" id="heroline"></p>
    <p class="herosub" id="herosub"></p>
    <!-- WHETHER THIS GAME IS THE USUAL CASE. Declared here and filled from
         script, like every other line in this block -- a slot in the markup is
         also the one place that decides whether it is shown, and `:empty` keeps
         a game the rate cannot classify from taking any room. -->
    <p class="herorel" id="herorel"></p>
    <a class="herogo" id="herogo" href="game.html">Watch the whole game &rarr;</a>
  </div>
</main>
<h2 id="teams-h">Watch your team</h2>
<p class="note">Every game each club played, newest first. Arizona became Utah in
2024 &mdash; both are here, because both played.</p>
<div class="teams" id="teams"></div>
<!-- THE SECOND WAY IN, and it is a LINE rather than a second index.
     CHENG's ruling (docs/discovery.md §10.4): a month grid on the home page
     needs a rule for which month and every rule has an ugly case -- "most
     recent" is an empty August on the front door for the newcomer arriving from
     a summer link, and a calendar's whole value is navigable RANGE, which one
     month cannot provide. So the grid gets its own page and the front door gets
     the cheap half: about 40px, discoverable, no second index to attend to.
     Revealed by drawGrid, so it appears exactly where the chips do and never
     dangles under an empty div on a team page. -->
<p class="bydate" id="bydate" hidden><a href="calendar.html">Or browse by date &rarr;</a></p>
<h2>What this does and does not claim</h2>
<ul class="limits">
__LIMITS__
</ul>

<p class="state" id="state" data-state="empty">Checking how current this data is&hellip;</p>

<!-- THE PAGE'S OWN FOOTER IS GONE, and it was a leftover rather than a choice.
     It predates the shared chrome: when `page.py` grew a site footer this page
     kept its old one, so the home page said the attribution TWICE, in two
     wordings, and only one of them was on the other eight pages. Kevin: "please
     remove this section, since the footer contains the disclaimer."
     Every claim it made survives in `page.py::_footer` -- the source of the
     data, the not-affiliated line, the no-marks line, and the link to the
     source -- which is the only copy any page can be missing. -->
</div>
<script>
__LIB__
/* NOTHING ON THIS PAGE IS BAKED IN.
   Pages serves CODE and R2 serves DATA. The team set, the games, the freshness
   line and the three rates are all read at load time, because the nightly
   deliberately does not trigger a deploy -- so anything compiled in here would be
   a lie by the next morning. The page shipped a hard-coded date once already.

   A failure is a STATE, not an exception. If a document does not arrive the page
   says which one and why, rather than rendering an empty shell that looks broken
   for no stated reason. Opened from disk, every fetch fails and the page says so,
   which is honest: a saved copy genuinely has no archive behind it. */
(function () {
__HELPERS__
  /* THE TEAM SET IS A FACT ABOUT THE ARCHIVE, never a typed list. It is 33 today
     because Arizona relocated to Utah inside our window, and a "32 NHL clubs"
     constant would have been wrong on the first day. */
  function teamsIn(games) {
    var seen = {};
    games.forEach(function (g) {
      if (!inScope(g.id)) return;
      seen[g.a] = 1; seen[g.h] = 1;
    });
    return Object.keys(seen).sort();
  }

  function chip(ab) {
    var t = TEAMS[ab] || { colour: '#5b6d7a' };
    var a = el('a', 'chip', ab);
    a.href = '?team=' + ab;
    a.style.background = t.colour;
    a.style.color = inkOn(t.colour);
    a.setAttribute('aria-label', nameOf(ab));
    return a;
  }

  function drawGrid(games) {
    var box = $('teams');
    box.textContent = '';
    teamsIn(games).forEach(function (ab) { box.appendChild(chip(ab)); });
    $('bydate').hidden = false;
  }

  /* A team's games, newest first. The first VIEWABLE one is the thing you press
     play on, so a cold visitor reaches a game in two clicks.

     REFUSED GAMES ARE LISTED, greyed, with the check that stopped them. Hiding
     them would make this a map of our successes -- Doctrine 9 -- and inside the
     scope that reasoning is unchanged. */
  /* THE SEASON IS THE UNIT A HOCKEY FAN THINKS IN, and it is also what keeps this
     page to the brief. Buffalo have 259 games in the archive; rendering all of
     them is a wall, which is the opposite of what was asked for. Read from the
     game id -- 2025020123 is season 2025-26 -- so it needs no lookup and cannot
     disagree with the id. */
  function seasonOf(id) { return +String(id).slice(0, 4); }
  /* `seasonLabel` is in archive.js, because the calendar's season tabs print
     the same string and two spellings of it is one page saying 2023-2024. */

  function drawTeam(ab, games, want) {
    var all = games.filter(function (g) {
      return inScope(g.id) && (g.a === ab || g.h === ab);
    }).sort(function (x, y) { return x.d === y.d ? y.id - x.id : (x.d < y.d ? 1 : -1); });

    var seasons = [];
    all.forEach(function (g) {
      var s = seasonOf(g.id);
      if (seasons.indexOf(s) === -1) seasons.push(s);
    });
    seasons.sort(function (a, b) { return b - a; });
    /* Default to the newest season this team actually has, not to the newest in
       the archive: Arizona's last is 2023-24, and defaulting to 2025-26 would
       show a fan an empty page for a team we hold 82 games of. */
    var season = seasons.indexOf(want) === -1 ? seasons[0] : want;
    var mine = all.filter(function (g) { return seasonOf(g.id) === season; });

    var main = $('main');
    main.textContent = '';
    var crumb = el('p', 'crumb');
    var back = el('a', null, '← All teams');
    back.href = '.';
    crumb.appendChild(back);
    main.appendChild(crumb);

    var head = el('div', 'teamhead');
    head.appendChild(el('h2', null, nameOf(ab)));
    head.appendChild(el('span', 'd', all.length + (all.length === 1 ? ' game' : ' games')
                                    + ' in the archive'));
    main.appendChild(head);
    if (NOTES[ab]) main.appendChild(el('p', 'note', NOTES[ab]));

    if (seasons.length > 1) {
      var bar = el('p', 'seasons');
      seasons.forEach(function (s) {
        var a = el('a', s === season ? 'on' : null, seasonLabel(s));
        a.href = '?team=' + ab + '&season=' + s;
        bar.appendChild(a);
      });
      main.appendChild(bar);
    }

    if (!mine.length) {
      main.appendChild(el('p', 'note',
        'We hold no regular-season or playoff games for ' + nameOf(ab) + '.'));
      return;
    }

    /* D10's note goes BEFORE the list, and that is a measurement rather than a
       preference: under an 82-row team page it rendered at y=7401 on a 390px
       phone -- seven thousand pixels below the mark it explains. */
    var note = disputedNote(disputedCount(mine));
    if (note) main.appendChild(el('p', 'disputed', note));

    var list = el('ul', 'games'), first = true;
    mine.forEach(function (g) {
      var li = el('li');
      var them = g.a === ab ? g.h : g.a;
      var home = g.h === ab;
      var us = home ? g.hs : g.as, they = home ? g.as : g.hs;
      var line = (us > they ? 'Beat ' : 'Lost to ') + nameOf(them);
      var row;
      if (g.v) {
        row = el('a', null);
        row.href = 'game.html?game=' + g.id;
        if (first) { li.className = 'first'; first = false; }
      } else {
        li.className = 'no';
        row = el('div', 'off');
        line = 'We hold this game but cannot show it';
      }
      row.appendChild(el('span', 'd', when(g.d)));
      row.appendChild(el('span', 'm', g.v ? line : line));
      /* D10, and the same wording the calendar uses -- see
         archive.js::disputedNote. The mark goes on the shot figure because
         `ash`/`hsh` are the BOXSCORE's numbers and the game page replays the
         event log, so on these rows the two surfaces genuinely differ. */
      row.appendChild(el('span', 'r', g.v
        ? (home ? g.hs + '–' + g.as : g.as + '–' + g.hs)
            + '  ·  ' + (home ? g.hsh + '–' + g.ash : g.ash + '–' + g.hsh) + ' shots'
            + (g.u === 1 ? DISPUTED_MARK : '')
        : (g.r || 'refused')));
      li.appendChild(row);
      list.appendChild(li);
    });
    main.appendChild(list);
  }


  /* ONE GAME, READ FROM THE ARCHIVE, NEVER TYPED.
     `featured` is the archive's own ranking -- teams that controlled play while
     the score was level AND LOST, sorted by the size of that edge -- and the
     catalog is already in memory for the grid, so the opponent, the date and
     the score cost nothing. A hero compiled into this builder would be the same
     defect as the hard-coded date we pulled out of game.html. */
  /* THE MOST RECENT GAME, NOT THE SHARPEST ONE.
     The hero used to be `featured[0]` -- the archive's largest level-control
     upset -- and only 2 games in 4,119 clear that threshold, so the slot would
     have read "19 February 2024" for years. A rule that updates twice per three
     seasons is a literal with extra steps, which is the exact defect
     docs/homepage.md §1 flagged in the hard-coded hero before it.
     Recency is MORE deterministic, not less: it is the same rule the game page
     already uses to choose a game, it cannot be typed, and it refreshes itself
     nightly with no deploy. And choosing what to SHOW by date biases no
     measurement -- the base rates still run over all 4,119 in-scope games, and
     nothing is computed from the selection. */
  /* ⭐ AND IT SHOWS A GOAL, WHICH IS A SELECTION AND NEVER A JUMP.
     Kevin: "we should show the goal during the first ten seconds of the hero
     game -- that's where the most visualization takes place", and then "let's
     end the hero replay right after the goal". He is right about the renderer: a
     goal is the only event with a real treatment (r 3.2 against 1.7, a 0.7s
     flare from 3.6x, a 1.3s net flash, the siren caption) and the preview
     otherwise shows a stranger dots appearing.

     THE OBVIOUS IMPLEMENTATION IS THE WRONG ONE. Starting the preview AT the
     goal would break the thing the preview exists to demonstrate: the counter is
     watched from zero, because "a counter you join at 24-11 is a number you did
     not watch being built" (src/app.js). So the goal has to come to us, and the
     LOOP ENDS ON IT instead of running out a budget.

     `hl` IS THE LOOP, NOT THE GOAL'S INDEX. derive.py stores the distance from
     the preview's opening frame to the first goal. Selecting on the raw index
     was measured to be wrong: "goal within 12 plays" gives a median loop of FIVE
     plays and a p10 of ONE, because the loop does not start at play zero.

     THE WINDOW IS KEVIN'S TEN SECONDS, MEASURED OUTWARDS. At the replay's own
     pace 30s buys a median 16 plays, so ten seconds is about five. [3,8] is
     6-15s around that, and it is the range where the cost stops being free:
     across 4,192 in-scope games the newest qualifying game is a MEDIAN OF 0 DAYS
     behind the newest game (p90 3, p99 20), where the tighter [4,6] is p90 SEVEN
     and p99 forty-eight. Kevin: "let's start with that and work outwards (if
     needed)" -- so the two numbers are here, together, to be moved together.

     THE FLOOR IS 3 AND NOT 1 BECAUSE `hl` IS AN ESTIMATE. derive.py counts the
     first attempt of any strength; the real opening frame comes from corsi's
     even-strength counted set and can only be LATER, so the true loop is never
     longer than `hl` and the floor absorbs the difference.

     AND IT FALLS BACK RATHER THAN FAILING. If nothing qualifies -- an archive
     too small, a run of goalless openings -- the hero is the newest game, which
     is exactly what it was before, and the preview runs its budget the way it
     always did. A front door with no game is worse than one that opens quietly. */
  var HERO_LOOP = { min: 3, max: 8 };

  function hero(games) {
    var v = games.filter(function (g) { return g.v && inScope(g.id); });
    v.sort(function (a, b) { return a.d === b.d ? a.id - b.id : (a.d < b.d ? -1 : 1); });
    for (var k = v.length - 1; k >= 0; k--) {
      var g = v[k], n = g.hl;
      if (typeof n === 'number' && n >= HERO_LOOP.min && n <= HERO_LOOP.max)
        return { game: g, toGoal: true };
    }
    /* THE FALLBACK IS NAMED, not left to be inferred from a null. The caller has
       to say something true above the rink and the two branches are showing
       different things -- one runs to a goal, the other runs a budget. */
    return v.length ? { game: v[v.length - 1], toGoal: false } : null;
  }


  /* THE SENTENCE UNDER THE RINK, ON THE MEASURE THE BAR ABOVE IT SHOWS.
     Kevin: "we show Control in the replay loop but describe shots on goal in the
     text below the rink, those should be consistent... they need to be the same
     measure." It used to read off `ash`/`hsh`, which are the LEAGUE's shots on
     goal quoted into the catalog, while the loop counted attempts -- two
     measures on one screen with nothing saying they were different.

     IT IS ABSENT UNTIL THE NUMBER EXISTS, and that is the site's own idiom
     rather than a compromise: the verdict card is absent until the horn, the
     whistle layer's why-line stays empty. A sentence that renders on shots and
     then rewrites itself to attempts would be worse than either.

     THE COST, STATED: this sentence now depends on the preview frame having
     booted. That is a real coupling and it is the one this project has flagged
     hardest before -- if the frame ever goes, this goes with it. */
  function sayHero(g, measures, att) {
    var a = att.a, h = att.h;
    if (!a && !h) return;                 /* nothing counted: say nothing */
    var lead = a === h ? null : (a > h ? g.a : g.h);
    /* ⭐ AND IT NO LONGER SAYS WHO WON.
       Kevin, reading the front door after the score came off the line above:
       "VGK took more shot attempts, 50 to 44, and lost ... i.e. we still give
       away the outcome of the game." He is right, and the margin coming off
       while the RESULT stayed was half a fix -- the visitor still knew how it
       ended before pressing anything.
       THE ARGUMENT SURVIVES INTACT, and it is stronger as a question than as a
       statement. The pitch was `... and lost. That is the usual outcome.` --
       a tension raised and resolved in the same breath, with nothing left for
       the button to answer. What replaces it raises the tension and stops:
       the attempts, then the archive's own rate, then `Watch the whole game`.
       NOTHING IS HIDDEN, and nothing here is newly withheld that the scoreboard
       does not fill in as the game plays. */
    if (lead == null) {
      $('herosub').textContent = 'Both teams took ' + a + ' shot attempts.';
    } else {
      var hi = Math.max(a, h), lo = Math.min(a, h);
      $('herosub').textContent = lead + ' took more shot attempts, ' + hi + ' to ' + lo + '.';
    }

    /* IS THIS THE USUAL CASE? COMPUTED, NEVER WRITTEN -- unchanged in shape from
       the shots version, because the reason for that shape did not change. The
       hero is the most recent game, so some nights the attempts leader won and
       some nights it lost; a hand-written clause here would be copy asserting a
       relationship the data is free to invert overnight.
       SAID EITHER WAY ROUND, because naming the relationship only when the game
       is the exception is Doctrine 9's selective honesty.
       NOTHING IS SAID WHEN NOTHING CAN BE: a tie in the measure has no leader
       and a tie on the scoreboard has no outcome.
       AND THE RATE APPLIES HERE. It is conditioned on FINAL totals, which is
       what this is -- the game is over. (CHENG: that is why this does not
       collide with his ruling that the rate must not sit beside a LIVE count.) */
    var at = measures && measures.baseRates && measures.baseRates.moreAttemptsLost;
    var rel = $('herorel');
    rel.textContent = '';                 /* a second message must not append twice */
    /* `won` IS GONE FROM THIS BRANCH TOO, and with it the condition that a level
       game gets silence. That rule existed because there was an OUTCOME to
       classify and a draw could not be classified; the rate is a fact about the
       archive, not a verdict on this game, so the only thing that can still
       withhold it is having no attempts leader to talk about.
       THE DIRECTION IS STILL READ, NEVER ASSUMED. The archive publishes every
       rate as "lost", so a caption saying the leader WINS must print 100 minus
       that -- a correct sentence with the wrong number welded to it is the
       failure this shape exists to prevent. */
    if (lead != null && at && at.n) {
      var lostPct = at.count / at.n * 100;
      var usuallyLoses = lostPct > 50;
      var usualPct = (usuallyLoses ? lostPct : 100 - lostPct).toFixed(1);
      rel.appendChild(el('span', null, 'Across ' + at.n.toLocaleString()
        + ' games in this archive the team with more shot attempts '));
      rel.appendChild(el('b', null,
        (usuallyLoses ? 'loses' : 'wins') + ' ' + usualPct + '% of the time.'));
    }
  }

  function drawHero(cat, measures) {
    var pick = hero((cat && cat.games) || []);
    if (!pick) return;
    var g = pick.game;
    /* WHAT THE VISITOR IS ABOUT TO WATCH, in the words the branch earns. The
       goal branch is the common one and says what the loop actually does; the
       fallback says the older, weaker thing, which is still true of it. */
    $('herokick').textContent = pick.toGoal
      ? 'A recent game, up to its first goal'
      : 'The most recent game in the archive';

    /* THE FIVE-SECOND TASTE, and it is this site's own renderer in a frame.
       Created here rather than in the markup so it cannot load for a visitor who
       never gets a game, and so the id comes from the catalog instead of being
       typed. */
    var f = document.createElement('iframe');
    f.src = 'game.html?game=' + g.id + '&preview=1';
    f.setAttribute('title', 'A few seconds of ' + g.a + ' at ' + g.h + ', playing');
    f.setAttribute('loading', 'lazy');
    f.setAttribute('scrolling', 'no');
    f.setAttribute('tabindex', '-1');
    /* THE NUMBER ARRIVES FROM THE FRAME, and the listener is attached BEFORE the
       frame is, so a fast boot cannot beat it. Origin and source are both
       checked: same-origin only, and only from the frame we made. */
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || e.source !== f.contentWindow) return;
      var m = e.data;
      if (!m || m.rtg !== 'attempts' || m.game !== g.id) return;
      sayHero(g, measures, m);
    });
    $('heroframe').appendChild(f);

    /* ⭐ AND IT DOES NOT SAY HOW THE GAME ENDS.
       This read "CAR 5, VGK 3 — 9 June 2026" directly under a loop that now
       builds to a goal, in the largest type on the block. The loop was rebuilt
       to make a stranger want to press the button; the line under it answered
       the question the button asks. Same fix as the game line above the rink
       (src/app.js), same reason, and the pair is the point -- a replay that
       prints its ending before you press play is a recap.
       THE LISTS KEEP THEIR SCORES. Browsing is a choice and a visitor may well
       be looking for that 6-5 game; the hero is handed to you. The score
       appears where it was asked for, not where a game was chosen for you.
       ⚠️ THE SENTENCE BELOW THIS ONE STILL CAN. `sayHero` says "and won" or "and
       lost" when the attempts leader is decided, because that IS the site's
       argument and removing it would gut the pitch. So this is the margin
       withheld, not the outcome -- stated here rather than left to be
       discovered, because the two lines are eight pixels apart. */
    $('heroline').textContent = g.a + ' at ' + g.h + ' — ' + when(g.d);

    $('herogo').href = 'game.html?game=' + g.id;

    /* THERE IS NO SECOND LINK TO THIS GAME, and that is the fix rather than an
       omission. A separate "New to hockey? Start with the game at the top"
       sat 2.4 screens below this button, pointing at the same destination and
       telling the reader to scroll back up -- a page apologising for its own
       order. It also spent a week pointing at a DIFFERENT game, because its
       href was set from featured[0] while the hero moved to most-recent.
       With the one sentence above and the game here, the claim and the
       invitation are adjacent and one button is the whole funnel. Whether a
       novice needs to be addressed by name is for the tester, not a leftover. */
    $('hero').hidden = false;
  }

  var team = (/[?&]team=([A-Za-z]{2,3})/.exec(location.search) || [])[1];
  if (team) team = team.toUpperCase();
  /* A URL THAT NAMES A CLUB HAS ALREADY ASKED. This is an INTENT signal, not a
     returning-visitor one -- which is why it is read here and not out of
     localStorage the way the game page retires its greeting. Someone who names
     a club has told us what they want whether or not they have been here
     before, and intent should not have to wait for storage to agree.
     WHAT STAYS IS WHAT THE SITE *IS*: the h1 and the one sentence under it,
     76px at 1100 and 127px at 390. What goes is the ARGUMENT FOR WHY YOU
     SHOULD CARE, 414px and 622px, which is read once. Same split R made below
     the rink. Set before the fetch, so it does not depend on a network. */
  var season = +(/[?&]season=(\d{4})/.exec(location.search) || [])[1] || 0;

  Promise.all([grab('catalog.json'), grab('measures.json'), grab('index.json')])
    .then(function (r) {
      var cat = r[0], measures = r[1], index = r[2];
      var games = (cat && cat.games) || [];
      if (!games.length) {
        $('teams').appendChild(el('p', 'note',
          'The archive could not be loaded, so there are no teams to show.'));
      } else if (team) {
        drawTeam(team, games, season);
      } else {
        drawGrid(games);
        /* ONLY ON THE FRONT DOOR. A fan who asked for BUF is not looking for a
           Dallas game; the hero exists for the visitor who has not chosen. */
        drawHero(cat, measures);
      }
      var s = describe(index, new Date().toISOString());
      $('state').setAttribute('data-state', s.state);
      $('state').textContent = s.lines.join(' ');
    });
})();
</script>"""

# WHAT THE SITE IS, IN ONE SENTENCE. The page never said it.
#
# NO NUMBERS IN THIS TEXT, the same rule the thesis paragraph carries: the
# archive's size is fetched and rendered, never typed, so a sentence claiming a
# count would be a claim that goes stale between deploys. "Every NHL game since
# 2023" is a claim about SCOPE, which the limits block below states exactly and
# which does not move.
SAYS = ("Every NHL game since 2023, replayed event by event &mdash; with the counts "
        "built in front of you, so you can see <b>where a number comes from</b>.")


def _lib(*names):
    """Inline the analysis modules the browser needs, as real source.

    THE SAME FILES THE PIPELINE IMPORTS. `inScope` decides which games count here
    and in builders/measure.mjs; re-typing it in page script would be the second
    implementation this project keeps almost building. See docs/architecture.md.
    """
    return "\n".join(_module(n) for n in
                      (names or ("ingest-state.js", "competitions.js", "teams.js", "archive.js")))


def _competitions():
    """The gameType table, inlined as JSON for the page. See page.competitions."""
    return P.competitions()

def _workshop():
    return "\n".join(
        f'  <a class="card" href="{href}"><p class="t">{title}</p><p>{blurb}</p></a>'
        for href, title, blurb in WORKSHOP)

def _excluded():
    """The competitions deliberately left out of every number, from the table.

    ⭐ THE SAME RULE IS IN src/lib/competitions.js::excludedCompetitions, because
    this page is BUILT by Python and every other surface that names a competition
    is JavaScript. Two implementations of one rule is what `measure.mjs` exists
    to avoid -- so the seam is ASSERTED rather than assumed: test/index.test.js
    runs the JavaScript function and requires the rendered page to name exactly
    what it returns, in that order. Either side drifting is a red test, not a
    quiet disagreement about what this site excludes.

    DISTINCT NAMES: 4 and 12 are both all-star, 19 and 20 both 4 Nations. Ordered
    by the lowest type carrying each name, so the order is derived and stable.
    """
    names = json.loads((ROOT / "data" / "competitions.json").read_text())["names"]
    first = {}
    for key, name in names.items():
        t = int(key)
        if t in (2, 3):                      # the population every rate covers
            continue
        if name not in first or first[name] > t:
            first[name] = t
    ordered = [n for n, _ in sorted(first.items(), key=lambda kv: kv[1])]
    if len(ordered) < 2:
        return ordered[0] if ordered else ""
    return ", ".join(ordered[:-1]) + " and " + ordered[-1]


def _limits():
    return "\n".join(f"  <li><b>{h}</b><span>{b}</span></li>"
                     for h, b in LIMITS).replace("__EXCLUDED__", _excluded())


def _fig_json():
    return json.loads((ROOT / "data" / "learn-figures.json").read_text())


RULE_BODY = r"""<div class="wrap rulep">
<p class="eyebrow">Read the Game</p>
<p class="rback"><a href="/what-you-can-see.html">&larr; What you can see here</a></p>
<h1>__RULE_TITLE__</h1>
<p class="rlede">__RULE_LEDE__</p>
__RULE_FIG__
<p class="rdoor"><a class="rgo" href="/game.html__RULE_HREF__">__RULE_DOOR__ &rarr;</a></p>
<p class="rat">__RULE_AT__</p>
</div>"""

# ── A RULE GETS ITS OWN PAGE ────────────────────────────────────────────────
#
# Kevin, after looking at the first figure embedded in its card: *"I think I want
# the diagram in place of the game replay we currently get when the offside card
# is clicked. I don't think we'd like having all of the cards stacking on top of
# each other on mobile. Plus it'll obviously be a diagram, but the look and feel
# will be the same as the game page, which I think is good for consistency."*
#
# He is solving the cost this change was about to impose rather than paying it:
# one figure took the learn page from 2,337px to 2,695px at 390, and five would
# have put it near 4,300. As a destination the diagram costs the learn page
# nothing and gets a whole screen instead of a 323px card.
#
# ⭐ SAME STAGE, NO INVENTED INSTRUMENTS. "Similar layout to the game page,
# without the scoreboard, clock, controls, etc. -- similar yet different enough
# not to be confusing." So the rink sits in the same `.rinkbox` treatment the
# replay uses, on the same ice, at the same proportions; and there is no
# scoreboard, no clock and no transport, because a scoreboard with no game and a
# clock with no time would be fabrications -- which is the one part of the game
# page's furniture a diagram must not borrow.
#
# ⭐ AND THE DOOR MOVES DOWN A LEVEL RATHER THAN CLOSING. The card used to link
# straight to a real offside in BUF/MIN; if the diagram simply took that slot,
# the real instance would lose its only way in. So the page carries it: card ->
# diagram -> "See it in a real game" -> the moment. The teaching order is
# unchanged, it just has room now.
RULECSS = r"""<style>
.rulep{max-width:760px}
.rback{margin:0 0 4px;font-size:.86rem}
.rback a{color:var(--muted);text-decoration:none}
.rback a:hover,.rback a:focus-visible{color:var(--blue);text-decoration:underline}
.rulep h1{margin:0 0 6px}
.rlede{margin:0 0 14px;color:var(--muted);max-width:60ch}
/* THE RINK'S OWN FRAME, taken from app.css so the stage is the game's stage. */
.rulep .dgfig{margin:0 0 16px}
.rulep .dgice{background:var(--ice);border:1px solid var(--edge);border-radius:15px;
  padding:6px;box-shadow:0 6px 22px rgba(16,32,45,.08)}
.rulep .dgsteps{margin:14px 0 0;font-size:.94rem;max-width:60ch}
.rulep .dgsteps li{margin:0 0 8px}
.rdoor{margin:20px 0 6px}
.rgo{display:inline-block;background:var(--blue);color:#fff;text-decoration:none;
  font-weight:600;font-size:.94rem;padding:10px 16px;border-radius:9px}
.rgo:hover,.rgo:focus-visible{background:var(--ink)}
.rat{margin:0;font-size:.78rem;letter-spacing:.05em;color:var(--muted);text-transform:uppercase}
__FIGKEYS__
</style>"""


# ---------------------------------------------------------------------------
# ⭐⭐ THE ARCHIVE'S OWN FIGURES, READ AND FORMATTED — NEVER COMPUTED HERE.
#
# The measurement cards teach what we count and have never said what it lets a
# reader SEE, because every anchor that would say it lives in `measures.json`,
# which the GAME page fetches at runtime and a learn page cannot: these pages
# carry zero scripts and `connect-src 'self'`, which is most of their virtue.
#
# So `data/measures.json` is committed as a BUILD INPUT (16 KB) and substituted
# the way `__UNREACHED__` already is. Kevin's call, over a runtime fetch on six
# static pages and over putting the figure only where `RATES` already exists.
#
# ⚠️ IT IS A DERIVED ARTIFACT IN A REPO OF INPUTS, which is the exact shape that
# let five stale fixtures sit undetected — so it is gated from the first day
# rather than after it bites: `tools/measures_fresh.py` fetches the published
# file and diffs it, and `derive.yml` fails when the two have parted. Staleness
# here is visible in git and loud in CI, which is the difference.
#
# ⛔ AND THIS FUNCTION ONLY READS. Every rule that produced these numbers lives
# in `src/lib/archive.js` and ran in node; Python selects a field and formats a
# percentage. Anything needing a QUANTILE stays out — `reach`'s medians would
# require restating `distribution.js::quantile` in a second language, which is
# the one thing the pipeline is built not to do. Those wait for the number to be
# published beside the distribution.
def _archive():
    m = json.loads((ROOT / "data" / "measures.json").read_text())
    s = m["slot"]

    def pct(sh):
        # A published rate, formatted. `round` is presentation; the arithmetic
        # was `count / n` in archive.js and is not repeated here.
        return f"{sh['rate'] * 100:.1f}"

    def num(v):
        return f"{v:,}"

    out = {
        "__SLOT_IN_PCT__": pct(s["scoredFromInside"]),
        "__SLOT_OUT_PCT__": pct(s["scoredFromOutside"]),
        "__SLOT_IN_GOALS__": num(s["scoredFromInside"]["count"]),
        "__SLOT_IN_ATT__": num(s["scoredFromInside"]["n"]),
        "__SLOT_ATT_PCT__": pct(s["attempts"]),
        "__SLOT_ATT_IN__": num(s["attempts"]["count"]),
        "__SLOT_ATT_N__": num(s["attempts"]["n"]),
        "__ARCHIVE_GAMES__": num(m["measured"]),
    }
    # EVERY SHARE IT READS MUST STILL CARRY ITS OWN n AND POPULATION. The
    # published file is checked at the point of use, not trusted because CI
    # checked it once: a hand-edited `data/measures.json` is exactly how this
    # would go wrong quietly.
    for k in ("scoredFromInside", "scoredFromOutside", "attempts"):
        sh = s.get(k)
        if not sh or sh.get("rate") is None or not sh.get("n") or not sh.get("population"):
            raise SystemExit(f"learn: measures.json slot.{k} has no rate, n or population -- "
                             "re-run derive and refresh data/measures.json")
    return out


def _figures():
    """{cardId: rendered <figure>} — the rule diagrams, drawn by node.

    ⭐ SAME SEAM AS THE DOORS, FOR THE SAME REASON. `learn-figures.mjs` draws
    them with the replay's own `furniture()`, so the rink a novice is taught on
    and the rink they then watch are one implementation; restating any of that
    geometry in Python would be the second statement of a shared rule in a
    second language. Node draws, Python renders, and the two meet over one
    committed document.

    THE `<title>` IS THE ACCESSIBLE NAME and it says the word "Diagram" first.
    That is not the guard -- the outlined-neutral grammar is -- but a reader who
    cannot see the drawing at all should still be told which kind of thing it is.
    """
    out = {}
    # ⚠️ THE LINK TEXT COMES FROM THE CARD, NOT THE FIGURE. A figure has no title
    # of its own and should not gain one: the card already names the rule, and a
    # second name for one thing is how the learn page and the rule page start
    # disagreeing about what a card is called. Read here rather than at module
    # scope because LEARN_CARDS is defined below this function.
    titles = {c[1]: c[2] for c in LEARN_CARDS}
    # ⚠️ THE FIGURE'S CSS CLASS IS THE CARD ID'S FIRST TWO LETTERS, and each
    # figure scopes its keyframes by it (`.dgfig.ic .dgm-p`). Two cards sharing a
    # prefix would silently hand one figure the other's motion -- no error, no
    # warning, the wrong drawing. Today they are em/fa/ic/of/sl; the day they are
    # not, this says so instead of the page simply being wrong.
    _pre = [c[:2] for c in _fig_json()]
    if len(set(_pre)) != len(_pre):
        raise SystemExit(f"learn: two figures share a CSS prefix: {sorted(_pre)}")
    for cid, d in sorted(_fig_json().items()):
        steps = "".join(f"<li>{s}</li>" for s in d["steps"])
        # ⭐ `note` IS PROSE THAT IS NOT ABOUT A PLACE ON THE ICE, and it exists
        # because CHENG ruled the penalty kinds out of the drawing: "drawing the
        # three kinds at the places those fouls happen would be inventing
        # coordinates -- the taxonomy is a naming of `descKey` values and carries
        # no geometry." Every numbered step has a badge on the rink; a note has
        # none, deliberately, because there is nowhere for it to point.
        note = f'<p class="dgnote">{d["note"]}</p>' if d.get("note") else ""
        # ⭐ ONE DIAGRAM POINTING AT ANOTHER, and the only link on these pages that
        # is not a door into the replay. It exists because two rules share a
        # picture: a goaltender skating off is a delayed penalty OR a team losing
        # late, and a reader who meets one has no way to learn there is another.
        # The pairing is asserted to be MUTUAL in learn-figures.test.js — a
        # one-way "see also" is how the second card stays undiscovered.
        see = ""
        if d.get("see"):
            t = d["see"]["to"]
            see = (f'<p class="dgsee">{d["see"]["say"]} &mdash; '
                   f'<a href="/{t}.html">{titles[t]}</a>.</p>')
        out[cid] = (f'<figure class="dgfig {cid[:2]}">'
                    f'<svg class="dgice" viewBox="{d["viewBox"]}" role="img" '
                    f'aria-label="{d["label"]}">{d["svg"]}</svg>'
                    f'<ol class="dgsteps">{steps}</ol>{note}{see}</figure>')
    return out


def _learn():
    """The learn page, where every claim is a door into a real game.

    THE CARDS AND THE DOORS MUST CORRESPOND EXACTLY, and this is the only place
    that can check it. Prose lives here because every other page's prose does;
    the moments live in `data/learn-doors.json` because the URL grammar is
    JavaScript and restating it in Python is the defect `measure.mjs` exists to
    prevent. Two documents meeting over a shared set of ids is a seam, so the
    seam is asserted rather than assumed: a card with no door would render a
    dead link, and a door with no card would be a moment nobody can reach.

    THE COUNTS IN THE CLOSING SENTENCE ARE COUNTED, NOT TYPED. The old sentence
    was false because prose promised something no test could see. A sentence
    that states how many cards there are has a dependency on the card list, and
    the only fix that cannot rot is to derive it from the list being rendered.
    """
    d = json.loads((ROOT / "data" / "learn-doors.json").read_text())
    doors, g, fig = d["doors"], d["game"], d["figures"]
    arch = _archive()
    figures = _figures()

    ids, want = {c[1] for c in LEARN_CARDS}, set(doors)
    if ids != want:
        raise SystemExit("learn: cards and doors disagree -- "
                         f"cards without a door: {sorted(ids - want)}; "
                         f"doors without a card: {sorted(want - ids)}")
    # A FIGURE FOR A CARD THAT IS NOT HERE IS A DRAWING NOBODY SEES. The other
    # direction is deliberately allowed: Kevin ruled diagrams go only where "we
    # need graphics to teach", so most cards have none and that is not a gap.
    stray = set(figures) - ids
    if stray:
        raise SystemExit(f"learn: figures for cards that do not exist: {sorted(stray)}")
    # ⭐⭐ THE WALL BETWEEN THE TWO HALVES, ASSERTED ACROSS THE SEAM. The page keeps
    # the league's rules apart from what WE count so our measurements cannot
    # borrow the rulebook's authority, and a figure now declares which half it is
    # drawn for -- which decides whether it may paint our slot tint at all. Node
    # says one thing and this table says another, so the two are compared rather
    # than trusted: a slot figure that thought it was a rules figure would lose
    # the tint that IS its subject, and a rules figure that thought it was ours
    # would paint our claim on the league's ice.
    fig_group = {cid: d["group"] for cid, d in _fig_json().items()}
    card_group = {c[1]: c[0] for c in LEARN_CARDS}
    wrong = {cid: (g, card_group[cid]) for cid, g in fig_group.items() if card_group[cid] != g}
    if wrong:
        raise SystemExit("learn: a figure disagrees with its card about which half of "
                         f"the page it is on: {wrong}")

    out = []
    for kind, heading in LEARN_GROUPS:
        cards = [c for c in LEARN_CARDS if c[0] == kind]
        out.append(f'  <p class="ck">{heading}</p>')
        out.append(f'  <div class="grid learn {kind}">')
        for _, cid, title, blurb in cards:
            door = doors[cid]
            blurb = (blurb.replace("__UNREACHED__", str(fig["unreached"]["count"]))
                          .replace("__ATTEMPTS__", str(fig["unreached"]["n"])))
            for tok, val in arch.items():
                blurb = blurb.replace(tok, val)
            # The moment is shown, not just linked: a reader can see the card
            # points somewhere specific before spending a click on it.
            # ⭐ THE CARD CARRIES ITS OWN ANCHOR, which is what makes the trip
            # two-way. Until now this page had ZERO elements with an id: the
            # doors led into a game and nothing led back, so a reader who met
            # `Blocked credits the blocker` in the work panel and wanted to know
            # why had no way to reach the card that explains it. The id is the
            # card id -- the same key `doors` is keyed by and the guard above
            # already pins -- so the anchor cannot name a card that is not here.
            # ⭐ A CARD WITH A DIAGRAM LEADS TO THE DIAGRAM, NOT STRAIGHT TO THE
            # GAME -- Kevin's call after seeing the figure inside the card. The
            # card stays a short, scannable tile either way; what changes is
            # where it lands, and the real moment is one step further on. The
            # footer line says which kind of destination it is, because "Period 1
            # · 04:48 left" on a card that opens a drawing would be a small lie.
            if cid in figures:
                href, at = f"/{cid}.html", "Diagram &middot; then a real example"
            else:
                href = f'/game.html{door["href"]}'
                at = f'Period {door["per"]} &middot; {door["rem"]} left'
            out.append(f'    <a class="card" id="{cid}" href="{href}">'
                       f'<p class="t">{title}</p><p>{blurb}</p>'
                       f'<p class="at">{at}</p></a>')
        out.append("  </div>")

    p1 = sum(1 for c in LEARN_CARDS if doors[c[1]]["per"] == 1)
    y, m, day = g["date"].split("-")
    when = f"{int(day)} {MONTHS[int(m) - 1]} {y}"
    # ⚠️⚠️ THIS SENTENCE CONTRADICTED A CARD SITTING TWO ELEMENTS ABOVE IT.
    # It read "Every one of them is a toggle on a real game", and the empty-net
    # card's own blurb says "Nothing is toggled here -- the goalie is simply no
    # longer on the ice." `empty-net` is the one door with `layers: []`, and
    # test/learn.test.js asserts that ten lines above the test that guards this
    # paragraph. Both were green, on a page a reader can catch by reading.
    #
    # ⭐⭐ THE GUARD WATCHED THE ARITHMETIC AND NEVER THE CLAIM. It checked that
    # "9" matches the card count and "8" matches the period-1 doors -- and its
    # own comment says "this page has already broken exactly that way once",
    # which is true of the numbers and blind to the assertions around them. An
    # instrument aimed at one axis reads as coverage for all of them.
    #
    # ⭐ AND THE SECOND CLAUSE HAD DRIFTED THE SAME WAY. "Every one shows the
    # events it counted and the events it did not" is true of the measurement
    # layers and of nothing else -- it is already the `ours` group's own heading
    # ("each showing its work"), so it was a claim about half the page, made
    # about all of it, in the one place it was not needed.
    # "These N moments" went for a third reason: 6 of the 9 cards now lead to a
    # DIAGRAM, and each says so in its own `at` line, so the page called them
    # moments while labelling them drawings.
    #
    # WHAT IS LEFT IS WHAT SURVIVES BEING CHECKED: every card does reach a real
    # game (directly, or through the diagram's door -- the build already refuses
    # a card without one), they are all from the one night, and the front page
    # is where the rest live.
    out.append(
        f'  <p class="cnote">Every one of these leads to a real game, and they '
        f'are all from one night &mdash; {g["away"]} at {g["home"]}, {when} '
        f'&mdash; with {p1} of the {len(LEARN_CARDS)} in the first period '
        f'alone. Every other game we hold is '
        f'reachable from <a href="/">the front page</a>.</p>')
    return ('<h1>What you can see here</h1>\n<div class="conc">\n'
            + "\n".join(out) + "\n</div>")


# NAME WHAT THE SITE TEACHES, because it named none of it. Counted on the
# shipped page before this: icing 0, offside 0, Corsi 0, high-danger 0, empty
# net 0, penalty 0.
#
# AND THEN THE PAGE PROMISED SOMETHING IT DID NOT DELIVER. It ended with "every
# one of them is a toggle on a real game" and carried ZERO links to any game --
# every href on it was chrome. A false sentence on the production site, not a
# missing feature. Each item is now a door, and the moments come from
# `data/learn-doors.json`, which node writes by asking the layers themselves.
#
# TWO KINDS, KEPT APART, AND THE SPLIT IS THE PAGE'S BEST IDEA. The first group
# is HOCKEY -- rules a novice needs in order to watch. The second is OURS -- what
# we chose to count, which is a different claim carrying a different obligation.
# Merging them would let our measurements borrow the rulebook's authority. The
# groups get headings AND a visual difference: the measurement cards take the
# blue left edge that already means "our claim" on `.limits`.
LEARN_CARDS = [
    ("rules", "icing", "Icing",
     "The puck is sent the length of the ice and play comes straight back. "
     "Watch where the faceoff goes &mdash; that dot is the whole punishment."),
    # NAMED "Faceoffs", not "the faceoff it forces". A card title is also the
    # word a visitor scans for, and the concept has to survive the copy -- the
    # page exists to name what the site teaches. The pairing lives in the blurb,
    # where it can also say the thing that matters: the punishment is WHERE.
    # ⚠️ "THE ICING ABOVE" WAS TRUE ON ONE SURFACE AND FALSE ON THE OTHER. This
    # blurb is used twice -- as the card's body, where the icing card really does
    # sit directly above it, and as the lede of /faceoffs.html, where there is no
    # icing anywhere on the page and "above" points at nothing (Kevin). A string
    # that two surfaces share cannot carry a POSITION; it can only carry the
    # fact. So the pairing is named instead of pointed at, and "This is" goes
    # with it -- on the rule page "this" would have meant the diagram, which is
    # nine spots and not an icing restart. The same error, one notch quieter.
    ("rules", "faceoffs", "Faceoffs",
     "Nine spots on the ice and the rule picks one. An icing brings the draw all "
     "the way back &mdash; same second as the whistle, and deep in the offending "
     "team&rsquo;s own end."),
    # "WHY A GOAL GETS WAVED OFF" WAS SHIPPED AND IS NOT SHOWABLE ANYWHERE.
    # Checked against the raw feed, not inferred: an offside stoppage carries
    # `reason` and `secondaryReason` and NOTHING else -- no coordinates, no zone,
    # no players. Zero of 4,160 offsides carry a video review, and the feed has
    # no event type meaning "goal disallowed" at all, so a waved-off goal never
    # appears in our data in any form. The card promised the one thing this rule
    # cannot show, on a page whose whole repair was removing a false promise.
    #
    # It now says what we have and admits what we do not, which is also the more
    # useful instruction: watch the line, because the crossing is not there.
    # ⭐ THE BLURB SHRANK WHEN THE FIGURE ARRIVED, and that is the general rule:
    # a card with a diagram should say the part the diagram CANNOT. This one
    # said "an attacking player crossed the blue line ahead of the puck" -- which
    # is now drawn, twice, in the picture and in step 2 -- and the words were the
    # third telling of it. What is left is the half no drawing can carry: WHY
    # there is a drawing here at all. Zero of 4,160 offside stoppages carry a
    # coordinate, a zone or a player, so this is the one rule on the page whose
    # moment we can name and never show. The figure teaches the rule and the
    # sentence teaches the limit, which is the more useful pair (CHENG).
    ("rules", "offside", "Offside",
     "This is the one rule we can draw but never replay: the feed records the "
     "call and the restart, never the crossing. So in a real game, watch the "
     "line rather than the play."),
    # ⚠️ THIS PROMISED A MOMENT THE FEED DOES NOT POPULATE. It read "This is that
    # gap -- the delayed call, before the whistle", and over 46 published games
    # 79 of 109 delayed calls carry NO event between the call and the whistle. The
    # gap is real in time and empty in the record, so no replay that walks
    # recorded events can ever show it.
    # ⭐⭐ AND THE REPLACEMENT CARRIES NO NUMBER, which is CHENG's ruling and the
    # sharpest statement of the wall yet: THE RULES HALF MAY STATE WHAT THE RECORD
    # CONTAINS; ONLY THE MEASUREMENTS HALF MAY STATE HOW OFTEN. Offside's "the
    # feed records the call and the restart, never the crossing" is CATEGORICAL --
    # true of every offside ever recorded, checkable against the schema. "79 of
    # 109" is a measurement with an n, a population and a date, and it belongs to
    # the other half by construction.
    # ⚠️⚠️ AND BOTH HALVES OF THIS BLURB WERE WRONG, IN DIFFERENT WAYS (Kevin).
    #
    # (1) "his team plays a skater short" WAS NOT UNIVERSALLY TRUE, and it is not
    # a corner case. Kevin named matching penalties; measured over 600 published
    # games (4,347 penalties with a readable restart), the offending team is at
    # EVEN strength when play resumes 793 times -- 18.2%, one penalty in five --
    # and is actually UP a skater on another 149. The instrument is the league's
    # own `situationCode` at the next face-off, not a count we infer: 60.5% of
    # calls that share a second with one on the other team come back even,
    # against 6.0% of the rest. So the exception is NAMED rather than trimmed,
    # which is the precedent step 2 set when both endings of a minor went in.
    #
    # ⚠️⚠️ AND IT TOOK THREE DRAFTS TO STATE THE EXCEPTION, EACH WRONG IN THE WAY
    # THE ONE BEFORE IT WAS. Draft one said "penalised ON THE SAME WHISTLE" --
    # but simultaneity is not what offsets: two calls at one whistle for unequal
    # time leave a side short anyway. Draft two said "takes a MATCHING penalty",
    # which is the correct rulebook term and STILL WRONG FOR A NOVICE -- Kevin:
    # "there can be different minors penalized on the same play that offset."
    # He is right and it is not rare: 206 of 588 offsetting pairs, 35%, name two
    # DIFFERENT infractions. A reader who takes "matching" to mean "the same
    # foul" misreads a third of the real cases, and the rule does not care what
    # the fouls were -- only that the TIME is equal.
    # ⭐ THE LESSON IS THAT AN EXCEPTION IS A CLAIM AND NEEDS ITS OWN MEASUREMENT.
    # Naming an exception feels like humility, so it does not get checked the way
    # the rule it qualifies does. The wording is Kevin's, and it names the two
    # conditions the rule actually has -- same duration, same time.
    # ⭐ THE CONSEQUENCE IS STATED POSITIVELY ("both teams skate with the same
    # number of players") rather than as "neither is short", which is also more
    # accurate: an offset pair can leave the sides at 4-on-4, even but not five.
    #
    # (2) ⭐⭐ "USUALLY NOTHING IN BETWEEN" WAS ACCURATE AND STILL HAD TO GO, AND
    # THE REASON IS NOT THE ONE I FIRST GAVE. Re-measured at 600 games: 1,027 of
    # 1,394 delayed->whistle pairs, 73.7%, carry no event between -- so the hedge
    # was TRUE, and CHENG had defended it on the grounds that the wall bans
    # NUMBERS rather than frequency words. I replaced it with a categorical claim
    # about the schema ("the league records what the call was for, and where"),
    # reasoning that a frequency word is a symptom of a sentence aimed at
    # INSTANCES instead of at the SCHEMA.
    #
    # ⭐⭐ KEVIN CUT THAT WHOLE SENTENCE, AND HIS REASON IS BETTER THAN MINE:
    # "these are learning cards, not data-driven, education driven." A sentence
    # about what OUR RECORD CONTAINS is a fact about the pipeline, not about
    # hockey, and it was on a card whose one job is to teach a rule. Delete the
    # sentence about US and the hedge goes with it -- no doctrine adjudication
    # needed, and no schema claim to keep true either.
    #
    #   THE HEDGE WAS A SYMPTOM OF THE AUDIENCE, NOT OF THE AIM. "Usually"
    #   appeared because the sentence was about us on a card that teaches the
    #   rule. That is the general test for these blurbs: does this sentence
    #   teach the RULE, or does it describe OUR DATA?
    #
    # ⛔ AND IT COSTS NOTHING. The honest-limit slot exists for offside because
    # that rule's moment genuinely cannot be replayed; here it can, and the card
    # already promises the door in its own `at` line ("Diagram - then a real
    # example"). Symmetry with the offside card was the only argument for
    # keeping it, and symmetry is not a reason to teach a novice about a schema.
    # The base case leads, because Kevin asked for it by name: "detail the more
    # common penalty types, can't forget the base case."
    # ⚠️ AND THE DURATION CAME OUT OF HERE TOO. This read "two minutes in the box"
    # and Kevin caught it: penalties are not always two minutes. The blurb states
    # no duration at all, because it has no room to qualify one; the figure's
    # step 2 says "most are two minutes", where the qualifier fits. The TERM
    # "matching" now lives only in `note`, which is the right split: the blurb
    # explains the concept in plain words, the note gives it its name and says
    # outright that the two infractions need not be the same.
    ("rules", "penalties", "Penalties",
     "A penalty is time off the ice: the offender sits, and his team plays a "
     "skater short &mdash; unless the other team commits a penalty of the same "
     "duration at the same time, and then both teams skate with the same number "
     "of players."),
    ("rules", "empty-net", "The empty net",
     "Losing late, a team trades its goaltender for a sixth skater. Nothing is "
     "toggled here &mdash; the goalie is simply no longer on the ice."),
    ("ours", "control", "Control",
     "Every shot attempt, counted for both teams as it happens. This is the "
     "first one of the game."),
    ("ours", "blocked", "The attempt that never arrived",
     "One event after that shot and at the same second, blocked. Both are "
     "attempts; only one is a shot on goal &mdash; __UNREACHED__ of __ATTEMPTS__ "
     "attempts in this game never reached the goaltender at all."),
    # ⭐⭐ THE PILOT FOR THE MEASUREMENT CARDS, and what it changes is the ORDER.
    # This read "A geometric rule of ours, not a model: close in, and between the
    # faceoff dots. This is the first shot that qualifies." -- a definition and a
    # pointer to a door, and Kevin: "I'm not sure we provide what we need within
    # the what we count cards, we need to take an education first approach."
    #
    # ⭐ ON THE RULES HALF THE DEFINITION IS THE LESSON; ON THIS HALF IT IS ONLY
    # THE SETUP. Knowing what icing is, is the point. Knowing where the slot is
    # tells a reader nothing until they know what happens in it -- so the fact
    # leads and the geometry follows it, and `/slot.html`'s three steps (which
    # are the definition, drawn) become the middle of the page rather than all
    # of it.
    #
    # ⚠️ AND THE BASE RATE IS IN THE SENTENCE BECAUSE THE SHARE ALONE LOSES THE
    # ARGUMENT. "Three of every four goals come from the slot" invites exactly
    # one reply -- "that is where everybody shoots" -- and the reply is half
    # right: 46.7% of located attempts are already taken from inside it. The
    # CONVERSION is the number that survives, so it is the number the card
    # leads with. See `slotShare` in src/lib/archive.js.
    #
    # ⛔ THE FIGURES ARE SUBSTITUTED, NEVER TYPED. A constant here would go stale
    # the next time the archive is re-derived and nobody would see it happen --
    # which already cost this project a wrong slot figure once (79.4% against a
    # real 75.4%). `_archive()` reads them out of the published measurements.
    #
    # ⭐ A FREQUENCY REPORTS; A VERDICT INSTRUCTS OR CONCLUDES (CHENG). "11.4%
    # against 3.3%" is a frequency and is what the measurements half exists to
    # be allowed to say. "The slot is where games are won" would be a verdict
    # wearing a frequency, and "shoot from the slot" advice. Neither is here,
    # and every figure carries its n on the same line.
    ("ours", "slot", "Shots from the slot",
     "A shot taken from inside the slot goes in __SLOT_IN_PCT__% of the time "
     "&mdash; __SLOT_IN_GOALS__ goals from __SLOT_IN_ATT__ attempts. From "
     "outside it, __SLOT_OUT_PCT__%. That gap is what the shading is for."),
    ("ours", "goaltending", "Goaltending",
     "Saves as a fraction, built while you watch. This is the first shot the "
     "goaltender had to deal with."),
]

# Spelled out rather than via strftime("%B"): this builder gates on BYTES, and
# strftime's month name follows the process locale. A table cannot be a rule
# that drifts -- which is what the one-implementation doctrine is about -- but a
# locale-dependent build very much can.
MONTHS = ("January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December")

LEARN_GROUPS = [
    ("rules", "The game itself &mdash; the league&rsquo;s rules, named as they happen"),
    ("ours", "What we count &mdash; our own measurements, each showing its work"),
]

WORKSHOP_PAGE = r"""<h1>Workshop</h1>
<p class="note">Earlier views, each answering a question the main app does not.
They are explorations, not front doors, and several are pinned to one game.</p>
<div class="grid">
__WORKSHOP__
</div>"""

# ---------------------------------------------------------------------------
# TWO PAGES THAT USED TO BE SECTIONS.
#
# Kevin: "What I want below Teams is the 'What this site does and does not
# claim' section then the footer, remove the other bits... Let's remove them
# from the home page and make them their own pages. I like the content, but not
# on the home page. Like we have the Workshop link in the header area, we can
# have 'What you can see here' on its own page."
#
# So the content is unchanged and only its address moves. Both go in the nav,
# because a page nothing links to is a page nobody reads -- and `page.py`'s
# chrome test already forbids linking to a page we have not built, which is the
# guard that keeps those two facts in step.
#
# THEY SHARE THE HOME PAGE'S STYLESHEET rather than growing their own. The
# selectors they need (.conc, .ck, .clist, .grid, .note) are defined once, and a
# second copy is where the next divergence hides -- the same argument that put
# `csp` and the chrome in page.py.
LEARN_BODY = r"""<div class="wrap">
<p class="eyebrow">Read the Game</p>
__LEARN__
</div>"""

WORKSHOP_BODY = r"""<div class="wrap">
<p class="eyebrow">Read the Game</p>
__WORKSHOP_PAGE__
</div>"""

# \u2500\u2500 THE RULE DIAGRAMS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
#
# The geometry, the motion and the captions are written by
# `builders/learn-figures.mjs`, which draws them with the SAME `furniture()` the
# replay draws its rink with -- see that file for why a diagram is allowed at
# all and what keeps it from being mistaken for a game. This is only the paint.
#
# \u2b50 THE ICE IS THE REPLAY'S ICE AND THE PLAY ON IT IS NOT. Kevin: "it's the same
# ice rink, but the graphics are noticeably and obviously different between the
# learning cards and the game pages." So `.dgpaint` restates app.css's rink
# values exactly -- boards, lines, spots, both tints -- and everything in
# `.dgplay` is outlined, neutral, and drawn in a vocabulary the game ice does
# not own: arrows, ghosts of where a thing started, and numbered badges.
#
# \u26a0\ufe0f THE OUTLINE IS THE SIGNAL, NOT THE ARROW (CHENG). "The replay never draws an
# arrow" is true today and stops being true the day anything directional lands
# on the game ice, which is live work. What carries provenance is FILLED IN A
# CLUB'S COLOUR = recorded, OUTLINED NEUTRAL = illustrative. No club colour
# appears in any figure, and the test asserts it rather than the arrow.
FIGCSS = r"""<style>
.dgfig{margin:9px 0 10px;padding:0}
.dgice{display:block;width:100%;height:auto;background:var(--ice);
  border:1px solid var(--edge);border-radius:9px}
/* THE RINK, RESTATED FROM app.css -- same numbers, because it is the same ice. */
.dgpaint .boards{fill:var(--ice);stroke:var(--edge);stroke-width:1.1}
.dgpaint .slotzone{fill:#e0932a;opacity:.09}
.dgpaint .zoneband{fill:var(--blue);opacity:.055}
.dgpaint .ln{fill:none;stroke-linecap:round}
.dgpaint .ln.red{stroke:var(--red);stroke-width:.7;opacity:.42}
.dgpaint .ln.blue{stroke:var(--blue);stroke-width:.9;opacity:.42}
.dgpaint .ln.thick{stroke-width:1.1;opacity:.52}
.dgpaint .fdot{fill:var(--red);opacity:.55}
.dgpaint .fdot.ctr{fill:var(--blue)}
/* THE NET IS EQUIPMENT, and in a CROP it is also the compass. Kevin: "the rink
   snippet just doesn't look right without a net and goalie" -- a full sheet has
   two nets and is obviously symmetric, but a crop has one end, and without the
   net that end is just more ice. Same values as app.css; the colour comes in on
   the element, and for a diagram it is the neutral grey, never a club's. */
.dgpaint .crease{fill:#cfe0f2;stroke:var(--blue);stroke-width:.4;opacity:.55}
.dgpaint .mesh{stroke-width:.8;opacity:.9}
.dgpaint .strand{stroke-width:.35;opacity:.5}
.dgpaint .post{stroke-width:1.1;stroke-linecap:round}
.dgpaint .flashpath{display:none}
/* THE ILLUSTRATION. Outlined, neutral, never a club's colour. */
.dgplay .dgtok{fill:var(--ice);stroke:var(--ink);stroke-width:1.1}
.dgplay .dgpuck{fill:var(--ink);stroke:var(--ice);stroke-width:.5}
.dgplay .dgghost{fill:none;stroke:var(--muted);stroke-width:.7;stroke-dasharray:2 1.6;opacity:.75}
/* THE GOALTENDER. ⚠️ app.css's weights are scoped under `#rg`, which no rule page
   has, so the glyph arrived here with SVG's default 1px stroke on a 4.6-unit
   figure -- a black blob. A shared function does not carry its stylesheet.
   ⭐ BUT THE WIDTH IS NOT SET HERE. The diagram scales him, and a scale takes the
   stroke with it, so `gk` in learn-figures.mjs divides it out and the group
   INHERITS one rendered weight -- see the note there. A number in this file would
   be a second copy that stops matching the moment the scale moves. */
.dgplay .dggk .gkstick,.dgplay .dgsk .skstick,
.dgplay .dgof .ofarm{stroke-linecap:round}
/* The ghost each of them left behind is the SAME figure, dashed — a `<g>`, so the
   rule has to reach the shapes rather than sit on the group. ⚠️ THE DASH ITSELF IS
   NOT HERE: these figures are scaled, and a pattern in rink units shatters the
   outline into blobs at 1.74x. `dashes` in learn-figures.mjs divides the scale
   out, next to where the scale is set. */
.dgplay .dgghost .dggk *,.dgplay .dgghost .dgsk *,
.dgplay .dgghost .dgof *{opacity:.75;fill:none}
.dgplay .dgarrow{stroke:var(--muted);stroke-width:.8;stroke-linecap:round;opacity:.85}
.dgheadp{fill:var(--muted);opacity:.85}
/* The line where the rule is decided, and the spot the draw comes back to. */
.dgplay .dghot{stroke-width:2.2;opacity:.5;stroke-linecap:round}
.dgplay .dghot.blue{stroke:var(--blue)}
.dgplay .dghot.red{stroke:var(--red)}
.dgplay .dgspot{fill:none;stroke:var(--red);stroke-width:1;opacity:.8}
/* A SHOT THAT COUNTS AND ONE THAT DOES NOT — only on the slot figure, where the
   subject is our own rule and the lesson is that you can check a mark against
   it. Solid means the rule admits it; hollow means it does not, which is the
   same "outlined = not the thing" the ghosts already use. */
.dgbadge circle{fill:var(--ink);opacity:.88}
/* ⭐ SIZE COMES FROM THE ELEMENT, NOT FROM HERE. Each figure scales its
   annotation by how tightly it is framed, so a badge is the same number of
   PIXELS on the full sheet and on the slot's crop. The stylesheet owns the
   weight, the family and the colour; the figure owns the size. */
.dgbadge text{fill:#fff;font-weight:700;font-family:system-ui,sans-serif;
  line-height:1;text-anchor:middle}
/* It says what it is, quietly. See learn-figures.mjs: this is not the guard. */
.dgstamp{fill:var(--muted);opacity:.6;font-weight:600;
  font-family:system-ui,sans-serif;line-height:1;text-transform:uppercase}
/* THE CAPTION IS A NUMBERED LIST BECAUSE THE RULE IS A SEQUENCE, and the numbers
   are the badges on the ice. It is always fully visible -- the animation
   illustrates these lines, it never replaces them, so a reader who arrives after
   a loop has finished has lost nothing. */
.dgsteps{margin:0;padding:0 0 0 20px;font-size:.82rem;color:var(--muted);line-height:1.45}
.dgsteps li{margin:0 0 4px}
.dgsteps li::marker{color:var(--ink);font-weight:700}
/* ⭐ A NOTE IS NOT A STEP, AND IT LOOKS LIKE IT. The numbered list is tied to
   badges on the ice; this is the part that has no place to point at, so it is
   unnumbered, indented no further than the figure and set a shade quieter. */
.dgnote{margin:9px 0 0;font-size:.8rem;color:var(--muted);line-height:1.45}
.dgnote b{color:var(--ink);font-weight:650}
/* THE ONE LINK ON THESE PAGES THAT IS NOT A DOOR INTO THE REPLAY. Quieter than
   the door and set apart from it, because it leads sideways rather than onward. */
.dgsee{margin:8px 0 0;font-size:.8rem;color:var(--muted)}
.dgsee a{color:#2a5d86;font-weight:650;text-decoration:none;border-bottom:1px solid #cfe0ec}
.dgsee a:hover{border-bottom-color:#2a5d86}
.dgsteps b{color:var(--ink);font-weight:600}
__FIGKEYS__
</style>"""

LEARN_TITLE = "What you can see here \u2014 Read the Game"
LEARN_DESC = ("The hockey rules this site names as they happen \u2014 icing, offside, "
              "faceoffs, penalties, the empty net \u2014 and the measurements it counts "
              "itself, each one showing the events behind it.")
WORKSHOP_TITLE = "Workshop \u2014 Read the Game"
WORKSHOP_DESC = ("Earlier views of the same NHL data, each answering a question the main "
                 "app does not. Explorations rather than front doors.")


def build_learn():
    # NO FIGURE CSS HERE ANY MORE. The diagrams moved to their own pages, so the
    # learn page is back to what it was: a grid of short cards, scannable on a
    # phone rather than a column of five rinks.
    html = LEARN_BODY.replace("__LEARN__", _learn())
    html = P.document(html, title=LEARN_TITLE, description=LEARN_DESC,
                      url="https://readthegame.co/what-you-can-see.html",
                      current="/what-you-can-see.html",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">\n'
                           + STYLE)
    return html.replace("__CSP__", _csp(html, connect=None))


def build_rule(cid):
    """One rule, drawn — the destination a learn card with a diagram opens."""
    fig = _fig_json()[cid]
    doors = json.loads((ROOT / "data" / "learn-doors.json").read_text())
    door, g = doors["doors"][cid], doors["game"]
    title = next(t for _, c, t, _ in LEARN_CARDS if c == cid)
    blurb = next(b for _, c, _, b in LEARN_CARDS if c == cid)
    # ⚠️ THE RULE PAGE IS A SECOND READER OF THE SAME BLURB, and the first version
    # of this substituted only in the card grid -- so `/slot.html` shipped four
    # raw `__SLOT_*__` tokens as its lede. CAUGHT BY THE PLACEHOLDER GATE, which
    # is the guard that exists because a `__PLACEHOLDER__` reached production
    # once. Substituted before `desc` is derived from it, so the meta description
    # cannot carry a token either.
    arch = _archive()
    for tok, val in arch.items():
        blurb = blurb.replace(tok, val)
    y, m, day = g["date"].split("-")
    html = (RULE_BODY
            .replace("__RULE_TITLE__", title)
            .replace("__RULE_LEDE__", blurb)
            .replace("__RULE_FIG__", _figures()[cid])
            .replace("__RULE_HREF__", door["href"])
            # THE PROMISE IS THE FIGURE'S, not this template's: what lies
            # through the door differs per rule, and the rule knows.
            .replace("__RULE_DOOR__", fig["door"])
            .replace("__RULE_AT__", f'{g["away"]} at {g["home"]}, {int(day)} '
                                    f'{MONTHS[int(m) - 1]} {y} &middot; period {door["per"]}, '
                                    f'{door["rem"]} left'))
    # AND AGAIN OVER THE WHOLE PAGE, because a figure's `note` is rendered inside
    # `__RULE_FIG__` and never passes through `blurb`. Idempotent: a token
    # replaced once is not there to replace twice.
    for tok, val in arch.items():
        html = html.replace(tok, val)
    # THE FIGURES' KEYFRAMES COME FROM THE FIGURE, so a token's motion and its
    # geometry are written by one hand and cannot drift into animating from a
    # place it was never drawn. `str.replace` cannot fail, so it is asserted.
    css = (STYLE + "\n" + FIGCSS.replace("__FIGKEYS__", "")
           + "\n" + RULECSS.replace("__FIGKEYS__", fig["css"]))
    assert "__FIGKEYS__" not in css, "the figure keyframes were never substituted"
    desc = re.sub("<[^>]+>", "", blurb)
    html = P.document(html, title=f"{title} — Read the Game", description=desc,
                      url=f"https://readthegame.co/{cid}.html",
                      current="/what-you-can-see.html",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">\n'
                           + css)
    return html.replace("__CSP__", _csp(html, connect=None))


def build_workshop():
    html = WORKSHOP_BODY.replace("__WORKSHOP_PAGE__", WORKSHOP_PAGE.replace("__WORKSHOP__", _workshop()))
    html = P.document(html, title=WORKSHOP_TITLE, description=WORKSHOP_DESC,
                      url="https://readthegame.co/workshop.html",
                      current="/workshop.html",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">\n'
                           + STYLE)
    return html.replace("__CSP__", _csp(html, connect=None))


# ---------------------------------------------------------------------------
# THE ARCHIVE BY DATE (C1). docs/discovery.md, and §10 for CHENG's four rulings.
#
# WHY A GRID HERE AND A LIST ON THE TEAM PAGE, measured rather than chosen: a
# team's season fills 40% of a calendar at a maximum of ONE game per cell, so
# the cell would carry a single bit where the existing list row already carries
# opponent, result, score and shots. The league fills 68% at a median of 5 and a
# maximum of 16, where a cell carries a COUNT -- which is what a small box is
# good at, and whose variation is itself information. So: calendar as the date
# index, list as the leaf, and no toggle between them.
#
# WHY ITS OWN PAGE. A month grid on the home page needs a rule for WHICH month
# and every rule has an ugly case -- most-recent is an empty August for the
# newcomer arriving from a summer link, and a calendar's whole value is
# navigable RANGE, which one month cannot provide (CHENG, §10.4). The front door
# gets the cheap half instead: one line under the chips.
#
# NO BASE RATE ANYWHERE ON IT. The rule, stated precisely in §10.3: the
# base-rate requirement attaches to selection on an OUTCOME, not to selection. A
# date selects on nothing about hockey, so there is no claim to contextualise
# and a percentage here would be the C7 defect -- a comparison the reader did
# not ask for. The boundary is named in that section: if a cell or a night row
# ever surfaces an outcome marker, it is back in scope.
CAL_TITLE = "Every night in the archive — Read the Game"
CAL_DESC = ("Three seasons of NHL hockey, night by night. Pick a date to see the games "
            "played on it, including the ones we hold but cannot show.")

CAL_BODY = r"""<div class="wrap">
<p class="eyebrow">Read the Game</p>
<h1>Every night in the archive</h1>
<p class="note">Three seasons of NHL hockey, night by night. Pick a date to see
the games played on it.</p>
<main id="main"></main>
</div>
<script>
__LIB__
/* NOTHING ON THIS PAGE IS BAKED IN -- same rule as the front door, same reason.
   Pages serves CODE and R2 serves DATA, the nightly moves the archive with no
   deploy, and a month compiled in here would be a lie by the morning. A failure
   is a STATE: if the catalog does not arrive the page says so rather than
   rendering an empty grid that looks like an empty archive. */
(function () {
__HELPERS__
  var NAMES = __NAMES__;
  var DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  var DAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* WHAT A REFUSAL MEANS, IN WORDS. `r` on a catalog row is the GATE that
     stopped the game, and the gate names are ours -- derive.py mints exactly
     these two. That is why an unknown one degrades to the raw key here instead
     of failing a build the way an unknown gameType does: a value the LEAGUE can
     invent needs a guard where the whole archive is walked, and a value only we
     can invent is a bug in our own pipeline, which the pipeline is the place to
     catch. Rendering the key is still better than rendering nothing. */
  var GATE = {
    validation: 'a check on the league’s own data did not pass',
    vocabulary: 'the league’s feed uses a word we have not read yet'
  };
  function gateOf(r) { return GATE[r] || ('the ' + (r || 'refused') + ' check stopped it'); }

  /* ⭐ A NAME FROM data/competitions.json IS NEVER INFLECTED, and the first
     draft of this page inflected it three ways. `plural(n, name + ' game')`
     printed "4 Olympics games", and the same shape would print "3 playoffs
     games"; an article gives "in the Olympics" against "in the preseason"; and
     an adjective would need "Olympic", a word that is not in the table.
     Those names are DISPLAY names and the table owes us nothing else — adding
     an adjectival column would be inventing grammar for a value the league can
     mint at any time, which is the copy version of the same defect.
     So every sentence here sets the name off with punctuation and lets it stand
     exactly as written: "not counted here: Olympics", "The dashed count:
     preseason." It costs a colon and it cannot be wrong for a name we have not
     seen yet. */

  /* Oxford-free, because these lists are two items long in practice and three
     at most; "a, b and c" is the site's existing voice. */
  function join(xs) {
    return xs.length < 2 ? (xs[0] || '')
      : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
  }
  function plural(n, one) { return n + ' ' + one + (n === 1 ? '' : 's'); }

  /* THE URL GRAMMAR IS READ THE WAY THE FRONT DOOR READS ITS OWN -- a regex over
     location.search. src/lib/deeplink.js is the GAME page's grammar (period,
     clock, layer, mode) and means nothing here; borrowing it would make this
     page depend on a vocabulary it does not speak. */
  function param(re) { return (re.exec(location.search) || [])[1] || ''; }

  function monthName(m) { return MON[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4); }

  function crumbTo(href, text) {
    var p = el('p', 'crumb'), a = el('a', null, text);
    a.href = href; p.appendChild(a); return p;
  }
  function headline(text, aside) {
    var h = el('div', 'teamhead');
    h.appendChild(el('h2', null, text));
    if (aside) h.appendChild(el('span', 'd', aside));
    return h;
  }

  /* ---- the month ------------------------------------------------------- */

  function drawMonth(games, month, months, asked) {
    var main = $('main');
    main.textContent = '';
    /* NO CRUMB ON THE MONTH VIEW. The chrome directly above it already says
       "Watch a game", and a second copy of the same link 40px lower is the
       home page's old duplicate-funnel defect at smaller scale. The LEAF keeps
       its crumb, because "back to February 2026" is somewhere the nav cannot
       take you. */
    var nights = nightsOf(games);
    var weeks = monthGrid(games, month, nights);
    var nhl = 0, held = 0;
    weeks.forEach(function (w) {
      w.forEach(function (c) { if (c) { nhl += c.count; held += c.held; } });
    });
    main.appendChild(headline(monthName(month),
      held ? plural(nhl, 'NHL game') + ' this month' : null));

    /* A URL WE CANNOT ANSWER IS SAID OUT LOUD, not silently redirected. A month
       outside the archive's span has no season tab and no month row to sit in,
       so the page snaps to one it can draw -- and a snap nobody is told about is
       a page quietly ignoring what was asked for. */
    if (asked && asked !== month) {
      main.appendChild(el('p', 'note',
        'We hold nothing for ' + monthName(asked) + '. This is ' + monthName(month) + '.'));
    }

    var withGames = {};
    nights.forEach(function (n, d) { withGames[monthOf(d)] = 1; });

    var seasons = [], cur = seasonOfMonth(month);
    months.forEach(function (m) {
      var y = seasonOfMonth(m);
      if (seasons.indexOf(y) === -1) seasons.push(y);
    });
    seasons.sort(function (a, b) { return b - a; });   /* newest first, as the team page does */
    var bar = el('p', 'seasons');
    seasons.forEach(function (y) {
      var a = el('a', y === cur ? 'on' : null, seasonLabel(y));
      /* Land on the first month of that season we actually hold a game in --
         landing on an empty July would make the tab look broken. */
      var mine = months.filter(function (m) { return seasonOfMonth(m) === y; });
      var full = mine.filter(function (m) { return withGames[m]; });
      a.href = '?month=' + (full[0] || mine[0]);
      bar.appendChild(a);
    });
    main.appendChild(bar);

    /* THE OFFSEASON IS SHOWN, NOT SKIPPED. 4 of the 34 months in the span hold
       no games, and a stepper that hid July would tell a reader the season runs
       continuously. They are muted and still clickable, and the month they open
       says plainly that nothing is there. */
    var row = el('p', 'months');
    months.filter(function (m) { return seasonOfMonth(m) === cur; }).forEach(function (m) {
      var cls = (m === month ? 'on' : '') + (withGames[m] ? '' : ' nil');
      var a = el('a', cls.trim() || null, MON[+m.slice(5, 7) - 1].slice(0, 3));
      a.href = '?month=' + m;
      a.setAttribute('aria-label', monthName(m) + (withGames[m] ? '' : ' — no games'));
      if (m === month) a.setAttribute('aria-current', 'page');
      row.appendChild(a);
    });
    main.appendChild(row);

    /* SAID BEFORE THE GRID, NOT AFTER IT. An empty August is 31 grey day
       numbers and about 380px of nothing on a phone; a reader should not have
       to scroll past all of it to be told. The grid still renders, because the
       offseason IS the fact this stepper exists to show. */
    if (!held) {
      main.appendChild(el('p', 'note', 'No games in the archive this month.'));
    }

    var cal = el('div', 'cal');
    DOW.forEach(function (d, i) {
      var s = el('span', 'dow', d);
      s.setAttribute('aria-label', DAY[i]);
      cal.appendChild(s);
    });
    weeks.forEach(function (week) {
      week.forEach(function (c) {
        if (!c) { cal.appendChild(el('span', 'cell pad')); return; }
        if (!c.held) {
          var v = el('span', 'cell void');
          v.appendChild(el('span', 'dy', String(c.day)));
          cal.appendChild(v);
          return;
        }
        var a = el('a', 'cell');
        a.href = '?date=' + c.date;
        a.appendChild(el('span', 'dy', String(c.day)));
        /* TWO MARKS THAT NEVER ADD (§10.1). The front door promises preseason,
           the Olympics and the 4 Nations Face-Off are "left out of every number
           here", so they are a separate mark rather than a term in the count --
           which keeps 60 otherwise-invisible dates reachable without editing a
           disclosure to fit a feature. A cell is about 48 CSS px wide on a 390px
           phone, which holds a number and no label at all, so the competition is
           named ONCE under the grid. */
        if (c.count) a.appendChild(el('span', 'n', String(c.count)));
        if (c.other) a.appendChild(el('span', 'o', String(c.other)));
        /* THE SCREEN READER GETS THE SENTENCE, not "11 2 2" -- the two counts
           are distinguished by a dashed border, which is nothing at all to a
           reader who is not looking at it. Sentences rather than dashes, so the
           reader hears a full stop where the eye sees a separate box. */
        var says = [when(c.date)];
        if (c.count) says.push(plural(c.count, 'NHL game'));
        if (c.other) {
          says.push(plural(c.other, 'game') + ' not counted here: '
            + join(c.types.map(function (t) { return competitionOf(t, NAMES); })));
        }
        a.setAttribute('aria-label', says.join('. ') + '.');
        cal.appendChild(a);
      });
    });
    main.appendChild(cal);

    /* THE DASHED COUNT, NAMED. Nine months in the archive hold out-of-scope
       games and every one of them holds exactly ONE competition (0 of 9 mix,
       measured 2026-08-21) -- which is what makes a single sentence enough.
       It is still built from a list, because that is a fact about today's
       archive and not a rule the league has agreed to. "Preseason" would be the
       tempting shorthand and it is wrong on 38 of the 60 dates this makes
       visible at all. */
    var oth = otherInMonth(games, month);
    if (oth.length) {
      var total = 0;
      var named = oth.map(function (r) {
        total += r.games;
        return competitionOf(r.type, NAMES) + (oth.length > 1 ? ' (' + r.games + ')' : '');
      });
      var p = el('p', 'offnote');
      p.appendChild(el('b', null, 'The dashed count: ' + join(named) + '.'));
      p.appendChild(el('span', null, ' ' + plural(total, 'game')
        + ' this month that are in the archive and left out of every number on '
        + 'this site — so they are never added to the count beside them.'));
      main.appendChild(p);
    }
  }

  /* ---- one night ------------------------------------------------------- */

  function rowsOf(list) {
    var ul = el('ul', 'games night');
    list.forEach(function (g) {
      var li = el('li'), row;
      if (g.shown) {
        row = el('a', null);
        row.href = 'game.html?game=' + g.id;
      } else {
        li.className = 'no';
        row = el('div', 'off');
      }
      /* THE SAME DASHED MARK THE CELL USES. A heading scrolls off the top of a
         twelve-row list; the mark travels with the row, and it is the visual
         language the grid already taught two clicks ago. */
      if (g.scope !== 'nhl') li.className += ' uncounted';
      row.appendChild(el('span', 'm', nameOf(g.a) + ' at ' + nameOf(g.h)));
      /* D10. The mark sits ON the shot figure, because that is the number the
         league's two documents disagree about and nothing else on the line is
         in question. See archive.js::disputedNote. */
      row.appendChild(el('span', 'r', g.shown
        ? g.as + '–' + g.hs + '  ·  ' + g.ash + '–' + g.hsh + ' shots'
            + (g.u === 1 ? DISPUTED_MARK : '')
        : 'Cannot be shown — ' + gateOf(g.r)));
      li.appendChild(row);
      ul.appendChild(li);
    });
    return ul;
  }

  function drawNight(games, date, months) {
    var main = $('main');
    main.textContent = '';
    var m = monthOf(date);
    main.appendChild(crumbTo('?month=' + m, '← ' + monthName(m)));

    var n = nightOf(games, date);
    main.appendChild(headline(DAY[weekdayOf(date)] + ' ' + when(date),
      n.held ? plural(n.held, 'game') : null));

    if (!n.held) {
      main.appendChild(el('p', 'note', 'No games in the archive on this date.'));
      return;
    }

    /* D10, ONCE PER NIGHT AND NOT ONCE PER GROUP -- a reader sees one page, not
       three lists -- and ABOVE them, for the same reason the team page's note
       is above its list. Counted over the whole night, so the number in the
       sentence is the number of marks under it. */
    var dnote = disputedNote(disputedCount(n.rows));
    if (dnote) main.appendChild(el('p', 'disputed', dnote));

    /* A DEAD END IS A STATE, NOT ROWS (CHENG, §10.2). A list of rows nobody can
       click is a dead end wearing the clothes of a working list. This is on the
       happy path rather than an edge case: 10 nights hold games and can open
       none, all 10 are Olympic, and all 10 are reachable only BECAUSE the
       out-of-scope games are shown at all -- so it is the first thing a reader
       clicking February 2026 will hit. */
    /* ONE STRUCTURE FOR BOTH STATES: NHL first, then one group per
       competition. The rows and the dead state share it so that "none of these"
       always has the heading directly above it as its antecedent -- the first
       draft printed the state with no heading whenever the night held a single
       group, which is 10 of the 10 nights it actually happens on. */
    var gs = grouped(n.rows);
    gs.forEach(function (g) {
      /* ⭐ AN OUT-OF-SCOPE GROUP IS ALWAYS LABELLED, and the first draft got
         this wrong in the case that matters most. The rule was "a heading when
         there is more than one group", which is fine for the NHL heading -- a
         lone "NHL" above the only list names nothing -- and WRONG for the other
         one, because that label is a DISCLOSURE and not a convenience. 24
         September 2023 is twelve preseason games and nothing else, so it
         rendered twelve rows with no statement anywhere that none of them
         counts. 60 of the 62 out-of-scope dates are that shape.
         The NHL heading stays conditional; a dead night forces both, because
         the state sentence below needs an antecedent. */
      if (!g.nhl || gs.length > 1 || n.dead) {
        main.appendChild(heading(g));
      }
      if (!n.dead) { main.appendChild(rowsOf(g.rows)); return; }
      var gates = [];
      g.rows.forEach(function (r) {
        var t = gateOf(r.r);
        if (gates.indexOf(t) === -1) gates.push(t);
      });
      var p = el('p', 'dead');
      /* The count is in the heading line above when there is one group, so it
         is said here only when a group is not the whole night. */
      p.appendChild(el('b', null, gs.length > 1
        ? plural(g.rows.length, 'game') + ' · none can be shown'
        : 'None of these can be shown'));
      p.appendChild(el('span', null, ' — ' + join(gates)
        + '. They stay in the archive, because a schedule that hid them would be '
        + 'a map of our successes.'));
      main.appendChild(p);
    });
  }

  /* The name in the site's group-label voice, with the qualifier after it in
     ordinary case: a full sentence set in letter-spaced capitals wraps to two
     lines of shouting, which is what "PRESEASON — IN THE ARCHIVE, AND NOT
     COUNTED IN ANY NUMBER HERE" looked like at 390px. */
  function heading(g) {
    var p = el('p', 'gk', g.nhl ? 'NHL' : g.label);
    if (!g.nhl) {
      p.appendChild(el('span', null,
        ' — in the archive, and not counted in any number here'));
    }
    return p;
  }

  /* NHL first, then one group per competition, in the order the rows arrive --
     which nightOf has already sorted. */
  function grouped(rows) {
    var order = [], by = {};
    rows.forEach(function (r) {
      var k = r.scope === 'nhl' ? 'NHL' : competitionOf(r.type, NAMES);
      if (!by[k]) { by[k] = []; order.push(k); }
      by[k].push(r);
    });
    return order.map(function (k) {
      return { label: k, nhl: k === 'NHL', rows: by[k] };
    });
  }

  /* ---- what was asked for ---------------------------------------------- */

  var askedMonth = param(/[?&]month=(\d{4}-\d{2})(?!\d)/);
  var askedDate = param(/[?&]date=(\d{4}-\d{2}-\d{2})/);

  grab('catalog.json').then(function (cat) {
    var games = (cat && cat.games) || [];
    if (!games.length) {
      $('main').appendChild(el('p', 'note',
        'The archive could not be loaded, so there are no dates to show.'));
      return;
    }
    var months = monthsIn(games);
    if (askedDate) { drawNight(games, askedDate, months); return; }
    /* THE DEFAULT IS THE MOST RECENT MONTH WE HOLD A GAME IN. `monthsIn` spans
       the archive, so its last entry is that month by construction -- the rule
       cannot be typed, and it moves itself when the nightly lands. */
    var month = months.indexOf(askedMonth) === -1 ? months[months.length - 1] : askedMonth;
    drawMonth(games, month, months, askedMonth);
  });
})();
</script>"""


def build_calendar():
    html = (CAL_BODY.replace("__LIB__", _lib("competitions.js", "teams.js", "archive.js", "calendar.js"))
                    .replace("__HELPERS__", HELPERS)
                    .replace("__ORIGIN__", repr(DATA_ORIGIN).replace("'", '"'))
                    .replace("__NAMES__", _competitions()))
    html = P.document(html, title=CAL_TITLE, description=CAL_DESC,
                      url="https://readthegame.co/calendar.html",
                      current="/calendar.html",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">\n'
                           + STYLE)
    return html.replace("__CSP__", _csp(html))

def build():
    html = (BODY.replace("__LIB__", _lib())
             .replace("__HELPERS__", HELPERS)
             .replace("__ORIGIN__", repr(DATA_ORIGIN).replace("'", '"'))
             .replace("__SAYS__", SAYS)
             .replace("__LIMITS__", _limits()))
    # Stamped last: the hashes must cover the final bytes of the script and
    # style, and the CSP itself sits in <head>, outside both.
    html = P.document(html, title=TITLE, description=DESC,
                      url="https://readthegame.co/", current="/",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">\n'
                           + STYLE)
    return html.replace("__CSP__", _csp(html))

def main():
    # FOUR PAGES, ONE BUILDER, AND THE VERIFY COVERS ALL OF THEM. Two sections
    # of the home page became pages of their own; emitting them from a second
    # builder would put the shared stylesheet and the workshop list in two
    # places, which is where the next divergence hides.
    pages = [(OUT, build()),
             (ROOT / "src" / "what-you-can-see.html", build_learn()),
             (ROOT / "src" / "workshop.html", build_workshop()),
             (ROOT / "src" / "calendar.html", build_calendar())]
    # ONE PAGE PER RULE WE DREW. The list comes from the figures themselves, so a
    # new diagram is a page without anyone remembering to add it here -- and a
    # learn card links to `/{cid}.html` under exactly the same condition, which
    # is what keeps the link and the file from disagreeing.
    pages += [(ROOT / "src" / f"{cid}.html", build_rule(cid))
              for cid in sorted(_fig_json())]

    # A link to a file that does not exist is a 404 in production. Cheapest
    # possible gate, run on every build, before the byte comparison.
    missing = [h for h, *_ in WORKSHOP if not (ROOT / "src" / h).exists()]
    if missing:
        print("BROKEN LINKS -- these files do not exist: " + ", ".join(missing))
        return 1

    # A PLACEHOLDER THAT SURVIVES THE BUILD IS A PAGE WITH A HOLE IN IT, and
    # this builder shipped one: extracting HELPERS out of BODY substituted it
    # into the new page and not the old one, so index.html went to disk with the
    # literal `__HELPERS__` where its script should be. The build said nothing --
    # `str.replace` cannot fail, it just does not happen. `--verify` could not
    # see it either, because the byte comparison is against a file built the
    # same wrong way. test/homepage.test.js caught it, which is luck about which
    # page broke; this is the check that does not depend on that.
    left = {n: sorted(set(re.findall(r"__[A-Z][A-Z_]*__", html)))
            for n, html in ((p.name, h) for p, h in pages)}
    left = {n: v for n, v in left.items() if v}
    if left:
        for name, holes in left.items():
            print(f"UNSUBSTITUTED PLACEHOLDER in {name}: {', '.join(holes)}")
        return 1

    h = lambda s: hashlib.sha256(s.encode()).hexdigest()[:16]
    if "--verify" in sys.argv:
        ok = True
        for path, html in pages:
            current = path.read_text() if path.exists() else ""
            same = current == html
            ok = ok and same
            print(f"  {path.name:<24} built {len(html.encode()):>7}  sha {h(html)}  "
                  + ("BYTE-IDENTICAL" if same else f"DIFFERS from {len(current.encode())} on disk -- gate FAILED"))
        return 0 if ok else 1

    for path, html in pages:
        path.write_text(html)
    print(f"wrote {OUT} {len(pages[0][1].encode())} bytes; {len(WORKSHOP)} links checked; "
          f"plus {', '.join(p.name for p, _ in pages[1:])}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
