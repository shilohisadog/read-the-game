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
import collections
import hashlib
import json
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "builders"))
import derive as D
import extract as E
import fetch_nhl as F

DATA = pathlib.Path(__file__).resolve().parent.parent / "data"


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


def regulation_plays():
    """THE ONE definition of a well-formed game, because there used to be two.

    `game_with_shootout` re-typed these three plays instead of calling this, so
    when the running-SOG witness was added to the feed the copy did not get it
    and three shootout tests failed for a reason that had nothing to do with
    shootouts. A fixture duplicated is a fixture that will disagree with itself
    eventually; this is that eventually.
    """
    return [
        play("faceoff", 0, winningPlayerId=1, xCoord=0, yCoord=0, eventOwnerTeamId=30),
        play("shot-on-goal", 60, shootingPlayerId=1, goalieInNetId=2,
             xCoord=-70, yCoord=3, eventOwnerTeamId=30,
             # The league's own running SHOT counter. Every shot-on-goal play
             # carries it and it counts shot events only, never goals. It is the
             # witness that separates "we parsed it wrong" from "the league's two
             # documents disagree" — so a fixture without it is not a smaller
             # game, it is an impossible one, exactly as with the running score.
             awaySOG=1, homeSOG=0),
        play("goal", 120, scoringPlayerId=1, goalieInNetId=2,
             xCoord=-75, yCoord=0, eventOwnerTeamId=30,
             # The league's running score after this goal. Real feeds carry it on
             # every goal — 198 of 198 across three sampled seasons — so a fixture
             # without it is not a smaller game, it is an impossible one.
             awayScore=1, homeScore=0),
    ]


def stub_pbp():
    """THE OLYMPIC SHAPE, and the fixture that stood in for it did not have it.

    The real stubs — 33 of 33 preseason refusals and 30 of 30 gameType 9 — carry
    GOALS AND NO SHOT-ON-GOAL EVENTS AT ALL, a median of 12 to 15 plays against a
    boxscore claiming forty shots. The old fixture used a wildly wrong boxscore
    over a feed that DID contain a shot event, so it tested "the boxscore
    disagrees" and was read as testing "there is nothing to replay". Those are
    now different verdicts, and only one of them is a refusal.
    """
    return json.dumps({"homeTeam": HOME, "awayTeam": AWAY, "rosterSpots": ROSTER,
                       "plays": [
        play("faceoff", 0, winningPlayerId=1, xCoord=0, yCoord=0, eventOwnerTeamId=30),
        play("goal", 120, scoringPlayerId=1, goalieInNetId=2,
             xCoord=-75, yCoord=0, eventOwnerTeamId=30, awayScore=1, homeScore=0),
    ]}).encode()


def pbp_bytes(plays=None):
    plays = plays if plays is not None else regulation_plays()
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
        seed(store, pbp=pbp_bytes(plays=regulation_plays() + [
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
        # THE OLYMPIC CASE, and the reason this class exists. 12 plays against a
        # boxscore reporting 62 shots. Every value is recognised, extract()
        # succeeds, and the result is a confident-looking game that is not one.
        #
        # THE FIXTURE HAD TO CHANGE TO KEEP MEANING THIS. It used to be a normal
        # feed with a wildly wrong boxscore, which tested "the boxscore
        # disagrees" while reading as "there is nothing to replay". Those are now
        # different verdicts and only one is a refusal, so the fixture has to
        # carry the property that actually defines a stub: NO SHOT EVENTS AT ALL,
        # which is true of 33 of 33 preseason and 30 of 30 gameType 9 refusals.
        store = DictStore()
        seed(store, pbp=stub_pbp(),
             box=box_bytes(away_sog=26, home_sog=36, away_score=1, home_score=0))
        rep = D.derive(store)
        self.assertEqual(rep.derived, 0)
        self.assertEqual(rep.refused["2025020001"]["gate"], "validation")
        self.assertIn("NOTHING to replay", str(rep.refused["2025020001"]["detail"]))
        self.assertIsNone(store.get("extract/2025020001.json"))

    def test_a_full_feed_with_a_wrong_boxscore_is_PUBLISHED_and_says_so(self):
        """THE OTHER HALF, and without it the test above is satisfied by a rule
        that refuses every boxscore disagreement — which is the rule we removed.

        Measured over the whole archive: 73 in-scope games (68 regular season, 5
        playoff, two of them conference finals) reproduce the play-by-play
        exactly and differ from the boxscore by one shot. Same disagreement as
        the stub above, opposite verdict, and the feed is what separates them.
        """
        store = DictStore()
        seed(store, box=box_bytes(away_sog=99, home_sog=0, away_score=1, home_score=0))
        rep = D.derive(store)
        self.assertEqual(rep.derived, 1, "a game we can replay is not withheld")
        self.assertEqual(rep.unreconciled, 1)
        got = json.loads(store.get("extract/2025020001.json").decode())
        self.assertTrue(got["unreconciled"], "and the artifact has to SAY so")
        self.assertIn("SOG", str(got["unreconciled"]))

    def test_the_witness_must_be_independent_or_it_proves_nothing(self):
        # MUTATION GUARD on the gate above, pointed at the check that is now
        # FATAL. If validation compared the extract against the play-by-play it
        # came from with no third party, a misparse would agree with itself
        # perfectly and pass. The witness is the league's own running shot
        # counter, carried on every shot-on-goal play; hold the feed constant and
        # move ONLY that number.
        good, bad = DictStore(), DictStore()
        seed(good)
        wrong = regulation_plays()
        wrong[1]["details"]["awaySOG"] = 7     # the feed still holds one shot
        seed(bad, pbp=pbp_bytes(plays=wrong))
        self.assertEqual(D.derive(good).derived, 1)
        self.assertEqual(D.derive(bad).derived, 0,
                         "our count disagreeing with the league's own counter is OURS to fix")
        self.assertIn("running count", str(D.derive(bad).refused["2025020001"]["detail"]))

    def test_a_shot_that_never_carried_the_counter_is_refused_not_skipped(self):
        """A CHECK THAT SILENTLY DOES NOT RUN is this project's named failure
        mode, and this one is built to be vacuous: with the field absent, our
        count and the league's are both compared against zero and agree."""
        store = DictStore()
        blind = regulation_plays()
        del blind[1]["details"]["awaySOG"]
        del blind[1]["details"]["homeSOG"]
        seed(store, pbp=pbp_bytes(plays=blind))
        rep = D.derive(store)
        self.assertEqual(rep.derived, 0, "an absent witness is an anomaly, not a pass")
        self.assertIn("without", str(rep.refused["2025020001"]["detail"]))

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
        digests = seed(store, pbp=stub_pbp(), box=box_bytes(away_sog=99))
        D.derive(store)
        for name, d in digests.items():
            self.assertIsNotNone(store.get(F.raw_key(2025020001, d, name)))
        self.assertIsNotNone(store.get(F.latest_key(2025020001)))

    def test_one_bad_game_does_not_stop_the_others(self):
        store = DictStore()
        seed(store, gid=2025020001)
        seed(store, gid=2025020002, pbp=stub_pbp(), box=box_bytes(away_sog=99))
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
        seed(store, gid=2025020001, date="2026-01-10", pbp=stub_pbp(), box=box_bytes(away_sog=99))
        seed(store, gid=2025020002, date="2020-01-01", pbp=stub_pbp(), box=box_bytes(away_sog=99))
        rep = D.derive(store, end="2026-01-10", days=14)
        self.assertEqual(len(rep.refused), 2, "both are refused")
        self.assertEqual(rep.refused_in_window, 1, "only one is in the window")

    def test_the_extract_ledger_is_written_beside_coverage_not_inside_it(self):
        # coverage is the FETCH window's ledger. Derivation is a different
        # question over a different set, and folding its totals into coverage
        # would be the exact conflation ingest-state.md was written about.
        store = DictStore()
        seed(store, gid=2025020001)
        seed(store, gid=2025020002, pbp=stub_pbp(), box=box_bytes(away_sog=99))
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
        seed(store, gid=2025020001, pbp=stub_pbp(), box=box_bytes(away_sog=99))
        seed(store, gid=2025020002, pbp=stub_pbp(), box=box_bytes(away_sog=99))
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
        seed(store, pbp=pbp_bytes(plays=regulation_plays() + [
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
        plays = regulation_plays()
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
        seed(store, gid=2025020001, pbp=stub_pbp(), box=box_bytes(away_sog=99))
        seed(store, gid=2025020002, pbp=stub_pbp(), box=box_bytes(away_sog=98))
        D.derive(store, now="2026-01-11T11:30:00Z")
        failed = self.index(store)["extracts"]["failedChecks"]
        self.assertEqual(sum(failed.values()), 2)
        self.assertTrue(any("replay" in k for k in failed), f"named, not numbered: {failed}")

    def test_the_refused_games_are_named_so_they_can_be_looked_at(self):
        store = DictStore()
        seed(store, gid=2025020001)
        seed(store, gid=2025020002, pbp=stub_pbp(), box=box_bytes(away_sog=99))
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
        # THE OBSERVABLE MOVED, AND THE POINT DID NOT. This used to assert a
        # refusal, because any boxscore disagreement was fatal. The game now
        # publishes and carries the disagreement — which demonstrates the very
        # property the test is named for MORE directly: `quoted` says 99 while
        # our own events say 2, in the same document, and it was stored anyway.
        self.assertIsNone(refusal, "a replayable game is not withheld over the league's arithmetic")
        self.assertEqual(rich["quoted"]["away"]["sog"], 99, "copied, not recomputed")
        self.assertEqual(sum(1 for e in rich["events"]
                             if e["type"] in ("shot-on-goal", "goal") and e["own"] == 30),
                         rich_events, "and our own count still disagrees with it")
        self.assertTrue(rich["unreconciled"], "the disagreement is recorded, not swallowed")


class ANewCompetitionIsAnEventNotNoise(unittest.TestCase):
    """The league mints a `gameType` whenever it invents a competition.

    19 and 20 arrived in February 2025 for a 4 Nations tournament that had never
    been held; 9 arrived in February 2026 for the Olympics. Both AFTER this
    archive started, and **nothing watched for either** — the vocabulary gate
    covers five fields inside the play-by-play and `gameType` is a property of
    the game, so an unknown code flowed straight into the catalog. The first
    thing that would have rendered it is a calendar cell reading "game type 21".

    It must be LOUD and it must not withhold a game. `inScope` keys on 02 and 03
    read off the id, so an unrecognised type cannot enter any rate; refusing real
    hockey over a missing display name is the mistake the 73 already were.
    """

    def index(self, store):
        return json.loads(store.get("index.json").decode())

    def test_every_type_the_run_walked_is_counted(self):
        store = DictStore()
        seed(store, gid=2025020001, gtype=2)
        seed(store, gid=2025010002, gtype=1)
        seed(store, gid=2025010003, gtype=1)
        D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertEqual(self.index(store)["extracts"]["gameTypes"], {"1": 2, "2": 1})

    def test_a_type_nobody_has_named_is_reported(self):
        store = DictStore()
        seed(store, gid=2025210001, gtype=21)
        D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertEqual(self.index(store)["extracts"]["unnamedTypes"], ["21"])

    def test_and_the_run_goes_RED_rather_than_only_recording_it(self):
        """A line in index.json nobody reads is not "loudly". The exit code is.

        AFTER everything is written, never instead of it — the same shape the
        ingest uses for a partial fetch, and the reason is the same: the failure
        must be impossible to miss without costing anyone the data.
        """
        store = DictStore()
        seed(store, gid=2025210001, gtype=21)
        rep = D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertEqual(rep.as_dict()["unnamedTypes"], ["21"])
        self.assertEqual(rep.published, 1, "the game is still published")
        self.assertIsNotNone(store.get("extract/2025210001.json"),
                             "and its extract is still written")

    def test_a_named_type_is_silent(self):
        # MUTATION GUARD. A check that fired on every run would be turned off
        # within a week, and then the one that mattered would be invisible.
        store = DictStore()
        seed(store, gid=2025020001, gtype=2)
        seed(store, gid=2025090002, gtype=9)
        D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertEqual(self.index(store)["extracts"]["unnamedTypes"], [])

    def test_the_key_is_present_when_empty(self):
        # "We looked and found none" and "this version did not look" are
        # different sentences — the same reason `blocking` is published empty.
        store = DictStore()
        seed(store, gid=2025020001, gtype=2)
        D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertIn("unnamedTypes", self.index(store)["extracts"])

    def test_a_type_is_counted_even_when_the_game_is_REFUSED(self):
        # A new competition is likeliest to arrive in a feed we cannot parse —
        # the Olympics did, 30 of 30. Counting only published games would make
        # the check blindest exactly where it is needed.
        store = DictStore()
        seed(store, gid=2025210001, gtype=21, pbp=stub_pbp(),
             box=box_bytes(away_sog=99))
        rep = D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertEqual(rep.published, 0, "the stub is still refused")
        self.assertEqual(self.index(store)["extracts"]["unnamedTypes"], ["21"])

    def test_the_table_names_every_type_the_LIVE_archive_holds(self):
        # The pinned set, from the live catalog on 2026-08-21. This is the half
        # that catches drift at edit time; derive.py is the half that catches it
        # the day the league invents something, because it sees the archive.
        names = D._competitions()
        for t in ("1", "2", "3", "4", "9", "12", "19", "20"):
            self.assertIn(t, names, f"gameType {t} is in the archive and unnamed")
        self.assertEqual(names["9"], "Olympics")
        self.assertEqual(names["19"], "4 Nations")


class ForgivenessIsRecordedAndDriftIsLOUD(unittest.TestCase):
    """`noted` was a ledger. It needed to also be an alarm.

    23 stoppage reasons are forgiven on every live run -- `ice-scrape`,
    `switch-sides`, ten flavours of coach's challenge -- and each renders
    verbatim, which whistle.js is right about: inventing a rule explanation for
    a value nobody has read would be the guess this project refuses everywhere
    else. What was missing is that nothing was TOLD. The workflow printed a
    count and stayed green, which is exactly the hole an unnamed gameType sat in.

    So the alarm is on DRIFT. Twenty-three known values are not news; a
    twenty-fourth is. A check that fired on all 23 every night would be switched
    off within a week and the twenty-fourth would arrive invisibly.
    """

    def index(self, store):
        return json.loads(store.get("index.json").decode())

    def stoppage(self, reason):
        return pbp_bytes(plays=regulation_plays() + [
            play("stoppage", 150, reason=reason, eventOwnerTeamId=30)])

    def test_a_value_we_have_already_looked_at_is_silent(self):
        # `ice-scrape` is in data/vocabulary-seen.json: seen, understood, and
        # deliberately left to render verbatim.
        store = DictStore()
        seed(store, pbp=self.stoppage("ice-scrape"))
        rep = D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertEqual(rep.published, 1)
        self.assertEqual(self.index(store)["extracts"]["unseenVocabulary"], {})
        self.assertIn("ice-scrape",
                      self.index(store)["extracts"]["noted"]["stoppage reason"],
                      "still recorded — the ledger does not stop being a ledger")

    def test_a_value_NOBODY_HAS_LOOKED_AT_is_reported(self):
        store = DictStore()
        seed(store, pbp=self.stoppage("zamboni-on-fire"))
        rep = D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertEqual(
            self.index(store)["extracts"]["unseenVocabulary"],
            {"stoppage reason": ["zamboni-on-fire"]})
        self.assertEqual(rep.published, 1, "and the game is still published")

    def test_the_run_goes_RED_without_withholding_the_game(self):
        # None of this can reach a number — the extract drops stoppage detail
        # entirely — so withholding the archive over a label would be the
        # mistake the 73 refused games already were.
        store = DictStore()
        seed(store, pbp=self.stoppage("zamboni-on-fire"))
        rep = D.derive(store, now="2026-01-11T11:30:00Z")
        d = rep.as_dict()
        self.assertTrue(d["unseenVocabulary"])
        self.assertIsNotNone(store.get("extract/2025020001.json"))

    def test_the_key_is_present_when_empty(self):
        store = DictStore()
        seed(store)
        D.derive(store, now="2026-01-11T11:30:00Z")
        self.assertIn("unseenVocabulary", self.index(store)["extracts"])

    def test_every_value_the_LIVE_archive_forgives_is_acknowledged(self):
        # The 23 read off index.json on 2026-08-21. If this list and the live
        # ledger disagree, one of them is stale — and the point of the file is
        # that a human looked at each one.
        seen = D._vocabulary_seen()["stoppage reason"]
        for v in ("ice-scrape", "switch-sides", "official-injury",
                  "chlg-league-off-side", "premature-substitution"):
            self.assertIn(v, seen)
        self.assertEqual(len(seen), 23)


class WhatTheLeagueCouldNotReconcile(unittest.TestCase):
    """Published, and the league's two documents disagree about it.

    73 in-scope games were being WITHHELD for this: our extraction reproduces the
    play-by-play exactly — checked against the league's own running shot counter,
    73 of 73 — and the league's separate boxscore reports one shot more or fewer.
    Refusing them hid games we can replay faithfully because their summary
    document was wrong, and it hid the fact that it was wrong.
    """

    def rows(self, store):
        return {str(g["id"]): g for g in
                json.loads(store.get("catalog.json").decode())["games"]}

    def test_the_row_is_flagged_so_a_LIST_can_say_it(self):
        # The calendar and the team page both draw many games at once and neither
        # opens an extract to draw a row. Without a flag on the row, the
        # disclosure would exist only on the page you already chose to open.
        store = DictStore()
        seed(store, box=box_bytes(away_sog=99, home_sog=0, away_score=1, home_score=0))
        D.derive(store)
        self.assertEqual(self.rows(store)["2025020001"].get("u"), 1)

    def test_a_reconciled_game_carries_NO_flag_and_no_key(self):
        # MUTATION GUARD, and the verdict card's rule: a key that is always
        # present and usually empty teaches a reader to skip it. If `u` were
        # always emitted the test above would pass on every game in the archive
        # and discriminate nothing.
        store = DictStore()
        seed(store)
        D.derive(store)
        self.assertNotIn("u", self.rows(store)["2025020001"])
        self.assertNotIn("unreconciled",
                         json.loads(store.get("extract/2025020001.json").decode()))

    def test_the_flag_survives_a_run_that_re_derives_nothing(self):
        """THE PATH THAT ALMOST LOST IT. An unchanged game skips judge() entirely,
        so the flag cannot come from a variable that branch never computes — it
        has to be read back off the stored extract. Get this wrong and every
        nightly quietly heals the catalog into looking cleaner than the archive
        is, which is the exact failure a disclosure exists to prevent."""
        store = DictStore()
        seed(store, box=box_bytes(away_sog=99, home_sog=0, away_score=1, home_score=0))
        first = D.derive(store)
        self.assertEqual(first.derived, 1)
        again = D.derive(store)
        self.assertEqual(again.derived, 0, "nothing changed, so nothing re-derives")
        self.assertEqual(again.unchanged, 1)
        self.assertEqual(self.rows(store)["2025020001"].get("u"), 1,
                         "the second run must not quietly drop the disclosure")
        self.assertEqual(again.unreconciled, 1, "and it must still be counted")

    def test_the_ledger_counts_them_so_the_forgiveness_is_auditable(self):
        # Same reason `noted` is published: a gate that quietly forgets what it
        # forgave is worse than one that never looked.
        store = DictStore()
        seed(store, gid=2025020001, box=box_bytes(away_sog=99, home_sog=0,
                                                  away_score=1, home_score=0))
        seed(store, gid=2025020002)
        D.derive(store, now="2026-01-11T11:30:00Z")
        idx = json.loads(store.get("index.json").decode())
        self.assertEqual(idx["extracts"]["unreconciled"], 1)
        self.assertEqual(idx["extracts"]["published"], 2, "both are published")
        self.assertEqual(idx["extracts"]["refused"], 0)


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
        seed(store, gid=2025020002, pbp=stub_pbp(), box=box_bytes(away_sog=99))
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
        seed(store, gid=2025020002, pbp=stub_pbp(), box=box_bytes(away_sog=99, home_sog=7,
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
        seed(store, gid=2025020002, pbp=stub_pbp(), box=box_bytes(away_sog=99))
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
        seed(store, gid=2025020001, pbp=stub_pbp(), box=box_bytes(away_sog=99))
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


class TheReplacedRowIsWholesale(unittest.TestCase):
    """REPLACEMENT IS TOTAL, AND THAT IS THE SHARP EDGE UNDER THE MERGE.

    `TheCatalogMerges` proves the two halves that make the document safe: rows
    this run said nothing about survive, and a row it did judge is replaced
    rather than updated. Both are right. Together they mean a field that is not
    produced by the row builder is deleted for EXACTLY the games this run
    re-judged -- silently, and only for those games.

    That is the worst available shape. A field bolted on downstream is present
    on the whole archive the day it is written and decays game by game as the
    pipeline works through them, so it reads as working right up until the games
    a reader is most likely to open are the ones missing it.

    This is not hypothetical. `docs/one-measure.md` §4 proposed exactly such a
    step -- a node pass adding attempts to the catalog after derive.py wrote it
    -- and §3.1 is the paragraph that killed it. CHENG asked for the test so the
    next person meets the rule before the pipeline does.

    THE RULE: a field on a catalog row must be produced by `derive()`. There is
    no other writer, and `test_the_row_carries_exactly_the_fields_it_promises`
    below is the tripwire -- you cannot add one without reading this.
    """

    def rows(self, store):
        return {r["id"]: r for r in json.loads(store.get("catalog.json").decode())["games"]}

    def test_the_three_row_sites_agree_on_the_field_set(self):
        """`rows[gid] = ...` happens in three places and one of them is forever.

        A game derives ONCE and is `unchanged` every night after, so a field
        added to the fresh-publish site alone would appear for one night and
        vanish permanently -- which looks like the merge losing it and is not.
        """
        store = DictStore()
        seed(store, gid=2025020001)
        rep = D.derive(store)
        self.assertEqual((rep.derived, rep.unchanged), (1, 0), "the fresh path ran")
        fresh = set(self.rows(store)[2025020001])

        rep = D.derive(store)          # same bytes: the steady state of the archive
        self.assertEqual((rep.derived, rep.unchanged), (0, 1), "the unchanged path ran")
        self.assertEqual(set(self.rows(store)[2025020001]), fresh,
                         "the row a game keeps for years must be the row it published")

        refused = DictStore()
        seed(refused, gid=2025020001, pbp=stub_pbp(), box=box_bytes(away_sog=99))
        rep = D.derive(refused)
        self.assertEqual(list(rep.refused), ["2025020001"], "the refusal path ran")
        self.assertEqual(set(self.rows(refused)[2025020001]) - fresh, {"r"},
                         "a refused row carries the gate that stopped it and nothing else")

    def test_a_field_written_outside_derive_decays_game_by_game(self):
        """The asymmetry IS the assertion, not either half of it.

        Assert only the deletion and this reads as a fixable bug. Assert only
        the survival and it reads as the merge working. The two together are the
        failure mode: a document in which the same field is present or absent
        depending on which night a game was last touched.
        """
        store = DictStore()
        seed(store, gid=2025020001)         # an old game
        seed(store, gid=2025020002)         # tonight's
        D.derive(store)

        # A later writer -- any later writer -- adds a field to every row.
        doc = json.loads(store.get("catalog.json").decode())
        for r in doc["games"]:
            r["aa"] = 94
        store.put("catalog.json", json.dumps(doc).encode())

        # The nightly's real shape: raw for tonight, pointers only for the rest.
        digests = json.loads(store.get(F.latest_key(2025020001)).decode())
        for name, dig in digests.items():
            store.delete(F.raw_key(2025020001, dig, name))

        rep = D.derive(store)
        self.assertEqual(list(rep.absent), ["2025020001"], "the archive was not re-judged")

        rows = self.rows(store)
        self.assertEqual(rows[2025020001].get("aa"), 94,
                         "the game nobody looked at kept it -- so the damage is invisible")
        self.assertNotIn("aa", rows[2025020002],
                         "and the game that WAS judged lost it, because the row is replaced")

    def test_the_row_carries_exactly_the_fields_it_promises(self):
        """The tripwire. Adding a field to a catalog row must fail this test.

        A pinned set is normally the shape this project distrusts -- a constant
        standing in for a relationship. Here the set IS the relationship: it is
        the contract the browser destructures, written by one function and read
        by a page in another language, and nothing else in the suite fails when
        it changes.
        """
        store = DictStore()
        seed(store, gid=2025020001)
        D.derive(store)
        self.assertEqual(set(self.rows(store)[2025020001]),
                         {"id", "d", "t",              # what game, when, which kind
                          "a", "h", "as", "hs", "ash", "hsh",   # the league's quote
                          "v"},                        # our verdict, and `r` when 0
                         "read this class's docstring before widening this set")


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
        fails, _ = E.validate(rich, json.loads(seq_pbp([(3, 7, 1, 0), (1, 30, 1, 1)])),
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


# --------------------------------------------------- the penalty box, and the ends
#
# THE SCHEMA CHANGE OF 2026-08-18. Kevin ruled penalty boxes IN and benches OUT,
# which meant the extract had to stop discarding two things: what a penalty
# actually WAS, and which end each team defended in each period.
#
# These read the REAL reference feed rather than a synthetic fixture, because
# what is under test is what the LEAGUE means by its own fields. A fixture
# written by the same hand that wrote the extractor can only confirm what its
# author already believed -- which is how `own` carried the SHOOTER on a blocked
# shot for months without anybody noticing.


def reference():
    """The one real game committed to the repo, extracted."""
    pbp = json.loads((DATA / "pbp_2023020204.json").read_text())
    shifts = json.loads((DATA / "shifts.json").read_text())
    box = json.loads((DATA / "box_2023020204.json").read_text())
    return pbp, shifts, box, E.extract(pbp, shifts, box)


def validate_quietly(rich, pbp, shifts, box):
    """validate() prints for a human; here only the verdict is wanted.

    Returns (fails, notes). They are handed back SEPARATELY on purpose: a note
    is a disagreement between two of the league's own documents and does not
    withhold a game, so a test that lumped them together could not tell
    "we refuse this" from "we publish this and say so".
    """
    import contextlib, io
    with contextlib.redirect_stdout(io.StringIO()):
        return E.validate(rich, pbp, shifts, box)


class ThePenaltyCarriesItsOwnMeaning(unittest.TestCase):
    """The box fills on one side of the ice, and both sides look plausible."""

    def setUp(self):
        self.pbp, self.shifts, self.box, self.rich = reference()
        self.team_of = {s["playerId"]: s["teamId"] for s in self.pbp["rosterSpots"]}
        self.pens = [e for e in self.rich["events"] if e["type"] == "penalty"]

    def test_own_is_the_offending_team_and_the_drawer_is_never_on_it(self):
        # THE SECOND HALF IS THE TEST. "own == the committer's team" is satisfied
        # by a feed where both players are on the same team, and then it
        # discriminates nothing -- the same defect as asserting a border exists
        # without asserting it differs. So the two teams are asserted APART on
        # every penalty, which is what makes the first assertion mean something.
        self.assertEqual(len(self.pens), 8)
        for e in self.pens:
            self.assertEqual(e["own"], self.team_of[e["actor"]],
                             f"P{e['per']} {e['clock']}: own must be the offender's team")
            self.assertNotEqual(e["own"], self.team_of[e["drew"]],
                                f"P{e['per']} {e['clock']}: the drawer is on the other team")

    def test_a_bench_minor_has_no_committing_player_and_must_not_refuse_the_game(self):
        """THE REGRESSION THAT REFUSED 864 GAMES.

        Too many men on the ice is committed by the TEAM: the feed carries
        `servedByPlayerId` and no `committedByPlayerId`. The first version of
        this check compared `team_of.get(None)` against a real team id, failed,
        and withheld every game containing one -- 843 games that had been
        published the day before. The reference game has no bench minor, so
        8 of 8 passing locally could not see it.

        The check now verifies what it CAN and counts what it cannot, which is
        doctrine 9: what we set aside stays visible.
        """
        plays = [play("penalty", 10, eventOwnerTeamId=30, typeCode="BEN",
                      descKey="too-many-men-on-the-ice", duration=2,
                      servedByPlayerId=1),
                 play("penalty", 20, committedByPlayerId=1, drawnByPlayerId=2,
                      eventOwnerTeamId=30, typeCode="MIN", descKey="tripping",
                      duration=2)]
        pbp = {"homeTeam": HOME, "awayTeam": AWAY, "rosterSpots": ROSTER,
               "plays": plays}
        rich = E.extract(pbp, json.loads(shifts_bytes()))
        fails, _ = validate_quietly(rich, pbp, json.loads(shifts_bytes()),
                                 json.loads(box_bytes(away_sog=0, home_sog=0,
                                                      away_score=0, home_score=0)))
        self.assertFalse([f for f in fails if "offending team" in f],
                         "a bench minor must not refuse the game")
        # AND THE ONE THAT CAN BE CHECKED STILL IS -- otherwise the repair is
        # just the gate switched off. Break the checkable penalty and it fires.
        rich["events"][1]["own"] = 7
        again, _ = validate_quietly(rich, pbp, json.loads(shifts_bytes()),
                                 json.loads(box_bytes(away_sog=0, home_sog=0,
                                                      away_score=0, home_score=0)))
        self.assertTrue([f for f in again if "offending team" in f],
                        "the check stopped checking the penalties it still can")
        # The bench minor is still box time -- it is served by somebody.
        self.assertEqual(rich["events"][0]["sev"], "BEN")
        self.assertEqual(rich["events"][0]["srv"], 1)

    def test_the_gate_fires_when_the_box_would_fill_on_the_wrong_side(self):
        # A MUTATION NOT SEEN TO FIRE IS NOT A MUTATION. Credit each penalty to
        # the team that DREW it -- the single most plausible way to get this
        # backwards -- and validate() must refuse the game.
        ids = [self.rich["teams"]["home"]["id"], self.rich["teams"]["away"]["id"]]
        for e in self.rich["events"]:
            if e["type"] == "penalty":
                e["own"] = ids[0] if e["own"] == ids[1] else ids[1]
        fails, _ = validate_quietly(self.rich, self.pbp, self.shifts, self.box)
        self.assertTrue(any("offending team" in f for f in fails),
                        f"the penalty check did not fire; got {fails}")

    def test_what_the_referee_assessed_is_not_what_the_player_served(self):
        # THE REASON `min` ALONE CANNOT DRAW THE BOX, as a fact rather than an
        # argument. BUF are penalised at 18:34 of the first period and the code
        # goes 1551 -> 1541; MIN score at 19:30 and the very next event reads
        # 1551 again. Two minutes were assessed and FIFTY-SIX SECONDS were
        # served, so a box driven by `min` holds a player on screen for another
        # 64 seconds while the ice shows him back over the boards.
        pen = next(e for e in self.pens if e["per"] == 1 and e["clock"] == "18:34")
        self.assertEqual(pen["min"], 2, "two minutes were assessed")

        after = [e for e in self.rich["events"] if e["s"] > pen["s"]]
        back = next(e for e in after if e["sit"][1] == e["sit"][2])
        served = back["s"] - pen["s"]
        self.assertEqual(served, 56, "and 56 seconds were served")
        self.assertLess(served, pen["min"] * 60,
                        "the whole point: the ice disagrees with the assessment")

        # And it ended the way it did for the reason claimed -- a goal, by the
        # team that was NOT penalised. Without this the 56 seconds could be any
        # coincidence, and three other penalties in this game return to even
        # strength because of an OFFSETTING call rather than a goal.
        goal = next(e for e in after if e["type"] == "goal")
        self.assertEqual(goal["s"], back["s"], "strength returns on the goal")
        self.assertNotEqual(goal["own"], pen["own"],
                            "scored by the team on the power play")

    def test_the_severity_is_carried_because_duration_is_not_a_power_play(self):
        # A 10-MINUTE MISCONDUCT IS BOX TIME AT EVEN STRENGTH, and a penalty shot
        # is no box time at all. Neither occurs in the reference game, so this
        # asserts the CAPABILITY rather than pretending the evidence is here:
        # `sev` and `min` are separate fields, so a consumer can tell a
        # four-minute double minor from four minutes of anything else.
        dbl = next(e for e in self.pens if e["min"] == 4)
        self.assertEqual((dbl["sev"], dbl["pen"]), ("MIN", "high-sticking-double-minor"))
        self.assertEqual({e["sev"] for e in self.pens}, {"MIN"},
                         "this game is all minors -- said out loud so a game "
                         "with a misconduct is a new case, not a silent one")

        pbp = {"homeTeam": HOME, "awayTeam": AWAY, "rosterSpots": ROSTER,
               "plays": [play("penalty", 10, committedByPlayerId=1,
                              drawnByPlayerId=2, eventOwnerTeamId=30,
                              typeCode="MIS", descKey="misconduct", duration=10)]}
        got = E.extract(pbp, json.loads(shifts_bytes()))["events"][0]
        self.assertEqual((got["sev"], got["min"]), ("MIS", 10),
                         "ten minutes and not a power play, and the two are "
                         "distinguishable only because both fields are here")

    def test_a_delayed_penalty_carries_what_it_has_and_invents_nothing(self):
        # It names the offending team and nothing else -- no player, no
        # coordinates, no duration. Doctrine: carry what is there.
        d = [e for e in self.rich["events"] if e["type"] == "delayed-penalty"]
        self.assertEqual(len(d), 4)
        for e in d:
            self.assertIsNotNone(e["own"])
            for absent in ("pen", "min", "sev", "drew"):
                self.assertNotIn(absent, e,
                                 "a delayed penalty must not acquire fields the feed "
                                 "does not give it")


class WhyTheShotMissed(unittest.TestCase):
    """`missed-shot` is the EVENT — a shot that did not force a save. `reason` is
    that same event, finer. Neither is a category we invented; both are the
    league's own taxonomy, which is why they carry `field:` provenance and not
    `display:`."""

    def setUp(self):
        self.pbp, self.shifts, self.box, self.rich = reference()

    def test_every_missed_shot_carries_why_it_missed(self):
        miss = [e for e in self.rich["events"] if e["type"] == "missed-shot"]
        self.assertEqual(len(miss), 31)
        self.assertTrue(all("miss" in e for e in miss),
                        "the reason is on the event 31 of 31, so nothing has to guess")
        self.assertEqual(
            collections.Counter(e["miss"] for e in miss),
            collections.Counter({"wide-left": 14, "wide-right": 9, "above-crossbar": 5,
                                 "hit-left-post": 1, "hit-right-post": 1, "short": 1}))

    def test_one_phrase_cannot_cover_six_outcomes(self):
        """THE ARGUMENT FOR THE FIELD, as a fact rather than a preference.

        "Missed the net" was standing in for all of these and is FALSE for two:
        a puck off the post hit the net, and a `short` shot never reached it.
        """
        vals = {e["miss"] for e in self.rich["events"] if e["type"] == "missed-shot"}
        self.assertGreaterEqual(len(vals), 6, "six distinct outcomes, one phrase")
        wrong = {v for v in vals if "post" in v or v == "short"}
        self.assertTrue(wrong, "the cases the old phrase got wrong must be present")

    def test_the_known_set_is_observed_and_not_padded_with_guesses(self):
        """THE POINT OF THE GATE. Adding a plausible `hit-crossbar` would HIDE it
        from the archive report -- and whether the feed has one is the open
        question: `above-crossbar` exists, no `hit-crossbar` appeared in 31
        attempts, so a puck off the bar is being recorded as SOMETHING we cannot
        name yet. One game cannot answer it; `noted` over the archive can."""
        seen = {e["miss"] for e in self.rich["events"] if e["type"] == "missed-shot"}
        self.assertTrue(seen < E.KNOWN_MISSES,
                        "the reference game's six are a strict SUBSET of the ten the "
                        "archive contains -- one game is not the vocabulary")
        # THE FOUR THE ARCHIVE ADDED, and the gate is what surfaced them. Kevin
        # predicted `hit-crossbar` from its absence; the derive found it.
        self.assertEqual(E.KNOWN_MISSES - seen,
                         {"hit-crossbar", "high-and-wide-left",
                          "high-and-wide-right", "failed-bank-attempt"})
        # Still not padded: a value nobody has seen must not be pre-approved into
        # silence. `wide-high` is invented here on purpose.
        self.assertNotIn("wide-high", E.KNOWN_MISSES)

    def test_an_unfamiliar_reason_is_noted_and_never_refuses_the_game(self):
        # Same standing as a stoppage reason: we carry it verbatim and compute on
        # nothing, so an unknown renders as itself rather than explaining wrongly.
        # THE STAND-IN HAD TO CHANGE. This test used `hit-crossbar` as its
        # "unfamiliar" value and the archive then proved it real -- so the test
        # started asserting that a KNOWN value was unknown. A fixture pinned to a
        # value the world can promote is a fixture with an expiry date; this one
        # is invented and will stay invented.
        plays = [play("missed-shot", 10, shootingPlayerId=1, xCoord=70, yCoord=3,
                      eventOwnerTeamId=30, reason="ricocheted-off-the-zamboni")]
        pbp = {"homeTeam": HOME, "awayTeam": AWAY, "rosterSpots": ROSTER,
               "plays": plays}
        _, unknown = E.vocabulary(pbp)
        self.assertEqual(unknown.get("missed-shot reason"),
                         {"ricocheted-off-the-zamboni"})
        self.assertNotIn("missed-shot reason", E.CONSEQUENTIAL,
                         "an unfamiliar reason must not withhold a game")
        self.assertEqual(E.extract(pbp, json.loads(shifts_bytes()))["events"][0]["miss"],
                         "ricocheted-off-the-zamboni", "carried verbatim")


class TheEndsTheyDefended(unittest.TestCase):
    """The one fact _norm consumes and destroys."""

    def setUp(self):
        self.pbp, self.shifts, self.box, self.rich = reference()

    def test_the_record_is_the_alternation_not_three_separate_strings(self):
        # PIN THE RELATIONSHIP. Three assertions each naming a literal side would
        # all pass while the periods stopped alternating, because a constant
        # cannot see a relationship -- so what is asserted is that they SWAP, and
        # that the swap comes back.
        s = self.rich["sides"]
        self.assertEqual(sorted(s), ["1", "2", "3"])
        self.assertNotEqual(s["1"], s["2"], "they change ends between periods")
        self.assertNotEqual(s["2"], s["3"], "and change back")
        self.assertEqual(s["1"], s["3"], "so one and three share an end")

    def test_it_is_read_from_the_feed_and_not_computed_from_the_period_number(self):
        # THE TEMPTING SHORTCUT, MADE FALSIFIABLE. Period one splits 7 left /
        # 7 right across the raw feeds -- it is fixed to the ARENA -- so a parity
        # rule would have to choose a phase and would be silently wrong in half
        # of all buildings. It is not detectable in the reference game, where
        # parity happens to agree; it is detectable here.
        plays = [{"periodDescriptor": {"number": p, "periodType": "REG"},
                  "timeInPeriod": "05:00", "timeRemaining": "15:00",
                  "typeDescKey": "faceoff", "homeTeamDefendingSide": side,
                  "details": {"winningPlayerId": 1, "eventOwnerTeamId": 30}}
                 for p, side in ((1, "right"), (2, "left"), (3, "right"))]
        got = E.extract({"homeTeam": HOME, "awayTeam": AWAY, "rosterSpots": ROSTER,
                         "plays": plays}, json.loads(shifts_bytes()))
        self.assertEqual(got["sides"], {"1": "right", "2": "left", "3": "right"},
                         "the arena decides period one, and we copy it")

    def test_a_period_the_feed_disagrees_with_itself_about_carries_no_entry(self):
        # NO MAJORITY VOTE. A renderer must be able to tell "they swapped" from
        # "we do not know", so an inconsistent period is absent rather than
        # guessed -- and the periods around it are unaffected, which is what
        # makes this a rule and not a panic.
        plays = [{"periodDescriptor": {"number": p, "periodType": "REG"},
                  "timeInPeriod": "05:00", "timeRemaining": "15:00",
                  "typeDescKey": "faceoff", "homeTeamDefendingSide": side,
                  "details": {"winningPlayerId": 1, "eventOwnerTeamId": 30}}
                 for p, side in ((1, "left"), (1, "right"), (2, "right"))]
        got = E.extract({"homeTeam": HOME, "awayTeam": AWAY, "rosterSpots": ROSTER,
                         "plays": plays}, json.loads(shifts_bytes()))
        self.assertEqual(got["sides"], {"2": "right"},
                         "the contradicted period drops out; its neighbour stays")

    def test_the_gate_fires_when_a_period_claims_the_wrong_end(self):
        # A wrong side mirrors a whole period of hockey and renders perfectly.
        self.rich["sides"]["2"] = self.rich["sides"]["1"]
        fails, _ = validate_quietly(self.rich, self.pbp, self.shifts, self.box)
        self.assertTrue(any("recorded ends" in f for f in fails),
                        f"the ends check did not fire; got {fails}")

    def test_normalization_still_undoes_the_switch_it_now_also_records(self):
        # RECORDING IT MUST NOT CHANGE IT. Every coordinate still reads as though
        # the host defended -x all night -- that is what every layer and every
        # base rate is computed on -- and the new field is a note beside it, not
        # a change to it. Checked against the raw, per play.
        bad = 0
        for e, p in zip(self.rich["events"], self.pbp["plays"]):
            raw = (p.get("details") or {}).get("xCoord")
            if raw is None:
                continue
            want = -raw if p["homeTeamDefendingSide"] == "right" else raw
            bad += (e["x"] != (want or 0))
        self.assertEqual(bad, 0)
        self.assertEqual(self.rich["sides"]["2"], "right",
                         "and period two is the one that was flipped")
