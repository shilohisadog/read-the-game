#!/usr/bin/env python3
"""Do the `file:line` citations in docs/ say what the sentence around them says?

WHY THIS EXISTS. `docs/ten-second-hero.md` was written to be checkable -- every
claim naming the file and line it comes from -- and FIVE OF ITS REFERENCES WERE
STALE THE DAY IT WAS WRITTEN, because the same session's edits had shifted the
files under numbers quoted from memory. CHENG:

    An unchecked citation is worse than no citation, because it invites trust
    it hasn't earned.

He also predicted the shape exists elsewhere, and it does: `src/app.js` was cut
out of `builders/build_main.py` by commit 914e638, and four docs still cite the
renderer at its old address in a file that is now 380 lines long.

⭐ RESOLUTION IS NOT CORRECTNESS, AND THAT IS THE WHOLE OF VERSION TWO. CHENG:

    Don't repair the broken citations by making them resolve. That converts a
    loud wrong into a quiet wrong. The stronger check is a content assertion:
    the citation carries a short expected substring, and refcheck verifies the
    line contains it.

A line number always lands somewhere. `docs/deep-link-seam.md` cites
`build_main.py:279` for a line reading `PREVIEW = /[?&]preview=1\b/.test(...)`;
that address resolves today to `(want?Promise.resolve(want):grab(...))`, and
version one of this tool called it **ok**. Same family as the D9 test that
passed on a comment, one level up.

THREE FORMS, and the third is the one that lets a design doc stay honest:

    `src/app.js:894`                     resolves only -- counted as debt
    `src/app.js:894 "function set("`     the line must CONTAIN that text
    `914e638^:builders/build_main.py:1030 "location.search"`
                                         pinned to a REVISION, permanently true

⭐ THE REVISION FORM EXISTS BECAUSE SOME CITATIONS BROKE BY BEING FIXED. A design
doc's inventory of a defect -- three hand-written reads of `location.search`, a
raw feed key title-cased -- describes code that was deliberately deleted. There
is no current address for it, and pointing one at today's repaired code would
MISREPRESENT the document. Pinning the claim to the commit it was true at keeps
it checkable forever without rewriting history.

⚠️ DO NOT GENERATE ANCHORS FROM THE LINES THEY CHECK. It is a two-line script and
it is the worst thing you could do with this tool: an anchor taken from whatever
the address currently lands on passes by construction, so a citation that is
ALREADY pointing at the wrong line gets its error frozen in as truth. That is not
hypothetical -- `build_main.py:279` above was resolving to an unrelated line, and
auto-anchoring would have cemented it. **The anchor comes from the CLAIM the
sentence is making**, which is why the 51 unanchored citations below are left as
visible debt rather than swept.

IT IS A GATE AS OF 2026-08-25, now that it reports zero broken. The debt it
still reports -- unanchored citations -- is counted and printed but does not
fail, because failing on it today would only tempt the script above.

    tools/refcheck.py            # every doc
    tools/refcheck.py docs/x.md  # one
"""
import glob
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_GLOBS = ("src/*.js", "src/*.css", "src/lib/*.js", "src/lib/layers/*.js",
                "builders/*.py", "builders/*.mjs", "test/*.js", "test/*.py",
                "tools/*.sh", "tools/*.py")
# [rev:]path/to/name.ext:123[ "anchor"], with or without backticks and dirs.
# The rev is a git revision -- `914e638` or `914e638^` -- and its presence is
# what makes a citation historical rather than current.
CITE = re.compile(
    r'`?(?:(?P<rev>[0-9a-f]{7,40}\^*):)?'
    r'(?P<path>(?:[A-Za-z_./-]+/)?(?P<base>[A-Za-z_][\w.-]*\.(?:js|css|py|mjs|sh)))'
    r':(?P<num>\d+)'
    r'(?:\s+"(?P<anchor>[^"]{1,80})")?`?')


def blob(rev, path):
    """A file's lines at a revision. Cached -- a doc cites one commit many times."""
    key = (rev, path)
    if key not in blob._seen:
        try:
            out = subprocess.run(["git", "show", f"{rev}:{path}"], cwd=ROOT,
                                 capture_output=True, text=True, check=True).stdout
            blob._seen[key] = out.split("\n")
        except subprocess.CalledProcessError:
            blob._seen[key] = None
    return blob._seen[key]


blob._seen = {}


def sources():
    """basename -> path. Basenames are unique in this repo; assert it rather
    than assume it, because the day they are not this tool starts guessing."""
    found = {}
    for pattern in SOURCE_GLOBS:
        for path in glob.glob(os.path.join(ROOT, pattern)):
            base = os.path.basename(path)
            rel = os.path.relpath(path, ROOT)
            if base in found:
                raise SystemExit(f"two files share the basename {base!r}: "
                                 f"{found[base]} and {rel} -- refcheck cannot "
                                 f"resolve a bare citation any more")
            found[base] = rel
    return found


def check(doc, src):
    """Every citation in one document, with the line it actually lands on."""
    text = open(os.path.join(ROOT, doc), encoding="utf-8").read()
    out = []
    for m in CITE.finditer(text):
        rev, num = m.group("rev"), int(m.group("num"))
        anchor = m.group("anchor")
        shown = f"{rev}:{m.group('path')}" if rev else m.group("path")

        if rev:
            # A bare basename is resolved through the same map as a live
            # citation, so a table cell can stay readable -- `29f4c30:x.py:12`
            # rather than the full path. If the file has MOVED since that
            # revision the git read fails and says so, which is the honest
            # outcome: this tool never guesses a historical path.
            path = m.group("path")
            if "/" not in path:
                path = src.get(m.group("base"), path)
            lines = blob(rev, path)
            if lines is None:
                out.append((shown, num, anchor, f"no {path} at revision {rev}", None))
                continue
            where = f"{path} at {rev}"
        else:
            path = src.get(m.group("base"))
            if path is None:
                out.append((shown, num, anchor, "no such file in the repo", None))
                continue
            lines = open(os.path.join(ROOT, path), encoding="utf-8").read().split("\n")
            where = path

        if not 0 < num <= len(lines):
            out.append((shown, num, anchor, f"out of range ({where} has {len(lines)} lines)", None))
            continue

        line = lines[num - 1]
        if anchor is not None and anchor not in line:
            # ⭐ THE CHECK THAT VERSION ONE COULD NOT MAKE. The address is fine
            # and the claim is not: the line landed somewhere, just not here.
            out.append((shown, num, anchor,
                        f'line does not contain "{anchor}" -- it reads: {line.strip()[:60]}', None))
            continue
        out.append((shown, num, anchor, None, line.strip()[:72]))
    return out


def main(argv):
    src = sources()
    docs = argv[1:] or sorted(glob.glob(os.path.join(ROOT, "docs/*.md")))
    docs = [os.path.relpath(d, ROOT) if os.path.isabs(d) else d for d in docs]
    total = broken = unanchored = 0
    for doc in docs:
        rows = check(doc, src)
        if not rows:
            continue
        bad = [r for r in rows if r[3]]
        loose = [r for r in rows if r[2] is None and not r[3]]
        total += len(rows)
        broken += len(bad)
        unanchored += len(loose)
        mark = "BROKEN" if bad else ("ok" if not loose else f"ok ({len(loose)} unanchored)")
        print(f"{doc}  ({len(rows)} cited, {len(bad)} broken)  {mark}")
        for shown, num, _anchor, why, _ in bad:
            print(f"    {shown}:{num}  -- {why}")
    print(f"\n{total} citations, {broken} broken, {unanchored} carrying no anchor")
    if unanchored:
        print("  An unanchored citation is checked for RESOLUTION only, and a line "
              "number\n  always lands somewhere. Add \" \"expected text\" to make it "
              "a claim about content.")
    # A tripwire on the tool: a regex that stops matching reports a clean sweep.
    if total == 0:
        print("NO CITATIONS FOUND AT ALL -- this check has lost its subject")
        return 2
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
