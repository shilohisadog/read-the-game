# The per-game sentence

> ⚠️ **EVERY FIGURE BELOW IS FROM AN ARCHIVE OF 4,417 PUBLISHED GAMES AND THE
> ARCHIVE IS NOW 4,490** (2026-08-21). 73 regular-season and playoff games were
> being refused because the league's boxscore contradicts the league's own event
> log; see `docs/status.md` D1. Re-derived, the three base rates are:
>
> | | was | now |
> |---|---|---|
> | more shot attempts lost | 54.5% of 4,029 | **54.3% of 4,100** |
> | more shots on goal lost | 45.8% of 3,957 | **45.7% of 4,026** |
> | more control while level lost | 39.6% of 3,855 | **39.7% of 3,925** |
>
> **The reasoning below is unaffected and the numbers in it are not restated** —
> it is a record of a decision taken against the archive as it stood, and every
> rate moved by 0.2 points or less. The live figures come from `measures.json`
> at load time; nothing on the site quotes these.

*For CHENG. §1–§7 were the design argument, put to him before anything was
built; §8 records what the MEASUREMENT then said, including that a figure used
five times in §3 was one I invented. Every number now in this file is measured,
over **4,119 in-scope games**, and derivable from the published `measures.json`.*

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
> games where a team led that count by **12 or more**, it lost **243 of 708**.*

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

The archive runs to a maximum edge of **41**, and the population falls away fast:
k=22 is the last cutoff with n≥100, and by k=28 it is 36 games. At the far end
the archive says **0 of 4** at k≥35 — which as a percentage is "0%", *teams that
dominant never lose*, and is in fact four coin flips.

My proposal, and it is a doctrine tightening rather than a workaround: **this
sentence always prints the fraction and never a bare percentage.** *243 of 708.*
*0 of 4.* The fraction carries its own denominator, which is the whole of what
Doctrine §8 asks for, and it needs **no minimum-n threshold** — which would be
another parameter with no source.

Related debt, found while writing this: the goalie card did `thin = st.f < 20` and
switched from a save percentage to a fraction below it. Twenty was a number we
chose. **Fixed under this same rule rather than argued separately** (CHENG): the
card now prints "33 of 35" always, and the stated limit moved onto every card,
because showing it only when the number was small was selective honesty.

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
| an edge, and that team lost | *BUF controlled play while the score was level, +12, and lost. Of the games where a team led that count by 12 or more, it lost 243 of 708.* |
| an edge, and that team won | *BUF controlled play while the score was level, +12, and won. Of the games where a team led that count by 12 or more, it lost 243 of 708.* |
| no edge (264 games) | *Neither team controlled play while the score was level.* |
| out of scope (preseason, 4 Nations, Olympics) | *…+12. **No comparison shown — this is a preseason game, and the archive's rate covers the regular season and playoffs.*** Quoting it here would be the pooling error `archive.js` exists to prevent, and SAYING SO is required: a bare number with no reference class is the thing Doctrine §8 warns about, and silence about an omission is the failure the ingest-state work spent two rounds fixing (CHENG) |
| `measures.json` did not load | *…+12. **No comparison shown — the archive's rates could not be loaded.*** Never a spinner, never a silent zero, and never a missing clause that looks deliberate |
| an edge bigger than the archive holds | the same wording. Only reachable for a game measured since the last derive run, and "0 of 0" is not a base rate |

The won-row deliberately carries the **same** base rate as the lost-row. Showing
the rate only when the story is surprising is selective honesty, which Doctrine §9
calls worse than none because it looks rigorous.

## 6. What I want challenged

1. **Is the cumulative-k rate honest, or is it a significance test in a trench
   coat?** Reading "243 of 708" at k=12 invites *this is meaningful*, and I have not
   made any claim about whether 34.3% differs from 39.6% in a way that matters. My
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
- **The cumulative table is monotone in `n`** — the population can only shrink as
  the cutoff rises (CHENG). A structural invariant of a cumulative count, cheap,
  and it catches an off-by-one in the tail where the rates wobble on sample size
  alone and nobody could tell a wrong row from a small one by looking.
- **No causal connective may sit between the game's number and the rate** — no
  "so", no "which means". A copy gate, in the shape of the whistle layer's word
  list: a regression guard, not the standard. §8.3 is why it is a requirement
  rather than a style note.
- **The sentence is rendered, not just computed.** `test/render-preview.test.js` boots the
  shipped bundle; this sentence goes in it. The whistle layer was correct and
  invisible for a day, and the defect that found it was in the half no unit test
  could see.


---

## 8. The measured curve, and the number in §3a that I made up

`88 of 214` appeared five times above as an illustration of the shape a row would
take. **It was invented, it was not marked as invented, and CHENG's review
computed a 95% confidence band around n=214 as though it were measured.** His
finding survives untouched — the band arithmetic demonstrates the variance point
at any n, and I checked it: at n=10 Wilson gives 16.6%–68.4% against his normal
approximation's 9.3%–69.9%, and the conclusion is the same either way. But this is
[[verify-inherited-claims]] running in the opposite direction, and the last time it
happened the invented number was CHENG's 41% against a real 45.8%.

The figures above are now the measured ones, from `measures.json` over **4,119
in-scope games**. What the measurement changed:

### 8.1 The invented number pointed the wrong way

| | at k=12 | against the 39.6% base |
|---|---|---|
| what I illustrated | 88 of 214 = **41.1%** | **above** — implies the more lopsided the control, the more likely the loss |
| what is true | **243 of 708 = 34.3%** | **below** — the opposite |

**The rate FALLS as the edge grows.** 39.6% at k≥1, 34.3% at k≥12, 30.4% at k≥17.
Control while level does not merely fail to guarantee a win — it does predict one,
and it predicts better the larger it is. Had the illustration shipped it would have
taught the reverse of the data.

### 8.2 CHENG's non-monotone tail is real, and worse than "wobble"

```
 k     n   lost   rate        k    n  lost   rate
 1  3855   1527  39.6%       25   62    24  38.7%
12   708    243  34.3%       30   26     6  23.1%
17   286     87  30.4%       33   11     2  18.2%
18   238     73  30.7%       35    4     0   0.0%
20   170     54  31.8%       38    3     0   0.0%
22   113     37  32.7%       41    1     0   0.0%
```

The decline to k≈17 is smooth and over large n. After that the rate turns around
and wobbles — 30.7, 31.6, 31.8, 32.1, 32.7, 33.7, 34.2, **38.7** — on nothing but
sample size, exactly as predicted. **k=22 is the last cutoff with n≥100.**

And the far tail is worse than uninformative, it is *actively misleading*: at k≥35
the archive says **0 of 4**. Rendered as a percentage that is "0%" — teams that
dominant never lose — which is four coin flips. The fraction-always rule is what
makes it read as four coin flips, and this is the concrete case for it.

### 8.3 A confound the sentence must not invite the reader to cross

`level` counts attempts taken **while the score was level**, so its size depends on
how long the game stayed level. A team that goes up 3–0 in the first period has
few level attempts available to it, whatever it then does. A large edge therefore
means *the game stayed close AND one team ran it* — two things, not one.

This does not make the sentence false. *"Of the games where a team led that count
by 12 or more, it lost 243 of 708"* is a true description of the archive, and we
are describing rather than predicting. But it means **the reference class is
selected on a variable that is itself related to the outcome**, so a causal reading
is not merely unsupported, it is specifically wrong.

CHENG's defence — *never put the game's number and the rate in a causal sequence,
no "so", no "which means"* — was offered as a grammatical precaution. It has a
mechanism behind it, and that makes it a requirement rather than a style note. It
is enforced as a copy gate.
