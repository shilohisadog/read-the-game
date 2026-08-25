#!/usr/bin/env python3
"""Do the `file:line` citations in docs/ point at anything?

WHY THIS EXISTS. `docs/ten-second-hero.md` was written to be checkable -- every
claim naming the file and line it comes from -- and FIVE OF ITS REFERENCES WERE
STALE THE DAY IT WAS WRITTEN, because the same session's edits had shifted the
files under numbers quoted from memory. CHENG:

    An unchecked citation is worse than no citation, because it invites trust
    it hasn't earned.

He also predicted the shape exists elsewhere, and it does: `src/app.js` was cut
out of `builders/build_main.py` by commit 914e638, and four docs still cite the
renderer at its old address in a file that is now 380 lines long.

NOT A GATE, DELIBERATELY -- YET. It reports 11 pre-existing breaks; wiring it
into `npm run gates` today would make the build red for a debt this tool exists
to pay down. Fix those and it can become one. What it must never become is a
check that is run once and quoted afterwards.

    tools/refcheck.py            # every doc
    tools/refcheck.py docs/x.md  # one
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_GLOBS = ("src/*.js", "src/*.css", "src/lib/*.js", "src/lib/layers/*.js",
                "builders/*.py", "builders/*.mjs", "test/*.js", "test/*.py",
                "tools/*.sh", "tools/*.py")
# `path/to/name.ext:123`, with or without backticks and with or without the dirs.
CITE = re.compile(r'`?((?:[A-Za-z_./]+/)?([A-Za-z_][\w.-]*\.(?:js|css|py|mjs|sh))):(\d+)`?')


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
        whole, base, num = m.group(1), m.group(2), int(m.group(3))
        path = src.get(base)
        if path is None:
            out.append((whole, num, "no such file in the repo", None))
            continue
        lines = open(os.path.join(ROOT, path), encoding="utf-8").read().split("\n")
        if not 0 < num <= len(lines):
            out.append((whole, num, f"out of range ({path} has {len(lines)} lines)", None))
            continue
        out.append((whole, num, None, lines[num - 1].strip()[:72]))
    return out


def main(argv):
    src = sources()
    docs = argv[1:] or sorted(glob.glob(os.path.join(ROOT, "docs/*.md")))
    docs = [os.path.relpath(d, ROOT) if os.path.isabs(d) else d for d in docs]
    total = broken = 0
    for doc in docs:
        rows = check(doc, src)
        if not rows:
            continue
        bad = [r for r in rows if r[2]]
        total += len(rows)
        broken += len(bad)
        mark = "BROKEN" if bad else "ok"
        print(f"{doc}  ({len(rows)} cited, {len(bad)} broken)  {mark}")
        for whole, num, why, _ in bad:
            print(f"    {whole}:{num}  -- {why}")
    print(f"\n{total} citations, {broken} broken")
    # A tripwire on the tool: a regex that stops matching reports a clean sweep.
    if total == 0:
        print("NO CITATIONS FOUND AT ALL -- this check has lost its subject")
        return 2
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
