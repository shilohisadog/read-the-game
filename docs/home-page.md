# The home page

**For CHENG. Kevin, 2026-08-16:** *"We have reworked the game page, but what
about the home page? That still displays the older workflow. We need to
streamline and incentivize visitors… chances are this would be 'cold' internet
traffic that doesn't know why they landed on our page, true?"*

And, on being told we have no analytics to answer that with:

> *"We can use home page best practices (within our doctrine and mission) to
> develop the home page, no? I'd think we have more than enough information to
> develop a quality, engaging home page without relying upon Cloudflare
> analytics or anything of that sort."*

He is right, and §4 below states the distinction that keeps that honest.

## 0. Method

Live `readthegame.co`, real Chromium, 390×844 and 1100×900, with the page's own
CSP intact. Every section walked in the page's own DOM order rather than by a
selector chosen in advance — a list of blocks I expect describes the page I
remember, not the page that shipped. The copy is read back **assembled at
runtime**, because the builder holds these sentences in pieces and the version a
visitor gets exists only once the page has run. Both defects in §3 were found
that way and neither is visible in the source.

---

## 1. One live defect, and it is aimed at the exact visitor we are building for

```
"New to hockey? Start with the game at the top →"   →  2023020867   MIN at BUF, 10 Nov 2023
the game actually at the top                        →  2025030416   CAR at VGK, 14 Jun 2026
```

**The sentence is false.** The hero iframe, the hero's own *"Watch the whole
game →"* button, and the caption all name `2025030416`. `#start` alone points at
`2023020867` — the old paradox game, which §5.3 of `site-purpose.md`
deliberately **demoted out of the hero** and down into the lesson section.

The cause is exactly visible in `build_index.py`: `drawRates` ends with

```js
if (m.featured && m.featured.length) $('start').href = 'game.html?game=' + m.featured[0].id;
```

That line was **true when written.** The hero *was* `featured[0]`. §5.2 replaced
that rule with most-recent, on good grounds — *"only 2 games in 4,119 clear the
featured threshold; that hero would have read 19 February 2024 for years"* — and
the href was never moved with it.

**This is prose rotting against another element's identity**, the same family as
the lede that enumerated four layers when there were five. A sentence that
refers to *"the game at the top"* has a dependency on what is at the top, and
nothing in a 463-test suite can see it, because both halves are individually
correct. Only the relationship is broken, and only at runtime.

**Cost of the error:** a novice — the one audience the sentence addresses by
name — clicks it and lands on a game they have never seen, two and a half
screens below a preview of a different one.

**Fix, and it is not the obvious one.** Repointing `#start` at the hero game
makes the sentence true and produces a *second* button to the same destination as
the hero's own, 2.4 screens lower, telling the reader to go back up. **The link
is a symptom of §2, not a feature**, and the ordering fix deletes it. But it is
*false* today, which is worse than redundant, so it is repaired independently of
whether the rest of this document is agreed.

---

## 2. The numbers, and the page breaks a rule this project already wrote down

| | phone 390×844 | desktop 1100×900 |
|---|---|---|
| document | 5,308px — **6.29 screens** | 3,851px — 4.28 |
| links | **47** | 47 |
| the 33-club directory starts at | screen 2.01 | 1.69 |
| **Workshop** — 7 links to prototypes | screen 3.44 | 2.51 |
| **the thesis** starts at | **screen 4.53** | 3.03 |

`site-purpose.md` §4 states the front page's job in one line:

> **For a stranger, in order: what is this → why should I care → what do I do.**

The shipped order is **what is this → what do I do → four screens of catalogue →
why should I care.** The page violates its own stated rule, and the violation is
now measured rather than felt.

### The first screen is not the problem, and that is worth saying

At 390×844 the whole of this fits above the fold, with 13px to spare:

> *Read the Game* · **Watch a hockey game and see what the numbers are made of**
> · *Every NHL game since 2023, replayed play by play — with the counts built in
> front of you, so you can see where a number comes from instead of taking it on
> faith.* · **the five-second loop** · *CAR 3, VGK 0 — 14 June 2026 · CAR put
> more shots on goal, 23 to 22, and won* · **Watch the whole game →**

§4's original complaint — *"only the third has an answer above the fold, and it
is a button"* — **is fixed.** What is this, why it is unusual, and what to do are
all on screen one, with a live replay between them. Whatever is wrong with this
page, the top of it is not it.

### This is not drift. The shape was specified.

§5.3 wrote the running order down explicitly:

```
headline
five-second loop of the most recent game
its sentence · ▶ watch it
Watch your team · limits · Workshop
Which number you count changes the answer          ← the thesis, last on purpose
```

So the honest finding is not *"the page decayed"*. It is **the plan put the
thesis last deliberately, and 6.29 screens later the measurement says the plan
was wrong on that one point.** The reasoning at the time was that one anecdote is
weak evidence and belongs beside the base rates. That argument was about *the
paradox game*. It was silently applied to *the finding itself*, which is not an
anecdote and is the reason the site exists.

### And R made it worse this week

The game page now states the flagship finding to a first-time visitor in its
newcomer block. The home page buries the same sentence at screen 4.53. **The
front door is now worse at stating the thesis than the page it links to** — an
inversion we created, and one that did not exist before 2026-08-16.

---

## 3. What reading the assembled copy found

### 3.1 A link that points backwards is a page apologising for its order

`p.start` sits at **screen 2.43** and says *"Start with the game at the top →"*.
Set aside §1's defect and the sentence is still a tell: two and a half screens
down, the page's advice is **to go back to the beginning.** No page that trusts
its own order needs that link.

### 3.2 The three rates are rendered twice, 645px apart, on the same screen run

| | screen | px (phone) |
|---|---|---|
| `div.scale` — three points on one axis, each labelled with its fraction | 4.83 | 327 |
| `ul.rates` — the same three labels, the same three fractions, again | 5.24 | 318 |

Verbatim, the two renderings of the first row:

```
scale:   The team with more shots on goal lost    1811 of 3957 — 45.8%
rates:   The team with more shots on goal lost    1811 of 3957 · NHL regular season and playoffs    45.8%
```

**They differ by exactly one string: the population.** Which is repeated,
identically, three times.

`drawScale`'s own comment states the justification:

> *"the axis is a second way of saying what the rows say and never a replacement
> for the denominator."*

**That was true when it was written and is not true now.** The comment defends
keeping the list because the scale lacked the denominators — and the scale as
shipped prints `count + ' of ' + n + ' — ' + pct` on every row. The reason
survived the change that removed it, which is the same failure mode as §1 in a
different medium: a justification anchored to a property of something else.

**318px of a phone screen, to say one population string three times.**

### 3.3 Seven prototype links outrank the thesis

**Workshop** is 862px on a phone (heading + note + grid) at screen 3.44 — the
reference game, the goalie view, on the ice, active play, from the crease, where
the chances came from, and **a figure bench**, whose own copy says *"a
development tool."* Its note is honest about what they are: *"explorations, not
front doors."*

They are directly above the thesis. **Development scaffolding is currently
outranking the site's reason to exist on the site's front door**, and the note
saying they are not front doors is printed on the front door.

### 3.4 A 33-club directory before anyone has a reason to want one

330px at screen 2.01, and the header nav **already has a "Teams" link.** This is
verbatim the defect §2 of `below-the-rink.md` found under the rink — *the
least-used controls occupy the most valuable position* — committed a second time
one level up, and missed by the audit that found the first one.

---

## 4. "Best practices" — Kevin is right, and here is the line that keeps it honest

I overweighted the absence of analytics in my first answer. The correction
matters, so it is recorded rather than quietly dropped.

**What the missing analytics actually forbids** is a claim about *our* visitors:
where they came from, what they did, whether they bounced. Item C disabled
Cloudflare Web Analytics on purpose, so we have none of that and **any sentence
of the form "our visitors do X" is a guess.** That includes the cold-traffic
premise — which may well be right, and which we cannot confirm.

**What it does not forbid** is anything else. Convention about how front pages
work is *borrowed knowledge with a known provenance*, which is precisely what
this site already does with the league's play-by-play. It is not a measurement of
our audience and does not pretend to be.

So the working rule:

> **Adopt the principle a convention encodes; do not import the artifact.**

Worked both ways:

| convention | the principle, which we take | the artifact, which we do not |
|---|---|---|
| lead with the value proposition | say why this is worth a stranger's time, early | a gradient hero and a 60px headline |
| one primary call to action | do not offer 47 links before the first idea lands | a sticky "Get started" bar |
| social proof | show the archive's own scale — 4,553 games — as evidence | testimonials, logos, counters we cannot source |
| progressive disclosure | the novice block, the progressive legend — both already shipped | an accordion over everything |

**The one that is off-limits and worth naming**, because it is the most common
front-page convention of all: *manufactured urgency and invented authority.*
Anything of the shape "trusted by", "the definitive", "#1" is a claim we cannot
check, and Doctrine's whole position is that we publish what we can check. Not a
style preference — the same rule that keeps expected-goals off the rink.

**The adversarial case, since it is standing policy:** the strongest argument
against redesigning now is that **the one visitor we know is coming arrives by
being handed a link**, not by landing cold, and she is scheduled. Designing the
front door around an imagined stranger before watching a real novice is the move
Kevin killed when he killed the "unusual" funnel — a model of the viewer standing
in for an observation of one.

**It does not survive contact with §2 and §3, and that is why this document
exists.** A false link, a duplicated 318px block, seven prototype links above the
thesis, and a page that breaks its own §4 are wrong for a cold stranger, wrong
for Kevin's wife, and wrong for Kevin. **They are ordering and correctness
defects, not audience bets**, and no test result would change any of them.

---

## 5. What I would propose

Offered to be attacked, not as a plan. Split by whether it needs an audience
theory — because that is the line §4 just drew, and it is the whole reason the
list is not one list.

### Needs no theory of the audience

1. **Repair `#start`** (§1). Live defect, aimed at novices, on the page the
   novice tester will be handed. Ships regardless of everything below.
2. **The thesis moves under the hero.** The hero already says *"CAR put more
   shots on goal, 23 to 22, and won"* — a claim about shot counts **in one
   game.** The flagship is the same claim across **3,855.** They belong adjacent,
   and this is the game page's own lesson — *a sentence belongs beside the thing
   it is about* — applied one level up.

   **That the hero game goes the obvious way is the feature.** *Here is one game
   where more shots meant a win; across the archive it goes the other way more
   often than not.* One game is still one game, which the game page's newcomer
   block already says in those words.
3. **Delete `ul.rates`** (§3.2), and carry the population once, under the scale.
   ~300px on a phone, and no information lost — the scale prints every fraction.
4. **Workshop leaves the front door** (§3.3). Nothing is deleted; the pages stay
   and the nav gains a destination. Their own note already says they are not
   front doors.
5. **The club directory goes below the thesis, or behind the "Teams" nav link
   that already exists** (§3.4).

Arithmetic: (3)+(4)+(5) reclaim ~1,500px of 5,308, and (2) moves the thesis from
screen 4.53 to roughly 1.1. **Under 3 screens, thesis in the first scroll, and
not one word of new copy required.**

### Needs a theory of the audience — which is what the test is for

6. Whether the home page should learn the game page's first-visit trick. **It has
   no notion of a first visit at all.** But a newcomer block on a page whose
   thesis is at screen 4.5 only moves the problem, so this is *after* (2), never
   instead of it.
7. Whether *"What you can see here"* (657px, 125 words, screen 1.06) teaches or
   merely reassures. It is the largest block on the page after the hero and I
   have no evidence either way.

---

## 6. What I want CHENG to rule on

1. **Is (2) right, or is it the R Q1 mistake again?** Moving the thesis up puts a
   conclusion about 3,855 games above the invitation to watch one, on a site
   whose headline is *watch first, add metrics after*. R's answer there was that
   position on the page and position in **time** are different axes. **The home
   page has no time axis** — there is no "the game has ended" to gate on — so
   that resolution does not transfer, and I may be importing its conclusion
   without its argument.
2. **Does the hero game contradicting the thesis strengthen it or muddy it?** I
   argue it is the honest framing. The opposite reading is that a stranger's
   first exposure to our headline finding is an immediate counterexample, and
   that is a lot to ask of someone deciding whether to stay.
3. **Is "Workshop off the front page" a loss?** Those pages are the best evidence
   that this is a real body of work rather than one demo, and (4) hides them from
   everyone to save 862px. The scale convention in §4 says show the archive's own
   size — Workshop is part of that showing.
4. **Where does the club directory actually belong?** Behind a nav link is
   tidiest and makes the second-largest interactive surface invisible to anyone
   who does not think to look for it.

---

## 7. What waits for the novice test

Unchanged from `site-purpose.md` §9, plus two:

- whether a stranger reads *"What you can see here"* or scrolls past it (§5.7)
- **which page she lands on first.** She will be handed a link, and if that link
  is a game page then the home page is not her front door at all — which would
  reorder this entire document. **Worth deciding before the test rather than
  discovering afterwards**, because it is a property of how the test is run and
  we control it.
