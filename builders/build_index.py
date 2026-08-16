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
import base64, hashlib, pathlib, re, sys

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
    ("figure-bench.html", "Figure bench",
     "A development tool: the two player styles side by side on blank ice."),
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
.scale{margin:0 0 18px}
.scale .row{display:grid;grid-template-columns:1fr;gap:3px;padding:9px 0}
/* THE FRACTION IS THE PART THAT MUST SURVIVE (CHENG).
   Label and fraction share one row, and the label is the long one -- "the team
   that controlled play while the score was level lost". On a 360px screen a
   space-between row squeezes whichever child can give, and the one that can give
   is the number. So the row WRAPS, the fraction never breaks across lines
   mid-way, and below 30rem the two stack outright: the label takes the width it
   needs and the fraction sits underneath at full size. The track is decoration
   around the number; the number is the claim. */
.scale .rl{font-size:.86rem;display:flex;flex-wrap:wrap;justify-content:space-between;
 gap:2px 12px;align-items:baseline}
.scale .rl b{font-weight:650;min-width:0}
.scale .rl .f{color:var(--muted);font-size:.76rem;font-variant-numeric:tabular-nums;
 white-space:nowrap;flex-shrink:0}
.scale .track{position:relative;height:16px;border-radius:8px;background:#e6edf3}
.scale .half{position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:var(--muted);opacity:.55}
.scale .pt{position:absolute;top:50%;width:13px;height:13px;border-radius:50%;
 transform:translate(-50%,-50%);border:2px solid #fff;box-shadow:0 1px 3px rgba(16,32,45,.3)}
.scale .pt.lo{background:#1f7a4d}.scale .pt.hi{background:#b3341f}
/* The axis ends are the least load-bearing thing here, so they are the ones
   allowed to shrink and wrap. Order of sacrifice: end labels, then the track,
   never the fraction. */
.scale .axis{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 10px;
 font-size:.72rem;color:var(--muted);margin-top:2px;font-variant-numeric:tabular-nums}
.scale .key{font-size:.8rem;color:var(--muted);margin:9px 0 0;max-width:62ch}
.scale .key b{color:var(--ink)}
/* ONE REFERENCE CLASS FOR ALL THREE ROWS, said once. It used to ride on every
   row of a list that no longer exists. */
.scale .pop{font-size:.76rem;color:var(--muted);margin:7px 0 0}

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
.heroframe iframe{display:block;width:100%;aspect-ratio:200/108;border:0}
/* A TALLER FRAME ON A PHONE, because the scoreboard inside it is not
   proportional even after it was made to shrink. Measured in a real browser:
   the chrome is 87px of an 856px-wide frame (10%) and 49px of a 287px one
   (17%), so one ratio cannot serve both -- at 200/108 the phone's rink fits
   the height and leaves empty ice down both sides. 200/128 gives the narrow
   frame the room its rink actually wants; the wide one is already exact. */
@media (max-width:520px){.heroframe iframe{aspect-ratio:200/128}}
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

BODY = r"""<div class="wrap">
<p class="eyebrow">Read the Game</p>
<h1>__H1__</h1>
<!-- WHAT THIS IS, IN ONE SENTENCE, WHICH THE PAGE DID NOT SAY AT ALL.
     A stranger's questions are, in order: what is this, why should I care, what
     do I do. Only the third had an answer above the fold, and it was a button. -->
<p class="says">__SAYS__</p>

<!-- WHY SHOULD I CARE, AND IT IS NOW WHERE THAT QUESTION IS ASKED.
     §4 of docs/site-purpose.md states the front page's job as "what is this ->
     why should I care -> what do I do", and this block used to sit at screen
     4.53 of 6.29 on a phone, four screens after the invitation it justifies.
     CHENG's ruling: "the thesis is about 3,855 OTHER games. It isn't a
     conclusion about the hero, it's the reason the hero is interesting." Read
     the two orders aloud and only one of them is an argument:
       "Here's a game. Also, across 3,855 games, the leader won 60.4%."
       "Shot counts don't tell you who won as often as you'd think -- here's a
        game where that happened."
     THE RATES ARE THE EVIDENCE, AND THEY ARE DRAWN ONCE. Three equally weighted
     rows flattened the only interesting thing about them: 54.5% sits on the
     OTHER SIDE OF 50% from 39.6%. There used to be a second copy of all three,
     318px lower, differing by one string -- the population -- repeated three
     times. drawScale's own comment justified the duplicate by saying the axis
     was "never a replacement for the denominator", which stopped being true
     when the axis gained the denominators. The list is gone; the population is
     stated once, below. -->
<!-- ONE ELEMENT, BECAUSE THE TEAM VIEW HAD NO WAY TO SAY "AND NOT THAT".
     `drawTeam` clears the page by wiping `#main`, and these three sat OUTSIDE
     it, so a fan who had already named a club in the URL got 0.90 screens of
     front-door argument at 1100px and 1.24 at 390px before "← All teams" --
     with the club's own name below the fold at both widths. The rule was
     already written down one branch away ("a fan who asked for BUF is not
     looking for a Dallas game") and applied to the hero alone.
     A WRAPPER RATHER THAN THREE HIDDEN CHILDREN, so the rule has one subject
     and cannot be applied to two of three the next time something is added
     here -- which is the exact way this broke. -->
<section id="argument">
<h2 id="what">Which number you count changes the answer</h2>
<p class="lede" id="thesis">__THESIS__</p>
<div class="scale" id="scale" hidden></div>
</section>
<!-- HERE IS ONE. The argument above is about 3,855 games; this is a game.
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
<!-- NAME WHAT THE SITE TEACHES, because it named none of it.
     Counted on the shipped page before this: icing 0, offside 0, Corsi 0,
     high-danger 0, empty net 0, penalty 0. A site that teaches you to read
     hockey mentioned almost nothing it teaches, and a visitor deciding whether
     to look around decides on whether we appear to cover what they wondered
     about.
     TWO KINDS, KEPT APART. The first row is HOCKEY — rules a novice needs in
     order to watch. The second is OURS — what we count, which is a different
     claim and carries a different obligation. Merging them would let our
     measurements borrow the rulebook's authority. -->
<h2 id="learn">What you can see here</h2>
<div class="conc">
  <p class="ck">The game itself &mdash; the league&rsquo;s rules, named as they happen</p>
  <ul class="clist">
    <li><b>Icing</b> &mdash; and why the faceoff goes back</li>
    <li><b>Offside</b> &mdash; why a goal gets waved off</li>
    <li><b>Faceoffs</b> &mdash; all nine spots, and which one play restarts at</li>
    <li><b>Penalties</b> &mdash; and the delayed whistle</li>
    <li><b>The empty net</b> &mdash; when a goaltender leaves, read from the feed</li>
  </ul>
  <p class="ck">What we count &mdash; our own measurements, each showing its work</p>
  <ul class="clist">
    <li><b>Control</b> &mdash; shot attempts, and the narrower count that predicts</li>
    <li><b>Shots from the slot</b> &mdash; a geometric rule of ours, not a model</li>
    <li><b>Goaltending</b> &mdash; saves as a fraction, built while you watch</li>
  </ul>
  <p class="cnote">Every one of them is a toggle on a real game, and every one
  shows the events it counted and the events it did not.</p>
</div>
<h2>What this does and does not claim</h2>
<ul class="limits">
__LIMITS__
</ul>
<h2 id="workshop">Workshop</h2>
<p class="note">Earlier views, each answering a question the main app does not.
They are explorations, not front doors, and several are pinned to one game.</p>
<div class="grid">
__WORKSHOP__
</div>

<p class="state" id="state" data-state="empty">Checking how current this data is&hellip;</p>

<footer>
<p>Play-by-play, shift and boxscore data for NHL games, retrieved from the
league&rsquo;s public game-feed endpoints and stored once. Not affiliated with,
endorsed by, or a product of the National Hockey League or any club. Team abbreviations
and colours are used to identify the teams; no league or club logos or marks appear here.</p>
<p>Source, method and the rules this is built under:
<a href="https://github.com/shilohisadog/read-the-game">github.com/shilohisadog/read-the-game</a></p>
</footer>
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
  var $ = function (id) { return document.getElementById(id); };
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
  }

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
  }

  /* A team's games, newest first. The first VIEWABLE one is the thing you press
     play on, so a cold visitor reaches a game in two clicks.

     REFUSED GAMES ARE LISTED, greyed, with the check that stopped them. Hiding
     them would make this a map of our successes -- Doctrine 9 -- and inside the
     scope that argument is unchanged. */
  /* THE SEASON IS THE UNIT A HOCKEY FAN THINKS IN, and it is also what keeps this
     page to the brief. Buffalo have 259 games in the archive; rendering all of
     them is a wall, which is the opposite of what was asked for. Read from the
     game id -- 2025020123 is season 2025-26 -- so it needs no lookup and cannot
     disagree with the id. */
  function seasonOf(id) { return +String(id).slice(0, 4); }
  function seasonLabel(y) { return y + '-' + String(y + 1).slice(2); }

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

  /* THE THESIS, in the league's numbers and ours. Every rate carries its
     denominator: a rate without its reference class is the thing this site
     teaches against, and publishing one bare would be us doing it.

     THE SECOND COPY IS GONE. This used to build a three-row list of exactly the
     rows drawScale already draws, 318px lower on a phone, differing by one
     string: the population, repeated three times. drawScale's own comment
     defended keeping both -- "the axis is never a replacement for the
     denominator" -- which was true when written and stopped being true when the
     axis started printing "1811 of 3957" on every row. A justification anchored
     to a property of something else, which is this batch's recurring defect.
     WHAT SURVIVES IS THE FAILURE STATE. A missing measurement is a thing to say
     out loud, not an empty box, and it now says it where the scale would be. */
  function drawRates(m) {
    if (!m || !m.baseRates) {
      var box = $('scale');
      box.textContent = '';
      box.appendChild(el('p', 'key', 'The archive measurement could not be loaded.'));
      box.hidden = false;
      return;
    }
    drawScale(m);
  }

  /* THREE POINTS ON ONE SCALE, WITH 50% MARKED, AND NO LINE BETWEEN THEM.
     The interesting thing is not any of the three numbers -- it is that one of
     them sits on the OTHER SIDE OF 50% from the others, and three equally
     weighted rows flatten exactly that. Ordered crudest to most refined the
     values are non-monotone, which is a feature: it cannot be misread as
     "counting better makes the number go down".
     Every point still carries its own fraction, because the axis is a second
     way of saying what the rows say and never a replacement for the
     denominator. */
  function drawScale(m) {
    var box = $('scale'), rates = m && m.baseRates;
    if (!rates) return;
    var order = ['moreShotsOnGoalLost', 'moreAttemptsLost', 'moreLevelControlLost'];
    box.textContent = '';
    var any = false;
    order.forEach(function (k) {
      var r = rates[k];
      if (!r || !r.n) return;
      any = true;
      var pct = r.count / r.n * 100;
      var row = el('div', 'row');
      var lab = el('div', 'rl');
      lab.appendChild(el('b', null, r.what.charAt(0).toUpperCase() + r.what.slice(1)));
      lab.appendChild(el('span', 'f', r.count + ' of ' + r.n + ' — ' + pct.toFixed(1) + '%'));
      row.appendChild(lab);
      var track = el('div', 'track');
      track.appendChild(el('span', 'half'));
      var pt = el('span', 'pt ' + (pct > 50 ? 'hi' : 'lo'));
      pt.style.left = pct.toFixed(1) + '%';
      track.appendChild(pt);
      row.appendChild(track);
      box.appendChild(row);
    });
    if (!any) return;
    var ax = el('div', 'axis');
    /* BOTH ENDS NAMED IN FULL. The first draft read "never lost →" on the
       right-hand end, which is the OPPOSITE of what that end means: 100% is the
       leader losing every time. An axis label that inverts the axis is worse
       than no label. */
    ax.appendChild(el('span', null, '0% — the leader always won'));
    ax.appendChild(el('span', null, 'the leader always lost — 100%'));
    box.appendChild(ax);

    /* THE PAYOFF, COMPUTED. Every rate on this page is published as "lost",
       which is right -- it keeps the three comparable. It also means the site
       never once says the thing a newcomer came for. The complement is
       arithmetic on the two numbers already printed, so it is derived here
       rather than typed, like everything else on this page. */
    var lc = rates.moreLevelControlLost;
    if (lc && lc.n) {
      var won = lc.n - lc.count;
      /* MIXED POLARITY ON ONE PAGE, made explicit rather than left to the
         reader (CHENG). The three rows read "lost", which is what keeps them
         comparable; this line reads "won". Scanning 45.8 / 54.5 / 39.6 and then
         60.4 means tracking which direction each runs — so the sentence names
         the row it inverts and says it is the same games counted the other way,
         rather than arriving as a fourth number. */
      var key = el('p', 'key');
      key.appendChild(el('span', null, 'That last row is the same games counted '
        + 'the other way: the other '));
      key.appendChild(el('b', null, (won / lc.n * 100).toFixed(1) + '% — '
        + won + ' of ' + lc.n + ' — they won.'));
      box.appendChild(key);
    }

    /* THE POPULATION, ONCE. It was printed on every row of the deleted list --
       the same string three times, 318px of a phone screen. Stating it once is
       not a weaker claim: it is one reference class governing all three rows,
       which is what makes them comparable in the first place.
       DISTINCT VALUES, NOT THE FIRST ONE. If the three rates ever disagreed
       about their population, printing the first would publish a rate under
       somebody else's reference class -- the exact thing this site teaches
       against. So they are collected, and a disagreement is SHOWN. */
    var pops = [];
    order.forEach(function (k) {
      var r = rates[k];
      if (r && r.n && r.population && pops.indexOf(r.population) < 0) pops.push(r.population);
    });
    if (pops.length) box.appendChild(el('p', 'pop', pops.join(' · ')));
    box.hidden = false;
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
    $('heroframe').appendChild(f);

    $('heroline').textContent = g.a + ' ' + g.as + ', ' + g.h + ' ' + g.hs
      + ' — ' + when(g.d);

    /* THE SHOT LINE, AND IT IS SAID BOTH WAYS ROUND. This is the site's thesis
       at its smallest: the team with more shots on goal lost 45.8% of the time,
       so whether the shot leader won or lost, the sentence is the same shape and
       the reader is not being shown only the surprising half. Showing the
       comparison only when it is striking is what Doctrine §9 calls selective
       honesty -- worse than none, because it looks rigorous.
       Everything here is a catalog field. No extra request, nothing modelled. */
    var lead = g.ash === g.hsh ? null : (g.ash > g.hsh ? g.a : g.h);
    var won = g.as === g.hs ? null : (g.as > g.hs ? g.a : g.h);
    if (lead == null) {
      $('herosub').textContent = 'Both teams put ' + g.ash + ' shots on goal.';
    } else {
      var hi = Math.max(g.ash, g.hsh), lo = Math.min(g.ash, g.hsh);
      $('herosub').textContent = lead + ' put more shots on goal, ' + hi + ' to ' + lo
        + ', and ' + (won === null ? 'the game was level' : (won === lead ? 'won' : 'lost')) + '.';
    }

    /* IS THIS THE USUAL CASE? COMPUTED, NEVER WRITTEN.
       The thesis now sits directly above this game, so the hero is read as an
       INSTANCE of it -- and the hero is the most recent game, which means some
       nights confirm the rate and some contradict it. CHENG: "the caption must
       handle both, which means the relationship has to be computed, not
       written." A hand-written clause here would be the #start defect a third
       time: copy asserting a relationship the data is free to invert overnight.
       BOTH INGREDIENTS ARE ALREADY ON THE PAGE -- the rate three inches above
       and this game's own outcome in the line before -- so nothing is fetched
       and nothing is modelled. It is a comparison, not a prediction.
       SAID EITHER WAY ROUND. Naming the relationship only when the game is the
       exception is Doctrine §9's selective honesty: it looks rigorous and shows
       the reader one half of the evidence. If tonight's game is ordinary, the
       caption says so, and the rate is the same sentence either way.
       NOTHING IS SAID WHEN NOTHING CAN BE. A tie in shots has no leader and a
       tie on the scoreboard has no outcome; a rate cannot classify either, and
       an unclassifiable game gets silence rather than a guess. */
    var sog = measures && measures.baseRates && measures.baseRates.moreShotsOnGoalLost;
    if (lead != null && won != null && sog && sog.n) {
      var lostPct = sog.count / sog.n * 100;
      var usuallyLoses = lostPct > 50;
      var thisLost = won !== lead;
      var usualPct = (usuallyLoses ? lostPct : 100 - lostPct).toFixed(1);
      var rel = $('herorel');
      rel.appendChild(el('b', null, thisLost === usuallyLoses
        ? 'That is the usual outcome.' : 'That is not the usual outcome.'));
      rel.appendChild(el('span', null, ' Across ' + sog.n.toLocaleString()
        + ' games the shot leader ' + (usuallyLoses ? 'loses' : 'wins') + ' '
        + usualPct + '% of the time.'));
    }
    $('herogo').href = 'game.html?game=' + g.id;

    /* THERE IS NO SECOND LINK TO THIS GAME, and that is the fix rather than an
       omission. A separate "New to hockey? Start with the game at the top"
       sat 2.4 screens below this button, pointing at the same destination and
       telling the reader to scroll back up -- a page apologising for its own
       order. It also spent a week pointing at a DIFFERENT game, because its
       href was set from featured[0] while the hero moved to most-recent.
       With the thesis above and the game here, the argument and the invitation
       are adjacent and one button is the whole funnel. Whether a novice needs
       to be addressed by name is a question for the tester, not a leftover. */
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
  if (team) $('argument').hidden = true;
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
      /* AND THE ARGUMENT IS THE FRONT DOOR'S TOO. Same reason, one line later,
         and it took Kevin's screenshot to notice it had never been extended:
         the rates are the evidence FOR the thesis, so drawing them onto a page
         whose thesis is hidden would leave a chart of nothing.
         NOT FOLDED INTO THE `else` ABOVE: the archive-failed branch still gets
         its rates, because measures.json is a different file and can arrive
         when the catalog does not. */
      if (!team) drawRates(measures);
      var s = describe(index, new Date().toISOString());
      $('state').setAttribute('data-state', s.state);
      $('state').textContent = s.lines.join(' ');
    });
})();
</script>"""
H1 = "Watch a hockey game and see what the numbers are made of"

# WHAT THE SITE IS, IN ONE SENTENCE. The page never said it.
#
# NO NUMBERS IN THIS TEXT, the same rule the thesis paragraph carries: the
# archive's size is fetched and rendered, never typed, so a sentence claiming a
# count would be a claim that goes stale between deploys. "Every NHL game since
# 2023" is a claim about SCOPE, which the limits block below states exactly and
# which does not move.
SAYS = ("Every NHL game since 2023, replayed play by play &mdash; with the counts "
        "built in front of you, so you can see <b>where a number comes from</b> "
        "instead of taking it on faith.")

# THE THESIS, and it is the best sentence this project has earned. It is not a
# hedge against "shot counts are meaningless" -- it is the finding, measured over
# 4,119 games: counted the obvious way the leader loses more often than not, and
# counted properly the leader wins. The numbers themselves are fetched, never
# typed, so this text must not contain any of them.
# NO MAGNITUDE IN THE PROSE. It read "loses SLIGHTLY more often" -- a claim about
# effect size, made in words, three lines above the exact figure and its
# denominator. The publication rule was applied to the digits and then walked
# around by the sentence, which is the same assertion with the error bars removed
# and no way for a reader to check it. CHENG caught it. The number says how much;
# the sentence only has to say which way.
THESIS = ("Count shot attempts the obvious way and the team with more of them loses "
          "more often than it wins &mdash; because falling behind is what makes "
          "a team shoot. Count only the attempts taken at even strength while the score "
          "was level, and the picture reverses.")

def _lib():
    """Inline the analysis modules the browser needs, as real source.

    THE SAME FILES THE PIPELINE IMPORTS. `inScope` decides which games count here
    and in builders/measure.mjs; re-typing it in page script would be the second
    implementation this project keeps almost building. See docs/architecture.md.
    """
    return "\n".join(_module(n) for n in
                      ("ingest-state.js", "teams.js", "archive.js"))

def _workshop():
    return "\n".join(
        f'  <a class="card" href="{href}"><p class="t">{title}</p><p>{blurb}</p></a>'
        for href, title, blurb in WORKSHOP)

def _limits():
    return "\n".join(f"  <li><b>{h}</b><span>{b}</span></li>" for h, b in LIMITS)

def build():
    html = (BODY.replace("__LIB__", _lib())
             .replace("__ORIGIN__", repr(DATA_ORIGIN).replace("'", '"'))
             .replace("__H1__", H1)
             .replace("__SAYS__", SAYS)
             .replace("__THESIS__", THESIS)
             .replace("__WORKSHOP__", _workshop())
             .replace("__LIMITS__", _limits()))
    # Stamped last: the hashes must cover the final bytes of the script and
    # style, and the CSP itself sits in <head>, outside both.
    html = P.document(html, title=TITLE, description=DESC,
                      url="https://readthegame.co/", current="/",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">\n'
                           + STYLE)
    return html.replace("__CSP__", _csp(html))

def main():
    html = build()

    # A link to a file that does not exist is a 404 in production. Cheapest
    # possible gate, run on every build, before the byte comparison.
    missing = [h for h, *_ in WORKSHOP if not (ROOT / "src" / h).exists()]
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
    print(f"wrote {OUT} {len(html.encode())} bytes; {len(WORKSHOP)} links checked")
    return 0

if __name__ == "__main__":
    sys.exit(main())
