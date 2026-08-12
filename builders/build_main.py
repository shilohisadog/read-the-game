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
#rg{--ice:#eef4f8;--bg:#f4f7fa;--ink:#0f1a23;--muted:#5b6d7a;--edge:#ccd8e0;--away:#5b6d7a;--home:#3a4a56;--red:#c8102e;--blue:#3a5a9c;--ok:#12885a;--flag:#d9662b;--hd:#e0932a;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh;padding:clamp(16px,3.5vw,36px) clamp(12px,4vw,22px);line-height:1.5}
#rg .wrap{max-width:900px;margin:0 auto}
#rg .eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
#rg h1{font-size:clamp(1.7rem,3.8vw,2.4rem);letter-spacing:-.025em;font-weight:800;margin:0 0 10px;text-wrap:balance}
#rg .lede{font-size:1.02rem;color:var(--muted);margin:0 0 18px;max-width:62ch}#rg .lede b{color:var(--ink);font-weight:600}
#rg .board{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;background:#fff;border:1px solid var(--edge);border-radius:13px;padding:12px 18px;box-shadow:0 5px 18px rgba(16,32,45,.07);margin-bottom:12px}
#rg .tm{display:flex;flex-direction:column;align-items:center}#rg .tm .ab{font-weight:800;letter-spacing:.05em;font-size:.9rem}
#rg .tm .ab{padding:2px 8px;border-radius:5px}#rg .tm.a .ab{background:var(--away);color:var(--away-ink)}#rg .tm.h .ab{background:var(--home);color:var(--home-ink)}
#rg .sc{font-family:ui-monospace,Menlo,monospace;font-size:2.2rem;font-weight:700;font-variant-numeric:tabular-nums;line-height:1}
#rg .mid{min-width:150px}#rg .gs{text-align:center;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px}#rg .gs .cl{color:var(--ink);font-family:ui-monospace,Menlo,monospace}
#rg .bar{display:flex;height:8px;border-radius:99px;overflow:hidden;background:var(--edge)}#rg .bar span{transition:width .4s ease}#rg .ba{background:#fff;box-shadow:inset 0 0 0 2px var(--away)}#rg .bh{background:var(--home)}
#rg .pct{display:flex;justify-content:space-between;font-size:.78rem;margin-top:5px;font-family:ui-monospace,Menlo,monospace;font-weight:600}
#rg .rinkbox{position:relative;background:var(--ice);border:1px solid var(--edge);border-radius:15px;padding:10px;box-shadow:0 6px 22px rgba(16,32,45,.08)}
#rg svg{display:block;width:100%;height:auto}
#rg .boards{fill:var(--ice);stroke:var(--edge);stroke-width:1.1}
#rg .ln{fill:none;stroke-linecap:round}#rg .ln.red{stroke:var(--red);stroke-width:.7;opacity:.42}#rg .ln.blue{stroke:var(--blue);stroke-width:.9;opacity:.42}#rg .ln.thick{stroke-width:1.1;opacity:.52}
#rg .rdot{fill:var(--red);opacity:.5}
#rg .crease{opacity:.5}#rg .netlab{font-size:3.1px;font-weight:700;letter-spacing:.4px;text-anchor:middle}
#rg .netflash{animation:nf 1.3s ease}@keyframes nf{0%,100%{opacity:0}25%{opacity:.85}}
#rg .ev{transform-box:fill-box;transform-origin:center}
/* THE SWEATER CONVENTION. Home teams wear their colours, visitors wear white,
   and the marks follow the sweaters. It exists because COLOUR ALONE CANNOT CARRY
   IDENTITY HERE: five matchups in the archive have byte-identical primaries --
   BOS/NSH, DET/NJD, EDM/WPG, FLA/WSH, TOR/VAN, 45 games -- and 264 games are
   within a deltaE of 10, which is two indistinguishable dots on one rink. A white
   fill is a second channel that never collides, matches what the viewer sees on a
   broadcast, and does not depend on colour vision. */
#rg .att.h{fill:var(--home)}#rg .att.a{fill:#fff;stroke:var(--away);stroke-width:.7}#rg .att{opacity:.85}
#rg .goal.h{fill:var(--home);stroke:#fff}#rg .goal.a{fill:#fff;stroke:var(--away)}#rg .goal{stroke-width:.9}
#rg .excl{fill:var(--muted);opacity:.2}
#rg .ring{fill:none;pointer-events:none}
#rg .ring.blk{stroke:var(--flag);stroke-width:.7}
#rg .ring.hd{stroke:var(--hd);stroke-width:.8}
#rg .core{pointer-events:none}#rg .core.h{fill:#fff}#rg .core.a{fill:var(--away)}
#rg .hdring{fill:none;stroke:var(--hd);stroke-width:.5;opacity:.6}
#rg .pop{animation:pop .34s cubic-bezier(.2,1.3,.4,1)}@keyframes pop{0%{transform:scale(2.6);opacity:.3}100%{transform:scale(1);opacity:1}}
#rg .flare{animation:flare .7s ease-out}@keyframes flare{0%{transform:scale(3.6);opacity:.2}55%{opacity:1}100%{transform:scale(1)}}
#rg .puck{fill:#0e1216;stroke:#fff;stroke-width:.55}#rg .puck.jump{animation:pj .3s ease}@keyframes pj{0%{transform:scale(2)}100%{transform:scale(1)}}
#rg .shotline{stroke:var(--ink);stroke-width:.7;stroke-dasharray:2.2 2;opacity:.7;animation:sl 1s ease forwards}@keyframes sl{to{opacity:0}}
#rg .caption{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;background:rgba(15,26,35,.94);color:#fff;padding:7px 15px;border-radius:99px;font-size:.86rem;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;max-width:92%}
#rg .caption.on{animation:cap 2.2s ease}@keyframes cap{0%{opacity:0;transform:translateX(-50%) translateY(6px)}12%{opacity:1;transform:translateX(-50%) translateY(0)}82%{opacity:1}100%{opacity:0}}
#rg .caption .tag{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:.72rem;padding:2px 7px;border-radius:5px}
#rg .caption .num{opacity:.65;font-family:ui-monospace,Menlo,monospace;margin-right:3px}
#rg .counters{display:flex;justify-content:space-between;padding:2px 6px;margin-top:8px}
#rg .cc{display:flex;align-items:baseline;gap:7px}#rg .cc .n{font-family:ui-monospace,Menlo,monospace;font-size:1.5rem;font-weight:700}#rg .cc.a .n{color:var(--away-text)}#rg .cc.h .n{color:var(--home-text)}
#rg .cc .mode{display:block;font-size:.6rem;letter-spacing:.06em;color:var(--flag);font-weight:700}
#rg .cc .lb{font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
#rg .bump{animation:bump .32s ease}@keyframes bump{40%{transform:scale(1.35);color:var(--flag)}}
#rg .transport{display:flex;align-items:center;gap:10px;margin:14px 0 4px;flex-wrap:wrap}
#rg button{font:inherit;font-size:.83rem;font-weight:600;border-radius:8px;border:1px solid var(--edge);background:#fff;color:var(--ink);padding:9px 14px;cursor:pointer}
#rg .play{background:var(--ink);color:#fff;border-color:var(--ink)}
#rg .spd{padding:7px 11px}#rg .spd[aria-pressed="true"]{border-color:var(--ink);background:#eef2f5}
#rg .scrub{flex:1;accent-color:var(--ink);cursor:pointer;min-width:120px}
#rg .legend{display:flex;flex-wrap:wrap;gap:7px 18px;font-size:.78rem;color:var(--muted);margin:6px 2px}
#rg .legend i{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:-1px}
#rg .k-a{background:#fff;box-shadow:0 0 0 1.5px var(--away)}#rg .k-h{background:var(--home)}#rg .k-hd{background:#fff;box-shadow:0 0 0 1.5px var(--hd)}#rg .k-blk{background:var(--home);box-shadow:0 0 0 1.5px var(--flag)}#rg .k-p{background:#0e1216}
#rg .work{background:#fff;border:1px solid var(--edge);border-radius:13px;padding:18px;margin-top:14px;box-shadow:0 5px 18px rgba(16,32,45,.06)}
#rg .work h2{margin:0 0 10px;font-size:1.1rem}#rg .wg{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
#rg .wc{background:#f2f7fa;border:1px solid var(--edge);border-radius:10px;padding:13px}#rg .wc h3{margin:0 0 6px;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);display:flex;justify-content:space-between}#rg .wc h3 .n{font-family:ui-monospace,Menlo,monospace;font-size:1.2rem;color:var(--ink);font-weight:700}#rg .wc.flag{border-color:#e6b98f}#rg .wc.flag h3 .n{color:var(--flag)}#rg .wc p{margin:0;font-size:.87rem}
#rg .wfoot{margin-top:13px;font-size:.8rem;color:var(--muted);border-top:1px solid var(--edge);padding-top:11px}#rg .wfoot em{font-style:normal;color:var(--ink)}
#rg .foot{font-size:.78rem;color:var(--muted);margin-top:16px;text-align:center}
#rg text{font-family:ui-monospace,Menlo,monospace}
@media(prefers-reduced-motion:reduce){#rg *{animation:none!important;transition:none!important}}

#rg .ev.clickable{cursor:pointer}
#rg .hint{font-size:.76rem;color:#b07d17;margin:3px 2px 0;font-weight:600}
#rg .caption{cursor:default}
#rg .whybk{position:fixed;inset:0;background:rgba(10,18,26,.55);display:none;align-items:center;justify-content:center;z-index:60;padding:16px}
#rg .whybk.on{display:flex}
#rg .why{background:#fff;border-radius:15px;max-width:430px;width:100%;box-shadow:0 24px 70px rgba(0,0,0,.4);overflow:hidden;max-height:92vh;overflow-y:auto}
#rg .whyhd{padding:15px 18px;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px}
#rg .whyhd .t{font-weight:800;font-size:1.08rem}#rg .whyhd .s{font-size:.75rem;opacity:.92;font-family:ui-monospace,Menlo,monospace}
#rg .whyclose{background:rgba(0,0,0,.14);border:0;color:inherit;border-radius:7px;padding:6px 10px;cursor:pointer;font-weight:700;line-height:1}
#rg .whybody{padding:16px 18px}
#rg .whydiag{background:var(--ice);border:1px solid var(--edge);border-radius:10px;padding:8px;margin-bottom:14px}
#rg .whydiag svg{width:100%;height:auto;display:block}
#rg .factor{display:flex;align-items:baseline;gap:12px;padding:9px 0;border-bottom:1px solid var(--edge)}
#rg .factor .fv{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:1.1rem;min-width:52px}
#rg .factor .fl{font-size:.86rem;color:var(--muted)}#rg .factor .fl b{color:var(--ink)}
#rg .chk{color:var(--ok);font-weight:800}
#rg .whyrule{background:#f2f7fa;border:1px solid var(--edge);border-radius:9px;padding:12px 13px;font-size:.83rem;margin-top:13px;line-height:1.5}#rg .whyrule b{color:var(--ink)}

#rg .plabel{font-size:3.5px;font-weight:700;fill:var(--ink);stroke:#fff;stroke-width:1px;paint-order:stroke;font-family:system-ui,sans-serif}
#rg .glab{font-size:4.8px;font-weight:800;stroke:#fff;stroke-width:1.2px;paint-order:stroke;font-family:system-ui,sans-serif}
#rg .plabsub{font-size:2.8px;fill:var(--muted);stroke:#fff;stroke-width:.8px;paint-order:stroke;font-family:system-ui,sans-serif}
#rg .plabgrp{animation:plfade .28s ease}@keyframes plfade{0%{opacity:0}100%{opacity:1}}

#rg .cbar,#rg .counters,#rg #work{display:none}
#rg.corsi .cbar{display:block}#rg.corsi .counters{display:flex}#rg.corsi #work{display:inline-block}
#rg .figpick{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 2px 0}
#rg .sbtn[aria-pressed="true"],#rg .fbtn[aria-pressed="true"]{border-style:solid;color:var(--ink);border-color:var(--ink);background:#eef2f5}
#rg .fnote{font-size:.76rem;color:var(--muted);flex:1;min-width:220px}
#rg .fig{transform-box:fill-box;transform-origin:center}
#rg .layers{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 2px 4px;padding-top:12px;border-top:1px dashed var(--edge)}
#rg .layers .ll{font-size:.8rem;color:var(--muted);font-weight:700}
#rg .lyr{font:inherit;font-size:.83rem;font-weight:600;border-radius:8px;border:1px dashed #b7c6d0;background:#fff;color:var(--muted);padding:8px 13px;cursor:pointer}
#rg .lyr[aria-pressed="true"]{border-style:solid;color:var(--ink);border-color:var(--ink);background:#eef2f5}

#rg .wh{fill:none;stroke:var(--ink);stroke-width:.5;stroke-dasharray:1.5 1.3;opacity:.5}
#rg .wh.now{stroke:var(--flag);stroke-width:.9;stroke-dasharray:none;opacity:.95}
#rg .whn{font-size:3.2px;font-weight:700;fill:var(--ink);text-anchor:middle;opacity:.7}
#rg .whistlepanel{display:none}
#rg.whistle .whistlepanel{display:block;background:#fff;border:1px solid var(--edge);border-radius:11px;padding:13px 15px;margin-top:10px;box-shadow:0 4px 14px rgba(16,32,45,.06)}
#rg .whsay{margin:0;font-size:.9rem;line-height:1.5}
#rg .whsay .rsn{font-weight:800;text-transform:capitalize}
#rg .whsay .at{font-family:ui-monospace,Menlo,monospace;color:var(--muted);font-size:.78rem}
#rg .whsay .none{color:var(--flag)}
#rg .whmeta{font-size:.74rem;color:var(--muted);margin-top:7px}
#rg .whmeta .src{font-family:ui-monospace,Menlo,monospace}
#rg .whtally{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:10px;padding-top:9px;border-top:1px solid var(--edge);font-size:.76rem;color:var(--muted);text-transform:capitalize}
#rg .whtally b{color:var(--ink);font-family:ui-monospace,Menlo,monospace}
#rg .goalies{display:none;gap:10px;margin-top:10px}
#rg.goalie .goalies{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#rg .gcard{background:#fff;border:1px solid var(--edge);border-radius:11px;padding:12px 15px;box-shadow:0 4px 14px rgba(16,32,45,.06)}
#rg .gcard .gname{font-weight:800;font-size:.98rem}
#rg .gcard .gname .sub{color:var(--muted);font-weight:600;font-size:.68rem}
#rg .gcard .gsv{font-family:ui-monospace,Menlo,monospace;font-size:1.75rem;font-weight:700;line-height:1.1}
#rg .gcard .gline{font-size:.78rem;color:var(--muted);margin-top:2px}#rg .gcard .lim{color:var(--flag)}
@media(max-width:520px){#rg.goalie .goalies{grid-template-columns:1fr}}
</style>
<div id="rg"><div class="wrap">
<p class="eyebrow">Learn to read hockey · watch first, add metrics after</p>
<h1>Watch the game</h1>
<p class="lede">Press play and just <b>watch</b> — each play narrated in plain language, goals called with the <b>scorer and assists</b>, the pace easing for the big moments. That’s the base view. When you want to understand <em>why</em> a team is on top, <b>add a metric layer</b> below — control, high-danger chances, goaltending, or why play stopped. Nothing is invented; every layer shows its work.</p>
<div class="board">
  <div class="tm a"><span class="ab" id="aAb">MIN</span><span class="sc" id="aSc">0</span></div>
  <div class="mid"><div class="gs"><span id="per">Pre-game</span> · <span class="cl" id="clk">20:00</span></div>
    <div class="cbar"><div class="bar"><span class="ba" id="ba" style="width:50%"></span><span class="bh" id="bh" style="width:50%"></span></div>
    <div class="pct"><span id="pa" style="color:var(--away-text)">50%</span><span style="color:var(--muted);font-size:.66rem;letter-spacing:.1em">CONTROL</span><span id="ph" style="color:var(--home-text)">50%</span></div></div>
  </div>
  <div class="tm h"><span class="ab" id="hAb">BUF</span><span class="sc" id="hSc">0</span></div>
</div>
<div class="rinkbox"><svg viewBox="0 0 200 85"><g id="rink"></g><g id="lines"></g><g id="whistles"></g><g id="events"></g><g id="puck"></g><g id="labels"></g></svg>
  <div class="caption" id="caption"></div>
  <div class="counters"><div class="cc a"><span class="n" id="cA">0</span><span class="lb">MIN attempts<span class="mode" id="mA">ALL SITUATIONS</span></span></div><div class="cc h"><span class="lb">BUF attempts<span class="mode" id="mH">ALL SITUATIONS</span></span><span class="n" id="cH">0</span></div></div>
</div>
<div class="whistlepanel" id="whistlePanel"></div>
<div class="goalies" id="goaliePanel"></div>
<div class="transport"><button class="play" id="play">▶ Play from start</button>
  <button class="spd" id="sp0" aria-pressed="false">🐢 Slower</button><button class="spd" id="sp1" aria-pressed="true">Teaching</button><button class="spd" id="sp2" aria-pressed="false">Faster</button><button class="spd" id="lbl" aria-pressed="true">💬 Explain plays</button>
  <input class="scrub" id="scrub" type="range" min="0" max="1" value="0"><button id="work" aria-expanded="false">Show me the work</button></div>
<div class="legend"><span><i class="k-h"></i>home shot</span><span><i class="k-a"></i>visitor shot — white, like the sweaters</span><span><i class="k-p"></i>puck (jumps between real events)</span><span>🚨 goal</span><span style="color:var(--muted)">metric-specific marks appear when you add a layer</span></div>
<div class="layers"><span class="ll">Add a metric layer:</span><button class="lyr" id="lyCorsi" aria-pressed="false">＋ Control (Corsi)</button><button class="lyr" id="lyHd" aria-pressed="false">＋ High-danger</button><button class="lyr" id="lyGoalie" aria-pressed="false">＋ Goaltending</button><button class="lyr" id="lyWhistle" aria-pressed="false">＋ Why play stopped</button></div>
<div class="figpick"><span class="ll">Trails:</span>
<button class="lyr tbtn" data-t="off" aria-pressed="true">Current moment</button>
<button class="lyr tbtn" data-t="all" aria-pressed="false">Keep every mark</button>
<span class="fnote">Every attempt used to stay on the ice for the rest of the game, so by
the third period the surface is a shot chart nobody asked for. <b>Current moment</b>
shows what is happening now; <b>keep every mark</b> is that older behaviour, on purpose.</span></div>
<div class="figpick"><span class="ll">Situations:</span>
<button class="lyr sbtn" data-s="all" aria-pressed="true">All situations</button>
<button class="lyr sbtn" data-s="even" aria-pressed="false">Even strength only</button>
<span class="fnote">Power plays and an empty net are still hockey — but they aren't
<b>even</b> hockey. Switch and watch which attempts drop out, and why.</span></div>
<div class="figpick"><span class="ll">Players:</span>
<button class="lyr fbtn" data-f="mascot" aria-pressed="true">Mascot</button>
<button class="lyr fbtn" data-f="tabletop" aria-pressed="false">Tabletop</button>
<span class="fnote">Same shots, same outcomes, same math — only the drawing changes. <b>Tabletop</b> is the rod-hockey player you grew up with.</span></div>
<div class="hint">Tip: click a ⚡ high-danger chance (amber ring) on the ice to see <b>why</b> it qualified — with trails set to <b>keep every mark</b>, earlier ones stay clickable too.</div>
<div class="work" id="workPanel" hidden></div>
<div class="whybk" id="whyBk"><div class="why" id="whyContent"></div></div>
<div class="foot" id="gl">—</div>
</div></div>
<script>
function boot(G){
const R=G.roster, HID=G.teams.home.id, AID=G.teams.away.id, HAB=G.teams.home.ab, AAB=G.teams.away.ab;
const SKIP=new Set(['stoppage','period-start','period-end','game-end','delayed-penalty']);
const EV=[],EVI=[];
G.events.forEach((e,n)=>{if(!SKIP.has(e.type)){EV.push(e);EVI.push(n);}});
// The timeline is the playable events; the LEDGER is the whole game. Layers get
// every event so the 51 non-plays are excluded with reasons instead of vanishing.
const upto=k=>k<0?[]:G.events.slice(0,EVI[k]+1);
__LIB__
const ATT=ATTEMPT_TYPES;
const SX=x=>x+100, SY=y=>42.5-y;
// Rink is 200 units long for 200 feet, so one unit is one foot: a ~6 ft player
// is ~6 units. Goals get a little more presence.
// Only one figure is on the ice at a time, so it can afford presence and detail.
const FIG_SZ=9, FIG_BIG=11.5;
// The rink is 200 units wide and renders around 860px, so a unit is ~4.3px.
// This only drives the figure's drop-detail-when-small threshold, never its
// geometry, so an approximation is honest here -- but without it a 9-unit
// figure is judged as "9 pixels" and loses its face on a screen where there is
// plenty of room for one.
const UNIT_PX=4.3;
// THE TEAMS' OWN COLOURS, and this is the whole defect being fixed. These were
// literals -- Minnesota green and Buffalo gold, from the one game that used to be
// compiled into this page -- used as "the away colour" and "the home colour" for
// every game in the archive. Washington was green on this page and red on the
// front page, because on this page EVERY visitor was green. Buffalo was gold here
// and navy there, and neither page was reading the club's actual colour.
const AWAYCOL=colourOf(AAB), HOMECOL=colourOf(HAB);
(function paint(){const el=document.getElementById('rg');if(!el)return;
 // Two properties per team on purpose. The CHIP gets the true colour with ink
 // chosen for contrast against it; TEXT on white gets the colour only when it can
 // be read there, because six primaries cannot (Boston gold is 1.73:1).
 el.style.setProperty('--away',AWAYCOL);          el.style.setProperty('--home',HOMECOL);
 el.style.setProperty('--away-ink',inkOn(AWAYCOL));el.style.setProperty('--home-ink',inkOn(HOMECOL));
 el.style.setProperty('--away-text',readableInk(AWAYCOL));
 el.style.setProperty('--home-text',readableInk(HOMECOL));})();
let T=0, REDUCED=matchMedia('(prefers-reduced-motion:reduce)').matches;
let figStyle=(()=>{try{return localStorage.getItem('rtg.fig')||'mascot'}catch(e){return 'mascot'}})();
if(!FIG[figStyle])figStyle='mascot';
let finalA=0,finalH=0; for(const e of EV){if(e.type==='goal')(e.own===HID?finalH++:finalA++);}
function attemptTeam(e){return corsiTeam(e,R);}  // renamed: `corsi` is the layer object
function tk(e){const c=attemptTeam(e);return c===AID?'a':c===HID?'h':'x';}
function shotDir(e){const t=shootingTeam(e,R);return t==null?null:attackDirection(t,HID);}
let evenOnly=false;
// TRAILS. Every attempt used to persist for the rest of the game, which makes a
// permanent shot chart the base view shows by default -- and Doctrine §6 says the
// base view is just watch the game, every metric opt-in. `off` is the current
// moment; `all` is that older behaviour, chosen. There is deliberately no middle
// setting: it would need an N -- last ten attempts? last thirty seconds? -- and
// no N has a source in the data.
let trails='off';
// The mode is part of the CONTEXT, so every layer moves together. Filtering
// Corsi while leaving shots faced on all situations would put two scopes on one
// screen with no way for a viewer to reconcile them.
const CTX={roster:R,homeId:HID,awayId:AID,homeAb:HAB,awayAb:AAB,
           get evenOnly(){return evenOnly;}};
const MODE=()=>evenOnly?'even strength':'all situations';
function isHD(e){return isHighDangerEvent(e,CTX);}
function lens(k){return corsi.reduce(upto(k),CTX);}
const $=id=>document.getElementById(id);
function drawRink(){const P=[];P.push('<rect class="boards" x="1" y="1" width="198" height="83" rx="27"/>');
 for(const g of[-89,89])P.push(`<line class="ln red" x1="${SX(g)}" y1="3" x2="${SX(g)}" y2="82"/>`);
 for(const b of[-25,25])P.push(`<line class="ln blue" x1="${SX(b)}" y1="1" x2="${SX(b)}" y2="84"/>`);
 P.push('<line class="ln red thick" x1="100" y1="1" x2="100" y2="84"/><circle class="ln blue" cx="100" cy="42.5" r="15"/>');
 for(const zx of[-69,69])for(const zy of[-22,22])P.push(`<circle class="ln red" cx="${SX(zx)}" cy="${SY(zy)}" r="15"/>`);
 P.push('<circle class="rdot" cx="100" cy="42.5" r="1.1"/>');
 // nets: BUF(home) defends LEFT(-89), MIN(away) defends RIGHT(+89)
 P.push(`<rect id="netL" class="crease netflash" x="${SX(-89)}" y="37" width="4" height="11" rx="1" fill="var(--home)" opacity="0"/>`);
 P.push(`<rect id="netR" class="crease netflash" x="${SX(89)-4}" y="37" width="4" height="11" rx="1" fill="#fff" stroke="var(--away)" stroke-width=".6" opacity="0"/>`);
 P.push(`<rect class="crease" x="${SX(-89)}" y="38" width="3" height="9" rx="1" fill="var(--home)"/>`);
 P.push(`<rect class="crease" x="${SX(89)-3}" y="38" width="3" height="9" rx="1" fill="#fff" stroke="var(--away)" stroke-width=".5"/>`);
 P.push(`<text class="netlab" x="${SX(-80)}" y="21" fill="${readableInk(HOMECOL)}">◄ ${HAB} net</text>`);
 P.push(`<text class="netlab" x="${SX(80)}" y="21" fill="${readableInk(AWAYCOL)}">${AAB} net ►</text>`);
 $('rink').innerHTML=P.join('');}
function flashNet(scorer){ // scorer scores INTO opponent's net
 const el=scorer===AID?$('netR'):$('netL'); // MIN scores into MIN's...no: MIN attacks left(-89)=BUF net
 const net=scorer===AID?$('netL'):$('netR'); net.style.opacity='';net.classList.remove('netflash');void net.offsetWidth;net.classList.add('netflash');}
let prevA=0,prevH=0;
function render(i,newest){
 // `evs` is the PLAYABLE prefix, used to draw the marks on the timeline.
 // `lens(i)` reduces the FULL stream up to the same moment. Two different
 // slices on purpose: the ice shows plays, the ledger accounts for everything.
 const evs=EV.slice(0,i+1),L=lens(i),cur=EV[i];
 const parts=[];
 for(let k=0;k<evs.length;k++){const e=evs[k];if(e.x==null)continue;
   if(trails==='off'&&k!==i)continue;
   const hd=hdOn&&isHD(e);
   // A BLOCKED SHOT IS AN ATTEMPT, ANNOTATED, and the annotation is a separate
   // ring rather than the mark's own stroke. THE STROKE NOW CARRIES TEAM
   // IDENTITY: drawn the old way a visitor's blocked shot is a white dot with an
   // orange ring and no team colour anywhere on it, which on the ice reads as a
   // third club. Seen in a real game (SJS at CHI) and invisible to every test
   // here, because none of them can see a pixel.
   let cls=e.type==='goal'?'goal':ATT.has(e.type)?'att':'excl';
   if(hd)cls+=' clickable';
   const r=e.type==='goal'?2.7:hd?2.2:ATT.has(e.type)?1.7:1;
   const anim=(k===i&&newest)?(e.type==='goal'?' flare':' pop'):'';
   if(hd&&k===i&&newest)parts.push(`<circle class="hdring" cx="${SX(e.x).toFixed(1)}" cy="${SY(e.y).toFixed(1)}" r="4.5"/>`);
   const cx=SX(e.x), cy=SY(e.y), title=`<title>${e.rem} ${e.type}</title>`;
   // Annotations ride OUTSIDE the mark, so the mark keeps saying whose it is.
   // `data-i` on the ring as well as the mark: it says WHICH event this annotates,
   // so the pairing is in the DOM rather than inferred from two identical
   // coordinates -- and the current attempt is drawn as a figure, which has no
   // coordinates to infer from.
   if(e.type==='blocked-shot')parts.push(`<circle class="ring blk" data-i="${k}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r+1).toFixed(1)}"/>`);
   if(hd&&e.type!=='goal')parts.push(`<circle class="ring hd" data-i="${k}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r+2).toFixed(1)}"/>`);
   if(ATT.has(e.type)&&k===i){
     // Only the CURRENT attempt is a player. Once the shot has happened its
     // location goes back to being a dot, so the eye is drawn to what is
     // happening now rather than to a crowd of past figures — and one figure
     // per frame instead of 135 is roughly an eighth of the markup.
     //
     // Its feet stand on the real shot coordinate and its pose is the real
     // outcome: arms up for a goal, shooting otherwise. Non-attempts are never
     // figures, because a figure means "someone shot from here" and drawing one
     // for a faceoff would be a claim we cannot make (Doctrine §5).
     const pen=new SvgPen('cur');
     FIG[figStyle](pen,cx,cy,e.type==='goal'?FIG_BIG:FIG_SZ,tk(e)==='a'?AWAYCOL:HOMECOL,
                   e.type==='goal'?'goal':'save',
                   {t:T,motion:!REDUCED,glow:false,px:(e.type==='goal'?FIG_BIG:FIG_SZ)*UNIT_PX});
     parts.push(pen.toSvg(`class="ev fig ${cls} ${tk(e)}${anim}" data-i="${k}"`).replace('</g>',title+'</g>'));
   } else {
     parts.push(`<circle class="ev ${cls} ${tk(e)}${anim}" data-i="${k}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}">${title}</circle>`);
     // A GOAL IS A BULLSEYE, not a slightly larger dot. Under the sweater
     // convention a visitor's goal and a visitor's attempt were both hollow
     // rings separated only by radius -- and the goal is the one mark on this
     // rink that must never be mistaken for anything else.
     if(e.type==='goal')parts.push(`<circle class="core ${tk(e)}" data-i="${k}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.15"/>`);
   }}
 $('events').innerHTML=parts.join('');
 if(whistleOn)drawWhistles(whistle.reduce(upto(i),CTX));
 else{$('whistles').innerHTML='';$('whistlePanel').innerHTML='';}
 let lh='';
 if(cur&&(cur.type==='shot-on-goal'||cur.type==='goal')&&cur.x!=null){const netx=(cur.own===HID)?89:-89;
   lh=`<line class="shotline" x1="${SX(cur.x).toFixed(1)}" y1="${SY(cur.y).toFixed(1)}" x2="${SX(netx)}" y2="42.5"/>`;}
 $('lines').innerHTML=lh;
 if(cur&&cur.x!=null)$('puck').innerHTML=`<circle class="puck${newest?' jump':''}" cx="${SX(cur.x).toFixed(1)}" cy="${SY(cur.y).toFixed(1)}" r="1.5"/>`;
 drawLabel(cur);
 $('aSc').textContent=L.as;$('hSc').textContent=L.hs;
 const a=L.t[AID],h=L.t[HID],tot=a+h||1,pa=Math.round(100*a/tot);
 $('ba').style.width=pa+'%';$('bh').style.width=(100-pa)+'%';$('pa').textContent=pa+'%';$('ph').textContent=(100-pa)+'%';
 $('cA').textContent=a;$('cH').textContent=h;
 if(newest){if(a>prevA)flash('cA');if(h>prevH)flash('cH');
   if(cur&&cur.type==='goal'){flashNet(cur.own);caption(cur,'goal');}
   else if(cur&&hdOn&&isHD(cur)){lastHD=i;caption(cur,'hd');}}
 prevA=a;prevH=h;
 $('per').textContent=cur?'Period '+cur.per:'Pre-game';$('clk').textContent=cur?cur.rem:'20:00';
 if(goalieOn){const gs=goalieStats(i);$('goaliePanel').innerHTML=G.goalies.map(id=>{const p=R[id];if(!p)return '';const tid=p.tid,col=readableInk(tid===AID?AWAYCOL:HOMECOL),ab=tid===AID?AAB:HAB;const st=gs[id]||{f:0,s:0,gl:0,hf:0,hs:0};
 // A FRACTION, ALWAYS, AND THE THRESHOLD IS GONE. This used to print .943 and
 // switch to "18/20" below twenty shots faced -- and twenty was a number we
 // chose, the same defect this project refuses everywhere else. A fraction
 // carries its own denominator, so it needs no cutoff to be honest at: 33 of 35
 // and 18 of 18 both say exactly what they are, and 1.000 does not.
 //
 // The limit is stated on EVERY card for the same reason. Showing it only when
 // the number was small was selective honesty (Doctrine §9) -- it made a
 // 35-shot game look like a rate you could compare, which is the belief the
 // whole site exists to correct. One game is one game.
 const faced=st.f?`${st.s} of ${st.f}`:'—';
 return `<div class="gcard"><div class="gname" style="color:${col}">${p.nm} <span class="sub">${ab} · #${p.n}</span></div><div class="gsv">${faced}</div><div class="gline">${st.s} saves · ${st.gl} goals · ${st.f} shots faced (${MODE()})${st.hf?` · high-danger ${st.hs} of ${st.hf}`:''}<br><span class="lim">one game — what happened, not how unusual it was</span></div></div>`;}).join('');}
 if(workOpen)renderWork(L,cur);
}
function flash(id){const el=$(id);el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
function caption(e,kind){const c=$('caption');const tid=e.own;const ab=tid===AID?AAB:HAB;const col=tid===AID?AWAYCOL:HOMECOL;
 const p=R[e.actor];const who=p?`<span class="num">#${p.n}</span>${p.nm}`:ab;
 const label=kind==='goal'?'🚨 GOAL':'⚡ High-danger chance';
 c.innerHTML=`<span class="tag" style="background:${col};color:${inkOn(col)}">${ab}</span><b>${label}</b> · ${who}${kind==='hd'?' from the slot':''}`;
 c.classList.remove('on');void c.offsetWidth;c.classList.add('on');}
let workOpen=false;
function renderWork(L,cur){const a=L.t[AID],h=L.t[HID],tot=a+h||1,pa=Math.round(100*a/tot);
 // Rendered from the ledger itself, not from a hand-written list. Every reason
 // below was written by the layer that excluded the event, so a new layer gets
 // this panel for free and a changed rule cannot leave stale copy behind.
 const byWhy=summarise(L.excluded), rows=Object.entries(byWhy).sort((x,y)=>y[1]-x[1])
   .map(([why,n])=>`<div><b>${n}×</b> ${why}</div>`).join('');
 const sTotal=L.surprising.length, sWhy=sTotal?L.surprising[0].why:'';
 $('workPanel').innerHTML=`<h2>How “control” is computed <span style="color:var(--muted);font-weight:400">(${MODE()}${cur?', through P'+cur.per+' '+cur.rem:', pre-game'})</span></h2>
 <div class="wg"><div class="wc"><h3>Counted <span class="n">${L.counted.length}</span></h3><p>Every attempt on goal — shots that hit the net, missed it, or were blocked. All credited to the shooter.</p></div>
 <div class="wc flag"><h3>Counted, surprisingly <span class="n">${sTotal}</span></h3><p>${sWhy||'—'}</p></div>
 <div class="wc"><h3>Not counted <span class="n">${L.excluded.length}</span></h3><p style="font-size:.82rem;line-height:1.6">${rows||'—'}</p></div></div>
 <p class="wfoot"><em>${a} ${AAB} / ${h} ${HAB} → ${pa}% / ${100-pa}%.</em> ${L.counted.length} counted + ${L.excluded.length} not counted = <b>${L.counted.length+L.excluded.length}</b> events, which is every event in the game so far. Nothing is dropped quietly.${evenOnly?' <b>Even strength only</b> — the power-play and empty-net attempts are in the not-counted list above, with the situation that removed each one.':''}</p>`;}
let i=EV.length-1,playing=false,timer=null,mult=2;
$('scrub').max=EV.length-1;
function set(v,newest){i=Math.max(0,Math.min(EV.length-1,v));$('scrub').value=i;render(i,newest);}
function dwell(e){let d=650;if(e.type==='goal')d=3000;else if(isHD(e))d=1700;else if(e.type==='shot-on-goal')d=850;return d*mult;}
function step(){if(i>=EV.length-1){stop();return;}set(i+1,true);timer=setTimeout(step,dwell(EV[i]));}
function play(){if(i>=EV.length-1){prevA=0;prevH=0;set(0,true);}playing=true;$('play').textContent='⏸ Pause';clearTimeout(timer);timer=setTimeout(step,dwell(EV[i]));}
function stop(){playing=false;$('play').textContent=i>=EV.length-1?'▶ Replay from start':'▶ Play';clearTimeout(timer);}
$('play').onclick=()=>playing?stop():play();
$('scrub').oninput=e=>{stop();set(+e.target.value,false);};
function setSpeed(m,id){mult=m;['sp0','sp1','sp2'].forEach(x=>$(x).setAttribute('aria-pressed',x===id));}
$('sp0').onclick=()=>setSpeed(2.9,'sp0');
$('sp1').onclick=()=>setSpeed(2,'sp1');
$('sp2').onclick=()=>setSpeed(1.1,'sp2');
$('work').onclick=()=>{workOpen=!workOpen;$('workPanel').hidden=!workOpen;$('work').setAttribute('aria-expanded',workOpen);$('work').textContent=workOpen?'Hide the work':'Show me the work';if(workOpen)render(i,false);};
$('aAb').textContent=AAB;$('hAb').textContent=HAB;
// Hand-formatted from the ISO date, never Date.parse: '2023-11-10' is UTC
// midnight and a western timezone would render it as the 9th.
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const GD=(G.game&&G.game.date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
const WHEN=GD?`${+GD[3]} ${MON[+GD[2]-1]} ${GD[1]}`:'';
$('gl').textContent=`${AAB} at ${HAB}${WHEN?' · '+WHEN:''} · final ${AAB} ${finalA}–${finalH} ${HAB}`;
document.querySelectorAll('#rg .cc.a .lb').forEach(n=>n.childNodes[0].nodeValue=AAB+' attempts');
document.querySelectorAll('#rg .cc.h .lb').forEach(n=>n.childNodes[0].nodeValue=HAB+' attempts');

const HX=x=>11+Math.abs(x), HY=y=>42.5-y; let lastHD=null;
function showWhy(idx){const e=EV[idx];if(e==null||e.x==null)return;
 const _d=shotDir(e)||1, dLine=89-e.x*_d, dist=Math.hypot(dLine,e.y), angle=Math.atan2(Math.abs(e.y),dLine)*180/Math.PI;
 const inSlot=Math.abs(e.y)<=22, tid=e.own, ab=tid===AID?AAB:HAB, col=tid===AID?AWAYCOL:HOMECOL, p=R[e.actor], isGoal=e.type==='goal';
 const diag=`<svg viewBox="0 0 100 85"><rect x="1" y="1" width="98" height="83" rx="14" fill="#fff" stroke="var(--edge)"/>
   <polygon points="63,20.5 96,38 96,47 63,64.5" fill="var(--hd)" opacity=".3"/><text x="70" y="43.5" font-size="3.4" fill="#b07d17" text-anchor="middle">slot</text>
   <rect x="90" y="37" width="6" height="11" rx="1.5" fill="${col}" opacity=".55"/><line x1="96" y1="29" x2="96" y2="56" stroke="var(--red)" stroke-width="1" opacity=".7"/>
   <line x1="36" y1="1" x2="36" y2="84" stroke="var(--blue)" stroke-width=".8" opacity=".35"/>
   <line x1="${HX(e.x).toFixed(1)}" y1="${HY(e.y).toFixed(1)}" x2="95" y2="42.5" stroke="var(--ink)" stroke-dasharray="2 1.5" stroke-width=".7"/>
   <circle cx="${HX(e.x).toFixed(1)}" cy="${HY(e.y).toFixed(1)}" r="2.8" fill="${col}" stroke="#fff" stroke-width=".7"/>
   <text x="${Math.min(HX(e.x)+4,78).toFixed(1)}" y="${(HY(e.y)-2.5).toFixed(1)}" font-size="4.2" fill="var(--ink)" font-weight="700">${Math.round(dist)} ft</text></svg>`;
 $('whyContent').innerHTML=`<div class="whyhd" style="background:${col};color:${inkOn(col)}"><div><div class="t">${isGoal?'🚨 A high-danger GOAL':'⚡ Why this was high-danger'}</div>
   <div class="s">${p?'#'+p.n+' '+p.nm:ab} · ${ab} · P${e.per} ${e.rem} · ${e.type.replace(/-/g,' ')}</div></div><button class="whyclose" onclick="hideWhy()">✕</button></div>
  <div class="whybody"><div class="whydiag">${diag}</div>
   <div class="factor"><span class="fv">${Math.round(dist)} ft</span><span class="fl">Distance to the net — <b>close</b>. Our rule: ≤ 33 ft. <span class="chk">✓</span></span></div>
   <div class="factor"><span class="fv">${Math.round(angle)}°</span><span class="fl">Angle off straight-on — ${angle<22?'<b>a clean look</b> at the net':'a slot-area angle'}. Lower = more net to shoot at.</span></div>
   <div class="factor" style="border-bottom:0"><span class="fv">${inSlot?'Slot':'Wide'}</span><span class="fl">Lateral position — ${inSlot?'<b>in the slot</b> (within the faceoff dots) <span class="chk">✓</span>':'outside the slot'}</span></div>
   <div class="whyrule"><b>The rule, and you can check it:</b> a shot is <b>high-danger</b> when it's <b>≤ 33 ft from the net</b> AND <b>central</b> (within ±22 ft of the middle — the slot). Both true here. This is a <b>transparent geometric rule</b> — a teaching stand-in for "dangerous," not a trained expected-goals model. Measure it yourself on the diagram.</div></div>`;
 $('whyBk').classList.add('on');}
function hideWhy(){$('whyBk').classList.remove('on');}
$('events').addEventListener('click',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.i!=null){const k=+t.dataset.i;if(hdOn&&isHD(EV[k]))showWhy(k);}});
$('caption').addEventListener('click',()=>{if(lastHD!=null)showWhy(lastHD);});
$('whyBk').addEventListener('click',e=>{if(e.target.id==='whyBk')hideWhy();});


const LAB={faceoff:['Faceoff','puck dropped'],hit:['Hit','physical play — not a shot'],giveaway:['Giveaway','lost the puck'],takeaway:['Takeaway','won the puck back'],'blocked-shot':['Shot blocked','still an attempt — for the shooter'],'missed-shot':['Missed shot','wide/high — still an attempt'],'shot-on-goal':['Shot on goal','a shot attempt'],goal:['GOAL','the attempt that scored'],penalty:['Penalty','off to the box']};
let labelsOn=true;
function drawLabel(e){const g=$('labels');if(!labelsOn||!e||e.x==null){g.innerHTML='';return;}
 const lx=SX(e.x),ly=SY(e.y);
 if(e.type==='goal'){const tid=e.own,col=tid===AID?AWAYCOL:HOMECOL,ab=tid===AID?AAB:HAB,p=R[e.actor];
   const as=[R[e.a1],R[e.a2]].filter(Boolean).map(x=>x.nm).join(', ');
   let tx=lx>100?lx-5:lx+5,anc=lx>100?'end':'start',ty=Math.max(15,ly-6);
   g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${col}" stroke-width=".4" opacity=".55"/><text class="glab" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}" fill="${col}">🚨 GOAL — ${p?p.nm:ab}</text><text class="plabsub" x="${tx.toFixed(1)}" y="${(ty+4).toFixed(1)}" text-anchor="${anc}">${as?'assists: '+as:'unassisted'}</text></g>`;return;}
 if(!LAB[e.type]){g.innerHTML='';return;}
 const info=LAB[e.type];let tx=lx+4,anc='start';if(lx>150){tx=lx-4;anc='end';}let ty=ly-4.5;if(ty<11)ty=ly+8;
 // THE TEAM, IN WORDS. The figure on the ice is one colour and two clubs can
 // wear the same one, so the label says whose play it was rather than leaving
 // the answer to a hue. Costs nothing and works without colour vision.
 const lab=e.own===AID?AAB:e.own===HID?HAB:null;
 const hd=(hdOn&&isHD(e))?' · high-danger':'';
 g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty-1).toFixed(1)}" stroke="var(--ink)" stroke-width=".3" opacity=".35"/><text class="plabel" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}">${lab?lab+" · ":""}${info[0]}${hd}</text><text class="plabsub" x="${tx.toFixed(1)}" y="${(ty+3.7).toFixed(1)}" text-anchor="${anc}">${info[1]}</text></g>`;}
$('lbl').addEventListener('click',()=>{labelsOn=!labelsOn;$('lbl').setAttribute('aria-pressed',labelsOn);$('lbl').style.opacity=labelsOn?'1':'.5';drawLabel(EV[i]);});

// THE WHISTLE LAYER, DRAWN. What from the stoppage, where from the faceoff that
// restarts play -- and the sentence is the point, so it lives in a panel that
// stays put rather than in the caption, which animates away in two seconds.
//
// `marks` and `latest` are the layer's own, not this page's: a whistle mark on
// the wrong dot is the kind of wrong that looks completely right, so the grouping
// rule is tested in test/whistle.test.js rather than eyeballed here.
const RSN=r=>r?String(r).replace(/-/g,' '):'unrecorded';
const ESC=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function drawWhistles(W){
 const g=[];
 for(const m of marks(W,{trails:trails})){const cx=SX(m.x),cy=SY(m.y);
  g.push(`<circle class="wh${m.now?' now':''}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.4"><title>play restarted here — ${ESC(m.reasons.map(RSN).join(', '))}</title></circle>`);
  // A COUNT, BECAUSE THE MARKS STACK. Nine faceoff dots hold every restart in the
  // game, so eight icings at one dot draw as one circle and the ice would be
  // showing a number it is not saying.
  if(m.n>1)g.push(`<text class="whn" x="${cx.toFixed(1)}" y="${(cy+1.2).toFixed(1)}">${m.n}</text>`);}
 $('whistles').innerHTML=g.join('');
 const w=latest(W);
 if(!w){$('whistlePanel').innerHTML='<p class="whsay">No whistle yet — play has not stopped in what you have watched so far.</p>';return;}
 // An unfamiliar reason is carried verbatim and named as unexplained. The draft
 // dropped it; a guessed sentence would be worse than dropping it.
 const say=w.say?ESC(w.say)
   :`<span class="none">The feed recorded this stoppage as “${ESC(w.rsn||'no reason given')}”, which is one we have no sentence for. We are not guessing at one.</span>`;
 const where=w.placed?'Play restarted at the ringed faceoff dot.'
   :`Not shown on the ice — ${ESC(w.unplaced)}.`;
 const n=W.tally[w.rsn||'unrecorded'];
 const tal=Object.entries(W.tally).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1))
   .map(([r,c])=>`<span>${ESC(RSN(r))} <b>${c}</b></span>`).join('');
 $('whistlePanel').innerHTML=
   `<p class="whsay"><span class="rsn">${ESC(RSN(w.rsn))}</span> <span class="at">· P${w.per} ${ESC(w.rem)}</span><br>${say}</p>`
  +`<div class="whmeta">${where}${w.rsn2?' Also recorded: '+ESC(RSN(w.rsn2))+'.':''} · `
  +`${n===1?'the first this game':n+' so far this game'}${w.from?' · <span class="src">'+ESC(w.from)+'</span>':''}</div>`
  +`<div class="whtally">${tal}</div>`;}

let corsiOn=false,hdOn=false,goalieOn=false,whistleOn=false;
function setCorsi(){document.getElementById('rg').classList.toggle('corsi',corsiOn);$('lyCorsi').setAttribute('aria-pressed',corsiOn);$('lyCorsi').textContent=(corsiOn?'✓ ':'＋ ')+'Control (Corsi)';if(!corsiOn&&workOpen){workOpen=false;$('workPanel').hidden=true;$('work').setAttribute('aria-expanded',false);$('work').textContent='Show me the work';}}
function setHd(){$('lyHd').setAttribute('aria-pressed',hdOn);$('lyHd').textContent=(hdOn?'✓ ':'＋ ')+'High-danger';render(i,false);}
$('lyCorsi').addEventListener('click',()=>{corsiOn=!corsiOn;setCorsi();});
// One code path owns the mode label, so the markup cannot drift from the state.
// The static HTML carries a default only so the page reads correctly before JS.
function syncStrength(){
 const v=evenOnly?'even':'all';
 document.querySelectorAll('#rg .sbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===v));
 const lbl=MODE().toUpperCase();$('mA').textContent=lbl;$('mH').textContent=lbl;}
function setStrength(v){evenOnly=(v==='even');syncStrength();render(i,false);}
document.querySelectorAll('#rg .sbtn').forEach(b=>b.addEventListener('click',()=>setStrength(b.dataset.s)));
syncStrength();
function syncTrails(){document.querySelectorAll('#rg .tbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===trails));}
document.querySelectorAll('#rg .tbtn').forEach(b=>b.addEventListener('click',()=>{
 trails=b.dataset.t;syncTrails();render(i,false);}));
syncTrails();
function syncFig(){document.querySelectorAll('#rg .fbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===figStyle));}
document.querySelectorAll('#rg .fbtn').forEach(b=>b.addEventListener('click',()=>{
 figStyle=b.dataset.f;try{localStorage.setItem('rtg.fig',figStyle)}catch(e){}syncFig();render(i,false);}));
syncFig();
$('lyHd').addEventListener('click',()=>{hdOn=!hdOn;setHd();});
function goalieStats(k){return goaltending.reduce(upto(k),CTX).g;}
function setGoalie(){document.getElementById('rg').classList.toggle('goalie',goalieOn);$('lyGoalie').setAttribute('aria-pressed',goalieOn);$('lyGoalie').textContent=(goalieOn?'✓ ':'＋ ')+'Goaltending';render(i,false);}
$('lyGoalie').addEventListener('click',()=>{goalieOn=!goalieOn;setGoalie();});
function setWhistle(){document.getElementById('rg').classList.toggle('whistle',whistleOn);$('lyWhistle').setAttribute('aria-pressed',whistleOn);$('lyWhistle').textContent=(whistleOn?'✓ ':'＋ ')+'Why play stopped';render(i,false);}
$('lyWhistle').addEventListener('click',()=>{whistleOn=!whistleOn;setWhistle();});
drawRink();set(EV.length-1,false);
}
__BOOT__
</script>"""

LIB = ["rink.js", "attribution.js", "layer.js", "strength.js", "svgpen.js", "figures.js",
       "layers/corsi.js", "layers/goaltending.js", "layers/danger.js", "layers/whistle.js",
       "teams.js"]

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
function say(m){var el=document.getElementById('gl');if(el)el.textContent=m;}
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
var want=(location.search.match(/[?&]game=(\d+)/)||[])[1];
say('Loading…');
(want?Promise.resolve(want):grab(ORIGIN+'/catalog.json').then(pick))
  .then(function(id){return grab(ORIGIN+'/extract/'+id+'.json');})
  .then(function(g){boot(g);})
  .catch(function(e){
    // A true sentence about a broken situation beats a spinner that never ends.
    say('This game could not be loaded — '+e.message);
  });
"""


def _csp(html):
    """Hash-pinned, and stamped LAST so it covers the bytes actually shipped.

    A hash-pinned policy with a stale hash is a blank page that passes every
    grep we could write, so the digests are computed from the finished document.
    """
    def h(pattern):
        m = re.search(pattern, html, re.S)
        return "'sha256-" + base64.b64encode(
            hashlib.sha256(m.group(1).encode()).digest()).decode() + "'"
    return "; ".join([
        "default-src 'none'",
        f"script-src {h(r'<script>(.*?)</script>')}",
        f"style-src {h(r'<style>(.*?)</style>')}",
        f"connect-src 'self' {DATA_ORIGIN}",
        "base-uri 'none'", "form-action 'none'",
    ])


TITLE = "Read the Game — watch a hockey game and see what the numbers are made of"
DESC = ("An NHL game replayed so a new fan can see what the numbers are made of. "
        "Nothing modelled, nothing invented.")


def build():
    """The reference game, inlined. Works with the network unplugged."""
    body = (T.replace("__LIB__", _lib())
             .replace("__BOOT__",
                      "boot(" + json.dumps(DATA, separators=(",", ":")) + ");"))
    return P.document(body, title=TITLE, description=DESC)


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
                      url="https://readthegame.co/game",
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
