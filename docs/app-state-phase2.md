# App state, phase 2 — one write path for the sixteen

> ⛔⛔ **THIS DOCUMENT'S §2 IS WRONG, AND IT IS SUPERSEDED. Do not scope work
> from it.** It says the five layer toggles are "fifteen sites where the
> invariant is held by nothing but repetition." They are not. `pick()` **is** a
> correct single write path and it enforces something the others do not — every
> layer whose id is not the one pressed gets turned **off**. Three sites bypass
> it (a parked click handler, the deep-link `LAYER_APPLY` table, the preview
> path), and two of those bypass it legitimately.
>
> ⚠️ **That was my third wrong measurement of this file in one review**, and the
> fourth followed it: I wrote up `?layer=corsi,slot` as a live defect before
> reading `syncPick`, which already documents it as a deliberate degradation.
>
> **The corrected path is in `docs/status.md` §0.** The state count was never the
> architectural problem; it was a symptom I could count and kept counting wrong.
> Phases 1 and 2 are absorbed into decomposition and should be re-measured with a
> parser — never a regex.
>
> ⚠️ **§5 IS ALSO OUT OF DATE, AND IT MATTERED MORE THAN IT LOOKS.** It says
> `app.js` "cannot be loaded by any instrument… and never will be without a build
> change." That build change landed **2026-09-04**: the file is a real ES module,
> node imports it and checks every name it declares, and `tools/jslex.mjs` exists
> so the next measurement of it is lexical rather than textual. The sentence was
> true when written and reads as a permanent constraint, which is exactly how an
> undated claim misleads.

**Written 2026-09-03 for CHENG's review. Nothing here is built, and phase 1 is a
precondition.** Line numbers pinned to `9078df1`. Read
[app-state-phase1.md](app-state-phase1.md) first: it establishes that `src/app.js`
is a single 3,311-line function and removes the eight bindings that were never
state, leaving the sixteen this document is about.

---

## 1. The finding that changed the plan

I told Kevin this was a **70-write-site** refactor. It is not, and the correction
is the most useful thing in this document.

⚠️ **The 70 was a regex artefact.** `(?<![.\w])i\s*=` admits a hyphen, so every
`data-i="${k}"` in the mark-drawing code counted as a write to the playhead.
Excluding it, **`i` has two write sites, not seven.**

Counted properly — 16 bindings, **53 sites including declarations, ~45 real
assignments**:

| binding | W | lines | shape |
|---|---|---|---|
| `corsiOn` | 5 | 2497, 2518, 2929, 3022, 3200 | **three parallel write paths** |
| `hdOn` | 4 | 2497, 2519, 2971, 3023 | same |
| `goalieOn` | 4 | 2497, 2521, 2974, 3024 | same |
| `whistleOn` | 4 | 2497, 2522, 2976, 3025 | same |
| `blockOn` | 4 | 2497, 2520, 2978, 3026 | same |
| `prevA` | 5 | 382, 834, 1444, 3037, 3315 | four writers, three of them resets |
| `prevH` | 5 | 382, 834, 1444, 3037, 3315 | same |
| `playing` | 3 | 1347, 1444, 1445 | transport internal |
| `timer` | 3 | 1347, 1439, 1444 | transport internal |
| `evenOnly` | 3 | 141, 2939, 3028 | setter + deep-link |
| `picking` | 3 | 2523, 2528, 2530 | contained in the picker |
| `i` | 2 | 1347, **1355** | **already single-path** (`set`) |
| `frameMs` | 2 | 1347, 1486 | already single-path (`setGear`) |
| `trails` | 2 | 148, 2954 | already single-path |
| `cueOn` | 2 | 522, 2969 | already single-path |
| `workOpen` | 2 | 1028, 1518 | already single-path (`setWork`) |

⭐⭐ **MOST OF THIS STATE IS ALREADY DISCIPLINED.** Six of the sixteen have
exactly one assignment after their declaration, and it is inside a function named
for it. `i` — the binding I called the worst case — is written only by `set()`.
The blanket claim that `app.js` is 3,300 lines of uncontrolled mutation is
**false**, and a refactor sold on that premise would be sold on a number I got
from a bad regex.

## 2. So what is actually wrong

**The five layer toggles, and they are one defect repeated five times.** Each is
written from **three parallel places**:

```js
let corsiOn=false, …                                              // 2497 decl
const PICKS=[['corsi',()=>corsiOn,v=>{corsiOn=v;setCorsi();}], …  // 2518 picker
$('lyCorsi').addEventListener('click',()=>{corsiOn=!corsiOn;setCorsi();}); // 2929
[corsi.id]:()=>{corsiOn=true;setCorsi();},                        // 3022 deep-link
corsiOn=true;setCorsi();                                          // 3200
```

Three ways to turn a layer on, each remembering to call `setCorsi()` afterwards.
**Fifteen sites across five toggles, and the invariant "a toggle write is always
followed by its sync" is held by nothing but repetition.** This is the same shape
as the lens set being written down four times, fixed last week — and the same
shape as `LENSCOUNTS`, where the fourth copy had no guard and failed silently.

**`prevA`/`prevH` second.** Four writers, three of which are resets to zero
(`play`, page-open, hero loop) and one of which is the per-frame update in
`render`. The resets exist so a flash does not fire on the first frame after a
jump. Nothing states that invariant; it is re-derived at each site.

## 3. The proposal, and it is smaller than "one state object"

**Not** a single blob with a generic setter. That would put `i`, `playing` and
`timer` — already disciplined — behind a new indirection for no gain, and it
would make every write look alike when the interesting ones are the five that do
not.

Instead, **close the write paths that are actually open**:

**3.1 One toggle setter.** `setLayer(id, on)` becomes the only way a layer's
boolean moves, and it does the sync. The picker, the click handler and the
deep-link dispatch all call it. Fifteen sites become five one-line calls plus one
function. `LENS` already gives the id→module mapping this needs.

**3.2 `prevA`/`prevH` gain a named reset.** `resetFlash()` at the three sites that
zero them, with the reason stated once instead of implied three times.

**3.3 Then, and only then, the guard.** ⭐ **The property worth asserting is not
"state lives in an object" — it is *"no layer boolean is assigned outside
`setLayer`"*,** which is lexically checkable over `boot`'s source and provable by
putting a stray assignment back. Same for the flash resets.

**Exit:** ~45 assignments → ~28, and the two invariants that were held by
repetition are held by a function and asserted by a test.

## 4. What this must not do

**It must not become a rename.** `S.hdOn = true` scattered across the same three
places is globals with a prefix and is strictly worse than today, because it
looks like it has an interface. If the write path is not enforced, do not do it.

**It must not put the disciplined six behind a setter for symmetry.** `set()`,
`setGear()`, `setWork()` already are the write path. Wrapping them buys nothing
and costs a layer of indirection in the most-read file in the repo.

**It must not change a rendered byte.** `--verify` is byte-identical; that is the
check, and it is why this is safe to do without coverage.

## 5. The risk, honestly

`app.js` **cannot be loaded by any instrument** — it is a template with `__LIB__`
and `__BOOT__` placeholders, so it is not a module and never will be without a
build change. There is no coverage on any of it and there will be none during
this work.

**The net is the 29 suites that boot the real shipped bundle**, plus the
byte-identical build. That is a genuine net for behaviour and a poor one for
intent: it will catch a toggle that stops working and will not catch a toggle
that works for the wrong reason.

⛔ **This is why §3 is deliberately smaller than CHENG's original suggestion.** A
whole-state refactor under no coverage, in the function where every seam defect
this project has had has lived, is a bad trade. Closing two named invariants is
most of the value at a fraction of the exposure.

## 6. Open questions for CHENG

**Q1 — is the reduced scope right, or a failure of nerve?** The case for the full
state object is that `render` would gain a declared input and become testable in
isolation. The case against is §5. **I think the full version is correct only
after `app.js` is loadable, and that is a build change nobody has scoped.** Is
that the right ordering, or is the state object the thing that makes the build
change tractable?

**Q2 — should the deep-link dispatch write state at all?** Lines 3022–3026 turn
layers on from the URL, and line 3200 does it again from a different path. Both
would call `setLayer`, but the deeper question is whether a link should set state
directly or replay the same user action the picker does. The second is more
honest and might be a bigger change than it looks.

**Q3 — `picking` (2523, 2528, 2530).** Three writes, all inside the picker, one
of which is a guard against re-entrancy. Is a re-entrancy flag state, or is it a
sign the picker is doing something it should not need to guard?

**Q4 — does phase 3 survive this?** If §3 lands, the toggles have one writer and
the transport already had one. The case for factories with declared inputs gets
weaker, and I would rather re-measure than proceed on momentum. **Should phase 3
be deferred until after this is live and we have looked again?**

## 7. The checks this needs

- `--verify` byte-identical.
- The five toggle paths exercised **through each of the three entry points** —
  picker, direct click, deep link — because the invariant being removed is
  precisely the one that made three paths agree.
- ⭐ A lexical guard: no assignment to a layer boolean outside `setLayer`, and
  none to `prevA`/`prevH` outside `render` and `resetFlash`. Both **proven able
  to fail** by restoring a stray write.
- ✅ **The flash-after-jump behaviour is already guarded, and better than I
  expected.** I wrote "I could not find a test asserting it" and that was wrong —
  `test/render-transport.test.js:173` boots `?at=3-05:00`, lands on a frame with
  more than twenty attempts already counted, and asserts neither counter carries
  `bump`. **It is paired with a control that plays 80% of a game and asserts a
  counter DOES bump**, so it cannot pass against a page whose counters never
  flash at all. Its own comment records that the first draft missed the case by
  jumping to a frame it had already rendered, where the assertion held under the
  mutation too.

  This is the one part of phase 2 I expected to have to build first, and it is
  already there. It is also the reason the `prevA`/`prevH` change is safe to make
  at all: the invariant has an instrument, so a `resetFlash()` that forgets a
  site goes red rather than quietly changing what the page says just happened.
