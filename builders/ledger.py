"""⭐ THE TWO PUBLISHED DOCUMENTS ARE MADE TO AGREE, IN CI, ON EVERY RUN.

`index.json` carries an `archive` block claiming what the archive holds.
`catalog.json` IS what the archive holds -- it is the document the browser
fetches to draw the calendar and every team page. This walks both and requires
the first to reproduce the second.

WHY THIS EXISTS AT ALL (D8). The index used to carry ONE block, `extracts`,
computed entirely from the games a run had raw for, under names -- `published`,
`refused`, `absent` -- that all read as the archive. The nightly rehydrates
pointers and one night of raw, so for most of every week it published
`published: 0, absent: 4553` where a weekly full derive had left the real
figures. Two readers walked into it inside forty-eight hours: the health block
printed "0 archived · 0 published" at the top of the build list, and a drift
alarm reading it FAILED A PRODUCTION INGEST with 4,553 games sitting untouched.

⭐ AND THE CHECK THAT EXISTED COULD NOT SEE ANY OF IT, BECAUSE IT WAS A MIRROR.
`derive.yml` asserted `derived.json['published'] == index['published']` -- the
index against THE SAME RUN'S OWN REPORT, which is the implementation's own model
of its input. It asserts the identity that makes the defect invisible, and it
was green on every zeroed nightly. This project's dominant failure mode is a
check with no instrument for the axis it claims to cover; that was one.

So the instrument is a SECOND DOCUMENT, and the question this asks is the one
the outage taught us to ask: WHAT IS THE DENOMINATOR ON THE SMALLEST RUN THAT
WILL EXECUTE THIS? On a nightly in the offseason that derives nothing at all,
it is 4,553 catalog rows -- not zero. That is the entire point.

IT RUNS IN BOTH WORKFLOWS. The old check ran only in `derive.yml`, which is
WEEKLY, so the run that actually wrote the wrong figures was never checked. A
gate that skips the case that breaks is a gate written against the cases that
existed -- the deploy exemption, the night list, the front door's hand-written
competition list, three times over.
"""
import json
import sys


def recount(games):
    """The archive block as the CATALOG would state it. No report involved."""
    types, gates = {}, {}
    for r in games:
        types[str(r.get("t"))] = types.get(str(r.get("t")), 0) + 1
        if r.get("v") != 1:
            gate = r.get("r") or "unrecorded"
            gates[gate] = gates.get(gate, 0) + 1
    return {
        "games": len(games),
        "published": sum(1 for r in games if r.get("v") == 1),
        "refused": sum(1 for r in games if r.get("v") != 1),
        "unreconciled": sum(1 for r in games if r.get("u") == 1),
        "byGate": gates,
        "gameTypes": types,
        "refusedGames": sorted(r["id"] for r in games if r.get("v") != 1),
    }


def check(idx, games):
    """Every disagreement, named. Returns a list of sentences; empty is clean.

    A LIST AND NOT A BOOLEAN, for the reason `byGate` exists: one figure wrong
    is a bug and seven wrong is a wiring mistake, and a caller that only learns
    "something is wrong" has to go and diff two documents by hand.
    """
    bad = []
    if "extracts" not in idx:
        pass
    else:
        # The word that conflated the two populations. If it is back, something
        # is writing the old shape -- and its figures will look plausible.
        bad.append("index.json still carries the `extracts` block, whose names "
                   "say archive and whose figures described one run (D8)")
    for block in ("archive", "run"):
        if block not in idx:
            bad.append(f"index.json carries no `{block}` ledger")
    if bad:
        return bad

    a, r = idx["archive"], idx["run"]
    want = recount(games)
    for key, expected in want.items():
        if a.get(key) != expected:
            bad.append(f"archive.{key} says {json.dumps(a.get(key))[:120]} and "
                       f"catalog.json says {json.dumps(expected)[:120]}")

    # THE TWO IDENTITIES CLOSE OVER DIFFERENT SETS, and that is the point: on a
    # nightly the first is the whole archive and the second is nearly nothing.
    if a.get("games") != a.get("published", 0) + a.get("refused", 0):
        bad.append(f"the archive ledger does not close: {json.dumps(a)[:200]}")
    walked = (r.get("derived", 0) + r.get("unchanged", 0)
              + r.get("refused", 0) + r.get("absent", 0))
    if r.get("walked") != walked:
        bad.append(f"the run ledger does not close: {json.dumps(r)[:200]}")

    # THE GATES ACCOUNT FOR EVERY REFUSAL. `byGate` compared against `recount`
    # already catches a writer that drops one -- but only while `recount` is
    # right, and a check whose expectation comes from the code under test moves
    # when that code moves. This is an identity instead: it holds or it does
    # not, whatever either side believes.
    if sum(a.get("byGate", {}).values()) != a.get("refused", 0):
        bad.append(f"the gates account for {sum(a.get('byGate', {}).values())} "
                   f"refusals and the ledger counts {a.get('refused', 0)}")

    # ⭐ THE AMBIGUOUS WORD LIVES IN EXACTLY ONE BLOCK. The split is only worth
    # having if `published` cannot appear on the run side for the next reader --
    # or the next drift alarm -- to pick up believing it means the archive.
    if "published" in r:
        bad.append("the `run` block carries a `published` key, which is the "
                   "word that did the lying in D8")
    return bad


def main(argv):
    if len(argv) != 2:
        print("usage: ledger.py <index.json> <catalog.json>", file=sys.stderr)
        return 2
    idx = json.load(open(argv[0]))
    games = json.load(open(argv[1]))["games"]
    bad = check(idx, games)
    for line in bad:
        print(f"::error::{line}", file=sys.stderr)
    if bad:
        return 1
    a, r = idx["archive"], idx["run"]
    print(f"  archive: {a['games']} games, {a['published']} published, "
          f"{a['refused']} refused, {a['unreconciled']} unreconciled "
          f"— reproduced from catalog.json, not from this run's report")
    print(f"  run:     walked {r['walked']}, derived {r['derived']}, "
          f"unchanged {r['unchanged']}, absent {r['absent']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
