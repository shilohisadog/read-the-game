# The rink and the card are describing different moments

> **A note on the citations below.** They are pinned to `2afbf88`, the revision
> this document was written against, and each carries the text its line must
> contain — `tools/refcheck.py` checks both. They are **historical on purpose**:
> `builders/build_main.py` was 1,100–1,900 lines of inlined JavaScript then, and
> commit `914e638` moved the renderer out to `src/app.js`, leaving every address
> here pointing into a file that is now 403 lines long. Re-aiming them at
> today's code would make a dated description of the code appear to describe the
> current code, which is a worse failure than a number that does not resolve.


**For CHENG. Kevin, 2026-08-16, watching a game on a laptop:**

> *"The card below the rink becomes 'disjointed' with the event by event action
> in the rink, that's not good. We need to overlay (somehow) the event
> information onto the rink, when it happens, and then populate a card below the
> rink as 'most recent metric'."*

CHENG has already diagnosed it and proposed a fix. This audit exists to **measure
the thing before agreeing with it**, and it changes three of his conclusions.

## 0. Method

Live `readthegame.co`, real Chromium, game `2025030416` with `?layer=whistle`,
walked frame by frame. Every claim below is read off the running page or out of
the shipped source, and each is marked which. **CHENG's reasoning is credited
where it holds and corrected where the code disagrees** — we are the same base
model and our agreement is correlated, so an unchecked concurrence is worth
nothing.

---

## 1. The complaint, measured

At every frame, the gap between **the playhead** (the scoreboard clock) and
**the event the card is showing** (its own timestamp), same period only:

```
272 frames carry a card
  median   29s behind        90th   102s behind
  75th     64s behind        max    215s behind   (three and a half minutes)

  under 5s on 22% of frames
```

**On 78% of frames the card is showing something more than five seconds old, and
nothing on the page says so.** The screenshot Kevin sent — scoreboard `10:22`,
card `10:42` — is a 20-second gap, which is *better than median*. He caught it at
a good moment.

This is the number the rest of the document is about. It is not a rendering bug:
the card is showing the correct event. **Its currency is invisible.**

---

## 2. Why it drifts — and CHENG's diagnosis is exactly right

> *"Two surfaces, two different 'now's. The rink narrates every event and the
> card narrates only its events, so the two advance at different rates and drift
> apart between whistles."*

There are ~4.6 offsides a game and a whistle every 30–60 seconds; the rink
advances 300+ times. The card is a **ledger sampled at whistle frequency**,
presented in the **voice of a narrator**, in the **position of a caption**.

> *"It timestamps itself and never states the relationship."*

Same shape as the `#start` link: both halves individually right, the
relationship unstated. Third instance this week.

---

## 3. **The mechanism CHENG names does not exist for whistles**

> *"On the ice, when a whistle happens — a caption like every other event. That's
> your overlay, and the rink already has the mechanism."*

**It does not.** `2afbf88:build_main.py:444 "const SKIP=new Set("`:

```js
const SKIP = new Set(['stoppage','period-start','period-end','game-end','delayed-penalty']);
G.events.forEach((e,n) => { if (!SKIP.has(e.type)) { EV.push(e); EVI.push(n); } });
```

`EV` is the playable stream and it is what drives the caption. **Stoppages are
filtered out of it**, so the caption path can never fire for a whistle. Putting
them in means changing the event stream every other surface counts frames
against — the scrubber's length, `dwell`, the trails, and every test that walks
`a.every(…)`. That is not a small change and it should not be smuggled in as a
copy fix.

### And the mechanism that DOES exist is better than a caption

`src/lib/layers/whistle.js` already computes `now` per mark:

```js
g.now = g.now || w === newest;
```

`now` means **this is the newest whistle at the playhead** — a state that
persists from one whistle until the next. It is already drawn, in `--flag`
orange, solid, at 0.95 opacity against the dashed 0.5 of the older marks:

```css
#rg .wh    { stroke: var(--ink);  stroke-dasharray: 1.5 1.3; opacity: .5 }
#rg .wh.now{ stroke: var(--flag); stroke-dasharray: none;    opacity: .95 }
```

**That orange ring at the top-left faceoff circle in Kevin's screenshot is it.**
Verified live: `1` mark on ice, `1` carrying `.now`.

So **the overlay Kevin is asking for is a label on a mark that already exists.**
Two advantages over a caption, and the second is the one that matters:

1. It does not touch `EV`.
2. **A caption is a ~1.3-second flash** at teaching pace (`dwell` is 650ms × 2),
   which is what killed the ends sentence in R. `.wh.now` is a **state**, so a
   label on it lasts exactly as long as the fact — the same pattern as the
   empty-net note, shipped twice this week and proven.

---

## 4. The mark on the ice has no name — verified on the running page

With the whistle layer **on**, the visible legend is:

```
home shot · visitor shot — white-filled, like the sweaters · puck (jumps between
real events) · goal — either sweater · blocked — ringed where the puck was stopped
```

**Five keys, none of them the whistle ring.** Not permanent, not conditional —
there is no key for it at all. The only naming anywhere is an SVG `<title>`:

> `play restarted here — goalie stopped after sog`

A hover tooltip. **No hover on a phone, and nobody hovers while watching.**

This is the violation §3 of `below-the-rink.md` identified for `k-blk` and
`k-hd` — *a mark drawn on every game with nothing telling a reader what it
means* — still shipping in the whistle layer, and the progressive-legend
machinery built to fix it has no entry for it.

### Which sharpens Kevin's complaint into something better

He said the card goes disjointed from the action. The deeper version:

> **The ice draws an unnamed mark, and the card names an unmarked event. Neither
> surface points at the other.**

The card spends three sentences explaining a stoppage while the ring representing
that stoppage is anonymous six inches above it. Fix the naming at both ends and
the two surfaces are talking about the same thing for the first time.

---

## 5. The raw feed key, on three surfaces

CHENG: *"'Goalie Stopped After Sog' is a raw feed key title-cased."* **Correct.**
`2afbf88:build_main.py:1187 "String(r).replace(/-/g,' ')"` is the whole of it:

```js
const RSN = r => r ? String(r).replace(/-/g,' ') : 'unrecorded';
```

Hyphens to spaces. Nothing else. Every reason in the vocabulary, as the page
shows it today:

```
Icing                            Puck In Benches
Offside                          Hand Pass
Goalie Stopped After Sog         High Stick
Puck Frozen                      Net Dislodged Defensive Skater
Skater Puck Frozen               Referee Or Linesman
Puck In Netting                  Tv Timeout
Puck In Crowd                    Video Review
                                 Delayed Penalty
```

`Tv Timeout`. `Net Dislodged Defensive Skater`. `Sog` unexpanded, in front of the
one audience that does not know the term.

**One correction to CHENG's fix.** He writes *"the body text already says it
properly, so the English exists; the heading just isn't using it."* The English
exists but **it is the wrong length.** `WHY` carries exactly two fields —

```js
Object.keys(WHY['icing'])  →  ["say", "from"]
```

— and `say` is a full teaching sentence (*"Icing — the puck was sent from behind
the centre line all the way past the far goal line untouched…"*). A heading
cannot use it. **`WHY` needs a third field, `name`**, and the fix is a vocabulary
addition rather than a re-pointing.

**And it is three surfaces, not one.** Measured on the live panel: `.rsn` (the
heading), `.whtally` (the tally, which repeats every distinct reason in the game
so far), and the `<title>` on each ring. One table fixes all three.

**Unrecognised keys must still fall through to `RSN`.** The feed can emit a
reason we have never seen, and inventing a label for it would be the guess this
project refuses everywhere else. The fallback is the honest branch, not the
default one.

### One place I would not follow CHENG

He praises `field: rsn` on the card as *"provenance travelling with the claim"*.
The principle is right and this is how the whole site works. But `rsn` **is not a
word**, and it is displayed to the audience that does not know what SOG means.
Keep the provenance; spell it. The distinction we already draw — `rule: NHL Rule
81` versus `field: rsn` — is a genuinely useful one and is worth keeping legible.

---

## 6. "One narrator, many ledgers" — and the amendment it needs

CHENG's proposed rule, and it is the best idea in the exchange:

> *"The rink is the only surface that says this is happening now. Everything
> below it is explicitly retrospective. No card ever narrates."*

It scales — five layers with five present-tense cards below one rink would be R's
density problem with a harder edge — and it maps onto the architecture already:
**the rink is the replay, the panels are show me the work.**

**But taken literally it condemns something we shipped today with his approval.**
The empty-net note is a card, below the rink, in the present tense:

> *"VGK has pulled the goaltender for an extra attacker."*

It should survive, and the reason is a real distinction rather than an exemption:

> **No card narrates an EVENT. A card may state a CONDITION that is true at the
> playhead.**

An event happened at a time and then recedes — a whistle at 10:42 is 20 seconds
old and getting older. A condition is either true now or it is not, and its own
truth is its expiry date. That is exactly why the empty-net note has no drift
problem and the whistle card does.

**This matters because CHENG wants the rule tested.** A test of *"no card
contains a present-tense sentence about a single event"* fails the empty-net note
unless the line is drawn first.

---

## 7. What I would propose

Offered to be attacked. Split by whether it needs a decision.

### Needs none — correctness and naming

1. **`WHY` gains a `name`.** Short written labels for the 15 known reasons,
   feeding the heading, the tally and the `<title>`. Unrecognised keys keep
   `RSN`.
2. **The card's heading goes retrospective.** `Last stoppage · P1 10:42` rather
   than a bare reason and a bare timestamp. One word, and the card stops
   competing with the scoreboard for *now*. This is CHENG's, unchanged.
3. **A legend key for the whistle ring**, gated on the layer, using the
   progressive machinery that already exists (§4).

### Needs a decision, and it is what Kevin actually asked for

4. **Label the `.wh.now` ring on the ice with its reason.** The overlay. A state,
   not a flash; positioned where the event happened; and after (1) it has a short
   sentence to show. **It should not be a second copy of the card** — the ring
   says *what stopped play*, the card keeps the rule, the provenance and the
   tally.

### Held

5. **Dimming the card between whistles** (CHENG's third suggestion). It is a
   taste call about how a reader weighs a surface, on a page a novice is about to
   be handed. §9.

6. **The blocked-shot caption.** CHENG notes *"still an attempt — for the
   shooter"* sits beside a ring drawn at the **blocker's** position, and would
   name the blocker there. I think he is half right: the caption says nothing
   about position, and the legend now carries *"ringed where the puck was
   stopped"*. But the credit-vs-location ambiguity is real, and naming the
   blocker is informative independent of it. **Cheap, and I would rather it rode
   with the whistle work than alone.**

---

## 8. What I want CHENG to rule on

1. **Is the `.wh.now` label the right overlay, or does the caption belong in
   `EV` after all?** My argument is that a state beats a flash and that changing
   the playable stream is a large blast radius for a copy problem. The counter:
   a stoppage genuinely *is* something that happens, and modelling it as a
   permanent property of a faceoff dot is a workaround for an event stream that
   is missing an event.
2. **Does the EVENT/CONDITION line hold**, or is it a hole I cut to save my own
   empty-net note? I think it is load-bearing — drift is exactly what separates
   the two — but I built the thing it protects, and that is worth saying.
3. **Should the ring's label and the card's heading say the same words?** Two
   surfaces naming one stoppage differently is the drift problem in miniature;
   identical text on both is 30px of duplication. §3.2 of `home-page.md` deleted
   a block for exactly that.
4. **`field: rsn` — legible or leaked?** I want it spelled. The case against is
   that the raw field name is the most precise possible provenance, and
   prettifying it puts a layer between the claim and its source.

---

## 9. Held for the novice test

- whether the card is read at all while the replay is running, or only when
  paused
- whether a stoppage on the ice reads as *"something happened"* or as clutter
- (5) above, dimming
- **and the measurement worth taking during the test**: does she ever look at the
  card mid-play? If the answer is no, the drift never mattered and the naming
  work was the whole fix.

---

## 10. Built 2026-08-16 — §7 items 1–3

CHENG's sequencing: **the label table first**, because the heading and the legend
key both consume it, and building them in the other order means writing two
temporary strings you then delete.

### The label table

`WHY` gains `name` beside `say` and `from`. Fifteen reasons, and the point of a
third field rather than a re-pointing is that **`name` is not a shorter `say` —
it is a different job.** The heading names the stoppage; the body teaches it.

```
Goalie Stopped After Sog   →  Goaltender covered the puck
Net Dislodged Defensive Skater →  Net off its moorings
Referee Or Linesman        →  Puck hit an official
Tv Timeout                 →  TV timeout
Puck In Netting            →  Puck into the netting
```

**Three surfaces, one table.** Read back off the running page, the heading, the
tally and the ring `<title>` now all render written English — and a mutation
removing a single `name` is caught, because the test reads the vocabulary out of
`WHY` rather than listing the labels it expects.

**And the stylesheet was doing the title-casing.** `.rsn` and `.whtally` carried
`text-transform:capitalize`, which is what produced `Goalie Stopped After Sog`
from the raw key — and would have produced **`Goaltender Covered The Puck`** from
a written label. Replaced with `::first-letter`, which suits both a written name
and the raw string an unrecognised reason still falls back to. **The fix would
have silently half-worked without looking at it.**

### The retrospective heading

```
LAST STOPPAGE
Offside · P3 01:13
Offside — an attacking player crossed the blue line ahead of the puck…
```

The kicker, not the heading: **the reason keeps the heading**, because what
stopped play is what a reader came to the card for. The kicker ranks the card as
a ledger rather than a second narrator.

### The legend key

```
play restarted here — brightest at the most recent stoppage
```

Gated on `#rg.whistle`, using the progressive machinery from R Q2. It names the
mark **and** the `.now` distinction, which is the thing the ring was using colour
to say and never saying.

### The EVENT/CONDITION rule, and the test that survived it

CHENG's mechanical form:

> **A statement is a condition if, and only if, it can be recomputed from the
> game state at the playhead alone — with no reference to when it started.**

It has already earned its keep. The whistle panel has a second branch — *"No
whistle yet — play has not stopped in what you have watched so far"* — and the
first version of the retrospective test failed on it. That is **not** an
exemption to paper over: "no whistle yet" is recomputable from the playhead, it
cannot drift, and it correctly carries no retrospective framing. The test now
separates the two by whether the card names a stoppage, which is the rule
expressed as an assertion.

**And his added requirement is proven rather than assumed.** *"If the empty-net
note persists after the goalie returns, it becomes an event narration wearing a
condition's clothes."* Mutated the note to persist: **killed**, by the `1551`
control case — both goaltenders on the ice, and the note must be empty.

*(The first attempt at that mutation used `window`, which the fake document does
not have, so boot threw and 96 tests "failed" for a reason with nothing to do
with the claim. A mutation that breaks the harness measures the harness. Redone
with a module-scoped variable.)*

### Mutations

**Seven, all killed:** bypassing the label table, an unknown reason rendering as
nothing, the card dropping its kicker, the stylesheet title-casing labels again,
the legend key losing the class its rule keys on, nothing revealing that key, and
a single reason losing its written name. Plus the persistence mutation above.

### Still open

**§7 item 4 — labelling the `.wh.now` ring on the ice.** The overlay Kevin asked
for. CHENG has endorsed the mechanism (*"not a workaround — it's the correct
surface"*) but listed only 1–3 as build-now, so this waits on an explicit go. It
is cheaper after this work than before it: **the ring now has a short written
sentence to show**, which it did not have an hour ago.
