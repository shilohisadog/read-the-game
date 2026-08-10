"""Acquisition — builders/fetch_nhl.py.

THE ONE PROPERTY THIS MODULE HAS TO HAVE: it touches the network and never
interprets. `extract.py` interprets and never sees a socket. That boundary is
what lets the extractor keep a byte-identical gate, so the tests here are mostly
about proving the fetcher does LESS than you might expect -- it must not parse,
reformat, pretty-print or validate the three game payloads, only store them.

The seams are injected. `transport` is a function returning (status, bytes) and
`store` is an object with has/get/put, so every test here runs with no network
and no R2. That is not a convenience: a fetcher that can only be tested against
the live NHL API is a fetcher whose failure modes are untestable, and the ones
that matter (an amendment, a truncated response, an unknown game state) are
exactly the ones you cannot summon on demand from the real feed.

Run: python3 -m unittest discover -s test -p 'test_*.py'
"""
import json
import hashlib
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "builders"))
import fetch_nhl as F


# --------------------------------------------------------------------------
# Doubles

class DictStore:
    """R2 stands in as a dict. Records writes so tests can assert on them."""

    def __init__(self, initial=None):
        self.obj = dict(initial or {})
        self.writes = []

    def has(self, key):
        return key in self.obj

    def get(self, key):
        return self.obj.get(key)

    def put(self, key, data):
        assert isinstance(data, bytes), f"store must be given bytes, got {type(data)}"
        self.obj[key] = data
        self.writes.append(key)


def schedule_payload(date, games):
    """A schedule response shaped like the real one: a WEEK, keyed by date."""
    return json.dumps({
        "gameWeek": [{"date": date, "games": games}]
    }).encode()


def game(gid, state="OFF", gtype=2, away="MIN", home="BUF"):
    return {"id": gid, "gameState": state, "gameType": gtype,
            "awayTeam": {"abbrev": away}, "homeTeam": {"abbrev": home}}


def transport_for(routes, default=(404, b"")):
    """A transport that answers from a dict of url-substring -> (status, bytes)."""
    calls = []

    def t(url):
        calls.append(url)
        for frag, resp in routes.items():
            if frag in url:
                return resp
        return default

    t.calls = calls
    return t


PBP = b'{"plays":[{"typeDescKey":"goal"}]}'
BOX = b'{"boxscore":true}'
SHF = b'{"data":[]}'


def feed_routes(pbp=PBP, box=BOX, shf=SHF):
    return {"play-by-play": (200, pbp), "boxscore": (200, box), "shiftcharts": (200, shf)}


# --------------------------------------------------------------------------

class Window(unittest.TestCase):

    def test_the_window_is_inclusive_and_ordered(self):
        d = F.dates_in_window("2026-01-10", 3)
        self.assertEqual(d, ["2026-01-08", "2026-01-09", "2026-01-10"])

    def test_a_window_of_one_is_a_single_day(self):
        self.assertEqual(F.dates_in_window("2026-01-10", 1), ["2026-01-10"])

    def test_the_window_crosses_a_month_and_a_year(self):
        self.assertEqual(F.dates_in_window("2026-03-02", 3),
                         ["2026-02-28", "2026-03-01", "2026-03-02"])
        self.assertEqual(F.dates_in_window("2024-03-01", 2), ["2024-02-29", "2024-03-01"],
                         "2024 is a leap year")
        self.assertEqual(F.dates_in_window("2026-01-01", 2), ["2025-12-31", "2026-01-01"])

    def test_the_schedule_returns_a_week_so_a_14_day_window_is_not_14_calls(self):
        # Verified against the live endpoint: /v1/schedule/{date} answers with a
        # seven-day gameWeek. Asking per-date would be 14 requests for the same
        # data, which is rude to a feed we do not pay for.
        urls = F.schedule_urls(F.dates_in_window("2026-01-14", 14))
        self.assertLessEqual(len(urls), 3, f"14 days should need ~2 calls, got {len(urls)}")
        self.assertGreaterEqual(len(urls), 2)
        for u in urls:
            self.assertIn("/v1/schedule/", u)

    def test_every_date_in_the_window_is_covered_by_some_schedule_call(self):
        # The dedup must not lose days. A window whose edges fall mid-week is
        # exactly where an off-by-one would hide.
        for days in (1, 5, 7, 8, 14, 21):
            dates = F.dates_in_window("2026-01-14", days)
            covered = set()
            for u in F.schedule_urls(dates):
                start = u.rsplit("/", 1)[-1]
                covered |= set(F.dates_in_window(F.shift_date(start, 6), 7))
            self.assertTrue(set(dates) <= covered, f"{days}-day window leaves gaps")


class Classification(unittest.TestCase):

    def test_only_states_known_to_mean_final_are_ingested(self):
        self.assertIn("OFF", F.FINAL_STATES)

    def test_the_allowlist_holds_only_what_has_been_observed(self):
        # 133 completed games sampled across three weeks showed exactly one
        # value. It is August; nothing unfinished is reachable. Writing down a
        # larger set would be guessing at the feed, which is the one thing this
        # project does not do -- so the first in-season run is EXPECTED to refuse
        # and report, and that report is how the set grows.
        self.assertEqual(set(F.FINAL_STATES), {"OFF"})

    def test_an_unknown_state_is_refused_and_named(self):
        got = F.classify(json.loads(schedule_payload("2026-01-10", [
            game(1, state="OFF"), game(2, state="LIVE"),
        ]).decode()))
        self.assertEqual([g["id"] for g in got.final], [1])
        self.assertEqual([(g["id"], g["gameState"]) for g in got.unknown], [(2, "LIVE")])

    def test_classification_never_guesses_from_the_score_or_the_date(self):
        # A game can look finished in every other respect and not be final. The
        # state field is the only thing consulted.
        g = game(9, state="SOMETHING_NEW")
        g["awayTeam"]["score"], g["homeTeam"]["score"] = 2, 3
        got = F.classify({"gameWeek": [{"date": "2020-01-01", "games": [g]}]})
        self.assertEqual(got.final, [])
        self.assertEqual(len(got.unknown), 1)


    def test_a_week_that_overhangs_the_window_does_not_inflate_the_count(self):
        # CHENG's finding. /v1/schedule/{date} answers with a SEVEN-DAY week, so
        # a window whose edges fall mid-week is assembled from responses that
        # extend past it on both sides. Counting the games in the RESPONSES
        # rather than the games in the WINDOW overstates permanently -- against
        # the live feed, a 3-day window sits inside a week holding 47 games of
        # which only 23 are in range, so coverage would report a phantom
        # shortfall of 24 games forever. In season nobody notices, because a
        # busy schedule makes the wrong number look plausible.
        dates = ["2026-01-10", "2026-01-11"]
        week = {"gameWeek": [
            {"date": "2026-01-09", "games": [game(1)]},           # before
            {"date": "2026-01-10", "games": [game(2), game(3)]},  # in
            {"date": "2026-01-11", "games": [game(4)]},           # in
            {"date": "2026-01-12", "games": [game(5), game(6)]},  # after
        ]}
        got = F.classify(week, dates)
        self.assertEqual(sorted(g["id"] for g in got.final), [2, 3, 4],
                         "only games inside the window may be counted")

    def test_an_out_of_window_game_with_an_odd_state_is_not_refused_either(self):
        # The mirror of the above: a game outside the window must not be counted
        # as final OR as refused. Leaking it into `unknown` would halt the run on
        # a vocabulary change in a week we were not asked to ingest.
        week = {"gameWeek": [
            {"date": "2026-01-09", "games": [game(1, state="WEIRD"), game(2, state="WEIRD")]},
            {"date": "2026-01-10", "games": [game(3)]},
        ]}
        got = F.classify(week, ["2026-01-10"])
        self.assertEqual([g["id"] for g in got.final], [3])
        self.assertEqual(got.unknown, [], "an out-of-window oddity is not our business")


class NeverInterprets(unittest.TestCase):

    def run_one(self, routes, store=None, **kw):
        store = store or DictStore()
        t = transport_for({**routes, "/v1/schedule/": (200, schedule_payload(
            "2026-01-10", [game(2026020001)]))})
        rep = F.ingest("2026-01-10", 1, t, store, **kw)
        return rep, store, t

    def test_bytes_are_stored_exactly_as_received(self):
        rep, store, _ = self.run_one(feed_routes())
        keys = [k for k in store.obj if k.endswith("play-by-play.json")]
        self.assertEqual(len(keys), 1)
        self.assertEqual(store.obj[keys[0]], PBP, "stored bytes must equal fetched bytes")

    def test_the_game_payloads_are_never_parsed(self):
        # The strongest form of "does not interpret": hand it something that is
        # not JSON at all. A fetcher that parses would raise here; this one must
        # store the bytes and move on, because deciding whether a payload is
        # valid is extract.py's job and its gates already do it.
        junk = b"<html>502 Bad Gateway</html>"
        rep, store, _ = self.run_one(feed_routes(pbp=junk))
        keys = [k for k in store.obj if k.endswith("play-by-play.json")]
        self.assertEqual(store.obj[keys[0]], junk)

    def test_the_path_is_the_hash_of_the_content(self):
        rep, store, _ = self.run_one(feed_routes())
        want = hashlib.sha256(PBP).hexdigest()
        self.assertTrue(any(want in k for k in store.obj),
                        f"no key contains the sha256 of the payload; keys={list(store.obj)}")

    def test_no_partial_write_when_a_fetch_fails(self):
        # If shifts 500s, the game is incomplete. Writing the two that succeeded
        # would leave a game that looks present and is not.
        routes = feed_routes()
        routes["shiftcharts"] = (500, b"")
        rep, store, _ = self.run_one(routes)
        self.assertEqual([k for k in store.obj if k.startswith("raw/")], [],
                         "a failed game must write nothing at all")
        self.assertTrue(rep.errors, "and it must be reported")


class Convergence(unittest.TestCase):

    def ingest(self, store, pbp=PBP, games=None):
        t = transport_for({**feed_routes(pbp=pbp), "/v1/schedule/": (200, schedule_payload(
            "2026-01-10", games or [game(2026020001)]))})
        return F.ingest("2026-01-10", 1, t, store)

    def test_running_twice_writes_nothing_the_second_time(self):
        store = DictStore()
        self.ingest(store)
        first = len(store.writes)
        self.assertGreater(first, 0)
        rep = self.ingest(store)
        raw_writes = [k for k in store.writes if k.startswith("raw/")]
        self.assertEqual(len(raw_writes), len([k for k in store.writes[:first] if k.startswith("raw/")]),
                         "idempotent: no raw feed is rewritten on identical bytes")
        self.assertEqual(rep.unchanged, 1)
        self.assertEqual(rep.fetched, 0)
        # The index IS rewritten, deliberately: lastRun must advance to prove the
        # pipeline is alive even when there was nothing to do.
        self.assertIn("index.json", store.writes[first:])

    def test_an_amended_feed_is_kept_alongside_its_predecessor(self):
        # The whole reason for a rolling window. The league corrects shot
        # attribution days later; both versions must survive or the correction
        # cannot be measured -- and measuring it is what sets the window length.
        store = DictStore()
        self.ingest(store)
        old = hashlib.sha256(PBP).hexdigest()
        amended = b'{"plays":[{"typeDescKey":"goal"},{"typeDescKey":"shot-on-goal"}]}'
        rep = self.ingest(store, pbp=amended)
        new = hashlib.sha256(amended).hexdigest()

        self.assertTrue(any(old in k for k in store.obj), "the earlier version is retained")
        self.assertTrue(any(new in k for k in store.obj), "the amendment is stored")
        self.assertEqual(rep.amended, 1)

    def test_latest_points_at_the_newest_version(self):
        store = DictStore()
        self.ingest(store)
        amended = b'{"plays":[]}'
        self.ingest(store, pbp=amended)
        latest = json.loads(store.get("raw/2026020001/latest.json"))
        self.assertEqual(latest["play-by-play"], hashlib.sha256(amended).hexdigest())


class VocabularyIsCorrelated(unittest.TestCase):
    """CHENG: the axis is correlation, not scope. One game failing is that
    game's problem; every game failing the same way is a feed change."""

    def run_with(self, games):
        store = DictStore()
        t = transport_for({**feed_routes(), "/v1/schedule/": (200, schedule_payload(
            "2026-01-10", games))})
        return F.ingest("2026-01-10", 1, t, store), store

    def test_one_odd_game_is_isolated_and_the_rest_publish(self):
        rep, store = self.run_with([game(1), game(2, state="WEIRD"), game(3)])
        self.assertEqual(rep.unknown_state, 1)
        self.assertEqual(rep.fetched, 2, "the other two still go through")
        self.assertFalse(rep.halted)

    def test_the_same_unknown_value_across_games_stops_the_run(self):
        # Publishing 6 of 7 games silently is the kind of partial success that
        # reads as health. A recurring unknown is a feed change, not an oddity.
        rep, store = self.run_with([game(1, state="NEWSTATE"), game(2, state="NEWSTATE"), game(3)])
        self.assertTrue(rep.halted, "a recurring unknown state must halt the run")
        self.assertIn("NEWSTATE", str(rep.halt_reason))

    def test_two_different_unknowns_do_not_halt(self):
        # Correlation is the signal. Two unrelated oddities are two oddities.
        rep, store = self.run_with([game(1, state="ODD_A"), game(2, state="ODD_B"), game(3)])
        self.assertFalse(rep.halted)
        self.assertEqual(rep.unknown_state, 2)


class Report(unittest.TestCase):

    def test_the_report_states_what_happened_including_nothing(self):
        store = DictStore()
        t = transport_for({"/v1/schedule/": (200, schedule_payload("2026-01-10", []))})
        rep = F.ingest("2026-01-10", 1, t, store, now="2026-01-11T11:00:00Z")
        self.assertEqual((rep.fetched, rep.unchanged, rep.amended, rep.refused), (0, 0, 0, 0))
        # An empty night writes the index and NOTHING ELSE. The earlier rule --
        # write nothing at all -- existed only to stop one conflated field from
        # advancing while no data arrived; lastRun and dataThrough being separate
        # removes the need for it. A night with no hockey is a fact worth
        # recording, and silence is what a dead pipeline looks like.
        self.assertEqual(store.writes, ["index.json"])
        idx = json.loads(store.get("index.json").decode())
        self.assertEqual(idx["lastRun"], "2026-01-11T11:00:00Z")
        self.assertEqual(idx["coverage"]["finalInWindow"], 0)

    def test_the_state_is_recorded_so_staleness_can_be_shown(self):
        # The front page renders this. A stalled pipeline becomes visible to
        # users and to us without any monitoring service existing.
        store = DictStore()
        t = transport_for({**feed_routes(), "/v1/schedule/": (200, schedule_payload(
            "2026-01-10", [game(2026020001)]))})
        F.ingest("2026-01-10", 1, t, store, now="2026-01-11T09:00:00Z")
        idx = json.loads(store.get("index.json"))
        self.assertEqual(idx["lastRun"], "2026-01-11T09:00:00Z")
        self.assertEqual(idx["dataThrough"], "2026-01-10", "the game date, not the run clock")
        self.assertIsNone(idx["halted"])
        self.assertIn("2026020001", [str(g["id"]) for g in idx["games"]])



class IngestState(unittest.TestCase):
    """docs/ingest-state.md. One field was asked to mean both data freshness and
    pipeline liveness, and those diverge exactly where it matters: a healthy
    offseason run and a dead in-season pipeline are opposite conditions that look
    identical through `lastIngest`."""

    def run_night(self, store, games, now, pbp=PBP, end="2026-01-10", days=1):
        t = transport_for({**feed_routes(pbp=pbp), "/v1/schedule/": (200, schedule_payload(
            end, games))})
        return F.ingest(end, days, t, store, now=now)

    def index(self, store):
        raw = store.get("index.json")
        return json.loads(raw.decode()) if raw else None

    # ---- 1. THE regression this document exists for -----------------------

    def test_a_run_that_fetches_nothing_still_advances_last_run(self):
        # Observed live: run 2 rehydrated 6 pointers, fetched 0, and lastIngest
        # did not move -- while the run had completely succeeded. A field that
        # cannot separate "nothing to do" from "not working" is not a health
        # signal.
        store = DictStore()
        self.run_night(store, [game(1)], now="2026-01-11T11:00:00Z")
        self.assertEqual(self.index(store)["lastRun"], "2026-01-11T11:00:00Z")

        self.run_night(store, [game(1)], now="2026-01-12T11:00:00Z")
        self.assertEqual(self.index(store)["lastRun"], "2026-01-12T11:00:00Z",
                         "a successful no-op run must still prove the pipeline is alive")

    # ---- 2 & 3. a halt is running -----------------------------------------

    def test_a_halted_run_advances_last_run_and_records_why(self):
        # CHENG's correction, conceded: a halt is a third condition -- working,
        # looked, stopped on purpose -- and under the first draft it would have
        # been byte-identical to a dead pipeline.
        store = DictStore()
        self.run_night(store, [game(1)], now="2026-01-11T11:00:00Z")
        self.run_night(store, [game(2, state="PPD"), game(3, state="PPD")],
                       now="2026-01-12T11:00:00Z")
        idx = self.index(store)
        self.assertEqual(idx["lastRun"], "2026-01-12T11:00:00Z", "a halt is still running")
        self.assertIsNotNone(idx["halted"])
        self.assertIn("PPD", idx["halted"]["reason"])
        self.assertEqual(idx["halted"]["since"], "2026-01-12T11:00:00Z")

    def test_a_halted_run_leaves_coverage_behind_last_run(self):
        # Coverage from before a halt must not read as current -- the run
        # refused to look, so it established nothing about the window.
        store = DictStore()
        self.run_night(store, [game(1)], now="2026-01-11T11:00:00Z")
        self.run_night(store, [game(2, state="PPD"), game(3, state="PPD")],
                       now="2026-01-12T11:00:00Z")
        idx = self.index(store)
        self.assertEqual(idx["coverage"]["asOf"], "2026-01-11T11:00:00Z")
        self.assertLess(idx["coverage"]["asOf"], idx["lastRun"])

    def test_a_later_clean_run_clears_the_halt(self):
        store = DictStore()
        self.run_night(store, [game(2, state="PPD"), game(3, state="PPD")],
                       now="2026-01-12T11:00:00Z")
        self.assertIsNotNone(self.index(store)["halted"])
        self.run_night(store, [game(1)], now="2026-01-13T11:00:00Z")
        self.assertIsNone(self.index(store)["halted"], "a clean run means we are no longer stopped")

    # ---- 4, 5, 6. the ledger ----------------------------------------------

    def test_a_run_with_fetch_errors_advances_last_run_and_reports_the_shortfall(self):
        store = DictStore()
        routes = feed_routes()
        routes["shiftcharts"] = (500, b"")
        t = transport_for({**routes, "/v1/schedule/": (200, schedule_payload(
            "2026-01-10", [game(1), game(2)]))})
        F.ingest("2026-01-10", 1, t, store, now="2026-01-11T11:00:00Z")
        idx = self.index(store)
        self.assertEqual(idx["lastRun"], "2026-01-11T11:00:00Z", "the pipeline itself worked")
        c = idx["coverage"]
        self.assertEqual(c["finalInWindow"], 2)
        self.assertEqual(c["heldInWindow"], 0)
        self.assertEqual(c["erroredInWindow"], 2)

    def test_coverage_conserves(self):
        # finalInWindow = held + errored + refused, in every state. The same
        # ledger as counted + excluded, pointed at the pipeline instead of the
        # game -- so it fails loudly rather than mis-reporting quietly.
        store = DictStore()
        routes = feed_routes()
        t = transport_for({**routes, "/v1/schedule/": (200, schedule_payload(
            "2026-01-10", [game(1), game(2), game(3, state="ODD")]))})
        F.ingest("2026-01-10", 1, t, store, now="2026-01-11T11:00:00Z")
        c = self.index(store)["coverage"]
        self.assertEqual(c["finalInWindow"],
                         c["heldInWindow"] + c["erroredInWindow"] + c["refusedInWindow"],
                         f"the ledger must close: {c}")

    def test_a_game_whose_state_we_do_not_know_is_not_in_the_final_ledger(self):
        # A refusal on gameState is NOT the same as a refusal on event
        # vocabulary. We do not know whether an unrecognised state means final,
        # so counting it against finalInWindow would assert something we cannot
        # support. It is reported alongside, not inside.
        store = DictStore()
        self.run_night(store, [game(1), game(2, state="ODD")], now="2026-01-11T11:00:00Z")
        c = self.index(store)["coverage"]
        self.assertEqual(c["finalInWindow"], 1, "only the game we know is final")
        self.assertEqual(c["unknownStateInWindow"], 1)
        self.assertEqual(c["heldInWindow"], 1)

    # ---- 7 & 8. dataThrough is a game date --------------------------------

    def test_data_through_comes_from_the_schedule_not_the_clock(self):
        # A game starting 22:00 Pacific belongs to the league's date, not to the
        # following UTC day. Deriving it from the ingest clock would mislabel
        # every late West Coast game.
        store = DictStore()
        self.run_night(store, [game(1)], now="2026-06-30T04:00:00Z", end="2026-01-10")
        self.assertEqual(self.index(store)["dataThrough"], "2026-01-10")

    def test_data_through_never_moves_backwards_when_backfilling(self):
        store = DictStore()
        self.run_night(store, [game(1)], now="2026-01-11T11:00:00Z", end="2026-01-10")
        self.assertEqual(self.index(store)["dataThrough"], "2026-01-10")
        self.run_night(store, [game(2)], now="2026-01-12T11:00:00Z", end="2025-12-01")
        self.assertEqual(self.index(store)["dataThrough"], "2026-01-10",
                         "ingesting an older window must not make the data look older")



if __name__ == "__main__":
    unittest.main()
