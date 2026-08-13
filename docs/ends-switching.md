# Switching ends

*For CHENG, before a coordinate is touched. §1–§3 are measurements, taken from
20 raw play-by-play feeds spread across the three seasons; §4 onward is the
design argument, which is where I expect the disagreement to be. The question
that opens it is Kevin's, and it is the whole problem:*

> **"I also noticed that the teams need to switch ends at the start of the next
> period. How do we 'keep every mark' when they are shooting/defending at
> different ends of the ice?"**

The short answer is that you cannot, and §5 is about what to give up instead.

---

## 1. What the feed actually carries

Every play in the NHL feed carries `homeTeamDefendingSide`, `"left"` or
`"right"`, describing the **arena**. Over 20 raw feeds:

| | |
|---|---|
| plays examined | **6,333** |
| plays with no `homeTeamDefendingSide` | **0** |
| periods where the value changes mid-period | **0** |
| games where it fails to alternate every period | **0** |

Per-game sequences: `rlr` ×9, `lrl` ×8, `rlrlr` ×2, `rlrl` ×1.

Two things follow, and the second is the one that matters.

**It alternates into overtime.** All three games past regulation flip again at
P4, and both that reached P5 flip again. I had expected regular-season overtime
to keep the third-period ends. The feed says otherwise, and **n=3 is not enough
to make that a rule** — see §7.1, which is the one measurement I want to take
before building.

**It is a fact about the building, not about the game.** Which physical end a
club defends first is arena-fixed and has no league convention — the first
periods in this sample split 12 right / 8 left. We do not draw the building. So
`homeTeamDefendingSide` is not the thing we render; what we render is *that the
ends changed*, and the raw field is how we know **when**.

## 2. Normalization is sound, and here is the evidence rather than the assertion

`extract.py::_norm` undoes the switch so home always defends `-x`:

```python
def _norm(x, y, side):
    """Teams switch ends each period; undo it so HOME always defends -x."""
    if x is None:
        return None, None
    return (-x, -y) if side == "right" else (x, y)
```

This is the machinery the whole feature leans on, so I went looking for a reason
to distrust it and found an anomaly first. **End-zone faceoffs are not evenly
split between the two spots at each end.** In the normalized frame, over 2,134
draws:

```
host's end     y=-22  450    y=+22  298     ratio 1.51
visitor's end  y=+22  434    y=-22  281     ratio 1.54
```

Read in that frame it looks like an effect attached to each defending
goaltender, which would be a lovely story. **It is not, and I had it backwards.**
In the RAW frame, split by defending side:

```
                       x = -69           x = +69
home defending LEFT    y=-22 (1.41)      y=+22 (1.59)
home defending RIGHT   y=-22 (1.50)      y=+22 (1.49)
```

The bias is fixed to the **arena** and does not track the teams at all. Across
20 feeds it is 59.9% / 40.1% on one diagonal, 5.5σ from even, and **17 of the 20
games favour the same diagonal individually** — broad, not a few outliers.

Why the league's coordinates have it, I do not know, and I am not going to fit a
story to it. The conclusion that matters here is narrow and it is good news: **a
diagonal bias is invariant under 180° rotation, which is exactly what `_norm`
is, so it must survive normalization untouched — and it does** (1.51/1.54
normalized against 1.41–1.59 raw). `_norm` is faithfully preserving an
asymmetry that is already in the source. It is not manufacturing one.

The reason this section exists: it looked goalie-relative in the frame I first
measured in, and I said so out loud to Kevin before checking the raw feed.
Measuring in a transformed frame and reading the transform's own symmetry back
as a finding is the same shape as everything in `mechanize-the-review`.

## 3. What it would cost to carry the field

`homeTeamDefendingSide` passes the document-boundary rule (`architecture.md`
§4.5): it is **not reconstructible from the extract's own contents**, because
`_norm` is what destroyed it. That is the same test `rsn` passed and the running
score failed.

Cost is **one derive run, no re-fetch** — raw is retained and `derive.py` is
store-to-store. We fetch once and derive many times.

**Store the per-period array, not period one.** The side alternates in 100% of
the periods measured, so P1 plus the period number would reproduce every value
in the sample. That is precisely the shape this project keeps getting burned by:
a rule calibrated on a sample, validated by that sample. Storing what the feed
says costs a few bytes and makes §7.1 a lookup instead of an assumption.

Proposed: `sides: ["right","left","right"]`, indexed by period, on the extract's
`game` block.

---

## 4. The display already has a frame, and it is not the arena's

`build_main.py` renders through `SX(x) = 100 - x`, so the host defends the
**right-hand end** of the screen for the whole game, matching the scoreboard
that reads away-then-host. That was shipped two days ago and it fixed a real
confusion — Kevin read the net tags as swapped when the screen and the
scoreboard disagreed.

So the choice is not *arena or normalized*. It is:

- **one-direction** — what ships today. The host attacks left-to-right all game.
  Every mark from every period is comparable, and the ice reads as a single
  picture of where the game was played.
- **as-played** — the rink flips at each period boundary the feed records, which
  is what a viewer watching the broadcast sees.

Neither is more honest than the other. Both are exact transforms of the same
data, and **the site already says which convention it is using** — that is what
the goaltenders and the nets are for.

## 5. Kevin's question, and why the answer is a subtraction

> *How do we keep every mark when they are shooting at different ends?*

You do not. Four candidates:

**(a) Flip the furniture, leave the marks.** Incoherent. A mark's position means
nothing once the ice under it has moved. Rejected outright.

**(b) Render every mark as-played, in the period it happened.** Honest and
exact. But a team's attacking zone is then split across both ends of the
screen, and *"BUF spent the game in MIN's end"* — the thing the control layer
exists to show — becomes unreadable. This is a real loss, not a cosmetic one.

**(c) Scope persistent marks to the CURRENT PERIOD.** When the rink flips, the
trail clears — not as a UI convenience but because the frame changed underneath
it.

**(d) Offer both as a control.** Mechanism, not policy.

**I recommend (c) inside (d), and the reason is that (c) was already the
answer to a different question.** The whistle-layer work parked exactly this:

> Honest middle ground later is `all` scoped to the **current period**, because
> the period is a boundary the game defines.

That was written about trail density, before ends switching was on the table.
Ends switching gives the same boundary a second, independent justification —
and turns "we chose to clear the trail" into "the frame ended". A period is not
a parameter we picked; **it is the boundary the game itself draws, and it is the
boundary at which the ends change.** Those are the same boundary.

So: `ends: one-direction | as-played`, and in `as-played`, persistent marks
scope to the current period **automatically and not as a separate toggle** —
because in that mode a cross-period trail is not a display preference, it is
wrong.

## 6. What I think the default should be, and the argument against it

I lean **one-direction stays the default**, and I want this argued.

For as-played: it is what the fan sees on television, this site is for novices,
and matching the broadcast is the whole reason the host defends the right today.

Against, and it is what decides it for me:

1. **It re-breaks the thing we just fixed.** In period two the host is on the
   left while the scoreboard still reads away-then-host. That is the exact
   contradiction Kevin reported, arriving on a timer.
2. **It costs the control layer its picture** (§5b) — the layer that carries the
   site's thesis.
3. **The gain is smallest for the audience we build for.** A novice does not yet
   know the ends switch; that is a thing to be *told*, which a sentence does
   better than a silently mirroring rink.

If as-played is off by default, the honest move is that the page **says the ends
switched** at each period boundary — one line in the whistle panel's voice,
subject a rule — rather than staying silent about a fact it has chosen not to
draw. Silence about an omission is the failure the ingest-state work spent two
rounds fixing.

## 7. Open questions, in the order I would settle them

**7.1 — Does the side really alternate into overtime, and through a shootout?**
The only measurement here with n=3. It should be n≈300: overtime games are
plentiful and `derive.py` can count this over the whole archive without a single
new fetch. It also decides whether P5 — a shootout in the regular season, a
third overtime in the playoffs — has a meaningful defending side at all. **I
would take this measurement before writing any render code**, because the answer
changes whether the flip is driven by recorded data or by period parity, and I
do not want to discover it from a screenshot.

**7.2 — What does an as-played rink do at a period boundary?** An instant mirror
is cheap and reads as a glitch. An animated one is motion that traces a real
event (Doctrine §4 permits it — the period ending is a real event) but costs
work. Undecided.

**7.3 — Does anything else read the display frame?** The high-danger diagram,
the goalie view, and the icing/offside line geometry all compute in the
normalized frame today. The rule I want held: **all computation stays normalized;
as-played is a render-time transform and nothing else.** If any reducer ends up
needing to know which way the screen points, the design is wrong.

**7.4 — Do the net and goaltender ids survive?** I think yes, and by luck rather
than foresight: they were renamed from `netL`/`netR` to `netHome`/`netAway` two
days ago, because screen names for data facts become lies under a reflection.
A per-period reflection is the case that rename was for.

---

## 8. What I would build, if this survives review

1. Measure 7.1 over the whole archive (`derive.py`, no re-fetch).
2. Carry `sides` per period on the extract's `game` block; one derive run.
3. `ends` control, `one-direction` default, `as-played` scoping persistent marks
   to the current period.
4. A period-boundary sentence in the whistle panel's voice, on in both modes.
5. Tests: the display transform is the *only* thing that changes between modes
   (every reducer's output byte-identical across the toggle); a mark drawn in
   period 2 lands at the mirrored coordinate of the same mark in period 1;
   trails hold no cross-period mark in as-played; and the mode is stated on
   screen. Each mutation-proven before it is believed.

**Step 1 is a measurement and steps 2–5 are not started.** The thing I would
most like challenged is §6 — I have argued for keeping the less realistic
default on a site whose whole pitch is that it shows you the real game.
