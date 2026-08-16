# The blocked-shots card is prose where it should be a picture

**For CHENG. Kevin, 2026-08-16, on the viewing perspective he actually uses:**

> *"The shots blocked card needs to be trimmed down and somehow made more
> 'impactful'. Now it's 2½ lines of text that doesn't provide the educating
> 'moment' that I think we should be striving for."*

Two asks — **trim** and **impact** — and they are not in tension here. The
measurement says the trim IS most of the impact, and what is left over has a
cheap answer that the layer already computes and throws away.

## 0. Method

Live `readthegame.co`, real Chromium, `?game=2025030416&layer=blocked`, walked
frame by frame at 1400×900, 1100×900 and 390×844. Every height is read off the
running page. The attempt split in §4 is computed by importing the shipped
`corsi` reducer against the real game file, not re-derived in the measuring
script.

---

## 1. What the card costs, measured

| | 1100×900 | 390×844 |
|---|---|---|
| the whole card | **234px — 26% of the viewport** | **394px — 47% of the viewport** |
| the counters (`3 · 1`, *shots blocked*) | 48px | 48px |
| *"4 of the 16 attempts…"* | 21px | 63px |
| the teammate line, when it fires | 39px | 79px |
| **the archive + its limit line** | **71px** | **148px** |

**Thirty per cent of the card on a desktop, and thirty-eight on a phone, is
archive prose — and it re-renders identically on every one of the game's 281
frames.**

## 2. The percentage is a doctrine violation, and it is the third instance

The sentence reads *"**4** of the **16** attempts in this game so far were
stopped by a body — **25%** of them"*. It states the same quantity twice, and the
second statement is the one this project has already removed twice elsewhere.

Walked across the whole game, the percentage **changes 21 times, and its biggest
single jump is 50 points.** It opens like this:

```
0 of the 1 attempts = 0%      1 of the 2 = 50%      1 of the 3 = 33%
2 of the 4 = 50%              3 of the 5 = 60%
```

The rule is already written down twice in this same file:

> **A FRACTION, NOT A PERCENTAGE.** *"`58%` over nineteen attempts asserts three
> significant figures on a denominator that moves 2.5 points per shot, and it
> swings visibly through the first period looking like information."* — the
> control bar
>
> **A FRACTION, ALWAYS, AND THE THRESHOLD IS GONE.** *"A fraction carries its own
> denominator, so it needs no cutoff to be honest at."* — the goalie card

**The blocked card ships the fraction AND the percentage.** The fraction was
already correct; the percentage is redundant *and* is the exact instability both
of those comments exist to describe. Deleting it costs no information at all.

`0 of the 1 attempts` is also not a sentence. That is a second, smaller bug in
the same string.

## 3. It is also an R violation, and the dates say why

R's rule: **nothing below the rink is written for a reader who has already read
it once.** The blocked layer shipped **2026-08-15**; R landed **2026-08-16** and
audited the whistle card, the goalie panel, the empty-net note and the legend.
**It never went back over this panel.**

So the one surface built the day before the audit is the one carrying 71–148px
of read-once argument on every frame — which is precisely the shape R measured at
576px and cut to 122px everywhere else.

## 4. The missing moment: the headline claim has no per-game counterpart

This is the real answer to Kevin, and it is a gap rather than a styling problem.

The archive line makes **two** claims:

> Across the archive, **51.9%** of all shot attempts **never reach the goalie at
> all**, and **27.8%** are blocked by a body.

The card's own per-game sentence mirrors **only the second, smaller one**. The
bigger and far more surprising claim — *over half of everything shot never gets
there* — has **nothing in front of the reader to check it against.** A novice is
told a startling number about 491,971 attempts and handed no way to see it in the
game they are watching.

And the game they are watching says it plainly. Computed through the shipped
`corsi` reducer, game `2025030416`:

```
             attempts   reached the goalie   blocked   missed the net   never reached
 15% in            14                    7         3                4      7  (50%)
 30% in            30                   14         8                8     16  (53%)
 50% in            52                   25        12               15     27  (52%)
100%               94                   45        21               28     49  (52%)
```

**52% at the horn, against the archive's 51.9% — and it is within three points
from a fifth of the way in.** The layer already computes every part of this: the
blocks are its own ledger, and `corsi.counted` carries the attempts by type.
The card throws the split away and prints a sentence about one third of it.

## 5. What I would propose

**Replace the sentence with the split, drawn.**

```
                        16 attempts
        ████████████ ▓▓▓▓▓▓▓ ░░░░░░░░░
        7 reached the goalie · 4 blocked · 5 missed the net
```

- **The fraction survives as the picture**, so §2's percentage is not replaced by
  another number — it is replaced by a length, which cannot claim three
  significant figures.
- **It answers the archive's real headline**, so 51.9% stops being an assertion
  and becomes something the viewer is watching converge on.
- **It is a CONDITION, and it passes CHENG's test**: recomputable from the state
  at the playhead alone, with no reference to when anything started.

**And it is the "moment", in the only form this card is allowed to have one.** A
sentence re-reads identically at every frame; **a bar moves when the thing it
measures happens.** A block lands, a segment grows — the same grammar as the
attempt counters bumping, which is already the page's way of saying *that just
happened* without narrating it. **The impact is not extra copy. It is copy
replaced by something that can change visibly.**

Plus the trim:

| | |
|---|---|
| the `25%` | **delete** — §2, and it takes `0 of the 1 attempts` with it |
| the archive + limit, 71/148px on every frame | **gate it**, the way R gated everything else. The `newcomer` class already exists on this page and already retires two blocks |
| the counters (`3 · 1 shots blocked`) | **keep** — they are the two teams' credited blocks, which the bar deliberately does not split by team |
| the teammate line | **keep** — it fires only when a teammate block exists, which is already R's rule working |

## 6. What I want CHENG to rule on

1. **Is the bar right, or is it a chart where a number would do?** The adversarial
   case: this project's whole trade is that a viewer can check the arithmetic,
   and a length is harder to check than `7 of 16`. My answer is that the labels
   carry the counts underneath, so nothing is lost — but that is me marking my
   own homework.
2. **Three segments or two?** *Reached / blocked / missed* answers the archive's
   headline. *Reached / never reached* is simpler and says the same thing, and it
   hides the fact that missing the net is the bigger half of "never reached" —
   28 to 21 in this game, which is itself surprising.
3. **Gate the archive on `newcomer`, or find it a moment of use?** R's other
   sentences got a moment (the note fires while a net is empty). The honest
   moment for this one is *"the game's share is now comparable"*, which needs a
   minimum n — and a chosen minimum n is the thing this project refuses
   everywhere. So I lean on `newcomer`, and want that challenged.
4. **Does the bar belong to the blocked layer at all?** It is really a picture of
   *what happens to a shot attempt*, which is corsi's subject. It is here because
   this is the layer whose headline claim it answers.

---

## 7. Kevin's amendment: two cards, this game against the archive

> *"Maybe there's 2 cards under the rink, what the current game is showing vs.
> what the archive indicates is 'normal'? And, as you describe, having the
> current game data updating, pulling closer to normal or farther away from
> normal might be interesting and educating."*

This is better than §5 and it should replace it. §5 drew the split; **this makes
the COMPARISON the subject**, which is the thing a novice cannot get anywhere
else and the thing the card currently asserts in prose and never shows.

**It is also newly cheap.** `measures.json` already carries `attemptMix.byType`,
so the archive can be drawn with **the same three segments as the game** — not a
different chart beside it, the same picture at two sample sizes.

### 7.1 One word has to go, and it is "normal"

This is the objection I would want made if I were proposing it.

**Every card on this site says one game is one game** — the goalie card
(*"one game — what happened, not how unusual it was"*), the verdict, the
newcomer block (*"one game is still one game"*). Calling the archive **normal**
and describing the game as *pulling closer to or farther from* it does two things
this project spent a lot of work refusing:

1. It makes a gap read as **a fact about this game** — that a game away from the
   archive share is abnormal and has something to explain.
2. It invites that reading **when the gap is noise.** At the fourth attempt the
   game's share is `1 of 4`. A viewer watching that "move away from normal" is
   watching sampling variance, narrated as meaning.

### 7.2 The reframe that keeps the whole idea

Not *this game versus normal*. **The same quantity, at two sample sizes: one
still assembling, one settled.**

That is the site's own h1 — *see what the numbers are made of* — and it is a
better lesson than "unusual", because **it is the lesson that makes "unusual"
learnable later.** A novice who has watched 51.9% assemble out of 94 attempts
knows what a rate is. Then, and only then, can they judge a gap.

So: **show both, and never characterise the difference.** No "closer", no
"farther", no colour for good or bad. The motion Kevin wants is inherent — one
bar moves and the other does not — and it needs no sentence at all. Same reason
the counters bump rather than announce.

### 7.3 And the data says be careful, in this exact game

I claimed in §4 that the game converges on the archive. **Component-wise it does
not**, and a design built on "watch it converge" would be wrong about two
segments out of three:

```
              archive                this game            gap
 reached     236,869 = 48.1%        45 = 47.9%          -0.3 pts
 blocked     136,545 = 27.8%        21 = 22.3%          -5.4 pts
 missed      118,557 = 24.1%        28 = 29.8%          +5.7 pts
 never       255,102 = 51.9%        49 = 52.1%          +0.3 pts
```

**The headline matches to a third of a point while two of the three parts are off
by more than five, in opposite directions.** That is real hockey — this game
missed the net more and got blocked less — and it is exactly the honest reason
not to write a sentence about convergence. **Two aligned bars say all of that
without claiming any of it.** Prose would have had to pick one story and would
have picked the wrong one.

This also retires my own §4 phrasing: *"watch it converge"* is a claim, and the
right design shows the reader something and makes no claim at all.

### 7.4 Two cards, or one card with two rows?

I would take **one card, two rows on a shared axis** — and the reason is not
space, though it is cheaper.

**Alignment IS the comparison.** Two cards side by side make a reader compare
numbers; two bars on the same axis make them *see* the difference, with the
segment boundaries landing in visibly different places. That is the whole
argument for drawing it rather than writing it, and putting the two in separate
boxes throws it away.

```
   THIS GAME · 94 attempts so far
   ███████████████████ ▓▓▓▓▓▓▓▓ ░░░░░░░░░░
   45 reached the goalie · 21 blocked · 28 missed

   THE ARCHIVE · 491,971 attempts, 4,119 games
   ███████████████████ ▓▓▓▓▓▓▓▓▓▓ ░░░░░░░
   48.1% reached · 27.8% blocked · 24.1% missed
```

**Counts on the game row, percentages on the archive row**, and that asymmetry is
deliberate rather than untidy: §2 is exactly why. A percentage on 16 attempts
swings 50 points and asserts precision that is not there; a percentage on 491,971
is the honest form. **The row that can carry a percentage does, and the row that
cannot does not** — which teaches the difference between the two by showing it.

### 7.5 Revised questions for CHENG

Replacing §6.

1. **Is §7.1 too strict?** I am refusing the word "normal" and refusing to
   characterise the gap at all. The case against: the site is trying to teach
   what is usual, and a reader who is never told which way the difference points
   may not notice there is one.
2. **One card two rows (§7.4), or Kevin's two cards?** I have argued alignment is
   the comparison. His version is more obviously two things and may read as two
   ideas rather than one being made of the other.
3. **Counts on one row and percentages on the other** — honest, or does it look
   like a mistake?
4. **Three segments or two?** Still open from §6. §7.3 is now the strongest
   argument for three: the interesting disagreement in this game is entirely
   inside the split, and two segments would have shown a 0.3-point match and
   hidden it.
5. **Where does the archive row's read-once material go?** The population and the
   *"a share of attempts, not a rate of winning"* limit are 71–148px on every
   frame (§1). The archive ROW is now the thing that needs them, and it is no
   longer read-once — it is half the picture.
