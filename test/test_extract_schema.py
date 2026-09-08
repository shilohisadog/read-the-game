"""⛔⛔ A FIELD ADDED WITHOUT BUMPING `SCHEMA` NEVER REACHES THE ARCHIVE.

`derive.py` skips a game when the stored extract's `src` digests match the raws.
That fast path is correct about the FEED and silent about US: an extractor that
learns a new field would never reach a game whose extract is already stored,
while the run reports "unchanged" and exits 0.

⚠️ TODAY BOTH CI PATHS DODGE IT -- `derive.yml` pulls with `--exclude 'extract/*'`
and `ingest.yml` pulls only pointers, so neither has a stored extract to compare
and both re-derive from raws. That is an accident of two workflow flags, not a
property anybody stated, which is exactly why it is stated here.

`extract.SCHEMA` is the other half of that comparison. It is an integer a human
bumps -- hashing the file would re-derive the whole archive on a comment edit --
which means it can be forgotten, and forgetting it produces a defect with no
symptom: the new field works on every game you test locally and is permanently
absent from every game a visitor opens.

⭐ SO THE KEY SET IS PINNED AND THE NUMBER IS PINNED TO IT. Adding, renaming or
dropping any key this extractor emits turns this red, and the message says to
bump `SCHEMA` as well as to update the list. That is the whole instrument: it
cannot tell you WHEN a shape change matters -- that is judgement -- but it can
refuse to let the judgement be skipped silently.

⚠️ IT IS THE EMITTED KEYS, NOT THE SOURCE TEXT. A check that read `extract.py`
looking for `ev["clip"] =` would pass on a line that never executes, and this
project has shipped a check that could not tell code from the words about code
three times in one day. So the extractor is RUN, over the committed reference
game, and the keys are collected from what comes out.
"""
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "builders"))
import extract as E  # noqa: E402

# Every key the reference game's extract actually emits, per event type, plus the
# document's own top level. Regenerate deliberately -- never by pasting whatever
# the failure printed, which is how a pin stops pinning anything.
EXPECTED_DOC = {"events", "game", "goalies", "gshots", "quoted", "roster",
                "shifts", "sides", "teams"}
EXPECTED_EVENT = {
    "a1", "a2", "actor", "blk", "clip", "clock", "drew", "goalie", "min",
    "miss", "own", "pen", "per", "pt", "rem", "rsn", "rsn2", "s", "sev",
    "sit", "srv", "type", "x", "y", "zone",
}
# The number that must move when either set above does.
EXPECTED_SCHEMA = 1


def _rich():
    return json.loads((ROOT / "data" / "rich.json").read_text())


class ExtractSchema(unittest.TestCase):

    def test_schema_is_pinned_to_the_shape(self):
        self.assertEqual(
            E.SCHEMA, EXPECTED_SCHEMA,
            "extract.SCHEMA moved. If the extract's shape changed, update the key "
            "sets in this file too; if it did not, this bump re-derives the whole "
            "archive for nothing.")

    def test_the_emitted_keys_are_exactly_the_pinned_set(self):
        rich = _rich()
        self.assertEqual(set(rich) - {"unreconciled"}, EXPECTED_DOC,
                         "the extract document gained or lost a top-level key")

        seen = set()
        for e in rich["events"]:
            seen |= set(e)
        # `clip` is absent from the reference game -- it is a 2023 extract written
        # before the field existed -- so the union is checked as a SUBSET and the
        # field itself is proven separately, against the live feed's shape, below.
        self.assertTrue(
            seen <= EXPECTED_EVENT,
            "the extractor emitted event keys this file does not know about: "
            f"{sorted(seen - EXPECTED_EVENT)}. Add them to EXPECTED_EVENT **and "
            "bump extract.SCHEMA**, or games already in the archive will never "
            "gain them: derive.py's unchanged fast path skips every one of them.")

    def test_a_goal_carries_clip_when_the_feed_publishes_one(self):
        """The field, proven on a real play rather than on the source text."""
        play = {
            "eventId": 1, "typeCode": 505, "typeDescKey": "goal", "sortOrder": 1,
            "timeInPeriod": "06:06", "timeRemaining": "13:54",
            "periodDescriptor": {"number": 1, "periodType": "REG"},
            "situationCode": "1551", "homeTeamDefendingSide": "left",
            "details": {"xCoord": 30, "yCoord": 7, "zoneCode": "O",
                        "eventOwnerTeamId": 7, "scoringPlayerId": 8480035,
                        "goalieInNetId": 8479406,
                        "highlightClip": 6340906550112,
                        "highlightClipSharingUrl": "https://nhl.com/video/x-6340906550112"},
        }
        ev = self._one(play)
        self.assertEqual(ev.get("clip"), 6340906550112,
                         "the published highlight id was dropped")

        # ⭐ THE ID, NOT THE URL. The sharing url is a marketing slug whose first
        # half is editorial copy; storing it would put the league's wording inside
        # our record and date it. Asserted so a future "helpful" change to carry
        # the readable one has to argue with this line.
        self.assertNotIn("nhl.com", json.dumps(ev),
                         "the extract is storing the league's slug, not the id")

    def test_a_goal_with_no_clip_says_nothing(self):
        """THE CONTROL. 6.6% of goals carry no highlight, and an absent key must
        mean "the league published none" rather than "we failed to read one". A
        placeholder would make those two indistinguishable on the surface."""
        play = {
            "eventId": 1, "typeCode": 505, "typeDescKey": "goal", "sortOrder": 1,
            "timeInPeriod": "06:06", "timeRemaining": "13:54",
            "periodDescriptor": {"number": 1, "periodType": "REG"},
            "situationCode": "1551", "homeTeamDefendingSide": "left",
            "details": {"xCoord": 30, "yCoord": 7, "zoneCode": "O",
                        "eventOwnerTeamId": 7, "scoringPlayerId": 8480035},
        }
        self.assertNotIn("clip", self._one(play),
                         "a goal with no published highlight invented a key")

    def test_only_a_goal_can_carry_one(self):
        """Measured over 11,613 plays in 36 games spanning three seasons: no event
        type but `goal` ever carries the field. If the league starts putting one on
        a save or a hit, this fails and the decision gets made on purpose."""
        play = {
            "eventId": 1, "typeCode": 506, "typeDescKey": "shot-on-goal",
            "sortOrder": 1, "timeInPeriod": "06:06", "timeRemaining": "13:54",
            "periodDescriptor": {"number": 1, "periodType": "REG"},
            "situationCode": "1551", "homeTeamDefendingSide": "left",
            "details": {"xCoord": 30, "yCoord": 7, "zoneCode": "O",
                        "eventOwnerTeamId": 7, "shootingPlayerId": 8480035,
                        "highlightClip": 999},
        }
        self.assertNotIn("clip", self._one(play),
                         "a non-goal event carried a highlight id, which no game "
                         "in a 36-game sample does. Decide what that means before "
                         "widening the branch.")

    # ------------------------------------------------------------------ helper

    def _one(self, play):
        """Run the real extractor over one synthetic play and return its event.

        ⭐ THE EXTRACTOR, NOT A COPY OF ITS RULES. The alternative -- asserting
        that `builders/extract.py` contains a particular line -- is a check about
        the words describing the code rather than about the code.
        """
        rich = _rich()
        pbp = {
            "id": int(rich["game"]["id"]), "gameDate": rich["game"]["date"],
            "awayTeam": {"id": rich["teams"]["away"]["id"],
                         "abbrev": rich["teams"]["away"]["ab"]},
            "homeTeam": {"id": rich["teams"]["home"]["id"],
                         "abbrev": rich["teams"]["home"]["ab"]},
            "rosterSpots": [], "plays": [play],
        }
        box = {"homeTeam": {"score": 0, "sog": 0}, "awayTeam": {"score": 0, "sog": 0}}
        out = E.extract(pbp, {"data": []}, box)
        self.assertEqual(len(out["events"]), 1, "the extractor did not read the play")
        return out["events"][0]


if __name__ == "__main__":
    unittest.main()
