# The penalties card — audit, and a sixth diagram

**Written 2026-09-01 for CHENG's review. Nothing here is built.**

Kevin: *"that's the only card that links to a game. Would it provide more
continuity if we used a diagram (somehow) to describe a delayed penalty (as well
as detail the more common penalty types, can't forget the base case)?"*

Measured against **a 46-game stratified sample of the published archive**
(2023-09-23 → 2026-04-13, every 95th game, fetched 2026-09-01) plus the learn
page's own reference game. **Not** against `test/fixtures/` — see §1.4.

---

## 1. The audit

### 1.1 Kevin's premise, corrected — and the correction strengthens it

Four cards door straight into a game: **penalties, control, blocked,
goaltending**. But three of those are in the *"what we count"* half, where a raw
game link is the coherent destination — those cards are *about* the counting.

**In the rules half, penalties is the only one of five without a diagram.** That
is the inconsistency, and it sits in the half a novice reads first.

### 1.2 ⚠️ I TOLD KEVIN THE GAP WAS ZERO. THAT WAS ONE GAME.

From the reference game alone I reported *"the gap is zero seconds in three of
four, and the goalie is never pulled."* Both halves are artifacts of that game.

**109 delayed→penalty pairs across 46 games:**

    exactly 0s      0    0.0%
    1–5s           61   56.0%
    6–15s          24   22.0%
    16–40s         20   18.3%
    >40s            4    3.7%
    median 4s   p90 28s   max 91s

**The gap is never exactly zero archive-wide**, and the reference game's three
zeros are unique to it. This is the same error shape as the *"4× headline that
was 8-game noise"* — a single game's number stated as a fact about hockey.

### 1.3 ⭐ THE REAL DEFECT, STATED CORRECTLY — AND IT IS STRONGER

    events recorded between the delayed call and the whistle:
        0 events   79 of 109   72.5%
        1 event    22
        2+          8

**The gap exists in time and is empty of events 72.5% of the time.** So the card
does not promise a moment that fails to exist — it promises a moment the *feed
does not populate*. A replay that walks recorded events has nothing to put in it,
whatever its duration.

And in the reference game the door lands in, the gap has **no duration at all**
(0s on 3 of 4). So on this card, at this door, there is nothing to show twice
over.

### 1.4 ⚠️ THE TEST FIXTURES ARE STALE, AND THEY NEARLY PRODUCED A FALSE FINDING

Measuring the penalty vocabulary across `test/fixtures/extracts/` gave **62 of 98
penalties with no infraction name**, and I was one step from reporting that
`descKey` was a recent feed field.

It is not. **`2023020207` and the reference game `2023020204` are the same
night — 10 November 2023 — and one has 0 of 5 named while the other has 8 of 8.**
The fixtures were extracted before `builders/extract.py` learned to carry
`pen`/`min`/`sev`.

Archive-wide the field is universal:

    penalties in the sample        325
    with an infraction name        325   100.0%
    with the minutes assessed      325   100.0%
    with `drew` (who drew it)      305    93.8%

**This is a defect in the fixtures, not in this card**, and it is raised here
because any test written for this card against those fixtures would measure last
year's pipeline. It should be fixed on its own.

### 1.5 ⭐ THE EMPTY-NET LINK IS REAL IN OUR DATA, NOT ONLY IN THE RULEBOOK

    delayed penalties where `sit` shows a goalie change across the delay:
        33 of 109   =  30.3%

So *"the other team pulls its goalie"* is not a rulebook flourish we would be
illustrating on faith — it is visible in the situation code on roughly a third of
delayed penalties. ⚠️ **But 0 of 4 in the reference game**, so it still cannot be
shown behind this card's door.

### 1.6 ⚠️ AND THE DOOR IS ALREADY CORRECT — only the words are wrong

I told Kevin the door needed re-pointing. It does not. The rule is *"the first
event of type `delayed-penalty`"*, which is unplayable, so `learn-doors.mjs` maps
it **forward** and records the hop:

    { href: "…&at=1-19:35.1&layer=whistle", type: "penalty", via: "delayed-penalty" }

**It opens the penalty being called, at 19:35.** The card's words promise the gap;
the door has been delivering the call all along. Fixing the words and adding the
figure resolves this without touching the door.

### 1.7 The vocabulary a viewer will actually meet

23 distinct infractions in 325 penalties. Grouped by the rulebook's own kinds:

| kind | n | infractions seen |
|---|---|---|
| **restraint** | 152 | tripping, hooking, holding, interference, holding-the-stick, interference-goalkeeper |
| **physical** | 79 | roughing, boarding, elbowing, fighting, instigator, kneeing |
| **stick** | 75 | high-sticking, slashing, cross-checking |
| other | 19 | delay of game, too many men, misconduct, unsportsmanlike, illegal check to head |

**Three kinds cover 306 of 325 = 94.2%.** Severity: 288 minor, 25 major, 6
misconduct, 6 bench.

⛔ **Those counts justify the taxonomy; they do not go on the page.** Which
penalties exist is the league's; how often each occurs is ours. This is the same
⛔ the faceoffs figure already carries, and for the same reason.

---

## 2. The proposal

A sixth figure, `penalties`, `group: 'rules'`, on `/penalties.html`, built the
way the other five are.

### 2.1 Three steps, in Kevin's order

He named the constraint himself — *"can't forget the base case"* — and it is the
right one: the card currently opens on the exotic thing without teaching what a
penalty is.

1. **A penalty is time.** A player breaks a rule, the referee's arm goes up, and
   he serves **two minutes** while his team plays a skater short. *(The base
   case. 288 of 325 are minors.)*
2. **Three kinds of foul** — restraint, stick, physical — named, not ranked.
   Structurally the faceoffs figure: a taxonomy, three badges, no percentages.
3. **The delayed call.** The arm goes up and **play does not stop** until the
   offending team touches the puck — so the other team can pull its goalie for a
   sixth skater.

### 2.2 What each step can be drawn as

Steps 1 and 3 animate; step 2 is a map, like faceoffs. That mixture is new — the
existing five are each wholly one or the other — and it is the main thing for
CHENG to rule on (§3.1).

- **Step 1**: the offender leaves the ice for the box; the ice shows 5 against 4.
- **Step 2**: three labelled groups. No ice geometry is involved, which is the
  problem — see §3.1.
- **Step 3**: arm up (a marker, not a referee), puck carrier continues, the
  goalie leaves for the bench, six skaters. **Reuses `skaterGlyph` and
  `goalieGlyph` and the staggered `travel()` timing built for the empty net.**

### 2.3 The cross-link, both ways

Kevin: *"then the cross-link for the delayed penalty (crossing over to the 'pull
the goalie' learning card)."*

**Both directions, because the fact is symmetric**: a delayed penalty is one of
the two reasons a goaltender leaves the ice, and the empty-net card currently
teaches only the other one (losing late). The learn cards already carry
`id="{cid}"` anchors — the mechanism exists and is what made the work↔cards trip
two-way.

### 2.4 The card's words, rewritten to say the limit

The offside pattern exactly: *the figure teaches the rule and the sentence
teaches the limit.*

> The arm goes up and play carries on until the offending team touches the puck.
> The feed records the call and the box, never that gap — **79 of 109** delayed
> calls have no event in them at all.

⚠️ **That number is ours and the card is in the rules half.** It may have to go,
by §1.7's own rule — see §3.3.

---

## 3. Questions for CHENG

**3.1 — Is a figure allowed to be part sequence and part map?**
Offside and icing animate; faceoffs is a map and deliberately does not. This one
wants both, and step 2 has **no ice geometry at all** — three groups of words on a
rink is a slide, not a diagram. Options: (a) draw step 2 as marks at the places
those fouls actually happen, which is a *measurement* and breaks the wall; (b)
drop step 2 to prose beneath the figure and keep the figure to steps 1 and 3;
(c) accept a labelled taxonomy on ice. **I lean (b)** — it keeps the figure to
what a rink can show and puts the kinds in the words, where they cost nothing.

**3.2 — Does step 3 duplicate the empty-net figure?**
Both end with a goaltender leaving for a sixth skater. The empty-net figure is
about *losing late*; this one is about *a delayed call*. Same ice, same glyphs,
different cause. Is the cross-link enough, or is drawing it twice the duplicated
clause defect in a new place?

**3.3 — Can a rules-half card quote one of our counts to state its own limit?**
§2.4 needs "79 of 109" to explain why the gap is not shown. The wall says our
measurements do not appear in the rules half. But the offside card already says
*"the feed records the call and the restart, never the crossing"* — a claim about
our data — without a number. **Is the qualitative form the rule, and the number
the violation?**

**3.4 — The door stays put, but should the card mention the goalie at all?**
30.3% archive-wide, **0 of 4 in the reference game**. Step 3 would draw something
this game does not contain, behind a door into this game. Offside has the same
shape and we accepted it there because the figure is a rulebook claim — is that
precedent, or is it a second instance of a thing we should be uncomfortable
with?

---

## 4. What is NOT proposed

- No change to the door (§1.6).
- No change to `builders/extract.py`.
- No penalty-frequency claim on the page (§1.7).
- No referee figure — the arm going up is a marker, not a person.
- No fix here for the stale fixtures (§1.4); that is its own change.

---

# 5. CHENG's rulings — 2026-09-01

| | ruling |
|---|---|
| **3.1** | **Take (b) — step 2 drops to prose.** And (a) is disqualified twice over: *"drawing the three kinds at the places those fouls happen would be inventing coordinates. The taxonomy is a naming of `descKey` values; it carries no geometry."* (c) is the faceoffs ⛔: *"a labelled taxonomy on a rink is a slide with a rink behind it. The rink stops meaning anything."* |
| **3.2** | **Draw it.** Not the duplicated-clause defect — *"that was the same sentence twice in one caption. This is the same picture with two causes, which is a genuinely interesting fact about hockey and one a novice would never guess."* **One condition — see §5.2.** |
| **3.3** | **The qualitative form is the rule; the number is the violation.** |
| **3.4** | **Precedent, and the discomfort is a check on the GRAMMAR rather than on the card.** |

## 5.1 ⭐ THE RULE OUT OF 3.1 — a figure draws what the ice can show

> Steps 1 and 3 are things that happen on ice — a player leaves, a goalie leaves,
> the count changes. **Step 2 is a classification of language.** Different kind of
> object, and prose is where it belongs.

It also keeps the grammar clean: every figure so far is wholly a sequence or
wholly a map, and the mixture would have been the first exception on the card with
the weakest case for one.

## 5.2 ⚠️ THE CONDITION ON DRAWING THE GOALIE TWICE

> *"The two figures must differ in what's visible around the goalie. Empty net:
> losing late, clock low, six skaters attacking. Delayed call: arm up, the **other**
> team has the puck, six skaters because possession hasn't changed yet. If they
> render identically, that's duplication. If the cause is legible in each, it's the
> lesson."*

So the delayed-call figure must show **the puck with the other team** and **the
raised arm**, and the empty-net figure must keep what makes its cause legible.
This is a build requirement, and the test for it is that a reader can tell the two
frames apart with the captions covered.

## 5.3 ⭐⭐ THE WALL, STATED PROPERLY — and it settles more than this card

> **The rules half may state what the record contains; only the measurements half
> may state how often.**

The offside card's *"the feed records the call and the restart, never the
crossing"* is **categorical** — true of every offside ever recorded, checkable by
reading the schema. *"79 of 109"* is a **measurement** with an n, a population and
a date.

So §2.4's sentence loses its number and becomes categorical:

> The league records the call and the whistle, and usually nothing in between.

The number, if it wants a home, goes to the measurements page with the other
homeless figures.

### 5.3b ⚠️ AND THAT SENTENCE DID NOT SURVIVE — nor did my first replacement for it

Kevin, 2026-09-01: *"let's clean up the 'usually' terminology."* The hedge was
**accurate** — 1,027 of 1,394 delayed→whistle pairs over 600 games, 73.7% — so
this was never a correction of the measurement.

My reading was that the sentence had been **aimed** wrongly (at instances rather
than at the schema), and I replaced it with a categorical claim: *"The league
records what the call was for, and where"*, backed by 4,371 of 4,371 penalties
carrying the infraction, the zone and the coordinate against **0 of 1,496** for
the delayed call.

⭐⭐ **Kevin cut that sentence too, and the reason retires the whole line of
argument:**

> *"these are learning cards, not data-driven, education driven."*

A sentence about what our record **contains** is a fact about the pipeline, not
about hockey. On a card whose one job is to teach a rule it does not belong at
all — so the hedge was a symptom of the **audience**, not of the aim, and the
question "does *usually* count as a number?" never had to be answered.

> ⭐⭐ **The test for a rules blurb: does this sentence teach the RULE, or describe
> OUR DATA?**

The wall in §5.3 stands unchanged and is simply not reached here. See
`docs/status.md` §0.0 for the full resolution, including the exception clause
that took three drafts.

## 5.4 ⚠️ AND THE §1.2 SELF-CORRECTION EARNED A STANDING RULE

CHENG, on my reporting one game's numbers as facts about hockey twice in short
order:

> *"That's the same shape as the 4× headline that turned out to be 8-game noise.
> Twice now in short order, which suggests the discipline is right and the habit
> isn't yet — **any number offered in conversation should carry its n out loud**,
> because a bare figure gets remembered as a fact about hockey and then designed
> against."*

## 5.5 §1.4 — filed and instrumented, 2026-09-01

CHENG: *"worth a row of its own, and worth a gate: assert the fixtures were
extracted by the current extractor."* **Done in the same session** — see
`test/fixtures.test.js` and the new *Keeping them honest* section in
`test/fixtures/extracts/README.md`.

Five of seven fixtures were refreshed; the drift had already produced a **false
test** (`render-penalties.test.js` demanded the code call a genuinely short-handed
goal *not* short-handed, and passed for as long as the data was wrong). A
2024020543 fixture was added because no fixture contained the pulled-goalie trap
any more.
