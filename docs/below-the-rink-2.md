# Below the rink, again — audit and a layout proposal

**Written 2026-08-25 for CHENG's review. Nothing here is built.**

Kevin: *"I would like to re-imagine that area… now it's just a bunch of small
font text, colored circles, buttons, etc. that don't: 1) guide a user to what's
important, 2) describe what each means, 3) are useable, 4) are visually
appealing."*

`docs/below-the-rink.md` audited this area on 2026-08-16 and cut read-once prose
from 576px to 122px. **That work is not being undone.** Its principle — *a
sentence belongs beside the thing it is about, at the moment of use* — is the one
this document says got over-applied, and §4.2 is the evidence.

Every number below was measured in a real Chromium against **production**, at
390×900 and 1100×900, on 2026-08-25.

---

## 1. What is down there

    390px    rink ends y=452    document 1787    BELOW THE RINK = 1335px (1.58 screens at 844)
    1100px   rink ends y=697    document 1424    BELOW THE RINK =  727px

| block | y (390) | h (390) | visual rows (390) | h (1100) | rows (1100) |
|---|---|---|---|---|---|
| transport + scrubber | 466 | 162 | **5** | 70 | 3 |
| legend | 634 | **255** | **8** | 70 | 3 |
| layers | 900 | 143 | 4 | 97 | 3 |
| Trails | 1053 | 84 | 3 | 38 | 2 |
| Players | 1147 | 38 | 2 | 38 | 2 |
| game line | 1201 | 19 | — | 19 | — |
| funnel | 1236 | **209** | **4** | 58 | 1 |
| **content total** | | **910** | | **390** | |

**Three blocks are two thirds of it**: the legend (255), the funnel (209) and
the transport (162) are 626px of 910.

**Everything wraps.** On a phone the transport becomes **five rows**, the layer
row **four**, the funnel **four**. Nothing about the arrangement survives the
width it was designed at; it re-flows into a wall.

---

## 2. Complaint 3 — "useable" — is the one with a hard number

    21 interactive controls below the rink
    21 of 21 are under 44px in one dimension
    button heights seen: 16, 36, 38, 40, 42px

**44×44 CSS px is the documented minimum touch target** in both Apple's and
Google's guidance, and every single control on this surface is under it. The
16px one is the **scrubber** (`src/app.css:461 "#rg .scrub{"`) — a *drag* target
eight pixels either side of centre, on the control `docs/event-index.md` already
measured as below the resolution of a fingertip.

This is not a taste finding. It is the whole of complaint 3 and it is testable.

---

## 3. Complaint 1 — "guide to what's important"

**Five kinds of thing, one visual language.** Below the rink there are:

| kind | controls | example | can it be collapsed? |
|---|---|---|---|
| transport | 8 | Play, Prev/Next, three speeds, Explain plays | no — primary |
| metric layers | 5 | Control (Corsi), Blocked shots | **no — multi-select, state must stay visible** |
| single-choice display | 4 | Trails (2), Players (2) | **yes** |
| reference | 8 legend keys | "the slot — within 33 ft…" | yes, on demand |
| navigation | 4 | More CAR games, Browse by date | no — it is the retention mechanic |

They are rendered as the same chip. A viewer cannot tell from the drawing that
`Control (Corsi)` counts something, `Why play stopped` counts nothing, and
`Tabletop` changes only how a figure is drawn.

**And the primary action is not primary.** At the resting frame the ice carries
`Press Play` while the transport's solid-black `▶ Play from start` is the
heaviest element below the rink. Two calls to action for one action, for exactly
one frame — the first frame a stranger sees.

⚠️ **CHENG reported this as "`Play from start` came back", and that is wrong for
the second time.** `stop()` has always written `Play from start` at the resting
frame, `Play` mid-replay and `Replay from start` at the horn. Nothing reverted;
he is comparing a mid-replay screenshot with a resting one. The derived point
stands, the diagnosis does not, and the fix is not a rename — the newcomer copy
quotes that label verbatim on purpose.

---

## 4. Complaint 2 — "describe what each means"

### 4.1 Thirteen of twenty-one controls have nowhere for an explanation to go

Measured from the markup: the **transport** (8 controls) and the **layers**
(5 controls) have **no note element at all**. Only the three `figpick` groups
have one — `nSit`, `nTrails`, `nFig`.

So the five metric layers, which are the site's entire conversion, are five
unexplained nouns.

### 4.2 ⭐ And the two that DO explain themselves do it backwards

    src/app.js:694 "$('nFig').textContent"
    $('nFig').textContent = figStyle!=='mascot' ? 'Same shots, same outcomes… only the drawing changes.' : ''

    src/app.js:690 "$('nTrails').textContent"
    $('nTrails').textContent = trails!=='all' ? '' : 'Every attempt in this period stays on the ice…'

**Both notes are empty in the default state.** The explanation of `Tabletop`
appears only once you have already chosen `Tabletop`. You cannot learn what
either control does *before* using it.

⭐ **THIS IS THE 2026-08-16 PRINCIPLE EATING ITSELF.** *A sentence belongs beside
the thing it is about, at the moment of use* was implemented as *only while that
thing is active* — which is right for a **state** (the empty-net note, the ends
key: those describe something on screen now) and wrong for a **control** (a
button must be predictable before the click, or it is a dare). The two cases were
never separated, and the same reading is why the slot tip explains a mark that
does not exist unless its layer is on.

**The distinction this proposes:** a note about the ICE fires when the ice shows
it; a note about a CONTROL is available before it is pressed.

---

## 5. Complaint 4 — "visually appealing", stated as defects

- **The legend is eight keys on eight lines at 390** and is the tallest block on
  the surface. Two of the eight are the base-layer entries added 2026-08-25,
  each wrapping to two lines; Kevin has already flagged them for trimming.
- ⭐ **One legend row is not a key.** *"the teams switch ends every period, as
  they do in the arena"* has **no swatch** (`src/app.css:472 "lk-ends"`) — every
  other row is a mark and its name. It is a disclosure sitting in a key, which
  is part of why the block reads as a wall rather than a reference.
- ⭐ **The `blocked` key is painted in a team colour.**
  `src/app.css:481 "#rg .k-blk{background:var(--home)"` — but on the ice a
  blocked shot draws a ring around the shot's own dot, which carries the
  **shooter's** colour, so a visitor's blocked shot is white-and-red where the
  key shows gold. `goal — either sweater` had this exact problem and solved it
  with **two** swatches (`.k-g` and `.k-gv`). CHENG found this; it is real, it is
  a correctness defect rather than a layout one, and it should be fixed whatever
  happens to this surface.
- **The funnel is the best thing down here and it is last but one.** Four real,
  game-specific destinations, club-coloured — and it sits below two cosmetic
  toggles, so a reader who came for hockey scrolls past `Mascot`/`Tabletop` to
  find another game.

---

## 6. Constraints any redesign must survive

1. ⭐ **THE NINE DOORS.** `what-you-can-see.html` deep-links into this page nine
   times, eight of them with a layer already on: **whistle ×4, corsi ×2, slot ×1,
   goaltending ×1**. CHENG's recorded ruling killed the last wholesale move of
   these controls because *stripping the controls makes a door a one-way trip —
   that is the feature breaking, not a side effect.* Whatever replaces this must
   land a deep-linked viewer with the layer visible AND controllable.
2. **Layers are multi-select and their state is the product.** A dropdown hides
   state; "you can see what is on" is the thing this site sells. Single-choice
   controls (speed, trails, players) are a different case and may collapse.
3. **The phone is the design target**, not the laptop — the novice tester
   reviews on hers. 390×844 remains an unverified proxy for her actual device.
4. **No new read-once prose block.** 576px → 122px was measured and paid for.

---

## 7. The proposal

### 7.1 Five zones, in this order, visually distinct

    WATCH      transport + scrubber          primary, one obvious action
    LAYERS     five self-describing rows     the conversion
    REFERENCE  the marks that are always on  quiet, non-interactive, on demand
    NEXT       the funnel                    moved ABOVE the cosmetics
    DISPLAY    trails + players              collapsed, single-choice

### 7.2 ⭐ The layer control and its legend key are the same object

This is the structural claim and everything else is arrangement. **A layer's key
IS its description**, and today we draw the two separately: an unexplained chip
in one block, and a mark-and-name in another that only appears once the layer is
on. Merge them into one row per layer:

    ◉  Control (Corsi)         every shot attempt, including the ones that miss     [ off ]
    ◍  Shots from the slot     the 33 ft where 79% of goals are scored from         [ off ]

One object, carrying its mark, its name, what it counts, and its state. It
answers complaint 2 without a prose block, makes state legible without decoding
`＋` versus `✓`, and gives the group a hierarchy five identical chips cannot.

**The base-layer keys stay a reference panel** — slot shading, blue line, home
and visitor shot, puck, goal — styled so it does not look interactive, because it
is not. The ends sentence leaves the key and becomes a disclosure again.

### 7.3 The pixel budget, and it is an ESTIMATE not a measurement

44px targets ADD height, so the collapses are what pay for them. Rough, at 390:

| zone | today | proposed | note |
|---|---|---|---|
| watch | 162 | ~210 | 4 rows at 44px+, scrubber given a real hit area |
| layers | 143 | ~314 | absorbs ~150px of legend it replaces |
| reference | ~105 | ~48 | collapsed to a summary line |
| next | 209 | ~110 | 2×2 grid instead of four wrapped rows |
| display | 122 | ~48 | one collapsed control |
| **total** | **910** | **~730** | every target ≥44px |

⚠️ **Nothing in that column has been measured.** It is arithmetic on intended
sizes and it is the first thing a build should replace with real numbers.

---

## 8. Questions for CHENG

1. **Does the reference panel collapse by default?** Against: the progressive
   legend was a *truthfulness* fix — the legend must not claim marks the ice does
   not have — and a novice who never opens a collapsed panel never learns the
   slot shading. For: eight keys on eight lines is the tallest block on the
   surface and it sits between two groups of controls. This is the one call in
   §7 I do not want to make alone.
2. **Is §4.2's split right** — a note about the ICE fires with the ice, a note
   about a CONTROL is available before the press? It reads to me like the
   missing half of the 2026-08-16 rule rather than a reversal of it.
3. **Does the merged row survive the nine doors?** A deep link lands with
   `layer=whistle` on; the row must show as ON and be turn-off-able without
   scrolling to find it.
4. **`Teaching` is a SPEED named like a content mode**, sitting beside `Explain
   plays`, which is an actual content toggle. You raised it, I agreed, it is
   still there. Is renaming it part of this or is it independent?
5. **What is the honest test for "visually appealing"?** §2 and §4 are
   measurable; §5 is four named defects; the rest is judgement, and Kevin's is
   the judgement that counts. Should this document say so plainly rather than
   pretending the whole thing is measurable?

---

## 8b. CHENG's review — three adopted, one corrected by measurement

Reviewed 2026-08-25.

**Adopted, verbatim, as the rule §4.2 was reaching for:**

> **A note about the ice fires when the ice shows it. A note about a control is
> available before it is pressed.**

**Adopted — the 44px finding argues for FEWER controls, not only bigger ones.**
His caution is the half I missed: twenty-one controls each grown to 44px is a lot
of height on a surface already at 1.58 screens, so the target must be measured
*after* the layer rows merge, since that is the change that removes elements
rather than enlarging them. He would fix the **16px scrubber** first — a *drag*
target on a control already measured at 0.89 plays/px, and drag needs more
precision than tap, not less. Agreed.

**Adopted — the funnel needs a separator when it moves up.** Between the layer
rows and the display toggles it will compete with the layers for the same
attention, and *next game* must not read as *another layer*.

**And he owned the `Play from start` error with its mechanism** — three labels
keyed to position, and he had inferred a revert from two states of one function.

### ⚠️ 8b.1 Q1 — right on the principle, wrong on the arithmetic

His answer: do not collapse the reference panel, because the progressive legend
was a **truthfulness** fix — *"a key behind a disclosure names what's on the ice
AND hides it, which is worse than the permanent legend was; at least that one was
wrong in the open."* **That reasoning is right and I adopt it.**

But the escape hatch he offers does not exist. He writes that merging keys into
layer rows *dissolves* the question, leaving *"three lines, not eight."*
**Measured, on production at 390px:**

| | keys | legend height |
|---|---|---|
| base view, no layer on | **8** | **255px** |
| all five layers on | 12 | 414px |

**Only four keys are layer-owned** — `lk-hd`, `lk-blk` and two `lk-wh` — and
**not one of them is visible in the base view**. The other eight are marks the
ice draws whatever you do: the slot and blue-line shading, home shot, visitor
shot, puck, goal, blocked, and the ends sentence.

⭐ **So merging removes ZERO lines from the base view.** It saves 159px when all
five layers are on, and nothing at all in the state a first-time visitor is
actually in. Q1 is not dissolved; it is exactly as live as it was, and the block
it concerns is still the tallest thing on the surface.

### ⭐ 8b.2 And the measurement hands us a third option neither of us proposed

Per-key, base view, 390px:

    37px  2 lines  13 words   the slot — within 33 ft of the net, between the face-off dots
    37px  2 lines  15 words   either blue line — out to the neutral-zone dots, the ice teams…
    19px  1 line    2 words   home shot
    19px  1 line    7 words   visitor shot — white-filled, like the sweaters
    19px  1 line    5 words   puck (jumps between real events)
    19px  1 line    4 words   goal — either sweater
    19px  1 line    8 words   blocked — ringed where the puck was stopped
    37px  2 lines  12 words   the teams switch ends every period, as they do in the arena

**Three rows wrap to two lines and are 111px of the 255px — 44% of the block.**
Two are the base-layer entries Kevin flagged for trimming the day they shipped;
the third is the ends sentence, which **is not a key at all** and leaves the
legend under §5 regardless.

So the block shrinks by about 40% **without hiding a single mark**: remove the
one row that is not a key, and trim the two that are three times the length of
every other. That satisfies CHENG's truthfulness constraint and Kevin's wall
complaint at the same time, and it needs no disclosure widget.

**Revised answer to Q1: do not collapse, and do not rely on the merge either.
Shorten.**

---

## 9. What the tests would have to say

- **Every control below the rink is at least 44px tall**, asserted in a browser
  at 390 — the claim `npm test` structurally cannot make.
- **The nine doors still land controllable**: each deep link opens with its layer
  on and its control visible.
- **No note about a control is empty in the default state** — the §4.2 defect,
  guarded so it cannot come back.
- **The blocked key carries both sweaters**, like the goal key.
- **The measured total below the rink at 390 does not exceed today's 1335px**,
  because a redesign that is prettier and taller has not paid for itself. ⭐ And
  it is measured AFTER the merge, not before — CHENG's point that the 44px floor
  argues for fewer controls as much as for bigger ones.
- **The legend still names every mark the ice is drawing.** The §8b.2 trim must
  shorten rows, never remove a key for a mark that is on screen — that is the
  truthfulness fix the progressive legend exists to protect.
- Mutations: restore the 150px-era chip row, empty one note, shrink one target
  below 44 — each must redden exactly one test.
