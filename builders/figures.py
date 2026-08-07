#!/usr/bin/env python3
"""The player figure — one canonical source, inlined into every app.

THE FIGURE ITSELF NOW LIVES IN src/lib/figures.js -- a real ES module that node
can import and tests can exercise. This file only inlines it for the browser,
because the apps are single self-contained files with no network access, so
sharing code has to happen at build time.

One definition, three apps, two drawing surfaces: the goalie's-eye view and the
bench pass a canvas context, the 2D rink passes an SvgPen (src/lib/svgpen.js),
and the figure does not know or care which.

Two styles ship, and which one you see is a viewer setting:

  mascot    the default. Big head, soft shapes, a face. Reads at small sizes
            and reads as friendly — the on-ramp for someone new to the game.
  tabletop  the rod-hockey tin man. Flat colour, heavy outline, stiff fused
            pose, standing on its peg. Reads as a game piece.

Both are MARKERS, not claims. A figure says "a real shot came from here, and
this is what happened to it". The pose encodes the outcome we actually have in
the feed (saved / scored) and nothing else. Neither style asserts anything
about how a player stood, moved, or skated — we don't have that data, so we
don't draw it.

Call signature (identical for both, so they are interchangeable):

  FIG[style](g, px, py, size, jersey, out, o)

  g       canvas 2d context      px,py  the figure's FEET, in canvas px
  size    height in px           jersey team colour
  out     'goal' | 'save'        o      { t, motion, glow, light }
"""
import pathlib, re

def _load_js(name):
    """Inline a real ES module for the browser.

    The figure JS used to live here as a Python string, which meant node could
    not import it and nothing could test it. It is now src/lib/figures.js -- a
    real module -- and this reads it so there is exactly ONE definition of the
    player shared by the 2D rink, the goalie's-eye view and the bench.
    """
    src = (pathlib.Path(__file__).resolve().parent.parent / "src" / "lib" / name).read_text()
    body = re.sub(r"^[ \t]*import(?=[\s{'\"*])[^;]*?;[ \t]*$", "", src, flags=re.M)
    return body.replace("export ", "")


FIGURES_JS = _load_js("figures.js")

# The picker, so every app offers the same choice with the same words.
PICKER_CSS = r"""
#gv .figpick{display:flex;gap:7px;align-items:center;margin-top:11px;flex-wrap:wrap}
#gv .figpick .fl{font-size:.8rem;color:var(--muted);font-weight:700}
#gv .fbtn{font:inherit;font-size:.82rem;font-weight:600;border-radius:8px;border:1px solid #24384a;
 background:#0e1b27;color:var(--muted);padding:8px 12px;cursor:pointer}
#gv .fbtn[aria-pressed="true"]{border-color:#4aa3e0;color:#fff;background:#12283a}
#gv .fwhy{font-size:.75rem;color:var(--muted);margin:7px 2px 0;max-width:66ch;line-height:1.5}
"""

PICKER_HTML = r"""<div class="figpick"><span class="fl">Players:</span>
<button class="fbtn" data-f="mascot" aria-pressed="true">Mascot</button>
<button class="fbtn" data-f="tabletop" aria-pressed="false">Tabletop</button></div>
<p class="fwhy">Same shots, same outcomes, same math &mdash; only the drawing changes.
<b>Tabletop</b> is the rod-hockey player you grew up with.</p>"""

PICKER_JS = r"""
let figStyle=(function(){try{return localStorage.getItem('rtg.fig')||'mascot'}catch(e){return 'mascot'}})();
if(!FIG[figStyle])figStyle='mascot';
function syncFig(){document.querySelectorAll('#gv .fbtn').forEach(b=>
 b.setAttribute('aria-pressed',b.dataset.f===figStyle));}
document.querySelectorAll('#gv .fbtn').forEach(b=>b.addEventListener('click',()=>{
 figStyle=b.dataset.f; try{localStorage.setItem('rtg.fig',figStyle)}catch(e){} syncFig(); draw();}));
syncFig();
"""
