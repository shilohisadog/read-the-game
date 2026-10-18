"""How often the raw play-by-play carries a field, across the whole archive.

    python3 tools/feed_fields.py ingest            # after the raw archive is pulled

Counts, per season and game type, the face-offs that name the losing player and
the shot events (on goal, missed, blocked, goals) that name a shot type, plus the
shot types themselves. A question about what the feed CARRIES is answered here,
where the archive is, rather than from a sample (see docs/see-the-shot-3d.md §5).
"""
import collections, json, pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "builders"))
import fetch_nhl as F  # noqa: E402

SHOTS = {"shot-on-goal", "missed-shot", "blocked-shot", "goal"}


def count(pbp, tally, kinds):
    for p in pbp.get("plays", []):
        t, d = p.get("typeDescKey"), p.get("details") or {}
        if t == "faceoff":
            tally["faceoffs"] += 1
            tally["faceoffs_with_loser"] += "losingPlayerId" in d
            tally["faceoffs_with_winner"] += "winningPlayerId" in d
        elif t in SHOTS:
            tally["shots"] += 1
            tally[f"{t}"] += 1
            if d.get("shotType"):
                tally["shots_with_type"] += 1
                tally[f"{t}_with_type"] += 1
                kinds[d["shotType"]] += 1


def survey(root):
    root = pathlib.Path(root)
    store = F.FileStore(root)
    by = collections.defaultdict(collections.Counter)
    kinds = collections.Counter()
    absent = 0
    for latest in sorted(root.glob("raw/*/latest.json")):
        gid = latest.parent.name
        digests = json.loads(latest.read_text())
        raw = store.get(F.raw_key(gid, digests["play-by-play"], "play-by-play")) if "play-by-play" in digests else None
        if raw is None:
            absent += 1
            continue
        try:
            pbp = json.loads(raw)
        except ValueError:
            absent += 1
            continue
        key = f"{gid[:4]}-{gid[4:6]}"
        by[key]["games"] += 1
        count(pbp, by[key], kinds)
    return by, kinds, absent


def pct(n, d):
    return f"{100 * n / d:5.1f}%" if d else "    —"


def main(argv):
    by, kinds, absent = survey(argv[1] if len(argv) > 1 else "ingest")
    total = collections.Counter()
    print(f"{'season-type':12} {'games':>6} {'faceoffs':>9} {'loser':>7} {'shots':>8} {'type':>7}")
    for k in sorted(by):
        c = by[k]; total.update(c)
        print(f"{k:12} {c['games']:6} {c['faceoffs']:9} {pct(c['faceoffs_with_loser'], c['faceoffs'])} "
              f"{c['shots']:8} {pct(c['shots_with_type'], c['shots'])}")
    print(f"{'ALL':12} {total['games']:6} {total['faceoffs']:9} {pct(total['faceoffs_with_loser'], total['faceoffs'])} "
          f"{total['shots']:8} {pct(total['shots_with_type'], total['shots'])}")
    for t in sorted(SHOTS):
        print(f"  {t:13} {total[t]:8}  with type {pct(total[t + '_with_type'], total[t])}")
    print("  shot types:", ", ".join(f"{k} {v}" for k, v in kinds.most_common()))
    print(f"  games without a readable play-by-play: {absent}")
    print(json.dumps({"by": by, "kinds": kinds, "absent": absent}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
