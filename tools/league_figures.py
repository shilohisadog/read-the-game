#!/usr/bin/env python3
"""
The league's own per-game figures, copied from the raw boxscore and right rail
of every game in a store, for `tools/league-witness.mjs` to hold ours against.

Copies, never computes. A field a row does not carry is left out, not zeroed.

  python3 tools/league_figures.py <dir> <out.json>   # a store: <dir>/raw/<gid>/...

Per game:
  skaters  {pid: {goals, assists, sog, powerPlayGoals}}   boxscore forwards + defense
  goalies  {pid: {saves, shotsAgainst}}                   boxscore goalies
  rail     {home: [ppGoals, ppOpportunities], away: [...]} right-rail powerPlay, if held
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "builders"))
import fetch_nhl as F     # noqa: E402

SKATER = ("goals", "assists", "sog", "powerPlayGoals")


def _int(v):
    return v if isinstance(v, int) and not isinstance(v, bool) else None


def _pair(v):
    """'1/3' -> (1, 3); anything else -> None."""
    if isinstance(v, str) and "/" in v:
        a, b = (x.strip() for x in v.split("/", 1))
        if a.isdigit() and b.isdigit():
            return int(a), int(b)
    return None


def _goalie(r):
    out = {}
    for k in ("saves", "shotsAgainst"):
        if _int(r.get(k)) is not None:
            out[k] = r[k]
    # Older boxscores carry only `saveShotsAgainst`, as "saves/shots".
    p = _pair(r.get("saveShotsAgainst"))
    if p and not out:
        out = {"saves": p[0], "shotsAgainst": p[1]}
    return out


def figures(box, rail):
    pbg = (box or {}).get("playerByGameStats") or {}
    sk, gk = {}, {}
    for side in ("home", "away"):
        team = pbg.get(f"{side}Team") or {}
        for r in (team.get("forwards") or []) + (team.get("defense") or []):
            row = {k: r[k] for k in SKATER if _int(r.get(k)) is not None}
            if row and r.get("playerId") is not None:
                sk[str(r["playerId"])] = row
        for r in team.get("goalies") or []:
            row = _goalie(r)
            if row and r.get("playerId") is not None:
                gk[str(r["playerId"])] = row
    out = {"skaters": sk, "goalies": gk}
    st = {s.get("category"): s for s in ((rail or {}).get("teamGameStats") or [])}
    pp = st.get("powerPlay")
    if pp:
        h, a = _pair(pp.get("homeValue")), _pair(pp.get("awayValue"))
        if h and a:
            out["rail"] = {"home": list(h), "away": list(a)}
    return out


def run(store_dir):
    store = F.FileStore(store_dir)
    games = {}
    for key in sorted(store.keys("raw/")):
        if not key.endswith("/latest.json"):
            continue
        gid = key.split("/")[1]
        digests = json.loads(store.get(key).decode())
        raw = {n: store.get(F.raw_key(gid, d, n)) for n, d in digests.items()}
        if raw.get("boxscore") is None:
            continue
        rail = json.loads(raw["right-rail"]) if raw.get("right-rail") else None
        games[gid] = figures(json.loads(raw["boxscore"]), rail)
    return games


def main():
    if len(sys.argv) < 3:
        sys.exit("usage: python3 tools/league_figures.py <dir> <out.json>")
    games = run(sys.argv[1])
    if not games:
        sys.exit("::error::no boxscore was read — the measurement did not run")
    pathlib.Path(sys.argv[2]).write_text(json.dumps(games, sort_keys=True, separators=(",", ":")))
    print(f"  league figures for {len(games)} games, "
          f"{sum(1 for g in games.values() if 'rail' in g)} with the rail's powerPlay")


if __name__ == "__main__":
    main()
