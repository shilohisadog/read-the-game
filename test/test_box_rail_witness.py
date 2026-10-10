#!/usr/bin/env python3
"""
`tools/box_rail_witness.py` — can the boxscore stand in for the right rail?

⭐ THIS MEASURES A HYPOTHESIS BEFORE A SCHEMA BUMP AND A FULL ARCHIVE RE-DERIVE
ARE SPENT ON IT. The claim is that per-player sums out of `boxscore`, which we
hold for every game, reproduce the per-team totals in `right-rail`, which we hold
for 64 of 4,620. If they do, the second witness goes archive-wide for ZERO league
requests. If they do not, that is a finding about the league's own documents and
we want it before building, not after.

⛔ SO THE ARITHMETIC ITSELF HAS TO BE RIGHT, OR THE ANSWER IS WORTHLESS IN BOTH
DIRECTIONS — a tool that under-counts reports a disagreement that is its own, and
one that silently skips a game reports agreement it never checked. These drive it
with documents whose answers are known, including the three shapes the league
actually produces: a count as an int, a count as a STRING, and a value that is not
a count at all.
"""
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location(
    "box_rail_witness", ROOT / "tools" / "box_rail_witness.py")
brw = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(brw)


def player(**kw):
    base = {"hits": 0, "giveaways": 0, "takeaways": 0, "pim": 0,
            "blockedShots": 0, "sog": 0}
    base.update(kw)
    return base


def box(away_rows, home_rows, away_sog=None, home_sog=None):
    """A boxscore with the three player groups and the team block."""
    def side(rows):
        return {"forwards": rows[:1], "defense": rows[1:2], "goalies": rows[2:3]}
    d = {"awayTeam": {"abbrev": "AAA", "sog": away_sog},
         "homeTeam": {"abbrev": "HHH", "sog": home_sog},
         "playerByGameStats": {"awayTeam": side(away_rows), "homeTeam": side(home_rows)}}
    return d


def rail(**cats):
    """`{figure: (awayValue, homeValue)}` as the league's own list of categories."""
    return {"teamGameStats": [{"category": k, "awayValue": v[0], "homeValue": v[1]}
                              for k, v in cats.items()]}


class TheArithmetic(unittest.TestCase):
    def test_a_team_total_is_forwards_defence_AND_goalies(self):
        """⚠️ A goaltender takes penalty minutes and is credited the odd shot.
        Dropping the group makes `pim` quietly low on exactly the games where it
        matters — and quietly low reads as a league disagreement."""
        b = box([player(pim=2), player(pim=4), player(pim=10)],
                [player(hits=1), player(hits=2), player(hits=0)])
        sums = brw.box_sums(b)
        self.assertEqual(sums["awayTeam"]["pim"], 16, "the goaltender's 10 was dropped")
        self.assertEqual(sums["homeTeam"]["hits"], 3)

    def test_a_count_the_league_sent_as_a_STRING_is_a_count(self):
        """⛔ The league mixes types in one column — an int for hits, "1/3" for
        faceoffs, in the same list of the same shape. Comparing "31" to 31 as
        strings would report a disagreement on every figure and look like a
        finding."""
        t = brw.rail_totals(rail(hits=("31", "20")))
        self.assertEqual(t["awayTeam"]["hits"], 31)
        self.assertEqual(t["homeTeam"]["hits"], 20)

    def test_a_value_that_is_not_a_count_is_not_read_as_one(self):
        """`faceoffWins` arrives as "1/3" and percentages as 0.333. Neither is a
        total, and a 0 quietly substituted for either would be compared."""
        t = brw.rail_totals(rail(hits=(1, 1), blockedShots=("1/3", "2/3")))
        self.assertIn("hits", t["awayTeam"])
        self.assertNotIn("blocked", t["awayTeam"],
                         "a won/total string was read as a blocked-shot count")
        self.assertIsNone(brw._num(0.333))
        self.assertIsNone(brw._num("x"))
        self.assertIsNone(brw._num(True), "a bool is not a count")


class WhatItReports(unittest.TestCase):
    def rows(self, b, r):
        return brw.compare(b, r)

    def test_agreement_is_reported_per_team_side(self):
        b = box([player(hits=5), player(hits=5), player()],
                [player(hits=2), player(hits=1), player()])
        got = self.rows(b, rail(hits=(10, 3)))
        self.assertEqual(got["hits"], [("awayTeam", 10, 5 + 5), ("homeTeam", 3, 3)])

    def test_a_disagreement_carries_BOTH_numbers(self):
        """A report saying only "they differ" cannot be acted on."""
        b = box([player(takeaways=4), player(), player()],
                [player(takeaways=1), player(), player()])
        got = self.rows(b, rail(takeaways=(4, 9)))
        self.assertEqual(got["takeaways"], [("awayTeam", 4, 4), ("homeTeam", 1, 9)])

    def test_a_figure_the_rail_never_states_is_absent_rather_than_zero(self):
        """⛔ A missing category compared as 0 would manufacture a disagreement on
        every game, which is the loudest possible wrong answer."""
        b = box([player(hits=3), player(), player()], [player(), player(), player()])
        got = self.rows(b, rail(giveaways=(0, 0)))
        self.assertNotIn("hits", got)
        self.assertIn("giveaways", got)

    def test_an_unreadable_document_is_NOT_counted_as_agreement(self):
        """⛔ "We could not ask" must never land on the same side as "they
        agreed" — the distinction `measures_fresh.py` had to be taught."""
        self.assertIsNone(brw.compare({"playerByGameStats": None}, rail(hits=(1, 1))))
        self.assertIsNone(brw.compare(box([player()], [player()]), {"teamGameStats": []}))

    def test_faceoffs_are_absent_from_the_comparison_ON_PURPOSE(self):
        """⚠️ The boxscore publishes `faceoffWinningPctg` per player — a rate with
        no denominator. A row quietly omitted would read as a figure that agreed,
        so the table has no faceoff row at all and the report says why."""
        self.assertNotIn("faceoffWins", brw.FIGURES)


class TheControl(unittest.TestCase):
    """⭐ The boxscore against ITSELF on sog, which is KNOWN to disagree sometimes.
    A run reporting it perfect is a run whose arithmetic is not reaching the
    data — so the tool says so out loud rather than reporting a clean sweep."""

    def test_it_compares_the_player_sum_to_the_team_block(self):
        b = box([player(sog=3), player(sog=2), player()],
                [player(sog=1), player(sog=1), player()], away_sog=5, home_sog=7)
        self.assertEqual(brw.self_check(b),
                         [("awayTeam", 5, 5), ("homeTeam", 2, 7)])

    def test_a_boxscore_with_no_team_sog_yields_no_rows(self):
        b = box([player(sog=3), player(), player()], [player(), player(), player()])
        self.assertEqual(brw.self_check(b), [])


class WalkingTheStore(unittest.TestCase):
    def setUp(self):
        self.dir = pathlib.Path(tempfile.mkdtemp())

    def game(self, gid, docs):
        for name, doc in docs.items():
            d = f"d-{name}"
            p = self.dir / "raw" / gid / d / f"{name}.json"
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps(doc))
        latest = self.dir / "raw" / gid / "latest.json"
        latest.write_text(json.dumps({n: f"d-{n}" for n in docs}))

    def test_only_games_holding_BOTH_documents_are_walked(self):
        """The whole archive has a boxscore; 1.4% has a rail. A game counted
        without one would be a comparison against nothing."""
        self.game("1", {"boxscore": box([player()], [player()]), "right-rail": rail(hits=(0, 0))})
        self.game("2", {"boxscore": box([player()], [player()])})
        self.game("3", {"right-rail": rail(hits=(0, 0))})
        self.assertEqual([g for g, _, _ in brw.games_with_both(self.dir)], ["1"])

    def test_a_pointer_naming_bytes_that_are_not_there_is_skipped(self):
        """The store is content-addressed and the nightly rehydrates POINTERS
        ONLY, so a latest.json whose blobs are absent is the ordinary case."""
        self.game("1", {"boxscore": box([player()], [player()]), "right-rail": rail(hits=(0, 0))})
        (self.dir / "raw" / "1" / "d-right-rail" / "right-rail.json").unlink()
        self.assertEqual(list(brw.games_with_both(self.dir)), [])

    def test_the_report_counts_sides_and_names_the_disagreement(self):
        self.game("2026020001", {
            "boxscore": box([player(hits=7), player(hits=3), player()],
                            [player(hits=2), player(hits=2), player()],
                            away_sog=0, home_sog=0),
            "right-rail": rail(hits=(10, 99))})
        buf = io.StringIO()
        rep = brw.run(self.dir, out=buf)
        said = buf.getvalue()
        self.assertEqual(rep["checked"], 1)
        self.assertEqual(rep["figures"]["hits"], {"sides": 2, "agree": 1})
        # ⚠️ THE NUMBERS AND THE SUBJECT, not a formatted line. Asserting the
        # exact spacing makes this a test of the column widths, which will be
        # adjusted the first time somebody reads the report — and then the
        # assertion gets relaxed rather than the formatting reconsidered.
        line = next(l for l in said.split("\n") if "2026020001" in l and "hits" in l)
        self.assertIn("homeTeam", line)
        self.assertRegex(line, r"\b4\b.*\b99\b")
        self.assertIn("faceoffWins is NOT in this table", said)

    def test_an_empty_store_says_so_rather_than_reporting_agreement(self):
        buf = io.StringIO()
        rep = brw.run(self.dir, out=buf)
        self.assertEqual(rep["checked"], 0)
        self.assertIn("nothing to compare", buf.getvalue())


if __name__ == "__main__":
    unittest.main()
