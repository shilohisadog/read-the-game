# The area below the rink — audit

*For CHENG. Build-list item **R**, and the first item on this list that is a
DESIGN problem rather than a correctness one. Kevin: "rather clunky and not very
user friendly", and he expects a concerted effort rather than a tidy-up.*

*Everything below is measured in a real browser against the live page, because
the test suite is structurally blind to layout and the last three times this
project reasoned about a rendering problem it was wrong three times
([[looking-at-pixels]]).*

---

## 0. Method

Playwright/chromium against `https://readthegame.co/game`, at a 390×844 phone
and an 1100×1600 desktop, reading `getBoundingClientRect()` and word counts off
the live DOM. Reproducible from `tools/` plus the harness in the scratchpad; the
numbers below are all from one run and none of them are estimates.

## 1. The numbers, and they are worse on a phone than the screenshot suggests

| | phone 390×844 | desktop 1100×1600 |
|---|---|---|
| whole document | 2,524px — **2.99 screens** | 1,919px |
| **below the rink** | **1,840px — 73% of the page** | 1,097px — 57% |
| interactive controls below the rink | **21** | 21 |
| the verdict card starts at | **screen 2.18** | y=1,344 |
| the game line (`PIT at WSH · final`) at | **screen 2.48** | y=1,551 |

**The single worst number: 1,156px sit between the bottom of the rink and the
top of the verdict card on a phone.** That is 1.4 screens of scrolling to reach
the thing `site-purpose.md` §10 calls *"the most valuable thing down there"*.

### Read-once prose, measured

| block | phone px | words |
|---|---|---|
| legend | 210 | 45 |
| Trails / Situations / Players notes (3×) | 73 + 55 + 55 = **183** | 93 |
| the goaltender-and-ends paragraph | 128 | 63 |
| the amber "Tip: click a slot shot" line | 55 | 29 |
| **total** | **576px — 0.68 of a phone screen** | **230** |

**230 words of permanent prose stand between the rink and the verdict card's own
44.** Every one of those words matters exactly once, to a first-time viewer, and
then never again — but they are drawn on every game, every visit, forever.

## 2. Four jobs are interleaved, and only one of them is continuous

The area is not one thing. It is four, in an order nobody chose:

| job | what serves it | when it is wanted |
|---|---|---|
| **watch** | transport, scrubber | continuously |
| **understand** | legend, the five layer toggles | while watching |
| **configure** | Trails, Situations, Players | once, or never |
| **conclude** | verdict card, game line, next-up | when the game ENDS |

Current order is watch → understand → **configure** → conclude. The configure
block is **413px on a phone** — half a screen — for three toggles most viewers
will set once and many will never touch, and it sits directly between
understanding the game and being told what the game was.

That is the whole defect in one sentence: **the least-used controls occupy the
most valuable position.**

## 3. The legend is 72% taller than it was on Friday, and that is my doing

`.k-blk` and `.k-hd` were styled and never named — marks drawn on every game
with nothing telling a reader what they meant, which is a doctrine violation
that was shipping. Naming them was right and CHENG called it correctly.

Measured cost, same phone, same game, built both ways:

```
legend before   122px
legend after    210px      +88px, +72%
```

It also introduced something subtler that R should fix rather than inherit:
**"from the slot, once that layer is on" is conditional copy in a permanent
legend.** It describes a mark that does not exist unless a layer is on, so most
readers are being told about something they cannot see. The blocked-shot line has
the same shape in reverse — it is a *disclosure* about where a mark sits, riding
in the legend at all times.

The honest fix is not to shrink the words. It is to **make the legend
progressive**: name the marks that are on the ice right now, and nothing else. A
key that appears when its layer does is both smaller *and* more truthful than a
permanent list with conditionals in it.

## 4. What I would propose

Offered to be attacked, not as a plan.

1. **The configure block collapses.** Trails / Situations / Players become one
   disclosure — a single "How it's drawn" control that opens what is currently
   183px of permanent notes. Reclaims ~413px of phone screen at the exact point
   it costs most. The controls are not removed and no default changes.
2. **The legend goes progressive** (§3): keys for marks currently drawn. The
   blocked-shot disclosure travels with the blocked layer, where it belongs,
   rather than being permanent furniture.
3. **The verdict card comes up**, to sit directly under the transport. It is the
   page's thesis and it is currently next-to-last. **No spoiler is created by
   this** — `#gl` already states the final score on first paint, and the verdict
   module's own comment says so.
4. **The game line goes up too, and joins the scoreboard.** Which game am I
   watching is identity, not conclusion; it is currently at screen 2.48, below
   the analysis of it, at 19px and muted.
5. **The goaltender/ends paragraph and the amber tip move into "Show me the
   work"** or the same disclosure as (1). Both are true, both are worth saying
   once, neither earns permanent residence.

Rough arithmetic: (1) + (2) + (5) reclaim ~600px of the 1,840, and (3) moves the
verdict card from screen 2.18 to roughly screen 1.2. **The verdict card would be
reachable in one scroll rather than two.**

## 5. What I want CHENG to rule on

1. **Is (3) right?** Moving the verdict above the controls makes the page read
   *result-first*, and the site's own headline is *"watch first, add metrics
   after"*. I think the game line already spends the spoiler and the card is
   wasted where it is — but this is the call I am least confident of, and it is
   the one that changes the page's character rather than its density.
2. **Progressive legend — is a key that appears and disappears worse than a
   permanent one?** A control that moves is a usability cost, and I may be
   trading clutter for instability.
3. **Does collapsing the three configure groups hide a teaching surface?** The
   notes on Trails and Situations are genuinely instructive — "Power plays and an
   empty net are still hockey, but they aren't *even* hockey" is one of the best
   sentences on the page. Behind a disclosure, most viewers never read it.
4. **Sequencing:** is any of this blocked on the novice test? Kevin's wife is the
   first real novice to see this page, and §9 of `site-purpose.md` splits the work
   into build-before and hold-for-the-test. **My instinct is that (1), (2) and (5)
   are build-before — they are density, not decisions — and that (3) and (4)
   should be held**, because "where does the summary belong" is exactly the
   question a novice's behaviour answers better than our taste.
