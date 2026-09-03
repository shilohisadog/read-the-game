# App state, phase 1 — removing what was never state

**Written 2026-09-03 for CHENG's review. Nothing here is built.** Every line
number is pinned to `9078df1` and every classification below comes from reading
every site of every binding, not from a scanner — three of my scanners produced
false positives during this audit and two of those are recorded here, because
they are the reason the numbers moved.

Kevin, on the structure: *"77 functions and 24 bindings in one JavaScript file is
a good approach?"* No. This is the first of two documents about fixing it, and it
is the half with almost no risk in it.

---

## 1. The short version

`src/app.js` is **one function**. Not a module with globals — `function
boot(G,RATES){` opens on line 7 and closes on line 3318, and everything else is
inside it. Verified with a tokenizer that handles strings, template literals,
comments and regex literals: **exactly one top-level block, depth balanced**.

So the 25 mutable bindings are **locals of `boot`**, and the state was never
global. That matters because it changes what is broken: nothing needs
*encapsulating*, it is already encapsulated. What is missing is an **interface**.

**Eight of the 25 are not machine state at all.** Phase 1 removes them. One more
is a frozen animation clock that is a product question, not an engineering one.
The remaining 16 are phase 2's problem.

## 2. What the audit corrected about itself

Two claims I made to Kevin before reading every site, both wrong:

**"24 bindings."** `lastHD` is declared mid-line (`const HX=…, HY=…; let
lastHD=null;`) so a `^let` scan missed it. It is **25**.

**"`prevA`/`prevH` are render's own frame memory."** They are written by
`render` (834), `play` (1444), the page-open path (3037) **and the hero preview
loop** (3315). Four writers across the file. They are shared state and they move
to phase 2, which takes it from 14 bindings to 16.

⚠️ **And one number in the phase plan was inflated by a regex.** "70 write
sites" counted `data-i="${k}"` as a write to `i`, because the lookbehind
`(?<![.\w])` admits a hyphen. `i` has **two** write sites, not seven. The
corrected count is in §5 of the phase 2 document, and it changes that document's
conclusion rather than this one's.

## 3. The eight, each with every site

| binding | sites | what it actually is |
|---|---|---|
| `lastHD` | W 833, decl 1805 | **dead** — two occurrences, both writes, zero reads |
| `REDUCED` | decl 108, r 638, r 3296 | written once, at its declaration |
| `finalA` | decl+loop 137, r 1645 | accumulated once at boot, read once |
| `finalH` | decl+loop 137, r 1645 | same |
| `visits` | decl 129, W 133, W 134, r 135 | declared **one line above** the IIFE that is its only user |
| `rinkPer` | decl 272, W+r 288 | `drawRink`'s idempotence memo, on one line |
| `netmenAre` | decl 307, r 323, W 324 | `drawNetmen`'s memo |
| `pillIs` | decl 348, r 357, W 358 | `drawPill`'s memo |

The three memos are the clearest case. `rinkPer` in full:

```js
let rinkPer=null;                                        // line 272
function drawRink(per){if(per===rinkPer)return;rinkPer=per;   // line 288
```

Nothing else in 3,300 lines touches it. It is a function-local static that
happens to be declared sixteen lines away from its only function.

## 4. The proposal

1. **Delete `lastHD`.** Zero reads. The write at 833 goes with it.
2. **`REDUCED` → `const`.** Written once.
3. **`finalA`/`finalH` → `const`**, computed by a reduce over `EV` instead of a
   `let` plus a mutating loop. Same values, no binding left mutable.
4. **`visits` moves inside the `NEWCOMER` IIFE** — one line down, no other change.
5. **The three memos move inside their own functions** as function-scoped
   statics. This needs a closure or a property on the function object; §6 is
   where I want CHENG's view on which.

**Exit:** 25 → 16 bindings. Every one of the 16 is then defensibly machine state,
which is the precondition for phase 2 being about state rather than about noise.

## 5. What this must not do

**It must not change a single rendered byte.** Every one of these is either dead,
already constant, or read by exactly one function. `build_main.py --verify` is
byte-identical and is the check: if the built page differs, the change was not
what this document says it is.

**It must not turn a memo into a recomputation.** The three memos exist to skip
DOM writes — `drawRink` returns early when the period has not changed. Narrowing
their scope must preserve the early return, not just the variable. A version that
redraws the rink every frame would pass every test in the suite and be slower on
the phone the novice tester will be holding.

**It must not touch `T`.** See §7.

## 6. Open questions for CHENG

**Q1 — how should a function-local static be spelled here?** The three memos need
per-function persistent state in a codebase with no modules and no classes. The
options are a wrapping IIFE (`const drawRink=(()=>{let last=null;return
per=>{…};})();`), a property on the function object (`drawRink.last`), or leaving
them at `boot` scope with a comment. The first is honest and adds a closure per
function; the second is terser and is the kind of cleverness this codebase
usually refuses. **I lean to the IIFE** and want the argument tested.

**Q2 — is `finalA`/`finalH` worth touching at all?** They are read once, at 1645,
as a fallback when `G.quoted` is absent. A reduce is cleaner but the loop is
correct and the gain is one binding. Is this in scope, or is it churn that makes
the diff harder to review for no property gained?

**Q3 — does this phase need its own guard, or is byte-identical enough?** My
instinct is a test that names each of the 16 survivors *with the reason it is
state*, so that a 17th has to be argued for rather than added. The counter-case
is that such a test is a list that will rot, and this project has said a ledger
that only grows becomes a document describing a repo that no longer exists.

## 7. Not proposed here: `T`

`let T=0` on line 108, read once on line 638 as `{t:T,…}` into `figures.js`,
where `t` drives `Math.sin(t*1.7+px*0.02)` — a bob. **`T` is never reassigned**,
so the phase is pinned at 0 and that is not motion; it is a fixed per-x offset.
The `motion` flag beside it is live (`!REDUCED`), so the branch runs.

Either a bob was intended and never got a clock, or it was stopped deliberately
and the variable is a leftover. **That is a question about how the figures should
look, and it belongs to Kevin, not to a refactor.** Recorded here so it is not
silently swept into a cleanup.

## 8. The checks this needs

- `build_main.py --verify` byte-identical, which is the whole safety argument.
- The existing 29 boot-harness suites, unchanged and still green.
- ⭐ **A mutation per memo**: break the early return in `drawRink`, `drawNetmen`
  and `drawPill` and confirm something goes red. If nothing does, the memos are
  currently untested and narrowing them is unguarded — in which case the test
  comes first and this phase waits for it.

That last one is the only part of phase 1 I am not confident about, and it is
deliberately the first thing to run rather than the last.
