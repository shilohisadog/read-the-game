# The homepage

*A plan, for review. Nothing here is built. Written against the live page and the
live catalog, not against intentions.*

The site holds three seasons. The homepage still describes a single game, and one
of its honesty claims is now false. This is the audit and what I propose to do.

---

## 1. What the page says today, and what is wrong with it

The current page is well-written and was correct when it shipped. Four things
have gone stale, and one of them matters more than the rest.

**A false claim, in the honesty block.** Under *"What this does and does not
claim"*, the first item reads:

> **One game, not a season.** Everything here is MIN at BUF, 10 November 2023.

That is no longer true. The site holds 4,553 games across three seasons. A stale
claim anywhere is a bug; a stale claim inside the section whose whole job is
stating limits is the failure mode Doctrine §9 is about — **selective honesty is
worse than none, because it looks rigorous.** This one has to go first.

**The archive is filed under the wrong heading.** `game.html` — every game we
hold — is the first item beneath a heading that reads *"Other ways to look at the
same game."* It is not a view of the same game. It is the product.

**Developer copy on a novice's landing page.** The archive blurb says *"most
recent by default, or add `?game=` and an id."* Nobody we are building for
appends a query parameter.

**The figure bench is on the front page**, labelled *"a development tool."*
Honest, and it spends prime shelf space telling a novice what not to click.

**One structural note.** The hero game is typed into `build_index.py` as a
literal. That is *correct today* — `read-the-game.html` genuinely has that game
compiled into it — but it is the same shape as the hard-coded date we just pulled
out of `game.html`. The moment the hero becomes "a game from the archive," it has
to be read from the catalog, never typed.

## 2. The thing I do NOT want to change

I argued in the builder's own comments that the archive should not be the hero:

> Front-loading 1,463 games on somebody who cannot read one of them yet is a
> reference product wearing a teaching product's clothes.

That is still right, and it is the main constraint on this rework. **A search box
is not a welcome.** A novice does not know which game they want; they do not know
what a Corsi is; they have no reason to type "Buffalo." The finder is the second
thing on the page, not the first.

Also keeping: the freshness line fetched live from `index.json`, the limits block
(rewritten), the attribution and no-marks statement, the hash-pinned CSP, and the
builder-is-the-only-source discipline.

## 3. Proposed structure

### 3.1 Two heroes, not one

The page opens with two games, always, in this order:

**"Start here" — the archive's sharpest lesson.** By a rule stated on the page:
**the biggest shot-attempt advantage accrued while the score was tied, in a loss.**

*This rule replaced a simpler one — "the biggest shot advantage that still lost" —
after CHENG challenged it and the challenge was run. §3.7 has the measurement and
§3.7a has the units, which is where the first version went wrong. The superseded
rule returned FLA outshooting TBL 50–16 and losing.*

**"The most recent game we can show."** Which in August is the Cup final and in
January is last night. This is what makes the page feel alive in season without a
conditional in the code. *"Can show," not "hold"* — the newest game we hold may be
refused, and given the preseason failure rate it will be; a slot that falls back is
a slot with a branch in it, which is what the two-slot design exists to avoid
(CHENG).

Two fixed slots, both always present, no branching. The seasonal-liveness problem
gets solved by structure rather than by an `if`.

### 3.2 Is the featured paradox on-doctrine?

This is the decision I most want attacked, because it is "three things to notice"
wearing a hat.

**The case that it is honest.** It is a sort, not a model. Both inputs are the
league's own quoted numbers, already in every catalog row (`as/hs`, `ash/hsh`).
The rule is one line, it is stated on the page, it is applied identically to all
4,192 in-scope games, and the ranked list is linkable so a visitor can check that
we did not hand-pick. Nothing is estimated. Doctrine §8 does not bite — 50–16 is
a count, not a rate.

**The case that it is not.** We are still choosing *which* dimension of "unusual"
to lead with, and shot differential is one of many. A visitor cannot tell from the
page whether we tried nine rules and shipped the flattering one.

**How that resolves, per the position already taken:** the dimension is chosen
**once, in public**, rather than 4,417 times invisibly. One rule, named on the
page, in the shipped source. That is the honest form of the thing, and it is why
this is a *stated sort* rather than an "interestingness score."

**Constraint that falls out:** the rule must be able to return a boring answer,
and the page must print it when it does. If the sharpest paradox in the archive
were +3 shots, the page has to say +3.

### 3.3 "What you'll see" — three ideas, not seven features

Between the heroes and the finder, three plain-language cards. Not a feature list
— the three *ideas* the layers exist to teach:

- **Shots are not goals.** Who was generating chances, and why the scoreboard
  often disagrees.
- **Not every shot is a chance.** Where it was taken from, by a geometric rule you
  can check — never an expected-goals number.
- **Sometimes a goalie just decides it.** Save by save, as it happens.

This is the welcome. It is also the only part of the page that speaks to somebody
who does not yet know they want any of this.

### 3.4 The finder

Below the fold, and it is three features that are one array in memory:

- **search** — team or date
- **filter by team** — the retention mechanic, and nearly free
- **the season calendar** — as a *coverage map*, which is the part nobody else's
  schedule page can do, because nobody else has anything to admit

Refused games appear, greyed, with the reason. September shows 320 preseason
games we hold, 33 of which we cannot show.

**One real cost to decide.** The catalog is **453 KB raw, 55 KB gzipped**, served
brotli — measured, not estimated. That is a fine number for a data file and a
noticeable one for a landing page. Options, in the order I would take them:

1. **Fetch it once, lazily, when the finder is first opened.** The two heroes need
   only a handful of rows, so the top of the page can be served from a tiny
   `featured.json` written by `derive`. Costs a second document that can disagree
   with the first — which CHENG rightly killed for sharding.
2. **Fetch the whole catalog on load** and take the ~45 KB. Simple, one document,
   no disagreement possible.

I lean to **(2)**, on the grounds that a second document is the more expensive
mistake and we have paid for it twice. Worth arguing.

**A detail the filter has to handle:** the catalog contains **52 team codes**, not
32 — the Olympics and the 4 Nations Face-Off brought national teams. `SVK` is a
real row. The filter must not present them as NHL clubs, and must not hide them
either.

### 3.5 The limits, rewritten to be true

- ~~One game, not a season~~ → **Three seasons, and we say what we could not
  read.** 4,553 games held, 4,417 shown, 136 refused with the gate that stopped
  them. Preseason fails six times as often as the regular season and we do not yet
  know why.
- **A replay, not live coverage.** Unchanged and still true.
- **Nothing is modelled or invented.** Unchanged.
- **The counting is shown, including what it drops.** Reword off "all 320 events
  in the game," which is a fact about one game.

### 3.6 The workshop

The five prototypes and the figure bench move to a labelled section at the bottom.
Kept — each answers a question the main app does not — but they stop competing
with the front door.

---

## 3.7 CHENG's score-effects challenge, RUN — and what it actually showed

He argued the featured rule selects for score effects: a team that fell behind
spends the game chasing, so the biggest shot advantages in losses are consequences
of losing rather than evidence of control. He proposed the discriminating test —
split attempts by score state — and he was right that it was computable from
extracts we already hold. **So I ran it, with a control**, because "most of the
advantage came while trailing" means nothing until you know how much of a *normal*
shot advantage comes while trailing.

185 extracts: the top 30 by the proposed rule, the top 30 among one-goal losses,
140 random in-scope games, and the reference game. Corsi definition, shootout
excluded, `own` is the shooter on all four attempt types.

**Attempt** differential for the team that outshot and lost, pooled. The pools were
*selected* on shots on goal and *measured* in attempts — see §3.7a, which is the
correction Kevin caught:

| pool | while tied | while trailing | per game, tied |
|---|---|---|---|
| **control — 81 random outshooting losers** | +192 | +2,899 | **+2.4** |
| top 30 by raw shot advantage | +186 | +1,788 | **+6.2** |
| top 30 among one-goal losses | +308 | +1,542 | **+10.3** |
| MIN at BUF (the reference game) | +14 | +33 | **+14** |

**The mechanism is real and the discriminator does not discriminate.** Score
effects dominate *everywhere* — in the control they account for more of the
advantage (trailing +2,899 against a total of +1,379) than in the extreme games.
That is close to tautological: a team that outshot and lost was, by definition,
behind for some of it. A trailing-share test would have *cleared* the games CHENG
wanted it to catch.

**What separates them is the absolute differential while tied**, and on that
measure his instinct about the reference game is vindicated. MIN's +14 while tied
is larger than the *average* of either extreme pool, and MIN@BUF ranks 26th of 185
in a sample deliberately stuffed with extremes.

**So: option 2, and it is now measurable rather than aspirational.** Rank on
attempt differential accrued while the score was tied — the quantity that actually
means "controlled play." What it returns from the sample:

| | tied (attempts) | boxscore line |
|---|---|---|
| **FLA controlled the Cup Final at +39 while tied and lost** | +39 | EDM 5–4 FLA, sog 35–40, 12 Jun 2025 |
| NJD +36 while tied, lost | +36 | TOR 2–1 NJD, sog 17–39, 10 Dec 2024 |
| EDM +31 while tied, lost | +31 | EDM 3–5 OTT, sog 36–16, 24 Mar 2024 |

Compare the shot lines. The superseded rule returned 50–16 and 57–24 — games
nobody needs a site to interpret. This returns **a Stanley Cup Final that was 35–40
on the scoreboard's own measure**, where the counts are close and the story is
genuinely hidden. That is the product.

**Cost, stated:** this is a derive-stage computation, because derive is the only
stage that has read every event of every game. One integer per catalog row. It is
counting real events against a real running score — no model, same class as the
Corsi count the app already shows.

**Honest limits of this analysis:** the ranking sample is 185 games and biased
toward extremes by construction, so "26th of 185" understates where the reference
game would rank in a random sample. The percentage-of-total figures I first
computed were unstable (leading-state differential is negative, so shares exceed
100%); the absolute numbers above are the meaningful ones. The full ranking needs
the derive pass.

## 3.7a WHICH SHOT COUNT — the question that changed the answer

**Kevin's question: are these shot attempts or shots on goal? They were both, and
I had not said so.** The candidates in §3.7 were *selected* on shots on goal — the
catalog's `ash`/`hsh`, quoted from the boxscore — and then *measured* in shot
attempts (Corsi: goals + shots on goal + missed + blocked). Two different
quantities, presented in one table without a label. The gap is not small:

| | SOG (quoted) | attempts (our count) |
|---|---|---|
| EDM 5–4 FLA, Cup Final | 35 – **40** | 67 – **89** |
| TBL 5–3 FLA | 16 – **50** | 37 – **80** |
| MIN 2–3 BUF | **35** – 25 | **80** – 55 |

Checking it produced the most important number in this document. On the unbiased
140-game control:

| measure | the team with more … LOST |
|---|---|
| shots on goal | 48.2% *(full catalog: **45.8%**)* |
| **shot attempts** | **60.3%** — 82 of 136, ±4.2% |

**The team with more shot attempts loses more often than it wins.** Not noise and
not a bug: score effects at full strength. Falling behind is what makes you attempt
more, and raw attempt totals absorb that so completely that they invert. This is
the ground CHENG was standing on, and it is a stronger effect than either of us
said.

Three things follow.

**The tied-score restriction is load-bearing, not a refinement.** Raw attempt
differential is *anti*-predictive within a game. Restricting to tied score is the
only thing that makes the number mean "controlled play" rather than "was behind."

**The two measures name a different dominant team in 28 of 136 games — 21%.** So
"which shot count" is not a detail; it changes the answer in one game in five, and
every surface has to say which one it is showing.

**It is probably the best single lesson on the site:** *the team with more shot
attempts loses about 60% of the time, because falling behind is what makes you
shoot — which is why we count while the score is tied.* Honest, counterintuitive,
explains the site's own method, and it inoculates against the "shot counts are
meaningless" reading in a way the bare 54/46 does not.

**Decision: rank on tied-state ATTEMPTS, display BOTH lines, label which is which.**
Attempts is the correct measure of control and is what the Corsi layer already
shows. SOG stays visible because it is the league's number and the one a reader can
verify in any box score. **State the asymmetry on the page:** SOG is cross-checked
against the boxscore by `validate()`; our attempt count has no independent witness.

## 3.8 The base rate — CHENG's best suggestion, and his number was wrong

He proposed putting the reference class on the page and gave 41%. Computed over
the live catalog, in-scope, viewable, decided games:

**The team with more shots on goal lost 1,811 of 3,957 — 45.8%.** (2,146 won,
54.2%; 162 games had equal shots.)

He is right that this belongs on the page and right that §4's "defer base rates"
was wrong for this specific case — a hero that asserts a game was unusual *is* a
base-rate claim. **But 54/46 needs careful handling**, because a novice reading
"barely better than a coin flip" draws exactly the conclusion CHENG was trying to
prevent: that shot counts are meaningless. The honest frame is that a shot count
**describes** what happened rather than **predicts** who won — which is the site's
thesis, not a hedge against it. The attempts figure in §3.7a does that job far
better and should be the headline once it can be stated over the full population.

**What may be published, and when.** The SOG rate is computed over all 3,957
in-scope decided games and can go on the page now. **The 60.3% attempts rate is
from 140 games and may NOT** — publishing a sampled number as a site-wide base rate
is precisely what Doctrine §8 exists to stop, and it would be this project
committing its own named failure mode in the paragraph where it teaches base rates.
It goes up after the derive pass computes it over all 4,119.

## 3.9 Scope: NHL regular season and playoffs only, on every user-visible surface

**Settled with Kevin, 2026-08-11.** Preseason, the Olympics, the 4 Nations
Face-Off and the All-Star game are archived, derived and kept — and not shown.
This is not a new rule; it is the existing `gameType` 2-and-3 rule, already
governing every calculation, applied consistently to the surfaces too.

The reason is not tidiness. A base rate over preseason split squads, an All-Star
game and national teams under different roster rules is not a claim about NHL
hockey — it is an average over four different competitions. The moment the site
started making cross-game claims, scope stopped being cosmetic.

Four conditions:

1. **State the scope, once, in the limits block.** "Regular season and playoffs,
   2023–24 through 2025–26." An unstated scope *is* concealment; a stated one is
   not. This is the whole difference and it lives in the limits block.
2. **Nothing changes in ingest, derive or storage.** A view filter, reversible in
   one line — which is the entire point of extracts being a cache.
3. **The refused count must not quietly improve.** In-scope, we hold 4,192 and
   show 4,119: **73 refused, not 136.** Preseason fails six times as often, so
   cutting it makes the number drop for reasons that are not progress. The greyed
   rows and their reasons stay, inside the scope.
4. **`game.html` and the deploy gate pick from the catalog too.** Scope the view
   without scoping them and they diverge — the landing game and the gate's
   expectation would come from a different population than the finder shows.

Consequence, and it is an improvement: the calendar becomes a **season** calendar.
October to June is the whole story and September is legitimately empty. It also
dissolves the 52-code problem — 32 clubs, no national teams, no explanatory
grouping to design.

## 4. What this does not include

- No "three things to notice in this game" on the game page. That needs base
  rates, and base rates are the next build, not this one.
- No accounts, no saved teams, no email. Nothing that breaks holds-nothing.
- No change to `game.html` or the renderer.

## 5. What gets tested

The page makes checkable claims, so the tests are the same shape as
`test/index.test.js` today:

- every link names a file that exists (existing gate, extended)
- **no number or team on the page is typed** — the heroes must come from the
  catalog, asserted the way `shell.test.js` asserts it for `game.html`
- the featured rule is applied to in-scope games only (`gameType` 2 and 3)
- **the rule can return a boring answer and the page states it** — a mutation
  test with a fixture whose sharpest paradox is +1
- **and the other end, which CHENG is right that the first test misses**: a
  spectacular answer that is unrepresentative. The tied-state split is the guard,
  so the test is that the featured game's advantage is not overwhelmingly accrued
  while trailing — pinned against a fixture built from a known chasing game
- the tied-state count reconciles: `tied + leading + trailing` equals the game's
  total attempt differential, for every game
- **no surface shows a shot number without saying which one it is.** Attempts and
  shots on goal name a different dominant team in 21% of games, and the first
  version of this plan mixed them in a single table. A test that greps the built
  page for a bare "shots" next to a count is cheap and pins the lesson
- **an attempt count is never presented as cross-checked.** SOG is quoted and
  validated against the boxscore; attempts are ours and have no independent
  witness. The page must not blur the two provenances
- **the published base rate is computed over the full in-scope population**, never
  a sample — asserted by counting the rows the figure was derived from
- **no out-of-scope game reaches a user-visible surface** — not the finder, not
  the featured rule, not `game.html`'s landing pick, not the deploy gate — and the
  scope is stated in the limits block
- the limits block contains no count that belongs to a single game
- the finder lists refused games with a reason
- CSP still hash-pins, `connect-src` still names only the data origin
