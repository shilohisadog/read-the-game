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

---

## 6. CHENG's rulings — 2026-08-16

All four questions answered, and **Q1 came back with a reframe that the audit had
missed**. His rulings supersede §4 and §5.

### Q1 — move the card, and "result-first" was the wrong worry

> *"The card isn't a metric — it's the conclusion, and it's only true once the
> game has ended. Position on the page and position in time are different axes,
> and they're being conflated."*

So the card should be **empty or absent until the replay reaches the end**, and
then appear under the transport, in view. That kills both objections at once:
nothing to spoil, because there is no verdict until there is one; and nothing
shown first, because nothing is shown. It is structurally the same move as
*"first paint is the opening faceoff, not the final score"* — **the card is the
last frame's content and should behave like it.**

Note for whoever builds it: the deploy gate *"the verdict dot lands where the
sentence says"* measures the card's track in a real browser, so it will have to
scrub to the end before measuring or it will go red on an absent card. That is
the gate working, not breaking.

### Q2 — progressive legend: a truthfulness fix, not a density one — **DONE**

> *"The legend is asserting a property of the ice that the ice doesn't currently
> have."* Same defect as a check that cannot fail, in a different medium. And on
> the instability worry: *"a legend is a READ surface, not a control. Things you
> click shouldn't move; things you read may."*

**Built.** A key now appears with the layer that draws its mark, and the
blocked-shot line is shortened to the correction that matters (*"blocked — ringed
where the puck was stopped"*), with the fuller disclosure travelling with the
layer. Measured on the same phone and game:

| | legend height |
|---|---|
| before naming the marks at all (Friday) | 122px — and two marks were unexplained |
| after naming them permanently (Saturday) | 210px |
| **progressive (now)** | **122px base · 147px +slot · 192px +blocked** |

**The 88px regression is repaid in full and the marks are still named** — in the
states where they exist, which is a stronger claim than the permanent list made.
Three mutations killed: making the key permanent again, removing the class the
key waits for, and dropping the reveal rule.

### Q3 — collapsing DOES hide a teaching surface, and a disclosure is the wrong home

> *"The place that sentence actually pays off is the moment someone flips the
> switch and 49 attempts vanish. That's when a novice has a question and the
> sentence is the answer."*

So: collapse the configure block, but **move the instructive sentences to the
moment of use** rather than behind a fold. The strength copy belongs in the
exclusion ledger, which already renders per-event reasons; the goaltender/ends
paragraph explains the rink and belongs on the rink. *"A disclosure box is
provenance parked somewhere convenient"* — and provenance travelling with the
thing it describes is the site's own pattern.

**The test for whether a sentence has a home:** if it cannot find a moment of
use, that is the signal it belongs on the How-it-works page rather than under the
rink.

### Q4 — sequencing: agreed, and one item added to the hold list

Build (1), (2), (5) now. **But the reframed Q1 is not a hold either** — "does the
card appear when the game ends" is a correctness question about what the card
asserts, not a taste question about where it sits. What the novice test should
answer is narrower: *once the game ends and the card appears, does she read it,
and does it land?*

Added to the hold list, and it is the real structural problem behind every
density number in §1:

> **The 230 words are all first-visit words, and the page has no idea whether it
> is a first visit.** Everything under the rink is written for someone who has
> never been here, and redrawn forever.

A novice test can inform that directly: which words she needs, once, and which
she never reads at all.

## 7. Not in the audit, and bigger than R

> *"21 interactive controls below the rink, and the count is the same on desktop
> and phone. That number is doing more damage than the pixels."*

Five layer toggles plus three configure groups plus the transport is a control
panel, and the doctrine says the base view is just the game. His question, which
is **not** R's to answer:

> **Do all five layers need to be visible at once, or does the page open with
> control and offer the others?**

And the measurement he would want next is not pixels: **how many of the five a
first-time viewer ever turns on.** That is the novice test's to produce, and it
is now on the hold list with the first-visit question above.

---

## 8. The first-visit mechanism — built 2026-08-16

**Kevin, on being told this should be held for the novice test:**

> *"I believe she'll visit and say 'well, where should I click', 'why should I
> click there', 'what's corsi (and why do I care)'. We absolutely need the
> first-visit mechanism in place before showing to a casual fan."*

He is right, and the reason is sharper than convenience: **he predicted the
findings.** A test whose outcome can be written down in advance produces no
information, and a first visit is not renewable — one person has exactly one.
Running it against a page with no orientation would buy a result that was free.

### It is the same mechanism R was arguing about

Three lines of reasoning arrived at one gap:

| | said |
|---|---|
| R (§1) | 230 words of permanent prose stand in front of the verdict card |
| CHENG | *"they are all first-visit words, and the page has no idea whether it's a first visit"* |
| Kevin | a casual fan needs their hand held for the first few visits |

The resolution was never *"these words are bad"*. It is *"these words are not for
everybody, forever."* R took them out of permanent residence; this puts them in
front of the people they were written for.

### "Unusual" was rejected, and the reason is worth keeping

The earlier proposal was to surface the layer *this game* is unusual on, measured
against the archive so the choice was derived rather than chosen. Kevin killed
it:

> *"Let's not decide for the viewer what they should/shouldn't consider unusual
> (even if the data backs up the statement) — the initial viewer doesn't know
> what they don't know."*

Three things wrong with it, and I had defended it on the wrong axis. *Derived,
not chosen* answers **is this claim true?**; it does not answer **can this reader
use it?**

1. **"Unusual" is stated in a vocabulary the viewer has not learned.** It
   presupposes a baseline they do not have.
2. **A filter teaches absence.** On an ordinary game the prompt vanishes, so the
   viewer sees nothing and learns nothing, by a rule they cannot perceive.
3. **It inverts the learning order.** You learn what an attempt is, then that the
   team with more of them usually loses, and only then can you judge one game.
   Usualness is the LAST thing learned.

So the hook is **a fact about hockey, true of every game, needing no prior
knowledge** — which is precisely what eventually lets a viewer judge unusual for
themselves.

### And the flagship finding was missing from the page that demonstrates it

`the team with more shot attempts loses more often than it wins` — 2,194 of
4,029 — is the site's reason to exist. Measured: it appears **zero** times in
`game.html`'s visible prose and zero times in its runtime strings. The three
matches in the file are source comments. It was on the homepage and nowhere near
the button that shows it.

### The mechanism

- **Distinct days, not page loads.** Three games in one sitting is one visit;
  retiring the help mid-lesson is the defect this exists to avoid.
- **Storage refused means NEWCOMER.** Private browsing throws, and the two errors
  are not equal: a returning viewer re-reading a tip loses a glance, a novice
  shown nothing is the visitor we lose.
- **Dismissible, and the dismissal is remembered.** A tip you cannot turn off is
  an advert.
- **Retires after three days.**

Measured on a 390px phone: **2.69 screens for a newcomer, 2.33 for a returning
viewer** — against the audit's 2.99 for everyone. The newcomer now gets more help
than the page has ever offered, on a page still shorter than it was.

**The copy is a draft; the seam is the point** (Kevin's own rule: mechanism, not
policy). The novice test should revise these words. It should not have to revise
the machinery.
