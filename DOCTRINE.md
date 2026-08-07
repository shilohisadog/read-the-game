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

High-danger is a **geometric rule** — distance to net ≤ 33 ft and |y| ≤ 22 —
because a rule is inspectable and a viewer can verify it with a ruler. If xG
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

## The bar

> "Wow, this really helps me visualize and learn the game."

Not "wow, that's slick." Teaching beats spectacle at every fork. If a change
makes it prettier and no clearer, it isn't progress.
