---
name: workshop-inventory
description: "✅ RESOLVED 2026-09-17: the Workshop and the goaltender's-eye view are DELETED (Kevin: 'we removed the surfacing ... shouldn't they be removed from the source code?'), with figTabletop, build_gv.py, figure-bench.py and their tests. Resurrection recipe in docs/status.md. ⭐⭐ The orphan test existed and had a hole: it counted links from UNLISTED pages, so one exemption excused two more. terrain-3d.html and read-the-game.html still await Kevin's ruling. ⏭ 2026-09-17 a THIRD one, same shape: droppedForStrength, no caller for ten days under a comment saying it was live."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-01T12:27:57.302Z
---

## ✅ RESOLVED 2026-09-17 — DELETED, with a way back

Kevin, from the live site: *"we removed the surfacing of the goalie eye view and the mascot stuff a while ago,
shouldn't they be removed from the source code?"* Measured before deciding: the Workshop's link left the chrome
2026-09-08, it was the ONLY page linking `goalie-eye-view.html`, and the goalie view was the only surface that
could select `figTabletop` — which was therefore shipping unreachable in `game.html` and `read-the-game.html`
(3,161 bytes each, in 739 KB / 811 KB files) because `figStyle` is the constant `'mascot'`.

**Gone:** `src/goalie-eye-view.html`, `src/workshop.html`, `builders/build_gv.py`, `tools/figure-bench.py`,
`figTabletop` + the `rtg.fig` preference, `test/goalie-view.test.js`, the Workshop builder in `build_index.py`.
**⏭ May come back** (Kevin asked for the note): `git log -S goalie-eye-view`, `git log -S figTabletop`, and
`git show <commit before the deletion>:<path>`. `svgpen.js` still implements `clip()`, which the tabletop
jersey stripes needed. It was never wrong — it had no door.

⭐⭐ **THE TEST EXISTED AND HAD A HOLE.** `test/index.test.js` catches orphan pages and made the Workshop's
exemption a written ledger entry in the first place — but it collected links from EVERY page, unlisted ones
included, so the unreachable Workshop kept `goalie-eye-view.html` and `terrain-3d.html` looking linked. **One
page's exemption silently excused two more.** The walk is transitive from `index.html` now, with a control.
⭐ **A COMMENT IS NOT A CHECK:** `marks.js` asserted "figTabletop is NOT dead code" while nothing could call it.

⏭ **OPEN FOR KEVIN:** `terrain-3d.html` (door deleted) and `read-the-game.html` (deployed, unreachable; 35 test
files read it FROM DISK, which does not require publishing). And the rules he asked for next: an unlisted entry
that EXPIRES, a test that may not name a missing page, and ⭐ RUNTIME COVERAGE (not static analysis — the call is
`FIG[figStyle]`, a computed key) reporting never-executed functions behind a ratchet. See [[defect-corpus-evidence]].

---

# ✅ DONE 2026-09-08 — the link went, the page stayed

Kevin: *"let's remove the link (thereby removing visitor access to it) and then
discuss goalie-eye-view."* One line out of `_NAV` in `builders/page.py`.
`build_workshop()` still runs and `src/workshop.html` still deploys — reachable by
typing the URL and by nothing else.

⭐ **`no page in src/ ships unlinked` went red, exactly as its own comment says it
should** — *"if a page is deliberately unlisted, this test is where that decision
gets made explicitly rather than by omission."* So it is on a NAMED ledger with
Kevin's reason, guarded three ways: an entry whose page is gone errors, an entry
whose page IS linked errors, and a page NOT on the ledger is still reported.

## ⛔⛔ AND ONE OF THE THREE ROWS CANNOT BE DELETED AT ALL

| row | what it actually is |
|---|---|
| **`read-the-game.html`** | ⛔ **NOT a prototype.** `build_main.py` builds it, `test/helpers/page.js` boots it, and **35 test files import that helper**. Deleting it takes the suite. |
| **`goalie-eye-view.html`** | Deletable — and a **different call**, which is why it is still open. |
| **`terrain-3d.html`** | Clean. No test names it. |

⏭ **`goalie-eye-view` IS THE NEXT CONVERSATION.** Kevin: *"once all that gets
squared away we can discuss the goalie-eye-view."*


Kevin, 2026-09-01: *"once we integrate active plays into the main app (assuming
we do), I don't think we need any of the other pieces from Workshop and I'd like
to delete that link. That said, please make a note in memory as to what features
we had in that area, maybe something like the Goalie View we can use in the
future (or at least an improved version of it)."*

## ✅ DONE 2026-09-03 — `active-play`, `on-the-ice`, `goalie-view` REMOVED
Kevin: *"let's take those out for now, there's several bits in there I'll want to
revisit, but for now let's get everything aligned properly (to support cold
reviews of the code/documentation)."* Commit **7b17715**; `build_A/B/C.py`, the
`build:rest` entries and the `WORKSHOP` rows went with them. **In git history —
nothing else is needed to get them back.**

⭐⭐ **THE DOCTRINE MOVED FIRST, and this is the transferable rule:
LOAD-BEARING DOCTRINE MUST NOT LIVE ON A PAGE THAT CAN BE DELETED.**
`learn-figures.mjs` cited `on-the-ice.html`'s banner in **two** places to refuse
drawing a formation. It is **DOCTRINE §5** now — always its real home.

⚠️ **B8's OWN GATE HAD EXPIRED WITHOUT BEING RE-EXAMINED** — *"do NOT start…
`active-play.html` is the reference for that port"*. True when written, false by
2026-09-03: **`docs/active-player.md` is 364 lines** and a far better spec, and
the line has shipped. **The premise moved and the conclusion did not.**

⭐ **Coverage CHECKED, not assumed:** 979 → 964, and **all 15 are
`document.test.js`, 5/page × 3** — every other suite identical, counted on both
trees. Also: the tier-table gate added the day before **caught this on its first
real outing** (presentation 4,134 → 3,848).

⏸ **THREE REMAIN** — and two must never be deleted; see below.

## ⚠️⚠️ TWO OF THE SIX ARE NOT WORKSHOP EXPERIMENTS — DO NOT DELETE THEM
- **`read-the-game.html` (649 KB)** is the reference game **compiled in, working
  offline**, and it is built by **`build_main.py` — the SAME builder as
  `game.html`**. It is a second output of the main app, not a prototype. When I
  extracted `goalieGlyph` this file changed alongside `game.html`; anything that
  edits the main app edits it.
- **`src/lib/figures.js` + `src/lib/svgpen.js` are LIVE**, in `build_main.py`'s
  `LIB` list. The goalie's-eye view is what *paid* for them, but the main game
  page draws its shot figures through them today. **Deleting the page must not
  touch the libraries.**

## The six, and what each one actually taught
| page | builder | reads from the extract | the idea |
|---|---|---|---|
| `active-play` | `build_A.py` | `events` `roster` | the puck between whistles **and who touched it** — the one being promoted |
| `on-the-ice` | `build_B.py` | `events` `roster` **`shifts`** | who was actually out there, from shift charts; lines change, strength flips on a penalty |
| `goalie-view` | `build_C.py` | **`goalies` `gshots`** | save-by-save: *"Minnesota outshot Buffalo and lost. This is the reason why."* |
| `goalie-eye-view` | `build_gv.py` | `data/goalie_sub.json` | **first person from the crease**, six seats, drag to look around |
| `terrain-3d` | `build_3d.py` | shot coords | kernel-density terrain — **height is attempts, never danger** |
| `read-the-game` | `build_main.py` | — | ⚠️ see above — not an experiment |

## ⭐ THE PART WORTH KEEPING IS THE DOCTRINE, NOT THE CODE
Every one of these pages states its own limit on its own face, and those
sentences are now quoted across the live app:
- **on-the-ice**: *"players are arranged by role (goalie · defense · forwards),
  not by tracked position — real skater coordinates aren't public, so we don't
  fake them."* This is the banner `learn-figures.mjs` quotes to refuse drawing a
  formation on the empty-net figure. **It is load-bearing doctrine that happens
  to live on a page we are about to delete — move the sentence before the page
  goes.**
- **active-play**: *"the puck jumps between real events; we don't draw a path
  between them, because that path isn't tracked and we won't invent it."*
- **goalie-eye-view**: *"we do not draw the puck's path, its height, or where in
  the net it went — none of that is in the data."*
- **terrain-3d**: *"height means shot volume from that spot, not expected goals:
  we don't invent a dimension we don't have data for."*
- **goalie-view**: *"the shaded area is the slot, which we define geometrically,
  so you can see it rather than trust it."*

## ⭐ KEVIN NAMED THE GOALIE VIEW AS THE ONE TO REVIVE
*"maybe something like the Goalie View we can use in the future (or at least an
improved version of it)."* Two different pages carry that name and they are not
the same idea — worth being explicit when it comes back:
- **`goalie-view`** is a 2D shot map per goaltender (`goalies`/`gshots`), and its
  save-by-save framing is the strongest *narrative* on the site: a team can
  outshoot and lose, and here is the reason. The main app already has a
  goaltending layer and goalie cards (`src/app.js:848`), so this is the closer of
  the two to already existing.
- **`goalie-eye-view`** is the first-person one, and it is the genuinely
  irreplaceable idea: *"close, dangerous shots loom large, the way they do for a
  goalie."* It is the only thing on the site that teaches DANGER as something
  felt rather than counted. If one comes back, this is the one.

## ⚠️ DATA THAT GOES UNUSED THE DAY THESE GO
`shifts`, `goalies` and `gshots` ship in **every** extract and, once these pages
are gone, `shifts` has **no reader on any public surface**. That is not a reason
to keep the pages — but it is a reason not to drop the fields from
`builders/extract.py`, because re-extracting a season is not free and K3 ("who's
on the ice") is still on the build list.

Related: [[active-player-artifact]] · [[hockey-legibility-build]] ·
[[layer-ideas-and-taxonomy]] · [[build-list-drift]]


## ⏭ AND A THIRD, FOUND THE SAME WAY — 2026-09-17 (`5cab334`)

Row 8's measurement asked of each surviving escape *what could a planted defect in this possibly change*, and
`droppedForStrength` (`src/lib/layer.js`) answered nothing: **no caller since 2026-09-07**, when Kevin's *"no
strength chips"* call (`4ed08c2`) removed the sentence it fed. It stayed exported, under a comment still
reading *"THIS IS THE NUMBER UNDER THE SITUATIONS CONTROL"* — the `figTabletop` shape exactly: the surface
went, the code stayed, a comment kept claiming it was alive. `builders/figures.py` went with it (nothing has
imported it since the figure JS moved to `src/lib/figures.js`; its docstring still described two styles and
two deleted pages).

⚠️ **THE SWEEP THAT FOUND THEM WOULD HAVE DELETED A LIVE ONE.** `disputedCount` in `src/lib/archive.js` looks
just as orphaned to an import-graph walk and is alive — `build_index.py` inlines it as a STRING into
`index.html` and `calendar.html`. Cousin of `FIG[figStyle]`, and why Kevin's rule 3 is runtime coverage.
See [[defect-corpus-evidence]] and [[mechanize-the-review]].
