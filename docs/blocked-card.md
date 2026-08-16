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
