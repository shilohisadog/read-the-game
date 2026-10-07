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

⛔⛔⛔ AND FOR A WEEK IT RAN IN ONE PLACE WHERE IT COULD NOT ANSWER. `ingest.yml`
called it from the refresh step, immediately AFTER
`cp ingest/measures.json data/measures.json` -- so it compared a file the step
had just overwritten against the document that file came from. It could only
ever catch a failed PUBLISH, never a stale repo, which is the single case its own
error message tells a human to fix. It printed *every quoted figure already
matches* on 2026-10-07 while the repo was six figures behind.

⭐⭐ THE HOLE IT LEFT IS A GAP BETWEEN TWO WRITES, NOT A STALE FILE. That step
publishes to R2 and commits to git as two acts in one step, in that order. The
15:49 ingest published the amended measurement, then died at the health block
before the commit -- so the origin moved, the repo did not, and `npm run gates`
was GREEN on the difference, because nothing in `gates` reads the origin. The
front door FETCHED 171,026 while `slot.html`, built from the repo, BAKED 171,027.

So it now runs in three places and means something different in each:

  deploy.yml   HARD FAIL, before anything reaches a reader. This is the
               load-bearing one: a page about to be deployed may not print a
               figure the published archive contradicts.
  ingest.yml   `--report`, BEFORE the copy. The step's job is to fix the drift,
               so it must not be stopped -- but the run that inherits a stale
               repo is the only run that can say so.
  derive.yml   HARD FAIL, after publishing. derive never commits the file, so
               here a drift is a true alarm: a human has to refresh it.

⚠️ IT IS NOT IN `npm run gates`, DELIBERATELY. `gates` must run with no network
-- `tools/box-witness.mjs` states that policy for the same reason -- and a check
that silently passes when it cannot fetch is Shape 10, a check that cannot fail
in the conditions you run it under. `deploy.yml` already needs the network to
deploy, so the hard fail lives there and `--report` never stands in for a pass.

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
    # ⛔ census.pace JOINED ON 2026-09-10, AND IT JOINED BECAUSE THIS LIST MISSED
    # A REAL DRIFT. The committed file sat stale across a strength.js fix that
    # zeroed 4,151.9 unclassifiable minutes and moved every `state` and
    # `drawStrength` figure — silently, because none of those paths is watched
    # and no page read them. The "All situations" card reads these three, so they
    # are page-facing now and a stale copy would put last month's rate on a
    # teaching card. Named, not globbed, for the reason above: the claim is
    # "what _archive() reads", and widening it to the whole census would fail
    # this gate on figures no surface has ever printed.
    ("census", "pace", "even", "per60"),
    ("census", "pace", "ppFor", "per60"),
    ("census", "pace", "ppAgainst", "per60"),
    # AND census.endZone JOINED WITH THE ELEVENTH CARD, by the same rule: the
    # blue-line card prints these three, so they are page-facing and a stale
    # copy would put last month's figure under a teaching sentence. `n` is
    # watched alongside the two rates because the card quotes its own
    # population, and a share whose n has moved while its rate has not is the
    # quieter half of the same drift.
    # AND THE SCORE-EFFECTS ROW. ⛔ THE EVEN-STRENGTH ONE ONLY, because that is
    # the one the card prints -- it briefly carried the all-situations three as
    # well, and they came straight back out when the card stopped quoting them.
    # The claim this list makes is "what a PAGE has printed", and a watched path
    # no page reads is a claim widening itself quietly.
    ("census", "pace", "evenTrail", "per60"),
    ("census", "pace", "evenTied", "per60"),
    ("census", "pace", "evenLead", "per60"),
    # AND THE SHIFT FIGURES, which the "How long a shift is" card prints. `n` is
    # watched with them because the card quotes its own population.
    ("census", "shift", "median"),
    ("census", "shift", "underMinute"),
    ("census", "shift", "perPlayerGame"),
    ("census", "shift", "n"),
    ("census", "endZone", "atkPerDraw"),
    ("census", "endZone", "defPerDraw"),
    ("census", "endZone", "n"),
]


def dig(doc, path):
    for k in path:
        if not isinstance(doc, dict) or k not in doc:
            return None
        doc = doc[k]
    return doc


def drift_against(local, live):
    """Every watched figure on which the two copies disagree, as sentences.

    Split out of `main` so a test can put two documents in front of it. The
    previous version could only be exercised by standing up an HTTP server,
    which is why the one behaviour that mattered -- what it says when it cannot
    FETCH -- had never been checked.
    """
    out = []
    for path in WATCHED:
        a, b = dig(local, path), dig(live, path)
        if a != b:
            out.append(f"{'.'.join(path)}: committed {a!r}, published {b!r}")
    for path in WATCHED:
        if dig(live, path) is None:
            out.append(f"{'.'.join(path)}: the published archive no longer carries it")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=URL)
    # ⭐⭐ REPORT MODE EXISTS BECAUSE THE NIGHTLY CANNOT HARD-FAIL ON THIS AND
    # STILL DO ITS JOB. `ingest.yml`'s refresh step is the thing that FIXES the
    # drift, so a check in front of it that exits 1 would stop the repair. But
    # the drift was still worth printing: the run that inherits a stale repo is
    # the only run in a position to say when it went stale.
    ap.add_argument("--report", action="store_true",
                    help="print the drift and exit 0 — for a step whose job is to fix it")
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
    # ⛔⛔ A FAILED FETCH IS NOT A FRESH FILE, AND IT IS NOT A DRIFT EITHER. The
    # previous version let the exception out, so an origin hiccup aborted with a
    # Python traceback in a step named for staleness -- unreadable, and on the
    # wrong side of the only distinction that matters here. Exit 2, said plainly:
    # the question was not answered, so nothing may conclude that it was.
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            live = json.loads(r.read().decode())
    except Exception as e:
        print(f"::error::could not read {args.url}: {e}")
        # ⚠️ EXIT 2 BY NUMBER. `sys.exit("a string")` prints it and exits 1, so a
        # comment promising a distinct code next to that call is a claim the code
        # does not keep — caught by `test/test_measures_fresh.py`, which asserted
        # the 2 this comment had already promised.
        print("::error::the published measurement was not readable, so this check "
              "answered NOTHING. It is not a pass. Re-run it; a stale "
              "data/measures.json would look exactly like this.")
        sys.exit(2)

    drift = drift_against(local, live)

    if drift:
        print("\n".join("  " + d for d in drift))
        if args.report:
            # ⚠️ NOT A PASS, AND IT MUST NOT READ AS ONE IN A GREEN LOG.
            print(f"::warning::data/measures.json is {len(drift)} figures behind the "
                  "published archive. The next step refreshes it; if that step does "
                  "not finish, the repo and the origin stay apart and the pages "
                  "built from the repo print the older number.")
            return
        sys.exit("::error::data/measures.json has drifted from the published archive. "
                 "A learn page is printing a figure the archive no longer says. "
                 "Refresh it: curl -sS --fail " + URL + " -o data/measures.json")
    print(f"  data/measures.json agrees with the archive on all "
          f"{len(WATCHED)} figures the build reads ({local['measured']} games)")


if __name__ == "__main__":
    main()
