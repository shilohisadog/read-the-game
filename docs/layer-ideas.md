# The next layers — two lenses and one attribute

**For CHENG. Kevin, 2026-09-09**, after a pass over the candidate list:

> *"zone starts might be good, point shots might be another one… who's on the ice
> could be interesting, it would have to be associated with an event though (I
> think), because just having it as a layer seems cumbersome… not sure how much
> value shifts would have as a layer? C3 is really two separate things I think,
> C5 would be a good layer, C6 is already built."*
> *"I like all three of those, 2 layers and one attribute."*

**Three of those four observations were corrections to the record, and all three
were right.** They are actioned in §6.

---

## 0. Method, and what is measured against what

Every figure below says which population it came from, because three different
ones are in play and they are not interchangeable.

| tag | what it means |
|---|---|
| **ARCHIVE** | published in `measures.json`, computed by the weekly derive over **4,192 games**. Quotable on a page. |
| **SAMPLE** | 224 games drawn at random, stratified across all four seasons and both regular season and playoffs. Indicative. **Not quotable** until the derive confirms it. |
| **UNMEASURED** | nothing has computed it. Named as a gap, never as a number. |

⚠️ **The first pass at this used the newest 40 games and they are playoff-heavy**,
which ran hits high and penalties low. Every rate here is from the stratified
sample instead. The structural findings (§5) do not move with the population;
the rates do.

---

## 1. What is already ruled, and is not reopened here

- ⭐ **FLAT** (Kevin, 2026-08-30, `status.md` §A4.1): *"I prefer a flatter
  taxonomy… that puts yet another decision in front of the user."* No family
  gates. Grouping may survive as **typography, never as navigation.**
- ⭐ **NOT EVERY LENS NEEDS A CHIP** (§A4.2): a lens has two possible jobs — a
  control on the rink, and a sentence in this game's story — and they need not be
  the same surface. **This is what makes the third item below an attribute rather
  than a layer**, and Kevin arrived at the same place from the other direction.
- ⛔ **DOCTRINE §5**: real skater coordinates are not public and we do not fake
  them. This decides §4 completely.

**The picker holds six chips today.** Two more takes it to eight, which is inside
the 11-chip measurement §A4.1 priced (6 rows, 320px at 390). The third item adds
no chip at all.

---

## 2. ZONE STARTS — a layer, and its base rates are already published

### 2.1 The mark needs no threshold, which is rare

**Every faceoff sits on a painted dot.** Over the sample, 2,388 of 2,388 draws
land on exactly **nine positions** — three distinct `(|x|,|y|)` pairs, `(69,22)`,
`(20,22)` and `(0,0)`, which are the four end-zone dots, the four neutral-zone
dots and centre ice.

⭐ **THE COORDINATE *IS* THE DOT.** There is nothing to derive, no radius to
choose, and a reader can check the mark against the paint on the ice. That is the
same property that made the slot shading defensible — *every edge lands on a
face-off dot so a viewer can check it* — arriving in a second place.

Distribution: **68.6%** end-zone · **18.5%** centre · **12.9%** neutral.

### 2.2 ⭐ AND THE SENTENCE IS ALREADY MEASURED — ARCHIVE, 4,192 games

`measures.json`'s `census.endZone` is the **controlled** answer, and the census
comment says it is *"the one a sentence may quote"*:

| | attempts in the window after the draw | n |
|---|---:|---:|
| the club **attacking that end**, having **lost** the draw | **1.163** | 165,420 |
| the same club, having **won** it | **1.683** | |
| **what winning is worth**, therefore | **0.52** | |

> ⛔ **THE OBVIOUS SENTENCE IS AN OVER-CLAIM, AND IT WAS LIVE FOR A DAY**
> (corrected 2026-09-10). *"Where the draw is taken is worth about 2.2× what
> winning it is"* asserts a **place effect measured against not being there**,
> and this table has **no such baseline** — it fixes the END and varies only the
> winner. `zoneWorth` is a **level**; `winningWorth` is a **difference**. Writing
> both with a `+` is what made a reader parse it as *losing gets you more*.
>
> ⭐ **What it supports is a decomposition of one number: of the 1.683 an
> attacking club gets from an offensive-zone draw, 1.163 arrives whether or not
> it wins — and that part is 2.2× the 0.52 winning adds.** Same ratio, and a
> claim the measurement can carry.

⚠️ **The uncontrolled table is the one that misleads**, and it is why `endZone`
exists: `faceoffZone` reads **2.395×** in the offensive zone, **1.132×** neutral,
**0.712×** defensive — but the same physical draw lands in the O row or the D row
*depending only on who won it*, so that table cannot separate *being there* from
*winning there*. **A layer may quote `endZone` and may not quote `faceoffZone`.**

⭐ **This also explains the site's cleanest null.** The archive's faceoff-share
result is 50.4% — nothing. The zone gradient shows why: **the season total adds
up quantities with opposite signs.** That is a genuinely good thing to teach, and
it is a finding the site already owns and has never surfaced.

⚠️ **AND THE 8-GAME SAMPLE WAS WRONG IN A NAMED DIRECTION.** `census.js` records
its own pilot at **1.29 / 0.30**; the archive says **1.163 / 0.52**. The zone half
came down slightly and **the winning half nearly doubled**. Worth stating because
the pilot is still written in the file, and because it is the third time a small
sample has erred in the direction that flattered the argument being made.

### 2.3 ⛔ C5 is not a second layer — it is this one's base rate

`status.md` C5 is *"OZ/DZ faceoff split"*, filed as a separate item. It is the
**question this layer's sentence answers**, and the answer above is already
computed. Layer plus measured claim is the pattern every other lens on the site
follows. **Filing them separately double-counts one piece of work.**

### 2.4 What is still open

- **Does the mark carry who WON the draw?** Colour by winner is one bit and it is
  recorded. It also turns the layer from *where play restarted* into *who took
  it*, which is a different lesson. My view: **yes**, because the sentence is
  about winning and a mark that cannot show it leaves the sentence unillustrated.
- ⚠️ **`drawStrength` says a draw is worth 4.302× on a power play against 1.273×
  at even strength** (ARCHIVE, n=22,790 / 190,144). That is a *bigger* effect than
  the zone one and it is not what this layer is about. **Two findings competing
  for one surface** — `one-measure.md` says one measure per screen, so the power
  play version does not belong in this chip.

---

## 3. DEFENCEMEN'S ATTEMPTS — a layer, and "from the point" is the wrong name

### 3.1 ⛔⛔ THE TRAP: you cannot define a point shot by where it is drawn

**A blocked shot is recorded where it was STOPPED, not where it was taken.** The
page's own legend says so — *"blocked — ringed where the puck was stopped"* — and
the consequence for this layer had not been noticed.

Measured on defencemen's shots, `|x|` in feet from centre ice (the net is at 89,
the blue line at 25):

| D's attempts | median distance from centre |
|---|---:|
| **blocked** | **65 ft** — 24 ft from the net |
| on goal | 46 ft |
| missed | 45 ft |

**Blocked shots appear closer to the net than shots that reached it.** That is
impossible for a shot location and exactly right for a block point.

⭐ **AND IT BITES HARDEST ON PRECISELY THIS LAYER.** A shot from the point is the
most-blocked kind there is, so a location-defined "from the point" lens would
systematically drop the very shots that make the point interesting — and it would
look plausible while doing it, because what is left is a tidy cluster at the blue
line.

### 3.2 So it is defined by the SHOOTER, which is 100% populated

`pos` is on every player on every roster. No derivation, no coordinate, no trap.

**SAMPLE — 224 games, 26,563 attempts:**

| | share of attempts | blocked | on goal | missed | goal |
|---|---:|---:|---:|---:|---:|
| **Forwards** | 67.1% | **23.3%** | 45.0% | 25.2% | **6.6%** |
| **Defence** | **32.9%** | **37.6%** | 37.1% | 22.5% | **2.8%** |

> **A defenceman's attempt is blocked 37.6% of the time and a forward's 23.3% —
> 1.62×. A forward's is 2.4× as likely to end up a goal.**

⭐ **Two lessons out of one lens, and neither needs a model.** A third of the
shots come from the back end; they are blocked far more often and score far less.
That is *why* a team wants the puck low, told with counts.

⛔ **UNMEASURED ARCHIVE-WIDE.** Nothing in `measures.json` splits by shooter
position. `attemptMix` has the overall blocked rate (**27.7%** of 500,720
attempts, ARCHIVE) and nothing by who took it. **This needs one census field and
one derive run before a page may print any of it.**

### 3.3 What is still open

- **The name.** *"From the point"* is what a fan calls it and it is the thing we
  cannot honestly compute. *"Defence"* is what we can compute and is not what a
  fan calls it. **My recommendation: the chip says `Defence` and the caption says
  what it counts** — the same rule that made `Attempts` a chip and `on goal,
  missed or blocked` its caption.
- **What the mark does.** Every existing lens either shades the ice or rings a
  mark. This one has no geometry of its own — it is a property of the shooter. The
  honest drawing is to **ring the attempts a defenceman took**, which is the
  Blocked layer's shape applied to a different predicate.

---

## 4. WHO WAS ON THE ICE — an attribute, and Kevin is right that it cannot be a layer

### 4.1 It is buildable now, and the numbers are good

`shifts` is carried on every extract — **825 records a game, and nothing has ever
read it.** Resolving the six on the ice at an event's own second:

**SAMPLE — 224 games, 1,413 goals:**

| | |
|---|---:|
| goals giving a plausible skater count on both sides (3–6) | **97.9%** |
| the scorer and both assists present in that set | **97.4%** (n=3,776) |
| commonest counts | 5-5 (62.7%), then 4-5 / 5-4, then 6-5 |

The 4-5 and 5-4 rows are power plays and the 6-5 rows are a pulled goalie, so the
distribution is hockey rather than noise.

### 4.2 ⛔⛔ THE INTERVAL CONVENTION IS LOAD-BEARING AND FAILS QUIETLY

A shift record is `{p, t, s, e}`. At an event the play stops, so one shift ends
and the next begins **on the same second**. Three conventions, measured over the
same goals:

| | plausible count | **names the right players** |
|---|---:|---:|
| `s <= t <= e` | 5.7% | 98.0% |
| `s <= t < e` | **95.9%** | ⛔ **16.2%** |
| **`s < t <= e`** | **97.9%** | **97.4%** |

⚠️ **The middle row is the dangerous one.** It produces a *correct-looking*
strength — 5-on-5 nearly everywhere — and names the right players one time in
six. A page built on it would show a plausible situation and the wrong six names,
and **no check on the count would catch it**. The instrument that separates them
is asking whether the players the event itself names are in the set.

### 4.3 Why it is an attribute and not a lens — two independent reasons

1. **Kevin's:** *"just having it as a layer seems cumbersome."* Six names a side
   is a roster readout, not a mark; a chip that turns on twelve names is a panel
   wearing a lens's clothes.
2. ⛔ **Doctrine's, and it is decisive:** we know **who**, never **where**. There
   are no public skater coordinates, so there is *nothing to draw on the ice*.
   `docs/on-the-ice.md` and DOCTRINE §5 already settled this — *"players are
   arranged by role, not by tracked position — real skater coordinates aren't
   public, so we don't fake them."*

**So the surface is the event, not the rink.** It belongs beside the active-player
line, which is already *"a sentence beside the thing it is about"*, and it is
retrospective in the same way the whistle card is.

### 4.4 ⛔ Shifts as a layer of its own — declined, agreeing with Kevin

*"not sure how much value shifts would have as a layer?"* — none. A shift has no
location and no outcome; there is nothing to mark and nothing to count that a
reader would want. **It is the input to this attribute, not a lens.**

---

## 5. What the measuring found that was not about layers

Three of these cost nothing to record and would each have cost a session to
rediscover.

| finding | where it bites |
|---|---|
| ⛔ **a blocked shot carries the BLOCK point** | any lens keyed on where a shot was taken |
| ⛔ **the shift interval is `s < t <= e`** | anything resolving a moment from `shifts` |
| ⚠️ **the "55% of the stream is uncounted" figure was wrong** | it is **49.8%** on the newest 40 games, and the per-type rates in the note were all off. It was written from memory into a note that carries a *"never quote counts from memory"* warning. |

⭐ **The uncounted share is still the argument for doing any of this.** `hit`,
`faceoff`, `giveaway` and `takeaway` are about **164 events a game that no layer
counts**, and every lens on the site works on the other half. Zone starts takes
the largest of those four off that list.

---

## 6. Three corrections to `status.md`, all Kevin's

| | |
|---|---|
| **C6 is built** | Not merely built — **he locked it in himself** on 2026-09-08: *"the offside diagram is good right now, locked in."* That quote is already in §G's ruling table, and row C6 still reads *"Parked for the novice test."* **A status row wrong about its own subject, again.** |
| **C3 is two things** | Zone starts comes from **faceoff coordinates**; who's-on-the-ice comes from **`shifts`**. They do not share an input, a reducer, or a surface. They were filed together because they were written on the same day. |
| **C5 is not a layer** | It is §2.3 — the base rate of the zone-start layer, and already computed. |

---

## 7. What I would build, in order

1. **The census field for shooter position** — one accumulator in `census.js`,
   published by the weekly derive. **Nothing can be drawn honestly until the
   37.6%/23.3% is archive-wide**, and this is the only item with a waiting
   dependency. Cheap, and it is `GUARD WHERE THE ARCHIVE IS` applied: a rate a
   page will quote gets computed where the whole archive is walked.
2. **Zone starts.** The mark needs no threshold and the sentence is already
   published. It is the most finished idea on this page.
3. **Who was on the ice**, as an event attribute, once the interval convention has
   a test that would fail on `s <= t < e`.
4. **Defencemen's attempts**, after (1) lands.

---

## 8. What I want CHENG to rule on

1. ⭐ **Does the zone-start mark carry who WON the draw?** It is one recorded bit
   and it makes the sentence illustrable — and it also changes the lesson from
   *where play restarts* to *who took it*. §2.4.
2. ⛔ **Is `Defence` an honest chip name for a lens a fan would call "from the
   point"?** The thing we can compute and the thing a reader means are not the
   same set, and §3.3 proposes chip-names-the-set, caption-names-the-rule.
3. ⚠️ **Where does the on-ice attribute live** so it does not become a second
   narrator? `B4`'s ruling was *one narrator, many ledgers* — the rink narrates
   *now* and anything below is retrospective. Twelve names is a lot of ledger.
4. **Is 97.4% enough to name players on screen?** One goal in forty has a
   scorer or assist the shifts do not place on the ice. The precedent that says
   yes is the highlight (6.6% of goals have none and the surface simply does not
   appear); the precedent that says no is that a *wrong* name is worse than a
   missing one. **My view: it is enough only if the miss is silent** — show the
   set when it resolves and nothing when it does not, never a partial six.

---

## 9. ✅ CHENG'S RULINGS — 2026-09-09. All four, and two tightened the design

### 9.1 Q4 — 97.4% is enough, but ⛔ **silent is not the same as invisible**

> *"A missing video clip is obviously a missing artifact. A missing name list
> looks like we decided nobody was on the ice. One is legibly absent, the other
> is ambiguous."*

**He is right and my framing was wrong.** I proposed *show when it resolves,
nothing when it does not*, and reached for the highlight as precedent. The
highlight's absence is self-explaining — no video, no section. **A missing name
list reads as a claim**, and the reader has no way to tell it from six empty
seats.

**So the block's absence is stateable rather than blank:** *the shift chart does
not place everyone this play names.* That is the `refused` versus `missing`
distinction — the same one `extract.py` draws by leaving a field out rather than
nulling it — applied to a rendering. The calendar cell precedent is his: a cell
reading `2` with nothing clickable was not fixed by hiding it, it was fixed by
saying why.

⚠️ **AND A LIMIT ON THE FIGURE ITSELF, which I had stated loosely.** 97.4% is
**"the players the event names are in the set"** — the scorer and both assists.
It says **nothing about whether the other seven or eight are right.** *"The set
is right 97.4% of the time"* is what a reader will take from it and is not what
was measured. **The limit travels with the number wherever it is quoted**, and it
is now in `extract.py`'s comment as well as here.

### 9.2 Q3 — it is a **ledger**, and the test is recomputability

CHENG sharpened `B4` past where I was reading it. The rule is not *"anything
below the ice is retrospective"* — it is:

> **A card may state a condition true at the playhead, and the test is whether it
> can be recomputed from game state at the playhead alone, with no reference to
> when it started.**

*Who is on the ice* passes exactly: `shifts` evaluated at `t`, no history, no
memory. **Same standing as the empty-net note and the penalty box**, both of
which are conditions and both of which live below the ice without narrating.

Two conditions, both of which are really one:

1. ⛔ **It must disappear when it cannot be computed.** A condition card that
   persists after its condition stops holding **becomes an event narration** —
   the failure mode the empty-net note was tested against.
2. ⛔ **It must not carry a verb.** *"Reinhart is on the ice"* is a condition;
   *"Reinhart came on"* is an event, and it drifts. **The name list alone is the
   safe form.**

### 9.3 Q2 — `Defence` is honest, *from the point* is not

Ruled as proposed, with the reason stated better than I had it:

> **The set is what we can verify and the phrase is what a fan means, and only
> one of those can be checked.**

`Defence` is checkable against `roster.pos` on every event. *From the point* is a
location claim, and §3.1's trap says why we cannot make it. **The caption does
the translation** — *"defencemen — what a fan calls the point"* — which is the
same move as naming the slot band by its rule rather than by *high-danger*, and
it avoids borrowing a phrase whose established meaning we cannot match.

### 9.4 Q1 — carry the winner, and it does **not** split the lesson

My worry was that showing who won turns *where play restarts* into *who took it*.
CHENG: **the census already says which one matters.**

| | |
|---|---:|
| the attacking club, having **lost** the draw | **1.163** attempts |
| what **winning** adds | **0.52** |

> **The part you get anyway is 2.2× the part winning adds** — ⚠️ NOT "where is
> worth 2.2× who", which claims a baseline this table does not have (§2.2).
> So a mark carrying both is not a competing lesson
> — it is **the comparison that makes the lesson land**, and it explains the
> site's cleanest null in the same breath.

⭐ **Condition: the mark shows both and the caption states the ratio.** Showing
the winner *without* the comparison is exactly where it would become *who took
it*.

### 9.5 On the traps, and one instrument he is asking for

- The **blocked-shot location** finding is *"an internal contradiction proving the
  field means something other than what it looks like"* — same shape as the SOG
  check that should have caught the blocked-shot flip.
- The **shift interval** is *"the seventh instance of the instrument covering less
  than its name implies, and the first where the wrong answer looks more
  plausible than the right one."* He asked for it in the extractor's comment
  rather than only here. **Done** — `builders/extract.py`, at `sh = [...]`.
- ⛔ **`55% → 49.8%` is the fourth recalled figure, and the second inside a
  document warning against it.** His conclusion, and it is a proposal rather than
  a ruling: *"the rule keeps getting stated and the habit isn't holding — which
  argues for the mechanical version: **any figure in a doc carries the command
  that produced it**, the way the `file:line` checker made citations
  verifiable."*
  **⏸ NOT BUILT, and it is the most valuable open instrument on this page.**
  `tools/refcheck.py` already proves the shape works for citations. The cheap
  first version is figures quoted from a published document carrying their JSON
  path — `measures.json:census.endZone.zoneWorth` — which a checker can verify
  against the live document with no archive walk at all.

---

## 10. ✅ BUILT — the accumulator, 2026-09-09

> CHENG: *"Build the accumulator first. Shooter position unmeasured archive-wide
> means the Defence layer can't be drawn honestly at all… It also unblocks the
> only number on that layer worth putting on screen — 1.62× blocked, 2.8% versus
> 6.6% scoring — which is the lesson, not the lens."*

`census.shooter` in `src/lib/census.js`, published by `censusRates`, printed in
the weekly derive's summary. **The next `derive.yml` run puts it in
`measures.json` archive-wide.** Reproduced on the 224-game sample by the reducer
itself, independently of the Python that first measured it: **D 33.0% of
attempts, blocked 37.6%; F 67.0%, blocked 23.4%.**

**Two archive-wide alarms ride with it, both on the exit code** — an `::error::`
with a zero exit is a green check with a red message in it:

| | |
|---|---|
| ⛔ **an unknown position code** | The archive holds exactly `C L R D G`, counted over 224 games. The tempting shape is `pos === 'D' ? 'D' : 'F'`, which folds a new code into the comparison and **moves both rates**, because the lens is two rows and a third group takes attempts out of one of them. `gameType` is the precedent. |
| ⛔ **the split drifting from its population** | The four outcomes partition `corsi`'s counted set. If they stop summing to `n`, every rate is over an unknown denominator. |

⚠️ **AND ONE CHECK SHIPPED INERT AND WAS CAUGHT BY MUTATION.** *"The population
is corsi's"* passed with the reducer replaced by a local
`['shot-on-goal','goal','missed-shot','blocked-shot']` type test — **because none
of the three fixtures we own contains an event `corsi` drops.** The check named
the right property and could not fail on the data it ran against. It now appends
one shootout attempt to a real event stream, which is the population that
matters: every attempt there is unblocked and from the slot, so admitting it
would move the blocked rate **in the direction that looks like a finding**, on
the one number this lens exists to print.

---

## 11. ⏭ TURNOVERS — the one candidate nobody had assessed (2026-09-10)

Zone starts took faceoffs off the uncounted list, the largest of the four. What
remains that no layer counts: **hits** (~53/game, ruled out — the census killed
it at r = −0.07, opposite in 48.1%), **penalties** (already all over the
scoreboard), and **giveaways and takeaways, ~31 a game, never assessed.**

⚠️ **LOCAL, 48 games. These do not ship** — they are evidence that a question is
worth asking, and the archive figure would need a census field.

| giveaway, by where it happened | n | attempts *against* |
|---|---:|---:|
| in the giver's **own end** | 634 | **1.336** |
| neutral zone | 333 | 1.027 |
| in the giver's **attacking end** | 475 | **0.829** |

| takeaway, by where it happened | n | attempts *for* |
|---|---:|---:|
| in the taker's **attacking end** | 152 | **1.375** |
| neutral zone | 83 | 1.205 |
| in the taker's **own end** | 232 | 0.836 |

Both monotonic, both ≈**1.6×** end to end, and mirror images — *the puck changing
hands matters most near the net you are attacking.* ⭐ **The mark needs no
threshold**, the property that made zone starts defensible: the event carries a
coordinate and the zone comes from `attackZone`, the same constant the blue line
is painted from.

⭐ **THE ORIENTATION WAS VERIFIED, NOT ASSUMED** — `own` means four different
things across event types, so: the player the event names belongs to the team
`own` names in **1,266 of 1,266** giveaways and **382 of 382** takeaways. ⚠️ The
first run of that check said *0 of 1,266*, which was the wrong roster field, not
a finding.

**Three things keep it a proposal:**

1. 48 games is not the archive.
2. ⛔ **It is descriptive and has no control.** A giveaway in your own end happens
   *because* you are already under pressure. `endZone` earned its sentence by
   fixing the place and varying only the winner; there is no equivalent here, and
   without one the layer can say *"this is what follows"*, never *"this is what
   it costs you"*.
3. ⚠️ **Do not compare it to the 2.026 attempts-per-run baseline** — the run after
   a giveaway is the *remainder* of a run and is shorter by construction.

⛔ **AND THE STRONGEST OBJECTION IS THAT IT IS THE SAME LESSON AS ZONE STARTS** —
*where beats what*. The defence is that they are different moments: a zone start
is a set piece, a turnover is open play, and *"do not turn it over at your own
blue line"* is the more actionable of the two. **Weigh that before building.**

It would take the picker to **eight chips**, inside the 11-chip budget §A4.1
priced at 390px.
