# What the site is for, and who it is for

*For CHENG, and then for a todo list. §1–§4 are the argument; §5–§8 are the work
it implies; §9 says what should NOT be decided yet, which is new.*

Kevin, after reviewing the whole site on desktop and mobile:

> *"The home page doesn't give much of a clue as to what the purpose of the
> website is — no mention of icing, offsides, faceoffs, corsi, high danger shots,
> goalie views, etc. We don't have any engaging content on the front page,
> nothing funnels the viewer into the site to look around."*

He is describing a measurable gap, not a taste. Counting mentions on the shipped
homepage:

| icing | offside | Corsi | high-danger | empty net | penalty | face-off |
|---|---|---|---|---|---|---|
| **0** | **0** | **0** | **0** | **0** | **0** | 3 (only inside workshop blurbs) |

**A site that teaches you to read hockey names almost nothing it teaches.**

---

## 1. Three audiences, and a fourth thing that is not one

Kevin's three, which I think are right:

1. **The casual fan who wants to learn the game.** Acquisition. Arrived wanting
   to learn.
2. **The team fan** reviewing their club's games and looking ahead to the next
   one. Retention.
3. **The social-media arrival**, vaguely interested, checking it out.

**One refinement.** (1) and (3) have the *same destination* and *different
patience*. The learner will read; the curious visitor leaves in fifteen seconds.
That is one funnel with two entry speeds, not two funnels — which is exactly why
the loop in §5 matters: it is the only thing that serves (3), and it costs (1)
nothing.

**And a fourth group that is DISTRIBUTION, not a use case:** the person who
shares this. "An honest, deterministic hockey visualiser, source published"
travels on Hacker News and in a subreddit in a way a hockey lesson does not. They
arrive, check we are not lying, share, and leave. That implies **make
verification fast** — it does *not* imply building a funnel for them.

Naming it because `docs/homepage.md` §2 already records me designing for the
smallest audience once, and the loudest audience is the easiest one to design for
by accident.

## 2. What each one needs, and what exists today

| | needs | today |
|---|---|---|
| casual fan | to be told what icing/offside/control *are*, with examples | the material exists inside layers they must discover and toggle |
| team fan | their club's games, and **the next one** | games: yes, two clicks. Next game: **not built** |
| social arrival | a taste, in seconds, without reading | **nothing** — the page has no motion at all |
| the sharer | to verify quickly | good: source linked, every number carries its fraction |

Three of the four have a real hole. The fourth is the one we did not design for.

## 3. Two kinds of concept, and they want two different pages

Kevin's list mixes them, and conflating them makes both worse:

- **Hockey rules** — icing, offside, faceoffs, penalties, the empty net. What a
  novice needs in order to *watch a game*.
- **Our measurements** — control (Corsi), high-danger, save percentage. What
  anyone needs in order to *trust our numbers*.

So: **"New to hockey"** is rules, in plain language, for audience (1).
**"How it works"** is what we count, what we refuse to count, and why — the
doctrine made public, for the sceptic and the returning fan. The tip jar lives on
a third page, About/Support, per `docs/site-chrome.md` §8.

The whistle layer's copy table is already written to this standard: every row
names `rule: NHL Rule 81` or `field: rsn`. The rules page is largely a matter of
surfacing what exists. **The measurements page is not** — control, high-danger
and goaltending have layer copy, not teaching copy.

## 4. The front page's job, stated once

For a stranger, in order: **what is this → why should I care → what do I do.**
Right now only the third has an answer above the fold, and it is a button.

---

## 5. The five-second loop

Kevin: *"Maybe a video capture of a game on the home page, just 5 seconds of a
game replay to give the visitor a taste."*

### 5.1 Run the real renderer; do not record a video

We already own a renderer that draws real events. Running it beats a recording on
every axis: no binary asset to go stale, no `media-src` in the CSP, no separate
thing to re-record when the rink changes — and it is not a trailer for the
product, **it is the product**. Every mark still traces to a recorded event, so
Doctrine §4 is satisfied by construction rather than by promise.

Cleanest implementation is an `<iframe>` of `game.html` in a preview mode, because
it keeps the **one renderer** rule exactly intact. **The cost, stated up front:**
it pulls a real game extract onto the homepage. It must lazy-load rather than
block, and if the weight proves unacceptable on a phone the fallback is a small
loop built from the same `src/lib` drawing modules — which is a second *drawing*
path, and I would rather not.

### 5.2 The most recent game, NOT the featured one — and the reason is a defect

Kevin: *"People will look at the 2024 date and wonder why something 2 years old
is featured."* He is right, and the data makes it sharper than recency:

- **Only 2 games in 4,119 clear the current featured threshold (edge 33).** That
  hero would have read *19 February 2024* for **years**. A slot that updates
  roughly twice per three seasons is not featuring anything; it is a literal with
  extra steps — the exact failure `docs/homepage.md` §1 flagged in the *previous*
  typed-in hero, reintroduced by a rule instead of by a constant.
- **"The sharpest" is settled by a tiebreak.** DAL 33 and LAK 33 are equal;
  `featured.sort` breaks ties by game id, so we were showing the older of two
  equally-sharp games because it sorts first.

The most recent viewable game is **CAR 3 @ VGK 0, 14 June 2026** — a playoff
game, and a shutout. Recent, consequential, and recognisable to precisely the fan
who does not follow February games in Dallas.

**And Kevin's own worry about recency bias does not apply.** Choosing what to
*show* by date biases no measurement: the base rates still run over all 4,119
in-scope games and nothing is computed from the selection. Meanwhile the recency
rule is *more* deterministic than the one it replaces — it is already implemented
(`pick()` in the game bootstrap), cannot be typed, and refreshes itself nightly
with no deploy.

**Copy limit:** say *"the most recent game in the archive"* and give teams, score
and date. Do **not** say "the Stanley Cup Final". It is the last playoff game by
date *today*, but during a live postseason the last game is not the final, and
that sentence would silently become false.

### 5.3 The paradox game is demoted, not deleted

It moves into the lesson section beside the three base rates, as the worked
example: *the sharpest case in the archive*. Down there its age is irrelevant
because it is a data point rather than bait — and one anecdote was always weak
evidence sitting next to 3,855 games.

Resulting shape:

```
headline
five-second loop of the most recent game        ← engagement, always fresh
its sentence · ▶ watch it
Watch your team · limits · Workshop
Which number you count changes the answer
    three rates on one scale · the 60.4% payoff
    ↳ the sharpest case in the archive          ← the paradox, as evidence
```

Two jobs, two places, neither pretending to be the other.

## 6. "New to hockey" needs a seam before it needs copy

Pointing a novice at a game is not teaching. The material is already here; it is
locked inside layers they have to discover and toggle.

What makes it work is **a deep link into a moment**: *"Here's an icing. Watch
this one."* → opens a real game, at that event, with the whistle layer on.

Today `game.html` reads exactly one URL parameter, `?game=`. Adding an event
index and layer state is small and buys a lot:

- every teaching claim becomes **checkable by the reader**, which is the site's
  whole posture rather than a nicety
- each concept becomes independently shareable — and the shareable unit is
  already a game, so this extends a decision rather than adding one
- the same mechanism serves the "How it works" page and any future writing

**Build the seam before the copy.** Eight explanations written against a page
that cannot demonstrate them is eight explanations to rewrite.

Two hazards to design against:
- an event index is only stable while the extract is stable; a re-derive that
  changed event ordering would silently move every deep link. Either pin on
  something more durable than an array index, or state the coupling and test it.
- a deep link that lands out of range must degrade to the start of the game with
  a word, never to a blank rink.

## 7. Looking ahead — the only pre-game surface we would have

Kevin: *"The schedule for this coming season is available, we'll need to figure
out how to parse that data and integrate it."*

**More of this exists than either of us thought.** `builders/fetch_nhl.py`
already fetches `/v1/schedule/{date}` and already parses it — `classify()` splits
each week into `final` and `unknown`, and **`unknown` is exactly the
not-yet-played games.** They arrive every night and are discarded.

What is missing is narrow:

1. **The window points backwards.** `dates_in_window(end, days)` ends at today,
   and `schedule_urls` walks forward in 7-day spans that stop at today. A forward
   look is **one additional request per night**, not a new integration.
2. **Nothing is stored.** `data.readthegame.co/schedule.json` is a 404. The
   schedule is used transiently for routing and dropped.
3. **Nothing renders it.**

**The hazard that makes this different from every other page here.** Every
artifact on this site is about completed games and is true forever. A stale "next
opponent" is *actively wrong*. So it must state its own freshness, handle an empty
August, and never outlive its data — which is the `lastRun`/`dataThrough`
discipline from `docs/ingest-state.md`, applied to a surface that faces the
reader.

**Frame as "what to watch for", never "who is better"** — a side-by-side implies
a forecast even when every number in it is descriptive.

**Sequenced for October**, because that is when it is both correct and useful. It
should be in the plan now so it is not rediscovered as a surprise.

### 7.1 The card, which is the hard part

Kevin: *"Then we'll need to pull relevant stats for that team and provide a card
for the interested viewers."*

**The plumbing is the easy half and the framing is the whole risk.** Every number
such a card could carry already exists: `builders/measure.mjs` writes a record per
game (`attempts`, `sog`, `level`, `score`) using the same modules the browser
imports, so season-to-date figures for any club are an aggregation of data we
already hold. **No new analysis tier, and nothing fetched from the league.**
`measures.json` currently publishes nothing per-team; that is the gap.

**"Relevant stats for that team" is where this goes wrong if it goes wrong.**
Two hazards, and they compound:

**A side-by-side implies a forecast even when every number in it is
descriptive.** Put BUF's column next to OTT's and the reader does the subtraction
we refused to do, and attributes the conclusion to us. This is not hypothetical
prudishness — it is the whole reason the roadmap rule reads *show the distance
from normal, never supply the inference*, and a matchup card is the single
easiest place to break it.

**And base rates go thin fast.** 4,119 games is a reference class; a team's
first six are not. In October every one of these numbers is small-n, and that is
precisely when the card is new and most likely to be read. The fraction
convention is what saves it — *"controlled play in 4 of 6"* is visibly thin in a
way *"67%"* is not — which is the same argument that removed the need for a
minimum-n threshold on the per-game sentence.

**What I would put on it**, and the shape matters more than the choice of stat:

- **One team's numbers at a time**, not two columns. The opponent is named and
  identified; it does not get a rival column for the eye to difference.
- **Counts with denominators**, never rates alone, and never a rank.
- **The one that is pure counting and is the site's thesis personalised:** their
  record when they controlled play versus when they did not. It needs no model,
  it is the thing the whole archive is about, and it reads as a fact rather than
  a projection.
- **An honest empty state that is the DEFAULT in October**, not an edge case.
  *"They have played two games. That is not enough to say anything yet"* is the
  correct card for the first fortnight of a season and must be designed first,
  because it is what most visitors will see when this ships.

**What it must refuse**, stated on the page as the limits block already does:
expected goals, "due for regression", playoff odds, strength-of-schedule
adjustment, and any sentence with a comparative in it.

**Where it lives:** the team view (`/?team=BUF`), because that is the retention
surface and the bookmark a returning fan lands on. Not the front page, which is
serving a stranger who has no team.

**SETTLED BY KEVIN, and it removes the tension above:** there is no matchup card.

> *"I don't envision a matchup card. I want a card that states exactly what we
> state — 'not enough data', 'distance from average', 'x of y', 'r of z',
> 'top/bottom x% in this category'. Just our straightforward data sets,
> presented cleanly, without any hint of matchup or attribution."*

That is the right call and it dissolves the problem rather than balancing it: no
second column means nothing for the eye to difference, so the forecast reading
has nowhere to come from. Four of the five formats are already the conventions
this site enforces everywhere. **The fifth needs changing.**

### 7.2 My fix was half right, and CHENG caught which half

I argued that `"top 10%"` should become `"4th of 32"` because **a position is a
fraction, so it carries its denominator**. CHENG's correction is exact and I am
recording it rather than quietly editing the sentence:

```
"controlled play in 4 of 6"   numerator AND denominator describe the evidence
"4th of 32"                   the 32 describes the FIELD, and is constant
```

**Thirty-two is always thirty-two.** It is the number of clubs, not the number of
games, so `4th of 32` on six games renders identically to `4th of 32` on sixty —
which is precisely the defect I diagnosed in `top 10%`, surviving my own fix.

The convention's content was never "show a fraction". It is **show the sample
size**, and a rank never does. My fix addressed the shape of the thing while
missing what the shape was for — the same failure this project catalogues
everywhere else, committed inside the argument correcting it.

> **"4th of 32, after 6 games" — never a bare rank.**

**And my amplification argument was wrong too.** I said a percentile exaggerates
small differences because one rank step is roughly three points. That is a
property of **ranking**, not of expressing a rank as a percentile: two clubs
separated by one attempt sit two positions apart whether you print `4th of 32` or
`top 10%`. So the swap fixed denominator visibility and left instability exactly
where it was.

**Which makes value-with-spread the primary format, not the garnish.**
*"52.1%, and the 32 clubs run from 46.8 to 54.3"* is continuous, stable, tells a
reader they are near the top, and supplies no inference — it contains everything
a rank conveys without the discontinuity. So: **value and spread always; rank
only once §7.4's measurement says it means something.**

### 7.3 "High-danger" is somebody else's term, and we should stop using it

I wrote that the hazard was a reader mistaking our number for expected goals.
CHENG's point is worse and better founded: **the term is already taken**, by a
specific published rule, at the sites a curious reader will cross-check against.

**What our rule actually is**, read out of the code rather than remembered —
`isHighDangerEvent` in `src/lib/layers/goaltending.js` over `isHighDanger` in
`rink.js`:

> an **unblocked** shot attempt (`goal`, `shot-on-goal` or `missed-shot`), taken
> within **33 ft** of the attacking net and inside **±22 ft** of centre.

No rush bonus, no rebound bonus, no shot-quality weighting. A pure location test.

**One correction to CHENG's version of the discrepancy.** He wrote that Natural
Stat Trick *"subtracts blocked shots from danger while we count them"* — **we do
not count them.** `SHOT_TYPES` is `{goal, shot-on-goal, missed-shot}`, so a
blocked attempt is never high-danger under our rule. His characterisation of
NST's point system is also **his, and unverified by us**; nobody here has read
their methodology page, and this project has been burned once by taking a third
party's documented figure at face value.

**The recommendation survives all of that, because it does not depend on it.**
The term is in common use with definitions that are not ours, our number will
therefore disagree with numbers published elsewhere, and a reader who checks will
conclude we are wrong rather than different. That is the exact opposite of what
this site trades on.

> **Rename it. Proposed: "shots from the slot".**

Accurate (it is a location test), novice-legible (a novice can picture the slot
in a way they cannot picture a danger tier), and collision-free. I would avoid
"chance" as well as "high-danger" — "scoring chance" is loaded in the same way
and borrows the same authority. The rule line travels with it: *an unblocked
shot taken from within 33 feet, inside the slot.*

**Cost, stated:** the term appears **13 times** in each shipped game page — the
layer button, the why-popup, the legend, the ledger reasons. This is a copy
change across `build_main.py` plus its tests, not a one-line rename, and the
module and function names can stay as they are: `isHighDangerEvent` is internal
vocabulary and only the user-facing label is making a claim.

**Worth keeping from CHENG:** Evolving-Hockey declines to publish scoring-chance
data at all, on the grounds that it forces a continuous quantity into discrete
buckets. That is a real critique of the metric family, and it is the strongest
argument for ours being a **transparent rule** rather than a model — which is
another reason not to name it after somebody else's.

### 7.4 How thin is too thin — measured, and measured THREE times

The remaining question is when any of this is worth showing, and a
minimum-games threshold would be a parameter with no source in the data — the
shape CHENG calls *a model wearing a UI control*, which already killed `recent`
trails and the five-event placement window.

It does not have to be chosen, because **it can be measured.** The archive holds
three complete seasons: take each club's value after 6, 10 and 20 games and
compare with where it finished. That yields a sentence a reader can discount by —
*"after six games a club's position typically moves N places"* — rather than a
cutoff we picked.

**And it must be measured per metric, not once (CHENG).** Stability differs
sharply by how much evidence a game supplies: attempt share gets ~60 events a
night, while a goaltender faces ~30 shots and one bad evening moves a save
percentage a long way. A single "after N games" answer would be right for one of
the three and wrong for the other two. Same query, three times.

### 7.5 This is the first thing on the site that can go wrong by itself

CHENG's finding, and it is the one with a consequence nothing else here has.

The limits block says *"A replay, not live coverage. Every game here is over."*
A next-opponent card is the first statement on this site about a game that has
not happened. That is defensible — a published schedule is a recorded fact, not
a prediction — but it breaks a property every other page relies on:

> **Every other number here is fixed once ingested. This one can become wrong
> without anyone touching it.** Games are postponed, rescheduled, relocated.

So three things ship with the card, not after it:

- a **postponed/changed state**, designed alongside the empty state rather than
  discovered in November
- the **freshness line covering the schedule**, not only the archive — the
  `lastRun`/`dataThrough` discipline from `docs/ingest-state.md`, applied to a
  surface that faces a reader
- a **sentence in the limits block**: *"the next game is from the league's
  published schedule and can change"* — another `display:` row, a statement about
  what we are doing rather than about hockey

### 7.6 Goaltender ordering is an implicit prediction

Listing by appearances is the neutral, factual choice — and **the first name will
still read as "the one who is playing".** The fix is not to reorder but to say
what the order is: *"in order of appearances this season"*. Then the ordering is
a stated fact rather than an inference the reader supplies on our behalf. The
refusal to name a probable starter stands.

## 8. What the site should say it is

One sentence, above the fold, that the page currently lacks entirely. Something
of the shape: *every NHL game since 2023, replayed with the numbers built in
front of you, so you can see where they come from instead of taking them on
faith.* The exact wording is worth arguing over; the absence is not.

And the concepts should be **named** on the front page — icing, offside,
faceoffs, control, high-danger chances, goaltending — because a visitor deciding
whether to look around is deciding on the basis of whether we appear to cover
anything they wondered about.

## 9. What should now WAIT for the novice test

New, and it changes how this document should be read. Kevin has a casual-fan
tester lined up. So **"nobody has watched a novice use this site" stops being a
permanent caveat and becomes a scheduled event** — which means the honest move is
not to guess harder, but to say which decisions should not be guessed at all.

**Build before the test** (cheap, or independently justified):
- the loop (§5) — it serves an audience with no surface at all, and costs little
- the deep-link seam (§6) — a mechanism, useful regardless of what the copy says
- naming the concepts (§8) — the absence is a fact, not an opinion
- the schedule storage (§7) — plumbing, invisible until it renders

**Wait for the test:**
- how much explanation a novice wants before pressing play
- whether the three-rate scale reads as insight or as homework
- whether "control" lands at all, or needs a different word
- whether the layer toggles are discoverable without being told they exist

That second list is where I would otherwise write eight sections on a hunch, and
where being wrong is expensive to undo.

## 10. The todo list

Both reviews are folded in, so this is the sequence. **Nothing below is started.**

### Before the novice test

| # | what | why now | cost |
|---|---|---|---|
| 1 | **The loop** — most recent game, real renderer in a lazy-loaded frame (§5) | the only audience with no surface at all | preview mode in `build_main.py`, `frame-src` in the CSP |
| 2 | **Say what the site is, and name the concepts** (§8) | measured gap: six concepts, zero mentions | copy on `index.html` |
| 3 | **Rename "high-danger" → "shots from the slot"** (§7.3) | a term collision that makes us look wrong rather than different | 13 strings per game page, plus tests |
| 4 | **The deep-link seam** — `?game=&at=&layer=` (§6) — designed in [`deep-link-seam.md`](deep-link-seam.md) | a mechanism; every later teaching claim becomes checkable | `build_main.py` URL parsing, plus the out-of-range state |
| 5 | **"How it works"** (§3) | gives the chrome nav a second destination and lets the four limits boxes shrink to one line | new page |

### The test

| 6 | **Kevin's tester** | turns §9's second list from guesses into findings |

### After it

| 7 | **"New to hockey"** (§6), written against what the test showed |
| 8 | **Schedule storage** (§7) — forward window, `schedule.json`, one extra request a night |
| 9 | **Rank-stability measurement** (§7.4), three metrics separately — gates whether rank appears at all |
| 10 | **`measure.mjs` carries danger and goaltending per game** (§7.3) — one derive run, no re-fetch |
| 11 | **The next-opponent card** (§7.1–§7.6), with its empty, thin and postponed states designed first |

**Dependencies worth stating:** 9 gates the format of 11, not its existence. 10
must land before 11 or the card has two of its three rows. 8 must land before 11
or it has nothing to point at. And 3 should happen before 5 and 7, so the new
name is written once rather than written and then corrected.

## 11. What I want argued

- **§5.1's iframe.** It is the only option that keeps one renderer, and it is
  also the heaviest. If the weight is unacceptable on a phone, the alternative
  costs a doctrine rule.
- **§6's event index.** Pinning a teaching link to an array position couples the
  copy to the extract's ordering. I do not have a better key and would like one.
- **§9 itself.** Deciding what *not* to decide is the part of this document I am
  least practised at, and the temptation is to build the fun thing and call the
  test a formality.
