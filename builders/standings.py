#!/usr/bin/env python3
"""
The league's standings on the newest regular-season date we hold, copied as a
witness to the records `measure.mjs` counts from our own games.

  python3 builders/standings.py <dir>    # reads <dir>/catalog.json,
                                         # writes <dir>/standings.json

Writes {date, season, src, teams: {AB: [wins, losses, otLosses, gamesPlayed]}}.
Optional, like the rail: a failed request writes nothing and exits 0, and the
preview then shows our record without the league's beside it.
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from fetch_nhl import WEB, http  # noqa: E402


def newest_regular_date(catalog):
    """The newest date of a published regular-season game in the newest season held."""
    rows = [g for g in catalog.get("games", []) if g.get("v") == 1 and str(g["id"])[4:6] == "02"]
    if not rows:
        return None, None
    season = max(str(g["id"])[:4] for g in rows)
    return max(g["d"] for g in rows if str(g["id"])[:4] == season), season


def parse(doc, date):
    """{AB: [w, l, otl, gp]} from the league's standings document, or None."""
    teams = {}
    for r in (doc or {}).get("standings") or []:
        ab = (r.get("teamAbbrev") or {}).get("default")
        vals = [r.get(k) for k in ("wins", "losses", "otLosses", "gamesPlayed")]
        if r.get("date") != date or not ab or not all(isinstance(v, int) for v in vals):
            return None          # a document about another day, or one we cannot read
        teams[ab] = vals
    return teams or None


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python3 builders/standings.py <dir>")
    d = pathlib.Path(sys.argv[1])
    date, season = newest_regular_date(json.loads((d / "catalog.json").read_text()))
    if not date:
        print("  standings: no regular-season game held this season, nothing to witness")
        return
    status, body = http(f"{WEB}/standings/{date}")
    teams = parse(json.loads(body), date) if status == 200 and body else None
    if not teams:
        print(f"::warning::the league's standings for {date} could not be read (HTTP {status}); "
              "records publish without the witness")
        return
    (d / "standings.json").write_text(json.dumps(
        {"date": date, "season": season, "src": "standings", "teams": teams},
        sort_keys=True, separators=(",", ":")))
    print(f"  standings: {len(teams)} teams as of {date}")


if __name__ == "__main__":
    main()
