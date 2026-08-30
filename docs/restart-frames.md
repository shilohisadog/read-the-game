# Restart frames — what the replay does at a whistle

**Round one reviewed by CHENG 2026-08-30 — §9 his rulings, §10 the three
measurements they forced, §11 the mechanism that survived.**

**⭐ ROUND TWO IS §13–§14 AND IT IS THE LIVE ONE.** Kevin reframed the question
from *what is honest to draw* to *what would a novice want to look at*, and the
answer is a lesson that has been painted on our own ice all year with nothing
naming it. **§14 carries the recommendations and the six things I want ruled.**

**Nothing is built.**

Kevin, 2026-08-30, after locking in the halved pace: *"now, how to handle the
faceoffs/restarts, that's the current question."*

It started as a wrong turn. He linked a moment in WSH @ TOR
(`?game=2025021245&at=1-17:30&layer=whistle`) and asked whether anything sat
between a shot on goal and the faceoff that followed it — his guess was that the
goaltender had frozen the puck. The feed says otherwise for that whistle, and he
withdrew the question himself. What survived the goose chase is the subject of
this document.

⚠️ **The framing that stood here was "rendered as nothing at all" and CHENG is
right that it overstates.** The restart faceoff *is* on the timeline and *is*
drawn — at `r=1`, 20% opacity, as excluded material. **Rendered as noise, not
rendered as nothing**, and the fix is correspondingly smaller. The larger framing
invites a larger intervention, which is how a document talks itself into one.

---

## 1. Method, stated first

**60 games**, pulled live from `data.readthegame.co/extract/<id>.json` on
2026-08-30. Selection: every 74th viewable row of the published `catalog.json`
(4,490 viewable / 60), which is a **systematic spread across the archive, not a
random sample**. Seasons 2023, 2024 and 2025 are all represented. 3,341
faceoffs, 2,584 stoppages, 15,546 timeline frames, 407 goals.

⚠️ **One extract failed to download on the first pass and succeeded on retry** —
the same throttling shape `derive.yml` was hardened against on 2026-08-30. An
earlier draft was written at n=59 and every figure below has been re-derived at
n=60.

⚠️ **Local fixtures were deliberately not used.** Five of the eight extracts in
`test/fixtures/` predate the 2026-08-18 penalty/miss decision, and quoting rates
off them has already produced two wrong refusals on this project. Everything
below is from the live archive.

Two definitions are used throughout and they differ:

- **restart, by adjacency** — a faceoff whose immediately preceding event is a
  stoppage. **2,503** of them.
- **restart, by pairing** — a faceoff that `whistle.js` walks *forward* to from a
  stoppage or delayed penalty, stopping at a period boundary. **2,653** of them.
  This is the reducer's own rule and is the one that matters, because it is the
  rule any implementation would import.

---

## 2. What a restart is on screen today

⛔ **READ THE SECOND ROW BEFORE THE FIFTH.** These two facts sit next to each
other and composing them produces a false conclusion — see §10.1, where that is
exactly what happened. **A stoppage is not a frame.** Anything true of a
stoppage's clock is not thereby true of any frame the viewer sees.

| | measured |
|---|---|
| timeline events per game (`EV`, after `SKIP`) | **259.1** |
| **`SKIP` removes every stoppage from the timeline** | **the playhead never lands on one** |
| faceoffs per game | **55.7 — 21.5% of the timeline** |
| restarts per game (pairing) | **44.2 — 17.1% of frames** |
| restarts sharing the exact clock **with their whistle** *(not with any frame)* | **2,503 of 2,503 — 100%** |
| stoppage → its restart, recorded gap | **0 seconds, 2,581 of 2,581** |
| frames captioned today (goal or penalty) | **13.9 — 5.4%** |

And this is how it is drawn:

| where | what |
|---|---|
| `app.js:17` | `SKIP` drops `stoppage` from `EV` entirely — so no caption ever narrates one |
| `app.js:683` | `cls = goal ? 'goal' : ATT.has(type) ? 'att' : 'excl'` — a faceoff is `excl` |
| `app.css:407` | `.excl{fill:var(--muted);opacity:.2}` |
| `app.js:692` | **`r = 1`** for a faceoff, against 1.7 for an attempt and 3.2 for a goal |
| `app.js:711` | `ARRIVE[e.type] ‖ 'pop'` — there is **no faceoff entry**, so a restart lands as the default |
| `app.css:1428` | the `.cur` opacity rescue exists **only inside the blocked layer** — it does not apply in the base view |
| `app.js:1276` | `captioned(e) = goal ‖ penalty ‖ (hdOn && isHD(e))` |
| `app.js:1277` | `dwell(e) = captioned(e) ? frameMs + 900 : frameMs` |

⭐ **So, in the base view a novice actually arrives in: one frame in five is a
radius-1 grey dot at 20% opacity, arriving with the default animation and no
pill.** Play stopping — the thing hockey does 44 times a night, and the moment a
new viewer most needs to catch up — is drawn as the faintest mark the page has.

The whistle *layer* handles this well and is not the subject. The base view is.

---

## 3. Two things already ruled out, verified rather than trusted

### 3.1 ⛔ The ice may not name the stoppage — and the finding reproduces

Removed 2026-08-27 (`app.js:1785`, CHENG's finding). The recorded reason: over 53
games the clause fired on 2,354 faceoffs and on **83** of them the ice named a
different whistle than the box, because more than one whistle can pair to one
dot — `ice "icing" box "referee-or-linesman"`.

**Re-derived here on an independent 60-game sample using the reducer's own
forward-walk: 84 of 2,653 restarts — 3.2%, against the recorded 3.5%.** Same
phenomenon, same order of magnitude; the claim holds.

⚠️ At n=59 this measurement returned **exactly 83** and an earlier draft reported
it as reproducing the recorded number precisely. It was a coincidence, and
stating it would have been a striking fact that was not one.

⚠️ An adjacency-only walk of mine gave **1.2%** and was wrong — a delayed penalty
pairs forward across intervening plays, which adjacency cannot see. The two
walks are not interchangeable and §1 names which is which for that reason.

### 3.2 ⛔ A whistle bonus constant is the tier ladder coming back

My first instinct in-thread was `WHISTLE_BONUS`, extending the frame before a
stoppage. That is wrong, and `docs/event-timing.md` §7.2 is why, in its own
words:

> The tiers encode **an editorial judgement about which events matter** — a goal
> is worth 4.6 ordinary plays. That is the one kind of judgement this site
> refuses everywhere else.

`app.js:1199` states the replacement rule: **"A frame lasts as long as what is on
it takes to read"**, quantized to two states because the page has two, both
*observable properties of the frame rather than a taxonomy someone chose*. And
`captioned()` is deliberately the single source both the schedule and the
renderer read — which is what made the old *"a fifth of the replay pauses for
nothing"* defect (§4 of that doc, 19.6% of frames) structurally impossible
rather than merely guarded.

A restart bonus reintroduces exactly the ranking that was deleted.

---

## 4. What was proposed to CHENG

⚠️ **§4.1's carrier was REJECTED in review — see §9.3 and §11.** It is kept here
because the reasoning that produced it is the reasoning that has to be answered.

### 4.1 ⛔ SUPERSEDED — a restart becomes a *captioned* frame

**The pause is not added. It is earned.** Do not invent a constant; make the
restart frame carry something, and the existing machinery pays it the 900 ms it
already pays a goal. `captioned()` learns one more state.

**The claim on the frame is the boundary, never the reason.** *Play stopped and
restarted here* — nothing about icing, offside or a covered puck. **This half
survived review; the pill as its carrier did not.**

⭐ **The pairing rule must be imported from `whistle.js`, never restated in
`app.js`** — then the base view and the layer agree by construction rather than
by two rules kept in step, the same move as `place()`. **Survived, and CHENG
called it the load-bearing part.**

### 4.2 The restart mark stops being excluded material

A restart draw leaves `.excl`. This is a scoped slice of the standing
20%-opacity question — not *un-dim everything*, only *the draw that restarts play
is not noise*. The U10 arrival vocabulary (`jolt`/`halt`/`snatch`/`slip`) has no
entry for a faceoff and a `drop` is the obvious fifth.

⚠️ **`.excl` exists to protect a hierarchy and this spends some of it.**
Quantified in §10.2: it takes distinct arrivals from 46.4% to **63.5%**, making
the distinct treatment the majority. **Survived review and is now the only
carrier.**

### 4.3 Out of scope, named so it is not silently dropped

- **Line changes.** ⛔ **Now measured and refused on the data, 2026-08-30.** Kevin
  proposed pausing at a goal to list who was on the ice, leading into
  plus/minus. Across **407 goals in these 60 games**, `shifts` agree with the
  league's `situationCode` on **73.5%** at the goal's own second and **91.6%** one
  second earlier — the gap is a real mechanism, since a goal stops play and
  shift ends cluster on it. **`shifts` return nobody at all on 7.6%** (31 goals,
  18 past the last recorded shift). And 91.6% is agreement on a **count**, not on
  the **names**: six right numbers can be six wrong people, so a named list is
  bounded above by 91.6% and unmeasured below it. ⚠️ **The stored figure was
  "shifts reproduce the situation code at 97%" — that was measured on SHOTS,
  sampled, n=120. A goal is the worst moment in the game to ask shifts a
  question, and the remembered number said the opposite.** Possibly unblocked by
  a re-extract if the league publishes on-ice or plus/minus directly; **not
  verified, not assumed.**
- **The stoppage reason in the base view.** §3.1.
- **The scoreboard/rink ratio on desktop** (Kevin, same session). `app.css:11`
  caps `.wrap` at `max-width:900px`, so above ~916px the layout stops responding
  entirely. Filed as **U12**, unmeasured, unrelated.

---

## 5. ⛔ What the caption carrier would have cost — retained, no longer proposed

| | today | the rejected proposal |
|---|---|---|
| captioned frames per game | 13.9 | 58.1 |
| share of frames captioned | 5.4% | 22.4% |
| replay length | ~945 s | ~985 s (+4.2%) |

⚠️ **The density argument here was the weaker half and CHENG replaced it.** The
problem was never 22.4% of frames carrying a pill; it was **the same sentence 44
times a game**. See §9.3.

⚠️ **The "no honest subset" argument still stands and is now moot** rather than
overturned — any *interesting restarts* cut is a chosen tier, and the answer was
never a subset but a quieter carrier that can be always-on.

---

## 6. ✅ RULED — where the beat lands

**(A) on the faceoff frame**, against **(B) on the frame before**. CHENG ruled
(A), and on a stronger argument than the one offered:

> The record contains no interval between the whistle and the drop. They're one
> moment. So (B) would lengthen a frame to represent a duration the feed says is
> zero — which is closer to inventing than to pacing, and it's the same shape as
> drawing a path between two dots.

⭐ **And the caveat strengthens it rather than weakening it.** The gap is zero in
*game-clock* seconds because the clock is stopped; real time did pass. So (B)
would represent an interval we know exists and cannot measure — which makes
choosing its length **a parameter with no source in the data**, the failure this
project names by that phrase.

**Doctrine note, still worth recording:** (B) was never a foreknowledge spend.
The standing rule always permitted foreknowledge to **set the pace**; the
2026-08-28 spend was needed only to let it **point at the ice**.

**Side-channel check:** 382 of the 648 non-restart faceoffs follow a **goal**
with no stoppage between them, so **no beat fires before a goal** and its
absence announces nothing.

---

## 7. The six questions put to CHENG

Answered in §9. Retained because the answers are only legible beside them.

1. Is *"play stopped and restarted here"* genuinely different from naming the
   whistle, or is it §3.1's clause wearing a smaller hat?
2. Is *"is a restart"* an observable property of the frame, or a taxonomy we
   chose?
3. 22.4% of frames captioned — punctuation or noise? Is *no honest subset* right?
4. (A) or (B) in §6?
5. Does promoting restarts out of `.excl` damage the hierarchy it protects? Is
   there a better carrier than the pill?
6. What am I not seeing?

⭐ **§7.6 was the useful one.** The self-diagnosis offered with it — *found a
gap, talked myself out of the two obvious fixes using our own record, kept the
third* — was correct, and CHENG's closing line is the sharper version:
**the third thing survives, but because the carrier changed, not because the
caption argument won.**

---

## 8. What needs no re-derivation

- **Restart reasons**, as a share of the 2,503 adjacency restarts:
  `goalie-stopped-after-sog` **35.2%**, `icing` 18.7%, `puck-in-netting` 12.7%,
  `offside` 9.3%, `puck-frozen` 5.0%, `puck-in-benches` 4.7%, `puck-in-crowd`
  4.6%, `tv-timeout` 3.6%, everything else under 2%.
- **Faceoffs that are not restarts**: 382 after a goal, 264 after a penalty, 190
  period openers, 2 after a hit.
- **Stoppages carry `rsn`, and `rsn2` on 17.9% of them**; **93% of those
  secondaries are an administrative break** (TV or team timeout) and 7% say what
  actually happened. `referee-or-linesman` is the outlier — 53 occurrences, 74%
  carrying a secondary — and its copy *"the puck struck an official"* asserts a
  specific event the feed does not record, on at least 28 of those 53. **Separate
  defect, separate fix, not this document.**

---

## 9. CHENG's review — 2026-08-30

### 9.1 Q1 ✅ Genuinely different, and the distinction is *selection*

§3.1's defect was a **selection** error: several whistles pair to one dot and the
ice picked one. *"Play stopped and restarted here"* requires no selection — when
two whistles pair to one dot the claim is true twice over.

> The epistemic difference is exact: **"at least one" versus "this one."** The
> first is verifiable from the presence of a record; the second requires
> choosing among candidates and can be wrong.

⭐ **Condition attached: no singular implication in the copy.** *"After the
whistle"* is fine. *"The whistle that stopped play"* reopens the seam **by
grammar rather than by data**. That is a testable constraint on the string, not a
matter of taste.

### 9.2 Q2 ✅ Observable, because it has no parameter

> Can it be computed from the record without a threshold or a ranking?

The tier ladder failed that test (`4.6 ordinary plays` was chosen); so did the
five-event placement window and `recent` trails. The pairing rule has no number
in it — walk forward from a stoppage to a faceoff, stop at a period boundary, and
**the period boundary is a boundary the game defines**, the same escape the
census's run-of-play unit used.

⭐ **And CHENG called §4.1's import condition the load-bearing part:** restated
in `app.js`, it stops being one observable property and becomes two rules that
have to agree — the shape `place()` and `page.csp` exist to prevent.

### 9.3 Q3 + Q5 ⛔ The pill is the wrong carrier

The argument that beat mine:

> It isn't 22.4% of frames carrying a pill; it's **the same sentence, 44 times a
> game.** A goal caption names a player and a moment — 44 goal captions would be
> 44 different sentences. Identical repetition becomes wallpaper far faster than
> varied content at the same density, and **a narrator that says the same thing
> forty-four times isn't narrating.**

**Reject the pill, accept the beat** — so generalise the predicate instead of
extending the caption. A pill is one thing that takes reading; **a state change
is another**. `captioned(e)` becomes **`carriesABeat(e)`**, still the single
source both the schedule and the renderer read, which is the property that killed
the 19.6% defect.

He proposed two carriers costing no new pixels: **the clock visibly holding**,
and **the mark un-dimmed with a `drop` arrival**.

### 9.4 Q4 ✅ (A) — see §6

### 9.5 Q6 — the document asks how to *announce* a restart, never what it should *do*

> A pill firing 44 times punctuates the stream; it doesn't help him read it. The
> thing that would help is that **a restart is a reset** — the run ended, the
> marks from it clear, a new sequence starts. That's a rendering consequence, not
> a chapter-navigation device.

Composes with a decision already made: trails scope to the period *because the
frame ended*; scoping to the run uses the same justification with a boundary the
game defines more often. **Taken up as §12 — it is a larger question than a
carrier and gets measured on its own terms.**

---

## 10. What the review changed, and the three measurements it forced

### 10.1 ⛔ THE CLOCK DOES NOT HOLD AT A RESTART — 10.0%

CHENG opened with *"Verified: … the clock is written from `cur.rem` every frame —
so at a restart it re-renders the identical value. **The clock already holds.
Nothing shows that it held.**"* The mechanism is real. The conclusion is false,
measured across all 2,653 restarts:

| clock gap between the previous **frame** and the restart | share |
|---|---|
| **0s — the clock re-renders identically** | **10.0%** (264) |
| 1s | 8.4% |
| **2s** | **27.1%** |
| 3s | 10.3% |
| median | **3s** |

**The clock stops at the whistle, and the whistle trails the last play by a
median of three seconds.** Since `SKIP` removes the stoppage, the frame before a
restart is that last play — so the clock *moves* across the restart on 90% of
them.

⚠️ **THIS DOCUMENT CAUSED THE ERROR.** §2 carried *"restarts sharing the exact
clock with their whistle — 100%"* two rows below *"`SKIP` drops every
stoppage"*, and composing them gives exactly the false conclusion. **Two true
rows, one wrong reading, and the reader was the reviewer.** §2 now carries the
guard at its head. **A table that invites a composition is responsible for the
composition.**

⭐ **And it fails on CHENG's own test, inverted.** He rejected the pill because
identical repetition becomes wallpaper. A clock hold present on **10%** of
restarts fails worse: **its absence is the normal case**, so a viewer could never
learn to read it.

### 10.2 The density denominator he asked for

| | of 15,546 timeline frames |
|---|---|
| distinct arrival (`flare`/`jolt`/`halt`/`slip`/`snatch`) | **46.4%** |
| plain `pop` | **53.6%** |
| captioned | 5.4% |

His test — *if half already look near-identical it's punctuation, if most are
distinct it's competition* — returns **ambiguous** at 46/54. But it resolves once
applied: **faceoffs currently land as plain `pop`, so giving restarts a `drop`
takes distinct arrivals to 63.5% and makes the distinct treatment the majority.**

⭐ **That is an argument for a QUIET drop, not a loud one**, and it is the first
number this question has had.

### 10.3 The run of play is thinner than the reset argument assumes

Runs measured in **timeline frames after the draw**, 3,341 of them:

| p10 | p25 | median | p75 | p90 | max | mean |
|---|---|---|---|---|---|---|
| 0 | 1 | **3** | 6 | 10 | 39 | 4.4 |

**12.0% of runs (400) contain zero frames.** So a run-scoped trail clears a
median of three marks and, on one restart in eight, clears nothing at all —
**the same absence failure as the clock**, at 12% instead of 90%. It does not
kill §12; it means the reset is a subtle event rather than the visible one the
review describes.

---

## 11. ⭐ The proposal as it now stands

1. **`captioned()` becomes `carriesABeat(e)`** and gains one state: a faceoff
   that a whistle paired to. One predicate, read by both the schedule and the
   renderer, so a pause cannot exist without something on screen to justify it.
2. **The pairing rule is imported from `whistle.js`, never restated.**
3. **The beat lands on the restart frame** (§6, ruled).
4. **No pill.** No sentence, so §9.1's grammar condition is satisfied vacuously
   — and it must stay satisfied if copy is ever added.
5. ⛔ **SUPERSEDED BY §13 — one carrier: the *event mark*.** Out of `.excl`, with
   a `drop` arrival, quiet per §10.2. **§13 replaces it with the painted rink
   dot, which is strictly better on the same test** — and hands back §10.2's
   63.5% cost entirely, because the event mark is then never touched.

⚠️ **Items 1–4 stand. Only the carrier moved.** Four carriers have now been
proposed: two died to measurement (§10.1, §10.3), one was superseded (this), and
the survivor is §13's. **None has been looked at**, which is a pixels question
`npm run gates` is blind to — so it is a prototype behind a URL flag, at both
widths, exactly as the shading was decided.

---

## 12. ⛔ DECLINED BY KEVIN, 2026-08-30 — the run-bounded trail

*"Honestly that doesn't interest me much, I don't see what that would teach a
novice."* Recorded rather than deleted, because the measurements below are the
reason §13 exists: they are what made him ask the better question.

⭐ **And the decline came with the reframe that redirected the whole thread:**
*"we took a decidedly data centric approach to looking at whistle stoppages and
faceoffs, how about we look at things from the novice viewer standpoint?"* Every
option in §4 through §11 answers *what is honest to draw*. **Nobody had asked
what a novice would want to look at.** See §13.

### The idea, as measured

CHENG's §9.5 reframed as its own question. Trails today are **one dot** (`off`,
the default) or **the whole period** / **the whole game**, and the page's own copy
admits the binary: *good to study, busy to watch.* A run-bounded trail is the
missing middle — the current sequence, cleared at the whistle.

**Measured:** median **3** frames a run, p25 1, p75 6, p90 10, and **12.0%
empty** (§10.3). Three marks is a rush — draw, carry, shot — and it is also thin.

⚠️ **Not refuted, declined.** The measurement says it is thin, not that it is
wrong, and it remains the only proposal that spoke to *"the continuous event
stream tells me nothing"* rather than to the boundary around it.

---

## 13. ⭐ THE NINE DOTS — the second thing put to CHENG

**Kevin's reframe, and it changed the question.** Everything above asks *what is
honest to draw at a whistle*. He asked instead: **when play stops, what could we
overlay that a novice would want to look at?**

### 13.1 The ruling that makes it possible

*One narrator, many ledgers* — the rink narrates **now**, retrospection lives
below it. **At a whistle there is no now.** Play has stopped, so the rink is the
one surface that is genuinely free at exactly the moment we want to use it, and
putting something on it competes with nothing.

That is a new application of a standing rule rather than a new rule, and it is
what makes any overlay at a restart admissible at all.

### 13.2 The finding: nine, and they are already on the ice

**3,341 of 3,341 draws in these 60 games land on one of nine coordinates —
100.00%, zero exceptions.**

| spot | share |
|---|---|
| centre `(0,0)` | 20.1% |
| four end-zone spots `(±69,±22)` | **69.0%** |
| four neutral spots `(±20,±22)` | 10.7% |

⭐ **And `app.js:333` already carries the measurement**: *"Every faceoff in the
archive happens at one of nine coordinates: 2,134 draws across 39 games… land on
these nine and on nothing else."* Independent sample, independent code, same
answer — 68.6/19.5/11.9 against 69.0/20.1/10.7.

⭐ **All nine are already painted** (`app.js:353–364`), and that comment opens
with *"AND THE SPOTS ARE NOT DECORATION."* **The argument for their importance
was written, and then they were used only as a backdrop for the whistle layer's
rings.** The lesson has been on the ice the whole time with nothing naming it.

**Why it is the right novice lesson:** a viewer has watched a hundred games and
never registered it; once seen it is seen forever, on any rink, without us; and
it is **checkable by counting**, which is worth a great deal on a site whose
argument is checkability. It carries **no base rate, no percentage, and no claim
about why play stopped** — so it inherits none of §3.1.

### 13.3 The design

**Once per session — the lesson.** All nine lift, with one sentence naming what
they are. Fired at the **first restart after play starts**, so a visitor arriving
on a shared `?at=3-11:09` link still gets it; a period-1 trigger would silently
deny it to everyone who arrives by link.

**Every restart after — the residue.** The dot the draw is on lifts. Not all
nine, per Kevin: *"we know where the faceoff is going to be."*

⭐ **The two halves are one system: the lesson teaches the nine places, and
thereafter the place you learned about lights up whenever play restarts there.**
The residue only means something because of the lesson.

### 13.4 ⭐ The carrier changes, and it is strictly better

**§11.5 said the event mark. It should be the painted `.fdot`.** Both land on the
same coordinate, so this is a choice, not an addition — brightening both is mud.

1. **Only one is what the lesson is about.** Lighting the painted place is the
   residue of the sentence; lighting the event mark is a brighter grey dot that
   means nothing to a viewer who was never told.
2. **It is the only carrier that is never absent.** That test killed the clock
   (10%, §10.1) and the run-reset (12% empty, §10.3). Rink geometry is present on
   every frame of every game **by construction**.
3. ⭐ **It hands back §10.2's cost entirely.** Giving the event mark a `drop` took
   distinct arrivals from 46.4% to **63.5%**, making loud the majority. Touching
   only the paint makes that cost **zero** — faceoffs stay at 20%, and the
   hierarchy `.excl` exists to protect is untouched. **CHENG's competition worry
   evaporates rather than being argued down.**
4. **The beat is unchanged.** `carriesABeat()` still fires on the restart frame;
   only the element carrying it moved.

### 13.5 Icing — measured, and the one whistle we can name

| | |
|---|---|
| restart dots carrying an icing | **469** — 18.7% of restarts, second only to the goalie freeze |
| icings restarting at an **end-zone** dot | **469 of 469 — 100.00%** |
| icing dots also carrying **another** whistle | **1 of 469 — 0.21%**, against 3.2% overall |

The 100% independently reproduces the whistle layer's own *"2,019 of 2,019 icings
across 240 games restart at an end-zone dot."*

⭐ **And icing passes §9.1's test outright.** *"An icing was called here"* is an
**at-least-one** claim — true on **469 of 469** — not a *this-one* claim. What is
forbidden is the grammar that implies a sole cause. So icing is nameable in the
base view under a rule already agreed, and it is the rule a novice has heard
shouted a hundred times and never had explained.

⚠️ **Who iced it stays unasserted**, exactly as the layer already has it: state
Rule 81, state the recorded dot, let the reader connect them.

### 13.6 What the zone-value sentence would cost, and a trap in it

⚠️ **`faceoffZone` buckets by `zoneOf(e.x, dir)` where the direction is THE
WINNER'S.** So 2.395× means *draws **won** in the winner's attacking zone* —
winner's attempts over loser's in the run that follows. **At a restart we do not
know who wins**, so *"a draw here is worth 2.4×"* is false. The verb is
load-bearing.

The `endZone` control says it more precisely still: **being in the attacking end
is worth 1.163; winning the draw there adds 0.52 on top.**

⚠️ **And icing draws are 100% end-zone draws**, so this lesson and §13.5 land on
the same dot. `docs/one-measure.md` forbids combining them — *one measure per
screen, never two wearing one label.*

### 13.7 Declined, and by whom

- **The run-bounded trail** — Kevin, §12.
- **Drawing the rule that was broken** (the blue line for an offside, the red for
  icing). It looks like the obvious win and is not: **drawing the line is naming
  the whistle**, so it inherits §3.1's selection defect wholesale.
- **The run just ended, redrawn at the whistle** — the same declined trail in a
  costume.
- **Who was on the ice at a goal** — §4.3, refused on measurement.

---

## 14. Recommendations, and what I want ruled

**Recommended:**

1. **Ship the nine dots as the once-per-session lesson**, triggered on the first
   restart after play starts. Structure before meaning.
2. **Make the painted `.fdot` the every-restart residue and §11's carrier**,
   replacing the event mark (§13.4).
3. **Keep the zone-value sentence out of it** for now. The nine dots is a
   complete lesson and does not need a statistic to justify it; adding one buys a
   second measure on one screen.
4. **Hold icing as the second moment**, specified but not built, so we learn from
   one teaching overlay before adding a second.

**What I want ruled:**

1. **Does §13.1 hold?** *At a whistle there is no now, so the rink is free.* It
   is the load-bearing claim and it is one sentence of reasoning against a rule
   that has held all year. If it is wrong, §13 collapses.
2. **All nine once, or never all nine?** Kevin's instinct is to elevate only the
   upcoming dot. Mine is that a lesson about a **set** requires seeing the set,
   and a ring on one dot teaches nothing the mark did not already say. Is the
   once-only showing enough for the lesson to land, or is it too quick?
3. **Is a session-scoped trigger honest?** Every other rule here is a property of
   the game; *"first restart you personally saw"* is a property of the visit. Is
   that a different kind of thing, and does it matter?
4. **§13.4 — does the paint really beat the mark?** I argue it is better on the
   absence test, on meaning, and on density. The counter I can see: rink paint is
   *background*, and a viewer may never notice a background element brightening,
   in which case the beat has no visible cause and we are back to §10.1's
   problem.
5. **Is a once-per-session moment a tier?** §3.2 refuses editorial ranking of
   events. This ranks one restart above 43 others — on recency of the *viewer*,
   not on anything about the play. Does that escape §3.2 or violate it?
6. **What is missing this time?** The previous round's honest summary was *found
   a gap, talked myself out of the two obvious fixes, kept the third.* This round
   is *a carrier went looking for content and Kevin supplied the question that
   found it* — which is a better shape, and is still one person's idea with one
   reviewer.
