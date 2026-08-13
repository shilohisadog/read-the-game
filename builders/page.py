#!/usr/bin/env python3
"""The document shell — the one place that knows what a complete HTML page is.

WHY THIS FILE EXISTS, AND IT IS AN INHERITED ASSUMPTION THAT STOPPED BEING TRUE.

Every view on this site began life as a Claude artifact. That host wraps whatever
you give it in `<!doctype html><html><head>…</head><body>`, so the fragments were
complete pages *in that context* and nobody had to think about it. They were then
copied into a real static site, where nothing wraps anything — and eight of nine
pages shipped with no doctype, no `<head>`, no `<title>` and, decisively, **no
viewport meta**.

The consequences are not cosmetic:

  NO VIEWPORT META   a phone lays the page out at a ~980px virtual width and then
                     scales it down. Everything is legible-in-principle and
                     unreadable in practice, and every tap target shrinks with it.
                     This is the whole of the mobile problem and it is one line.
  NO DOCTYPE         quirks mode. The browser deliberately emulates a 1990s box
                     model, which is not the one any of this CSS was written for.
  NO <title>         the browser tab shows a URL. So does a shared link's preview.
  NO lang            a screen reader guesses the language.

None of it surfaced because none of it FAILS. The page renders, the tests pass,
and a desktop browser is forgiving enough that the only symptom is on a device
the author was not using. Kevin asked about phones and that is what surfaced it.

So the shell is centralised rather than copied into eight builders: one
definition, one place to fix, and `test/document.test.js` asserts every page in
`src/` came through here.
"""



# ---------------------------------------------------------------------------
# THE CHROME: a header and a footer that no page can be without.
#
# `game.html` shipped with ZERO href attributes -- not one link on the entire
# page. The shareable unit of this site is a game, which is precisely why
# game.html is the landing page, so the stranger arriving from a shared link
# reached a DEAD END: no route to the archive, to a team, or to any explanation
# of what they were looking at. Two reviewers redesigned the homepage in the same
# week without either of us noticing, because we each reviewed the page we were
# shown rather than asking which page receives traffic.
#
# IT LIVES HERE FOR THE SAME REASON THE VIEWPORT TAG DOES. This file exists
# because eight of nine pages shipped without `<meta name=viewport>` -- not from
# carelessness, but because the rule had to be re-applied in every builder and
# nothing checked that it was. A header added builder-by-builder is that defect
# waiting to recur. Put it in the shell and a page cannot lack it; there is
# nowhere to forget it. Third instance of this shape in one week, after `place()`
# and `inShootout`.
#
# It already paid: `goalie-eye-view.html` carried no no-marks statement at all.
# Nobody found that by looking. It fell out of the rule getting a home.
#
# INLINE, NEVER A STYLESHEET. `build_main.py::_csp` hashes the <style> and
# <script> bytes of the WRAPPED document, so chrome CSS added here is inside the
# hash -- but an external stylesheet is exactly what the CSP forbids, and the
# failure would land in a browser after deploy rather than in the build.
# `test/document.test.js` asserts it at build time instead.
CHROME_CSS = """<style>
.sitehdr,.sitefoot{font:500 .9rem/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
 background:#f4f7fa;color:#0f1a23;-webkit-text-size-adjust:100%}
.sitehdr{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 18px;
 padding:12px 16px;border-bottom:1px solid #ccd8e0}
.sitehdr a{color:#0f1a23;text-decoration:none}
.sitehdr .mark{font-weight:800;letter-spacing:.02em;margin-right:auto}
.sitehdr nav{display:flex;flex-wrap:wrap;gap:6px 16px}
.sitehdr nav a{color:#2a5d86;text-decoration:none;padding:2px 0;border-bottom:1px solid transparent}
.sitehdr nav a:hover,.sitehdr nav a:focus{border-bottom-color:#2a5d86}
.sitehdr nav a[aria-current="page"]{color:#0f1a23;border-bottom-color:#0f1a23}
.sitefoot{border-top:1px solid #ccd8e0;padding:18px 16px 28px;color:#5b6d7a;font-size:.82rem}
.sitefoot p{margin:0 0 7px;max-width:70ch}
.sitefoot a{color:#2a5d86}
@media (max-width:420px){.sitehdr{padding:10px 12px}.sitefoot{padding:14px 12px 22px}}
</style>"""

# Only destinations that EXIST. A nav link to a page we have not built yet is a
# 404 wearing a plan, and `test/document.test.js` resolves every one of these
# against `src/` so it cannot be added ahead of its page.
_NAV = [("/", "Watch a game"), ("/#teams", "Teams")]


def _header(current=None, minimal=False):
    """The bar above everything.

    NOT STICKY, and that is a decision rather than an omission. The rink is wide
    and the deploy gate measures a real 360 CSS px viewport; a sticky header eats
    the viewport on exactly the device that can least afford it.

    `minimal` is for the game page. CHENG's ruling, and it dissolved a question I
    had asked badly: I framed it as "converting a stranger versus interrupting a
    viewer", and those are not simultaneous. The stranger arrives BEFORE the game,
    the viewer exists DURING it, and the moment that matters is neither -- it is
    when the game ENDS, at peak curiosity, which is below the rink and not above
    it. So the header answers only "where am I", and the funnel lives underneath.
    """
    if minimal:
        return ('<header class="sitehdr"><a class="mark" href="/">Read the Game</a>'
                '<nav><a href="/">What is this?</a></nav></header>')
    links = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if href == current else ""}>{label}</a>'
        for href, label in _NAV)
    return ('<header class="sitehdr"><a class="mark" href="/">Read the Game</a>'
            f"<nav>{links}</nav></header>")


def _footer():
    """The attribution and the limits, on every page rather than on most of them.

    `goalie-eye-view.html` had no no-marks statement. That is not a page anyone
    would have thought to check, which is the argument for centralising in one
    sentence.
    """
    return (
        '<footer class="sitefoot">'
        "<p>Game data from the NHL's public play-by-play feed, fetched once and "
        "stored. Not affiliated with or endorsed by the NHL. <strong>No NHL or club "
        "logos, wordmarks or crests appear anywhere on this site</strong> — teams are "
        "identified by colour and three-letter abbreviation only.</p>"
        '<p><a href="https://github.com/shilohisadog/read-the-game">Source on GitHub</a>'
        " — every number here is a function of stored events, and you can read the "
        "function.</p>"
        "</footer>")


def document(body, *, title, description=None, url=None, head="", lang="en",
             chrome="full", current=None):
    """Wrap a fragment in a complete, mobile-correct HTML document.

    `head` is for anything page-specific — the hash-pinned Content-Security-Policy
    is stamped there by callers AFTER the body is final, because the hashes cover
    the bytes of the <script> and <style> the body contains. Wrapping does not
    touch those bytes, so it cannot invalidate a hash.
    """
    parts = [
        "<!doctype html>",
        f'<html lang="{lang}">',
        "<head>",
        '<meta charset="utf-8">',
        # THE LINE THE WHOLE FILE IS ABOUT. Without it a phone renders at ~980px
        # and scales down; with it the page gets the device's real width.
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        f"<title>{title}</title>",
    ]
    if description:
        parts.append(f'<meta name="description" content="{description}">')
        # SHARING IS THE DISTRIBUTION MODEL. The shareable unit is a game, so the
        # link someone posts in a hockey forum IS the front door -- and without
        # these it arrives as a naked URL instead of a card. CHENG's point, and it
        # is product rather than doctrine. No og:image yet: we have no artwork we
        # are allowed to ship, since club marks are off the table by design.
        parts += [
            '<meta property="og:type" content="website">',
            f'<meta property="og:title" content="{title}">',
            f'<meta property="og:description" content="{description}">',
            '<meta name="twitter:card" content="summary">',
            f'<meta name="twitter:title" content="{title}">',
            f'<meta name="twitter:description" content="{description}">',
        ]
        if url:
            parts.append(f'<meta property="og:url" content="{url}">')
    parts.append(CHROME_CSS)
    if head:
        parts.append(head.rstrip("\n"))
    parts += ["</head>", "<body>",
              _header(current=current, minimal=(chrome == "minimal")),
              body.rstrip("\n"),
              _footer(),
              "</body>", "</html>", ""]
    return "\n".join(parts)
