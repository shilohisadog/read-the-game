---
name: color-line
description: "✅ LIVE 2026-10-15 — the line under the rink is a COLOR ANALYST, not play-by-play (Kevin: 'more like the color guy'), plain English, nothing invented: `src/lib/color.js`, 7 rules, one note max, ~45% of frames, verbose. Open it before changing the replay's descriptive text, the pace, or zone stretches. Carries Kevin's rulings, the wording traps, and what is still open (Verbose/Minimal toggle, replay option A)."
metadata:
  type: project
---

# The replay's color line (built 2026-10-14/15)

**The path there, all Kevin's rulings:** brainstorm (replay "more informative")
→ options 1+2 built (the PLAY stays on the ice as numbered marks; a line) → a
goals-only reel RULED OUT ("we are just then a highlight system") → zone stretches
("hockey games aren't whistle based, they are zone based"; ≥3 events in a row in
one zone = `ZONE_RUN`, his ">2", declared OUR rule) → "This play…" "doesn't help
describe the event nor the flow" → **be the color guy** → a one-period SCRIPT read
first (`docs/color-script.md`, `tools/color-script.mjs` prints any period from the
real module) → "Everything else looks real good … go with the verbose approach to
start, then maybe a toggle Verbose / Minimal commentary".

**The rules (`src/lib/color.js`, priority order, one note per frame):** score
between periods (on the next period's first frame) · goal (score effect + "the puck
had stayed in the X end for N events in a row") · penalty (player "sits in the
penalty box for N minutes"; "power play" ONLY when the next `sit` shows a side
short; base rate 1 in 5 = 5,275/24,991) · restart (after icing: who may not change
+ seconds into shift + fresh skaters opposite; seconds DROPPED if any skater shows
0 — he came on as it was iced; other whistle reasons explained the FIRST time;
icing/offside wording left to the caption pill) · slot shot (1 in 9 vs 1 in 30,
then a count) · shift clock (every skater of a team past the 46-s median of
3,144,854 shifts, once per group) · zone stretch ("The puck has stayed in the SJS
end for 4 events in a row; in that time BOS has 3 shot attempts").

**Never:** who had the puck (Kevin's own example "BOS has kept the puck" was
reworded — the record cannot say it), intent, "tired", momentum.

**Also built and LOCKED:** pace `PACE=[7800,5400,3000]`, default 5.4 s (Kevin: "I like
the pacing, so let's lock that in"); a frame with a note gets CAPTION_BONUS; the
front-door hero keeps the fastest gear. Trails default `play`: marks since the
faceoff stay, numbered; a live zone stretch's marks get `.inzone`. The line opens
"where these notes come from" on click ("how?" removed as clutter). The row
reserves 2 lines (max note 187 chars). State class is `zoned` — `zone` collided
with the layer panels' class and drew the line left-aligned with a ▼.

**2026-10-18 (`f93835a`):** every shot on goal/miss/goal OPENS its note with "A wrist shot from
34 feet." (`shotLead`, `SHOT_WORDS`, 11 types; never blocked; ~85/game; feet from coordinates —
120+ ft shots with a goalie in are REAL clears, checked against the raw zone code). ⏳ Kevin's
"long run without a whistle" note: measured 237,502 runs/4,192 games — median 4 events/0:46,
p75 6/1:29, p90 9/2:24; ≥3:00 ≈3 a game. ✅ LIVE `c9d4a21`: "7 events and 1:42 of play since the
last whistle." (past census.runLength.events.p75) + "Still no whistle after 2:24 of play and 9 events."
(past secs.p90); waits for a free frame; base rate in the #playwork explainer ONLY — Kevin: the
"Most stretches end within 6" sentence added nothing for a novice. ⏳ distance label ON the dashed
shot line: PROTOTYPED on the lab only (`8ca29e7`, marks.js shotLine, "74 ft" below the line's
middle, SOG+goals, ≥20 ft — SHOT_LABEL_ROOM_FT, ours); Kevin: misses get NO line. `26a0424`: the line no longer fades (the 1-s fade dated from the original app, no recorded reason) — Kevin: a label alone looked abandoned. Waiting on his look.
⛔ My scratch `pull.mjs` skipped files it already held → stale amended games; it now refetches all.

**Open:** Verbose/Minimal toggle (Kevin, later); replay option A (goal markers open
at the faceoff of "the play the goal ended" — never "build-up"; waits on Kevin);
a zone-vs-faceoff toggle he floated (not built: the hybrid answered it, measured
pure-zone mode flips ~103×/game, 48% single events).
