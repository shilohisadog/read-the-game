# The front door — a page that changes every morning

**For CHENG. Kevin, 2026-09-09**, with a screenshot of the live home page above
the fold on his laptop:

> *"I think we need to refactor this into something that encourages daily visits,
> offers valuable information right from the get go, and encourages a visitor to
> click into the site, which are all general website goals, certainly. I think we
> need to put on our website UX hats and figure those bits out."*

**Status: design. Nothing in §5 or §6 is built.** §1 shipped ahead of it.

Every number below was read from the page or the archive on **2026-09-09**, in a
real browser or from the published documents. Nothing here is recalled.

---

## 0. Method

Chromium via `tools/pixels.sh`, the local build of the shipped source, the **live**
data documents, at **390×844** and **1900×1065** — the second is Kevin's laptop,
taken from the screenshot he sent (3793×2020 at device-scale 2). Block positions
are `getBoundingClientRect().top + scrollY`, so "screens" is that offset over the
viewport height.

Transfer sizes are `Accept-Encoding: gzip` against the live origins, so they are
what a visitor actually pays, not what the file weighs on disk.

---

## 1. Three defects shipped ahead of this document — `c56a33a`

They were in the screenshot, none of them depends on any refactor, and they are
not re-argued here.

| | what a visitor got | why it happened |
|---|---|---|
| **the site made no claim at all** | `Both teams took 52 shot attempts.` and then nothing | the archive rate printed only when the hero had an attempts leader; the hero is tied 52–52, and the hero does not move again until the season opens |
| **`Copy a link to this moment` inside the hero** | a control that cannot be used, directly above the real call to action | `.sharerow` was never added to the preview's hide list — and the hide list's guard was a hand-written array of class names |
| **a dead end where a reason to return belongs** | `No games in the last 14 days.` | nothing read the league's own `regularSeasonStartDate`, which arrives on every schedule payload including the empty ones |

⭐ The second one **cost ice**, which is the part nobody would have predicted:
`#rg.preview` is a `100vh` flex column, so a 44px control does not overflow the
frame, it comes out of the rink. Measured before and after:

```
390×844    rink box  343×86  →  343×142
1900×1065  rink box  884×334 →  884×390
```

**A third of the ice on a phone, to a button nobody could press.**

---

## 2. What the fold is today, measured

At **1900×1065**, the document is **2,186px — 2.05 screens**, and above the fold:

| block | top | screens |
|---|---:|---:|
| nav | 12 | 0.01 |
| `READ THE GAME` eyebrow | 96 | 0.09 |
| the headline | 121 | 0.11 |
| `A RECENT GAME, UP TO ITS FIRST GOAL` | 219 | 0.21 |
| the hero card (729px tall) | 219 | 0.21 |
| `CAR at VGK — 9 June 2026` | 784 | 0.74 |
| the attempts sentence | 817 | 0.77 |
| the archive rate | 843 | 0.79 |
| `Watch the whole game →` | 903 | 0.85 |
| `Watch your team` | 982 | 0.92 |
| — **the fold** — | 1065 | 1.00 |
| the club grid | 1071 | 1.01 |

At **390×844** the document is **2,525px — 2.99 screens**, the hero card runs
275→729, and the fold falls between `Watch your team` (762) and the club grid
(872). **The phone and the laptop see the same blocks in the same order**, which
is the thing to change: they have very different amounts of room.

### 2.1 What the fold spends itself on

| the fold says | how many times |
|---|---|
| what this site is | **3** — nav wordmark, `READ THE GAME` eyebrow, the headline |
| **what is new since yesterday** | **0** |
| a claim worth reading | 1 (as of `c56a33a`; it was 0) |
| somewhere to go | **6 links, four of them the site nav** |

### 2.2 ⚠️ Two numbers I gave Kevin in conversation were wrong

Both overstated the case in my favour, so they are corrected here rather than
quietly dropped:

| I said | measured |
|---|---|
| the headline is "about 400px" | **603px** at 1900 (56ch of a 1.06rem face) |
| "roughly three quarters of the fold is empty gutter" | `.wrap` renders **944px of 1900 — 50%**, not 25% |

**The finding survives at half the size**: half a laptop's width is unused, and
none of what is there changes from one day to the next.

---

## 3. The invariant, stated so it can be argued with

> **The front door has no notion of today.** Every element above the fold is true
> for months at a time, and the one that is supposed to move — the hero — moves
> only when a game enters the `[3, 8]` hero-loop window.

Measured over the published catalog: **434 of 4,490 published rows** carry an `hl`
in that window, and at least one qualifying game exists on **285 of 667
game-nights — 42.7%**. `docs/ten-second-hero.md` measured the staleness that buys
(median 0 days behind the newest game, p90 3, p99 20) and that trade is fine for
a *hero*. It is not a mechanism for *daily*, and it was never asked to be.

**So "encourages daily visits" is not a copy problem. There is no element on the
page whose content is a function of the date.**

---

## 4. What "new every day" actually is

### 4.1 In season, there genuinely is something new almost every morning

Counted from the published catalog, in-scope games only (`v==1`, type 2 or 3):

| season | opener → last game | calendar days | days with a game | games | median/night |
|---|---|---:|---:|---:|---:|
| 2023-24 | 10 Oct → 24 Jun | 259 | **232 (90%)** | 1,400 | 4 |
| 2024-25 | 4 Oct → 17 Jun | 257 | **224 (87%)** | 1,398 | 5 |
| 2025-26 | 7 Oct → 14 Jun | 251 | **211 (84%)** | 1,394 | 5 |

**Seven mornings in eight**, four or five games each. That is the raw material,
and it is currently surfaced nowhere on the home page.

### 4.2 And for four months there is nothing, which is today

`index.json` right now: `dataThrough` 2026-06-14, `coverage.gamesInWindow` **0**
over a 14-day window, `lastRun` 2026-09-08. `schedule.json`: `upcoming: []`. The
nightly is running correctly and finding nothing.

⏰ **The clock, from the league's own schedule document, read 2026-09-09:**

```
preSeasonStartDate      2026-09-19   ← 10 days
regularSeasonStartDate  2026-09-29   ← 20 days, 5 games that night
```

⚠️ **`docs/next-game.md` §2 says the regular season opens 8 October**, read off one
week's payload on 2026-08-17, and §0.2 computes the next-game card's gate ("~1
November") from it. The league's own field says **29 September**. That figure
should be treated as stale wherever it is cited.

**So the offseason state has a twenty-day shelf life, and the in-season design
has a twenty-day deadline.**

---

## 5. The proposal

Offered to be attacked. The split is deliberate: §5.1–5.3 are content and can ship
on the current layout; §5.4 is layout and can ship without any of them.

### 5.1 One block, three states, and the data decides which

The page gains **one** element whose content is a function of the date. It has no
empty state, because every state is a real sentence:

| when | what it says | read from |
|---|---|---|
| games last night | `Last night — 8 games.` + §5.2 + the list in §5.3 | `catalog.json` |
| in season, none last night (13–16% of days) | `No games last night. Next: 7 tonight.` | `schedule.json`'s `upcoming` |
| offseason | `No games since 14 June. Preseason opens 19 September, the regular season 29 September.` | `schedule.json`'s `season` |

⭐ **This gives `schedule.json` its second and third readers.** The document has
been published on every run since the forward window shipped and, until
`c56a33a`, **nothing had ever read it** — the D10 shape, a field written for a
purpose no reader served.

### 5.2 The daily sentence, and it is the site's own measure

> **Last night the team with more shot attempts lost 5 of the 8. Across 4,100
> games in this archive, 54.3%.**

Three properties, none of them new doctrine:

1. **A count with its denominator, never a rate.** `5 of the 8` is a fraction; the
   percentage belongs only to the archive figure, which has an n large enough to
   carry one. This is the rule from the below-the-rink summary — *a fraction
   never a percentage* — doing its normal job on a small night.
2. **It classifies nothing.** Like the hero's sentence after 2026-08-25, it states
   this slate's count and the archive's rate and draws no line between them.
3. **It is the same measure as the hero.** Kevin's ruling: *"we show Control in
   the replay loop but describe shots on goal in the text below the rink, those
   should be consistent… they need to be the same measure."* That ruling is what
   makes §6 necessary rather than optional — see below.

### 5.3 Last night's games — a list, and the reason it is not a wall of previews

The obvious idea is a row of previews. **Measured, gzipped, from the live site:**

| | transfer |
|---|---:|
| the whole front door today, without the hero | **117 KB** (index.html 37, catalog 59, index.json 15, measures 5, schedule 0.07) |
| **one preview** | **258 KB** — `game.html` 245 KB + one extract 13 KB |

**The hero is already 69% of the page's weight**, and each additional live preview
is another quarter of a megabyte, because `game.html` is the whole app and each
iframe is a different URL. Six previews is ~1.5 MB.

> ⛔ **THE RULE, STATED SO IT IS NOT RE-LITIGATED BY SOMEBODY WHO DID NOT MEASURE
> IT: the front door carries exactly one live preview.** This is a cost, not a
> taste. CHENG: *"it's the kind of constraint that gets re-litigated by someone
> who didn't measure it."*

So: **one live loop, and the rest is text.** Each row is the two clubs, the score,
the game's own attempts line, and a link. Browse lists keep their scores by the
existing rule — *the score appears where the visitor asked for a game, not where a
game was handed to them* — and this is a list a reader chooses from.

### 5.4 The fold, at a laptop's width

Two columns above 1000px; **the phone layout is untouched and stays one column**,
which is the constraint the novice test imposes (`docs/site-purpose.md` §9 — she is on a phone).

```
┌─ Read the Game ───────────── Watch · Teams · By date · What you can see ──┐
│                                                                          │
│  Every NHL game since 2023, replayed      ┌────────────────────────────┐  │
│  event by event — so you can see          │  CAR 0        VGK 0        │  │
│  where a number comes from.               │  attempts 1 — 0            │  │
│                                           │  [ the loop ]              │  │
│  LAST NIGHT · 8 games                     └────────────────────────────┘  │
│  The team with more shot attempts          CAR at VGK — 9 June 2026       │
│  lost 5 of the 8.  Across 4,100 games      Watch the whole game →         │
│  in this archive, 54.3%.                                                  │
│                                                                          │
│  BOS 4 TOR 2 · MIN 1 COL 3 · NYR 2 …   ← eight doors, each with a fact    │
└──────────────────────────────────────────────────────────────────────────┘
```

The arithmetic: the hero card is 729px tall at 1900 and the fold is 1065px, so a
column beside it has **~900px of vertical room that is currently gutter**. Nothing
is deleted to make space, and the three questions land in order — what is this,
what is new, where do I go.

---

## 6. The plumbing, and the same finding three times

⭐ **Each of the three things this needs is something the pipeline is already
handed and throws away.**

| | already computed | currently |
|---|---|---|
| the fixtures | `classify()` returns them; the week payload carries six future days | kept since the forward window shipped, **read for the first time in `c56a33a`** |
| the season boundaries | on every payload including the empty ones | **kept as of `c56a33a`** |
| **per-game attempts** | `measureGame()` in `builders/measure.mjs` emits `attempts:{h,a}` for every game | computed **weekly**, published only as archive-wide base rates |

### 6.1 ⛔ The scheduling fact that decides this

**`measure.mjs` does not run in the nightly.** `ingest.yml` is daily at 11:00 UTC
and runs fetch + `derive.py`; `derive.yml` runs `measure.mjs` **weekly**, Mondays
at 09:20 UTC. So the per-game attempts for last night's games do not exist until
the following Monday.

Three ways out, and only one of them is allowed:

1. ✅ **Run `measure.mjs` in the nightly over the games just derived** — CHENG's,
   and it is right: *"that's not a second implementation — it's the existing one,
   invoked on a smaller input."* `derive.py --out ingest` leaves the window's
   extracts in `ingest/extract/`, which is exactly what `measureAll(dir)` reads.
   **It is scheduling, not analysis.** ⚠️ It is also not one workflow line — see
   §6.1.1, which is the part nobody had checked.
2. ⛔ **Compute attempts in `derive.py`.** Forbidden by this repo's own standing
   rule — *the reducers in `src/lib` are imported and never restated* — and it is
   the exact shape `docs/next-game.md` §9.1 caught: a second implementation, right
   on the common case, wrong on the cases the real reducer exists for.
3. **Use shots on goal instead**, which `catalog.json` already carries as
   `ash`/`hsh`, with `moreShotsOnGoalLost` already published. **Zero pipeline
   work** — and it puts a shots sentence beside an attempts hero, which is the
   defect Kevin already caught once. Rejected on his ruling, not on taste.

#### 6.1.1 ⛔ AND OPTION 1 AS WRITTEN WOULD DESTROY THE ARCHIVE'S BASE RATES

CHENG's caution was that a per-run measurement *"is a different object and
shouldn't be conflated with `measures.json`."* Checked against the workflows, and
it is worse than a conflation of ideas — **`measure.mjs`'s `main()` writes
`measures.json` and `teams.json` into `--out`, and the nightly's first sync pass
excludes only `index.json`, `catalog.json` and `*latest.json`.** So:

> `node builders/measure.mjs --out ingest` added to `ingest.yml` uploads an
> **eight-game** `measures.json` over the archive-wide one, every night.

The consequence is visible on the surface this document is about: the hero's own
sentence reads `moreAttemptsLost` out of that document, so the front door would
begin saying *"Across 8 games in this archive…"* the following morning.

⛔ **AND THE UPLOAD GUARD CANNOT CATCH IT.** `ingest.yml` proves its sync filters
partition before trusting them — but `expected.txt` is built by `dry`-running the
sync over whatever is *on disk*, so a new file lands in `p1.txt` and in
`expected.txt` alike, partitions cleanly, and is published. **The check asks
whether the passes cover the files, never whether the files are the ones we meant
to publish.** That is the eighth entry in `docs/status.md`'s instrument list: a
guard measuring a narrower claim than its name.

**So option 1's precondition is a mode that writes a different document** — the
slate's per-game records, under its own name, with `measures.json` and
`teams.json` written only when asked for. That is a small change to `main()` and
it must land *before* the workflow line, not with it.

### 6.2 Where the numbers live, measured

If the sentence needs attempts, ~8 rows a night need them. Two shapes:

| | cost |
|---|---|
| put `at`/`ht` on **every catalog row** | raw +15.4%, **gzipped +15.7 KB (+26.5%)** on a document every visitor fetches |
| a small **nightly block** carrying the last slate only | ~8 rows, well under 1 KB, no new request if it rides on a document already fetched |

⚠️ **And my first measurement of that was wrong in the flattering direction.** I
filled the new fields with a constant and gzip reported **+1.6 KB**; real attempt
counts run roughly 35–85 and do not compress like that. Filling with a realistic
spread gives **+15.7 KB — ten times more.** *A synthetic value that repeats is not
a measurement of a field that varies.*

**Recommendation: the nightly block.** The catalog is the archive; what is new is
not archive-shaped, and the front door should not pay 26% more for every game
since 2023 in order to describe eight.

### 6.3 ⭐ "Measured" is itself a claim, and it has to carry its date

CHENG, and this is a requirement rather than a note:

> *"'measured' implies the numbers are current. With a Monday cadence they're
> not, and a surface saying* last night *beside a figure derived a week ago is the
> `dataThrough` problem in a new place. Whatever ships needs the same discipline
> — the number carries when it was computed, or it doesn't ship."*

This site already has the machinery and the habit: `index.json` carries `asOf`,
`describe()` turns it into a sentence, and every archive snapshot in `docs/` is
dated rather than updated. So the rule for the daily block is the existing one
applied one surface further out: **a figure that is not from last night's own
derivation says which night it is from, and a block whose figures are stale
enough to mislead renders the count without the rate rather than the rate with a
lie.** ⚠️ **If §6.1.1's precondition is not built, the honest daily block is a
list of games with no measured sentence at all** — which is still a better front
door than today's, and is the fallback if the ruling goes the other way.

---

## 7. What I want CHENG to rule on

1. ✅ **RULED — §5.2 is not a ranking, and the argument is better than mine.**
   CHENG: *"a ranking picks WHICH game deserves attention on grounds we chose.
   `featured` survives because the rule is one line, printed on the page, applied
   identically to every in-scope game. **Last night applies no rule at all. It's a
   date filter, and a date is not an outcome.**"* That is the same test that
   settled whether a date slice needs a base rate — **the requirement attaches to
   selection on an OUTCOME, not to selection** — and it disposes of my placement
   worry too, because nothing about the play decides what appears.

   ⛔ **AND IT NAMES THE LINE THIS MUST NOT CROSS.** The block becomes a ranking
   the moment it says *which* of last night's games — *the closest*, *the biggest
   upset*, *the best game*. If it ever does, the rule needs stating on the page
   the way `featured`'s is. **Written down here because it is the obvious next
   feature request and it is the one that would cost the doctrine.**
2. **Does the eight-game denominator survive our own rule?** *A rate without a
   base rate is a story.* The base rate is printed beside it and the small number
   is a fraction, never a percentage. Is that enough, or does `5 of the 8` invite
   a reader to conclude something about last night that eight games cannot carry?
3. **Is a remembered team allowed?** The strongest recurrence argument is not
   league-wide at all — C1 measured that a team browse already reaches 93.3% of
   what a fan wants, and a fan returns because *their* club played. A remembered
   club is `localStorage`, needs no server and no analytics. But this site
   deliberately measures nothing about its visitors, and I want that line drawn
   explicitly rather than assumed: **storing a preference for the viewer is not
   measuring the viewer, and I believe it is permitted.**
4. **Where does the archive state line go?** `#state` currently sits at the bottom
   and now carries the season sentence, which is the most forward-looking thing on
   the page and is in the least-read position. If §5.1 ships, its offseason state
   says the same thing at the top, and `#state` should probably keep the *ledger*
   half only ("data through…") and lose the season half.

---

## 8. What is refused, and it is not a style preference

`docs/home-page.md` §4 drew this line and it holds: **adopt the principle a
convention encodes; do not import the artifact.**

| goal Kevin named | the principle, taken | the artifact, refused |
|---|---|---|
| daily visits | have something new that is worth their time | badges, streaks, "you missed 5 games" |
| value from the get-go | a measured claim in the first screen | "the definitive", "trusted by" |
| encourage clicking in | more doors, each labelled with a fact | teases, "you won't believe", auto-playing everything |

And the standing one: **we will never know whether any of this worked**, because
item C disabled analytics on purpose. So the things worth designing to are the
ones we can check — *is there something new, is it true, is it one click away.*

---

## 9. What waits for the novice test

Unchanged, and this document adds one:

- whether a stranger reads the daily sentence or scrolls past it to the loop;
- **whether two columns help or split her attention** — she is on a phone, so the
  laptop layout is the one nobody will have watched anybody use.

---

## 10. What this does not touch

The hero selection rule, the `[3, 8]` window, the pace, and the preview's
one-live-loop-only status. `docs/replay-motion-open.md` records that pacing is
closed, twice.

---

## 11. CHENG's review — 2026-09-09

What it changed, recorded because a review that only agrees is not worth citing:

| | |
|---|---|
| **§6.1** | the third option is his, and it is the answer: run the existing reducer on a smaller input. My draft offered only "run it in the nightly" as an unexamined option 1 against two refusals. |
| **§6.1.1** | checking his "different object" caution against the workflows found that the naive version **overwrites the published `measures.json` nightly, and the upload guard cannot see it.** |
| **§6.3** | *"'measured' implies the numbers are current"* — a whole requirement my draft did not have. |
| **§7 q1** | ruled, on a cleaner argument than the one I made: a date is not an outcome. |
| **§5.3** | the preview arithmetic promoted from an aside to a stated rule. |

⭐ **And his framing of the invariant is the one to keep:**

> *"A reason to come back tomorrow kept getting proposed as a feature when it's
> actually a **property the front door doesn't have**. Naming it as an invariant
> is more useful than any of the three candidates were."*

⭐ **On the two corrections, he named the general form and it is sharper than the
instances:** *"measurement errors that happen to support the measurer are the ones
to watch"*, and **gzip estimates measured on synthetic data measure the
synthesis** — the same shape as the fit gate grading an error page.

⚠️ **His one caution on the offseason half is already satisfied and should stay
that way:** whatever lands must have an honest August state, and `dataThrough`
plus the freshness line solved that once already — *"no games in the last 14 days"
is a true sentence and the surface shouldn't need a different design to say it.*
§5.1's three states are one block with one shape for exactly that reason.
