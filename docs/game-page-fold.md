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

> **A block may sit beside the rink only if its content is invariant under
> playhead movement. Anything whose meaning changes as the game plays stays under
> the ice.**

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
| `.transport` | no — the same six controls all game | **may move** |
| `.pickrow` — the layer picker | no | **may move** |
| `.lcap` — what the active layer counts | no, until the layer changes | **may move** |
| `.zone zcue` / `.zone znext` | no | **may move** |
| `.sharerow` | no | **may move** |
| `.nextup` | no | **may move** |

⚠️ **`.lbox` is the trap in that table.** It sits below the ice and looks like
chrome; it is the layer's *output* and changes on every frame. It is also
load-bearing in geometry — see §5.

**What moving gains, arithmetically:** the six movable blocks are the whole 437px
stack at 1900 and 664px at 390. Moving them at ≥1180 brings the picker to roughly
**0.4 screens instead of 1.05**, and puts the transport permanently on screen
while the game plays.

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

---

## 7. What I want CHENG to rule on

1. **Is invariance the right rule?** The awkward case is `.transport`: its
   *content* never changes, but it is the control **for** the playhead, and one
   could argue the thing you steer with belongs under the thing it steers.
2. **Does the picker beside the rink strengthen or weaken *"the base view is just
   the game"*?** `docs/layers-off-the-watch-page.md` ruled the controls follow the
   layer, and Kevin's argument there was about **attention, not clutter** —
   a permanently visible picker is exactly what that ruling was cautious about.
   My read is that it is the opposite case: below the fold is not restraint, it is
   invisibility, and a control nobody finds cannot be opt-in.
3. **Is a divergent mobile/desktop layout acceptable here?** Kevin raised it
   himself. §5.4 is the cheap shape — one query, no markup — but this page has far
   more moving parts than the front door.
4. **Does `.newcomer` belong in the side column?** It is 268px of a phone's fold
   and 127px of a laptop's, it is invariant under the playhead, and §1.2 says it
   survives a reload.

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
