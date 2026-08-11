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
import argparse, hashlib, json, pathlib, sys

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
#   zoneCode, shotType, losingPlayerId, hitteePlayerId, running awaySOG/homeSOG,
#   and the penalty/stoppage detail (reason, secondaryReason, descKey, duration,
#   drawnByPlayerId) that the parked whistle layer would want. Raw feeds are
#   archived, so nothing is lost -- but re-extracting a season is not free, so
#   these are worth deciding on rather than defaulting.

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
    for p in pbp["plays"]:
        d = p.get("details") or {}
        per = p["periodDescriptor"]["number"]
        x, y = _norm(d.get("xCoord"), d.get("yCoord"), p.get("homeTeamDefendingSide"))
        t = p["typeDescKey"]

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
        # Who blocked it. The shooter is `actor` (see attribution.js); dropping
        # the blocker lost half of every blocked-shot event.
        if t == "blocked-shot" and d.get("blockingPlayerId") is not None:
            ev["blk"] = d["blockingPlayerId"]
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
# REASON cannot: the extract drops stoppage detail entirely, so refusing a game
# over one is refusing over a field we never read. Twelve of 48 refusals in a
# 62-game sample were stoppage reasons and nothing else. They are still
# reported -- the parked whistle layer will need them, and doctrine 9 says what
# we set aside stays visible -- but they no longer withhold a game.
CONSEQUENTIAL = ("typeDescKey", "situationCode")

def vocabulary(pbp):
    seen = {"typeDescKey": set(), "stoppage reason": set(), "situationCode": set(),
            "penalty descKey": set()}
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
        if d.get("descKey"):
            seen["penalty descKey"].add(d["descKey"])
    unknown = {
        "typeDescKey": seen["typeDescKey"] - KNOWN_EVENTS,
        "stoppage reason": seen["stoppage reason"] - KNOWN_STOPPAGES,
        "situationCode": bad_situations,
    }
    return seen, {k: v for k, v in unknown.items() if v}

# ---------------------------------------------------------------- validation

def validate(rich, pbp, shifts, box):
    """Independent checks, against the raw feed and the boxscore -- never against
    our own extract. Byte-identity cannot catch anything in here."""
    fails = []
    def check(ok, msg):
        print(f"  {'PASS' if ok else 'FAIL'}  {msg}")
        if not ok:
            fails.append(msg)

    check(len(rich["events"]) == len(pbp["plays"]),
          f"lossless: {len(rich['events'])} events == {len(pbp['plays'])} plays")

    # Coordinates: the RULE, not the pattern. See test/rink.test.js.
    bad = sum(1 for e, p in zip(rich["events"], pbp["plays"])
              if (p.get("details") or {}).get("xCoord") is not None
              and e["x"] != ((-(p["details"]["xCoord"]) if p.get("homeTeamDefendingSide") == "right"
                              else p["details"]["xCoord"]) or 0))
    check(bad == 0, f"normalization matches the ends-switch rule ({bad} mismatches)")

    # SOG must reproduce the boxscore: shot-on-goal events PLUS goals.
    #
    # EXCLUDING THE SHOOTOUT, because the boxscore excludes it. A shootout
    # attempt is not a shot in the run of play and the league does not count it
    # as one; counting it here compared two different quantities and called the
    # difference a fault. Five of six sampled shootout games match the boxscore
    # exactly once shootout events are removed. This does not weaken the check --
    # it makes the two sides mean the same thing, which is the only way a
    # cross-check against an independent witness says anything at all.
    hid, aid = rich["teams"]["home"]["id"], rich["teams"]["away"]["id"]
    sog = {hid: 0, aid: 0}
    for e in rich["events"]:
        if e["type"] in ("shot-on-goal", "goal") and e.get("pt") != "SO":
            sog[e["own"]] += 1
    bx = {box["homeTeam"]["id"]: box["homeTeam"]["sog"],
          box["awayTeam"]["id"]: box["awayTeam"]["sog"]}
    check(sog[hid] == bx[hid] and sog[aid] == bx[aid],
          f"SOG reproduces boxscore: home {sog[hid]}=={bx[hid]}, away {sog[aid]}=={bx[aid]}")

    # Blocked shots are credited to the SHOOTER. Checked against rosterSpots,
    # an independent source -- not against our own roster map.
    team_of = {s["playerId"]: s["teamId"] for s in pbp["rosterSpots"]}
    blocks = [(e, p) for e, p in zip(rich["events"], pbp["plays"]) if e["type"] == "blocked-shot"]
    ok = all(team_of.get((p["details"] or {}).get("shootingPlayerId")) == e["own"]
             for e, p in blocks)
    check(ok, f"blocked shots credited to the shooter ({len(blocks)} checked vs rosterSpots)")

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
    return fails

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
        fails = validate(rich, pbp, shifts, box)
        print(f"\n  {'ALL CHECKS PASS' if not fails else str(len(fails)) + ' FAILED'}")
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
        for key in ("teams", "roster", "shifts", "gshots", "goalies"):
            if old[key] != rich[key]:
                bad.append(f"{key} changed")
        print(f"  new keys: {sorted(added)}")
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
