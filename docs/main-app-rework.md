# Reworking the main app into a real program

**Technical artifact for review.** An audit of `read-the-game.html` and its build chain, and a
proposed architecture and migration.

| | |
|---|---|
| **Status** | For review — nothing implemented |
| **Author** | CC |
| **Date** | 2026-08-07 |
| **Repo at** | `ce23e25` |
| **Reviewer** | CHENG |

Findings are evidence-backed: every one was produced by running a command against the repo, and the
quoted output is the actual result. The open questions at the end are genuine, not rhetorical — the
sections on *where I am least confident* and *what I may have missed* are the parts I most want
attacked.

---

## Part 1 — What the audit found

### F1. No legacy builder can run in the repo layout — *blocking*

All nine pre-existing builders use bare relative paths — `open('rich.json')`,
`open('read-the-game.html','w')` — which assume the flat scratch directory they were written in. The
repo is `data/` + `src/`. Every one of them either fails or, worse, writes an app to the repo root.

```
build_v1      BARE PATHS: open('game_embed.json'  open('read-the-game.html'
build_alive   BARE PATHS: open('game_embed.json'  open('read-the-game.html'
build_alive2  BARE PATHS: open('rich.json'  open('read-the-game.html'
build_A/B/C   BARE PATHS: open('rich.json'  open('active-play.html' …
```

### F2. One builder is permanently broken, and its output exists only in the shipped HTML — *blocking*

`build_alive3.py` reads `_alive2_template.txt`. **That file does not exist in the repo, and does not
exist in the preserved `hockey-build/` directory either** — it was scratch state that was never
captured. The builder cannot be run again by anyone.

What it produced is the high-danger **"why" popup** — the distance/angle/slot diagram with the factor
breakdown and the rule statement. That is one of the strongest teaching moments in the app, and its
only surviving copy is inside the generated HTML.

```
find _alive2_template.txt  ->  (no results)
showWhy in read-the-game.html: 3   whydiag: 3   whyrule: 2   factor: 6
```

### F3. Three builders each regenerate the same file from their own full template — *blocking*

`build_v1`, `build_alive` and `build_alive2` each contain a complete independent template, and each
writes `read-the-game.html` from scratch. **Running an earlier one silently reverts every later
one.** Nothing in the files records the order; it is recoverable only by reading and comparing the
templates.

This is the same failure that had `build_gv.py` six rounds stale — caught and repaired earlier today.
Here it is worse, because there are three of them and one is unrunnable.

### F4. The style sheet is applied by a one-shot in-place prepender — *serious*

`build_css.py` is not a generator. It opens the shipped HTML, checks whether a `<style>` block is
already present, and if not, prepends one. It is guarded to be idempotent, which means it is also
inert — re-running it after any regeneration is a no-op that looks like success.

```python
p='read-the-game.html'
html=open(p).read()
if not html.lstrip().startswith('<style'):
    open(p,'w').write(STYLE+html)
else:
    print("style already present")
```

### F5. The shipped HTML is the sole surviving copy of the app — *blocking*

F1–F4 compose to this: `src/read-the-game.html` (94,669 bytes) **cannot be regenerated from anything
in the repo.** It is not a build output. It is the source, and it is a file no human can review.

The one piece of good news is that the recovery path is known and already proven — extracting a
shipped file back into its builder as a template is exactly what repaired `build_gv.py` this morning.
It works. It just has to happen before anything else does.

### F6. The app is effectively minified — undiffable and unreviewable — *serious*

264 lines, longest line **66,139 characters**. Git cannot produce a meaningful diff; a one-character
change and a forty-kilobyte change look identical in review. CHENG cannot review this file at all in
its current form, which is by itself an argument for the rework.

```
total lines: 264      longest line: 66139 chars
<style> blocks: 1     <script> blocks: 1
```

### F7. No test infrastructure of any kind — *serious*

No `package.json`, no runner, no test directory, no tests. The only automated check in the project is
`node --check` on the extracted script block, added today for the two builders that were touched.

This matters more than usual here, because the data gotchas are exactly the kind of thing that
regresses silently: the blocked-shot attribution flip, SOG-excludes-goals, the ends-switch
normalization, the high-danger geometry. Each has a known-correct answer verified against the
boxscore, and none is currently pinned by anything.

### F8. The code does not express Doctrine §6, so the teaching layer isn't free — *serious*

Doctrine §6 specifies the architecture outright:

> each layer is a deterministic reducer over the event stream that returns something renderable plus
> its own `countedEvents` breakdown … That seam is why "show me the work" and the teaching layer come
> for free. A new layer is a new reducer, not a new app.

The shipped app does not have that seam. Corsi, high-danger and goaltending are hand-woven into one
script, and "show me the work" is bespoke code rather than a read of a breakdown the layer already
produced. **The doctrine describes an architecture we have not built yet.**

This is the finding I care most about, because it explains the symptom that started this: adding a
stoppage/rules layer felt like writing a new app, and under §6 it should have felt like writing one
function.

---

## Part 2 — What must survive the rework

This inventory is the acceptance contract. Anything not on this list that turns out to matter is a
gap in my audit, and I'd want it added.

| Feature | Surface | Notes |
|---|---|---|
| Base replay | `▶ Play from start` | Puck hops between real events; never glides |
| Pace control | `🐢 Slower / Teaching / Faster` | Teaching is the default gear |
| Auto-narration | `💬 Explain plays` | Plain language, push-not-pull |
| Corsi layer | `＋ Control (Corsi)` | Counter + bar; blocked-shot attribution flips to shooter |
| Danger layer | `＋ High-danger` | Geometric rule, ≤ 33 ft and \|y\| ≤ 22 |
| Goaltending layer | `＋ Goaltending` | Save % builds live as it plays |
| Show me the work | `Show me the work` | The doctrine made operable |
| Why-popup | click a danger event | Distance / angle / slot diagram — **only exists in the HTML (F2)** |
| Goal announcements | — | Scorer + both assists; labelled net flash |

---

## Part 3 — Proposed architecture

The organizing idea is to stop treating Doctrine §6 as prose and make it a type. A layer becomes a
pure function with a required breakdown in its return value, which is what makes both "show me the
work" and the tests fall out of the same seam.

### The layer contract

```js
// A layer is a pure reduction over the event stream. No DOM, no globals.
export const corsi = {
  id: 'corsi',
  label: '＋ Control (Corsi)',

  reduce(events, ctx) {
    return {
      render:     { /* whatever this layer needs drawn */ },

      // Doctrine §6: the breakdown is part of the contract, not a debug extra.
      counted:    [ eventId, … ],
      surprising: [ { id, why } ],   // counted, but a novice would not expect it
      excluded:   [ { id, why } ],   // and never silently
    }
  }
}
```

Two consequences worth stating plainly:

1. **"Show me the work" stops being a feature and becomes a renderer** over
   `counted / surprising / excluded`. It then works for any layer, including ones not written yet.
2. **The blocked-shot flip stops being a comment and becomes data.** It's a `surprising` entry the UI
   can explain on its own: *"this attempt is credited to Minnesota even though Buffalo blocked it,
   because a Corsi attempt belongs to the shooter."*

### Source layout

```
src/lib/
  rink.js          coordinate normalization, ends-switch, SVG mapping
  events.js        the event stream + accessors (one place that knows the feed)
  figures.js       player glyphs  <- already modular, currently embedded in Python
  narrate.js       plain-language sentences for events
  layers/
    corsi.js  danger.js  goaltending.js   (whistle.js later)
apps/
  read-the-game/   template.html  +  main.js
build.py           one builder: modules + data + template -> one self-contained file
```

The **output does not change**: still one file, still no network, still openable from disk. Modules
are a build-time concern only. That preserves the "save it and it still works" property, which is
itself part of the pitch.

### Test strategy

The reducers are pure functions over recorded events, which makes them the highest-value and easiest
thing in the project to test. Proposed targets, each with a known-correct answer already verified
against the boxscore:

- **Corsi attribution** — a blocked shot counts for the shooter, not the blocker. 44 blocks in the
  reference game, 38 recorded in the blocker's own defensive zone.
- **Shots on goal** — official SOG = shot-on-goal events **+** goals. Must reproduce **MIN 35 /
  BUF 25**.
- **Ends normalization** — after normalizing, every BUF shot is +x and every MIN shot −x, in all
  three periods.
- **High-danger geometry** — the rule at its boundaries: exactly 33 ft, exactly \|y\| = 22.
- **Conservation (property test)** — for every layer, `counted + excluded` accounts for every event
  considered. Nothing is silently dropped. This one enforces the doctrine mechanically rather than by
  review.

**Runner:** I lean toward node's built-in `node --test` — zero dependencies, no `package.json` needed
for a project whose pitch is "read the code, no supply chain." Vitest is nicer to use and costs a
dependency tree. Genuinely open.

**What tests cannot cover:** pixels. I build blind and Kevin verifies the render. That stays true and
no test strategy changes it — which is an argument for keeping rendering thin and pushing everything
decidable into the reducers, where it *can* be tested.

---

## Part 4 — Migration: four phases, each independently shippable

No big bang. Each phase leaves a working app, and each has a gate that must pass before the next
begins.

### Phase 0 — Freeze: make the app regenerable before touching it

Extract the shipped HTML back into a single builder as its template, exactly as was done for
`build_gv.py`. Re-parameterize the embedded data with a marker. Delete or archive the five dead
builders. No refactoring, no behaviour change.

> **Gate:** the builder's output is **byte-identical** to the file it was extracted from. That is a
> mechanical check, and it is the whole point of doing this first.

### Phase 1 — Extract the pure logic, with tests

Lift normalization, Corsi, danger and goaltending into `src/lib/` as plain modules, and write the
tests above against them. The app still renders through its existing code path; only the source of
the numbers moves.

> **Gate:** tests pass, and the rendered output is unchanged — same numbers on screen, Kevin confirms
> the pixels.

### Phase 2 — Adopt the layer contract

Port the three layers onto the reducer interface. Rewrite "show me the work" as a generic renderer
over `counted / surprising / excluded` rather than bespoke per-layer code. This is the phase that
actually pays off F8.

> **Gate:** the conservation property test passes for all three layers, and "show me the work" output
> is at least as good as today's for each.

### Phase 3 — New layers are new reducers

The stoppage/rules work becomes `layers/whistle.js` — one file, one contract, tests like everything
else. If Phase 2 is right, this is small.

> **Gate:** adding it touches no existing layer's code.

---

## Part 5 — Going public on GitHub, and why it sharpens the plan

Raised by Kevin mid-review. It isn't a separate workstream; it changes the weight of several findings
above, mostly in the direction of *do the rework, and do it properly*.

### It turns "read the code" from a claim into a testable fact

Doctrine's whole differentiator is *inspectable, check-our-work*. In a private repo that is an
assertion. In a public one a stranger can actually try it — and the first thing they hit is a 94KB
file whose longest line is 66,139 characters. **F6 stops being an internal annoyance and becomes a
credibility problem at the shop window.** A project that says "read the code" should not ship code
that can't be read. This is now the strongest single argument for the rework.

### CI can permanently kill the bug class this audit is about

The most valuable thing GitHub adds isn't hosting, it's a gate that runs on every push. Three checks,
all cheap:

- `node --test` — the reducer tests from Part 3.
- `node --check` — syntax of each assembled bundle, which is the difference between a typo and a
  blank page in a self-contained artifact.
- **Build reproducibility** — re-run every builder and assert the output matches the committed HTML.
  **This one is the prize.** Builder drift is precisely what F2–F5 are, and it is exactly the kind of
  failure that is invisible to humans and trivial for a machine. Wire this and the failure that cost
  us `build_alive3` can never silently recur.

Note the ordering dependency: reproducibility CI is only possible *after* Phase 0, because today
there is nothing to reproduce. That makes Phase 0 look less like over-caution.

### Pages is a natural distribution channel, at zero cost

The apps are self-contained single files with no build step and no network calls — exactly what
GitHub Pages serves best. Publishing `src/` gives every app a permanent public URL with no
infrastructure. Artifacts stay what they are today: the fast preview loop for Kevin's pixel
verification. Pages becomes the public home. No conflict between them.

### Decisions a public repo forces

| Decision | Options | My lean |
|---|---|---|
| NHL data redistribution | Keep the committed single-game excerpt (476KB — `shifts.json` 244KB, raw `pbp` 132KB) / fetch at build time | **Keep it.** Committing the raw responses next to the extract is what makes "check our work" real — a stranger can recompute our numbers offline. README already states provenance and purpose. Attribution wording deserves a deliberate look; not a blocker. |
| Default branch | `master` (current) / `main` | **`main`**, before there's a remote and history to rewrite. Trivial now, annoying later. |
| Repo visibility | Public from first push / private until Phase 0 | **Private until Phase 0 completes.** Pushing an unregenerable 94KB blob as the flagship file makes a first impression we'd have to live down. Phase 0 is small. |
| Contribution posture | Open to PRs / source-available showcase | Worth deciding deliberately rather than by default. Doctrine is unusually strict; a project that refuses features on principle needs that stated up front, or every PR becomes an argument. |

None of this changes the architecture in Part 3. It changes the **sequencing**: Phase 0 before the
repo goes public, and CI wired as soon as there is something reproducible to check.

---

## Part 6 — Where I am least confident

Listed because a review is more useful when it starts from the author's actual doubts rather than
having to find them.

- **Whether modules are warranted at all.** The deliverable is one self-contained file. A reasonable
  position is that the single file *is* the product and a module system is ceremony. My counter is
  that modules are build-time only and the output is unchanged — but I hold that loosely, and F6 is
  doing most of the arguing for me.
- **Python or JavaScript for the builder.** The app is JS; the build is Python; two languages is a
  tax on a small project. Python is what exists and works today. I lean JS for one-language-ness, but
  it's a rewrite of working code for tidiness, which is a bad trade unless the build has to get
  smarter anyway.
- **Phase 0 as a whole phase** may read as over-caution. I don't think it is — an unregenerable 94KB
  file is how this project already lost `build_alive3` — but it costs a round trip before any visible
  progress.
- **Does inlining modules weaken "read the code"?** The bundle a reader opens will be assembled
  rather than authored. If we care about a stranger auditing the shipped file, generated code is
  slightly worse to read than hand-written code, even when identical in behaviour.

## Questions I'd most like answered

1. **Is the layer contract right?** Specifically, is `counted / surprising / excluded` the correct
   decomposition, or is `surprising` a category that will rot into a catch-all?
2. **Is the conservation property test the right way to enforce doctrine mechanically,** or does it
   create pressure to classify events dishonestly just to balance the ledger?
3. **Node or Python for the builder,** given the tradeoff above?
4. **Is Phase 0 worth its round trip,** or should freeze-and-refactor collapse into one step?
5. **What did I miss in the feature inventory?** It's the acceptance contract, so a gap there is the
   most expensive kind of error in this document.
6. **Should the repo go public before or after Phase 0?** I say after, on first-impression grounds —
   but that's a judgement about audience, not engineering, and I hold it weakly.

---

## Explicitly out of scope

The **"derived" category** — the proposal to mark conclusions that are a rule applied to real data,
such as inferring which team iced the puck from the faceoff coordinate — is a **doctrine** question,
not an architecture one. It is parked for Kevin and CHENG to settle separately, and nothing in this
document depends on the outcome.

The **teaching copy** for the stoppage rules is likewise parked. Drafts exist in
`builders/build_rules.py` (written, never run, never committed) and are not proposed here.

---

*Every finding is reproducible from the repo at commit `ce23e25` using the commands quoted inline.*

---

# Amendment — 2026-08-07, after CHENG's review

CHENG reviewed this document against a clone and ran the queries rather than
reading the prose. Four findings, all reproduced independently before being
accepted. Two of my findings above are **wrong and are withdrawn**; the record
is amended here rather than silently rewritten.

## Withdrawn: F2 was wrong in both mechanism and conclusion

`build_alive3.py` is not broken by a missing template. Its last line is

```python
base=open('_alive2_template.txt').read() if False else None
```

`if False` — the read never executes. The script runs clean and writes nothing.
It is **abandoned, not broken**, and the distinction matters because the asset
is not lost: `WHY_CSS` and `WHY_JS` hold the full why-popup in readable form.
F2 claimed its "only surviving copy is inside the generated HTML." There are
two, and the builder's is the better one. Only the injection logic needs
re-deriving.

I grepped for `open(` and stopped at the match instead of reading 55 lines.

## Corrected: F6 was substantially overstated

Measured: longest line 66,139 chars — and it is the embedded data literal.
Only **two** lines exceed 500 characters; the code is ~27.8KB across ~263
normal-width lines. So "git cannot produce a meaningful diff" is false for the
code, and "CHENG cannot review this file" was disproved by CHENG reviewing it —
findings 1 and 4 below came out of reading it.

**F3 and F5 are the real arguments for the rework and they stand alone.**
F6 should not have been given the shop window in Part 5.

## New, blocking: the blocked-shot flip is backwards

`read-the-game.html` credits Corsi attempts on blocked shots to the **blocker**.
`eventOwnerTeamId` is the **shooter's** team — 44/44 in this game, verified
against `rosterSpots` rather than our own extract, so the check is not circular.

```
shipped  (flips):  MIN 72 / BUF 63  = 53.3%
correct (no flip): MIN 80 / BUF 55  = 59.3%
```

The app labels the event "still an attempt — for the shooter" while the
arithmetic credits the blocker. The teaching text and the math disagree, on the
number the product exists to deliver.

The claim originated in a project memory, propagated to `README.md`, to the
code, and into this document — four artifacts, one untested premise. The README
defended it with "38 of 44 blocks were recorded in the blocking team's defensive
zone," which is **true and proves nothing**: `zoneCode` on a block is recorded
from the defending side and carries no information about ownership. A true
statistic was offered as evidence for a claim it cannot support.

The tell that should have caught it: SOG is computed from the *same* field,
unflipped, and reproduces the boxscore exactly. One field changing meaning for
exactly one event type was the extraordinary claim.

**Fix is cheaper than assumed:** `rich.json`'s `actor` on a blocked shot already
*is* the shooter (44/44), so `R[e.actor].tid` gives robust per-event attribution
with no re-extraction.

## New, latent: `Math.abs(x)` in the danger rule

`Math.hypot(89-Math.abs(e.x), e.y)` measures to the *nearer* net, not the
*attacking* net, on already-normalized coordinates. **Three** events are
mis-measured (CHENG found one; there are three):

```
P3 11:33 BUF  x=-70 y=+35   app 39.8 ft   true 162.8 ft
P3 00:35 MIN  x= 65 y=+25   app 34.7 ft   true 156.0 ft
P2 06:29 BUF  x=-52 y=+26   app 45.2 ft   true 143.4 ft
```

All three have |y| > 22, so the slot test rejects them independently and the
high-danger count is unchanged. Correct by luck. Use `89 - x*dir(team)`.

## Amendments to Part 2 — the acceptance contract

Three features were missing, and a rework could have passed acceptance without
them:

| Feature | Surface |
|---|---|
| **Scrubber** | `<input class="scrub" id="scrub">`, seeks and halts playback — the control the whole reducer architecture is designed around |
| **`caption` → `showWhy`** | a second entry point to the why-popup, besides clicking the event |
| **Scoreboard state** | `gl`, `hSc`, `aSc`, `per`, `clk` update live |

## Amendment to Q2 — conservation as specified could not fail

Line 126 filters before the reducer ever runs:

```js
const SKIP=new Set(['stoppage','period-start','period-end','game-end','delayed-penalty']);
const EV=G.events.filter(e=>!SKIP.has(e.type));
```

Measured: 320 events, **51 pre-filtered**, 269 reaching the reducer, and
`counted 135 + excluded 134 = 269`. Conservation passes while 51 events are
deleted upstream of the ledger. "Every event considered" is the loophole, since
`SKIP` decides what is considered. **Bind the property to `loadGame()` output,
not to `EV`** — then the 51 stoppages become `excluded` entries with reasons,
which Doctrine §3 wants anyway and which is free material for the whistle layer.

Also: `excluded` currently counts by type. Conserve over **IDs**, not counts.

## Accepted without argument

- `surprising` gains a `derivedFrom` field. An explanation that isn't checkable
  is exactly how a wrong number ships with a confident caption.
- Python stays the build language.
- Ownership resolution goes through a feed adapter — justified by the
  attribution question in hockey alone, before any second sport.
- `G.shifts` is referenced **0 times**: 694 shifts embedded and never read.

## Revised order of work

1. ~~README and memory corrections~~ — done, commit `a11f265`.
2. **Phase 0** — done, see below.
3. Findings 1 and 4, in the builder, tests first, mutation-proven.
4. Phase 1, then Phase 2 with conservation bound to `loadGame()`.

## Phase 0 — complete

`builders/build_main.py` regenerates `src/read-the-game.html` from
`data/rich.json` plus the extracted template. The embedded literal proved to be
byte-identical to `json.dumps(rich.json, separators=(",", ":"))`, so the builder
is fully parameterized rather than carrying a frozen blob.

**Gate: `python3 builders/build_main.py --verify` reports BYTE-IDENTICAL**, and
regenerating over the working tree leaves `git diff` empty (sha256
`8b8ece7c…`). The five superseded builders moved to `builders/legacy/` with a
README recording why, and keeping `build_alive3.py` for the why-popup source.

Outstanding from F1 when this was written: `build_A/B/C/3d.py` (the earlier 2D
prototypes and the terrain view) retained the bare-path problem and could not run
from the repo. **`build_A/B/C.py` were removed 2026-09-03** (B8), so only
`build_3d.py` still carries it
root. Out of scope for Phase 0, which was the main app.
