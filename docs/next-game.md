# The next game — a card about the future, on a site that refuses to forecast

**Kevin, 2026-08-17:**

> *"One thing I haven't mentioned in a while that we need to think through is a
> team's next game and figure out how to present that in an informative manner,
> while still holding true to our doctrine."*

He has named the whole difficulty in one sentence. **Every other surface on this
site describes completed events**, and is therefore true forever. A next-game
card is the first thing here that is *about* something that has not happened.

---

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
2. **October: 1 + 2, or hold the whole card until the spread is measured?**
   Shipping a card that says "too few games to say" for its first three weeks is
   defensible; it is also a poor first impression on the surface built for
   retention.
3. **Does the opponent-as-link (§6) actually hold**, or is naming an opponent
   beside your team's numbers already the juxtaposition, one click of separation
   notwithstanding?
4. **Where does it live?** The team view is the retention surface and the obvious
   home. But `?team=` currently has no card at all above the game list, and this
   would be the first thing a fan sees there.
5. **Preseason: show or hide?** It is a real game a fan may attend, and every
   number we hold deliberately excludes it. Naming it while measuring nothing may
   be the only honest option.
