---
name: name-the-path-to-the-expectation
description: "The three-line review checklist earned on 2026-08-24 — the test-is-a-mirror rule, the two-mechanisms-one-observable rule, and the enumerate-what-was-inside-it rule. Lives in docs/status.md §H."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-24T21:02:18.004Z
---

⭐ **THE CHECKLIST, and it is PROCEDURE rather than a lesson — deliberately.**
A lesson is a thing you remember having learned. **The U1 guard was written HOURS
after fixing two defects of the identical shape**, which is evidence the class is
not detectable by intention. Only by asking the question every time. Recorded in
the repo at `docs/status.md` **§H**.

## H1 ⭐ Name the path from the code under test to the expected value. If there is only one, the test is a mirror.

CHENG's sharpening of my *"what evidence would satisfy this assertion that isn't
the thing it means?"* — better, because "the thing it means" was carrying all the
weight. **The positive form: at least one route to the expected value that does
not run the subject.**

Four checks in ONE DAY die to it:

| check | claimed | actually satisfied by |
|---|---|---|
| `derive.yml` ledger gate (D8) | the index is right | the index matching **the same run's own report** |
| *"placeholders… the script overwrites them"* | the markup holds a placeholder | a **comment** in `app.js` quoting the old label |
| *"a named game is fetched directly"* | a permalink costs one request | a fixture with no game — it ran the **failure** path |
| the U1 reachability guard | a **working** page reaches the date index | **D9's error-path markup** |

The fourth is why the rule says *name the path* rather than *have two*: it HAD a
second path and it was the wrong one.

⭐ **THE COROLLARY THAT KEEPS BITING: a check that cannot tell code from the WORDS
ABOUT the code is not a check about code.** Three times on 2026-08-24 — the D9
placeholder test passed on a comment; the D10 guard had to exclude them; and the
`draw()` bypass scan reported a bypass that did not exist because the bootstrap's
own prose explains `boot()` repeatedly. **Strip comments before scanning source.**

## H2 ⭐ If two mechanisms could be responsible for a pass, assert each where only it can be.

CHENG: *a redundancy hiding a gap, and the inverse of everything else in the
batch.* Two correct mechanisms hide the app in D9 — the synchronous hide at start
and the re-hide in the catch — and one post-settle assertion is satisfied by
**either**, so deleting one left 660 tests green. **The system was safe and the
SUITE was lying about why.**

## H3 ⭐ When you hide or move a container, enumerate what was inside it.

Third instance of *a fix for one confusion sharpening another*: the ATTACKS
arrows, the transport buttons eating the slider, and D9 hiding `#rg` — which
contains `#nextup`, **the funnel that exists specifically so the game page is not
a dead end.** D9's fix broke D3's fix and **only looking caught it**.

## And the standing one it grew out of

See [[mechanize-the-review]] for the parent failure mode and its history, and
[[looking-at-pixels]] for the cases only a screenshot could catch.

## H4 ⭐ A definition is not a use. Assert the application.

2026-08-25: I asserted the goal-line `<clipPath>` EXISTED, mutated the code to
delete the `clip-path=` attribute, and the test stayed green with both
definitions sitting there unused. **The declaration is not the claim.** Same
family as H1 — there was a path to the expectation that did not run the thing
under test, and it was the wrong one.

Its sibling, from the same day: **a probe that cannot find its subject reports
innocence.** My overlap check used a guessed selector, matched nothing, and
returned `overlaps: []`. Make the absent-subject case LOUD, not empty.

## And the one that keeps outranking all of them

⚠️ **KEVIN FOUND THE CAPTION OVERLAP IN A SCREENSHOT AFTER I HAD SHOT THAT SAME
RINK TWICE.** No checklist here would have caught it, because I was looking —
just only at the thing I had built. See [[looking-at-pixels]].



---

### H5 ⭐ A check that survives its own subject's deletion is not a check about the subject.

Added 2026-08-25, and it was caught by a mutation **seen not to fire**. Removing
the direction indicator, I guarded against over-reach with
`assert.match(app, /attackDirection/)`. Gutting `shotDir` left it green: the
identifier appears throughout the inlined library and in prose.

**The response that was right: delete the check, and record the measurement that
makes it unnecessary.** Stubbing `attackDirection` to return 1 reddens six tests
across goaltending, danger and rink — it is well guarded where it is USED, so a
weak restatement adds no coverage while reading as some.

Two companions from the same day, both in [[mechanize-the-review]]:

- **A fixture that does not contain the change under test proves nothing about
  it.** A `--depth 1` clone carried the COMMITTED tool, not the edit being
  tested, and reported the pre-change behaviour.
- **"The environment could not check this" and "this claim is false" must not
  share an exit code.** refcheck exits **3** on a shallow clone, because
  conflating them sends the next reader to edit a correct file.
