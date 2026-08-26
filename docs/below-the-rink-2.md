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
