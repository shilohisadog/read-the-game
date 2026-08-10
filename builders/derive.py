#!/usr/bin/env python3
"""Derivation: raw bytes we already hold -> publishable extracts.

THE THIRD STAGE, AND THE BOUNDARY IT KEEPS. `fetch_nhl.py` touches the network
and never interprets. `extract.py` interprets and never sees a socket. This is
store-to-store: it reads raw we already hold and writes extracts beside them,
and it opens no connection either. So the extractor keeps its byte-identical
gate while the same code runs over an entire archive, and re-deriving a season
costs nothing at the league's expense.

That last property is the one to protect. Vocabulary and validation will both
grow for months as real games teach us what we did not know. Every one of those
lessons is a local reprocessing pass over bytes already in the bucket -- WE
FETCH ONCE AND DERIVE MANY TIMES.

TWO GATES, AND THE SECOND ONE IS WHY THIS FILE IS NOT TRIVIAL.

  vocabulary  Do we recognise every value in the feed? extract.py's --vocab
              gate, applied per game. Necessary. NOT SUFFICIENT.

  validation  Does the play-by-play agree with an independent witness? All 30
              games of the 2026 Winter Olympics in our archive carry 9 plays and
              no shifts against a boxscore reporting 62 shots on goal. They pass
              the vocabulary gate cleanly -- nothing in them is unrecognised,
              because there is almost nothing in them at all -- and extract()
              produces a confident-looking game from the wreckage. The boxscore
              is stored for exactly this: it is the only thing in the archive
              that can contradict the play-by-play.

              One of validate's own checks passed on those stubs BY ACCIDENT
              (`goal events == final score`, because the nine surviving plays
              happen to include all five goals). A single check would have
              shipped them.

A refusal is a statement about what we can SHOW, never about what we keep.
Nothing here deletes from the archive; the archive is the part we cannot
re-create.

  python3 builders/derive.py --out ingest
  python3 builders/derive.py --out ingest --end 2026-01-10 --days 14
"""
import argparse
import contextlib
import io
import json
import pathlib
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import extract as E
import fetch_nhl as F   # the storage layout, defined once. Imports open no socket.


def extract_key(game_id):
    return f"extract/{game_id}.json"


@dataclass
class Report:
    derived: int = 0        # extracts written this run
    unchanged: int = 0      # already current, from the same bytes
    refused: dict = field(default_factory=dict)   # gid -> {gate, detail}
    absent: dict = field(default_factory=dict)    # gid -> raw not in THIS store
    noted: dict = field(default_factory=dict)     # field -> values seen but forgiven
    refused_in_window: int = 0

    @property
    def published(self):
        return self.derived + self.unchanged

    def as_dict(self):
        by_gate = {}
        for r in self.refused.values():
            by_gate[r["gate"]] = by_gate.get(r["gate"], 0) + 1
        return {"derived": self.derived, "unchanged": self.unchanged,
                "published": self.published, "refused": len(self.refused),
                "refusedInWindow": self.refused_in_window,
                "absent": len(self.absent), "byGate": by_gate,
                "noted": {k: sorted(v) for k, v in sorted(self.noted.items())},
                "reasons": {g: r["detail"] for g, r in sorted(self.refused.items())}}


def _refuse(gate, detail):
    return {"gate": gate, "detail": detail}


def judge(pbp_raw, box_raw, shifts_raw):
    """Decide a single game. Returns (rich, refusal, noted).

    Exactly one of rich/refusal is None. `noted` is vocabulary we recognised as
    harmless -- unknown, recorded, and not a reason to withhold a game.

    Pure: bytes in, verdict out. No store, no clock, no network, so the whole
    decision is testable without any of them.
    """
    try:
        pbp = json.loads(pbp_raw.decode())
        box = json.loads(box_raw.decode())
        shifts = json.loads(shifts_raw.decode())
    except (ValueError, UnicodeDecodeError) as e:
        # The fetcher stores whatever arrived, deliberately, without looking --
        # a 502 HTML error page from the league is archived verbatim under its
        # own hash. This is where that gets noticed, which is where refusals
        # belong.
        return None, _refuse("parse", f"stored bytes are not JSON: {e}"), {}

    # REFUSE ON WHAT CAN CHANGE A NUMBER, RECORD THE REST.
    #
    # An unknown stoppage reason cannot alter anything we display, because the
    # extract drops stoppage detail entirely -- so withholding a game over one
    # is withholding it over a field we never read. Twelve of 48 refusals in a
    # 62-game sample were exactly that and nothing else.
    #
    # They are still returned, because the parked whistle layer will need them
    # and doctrine 9 says what we set aside stays visible. A gate that quietly
    # forgets what it forgave is worse than one that never looked.
    _, unknown = E.vocabulary(pbp)
    blocking = {k: sorted(v) for k, v in sorted(unknown.items())
                if k in E.CONSEQUENTIAL}
    noted = {k: sorted(v) for k, v in sorted(unknown.items())
             if k not in E.CONSEQUENTIAL}
    if blocking:
        return None, _refuse("vocabulary", blocking), noted

    try:
        rich = E.extract(pbp, shifts)
    except (KeyError, TypeError, ValueError) as e:
        return None, _refuse("extract", f"{type(e).__name__}: {e}"), noted

    # validate() reports to stdout for a human reading one game. Here it runs
    # fifteen hundred times and only its verdict is wanted.
    with contextlib.redirect_stdout(io.StringIO()):
        fails = E.validate(rich, pbp, shifts, box)
    if fails:
        return None, _refuse("validation", fails), noted

    return rich, None, noted


def derive(store, end=None, days=None, now=None):
    """Walk every game we hold raw for and publish the ones that earn it."""
    rep = Report()
    stamp = now or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    idx = json.loads((store.get("index.json") or b"{}").decode())
    meta = {str(g["id"]): g for g in idx.get("games", [])}

    # The window is passed IN and used only for reporting. Derivation has no
    # window of its own -- it walks the archive -- and `refusedInWindow` is a
    # window figure. Deriving everything and reporting on a window are different
    # questions; answering both with one number is the conflation the second
    # ledger exists to prevent.
    in_window = set(F.dates_in_window(end, days)) if end and days else None

    for key in sorted(store.keys("raw/")):
        if not key.endswith("/latest.json"):
            continue
        gid = key.split("/")[1]
        digests = json.loads(store.get(key).decode())

        payloads = {}
        for name, d in digests.items():
            payloads[name] = store.get(F.raw_key(gid, d, name))
        missing = [n for n, b in payloads.items() if b is None]
        if missing:
            # ABSENT, NOT REFUSED, AND NOT AN ERROR EITHER.
            #
            # We never reached a verdict, so recording one would assert
            # something we did not establish. But it is also not evidence of
            # damage: the nightly run rehydrates POINTERS ONLY -- a few hundred
            # bytes a game against an archive of hundreds of megabytes -- so in
            # the steady state most of the archive is legitimately not in this
            # store, and calling that an error would make every healthy run
            # report fifteen hundred failures.
            #
            # Whether absent means "missing from the bucket" is a question about
            # the bucket, and fetch_nhl's pointer audit already answers it
            # against a real listing. Answering it twice, differently, from a
            # partial view is exactly the conflation we keep paying for.
            rep.absent[gid] = f"raw not in this store for {sorted(missing)}"
            continue

        # Decidable from the artifact itself, with no timestamp and no mtime --
        # so the check survives the archive being copied, and re-derivation
        # stays a pure function of the bytes.
        prev = store.get(extract_key(gid))
        if prev is not None:
            try:
                if json.loads(prev.decode()).get("game", {}).get("src") == digests:
                    rep.unchanged += 1
                    continue
            except ValueError:
                pass    # unreadable extract: derive it again

        rich, refusal, noted = judge(payloads["play-by-play"], payloads["boxscore"],
                                     payloads["shifts"])
        for field, values in noted.items():
            rep.noted.setdefault(field, set()).update(values)
        if refusal is not None:
            rep.refused[gid] = refusal
            g = meta.get(gid, {})
            if in_window is not None and g.get("date") in in_window:
                rep.refused_in_window += 1
            continue

        g = meta.get(gid, {})
        rich["game"] = {"id": int(gid), "date": g.get("date"),
                        "type": g.get("type"), "src": digests}
        # sort_keys, and NO TIMESTAMP ANYWHERE. Determinism is a gate we can
        # actually run: same bytes in, same bytes out, so re-deriving an
        # unchanged archive produces no diff and any diff is a real change.
        store.put(extract_key(gid),
                  json.dumps(rich, sort_keys=True, separators=(",", ":")).encode())
        rep.derived += 1

    _write_ledger(store, idx, rep, stamp)
    return rep


def _write_ledger(store, idx, rep, stamp):
    """A third ledger, beside coverage rather than inside it.

        pointers = games + absent         every pointer we walked
        games    = published + refused    of the ones we could read

    `coverage` is the FETCH window's ledger and answers a different question
    over a different set. Folding derivation totals into it would recreate
    exactly the conflation docs/ingest-state.md was written about.

    `byGate` is there because thirty games refused for one reason is a category
    and thirty refused for thirty reasons is a mess, and a bare count cannot
    tell you which you have -- which is the thing that decides what to fix next.
    """
    d = rep.as_dict()
    idx["extracts"] = {
        "pointers": d["published"] + d["refused"] + d["absent"],
        "games": d["published"] + d["refused"],
        "published": d["published"],
        "refused": d["refused"],
        "refusedInWindow": rep.refused_in_window,
        "absent": d["absent"],
        "byGate": d["byGate"],
        # Vocabulary we did not understand and published anyway, because it
        # cannot reach a number. Visible so the forgiveness is auditable, and so
        # the whistle layer inherits a list instead of a survey.
        "noted": d["noted"],
        "asOf": stamp,
    }
    store.put("index.json", json.dumps(idx, indent=2, sort_keys=True).encode())


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default="ingest", help="the store directory")
    ap.add_argument("--end", help="last date of the reporting window")
    ap.add_argument("--days", type=int, help="reporting window length")
    a = ap.parse_args()

    rep = derive(F.FileStore(a.out), end=a.end, days=a.days)
    out = rep.as_dict()
    # The full reason list is for a human growing the vocabulary, and at
    # fifteen hundred games it drowns the report. Counts here, detail below.
    reasons = out.pop("reasons")
    print(json.dumps(out, indent=2, sort_keys=True))

    if reasons:
        print(f"\n{len(reasons)} refused:", file=sys.stderr)
        for gid, detail in list(reasons.items())[:25]:
            print(f"  {gid}: {json.dumps(detail)[:160]}", file=sys.stderr)
        if len(reasons) > 25:
            print(f"  … and {len(reasons) - 25} more", file=sys.stderr)

    # A refusal is the system working, and so is an absence -- the nightly
    # holds pointers for the whole archive and raw for one night of it. Neither
    # is a failure, and exiting non-zero on either would make a green pipeline
    # impossible to distinguish from a broken one.
    return 0


if __name__ == "__main__":
    sys.exit(main())
