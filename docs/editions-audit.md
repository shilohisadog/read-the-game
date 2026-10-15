# Editions audit — 2026-10-15

**Status: AUDIT ONLY. Nothing is designed or built.** For Kevin and CHENG to read
before any design.

**Why this exists.** Kevin's X post for MTL at WSH (14 October) named Suzuki and
Jenner and a 58.2% share; the same preview link the next morning showed Anderson
and Tuch and 59.2%. A shared link drifts. Kevin's rulings, 2026-10-15:

1. A shared link must show what was shared, forever: **the same figures, players
   and wording; the page design may change.**
2. Audit what we are dealing with before designing. (A separate audit, after this
   one, asks whether the layers, the preview and the summary show the right
   measures.)

Kevin's nit, recorded because it is right: the data-model review
(`docs/data-model-review.md`) should have found this. Its three passes asked
whether a document is right *at a moment*; none asked what happens to it *over
time*.

How it was made: three read-only passes (pages, published documents, links),
each citing file:line, then the headline claims re-checked by hand (✔).
Measured 2026-10-15; re-measure before quoting.

---

## 1. The headline: five ways a shared link changes

| # | What changes | Example | Cadence |
|---|---|---|---|
| A | **Season-to-date figures are recounted** and every page reads the newest | the MTL preview above ✔ | nightly |
| B | **Facts about past dates are rewritten**: the league amends games; our extract format changes; `measures.json` is recomputed over the whole archive | extract `SCHEMA` changed 6 times since 8 September ✔ | on amendment, on every format change, weekly |
| C | **"Static" pages are rebuilt nightly with new figures** | `slot.html` went from "19,618 goals from 168,850 attempts" to "19,626 … 168,930" in `73c7c1b` ✔; rewritten 34 times since 1 October ✔ | nightly |
| D | **Our code changes**: rows added, wording edited, formulas fixed | four preview rows added on 13 October | every deploy |
| E | **Picks are remade by design**: a lesson door opens the newest game holding its moment | `?lesson=icing` opens a different game each night | nightly |

Freezing one document fixes none of these alone. The preview drifts through A and
D; its "How this is counted" door drifts through A, B and D; the learn pages
through C.

## 2. Pages

15 built pages; 5 fetch data at runtime (index, calendar, preview, game, methods),
10 do not.

| Page | Reads at runtime | Baked at build | A statement about… | Claim wording lives in |
|---|---|---|---|---|
| `/` (home, `?team=`) | front, team, schedule, recent, measures | archive counts (`data/measures.json`) | latest, by nature | renderer (`build_index.py`) |
| `/calendar` | front, calendar month, schedule | — | latest; a date view is about a date | renderer |
| `/preview?game=` | schedule, teams, measures, recent, extract, players (`build_index.py:4124`) | door links | **a game** — figures are season-to-date as of today | model (`preview.js` CLUB_ROWS label/says) **and** renderer (`build_index.py:4450`, `4474`, `4573`) |
| `/game?game=&at=…` | extract, measures; lessons for `?lesson=` | lesson strip text with archive figures (`build_main.py:858`) | **a game and a moment** — summary and "Is that a lot?" scale against the season so far (`app.js:1769`, `2139`) | renderer (`app.js:3015`, `2177`, `2000`); work panel in `work.js` |
| `/how-we-measure` | measures (`build_index.py:5597`) ✔ | archive span (6 occurrences) | **the method** — arithmetic moves nightly | `methods.js` and renderer (`build_index.py:5320`, `5347`, `5371`) |
| 7 rule pages + what-you-can-see | nothing | archive rates, rewritten nightly | teaching, but the figures move | Python strings (`LEARN_CARDS`) |
| `read-the-game.html`, `terrain-3d.html` | nothing | one baked game | unlinked | — |

**What that means:** claim wording lives in three places: data documents, pure
model functions in `src/lib`, and page renderers. Only the first two could be
stored as an edition without a rewrite.

## 3. Published documents

Every JSON document is **overwritten in place** (`aws s3 cp … --cache-control
no-cache`, e.g. `ingest.yml:1003`) ✔. Nothing is versioned except the raw feeds.

| Document | Changes | Past dates rewritten? | Size | Earlier version recoverable? |
|---|---|---|---|---|
| `raw/{game}/{sha}/{feed}.json` + `raw/{game}/latest.json` | nightly window | amendment = new sha | ~426 KB a game (403 at the edge, not re-measured) | **yes — every version kept** |
| `extract/{game}.json` | nightly window; whole archive weekly and on format change | yes | mean 84 KB (n=10); 4,658 published | no (re-derivable from raw + the extractor of that commit) |
| `catalog.json` | nightly | yes | 485 KB, 4,725 rows | no |
| `index.json` | every run | yes | 385 KB | no |
| `measures.json` | nightly + weekly | yes, whole archive | 36 KB | **yes, via git** — the only published document committed (`data/measures.json`, byte-identical) |
| `teams.json`, `players.json` | nightly | yes | 83 KB, 33 KB | no |
| `lessons.json` | nightly | yes (re-picked) | 4.5 KB | no |
| `schedule.json`, `recent.json` | every run | forward-looking | 14 KB, <1 KB | no |
| `front.json`, `team/*`, `calendar/*` | nightly | yes | 2.5 MB together with the above | no (projections of catalog + index) |

No single field names a run. `index.json` has `lastRun` and `dataThrough`;
`measures.json` has `dataThrough`; teams/players/lessons have `through`; several
runs share one `dataThrough`. An edition would need its own identifier.

## 4. Links

- **Nothing on the site names a date or a version.** A link pins at most a game
  and a moment; everything around it is read from the newest documents.
- **One share button:** "Copy a link to this moment" on the replay
  (`app.js:4968`). No share affordance on the preview.
- **One page rewrites its own address:** a lesson door pins itself to the game and
  moment it opened (`build_main.py:1065`). The preview does not.
- **The link card's URL drops everything but the game** ✔: `functions/_middleware.js:187`
  writes `og:url` as `https://readthegame.co/{game|preview}?game=ID`, so `at`,
  `layer` and any future date parameter are lost from the card.
- **Cross-page figures can be from different nights**: the learn pages bake
  `data/measures.json` from git while the live pages read R2; both are written by
  one nightly job in two steps, so a failure between them parts them.

## 5. What we already have that looks like editions

1. **The raw feeds**: content-addressed blobs, a `latest` pointer, written blobs
   first and pointer second, with a repair for a pointer that names missing bytes
   (`fetch_nhl.py:298`, `311`, `544`). The exact pattern an edition needs.
2. **Git history** of `data/measures.json` and every built page: 36 measure
   commits since 1 September, each naming its date and game count.
3. **Cloudflare Pages keeps every deploy** at its own immutable address — every
   built page and every line of renderer code, by deploy.

What none of them keeps: the nightly R2 documents other than `measures.json`
(teams, players, catalog, lessons, schedule…) — exactly what the preview and the
summary are drawn from.

## 6. Size, measured

| What | Size |
|---|---|
| One night's top-level documents (index, catalog, schedule, recent, front, measures, teams, players, lessons) | 1.04 MB; ~380 MB a year if every night is kept |
| The same plus team and calendar slices | 2.5 MB a night |
| One preview's model (`preview()` output) | 12.2 KB (n=58 upcoming games, 12,150–12,341 B) |
| A preview model for every upcoming game, every night | ~0.7 MB a night |
| Extracts, versioned only when they change | a few games a night; **~390 MB per format change** (4,658 × 84 KB), and the format changed 6 times in five weeks |

## 7. Questions to rule before any design

1. **Which pages are statements?** Previews, game summaries and the methods page
   clearly are; the home page and calendar clearly are not. Undecided: the replay
   itself (its events can be amended by the league), the learn pages (their
   figures move nightly), and lesson doors (re-picked by Kevin's own ruling).
2. **What does "forever" mean when the league amends a game?** A frozen preview is
   easy; a frozen *replay* would keep showing an event the league later corrected.
   Keep what we showed, show the correction, or both?
3. **What is stored — inputs or statements?** Storing the documents (inputs) lets
   today's code recompute an old night, which drifts through D. Storing what each
   page says (the model: figures, picks, sentences) does not — but then every
   sentence that states a figure has to move out of the renderers (§2), and
   today's renderer must draw every stored format forever.
4. **The grain**: one edition a night for everything, or a stored statement per
   page per game per night?
5. **The past**: nothing before the build is stored except `measures.json` and
   built pages in git. Reconstruct old editions (and label them reconstructed), or
   start from the build date?
6. **The link card** must carry the date in `og:url`, or the card's link and the
   pasted link disagree.

---

## 8. Kevin's rulings, 2026-10-15 — and the trade-offs taken

| Question | Ruling | What we gave up, and why it is acceptable |
|---|---|---|
| 1. Which pages are statements? | **Previews, game summaries and the methods page are dated. Learn pages and lesson doors are not.** A replay can be shared. | A learn page or lesson door read later may show newer figures or a different game. They teach; "even with evolved content the intent of the page will still be met." |
| 2. League amendments | **Do not chase them; keep what we showed.** | A shared replay draws its events from the newest game file, so a league correction (small, for reading the game) can appear under an old link. The comparisons around it (summary scales, "Is that a lot?") come from the dated edition. |
| 3. Inputs or statements? | **Store the inputs, and keep the code that was live that night.** A dated link opens that night's deploy (Cloudflare Pages keeps every deploy at its own permanent address) reading that night's data. | **Old links keep that night's LOOK and any defect that deploy shipped with.** This supersedes the morning's "current design" ruling. Why: inputs redrawn by today's code drift whenever the code changes — the 14 October deploy failures were exactly that (new rows reading fields that older data lacked), and a reworded sentence or corrected formula would change an old link silently. The alternative, storing each page's statements, means moving every figure-stating sentence out of the renderers and keeping today's renderer able to draw every stored format forever. |
| 4. Grain | **One edition a night, for everything.** | Something shared between a daytime deploy and the next night is shown with the night's deploy, not the daytime one. |
| 5. The past | **Start from the build date.** Backward compatibility later. | Links shared before the build (including Kevin's MTL post) keep drifting until a reconstruction exists, and must say they are not a saved version. |
| 6. The link card | **It carries the date.** | — |

Approximate cost, from §6: ~1 MB of data a night, ~380 MB a year. Game files are
not copied into editions (ruling 2), so a format change costs nothing extra.
