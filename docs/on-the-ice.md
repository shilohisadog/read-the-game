# On the ice — from a list of names to what happened while they were out there

**Kevin, 2026-08-17:**

> *"On the 'On the ice' page, we list the players on the ice for the whole game,
> let's brainstorm how to maximize the education and/or interactivity of that
> page… maybe data popups tied to the players, or game statistics per player (if
> that data is available)."*

> *"[Zone starts] would be something a casual fan would want to learn about."*

Everything below is **measured from the reference game and a 230-game sample of
published extracts**, not proposed from memory. Where a number is from one game
it says so, because one game is not a tendency.

---

## 1. The organizing idea

The page answers **"who was out there."** Every worthwhile addition is the same
next question: **"what happened while they were out there."**

That is the Control layer applied to a person instead of a bench. It is counting
rather than modelling, and it is a concept the site already teaches — so it costs
a novice no new vocabulary.

## 2. What the data supports, with the numbers

### 2.1 The most educational fact on the page is not about a player

> **688 shifts, average 51.3 seconds** (reference game).

A novice assumes players stay out there. They do not, and the page is already
holding the proof without saying it.

### 2.2 Per player, all countable

| | TOI | shifts | avg | longest | on-ice attempts |
|---|---|---|---|---|---|
| Dahlin | 26:19 | 28 | 56s | 2:06 | **31 for / 37 against** |
| Brodin | 23:31 | 27 | 52s | 1:35 | 30 / 24 |
| Spurgeon | 21:52 | 31 | 42s | 1:23 | 30 / 22 |

**Dahlin is the row to build the page around.** More ice than anyone and
underwater — the site's own thesis at the level of a person: he was excellent,
his team was being outshot, and the number does not say which.

Also available and honest: individual shots, hits, blocks, giveaways, takeaways
and assists (`actor`, `blk`, `a1`, `a2`); **linemates** as shared seconds, which
is how a novice learns what a "line" or a "pair" is; and **who was on the ice for
each goal** — checked, it resolves cleanly to ten skaters and two goalies.

**One pairing worth building deliberately:** a player's on-ice **goals** (one or
two events) beside their on-ice **attempts** (~68). That is *which number counts*
taught in a single row, with the sample size visible rather than explained.

## 3. ⭐ Zone starts — yes, and cleanly

**All 55 faceoffs in the reference game carry coordinates, and across 928
extracts covering every one of the 715 dates in the archive it is 52,742 of
52,742 — 100%.** There is no zone *field* in the extract and none is needed: the
coordinate **is** the dot.

*(This was first checked on the same 230-game sample that got §4.1 wrong —
12,864 of 12,864, also 100%. It was re-run with the date-covering instrument
because a uniform sample cannot see a clustered absence, and the answer held at
four times the size. A claim that survives a better instrument is worth more
than the same claim asserted twice.)*

They land on the real dots and nowhere else:

| dot | faceoffs (reference game) |
|---|---|
| ±69, ±22 — the four end-zone dots | 41 |
| 0, 0 — centre | 10 |
| ±20, ±22 — neutral zone | 4 |

**There is no threshold to choose.** End-zone dots sit at \|x\| = 69, neutral at
\|x\| ≤ 20, the blue line at 25. The dots are discrete, so "which zone" has no
boundary case to argue about and no constant that can drift.

### 3.1 What it is for, and why it is not the modelling we refuse

| | started OZ | started DZ | NZ | on-ice attempts |
|---|---|---|---|---|
| **Kaprizov** | **16 of 20** | 4 | 3 | **48 for / 20 against** |
| Dahlin | 11 of 18 | 7 | 8 | 31 / 37 |
| Spurgeon | 9 of 20 | 11 | 6 | 30 / 22 |
| **Power** | **5 of 17** | 12 | 4 | **22 / 29** |

**This is the missing context for on-ice attempts, and it arrives with nothing
modelled.** Two columns, counts and denominators, no reading supplied. The column
*labels* carry the relationship as a question — *where he started* and *what
happened while he was out there* — and the reader does whatever joining they
wish.

That is the standing rule — *show the distance from normal, never supply the
inference*. What we must NOT build is a zone-start-**adjusted** attempt number:
that is a model, it hides its own assumptions inside a single figure, and it is
the thing this project refuses everywhere else.

> **⚠️ This section previously ended with a sentence that broke its own rule.**
> It read: *"Kaprizov was sent out to attack and the attempts followed; Power was
> sent out to defend and was underwater."* **"Sent out to attack" is a claim
> about coaching intent and "the attempts followed" is a causal claim — neither
> is in the feed.** It is the `tired` class exactly, in the document arguing
> against the `tired` class. (CHENG.)
>
> **And the four rows do not support it.** 16/20 → +28, 11/18 → −6, 9/20 → +8,
> 5/17 → −7. That is not monotone: Spurgeon starts *below* half and is
> comfortably positive while Dahlin starts above it and is negative. The table
> was more honest than the paragraph interpreting it, and the paragraph is gone.

**The percentages went with it.** `61%` on eighteen faceoffs is exactly what the
fraction rule exists to prevent, and §3.2.3 said so while the table above it led
with a percentage column.

### 3.1.1 ⭐ Measured before building: the column does separate

CHENG's objection was that the reference game may simply contain extremes — *"if
a typical game has everyone between 45% and 55%, the column is noise wearing a
header."* Taken as a measurement rather than an argument, over **847 games with
shifts, 21,667 player-games** with at least 8 end-zone faceoffs:

| | median | IQR | ≥70% | ≤35% | 45–55% |
|---|---|---|---|---|---|
| all situations | 50.0% | **36.4 – 66.7** | 21.9% | 23.3% | **17.2%** |
| even strength only | 50.0% | 37.5 – 63.6 | 18.3% | 22.4% | 18.5% |

**Roughly 45% of player-games sit at an extreme and only ~17% land in the dead
band.** The column separates, so it is a feature and not a coincidence.

**And the spread is not a small-denominator artifact** — the obvious way this
result could be fake. Raising the minimum from 8 to 20 end-zone faceoffs cuts the
population from 21,667 to 1,732 and the IQR moves from 36.4–66.7 to **38.1–66.7**:

| min faceoffs | player-games | IQR | ≥70% |
|---|---|---|---|
| 8 | 21,667 | 36.4 – 66.7 | 21.9% |
| 12 | 12,583 | 38.5 – 66.7 | 20.8% |
| 16 | 5,324 | 38.9 – 66.7 | 21.2% |
| 20 | 1,732 | 38.1 – 66.7 | 22.2% |

**The reference game is a good example, not a freak one.** Kaprizov's 16-of-20 is
about the 90th percentile and Power's 5-of-17 about the 20th — unusual enough to
teach with, common enough that the next game will have someone like them.

**The special-teams confound is real and small.** Restricting to even strength
drops the ≥70% share from 21.9% to 18.3% (and to 14.9% at a minimum of 12), so
penalty-killers inflate the extremes without creating them.

### 3.2 Three precisions the label has to carry

1. **It is "on the ice for the faceoff", not "the shift began there."** The
   stricter version needs a time window, and a chosen constant with no source in
   the data is the shape that has been killed twice already. The version with no
   constant is the one to ship, and the label must say which it is.
2. **Zone is relative to the bench.** The same dot is offensive for one team and
   defensive for the other. `attackDirection` in `src/lib/rink.js` already
   decides this and must be imported, never restated — it is the same function
   the slot layer uses.
3. **One game is a deployment note, not a tendency.** Dahlin's 61% is 11 of 18.
   The raw counts belong on the row beside any percentage, which is the
   invariant the whole site runs on.

**Unchecked and worth checking before building:** these counts include special
teams, so a penalty-killer collects defensive-zone starts by definition. `sit` is
on every event, so an even-strength split is available if it earns a column.

## 4. ⭐ The page is pinned to one game for no data reason

`builders/build_B.py` compiles `data/rich.json` — the reference game — into
`on-the-ice.html`. That is why it is a Workshop card described as "pinned to one
game".

**But shifts are in the published extracts.** 846 in the Cup final, and **4,262
of the 4,417 published games carry them — 96.5%.** The page could run on almost
any of them with the same fetch `game.html` already makes.

This reframes "the Workshop items need updating": this one does not need
updating so much as **releasing**.

### 4.1 ⭐ The 155 that do not — and the first version of this section was wrong

**This section originally read "the three that do not", from a 230-game sample.
It named one five-day cluster. There are three populations and the largest is 97
games.** The sample was not too small; it was the **wrong instrument**. Shift
absence is *date-shaped* — when it happens, it takes every game that night — and
a uniform random sample of an archive answers "how often", which was never the
question. Re-probed **one published game per date, all 715 dates**:

| population | dates | published games | |
|---|---|---|---|
| **2023 preseason** | 2023-09-23 → 2023-10-07 | **97** | every one, 10 of 10 spot-checked at game level |
| **regular season** | 2025-04-08 → 2025-04-14 | **55** | every game on all seven dates, plus one on 04-15 |
| **all-star exhibition** | 2024-02-01, 2024-02-03 | **2** | `gameType` 12 and 4 |
| | | **155 (3.5%)** | |

**Preseason is not the category it looks like.** 2024 and 2025 preseason carry
shifts — 10 of 10 sampled in each — so 2023's is an outage, not a rule about
exhibition hockey. It also sits inside a population that already fails us at 6×
the regular-season rate for reasons we have not explained, and this is the first
hard fact about that population that is not a refusal.

**Both big populations are contiguous and complete**, which is what an endpoint
outage looks like and not what a property of a game looks like — so a targeted
backfill is the likely repair. The page must still say **"we do not hold the
shift chart for this game"** rather than render an empty rink, because 155 games
is one every twenty-eight.

**What this check did NOT do:** a per-game sweep of all 4,417. It probed one game
per date, so an isolated single-game gap — exactly like the 2025-04-15 straggler,
found only because the window around it was already being read game by game —
would not be seen elsewhere. The 96.5% is therefore an upper bound on coverage,
and the page's "we do not hold it" branch is what makes the difference not
matter.

## 5. The artifact — shown as an overlap, never as a state

Second by second, the feed says **5v5 for 70.0%** of the reference game — which
is what a real game looks like. It also says **7v5 for 22 seconds**, which is
impossible: the shift chart records a changing player as on the ice until he
reaches the bench.

**This section originally said "show it, with the reason", on the grounds that
the puck hopping between real events is honest for the same reason. CHENG killed
the analogy and he is right:**

> *"The puck hopping is honest because every position it occupies is real. 7v5
> is not a position anything occupied — it's an artifact of two intervals
> overlapping."*

Printing `7v5 — 22 seconds` in a strength breakdown publishes a number we know is
false, and *"with the reason attached"* is a disclaimer doing work an invariant
should do — the pattern we replaced everywhere else.

**Ruled: show it as an overlap, in the timeline, where it visibly is one.** Two
bars overlapping by 22 seconds, captioned *"the chart records a changing player
as on the ice until he reaches the bench"*, is a recording artifact shown with
its cause — the same treatment as the blocked ring. **The visual form is
self-explanatory; the tabular form looks like a claim.**

**And at faceoffs specifically the artifact is small**, measured across 847 games
— skaters per team recorded on the ice at a faceoff:

| 5 skaters | 4 | 6 | 3 |
|---|---|---|---|
| **87.1%** | 10.6% | 1.2% | 1.0% |

The 4s are penalty kills and the 6s are mostly a pulled goalie, both real. Only a
fraction of the 1.2% is overlap, so **zone starts are not materially damaged by
it** — which is a different question from whether a strength breakdown should
print the artifact, and it is why §3 can proceed while §5 changes shape.

## 6. What to refuse

- **Any adjustment** — zone-start, quality-of-competition, or otherwise.
- **Any rating.** No "good"/"bad", no rank without its denominator.
- **Any "so he is…" sentence.** On-ice attempts are driven hard by deployment,
  which is precisely why deployment is shown as its own column instead of being
  folded into the number.

## 7. Verification this will need

- **One test that on-ice membership is the shift chart's answer**, not a
  reconstruction — driven against a real extract, with the 5v5 share asserted to
  be in a plausible band rather than pinned to a value.
- **A test that a game with no shifts says so** rather than rendering a page that
  looks like nobody played. §4.1 supplies 155 real fixtures, and they are not
  interchangeable: a 2023 preseason game, a game from the April window, and the
  2024-02-01 exhibition exercise three different reasons for the same absence.
- **A test that zone is read through `attackDirection`** — a mutation flipping
  home and away must fail, or the column is right by luck on one bench.
- **A test that the counts sit beside every percentage.**
- **Look at it.** `tools/pixels.sh`, both widths, since none of the above sees a
  pixel.

## 8. ✅ RULED (CHENG, 2026-08-18)

**1 — Stay in the Workshop, but release from the single game.** The two halves of
the question were fused and only one fails. *Releasing* it from `rich.json` is
right — §4 shows the pin is an artifact of `build_B.py`, not a data constraint.
*Promoting* it to the main app is wrong, for three reasons the doc did not make:

- **The phone kills it.** A shift chart is forty rows of names. There are already
  1,840px and 21 controls below the rink, and the header fight was over 22
  pixels. Forty rows at 360px is not a density problem, it is a different
  product.
- **It presumes the knowledge the site exists to build.** *"Dahlin 26:19"* means
  nothing to someone who does not know Dahlin. Every other layer teaches a
  *concept*; this one teaches about *people*.
- **It is reading, not watching.** A roster table is the boxscore competing with
  the replay — the argument that made the event index past-only.

The deep-link seam (ruling 3) is what connects it to the main app without the
density cost.

**2 — A timeline.** The data is intervals and only a timeline shows them as
intervals. The stronger argument is §2.1: *688 shifts, average 51.3 seconds* is
the most educational fact on the page, and **a timeline shows it — a novice sees
the bars are short — where a table asserts it.** Forty timeline rows also need
width, which is a second argument for keeping it on the desktop Workshop.

**3 — Yes, and it is the cheapest high-value thing here.** A shift start is a
moment, `?at=` exists, and this is exactly what `what-you-can-see.html` lacks. It
turns a table into a set of doors and keeps the page from being a dead end.

**4 — A toggle, not two columns.** Consistent with the shipped strength filter:
two columns invite the reader to difference them, a filter re-runs the count in
front of them. Default all-situations. §3.1.1 measures what the toggle does —
≥70% falls from 21.9% to 18.3% — and the confound it addresses is real:
**a penalty-killer collects defensive-zone starts by definition**, which hits
hardest exactly the players whose deployment is most extreme.

## 9. ⭐ The instrument lesson generalizes — and then breaks

§4.1's correction produced a rule, and CHENG stated it as:

> **Coverage failures in this feed are date-shaped, because they are endpoint
> outages. So any claim of the form "X is present in N of N sampled games" needs
> a date-covering probe, not a uniform one.**

Four existing presence claims were named as suspect and all four were re-probed
over **928 extracts, 299,981 events, covering all 715 dates**:

| claim | as stated | measured | shape |
|---|---|---|---|
| `rem` on every event | never gated | **299,981 of 299,981** | — |
| `sit` present | "all 320 in one game" | 299,958 of 299,981 | **date-shaped** |
| `blk` on a blocked shot | "2,599 of 2,599, 80-game sample" | 30,546 of 30,550 | **event-shaped** |
| `homeTeamDefendingSide` | "6,333 plays, never missing" | not in the extract — needs a raw probe | unknown |

**The 23 missing `sit` values fall on exactly the 15 dates of the 2023 preseason
outage** — the same population that has no shifts. That is the rule working.

**But `blk` breaks the rule, and this is the more useful finding.** Its four
absences are on 2023-10-30, 2025-01-07, 2025-01-14 and 2026-01-16 — four dates,
three seasons, no cluster. **A per-date probe cannot find four events in 300,000;
only reading every event does.** So there are (at least) two shapes, and the
generalization is too strong as stated:

> Coverage failures here are **date-shaped when they are endpoint outages and
> event-shaped when they are individual records.** The instrument must match the
> shape being claimed, and *"which shape is this?"* is now the first question,
> not *"how big is my sample?"*

**The code already survived this**, which is the part worth keeping.
`src/lib/layers/blocked.js` reads:

> *"`blk` … is present on 2,599 of 2,599 blocked shots across an 80-game random
> sample — but 'always so far' is not 'always', so an unresolvable blocker is
> recorded rather than assumed away."*

The evidence was from the weak instrument; **the caution was right anyway, and
its defensive branch is exercised by four real archived events.** A comment that
distrusts its own evidence is worth more than one that quotes a bigger number.
