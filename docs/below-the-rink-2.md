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
16px one is the **scrubber** (`19b7b5b:src/app.css:461 "#rg .scrub{"`) — a *drag* target
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

    19b7b5b:src/app.js:694 "$('nFig').textContent"
    $('nFig').textContent = figStyle!=='mascot' ? 'Same shots, same outcomes… only the drawing changes.' : ''

    19b7b5b:src/app.js:690 "$('nTrails').textContent"
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
  they do in the arena"* has **no swatch** (`19b7b5b:src/app.css:472 "lk-ends"`) — every
  other row is a mark and its name. It is a disclosure sitting in a key, which
  is part of why the block reads as a wall rather than a reference.
- ⭐ **The `blocked` key is painted in a team colour.**
  `19b7b5b:src/app.css:481 "#rg .k-blk{background:var(--home)"` — but on the ice a
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
- **The blocked key carries both sweaters**, like the goal key. ⭐ CHENG's note
  on this: it is the **third** time attribution has gone astray on this one event
  type — the folklore flip that shipped a wrong Corsi count, the figure that
  named the blocker instead of the shooter, and now the key that painted the
  wrong club. *The key and the mark were derived independently and one of them
  chose the wrong team*, which is the same shape all three times.
- **The measured total below the rink at 390 does not exceed today's 1335px**,
  because a redesign that is prettier and taller has not paid for itself. ⭐ And
  it is measured AFTER the merge, not before — CHENG's point that the 44px floor
  argues for fewer controls as much as for bigger ones.
- **The legend still names every mark the ice is drawing.** The §8b.2 trim must
  shorten rows, never remove a key for a mark that is on screen — that is the
  truthfulness fix the progressive legend exists to protect.
- Mutations: restore the 150px-era chip row, empty one note, shrink one target
  below 44 — each must redden exactly one test.

---

## 10. Round one, shipped — the transport

**Kevin, 2026-08-25, after reading §1–§9.** Four instructions, and the third is a
question this section answers rather than defers:

> the control should say "Prev event" and "Next event" and not Prev play (since
> these are really events and there could have been "plays" in between the events
> that aren't shown) … we should say "Slower", "Faster" and not include
> "Teaching" … it's not really "Explain plays", it's more like "Narration" …
> and really, is that even an option to toggle off? … I would like the rows below
> the scrubber to be totally remade.

The rows below the scrubber are round two. This is everything above it, plus the
control that left it.

### 10.1 ⭐ The wrap was falling INSIDE every group

Not in the audit above, and it is the worst thing on the surface. §1 recorded
"transport 162px, five rows" as a height. Looking at the render is what showed
what those rows *were* — and the count is not the finding. ⚠️ On the local build
at 390 the transport is **four** rows, not §1's five; that measurement was taken
on production as a returning visitor and this one on a newcomer, and the two are
not differenceable. What matters is where the breaks fell:

    row 1   ▶ Play from start   ◀ Prev play
    row 2   Next play ▶   🐢 Slower   Teaching
    row 3   Faster   💬 Explain plays
    row 4   (scrubber, 16px tall)

**`Prev` ended one row and `Next` began the next.** The three speed gears were
split across two rows. And `Explain plays` — not a speed, not a step — was
orphaned beside `Faster`, where it reads as a fourth gear. Nothing on screen said
which buttons belonged together, because the only thing deciding was where the
line ran out.

`.transport` was nine controls in one `flex-wrap:wrap` row. The fix is a rule:
**a `.grp` is `flex-wrap:nowrap`, so a break can only land BETWEEN groups.**

### 10.2 The drawing now encodes the kind

§3's complaint was five kinds of thing in one visual language. The gears are the
first group to leave it: one border around the group, members divided by
hairlines, the chosen one filled and underlined — the shape a reader already
reads as *pick one of these*, which three separate chips never were.

### 10.3 "play" leaves as a countable noun and stays as a mass noun

Kevin's reason is a doctrine point, not a wording preference. `DOCTRINE.md` §4
makes **discreteness the honesty** — the puck hops between recorded events and
never glides, because the feed has no passes, dump-ins or cycle — so a button
offering the *next play* quietly claims the continuity we refuse to invent.

The rule that keeps this surgical: **"play" survives as the MASS noun for the
flow of the game and dies as a COUNTABLE synonym for a recorded event.**

| stays | goes |
|---|---|
| `＋ Why play stopped` | `◀ Prev play` → `◀ Prev event` |
| "play restarted here" | `Next play ▶` → `Next event ▶` |
| "power plays and an empty net" | "every play is named" → "every event is named" |
| `▶ Play from start` (the verb) | `💬 Explain plays` → `Narration` |
| `pbp["plays"]` — the league's own field name | |

Two visible strings carried the countable sense; both are gone. **The test has
both halves**, because either alone passes on the wrong change: a global
`s/play/event/` satisfies the first and breaks correct English in the second.

⚠️ **And the first version of that test failed on its own evidence.** Run over
the whole document it matched the CSS comment that explains the rename by
*quoting* `◀ Prev play` and `💬 Explain plays` — a check about what a reader sees,
answering about what a maintainer reads. It now reads the visible markup with
`<style>`, `<script>` and comments stripped. Same defect as the `class="lede"`
guard tripping on a comment, and it runs in **both** directions here: a stray
comment could equally have made the survivor half pass against code that no
longer contained them.

### 10.4 Three gears, and why the middle one stayed

Kevin asked for `Slower` and `Faster` without `Teaching`. His diagnosis is right
— it is a SPEED wearing the name of a content mode, which is why it read oddly
beside what was then an actual content toggle. But **two buttons cannot express
three states, and the default is a state**: drop the middle and a viewer who
tries `Faster` can never get back to the pace everything in
`docs/event-timing.md` was measured at. So the word goes and the gear stays,
named for what it is: **`Slower · Normal · Faster`.**

### 10.5 Narration — it stays an option and stops being a primary one

Kevin: *"is that even an option to toggle off?"*

`labelsOn` gates `drawLabel`, which is the ice naming each event as it happens.
It changes what the ice SAYS, never where the playhead is — which is the
definition of a display preference and puts it with Trails and Players, not in
the transport. It is drawn the way they are: a named pair, one of which is
pressed.

**The case for deleting it outright** is real and was weighed: it is one fewer
control on a surface with too many, and turning it off removes the thing the
greeting promises. **The case that kept it** is that `Keep every mark` fills the
ice with marks and the labels sit over them, so a viewer who wants to *look* at
the ice — at the slot shading, at where the attempts cluster — needs them gone.
That is a genuine use, and it is the only one.

⚠️ **Deleting it would not have been free.** `drawLabel` off is the one state in
which the caption pill announces a goal; with narration always on that branch
becomes unreachable, so the delete would have had to take a working fallback
with it. Enumerated before the decision rather than discovered after.

⭐ **And it is the first control on this surface built to §4.2's rule.** `nTrails`
and `nFig` are both empty in the default state; `nLbl` is not. Asserted in the
markup, because a note the renderer fills in on a state change is exactly the
defect.

### 10.6 Measured after, in a real browser, local build

    390    transport  162px → 210px    every control ≥44px, from 16/36/40
    1100   transport   70px → 100px
    320    transport             210px  no side-scroll; the groups hold at the narrow end

| | before | after |
|---|---|---|
| controls below the rink under 44px | **21 of 21** | **15 of 22** |
| the scrubber's drag target | **16px** | **44px** |
| transport rows at 390 | 4, breaking inside groups | 4, breaking only between them |

**The 44px floor costs height, exactly as §7.3 predicted** (162 → ~210 estimated,
210 measured). Below the rink at 390 went **1708px → 1849px** on a newcomer's
first visit. That debt is round two's to pay: §9's standing test is that the
finished surface does not exceed what it replaced, **measured after the merge**.

⚠️ **These are the NEWCOMER numbers** — a fresh browser profile, so the greeting
and the *why add a layer* block are both on screen. §1's 1335px was measured on
production as a returning visitor. Different populations; do not difference them.

### 10.7 What round one did NOT touch

Every defect §5 named is still there, and the render shows one more: **`Trails:`
splits across a line break** — `Current moment` ends the row and `Keep this
period` starts the next, which is §10.1's defect surviving in the display
pickers. `.grp` applies there too, and that is round two.

---

## 11. Round two, shipped — everything below the scrubber

Kevin: *"go ahead and re-make the rows below the scrubber… I want to see the
draft of that whole area redone."* This is the draft. §7's five zones, built.

### 11.1 The zones exist and each one says what it is for

    WATCH       the transport                     (round one)
    LAYERS      five self-describing rows         the conversion
    REFERENCE   what the marks mean               a read surface, never collapsed
    NEXT        watch another game                moved ABOVE the cosmetics
    DISPLAY     trails · players · narration      collapsed, single-choice

It was seven blocks in document order with no headings and one chip style
between them, so a reader had to infer the grouping from spacing alone. **NEXT
moving up is the ranking change**: four real, game-specific destinations had been
placed below `Mascot` and `Tabletop`. CHENG's condition on that move is met — a
heading over a ruled edge, so *next game* cannot read as *another layer*.

### 11.2 §7.2 is built: the control and its key are one object

Each layer is one row — **mark · name · what it counts · state**:

    ◌  Shots from the slot                                        [ OFF ]
       attempts from within 33 ft of the net, between the face-off dots

⭐ **And the two sentences are different kinds, which is §4.2's rule made
structural.** `.lds` is about the CONTROL and is always readable. `.lon` is about
the ICE and appears only with the marks it describes. One object, both halves of
the rule, and it is asserted in the stylesheet in both directions: a build that
gated the description would be the §4.2 defect, one that ungated the mark note
would be the permanent-legend defect the progressive legend fixed.

**Every note on this surface is now non-empty in its default state** — `nSit`,
`nTrails`, `nFig` and `nLbl`. `nSit` keeps its live count in the chosen state and
loses it when you switch back, so the §4.2 repair does not become a stale number.

### 11.3 The reference panel, trimmed — not collapsed

CHENG's Q1 ruling holds: a key that names a mark AND hides it is worse than a
permanent legend that was at least wrong in the open. §8b.2's third option is
what shipped instead. The panel is **the marks the ice draws whatever you press**
and nothing else: the four layer-owned keys left for their rows, the two long
base-layer rows lost their trailing clause and keep their geometry (33 ft,
between the dots; out to the neutral-zone dots), and **the two disclosures are no
longer keys** — no swatch, so they are drawn as sentences under the panel.

**Legend 255px → 173px at 390, with no mark hidden.**

### 11.4 The blocked swatch — CHENG's correctness find, fixed and guarded

`#rg .k-blk{background:var(--home)}` painted the HOST's colour for a mark whose
dot on the ice carries the **shooter's**, so a visitor's blocked shot was
white-and-red on the rink and gold in the key, on every game in the archive. Two
swatches now, like `goal — either sweater`.

⚠️ **It had no test until the mutation said so.** Deleting `.k-blkv` reddened
nothing. The guard has both halves: the key shows two sweaters, AND the fixture
really has blocked shots owned by both clubs — otherwise the key claims something
the game never shows.

### 11.5 Measured, in a real browser, local build, RETURNING visitor

The baseline is the same page at `19b7b5b`, measured the same way in the same
session — not §1's production figure, which was taken with a different profile.

| | before | after |
|---|---|---|
| controls under 44px | **21 of 21** | **0 of 21** |
| below the rink, 390 | 1418px | **1691px** |
| below the rink, 1100 | 809px | **1073px** |
| legend, 390 | 255px | 173px |
| the funnel, 390 | four stacked rows | 2×2 |
| side-scroll at 320 | none | none |

⚠️ **§9's standing test is NOT met and this section is where that is said.** The
surface is 19% taller at 390 and 33% at 1100.

⭐ **AND THE FIRST EXPLANATION OFFERED FOR IT WAS WRONG.** CHENG, reviewing this:
*"21 controls × 44px = 924px of target area. That's not a layout inefficiency,
it's a floor… the regression isn't a failure of the redesign, it's the redesign
correctly reporting that the control count is the binding constraint."* It is a
clean argument and the measurement refuses it. **Per block, 390, returning
visitor, both pages served in one session:**

| block | before | after | Δ |
|---|---|---|---|
| transport | 162 | 210 | **+48** ← all of the 44px floor |
| the layers | 143 | **430** | **+287** |
| legend | 255 | 173 | −82 |
| the funnel | 209 | 129 | −80 |
| trails + players | 122 | 59 collapsed | −63 |
| **below the rink** | **1418** | **1685** | **+267** |

**The touch floor cost 48px, and every pixel of it is in the transport.**
Everything else the floor touched was paid for by the trims, which net −225. The
regression is **one block**: five layer rows that each carry a name and a
two-line description where five chips used to carry a name.

⚠️ **The 924px figure assumes one control per row**, and this surface has never
laid out that way — the layer rows go three across at 1100, the funnel four. A
floor computed from a count rather than from a LAYOUT is not a floor.

**So the constraint is not the control count. It is that we chose to describe
every layer**, which is what answered complaint 2 and is the best thing on the
surface. The levers, in order of what they cost:

1. **Shorter descriptions.** Every one wraps to two lines at 390; one line each
   is about **88px** and no structural change.
2. **U3, layer density** — fewer layers is fewer rows, ~86px each.
3. The newcomer *why add a layer* block, 279px on a first visit.

⭐ **AND §9's TEST IS REPLACED RATHER THAN WAIVED.** *"No taller than what it
replaced"* was written before any of this was measured and it cannot be met while
each layer explains itself. The honest successor is **per zone, not total**:

> **Every zone except LAYERS must be no taller than the blocks it replaced, and
> LAYERS' growth must be accounted for line by line.**

That is checkable, it is true today, and it fails the day a zone quietly grows —
which is what the old test was for. A total that is allowed to rise for one
stated reason cannot tell a description from a regression.

What the height bought: every layer says what it counts, every control is
reachable by a fingertip, every note is readable before the press, and the four
ways out are no longer ranked below two cosmetic toggles.

### 11.6 Two things only looking found

- ⭐ **The swatch rule was scoped to `.legend`,** so the marks moved into the
  layer rows and rendered as **squares**. The markup was right, the classes were
  right, and all 715 tests passed. *A shape rule that lives on the container
  rather than on the mark stops applying the day the mark moves* — which is
  exactly what this redesign did to it.
- **The mark column was `auto` in a per-row grid,** so it sized itself per row:
  the two layers that draw no mark had their names sit further left than the
  three that do. The comment beside it claimed the opposite, in as many words,
  because the reasoning for keeping the cell was right and the implementation of
  it was not. Fixed width now, and the comment records the correction.

### 11.7 Speed became a stepper, on Kevin's mechanism

> *"I thought that faster would play at X (default) + 1, then hitting slower
> would move back to X, then, say, slower again would move to X-1, faster back to
> X."*

That is what removes the middle button without losing the middle STATE, which was
the whole objection to `Slower`/`Faster` alone. Two controls, three paces, all
reachable — and it is the idiom the transport already teaches one row up.

⭐ **The end state is the readout.** With no pressed label saying where you are,
the disable says it: both live means the default, `Slower` dead means the
slowest, `Faster` dead means the fastest. Three states, distinguishable, and
**every press changes something visible** — which a bare two-button toggle would
not have given.

### 11.7b Three fixes from Kevin's laptop shot

- ⭐ **FIVE DOES NOT DIVIDE, so the grid left a hole.** Three layer rows across,
  then two, and a third of the second row empty — and a `1fr` grid track holds
  its width whether or not anything sits in it, so the gap is structural at every
  viewport where the column count does not divide five. An empty cell at the end
  of a list reads as *something is missing*, not as spare room. `flex:1 1 290px`
  instead, so the last row's rows GROW into the space and the block ends on a
  straight edge. **A grid is the wrong tool for a list whose length is not a
  multiple of anything.**
- **The three display pickers started at three different x positions**, because
  `Trails:`, `Players:` and `Narration:` are three different lengths and each is
  its own row in the markup, so nothing aligned them. One label column.
- **The game line was floating in the gap between two zones** — centred, in its
  own whitespace, with everything else left-aligned under a heading. It is the
  identity of the game you just watched, and the first two destinations under
  *Watch another game* are that game's two clubs, so it moved to the top of that
  zone instead of sitting adrift above it.

### 11.8 Still open

- **U3 — layer density.** §11.5 is the argument for taking it.
- The newcomer *why add a layer* block is **279px** and is the tallest single
  thing in the LAYERS zone on a first visit. ⚠️ CHENG argued for cutting it on
  the grounds that *"it instructs a reader to press a button using a label the
  button shows only at rest, and the overlay on the ice already does that job
  better."* **That describes the other block.** `#newcomer` carries the press-play
  instruction and sits above the rink; `#newcomerWhy` is the 279px one, it gives
  the REASON to add a layer, and it carries the site's flagship sentence — 2,228
  of 4,100. The duplication he names is real and belongs to the block that is not
  the expensive one.
- At 320 the funnel falls back to one column; 390 and up get two or more.
- `Teaching` is gone as a name. The three paces behind it are unchanged.

---

## 12. Round three — every zone is a disclosure

Kevin, 2026-08-26: *"I like how the Display Options is collapsed by default, can
all of the elements under the rink be the same way? I'd move 'Watch another game'
to below Display Options."* Then, after the counter-argument below:
**"I want LAYERS to be collapsible too, it looks a lot better for consistency."**

### 12.1 The case against, and how it was answered

The objection was **the conversion**. The stated north star is *a visitor
watches one game with one metric layer turned on*, and collapsing the layer menu
puts the one thing the site exists to get someone to do behind a closed drawer.
Everything else down there is reference, navigation or cosmetics — a novice can
complete the intended experience without opening any of it.

Two things were also being overridden, and they should be overridden knowingly:

1. **CHENG's Q1 ruling** — *a key that names a mark AND hides it is worse than a
   permanent legend that was at least wrong in the open.* Still right about a
   KEY. Not an argument about a funnel or a cosmetics drawer.
2. ⭐ **The nine doors.** Verified again before building: `what-you-can-see.html`
   deep-links into this page **nine** times, **eight** with a layer already on
   (whistle ×4, corsi ×2, slot ×1, goaltending ×1). A reader arriving with
   `layer=whistle` would see orange rings on the ice and no visible way to turn
   them off — CHENG's one-way trip, which killed the last wholesale move.

**Kevin's call stands and the objection is answered by mechanism, not by an
exception.** A collapse is safe with two halves, and neither is optional:

- **The summary says what is on inside it** — `2 layers on`. Marks cannot appear
  on the ice with nothing on screen accounting for them. Same principle as the
  speed stepper's disable-as-readout.
- **The zone opens itself when it arrives with a layer on.** Verified in a real
  browser, not only in the fake:

      ?layer=whistle          {"open":true,  "badge":"1 layer on"}
      ?layer=whistle,corsi    {"open":true,  "badge":"2 layers on"}
      (no layer)              {"open":false, "badge":""}

⭐ **The count is DERIVED FROM THE ROWS, not from a list of layer names.**
`[aria-pressed="true"]` on a row *is* the on-state, so a sixth layer is covered
the day it is added, and a layer that stops setting the attribute stops being
counted — rather than a second enumeration that agrees with the rows until
someone edits one.

⚠️ **And the first version of the auto-open could not have worked.** It carried a
*has the reader touched this* flag, guarded by setting `_auto` around the
assignment. The `toggle` event fires for a programmatic change too and **the spec
queues it as a task**, so the guard is already false by the time the handler
runs — and the fake document does not fire `toggle` at all, so the divergence
would have been invisible to `npm test`. The flag was deleted rather than fixed:
the only way to close the drawer is to press its summary, and the only way to
reach a layer row is with the drawer open, so every call arriving with a layer on
and the drawer shut came from boot. Which is the deep link, and the one case it
exists for.

### 12.2 ⭐ The two disclosures are NOT in the collapse

`#rg.unrec .lk-unrec` carries the sentence for the **73 games where the league's
boxscore contradicts the league's own event log**. Its own note in the stylesheet
has said since it was written that *a disclosure a reader reaches only by turning
something on is not a disclosure* — and putting it inside a panel that now starts
CLOSED is that defect with a different lid. Both disclosures were lifted out of
the reference panel when it became collapsible, and a test walks the `<details>`
nesting depth at each one so they cannot drift back in.

### 12.3 The reorder, and why the old reason expired rather than lost

NEXT went above the cosmetics in §7.1 because four real destinations had been
ranked below `Mascot` and `Tabletop`. **Once every zone is a 57px bar, nothing is
meaningfully ranked below a summary.** The reason no longer applies, so Kevin's
ordering costs nothing. Recorded here because the difference between *an argument
overruled* and *an argument expired* is the difference between drift and a
decision.

### 12.4 Measured, returning visitor, real browser

| | baseline `19b7b5b` | after §11 | **after §12** |
|---|---|---|---|
| below the rink, 390 | 1418 | 1685 | **981** |
| below the rink, 1100 | 809 | 1073 | **764** |
| below the rink, 390, newcomer | — | 1941 | **1271** |
| controls under 44px | 21 of 21 | 0 of 21 | **0 of 21** |

**Every zone is 57px closed.** §9's replacement test passes, and so would the
original one it replaced: the surface is now **437px shorter than what it
replaced** at 390 and 45px shorter at 1100, with every control at the touch
floor and every layer describing itself.

⚠️ **§11.5's levers are therefore not needed for height any more.** The one-line
descriptions and U3 remain worth doing on their own merits — five layers is still
five layers — but the height argument for them is gone.

### 12.5 Open, and the next piece

- **The marks section is unbuilt.** Kevin: the list mixes three kinds of thing —
  two shaded AREAS that need a sentence, five MARKS that need only naming, and a
  DISCLOSURE — which is the same defect as §3's *five kinds of control, one
  visual language*, one block lower. Two area cards plus a compact mark strip.
- ⚠️ **The number the copy wants does not exist.** *"79% of goals come from the
  slot"* appears in this document and nowhere else — not in `measures.json`, not
  on any page, not in any published artifact. `measure.mjs` already computes a
  per-game `slot` count over all 4,192 in-scope games but never summarises it.
  **Deriving and publishing it is a precondition for the copy, not a nicety** —
  typing it from this document is the shape that shipped a wrong Corsi count once
  ([[verify-inherited-claims]]).
- ⚠️ **And the blue line's copy has no measurable hook.** Kevin: *"the blue line,
  at least the way I think of it, is more of a contested area, not necessarily
  offside-focused."* He is describing TERRITORY — zone entries fought over — and
  the feed has no territory in it: no passes, no dump-ins, no zone entries, no
  possession. What we hold is EVENTS. So *contested* cannot be measured here, and
  asserting it is the same move as the *"the ice teams fight to hold"* clause
  this round removed. The honest treatment is the one the shading was designed
  on: **the slot is a PLACE and the blue line a THRESHOLD**. Say what the
  threshold is and let the reader draw the inference — *show the distance from
  normal, never supply the inference*.

---

## 13. The marks section — two area cards and a mark strip

### 13.1 Three kinds of thing were in one list

Kevin: *"the existing wall of text just doesn't look good… if we are doing
cards, then I think this area should be consistent with that approach."* What
made it a wall was not the wording:

| | |
|---|---|
| the slot · either blue line | shaded **AREAS** — need a sentence |
| home shot · visitor shot · puck · goal · blocked | **MARKS** — need only a name |
| the teams switch ends | a **DISCLOSURE** — no swatch at all |

**Same defect as §3, one block lower**: five kinds of control wearing one chip.
The areas get the card the layer rows get, because they carry the same shape of
content. The five marks stay a compact strip, because a card around *home shot*
is a box around two words. The disclosure left the panel in §12.

### 13.2 ⭐ The number did not exist, so it was derived first

The legend had only ever said WHERE the slot is — *within 33 ft of the net,
between the dots*. That is a definition, not a reason. **The reason is the share
of goals scored from inside it, and that figure was in no published artifact at
all** — not `measures.json`, not any page — while §7.2 of this document quoted
*"79% of goals"* as though it were settled. [[verify-inherited-claims]].

`measure.mjs` was already running `danger.js` over every in-scope game and
throwing the goal placement away. It now carries `goals: {slot, placed,
unplaced}` per game, and `archive.js::slotShare` publishes it.

⭐ **The denominator is PLACED goals, not all goals.** A goal the feed gives no
coordinate for is neither inside the slot nor outside it; counting it below the
line scores it as *not from the slot* and biases the share downwards. `unplaced`
is published beside the rate. The test blinds a **real** goal's coordinates —
the exact thing the feed does to us — rather than synthesising an event.

⭐ **And the card COMPUTES the sentence.** A typed constant would go stale on the
next re-derive with nobody ever seeing it happen, so the card reads
`RATES.slot` and **says nothing at all** when there is none — a single-game page
never asks for the archive, and a derive that has not run has no share to give.
Both keep the geometry and lose the clause. Mutating it to fall back on a
constant reddens the test.

### 13.3 The blue line — Kevin is right and the feed cannot see it

> *"the blue line, at least the way I think of it, is more of a contested area,
> not necessarily offside-focused."*

**His reading is already ratified in the source.** `drawRink`'s own comment,
written when the shading was built, records his earlier wording — *offense wants
to hold play in, defense wants to keep play out, a battleground if you will* —
and then the finding that matters: **only 6.2% of located plays fall within five
feet of a blue line, but holding the line produces NO RECORDABLE EVENT.** The
feed records where countable things happen, not where the puck is contested.

So *contested* cannot be measured here, and asserting it is the same move as the
*"the ice teams fight to hold"* clause §11.3 removed. The card states the RULE,
which is the league's (**NHL Rule 83**, already cited by `whistle.js` — looked
up, not typed), and then states the limit, which is ours:

> We count nothing here. Holding the line leaves no event in the record, so the
> feed is silent about the thing that makes it matter.

**Doctrine §3 — honest limits stated ON SCREEN.** It is also what makes the pair
of cards teach something: one region is where the goals come from and we can
prove it; the other is where the game is decided and we cannot see it. A test
forbids `contested|battleground|fight|fierce` in that card, so the next edit
cannot quietly reach for the assertion.

### 13.4 The archive answered: **75.4%**, and §7.2 was wrong by four points

`derive.yml` walked all 4,192 in-scope games and published it:

    slot share   19,304 of 25,597 goals = 75.4%
    unplaced     0     — every goal in the archive carries a coordinate
    cross-check  n == attemptMix.byType.goal, exactly

Live on the page, computed: *"75% of goals are scored from inside it — 19,304 of
25,597 across the archive."*

⭐ **§7.2 of this document said 79%.** It came from an ad-hoc census taken during
the base-layer work that cannot be reproduced, and it had been sitting here
reading as settled. Four points, one hop from being typed onto a page. The
published figure is authoritative because it is the SHIPPED rule (`danger.js`)
run by the SHIPPED reducer over the whole archive, and because its denominator
agrees exactly with a count derived by a different path.

⚠️ **The rest of that census is equally unverified** — 56.8% of attempts from the
slot, 8.2%/3.3% at the blue line. None of it is published. Do not quote it.

---

## 14. Round five — two controls out, and the marks stop being a paragraph

Kevin, 2026-08-26: *"For display options, I vote to remove players and narration
(and then do something different with Trails, since it'll be the only item in
that section). Under Watch another game, the current game needs to be specified
as such… We still have the additional text in that area we need to do something
with."*

### 14.1 The removals, and what was inside the containers

**Narration.** `labelsOn` gated the ice naming every event. It is gone; the ice
always names. ⭐ **The caption pill's goal branch survives, which is why this was
a deletion and not an orphaning.** Turning labels off used to be the only state
where the pill announced a goal — and the guard is `!place(cur)`, where `place()`
returns nothing for a **shootout** event. So the branch is still reached on the
~6% of games decided in one, and the test that covers it now boots the shootout
fixture instead of pressing a control that no longer exists. **Enumerating that
before the removal is what made the removal safe** — it was written down two
rounds ago as the reason not to delete casually.

**Players.** ⭐ **`figTabletop` is not dead code.** `src/goalie-eye-view.html`
offers both figures and carries its own copy of the module, so the alternative
has a live caller and a live test — asserted, so a future reader cannot take this
removal as licence to delete it. What went is the control and the cross-page
`rtg.fig` preference: **a setting made on another page, applied here through a
control this page no longer has, is state nothing on screen accounts for.**

### 14.2 Trails is alone, so the zone is named for it

Not *Display options* with one item in it. The summary is **TRAILS** and it
carries its setting as a badge — the rule the layer menu established when
everything collapsed: *a control you cannot see must still be able to say what it
is doing.* ⭐ **The badge quotes the pressed button's own label** rather than
re-deriving one from `trails`: the label is `Keep every mark` in one-direction
and `Keep this period` under as-played, and two spellings of one state is how a
readout starts disagreeing with the control it reports.

### 14.3 The marks stop being a paragraph

Five marks set as a wrapping flex line read as prose that happens to contain
dots. A grid gives every mark the same left edge and its own row, so the block
scans as a key. `auto-fit`, because five does not divide here either.

⚠️ **And it shipped a rendering bug that only looking found.** The row is a flex
container, so the `<b>` in *"where the puck was **stopped**"* became a flex
**item** — with the text either side forming two more anonymous ones — and the
emphasis flew to the far right of the row. Markup valid, rule valid, 723 tests
green. The label is its own element now, so the flexing is between the swatch and
the label rather than between the words. **Third defect in this redesign found by
rendering it, and all three are CSS that is individually correct and situationally
wrong.**

### 14.4 The game line says which game

Under *Watch another game*, a bare `CAR at VGK · 14 June 2026` reads as one of
the games on offer — and it is the one date on the page a reader has no reason to
attach to what they are watching. It gained a **NOW WATCHING** label.

⭐ **The label is a sibling, not a rewording.** `#gl`'s text is what the deploy
gate greps out of the live page and `shell.test.js` pins the two together, so the
line itself is untouched and the gate keeps matching what it always matched. A
test asserts the label did not leak into it.

### 14.5 Measured

    below the rink, 390     981px   (baseline 1418 at 19b7b5b)
    below the rink, 900     760px
    below the rink, 320    1040px   no side-scroll
    controls below the rink   17    from 21 — the two pickers took four buttons
    under 44px                 0 of 17

## 15. The layer menu moves above the rink

Kevin, 2026-08-26: *"it's just so disjointed from the rink that toggling a layer
on and off creates a UX disconnect, and I'd like to see it above the rink to see
if it helps."* The control was 760px below the thing it changed on a phone, so
pressing it moved marks a reader could not see.

Moved to sit between the scoreboard and the ice.

### 15.1 Moving it was not enough — it read as a caption for the ice

The zone treatment is section-heading language: a full-width rule, a muted
uppercase label, then the thing it heads. Directly above the rink card that
reads as a **title for the rink** — at 1100 the label sits over the ice with its
caret 1,600px away at the far end of a rule, and nothing says it is pressable.

So this one zone drops the rule and takes the same white card as the board and
the rinkbox. Three stacked cards: **scoreboard, layer bar, ice.** It is a bar you
can obviously press, sitting on the surface it acts on.

### 15.2 ⭐ The auto-open had to go, and POSITION is what replaced it

§12 made every zone a disclosure, and that was only safe with two halves: the
summary reports what is on inside it, and **the zone opens itself when a deep
link arrives with a layer on** — eight of the learn page's nine doors do.

Above the rink the second half is destructive. Measured at 390 with
`?layer=whistle`:

    the opened list          600px tall
    rink top                 y=830        — the ENTIRE first screen is the menu
    play button              y=1199       against a fold of 844

A visitor coming through a door met a page with **no ice on it at all**.

The auto-open existed for exactly one reason: the menu sat at y=1219 on a phone,
so a shut drawer put the only way to turn a layer off far below the fold —
CHENG's one-way trip. That reason is gone. The menu is now the third element on
the page:

    390, first visit    menu y=459    rink y=513    play ends 801   (fold 844)
    390, returning      menu y=222    rink y=276    play ends 564
    ?layer=whistle,390  menu y=222    rink y=276    play ends 645   badge "1 layer on"

**On screen without scrolling in both visitor states, with the badge naming the
layer on its face.** Reachability no longer depends on the drawer being open, so
the half that made the collapse safe in one position is the half that had to be
dropped in this one. The badge is what travels.

### 15.3 The pitch could not follow, so it names the control instead

`#newcomerWhy` — *"Why add a layer? Because the obvious reading of a game is
often the wrong one"* — is the half of the greeting that sits beside the layers.
It is **279px tall at 390**: above the ice it would have put the play button at
y=1036 against a fold of 844, which is the exact defect that split the greeting
in two in the first place (§11 of `docs/ten-second-hero.md`).

So the halves are no longer adjacent, and the paragraph carries the one thing
that survives a layout change — **the control's own label, quoted verbatim and
never its position**, the same way the other half quotes `▶ Play from start`. A
test reads the label out of the built summary rather than restating it, so
renaming the control fails the test instead of quietly staling the sentence.

### 15.4 What it cost, and what is still open

    rink top at 390, first visit     459 → 513   (+54px)
    rink top at 1100, first visit    374 → 428   (+54px)
    play button, 1100 first visit    below an 844 fold by 110px (was 56)
    deep link at 390                 rink y=830 → y=276

⭐ **Opening the menu at 390 still pushes the ice off the screen** — the list is
554px of rows and there is nowhere for it to go. Below the rink that cost
nothing visible; above it, it is the trade. It is a deliberate press rather than
something a link does to you, and the two-across layout already collapses it at
1100. Whether the rows need a denser phone form is open, and is the same
question as U3 (layer density).

## 16. The rows trim to their names

Kevin, minutes after §15 shipped: *"maybe trim the metrics cards to just the
name and leave the description to be displayed on the metric, after it's opened,
that'll free up space."*

    off row                     80px → 49px
    the five descriptions            159px of a 600px drawer
    drawer open, nothing on     ?    → 348px at 390 (178 at 1100)
    rink top, drawer open       830  → 578 at 390 — the ice is back on the screen

### 16.1 ⭐ It reverses a rule this document ratified the day before

§4.2 and §13: *a note about the ICE fires when the ice shows it; a note about a
CONTROL is available before it is pressed.* `.lds` — what a layer counts — was
the control note, and it is now deferred to the press along with `.lon`.

**What makes the reversal safe is that the original defect was never "explained
late", it was "explained nowhere".** §7.2 was five chips with no room for a
sentence anywhere on the surface. The description now arrives on the press, in
the row the reader is already looking at, one reversible tap away — and the
press is what the drawer exists to invite.

### 16.2 What is NOT safe is a name a reader cannot use

With the descriptions deferred, **the name is the whole choice.** Four of them
survive that: *Shots from the slot*, *Goaltending*, *Why play stopped*, *Blocked
shots*. One does not — `Control (Corsi)` is jargon twice over, and pressing a
thing to find out what it means is choosing blind.

So that row's name carries its own definition: **Control (Corsi) — every shot
attempt**, and its description keeps the detail (*on goal, missed, or blocked*)
for the press. A test pins that name; mutating it back to the bare metric name
fails.

⭐ **And there is no word-count rule on the other four**, which is worth
recording because the first draft had one and it failed on `Goaltending` — a
name that reads perfectly. A count of words is not an instrument for legibility:
it passes any two-word jargon pair and fails a clear one-word noun. The
assertion that survived is about one specific name that could not carry itself,
because that is checkable; *is this name readable* is not, and pretending
otherwise is how a check that measures nothing ships as coverage.

### 16.3 ⚠️ The instrument lied first, and the CSP is why

The first run of this measurement reported **`name-only saves 0px`** — the probe
injects a `<style>` element and re-measures. It was pointed at
`https://readthegame.co`, whose CSP has no `unsafe-inline` for styles, **so the
browser dropped the rule and the page was measured unchanged.** No error, a
plausible number, and it argued against Kevin's idea. The same probe against the
local build — where `tools/pixels.sh` strips the CSP — returned 159px.

**A probe that MUTATES the page cannot run against production**, and the failure
is silent in exactly the direction that reads as "your change does nothing".

## 17. The state becomes a switch

Kevin: *"I was thinking of the Metrics layers buttons as just toggles."*

A pill reading **OFF** is a label that has to be read and then mapped to an
action. A switch is the one control shape that says both what it is and what
state it is in without a word, and five of them stacked read as a settings list
rather than as five competing buttons — which is the *"they need some work"*
complaint.

⭐ **The word did not go away, it went into the accessibility tree.** The track is
`.st`, the knob is its `::after`, and the text `lyrState` writes is **clipped
rather than deleted** — so a screen reader still hears *On* / *Off* beside
`aria-pressed`, and the existing assertions still describe something real. A
visual-only state is this control shipping broken for the reader who cannot see
the knob move. Four stylesheet claims are pinned, including the
`prefers-reduced-motion` guard, and each was mutated to see it fail.

The knob travel is derived from the three numbers above it — track 44, knob 18,
inset 3 — rather than eyeballed.

**And the switch aligns to the NAME, not to the row.** `align-self:center` is
correct while every row is one line; with a layer on it floated halfway down a
194px block, level with a sentence instead of with the thing it switches.

### 17.1 The 194px row is the open question

    row, off      50px
    row, ON      194px   ← name + what it counts + what the ice is doing

The row with a layer on is four times the height of the others, and the drawer
it sits in is above the rink. That is the *"description wording being integrated
into the layer, as a type of intro to the layer (somehow)"* half of Kevin's
note, and it is not answered yet — see the thread.

## 18. CHENG's review of §15–§17 — three refuted, one right

Kevin sent the expanded drawer to CHENG. Measured live at `ea62777`, on
readthegame.co, in both visitor states at 390×844 and 1120×974:

### 18.1 "The decisive question is the default state" — it ships COLLAPSED

> *If it ships expanded, the contradiction is live on first paint.*

    drawer open=false   in all four states measured

His own condition for the objection dissolving is met. The screenshot he was
given is of a drawer someone opened.

### 18.2 "At 390 the ice starts around y=690" — it starts at 513, or 276

    390, first visit      menu y=459   RINK y=513   play y=757   (fold 844)
    390, returning        menu y=222   RINK y=276   play y=520

The figure was extrapolated from a desktop screenshot of an opened drawer. With
the drawer open at 390 the rink top is 583, still not 690. **The play button —
the thing the header tells a novice to press — is inside the fold in both
states**, which is the check this surface has failed before.

### 18.3 "The reserved mark column looks like it did not survive" — it did

    every row, both widths:   name is indented 46px from the card's left edge

`Control` and `Goaltending` carry no swatch and their names start at exactly the
same x as the three that do. The fix from §7 survived the move.

### 18.4 ⭐ `Goaltending` — he is right, and the near miss is the lesson

> *It could mean saves, save percentage, the goalie's positioning, anything.*

Correct. §16.2 claimed one name could not carry itself; it was two. Now
**Goaltending — every shot faced**, with *and what became of it* held for the
press.

⭐ **The first draft of the test caught this row and I threw the catch away.** The
word-count rule failed on `Goaltending` — the right row, for the wrong reason —
and §16.2 records removing it as a bad instrument, which it was. What it does not
record is anyone asking *why did it fire here*. **Killing a check that measures
the wrong axis is right; discarding the case it happened to land on is not.** A
bad instrument pointing at a real defect is still pointing at a real defect.

### 18.5 Where the four sentences went: nowhere

They are in the same rows, revealed by the press — not filed into the reference
zone. The split he was watching for did not happen.

## 19. And it belongs BELOW the ice, not above it

CHENG, on the §15 move, and Kevin agreeing:

> The instruction says watch first. The layout says decide first. A novice
> following the header has to scroll past five decisions to reach the thing they
> were told to do.

The page header is **LEARN TO READ HOCKEY · EVENT BY EVENT FIRST, ADD METRICS
AFTER**. Five controls between that sentence and the ice make the layout
contradict the copy, and the copy is right.

### 19.1 The two candidate positions, measured at 390

    A  after the transport      menu y=688   play ends 510   236px from the ice
    B  directly under the rink  menu y=464   play ends 568    12px from the ice

**A is where it was when Kevin called it disjointed** — the 236px is the
transport, which is exactly the gap he was describing. B keeps the adjacency
that the whole move was for, and puts it after the game rather than before it.

**The cost of B is 58px on the play button, and it stays inside the 844 fold in
both visitor states.** The ice returns to y=222 on a return visit and y=459 on a
first — the same place it was before any of this started.

### 19.2 ⭐ And it fixed the thing §17.1 left open, for free

    drawer OPEN, nothing on:   rink top 222 at 390  ·  231 at 1100

**Opening the menu no longer moves the rink at all.** Above the ice, expanding a
drawer pushed the whole game down the page; below it, the ice is upstream of the
control and cannot be moved by it. §15.4's *"opening the menu at 390 still pushes
the ice off the screen"* is closed — not by shortening anything, but by putting
the control on the downstream side of the thing it changes.

That is the general form worth keeping: **a control that grows belongs after the
thing it acts on, or its growth is paid for by its own subject.**

### 19.3 Both halves are pinned

Each position broke on its own, so one assertion cannot describe the rule:

    board < rink < menu     the header says metrics come after
    menu  < transport       or it falls back into the 236px gap

Mutated in both directions; each fires its own message.

## 20. ⏸ Parked back to the base page

Kevin: *"let's just remove all the extra stuff, for now, then we can rebuild
properly. Just have the header, scoreboard, rink, play controls and then the
footer. We need to start fresh on the layers, we're just spinning our wheels."*

    390, returning     pagelede · board · rinkbox · transport · disclose · next
    390, first visit   + the greeting                                doc 1371px
    1100, returning                                                  doc 1189px

**Parked:** `.zlayers`, `.zref`, `.zdisp`, `.nwhy2`.
**Kept:** the greeting (it is the instruction the header's promise makes), the
verdict card, both `.disclose` lines and the footer nav.

⭐ **The two disclosures are doctrine, not furniture** — ends switching, and the
games whose boxscore contradicts the event log. They are the page telling a
reader what it is *not* showing them, and parking them would be a different
decision than the one that was asked for. A test asserts their absence from the
parking rule, because **absence from a list is invisible in review.**

### 20.1 ⭐ Nothing was deleted, and the doors still work

Every block still ships and every handler still runs, so the rebuild starts from
working code rather than from `git log`. Two CSS lines are the whole mechanism.

`what-you-can-see.html` enters this page **nine** times, **eight** with a layer
already on. A menu hidden outright makes every one of those a one-way trip —
marks on the ice, nothing on the page able to turn them off. So `zoneState` puts
`anylayer` on the root whenever a row is pressed and the menu comes back: **a
control that appears exactly when it has a subject.** Pinned in both directions
and mutated three ways.

### 20.2 ⚠️ A rule that read as if it parked a block, and did not

`#rg .nwhy2{display:none}` is (1,1,0) and `#rg.newcomer .newcomer{display:block}`
is (1,2,0), so **the 301px pitch stayed on the page through a rule that looked
like it had removed it.** It shipped that way and only the render showed it —
the same family as §7's swatch scoped to `.legend`. The test asserts the
*winning* selector, because the losing one is what passes review.

### 20.3 Open, for the rebuild

* The header still says **ADD METRICS AFTER** and the base page now offers no way
  to add one. The copy is right and the page is temporarily short of it.
* The five descriptions and the five on-the-ice notes are parked in the markup,
  enumerated in the stylesheet, and still have no home. That is the rebuild.

## 21. One row, one active item — the selector

Kevin: *"build the one row, one active item and place it right below the
scrubber."* And CHENG's question first, which is what made it one row.

### 21.1 ⭐ "One at a time" is a measurement in this repo

Counted over every layer link the site ships:

    layer=whistle 5 · layer=slot 4 · layer=corsi 2 · layer=goaltending 1
    layer=<two of them> ....... 0

Twelve curated links — the nine doors on `what-you-can-see.html` and the rest,
each one a place where we chose the clearest way to show something — and **not
one turns on two layers.** `deeplink.js` has been able to join tokens on a comma
the whole time and we have never used it.

So: a selector, not five switches. `role="radiogroup"` with `aria-checked`,
because one-of-N is what a radio group *means* — a screen reader announces
"3 of 6" instead of six unrelated buttons that happen to interlock.

**`Nothing` is a real choice**, first on the row: it is the base view §6 is built
on, not the absence of a choice.

### 21.2 The row is a VIEW of the five booleans, never a sixth variable

`syncPick` reads `corsiOn … blockOn` and remembers nothing. Every path that
changes a layer already ends in `lyrState`, so the row follows the deep link, the
selector and the parked menu alike. **A `current` variable set alongside the
booleans is the drift-alarm-built-from-its-own-model defect**: it agrees until
one path forgets it, and then it is confidently wrong.

### 21.3 Measured

    390    two rows (six chips need 533px of line, a phone has 342)   rink y=268
    700    one row                                                    rink y=268
    1100   one row                                                    rink y=265
    controls under the 44px floor: 0 at 700 and 1100, and at 390 only the
    on-ice `pressplay` overlay, which is pre-existing and aria-hidden

⚠️ **The chips were 38px in the first draft** and the probe counted six controls
under the touch floor where the page had none — a silent give-back of the
21-of-21 → 0-of-17 result §9 was measured on. 44px now, pinned by a test.

### 21.4 What the mutations caught

* `assert.equal(on.length, 1)` for a two-layer URL **could not fail**: a build
  that fell back to `Nothing` also checks exactly one chip. The claim is not
  *one chip is lit*, it is *the lit chip is a layer that is ON*.
* The selector block first sat next to the markup it draws — but `zoneState()`
  runs at boot one line below its own definition and calls `syncPick`, so
  `let picking` was still in its temporal dead zone. **180 tests, one error.**

## 22. One headline, two pages

Kevin: *"let's have the same header on the game page as we do on the front page,
for consistency."* The sentence lived in `build_index.py`, so consistency would
have meant two authors keeping two strings in step. It is now `P.SAYS` in
`builders/page.py`, beside the chrome both pages already share, **and the test
compares the two BUILT pages** — a check that read the constant and found it in
both would pass for a build where the game page hard-codes its own copy.

⚠️ `str.replace` cannot fail, it just does not happen, and a `__PLACEHOLDER__`
has shipped from this builder before. The substitution is now asserted **in the
builder, where it is made**, and again on the artifact.

### 22.1 Same words, not the same size

    front-page size on the game page   headline 286px   rink y=466   play off the fold
    sized for this page                headline  85px   rink y=268   play ends 556

The front page's job is to explain to a stranger; the game page's job is to show
a game. 286px of explanation above the ice puts the play button off a phone
screen — the same defect that split the greeting in two. One rule sets it and
deleting that rule makes them identical.

### 22.2 ⚠️ A comment matched before the markup did — the fourth time

`game.html` carries a comment that quotes `<h1 class="says">` while explaining an
earlier decision, and the headline check read the prose about the markup instead
of the markup. Comments stripped first, as in three other checks in this repo.

## 23. The header was the OTHER header, and `Nothing` was a false label

Kevin: *"I misstated what I was looking for. I was referring to the topmost
header on the page, the area with Watch a game, Teams, By Date, etc."*

So §22 is reverted: the game page carries its own lede again — *Learn to read
hockey · event by event first, add metrics after* — and takes **the full site
nav** instead of the two-link `minimal` header.

⭐ **That overrules CHENG's `minimal` ruling, and the override has a reason.**
His argument was about the FUNNEL: the moment that converts is when the game
ENDS, at peak curiosity, which is below the rink. A nav is not a funnel — it is
five destinations, and **a game page reached from a shared link is the one page
on this site a stranger is most likely to land on with no way back to the rest
of it.** `minimal` stays in `page.py`, now unused.

**The test compares the game page's header to the front page's**, rather than
carrying its own list of five links — a typed list passes the day someone adds a
sixth to `_NAV` and the game page quietly ships four of six.

⭐ **The marker guard from §22 was kept.** The shared-headline experiment was
reverted; the assertion that no `__PLACEHOLDER__` survives substitution was the
half of it worth keeping, in the builder and on the artifact.

### 23.1 `Nothing` said the page was blank while it drew the whole game

Kevin: *"it's not really 'Nothing', shouldn't that say 'Just events'?"*

Right, and it was a false claim about the screen. With no metric on, the rink is
still drawing **every recorded event** — that is the base view §6 is built on and
the exact thing the header tells a reader to watch first. `Nothing` described the
LAYER state and lied about the PAGE. The internal token stays `none`, because no
*layer* is what it means. A test forbids `nothing|none|off` as that label.

### 23.2 The longer label cost a row, and the label got its own line

    inline label     390: 3 rows   700: 2 rows   1100: 1 row
    label own line   390: 2 rows   700: 1 row    1100: 1 row

`WATCHING` is 90px of a 342px phone line and `Just events` alone is 111. On its
own line it costs ~20px at 1100 and pays for itself at every width below.

    390   rink y=282   play ends 570   ·   1100  rink y=231   play ends 756

## 24. CHENG on the selector — one fix, and the taxonomy question answered

### 24.1 `Goalies` went back to `Goaltending`

> *It names a position, not a metric.*

Right, and the short form was mine rather than Kevin's — his list said
*Goaltending*. It cost nothing: with the label on its own line the row is still
two chips deep at 390 and one from 700 up.

`Stoppages` is Kevin's own word and stays. CHENG's objection — that *Why play
stopped* was plain English naming a question a viewer actually has — is on the
record for when the descriptions get their home.

### 24.2 ⭐ "Slot and Blocked are subsets of Attempts" — one is, one is not

This is checkable and it decides the facet model:

    ATTEMPT_TYPES  goal · shot-on-goal · missed-shot · blocked-shot   ← corsi.js
    SHOT_TYPES     goal · shot-on-goal · missed-shot                  ← danger.js

**Blocked IS a facet of Attempts.** `blocked-shot` is one of the four types
Corsi counts, so *Attempts → blocked only* is an honest refinement.

**Slot is NOT.** `danger.js` runs on `SHOT_TYPES`, which excludes blocked shots
deliberately: a blocked shot's coordinate is *where the puck was stopped*, not
where it was taken — median **24.2 ft against 33.4** over an 80-game sample,
while the point shot is the most-blocked shot in hockey and the blue line is
~64 ft out. Nesting the slot under Attempts would hand it a population it
measurably must not use.

So the facet model nests one correctly and one wrongly. If refinements happen:
**`Attempts → [all types] [blocked only]`, and Slot stays a peer.**

### 24.3 The distance, measured

> *Call it 300px … toggle a layer and the change happens at the top of the
> viewport while your eye is at the bottom.*

    390    ice ends y=429   selector y=748   gap 319px from the ice, 236 from the card
    1400   ice ends y=615   selector y=823   gap 208px from the ice, 126 from the card

His 300 is right at 390. But the question that matters is whether both are on
screen at once, and they are:

    ice top 282 → selector bottom 843, against an 844px phone viewport

**By one pixel**, which is not a margin to design on — on a 700px visible
viewport the selector is one short scroll down, after which the ice is still in
frame. Worth knowing before anyone moves it again.

### 24.4 Still open, deliberately

Does anyone want two layers at once? The evidence in §21.1 says we never have —
twelve curated links, zero combinations. The selector assumes that answer. The
one combination CHENG names as obvious, *Attempts + Slot*, is also the one the
reducers say is not a subset relationship. Kevin's call.

## 25. Flush chrome, a rule in the row, and one layer at a time

### 25.1 The header goes flush on every page

Kevin, comparing the two: *"I much prefer the no padding, it tightens up the top
of the page, which looks better than the home page, let's default to that."*

The game page had never carried the site's body rule — it ran on the browser's
default 8px margin — so the same header sat flush there and **44px down, inset
22px** everywhere else.

⭐ **The padding is MOVED, not deleted.** `body{padding:0}` on its own runs text
into the viewport edge on a phone, which is the version of this change that looks
tidy in a diff and is wrong on the device that matters. `.wrap` takes it, so the
chrome goes edge to edge and the content keeps its gutter.

### 25.2 ⚠️ The test read the wrong `body` rule and passed

The first version took **the first `body{…}` match** and found the shared
chrome's `body{margin:0}` — which has no padding, so it passed while the page's
own rule two blocks later carried 44px. **Mutating the padding back in changed
nothing, and that is how it was found.** Every `body` rule is checked now.

Then the fixed version fired a false positive on `padding:0` *as the last
declaration in the block* — `/padding:(?!0[;}])/` has no `;` or `}` to look
ahead at, because the capture stops before the brace. **The value is parsed
now:** a regex that has to know where a rule ends is doing the parser's job
badly.

### 25.3 A rule between the base view and the lenses

Kevin: *"should we have a faint vertical line between Just events and the others?
That'll differentiate the two distinct sets of toggles."* Two kinds of thing in
one row — the game as recorded, and five lenses over it — which is §3's *five
kinds of control, one visual language* in miniature.

⭐ **It is a flex item, not a `::before` on the next chip.** The row wraps at 390;
a pseudo-element on `Attempts` would hang at the left edge of whatever line that
chip happened to start. A real item wraps with the chips. `aria-hidden`, so it is
not announced as content.

### 25.4 One layer at a time — settled, and cheap to reverse

Kevin: *"let's leave it as only one layer at a time, with some thought given to
how we would add two or more layers at the same time."*

⭐ **The mechanism already supports N; only the control is one-of-N.** The state
is five independent booleans, every reducer runs on its own, and `deeplink.js`
still parses a comma list — `?layer=corsi,slot` draws both today, and a test
asserts the row shows one of the two rather than going blank. So combinations
are a CONTROL change, not a model change. Mechanism, not policy.

If they are ever wanted, §24.2 says what the shape must be: **`Attempts → [all
types] [blocked only]` as a refinement, and Slot as a peer**, because the slot
reducer excludes blocked shots by measurement and cannot be a filter over what
Corsi counts.

## 26. Three "watching" headings became one

Kevin, with a screenshot of `WATCHING` / `WATCH ANOTHER GAME` / `NOW WATCHING`
inside 220px: *"somewhat cumbersome when reading top to bottom… could we put the
current game info into the scoreboard? then we could remove that small section,
then the section header could be changed to 'More games', or 'Other games'."*

Done. The game line is a caption row in the board, `.nowplay` and its label are
gone, and the zone is **Other games** — which reads better than *More games*
beside buttons that already say *More CAR games*.

    headings now:  Watching · Other games        (was three saying "watch")
    board          87px → 117px at 390, rink y=304
    doc            unchanged — the block below paid for the row above

⭐ **It is not duplication.** The board already shows both clubs, but nothing in
it says which one is HOME — left and right are screen orientation, and under
as-played they swap every period. *CAR at VGK* states the relationship and the
date states the day, which is exactly what a reader arriving from a shared link
is missing.

### 26.1 ⚠️ `#gl` keeps its sentence, because a gate reads its grammar

The deploy step greps `id="gl"` out of the live DOM and matches **AWAY at HOME**
against an em-dash placeholder to decide the shell booted at all. That property
was given to it after a gate keyed to the word `final` failed a working site —
structural, no prose in the path. **Moving the element is safe; rewriting its
sentence is not**, and a test pins both the grammar and the placeholder.

### 26.2 ⚠️ The heading test asserted the wrong thing and passed

First version: `assert.doesNotMatch(zone, /watching/i)`. Renaming the zone back
to **Watch another game** did not fail it — that is `Watch`, not `watching`.
Found by mutation.

**What Kevin reported was a COUNT**, not a property of one element: three
variants of one word stacked in 220px. So the count is what is checked now,
over every heading on the page, and the failure prints the whole list.

## 27. ⭐ Where the layer's information lives

Kevin: *"I think we now can figure out where the layer information lives (once
the toggle is selected)… I've (we've) struggled with that."*

**The selector had already answered it and we had not noticed.** Every home we
tried failed for the same reason: five layers could be on at once, so five notes
needed somewhere to sit, and every candidate was either far from the ice or grew
the page by five blocks. **One active choice makes it one line.**

    WATCHING
    [Just events] │ Attempts · Slot · Blocked · Goaltending · Stoppages
    ▏Attempts — every shot attempt the league recorded: on goal, missed, or
    ▏blocked… The counters beside the rink fill in as the replay runs.

### 27.1 Under the selector, not under the ice — and the division is the point

* **this line says what the LENS is** → beside the control that picks it
* **the panels say what it is showing NOW** → beside the ice, where they already are

Pressing a chip therefore changes something inside the reader's own line of
sight even when the rink is off screen, which answers CHENG's control-to-effect
distance where it actually bites rather than by moving the rink.

### 27.2 The words are READ from the parked rows, never retyped

`.lds` and `.lon` have shipped hidden since §20; this is their home. So nothing
was rewritten, the parked markup stops being dead weight, and **a test compares
the caption to the row it came from** — which a second copy of the sentences
could never be checked against.

⭐ **And `Just events` gets the base key at last**, built the same way from the
parked legend: home shot · visitor shot · puck · goal · blocked. Those marks
have had nothing naming them since §20, and the base view is the thing the
header tells a novice to watch first.

### 27.3 What the render and the mutations caught

⚠️ **A 1,166px line inside a 390px phone.** The legend's markup has no whitespace
between entries and each is `nowrap`, so pasting its `innerHTML` produced one
unbreakable run and the body scrolled sideways. Inline boxes with nothing between
them offer no wrap opportunity; joining with ` · ` puts one back.

⚠️ **Two descriptions were written as the second half of a name that no longer
exists** — *"on goal, missed, or blocked: all three count"* was the continuation
of `Control (Corsi) — every shot attempt`, and read as a definition once the
caption supplied its own subject. Both are standalone sentences now.

⚠️ **The caption named the row, not the chip.** The parked rows still carry
`Corsi` and `Slot shots`; the chips say `Attempts` and `Slot`.

⭐ **AND THAT ASSERTION COULD NOT FAIL, THREE TIMES OVER.** The mutation applied,
the suite stayed green, and the reason is the sharpest instance of the mirror
rule this project has hit: **the fake's chips had an empty `textContent`, so the
test compared the fake's empty label against the fake's empty output** and
matched. The expectation and the code under test came from the same empty
source. The fake now reads each chip's real label out of the built page — and
only then did the mutation go red.

⚠️ **And a transport test broke because a NEIGHBOUR moved.** It matched
`<div class="transport">…<p class="verdict"`, so inserting the caption between
them failed a test about the transport. It is anchored on the transport's own
last child now.

### 27.4 ⚠️ The caption shipped a side-scroll at 360, and the gate caught it

`nowrap` on each legend entry — so a swatch could not be orphaned from its name
— produced **362px of content in a 345px layout viewport**. The deploy gate's
*the pages fit a phone* step failed on it, after this laptop had reported *fits*
at 390.

    with nowrap      345px → scrollWidth 361      320px → 360
    without          345, 360, 390, 320 → fits, in four faces and 32 combinations

**The swatch could not be orphaned anyway**: `<i></i><span class="kn">name</span>`
has no whitespace between the two, so there was never a wrap opportunity after
the mark. The thing `nowrap` was protecting was already structural.

⭐ **A layout that needs `nowrap` to look right is one font away from
overflowing**, and the unit suite cannot see a font. So the rule the test pins is
not a width — it is that **nothing in this block is unbreakable**, which is
checkable at build time and is the property that actually failed.

And the reason it reached production: **every measurement I took was at 390**,
where it fits. The gate measures 360 into a 345 layout viewport. When a block's
content is text of unknown length, 390 is not a test.

## 28. ⏸ Every layer's output is parked, and the chips are one size

Kevin, 2026-08-27: *"let's hide (not remove, but temporarily hide) the layer
information that comes up when each selector is active… I don't think we are
displaying that information in an intuitive way and want to start fresh on how
and where we display the metrics/information."* And: *"I like the description
under the selector, that works."*

So the control and its caption stay; **the display each layer produces goes**:
the counters and the split bar, the goaltender cards, the whistle and blocked
panels, the amber tip, and *Show me the work*.

⚠️ **What that costs, said out loud.** `Attempts` draws no mark of its own — the
counters WERE its display — and `Goaltending` builds cards. With this parked,
choosing either changes the caption **and nothing else on screen**. `Slot`,
`Blocked` and `Stoppages` still change the ice; verified in a browser, the
whistle layer still drew its four restart rings.

### 28.1 ⭐ The parking rule only works because it comes LAST

`#rg.corsi .counters{display:flex}` is (1,2,0) and so is the rule that parks it.
**The later one wins, and that is the entire mechanism.** Move the block up the
file and half of it silently stops applying — the *CSS that is individually
valid and situationally wrong* defect, for the fourth time in this project.

Nothing about specificity says so, so the **position** is what the test asserts:
each reveal rule's index must be less than the parking rule's. Mutated by moving
the block to the top of the stylesheet, which is still valid CSS and inert.

### 28.2 One size for every chip

    Just events 124 · Attempts 124 · Slot 124 · Blocked 124 · Goaltending 124 · Stoppages 124

    390: three rows (was two)   700: two   1100: one
    32 width × state × layer combinations, none overflow

⭐ **`min-width`, not `width`.** The longest label measures 118px here, so 124
makes every chip identical and leaves headroom for a wider system font: if one
grows past 124 the row still wraps — cosmetically uneven, never overflowing. A
fixed width would clip the label instead, and `nowrap` to defend it is exactly
what shipped the 360px side-scroll one commit ago. A test forbids both.

### 28.3 ⭐ The deploy gate refused the park, and it was right to

`what only a stylesheet can settle` opens the whistle layer in a real browser and
asserts the panel goes from **0px to more than 20px tall**. Parking the displays
made that pair fail on a correct page — and **the job stopped before the deploy
step**, so nothing broken reached production.

The gate was not waived. Its subject moved: **the caption under the selector is
what a layer now visibly produces**, and it is still a laid-out box whose
visibility only a stylesheet decides, which is what this step exists for.

    caption, base view   39px          (the base view's marks are named)
    caption, layer on    39px, 261 chars, changed=1
    whistle marks on the ice           1

⭐ **Still a pair, and still for the same reason.** A caption that is always empty
passes *it changed* alone; one that never changes passes *it has height* alone.
Both were proven able to fail: hiding `.lcap` fails two assertions, and deleting
the line that writes it fails four.

And it is **driven through the control a visitor uses** — `#rg .pk[data-l=…]`
rather than the parked `#lyWhistle` behind it, which still exists and still works
and would have kept the gate green on a page whose selector had stopped working.

## 29. Penalties move to the scoreboard

Kevin, 2026-08-27: the penalty boxes under the ice *"are (now) rather wasted
space… let's display penalties on the scoreboard, with the offending party being
identified under the applicable team, maybe what they went off for and some sort
of timer that counts down."*

    the row under the ice   62px at every width, saying "empty · empty"
    measured, at frames the replay SHOWS, over 40 published games:
      nobody in the box  82.3%     three or more  0.7%
      exactly one        15.9%     six            once
      two                 1.1%     both boxes     3.0%

So the block is **absent** four times in five — no reserved space, which was the
complaint — and it is built for one. **Two seats and a `+N`**: two covers 99.3%
of frames and is what a rink's scoreboard has. Kevin chose the `+N`.

### 29.1 ⭐ The clock counts the referee's time, and that is not a detail

`box.js` derives early release, so every stint knows its **true** end. Counting
down to that end would **announce a goal that has not happened.**

The new fixture is where the two are furthest apart: `2025030214`, a double
minor killed by a goal — at the frame the replay shows, the **assessed** clock
reads `4:00` and the **served** remaining is `1:04`. **A page counting the served
time tells the viewer, 176 seconds early, that a goal is coming.** That is the
spoiler the verdict card and the game line already refuse.

So the number is `start + min×60 − now`, exactly what the arena shows, and the
seat empties on the ICE's schedule because `occupants` uses the true end.
**Kevin's earlier ruling on this surface — *the assessed time, not a countdown* —
is kept, not overturned**: it is the assessed clock that ticks.

⚠️ **50 of 332 stints end early**, so this is not hypothetical. And the test
asserts the two numbers DIFFER before comparing them — *two mechanisms, one
observable* is the shape that has fooled this project before.

### 29.2 The league's word, never a de-hyphenation

`src/lib/penalties.js`, in the shape `whistle.js` already argued: known keys
only, and an unseen one **renders raw**. `delaying-game-puck-over-glass` becomes
*Delay of game — puck over the glass*; a descriptor we have never met arrives as
itself, visible and fixable.

⚠️ **And the vocabulary alarm was collecting penalty keys and comparing them to
nothing.** `seen["penalty descKey"]` has been gathered on every run with no entry
in `unknown` — the exact gap `derive.py` describes for stoppage reasons, sitting
open one field over. Closed, at the standing *noted, never blocking*.

⭐ **`kneeing` is why that matters.** It is in `data/rich.json` and in **none** of
the forty published games I sampled. A forty-game sample did not contain a word
the reference fixture did.

### 29.3 ⚠️ Three instrument errors in one sitting

1. **`?g=…` is not a parameter this page accepts** — it is `?game=`. Several
   probes silently measured the *default* game. The "40 games, none overflow"
   sweep was **one game, forty times.** Re-run properly: 5,562 frames across 40
   real games at 345 and 390, none overflow, tallest scoreboard 226px.
2. **`stints(events, {})`** destructures `{homeId, awayId}`, so with an empty
   context **no penalty could ever be released** — which is why the first count
   said *0 of 332 ended by a goal* against `box.js`'s own documented 45.
3. The first version of the row was a **wrapping flex line**, so a 41-character
   infraction put the clock on line 3 and an 8-character one on line 1 — two
   seats in one scoreboard with different shapes. A grid now: name and clock on
   row one, infraction spanning row two, two lines whatever the league calls it.

⚠️ **And the same element in two containers, for the fifth time**: under 520px
`.tm` becomes a ROW, so the penalty block laid out *beside* the badge and squeezed
`CAR 1` into a sliver. Correct above 520, wrong below it.

### 29.4 Known limit

A bench minor — *too many men on the ice*, 10 in the sample — has **no committing
player** in the feed, so `box.js` gives it no seat and the scoreboard shows
nothing while the team is genuinely short-handed. Pre-existing behaviour, now
visible in a place where its absence is more noticeable.

## 30. Short-handed goals, bench minors, and a board that holds still

Three things from Kevin scrubbing a game he had not used before — which is
itself the finding: *"I had only been using 1 game for all our previous
efforts."*

### 30.1 ⭐ A short-handed goal is not "fewer skaters" — it is wrong 20 times in 26

Over 40 published games: **246 goals in play, 26 with fewer skaters, and only
SIX with anybody in the scoring team's own box.** The other twenty are the
opposite situation — the other side pulled its goaltender, so the scorers are
five against six *shooting at an empty net*. A badge driven by `sit` alone reads
**SHORT-HANDED on an empty-net goal**, which is not a near-miss, it is backwards.

So both conditions, the second doing the work: fewer skaters, **and** the
scoring team actually has somebody in the box. `box.js` says it in one line —
*fewer skaters is not the same as penalised* — and it took writing the wrong
version to see that the line was about this too.

⚠️ **The boundary is inclusive on purpose.** `occupants` is `end > secs` and the
release rule sets a released stint's `end` to the goal's own second, so at the
instant of a POWER-PLAY goal the box it just emptied already reads empty.
Counted the other way, power-play goals came to **6 instead of 51** against
box.js's documented 52. It does not move the short-handed number.

⚠️ **And the tag had to go in BOTH announcements.** A located goal is announced
by its label on the ice; only an unplaced one falls through to the caption pill.
In the caption alone it would never have appeared on a located goal — most of
them — and a probe driving the scrubber shows nothing either way, because
neither announcement fires unless the playhead *arrives* at the moment.

### 30.2 A bench minor fills a seat and has no name to put in it

Kevin: *"we definitely need to capture that on the scoreboard, just without an
identified person."* `box.js` admitted penalties on `e.actor != null`, which
silently dropped **13 of 347** — every one `sev: 'BEN'`: ten too many men, two
unsuccessful challenges, one bench unsportsmanlike. The team is short for two
minutes and somebody serves it, so the box was wrong about the ice.

⭐ **The condition is the severity, not the missing name.** A future penalty type
that also loses its actor would be admitted by accident under the weaker rule.
`player` stays null and the scoreboard says **Bench**, because an em-dash reads
as *we lost his name* rather than *there is not one*.

### 30.3 The board holds still, and the badges line up

    board heights over one heavily-penalised game, at 390
      before   117 / 161 / 195 / 213      the rink stepped down four times
      after    161 / 195 / 213            0 and 1 penalties are the same height

There is no free version: to stop the shift the room has to exist before the
penalty does. One seat is held open — the 0→1 transition, **98.2% of frames**.

⚠️ **And reserving a seat does not fix the misalignment Kevin saw** — *"notice
how VGK is shifted above WSH too"*. `align-items:center` centres each team
column, so one side at one penalty and the other at two still drifts. **Top
alignment** does fix it, at any number of rows: badge y-difference is now `[0]`
across an entire game at both widths.

### 30.4 The game line heads the board

Kevin: *"can we move the game identifier to the top of the scoreboard, would that
help in the spacing below the clock?"* It does — the card now reads identity →
score → who is off, and the bottom belongs to the clock and the penalty columns.

⚠️ **`grid-area:game` is only valid where the areas exist.** Above 520 the board
has no `grid-template-areas`, so naming one resolved to lines that do not exist
and the game line dropped to **178px down a 159px card**. Fifth instance of the
same declaration being correct in one container and wrong in another — and the
first one caught by a probe printing a distance rather than by looking.

### 30.5 ⚠️ And a check that could not fail, again

The assertion guarding that last bug read
`PAGE_CSS.split('@media(max-width:520px)')[0]` — which drops every rule written
*after* the query, including the one under test. **The mutation putting
`grid-area:game` back changed nothing and the suite stayed green.** It strips the
narrow blocks now, and asserts the slice still contains the rule before judging
it — because a slice that lost its subject passes everything.

## 31. Where a layer's output lives — the audit

Kevin, 2026-08-27, opening the brainstorm: *"another reason to (re)move the
penalty information was to free up that space below the rink, which is where I
think the layer information/counters should live. The requirement is that the
space utilization is consistent so the graphics don't adjust based on which
layer is selected. The blocked layer doesn't need all of the data that's
currently in it — the archive reference, that should go on its own informational
card in the Workshop area."*

Three claims, and they are separable: **a place**, **a constraint**, and **a
removal**. This section audits each, records CHENG's review, and states what is
settled and what is not.

### 31.1 ⚠️ First, the space is not empty — and the audit of it found two live defects

Both are fixed in `a5af829`, both shipped in `6b3d655`, and both are the same
shape: **a park written for one container took something else with it.**

`#caption` was a CHILD of `.pboxes`. It lived there deliberately — anchored to
that row's top edge, which is the bottom of the ice, so the pill would stop
overlapping the penalty boxes. Parking the row hid the pill, and a
`display:none` parent is not something a child can override. For one commit,
every penalty, every unplaced (shootout) goal and every *"⚡ Shot from the slot"*
was written into a dark element — **98 penalties and 4 shootout goals across the
seven fixture games** — while `dwell()` still held the replay 2.2s to make room
for a caption nobody could see. Two of those three announcements have no other
home on the page.

And the same commit took the **front door's** split bar. The hero boots
`corsiOn=true`, so it wears the `corsi` class, so `#rg.corsi .cbar{display:none}`
applied to a surface it was never written for: a scoreboard with no bar, above a
sentence about attempts. That is the exact pair `app.js` names in *"AND THE BOARD
NAMES ITS UNIT"*, where the fix for it was written a fortnight ago.

⭐ **H3 was already a checklist line and it did not fire**, which is why the
answer is an instrument (`test/park.test.js`) rather than another line. See
`docs/status.md` §H3.

### 31.2 The place — adopted, with one thing to design deliberately

The freed space is inside `.rinkbox`, directly under the ice: the closest real
estate on the page to the marks a layer draws. It also preserves the division
§27.1 already ratified — **the caption under the selector says what the lens
*is*; a box under the ice says what it is showing *now*.**

The objection is distance: the selector sits below the transport, so the box a
chip changes is ~300px above the chip. **CC's argument for accepting it: the
control is pressed once, the output is watched continuously**, so the output's
position should be optimised for watching. That is also why the penalty move
worked — penalties went where a viewer was already looking.

⚠️ **CHENG's pushback is the half that survives, and it is phone-specific.** At
390 the box and the selector cannot be on screen together, so **the first toggle
produces no visible feedback near your thumb**; the active chip changing state
is the only signal, and it is the thing you are already looking at. That is not
an argument against the placement. It is a requirement: **the selector needs its
own acknowledgement**, designed on purpose rather than discovered at 390.

### 31.3 ⭐ The constraint — "consistent space" has a weak reading and a strong one

The weak reading is *reserve the tallest box*. It fails on its own terms,
because the five outputs are not the same order of size:

| layer | its parked output | shape |
|---|---|---|
| Attempts | two counts + a split bar | 2 numbers |
| Slot | the amber tip | 1 sentence |
| Blocked | panel + archive reference | ~4 lines |
| Goaltending | a card per goaltender | 2+ cards |
| Stoppages | tally over up to 15 reasons + last stoppage | up to 16 rows |

Reserve for Stoppages and Attempts rattles in an empty box for sixty minutes.

The strong reading is that **every layer produces the same grammar**, and the
height is then constant because the content is:

    [ away figure ]   [ WHAT IS COUNTED ]   [ home figure ]
    [ one sentence about the state at the playhead ]

The constraint pays twice: the box holds still, **and the layers become
comparable**, because each is now *a number for each club, and what it counts.*

### 31.4 ⚠️ The grammar holds for three, not four — and Goaltending is the interesting one

CC claimed four of five fill the two-column form natively and flagged
Goaltending as the place to check. CHENG checked it and objected on a ground
neither of us had stated: for Attempts, Slot and Blocked the left number is
*what the away team did*, while for Goaltending the away goalie's saves are
*shots the home team took* — so **the column changes subject between layers.**

⚠️ **Two-thirds of his repair is already shipped, and checking the code is what
showed it.** He proposed the saves be phrased `saved 12 of 15` rather than
`.800`, and be placed under the club the goaltender plays for. `app.js` already
does both: `const faced = st.f ? \`${st.s} of ${st.f}\` : '—'`, with a comment
arguing exactly his reason (*"a fraction carries its own denominator, so it
needs no cutoff to be honest at"*), and the card's side comes from
`R[id].tid` — the goaltender's own club. So the convention he is asking for is
the convention in the file.

What survives is narrower and still real: the column's **agency** flips.
`34 | SHOT ATTEMPTS | 41` reads *what this club did*; `12 of 15 | SAVES | 18 of
20` reads *what this club's goaltender stopped the other club doing.* The
subject stays the club — that is the part of CHENG's framing measurement does
not support — but the verb changes, and the label has to carry it.

⭐ **AND THE MEASUREMENT FOUND THE HARDER PROBLEM, WHICH IS NOT ABOUT SUBJECTS.**

    COMBINED SWEEP  n = 2,096 games -- half the in-scope archive
      2 goaltenders                       87.8%
      3 goaltenders                        12.0%
      4 goaltenders            4 games      0.19%
      ---------------------------------------------------------
      more than two            12.2%  +/- 1.4 (95%)
      by year   2023 15.4% . 2024 12.0% . 2025 10.8% . 2026 12.6%

      team-games with a change  ~6%  =>  ~5 per team per 82-game season
      reliever shots faced      median 13, min 1, none at zero
      non-goalie positions in any goalie list                    0

**One game in eight cannot fit two columns at all.** A relieved goaltender is
not an edge case to round off; it is one of the few nights when goaltending is
visibly the story. The four-goaltender games are both clubs changing — checked
by name: `EDM@VAN 2023-10-11` (Campbell/Skinner, Demko/DeSmith) and
`BUF@MTL 2026-05-16` (Lyon/Luukkonen, Dobes/Fowler).

⚠️ **THE FIRST VERSION OF THIS FIGURE WAS 8.7%, FROM n=300, AND KEVIN REFUSED
IT FROM DOMAIN KNOWLEDGE.** He was right to, and the two errors are worth
separating because only one of them is arithmetic.

*The sample was too small and was quoted as though it were not.* Three strides
over the same ordered catalog gave 8.7% → 12.0% → 13.3%, and none carried an
interval. **`0.7% use four goaltenders` was TWO GAMES** — a count of 2 rendered
as a rate to one decimal place, which is Doctrine §8's failure in better
clothes. The honest form is the one Kevin's objection took: *two games in a
thousand, and both are both-clubs-changed.* A **disjoint control** (same stride,
offset 2, zero overlap) returned 10.9% ±1.9 against 13.3% ±2.1, so stride
aliasing is refuted and the spread was ordinary variance — but the control was
run because the walk looked like structure, which is the right reason.

*And the WORDS were wrong, which is what made the number unbelievable.* The
field counts **a second goaltender facing a shot** — the starter was pulled,
which happens about five times a club a season. **The emergency backup
goaltender is a different and far rarer event, and `goalieInNetId` cannot
distinguish it at all**; that needs roster data we do not hold. Saying "more
than two goaltenders" invited the EBUG reading, and against that reading the
figure is absurd. The measurement was defensible and its label was not.

So the ruling this hands us: **the row counts the CLUB's goaltending, not a
goaltender's.** `saved 33 of 35` under each club holds the grammar for 100% of
games and stays a fraction. *Who* was in net, and when he was relieved, is a
different question and belongs on the second line — which is the line the
grammar already reserves for the state at the playhead.

### 31.4b ⭐ And the same question bites Blocked — 99.2% of the time

CHENG raised the column-subject problem for Goaltending. Checking the reducers
before laying anything out found it in a layer neither of us named, and worse.

`blocked.js` returns `t` keyed by **the blocker's team**: `t[AID]` is *blocks
the away club made*, which are blocks **of home attempts**. Every other layer's
left column is *what the away club did with the puck*. Measured over 262
in-scope published games:

    blocked events                                        8,571
    credited to NEITHER club (blocked by a teammate)        710   8.3%
    the two readings name DIFFERENT clubs as leader     245/247  99.2%

**Not sometimes — almost always**, and obviously so once stated: your blocks are
of their shots, so the two leaders are mirror images of each other. The 0.8% are
games where the uncredited residue flips a near-tie.

⚠️ **So dropping the existing panel's `t` into the shared grammar would put a
number under the away column that is describing the home club's shooting, in 99
games out of 100** — under a grammar whose entire teaching claim is *left column
is the away club*. That is the blocked-shot attribution defect for the fourth
time in this project, and this time it would have arrived through reuse rather
than through a mistake.

⭐ **THE RULE, and it is now the grammar's first rule: every column is COUNTED
BY THE CLUB THAT SHOT THE PUCK.** Attempts, Slot and Blocked are then the same
population filtered three ways, and the columns mean one thing across all three.
It also removes the residue: counted by shooter, the two columns sum to the
total blocked exactly, where counted by blocker they are short by 8.3% because a
teammate block is credited to nobody — a discrepancy a viewer can see and cannot
explain.

Goaltending is the one layer that cannot obey it, since a save is by definition
against the other club's shot. That is what §31.4's second line is for: the
label carries the flip, and it is the ONLY layer where it has to.

### 31.4c ⛔ AND §31.4b IS SUPERSEDED — blocks are counted by the blocker

Kevin, the day after: *"blocked shots is quite a common stat that gets broadcast
on every hockey platform possible, all of them (to my knowledge) attribute the
block to the defending team… If we do keep it the way it is, we need to change
'credited' to 'attributed' or 'assigned', something different than credited."*

He is right, and **the layer's own audit said so before I overrode it.**
`docs/blocked-shots-layer.md` §6 specifies *"it marks the block point and says
so, **with the blocker named**"* and *"a per-game count per team, **teammate
blocks excluded** and stated"* — and excluding teammate blocks is only
meaningful under blocker credit. The panel tallies by blocker, the ice names the
blocker, every broadcast names the blocker, and §31.4b made the box name the
other club. **One page saying two things**, from a consistency rule invented the
previous day.

⚠️ **And the argument I defended it with was aimed at the wrong target.** I cited
the 81.7% inversion and *"gritty defence wins"* — which is what §5 of that audit
rules on, and what §5 forbids is publishing a **blocks-leader win rate**. We
publish no such rate. The inversion is an argument against an outcome rate, not
against a count, and a bare count is exactly what every broadcast shows.

⭐ **The question that dissolved it was Kevin's first one**, not his second:
*"what does the layer intend to educate about?"* It was doing two things at once.

* **Where blocks happen** is a defensive fact — attempts die in the lanes, not
  at the net — and it belongs to the **blocker**.
* **How many attempts never got through** is a fact about the **game**, belonging
  to neither club, and it needs no attribution at all.

Separate them and the conflict is gone: the columns carry blocks by club, the
line carries the game-level fact. It is also why the two figures need not sum to
the total — a block by a teammate is credited to neither, 7.8% of blocks — and
that constant explanation lives in the caption.

⭐ **THE RULE THAT REPLACES §31.4b, narrower and durable: a column carries the
club hockey would put it under.** Attempts and Slot are the shooter's; blocks are
the blocker's; a save is against the other club's shot. Where a column reads the
opposite way round the caption says so, and anything belonging to the game rather
than to either club goes in the line. The comparability §31.4b was protecting was
real but subordinate — **agreeing with the sport beats agreeing with ourselves.**

And the wording objection dissolves with the attribution: under blocker credit,
*credited* is the correct hockey word, so nothing needs renaming to *attributed*.

### 31.5 Stoppages degrades, and the degradation is the honest part

**A stoppage has no team.** `extract.py` carries `rsn`/`rsn2` and nothing else —
no team, no player, no coordinates — so a two-column per-club form would have to
invent an attribution the feed does not contain. Both reviewers land in the same
place: centre-only, one row tall, `44 stoppages · last: icing`. The form holding
while the content admits it has no sides is better than a form that lies.

### 31.6 ⛔ What the base view puts there — SOG proposed and REJECTED

CC proposed **shots on goal**: per-club, the number a broadcast shows,
self-validating against the league's boxscore at the final whistle, and it makes
the site's thesis mechanical (*the base view shows the familiar number, every
layer replaces it with a better one*). CC also stated the counter-argument
against it, and CHENG's ruling is that the counter-argument is decisive rather
than cautionary:

> *It puts a number we spend the whole site arguing is misleading into the most
> valuable position on the page, permanently.*

**45.8%** is published on the front page: the shot-on-goal leader **loses**
nearly half the time. Making SOG the resting state teaches a novice that it is
the default lens and everything else is optional decoration — backwards.

⭐ **And CHENG's second reason is structural, which is the stronger one.**
`Just events` currently means *no metric*. Put SOG there and the chip is
mislabelled and **Doctrine §6 — the base view is just the game — stops being
structural and becomes a convention.** Today the default cannot accidentally
carry a metric, because *none* is a choice.

**The self-validation is worth keeping and belongs somewhere else.** *Our running
count must equal the league's boxscore at the final whistle* is a genuinely good
check that nothing on the page currently offers. It should be **a validation
gate, not a display** — which is where checks belong, and which `extract.py`
already has the shape for (`SOG reproduces boxscore` is the gate 135 refusals
fail).

**So the base view's box holds nothing** — an empty box that reserves its height.
That satisfies the constraint without asserting anything, keeps `Just events`
honest, and makes the box's arrival on first toggle a **reveal** rather than a
**replacement**, which is the more instructive event. If empty reads as dead, the
honest filler is a prompt and not a number: *pick a lens above and this fills in*
— a statement about the interface, which is the `display:` provenance category
§B1 already created for sentences about what we did rather than what happened.

### 31.7 The archive reference leaves, and the rule that lets it

Doctrine §8 decides the shape: **a rate without a base rate is a story, not a
measurement.** So the reference can leave *only if what stays behind is counts,
not percentages*. `11 blocked` beside `8 blocked` claims exactly what it is —
CHENG's own ruling on the split bar — while `27.8%` with its reference moved to
another page is a rate that has lost its denominator. Conveniently, that is what
the fixed grammar wants anyway.

⚠️ **The destination is the open part, and both reviewers argue against the
Workshop.** Its stated identity is *"Earlier views, each answering a question the
main app does not. They are explorations, not front doors, and several are pinned
to one game."* A reference card is a different kind of object; putting one in the
grid redefines the page quietly, which is the failure mode this project names
everywhere else.

**The proposal is a measurements page**: every published archive figure with its
`n`, its population, and the date it was read. Everything is already in
`measures.json`; today a reader meeting one of these figures has no way to see
the others or their populations, which is the ground D4 grew in.

CHENG adds two arguments neither of us had:

* **It is the natural home for the provenance digests.** Three SHA-256 hashes per
  game of the league's own responses, computed at ingest, currently invisible.
  *Don't trust, verify* — implemented, shipped, unmentioned. A measurements page
  is exactly where a sceptic is standing.
* **It makes the rate family checkable in one place** — 39.6% / 60.4% / 45.8% /
  54.3% / 75.4% / 51.9% — instead of one panel at a time.

### 31.7b ⏸ Three verification surfaces, and only two of them are the same kind

Kevin, approving the measurements page and parking it: *"it'll have to (somehow)
align with both the 'show me your work' (which we haven't talked about for some
time), and the current 'Workshop' page, all of which need to align and be
cognizant and interact with each other. But that's a bit aways in our build
cycle."*

Parked — and the taxonomy is settled here because it changes what the box under
the ice must make room for, which is not parked.

| surface | the question it answers | scope |
|---|---|---|
| **Show me the work** | *where did 34 come from?* | this game, this layer |
| **the measurements page** | *how unusual is 34?* | the archive, with `n` and population |
| **the Workshop** | *what else can you show me?* | other views entirely |

⭐ **The first two are ONE THING SPLIT BY SCOPE** — the number in front of you,
and the population it sits in. They are Doctrine §8's two halves and they should
link to each other. **The Workshop is not in that family**; it is exploration,
not verification. That is the real reason a reference card there read wrong to
both reviewers in §31.7: a category error, not a matter of taste.

**The consequence for the current build:** the box under the ice is where *Show
me the work* reattaches, per layer. It needs an affordance for it in the layout,
decided before the box is laid out rather than after.

### 31.8 What is settled, and what is not

**Settled:** the box lives under the ice, inside `.rinkbox` · it holds a fixed
grammar rather than a reserved maximum · **a column carries the club hockey would
put it under** (§31.4c, superseding §31.4b) — shooter for attempts and slot,
blocker for blocks, and a save against the other club's shot · Stoppages degrades to centre-only ·
Goaltending counts the CLUB, with the goaltender named on the second line · the
base view's box is empty or carries an interface prompt, never a metric · SOG
becomes a validation gate, not a display · the archive references leave the
panels, and what stays is counts.

**Settled since:** the reference figures go to a **measurements page**, not a
Workshop card — approved by Kevin and parked behind the current build, with the
three-surface taxonomy in §31.7b.

**Not settled, and it is Kevin's:** what the selector's own acknowledgement looks like, which §31.2 says is now a
requirement rather than a nicety.

⚠️ **And one instrument note carried out of §31.4:** a figure quoted from a
sample states its `n` and its interval, or it is not quoted. A percentage whose
numerator is a single-digit count is reported as the count.

**Not yet designed:** the second line's grammar. It is the line that must carry
*"Ullmark relieved Levi at 12:04"*, *"last: icing"* and the even-strength note
*"49 attempts have dropped out so far"* — three sentences of different kinds in
one slot, which is the thing that has gone wrong before.

## 32. The box was built, and then the ledger was demoted

Everything in §31 shipped, plus two things §31 did not anticipate. Commits
`a5af829..a3021dd`, all gates + deploy green. **766 JS + 180 Python.**

### 32.1 What the page holds now

    scoreboard · rink · [ LAYER BOX ] · transport
    WATCHING  [Just events] │ [Attempts 59][Slot 24][Blocked 15][Goaltending 27][Stoppages 36]
    caption · [ work panel, behind a button ] · Other games

**The layer box** is `--lboxh:120px`, one height across every state and width,
holding `away | WHAT IS COUNTED | home`, a line naming the population or
condition, per-club sub-lines where a layer has something to say about each
club, and the `Show me the work` control.

⚠️ **`--lboxh` IS MEASURED, NOT CHOSEN**, and it was guessed wrong three times
before it was measured once. Release it to `height:auto`, sweep six layer states
× three widths × two games, take the worst case. Re-measure after any change to
the box's content; the deploy gate is the backstop (zero clipped, one height).

### 32.2 ⭐ The rule that kept costing money: constants in the caption, variables in the box

Paid for three times in one day — the goaltending flip, the blocked
attribution, the stoppage's "names a rule and never a team". **A fixed box
cannot hold a constant sentence AND an unbounded one**, and §27.1 already said
where each belongs: the caption says what the LENS IS (true before the puck
drops), the box says what is true NOW.

⚠️ **And three of the four box defects were a LABEL or a FIGURE outgrowing the
row, not the sentence everyone looks at** — twice after a round of shortening
copy that was never the problem. `ATTEMPTS THAT NEVER ARRIVED` wrapped at 209px
in a 293px box; `22 of 22` is four times the string a count is.

### 32.3 ⛔ §31.4b was superseded by the sport, and by the layer's own audit

Kevin: *"blocked shots is quite a common stat… all of them attribute the block
to the defending team."* Right — and `docs/blocked-shots-layer.md` §6 already
specified the blocker is named and teammate blocks excluded, which is only
meaningful under blocker credit. **A consistency rule invented the previous day
overrode a document that had already ruled.**

⚠️ And the argument defending it was aimed at the wrong target: the 81.7%
inversion is what §5 of that audit rules on, and what §5 forbids is publishing a
blocks-leader WIN RATE. We publish none.

⭐ **§31.4c, the rule that replaced it: a column carries the club hockey would
put it under.** Shooter for attempts and slot, blocker for blocks, a save
against the other club's shot. **Agreeing with the sport beats agreeing with
ourselves.**

### 32.4 ⭐ The ledger was never a teaching surface, and now it stops pretending

Kevin: *"what is the Not Counted column teaching? That faceoffs, giveaways,
period starts are NOT shots from the slot? I don't think there's much value
there."* Measured: **100% of the exclusions for Attempts, Goaltending and
Stoppages are events that were never candidates.**

CHENG's rule decides what stays: **an exclusion teaches when a viewer could
plausibly have expected it to COUNT** — the exact mirror of the `surprising`
admission rule. It is not derivable from the events but it IS derivable from the
DIMENSION that rejected them.

⭐ **THE DIMENSION VOCABULARY, and it is now load-bearing:**

    play      outside play at all (the shootout)
    type      a different kind of event entirely      → collapses to one line
    strength  the wrong situation                     → promoted
    limit     a real candidate the FEED cannot place  → promoted
    geometry  a real candidate that failed OUR rule   → promoted

⭐ **A blocked shot is excluded by a LIMIT, not by its type** (CHENG: *"two of
these are hockey, one is us"*). Labelling it `type` filed the most interesting
exclusion on the page in with the faceoffs.

⚠️ **Conservation is not weakened, and must not be** (Doctrine §9). The footer
closes over three buckets instead of two; two smoke tests were rewritten to
check the new arithmetic rather than dropped.

⚠️ **AND THE SLOT LEDGER WAS A 3,176px WALL.** 276 exclusions grouped into 49
rows, 32 appearing exactly once, because each named THIS shot's distance.
⭐ **A reason that names a RULE groups; a reason that names the EVENT does not.**
`why` is the rule, `detail` is the measurement, one example per group — so
CHENG's *"36 against 33 teaches the rule better than the rule statement does"*
survives once per rule instead of once per shot. 49 rows → 14, singletons → 1.

### 32.5 ⭐ The teaching moved to the chips — a live count per lens

Kevin: *"an event occurs on the rink… flash the control button, which indicates
the event applied to that layer."* CHENG's improvement is what shipped: **a
count, not a flash.** It reports where a pulse invites (a glowing button says
*press me*), it PERSISTS so `prefers-reduced-motion` gets the whole lesson
rather than none, and it is cumulative.

⛔ **"The most specific layer lights" was proposed and REFUTED by census.** Over
**262 games and 69,661 visited frames**: Attempts *counts* 45.0% of frames and
would have *flashed* on 5.8% — the chip and the counter disagreeing 7.8-fold
about one quantity. It also asserts the lenses are disjoint when they are not.

    per lens, share of visited frames it counts
      Attempts 45.0%   Goaltending 21.7%   Slot 15.4%   Blocked 12.3%
      nothing at all 55.0%       Stoppages 0% of frames the transport VISITS

⭐ **The counts teach containment for free** — Attempts ticks whenever any other
lens ticks and at other times too. Verified as a PROPERTY over every fixture
game: every Slot, Blocked and Goaltending event is also an Attempt. That is why
CHENG's two-strength flash became unnecessary: the frequency IS the information.

⭐ **A layer's signal must fire on a frame the transport VISITS.** Stoppages
counts 0% of visited frames because its events are exactly the ones `SKIP`
removes. Its count fires at the restart faceoff. Anything else is a signal
nobody can receive — the same class as the caption stranded inside `display:none`.

⚠️ **The count could not live in the chip's text.** `capFor` composes the caption
from `chip.textContent`, so it would have shipped *"**Slot33** — attempts from
within 33 ft"*. The label moved to `.pkl`. **Third time that seam has decided a
design** (it also ruled out a "Done" label on the press acknowledgement).

**Measured: the counts cost ZERO extra rows** at 360, 390, 700 and 1100 — the
chips already carried `min-width:124px` against a 118px longest label.

⚠️ **AND IT REOPENS §31.6.** That section refused a metric in the base view's
box because *`Just events` means no metric*. Five live counters are five numbers
on screen in the base view. Kevin ruled to build it and it reads as informative
to him; the distinction held is that **the box is the output slot (a number
there claims to be what you are watching) and a chip count is a menu with
prices**. The `Just events` chip carries no count, and a test forbids one.

### 32.6 What is open

* **The default playback speed wants adjusting again** (Kevin, 2026-08-27,
  after the counts landed). Not measured.
* **Per-game distributions in `measure.mjs`** — nothing in `measures.json` says
  whether 94 attempts or 55 stoppages is a normal night, so no surface can say
  a game was unusual. Blocks both of the next two.
* **The per-game summary**, growing out of the verdict card (§31.7b ladder).
* **The measurements page**, approved and parked, also the natural home for the
  three per-game SHA-256 provenance digests, which ship and are invisible.
* **Clicking a ledger row to seek to that event** — Kevin's idea, and
  `docs/event-index.md` §7 already rules what clicking should do (stop, seek,
  re-announce, stay paused) and names the wrinkle: `render`'s `newest` flag
  drives both the caption and the counter bump, and `prevA/prevH` go stale after
  a jump. **Measured: about a third of rows cannot be shown**, because
  `stoppage`, `period-start`, `period-end`, `game-end` and `delayed-penalty` are
  in `SKIP`. A row is clickable exactly when the page has a moment for it.
* **The near-miss as a visual** — a shot that nearly qualified could mark
  differently on the ice. Untested idea.
