# Read the Game

**[readthegame.co](https://readthegame.co)** — live.

[![gates](https://github.com/shilohisadog/read-the-game/actions/workflows/gates.yml/badge.svg)](https://github.com/shilohisadog/read-the-game/actions/workflows/gates.yml)
[![deploy](https://github.com/shilohisadog/read-the-game/actions/workflows/deploy.yml/badge.svg)](https://github.com/shilohisadog/read-the-game/actions/workflows/deploy.yml)
[![ingest](https://github.com/shilohisadog/read-the-game/actions/workflows/ingest.yml/badge.svg)](https://github.com/shilohisadog/read-the-game/actions/workflows/ingest.yml)

A hockey **replay theater for the novice fan** — someone who loves the
excitement but can't yet *read* the game.

Not a puck tracker. A tool that makes the hidden game legible: why that
shift mattered, why the team that got outshot won, what "danger" actually
means when someone says a chance was dangerous.

Everything here is computed from the NHL's public event feed, in your
browser, with no server and no external libraries. You can read the code and
check the math. That's not a nice-to-have — see [DOCTRINE.md](DOCTRINE.md),
which is the actual product.

## The example game

`2023020204` — **Minnesota @ Buffalo, 2023-11-10. Final: BUF 3, MIN 2.**

Picked because it teaches the single most useful lesson a new fan can learn:

> Minnesota outshot Buffalo **35–25** and lost. Devon Levi stopped 33 of 35
> (.943); Filip Gustavsson stopped 22 of 25 (.880).
>
> **The score is an outcome, not a description of the game.**

Everything in this repo is a different way of making that visible.

## What's here

| Path | What it is |
|---|---|
| `src/` | Self-contained HTML apps. Each one opens standalone — no build step, no bundler, no library. The files ask for nothing beyond their game data; the live site's host injects a Cloudflare Web Analytics beacon, which is named in each page's Content-Security-Policy. |
| `data/` | The extracted game data plus the raw NHL API responses it came from. |
| `builders/` | Python that extracts the raw feeds into `rich.json` and generates the apps. |
| `src/lib/` | The analysis tier: pure reducers over the event stream. No DOM, no network, no filesystem — the same modules run in the browser and in the pipeline, so a number cannot mean two things. |
| `test/` | Both suites. The JS half boots the real shipped bundle against a fake document. |
| `docs/` | The design record — including the measurements, and the findings that were **withdrawn** with the evidence that killed them. |

### The apps

- **`read-the-game.html`** — the main one. Base view is a plain-language
  auto-narrated replay. Five optional layers, each with a show-me-the-work
  panel that accounts for **every** event as counted or excluded-with-a-reason:
  **＋Control (Corsi)**, **＋Shots from the slot**, **＋Goaltending**,
  **＋Why play stopped**, **＋Blocked shots**.

  > *Not "high-danger".* Ours is a pure location test — inside 33 ft of the net
  > and within ±22 ft of centre, no rush bonus, no shot-quality weighting — and
  > published definitions elsewhere score attempts differently. A reader who
  > looked ours up would conclude we were **wrong** rather than **different**,
  > so the label says what the rule does and borrows nobody's authority.
- **`goalie-eye-view.html`** — first-person from the crease, plus five other
  seats in the building. Same real data, the camera just moves.
- **`terrain-3d.html`** — shot density as terrain. Height is real kernel
  density: *volume, not expected goals.*
Three earlier 2D prototypes — `active-play`, `on-the-ice` and `goalie-view` —
were removed on 2026-09-03 rather than left standing as things a reader would
reasonably assume were current. They are in the history if you want them, and
what each one taught is recorded in [docs/status.md](docs/status.md) §B8.

## Data

**Source:** the NHL's public web API. No key required.

```
https://api-web.nhle.com/v1/gamecenter/2023020204/play-by-play
https://api-web.nhle.com/v1/gamecenter/2023020204/boxscore
https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=2023020204
```

The raw responses are committed alongside the extract so that "show me the
work" is checkable by a stranger, not just assertable by us.

### Things the feed will lie to you about

These are real, verified against the boxscore, and every one of them is
handled in the extraction. They're documented here because anyone building on
this feed will hit them:

- **Blocked shots are credited to the shooter, not the blocker** — despite what
  a lot of older documentation says. On this endpoint `eventOwnerTeamId` is the
  shooting team on all 44 blocks in this game, checked against `rosterSpots`.
  Older NHL endpoints did credit the blocker, which is where the folklore comes
  from, so verify it against the feed you're actually using rather than trusting
  a write-up. Do not "correct" it by flipping.

  > We got this wrong. An earlier version of this file claimed the opposite and
  > offered as proof that 38 of 44 blocks were recorded in the blocking team's
  > defensive zone. That statistic is true and proves nothing — `zoneCode` on a
  > block is recorded from the defending side, so it says nothing about who the
  > event is credited to. A true number was presented as evidence for a claim it
  > could not support, and the one query that would have settled it was never
  > run. The app shipped a Corsi count built on the flip. See
  > [docs/main-app-rework.md](docs/main-app-rework.md).
- **The running SOG counter excludes goals.** Official shots on goal =
  shot-on-goal events **+** goals. Getting this right is what reproduces the
  boxscore's 35–25.
- **Teams switch ends every period.** Coordinates must be normalized using
  each period's `homeTeamDefendingSide` before anything spatial means
  anything.
- **`timeInPeriod` is elapsed, not remaining.** Absolute seconds =
  `(period − 1) × 1200 + mm × 60 + ss`.

### `rich.json`

The master extract. Everything the apps render comes from here.

```
teams   { home, away: { id, ab } }
roster  { playerId → { n, nm, pos, tid } }
events  [ { per, s, clock, rem, type, own, x, y, actor, goalie,
            sit, pt,                    // strength code; period type
            a1?, a2?,                   // assists, on a goal
            blk?, miss?,                // blocker; why a shot missed
            pen?, min?, sev?, drew?,    // the penalty, and who drew it
            rsn?, rsn2?, zone? } ]      // why the whistle went, and where
shifts  [ { p, t, s, e } ]
gshots  [ { g, x, y, out, sh } ]    // shots faced, per goalie
goalies [ ... ]
quoted  { home, away }              // the league's own boxscore line
sides   { period → homeTeamDefendingSide }
```

⚠️ **`builders/extract.py` is the definition, not this block.** There is
deliberately no schema file: a declared field list is a second statement of the
truth, free to drift from the extractor that actually produces the data. If this
and the extractor disagree, the extractor is right and this is a bug — see
[CONTRIBUTING.md](CONTRIBUTING.md) rule 7, and `test/fixtures.test.js` for how
drift is actually caught.

## Running it

Open any file in `src/` in a browser. That's the whole procedure. They are
single files with the data inlined, which is deliberate: an app you can save
to disk and still have work is an app that isn't hiding anything.

## Working on it

**Node 20+ and Python 3.10+. Nothing to install** — the site ships zero runtime
dependencies and the suites are `node --test` and `unittest`.

```
npm run gates      # everything CI runs
npm test           # the JS suite alone
npm run test:py    # the Python suite alone
```

`gates` builds the site, runs both suites, checks that every documentation
citation resolves and that the generated figures in `docs/` are not stale,
re-runs the extractor's gates against stored feeds, and rebuilds to confirm the
output is **byte-identical**. Exit 0 means `src/` is reproducible from source.

**`src/*.html` is generated — never edit it.** `builders/*.py` is the source.

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — what counts as a valid check here.
  Read this before writing a test; the bar is unusual and most of it is about
  checks rather than code.
- **[docs/architecture.md](docs/architecture.md)** — the shape of the system,
  the one place that shape breaks, and the decisions that look like oversights
  and are not.
- **[DOCTRINE.md](DOCTRINE.md)** — what this site will and will not claim.

## License

MIT. See [LICENSE](LICENSE).

NHL game data is the NHL's; it's included here in a single-game excerpt for
demonstration and verification of the methods described above.
