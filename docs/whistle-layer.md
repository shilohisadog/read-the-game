# The whistle layer, and the clutter it exposes

*For CHENG. §0–§5 were written while the extract change was shipped and the layer
was a proposal; they are left as they were argued. **§6 records what was then
built**, including the one thing the build found that the argument did not.
Measured against 30 real games and the live archive, not against intentions.*

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

**CHENG sharpened this and he is right: the banned-words test is a BLACKLIST OVER
AN OPEN VOCABULARY** — the same form as the `fetch(` grep and the ESM guard, both
of which passed while the thing they guarded was broken. `tired` is banned;
*gassed*, *worn down*, *been out there a while*, *looking for a change* are not.
And a green blacklist reads as "the copy was checked", which is the false assurance
that let the ESM leak ship.

**The positive form is the standard, and it cannot be evaded by synonym:**

> **Every sentence's subject is a rule, a recorded field, or a count. Never a
> player, a team, or a moment.**

That explains *why* `tired` fails instead of listing it. The blacklist stays as a
regression test for one known defect; it is not the gate.

**And the copy table carries provenance, like `surprising` does** — each row states
what it derives from (`rule: NHL Rule 81`, `field: rsn`, `count: attempts`). A row
with no source is the one to look at hardest.

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

### 2a. The counterexample exists, and the 30-game sample could not contain it

CHENG predicted a period can end on a whistle — an icing at the horn, a freeze with
two seconds left — leaving a stoppage with no faceoff after it. Run against **185
games, 8,400 stoppages**:

```
NO faceoff before the period ended: 3  (0.04%)
  2024020638  P4 00:48  stoppage -> period-end -> game-end
  2024021022  P3 20:00  stoppage -> period-end -> game-end
  2024021083  P4 02:32  stoppage -> period-end -> game-end
```

Thirty games said 1,279/1,279 and were silent. A hundred and eighty-five found it,
three times, at four hundredths of a per cent. **A rule calibrated on a sample
cannot be validated by that sample**, demonstrated on the rule I wrote yesterday.

**Decisions taken:**

- **The five-event window is dropped.** The rule is *the next faceoff before the
  period ends, or unplaced.* The 1,236/43 split is a fact about the data, not a
  parameter to encode.
- **Unplaced is a FIRST-CLASS STATE, not a fallback** (CHENG). *We know this
  happened and cannot place it* is a different claim from *nothing happened* — the
  same distinction as `refused` versus `absent` one layer down. An unplaced whistle
  appears on the timeline and not on the ice, and says which it is.
- The mutation must still be **synthesised**, not sampled. Three real cases exist,
  but a test that depends on finding one in the corpus is a test that passes for a
  reason unrelated to the code.

### 2b. The mapping only runs one way

CHENG also noticed a goal is followed by a faceoff with no stoppage between. Over
the same 185 games, what precedes a faceoff:

```
stoppage 8139 · goal 1114 · penalty 889 · period-start 584
hit 7 · missed-shot 3 · shot-on-goal 2 · takeaway 2 · giveaway 1 · failed-shot 1
```

So **faceoff → why is not a clean inverse** and must never be built: sixteen
faceoffs follow a play event with no stoppage at all. The direction that holds is
stoppage → the faceoff that restarts it.

## 3. The layer

`src/lib/layers/whistle.js`, same contract as the other three, and its recorded
gate from `docs/main-app-rework.md` is the right one:

> **Gate:** adding it touches no existing layer's code.

What makes it different from everything built this month: **it needs no measurement
and no base rate.** Corsi, danger and control-while-level all required deciding what
to count and then defending it. An icing is not a metric — it is a rule the novice
has watched a hundred times and never had named. That makes it the cheapest
genuinely-novice-facing thing on the list, and the one most exposed to §0.

**This is the first honest execution of the layer contract** (CHENG). Corsi and
goaltending were built together; the strength filter is a dimension of an existing
reducer. The whistle layer is the first genuinely independent one, so it is the
first evidence that the contract is an *abstraction* rather than a description of
two things that happened to look alike. **We should be willing to hear that it
fails** — better at the fourth layer than the tenth.

**Delayed penalties belong here**, settled: the referee's-arm-up rule is a *rule*,
which is what this layer teaches, and Corsi has no opinion about it. The
four-second gap between `delayed-penalty` and `penalty` is a recorded fact, so
explaining it needs no narration.

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
| **all** | today's behaviour, on purpose |

**`recent` is dropped, and CHENG's reason is better than mine.** I argued a fade
encodes time, which is real. The deciding problem is that **`recent` requires
choosing N, and N has no source in the data.** Last ten attempts? Last thirty
seconds? Whatever the number, it is ours, and the visitor sees a shot chart whose
contents were set by a threshold nobody stated — a model wearing a UI control, and
the same failure class as the five-event window in §2a.

`off` and `all` need no parameter. Both are complete statements: *this moment*, or
*everything so far*.

If a middle ground is wanted later, the honest one is **`all`, scoped to the current
period** — because the period is a boundary the *game* defines rather than one we
chose. Same visual benefit, no free parameter.

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
  never as a guessed sentence. CHENG asked whether an unknown `rsn` should halt the
  run or pass through. **It is already decided in code and his answer matches it:**
  `CONSEQUENTIAL` covers `typeDescKey` and `situationCode` only, so an unfamiliar
  stoppage reason is *noted and forgiven*, never blocking.

  What his question did surface is that **the recorded justification went stale the
  moment `rsn` shipped.** The comment read *"the extract drops stoppage detail
  entirely, so refusing a game over one is refusing over a field we never read."*
  We read it now. The decision is unchanged and the reason is stronger: a reason is
  **a label we carry verbatim and never compute on**, so an unfamiliar one explains
  nothing rather than explaining something wrong. Corrected in `extract.py`
- **the layer can say nothing happened.** A game with no icings shows no icings,
  and does not reach for something else to say

---

## 6. What was built, and what building it found

### 6.1 The defect the renderer exposed on contact

The layer stamped each whistle with `clock`, which is **elapsed**. Every other
display site on the page shows `rem`, which is **remaining**. So the panel would
have read *P2 01:40* beside a scoreboard reading *18:20* — a mixed clock, which
the guard that caught it calls worse than a consistently wrong one.

It was caught by `test/clock.test.js`, a check written months earlier for a
different reason, and it fired **the moment the layer entered the bundle** — not
when the layer was written, not when its twenty tests went green. The guard is
written over the shipped page, so a reducer nothing renders is a reducer it cannot
see.

> **A reducer with no renderer is a reducer nothing checks.**

Fixed at the source (`rem` in the record, not `clock` at the display), and pinned
in `test/whistle.test.js` so the field cannot drift back.

### 6.2 Whistles stack, and the argument never noticed

§2 established that a whistle is placed by the faceoff that restarts play. What it
did not follow through: **a faceoff happens at one of nine dots.** Forty-three
stoppages therefore land on nine spots, and forty-three circles drawn on nine
spots look exactly like nine circles.

So `marks()` groups by dot and carries the count. Eight icings at one dot draw as
one ring labelled **8**. Without it the ice would be showing a number it was not
saying — the same defect class as a metric with no denominator.

`marks()` and `latest()` live in the layer, not the page, and the page is asserted
to call them (`test/build.test.js`). A mark on the wrong dot is the kind of wrong
that looks completely right, so the rule that places it is tested rather than
eyeballed.

### 6.3 Trails shipped as `off` / `all`, default `off`

As argued in §4, with no middle setting. The default is the change Kevin has to
look at, because it is the one that alters what he sees before he touches
anything: the base view now shows the current moment, and the shot chart is one
click away under **keep every mark**.

One consequence worth stating plainly rather than discovering: with trails off,
**only the current high-danger chance is clickable**, because the earlier dots are
no longer on the ice. The tip line says so. The alternative — retaining marks
automatically when the High-danger layer is on — is refused for the reason §4
already gives: a default that depends on another toggle is a conflated field
wearing a UI hat.

Unplaced whistles never reach the ice under either setting, and the newest
whistle being unplaced draws **nothing** rather than falling back to the previous
one. A mark in the right place for the wrong stoppage reads as perfectly correct.

### 6.4 The renderer now has a gate, in two halves that check different things

| check | what it can see | what it cannot |
|---|---|---|
| `test/render-*.test.js` (harness: `test/helpers/page.js`) | boot the **shipped bundle** against a fake document, drives the real buttons and drags the real scrubber, reads the markup back | **CSS.** It has no stylesheet, so a panel it calls rendered may be `display:none` |
| `deploy.yml` browser step | the panel's **laid-out height** in an engine with a stylesheet | little else, and it deliberately asserts little else |

The second exists only for the claim the first structurally cannot make, and says
so in place rather than re-asserting the cheap half.

Both are paired against their own inverse — the ice must hold **zero** whistle
marks with the layer off, the panel must be **0px** tall with the layer off —
because "marks appear when it is on" is equally satisfied by a page that draws
them always, and "the panel is visible" by a panel that is never hidden.

**The render tests were mutation-checked before being believed**, all eight having
passed on their first run, which is when this project trusts a test least. Four
mutations to the shipped bundle — draw whistles unconditionally, remove the trails
skip, return no marks, drop the teaching sentence — each killed the test written
for it, and only that one.
