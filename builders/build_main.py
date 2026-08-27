#!/usr/bin/env python3
"""Read the Game — the main app. THE generator; src/read-the-game.html is output.

Phase 0 of the rework (docs/main-app-rework.md). This file was recovered by
extracting the shipped HTML back into a template, because the original build
chain could not produce it any more: build_v1 / build_alive / build_alive2 each
carried a full independent template writing this same file, so running an
earlier one silently reverted the later ones, and build_alive3.py had been
abandoned mid-edit behind an `if False`. Those five now live in builders/legacy/
and are not part of the build.

No behaviour change is intended here. The gate is byte-identical output against
the file this template came from -- run with --verify to check it.

  python3 builders/build_main.py            -> src/read-the-game.html
  python3 builders/build_main.py --verify   -> build, compare, do not write
"""
import base64, hashlib, json, pathlib, re, subprocess, sys, tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from jscheck import check_script
import page as P

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "read-the-game.html"
SHELL = ROOT / "src" / "game.html"

# The embedded literal is byte-identical to json.dumps(rich.json,
# separators=(",", ":")) -- verified during extraction, and the --verify gate
# re-checks it on every build.
DATA = json.loads((ROOT / "data" / "rich.json").read_text())

T = r"""<style>
__CSS__</style>
<!-- ⭐ THE SHELL'S STATUS LINE, AND IT IS OUTSIDE `#rg` ON PURPOSE (D9).
     It used to be `#gl`, the game line -- which sits at the BOTTOM of the app,
     measured at y=1222 on a 390x844 phone. So a game that could not load said
     so a screen and a half below a page that looked like it was working, while
     the app above it rendered in full. The message a visitor needs first
     cannot live inside the thing it is reporting the absence of: hiding `#rg`
     would hide the explanation with it. -->
<div class="shellmsg" id="shellmsg" hidden><p id="shellsay"></p><nav id="shellout" aria-label="Ways into the archive"></nav></div>
<div id="rg"><div class="wrap">
<!-- ⭐ THE LEDE IS THE HEADING. There was a tagline AND an <h1>, and once the
     <h1> read "Read the game" it was the wordmark in the header repeated four
     lines lower. Kevin: "the wordmark echo isn't ideal, I'd remove the h1 and
     maybe increase the font size of the Learn to read hockey line."
     The page still needs ONE heading -- for the document outline, for a screen
     reader's heading list, and for what a search result shows -- so the line
     that was already saying what this page is becomes it, rather than the page
     losing its h1 altogether. `index.html` made exactly this move already
     (`<h1 class="says">`, test/homepage.test.js:719): the sentence became the
     heading instead of sitting under one.
     NOT `class="lede"` -- that name is spoken for. `render-notes.test.js:435`
     forbids it outright, because it was the read-once opening PARAGRAPH that
     the first-visit block replaced on measured grounds (576px -> 305px). Taking
     the name back for a different element would have left that guard passing on
     a page that no longer contains what it was written to keep out. -->
<h1 class="pagelede">Learn to read hockey · event by event first, add metrics after</h1>
<div class="newcomer" id="newcomer"></div>
<div class="board">
  <div class="tm a"><span class="ab" id="aAb">&mdash;</span><span class="sc" id="aSc">0</span></div>
  <div class="mid"><div class="gs"><span id="per">Pre-game</span> · <span class="cl" id="clk">20:00</span> <i class="clw">left</i></div>
    <div class="cbar"><div class="bar"><span class="ba" id="ba"></span><span class="bh" id="bh"></span></div>
    <div class="pct"><span id="pa">0</span><span class="plab"><i class="pname" id="pName">CONTROL</i><i class="mode" id="pMode">ALL SITUATIONS</i></span><span id="ph">0</span></div></div>
  </div>
  <div class="tm h"><span class="ab" id="hAb">&mdash;</span><span class="sc" id="hSc">0</span></div>
  <p class="foot" id="gl">—</p>
</div>
<p class="endnote" id="endnote"></p>
<p class="atnote" id="atnote"></p>
<div class="rinkbox"><svg viewBox="0 0 200 85"><g id="rink"></g><g id="netmen"></g><g id="lines"></g><g id="whistles"></g><g id="events"></g><g id="puck"></g><g id="labels"></g><g id="noplace"></g></svg>
  <!-- THE FIRST STEP, ON THE ICE. Kevin: "we should overlay 'Press Play' onto the
       rink, in rather large lettering, so the first time visitor knows what the
       first step is". It is a CONDITION, not a tip: it is on screen exactly when
       the playhead is at the pre-game frame, so it is recomputable from the
       playhead alone and needs no first-visit gating and can never go stale. It
       is also the only thing on this page that removes itself by being obeyed.
       aria-hidden because `#play` already offers this action with a real label;
       a second tab stop for the same command is noise to a screen reader. -->
  <button class="pressplay" id="pressplay" tabindex="-1" aria-hidden="true">&#9654; Press Play</button>
  <div class="pboxes" id="pboxes"><span class="pblab">Penalty box</span><span class="pb a" id="pbA"></span><span class="pb h" id="pbH"></span><div class="caption" id="caption"></div></div>
  <div class="counters"><div class="cc a"><span class="n" id="cA">0</span><span class="lb">Away attempts<span class="mode" id="mA">ALL SITUATIONS</span></span></div><div class="cc h"><span class="lb">Home attempts<span class="mode" id="mH">ALL SITUATIONS</span></span><span class="n" id="cH">0</span></div></div>
</div>
<details class="zone zlayers" id="zLayers"><summary class="zh">Add a metric layer<span class="zon" id="zLayersOn"></span></summary>
<div class="lrows">
<button class="lrow" id="lyCorsi" data-pick="corsi" aria-pressed="false"><span class="lmk"></span><span class="ltx"><b>Corsi</b><span class="lds">every shot attempt the league recorded: on goal, missed, or blocked, because all three are the team moving the puck at the net</span><span class="lon">The counters above the rink fill in as the replay runs, and the bar splits the attempts between the two clubs.</span></span><span class="st" id="stCorsi">Off</span></button>
<button class="lrow" id="lyHd" data-pick="slot" aria-pressed="false"><span class="lmk"><i class="k-hd"></i></span><span class="ltx"><b>Slot shots</b><span class="lds">attempts from within 33 ft of the net, between the face-off dots</span><span class="lon">An amber ring marks each one. Click a ring to see the distance and angle it was measured by.</span></span><span class="st" id="stHd">Off</span></button>
<button class="lrow" id="lyGoalie" data-pick="goaltending" aria-pressed="false"><span class="lmk"></span><span class="ltx"><b>Goaltending</b><span class="lds">every shot each goaltender faced, and what became of it — saved, scored on, or missed the net</span><span class="lon">A card per goaltender builds its save percentage as the replay runs.</span></span><span class="st" id="stGoalie">Off</span></button>
<button class="lrow" id="lyWhistle" data-pick="whistle" aria-pressed="false"><span class="lmk"><i class="k-wh"></i><i class="k-rl"></i></span><span class="ltx"><b>Stoppages</b><span class="lds">the rule that stopped play, and the dot it restarted on</span><span class="lon">The ring marks where play restarted, brightest at the most recent stoppage. The bar lights the line the rule names — for icing the centre line and the far goal line, for offside the blue line.</span></span><span class="st" id="stWhistle">Off</span></button>
<button class="lrow" id="lyBlock" data-pick="blocked" aria-pressed="false"><span class="lmk"><i class="k-blk"></i><i class="k-blkv"></i></span><span class="ltx"><b>Blocked shots</b><span class="lds">the attempts a body stopped before they reached the goalie</span><span class="lon">Blocked attempts keep their ring and every other mark dims, so the ones a body stopped stand out.</span></span><span class="st" id="stBlock">Off</span></button>
</div>
<div class="figpick sit"><span class="ll">Situations:</span>
<div class="grp" role="group" aria-label="Which situations are counted"><button class="lyr sbtn" data-s="all" aria-pressed="true">All situations</button><button class="lyr sbtn" data-s="even" aria-pressed="false">Even strength only</button></div>
<span class="fnote" id="nSit"></span></div>
<button id="work" aria-expanded="false">Show me the work</button>
<div class="work" id="workPanel" hidden></div>
<div class="hint">Tip: click any shot ringed in amber to see <b>why</b> it counts as a slot shot — with trails set to <b>keep every mark</b>, earlier ones stay clickable too.</div>
</details>
<p class="icenote" id="iceNote"></p>
<div class="whistlepanel" id="whistlePanel"></div>
<div class="blockpanel" id="blockPanel"></div>
<div class="goalies" id="goaliePanel"></div>
<div class="transport"><button class="play" id="play">▶ Play from start</button>
  <div class="grp" role="group" aria-label="Step through the events"><button class="spd stepb" id="back" aria-label="Previous event">◀ Prev event</button><button class="spd stepb" id="fwd" aria-label="Next event">Next event ▶</button></div>
  <div class="grp" role="group" aria-label="Replay speed"><button class="spd stepb" id="slower">&#9664; Slower</button><button class="spd stepb" id="faster">Faster &#9654;</button></div>
  <input class="scrub" id="scrub" type="range" min="-1" max="1" value="-1"></div>
<div class="pickrow" role="radiogroup" aria-label="Which metric is on the ice" id="pickrow"><span class="pklab">Watching</span><button class="pk" id="pkNone" data-l="none" role="radio" aria-checked="true">Just events</button><span class="pksep" aria-hidden="true"></span><button class="pk" id="pkCorsi" data-l="corsi" role="radio" aria-checked="false">Attempts</button><button class="pk" id="pkSlot" data-l="slot" role="radio" aria-checked="false">Slot</button><button class="pk" id="pkBlocked" data-l="blocked" role="radio" aria-checked="false">Blocked</button><button class="pk" id="pkGoalie" data-l="goaltending" role="radio" aria-checked="false">Goaltending</button><button class="pk" id="pkWhistle" data-l="whistle" role="radio" aria-checked="false">Stoppages</button></div>
<p class="lcap" id="lcap"></p>
<p class="verdict" id="verdict"></p>
<div class="newcomer nwhy2" id="newcomerWhy"></div>
<details class="zone zref"><summary class="zh">What the marks mean</summary>
<div class="areas">
<div class="area"><span class="lmk"><i class="k-slot"></i></span><span class="ltx"><b>The slot</b><span class="lds">The shaded area at each end — within 33 ft of the net, between the face-off dots.<span class="asay" id="slotSay"></span></span></span></div>
<div class="area"><span class="lmk"><i class="k-zone"></i></span><span class="ltx"><b>Either blue line</b><span class="lds">The shaded strip at each blue line, reaching out to the neutral-zone dots. No attacker may cross it ahead of the puck — that is offside, <span class="src">NHL Rule 83</span>.<span class="lim">We count nothing here. Holding the line leaves no event in the record, so the feed is silent about the thing that makes it matter.</span></span></span></div>
</div>
<div class="legend"><span><i class="k-h"></i><span class="kn">home shot</span></span><span><i class="k-a"></i><span class="kn">visitor shot — white, like the sweaters</span></span><span><i class="k-p"></i><span class="kn">puck — jumps between real events</span></span><span><i class="k-g"></i><i class="k-gv"></i><span class="kn">goal — either sweater</span></span><span><i class="k-blk"></i><i class="k-blkv"></i><span class="kn">blocked — ringed where the puck was <b>stopped</b></span></span></div>
</details>
<p class="disclose lkey lk-ends" id="endsKey"></p>
<p class="disclose lkey lk-unrec" id="unrecKey"></p>
<div class="whybk" id="whyBk"><div class="why" id="whyContent"></div></div>
<details class="zone zdisp"><summary class="zh">Trails<span class="zon" id="zTrailsOn"></span></summary>
<div class="figpick"><div class="grp" role="group" aria-label="How long marks stay on the ice"><button class="lyr tbtn" data-t="off" aria-pressed="true">Current moment</button><button class="lyr tbtn" data-t="all" aria-pressed="false">Keep every mark</button></div>
<span class="fnote" id="nTrails"></span></div>
</details>
<details class="zone znext"><summary class="zh">Other games</summary>
<nav class="nextup" id="nextup" aria-label="Where to go next"></nav>
</details>
</div></div>
<script>
__JS__</script>"""

# ⭐ THE RENDERER AND THE STYLESHEET ARE REAL FILES.
#
# They were 2,260 lines inside this module's template literal -- 1,748 of
# JavaScript and 512 of CSS, against 147 lines of actual Python. Inside `r"""..."""`
# they had no highlighting, no navigation, and no tooling of any kind; the only
# guard was `node --check` on the ASSEMBLED output, which sees a parse error and
# nothing else.
#
# This is the pattern src/lib/*.js has always used -- real files, inlined at build
# with `export ` stripped -- applied to the one part of the app that never got it.
# Nothing about the OUTPUT changes: the substitution happens here, once, so both
# `build()` and `build_shell()` see exactly the template they saw before, and
# `--verify` is what proves it byte for byte.
#
# The markers keep their own newline in the template, so each file starts at
# column zero and ends with the trailing newline every other file here has.
T = (T.replace("__CSS__", (ROOT / "src" / "app.css").read_text())
      .replace("__JS__", (ROOT / "src" / "app.js").read_text()))
# ⚠️ `str.replace` CANNOT FAIL -- it just does not happen, and a `__PLACEHOLDER__`
# has shipped from this file before. So the substitutions are asserted here,
# where they are made, rather than trusted: a leftover marker is a loud build
# error instead of a page that says `__SAYS__` to a visitor.
_left = re.findall(r"__[A-Z_]{3,}__", T)
assert not set(_left) - {"__LIB__", "__BOOT__", "__CSP__"}, \
    f"unsubstituted markers left in the template: {sorted(set(_left))}"


LIB = ["rink.js", "attribution.js", "layer.js", "strength.js", "box.js", "svgpen.js", "figures.js",
       "layers/corsi.js", "layers/goaltending.js", "layers/danger.js", "layers/whistle.js",
       "layers/blocked.js",
       # BEFORE sentence.js, which asks it which competition a game is.
       "competitions.js",
       "teams.js", "layers/tied.js", "sentence.js",
       # LAST, and it has to be: deeplink.js derives its URL vocabulary from the
       # layer objects themselves, so all FIVE must already exist in the bundle.
       "deeplink.js"]

def _lib():
    """Inline src/lib/*.js. They are real ES modules so `node --test` can import
    them; the browser gets them concatenated, with the export keyword stripped."""
    out = []
    for name in LIB:
        src = (ROOT / "src" / "lib" / name).read_text()
        # Strip ESM syntax: node imports these as modules for testing, the
        # browser gets them concatenated in dependency order.
        #
        # Regex, not startswith(). The old line-prefix test required column zero
        # and a trailing space, so an indented import -- what any formatter
        # produces -- sailed straight through into the bundle. Tolerates leading
        # whitespace and spans multi-line import blocks up to the semicolon.
        body = re.sub(r"^[ \t]*import(?=[\s{\'\"*])[^;]*?;[ \t]*$", "", src, flags=re.M)
        out.append(f"/* --- src/lib/{name} --- */\n" + body.replace("export ", ""))
    # THE ONE TABLE, INLINED RATHER THAN FETCHED. gameType -> competition is
    # reference data of ours, not archive data: it changes when a human names a
    # new competition, which is a commit, so it belongs in the deployed bytes.
    # `read-the-game.html` reaches nothing at all and still has to be able to say
    # what an all-star game is.
    out.append("/* --- data/competitions.json --- */\n"
               "const COMPETITIONS = " + P.competitions() + ";")
    return "\n".join(out)

# The origin the shell reads its games from. Pages serves CODE, R2 serves DATA,
# so this page ships with no game in it and the archive can grow without a deploy.
DATA_ORIGIN = "https://data.readthegame.co"

# THE SHELL'S ONLY EXTRA CODE. Everything else -- every reducer, every pixel --
# is the same `boot(G)` the inlined page runs, from the same template. A second
# renderer is where the wrong number hides, so there is exactly one.
#
# No game is baked in and "most recent" is never compiled: it is read from the
# catalog at load, the same rule the front page's freshness line follows. A
# featured game frozen at build time would be a lie by the next morning.
BOOTSTRAP = r"""
var ORIGIN=__ORIGIN__;
// ⭐ D9. THE APP DOES NOT RENDER UNTIL THERE IS A GAME TO RENDER.
//
// `game.html?game=<a refused game>` used to fetch a 404 and then draw the whole
// application anyway -- rink, transport, five layer buttons, and a scoreboard
// reading MIN 0 / BUF 0, which are the reference game's clubs and have nothing
// to do with the game the visitor asked for by id. The failure WAS stated, in
// `#gl`, at the bottom of the page.
//
// That is this project's recurring shape stated as sharply as it gets: THE
// FAILURE STATE RENDERED PLAUSIBLY. A clamped `at=` looked fine; the D8 gate
// compared a run against itself and went green; this drew a working page for a
// game that does not exist here. Each time the broken state was indistinguishable
// from the working one at a glance, which is exactly what let it survive.
//
// AND IT IS NOT A TYPO-ONLY PATH, which is why it is worth the code. A row can
// go from published to refused on a later derive -- the catalog replaces rows
// wholesale and the whole archive was re-derived seven times in five days -- so
// any `?game=` link shared before such a flip lands here, and the person who
// clicked it typed nothing.
var APP=document.getElementById('rg');
var MSG=document.getElementById('shellmsg');
if(APP)APP.hidden=true;
function say(m,bad){if(!MSG)return;
  var p=document.getElementById('shellsay');if(p)p.textContent=m;
  MSG.hidden=false;MSG.className='shellmsg'+(bad?' bad':'');}
// ⭐ A DEAD END IS STILL A DEAD END WHEN IT IS HONEST ABOUT BEING ONE.
//
// The first cut of this fix hid the app and put a true sentence at the top --
// and LOOKING AT IT is what showed the rest: the funnel that exists precisely
// so the game page is not a dead end (`#nextup`) lives INSIDE `#rg`, so hiding
// the app hid the way out with it. A visitor following a shared link to a game
// the archive no longer publishes got one sentence and a footer.
//
// The geometry said y=1222 -> y=56 and called it fixed. The screenshot said
// "you built a cul-de-sac". That is the whole argument for looking.
//
// EVERY DESTINATION EXISTS TODAY -- the rule `nextUp` is already held to. These
// are the site's standard ways in, the same set the chrome nav carries, because
// a second vocabulary for one destination is how a reader stops believing two
// links go to the same place.
function waysOut(){
  var n=document.getElementById('shellout');if(!n)return;
  n.innerHTML='<a href="/">Watch the most recent game</a>'
    +'<a href="/calendar.html">Browse by date</a>'
    +'<a href="/#teams">All teams</a>';}
// REVEAL BEFORE boot(), never after: an element with `hidden` has no box, so
// anything laid out inside it is laid out against nothing.
function reveal(){if(MSG)MSG.hidden=true;if(APP)APP.hidden=false;}

// ⭐ AND THE ORDER IS ENFORCED RATHER THAN DOCUMENTED (CHENG, 2026-08-24).
//
// The comment above was the whole guard, and swapping to `boot(g,rates);
// reveal();` passed all 673 tests. A fake DOM has no layout, so NO TEST CAN
// CATCH THIS BY MEASURING -- which is exactly why it would survive a refactor.
// Same shape as the `SX` scope guard: the rule was correct, the instrument was
// missing, and the rule was the only thing holding it.
//
// ⚠️ AND THE HONEST VERSION OF THE CLAIM IS NARROWER THAN THE COMMENT WAS.
// I wrote "boot measures and draws into this subtree", and then checked: the
// only layout reads in the renderer are three `void el.offsetWidth` reflow
// kicks, and the one reachable from a render (`flash`) fires only on
// `how==='play'`, which the initial `set(0,'')` is not. So TODAY this ordering
// has no observable symptom at all.
//
// THAT IS THE ARGUMENT FOR THE GUARD, NOT AGAINST IT. An invariant with no
// current symptom is the one that rots quietly: the day boot() grows a
// measurement -- a rink that sizes to its container, a label that wraps -- the
// bug arrives as a layout that is subtly wrong on the shell and right on the
// inlined page, which is the hardest kind here to see. A throw is cheap now and
// unaffordable to reconstruct later.
//
// IT LIVES HERE AND NOT INSIDE boot(). `boot` is the SHARED renderer -- a test
// asserts the two pages carry it byte for byte -- and `APP` exists only in the
// shell's bootstrap. Putting a shell concern in the renderer would either break
// that test or need a `typeof` dance to survive the inlined page.
function draw(g,rates){
  if(APP&&APP.hidden)throw new Error(
    'boot() ran inside a hidden subtree — reveal() must come first');
  boot(g,rates);}
function grab(u){return fetch(u).then(function(r){
  if(!r.ok)throw new Error(u.split('/').pop()+' — HTTP '+r.status);return r.json();});}
function pick(c){
  // Most recent VIEWABLE game. A refused game is listed in the catalog on
  // purpose, and landing on one would be an empty theatre.
  var v=c.games.filter(function(g){return g.v;});
  if(!v.length)throw new Error('the catalog lists no game we can show');
  v.sort(function(a,b){return a.d===b.d?a.id-b.id:(a.d<b.d?-1:1);});
  return v[v.length-1].id;
}
// THE SAME PARSER THE RENDERER USES. This was `location.search.match(/[?&]game=
// (\d+)/)` here and a preview regex twice more below and above -- three reads,
// two of them the same test spelled out again. src/lib/deeplink.js is why.
var LINK0=parse(location.search);
var want=LINK0.game;
say('Loading…');
(want?Promise.resolve(want):grab(ORIGIN+'/catalog.json').then(pick))
  .then(function(id){return grab(ORIGIN+'/extract/'+id+'.json');})
  // THE RATES ARE OPTIONAL AND MUST NEVER BLOCK THE GAME. measures.json is an
  // archive-level document written weekly; the game is what the visitor came
  // for. If it 404s, times out or arrives malformed, the page still plays and
  // the sentence says the comparison is missing -- which is the same branch a
  // preseason game takes, and is stated rather than left as a gap.
  .then(function(g){
    // A PREVIEW ASKS FOR NOTHING IT DOES NOT SHOW. The verdict card is hidden in
    // preview, and measures.json exists only to feed it, so fetching it would be
    // a request on a homepage for bytes nobody reads.
    if(LINK0.preview){reveal();draw(g,null);return null;}
    return grab(ORIGIN+'/measures.json')
      .catch(function(){return null;})
      .then(function(rates){reveal();draw(g,rates);});})
  .catch(function(e){
    // A true sentence about a broken situation beats a spinner that never ends.
    // AND THE APP GOES BACK AWAY. `reveal()` may already have run and `boot()`
    // then thrown, which leaves a half-drawn page under an error -- the same
    // plausible-looking wreck in a smaller costume.
    if(APP)APP.hidden=true;
    say('This game could not be loaded — '+e.message,true);
    waysOut();
    // ⭐ AND THEN ASK THE ARCHIVE WHAT IS ACTUALLY TRUE.
    //
    // "2023010001.json — HTTP 404" is a developer's sentence: it names a file
    // and a status code, and to a first-time visitor it says nothing about
    // hockey. The catalog already holds the answer -- every refused game keeps
    // its row and carries the gate that stopped it, which is Doctrine 9 and the
    // reason the calendar can render a refusal at all.
    //
    // SO THE HONEST SENTENCE WAS AVAILABLE AND WE WERE NOT ASKING FOR IT. One
    // request, ON THE ERROR PATH ONLY, upgrades the message from a symptom to a
    // fact: "the archive holds this game and our checks would not publish it"
    // is a different thing from "no such game", and a reader deserves to know
    // which one they hit.
    if(!want)return;
    grab(ORIGIN+'/catalog.json').then(function(c){
      var row=(c.games||[]).filter(function(g){return String(g.id)===String(want);})[0];
      if(!row)return say('The archive has no game with the id '+want+'.',true);
      if(row.v)return;   // it exists and publishes: the failure was the network
      say('This game is in the archive and we could not publish it — '
          +row.a+' at '+row.h+', '+row.d+'. Our '+(row.r||'validation')
          +' check stopped it, so there is nothing honest to replay.',true);
    }).catch(function(){});   // the plain message already stands
  });
"""


def _csp(html):
    """Delegates to page.csp — see there for why there is only one copy."""
    return P.csp(html, connect=DATA_ORIGIN)


TITLE = "Read the Game — watch a hockey game and see what the numbers are made of"
DESC = ("An NHL game replayed so a new fan can see what the numbers are made of. "
        "Nothing modelled, nothing invented.")


def build():
    """The reference game, inlined. Works with the network unplugged."""
    body = (T.replace("__LIB__", _lib())
             .replace("__BOOT__",
                      "boot(" + json.dumps(DATA, separators=(",", ":")) + ");"))
    return P.document(body, title=TITLE, description=DESC, chrome="full")


def build_shell():
    """The same app, any game, fetched at load.

    This is the page a link points at -- the shareable unit -- so it is also the
    page that must state plainly when it cannot load, rather than spinning.
    """
    body = (T.replace("__LIB__", _lib())
             .replace("__BOOT__", BOOTSTRAP.replace(
                 "__ORIGIN__", json.dumps(DATA_ORIGIN))))
    # The inlined page reaches nothing and needs no policy beyond the deploy
    # grep; this one legitimately fetches, so the promise has to be enforced by
    # the browser rather than asserted by us.
    #
    # STAMPED LAST, AND THE WRAPPER CANNOT DISTURB IT: the hashes cover the bytes
    # of the <script> and <style>, which live in the body and are untouched by
    # adding a head around them.
    html = P.document(body, title=TITLE, description=DESC,
                      url="https://readthegame.co/game", chrome="full",
                      head='<meta http-equiv="Content-Security-Policy" content="__CSP__">')
    return html.replace("__CSP__", _csp(html))

def main():
    html = build()
    shell = build_shell()

    # Parse the bundle before anyone can ship it. Writing a temp file and
    # printing the path is not a gate -- that is how an indented import reached
    # a published artifact with every test green.
    # Parse BOTH before either can ship. They share a template, so a syntax
    # error in the shared body would otherwise be caught on one page and
    # published on the other.
    check_script(re.search(r"<script>(.*)</script>", html, re.S).group(1), "main")
    check_script(re.search(r"<script>(.*)</script>", shell, re.S).group(1), "shell")

    if "--verify" in sys.argv:
        current = OUT.read_text()
        same = current == html and SHELL.read_text() == shell
        h = lambda s: hashlib.sha256(s.encode()).hexdigest()[:16]
        print(f"built  {len(html.encode()):>7} bytes  sha {h(html)}")
        print(f"onDisk {len(current.encode()):>7} bytes  sha {h(current)}")
        print("BYTE-IDENTICAL" if same else "DIFFERS -- gate FAILED")
        if not same:
            for i, (a, b) in enumerate(zip(current, html)):
                if a != b:
                    print(f"  first difference at byte {i}: "
                          f"{current[i-40:i+40]!r} != {html[i-40:i+40]!r}")
                    break
        return 0 if same else 1

    OUT.write_text(html)
    SHELL.write_text(shell)
    print(f"wrote {OUT} {len(html.encode())} bytes; script parses OK")
    print(f"wrote {SHELL} {len(shell.encode())} bytes; fetches its game, CSP stamped")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
