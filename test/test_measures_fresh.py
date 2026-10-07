#!/usr/bin/env python3
"""
`tools/measures_fresh.py` -- the one gate that can see the repo fall behind the
published archive.

⛔⛔⛔ WRITTEN AFTER IT REPORTED AGREEMENT ON A SIX-FIGURE DISAGREEMENT. It was
called from `ingest.yml` immediately after
`cp ingest/measures.json data/measures.json`, so it compared a file the step had
just overwritten against the document that file came from. On 2026-10-07 it
printed *every quoted figure already matches the published file* while
`data/measures.json` was six watched figures behind the origin, and the slot card
baked 171,027 attempts against a published 171,026.

⭐⭐ THE UNTESTABLE SHAPE WAS THE POINT. Every behaviour worth checking lived
inside a `main()` that opens a socket, so the only way to exercise it was to
stand up an HTTP server -- and nobody did, which is why the one branch that
mattered most (what it says when it CANNOT fetch) had never been run. The
comparison is now `drift_against(local, live)`, two dicts in and sentences out.

⚠️ THESE TESTS DO NOT TOUCH THE NETWORK, which is deliberate and is the same
policy that keeps the tool out of `npm run gates`.
"""
import importlib.util
import json
import pathlib
import subprocess
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOL = ROOT / "tools" / "measures_fresh.py"

_spec = importlib.util.spec_from_file_location("measures_fresh", TOOL)
mf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mf)


def live_copy():
    """The committed document, which by definition has every watched path."""
    return json.loads((ROOT / "data" / "measures.json").read_text())


class DriftDetection(unittest.TestCase):
    def test_a_document_does_not_drift_from_itself(self):
        doc = live_copy()
        self.assertEqual(mf.drift_against(doc, doc), [])

    def test_every_watched_path_is_present_in_the_real_document(self):
        """⭐ THE LIST IS A CLAIM ABOUT THE DOCUMENT, not a list of hopes. A
        watched path that no longer exists would make this gate compare None to
        None and pass -- silent, and in the flattering direction."""
        doc = live_copy()
        missing = [".".join(p) for p in mf.WATCHED if mf.dig(doc, p) is None]
        self.assertEqual(missing, [], "watched paths absent from data/measures.json")

    def test_one_moved_figure_is_named_with_both_values(self):
        """The 2026-10-07 case exactly: one count off by one."""
        local, live = live_copy(), live_copy()
        live["slot"]["attempts"]["count"] = local["slot"]["attempts"]["count"] - 1
        drift = mf.drift_against(local, live)
        self.assertEqual(len(drift), 1, drift)
        self.assertIn("slot.attempts.count", drift[0])
        self.assertIn(str(local["slot"]["attempts"]["count"]), drift[0])
        self.assertIn(str(local["slot"]["attempts"]["count"] - 1), drift[0])

    def test_a_path_the_archive_stopped_carrying_is_its_own_sentence(self):
        local, live = live_copy(), live_copy()
        del live["census"]["shift"]["median"]
        drift = mf.drift_against(local, live)
        self.assertTrue(any("no longer carries it" in d for d in drift), drift)


class WhatItSaysWhenItCannotAnswer(unittest.TestCase):
    """⛔⛔ A FAILED FETCH IS NOT A FRESH FILE AND IT IS NOT A DRIFT. Before this,
    the exception escaped and a step named for staleness aborted on a traceback.
    Exit 2 keeps "the question was not answered" off both of the other answers."""

    def test_an_unreachable_origin_exits_2_and_says_it_concluded_nothing(self):
        r = subprocess.run(
            [sys.executable, str(TOOL), "--url", "http://127.0.0.1:9/measures.json"],
            capture_output=True, text=True, cwd=ROOT, timeout=120)
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
        said = r.stdout + r.stderr
        self.assertIn("answered NOTHING", said)
        self.assertNotIn("agrees with the archive", said,
                         "an unreachable origin must never print the pass line")

    def test_an_unreachable_origin_still_exits_2_under_report(self):
        """⭐ `--report` SOFTENS A DRIFT, NEVER A FAILED FETCH. Those are different
        facts, and the whole point of report mode is that the drift is about to be
        repaired — which says nothing about an origin that cannot be read."""
        r = subprocess.run(
            [sys.executable, str(TOOL), "--report",
             "--url", "http://127.0.0.1:9/measures.json"],
            capture_output=True, text=True, cwd=ROOT, timeout=120)
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)


class WhereItRuns(unittest.TestCase):
    """⭐⭐ THE POSITIONAL CLAIM, WHICH IS THE WHOLE DEFECT. A correct tool called
    one line too late is a tool that cannot answer, and the only thing that can
    hold that is a check on the ORDER of the step's own lines."""

    def step(self, workflow):
        return (ROOT / ".github" / "workflows" / workflow).read_text()

    def test_the_ingest_asks_before_it_overwrites_the_file(self):
        y = self.step("ingest.yml")
        before = y.index("tools/measures_fresh.py --report")
        copy = y.index("cp ingest/measures.json data/measures.json")
        self.assertLess(before, copy,
                        "the freshness check must run BEFORE the cp, or it is "
                        "comparing a file the step just overwrote against its source")

    def test_the_ingest_still_asks_after_publishing_too(self):
        """The post-copy call is a different question — did the publish land —
        and it is worth keeping. Both must be present."""
        y = self.step("ingest.yml")
        self.assertIn("python3 tools/measures_fresh.py\n", y)

    def test_the_deploy_hard_fails_on_a_stale_repo(self):
        """⛔ THE LOAD-BEARING ONE. `src/` BAKES archive figures and the front door
        FETCHES them, so a repo one publish behind deploys pages that contradict
        the document the front door reads."""
        y = self.step("deploy.yml")
        self.assertIn("python3 tools/measures_fresh.py", y)
        self.assertNotIn("measures_fresh.py --report", y,
                         "a deploy may not soften this: nothing reaches a reader stale")

    def test_it_is_not_in_the_offline_gate(self):
        """⚠️ DELIBERATE. `npm run gates` must run with no network, and a check
        that passes when it cannot fetch is a check that cannot fail."""
        gates = json.loads((ROOT / "package.json").read_text())["scripts"]["gates"]
        self.assertNotIn("measures_fresh", gates)


if __name__ == "__main__":
    unittest.main()
