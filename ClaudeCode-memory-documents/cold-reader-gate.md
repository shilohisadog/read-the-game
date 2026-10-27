---
name: cold-reader-gate
description: "★★ Kevin's gate: 'what would a cold reader think of our artifacts?' — applied to the REPO 2026-09-04 (CHENG and Kevin never introduced; no legend for ⭐/⚠️/⛔) and to a PAGE 2026-09-23, where he stopped reading how-we-measure.html because it was written in house vocabulary. ⭐ For a project whose pitch is CHECK OUR WORK, a legibility defect IS a correctness defect — a reader who must learn our words first cannot check our work."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-04T14:49:30.433Z
---

Kevin, 2026-09-04, after a run of findings made him ask whether the higher-level
architecture was really sound: **"one of the real gates here is: what would a cold
reader of the repo think of our artifacts?"**

**Why:** open source is a stated goal — *"I hope we have tons of people reviewing
the code and documentation."* A repo whose entire product claim is *check our
work* fails at the product, not just at tidiness, when a stranger cannot follow it.

**How to apply:** ⭐ **walk the real entry path — README → `docs/README.md` →
`architecture.md` → `CONTRIBUTING.md` — instead of speculating about it.** That
is what turned an unanswerable question into three findings in twenty minutes.

## What the walk found

✅ **The entry path holds up.** README opens with the product and the example
game, CONTRIBUTING says how to run everything with no install, and `docs/README`
triages 43 documents with an explicit *"a document here is a moment unless it says
otherwise."*

⛔ **`CHENG` appeared in 40 documents and `Kevin` in 37, and NEITHER WAS EVER
INTRODUCED.** A stranger reading *"CHENG's ruling on as-played ends"* cannot tell
whether that is a colleague, a consultant, a standard or a tool. Both are
introduced in `docs/README.md` now — and ⭐ **the CHENG entry states that the
reviewer and the author share a base model**, because describing an adversarial
review without that overstates the independence of every ruling recorded.

⛔ **~1,700 uses of ⭐/⚠️/⛔ with no legend anywhere.** Now defined in
`CONTRIBUTING.md` as three KINDS OF CLAIM (a finding, a defect we shipped, a
prohibition) rather than severity levels. ⭐ **Counting them found a FOURTH
convention I had not noticed** — ✅, 79 uses, meaning shipped-and-verified.
`test/legends.test.js` requires any glyph used >40 times to be in the table, so a
fifth convention forces a decision instead of arriving silently. **40 is not
tuned: the four documented marks run 1,020/531/141/79 and the next glyph is 16.**

## ⭐ The separation this settled
When Kevin worried the high-level architecture was not as sound as we thought:
**the structure is verified; its DESCRIPTION drifts.** Both false claims in
`architecture.md` were stale prose about correct, instrumented code — and both had
been corrected somewhere else, with the correction never walking back. ⭐⭐ **A
document that quotes the system is a cache of the system** — `status.md` §F's own
finding, arriving in the file that describes the architecture.

Related: [[architecture-audit-2026-09]] · [[doc-claim-integrity]] ·
[[hockey-legibility-build]] · [[feedback-argue-the-opposite]]

---

## ⭐⭐⭐ THE SAME GATE, APPLIED TO THE SITE — 2026-09-23

The walk above was about the REPO's cold reader. Kevin applied the identical test
to a PAGE, and it failed harder. On `how-we-measure.html`, the page whose whole
job is to let a stranger check our work:

> *"I started reading the how we measure page but stopped pretty quickly. We need
> to change the subject of the wording, currently it's not really in a public
> facing tone, it's more of an internal type phrasing… Like the title of the first
> blurb is '…if it settles…', I doubt a novice hockey fan is going to grasp what
> 'settles' means right away… let's not talk 'down' to anybody, that's not what
> I'm saying, but we need to reframe the audience of the page."*

⛔ **WHY IT IS THE SAME DEFECT AS A NAKED NUMBER, not a style note.** The page
exists so a reader can check our work. A reader who has to learn OUR vocabulary
first cannot check our work — so the house wording defeats the page exactly as
completely as having no page would. *Legibility defect = correctness defect*, one
level down from the repo.

⚠️ **AND I COULD NOT SEE IT, because I had written every one of those words.**
The words that went: *settles, admission rule, club row, league row, reliability,
chronological, centred, club-season, denominator, orthogonal.* Every one felt
precise to me and every one is a term this project invented or borrowed.
"A figure describes a CLUB only if it settles inside half a season" became
**"Is that the team, or is it just ten games?"** — same claim, no new vocabulary.

⭐ **THE DURABLE FORM IS A WORD LIST, CHECKED AGAINST WHAT A READER SEES.**
`test/methods.test.js` renders the page and scans the visible text for those
terms. Tone cannot be asserted; the specific words that made it unreadable can be,
and they are the ones that creep back. ⛔ It scans the RENDERED text, not the
source — a source scan trips over `measures.settle` and `policy.admission`, which
are identifiers a reader never meets, and a check that cannot tell those from
prose gets weakened until it says nothing.

⚠️ **AND "not talking down" is the other half of the instruction.** The fix is
shorter words for OUR concepts, never fewer concepts. The page still publishes the
correlation matrix, the sensitivity of the answer to our own policy choices, and
seven criticisms with four conceded — it just stops making a reader earn them.

Related: [[show-the-work-or-do-not-print-it]] (the rule this page serves),
[[feedback-no-question-dialogs]], [[preview-what-to-watch-for]].


## ✅ THE VOCABULARY GATE FIRED ON MY OWN COPY — 2026-10-07

The player block's sentence read *"each his **club's** leading goalscorer"* and
`no page calls a team a club` turned red. **The house word for a reader is TEAM;
club is what we say to each other and in the code.**

⭐ Worth recording because it is the cheapest kind of gate that works: a
vocabulary rule is the thing everybody forgets *while writing a sentence*, which
is the one moment the rule is not in mind. Nothing about the code was wrong and
no reasoning would have caught it.
