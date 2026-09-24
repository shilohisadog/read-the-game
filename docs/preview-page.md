# The preview page — a shareable URL for a game nobody has played

**Written 2026-09-22 as a plan for review; ✅ §3, §4 AND §11 ARE BUILT AND LIVE.**
The page, its data and the doors shipped 2026-09-23, the edge middleware that
gives a shared link a per-game unfurl the same day, and the door from every figure
to its derivation (§11) that evening. It surfaces the card
`docs/preview-and-corsi.md` §11–§12 settled, and the middleware is the first thing
this project runs **server-side** (at the edge, and only over `<head>`).

**WHAT PROMPTED IT, for a reader arriving cold.** This repo builds an NHL replay
site for a novice. `docs/preview-and-corsi.md` settled WHAT a pre-game card says:
three **club rows** that describe the two clubs (5-on-5 CF% while the score was
level, defencemen shooting, shots from the slot) and three **league rows** that
teach what is normal (power play, penalties, offside), because those never settle
within a season. `docs/front-door-tonight.md` shipped the front door's list of
tonight's games — deliberately as TEXT, because a future game had no page. This
is that page. Kevin, 2026-09-22: *"I want the preview page to be shareable on
social media … so I can copy/paste the URL into X"*, and *"they need to ship
together"* — page and unfurl, within days, in time for preseason.

---

## 1. Ruled before this was written (Kevin, 2026-09-22)

1. **Preseason shows no club figures.** Our computed numbers exclude preseason
   (`inScope`), so `teams.json` holds 2023, 2024 and 2025 and gains a 2026 season
   only on 29 September. Until then every club row reads *no games yet*, which is
   the silence ruled in `preview-and-corsi.md` §11 and what a reader sees on
   opening night. ⛔ No borrowing last season's figures.
2. **Data: the weekly base plus the nightly tail, merged in the page** (§3.2).
3. **og:image: one site-wide image at launch.** Per-game images are a later step.
4. **The club page gets a *Next game* block** linking here, in this change.

## 2. What already exists, measured

| | |
|---|---|
| `teams.json` | published, 53 KB, per club per season: `games`, `attempts{for,against}`, `slot{count,n}`, `blocks`, `saves`, `record`, `goalies`. ⭐ **The slot row is already there.** Written by the WEEKLY derive (`cron: 47 15 * * 1`). |
| missing from it | defencemen's share; 5-on-5 CF% while the score was level; and any **through-date** — so a card could not say how current it is. |
| `recent.json` | rebuilt NIGHTLY, last 14 days, six fields per game (`id,date,awayAb,homeAb,score,attempts`). The figures the club rows need are already computed per game in `measureGame` and simply not published. |
| `schedule.json` | nightly, and since `front-door-tonight.md` carries the league's own `date` per fixture and reaches a week ahead. |
| the page shell | `builders/page.py::document(...)` — one definition of a complete page, with `title`, `description`, `url`, and a hash-pinned CSP stamped per page. A new page is a row in `build_index.py::main()`'s `pages` list. |
| the deploy | `wrangler pages deploy src` on push, with a candidate preview first and ⛔ **a gate that fetches the live site back and diffs it against the repo**. |
| social | every page carries `og:title`/`og:description`; **no page has an `og:image`**, so links unfurl as small text cards. No `functions/` directory exists. |

## 3. The page

### 3.1 One URL per game, three states, and it never expires

`https://readthegame.co/preview.html?game=2026010016`

| state | when | what it shows |
|---|---|---|
| **before** | the game has not started | the card, and the start in the reader's own clock |
| **under way** | started, not published | the same card, marked *under way* — we hold nothing until the nightly runs |
| **played** | the game is in the catalog | the same card **plus the result and a replay door** |

⭐ **The third state is why this is a query page rather than a page per fixture.**
A link posted at 6pm should still be worth clicking next week; a file built for
tonight's eight games would be a dead URL by Thursday, and pre-building every game
in the archive is 4,575 pages.

### 3.2 The card, and where its numbers come from

**League rows, once, above both clubs** (`preview-and-corsi.md` §12: a league
figure inside a club's column reads as a club figure). Constants from the
three-season measurement, carried in the page like every other archive figure.

**Club rows, both clubs, current season, each with its progress count** — *12 of
35 games · still forming*, the counts from §11.2's chronological estimate (CF%
level 35, defencemen 23, slot 37).

⭐ **CURRENT TO LAST NIGHT, FROM TWO DOCUMENTS THE PAGE ALREADY FETCHES.**
`teams.json` is weekly, which in season is up to 7 days and ~3 games stale on a
card whose honesty device is a game count. So:

- `teams.json` gains a **`through`** date (the newest game in it) and the two
  missing per-club fields;
- `recent.json` gains, per game, the three club-row numerators and denominators
  `measureGame` already computes;
- the page **adds the games dated after `through`**, which is a merge with no
  double-count risk because the dates decide it, not a set of ids.

⛔ **NEITHER DOCUMENT GAINS A FIELD WITH NO READER** (D10). Both grow because this
surface reads them, which is the rule pointed forwards.

### 3.3 Where it is reached from

- **The front door's tonight rows become doors** — `front-door-tonight.md` §4 Q1
  ruled text *"until the preview ships"*, and this is that.
- **The club page gets a *Next game* block**: the opponent, the start, and a link.
  It also gives a club page a reason to change from one day to the next.
- The page carries a link back to both clubs, so it is not a dead end.

## 4. The unfurl — the first server-side code

A static page's `<head>` is fixed at deploy, so every shared link would unfurl
identically. The pattern that fixes it is `functions/_middleware.js` with
**HTMLRewriter**, rewriting `<head>` as the static asset streams through the edge.

- ⛔ **IT TOUCHES ONE PATH.** The middleware returns the asset untouched for
  everything that is not `/preview.html` with a `game=`. That is not tidiness:
  the deploy's *fetch the live site and diff it against the repo* gate must keep
  passing byte-for-byte on every other page.
- ⛔ **AND THE GATE LEARNS ABOUT THIS PATH** rather than being weakened: the
  preview page is compared to the repo file **plus the tags the middleware
  declares it injects**, so an unexpected difference still fails.
- ⛔ **PASS THROUGH ON ANY ERROR.** A broken unfurl beats a 500. The middleware
  wraps its work and returns the untouched asset on any throw, and a test proves
  the throwing path still serves the page.
- **Data at the edge:** clubs and start time come from `schedule.json` (~11 KB,
  cached); a game already played is named from `catalog.json`. A fetch failure
  falls back to the generic tags.
- **What it injects:** `<title>`, `og:title`, `og:description`, `og:url`, and the
  site-wide `og:image`. Example: *"Buffalo at Pittsburgh — tonight 7:00 PM ·
  what to watch for"*.
- ⚠️ **`functions/` must sit at the project root, not inside the static root**,
  and we deploy `src`. The candidate-preview step is where that is proven before
  production sees it.
- ⛔ **IT IS NOT A REDUCER.** DOCTRINE keeps analysis out of the server; this
  computes nothing and renders no figure — it copies two club names and a time
  into a `<head>`. A number in this file would be a second implementation of a
  measurement, which is the line that must not move.

## 5. Tests, each with the mutation it must fail against

| claim | mutation |
|---|---|
| the card merges the nightly tail onto the weekly base | ignore `recent.json` and read `teams.json` alone |
| a game already in `teams.json` is not counted twice | merge on id presence rather than on `through` |
| a club with no current-season games says so | render `0 of 35 games` as a figure |
| every club row carries its progress count | print the figure without its n |
| league rows appear once, not per club | render them inside each club's column |
| the three states are chosen by the data | render `before` for a game in the catalog |
| the played state offers the replay | drop the door |
| ⛔ no club row is drawn from preseason games | feed it a preseason id and expect a figure |
| the middleware touches only the preview path | rewrite every path |
| the middleware passes the asset through when it throws | throw inside the handler |
| the injected tags name the two clubs | inject the generic title |
| the byte-diff gate still covers the preview page | inject a tag the gate was not told about |
| the page is a complete document (`document.test.js`) | emit the fragment without the shell |

⛔ **And the layout, which no unit test can see**: `tools/pixels.sh` at 1100 px and
at 568 × 320, in all three states, with a club that has no games yet and one deep
into a season.

## 6. Sequence, because the days are short

1. **Data** — `measureGame` and `teamSeasons` gain the two fields; `teams.json`
   gains `through`; `recent.json` gains its per-game figures. Publishable on its
   own, read by nobody yet.
2. **The page** — `preview.html`, the card, the three states, the club-page block
   and the front-door doors.
3. **The middleware** — the unfurl and the gate change.
4. **og:image** — one site-wide image, referenced by every page.

Steps 1 and 2 are the product; 3 is the one that can surprise us, because it is
new infrastructure touching the release gate. In that order, a late step 3 leaves
everything except the unfurl live and testable.

## 7. Open for CHENG

**S1.** The merge in §3.2 is arithmetic on published documents done **in the
page**. The alternative is a fourth document written nightly by the pipeline
(club totals to date), which costs a pipeline stage and removes arithmetic from
the browser. Which is the right place for a running total?

**S2.** The `through` date is a single date for the whole document, but clubs play
different numbers of games. A club idle for three days is current at a `through`
three days old, and a club that played last night needs the tail. Is one date
enough, or does each club need its own?

**S3.** Is the edge middleware the right first server-side code, given §4's
limits — one path, pass through on error, no figure computed? And should the gate
compare against *repo file + declared injections*, or should the middleware
instead inject a marker the gate can subtract?

**S4.** Preseason, in the reader's hands: for two weeks the card shows three
league rows and three *no games yet* rows. Is that a card worth publishing, or
does the preseason state want different copy — *"what to watch for in any game"* —
with the club rows appearing only once they have something to say?

## 8. ⛔ NO MEASURED VALUE IS TYPED — Kevin, 2026-09-23

*"There should never be hard coded values, anywhere … everything should derive
from ingested, calculated, or applicable variables."* He said it looking at this
build, and he was right about it: `CLUB_ROWS` carried `need: 35`, `23`, `37` —
three numbers I had measured by hand in a probe and typed into `src/lib/preview.js`.

**The split we settled**, and it is the rule going forward:

| | |
|---|---|
| **a measurement** | derived from the archive, every time, published like every other figure. A typed one is a figure nobody can check and nobody re-derives. |
| **a policy** | a CHOICE — the 0.7 reliability target, the half-season admission rule, `SHOWN = 6`. Nothing derives it; it is declared once, named, with its reason beside it, so it can be argued with. |

**Built:** `src/lib/reliability.js` splits every club-season in a FINISHED season
chronologically, correlates the halves across all of them, and inverts
Spearman–Brown to the games each row needs. `measure.mjs` publishes it as
`measures.json`'s `settle` block, using **the card's own row definitions**
(`CLUB_ROWS`), so the thing measured and the thing shown cannot drift apart.
⭐ A season counts as finished when the archive holds a PLAYOFF game for it —
read from the games, never a clock — which is what pins the counts inside a
season (CHENG's P2) and re-derives them by themselves after a Cup final.

⭐⭐ **AND THE DERIVED NUMBERS CHANGED THE CARD.** Over 96 club-seasons:

| row | typed | **measured** | |
|---|---|---|---|
| 5-on-5 CF% while level | 35 | **35** (r 0.733) | club row |
| defencemen shooting | 23 | **23** (r 0.811) | club row |
| shots from the slot | 37 | **42** (r 0.698) | ⛔ **over the 41-game admission rule — dropped** |

My typed 37 was the flattering one. The rule now runs rather than being
remembered: a row the archive says needs more than half a season leaves the card
by itself, and the card shows **two** club rows until a re-derivation says
otherwise. ⚠️ It is borderline — 42 against 41 — and §9 asks the question that
decides it.

## 9. Open, and it decides whether the slot row exists

**The estimator has a choice in it.** My hand probe centred each season's club
values before pooling; `reliability.js` pairs club-seasons without centring.
Centring removes a league-wide shift between seasons — a year in which everybody
shoots more from the slot is not a club difference — and it gives **r 0.72 → 37
games, which keeps the row**. Not centring gives 0.698 → 42, which drops it.

⚠️ **The methodological question must be answered on its merits, not on which
answer keeps a row.** My read is that centring is more correct, for the reason
above, and I am recording that it is also the answer that happens to suit the
card — which is exactly when to be suspicious of it.

## 10. ✅ BUILT — 2026-09-23 (steps 1–2 of §6; steps 3–4 remain)

Live at `https://readthegame.co/preview.html?game=<id>`. Gates green,
**1,396 JS + 224 Python**. Loaded in a real browser against the live site before
this was written: title, heading, state line and both club columns render, and
the club columns say *"No games counted yet this season"* — which is preseason
answering correctly.

| shipped | |
|---|---|
| the card | `src/lib/preview.js`, pure and fixture-tested; `src/preview.html` is only its renderer. Three states, and the played state carries the replay door. |
| the doors | the front door's tonight rows (text → links, `front-door-tonight.md` §4 Q1's own condition), and a **Next** line on every club page. |
| the data | `measureGame` carries `dAtt`/`lvl5`; `teamSeasons` sums them and publishes `through`; `recent.json` grew to ten fields; the census counts penalties, offsides, power-play chances and power-play goals. |
| ⛔ the PP trap | `census.state.pp.goals` counts goals scored WHILE a power play was on, short-handed ones included: 24.5% of chances against the league's own 21.9%. `whistles.ppGoals` is the numerator the card uses, and a test holds the two to partitioning. |
| ⭐ the counts | `src/lib/reliability.js` — §8. |

**Two defects this build made, both caught by the suite:**

- ⛔ **`var when` shadowed the page's date formatter, again.** `drawDaily` carries
  a comment about that exact trap from 2026-09-11, 700 lines away, and I wrote the
  shadow anyway. Four team-page tests went red inside a minute.
- ⚠️ **A reliability test could not fail.** The fixture defined `of`, the module
  called `of`, and the card's real rows carry `ofGame` — a fake that answers
  whichever question the code asks cannot fail the way production does. It threw
  on the first real record.

**And one check was measuring the markup while claiming to measure reachability**:
`test/index.test.js` read `href="…"` only, so every door this site builds in
script was invisible to it and `preview.html` was reported an orphan. It now reads
both.

### 10.1 ⏭ What is NOT built

- **§4, the edge middleware** — a shared link still unfurls with the site's generic
  title. This is the half Kevin asked to ship together with the page.
- **The og:image** — no page on the site has one.
- **Three open items:** §9's estimator question (it decides whether the slot row
  exists); the league rows are absent live until the WEEKLY derive rebuilds
  `measures.json` (Kevin was asked whether to trigger it by hand); and the
  *"Under way"* state reads for about thirteen hours after a game has finished,
  because nothing tells us it ended until the nightly run. Proposed copy:
  *"Started 7:00 PM — the replay appears after tonight's run."*

---

## 11. ✅ THE WORK DOOR — 2026-09-23, and it is a gate rather than a promise

**Kevin, restating a standing rule after the #fancystats discussion:** *"We are
open source and transparent. Everything we claim on the site needs to be
adversarially challenged internally, cause it's going to be challenged externally
for sure (at least I hope it will be)….. every metric and number needs to have an
opportunity for a critic to 'be shown the work' and the work needs to be squared
away."*

**⛔ THE AUDIT THAT FOLLOWED, THE SAME AFTERNOON.** The card had ten figures.
Five carried a door, and **every one of those doors led to a LESSON** — the
penalties tile linked to `penalties.html`, which teaches what a penalty is and
says nothing about how 3.7 a game was counted. Two figures had no door at all.
And *"14 of 35 games"*, the most attackable number on the card, was naked. A
lesson door and a work door are not substitutes and I had been counting one as
the other.

### 11.1 What shipped

- **`src/how-we-measure.html`** — one block per figure, each carrying what it was
  counted from, **the division itself**, why it is on the card, and what is wrong
  with it. The seven arguments against our method are static markup below the
  measured part, so a reader who arrives when the data origin is unreachable still
  finds them. Four of the seven are conceded as correct.
- **`src/lib/methods.js`** — pairs every key the card can render with its
  derivation. `keysOf()` asks the CARD what it draws rather than restating a list,
  and `anchorOf()` is the single spelling of the anchor both pages use.
- **`work` on every league row** (`preview.js`) — the numerator, denominator and
  quotient the tile already computed, carried so the methods page can print
  *"5,011 ÷ 22,872 = 21.9"*. ⛔ The row divides once and both surfaces read the
  result; nothing on the methods page divides.
- **Two doors on every figure**, and a route from the front door's limits block,
  which is the section a reader checking our work reaches first.

### 11.2 ⭐ The gate

`test/methods.test.js` renders **both real pages** and compares their output: every
`href` the card writes into a work door must resolve to a section id the methods
page actually rendered, and the door count must equal the figure count. Checking
either side alone would pass two pages that disagree about how the anchor is
spelled — the dead link that looks completely normal. Five mutations were run
against it and all five fail.

### 11.3 ⚠️ Found by looking, not by the suite

The first rendering explained in prose what each figure was counted from and then
printed only the archive size — **a page called *how this is counted* that never
performed the arithmetic**, and it read as finished. `work` exists because of
that screenshot. The same pass caught *"the middle value of 3,101,105"*: a bare
number with no noun, on the page whose entire subject is what our numbers are
made of.

### 11.4 ⛔⛔⛔ Written for us, and Kevin stopped reading it

> *"I started reading the how we measure page but stopped pretty quickly. We need
> to change the subject of the wording, currently it's not really in a public
> facing tone, it's more of an internal type phrasing… Like the title of the first
> blurb is '…if it settles…', I doubt a novice hockey fan is going to grasp what
> 'settles' means right away… let's not talk 'down' to anybody, that's not what
> I'm saying, but we need to reframe the audience of the page."*

⭐ **IT IS THE SAME DEFECT AS A NAKED NUMBER.** The page exists so a stranger can
check our work; a stranger who has to learn our vocabulary first cannot. The house
wording defeats the page exactly as completely as having no page would. ⚠️ And it
was invisible to me because I had written every one of those words.

The words that went: *settles, admission rule, club row, league row, reliability,
chronological, centred, club-season, denominator, orthogonal.*

| before | after |
|---|---|
| A figure describes a CLUB only if it settles inside half a season | **Is that the team, or is it just ten games?** |
| 1. "A chronological split is conservative — you under-credit everything." | **1. Comparing the first half of a season against the second is a hard test. Aren't you selling every number short?** → *Yes, and on purpose.* |
| the reliability we ask for. A choice, not a measurement | how closely a team's first half has to match its second before we will show a number for that team |

⛔ **Nothing was simplified away** — the agreement matrix, the sensitivity of every
count to both policy choices, and the four conceded criticisms all survive. The
rule is *shorter words for our concepts, never fewer concepts.*

⭐⭐ **The durable form is a word list checked against RENDERED text.** Tone cannot
be asserted; the specific words that made it unreadable can be, and they are the
ones that creep back. It reads what the page draws, not the source — the source is
full of `measures.settle` and `policy.admission`, identifiers a reader never meets,
and a check that cannot tell those from prose gets weakened until it says nothing.

### 11.5 The front-door card, and where it actually belongs

Kevin asked for one; it went into **What we counted** and he moved it:

> *"I would have thought you would have put the card in the what this (site) does
> and does not claim?"*

He is right and the section's own heading is the argument. ⛔ **And it had been in
that block all along without reading as a door** — fourth of five, link buried
mid-sentence in the same grey as the prose. It is now last (it answers the four
above it), spans both columns with a dark edge, and ends on an arrow.
⭐ **A door nobody recognises as a door is the same as no door.**

The duplicate in the measurement strip is gone: two routes to one page is the
duplicate-funnel defect `_NAV` already names. ⚠️ And that card had to be appended
*after* `_front_counts`'s loop to dodge its own check that every card in the strip
is one of our measurements — **routing around a guard rather than satisfying it,
which was its own answer about whether it belonged.**

### 11.6 ⛔⛔ Two of Kevin's eleven notes were defects, not wording

**The CF% caveat was about the wrong number.** It said we divide by games played
and should divide by minutes of five-on-five ice time, *"so our figure quietly
includes time spent on power plays and penalty kills."* `level5` is a **share** of
two teams' strictly-1551 attempts: no per-game denominator, no special-teams time.
The criticism does not apply to it at all.

⭐ **What is true is worse for being specific.** `dmen` and `slot` are computed over
**all situations**, so a team that draws a lot of penalties is partly being
described by its power play. The vague criticism let us off; the precise one does
not. The limits section said the same wrong thing about "the numbers above" and now
says what is the case. **A criticism aimed at the wrong number is not a
concession** — it is a concession-shaped object, and it passes every check we have.

**An unmeasured mechanism was explaining the score condition.** Kevin: *"we say
this on the Corsi% … because a team that is losing throws everything at the net.
We don't measure that, nor can we 'show the work' conclusively that that's the
case, so why do we include that snippet?"*

⭐ **The fix was not deletion.** The archive has counted the EFFECT since the site
began, in `baseRates`, read by the front door and by nothing else. The condition is
now argued by two published counts carrying their own published descriptions:

- **2,228 of 4,100** — the team with more shot attempts lost
- **1,560 of 3,925** — the team that controlled play while the score was level lost

The `what` string travels with the count from `archive.js`, so the page never
restates what a base rate is about.

The other nine: *"What is wrong with it"* → *"What could be wrong with it"* (the
first reads as a confession that argues against printing the figure at all);
question anchors and links, with a pointer under the lede; **32 × 3 = 96**
team-seasons spelled out, the team count divided out of two published numbers and
the sum claimed only when it comes out whole; the *"beside a team's name"*
paragraph rewritten because it described a surface the reader was not on; *"the
gentler test"* defined before use; *"we have counted none of them"* now says
**why** (all three look countable from what we already store); the fatigue claim
cut for the second time; and *"Power plays decide games"* replaced — no power-play
number passes our test, which does not make power plays unimportant, it means the
test cannot speak to importance.

### 11.7 ⏭ OPEN — should the page be dispersed?

Kevin: *"do we want to disperse these sections across the site… it seems like a
shame to consolidate all of it into one place and not put the specific bits closer
to the cards or metrics that surface that specific information."*

**Two pieces of evidence found while answering, both of which say yes:**

1. ⛔ **The hits caveat is already duplicated.** The card renderer hardcodes
   *"Counted by each home rink's own crew, which records about 4% more hits at
   home…"* and `DERIVATION.hits.caveat` says the same thing in different words.
   Two statements of one fact, free to drift — the exact defect `methods.js` was
   built to prevent, live on the card now.
2. ⛔⛔ **THIS ENTRY WAS WRONG AND IS CORRECTED 2026-09-24.** It said *"`icing`,
   `offside`, `penalties` and `slot` carry 7–16 figures each in visible text and
   not one word about how any of them was counted."* Measured against the built
   pages: **`icing`, `offside`, `penalties`, `faceoffs` and `empty-net` carry NO
   statistical figures at all** — they are a rule, a diagram and a door to a
   replay — and none of them renders a number at runtime either (no `toFixed`,
   no `toLocaleString`, no read of `measures.json`). Only `slot.html` carries
   any: **six**. ⭐ The 7–16 came from counting the KEYS of each page's entry in
   `data/learn-figures.json` — `viewBox, group, label, door, svg, steps, css` —
   a file whose "figures" are DIAGRAMS. A length was read out of a structure
   nobody opened.

   **Where the naked figures actually are**, swept across every built page:

   | surface | figures in visible text | per-figure doors |
   |---|---|---|
   | `index.html` front-door strip | 7 | 0 (one site-wide link) |
   | `what-you-can-see.html` | 6 | 0 |
   | `slot.html` | 6 | 0 |
   | `game.html` / `read-the-game.html` | rendered at runtime | 0 |
   | `preview.html` | 10, at runtime | 10 |

   ⭐⭐ **AND THE DUPLICATION IS NOT ONLY IN THE HITS CAVEAT.** One measurement —
   the slot conversion — is printed by two separately hand-written sentences in
   `builders/build_index.py`, and **they have already drifted**: L2431 says *"A
   shot from inside the slot goes in…"*, L2723 says *"A shot taken from inside
   the slot goes in…"*. The NUMBERS cannot go stale (both substitute
   `__SLOT_IN_PCT__` etc. from `measures.json`); the WORDS did. That is the
   defect this dispersal exists to end, and it is the second live instance.

**The shape of the answer.** Disperse the per-figure half — *counted / out of / the
division / what could be wrong with it* — because `methods.js` is a module and any
surface can import it. **Do not disperse the instrument**: the test, the two policy
choices and the seven questions have to be auditable in one sitting, and scattering
them makes them unauditable. The methods page becomes the index and the argument
rather than the only home, and the existing gate extends to *every surface that
prints a figure resolves to its derivation* — which would go red on those four rule
pages immediately, correctly.

⏭ **THE ORDER, REVISED ON THE MEASUREMENT ABOVE.** "Rule pages first" was
recommended and approved on the strength of the count that turned out to be a
length; rule pages have no figures to disperse to, so that ordering is void. The
surfaces that actually print figures with no derivation behind them are the
**front-door strip (`FRONT_COUNTS`), `what-you-can-see.html` and `slot.html`** —
three surfaces sharing about four measurements, all of which `methods.js` already
covers (`slot`, `shift`) or could. The preview card stays second: its ten figures
are already doored, and what it needs is the hits duplication deleted, which is a
design question on a dense page a novice meets on a phone.
