import json
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "tools"))
import extracts_current as X  # noqa: E402

CUR = {"play-by-play": "a" * 64, "boxscore": "b" * 64, "shifts": "c" * 64}
OLD = {**CUR, "shifts": "d" * 64}


def tree(ptrs, extracts):
    d = pathlib.Path(tempfile.mkdtemp())
    for gid, dg in ptrs.items():
        p = d / "ptr" / "raw" / gid / "latest.json"
        p.parent.mkdir(parents=True)
        p.write_text(json.dumps(dg))
    (d / "ex").mkdir()
    for gid, src in extracts.items():
        (d / "ex" / f"{gid}.json").write_text(json.dumps({"game": {"src": src}}))
    return str(d / "ptr"), str(d / "ex")


class ExtractsCurrent(unittest.TestCase):
    def test_current_extracts_pass(self):
        n, probs = X.check(*tree({"1": CUR, "2": CUR}, {"1": CUR, "2": CUR}))
        self.assertEqual((n, probs), (2, []))

    def test_an_extract_from_a_superseded_pointer_is_named(self):
        """The 2026-11-09 defect: a cached pointer one amendment behind."""
        n, probs = X.check(*tree({"1": CUR, "2": CUR}, {"1": CUR, "2": OLD}))
        self.assertEqual(n, 2)
        self.assertEqual(len(probs), 1)
        self.assertTrue(probs[0].startswith("2:"))

    def test_an_extract_with_no_pointer_fails(self):
        _, probs = X.check(*tree({"1": CUR}, {"1": CUR, "9": CUR}))
        self.assertEqual(probs, ["9: an extract with no pointer"])

    def test_a_refused_game_has_a_pointer_and_no_extract(self):
        self.assertEqual(X.check(*tree({"1": CUR, "2": CUR}, {"1": CUR})), (1, []))

    def test_comparing_nothing_is_a_failure(self):
        self.assertEqual(X.main(["", *tree({"1": CUR}, {})]), 1)

    def test_main_exits_one_on_a_stale_extract(self):
        self.assertEqual(X.main(["", *tree({"1": CUR}, {"1": OLD})]), 1)


if __name__ == "__main__":
    unittest.main()
