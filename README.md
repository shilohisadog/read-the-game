# Read the Game

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
| `src/` | Self-contained HTML apps. Each one opens standalone — no build, no CDN, no network. |
| `data/` | The extracted game data plus the raw NHL API responses it came from. |
| `builders/` | Python that extracts the raw feeds into `rich.json` and generates the apps. |

### The apps

- **`read-the-game.html`** — the main one. Base view is a plain-language
  auto-narrated replay. Optional layers: **＋Control** (Corsi, with a
  show-me-the-work panel), **＋High-danger** (why *this* chance counted),
  **＋Goaltending** (save percentages building live as you watch).
- **`goalie-eye-view.html`** — first-person from the crease, plus five other
  seats in the building. Same real data, the camera just moves.
- **`terrain-3d.html`** — shot density as terrain. Height is real kernel
  density: *volume, not expected goals.*
- **`active-play.html`**, **`on-the-ice.html`**, **`goalie-view.html`** —
  earlier 2D prototypes, kept for reference.

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
events  [ { per, s, clock, type, own, x, y, actor, goalie, a1?, a2? } ]
shifts  [ { p, t, s, e } ]          // 694 real on-ice shifts
gshots  [ { g, x, y, out, sh } ]    // shots faced, per goalie
goalies [ ... ]
```

## Running it

Open any file in `src/` in a browser. That's the whole procedure. They are
single files with the data inlined, which is deliberate: an app you can save
to disk and still have work is an app that isn't hiding anything.

## License

MIT. See [LICENSE](LICENSE).

NHL game data is the NHL's; it's included here in a single-game excerpt for
demonstration and verification of the methods described above.
