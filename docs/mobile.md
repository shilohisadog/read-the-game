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

The only move that changes the ratio in portrait. At a height of 520px the rink
is `520 × 85/200 = 221px` wide:

| layout | drawing | area | vs today |
|---|---|---:|---:|
| horizontal, today (**measured**, not arithmetic) | 386 × 164 | 63,304 px² | 1.00× |
| vertical at 520 tall | 221 × 520 | 114,920 px² | **1.82×** |
| vertical at 600 tall | 255 × 600 | 153,000 px² | 2.42× |
| vertical at 700 tall | 298 × 700 | 208,600 px² | 3.30× |

⚠️ **THIS TABLE CORRECTS THIS DOCUMENT'S FIRST DRAFT**, which said 2.2× from
`350 × 149`. The ice measures **386 × 164**, so the gain at 520px tall is 1.82×,
not 2.2× — and the row that matters is the one underneath it: *the vertical rink
buys drawing area by spending the same fold the caption needs.* At 700px tall it
is 3.3× the drawing and 144px of screen left for everything else.

"whose end is whose" becomes top and bottom, which is the other complaint from
the same review, on a hero whose two clubs are both red.

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

---

## 4b. LANDSCAPE — CHENG's option, measured, and it fails on his own diagnosis

CHENG proposed rotation first: *"your own landscape screenshot was the best this
rink has ever looked… people already know to rotate a phone to watch something…
Rotated, 844 × 390 gives a rink around 816 × 347 — more than double the ice, with
room beneath it."*

**The drawing arithmetic is right and the conclusion is wrong.** Measured, same
page, same frame:

| | portrait 390×844 | landscape 844×390 | landscape 844×320 |
|---|---:|---:|---:|
| ice | 386 × 164 | **762 × 324** | 762 × 324 |
| drawing area | 63,304 px² | **246,888 px² (3.90×)** | 246,888 px² |
| ice as a share of the fold | 19.4% | **83.1%** | **101.3%** |
| the caption `#who` | 0.57 screens | **1.52 screens** | 1.85 screens |
| the transport | 0.81 screens | **2.04 screens** | 2.49 screens |
| whole page | 2.42 screens | **4.57 screens** | 5.57 screens |

⛔ **THERE IS NO ROOM BENEATH IT.** The ice alone is 83% of a 390px-tall viewport
and **more than all of it** at 320, which is what a landscape phone really has
after browser chrome. The screenshot at the top of the fold shows header, eyebrow
and scoreboard, with the rink only beginning at the bottom edge — **you cannot
see any of the ice without scrolling.**

⭐ **AND IT MAKES CHENG'S OWN DIAGNOSIS WORSE.** His sentence is the best one in
either analysis — *"the ice and the thing that explains the ice cannot occupy the
screen together"* — and rotation moves the caption from 0.57 screens to 1.52. The
furniture does not shrink when the phone turns; it simply eats a 390px viewport
instead of an 844px one.

### 4b.1 What this actually proves

Drawing area and everything-else trade against one fixed budget, in every
orientation. Landscape spends the whole budget on the drawing; the vertical rink
spends it in proportion; only R1 changes the budget itself.

**So R1 is not the cheap warm-up. It is the precondition for both of the others.**
Landscape is worth having *after* the output is one line — at which point 762 ×
324 of ice with a single caption under it is the best frame this site can show on
a phone. Before that it is a bigger picture of a game you have to scroll away
from to read about.

## 5. The recommendation

**R1 first, and it is no longer optional.** §4b turns it from the cheap warm-up
into the precondition: every other option spends fold the furniture is already
holding, so nothing else can pay off until the output is one line.

**Then landscape, which is cheap and which CHENG is right about for the wrong
reason** — not because rotation fixes the layout, but because once the furniture
is gone, a 762 × 324 rink is 3.9× the drawing and the only frame on this site
where a phone shows more ice than a laptop's fold does.

**R2 stays unprototyped and should not be argued about until it is drawn.** Its
honest number is 1.82× at a height that still leaves room to read, against
landscape's 3.90× for a rotation — and it costs every coordinate transform, the
ends work and the learn diagrams. CHENG expects it to be rejected. On these
numbers so do I, but it is rejected on evidence rather than on effort.

**And the novice test decides whether portrait is salvageable at all.** She is on
a phone; *does she understand what she is watching* is the question. One session
answers it, and none of the above should be treated as settled before it.
