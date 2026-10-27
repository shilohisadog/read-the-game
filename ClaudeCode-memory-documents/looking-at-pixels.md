---
name: looking-at-pixels
description: "The suite is BLIND on layout, so a rendering problem must be LOOKED at. ⛔⛔⛔ 2026-09-18: 1,323 GREEN TESTS AND THE CONTROL WAS THE WRONG SIZE — CSS SPECIFICITY, invisible to every text check, found only in a real browser. ⛔⛔ 2026-09-09 THE CALENDAR CAN HIDE THE STATE YOU NEED TO SEE — the daily block's slate state cannot render on the live site until 29 September, and it shipped broken past 1,144 green tests; the fix was TEACHING THE HARNESS THE STATE (`RTG_PIXELS_SLATE=<date>`, real extracts through the nightly's own command), not inventing a fixture. ⭐⭐⭐ 2026-09-08: looking REVERSED my own recommendation — the embed player's static config declares no ad plugin and a browser loads the full Google ad stack plus a pre-roll. ⚠️ `click({force:true})` disables the actionability check, so it answers the opposite of *can a person press this*. ⭐⭐ 2026-09-07: looking KILLED A FIX THAT WAS RIGHT ON PAPER — a precedent transfers with its CONDITIONS. Plus the jitter rule re-earned twice, the jitter census, and read visibility when visibility is the question. ⭐⭐⭐ 2026-10-04 (later): **A TRUSTED PRESS IS NOW POSSIBLE** — `tools/browser/cdp.mjs` (dependency-free DevTools client) presses a control with a real event, closing the blind spot `scrub.js` had WRITTEN DOWN for months: every probe drove the scrubber with `input` alone, half of a gesture no hand can make, and a tap therefore played every play twice. ⛔ Some damage is not a DOM state at all — the document after two draws is byte-identical, so `one-tap.mjs` counts `animationstart`. ⭐⭐ **CSP does not bind the debugger**: `Runtime.evaluate` measured one real tap on readthegame.co itself."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-09-08T00:00:00.000Z
---

# ⛔⛔⛔ 2026-10-03 — THE ONE PICTURE ON THE PREVIEW PAGE HAD NO CHECK AT ALL

`grep trackFor test/ tools/` returned NOTHING on the day it broke. The club bars
a novice is sent to read were drawn by an inline page script that nothing in the
repo ever looked at — 1,600 tests and fourteen browser probes away from it.

⭐ **GREP THE SUITE FOR THE NAME OF A DRAWING FUNCTION.** It is one command and it
finds the blind spots directly. Every picture on this site should answer it.

**WHAT BROKE:** the bar's `fill-opacity` is `games / need`, which on a preview in
October is 1/35 — three per cent — so the shaded band behind it showed through and
its edge read as a fill level. Kevin found it from the live page, again. See
[[mechanize-the-review]] #49.

**THE PROBES, TWO OF THEM, both born that day:**

| probe | asserts | canary |
|---|---|---|
| `preview-marks` | each club mark sits at the number printed beside it, and carries club ink | every mark back on the league tick — the old encoding |
| `methods-deeplink` | every work door lands on its own section, and takes focus with it | scroll back to the top after the page draws |

⭐ Both reconcile things read off the RENDERED page by separate paths — the
printed figure, the printed axis, the mark's position — and do the arithmetic in
the probe. Nothing compares the renderer with itself.

⛔⛔ **AND BOTH WERE WRONG SEVERAL TIMES, caught only by mutating them.** The
shapes are in [[mechanize-the-review]] #53: a check written against the EASY
state approved the thing it forbade; a locator that disappeared along with the
defect; a canary that displaced something the probe no longer looked at; and a
visibility rule satisfied by a white notch carrying no club colour.



## ⭐⭐⭐ 2026-10-04/05 — THE FIGURE REBUILD WAS ENTIRELY A LOOKING JOB

Kevin's complaint (*"the stick figures … just don't work for me anymore"*) could
not be checked by reading, and neither could any of the four defects in my own
replacement art. Each one was found by rendering the figure and opening the PNG:

1. pads narrow and tall → a thin man in white trousers;
2. pads wide but surrounded by eleven loose objects → **the mascot works because
   its SILHOUETTE IS ONE BLOB**, and I had not given him one;
3. ⭐⭐ **A FIGURE CHECKED AT ONE SIZE IS NOT CHECKED** — `#eaf1f7` pads on
   `#eef4f8` ice were flawless on a 250px comparison sheet and INVISIBLE at the
   **54px the replay actually draws**. One axis over: **A COLOUR CHECKED ON ONE
   BACKGROUND IS NOT CHECKED** — the official's raised arm was the sweater's white,
   perfect on the diagram's dark preview ground, a floating hand on real ice;
4. ⭐⭐ **DRAW ORDER IS A VISIBILITY PROPERTY.** Once dark, that arm was drawn
   BEFORE the head and painted out by an opaque circle — which looks exactly like
   defect 3 and is a different cause.

⚠️ **AND THE OLDEST TRAP IN THIS FILE CAUGHT ME AGAIN, FROM A NEW DIRECTION.** The
goaltender appeared to render at ~10% opacity on the real page. It was my CAMERA:
`Page.captureScreenshot` with `captureBeyondViewport` RESTARTS CSS animations, so
I was photographing the first frame of the `gkin` fade-in. Computed opacity was 1
the whole time. Same family as the video's "black band" — **I measured a property
of my screenshot and nearly reported it as a property of the page.** The fix is
the same one as always: ask the page, do not ask the picture. Injecting
`animation:none !important` before the shot settled it.

⭐ **A SCRATCH HARNESS IS A SURFACE TOO.** Two of my comparison renders were wrong
for harness reasons, not product reasons: a standalone SVG outside `#rg` got none
of the stylesheet's fills (black ice), and a viewBox without headroom clipped the
official's raised arm so it looked missing. **Before reporting what a render
shows, ask what the harness is not giving it.**

## ⛔⛔ 2026-09-09 (late) — THE CALENDAR CAN HIDE THE STATE YOU NEED TO SEE

The front door's daily block has three states and **only one of them can render
on the live site until 29 September** — it is the off-season, `recent.json`
publishes `{"games":[]}`. So the state carrying the whole feature was unreachable
from a screenshot of production, and it shipped broken past **1,144 green tests**:
a real **16-game night** grew the hero card 800px → **1,230px** and left
~**1,250 × 480 of empty white** beside the list, because the rink does not grow
with it.

⭐ **THE FIX WAS TO TEACH THE HARNESS THE STATE, NOT TO INVENT A FIXTURE.**
`tools/pixels.sh` gained `RTG_PIXELS_SLATE=<date>`, which fetches that date's
REAL extracts from production and runs **the nightly's own command** over them.
Production's data through production's code path — the only thing not true of
tonight is the date. ⛔ It is opt-in and prints a banner every run, because a
harness quietly serving a document production does not have is the stale-fixture
failure that file already carries two paragraphs about.

⭐ **USE A DATE, NOT `=1`.** The first run used the extracts already on disk —
June playoffs, ONE game a night — and looked perfect. A one-row list and a
sixteen-row one are different layout questions.


## ⭐⭐⭐ 2026-09-08 — LOOKING REVERSED MY OWN RECOMMENDATION, ON EVIDENCE READING COULD NOT PRODUCE

I told Kevin the NHL's embeddable player had **"no ad plugin (IMA) — not
present"**, read off its static configuration document. That document is
*accurate*: its plugin list contains one GA tracker and nothing else.

**Then I loaded it in a browser and pressed play.** The IMA SDK loads at play
time; a golf commercial ran; 24 ad requests; **13 third-party hosts** including
the full Google ad stack, on a site that ships zero third-party scripts.

⭐ **The config was true about what is DECLARED and silent about what LOADS.** Same
family as everything else in this file: *reasoning from something true about a
part*. On that evidence I reversed my recommendation from "embed it" to "link
out" — and Kevin overruled me with the counter-argument that mattered (the visitor
does not leave our site), which is why it shipped **collapsed, with the ad named
in the sentence before the press**.

## ⚠️ AND `click({force: true})` IS A LIE DETECTOR YOU HAVE DISABLED

Verifying that pressing a goal scrolled the page, I used Playwright's
`click({force: true})` — which **bypasses the actionability check**, i.e. the
exact check that reports whether a real click can land. It "passed" on a target no
visitor could hit. **If the question is *can a person press this*, `force` deletes
the question.** See [[mechanize-the-review]] — this was one of three hit-target
failures on one feature.

## ⭐ THE JITTER RULE, RE-EARNED TWICE IN TWO DAYS

Anything that renders **per frame above the transport** moves the Play button. The
highlight section did it once (mounted after `#caption`, Play moved 113px down and
back); the "watch the highlight" line nearly did it again. **Both were found by
screenshotting, not by testing**, and the fix each time was to use space the page
already reserves: the section went below the scrubber, the line went into
`#who`'s `min-height` row. Measured after: **row 18px before and after, Play's top
moves 0px at 390 and at 1512.**


## ⭐ 2026-08-28 — LOOKING FOUND FIVE THINGS THE SUITE COULD NOT

**A dead scrubber on every game page.** Boot threw; the suite was green. Found by
driving the page in Chromium, not by a test.

⚠️ **AND MY OWN BOOT CHECK LIED THREE TIMES IN ONE DAY.** `#rg .board` is STATIC
MARKUP — it exists on a page whose script never ran, so `booted: true` was a
false positive. Also joined `/game.html` + an href that already began
`/game.html`, got a 404, and printed a row of `undefined` as though it were
geometry. ⭐ **A boot check must read something only the SCRIPT can produce** —
`+scrub.max > 1` works, a static element never does.

⭐ **COPY THAT ONLY LOOKING CAN JUDGE.** *"more than 200 of the 200 games this
season"* is precise, self-checking, and reads like broken arithmetic (now
*"higher than all 200 games"*). *"One of 5 counts"* when it was all five is true
and weak. The share control's confirmation wedged itself into a 103px column at
360 and broke into **five lines of two words**.

⭐ **U11 — THE SCOREBOARD IS TALLER THAN THE ICE ON A PHONE**, and the mechanism
is this file's own oldest lesson: **the board's height is CONSTANT across widths
(161/161/159) because its type is in `rem`**, while the rink is width-bound at
**2.35:1** because that is the ice. 118% of the rink at 390, 129% at 360, 43% at
1100. ⛔ The rink cannot be made taller without being made wider, so **every fix
is a scoreboard fix**.

**When Kevin reports something about how the site LOOKS, run `tools/pixels.sh`
before forming an opinion.** Do not reason from the source. The reasoning has
been sound and the rendering wrong three times in a row.

## Why

The unit tests boot the real bundle against a fake document with **no CSS and no
layout**. `display:none` is invisible to it, and so is every question about size,
position or overflow. That is a structural blind spot, not a weakness to fix —
the tests are strong on the axes they can see.

The five-second homepage preview shipped broken three times, **423 tests green
through every one**:

| Kevin saw | the cause |
|---|---|
| *"a blur… looks like 100x real-time"* | 44 events in five seconds; 11× the page's own teaching pace |
| *"the bottom 1/3 of the rink is clipped"* | a fixed `aspect-ratio`; the rink scales with width, the chrome's height does not |
| *"doesn't look to be scaling properly"* on mobile | the scoreboard was **87px in both** an 856px frame and a 287px one |

The last one took one run to find and I had spent three commits reasoning about
it. **Nobody was going to derive "87px in both" from the source.**

Then a screenshot Kevin sent found **two live defects** the same way: the CSP
silently refusing all 13 inline `style` attributes, and `.vtrack` being an inline
span with zero width so every verdict card drew its rate at 0%.

## How

`tools/pixels.sh [widths…]` — builds, serves, opens a real Chromium, prints the
preview's geometry, writes screenshots. Playwright installs into a scratch dir
**outside the repo** so `package.json` keeps "zero dependencies, deliberately";
the missing system libraries come from `apt-get download` + `dpkg-deb -x`, no
root. Full rationale and both ways it lied in **`docs/looking-at-pixels.md`**.

Two traps, both already paid for:
- **It rewrites the data origin, so the page 404s its extract and never boots** —
  and then reports tidy geometry for an ERROR PAGE. It now fetches a real extract
  and reports `booted` first. Three "no change" runs cost this.
- **It strips the CSP** (rewriting the origin breaks the pinned hash), so it can
  never show a CSP-caused defect. For those, render the LIVE page and compare it
  against the same page with the policy removed — that comparison is what proved
  D1.

## It generalises past layout

**Any question about what a browser DOES is answered by running one.** Fixing the
CSP defect took three CI round-trips on three wrong guesses about what Chrome
writes to its console. Installing playwright's chromium locally — the same route
this script takes, `apt-get download` + `dpkg-deb -x` for the three missing
libs — answered it in one run, verbatim:

> `error: Applying inline style violates the following Content Security Policy
> directive 'style-src …'`

Chrome had **changed the wording**; the grep was looking for a sentence it no
longer writes. No amount of reading the workflow file would have found that. The
same local run confirmed both fixes live and turned up a third-party beacon
Cloudflare injects into every browser request.

## And to COPY, not only layout

Two defects in one afternoon that no test could see and reading the builder would
not have found:

**Prose that enumerates a list rots silently.** The game page's opening paragraph
said *"add a metric layer below — control, shots from the slot, goaltending, or
why play stopped"*. Four layers, and there had been five since the blocked-shots
layer shipped. Nothing checked it, because nothing can check a sentence for being
out of date. The fix is structural: **say "add a layer below" and let the buttons
be the list**, with a test forbidding the enumeration from coming back.

**A sentence can be correct in isolation and wrong where it lands.** Splitting the
first-visit greeting in two put *"Here is why that is worth doing:"* immediately
after *"Why add a layer?"* — the block asked a question and then announced its own
answer. Every test passed. Copy fails without a stack trace.

**So render it and read it back.** Boot the real bundle, strip the tags, read what
a visitor gets:

```
node -e "… new Function('document', …, SCRIPT)(fakeDoc, …); b(rich, rates);
         strip(doc.getElementById('newcomer').innerHTML)"
```

The source is a template with the answer in pieces — string concatenation, a
ternary, an interpolated number from a file. **The assembled sentence exists only
at runtime, so that is the only place it can be proofread.** Same argument as
`tools/pixels.sh` for layout, and the same failure without it: reasoning about a
thing instead of looking at it.

## The generalisation

*A check that cannot fail must never be described as protection*, and the same is
true of a check that cannot SEE. Before claiming a visual thing is fixed, ask
which instrument saw it. If the answer is "I reasoned about the CSS", it is not
fixed yet. See [[mechanize-the-review]] for the family this belongs to.

## And it MEASURES a complaint, not just confirms one

Kevin: *"the card below the rink becomes disjointed with the event by event
action."* True, and unactionable as stated. Walking a real game frame by frame in
a browser, comparing the playhead against the card's own timestamp:

```
median   29s behind      90th   102s behind
75th     64s behind      max    215s behind
under 5s on 22% of frames
```

**The screenshot he sent was a 20-second gap — better than median.** Without the
walk we would have designed against the mildest instance of the problem.

The same run turned up what no reading would have: with the whistle layer **on**,
the visible legend was five keys and **none of them the ring the layer draws**.
The only naming was an SVG `<title>` — no hover on a phone, and nobody hovers
while watching. **A tooltip is not a label.**

**So: when Kevin reports a feeling, turn it into a distribution before agreeing
with it.** Both of the above went into `docs/rink-and-card.md` as numbers, and
the numbers changed the design.

## AND A FIX CAN REGRESS THE VERY THING IT FIXES

The event-index work added `◀ Back` / `Next ▶` to the transport because the
slider could not be aimed — measured at **1.69 plays per pixel on a 360px
phone, 68 plays under one fingertip.**

The two buttons then took **169px straight out of the slider**: 306px → 137px at
1100px, which is **2.04 plays per pixel — coarser than the defect they were
fixing.** 479 tests green throughout; the fake document has no layout, so not one
of them could see it.

The slider now takes its own row, which is better than the *starting* state at
every width (0.31 / 0.82 / 0.89 against 0.92 / 0.83 / 1.69) and — the part worth
keeping — **is no longer a function of how many buttons happen to sit beside
it.** Before the fix, the three viewports disagreed about whether adding the
buttons had helped or hurt, purely on flex-wrap luck.

**Measure the thing you improved, after you improve it.** A control that shares a
flex row with the control you just added is downstream of your change whether you
thought about it or not.

## AND MEASURING CANNOT TELL YOU WHO YOU ARE MEASURING FOR

The blocked card's header layout was measured at two viewports and decided for
the wrong reader — see [[mechanize-the-review]]. The numbers were right both
times. **Before measuring a layout trade, write down whose screen wins.** On this
project the answer is usually the phone, because the novice tester uses one and
the novice is the audience.

---

## 2026-08-17 (late) — two defects that only a rendering could show

**THE CONTROL BAR CLAIMED 100% FOR ONE TEAM AT 0-0.** Turning the Control layer
on for the home page hero put a bar on the board, and the screenshot showed it
entirely in the home team's colour before a puck had been shot. `tot = a+h||1`
avoided the division by zero and then **drew the result anyway**. It was on the
hero, in the first frame of every visit, and **it was never a preview bug** — it
is what the layer did at the start of any game. No test could see it, because it
is a width. *The instrument was missing, so the defect was invisible.*

**AND THE BOARD BLEW A BUDGET THAT ONLY CI MEASURES.** With a layer on, the
scoreboard became **68px of a 184px frame — 37%**, over the one-third the deploy
gate allows (a gate that exists because a scoreboard once ate 56% of a phone
frame). Cause: **every other child of `.board` already carried `min(Xvw, …)`
scaling in preview and `.cbar` never had, because it had never been in preview.**
Its `rem` sizes render at desktop scale inside a 287px box — the exact
rem-does-not-scale failure this tool was built after, arriving in the one element
that had been exempt from the original fix.

**REPRODUCE THE GATE'S OWN BOX LOCALLY.** The gate sizes the iframe to 287×184.
The page's mobile aspect-ratio (200/128) means **a 320px browser width produces a
290×186 frame** — so `tools/pixels.sh 320` measures what CI measures, and the fix
was verified to 52px against a 62px allowance before pushing rather than after a
red deploy. **Find the local width that reproduces the remote measurement.**

**AND THE HEADLINE CAN BE CONTRADICTED BY THE HERO UNDER IT.** The `<h1>` promised
*"the counts built in front of you"* while the frame below it ran with no layer at
all. Nothing failed; the front door simply advertised the one configuration that
was not the stated conversion. **Read the page's own promises against what the
page actually shows** — that comparison has no test and never will.

## 2026-08-18 — a highlight is judged against what is UNDER it, not in isolation

**Kevin: *"the highlighting isn't obvious like it is on the end zone line."***
The rule-line mark was `stroke-width:1.5` — about the weight of the lines it was
marking — so it read as a highlight over the THIN goal line and vanished into
the THICK red centre line. The `.dim` variant made it worse with a dash.

**Two errors compounded, and both are general:**

1. **The hierarchy was encoded in OPACITY, which is judged against whatever is
   beneath it.** Width is not. Move the distinction to a channel the background
   cannot eat.
2. **The hierarchy was BACKWARDS, and then turned out to be unnecessary.** The
   centre line was drawn dimmer AND narrower — but it is the thicker line, so it
   needed a *wider* band to show at all. And Rule 81 names both lines equally, so
   the distinction was answering a question nobody asked. One band, 4.6, wider
   than anything on the ice.

**The invariant a test can hold: the band must exceed every stroke-width drawn
under it.** Not a chosen number — a relationship.

## AND THE ONE THING NO SUITE CAN SEE: WHICH WAY A TEAM ATTACKS

Kevin, on a blocked shot at the far end: *"I don't understand how Toronto would
have a shot blocked in the offensive zone?"* The mark was correct in every
respect — and the direction was inferable **only from which crease a goaltender
happened to be standing in**. CHENG had flagged the same ambiguity once before
(*"'CBJ' alone can be read as 'CBJ's net' or 'where CBJ shoots', and those are
opposites"*) and it was answered by drawing a goalie, which says *whose net* and
never *which way they shoot*.

Fixed in the scoreboard — `ATTACKS →` / `ATTACKS ←` — measured at 390px: board
unchanged at 103px, no overflow. **Then it turned out to sharpen a different
problem** (see [[ends-switching-reopened]]): a constant, stated direction reads
false to anyone who knows the teams switch ends each period.

**A fix for one confusion can create another, and only a reader finds it.**

## ⭐ 2026-08-18 — THE PREVIEW IS A DIFFERENT LAYOUT MODE, and I never opened it

**Kevin screenshotted the front door: the penalty boxes were rendering in the
RIGHT-HAND MARGIN of the rink**, with `PENALTY BOX` floating above them, on the
homepage hero — the one frame most visitors see first.

The cause is one line:

    #rg.preview .rinkbox{flex:1 1 auto;min-height:0;padding:6px;display:flex}

**`.rinkbox` becomes a flex ROW in preview.** A block added inside it does not
stack under the rink; it becomes a flex **sibling** and lands beside it.

### The lesson, and it is not "look at the page" — that part I did

I *did* look. I rendered `game.html` at 390 and 1100, screenshotted it, measured
the band at 62px and the rink at 136px, and confirmed the rink had not shrunk.
All of that was true and none of it covered the defect, because:

> **The same component had TWO layout modes and I rendered one of them.**
> `#rg.preview` is a wholly different geometry — 100vh, flex column, a hide-list
> of eleven selectors — and the hero iframe is the only place it exists.

That is the *instrument shape* lesson wearing a layout costume: a check over one
mode cannot see a defect that lives in the other. Kevin found it by opening the
site, which remains the only instrument that sees layout at all.

The endnote shipped with identical exposure and was caught in the same pass —
one bug, two components, because they were added to the same parent.

### The guard, and why it is not just a string check

    #rg.preview .pboxes,#rg.preview .endnote,#rg.preview .counters{display:none!important}

The test asserts both selectors are in the hide-list AND **that the flex rule
still exists** — so if `.rinkbox` ever stops being a flex row, the test says it
is guarding a hazard that has gone rather than sitting there looking like
coverage. Proven by mutation: remove the hide rule and it fails.

**`ANYTHING ADDED INSIDE .rinkbox HAS TO ANSWER THIS QUESTION`** is now written
in the stylesheet, where the next person will be standing.

### In the same session, the same class, caught by measuring rather than by luck

The ends disclosure's first draft painted its `display:` provenance string on the
ice and ran to **176px on a 390px phone — taller than the rink above it**, on a
page Kevin had just called overcrowded. `LINK_NOTES`, the other member of that
provenance family, renders only its `text` and keeps `from` for the tests. That
precedent was right and the new code broke it. **78px after.** Measured both
times; neither number was predictable from the source.


## 2026-08-19 — A SECOND MEDIA QUERY FOR THE SAME JOB LOST SILENTLY

Fixing the hero so the penalty band stacked under the ice, I added:

    @media (max-width:560px){.heroframe iframe{aspect-ratio:200/136}}

and measured **no change at all**. The rink stayed at 119px. There was already a
`@media (max-width:520px)` rule further down setting `200/128`, and at 390px
**both queries match** — the later one wins.

> **A new rule for a job an existing rule already does does not conflict
> loudly; it loses quietly and the measurement reads as "the fix didn't work".**
> Find the breakpoint that exists before adding one.

Folding the intent into the existing breakpoint (`128 → 140`) is what actually
moved the rink: **119 → 141px**, against the 146 it needs for full width.

**The whole sequence was three measurements, none of them predictable:**

| attempt | rink at 390px |
|---|---|
| band stacked, label on its own line | **103** (−29%), ice letterboxed |
| label inline, one row | 119 |
| + the existing breakpoint raised | **141**, and 389 at 1100 (was 377) |

**And the preview is height-capped** (`100vh; overflow:hidden`), which is the
thing that makes the hero different from the game page: there is no spare room,
so whatever the band takes comes **straight out of the ice**. On the game page
the band cost the rink nothing because the page scrolls.

**Letterboxing reads as a SMALLER rink, not a tighter one.** At 343×103 the svg
keeps its aspect and centres, so white space appears either side — the rink
appears to shrink rather than to be cropped, which is the worse of the two.

---


## ⭐⭐⭐ 2026-09-11/14 — A PHONE IS NOT A SMALL LAPTOP, AND IT COST TWO FINDINGS

**Both were correct at 1400 and wrong at 390, with the whole suite green.**

**1. The double tap that stepped away from the goal it had just opened.**
Tap-to-play shipped with a double tap to step; on a 390px touchscreen a double
tap on a goal label left the highlight SHUT and moved the replay back one play.
The identical gesture at 1400 was right. **The cause is not in the handler
chain:** `openClip` SCROLLS the section to centre, so by the second tap the page
had moved and the finger was over the ice — the `dblclick` that followed carried
a target the door never sees, and no `stopPropagation` inside the door can reach
it. A door that opens now raises a flag and the ice lowers it on every first
press that reaches the ice.

**2. Every type size on the landscape phone was the laptop's.** Score 28.8px in
both, buttons 13.28, caption 13.12; the board came to 0.57 of the rink's height
against 0.31 on a laptop. U11's own repair had replaced a rem constant with a
`vw` clamp and **assumed viewport width IS element width** — in landscape the
viewport is 844 and the board sits in a 230px column. See
[[mobile-landscape-ruling]].

> **Measure the claim at the viewport the claim is about.** Both orientations,
> both sizes, every time — and the fake DOM can see neither.

⭐ **AND THE DESIGN QUESTION WAS SETTLED BY A PROBE BEFORE A LINE WAS WRITTEN.**
Whether to hand-roll a 250ms double-tap window (what every video player does, and
a quarter-second of lag on the COMMON action) was decided by measuring chromium
on a touchscreen context and with a mouse — both produce exactly
`click detail=1 → click detail=2 → dblclick detail=2`. **There is no lag in the
shipped gesture because the platform was asked instead of assumed.**

# 2026-08-20 — two ways of looking at the wrong thing

## ⭐ I READ A FOUR-DAY-STALE SCREENSHOT AND NEARLY REPORTED IT

`tools/pixels.sh` writes into `/tmp/rtg-pixels/shots/`, a directory that
**accumulates**. It refreshes `page-*.png` and `hero-*.png`; `game-*.png` were
ad-hoc from an earlier session. I opened `game-390.png`, saw no penalty box and a
faceoff label, and started reasoning about a regression that had been fixed four
days earlier.

**Check the mtime before you trust the pixels.** A screenshot directory is a
cache, and this one has no invalidation.

## ⭐ AND THEN I CHECKED THE WRONG PERIOD, AND "IDENTICAL" WAS CORRECT

Verifying the as-played flip in a browser, I compared period 2 in both modes and
got **identical** — nets in the same place, arrows the same. It looked like the
flip had not run.

It had. The **unit fixture** (`rich.json`) is `{1:left, 2:right, 3:left}` so it
flips in period two; the **game under test** (CAR @ VGK) is
`{1:right, 2:left, 3:right}` and flips in one and three. Period two is the one
that genuinely does not move for that game, and I had picked it because it was
the period my *fixture* flips.

**A sample's shape is not the population's.** The fix was to stop spot-checking
and walk every frame, grouped by period: 91 and 86 rotated in P1/P3, 97 unchanged
in P2, and **0 frames moved anywhere but the exact 180°** — which is also a
stronger claim than any single frame could have made.

## The measurement that turned a feeling into a decision

Kevin: the `ATTACKS →` arrows are *"rather hard to read… yet I don't want it to
be too overwhelming."* Measured before agreeing: **10.08px, weight 400,
contrast 5.37:1 — which PASSES WCAG AA.** So it was never a contrast problem.
The hierarchy was upside down: the smallest text on the board (beside a 35.2px
score) was carrying the one fact that now changes every period.

**And the fix I wanted was killed by measurement.** Colouring the arrow with the
team's own colour would bind it to the badge above it — but **7 of 33 club
colours fall below 4.5:1 on this white board and 6 below even the 3:1 large-text
floor**: BOS and PIT at 1.73 and 1.79, VGK at 2.79 — the club in the screenshot
that prompted the whole thing. Size and ink instead: 18.4px/700, 17.61:1.
Position already says whose arrow it is.

## Load performance is a pixel question too

A throttled real browser, stopwatch running until `#rink` has content rather than
until `load`: **1.2s on fast 4G, 1.8s on slow 4G, 4.4s on slow 3G.** Numbers no
amount of reading the code produces. See `docs/asset-caching.md`.

## ⚠️ 2026-08-22 — I walked into this file's own documented trap

A local harness measured `game.html` whose `extract/<id>.json` 404'd, so `boot()`
never ran; every layer button was inert and it happily reported geometry for an
**error page**. `tools/pixels.sh` describes exactly this from three earlier runs
and refuses to report unless `#rg` carries the preview class.

**Any ad-hoc harness must carry the same refusal.** Mine now voids the run when
`#rg.className` is empty, and the fix to the setup is one line: copy the
extract in, the way `pixels.sh` already does.

Also this week: the same harness could not click a layer, and I nearly concluded
the CSS was wrong. **Check the page booted BEFORE debugging what it rendered.**

---

## 2026-08-24 — three the DOM could not see, and the cache that fed me last week

⭐ **THE ATTRIBUTE WAS RIGHT AND THE PICTURE WAS EMPTY.** A focus prototype's
probe read `opacity="0.42"` off the DOM and reported success; the page rendered
**no effect whatsoever**. An SVG `<mask>` is **luminance**, and a `<stop>` with
no `stop-color` defaults to **black** — so the mask was black everywhere and
masked the overlay out everywhere. A DOM-reading instrument is structurally
incapable of seeing this class. **Only looking could.**

**The first thing that DID render was absurd** — the veil was filled with the
team colour across the whole rink: a spotlight on a green field, claiming
something ridiculous about everywhere the game is not. Geometry said "pinned
correctly at 16% opacity" both times.

⭐ **A CONTROL THAT REPORTED AN EFFECT IT WAS NOT HAVING, for the second time on
this project.** The focus slider wrote to `layers[1-front]` — the faded-OUT
layer — because `focusTo()` flips `front` AFTER lighting the back one. Kevin
reported *"I can't tell the difference at 0 or 60%"*, which **reads as a verdict
on the idea and was a verdict on one line.** Verified after: 0→0, 16→0.16,
60→0.6. **When someone says a control does nothing, test the control before you
believe the design finding.**

⚠️ **AND `tools/pixels.sh` HAD A CACHE WITH NO INVALIDATION — now fixed.**
`[ -s "$WORK/$d" ] || curl` fetches only when the file is ABSENT, in a scratch
dir that survives for weeks. A D10 probe reported "0 rows marked" on both
surfaces against a `catalog.json` from **eight days earlier** — before D1
shipped, so zero `u` flags and the game under test was still refused. **The fix
looked broken and was not.** It now always re-fetches; three files at ~450 KB is
under a second and correctness beats it. *(Asked and answered: nothing else
believed about the site's appearance came from the stale window — the D9
screenshots were re-checked against the live catalog, and the C1/B2 geometry is
CSS, which a catalog cannot move.)*

**A demo's own control has to be held constant too.** A gaps prototype claimed
*"every mode runs at identical frame timing"* while the baseline arm raced **34
events in 2.4s against 2** — it returned immediately and let a 60ms timer
schedule the next frame. A comparison whose two arms differ in the variable meant
to be held constant proves nothing and reads as proof.

## ⚠️ AN ARTIFACT URL IS KEYED TO THE FILE PATH, NOT THE CONTENT

**2026-08-25: I silently destroyed the D9/D10/U1 audit CHENG was reading.** Both
pages were written to `scratchpad/review.html`; publishing the same path
redeploys to the SAME URL, so the new build-review replaced *"Passed on the Wrong
Evidence"* at `4ff94da6-…`. Kevin and CHENG both noticed before I did.

⭐ **CHENG'S SHARPENING, AND IT IS THE REAL LESSON: publish and replace are two
operations that return IDENTICAL results.** A destructive action reported as a
success — the fourth instance in this project of *the failure state renders
plausibly*, beside the D8 mirror gate and the clamped deep link.

⚠️ **A FILENAME RULE DEPENDS ON REMEMBERING, WHICH IS THE THING THAT NEVER
HOLDS.** The instrument version, and it costs one command: **`ls` the intended
path before writing it.** The file existing IS the warning that a URL already
belongs to it. Second check: the returned URL should be one you have never seen
when you meant to create.

Name files after the page anyway (`ten-second-hero.html`, not `review.html`) — a
new path is the only way to get a new URL, and a reused path the only way to lose
one.

✅ **AND IT IS RECOVERABLE** — the `Write` tool call is in the session `.jsonl`.
Scan for the `tool_use` whose `input.file_path` ends in the name and pull
`input.content`; it came back byte-identical (24,314 bytes) and republishing to
the original path restored CHENG's link. Do that BEFORE writing anything else to
the path, because only the transcript has it.

## 🚫 AND CHENG CANNOT READ A `claude.ai/code/artifact/...` URL AT ALL

**Permanent, not a sharing setting.** The page loads its content client-side
behind auth he does not have, so he gets the title, `og:image`, and *"Content is
user-generated and unverified."* Sharing does not fix it. ⭐ **The channel that
works is the REPO** — his words: *"push it to the repo and give me the filename.
I clone every time anyway, and that path lets me check claims against the code
rather than reading prose about it."* So a review for CHENG is `docs/<name>.md`
on a pushed branch, with **file:line references he can check**, and every one of
those verified before pushing — half of mine were stale from my own edits.
Artifacts are for KEVIN; inline prose is the other channel he named.

## 2026-08-25 — FOUR MORE, AND KEVIN FOUND THE ONE THAT MATTERED

⭐ **THE CAPTION WAS SITTING ON THE PENALTY BOX AND I HAD LOOKED AT THAT RINK
TWICE.** `.caption` was `position:absolute; bottom:14px` inside `.rinkbox`, which
CONTAINS the penalty box — 58px of overlap on the game page at both widths,
267×20 on the hero. **Kevin found it in a screenshot; I had shot the same rink
twice that hour and only ever measured the slot.** *Looking at a page is not the
same as looking at the WHOLE page* — I had narrowed to the thing I had just
built. Pre-existing, and my goal-ending hero loop made it fire every cycle.

⚠️ **MY OVERLAP PROBE REPORTED `overlaps: []` AGAINST A SELECTOR I GUESSED.**
`.pbox, .penbox, [class*="pen"]` matched nothing, so the check found no penalty
box at all and reported clean. **A probe that cannot find its subject reports
innocence.** Make the probe fail loudly when the subject is absent — the fixed
version returns `{NO_PENALTY_BOX: true}` rather than an empty list.

⚠️ **`readthegame.co/game.html` RETURNS 308** — Cloudflare Pages strips `.html`.
Without `curl -L` you get an EMPTY BODY and every grep returns 0. I briefly
concluded the arrivals had not deployed. **Check the status code before believing
a count of zero.**

⚠️ **I READ A THREE-HOUR-STALE SCREENSHOT AGAIN** and concluded a shipped fix had
not landed. The shots dir is still a cache with no invalidation. **Check mtimes
against `date` every single time** — this is the second session it has cost.

✅ **AND THE FIX THAT WORKED: don't wrap what the layout depends on.** The
obvious repair was a `<div>` around the `<svg>` so the caption anchors to the
ice — and `app.css` warns in capitals against adding anything to `.rinkbox`,
because it becomes `display:flex` in preview and `#rg.preview .rinkbox svg` needs
the svg to be a DIRECT flex child. The penalty box row's top edge IS the bottom
of the ice, so `bottom:calc(100% + 6px)` inside it is the same place with none of
the risk. **Read the warning that is already in the file.**



---

# 2026-08-25 (later) — ONE WIDTH IS A FACT ABOUT ONE WIDTH

⚠️ **I MEASURED THE SCOREBOARD AT 390 AND REPORTED "NOTHING OVERFLOWS".** Kevin
photographed his phone against a laptop camera to show me it did. He was right:

```
320   OVER the card by +61.7px   page scrolls sideways
360   OVER by +24.9px            page scrolls sideways   ← the deploy gate's own width
375   OVER by +11.1px
390   ok, −2.7px                 ← the only width I checked
```

⭐ **AND 390 WAS NOT EVEN "FINE" — it is the first width where the overflow stops
being VISIBLE.** The content had already eaten all 18px of the card's padding
there. I reported clearance to the BORDER while it was 16px past the PADDING.
`src/app.js` says the lesson in a comment about this very page: *a margin that
survives one viewport is a constant that drifts with the next one.*

⭐ **A 287px FRAME IS NOT A 287px DEVICE.** The phone re-flow (`max-width:520px`)
was inherited by the HERO, whose frame is 287px, and its chrome went to 83px of a
184px frame against its own gate's one-third limit. **The hero never had the
defect** — `#rg.preview .atk` is hidden and `#rg.preview .mid` is already
`min-width:0`, so 322px was never demanded of its card. Scoped to
`:not(.preview)` rather than re-tuned.

⚠️ **AND MY FIRST FIX MOVED IT THE WRONG WAY** — I scaled the preview's padding
with `min(Xvw,today)` and 79px became 83px, because the preview runs with Corsi
ON, so `.mid` carries the control bar; height that sat *beside* an 80px team
stack **adds** as its own row. I had treated a LAYOUT problem as a TYPE-SCALE
problem, which is the substitution CHENG had warned about one level up: scale is
the safety net under a layout that fits, never the mechanism that makes it fit.

## ⭐ COUNT THE VARIANTS, DO NOT JUDGE ANY ONE OF THEM

Kevin: *"it looks like we have 3 different scoreboards now"* — none in the hero,
an arrow on a phone, a word and an arrow on a laptop. ⭐ **Not one of those three
differences was ever a decision about what a reader needs; each was a SPACE
BUDGET.** The commit that introduced the indicator says so itself: *"Hidden in
preview, where the board already has a size gate."* He removed the whole thing;
the board is now the same height at every width, which is the real test of *one
object, one rendering*.

## `tabular-nums` DID THE JOB MONOSPACE WAS THERE FOR

`#rg .sc` was `ui-monospace…2.2rem` so the digit would not reflow when the score
changes — and `font-variant-numeric:tabular-nums` **was on the same rule the
whole time** and already guarantees that on a proportional face. The family was
never load-bearing. Dropping it bought a scoreboard numeral instead of a 21px
terminal oval at no cost to the reason it was chosen. ⚠️ The *dotted* zeros in my
captures were this Linux box resolving `ui-monospace` to DejaVu Sans Mono —
Kevin's phone showed plain ovals. **The dot was my instrument; the narrowness
was real.**

## ⚠️ CHENG'S SCREENSHOT FINDINGS: GOOD COORDINATES, BAD MECHANISMS

Across three rounds his *diagnoses* did not survive checking — the 0/0 bar
(already fixed, not reproducible under its own conditions), text near the net
(`svgText: []`, zero text nodes; it is the away goalie's outlined glyph at 7px),
the cut-off Play button (82px ABOVE the fold), "renamed to Play" (**twice**; the
label is `i<0 ? … : …`, three states of one function), 40% of the screen (26%).
**But the coordinates keep being useful** — the goalie really is mush at 7px, the
scoreboard really had 2px of slack, the game page really has no thesis.
**Treat a CHENG screenshot finding as *look here*, never as *here is what it
is*.** His non-screenshot work has a much better record.

---

## 2026-08-26 — ⭐ A NEW DEFECT CLASS, NAMED: **CSS that is individually valid
## and situationally wrong**

The below-the-rink rebuild shipped **three** of these, and all three had valid
markup, valid rules, and a fully green suite. CHENG's framing, adopted: *the
suite has never been able to see this class, `pixels.sh` and Kevin have caught
every instance, and it is worth accepting as a permanent property rather than a
gap to close.*

⭐ **AND THE TRIGGER IS SPECIFIC ENOUGH TO BE A PROCEDURE: two of the three fired
because an element MOVED BETWEEN CONTAINERS.** Any change that relocates a node
gets looked at, not reasoned about.

1. **A shape rule scoped to the container.** `#rg .legend i{border-radius:50%}`
   — the marks moved into the layer rows and came out as **squares**. *A shape
   rule that lives on the container rather than on the mark stops applying the
   day the mark moves*, which is exactly what a redesign does.
2. **`auto` in a PER-ROW grid.** Each `.lrow` is its own grid, so an `auto` mark
   column sized itself per row: the two layers that draw no mark had their names
   sit left of the three that do. ⚠️ **The comment beside it claimed the
   opposite, in as many words** — the reasoning for keeping the cell was right
   and the implementation of it was not. *A comment that was true when written
   became a lie without being edited* (CHENG).
3. **A `<b>` became a FLEX ITEM.** `#rg .legend>span{display:flex}` turned *"the
   puck was **stopped**"* into three flex items — text, `<b>`, text — and the
   emphasis flew to the far right of the row. Fixed by giving the label its own
   element so the flexing is between the swatch and the label, not between the
   words.

## AND THE OTHER TWO THINGS ONLY LOOKING FOUND THIS BUILD

- **Five does not divide.** A `repeat(auto-fit,minmax(290px,1fr))` grid of five
  cards leaves a third of the last row EMPTY at every width where the column
  count does not divide five — and *a `1fr` track holds its width whether or not
  anything is in it*, so the hole is structural. `flex:1 1 290px` lets the last
  row grow into the space. **A grid is the wrong tool for a list whose length is
  not a multiple of anything.** Kevin's laptop screenshot found it.
- **Things floating in the gap between two blocks.** The game line was centred in
  its own whitespace while everything else was left-aligned under a heading;
  Kevin and CHENG independently read it as adrift. Both fixes were the same move:
  anchor it under the heading it belongs to.

## MEASURING AT MORE THAN ONE STATE

`tools/pixels.sh` screenshots `index.html` only. For the game page a local probe
against `/tmp/rtg-pixels/site` is the pattern — and **remember to export
`LD_LIBRARY_PATH` to the scratch libs, or chromium dies on `libnspr4.so`.**
⭐ **Measure BOTH visitor states.** A first visit carries the greeting and the
*why add a layer* block; §1's production baseline was a returning visitor and the
local run was a newcomer, and differencing them would have been a fiction. Set
`localStorage['rtg.seen']` in an init script to get the returning state.

## ⚠️ 2026-08-27 — 390 IS NOT A TEST, and the fifth container defect

**I shipped a side-scroll at 360 and the deploy gate caught it.** Legend entries
were `white-space:nowrap` so a swatch could not be orphaned from its name: **362px
of content in a 345px layout viewport.** Every measurement I had taken was at
**390**, where it fits.

⭐ **When a block's content is text of unknown length, 390 is not a test.** The
gate measures 360 into a 345 layout viewport; that is the width to measure at.
And the swatch could not be orphaned anyway — `<i></i><span>` has no whitespace
between them, so there was never a wrap opportunity after the mark. ⭐ **A layout
that needs `nowrap` to look right is one font away from overflowing**, and the
unit suite cannot see a font — so the pinned rule is *nothing here is
unbreakable*, which IS checkable at build time.

Related: the same pasting bug produced a **1,166px line inside a 390px phone**,
because the legend's markup has no whitespace between entries; inline boxes with
nothing between them offer no wrap opportunity at all. Joined with ` · `.

**FIFTH INSTANCE of CSS that is individually valid and situationally wrong**, and
the first caught by a probe printing a distance rather than by looking:
`grid-area:game` on a board with no `grid-template-areas` (above 520) resolved to
lines that do not exist and dropped the game line **178px down a 159px card**.
The trigger is unchanged and now reliable: **an element that moves between
containers, or a container that changes shape at a breakpoint.**

⚠️ **And a probe told me the truth I did not want twice**: the board took FOUR
heights across one game (117/161/195/213 at 390), and badge y-offsets varied —
both invisible in a screenshot of one frame, both obvious in a sweep that prints
the SET of values across every frame. **Sweep and print the set, not the sample.**

## 2026-08-27 (second half) — THE GATE AND THE PROBE WERE LOOKING AT DIFFERENT GAMES

⚠️ **THE DEPLOY GATE WENT RED ON A PAGE THAT PASSED EVERY LOCAL MEASUREMENT**,
and it was right. It renders `read-the-game.html` — the REFERENCE game, inlined
— while every local probe was on `game.html`, which fetches a different game. A
fixed-height box is sensitive to exactly one thing, STRING LENGTH, and the two
games have different strings: *"Most recently: Offside"* against *"Most
recently: Goalie stopped play after a shot on goal."* ⭐ **A local harness that
renders a different document from the gate is not a check on the gate's
subject.** It now renders both.

## ⭐ A FIXED HEIGHT IS A MEASUREMENT, AND I GUESSED IT THREE TIMES

`--lboxh` went 74 → 96 → 118 → **120**, and only the last was measured: release
the box to `height:auto`, sweep six layer states × three widths × two games,
take the worst case. The natural heights were **94 / 96-104 / 109 / 120**, so
120 is a worst case and not a round number.

⚠️ **AND THREE OF THE FOUR CLIPPING DEFECTS WERE NOT THE SENTENCE.** Twice I
shortened copy that was never the problem. It was:
* **the centre LABEL wrapping** — `ATTEMPTS THAT NEVER ARRIVED` at 209px in a
  293px box, taking row one from 26px to 30px
* **the FIGURES** — `22 of 22` is four times the string a count is, so two of
  them plus the label overflowed at 360 while the sentence fitted
* and once, genuinely, a sentence whose length is DATA (goaltender names)

## ⚠️ THE BOX ATE THE HERO, AND THE STYLESHEET HAD ASKED IN CAPITALS

`.rinkbox` becomes a flex COLUMN in preview, so a block added inside does not
stack under the rink — it becomes a flex SIBLING and eats the ice. **70px of a
90px ice at 390 on the front door; 168px after the rule.** The comment there
asks anything added inside to answer that question. The answer came from looking
at the hero, not from reading the comment.

## ⚠️ AND A BUTTON REPORTED `visibility: visible` WITH A 0x0 BOX

`#work` still carried `#rg.corsi #work{display:inline-block}` from when it
belonged to one layer, so it was `display:none` under the other four. Found by
trying to CLICK it in a real browser. ⭐ **A visibility check cannot see a
display rule** — Playwright's "element is not visible" was the only instrument
that could. Its first row was also **8px** tall against this project's own 44px
touch floor.

⭐ **AND THE CHIP COUNTS COST ZERO ROWS** at 360, 390, 700 and 1100 — measured
before committing to them, because the selector row had already been squeezed
once. The chips carried `min-width:124px` against a 118px longest label, so the
numbers landed in headroom that already existed.

---

## 2026-08-31 — THE WORK-PANEL OVERLAY: THREE DEFECTS, 840 GREEN TESTS, NONE VISIBLE

Kevin's idea and his verdict: *"it integrates the work into the UX, as opposed to
a kinda bolt-on at the bottom of the page."* Every defect below was found by
looking; not one was reachable from the DOM.

1. ⭐ **"COVERED" IS NOT "HIDDEN".** The panel is opaque and painted over the
   rink, so it read as correct. At 1100 the card is 523, the panel 366 and the
   ice 373 — **a 7px stripe of rink showed below the panel**, an arc and three
   face-off dots, reading as a fault. Fix: `visibility:hidden` on the svg —
   **never `display`**, which collapses the card the panel is positioned inside,
   reintroducing the exact shift the change existed to remove.
2. ⭐⭐ **A VARIABLE THAT LOOKS LIKE THE CARD'S PADDING WAS NOT IT.** I inset the
   overlay by `var(--rinkpad)` (10px) — but **U11 overrides the card's HORIZONTAL
   padding to 2px below 520px** while `--rinkpad` stays 10. So the layer box
   behind it showed **8px of itself down each edge** (the red 48 and blue 59).
   Fix is a RELATIONSHIP: `inset:0 0 auto 0` positions to the padding box, so the
   overlay is at least as wide as any flow child at every breakpoint, forever.
   *Same family as U11's own guard asserting the margin equals the padding.*
3. ⛔ **BLOCKING: the panel could be opened and not closed.** `Hide the work`
   lives in `.lbox`, which the overlay covers. At 390 the panel is ~655px over a
   314px card. **Every DOM assertion about that button passed** — it existed, was
   labelled correctly, still fired. It was invisible.

⭐ **AND THE CLOSER'S TWO WRONG HOMES ARE BOTH GENERAL.** Built into a markup
string it was unreachable: the fake models elements by id and gives them no
`querySelector`, so three tests went red AND the app threw. **A control only a
browser can wire is a control only a browser can catch breaking** — static, with
an id, wired once at boot. Then, absolutely positioned over the panel, it printed
straight through the heading; clearing it would have taken a `padding-right`
agreeing with a button width, a constant tracking a constant. **A float reserves
its own space, so the two cannot disagree.**

⚠️ **AND MY OWN PROBE WENT STALE INSIDE ONE SESSION.** `probe6.mjs` selected
`.work .wx`; the closer moved to `#workClose` and the probe timed out. **It was
the probe, not the page** — check that before believing a red probe, the same way
this file already says to check mtimes.

**The probe pattern that worked**, when `tools/pixels.sh` (index.html only) is the
wrong instrument: stage a fresh `src/game.html` into a scratch dir, strip the CSP,
rewrite the origin to relative, `curl` the exact extract, `python3 -m http.server`,
and run a custom playwright script from `/tmp/rtg-pixels` (where the module lives)
with `LD_LIBRARY_PATH` exported. **Rebuild every time** — the tool's own oldest
lesson.

⭐ **THE MOST USEFUL PROBE ASKED "WHAT IS STILL PAINTING OUTSIDE THE PANEL?"** —
enumerate every descendant of the card, skip anything hidden or inside the
overlay, and report whatever extends past the overlay's rectangle. It found the
8px edges immediately, and afterwards proved the fix with **`total: 0`**. *Ask a
probe for the SET of violations, not for a yes/no about the one you suspect.*

---

## 2026-08-31 — the scoreboard pill, and three things only a browser knew

⭐⭐ **THE FREE SPACE IN A LAYOUT CAN INVERT BETWEEN TWO WIDTHS.** Kevin said the
power-play pill belonged in the scoreboard's empty bottom-centre. He was right at
**1100** — `.mid` is a 150px column the clock ink fills exactly, with ~36px of
empty band **below** it and **0px** spare beside. At **390** the board restacks
(`grid-template-areas: "game game" "away home" "state state"`) and `.mid` becomes
the full-width `state` row: **167px spare BESIDE the clock and nothing below.**
So *"bottom centre"* is a desktop description — at 390 the bottom centre **is**
the clock. A positioned badge would have looked right on a laptop and printed
through `PERIOD 1 · 11:17 LEFT` on a phone. Inline content of `.gs` plus one
override at ≤520 gets both, and the board height is **identical lit and dark**
at both widths (151/151 and 159/159).

⚠️ **`min-width` IS A FLOOR, NOT A CAP.** `#rg .mid{min-width:150px}` did not stop
the middle column widening **150 → 343** and eating both team columns when the
pill sat inline at 1100.

⚠️ **A STRAY `*/` FROM MY OWN COMMENT EDIT SWALLOWED A WHOLE RULE.** The parser
ate `#rg .ppill{...}` as part of a bogus selector and `display` computed as plain
`inline` — while every test stayed green. **Read the computed style, not the
stylesheet you think you wrote.**

⭐ **AND A MAX-WIDTH THE BOX EXCEEDS IS THE MOST CONVINCING KIND OF WRONG.** The
caption pill overflowed a 320px viewport with `max-width:92%` **applying** —
computed width 294px in a 316px card — because the element is `content-box` and
15px of padding each side sits outside the cap. Three declarations had to be true
together and each hid the next: not `flex-wrap` (text wants a line box, not a
flex line — it folded into a 160×148 column), `width:max-content` (an abspos box
at `left:50%` shrink-to-fits into **half** the card), and `box-sizing:border-box`.

⚠️ **I NEARLY "FIXED" A GLYPH THAT WAS FINE.** 🛡 rendered as tofu in headless
Chromium — and so do 🚨 and ⛔, which have shipped for months. **This container
has no emoji font; emoji rendering cannot be checked here at all.** Kevin
confirmed the shield renders on his machine.

⭐ **AND A THING THAT IS CORRECT BECAUSE OF WHERE THE PLAYHEAD HAPPENS TO BE IS
NOT CORRECT.** The pill measured 0×0 in the homepage hero — because that hero's
loop currently sits on even-strength frames. The opening frame is DERIVED (`hl`)
and moves whenever the archive does. It joined `.pens` in the preview hide list.

---

## 2026-08-31/09-01 — the rule diagrams, and three things only a picture showed

⭐⭐ **THE RINK IS GEOMETRY AND EVERY TOKEN IS ANNOTATION.** Lines, spots, boards,
nets and the slot region are real things and must scale with the crop — that is
what makes the diagram and the replay one rink. A dot standing for a player is a
legibility choice and must be a constant number of **pixels**. Sized in rink
units the goaltender token was **8.8 feet across beside a 6-foot net**, on all
four pages already shipped: invisible on the full sheet, obvious the instant one
figure zoomed in. Now measured: badge 15.9px / token 15.2px on all five, whatever
each frames — and the non-vacuity condition for the test is **two different
crops**, not a headcount, because at one crop the two sizing rules are
indistinguishable.

⚠️ **I DESCRIBED A BUG FROM THE WRONG WIDTH AND CONTRADICTED KEVIN.** He reported
the hero's caption pill "in the middle of the rink"; I measured 390, found 95.8%
up the ice, and said it sat near the TOP — implying he had mis-described it. He
had not: on his desktop the same 136px offset over a 363px-tall ice lands
**mid-rink (34.2%)**. One absolute offset, two ice heights, two bugs that look
nothing alike. **Measure the width the report came from.**

⭐ **AND THE EXISTING PIXEL GUARD COULD NOT HAVE SEEN IT.** `deploy.yml` already
measures that pill in a real browser — *"the pill clears the layer box"* — and was
green throughout, because that is a claim about the mode that HAS a layer box.
The preview hides it. The probe now loads two preview frames at both real hero
sizes; verified locally against both builds: `HERO 96 34` → `HERO 3 1`.

⭐ **A LIT LINE MUST BORROW THE COLOUR OF THE LINE IT EXPLAINS.** Icing's first
build lit the centre line and a goal line — both red — in the blue used for
offside. To a novice that reads as "blue line", the one thing icing is not about.
No test could have caught it; nothing had claimed the highlight had a colour to
get wrong.

⭐ **A PAGE OPENS ON FRAME ZERO UNLESS YOU MAKE IT NOT.** A screenshot caught the
first figure at the loop's start: every token sitting on its own ghost, both
arrows pointing at empty ice. Not a bad screenshot — what every reader saw at
load. An `animation-delay` with **no fill-mode** fixes it for free, because until
the delay elapses an element uses its own styles, and its own position is the end
of the story.

⚠️ **THE BADGES WERE DRAWN ON TOP OF THE NET THE FIGURE WAS ABOUT** (empty net),
and **the "DIAGRAM" stamp collided with something on three of the five figures.**
Annotation placement is a looking problem, every time.

⚠️ **AND I RAN OUT OF LOOKING.** Image reads were refused late in the session
(too many in one thread), so the final figure was verified by GEOMETRY — computing
whether any badge overlapped a net — rather than seen. That turned into a real
test and is better discipline, but **the empty-net figure has not been looked at**
and is the first thing to open.

---

## ⭐⭐ 2026-09-04 — THE PUCK FLEW IN FROM OFF THE RINK, AND A BUG REPORT HAS TWO HALVES

Kevin, watching the deployed replay: *"the puck… it now looks like it's coming
from off the rink onto its current event, then again from off the rink to the next
spot of the next event, which is different than it was pre-refactoring."* Then,
talking himself out of it: *"maybe it's been that way… maybe it's Freudian."*

⭐⭐ **HE WAS RIGHT ABOUT THE SYMPTOM AND WRONG ABOUT THE CAUSE, AND BOTH HALVES
HAD TO BE CHECKED SEPARATELY.** Against the build immediately before the
decomposition, booting both bundles through the same fake: the `#puck` markup is
**identical on 269 of 269 played frames**, the stylesheets are identical, and the
pace is **identical frame for frame**. Nothing changed. ⭐ *Do not accept the
attribution with the observation, and do not discard the observation with the
attribution.* Had I taken "maybe it's Freudian" at face value the defect would
still be live.

**THE MECHANISM, worth keeping as a fact: on an SVG element a CSS `transform`
resolves against the VIEW BOX with an origin of `0 0`**, not the element's own
box. So `transform:scale(2)` on a circle at (80, 64.5) starts it at **(160, 129)**
— past the right boards and below the ice on a 200×85 rink — and animates it
diagonally into place. `.jump` is applied on **269 of 269 played frames**.
`.ev`, `.fig` and `.gk` all set `transform-box:fill-box;transform-origin:center`
and pop about their own centres; **the puck alone was missed**, one element out of
four in the rule saying what a scale is measured from.

⛔ **AND THE GOLDEN RENDERED-DOM WALK CANNOT SEE A STYLESHEET AT ALL.** It pins
`class="puck jump"` and is perfectly satisfied. This is the CSS blind spot this
file has always described, arriving in a project that had just spent a day adding
instruments — **sixth instance of the instrument covering less than its name
implies, and the first found by a viewer rather than by a check.**

✅ **The gap now has an instrument, and it is derived rather than listed.**
`test/css-transform-box.test.js`: any SVG element carrying an animation whose
keyframes scale must also carry a class that sets `transform-box:fill-box` — read
from the stylesheet AND from the classes a played walk actually renders.
⚠️ **Its first draft compared selector STRINGS and flagged nine rules of which one
was real** (every mark is `class="ev fig att cur a pop"`, covered by `#rg .ev`).
A checker that flags everything is as useless as one that flags nothing, and it
would have buried the genuine defect in noise. **The question was about an
ELEMENT, so it had to be asked of the classes an element carries.**


## ⭐⭐ 2026-09-05/07 — KEVIN FOUND THREE THINGS NO INSTRUMENT HERE COULD

**The puck** (see above) · **the four-way vocabulary split** on the front door —
*"at the top we say add metrics after, then the header says Watching, and then we
call them layers"*, and a minute later the one using both at once, *"Choose a
metric under Watching"* · and **"no change in dimensions"**, which corrected a
claim of mine: I measured `.figpick.sit` at 141px and described it as a cost
against the layer box. Measured properly, **the layer box is 120px constant and
NOTHING above the picker moves** — rink, lbox, transport, scrubber all at the
identical y. The page simply gets longer at the bottom. ⭐ **Second time in a week
I reported one element's number as a fact about the page.**

## ⚠️ AND THE BROWSER HARNESS LIED ABOUT ITS OWN VIEWPORT
Playwright's **JS** API takes `viewport`, not `viewportSize` (that is the Python
name). Passing the wrong key is silently ignored, so two "390px" readings were
actually at the 1280 default. ⭐ **Print the viewport width you measured at, from
inside the page** (`document.documentElement.clientWidth`) — an instrument that
does not report its own settings cannot be caught getting them wrong.

⭐ **What it settled, once it was right:** the strength control is `display:none`
/0px in the base view and `display:flex` 339×141 at 390 / 896×46 at 1100 with a
layer on, no side-scroll — and **a deliberate park is indistinguishable from an
accidental burial in the source.** The slot tip has a third rule parking it on
purpose; only the browser said so.


---

# ⛔⛔ 2026-09-07 — LOOKING KILLED A FIX THAT WAS RIGHT ON PAPER

The ends note sat ABOVE the rink card with `:empty{display:none}` — 0px when
silent, 59px when not — so on **15 of 269 frames it shoved the drawing down 69px
at 390 (50 at 1920)**. The rink had two y-positions during an ordinary game and
nothing could see it: the suite has no pixels and the golden walk cannot read a
stylesheet.

I proposed `position:absolute`, **quoting the page's own precedent correctly** —
the work panel's comment says *"the flow is untouched and nothing below the card
moves when it opens, which is the shifting Kevin asked to avoid."* True.

⛔ **And wrong here, which only rendering it said.** At 390 the rink is 164px tall
and either note is 56–59px, so the note **blanketed the ice it was a caption FOR**
— and `#iceNote` is a CONDITION, so an entire empty-net sequence, the most
dramatic minute in hockey, played behind a paragraph. Reverted; both notes sit
BELOW the card, which costs no pixels and hides nothing.

⭐⭐ **A PRECEDENT TRANSFERS WITH ITS CONDITIONS. The work panel is a surface a
reader OPENS; these arrive unbidden.** That difference is invisible in the
sentence I quoted and decisive in the outcome.

**After: the scoreboard, the card, the drawing, the active-player line and the
layer box are each at ONE position, zero spread, at 360/390/1920.**

## ⭐ THE MEASUREMENTS WORTH REUSING

A jitter census — every element's distinct y across all 269 frames at three
widths — found **exactly two causes**, and the second was invisible until the
first was fixed: the transport's own height flipping 156↔210 at 390 because the
play button's label changes width (`▶ Play` 76px, `⏸ Pause` 87, `▶ Replay` 95).
⚠️ **I offered `▶ Play` as the fix having measured one of the three states**; the
54px jump merely moved to the same click. `◀ Prev`/`Next ▶` is what actually
killed it — and saved 54px at 360, where the transport was 210 in EVERY state.

**Proving a deletion inert:** the CSS sweep was checked two ways — the effective
rule sets diffed (517→488, **zero added**, every removal naming a dead class) AND
the full page rendered before/after at 390 and 1100, **pixel-identical**. ⭐ Then
looked at anyway, because identical is also what a blank page returns.

## ⚠️ AND READ VISIBILITY WHEN VISIBILITY IS THE QUESTION

Verifying the penalty fix on production I read `#ppill`'s `textContent` and nearly
filed a second bug: the pill *said* "power play" after the goal. **`hidden` leaves
text in the DOM.** Checking computed visibility showed it was correctly dark.
Same family as reading a four-day-stale screenshot: the probe answered a question
next to the one I was asking.

# ⛔⛔⛔ 2026-09-14 — THE LEDGER WAS COMPLETE, THE ASSERTIONS ALL PASSED, AND THE BOARD WAS WRONG

Kevin ruled the page's away/home axis should follow the ice. I enumerated every
away-left/home-right pair, wrote one class (`#rg.hostleft`, derived from the same
`DIR(per)` that places the nets), gave each surface its flip, and wrote a ledger
test naming every pair so a tenth had to be argued in rather than forgotten.

**All 1,269 tests passed. The rendered board was wrong.**

`.tm.a` is `[badge, score]` and `.tm.h` is `[score, badge]` — a hand-written
mirror so the badges sit outboard. Swapping which block is on the left without
swapping the mirror inverts it. The flipped board rendered `1 CAR … MTL 0`
against the unflipped `MTL 2 … 3 CAR`.

> ⭐⭐ **BOTH ARRANGEMENTS ARE INTERNALLY SYMMETRIC, WHICH IS EXACTLY WHY NOTHING
> FAILED.** There is no asymmetry for an assertion to catch. Only *comparing two
> renderings of the same board* shows it, and only a person can do that.

⭐⭐⭐ **THE PAIR I ENUMERATED WAS "WHICH BLOCK IS ON THE LEFT" AND THE DEFECT WAS
INSIDE THE BLOCK.** I anticipated this identical shape for `.counters` and fixed
it in the same edit — because *its* mirror is written in the **markup**, where
reading the builder shows it. The one I missed is written in **CSS four lines
below the rule I had just read**. Same defect, two representations, and I caught
only the one that happened to be in the file I was reading.

> **An enumeration is a claim about a GRAIN.** "Every pair is in the list" says
> nothing about whether the list's unit is the right size. See
> [[mechanize-the-review]] — *a check that tests a narrower claim than it
> announces* — this is that rule applied to the subject rather than the check.

## ⚠️ Same day, same shape, twice more — and both were MEASURED-LOOKING

- **Three of nine pairs never render.** `.cbar`, `.counters` and `.pboxes` are
  `display:none` under **every one of the seven layers**. I found them hidden in
  a first browser pass and **assumed a layer would reveal them**. Switching each
  layer on in turn is what settled it. The flips ship anyway so a revival is not
  born mirrored, and the ledger now asserts they are **still parked** — reviving
  one goes red and says *go and look at it*, which turns the dead assumption into
  a live guard.
- **An occlusion figure for a region I had guessed.** I measured `|y| ≤ 10`
  because that is roughly how tall the net label *looks*; its height is its TEXT
  LENGTH, half of 11.65. The answer moved 3.4% → 1.56%. **A measurement whose
  REGION is assumed is an assumption wearing a number.**

⭐ **The fix that outlives the bug:** `scoreboard.test.js` asserted
`orders.length === 4`. A count cannot say the thing that matters — it breaks on a
second *correct* set of rules and passes a half-applied one. It now asserts the
mirror and its flipped counterpart **cover the same elements**, and a mutation
dropping one side is red.


## ⛔⛔⛔ 2026-09-18 — 1,323 TESTS GREEN AND THE CONTROL RENDERED 20×44 INSTEAD OF 14×9

Goal ticks on the scrubber. Each tick is a `<button>` inside `.transport`, so
`#rg:not(.preview) .transport button` — specificity **(1,2,1)** — claimed them
and beat the `#rg .gtick` I had written, **(1,1,0)**. The ticks silently wore the
Prev/Next buttons' `min-height:44px` and their 10px side padding. **No text check
can see this**: the rule was present in the built page, correctly spelled, and
lost a cascade.

⭐⭐ **SPECIFICITY IS A RUNTIME OUTCOME, NOT A PROPERTY OF THE TEXT.** Grepping
for a rule proves it SHIPPED, never that it APPLIES. The only instrument that
answers the real question is a browser reporting `getBoundingClientRect`.
⭐ **And the fix must win on structure, not on order:** `#rg .transport .gticks
.gtick` is (1,3,0), which beats (1,2,1) on class count — *a tie broken by source
position is a tie the next edit can lose.* Reset the inherited properties (
`min-height`, `padding`) **by name**, because the rule that set them is about a
different kind of button entirely.

⚠️ **MY OWN GREP LIED TO ME FIRST.** `grep -o '#rg \.gtick[^}]*}'` found nothing
and I briefly believed the builder was dropping multi-line CSS rules — `grep`
works line by line and my rule spanned two. **A ruler that disagrees with an
expectation is a claim about the ruler first** ([[verify-inherited-claims]]).

## ⛔⛔ A NATIVE `<input type="range">` CANNOT BE MEASURED OR DRIVEN FROM SCRIPT

Needed the thumb's width, because a range thumb does **not** travel 0→100%: it is
inset by half a thumb at each end, so a tick at a bare percentage drifts by up to
half a thumb — **worst at the very start and end, which is where empty-net goals
live**. Both routes are closed, tried in real Chromium:

- **Synthetic clicks do not move a range.** Dispatching `pointerdown`/`mousedown`/
  `click` at a track coordinate leaves `value` untouched — an untrusted event
  never starts the internal slider drag. *This also bounds what a browser CHECK
  can do: the probe doctrine (dispatch at `elementFromPoint`) cannot drive this
  control at all.*
- **`getComputedStyle(el, '::-webkit-slider-thumb')` returns the INPUT's own box**
  (420px wide), not the thumb's.

So the width is a **named assumption** (`--scrub-thumb:16px`, the platform
default), placed by `f×100% + thumb×(0.5−f)`. ⭐ **Make an unmeasurable constant a
VARIABLE and state the error law**: being wrong by *d* misplaces a tick by
`d×|0.5−f|`, at most *d*/2, zero at mid-game — and clicking never depends on it,
because a tick carries its frame index. Styling the thumb ourselves would make it
a fact; that stayed a one-variable change, declined on Kevin's *"start small"*.


## ⛔⛔⛔ TWICE IN ONE DAY, CC REPORTED A FIX VERIFIED ON EVIDENCE THAT COULD NOT SEE IT — 2026-09-21

**Both times the suite was green, the check was asking a narrower question than it
announced, and CC said "verified live".**

**1 — the layer box that was measuring a hidden box.** `stylesheet-settles` framed the
page at **360x900 — portrait**. Kevin's own ruling (`a1b6f33`, 2026-09-13) hides every
child of `.wrap` but the rotate prompt under `(orientation:portrait) and
(max-width:560px)`, so `#lbox` measured **0x0** and all three judgements passed on the
absence: one distinct height (zero), nothing clipped (nothing to clip), a pill clearing
by exactly 0. The box measurement landed 08-27 and worked; the ruling blinded it; the
move into `tools/browser/` four days later carried the blindness and **unit-tested
`judgeIce` against synthetic numbers, which by construction cannot notice the probe found
no subject.** §7.2 had written that exact rule four days earlier.

**2 — the `hidden` attribute that was inert.** CC hid the puck note on a club page, read
the ATTRIBUTE back out of the DOM, and called it verified. `.opener .pucknote{display:
block}` is an author rule and **outranks the UA sheet's `[hidden]`**, so nothing changed.
`.teams{display:grid}` had the same defect and only LOOKED fixed because the grid is
empty on that page. Kevin, from the live site: *"This text still shows up on the team
page."* ⭐⭐ **The warning was already in that file, ~250 lines above, on `.hero`:
":not([hidden]) IS LOAD-BEARING, NOT TIDINESS … a bare display:grid here would OVERRIDE
it."** Understood for one element while the two rules beside it were a bare
`display:block` and a bare `display:grid`.

⭐⭐⭐ **THE RULE: VERIFYING AN ATTRIBUTE IS NOT VERIFYING VISIBILITY.** Read computed
`display` and a bounding rect, or `innerText` — never `textContent`, which reports hidden
text and said "ON SCREEN" for an element of zero height.

## ⚠️ AND THE PROBE WAS WRONG THREE TIMES BEFORE IT SAID ANYTHING TRUE

Every one of these announced itself as a clean measurement:

1. it pointed at `data.readthegame.co` and hit **CORS** — the page took its "archive
   could not be loaded" branch and never reached the code under test;
2. rewriting `ORIGIN` to be same-origin **changed the inline script's bytes, and the
   hash-pinned CSP refused the whole script** — so it was measuring a dead page that
   still rendered JS-generated text from an unblocked block;
3. `textContent` reported hidden text as present.

⭐ **A browser only helps once the instrument is honest.** The ruler being wrong is the
normal case, not the exception: `tools/css-noop.mjs` was also wrong twice on the day it
was written — it unbalanced the stylesheet after a `@media` block, and it split inside
COMMENTS, inventing selectors like `.js` and `.test` out of prose. `css-parse.test.js`
and `css-orphans.test.js` caught both, which is why neither is counted among the 20.

---

## 2026-10-04 — THE DAY `display` WAS USED AS A PROXY FOR VISIBILITY, AGAIN

⛔⛔⛔ **THIS FILE HAS SAID "VERIFYING AN ATTRIBUTE IS NOT VERIFYING VISIBILITY"
SINCE SEPTEMBER, AND I DID IT ANYWAY, AN HOUR AFTER WRITING A PROBE ABOUT IT.**

Kevin: *"I don't see the 'Show Summary' button."* I ran a browser, read
`display:flex` and a `141x47` box at `(575, 402)`, and told him: *"the button IS
there — I measured it."* The computed `visibility` was `hidden`. The row it sat
in is hidden by `#rg .lbox.empty .lxw{visibility:hidden}` until a layer is
chosen, and `Just events` is the default — so a reader who had just landed had no
route to the summary at all. He named the cause himself before I found it.

⭐⭐ **THE FIELD IS `visibility`, AND BOTH OF THE OTHERS ARE TRUE OF AN INVISIBLE
ELEMENT.** An element with `visibility:hidden` still lays out, still has a box,
still reports `display:flex`. So does one under `opacity:0`, one behind another,
and one scrolled off its own clipping parent. **If the claim is "a reader can see
this", the only honest instruments are computed `visibility`, computed `opacity`,
an intersection with the viewport, or pixels.**

### THE PROBE THAT NOW OWNS IT

`tools/browser/door-row.mjs` samples `#sum` **before any layer is chosen** —
the state a reader lands in, which is the one nobody had been asking about — and
judges `visibility`, whether it has escaped the layer-gated row, its box, and its
label. Four refusals, each with its own unit case.

⛔ **AND ITS CANARY HAD TO BE REWRITTEN THE SAME DAY.** It restored the original
defect declaration for declaration, naming `.lxwe`; that class left with the door
and the injection then moved every remaining door together — no divergence, probe
green, **canary ACCEPTED**. A canary written against an instance dies with it.

### THE OTHER TWO PICTURES THAT GOT PROBES TODAY

- **`tools/browser/summary-marks.mjs`** — the summary card draws a mark per team
  on one rail. ⛔ Two teams tie on a lens constantly, and **two dots at one
  position are ONE dot**: the DOM would report two marks, each at the right
  percentage, in the right colours, while a reader saw one and concluded the
  teams differed. The stylesheet splits them onto different LINES — horizontal
  position, the datum, untouched — and this measures it in pixels. Verified both
  ways: a tie WITH the split passes, a tie WITHOUT it is caught at 0.0px.
- **`.sc` WAS THE SCOREBOARD'S SCORE.** A new chip inherited `font-size:1.8rem`
  and rendered at 28.8px beside a 14.4px label. Kevin saw it; no check could.
  The gate is ownership — a class worn inside `.srows` must be reachable only
  through `.srows` — and its own first version ran green against the collision,
  because the chips are built as an HTML STRING that the fake document never
  parses into nodes.

⭐ **THE ONE-COMMAND HABIT STILL EARNS ITS KEEP:** `grep <drawing-fn> test/ tools/`.
It found that `trackFor` had no check at all on 2026-10-03. The 2026-10-04
version of the same question is **"what does this claim rest on that only a
browser can answer?"** — and the answer today was three different things.


## 2026-10-04 (later) — A TRUSTED PRESS, AND THE BLIND SPOT THAT WAS WRITTEN DOWN

⭐⭐⭐ **THE SUITE AND EVERY PROBE DROVE THE SCRUBBER WITH `input` ALONE, WHICH IS
HALF OF A GESTURE NO HAND CAN MAKE.** A native range reports one tap twice —
`pointerdown=280 input=110 pointerup=110 change=110` — and the page drew the
frame once for each, so a tap played the play twice. Kevin found it from the live
site; nothing here could have.

The limitation was ALREADY RECORDED, in `src/lib/scrub.js`'s own header:
*"synthetic clicks do not drive a native range (an untrusted event never starts
the internal drag)."* It had been read for months as a constraint to live with
rather than as **a list of behaviour no check could reach.** When a tool's
limitation is written down, ask what is UNTESTED because of it.

✅ **`tools/browser/cdp.mjs`** — ~160 lines of DevTools protocol over `node:net`
and `node:crypto`, no dependency. `Input.dispatchMouseEvent` is indistinguishable
from a hand: it starts the internal drag and the control fires its real events in
its real order. It can also hold the pointer down for a stated time, which
matters because the defect lives in the gap between press and release.

✅ **`tools/browser/one-tap.mjs`** — one tap must arrive in ONE BEAT, counted by
`animationstart`. ⛔ **The DOM cannot see this one at all:** the document after
two draws is byte-identical to the document after one. Nor can
`document.getAnimations()` — a 0.28s fade restarted 117ms in is never two
animations at one instant. The START is the only observable.

⭐⭐ **AND CSP DOES NOT BIND THE DEBUGGER.** Every probe here strips the CSP meta
tag from a local copy so its watcher can run. `Runtime.evaluate` needs none of
that: it installed the same listener on **readthegame.co itself** and measured
one real tap on the deployed bytes — 11 animation starts, spread 0ms, one beat.
That is the answer to "a green deploy is not a correct page": the live page can
now be MEASURED, not inferred.

⚠️ **WHAT IT STILL CANNOT TELL YOU:** it presses with a MOUSE. A finger on glass
is a different pointer type, and only Kevin's hands can check that.

⭐ The 2026-10-04 (later) version of the standing question: **what does this
claim rest on that only a real INPUT DEVICE can answer?** — one step past "only a
browser can answer".


## ✅ 2026-10-07 — A RENDERER FOR THE CARD, AND FIVE THINGS ONLY LOOKING FOUND

⭐⭐ **`tools/browser/preview-shot.mjs`** renders the LOCAL build against the LIVE
archive — a different question from `sitecopy`, which copies the DEPLOYED site.
Only one of the two can be asked before a push, and the preview rebuild needed it
three times in a day.

⛔ **THE CARD CANNOT BE RENDERED LOCALLY WITHOUT HELP.** It fetches
`data.readthegame.co` and R2's CORS allowlist is the live origin, so a local
server gets a blocked fetch and the card degrades to *"We have no record of that
game"* — which looks exactly like a broken build. `localise` (shared with
sitecopy) strips the pinned CSP and makes the origin relative.

⛔⛔ **AND A HARNESS MISSING A DOCUMENT LOOKS EXACTLY LIKE A DEFECT IN THE DATA.**
Built with two of the five documents the page fetches, the card rendered every
club row as *"no games yet"*. I spent real time treating that as a possible
regression in a re-derive that had just finished. The per-game club figures live
in `recent.json`; the club names in `teams.json`. **A missing fetch must be a
FAILURE in a harness, never a skip** — sitecopy's own header records this lesson
and the new tool had to learn it again from scratch.

⭐ **WHAT LOOKING FOUND THAT THE SUITE COULD NOT**, all on 2026-10-07:

1. The merged tile's second figure rendered as **body text** — a measurement that
   did not look like one.
2. `.pvtile .pvdoors{margin-top:auto}` applied to BOTH door blocks, so the first
   ate the free space and shoved the second measurement to the floor.
3. **"Los Angeles Kings's"** — a club name ending in s takes the bare apostrophe,
   and more than half of them do. Nothing in the suite could see it; every
   assertion about that line is about the player.
4. The axis tick labelled **"league"** on a player row, where it is the median
   SKATER. A reader would be told the mark is a comparison with something it
   is not.
5. The control diagram's four defects — see [[figure-family-and-scale]].

## ⛔⛔ A PROBE IS A MEASURING INSTRUMENT AND IT CAN BE THE DEFECT — twice in two days

**2026-10-10.** Checking the player block on a SECOND preview, my ad-hoc browser
probe reported `naturalWidth 0x0` for both headshots — bytes that never arrived.
They had arrived: `curl` gave HTTP 200 and 3,692 bytes for the same URL. The
probe **returned as soon as the `<img>` elements EXISTED**, which is before they
load, and the first page I checked had simply been faster. ⭐ *Not loaded yet*
and *never loaded* are different answers and only one is a bug — it waits for
`complete && naturalWidth > 0` now and SAYS SO when the wait runs out.

**2026-10-11.** A deploy failed on code that had passed hours earlier:
`one-tap` called six synchronous elements a double draw because its per-name
rule used `gap > 0` while its sibling rule four lines away derived a tolerance
from the gesture. See [[mechanize-the-review]] #84.

⚠️ **THAT IS THREE INSTRUMENTS-IN-THE-PICTURE NOW**, counting
`captureBeyondViewport` restarting CSS animations. **Before reporting a defect a
probe found, ask what the probe would say about a page that is FINE** — and on a
disagreement between two of your own tools, suspect the newer one.

## ⛔ `page()`'s window size is NOT the viewport (2026-10-17)

`tools/browser/cdp.mjs::page(url, {width: 844, height: 390})` passes `--window-size`,
and headless Chrome gave a viewport of **844×247** — 143px of window furniture. The
bottom fifth of the rink was off-screen and read as "a white band hides the lower
rink and two marks are missing" — a defect that did not exist. And since the landscape
layout sizes the rink to the HEIGHT, every size measured was wrong too (rink 495 vs
510 wide). Fix: `Emulation.setDeviceMetricsOverride({width, height, deviceScaleFactor: 1,
mobile})` then `Page.reload`, and PRINT `innerWidth x innerHeight` before believing
anything. Asking "what would this probe say about a page that is FINE?" catches it:
`elementFromPoint` at 85% of the rink's height returned null.
