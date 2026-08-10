#!/usr/bin/env python3
"""Acquisition. Touches the network; never interprets.

THE BOUNDARY THIS FILE EXISTS TO HOLD. `extract.py` interprets and never sees a
socket, which is what lets it keep a byte-identical gate. This file is the
reverse: it fetches, it stores the bytes exactly as they arrived, and it makes
no judgement about whether they are good. Deciding that is extraction's job, and
extraction already has three gates for it.

So the game payloads are NEVER PARSED here. Not to validate them, not to
pretty-print them, not to check they are JSON. A 502 HTML error page from the
league gets stored verbatim under its own hash, and the extractor refuses it
later, loudly, where refusals belong.

The schedule IS parsed, because that is routing rather than interpretation -- it
answers "which games exist" and nothing about what happened in them.

Everything is injected. `transport(url) -> (status, bytes)` and a store with
has/get/put. A fetcher that can only be exercised against the live NHL API is a
fetcher whose interesting failures -- an amendment, a truncation, an unknown game
state -- are exactly the ones you cannot summon on demand.

  python3 builders/fetch_nhl.py --end 2026-01-10 --days 14 --out ./ingest

Writing to R2 is deliberately NOT in here. The job writes a directory and the
workflow syncs it, so this file needs no S3 client, no credentials, and no
dependencies -- and the sync is one line that can be read at a glance.
"""
import argparse
import hashlib
import json
import pathlib
import sys
import urllib.request
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

WEB = "https://api-web.nhle.com/v1"
STATS = "https://api.nhle.com/stats/rest/en"

# The three payloads that make a game. Names are the stored filenames.
FEEDS = {
    "play-by-play": lambda g: f"{WEB}/gamecenter/{g}/play-by-play",
    "boxscore": lambda g: f"{WEB}/gamecenter/{g}/boxscore",
    "shifts": lambda g: f"{STATS}/shiftcharts?cayenneExp=gameId={g}",
}

# Game states known to mean "this game is over and its feed is complete".
#
# EXACTLY ONE VALUE, BECAUSE EXACTLY ONE HAS BEEN OBSERVED -- `OFF`, across 133
# completed games sampled from three separate weeks (2023-11, 2024-04, 2025-01).
# It is the offseason; nothing unfinished is reachable from here, so the states
# meaning "scheduled", "in progress" or "final but not yet official" are unseen.
#
# Writing down a larger set would be guessing at the feed, which is the one thing
# this project does not do. The first in-season run is therefore EXPECTED to
# refuse games and report their states, and that report is how this set grows --
# deliberately, with the value in front of us. Same contract as extract.py
# --vocab, applied one layer earlier.
FINAL_STATES = frozenset({"OFF"})

SCHEDULE_SPAN = 7   # /v1/schedule/{date} answers with a seven-day week (verified)


# --------------------------------------------------------------------------
# Dates

def shift_date(iso, days):
    return (date.fromisoformat(iso) + timedelta(days=days)).isoformat()


def dates_in_window(end, days):
    """The `days` dates ending at `end`, inclusive, ascending."""
    if days < 1:
        raise ValueError("a window must contain at least one day")
    last = date.fromisoformat(end)
    return [(last - timedelta(days=n)).isoformat() for n in range(days - 1, -1, -1)]


def schedule_urls(dates):
    """The fewest schedule calls that cover every date in the window.

    The endpoint returns the week STARTING at the date asked for, so covering a
    14-day window takes two requests rather than fourteen. Asking per-date would
    fetch the same payload seven times over, which is rude to a feed we do not
    pay for and are not licensed to hammer.
    """
    if not dates:
        return []
    out, cursor, last = [], dates[0], dates[-1]
    while cursor <= last:
        out.append(f"{WEB}/schedule/{cursor}")
        cursor = shift_date(cursor, SCHEDULE_SPAN)
    return out


# --------------------------------------------------------------------------
# Classification

@dataclass
class Classified:
    final: list = field(default_factory=list)
    unknown: list = field(default_factory=list)


def classify(schedule, dates=None):
    """Split a schedule payload into games we may ingest and games we may not.

    The state field is the ONLY thing consulted. A game can carry a full score
    and a date two years past and still not be final; inferring completeness
    from anything other than the feed's own answer is exactly the guess this
    module refuses to make.
    """
    got = Classified()
    for week in schedule.get("gameWeek", []):
        if dates is not None and week.get("date") not in dates:
            continue
        for g in week.get("games", []):
            # The league's own labelling of which day this game belongs to.
            # Carried on the game so dataThrough never has to be derived from
            # our clock -- a 22:00 Pacific game belongs to its game date, not to
            # the following UTC day.
            g = {**g, "date": week.get("date")}
            (got.final if g.get("gameState") in FINAL_STATES else got.unknown).append(g)
    return got


# --------------------------------------------------------------------------
# The run

@dataclass
class Report:
    fetched: int = 0        # games stored for the first time
    unchanged: int = 0      # games whose bytes were already held
    amended: int = 0        # games the league has changed since we stored them
    refused: int = 0        # games rejected by the extraction vocabulary gate
    unknown_state: int = 0  # games whose gameState we do not recognise
    final_in_window: int = 0
    errored: int = 0
    window_days: int = 0
    errors: list = field(default_factory=list)
    unknown_states: dict = field(default_factory=dict)
    halted: bool = False
    halt_reason: str = ""
    games: list = field(default_factory=list)

    def as_dict(self):
        return {"fetched": self.fetched, "unchanged": self.unchanged,
                "amended": self.amended, "refused": self.refused,
                "unknownState": self.unknown_state, "finalInWindow": self.final_in_window,
                "errored": self.errored, "errors": self.errors,
                "unknownStates": self.unknown_states,
                "halted": self.halted, "haltReason": self.halt_reason}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def raw_key(game_id, digest, name):
    """Content-addressed, so an amendment can never overwrite its predecessor.

    A fixed path per game would destroy on write the very history the rolling
    window exists to measure.
    """
    return f"raw/{game_id}/{digest}/{name}.json"


def latest_key(game_id):
    return f"raw/{game_id}/latest.json"


def ingest(end, days, transport, store, now=None):
    rep = Report(window_days=days)
    dates = dates_in_window(end, days)

    schedule_games, seen = [], set()
    for url in schedule_urls(dates):
        status, body = transport(url)
        if status != 200:
            rep.errors.append({"url": url, "status": status})
            continue
        # The schedule is parsed: it is routing, not interpretation.
        got = classify(json.loads(body.decode()), dates)
        for g in got.final:
            if g["id"] not in seen:
                seen.add(g["id"])
                schedule_games.append(g)
        for g in got.unknown:
            if g["id"] not in seen:
                seen.add(g["id"])
                rep.unknown_state += 1
                st = g.get("gameState")
                rep.unknown_states.setdefault(st, []).append(g["id"])

    # CORRELATION, NOT SCOPE. One game with an odd state is that game's problem
    # and the rest of the night should publish. The SAME unknown value across
    # more than one game is a feed change, and publishing 6 of 7 games while
    # quietly dropping the 7th is the kind of partial success that reads as
    # health. So a recurring unknown stops the line before anything is fetched.
    rep.final_in_window = len(schedule_games)

    for st, ids in rep.unknown_states.items():
        if len(ids) > 1:
            rep.halted = True
            rep.halt_reason = (f"gameState {st!r} appeared in {len(ids)} games "
                               f"({', '.join(str(i) for i in ids)}) — the feed's "
                               f"vocabulary has changed; refusing the whole run")
            # A HALT IS RUNNING. lastRun advances, because the alternative makes
            # a deliberate stop byte-identical to a dead pipeline -- the same
            # conflation this state model was written to remove. Coverage is NOT
            # refreshed: the run refused to look, so it established nothing.
            _write_index(store, rep, now, coverage=False)
            return rep

    for g in schedule_games:
        gid = g["id"]
        payloads, failed = {}, False
        for name, url_of in FEEDS.items():
            url = url_of(gid)
            status, body = transport(url)
            if status != 200 or not body:
                rep.errors.append({"game": gid, "url": url, "status": status})
                failed = True
                break
            payloads[name] = body
        if failed:
            # No partial writes. Two of three feeds stored is a game that looks
            # present and is not, and nothing downstream could tell.
            rep.errored += 1
            continue

        digests = {n: sha256(b) for n, b in payloads.items()}
        prev_raw = store.get(latest_key(gid))
        prev = json.loads(prev_raw.decode()) if prev_raw else None

        if prev and all(prev.get(n) == d for n, d in digests.items()):
            rep.unchanged += 1
            rep.games.append({"id": gid, "date": g.get("date"), "state": "unchanged"})
            continue

        for name, body in payloads.items():
            key = raw_key(gid, digests[name], name)
            if not store.has(key):
                store.put(key, body)
        store.put(latest_key(gid), json.dumps(digests, indent=2, sort_keys=True).encode())

        if prev:
            rep.amended += 1
            rep.games.append({"id": gid, "date": g.get("date"), "state": "amended"})
        else:
            rep.fetched += 1
            rep.games.append({"id": gid, "date": g.get("date"), "state": "new"})

    # The index is written on EVERY completed run, including one that fetched
    # nothing. The earlier rule -- an empty night writes nothing -- existed only
    # to stop a single conflated field from advancing while no data arrived, and
    # splitting lastRun from dataThrough removes the need for it rather than
    # working around it.
    _write_index(store, rep, now)
    return rep


def _write_index(store, rep, now, coverage=True):
    """Four independently observable facts, none derived from the others.

    `lastRun`     the pipeline executed. Always advances, halt included.
    `dataThrough` the game DATE of the most recent game held, from the league.
    `halted`      null, or when and why we stopped on purpose.
    `coverage`    what the window expected against what we hold, with its own
                  `asOf` so figures from before a halt cannot read as current.

    The ledger closes: finalInWindow = held + errored + refused. That is the
    same conservation discipline as `counted + excluded` in the layers, pointed
    at the pipeline instead of the game, so it fails loudly in the same way.

    Games whose `gameState` we do not recognise are reported ALONGSIDE that
    ledger and never inside it -- we cannot say whether such a game is final, so
    counting it against `finalInWindow` would assert something unsupported.
    """
    stamp = now or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    prev_raw = store.get("index.json")
    idx = json.loads(prev_raw.decode()) if prev_raw else {}

    by_id = {str(g["id"]): g for g in idx.get("games", [])}
    for g in rep.games:
        if g["state"] != "unchanged" or str(g["id"]) not in by_id:
            by_id[str(g["id"])] = {"id": g["id"], "date": g.get("date")}
    idx["games"] = sorted(by_id.values(), key=lambda g: str(g["id"]))

    idx["lastRun"] = stamp

    # max(), so backfilling an older window can never make the data look older.
    dates = [g["date"] for g in idx["games"] if g.get("date")]
    if dates:
        idx["dataThrough"] = max(dates)

    idx["halted"] = ({"since": stamp, "reason": rep.halt_reason} if rep.halted else None)

    if coverage:
        idx["coverage"] = {
            "windowDays": rep.window_days,
            "finalInWindow": rep.final_in_window,
            "heldInWindow": rep.fetched + rep.amended + rep.unchanged,
            "erroredInWindow": rep.errored,
            "refusedInWindow": rep.refused,
            "unknownStateInWindow": rep.unknown_state,
            "asOf": stamp,
        }

    store.put("index.json", json.dumps(idx, indent=2, sort_keys=True).encode())


# --------------------------------------------------------------------------
# Real transport and store

def http(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "read-the-game ingest"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:                                  # noqa: BLE001
        print(f"  transport error {url}: {e}", file=sys.stderr)
        return 0, b""


class FileStore:
    """A directory. The workflow syncs it to R2, so this file needs no S3
    client, no credentials and no dependencies."""

    def __init__(self, root):
        self.root = pathlib.Path(root)

    def _p(self, key):
        return self.root / key

    def has(self, key):
        return self._p(key).exists()

    def get(self, key):
        p = self._p(key)
        return p.read_bytes() if p.exists() else None

    def put(self, key, data):
        p = self._p(key)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--end", default=date.today().isoformat(), help="last date of the window")
    ap.add_argument("--days", type=int, default=14, help="window length")
    ap.add_argument("--out", default="ingest", help="directory to write")
    a = ap.parse_args()

    store = FileStore(a.out)
    rep = ingest(a.end, a.days, http, store)

    print(json.dumps(rep.as_dict(), indent=2))
    if rep.halted:
        print(f"\nHALTED: {rep.halt_reason}", file=sys.stderr)
        return 2
    if rep.errors:
        print(f"\n{len(rep.errors)} fetch error(s); those games wrote nothing", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
