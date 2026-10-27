---
name: restart-frames-and-k1
description: "⭐⭐ CONTINUITY IS THE SCARCE RESOURCE, NOT DISTINCTNESS — 97.1% of frames already move the mark >5ft. The K1 rule is BUILT and deliberately UNWIRED (Kevin's own 2026-08-16 subline ruling blocks the surface). `own` means 4+ different things so \"Toronto now\" is unsafe. The work panel overlay SHIPPED."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-08-31T13:42:36.774Z
---

Repo doc: `docs/restart-frames.md` (17 sections, 3 CHENG rounds), artifact
<https://claude.ai/code/artifact/56b74ef5-500a-4410-b68c-ab88b94c612a>.
All figures below are from **60 live-archive games pulled 2026-08-30/31**
(systematic spread over `catalog.json`), not fixtures. **Quotable.**

## ⭐⭐ THE FINDING THAT REFRAMED EVERYTHING
CHENG asked *"how many frames change anything visible at all?"* to settle a
density worry. The answer **inverted his own question**:

| between one recorded event and the next (15,353 transitions) | |
|---|---|
| mark displacement — median | **48 ft = 93px of a 386px rink** |
| frames moving the mark **under 5 ft** | **2.9%** |
| game-clock gap — median / p75 / p90 | **9s** / 20s / 34s |
| the **acting team changes** | **45.0%** |
| crosses centre ice (strict) | **24.8%** |
| **end to end** (both past a blue line) | **18.4%**, 47/game, median gap 16s |

⭐⭐ **DISTINCTNESS WAS NEVER SCARCE. CONTINUITY IS.** Every frame already differs
maximally from the last and none is legible — which is Kevin's day-one complaint
in numbers, and it means **every option argued in that document is the wrong
shape**: each adds a distinction to a stream already saturated with them.

## ⛔ WHERE AND HOW LONG, NEVER WHOSE — and the specimen proves it
`own` is `eventOwnerTeamId` and **means a different thing per event type**: the
SHOOTER on a blocked shot, the OFFENDING team on a penalty, the WINNER on a
faceoff, the team LOSING it on a giveaway, and **the HITTER on a hit — who by
rule has no puck.** On Kevin's `?game=2025021245&at=2-18:52`, WSH-hit → TOR-shot
reads as a change of hands while **Toronto had it the whole time**. 41.0% of
team-change transitions touch a hit. `x` and `s` have ONE meaning each — so the
sentence is about the ICE and the CLOCK, never a club.

⚠️ **The naive `(a.x<0)!==(b.x<0)` puts x=0 on the positive side**, and x=0 is
the centre dot (4.6% of events): **569 transitions miscounted** as "the other
end". The blue-line guard closes it; 29 events sit at exactly |x|=25, so the
boundary is REACHABLE and testing 24/26 was a hole, not a weak mutation.

## ⏸ K1 IS BUILT AND DELIBERATELY UNWIRED
`src/lib/transition.js` + `test/transition.test.js`, 7 mutations 7 kills. The
first build put the sentence on `.plabsub` and **`render-labels.test.js` went
red — Kevin retired event sublines 2026-08-16**: *"it still looks crowded to
me."* I reverted rather than routing around his ruling. ⭐ **What is new: that
ruling retired a subline under EVERY event; this fires on 18.4%.** His call.

## ✅ SHIPPED — the work panel is an overlay on the ice
Kevin's idea, and his verdict: *"it integrates the work into the UX, as opposed
to a kinda bolt-on at the bottom of the page."* Panel top **1,493 → 11** at 390;
**page height identical open and shut** (1,959/1,959 and 1,658/1,658).
⭐ **He asked for equal heights and I could not give them honestly** — phone
panel 696 vs 164px of ice; matching costs 382px of the audit or 530px of blank
ice. **The shift was removed a different way: out of the flow entirely.** Say
which constraint you are dropping rather than pretending all three hold.

## CHENG's three rulings worth keeping
1. ⭐ *"During a stoppage the rink has no live claim to make, so it may carry a
   standing fact instead"* — names the CONDITION, not the permission, so it
   cannot be borrowed to justify drawing during play. **It must end when play
   resumes.**
2. ⛔ **Once-per-session is a tier, and a worse one.** Every kept rule is a
   property of the GAME; every killed rule was a property of US. A viewer-history
   trigger means **two viewers see one frame differently**, breaking the
   reproducibility the golden fixture and every deep link rest on.
3. ⭐ *"A narrator that says the same thing forty-four times isn't narrating"* —
   identical repetition is wallpaper, which killed the caption carrier.

⚠️ **TWICE HE ASSERTED SOMETHING THE RECORD DOES NOT CARRY**, both under
confident framing: *"the clock already holds"* at a restart (it holds on **10%**
— my own doc's two adjacent rows composed into a false one) and a *"44.6% coin
flip"* measurement of mine that **does not exist in the repo**.

## The nine dots — the best novice lesson found, unbuilt
**3,341 of 3,341 draws land on nine coordinates, 100.00%.** `app.js:333` already
carries the measurement and `app.js:353` already paints all nine, under a comment
opening *"AND THE SPOTS ARE NOT DECORATION"* — **used only as a backdrop for the
whistle layer's rings.** Icing is the safe second lesson: 469/469 restart at an
end-zone dot, only **1 of 469 ambiguous** against 3.2% overall.

Related: [[hockey-legibility-build]] · [[looking-at-pixels]] ·
[[mechanize-the-review]] · [[census-archive-answers]] · [[next-play-shading]]
