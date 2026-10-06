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
# ⚠️ KEYS THAT ARE ABSENT WHEN THE FACT IS ABSENT, which is this extractor's
# standing convention: no key means the league published none, and a null would
# make that indistinguishable from a read we got wrong. They are named here
# rather than folded into a subset check, because a subset check would also
# accept a key nobody has ever heard of.
#   recap          the whole-game video; needs the `right-rail` raw, which the
#                  reference game predates. Proven separately, below.
#   unreconciled   a game whose own arithmetic did not close.
EXPECTED_DOC_OPTIONAL = {"recap", "unreconciled"}
EXPECTED_EVENT = {
    "a1", "a2", "actor", "blk", "clip", "clock", "drew", "goalie", "min",
    "miss", "own", "pen", "per", "pt", "rem", "rsn", "rsn2", "s", "sev",
    "sit", "srv", "type", "x", "y", "zone",
}
# The number that must move when either set above does.
EXPECTED_SCHEMA = 4


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
        self.assertEqual(set(rich) - EXPECTED_DOC_OPTIONAL, EXPECTED_DOC,
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

    # ------------------------------------------------- the whole-game recap

    def _doc(self, rail):
        """The extractor's document for a minimal game, with a given rail feed."""
        rich = _rich()
        pbp = {
            "id": int(rich["game"]["id"]), "gameDate": rich["game"]["date"],
            "awayTeam": {"id": rich["teams"]["away"]["id"],
                         "abbrev": rich["teams"]["away"]["ab"]},
            "homeTeam": {"id": rich["teams"]["home"]["id"],
                         "abbrev": rich["teams"]["home"]["ab"]},
            "rosterSpots": [], "plays": [],
        }
        box = {"homeTeam": {"score": 0, "sog": 0}, "awayTeam": {"score": 0, "sog": 0}}
        return E.extract(pbp, {"data": []}, box, rail)

    def test_the_recap_is_read_from_the_rail_feed_and_absent_without_one(self):
        """⭐ THE SHAPE IS THE LEAGUE'S, taken from a real response on 2026-09-30:
        `/v1/gamecenter/{id}/right-rail` answers with a `gameVideo` block holding
        `threeMinRecap`. No other endpoint carries one -- `landing` and `boxscore`
        were both checked and have no such key.

        ⛔ AND THE THREE ABSENCES ARE ONE BEHAVIOUR, not three. No feed at all (an
        archived game, which is every game before today), a feed with no video
        block, and a block with no recap in it must each leave the key OFF rather
        than set it to None -- `clip`'s rule, for `clip`'s reason: a placeholder
        cannot be told apart from a read that failed.
        """
        self.assertEqual(
            self._doc({"gameVideo": {"threeMinRecap": 6398427047112}}).get("recap"),
            6398427047112, "the recap id did not survive the extractor")

        for label, rail in (("no rail feed", None),
                            ("no gameVideo block", {"linescore": {}}),
                            ("gameVideo with no recap", {"gameVideo": {"condensedGame": 1}})):
            self.assertNotIn("recap", self._doc(rail),
                             f"{label}: the key is present, so absence and failure "
                             "cannot be told apart")

    def test_the_final_horn_reports_the_ice_as_the_last_play_left_it(self):
        """⛔⛔⛔ THE FEED'S SITUATION CODE ON `game-end` IS NOT A SITUATION.

        It is whatever the sheet looked like after the whistle. Measured
        2026-09-30 over 25 games: it disagrees with the last play in 13, and the
        values include `0101` and `1010`, which are not hockey.

        Read literally, `0440` says both goaltenders are pulled and the sheet is
        four a side. On the FLA-CAR opener that put "FLA has pulled the goaltender
        for an extra attacker. CAR has pulled the goaltender for an extra
        attacker." under the rink, and labelled a 3-on-3 overtime
        "Overtime · 4-on-4" -- reading the 4s out of an artifact. Kevin found both
        from the live site within an hour of the horn becoming a frame.

        ⚠️ THE LAST PLAY, NOT THE LAST EVENT. A `period-end` disagrees with the
        play before it in 15 of 88 sampled periods, and often legitimately -- a
        period really can end with a goaltender pulled. Walking back over
        `PLAYABLE_SKIP` keeps the real empty net and steps over the artifacts.

        MUTATION: inherit from `events[-1]` instead and the second case below
        fails, because it would take the period-end's code rather than the play's.
        """
        rich = _rich()
        def play(t, sit, **kw):
            d = {"typeDescKey": t, "situationCode": sit, "periodDescriptor":
                 {"number": 4, "periodType": "OT"}, "timeRemaining": "00:05",
                 "timeInPeriod": "04:55", "details": {}}
            d.update(kw)
            return d
        pbp = {
            "id": int(rich["game"]["id"]), "gameDate": rich["game"]["date"],
            "awayTeam": {"id": rich["teams"]["away"]["id"],
                         "abbrev": rich["teams"]["away"]["ab"]},
            "homeTeam": {"id": rich["teams"]["home"]["id"],
                         "abbrev": rich["teams"]["home"]["ab"]},
            "rosterSpots": [],
            "plays": [play("hit", "1331"),
                      play("period-end", "1331"),
                      play("game-end", "0440")],
        }
        box = {"homeTeam": {"score": 0, "sog": 0}, "awayTeam": {"score": 0, "sog": 0}}
        out = E.extract(pbp, {"data": []}, box)
        horn = out["events"][-1]
        self.assertEqual(horn["type"], "game-end", "the fixture did not reach the horn")
        self.assertEqual(
            horn["sit"], "1331",
            "the horn is still reporting the feed's after-the-whistle code, so the "
            "page will say both goaltenders were pulled and call 3-on-3 overtime "
            "4-on-4")

        # ⭐ AND IT STEPS OVER A PERIOD-END THAT CARRIES ITS OWN ODD CODE, which
        # is what makes "the last PLAY" the rule rather than "the last event".
        pbp["plays"] = [play("shot-on-goal", "1551"),
                        play("period-end", "0651"),
                        play("game-end", "1010")]
        horn = E.extract(pbp, {"data": []}, box)["events"][-1]
        self.assertEqual(horn["sit"], "1551",
                         "the horn inherited the period-end's code instead of the "
                         "last play's")

        # ⛔ A REAL EMPTY NET SURVIVES, because the PLAY itself carried it. A fix
        # that scrubbed pulled goaltenders would be a different defect wearing
        # this one's clothes.
        pbp["plays"] = [play("shot-on-goal", "0651"),
                        play("game-end", "0440")]
        horn = E.extract(pbp, {"data": []}, box)["events"][-1]
        self.assertEqual(horn["sit"], "0651",
                         "a game that ended with the net empty no longer says so")

    def test_a_recap_never_widens_the_document(self):
        """⚠️ THE PIN HAS TO SEE IT. `recap` is the first top-level key added since
        this file was written, and the check it has to pass is the one that would
        have caught it being spelled wrong: the document's keys are still exactly
        the pinned set plus the named optionals, with a recap present.
        """
        doc = self._doc({"gameVideo": {"threeMinRecap": 1}})
        self.assertIn("recap", doc)
        self.assertEqual(set(doc) - EXPECTED_DOC_OPTIONAL, EXPECTED_DOC,
                         "adding the recap changed the document's shape elsewhere")


if __name__ == "__main__":
    unittest.main()


# ---------------------------------------------------------------------------
# ⭐⭐⭐ THE SECOND WITNESS — the league's own per-team totals, 2026-10-06.
#
# Kevin: *"it looks we can 'check our work' against league published
# information, we'll need to figure that out and integrate it into our 'check
# our work'"*, and then, on whether a disagreement reaches the reader:
# *"concur, full transparency always."*
#
# Measured first, over 40 published games (ten from each season): `hits`,
# `giveaways`, `takeaways`, `faceoffWins` and `pim` reproduce from our event log
# EXACTLY -- 80 of 80 team-sides -- and `blockedShots` does too, but only once it
# is read the way the league credits it.
# ---------------------------------------------------------------------------

HOME, AWAY = 1, 2
RAIL = {"teamGameStats": [
    {"category": "hits", "awayValue": 1, "homeValue": 1},
    {"category": "giveaways", "awayValue": 0, "homeValue": 1},
    {"category": "takeaways", "awayValue": 1, "homeValue": 0},
    {"category": "pim", "awayValue": 2, "homeValue": 0},
    # ⚠️ THE LEAGUE MIXES TYPES IN ONE COLUMN: an int for hits, `won/total` for
    # faceoffs, in the same list of the same shape.
    {"category": "faceoffWins", "awayValue": "1/3", "homeValue": "2/3"},
    {"category": "blockedShots", "awayValue": 1, "homeValue": 0},
    # Published and deliberately NOT quoted — see `QUOTED_TEAM`.
    {"category": "powerPlay", "awayValue": "0/1", "homeValue": "1/2"},
    {"category": "faceoffWinningPctg", "awayValue": 0.333, "homeValue": 0.667},
]}


def _play(t, own, clock, **d):
    mm, ss = clock.split(":")
    left = f"{19 - int(mm):02d}:{(60 - int(ss)) % 60:02d}"
    return {"typeDescKey": t, "periodDescriptor": {"number": 1, "periodType": "REG"},
            "timeInPeriod": clock, "timeRemaining": left,
            "details": {"eventOwnerTeamId": own, **d}}


def _game(plays, roster):
    return {"id": 2026020001, "gameDate": "2026-10-06",
            "awayTeam": {"id": AWAY, "abbrev": "AAA"},
            "homeTeam": {"id": HOME, "abbrev": "HHH"},
            "rosterSpots": [{"playerId": pid, "teamId": tid, "sweaterNumber": pid,
                             "firstName": {"default": "A"}, "lastName": {"default": f"P{pid}"},
                             "positionCode": "C"} for pid, tid in roster.items()],
            "plays": plays}


# 10 and 11 play at home, 20 and 21 away.
ROSTER = {10: HOME, 11: HOME, 20: AWAY, 21: AWAY}
PLAYS = [
    _play("hit", HOME, "01:00", hittingPlayerId=10),
    _play("hit", AWAY, "02:00", hittingPlayerId=20),
    _play("giveaway", HOME, "03:00", playerId=10),
    _play("takeaway", AWAY, "04:00", playerId=20),
    _play("faceoff", HOME, "05:00", winningPlayerId=10, losingPlayerId=20),
    _play("faceoff", HOME, "06:00", winningPlayerId=11, losingPlayerId=21),
    _play("faceoff", AWAY, "07:00", winningPlayerId=20, losingPlayerId=10),
    # A HOME shot an AWAY body stopped: the league credits AWAY with the block.
    _play("blocked-shot", HOME, "08:00", shootingPlayerId=10, blockingPlayerId=20),
    # ⭐ AND A HOME shot stopped by a HOME man. The league credits NOBODY, which
    # is the whole reason this figure needed a definition before it agreed.
    _play("blocked-shot", HOME, "09:00", shootingPlayerId=10, blockingPlayerId=11),
    _play("penalty", AWAY, "10:00", committedByPlayerId=20, duration=2,
          descKey="tripping", typeCode="MIN"),
]
BOX = {"homeTeam": {"id": HOME, "score": 0, "sog": 0},
       "awayTeam": {"id": AWAY, "score": 0, "sog": 0}}


class SecondWitness(unittest.TestCase):

    def _run(self, rail=RAIL, plays=PLAYS):
        pbp = _game(plays, ROSTER)
        rich = E.extract(pbp, {"data": []}, BOX, rail)
        fails, notes = E.validate(rich, pbp, {"data": []}, BOX, rail)
        return rich, fails, notes

    def test_the_leagues_team_totals_are_copied_and_not_computed(self):
        """⭐ `quoted` gains them under their OWN `src`, because they come from a
        different document than the score and the shots. One `src` over both
        would be a label that is false about half of what it names."""
        rich, _, _ = self._run()
        team = rich["quoted"]["team"]
        self.assertEqual(team["src"], "right-rail.teamGameStats")
        self.assertEqual(rich["quoted"]["src"], "boxscore",
                         "the boxscore block must keep saying where IT came from")
        self.assertEqual(team["home"],
                         {"hits": 1, "giveaways": 1, "takeaways": 0, "pim": 0,
                          "faceoffWins": 2, "blocked": 0})
        self.assertEqual(team["away"]["faceoffWins"], 1,
                         "'1/3' is one faceoff won, not the string and not three")

    def test_a_figure_we_do_not_derive_is_not_quoted(self):
        """⛔ A WITNESS NOBODY CROSS-EXAMINES IS DECORATION. `powerPlay` arrives
        as goals-over-opportunities and we derive neither as a pair, so quoting
        it would put a number on the artifact that nothing ever checks."""
        rich, _, _ = self._run()
        for absent in ("powerPlay", "faceoffWinningPctg"):
            self.assertNotIn(absent, rich["quoted"]["team"]["home"])

    def test_agreement_is_silent(self):
        """The fixture is built to agree, so nothing is recorded. A note that
        appears on a game where the two documents agree is a sentence a reader
        learns to skip."""
        _, _, notes = self._run()
        self.assertEqual([n for n in notes if n["kind"] != "sog"], [])

    def test_a_blocked_shot_is_credited_to_the_OPPONENT_who_stopped_it(self):
        """⛔⛔ THE DEFINITION THE MEASUREMENT FOUND. Over 40 games, counting every
        blocked-shot event to the blocking player's team matches the league in 3
        of 40; counting to the SHOOTER's team matches in 0. The league credits a
        block only to an opponent, and a puck that hits one of the shooter's own
        men is in nobody's total -- 125 of those in 40 games, about three a night.

        The fixture holds exactly that pair: one HOME shot blocked by AWAY, and
        one HOME shot blocked by HOME. The league says away 1, home 0.
        MUTATION: count the teammate block to either side and this fires."""
        _, _, notes = self._run()
        self.assertEqual([n for n in notes if n["kind"] == "blocked"], [],
                         "the teammate block was credited to somebody")

    def test_a_disagreement_is_RECORDED_and_never_refuses_the_game(self):
        """⚠️ THIS FILE'S OWN RULE: refuse on what WE could have got wrong, record
        what the LEAGUE got wrong. A team total disagreeing with the event log is
        a disagreement between two of the league's documents -- and we replay the
        event log, so withholding the game would hide one we can show faithfully.
        """
        bent = json.loads(json.dumps(RAIL))
        for st in bent["teamGameStats"]:
            if st["category"] == "hits":
                st["homeValue"] = 9
        _, fails, notes = self._run(rail=bent)
        hits = [n for n in notes if n["kind"] == "hits"]
        self.assertEqual(len(hits), 1, "the disagreement was not recorded")
        self.assertEqual(hits[0]["home"], {"ours": 1, "league": 9})
        self.assertEqual(hits[0]["away"], {"ours": 1, "league": 1},
                         "the agreeing side is carried too, so a page can say which differs")
        self.assertEqual(hits[0]["src"], "right-rail.teamGameStats",
                         "the note says which document, so no renderer has to guess")
        self.assertEqual([f for f in fails if "hits" in f], [],
                         "a league disagreement must never refuse the game")

    def test_no_rail_means_no_witness_rather_than_a_false_one(self):
        """⛔ EVERY GAME IN THE ARCHIVE BEFORE THE RAIL FEED HAS NONE, and a
        missing witness must leave the key off -- `clip`'s rule, for `clip`'s
        reason: a placeholder cannot be told from a read that failed."""
        for rail in (None, {}, {"teamGameStats": []}):
            rich, _, notes = self._run(rail=rail)
            self.assertNotIn("team", rich["quoted"], f"{rail!r} invented a witness")
            self.assertEqual([n for n in notes if n["kind"] != "sog"], [])

    def test_half_a_document_is_not_quoted_at_all(self):
        """A game quoted for one side only would give a page the league's figure
        for one team and nothing for the other, which reads as a claim about the
        team that is missing."""
        half = {"teamGameStats": [{"category": "hits", "homeValue": 1}]}
        rich, _, _ = self._run(rail=half)
        self.assertNotIn("team", rich["quoted"])
