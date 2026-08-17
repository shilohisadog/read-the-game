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
#rg.preview .newcomer,#rg.preview h1,#rg.preview .transport,#rg.preview .layers,
#rg.preview .figpick,#rg.preview .hint,#rg.preview .icenote,#rg.preview .whistlepanel,#rg.preview .blockpanel,
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
/* THE DURATION HERE IS A PLACEHOLDER AND NEVER APPLIES. `caption()` sets
   `style.animationDuration` from `dwell(e)` on every call, so the caption lasts
   exactly as long as the frame it describes. This number used to be the real
   one, and being a CSS constant beside a setTimeout is what made the two
   disagree at every speed -- the subject of docs/event-timing.md. The shorthand
   still needs A duration to be valid; `render.test.js` pins that the script
   overwrites it, so if the assignment ever goes, a test does too. */
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
/* THE STEP BUTTONS BORROW `.spd`'s size and add one thing: an end state. They
   move the playhead rather than change how fast it moves, so they sit beside
   Play in the markup; everything else about them is already a speed button.

   AND THEY SAY WHAT THEY STEP THROUGH. Kevin: "don't we need to state what the
   prev and next arrows are for?" -- and `◀ Back` next to a slider does not
   answer "back to what". The unit is written INTO EACH BUTTON rather than into a
   group label above the pair, because this row wraps: at 360px the transport
   already breaks over several lines, and a label can end up on a different line
   from the buttons it names. That is the same defect as "Press ▶ Play from start
   below" -- prose whose truth depends on where something else landed.
   "play" is the page's own word for an event: `💬 Explain plays`, and the
   greeting's "every play is named as it happens".

   AND THE WORDING IS SHORT BECAUSE THE FIRST ONE WAS MEASURED AND WAS NOT.
   `◀ Back one play` / `Forward one play ▶` reads better and cost 46px of
   transport height at EVERY width -- it wrapped the button row at 1100px, where
   the pair had previously fit. `Prev`/`Next` are Kevin's own words for them and
   cost nothing: 70px at 1100 and 162px at 390 and 360, which is exactly what the
   transport measured with the buttons UNNAMED. Naming them is free. */
#rg .stepb:disabled{opacity:.38;cursor:default}
/* THE SLIDER GETS ITS OWN ROW, and it is a measurement rather than a taste.
   `flex:1` made it share a line with the buttons, so adding Back and Next took
   169px straight out of it: 306px -> 137px at a 1100px viewport, which is 2.0
   plays per pixel -- COARSER than the 1.7 that made the phone case a defect in
   docs/event-index.md §1. The step buttons fix aim, and they had quietly made
   the drag worse to do it. On its own row the track is the full width of the
   controls at every viewport instead of whatever flex-wrap happens to leave,
   and it stops being a function of how many buttons sit beside it. */
#rg .scrub{flex:1 0 100%;accent-color:var(--ink);cursor:pointer;min-width:120px}
#rg .legend{display:flex;flex-wrap:wrap;gap:7px 18px;font-size:.78rem;color:var(--muted);margin:6px 2px}
#rg .legend i{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:-1px}
/* A LEGEND MAY NOT DESCRIBE A MARK THAT IS NOT ON THE ICE. "from the slot, once
   that layer is on" was conditional copy in a permanent list -- the legend
   asserting a property of the rink the rink did not have, which is the same
   defect as a check that cannot fail wearing a different coat (CHENG). A key
   now appears WITH the layer that draws its mark.
   A legend is a READ surface, not a control: things you click must not move,
   things you read may. Nobody builds muscle memory for a key. */
#rg .legend .lkey{display:none}
#rg.slot .legend .lk-hd,#rg.blocked .legend .lk-blk,#rg.heldends .legend .lk-ends,
#rg.whistle .legend .lk-wh{display:inline}
#rg .k-a{background:#fff;box-shadow:0 0 0 1.5px var(--away)}#rg .k-h{background:var(--home)}#rg .k-hd{background:#fff;box-shadow:0 0 0 1.5px var(--hd)}#rg .k-wh{background:transparent;box-shadow:0 0 0 1.5px var(--flag)}#rg .k-blk{background:var(--home);box-shadow:0 0 0 1.5px var(--flag)}#rg .k-p{background:#0e1216}#rg .k-g{background:radial-gradient(circle,#fff 0 2.5px,var(--home) 2.5px)}#rg .k-gv{background:radial-gradient(circle,var(--away) 0 2.5px,#fff 2.5px);box-shadow:0 0 0 1.5px var(--away);margin-left:-3px}
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
/* THE CARD IS THE LAST FRAME'S CONTENT, so it is absent until the replay
   reaches the last frame.
   IT USED TO SIT NEXT-TO-LAST ON THE PAGE -- 1,156px below the rink on a phone,
   screen 2.18 of 2.99 -- and the objection to moving it up was that the page
   would read result-first against its own "watch first" headline. CHENG:
   position on the PAGE and position in TIME are different axes, and the audit
   was conflating them. The card is not a metric, it is the CONCLUSION, and there
   is no conclusion in the first period. Absent until there is one kills the
   spoiler objection and the result-first objection together, and it is the same
   move as making first paint the opening faceoff rather than the final score. */
#rg .verdict{display:none}
#rg.ended .verdict{display:block;max-width:56ch;margin:22px auto 0;background:#fff;border:1px solid var(--edge);
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
/* `display:block` ON BOTH, AND ITS ABSENCE WAS THE DEFECT. The card is a <p>,
   so every part of it has to be a <span> -- and a span is inline, which means it
   ignores `height` and takes its width from its CONTENT. `.vtrack`'s two
   children are both absolutely positioned, so it had no content, so it was
   14px of nothing 0px wide. `left:39.3%` of zero is zero: the dot sat hard
   against the left edge of an invisible track on every game in the archive.
   `.vk` and `.rate` above carry the same declaration; these two were simply
   forgotten, and nothing in the node suite has a stylesheet to notice with. */
#rg .vscale{display:block;margin:11px 0 2px}
#rg .vtrack{display:block;position:relative;height:14px;border-radius:7px;background:#e6edf3}
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
/* THE TIP IS ABOUT A MARK THAT DOES NOT EXIST UNTIL A LAYER DRAWS IT. Amber
   rings arrive with "Shots from the slot" and with nothing else, so a permanent
   tip telling a reader to click one is 55px of instruction about something not
   on their screen -- the same defect the legend had before it went progressive,
   in a different block. It now appears with the layer, directly under the
   button that turned it on. */
#rg .hint{display:none;font-size:.76rem;color:#b07d17;margin:3px 2px 0;font-weight:600}
#rg.slot .hint{display:block}
/* A NOTE ABOUT WHAT THE ICE IS DOING RIGHT NOW, under the ice. Empty when there
   is nothing true to say, and `:empty` rather than a class because the only
   state is "is there text" -- a class would be a second copy of that fact. */
#rg .icenote{font-size:.78rem;color:var(--muted);margin:7px 2px 0;text-align:center}
#rg .icenote:empty{display:none}
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
/* A NOTE APPEARS WHEN THE THING IT EXPLAINS HAPPENS, and not before. These
   three were permanent -- 183px on a phone, 93 words -- each describing a state
   the reader was not in. CHENG: "the place that sentence actually pays off is
   the moment someone flips the switch and 49 attempts vanish. That's when a
   novice has a question and the sentence is the answer." A disclosure box would
   have been provenance parked somewhere convenient; this is provenance
   travelling with the thing it describes, which is the site's own pattern.
   `:empty` rather than a class, so a note with nothing to say cannot leave a
   gap behind -- the same reason drawLabel writes no second <text> when there is
   no second line. */
#rg .fnote{font-size:.76rem;color:var(--muted);flex:1;min-width:220px}
#rg .fnote:empty{display:none}
#rg .fig{transform-box:fill-box;transform-origin:center}
/* SHOWN TO THE PEOPLE IT WAS WRITTEN FOR, and retired for everyone else. This
   is the same copy R took OUT of permanent residence -- the resolution of that
   argument was never "these words are bad", it was "these words are not for
   everybody, forever". */
#rg .newcomer{display:none}
#rg.newcomer .newcomer{display:block;background:#eef4f8;border:1px solid var(--edge);
 border-left:3px solid var(--blue);border-radius:9px;padding:13px 16px;margin:0 0 16px;
 font-size:.92rem;line-height:1.6}
#rg .newcomer b{color:var(--ink)}
#rg .newcomer .nwhy{display:block;margin-top:6px;color:var(--muted)}
#rg.newcomer .nwhy2{font-size:.86rem;margin:12px 2px 0}
#rg .newcomer .nwhy .lim{display:block;font-size:.76rem;margin-top:2px}
#rg .newcomer .ndone{margin-top:9px;font-size:.76rem;background:none;border:0;padding:0;
 color:var(--muted);text-decoration:underline;cursor:pointer}
#rg.preview .newcomer{display:none}
#rg .layers{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 2px 4px;padding-top:12px;border-top:1px dashed var(--edge)}
#rg .layers .ll{font-size:.8rem;color:var(--muted);font-weight:700}
#rg .lyr{font:inherit;font-size:.83rem;font-weight:600;border-radius:8px;border:1px dashed #b7c6d0;background:#fff;color:var(--muted);padding:8px 13px;cursor:pointer}
#rg .lyr[aria-pressed="true"]{border-style:solid;color:var(--ink);border-color:var(--ink);background:#eef2f5}

#rg .wh{fill:none;stroke:var(--ink);stroke-width:.5;stroke-dasharray:1.5 1.3;opacity:.5}
#rg .wh.now{stroke:var(--flag);stroke-width:.9;stroke-dasharray:none;opacity:.95}
#rg .whn{font-size:3.2px;font-weight:700;fill:var(--ink);text-anchor:middle;opacity:.7}
/* THE BLOCKED-SHOTS LAYER. The ring is drawn on every game already; what the
   layer adds is emphasis, the blocker's name, and the archive share. Attempts
   that were NOT blocked drop back so the stopped ones carry the frame -- the
   same device the slot layer uses, and the reason the mark needed a class of
   its own rather than being found by its ring. */
#rg.blocked .att:not(.blkd):not(.cur),#rg.blocked .goal:not(.cur){opacity:.2}
#rg.blocked .ring.blk{stroke-width:1.3;opacity:1}
#rg .blockpanel{display:none}
#rg.blocked .blockpanel{display:block;background:#fff;border:1px solid var(--edge);border-radius:11px;padding:13px 15px;margin-top:10px;box-shadow:0 4px 14px rgba(16,32,45,.06)}
#rg .bkrow{display:flex;align-items:baseline;justify-content:center;gap:18px;font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:1.35rem}
#rg .bkrow .bkt{font-size:.7rem;letter-spacing:.06em;color:var(--muted);font-family:inherit}
#rg .bkrow .a{color:var(--away-text)}#rg .bkrow .h{color:var(--home-text)}
#rg .bklab{text-align:center;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-top:2px}
#rg .bksay{margin:9px 0 0;font-size:.88rem;line-height:1.5}
#rg .bkmate{margin:7px 0 0;font-size:.82rem;line-height:1.5;color:var(--flag)}
#rg .bkarch{margin:9px 0 0;padding-top:9px;border-top:1px solid var(--edge);font-size:.82rem;line-height:1.55;color:var(--muted)}
#rg .bkarch b{color:var(--ink)}
#rg .bkarch .lim{display:block;margin-top:3px;font-size:.75rem}
/* TWO ROWS ON ONE AXIS, AND THE ALIGNMENT IS THE COMPARISON. Two separate cards
   make a reader compare numbers; two bars sharing a left edge make them SEE the
   reached/never boundary land in different places, which is the whole reason to
   draw this instead of writing it (Kevin's amendment, docs/blocked-card.md §7).
   AN SVG, NOT DIVS WITH WIDTHS. This page's own CSP refuses every inline `style`
   attribute -- it cost the team-colour dots and the verdict scale once already
   -- and a rect's `width` is a presentation attribute, not a style. So the
   proportions are in the markup where they can be read, with no CSSOM pass. */
#rg .mix{margin:11px 0 0}
#rg .mixhd{font-size:.71rem;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);font-weight:700;display:flex;flex-wrap:wrap;gap:2px 8px;align-items:baseline}
#rg .mixcl{margin:1px 0 0;font-size:.87rem;font-weight:600;color:var(--ink);line-height:1.35}
#rg .mixcl b{font-weight:800}
#rg .mixhd .n{letter-spacing:.02em;text-transform:none;font-weight:600;font-family:ui-monospace,Menlo,monospace;font-size:.72rem}
#rg .mixbar{height:14px;border-radius:7px;overflow:hidden;margin:5px 0;background:#e6edf3}
#rg .mixbar svg{display:block;width:100%;height:100%}
#rg .mixbar .r{fill:var(--blue)}#rg .mixbar .b{fill:var(--flag)}#rg .mixbar .m{fill:#b8c6d0}
#rg .mixkey{display:flex;flex-wrap:wrap;gap:2px 14px;font-size:.78rem;color:var(--muted)}
#rg .mixkey b{color:var(--ink);font-variant-numeric:tabular-nums}
#rg .mixkey i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}
#rg .mixkey .r{background:var(--blue)}#rg .mixkey .b{background:var(--flag)}#rg .mixkey .m{background:#b8c6d0}
/* THE ONE SENTENCE ON THIS CARD THAT SAYS WHY ANY OF IT MATTERS, so it is set
   as text rather than as a caption -- it is the point, not an annotation. */
#rg .mixwhy{margin:9px 0 0;font-size:.88rem;line-height:1.45}
#rg .mixwhy b{font-weight:800}
#rg .whistlepanel{display:none}
#rg.whistle .whistlepanel{display:block;background:#fff;border:1px solid var(--edge);border-radius:11px;padding:13px 15px;margin-top:10px;box-shadow:0 4px 14px rgba(16,32,45,.06)}
#rg .whsay{margin:0;font-size:.9rem;line-height:1.5}
#rg .whsay .rsn{font-weight:800}
/* CAPITALISE THE SENTENCE, NOT EVERY WORD. `text-transform:capitalize` is what
   rendered the raw feed key as "Goalie Stopped After Sog"; on a written label it
   gives "Goaltender Covered The Puck". ::first-letter suits both the labels and
   the raw string an unknown reason still falls back to. */
#rg .whsay .rsn::first-letter,#rg .whtally span::first-letter{text-transform:uppercase}
/* THE CARD IS RETROSPECTIVE AND SAYS SO. Small, muted, above the reason: it
   ranks the card below the rink as a ledger rather than a second narrator. */
#rg .whsay .wkick{display:block;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:2px}
#rg .whsay .at{font-family:ui-monospace,Menlo,monospace;color:var(--muted);font-size:.78rem}
#rg .whsay .none{color:var(--flag)}
#rg .whmeta{font-size:.74rem;color:var(--muted);margin-top:7px}
#rg .whmeta .src{font-family:ui-monospace,Menlo,monospace}
#rg .whtally{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:10px;padding-top:9px;border-top:1px solid var(--edge);font-size:.76rem;color:var(--muted)}
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
<div class="newcomer" id="newcomer"></div>
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
<p class="icenote" id="iceNote"></p>
<div class="whistlepanel" id="whistlePanel"></div>
<div class="blockpanel" id="blockPanel"></div>
<div class="goalies" id="goaliePanel"></div>
<div class="transport"><button class="play" id="play">▶ Play from start</button>
  <button class="spd stepb" id="back" aria-label="Prev play">◀ Prev play</button><button class="spd stepb" id="fwd" aria-label="Next play">Next play ▶</button>
  <button class="spd" id="sp0" aria-pressed="false">🐢 Slower</button><button class="spd" id="sp1" aria-pressed="true">Teaching</button><button class="spd" id="sp2" aria-pressed="false">Faster</button><button class="spd" id="lbl" aria-pressed="true">💬 Explain plays</button>
  <button id="work" aria-expanded="false">Show me the work</button>
  <input class="scrub" id="scrub" type="range" min="0" max="1" value="0"></div>
<p class="verdict" id="verdict"></p>
<div class="legend"><span><i class="k-h"></i>home shot</span><span><i class="k-a"></i>visitor shot — white-filled, like the sweaters</span><span><i class="k-p"></i>puck (jumps between real events)</span><span><i class="k-g"></i><i class="k-gv"></i>goal — either sweater</span><span><i class="k-blk"></i>blocked — ringed where the puck was <b>stopped</b></span><span class="lkey lk-hd"><i class="k-hd"></i>from the slot</span><span class="lkey lk-blk">blocked shots are dimmed unless a body stopped them</span><span class="lkey lk-wh"><i class="k-wh"></i>play restarted here — brightest at the most recent stoppage</span><span class="lkey lk-ends">ends are held fixed — in the arena the teams switch each period</span></div>
<div class="newcomer nwhy2" id="newcomerWhy"></div><div class="layers"><span class="ll">Add a metric layer:</span><button class="lyr" id="lyCorsi" aria-pressed="false">＋ Control (Corsi)</button><button class="lyr" id="lyHd" aria-pressed="false">＋ Shots from the slot</button><button class="lyr" id="lyGoalie" aria-pressed="false">＋ Goaltending</button><button class="lyr" id="lyWhistle" aria-pressed="false">＋ Why play stopped</button><button class="lyr" id="lyBlock" aria-pressed="false">＋ Blocked shots</button></div>
<div class="hint">Tip: click any shot ringed in amber to see <b>why</b> it counts as a slot shot — with trails set to <b>keep every mark</b>, earlier ones stay clickable too.</div>
<div class="figpick"><span class="ll">Trails:</span>
<button class="lyr tbtn" data-t="off" aria-pressed="true">Current moment</button>
<button class="lyr tbtn" data-t="all" aria-pressed="false">Keep every mark</button>
<span class="fnote" id="nTrails"></span></div>
<div class="figpick"><span class="ll">Situations:</span>
<button class="lyr sbtn" data-s="all" aria-pressed="true">All situations</button>
<button class="lyr sbtn" data-s="even" aria-pressed="false">Even strength only</button>
<span class="fnote" id="nSit"></span></div>
<div class="figpick"><span class="ll">Players:</span>
<button class="lyr fbtn" data-f="mascot" aria-pressed="true">Mascot</button>
<button class="lyr fbtn" data-f="tabletop" aria-pressed="false">Tabletop</button>
<span class="fnote" id="nFig"></span></div>
<div class="work" id="workPanel" hidden></div>
<div class="whybk" id="whyBk"><div class="why" id="whyContent"></div></div>
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
/* WHETHER THIS IS A FIRST VISIT — a fact the page has never had, and the reason
   230 words of teaching copy were either permanent furniture or absent.
   Kevin: "what they don't know, they have no idea what it means... they need to
   have their hand held for the first few times." CHENG arrived at the same gap
   from the other side: every one of those words is a FIRST-VISIT word, and the
   page could not tell.
   DISTINCT DAYS, NOT PAGE LOADS. Someone watching three games in one sitting is
   still on their first visit, and retiring the help mid-lesson is the failure
   this is built to avoid.
   STORAGE REFUSED MEANS NEWCOMER. Private browsing throws here, and the two
   errors are not equal: a returning viewer occasionally re-reading a tip costs
   them a glance, a novice shown nothing costs us the visitor. */
const NEWCOMER_DAYS=3;
let visits=1;
const NEWCOMER=(()=>{try{
  const today=new Date().toISOString().slice(0,10);
  const [day,n]=(localStorage.getItem('rtg.seen')||'').split('|');
  visits=+n||0;
  if(day!==today){visits++;localStorage.setItem('rtg.seen',today+'|'+visits);}
  return visits<=NEWCOMER_DAYS;
 }catch(e){return true;}})();
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
/**
 * WHAT JUST HAPPENED TO THE PLAYHEAD — which is not the same question as
 * "is this the newest event", and the two used to share one boolean.
 *
 *   'play'  the replay advanced by one: mark the moment AND bump the counters.
 *   'jump'  the viewer went somewhere: mark the moment, and do NOT bump.
 *   ''      a redraw of the same frame — a layer toggled, the work panel
 *           opened, the scrubber dragged THROUGH here on the way somewhere
 *           else. Mark nothing.
 *
 * THE SPLIT IS NOT COSMETIC. `prevA`/`prevH` hold the attempt counts at the
 * previous frame, so `a>prevA` means "one more attempt than a moment ago" only
 * when the playhead moved a moment. Jump forward across a period and forty
 * attempts arrive at once, and the counter would flash exactly as it does for a
 * single shot -- a bump that says "that just happened" about something that
 * happened forty times, minutes ago. The caption is the opposite case: calling
 * the goal again is the whole reason to jump to it.
 */
function render(i,how){
 const moment=how==='play'||how==='jump';
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
   if(e.type==='blocked-shot')cls+=' blkd';   // so the layer can dim what was NOT blocked
   // AND THE CURRENT PLAY IS NEVER DIMMED BY A LAYER. With trails on
   // "Current moment" -- the default -- the only mark on the ice IS the
   // current one, so a layer that dims everything it does not count leaves
   // the play a viewer is watching at 20% and the rink otherwise empty.
   // Found by rendering it, not by reading it: the node suite has no CSS.
   if(k===i)cls+=' cur';
   if(hd)cls+=' clickable';
   const r=e.type==='goal'?3.2:hd?2.2:ATT.has(e.type)?1.7:1;
   const anim=(k===i&&moment)?(e.type==='goal'?' flare':' pop'):'';
   if(hd&&k===i&&moment)parts.push(`<circle class="hdring" cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="4.5"/>`);
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
 // The replay is AT the end, not merely near it. `i` is the frame index and
 // EV.length-1 is the last playable event; a game paused one shot short has
 // no verdict, and saying so is the whole point.
 // THE SITUATIONS NOTE CARRIES A NUMBER, which is the difference between a
 // claim and evidence. "Watch which attempts drop out" asked the reader to go
 // and look; this says how many did, in the game in front of them, so far.
 // Counted as: excluded for STRENGTH and for no other reason -- an event that
 // was also not an attempt was never going to count, and including it would
 // inflate the number with things even strength did not remove.
 const dropped=L.excluded.filter(x=>x.dims&&x.dims.strength&&!x.dims.type&&!x.dims.play).length;
 $('nSit').textContent=evenOnly
   ?`${dropped} ${dropped===1?'attempt has':'attempts have'} dropped out so far. Power plays and an empty net are still hockey — but they aren't even hockey.`
   :'';
 $('nTrails').textContent=trails==='all'
   ?'Every attempt stays on the ice, which builds into a shot chart by the third period — good to study, busy to watch.'
   :'';
 $('nFig').textContent=figStyle!=='mascot'
   ?'Same shots, same outcomes, same math — only the drawing changes.'
   :'';
 document.getElementById('rg').classList.toggle('ended',i>=EV.length-1);
 /* AN EMPTY NET IS A STATE, NOT AN INSTANT, so the sentence explaining it lasts
    exactly as long as the fact. This is half of the permanent paragraph that
    used to sit under the controls saying a goaltender "leaves when the feed says
    the goalie was pulled" -- drawn on every game and every visit, and read at
    every moment except the one where it meant something. CHENG: "the place that
    sentence pays off is the moment someone watches it happen."
    `sit` is [awayGoalie][awaySkaters][homeSkaters][homeGoalie], the same code
    drawNetmen draws by, and a MISSING code is not evidence of an empty net --
    so no note either, on the same rule.
    ONE SENTENCE PER PULLED TEAM, mapped rather than branched. Both nets empty at
    once is legal and rare, and a `has`/`have` ternary for it would be a branch no
    game in the archive can reach, which is a branch no test can honestly kill. */
 const st=cur&&cur.sit, pulled=[];
 if(st&&st[0]==='0')pulled.push(AAB);
 if(st&&st[3]==='0')pulled.push(HAB);
 $('iceNote').textContent=pulled.length
   ?pulled.map(ab=>`${ab} has pulled the goaltender for an extra attacker.`).join(' ')
    +' An empty net here is the feed’s own situation code, never a guess.'
   :'';
 /* THE ENDS KEY, at the first moment the claim can be doubted. Every team
    attacks the same net all game here and switches every period in the arena,
    and the reader who NOTICES is the one who already knows hockey -- so the key
    arrives when the game leaves the first period, which is when the switch would
    have happened and did not. Before that, nothing has yet failed to occur. */
 document.getElementById('rg').classList.toggle('heldends',!!cur&&cur.per>1);
 if(blockOn){const sl=upto(i);drawBlocked(blocked.reduce(sl,CTX),L,sl);}
 else $('blockPanel').innerHTML='';
 let lh='';
 const cp=place(cur);
 if(cp&&(cur.type==='shot-on-goal'||cur.type==='goal')){const netx=(cur.own===HID)?89:-89;
   lh=`<line class="shotline" x1="${cp.x.toFixed(1)}" y1="${cp.y.toFixed(1)}" x2="${SX(netx)}" y2="42.5"/>`;}
 $('lines').innerHTML=lh;
 // THE PUCK GOES WITH THEM. It was the third drawing site reading `e.x`
 // directly, so a shootout attempt moved the puck to a place it had not been.
 $('puck').innerHTML=cp?`<circle class="puck${moment?' jump':''}" cx="${cp.x.toFixed(1)}" cy="${cp.y.toFixed(1)}" r="1.5"/>`:'';
 drawNoPlace(cur);
 drawLabel(cur);
 drawNetmen(cur);
 $('aSc').textContent=L.as;$('hSc').textContent=L.hs;
 const a=L.t[AID],h=L.t[HID],tot=a+h,pa=tot?Math.round(100*a/tot):0;
 /* ⭐ NO BAR OVER AN EMPTY POPULATION, and this was a real defect on the front
    door. `tot=a+h||1` avoided the division by zero and then DREW THE RESULT
    ANYWAY: at 0-0 it made pa=0, so the whole bar rendered in the home colour and
    the opening faceoff of every game announced that one team had all of the
    control before a puck had been shot. Seen only by looking -- it is a
    rendering, and the suite has no pixels.

    The rule already exists one file over. archive.js refuses a rate over an
    empty population and says why: "0 reads as a finding, and 'we measured
    nothing' is a different statement from 'it never happened'." A proportion of
    nothing drawn as certainty is that sentence in paint. Both segments stay at
    zero width, so what shows is the empty track -- which is what we know. */
 $('ba').style.width=(tot?pa:0)+'%';$('bh').style.width=(tot?100-pa:0)+'%';
 // A FRACTION, NOT A PERCENTAGE, and the bar carries the proportion (CHENG).
 // `58%` over nineteen attempts asserts three significant figures on a
 // denominator that moves 2.5 points per shot, and it swings visibly through
 // the first period looking like information. `11` beside `8` claims exactly
 // what it is. Same rule as the goalie card and the per-game sentence: no
 // minimum-n threshold is needed, because a fraction carries its own.
 $('pa').textContent=a;$('ph').textContent=h;
 $('cA').textContent=a;$('cH').textContent=h;
 if(how==='play'){if(a>prevA)flash('cA');if(h>prevH)flash('cH');}
 if(moment){
   if(cur&&cur.type==='goal'){flashNet(cur.own);caption(cur,'goal');}
   // THE PENALTY IS CALLED, and it is the only event here that changes the
   // CONDITIONS of the game rather than the count. It is why `Even strength
   // only` exists as a control at all, and until now the ice marked it exactly
   // as loudly as a giveaway -- a `LAB[]` label and nothing else. Found by
   // asking the index's question ("which events does this page give a moment of
   // their own?") of a renderer that turned out to have only two answers.
   //
   // `own` IS THE OFFENDING TEAM, checked rather than assumed: across the
   // reference game's eight penalties, the skater count in `sit` drops for
   // `own`'s side on the very next event, eight times out of eight. The caption
   // says who took it and stops there -- at THIS frame the team is not yet a
   // skater short (`sit` still reads 1551), so any sentence about the power play
   // would be a claim about the future dressed as a description.
   else if(cur&&cur.type==='penalty'){caption(cur,'penalty');}
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
 const label=kind==='goal'?'🚨 GOAL':kind==='penalty'?'⛔ Penalty':'⚡ Shot from the slot';
 // THE TRAILING CLAUSE IS GONE, and it is the residue of a rename. When the
 // label read "⚡ High danger" a suffix naming the slot was the sentence's only
 // mention of it; after the rename to "Shot from the slot" the caption said it
 // twice -- "⚡ Shot from the slot · #16 Dorofeyev from the slot", on 31 of 31
 // slot captions in a walked replay. The rename was verified by grepping for
 // the OLD term, which can prove a word is gone and cannot see that removing it
 // left a sentence saying the same thing in both halves. Found by watching the
 // layer play; the assertion below it is in `render.test.js`.
 c.innerHTML=`<span class="tag ${side}">${ab}</span><b>${label}</b> · ${who}`;
 /* THE CAPTION LASTS EXACTLY AS LONG AS THE FRAME IT DESCRIBES. It used to be
    `animation:cap 2.2s` in the stylesheet -- a second clock, beside the pace and
    unrelated to it, and the speed buttons moved one of them. Driving the
    duration from `dwell(e)` is what makes "coordinated with the captions" a
    property of the code rather than a pair of numbers somebody keeps in step.

    THROUGH THE CSSOM, WHICH THE CSP PERMITS. The policy refuses inline `style`
    attributes in the shipped markup (see docs and `document.test.js`); assigning
    to `.style` at runtime is how the verdict dot and the team colours already
    work. A duration living only in CSS would also be invisible to every test we
    have, because the render harness has no stylesheet. */
 c.style.animationDuration=dwell(e)+'ms';
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
/* THE PACE, AND IT IS ONE RULE INSTEAD OF FOUR TIERS.
   docs/event-timing.md carries the walk this came out of. What it measured, at
   Teaching, over 280 frames of a real replay:

     55 of 280 frames (19.6%) held 1.3x to 2.6x the base with NOTHING on screen
     to tell them apart, because `dwell` asked `isHD(e)` while the caption asked
     `hdOn && isHD(cur)`. A pause that exists to give a caption room, firing
     when there is no caption. Proven by contrast rather than argument: the same
     31 frame indices, 0 captioned in the base view and 31 at `?layer=slot`.

   Kevin: "I'm not sure we should linger on certain events longer than others...
   a consistent replay speed, and definitely coordinated with the captions."

   THE RULE IS NOW: A FRAME LASTS AS LONG AS WHAT IS ON IT TAKES TO READ.
   Which quantizes to two states, because the page has two -- a frame carries a
   caption or it does not. Both are OBSERVABLE PROPERTIES OF THE FRAME rather
   than a taxonomy someone chose, and the old ladder was the latter: a goal was
   worth 4.6 ordinary plays because somebody decided so.

   AND IT MAKES THE 19.6% STRUCTURALLY IMPOSSIBLE rather than guarded. The frame
   is long BECAUSE there is a caption, so a layer that is off cannot leave a
   pause behind -- `captioned()` is the single source both the schedule and the
   renderer read. Same move as `place()`: remove the opportunity to disagree
   instead of adding a third check that has to agree.

   FRAME_MS IS A TASTE AND IS HERE TO BE LOOKED AT. Kevin reported Teaching too
   fast; 1800 is his call to move, and the consequence of moving it is the
   replay's length (about 8.5 minutes for a 281-event game) and the number of
   events in the home page's loop, which runs on this same function. */
const FRAME_MS={sp0:2600,sp1:1800,sp2:1000};
const CAPTION_BONUS=900;
let i=EV.length-1,playing=false,timer=null,frameMs=FRAME_MS.sp1;
$('scrub').max=EV.length-1;
function set(v,how){i=Math.max(0,Math.min(EV.length-1,v));$('scrub').value=i;render(i,how);syncStep();}
/* THE ENDS ARE STATED BY THE CONTROL, not discovered by pressing it. `set`
   clamps, so a press at either end is already harmless -- but a button that
   accepts a press and does nothing is a button that says the page is broken. */
function syncStep(){$('back').disabled=i<=0;$('fwd').disabled=i>=EV.length-1;}
/* WHICH FRAMES SPEAK. The ONE place that answers it -- `render` calls this to
   decide whether to caption, and `dwell` calls it to decide how long the frame
   lasts. Two readers, one answer, so they cannot drift: that drift is the whole
   subject of docs/event-timing.md. `hdOn` is in here on purpose; a slot shot
   with the layer off is a frame that says nothing, and it must be paced as one. */
function captioned(e){return !!e&&(e.type==='goal'||e.type==='penalty'||(hdOn&&isHD(e)));}
function dwell(e){return captioned(e)?frameMs+CAPTION_BONUS:frameMs;}
function step(){if(i>=EV.length-1){stop();return;}set(i+1,'play');timer=setTimeout(step,dwell(EV[i]));}
function play(){if(i>=EV.length-1){prevA=0;prevH=0;set(0,'play');}playing=true;$('play').textContent='⏸ Pause';clearTimeout(timer);timer=setTimeout(step,dwell(EV[i]));}
function stop(){playing=false;$('play').textContent=i>=EV.length-1?'▶ Replay from start':'▶ Play';clearTimeout(timer);}
$('play').onclick=()=>playing?stop():play();
/**
 * ONE PLAY AT A TIME, IN EITHER DIRECTION — the control this transport did not
 * have, and the slider is measurably unable to substitute for.
 *
 * Measured in a real browser (docs/event-index.md §1): the scrub track is 166px
 * over 281 plays at a 360px viewport, so one pixel of drag is 1.7 plays and a
 * 40px fingertip spans 68 of them -- a quarter of the game. Landing on a chosen
 * play by dragging is not a matter of care; it is below the resolution of the
 * input device. On a desktop a mouse CAN address one play per pixel, and the
 * complaint survives anyway, because the track carries no marks: there is
 * nothing on it that says where the goals are, so the viewer drags, reads the
 * clock, overshoots and drags back. Two defects, both of which present as
 * "moving the slider back and forth" (Kevin).
 *
 * A STEP IS A JUMP, SO THE MOMENT IS CALLED AGAIN. That is the whole point of
 * pressing Back: not to arrive at a frame, but to see the goal called a second
 * time. One argument to `set`.
 */
function jump(d){stop();set(i+d,'jump');}
$('back').addEventListener('click',()=>jump(-1));
$('fwd').addEventListener('click',()=>jump(1));
/* A DRAG PASSES THROUGH PLAYS; A RELEASE LANDS ON ONE. `oninput` fires at every
   value the slider crosses, so calling the moment there would fire a hundred
   captions on one drag. `onchange` fires once, when the viewer lets go -- which
   is the frame they actually chose, and it gets called like any other jump. */
$('scrub').oninput=e=>{stop();set(+e.target.value,'');};
$('scrub').onchange=e=>{set(+e.target.value,'jump');};
/* THE SPEED CONTROL NOW GOVERNS THE CAPTION TOO, and until this change it did
   not govern anything but the frame. Measured: the caption ran 2067ms visible at
   every speed, because it was a CSS constant and the pace was a setTimeout, so a
   penalty frame (1300ms) let its caption finish ON THE NEXT PLAY six times out
   of six -- two plays later at Faster -- while a goal frame (6000ms) spent 3933ms
   with the caption already gone. Opposite directions, one missing relation.
   The id is passed rather than the number so there is one table, not two. */
function setSpeed(id){frameMs=FRAME_MS[id];['sp0','sp1','sp2'].forEach(x=>$(x).setAttribute('aria-pressed',x===id));}
$('sp0').onclick=()=>setSpeed('sp0');
$('sp1').onclick=()=>setSpeed('sp1');
$('sp2').onclick=()=>setSpeed('sp2');
$('work').onclick=()=>{workOpen=!workOpen;$('workPanel').hidden=!workOpen;$('work').setAttribute('aria-expanded',workOpen);$('work').textContent=workOpen?'Hide the work':'Show me the work';if(workOpen)render(i,'');};
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
     ?'this page carries a single game and never asks for the archive'
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
/* THE CAPTION'S CLICK HANDLER IS GONE, AND IT HAD NEVER ONCE FIRED. `#rg
   .caption` carries `pointer-events:none` -- it has to, it floats over the ice
   and would otherwise swallow clicks meant for the marks underneath -- and
   nothing anywhere overrode it. So this listener was unreachable from the day
   it was written: dead weight that read as an affordance.
   Fourth instance of that shape (the dead `goal` row in `LAB`, `rosterSpots` in
   shell.test.js, an assertion on `undefined` in homepage.test.js), and the
   first one found by a stylesheet rather than by reading the script -- which is
   the same lesson `text-transform:capitalize` taught: the CSS is part of the
   program. It was also WRONG on its own terms, opening the why-card for the
   last slot shot no matter which event the caption was describing. */
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
   "rosterSpots" pattern, homepage.test.js an assertion that read undefined).

   AND THEN THE LAST TWO WENT, so `LAB` is strings rather than pairs. Kevin,
   looking at it again: "I think we can retire the subtext on the event displayed
   on the ice, it still looks crowded to me". The rule above survives him -- the
   two that stayed were the ones that DID correct a misreading of a moving
   counter -- but it was never the whole test. A line can be earned and still not
   be worth the crowding, and which of those is true is a judgement about pixels,
   which is his to make and not one this file can argue from.

   THE BLOCKED LAYER'S SECOND LINE WENT WITH THEM, and that one is not a
   judgement call: both halves of it were already said somewhere permanent. "where
   the puck stopped -- not where the shot was taken" is the legend key, verbatim
   ("blocked -- ringed where the puck was stopped"), and "nobody defended it, so
   neither team is credited" is a whole paragraph of the blocked panel. It was
   redundancy on the most crowded surface on the page.

   WHAT STAYS IS THE GOAL'S ASSISTS, and it stays because THE GREETING PROMISES
   IT BY NAME: "goals are called with the scorer and assists". Cutting it would
   have made a sentence elsewhere on the page false -- the same dependency that
   broke "start with the game at the top" and "Press Play below", and this time
   a test holds the two ends together rather than a comment. */
const LAB={faceoff:'Faceoff',hit:'Hit',giveaway:'Giveaway',takeaway:'Takeaway','blocked-shot':'Shot blocked','missed-shot':'Missed shot','shot-on-goal':'Shot on goal',penalty:'Penalty'};
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
 // WITH THE LAYER ON, THE LABEL NAMES THE BLOCKER, and the reason is the mark's
 // position rather than a preference for one name over the other. A blocked
 // shot's (x, y) is the BLOCK POINT -- where the puck was stopped, between the
 // shooter and the net, a median 24.2 ft out against 33.4 for a shot on goal.
 // A label naming the shooter beside a dot that is the BLOCKER's position
 // invites the reading that the dot is the shooter's, which is the one thing
 // this mark must not say. Naming the blocker inverts it at no cost, and the
 // attribution of the ATTEMPT is untouched: it is still the shooter's, which is
 // corsi's business and correct there (CHENG).
 if(blockOn&&e.type==='blocked-shot'){
   const b=R[e.blk],sh=R[e.actor];
   const bt=b?(b.tid===AID?AAB:b.tid===HID?HAB:null):null;
   const mate=b&&sh&&b.tid===sh.tid;
   const head=!b?'Blocked — no blocker recorded'
     :mate?`Blocked by a teammate — ${b.nm}`
     :`${bt?bt+' · ':''}${b.nm} blocked it`;
   g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty-1).toFixed(1)}" stroke="var(--ink)" stroke-width=".3" opacity=".35"/><text class="plabel" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}">${ESC(head)}</text></g>`;
   return;}
 g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty-1).toFixed(1)}" stroke="var(--ink)" stroke-width=".3" opacity=".35"/><text class="plabel" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}">${lab?lab+" · ":""}${info}${hd}</text></g>`;}
$('lbl').addEventListener('click',()=>{labelsOn=!labelsOn;$('lbl').setAttribute('aria-pressed',labelsOn);$('lbl').style.opacity=labelsOn?'1':'.5';drawLabel(EV[i]);});

// THE WHISTLE LAYER, DRAWN. What from the stoppage, where from the faceoff that
// restarts play -- and the sentence is the point, so it lives in a panel that
// stays put rather than in the caption, which animates away in two seconds.
//
// `marks` and `latest` are the layer's own, not this page's: a whistle mark on
// the wrong dot is the kind of wrong that looks completely right, so the grouping
// rule is tested in test/whistle.test.js rather than eyeballed here.
/* ONE LABEL TABLE, THREE SURFACES. The heading, the tally and the <title> on
   every ring all came through here, and here was `String(r).replace(/-/g,' ')`
   -- the raw feed key with its hyphens swapped. "Goalie Stopped After Sog",
   "Tv Timeout", "Net Dislodged Defensive Skater", and `Sog` unexpanded in front
   of the one audience that does not know the term.
   FIXING THE HEADING ALONE WOULD HAVE LEFT THE OTHER TWO, and nobody would have
   noticed the tooltip, because nobody hovers while watching (CHENG). So the
   written name goes in WHY beside `say` and `from`, and every surface reads it
   from the one place -- the same argument as `place()` and `page.csp`.
   AN UNKNOWN REASON STILL RENDERS RAW. The feed can emit one we have never seen
   and a label we invented for it would be a guess wearing our own voice. */
const RSN=r=>{if(!r)return 'unrecorded';const w=WHY[r];return w&&w.name?w.name:String(r).replace(/-/g,' ');};
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
   /* THE CARD SAYS IT IS LOOKING BACKWARDS, which is the whole of Kevin's
      complaint. Measured across a game: the event this card describes is a
      median 29 SECONDS behind the playhead, 102s at the 90th percentile, and
      more than five seconds behind on 78% of frames -- while the card sat in
      present tense, in the position of a caption, with a timestamp a reader had
      to compare against the scoreboard to discover was history.
      The card was never wrong. Its currency was invisible. "Last stoppage"
      states the relationship the timestamp only implied, and turns a surface
      competing with the rink for `now` into a ledger entry.
      THE KICKER IS NOT THE HEADING. The reason keeps the heading, because what
      stopped play is what the reader came to the card for; the kicker ranks it. */
   `<p class="whsay"><span class="wkick">Last stoppage</span>`
  +`<span class="rsn">${ESC(RSN(w.rsn))}</span> <span class="at">· P${w.per} ${ESC(w.rem)}</span><br>${say}</p>`
  +`<div class="whmeta">${where}${w.rsn2?' Also recorded: '+ESC(RSN(w.rsn2))+'.':''} · `
  +`${n===1?'the first this game':n+' so far this game'}${w.from?' · <span class="src">'+ESC(w.from)+'</span>':''}</div>`
  +`<div class="whtally">${tal}</div>`;}


// THE BLOCKED-SHOTS PANEL. Three things, in the order they are worth knowing:
// who stopped what, the teammate case when there is one, and the archive share
// that makes the per-game number mean anything.
//
// NO WIN RATE, AND THAT IS A RULING RATHER THAN AN OVERSIGHT. "The team that
// blocked more won X% of the time" is not publishable at any sample size: the
// blocks leader is the attempts trailer 81.7% of the time and the archive
// already says the attempts leader loses 54.5%, so the reference class is
// "teams that were being outshot" and the sentence teaches nothing once that is
// stated. What ships is a SHARE OF A POPULATION, which has no winner in it and
// so no causal reading to misread (CHENG, docs/blocked-shots-layer.md §5, §7).
/**
 * ONE PICTURE, TWICE — the game assembling, the archive settled.
 *
 * Kevin: "the shots blocked card needs to be trimmed down and somehow made more
 * impactful... 2½ lines of text that doesn't provide the educating moment."
 * Measured first (docs/blocked-card.md): the card was 26% of a 1100x900
 * viewport and 47% of a phone, and 30-38% of it was archive prose re-rendering
 * identically on all 281 frames.
 *
 * WHAT WAS MISSING WAS NOT STYLING, IT WAS THE OTHER HALF OF THE CLAIM. The
 * archive line asserts TWO things -- 51.9% never reach the goalie, 27.8% are
 * blocked -- and the game-scoped sentence mirrored only the smaller one. A
 * novice was told a startling number about 491,971 attempts and handed nothing
 * to check it against.
 *
 * AND THE MOMENT IS THE BAR, in the only form the EVENT/CONDITION rule allows.
 * A sentence re-reads identically at every frame; a bar MOVES when the thing it
 * measures happens -- the same grammar as the attempt counters bumping, which is
 * already how this page says "that just happened" without narrating it. Both
 * rows are conditions: recomputable from the state at the playhead alone.
 *
 * IT SAYS NOTHING ABOUT THE DIFFERENCE, and that is the load-bearing decision.
 * "Normal" was the obvious word and is the one word this cannot use: every card
 * here says one game is one game, and describing a game as pulling toward or
 * away from normal makes a gap read as a fact ABOUT THIS GAME -- at the fourth
 * attempt the share is 1 of 4 and the gap is noise. The data settles it too. In
 * game 2025030416 the headline matches to a third of a point (52.1 against
 * 51.9) while blocked runs 5.4 low and missed 5.7 high, in opposite directions.
 * Any sentence about converging would have had to pick a story and would have
 * picked the wrong one. Two aligned bars say all of it and claim none of it.
 *
 * COUNTS ON THE GAME ROW, PERCENTAGES ON THE ARCHIVE ROW, and the asymmetry is
 * the point rather than untidiness: a percentage on sixteen attempts swings
 * fifty points (it was deleted from this very card for that), and on 491,971 it
 * is the honest form. The row that can carry one does; the row that cannot does
 * not.
 *
 * EACH ROW STATES ITS OWN SCOPE, because they can disagree. `L` is the corsi
 * ledger and honours `Even strength only`; the archive figure has no strength
 * split and is all situations. The old card had that mismatch too and said
 * nothing -- putting the two side by side would have made an unstated mismatch
 * into an invited comparison.
 */
/* THE ROW'S TITLE IS THE CLAIM; THE BAR IS WHAT THE CLAIM IS MADE OF.
   The first build of this drew the three segments and DROPPED the headline --
   "over half never reach the goalie" -- which is the one number §4 of the audit
   says the card exists to make checkable. The split was visible and the thing it
   was a split OF had vanished. Caught by the panel's own win-rate test, which
   asks for `51.9%` by value; a design that shows a composition and never names
   the total it composes is the same defect as a chart with no axis. */
function mixRow(cls,title,claim,scope,parts){
 const tot=parts.reduce((t,p)=>t+p.v,0)||1;
 let x=0;
 const rects=parts.map(p=>{const w=100*p.v/tot;
   const r=`<rect class="${p.k}" x="${x.toFixed(3)}" y="0" width="${w.toFixed(3)}" height="8"/>`;
   x+=w;return r;}).join('');
 const keys=parts.map(p=>`<span><i class="${p.k}"></i>${p.pct
   ?`<b>${(100*p.v/tot).toFixed(1)}%</b> ${p.lab}`
   :`<b>${p.v}</b> ${p.lab}`}</span>`).join('');
 /* THE CLAIM GETS ITS OWN LINE, AND THE REASON IS WHO IS HOLDING THE DEVICE.
    Title, claim and scope in one wrapping flex gives four ragged lines on a
    phone. Both layouts were measured: inline is 320px at 1100 and 538 at 390;
    stacked is 341 and 516. The first version of this comment took the inline
    one because "Kevin's stated viewing perspective is the laptop" -- and then
    Kevin: "I use a laptop but my wife will use her phone to view the site."
    SHE IS THE NOVICE TESTER. The audience this whole site is built for is on the
    smaller screen, so 21px of laptop buys 22px of phone and the trade reverses.
    A layout optimised for the person who already understands the product is the
    wrong optimisation, and it was one question away from being caught. */
 return `<div class="mix ${cls}"><p class="mixhd">${title}<span class="n">${scope}</span></p><p class="mixcl">${claim}</p>`
  +`<div class="mixbar"><svg viewBox="0 0 100 8" preserveAspectRatio="none">${rects}</svg></div>`
  +`<p class="mixkey">${keys}</p></div>`;}
function drawBlocked(B,L,slice){
 const mate=B.teammate.length,unk=B.unknown.length;
 /* THE PER-TEAM COUNTER ROW IS GONE, AND ON MERIT RATHER THAN FOR SPACE (CHENG).
    `12 · 7 · SHOTS BLOCKED` is the confounded comparison rendered as a
    scoreboard. This layer's own audit established that blocks are a near-mirror
    of the attempt count -- the team blocking more was the team attempting fewer
    81.7% of the time -- so a reader seeing 12 against 7 concludes something about
    grit or defensive commitment when they are looking at the attempt
    differential backwards. That is the reading the audit spent its length
    killing, and cutting the row removes it structurally instead of disclaiming
    it. It was also the largest single saving on the list: 48px at every width. */
 // WHAT HAPPENED TO EVERY ATTEMPT, from the SAME ledger the counters come from,
 // classified by the feed's own event type. `reached the goalie` is a shot on
 // goal or a goal, which is exactly how the archive's `reachedTheGoalie` is
 // derived -- so the two rows are the same quantity and not two similar ones.
 const g={r:0,b:0,m:0};
 L.counted.forEach(id=>{const t=slice[id].type;
   if(t==='blocked-shot')g.b++;else if(t==='missed-shot')g.m++;else g.r++;});
 const att=L.counted.length;
 // THE SAME FRAME, EACH IN ITS OWN UNIT, AND BOTH NAMING THEIR DENOMINATOR.
 // Kevin: "this game shows 5 of 12 and the archive shows a percentage — two
 // different units expressing the information." True, and it cannot be fixed by
 // picking one unit: the denominators are 12 and 491,971, and a percentage lies
 // about the small one (one block moves it eight points; that exact defect was
 // deleted from this card a day earlier, its third instance) while a raw
 // fraction is unreadable on the big one.
 // So the FRAME is made identical -- `<value> of <n> attempts never reach...` in
 // both -- and each denominator is stated inside the claim rather than off in the
 // scope. The units then differ visibly BECAUSE the denominators do, which is the
 // thing worth teaching rather than a puzzle left for the reader.
 /* WHY IT COULD MATTER, AND IT IS A DISAGREEMENT RATHER THAN AN IMPLICATION.
    Kevin: "we provide the data but we don't offer why it could matter." The one
    shape that survives this project's constraints is not "this predicts the
    winner" but "this counts something the familiar number does not"
    (docs/why-it-matters.md §2). Both numbers are already on the card; the
    sentence is what turns a subtraction most readers will not perform into the
    point of the layer.
    THE NUMBER IS THE BOX SCORE'S OWN. The NHL's `shots on goal` is saves plus
    goals, which is `shot-on-goal + goal` -- exactly how this card already defines
    `reached the goalie`. So it is the same quantity, not a near-equivalent.
    ONLY AT ALL SITUATIONS. With the even-strength filter on, `g.r` is the
    even-strength shots on goal and no box score reports that, so the sentence
    would be false about the thing it names. It says nothing then rather than
    saying it loosely -- the same answer the whistle layer gets in §3 of the
    audit, for the same reason. */
 const why=(att&&!evenOnly)?`<p class="mixwhy">A box score would show <b>${g.r}</b> `
   +`${g.r===1?'shot':'shots'}. This game has had <b>${att}</b> `
   +`${att===1?'attempt':'attempts'}.</p>`:'';
 const game=att?mixRow('game','This game',
   `<b>${g.b+g.m}</b> of <b>${att} ${att===1?'attempt':'attempts'}</b> never reached the goalie`,
   `${MODE()}`,
   [{k:'r',lab:'reached the goalie',v:g.r},
    {k:'b',lab:'blocked by a body',v:g.b},
    {k:'m',lab:'missed the net',v:g.m}])
  :`<p class="bksay">Nothing shot yet — no attempts in what you have watched so far.</p>`;
 // 7.8% of blocks across the archive are by the shooter's own side. It is real
 // hockey and it is the thing a novice has never considered, so it is stated
 // rather than folded into a total nobody can take apart.
 // AND THE WORDING HAD TO CHANGE WITH THE BAR, not just shorten. It said these
 // were "in neither total above", which was true of the two per-team counters
 // and is FALSE of the bar -- they ARE among its blocked shots. A sentence that
 // refers to another element by what it contains has a dependency nothing in a
 // text file can see; the bar arriving above it made the sentence wrong without
 // touching it.
 const mates=mate?`<p class="bkmate">${mate} of ${mate===1?'those blocks hit':'those blocks hit'} a teammate — `
   +`still blocked, but nobody defended ${mate===1?'it':'them'}, so neither bench is credited.</p>`:'';
 const un=unk?`<p class="bkmate">${unk} carried no blocker we could resolve, and ${unk===1?'is':'are'} in neither total.</p>`:'';
 // THE ARCHIVE ROW IS NO LONGER READ-ONCE PROSE, so it is no longer a candidate
 // for R's treatment: it is half the picture, and gating it would delete the
 // comparison rather than trim it. What shrank instead is its limit line, from a
 // paragraph to one line -- the population and the one caveat that a share of
 // attempts is not a rate of winning.
 // Absent on the inlined page, which reaches nothing -- and it says WHICH of
 // those two it is rather than implying a failure. Same rule as `noCurveReason`.
 const M=RATES&&RATES.attemptMix, BT=M&&M.byType;
 const arch=BT&&M.blocked&&M.blocked.n
  ?mixRow('arch','The archive',
    `<b>${(100*M.neverReachedTheGoalie.rate).toFixed(1)}%</b> of <b>${M.blocked.n.toLocaleString()} attempts</b> never reach the goalie`,
    `${M.games.toLocaleString()} games · ${ESC(M.blocked.population)} · all situations`,
    [{k:'r',lab:'reached the goalie',v:(BT['shot-on-goal']||0)+(BT.goal||0),pct:1},
     {k:'b',lab:'blocked by a body',v:BT['blocked-shot']||0,pct:1},
     {k:'m',lab:'missed the net',v:BT['missed-shot']||0,pct:1}])
   /* THE CAVEAT IS GONE, AND NOT FOR SPACE. "A share of the attempts taken, not
      a rate of winning" was compensating for an ambiguity THE NEW FRAME REMOVED.
      It was written when the line read "27.8% are blocked by a body" and never
      said what the 27.8% was OF -- a bare percentage beside two team names can be
      misread as a win rate, and CHENG's ruling on this panel exists because that
      misreading is the one a novice makes. `51.9% of 491,971 attempts never reach
      the goalie` cannot be read that way: every number on this card now names its
      own denominator. The guard survives it -- the panel's win-rate test is on
      the PROSE, and asks that no outcome verb appears here at all.
      What the line also carried -- the games count and the population -- was
      doctrine and has moved into the row's scope, where it is always visible
      rather than in a paragraph below the fold on a phone. */
  :`<p class="bkarch">No archive comparison shown — ${RATES===undefined?'this page carries a single game and never asks for the archive':'the archive shares could not be loaded'}.</p>`;
 $('blockPanel').innerHTML=game+why+mates+un+arch;}

/* WHAT A FIRST-TIME VIEWER IS TOLD, and it answers three questions Kevin
   predicted a casual fan would ask, in his words:
     "where should I click"          -> press play, then add a layer
     "why should I click there"      -> to see WHY one team was on top
     "what's corsi (and why do I care)" -> the archive's own inversion
   THE HOOK IS A FACT ABOUT HOCKEY, NOT ABOUT THIS GAME. "This game is unusual"
   was the earlier proposal and Kevin killed it: unusual is stated in a
   vocabulary a novice has not learned, and it is the LAST thing you learn, not
   the first. You learn what an attempt is, then that the team with more of them
   usually loses, and only then can you judge one game against that. So the line
   below is true of every game and needs no prior knowledge -- which is exactly
   what eventually lets a viewer decide for themselves what is unusual.
   THE COPY IS A DRAFT AND THE SEAM IS THE POINT (Kevin's own rule: mechanism,
   not policy). The novice test revises these words; it should not have to
   revise the machinery. */
function drawNewcomer(){
 const el=$('newcomer'); if(!el)return;
 const R2=RATES&&RATES.baseRates&&RATES.baseRates.moreAttemptsLost;
 // The site's whole reason to exist, stated on the page that DEMONSTRATES it.
 // It has been on the homepage and nowhere a visitor to this page could read it.
 const why=R2&&R2.n
   ?`<span class="nwhy">Across the whole archive, <b>the team with more shot `
    +`attempts loses more often than it wins</b> — ${R2.count.toLocaleString()} of `
    +`${R2.n.toLocaleString()} games. <b>Control</b> counts those attempts, so you can `
    +`watch it happen.<span class="lim">${ESC(R2.population)} · one game is still one game.</span></span>`
   :'';
 // SPLIT BY SUBJECT, and measuring is what forced it. Whole, above the rink,
 // this block ran to 478px on a 390px phone -- the rink ended at 899 and the
 // play button at 914, against a fold of 844. It told a first-time viewer to
 // press a button that was not on their screen.
 // So the instruction lives where PLAY is, and the reason to add a layer lives
 // where the LAYERS are. Same rule as the control notes, one level up: a
 // sentence belongs beside the thing it is about.
 // NO POSITIONAL WORD. It read "Press ▶ Play from start BELOW", and measured in
 // a browser that claim holds at 390x844 with 171px to spare and FAILS at
 // 360x640 by 21px -- the button entirely off screen for the one reader the
 // sentence addresses. Splitting this block was the fix for exactly that defect
 // at 390; nobody re-measured it smaller, and a margin that survives one
 // viewport is a constant that drifts with the next one.
 // The structural fix is to stop making the claim. The button's own label is
 // quoted verbatim, which is what a reader searches for, and a sentence that
 // asserts no position cannot have a stale one at any width. Same rule that
 // stopped this paragraph enumerating the layers.
 el.innerHTML=`<b>New here?</b> Press <b>▶ Play from start</b> and just watch — every play `
  +`is named as it happens, and goals are called with the <b>scorer and assists</b>. `
  +`Nothing is invented: every number here comes from the league's own record of the game.`
  +`<button class="ndone" id="nDone">I have got the hang of it — hide this</button>`;
 const w=$('newcomerWhy');
 if(w)w.innerHTML=`<b>Why add a layer?</b> Because the obvious reading of a game is often `
  +`the wrong one.`+why
  +`<span class="nwhy">Every layer shows its work — the events it counted, the ones it did `
  +`not, and why.</span>`;
 $('nDone').addEventListener('click',()=>{
  // An explicit dismissal outranks the counter, and it is remembered. A tip you
  // cannot turn off is an advert.
  try{localStorage.setItem('rtg.seen',new Date().toISOString().slice(0,10)+'|99');}catch(e){}
  document.getElementById('rg').classList.remove('newcomer');});}
document.getElementById('rg').classList.toggle('newcomer',NEWCOMER);
drawNewcomer();
let corsiOn=false,hdOn=false,goalieOn=false,whistleOn=false,blockOn=false;
function setCorsi(){document.getElementById('rg').classList.toggle('corsi',corsiOn);$('lyCorsi').setAttribute('aria-pressed',corsiOn);$('lyCorsi').textContent=(corsiOn?'✓ ':'＋ ')+'Control (Corsi)';if(!corsiOn&&workOpen){workOpen=false;$('workPanel').hidden=true;$('work').setAttribute('aria-expanded',false);$('work').textContent='Show me the work';}}
function setHd(){document.getElementById('rg').classList.toggle('slot',hdOn);$('lyHd').setAttribute('aria-pressed',hdOn);$('lyHd').textContent=(hdOn?'✓ ':'＋ ')+'Shots from the slot';render(i,'');}
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
function setStrength(v){evenOnly=(v==='even');syncStrength();render(i,'');}
document.querySelectorAll('#rg .sbtn').forEach(b=>b.addEventListener('click',()=>setStrength(b.dataset.s)));
syncStrength();
function syncTrails(){document.querySelectorAll('#rg .tbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===trails));}
document.querySelectorAll('#rg .tbtn').forEach(b=>b.addEventListener('click',()=>{
 trails=b.dataset.t;syncTrails();render(i,'');}));
syncTrails();
function syncFig(){document.querySelectorAll('#rg .fbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===figStyle));}
document.querySelectorAll('#rg .fbtn').forEach(b=>b.addEventListener('click',()=>{
 figStyle=b.dataset.f;try{localStorage.setItem('rtg.fig',figStyle)}catch(e){}syncFig();render(i,'');}));
syncFig();
$('lyHd').addEventListener('click',()=>{hdOn=!hdOn;setHd();});
function goalieStats(k){return goaltending.reduce(upto(k),CTX).g;}
function setGoalie(){document.getElementById('rg').classList.toggle('goalie',goalieOn);$('lyGoalie').setAttribute('aria-pressed',goalieOn);$('lyGoalie').textContent=(goalieOn?'✓ ':'＋ ')+'Goaltending';render(i,'');}
$('lyGoalie').addEventListener('click',()=>{goalieOn=!goalieOn;setGoalie();});
function setWhistle(){document.getElementById('rg').classList.toggle('whistle',whistleOn);$('lyWhistle').setAttribute('aria-pressed',whistleOn);$('lyWhistle').textContent=(whistleOn?'✓ ':'＋ ')+'Why play stopped';render(i,'');}
$('lyWhistle').addEventListener('click',()=>{whistleOn=!whistleOn;setWhistle();});
function setBlock(){document.getElementById('rg').classList.toggle('blocked',blockOn);$('lyBlock').setAttribute('aria-pressed',blockOn);$('lyBlock').textContent=(blockOn?'✓ ':'＋ ')+'Blocked shots';render(i,'');}
$('lyBlock').addEventListener('click',()=>{blockOn=!blockOn;setBlock();});
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
 [blocked.id]:()=>{blockOn=true;setBlock();},
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
set(frameOf(AT.index),'jump');
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
 /* ⭐ THE PREVIEW RUNS WITH A LAYER ON, and Control is the one.

    THE HERO USED TO CONTRADICT THE HEADLINE ABOVE IT. The h1 promises "the
    counts built in front of you, so you can see where a number comes from" and
    the frame under it showed plays with no counts anywhere. The stated
    conversion is a visitor watching one game WITH ONE METRIC LAYER TURNED ON, so
    the front door was demonstrating the single configuration that is not it.

    IT STARTS AT ZERO ON PURPOSE, and the small number is the point rather than a
    cost. The persuasive Corsi sentence is "the scoreboard says 0-0, attempts say
    12-7" and none of it fits in seven plays -- but the headline does not promise
    a big number, it promises PROVENANCE, and a counter you join at 24-11 is a
    number you did not watch being built. Zero is the only honest place for
    "where a number comes from" to begin, which is the same reason the loop opens
    at the faceoff instead of the final whistle.

    CALLED THROUGH setCorsi() RATHER THAN SETTING THE CLASS. The layer's on-state
    is a class, a button label and an aria-pressed value, and reaching past the
    function for the one part the preview happens to need is how the two drift.

    THIS DELIBERATELY DOES NOT UNHIDE `.counters`. The board's `.cbar` carries the
    bar and both counts already and is outside the preview's hide list; the
    counters repeat the same two numbers larger, INSIDE the rink box, where the
    only thing they can spend is ice. And the board figures are counts, not a
    percentage -- CHENG's ruling that `11` beside `8` claims exactly what it is --
    so the compact form is not a rate that has lost its denominator. */
 corsiOn=true;setCorsi();
 let acc=0,W=0;
 while(W<EV.length-1&&acc+dwell(EV[W])<=BUDGET_MS){acc+=dwell(EV[W]);W++;}
 const WINDOW=Math.max(1,W);
 if(REDUCED){set(WINDOW,'');}
 else{let k=0;
  /* THE RESTART PAUSE USED TO BE DEAD CODE. It read
       set(k);k++;if(k>WINDOW){k=0;}
       setTimeout(tick,k>WINDOW?900:115)
     -- and k had already been reset to 0 by the time the ternary asked, so the
     900 never fired once. The loop restarted at full speed, which is its own
     small contribution to the blur. Decide the wait BEFORE moving k. */
  const tick=()=>{
   const shown=EV[k],last=k>=WINDOW,wait=last?1500:dwell(shown);
   set(k,k>0?'play':'');
   if(last){k=0;prevA=0;prevH=0;}else{k++;}
   setTimeout(tick,wait);};
  tick();}}
}
__BOOT__
</script>"""

LIB = ["rink.js", "attribution.js", "layer.js", "strength.js", "svgpen.js", "figures.js",
       "layers/corsi.js", "layers/goaltending.js", "layers/danger.js", "layers/whistle.js",
       "layers/blocked.js",
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
