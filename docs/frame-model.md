# The frame model — are we cleansing the test tier, or its smells?

**Written 2026-09-16 for CHENG's review. Nothing here is built.** It comes
before T1 is built, because the answer changes how T1 is built.

Kevin, reading the plan to build T1 and T2 from `docs/test-architecture.md`:
*"are we truly cleansing the test/ architecture or are we simply cleaning up the
smells of the current architecture?"*

**WHAT PROMPTED IT, for a reader arriving cold.** This repo builds a hockey
replay site. `src/lib/**` holds pure analysis modules; `src/app.js` is the one
stateful file, and it draws each frame of the replay into the page; the test
suite boots the built page in a hand-made fake DOM (`test/helpers/page.js`) and
reads elements back by id. Deleting one parked `<div>` on 2026-09-15 touched
eleven files, and `docs/test-architecture.md` diagnosed the cause as coupling
between tests and page elements. CHENG (a second Claude instance acting as
reviewer; Kevin relays) ruled on four questions in its §7 and endorsed building
two invariants: **T1**, every id a test looks up exists in a built page, and
**T2**, no test reads an element inside a container the stylesheet hides.

**THE CLAIM THIS DOCUMENT MAKES.** T1–T4 are rules about which elements a test
may touch. They police the coupling and never ask why it exists. Measured, there
are **two** couplings with **two different causes**, and the one that caused the
eleven-file deletion is not the one I expected. Every figure below is measured
at `4a2b427`; the method for each is stated beside it.

---

## 1. What this is NOT

⛔ **It is not the state refactor `docs/architecture.md` §2 declined.** That plan
was *"one state object with `render(state)` and a single setter"* — the INPUT
side, the 25 mutable bindings — and it was rejected because moving assignments
converts no comment into a check. This document is about the OUTPUT side: what a
frame *says*, as a value, before anything writes it into the page.

⛔ **It does not overturn CHENG's `return markup` versus `write to document`
ruling** (§2 of the same file). It asks whether that split stops one step short:
a lib function that returns markup still has to be parsed back out of the DOM by
any test that wants the fact inside it.

⭐ **It is the open row `docs/architecture.md` §5 already carries:** *"What
remains in `render` is wiring, and the open question is whether that is the end
of it or whether wiring itself wants a shape."* A search of `docs/`, `src/`,
`test/` and `git log` for a prior view-model or frame-model proposal found none.

## 2. The measurements

### 2.1 The app's write surface

Lexed with `tools/jslex.mjs` (never regex — its header says why), counting
writes to `$('literal')`, `document.getElementById('literal')` and simple
aliases of either:

| | |
|---|---:|
| DOM write sites in `src/app.js` | **173** |
| distinct ids written | **74** |
| named functions that write, plus `boot`'s own body | **46 + 1** |
| ids written from more than one function | **14** (`rg` from 13, `clipbox` from 9) |

⚠️ **A lower bound**: an id built at runtime is not counted. ⚠️ **And one number
I computed and am not reporting**: I classified each write by whether its value
came from a `src/lib` call or was composed inline, and 128 of 173 came out
"inline". The lexer cannot follow a value through a local variable, so a count
returned by a reducer and held in `const a` scores as inline. The label claimed
more than the instrument measured, so the figure is withdrawn rather than
hedged.

### 2.2 The test read surface

Every id lookup in `test/*.test.js`, lexed the same way, including ids reached
through a `for (const id of ['…'])` loop. A lookup is a **drive** if a click,
handler or `.value =` follows it, and a **read** otherwise.

| | |
|---|---:|
| id lookups | **753** |
| reads / drives | **590 / 163** |
| test files that read at least one id | **33** |
| distinct ids read | **83** |

### 2.3 One surface by hand: the scoreboard

| id | written by | reads | files |
|---|---|---:|---:|
| `per` (period label) | `render` | **13** | 6 |
| `ppill` | `drawPill` | 10 | 1 |
| `clk` | `render` | 9 | 5 |
| `hAb` / `aAb` | `boot` | 9 / 8 | 6 / 6 |
| `atnote` | `boot` | 7 | 2 |
| `penA` / `penH` | `drawBoxes` (dynamic id) | 5 / 4 | 2 / 2 |
| `aSc` / `hSc` | `render` | 3 / 3 | 2 / 2 |
| `gl` · `endpill` | `boot` · `drawEndsNote` | 4 · 1 | 3 · 1 |
| **`cA` / `cH` — parked, visible to nobody** | `render` | **11 / 11** | **5 / 5** |
| **`lxA` — the visible replacement for `cA`** | `drawLBox` | **2** | **1** |

⛔ **The copy nobody can see carries five and a half times the assertions of
the copy everybody can.**

### 2.4 The mutation: `per` is a frame identifier, spelled in English

`periodLabel` (`src/lib/period.js:23`) returns `'Period ' + e.per`. Changed to a
unique marker (`count == 1` asserted first), rebuilt (exit 0, marker present in
both built pages), full JS suite, then reverted, rebuilt and the tree confirmed
clean:

| | tests | files |
|---|---:|---:|
| failed | **11** | **6** |
| whose subject is the label (`render-board`: *overtime is NAMED*) | 1 | 1 |
| the golden, a change detector by design | 1 | 1 |
| **whose subject is something else** | **9** | **4** |

The nine are about ends rotation, the net label, zone-start rings, the ends
key, the empty-net note, deep links, the opening faceoff and the clock
(`render-ends` ×5, `render-notes` ×2, `smoke`, `deeplink-render`). Each reads
the scoreboard's words — `f.per === 'Period 1'` — to learn **which period a
frame is in**, because the harness hands a test a document and nothing else.

⭐ **Two files read `per` and survived:** `rink-memo` and `onice-ui` use it only
for change or count, never for its spelling. Reading for identity is harmless;
reading for **wording** is the coupling.

⛔ **And `periodLabel` has no direct unit test.** Its four branches are
reached only by booting the page. The wording claim lives in `render-board`,
and the identity claims live in nine tests that are not about it.
`test/clock.test.js:58` is the same shape one element over: the clock's rule
lives inline in `render`, so the test asserts the **source text** of the line
that writes it.

### 2.5 The counterfactual — and it cuts against this document

Deletion `c44373b` touched five test files. Classified by what each changed
assertion read:

| file | what the changed assertions read |
|---|---|
| `box.test.js` | built markup (viewBox containment) and stylesheet (preview flex rules) |
| `park.test.js` | the stylesheet's darkness model |
| `render-penalties.test.js` | markup and stylesheet (the park rule) |
| `render-strength-pill.test.js` | stylesheet (`.pb::before` pattern) |
| `render-transport.test.js` | markup and stylesheet (*caption not inside `.pboxes`*) |

**Five of five read stylesheet or markup TEXT. Zero read a rendered value.**

> ⛔⛔ **A FRAME MODEL WOULD HAVE CHANGED NONE OF THE ELEVEN FILES.** The incident
> that opened this thread is not evidence for it. I expected it to be, and it is
> said here before the proposal rather than after it.

### 2.6 The second coupling, sized

| | files |
|---|---:|
| test files that read stylesheet text (`PAGE_CSS`, `app.css`, `<style>`) | **32** |
| … of which also boot the page | 25 |
| test files carrying their own regex over `display:none` | **17** (grep; approximate) |

⭐ **The fix made during that deletion wrote a second darkness model.**
`render-transport.test.js` now derives hidden containers inline with
`matchAll(/#rg \.([\w-]+)\{[^}]*display:\s*none/g)`, beside
`park.test.js:64`'s `darkClasses`. That is the duplication T2 was meant to
centralise, arriving one day before T2.

## 3. Two couplings, two causes

| | **V — value coupling** | **L — layout coupling** |
|---|---|---|
| what a test does | reads the page's WORDS to learn app state | regexes CSS and markup to make claims about visibility and position |
| why | a frame's decisions are observable only as DOM | the fake DOM has no CSS and no layout, so there is no other way to ask |
| evidence | §2.3, §2.4 — 9 off-subject failures from one wording change | §2.5, §2.6 — the whole originating incident; 32 files |
| what fixes the cause | a seam where a frame is a value | a harness that can see a stylesheet: a browser |
| which ruled invariant lives here | **T1** (the harness invents ids) | **T2** (a CSS parser standing in for a browser) |

⭐ **This is why the question comes before T1.** T1 and T2 were drafted as one
pair; they guard different causes, and each answer below moves one of them.

## 4. The options, for V

**A — rules only.** T1–T4 as ruled. The coupling stays; the rules say where it
may go.

**B — the harness hands tests the frame.** `every`, `at` and `sweep` already
know the playhead index `k`; they would pass the event beside the document, so
a test needing *which period* reads `ev.per` and never the label. **It touches
no line of `app.js`**, and it removes exactly the failure §2.4 measured. It does
nothing for value claims about composed content.

**C — a frame model in the app.** `frame(i, controls)` returns what the frame
says — period, clock, score, penalty rows as data, pill, layer box, caption,
notes — and `paint(model)` writes it. Wording claims test the model directly;
one mapping table ties model fields to ids; `every` hands tests the model.

⭐ **THE SHAPE IS ALREADY IN THE FILE, ONCE.** `lboxFor(id, at, L)`
(`src/app.js:3177`) returns `{a, k, h, n, …}` for the layer box and `drawLBox`
writes it. `test/work-markup.test.js` and `test/lbox.test.js` already cite it as
the seam their figures come from. ⚠️ **But it is not pure:** it is a closure
over `boot`, unexported, and it reads the page itself (`pickLabel()` reads a
heading out of the DOM). The one model-shaped function we have shows what C
costs, not that C is free.

## 5. The case against C, made properly

1. **A model is a second representation of the page.** Model and paint can
   drift, and the mapping table that guards them is an enumeration — the
   `LAYER_TOKENS` shape from 2026-09-09, *a guard whose reference is itself an
   enumeration goes stale in the same edit.*
2. **The ice may not have a model worth the name.** `eventMarks` takes 19 inputs
   and returns SVG. A model of marks is either the SVG string (no gain) or a mark
   list (a much larger change). **Unmeasured.**
3. **Some decisions are about the transition, not the frame.** The jump-versus-
   play distinction (`src/app.js:721`) decides whether counters flash; `how` is
   not a property of frame `i`. It either enters the model's signature or stays
   in paint, and the second is a place for the next seam defect.
4. **The measured cost C removes is nine tests,** and B removes those nine
   without touching the app. The duplicated arithmetic on `cA` (§2.3) is T3's
   deletion under any option. **What only C buys** is a direct test of content
   composed inline in a draw function — `drawBoxes` names a bench minor
   `Bench`, strikes an unserved clock, and adds `+N more in the box`, all inline
   (`src/app.js:510`), reachable today only by booting. **How much content is
   composed that way is the number this document does not have.**
5. **`docs/architecture.md` §2's lesson applies:** the state refactor was
   declined because it moved code and converted nothing. C must name what it
   converts, and so far the honest list is item 4.

## 6. And for L

The eleven-file incident, all 17 private `display:none` regexes and T2 itself
exist because **no test can ask a browser.** `package.json` says *"Zero
dependencies, deliberately"*, and `tools/pixels.sh` keeps Playwright out of the
repo. ⚠️ But **`.github/workflows/deploy.yml` already runs a system
`google-chrome --headless` at ten sites** with no npm dependency, for CSP and
rendered-DOM gates. Whether that can answer *is this element visible* without
a driver is **unmeasured**.

If it can, T2 becomes a browser check that cannot disagree with a stylesheet,
rather than a parser that can.

## 7. What I want ruled

1. **Is the V/L split right?** In particular: §2.5 says the originating incident
   was entirely L. If that holds, `docs/test-architecture.md`'s headline —
   coupling is only visible to deletion — is true of L and only partly of V,
   which a mutation (§2.4) can see without deleting anything.
2. **For V: A, B or C — or B now and C scoped to inline-composed content?** And
   does a model returning DATA extend your `return markup` ruling or contradict
   it? `eventMarks`, `workMarkup` and `whyMarkup` would still return markup under
   C.
3. **For L: do visibility claims leave the node suite for a browser?** If yes,
   what does *zero dependencies* mean — no npm packages (deploy.yml's Chrome
   already satisfies that) or no browser in `npm test` (it does not)? And is a
   CSS-parsing T2 the fast approximation we keep, or the thing we stop
   building?
4. **How does T1 change?** My position: **T1 belongs in the harness under every
   option** — `getElementById` fails on an id no built page has, the browser's
   own behaviour — because A, B and C all keep at least the paint tests on the
   fake DOM. Under C that surface shrinks and T1 guards less. ⚠️ And a
   source-scanning T1 is ruled out by measurement:
   `render-teams.test.js:211` reaches five deleted ids through a loop
   variable, which the scan in `docs/test-architecture.md` §3 did not count.

---

*Method.* §2.1–§2.3 are one-off scripts over `tools/jslex.mjs`'s `walk`, not
committed, in the same way as `docs/test-architecture.md` §3. §2.4 is
reproducible as stated. §2.5 is `git show c44373b -- test/`. §2.6's first two
rows are file-level `grep -l`; the third matches regex literals and is marked
approximate.
