# "Why it could matter" — and the one shape it can safely take

**Kevin, 2026-08-17:**

> *"We provide the data but we don't offer 'why it could matter' type of
> information to the viewer. I realize we can't express analysis that isn't
> backed by data we can expressly point to, but we need to figure out 'why it
> could matter' to describe the data as the game moves along."*

He has stated the constraint himself, so this audit is not about whether — it is
about **finding the form that survives it.**

## 1. Three things it cannot be, and one of them is already ruled

**It cannot be a prediction about this game.** The site is a replay. *"WSH is
controlling play and usually wins from here"* is a forecast wearing a
description, and it is unfalsifiable in a game whose result the page already
prints.

**It cannot be an outcome rate wherever the rate is uninterpretable.** This is not
a general caution, it is a specific ruling already on the books: for blocked
shots, **the blocks leader is the attempts trailer 81.7% of the time.** *"The
team that blocked more won X%"* would be measuring which team was chasing. The
panel's win-rate test exists for exactly this and is on the prose, because the
failure arrives as a plausible-sounding sentence.

**It cannot be a claim we hold no number for.** *"Blocking shots wins playoff
series"* is the kind of thing a hockey broadcast says and we have nothing behind
it.

## 2. The shape that survives: a DISAGREEMENT, not an implication

Every attempt at "why this matters" reaches for *what it leads to*. That is the
forbidden direction. The available direction is *what it disagrees with*:

> **This number and a number you already have are measuring different things —
> and here is the gap, right now.**

Not *"this predicts the winner"* but *"this counts something the familiar number
does not."* That form is:

- **always available**, because every layer here exists precisely because some
  familiar number is incomplete — that is why it was built;
- **never a prediction**, because it is a statement about two measurements, not
  about an outcome;
- **a CONDITION at the playhead**, recomputable from state alone, so it passes
  CHENG's test and can update as the game moves — which is what Kevin asked for;
- **checkable**, which is the whole trade of this site.

It is also just the site's own thesis, applied one layer at a time: *which number
you count changes the answer.*

## 3. The five layers against that rule

| layer | the familiar number | the disagreement we can point at | where it comes from |
|---|---|---|---|
| **Blocked shots** | *shots on goal* | over half the shooting never appears in it | per frame — see §4 |
| **Control (Corsi)** | the score | across the archive the attempts leader **loses 2,194 of 4,029** | `baseRates.moreAttemptsLost` |
| **Shots from the slot** | *shots on goal* | a shot from the slot and one from the point are the same event in a shot count | per frame |
| **Goaltending** | *save percentage* | a rate over 35 shots is not a rate; and the shots a goalie faces are not the attempts taken at them | per frame |
| **Why play stopped** | — | **nothing.** We hold no duration data, so any claim about how much of the clock is live play would be invented | — |

**The whistle row is the useful one.** It says the rule has teeth: applied
honestly it produces "we cannot say" for one of the five, rather than a sentence
for all five.

## 4. The worked example — and it is this card, moment to moment

The blocked-shots card now reads:

```
THIS GAME   49 of 94 attempts never reached the goalie
            45 reached the goalie · 21 blocked by a body · 28 missed the net
```

**`45` is not just a segment label. It is the number the box score prints.** The
NHL's *shots on goal* is saves plus goals, which is exactly `shot-on-goal + goal`
— the same definition this card already uses for *reached the goalie*. So:

> **A box score would show 45 shots. This game has had 94 attempts.**

That sentence is:

- **derived, not asserted** — both numbers are on the card already;
- **live** — it moves every frame, which is Kevin's *"as the game moves along"*;
- **not an outcome claim** — it names no winner and implies none;
- **the actual reason the layer exists**, said out loud for the first time.

A novice who reads it once understands why this site counts differently from
every other place they have seen a hockey number, which is the whole product in
one line.

**The adversarial case:** the bar already labels `45 reached the goalie`, so this
adds copy to a card that is 320px and was asked to shrink. My answer is that the
gap between 45 and 94 is currently on screen as two numbers a reader must
subtract, and the sentence is what turns the subtraction into the point. But that
is a cost, and it is real.

## 5. Where it lives

**Not a new panel.** The rule produces one sentence per layer, and a sentence
belongs beside the thing it is about — the same rule that split the greeting.

Three options, and I would take the third:

1. **In the card.** Correct placement, but it is copy on the surface Kevin has
   twice asked to shrink.
2. **On the layer button, before you press it.** Answers *"why would I turn this
   on?"* — but it cannot carry a live number, so it stops being the disagreement
   and becomes a slogan.
3. **In the card, gated to first use of that layer.** The mechanism already
   exists — `#rg.newcomer` retires two blocks — and the content stays live for
   the visit that needs it. Costs nothing for a returning viewer, which is R's
   rule.

## 6. What I want ruled

1. **Is the disagreement form right**, or is it too narrow to be "why it could
   matter"? The case against: a reader may want *"and therefore…"*, and this rule
   permanently refuses to supply it.
2. **Does the whistle layer's "we cannot say" get SAID**, or does that layer just
   have no line? Saying it out loud is the site's habit; saying it five times
   would be a tic.
3. **First-use gating (§5.3), or always on?** Kevin's ask was for something that
   describes the data *as the game moves along*, which argues for always.
4. **Is `moreAttemptsLost` safe on the Control card mid-game?** It is an outcome
   rate, and unlike blocked shots it is interpretable — but stating *"the attempts
   leader loses 54.5%"* while a viewer watches one team lead attempts is one
   inference away from a forecast. The verdict card is gated to the horn for
   exactly this reason.
