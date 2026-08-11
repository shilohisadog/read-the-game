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

## 5. What actually changes, in order

1. **Node bridge for pipeline-time analysis** — `builders/measure.mjs` importing
   the same reducers the browser uses; `derive.py` calls it; a test asserts the
   analysis tier is DOM-free so it stays callable from both.
2. **Then** the extract/validate work from `docs/homepage.md` §3.7c — carry the
   per-goal running score, add the witness with its mutation test.
3. **Then** the tied-state metric into the catalog, computed by (1).
4. **Then** the homepage.
5. `builders/store.py`, when convenient. Not blocking anything.

The ordering matters: doing (2) and (3) first is what produces the Python copy of
the reducers, and once it exists it will be cheaper to keep than to remove.
