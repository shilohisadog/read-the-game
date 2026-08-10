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
        self.assertEqual(len(store.writes), first, "idempotent: no rewrite on identical bytes")
        self.assertEqual(rep.unchanged, 1)
        self.assertEqual(rep.fetched, 0)

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
        self.assertEqual(rep.refused, 1)
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
        self.assertEqual(rep.refused, 2)


class Report(unittest.TestCase):

    def test_the_report_states_what_happened_including_nothing(self):
        store = DictStore()
        t = transport_for({"/v1/schedule/": (200, schedule_payload("2026-01-10", []))})
        rep = F.ingest("2026-01-10", 1, t, store)
        self.assertEqual((rep.fetched, rep.unchanged, rep.amended, rep.refused), (0, 0, 0, 0))
        self.assertEqual(store.writes, [], "an empty night writes nothing, not an empty index")

    def test_last_ingest_is_recorded_so_staleness_can_be_shown(self):
        # The front page renders this. A stalled pipeline becomes visible to
        # users and to us without any monitoring service existing.
        store = DictStore()
        t = transport_for({**feed_routes(), "/v1/schedule/": (200, schedule_payload(
            "2026-01-10", [game(2026020001)]))})
        F.ingest("2026-01-10", 1, t, store, now="2026-01-11T09:00:00Z")
        idx = json.loads(store.get("index.json"))
        self.assertEqual(idx["lastIngest"], "2026-01-11T09:00:00Z")
        self.assertIn("2026020001", [str(g["id"]) for g in idx["games"]])


if __name__ == "__main__":
    unittest.main()
