---
name: verify-inherited-claims
description: "A claim in memory or docs is not evidence. ⛔⛔⛔ 2026-09-10 THE SHARPEST ONE YET, AND IT WAS BACKWARDS: I called a CODE COMMENT stale against `data/measures.json` and shipped it — a hand-run derive published the comment's exact numbers. **A committed derived file is a CACHE of the archive, not the archive**, and I checked the fresh thing against the rotten one. Same day I proposed a control that Kevin had REMOVED three days earlier, its decline sitting in a builder comment. ⚠️⚠️ 2026-09-07 I laundered a stale status row into a code comment. ⛔⛔ 2026-09-08 I recommended TWO already-declined things and **neither decline was where I looked**. **Before recommending or declaring anything stale, grep the REPO and re-derive the ARCHIVE.**"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-09-08T00:00:00.000Z
---

## ⛔⛔⛔ 2026-09-10 — I DECLARED A CORRECT THING STALE, AND THE REFERENCE WAS THE ROTTEN ONE

`zonestart.js` carried `census.drawStrength` figures in a comment: **4.302× and
1.273× over n=22,790 / 190,144**. `data/measures.json` said 4.16 and 1.272 over
21,704 / 188,421. I wrote the comment up as **stale**, corrected it, committed it
as a finding, and pushed.

⛔ **A hand-run derive published 4.302 and 1.273 over 22,790 and 190,144 — the
comment's own numbers, to the digit.** `strength.js` had stopped leaving situation
codes unclassifiable (`census.state.unknown`: **4,151.9 min and 1,117 goals →
zero**), every figure derived from them moved, and the COMMITTED file had never
been refreshed.

⭐⭐ **THE RULE: `data/measures.json` IS A CACHE OF THE ARCHIVE, NOT THE ARCHIVE.**
It is a committed *derived* artifact in a repo of inputs — the file's own builder
comment says exactly that — and I used it as the authority to judge something
fresher. **`guard where the archive is` is that rule, and I broke it while
quoting it.**

⛔ **AND THE FRESHNESS GATE COULD NOT HAVE CAUGHT IT.** `tools/measures_fresh.py`
watches a **named list** (`slot.*`, `measured`), so every census figure can drift
silently. `census.pace` joined it; the rest did not. **Re-derive before declaring
any census figure stale — `gh workflow run derive.yml --ref main`, ~35 min.**

⚠️ **WHAT WOULD HAVE CAUGHT IT IN TWO MINUTES:** noticing that the comment and the
file disagreed says *one of them is stale*, not *the comment is*. I never asked
which. **A disagreement has a direction and it has to be measured, not assumed** —
and the direction I assumed was the one that made me the discoverer of a defect.

## ⛔⛔ 2026-09-10 — AND THE SAME DAY, A CONTROL KEVIN HAD ALREADY REMOVED

`docs/score-effects.md` §6.2 proposed a *"while the score was level"* control
*"sitting where `Even strength only` sits"*. ⛔ **That place is empty** — Kevin
removed the situations control on **2026-09-07**, three days earlier, and the
reasoning applies to a level control word for word. CHENG had endorsed §6.2 on
that false premise.

⚠️ **THIRD DOCUMENT PROPOSING SOMETHING BY A PREMISE NOBODY GREPPED FOR**, and the
decline was in a **builder comment** — the same hiding place as the `const PACE`
decline in 2026-09-08. CHENG: *"the rule isn't holding as a habit, so it should
become a step in the artifact template rather than a lesson. Two minutes, and
it's caught three false premises."*

---

## ⛔⛔ 2026-09-09 — THE THIRD STATUS ROW WRONG ABOUT ITS OWN SUBJECT, and Kevin caught it

Row **C6** read *"Parked for the novice test"* while **Kevin's own ruling sat two
hundred lines below it in the same file**: *"the offside diagram is good right
now, locked in"*, 2026-09-08. He found it by reading the list back: *"C6 is
already built."*

⭐ **THE PATTERN IS NOT THAT ROWS GO STALE — IT IS THAT THEY ARE ONLY EVER CAUGHT
WHEN A HUMAN READS ONE BACK.** Three instances now, all found the same way, none
by any instrument. The same message corrected two more: **C3 was two things that
do not share an input**, and **C5 was not an item at all** but the base rate of a
layer, already computed and sitting unread in `measures.json`.

⚠️ **AND A FIGURE IN A MEMORY FILE WAS WRONG IN THE SAME SESSION** — "55% of the
event stream is uncounted" is 49.8%, written from memory into a note carrying a
*never quote counts from memory* warning. **Fourth recalled figure; second inside
a document warning against exactly that.** CHENG's proposal, not built: *any
figure in a doc carries the command that produced it*, the way `refcheck.py` made
citations verifiable.


## ⛔⛔ 2026-09-08 — I RECOMMENDED TWO ALREADY-DECLINED THINGS IN ONE SESSION

Kevin asked what to build next. Both of my first two answers were things **he had
already refused**, and both refusals were written down:

| I proposed | he had already declined it | where the decline lived |
|---|---|---|
| **E1**, names on the pre-game frame | *"the objective-function trap"* — twelve surnames mean nothing to a reader who knows no players | `docs/status.md` §E |
| **distance-based pacing** | 2026-08-29: *"let's make a constant update rate for the events"* | ⭐ **a CODE COMMENT above `const PACE` in `src/app.js`** |

He declined the second one again without knowing he had: *"I like the pacing the
replay has now and don't think I want to adjust it."*

⭐⭐ **NEITHER DECLINE WAS WHERE I LOOKED.** My memory file said the pacing was
*agreed and unbuilt* — accurate on 2026-08-24 and wrong by 2026-08-29, because a
memory file is dated the day it was written and the world keeps moving. The
authoritative record was **in the source**, which is the most durable place it
could have been and the last place a recall reaches.

**THE RULE: before recommending anything from memory, grep the repo for the
decision.** Not the docs — the repo. Decisions here live in code comments as often
as in `status.md`, and the comment is usually the one that is current.

## ⚠️ AND A COVERAGE FIGURE TURNED INTO A CLAIM ABOUT A SURFACE

I flagged that only **2,045 of 4,490 published games carry `hl`** (45.5%) and
implied the front door was half dark. It is neither a bug nor a parsing failure:
**294 of 294 sampled games produce a measurable first goal**, and `HERO_LOOP_CAP`
is 30 against a **median of 35 plays** — arithmetic, not a defect.

⛔ **And the number does not govern the front door at all.** `build_index.py`
selects on `hl` **between 3 and 8** — 434 games, 9.7% — and the hero is a **median
of ONE day** behind the newest published game. *I turned a field's coverage into a
claim about a surface that never reads it that way.*

## ⚠️ AND A CROSS-CHECK I NEARLY REPORTED WAS MY OWN BAD PROXY

Asked whether we could name the team that went offside, my first measurement said
two derivations agreed only **55.3%** — which reads as "the geometry is junk". It
was the PROXY that was junk: a shot 25 seconds earlier says nothing about who
carried the puck in. Tightened to a giveaway within 3–8 seconds it rose to
**76–83% on n=18–65**. ⭐ *Disagreement between two derivations tells you at least
one is unreliable and never which.*


**A claim I wrote down earlier is not evidence. Re-derive load-bearing facts from the source, especially when they are cheap to check.**

**What happened (2026-08-07).** [[hockey-legibility-build]] recorded that the NHL feed credits blocked shots to the *blocker's* team, so Corsi must flip attribution to the shooter. That claim was **false** for the endpoint we use. It travelled: memory → `README.md` → `read-the-game.html:130` → the audit doc I wrote for CHENG's review. Four artifacts, one unverified premise, and the app shipped a wrong Corsi count on the flagship claim (53.3% MIN; correct is 59.3%). CHENG caught it by running one query against `rosterSpots`: `eventOwnerTeamId == shooter's team, 44/44`.

**The tell I should have noticed and didn't:** SOG is computed from the *same* `own` field, unflipped, and reproduces the boxscore exactly (MIN 35 / BUF 25). So `own` means "shooter" for goals, shots and misses. "Blocked shots alone mean the blocker" was the extraordinary claim, and it carried no evidence. **When one field is claimed to change meaning for one event type, that is the claim to test first.**

**The false-evidence pattern, worth naming.** The README defended the flip with: *"the tell: 38 of 44 blocks were recorded in the blocking team's own defensive zone."* That statistic is **true** — and completely irrelevant, because `zoneCode` on a block is recorded from the defending side and says nothing about event ownership. A true number was offered as proof of a claim it cannot support. This is more dangerous than a wrong number, because it *looks* like the work was done.

**How to apply:**
- Before repeating an inherited data claim in code or docs, run the query that would falsify it. For feed semantics that means joining against an independent source (`rosterSpots`, the boxscore) — not against our own extract, which is circular.
- When writing "the tell is X", check that X actually discriminates between the hypotheses. If X would be true under both, it is not a tell.
- Folklore is often *stale truth*, not invention: older NHL endpoints really did credit the blocker. So the question is never "who is wrong" but "which version am I looking at."
- Correct the claim **everywhere it propagated**, memory included. Fixing code and README while leaving memory intact re-infects the next session — memory is the upstream copy.
- Composes with [[feedback-argue-the-opposite]] and [[builders-are-the-source]]. CHENG earns his keep on exactly this class of error; CC and CHENG being the same base model did **not** prevent it, because the failure was unexamined inheritance, not reasoning.

---

## 2026-08-17 — a claim that described a CAPABILITY and read as a FEATURE

`hockey-legibility-build.md` carried, in its architecture section, *"catalog.json
— one file, 1,534 rows. **Search, team filter and calendar** are all one
`.filter()` over an array in memory. No index, no DB."*

**None of the three exist.** Verified in `src/`: there is no search box, no
calendar and no date browse anywhere on the site. Exactly three paths reach a
game — the featured game on the front door, the teams grid → `/?team=AB`, and
"More BUF games" at the foot of a game page. **4,417 published games and no way
to ask for one.**

The sentence was TRUE about the data shape: those things *would* each be one
`.filter()`. Sitting in a list of shipped architecture, it read as a description
of the UI, and I had recited it as one.

**The new failure mode this names:** a claim about what something WOULD cost,
filed among claims about what something IS. It cannot be caught by re-deriving
the fact — the fact is correct — only by asking *"is this describing what exists
or what would be easy?"*

**And it survived because nobody tried to use it.** It was found only when an
outside review said discovery felt thin and I went to look. **An unexercised
claim decays silently**; the ones that matter are the ones no workflow touches.

## 2026-08-20 — "this was already ratified" is an inherited claim too

CHENG, reviewing the caching artifact: content-hashed extract URLs *"were already
ratified in the multi-game design"* — decided and never built, like A6.

**Checked against the source, and it is not what the document says.**
`docs/nightly-ingest.md` §Q4 ratifies content-addressing for the **raw store**
and leaves the extract at a fixed path **in the same code block**:

```
raw/{gameId}/{sha256}/play-by-play.json     every version, immutable
raw/{gameId}/latest.json                    pointer to the current hashes
extract/{gameId}.json                        <-- fixed path, mutable
index.json
```

The reasoning quoted was real and was about preserving **history** against
overwrite — not caching. So content-hashing the extract is a **new proposal**.

**Why it matters:** *"we already agreed this"* carries weight that *"this is a
good idea"* has to earn, and it short-circuits exactly the scrutiny a new idea
gets. **CC and CHENG are the same base model, so a half-remembered ruling is a
CORRELATED error** — the one class [[feedback-argue-the-opposite]] exists for.
His companion claim (the pipeline already hashes) checked out at
`game.src.{boxscore,play-by-play,shifts}`.


## 2026-08-21 — TWO MORE, and both had been read many times

**"4,553 games cannot be asked for"** sat at the top of C1 in the build list and
was the whole justification for the item. A **team browse has shipped all along**
— `?team=XXX&season=YYYY`, chips, season tabs — and it reaches **4,119 of 4,417
published games, 93.3%, in three clicks.** The 298 it does not reach are
deliberately out of scope and disclosed on the front door. The true claim is much
smaller: *there is only one way in.*

**"136 refusals" read as one population** because all 136 failed the same check.
**73 were being refused because the LEAGUE disagrees with itself** — our
extraction reproduces the NHL play-by-play exactly, checked against the league's
own running shot counter, 73 of 73 — and the other 63 are stub feeds with no shot
events at all. One symptom, two unrelated causes, and the gate could report only
one thing. Both 2024 conference finals were withheld for two years.

> **The shape both share: a number in the build list that was really a statement
> about a bug.** `docs/discovery.md` §4 had two days of design resting on "69 of
> 667 nights contain a refusal" — every one of those was one of the 73, so it is
> now zero. **Re-derive before designing against a figure, not just before
> quoting it.**

---

## 2026-08-26 — the same shape, caught one step before the page

`docs/below-the-rink-2.md` §7.2 proposed the slot's layer row read *"the 33 ft
where **79% of goals** are scored from"*. That figure came from an ad-hoc census
during the base-layer work, lived in that document and in memory, and **existed
in no published artifact** — not `measures.json`, not any page, not `measure.mjs`.

**Derived properly it is 75.4%** (19,304 of 25,597 goals, 4,192 games), computed
by `danger.js` itself over the whole archive, with `n` agreeing exactly with
`attemptMix.byType.goal` — a count reached by a different path.

⚠️ **Four points, and it was one edit from being typed onto every game page.**
The catch was noticing, while writing the copy, that I could not say where the
number came from.

⭐ **THE STRUCTURAL FIX, not just the correction: the card COMPUTES its sentence
from `RATES.slot` and says NOTHING when there is no archive.** A typed constant
would have passed any "does it state the share" test and gone stale the next time
`derive.yml` ran, with nobody ever seeing it happen. *If a number can move, the
page must read it rather than carry it.*

The rest of that census — 56.8% of attempts from the slot, 8.2%/3.3% at the blue
line — is **equally unverified and now marked so in place**. Do not quote it.


---

# ⚠️⚠️ 2026-09-07 — I LAUNDERED A FALSE CLAIM FROM THE RECORD INTO THE CODE, IN ONE MORNING

Sweeping dead CSS, I wrote into `src/app.css` that *"the amber ring is named in
the `.hint` line and almost nowhere else"*. I took it from a `docs/status.md` row.
I did not check it.

**Hours later Kevin's own instruction sent me to look at that surface, and the
caption had been naming the amber ring — and teaching the click — unconditionally,
from the opening frame, since 2026-08-27.** The row was written when it was true
and had not been re-examined.

⭐⭐ **THE SHORTEST PATH TO TURNING A STALE CLAIM INTO A FACT IS QUOTING IT IN A
COMMENT.** Prose in the repo reads as verified because everything around it is;
a sentence copied out of a doc arrives wearing the authority of the file it lands
in. Three of Kevin's own status rows were wrong about their own subject that day,
and each took **under a minute** to disprove **by booting the page**.

⭐ *The instrument for a claim about the page is the page.* Not the doc, not the
markup, not a grep over the bundle — a grep cannot tell code from the words about
code, which bit me a fourth time the same week.

# ⛔⛔⛔ 2026-09-14 — GREPPING THE REPO IS NOT ENOUGH. `git log -S` IS.

Kevin asked for a vertical club name behind each net. [[red-on-red-ends]] — this
memory, written by me the day before — told me to re-read `docs/ends-switching.md`
§10 and `docs/scoreboard-mobile.md` §5.2 first, *because this project's named
failure mode is proposing something already declined*.

**The element had already shipped and already been deleted**, two hours apart on
one August day: `52f9b5c` at 09:01 built `<text class="netlab">`, `76e7a86` at
11:12 removed it. **Neither document mentions it.** The decline existed as a
commit body and a test assertion, in a class name I was about to reuse verbatim.

What caught it was the old guard firing —
`assert.doesNotMatch(rink, /class="netlab"/, 'the vertical tag is gone')` — and
then `git log -S'netlab'`, which named both commits in one line.

> **`git log -S` the identifier you are about to reintroduce.** A doc search
> cannot see a decision that was only ever recorded as a deletion, and the file
> telling you where to look is only as good as where its author looked.

⭐ **The decline's REASON was dead** — *"a goaltender in the crease says the net
is defended and the club's colour says whose"*, which is the exact premise Kevin
disproved from his phone a month later — so the right move was to ship it anyway.
**Finding it is still what made that a decision rather than an accident**, and
it is what let the commit say which three things are different this time.

⚠️ Same day, same shape one level down: I gave Kevin an occlusion figure of 3.4%
for a region I had **guessed** at (`|y| ≤ 10`, "roughly how tall the label
looks"). The label's height is its TEXT LENGTH; the real figure is 1.56%.
**A measurement whose REGION is assumed is an assumption wearing a number.**


## ⛔⛔⛔ THE HARDEST CLAIM TO DOUBT IS THE ONE YOUR OWN INSTRUMENT MAKES — 2026-09-21

The 2026-09-19 ingest halt reported itself as **"the run halted on a feed vocabulary
change"**. It was not: it halted because no game in the window was final — seven
preseason openers, all `FUT`, hours before puck drop. `ingest.yml` **hard-coded that
cause** for the exit code, and its comment still described a halt `fetch_nhl.py` had
already replaced.

**CC believed the CI error line and wrote it into `docs/status.md` and into memory as
"the vocabulary alarm working".** A genuine vocabulary halt the next night appeared to
confirm it, and the real cause went unexamined for a day.

⭐⭐ **A sentence restating what another module decided is a SECOND COPY, and it drifts.**
The rule this file already carried — *a claim in memory or docs is not evidence* — now
extends to **our own tooling's output**: a log line, an error message, a CI annotation.
The fix is always the same shape: print the reason the deciding code composed, never a
restatement of it.

⚠️ Two more of the same family, same week: a comment claiming `roughing-double-minor`
needs no "double minor" in its name because *"the clock beside the name already says
4:00"* (the chip renders time REMAINING, so it is true for one instant), and the cron
comment asserting the nightly runs at 11:00 UTC when it **has never once started on
time** — while the measured spread sat in `docs/front-door.md` §6.1 all along. **Two
copies, one drifts; the one that drifts is the one nobody runs.**

**2026-10-21 — a doc's claim about the REAL WORLD needs a real-world check.** `docs/ends-switching.md` said
as-played "is what a viewer watching the broadcast sees"; nobody had compared one frame with video, and
the rink was a left-right mirror for ~2 months. Kevin found it in one comparison (NHL goal visualizer).
Same week, same shape: I took the league's "save" label over the tracking that suggested the post.
How to apply: when a claim names an outside reference (the broadcast, the league's picture, the rulebook),
check it against that reference once, with a named example, before repeating it.
