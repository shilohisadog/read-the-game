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

/* THE TWO GROUPS ARE MADE TO LOOK DIFFERENT, not merely ordered. The split is
   the page's whole argument -- what the league does, against what we chose to
   count -- and a uniform grid flattens two kinds of claim into one row of
   cards. The measurement group takes the blue left edge that already means
   "our claim" on `.limits`, so the distinction is one a reader has met before. */
.grid.learn{margin:0 0 20px}
.grid.learn.ours .card{border-left:3px solid var(--blue)}
.card .at{margin-top:8px;font-size:.72rem;letter-spacing:.05em;color:var(--muted);
 font-variant-numeric:tabular-nums}

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
     scope that reasoning is unchanged. */
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
    ("rules", "offside", "Offside",
     "Why a goal gets waved off. The feed names the call; the restart shows you "
     "where play is allowed to begin again."),
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


def build():
    html = (BODY.replace("__LIB__", _lib())
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
    # THREE PAGES, ONE BUILDER, AND THE VERIFY COVERS ALL OF THEM. Two sections
    # of the home page became pages of their own; emitting them from a second
    # builder would put the shared stylesheet and the workshop list in two
    # places, which is where the next divergence hides.
    pages = [(OUT, build()),
             (ROOT / "src" / "what-you-can-see.html", build_learn()),
             (ROOT / "src" / "workshop.html", build_workshop())]

    # A link to a file that does not exist is a 404 in production. Cheapest
    # possible gate, run on every build, before the byte comparison.
    missing = [h for h, *_ in WORKSHOP if not (ROOT / "src" / h).exists()]
    if missing:
        print("BROKEN LINKS -- these files do not exist: " + ", ".join(missing))
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
