# Doctrine

This file is the project. The visualizations are downstream of it.

Everyone can draw dots on a rink. What almost nobody does is refuse to draw
the dots they can't justify. That refusal is the whole differentiator, and it
only survives if it's written down and enforced, so: these are rules, not
aspirations. A feature that violates one of them does not ship, no matter how
good it looks.

## 1. Nothing synthesized, estimated, or invented. Ever.

Every mark on the screen traces to something the data actually says. If the
feed doesn't contain it, we don't draw it. We say we don't have it instead.

This is the rule that costs us features. Keep paying it.

## 2. Deterministic. Same inputs, same outputs, and we show the math.

No sampling, no fitted models, no hidden constants in the base view. Every
number on screen can be recomputed by hand from the event feed, and the app
will show you how if you ask it.

## 3. Honest limits stated on screen, not in a footnote.

The goalie's-eye view says it out loud: *we show you **where** and **what**,
never a fabricated **how**.* The limitation is part of the teaching, not an
embarrassment to be buried. A user who learns what we can't know has learned
something true about hockey data.

## 4. Motion must trace to a real event.

Animation is for legibility, never for realism.

**Allowed:** sequential temporal reveal; enter/emphasis animations fired on
real events; counters ticking as the stat is earned; honest
data-endpoint-to-data-endpoint connections drawn *schematically*.

**Refused:** interpolated skating; invented puck curves; smoothing across
gaps in the feed.

The puck **hops** between real events. It never glides. **The discreteness is
the honesty** — a viewer watching the puck jump is watching the shape of what
we actually know, and that's a more truthful picture of the data than any
smooth line would be.

## 5. Player figures are honest, because position and outcome are real.

A whimsical character glyph drawn at a real shot coordinate is fine: the
*location* is real, the *outcome* is real, and the character is a marker.
That's decoration, not fabrication.

Fabrication would be inventing where players skated or how they moved. That
needs per-frame tracking data we do not have and will not estimate.

**So where several players must be shown at once, they are arranged by role
(goalie · defense · forwards), never by tracked position — real skater
coordinates are not public, so we do not fake them. What is real is who is on
the ice, and when.**

That sentence is load-bearing rather than decorative: it is the reason the
empty-net figure draws the *change* — the goaltender leaving the crease, one
extra attacker arriving — instead of six attackers in a shape. Six bodies
arranged on the ice is a **formation**, and a formation is exactly the thing
this rule refuses. It has been applied against a figure we wanted to draw.

The stylization actually helps here — a figure that obviously reads as a
drawing can't be mistaken for a simulation. Cartoonishness is a form of
honesty.

## 6. Base view is just the game. Every metric is an opt-in layer.

The base experience is *watch what happened*. Corsi, high-danger, goaltending
— each is a **＋** button, off by default.

Architecturally each layer is a deterministic reducer over the event stream
that returns something renderable plus its own `countedEvents` breakdown:
what was counted, what was counted-but-surprising, what was excluded and why.

That seam is why "show me the work" and the teaching layer come for free. A
new layer is a new reducer, not a new app.

## 7. No expected goals in the base view.

xG is a *model*, not a measurement. It's the exact thing this project exists
as an alternative to.

High-danger is a **geometric rule** — distance to net ≤ 33 ft, |y| ≤ 22, and in
front of the goal line — because a rule is inspectable and a viewer can verify it
with a ruler.

The third clause arrived on 2026-08-25, when the slot became permanent furniture
on the ice. Furniture has to *be* the rule or a viewer cannot check a mark
against it — and drawn faithfully, the first two clauses reached past the goal
line to the end boards, because a radius does not stop at the net. Nobody had
seen it because nobody had asked the rule to draw itself. It cost 1.62% of the
attempts the rule counted and 0.89% of its goals, measured before it changed. If xG
ever appears, it must be a specific published model, labeled loudly as a
model, and never in the base view.

## The data ceiling (settled, do not relitigate)

Per-frame positional tracking of all skaters is licensed-only (NHL Edge +
Sony Hawk-Eye). Continuous realistic skating is therefore not honestly
buildable by us:

- Licensing it means a business deal and holding someone else's data.
- Computer-vision-from-broadcast produces *estimates*, which violates rule 1.

**Event-replay is the ceiling.** The public feed also has no passes,
dump-ins, or cycle play. We build at the ceiling and we say where it is.

## 8. A rate without a base rate is a story, not a measurement.

Any rate the app shows carries the number that says whether it is unusual.

Levi stopped all 18 even-strength shots he faced in the reference game. True, and it
sounds like the story of the night — until you ask how often that happens. A goalie
at league average blanks 18 shots roughly **one start in five**. So the honest
rendering is not a hedge about sample size, it is the actual figure:

> Levi faced 18 even-strength shots and allowed none. A goalie at league average
> does that in about one start in five.

Two counts and a base rate. No adjectives. This teaches the thing a novice most
needs and never gets told: **how to tell a real signal from a normal night.**

The same rule governs any filter that surfaces exceptions. "Every game where the
team that got outshot won" teaches that shots don't matter, unless it also says
*347 of 1,312 — 26%*. A list of exceptions without its base rate manufactures a
false impression out of entirely true rows.

## 9. Selective honesty is worse than none, because it looks rigorous.

A ledger that carefully enumerates why forty-nine events were excluded, while fifty-one
others were silently dropped upstream, is not half-honest. It is misleading in a way
that a plain omission would not be, because the visible rigour vouches for the
invisible gap.

Wherever we show our work, the work shown must be all of it.

## The bar

> "Wow, this really helps me visualize and learn the game."

Not "wow, that's slick." Teaching beats spectacle at every fork. If a change
makes it prettier and no clearer, it isn't progress.
