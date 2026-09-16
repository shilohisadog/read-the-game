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

**What knew the right answer for those 201:** a human eye 49 · a real browser 48
· the league or the archive 29 · the repo 23 · an app decision 22 · a definition
or hand count 11 · production 10 · a measurement 3 · a novice 3 · other 3.

**What kind of defect, all 420 commits:** defects in a CHECK 126 (the largest
class) · a false claim 84 · layout or visibility 49 · rendering or wiring 27 ·
doc drift 26 · interaction 18 · feed interpretation 15 · build tooling 12 ·
deploy and hosting 12 · stale derived data 8 · metric logic 8 · other 35.

## 4. How far to trust it

- **Every label is one model's judgement.** A random 16 commit entries were read
  beside their commits: `found_by` agreed on **15**, `oracle` was defensible on
  about **13**. Quote category-level shares, never decimals.
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

1. **A human relabels ~30 random entries** — the only check on these labels that
   is not correlated with the model that made them.
2. **The survivorship experiment** — mutate decisions in `src/app.js` and record
   which layer catches each: the node suite, a browser journey, or nothing.
3. Then the test-program architecture, for CHENG's review, with this corpus
   attached.
