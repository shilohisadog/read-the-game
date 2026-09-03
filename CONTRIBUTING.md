# Contributing

This project has an unusual bar, and most of it is about **checks** rather than
code. That is worth stating up front, because a reasonable, well-written change
can still be wrong here for reasons that would pass review almost anywhere else.

[`DOCTRINE.md`](DOCTRINE.md) is the **product** bar — what this site is willing
to claim to a reader. This file is the **engineering** bar. They are separate
and both apply.

---

## Running it

You need **Node 20+** and **Python 3.10+**. There is nothing to install: the
site ships zero runtime dependencies, and the test suite is `node --test` and
`unittest`. No framework, no bundler, no lockfile to resolve.

```
npm run gates      # everything CI runs, in order
npm test           # the JS suite alone
npm run test:py    # the Python suite alone
```

`npm run gates` builds the site, runs both suites, checks every documentation
citation resolves, verifies the generated blocks in `docs/status.md` and
`docs/architecture.md` are not stale, re-runs the extractor's own gates against
stored feeds, and rebuilds to confirm the output is **byte-identical**. If it
exits 0, the artifact in `src/` is reproducible from source.

**`src/*.html` is generated — never edit it.** `builders/*.py` is the source.
Editing the HTML directly has broken this project before; the byte-identical
gate will catch you, but it will cost you the round trip.

`tools/pixels.sh` runs a real browser locally. **The unit suite is blind to
layout by construction** — the fake DOM has no CSS, so `display: none` is
invisible to it. Anything about size, position or visibility has to be looked at.

Start with [`docs/architecture.md`](docs/architecture.md). It has the shape of
the system, the one place that shape breaks, and §3 collects the four decisions
that look like oversights and are not.

---

## What counts as a valid check

Every line below was paid for by a defect that shipped past a green suite. They
are phrased as questions because the failures are not detectable by intention —
one of them was re-broken *hours* after being written down.

### 1. Name the path from the code under test to the expected value. If there is only one, the test is a mirror.

The positive form: **at least one route to the expected value that does not run
the subject.** Four checks died to this in a single day, each of which read as
thorough:

| the check claimed | what actually satisfied it |
|---|---|
| the published index is right | the index matching **the same run's own report** |
| the markup holds a placeholder | a **comment** quoting the old label |
| a permalink costs one request | a fixture with no game — it ran the **failure** path |
| a working page reaches the date index | the **error path's** markup |

The fourth is why the rule says *name the path* rather than *have two*: it had a
second path and it was the wrong one.

**Corollary, which keeps biting: a check that cannot tell code from the words
about the code is not a check about code.** This repo comments heavily. A scan
that greps source will match prose. It happened three times in one day, and
again in `tools/tiers.mjs`, which matched the English word "document" in a
comment and reported ten pure modules as impure.

### 2. If two mechanisms could be responsible for a pass, assert each where only it can be.

Two correct mechanisms hid an element — a synchronous hide at start and a
re-hide in a catch — and one assertion after both was satisfied by **either**.
Deleting one left 660 tests green. The system was safe and the suite was lying
about why. **Anywhere two things produce one observable, a test on the
observable proves neither.**

### 3. A check you have not seen fail is not a check.

Change the code so the check *should* go red, and watch it. If it stays green,
you have learned something more valuable than the feature.

This is not ceremony. A mutation harness once disarmed all three of
`derive.py`'s alarms and **150 tests stayed green**, because a test named
`..._goes_RED_...` asserted the ledger and never the exit code. **When a name
promises an outcome, assert the outcome — and if the outcome is unreachable
from a test, that is the bug.**

### 4. When you hide or move a container, enumerate what was inside it.

Three separate times a fix for one problem broke a neighbour that happened to
live in the same element. The most recent took the caption pill offscreen — the
surface that announces a penalty, an unplaced goal and a slot shot.

### 5. A rule derived from a sample is still a sample.

The single most repeated defect here. A list of values built from the games you
happened to look at will be missing the ones you did not, and it will fail
**silently**, because absent-from-the-list looks identical to nothing-happened.
Decode the input where you can. Where you genuinely cannot, prefer a
**decline-list over an allowlist**: an allowlist fails quietly on what it omits,
a decline-list fails loudly.

### 6. Guard where the whole population is walked, and alarm on drift.

A value the league controls needs a check where the **entire archive** is
walked, not a unit test holding last season's answer — which is a constant that
drifts. Alarm when something *new* appears, never on the count: twenty-three
known values are not news, a twenty-fourth is. **Loud in the pipeline, never in
the artifact** — the data is usually correct and what is missing is a name.

### 7. Any number in a comment, a docstring or a document is a claim.

The truth of this project's claims *is* its quality; the code is the substrate.
A docstring that describes behaviour the function does not have is a defect,
and no linter will ever find it. One in `strength.js` documented the exact
opposite of its own code, on the function five of six layers call.

**Numbers in prose drift.** If a document states a count, generate it — see
`builders/health.mjs` and `tools/tiers.mjs`, both of which are checked by the
gates. A tier table that was typed by hand was off by 5.3× within three weeks.

### 8. Carry the denominator.

Any figure, in a PR description or a comment, states what it is *of*. "91
refusals over 2,793 events in seven fixtures — a fixture figure, not an archive
one" is a usable sentence; "3.3%" is not. A share with no base rate beside it
can be perfectly correct and still lose the argument.

---

## Opening a pull request

- **Run `npm run gates`.** It is what CI runs; there are no other checks.
- **Say what would have caught the bug**, not only what you changed. If the
  answer is "nothing," that gap is the more interesting half of the PR.
- **Show a check failing before it passes**, per rule 3.
- **Carry your denominators**, per rule 8.
- Commit messages here are long and explain *why*. `git log` is a design record
  and is meant to be read; matching that style is welcome but not required.

**A PR that adds an instrument for a claim we already publish is always
welcome,** even with no code change attached. Of roughly forty-nine factual
claims on the live pages, only some have something that goes red when they stop
being true. Closing that gap is the most useful work available.

## Reporting something wrong on the site

A wrong number is the most serious bug this project can have. Include the game
URL — they are deep-linkable to the exact frame — and what you expected. You do
not need to know why it is wrong; *"this says Toronto had a shot blocked at the
wrong end"* is a complete and genuinely useful report, and one of that shape
found a real attribution defect.
