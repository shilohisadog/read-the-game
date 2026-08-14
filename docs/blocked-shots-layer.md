# The blocked-shots layer — audit

*For CHENG. Build-list item **B**, ahead of the novice test at Kevin's call: he
can read the site as a relative novice and wants blocked shots in it before he
hands it to his wife.*

*This document is the AUDIT and the questions it raises. It proposes a design in
§6 but does not commit to one — three of the findings below change what the layer
is allowed to say, and one of them is a defect in what the page draws today.*

---

## 0. What was measured, and how to reproduce it

Two samples appear here and they are **not** interchangeable.

| | what | when to trust it |
|---|---|---|
| **archive** | `measures.json`, built by `measure.mjs` over all **4,119** in-scope games (NHL regular season + playoffs) | any number that ships |
| **sample** | **80 games**, drawn with `random.seed(20260814)` from the 4,119 viewable regular+playoff games in `catalog.json` | shape, presence, order of magnitude |

The sample is reproducible: same seed, same catalog, same 80 ids. (One fetch
failed transiently on the first pass and succeeded on retry — the extract is
served and intact; noting it because "79 of 80" would otherwise look like a data
gap, and this project has a real one elsewhere.) **Nothing in §6 may ship a number from the sample column.** This is
not ceremony — the figures I quoted Kevin before this audit (28.6% blocked, 53.5%
never reaching the goalie, blocks leader wins ~61%) came from an **adversarially
chosen** 167-game set and are superseded below by every one of their random-sample
counterparts. They were close, and being close is exactly how a wrong number
survives.

---

## 1. The field is sound

`extract.py` stores `blk` — the blocking player's id — on every blocked shot:

```json
{"actor": 8478396, "blk": 8482809, "own": 54, "type": "blocked-shot",
 "x": 36, "y": 26, "per": 1, "rem": "17:46", "sit": "1551"}
```

**`blk` is present on 2,599 of 2,599 blocked shots** across the 80 games. No
missing-data branch is needed for the blocker's identity, which is unusual enough
here to be worth stating.

Shooter attribution is already gated rather than assumed: `extract.py::validate`
checks `team_of(shootingPlayerId) == e["own"]` on every blocked shot in the game,
which is the check that exists because **the blocked-shot flip is the defect that
once shipped a wrong flagship number** (see [[verify-inherited-claims]] and
`DOCTRINE`). `corsi` counts blocked shots as attempts *for the shooter*, and
`SHOT_TYPES` — used by the slot layer — correctly excludes them.

## 2. 7.8% of blocks are made by a TEAMMATE

**202 of 2,599.** The shooter and the blocker are on the same team, per
`rosterSpots`, with `own` independently verified against `shootingPlayerId`. So
this is not an attribution bug on our side; the feed is telling us a player's
shot hit one of his own.

That is a real hockey event — a point shot hits the winger screening the goalie —
and it is common enough that **no copy may say "the defence blocked it"**. One
blocked shot in thirteen was blocked by the shooter's own teammate.

It also decides a counting question the layer cannot dodge: **a "blocks by team"
tally must exclude teammate blocks**, or a team gets credit for blocking its own
shots. The numbers in §4 exclude them; the per-event display must handle the case
in words.

**Open question for CHENG:** does the NHL boxscore's per-team `blockedShots`
include teammate blocks? If it does, our tally will disagree with the number a
reader looks up, which is the exact failure that renamed "high danger" to "shots
from the slot". Checkable by extending `extract.py::validate` to reproduce the
boxscore figure, the way it already reproduces SOG. **I have not run this**, and I
think it should be run before the layer's copy is written.

## 3. THE COORDINATE IS WHERE IT WAS BLOCKED, NOT WHERE IT WAS SHOT

This is the finding that most constrains the design, and it affects the page
**today**.

Distance to the attacking net, by event type, over the 80-game sample:

| event | n | median ft | 50+ ft |
|---|---|---|---|
| goal | 519 | 19.1 | — |
| **blocked-shot** | **2,599** | **24.2** | **6.1%** |
| missed-shot | 2,367 | 32.4 | — |
| shot-on-goal | 4,160 | 33.4 | — |

A blocked shot is recorded **closer to the net than a shot on goal**. If the
coordinate were the shot's origin that would be backwards: the point shot is the
most-blocked shot in hockey, and the blue line is ~64 ft out. Only **6.1%** of
blocked shots are recorded beyond 50 ft, and the modal bucket is **10–19 ft** —
which is where a defender collapsing in front of the net actually is.

The coordinate is the **block point**: somewhere between the shooter and the net,
so it is systematically nearer the net than the shot that produced it.

**What that means for the page as it stands.** `build_main.py:718` already draws

```js
if(e.type==='blocked-shot')parts.push(`<circle class="ring blk" data-i="${k}" …>`)
```

a ring at `(x,y)` — the block point — around a mark the viewer reads as *where
the shot was taken*. The label says *"Shot blocked · still an attempt — for the
shooter"*, which reinforces that reading: the shooter is named, so the dot is
naturally taken to be his. It is not. It is where the puck stopped.

`.k-blk` exists in the stylesheet and **appears nowhere in the legend**, so the
ring is currently drawn and never explained — which is a second, smaller problem
and belongs with **R**.

I do not think this is fatal. It is a *disclosure* problem, and disclosure is
what this site does. But it means the layer's first job is to say what the mark
is, and it rules out silently reusing the coordinate as a shot origin anywhere.

**It also means one thing the layer must NOT do:** apply the slot rule to blocked
shots. A block point 24 ft out and inside ±22 ft would satisfy "from the slot"
while the shot came from the blue line. `SHOT_TYPES` already excludes them and
the exclusion must stay — worth a test that pins the reason rather than the
behaviour, because the behaviour is currently correct by an inherited decision.

## 4. What a blocked shot is worth knowing — the numbers

80-game random sample. **These are shape, not shipping numbers.**

| | per game | share of attempts |
|---|---|---|
| attempts | 120.6 | — |
| shots on goal (incl. goals) | 58.5 | **48.5%** |
| missed | 29.6 | 24.5% |
| **blocked** | **32.5** | **26.9%** |

> **More than half of every team's attempts — 51.5% — never reach the goalie
> at all.** Roughly one in four is blocked by a body.

That is the sentence the layer exists for, and a novice does not know it. It also
reframes the control number the site already shows: "58 attempts" sounds like 58
chances, and about 28 of them never got there.

## 5. The reference class is a trap, and the sample cannot spring it

The obvious archive rate — *"the team that blocked more won X% of the time"* —
is where this layer goes wrong if we are careless.

| | sample | n |
|---|---|---|
| the blocks leader **won** | **63.2%** | 76 decided games with a blocks leader |
| the team that blocked more was the team that **attempted fewer** | **81.7%** | 71 |

And from the **archive** (`measures.json`, n = 4,029), which is a shipping number:

> the team with more shot attempts **lost 54.5%** of the time.

So the mechanism is visible: the team blocking more is, four times in five, the
team being shot at more — and in this archive the team being outshot usually
wins. *"Blocking wins games"* would be a causal claim we have no basis for, on a
site whose entire purpose is to correct that kind of reading.

**Can blocks say anything the attempt count does not?** Combining the two rows
above, the confound *alone* predicts a blocks-leader win rate of about **52.8%**.
The sample says 63.2%, but with n = 76 the interval is roughly ±11 points, so
**52.8% sits inside it**. The sample cannot distinguish "blocks carry independent
information" from "blocks are the attempt count seen from the other side." Only
`measure.mjs` over 4,119 can, and until it has, the layer must not imply either.

My instinct — and this is the thing I most want argued against — is that the
honest framing is not a win rate at all:

> Blocked shots are the same inversion the site already teaches, seen from the
> defending side. The team blocking is the team defending.

which is a claim about **what blocking indicates**, checkable against the 81.7%,
rather than a claim about what blocking *achieves*.

## 6. A proposed shape, deliberately thin

Offered so there is something concrete to attack, not as a plan.

1. **A fifth layer**, `id: 'blocked'`, beside control / slot / goaltending /
   whistle, reusing the existing `layer.js` reduce-with-exclusions contract so it
   inherits "Show me the work" for free.
2. **It marks the block point and says so** — the ring already drawn, now
   explained, with the blocker named. The one-line honesty statement is
   *"where the puck was stopped, not where the shot was taken"*, and it earns its
   place under the sharpened label rule because the attempts counter **is** on
   screen and moving.
3. **A per-game count per team**, teammate blocks excluded and stated.
4. **One archive rate, from `measure.mjs`**, and per §5 the candidate is the
   *share of attempts that never reach the goalie*, not a blocks-leader win rate.
5. **No slot classification of blocked shots, ever**, with a test that says why.

### What I want CHENG to rule on

1. **§3** — is drawing the block point acceptable with disclosure, or does the
   ring need to move/change shape? It is currently drawn *and* unexplained.
2. **§5** — is the "seen from the defending side" framing defensible, or is it
   still smuggling causation? Is a blocks-leader win rate publishable **at all**
   once `measure.mjs` has the real figure, or is it a number that cannot be shown
   without being misread?
3. **§2** — should the boxscore reconciliation gate this layer, or follow it?
4. Is a **fifth toggle** the right vehicle, given **R** already says the area
   below the rink is overloaded? A layer that makes the control layer honester
   might belong *inside* control rather than beside it.

Question 4 is the one I am least sure of and it is a sequencing question: **R**
may need to land first, or B will be built into a shape R then has to undo.
