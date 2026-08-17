# The next game — a card about the future, on a site that refuses to forecast

**Kevin, 2026-08-17:**

> *"One thing I haven't mentioned in a while that we need to think through is a
> team's next game and figure out how to present that in an informative manner,
> while still holding true to our doctrine."*

He has named the whole difficulty in one sentence. **Every other surface on this
site describes completed events**, and is therefore true forever. A next-game
card is the first thing here that is *about* something that has not happened.

---

## 0. ⭐ RULED — Kevin, 2026-08-17, after the first draft below

Everything from §1 down was written before he ruled. **Two of its recommendations
are overturned and one is confirmed**, and the argument is left standing rather
than edited away, because a plan of record that quietly agrees with the last
decision is not a record.

> *"Teams change so much season to season I don't think pulling last years data
> into this season would provide anything educational for the viewer. Now, once
> the season gets 10+ games for all teams, I think we can figure out how to
> surface the information of a team's next opponent, W-L, Corsi, Save Pct.,
> Blocked Shots, Shots from Slot… the raw numbers are good, the rate and the
> archive is fine. Global gate is fine too."*

| # | ruling | what it does to the draft |
|---|---|---|
| 1 | **No last-season data. Ever.** | **Kills §4 option 2 — which was half of my recommendation.** Last season is a completed measurement about a roster that no longer exists; a real denominator attached to the wrong team is worse than no denominator, because it looks rigorous. That is DOCTRINE.md 9 applied to time. |
| 2 | **A GLOBAL gate at 10+ games.** | Confirms §4 option 1 and hardens it: not "each team when it is ready" but **the whole card, league-wide, on one date**. |
| 3 | **The card IS the opponent's numbers.** | **Overturns §6.** The opponent is not a name and a link. W-L, Corsi, save fraction, blocked, slot — measured, on the card. |
| 4 | **Raw numbers, then the rate, then the archive.** | Confirms §3's form and fixes the order: the count and its denominator first, the share second, the archive's settled share beside it. |

### 0.1 What ruling 3 costs, stated before it is built

§6 refused the opponent's numbers to keep the forecast reading from having
anywhere to come from. That refusal is now gone, so **the guard has to be
somewhere else**, and it is this:

> **The card carries ONE column, and it is the opponent's. Your own team's
> numbers are not on it.**

Nothing on the card is differenced against anything else on the card. The only
comparison printed is **opponent against the archive** — which is not a matchup,
it is the site's oldest rule (*a rate without a base rate is a story*) doing its
normal job. The forecast needs two teams side by side; the card has one.

**The residual, and it is a placement constraint rather than a copy problem:**
the reader is on their own team's page, so if that page shows their team's
season numbers anywhere near this card, the layout reconstitutes exactly the
juxtaposition the single column avoids. That makes §8 q4 (*where does it live?*)
load-bearing rather than administrative.

### 0.2 What the gate is worth, measured

Not "early November" from memory — computed over three seasons from
`catalog.json`, by taking each team's 10th regular-season date and keeping the
latest:

| season | opens | **last team reaches 10** | first team reaches 10 | archive banked at the gate |
|---|---|---|---|---|
| 2023-24 | 2023-10-10 | **2023-11-04** (NYI) | 2023-10-30 (SEA) | 173 of 1312 (13.2%) |
| 2024-25 | 2024-10-04 | **2024-11-03** (CAR) | 2024-10-24 (NJD) | 190 of 1312 (14.5%) |
| 2025-26 | 2025-10-07 | **2025-10-31** (ANA) | 2025-10-25 (FLA) | 180 of 1312 (13.7%) |

**A global gate costs 5–10 days over a per-team one**, and buys the thing a
per-team gate cannot: the card is never present for one club and missing for
another, which a reader would fairly read as a judgment about the club with no
card. For **2026-27, opening 8 October, the card lights up around 1 November.**

### 0.3 ⭐ The consequence nobody stated: the card is dark for five months a year

Rulings 1 and 2 together mean the card's numbers come from **the current season
only**, and only after the gate. So:

| when | the card |
|---|---|
| Jul–Sep, offseason | **absent** — the season has no games |
| Oct 8 → ~Nov 1 | **absent** — the gate is not met |
| ~Nov 1 → the Cup | **present** |

**That resolves §8 q5 for free.** Preseason was going to be the hard case — a
real fixture the archive deliberately excludes from every number. Under the
global gate there is no card in September at all, so **a preseason fixture is
never named beside a regular-season measurement**, and the mixing problem
disappears without a rule being written for it. *An invariant instead of a
disclaimer* — the same move as the whistle layer.

The cost is honest and should be said out loud: **the retention surface is empty
for the first three weeks of a season**, which is the period with the most
attention on it. The alternative was ruling 1, and ruling 1 is right.

### 0.4 Two questions the rulings do not settle, for Kevin

1. **W-L, or W-L-OTL?** Every standings table a fan has ever seen carries three
   numbers. A bare `26-18` would be a record no other source shows, which is a
   legibility cost on a site whose whole job is legibility. The third number is
   countable — a regular-season game reaching period 4 did not end in
   regulation — so this is a display decision, not a data one. **I would show
   W-L-OTL.**
2. **Whose save fraction?** §3 refuses a probable starter, so it must be **the
   team's**, all goalies pooled, which is the honest form and also the one a
   reader may misread as "their goalie". The label has to carry it.

## 1. The resolution: the game is the OCCASION, not the subject

A card that answers *"how will Buffalo do on Thursday?"* cannot be built here at
any level of care. But that is not the only card the schedule makes possible.

> **The card is not about the next game. It is about what has already happened,
> addressed by the fact that two teams are about to meet. The fixture selects
> which past to show; it is never the thing being described.**

That is the same move as CHENG's chip criterion (*a chip's content is invariant
under playhead movement*): every figure on this card would be equally true if
the game were cancelled. Nothing on it is conditioned on an outcome, so nothing
on it can be wrong when the outcome arrives.

It is also the existing rule one level up — **show the distance from normal,
never supply the inference** — applied to a season instead of a game.

## 2. What is verified, measured today rather than remembered

Memory carried four claims about the pipeline. All four re-checked against the
code and the live endpoint, because a claim in memory is not evidence:

| claim | verdict |
|---|---|
| `fetch_nhl.py` already fetches and parses the schedule | **true** — `schedule_urls()`, and the docstring calls parsing "routing, not interpretation" |
| `classify()` already separates not-yet-final games as `unknown` | **true** — `Classified.final` / `.unknown`, and *the state field is the ONLY thing consulted* |
| nothing is stored — `schedule.json` 404s | **true** — 404 today; `index.json` and `catalog.json` both 200 |
| the window points backwards | **true** — `[(last - timedelta(days=n)) …]` |

**And two things nobody knew, from one request each:**

- **`/v1/schedule/{date}` answers with a SEVEN-DAY WEEK.** The nightly already
  receives up to six days of *future* fixtures and discards them. Looking ahead
  by a week is **not a new request at all** — it is a decision to keep what we
  are already given. That is a smaller change than the "one extra request per
  night" this was previously costed at.
- **The 2026-27 schedule is ALREADY PUBLISHED.** Preseason opens **2026-09-22**
  (43 games in that week, `gameType` 1), the regular season **2026-10-08**
  (52 games, `gameType` 2). A future game carries `state=FUT`, an `id`,
  `startTimeUTC`, both abbrevs and a venue.

```
2026-10-08: 7 days, 52 games, types {2: 52}
  first: UTA @ BOS 2026-10-08T23:00 state=FUT id=2026020056
```

- **And today the payload is EMPTY.** `2026-08-17` returns seven days and **zero
  games**. The offseason state is not a corner case to imagine — it is the state
  the card will be in on the day it is built, which is the best possible luck:
  *the empty case is the one that can be tested first.*

## 3. What the card may say, layer by layer

The three layers the game page already teaches, at season scale. Each is a
count over completed games, with its denominator, exactly as everywhere else.

| | the honest form | the forbidden form |
|---|---|---|
| **Control** | *"Buffalo have led attempts at even strength while the score was level in 21 of 34 games."* | any rate presented as a chance of winning on Thursday |
| **Shots from the slot** | *"38% of their attempts have come from the slot, against 34% across the archive."* | "they generate better chances" |
| **Goaltending** | *"Levi: 612 of 668, over 24 games."* | a probable starter, or a combined "goaltending edge" |
| **Record when they control play** | *"When they led that count they are 14–7; when they did not, 6–11."* | "so they win when they control play" |

**The last row is the best thing available and it is pure counting** — the
site's own thesis, personalised, and stated as two records rather than one
inference. It is also the row a fan actually wants.

**Refused, and the page should say so** (the whistle-layer precedent — a rule
that produces a sentence for everything is a sentence generator): expected
goals, "due for regression", playoff odds, strength-of-schedule adjustment,
and any probable starter.

## 4. ⭐ THE OCTOBER PROBLEM, and it is the real constraint

**In October every one of those numbers has a denominator of three.**

The site's own rule — *a rate without a base rate is a story* — bites hardest
exactly when the card is newest. `1 of 3` is not a season; a team that has led
attempts in all three of its games has told you almost nothing, and printing it
beside an archive rate invites precisely the comparison that is not available.

Three ways out, and they are not equal:

1. **Say nothing until the number can carry itself.** *"Three games in — too few
   to say anything about this season yet."* On-doctrine, and it is the site's
   established habit (the verdict card is absent until the horn; the whistle
   layer's why-line stays empty). **The cost is that the card is at its emptiest
   in the month it would matter most.**
2. **Show LAST season instead, labelled as last season.** A completed
   measurement, honest, and a fan understands the roster changed. **It is also
   the only version with a real denominator in October.**
3. **Show this season with its spread**, once we can compute one — *"over any 10
   games, this normally lands between X and Y."*

**Option 3 cannot be written yet, and that is the blocking dependency.** The
spread is not a design decision, it is a measurement over the archive that
`measure.mjs` does not currently produce: *how far does a team's 10-game control
rate sit from its own 82-game rate?* Until that number exists, option 3 is a
number with no source in the data — CHENG's rule that killed `recent` trails.

**My recommendation is 1 + 2**: the current season shown only when it has enough
games to be worth printing, and last season's completed number shown always,
labelled. Then 3 replaces the guesswork about "enough" once measured.

> **⛔ SUPERSEDED by §0.** Kevin ruled option **1 alone**, with the threshold
> global rather than per-team. Option 2 is dead on a stronger argument than the
> one I made for it: last season is a real denominator attached to a roster that
> no longer exists, and a figure that looks rigorous while describing a different
> team is the failure mode DOCTRINE.md 9 names. Option 3 remains available later
> and is no longer needed to unblock anything — §0.2 measures the threshold
> directly instead of inferring it from a spread.

## 5. The freshness problem — the first surface that can go wrong untouched

Every other artifact here is about completed games and is true forever. **A
stale next-game card is actively wrong**, with nobody touching anything:

- the game is played and the card still advertises it;
- the season ends and the card advertises nothing, forever;
- the nightly fails and the card silently shows last week.

So the card **must state its own freshness**, the way the archive line already
does, and must have real states rather than an empty box:

| state | what it says |
|---|---|
| no games scheduled | *"No games scheduled. The 2026-27 season opens 8 October."* — and the date is READ, not typed |
| next game known | who, when (in the reader's timezone), where |
| game in progress | **we do not know this** — `state` is not `FINAL` and we ingest nothing until it is. The card must not imply live coverage |
| schedule not fetched recently | say which document is stale and how stale, exactly as `describe()` does for the archive |

**`gameType` must ride along.** A preseason fixture is a real scheduled game and
the archive deliberately excludes preseason from every number — so a card that
names a 22 September opponent beside regular-season measurements is mixing two
populations the whole pipeline keeps apart.

## 6. The tension Kevin's word "informative" creates, stated plainly

It was settled earlier that the card carries **no matchup and no second column**
— *nothing for the eye to difference, so the forecast reading has nowhere to
come from.*

**That rule and "informative" pull against each other**, and the pull is real: a
fan asking about Thursday wants to know something about the opponent, and a card
that names them without measuring them is a card that answers half the question.

The way through, and I would take it:

> **The opponent is a NAME and a LINK, never a column.** Their measurements
> exist — on their own team page, one click away. Curiosity is served; the
> juxtaposition that manufactures a forecast never appears on one screen.

The reader who wants the comparison can absolutely construct it. **The
difference is that they construct it, and we do not hand it to them** — which is
the same line the per-game sentence draws by putting the game's number and the
archive rate in separate elements so an edit cannot join them with a "so".

> **⛔ OVERTURNED by §0, ruling 3.** Kevin's read is better than mine and worth
> stating as the correction it is: I resolved the tension by refusing the half
> of the question the fan actually asked, and called that doctrine. A card that
> names an opponent and measures nothing about them is not a cautious card, it
> is an incomplete one — and the caution was doing no work, because **the
> forecast reading needs two teams and the card only ever had room for one.**
> The guard that survives is §0.1: **one column, and it is the opponent's.**

## 7. Plumbing, smallest version first

- **Keep what we are already given.** `classify()` already returns `unknown`;
  the nightly discards it. Publishing `schedule.json` costs a write, not a
  request.
- **Store per team**: the next fixture's `id`, `startTimeUTC`, `gameType`, home
  and away abbrevs, venue. Nothing derived, nothing scored.
- **The window must reach forward.** `dates()` is backwards-only; a week's worth
  of forward dates is what the payload already contains.
- **Never at render time.** Same rule as everywhere: the page reads a stored
  document, and nothing fetches from the league while a visitor watches.
- **A test that the card is empty in the offseason**, which today is not a
  synthesised fixture — it is what the endpoint actually returns.

## 8. What I want ruled

1. **Is §1 the right resolution** — the fixture as occasion rather than subject —
   or is any card headed "next game" read as a forecast no matter what is on it?
   **STILL OPEN, and now the only doctrinal question left.** §0 changed what the
   card contains without touching this: if the answer is no, the whole card goes.
2. ~~**October: 1 + 2, or hold the whole card until the spread is measured?**~~
   **RULED — §0, ruling 2.** Option 1, gated globally at 10+ games. The
   threshold is measured in §0.2 rather than inferred from a spread, so the
   blocking dependency named in §4 is gone.
3. ~~**Does the opponent-as-link (§6) actually hold?**~~ **OVERTURNED — §0,
   ruling 3.** It does not, and it was refusing the fan's actual question. The
   guard is now §0.1: one column, and it is the opponent's.
4. **Where does it live?** The team view is the retention surface and the obvious
   home. But `?team=` currently has no card at all above the game list, and this
   would be the first thing a fan sees there. **This got HARDER, not easier**:
   §0.1 shows the single-column guard is defeated by layout alone if the reader's
   own team's season numbers sit anywhere near the card. Placement is now part of
   the honesty argument, not a styling choice.
5. ~~**Preseason: show or hide?**~~ **MOOT — §0.3.** The global gate is never met
   in September, so no card exists while preseason is the next fixture. The rule
   nobody has to write is the best kind.
6. **NEW — is `W-L` or `W-L-OTL` the honest form?** See §0.4 q1. Doctrine is
   silent; legibility is not.

## 9. What this unblocks, and what it does not

**Nothing above can be built yet, and the reason is arithmetic, not design.**
`builders/measure.mjs` produces **archive-wide base rates**, not per-team season
aggregates. Of the five figures ruled in:

| figure | available today | what it needs |
|---|---|---|
| W-L(-OTL) | quoted score decides the winner correctly — §9.1 shows the league gives the shootout winner exactly +1 | a season+team grouping; the third number falls out of the same two markers §9.1 uses — a period past 3, or any `pt: "SO"` event |
| Corsi | `measureGame` already emits `attempts.{h,a}` | grouping only |
| save fraction | ⚠️ **not from `quoted` — see §9.1** | `goaltending.js`, which already computes it correctly |
| blocked | `mix` counts blocks per game with **both teams pooled** | a per-team split, read off corsi's own `counted` set |
| shots from slot | not emitted by `measure.mjs` | it already exists — `src/lib/layers/danger.js` is the slot rule the game page runs |

**The reducers are all already written** — `danger.js`, `blocked.js`,
`goaltending.js` sit beside the two `measure.mjs` imports today. So this is not
five new measurements; it is **one grouping pass and three imports**, under the
rule this file already lives by: *the reducers in `src/lib` are imported and
never restated*, so a per-team blocked count is read off corsi's `counted` set
and never recounted by event type.

**The one thing that is genuinely new is the season key.** Every number here is
scoped to a single season and never pooled across them, which is the standing
rule for base rates — and ruling 1 makes it load-bearing rather than tidy.

### 9.1 ⚠️ The save fraction cannot be computed from the quoted boxscore

The obvious arithmetic is *shots faced = the opponent's SOG, goals allowed = the
opponent's score*. Both halves are in `quoted`, both are the league's own
figures, and **the result would be wrong on two whole classes of game.**

First, what was checked and is fine. `extract.py:198` copies `sog` straight from
the boxscore, and `extract.py:370–377` **refuses to publish a game unless our own
`shot-on-goal` + `goal` events reproduce that number exactly**, shootout removed.
So the denominator is unambiguous: **quoted SOG includes goals**, verified per
game against an independent witness, not inherited from memory.

The numerator is where it breaks, and **both failures were measured against
published extracts rather than argued**:

**1. The shootout.** The boxscore *score* carries the shootout decider while the
boxscore *SOG* excludes every shootout attempt — which is exactly why
`extract.py` strips them before comparing. Three shootout games, fetched:

| game | quoted score | goal events, shootout removed | shootout goals in the feed |
|---|---|---|---|
| `2023020005` MTL @ TOR | 6–5 | 5–5 | 1 |
| `2023020013` STL @ DAL | 2–1 | 1–1 | **3** |
| `2023020017` ARI @ NJD | 3–4 | 3–3 | 2 |

**The league adds exactly ONE goal to the winner, however many the shootout
actually produced.** STL @ DAL is the one that settles it: the feed holds three
shootout goals and the score moves 1–1 → 2–1. So the naive subtraction charges
the losing goalie for a phantom goal on a shot the denominator never contained,
**in every shootout loss** — and it is not even self-consistent with our own
event stream, which is a different wrong number again.

**2. The empty net.** A goal into an empty net is in the score and is not a save
opportunity; the league excludes it because there was no goalie to make the
save. Not rare — **25 two-goal games sampled from 2023-24 hold 15 such goals,
across 14 of the 25 (56%)**. Those are the close games a fan looks up.

Both are already visible in the extract: an empty-net goal simply carries no
`goalie`, and a shootout event carries `pt: "SO"`.

**`goaltending.js` already gets both right, and did before this card existed:**
its `faced` test is `(shot-on-goal || goal) && e.goalie`, so a goal with no
goalie recorded is never a shot faced, and `inShootout(e)` excludes the shootout
ahead of any type test — with the comment saying why, that a shootout attempt
genuinely *is* a shot a goalie faced and is still not what the league counts.

**This is the whole argument of `measure.mjs`'s own header, arriving on schedule.**
The tempting version — two fields, one subtraction, no import — is a second
implementation of a domain rule, and it would have been wrong in exactly the way
a second implementation is always wrong: right on the common case, silently
wrong on the cases the real reducer was written to handle. It would also have
gone green, because nothing in the suite compares a season save fraction to
anything.
