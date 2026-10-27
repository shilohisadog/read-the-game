---
name: feedback-hockey-lingo
description: "Reader-facing wording: North American hockey terms (TIED, not level; face-off) but PLAIN ENGLISH descriptions, never hockey speak (Kevin 2026-10-21: Shot blocked, Gave the puck away, players named with their team).  Older: the score is TIED (not 'level'); 'CF%' is standard enough to keep. Link parameters and internal names stay as they are."
metadata:
  node_type: memory
  type: feedback
  originSessionId: f6288f73-1704-47fe-babc-ce2b52e78aa5
  modified: 2026-10-17T15:50:08.040Z
---

**Rule:** say "the score was tied", "a tie game", "5-on-5 with the score tied" — never
"level". Keep "CF%" in labels (Kevin: "has become standard enough to retain"), with plain
English beside it. Where "level" meant equal counts, say "had equal attempts".

**Why:** Kevin, 2026-10-17: "standard hockey lingo is score tied, not score level." The
site had carried British usage for months; the audience is North American fans.

**How to apply:** check new copy for "level"/"levelled" and other non-hockey idiom. Do
NOT rename link values (`?strength=level`) or internal ids (`level5`, `levelCurve`) —
shared links and dated editions must keep working, and readers never see the ids.
Related: [[cold-reader-gate]], [[measures-list]].

**Face-offs (Kevin, 2026-10-18):** one term — "face-off" (hyphenated) in every reader-facing
string; "draw" taught ONCE on the Face-offs card ("often just called the draw"), never used
otherwise; the verb "to draw" is fine. Guarded by `test/faceoff-vocabulary.test.js`. Code
names (`faceoff` event type) stay. ⛔ A blind regex over "faceoff" broke two `=== 'faceoff'`
comparisons in whistle.js — vocabulary passes must skip code.

**Plain English in descriptions (Kevin, 2026-10-21):** "make sure the textual description stays in English
and not 'hockey speak'." So the tracked goal's labels say "Gave the puck away" / "Took the puck away" (not
Giveaway/Takeaway), "Shot blocked" (not "Blocked" — Kevin read the bare word and could not tell), and places
are "behind the WSH net", "in the LAK end", "in the middle of the ice". Name a player WITH his team:
"#14 Laferriere (LAK)" — a novice does not know who plays for whom. Standard terms the site already teaches
(face-off, power play, tied, goaltender) stay.
