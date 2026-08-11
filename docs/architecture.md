# The architecture, soup to nuts

*Written 2026-08-11 because Kevin asked whether we are shoe-horning new
functionality into modules that should not carry it. Short answer: **one place,
badly, and it is worse than "overloading" — it is duplicate authority.** Two
places are misfiled but working. Two more suspicions are, I think, wrong, and
saying so is the point of an audit.*

---

## 1. What the system actually is

Four tiers. Three of them are named in the code; the fourth is not, and that is
where the trouble is.

| tier | what it does | where it lives | size |
|---|---|---|---|
| **acquisition** | talks to the league, stores bytes | `fetch_nhl.py` | 544 |
| **interpretation** | feed → events; the two gates | `extract.py` | 459 |
| **orchestration** | walks the store, judges, writes documents | `derive.py` | 393 |
| **analysis** | events → meaning (Corsi, danger, goaltending, strength) | `src/lib/**` | 1,065 |
| **presentation** | generates the pages | `build_*.py` | ~1,900 |

The **analysis tier exists and is good** — pure functions, no DOM, each with a
`countedEvents` conservation ledger, 136 tests. It has exactly one consumer: the
browser. That is why it is filed under `src/lib`, which is a directory named for
the website.

**The new work is the first time analysis has to happen at pipeline time.** That is
a genuine architectural event, and the plan I wrote in `docs/homepage.md` walked
straight past it.

---

## 2. THE REAL PROBLEM — the plan creates a second implementation of the same rules

The featured-game rule needs, per game, over the whole archive:

- what counts as a shot attempt (`ATTEMPT_TYPES`)
- whether play was at even strength (`KNOWN_SITUATIONS`, `situation`, `isEven`)
- the running score, to bucket each attempt as tied / leading / trailing

**All three already exist, in JavaScript, in the analysis tier.** The plan put them
in `derive.py`, in Python. That is not module overloading. It is **two
implementations of one domain rule in two languages**, which is the defect this
project has already paid for in exactly these words, in `docs/catalog.md` §3:

> a catalog built in Python from extracts would need a **second implementation of
> the score rule**, in a second language, and the two would drift. That is the same
> defect as a second renderer, one level down, and this project shipped a wrong
> Corsi number exactly that way.

I wrote that, argued from it to make the catalog quote the boxscore — and then
proposed the same mistake three documents later.

**And the drift had already started.** The scratch script behind §3.7b of the
homepage plan opens with this comment:

> *Even strength mirrors `src/lib/strength.js` exactly — `KNOWN_SITUATIONS`, both
> goalies in, equal skaters. Not an approximation of it; the same eight codes and
> the same rule.*

**A comment promising to mirror is a drift vector, not a guarantee.** It is a claim
with no check behind it, which is this project's named failure mode. If
`KNOWN_SITUATIONS` gains a ninth code tomorrow — and it has already gained codes
twice — the browser and the pipeline disagree about what "even strength" means, and
the number on the card stops matching the number in the game view. Nothing would
fail.

### 2.1 The fix: one implementation, two callers

The analysis tier is **already** pure ES modules with no DOM reference — verified,
not assumed: `corsi.js`, `danger.js`, `goaltending.js`, `layer.js`, `strength.js`,
`attribution.js` and `rink.js` import only each other. Node runs them today; the
136-test suite is Node importing them directly.

So the pipeline should **call them**, not restate them.

Three mechanisms, and the choice is a real one:

**(a) Node subprocess from `derive.py`, once per run.** Derive writes extracts,
shells out to `node builders/measure.mjs <extract-dir>`, gets a metrics document
back, merges it into catalog rows. One process, not 4,553.

**(b) A separate `measure` stage in the workflow**, between derive and the catalog
write. Cleaner boundaries, but it splits the catalog write away from the stage that
owns it, and ordering bugs in this pipeline have cost us twice.

**(c) Reimplement in Python and add a differential test** that runs both over N
real games and asserts identical output.

**I recommend (a), and (c) is the one to argue against explicitly** because it is
tempting and it is how we would get burned. A differential test validates on the
games it runs — it is a rule checked against a sample, which is the sentence at the
top of `memory/mechanize-the-review.md`. It would pass for months and then not
cover the one code that diverged. **One implementation cannot drift; two
implementations plus a test can drift everywhere the test does not look.**

The honest cost of (a), stated: Node must be installed in `derive.yml` (one
`actions/setup-node` step; the gates workflow already does it), and the pipeline
gains a language boundary. That is a real cost and it is smaller than a second
copy of the domain rules.

### 2.2 What this makes explicit

The analysis tier stops being "the site's JavaScript" and becomes **the sport
model** — the one place that knows what a shot attempt is, what even strength is,
and what the shootout is not. Two consumers: the pages, and the pipeline.

Whether `src/lib` gets renamed to `core/` is cosmetic and I would **not** do it
now — it touches every import, every builder's inliner, and the byte-identity
gates, for zero behaviour. The boundary should be documented and enforced by a
test (nothing in the analysis tier may reference the DOM), not by a directory
rename.

---

## 3. Misfiled but working — worth fixing, not urgent

### 3.1 Storage lives inside the fetcher

`fetch_nhl.py` owns the network **and** the storage layout: `FileStore`,
`raw_key`, `latest_key`, `audit_pointers`, `sha256`. So `derive.py` — which must
never open a socket — imports the fetcher, with this comment:

```python
import fetch_nhl as F   # the storage layout, defined once. Imports open no socket.
```

**A comment reassuring the reader about a dependency is the tell.** The dependency
is on storage; it is spelled "fetcher" because that is where storage happens to
live. `builders/store.py` holding the keys, the store class and the pointer audit
would make `derive.py`'s imports say what they mean, and would let the store gain a
second backend without touching anything that talks to the league.

Pure move, no behaviour change, mechanical. Worth doing — after the analysis
seam, not before.

### 3.2 `derive.py` writes two documents with different jobs

The catalog is **content**; the extracts ledger is **health**. We argued hard that
those must not be conflated *in the output*, and they are not. One module writing
both, through two clearly-named functions, is a lesser thing. It becomes a real
problem only if derive also grows the analysis — which is precisely what §2
prevents.

---

## 4. Suspicions I think are WRONG

An audit that agrees with every worry is worth nothing.

### 4.1 `validate()` becoming a checklist — NOT overloading

It is at four checks and the plan adds a fifth. But `validate()` **is** the
validation gate; a list of independent named assertions is its correct shape, and
the ledger already reports `failedChecks` per check name, which is why we know
that 135 refusals are all one check rather than a mess. Adding the score-sequence
witness is using it as designed.

The thing to watch is not the count of checks but whether each one has an
**independent witness**. The SOG check has the boxscore. The new one has the
league's per-goal running score. A check that compares our derivation to our own
derivation would be the real defect, whatever module it lived in.

### 4.2 `build_main.py` at 524 lines — leave it

The largest file, and it holds the whole app template as a Python string. But it
is a generator with a byte-identity gate, a `--verify` mode, and a standing rule
that the HTML is never hand-edited. Splitting it would buy tidiness and risk the
one property that keeps `game.html` and `read-the-game.html` provably the same
renderer. Not now.

---

## 4.5 THE MISSING RULE — what goes in which document

Kevin asked two questions in a row and they have the same root:

> *Why does something called "extract" carry a game score?*
> *Why is a metric in the catalog?*

Both are right, and neither is about module size. **We have never written down what
each document is for**, so new facts land in whichever one is nearest. That is the
actual architectural gap.

The rule, derived from what each document already is:

| document | carries | does NOT carry |
|---|---|---|
| **raw** | the league's bytes, unaltered | anything of ours |
| **extract** | events as the feed records them, plus quotes from **other** documents | anything reconstructible from its own contents |
| **catalog** | identity, the league's quoted line, our verdict | our measurements |
| **index** | the pipeline's health | content |
| **measures** *(new)* | our analysis of the archive | identity, quotes, verdicts |

**Extract — "carries what it cannot reconstruct."** Events, because the feed is
authoritative. `quoted` belongs precisely because it is the **boxscore's** number:
a different document's fact, carried so the catalog builder and the validator
cannot reach for the boxscore independently and drift over which field (CHENG's
requirement, and the reason it exists). A per-goal running score is this document's
own arithmetic over goal events it already holds — so it stays out, and the witness
in §3.7c of the homepage plan reads it from the **raw**, which `validate()` is
already handed.

*Pre-existing violations, stated rather than hidden: `gshots` and `goalies` are
projections of `events` built in the same pass. Weaker than carrying a second
number, and not worth churn — but they are the same shape and must not grow.*

**Catalog — identity, quotes and verdicts.** Every field in a row today is one of
those three: `id/d/a/h/t` is what the game IS, `as/hs/ash/hsh` is the league's own
line, `v/r` is our verdict on whether we can show it. **A metric is none of them.**

Two reasons it must not go in, and the second is the decisive one:

1. **Provenance blurs.** Quoted-from-the-league fields would sit beside
   derived-by-us fields with nothing marking which is which — the exact defect
   §3.7a says no *surface* may commit. A document should not commit it either.
2. **Different lifecycles.** The catalog changes when a game is added or
   re-judged. A metric changes when **we change our minds about what "control"
   means** — and it will, since the rule has already been rewritten twice under
   review. Folding them together means a rule change rewrites all 4,553 rows of the
   document whose only job is to say what exists, and every diff stops being
   readable.

**Does this contradict CHENG's "no second document"?** No, and the distinction is
worth keeping. He killed **sharding** — splitting *the same* data across files, so
the same game can appear twice with different values. A measures document holds
*different* data under the same ids: a **join**, not a duplicate. The failure mode
is staleness relative to the catalog, which is the ordering discipline we already
run for `index.json` — advertise last, and let the ledger close.

**And start with the answer, not the table.** The homepage needs *the featured
game* and *the base rate*, not a per-game metric for 4,553 games. So the first
`measures.json` is ~1 KB: the winner, the runners-up, the **rule as text**, and the
base rate **with its n and population**. A per-game column gets added when a surface
actually needs to rank client-side — not before.

## 5. What actually changes, in order

1. **Node bridge for pipeline-time analysis** — `builders/measure.mjs` importing
   the same reducers the browser uses; `derive.py` calls it; a test asserts the
   analysis tier is DOM-free so it stays callable from both.
2. **The score-sequence witness in `validate()`**, read from the **raw** — no
   extract schema change, no re-derive for the check itself. With its mutation
   test. *Watch the refusal count: a new check can newly refuse games, and the
   settled position is to refuse rather than widen. `failedChecks` names it by
   check, so the first re-derive tells us the number immediately.*
3. **`measures.json`**, written by (1) — the featured game, the rule as text, and
   the base rate with its n and population. **Not a column in the catalog.**
4. **Then** the homepage.
5. `builders/store.py`, when convenient. Not blocking anything.

The ordering matters: doing the metric work before (1) is what produces the Python
copy of the reducers, and once it exists it will be cheaper to keep than to remove.

**Two things dropped from the previous plan** because the document rule above
removed the need: carrying the per-goal running score in the extract, and adding a
metric column to the catalog row. Both were me putting a new fact in the nearest
document rather than the right one.
