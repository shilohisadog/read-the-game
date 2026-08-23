"""The gate that makes index.json's archive block answer to catalog.json.

⭐ EVERY TEST HERE ASSERTS THE EXIT CODE, NOT ONLY THE COMPLAINT LIST.

On 2026-08-22 a mutation setting `bad = False` disarmed all three of derive.py's
drift alarms and 150 Python tests stayed green, because the test named
`..._goes_RED_...` asserted the ledger and never the return value -- with a
docstring saying, in as many words, "a line in index.json nobody reads is not
'loudly'. The exit code is." A name that promises an OUTCOME has to assert the
outcome, and if the outcome is unreachable from a test then THAT is the bug.
So `check()` returns the sentences and `main()` returns the code, and both are
reachable, and both are checked below.
"""
import contextlib
import io
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "builders"))
import ledger as L


def row(gid, v=1, t=2, r=None, u=None):
    out = {"id": gid, "d": "2025-10-01", "t": t, "v": v,
           "a": "MIN", "h": "BUF", "as": 1, "hs": 2, "ash": 20, "hsh": 22}
    if r:
        out["r"] = r
    if u:
        out["u"] = u
    return out


GAMES = [row(2025020001), row(2025020002), row(2025020003, u=1),
         row(2025020004, v=0, r="validation"), row(2025010005, v=0, t=1, r="vocabulary")]


def index_for(games, **over):
    a = L.recount(games)
    a.update(over.pop("archive", {}))
    run = {"walked": 0, "derived": 0, "unchanged": 0, "refused": 0, "absent": 0}
    run.update(over.pop("run", {}))
    idx = {"archive": a, "run": run}
    idx.update(over)
    return idx


class TheArchiveBlockAnswersToTheCatalog(unittest.TestCase):

    def code(self, idx, games=GAMES):
        """The EXIT CODE, through main(), over files on disk -- the whole path
        CI actually runs, argument parsing and JSON decoding included."""
        with tempfile.TemporaryDirectory() as d:
            i, c = os.path.join(d, "i.json"), os.path.join(d, "c.json")
            json.dump(idx, open(i, "w"))
            json.dump({"games": games}, open(c, "w"))
            # BOTH STREAMS SWALLOWED, and stderr is not merely tidiness: the
            # complaints are `::error::` lines, and GitHub turns those into red
            # annotations wherever they appear -- so a suite exercising the gate
            # would decorate a PASSING run with nine failures it invented
            # itself. False reds are how a working gate gets ignored.
            # The RETURN VALUE is the subject here; the prose is asserted
            # through `check()`, where prose is the subject.
            with contextlib.redirect_stdout(io.StringIO()), \
                    contextlib.redirect_stderr(io.StringIO()):
                return L.main([i, c])

    def test_an_agreeing_pair_is_clean_and_green(self):
        # A gate that cannot pass is not a gate, it is an outage on a timer.
        idx = index_for(GAMES)
        self.assertEqual(L.check(idx, GAMES), [])
        self.assertEqual(self.code(idx), 0)

    def test_THE_OUTAGE_SHAPE_a_run_s_zeros_under_the_archive_s_name(self):
        """D8 EXACTLY AS IT SHIPPED: `published: 0, absent: 4553`.

        This is the state that stood in the published index for most of every
        week for months, that printed "0 archived" at the top of the build list,
        and that a drift alarm then read and failed a production ingest on.
        """
        idx = index_for(GAMES, archive={"published": 0, "games": 0})
        bad = L.check(idx, GAMES)
        self.assertTrue(any("archive.published" in b for b in bad), bad)
        self.assertEqual(self.code(idx), 1, "the outage shape went GREEN")

    def test_every_figure_is_instrumented_separately(self):
        # MUTATION GUARD ON THE GATE ITSELF. A check that only really looks at
        # `published` would pass all of these; each has to fail on its own or
        # the ones nobody thought about are decoration.
        for key, wrong in (("games", 99), ("published", 0), ("refused", 0),
                           ("unreconciled", 0), ("byGate", {"validation": 1}),
                           ("gameTypes", {"2": 5}), ("refusedGames", [])):
            idx = index_for(GAMES, archive={key: wrong})
            with self.subTest(key=key):
                bad = L.check(idx, GAMES)
                self.assertTrue(any(f"archive.{key}" in b for b in bad),
                                f"{key} could be anything and the gate was green")
                self.assertEqual(self.code(idx), 1)

    def test_the_old_block_coming_back_is_itself_the_alarm(self):
        # Not merely tolerated-and-ignored: a writer emitting the old shape is
        # emitting plausible figures about the wrong population, which is the
        # defect and not a leftover.
        idx = index_for(GAMES)
        idx["extracts"] = {"published": 0, "absent": 4553}
        self.assertEqual(self.code(idx), 1)
        self.assertTrue(any("extracts" in b for b in L.check(idx, GAMES)))

    def test_a_missing_ledger_is_not_a_passing_ledger(self):
        # "This version did not check" must never read as "we checked and found
        # none" -- the same distinction lastRun exists to make one layer up.
        for block in ("archive", "run"):
            idx = index_for(GAMES)
            del idx[block]
            with self.subTest(block=block):
                self.assertEqual(self.code(idx), 1)
                self.assertIn(f"no `{block}` ledger", " ".join(L.check(idx, GAMES)))

    def test_both_identities_close_over_their_own_set(self):
        idx = index_for(GAMES, archive={"games": 5, "published": 3, "refused": 1})
        self.assertTrue(any("archive ledger does not close" in b
                            for b in L.check(idx, GAMES)))
        self.assertEqual(self.code(idx), 1)
        idx = index_for(GAMES, run={"walked": 9, "derived": 1})
        self.assertTrue(any("run ledger does not close" in b
                            for b in L.check(idx, GAMES)))
        self.assertEqual(self.code(idx), 1)

    def test_the_word_published_may_not_reappear_on_the_run_side(self):
        idx = index_for(GAMES, run={"published": 0})
        self.assertEqual(self.code(idx), 1)

    def test_A_NIGHTLY_THAT_WALKED_NOTHING_IS_CHECKED_AGAINST_4553_ROWS(self):
        """⭐ THE DENOMINATOR QUESTION, WHICH IS WHY THIS GATE EXISTS.

        The lesson the outage cost us: ask what a check's denominator is on the
        SMALLEST run that will execute it. The old gate's was the run's own
        report, so on a nightly it compared zero against zero and passed. This
        one's is the catalog, which is whole on exactly those runs -- so the
        run where the figures were written wrong is the run where they are read.
        """
        idx = index_for(GAMES, run={"walked": 5, "absent": 5})
        self.assertEqual(self.code(idx), 0, "a nightly that walks nothing is fine")
        # And on that same run the archive figures are still under the lamp.
        idx = index_for(GAMES, run={"walked": 5, "absent": 5},
                        archive={"published": 0})
        self.assertEqual(self.code(idx), 1,
                         "zeroed archive figures passed on the one run that "
                         "writes them, which is D8's whole history")

    def test_an_empty_archive_is_reported_not_divided_by(self):
        idx = index_for([])
        self.assertEqual(self.code(idx, games=[]), 0)


class RecountIsCheckedAgainstNumbersAHUMANWROTE(unittest.TestCase):
    """⭐ BECAUSE `index_for` ABOVE IS A MIRROR, AND MIRRORS MOVE TOGETHER.

    Every test in the class above builds its expected archive block by calling
    `recount` -- the function under test. That is fine for asserting the gate
    NOTICES a wrong figure, because those tests perturb the index afterwards.
    It is worthless for asserting `recount` itself is right: a mutation
    relabelling every unrecorded gate `"x"` changes both sides of the
    comparison identically and 170 tests stayed green on it.

    That is this project's dominant failure mode -- a check built from the
    implementation's own model of its input -- caught inside the fix for an
    outage that same failure mode caused. The only cure is an expectation a
    person wrote down, so the numbers below are literals on purpose.
    """

    def test_a_refusal_that_predates_the_gate_field_is_still_placed(self):
        # A row merged from an older catalog carries no `r`: the field postdates
        # part of the archive. Dropping it leaves a ledger whose categories do
        # not add up to its own total; relabelling it silently invents a gate.
        got = L.recount(GAMES + [row(2024020009, v=0)])
        self.assertEqual(got["refused"], 3)
        self.assertEqual(got["byGate"],
                         {"validation": 1, "vocabulary": 1, "unrecorded": 1})

    def test_the_counts_are_what_a_person_reading_the_rows_would_say(self):
        got = L.recount(GAMES)
        self.assertEqual(got["games"], 5)
        self.assertEqual(got["published"], 3)
        self.assertEqual(got["refused"], 2)
        self.assertEqual(got["unreconciled"], 1)
        self.assertEqual(got["gameTypes"], {"2": 4, "1": 1})
        self.assertEqual(got["refusedGames"], [2025010005, 2025020004])

    def test_a_dropped_refusal_breaks_the_identity_even_if_both_sides_drop_it(self):
        idx = index_for(GAMES)
        idx["archive"]["byGate"] = {"validation": 1}
        self.assertTrue(any("account for" in b for b in L.check(idx, GAMES)))


class TheGateRunsTheWholePath(unittest.TestCase):

    def test_bad_arguments_are_an_error_not_a_pass(self):
        # A gate invoked wrongly in a workflow must not exit 0. This is the
        # `str.replace` lesson in another costume: the failure mode of a step
        # that quietly does nothing is a green check that measured nothing.
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(L.main([]), 2)
            self.assertEqual(L.main(["only-one.json"]), 2)


if __name__ == "__main__":
    unittest.main()
