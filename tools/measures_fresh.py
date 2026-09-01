#!/usr/bin/env python3
"""
Is `data/measures.json` still what the archive says?

⚠️ WHY THIS EXISTS BEFORE IT HAS EVER FAILED. `data/measures.json` is a DERIVED
artifact committed into a repository of INPUTS -- the learn pages carry no
scripts and `connect-src 'self'`, so a static teaching page cannot fetch the
archive and the figures have to be substituted at build time.

That is the exact shape that let five of seven test fixtures sit as an older
extractor's output while every test stayed green: a file that looks like an
input, is actually an output, and has no clock on it. `fixtures/extracts/README`
had even PREDICTED that failure in its own words and nothing fired, because a
rule written down and not instrumented is un-instrumented.

So this is the instrument, and it runs where the archive is: `derive.yml`, after
the measurement is published. A weekly derive that changes a rate now fails loud
instead of leaving a card quoting last month's number for a month.

⛔ IT COMPARES THE FIELDS THE BUILD ACTUALLY READS, not the whole document.
`featured` reorders whenever a new game lands and `perGame` grows every night;
diffing those would cry wolf weekly and the alarm would be turned off. What must
not drift silently is what a PAGE has printed.

  tools/measures_fresh.py [--url URL]     exit 1 when the committed copy is stale
"""
import argparse
import json
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCAL = ROOT / "data" / "measures.json"
URL = "https://data.readthegame.co/measures.json"

# The paths `builders/build_index.py::_archive()` reads. Named rather than
# globbed: a glob would quietly widen the claim to fields no page has ever
# printed, which is the failure mode this whole project keeps paying for.
WATCHED = [
    ("slot", "scoredFromInside", "count"), ("slot", "scoredFromInside", "n"),
    ("slot", "scoredFromInside", "rate"),
    ("slot", "scoredFromOutside", "rate"),
    ("slot", "attempts", "count"), ("slot", "attempts", "n"), ("slot", "attempts", "rate"),
    ("measured",),
]


def dig(doc, path):
    for k in path:
        if not isinstance(doc, dict) or k not in doc:
            return None
        doc = doc[k]
    return doc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=URL)
    args = ap.parse_args()

    if not LOCAL.exists():
        sys.exit("::error::data/measures.json is missing -- the build cannot substitute any figure")
    local = json.loads(LOCAL.read_text())
    # ⚠️ A NAMED User-Agent, BECAUSE THE ORIGIN 403s THE DEFAULT ONE. urllib
    # identifies itself as `Python-urllib/3.x` and the edge refuses it, which is
    # the same 403 CHENG hit reading the published file. Not a spoof: the tool
    # says what it is, which is what a User-Agent is for. A gate that cannot
    # fetch is a gate that fails for a reason unrelated to the thing it checks.
    req = urllib.request.Request(args.url, headers={
        "User-Agent": "read-the-game-measures-fresh (+https://readthegame.co)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        live = json.loads(r.read().decode())

    drift = []
    for path in WATCHED:
        a, b = dig(local, path), dig(live, path)
        if a != b:
            drift.append(f"{'.'.join(path)}: committed {a!r}, published {b!r}")

    for path in WATCHED:
        if dig(live, path) is None:
            drift.append(f"{'.'.join(path)}: the published archive no longer carries it")

    if drift:
        print("\n".join("  " + d for d in drift))
        sys.exit("::error::data/measures.json has drifted from the published archive. "
                 "A learn page is printing a figure the archive no longer says. "
                 "Refresh it: curl -sS --fail " + URL + " -o data/measures.json")
    print(f"  data/measures.json agrees with the archive on all "
          f"{len(WATCHED)} figures the build reads ({local['measured']} games)")


if __name__ == "__main__":
    main()
