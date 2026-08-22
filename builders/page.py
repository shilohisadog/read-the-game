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
import base64, hashlib, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def competitions():
    """gameType -> name, from the one table both languages read.

    HERE BECAUSE THREE BUILDERS NEED IT. `derive.py` walks the archive against
    it, `build_index.py` inlines it for the calendar and generates the front
    door's exclusion list from it, and `build_main.py` inlines it so the verdict
    card can say WHICH competition a game belongs to. A second `json.loads` of
    the same file is harmless; a second copy of its CONTENTS would be the defect
    this project keeps almost building, and one reader makes that impossible to
    start. The `_` key is the file's own explanation of itself and is dropped.
    """
    names = json.loads((ROOT / "data" / "competitions.json").read_text())["names"]
    return json.dumps(names, sort_keys=True, separators=(",", ":"))


def csp(html, *, connect=None):
    """A Content-Security-Policy the BROWSER enforces, replacing a grep we wrote.

    ONE COPY, AND THE BUG IS THE ARGUMENT FOR IT. This lived in `build_main.py`
    and `build_index.py`, differing by a single blank line, and when the shared
    chrome added a second <style> both copies were wrong in the same way and both
    had to be found. If only one had been, one page ships unstyled. The second
    copy is where the wrong number hides -- this project's own repeated lesson --
    and it belongs beside `document()` for exactly the reason the chrome does
    (CHENG).

    The deploy gate used to assert a page calls nobody by grepping for `fetch(`,
    `XMLHttpRequest` and friends. That is a blacklist over an open vocabulary and
    cannot close -- it misses import(), EventSource, sendBeacon, new Image().src
    and window["fetch"]. So the claim stops being ours to assert:
    `default-src 'none'` permits nothing, and the only destination named is the
    data origin. A page calling anywhere else is stopped by the browser, not by
    our confidence.

    HASH-PINNED rather than 'unsafe-inline', which makes it a third integrity
    gate -- enforced past our CI and onto the reader's machine.
    """
    def h(pattern, open_tag):
        # EVERY BLOCK, NOT THE FIRST. This was `re.search`, which silently
        # assumed a document holds exactly one <style> and one <script> -- true
        # of every page here until the shared chrome added a second <style> in
        # <head>. The policy then pinned the CHROME's 957 bytes and left the
        # page's own 14 KB stylesheet unhashed, so a browser would have refused
        # it and rendered the page entirely unstyled. Nothing in the node suite
        # can see that: the fake DOM has no CSS at all.
        #
        # A MISSING hash is worse than a stale one. A stale hash blanks the page;
        # a missing hash unstyles it, so it renders and merely looks broken.
        blocks = re.findall(pattern, html, re.S)
        # COUNT, DON'T JUST REQUIRE ONE. `assert blocks` was protecting against
        # the REGEX failing to match, and it read as "every page has a script" --
        # which stopped being true the moment two sections of the home page
        # became pages of their own, with nothing to run. Comparing the matches
        # to the number of opening tags is the claim that was always meant: the
        # policy pins ALL of them, and a page with none is a legitimate state
        # rather than a build failure. A missing hash is worse than a stale one
        # (a stale hash blanks the page; a missing one lets it render broken),
        # so this stays an assert and not a warning.
        assert len(blocks) == html.count(open_tag), (
            f"CSP matched {len(blocks)} of {html.count(open_tag)} {open_tag} blocks")
        return " ".join(
            "'sha256-" + base64.b64encode(
                hashlib.sha256(b.encode()).digest()).decode() + "'"
            for b in blocks)

    # ⭐ THE ONE THIRD PARTY, NAMED, AND IT IS A DELIBERATE PURCHASE.
    #
    # Kevin turned Cloudflare Web Analytics on. The zone then injects
    #   <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/…"
    #           data-cf-beacon='{"token":"…"}' integrity="sha512-…" crossorigin>
    # into every BROWSER request -- user-agent gated, which is why a plain curl
    # sees nothing and the deploy gate's Chrome agent sees it.
    #
    # Until now `script-src` was hashes only, so the browser REFUSED it: the
    # beacon collected nothing, logged a violation on every page load, and broke
    # the published-bytes check. Turning it on properly is one named origin, not
    # 'self' -- 'self' would admit ANY same-origin script, and the value of this
    # policy is that it has caught real defects (13 refused inline styles that
    # were silently killing team colours).
    #
    # THE INLINE PINNING IS UNTOUCHED. Every <script> and <style> block this
    # site writes is still matched by SHA-256; a host source is a union with the
    # hashes, not a replacement for them. What widens is exactly one thing:
    # scripts served by static.cloudflareinsights.com. Nothing else moved.
    #
    # AND THE SITE STOPS SAYING IT CALLS NOBODY. That claim was true and is not
    # any more -- see the README and the standalone game page's archive note,
    # both corrected in the same commit. Kevin: "we don't need to make the claim
    # of no network egress."
    # ONE ORIGIN, NOT TWO, AND THE SECOND WAS REMOVED BY MEASUREMENT. The first
    # version of this also put https://cloudflareinsights.com in connect-src, on
    # the assumption the beacon reports to the vendor. IT DOES NOT: watched in a
    # real browser, the report is
    #     POST https://readthegame.co/cdn-cgi/rum?
    # which is SAME-ORIGIN and already covered by connect-src 'self'. The extra
    # entry admitted a third party for nothing.
    #
    # Safe to remove because a mistake here is LOUD: the deploy's policy-refusal
    # step fails on any CSP violation on the live page, so if the beacon ever
    # needs that origin the gate says so rather than the data quietly stopping.
    beacon_script = "https://static.cloudflareinsights.com"
    return "; ".join([
        "default-src 'none'",
        f"script-src {h(r'<script>(.*?)</script>', '<script>')} {beacon_script}".strip(),
        f"style-src {h(r'<style>(.*?)</style>', '<style>')}",
        # ⭐ LEAST PRIVILEGE, AND THE DEPLOY GATE IS WHY IT STOPPED BEING
        # OPTIONAL. `connect` used to be required and every page passed the data
        # origin, so `what-you-can-see.html` and `workshop.html` -- which fetch
        # nothing at all -- declared permission to reach the archive. That was
        # merely untidy until the deploy step began READING this directive to
        # decide which pages are allowed to call out: a page claiming a reach it
        # does not use then exempts itself from the check meant to hold it.
        # `'self'` stays for every page, because the Cloudflare RUM beacon POSTs
        # same-origin to /cdn-cgi/rum.
        f"connect-src 'self' {connect}".strip() if connect else "connect-src 'self'",
        # The homepage frames the game page for its five-second preview, and
        # `frame-src` has no fallback to default-src -- 'none' would block it.
        #
        # `frame-ancestors 'self'` USED TO SIT HERE, described in this comment as
        # "the other half: nobody else's page may put this one in a frame". It
        # never did that. The directive is IGNORED when the policy is delivered
        # in a <meta> element -- the spec says so, and Chrome says so out loud on
        # every single page load:
        #
        #   "The Content Security Policy directive 'frame-ancestors' is ignored
        #    when delivered via a <meta> element."
        #
        # Nobody heard it because nothing was reading the console; the gate that
        # claimed to read it was greping a log Chrome was not writing to. Fixing
        # THAT is what surfaced this, on the first run where the grep could match.
        #
        # So the claim goes rather than being softened. Making it real needs an
        # HTTP header, which on Cloudflare Pages means a `_headers` file -- a
        # deploy-shaped change, on the build list, not smuggled in here. What
        # remains is true: `frame-src 'self'` governs what WE may frame, and it
        # does work in <meta>.
        "frame-src 'self'",
        "base-uri 'none'", "form-action 'none'",
    ])



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
/* PREVIEW HAS NO ROOM FOR CHROME. The five-second loop on the front door is an
   iframe of the game page, and the shared header and footer are real height
   inside a box sized for a rink -- they push the ice past the bottom edge, and
   `scrolling=no` crops it. The class is set by the page at runtime (there is no
   build-time preview variant; one file serves both), and the rule lives HERE
   because this is where the chrome is defined. A rule in build_main.py reaching
   across to style .sitehdr would be the second place chrome is decided. */
body.previewing{margin:0}
body.previewing .sitehdr,body.previewing .sitefoot{display:none}
.sitefoot p{margin:0 0 7px;max-width:70ch}
.sitefoot a{color:#2a5d86}
@media (max-width:420px){.sitehdr{padding:10px 12px}.sitefoot{padding:14px 12px 22px}}
</style>"""

# Only destinations that EXIST. A nav link to a page we have not built yet is a
# 404 wearing a plan, and `test/document.test.js` resolves every one of these
# against `src/` so it cannot be added ahead of its page.
# THE NAV NAMES PAGES NOW, NOT ANCHORS INTO ONE PAGE. "What you can see here"
# and "Workshop" were sections of the home page until Kevin moved them out:
# "I like the content, but not on the home page." An anchor into a page that
# no longer holds the section is a link that silently goes nowhere, so both
# entries point at real files -- and `document.test.js` already refuses a
# chrome link whose target is not in src/, which is what keeps this honest.
# ⭐ "BY DATE" SITS BESIDE "TEAMS" BECAUSE THEY ARE THE SAME KIND OF THING:
# the two ways into the archive. C1 shipped the calendar with one entry point,
# a line under the chips on the front door (docs/discovery.md §10.4), and that
# ruling was about whether the home page should carry a second INDEX -- it was
# never about the chrome. The result was an asymmetry nobody chose: a reader on
# a team page or a game page could reach the team browse from any page on the
# site and the date browse from none.
#
# THE WORDS ARE THE ONES THE READER ALREADY MET. The front door says "Or browse
# by date", so the nav says "By date"; a third name for one destination is how a
# reader stops believing two links go to the same place.
#
# MEASURED BEFORE IT WAS ADDED, because the header is the one piece of furniture
# on every page and the novice tester is on a phone: 4 items wrapped to 2 lines
# at 108px, and 5 items wrap to 2 lines at 108px. It costs nothing on the device
# that can least afford it. See docs/discovery.md §13.
_NAV = [("/", "Watch a game"), ("/#teams", "Teams"),
        ("/calendar.html", "By date"),
        ("/what-you-can-see.html", "What you can see"),
        ("/workshop.html", "Workshop")]


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
        # WIDENED ON KEVIN'S INSTRUCTION, 2026-08-17. The home page used to carry a
# second, older footer whose disclaimer was broader than this one -- "or a
# PRODUCT OF the National Hockey League OR ANY CLUB". Removing the duplicate
# would have quietly narrowed the claim on the only page that made it, so the
# wider wording moves here instead and now covers all nine pages rather than
# one. Three refusals and two subjects, because a club is not the league.
        "stored. Not affiliated with, endorsed by, or a product of the National "
        "Hockey League or any club. <strong>No NHL or club "
        "logos, wordmarks or crests appear anywhere on this site</strong> — teams are "
        "identified by colour and three-letter abbreviation only.</p>"
        '<p><a href="https://github.com/shilohisadog/read-the-game">Source on GitHub</a>'
        " — every number here is a function of stored events, and you can read the "
        "function. Found one that looks wrong? "
        # THE ADDRESS RIDES THE CHECKABILITY SENTENCE RATHER THAN GETTING ITS OWN
        # BLOCK. A site whose whole trade is "read our work" needs a way to be
        # told the work is wrong, and that is the same thought as the clause
        # before it -- so it costs a phrase and not a third paragraph on every
        # page. In the shared chrome for the reason the rest of it is: a contact
        # address on most pages is the `goalie-eye-view` defect again.
        #
        # ⭐ THE `email_off` FENCE IS LOAD-BEARING AND WAS BOUGHT WITH A RED DEPLOY.
        # Cloudflare's Scrape Shield rewrites every mailto in the served HTML to
        # `/cdn-cgi/l/email-protection#<hex>` and injects a decoder script to put
        # it back. Our script-src is hash-pinned over the page's own inline block,
        # so the browser REFUSES the decoder -- and the footer then reads, to a
        # real visitor, the literal string "[email protected]". Measured in a
        # browser on the live site, not inferred.
        #
        # This fence is Cloudflare's documented per-block opt-out and is preferred
        # over the two alternatives: turning obfuscation off zone-wide gives up
        # the protection on any address we ever add, and adding 'self' to
        # script-src to admit the decoder would let ANY same-origin script run --
        # trading the policy that has actually caught bugs here for a convenience.
        # The deploy's byte-diff against the live domain is what noticed, and is
        # the instrument that will notice again: no unit test can see a rewrite
        # that happens between the repo and the reader.
        "<!--email_off-->"
        '<a href="mailto:ReadTheGameOfHockey@gmail.com">ReadTheGameOfHockey@gmail.com</a>'
        "<!--/email_off-->"
        "</p>"
        # THE TIP JAR, AND EVERY WORD OF ITS FRAMING IS A CONSTRAINT KEVIN SET:
        # "it has to be 'donate' or 'buy me a coffee' type of surface, so I
        # minimize the chance of any scrutiny from the NHL."
        #
        # So it supports THE WORK and never sells access. Nothing on this site is
        # gated, there are no tiers, and no supporter gets a number a visitor
        # cannot see -- which is what keeps it a tip and not a product built on
        # somebody else's feed. It sits directly under the not-affiliated
        # sentence for the same reason, so a reader meets the disclaimer first.
        #
        # A PLAIN LINK, NOT THE WIDGET. Buy Me a Coffee's button is a third-party
        # script; the policy admits exactly one external origin and that one was
        # bought deliberately for analytics. A link costs nothing, cannot break in
        # a reader's browser, and cannot be refused -- which is not hypothetical,
        # it is what happened to the email decoder the same afternoon.
        #
        # The lowercase host path is the CANONICAL one: the mixed-case form Kevin
        # gave 301s to this, checked rather than assumed, so linking it directly
        # saves every reader a redirect.
        '<p>Nothing here is paywalled. If it helped you read a game, you can '
        '<a href="https://buymeacoffee.com/readthegameofhockey">buy me a coffee</a>.</p>'
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
