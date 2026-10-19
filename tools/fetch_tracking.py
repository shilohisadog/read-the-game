"""Fetch the league's goal tracking replays ("sprites") for one season, as published.

    python3 tools/fetch_tracking.py ingest 2026 --have have.txt --delay 0.5

Reads each game's raw play-by-play under `ingest/raw/`, takes every goal's
`pptReplayUrl`, and writes the file it names to `ingest/track/<game>/ev<event>.json`
unchanged. Keys listed in `--have` (already in the bucket) are skipped, so a rerun
fetches only what is new. Only `https://wsr.nhle.com/sprites/` addresses are fetched.
The server refuses requests that do not come from nhl.com, so the request says so.
Kevin asked the NHL for written permission on 2026-10-19 (docs/status.md).
"""
import json, pathlib, sys, time, urllib.error, urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "builders"))
import fetch_nhl as F  # noqa: E402

PREFIX = "https://wsr.nhle.com/sprites/"
HEADERS = {"Referer": "https://www.nhl.com/",
           "User-Agent": "Mozilla/5.0 (compatible; read-the-game; +https://readthegame.co)"}


def wanted(root, season):
    """[(key, url)] for every goal of `season` (e.g. "2026") whose play-by-play names a replay."""
    root = pathlib.Path(root)
    store = F.FileStore(root)
    out = []
    for latest in sorted(root.glob(f"raw/{season}*/latest.json")):
        gid = latest.parent.name
        d = json.loads(latest.read_text())
        raw = store.get(F.raw_key(gid, d["play-by-play"], "play-by-play")) if "play-by-play" in d else None
        if raw is None:
            continue
        for p in json.loads(raw).get("plays", []):
            url = p.get("pptReplayUrl")
            if p.get("typeDescKey") == "goal" and url and url.startswith(PREFIX):
                out.append((f"track/{gid}/ev{p.get('eventId')}.json", url))
    return out


def http(url, timeout=30):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:                                  # noqa: BLE001
        print(f"  transport error {url}: {e}", file=sys.stderr)
        return 0, b""


def fetch(todo, store, transport=http, delay=0.0, sleep=time.sleep):
    """Fetch each (key, url) into `store`; back off on 429. Returns a tally."""
    tally = {"fetched": 0, "missing": 0, "refused": 0, "bad": 0}
    for key, url in todo:
        for attempt in range(4):
            status, body = transport(url)
            if status != 429:
                break
            sleep(5 * (attempt + 1))
        if status == 200:
            try:
                frames = json.loads(body)
                ok = isinstance(frames, list) and frames and "onIce" in frames[0]
            except ValueError:
                ok = False
            if ok:
                store.put(key, body)
                tally["fetched"] += 1
            else:
                tally["bad"] += 1
        elif status == 404:
            tally["missing"] += 1
        else:
            tally["refused"] += 1
            print(f"  {status} {url}", file=sys.stderr)
        if delay:
            sleep(delay)
    return tally


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("root", help="the directory holding raw/ (and receiving track/)")
    ap.add_argument("season", help="the season's first year, e.g. 2026")
    ap.add_argument("--have", help="file of keys already stored, one per line")
    ap.add_argument("--delay", type=float, default=0.5, help="seconds between requests")
    a = ap.parse_args(argv[1:])
    have = set()
    if a.have and pathlib.Path(a.have).exists():
        have = {ln.strip() for ln in pathlib.Path(a.have).read_text().split() if ln.strip()}
    want = wanted(a.root, a.season)
    todo = [(k, u) for k, u in want if k not in have]
    print(f"{len(want)} goals with a tracking replay in {a.season}; {len(want) - len(todo)} already stored; "
          f"fetching {len(todo)}")
    tally = fetch(todo, F.FileStore(a.root), delay=a.delay)
    print(json.dumps(tally))
    # A refusal on most requests means the server changed its rules; say so loudly.
    if todo and tally["refused"] > len(todo) // 2:
        print("::error::most tracking requests were refused", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
