#!/usr/bin/env python3
"""
THE PLAYERS' HEADSHOTS, FETCHED ONCE AND SERVED FROM OUR OWN ORIGIN.

Kevin, 2026-10-07, on the preview's player block: *"what do you think about
adding the players head shot image? That would bring quite a bit of 'realism' to
the page."* It does, and it is the same argument the block was built on — a named
human is the most concrete thing this site can offer a newcomer, and a face is
more concrete than a name.

⛔⛔⛔ WHY THESE ARE NOT HOTLINKED, WHICH IS THE WHOLE DESIGN. The league serves
them from `assets.nhle.com` and an `<img src=…>` pointing there would be three
lines of work. It is refused for three reasons, each already a rule here:

  1. The preview page's CSP is `default-src 'none'` with no `img-src` at all, and
     `deploy.yml` READS these directives to decide which pages may reach out. A
     page naming a third party it does not need exempts itself from that check.
  2. The site's own standing sentence is *"Nothing is fetched from the league
     while you watch."* A hotlinked mug makes that false on this page.
  3. It is the request-cost objection Kevin raised about the right-rail backfill,
     pointed the wrong way: hotlinking is one request per READER PER PAGE VIEW on
     somebody's free service, where this is ~228 once and then only on a change.

⭐⭐⭐ A MISSING HEADSHOT IS NOT A 404 — AND THIS IS THE TRAP THE WHOLE FILE IS
BUILT AROUND. Ask for a player who does not exist and the CDN answers **302 to
`/mugs/nhl/default-skater.png`**, which then answers **200** with a perfectly good
11,875-byte silhouette. So:

  - following redirects (curl -L, urllib's default) turns "no headshot" into a
    successful download of a generic grey man, and
  - a STATUS CHECK proves nothing, which is this project's own logged shape:
    *production answers 200 for ANY missing path*.

The symptom would have been a card showing a stranger's outline under a named
player's name, with every gate green. So this refuses redirects — a headshot
either exists at the URL we asked for or it does not — AND compares every body
against the placeholder's own bytes, fetched once per run rather than typed,
because a CDN that stops redirecting and starts serving the default directly
would otherwise walk straight back into it.

⚠️ THE SIZE IS A MEASUREMENT, NOT A PREFERENCE. The source is 336x336 RGBA at
**178,650 bytes** — enormous for what it is, and two of them on one preview would
outweigh the page. Measured, at 112px (2x the ~56px it is drawn at):

      336px png  170,117 | 336px webp 12,286
      168px png   31,700 | 168px webp  6,090
      112px png   15,254 | 112px webp  3,572   <- this

⚠️ WEBP, AND THE ONE READER IT COSTS. Universally supported since 2020; a browser
without it shows the alt text, which is the player's name — the state this page
was in yesterday, so nobody is worse off than before.

  python3 builders/mugs.py <dir>      # dir holds players.json and gains mug/
"""
import hashlib
import io
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

# The league's own asset host. Not the stats API: a CDN, and this is ~228 reads a
# week against it, dropping to near zero once the cache is warm.
HOST = "https://assets.nhle.com/mugs/nhl"
DEFAULT = f"{HOST}/default-skater.png"
SIDE = 112
UA = "read-the-game mugs (+https://readthegame.co)"
DELAY = 0.25


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """⛔ A REDIRECT IS THE ANSWER, NOT AN OBSTACLE TO FOLLOW. The CDN says "this
    player has no headshot" by sending you to the default; following it converts
    the one fact worth knowing into a silent success."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def get(url, opener, timeout=30):
    """(status, bytes). A refused redirect reads as its own status, never a raise."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with opener.open(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        # 302 arrives here because NoRedirect declined to follow it.
        return e.code, b""
    except Exception as e:                       # noqa: BLE001 - reported, not raised
        return 0, str(e).encode()


def shrink(raw):
    """112px WebP, or None if the bytes are not an image we can read.

    ⚠️ Pillow is the one dependency this build has, installed in the step that
    calls this and nowhere else. Resizing needs a codec and hand-rolling a PNG
    encoder to stay pure would be the expensive kind of purity.
    """
    from PIL import Image
    try:
        im = Image.open(io.BytesIO(raw))
        im.load()
    except Exception:                            # noqa: BLE001
        return None
    im = im.convert("RGBA").resize((SIDE, SIDE), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, format="WEBP", quality=82, method=6)
    return out.getvalue()


def players_of(doc):
    """Every published row, deduplicated by id — a man leading two figures is one
    fetch, and a man on two clubs in one season is whichever row we published."""
    seen = {}
    for ab, rows in (doc.get("clubs") or {}).items():
        for r in rows:
            seen.setdefault(r["p"], r)
    return seen


def run(root, fetch=None, sleep=time.sleep):
    root = pathlib.Path(root)
    pfile = root / "players.json"
    if not pfile.exists():
        print("  no players.json — nothing to fetch")
        return {"wanted": 0}
    doc = json.loads(pfile.read_text())
    season = int(doc["season"])
    # "2026" -> "20252026", the way the league names a season in an asset path.
    tag = f"{season - 1}{season}"

    out = root / "mug"
    out.mkdir(parents=True, exist_ok=True)
    seen_file = out / "seen.json"
    seen = json.loads(seen_file.read_text()) if seen_file.exists() else {}

    if fetch is None:
        opener = urllib.request.build_opener(NoRedirect)
        fetch = lambda u: get(u, opener)          # noqa: E731

    # ⭐ THE PLACEHOLDER'S OWN BYTES, READ THIS RUN RATHER THAN TYPED. A hash in
    # the source would be a measurement frozen into a literal — the thing this
    # repo refuses everywhere else — and it is exactly the value most likely to
    # change without anybody telling us.
    dstat, dbody = fetch(DEFAULT)
    placeholder = hashlib.sha256(dbody).hexdigest() if dstat == 200 and dbody else None
    if placeholder is None:
        print(f"  ⚠️ could not read {DEFAULT} (HTTP {dstat}) — "
              "falling back to the redirect rule alone")

    rows = players_of(doc)
    rep = {"wanted": len(rows), "fetched": 0, "cached": 0, "none": 0, "failed": 0,
           "bytes": 0}
    for pid, r in sorted(rows.items()):
        key = str(pid)
        was = seen.get(key)
        # ⚠️ THE CLUB IS PART OF THE CACHE KEY BECAUSE IT IS PART OF THE URL. A
        # traded player's mug moves to a different path, and a cache keyed on the
        # id alone would serve his old sweater until the season rolled over.
        if was and was.get("t") == r.get("t") and (out / f"{pid}.webp").exists():
            rep["cached"] += 1
            if was.get("ok"):
                r["mug"] = 1
            continue
        if was and was.get("t") == r.get("t") and not was.get("ok"):
            rep["cached"] += 1                   # a known-absent headshot, not refetched
            continue

        status, body = fetch(f"{HOST}/{tag}/{r['t']}/{pid}.png")
        sleep(DELAY)
        got = (status == 200 and body
               and hashlib.sha256(body).hexdigest() != placeholder)
        small = shrink(body) if got else None
        if small:
            (out / f"{pid}.webp").write_bytes(small)
            seen[key] = {"t": r.get("t"), "ok": 1}
            r["mug"] = 1
            rep["fetched"] += 1
            rep["bytes"] += len(small)
        elif status in (200, 301, 302, 303, 307, 308, 404):
            # A real answer meaning "no headshot for this man". Recorded, so the
            # next run does not ask again, and the card falls back to his name.
            seen[key] = {"t": r.get("t"), "ok": 0}
            rep["none"] += 1
        else:
            rep["failed"] += 1                   # a transport problem: ask again next week

    seen_file.write_text(json.dumps(seen, indent=0, sort_keys=True))
    pfile.write_text(json.dumps(doc, indent=0, sort_keys=True))
    print(f"  mugs: {rep['fetched']} fetched, {rep['cached']} already held, "
          f"{rep['none']} have none, {rep['failed']} failed "
          f"({rep['bytes']} bytes written, {rep['wanted']} players)")
    return rep


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python3 builders/mugs.py <dir>")
    rep = run(sys.argv[1])
    # ⛔ A RUN THAT REACHED NOBODY IS A FAILURE, NOT AN EMPTY SUCCESS. Every other
    # outcome is legitimate: a player can have no headshot, and a warm cache
    # fetches nothing at all.
    if rep["wanted"] and rep.get("failed", 0) == rep["wanted"]:
        sys.exit("::error::every headshot request failed — the host or the path moved")


if __name__ == "__main__":
    main()
