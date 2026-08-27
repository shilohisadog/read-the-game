#!/usr/bin/env python3
"""The extractor: raw NHL feeds -> data/rich.json.

This did not exist. `rich.json` was an orphan artifact that nobody could
regenerate -- the same defect as the app having no builder (docs/main-app-rework.md
F5), one level up, and nobody had noticed because the data looked fine. Every
field the original extraction dropped was unrecoverable, which is why the clock
shows elapsed time and why we cannot tell a power play from a pulled goalie.

Three modes, and the distinction between the first two is the whole point:

  --verify    Does this reproduce data/rich.json byte-for-byte?
              Proves we UNDERSTAND the extract. Proves nothing about whether the
              extract is CORRECT -- it will faithfully reproduce any error already
              baked in, exactly as `own` faithfully carried a field whose meaning
              nobody had checked. Necessary, insufficient. (CHENG)

  --validate  Independent checks against the raw feed and the boxscore, on their
              own terms. This is the pass that can say the extract is right.

  --vocab     Report the feed vocabulary and flag anything unrecognised. One game
              looks complete when it is not: `tv-timeout` appeared only as a
              secondaryReason here and is a primary reason in 2025-26. Treat an
              unknown situationCode exactly like an unknown typeDescKey.

  (no flag)   Write data/rich.json.

    python3 builders/extract.py --verify
"""
import argparse, hashlib, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
GAME = "2023020204"

# ---------------------------------------------------------------- extraction

# Which raw detail field is "the player this event is about", per event type.
# Derived empirically against the committed extract; anything absent here yields
# a null actor, which is how the original extraction behaved.
ACTOR = {
    "faceoff":       "winningPlayerId",
    "shot-on-goal":  "shootingPlayerId",
    "missed-shot":   "shootingPlayerId",
    "blocked-shot":  "shootingPlayerId",   # the SHOOTER -- see src/lib/attribution.js
    "goal":          "scoringPlayerId",
    "hit":           "hittingPlayerId",
    "failed-shot-attempt": "shootingPlayerId",   # a shootout attempt that missed
    "penalty":       "committedByPlayerId",
}

# NOTE: still dropped, deliberately, pending a decision on what needs them:
#   shotType, losingPlayerId, hitteePlayerId, running awaySOG/homeSOG, and
#   zoneCode on events other than penalties. Raw feeds are archived, so nothing
#   is lost -- but re-extracting a season is not free, so these are worth
#   deciding on rather than defaulting.
#
# DECIDED 2026-08-18 and no longer dropped: the stoppage detail (reason,
# secondaryReason -- carried as `rsn`/`rsn2` since the whistle layer) and the
# penalty detail (descKey, duration, typeCode, drawnByPlayerId, zoneCode), for
# the penalty box. Kevin ruled boxes in and benches out.

def _secs(period, mmss):
    """timeInPeriod is ELAPSED, not remaining."""
    m, s = mmss.split(":")
    return (period - 1) * 1200 + int(m) * 60 + int(s)

def _norm(x, y, side):
    """Teams switch ends each period; undo it so HOME always defends -x."""
    if x is None:
        return None, None
    return (-x, -y) if side == "right" else (x, y)

def extract(pbp, shifts, box=None):
    home, away = pbp["homeTeam"], pbp["awayTeam"]

    roster = {}
    for s in pbp["rosterSpots"]:
        roster[str(s["playerId"])] = {
            "n": s["sweaterNumber"],
            "nm": s["lastName"]["default"],
            "pos": s["positionCode"],
            "tid": s["teamId"],
        }

    events, gshots, goalies = [], [], []
    seen_sides = {}
    for p in pbp["plays"]:
        d = p.get("details") or {}
        per = p["periodDescriptor"]["number"]
        x, y = _norm(d.get("xCoord"), d.get("yCoord"), p.get("homeTeamDefendingSide"))
        t = p["typeDescKey"]
        if p.get("homeTeamDefendingSide"):
            seen_sides.setdefault(per, set()).add(p["homeTeamDefendingSide"])

        ev = {
            "per": per,
            "s": _secs(per, p["timeInPeriod"]),
            "clock": p["timeInPeriod"],
            # The broadcast clock counts DOWN. `clock` is elapsed, which is what
            # the feed calls timeInPeriod and what the app was wrongly showing.
            # Stored, not derived: the feed is authoritative and period lengths
            # differ (regulation 20:00, regular-season OT 5:00).
            "rem": p["timeRemaining"],
            "type": t,
            "own": d.get("eventOwnerTeamId"),
            "x": x,
            "y": y,
            "actor": d.get(ACTOR[t]) if t in ACTOR else None,
            "goalie": d.get("goalieInNetId"),
            # [awayGoalie][awaySkaters][homeSkaters][homeGoalie]. The ONLY honest
            # way to tell even strength from a power play from a pulled goalie --
            # all three look identical without it, and 12 of MIN's 80 attempts in
            # this game came 6-on-5 with their own net empty.
            "sit": p.get("situationCode"),
            # THE PERIOD NUMBER IS NOT ENOUGH, and the season proved it. Period 5
            # is a shootout in the regular season and a third overtime in the
            # playoffs, so nothing downstream could tell them apart -- and a
            # shootout is not play. Six of 62 sampled games reached one, carrying
            # 8 `goal` events and 36 shot-like events inside the shootout period
            # that every metric would otherwise have counted as real hockey.
            "pt": p["periodDescriptor"].get("periodType"),
        }
        # WHY THE WHISTLE WENT. 16% of a game's events are stoppages, and until
        # now the extract kept the stoppage and threw away the only field it
        # carries -- so every layer could say "play stopped" and nothing more.
        #
        # This is the one thing on a stoppage that is NOT reconstructible from
        # anything else we hold, which is exactly the test for whether a field
        # belongs in the extract (docs/architecture.md 4.5). Measured over 30 real
        # games: 240 icings, 125 offsides, 433 goalie freezes.
        #
        # `secondaryReason` is carried separately when it differs -- a TV timeout
        # rides along 208 times in those 30 games, and it is the difference
        # between a whistle and a two-minute break. Dropping it would mean never
        # being able to explain a long one.
        if t == "stoppage":
            if d.get("reason"):
                ev["rsn"] = d["reason"]
            if d.get("secondaryReason") and d["secondaryReason"] != d.get("reason"):
                ev["rsn2"] = d["secondaryReason"]
        # WHY IT MISSED, WHICH IS THE SAME EVENT AT A FINER RESOLUTION.
        #
        # `missed-shot` is the league's own typeDescKey: a shot that did not force
        # the goalie to play the puck. That is the EVENT, not a category we
        # invented -- and `reason` is that same event recorded more precisely.
        # Both are `field:` provenance; neither is a `display:` claim of ours.
        #
        # THE COLLAPSE THIS FIXES. One phrase, "missed the net", was standing in
        # for six distinct outcomes and is wrong for two of them: a puck off the
        # POST did not miss the net, it hit it, and a shot recorded `short` never
        # reached the net at all. In the reference game: wide-left 14, wide-right
        # 9, above-crossbar 5, hit-left-post 1, hit-right-post 1, short 1.
        #
        # A SEPARATE KEY FROM `rsn` ON PURPOSE. A stoppage reason and a missed-shot
        # reason are different vocabularies, and `whistle.js` only reads `rsn`
        # behind a `SUBJECT.has(e.type)` gate today -- so sharing the key would be
        # safe now and a latent collision the moment that gate widens.
        if t == "missed-shot" and d.get("reason"):
            ev["miss"] = d["reason"]
        # Who blocked it. The shooter is `actor` (see attribution.js); dropping
        # the blocker lost half of every blocked-shot event.
        if t == "blocked-shot" and d.get("blockingPlayerId") is not None:
            ev["blk"] = d["blockingPlayerId"]
        # THE PENALTY, BEYOND THE FACT THAT ONE HAPPENED. `own` is the OFFENDING
        # team -- verified 8 of 8 against rosterSpots, and re-checked on every
        # game by validate() rather than trusted, because `own` is the field that
        # already meant something unexpected once (the SHOOTER on a blocked shot).
        # `actor` is the player who committed it. So the extract could say a
        # penalty happened and to whom, and nothing about what it was.
        #
        # `min` IS WHAT WAS ASSESSED, NEVER WHAT WAS SERVED, and the penalty box
        # cannot be drawn from it alone. A power-play goal ends a minor early and
        # no field on this event records that; `sit` is the only witness to when
        # a player actually came out. Nor is duration a power play -- a 10-minute
        # misconduct is box time at even strength, and a penalty shot is no box
        # time at all -- which is why `sev` comes along. Two fields, two
        # questions: `sev`/`min` say what the referee assessed, `sit` says what
        # the ice looked like, and drawing the box from either one alone puts a
        # player on screen who is not there.
        #
        # `delayed-penalty` carries the offending team and nothing else -- no
        # player, no coordinates -- so it gets whatever is present and stays
        # honest about the rest.
        if t in ("penalty", "delayed-penalty"):
            for src, dst in (("descKey", "pen"), ("duration", "min"),
                             ("typeCode", "sev"), ("drawnByPlayerId", "drew"),
                             # Bench minors and goalie penalties are served by
                             # someone other than the offender. Absent in the
                             # reference game, so carried where present rather
                             # than assumed into existence.
                             ("servedByPlayerId", "srv"), ("zoneCode", "zone")):
                if d.get(src) is not None:
                    ev[dst] = d[src]
        # giveaway/takeaway carry a playerId the original extraction discarded,
        # leaving `actor` null on 20 events for no reason.
        if t in ("giveaway", "takeaway") and d.get("playerId") is not None:
            ev["actor"] = d["playerId"]
        if t == "goal":
            if d.get("assist1PlayerId") is not None:
                ev["a1"] = d["assist1PlayerId"]
            if d.get("assist2PlayerId") is not None:
                ev["a2"] = d["assist2PlayerId"]
        events.append(ev)

        if t in ("shot-on-goal", "goal"):
            g = d.get("goalieInNetId")
            gshots.append({"g": g, "x": x, "y": y,
                           "out": "goal" if t == "goal" else "save",
                           "sh": d.get("eventOwnerTeamId")})
            if g is not None and g not in goalies:
                goalies.append(g)

    sh = [{"p": s["playerId"], "t": s["teamId"],
           "s": _secs(s["period"], s["startTime"]),
           "e": _secs(s["period"], s["endTime"])}
          for s in shifts["data"]]

    # WHICH END THE HOST DEFENDED, PERIOD BY PERIOD. This is the one fact _norm
    # consumes and then destroys: after normalization every coordinate reads as
    # though the host defended -x all night, and the feed's own record that the
    # teams changed ends is gone. It is not reconstructible from anything else we
    # hold, which is the test for belonging in the extract (docs/architecture.md
    # 4.5) -- the same test `rsn` passed.
    #
    # WHICH END THEY DEFEND FIRST IS OURS AND THAT THEY SWAP IS NOT. Period one
    # splits 7 left / 7 right across 14 raw play-by-plays, so it is arena-fixed
    # and the feed has no opinion we could be contradicting -- the app picks the
    # host's end for the television convention (build_main.py). The ALTERNATION
    # is recorded on every play, and until now we threw it away and rendered a
    # rink that never changed ends.
    #
    # RECORDED, NOT COMPUTED FROM THE PERIOD NUMBER. Parity would be a rule with
    # no source in the data -- a model wearing a UI control -- and it would be
    # unfalsifiable in exactly the games where it was wrong. A period whose plays
    # disagree gets NO entry rather than a majority vote, so a renderer can tell
    # "they swapped" from "we do not know", and validate() says how many periods
    # carry one.
    sides = {str(k): next(iter(v)) for k, v in sorted(seen_sides.items())
             if len(v) == 1}

    out = {
        # WHICH GAME THIS IS, from the feed rather than from the builder.
        # The app used to print "Nov 10 2023" as a literal, which was invisible
        # while one game was compiled into one page and becomes a wrong date on
        # every game the moment a shell renders any of them. derive adds `type`
        # and `src` on top of this; the committed reference extract carries the
        # same two fields, so both pages read one shape.
        "game": {"id": pbp.get("id"), "date": pbp.get("gameDate")},
        "teams": {"home": {"id": home["id"], "ab": home["abbrev"]},
                  "away": {"id": away["id"], "ab": away["abbrev"]}},
        "roster": roster,
        "sides": sides,
        "events": events,
        "shifts": sh,
        "gshots": gshots,
        "goalies": goalies,
    }

    # THE LEAGUE'S OWN NUMBERS, COPIED AND NOT COMPUTED.
    #
    # The score is not otherwise in here -- it is derived from events, and
    # deriving it correctly means goals in play PLUS ONE to whoever won the
    # shootout, a rule that lives in layer.js. Anything else needing a score
    # would have to reimplement that, in whatever language it happens to be
    # written in, and the two would drift into two plausible numbers with no
    # signal between them. (CHENG: quoting the authority is not a compromise
    # against having one source of truth -- it IS the source of truth, and the
    # correct direction of dependency.)
    #
    # It lives HERE rather than inside validate() as a transient so there is
    # exactly one place the league's number enters the system. `src` names where
    # it came from, on the artifact, so a reader never has to guess whether a
    # field was observed or calculated.
    if box is not None:
        out["quoted"] = {
            "src": "boxscore",
            "home": {"score": box["homeTeam"]["score"], "sog": box["homeTeam"]["sog"]},
            "away": {"score": box["awayTeam"]["score"], "sog": box["awayTeam"]["sog"]},
        }
    return out

# ---------------------------------------------------------------- vocabulary

# Everything this extractor knows how to mean. An unrecognised value is not a
# curiosity -- it is a game we must not publish until a human has looked.
KNOWN_EVENTS = {
    "period-start", "period-end", "game-end", "faceoff", "shot-on-goal", "goal",
    "missed-shot", "blocked-shot", "hit", "giveaway", "takeaway", "penalty",
    "delayed-penalty", "stoppage",
    # Both occur ONLY in shootout periods, in every occurrence observed across
    # 62 games. `shootout-complete` is a marker like period-end; a
    # failed-shot-attempt is an attempt that missed, and carries a shooter and
    # coordinates like any other. Neither is play, which is what `pt` is for.
    "shootout-complete", "failed-shot-attempt",
}
KNOWN_STOPPAGES = {
    "icing", "offside", "hand-pass", "high-stick", "puck-frozen", "goalie-stopped-after-sog",
    "puck-in-netting", "puck-in-benches", "puck-in-crowd", "puck-in-penalty-benches",
    "referee-or-linesman", "tv-timeout", "video-review", "home-timeout", "visitor-timeout",
    "player-injury", "net-dislodged-defensive-skater", "chlg-vis-goal-interference",
}
# A RULE, NOT A LIST. This was eight strings -- every situationCode one November
# game happened to contain -- and a season contains nineteen. The missing ones
# were never mysteries: 0641 is an away goalie pulled for a 6-on-4, 1331 is
# three-on-three overtime, 0440 is both goalies pulled at four aside, 0101 and
# 1010 are shootout attempts. They were "unknown" only because we had enumerated
# a sample and called it a language, which is the same mistake as FINAL_STATES
# holding one word, and as "BUF shots +x, MIN -x" before it. PIN THE RULE.
#
# The code is [awayGoalie][awaySkaters][homeSkaters][homeGoalie]. A code is
# valid if it DECODES into a coherent state, which is a bounded claim an
# unbounded list can never make: verified against 19,272 real events across 62
# games spanning preseason, regular season, overtime and shootouts, with zero
# violations.
#
# NOT YET CROSS-CHECKED AGAINST AN INDEPENDENT SOURCE. The shifts data knows who
# was actually on the ice and would settle a semantic change (a digit reorder
# would still decode). A first attempt agreed only 82% of the time, spread evenly
# across 23 of 25 games rather than concentrated in a few -- which points at the
# comparison, not the feed. Until that is understood it stays out: a gate whose
# failures cannot be explained manufactures false reds, and a false red is worse
# than no gate because it teaches distrust of a working one.
SKATERS = range(3, 7)


def situation_ok(code, period_type=None):
    """Does this situationCode decode into a state hockey can actually be in?"""
    if not isinstance(code, str) or len(code) != 4 or not code.isdigit():
        return False
    a_goalie, a_skaters, h_skaters, h_goalie = (int(c) for c in code)
    if a_goalie not in (0, 1) or h_goalie not in (0, 1):
        return False
    # ONE SHOOTER AGAINST ONE GOALIE, IN ANY PERIOD. This shape was tied to
    # periodType SO on the evidence of 62 games where it only occurred there --
    # and across the full archive it blocks 44 games in REGULATION, because it is
    # also a PENALTY SHOT. Game 2025010011 settles it: at 19:44 of the second
    # period a penalty with descKey `ps-slash-on-breakaway`, then a goal at 0101.
    #
    # A rule derived from a sample is still a sample. That is the same correction
    # as FINAL_STATES, as the eight situation codes, and as "BUF shots +x".
    #
    # Structurally identical to a shootout attempt and materially nothing like
    # one: a penalty shot happens in play, counts toward the score and counts as
    # a shot on goal. The layers key on `pt` rather than on this code, so they
    # already tell them apart.
    if {a_skaters, h_skaters} == {0, 1}:
        return True
    if period_type == "SO":
        return False    # only the one-against-one shape occurs in a shootout
    return a_skaters in SKATERS and h_skaters in SKATERS


# An unknown value in these can change a number we display. An unknown STOPPAGE
# REASON cannot. Twelve of 48 refusals in a 62-game sample were stoppage reasons
# and nothing else. They are still reported -- doctrine 9 says what we set aside
# stays visible -- but they no longer withhold a game.
#
# THE JUSTIFICATION CHANGED WHEN `rsn` WAS ADDED, and the old wording is worth
# recording because it went stale the moment it stopped being true. It read: "the
# extract drops stoppage detail entirely, so refusing a game over one is refusing
# over a field we never read." We read it now.
#
# The decision is unchanged and the reason is better: a reason is a LABEL WE
# CARRY VERBATIM AND NEVER COMPUTE ON. Nothing downstream branches on its value,
# so an unfamiliar one renders as itself and explains nothing rather than
# explaining something wrong. That is a different and stronger argument than "we
# never look at it", and it is the one that survives the whistle layer existing.
# THE TEN THE ARCHIVE ACTUALLY CONTAINS, and the six-value version of this set
# was the reference game talking. A derive over 4,553 games reported four more
# through `noted`, exactly as designed -- including the `hit-crossbar` Kevin
# predicted from its absence. Weights measured over 2,574 missed shots in 89
# sampled games:
#
#   wide-left            38.3%      hit-left-post         2.7%
#   wide-right           35.0%      hit-right-post        2.6%
#   above-crossbar        5.6%      short                 2.5%
#   high-and-wide-right   5.4%      hit-crossbar          2.0%
#   high-and-wide-left    5.0%      failed-bank-attempt   0.9%
#
# IRON IS 7.3% AND `short` IS ANOTHER 2.5%, so about one missed shot in ten is
# something the phrase "missed the net" describes FALSELY -- a puck off the post
# or bar hit the net, and a `short` shot never reached it.
#
# `failed-bank-attempt` IS A POSITION, NOT A GUESS: 23 of 24 are at or past the
# goal line, a median 3 ft past it and 8 ft off centre -- behind the net --
# against 1.4% for every other missed shot. What the scorer meant by it is not
# something the feed defines and not something we should invent.
#
# AND IT IS SEASON-BOUNDED: zero in 2023 across 881 missed shots, then 9 and 15.
# The league's vocabulary changes under us -- the same shape as `tv-timeout`
# becoming a primary reason in 2025-26 -- which is the whole argument for `noted`
# existing. Still deliberately NOT padded with guesses; the next new value has to
# surface the same way this one did.
KNOWN_MISSES = {
    "wide-left", "wide-right", "above-crossbar", "short",
    "high-and-wide-left", "high-and-wide-right",
    "hit-left-post", "hit-right-post", "hit-crossbar",
    "failed-bank-attempt",
}

CONSEQUENTIAL = ("typeDescKey", "situationCode")

# ⚠️ COLLECTED SINCE THIS FUNCTION WAS WRITTEN, AND NEVER COMPARED TO ANYTHING.
# `seen["penalty descKey"]` has been gathered on every run and had no entry in
# `unknown`, so a descriptor the league invented would have been recorded and
# alerted on by nobody -- the exact gap `_vocabulary_seen()` in derive.py
# describes for stoppage reasons, one field over, sitting open in this file.
#
# It closed because the page started RENDERING these: `src/lib/penalties.js`
# turns a descriptor into words, and an unknown one renders raw there. Raw on
# screen is survivable; unnoticed is not.
#
# ⚠️ STRICTLY WHAT HAS BEEN OBSERVED -- 29 descriptors: 28 across 40 games, plus
# `kneeing`, which appears in data/rich.json and in NONE of the forty. A sample
# of forty games did not contain a word the reference fixture did, which is the
# whole argument for the archive-wide sweep this list feeds.
# The archive is thousands of games and will have more. Adding a plausible
# `spearing` here would HIDE it from this report, which is the trap the
# missed-shot comment below names. They get added from the drift report.
KNOWN_PENALTIES = {
    "roughing", "tripping", "kneeing", "cross-checking", "high-sticking", "interference",
    "slashing", "hooking", "holding", "elbowing", "boarding", "embellishment",
    "misconduct", "game-misconduct", "holding-the-stick",
    "unsportsmanlike-conduct", "unsportsmanlike-conduct-bench",
    "interference-goalkeeper", "delaying-game",
    "delaying-game-puck-over-glass", "delaying-game-face-off-violation",
    "delaying-game-illegal-play-by-goalie", "delaying-game-unsuccessful-challenge",
    "closing-hand-on-puck", "too-many-men-on-the-ice", "goalie-removed-own-mask",
    "high-sticking-double-minor", "butt-ending-double-minor",
    "ps-slash-on-breakaway",
}


def vocabulary(pbp):
    seen = {"typeDescKey": set(), "stoppage reason": set(), "situationCode": set(),
            "penalty descKey": set(), "missed-shot reason": set()}
    bad_situations = set()
    for p in pbp["plays"]:
        d = p.get("details") or {}
        seen["typeDescKey"].add(p["typeDescKey"])
        if p.get("situationCode"):
            seen["situationCode"].add(p["situationCode"])
            # Checked per play, because validity depends on the period type --
            # 0101 is a coherent shootout and an impossible even-strength shift.
            if not situation_ok(p["situationCode"], p["periodDescriptor"].get("periodType")):
                bad_situations.add(p["situationCode"])
        if p["typeDescKey"] == "stoppage":
            for k in ("reason", "secondaryReason"):
                if d.get(k):
                    seen["stoppage reason"].add(d[k])
        if p["typeDescKey"] == "missed-shot" and d.get("reason"):
            seen["missed-shot reason"].add(d["reason"])
        if d.get("descKey"):
            seen["penalty descKey"].add(d["descKey"])
    unknown = {
        "typeDescKey": seen["typeDescKey"] - KNOWN_EVENTS,
        "stoppage reason": seen["stoppage reason"] - KNOWN_STOPPAGES,
        "situationCode": bad_situations,
        # NOTED, NEVER BLOCKING -- the same standing as a stoppage reason, and for
        # the same reason: a value we carry verbatim and never compute on renders
        # as itself and explains nothing, rather than explaining something wrong.
        #
        # THE SET IS STRICTLY WHAT HAS BEEN OBSERVED, and that is the point.
        # Adding a plausible-looking `hit-crossbar` would HIDE it from this
        # report, and whether the feed has one is exactly the open question:
        # `above-crossbar` exists and no `hit-crossbar` appeared in 31 attempts,
        # so a puck off the bar is being recorded as SOMETHING and we do not yet
        # know what. One game cannot answer it; the archive can, on the next
        # derive, through `index.json`'s `noted`.
        "missed-shot reason": seen["missed-shot reason"] - KNOWN_MISSES,
        # NOTED, NEVER BLOCKING, and the standing is deliberate: an unrecognised
        # descriptor renders as itself on the page rather than as a guess, so it
        # is a wording gap and not a wrong number. Blocking a derive on it would
        # refuse a game over a word.
        "penalty descKey": seen["penalty descKey"] - KNOWN_PENALTIES,
    }
    return seen, {k: v for k, v in unknown.items() if v}

# ---------------------------------------------------------------- validation

def validate(rich, pbp, shifts, box):
    """Independent checks, against the raw feed and the boxscore -- never against
    our own extract. Byte-identity cannot catch anything in here."""
    fails, notes = [], []
    def check(ok, msg):
        print(f"  {'PASS' if ok else 'FAIL'}  {msg}")
        if not ok:
            fails.append(msg)

    # REFUSE ON WHAT WE COULD HAVE GOT WRONG; RECORD WHAT THE LEAGUE GOT WRONG.
    # derive.py already states this rule for vocabulary -- "refuse on what can
    # change a number, record the rest" -- and a disagreement between two of the
    # league's OWN documents is not something withholding the game can fix.
    def note(ok, msg, detail=None):
        print(f"  {'PASS' if ok else 'NOTE'}  {msg}")
        if not ok:
            # THE NUMBERS TRAVEL WITH THE SENTENCE. `check` is the audit trail,
            # in the same wording the ledger counts refusals by; the rest is what
            # a PAGE needs to say this to a reader. Without it the renderer would
            # have to re-derive which team disagreed and by how much -- a second
            # implementation of a rule that already has one, in a language where
            # nothing tests it.
            notes.append({"check": msg, **(detail or {})})

    check(len(rich["events"]) == len(pbp["plays"]),
          f"lossless: {len(rich['events'])} events == {len(pbp['plays'])} plays")

    # THE CLOCK IS AN ADDRESS NOW, NOT ONLY A LABEL.
    #
    # Deep links name a moment as `?at=<period>-<mm:ss>` and resolve against
    # `rem`, so a game whose events lack a clock is a game every link into it
    # resolves wrongly -- silently, because the resolver would find nothing at
    # that clock and fall back to the last event before it. Nothing asserted
    # `rem` was there at all; it arrived with the countdown-clock commit and has
    # been trusted ever since, which is the same shape as `own` carrying a
    # meaning nobody had checked.
    #
    # THE FORMAT IS CHECKED, NOT ONLY THE PRESENCE, and that is the half that
    # earns its place. The ordinal that disambiguates a shared clock rides on a
    # dot -- `?at=2-14:32.3` -- which is unambiguous only while a clock is
    # strictly MM:SS. The NHL scoreboard shows tenths under a minute; if the
    # feed ever exposed `14:32.7`, the separator would collide with a time
    # component and every link into that game would land on the wrong event
    # while looking entirely correct. This turns that into a refusal.
    bad_clock = [e["clock"] for e in rich["events"]
                 if not re.fullmatch(r"\d{2}:\d{2}", e.get("rem") or "")]
    check(not bad_clock,
          f"every event carries an MM:SS clock ({len(bad_clock)} do not)")

    # Coordinates: the RULE, not the pattern. See test/rink.test.js.
    bad = sum(1 for e, p in zip(rich["events"], pbp["plays"])
              if (p.get("details") or {}).get("xCoord") is not None
              and e["x"] != ((-(p["details"]["xCoord"]) if p.get("homeTeamDefendingSide") == "right"
                              else p["details"]["xCoord"]) or 0))
    check(bad == 0, f"normalization matches the ends-switch rule ({bad} mismatches)")

    # SHOTS ON GOAL, AGAINST TWO WITNESSES THAT ARE NOT THE SAME WITNESS.
    #
    # This check used to compare our count to the BOXSCORE alone and refuse on
    # any difference. That treats the boxscore as ground truth, and it cannot
    # tell "we parsed it wrong" from "the league's two documents disagree" --
    # which need opposite responses and were getting the same one.
    #
    # Measured 2026-08-21 over every refused game: 73 in-scope games (68 regular
    # season, 5 playoff, including two conference finals) reproduce the
    # play-by-play EXACTLY and differ from the boxscore by exactly one shot on
    # exactly one team, 73 of 73. We were withholding games because the league
    # disagreed with itself, and the event log is the document we replay.
    #
    # EXCLUDING THE SHOOTOUT, because the boxscore excludes it. A shootout
    # attempt is not a shot in the run of play and the league does not count it
    # as one; counting it here compared two different quantities and called the
    # difference a fault.
    hid, aid = rich["teams"]["home"]["id"], rich["teams"]["away"]["id"]
    sog = {hid: 0, aid: 0}
    for e in rich["events"]:
        if e["type"] in ("shot-on-goal", "goal") and e.get("pt") != "SO":
            sog[e["own"]] += 1
    bx = {box["homeTeam"]["id"]: box["homeTeam"]["sog"],
          box["awayTeam"]["id"]: box["awayTeam"]["sog"]}

    # WITNESS ONE, AND THIS IS THE ONE THAT CATCHES US. The league stamps its own
    # running shot counter on every shot-on-goal play -- `details.homeSOG` and
    # `awaySOG` -- and it counts shot events only, never goals. It is the same
    # trick the score-sequence check already uses: a witness inside the very
    # document we are parsing, so it can only ever be testing OUR reading of it.
    # Costs no fetch and no schema change. It does NOT go in the extract.
    shot_ev = {hid: 0, aid: 0}
    for e in rich["events"]:
        if e["type"] == "shot-on-goal" and e.get("pt") != "SO":
            shot_ev[e["own"]] += 1
    run = {hid: 0, aid: 0}
    seen = plays = 0
    for p in pbp["plays"]:
        if p["typeDescKey"] != "shot-on-goal": continue
        if (p["periodDescriptor"] or {}).get("periodType") == "SO": continue
        plays += 1
        d = p.get("details") or {}
        if d.get("homeSOG") is None or d.get("awaySOG") is None: continue
        seen += 1
        run[hid] = max(run[hid], d["homeSOG"])
        run[aid] = max(run[aid], d["awaySOG"])

    # A CHECK THAT SILENTLY DOES NOT RUN is this project's named failure mode,
    # and this one is built to be vacuous: with no shot plays at all, `run` and
    # `shot_ev` are both zero and the comparison below passes having compared
    # nothing. So the witness is required to be PRESENT before it is believed.
    check(seen == plays,
          f"every shot-on-goal carries the league's running count "
          f"({plays - seen} of {plays} without)")
    check(shot_ev[hid] == run[hid] and shot_ev[aid] == run[aid],
          f"shot events match the league's own running count: "
          f"home {shot_ev[hid]}=={run[hid]}, away {shot_ev[aid]}=={run[aid]}")

    # WITNESS TWO, AND IT IS NOT OURS TO FIX. The boxscore is a separate document
    # produced by the same league, and where it disagrees with the event log the
    # disagreement is a fact about their data. Refusing the game hides one we can
    # replay faithfully; recording it says what we could not reconcile, which is
    # what Doctrine 9 asks for. `quoted` already carries the boxscore's own
    # numbers into the extract, so a page can show both with no schema change.
    #
    # WITH ONE EXCEPTION, AND IT IS STRUCTURAL RATHER THAN NUMERIC. Preseason
    # (33 of 33) and gameType 9 (30 of 30) arrive with GOALS AND NO SHOT EVENTS
    # AT ALL -- a median of 12 to 15 plays against a boxscore claiming forty
    # shots. That is a summary wearing a play-by-play's name and there is nothing
    # in it to replay, so it stays refused.
    #
    # The condition is "the boxscore disagrees AND the event log holds no shots",
    # never "the gap is larger than N". A magnitude test would be a threshold
    # tuned to today's failures. It is also not simply "no shot events": a game
    # in which every shot on goal WENT IN has none and is perfectly consistent,
    # and refusing it would be refusing arithmetic we agree with.
    agrees = sog[hid] == bx[hid] and sog[aid] == bx[aid]
    check(agrees or plays > 0,
          f"a boxscore disagreement with NOTHING to replay: {plays} shot events "
          f"against a boxscore of home {bx[hid]}, away {bx[aid]}")
    note(agrees,
         f"SOG reproduces boxscore: home {sog[hid]}=={bx[hid]}, away {sog[aid]}=={bx[aid]}",
         {"kind": "sog",
          "home": {"ours": sog[hid], "league": bx[hid]},
          "away": {"ours": sog[aid], "league": bx[aid]}})

    # Blocked shots are credited to the SHOOTER. Checked against rosterSpots,
    # an independent source -- not against our own roster map.
    team_of = {s["playerId"]: s["teamId"] for s in pbp["rosterSpots"]}
    blocks = [(e, p) for e, p in zip(rich["events"], pbp["plays"]) if e["type"] == "blocked-shot"]
    ok = all(team_of.get((p["details"] or {}).get("shootingPlayerId")) == e["own"]
             for e, p in blocks)
    check(ok, f"blocked shots credited to the shooter ({len(blocks)} checked vs rosterSpots)")

    # A PENALTY IS CREDITED TO THE TEAM THAT COMMITTED IT, and the penalty box is
    # built on that sentence -- get it backwards and every box fills on the wrong
    # side of the ice, on a screen where both boxes look equally plausible. `own`
    # has already meant something unexpected once in this feed (the SHOOTER on a
    # blocked shot, not the blocker), so it is checked here against rosterSpots
    # rather than inherited from a comment. See docs/ends-switching.md.
    # NOT EVERY PENALTY HAS A COMMITTING PLAYER, and this check refused 864 games
    # before it learned that. A BENCH MINOR -- too many men on the ice is the
    # common one -- is committed by the TEAM: the feed carries `servedByPlayerId`
    # and no `committedByPlayerId`, so `team_of.get(None)` compared against a real
    # team id failed every game that contained one. Verified 8 of 8 on the
    # reference game and shipped across 4,553; the reference game has no bench
    # minor, so the sample could not contain the case that breaks it.
    #
    # The right move is to check what CAN be checked and say how many could not,
    # rather than to weaken the comparison -- a skipped case that is counted is
    # visible, and a comparison loosened until it passes is not.
    pens = [(e, p) for e, p in zip(rich["events"], pbp["plays"])
            if e["type"] == "penalty"]
    named = [(e, p) for e, p in pens
             if (p["details"] or {}).get("committedByPlayerId") is not None]
    wrong = [f"{e['per']}/{e['clock']}" for e, p in named
             if team_of.get(p["details"]["committedByPlayerId"]) != e["own"]]
    check(not wrong,
          f"penalties credited to the offending team "
          f"({len(named)} of {len(pens)} checked vs rosterSpots; "
          f"{len(pens) - len(named)} have no committing player -- a bench minor is "
          f"served, not committed"
          f"{', wrong at ' + ', '.join(wrong[:3]) if wrong else ''})")

    # WHAT WE RECORDED THE ENDS TO BE, against the feed that recorded them. The
    # value is one string per period and a wrong one mirrors a whole period of
    # hockey, which is the kind of error that renders perfectly and reads as a
    # different game. A period the feed disagrees with itself about carries no
    # entry by construction, so this only ever checks what we actually claimed.
    side_bad = [f"P{p['periodDescriptor']['number']}" for p in pbp["plays"]
                if p.get("homeTeamDefendingSide")
                and str(p["periodDescriptor"]["number"]) in rich["sides"]
                and rich["sides"][str(p["periodDescriptor"]["number"])]
                    != p["homeTeamDefendingSide"]]
    played = {str(p["periodDescriptor"]["number"]) for p in pbp["plays"]}
    check(not side_bad,
          f"the recorded ends match the feed on every play "
          f"({len(rich['sides'])} of {len(played)} periods carry one"
          f"{', ' + str(len(side_bad)) + ' disagree' if side_bad else ''})")

    check(len(rich["shifts"]) == len(shifts["data"]),
          f"shifts lossless: {len(rich['shifts'])} == {len(shifts['data'])}")

    # A SHOOTOUT ADDS EXACTLY ONE TO THE SCOREBOARD, however many attempts go
    # in. The feed records every successful attempt as its own `goal` event, so
    # this check passed on shootout games ONLY when exactly one scored -- true of
    # three sampled games and false of a fourth, which had nine goal events
    # against a score of seven. Correct by accident, three times out of four.
    shootout = any(e.get("pt") == "SO" for e in rich["events"])
    scored = sum(1 for e in rich["events"]
                 if e["type"] == "goal" and e.get("pt") != "SO")
    total = box["homeTeam"]["score"] + box["awayTeam"]["score"]
    check(scored + (1 if shootout else 0) == total,
          f"goal events{' + the shootout decision' if shootout else ''} == "
          f"final score ({scored}{'+1' if shootout else ''} vs {total})")

    # THE SCORE SEQUENCE, WHICH THE TOTAL ABOVE CANNOT SEE.
    #
    # The check above validates a SUM. Two goals swapped in order leave that sum
    # exactly right and move every tied/leading/trailing boundary underneath it --
    # and the featured game on the homepage is ranked on attempts taken while the
    # score was LEVEL, so each attempt is bucketed by the score at that instant.
    # A wrong sequence is a wrong ranking with a correct-looking total below it.
    # Proven by mutation in test_derive.py: swap two goals scored by different
    # teams and the total check still passes.
    #
    # The witness is the league's own running score, carried on every goal in the
    # play-by-play -- 198 of 198 across three sampled seasons. It costs no fetch
    # and no schema change, because validate() is handed the raw feed. It does NOT
    # go into the extract: that document carries what it cannot reconstruct, and a
    # running score is its own arithmetic over goals it already holds.
    seq, unwitnessed, disagreed = {hid: 0, aid: 0}, 0, []
    for e, p in zip(rich["events"], pbp["plays"]):
        if e["type"] != "goal" or e.get("pt") == "SO" or e["own"] not in seq:
            continue
        seq[e["own"]] += 1
        d = p.get("details") or {}
        said = (d.get("awayScore"), d.get("homeScore"))
        if said[0] is None or said[1] is None:
            # A CHECK THAT SILENTLY DOES NOT RUN is this project's named failure
            # mode. The field is universal in what we hold, so its absence is an
            # anomaly and gets said out loud rather than shrugged off.
            unwitnessed += 1
            continue
        if said != (seq[aid], seq[hid]):
            disagreed.append(f"{e['per']}/{e['clock']} league {said[0]}-{said[1]} "
                             f"vs ours {seq[aid]}-{seq[hid]}")
    check(unwitnessed == 0,
          f"every goal carries the league's running score ({unwitnessed} without)")
    check(not disagreed,
          f"the score sequence matches the league at every goal "
          f"({len(disagreed)} disagree{': ' + '; '.join(disagreed[:2]) if disagreed else ''})")
    return fails, notes

# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--validate", action="store_true")
    ap.add_argument("--vocab", action="store_true")
    ap.add_argument("--additive", action="store_true",
                    help="prove a schema change disturbed nothing that already existed")
    args = ap.parse_args()

    pbp = json.loads((DATA / f"pbp_{GAME}.json").read_text())
    shifts = json.loads((DATA / "shifts.json").read_text())
    boxfile = DATA / f"box_{GAME}.json"
    rich = extract(pbp, shifts,
                   json.loads(boxfile.read_text()) if boxfile.exists() else None)
    out = json.dumps(rich, separators=(",", ":"))

    if args.vocab:
        seen, unknown = vocabulary(pbp)
        for k in sorted(seen):
            print(f"  {k}: {len(seen[k])} distinct")
            for v in sorted(seen[k]):
                print(f"      {v}")
        if unknown:
            print("\n  UNRECOGNISED -- hold this game out of the index:")
            for k, v in unknown.items():
                print(f"      {k}: {sorted(v)}")
            return 1
        print("\n  all vocabulary recognised")
        return 0

    if args.validate:
        box = json.loads((DATA / f"box_{GAME}.json").read_text()) \
            if (DATA / f"box_{GAME}.json").exists() else None
        if box is None:
            print("  SKIP  boxscore not committed; fetch it to enable SOG/score checks")
            return 2
        fails, unreconciled = validate(rich, pbp, shifts, box)
        # A NOTE IS NOT A PASS AND IT IS NOT A FAILURE. Printing only the
        # failure count would let a human reading one game conclude the two
        # documents agreed, when what happened is that we decided the
        # disagreement was the league's rather than ours.
        print(f"\n  {'ALL CHECKS PASS' if not fails else str(len(fails)) + ' FAILED'}"
              f"{'; ' + str(len(unreconciled)) + ' RECORDED, NOT REFUSED' if unreconciled else ''}")
        return 1 if fails else 0

    current = (DATA / "rich.json").read_text()

    if args.additive:
        # A schema change must be provably additive: every value that already
        # existed is unchanged, nulls may be filled, new keys may appear, and
        # nothing may be removed or rewritten. Byte-identity cannot express
        # "changed on purpose"; this can.
        old = json.loads(current)
        bad, added = [], set()
        # Filling a null is allowed -- but filling one with garbage would also be
        # "additive", so report which keys changed rather than only how many.
        # (Found because a mutation test of mine passed when it should not have:
        # `x or 0` only ever turned nulls into 0, which this gate permits.)
        filled = {}
        if len(old["events"]) != len(rich["events"]):
            bad.append("event count changed")
        for i, (o, n) in enumerate(zip(old["events"], rich["events"])):
            for k, v in o.items():
                if k not in n:
                    bad.append(f"event {i}: key {k} REMOVED")
                elif n[k] != v:
                    if v is None:
                        filled[k] = filled.get(k, 0) + 1
                    else:
                        bad.append(f"event {i}: {k} {v!r} -> {n[k]!r}")
            added |= set(n) - set(o)
        # TOP-LEVEL KEYS WERE INVISIBLE HERE, and `sides` is the first schema
        # change that adds one. The list was five names typed out by hand, so a
        # new document could appear beside them -- or an old one vanish -- and
        # the gate would print ADDITIVE ONLY having never looked. Derived from the
        # documents themselves now, which is the same correction as FINAL_STATES
        # and the eight situation codes: pin the rule, not the sample.
        gone = sorted(set(old) - set(rich))
        if gone:
            bad.append(f"top-level keys REMOVED: {gone}")
        new_top = sorted(set(rich) - set(old))
        for key in sorted((set(old) & set(rich)) - {"events"}):
            if old[key] != rich[key]:
                bad.append(f"{key} changed")
        print(f"  new top-level keys: {new_top or 'none'}")
        print(f"  new event keys: {sorted(added)}")
        print(f"  nulls filled by key: {filled or 'none'}")
        print(f"  size {len(current.encode())} -> {len(out.encode())} bytes")
        if bad:
            print(f"  NOT ADDITIVE -- {len(bad)} problems")
            for b in bad[:8]:
                print(f"    {b}")
            return 1
        print("  ADDITIVE ONLY -- nothing existing was disturbed")
        return 0

    if args.verify:
        h = lambda s: hashlib.sha256(s.encode()).hexdigest()[:16]
        print(f"  extracted {len(out.encode()):>7} bytes  sha {h(out)}")
        print(f"  on disk   {len(current.encode()):>7} bytes  sha {h(current)}")
        same = out == current
        print("  BYTE-IDENTICAL" if same else "  DIFFERS -- gate FAILED")
        if not same:
            for i, (a, b) in enumerate(zip(current, out)):
                if a != b:
                    print(f"    first difference at byte {i}:")
                    print(f"      on disk  : …{current[max(0,i-60):i+60]}…")
                    print(f"      extracted: …{out[max(0,i-60):i+60]}…")
                    break
            else:
                print(f"    identical prefix; lengths differ {len(current)} vs {len(out)}")
        return 0 if same else 1

    (DATA / "rich.json").write_text(out)
    print(f"  wrote data/rich.json {len(out.encode())} bytes")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
