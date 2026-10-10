#!/usr/bin/env python3
"""
CAN THE BOXSCORE STAND IN FOR THE RIGHT RAIL AS THE SECOND WITNESS?

⭐ THE QUESTION, AND WHY IT IS WORTH A JOB OF ITS OWN. `extract.py` checks our
event-log counts against the league's own per-team totals, which it reads from
`right-rail.teamGameStats`. That feed has only been STORED since 2026-09-30, so
the witness is live on 64 of 4,620 published games — **1.4%** — and backfilling
it costs ~4,556 league requests. Kevin, 2026-10-07: *"I really don't want to
clobber that free interface any more than we have to."*

`boxscore` is one of the three ESSENTIAL feeds and we have kept it for every game
since the beginning. Its `playerByGameStats` carries, per player, `hits`,
`giveaways`, `takeaways`, `pim`, `blockedShots` and `sog` — so summing a team's
forwards, defence and goalies produces the same six team totals **for the whole
archive, at zero league requests**, and localises a disagreement to a PLAYER
rather than to a game.

⛔ THAT IS A HYPOTHESIS, NOT A FINDING, WHICH IS THE ENTIRE POINT OF THIS FILE.
The two documents are both the league's, and this project has already been
bitten by assuming two of its documents agree: the boxscore disagrees with the
event log on `sog` in 2 games of 40, and the league AMENDS games after we read
them. Before a schema bump and a full archive re-derive are spent on it, the two
sources are compared where we hold BOTH — which is free, because both are
already in our own bucket.

⚠️ WHAT IT CANNOT ANSWER, AND SAYS SO. Faceoffs. The boxscore publishes
`faceoffWinningPctg` per player — a RATE with no denominator, so it will not sum
into a count — and that is the figure that caught the one real disagreement the
witness has found in production (CHI 28 against 30). Whatever this reports, the
rail remains the only source for faceoffs.

⭐ THE THIRD COMPARISON IS A CONTROL. The boxscore also states its own team-level
`sog`, so the per-player sum can be checked against it. We ALREADY KNOW that
disagrees occasionally — it is the "known boxscore self-disagreement" the extract
notes — so a run reporting perfect agreement there is a run whose arithmetic is
not reaching the data.

  python3 tools/box_rail_witness.py <dir>      # a store: <dir>/raw/<gid>/...
"""
import json
import pathlib
import sys

# Our name -> (the boxscore's per-player field, the rail's teamGameStats category)
# ⚠️ `faceoffWins` IS ABSENT ON PURPOSE. The boxscore gives a percentage per
# player; there is nothing here to compare, and a row quietly omitted would read
# as a figure that agreed.
FIGURES = {
    "hits":       ("hits",         "hits"),
    "giveaways":  ("giveaways",    "giveaways"),
    "takeaways":  ("takeaways",    "takeaways"),
    "pim":        ("pim",          "pim"),
    "blocked":    ("blockedShots", "blockedShots"),
    "sog":        ("sog",          "sog"),
}
SIDES = ("awayTeam", "homeTeam")


def box_sums(box):
    """Per-team totals summed out of `playerByGameStats`, or None if absent.

    ⚠️ FORWARDS, DEFENCE **AND** GOALIES. A goaltender takes penalty minutes and
    is credited with the odd shot; dropping the group would make `pim` quietly
    low on exactly the games where it matters.
    """
    pbg = (box or {}).get("playerByGameStats")
    if not pbg:
        return None
    out = {}
    for side in SIDES:
        groups = pbg.get(side) or {}
        rows = [r for g in ("forwards", "defense", "goalies") for r in (groups.get(g) or [])]
        if not rows:
            return None
        out[side] = {ours: sum(int(r.get(field) or 0) for r in rows)
                     for ours, (field, _) in FIGURES.items()}
    return out


def rail_totals(rail):
    """The league's own per-team totals, copied and not computed.

    ⛔ `awayValue`/`homeValue` ARRIVE AS STRINGS FOR SOME CATEGORIES and as
    numbers for others, which is why every read goes through `_num`: comparing
    "31" to 31 would report a disagreement on every single figure and look like
    a finding.
    """
    cats = {c.get("category"): c for c in ((rail or {}).get("teamGameStats") or [])}
    if not cats:
        return None
    out = {}
    for side, key in zip(SIDES, ("awayValue", "homeValue")):
        got = {}
        for ours, (_, theirs) in FIGURES.items():
            c = cats.get(theirs)
            if c is None:
                continue
            v = _num(c.get(key))
            if v is not None:
                got[ours] = v
        out[side] = got
    return out


def _num(v):
    """A count, or None for anything that is not one — including a percentage."""
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, float):
        return int(v) if v.is_integer() else None
    if isinstance(v, str):
        try:
            f = float(v)
        except ValueError:
            return None
        return int(f) if f.is_integer() else None
    return None


def compare(box, rail):
    """One game: {figure: [(side, boxscore, rail)]} for every team-side read.

    Returns None when either document is unreadable, so "we could not ask" never
    counts as "they agreed" — the distinction `measures_fresh.py` had to learn.
    """
    b, r = box_sums(box), rail_totals(rail)
    if b is None or r is None:
        return None
    out = {}
    for fig in FIGURES:
        rows = []
        for side in SIDES:
            if fig in r.get(side, {}):
                rows.append((side, b[side][fig], r[side][fig]))
        if rows:
            out[fig] = rows
    return out


def self_check(box):
    """The boxscore against ITSELF: per-player `sog` summed vs its team total.

    ⭐ THE CONTROL. This is known to disagree sometimes, so a run that reports it
    perfect is a run that is not reading what it thinks it is.
    """
    b = box_sums(box)
    if b is None:
        return []
    rows = []
    for side in SIDES:
        stated = _num(((box or {}).get(side) or {}).get("sog"))
        if stated is not None:
            rows.append((side, b[side]["sog"], stated))
    return rows


def games_with_both(store_dir):
    """(gid, boxscore, rail) for every game whose store holds both documents."""
    root = pathlib.Path(store_dir) / "raw"
    for latest in sorted(root.glob("*/latest.json")):
        gid = latest.parent.name
        try:
            digests = json.loads(latest.read_text())
        except Exception:                                 # noqa: BLE001
            continue
        if "boxscore" not in digests or "right-rail" not in digests:
            continue
        docs = {}
        for name in ("boxscore", "right-rail"):
            p = root / gid / digests[name] / f"{name}.json"
            if not p.exists():
                break
            try:
                docs[name] = json.loads(p.read_text())
            except Exception:                             # noqa: BLE001
                break
        if len(docs) == 2:
            yield gid, docs["boxscore"], docs["right-rail"]


def run(store_dir, out=sys.stdout):
    tally = {f: {"sides": 0, "agree": 0, "games": set(), "exact": set()} for f in FIGURES}
    disagreements = []
    self_sides = self_agree = 0
    self_bad = []
    checked = 0

    for gid, box, rail in games_with_both(store_dir):
        rows = compare(box, rail)
        if rows is None:
            continue
        checked += 1
        for fig, got in rows.items():
            t = tally[fig]
            t["games"].add(gid)
            ok = True
            for side, b, r in got:
                t["sides"] += 1
                if b == r:
                    t["agree"] += 1
                else:
                    ok = False
                    if len(disagreements) < 40:
                        disagreements.append((gid, fig, side, b, r))
            if ok:
                t["exact"].add(gid)
        for side, summed, stated in self_check(box):
            self_sides += 1
            if summed == stated:
                self_agree += 1
            elif len(self_bad) < 10:
                self_bad.append((gid, side, summed, stated))

    print(f"\n  games holding BOTH a boxscore and a right rail: {checked}", file=out)
    if not checked:
        print("  nothing to compare — this store holds no game with both documents",
              file=out)
        return {"checked": 0}

    print("\n  BOXSCORE per-player sums against the RIGHT RAIL's team totals\n", file=out)
    print(f"  {'figure':<12}{'team-sides':>12}{'agree':>8}{'games':>8}{'exact':>8}", file=out)
    for fig, t in tally.items():
        if not t["sides"]:
            print(f"  {fig:<12}{'—':>12}{'—':>8}{'—':>8}{'—':>8}"
                  "   (the rail never states it)", file=out)
            continue
        print(f"  {fig:<12}{t['sides']:>12}{t['agree']:>8}"
              f"{len(t['games']):>8}{len(t['exact']):>8}", file=out)

    print(f"\n  CONTROL — the boxscore against itself on sog: "
          f"{self_agree}/{self_sides} team-sides", file=out)
    for gid, side, summed, stated in self_bad:
        print(f"    {gid} {side}: players sum to {summed}, the team block says {stated}",
              file=out)
    if self_sides and self_agree == self_sides:
        print("    ⚠️ PERFECT, WHICH IS THE SUSPICIOUS ANSWER. The boxscore is known "
              "to disagree with itself on sog; check the arithmetic is reaching the "
              "data before trusting the table above.", file=out)

    if disagreements:
        print(f"\n  DISAGREEMENTS (first {len(disagreements)}):", file=out)
        for gid, fig, side, b, r in disagreements:
            print(f"    {gid} {fig:<10} {side:<9} boxscore {b:>4}   rail {r:>4}", file=out)
    else:
        print("\n  no disagreement on any figure, on any team-side", file=out)

    print("\n  ⚠️ faceoffWins is NOT in this table and cannot be: the boxscore "
          "publishes a percentage per player, with no denominator to sum.", file=out)
    return {"checked": checked,
            "figures": {f: {"sides": t["sides"], "agree": t["agree"]}
                        for f, t in tally.items()},
            "selfSides": self_sides, "selfAgree": self_agree}


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python3 tools/box_rail_witness.py <dir>")
    rep = run(sys.argv[1])
    if not rep.get("checked"):
        sys.exit("::error::no game in this store holds both documents — "
                 "the measurement did not run")


if __name__ == "__main__":
    main()
