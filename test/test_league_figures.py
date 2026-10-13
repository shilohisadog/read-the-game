"""tools/league_figures.py copies the league's figures and never invents one."""
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import league_figures as L  # noqa: E402

BOX = json.loads((ROOT / "data" / "box_2023020204.json").read_text())


class LeagueFigures(unittest.TestCase):
    def test_every_skater_and_goalie_row_is_copied(self):
        f = L.figures(BOX, None)
        pbg = BOX["playerByGameStats"]
        n = sum(len(pbg[f"{s}Team"][k]) for s in ("home", "away") for k in ("forwards", "defense"))
        self.assertEqual(len(f["skaters"]), n)
        self.assertEqual(sum(r["goals"] for r in f["skaters"].values()),
                         BOX["homeTeam"]["score"] + BOX["awayTeam"]["score"])
        self.assertNotIn("rail", f, "no rail was given, so none may appear")

    def test_an_absent_field_is_left_out_not_zeroed(self):
        box = {"playerByGameStats": {"homeTeam": {"forwards": [{"playerId": 1, "goals": 1}]},
                                     "awayTeam": {"defense": [{"playerId": 2}]}}}
        f = L.figures(box, None)
        self.assertEqual(f["skaters"], {"1": {"goals": 1}})

    def test_an_older_goalie_row_reads_saves_over_shots(self):
        box = {"playerByGameStats": {"homeTeam": {"goalies": [
            {"playerId": 9, "saveShotsAgainst": "25/27"}]}, "awayTeam": {}}}
        self.assertEqual(L.figures(box, None)["goalies"], {"9": {"saves": 25, "shotsAgainst": 27}})

    def test_the_rail_power_play_is_goals_over_opportunities(self):
        rail = {"teamGameStats": [{"category": "powerPlay", "homeValue": "1/3", "awayValue": "0/2"}]}
        self.assertEqual(L.figures({}, rail)["rail"], {"home": [1, 3], "away": [0, 2]})


if __name__ == "__main__":
    unittest.main()
