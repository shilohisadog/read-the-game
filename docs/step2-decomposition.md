# Step 2 — decomposing `boot()`. A plan, and the finding that reshaped it.

**For CHENG's review. Nothing here is built.** Pinned to `52ac8ad`. Read
[step1-review.md](step1-review.md) first: it is the shipped precondition, and its
§6.4 is the sentence this document has to answer.

**The one-line summary of what changed since the plan was sketched:** step 1's
safety argument does not transfer, and the interior of the file turns out not to
be measurable by the instrument I expected to measure it with. Both are §1 and
§2, and they matter more than the plan itself.

---

## 1. ⭐⭐ THE FINDING: five scanners in one session, and the reason is structural

Making the file loadable was supposed to end the guessing. I then wrote a
depth-aware analyser to map `boot`'s interior — which function owns which
binding, so the clusters could be chosen from evidence instead of intuition.

**It failed five times, and I nearly published each one.**

| what it reported | what was actually true |
|---|---|
| 30 mutable bindings | `let acc=0,W=START;` in the unnamed hero loop is not boot state |
| 28, after a fix | `let lab` inside two functions it failed to strip |
| a binding named `its` | from the words *"…let its caption finish…"* **in a comment** |
| 98 inner functions | `PICKS` is an **array of arrows**, so five bodies inherited the array's name |
| `drawCue` touching 9 bindings | `drawCue` is 5 lines. It was being credited with `render`'s state |

Every one was caught by cross-checking against the September hand audit, never by
the tool. **That is the same shape as the four false findings step 1 was built to
prevent, arriving in the tool built to prevent them.**

⭐ **And the cause is now precise, which it was not before.** `boot` is ~3,300
lines at **one lexical depth**. Every function, every binding and every block is a
direct child of the same scope, so *"which function does this line belong to?"*
has no cheap answer — the question needs a real parser, not a depth counter,
because the file's structure is not encoded anywhere a cheap tool can read it.

**Making the file a module fixed the file's relationship to the outside world. It
did nothing for its interior**, and step 1 should not be read as having done so.

**This is the argument for step 2, and it is stronger than the one I had.** After
decomposition, *"which module owns this?"* is answered by the filename. The
question stops needing an instrument at all.

## 2. ⛔ BYTE-IDENTITY CANNOT SURVIVE THIS, AND THAT IS THE REAL RISK

Step 1 was safe because `--verify` proved the artifact did not change. **That
argument does not extend one inch into step 2.** Moving a cluster out of `boot`
moves its body from inside the function to above it and rewrites every call site.
The bytes change by construction.

So step 2 must buy a new safety argument, and this is the part I most want
challenged.

**What I propose: a golden rendered-DOM walk.** `test/helpers/page.js` already
boots the built bundle against a fake document and can walk frames — the
as-played tests use exactly this shape. So: **capture the rendered DOM of every
frame of the reference game before the move, and assert it identical after.**

- It replaces *byte-identical source* with *byte-identical output*, which is the
  property anyone actually cares about.
- It is two-sided the same way the ends-switching pair was: prove the harness can
  fail by perturbing one attribute and watching it go red, or the walk is
  satisfied by a comparison of two empty strings.
- ⚠️ **It is strictly weaker than `--verify` and the gap should be named**: the
  fake document has no CSS and no layout, so anything about size, position or
  `display:none` is invisible to it. `test/helpers/page.js` says this about itself. A cluster
  whose extraction changes *when* something is drawn rather than *what* would
  pass. The browser step in `deploy.yml` and `tools/pixels.sh` are the only
  answer to that, and they are not per-commit instruments.

**Q1 is whether that trade is acceptable, and it is the question this document
exists for.**

## 3. What IS solidly measured

Two things survived every cross-check, and the plan uses only these.

**3.1 `boot` has 26 mutable bindings, not 25.** Each has a verified line number.
⭐ **The hand audit missed `gear`** (`const PACE=[…];let gear=1;`, line 1389) —
**for the same reason the original regex missed `lastHD`: a mid-line
declaration.** It is disciplined: `setGear` is its only writer, like `frameMs`.
So the September inventory of "25, of which 16 are genuine state" should be read
as 26 and 17 until re-derived.

**3.2 `boot` declares 93 callables at its own level** — 79 `function` statements
and 14 arrow consts (`upto DIR AX NEWCOMER MODE ENDED ICING OFFSIDE PSTART $
LEDGER HX RSN PICKS`). Counted from depth-1 tokens only, nothing inferred. The
often-quoted "77 functions" was close and slightly low.

⛔ **What is NOT measured, and will not be quoted: which function touches which
binding.** That is §1's failure, and every cluster boundary below is therefore
proposed from *reading*, not from a graph.

## 4. The proposal: one cluster, then re-decide

**Not eight modules. One.** Then stop, look, and re-scope — because the thing I
would most like to know is what a boundary actually costs, and no amount of
planning produces that number.

**4.1 The first cluster is the why-popup**, lines ~1849–1903: `showWhy`,
`hideWhy`, the `HX`/`HY` mini-rink transform, the dead `lastHD`, and two event
listeners. About 55 lines. It is the right first move because its inputs are
enumerable by reading — `$`, `EV`, `R`, `AID`, `AAB`, `HAB`, `AWAYCOL`,
`HOMECOL`, `shotDir` — and because it already reads its rule constants from
`rink.js` rather than hardcoding them, so the extraction is not entangled with the
rink-constants cleanup.

**4.2 The shape is a factory, because a module cannot see `boot`'s locals.**
`_inline()` concatenates at top level, so an extracted module is emitted *above*
`boot` and can reach nothing inside it. Therefore:

```js
export function whyPopup({ $, EV, R, AID, AAB, HAB, AWAYCOL, HOMECOL, shotDir }) {
  const HX = x => 11 + Math.abs(x), HY = y => 42.5 - y;
  …
  return { show, hide };
}
```

and `boot` holds one line: `const why = whyPopup({ … });`. **The declared
parameter list is the entire point** — it is the first time any part of this file
states what it needs, and it is checkable by node.

**4.3 ⚠️ It cannot live in `src/lib/`, and this is an architectural decision, not
a filing one.** That tier is **verifiably pure** — `tools/tiers.mjs` asserts all
26 modules touch no DOM, no network, no filesystem, and `architecture.md` §1
claims it. The why-popup writes `innerHTML`. So step 2 either creates a new
tier — a **ui** directory beside `src/lib/`, inlined by the builder like `LIB`
and declared in `architecture.md` as presentation — or it breaks the one boundary
this project verifies. **Q2 is which.**

<sub>Named without a backticked path on purpose: `test/doc-paths.test.js` checks
that every repo path cited in `docs/` exists, and it caught this document
inventing one. A proposal must not cite a path as though it were there.</sub>

## 5. ⚠️ Where my own headline argument is weaker than I have been stating it

I have been saying decomposition is how **175 prose invariants become
structural**. Writing this document found the counter-example immediately.

`test/why-popup.test.js` **already exists**, and it already aims at the claim: it
reads `isHighDanger` out of `rink.js`, counts its `&&`-joined clauses, and fails
if the popup's sentence names fewer. That is precisely the prose-invariant-made-
structural that extraction was supposed to deliver — and it was delivered by
someone writing a test by hand, against the file as it stands.

**So the honest claim is narrower.** Extraction does not convert comments into
checks. It makes the checks that *would* be written **cheaper and more direct**:
this test currently reaches the popup by booting a whole page and reading a
string out of it, where it could call a function and inspect its return.

⭐ **Which raises the measurement that should probably come first.**
`architecture.md` §5 already carries *"of the ~49 published claims, how many have
an instrument?"* as an open item. **The same question over `app.js`'s 175 marked
claims is the one that decides whether step 2 is worth its risk** — if most
already have instruments, the case for decomposition rests on §1 (measurability)
alone, which is a real but much smaller case than the one I have been making.
**Q3.**

## 6. The checks step 2 needs

- **The golden-DOM walk of §2**, proven able to fail before it is trusted.
- **The 27 boot-harness suites**, unchanged and green.
- **`test/app-imports.test.js` extended** to the new tier, so a ui-tier module
  the bundle omits is a build error rather than a broken page.
- ⭐ **A test that calls the extracted module directly** — otherwise the
  extraction has produced a file boundary and no new ability, which is the
  outcome §5 warns about.
- **`--verify` still runs**, and is expected to *differ*. It stops being the
  gate and becomes the diff worth reading line by line, once, by a human.

## 7. What this must not do

- **It must not become eight modules in one change.** The cost of a boundary is
  unknown until one exists.
- **It must not put a DOM-writing module in the pure tier** to avoid inventing a
  new one. That trades a verified property for a filing convenience.
- **It must not move state.** The 26 bindings stay exactly where they are. If a
  cluster needs one, it receives it or the cluster is wrong — and *that* is the
  test of whether these are the right boundaries.
- **It must not proceed if the first extraction's diff is not reviewable.** If a
  55-line move produces a diff a human cannot read in one sitting, the plan is
  wrong and the answer is a smaller unit, not more discipline.

## 8. Questions

**Q1 — is the golden rendered-DOM walk an acceptable replacement for
`--verify`?** It is weaker in a specific, nameable way (no CSS, no layout). Is
"identical DOM across every frame of one game, with a two-sided control" enough to
move a cluster, or does step 2 need something I have not thought of — a second
game, a browser-side comparison in `deploy.yml`, a per-cluster golden file?

**Q2 — does the presentation tier get its own directory?** A **ui** directory
beside `src/lib/`, inlined like `LIB`, purity not claimed of it, `architecture.md` §1 gaining a fourth tier.
The alternative is that `app.js` keeps every DOM-touching function forever and
step 2 can only extract pure helpers — which would make it a much smaller and
much safer change than the one I am proposing, and possibly the right one.

**Q3 — should claim-coverage be measured before any extraction?** §5's
counter-example suggests the benefit of decomposition may be mostly
*measurability* (§1) rather than *instrumentation*. Measuring how many of the 175
marked claims already have a test would settle which argument step 2 actually
rests on. It is also a week of work on its own, and I am not sure it is worth
delaying the first 55-line move.

**Q4 — is the why-popup the right first cluster, or is it too easy?** It is small,
self-contained, and already has a test — which makes it a good rehearsal and a
poor experiment. `render` (328 lines, the binding-heaviest function in the file)
is where the answer that matters lives. **Is a first move that cannot fail
informative, or is it just cheap?**
