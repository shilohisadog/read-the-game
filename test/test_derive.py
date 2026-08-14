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
             xCoord=-75, yCoord=0, eventOwnerTeamId=30,
             # The league's running score after this goal. Real feeds carry it on
             # every goal — 198 of 198 across three sampled seasons — so a fixture
             # without it is not a smaller game, it is an impossible one.
             awayScore=1, homeScore=0),
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
                 xCoord=-75, yCoord=0, eventOwnerTeamId=30,
                 # The league's running score after this goal. Real feeds carry it on
                 # every goal — 198 of 198 across three sampled seasons — so a fixture
                 # without it is not a smaller game, it is an impossible one.
                 awayScore=1, homeScore=0),
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

    def test_a_clock_that_is_not_mm_ss_refuses_the_game(self):
        # THE DEEP-LINK ORDINAL RIDES ON A DOT. `?at=2-14:32.3` names the third
        # event at that clock, and it is unambiguous only while a clock is
        # strictly MM:SS. The NHL scoreboard shows tenths under a minute; a feed
        # that ever exposed `14:32.7` would make the separator collide with a
        # time component and land every link into that game on the wrong event
        # while looking entirely correct. So it is a refusal, not a surprise.
        store = DictStore()
        plays = json.loads(pbp_bytes().decode())["plays"]
        plays[1]["timeRemaining"] = "18:00.7"
        seed(store, pbp=pbp_bytes(plays=plays))
        rep = D.derive(store)
        self.assertEqual(rep.derived, 0)
        self.assertEqual(rep.refused["2025020001"]["gate"], "validation")
        self.assertIn("MM:SS", str(rep.refused["2025020001"]["detail"]))

    def test_the_clock_gate_is_about_the_clock_and_nothing_else(self):
        # PAIRED with the test above, because a gate that refuses everything is
        # not a gate. Hold the game constant and move ONLY the clock format.
        good, bad = DictStore(), DictStore()
        plays = json.loads(pbp_bytes().decode())["plays"]
        seed(good, pbp=pbp_bytes(plays=plays))
        broken = json.loads(pbp_bytes().decode())["plays"]
        broken[1]["timeRemaining"] = "8:00"          # minutes not zero-padded
        seed(bad, pbp=pbp_bytes(plays=broken))
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


class TheSituationCodeIsARule(unittest.TestCase):
    """It was eight strings — every code one November game happened to contain.

    A season contains nineteen, and none of the missing ones were mysteries:
    0641 is an away goalie pulled for a 6-on-4, 1331 is three-on-three overtime,
    0440 is both goalies pulled at four aside, 0101 and 1010 are shootout
    attempts. They were "unknown" only because we enumerated a sample and called
    it a language — the same mistake as FINAL_STATES holding one word.

    The decode was checked against 19,272 real events across 62 games spanning
    preseason, regular season, overtime and shootouts: zero violations.
    """

    def test_every_code_the_archive_actually_contains_decodes(self):
        import extract as E
        for code in ("1551", "1541", "1451", "1441", "0651", "1560", "1450",
                     "1540", "0431", "0440", "0551", "0641", "1331", "1340",
                     "1341", "1351", "1431", "1460", "1531"):
            self.assertTrue(E.situation_ok(code), f"{code} is real hockey")
        for code in ("0101", "1010"):
            self.assertTrue(E.situation_ok(code, "SO"), f"{code} is a shootout attempt")

    def test_one_shooter_against_one_goalie_is_legal_in_any_period(self):
        # A PENALTY SHOT, and the rule was too narrow because the sample was.
        # 0101 and 1010 were tied to periodType SO on the evidence of 62 games
        # where they only appeared there — and across the full archive they block
        # 44 games in REGULATION. Game 2025010011 settles it: at 19:44 of the
        # second period, a penalty carrying descKey `ps-slash-on-breakaway`
        # followed immediately by a goal at situationCode 0101.
        #
        # Structurally it is a shootout attempt; in every way that matters it is
        # not. A penalty shot happens in play, counts toward the score and counts
        # as a shot on goal — which is why the layers key on `pt`, not on the
        # code, and already treat it correctly.
        import extract as E
        for pt in (None, "REG", "OT", "SO"):
            self.assertTrue(E.situation_ok("0101", pt), f"0101 in {pt}")
            self.assertTrue(E.situation_ok("1010", pt), f"1010 in {pt}")

    def test_the_rule_still_refuses_what_hockey_cannot_do(self):
        # MUTATION GUARD, and the whole risk of moving from a list to a rule: a
        # rule that accepts everything is not a gate. Nine skaters, two goalies
        # on one side, a short code and a non-numeric one must all still fail.
        import extract as E
        for code in ("1991", "1552", "155", "15A1", "", None, "9999"):
            self.assertFalse(E.situation_ok(code), f"{code!r} must not decode")
        self.assertFalse(E.situation_ok("1551", "SO"), "five aside inside a shootout")
        # Three skaters against nobody is not a penalty shot and not a shift.
        # Two games in the archive carry these; the gate holds them and says so
        # rather than being widened until they fit.
        self.assertFalse(E.situation_ok("0301"), "three skaters against no one")
        self.assertFalse(E.situation_ok("1030"), "and its mirror")

    def test_an_unrecognisable_code_still_refuses_the_game(self):
        store = DictStore()
        seed(store, pbp=pbp_bytes(plays=[
            play("faceoff", 0, winningPlayerId=1, xCoord=0, yCoord=0,
                 eventOwnerTeamId=30)]))
        raw = json.loads(store.get(F.latest_key(2025020001)).decode())
        pbp = json.loads(store.get(F.raw_key(2025020001, raw["play-by-play"],
                                             "play-by-play")).decode())
        pbp["plays"][0]["situationCode"] = "1991"
        seed(store, pbp=json.dumps(pbp).encode())
        rep = D.derive(store)
        self.assertEqual(rep.refused["2025020001"]["gate"], "vocabulary")
        self.assertIn("1991", str(rep.refused["2025020001"]["detail"]))


class ForgivenessIsRecorded(unittest.TestCase):

    def test_an_unknown_stoppage_reason_does_not_withhold_a_game(self):
        # The extract drops stoppage detail entirely, so an unrecognised whistle
        # reason cannot alter a number we display. Twelve of 48 refusals in a
        # 62-game sample were exactly this and nothing else.
        store = DictStore()
        seed(store, pbp=pbp_bytes(plays=[
            play("faceoff", 0, winningPlayerId=1, xCoord=0, yCoord=0, eventOwnerTeamId=30),
            play("shot-on-goal", 60, shootingPlayerId=1, goalieInNetId=2,
                 xCoord=-70, yCoord=3, eventOwnerTeamId=30),
            play("goal", 120, scoringPlayerId=1, goalieInNetId=2,
                 xCoord=-75, yCoord=0, eventOwnerTeamId=30,
                 # The league's running score after this goal. Real feeds carry it on
                 # every goal — 198 of 198 across three sampled seasons — so a fixture
                 # without it is not a smaller game, it is an impossible one.
                 awayScore=1, homeScore=0),
            play("stoppage", 150, reason="zamboni-on-fire", eventOwnerTeamId=30),
        ]))
        rep = D.derive(store)
        self.assertEqual(rep.derived, 1, "a game is not withheld over a field we drop")
        self.assertIn("zamboni-on-fire", rep.noted["stoppage reason"])

    def test_what_was_forgiven_is_published_not_hidden(self):
        # Doctrine 9: a gate that quietly forgets what it forgave is worse than
        # one that never looked. The whistle layer inherits a list, not a survey.
        store = DictStore()
        seed(store, pbp=pbp_bytes(plays=[
            play("faceoff", 0, winningPlayerId=1, xCoord=0, yCoord=0, eventOwnerTeamId=30),
            play("shot-on-goal", 60, shootingPlayerId=1, goalieInNetId=2,
                 xCoord=-70, yCoord=3, eventOwnerTeamId=30),
            play("goal", 120, scoringPlayerId=1, goalieInNetId=2,
                 xCoord=-75, yCoord=0, eventOwnerTeamId=30,
                 # The league's running score after this goal. Real feeds carry it on
                 # every goal — 198 of 198 across three sampled seasons — so a fixture
                 # without it is not a smaller game, it is an impossible one.
                 awayScore=1, homeScore=0),
            play("stoppage", 150, reason="rink-repair", eventOwnerTeamId=30),
        ]))
        D.derive(store, now="2026-01-11T11:30:00Z")
        idx = json.loads(store.get("index.json").decode())
        self.assertEqual(idx["extracts"]["noted"]["stoppage reason"], ["rink-repair"])


class TheShootoutIsNotPlay(unittest.TestCase):
    """Period 5 is a shootout in the regular season and a third overtime in the
    playoffs, so the period NUMBER cannot tell them apart. `pt` can.

    Both checks below were wrong in the same direction: they compared our count
    of everything against a witness that counts only play, then reported the
    difference as a fault. Six of 62 sampled games reached a shootout.
    """

    def so(self, t, secs, **d):
        p = play(t, secs, **d)
        p["periodDescriptor"] = {"number": 5, "periodType": "SO"}
        return p

    def game_with_shootout(self, scoring_attempts):
        plays = [
            play("faceoff", 0, winningPlayerId=1, xCoord=0, yCoord=0, eventOwnerTeamId=30),
            play("shot-on-goal", 60, shootingPlayerId=1, goalieInNetId=2,
                 xCoord=-70, yCoord=3, eventOwnerTeamId=30),
            play("goal", 120, scoringPlayerId=1, goalieInNetId=2,
                 xCoord=-75, yCoord=0, eventOwnerTeamId=30,
                 # The league's running score after this goal. Real feeds carry it on
                 # every goal — 198 of 198 across three sampled seasons — so a fixture
                 # without it is not a smaller game, it is an impossible one.
                 awayScore=1, homeScore=0),
        ]
        for i in range(scoring_attempts):
            plays.append(self.so("goal", 10 + i, scoringPlayerId=1, goalieInNetId=2,
                                 xCoord=-80, yCoord=0, eventOwnerTeamId=30))
        plays.append(self.so("shootout-complete", 60, eventOwnerTeamId=30))
        return pbp_bytes(plays=plays)

    def test_shootout_attempts_are_not_shots_on_goal(self):
        # The boxscore excludes them, so counting them here compared two
        # different quantities. Away takes 2 real shots and 1 shootout attempt;
        # the witness says 2.
        store = DictStore()
        seed(store, pbp=self.game_with_shootout(1),
             box=box_bytes(away_sog=2, home_sog=0, away_score=2, home_score=0))
        self.assertEqual(D.derive(store).derived, 1)

    def test_a_shootout_adds_exactly_one_goal_however_many_go_in(self):
        # THE CORRECT-BY-ACCIDENT CASE. This check passed on shootout games only
        # when exactly one attempt scored — true of three sampled games and
        # false of a fourth, which carried nine goal events against a score of
        # seven. Three attempts score here; the scoreboard moves by one.
        store = DictStore()
        seed(store, pbp=self.game_with_shootout(3),
             box=box_bytes(away_sog=2, home_sog=0, away_score=2, home_score=0))
        self.assertEqual(D.derive(store).derived, 1,
                         "four goal events, and a final score of two")

    def test_the_extract_carries_the_period_type_so_this_is_expressible(self):
        store = DictStore()
        seed(store, pbp=self.game_with_shootout(1),
             box=box_bytes(away_sog=2, home_sog=0, away_score=2, home_score=0))
        D.derive(store)
        ev = json.loads(store.get("extract/2025020001.json").decode())["events"]
        self.assertEqual([e["pt"] for e in ev][-2:], ["SO", "SO"])
        self.assertEqual(ev[0]["pt"], "REG", "and the run of play is still marked")


class TheLedgerMustBeActionable(unittest.TestCase):
    """A count tells you there is work. It does not tell you what the work is.

    The first version published `refused: 113` and `byGate`, and the values that
    actually caused those refusals existed only in a CI log — so the next
    vocabulary pass would have started with log archaeology instead of the
    artifact. What we publish should be enough to do the next piece of work.
    """

    def index(self, store):
        return json.loads(store.get("index.json").decode())

    def test_the_blocking_values_are_published_with_their_weight(self):
        # Which value, and how many games it costs. One value blocking 40 games
        # and 40 values blocking one game each are the same count and completely
        # different jobs.
        store = DictStore()
        for gid in (2025020001, 2025020002, 2025020003):
            seed(store, gid=gid, pbp=pbp_bytes(plays=[
                play("teleportation", 0, xCoord=0, yCoord=0, eventOwnerTeamId=30)]))
        seed(store, gid=2025020004, pbp=pbp_bytes(plays=[
            play("time-travel", 0, xCoord=0, yCoord=0, eventOwnerTeamId=30)]))
        D.derive(store, now="2026-01-11T11:30:00Z")
        blocking = self.index(store)["extracts"]["blocking"]
        self.assertEqual(blocking["typeDescKey"], {"teleportation": 3, "time-travel": 1})

    def test_the_failing_checks_are_published_too(self):
        store = DictStore()
        seed(store, gid=2025020001, box=box_bytes(away_sog=99))
        seed(store, gid=2025020002, box=box_bytes(away_sog=98))
        D.derive(store, now="2026-01-11T11:30:00Z")
        failed = self.index(store)["extracts"]["failedChecks"]
        self.assertEqual(sum(failed.values()), 2)
        self.assertTrue(any("SOG" in k for k in failed), f"named, not numbered: {failed}")

    def test_the_refused_games_are_named_so_they_can_be_looked_at(self):
        store = DictStore()
        seed(store, gid=2025020001)
        seed(store, gid=2025020002, box=box_bytes(away_sog=99))
        D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertEqual(self.index(store)["extracts"]["refusedGames"], [2025020002])

    def test_a_clean_archive_publishes_empty_evidence_not_missing_evidence(self):
        # MUTATION GUARD. If these keys vanished when there was nothing to
        # report, a consumer could not tell "we checked and found none" from
        # "this version did not check" — the same distinction lastRun exists for.
        store = DictStore()
        seed(store, gid=2025020001)
        D.derive(store, now="2026-01-11T11:30:00Z")
        e = self.index(store)["extracts"]
        for k in ("blocking", "failedChecks", "refusedGames", "noted"):
            self.assertIn(k, e, f"{k} must be present even when empty")
        self.assertEqual(e["refusedGames"], [])


class TheLeaguesNumbersAreQuotedOnce(unittest.TestCase):
    """CHENG's sharpening of the catalog design.

    The score is NOT in the extract — it is derived from events, and deriving it
    correctly now means goals in play plus one to whoever won the shootout, a
    rule that lives in layer.js. A catalog built in Python from extracts would
    need a SECOND implementation of that rule, in a second language.

    So the catalog quotes the league instead of recomputing it. But if the
    boxscore is only ever read inside validate() as a transient, the catalog
    builder and the validator each reach for it independently and are one
    refactor from disagreeing about WHICH boxscore field. It goes in the
    extract, tagged as quoted, so there is exactly one place the league's
    number enters the system.
    """

    def test_the_extract_carries_the_leagues_own_numbers_tagged_as_quoted(self):
        store = DictStore()
        seed(store, box=box_bytes(away_sog=2, home_sog=0, away_score=1, home_score=0))
        D.derive(store)
        g = json.loads(store.get("extract/2025020001.json").decode())
        q = g["quoted"]
        self.assertEqual(q["src"], "boxscore", "the field says where it came from")
        self.assertEqual(q["away"], {"score": 1, "sog": 2})
        self.assertEqual(q["home"], {"score": 0, "sog": 0})

    def test_quoted_is_copied_not_recomputed(self):
        # MUTATION GUARD, and the whole point. If this field were derived from
        # events it would agree with our count by construction and could never
        # contradict it — which is exactly the property that makes it worth
        # storing. A game that FAILS validation still quotes the league
        # faithfully, because quoting is not judging.
        pbp = pbp_bytes()
        rich_events = 2   # our SOG for the away side: one shot + one goal
        store = DictStore()
        seed(store, box=box_bytes(away_sog=99, home_sog=0, away_score=1, home_score=0))
        rich, refusal, _ = D.judge(pbp, box_bytes(away_sog=99, home_sog=0,
                                                  away_score=1, home_score=0),
                                   shifts_bytes())
        self.assertIsNotNone(refusal, "99 shots against our 2 must not reconcile")
        self.assertEqual(refusal["gate"], "validation")


class TheCatalog(unittest.TestCase):
    """One document the browser reads to know what exists.

    Single file, no sharding, no manifest — CHENG: a second document is one that
    can disagree with the first, and the season is derivable from the game id, so
    a manifest buys nothing at 100 KB that it does not cost at 1 MB.
    """

    def rows(self, store):
        return {r["id"]: r for r in json.loads(store.get("catalog.json").decode())["games"]}

    def test_a_published_game_is_listed_with_the_leagues_numbers(self):
        store = DictStore()
        seed(store, box=box_bytes(away_sog=2, home_sog=0, away_score=1, home_score=0))
        D.derive(store)
        r = self.rows(store)[2025020001]
        self.assertEqual([r["a"], r["h"]], ["MIN", "BUF"])
        self.assertEqual([r["as"], r["hs"]], [1, 0], "score, quoted")
        self.assertEqual([r["ash"], r["hsh"]], [2, 0], "shots on goal, quoted")
        self.assertEqual(r["v"], 1)
        self.assertEqual(r["d"], "2026-01-10")

    def test_shots_on_goal_are_on_the_card(self):
        # CHENG, and he is right: doctrine 8 governs RATES, not counts. 23-22 is
        # a count, and it is the count the whole site exists to complicate --
        # "MIN outshot BUF 35-25 and lost" is the thesis. Withholding it from the
        # browse surface would hide the number the game view is there to explain.
        store = DictStore()
        seed(store, box=box_bytes(away_sog=35, home_sog=25, away_score=2, home_score=3))
        D.derive(store)
        r = self.rows(store)[2025020001]
        self.assertEqual([r["ash"], r["hsh"]], [35, 25])

    def test_a_refused_game_is_listed_too_and_says_which_gate(self):
        # Listing only what works would make the calendar a MAP OF OUR SUCCESSES,
        # with September blank where 56 preseason games were played. And `v: 0`
        # alone would re-merge refused with absent at the surface, after we split
        # them upstream -- three different sentences to a visitor.
        store = DictStore()
        seed(store, gid=2025020002, box=box_bytes(away_sog=99))
        D.derive(store)
        r = self.rows(store)[2025020002]
        self.assertEqual(r["v"], 0)
        self.assertEqual(r["r"], "validation")

    def test_a_refused_game_still_quotes_the_league(self):
        # It is the only claim we can make about a game we cannot show, and it is
        # honest precisely BECAUSE it is quoted rather than derived -- we are
        # repeating the league, not asserting our own reading of a feed we just
        # refused.
        store = DictStore()
        seed(store, gid=2025020002, box=box_bytes(away_sog=99, home_sog=7,
                                                  away_score=4, home_score=2))
        D.derive(store)
        r = self.rows(store)[2025020002]
        self.assertEqual([r["as"], r["hs"], r["ash"], r["hsh"]], [4, 2, 99, 7])

    def test_the_catalog_is_deterministic(self):
        # No timestamp, for the same reason an extract has none: same bytes in,
        # same bytes out, so any diff on a re-derive is a real change. Freshness
        # is index.json's job and it already has a field for it.
        store = DictStore()
        seed(store)
        D.derive(store, now="2026-01-11T11:30:00Z")
        first = store.get("catalog.json")
        D.derive(store, now="2026-02-02T02:02:02Z")
        self.assertEqual(store.get("catalog.json"), first)

    def test_rows_are_ordered_by_id_so_the_file_diffs_cleanly(self):
        store = DictStore()
        for gid in (2025020003, 2025020001, 2025020002):
            seed(store, gid=gid)
        D.derive(store)
        ids = [r["id"] for r in json.loads(store.get("catalog.json").decode())["games"]]
        self.assertEqual(ids, sorted(ids))

    def test_the_catalog_covers_every_game_we_hold_raw_for(self):
        # The conservation habit, pointed at the browse surface: a game that is
        # in the archive and in neither the published nor the refused rows has
        # vanished from the only place a visitor could find it.
        store = DictStore()
        seed(store, gid=2025020001)
        seed(store, gid=2025020002, box=box_bytes(away_sog=99))
        seed(store, gid=2025020003, pbp=pbp_bytes(plays=[
            play("teleportation", 0, xCoord=0, yCoord=0, eventOwnerTeamId=30)]))
        D.derive(store)
        rows = self.rows(store)
        self.assertEqual(sorted(rows), [2025020001, 2025020002, 2025020003])
        self.assertEqual([rows[2025020002]["r"], rows[2025020003]["r"]],
                         ["validation", "vocabulary"])


class TheCatalogMerges(unittest.TestCase):
    """MERGE, NEVER REPLACE — the third time this project has paid for it.

    `_write_index` shipped broken for exactly this reason: it only rewrote
    entries for games that had changed, and `unchanged` is the steady state of a
    converging pipeline. The catalog had the mirror-image bug and it was worse,
    because a nightly run holds POINTERS for the whole archive and RAW for one
    night of it — so every run would have republished a catalog containing only
    that night's games and deleted 1,500 rows a visitor could otherwise reach.

    A game absent from this store is a game we said nothing about. Saying
    nothing must not read as "it is gone."
    """

    def rows(self, store):
        return {r["id"]: r for r in json.loads(store.get("catalog.json").decode())["games"]}

    def test_a_partial_run_keeps_the_games_it_did_not_look_at(self):
        store = DictStore()
        seed(store, gid=2025020001)
        D.derive(store)

        # the archive's raw is not on this runner; only its pointer is
        d = json.loads(store.get(F.latest_key(2025020001)).decode())
        for name, dig in d.items():
            store.delete(F.raw_key(2025020001, dig, name))

        seed(store, gid=2025020002)
        rep = D.derive(store)
        self.assertEqual(list(rep.absent), ["2025020001"], "we said nothing about it")
        self.assertEqual(sorted(self.rows(store)), [2025020001, 2025020002],
                         "and it must still be reachable")

    def test_a_re_judged_game_is_replaced_not_duplicated(self):
        store = DictStore()
        seed(store, gid=2025020001, box=box_bytes(away_sog=99))
        D.derive(store)
        self.assertEqual(self.rows(store)[2025020001]["v"], 0)

        # the same game, now with a boxscore it reconciles against
        seed(store, gid=2025020001, box=box_bytes(away_sog=2, home_sog=0,
                                                 away_score=1, home_score=0))
        D.derive(store)
        r = self.rows(store)
        self.assertEqual(len(r), 1, "one row per game, not one per verdict")
        self.assertEqual(r[2025020001]["v"], 1, "the newer verdict wins")
        self.assertNotIn("r", r[2025020001], "and the stale refusal reason is gone")

    def test_the_merged_catalog_stays_ordered(self):
        store = DictStore()
        seed(store, gid=2025020005)
        D.derive(store)
        seed(store, gid=2025020001)
        D.derive(store)
        ids = [r["id"] for r in json.loads(store.get("catalog.json").decode())["games"]]
        self.assertEqual(ids, sorted(ids))


class TheMergeNeedsItsBaseline(unittest.TestCase):
    """THE MERGE IS ONLY AS GOOD AS THE THING IT MERGES INTO.

    `TheCatalogMerges` above proves `_write_catalog` adds to the previous
    catalog instead of replacing it. That is true, it is tested, and the site
    still published a catalog of zero games the first night the fixed code ran —
    because the nightly rehydrates POINTERS and `index.json` from R2 and had
    never been asked to bring `catalog.json` down. The merge found nothing,
    merged into nothing, and advertised an empty archive.

    A fix that repairs a narrower claim than it announces is the failure mode
    this project keeps paying for, and here it repaired a function while the
    behaviour it existed to protect stayed broken. So the requirement is pinned
    where it can fail: the ORDERING between the pull and the derive, not the
    correctness of the merge.
    """

    WF = pathlib.Path(__file__).resolve().parent.parent / ".github/workflows/ingest.yml"

    def test_deriving_without_the_previous_catalog_publishes_only_this_run(self):
        # The hazard itself, stated as behaviour rather than as a comment. This
        # is not a bug in `_write_catalog` — it is what merging into an empty
        # store MEANS, which is precisely why the baseline has to be delivered.
        store = DictStore()
        seed(store, gid=2025020001)
        D.derive(store)
        prev = store.get("catalog.json")

        # A NIGHTLY RUNNER, faithfully: it holds the pointer for every game in
        # the archive and the raw for none of them — and, as it shipped, no
        # catalog either.
        cold = DictStore()
        for k in store.keys(""):
            if k != "catalog.json" and not k.startswith("raw/"):
                cold.put(k, store.get(k))
        cold.put(F.latest_key(2025020001), store.get(F.latest_key(2025020001)))
        seed(cold, gid=2025020002)
        D.derive(cold)

        self.assertEqual(len(json.loads(prev.decode())["games"]), 1)
        ids = [r["id"] for r in json.loads(cold.get("catalog.json").decode())["games"]]
        self.assertNotIn(2025020001, ids,
                         "no in-process guard can save a merge with no baseline")

    def test_the_nightly_puts_the_catalog_on_the_runner_before_it_derives(self):
        wf = self.WF.read_text()
        pull = wf.find("--include 'catalog.json'")
        self.assertNotEqual(pull, -1,
                            "ingest.yml must rehydrate catalog.json — the merge needs it")
        derive_at = wf.find("builders/derive.py")
        self.assertNotEqual(derive_at, -1, "ingest.yml must still run derive")
        self.assertLess(pull, derive_at,
                        "the baseline has to arrive BEFORE the run that merges into it")

    def test_the_nightly_will_not_publish_a_catalog_that_lost_games(self):
        # The backstop, for the next way the baseline goes missing. Nothing is
        # ever removed from the catalog — a refused game keeps its row — so
        # monotonic row count is an invariant of the design, not a threshold
        # fitted to today's archive.
        wf = self.WF.read_text()
        self.assertIn("would LOSE", wf,
                      "the sync must refuse a catalog smaller than the one in the bucket")
        guard = wf.find("would LOSE")
        upload = wf.find("aws s3 cp \"ingest/$f\"")
        self.assertLess(guard, upload, "and refuse it BEFORE uploading, not after")


# --------------------------------------------------------------------------
# A two-goal game, scored by DIFFERENT teams, carrying the league's own running
# score on each goal. Two goals by the same team cannot express the defect this
# exists to catch -- swapping them is a no-op.

SEQ_ROSTER = ROSTER + [
    {"playerId": 3, "sweaterNumber": 21, "lastName": {"default": "Tuch"},
     "positionCode": "R", "teamId": 7},
]


def seq_pbp(goals=None):
    """goals: [(scorer_id, team_id, away_said, home_said)] in order."""
    goals = goals if goals is not None else [(1, 30, 1, 0), (3, 7, 1, 1)]
    plays = []
    for i, (pid, tid, a_said, h_said) in enumerate(goals):
        plays.append(play("goal", 60 * (i + 1), scoringPlayerId=pid, goalieInNetId=2,
                          xCoord=-75, yCoord=0, eventOwnerTeamId=tid,
                          awayScore=a_said, homeScore=h_said))
    return json.dumps({"homeTeam": HOME, "awayTeam": AWAY,
                       "rosterSpots": SEQ_ROSTER, "plays": plays}).encode()


SEQ_BOX = box_bytes(away_sog=1, home_sog=1, away_score=1, home_score=1)


class TheScoreSequenceHasAWitness(unittest.TestCase):
    """`goal events == final score` validates a TOTAL. Nothing validated ORDER.

    The featured game on the homepage is ranked on attempts taken while the score
    was level, so every attempt is bucketed by the score AT THAT MOMENT. Two goals
    swapped in sequence leave the final score correct and move every
    tied/leading/trailing boundary — a wrong number with a correct-looking total
    underneath it.

    The witness costs no fetch and no schema change: `details.awayScore` and
    `details.homeScore` ride on every goal in the play-by-play (198 of 198 across
    three sampled seasons), and `validate()` is handed the raw feed. It does NOT
    go in the extract — that document carries what it cannot reconstruct, and a
    running score is its own arithmetic over goals it already holds.
    """

    def judge(self, pbp):
        return D.judge(pbp, SEQ_BOX, shifts_bytes())

    def test_a_game_whose_goals_agree_with_the_league_publishes(self):
        rich, refusal, _ = self.judge(seq_pbp())
        self.assertIsNone(refusal, refusal)
        self.assertIsNotNone(rich)

    def test_two_goals_swapped_are_caught_though_the_final_score_is_right(self):
        """THE MUTATION. Without it this check has never failed and might be
        incapable of failing."""
        # Same two goals, opposite order of scorer. The league still says 1-0 then
        # 1-1; we now derive 0-1 then 1-1. Final total identical, and the SOG
        # check is untouched because each side still has exactly one goal.
        swapped = seq_pbp([(3, 7, 1, 0), (1, 30, 1, 1)])
        rich, refusal, _ = self.judge(swapped)
        self.assertIsNotNone(refusal, "a scrambled score sequence must not publish")
        self.assertEqual(refusal["gate"], "validation")
        self.assertTrue(any("score sequence" in c for c in refusal["detail"]),
                        f"the failing check must name itself: {refusal['detail']}")

    def test_the_old_total_check_still_passes_on_the_swapped_game(self):
        """The mutation is only meaningful if the EXISTING check is blind to it.
        If `goal events == final score` also fired, this would prove nothing about
        the new one."""
        import extract as E
        rich = E.extract(json.loads(seq_pbp([(3, 7, 1, 0), (1, 30, 1, 1)])),
                         json.loads(shifts_bytes()), json.loads(SEQ_BOX))
        fails = E.validate(rich, json.loads(seq_pbp([(3, 7, 1, 0), (1, 30, 1, 1)])),
                           json.loads(shifts_bytes()), json.loads(SEQ_BOX))
        self.assertFalse([f for f in fails if "final score" in f],
                         "the total check is blind to order — that is why the new one exists")
        self.assertTrue([f for f in fails if "score sequence" in f])

    def test_a_goal_with_no_running_score_is_visible_not_skipped(self):
        """A check that silently does not run is this project's named failure mode.

        198 of 198 goals across three seasons carry the field, so its absence is an
        anomaly and gets said out loud rather than shrugged off.
        """
        naked = json.loads(seq_pbp())
        del naked["plays"][0]["details"]["awayScore"]
        rich, refusal, _ = self.judge(json.dumps(naked).encode())
        self.assertIsNotNone(refusal, "we cannot witness it, so we do not claim it")
        self.assertTrue(any("running score" in c for c in refusal["detail"]),
                        f"and it says which: {refusal['detail']}")

    def test_the_shootout_is_not_part_of_the_sequence(self):
        """The shootout moves the scoreboard by one, at the end. Its goals are not
        in the run of play and the league's running score does not count them."""
        p = json.loads(seq_pbp())
        so = play("goal", 0, scoringPlayerId=1, goalieInNetId=2, xCoord=-75, yCoord=0,
                  eventOwnerTeamId=30)
        so["periodDescriptor"] = {"number": 5, "periodType": "SO"}
        p["plays"].append(so)
        rich, refusal, _ = self.judge(json.dumps(p).encode())
        # The shootout changes the expected final score, so the total check moves;
        # what matters here is that the SEQUENCE check does not fire on it.
        detail = refusal["detail"] if refusal else []
        self.assertFalse([c for c in detail if "score sequence" in c],
                         f"a shootout goal must not disturb the sequence: {detail}")


class TheWhistleCarriesItsReason(unittest.TestCase):
    """16% of a game's events are stoppages, and the extract kept every one of
    them while throwing away the only field they carry.

    So every layer could say "play stopped — the whistle, not an event on the
    ice" and nothing else, for one event in six. `reason` is the one thing on a
    stoppage that cannot be reconstructed from anything else we hold, which is
    the test for whether a field belongs in the extract at all.

    Measured over 30 real games: 240 icings, 125 offsides, 433 goalie freezes.
    """

    def stop(self, **details):
        plays = [play("stoppage", 30, **details),
                 play("goal", 120, scoringPlayerId=1, goalieInNetId=2,
                      xCoord=-75, yCoord=0, eventOwnerTeamId=30,
                      awayScore=1, homeScore=0)]
        rich, refusal, _ = D.judge(pbp_bytes(plays), box_bytes(away_sog=1, home_sog=0),
                                   shifts_bytes())
        self.assertIsNone(refusal, refusal)
        return rich["events"][0]

    def test_a_stoppage_says_why_it_happened(self):
        self.assertEqual(self.stop(reason="icing")["rsn"], "icing")
        self.assertEqual(self.stop(reason="offside")["rsn"], "offside")

    def test_a_second_reason_is_kept_when_it_adds_something(self):
        # A TV timeout rides along 208 times in 30 games, and it is the difference
        # between a whistle and a two-minute break.
        e = self.stop(reason="icing", secondaryReason="tv-timeout")
        self.assertEqual(e["rsn"], "icing")
        self.assertEqual(e["rsn2"], "tv-timeout")

    def test_a_second_reason_that_repeats_the_first_is_not_stored_twice(self):
        # The feed does this constantly. Storing it would put the same fact in
        # two fields, which is how two fields start disagreeing.
        e = self.stop(reason="icing", secondaryReason="icing")
        self.assertNotIn("rsn2", e)

    def test_only_stoppages_carry_a_reason(self):
        plays = [play("goal", 120, scoringPlayerId=1, goalieInNetId=2, xCoord=-75,
                      yCoord=0, eventOwnerTeamId=30, reason="icing",
                      awayScore=1, homeScore=0)]
        rich, refusal, _ = D.judge(pbp_bytes(plays), box_bytes(away_sog=1, home_sog=0),
                                   shifts_bytes())
        self.assertNotIn("rsn", rich["events"][0],
                         "a reason on a non-stoppage is not ours to invent a meaning for")

    def test_an_unknown_reason_still_publishes_and_is_recorded(self):
        # The vocabulary gate forgives stoppage reasons and NAMES them, because a
        # whistle we cannot explain must not withhold a whole game. The draft
        # whistle layer did `if not reason: continue`, which would have dropped
        # `tv-timeout`-as-primary and `puck-in-penalty-benches` silently -- both
        # real, both absent from the reference game.
        e = self.stop(reason="a-reason-nobody-has-seen")
        self.assertEqual(e["rsn"], "a-reason-nobody-has-seen",
                         "carry it verbatim; interpreting it is the layer's job")
