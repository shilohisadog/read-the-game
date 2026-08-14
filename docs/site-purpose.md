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

**Open, and I do not have a good answer:** how to name the opponent without
inviting the comparison. *"Ottawa on Thursday"* plus Buffalo's own numbers is the
safest thing I can construct, and it is also the least useful version of what
Kevin asked for. That tension is real and I would rather have it argued than
resolve it by quietly adding a second column.

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

## 10. Proposed order

1. **The loop**, with the most recent game (§5). Serves the audience with nothing.
2. **Name the concepts and say what the site is** (§8). Small, and the gap is measured.
3. **The deep-link seam** (§6). A mechanism; unblocks everything written later.
4. **"How it works"** (§3) — methodology, which also lets the four limits boxes
   shrink to one line, and gives the chrome nav a second destination.
5. **The novice test.**
6. **"New to hockey"** (§6), written against what the test showed.
7. **Schedule storage** (§7), then the look-ahead surface and its card (§7.1) in October.

## 11. What I want argued

- **§5.1's iframe.** It is the only option that keeps one renderer, and it is
  also the heaviest. If the weight is unacceptable on a phone, the alternative
  costs a doctrine rule.
- **§6's event index.** Pinning a teaching link to an array position couples the
  copy to the extract's ordering. I do not have a better key and would like one.
- **§9 itself.** Deciding what *not* to decide is the part of this document I am
  least practised at, and the temptation is to build the fun thing and call the
  test a formality.
