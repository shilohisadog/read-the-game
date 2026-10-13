"""builders/standings.py copies the league's standings for the right day, or nothing."""
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "builders"))
import standings as S  # noqa: E402


def row(ab, w, l, o, gp, date="2026-10-12"):
    return {"teamAbbrev": {"default": ab}, "wins": w, "losses": l, "otLosses": o,
            "gamesPlayed": gp, "date": date}


class Standings(unittest.TestCase):
    def test_the_newest_regular_season_date_of_the_newest_season(self):
        cat = {"games": [
            {"id": 2025020001, "d": "2026-04-15", "v": 1},
            {"id": 2026010001, "d": "2026-09-28", "v": 1},     # preseason is not a record
            {"id": 2026020002, "d": "2026-10-11", "v": 1},
            {"id": 2026020003, "d": "2026-10-12", "v": 0},     # refused is not held
        ]}
        self.assertEqual(S.newest_regular_date(cat), ("2026-10-11", "2026"))
        self.assertEqual(S.newest_regular_date({"games": []}), (None, None))

    def test_each_team_is_copied_as_wins_losses_otl_games(self):
        doc = {"standings": [row("BUF", 3, 3, 0, 6), row("PIT", 3, 2, 1, 6)]}
        self.assertEqual(S.parse(doc, "2026-10-12"), {"BUF": [3, 3, 0, 6], "PIT": [3, 2, 1, 6]})

    def test_a_document_about_another_day_is_refused(self):
        doc = {"standings": [row("BUF", 3, 3, 0, 6, date="2026-10-13")]}
        self.assertIsNone(S.parse(doc, "2026-10-12"))

    def test_a_row_it_cannot_read_refuses_the_document(self):
        bad = row("BUF", 3, 3, 0, 6)
        bad["otLosses"] = None
        self.assertIsNone(S.parse({"standings": [bad]}, "2026-10-12"))


if __name__ == "__main__":
    unittest.main()
