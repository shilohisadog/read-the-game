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

def _csp(html):
    """Delegates to page.csp — see there for why there is only one copy."""
    return P.csp(html, connect=DATA_ORIGIN)

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
    ("Regular season and playoffs, three seasons.",
     "2023-24 through 2025-26. Preseason, the Olympics and the 4 Nations Face-Off "
     "are in the archive and are deliberately left out of every number here — they "
     "are different competitions, and averaging across them would describe none."),
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
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
 color:var(--ink);background:var(--bg);line-height:1.55;
 padding:clamp(18px,4vw,44px) clamp(14px,4vw,22px)}
.wrap{max-width:900px;margin:0 auto}
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
 border:1px solid var(--edge);border-radius:12px;padding:15px 17px}
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
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
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
    <p class="herokick">The most recent game in the archive</p>
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
      row.appendChild(el('span', 'r', g.v
        ? (home ? g.hs + '–' + g.as : g.as + '–' + g.hs)
            + '  ·  ' + (home ? g.hsh + '–' + g.ash : g.ash + '–' + g.hsh) + ' shots'
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
  function newest(games) {
    var v = games.filter(function (g) { return g.v && inScope(g.id); });
    if (!v.length) return null;
    v.sort(function (a, b) { return a.d === b.d ? a.id - b.id : (a.d < b.d ? -1 : 1); });
    return v[v.length - 1];
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
    var won  = g.as === g.hs ? null : (g.as > g.hs ? g.a : g.h);
    if (lead == null) {
      $('herosub').textContent = 'Both teams took ' + a + ' shot attempts.';
    } else {
      var hi = Math.max(a, h), lo = Math.min(a, h);
      $('herosub').textContent = lead + ' took more shot attempts, ' + hi + ' to ' + lo
        + ', and ' + (won === null ? 'the game was level' : (won === lead ? 'won' : 'lost')) + '.';
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
    if (lead != null && won != null && at && at.n) {
      var lostPct = at.count / at.n * 100;
      var usuallyLoses = lostPct > 50;
      var thisLost = won !== lead;
      var usualPct = (usuallyLoses ? lostPct : 100 - lostPct).toFixed(1);
      rel.appendChild(el('b', null, thisLost === usuallyLoses
        ? 'That is the usual outcome.' : 'That is not the usual outcome.'));
      rel.appendChild(el('span', null, ' Across ' + at.n.toLocaleString()
        + ' games the team with more shot attempts '
        + (usuallyLoses ? 'loses' : 'wins') + ' ' + usualPct + '% of the time.'));
    }
  }

  function drawHero(cat, measures) {
    var g = newest((cat && cat.games) || []);
    if (!g) return;

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

    $('heroline').textContent = g.a + ' ' + g.as + ', ' + g.h + ' ' + g.hs
      + ' — ' + when(g.d);

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
                      (names or ("ingest-state.js", "teams.js", "archive.js")))


def _competitions():
    """The gameType table, inlined as JSON for the page.

    THE SAME FILE derive.py READS, never a second copy. derive.py walks the whole
    archive and is the only thing that can catch a new competition the day it
    lands -- and it exits non-zero when it finds one this table does not name.
    A table re-typed in JavaScript would be the copy that quietly disagrees.
    The `_` key is the file's own explanation of itself and is dropped here.
    """
    names = json.loads((ROOT / "data" / "competitions.json").read_text())["names"]
    return json.dumps(names, sort_keys=True, separators=(",", ":"))

def _workshop():
    return "\n".join(
        f'  <a class="card" href="{href}"><p class="t">{title}</p><p>{blurb}</p></a>'
        for href, title, blurb in WORKSHOP)

def _limits():
    return "\n".join(f"  <li><b>{h}</b><span>{b}</span></li>" for h, b in LIMITS)


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

    ids, want = {c[1] for c in LEARN_CARDS}, set(doors)
    if ids != want:
        raise SystemExit("learn: cards and doors disagree -- "
                         f"cards without a door: {sorted(ids - want)}; "
                         f"doors without a card: {sorted(want - ids)}")

    out = []
    for kind, heading in LEARN_GROUPS:
        cards = [c for c in LEARN_CARDS if c[0] == kind]
        out.append(f'  <p class="ck">{heading}</p>')
        out.append(f'  <div class="grid learn {kind}">')
        for _, cid, title, blurb in cards:
            door = doors[cid]
            blurb = (blurb.replace("__UNREACHED__", str(fig["unreached"]["count"]))
                          .replace("__ATTEMPTS__", str(fig["unreached"]["n"])))
            # The moment is shown, not just linked: a reader can see the card
            # points somewhere specific before spending a click on it.
            out.append(f'    <a class="card" href="/game.html{door["href"]}">'
                       f'<p class="t">{title}</p><p>{blurb}</p>'
                       f'<p class="at">Period {door["per"]} &middot; {door["rem"]} left</p></a>')
        out.append("  </div>")

    p1 = sum(1 for c in LEARN_CARDS if doors[c[1]]["per"] == 1)
    y, m, day = g["date"].split("-")
    when = f"{int(day)} {MONTHS[int(m) - 1]} {y}"
    out.append(
        f'  <p class="cnote">Every one of them is a toggle on a real game, and '
        f'every one shows the events it counted and the events it did not. '
        f'These {len(LEARN_CARDS)} moments are all from one night &mdash; '
        f'{g["away"]} at {g["home"]}, {when} &mdash; and {p1} of them '
        f'happen in the first period alone. Every other game we hold is '
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
    ("rules", "faceoffs", "Faceoffs",
     "Nine spots on the ice and the rule picks one. This is the restart the "
     "icing above forces &mdash; same second as the whistle, and deep in the "
     "offending team&rsquo;s own end."),
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
    ("rules", "offside", "Offside",
     "An attacking player crossed the blue line ahead of the puck, so the entry "
     "does not count. The feed records the call and the restart, never the "
     "crossing &mdash; so watch the line, not the play."),
    ("rules", "penalties", "Penalties",
     "The arm goes up and play carries on until the offending team touches the "
     "puck. This is that gap &mdash; the delayed call, before the whistle."),
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
    ("ours", "slot", "Shots from the slot",
     "A geometric rule of ours, not a model: close in, and between the faceoff "
     "dots. This is the first shot that qualifies."),
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

LEARN_TITLE = "What you can see here \u2014 Read the Game"
LEARN_DESC = ("The hockey rules this site names as they happen \u2014 icing, offside, "
              "faceoffs, penalties, the empty net \u2014 and the measurements it counts "
              "itself, each one showing the events behind it.")
WORKSHOP_TITLE = "Workshop \u2014 Read the Game"
WORKSHOP_DESC = ("Earlier views of the same NHL data, each answering a question the main "
                 "app does not. Explorations rather than front doors.")


def build_learn():
    html = LEARN_BODY.replace("__LEARN__", _learn())
    html = P.document(html, title=LEARN_TITLE, description=LEARN_DESC,
                      url="https://readthegame.co/what-you-can-see.html",
                      current="/what-you-can-see.html",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">\n'
                           + STYLE)
    return html.replace("__CSP__", _csp(html))


def build_workshop():
    html = WORKSHOP_BODY.replace("__WORKSHOP_PAGE__", WORKSHOP_PAGE.replace("__WORKSHOP__", _workshop()))
    html = P.document(html, title=WORKSHOP_TITLE, description=WORKSHOP_DESC,
                      url="https://readthegame.co/workshop.html",
                      current="/workshop.html",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">\n'
                           + STYLE)
    return html.replace("__CSP__", _csp(html))


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
      row.appendChild(el('span', 'r', g.shown
        ? g.as + '–' + g.hs + '  ·  ' + g.ash + '–' + g.hsh + ' shots'
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
    html = (CAL_BODY.replace("__LIB__", _lib("teams.js", "archive.js", "calendar.js"))
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
