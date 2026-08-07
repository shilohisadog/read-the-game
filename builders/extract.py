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

def extract(pbp, shifts):
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

    return {
        "teams": {"home": {"id": home["id"], "ab": home["abbrev"]},
                  "away": {"id": away["id"], "ab": away["abbrev"]}},
        "roster": roster,
        "events": events,
        "shifts": sh,
        "gshots": gshots,
        "goalies": goalies,
    }

# ---------------------------------------------------------------- vocabulary

# Everything this extractor knows how to mean. An unrecognised value is not a
# curiosity -- it is a game we must not publish until a human has looked.
KNOWN_EVENTS = {
    "period-start", "period-end", "game-end", "faceoff", "shot-on-goal", "goal",
    "missed-shot", "blocked-shot", "hit", "giveaway", "takeaway", "penalty",
    "delayed-penalty", "stoppage",
}
KNOWN_STOPPAGES = {
    "icing", "offside", "hand-pass", "high-stick", "puck-frozen", "goalie-stopped-after-sog",
    "puck-in-netting", "puck-in-benches", "puck-in-crowd", "puck-in-penalty-benches",
    "referee-or-linesman", "tv-timeout", "video-review", "home-timeout", "visitor-timeout",
    "player-injury", "net-dislodged-defensive-skater", "chlg-vis-goal-interference",
}
# [awayGoalie][awaySkaters][homeSkaters][homeGoalie]. This game shows five codes.
# A real season adds 3-on-3 overtime, 5-on-3, 4-on-3, penalty shots and both
# goalies pulled -- so this set is KNOWN INCOMPLETE and the gate must stay loud.
KNOWN_SITUATIONS = {"1551", "1541", "1451", "1441", "0651", "1560", "1450", "1540"}

def vocabulary(pbp):
    seen = {"typeDescKey": set(), "stoppage reason": set(), "situationCode": set(),
            "penalty descKey": set()}
    for p in pbp["plays"]:
        d = p.get("details") or {}
        seen["typeDescKey"].add(p["typeDescKey"])
        if p.get("situationCode"):
            seen["situationCode"].add(p["situationCode"])
        if p["typeDescKey"] == "stoppage":
            for k in ("reason", "secondaryReason"):
                if d.get(k):
                    seen["stoppage reason"].add(d[k])
        if d.get("descKey"):
            seen["penalty descKey"].add(d["descKey"])
    unknown = {
        "typeDescKey": seen["typeDescKey"] - KNOWN_EVENTS,
        "stoppage reason": seen["stoppage reason"] - KNOWN_STOPPAGES,
        "situationCode": seen["situationCode"] - KNOWN_SITUATIONS,
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
    hid, aid = rich["teams"]["home"]["id"], rich["teams"]["away"]["id"]
    sog = {hid: 0, aid: 0}
    for e in rich["events"]:
        if e["type"] in ("shot-on-goal", "goal"):
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

    scored = sum(1 for e in rich["events"] if e["type"] == "goal")
    check(scored == box["homeTeam"]["score"] + box["awayTeam"]["score"],
          f"goal events == final score ({scored})")
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
    rich = extract(pbp, shifts)
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
