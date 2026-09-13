# The phone is not too small — we never budgeted it

**Kevin, 2026-09-13, after using the site on his phone:**

> *"the verdict isn't good, in my opinion. the replay just isn't informative on a
> mobile device, there simply isn't enough room on that small of a screen to
> surface the required controls to allow for a seamless user experience. We need
> to rethink what we provide on mobile."*

The verdict stands. **The premise does not**, and it matters which one we act on.
This document is one measurement of the first screen, taken before proposing
anything, because "there isn't enough room" and "we are spending the room badly"
lead to different rebuilds and only one of them is true.

The novice tester reviews this site **on her phone while Kevin uses a laptop**
(`docs/status.md` §B). That makes this the objective function, not a variant.

---

## 1. The first screen, measured

`game.html?game=2025030311` (MTL at CAR, 21 May 2026 — the current hero), frame
60, chromium at **390 × 844, DPR 2, touch**, against the built page.

Whole page: **2,041px = 2.42 screens.**

| band | top | height | share of the fold |
|---|---:|---:|---:|
| site header + nav | 0 | 75 | 8.9% |
| `h1.pagelede` — *"Learn to read hockey · event by event first, add layers after"* | 91 | 39 | 4.6% |
| scoreboard `.board` | 143 | 145 | 17.2% |
| **the ice** `#ice` | 311 | **164** | **19.4%** |
| `#who` — *"#24 Jarvis shot on goal"* | 483 | 18 | 2.1% |
| `Who's on the ice` button | 507 | 26 | 3.1% |
| **`#lbox` — the empty layer box** | 541 | **120** | **14.2%** |
| transport: Play / Prev / Next | 686 | 46 | 5.5% |
| transport: Slower / Faster | 742 | 46 | 5.5% |
| scrubber | 798 | 44 | 5.2% |

### 1.1 ⭐ The drawing gets 19.4% of the screen

Everything else is furniture. That is the finding, and it is not a statement
about how small a phone is.

### 1.2 ⛔ The single largest block after the ice is a box with nothing in it

`#lbox` is **120px — 14.2% of the fold** — and at this frame its entire content
is *"Choose one under Layers and this fills in as the replay runs."*

It is fixed-height on purpose, and the rule is Kevin's own: *"the space
utilization is consistent so the graphics don't adjust based on which layer is
selected"* (`docs/below-the-rink-2.md` §31). That rule is right on a laptop,
where the reservation costs nothing anybody can see. On a phone it reserves a
seventh of the first screen to point at a control **1,130px away — 1.34 screens
below the instruction to use it.**

No layer is on at boot (`test/render-teams.test.js`: *"the base view is the game
— every layer off, no trails, at boot"*), so this box is empty on arrival for
every visitor, every time.

### 1.3 ⛔ The layer's own sentence is 1,056px below the ice it describes

`#lcap` sits at **1,367px — 1.62 screens.** `#ice` ends at 475.

This is the defect Kevin already caught once, in the same place, about a
different element:

> *"the (vertical) distance between '#79 Hart gave the puck away' and the rink,
> there are many pixels between the event(s)"*

That one measured **479px at 390** and was fixed by moving `#who` directly under
the drawing (`builders/build_main.py`, the `.who` block). The layer caption has
the identical disease at **2.2× the distance**, and nothing measured it because
the fix that day was aimed at one element rather than at the rule.

---

## 2. Why the ice cannot simply be made bigger

**The rink is 200 × 85 — 2.35:1. A portrait phone is 390 × 844 — 0.46:1.**

The drawing's height is therefore set by the container's WIDTH and by nothing
else. At 390px the content column is ~350px, so the ice is `350 × 85/200 ≈
149px` of drawing plus padding. Reclaiming vertical space from the furniture
**does not make the rink any bigger** — it only moves things closer together.

This is the part of Kevin's verdict that is exactly right, and it is sharper than
"not enough room": *there is no arrangement of a 2.35:1 drawing in a 0.46:1
viewport that gives the drawing more than about a fifth of the screen.*

---

## 3. Three ways out, with the arithmetic

### R1 — Spend the budget properly. Horizontal rink, everything else tightened.

Reclaimable from the fold, measured above:

| move | px |
|---|---:|
| `#lbox` below the transport (it is a layer OUTPUT, and no layer is on) | 120 |
| `h1.pagelede` to one line, or gone on phones | 39 |
| `.board` padding — 145px carries three lines totalling 102 | ~40 |
| fold the speed stepper in with Prev/Next, now that a double tap steps | 46 |
| **total** | **~245** |

The ice stays 164px but the page loses ~245px (2.42 → **2.13 screens**) and the
caption, the transport and the layer output all come up onto the first screen.
Cheap, entirely additive, and it does not change what the site IS.

⚠️ **It does not answer Kevin's complaint.** The drawing is still 19.4%.

### R2 — Turn the rink vertical in portrait. Ends at the top and the bottom.

The only move that changes the ratio. At a height of 520px the rink is
`520 × 85/200 = 221px` wide:

| layout | drawing | area |
|---|---|---:|
| horizontal, today | 350 × 149 | 52,150 px² |
| vertical at 520 tall | 221 × 520 | **114,920 px²** |

**2.2× the drawing**, and "whose end is whose" becomes top and bottom — which is
the other complaint from the same review, on a hero whose two clubs are both red.

Costs, stated rather than waved at: every text annotation on the ice would be
drawn sideways by a naive rotation and needs counter-rotating; `AX`/`AY` own the
ends-switching transform and would gain a second mode; the 169px of width left
beside the rink is either wasted or becomes a column. **Nothing here has been
prototyped. It should be looked at before it is chosen** — the record on this
project is that a layout argument that is sound on paper is settled by pixels.

### R3 — A different artifact on a phone.

Not a replay at all: a vertical scroll of the game's turning points, each a still
frame with its sentence. It answers "informative on a mobile device" directly and
abandons the thing the site is named for. Recorded because the brief said
*rethink what we provide*, and because R1 and R2 both assume the answer is a
replay.

---

## 4. What is not in question

Tap-to-play and double-tap-to-step shipped on 2026-09-11 and are live; they
remove the need to REACH the transport but not the need to see it. They are a
prerequisite for R1's fourth row, not a substitute for any of this.

---

## 5. The recommendation

**R1 now, R2 looked at.** R1 is measured, cheap and strictly better; it should
not wait on a decision about R2. But R1 alone leaves the ratio untouched, and the
ratio is the complaint — so R2 deserves a prototype and a screenshot before
anyone argues about it, including me.
