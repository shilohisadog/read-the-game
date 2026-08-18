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

**And it is not uniform.** CHENG checked the reference game and found **21 / 20 —
essentially even**, which I verified independently: 41 end-zone draws, 21 on the
diagonal. It does not contradict the 59.9/40.1 (n=41 here, and three of the
twenty games run the other way) but it is worth knowing that **the flagship game
is not an example of the thing**, and that whatever this is, it varies by game.

Why the league's coordinates have it, I do not know, and I am not going to fit a
story to it. **It is FILED, not resolved** — see §9.1. The conclusion that
matters here is narrow and it is good news: **a
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

**one-direction stays the default.** I asked for this to be argued and CHENG
supplied the argument I had missed, which is the one that settles it.

**As-played is not more real. It is more like the broadcast.** The camera shows
one building's fixed perspective, and §1 already proved that perspective is not
a fact about this game: first periods split 12 right / 8 left with no league
convention. Mirroring the rink changes nothing about how the game was played.

So my own framing — *"the less realistic default on a site whose pitch is
showing you the real game"* — conceded too much, and I am striking it. The
honest statement of the trade is symmetric:

> **One-direction discards a fact about the building. As-played discards
> comparability across periods.** Both are exact transforms of the same data.
> The question is which loss costs the viewer more, and for a novice learning to
> read control, comparability wins easily.

For as-played: it is what the fan sees on television, and matching the broadcast
is the whole reason the host defends the right today.

Against:

1. **It re-breaks the thing we just fixed.** In period two the host is on the
   left while the scoreboard still reads away-then-host. That is the exact
   contradiction Kevin reported, arriving on a timer.
2. **It costs the control layer its picture** (§5b) — the layer that carries the
   site's thesis.
3. **The gain is smallest for the audience we build for.** A novice does not yet
   know the ends switch; that is a thing to be *told*, which a sentence does
   better than a silently mirroring rink — where a novice is at least as likely
   to conclude the site glitched. CHENG would elevate this one, and I agree.

**A fourth argument, ACCEPTED BUT MARKED.** CHENG offers: one-direction is the
frame every hockey analytics surface uses, so teaching a novice to read one
transfers to everything they see afterward, and teaching them to read a mirroring
rink does not. I think this is probably true and it points the same way as the
rest. **It is also entirely untested.** Nobody has watched a novice use this
site, nobody has checked what a novice actually encounters afterward, and
"transferable" is a claim about learning, not about hockey. It goes in the record
as a plausible argument rather than a supporting fact, because the thing this
project keeps doing is letting an unchecked figure harden into evidence by being
repeated — `88 of 214` did exactly that, through four artifacts — and I have
already been caught once this week inventing a fact about users to argue about a
layer. The conclusion does not depend on it.

**THE LOAD-BEARING COMMITMENT, and CHENG is right that it survives even if the
rest of §6 changes: the page SAYS THE ENDS SWITCHED, in both modes.** That is
what converts one-direction from a silent transform into a stated one, which is
the difference between a convention and a concealment. Silence about an omission
is the failure the ingest-state work spent two rounds fixing. See §7.5 for what
the sentence has to say, which turns out to be harder than it looks.

## 7. Open questions, in the order I would settle them

**7.1 — Does the side really alternate into overtime?** The only measurement
here with n=3, and it should be n in the hundreds.

I had framed this as deciding *"whether the flip is driven by recorded data or
by period parity"*, and **CHENG is right that this framing is wrong: §3 already
settles the schema regardless of the answer.** Store the per-period array either
way; it costs a few bytes and does not depend on the measurement. The outcome
must not be allowed to reopen §3.

What it actually decides is narrower: **is there any period where the feed's
`homeTeamDefendingSide` and period parity disagree?** If yes, parity is a false
rule and anything computing from it is broken. If no over several hundred
overtime games, parity is at least *descriptive* — which is worth having for
validation, and still not safe to compute from.

**MEASURED — 219 games, and 7.1 is settled.** Raw feeds spread across the three
seasons, 50 reaching overtime:

| | |
|---|---|
| non-shootout periods examined | **709** |
| plays missing `homeTeamDefendingSide` | **0** |
| periods where the feed disagrees with parity | **0** |
| overtime periods, all agreeing | **52** |

So parity is descriptive over 52 overtime periods, and my n=3 surprise in §1
holds up: **the ends really do change again for overtime.** Still not safe to
compute from — §3 stands unchanged, which is the outcome CHENG insisted the
measurement must not be allowed to reopen.

**7.1b — The shootout, as its own row.** CHENG's addition, on the grounds that
it was the case most likely to be weird. **He was right that it breaks, and both
of us guessed the wrong way.** The prediction was that "defending side" would be
absent, meaningless or arbitrary. It is none of those: all 13 shootout periods
carry a side on every play, none missing, and all 13 continue the alternation.

**The coordinates are the problem.** In a shootout every attempt is taken at one
end. The feed puts them at **both ends, in all 13 shootouts**, and the split does
not follow the shooting team either (away `x+` 27 / `x−` 18, home `x+` 20 /
`x−` 29 over 94 attempts). Whatever those coordinates are, they are not where
the puck was.

**And we draw them.** Confirmed on a real game rather than inferred — `2023020510`
carries 5 shootout attempts on the timeline with coordinates, at
x = +75, −73, +76, −83, +75. **The site currently renders a shootout as
attempts coming from both ends of the ice**, on the ~6% of games that reach one
(13 of 219). `extract.py` already excludes `pt == "SO"` from the SOG and goal
counting, so the numbers are right; nothing excludes it from the ICE.

This is a live defect and it is **not part of ends switching** — it was found by
CHENG's suggested measurement and it belongs in its own change, before this one.
Filed in §9.2. The reference game has no shootout, which is why nothing local
ever showed it.

**7.2 — What does an as-played rink do at a period boundary?** An instant mirror
is cheap and reads as a glitch. An animated one is motion that traces a real
event (Doctrine §4 permits it — the period ending is a real event) but costs
work. Undecided.

**7.3 — Make the display frame UNAVAILABLE to reducers, not merely forbidden.**
The rule I wanted held was *all computation stays normalized; as-played is a
render-time transform and nothing else.* CHENG's improvement is that a rule
enforced by a test can only catch the leak after someone makes it, whereas a
scope that does not contain `SX` cannot leak.

**Measured, today:** `CTX` carries `roster, homeId, awayId, homeAb, awayAb,
evenOnly` — no display frame — and none of the 13 inlined library modules
references `SX` or `SY`. So the rule holds right now. **But it holds by habit.**
`SX` is defined at char 74,924, after every library block (which span 1,126 to
66,541), **in one shared script scope**: the bundler inlines the modules by
stripping `export`, so a reducer that named `SX` would find it at call time.
Unused, not unavailable — exactly CHENG's distinction, and the measurement says
he is describing the real state rather than a hypothetical.

The structural fix is lexical: put the render code in a function scope with `SX`
inside it and leave the library blocks outside, so an inner name is invisible to
outer code. **And it is mutation-provable**, which the grep-flavoured version
never was: drop a reference to `SX` into a library block in the shipped bundle
and assert the page fails. A guard that can be seen to fire.

**7.5 — What does the period-boundary sentence SAY in one-direction mode?**
CHENG's, and it is the sharpest thing in his review because it is the one the
doc had no answer to at all. §6 commits the page to saying the ends switched in
both modes. In one-direction, that sentence **asserts something the screen
visibly contradicts** — the teams switched ends, and nothing moved. On its own it
reads as a bug.

His fix is a second clause, and it is right: two facts, one about the game and
one about the display, with the second making the first honest.

> *"The teams switched ends. This rink holds them in place so the whole game can
> be compared."*

**Two problems with it, both mine to solve rather than reasons to reject it.**

*First, the subject.* The whistle layer's copy standard is positive and
deliberately strict: **every sentence's subject is a rule, a recorded field, or a
count — never a player, a team, or a moment.** *"The teams switched ends"* has a
team as its subject. The provenance is real (`field: homeTeamDefendingSide`), so
this is a grammar collision rather than an honesty failure, and it is cheap to
avoid:

> *"Ends change at every period break."* — subject is a rule

**The rule NUMBER has to be looked up, not typed.** Every other teaching row on
this site cites one (`rule: NHL Rule 81`), and I do not have this one to hand. It
gets verified against the rulebook before it ships or the row carries
`field: homeTeamDefendingSide` instead, which is a citation we can actually
stand behind.

*Second, and more interesting: the display clause is a NEW KIND OF SENTENCE.*
*"This rink holds them in place"* is not a claim about hockey at all — it is a
disclosure about our own rendering, and the copy standard has no category for
it. Every provenance tag we have (`rule:`, `field:`) points into the game or the
feed. A disclosure points at us. It needs its own form — `display:
one-direction` — and once that exists it should be applied to every convention
the page currently applies silently.

**Which is where CHENG's other point lands: this sentence is the natural home
for the normalization disclosure the page still does not make** — raised on the
first screenshot and never built. Same fact, said once, in the one place a
viewer is already being told the ends changed.

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

**Step 1 is done (§7.1). Steps 2–5 are not started**, and §9.2 comes before all
of them.

---

## 9. Filed, not chased

CHENG's instruction on both of these was *file it, don't chase it*, and the
reason to write them down here is that this document is where they were found.

**9.1 — The diagonal skew in end-zone faceoff coordinates.** §2 proves it is not
ours and then moves on, which leaves it **unexplained rather than resolved**.
59.9/40.1 over 20 feeds, 5.5σ, 17 of 20 games individually — but the reference
game is 21/20, so it is not uniform. It is either a recording artifact (one
scorer's habit, one side of the press box, a default when the spot is ambiguous)
or something real about play. **The reason to have it on a list: a future layer
that uses faceoff location would inherit it silently**, and we would rather know
what it is before that layer exists than after.

**9.2 — Shootout attempts are drawn on the ice at coordinates that are not
positions.** §7.1b, measured and confirmed live on `2023020510`. This one is
**not** filed-and-parked: it is a defect on ~6% of games, the fix is small, and
it should ship before any ends work. Two candidate fixes, and I would want the
first:

- **Exclude `pt == "SO"` from the ice**, the way `extract.py` already excludes it
  from the counts. The shootout is not play — that is settled doctrine here —
  and a mark whose coordinate is not a position fails the "nothing synthesized"
  rule from the other direction: we did not invent it, but we are presenting it
  as something it is not.
- Draw them, and say what they are. Weaker, because we cannot say what they are.

The thing I would still most like challenged is §6 — but the framing is no
longer the one I asked to be challenged on, because CHENG replaced it and I
think his version is correct.

---

# 10. REOPENED — 2026-08-18, on an axis §6 never argued

**Kevin, after the attacking-direction indicator shipped:**

> *"We need to revisit the 'never changing sides' decision. That's going to
> confuse a viewer, because the teams DO change sides. The natural question for a
> viewer is 'why didn't the teams change sides, what's wrong with this
> website' — a question I would like to avoid."*

**This is not a better version of §5's argument. It is a different axis, and the
document never measured it.** Everything above weighs one-direction against
as-played on *legibility of accumulated marks* — an analyst's question. Kevin is
raising **trust**: a viewer who knows hockey reads a rink that never flips as a
BUG, and stops asking about the game to ask about the site. That failure happens
before any of §5's advantages can be collected.

This project has a name for this shape already: **the measurement right and the
objective function wrong.** No technique in the review catalogue catches it — the
only defence is *state who the reader is before you measure* — and §1–§8 were
measured for a reader who is not the one we built the site for.

## 10.1 ⭐ The indicator shipped this week made it sharper, not safer

`ATTACKS →` / `ATTACKS ←` now sit under the team abbreviations, derived from
`attackDirection` and constant for the whole game. **Before, the fixed ends were
an implicit convention a viewer might not notice. Now the page states a claim,
in words, that contradicts what hockey does at every intermission.** That is a
straightforward worsening of exactly the confusion Kevin names, caused by a fix
for a different confusion, and it argues for settling this rather than leaving it
filed.

## 10.2 The long change — a hockey fact one-direction cannot show, and it is real

Not in §1–§9 anywhere. In the second period each team's defensive zone is the one
FARTHER from its bench, so a pinned unit cannot change. Measured over 852
regulation games, regular season and playoffs:

| period | goals per game | attempts per game |
|---|---|---|
| 1 | 1.80 | 38.3 |
| **2** | 1.98 | **40.5** |
| 3 | **2.14** | 38.5 |

**Attempts peak in the second period, +5.7% over the first** — the long change's
signature. Goals rise monotonically instead, which is a different pattern and
more likely score effects than geometry, and should not be claimed as the long
change.

So there is a real teaching moment that **one-direction makes unshowable**, and
it is the moment Kevin's benches-and-penalty-box question was reaching for.

## 10.3 The cost is smaller than §5 assumed, and this is checkable

**As-played is a RENDER-TIME transform.** The reducers consume normalized
coordinates and would not move:

| | uses `e.x` |
|---|---|
| corsi, blocked, whistle, tied | **0** |
| danger, goaltending | 2 each — high-danger geometry, on normalized input |

Every count, every layer, every base rate, every published figure is untouched.
The casualties are exactly three, and only the first is a real loss:

1. **`trails === 'all'` across a period boundary** — which §5 already answered:
   scope to the current period, *because the frame ended*, not as a preference.
2. **Fixed furniture** — nets, goaltenders, and the new arrows, all of which
   would flip with the ice. The arrows becoming period-aware is the fix
   *working*, not a cost.
3. **`grep` says `trails` is the only spatial accumulation in the app.**

## 10.4 What I would recommend, and the case against it

**Build the control; let the novice test choose the default.** That is
mechanism-not-policy, and the default is precisely the question a real novice
answers in one sitting — she is scheduled, and this is the cheapest possible
experiment to run on her.

**I lean as-played as the default**, because a trust failure outranks an
analytical convenience for this audience, and because §5's loss is now known to
be confined to one control.

**The case against, stated properly:** *nobody has watched a novice use this site
yet.* "A viewer will ask what is wrong" is a **prediction**, and §1–§8 are
**measurements**. Rebuilding a core rendering decision on a hunch is the shape
this project distrusts everywhere else, and the disclosure already exists in the
legend.

**What breaks the tie is the asymmetry of being wrong.** Ship the control and
default wrong analytically → flip a default. Keep one-direction and Kevin is
right → a novice bounces and never tells us why. The second failure is silent,
and silent failures are the ones this project spends its effort on.

## 10.5 What I want ruled

1. **Does the trust argument beat §5's legibility argument for the DEFAULT**, or
   only justify the control?
2. **Is a period-boundary disclosure a real alternative** — announcing "the teams
   change ends here; we hold them fixed so the marks stay comparable" at the
   moment of confusion rather than in a legend nobody reads? It is much cheaper
   and it targets the exact instant Kevin describes.
3. **Do the benches belong on the ice at all?** They are the reason the long
   change exists, they are not in the feed, and drawing them is drawing the
   building — which §1 explicitly says we do not do.
4. **Does the penalty box ride on this decision or is it independent?** I think
   independent: box occupancy reads from `sit` and is correct in either mode.

# 11. RULED, and the first half built — 2026-08-18

## 11.1 What Kevin ruled

> *"I'm leaning toward benches, penalty boxes and having the teams swap sides
> between periods. If we are going to be 'replay theater', shouldn't we be true
> to the actual shape of the game?"* … *"I agree on the benches, that's a
> tough(er) one. I am tending towards penalty boxes yes, benches no. But we'll
> measure that when the time comes."*

**Boxes in. Benches out, pending a measurement rather than an argument. Ends
switching: leaning as-played, default still Kevin's to call.**

## 11.2 The correction that unblocked it — doctrine is a floor, not a chooser

CC opened by arguing *against* the fidelity framing and then, three paragraphs
later, said ends switching was the strongest of the three because it is in the
data. Kevin caught the contradiction. It was real, and the repair matters more
than the slip:

> **"Is it in the feed?" is a PERMISSION test, not an instruction.** It says what
> we are allowed to render. It never says what we should.

So **doctrine cannot referee this decision, because both renderings are already
inside it.** The fixed rink is not an invention — `build_main.py` calls it *"a
display transform and nothing more"* in its own comment — and flipping at the
period break is the same kind of thing over the same coordinates. Neither adds
nor hides a fact. There was never a doctrinal objection to make.

**And the burden is not where §6 put it.** The status quo does two separable
things: it *exercises a freedom the data leaves open* (which end the host
defends first — period one splits 7 left / 7 right across 14 raw feeds, so the
feed has no opinion, and the app picks for the television convention) and it
*suppresses a fact the data records* (that they swapped, on every play). Of the
two arrangements, the one discarding a recorded fact is the one that owes an
argument.

**What is still open is only the DEFAULT, and only on one axis:** which reading
serves a novice on a phone. That is CHENG's counter — the reader who asks *"why
didn't they switch sides"* is a fan, and a novice who does not know ends switch
may read a mid-game mirror as the glitch. It is a prediction about a user nobody
has watched, and it gets settled by watching her.

One argument moved toward as-played that §7.5 had backwards: **as-played makes
the hard copy problem easy.** The disclosure sentence was called *"harder than it
looks"* because in the fixed rink it must explain why the screen did **not** do
what the game did. In as-played it only has to say what just happened. The
sentence that was one-direction's weak point is the flip's natural caption.

## 11.3 Built: the extract now carries what it was destroying

`_norm` consumes `homeTeamDefendingSide` and throws it away, so after
normalization the feed's record that the teams changed ends is gone. It is not
reconstructible from anything else we hold — the test for belonging in the
extract (architecture 4.5), the same one `rsn` passed.

**Recorded, never computed from the period number.** Parity would be a rule with
no source in the data, and it is *unfalsifiable in exactly the games where it is
wrong*: on the reference game a parity rule agrees with the record perfectly, and
a parity rule with the opposite phase disagrees on all 320 plays. A period whose
plays contradict each other carries **no entry** rather than a majority vote, so
a renderer can tell *"they swapped"* from *"we do not know"*.

    "sides": {"1": "left", "2": "right", "3": "left"}

**And the penalty, which was being reduced to the bare fact that one happened.**
`pen` (descKey), `min` (duration), `sev` (MIN/MAJ/MIS/…), `drew`, `srv` where
present, `zone`. `own` was already there and **means the OFFENDING team —
verified 8 of 8 against `rosterSpots`, and re-checked on every game by
`validate()` rather than trusted**, because `own` is the field that already
carried an unexpected meaning once (the *shooter* on a blocked shot).

Cost: **+577 bytes per game, additive only**, proven by `extract.py --additive`,
which was extended to notice top-level keys — it compared five hand-typed names
and could not see a new document appear beside them.

## 11.4 ⭐ The finding that decides how the box is drawn

**`min` is what the referee assessed. It is not what the player served, and a box
driven by it puts a man on screen who is not on the ice.**

In the reference game, first period: BUF are penalised at 18:34 and the situation
code goes `1551` → `1541`. MIN score at 19:30. The very next event reads `1551`.

> **Two minutes were assessed. Fifty-six seconds were served.**

A box driven by `duration` holds Johnson for another 64 seconds, through the end
of the period, while the ice shows him back over the boards. Nothing on the
penalty event records the early release — **`sit` is the only witness**. Nor is
duration a power play: a 10-minute misconduct is box time at even strength and a
penalty shot is no box time at all, which is why `sev` is carried beside `min`.

**Two fields, two questions.** `sev`/`min` say what the referee assessed; `sit`
says what the ice looked like. Draw the box from either alone and it lies.

(Three other penalties in this game also return to even strength early, and for a
*different* reason — an offsetting call, not a goal. The test pins the 18:34 case
specifically, and asserts the releasing goal was scored by the team that was not
penalised, so it cannot pass by coincidence.)

## 11.5 How this is defended

Ten tests in `test_derive.py` — `ThePenaltyCarriesItsOwnMeaning` and
`TheEndsTheyDefended` — reading the **real** reference feed, because what is
under test is what the *league* means by its fields and a fixture written by the
extractor's own author can only confirm what he already believed.

Two new `validate()` checks run on every game in the archive: penalties credited
to the offending team, and the recorded ends matching the feed on every play.

**Every one of them was seen to fire.** Four mutations of the implementation —
drop the penalty detail, compute sides by parity, majority-vote a contradicted
period, credit the penalty to the drawer — each killed by the suite; and the
gate mutations (`own` flipped, a period claiming the wrong end) each produce
exactly one named failure. The second half of the `own` test is the load-bearing
half: *the drawer is never on the offending team*, asserted on all 8, because
"own == the committer's team" is satisfied by a feed where both players are on
the same team and then discriminates nothing.

## 11.6 The sequencing this imposes

`derive.py` calls a game current when its extract names the same input digests —
and **a schema change alters no digest**. The trap is already defended and by
construction: `derive.yml` syncs the archive with `--exclude 'extract/*'`
precisely so there is no extract on disk to skip against, and its header says to
run it after any change to the extract schema.

So the order is fixed: **land the schema change → dispatch `derive.yml` → only
then build anything that reads the new fields.** Until that run completes, the
4,417 published extracts carry neither `sides` nor the penalty detail.

## 11.7 §10.5's four questions, as they now stand

1. **Default** — still open, and now the *only* open part. Not a doctrine
   question; a question about a novice on a phone.
2. **The disclosure sentence** — a prerequisite, not an alternative (CHENG). It
   is needed in both modes and is still unbuilt.
3. **Benches** — out, by Kevin's ruling, on a pixel argument rather than a
   doctrinal one: they live outside the boards and every pixel they take comes
   off the rink on the device the novice tester is holding. Not un-derivable —
   `shifts` gives roster-minus-on-ice — so this is a decision to be *measured*
   later, not a limit of the data.
4. **The penalty box** — independent, confirmed, and now more so: it needs
   `sev`/`min` from the extract and `sit` from the ice, neither of which has any
   bearing on which way the rink faces.
