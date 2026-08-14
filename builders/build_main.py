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
#rg .mid{min-width:150px}#rg .gs{text-align:center;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px}#rg .gs .cl{color:var(--ink);font-family:ui-monospace,Menlo,monospace}#rg .gs .clw{font-style:normal;font-size:.62rem;letter-spacing:.08em}
#rg .bar{display:flex;height:8px;border-radius:99px;overflow:hidden;background:var(--edge)}#rg .bar span{transition:width .4s ease}#rg .ba{background:#fff;box-shadow:inset 0 0 0 2px var(--away);width:50%}#rg .bh{background:var(--home);width:50%}
#rg .pct{display:flex;justify-content:space-between;align-items:center;font-size:.9rem;margin-top:5px;font-family:ui-monospace,Menlo,monospace;font-weight:700}
#rg .pct #pa{color:var(--away-text)}#rg .pct #ph{color:var(--home-text)}
#rg .plab{display:flex;flex-direction:column;align-items:center;font-size:.66rem;letter-spacing:.1em;color:var(--muted);font-weight:600;line-height:1.35}
/* The deep-link notice. `:empty` rather than a `hidden` attribute, so the one
   place that writes the sentence is the only place that controls whether it
   shows -- a second switch is a second thing to get out of step. */
#rg .atnote:empty{display:none}
#rg .atnote{margin:0 0 10px;padding:9px 13px;border-radius:9px;border:1px solid var(--edge);background:#fbf6ee;color:var(--ink);font-size:.88rem}
#rg .rinkbox{position:relative;background:var(--ice);border:1px solid var(--edge);border-radius:15px;padding:10px;box-shadow:0 6px 22px rgba(16,32,45,.08)}
#rg svg{display:block;width:100%;height:auto}
#rg .boards{fill:var(--ice);stroke:var(--edge);stroke-width:1.1}
#rg .ln{fill:none;stroke-linecap:round}#rg .ln.red{stroke:var(--red);stroke-width:.7;opacity:.42}#rg .ln.blue{stroke:var(--blue);stroke-width:.9;opacity:.42}#rg .ln.thick{stroke-width:1.1;opacity:.52}
/* PREVIEW: THE FIVE-SECOND TASTE, AND IT IS THE REAL RENDERER.
   The homepage had no motion at all, on a site whose product is animation, so a
   visitor had to click through to discover the thing existed (CHENG). This is
   that taste -- and it is an iframe of THIS page rather than a recorded video:
   no binary asset to go stale, no media-src in the policy, nothing to re-record
   when the rink changes, and every mark still traces to a recorded event. It is
   not a trailer for the product, it is the product.
   ONE RENDERER, still. Preview is a class on #rg and a play loop; there is no
   second drawing path and nothing here is reimplemented. */
#rg.preview .lede,#rg.preview h1,#rg.preview .transport,#rg.preview .layers,
#rg.preview .figpick,#rg.preview .hint,#rg.preview .ends,#rg.preview .whistlepanel,
#rg.preview .verdict,#rg.preview .nextup,#rg.preview .foot,#rg.preview .work,
#rg.preview .legend,#rg.preview .goalies,
#rg.preview .counters{display:none!important}
/* THE PREVIEW FITS ITSELF TO WHATEVER BOX IT IS GIVEN.
   Kevin: "the bottom 1/3 of the rink is clipped off within the frame."
   The homepage sizes the frame by aspect-ratio -- 200x108, the rink's 200x85
   plus room for the scoreboard -- and that arithmetic cannot hold, because the
   rink scales with WIDTH while the scoreboard's height is set in points. At a
   narrow column the fixed chrome eats a larger share of a smaller box, the rink
   is pushed past the bottom edge, and `scrolling=no` crops it. A ratio measured
   at one width is a constant that drifts with the viewport -- the same mistake
   as the preview's pace, in a second dimension.
   So the page stops depending on being given the right height. The wrap is a
   flex column, the rink box takes whatever is left, and the SVG fits inside it:
   a viewBox with the default preserveAspectRatio letterboxes rather than crops,
   so THE WHOLE RINK IS ALWAYS DRAWN and only its size varies. The frame's ratio
   now decides how much empty ice sits beside it, never whether a goal line is
   on screen. */
#rg.preview{padding:0;min-height:0;height:100vh;overflow:hidden}
#rg.preview .wrap{max-width:none;padding:0;height:100%;
 display:flex;flex-direction:column;min-height:0}
#rg.preview .board{margin:0 0 4px;flex:0 0 auto}
#rg.preview .atnote{flex:0 0 auto}
#rg.preview .rinkbox{flex:1 1 auto;min-height:0;padding:6px;display:flex}
#rg.preview .rinkbox svg{width:100%;height:100%}
/* AND THE SCOREBOARD HAS TO SHRINK WITH THE FRAME, which is the half the flex
   column could not fix on its own. Measured in a real browser at two widths:

     frame 856x462 (desktop)   board 87px tall   19% of the box
     frame 287x155 (phone)     board 87px tall   56% of the box

   The board is the SAME HEIGHT at both, because its type is set in rem and rem
   does not care how wide the frame is. So the rink dutifully shrank into what
   was left -- 96px of a 155px box -- and the phone got a sliver of ice under a
   full-size scoreboard. `min-width:150px` on the middle column overflowed the
   grid at the same time, which is why the second club's badge was cut off the
   right edge.

   `min(Xvw, <today>)` rather than a plain vw: the desktop rendering is already
   right and must not move, so every value is capped at what it is now and only
   ever gets smaller. vw inside the frame IS the frame's width, so the chrome
   now scales on exactly the axis the rink does.

   The eyebrow goes entirely. It is the page's tagline, it wrapped to two lines
   at 360, and a taste does not need to be introduced twice. */
#rg.preview .eyebrow{display:none!important}
/* AND THE SECOND LINE GOES IN PREVIEW TOO -- everywhere, not just the six that
   lost it. `.plabsub` is 2.8 SVG units, which is about 6 real pixels once the
   rink is scaled into a phone-sized frame: legible in the replay, where a
   novice is reading, and unreadable ink in a five-second loop nobody is reading
   at all. Kevin's argument for cutting the six applies with more force here,
   because in preview it applies to all nine. The three that carry a counting
   claim keep it on the GAME page, which is where the claim can be read. */
#rg.preview .plabsub{display:none}
#rg.preview .board{padding:min(1.5vw,12px) min(2.4vw,18px);gap:min(2vw,14px);
 border-radius:min(1.8vw,13px);box-shadow:none}
#rg.preview .mid{min-width:0}
#rg.preview .tm .ab{font-size:min(3.4vw,.9rem);padding:min(.4vw,2px) min(1.4vw,8px);
 border-radius:min(.9vw,5px)}
#rg.preview .sc{font-size:min(7.4vw,2.2rem)}
#rg.preview .gs{font-size:min(2.9vw,.78rem);margin-bottom:min(1vw,6px)}
#rg.preview .gs .clw{font-size:min(2.3vw,.62rem)}
#rg .nextup{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin:16px 0 4px;padding-top:15px;border-top:1px solid var(--edge)}
#rg .nextup a{display:inline-block;padding:9px 14px;border-radius:9px;border:1px solid var(--edge);background:#fff;color:var(--ink);text-decoration:none;font-weight:650;font-size:.9rem}
#rg .nextup a:hover,#rg .nextup a:focus{border-color:var(--ink)}
#rg .nextup a .sw{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:7px;vertical-align:baseline}
/* WHICH TEAM, NOT WHICH HEX. Four places used to interpolate the club's colour
   into a `style` attribute -- and this page's own CSP refuses every one of them,
   because a hash can cover a stylesheet block and there is no such thing as a
   hash for an attribute. So the markup says only WHICH SIDE, and colour arrives
   through the custom properties `paint()` already sets on #rg at boot. That is
   the same seam the sweater convention uses for the marks on the ice, and it
   deletes four copies of the away/home ternary at the same time.

   `--away` for a chip with `--away-ink` on it; `--away-text` for type on white,
   which is a DIFFERENT colour for the six clubs whose primary cannot be read
   there. The distinction is `paint()`'s and is documented at its definition. */
#rg .nextup a .sw.a{background:var(--away)}#rg .nextup a .sw.h{background:var(--home)}
#rg .fdot{fill:var(--red);opacity:.55}#rg .fdot.ctr{fill:var(--blue)}
#rg .npl{font-size:3.4px;font-weight:700;text-anchor:middle;fill:var(--ink)}
#rg .nplsub{font-size:2.9px;text-anchor:middle;fill:var(--ink);opacity:.72}
#rg .crease{fill:#cfe0f2;stroke:var(--blue);stroke-width:.4;opacity:.55}
#rg .mesh{stroke-width:.8;opacity:.9}#rg .strand{stroke-width:.35;opacity:.5}#rg .post{stroke-width:1.1;stroke-linecap:round}
#rg .gkbody,#rg .gkhead{stroke-width:.4}#rg .gkstick{stroke-width:.55;stroke-linecap:round}
#rg .gk{transform-box:fill-box;transform-origin:center;animation:gkin .35s ease}
@keyframes gkin{0%{opacity:0}100%{opacity:1}}
#rg .flashpath.netflash{animation:nf 1.3s ease}@keyframes nf{0%,100%{opacity:0}25%{opacity:.85}}
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
#rg .rulel{stroke:var(--flag);stroke-width:1.5;opacity:.75;pointer-events:none}
#rg .rulel.dim{opacity:.35;stroke-dasharray:3 2}
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
#rg .caption .tag.a{background:var(--away);color:var(--away-ink)}#rg .caption .tag.h{background:var(--home);color:var(--home-ink)}
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
#rg .k-a{background:#fff;box-shadow:0 0 0 1.5px var(--away)}#rg .k-h{background:var(--home)}#rg .k-hd{background:#fff;box-shadow:0 0 0 1.5px var(--hd)}#rg .k-blk{background:var(--home);box-shadow:0 0 0 1.5px var(--flag)}#rg .k-p{background:#0e1216}#rg .k-g{background:radial-gradient(circle,#fff 0 2.5px,var(--home) 2.5px)}#rg .k-gv{background:radial-gradient(circle,var(--away) 0 2.5px,#fff 2.5px);box-shadow:0 0 0 1.5px var(--away);margin-left:-3px}
#rg .work{background:#fff;border:1px solid var(--edge);border-radius:13px;padding:18px;margin-top:14px;box-shadow:0 5px 18px rgba(16,32,45,.06)}
#rg .work h2{margin:0 0 10px;font-size:1.1rem}#rg .work h2 .wsub{color:var(--muted);font-weight:400}
#rg .wc .wexc{font-size:.82rem;line-height:1.6}#rg .wg{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
#rg .wc{background:#f2f7fa;border:1px solid var(--edge);border-radius:10px;padding:13px}#rg .wc h3{margin:0 0 6px;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);display:flex;justify-content:space-between}#rg .wc h3 .n{font-family:ui-monospace,Menlo,monospace;font-size:1.2rem;color:var(--ink);font-weight:700}#rg .wc.flag{border-color:#e6b98f}#rg .wc.flag h3 .n{color:var(--flag)}#rg .wc p{margin:0;font-size:.87rem}
#rg .wfoot{margin-top:13px;font-size:.8rem;color:var(--muted);border-top:1px solid var(--edge);padding-top:11px}#rg .wfoot em{font-style:normal;color:var(--ink)}
#rg .foot{font-size:.78rem;color:var(--muted);margin-top:16px;text-align:center}
/* THE GAME SUMMARY, GIVEN A SURFACE (Kevin liked it and could not find it).
   It was a small centred paragraph in muted type, sitting between the ledger and
   the footer -- the one sentence on the page that says what the game WAS, styled
   like a caption. It is a card now, and it stays at the BOTTOM: it names the
   result, and the same afternoon we stopped the page opening on the final
   whistle would be a poor time to move the outcome above the rink. */
#rg .verdict{max-width:56ch;margin:22px auto 0;background:#fff;border:1px solid var(--edge);
 border-radius:13px;padding:17px 20px 18px;box-shadow:0 4px 16px rgba(16,32,45,.06);
 font-size:.95rem;line-height:1.55}
#rg .verdict .vk{display:block;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;
 color:var(--muted);font-weight:700;margin-bottom:8px}
#rg .verdict .lead{color:var(--ink);font-size:1.02rem}#rg .verdict b{font-weight:700}
#rg .verdict .rate{display:block;margin-top:9px;font-size:.85rem;color:var(--muted)}
/* THE REFERENCE CLASS, DRAWN. "Of the games where a team led that count by 12 or
   more, it lost 243 of 708" is a true sentence a reader has to do arithmetic on
   to feel (Kevin asked for a visual, not more words). One dot on a 0-100 track
   with 50% marked -- the same idiom the homepage uses for the three base rates,
   so the site has ONE way of showing a rate rather than two.
   The two conditions carry over: no connecting line (there is nothing to connect
   -- it is a single point), and the fraction stays printed beside it. */
#rg .vscale{margin:11px 0 2px}
#rg .vtrack{position:relative;height:14px;border-radius:7px;background:#e6edf3}
#rg .vhalf{position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:var(--muted);opacity:.55}
#rg .vpt{position:absolute;top:50%;width:13px;height:13px;border-radius:50%;transform:translate(-50%,-50%);
 border:2px solid #fff;box-shadow:0 1px 3px rgba(16,32,45,.3);background:#1f7a4d}
#rg .vpt.hi{background:#b3341f}
/* Same order of sacrifice as the homepage: these end labels wrap and shrink
   before anything else, and the card's fraction lives in the SENTENCE above the
   track, where it is prose and wraps like prose. */
#rg .vends{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 10px;
 font-size:.7rem;color:var(--muted);margin-top:4px}
#rg .verdict .rate{overflow-wrap:break-word}
#rg text{font-family:ui-monospace,Menlo,monospace}
@media(prefers-reduced-motion:reduce){#rg *{animation:none!important;transition:none!important}}

#rg .ev.clickable{cursor:pointer}
#rg .hint{font-size:.76rem;color:#b07d17;margin:3px 2px 0;font-weight:600}
#rg .ends{font-size:.76rem;color:var(--muted);margin:6px 2px 0}
#rg .caption{cursor:default}
#rg .whybk{position:fixed;inset:0;background:rgba(10,18,26,.55);display:none;align-items:center;justify-content:center;z-index:60;padding:16px}
#rg .whybk.on{display:flex}
#rg .why{background:#fff;border-radius:15px;max-width:430px;width:100%;box-shadow:0 24px 70px rgba(0,0,0,.4);overflow:hidden;max-height:92vh;overflow-y:auto}
#rg .whyhd{padding:15px 18px;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px}
#rg .whyhd.a{background:var(--away);color:var(--away-ink)}#rg .whyhd.h{background:var(--home);color:var(--home-ink)}
#rg .whyhd .t{font-weight:800;font-size:1.08rem}#rg .whyhd .s{font-size:.75rem;opacity:.92;font-family:ui-monospace,Menlo,monospace}
#rg .whyclose{background:rgba(0,0,0,.14);border:0;color:inherit;border-radius:7px;padding:6px 10px;cursor:pointer;font-weight:700;line-height:1}
#rg .whybody{padding:16px 18px}
#rg .whydiag{background:var(--ice);border:1px solid var(--edge);border-radius:10px;padding:8px;margin-bottom:14px}
#rg .whydiag svg{width:100%;height:auto;display:block}
#rg .factor{display:flex;align-items:baseline;gap:12px;padding:9px 0;border-bottom:1px solid var(--edge)}
#rg .factor .fv{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:1.1rem;min-width:52px}
#rg .factor .fl{font-size:.86rem;color:var(--muted)}#rg .factor .fl b{color:var(--ink)}
/* The last of the three, which has the rule below it and needs no line. Named
   rather than `:last-of-type`, because the sibling after it is a <div> too. */
#rg .factor.last{border-bottom:0}
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
#rg .gcard .gname.a{color:var(--away-text)}#rg .gcard .gname.h{color:var(--home-text)}
#rg .gcard .gname .sub{color:var(--muted);font-weight:600;font-size:.68rem}
#rg .gcard .gsv{font-family:ui-monospace,Menlo,monospace;font-size:1.75rem;font-weight:700;line-height:1.1}
#rg .gcard .gline{font-size:.78rem;color:var(--muted);margin-top:2px}#rg .gcard .lim{color:var(--flag)}
@media(max-width:520px){#rg.goalie .goalies{grid-template-columns:1fr}}
</style>
<div id="rg"><div class="wrap">
<p class="eyebrow">Learn to read hockey · watch first, add metrics after</p>
<h1>Watch the game</h1>
<p class="lede">Press play and just <b>watch</b> — each play narrated in plain language, goals called with the <b>scorer and assists</b>, the pace easing for the big moments. That’s the base view. When you want to understand <em>why</em> a team is on top, <b>add a metric layer</b> below — control, shots from the slot, goaltending, or why play stopped. Nothing is invented; every layer shows its work.</p>
<div class="board">
  <div class="tm a"><span class="ab" id="aAb">MIN</span><span class="sc" id="aSc">0</span></div>
  <div class="mid"><div class="gs"><span id="per">Pre-game</span> · <span class="cl" id="clk">20:00</span> <i class="clw">left</i></div>
    <div class="cbar"><div class="bar"><span class="ba" id="ba"></span><span class="bh" id="bh"></span></div>
    <div class="pct"><span id="pa">0</span><span class="plab">CONTROL<i class="mode" id="pMode">ALL SITUATIONS</i></span><span id="ph">0</span></div></div>
  </div>
  <div class="tm h"><span class="ab" id="hAb">BUF</span><span class="sc" id="hSc">0</span></div>
</div>
<p class="atnote" id="atnote"></p>
<div class="rinkbox"><svg viewBox="0 0 200 85"><g id="rink"></g><g id="netmen"></g><g id="lines"></g><g id="whistles"></g><g id="events"></g><g id="puck"></g><g id="labels"></g><g id="noplace"></g></svg>
  <div class="caption" id="caption"></div>
  <div class="counters"><div class="cc a"><span class="n" id="cA">0</span><span class="lb">MIN attempts<span class="mode" id="mA">ALL SITUATIONS</span></span></div><div class="cc h"><span class="lb">BUF attempts<span class="mode" id="mH">ALL SITUATIONS</span></span><span class="n" id="cH">0</span></div></div>
</div>
<div class="whistlepanel" id="whistlePanel"></div>
<div class="goalies" id="goaliePanel"></div>
<div class="transport"><button class="play" id="play">▶ Play from start</button>
  <button class="spd" id="sp0" aria-pressed="false">🐢 Slower</button><button class="spd" id="sp1" aria-pressed="true">Teaching</button><button class="spd" id="sp2" aria-pressed="false">Faster</button><button class="spd" id="lbl" aria-pressed="true">💬 Explain plays</button>
  <input class="scrub" id="scrub" type="range" min="0" max="1" value="0"><button id="work" aria-expanded="false">Show me the work</button></div>
<div class="legend"><span><i class="k-h"></i>home shot</span><span><i class="k-a"></i>visitor shot — white-filled, like the sweaters</span><span><i class="k-p"></i>puck (jumps between real events)</span><span><i class="k-g"></i><i class="k-gv"></i>goal — either sweater</span><span>metric-specific marks appear when you add a layer</span></div>
<div class="layers"><span class="ll">Add a metric layer:</span><button class="lyr" id="lyCorsi" aria-pressed="false">＋ Control (Corsi)</button><button class="lyr" id="lyHd" aria-pressed="false">＋ Shots from the slot</button><button class="lyr" id="lyGoalie" aria-pressed="false">＋ Goaltending</button><button class="lyr" id="lyWhistle" aria-pressed="false">＋ Why play stopped</button></div>
<div class="figpick"><span class="ll">Trails:</span>
<button class="lyr tbtn" data-t="off" aria-pressed="true">Current moment</button>
<button class="lyr tbtn" data-t="all" aria-pressed="false">Keep every mark</button>
<span class="fnote"><b>Current moment</b> shows only what is happening now.
<b>Keep every mark</b> leaves every attempt on the ice, which builds into a shot chart
by the third period — good to study, busy to watch.</span></div>
<div class="figpick"><span class="ll">Situations:</span>
<button class="lyr sbtn" data-s="all" aria-pressed="true">All situations</button>
<button class="lyr sbtn" data-s="even" aria-pressed="false">Even strength only</button>
<span class="fnote">Power plays and an empty net are still hockey — but they aren't
<b>even</b> hockey. Switch and watch which attempts drop out, and why.</span></div>
<div class="figpick"><span class="ll">Players:</span>
<button class="lyr fbtn" data-f="mascot" aria-pressed="true">Mascot</button>
<button class="lyr fbtn" data-f="tabletop" aria-pressed="false">Tabletop</button>
<span class="fnote">Same shots, same outcomes, same math — only the drawing changes. <b>Tabletop</b> is the rod-hockey player you grew up with.</span></div>
<p class="ends">A goaltender stands in each crease, in that team’s colour — and
leaves when the feed says the goalie was pulled for an extra attacker. Ends are held
fixed here, so each team always attacks the same net. In the arena they switch every period — this is the one thing on the rink we move, and the coordinates are the league’s own.</p>
<div class="hint">Tip: click a ⚡ slot shot (amber ring) on the ice to see <b>why</b> it qualified — with trails set to <b>keep every mark</b>, earlier ones stay clickable too.</div>
<div class="work" id="workPanel" hidden></div>
<div class="whybk" id="whyBk"><div class="why" id="whyContent"></div></div>
<p class="verdict" id="verdict"></p>
<div class="foot" id="gl">—</div>
<nav class="nextup" id="nextup" aria-label="Where to go next"></nav>
</div></div>
<script>
/* THE LIBRARY SITS OUTSIDE boot(), because the SHELL needs it too. It used to
   be inlined inside the function, which meant the bootstrap that chooses WHICH
   game to load could not use the same URL parser the renderer uses -- and so it
   grew its own regex, and then a second one for preview. Hoisting it is what
   makes "one place reads the URL" true of both pages rather than one. */
__LIB__
function boot(G,RATES){
// RATES ARRIVES AS AN ARGUMENT AND IS NEVER REQUESTED IN THIS FUNCTION. Both
// pages share this body byte for byte, and read-the-game.html carries its whole
// game inside it and must reach nothing -- the deploy greps the inlined pages for
// outbound calls, and that grep reads comments too, which is how this sentence
// came to be phrased around the word it is about. The shell requests
// measures.json in its own bootstrap and passes it down; the inlined page passes
// nothing, and the sentence then says the comparison is missing -- which is true
// of a page that makes no requests at all.
const R=G.roster, HID=G.teams.home.id, AID=G.teams.away.id, HAB=G.teams.home.ab, AAB=G.teams.away.ab;
const SKIP=new Set(['stoppage','period-start','period-end','game-end','delayed-penalty']);
const EV=[],EVI=[];
G.events.forEach((e,n)=>{if(!SKIP.has(e.type)){EV.push(e);EVI.push(n);}});
// The timeline is the playable events; the LEDGER is the whole game. Layers get
// every event so the 51 non-plays are excluded with reasons instead of vanishing.
const upto=k=>k<0?[]:G.events.slice(0,EVI[k]+1);
/* THE URL, READ ONCE. Both pages behave identically when framed, because both
   run this line -- the inlined page can be previewed too, it is the same
   renderer and the same query string. There used to be three reads of
   location.search and two hand-written regexes, one of them the same preview
   test spelled twice; see src/lib/deeplink.js for why that became a module. */
const LINK=parse(location.search),PREVIEW=LINK.preview;
/* A MOMENT NAMES AN EVENT IN THE GAME; THE SCRUBBER INDEXES THE PLAYABLE ONES.
   EV drops 51 of 320 -- stoppages among them -- so the whistle layer's own
   teaching case ("here is an icing, watch this one") names an event that has no
   frame of its own. It is shown in the window of the next playable event, which
   is exactly where `upto()` puts it, so that is where the link lands. */
function frameOf(n){for(let k=0;k<EVI.length;k++)if(EVI[k]>=n)return k;return EV.length-1;}
const ATT=ATTEMPT_TYPES;
// THE HOST DEFENDS THE RIGHT-HAND END, which is the arrangement a television
// viewer expects (Kevin) -- and it is ours to choose, because the feed does not
// have one: across 14 raw play-by-plays `homeTeamDefendingSide` in period one
// splits 7 left, 7 right. It is fixed to the arena, not to the league.
//
// It also removes a real confusion. The scoreboard reads away-then-host, so the
// host's badge sits on the RIGHT; with the host defending the left end, the same
// three letters appeared on opposite sides of one screen. Kevin read the pair as
// swapped and CHENG independently found the cause -- the rink and the scoreboard
// speaking one visual language with two meanings. Now they agree.
//
// A DISPLAY TRANSFORM AND NOTHING MORE. The extract keeps the host on -x, every
// reducer keeps reading it that way, and `distanceToNet` still measures to the
// net a team attacks. Only the mapping from rink feet to screen units is
// reflected, in this one line.
const SX=x=>100-x, SY=y=>42.5-y;
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
/**
 * WHERE AN EVENT HAPPENED, in screen coordinates -- or null when the feed does
 * not record a position for it.
 *
 * ONE DECISION, UPSTREAM OF BOTH PATHS, and that is the whole point of it.
 * `inShootout` already existed in layer.js and its own comment says it lives
 * there "because all three need it and one of them getting it wrong is a wrong
 * number on screen". Three counting paths called it. The DRAWING path never did,
 * so shootout attempts were painted on the ice at coordinates that are not
 * positions: measured over 13 shootouts, the feed places attempts at BOTH ends
 * of the rink, and the split does not follow the shooting team either (94
 * attempts: away 27/18, home 20/29). Every shootout attempt is taken at one end.
 * Confirmed live on game 2023020510, which drew five of them at x = +75, -73,
 * +76, -83, +75.
 *
 * The reference game has no shootout -- `pt` is REG on all 320 events -- so no
 * local test, fixture or mutation could ever have seen it. ~6% of games reach a
 * shootout (13 of 219 sampled).
 *
 * THE STRUCTURAL LESSON (CHENG) is not "remember to filter in both places". It
 * is that the counting path and the drawing path were each given the rule
 * separately and only one got it -- the same shape as the conservation loophole,
 * where the ledger and the pre-filter disagreed about what "every event" meant.
 * So scope is decided ONCE, here, and the drawing path is not given the
 * opportunity to disagree: it cannot read a coordinate except through this.
 */
/**
 * WHAT PERIOD THIS IS, IN THE GAME'S OWN WORDS -- and the skater count when
 * overtime changes how many players are on the ice.
 *
 * The page said "Period 4". Overtime IS surfaced here: its events are real play
 * at real coordinates, drawn like any other and counted in the attempts. What
 * was never said is that it is overtime at all, or the thing that actually
 * changes -- MEASURED over 219 raw feeds, regular-season overtime is 3-on-3 in
 * **82.3%** of its events, while playoff overtime is 5-on-5 in **93.8%**. Four
 * skaters leave the ice and the page's only comment was to increment a number.
 *
 * `pt` and `sit` are both recorded fields, so none of this is inferred. The
 * period NUMBER cannot do this job: period 5 is a shootout in the regular season
 * and a third overtime in the playoffs.
 *
 * THE COUNT READS AWAY-THEN-HOME, which is the scoreboard's own order. Quoting
 * skater counts in one order while naming a team by another is a defect this
 * project has already shipped once, in 36 of 103 strength reasons; here no team
 * is named at all, and matching the scoreboard is what keeps the two readable
 * together.
 */
function periodLabel(e){
 if(!e)return 'Pre-game';
 if(e.pt==='SO')return 'Shootout';
 if(e.pt!=='OT')return 'Period '+e.per;
 // Playoff games run 2OT, 3OT and beyond; regulation is three periods, so the
 // overtime's own number is the period minus three.
 const n=e.per-3, name=n>1?n+'OT':'Overtime';
 const s=e.sit;
 return (s&&s.length===4)?name+' · '+s[1]+'-on-'+s[2]:name;
}
function place(e){
 if(!e||e.x==null)return null;
 if(inShootout(e))return null;
 return {x:SX(e.x),y:SY(e.y)};
}
function drawRink(){const P=[];P.push('<rect class="boards" x="1" y="1" width="198" height="83" rx="27"/>');
 for(const g of[-89,89])P.push(`<line class="ln red" x1="${SX(g)}" y1="3" x2="${SX(g)}" y2="82"/>`);
 for(const b of[-25,25])P.push(`<line class="ln blue" x1="${SX(b)}" y1="1" x2="${SX(b)}" y2="84"/>`);
 P.push('<line class="ln red thick" x1="100" y1="1" x2="100" y2="84"/><circle class="ln blue" cx="100" cy="42.5" r="15"/>');
 // THE NINE FACE-OFF SPOTS, taken from the DATA rather than from the rulebook.
 // Every faceoff in the archive happens at one of nine coordinates: 2,134 draws
 // across 39 games spread over the three seasons land on these nine and on
 // nothing else, and none of them arrives without a coordinate. So this table is
 // a measurement, checkable against the feed, rather than a diagram I remembered.
 //
 //   end zone (+-69,+-22) 68.6%   centre (0,0) 19.5%   neutral (+-20,+-22) 11.9%
 //
 // ONLY FIVE OF THE NINE CARRY A CIRCLE -- the four end-zone spots and centre
 // ice. The neutral-zone spots are bare, which is the rink's own arrangement and
 // not an omission here; drawing circles on them would be tidier and wrong.
 //
 // AND THE SPOTS ARE NOT DECORATION. The whistle layer places every mark at the
 // faceoff that RESTARTS play, and offside restarts on a neutral-zone spot 89.8%
 // of the time -- so the four spots nobody had drawn are the four that layer uses
 // most. A ring on blank ice reads as "something happened at this arbitrary
 // point"; the same ring on a painted spot reads as "play restarted here".
 //
 // NO HASH MARKS. A real end-zone circle has them and nothing available here
 // gives their dimensions, so they stay off rather than being approximated.
 const ENDZONE=[],NEUTRAL=[];
 for(const zx of[-69,69])for(const zy of[-22,22])ENDZONE.push([zx,zy]);
 for(const zx of[-20,20])for(const zy of[-22,22])NEUTRAL.push([zx,zy]);
 for(const[zx,zy]of ENDZONE)P.push(`<circle class="ln red" cx="${SX(zx)}" cy="${SY(zy)}" r="15"/>`);
 // Spots go on LAST so a dot sits on top of its circle. Centre ice is blue and
 // the other eight are red, which is how the paint goes down. All nine are drawn
 // at one size: the eight outer spots are two feet across and this is that, while
 // the centre spot is smaller in a real rink and is drawn to match the rest
 // because at this scale the true size is under a pixel on a phone.
 for(const[zx,zy]of[...ENDZONE,...NEUTRAL])
  P.push(`<circle class="fdot" cx="${SX(zx)}" cy="${SY(zy)}" r="1"/>`);
 P.push('<circle class="fdot ctr" cx="100" cy="42.5" r="1"/>');
 // nets: BUF(home) defends LEFT(-89), MIN(away) defends RIGHT(+89)
 // A NET DRAWN AS EQUIPMENT, not as a chip. It was a rounded rectangle filled
 // with the club colour and captioned in contrasting ink -- which is the
 // scoreboard badge's exact treatment, in mirrored positions, so the same visual
 // language meant "this team" at the top of the page and "this team's net" on the
 // ice with nothing distinguishing the two (CHENG). Kevin read the pair as
 // swapped, and he knows the sport cold.
 //
 // DRAWING IT PROPERLY FOUND A PLAIN ERROR. The old rectangles sat on the ICE
 // side of the goal line -- x = 11..15 at the near end -- and a real net stands
 // ON the line with its body BEHIND it. They were also 11 units across where a
 // net is 6 feet, nearly double. Both are fixed here: 6 wide, 4 deep, behind the
 // line, with the mouth facing centre ice, plus the crease it sits in.
 //
 // The sweater convention carries over: the host's mesh is filled with its
 // colour, the visitor's is white inside its own frame.
 const netGlyph=(id,gx,col)=>{
  // Which way is "behind" is read from where the goal line sits on screen, so a
  // reflection of SX carries the whole net with it and cannot leave one end
  // pointing the wrong way.
  const dir=gx<100?1:-1, back=gx-4*dir, top=42.5-3, bot=42.5+3;
  const body=`M ${gx} ${top} L ${back} ${top+0.8} L ${back} ${bot-0.8} L ${gx} ${bot} Z`;
  // NETTING, NOT A BLOCK. Filled with the club's colour the host's net rendered as
  // a solid slab -- the visitor's, being white inside its own frame, read far
  // better as equipment. So the sweater convention comes OFF the net: both are
  // open, both carry their colour in the frame and the strands, and the goalie
  // standing in front keeps the host-filled / visitor-white distinction where it
  // is doing identity work.
  let strands='';
  for(let k=1;k<=2;k++){const t=k/3, mx=gx+(back-gx)*t;
   strands+=`<line class="strand" x1="${mx.toFixed(1)}" y1="${(top+0.8*t).toFixed(1)}" `
          + `x2="${mx.toFixed(1)}" y2="${(bot-0.8*t).toFixed(1)}" stroke="${col}"/>`;}
  return `<g class="netg">`
   + `<path class="crease" d="M ${gx} ${42.5-6} A 6 6 0 0 ${dir>0?1:0} ${gx} ${42.5+6}"/>`
   + `<path class="mesh" d="${body}" fill="#fff" fill-opacity=".5" stroke="${col}"/>`
   + strands
   + `<line class="post" x1="${gx}" y1="${top}" x2="${gx}" y2="${bot}" stroke="${col}"/>`
   // THE FLASH IS ITS OWN ELEMENT, over the net rather than being it. The old
   // markup put the animation on a hidden duplicate; putting it on the net now
   // that the net is always visible would make the net VANISH and return on
   // every goal, because the keyframes run 0 -> .85 -> 0.
   + `<path id="${id}" class="flashpath" d="${body}" fill="${col}" opacity="0"/>`
   + `</g>`;};
 // dir points from the goal line toward CENTRE ice, so the body goes the other way.
 // Ids by ROLE, not by side. `netL`/`netR` were screen names for data facts, and
 // a reflection turns that kind of name into a lie without changing a character.
 P.push(netGlyph('netHome',SX(-89),HOMECOL));
 P.push(netGlyph('netAway',SX(89),AWAYCOL));
 // THE LABEL MOVES BEHIND THE GOAL LINE, into dead ice where there is room for
 // the word that was doing the disambiguating work. "CBJ" alone can be read as
 // "CBJ's net" or "where CBJ shoots", and those are opposites (CHENG); "CBJ net"
 // is what the original caption said before it was shortened to fit on a post.
 // THE TAGS FACE EACH OTHER ACROSS THE RINK (Kevin). The near net reads UP and
 // the far net reads DOWN, which puts the near tag's first letter at the BOTTOM
 // and the far tag's at the top.
 //
 // ESTABLISHED BY LOOKING, NOT BY DERIVING, and that is the note worth keeping. I
 // reasoned this out from the transform algebra twice -- SVG's y-axis points down,
 // a positive rotation is clockwise, so +90 carries a glyph's top toward +x -- and
 // shipped the opposite of what was asked for both times. The algebra is correct
 // and it answers a different question than the one a viewer is asking: which way
 // a label appears to face is not settled by where its ascenders point. Kevin read
 // the screen; the screen wins.
 // NO TEXT TAG. A goaltender standing in the crease says "this net is defended"
 // without a label, and the club's colour on the goalie and the net says whose --
 // which is how a viewer reads a real rink. The vertical "WSH net" was clutter
 // doing a job a figure does better (Kevin).
 $('rink').innerHTML=P.join('');}
/**
 * A goaltender in each crease -- unless the feed says one has been pulled.
 *
 * NOT DECORATION. `sit` is the situation code on every event,
 * [awayGoalie][awaySkaters][homeSkaters][homeGoalie], and it is the only honest
 * way to know a net is empty. In the reference game Minnesota pulls at 01:40 of
 * the third and the code reads 0651 for the last twenty events: six skaters, no
 * goalie. So the figure LEAVES THE ICE at the moment it really left, and the
 * emptiest net in hockey stops being something a novice has to be told about.
 *
 * WHAT THE FIGURE CLAIMS is that a goaltender defends this net, which the feed
 * records. It claims nothing about where they stood -- position is not tracked,
 * and the crease is where the rulebook puts them, not where we guess they were.
 * Same line the shooter figures already sit on the right side of (Doctrine §5).
 */
// SIZED AGAINST THE NET, NOT PICKED. The first figure stood 8.1 units tall in
// front of a 6-foot goal mouth -- 135% of the thing it defends -- and it was not
// centred on the mouth either (figure centre 41.8, mouth centre 42.5), so it read
// large AND high. Kevin saw it in one look; nothing in a 317-test suite could.
//
// There is no measurement anywhere in the feed that sets the size of a glyph, and
// a number we simply chose is the shape CHENG calls a model wearing a UI control.
// What IS available is a RELATIONSHIP that can be checked: a goaltender defending
// a net has to fit inside it. So ONE constant drives every dimension below, and
// the test pins the relationship -- figure inside the mouth, centred on it,
// measured from the rendered markup against the rendered post -- rather than
// pinning these digits, which would only re-state what the code already says.
const GK_H=4.6;                                    // full height, inside the 6ft mouth
const goalieGlyph=(gx,col,fill)=>{
 const dir=gx<100?1:-1, x=gx+2.2*dir;
 const top=42.5-GK_H/2, bot=42.5+GK_H/2;           // CENTRED on the mouth
 const hr=GK_H*0.163, hcy=top+hr;                  // head
 const by=hcy+hr*0.6, bw=GK_H*0.5;                 // body, tucked just under it
 const n=v=>v.toFixed(2);
 return `<g class="gk">`
  + `<rect class="gkbody" x="${n(x-bw/2)}" y="${n(by)}" width="${n(bw)}" `
  + `height="${n(bot-by)}" rx="${n(bw*0.37)}" fill="${fill}" stroke="${col}"/>`
  + `<circle class="gkhead" cx="${n(x)}" cy="${n(hcy)}" r="${n(hr)}" fill="${fill}" stroke="${col}"/>`
  // The stick reaches out to the side and STOPS AT THE POST -- it is the one part
  // of a goaltender that genuinely extends across the mouth, so it is allowed the
  // full half-width and no more.
  + `<line class="gkstick" x1="${n(x+bw/2*dir)}" y1="${n(bot-0.5)}" `
  + `x2="${n(x+(bw/2+1.5)*dir)}" y2="${n(bot)}" stroke="${col}"/>`
  + `</g>`;};
let netmenAre=null;
function drawNetmen(e){
 const sit=e&&e.sit;
 // Present unless the code says zero. A missing code is not evidence of an empty
 // net, and an empty net drawn on a guess would be the most dramatic thing on the
 // ice invented from nothing.
 const out=[];
 if(!sit||sit[3]!=='0')out.push(goalieGlyph(SX(-89),HOMECOL,HOMECOL));
 if(!sit||sit[0]!=='0')out.push(goalieGlyph(SX(89),AWAYCOL,'#fff'));
 const now=out.join('');
 // ONLY ON CHANGE. Rewriting this every frame would rebuild both figures on every
 // event, restarting their entrance animation each time -- a goaltender flickering
 // three hundred times a game. Redrawing only when the situation code actually
 // changes also makes the animation mean something: it fires when a goalie
 // arrives or leaves, and at no other moment.
 if(now===netmenAre)return;
 netmenAre=now;$('netmen').innerHTML=now;}
function flashNet(scorer){
 // A team scores INTO the net it is attacking, which is the OTHER team's: a
 // visitor goal lights the HOST's net. Stated by role, so which side of the
 // screen that is stays a rendering question. Restarting the animation needs the
 // class off, a reflow, then on.
 const net=scorer===AID?$('netHome'):$('netAway');
 net.classList.remove('netflash');void net.offsetWidth;net.classList.add('netflash');}
let prevA=0,prevH=0;
function render(i,newest){
 // `evs` is the PLAYABLE prefix, used to draw the marks on the timeline.
 // `lens(i)` reduces the FULL stream up to the same moment. Two different
 // slices on purpose: the ice shows plays, the ledger accounts for everything.
 const evs=EV.slice(0,i+1),L=lens(i),cur=EV[i];
 const parts=[];
 for(let k=0;k<evs.length;k++){const e=evs[k];const pos=place(e);if(!pos)continue;
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
   const r=e.type==='goal'?3.2:hd?2.2:ATT.has(e.type)?1.7:1;
   const anim=(k===i&&newest)?(e.type==='goal'?' flare':' pop'):'';
   if(hd&&k===i&&newest)parts.push(`<circle class="hdring" cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="4.5"/>`);
   const cx=pos.x, cy=pos.y, title=`<title>${e.rem} ${e.type}</title>`;
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
 const cp=place(cur);
 if(cp&&(cur.type==='shot-on-goal'||cur.type==='goal')){const netx=(cur.own===HID)?89:-89;
   lh=`<line class="shotline" x1="${cp.x.toFixed(1)}" y1="${cp.y.toFixed(1)}" x2="${SX(netx)}" y2="42.5"/>`;}
 $('lines').innerHTML=lh;
 // THE PUCK GOES WITH THEM. It was the third drawing site reading `e.x`
 // directly, so a shootout attempt moved the puck to a place it had not been.
 $('puck').innerHTML=cp?`<circle class="puck${newest?' jump':''}" cx="${cp.x.toFixed(1)}" cy="${cp.y.toFixed(1)}" r="1.5"/>`:'';
 drawNoPlace(cur);
 drawLabel(cur);
 drawNetmen(cur);
 $('aSc').textContent=L.as;$('hSc').textContent=L.hs;
 const a=L.t[AID],h=L.t[HID],tot=a+h||1,pa=Math.round(100*a/tot);
 $('ba').style.width=pa+'%';$('bh').style.width=(100-pa)+'%';
 // A FRACTION, NOT A PERCENTAGE, and the bar carries the proportion (CHENG).
 // `58%` over nineteen attempts asserts three significant figures on a
 // denominator that moves 2.5 points per shot, and it swings visibly through
 // the first period looking like information. `11` beside `8` claims exactly
 // what it is. Same rule as the goalie card and the per-game sentence: no
 // minimum-n threshold is needed, because a fraction carries its own.
 $('pa').textContent=a;$('ph').textContent=h;
 $('cA').textContent=a;$('cH').textContent=h;
 if(newest){if(a>prevA)flash('cA');if(h>prevH)flash('cH');
   if(cur&&cur.type==='goal'){flashNet(cur.own);caption(cur,'goal');}
   else if(cur&&hdOn&&isHD(cur)){lastHD=i;caption(cur,'hd');}}
 prevA=a;prevH=h;
 $('per').textContent=periodLabel(cur);$('clk').textContent=cur?cur.rem:'20:00';
 if(goalieOn){const gs=goalieStats(i);$('goaliePanel').innerHTML=G.goalies.map(id=>{const p=R[id];if(!p)return '';const tid=p.tid,side=tid===AID?'a':'h',ab=tid===AID?AAB:HAB;const st=gs[id]||{f:0,s:0,gl:0,hf:0,hs:0};
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
 return `<div class="gcard"><div class="gname ${side}">${p.nm} <span class="sub">${ab} · #${p.n}</span></div><div class="gsv">${faced}</div><div class="gline">${st.s} saves · ${st.gl} goals · ${st.f} shots faced (${MODE()})${st.hf?` · from the slot ${st.hs} of ${st.hf}`:''}<br><span class="lim">one game — what happened, not how unusual it was</span></div></div>`;}).join('');}
 if(workOpen)renderWork(L,cur);
}
function flash(id){const el=$(id);el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
function caption(e,kind){const c=$('caption');const tid=e.own;const ab=tid===AID?AAB:HAB;const side=tid===AID?'a':'h';
 const p=R[e.actor];const who=p?`<span class="num">#${p.n}</span>${p.nm}`:ab;
 const label=kind==='goal'?'🚨 GOAL':'⚡ Shot from the slot';
 c.innerHTML=`<span class="tag ${side}">${ab}</span><b>${label}</b> · ${who}${kind==='hd'?' from the slot':''}`;
 c.classList.remove('on');void c.offsetWidth;c.classList.add('on');}
let workOpen=false;
function renderWork(L,cur){const a=L.t[AID],h=L.t[HID],tot=a+h||1,pa=Math.round(100*a/tot);
 // Rendered from the ledger itself, not from a hand-written list. Every reason
 // below was written by the layer that excluded the event, so a new layer gets
 // this panel for free and a changed rule cannot leave stale copy behind.
 const byWhy=summarise(L.excluded), rows=Object.entries(byWhy).sort((x,y)=>y[1]-x[1])
   .map(([why,n])=>`<div><b>${n}×</b> ${why}</div>`).join('');
 const sTotal=L.surprising.length, sWhy=sTotal?L.surprising[0].why:'';
 $('workPanel').innerHTML=`<h2>How “control” is computed <span class="wsub">(${MODE()}${cur?', through P'+cur.per+' '+cur.rem:', pre-game'})</span></h2>
 <div class="wg"><div class="wc"><h3>Counted <span class="n">${L.counted.length}</span></h3><p>Every attempt on goal — shots that hit the net, missed it, or were blocked. All credited to the shooter.</p></div>
 <div class="wc flag"><h3>Counted, surprisingly <span class="n">${sTotal}</span></h3><p>${sWhy||'—'}</p></div>
 <div class="wc"><h3>Not counted <span class="n">${L.excluded.length}</span></h3><p class="wexc">${rows||'—'}</p></div></div>
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
// THE PER-GAME SENTENCE. A summary of a FINISHED game, so it sits with the game
// line at the foot rather than beside the scoreboard, which counts up as the
// replay plays. It discloses nothing the page has not already said -- #gl states
// the result on first paint.
//
// The two clauses are written into SEPARATE ELEMENTS. That is not layout: it is
// what makes it impossible for a later edit to join the game's number to the
// archive's rate with a "so" or a "which means", and the reason that matters is
// mechanical rather than stylistic -- see src/lib/sentence.js.
(function verdict(){
 const all=corsi.reduce(G.events,{...CTX,evenOnly:false});
 const lvl=tiedControl.reduce(G.events,CTX);
 const q=G.quoted;
 const V=sentenceFor({homeAb:HAB,awayAb:AAB,homeId:HID,awayId:AID,
   diff:lvl.diff, attempts:all.t, levelCounts:lvl.t,
   // The LEAGUE'S OWN LINE when we hold it, which is what the archive's rows were
   // built from. Falling back to our own count keeps a game with no quoted
   // boxscore readable rather than blank.
   score:q?{h:q.home.score,a:q.away.score}:{h:finalH,a:finalA},
   // THE SAME PREDICATE THE COUNTS USE, and not `per===5`: period five is a
   // shootout in the regular season and a THIRD OVERTIME in the playoffs.
   shootout:G.events.some(inShootout),
   gameId:(G.game&&G.game.id)||0,
   curve:(RATES&&RATES.levelCurve)||null,
   // undefined = never asked for (the inlined page, which reaches nothing);
   // null = asked for and did not arrive. Two different true sentences.
   noCurveReason:RATES===undefined
     ?'this page carries a single game and makes no network requests'
     :undefined});
 const p=[`<span class="vk">What this game was</span>`,
          `<span class="lead">${V.lead}</span>`];
 if(V.rate)p.push(`<span class="rate">${V.rate}</span>`);
 if(V.absent)p.push(`<span class="rate">${V.absent}</span>`);
 // THE RATE, DRAWN AS WELL AS SAID. Only when there IS one: an absent
 // comparison gets its sentence and no picture, because a track with no dot on
 // it would be a chart of nothing.
 let pct=null;
 if(V.rate&&V.row&&V.row.n){
  pct=V.row.count/V.row.n*100;
  p.push(`<span class="vscale"><span class="vtrack"><span class="vhalf"></span>`
   + `<span class="vpt${pct>50?' hi':''}" id="vpt"></span></span>`
   + `<span class="vends"><span>0% — that team always won</span>`
   + `<span>always lost — 100%</span></span></span>`);}
 $('verdict').innerHTML=p.join('');
 // THE ONE POSITION HERE THAT IS GENUINELY CONTINUOUS, and the only one that
 // cannot become a class. Written through the CSSOM, which no policy restricts;
 // as a `style` attribute this page's own CSP refused it and the dot sat at 0%
 // on every game in the archive. It must come AFTER innerHTML -- the element
 // does not exist until then.
 if(pct!==null)$('vpt').style.left=pct.toFixed(1)+'%';})();
/**
 * WHERE TO GO NEXT, AND IT IS ABOUT THIS GAME.
 *
 * The shareable unit of this site is a game, so this page is where a stranger
 * arrives -- and until the chrome landed it had no links at all. The header
 * answers "where am I"; this answers "what else is here", and it sits BELOW the
 * rink on purpose.
 *
 * CHENG's ruling, and it dissolved a question asked badly. "Converting a
 * stranger versus interrupting a viewer" treats the two as simultaneous. They
 * are not: the stranger arrives BEFORE the game and the viewer exists DURING
 * it, and the moment that matters is neither -- it is when the game ENDS.
 * Someone who has just watched a replay and understood why twelve attempts did
 * not count is at peak curiosity, and that is here rather than in a navigation
 * bar above the ice.
 *
 * SPECIFIC TO THE GAME JUST WATCHED, which a generic nav cannot be. The two
 * clubs are already in scope, so their names cost nothing -- and they are the
 * only two teams this visitor has been given a reason to care about.
 *
 * BUILT AT RUNTIME, not by page.py: game.html learns its teams when it fetches,
 * so the shell can only supply the container. Both pages run this identically.
 *
 * Every destination exists today. A link to a page we have not built yet is a
 * 404 wearing a plan, which is the rule the chrome nav is held to as well.
 */
(function nextUp(){
 const el=$('nextup'); if(!el)return;
 const dot=s=>`<span class="sw ${s}"></span>`;
 el.innerHTML=[
  `<a href="/?team=${encodeURIComponent(AAB)}">${dot('a')}More ${AAB} games</a>`,
  `<a href="/?team=${encodeURIComponent(HAB)}">${dot('h')}More ${HAB} games</a>`,
  `<a href="/">Every game in the archive</a>`,
 ].join('');})();
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
 $('whyContent').innerHTML=`<div class="whyhd ${tid===AID?'a':'h'}"><div><div class="t">${isGoal?'🚨 A GOAL from the slot':'⚡ Why this counts as a slot shot'}</div>
   <div class="s">${p?'#'+p.n+' '+p.nm:ab} · ${ab} · P${e.per} ${e.rem} · ${e.type.replace(/-/g,' ')}</div></div><button class="whyclose" onclick="hideWhy()">✕</button></div>
  <div class="whybody"><div class="whydiag">${diag}</div>
   <div class="factor"><span class="fv">${Math.round(dist)} ft</span><span class="fl">Distance to the net — <b>close</b>. Our rule: ≤ 33 ft. <span class="chk">✓</span></span></div>
   <div class="factor"><span class="fv">${Math.round(angle)}°</span><span class="fl">Angle off straight-on — ${angle<22?'<b>a clean look</b> at the net':'a slot-area angle'}. Lower = more net to shoot at.</span></div>
   <div class="factor last"><span class="fv">${inSlot?'Slot':'Wide'}</span><span class="fl">Lateral position — ${inSlot?'<b>in the slot</b> (within the faceoff dots) <span class="chk">✓</span>':'outside the slot'}</span></div>
   <div class="whyrule"><b>The rule, and you can check it:</b> a shot counts as <b>from the slot</b> when it is <b>≤ 33 ft from the net</b> AND <b>within ±22 ft of the middle</b>. Both true here. This is <b>our own geometric rule</b>, not a model and not anybody else's statistic — it says where the shot came from, and nothing about how likely it was to go in. Measure it yourself on the diagram.</div></div>`;
 $('whyBk').classList.add('on');}
function hideWhy(){$('whyBk').classList.remove('on');}
$('events').addEventListener('click',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.i!=null){const k=+t.dataset.i;if(hdOn&&isHD(EV[k]))showWhy(k);}});
$('caption').addEventListener('click',()=>{if(lastHD!=null)showWhy(lastHD);});
$('whyBk').addEventListener('click',e=>{if(e.target.id==='whyBk')hideWhy();});


/* THE LABEL SAYS WHAT HAPPENED. A SECOND LINE IS ONLY EARNED BY SAYING WHETHER
   IT COUNTS.
   Kevin, watching the preview: "we don't need the subtext on the event, just the
   event itself I think is enough. It states what the event was, and the
   descriptive elements of the site should provide the clarifying details."
   True of six of the nine, and they are gone: "Faceoff / puck dropped",
   "Giveaway / lost the puck", "Takeaway / won the puck back", "Penalty / off to
   the box", "Shot on goal / a shot attempt" all say the label again in other
   words. On a phone they were the smallest text on the ice and they said
   nothing.
   THE TWO THAT STAY ARE NOT DESCRIPTIONS, THEY ARE THE THESIS. A novice
   watching "Shot blocked" appear while the attempts counter GOES UP has just met
   the site's whole argument, and the line is the only thing on screen that
   accounts for it -- and blocked-shot attribution is the exact defect that once
   shipped a wrong flagship number, so "for the shooter" is load-bearing rather
   than decorative. Same for a miss that still counts.
   HIT LOST ITS LINE TOO, and the reason sharpened the rule. I had kept it under
   "says whether it counts", but Kevin: "I don't think it adds any value (except
   to the 'hits' counter that we don't track anyway)". He is right, and the
   distinction is exact -- "not a shot" corrects a misreading of a number THAT IS
   NOT ON THE SCREEN. Nothing on this page ever suggested a hit might be an
   attempt, so the line answered a question nobody had.
   The rule, sharpened, so the next row is not argued from scratch: a second line
   is earned only when it corrects a misreading of a counter the viewer CAN SEE
   MOVING. Rephrasing the label is noise; explaining a metric we do not show is
   noise wearing the shape of rigour.
   `goal` is gone entirely. Goals take the branch above -- scorer and assists --
   so its row had never once rendered: dead weight inside a table, reading as
   coverage. Third instance of that shape (test/shell.test.js had a dead
   "rosterSpots" pattern, homepage.test.js an assertion that read undefined). */
const LAB={faceoff:['Faceoff'],hit:['Hit'],giveaway:['Giveaway'],takeaway:['Takeaway'],'blocked-shot':['Shot blocked','still an attempt — for the shooter'],'missed-shot':['Missed shot','wide/high — still an attempt'],'shot-on-goal':['Shot on goal'],penalty:['Penalty']};
let labelsOn=true;
/**
 * WHAT THE ICE SAYS WHEN IT IS SHOWING NOTHING.
 *
 * Removing the shootout marks without saying so would trade a wrong mark for a
 * silent gap: the replay would reach the end of overtime level, the scoreboard
 * would read one goal higher, and nothing would account for the difference.
 * Silence about an omission is the failure the ingest-state work spent two
 * rounds fixing, and it is the same reason the per-game sentence states why a
 * comparison is missing rather than dropping it.
 *
 * TWO SENTENCES, TWO KINDS. The first is about hockey and its subject is a rule.
 * The second is about US -- what we did to the data and why -- which is a
 * category the copy table did not have: every provenance tag we own (`rule:`,
 * `field:`) points into the game or the feed, and this one points at the
 * renderer. It is the first `display:` row, and the normalization disclosure the
 * page still owes belongs in the same family.
 */
function drawNoPlace(e){
 const g=$('noplace');
 if(!e||!inShootout(e)){g.innerHTML='';return;}
 g.innerHTML=`<text class="npl" x="100" y="39">Shootout — a skills competition that decides the game, not play in it.</text>`
   + `<text class="nplsub" x="100" y="46">Attempts are not drawn: the coordinates the feed records for them are not positions.</text>`;}
function drawLabel(e){const g=$('labels');const p=place(e);if(!labelsOn||!p){g.innerHTML='';return;}
 const lx=p.x,ly=p.y;
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
 const hd=(hdOn&&isHD(e))?' · from the slot':'';
 // No second line means no second <text>, rather than an empty one: an empty
 // element still occupies the label's height and would push the next mark's
 // spacing around for a string nobody can read.
 const sub=info[1]?`<text class="plabsub" x="${tx.toFixed(1)}" y="${(ty+3.7).toFixed(1)}" text-anchor="${anc}">${info[1]}</text>`:'';
 g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty-1).toFixed(1)}" stroke="var(--ink)" stroke-width=".3" opacity=".35"/><text class="plabel" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}">${lab?lab+" · ":""}${info[0]}${hd}</text>${sub}</g>`;}
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
 // THE LINES THE RULE NAMES, for the whistle being explained. A novice is told
 // an icing is about the centre line and the far goal line; this is the only way
 // to say WHICH lines those are on the ice in front of them. Nothing here draws a
 // path -- the feed records no puck trajectory, and Doctrine §4 forbids inventing
 // one -- so what is lit is rink geometry the rulebook refers to, selected by the
 // recorded restart coordinate.
 const cur=latest(W);
 if(cur&&cur.lines&&cur.lines.length){
  for(const lx of cur.lines)
   g.push(`<line class="rulel${lx===0?' dim':''}" x1="${SX(lx)}" y1="2" x2="${SX(lx)}" y2="83"/>`);}
 $('whistles').innerHTML=g.join('');
 const w=latest(W);
 if(!w){$('whistlePanel').innerHTML='<p class="whsay">No whistle yet — play has not stopped in what you have watched so far.</p>';return;}
 // An unfamiliar reason is carried verbatim and named as unexplained. The draft
 // dropped it; a guessed sentence would be worse than dropping it.
 const say=w.say?ESC(w.say)
   :`<span class="none">The feed recorded this stoppage as “${ESC(w.rsn||'no reason given')}”, which is one we have no sentence for. We are not guessing at one.</span>`;
 // THE ZONE, AND THIS IS A COMPOSITION worth naming. The layer was built saying
 // it must not supply a team, because a stoppage carries none -- and that was
 // right for the only input it had. The restart coordinate is a different input:
 // Rule 81 sends the faceoff to the offending team's end, and 2,019 of 2,019
 // icings across 240 games restart at an end-zone dot. So the page states the
 // RECORDED fact (which end the dot is in) beside the RULE (where that dot goes),
 // and leaves the reader to put them together. It does not assert who iced it.
 const zone=(w.rsn==='icing'&&w.zone)
   ?` The faceoff came back into ${ESC(w.zone)}'s end.`:'';
 const where=(w.placed?'Play restarted at the ringed faceoff dot.'
   :`Not shown on the ice — ${ESC(w.unplaced)}.`)+zone;
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
function setHd(){$('lyHd').setAttribute('aria-pressed',hdOn);$('lyHd').textContent=(hdOn?'✓ ':'＋ ')+'Shots from the slot';render(i,false);}
$('lyCorsi').addEventListener('click',()=>{corsiOn=!corsiOn;setCorsi();});
// One code path owns the mode label, so the markup cannot drift from the state.
// The static HTML carries a default only so the page reads correctly before JS.
function syncStrength(){
 const v=evenOnly?'even':'all';
 document.querySelectorAll('#rg .sbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===v));
 // EVERY site that shows this quantity carries the mode. The scoreboard is the
 // prominent one and was the unqualified one -- same number, two places, one
 // of them saying what it was measured under (CHENG).
 const lbl=MODE().toUpperCase();$('mA').textContent=lbl;$('mH').textContent=lbl;$('pMode').textContent=lbl;}
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
/* THE GAME OPENS AT THE OPENING FACEOFF.
   It used to open on the LAST event, which put the final score, the finished
   counters and -- on a shootout game -- the shootout notice on screen before a
   viewer had pressed anything. "Defaulting to the end kinda spoils the surprise"
   (Kevin), and it is worse than a spoiler on a replay site: the whole product is
   watching a count get MADE, and arriving at the made count is arriving after
   the thing you came for.
   It also fixes the shootout narrative appearing first on game 2025021235 --
   that notice belongs at the end of the replay because that is when it happens,
   and it was only ever early because the page started there. */
drawRink();
/* THE LINK, APPLIED — and keyed off the layers' OWN ids, so a rename cannot
   leave this table pointing at a token nothing answers to. `?layer=slot` is the
   public name of the slot layer for the same reason the label is: a URL
   survives copy-paste and forum posts long after page copy changes. */
const LAYER_APPLY={
 [corsi.id]:()=>{corsiOn=true;setCorsi();},
 [danger.id]:()=>{hdOn=true;setHd();},
 [goaltending.id]:()=>{goalieOn=true;setGoalie();},
 [whistle.id]:()=>{whistleOn=true;setWhistle();},
};
if(LINK.strength==='even'){evenOnly=true;syncStrength();}
LINK.layers.forEach(t=>{const f=LAYER_APPLY[t];if(f)f();});
const AT=resolve(G.events,LINK.at);
/* A SENTENCE ONLY WHEN WE COULD NOT HONOUR THE LINK. `exact:false` on its own
   is silent: a clock nothing happened at is a perfectly good moment and the
   page shows the last thing that did happen. Apologising for every inexact
   landing would apologise on most honest links. */
$('atnote').textContent=AT.why?AT.why.text
 :(LINK.problems.some(p=>/^at[:.]/.test(p))?LINK_NOTES.unreadable.text:'');
prevA=0;prevH=0;
set(frameOf(AT.index),false);
/* THE PREVIEW LOOP.
   Deliberately NOT the ordinary play loop: `dwell()` paces a game for someone
   watching it, easing for the big moments, and a taste has about five seconds.
   So preview steps at a fixed interval and restarts, and it starts where the
   game starts -- the same reason the page itself no longer opens at the final
   whistle.

   THE PACE IS NOT A NUMBER WE PICK. IT IS `dwell`, WHICH IS THE PRODUCT'S.

   Two wrong answers came first, and the second is the instructive one. The
   original fitted 44 events into five seconds -- 115ms each -- and Kevin read it
   exactly right: "a blur of activity, looks like it's 100x real-time". It was.
   A play-by-play event lands roughly every nine seconds of real hockey, so 115ms
   is about 78x, and eleven times this page's own teaching pace.

   The fix was a slower chosen constant, 430ms. Kevin again: "definitely better,
   still 2 or 3x too fast". Which lands almost exactly on `dwell` -- and that is
   the answer, not a third guess. A preview slower than the replay misrepresents
   it and a preview faster than the replay misrepresents it, so the preview runs
   at the replay's pace, full stop. `dwell` also EASES for the big moments, so
   five seconds of taste has the product's rhythm rather than a metronome's.

   THE COUNT IS THEN DERIVED, NOT CHOSEN. One number survives -- how long the
   loop runs before it restarts -- and the window is however many events fit in
   it at the real pace. Change `dwell` and the window follows on its own; the two
   can no longer drift apart, which is what a second constant would guarantee.

   BUDGET_MS is still a visual judgement and cannot be derived. It is here to be
   looked at, not proved. (docs/site-purpose.md 5.)

   IT STOPS FOR prefers-reduced-motion. Doctrine 4 permits motion that traces a
   real event; it does not require inflicting it. Reduced motion gets a still
   frame partway in, so the rink is populated rather than blank. */
const BUDGET_MS=14000;
if(PREVIEW){
 $('rg').classList.add('preview');
 /* AND THE CHROME GOES, from the one place chrome is defined (page.py). The
    shared header and footer are real height inside a box sized for a rink. */
 document.body.classList.add('previewing');
 let acc=0,W=0;
 while(W<EV.length-1&&acc+dwell(EV[W])<=BUDGET_MS){acc+=dwell(EV[W]);W++;}
 const WINDOW=Math.max(1,W);
 if(REDUCED){set(WINDOW,false);}
 else{let k=0;
  /* THE RESTART PAUSE USED TO BE DEAD CODE. It read
       set(k);k++;if(k>WINDOW){k=0;}
       setTimeout(tick,k>WINDOW?900:115)
     -- and k had already been reset to 0 by the time the ternary asked, so the
     900 never fired once. The loop restarted at full speed, which is its own
     small contribution to the blur. Decide the wait BEFORE moving k. */
  const tick=()=>{
   const shown=EV[k],last=k>=WINDOW,wait=last?1500:dwell(shown);
   set(k,k>0);
   if(last){k=0;prevA=0;prevH=0;}else{k++;}
   setTimeout(tick,wait);};
  tick();}}
}
__BOOT__
</script>"""

LIB = ["rink.js", "attribution.js", "layer.js", "strength.js", "svgpen.js", "figures.js",
       "layers/corsi.js", "layers/goaltending.js", "layers/danger.js", "layers/whistle.js",
       "teams.js", "layers/tied.js", "sentence.js",
       # LAST, and it has to be: deeplink.js derives its URL vocabulary from the
       # layer objects themselves, so all four must already exist in the bundle.
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
    if(LINK0.preview){boot(g,null);return null;}
    return grab(ORIGIN+'/measures.json')
      .catch(function(){return null;})
      .then(function(rates){boot(g,rates);});})
  .catch(function(e){
    // A true sentence about a broken situation beats a spinner that never ends.
    say('This game could not be loaded — '+e.message);
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
    return P.document(body, title=TITLE, description=DESC, chrome="minimal")


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
                      url="https://readthegame.co/game", chrome="minimal",
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
