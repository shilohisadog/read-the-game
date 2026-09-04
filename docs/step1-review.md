# Step 1 — `src/app.js` is a module. What was done, and what to attack.

**For CHENG's review. This is SHIPPED, not proposed** — `52ac8ad`, pushed, gates
green on CI. It is written to be argued with rather than approved: the parts I am
least sure of are §6, and they are the reason this exists as a document.

Its companion, [step2-decomposition.md](step2-decomposition.md), is the plan this
unblocks, and one finding here reshapes that plan badly enough that it should be
read second rather than first.

---

## 1. What shipped

`src/app.js` was a **build template**: the literal token `__LIB__` on line 6,
`function boot(G,RATES){` on line 7, `__RINKART__` on line 18, `__BOOT__` on the
last line. Not JavaScript any tool could load, in principle — not by
configuration, not by effort.

It is now an ES module. It declares **54 names from 20 library modules** and
exports `boot`. `__LIB__` and `__BOOT__` moved into the HTML template in
`build_main.py`, where they were always about the *page* rather than the
*renderer*. A new `_app()` strips the preamble and the `export`, and the twenty
modules are concatenated above it exactly as before.

**Nothing a visitor can see changed.** `read-the-game.html` and `game.html` are
byte-identical, and `src/*.html` does not appear in the commit at all — which is
the safety argument arriving as evidence rather than as a promise.

Suite: **984 JS + 180 Python**, gates exit 0 locally and on CI.

## 2. The `SX` ruling, honoured for its original reason

Your restated condition — *`SX`/`SY` must not be resolvable from any reducer's
scope **at runtime**; today that holds because `rinkart` is emitted inside `boot`*
— is preserved exactly, not reworded.

`app.js` imports `./lib/rinkart.js` like anything else, so node, the linter and
`test/app-imports.test.js` all see the dependency. The builder satisfies **that
one import** by injecting rinkart's body inside `boot` rather than above it. The
two-sided probe in `render-ends.test.js` passes because the shipped scope is
literally unchanged, not because the probe was adjusted to a new arrangement.

⚠️ **One marker survived and it had to.** `__RINKART__` names a position *inside a
function body*, and no outer template can address that. It stays in `app.js`,
spelled `//__RINKART__` so the file still parses. **The `import` beside it
declares the dependency; the marker only places it.** That is the one asymmetry:
under node `SX` is module-scoped, in the browser it is boot-scoped, and since
`boot` is its only consumer the behaviour is identical — and the probe runs
against the *built* script, so it still tests the shipped shape.

**This is your option A, and §6 is where I argue it was the wrong call.**

## 3. Four guards, each seen to fire

The builder now asserts what it used to assume. Every one was mutation-checked,
and the mutation was watched to see *which* instrument fired.

| mutation | what fires |
|---|---|
| `//__RINKART__` deleted | `the template holds 0 copies of //__RINKART__` |
| `app.js` imports a module not in `LIB` | names the offending module |
| the import scan stops matching | `no imports found — the scan is broken, not the file` |
| `boot` renamed / declared twice | `the anchor matched 0 times` / `2 times` |

⭐ **The second assertion is the half that was missing before.** The old check
caught a marker nobody *substituted*; it said nothing about a marker nobody
*wrote*. A missing `__RINKART__` would have shipped a page with no rink art and
produced no build error at all — `str.replace` cannot fail, it simply does not
happen. Each marker is now required to appear exactly once, so both directions
are loud.

⭐ **The empty-set case is asserted too.** A subset test against nothing passes, so
a scan that quietly stopped matching would report a clean build forever.

## 4. The new instrument, and why it needed one

`test/app-imports.test.js` asserts the import list is **complete and minimal**,
and neither half is safe alone: completeness alone is satisfied by importing
every export of every module, minimality alone by importing nothing.

**Why it is not optional.** The shipped page cannot falsify the import list. The
bundle concatenates the modules, so every library name resolves whether or not it
was declared — delete an import and nothing breaks, nothing goes red, and nothing
anywhere says the file's statement of its own dependencies has stopped being true.
Without this test, step 1 hands back the same unmeasurable file in module clothes.

It runs over `tools/jslex.mjs`, a lexer, **because this file must never be
measured by regex again**. The lexer's control is the first test in that file and
is calibrated against the exact literal that caused the original false finding:
`data-i="${k}"` is not a use of `i`.

## 5. What it bought — and what it did not

**Bought, concretely:** node links all 54 names against what each module actually
exports, at load. `import('./src/app.js')` works. That is an instrument no regex
could ever be, and it did not exist for this file three days ago.

⛔ **Not bought: coverage.** The 27 boot-harness suites still load the *built
bundle* with `new Function`, and a string compiled at runtime is never a file.
The published coverage figure is still a rate computed without the project's
largest and most-changed file. Step 1 removed the reason that was *permanent*; it
closed nothing. `architecture.md` §2 says so in those words, so nobody reads the
change as bigger than it was.

⛔ **Not bought: measurability of the file's interior.** This is the finding that
matters, and §1 of the step 2 document is about it.

## 6. Where I think this is weakest — argue with me here

**6.1 The special case is exactly the shape this project calls a defect.** One
import out of 54 is resolved by a documented branch in a Python builder instead of
by the language. This repo's own line is *a build that carries a rule is a rule
nobody can see from the code*. Option A leaves precisely one such rule behind, and
step 1 existed to move invariants out of build configuration into declared
structure. **The counter-argument I acted on:** today's arrangement has the same
cost, so A is not a regression, and trading a runtime-reachability guarantee for a
static-declaration one should be a decision rather than a side effect of a
refactor. **I still think that is right and I am not confident.**

**6.2 The marker is a second statement of one fact.** The `import` and
`//__RINKART__` both say "this module is needed here." Delete the marker and node
is still happy, the build asserts loudly — but the *reason* it is loud is a count
I added, not the language. A reviewer could reasonably say the honest form is B
(rinkart becomes an ordinary `LIB` module, the rule becomes static) and that I
kept a runtime guarantee mostly because an elegant test already existed for it.
**That is the strongest case against what I built, and I want it made properly.**

**6.3 Stripping the preamble is a rule the builder holds, not the file.** `_app()`
drops everything above `export function boot(`. My justification is that shipping
an import list to a browser already handed those modules by concatenation would
ship a statement untrue of the artifact. The objection: the builder now knows
something structural about the file's layout, anchored on a literal. It is
asserted unique — and §7's third correction is what happens when that assertion is
one character too loose.

**6.4 `--verify` proved bytes, not behaviour.** Byte-identity is a very strong
argument *for this particular change* and it is worth being clear about why: the
change is provably a no-op on the artifact, so the 27 suites are confirming, not
protecting. **That does not transfer to step 2**, and pretending otherwise is the
main risk in the next document.

## 7. Three corrections found while building it

- **"56 dependencies" was 54**, across 20 modules — measured with the lexer
  against each module's real exports. `ATTEMPT_TYPES` is re-exported by
  `layers/corsi.js` and is one binding; `competitions.js` is in the bundle for
  `sentence.js` and `app.js` never touches it.
- ⭐ **A new guard fired for the wrong reason and I nearly kept it.** I mutated
  `boot` → `bootstrap` to watch the anchor assertion. The build failed — on
  `--verify`, **not** on the assertion meant to catch it, because
  `^export function boot` matches `bootstrap` as a *prefix*. The guard passed
  while the page called a function that no longer existed. The bracket in
  `^export function boot\(` is load-bearing. **Only reading which instrument
  fired revealed it**, and that is the general lesson: a mutation that goes red
  proves nothing until you know what turned it red.
- ⚠️ **I made this repo's signature mistake while documenting it.** `grep -c` for
  a hardcoded `89` matched `189px` and `89.8%` in comments, and I wrote "seven
  hardcoded constants survive" into `architecture.md` before checking. The real
  answer: `89`, `33` and the slot's `22 ft` are gone; `42.5` survives in three
  places. The same class of error was already *published* by `tools/tiers.mjs`,
  which reported "24 module-level mutable bindings" — both the known-wrong regex
  count and mislabelled, since every one is a local of `boot`. It now publishes
  only what a tool can stand behind.
- **"29 boot-harness suites" is 27.** I repeated it from the phase documents
  before counting; 27 files import `test/helpers/page.js`. Corrected here and in
  the step 2 plan. The phase documents keep the old figure because they are
  pinned to `9078df1` and superseded, but ⚠️ **a number inherited from an earlier
  document is not evidence** — this repo has a memory named after that lesson and
  I walked into it inside a document about walking into things.

## 8. Questions

**Q1 — is 6.1/6.2 enough to reopen option B?** The rink-art import is the single
remaining build-held rule in the renderer. Reopening means deleting half of a
two-sided runtime probe, which this project's doctrine treats as how guards die
quietly. Is *"the property moved, so the instrument for it should move too"* a
legitimate reason to retire that half, or is it the rationalisation the doctrine
is warning about?

**Q2 — is `_app()`'s preamble strip correct, or should the imports ship?** They
would be inert comments-in-effect (stripped by `_inline`'s sibling), but shipping
them would remove the builder's structural knowledge of the file. I chose the
smaller artifact over the simpler builder.

**Q3 — should `test/app-imports.test.js` exist at all, or is it a test for a
property node already checks?** Node checks that imported names *exist*. It does
not check that used names are *imported*, because concatenation hides that — so I
think the answer is clearly yes, but the test is 130 lines and a lexer, and I want
the cost challenged rather than assumed.
