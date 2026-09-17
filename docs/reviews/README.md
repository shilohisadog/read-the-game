# Reviews — a person judges what the machine found

The acceptance stage of [the test program](../test-program.md) (§5, S3). A batch of
commits is rendered before and after in real Chromium by `tools/gallery.mjs`; every
difference a visitor could see goes on a sheet; **Kevin answers one question per
item — is the after side wrong?**

**Why the machine spots and the person judges.** In the blind review of planted
defects ([survivorship experiment](../survivorship-experiment.md) §5) Kevin noticed
7 of 13 visual differences — missing a one-word change, and a 4,214px one while
catching a 21px one — and, having noticed one, picked the planted side 6 of 7
times. A person is a poor spotter and a good judge.

## When

- **Before beta** (Kevin's ruling, test-program.md §5.1): nothing waits. A change
  ships through the release gate, and the batches are reviewed **afterwards**.
- **At beta:** Kevin becomes the required reviewer before production.

## How

```
node tools/gallery.mjs            # docs/reviews/LAST .. HEAD → docs/reviews/<today>/review.md
```

Playwright lives outside the repo, where `tools/pixels.sh` installs it. Each batch
is a folder: `review.md` (the sheet, answered in place), `img/` (before/after crops
with the changed area outlined), `run.json` (what was rendered). When a sheet is
judged, every `y` becomes a defect with its fix, and `LAST` moves to the batch's
head commit.

## What it can and cannot see

- ✅ Every page in `src/` at 1400×900 and 844×390; the game page at the 37 replay
  states of the survivorship record, on the reference game (MIN at BUF,
  `2023020204`). Pages are served byte for byte as committed, CSP included; the
  data is one snapshot served to both sides, so **every difference is the code's**.
- ✅ Visible text (line diff), pixels (regions), the document (ids and classes added
  or removed), and new console errors.
- ✅ **It checks itself on every state** — the later commit is rendered twice, and a
  state that differs from itself is listed as *could not be compared*, never asked
  about. ⛔ It sampled one state in five until batch 1, where `terrain-3d.html` (a
  WebGL chart redrawn every animation frame, touched by no commit) differed from
  itself on 3 of 3 re-runs, fell outside the sample, and reached the sheet as a
  question. The cause was the tool's: its clock still ran in real time between
  steps, so the number of animation frames varied. Paused, 10 of 10 renders of that
  page were identical.
- ⚠️ **A page that changes height** is aligned row by row, so what only moved is not
  called a change. Content that moves by a fraction of a pixel is redrawn slightly
  differently and matches nothing — on batch 1's front door, as strongly (up to 240
  of 255) as the real change — so no threshold is used: a band at a nonzero offset
  with its height unchanged is counted as *moved* and not shown. ⛔ **A style change
  inside content that also moved is missed**, and the sheet says so wherever that
  happens; its words are still compared.
- ⛔ A changed **number** — both sides read the same published data. Numbers are
  gated by `tools/published_ranges.py` before every sync.
- ⛔ A state no walk visits: clicks, gestures, the Tabletop figure style
  (test-program.md §7.2), and motion — the clock is paused and advanced the same
  10 s on both sides, and one frame is shot.

## The instrument was seen to work — 2026-09-17, at `b8da207`

The final runs, after every fix below was in:

| run | expected | seen |
|---|---|---|
| the front door, a game state and `terrain-3d.html`, each against itself | nothing | 6 states, 0 differ; the front door and the game page checked by eye as fully drawn with data |
| one word planted in the front door (`something` → `anything`) | a text item | 1400×900: text diff + a 520×60px region; 844×390: **document only** — that note is hidden at that width |
| one style rule planted in the game page (`.sc` weight 800 → 400) | a pixel-only item | both viewports, both scores outlined, no text diff |
| batch 1, `2ef986a..b8da207` | the hero change visible; the counters' removal invisible | **1 item** (the front door), **4 document-only** groups (every game state: the counters' ids and classes gone, nothing on screen); 0 of 100 states differed from themselves |

**What the first three batch-1 runs got wrong, each fixed before the sheet was shown:**
`terrain-3d.html` reached the sheet as a question though no commit touched it —
the self-check sampled one state in five, and then, checking every state, the page
still passed its own check and differed from the other side. The cause was the
tool's clock running in real time (above). The front door's frame was labelled by
its full URL, so a different hero game listed every id in it as removed and added.
And the phone front door showed 22% of the page as one crop, because the page was
23px shorter and everything below had moved (above).

And `test/gallery.test.js` holds the arithmetic between capture and sheet — each
of three planted breaks (a pixel-only difference dropped, a new console error lost,
separate hunks merged) turned its own test red, and so did letting a state that
differs from itself through to the judge.
