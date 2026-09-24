"""⭐⭐⭐ EVERY FIGURE ON `what-you-can-see.html` HAS A DOOR TO ITS WORK.

Kevin's standing rule is not "most figures": a reader who finds one naked number
has learned that "check our work" is decorative. On 24 September 2026 that page
printed 17 measured figures and carried ZERO doors, while the preview card had
carried one per figure since the day before.

⛔ THE CHECK RUNS FROM THE DATA TO THE BYTES, in both directions. The builder
decides a card's door from the TOKENS in its unsubstituted copy, and this
recomputes that decision and requires the built page to match it exactly — a card
that should carry a door and does not, and a card that carries one it should not.
A test that only counted doors would pass a page with six of them on the wrong
six cards.

⚠️ AND IT IS A DIFFERENT QUESTION FROM `test/methods.test.js`, which asks whether
the door LANDS. Both are needed: a door that resolves to a real section can still
be on the wrong card, and a door on the right card can point at nothing.
"""
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "builders"))
import build_index as B                                     # noqa: E402

PAGE = (ROOT / "src" / "what-you-can-see.html").read_text(encoding="utf-8")


class LearnDoors(unittest.TestCase):

    def test_every_published_figure_names_a_derivation(self):
        """A token the reducers publish and nobody claimed is a naked number.

        MUTATION: delete any entry from FIGURE_DERIVATION and the build itself
        stops -- this is the same claim asserted where it can be read.
        """
        arch = B._archive()
        self.assertTrue(len(arch) >= 20, f"only {len(arch)} figures published")
        missing = sorted(t for t in arch if t not in B.FIGURE_DERIVATION)
        self.assertEqual(missing, [], "published with no derivation named for it")
        # ⭐ AND EVERY NAMED DERIVATION IS ONE THE METHODS PAGE CAN EXPLAIN. A
        # typo here would write a door to a section that does not exist, which
        # the JavaScript round trip catches -- but it catches it in the rendered
        # page, and this says which TABLE ENTRY is wrong.
        js = (ROOT / "src" / "lib" / "methods.js").read_text(encoding="utf-8")
        for token, key in B.FIGURE_DERIVATION.items():
            if key is None:
                continue
            self.assertTrue(
                re.search(rf"^  {re.escape(key)}: {{", js, re.M),
                f"{token} names `{key}` and methods.js defines no such entry")

    def test_the_built_page_carries_exactly_the_doors_the_figures_ask_for(self):
        """Recomputed from the cards' copy, then compared with the bytes on disk.

        MUTATION: drop the `work` branch from the card loop and the built page
        loses six doors; point one card at another card's derivation and the
        `expected` mapping disagrees.
        """
        expected = {}
        for _kind, cid, _title, blurb in B.LEARN_CARDS:
            door = B._how_door(blurb, cid)
            if door:
                expected[cid] = door
        self.assertTrue(len(expected) >= 6,
                        f"only {len(expected)} cards print a figure — the map is not being read")

        # The wrapper holds the card and its door, so the pairing is read out of
        # the markup rather than assumed from document order.
        found = dict(re.findall(
            r'<div class="cardw"><a class="card" id="([^"]+)"[\s\S]*?'
            r'<p class="cw"><a href="([^"]+)">', PAGE))
        self.assertEqual(found, expected)

        # ⛔ AND NO CARD OUTSIDE THAT SET CARRIES ONE. A door under a card that
        # prints no figure sends a reader to work that explains nothing they
        # just read.
        all_doors = re.findall(r'<p class="cw"><a href="([^"]+)">', PAGE)
        self.assertEqual(len(all_doors), len(expected),
                         "a door was rendered under a card that prints no figure")

    def test_a_card_printing_two_measurements_stops_the_build(self):
        """One card cannot carry one door to two derivations.

        ⭐ THE FAILURE IS A DECISION, NOT A RENDER. A card whose copy came to
        print both the slot conversion and the pace needs two links and a
        sentence saying which is which; picking the first silently would send
        every reader of the second figure to the wrong explanation.
        """
        with self.assertRaises(SystemExit) as cm:
            B._how_door("it takes __ZONE_ATK__ against __SHIFT_MED__", "invented")
        self.assertIn("one card cannot carry one door to two", str(cm.exception))

        with self.assertRaises(SystemExit) as cm:
            B._how_door("we measured __NOBODY_CLAIMED_THIS__", "invented")
        self.assertIn("needs a door to its work", str(cm.exception))

        self.assertIsNone(B._how_door("no figures at all here", "invented"))
        self.assertIsNone(B._how_door("over __ARCHIVE_GAMES__ games", "invented"),
                          "the size of the archive is not a measurement about hockey")


if __name__ == "__main__":
    unittest.main()
