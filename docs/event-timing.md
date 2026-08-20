# Event display timing — eight clocks, and the speed control governs one

**Kevin, 2026-08-16**, playing WSH–CBJ:

> *"We need to discuss event display timing, it's rather inconsistent now."*

**And 2026-08-17, refining it** — the part worth quoting, because it names two
separate complaints and a proposed remedy:

> *"For the timing bits the whole pace, visually and textually don't work
> smoothly together. I realize events aren't timed and depend on the actual game,
> but I think the pace of replay, in teaching mode, is too fast and I'm not sure
> we should 'linger' on certain events longer than others. I'm thinking we should
> provide a consistent replay speed, and definitely coordinated with the
> captions, across all events."*

He also withdrew his own earlier *"for some events is planned"* — so nothing in
the current tiering is defended by its author.

This audit was **walked in a browser before anything was argued**, per
[[looking-at-pixels]]. Every number below is measured unless it says otherwise.

---

## 1. The mechanism, in full

There is exactly one pacing rule in the renderer, `build_main.py:1058`:

```js
function dwell(e){let d=650;if(e.type==='goal')d=3000;else if(isHD(e))d=1700;
                  else if(e.type==='shot-on-goal')d=850;return d*mult;}
```

`mult` is `2.9` (Slower) / `2` (Teaching, default) / `1.1` (Faster). `step()`
calls `set(i+1,'play')` and then `setTimeout(step, dwell(EV[i]))`, so the delay
belongs to the event **now displayed**. That is the whole schedule.

**But it is not the whole timing.** Eight animations run alongside it, and only
one of the eight is `dwell`:

| clock | duration | source | scales with the speed control |
|---|---|---|---|
| **the frame** | 650/850/1700/3000 × `mult` | `dwell()` | **yes** |
| the caption | **2.2 s** | `.caption.on` | no |
| the net flash | 1.3 s | `.flashpath.netflash` | no |
| the shot line | 1.0 s | `.shotline` | no |
| the flare | 0.7 s | `.flare` | no |
| the counter bump | 0.32 s | `.bump` | no |
| the puck jump | 0.3 s | `.puck.jump` | no |
| the label fade | 0.28 s | `.plabgrp` | no |

The bottom four are entrance transitions and being fixed is right for those —
they are shorter than any frame at any speed. **The top three are
communication**, they all sit in the same range as a whole frame, and none of
them move when the viewer changes speed.

## 2. The walk

`/tmp/rtg-pixels/pace.mjs` — Playwright, the locally-built `game.html`, viewport
1100×900, the real Play button, sampling on `requestAnimationFrame` and pushing a
record only on a transition. Game: **2025030416, the Cup final, CAR @ VGK, 281
frames.** Two full replays walked (base view; slot layer on), plus a
110-second sample at Faster — a sample, because the claim it settles is one
number and 110 s of it is 90 frames.

**One method note that is the finding's own precondition.** The caption's `on`
class is **never removed** — `caption()` does `remove → offsetWidth → add` to
re-trigger the animation, so after the first caption of the game that class is
true for the rest of the replay. A check written against the class would report
"the caption is showing" forever. **Visibility here is computed opacity**, which
is what a viewer actually sees. Same shape as the entries in
[[mechanize-the-review]]: a check built from the implementation's own model of
its state rather than an instrument pointed at the axis in question.

## 3. What it measured

**280 intervals, 7.6 minutes, Teaching pace, base view.**

```
min 1298   p25 1300   median 1300   p75 1317   p90 3399   max 6012   mean 1619
```

| tier (nominal at Teaching) | frames | share | measured median | carried a caption |
|---|---|---|---|---|
| 1300 ms | 222 | 79.3% | 1300 | — |
| 1700 ms (`shot-on-goal`) | 24 | 8.6% | 1700 | **0 of 24** |
| 3400 ms (slot shot) | 31 | 11.1% | 3400 | **0 of 31** |
| 6000 ms (goal) | 3 | 1.1% | 6007 | 3 of 3 |

`dwell` is accurate to within 1.5% of nominal at every tier, so nothing here is
timer drift. The mechanism does exactly what it says. The question is whether
what it says is right.

## 4. ⭐ DEFECT ONE — a fifth of the replay pauses for nothing

**55 of 280 frames (19.6%) hold 1.3× to 2.6× the base with nothing on screen
that distinguishes them.** Their on-ice labels, verbatim from the walk:

```
i= 43  3399ms  caption: no  label: VGK · Shot on goal
i= 44  3400ms  caption: no  label: VGK · Shot on goal
i= 45  3401ms  caption: no  label: VGK · Missed shot
```

Those are the same labels, in the same form, as the 1300 ms frames around them.
The replay stops dead for three and a half seconds on a play the viewer has no
way to tell apart from the one before it.

**The cause is a missing condition.** `dwell` calls `isHD(e)` unguarded; the
caption calls `hdOn && isHD(cur)`. So the slot tier fires **whether or not the
slot layer is on**, and the base view — the default, and what a first-time
visitor sees — inherits a pause that exists to give a caption room to breathe,
without the caption.

**Proven by contrast, not by argument.** The same 281 frames walked at
`?layer=slot`:

| | base view | slot layer on |
|---|---|---|
| frames at 3400 ms | 31 | 31 (identical indices) |
| of those, captioned | **0** | **31** |
| captions in the game | 9 | 40 |

The tier is *correct* with the layer on and *silent* with it off. Nothing about
the pause changes; only whether anything explains it.

**The `shot-on-goal` tier is worse: it has no on-screen correlate in any layer
state.** 24 frames at 1700 ms, zero captions in either walk. It is 8.6% of the
replay lingering on a judgement that was never surfaced to the viewer at all.

## 5. ⭐ DEFECT TWO — the caption has never once matched its frame

Nine captions in the base-view walk, and the visible window is **2067 ms every
single time** (the 2.2 s animation minus the opacity ramp at each end). It does
not vary by event, by layer, or by speed, because it is a CSS animation and
`dwell` is a `setTimeout`, and nothing has ever related them.

| event | frame | caption | result | n |
|---|---|---|---|---|
| **penalty** | 1300 ms | 2067 ms | the caption finishes **on the next play**, +767 ms | **6 of 6** |
| **goal** | 6000 ms | 2067 ms | **3933 ms of goal frame with the caption already gone** | **3 of 3** |
| **slot shot** (layer on) | 3400 ms | 2067 ms | 1333 ms of silent tail | **31 of 31** |

The two captioned event types in the default view fail in **opposite
directions**, which is precisely *"visually and textually don't work smoothly
together."*

**And the speed control makes it worse in one direction only.** `mult` scales the
frame; 2.2 s is fixed. Measured base frame at each setting:

| setting | base frame | caption | the caption outlives an ordinary frame by |
|---|---|---|---|
| 🐢 Slower | 1885 ms (derived) | 2067 ms | 182 ms |
| Teaching | **1300 ms** (measured) | **2067 ms** | 767 ms |
| Faster | **717 ms** (measured) | **2066 ms** | **1349 ms — two further plays** |

**At every one of the three speeds, the caption outlives an ordinary frame.**
There is no setting at which these two clocks agree.

The Faster walk makes it concrete rather than arithmetical — every penalty
caption in the 110-second sample was still on screen two plays after the penalty
it names:

```
i= 50  visible 2067ms  outlived its frame by 2 more plays  CAR ⛔ Penalty · #53 Blake
i= 54  visible 2065ms  outlived its frame by 2 more plays  VGK ⛔ Penalty · #48 Hertl
i= 77  visible 2066ms  outlived its frame by 2 more plays  VGK ⛔ Penalty · #9 Eichel
i= 86  visible 2066ms  outlived its frame by 2 more plays  CAR ⛔ Penalty · #22 Stankoven
```

**4 of 4.** A caption naming a Carolina penalty sits over two subsequent Vegas
plays. It is the only text on the ice, it names a team and a player, and by the
time it fades it is describing something two plays in the past — which is the
`EVENT`/`CONDITION` rule's own failure mode, arriving through a clock rather than
through copy.

The same arithmetic condemns the other two communicating animations, from their
stylesheet durations against the measured frames (**derived, not separately
walked**): at Faster the **net flash (1.3 s)** and the **shot line (1.0 s)** both
outlive the 715 ms frame that started them. The viewer sees the previous play's
net still lit under the current play.

## 6. A copy defect the walk surfaced on its own

Every slot caption in the layer-on walk reads:

```
⚡ Shot from the slot · #16 Dorofeyev from the slot
```

`caption()` builds `'⚡ Shot from the slot'` and then appends
`${kind==='hd'?' from the slot':''}`. The trailing clause was written when the
label said *high danger*; the rename left it duplicating the label. **31 of 31
slot captions.** Nothing in 496 tests reads that string, and nobody had watched
the layer play through.

## 7. The design question

Kevin's proposal is **one consistent speed across all events, coordinated with
the captions, and slower at Teaching.** Three claims, and they are not equally
settled.

### 7.1 The part that is not a judgement call

**Defect two is a defect under any pacing policy.** Two clocks that describe the
same moment and were never related is not a taste question, and no choice of
constants fixes it — it needs one number driving both.

Likewise **defect one's layer-dependence**: a pause whose reason is switched off
is wrong whether the pause is 3400 ms or 1800 ms.

### 7.2 The part that is a real design choice, and the case against Kevin

The tiers encode **an editorial judgement about which events matter** — a goal is
worth 4.6 ordinary plays. That is the one kind of judgement this site refuses
everywhere else, so deleting it has a doctrinal argument behind it and not only a
taste one.

**But "one constant for everything" has a cost, and it is the coordination Kevin
asked for.** The captions are not the same length:

```
⛔ Penalty · #53 Blake            (goal label + assists on the ice runs ~3× this)
🚨 GOAL · #71 Hall  +  assists: Aho, Jarvis   (the ice label, a second line)
```

Pin every frame to one constant and either the goal is rushed or all 222
ordinary plays are paced for the goal's reading time. **"Uniform" and
"coordinated with the caption" pull against each other**, and the pull is exactly
proportional to how much the captions differ.

### 7.3 The reframe I would take to a build

> **A frame lasts as long as what is on it takes to read. The caption's window
> and the frame are the same number, by construction.**

This is uniform in the sense Kevin means — one rule, no favourites, nothing
ranked by importance — and it produces a longer goal frame for a stated reason a
viewer can feel (*there are more words*) rather than an editorial one (*goals
matter more*).

Quantized to what the page actually has, it is **two states, not a continuum**:

| | frame | caption |
|---|---|---|
| a frame with no caption | `FRAME` | — |
| a frame with a caption | `FRAME + BONUS` | the whole frame |

**And it fixes defect one for free.** A frame is long *because there is a
caption*; turn the slot layer off and the caption does not fire, so the frame is
not long. The layer-dependence bug becomes structurally impossible rather than
patched — the same move as `place()` and the CSP invariant.

## 8. Options, costed

`FRAME` at Teaching, over this game's 281 frames:

| policy | ordinary play | goal | total runtime | vs today |
|---|---|---|---|---|
| **today** | 1300 | 6000 | 7.6 min | — |
| A · flat 1800 everywhere | 1800 | 1800 | 8.4 min | +11% |
| A · flat 2200 everywhere | 2200 | 2200 | 10.3 min | +36% |
| **B · 1800 + 900 bonus** (§7.3) | **1800** | **2700** | **8.5 min** base view · 9.0 min with slot | **+12%** |
| C · read-time proportional | varies | varies | ~8.5 min | +12% |

**I recommend B.** C is B without the quantization, and it introduces a
milliseconds-per-character constant with no source in our data — CHENG's rule
that killed `recent` trails (*a parameter with no source in the data is a model
wearing a UI control*). It also produces a slightly different duration on every
frame, which is the jitter Kevin is complaining about.

**Considered and declined: honouring the game clock.** Event spacing in real time
is wildly uneven — measured over the reference game, the gap between consecutive
events is **median 9 s, p75 18 s, p90 32 s, max 94 s, and 24 gaps of 0 s** — and
the replay currently ignores all of it, so a three-event scramble plays at the
same rate as a ninety-second lull. Scaling display time to it would need three
chosen constants (a scale, a floor, a ceiling), and Kevin has already set the
idea aside in his own words (*"I realize events aren't timed and depend on the
actual game"*). **Recorded so the option survives without being taken**, the same
disposition as the whistle layer's sixty-minutes line.

### 8.1 The one number I cannot derive

**How long an ordinary play should be is a taste call and it is Kevin's.** There
is no fact in our data that says how long a novice needs to read `VGK · Shot on
goal` and find the mark on the ice. What I can supply is the consequence: the
table above. `1800` is the working proposal because it is the smallest raise that
is clearly a raise (+38% on the frame Kevin sees 79% of the time) while keeping
the replay under nine minutes.

The three speed settings become three `FRAME` values rather than a multiplier
over four tiers — and the caption's own duration must ride the same ladder, which
is the thing that is broken today.

### 8.2 The implementation constraint that decides the shape

The caption duration currently lives in the **stylesheet** and the frame duration
lives in **JS**. Whichever way this goes, they must come from one place, or we
have rebuilt the defect with better numbers.

The CSP forbids inline `style` attributes but permits the CSSOM (established by
D1). So: **the number lives in JS and is pushed to a CSS custom property at
boot.** That way `test/render-*.test.js` — which structurally cannot see CSS — can
still assert the relationship, and the browser gate in `deploy.yml` can assert
the animation really lasts that long. A number that lived only in CSS would be
invisible to every test we have.

## 8.3 ⭐ `dwell` IS NOT LOCAL TO THE GAME PAGE — it paces the front door

**I wrote in a first draft that no test reads a duration. That is false**, and
checking it turned up the constraint that most affects this decision.

The **home page preview** — the five-second loop of the most recent game, the
first moving thing a stranger sees — runs on `dwell`. Deliberately, and the
reasoning is in `build_main.py:1716`: two chosen constants were tried and Kevin
rejected both (*"a blur of activity, looks like it's 100x real-time"* at 115 ms,
then *"definitely better, still 2 or 3x too fast"* at 430 ms). The fix was to
**stop choosing** — the preview waits what the replay waits, so it cannot
misrepresent the product's pace in either direction.

Its window is then derived rather than chosen: `BUDGET_MS = 14000`, and the loop
holds however many events fit at the real pace. **So slowing `dwell` shortens the
front door's loop**, measured from the walk's own frame durations:

| policy | events in the 14 s window |
|---|---|
| today | **9** |
| B · 1800 + bonus | 7 |
| A · flat 2200 | 6 |

That is not a blocker — the guard is `back >= 4` — but it is a real cost of
"slower" that lives on a different page, and nobody would have found it from the
game page.

**Three existing tests bind this**, and one of them is a direct verdict on
Kevin's proposal:

1. *the preview waits on the replay, not on a number somebody picked* — asserts
   every preview delay is a delay the ordinary play loop also waits. **Survives
   any policy here**, because both sides read the same function. This is the test
   working as designed.
2. ⭐ *and the preview is not a metronome — it eases, because `dwell` does* —
   asserts `new Set(delays).size > 1`. **This test fails under option A.** It is
   pinning the exact design decision Kevin is now reversing: that the pace is
   deliberately non-uniform.
3. *the preview is a taste: it restarts inside a quarter-minute* — asserts the
   window is 5–15 s and at least 4 events. Survives B and A alike.

**Test 2 is the honest obstacle in this audit.** It is not stale and it is not
wrong — it was written because a *constant* pace was measured, twice, as
misrepresenting the product. Option A does not sneak past it; option A **is** the
thing it forbids, and adopting A means deleting a test on the grounds that its
premise has been overruled. That is allowed, and it should be done explicitly and
in Kevin's name rather than quietly.

**Option B survives it**, because a captioned frame is longer than an uncaptioned
one — so the pace still eases, just for a reason on the screen rather than a
judgement in the code. I did not choose B for that reason, but it is worth
saying that the test agrees with the argument in §7.3 and disagrees with §7.2.

## 9. What I want ruled

1. **Is B right, or is A (a true flat constant) what Kevin actually asked for?**
   B keeps a longer goal frame. Kevin said *"I'm not sure we should linger on
   certain events longer than others"* — B still lingers, just for a derived
   reason. Is that distinction real to a viewer, or is it a distinction only its
   author can see?
2. **Does the `shot-on-goal` tier just die?** It has no caption in any layer
   state. Under B it becomes an ordinary frame. The alternative is that it was
   pointing at something real — an unshown caption that ought to exist — and
   deleting the tier deletes the evidence.
3. **Should the net flash and the shot line ride the speed ladder too?** They are
   communication, not transition, and at Faster they outlive their frames. But
   scaling a CSS animation from JS is more machinery, and the entrance
   transitions must *not* scale.
4. **`FRAME` = 1800 at Teaching** — is the runtime table the right way to put
   this to Kevin, or is there a measurement I am not seeing that could set it?
5. **Is deleting *the preview is not a metronome* acceptable if A wins?** §8.3.
   A test that encodes a superseded design decision should die, but this one was
   bought with two rounds of Kevin's own feedback, and I would rather it be
   overruled out loud than quietly edited.
6. **Does the front door's loop dropping from 9 events to 7 change the answer?**
   It is the first moving thing a stranger sees and the conversion depends on it.
   `BUDGET_MS` could rise to hold the count — but it is explicitly *a visual
   judgement, here to be looked at, not proved*, so raising it is a second taste
   call riding on the first.
7. **Does anything here need to be held for the novice test?** Pacing is the one
   thing on the list she cannot report on if it is wrong in both directions at
   once — but it is also exactly the kind of thing a first-time viewer notices
   and a builder cannot.

---

## 10. BUILT 2026-08-17 — CHENG's ruling, and the one place he was wrong

CHENG took the reframe (§7.3) with one requirement that completes it: **the
caption's duration must become a function of the frame's duration, not a constant
beside it** — otherwise the reframe fixes defect one and leaves defect two
exactly as it was. Sequenced 1 → 2 → 3, on the grounds that landing the reframe
first means tuning durations while the caption still disagrees with all of them.

**One correction to that sequencing, made in the build:** step 2 alone is a
regression if shipped alone. Deriving the caption from today's tiers gives a
penalty a 1300 ms caption, which is not long enough to read a name. 2 and 3 are
two halves of one coherent change and were verified together.

### The shape that shipped

```js
function captioned(e){return !!e&&(e.type==='goal'||e.type==='penalty'||(hdOn&&isHD(e)));}
function dwell(e){return captioned(e)?frameMs+CAPTION_BONUS:frameMs;}
```

`captioned()` is the **single source both the schedule and the renderer read**,
so defect one is structurally impossible rather than guarded — the same move as
`place()`. `FRAME_MS = {sp0:2600, sp1:1800, sp2:1000}`, `CAPTION_BONUS = 900`,
and `caption()` sets `style.animationDuration = dwell(e)+'ms'` through the CSSOM.
The stylesheet's `2.2s` survives as a placeholder the script always overwrites,
with a test pinning that it does.

### Measured after, in a browser, same method as §2

| | before | after |
|---|---|---|
| distinct frame durations | 4 | **2** |
| frames longer than base **with no caption** | **55 of 280 (19.6%)** | **0** |
| captions finishing on a later play | **6 of 9** | **0 of 9** |
| caption visible vs its frame | 2067 ms in 1300 / 6000 | **2534 ms in 2701 ms** |
| ordinary play | 1300 ms | **1800 ms** |
| replay length | 7.6 min | **8.5 min** |
| slot layer on: long frames captioned | 31 of 31 | 19 of 19, and none silent |

The caption now fades out at 94% of its own frame, at every speed, because there
is one number. **500 JS + 105 Python green. Five mutations, five kills**, each by
the test written for it — including restoring the unguarded `isHD`, which the
biconditional (*a frame is long if and only if it spoke*) catches.

### ⭐ CHENG PREDICTED THE METRONOME TEST SURVIVES. IT PASSES, FOR THE WRONG REASON.

> *"Two-state quantization is still not a metronome — the preview still eases and
> the test still passes… If it did fail, that would be the signal to stop and ask."*

It passes. **Measured over 59 games spread across the archive**, the preview's
opening window (the first 7 plays, which is what fits in `BUDGET_MS` at the new
pace):

| | a non-base frame inside the first 7 plays |
|---|---|
| the old tier list | 43 of 59 — **72.9%** |
| the reframe | 9 of 59 — **15.3%** |

**Median index of the first captioned event: 26** — four times the window. So on
roughly six nights in seven the front door's loop is *legitimately* uniform, and
the old assertion would have gone red against a page working exactly as designed.

It passed here because the reference game carries a penalty at **index 2, the
minimum of that distribution.** A test that arrives where it already was is true
for the wrong reason, and this one would have been.

**So the guard moved rather than died.** The property worth protecting is that
`dwell` must not collapse to one number — because if it did, the surviving test
(*the preview draws from the replay*) would pass trivially with both sides
returning the same constant. It now watches the **whole replay**, where a
captioned frame is guaranteed by the game rather than by luck of the opening, and
additionally asserts there are exactly **two** distinct waits, so a third tier
creeping back is caught.

**CHENG's larger flag stands and gets stronger.** Measured live in the hero
iframe at both viewports: **the loop reaches event 7 and restarts at 10.3 s
(1100px) / 12.1 s (390px)** — down from 9 events. And it now also loses its
easing on most nights. If 7 events no longer reads as hockey, **the fix is
`BUDGET_MS`, not a faster replay** — decoupling the preview from `dwell` would
reintroduce exactly the chosen parameter Kevin rejected twice.

### The duplicated clause

`⚡ Shot from the slot · #16 Dorofeyev from the slot` — gone, confirmed live.
CHENG's lesson, recorded: **a rename verified by grepping for the term that LEFT
cannot see the redundancy its departure created.** The assertion is his — no
caption may contain a repeated three-word phrase — checked across both layer
states, and it fails with the exact string when the clause is restored.

### Still Kevin's to rule

**`FRAME_MS.sp1 = 1800` is the taste call** (§8.1) and no data of ours can set
it. The consequences are the table above: the replay runs 8.5 minutes and the
front door shows 7 plays. **And a goal now holds 2701 ms where it held 6000** —
the biggest single change a viewer will feel, and the one most likely to want
a second look.

## 11. What is already known and needs no re-derivation

- `step()` is drivable in tests: `boot()` captures the timer and `advance(n)`
  runs the real loop, returning frames moved.
- The caption fires for **goals, penalties and slot shots** (penalty added
  2026-08-16). Nothing else in the renderer captions.
- Stoppages are in `SKIP` and never enter `EV`, so the whistle layer has no frame
  of its own and no pacing question.
- 496 JS + 105 Python tests green at `bb66972`.
