# The game page at a laptop's width — two columns, and a rule for what may move

**For CHENG. Kevin, 2026-09-09**, having seen the home page's new fold ship:

> *"I really like the new layout, quite nice. I am wondering if all the game pages
> should have this approach? I realize we'd then have different layouts between
> mobile and desktop but I definitely like the layout on the home page."*

And, on my offer to widen the column first as a cheap interim step: *"I don't
think expanding the rink as an interim step is necessary."* So this is one change,
not two.

**Status: design. Nothing here is built.** `docs/front-door.md` §5.4 is the
shipped precedent and the thing being generalised.

---

## 0. Method

Live `readthegame.co/game?game=2025030414`, real Chromium, **390×844** and
**1900×1065**, read on 2026-09-09. Four states were driven **in the page**: the
base view, the Control layer on, the last frame, and the work panel open. Blocks
were enumerated as *every visible direct child of `#rg .wrap`* rather than from a
list of what I expected to find.

⚠️ **Two limits, stated because they bound what the numbers below can support.**

1. *At the horn* was reached by setting the scrubber's `value` and dispatching
   `input`. That is enough to place blocks and it is **not** evidence about a hit
   path — 2026-09-08's rule, which this document's §6.1 then turns into a
   requirement.
2. **The first draft of this measurement was wrong, by one selector.**
   `querySelector('#rg .zone')` reported the zone disclosures hidden. There are
   **five** `.zone` elements; the first is hidden and **two of them are 900×57 and
   on screen.** ⭐ *A selector that returns one element when the page has five is
   an answer about the first element wearing the name of the group.*

---

## 1. What the page is today

**Every visible direct child of `#rg .wrap`, in document order.** `.caption`,
`.lbox` and `.icenote` are inside `.rinkbox` and so are not rows here.

| | 1900×1065 | | 390×844 | |
|---|---:|---:|---:|---:|
| | **y** | **size** | **y** | **size** |
| `.pagelede` | 88 | 900×24 | 124 | 343×39 |
| `.newcomer` | 124 | 900×127 | 175 | 343×268 |
| `.board` | 267 | 900×121 | 460 | 343×145 |
| **`.rinkbox`** | **400** | **900×550** | **617** | **390×340** |
| `.transport` | 963 | 900×100 | 971 | 343×156 |
| `.sharerow` | 1067 | 900×44 | 1131 | 343×54 |
| **`.pickrow`** | **1123** | **900×65** | **1197** | **343×167** |
| `.lcap` | 1197 | 896×59 | 1373 | 339×118 |
| `.zone zcue` | 1271 | 900×57 | 1506 | 343×57 |
| `.zone znext` | 1343 | 900×57 | 1578 | 343×57 |

### 1.1 Three findings, and the middle one is the reason to do anything

1. **The column is 916px of a 1900px viewport — 48%.** The same unused gutter the
   home page had, and `#rg .wrap` carries the same `max-width:900px`.
2. ⛔ **The layer picker is below the fold at 1900** — y=1123 against a 1065 fold,
   1.05 screens. **That is the control the site's own doctrine hangs on**
   (DOCTRINE §6, *base view is just the game; every metric is an opt-in layer*).
   On a laptop you must scroll to discover that layers exist.
3. **This is not a length problem.** The document is **1,615px — 1.52 screens** at
   1900. Nothing needs deleting. Six blocks and **437px of vertical stack** sit
   under the ice in a window with 984px of empty horizontal room either side.

### 1.2 And on a phone it is the ice that pays

At 390 the rink does not begin until **y=617 — 0.73 screens** — and only **227 of
its 340px** are above the fold. The transport is at 1.15 screens, so **the play
button is off-screen on arrival.** The stack below the ice runs to 664px.

⚠️ **The `.newcomer` block was present on a reload in the same browser context**,
not only on a cold first load. Whatever retires it, a page refresh does not — so
the 268px it costs a phone is not safely a one-time cost. **Observed, not
explained**, and it is a separate question from this one.

### 1.3 What is not on screen at all, named rather than assumed

In all four states, at both widths: `.goalies`, `.whistlepanel`, `.blockpanel`
and `.icenote` are `display:none`, and `.legend` computes to `display:grid` with a
**0×0** box — it renders nothing. Three `.zone` disclosures (`zclip`, `zref`,
`zdisp`) are likewise off. That is the parked block of 2026-08-27 plus the
frame-conditional lines, and **a layout that moves blocks must not quietly assume
these are gone** — they are switched off, and the switch may come back.

---

## 2. Why the home page's answer does not transfer as an artifact

The home page's split is **text left, picture right**, and it works because the
loop there is a *taste*: a 10% narrower rink costs a stranger nothing.

**Here the rink is the product.** A reader watches it for minutes and clicks marks
on it. So the principle transfers — *use the gutter* — and the artifact does not.
The question is not "which half gets the picture", it is **which blocks are
allowed to stop being under the ice.**

---

## 3. ⭐ THE RULE: invariance under playhead movement

CHENG's own chip criterion, applied one level out:

> **A block may sit beside the rink only if its content AND its enabled state are
> invariant under playhead movement.** Anything whose meaning — or whose
> affordance — changes as the game plays stays under the ice.

⛔ **The second clause is CHENG's and it overturns my own answer on the
transport.** My draft moved it on the grounds that its labels never change. They
do not; **its affordances do.** `◀ Prev` and `Next ▶` are *disabled at the ends of
the game*, which is a function of the playhead and is the readout the pair was
designed around — *the disable at each end is the readout*. So the transport was
never invariant, and a rule that let it move had an exception hiding inside it.

⭐ **And there is a second, stronger argument for the same conclusion: the
transport and the scrubber are one control.** The scrubber shows position, the
transport steps it. The scrubber is unambiguously playhead-dependent and cannot
move, so moving the stepper would **split a control pair across the fold** —
a position indicator under the ice and its stepper beside it, which is worse than
either placement on its own.

It is not a new rule and it is not a preference — it is what this project already
paid to learn. The active-player line was moved **from 479px away to 11–169px** on
2026-09-07 for exactly this reason, and the record's phrasing is *a sentence
belongs beside the thing it is about.* A side column that took the caption would
undo that fix at three times the distance.

| block | changes with the playhead? | verdict |
|---|---|---|
| `.caption` — the teaching pill | **yes**, every frame | **stays** |
| `.icenote` — the active player line | **yes** | **stays** |
| `.lbox` — the layer's running output | **yes** | **stays** |
| `.pens` / `.ppill` — the box and strength | **yes** | **stays** |
| `.board` — score, clock, counts | **yes** | stays (already above) |
| `.transport` + `.scrub` | **labels no, ENABLED STATE yes** — `◀ Prev` / `Next ▶` disable at the ends | **stays** |
| `.pickrow` — the layer picker | no | **may move** |
| `.lcap` — what the active layer counts | no, until the layer changes | **may move** |
| `.zone zcue` / `.zone znext` | no | **may move** |
| `.sharerow` | no | **may move** |
| `.nextup` | no | **may move** |

| `.newcomer` | no — and it survives a reload | **moves** — §7 q4 |

⚠️ **`.lbox` is the trap in that table.** It sits below the ice and looks like
chrome; it is the layer's *output* and changes on every frame. It is also
load-bearing in geometry — see §5.

**What moving gains, arithmetically.** With the transport staying, the movable
blocks are `.pickrow` (65), `.lcap` (59), the two zone disclosures (57 each) and
`.sharerow` (44) — **282px of stack at 1900** — plus `.newcomer`'s 127px from
above the board. The picker's new position has to be **measured after building
rather than predicted**, because moving a block out of the flow moves everything
under it; what the change is FOR is that the picker stops being below the fold.

### 3.1 ⚠️ And "`.newcomer`" is two elements

`document.querySelectorAll('#rg .newcomer')` returns **2**: the first-visit block
(900×127 at 1900, 343×268 at 390) and `.newcomer.nwhy2` — *"Why add a layer?
Because the obvious reading of a game is…"* — which is `display:none` in the base
view and takes a position in the flow once a layer is on, still measuring 0×0.

**So a media query written against `.newcomer` moves both**, and the second one is
a block nobody in this document has looked at. Whatever ships names the one it
means. This is the same finding as §0's, one class over — see §9.

---

## 4. The geometry, costed rather than chosen

`#rg .wrap` is `max-width:900px`. Three column widths, with what each leaves the
rink beside a 340px control column and a 28px gap:

| column | rink column | vs today (900) |
|---:|---:|---|
| 1240 | 872 | −3% |
| 1360 | 992 | **+10%** |
| 1480 | 1112 | **+24%** |

**1360 is the smallest width at which nothing regresses**, which is the number I
would take unless CHENG prefers otherwise: the rink gets bigger, the picker comes
above the fold, and 1480 starts to push the ice wider than the reading measure of
anything beside it.

**Below 1180 nothing changes at all** — one media query, phone untouched, and the
novice test is on a phone.

---

## 5. ⛔ The scar this change walks straight into

`#rg{--lboxh:120px;--rinkpad:10px}` reserves the band under the ice where the
layer box lives, and **`.caption` is positioned off that variable** — the pill
sits `--lboxh + --rinkpad + 6px` from the bottom of the rinkbox. The preview
already had to zero it (`#rg.preview{--lboxh:0px}`) and the reason is written in
`app.css`: *"the pill floated up into the rink by exactly the height of the thing
nobody drew."*

> **§H3, verbatim: when you hide or move a container, enumerate what was inside
> it.** Any block that leaves the ice's column must be checked against `--lboxh`
> and anything else positioned relative to it, **before** the move rather than
> after.

`.lbox` is not on the movable list precisely because of this — it is both
frame-dependent and geometrically load-bearing.

---

## 6. What has to be true before it ships

### 6.1 ⛔ Hit targets, and this is not optional

Three defects in one day on 2026-09-08 were each a green check over a dead
control: a label that was never wired, a `click({force:true})` that disabled the
actionability check, and a synthetic event that skipped the browser's innermost
target. **This change moves six controls into a column that has never existed.**

So: **every moved control gets a Playwright actionability check at both widths** —
a real click, no `force`, asserting the effect. Geometry alone would report a
tidy layout over a column nobody can press.

### 6.2 The instruments and what each cannot see

| | can it see this change? |
|---|---|
| the JS suite | **no** — the fake DOM has no CSS and no layout |
| `tools/dom-golden.mjs` | **no** — it compares rendered DOM, and this is CSS only |
| `test/css-parse.test.js` | only that the stylesheet parses |
| `tools/pixels.sh` | **yes**, and it is the only one — so widths go in the harness, not in a comment |

⭐ **That table is the argument for doing this as CSS with no markup change**: the
golden walk stays valid precisely because the DOM does not move.

### 6.3 ⭐ The divergence is asserted, not promised — CHENG

*"No markup change is what makes it safe, and §8 already commits to it. The moment
a media query requires a second markup path, you have two renderings that can
disagree, and this project's record on that is unambiguous. So: fine, and **add
the assertion rather than relying on the discipline.**"*

**The check: the two widths render the same elements with the same text, and
differ only in computed placement.** Same shape as the paired ends-switching test
— *neither half is safe alone*: "the same elements" is satisfied by a media query
that does nothing, and "the placement differs" by one that also changed the
content. Both are asserted, in opposite directions, at 390 and at ≥1180.

⛔ **And it must be a real browser**, because every instrument that runs in the
fake DOM is blind to the only thing this change does.

---

## 7. ✅ CHENG's rulings — 2026-09-09

1. ⛔ **INVARIANCE IS NECESSARY AND NOT SUFFICIENT, and the transport stays.** My
   draft moved it and the counterexample was already on the page: `◀ Prev` and
   `Next ▶` **disable at the ends of the game.** The rule gains a second clause —
   *content **and enabled state*** — and the transport/scrubber pairing settles it
   independently. §3 is rewritten. ⭐ *This is the answer I wanted, for a reason
   that survives scrutiny instead of one with an exception inside it.*
2. ✅ **The picker moves, and it strengthens DOCTRINE §6 rather than straining
   it.** *"The `layers-off-the-watch-page` ruling was about a control competing
   with the game for attention — five expanded rows between the reader and the
   ice. A collapsed picker in a side column, outside the reading path, competes
   with nothing."* And §6's word is **opt-in**, which presupposes discoverable.
   **Separate *visible* from *interposed* and the ruling and the doctrine point
   the same way.**

   ⛔ **One condition rides with it: the picker's default stays `Just events`.**
   That is what makes §6 structural rather than maintained — the base view cannot
   accidentally carry a metric, because *none* is a choice and it is the selected
   one. **Moving the control must not quietly change what is selected**, and the
   test for it belongs beside §6.3's parity check.
3. ✅ **The divergence is acceptable, and this is the case where it is least
   risky** — same DOM, same handlers, same state, reflowed; nothing branches
   except placement. **With the assertion, not the promise** — §6.3.
4. ✅ **`.newcomer` moves, and it is the strongest candidate on the list.** 268px
   of a phone's fold is the largest single cost measured here, it survives a
   reload, and *"a newcomer's instruction that sits next to what it describes is
   more useful than one that pushes the described thing off-screen."*

   ⚠️ **AND THE PHONE IS NOT FIXED BY THIS.** There is no side column at 390, so
   the 268px stays exactly where it is. Named here so the change cannot be read as
   having solved it: **the phone's first screen is a separate problem**, and on
   the measurement in §1.2 it is the more expensive one.

---

## 8. What this deliberately does not do

- **No markup change.** CSS and one media query, the §5.4 shape, so the golden
  walk and all 35 suites that boot `read-the-game.html` stay valid.
- **Nothing below 1180px.**
- **No interim widening step** — Kevin declined it, and the combined change is
  the same media query either way.
- **The work panel is untouched.** It is an overlay on the ice
  (`docs/status.md`), not part of the stack.
- **No re-parking or un-parking.** §1.3's four hidden blocks stay exactly as they
  are; this is a layout change, not a decision about them.

---

## 9. ⛔ THE FIRST-MATCH QUERY IS A RECURRING SHAPE — three instances now

CHENG, on §0's correction: *"`querySelector` returning the first match is the same
class as `re.search` finding one `<style>` block and the CSP pinning it while
leaving `game.html`'s real stylesheet unhashed. **Third instance of a first-match
query standing in for a set.**"*

**Swept, as he asked.** Every `querySelector` in `tools/`, `test/`, `builders/`
and `src/lib/`, with the count its selector really returns on the live game page:

| where | selector | matches |
|---|---|---:|
| `tools/pixels.sh` | `.board` | 1 |
| `tools/pixels.sh` | `.rinkbox svg` | 1 |
| `test/render-notes.test.js`, `test/lbox.test.js` | `chip.querySelector('.pkl')` | 1 — **scoped to a chip**, singular by construction |
| `test/helpers/page.js`, `test/deeplink-render.test.js` | — | implementations of a fake, not uses |

⭐ **So the harness was clean — and it was clean by luck rather than by check**,
which is the whole point of the shape. `box()` now **counts before it measures**
and reports `"N MATCHES — this figure would be about the first"` instead of
silently describing element one. The two selectors above are singular *counted*,
not assumed.

⚠️ **And the sweep found a live one in this document's own subject.**
`#rg .newcomer` matches **two** elements, and §1's figure for it came from a
first-match query. The number is right for the block that is showing; the *set* is
not what I said it was — see §3.1.

**The transferable form, and it is now a habit rather than a lesson:** when the
subject of a measurement is a class, ask the page how many wear it **before**
reading anything off one of them. An inventory is a walk; a checklist is a guess
about what the walk would find.

---

## 10. ⛔ BUILT, MEASURED, AND §8's "NO MARKUP CHANGE" DOES NOT SURVIVE IT

Kevin, 2026-09-09: *"go ahead and build the updated game page."* Built as specified
— CSS only, one media query at 1180, the six blocks §3 names given
`grid-column:2`. **It is a regression, and the reason is structural rather than a
detail of my CSS.**

### 10.1 The six are scattered through the DOM, and grid rows are shared

The movable blocks sit at child positions **1, 11, 13, 14, 22 and 23** of
twenty-four. Grid auto-placement puts each into the first row where column 2 is
free, and **a row's height is the taller of its two cells** — so a 268px
`#newcomer` in row 2 holds the board out of it, and nothing after `.rinkbox` can
rise above the rinkbox's row.

**Measured at 1900×1065, against the live page as the baseline:**

| | live today | grid | grid, `dense` |
|---|---:|---:|---:|
| `.board` | 267 | 408 | **124** |
| `.rinkbox` | 400 (900×550) | 541 (992×589) | 408 (992×589) |
| `.transport` | 963 | 1144 | 1011 |
| **`.pickrow`** | **1123** | **1260** ⛔ | **1009** |
| document | 1,615 | 1,932 | 1,682 |

**Plain grid moves the picker further below the fold** — 1.05 → 1.18 screens —
which is a regression on the single measurement that justified the whole change.

**`grid-auto-flow: row dense` fixes the numbers and breaks the meaning.** The
picker starts above the fold (1009), but dense backtracks per item: `.sharerow`
lands in the rinkbox's row and `.pickrow` in the transport's, so the right-hand
column reads **share button, then picker** with the share button beside the ice.
That is not the layout §3 describes; it is a different layout that happens to
measure better, and shipping it would be choosing a number over the thing the
number was standing for.

### 10.2 Two independent stacks need a container each

This is not a CSS trick I failed to find. A grid column cannot hold an
independent stack: every item in column 2 occupies a **row shared with column 1**.
Floats stack only in source order and cannot precede the content they sit beside.
Multi-column balances by height rather than by which item goes where. **The side
column needs one wrapper element** — and the moment those six are contiguous in
the DOM, the phone's reading order changes, which §8 promised it would not and
which CHENG's ruling on the divergence rested on.

### 10.3 ⭐ And the phone consequence is large, in the good direction

If the wrapper sits after `.transport`, the phone loses `#newcomer`'s **268px**
from above the board. From §1's measurements that moves the rink from **0.73
screens to about 0.41**, and brings the play button — currently off-screen at 1.15
screens — **above the fold**.

That is a big improvement to the number §1.2 calls *the more expensive problem*.
⚠️ **It is also a change nobody has ruled on**, and CHENG's q4 said in terms that
the phone is *not* fixed by this change. It moves the first-visit instruction from
the first thing a newcomer reads to a block beside the control it tells them to
press — arguably better, arguably worse, and **not mine to decide**.

### 10.4 So the fork, stated once

| | what it costs |
|---|---|
| **A — ship nothing** | the picker stays below the fold on every laptop |
| **B — CSS only, `dense`** | the numbers improve, the column reads share-then-picker, and it is not what was ruled |
| **C — one wrapper** | the ruled layout exactly, **and the phone's reading order changes** — measurably for the better, and outside what was ruled |

**My recommendation is C**, with the phone reorder taken as a deliberate second
change rather than a side effect: it is the only route that produces the layout
CHENG ruled on, and the phone half is an improvement to the measurement this
document already calls the costlier one. But §8 was a commitment, and it is
Kevin's and CHENG's to release rather than mine to work around.