"""⭐⭐⭐ EVERY FIGURE ON THE SITE HAS A DOOR TO ITS WORK.

Kevin's standing rule is not "most figures": a reader who finds one naked number
has learned that "check our work" is decorative. On 24 September 2026 three pages
printed measured figures and carried ZERO doors between them, while the preview
card had carried one per figure since the day before.

⭐ WHICH THREE, MEASURED RATHER THAN LISTED. Every placeholder `_archive()`
publishes was replaced with a unique marker, the site rebuilt and the built pages
grepped: `what-you-can-see.html` 17, `index.html` 14 (one of which is the size of
the archive), `slot.html` 7. The other five rule pages print none — the fact that
killed the first dispersion plan, which had been recommended on a `len()` of a
dict whose keys were a drawing's.

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

def page(name):
    return (ROOT / "src" / name).read_text(encoding="utf-8")


LEARN = page("what-you-can-see.html")
FRONT = page("index.html")
SLOT = page("slot.html")


class WorkDoors(unittest.TestCase):

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
            r'<p class="cw"><a href="([^"]+)">', LEARN))
        self.assertEqual(found, expected)

        # ⛔ AND NO CARD OUTSIDE THAT SET CARRIES ONE. A door under a card that
        # prints no figure sends a reader to work that explains nothing they
        # just read.
        all_doors = re.findall(r'<p class="cw"><a href="([^"]+)">', LEARN)
        self.assertEqual(len(all_doors), len(expected),
                         "a door was rendered under a card that prints no figure")

    def test_the_front_door_and_the_rule_page_carry_theirs_too(self):
        """The other two surfaces, recomputed from their own copy.

        ⭐ THE FRONT-DOOR STRIP IS ALL FIGURES. Every tile in it states a
        measurement -- that is what the strip is -- so unlike the learn grid
        there is no unwrapped case, and a tile without a door is a miss rather
        than a card that happens to print none.

        ⭐⭐ AND `slot.html` CARRIES TWO, one under the lede and one under the
        drawing, because it prints two different measurements: how often a shot
        from the slot goes in, and how many attempts are taken from there. Two
        denominators, one noun. A single door at the foot of the page could only
        have been right about one of them.

        MUTATION: drop the wrapper from `_front_counts` and the first assertion
        names the shortfall; delete either `__RULE_WORK_*__` from RULE_BODY and
        the second does.
        """
        front = re.findall(r'<p class="cw"><a href="([^"]+)">', FRONT)
        want = [B._how_door(line, cid) for cid, line in B.FRONT_COUNTS]
        self.assertTrue(all(want), "a tile in the measurement strip states no figure")
        self.assertEqual(front, want)

        slot = re.findall(r'<p class="cw"><a href="([^"]+)">', SLOT)
        blurb = next(b for _, c, _, b in B.LEARN_CARDS if c == "slot")
        note = B._fig_json()["slot"].get("note", "")
        self.assertEqual(slot, [B._how_door(blurb, "slot"), B._how_door(note, "slot")])
        self.assertEqual(len(set(slot)), 2,
                         "both doors on the slot page lead to the same derivation, "
                         "and the page prints two different measurements")

        # ⛔ AND THE FIVE RULE PAGES THAT PRINT NOTHING CARRY NOTHING. A door on
        # a page with no figure sends a reader to work that explains nothing
        # they just read.
        for cid in sorted(B._fig_json()):
            if cid == "slot":
                continue
            self.assertNotIn('class="cw"', page(f"{cid}.html"),
                             f"{cid}.html prints no figure and carries a work door")

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
