# The game has no index

**For CHENG. Kevin, 2026-08-16, still watching the same game:**

> *"Once an event fires, there's no easy way to go back to that event, we'd have
> to move the slider back and forth to try to recapture that time of play. I
> would like to explore if there is any easier way to be able to go back to
> specific events, an 'event scoreboard' of some sort, where the events are
> listed or scrolling or something and I can click on one and the play
> automatically rewinds to that specific event."*

This is the second complaint from the same viewing session, and it is a
different one. [`rink-and-card.md`](rink-and-card.md) was about **what the page
says at the playhead**. This is about **whether the playhead can be aimed.**

## 0. Method

Real Chromium, the local build served over HTTP with the CSP stripped, game
`2025030416` (CAR at VGK, 14 June 2026 — the same game the last audit walked),
at 1100, 390 and 360 CSS pixels. Geometry is read off the running page.
Event counts are computed by importing the shipped layer modules and reducing
the real game file, not by re-deriving the rule in the measuring script.

**CHENG has not seen this one yet.** No diagnosis to check against, so §11 makes
the case against building it instead.

---

## 1. The slider cannot be aimed — measured

The transport's only seek control is `#scrub`, a range input over the playable
events. Measured widths, against 281 playable events in this game:

```
viewport   scrub track   events per pixel   what one fingertip (40px) covers
1100px       306px            0.92                 37 events
 390px       339px            0.83                 33 events
 360px       166px            1.69                 68 events
```

Two separate defects fall out of that table, and only one of them is resolution.

**Resolution.** On a phone at 360px the track collapses to 166px — the transport
has wrapped to three rows by then and the slider shares its row with nothing, but
the row is short. One pixel of drag is 1.7 events, and a finger is not a pixel:
**a single touch spans about 68 of the game's 281 events**, a quarter of the
game. Landing on a chosen event by dragging is not a matter of care. It is below
the resolution of the input device.

**Aim.** On a desktop the mouse *can* address a single pixel and a pixel is
about one event — so resolution is adequate at 1100px and the complaint still
stands, because **the track carries no marks.** There is nothing on it that says
where the goals are. The viewer drags, reads the clock, overshoots, drags back:
which is exactly the "move the slider back and forth" in Kevin's sentence. He is
not describing imprecision. He is describing **hunting blind.**

A marked track would fix the aim on desktop and would still not be tappable on a
phone: a mark 3px wide is not a touch target at any density.

## 2. There are two complaints inside the one sentence

They want different mechanisms and they should be judged separately.

**A — "the thing that just went past."** The goal fired, the caption came and
went, and there is no *back*. The transport has play, pause, three speeds and a
slider; **there is no step control at all**, forward or back. To re-see the
event two frames ago, the only tool is the slider from §1.

**B — "where were the goals?"** There is no index of the game. Nothing on the
page can answer *"take me to the second-period penalty"* without watching the
whole thing again.

A is a **transport defect**: a standard control is missing and the substitute is
measurably unable to do the job. B is a **feature**, and a more speculative one.
Kevin asked for B; his own first clause describes A. Both are worth doing and
they should not be argued as one thing.

## 3. What the page already treats as a moment

Read off `builders/build_main.py`, not inferred. Only two things in the whole
renderer fire a caption:

```js
if(cur&&cur.type==='goal'){flashNet(cur.own);caption(cur,'goal');}
else if(cur&&hdOn&&isHD(cur)){lastHD=i;caption(cur,'hd');}
```

So the set of events that get **a moment of their own** is:

| event | gets a moment | gated on |
|---|---|---|
| goal | caption, net flash, named label with scorer and assists | always |
| shot from the slot | caption | the slot layer |
| stoppage | the amber ring and the whistle card | the whistle layer |
| blocked shot | the blocker's name on the label | the blocked layer |
| **penalty** | **nothing beyond a `LAB[]` label, same as a hit** | — |

**That last row is a finding, not a design choice.** A penalty is the one event
in the feed that changes the *conditions of the game* — it is why `Even strength
only` exists as a filter, and the strength module reads it — and the page marks
it exactly as loudly as a giveaway. Whatever happens to the index, a penalty
should fire a caption. That is a one-line change and it is independently
correct.

## 4. What goes in the index, and why it is not a hand-picked list

The temptation is to write a list of "important" event types. That is an
editorial judgement with nothing behind it, and this project does not get to
make those.

**The rule I would hold to: an event is in the index exactly when the page
already gives it a moment of its own.** The index is then a *record of what you
were shown*, never a new opinion about what matters — and it follows the layers
for free, the same grammar the legend already uses (a key appears with the layer
that draws it) and the same grammar `#work` already uses (the button exists only
with the Control layer on: `#rg.corsi #work{display:inline-block}`).

Counts for the measured game, 343 events, 281 playable:

```
base — goals + penalties                                    9
+ the slot layer                                           40
+ the slot layer + the whistle layer                       94
```

Nine chips for a whole game with no layers on. That is scannable, and it grows
only when the viewer asks it to.

**The adversarial case:** a list that changes under you when you press a layer
button is a list a novice may not trust. I think it survives, because the
alternative is worse — a fixed index containing events the page never marked is
an index of things you did not see, and the first one you click will land on a
frame where nothing happens.

## 5. Past-only, and the argument is not spoilers

Should the index list the whole game, or only what has already played?

The spoiler argument is weak here and I do not want to lean on it: `#gl` prints
`final CAR 3–0 VGK` on first paint, unconditionally. **This site does not keep
the result a secret and never has.**

The argument that does hold is the conversion. The north star is *a visitor
watches one game with one metric layer turned on.* A full-game index is a
boxscore, and a boxscore competes with watching — it offers the whole game as a
list of nine rows you can read in four seconds. **A past-only index cannot be
read instead of watching; it can only be used to re-watch.** It is a memory aid
for a viewer, not a summary for a skimmer, and those are different products.

It also happens to be exactly the thing Kevin asked for — *go back* — and it
solves its own length problem: nine chips at the horn, one or two in the first
five minutes.

A deep link (`?at=2-14:32`) lands mid-game and the index arrives already
populated to that point, which is consistent: it lists what this session has
been shown.

## 6. The shape — a strip, not a panel

Three shapes, costed in the vertical pixels R just spent a day recovering
(read-once prose 576px → 122px):

| shape | height | discoverable at the moment of need | tap target |
|---|---|---|---|
| collapsible panel, like *Show me the work* | 0px closed, ~1,270px open for 53 rows | no — it is closed when you want it | fine |
| panel capped and scrolled | ~180px always | yes | fine |
| **horizontal strip of chips** | **~34px always** | **yes** | **chip ≈ 70×28px** |

The strip wins on all three, and it wins for a fourth reason that is not about
pixels: **it shares an axis with the scrubber directly above it.** Left is
earlier, right is now, in both. The strip is a labelled, zoomable view of the
same line the slider slides along, and the two read as one control rather than
two.

New chips append on the right and the strip auto-scrolls to keep the playhead in
view — which is the "scrolling" in Kevin's sentence, and it means **the default
visible window is the last few things that happened**, i.e. complaint A answered
by the resting state. Swiping left reaches the rest of the game, which is
complaint B.

The known weakness of a horizontal scroller is that off-screen content is
invisible, and I am accepting it deliberately: here the off-screen direction is
*the past*, the near edge is the thing most likely to be wanted, and the whole
row is at most nine chips wide at base.

A chip carries a clock and a mark and nothing else — `P2 14:32 🚨` — because
prose in the transport is how this becomes a card, and §8 is about why it must
not.

## 7. What clicking does

Proposal: **seek, replay the moment, and stay paused.**

- `stop()` first. You clicked because you wanted to look; at teaching pace the
  playhead would leave the event in 650–3000ms.
- `set(k, true)` — the `newest` flag is what makes `caption()` and `flashNet()`
  fire, so the goal is *called again*. This is the difference between jumping to
  a frame and re-seeing a moment, and it is one argument.
- `▶` then resumes from there, which is already how `play()` behaves.

**One implementation wrinkle worth stating rather than discovering.** `render`'s
`newest` flag drives two unrelated things: the caption, and the counter bump
(`if(a>prevA)flash('cA')`). `prevA`/`prevH` are module-scoped and would be stale
after a jump, so a forward jump would bump the counter as if a single attempt
had just happened when in fact forty had. The flag needs splitting — the caption
should fire on a jump, the bump should not.

Rewinding *to a few events before* the target and playing into it was
considered and dropped: the build-up to a goal in this renderer is two or three
dots appearing, not video. There is nothing to build up to.

## 8. The doctrine question: is an index a card?

CHENG's rule from the last audit, adopted: **no card narrates an EVENT; a card
may state a CONDITION true at the playhead** — mechanically, a statement is a
condition iff it can be recomputed from the game state at the playhead alone,
with no reference to when it started.

**Every row of this index narrates an event.** `P2 14:32 🚨 GOAL` fails the test
outright, and it is supposed to.

My reading is that the rule governs the **read-out** — the surfaces below the
rink whose job is to say what is true now — and this is **transport**, whose job
is to say where you can go. A chip is not a claim about the present; it is a
label on a destination. The rule and the index are not in conflict because they
are answering different questions.

But the risk is real and it is the exact one we just spent a day removing: **put
a row of event descriptions in a card-shaped box below the rink and a viewer
reads it as commentary**, and the disjointedness comes straight back in a new
costume. So the separation has to be structural rather than intentional:

1. it lives **in the transport**, above the legend, not among the metric cards;
2. it is styled as a control — tabular clock, no sentences, no explanations;
3. it never updates in response to *the playhead* except to highlight and
   scroll; it changes only when a new event is added or a layer is toggled.

If those three do not survive review, the index does not belong below the rink
at all.

## 9. What I would propose

1. **`⏮` / `⏭` step buttons in the transport.** One event at a time. This is the
   defect fix from §2A, it is independent of everything else here, and at 1100px
   it costs zero vertical pixels — the transport is one 40px row with 306px of
   slider to give up. At 360px it adds a row (~36px); the honest alternative is
   that a phone gets step buttons and a shorter slider, which is a trade the
   §1 numbers already say is worth making.
2. **A caption for penalties** (§3). Independently correct, and it is what makes
   the base index nine chips rather than three.
3. **The event strip** (§4–§8): past-only, layer-following, ~34px, click to seek
   and replay the moment.
4. **Marks on the scrub track**, aligned with the chips. Display only, no click.
   Cheap once the chip set exists, and it fixes the *aim* half of §1 on desktop.

1 and 2 are small and I would do them first regardless of what happens to 3.

## 10. What I want CHENG to rule on

1. **Is §8 right that transport is exempt from the EVENT/CONDITION rule** — or
   does an index of events belong somewhere other than below the rink?
2. **Past-only, or the whole game?** §5 argues past-only from the conversion
   rather than from spoilers. The counter I cannot dismiss: a viewer who wants
   to show a friend the third-period goal has to sit through two periods.
3. **The strip, or a capped scrolling panel?** §6 costs them in pixels and I
   have taken the strip; a list is genuinely easier to scan a whole period in.
4. **Does the index follow the layers (§4), or is it fixed?** I have argued that
   a fixed index lists events the page never marked, but a list that changes
   under the viewer is a real cost.
5. **Should this wait for the novice test?** §11.

## 11. The case against building it at all

`site-purpose.md` §9 splits the work into *build before the test* and *wait for
the test*, on the principle that where being wrong is expensive to undo, we
should stop guessing. This has a claim on both lists.

**Against:** the event index serves a viewer who has watched enough of a game to
want to go back to something in it. That is an engaged repeat viewer. The
novice tester has not watched one game yet, and the conversion we just wrote
down is *a visitor watches one game* — not *a visitor navigates a game*. Adding
a second seek control to a transport a novice has not yet used once is
optimising the wrong end. A strip of chips under the slider is also one more
thing on a page whose whole recent history is removing things.

**For:** §2A is not a preference. A transport with no step control, whose only
seek device covers 68 events per fingertip, is missing a standard control, and
the measurement does not depend on who is watching. And Kevin found it by
watching — he is the closest thing to a novice who has used this site, which is
the exact argument that moved the blocked-shots layer ahead of *How it works*.

**Where I come down:** items 1 and 2 now, on the defect argument. Item 3 now
*if* CHENG clears §8 and §5, because it is cheap and reversible and 34px is not
a page-shaping commitment — and item 4 after it, or not at all.

---

## 12. CHENG's rulings, 2026-08-16

**Before the rulings, the process failure.** This document was written and
reviewed without ever leaving the laptop — the second time, after
`deep-link-seam.md`. CHENG reviewed the summary, not the artifact. The habit
that closes it is the one used for `below-the-rink.md`: **origin matches local,
the file is in the remote tree, and it fetches back over the wire** — all three,
run *before* saying "ready for CHENG."

### The doctrine question (§8): exempt, but not for the reason I gave

I argued *transport is not read-out*, which CHENG accepted the conclusion of and
rejected the reasoning for — it is a category anyone could assert. The
distinguishing property is mechanical and is the same test that separated
condition from event:

> **A chip's content is invariant under playhead movement; a card's is not.**

`P2 04:12 · goal` is equally true at every frame of the game. That is why a card
drifts and a chip cannot, and it is the criterion that saved the empty-net note.

**And the risk I raised is the binding constraint, enforced structurally rather
than by intention:** the strip lives *inside the transport*, above any card,
tabular clock, no sentences. Move it, box it, or give it a heading and it becomes
a second read-out. CHENG's test for it — *"crude and would work"* — **no chip
contains a verb.**

### §5 past-only: ruled, and the conversion did the work

*"A full-game index is a boxscore, and a boxscore competes with watching."*
CHENG: the first time the conversion definition has settled a design question on
its own, which is the strongest evidence it was the right definition.
Deliberately not arguing spoilers is right — the footer prints the final score on
first paint, so a spoiler argument here would be theatre.

### §6 and §4: the strip, and it follows the layers

Both settled by the same measurement. A capped panel is 180px permanently, which
the R audit priced at a quarter of a phone screen for something wanted
occasionally; a collapsible one is closed exactly when it is needed. The strip is
34px and auto-scrolls, so **complaint A is answered by the resting state doing
nothing.** Layer-following, because a fixed index needs someone to choose the
fixed set — the editorial judgement the inclusion rule just removed.

### §4, the property the audit did not claim: the rule is self-correcting

The penalty gap surfaced *because* the inclusion rule was applied. Asking "what
gets a moment of its own?" is what exposed that penalties do not. Any future gap
in captioning will surface the same way, which is a reason to keep the rule even
where the index does not ship.

### §11 sequencing: CC's own case against, taken

| | ruling |
|---|---|
| `⏮` / `⏭` step buttons | **build now** — a missing standard control, and §1 does not depend on who is watching |
| a caption for penalties | **build now** — independent of the index entirely, and correct regardless |
| re-firing the caption on a jump | **keep it** — *"one argument to `set()`, and it is the whole difference between jumping to a frame and re-seeing a moment. That distinction is the product."* |
| the event strip | **hold for the novice test** |
| scrub-track marks | **not yet, possibly not at all** |

**Why the strip waits, in CHENG's words:** *"This serves a viewer who has watched
enough of a game to want to go back into it."* The conversion is *watches one
game with one layer on* — the strip serves the step after. Building it now means
building a second seek control for a transport nobody has been observed using
once. And the test produces evidence directly on point: **does she scrub at
all?** Straight through, and the strip is speculative. Hunting for a goal she
missed, and it is confirmed — with the added information of *what* she was
hunting for.

**Why the marks may never come:** they answer the same complaint the strip
answers, and shipping both is two answers to one question. If the strip lands,
marks are redundant; if the test says people scrub constantly, marks may be the
better single answer. The decision gets *cheaper* by waiting, which is rare.

## 13. Built 2026-08-16

Items 1 and 2 of §9, plus the `newest` split from §7.
