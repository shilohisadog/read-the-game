# On the ice — from a list of names to what happened while they were out there

**Kevin, 2026-08-17:**

> *"On the 'On the ice' page, we list the players on the ice for the whole game,
> let's brainstorm how to maximize the education and/or interactivity of that
> page… maybe data popups tied to the players, or game statistics per player (if
> that data is available)."*

> *"[Zone starts] would be something a casual fan would want to learn about."*

Everything below is **measured from the reference game and a 230-game sample of
published extracts**, not proposed from memory. Where a number is from one game
it says so, because one game is not a tendency.

---

## 1. The organizing idea

The page answers **"who was out there."** Every worthwhile addition is the same
next question: **"what happened while they were out there."**

That is the Control layer applied to a person instead of a bench. It is counting
rather than modelling, and it is a concept the site already teaches — so it costs
a novice no new vocabulary.

## 2. What the data supports, with the numbers

### 2.1 The most educational fact on the page is not about a player

> **688 shifts, average 51.3 seconds** (reference game).

A novice assumes players stay out there. They do not, and the page is already
holding the proof without saying it.

### 2.2 Per player, all countable

| | TOI | shifts | avg | longest | on-ice attempts |
|---|---|---|---|---|---|
| Dahlin | 26:19 | 28 | 56s | 2:06 | **31 for / 37 against** |
| Brodin | 23:31 | 27 | 52s | 1:35 | 30 / 24 |
| Spurgeon | 21:52 | 31 | 42s | 1:23 | 30 / 22 |

**Dahlin is the row to build the page around.** More ice than anyone and
underwater — the site's own thesis at the level of a person: he was excellent,
his team was being outshot, and the number does not say which.

Also available and honest: individual shots, hits, blocks, giveaways, takeaways
and assists (`actor`, `blk`, `a1`, `a2`); **linemates** as shared seconds, which
is how a novice learns what a "line" or a "pair" is; and **who was on the ice for
each goal** — checked, it resolves cleanly to ten skaters and two goalies.

**One pairing worth building deliberately:** a player's on-ice **goals** (one or
two events) beside their on-ice **attempts** (~68). That is *which number counts*
taught in a single row, with the sample size visible rather than explained.

## 3. ⭐ Zone starts — yes, and cleanly

**All 55 faceoffs in the reference game carry coordinates, and across the
230-game sample it is 12,864 of 12,864 — 100%.** There is no zone *field* in the
extract and none is needed: the coordinate **is** the dot.

They land on the real dots and nowhere else:

| dot | faceoffs (reference game) |
|---|---|
| ±69, ±22 — the four end-zone dots | 41 |
| 0, 0 — centre | 10 |
| ±20, ±22 — neutral zone | 4 |

**There is no threshold to choose.** End-zone dots sit at \|x\| = 69, neutral at
\|x\| ≤ 20, the blue line at 25. The dots are discrete, so "which zone" has no
boundary case to argue about and no constant that can drift.

### 3.1 What it is for, and why it is not the modelling we refuse

| | OZ | DZ | NZ | OZ% | on-ice attempts |
|---|---|---|---|---|---|
| **Kaprizov** | 16 | 4 | 3 | **80%** | **48 for / 20 against** |
| Dahlin | 11 | 7 | 8 | 61% | 31 / 37 |
| Spurgeon | 9 | 11 | 6 | 45% | 30 / 22 |
| **Power** | 5 | 12 | 4 | **29%** | **22 / 29** |

**This is the missing context for on-ice attempts, and it arrives with nothing
modelled.** Kaprizov was sent out to attack and the attempts followed; Power was
sent out to defend and was underwater. Two columns side by side, and the reader
draws the connection.

That is the standing rule — *show the distance from normal, never supply the
inference*. What we must NOT build is a zone-start-**adjusted** attempt number:
that is a model, it hides its own assumptions inside a single figure, and it is
the thing this project refuses everywhere else.

**And the data argues against its own easy reading, which is what keeps it
honest.** Dahlin started 61% in the offensive zone and was still 31–37. A reader
cannot come away with "good zone starts → good numbers", because the table
contains the counterexample.

### 3.2 Three precisions the label has to carry

1. **It is "on the ice for the faceoff", not "the shift began there."** The
   stricter version needs a time window, and a chosen constant with no source in
   the data is the shape that has been killed twice already. The version with no
   constant is the one to ship, and the label must say which it is.
2. **Zone is relative to the bench.** The same dot is offensive for one team and
   defensive for the other. `attackDirection` in `src/lib/rink.js` already
   decides this and must be imported, never restated — it is the same function
   the slot layer uses.
3. **One game is a deployment note, not a tendency.** Dahlin's 61% is 11 of 18.
   The raw counts belong on the row beside any percentage, which is the
   invariant the whole site runs on.

**Unchecked and worth checking before building:** these counts include special
teams, so a penalty-killer collects defensive-zone starts by definition. `sit` is
on every event, so an even-strength split is available if it earns a column.

## 4. ⭐ The page is pinned to one game for no data reason

`builders/build_B.py` compiles `data/rich.json` — the reference game — into
`on-the-ice.html`. That is why it is a Workshop card described as "pinned to one
game".

**But shifts are in the published extracts.** 846 in the Cup final, and **227 of
230 sampled extracts carry them.** The page could run on any of the 4,417
published games with the same fetch `game.html` already makes.

This reframes "the Workshop items need updating": this one does not need
updating so much as **releasing**.

### 4.1 The three that do not, and they are not random

| game | date | |
|---|---|---|
| `2024021251` | 2025-04-10 | DET @ FLA |
| `2024021270` | 2025-04-12 | WSH @ CBJ |
| `2024021288` | 2025-04-14 | UTA @ NSH |

**All regular season, all inside five days, all with normal event counts
(324–335).** That is a clustered outage on the shift endpoint, not a property of
those games — which means it is probably repairable by a targeted backfill rather
than a permanent hole, and the page must say "we do not hold the shift chart for
this game" rather than render an empty rink.

## 5. The artifact that is also the lesson

Second by second, the feed says **5v5 for 70.0%** of the reference game — which
is what a real game looks like. It also says **7v5 for 22 seconds**, which is
impossible.

That is the shift chart recording a changing player as on the ice until he
reaches the bench. **Show it, with the reason.** Same principle as the puck
hopping between real events: the discreteness is the honesty, and here the
artifact teaches exactly what a novice most needs — that hockey substitutes on
the fly and never stops for it.

## 6. What to refuse

- **Any adjustment** — zone-start, quality-of-competition, or otherwise.
- **Any rating.** No "good"/"bad", no rank without its denominator.
- **Any "so he is…" sentence.** On-ice attempts are driven hard by deployment,
  which is precisely why deployment is shown as its own column instead of being
  folded into the number.

## 7. Verification this will need

- **One test that on-ice membership is the shift chart's answer**, not a
  reconstruction — driven against a real extract, with the 5v5 share asserted to
  be in a plausible band rather than pinned to a value.
- **A test that a game with no shifts says so** rather than rendering a page that
  looks like nobody played. The three games above are real fixtures for it.
- **A test that zone is read through `attackDirection`** — a mutation flipping
  home and away must fail, or the column is right by luck on one bench.
- **A test that the counts sit beside every percentage.**
- **Look at it.** `tools/pixels.sh`, both widths, since none of the above sees a
  pixel.

## 8. What I want ruled

1. **Does this stay a Workshop page or become a main-app view?** Everything in §4
   argues it is too useful to leave filed under "earlier views, each answering a
   question the main app does not" — it answers a question the main app *should*
   ask. But that is a product call.
2. **Is the interaction a popup, a selected row, or a timeline?** The shifts are
   intervals; a per-player timeline is the shape the data actually has, and a
   popup is the shape a table suggests.
3. **Do the shifts become doors?** A shift is a moment, and `?at=` exists. A
   click could open the main app at the second that shift began, which is the
   same thing `what-you-can-see.html` needs and does not have.
4. **Even-strength split for zone starts — one column or two?**
