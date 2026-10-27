---
name: red-on-red-ends
description: "✅ NET LABELS BUILT AND LIVE 2026-09-14 (f35ef78); ⛔ AND THE FOLLOW-ON — making the SCOREBOARD follow the ice — WAS BUILT (8477719) AND DECLINED BY KEVIN THE NEXT DAY (reverted b631b17), on the grounds that switching the board teaches the novice nothing; `git log -S hostleft` lands on the reason. — each net now carries the abbreviation of the club defending it, vertical, in the 6-unit strip between the net's back and the boards, at .38 opacity under every mark. ⛔⛔⛔ THE DECLINE WAS IN GIT HISTORY, NOT IN DOCS: this exact element shipped as 52f9b5c and Kevin deleted it TWO HOURS LATER as 76e7a86 — and neither ends-switching.md §10 nor scoreboard-mobile.md §5.2, the two places my own memory told me to check, mentions it. Only `git log -S netlab` found it, and only because a test comment fired. ⭐⭐ THE DELETION'S REASON WAS 'the club's colour says whose', which is the exact premise Kevin disproved from his phone a month later. ⚠️ NOT a colour-distance problem: MTL-CAR is dE 29.3; the ends were told apart by FILL on a 3.5x5px goaltender."
metadata:
  node_type: memory
  type: project
  originSessionId: 93e6fd35-9c6d-4b88-b317-618e5a2a3d81
  modified: 2026-09-14T15:56:11.464Z
---

# Red on red — whose end is whose. BUILT.

**Kevin, 2026-09-11, on the hero (MTL at CAR):** *"the hero game is two red or
white colored teams, that's a problem, especially on my phone, it's super
difficult to figure out who's end is who's."*

**His spec, 2026-09-14:** *"vertical aligned text between the net and the end
boards identifying that teams net… the text can be partially opaque, so not to
interfere with the event display too… just enough visual to be abundantly clear
which end is which."* Laptop first, then mobile. **Shipped `f35ef78`.**

---

## ⛔⛔⛔ THE LESSON: THE DECLINE WAS IN GIT HISTORY

This element **already shipped and was already deleted**, on one day in August:

| | |
|---|---|
| 09:01 `52f9b5c` | Kevin: *"locate CHI and SJS vertically in the net, so the watcher has a bit better SA on which side is which."* Built as `<text class="netlab">`, rotated −90, at `SX(-89)+2` = 191. |
| 11:12 `76e7a86` | Kevin: *"put a goalie in front of the net and the ambiguity resolves, so the text tags can go."* |

**The stated reason for deleting it:** *"a goaltender standing in the crease says
the net is defended **and the club's colour says whose**."*

⭐⭐ **That premise is the exact thing Kevin disproved a month later, from his own
phone.** It was correct when written. *A reason that expires does not take the
problem with it* — and this time the reason did not merely expire, it was
**falsified by the person who gave it.**

⛔⛔⛔ **AND I WOULD NOT HAVE FOUND IT.** This file's previous version told me to
re-read `docs/ends-switching.md` §10 and `docs/scoreboard-mobile.md` §5.2 before
proposing anything. **Neither mentions it.** What found it was a pre-existing
assertion firing —
`assert.doesNotMatch(rink, /class="netlab"/, 'the vertical tag is gone')` — and
then `git log -S'netlab'`.

> **Grep the repo is not enough. `git log -S` the identifier you are about to
> reintroduce.** A decline can live in a commit body and a test comment and
> nowhere a doc search will ever reach. See [[verify-inherited-claims]],
> [[replay-motion-open]] (whose decline was in a code comment above `const
> PACE`), and [[mechanize-the-review]].

## ⚠️ It was never a colour-distance problem, and the arithmetic says so

**MTL–CAR is ΔE 29.3** (CIE76, Lab) — a hero rule keyed on colour distance picks
it anyway. Over all 33 clubs and the published archive: **5 identical-hex pairs**
(BOS–NSH, DET–NJD, EDM–WPG, FLA–WSH, TOR–VAN) across **39 of 4,192 games
(0.9%)**; 16 pairs under ΔE 5; 66 under ΔE 20.

**The mechanism was FILL, not hue.** `drawNetmen` draws the host's goalie solid
and the visitor's white-in-its-own-frame — and at 390px that figure is
**3.5 × 5 px**. Two reds remove the hue you would otherwise fall back on, and
five pixels are left carrying *whose end is this* alone. **Verified on DET at
NJD, both `#CE1126`**, where the letters are the only thing separating the ends.

## ⭐ What shipped, and why it is not the thing that was deleted

Three differences, all from Kevin's own spec:

| 52f9b5c, deleted | shipped |
|---|---|
| at x=191, **on** the net, fighting mesh/strands/post/goalie | in the **6-unit strip behind** it (the rink's own ten feet minus the net) |
| full opacity, ink chosen against the net | **.38**, first child of `#rink`, the bottom-most `<g>` |
| **instead of** the goaltender | **beside** him — figure says *defended*, fill says *host/visitor*, letters say *which club* |

⭐ **IT CANNOT CONTRADICT THE FLIP**, which is why it is allowed where `ATTACKS →`
was not: it is placed from `gx`, the same `AX(±NET_X,per)` that put the net there,
so there is no second statement of which end is which. `render-ends.test.js` pins
it as a **pair** — the x must SUM TO 200 against the fixed control in the rotated
period, *and* the host's name and the host's goaltender must be on the same side
in every frame of both modes.

⭐ **The ink is `readableInk`**, passed as `var(--home-text)`/`var(--away-text)`.
*A label that fails in the same case as the thing it is fixing is not a fix.*
Confirmed in a browser: VGK → `rgb(15,26,35)`, CAR keeps `rgb(204,0,0)`.

## ⭐ Two measurements that were re-done because the first was the wrong SHAPE

**5.2px was found by looking.** At 6px the glyph box spans 192.43..199.57 and
overruns the net *and* the boards by .57 each — visible in the screenshot. At 5.2
it is 192.97..199.03, the gap to three hundredths. Cap height: **17.1px laptop,
9.4px at 844×350, 5.6px in the hero.** All 33 abbreviations are three capitals
with no descender, so cap height is the only case that renders.

⚠️ **The occlusion figure was wrong first and I had already told Kevin it.** I
counted the band `|y| ≤ 10` because *that is roughly how tall the label looks*.
The label's height is its **TEXT LENGTH** (11.65 units), so the half-height is
5.83. The real answer is **196 of 12,585 placed events over 43 extracts — 1.56%,
median 4 a game, worst 12** — not the 3.4% I quoted. **Guessing at the footprint
of the thing being measured inflated it 2.2×.** Same family as
[[mechanize-the-review]]'s *a check that tests a narrower claim than it
announces*, one level down: a measurement whose REGION was assumed.

## ⛔ RULED 2026-09-15 — THE SCOREBOARD DOES **NOT** FOLLOW THE ICE

The labels made a pre-existing disagreement legible: as-played is the default,
and the host's end opens on the screen-**left** in 32 of the 43 extracts on disk
while the host's badge is always on the scoreboard's **right**. `rinkart.js`'s
header records CHENG diagnosing exactly this and Kevin reading the pair as
swapped.

I put it to Kevin; he said the board should follow the ice; I found it was **six
live pairs, not one**, and built it as one class (`#rg.hostleft` from `DIR(per)`)
— `8477719`, verified at 1400×900, 844×350 and 390×844. **The next day he
reversed it and the reversal is right:**

> *"I vote to keep the scoreboard static and not change at period changes, I just
> don't see how switching the scoreboard aligns with anything to teach the novice
> the game of hockey."*

⭐⭐ **MY ARGUMENT FOR IT WAS A BAD ANALOGY.** I reasoned from `ends-switching.md`
§10 — *a viewer who knows hockey reads a rink that never flips as a BUG* — but a
rink that does not flip contradicts a **fact about hockey**, while a scoreboard's
left-right order is a **layout convention**. A novice holds no prior that the
board is a map, so breaking it costs nothing; a board that rearranges itself
*creates* a question about the site. The asymmetry runs against the flip.

⭐ **WHAT CHANGED IS THE BOARD'S JOB, NOT THE BOARD.** Before the labels there was
no on-ice answer to *whose end is this* but goalie fill on five pixels, so the
board was doing map work badly. The labels did not expose a defect further down
the page — **they made the board's job smaller.** Reverted as `b631b17`, with the
reason in the commit body so `git log -S hostleft` lands on the decline rather
than on a bare deletion — which is the mistake this very file exists to record.

⏭ **One finding survives, and it is Kevin's call:** `.cbar`, `.counters` and
`.pboxes` are `display:none` under **every one of the seven layers** — three
paired surfaces in the markup no reader can ever see. `#lbox` replaced them.
Delete, or revive one? Not acted on.

Related: [[mobile-landscape-ruling]] (why 390px made it unreadable),
[[rule-diagrams]] (*a diagram is not a measurement* — the licence to annotate),
[[looking-at-pixels]] (5.2 came from a screenshot, not from arithmetic).
