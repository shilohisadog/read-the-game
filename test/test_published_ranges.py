"""tools/published_ranges.py -- each rule is seen to fail on the shape that escaped.

⭐ EVERY TEST ASSERTS THE EXIT CODE, the same discipline as test_ledger.py and for
the same reason: a check whose complaint list is right and whose exit is 0 stops
nothing.

The planted shapes are the ones docs/survivorship-experiment.md §3.3 recorded
reaching the published documents with every test green: a negative n, a share of
8.7, "NaN(" in a sentence, a histogram with buckets past its max. The rest are the
rules' own boundaries. A clean document must pass, or every red below proves only
that the checker fails on everything.
"""
import contextlib
import copy
import io
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
import published_ranges as R

CLEAN = {
    "attemptMix": {
        "saveFraction": {"count": 90, "n": 100, "rate": 0.9, "population": "NHL",
                         "what": "of the shots a goalie actually faced, this many were saved"},
    },
    "goalieNight": {"faced": {"counts": [1, 0, 2], "start": 3, "min": 3, "max": 5, "n": 3,
                              "unit": "appearances"}},
    "census": {
        "hits": {"n": 10, "r": -0.07, "opposite": 0.48},
        "pace": {"even": {"attempts": 406964, "minutes": 416349.7, "per60": 58.647}},
        "shooter": {"D": {"share": 0.325, "blocked": 0.375, "onGoal": 0.384, "missed": 0.2, "goal": 0.041},
                    "unknown": {"share": 0, "blocked": None, "onGoal": None, "missed": None, "goal": None}},
    },
    "teams": {"archive": {"slotShare": {"count": 2205, "n": 4641, "rate": 2205 / 4641}},
              "goalies": [{"faced": 1343, "saves": 1192, "games": 46}]},
}


def run(doc):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "measures.json")
        with open(p, "w") as f:
            json.dump(doc, f)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = R.main([p])
        return code, out.getvalue()


def planted(edit):
    doc = copy.deepcopy(CLEAN)
    edit(doc)
    return run(doc)


class TheCleanDocumentPasses(unittest.TestCase):
    def test_every_rule_accepts_a_possible_document(self):
        code, out = run(CLEAN)
        self.assertEqual(code, 0, out)


class EachEscapedShapeFails(unittest.TestCase):
    def red(self, edit, words):
        code, out = planted(edit)
        self.assertEqual(code, 1, f"exit {code} on a planted defect:\n{out}")
        self.assertIn(words, out)

    def test_a_negative_n_the_team_season_escape(self):
        def e(d): d["teams"]["archive"]["slotShare"].update(n=-4641, rate=-0.475)
        self.red(e, "negative")

    def test_a_share_of_eight_point_seven(self):
        def e(d): d["teams"]["archive"]["slotShare"].update(n=253, rate=8.715)
        self.red(e, "more than its n")

    def test_a_rate_that_is_not_count_over_n(self):
        def e(d): d["attemptMix"]["saveFraction"]["rate"] = 0.8
        self.red(e, "is not count/n")

    def test_nan_inside_a_sentence(self):
        def e(d): d["attemptMix"]["saveFraction"]["what"] = "NaN(n counts SHOTS FACED, not games)"
        self.red(e, "'NaN'")

    def test_undefined_inside_a_sentence(self):
        def e(d): d["attemptMix"]["saveFraction"]["what"] = "of undefined shots"
        self.red(e, "'undefined'")

    def test_buckets_past_the_histogram_max(self):
        def e(d): d["goalieNight"]["faced"]["counts"] += [0, 0]
        self.red(e, "buckets for the values")

    def test_buckets_that_do_not_sum_to_n(self):
        def e(d): d["goalieNight"]["faced"]["n"] = 4
        self.red(e, "sum to")

    def test_a_correlation_outside_minus_one_to_one(self):
        def e(d): d["census"]["hits"]["r"] = -1.2
        self.red(e, "correlation")

    def test_a_fraction_row_above_one(self):
        def e(d): d["census"]["shooter"]["D"]["missed"] = 8
        self.red(e, "row of fractions")

    def test_per60_that_is_not_attempts_per_hour(self):
        def e(d): d["census"]["pace"]["even"]["per60"] = 60.1
        self.red(e, "per 60 minutes")

    def test_more_saves_than_shots_faced(self):
        def e(d): d["teams"]["goalies"][0]["saves"] = 1400
        self.red(e, "exceed shots faced")

    def test_a_non_finite_number(self):
        # JSON.stringify writes null for NaN, but Python's json writes the literal,
        # and the pipeline has both languages in it
        def e(d): d["census"]["hits"]["opposite"] = float("inf")
        self.red(e, "not a finite number")

    def test_a_rate_that_is_not_a_fraction_even_with_no_denominator(self):
        # n = 0 skips count/n, so only the fraction rule can see this one
        def e(d): d["attemptMix"]["saveFraction"].update(count=0, n=0, rate=5)
        self.red(e, "is not a fraction")

    def test_a_bucket_that_is_not_a_whole_count(self):
        # sums to n, stays inside its range, and is still impossible
        def e(d): d["goalieNight"]["faced"]["counts"] = [1.5, 0, 1.5]
        self.red(e, "not a whole non-negative count")

    def test_a_document_that_is_not_json(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "measures.json")
            with open(p, "w") as f:
                f.write('{"census": ')
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = R.main([p])
        self.assertEqual(code, 1, out.getvalue())
        self.assertIn("not JSON", out.getvalue())

    def test_a_missing_document_is_not_a_pass(self):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = R.main([os.path.join(tempfile.gettempdir(), "no-such-dir-ranges", "measures.json")])
        self.assertEqual(code, 1, out.getvalue())


class WhatItMayNotFlag(unittest.TestCase):
    """The boundaries, so the rules are not wider than the documents' meaning."""

    def test_a_negative_correlation_is_allowed(self):
        self.assertEqual(run(CLEAN)[0], 0)  # CLEAN carries r = -0.07

    def test_null_is_allowed_in_a_row_of_fractions_with_no_shots(self):
        self.assertIsNone(CLEAN["census"]["shooter"]["unknown"]["onGoal"])
        self.assertEqual(run(CLEAN)[0], 0)

    def test_per60_within_the_published_rounding_is_allowed(self):
        # minutes are printed to 0.1 and per60 to 0.001, both from unrounded seconds
        def e(d): d["census"]["pace"]["even"].update(attempts=1000, minutes=1000.0, per60=59.998)
        self.assertEqual(planted(e)[0], 0)


if __name__ == "__main__":
    unittest.main()
