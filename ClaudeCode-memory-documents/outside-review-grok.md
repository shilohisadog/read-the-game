---
name: outside-review-grok
description: "⭐⭐ THE FIRST REVIEW OF THE SITE BY SOMEBODY WHO IS NOT KEVIN OR ME — Grok, asked by Kevin on 2026-10-07. ✅ BOTH ITS FACTUAL CLAIMS WERE REAL AND BOTH ARE NOW FIXED (`2415648`), but ⛔⛔⛔ MY DIAGNOSIS OF THE FIRST ONE WAS WRONG IN A WAY THAT WOULD HAVE PRODUCED THE WRONG FIX: I called it two VINTAGES and proposed a date stamp, when both copies declared the SAME `dataThrough` and 35 figures differed anyway. ⭐⭐ The clock needed TWO fixes, not one — a zone label, and naming the day, because the heading and the row were each correct and together false. ⚠️ A THIRD OF THE CLOCK FINDING WAS NOT REAL: the two time formats it reported are in inlined JS COMMENTS; no page renders a clock literal at all. ⭐⭐ Its best point stands and is OPEN: the first screen is TWO PRODUCTS."
metadata:
  node_type: memory
  type: project
  originSessionId: ff173db5-1717-462d-b1d1-955659c28146
  modified: 2026-10-07T18:20:00.000Z
---

# The first outside review — 2026-10-07

Kevin asked Grok to review the site and pasted the result. It read the homepage,
the lessons index, `/offside`, and a real replay (MIN at BUF, stopped on the
offside at 4:48 of the first).

⭐ **IT IS THE FIRST READING BY ANYTHING THAT IS NOT KEVIN OR ME.** The novice
test ([[novice-tester-scheduled]]) is still the planned way to learn this and is
still parked; this arrived first, the way the public post did.

## ⭐⭐ WHAT IT PRAISED, WHICH IS WORTH KNOWING TOO

The writing, *"the puck only appears where something happened"*, the
"what this does and does not claim" section (*"earns trust instead of hedging"*),
lesson-then-real-game as the structure, and **deep links to a moment** — *"the
feature I would keep above almost anything else."*

## ✅ I VERIFIED ITS TWO FACTUAL CLAIMS AND BOTH WERE REAL

⚠️ **An outside reviewer's numbers get the same treatment as mine** — the rule in
[[verify-inherited-claims]]. Both survived it.

### ⛔ 1. ONE MEASUREMENT, TWO VINTAGES, TWO NUMBERS

It reported the homepage saying *19,500 goals from 170,663 attempts* and the
lessons page *19,552 from 171,027*. By the time I looked, all three pages agreed —
but **170,663 is exactly what the PUBLISHED `measures.json` held that morning.**

The mechanism, and it is the project's most expensive recurring class:

- the **front door FETCHES** `measures.json` at runtime → the published copy
- `what-you-can-see.html` and `slot.html` **BAKE** the figure at build time →
  the committed copy

**Two surfaces print one measurement from two different documents, and nothing
checks they agree.** The static pages already carry `__MEASURED_UP_TO__` for
precisely this reason; the front door does not, so a reader comparing them sees
two numbers and no explanation. ⏭ **OPEN:** a gate that the fetched figure and the
baked figure are the same measurement, or each says which vintage it is.
Same family as *"the committed document is not the published one, for one night"*
([[hockey-legibility-build]]).

### ⛔ 2. THE CLOCK IS IN THE READER'S ZONE, UNLABELLED, UNDER "TONIGHT"

It saw *"11:30 PM"* and *"2:00 AM"*. **Reproduced exactly**: `clockOf` uses
`toLocaleTimeString(undefined, …)`, so rendering the live front door under
`TZ=UTC` gives

```
PIT at WSH · 11:30 PM     COL at WPG · 11:30 PM     EDM at ANA · 2:00 AM
```

⭐⭐ **AND IT IS WORSE THAN A MISSING LABEL.** The heading above says *"Tonight ·
3 games"*, and for that reader one of them is **tomorrow**. A heading that names
a day over a time rendered in a different day is false. Same seam as
[[front-door-tonight]]'s league-date-versus-reader-calendar problem, surfacing on
the fixture clock. ⚠️ A third nick in passing: `7:30 PM` and `10:30pm` are
formatted two different ways on one page. ⏭ **OPEN.**

## ⭐⭐ THE STRUCTURAL POINT, WHICH I THINK IS RIGHT

> *"The first screen is doing too many jobs … Those are two products. One teaches
> offside. The other is a careful counting tool for people who already know
> Corsi. The second will lose the first audience, and the first audience is the
> one the headline names."*

⭐ **This is the same argument I made to Kevin that morning from a different
direction** — I moved the two teams above "What is normal" on the preview because
the page led with the general and buried the specific. Grok makes it about the
HOMEPAGE.

⚠️ **AND THERE IS A TENSION TO RESOLVE DELIBERATELY:** we added a player block to
the TOP of the preview the same day. That is defensible — a named human is the
most concrete thing we can offer a novice where a slot percentage is the least —
but *"one action above the fold"* and *"more above the fold"* have to be
reconciled on purpose, not by accident.

**Its other true observation:** eleven of fourteen lessons open the same game
(`2023020204`) in the first period. The lessons page admits it; **the homepage
does not**, so a visitor can think the site is a demo of one old game. Cheap to
fix, and it is about TRUST rather than correctness.

## ⛔ THE ONE I WOULD PUSH BACK ON

> *"Layers hidden until someone asks for them."*

The layers are what the site IS — *every number opens to how it was worked out* is
the promise and the layer row is where it lives. **"Press play and just watch" as
the default is right; removing the controls from view is a different change** and
wants the novice tester in front of it first.

## ⏭ KEVIN'S CALL, NOT MINE

The name collides with `readthegame.ai`, a World Cup novella site and a large
TikTok account. Nothing I can verify usefully; it is a findability question.

## ✅ BOTH CLOSED 2026-10-07 — AND WHAT I LEARNED FIXING THEM

### ⛔⛔⛔ MY DIAGNOSIS OF THE SLOT COUNT WAS WRONG, AND THE FIX FOLLOWED FROM THE RIGHT ONE

I wrote *"one measurement, two vintages"* above and proposed giving the front
door a `__MEASURED_UP_TO__` stamp. **That would have changed nothing.** Measured:
both copies declared `dataThrough: 2026-10-06` and `measured: 4244` — the SAME
vintage — and **35 figures differed**, because the league reclassified one
shot-on-goal as a blocked shot after we measured (`shot-on-goal` 218,002→218,001,
`blocked-shot` 140,523→140,524). ⭐ **A DATE STAMP IS NOT A VINTAGE.** Two
documents can agree on every label and disagree on the content.

⭐⭐ **AND THE REAL HOLE WAS A GAP BETWEEN TWO WRITES.** `ingest.yml`'s refresh
step publishes to R2 and commits to git as two acts in one step. The 15:49 run
published the amended measurement and **died at the health block between them** —
origin moved, repo did not, `npm run gates` green on the difference because
nothing in `gates` reads the origin. See [[ingest-delivery-target]].

⭐ **THE GATE EXISTED AND RAN WHERE IT COULD NOT ANSWER**:
`tools/measures_fresh.py` was called immediately AFTER
`cp ingest/measures.json data/measures.json`, so it compared a file the step had
just overwritten against the document that file came from. It printed *"every
quoted figure already matches"* while the repo was six figures behind. Now in
three positions, three questions: **deploy.yml hard-fails**, ingest runs
`--report` BEFORE the copy, derive keeps its hard fail. ⚠️ Not in `npm run gates`
— that must run offline, and a check that passes when it cannot fetch is Shape 10.

### ⭐⭐ THE CLOCK NEEDED TWO FIXES AND I NEARLY SHIPPED ONE

The label was the easy half: `timeZoneName: 'short'`, the READER's zone, never
Eastern — printing Eastern would make every reader do the arithmetic the
rendering exists to do for them.

⛔ **THE HARD HALF: `nightWord` ALREADY EARNED "Tonight" CORRECTLY.** It compares
the league's date to the READER's calendar, so the heading was right. And the row
was right. **Together they were false** — under `TZ=UTC`, *Tonight · 3 games* over
`EDM at ANA · 2:00 AM`. A label alone leaves that intact. So a row now names its
local day **only when it disagrees with the night's**: on every row it is noise,
and noise is how a warning stops working. ⭐ The quiet case has its own test, or a
`dayNote` returning a constant would have passed the loud one.

Verified live in three zones — Tokyo exercises both halves at once:
`Wednesday, October 7 · 3 games from 8:30 AM GMT+9 · Thursday where you are.`

### ⚠️ AND ONE THIRD OF THAT FINDING WAS NOT REAL

It reported `7:30 PM` and `10:30pm` formatted two ways on one page. Checked
against reader-visible text with scripts, styles and comments stripped: **no page
renders a clock literal at all.** Every `10:30pm` is an inlined JS comment
explaining the timezone seam. **It was reading the HTML source, not the page** —
the same class of error as [[mechanize-the-review]]'s *a string in a log is not a
thing that happened*, and worth remembering about any outside reviewer's evidence.

⭐ **THE RULE HELD BOTH WAYS.** [[verify-inherited-claims]] says a claim is not
evidence until checked. Two of its three claims survived and one did not, and
only checking told me which.
