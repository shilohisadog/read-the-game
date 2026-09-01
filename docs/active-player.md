# The active player, in the main replay — audit and a proposal

**Written 2026-09-01 for CHENG's review. Nothing here is built.**

Kevin: *"I was looking at 'Workshop' and had forgotten we have the player that's
attributed to each event (which is what 'Active Play' shows), that might be a
good idea to integrate into our main game replay, smaller font, right above the
scrubber and below the play controls, we can also put a toggle to turn that
'layer' off."*

Every figure below was measured on 2026-09-01 against the seven fixture games in
`test/fixtures/extracts/` (2,496 events) and in a real Chromium at 390×900 and
1400×900. Nothing is quoted from memory.

---

## 1. The short version

The data is already on the page, the renderer already knows how to draw it, and
the coverage is far better than the raw event stream suggests. **The risk is not
feasibility. It is that `actor` means a different relationship on every event
type, so a bare name is ambiguous on three of the four commonest frames** — and
this repo has already shipped a wrong claim from exactly that confusion.

That turns the risk into the feature: the line has to carry **the verb**, and the
verb is the teaching.

---

## 2. What already exists

| piece | where | state |
|---|---|---|
| `roster` on every extract | `extract/<id>.json` | shipped |
| `R[e.actor]` → `#11 Staal` | `src/app.js:894` (`caption`) | shipped, three event kinds only |
| the same, in the why-popup | `src/app.js:1723` | shipped, on click |
| a full prototype | `src/active-play.html` (`builders/build_A.py`) | shipped, workshop only, reference game only |

**Nothing new is fetched.** The game page already downloads `roster` and already
binds it (`const R=G.roster`, `src/app.js:27`). This is a rendering change, not a
pipeline change — no new artifact, no re-extraction, no change to
`builders/extract.py`.

---

## 3. Coverage — measured

### 3.1 On the timeline the replay actually shows

The replay walks the **playable** timeline (`playable()` / `NOT_A_PLAY` in
`src/lib/layer.js`), which already drops stoppages, period boundaries and delayed
penalties. Coverage differs sharply between the raw stream and the frames a
viewer sees:

    all events                2,065 of 2,496 carry an actor   82.7%
    frames the replay SHOWS   2,065 of 2,069                  99.8%

Every event dropped for lacking an actor was already being dropped for being
unplayable. **The four gaps in seven games are two `shootout-complete` and two
`penalty`.**

### 3.2 By event type, on the playable timeline

| type | frames | named | |
|---|---|---|---|
| faceoff | 443 | 443 | 100% |
| shot-on-goal | 392 | 392 | 100% |
| hit | 380 | 380 | 100% |
| blocked-shot | 253 | 253 | 100% |
| missed-shot | 228 | 228 | 100% |
| giveaway | 150 | 150 | 100% |
| penalty | 98 | 96 | 98.0% |
| takeaway | 77 | 77 | 100% |
| goal | 46 | 46 | 100% |
| shootout-complete | 2 | 0 | 0% |

**Zero of 2,065 actors are missing from their own game's roster**, and zero of
280 roster entries lack a name or a sweater number.

### 3.3 What the page shows today

`captioned(e)` (`src/app.js`) fires on goal, penalty, a power-play ending, an
icing restart, an offside restart, and — only with the slot layer on — a slot
shot. Of those, only **goal** and **penalty** name a player.

    frames with a named player                    2,065
    frames where the page already shows the name    144   (goal 46 + penalty 98)
    frames carrying a name the page never shows   1,921   = 92.8%

**That is the size of the gap Kevin found.**

---

## 4. ⚠️ The central risk, and it is not coverage

`ACTOR` in `builders/extract.py:41` maps each type to a *different* field. The
name is not "who did this"; it is a different relationship each time:

| type | `actor` is | a bare name reads as |
|---|---|---|
| faceoff | `winningPlayerId` — the **winner** | either taker |
| hit | `hittingPlayerId` — the **hitter** | either player |
| blocked-shot | `shootingPlayerId` — the **shooter** | shooter *or blocker* |
| shot-on-goal / missed-shot | the shooter | (unambiguous) |
| goal | the scorer | (unambiguous) |
| penalty | `committedByPlayerId` — the **offender** | offender *or the player fouled* |
| giveaway / takeaway | the player | (unambiguous) |

**On the four commonest types — faceoff, shot, hit, blocked shot, 1,468 of 2,069
frames (71%) — three are ambiguous without a verb.** Blocked shot is the worst:
`actor` is the shooter while the *coordinate* is the blocker's position
(`src/lib/figures.js:20-24`), which is precisely the confusion that shipped a
wrong flagship number once already (see `verify-inherited-claims`, and the
`own`-means-four-things finding in `restart-frames-and-k1`).

**So the proposal is not "show the name". It is "show the sentence".**

### 4.1 And we can afford the sentence

    blocked shots with a named blocker as well as a named shooter: 253 of 253

`blk` is on every blocked shot, and it resolves. So the one genuinely ambiguous
frame type can say both halves.

---

## 5. The proposal

A single line, in the transport, between the controls and the scrubber — the slot
Kevin named. It states **actor + verb**, in the club's colour, at caption weight.

    faceoff        Staal won the draw
    shot-on-goal   Hall shot on goal
    missed-shot    Hall missed the net
    blocked-shot   Hall's shot — blocked by Staal
    hit            Reinhart hit Eriksson Ek        ← see §7.1, hittee is NOT stored
    giveaway       Hall gave the puck away
    takeaway       Staal took the puck away
    goal           (the caption already owns this frame — see §6.2)
    penalty        (likewise)

Rendered as `#NN Surname` plus the verb. **`"Surname #NN"` is a median of 11
characters, p95 14, max 18** across all 2,065 — so the line does not wrap on a
phone at the sizes below.

### 5.1 Placement and cost — measured

The transport is a wrapping flex row. Measured at both widths:

| | 390 | 1400 |
|---|---|---|
| `play` | 44 | 44 |
| two `grp` control groups | 46 + 46 | 46 + 46 |
| `scrub` | 44 | 44 |
| **transport total** | **210** (4 rows) | **100** (2 rows) |
| below-the-rink total | 1,181 | 812 |

A `flex-basis:100%` line before `scrub` takes its own row at both widths:
**≈19px of type + the transport's existing 10px gap = 29px.** That is **2.5% of
the phone's below-the-rink budget** and it lands *above* the fold-critical blocks
rather than below them.

---

## 6. What it must not do

### 6.1 It must not claim a position

`on-the-ice.html` carries the standing banner: *"real skater coordinates aren't
public, so we don't fake them."* This line says **who the league attributed the
event to**. It says nothing about where anybody stood, and it must never be
rendered on the ice.

### 6.2 It must not say what the caption is already saying

On a goal the caption already reads `🚨 GOAL · #16 Dorofeyev` with assists; on a
penalty it names the offender. **144 of 2,069 frames (7.0%)** would carry the
same name twice. The `captioned(e)` seam already exists and already has two
readers (`dwell()` and render) — this would be its third, which is an argument
for the seam and a question for CHENG: suppress the line where a caption names a
player, or let it stand as the caption's plain-language echo?

I lean **suppress**, on the site's own precedent: the offside blurb shrank when
its figure arrived, because *a card with a diagram should say the part the
diagram cannot*.

### 6.3 It must not borrow a colour it has not earned

A name in a club's fill is the provenance grammar's word for *recorded* — which
this is, so the colour is earned. But it must use the existing `.num` / chip
treatment rather than a new one, and it must respect the measured fact that
**7 of 33 club colours fail 4.5:1 on white** (`looking-at-pixels`).

---

## 7. Open questions for CHENG

**7.1 — The hit is the one sentence we cannot finish.**
`hitteePlayerId` is in the raw feed and is **deliberately dropped**
(`builders/extract.py:52-56`, the "still dropped, deliberately" list). So
*"Reinhart hit Eriksson Ek"* is **not available** without re-extracting. The
honest options are *"Reinhart delivered a hit"* (true, one-sided) or adding
`hitteePlayerId` to the extractor — a pipeline change, and the doc says
re-extracting a season is not free. **380 of 2,069 frames (18.4%) are hits**, so
this is not a corner case. Which way?

**7.2 — Is this a layer at all?**
Kevin asked for a toggle. But we ruled that *a layer's control lives with the
layer* (`layers-off-the-watch-page`), and this is not a lens over the data — it
is the caption for the frame already on screen. A permanent toggle in the base
view costs the clutter that ruling was written to prevent. Alternatives: no
toggle (it is 29px and always true); or fold it into the existing newcomer
banner's *"I have got the hang of it — hide this"* affordance, which is the
same idea and already shipped.

**7.3 — The faceoff loser.**
`losingPlayerId` is on the same deliberately-dropped list. *"Staal won the draw"*
is complete without it, so I do not think this one needs the pipeline — but it is
the same question as 7.1 and should be answered once, not twice.

**7.4 — What does the line say on the four frames with no actor?**
Two `shootout-complete`, two `penalty` in seven games. Reserving space that
shows nothing is the defect the row under the ice was deleted for; collapsing it
shifts the page, which is the defect the penalty slot's reservation exists to
prevent. At 4 in 2,069 I would render the event name alone and reserve nothing —
but that is a shift on 0.2% of frames and CHENG should say whether that is
acceptable or whether the line should hold its ground.

---

## 8. What is NOT proposed

- No change to `builders/extract.py` (unless 7.1 says otherwise).
- No player figure, avatar or jersey on the ice.
- No second name (assists, hittee, faceoff loser) beyond what §5 lists.
- No change to the caption pill.
- No new artifact, no new fetch, no change to page weight.
- Nothing on the hero preview, which has its own height budget.

---

## 9. If it is approved, the checks it needs

1. **Archive-wide, not fixture-wide** (`guard-where-the-archive-is`): every
   `actor` on every playable frame resolves in its own game's roster, walked
   where the whole archive is walked — not a unit test holding today's seven
   games. A name is a value the league controls.
2. **The verb table is asserted against `ACTOR`**, not restated beside it. A
   mapping typed twice is the mirror this repo keeps paying for; the test should
   fail if `extract.py` gains a type the sentence table does not cover.
3. **Both branches of the caption overlap** (§6.2) must be populated in whatever
   fixture the test uses — `docs/status.md` §H4.
4. **Looked at**, on a phone, with the longest name in the archive.
