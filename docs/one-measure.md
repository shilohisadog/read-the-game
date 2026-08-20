# One measure on one screen — the hero's bar and the hero's sentence

**Kevin, 2026-08-17, looking at the live front door:**

> *"We show Control in the replay loop but describe shots on goal in the text
> below the rink, those should be consistent."*

> *"They need to be the same measure, Control in the rink and Control in the
> sentence."*

**Ruled. This is the plan for getting there, and the obstacle is real rather
than clerical.**

---

## 1. What is actually on the screen today

| element | measure | source |
|---|---|---|
| the board's bar and counts, inside the loop | **shot attempts** (Corsi) | `corsi.reduce` in the iframe |
| `.herosub` under the rink | **shots on goal** — *"CAR put more shots on goal, 23 to 22, and won"* | `g.ash` / `g.hsh`, catalog fields |
| `.herorel` under that | the archive rate for **shots on goal** — 54.2% | `measures.json` `moreShotsOnGoalLost` |

Two measures, one screen, and the reader is given no way to tell them apart.

### 1.1 ⭐ And the word "attempts" never appears

The element that names the unit is `.counters` — *"CAR attempts / VGK attempts"* —
and it is in the preview's hide list, deliberately, because it repeats the board's
figures inside the rink box and spends ice.

So the board says **CONTROL**, the sentence says **shots on goal**, and nothing
on screen says those are different quantities. A novice sees `1 – 0` above and
`23 to 22` below. **That is worse than an inconsistency; it is two unlabelled
numbers that appear to contradict each other.**

## 2. Why the sentence says shots on goal, and why that is not laziness

`derive.py::_write_catalog` writes the row a visitor browses, and its own comment
explains the choice:

> *"SHOTS ON GOAL ARE ON THE CARD. Doctrine 8 governs rates, not counts, and
> 23-22 is a count."*

**The catalog is built in Python. Attempts are decided by `corsi`, which is
JavaScript.** Adding attempts to `_write_catalog` would be a second
implementation of *what an attempt is* in a second language — the exact defect
`builders/measure.mjs` exists to prevent, and the one its header is written
about. That is not a route.

## 3. The constraint that shapes everything: two freshnesses

- **`catalog.json` is written NIGHTLY** (`ingest.yml` uploads it).
- **`measures.json` is written WEEKLY** (`derive.yml`, the only job that sees the
  whole archive).

So attempts cannot simply ride in `measures.json` and be looked up by the hero:
the hero is **the most recent game**, which changes nightly in season, and the
lookup would miss on most nights. A fallback firing most of the season
reintroduces the very inconsistency this is fixing, intermittently — which is
harder to notice than always.

### 3.1 ⚠️ And the merge hazard, which is the sharp edge

`_write_catalog` merges rather than replaces the document, but within it:

> *"This run's verdicts win outright: a row is REPLACED rather than updated, so a
> stale `r` cannot survive a game that now publishes."*

**A row is replaced wholesale.** So an `attempts` field written by last week's
run is *deleted* for any game a later nightly re-judges — silently, and only for
the games that were touched. A design that writes attempts once and assumes they
persist would rot exactly where the pipeline is most active.

## 4. The proposal

**A node augmentation step that runs AFTER `derive.py` in BOTH workflows, over
the catalog file that run just wrote, using the extracts that run has on disk.**

```
  derive.py            → ingest/catalog.json  (merged with published; rows replaced)
  node <augment>       → adds aa/ha to every row it can measure locally
  upload
```

Why this closes over the merge hazard:

- a game **re-judged this run** has a local extract, so the step re-measures it —
  the replacement row gets its attempts back in the same pass;
- a game **untouched this run** kept its published row through the merge, and its
  attempts came along with it;
- a game **refused or absent** gets no attempts, the field is missing, and the
  hero falls back to the shots sentence and says so.

There is no window in which a row exists with stale attempts.

### 4.1 The claim this makes, and why the nightly is allowed to make it

`test/measure.test.js` asserts that **only the full-archive job may publish the
measurement**, and it is right:

> *"a nightly that wrote measures.json would publish a ranking over a handful of
> games — and a partial ranking is worse than none, because it looks like an
> answer."*

**Per-game attempts are not that kind of claim, and the distinction is exact:**

| | needs the archive? | what it is |
|---|---|---|
| `summarise(records)` — base rates, featured | **yes** | a statement about the collection |
| `measureGame(g)` — one game's counts | **no** | a statement about one game, from one extract |

A game's attempt count is a local fact. It is the same number whether the archive
holds one game or ten thousand, and it cannot be made wrong by which other games
happen to be present. **The existing test must stay exactly as it is** — nothing
here writes `measures.json` from the nightly — and a new test should state the
distinction so the next reader does not have to rediscover it.

### 4.2 What it costs

**+2,378 bytes gzipped on `catalog.json`, 4.0%** — measured by adding two
integers to every in-scope row of the live document and re-compressing, not
estimated. 453,084 → 520,156 raw; 59,223 → 61,601 gzipped. The catalog is fetched
by the home page and the game page, so this is real weight on the front door and
is the price of the hero telling one story.

## 5. What the sentence becomes, and it is a better sentence

Today: *"CAR put more shots on goal, 23 to 22, and won. **That is the usual
outcome.** Across 3,957 games the shot leader wins 54.2% of the time."*

After: the same shape, on attempts — and the archive rate it reaches for is
`moreAttemptsLost`, **54.5%**, which points the other way.

> **The shots version says the leader usually wins. The attempts version says the
> leader usually LOSES.** One is a mild confirmation of what a novice already
> assumes; the other is this site's entire reason for existing.

Everything that makes the current caption work is preserved and must be:
it is **computed, never written**, it is **said both ways round** (Doctrine 9 —
naming the relationship only when the game is the exception is selective
honesty), and it **says nothing when nothing can be said** (a tie in the measure
has no leader).

**The `.herosub` must also name its unit.** "More shot attempts, 94 to 71" is not
"more shots on goal, 23 to 22", and the sentence has to say which it is, because
a reader who carries the box-score meaning across is out by a factor of two.

## 6. Verification

- **A test that the two are the same measure.** Not two tests each pinning its
  own constant — one test asserting the sentence's measure and the loop's layer
  are the same thing, which is the only form that can fail when they diverge.
- **A test that a row re-judged after being augmented still carries attempts**,
  driven through the real merge rather than a fixture that skips it. This is the
  hazard of §3.1 and it is invisible to any check that does not replay a row.
- **A test that a missing attempts field degrades to the shots sentence** rather
  than rendering a blank or a zero.
- **Canaries in both directions** on all of the above, including one that leaves
  the augmentation out of the nightly only.
- **Look at it.** `tools/pixels.sh`, both widths. The suite cannot see whether the
  sentence and the bar say the same number.

## 6.5 ✅ RULED AND BUILT — the message, not the catalog

**CHENG rejected §4 outright and was right.** The frame already holds the extract
and has already run the reducer; the parent needs one number from a game it is
already displaying. Storing attempts in the catalog would have made it carry one
of **our** computed metrics for the first time — today it carries only the
league's quoted numbers — and bought that with weight on every visit.

**But his two alternatives are not equivalent, and the doc should say which.**
He offered postMessage *or* the parent re-fetching the extract "which by then is
an HTTP cache hit". Measured: that extract is **13,023 bytes gzipped**, which is
**5.5× the 2,378 he had just rejected the catalog over** — and the frame carries
`loading="lazy"`, so the ordering that would make it a hit is not ours to assume.
It is postMessage, and the fetch route should not be kept as an option.

**Shipped:** the preview posts `{rtg, game, a, h}` to its parent at its own
origin; the parent accepts it only from the frame it made, at its own origin, for
the game it is showing. The sentence is **absent until it arrives**, which is the
site's idiom rather than a compromise — the verdict card is absent until the horn.

**The cost, recorded:** the hero sentence now depends on the preview frame having
booted. That is a real coupling and it is the one this project has flagged
hardest before. If the frame ever goes, the sentence goes with it.

**And six test files constructed the page bundle separately.** Adding one global
broke three of them against a page that was correct. `test/helpers/page.js` now
builds it in one place for every suite that needs it; the rest were widened. A harness
assembled twice is the same defect as a rule implemented twice.

## 7. What I want ruled

1. **Is the augmentation step in the right place?** It runs after a Python
   builder and edits that builder's output, which is a seam nothing else here
   crosses. The alternative — `derive.py` reading a node-written sidecar — has
   the same number of moving parts and adds a document.
2. **Should the loop's board name its unit** regardless of §5, so "CONTROL" says
   what it counts? It is needed either way and is independent of the plumbing.
3. **What happens to `moreShotsOnGoalLost`?** It stays in `measures.json` and is
   still true. But if nothing on the site shows it any more, it is a published
   number with no reader — which is either fine or a signal.
4. **Does the front door now carry two numbers a novice must hold apart** — the
   attempts sentence here and the shots figure on every game card in the browse
   list? The catalog rows still show shots on goal, correctly.

## 8. The lesson that falls out of this, which Kevin wants kept

Making the two consistent removes a teaching moment that was accidentally on the
page: **a box score counts shots on goal, and 51.9% of attempts never reach the
goalie at all.** That gap is what the blocked-shots layer exists to teach, and
`archive.js::attemptMix` already publishes the number.

Kevin: *"the lesson carried in your second option is worth recording and
surfacing somewhere. Probably in a new card on the Workshop page for blocked
shots?"*

**Recommendation: `what-you-can-see.html`, not the Workshop.** The Workshop page
says what it is for — *"Earlier views, each answering a question the main app
does not"* — and every card on it links to a standalone page. This lesson is
about what the main app **does** show, and *What you can see here* is the page
built to name exactly that, in its "what we count" half rather than its "hockey
rules" half. Placement is a one-line change either way.
