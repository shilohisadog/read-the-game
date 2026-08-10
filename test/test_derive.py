"""Derivation — builders/derive.py.

THE THIRD STAGE, AND THE BOUNDARY IT KEEPS. fetch touches the network and never
interprets. extract interprets and never sees a socket. derive is store-to-store:
it reads raw bytes we already hold and writes extracts beside them, and it never
opens a connection either. That is what lets extract.py keep its byte-identical
gate while the same code runs over fifteen hundred games.

TWO GATES, AND THE SECOND ONE IS THE POINT. The vocabulary gate asks whether we
understand every value in the feed. Necessary, and not sufficient: all 30 games
of the 2026 Winter Olympics in our archive carry 9 plays and no shifts against a
boxscore reporting 62 shots on goal, and they pass the vocabulary gate cleanly —
nothing in them is unrecognised, because there is almost nothing in them at all.
`extract()` accepts them and produces a confident-looking game.

Only a cross-check against an INDEPENDENT source catches that, which is why the
boxscore is stored: the play-by-play claims 5 shots, the boxscore says 62. One of
validate's checks even passed on the stub by accident — `goal events == final
score`, because the nine surviving plays happen to include all five goals. A
single check would have shipped it.

So: a game is publishable only if we understand it AND it agrees with a witness.
"""
import hashlib
import json
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "builders"))
import derive as D
import fetch_nhl as F


class DictStore:
    def __init__(self, initial=None):
        self.obj = dict(initial or {})

    def has(self, key):
        return key in self.obj

    def get(self, key):
        return self.obj.get(key)

    def put(self, key, data):
        assert isinstance(data, bytes)
        self.obj[key] = data

    def keys(self, prefix=""):
        return [k for k in self.obj if k.startswith(prefix)]

    def delete(self, key):
        self.obj.pop(key, None)


# --------------------------------------------------------------------------
# A small but REAL game: everything extract() and validate() actually read.

HOME = {"id": 7, "abbrev": "BUF"}
AWAY = {"id": 30, "abbrev": "MIN"}
ROSTER = [
    {"playerId": 1, "sweaterNumber": 9, "lastName": {"default": "Aho"},
     "positionCode": "C", "teamId": 30},
    {"playerId": 2, "sweaterNumber": 1, "lastName": {"default": "Levi"},
     "positionCode": "G", "teamId": 7},
]


def play(t, secs, **details):
    mm, ss = divmod(secs, 60)
    return {"periodDescriptor": {"number": 1, "periodType": "REG"},
            "timeInPeriod": f"{mm:02d}:{ss:02d}",
            "timeRemaining": f"{19 - mm:02d}:{60 - ss if ss else 0:02d}",
            "typeDescKey": t, "homeTeamDefendingSide": "left",
            "details": details}


def pbp_bytes(plays=None):
    plays = plays if plays is not None else [
        play("faceoff", 0, winningPlayerId=1, xCoord=0, yCoord=0, eventOwnerTeamId=30),
        play("shot-on-goal", 60, shootingPlayerId=1, goalieInNetId=2,
             xCoord=-70, yCoord=3, eventOwnerTeamId=30),
        play("goal", 120, scoringPlayerId=1, goalieInNetId=2,
             xCoord=-75, yCoord=0, eventOwnerTeamId=30),
    ]
    return json.dumps({"homeTeam": HOME, "awayTeam": AWAY,
                       "rosterSpots": ROSTER, "plays": plays}).encode()


def shifts_bytes(n=1):
    return json.dumps({"data": [
        {"playerId": 1, "teamId": 30, "period": 1,
         "startTime": "00:00", "endTime": "00:45"}] * n}).encode()


def box_bytes(away_sog=2, home_sog=0, away_score=1, home_score=0):
    return json.dumps({
        "homeTeam": {**HOME, "sog": home_sog, "score": home_score},
        "awayTeam": {**AWAY, "sog": away_sog, "score": away_score}}).encode()


def seed(store, gid=2025020001, date="2026-01-10", gtype=2,
         pbp=None, shifts=None, box=None):
    """Store one game the way fetch_nhl does: content-addressed, with a pointer."""
    payloads = {"play-by-play": pbp if pbp is not None else pbp_bytes(),
                "boxscore": box if box is not None else box_bytes(),
                "shifts": shifts if shifts is not None else shifts_bytes()}
    digests = {}
    for name, body in payloads.items():
        d = hashlib.sha256(body).hexdigest()
        digests[name] = d
        store.put(F.raw_key(gid, d, name), body)
    store.put(F.latest_key(gid), json.dumps(digests, sort_keys=True).encode())
    idx = json.loads(store.get("index.json") or b"{}")
    idx.setdefault("games", []).append({"id": gid, "date": date, "type": gtype})
    store.put("index.json", json.dumps(idx).encode())
    return digests


class ADerivedGame(unittest.TestCase):

    def test_a_good_game_becomes_an_extract(self):
        store = DictStore()
        seed(store)
        rep = D.derive(store)
        self.assertEqual(rep.derived, 1)
        self.assertEqual(rep.refused, {})
        got = json.loads(store.get("extract/2025020001.json").decode())
        self.assertEqual(got["teams"]["away"]["ab"], "MIN")
        self.assertEqual(len(got["events"]), 3)

    def test_the_extract_names_the_bytes_it_came_from(self):
        # SHOW THE WORK, at the level of the pipeline. "Which bytes produced this
        # number" has to be answerable from the artifact itself, and it is also
        # what makes re-derivation decidable without a timestamp.
        store = DictStore()
        digests = seed(store)
        D.derive(store)
        got = json.loads(store.get("extract/2025020001.json").decode())
        self.assertEqual(got["game"]["id"], 2025020001)
        self.assertEqual(got["game"]["date"], "2026-01-10")
        self.assertEqual(got["game"]["type"], 2)
        self.assertEqual(got["game"]["src"], digests)

    def test_deriving_twice_writes_the_same_bytes(self):
        # DETERMINISM IS A GATE WE CAN RUN. Same input, same output — so no
        # timestamp may enter the artifact. A clock in here would make every
        # re-derivation a diff and destroy the only cheap check we have that the
        # extractor did not change under us.
        store = DictStore()
        seed(store)
        D.derive(store)
        first = store.get("extract/2025020001.json")
        D.derive(store)
        self.assertEqual(store.get("extract/2025020001.json"), first)

    def test_an_unchanged_game_is_not_re_derived(self):
        store = DictStore()
        seed(store)
        self.assertEqual(D.derive(store).derived, 1)
        again = D.derive(store)
        self.assertEqual(again.derived, 0)
        self.assertEqual(again.unchanged, 1)

    def test_an_amended_game_is_re_derived(self):
        # The pointer moved, so the extract is stale. Comparing against the
        # digests recorded IN the extract is what makes this decidable — a
        # mtime would not survive the archive being copied.
        store = DictStore()
        seed(store)
        D.derive(store)
        seed(store, pbp=pbp_bytes(plays=[
            play("faceoff", 0, winningPlayerId=1, xCoord=0, yCoord=0, eventOwnerTeamId=30),
            play("shot-on-goal", 60, shootingPlayerId=1, goalieInNetId=2,
                 xCoord=-70, yCoord=3, eventOwnerTeamId=30),
            play("goal", 120, scoringPlayerId=1, goalieInNetId=2,
                 xCoord=-75, yCoord=0, eventOwnerTeamId=30),
            play("hit", 150, hittingPlayerId=1, xCoord=10, yCoord=1, eventOwnerTeamId=30),
        ]), box=box_bytes())
        rep = D.derive(store)
        self.assertEqual(rep.derived, 1, "new bytes must produce a new extract")
        self.assertEqual(len(json.loads(store.get("extract/2025020001.json"))["events"]), 4)


class TwoGates(unittest.TestCase):

    def test_unknown_vocabulary_refuses_the_game(self):
        store = DictStore()
        seed(store, pbp=pbp_bytes(plays=[
            play("teleportation", 0, xCoord=0, yCoord=0, eventOwnerTeamId=30)]))
        rep = D.derive(store)
        self.assertEqual(rep.derived, 0)
        self.assertIn("2025020001", rep.refused)
        self.assertEqual(rep.refused["2025020001"]["gate"], "vocabulary")
        self.assertIn("teleportation", str(rep.refused["2025020001"]["detail"]))
        self.assertIsNone(store.get("extract/2025020001.json"),
                          "a refused game must publish nothing")

    def test_a_stub_that_parses_perfectly_is_still_refused(self):
        # THE OLYMPIC CASE, and the reason this class exists. 9 plays against a
        # boxscore reporting 62 shots. Every value is recognised, extract()
        # succeeds, and the result is a confident-looking game that is not one.
        # Only the independent witness says so.
        store = DictStore()
        seed(store, box=box_bytes(away_sog=26, home_sog=36, away_score=1, home_score=0))
        rep = D.derive(store)
        self.assertEqual(rep.derived, 0)
        self.assertEqual(rep.refused["2025020001"]["gate"], "validation")
        self.assertIn("SOG", str(rep.refused["2025020001"]["detail"]))
        self.assertIsNone(store.get("extract/2025020001.json"))

    def test_the_witness_must_be_independent_or_it_proves_nothing(self):
        # MUTATION GUARD on the gate above. If validation compared the extract
        # against the play-by-play it came from, a stub would agree with itself
        # perfectly and pass. Prove the boxscore is what decides: hold the feed
        # constant and move ONLY the witness.
        good, bad = DictStore(), DictStore()
        seed(good, box=box_bytes(away_sog=2, home_sog=0))
        seed(bad, box=box_bytes(away_sog=26, home_sog=36))
        self.assertEqual(D.derive(good).derived, 1)
        self.assertEqual(D.derive(bad).derived, 0)

    def test_a_refused_game_keeps_its_raw_bytes(self):
        # Refusal is a statement about what we can SHOW, never about what we
        # keep. The archive is the thing we cannot re-create; a gate that
        # deleted from it would be trading the irreplaceable for the cheap.
        store = DictStore()
        digests = seed(store, box=box_bytes(away_sog=99))
        D.derive(store)
        for name, d in digests.items():
            self.assertIsNotNone(store.get(F.raw_key(2025020001, d, name)))
        self.assertIsNotNone(store.get(F.latest_key(2025020001)))

    def test_one_bad_game_does_not_stop_the_others(self):
        store = DictStore()
        seed(store, gid=2025020001)
        seed(store, gid=2025020002, box=box_bytes(away_sog=99))
        seed(store, gid=2025020003)
        rep = D.derive(store)
        self.assertEqual(rep.derived, 2)
        self.assertEqual(list(rep.refused), ["2025020002"])

    def test_a_healthy_game_is_never_refused(self):
        # MUTATION GUARD. A gate that refuses everything would show a beautiful
        # ledger and an empty site.
        store = DictStore()
        for i in range(1, 6):
            seed(store, gid=2025020000 + i)
        rep = D.derive(store)
        self.assertEqual(rep.derived, 5)
        self.assertEqual(rep.refused, {})


class TheLedger(unittest.TestCase):

    def index(self, store):
        return json.loads(store.get("index.json").decode())

    def test_refusals_are_reported_against_the_window_they_fall_in(self):
        # `refusedInWindow` is a WINDOW figure and derive has no window of its
        # own — it walks the whole archive. So the window is passed in and used
        # only for reporting. Deriving everything and reporting on a window are
        # different questions; conflating them is what the second ledger exists
        # to prevent.
        store = DictStore()
        seed(store, gid=2025020001, date="2026-01-10", box=box_bytes(away_sog=99))
        seed(store, gid=2025020002, date="2020-01-01", box=box_bytes(away_sog=99))
        rep = D.derive(store, end="2026-01-10", days=14)
        self.assertEqual(len(rep.refused), 2, "both are refused")
        self.assertEqual(rep.refused_in_window, 1, "only one is in the window")

    def test_the_extract_ledger_is_written_beside_coverage_not_inside_it(self):
        # coverage is the FETCH window's ledger. Derivation is a different
        # question over a different set, and folding its totals into coverage
        # would be the exact conflation ingest-state.md was written about.
        store = DictStore()
        seed(store, gid=2025020001)
        seed(store, gid=2025020002, box=box_bytes(away_sog=99))
        D.derive(store, now="2026-01-11T11:30:00Z")
        idx = self.index(store)
        self.assertNotIn("refused", idx.get("coverage", {}))
        e = idx["extracts"]
        self.assertEqual(e["games"], 2, "every game we hold raw for")
        self.assertEqual(e["published"], 1)
        self.assertEqual(e["refused"], 1)
        self.assertEqual(e["games"], e["published"] + e["refused"],
                         "the third ledger closes too")
        self.assertEqual(e["asOf"], "2026-01-11T11:30:00Z")

    def test_the_reasons_are_counted_by_gate_so_the_shape_is_visible(self):
        # 30 games refused for one reason is a category; 30 refused for 30
        # reasons is a mess. The difference decides what to fix next, and a bare
        # count cannot express it.
        store = DictStore()
        seed(store, gid=2025020001, box=box_bytes(away_sog=99))
        seed(store, gid=2025020002, box=box_bytes(away_sog=99))
        seed(store, gid=2025020003, pbp=pbp_bytes(plays=[
            play("teleportation", 0, xCoord=0, yCoord=0, eventOwnerTeamId=30)]))
        D.derive(store, now="2026-01-11T11:30:00Z")
        by_gate = self.index(store)["extracts"]["byGate"]
        self.assertEqual(by_gate, {"validation": 2, "vocabulary": 1})

    def test_deriving_nothing_new_still_records_that_it_looked(self):
        store = DictStore()
        seed(store, gid=2025020001)
        D.derive(store, now="2026-01-11T11:30:00Z")
        D.derive(store, now="2026-01-12T11:30:00Z")
        self.assertEqual(self.index(store)["extracts"]["asOf"], "2026-01-12T11:30:00Z")

    def test_raw_that_is_not_in_this_store_is_absent_not_refused(self):
        # THREE OUTCOMES, NOT TWO, and this one is neither a verdict nor a
        # fault. We cannot judge a game whose bytes we do not have, so calling
        # it refused would report a verdict we never reached.
        #
        # Calling it an ERROR would be just as wrong, and that is the version
        # that would have shipped: the nightly rehydrates POINTERS ONLY -- a few
        # hundred bytes a game against an archive of hundreds of megabytes -- so
        # in the steady state most of the archive is legitimately not in this
        # store. Treating absence as damage would make every healthy nightly run
        # report fifteen hundred failures, which is how a real one gets ignored.
        #
        # Whether absence means the BUCKET is missing bytes is a question about
        # the bucket, and fetch_nhl's pointer audit already answers it against a
        # real listing. Answering it twice from a partial view is the conflation
        # this project keeps paying for.
        store = DictStore()
        digests = seed(store)
        store.delete(F.raw_key(2025020001, digests["shifts"], "shifts"))
        rep = D.derive(store)
        self.assertEqual(rep.derived, 0)
        self.assertEqual(rep.refused, {}, "no verdict was reached")
        self.assertEqual(list(rep.absent), ["2025020001"])
        self.assertNotIn("2025020001", D.derive(store).refused,
                         "and it stays out of the refusal ledger on re-runs")

    def test_absence_does_not_disturb_the_games_ledger(self):
        # pointers = games + absent, and games = published + refused. An absent
        # game must not inflate the denominator of a question it was never part
        # of -- otherwise a nightly run would report a 99% refusal rate.
        store = DictStore()
        seed(store, gid=2025020001)
        d2 = seed(store, gid=2025020002)
        store.delete(F.raw_key(2025020002, d2["boxscore"], "boxscore"))
        D.derive(store, now="2026-01-11T11:30:00Z")
        e = json.loads(store.get("index.json").decode())["extracts"]
        self.assertEqual(e["pointers"], 2)
        self.assertEqual(e["games"], 1, "only the game we could actually judge")
        self.assertEqual(e["published"], 1)
        self.assertEqual(e["absent"], 1)
        self.assertEqual(e["games"], e["published"] + e["refused"])
        self.assertEqual(e["pointers"], e["games"] + e["absent"])


if __name__ == "__main__":
    unittest.main()
