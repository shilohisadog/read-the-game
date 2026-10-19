"""tools/fetch_tracking.py fetches each goal's tracking replay, once, from the league's address only."""
import hashlib, json, os, sys, tempfile, unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "builders"))
import fetch_tracking as T  # noqa: E402
import fetch_nhl as F  # noqa: E402

URL = "https://wsr.nhle.com/sprites/20262027/{g}/ev{e}.json"


def put_game(root, gid, plays):
    raw = json.dumps({"plays": plays}).encode()
    d = hashlib.sha256(raw).hexdigest()
    store = F.FileStore(root)
    store.put(F.raw_key(gid, d, "play-by-play"), raw)
    store.put(f"raw/{gid}/latest.json", json.dumps({"play-by-play": d}).encode())


def goal(gid, e, url=None):
    return {"typeDescKey": "goal", "eventId": e, "pptReplayUrl": url or URL.format(g=gid, e=e)}


class Wanted(unittest.TestCase):
    def test_goals_of_the_season_with_a_league_address_only(self):
        root = tempfile.mkdtemp()
        put_game(root, "2026020001", [goal("2026020001", 7), {"typeDescKey": "shot-on-goal", "eventId": 8},
                                      goal("2026020001", 9, "https://example.com/x.json"),
                                      {"typeDescKey": "goal", "eventId": 10}])
        put_game(root, "2025020001", [goal("2025020001", 3)])
        self.assertEqual(T.wanted(root, "2026"),
                         [("track/2026020001/ev7.json", URL.format(g="2026020001", e=7))])


class Index(unittest.TestCase):
    def test_names_each_stored_goal_by_period_clock_and_scorer(self):
        root = tempfile.mkdtemp()
        put_game(root, "2026020001", [
            dict(goal("2026020001", 7), periodDescriptor={"number": 2}, timeInPeriod="04:11",
                 details={"scoringPlayerId": 8470000}),
            dict(goal("2026020001", 9), periodDescriptor={"number": 3}, timeInPeriod="10:00", details={})])
        self.assertEqual(T.goals_index(root, "2026", {"track/2026020001/ev7.json"}),
                         {"2026020001": [{"ev": 7, "per": 2, "clock": "04:11", "scorer": 8470000}]},
                         "a goal whose file is not stored is not indexed")


class Fetch(unittest.TestCase):
    def test_stores_good_files_counts_the_rest_and_backs_off_on_429(self):
        good = json.dumps([{"timeStamp": 1, "onIce": {}}]).encode()
        answers = {"a": [(429, b""), (200, good)], "b": [(404, b"")], "c": [(200, b"<html>")], "d": [(403, b"")]}
        slept = []
        transport = lambda url: answers[url].pop(0)
        store = F.FileStore(tempfile.mkdtemp())
        tally = T.fetch([("track/1/ev1.json", "a"), ("track/1/ev2.json", "b"),
                         ("track/1/ev3.json", "c"), ("track/1/ev4.json", "d")],
                        store, transport=transport, sleep=slept.append)
        self.assertEqual(tally, {"fetched": 1, "missing": 1, "refused": 1, "bad": 1})
        self.assertEqual(store.get("track/1/ev1.json"), good)
        self.assertIsNone(store.get("track/1/ev3.json"), "a page that is not a replay was stored")
        self.assertEqual(slept, [5], "a 429 waits before asking again")


if __name__ == "__main__":
    unittest.main()
