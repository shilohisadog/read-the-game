---
name: ends-switching-reopened
description: "✅ BUILT 2026-08-20 — the rink turns over every period, as the arena does. ?ends=as-played is the default, ?ends=fixed the control; all of CHENG's conditions met. Read for the measurements (63% open host-left, OT switches 25/25) and the PAIRED-TEST pattern."
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-20T23:30:00.000Z
---

## ⛔⛔ 2026-10-21 — THE RINK WAS MIRRORED, AND NOBODY HAD CHECKED IT AGAINST VIDEO
Every replay drew the league's coordinates through `SX(x)=100−x`: a LEFT-RIGHT MIRROR (no camera can see
that). Kevin found it comparing 2026020010 with the NHL goal visualizer: TBL's end was on the other side.
Fix `673f159`: `app.js::AX=(x,per)=>SX(-x*DIR(per))` (+ the whistle marks' direct `SX(-m.x)`); league +x =
screen right, +y = up (Kevin confirmed both). `docs/ends-switching.md` carries the dated correction. The
claim "as-played is what the broadcast shows" was a convention; it is now true. Rule diagrams + card keep
`SX` (they draw no game). `test/render-board.test.js` reads `sides` per period; mutation-checked.

**Status 2026-08-18: REOPENED, ruled on by CHENG, and Kevin is still deciding.
Nothing is being built.** The artifact is `docs/ends-switching.md` — §1–§9 the
original, **§10 the reopening**.

## What ships today

`extract.py::_norm` undoes the ends switch with `homeTeamDefendingSide` so the
host always defends `-x`; `SX(x)=100-x` puts the host's net on the screen right.
**The host attacks screen-left, the visitor screen-right, all game.** Every count
is computed on normalized coordinates, and `extract --validate` checks the
normalization on every build.

## Kevin's reopening

> *"That's going to confuse a viewer, because the teams DO change sides. The
> natural question is 'why didn't the teams change sides, what's wrong with this
> website' — a question I would like to avoid."*

**This is a different axis from §1–§8, which weighed legibility of accumulated
marks — an analyst's question. This is TRUST, and it fails before any of those
advantages can be collected.** It is *the measurement right and the objective
function wrong*: no technique catches it, only naming the reader first.

## ⭐ CHENG's decisive fact — VERIFIED by grep, the disclosure was never built

§6 committed to a period-boundary sentence as load-bearing, §7.5 worked out its
wording ("harder than it looks"), §8 listed it as step 4. **It does not exist.**
What shipped instead was `ATTACKS →`, which states the fixed convention *without*
the disclosure that makes it honest — so the arrows made the contradiction
sharper, not safer.

> **So the comparison was never one-direction vs as-played. It was one-direction
> WITHOUT ITS MITIGATION vs as-played.** Kevin's report is a report about a
> missing feature that was already agreed, and CC attributed it to the design.

## CHENG's rulings

1. **The trust argument justifies the CONTROL, not the default flip — not yet.**
   The mitigation is untested because unbuilt. And the asymmetry runs both ways:
   default as-played and a novice never learns to read a shot map, which is
   *equally silent and harder to detect, because nothing looks broken*. Also
   **the reader in the trust argument is a hockey fan** — the stated novice does
   not know ends switch at all, and a rink that mirrors mid-game may read as a
   glitch to her. Both are predictions about unobserved users.
2. **The sentence is a PREREQUISITE, not an alternative** — needed in both modes,
   so it is never thrown away. **The arrows are its natural home.** It needs the
   `display:` provenance form, and the still-unmade normalization disclosure has
   a home in the same sentence.
3. **Benches: leave them off.** The "drawing the building" objection *proves too
   much* — we already draw the rink, blue lines, dots, creases and nets, none of
   it in the feed; what makes that legitimate is that it is rule-specified, and
   bench placement is too. The real objection is that **two rectangles will not
   teach a novice that a tired defenceman cannot change.**
4. **The penalty box is independent** — occupancy reads from `sit` and is right
   in either mode. Agreed.

## ⭐ CHENG's finding, and CC's own measurement made it stronger

**§10.2's long-change argument does not support as-played.** Flipping the rink
shows the ends changed; it shows nothing about **benches**, which is where the
long change lives. CC presented a contingent argument as independent support.

CC then measured the mechanism rather than conceding rhetorically — mean shift
length over 796 games: **P1 45.2s, P2 49.5s (+9.5%), P3 46.8s**, with P1/P3
sharing bench geometry and the stoppage confound running backwards (P2 has MORE
whistles, which should shorten shifts).

**So the long change is now measured — and that REMOVES CC's own argument for
as-played.** A fact teachable as a number needs neither a flipping rink nor
drawn benches. **It is a card, not a rendering mode.** That option was new to
both of them.

## Where CC landed

**Withdrew the default-flip recommendation and agreed the sequencing:**
**the sentence → look at it → the control → let the novice tester pick the
default.** One thing held back: **§7.5 says the wording is hard, and CHENG's plan
makes that sentence the instrument one-direction is tested with — a weak sentence
would fail and wrongly discredit the mode.** It is not "just a line of copy".

## The cost, established this session and smaller than §5 assumed

**As-played is a RENDER-TIME transform.** `corsi`, `blocked`, `whistle` and
`tied` never read `e.x`; `danger` and `goaltending` touch it twice each on
normalized input. **Every count, layer and base rate is untouched**, and `trails`
is the only spatial accumulation in the app — which §5 already answered: scope to
the period, *because the frame ended*.


# ⭐ RULED — 2026-08-19. AS-PLAYED.

**Kevin ruled it and CHENG changed his ruling to match:** *replay theater that
transforms the geometry isn't replaying.*

**What made the comparison fair for the first time:** the period-boundary
disclosure is BUILT (`3ae88c6`). Every earlier argument — including CHENG's own
objection — compared one-direction **without its mitigation**, because the
mitigation did not exist. It does now, and it stands at the top of each period
after the first, for 90 seconds of play:

> *"The teams just changed ends, as they do every period. We hold the rink the
> same way all game, so the marks stay comparable."*

**And `sides` is carried** (`c1d19bd`) — recorded per period, never computed from
period parity, because parity agrees with the record on the reference game and
would be silently wrong in half of all buildings.

## CHENG's two conditions, both unbuilt

1. **The invariance test cannot be skipped** — every reducer's output
   byte-identical across the toggle. And **`SX` must be made LEXICALLY unreachable
   from library scope**, not merely unused: §7.3 measured that it holds by habit,
   and the modules are inlined into one shared scope, so a reducer that named
   `SX` would find it. *A guard that can be seen to fire beats a rule nobody has
   broken yet.* **Sequence this first.**
2. **Keep one-direction as a control.** The whole-game shot map is the frame
   every other analytics surface uses; demoting it costs nothing, deleting it
   costs the Control layer its single picture.

**Still to do:** scope `trails` to the period (§5 already answered why — the
frame ended). Tracked in the build list, `docs/status.md`.

# ✅ BUILT — 2026-08-20. B1 IS COMPLETE.

`?ends=as-played` (the ruled default) · `?ends=fixed` (CHENG's control).
Commits `be3cc50` → `38ae63d`. Full artifact: `docs/ends-switching.md` §12–13.

## What shipped, and the one idea that organises it

**Only `AX`/`AY` know the mode.** That is the whole invariance claim: the flip is
applied at DRAW time, downstream of every count, so no reducer can see it.
`_norm` rotates a period 180° when the host defended `right`; applying the same
rotation again puts a play back where it happened in the building. Both x and y —
it is a rotation, never a mirror.

**Seven arena-frame sites** follow it: `place()`, both nets, both goaltenders, the
shot line, the whistle marks, the rule lines, and the ATTACKS arrows (already
derived, so free). `netGlyph`/`goalieGlyph` read their facing from the screen x,
so both orient themselves — no change inside either.

**⭐ CHENG's rule that replaced an enumeration:** *anything drawn in the ATTACKING
frame is untouched by the flip; only arena-frame drawings follow it.* That is why
`showWhy` stays fixed — its half-rink is the frame the danger rule is DEFINED in,
and an arena-relative choice has no meaning there. It decides the eighth site
nobody has thought of yet.

## ⭐ THE PAIRED TEST — the pattern worth reusing

**Neither test is safe alone.** Invariance is satisfied by a flip that does
nothing; "it flipped" is satisfied by a flip that also moved the arithmetic.

| mutation | rotation test | invariance test |
|---|---|---|
| `DIR` → identity | **red** | green |
| flip applied inside `upto()` | green | **red** |

And the rotation test asserts the **exact relationship**, not difference:
`SX(x)=100-x`, so the two screen positions must sum to **200** and the y pair to
**85**. A flip that moved a mark anywhere else passes "differs" and fails here.

## The measurements

- **63% of games open with the host on the SCREEN-LEFT.** Raw P1 defending side
  over 60 games: `right` 38, `left` 22 — and `_norm`+`SX` put `right` on the
  left. So the badge/net mismatch usually starts in period ONE, not period two as
  §7 assumed.
- **The sequence alternates in 60 of 60.** Which also settles why `sides` had to
  be recorded: parity gets the alternation right and the STARTING side wrong 63%
  of the time.
- **Overtime switches too** — 25 of 25 regular-season OT games, 19 of 19 playoff.
  CC's recollection that 3-on-3 OT keeps the long change was WRONG, and the data
  cleared the permanent sentence. ⚠️ **But `sides` also carries period FIVE and
  alternates it** — the regular-season shootout, which has no ends. Not a record;
  harmless only because `place()` refuses shootout coordinates.
- Verified in a browser on CAR @ VGK `{1:right,2:left,3:right}`: 91 and 86 frames
  rotated in P1/P3, 97 unchanged in P2, **0 frames moved anywhere but the exact
  180°**.

## The copy — the rule split from the event (CHENG)

A note about a switch cannot explain an orientation set at the opening faceoff.
So two layers with **different provenance categories**:

```
standing key   as-played  rule:     the teams switch ends every period   UNGATED
               fixed      display:  we hold the rink fixed…              per > 1
boundary note  as-played  rule:     they have just changed ends          90s
               fixed      rule: + display: (both sentences)              90s
```

One is about **hockey**, the other about **us**. As-played's note has no
`display:` half — following the record is not a transform, and a sentence about
what we did would be an apology for doing nothing.

**⭐ The control cannot go silent**, and its sentence is the harder one: nothing
on screen shows the ends changing, so it carries all the load — and its weakness
would be invisible in a suite that only booted the default. Its tests are now
explicit. **E2 on the novice list: the test must run the control too.**

## Also built

- **`marks()` groups on the ARENA position** (`dir` defaults to identity so the
  control groups byte-identically). Without it, two restarts at OPPOSITE ends of
  the building merge into one circle carrying a count of both — measured, 16 of
  55 draws change bucket in the reference game.
- **`trails` scoped to the period in as-played only.** The control keeps its
  whole-game map, which is the Control layer's single picture. The whistle layer
  is **exempt**: its marks carry no team and no direction.
- **The button says what it does** — *Keep this period* / *Keep every mark*.
  A note explaining a label that contradicts itself is a decaying disclaimer.
