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
    """A Content-Security-Policy the BROWSER enforces, replacing a grep we wrote.

    The deploy gate used to assert this page calls nobody by grepping for
    `fetch(`, `XMLHttpRequest` and friends. That is a blacklist over an open
    vocabulary and cannot close -- it misses import(), EventSource, sendBeacon,
    new Image().src and window["fetch"]. Same failure class as the ESM guard
    that could only fail on inputs the builder already handled.

    So the claim stops being ours to assert. `default-src 'none'` permits
    nothing by default, and the only network destination named is the data
    origin. A page that tried to call anywhere else would be stopped by the
    browser, not by our confidence.

    THE SCRIPT AND STYLE ARE HASH-PINNED rather than allowed with
    'unsafe-inline'. The builder already hashes this artifact for the byte gate,
    so this costs nothing -- and it is a third integrity gate, enforced past our
    CI and onto the reader's machine: any modification to the shipped script, by
    anyone, anywhere in the delivery path, and the browser refuses to run it.
    """
    def h(pattern):
        m = re.search(pattern, html, re.S)
        digest = hashlib.sha256(m.group(1).encode()).digest()
        return "'sha256-" + base64.b64encode(digest).decode() + "'"

    return "; ".join([
        "default-src 'none'",
        f"script-src {h(r'<script>(.*?)</script>')}",
        f"style-src {h(r'<style>(.*?)</style>')}",
        f"connect-src 'self' {DATA_ORIGIN}",
        "base-uri 'none'",
        "form-action 'none'",
    ])

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

T = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Read the Game — hockey, made legible</title>
<meta name="description" content="A single NHL game, replayed so a new fan can see what the numbers are made of. Nothing modelled, nothing invented.">
<meta http-equiv="Content-Security-Policy" content="__CSP__">
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

/* THE TEAM GRID IS ONE OBJECT, not thirty-three. Uniform chips, no typing, one
   click. Google-clean was the brief: above the fold is this and one link. */
.teams{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));
 gap:7px;margin:0 0 26px}
.chip{display:flex;align-items:center;justify-content:center;height:46px;
 border-radius:9px;text-decoration:none;font-weight:800;letter-spacing:.06em;
 font-size:.9rem;border:1px solid rgba(0,0,0,.12);
 transition:transform .12s ease,box-shadow .12s ease}
.chip:hover,.chip:focus-visible{transform:translateY(-2px);box-shadow:0 6px 16px rgba(16,32,45,.18)}
.start{margin:0 0 4px;font-size:.95rem}
.start a{color:var(--blue);font-weight:600;text-decoration:none}
.start a:hover{text-decoration:underline}

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

.rates{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.rates li{background:#fff;border:1px solid var(--edge);border-radius:10px;padding:11px 15px;
 display:flex;justify-content:space-between;gap:14px;align-items:baseline;font-size:.9rem}
.rates .v{font-variant-numeric:tabular-nums;font-weight:700;font-size:1.05rem}
.rates .n{display:block;font-size:.76rem;color:var(--muted);font-weight:400}

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
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<div class="wrap">
<p class="eyebrow">Read the Game</p>
<h1>__H1__</h1>

<!-- ABOVE THE FOLD: one object and one link.
     Rendered by script from the catalog, because the team set is a fact about
     the archive and not a list to type. Thirty-three today: Arizona relocated to
     Utah inside the window this archive covers. -->
<main id="main">
  <div class="teams" id="teams"></div>
  <p class="start"><a id="start" href="game.html">New to hockey? Start here &rarr;</a></p>
</main>

<h2>What the archive says</h2>
<ul class="rates" id="rates"><li>Reading the archive&hellip;</li></ul>
<p class="lede" id="thesis">__THESIS__</p>

<h2>What this does and does not claim</h2>
<ul class="limits">
__LIMITS__
</ul>

<p class="state" id="state" data-state="empty">Checking how current this data is&hellip;</p>

<h2>Workshop</h2>
<p class="note">Earlier views, each answering a question the main app does not.
They are explorations, not front doors, and several are pinned to one game.</p>
<div class="grid">
__WORKSHOP__
</div>

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
     teaches against, and publishing one bare would be us doing it. */
  function drawRates(m) {
    var box = $('rates');
    box.textContent = '';
    if (!m || !m.baseRates) {
      box.appendChild(el('li', null, 'The archive measurement could not be loaded.'));
      return;
    }
    var order = ['moreShotsOnGoalLost', 'moreAttemptsLost', 'moreLevelControlLost'];
    order.forEach(function (k) {
      var r = m.baseRates[k];
      if (!r || r.rate == null) return;
      var li = el('li');
      var left = el('span');
      left.appendChild(el('span', 'w', r.what.charAt(0).toUpperCase() + r.what.slice(1)));
      left.appendChild(el('span', 'n', r.count + ' of ' + r.n + ' · ' + r.population));
      li.appendChild(left);
      /* COMPUTED FROM THE COUNT AND THE DENOMINATOR PRINTED BESIDE IT, never
         from the stored `rate`. A reader who checks 1811 of 3957 must get the
         number we show; if the stored rate were ever rounded or stale the two
         would disagree on screen and the reader would be right. Caught by a test
         whose fixture carried a rounded rate and rendered 54.4 against 54.5. */
      li.appendChild(el('span', 'v', (r.count / r.n * 100).toFixed(1) + '%'));
      box.appendChild(li);
    });
    if (m.featured && m.featured.length) {
      $('start').href = 'game.html?game=' + m.featured[0].id;
    }
  }

  var team = (/[?&]team=([A-Za-z]{2,3})/.exec(location.search) || [])[1];
  if (team) team = team.toUpperCase();
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
      }
      drawRates(measures);
      var s = describe(index, new Date().toISOString());
      $('state').setAttribute('data-state', s.state);
      $('state').textContent = s.lines.join(' ');
    });
})();
</script>
</body>
</html>
"""

H1 = "Watch a hockey game and see what the numbers are made of"

# THE THESIS, and it is the best sentence this project has earned. It is not a
# hedge against "shot counts are meaningless" -- it is the finding, measured over
# 4,119 games: counted the obvious way the leader loses more often than not, and
# counted properly the leader wins. The numbers themselves are fetched, never
# typed, so this text must not contain any of them.
THESIS = ("Count shot attempts the obvious way and the team with more of them loses "
          "slightly more often than it wins &mdash; because falling behind is what makes "
          "a team shoot. Count only the attempts taken at even strength while the score "
          "was level, and the picture reverses. <b>Which number you count changes the "
          "answer.</b> That is what this site is for.")


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
    html = (T.replace("__LIB__", _lib())
             .replace("__ORIGIN__", repr(DATA_ORIGIN).replace("'", '"'))
             .replace("__H1__", H1)
             .replace("__THESIS__", THESIS)
             .replace("__WORKSHOP__", _workshop())
             .replace("__LIMITS__", _limits()))
    # Stamped last: the hashes must cover the final bytes of the script and
    # style, and the CSP itself sits in <head>, outside both.
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
