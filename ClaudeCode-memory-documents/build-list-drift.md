---
name: build-list-drift
description: docs/status.md is a cache of the code and goes stale silently. The row-by-row pass is DONE (2026-08-23) — 31 rows checked, 29 verified, and C3 and C6 both turned out to be the B3 shape.
metadata:
  type: project
---

**`docs/status.md` is the build list and it is a CACHE OF THE CODE.** It goes
stale silently, because it is prose and **prose cannot be compared to code by
anything but a person remembering to.** C9 generates exactly one line of it (the
health block); nothing generates the rest and nothing can.

## ✅ THE ROW-BY-ROW PASS IS DONE — 2026-08-23, recorded as §G

**All 31 rows checked against the repo, the live artifacts or a cited commit.
29 verified as written.** Every cited commit exists and touches what it claims.

⭐ **Two material findings, BOTH the B3 shape — a row describing as unbuilt
something already on disk.** That direction is the dangerous one: the other
announces itself (you go to build it and it isn't there) while this one gets
built twice, or ranked as though the hard part were still ahead.

- **C3** omitted that **`src/on-the-ice.html` has been shipped all along** —
  91 KB, built by `builders/build_B.py`, listed in the workshop. It already
  renders the real players on the ice from shift data **and already carries the
  doctrine answer** in a banner: *"arranged by role, not by tracked position —
  real skater coordinates aren't public, so we don't fake them."* That is E1's
  refusal-on-doctrine, live. C3 is therefore not *"can we do this honestly"* —
  settled and demonstrated — it is *"the prototype reads one compiled game and
  the archive needs a reducer."*
- **C6** is not *"teach offside"*: `what-you-can-see.html` already has an
  offside door into a real call stating its own limit. What is left is **drawing
  the crossing the feed does not record**, which ranks against C3's skater
  positions and E1's figures. **Proposed for closure to §D, not ranking.**
- **C7's own warning re-verified**: `3,250` appears exactly once in the whole
  repo, in its own cell, and `#rg.preview .verdict` really is in the hide list.

## The earlier drift that prompted it

B3 was already shipped and the row said otherwise; C2/C8 were one job split
across two rows; B2 was mostly built; C1's own entry was false before that.
**Of the four items Kevin picked in one sitting, two were entries rather than
work.**

## What has been added since

§F (what the week cost), §G (this pass), **§H** (the review checklist — see
[[name-the-path-to-the-expectation]]), and **§U** (usability, ranked by how
early in a visit an item is hit — a different criterion from C's correctness
risk, which is why it is a separate section).

See [[hockey-legibility-build]] for what is shipped and what is open.
