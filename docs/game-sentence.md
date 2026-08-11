# The per-game sentence

*For CHENG. Nothing here is built. The numbers are from the live
`measures.json` over **4,119 in-scope games**, not from a sample — every count
below is derivable from the published file and can be checked against it.*

The ask, from Kevin's open list:

> **The per-game sentence on the game page** — *"Buffalo controlled play while the
> score was level, +12, and lost."* Free in the browser: `game.html` already loads
> the extract and imports the same `tied.js` the pipeline does. Must be able to
> say **nothing was unusual**.

Free is right. `tiedControl.reduce(g.events, ctx)` already runs in the bundle and
returns `diff` — home minus away. No new computation, no new fetch for the game's
own number.

---

## 1. The finding that should change the sentence

**The site's headline event happens in 39.6% of games.**

| what | of the games where it applied | the leader lost |
|---|---|---|
| more shots on goal | 3,957 | 1,811 — **45.8%** |
| more shot attempts | 4,029 | 2,194 — **54.5%** |
| **more control while level** | **3,855** | **1,527 — 39.6%** |

I have been describing "they controlled play and lost" as the thing worth showing
a novice. It is — but it is **not unusual**, and a sentence that frames one game as
remarkable is making a claim these numbers refuse.

Nearly four times in ten, the team that controlled play while the score was level
lost. That is not a strange night; **that is hockey**, and it is a considerably
better lesson than "look at this weird game". The novice's actual misconception is
*the team that played better wins* — and 1,527 games say otherwise.

**So the sentence must not imply rarity, and the base rate is not decoration
attached to it — the base rate IS the lesson.** This inverts what I would have
written a day ago.

## 2. "Nothing was unusual" is a real population, and it is bigger than the tail

Kevin asked that the sentence be able to say nothing was unusual. That case is
measurable rather than hypothetical:

```
4,119  games measured (NHL regular season + playoffs, quoted boxscore)
3,855  had a control edge while the score was level
  264  had NO edge at all — 6.4%, one game in sixteen
```

One game in sixteen ends with the two teams exactly level on the measure. There is
nothing to say about those, and the honest output is to say nothing:

> *Neither team controlled play while the score was level.*

No rate, because there is no edge to have a rate about. `rateOf` already drops
these from `n` for exactly this reason, and the sentence must agree with the
ledger that produced it.

## 3. The problem I do not have a clean answer to, and want argued

**The base rate is unconditional on the size of the edge.** A +1 game and a +33
game both count once in that 39.6%. So this sentence:

> *Buffalo controlled play while the score was level, **+1**, and lost. Teams that
> led that count lost 1,527 of 3,855.*

is true, checkable, and **quietly misleading** — it attaches a whole-population
rate to an edge that is nearly noise.

### 3a. The proposal: the game supplies the threshold

Do not bucket. Publish the rate as a function of every cutoff, and let **this
game's own number** pick the row:

> *Buffalo controlled play while the score was level, **+12**, and lost. Of the
> games where a team led that count by **12 or more**, it lost **88 of 214**.*

The properties I like:

- **No parameter is chosen by us.** `k = |diff|` comes from the game. This is the
  direct answer to *a parameter with no source in the data is a model wearing a UI
  control* — the rule that killed `recent` trails.
- It is a **cumulative curve, not a bucketing**. Bucket boundaries (1–3, 4–7, 8+)
  would be ours; "≥ k, for every k" is a complete function with no choices in it.
- It degrades to the headline: at k=1 it is 1,527 of 3,855, the number already
  published.
- Cost: `measures.json` gains an array of ~35 rows, `{k, n, count}`. `archive.js`
  computes it in the same pass; the browser reads the row and never computes a
  rate.

### 3b. Where it gets thin, stated rather than hidden

The largest edges in the archive are 33, 33, 32, 32, 31, 31, 29, 29, 29, 28. So at
k=28 the population is about ten games, and **"41%" over ten games is
overprecision wearing a percent sign.**

My proposal, and it is a doctrine tightening rather than a workaround: **this
sentence always prints the fraction and never a bare percentage.** *88 of 214.*
*6 of 10.* The fraction carries its own denominator, which is the whole of what
Doctrine §8 asks for, and it needs **no minimum-n threshold** — which would be
another parameter with no source.

Related debt, found while writing this and not fixed here: the goalie card already
does `thin = st.f < 20` and switches from a save percentage to a fraction. Twenty
is a number we chose. It has the same defect, it is shipped, and it should be
argued separately.

## 4. Placement, and a spoiler question that answers itself

The sentence is a summary of a **finished** game, so it belongs with the game line
at the foot of the page (`#gl`, *"MIN at BUF · 10 November 2023 · final MIN 2–3
BUF"*), **not** beside the live scoreboard, which counts up as the replay plays.

There is no new spoiler: the page already opens at the final event with the final
score on the board, and `#gl` already states the result. A sentence that says *and
lost* discloses nothing the page has not already said. Worth stating because I
nearly designed around a problem that does not exist.

## 5. What it says, in every case it can face

| the game | the sentence |
|---|---|
| an edge, and that team lost | *BUF controlled play while the score was level, +12, and lost. Of the games where a team led that count by 12 or more, it lost 88 of 214.* |
| an edge, and that team won | *BUF controlled play while the score was level, +12, and won. Of the games where a team led that count by 12 or more, it lost 88 of 214.* |
| no edge (264 games) | *Neither team controlled play while the score was level.* |
| out of scope (preseason, 4 Nations, Olympics) | *the game's own number, and NO base rate* — the population is NHL regular season and playoffs, and quoting it beside a preseason game would be the pooling error `archive.js` exists to prevent |
| `measures.json` did not load | *the game's own number, and no base rate.* Never a spinner, never a silent zero |

The won-row deliberately carries the **same** base rate as the lost-row. Showing
the rate only when the story is surprising is selective honesty, which Doctrine §9
calls worse than none because it looks rigorous.

## 6. What I want challenged

1. **Is the cumulative-k rate honest, or is it a significance test in a trench
   coat?** Reading "88 of 214" at k=12 invites *this is meaningful*, and I have not
   made any claim about whether 41% differs from 39.6% in a way that matters. My
   position: we are reporting a conditional count, not testing anything, and the
   fraction with its denominator is the whole claim. I am not certain that is how
   a novice reads it.
2. **Does the ≥ k framing mislead by construction?** Every game is compared against
   games at least as lopsided as itself, so the reference class shrinks as the
   number grows, and a smaller reference class always looks more dramatic.
3. **Is one sentence enough**, or does the level-control number need the raw
   attempts beside it to be legible — the narrowing is the interesting part, and
   the sentence hides it.
4. **The 39.6% reframe in §1** — if "they controlled play and lost" is a four-in-ten
   event, is a per-game sentence the right surface for it at all, or does that
   belong on the homepage as a fact about the league?

## 7. What gets tested

- **The no-edge case is asserted with a synthesised fixture**, not found in the
  corpus. 264 real cases exist; a test that goes looking for one passes for a
  reason unrelated to the code.
- **The out-of-scope case**: a preseason game id must produce the game's number and
  **no** base rate. The mutation is a version of `inScope` that always returns
  true — the test must fail against it, or it is testing nothing.
- **The missing-`measures.json` case**: the sentence still renders, minus the rate.
- **The cumulative table is checked against the summary it must agree with**: the
  row at k=1 must equal `moreLevelControlLost` exactly. Two paths to one number,
  and if they disagree one of them is wrong.
- **The sentence is rendered, not just computed.** `test/render.test.js` boots the
  shipped bundle; this sentence goes in it. The whistle layer was correct and
  invisible for a day, and the defect that found it was in the half no unit test
  could see.
