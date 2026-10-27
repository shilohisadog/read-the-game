---
name: feedback-comments-not-narrative
description: Kevin's rule (2026-10-12): code comments say WHAT and a one-line non-obvious WHY or trap — never narrative (quotes, dates, how a defect was found, measurements). Overrides the old house style of essay comments.
metadata:
  type: feedback
---

A comment says what the code does when that is not obvious, plus at most a
one-line "why" for a non-obvious choice or a trap ("an absent field is not a
zero"). History, who said what, dates, defect stories and measurements belong in
the commit message or `docs/`, with at most a pointer from the comment.

**Why:** Kevin, 2026-10-12, on seeing that 71–81% of src/ and builders/ is
comment (app.js quotes him 142 times): *"don't think (excessive) narrative
belongs in code comments"*. The essays also shipped to readers inside the built
pages (~600 KB of the game page's 784 KB of script).

**How to apply:** write new comments this way from now on, even where the
surrounding file is still essay-style — do NOT "match the surrounding comment
density". Put the reasoning in the commit message. Trimming the existing 1.4 MB
is its own item on the data-model fix list ([[data-model-review]]): file by
file, checking each trimmed rationale already lives in a commit or doc, and
fixing the tools that read comments (tools/quoted-figures.mjs writes figures
INTO src/lib comments; nine tests read source files).
