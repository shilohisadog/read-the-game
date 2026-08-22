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

ROOT = pathlib.Path(__file__).resolve().parent.parent


def _competitions():
    """gameType -> name, from the one table both languages read.

    THE LEAGUE MINTS A NEW CODE WHENEVER IT INVENTS A COMPETITION, and names it
    nowhere in the feed -- 19 and 20 arrived in February 2025 for a 4 Nations
    tournament that had never been held, 9 in February 2026 for the Olympics,
    both after this archive started. Nothing watched for that: the vocabulary
    gate covers five fields inside the play-by-play and `gameType` is a property
    of the GAME, so an unknown code flowed silently into the catalog and the
    first thing to render it would have been a calendar cell reading
    "game type 21".
    """
    return json.loads((ROOT / "data" / "competitions.json").read_text())["names"]


def _vocabulary_seen():
    """Values we have looked at and deliberately left unnamed, by field.

    `noted` forgives a value that cannot reach a number and records it -- correct,
    and for a long time the whole story: 23 stoppage reasons were forgiven on
    every run while the workflow printed a count and stayed green. A record
    nobody is alerted by is the gap an unnamed gameType sat in, one field over.

    So the alarm is on DRIFT. Twenty-three known values are not news; a
    twenty-fourth is.
    """
    return {k: set(v) for k, v in json.loads(
        (ROOT / "data" / "vocabulary-seen.json").read_text())["seen"].items()}

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import extract as E
import fetch_nhl as F   # the storage layout, defined once. Imports open no socket.


def extract_key(game_id):
    return f"extract/{game_id}.json"


CATALOG_KEY = "catalog.json"


def _quote(box_raw):
    """The league's own numbers for a game, even one we are about to refuse.

    Quoting is not judging. A game we cannot show still has a score, and
    repeating the league's statement of it is the only honest claim available --
    honest precisely BECAUSE it is quoted rather than derived from a feed we
    just declined to trust.
    """
    try:
        b = json.loads(box_raw.decode())
        return {"a": b["awayTeam"]["abbrev"], "h": b["homeTeam"]["abbrev"],
                "as": b["awayTeam"]["score"], "hs": b["homeTeam"]["score"],
                "ash": b["awayTeam"]["sog"], "hsh": b["homeTeam"]["sog"]}
    except (ValueError, KeyError, AttributeError, UnicodeDecodeError):
        # A game whose boxscore is unreadable is exactly the game we cannot
        # quote. It still gets a row -- see _write_catalog.
        return {}


def _write_catalog(store, rows):
    """One document the browser reads to know what exists.

    ONE FILE. No sharding and no manifest: a season is ~100 KB and derivable
    from the game id, so a `seasons.json` would be a second document that can
    disagree with the first, bought to solve a problem that does not exist at
    ten seasons either. (CHENG.)

    REFUSED GAMES ARE IN IT, carrying which gate stopped them. Listing only what
    works would make the calendar a map of our SUCCESSES -- September blank where
    56 preseason games were played -- and `v: 0` alone would re-merge refused
    with absent at the surface after we split them upstream. Doctrine 9.

    SHOTS ON GOAL ARE ON THE CARD. Doctrine 8 governs rates, not counts, and
    23-22 is a count. It is also THE count this site exists to complicate --
    "MIN outshot BUF 35-25 and lost" is the thesis -- so hiding it from the
    browse surface would hide the number the game view is there to explain.

    No timestamp: same bytes in, same bytes out, so any diff on a re-derive is a
    real change. Freshness is index.json's job and it has a field for it.

    MERGE, NEVER REPLACE -- and this is the THIRD time this project has paid for
    that sentence. `_write_index` shipped broken for the mirror-image reason, and
    the comment warning about it is thirty lines away in fetch_nhl.py.

    A nightly run holds POINTERS for the whole archive and RAW for one night of
    it, so a run only ever judges a handful of games. Writing just those would
    have republished a catalog containing one night of hockey and silently
    deleted fifteen hundred rows a visitor could otherwise reach. A game this run
    said NOTHING about must not read as a game that is gone.
    """
    prev = store.get(CATALOG_KEY)
    merged = {}
    if prev:
        try:
            merged = {r["id"]: r for r in json.loads(prev.decode()).get("games", [])}
        except (ValueError, KeyError, TypeError):
            merged = {}    # an unreadable catalog is rebuilt, not preserved
    # This run's verdicts win outright: a row is REPLACED rather than updated, so
    # a stale `r` cannot survive a game that now publishes.
    for gid, row in rows.items():
        merged[int(gid)] = row
    store.put(CATALOG_KEY, json.dumps(
        {"games": [merged[k] for k in sorted(merged)]},
        sort_keys=True, separators=(",", ":")).encode())


@dataclass
class Report:
    derived: int = 0        # extracts written this run
    unchanged: int = 0      # already current, from the same bytes
    refused: dict = field(default_factory=dict)   # gid -> {gate, detail}
    absent: dict = field(default_factory=dict)    # gid -> raw not in THIS store
    noted: dict = field(default_factory=dict)     # field -> values seen but forgiven
    unreconciled: int = 0                        # published, but the league disagrees with itself
    types: dict = field(default_factory=dict)    # gameType -> how many games carry it
    refused_in_window: int = 0

    @property
    def published(self):
        return self.derived + self.unchanged

    def evidence(self):
        """What the next piece of work needs, not merely that there is some.

        A count says there is work; it cannot say what the work IS. One value
        blocking forty games and forty values blocking one game each produce the
        same number and are completely different jobs. The first version of this
        published `refused: 113` and left the causes in a CI log, which is where
        the next vocabulary pass would have had to start.
        """
        blocking, failed = {}, {}
        for r in self.refused.values():
            if r["gate"] == "vocabulary":
                for field, values in r["detail"].items():
                    per = blocking.setdefault(field, {})
                    for v in values:
                        per[v] = per.get(v, 0) + 1
            elif r["gate"] == "validation":
                for check in r["detail"]:
                    # The message carries the numbers of one game; the CHECK is
                    # what generalises, so key on its name.
                    name = str(check).split(":")[0].split("(")[0].strip()
                    failed[name] = failed.get(name, 0) + 1
        return blocking, failed

    def as_dict(self):
        by_gate = {}
        for r in self.refused.values():
            by_gate[r["gate"]] = by_gate.get(r["gate"], 0) + 1
        blocking, failed = self.evidence()
        return {"derived": self.derived, "unchanged": self.unchanged,
                "published": self.published, "refused": len(self.refused),
                "refusedInWindow": self.refused_in_window,
                "absent": len(self.absent), "byGate": by_gate,
                "noted": {k: sorted(v) for k, v in sorted(self.noted.items())},
                # EVERY gameType THE RUN WALKED, and the ones nobody has named.
                # Both published, because "we looked and found none" and "this
                # version did not look" are different sentences -- the same
                # reason `blocking` is present when empty.
                "gameTypes": {str(k): v for k, v in sorted(
                    self.types.items(), key=lambda kv: (kv[0] is None, kv[0]))},
                "unnamedTypes": sorted(str(k) for k in self.types
                                       if str(k) not in _competitions()),
                # ⭐ AND THE OTHER DIRECTION, which only became load-bearing when
                # the front door began GENERATING its exclusion list from this
                # table. `unnamedTypes` catches a competition the archive holds
                # and nobody named; this catches a name in the table that no game
                # carries -- which would put a competition on the front page,
                # inside the block whose whole job is stating limits, that we
                # hold zero games of. A speculative entry ("the league announced
                # something for next February") is exactly how that happens.
                #
                # Both are drift alarms over the same seam and neither can see
                # the other's direction. A guard that only checks one way is the
                # deploy exemption again: right about the cases that existed.
                "unheldTypes": sorted(k for k in _competitions()
                                      if int(k) not in self.types),
                # Forgiven values NOBODY HAS LOOKED AT YET, as opposed to the
                # ones in data/vocabulary-seen.json that we decided to render
                # raw on purpose. This is the difference between a ledger and
                # an alarm.
                "unseenVocabulary": {
                    k: sorted(set(v) - _vocabulary_seen().get(k, set()))
                    for k, v in sorted(self.noted.items())
                    if set(v) - _vocabulary_seen().get(k, set())},
                "blocking": blocking, "failedChecks": failed,
                "refusedGames": sorted(int(g) for g in self.refused),
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
        rich = E.extract(pbp, shifts, box)
    except (KeyError, TypeError, ValueError) as e:
        return None, _refuse("extract", f"{type(e).__name__}: {e}"), noted

    # validate() reports to stdout for a human reading one game. Here it runs
    # fifteen hundred times and only its verdict is wanted.
    with contextlib.redirect_stdout(io.StringIO()):
        fails, unreconciled = E.validate(rich, pbp, shifts, box)
    if fails:
        return None, _refuse("validation", fails), noted

    # WHAT THE LEAGUE COULD NOT RECONCILE WITH ITSELF, carried on the artifact.
    #
    # Not a refusal: these are games we replay faithfully from the event log,
    # where the league's separate boxscore reports a different shot total. The
    # game is showable and the disagreement is real, so the honest move is to
    # show it and say so -- Doctrine 9, the same reason a refused game keeps its
    # row instead of vanishing.
    #
    # ABSENT WHEN THERE IS NOTHING TO SAY, which is the verdict card's rule: a
    # key that is always present and usually empty teaches a reader to skip it.
    if unreconciled:
        rich["unreconciled"] = unreconciled

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

    rows = {}
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

        g = meta.get(gid, {})
        # COUNTED HERE, before any branch. Every game reaches this line --
        # published, refused, and the unchanged fast path alike -- so a new
        # competition cannot hide behind a game that happened not to be
        # re-derived on the run that first saw it.
        t = g.get("type")
        rep.types[t] = rep.types.get(t, 0) + 1
        row = {"id": int(gid), "d": g.get("date"), "t": t,
               **_quote(payloads["boxscore"])}

        # Decidable from the artifact itself, with no timestamp and no mtime --
        # so the check survives the archive being copied, and re-derivation
        # stays a pure function of the bytes.
        prev = store.get(extract_key(gid))
        if prev is not None:
            try:
                was = json.loads(prev.decode())
                if was.get("game", {}).get("src") == digests:
                    rep.unchanged += 1
                    # READ `u` BACK OFF THE STORED EXTRACT. This path skips
                    # judge() entirely, so the flag has to come from the artifact
                    # rather than from a variable this branch never computes --
                    # otherwise every unchanged game loses its disclosure on the
                    # next nightly, and the catalog would quietly heal itself
                    # into looking cleaner than the archive is.
                    rows[gid] = {**row, "v": 1,
                                 **({"u": 1} if was.get("unreconciled") else {})}
                    rep.unreconciled += 1 if was.get("unreconciled") else 0
                    continue
            except ValueError:
                pass    # unreadable extract: derive it again

        rich, refusal, noted = judge(payloads["play-by-play"], payloads["boxscore"],
                                     payloads["shifts"])
        for field, values in noted.items():
            rep.noted.setdefault(field, set()).update(values)
        if refusal is not None:
            rep.refused[gid] = refusal
            rows[gid] = {**row, "v": 0, "r": refusal["gate"]}
            g = meta.get(gid, {})
            if in_window is not None and g.get("date") in in_window:
                rep.refused_in_window += 1
            continue

        # `u` so a LIST can mark it without opening the extract. The calendar
        # and the team page both show many games at once and neither fetches an
        # extract to draw a row; without this the disclosure would exist only on
        # the page you already committed to opening.
        rows[gid] = {**row, "v": 1, **({"u": 1} if rich.get("unreconciled") else {})}
        rich["game"] = {"id": int(gid), "date": g.get("date"),
                        "type": g.get("type"), "src": digests}
        # sort_keys, and NO TIMESTAMP ANYWHERE. Determinism is a gate we can
        # actually run: same bytes in, same bytes out, so re-deriving an
        # unchanged archive produces no diff and any diff is a real change.
        store.put(extract_key(gid),
                  json.dumps(rich, sort_keys=True, separators=(",", ":")).encode())
        rep.derived += 1
        if rich.get("unreconciled"):
            rep.unreconciled += 1

    _write_catalog(store, rows)
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
        # Published games where the league's event log and its own boxscore
        # disagree. Counted so the forgiveness is auditable, exactly as `noted`
        # is -- a gate that quietly forgets what it forgave is worse than one
        # that never looked.
        "unreconciled": rep.unreconciled,
        "gameTypes": d["gameTypes"],
        "unnamedTypes": d["unnamedTypes"],
        "unheldTypes": d["unheldTypes"],
        "unseenVocabulary": d["unseenVocabulary"],
        # Present even when empty, so a reader can tell "we checked and found
        # none" from "this version did not check" -- the same distinction
        # lastRun exists to make one layer up.
        "blocking": d["blocking"],
        "failedChecks": d["failedChecks"],
        "refusedGames": d["refusedGames"],
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

    return verdict(out)


def verdict(out, say=lambda m: print(m, file=sys.stderr)):
    """The exit code, and the sentences that explain it. 0 = nothing drifted.

    ⭐ IT IS A FUNCTION BECAUSE IT WAS UNTESTABLE INSIDE main(), AND UNTESTED.
    main() parses argv and opens a FileStore, so no test could reach it -- and on
    2026-08-22 a mutation proved what that cost: setting `bad = False`, which
    disarms ALL THREE drift alarms completely, left 150 Python tests green. The
    test named `test_and_the_run_goes_RED_rather_than_only_recording_it` asserts
    the ledger and the publication and never the exit code, with a docstring that
    says in as many words "a line in index.json nobody reads is not loudly. The
    exit code is."
    That is a test whose NAME promises what its body does not do, and it was
    guarding the gameType alarm this repo shipped a day earlier calling it loud.

    A refusal is the system working, and so is an absence -- the nightly holds
    pointers for the whole archive and raw for one night of it. Neither is a
    failure, and exiting non-zero on either would make a green pipeline
    impossible to distinguish from a broken one.

    THE THREE THAT ARE DIFFERENT are all naming gaps, never data faults, and all
    three fire AFTER everything is written. None can change a number: `inScope`
    keys on 02 and 03 read off the game id. What they can do is put "game type
    21" in front of a reader, or -- since 2026-08-22, when the front door began
    generating its exclusion list from the table -- name a competition on the
    home page that we hold no games of. So the archive is published in full and
    the RUN goes red. Withholding real hockey over a missing display name is the
    mistake the 73 refused games already were.

    Alarm on DRIFT, never on the count: a check that fired on all 23 known
    vocabulary values every night would be switched off within a week, and then
    the twenty-fourth would arrive invisibly.
    """
    if out.get("unnamedTypes"):
        say(f"\n::error::the archive holds gameType {out['unnamedTypes']} and "
            f"data/competitions.json does not name it. The games are published; "
            f"add the name so the calendar stops rendering it raw.")
    if out.get("unheldTypes"):
        say(f"\n::error::data/competitions.json names gameType "
            f"{out['unheldTypes']} and the archive holds no game of it. The "
            f"front door GENERATES its exclusion list from that table, so this "
            f"would put a competition on the page we hold nothing of. Remove "
            f"the entry, or wait until a game lands.")
    if out.get("unseenVocabulary"):
        say(f"\n::error::the feed used vocabulary we have never seen: "
            f"{json.dumps(out['unseenVocabulary'])}. The games are published and "
            f"the value renders verbatim; look at it, then either give it prose "
            f"or add it to data/vocabulary-seen.json.")
    return 1 if (out.get("unnamedTypes") or out.get("unheldTypes")
                 or out.get("unseenVocabulary")) else 0


if __name__ == "__main__":
    sys.exit(main())
