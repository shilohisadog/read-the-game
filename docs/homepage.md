# The homepage

*Written against the live page and the live catalog, not against intentions.
Sections 3.7-3.9 are MEASURED and their numbers are live; section 3 is the design,
rewritten after Kevin named the primary use case and it was not the one I had been
designing for.*

The site holds three seasons. The homepage still describes a single game, and one
of its honesty claims is now false. This is the audit and what we are building.

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

## 2. The argument I lost, and it changes the whole page

I argued in the builder's own comments that the archive must not be the hero:

> Front-loading 1,463 games on somebody who cannot read one of them yet is a
> reference product wearing a teaching product's clothes.

**Kevin, 2026-08-11:** *"I think the normal use case will be for a team fan to come
to the site and load their team's last game and watch it."*

He is right, and my argument was answering a question nobody asked. It defended
against **a search box**, which is indeed a bad welcome — a novice does not know
which game they want. But the team path is not a search box and not a featured
game. **It is a fan who knows exactly what they want, blocked by a page that makes
them look for it.**

The evidence was already on the table and I did not join it up: *learner =
acquisition, team fan = retention.* A featured game serves a first-time visitor
once. A team fan comes back eighty-two times a season. And since the shareable
unit is a game, a stranger lands on `game.html` — so the homepage hero was being
designed for people who type the domain in cold, which is the smallest audience we
have.

**The design target is now a number: two clicks from cold to watching your team's
last game.**

Also settled (Kevin): **clean and uncluttered, at google.com scale.** Above the
fold is one object and one link. Everything else earns its way below, or goes.

Keeping regardless: the freshness line fetched live from `index.json`, the limits
block (rewritten), the attribution and no-marks statement, the hash-pinned CSP,
and the builder-is-the-only-source discipline.

## 3. Proposed structure

### 3.1 Above the fold: one object and one link

```
                      Read the Game
        Watch a hockey game and see what the numbers are made of

   ANA  ARI  BOS  BUF  CAR  CBJ  CGY  CHI  COL  DAL  DET
   EDM  FLA  LAK  MIN  MTL  NJD  NSH  NYI  NYR  OTT  PHI
   PIT  SEA  SJS  STL  TBL  TOR  UTA  VAN  VGK  WPG  WSH

                 New to hockey? Start here →
```

That is the whole of it. The grid is **one object**, not thirty-three — uniform
chips in team colours, scannable, no typing. A type-ahead box would be closer to
google.com literally and worse for the use case: a fan wants one click, not a
click and a word.

**THIRTY-THREE, NOT THIRTY-TWO.** Arizona relocated to Utah inside our window —
ARI played 82 games in 2023-24 and none after; UTA begins in 2024-25. A
hardcoded 32-club list would have been wrong on the first day. **The set is read
from the catalog**, and a test asserts every team in it has a colour, so the next
relocation or expansion fails loudly instead of rendering a blank chip.

ARI's team view says what happened, because that is a fact and it costs no page
furniture: *"relocated to Utah after 2023-24; 82 games in this archive."*

### 3.2 What a team click does

`/?team=BUF` — the same page, filtered. No new page, no new build target, and the
URL is shareable and stateless.

The team view is that team's games, newest first, with the most recent one
presented as the thing you press play on. **Two clicks from cold to watching.**
Older games are right underneath, so browsing is not traded away for speed.

Refused games appear in the list, greyed, with the reason. Inside the scope, the
calendar is still not a map of our successes.

Optional and Kevin's call: remember the choice in `localStorage` so a return visit
lands on your team. Still holds-nothing — *we* hold nothing; the browser does.

### 3.3 "New to hockey? Start here"

One link, not a hero. It opens the featured game — the archive's sharpest example
by the rule in §3.7b — with the sentence that makes it a lesson rather than a
curiosity.

This is a demotion and it is deliberate. Three rewrites of the featured rule went
into a slot that serves one visitor once. The measurement was worth building for a
different reason (§3.4); its placement on this page was not.

### 3.4 Where the measurement actually pays off

Not on the homepage. **On the game page, for the returning fan:**

> Buffalo controlled play while the score was level — 12 more attempts — and lost.

That is the sentence a team fan comes back for, and it costs nothing new: the
browser already loads the extract and imports the same `tied.js` the pipeline
does, so it is computed client-side with no extra document and no extra fetch.
That is the payoff of not writing a Python copy (docs/architecture.md §2).

**It must be able to say nothing happened.** A fan will load plenty of ordinary
4–1 games, and the page has to admit that rather than manufacture a story.

### 3.5 Below the fold, in this order

Everything here is content Kevin wants kept — moved, not deleted, and quieter.

1. **The thesis, in three numbers** (§3.8). The best single thing we can say.
2. **What this does and does not claim** — the limits block, rewritten true.
3. **The archive** — what we hold, and what we cannot show, with the reason.
4. **Attribution and no-marks.**
5. **The workshop** — the five prototypes and the figure bench, labelled as
   explorations rather than front doors.

### 3.6 The catalog fetch

Take the whole file: **453 KB raw, 55 KB gzipped, brotli on the wire** — measured.
The team grid, the team view and the archive counts all read it, so a second
smaller document would buy nothing and cost drift. One document (CHENG).

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

## 3.7b Tied is not even, and overtime is tied by definition — RUN

CHENG's second finding, and both confounds are real:

**Overtime is always tied**, so every OT attempt lands in the tied bucket — and
regular-season OT is **3-on-3**, where attempt rates are far above 5-on-5. Playoff
OT is 5-on-5, so the bias is *uneven across `gameType`*, and the hero rule spans
both. **Power plays while tied are not control** — an extra skater is not
dictating play.

**His claim that the fix already shipped is verified**: `evenOnly` is a parameter
on the existing Corsi reducer (`src/lib/layers/corsi.js:30`) over
`whyNotEven`/`KNOWN_SITUATIONS` in `src/lib/strength.js`. No new code — the
measurement below mirrors those eight codes and that rule exactly rather than
approximating it.

He predicted the rankings would move. **They moved:**

| game | was (tied, any strength, OT in) | now (even strength, regulation) |
|---|---|---|
| **TOR 2–1 NJD**, sog 17–39 | +36 → *2nd* | **+29 → 1st** |
| EDM 5–4 FLA, Cup Final, sog 35–40 | +39 → *1st* | **+28 → 2nd** |
| EDM 3–5 OTT, sog 36–16 | +31 → *3rd* | **+19 → 10th** |
| BOS 4–3 FLA, sog 18–43 | +28 → *5th* | **+17 → out of the top 12** |
| **BOS 3–4 SEA**, sog 32–27 | +8 → *invisible* | **+22 → 6th** |

The last row is the one that matters. A game the previous rule could not see rises
to sixth once special teams come out — meaning the earlier ranking was partly
measuring *who drew penalties*. The Cup Final survives at second, which is the
outcome to be most suspicious of, since it is the one I wanted.

**The new first place is a better hero than either candidate before it:** New
Jersey were outshot-for 39–17 on the league's own count *and* controlled play by
+29 attempts at even strength while the score was tied — and lost 1–2. The two
measures agree, so the game is not a score-effects artifact, and the scoreboard
still disagrees with both. That is the entire thesis in one row.

## 3.7c The score-sequence witness — CHENG's find, with one correction and a mutation

He is right that the tied-state number depends on something `validate()` does not
check. `validate()` asserts **goal events == final score**: a total. The bucketing
depends on the **order and timing** of goals, and two goals swapped leave the total
correct while moving every tied/leading/trailing boundary.

**Where the witness lives — and the answer is NOT the extract.** `details.awayScore`
/ `details.homeScore` ride on every goal in the raw play-by-play; `extract.py` does
not carry them. My first answer was that we should add them and re-derive.

**Kevin: why would something called "extract" carry a game score?** It should not,
and it does not have to. `validate(rich, pbp, shifts, box)` **is handed the raw
play-by-play**, and its own docstring says the checks run *"against the raw feed and
the boxscore — never against our own extract."* The witness reads the league's
running score straight from `pbp`. **No schema change and no re-derive for the
check** — my §3.7c cost estimate was wrong.

And the metric does not need the field either: `measure.mjs` reconstructs score
state from the extract's goal events, which is precisely the derivation the witness
certifies against the league, per goal, in order. Carrying the number as well would
store a fact we have *proven* we can rebuild, and put two sources for it inside one
document.

**The principle this settles, and it is worth stating once:** *the extract carries
what it cannot reconstruct* — events as the feed records them, plus quotes from
**other** documents. `quoted` belongs for exactly that reason: it is the
**boxscore's** number, carried so the catalog builder and the validator cannot reach
for the boxscore independently and drift over which field. A running score is this
document's own arithmetic.

*Honest caveat: the extract already breaks this mildly. `gshots` and `goalies` are
projections of `events`, built in the same pass from the same source. Weaker than
carrying a second number, pre-dating the principle, and not worth churn now — but
they are the same shape and should not grow.*

**Run against 30 raw feeds: 30 agree, 0 disagree.** Which on its own proves
nothing — a check that has never failed may be incapable of failing, which is this
project's most-repeated lesson. **So I mutated it.** Swapping two adjacent goals
scored by *different* teams (same-team swaps are a no-op, and using one would have
made the mutation vacuous — the same trap one level up):

```
original : final 1-8   per-goal mismatches 0
mutated  : final 1-8   per-goal mismatches 1

FINAL TOTAL unchanged by the swap: True   <- the check we have today PASSES
per-goal witness fires:            True   <- the proposed check CATCHES it
```

The witness discriminates. It goes in as a `validate()` check, gating the
tied-state number before it reaches a catalog row.

**And it changes the provenance story in §3.7a.** The attempt *count* still has no
independent witness. The **score state it is bucketed by** now does — per goal, in
order, from the league. That is a real narrowing of the asymmetry and the page can
say so.

## 3.8 The base rates — MEASURED, over the whole archive

Superseded twice. CHENG proposed publishing a reference class and gave **41%**,
with no query behind it. I computed **45.8%** from the catalog, then **60.3%** for
attempts from a 140-game sample — and refused to publish that one because it was a
sample. That refusal was right: the real figure is **54.5%**, inflated by a third
in my sample.

Run by `builders/measure.mjs` over all 4,119 in-scope published games:

| the team with more … | lost | of |
|---|---|---|
| shots on goal | **45.8%** | 3,957 |
| shot attempts | **54.5%** | 4,029 |
| **control while the score was level** | **39.6%** | 3,855 |

**The third row is why the narrowing exists, and it is now measured rather than
argued.** Counted raw, the attempts leader *loses* more often than not — score
effects swamp the signal. Narrowed to even strength, tied score, regulation, the
leader **wins 60.4%**. Three rounds of review argued that from first principles;
this is the evidence.

It also gives the page a teaching sequence instead of a hedge: **count it the
obvious way and you learn nothing; count it properly and the pattern appears.**
That is a far better answer to "shot counts are meaningless" than 54/46 was, and
it is the thesis stated more precisely than the homepage has ever managed.

**Publication rules, unchanged and now satisfiable.** Every rate ships with its
numerator, denominator and population — *"1,811 of 3,957 games where one team had
more shots on goal, NHL regular season and playoffs"*. `measures.json` carries all
three, and `derive.yml` fails if any rate is published without its `n` or its
population.

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

**The design target is a number, so it is a test:** from a cold load, choosing a
team and pressing play is two clicks. A page that drifts to three has lost the
thing it was rebuilt for.

- **the team set comes from the catalog, never a typed list** — 33 today, because
  Arizona relocated to Utah inside our window. Every team present must have a
  colour, so the next relocation fails loudly instead of rendering a blank chip
- `?team=BUF` filters to Buffalo and nothing else, and an unknown team says so
  rather than showing an empty page

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
- **the per-goal score witness, with its mutation.** `validate()` gains: the score
  derived from the event sequence equals the league's `awayScore`/`homeScore` at
  *every* goal, in order. The test that matters is the mutation — swap two adjacent
  goals scored by **different** teams, assert the final-total check still passes
  and the per-goal check fires. A same-team swap is a no-op and would make the
  mutation vacuous
- **the featured rule excludes overtime and non-even-strength attempts**, pinned
  against a fixture containing a 3-on-3 OT and a tied-score power play, so a
  regression that silently re-admits either is caught by a changed ranking rather
  than by a changed count
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
