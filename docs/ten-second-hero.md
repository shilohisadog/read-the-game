# The ten-second hero

Three changes to the front door and the replay, shipped together on
2026-08-25. Written for review: **every claim below names the file and line it
comes from, or the measurement that produced it.** Read it beside the code.

| | |
|---|---|
| gates | green (`npm run gates`, exit 0) |
| suite | 685 JS + 180 Python |
| mutations | 16, every one seen to fire |
| population | 4,192 in-scope games (`v==1`, gameType 2/3), three seasons, **census not sample** |

---

## 1. The page no longer states how the game ends

`src/app.js:918` — the game line above the rink read
`… · final MIN 2–3 BUF` at first paint. It now reads `MIN at BUF · 10 November 2023`.

**The argument is the incoherence, not new doctrine.** The opening frame had
already been moved earlier *twice* for exactly this reason, and
`src/app.js:1663` records both moves: off the last event (*"defaulting to the end
kinda spoils the surprise"*), then off the opening faceoff, which named the
winner of a draw before the game had started. Then this line printed the result
anyway.

Nothing is hidden. The scoreboard fills in from 0-0 as the game plays, and the
verdict card states the result at the horn.

**The one-line version of this fix would have been theater.** The score is also
printed by `builders/build_index.py` at lines 604, 623, 624, 723 and 1376 —
including the front-door hero. The line drawn instead:

> The score appears where the visitor **asked** for a game, not where a game was
> handed to them.

Browse lists keep it — browsing is a choice, and a reader may well be looking for
that 6-5 game. The hero (`build_index.py:807`, was `g.a + g.as + …`) and the game page do not.

**The residue is closed.** It was flagged here as *"the hero withholds the
margin, not the outcome"* and left as a decision about the thesis sentence.
Kevin made it, reading the deployed front door:

> *"VGK took more shot attempts, 50 to 44, and lost … i.e. we still give away
> the outcome of the game."*

`sayHero` no longer names the result, and the pitch is **stronger as a question
than as a statement**. It used to raise a tension and resolve it in the same
breath — *"… and lost. That is the usual outcome."* — leaving the button nothing
to answer. It now reads:

> VGK took more shot attempts, 50 to 44.
> Across 4,100 games in this archive the team with more shot attempts **loses
> 54.3% of the time.**

The `That is (not) the usual outcome` line went with it, because classifying
*this* game against the rate is what stated the result.

**And a condition retired with its reason.** A level game used to get silence,
because there was an outcome to classify and a draw could not be classified. The
caption classifies nothing now, so the only thing that can withhold the rate is
having no attempts leader. `test/homepage.test.js` says which condition went and
why, rather than deleting it quietly.

**Doctrine §9 is now satisfied structurally rather than by symmetry.** The
leader losing had to be said in the same shape as the leader winning, or the site
would be showing only the surprising half. Neither is said, so there is no half
to select.

### What guards it

`test/smoke.test.js` — *the final score is absent at first paint and present at
the horn*. Two properties worth checking:

- The expected `2–3` is **counted from `data/rich.json`**, not read off the app.
  Asking the app for the final score and then looking for it is one path to the
  expected value and would move both sides together under a mutation.
- **Both directions.** "The score is absent" is satisfied by a page that never
  shows a score at all, which is a worse bug and invisible to a one-sided test.

---

## 2. The hero runs to a goal and stops

Kevin: *"we should show the goal during the first ten seconds of the hero game —
that's where the most visualization takes place"*, then *"let's end the hero
replay right after the goal"*.

He is right about the renderer, and I was wrong to doubt it before checking: a
goal is the only event with a real treatment — radius 3.2 against 1.7
(`app.js:509`), a 0.7s flare from 3.6× (`app.css:237`), a 1.3s net flash
(`app.css:207`), the siren caption (`app.js:710`).

**The obvious implementation is the wrong one.** Starting the preview *at* the
goal breaks what the preview exists to demonstrate — `app.js:1796`: *"a counter
you join at 24-11 is a number you did not watch being built."* So the goal has to
come to us.

### The loop

`src/app.js:1886-1906`. `BUDGET_MS` stops being the loop's length and becomes its
bound:

```js
const BUDGETED=Math.max(START,W);
const GOAL=(()=>{for(let k=START;k<=BUDGETED;k++)
  if(EV[k]&&EV[k].type==='goal')return k;return -1;})();
const WINDOW=GOAL>=0?GOAL:BUDGETED;
```

Both ends of the loop are now the data's: the opening frame is the last one on
which the count is still zero (`app.js:1881`, unchanged), the closing frame is
the first goal. `GOAL_HOLD_MS=2600` (`app.js:1921`) so the restart does not cut
the 2.2s caption off mid-sentence.

### The field

`builders/derive.py:152`. Stored on the catalog row as `hl`, written by **both**
derive paths — `derive.py:573` (unchanged fast path, recomputed from the stored
extract) and `derive.py:597` (fresh). The unchanged path matters: a field derived
only on the fresh path is a field every game loses on the next nightly.

```python
def _hero_loop(events):
    first_att = None
    n = 0
    for e in events or ():
        if e.get("pt") == "SO" or e.get("type") in PLAYABLE_SKIP:
            continue
        t = e.get("type")
        if first_att is None and t in ATTEMPT_TYPES:
            first_att = n
        if t == "goal":
            if first_att is None:
                return None
            return n - max(0, first_att - 1)
        n += 1
        if first_att is not None and n - max(0, first_att - 1) > HERO_LOOP_CAP:
            return None
    return None
```

**Three things here are worth attacking.**

1. **`hl` is an estimate, and the error is one-sided.** The real opening frame
   comes from corsi's even-strength `counted` set; this counts the first attempt
   of *any* strength. A game opening on a power-play attempt starts **later** than
   this estimates, so the true loop is never longer than `hl`. Running the
   layer's reducer in Python would be a second implementation of it. The reader's
   floor of 3 absorbs the difference.
2. **The vocabulary is spelled twice** — Python here, JavaScript in `app.js:17`
   and `src/lib/`. Guarded three ways by `test/hero-loop.test.js`, which compares
   `PLAYABLE_SKIP` against `NOT_A_PLAY` (imported from `src/lib/layer.js`) and
   `ATTEMPT_TYPES` against the set imported from `src/lib/attribution.js` — the
   **modules**, not a restatement of them in the test.
3. **`HERO_LOOP_CAP = 30` is a storage bound, not the preview's.** Every visitor
   fetches the catalog; uncapped, this is 40 KB of a 452 KB document describing
   games no selector reaches for. The window lives in the reader, where changing
   it is a rebuild rather than a re-derivation of 4,553 games.

### The reader

`builders/build_index.py:687`:

```js
var HERO_LOOP = { min: 3, max: 8 };
```

### ⚠️ My first criterion was measurably wrong, and only measuring caught it

Selecting on the goal's **raw index** looks obvious and is useless, because the
preview does not start at play zero:

| criterion | games | loop p10 | median | p90 |
|---|---:|---:|---:|---:|
| goal within 12 plays *(first attempt)* | 802 | 1 | **5** | 10 |
| goal within 16 plays | 1,049 | 1 | 7 | 13 |
| **loop of 3–8 plays** *(shipped)* | 409 | 3 | 5 | 8 |

A median loop of five plays and a p10 of **one** is a front door that flashes a
goal before the reader has looked at it.

### What the window costs in freshness

Days behind "the newest game", measured by walking the archive's own timeline:

| window | ~seconds | pool | median lag | p90 | p99 |
|---|---:|---:|---:|---:|---:|
| [4, 6] | 8–11s | 196 | 1 day | **7** | 48 |
| [3, 7] | 6–13s | 337 | 0 days | 4 | 26 |
| **[3, 8]** | **6–15s** | **409** | **0 days** | **3** | **20** |
| [2, 8] | 4–15s | 486 | 0 days | 2 | 20 |

Ten seconds sits in the middle of the shipped row, and it is where the cost stops
being free — tightening one play each way triples the p90 staleness.

### ⚠️ And it broke a true sentence

The kicker above the rink was a fixed string in the markup reading *"The most
recent game in the archive"* — true for exactly as long as the hero **was** the
most recent game. **Only the screenshot caught it.** It is now written by
whichever branch fired (`build_index.py:767`), and `hero()` returns
`{game, toGoal}` rather than a bare row so the caller can say something true.

### Verified in a real browser

The unit test drives a fake DOM with a captured `setTimeout`, which is a
different instrument from real timers. Playwright, 1100px, the live local build:

```
frames visited:  2 3 4 5 6 | 1 2 3 4 5 6 | 1 2 3 4 5 6 | 1 2 3 4 5 6
ended on 6 goal  class: ev fig goal cur a flare      ← every cycle
                 ~10 seconds per loop
```

### Deployment

`derive()` walks every game it holds raw for — *"Derivation has no window of its
own -- it walks the archive"* (`derive.py:506`) — so the next run backfills `hl` across all 4,553 rows.
No migration. Until then every row lacks the field, `hero()` falls back to the
newest game, and the kicker says the older, still-true thing.

---

## 3. The moment of arrival

Every play arrived identically — one `pop`, 0.34s, one easing — with a single
exception for the goal. A hit, a giveaway, a takeaway and a blocked shot all
simply *appeared*. The goal treatment proved the idea and was never generalised.

`src/app.js:39`:

```js
const ARRIVE={goal:'flare',hit:'jolt','blocked-shot':'halt',
              giveaway:'slip',takeaway:'snatch'};
```

`src/app.css:251-258` — the four new ones, as **two pairs of opposites**, because
a contrast teaches where a lone flourish decorates:

```css
#rg .jolt{animation:jolt .26s cubic-bezier(.9,0,.1,1)}
@keyframes jolt{0%{transform:scale(.4);opacity:.35}40%{transform:scale(1.65);opacity:1}70%{transform:scale(.88)}100%{transform:scale(1)}}
#rg .halt{animation:halt .3s cubic-bezier(.05,.85,.15,1)}
@keyframes halt{0%{transform:scale(2.9);opacity:.25}62%{transform:scale(1);opacity:1}74%{transform:scale(.9)}100%{transform:scale(1)}}
#rg .snatch{animation:snatch .28s cubic-bezier(.3,0,.2,1)}
@keyframes snatch{0%{transform:scale(2.3);opacity:.2}55%{transform:scale(.8);opacity:1}100%{transform:scale(1)}}
#rg .slip{animation:slip .55s ease-in-out}
@keyframes slip{0%{transform:scale(1.55);opacity:0}45%{opacity:.7}100%{transform:scale(1);opacity:1}}
```

- **`jolt`** — a hit. Lands hard and recoils: fast in, overshoot, settle.
- **`halt`** — a blocked shot. Comes in fast and stops dead, no overshoot, a
  squash on contact. The puck was stopped exactly there.
- **`snatch`** — a takeaway. Pulled inward, decisive, a tight undershoot.
- **`slip`** — a giveaway. The only one with no snap at all.

**It invents nothing.** The event type is recorded by the league on every play.
This is the opposite standing to anything drawn in the interval *between* two
events, where the honest answer is that we do not know.

**And it is the teaching, not decoration.** A novice does not know a takeaway is
good and a giveaway is bad. The captions say so to whoever reads them; a snatch
and a slip say so to everyone.

**Five, not nine.** Everything unlisted keeps `pop`. A rink where every mark has
its own flourish is one where none of them mean anything.

### What guards it

`test/arrival.test.js`, two tests, and the split matters:

- The expected mapping is **hand-written in the test**, not parsed out of
  `ARRIVE`. Reading the map and checking the page agrees with it is one path.
- **The classes are checked against the stylesheet.** A class naming an animation
  the CSS does not define renders *nothing* while every DOM assertion about it
  passes — the shape this project shipped once already with an SVG mask whose
  probe read `opacity="0.42"` off an element drawing nothing.
- The walk is over the whole game with a tally tripwire, because every assertion
  sits inside a loop a dead play loop would skip entirely.

### What I could not check

The classes fire in a real browser — `ev excl cur x jolt` landed on a hit at
1100px. But **whether these read as distinct, and read as hockey rather than as
decoration, is a judgement no test and no screenshot can make.** That one is
open.

---

## The gate that could not have gone red

Worth its own note, because it is this project's standing failure mode committed
inside the guard written to prevent it.

`test/index.test.js:340` — *EVERY FIELD derive.py PUTS ON A CATALOG ROW HAS A
READER* — was built after D10, a field written for a purpose no reader served. It
takes its field list by slicing `derive.py` from the `row = {"id"…}` literal.

**`hl` is contributed by `**_hl(...)`, a helper outside that slice.** The scan
would have reported a clean sweep while the catalog carried an unread field.
Found by asking what its denominator was on the smallest input that would
execute it — *not* by it going red, because it could not go red.

Widened at `test/index.test.js:369` to also scan helpers returning row fragments,
with a tripwire on the extractor itself, and the mutation was seen to fire.

---

## Also changed

`tools/pixels.sh` fetched exactly one extract, chosen by a **copy** of the
homepage's "most recent viewable game" rule. The moment the hero stopped being
the most recent game that copy pointed at the wrong file, the fetch would 404,
and the harness would report geometry for a page that never booted. It now
fetches a window of 40 and computes `hl` by **importing `builders/derive.py`**
rather than restating it — a tool that restates the rule it is meant to observe
breaks silently the day the rule moves.

The extract fetch also stopped being cache-if-present, which contradicted the
doctrine in the comment eight lines above it.

---

## Open, and not claimed clean

- **Do the arrivals read?** Nobody has watched a novice see them.
- **One transient 404** on the index at 390px, seen in the pixels harness, not
  reproducible, not identified. It does not affect boot — the page renders at
  both widths — but it is not explained.
