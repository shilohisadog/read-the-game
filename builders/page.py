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


def document(body, *, title, description=None, url=None, head="", lang="en"):
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
    if head:
        parts.append(head.rstrip("\n"))
    parts += ["</head>", "<body>", body.rstrip("\n"), "</body>", "</html>", ""]
    return "\n".join(parts)
