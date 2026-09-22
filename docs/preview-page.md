# The preview page — a shareable URL for a game nobody has played

**Written 2026-09-22 as a plan for review.** Nothing is built. It surfaces the
card `docs/preview-and-corsi.md` §11–§12 settled, and it is the first thing this
project will run **server-side** (at the edge, and only over `<head>`).

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
| `teams.json` | published, 53 KB, per club per season: `games`, `attempts{for,against}`, `slot{count,n}`, `blocks`, `saves`, `record`, `goalies`. ⭐ **The slot row is already there.** Written by the WEEKLY derive (`cron: 20 9 * * 1`). |
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
