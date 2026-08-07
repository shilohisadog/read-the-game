# Strength as a filter, not a headline

**Technical artifact for review.** How the app should express even strength, power
plays and an empty net, now that `situationCode` is extracted.

| | |
|---|---|
| **Status** | For review — nothing implemented |
| **Author** | CC |
| **Date** | 2026-08-07 |
| **Reviewer** | CHENG |
| **Depends on** | `docs/main-app-rework.md` Phase 2 (conservation). See *Sequencing*, which argues this must not ship first. |

---

## What prompted it

Kevin, on seeing the corrected Corsi: *"a penalty occurred at 13:05, that should be
highlighted somewhere, since the SOG and control will shift some towards the team
with the man advantage, no?"* — and then, on the empty-net finding, *"we definitely
need to flag that somehow as well."*

Both are right, and the data now supports them: `sit` was landed in `43eb08f`.

## The evidence

All verified against the raw feed; every number here is reproducible with
`builders/extract.py --validate` plus the queries quoted in the commit history.

| State | Corsi | SOG | MIN share |
|---|---|---|---|
| Even strength | MIN 48 – BUF 38 | MIN 18 – 15 | 55.8% |
| Special teams | MIN 20 – BUF 17 | MIN 14 – 10 | 54.1% |
| Empty net | MIN 12 – BUF 0 | MIN 3 – 0 | 100% |
| **All situations** | **MIN 80 – BUF 55** | **MIN 35 – 25** | **59.3%** |

Three things fall out, and the third is the one that matters most.

**Special teams roughly cancel.** 54.1% is within noise of the 55.8% even-strength
figure, so the entire 59.3 → 55.8 gap is the empty-net window and nothing else.
Kevin's instinct that penalties would move the number was reasonable and turns out
not to be what moved it here.

**The empty net is 100 seconds of one-sided volume.** Twelve MIN attempts, zero for
BUF, all in the last 1:40 of the third with MIN's own net empty. Seven were blocked.

**The thesis lives on the all-situations number.** The reference game exists because
*"Minnesota outshot Buffalo 35–25 and lost."* At even strength that is **18–15**,
which is a shrug. Any design that quietly promotes the even-strength number
demolishes the hook. (CHENG's finding.)

### The goalie fact, correctly sized

| Goalie | All situations | Even strength |
|---|---|---|
| Gustavsson (MIN) | 22/25 = .880 | 12/15 |
| Levi (BUF) | 33/35 = .943 | **18/18** |

Both Minnesota goals came on the power play; all three Buffalo goals came at even
strength. Levi allowed no even-strength goal.

**I originally called this "the fact that makes the filter worth building" and
described it as a second story: at full strength Minnesota generated more and scored
nothing, so their offence was special teams. That does not survive contact, and the
correction is more useful than the claim was.** (CHENG; every figure below
reproduced independently.)

An 18-shot shutout is a normal night:

```
sv% .910  ->  P(zero on 18 shots) = 18.3%   ~1 start in 5.5
sv% .920  ->                        22.3%   ~1 start in 4.5
sv% .930  ->                        27.1%   ~1 start in 3.7
```

Gustavsson's line is the same story inverted — three or more against on 15 shots
comes up about **1 game in 9**. And the clustering is equally ordinary: if goals fall
in proportion to shots, P(both MIN goals non-even) = **23.6%** and P(all three BUF
goals even) = **21.6%**. One-in-four outcomes, and we went looking *after* seeing
them, in a five-goal game that offers dozens of such patterns.

So the "second story" was a causal claim resting on **n = 2 goals**. It is the
cross-game selection effect at single-game scale: true data arranged into a
conclusion it cannot carry. Five goals cannot establish which strength state a
team's offence lives in.

**What survives:** *"Both Minnesota goals came on the power play"* is true, checkable
and interesting, and belongs on screen **as a fact**. What does not survive is
promoting it to an explanation.

### This resolves Q3, and it was never a rendering question

I had asked whether `1.000` is publishable and offered a fraction, a caveat, or
"something else." It is something else: **the honest rendering is the base rate.**

> Levi faced 18 even-strength shots and allowed none. A goalie at league average
> does that in about one start in five.

Two counts and a base rate. No adjectives, no hedge about sample size — the actual
number. It teaches something durable, which is **how to tell a real signal from a
normal night**, and that is a better novice lesson than "the goalie was unbeatable."

It is also the same move required of cross-game filters in
`docs/platform-architecture.md`: the base rate turns a cherry-pick into a statistic.
**Generalized rule: any single-game rate the app displays carries a base rate.**

This also dissolves my low-confidence worry that the second story would bury the
first. It cannot, because there is no second story — there is a second *observation*,
correctly sized. The hook is safe on the evidence, not on our restraint.

---

## The design

Adopting CHENG's shape from the Q1 exchange, because my framing ("which number is
the headline?") was malformed: it presupposed one headline, which is exactly what
the reducer/ledger architecture exists to avoid.

**Strength is a view-level filter over the existing layers, not a competing number.**

- The view opens at **all situations**. It is the complete count, the number a novice
  can verify by counting marks on the ice, and the number the game was chosen for.
- A control offers **Even strength only**.
- Toggling it moves **49 of 135 attempts** from `counted` to `excluded`, each with a
  real reason, and the counter re-runs in front of you from 80/55 to 48/38.

### Why a filter beats picking

- **The delta becomes motion rather than a footnote.** Two static numbers side by
  side are a thing to read. A counter visibly dropping while 49 marks grey out is the
  crown jewel doing its job on a genuinely surprising fact.
- **It uses the ledger instead of hiding in it.** An even-strength headline would
  silently drop 36% of all attempts — not stated as a limit, not enumerated, just
  gone. That is precisely what Doctrine §3 is written against.
- **Denominators stay coherent.** SOG 35–25 is an all-situations number straight off
  the boxscore. Pair it with an even-strength Corsi headline and two numbers on
  screen have different scopes and a novice cannot reconcile them. A view-level
  filter moves *both* — 18–15 and 48–38 — or neither.
- **It is mutation-testable.** Conservation must hold in both modes.

### The exclusion ledger

```
Even strength only — 49 attempts excluded

  22   MIN on the power play
  15   BUF on the power play
  12   MIN net empty, 6-on-5
  ---
  49   of 135 attempts
```

Every excluded event keeps its `why`, and every one is clickable back to the moment.

### Deriving the state

`situationCode` is `[awayGoalie][awaySkaters][homeSkaters][homeGoalie]`.

```
goalie digit == '0'   ->  empty net        (either side)
awaySkaters == homeSkaters  ->  even       (5v5, 4v4, 3v3)
otherwise             ->  power play, to the side with more skaters
```

Five codes appear in this game. **The set is known-incomplete** — a real season adds
3-on-3 overtime, 5-on-3, 4-on-3, penalty shots and both goalies pulled — so an
unrecognised code must hit the same gate as an unrecognised `typeDescKey`:
`extract.py --vocab` already exits non-zero, and the app must refuse to classify
rather than guess.

### Marking *when*, not just excluding

The states are windows, and seeing them on the timeline is most of the teaching.
Nine windows in this game:

```
BUF power play   P1 19:35 -> 17:39
MIN power play   P1 06:55 -> 05:20
MIN power play   P1 01:26 -> 00:30
BUF power play   P2 15:48 -> 15:03
MIN power play   P2 13:46 -> 11:24
BUF power play   P2 00:36 -> P3 18:43   <-- crosses the period break
BUF power play   P3 10:33 -> 09:10
MIN power play   P3 08:27 -> 07:33
empty net        P3 01:40 -> 00:00
```

**Note the sixth.** A penalty carries across the intermission, so the filter cannot
treat state as period-local — a real constraint that a naive implementation would
get wrong and never notice.

---

## Two places honest data can be narrated into a wrong impression

### The empty net

I already made this error in conversation. I wrote that Buffalo *"had stopped trying
to score,"* which is **interpretation, not data**. A one-goal lead with 100 seconds
left means icing the puck and blocking shots; zero attempts is what competent lead
protection looks like, not surrender. (CHENG's correction.)

The rule for this copy: **state what is recorded, let the viewer conclude.**

> In the last 1:40 Minnesota played with an empty net. They took 12 attempts;
> Buffalo took none. Seven of Minnesota's were blocked.

Every clause is a count. No verb describes anyone's intent.

### The delayed penalty

The game's first sequence is a good one and currently reads as noise:

```
19:39  delayed-penalty
19:35  penalty  (tripping, MIN)
```

Two events four seconds apart teaches nothing. **One moment with the gap explained**
teaches a rule a novice has certainly seen and never had named — the referee's arm
up, play continuing, the whistle waiting until the offending team touches the puck.
This game has four delayed penalties.

*(This overlaps the parked whistle layer. Flagging the seam, not proposing to build
both.)*

---

## Sequencing — this must not ship before the conservation fix

`read-the-game.html` pre-filters before any reducer runs:

```js
const SKIP=new Set(['stoppage','period-start','period-end','game-end','delayed-penalty']);
const EV=G.events.filter(e=>!SKIP.has(e.type));
```

**51 of 320 events are deleted upstream of the ledger.** CHENG established that
conservation currently passes only because it is measured against `EV` rather than
the full game.

If the strength filter ships onto that, we get a ledger that carefully enumerates 49
exclusions while silently discarding 51 others. **Selective honesty is worse than
none**, because it looks rigorous. So: Phase 2's conservation fix — bind the property
to `loadGame()` output, `excluded` as IDs rather than counts — comes first, or lands
in the same change.

## The two ledgers are dimensions, not lists

Not addressed in the first draft, and a naive implementation gets it wrong the same
way it would get the intermission-crossing penalty wrong. (CHENG.)

After Phase 2 binds conservation to `loadGame()`, the ledger covers all 320 events.
A hit is excluded for being a hit. A power-play attempt is excluded for being on the
power play. **A hit that happened on the power play is excluded for both** — and the
ledger must neither double-count it nor silently pick one reason.

Strength is a second **dimension** of exclusion, not a second list. Conservation must
hold across both simultaneously, and that is the property test.

## Questions, resolved

**Q1 — how far does the filter reach? Filter SOG too.** Exempting it recreates the
incoherence the filter exists to fix. The boxscore anchor is preserved by the
**default**, not by exemption: a stranger opening the page sees 35–25 and can check
the league's summary immediately, and all-situations is always one click away.

> **Hard requirement:** the mode label is part of the number, not chrome around it.
> `MIN 18 – BUF 15` with no adjacent label is unverifiable against any public source
> and reads as an error. Render label and number as one unit — it must be impossible
> to screenshot the number away from its scope.

**Q2 — one state.** I framed this as inference-versus-honesty, but there is a data
answer first: **this game contains no delayed-penalty goalie pull.** All 20
pulled-goalie plays are `0651` in the last 1:40. I was designing a distinction
against a case the corpus does not contain — which is exactly how the blocked-shot
flip got in: a plausible rule with no counterexample available and nothing to catch
it. When a game does show a delayed-penalty pull, it is distinguishable *without*
inference, because a `delayed-penalty` event is live in the stream. Revisit then,
with data.

**Q4 — the self-test, answered in writing before implementing**, as required.

> *Would you still default to all-situations if the even-strength number were more
> dramatic — say MIN 70% even-strength against 59% overall?*

**Yes.** The default's job is to be the complete, unfiltered, externally checkable
record; the filter is the interpretive act. Defaulting to even strength would open
the app on a view that excludes 36% of events and reconciles with no public source —
worse on every axis I care about, and the drama of the number does not touch any of
them.

The deeper reason is that this is not a new principle but Doctrine §6 restated. The
base view is *just the game*; every metric is an opt-in layer. **A strength filter is
a lens, and lenses are opt-in.** That holds whichever number flatters the hook.

The honest residual: the hook does benefit from this default, and I noticed that
only after choosing. The reasons are independent of the benefit, but my *confidence*
in them is not purely independent. The mitigation is that the reasons are written
down and can be checked against — which is what this answer is for.

## Where I am least confident

- ~~That the second story doesn't bury the first.~~ **Dissolved by review.** There is
  no second story — only a second observation, correctly sized. Worth recording *why*
  I got this wrong, because the mechanism will recur: I found a striking pattern,
  checked that it was true, and never asked whether it was *unusual*. True and
  unusual are different tests, and only the second one licenses an explanation.
- **That "any single-game rate carries a base rate" is affordable everywhere.** It is
  clearly right for a goalie's save percentage. Whether every rate on screen can carry
  one without the interface becoming a statistics lecture is a real design problem I
  have not solved.
- **Whether nine windows is legible or clutter** on a timeline this size.
- **The empty-net copy above.** I got it wrong once already, and I am not confident
  the version I've written is clean rather than merely more careful.
