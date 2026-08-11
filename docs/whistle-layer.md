# The whistle layer, and the clutter it exposes

*For CHENG. The extract change is BUILT and shipped; the layer and the ice-surface
design are proposals. Measured against 30 real games and the live archive, not
against intentions.*

---

## 0. The governing incident, because it happened while writing this

I described an icing to Kevin like this:

> *Buffalo iced the puck — they cleared it the length of the ice untouched, so the
> faceoff comes back into their own end and they aren't allowed to change **tired**
> players.*

Kevin: *"this bit from your sentence falls into narration, no? tired players."*

He is right, and the word is the whole problem in miniature.

| clause | status |
|---|---|
| cleared it the length of the ice untouched | the rulebook's definition of icing |
| the faceoff comes back into their own end | the rulebook |
| they aren't allowed to change players | the rulebook (Rule 81) |
| **tired** | **a state of these players, this shift, that the feed never recorded** |

*Why the rule exists* is that a team would otherwise ice the puck to rest a tired
line — that is a fact about the rule. *These players are tired* is a claim about
this moment, and nothing in the feed says it.

**And I wrote it in the same message where I said this line was easy to cross.**
That is the argument for the layer being reviewed rather than written carefully: it
is made almost entirely of sentences, and sentences are the one artifact here with
no gate on them. Every number on this site has a check that can fail. No prose does.

**Proposed rule, and §5 makes it testable:**

> **Explain the rule. Never narrate the moment.**

## 1. What shipped already

`extract.py` now carries `rsn` and `rsn2` on stoppage events. Reason: it is the one
field on a stoppage that cannot be reconstructed from anything else we hold, which
is the §4.5 test for belonging in the extract. The running score failed that test
and stayed out; this passes it.

Verbatim, never interpreted at extract time. The draft whistle layer mapped
`reason → copy` and did `if (!reason) continue`, which would have silently dropped
`tv-timeout`-as-primary and `puck-in-penalty-benches` — both real, both absent from
the reference game. `--additive` reports: new keys `['rsn','rsn2']`, nulls filled
**none**, nothing existing disturbed.

Volume, over 30 real games: **433 goalie freezes, 240 icings, 172 pucks in the
netting, 125 offsides**, 65 in the crowd, 51 frozen, 24 hand passes, 21
referee-or-linesman, 19 high sticks. A TV timeout rides along as `secondaryReason`
208 times.

## 2. A finding that reverses what I told Kevin an hour earlier

I said the whistle layer could only be a timeline, because stoppages carry no
coordinates. **The stoppage carries no coordinates; the faceoff that restarts play
does.**

```
faceoff           63 events, 63 with x,y
stoppage          43 events,  0 with x,y
```

Across all 30 games: **1,279 of 1,279 stoppages are followed by a located faceoff
before the period ends.** 1,236 of them are the very next event; the rest sit 2–5
events later, behind a penalty.

So a whistle CAN be placed on the ice: *what* from the stoppage, *where* from the
restart. That is a sequence fact from the feed, not an inference about play.

**Two things I want attacked here.** First, "the next faceoff within five events"
is a window **fitted to this sample** — the honest rule is *the next faceoff before
the period ends*, with no window at all, and the data merely says it is never far.
Second, 1,279/1,279 is a rule with no counterexample in it, which reads as
confirmation and is actually silence. It needs a mutation: a stoppage with no
following faceoff must produce an unplaced whistle, not a wrong one.

## 3. The layer

`src/lib/layers/whistle.js`, same contract as the other three, and its recorded
gate from `docs/main-app-rework.md` is the right one:

> **Gate:** adding it touches no existing layer's code.

What makes it different from everything built this month: **it needs no measurement
and no base rate.** Corsi, danger and control-while-level all required deciding what
to count and then defending it. An icing is not a metric — it is a rule the novice
has watched a hundred times and never had named. That makes it the cheapest
genuinely-novice-facing thing on the list, and the one most exposed to §0.

**Delayed penalties overlap it.** `docs/strength-filter.md` notes the feed emits
`delayed-penalty` then `penalty` four seconds apart; as two rows it teaches nothing,
as one moment with the gap explained it teaches the referee's-arm-up rule. Whose
layer that belongs to is an open question, not a resolved one.

## 4. The ice gets crowded — Kevin's observation, and it is a doctrine question

Every attempt persists on the rink, so by the third period the surface is a wall of
dots. Kevin asked whether to stop retaining them, and whether to add toggles.

**The accumulation is already a metric shown by default**, which sits awkwardly with
Doctrine §6: *the base view is just watch the game; every metric is an opt-in layer.*
A permanent map of every attempt is a shot chart, and nobody turned it on.

**Proposed, and I want the middle option argued about:**

| trails | what you see |
|---|---|
| **off** *(default)* | the current moment. The base view keeps its promise |
| **recent** | the last N attempts, fading with age |
| **all** | today's behaviour, on purpose |

*Recent* is the one to attack. A fade encodes **time**, which is real data and not a
fabrication — but it is also the first visual encoding on this site that is not a
recorded value, and "discreteness IS the honesty" was a hard-won rule. It may be
that only off/all are defensible.

Deliberately **not** proposing: retention that switches itself on when the Control
layer is enabled. A default that depends on another toggle is a conflated field
wearing a UI hat, and this project has paid for those.

**Whistle marks are their own toggles**, not one lump: *show faceoffs*, *show
icings*, *show offsides*. Different questions, different densities — 8 icings a game
is legible on the ice, 63 faceoffs is another wall.

## 5. What gets tested

The measurable half is routine — conservation over every event, unknown reasons
carried not dropped, the placement rule with the mutation from §2, no toggle
changing a count.

**The prose is the part with no gate, and §0 is why that matters.** Concretely:

- **every teaching string is data, not code** — one table of `reason → sentence`,
  so the sentences can be reviewed as a set rather than found by reading the layer
- **a banned-words test over that table**: `tired`, `desperate`, `momentum`,
  `pressure`, `dominating`, `deserved`, `unlucky`. Crude, and it would have caught
  the actual defect
- **every sentence must survive being read literally about any game it can appear
  in** — the copy may describe the rule and the recorded fact, never the state of
  the players
- **an unrecognised reason renders as the reason itself**, never as silence and
  never as a guessed sentence
- **the layer can say nothing happened.** A game with no icings shows no icings,
  and does not reach for something else to say
