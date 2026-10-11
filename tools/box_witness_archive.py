#!/usr/bin/env python3
"""
WHAT WILL THE BOXSCORE WITNESS SAY ACROSS THE WHOLE ARCHIVE — before it says it.

⭐ THE GAP THIS CLOSES. `tools/box_rail_witness.py` measured the boxscore's player
rows against the right rail: 268/268 on hits, takeaways and blocked shots. But
the rail exists only for games since 2026-09-30, so that is a statement about
134 RECENT games. `extract.SCHEMA` 5 holds our event log to the boxscore's
player rows on EVERY game, and a disagreement is published to a reader. Whether
our log agrees with those rows on a 2023 game was, on 2026-10-11, known for
exactly one game — the reference game. A re-derive is the wrong place to find
out: it publishes what it finds.

So this runs the real `derive.judge` — the extractor and validator the re-derive
will run, unmodified — over every game in a store, publishes nothing, and counts
the notes the boxscore witness would add, by season and by figure.

⛔ A MEASUREMENT, NOT A GATE. Same standing as `box_rail_witness.py`: dispatch
only, writes nothing to the bucket.

  python3 tools/box_witness_archive.py <dir>      # a store: <dir>/raw/<gid>/...
"""
import contextlib
import io
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "builders"))
import derive as D        # noqa: E402
import fetch_nhl as F     # noqa: E402
import json               # noqa: E402

SRC = "boxscore.playerByGameStats"


def run(store_dir, out=sys.stdout):
    store = F.FileStore(store_dir)
    seasons = {}          # "2023" -> {"games", "flagged", "kinds": {kind: n}}
    examples = []
    refused = absent = 0
    for key in sorted(store.keys("raw/")):
        if not key.endswith("/latest.json"):
            continue
        gid = key.split("/")[1]
        digests = json.loads(store.get(key).decode())
        p = {n: store.get(F.raw_key(gid, d, n)) for n, d in digests.items()}
        if any(p.get(n) is None for n in ("play-by-play", "boxscore", "shifts")):
            absent += 1
            continue
        with contextlib.redirect_stdout(io.StringIO()):
            rich, refusal, _ = D.judge(p["play-by-play"], p["boxscore"],
                                       p["shifts"], p.get("right-rail"))
        if rich is None:
            refused += 1
            continue
        s = seasons.setdefault(gid[:4], {"games": 0, "flagged": 0, "witnessed": 0,
                                         "kinds": {}})
        s["games"] += 1
        if "box" in (rich.get("quoted") or {}):
            s["witnessed"] += 1
        mine = [n for n in rich.get("unreconciled", []) if n.get("src") == SRC]
        if mine:
            s["flagged"] += 1
            for n in mine:
                s["kinds"][n["kind"]] = s["kinds"].get(n["kind"], 0) + 1
                if len(examples) < 40:
                    examples.append((gid, n))

    print(f"\n  games judged: {sum(s['games'] for s in seasons.values())}"
          f"   refused: {refused}   raw absent: {absent}", file=out)
    print(f"\n  {'season':<8}{'games':>8}{'witnessed':>11}{'flagged':>9}   by figure", file=out)
    for k in sorted(seasons):
        s = seasons[k]
        print(f"  {k:<8}{s['games']:>8}{s['witnessed']:>11}{s['flagged']:>9}   "
              f"{s['kinds'] or '—'}", file=out)
    if examples:
        print(f"\n  FIRST {len(examples)} NOTES:", file=out)
        for gid, n in examples:
            print(f"    {gid} {n['kind']:<10} home {n['home']}  away {n['away']}  "
                  f"players {n.get('players')}", file=out)
    return seasons


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python3 tools/box_witness_archive.py <dir>")
    seasons = run(sys.argv[1])
    if not seasons:
        sys.exit("::error::no game was judged — the measurement did not run")


if __name__ == "__main__":
    main()
