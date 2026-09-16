# The defect corpus — what broke, who found it, and what knew the answer

**Written 2026-09-16. A frozen snapshot, not a live ledger.** It exists to decide
the test program's architecture against evidence rather than against which
argument sounds more architectural — and because the two reviewers in that
discussion (CC and CHENG) are the same base model, so their agreement is weak
evidence on its own.

**FOR A READER ARRIVING COLD.** This repo builds a hockey replay site. On
2026-09-16 Kevin (the owner) asked how the test program *should* be architected,
starting from the project's documentation rather than from the existing
`test/`. The answer began by turning the project's written history into data:
every documented defect, in one shape, with who found it and what could have
known the right answer.

---

## 1. What is in it

`docs/defects/` — one JSON object per line, one line per defect.

| file | extracted from | entries |
|---|---|---:|
| `git.jsonl` | all 577 commit messages, subjects and bodies | **420** |
| `docs-status.jsonl` | `docs/status.md`, all of it | 203 |
| `docs-data-layers.jsonl` | 20 design docs on data, layers and cards, plus `README.md`, `CONTRIBUTING.md`, `DOCTRINE.md` | 107 |
| `docs-below-mobile.jsonl` | the below-the-rink, mobile and looking-at-pixels docs | 101 |
| `docs-app-architecture.jsonl` | 16 docs on `app.js`, deep links, timing, architecture and tests | 97 |
| `docs-frontdoor-replay.jsonl` | 9 docs on the front door, discovery and the replay | 87 |
| `notes.jsonl` | the developer's own notes | 553 |

**Every field:** `slug`, `what`, `surface`, `date`, `shipped` (live /
committed / pre-commit / unknown), `found_by`, `missed_by`, `nature`, `oracle`
(what actually knows the right answer), `source`, `quote` (≤ 25 words, verbatim).

**What counted as a defect:** something actually wrong in code, data, a published
figure or sentence, a document, the deployed site — or in a CHECK itself (vacuous,
mis-scoped, unable to fail). Design disagreements, declined proposals and rulings
that reversed a design were excluded unless something was factually wrong.

⚠️ **THE FILES OVERLAP.** One incident is often in a commit, a doc and the notes.
Each extractor recorded an incident once *within its own file*; nothing was
deduplicated across files. **Never sum the files.**

`node tools/defect-corpus.mjs` validates the corpus and prints every table below;
`--check` validates only and exits non-zero on a malformed line, a source outside
its file's scope, a duplicated slug, or a slug in `docs/defects/unsure.json` that does not exist.
Each of those four was mutated into the corpus and seen to fail before this was
committed.

## 2. Which population to read

**The commits are the primary population.** Each entry is a fix that landed in
`main`, and its extractor checked every hash, date and quote against git by
script. **201 of the 420 reached the live site.**

The docs and notes (1,148 entries) are the cross-check. They overlap the commits
and each other, and they include catches made *before* a commit — which the
commit history structurally cannot.

## 3. The headline, as extracted

**Who found the 201 defects that reached the live site:** Kevin looking at or
asking about the site 102 · model review 66 · browser checks 15 · mutation,
CI gate and pipeline alarm 2 each · unknown 12 · **the unit test suite 0**.
⚠️ Only the **Kevin / not-Kevin** split survived the human relabel (§4.1); read
the rest as the extractors' account, checked against commit text but not by a
second reader.

⛔ **WHAT KNEW THE RIGHT ANSWER IS NOT QUOTED HERE, ON PURPOSE.** The `oracle`
field was extracted and is in the files, but it did not survive a blind human
relabel (§4.1). An earlier version of this section sized test layers from it —
*about half of what shipped needed a browser or a human eye* — and that sizing
is withdrawn. `node tools/defect-corpus.mjs` still prints the table, beside the
relabel result.

**What kind of defect, all 420 commits:** defects in a CHECK 126 (the largest
class) · a false claim 84 · layout or visibility 49 · rendering or wiring 27 ·
doc drift 26 · interaction 18 · feed interpretation 15 · build tooling 12 ·
deploy and hosting 12 · stale derived data 8 · metric logic 8 · other 35.

## 4. How far to trust it

### 4.1 ⛔ A blind human relabel, and the labels did not all survive it

Kevin labelled 30 random commit entries (excluding the 16 spot-checked below)
with the extractor's labels **sealed** until he had finished:
`docs/defects/relabel-2026-09-16.md` is his sheet, `docs/defects/relabel-2026-09-16-key.json`
beside it is what was sealed, and the tool scores one against the other.

| question | agreement |
|---|---|
| found by — Kevin versus anyone else | **20 of 26** |
| found by — Kevin / model review / an automated check | 9 of 26 |
| could have known — coarse (visual / data / code / production) | 14 of 25 |
| could have known — eight categories | **2 of 25** |
| a real defect at all? | yes 22 · unsure **8** · no 0 — the extractors had flagged 1 of those 30 |

**What the disagreements were made of, read against the commit text:**

1. ⭐ **`found_by` conflates who PROMPTED a finding with what DETECTED it.** In
   three entries Kevin asked a question and CC's audit or measurement found the
   defect; the extractor recorded Kevin, Kevin recorded the detector. Both are
   right about different things. **The field needs to be two fields.**
2. **"Model review" versus "automated check" held for the extractor**: on 7
   disagreements read against their commits, the commit names CHENG's review or
   CC's audit or measurement on 6. The page's owner has no way to see which of
   the developer's activities surfaced a defect — that is visibility, not error.
3. ⛔ **`oracle` is a COUNTERFACTUAL, and two readers could not apply it.** *What
   could have known the right answer* is not written in any commit; it is a
   judgement about a check that did not exist. The sharpest disagreement is the
   one that matters most to a test architecture: **on all 4 entries Kevin said a
   real browser could have caught, the extractor said only a human eye.** That
   is precisely the line between an automated browser layer and a human review
   layer, and it cannot be drawn by labelling. **It has to be drawn by
   experiment** — build the check and see whether it goes red.
4. **8 of 30 were not clearly defects to a human reader**, against 1 of 30 the
   extractors flagged. The corpus is looser than its own `docs/defects/unsure.json` says.

⚠️ **n=30 supports "broadly reliable or not", never a percentage** — the
interval on 20 of 26 is wide.

### 4.2 Everything else

- **Every label is one model's judgement.** A random 16 commit entries were read
  beside their commits by the same model: `found_by` agreed on **15**, `oracle`
  was defensible on about **13**. ⛔ **§4.1 shows what that self-check was worth
  on `oracle`**: a check made by the labeller agreed with the labeller.
- **143 entries are flagged** in `docs/defects/unsure.json` — the extractors'
  own list of design calls, conversation-only claims, drafts that never shipped
  and thinly described incidents. They are counted above.
- ⛔ **SURVIVORSHIP.** The commit history records what ESCAPED. A defect the unit
  suite caught before a commit leaves no trace, so *"the suite found 0 of 201"*
  cannot distinguish a useless suite from one quietly preventing a great deal.
  The docs and notes credit it with 70 of 1,148, but nobody writes up a red test
  fixed in a minute. **Nothing may be deleted on this corpus alone.**
- **Six weeks, UI-heavy.** 2026-08-07 to 2026-09-16, mostly layout and teaching
  surfaces. The season opens 2026-09-29 and the mix will likely move toward the
  data and its claims.
- **Detection, not incidence.** This project audits its checks unusually hard;
  "30% of fixes were to checks" may measure that habit as much as the checks.
- ⚠️ **`notes.jsonl` cites files outside this repo** (`memory/…`), so a reader
  cannot verify those 553 entries. Its figures are shown separately for that
  reason.
- ⚠️ **The extraction had a collision.** The seven extractors shared a scratch
  folder and a helper script of one name overwrote another's, sending entries to
  the wrong file for a time. Each file was afterwards checked for exact count and
  source scope, and `--check` now enforces the scope permanently. One extractor
  could not rule out losing lines in a short window before its final check.

## 5. What comes next

1. ✅ **A human relabelled 30 random entries** — §4.1. `oracle` did not survive.
2. **The survivorship experiment** — mutate decisions in `src/app.js` and record
   which layer catches each: the node suite, a browser journey, or nothing.
   ⭐ **After §4.1 this is no longer a side question.** It is the only instrument
   left for what `oracle` was meant to answer — which kind of check catches what —
   and it answers by running checks rather than by labelling them.
3. Then the test-program architecture, for CHENG's review, with this corpus
   attached.
