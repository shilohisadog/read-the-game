# Strength as a filter, not a headline

**Technical artifact for review.** How the app should express even strength, power
plays and an empty net, now that `situationCode` is extracted.

| | |
|---|---|
| **Status** | For review — nothing implemented |
| **Author** | CC |
| **Date** | 2026-08-07 |
| **Reviewer** | CHENG |
| **Depends on** | `docs/main-app-rework.md` Phase 2 (conservation). See *Sequencing*, which argues this must not ship first. |

---

## What prompted it

Kevin, on seeing the corrected Corsi: *"a penalty occurred at 13:05, that should be
highlighted somewhere, since the SOG and control will shift some towards the team
with the man advantage, no?"* — and then, on the empty-net finding, *"we definitely
need to flag that somehow as well."*

Both are right, and the data now supports them: `sit` was landed in `43eb08f`.

## The evidence

All verified against the raw feed; every number here is reproducible with
`builders/extract.py --validate` plus the queries quoted in the commit history.

| State | Corsi | SOG | MIN share |
|---|---|---|---|
| Even strength | MIN 48 – BUF 38 | MIN 18 – 15 | 55.8% |
| Special teams | MIN 20 – BUF 17 | MIN 14 – 10 | 54.1% |
| Empty net | MIN 12 – BUF 0 | MIN 3 – 0 | 100% |
| **All situations** | **MIN 80 – BUF 55** | **MIN 35 – 25** | **59.3%** |

Three things fall out, and the third is the one that matters most.

**Special teams roughly cancel.** 54.1% is within noise of the 55.8% even-strength
figure, so the entire 59.3 → 55.8 gap is the empty-net window and nothing else.
Kevin's instinct that penalties would move the number was reasonable and turns out
not to be what moved it here.

**The empty net is 100 seconds of one-sided volume.** Twelve MIN attempts, zero for
BUF, all in the last 1:40 of the third with MIN's own net empty. Seven were blocked.

**The thesis lives on the all-situations number.** The reference game exists because
*"Minnesota outshot Buffalo 35–25 and lost."* At even strength that is **18–15**,
which is a shrug. Any design that quietly promotes the even-strength number
demolishes the hook. (CHENG's finding.)

### And the fact that makes the filter worth building

| Goalie | All situations | Even strength |
|---|---|---|
| Gustavsson (MIN) | 22/25 = .880 | 12/15 = .800 |
| Levi (BUF) | 33/35 = .943 | **18/18** |

**Both Minnesota goals came on the power play. All three Buffalo goals came at even
strength.** Levi did not allow an even-strength goal.

So the filter does not merely qualify the story — it tells a second one. At full
strength Minnesota generated more and scored nothing; their offence was special
teams. That is a *different* lesson from "Minnesota dominated and got robbed," and
both are true of the same game. Showing a novice how one becomes the other is worth
more than either alone.

**Caution, and it must be on screen:** 18 shots is a small sample. Rendering `1.000`
invites reading it as a rate when it is really "he didn't allow one in eighteen." The
same sample-size honesty CHENG required for cross-game base rates applies here at
single-game scale.

---

## The design

Adopting CHENG's shape from the Q1 exchange, because my framing ("which number is
the headline?") was malformed: it presupposed one headline, which is exactly what
the reducer/ledger architecture exists to avoid.

**Strength is a view-level filter over the existing layers, not a competing number.**

- The view opens at **all situations**. It is the complete count, the number a novice
  can verify by counting marks on the ice, and the number the game was chosen for.
- A control offers **Even strength only**.
- Toggling it moves **49 of 135 attempts** from `counted` to `excluded`, each with a
  real reason, and the counter re-runs in front of you from 80/55 to 48/38.

### Why a filter beats picking

- **The delta becomes motion rather than a footnote.** Two static numbers side by
  side are a thing to read. A counter visibly dropping while 49 marks grey out is the
  crown jewel doing its job on a genuinely surprising fact.
- **It uses the ledger instead of hiding in it.** An even-strength headline would
  silently drop 36% of all attempts — not stated as a limit, not enumerated, just
  gone. That is precisely what Doctrine §3 is written against.
- **Denominators stay coherent.** SOG 35–25 is an all-situations number straight off
  the boxscore. Pair it with an even-strength Corsi headline and two numbers on
  screen have different scopes and a novice cannot reconcile them. A view-level
  filter moves *both* — 18–15 and 48–38 — or neither.
- **It is mutation-testable.** Conservation must hold in both modes.

### The exclusion ledger

```
Even strength only — 49 attempts excluded

  22   MIN on the power play
  15   BUF on the power play
  12   MIN net empty, 6-on-5
  ---
  49   of 135 attempts
```

Every excluded event keeps its `why`, and every one is clickable back to the moment.

### Deriving the state

`situationCode` is `[awayGoalie][awaySkaters][homeSkaters][homeGoalie]`.

```
goalie digit == '0'   ->  empty net        (either side)
awaySkaters == homeSkaters  ->  even       (5v5, 4v4, 3v3)
otherwise             ->  power play, to the side with more skaters
```

Five codes appear in this game. **The set is known-incomplete** — a real season adds
3-on-3 overtime, 5-on-3, 4-on-3, penalty shots and both goalies pulled — so an
unrecognised code must hit the same gate as an unrecognised `typeDescKey`:
`extract.py --vocab` already exits non-zero, and the app must refuse to classify
rather than guess.

### Marking *when*, not just excluding

The states are windows, and seeing them on the timeline is most of the teaching.
Nine windows in this game:

```
BUF power play   P1 19:35 -> 17:39
MIN power play   P1 06:55 -> 05:20
MIN power play   P1 01:26 -> 00:30
BUF power play   P2 15:48 -> 15:03
MIN power play   P2 13:46 -> 11:24
BUF power play   P2 00:36 -> P3 18:43   <-- crosses the period break
BUF power play   P3 10:33 -> 09:10
MIN power play   P3 08:27 -> 07:33
empty net        P3 01:40 -> 00:00
```

**Note the sixth.** A penalty carries across the intermission, so the filter cannot
treat state as period-local — a real constraint that a naive implementation would
get wrong and never notice.

---

## Two places honest data can be narrated into a wrong impression

### The empty net

I already made this error in conversation. I wrote that Buffalo *"had stopped trying
to score,"* which is **interpretation, not data**. A one-goal lead with 100 seconds
left means icing the puck and blocking shots; zero attempts is what competent lead
protection looks like, not surrender. (CHENG's correction.)

The rule for this copy: **state what is recorded, let the viewer conclude.**

> In the last 1:40 Minnesota played with an empty net. They took 12 attempts;
> Buffalo took none. Seven of Minnesota's were blocked.

Every clause is a count. No verb describes anyone's intent.

### The delayed penalty

The game's first sequence is a good one and currently reads as noise:

```
19:39  delayed-penalty
19:35  penalty  (tripping, MIN)
```

Two events four seconds apart teaches nothing. **One moment with the gap explained**
teaches a rule a novice has certainly seen and never had named — the referee's arm
up, play continuing, the whistle waiting until the offending team touches the puck.
This game has four delayed penalties.

*(This overlaps the parked whistle layer. Flagging the seam, not proposing to build
both.)*

---

## Sequencing — this must not ship before the conservation fix

`read-the-game.html` pre-filters before any reducer runs:

```js
const SKIP=new Set(['stoppage','period-start','period-end','game-end','delayed-penalty']);
const EV=G.events.filter(e=>!SKIP.has(e.type));
```

**51 of 320 events are deleted upstream of the ledger.** CHENG established that
conservation currently passes only because it is measured against `EV` rather than
the full game.

If the strength filter ships onto that, we get a ledger that carefully enumerates 49
exclusions while silently discarding 51 others. **Selective honesty is worse than
none**, because it looks rigorous. So: Phase 2's conservation fix — bind the property
to `loadGame()` output, `excluded` as IDs rather than counts — comes first, or lands
in the same change.

## Open questions

1. **How far does the filter reach?** I've argued view-level for coherence, which
   means SOG becomes 18–15 and the goalie cards become 18/18 and 12/15. But SOG
   35–25 is our boxscore anchor — the number a stranger can check against the
   league's own summary. Does filtering it break "check our work", or does labelling
   the mode adequately preserve it?
2. **Should `empty net` be one state or two?** A pulled goalie means opposite things
   trailing late (desperation) versus on a delayed penalty (free attack). The feed
   records only the skater counts, so distinguishing them is inference from context —
   which our doctrine treats with suspicion. One honest state, or two useful ones?
3. **Is `1.000` publishable?** Levi's 18/18 is real and striking and a rate on 18
   shots. What is the honest rendering — the fraction alone, a sample-size caveat, or
   something else?
4. **Does the default survive contact?** All-situations is right on the evidence, but
   the even-strength view arguably describes the game better. I've defended the
   default on "it's the complete count and it's verifiable by counting marks." Is that
   the real reason, or am I protecting the hook?

## Where I am least confident

- **That the second story doesn't bury the first.** "Both MIN goals were power-play
  goals" is a better fact than anything currently on screen. If the filter makes the
  headline game look like an artefact of special teams, we have improved the analysis
  and damaged the teaching. I don't know which way that lands, and I don't think I
  can know it without Kevin's eyes on a build.
- **Whether nine windows is legible or clutter** on a timeline this size.
- **The empty-net copy above.** I got it wrong once already, and I am not confident
  the version I've written is clean rather than merely more careful.
