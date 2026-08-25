# The scoreboard on a phone — audit and proposal

**Written 2026-08-25 for CHENG's review. Nothing here is built.**

Kevin, holding his phone up to a laptop camera because the defect would not
reproduce in a screenshot: *"not only does it overflow, I don't think it looks
very 'professional'... the whole vibe of the scoreboard (on mobile) just doesn't
appeal to me."*

Every number below was measured against **production** (`readthegame.co/game.html`,
game `2025030416`, CAR at VGK) in a real Chromium at imposed viewport widths, on
2026-08-25. Nothing is recalled and nothing is inferred from source.

---

## 1. The finding that outranks the subject: the gate went blind

**`deploy.yml`'s "the pages fit a phone" step has been measuring an error page
for `game.html`.** It is the check whose entire purpose is to catch this defect,
it runs at **exactly the width where the scoreboard overflows**, and it is green.

Reproduced by running the step's own commands (`.github/workflows/deploy.yml:681`)
and then framing the result at 360px:

```
404 seen:      extract/2025030416.json
#rg hidden:    true
.board height: 0px
scrollWidth:   360   clientWidth: 360   ->  no overflow, PASS
page shows:    "This game could not be loaded — 2025030416.json — HTTP 404"
```

The step fetches `catalog.json`, `measures.json` and `index.json`
(`deploy.yml:686`) and rewrites the data origin to a relative path
(`deploy.yml:692`). It never fetches the **extract**, which is the one file
`game.html` needs to render anything at all. So the page 404s, and since D9 the
app is hidden when there is no game — the gate's subject is removed from the
document before it is measured.

⭐ **A CORRECT FIX DISARMED A DISTANT CHECK.** D9 was right: an application that
draws itself over a game it does not have is worse than one that says so. But
`#rg` is what the fit gate measures, and hiding it took the gate's subject with
it, one workflow away from the change. This is H3 — *when you hide or move a
container, enumerate what was inside it* — with the container's contents being
**a check in another file**, which no enumeration of the markup would surface.

The step's own comment is the sharpest evidence that this was foreseen and
missed anyway (`deploy.yml:679`):

> *"Local copies with the data alongside, because R2's CORS policy does not name
> localhost and **an empty page overflows nothing — it would pass while proving
> nothing**."*

That sentence is exactly what happened. It was written about the data files and
the extract was never added to the list. **`tools/pixels.sh` learned this lesson
and the gate did not**: that tool fetches a *window* of forty extracts
unconditionally, and says why in its own comment (`tools/pixels.sh:100`, fetched at `tools/pixels.sh:119`).

⚠️ **One thing I have NOT established:** whether this gate was meaningful before
D9. Pre-D9 a 404 still drew the app with static placeholders, so it measured
*some* board geometry — but `#aAtk`/`#hAtk` are written at boot, so the arrow
that overflows may have been absent from that measurement too. I did not test
it. **The claim I am making is about today**, and today it is vacuous.

---

## 2. The scoreboard has no responsive behaviour at all

Every element is the same absolute size at every width. Only the card shrinks.

| | 360px | 390px | 1100px |
|---|---|---|---|
| card width | 315 | 343 | 900 |
| **board height** | **106** | **106** | **106** |
| team badge | 51×26 | 51×26 | 51×26 |
| score glyph | 21×35 | 21×35 | 21×35 |
| `ATTACKS →` block | 72 | 72 | 72 |
| team column | **72** | **72** | 339 |
| state line | **2 lines** | **2 lines** | 1 line |
| board ÷ rink height | **85%** | 78% | 28% |

**This exact defect was already found, fixed and pinned — on the hero.**
`test/render-preview.test.js:449` states it in those words:

> *"the scoreboard was 87px inside an 856px-wide frame and 87px inside a 287px
> one — the same absolute height in both, because its type is set in rem and rem
> does not care how wide the frame is."*

The repair was `min(Xvw, <today>)` on every chrome element, capped at the
existing desktop value so the wide rendering could not move
(`src/app.css:256`–`260`). **The preview got it; the game page never did.** Same
component, same stylesheet, sibling selectors, one of them repaired.

---

## 3. The overflow is arithmetic, not a rounding accident

Two hard floors, both in `src/app.css`:

- `#rg .mid{min-width:150px}` — `app.css:35`
- `.tm .atk{…white-space:nowrap}` — `app.css:19`, which makes `ATTACKS →`
  an unbreakable 72px

The board is `grid-template-columns:1fr auto 1fr` with `gap:14px` and
`padding:12px 18px` (`app.css:16`). So the content the card must accept is:

```
72 + 150 + 72  +  14×2 gaps            = 322px, unconditionally
card at 360px:  315 − 18×2 − 1×2       = 277px available
                                         -----
                                         45px over
```

Measured overflow past the padding box at 360px: **+43.9px.** The arithmetic
reproduces the measurement, so this is understood rather than observed.

Where it lands, by width:

```
width  ATTACKS right vs CARD edge      page
320    OVER by +61.7px                 scrolls sideways
360    OVER by +24.9px                 scrolls sideways
375    OVER by +11.1px
390    ok, −2.7px                      (already +16.3px past the PADDING)
412    ok, −19.0px
```

⚠️ **390px is not "fine" — it is the first width where the overflow stops being
visible.** The content has already eaten all 18px of the card's padding there. I
first reported "nothing overflows" from a single measurement at 390 and was
wrong; a margin that survives one viewport is a constant that drifts with the
next one, which is a sentence already in this repo about this very page
(`src/app.js:1720`).

At 360 the visible result is that **the `K` of `VGK` is clipped by the card
edge** and the right-hand arrow is off the card entirely. `#rg.preview .mid` is
already `min-width:0` (`app.css:255`) — the hero fixed this half too.

---

## 4. Turning "doesn't look professional" into properties

Kevin flagged the term as nebulous. Four candidates, all measurable, offered so
the taste question can be argued about specifics:

1. **Clipped and orphaned words read as broken software.** A cut-off `K` and a
   stranded `LEFT` on its own line are the two most legible "this page is
   failing" signals available to a reader. Most of the feeling is probably this.
2. **The proportion inverts the page's argument.** The site says *watch the
   game*; on a 360px phone the furniture above the ice is **85% of the ice's own
   height**. A reader takes size for importance.
3. **Nothing has room.** Three stacked elements in a 72px column with 14px of
   clearance to the clock. Crowding is what separates a scoreboard from a table.
4. **The score is typographically a terminal.** `#rg .sc` is
   `ui-monospace…;font-size:2.2rem` (`app.css:34`) — a 21px-wide numeral at 35px
   tall. `tabular-nums` and a monospace family exist so the digit does not
   reflow when the score changes, which is a real reason; the result is a tall
   narrow oval where a broadcast scoreboard uses a heavy condensed numeral.

⚠️ **An artifact of my instrument, stated so it is not mistaken for a finding:**
the zeros in my captures carry a centre dot, because this Linux box resolves
`ui-monospace` to DejaVu Sans Mono. Kevin's phone photo shows plain ovals. **The
dot is mine; the narrowness is real on both.**

---

## 4b. CHENG's review, and the measurement that qualifies it

Reviewed 2026-08-25. Three process points **accepted outright**:

- ⭐ **A canary proves the RULER, never that the SUBJECT is there.** The fit gate
  already had the discipline and still went green: *"a 900px element overflowing
  a 360px frame proves the comparison functions. An empty `#rg` at height 0 also
  fits. Both are true at once, and the gate can't tell them apart."* New entry
  for the catalogue, distinct from a vacuous assertion and from a mirror: **a
  correct instrument measuring an absent subject.**
- **Three checks, each answering a narrower question than its name** — the fit
  gate asks *does the fetched document fit*, the canary asks *does the
  measurement work*, refcheck asks *does this line number exist*. That is Q5,
  answered.
- ⭐ **Do not repair the 11 broken citations by making them resolve** — *"that
  converts a loud wrong into a quiet wrong."* The repair is a **content
  assertion**: a citation carries a short expected substring and refcheck
  verifies the line contains it. Same move as the D10 guard.

### ⚠️ And the one claim that does not survive measurement

CHENG proposed moving the direction indicator onto the ice, and argued the
scoreboard arithmetic then becomes `150 + 28` with *"the overflow gone without
re-flow or scale."* **The outer columns do not vanish; they shrink to the team
badge.** Measured on production by hiding `.atk` in the live document:

```
width  avail   today            .atk removed      .atk removed + .mid{min-width:0}
320    240     322  OVER +82    281  OVER +41     240  fits (zero slack)
360    277     322  OVER +45    281  OVER  +4     277  fits (zero slack)
375    291     322  OVER +31    290  fits by 1px  290  fits by 1px
390    305     322  OVER +17    304  fits by 1px  304  fits by 1px

cells at 360:  [72,150,72]  ->  [51,150,52]  ->  [51,146,52]
```

It removes **41 of the 45 pixels at 360** — the biggest single lever available —
and still leaves the page broken at 320 and 360, and fitting by ONE pixel at 375
and 390, which is the knife-edge relocated rather than removed. The residue is
`#rg .mid{min-width:150px}` (`app.css:35`), **the exact floor the hero already
zeroes** (`app.css:255`). So his move is the first step of the responsive work,
not an alternative to it.

### Two things his argument missed, one for and one against

⭐ **FOR — the indicator is already period-aware.** `drawAtk(per)` computes each
arrow from the period (`src/app.js:1013`), so direction already flips when the
ends flip. On the ice it becomes arena-frame furniture that turns over with the
rink, beside the goalie it agrees with — **two elements that must agree become
one grouping**, and it answers his own earlier finding that nothing tells a
viewer which way *this* game opens. That is a better argument for his placement
than the arithmetic he led with.

⚠️ **AGAINST — on-ice team text was deliberately removed, and he cited that
removal himself earlier the same day.** The nets used to read `<BUF` / `MIN>`;
the goalie figures replaced them because a goaltender in the crease says the net
is defended and the text was clutter. The distinction that rescues the proposal:
those labels said *which net is whose*, which the goalie now covers, while this
says *which way this team attacks*, which nothing covers. But at 360px the rink
is **293x125** and the nets sit where horizontal room is scarcest, so **words
there would rebuild this defect on a smaller canvas.** A chevron in team colour,
no text, is the shape to test.

---

## 5. What I propose, and what I want argued

### 5.0 THE PLAN, after CHENG's review — three changes, in this order

1. **Move the direction indicator to the ice.** Biggest lever (41 of 45px at
   360), and it puts direction where direction means something.
2. **Apply the hero's two repairs** — `min-width:0` on `.mid`, and
   `min(Xvw, <today>)` on the type — because (1) alone leaves 4px at 360 and
   41px at 320.
3. **Re-flow what remains**, which by then is a much smaller problem: badge,
   score, state line.

⭐ **CHENG's argument for weighting re-flow over scale, which I had not made:**
*"scaling shrinks text on the device where text is already smallest."* The stated
reader is a novice on a phone; making the scoreboard smaller so it fits is the
wrong direction for exactly that reader. Scale is the safety net under a layout
that already fits, not the mechanism that makes it fit.

### 5.0.1 The aesthetic target, stated so it can be rejected before it is built

Kevin: *"let's make double-sure we are aligned on creating a more professional
looking artifact here, the current scoreboard vibe just doesn't work."* Taste is
his call, so the target is written as properties rather than adjectives:

- **The score is the hero.** `#rg .sc` is `ui-monospace…2.2rem` (`app.css:34`) —
  a 21px-wide numeral. ⭐ **The monospace family is not load-bearing:
  `font-variant-numeric:tabular-nums` is on the same rule and already guarantees
  the digit will not reflow when the score changes.** Dropping the family and
  keeping `tabular-nums` buys a scoreboard numeral at no cost to the reason
  monospace was chosen. Likely the single largest share of the "vibe".
- **One line per team**, not a three-element column — the stack is what forces
  the 72px floor and pins each team to a card edge with a void between them.
- **Nothing clipped and nothing orphaned** at 320, 360, 375 and 390.
- **The board is SHORTER than the ice on a phone.** It is 85% of the rink's
  height at 360 today; a viewer reads size as importance and the page's whole
  claim is *watch the game*.
- **The state line is always one line**, at full card width.
- **The 1100px rendering does not move.** It is clean and nobody has complained.

### 5.1 Re-flow below a breakpoint, and scale what remains

**Scale alone is not enough and I want to say so before recommending it.** The
hero's `min(Xvw, today)` treatment would stop the clipping and the side-scroll,
and it is proven in this codebase — but it answers defect (1) and none of
(2)–(4). It shrinks a cramped layout into a smaller cramped layout, and Kevin's
complaint is not that the scoreboard is clipped, it is that the scoreboard is
unpleasant.

So: **re-flow the arrangement below ~420px, and scale the type inside the new
arrangement**, with every desktop value capped at what it is today so the 1100px
rendering — which is clean, and which nobody has complained about — cannot move.

The three-element vertical stack is the thing to remove. Candidate shapes, to be
chosen after CHENG weighs in rather than now:

- badge and score on **one line** per team, state line beneath at full card width
- the state line as its own row, so the middle column stops having a 150px floor
- `ATTACKS` losing its own line and travelling with the badge

### 5.2 The direction indicator — I want the case against it made

`ATTACKS →` is the element that overflows. CHENG has separately argued the
goalies already settle which end is whose *without words*, and that is the
strongest argument for deleting it on phones.

**I would argue against.** The arrow answers *which way is this team going*,
which the goalies answer only once you already know which colour is which — and
the colours are exactly what a novice does not know. It is also the only element
on the pre-game frame that says anything about the direction of play. But it is
the direct cause, so it belongs on the table and I do not want my preference to
keep it there by default.

### 5.3 The gate must get its subject back, and that is not optional

Whatever we do to the scoreboard, `deploy.yml` must fetch an extract so the fit
gate measures a *booted* page. `tools/pixels.sh` already solves this and its
solution is the one to copy: **fetch a window, do not predict which game the page
will ask for** (`tools/pixels.sh:100`). A gate that restates the rule it is meant
to observe breaks silently the day the rule moves.

And the gate needs a second canary — one that proves it is measuring a page that
**booted**, not merely a page that fit. `measure.mjs` in `tools/pixels.sh`
already refuses to report unless `#rg` carries the expected class; the same idea
belongs here.

---

## 6. Questions for CHENG

1. **Re-flow plus scale, or scale alone?** Kevin's guess is that you lean the
   same way I do. The case for scale-alone is that it is small, proven, and
   reversible, and that it makes the layout question moot by giving everything
   room — I do not believe that, but I have not measured it.
2. **Which re-flow shape**, given the pre-game frame is the one a stranger meets
   and it shows `0 – 0` with no clock running?
3. **Does `ATTACKS` survive on a phone?** See §5.2; I have stated my preference
   and would like it attacked.
4. **Is the board's 85%-of-the-ice proportion a defect in its own right**, or
   only a symptom that disappears once the type scales? This decides whether the
   target is "fits" or "is smaller than the rink".
5. **A note on your own instrument, since it is relevant here.** Every citation
   in this document resolves under `tools/refcheck.py`. **Four of them resolved
   to the wrong line anyway** — `deploy.yml:682` landed on `run: |`,
   `pixels.sh:196` on an `EOF`, `app.js:1676` on an unrelated `const`. They were
   caught by reading each cited line back and comparing it to the claim, which
   is a step refcheck cannot take: it proves a line EXISTS, never that it says
   what the sentence around it says. That is the same family as the checks in
   H1, one level up — worth knowing before the 11 broken citations get repaired,
   because repairing them by making them resolve is not the same as repairing
   them.

6. **§1 — is there a general form of this?** A check in workflow A silently lost
   its subject because of a correct fix in file B. I can name the instance and
   the repair; I cannot yet name the procedure that would have caught it, and a
   lesson without a procedure has not worked here before.

---

## 7. What the tests would have to say

Written down now so the proposal cannot quietly ship without them:

- **The fit gate boots.** A canary that fails if `#rg` is hidden or `.board`
  measures 0px — the check must void itself rather than pass when its subject is
  absent.
- **The board fits at 320, 360, 375 and 390**, not at one width. The single
  measurement is what produced the wrong "nothing overflows" above.
- **The desktop rendering does not move.** Every scaled value capped at today's
  computed value, asserted by comparing 1100px geometry before and after.
- **The mutation set**: restore `min-width:150px`, restore the `nowrap`, remove
  the breakpoint — each must redden exactly one test.
