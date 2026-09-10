# Score effects — the answer the archive already holds

Kevin, 2026-09-10: *"let's dive into score effects."* This is the audit and the
plan, for CHENG's review before anything is built.

⭐⭐ **THE SHORT VERSION.** The site's headline is that **the team with more shot
attempts loses more often than it wins** — `54.3%`, said on the home page and in
the game page's newcomer block, called *"the site's whole reason to exist"* in
`app.js`'s own comment. **`measures.json` already publishes the number that
explains it, and no surface on the site says it.**

---

## 0. Method, and where every figure comes from

Two tiers, kept apart on purpose, because one is the archive and one is not.

| tier | population | how to reproduce |
|---|---|---|
| **ARCHIVE** | 4,100 games, NHL regular season and playoffs | `data/measures.json` → `baseRates`, `levelCurve`; built by `src/lib/archive.js` via `builders/measure.mjs` |
| **LOCAL** | **48 games** on this machine — 8 fixtures + 40 published extracts | scratch scripts, reproduced in §3 |

⚠️ **NO LOCAL FIGURE IN THIS DOCUMENT MAY REACH A SURFACE.** 48 games is the
same order that produced the *"about four times"* headline that turned out to be
2.2× on the archive, and the 8-game census that missed by the same margin. The
local numbers here are evidence that a question is worth asking; they are not
answers. Everything a page says has to come from the ARCHIVE tier.

---

## 1. ⭐⭐ The finding is published, and unsaid

`data/measures.json` → `baseRates`, both computed by the same function over the
same archive:

| what | lost | n | rate |
|---|---:|---:|---:|
| the team with **more shot attempts** | 2,228 | 4,100 | **54.3%** |
| the team that **controlled play while the score was level** | 1,560 | 3,925 | **39.7%** |

**Raw attempts are anti-predictive. Attempts taken while the score was level are
predictive** — the club that controlled level play wins **60.3%** of the time.

⭐ **AND `level` IS ALREADY DEFINED THE CAREFUL WAY.** `archive.js` states its own
rule: *"even-strength shot attempts taken while the score was level, in
regulation."* It has already removed the power play, the empty net and overtime.
Nothing in §3 or §4 below is a correction to it — those measurements exist to
explain WHY the two rows differ, which is a different job.

⛔ **`moreLevelControlLost` REACHES NO SURFACE.** It appears twice in the shipped
HTML and both are `archive.js`'s own source, inlined into the bundle — the
computation, not a reader. Reproduce:

```
grep -rn "moreLevelControlLost" src/ builders/ --include=*.js --include=*.py
```

`moreAttemptsLost` is read in `builders/build_index.py` (the hero's line) and
`src/app.js` (`drawNewcomer`). Its answer is read nowhere.

### 1.1 ⚠️ BUT THE CONCEPT IS NOT MISSING, AND THE FIRST DRAFT OF THIS DOCUMENT SAID IT WAS

**Checked before claiming, because a row calling something unbuilt when it is
already on disk is this project's B3 defect and it has shipped twice.** What
exists today:

| | |
|---|---|
| `src/lib/layers/tied.js` | **a complete reducer**, `tiedControl`, carrying the rule string *"even-strength shot attempts taken while the score was level, in regulation"* — **byte-identical to `archive.js`'s own**, which is why the game and the archive agree |
| `src/app.js:1703` | already calls it every game, and feeds `levelCurve` into the verdict |
| `src/lib/sentence.js` | the end-of-game verdict says *"Of the games where a team led that count by {k} or more, it lost {count} of {n}"* |

⭐ **SO THE PIECES ARE ALL BUILT, AND THE COMPARISON IS WHAT IS MISSING.** The
site states `54.3%` **at the top** — the home page hero and the game page's
newcomer block — and states a level-control rate **at the very end**, scoped to
this one game's own margin, in a card a visitor only reaches by playing to the
final horn. **The two are never put side by side, and the archive-wide `39.7%`
that would do it is never said at all.**

⛔ That is a smaller claim than "the site never says this", and it is the true
one. It also makes §6 cheaper than the first draft assumed: there is no reducer
to write.

---

## 2. ⭐ It is a dose-response, not a threshold

`measures.json` → `levelCurve`: of the clubs that controlled level play by **k or
more** attempts, how many lost. This is the guard against the defect the
below-the-rink work already paid for — **no tuned threshold**, because a rate
that only appears at one cutoff is a cutoff, not an effect.

| control edge | games | lost |
|---|---:|---:|
| ≥ 1 | 3,925 | **39.7%** |
| ≥ 5 | 2,155 | 39.1% |
| ≥ 10 | 1,002 | 37.3% |
| ≥ 14 | 515 | 33.2% |
| ≥ 17 | 292 | **30.5%** |

Monotonic across the range where `n` is large, and it **strengthens** with the
margin. Beyond k≈20 it wanders, which is what a shrinking `n` looks like and is
why no sentence should quote the tail.

---

## 3. The mechanism, measured locally

Why should the two rows in §1 differ at all? Because **a club that is behind
attempts more, and a club that is ahead attempts less.** LOCAL, 48 games — a
club's shot attempts per 60 minutes, by the score it is playing to:

| | attempts | minutes | per 60 |
|---|---:|---:|---:|
| **trailing** | 2,030 | 1,897 | **64.2** |
| tied | 2,196 | 2,241 | 58.8 |
| **leading** | 1,616 | 1,897 | **51.1** |

**1.256× trailing over leading**, and monotonic through tied.

⭐ **IT IS A PAIRED DESIGN, WHICH IS BETTER THAN IT LOOKS.** Every second in which
one club leads is a second in which the other trails, so the two rows cover
**identical minutes** — 1,897 each, and that equality is an arithmetic invariant,
not a coincidence to be pleased about. Nothing about schedule, venue, opponent or
game length differs between the two rows. Only which side of the score.

---

## 4. The confounds — two tested, one remaining

⭐ **EMPTY NET AND THE POWER PLAY DO NOT EXPLAIN IT.** The obvious objection is
that a trailing club pulls its goalie and shoots at will. Measured, same 48
games, restricted to even strength:

| | trailing | tied | leading | ratio |
|---|---:|---:|---:|---:|
| all situations | 64.2 | 58.8 | 51.1 | 1.256× |
| **even strength only** | **63.1** | 59.3 | **51.1** | **1.236×** |

The effect barely moves. And the time split is **identical** for leading and
trailing — 75.7% even, 20.9% power play, 3.4% empty net — again by the same
invariant: they are the same seconds. Empty-net time is 3.4%, not enough to carry
a 24% difference.

✅ **AND THAT EVEN-STRENGTH ROW IS ARCHIVE-WIDE NOW, 2026-09-10** (`census.pace`'s
`evenLead` / `evenTied` / `evenTrail`, `12d5ec4`). It is a CROSS-TAB rather than a
narrowing: the three all-situations buckets still mean what they always meant, and
three more ask the score question inside even strength only.

| | trailing | tied | leading | ratio |
|---|---:|---:|---:|---:|
| all situations | 65.55 | 58.57 | 52.61 | **1.246×** |
| **even strength only** | **63.58** | 59.09 | **53.21** | **1.195×** |

⭐ **So the pulled goaltender and the power play carry about a fifth of the effect
and not the rest**, over 4,192 games — and `balancedEven` is published true, so
the two rows cover identical minutes (132,482.4 each) by the same invariant the
all-situations pair has. ⚠️ **The archive is slightly LESS flattering than the
48-game sample was** — 1.195× against the local 1.236× — which is the direction a
small sample errs in on this project for the fourth recorded time.

⚠️ **THE REMAINING CONFOUND IS SELECTION, AND IT CUTS THE RIGHT WAY.** Clubs that
lead are on average the better clubs, and while the score is level the better club
attempts *more* (that is §1's second row). So selection pushes the leading row
**up**, against the observed direction. **1.236× is therefore a floor, not a
ceiling** — but that is an argument, not a measurement, and it is labelled as one.

⛔ **AND ONE THING THIS DOES NOT ESTABLISH.** None of §3 or §4 shows that leading
*causes* a club to attempt less. A club can be ahead because it is being outplayed
and got the bounces, in which case the attempt gap is the cause of nothing. The
claim the measurements support is **associational and that is enough for the
sentence in §6**, which describes what the archive contains rather than what
causes what.

---

## 5. ⛔ Why this is probably not a layer

Three independent reasons, any one of which would be enough.

1. **It has no location.** A layer on this site is marks on ice; the contract is
   events with positions. Score state is a property of the CLOCK. Drawing it as
   marks would be drawing a temporal fact spatially, which is the shape §5 of the
   doctrine refuses for skater positions and the same argument applies here.
2. **The site already owns the right control shape.** *"Even strength only"* is a
   filter that applies to every layer without being a layer. Score state is the
   identical kind of thing — a condition on WHEN, not a new thing to count.
3. **A seventh chip would tell the Attempts layer's story a second time.**
   §A4.2's ruling — *not every lens needs a chip* — was written for exactly this,
   and the who-was-on-the-ice decision is the precedent.

---

## 6. What it is instead — two surfaces, and one of them is nearly free

### 6.1 THE SENTENCE, beside the one it answers ⭐ *highest value, smallest change*

`drawNewcomer` in `app.js` already says: *"Across the whole archive, the team with
more shot attempts loses more often than it wins — 2,228 of 4,100 games."* It
stops there, and a reader is left with a paradox and no way out.

The second row of §1 is the way out, from the same document, computed by the same
function over the same archive. **No new derivation, no derive run, no census
field.** It reads `RATES.baseRates.moreLevelControlLost` exactly as the existing
line reads `moreAttemptsLost`.

⚠️ **THE TWO RATES HAVE DIFFERENT `n` (4,100 and 3,925) AND BOTH MUST CARRY IT.**
They are different populations — a game with no level-play edge is dropped from
the second — and a pair of percentages side by side with one `n` between them
would be the denominator defect this project has now shipped twice.

### 6.2 THE CONTROL, on the Attempts layer

*"While the score was level"*, sitting where *"Even strength only"* sits, scoping
the same layer. ⭐ **THE REDUCER IS ALREADY WRITTEN AND ALREADY RUNNING** —
`tiedControl` in `src/lib/layers/tied.js`, called on every game at `app.js:1703`.
This is wiring a control to a reducer the page already computes, not a new
measurement.

⭐ **AND IT MAKES THE EXISTING LAYER HONEST RATHER THAN ADDING A SEVENTH.** With
it on, the count under the ice is the quantity §1's second row is about, so the
archive sentence and the number on screen finally describe the same thing. Today
they do not, and nothing says so.

---

## 7. What I would build, in order

1. **§6.1, the sentence.** Nothing blocks it. It answers the site's own headline
   with a number the site already ships, and the change is one `RATES` read
   beside an existing one.
2. **§6.2, the control** — after CHENG rules on Q2 below. Cheaper than it looks:
   the reducer exists and runs today (§1.1).
3. **A census field**, only if §8 Q3 says the per-60 gradient should ever be
   quoted on a surface. It is needed for neither of the above.

---

## 8. What I want CHENG to rule on

1. ⭐ **Does the 39.7% belong beside the 54.3%, or does it defuse the hook?** The
   paradox is what makes a visitor press Play. Answering it in the same breath may
   be the honest thing and the less compelling thing, and I do not think I can
   judge that from inside the build.
2. ⭐ **Is "while the score was level" a control or a layer?** §5 argues control.
   The counter-argument is that a control nobody presses teaches nothing, while a
   chip is discoverable — and the whole below-the-rink redesign was about
   discoverability.
3. ⚠️ **May a surface ever quote the per-60 gradient (§3)?** It is the mechanism
   and it is the vivid part, but it is LOCAL, and archive-wide it would need a
   census field. My view: not until it is archive-wide, and the §6.1 sentence does
   not need it.
4. ⛔ **Is the associational framing in §4 enough?** The sentence would say the
   archive contains this pattern, not that leading causes it. The precedent that
   says yes is the blocked-shot card, which states a rate and refuses a mechanism.

---

## 9. ✅ CHENG'S RULINGS — 2026-09-10, and §6.1 shipped the same day

### 9.1 Q1 — **build it**, and the worry had the hook backwards

> *"The worry assumes the hook is the mystery. It isn't. The hook is that two
> honest counts of nearly the same thing land on opposite sides of 50%. An
> unresolved 54.3% is a curiosity — huh, weird. The pair is an **argument**, and
> it's the site's actual thesis stated in two lines: which number you count
> changes the answer."*

And the doctrinal half, which settles it independently: *"publishing 54.3% alone
and leaving the reader to conclude shot counts are meaningless is teaching the
opposite of the truth from entirely true data — the same failure as a filtered
list without its base rate. **We hold the number that corrects it and we're not
showing it.**"*

✅ **BUILT** — both surfaces, `cb9e47f`. Fractions on both, because the two rates
have different denominators; the connective is read from the data.

### 9.2 On the dose-response, with two conditions

*"The strongest evidence in the document."* Conditions when it reaches a screen:
**stop quoting where `n` gets thin** (the k≥17 tail is where a reader over-reads),
and **fraction, never a rate**, all the way down. ⏸ Not on a surface yet.

### 9.3 On the mechanism — ⭐ and the condition has since been MET

*"48 games, labelled as such throughout, is the right discipline and it means
none of these numbers ship. The archive rates are publishable; 1.256× is a
mechanism explanation and needs the census before it appears anywhere."*

✅ **THE CENSUS EXISTS NOW** (`census.pace`, `2c2a79a`) and the archive says
**65.55 / 58.57 / 52.61 per 60, a lift of 1.246×** over 4,192 games — so the
local 1.256× was a good estimate and the mechanism **is now quotable**. Nothing
quotes it yet.

✅ **AND SO DOES THE CONTROL THAT ANSWERS THE FIRST OBJECTION** (`12d5ec4`, §4):
**1.195× at even strength only**, archive-wide. Any sentence about score effects
meets *"isn't that just the pulled goalie?"* immediately, and until this the only
answer on file was 48 games.

### 9.4 Q2 — not a layer, and all three reasons hold

*"Score state has no location — a layer draws on ice and this has nothing to
draw. The site owns the control shape already. And a seventh chip would tell the
Attempts layer's story twice."* So: **a filter on Attempts, and a sentence beside
the 54.3%.** *"That makes the existing layer honest rather than adding a rival to
it, which is the better outcome and the smaller build."*

### 9.5 ⛔ AND §6.2 IS BLOCKED BY A RULING THIS DOCUMENT DID NOT CHECK FOR

§6.2 says the control sits *"where `Even strength only` sits"*. ⛔ **That place is
empty.** The situations control was **removed on 2026-09-07** at Kevin's word:

> *"Seems like we are making an 'advanced' toggle available to a novice, without
> really explaining what the relative importance of the toggle is. Do we need the
> toggle to be surfaced, or just use it for internal calculations?"*

and the recorded answer — *"every other control here names a RULE a reader can
check on the ice; even strength only is not a rule, it is an analyst's
adjustment, and a novice cannot decide whether to press it without a paragraph
about why power-play shots inflate a count. That paragraph is exactly what the
learn cards refuse to carry"* — applies to a level-score control word for word.

⭐ **THE HOLD HAS A STATED EXPIRY AND IT IS NOW HALF-MET.** The `All situations`
card is that paragraph, for the strength half. Whether that reopens the control
is **Kevin's decision and not CC's**.

⚠️⚠️ **AND THIS IS THE THIRD DOCUMENT IN THIS PROJECT TO PROPOSE SOMETHING BY A
PREMISE NOBODY GREPPED FOR.** CHENG: *"the rule that keeps being restated — grep
`src/` for the thing before proposing it — isn't holding as a habit, so it should
become a step in the artifact template rather than a lesson. Two minutes, and
it's caught three false premises."* **§0 of the next artifact carries that step.**

---

## 10. ⏭ What is still open

1. **§6.2**, on Kevin's ruling (§9.5).
2. **The dose-response on a surface**, under §9.2's two conditions.
3. **The mechanism figures**, now archive-wide and quotable — with the
   even-strength control beside them since 2026-09-10 — and still nowhere quoted.
   ⭐ **The obvious home is a twelfth learn card**, on the precedent the eleventh
   just set: the measurements half may state how often, a card can carry a
   measurement where it cannot carry an argument, and the card would sit beside
   `All situations` saying the other half of the same lesson — part of an attempt
   lead is the power play, and part of it is the scoreboard.
4. ⭐ **Kevin's own next question, and the bigger one:** *"score-effects, even
   strength, power play/penalty kill type of information that we need to be
   seamless across the site (which I'm not sure that's the case currently)."*
   The site now says situation-and-score things in **four places built
   separately** — the front door's paired rates, the newcomer block, the
   `All situations` card, and the replay's power-play pill plus its `MODE()`
   line. **Nothing has audited them as one vocabulary.** That audit is the next
   deliverable, and it is not a build.
