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
| **being in the offensive zone**, having *lost* the draw | **1.163** | 165,420 |
| **winning the draw** there, on top of that | **+0.52** | |

> **Where the draw is taken is worth about 2.2× what winning it is.**

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
