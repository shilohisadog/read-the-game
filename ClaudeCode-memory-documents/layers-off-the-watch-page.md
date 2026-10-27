---
name: layers-off-the-watch-page
description: "RESOLVED IN PRINCIPLE 2026-08-19 — do NOT move the layers wholesale (it breaks the learn page's nine doors); instead THE CONTROLS FOLLOW THE LAYER. Kevin's attention complaint is answered without making a door a one-way trip. Not yet built."
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-18T23:30:27.148Z
---

**Kevin, 2026-08-18, unprompted, while reviewing the penalty box:**

> *"I am thinking of removing the layers from the 'watch the game' area and just
> have the layers on the What you can see page. The page seems to get
> overcrowded with information when I am trying to watch the action on the rink
> and read the layer information below the rink, too much visual gymnastics to
> do in a short period of time (which is what we are trying to reduce for the
> casual viewer)."*

**RULED IN PRINCIPLE 2026-08-19 — see the section at the foot of this file.
Still not built.**

## Why it is more than a layout preference

It is an **attention** argument, not a clutter argument, and those have different
fixes. Clutter is solved by removing pixels; **divided attention is solved by
separating the two jobs in TIME** — watch first, measure after. That is already
the page's own stated eyebrow: *"Learn to read hockey · watch first, add metrics
after."* The proposal makes the layout agree with a sentence the site has been
printing all along.

It also lines up with the two surfaces we already have:

| page | job |
|---|---|
| the game view | **watch** — the ice, the score, the play being named |
| What you can see | **understand** — nine cards, nine doors into real moments |

## ⭐ The tension to resolve before building

**The learn page's nine doors link INTO the game view with the layer turned on**
(`?game=…&at=…&layer=slot`). If the game view carries no layer controls, those
doors still work — the deep link sets the layer — but a viewer who arrives
through one **cannot turn it off, compare, or try another.** The door becomes a
one-way trip.

So this is not a deletion; it is a decision about **where the control lives once
the layer is already on**. Possible shapes, unranked and unmeasured:

1. Controls hidden until a layer is active (arrived via a door), then minimal.
2. Controls collapsed behind one affordance on the game page.
3. Controls genuinely gone; the learn page is the only way in, and returning
   there is the way to switch.

## What must be true before this is decided

**This is on the hold-for-the-test list, not the build-before list.** The whole
argument is a prediction about what a casual viewer can hold in their head at
once, and [[novice-tester-scheduled]] is the instrument — on a phone, where the
gymnastics are worst. Kevin's own framing ("which is what we are trying to
reduce for the casual viewer") names her as the reader.

Related: the same session established the objective function that already
settled the benches question — see [[ends-switching-reopened]] — and the same
pixel argument applies here.

## A second, smaller thing noted in the same message

**"Missed shot" describes nothing.** Kevin: *"'Missed net with shot' is what the
overlay should say instead of 'Missed shot' (which doesn't describe the event)."*

He is right that it categorises rather than describes — but **the wording is not
the fix, the dropped field is.** Measured on the reference game: the feed carries
a `reason` on **31 of 31** missed shots.

| wide-left | wide-right | above-crossbar | hit-post | short |
|---|---|---|---|---|
| 14 | 9 | 5 | **2** | 1 |

So *"missed the net"* — and Kevin's *"missed net with shot"* — are **wrong for
the 2 that hit the post**, which did not miss the net at all. 6.5% here.

**⭐ SUPERSEDED BY THE ARCHIVE, 2026-08-20 — the table above is one game.** The
real vocabulary is **TEN values**, and the field is now carried as `miss`
(`0ecb636`). Over 2,574 missed shots in 89 games: wide-left 38.3 · wide-right
35.0 · above-crossbar 5.6 · high-and-wide-right 5.4 · high-and-wide-left 5.0 ·
hit-left-post 2.7 · hit-right-post 2.6 · short 2.5 · **hit-crossbar 2.0** ·
failed-bank-attempt 0.9. **Iron is 7.3% and `short` another 2.5% — about one
missed shot in TEN, not one in fifteen.** See [[hockey-legibility-build]].

**The right build is to carry `reason` through `extract.py`** — the identical
ten-line change already made for the penalty detail — and then label the event
with what actually happened: `Shot went wide`, `Hit the post`, `Shot went high`.
That turns a renamed category into a description. `missed-shot` details also
carry `shotType`, still dropped.

Note the phrase *"missed the net"* is **already on the blocked-shots panel**
(`build_main.py`, the mix bar), so the vocabulary is consistent either way.


# ⭐ RESOLVED IN PRINCIPLE — 2026-08-19, CHENG

**Do not move the layers wholesale.** The blocker names why, and it is not a side
effect: the learn page's nine doors land *inside* the game with a layer already
on. Strip the controls and the reader arrives in a state they cannot change or
understand — **that is the feature breaking**.

**But the underlying complaint is real, and one answer fits both:**

> **The controls follow the layer.** When a layer is active, its control lives
> with it; the base view carries none.

That is the **progressive-legend principle applied to controls** — name what is
on, nothing else — the same idea that shrank the legend. A reader who arrives
through a door finds the control for the layer they arrived with, and a reader
watching the base game sees no metric furniture at all.

**Related ruling the same day: the whistle layer defaults OFF** (§6 — the base
view is just the game and every metric is opt-in; the whistle layer is a metric
by that definition even though it counts nothing, and 63 faceoffs is a wall).

**Not yet built.** Tracked as **B2** in `docs/status.md`, the build list, and
still on the hold-for-the-novice-test list because the attention claim is a
prediction about a reader nobody has watched.
