---
name: discovery-c1
description: C1 the date browse — BUILT and LIVE 2026-08-21 at readthegame.co/calendar; its premise was false, and the re-RANKING is still Kevin's call
metadata:
  type: project
---

**✅ BUILT AND LIVE 2026-08-21** — `readthegame.co/calendar`, plus *"Or browse
by date →"* under the chips on the front door. Full record in
`docs/discovery.md` §11; the build-list entry is `docs/status.md` C1.

**Its premise was FALSE and stays corrected:** `status.md` said *"4,553 games
cannot be asked for"* while a team browse already reached **93.3%** of published
games in three clicks. What C1 actually fixed is *"there was only one way in"* —
plus the one thing the team browse could not do at all: **60 dates were
invisible on every surface**, holding nothing but preseason, the Olympics,
4 Nations or an all-star game.

**⚠️ THE RE-RANKING IS STILL KEVIN'S CALL** (CHENG's §10.6: the correction
belongs to the ranking, not just the entry). I have not reshuffled the list.

**Measurements that decided the design** (2026-08-21, live catalog):
727 dates · 62 hold out-of-scope games, **60 hold nothing else** · **0 of 62
dates and 0 of 9 MONTHS mix competitions** · 10 dead nights, all Olympic, 0 in
scope · 24 nights mix a shown game with a refused one · the month→season rule
and `t` vs id chars 4–6 both agree **0 of 4,553** disagreements · a cell is
**48×54 at 390px**, 125×78 at 1100.

**The 0-of-9-months figure bought a simplification, not a compromise:** a 48px
cell holds a number and no label, so the competition is named ONCE under the
grid in one exact sentence. See [[looking-at-pixels]].

**⭐ A NAME FROM `data/competitions.json` IS NEVER INFLECTED.** The first draft
printed *"4 Olympics games"*; the same shape prints *"3 playoffs games"*, and an
article gives *"in the preseason"* against *"in the Olympics"*. Those are
DISPLAY names — an adjectival column would be **inventing grammar for a value
the league can mint at any time**, the copy version of what
[[guard-where-the-archive-is]] exists to stop. Every sentence sets the name off
with punctuation instead, and a test renders a night for EVERY name in the table
and fails if one is ever followed by `" game"` — **including the ones that would
read fine**, because a rule right for some names by luck breaks on the next one.

**Still open, and named rather than done:** the front-door disclosure names
*"Preseason, the Olympics and the 4 Nations Face-Off"* and does **not** name the
all-star games (4 of 4,553). By CHENG's own standing rule — *when a feature
needs a disclosure edited, redesign the feature first* — it gets looked at on
its own merits, not folded into something else.

**⭐ AND THE LAST WIRE, 2026-08-22: "By date" is in the NAV on every full-chrome
page.** The walk that proved C1 worked also found the asymmetry nobody chose —
"Teams" was in the chrome everywhere and the date browse was on the front door
only, so a reader anywhere else could reach one and not the other. **§10.4 never
ruled on the chrome**; it ruled on whether the HOME PAGE should carry a second
index, and I read a ruling about one surface as covering another. Measured
before adding, because the header is on every page and the tester is on a phone:
**4 items wrap to 2 lines at 108px; 5 items wrap to 2 lines at 108px** — zero
cost on the device that can least afford it. The two game pages keep
`chrome="minimal"` by ruling. The test asserts **the RULE** — a page offering one
browse must offer the other — so it fails whichever is removed.

Deliberately not built: `u` (unreconciled) is not marked in the night list,
because the team page's list does not mark it either and one list marking it
alone is a new divergence; and no search ([[hockey-legibility-build]]). (*"no nav entry" was on this list until 2026-08-22 and is now built — see above.*)
