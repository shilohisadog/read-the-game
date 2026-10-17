"""LAB ONLY: after `npm run build`, turn the built site into the lab.

Loads src/lab/lab.js on the replay pages, loosens each page's CSP just enough
for it (scripts from 'self'; inline styles, which a hash list would forbid),
adds the LAB badge, and keeps the lab out of search. Run from the repo root.
"""
import pathlib, re

SRC = pathlib.Path("src")
BADGE = ('<div style="position:fixed;bottom:6px;left:6px;z-index:99999;background:#7c3aed;color:#fff;'
         'font:700 11px/1 system-ui;padding:4px 7px;border-radius:5px;letter-spacing:.08em;'
         'pointer-events:none">LAB</div>')
REPLAY = {"game.html", "read-the-game.html"}

for page in SRC.glob("*.html"):
    s = page.read_text()
    s = re.sub(r"script-src ", "script-src 'self' ", s, count=1)
    s = re.sub(r"style-src [^;\"]*", "style-src 'self' 'unsafe-inline'", s, count=1)
    if page.name in REPLAY:
        s = s.replace("</body>", '<script type="module" src="/lab/lab.js"></script>\n</body>', 1)
    else:
        s = re.sub(r"(<body[^>]*>)", r"\1" + BADGE, s, count=1)
    page.write_text(s)
(SRC / "robots.txt").write_text("User-agent: *\nDisallow: /\n")
(SRC / "_headers").write_text("/*\n  X-Robots-Tag: noindex, nofollow\n")
print("lab: prepared", len(list(SRC.glob("*.html"))), "pages")
