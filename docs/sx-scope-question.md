# The `SX` scope ruling, and what making `app.js` a module does to it

**One question for CHENG. Nothing here is built, and nothing else is proposed.**
Pinned to `a5b802c`.

This is the single obstacle to the next architectural step, and it turns on a
ruling of his that is currently enforced by a property of the build rather than
by anything stated in code. It is asked on its own rather than inside the phase
documents, because those have been re-scoped three times and this should not
inherit their uncertainty.

---

## 1. What is proposed, in one paragraph

`src/app.js` is **not a module**. It is a template: line 6 is the literal token
`__LIB__`, line 7 opens `function boot(G,RATES){`, line 18 is `__RINKART__`,
line 3318 closes the function, line 3319 is `__BOOT__`. `builders/build_main.py`
substitutes all three.

Because of that it cannot be imported, parsed by any tool, covered, or linted
with real scope analysis — and it has **56 undeclared dependencies on
`src/lib`**. Step 1 is to make it a real ES module: declare those 56 imports,
`export function boot`, move the template tokens into the HTML template where
they belong, and let `_inline()` strip and concatenate it exactly as it already
does for the twenty `LIB` modules. **The shipped bytes do not change**, and
`build_main.py --verify` is the proof.

Everything else this project wants from `app.js` — decomposition into modules
with declared inputs, coverage, a parser instead of a regex — is downstream of
that one change.

## 2. The ruling, and what actually enforces it

CHENG, ruling on as-played ends (`docs/ends-switching.md:687`):

> `SX` must be made **lexically** unreachable from library scope, *"not merely
> unused, because the modules share one inlined scope"* — a reducer that reads
> screen coordinates is a reducer whose counts move when the rink flips.

⭐ **The instrument that followed it audited the premise and found it half
wrong**, and that audit is the most important fact in this document.
`test/render-ends.test.js:289`:

> *"The modules do share one SCRIPT, but not one SCOPE: `build_main.py` inlines
> `__LIB__` ABOVE `function boot(G,RATES){`, and `SX` is a `const` in boot's
> body. A function declared at top level can never see a binding inside another
> function's body, whenever it is called. So the guard already exists."*

So the enforcement is **not** the ordering of the `LIB` list. It is that
`rinkart.js` is injected *inside boot's body* via `__RINKART__`, and every
library module is a top-level declaration that cannot see into it.

It is instrumented two-sided, on purpose: a probe in library position **must
throw**, and the same probe inside `boot` **must resolve** — so *"it threw"*
cannot be satisfied by a probe that was simply broken.

## 3. Why step 1 threatens it

`_inline()` strips `import`/`export` and concatenates. If `app.js` imported
`rinkart.js` the ordinary way, its body would be emitted **at top level**
alongside the reducers, and `SX` would become a name any reducer could resolve.
The two-sided probe would fail on its first half, correctly.

⚠️ **The ruling's own stated reason is conditional on the build model** —
*"because the modules share one inlined scope"* — and step 1 changes the model
for authoring while leaving it unchanged for shipping. That is exactly the
situation where a rule can be preserved, weakened, or improved without anyone
noticing which, so it is being asked rather than assumed.

## 4. Three options

**A — keep `SX` inside `boot`, at build time.** `app.js` imports `rinkart.js`
normally, and `_inline()` gains one special case: that import is resolved by
injecting rinkart's body at the top of `boot` rather than at top level.
- ✅ The shipped scope is **byte-for-byte what it is today**; the two-sided probe
  passes for its original reason rather than a reworded one.
- ✅ `app.js` is a valid ES module for node, tools and coverage.
- ⚠️ One documented special case in the builder — and this repo has said a build
  that carries a rule is a rule nobody can see from the code.
- ⚠️ An asymmetry: under node `SX` is module-scoped, in the browser it is
  boot-scoped. Behaviour is identical because `boot` is its only consumer, and
  the probe runs against the **built** script, so it still tests the shipped
  shape.

**B — let rinkart become an ordinary library module, and enforce the rule
statically.** The guarantee changes from *"a reducer cannot resolve `SX`"* to
*"no module under `src/lib/` imports `rinkart.js`"*.
- ✅ No build special case; the rule is stated where the dependency is declared.
- ✅ Arguably a **stronger** statement: an import expresses intent, where
  concatenation order is a side effect that happens to have the right result.
- ⛔ It is a genuinely weaker **runtime** guarantee. In the shipped bundle `SX`
  would be top-level and a reducer that named it would find it. The two-sided
  probe could no longer exist in its current form; its first half would have to
  be deleted, and this project's own doctrine is that deleting a red instrument
  because the thing it guards moved is how guards die quietly.

**C — leave `app.js` as a template and give up step 1.** Stated for completeness
and to be argued against: it keeps a 3,311-line function with 56 undeclared
dependencies permanently unmeasurable, which is the condition that produced four
false findings in one review.

## 5. What I think, and where I am unsure

**I lean to A**, and the reason is narrow: CHENG's ruling was about a *runtime
reachability* property, and A preserves it exactly while B trades it for a
*static declaration* property. Those are not the same guarantee, and swapping one
for the other should be a decision rather than a side effect of a refactor.

⚠️ **What makes me unsure is that A's cost is the shape this project keeps
naming as a defect** — an invariant enforced by the build, invisible from the
code. Today's arrangement has that same cost, so A is not a regression; but step
1 exists precisely to move invariants out of build configuration and into
declared structure, and A leaves this particular one behind.

**There may be a fourth option I have not seen**, which is the main reason this
is a question rather than a plan.

## 6. The questions

**Q1 — does the ruling survive the change of authoring model, and in which
form?** Was *"lexically unreachable"* the requirement, or was it the strongest
enforcement available in a concatenated world for the real requirement, which is
*"a reducer must never read screen coordinates"*?

**Q2 — if B, what replaces the two-sided probe?** A static check that no
`src/lib` module imports `rinkart.js` is easy. What is harder is preserving the
*second* half — the assertion that the probe itself works — which is what stops
the check passing for the wrong reason. Is there a two-sided form of a static
import check, or does that property simply not exist for static checks?

**Q3 — is A's special case acceptable, given what it is?** One builder branch,
documented, preserving an existing runtime guarantee. Or is accepting it the
thing that keeps `app.js` special forever, one exception at a time?

**Q4 — is there a fourth option?** Specifically: is there an arrangement where
`SX` is unreachable from reducer scope **and** stated in code rather than in the
builder — without `app.js` staying a template?
