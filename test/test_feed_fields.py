"""tools/feed_fields.py counts what the raw play-by-play carries."""
import hashlib, json, os, sys, tempfile, unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "builders"))
import feed_fields as FF  # noqa: E402
import fetch_nhl as F  # noqa: E402


def put_game(root, gid, plays):
    raw = json.dumps({"plays": plays}).encode()
    d = hashlib.sha256(raw).hexdigest()
    store = F.FileStore(root)
    store.put(F.raw_key(gid, d, "play-by-play"), raw)
    store.put(f"raw/{gid}/latest.json", json.dumps({"play-by-play": d}).encode())


class Survey(unittest.TestCase):
    def test_counts_losers_and_shot_types_by_season(self):
        root = tempfile.mkdtemp()
        put_game(root, "2025020001", [
            {"typeDescKey": "faceoff", "details": {"winningPlayerId": 1, "losingPlayerId": 2}},
            {"typeDescKey": "faceoff", "details": {"winningPlayerId": 1}},
            {"typeDescKey": "shot-on-goal", "details": {"shotType": "wrist"}},
            {"typeDescKey": "blocked-shot", "details": {}},
            {"typeDescKey": "hit", "details": {}},
        ])
        put_game(root, "2024030001", [{"typeDescKey": "goal", "details": {"shotType": "tip-in"}}])
        by, kinds, absent = FF.survey(root)
        reg = by["2025-02"]
        self.assertEqual((reg["games"], reg["faceoffs"], reg["faceoffs_with_loser"]), (1, 2, 1))
        self.assertEqual((reg["shots"], reg["shots_with_type"]), (2, 1))
        self.assertEqual(by["2024-03"]["goal_with_type"], 1)
        self.assertEqual(dict(kinds), {"wrist": 1, "tip-in": 1})
        self.assertEqual(absent, 0)

    def test_a_game_whose_play_by_play_is_not_held_is_counted_absent(self):
        root = tempfile.mkdtemp()
        F.FileStore(root).put("raw/2025020002/latest.json", json.dumps({"play-by-play": "0" * 64}).encode())
        self.assertEqual(FF.survey(root)[2], 1)


if __name__ == "__main__":
    unittest.main()
