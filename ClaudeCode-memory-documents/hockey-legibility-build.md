---
name: hockey-legibility-build
description: "⭐ START HERE (top section, rewritten 2026-10-26: Goals mode is the DEFAULT, challenges say how they ended, the shot lanes, the hero rolls into a tracked goal), THEN `docs/status.md` §0.00 IN THE REPO. NHL replay theatre for the novice fan, LIVE at readthegame.co, public since 2026-10-04. ⚠️⚠️ NEVER QUOTE A COUNT FROM MEMORY — run `node builders/health.mjs`. ⭐⭐⭐ THE STANDING LESSON: **Kevin finds defects by READING THE LIVE SITE, and a green suite found none of them** — verify in a real browser on the live page. ⛔⛔ `data/measures.json` is a committed BUILD INPUT refreshed nightly — a change to a published field follows the order in [[measures-list]]."
metadata:
  node_type: memory
  type: project
  originSessionId: 6d74a52e-03a6-4f5f-9931-c90fa3586e42
  modified: 2026-10-26T18:00:00.000Z
---


# ⏭⏭⏭⏭⏭⏭⏭ 2026-10-26 — READ THIS FIRST
Then `docs/status.md` §0.00. All below is LIVE on readthegame.co, each verified in a real browser (CDP probes in the
session scratchpad), gates/deploy/derive green. Latest `79661cd`.

**00. 2026-10-27:** assist stops (league's a1/a2 + tracking, "#88 Necas passes · the league credits him with the
primary assist"), shootout stop in Goals, no reading pause on pass-through frames, Assists lesson + census.assists.
⚠️ A link with `asof` runs THAT NIGHT's code (Kevin's editions ruling 3, reaffirmed) — test fixes with plain links.
**0. FRONT DOOR TRIMMED (later 2026-10-26, `4ea602c`/`5448721`):** Kevin — minimise inside-the-site detail on the
home page. Hero = kicker + clubs + button; the attempts lede/archive rate and the frame's attempts message are GONE
(don't restore without asking). Puck note wording is Kevin-approved ("come with an addition", not "exception").
Tracked goals stay current-season only (Kevin agreed; ~24k requests + NHL terms).

**1. GOALS MODE IS THE DEFAULT on a plain visit** (`be30e48`): plain = a game link with no `at=` and no `summary=1`;
moment links (lesson doors, shared moments) keep All events unless `replay=goals`; `replay=all` forces All events;
untracked games (all pre-2026-27) stay All events. Mode-aware newcomer note (Kevin approved). → [[replay-lab-goalie-view]]
**2. Goals mode shape:** first frame → recorded events → THE SHOT → THE GOAL (one goal = one stop: the goal frame
holds the tracked goal-line picture, `trkRest`/`trkrest`; banner in the other half) → next goal. Scrubber goes where
tapped. Goals that came off are stops ("Face-off after a review · TOR's goal came off"). → [[challenge-outcomes]]
**3. Lanes** (`src/lib/tracked.js` `trackShot`, `trackLaneAt`): light dashed triangle puck→posts while the puck is in
the scoring end beyond 20 ft; held (darker) from the shot to the goal line on goals beyond 20 ft. Shot moment: beyond
30 ft the release (carry ≤3.5 ft/tenth → faster, or >45° turn) nearest the recorded spot; within 30 the frame nearest
it. → [[screening-path-measure]] (⚠️ its in-path % predate the release rule — re-measure before quoting).
**4. Challenges** (`src/lib/challenge.js`): outcome read from the record (goal deleted when it comes off), said on
the first frame after the review; stoppage card names the goal ("Goal, NSH challenged that TOR was offside prior to
the goal"); `census.reviews` published — "coaches have won 490 of 726 challenges of a goal". → [[challenge-outcomes]]
**5. Also:** hero rolls from text replay into its first goal as tracked, ¼ speed; share links carry `replay`/`speed`;
base rates say "Across the 4,345 games we have measured" (no hard-coded seasons).
**Kevin's rules this stretch** → [[feedback-say-what-it-is]]. **Lessons** → [[mechanize-the-review]] #100–103.
**⏭ OPEN:** Stoppages total can count one goal whistle twice (challenge stoppage + ruling); scrubber tick for a goal
that came off; re-measure lane %; strip the lab branch's old tracked-goal copy; Goals-mode teaching/UX ideas; show
the novice tester Goals-as-default. Older: data-model items 6, 12; NHL permission reply; rail witness 385/390.

# ⏭⏭⏭⏭⏭⏭ 2026-10-21 (end of day)
Then `docs/status.md` §0.00 in the repo. Everything below is LIVE on readthegame.co and was verified in a
real browser on the live site (CDP probes), not only by the suite.

**1. THE TRACKED GOAL — LIVE (`72bda64`, `e2ac5b4` rename fix).** The league's tracking ("sprites") of the ~10 s
before a goal, laid over our rink. Code: `src/lib/tracked.js` (pure: plan/orientation, words, stops, SVG) +
`app.js` `trk*` (state near `REDUCED`; functions right after `$('play').onclick`; hooks in `step/dwell/play/
jump/scrub/render`); markup `#trkMode #trkSpeed <g id="track">` in `builders/build_main.py`; CSS at the end of
`src/app.css` (`--track:#7c3aed`, classes `trk` / `trkgoals` / `trknocue`). Data via the page's `DOC`
(`track/<game>/goals.json`, `track/<game>/ev<id>.json`). Tests: `test/tracked.test.js` (Panarin 2026020144
ev202 fixture; ⭐ orientation proved by a SECOND path: the tracked hitter stands where the league recorded the
hit), `test/tracked-page.test.js` (harness; `boot(…, doc, {motion:true})` — the harness otherwise answers
every media query = reduced motion). Behaviour Kevin ruled, all in → [[replay-lab-goalie-view]]:
  - All events: Play reaching a tracked goal holds the frame before it and plays the tracking, then the goal frame.
  - `Replay: All events | Goals` + `Speed: ¼ | ½ | Real time` beside Play, ONLY on games with tracked goals;
    selected = purple text (Kevin), others black. Default All events, ¼ speed. URL `?replay=goals&speed=`.
  - Goals: goal to goal; each opens on its FIRST tracked frame held 1.5 s ("10 seconds before the goal. The
    black dot is the puck."); no event numbers, play's marks removed, no next-play cue; Pause freezes / Play
    resumes; Prev/Next = the goal's stops (first frame → each recorded event → goal line), past the ends to
    the neighbouring goal; scrubber snaps to goals; "▶ See it tracked" under reduced motion / stepped onto.
  - Words (plain English, Kevin: never hockey speak): "Tracked · goal by #9 Kempe (LAK)"; the line names the
    league's RECORDED events in those seconds ("a hit by #14 Laferriere (LAK) behind the WSH net") or "The
    league recorded nothing else in these N seconds: watch the puck."; strength in prose (power play, short-
    handed, empty net); "as the league tracked them". Labels on ice: 0.8 s of GAME time, at the event's
    recorded spot, anchored away from the nearest boards. "Shot blocked", "Shot missed the net".
  - ⛔ RULED OUT: "X has the puck" possession tags — nearest-to-puck is not possession; any threshold is ours
    (Kevin: "walking a fine line"; we "retreat to our doctrine, nothing invented"). The league often records
    no turnover (Panarin 19:58 P1: none in the raw feed, though Kevin saw one on video).
  - NOT YET: the front-door hero; the share link doesn't carry `replay`/`speed`; trimmed tracking files.
  - ⚠️ The `lab` branch still has its OWN copy (`src/lab/tracked.js` + lab hooks in app.js). Merging main into
    lab now would run TWO overlays — strip the lab copy first, then keep the lab for new prototypes only.
**2. Data:** 2026-27 tracking pulled to R2; nightly fetches new goals; NO past seasons ever. NHL permission
request sent 2026-10-19, no reply yet (Kevin OK'd use meanwhile) → [[nhl-feed-inventory]].
**3. Also live today:** the replay was a left-right MIRROR, fixed (`673f159`, → [[ends-switching-reopened]]);
visiting figures wear WHITE trimmed in club colour (`figures.js` `road`); the whole-game summary shows the
FINAL on the scoreboard (`drawBoard`) and its recap button works on a summary link (`drawClip` `||sumOpen`);
`deploy.yml` is FOUR jobs (13 s no-op, ~3 min full → [[deploy-cloudflare]]); `health --check --js-from`.
Kevin posted the LAK@WSH summary on X (2026020144, `&summary=1&src=x`).
**4. Lessons today:** (a) a probe reading DOM text missed a full-page error screen — SCREENSHOT too;
(b) GitHub sometimes never starts a push-triggered run — find the run BY COMMIT SHA (`gh run list --commit`)
and dispatch if absent; never watch "the latest run" (I reported a stale run as a deploy once today);
(c) the deploy's no-network-page grep is not in `npm run gates` — run it locally for page code;
(d) `pkill -f <pattern>` inside a bash -c that contains the pattern kills its own shell.

**⏭ NEXT (Kevin, 2026-10-21):** "debug and add some teaching moments" for the tracked goal — he starts a new
thread. Candidate teaching moments (unbuilt, must stay recorded-or-measured, never inferred): the power play
(count the skaters — already in prose), traffic in front of the net, how far the goaltender moved, the
shooter's open space, rebounds, odd-man rushes. Then: the hero, the share-link modes, trimmed files.
Older open: rail witness 385/390; 28 vs 27 shots on DiPietro; data-model item 6, item 12; lesson strip.

# ⏭⏭⏭⏭⏭ 2026-10-19
- 📨 **Kevin SENT the NHL a written-permission request on 2026-10-19** (NHL.com/contact, my draft) covering
  our nightly play-by-play use AND the goal tracking files ("sprites"). Awaiting reply. Sportradar pricing
  enquiry is his. Details + exact Terms clauses → [[nhl-feed-inventory]].
- Kevin OK'd (IANAL) pulling sprite files while permission is pending. ✅ THIS SEASON's 1,146 goal files are in R2
  (2026-10-19). ⏭ NOW: discuss integration (his idea: the replay flips to the tracking for the
  ~14 s around the goal automatically). Lab demo: lab.read-the-game.pages.dev/lab/tracking.html.
- Shipped 10-18/19: players' face-off share, shot type + distance in the color line, long-run notes, distance
  on the shot line (no fade). Derive drift 10-19 = league amendment, refreshed (`f0788f4`).

# ⏭⏭⏭⏭ WHERE THINGS STAND — 2026-10-18 — READ THIS FIRST

All LIVE and verified on readthegame.co (latest `8279b4f`; gates, derive, deploy green).
1. **Editions line + date style** (Kevin: yes to both): silent on the newest edition; dates
   "October 16, 2026" in every formatter.
2. **The lab** → [[replay-lab-goalie-view]]: `lab` branch, lab.read-the-game.pages.dev, stays
   for prototypes. The **3D see-the-shot view was built and STOPPED** (every figure an invention;
   the highlight exists) — `docs/see-the-shot-3d.md`. Kept: shot type, distance on the 2D line.
3. **SCHEMA 7 + the FACE-OFFS chip** → [[measures-list]] ruling 7: separate 8th chip (Zone starts
   keeps its name), summary row with Kevin's caveat (wording iterated with him — it is HIS),
   run-bounded door, "#X beat #Y", and ONE WORD "face-off" → [[feedback-hockey-lingo]].
4. Kevin rejected Gemini's 5 replay ideas as written; follow camera stays in the lab.

5. **Players' season face-off share** LIVE (`2e861d9`): `players.json` `fo` (all seasons,
   [won,taken,games]); drawn in the Face-offs `Is that a lot?`, fetched on open via
   `boot(G,RATES,DOC)`. Holds steady in 29 games (house alternate split; "40" was chronological).

6. **Shot type + distance in the color line** LIVE (`f93835a`).

7. **Long-run notes** LIVE (`c9d4a21`) → [[color-line]].

8. **Distance on the shot line + the line no longer fades** LIVE (`39e1b01`).

**⏭ NEXT:** Kevin 2026-10-18: BRAINSTORM more rink overlays ("eye candy": the current play, sequential plays in one end, clock time shown accurately). PARKED by Kevin, still open: rail witness 385/390; 28 vs 27 shots (status §0.00 item 4). Open: rail witness 385/390; 28 vs 27 shots. **Still
waiting on Kevin:** data-model item 6, item 12 (reduced motion), lesson strip on landscape phone.

**How I worked that held up / cost me:** measure archive-wide before building (feed_fields);
regenerate on a rebase conflict with the nightly (twice); the derive's drift check fires when
the league amends between my download and its run — refresh committed measures from published.
⛔ Check `git branch --show-current` before writing lab files; never `git checkout -- src/`
with uncommitted edits; vocabulary regexes must skip code.

# ⏭⏭⏭ WHERE THINGS STAND — 2026-10-17 — READ THIS FIRST

Everything below is LIVE and verified on readthegame.co (latest `17b441b`; gates,
deploy, derive green).

1. **The measures audit + the list of measures** — rulings 1–6 built →
   [[measures-list]] (holds the PUBLISH ORDER for a published-field change and four
   traps). Kevin framed it as part of [[data-model-review]].
2. **Data-model item 9 (Kevin moved it up): derive 31 min → 3 min 14 s** — `actions/cache@v5`
   of `ingest/raw` + `tools/changed_extracts.py` (upload only extracts whose MD5 ≠ R2 ETag;
   4,658/4,658 matched, so ETag = MD5 holds). `ac829b2`.
3. **Front door:** a night that has started and is not held yet is announced under its
   date (Kevin's wording: "Played after our last update. The replays arrive with our
   overnight update.") `c5c465d`; the nightly "team with more attempts lost X of Y" line
   DELETED (Kevin: legacy) `710515d`/`b3f3476`. Kevin likes and KEEPS the featured-game
   archive sentence.
4. **Kevin's rules from these two days:** [[feedback-should-it-exist]] (Musk: ask whether
   it should exist before optimizing; one figure per lesson) and [[feedback-hockey-lingo]]
   (score TIED not level; CF% stays).

**⏭ NEXT:** FIRST the saved-edition banner (Kevin: "do we need to say it at all?" — proposal in status §0.00 item 0: nothing when the edition is newest, else "Figures as of <date>. See today's →") and whether dates become "October 16, 2026" site-wide. THEN ruling 7 — per-player face-off win % (needs `losingPlayerId` kept by
extract.py + a full re-derive; there is no player page yet, the preview's player block is
the only player surface). Then status §0.00's older list: "before the game / tonight" on a
played preview; season-over-time analytics; Verbose/Minimal color toggle; replay option A.
**Still waiting on Kevin:** data-model item 6 (gshots + app.js score fallback), item 12
(reduced motion on the replay), lesson strip below the fold on a landscape phone.

**How I worked that held up:** measure before building and show Kevin the numbers;
verify on the LIVE site by rendered text (the scratchpad `cmp.mjs`/`live.mjs` pattern —
wait for text to SETTLE, a fixed wait gave half-rendered pages); chain gates with `&&`
(a `;` once pushed past a red gate); expect the nightly to commit while you work.

# ⏭⏭ WHERE THINGS STAND — 2026-10-15 (END OF DAY) — READ THIS FIRST

A long session. Everything below is LIVE and verified on readthegame.co.

1. **Replay = a color analyst** → [[color-line]]. Pace LOCKED 7.8/5.4/3.0 s.
2. **Editions (dated permanent links)** → [[editions-dated-links]]; first seal
   `2026-10-14` dispatched by hand; the nightly seals from now on (check the first
   NIGHTLY seal in the 10-16 deploy log: "Sealed the edition for 2026-10-15").
3. **Sharing card** now `card.png?v=<hash>` — X caches images by URL
   ([[going-public-and-the-card]]). Kevin's 2nd X post (MTL at WSH replay) worked.
4. Docs added: `docs/editions-audit.md`, `docs/editions-design.md`,
   `docs/color-script.md`; status `docs/status.md` §0.00.

**⏭ NEXT, in Kevin's order:** (a) the MEASURES AUDIT — layers vs preview vs
summary chosen at different times by different rules; include whether the AUGUST
LAYERS are still the best given what we now know the feed carries; audit → doc →
Kevin rules → build. (b) "before the game / tonight" on a played preview. (c)
season-over-time analytics (new requirement). (d) Verbose/Minimal toggle; replay
option A. **Still waiting on Kevin:** data-model item 6 (gshots + app.js score
fallback), item 12 (reduced motion), lesson strip below the fold on a landscape
phone.

**Kevin's notes on how to work, reaffirmed today:** brainstorm and SHOW (a script, a
measurement) before building; plain English, little jargon; he catches
over-promising wording in posts — quote the page verbatim or not at all.

# ⏭ WHERE THINGS STAND — 2026-10-15 (midday, superseded above)

⛔ **FOUND: a shared preview link DRIFTS.** Kevin's MTL-at-WSH X post named
Suzuki/Jenner and 58.2%; the same link next morning showed Anderson/Tuch and
59.2% — the preview recomputes nightly forever, even after the game. The summary
drifts the same way (its scales are season-to-date).

⭐ **KEVIN'S RULINGS (2026-10-15):**
1. A shared link must show what was shared, forever: **frozen figures, players
   and wording; current page design** (pixels may change). "We need to figure
   out how to do that."
2. **AUDIT the measures across layers, preview and summary** — they were chosen
   at different times by different rules and are not coordinated. Include
   whether the AUGUST LAYERS are still the best layers given what we now know
   the feed carries ([[nhl-feed-inventory]]). Audit first, rule, then build.
3. Order: dated links → measures audit → "before the game / tonight" view.
Seam found: the page is `draw(preview(id, docs, now))`, and the model carries
every figure, the picks and each row's label/says, ~12 KB a game.
Option A (goal markers → the play's faceoff) still waits on Kevin watching replays.
✅ **COLOR LINE BUILT 2026-10-15** — Kevin read the script: "Everything else looks
real good … go with the verbose approach to start, then maybe … a toggle Verbose /
Minimal". `src/lib/color.js` (7 rules, one note max, ~45% of frames, max 187 chars
→ row reserves 2 lines), replaces This/Last play (removed from stretch.js).
Penalty says "power play" only when the next `sit` shows a side short. Tests:
`test/color.test.js`, render-play. `tools/color-script.mjs` prints any period.

⏭ **COLOR, NOT PLAY-BY-PLAY (Kevin, 2026-10-15)** — "This play…" doesn't describe the
game; be "the color guy", plain English, nothing invented, mission = understanding.
Draft: `docs/color-script.md` + `tools/color-script.mjs` (7 rules: goal, penalty,
restart, slot base rate, shift clock vs 46 s median, zone stretch, period end) over
P1 of BOS at SJS: 35/78 frames speak. Best evidence: 02:09 icing → can't change →
01:36 all SJS out 48–66 s → slot shot → 01:17 goal. ⚠️ Kevin's example "BOS has kept
the puck" claims control — script says "the puck has stayed in the SJS end". Waiting
on Kevin's read. PACE LOCKED by Kevin (7.8/5.4/3.0). Zone line class `zoned` (not
`zone`, the panels' class — the collision made it left-aligned with a ▼).

✅ **ZONE STRETCHES LIVE 2026-10-15** — Kevin: "hockey games aren't whistle based,
they are zone based". Inside a play, ≥3 events in a row in one zone (`ZONE_RUN`,
Kevin's ">2", declared as OUR rule) lead the play line ("In the BOS end: 3 events in
a row · …"), their marks get `.inzone`, a finished play names its longest stay.
Measured over 10 games: 32.5 a game, in 47.5% of plays, 50.2% of events; a pure
zone mode would flip ~103×/game, 48% single events — so NO toggle yet (Kevin may
still want one after watching). Also today: PACE slowed to [7800,5400,3000], "how?"
removed (the line itself still opens the explanation).

✅ **EDITIONS BUILT 2026-10-15** (`30a63fc`), Kevin approved the design ("we're
good. go forth"). `tools/seal-edition.mjs` stages; the LAST step of `deploy.yml`
uploads (data, pages, manifest, then index) only on `workflow_dispatch` with
`seal=true`, which the nightly now sends EVERY night. Middleware: `editionPage`,
`editionFor` (played → last edition BEFORE the game date), `cardUrl` keeps asof+at;
undated preview 302s to its edition once `editions/index.json` exists. Dated
preview takes played/unplayed from the EDITION's schedule and its clock from
`manifest.sealedAt`, so it never shows a score it didn't show. Tests:
`test/editions.test.js`, preview-page, lbox. ⚠️ Nothing changes for readers until
the first seal.

⭐ **NEW REQUIREMENT (Kevin, 2026-10-15): the season over time** — who was the player
to watch most, how a team's possession and every team measure moved through the
season. `docs/editions-design.md` §9: "what we SHOWED" comes from editions; "what
HAPPENED" from walking the game files (`ofGame` per club row), not from nightly
snapshots. Waits on the measures audit. Also: edition dates are the league's GAME
date = the day it started (Kevin asked; `fetch_nhl.py:216` already does it).
⚠️ Kevin asked again why the code is saved — he had ruled it ("keep the code too and
old links keep that night's look"); the reason is drift (today's code redrawing old
data changes figures/wording). Re-explain briefly if it recurs; don't relitigate.

✅ **EDITIONS RULED (Kevin, 2026-10-15)** — `docs/editions-audit.md` §8 carries the
rulings AND the trade-offs (Kevin asked for them written down "so our future-selves
know what we did and why"). One edition a night (that night's data, never
overwritten) + **the Pages deploy live that night** → a dated link reproduces
figures, players, wording AND look, defects included. ⛔ This SUPERSEDES the
morning ruling "current design, pixels may change": inputs redrawn by today's code
drift (the 10-14 deploy failures were that). Previews, summaries, methods page
dated; learn pages/lesson doors not; replays read the newest game file (amendments
not chased) but their comparisons come from the edition. Start from the build
date; the link card carries the date. ⏭ NEXT: the technical design.

✅ **EDITIONS AUDIT WRITTEN** — `docs/editions-audit.md` (pushed 2026-10-15). Five
drift sources (A season recount, B past dates rewritten — extract SCHEMA changed 6×
since 09-08, C "static" learn pages rebuilt nightly, D our code, E lesson re-picks);
every JSON doc is overwritten in place; only raw/ is versioned (the pattern to
copy); git holds measures.json + built pages; og:url drops every param but game.
Six questions to rule (§7) — waiting on Kevin/CHENG. Kevin's nit stands: the
data-model review never asked about documents OVER TIME. Also fixed: refcheck
never globbed functions/ (same shape as the tools/*.mjs gap it records).

# ⏭ WHERE THINGS STAND — 2026-10-14 (evening)

✅ **REPLAY BRAINSTORM → options 1+2 BUILT AND LIVE** (`a803fcd`, `608efd4`):
a PLAY = faceoff to next faceoff (`src/lib/stretch.js`). Trails default `play`
(marks since the faceoff stay, numbered, clear at restart); a play line under
`#who` ("This play · … " running, "Last play · … · ended: icing" on the faceoff),
with a "how?" door. Counts events + where recorded, NEVER who had the puck.
Verified live (BOS at SJS). ⛔ Kevin RULED OUT a goals-only reel ("we are just
then a highlight system"). ⏭ OPEN with Kevin: option A — goal markers open at
the faceoff that began the goal's play; his question was whether that is
interpretation. My answer: the faceoff is recorded, so not, IF worded "the play
the goal ended" and never "build-up" (a cause claim). Also open: extra dwell on
a "Last play" faceoff (pacing is his). Option B (step a play at a time) parked;
the controls are locked. Trap hit: `test/helpers/page.js` hard-coded the trails
buttons — now read from the built page.

# ⏭ WHERE THINGS STAND — 2026-10-14 (morning, superseded above)

⏭⏭ **NEXT: BRAINSTORM making the replay more informative and engaging.** Kevin,
after looking at the replay: *"we need to figure out how to make it more
informative for the viewer. not sure how that'll happen, but we need to do
something."* Nothing ruled. Approach: audit what a first-time viewer gets from
the LIVE replay (look at it, screenshots via tools/browser), then options as
prose + one recommendation + one decision line. Argue the opposite. Relevant
history before proposing anything: [[replay-motion-open]] (pacing CLOSED,
distance pacing declined twice), [[active-player-artifact]], [[teaching-surfaces-shipped]],
[[work-door-over-the-rink]], [[layers-off-the-watch-page]], [[novice-tester-scheduled]],
[[outside-review-grok]] ("the first screen is two products" is still open).

**Today (2026-10-14):** two nightly deploys failed at `preview-marks` — my
fixture gap from the 7-row build (#90 in mechanize-the-review); fixed `da37d10`.
Wrote Kevin's X post for MTL at WSH (preview link; 26 views, 1 comment, 1 like —
a lot for his account). ⚠️ `/tmp/rtg-pixels/libs` is wiped by a WSL restart:
restore with the apt-get download lines in `tools/pixels.sh` before any browser
check, or Chrome silently renders nothing.

**Still waiting on Kevin:** data-model item 6 (delete `gshots` + the app.js
shootout-counting score fallback) — proposed, not approved; item 12 (reduced
motion on the replay); the lesson strip's last line below the fold on a
landscape phone.

# ⏭ WHERE THINGS STAND — 2026-10-13 (evening, superseded above)

✅ **LATER THAT NIGHT:** lessons now open the newest game holding their moment,
re-picked nightly (`src/lib/lessons.js`, `builders/lessons.mjs`, `lessons.json`;
doors are `?lesson=<id>`, the replay shows a lesson strip). Kevin's ruling and the
build are in `docs/learn-doors.md` §9. ⛔ Writing this note, an unquoted heredoc
ate its backticks again (#89) — memory edits go through a quoted heredoc too. ⭐ Picking across real games found the
empty-net rule matching delayed-penalty pulls — **a rule tested on one reference
game is only tested on that game.** Open: the strip's last line below the fold on
a landscape phone. ⏭ Item 6 of the data-model list was PROPOSED, not approved.

✅ **LATER THAT EVENING: the 7-row team section shipped and was verified live**
(`07eda34`, docs `c314642`, derive dispatched to republish measures/teams).
Rows carry `unit` (share/perGame/seconds) + `fields`; `complete()` gates the
nightly tail. Caught on the way: the methods page would have printed a per-game
range as "4820%", and its family section still said "we show only one". ⏭ NEXT =
data-model item 6 (`gshots`, app.js shootout fallback); item 12 awaits Kevin.
The block below is the plan as it stood before the build.

⚠️ Counts as of writing — run `node builders/health.mjs` (4,707 archived ·
4,640 published · 1,774 JS + 305 Python).

⏭⏭ **NEXT BUILD, RULED BY KEVIN: the preview's team section grows from 3 rows to
7, VERBOSE** (full cards for every row; *"we can always trim if the mobile
experience isn't viewed favorably"*). Order: records intro (live) → **Possession
group**: CF% level as headline, then shots-on-goal share (settles 37, r .85),
attempts against per game (33, r −.81), blocked shots per game (33, r −.61), with
one family sentence ("views of the same thing — having the puck — r 0.61–0.85") →
defencemen → slot → **average shift length (NEW: settles in 12 games,
independent of all three rows |r| ≤ .07, couples equally home .54 / road .57 so it
is shared stoppages, not the arena)**. Evidence: `tools/candidates.mjs` and
`docs/what-settles.md` §2a. Each new row needs: a CLUB_ROWS entry with `of`/
`ofGame`, the per-game fields in `measureGame` + `teamSeasons` + the slate
(`recent.json`) tail, reliability published by `measure.mjs`, a DERIVATION entry
(methods page), and the row must still pass the 41-game admission. Kevin's
condition kept: **must settle**.

Shipped since the morning (all verified live): item 4 one document per page;
item 5 league witness + power plays on the league's definitions; "Someone to
watch" must be playing; team records intro witnessed by standings; "Read the
whole game"; Tonight → calendar date page with scheduled games + outlined
calendar dates; team values to one decimal; ingest's measure commit survives a
moved main. Item 6 (gshots, app.js:216 fallback) still queued; item 12 (replay
reduced motion) still waits on Kevin.

⛔ **THIS STRETCH'S PROCESS SLIPS (all logged in [[mechanize-the-review]] #88–89):**
an inline page script shadowing names, a typed fixture of the old page, a push
that raced the nightly, `;` pushing past a red gate, an unquoted heredoc eating a
doc's backticks. **Gate and push in one `&&` chain; prose through `<<'EOF'`.**

---

# ⏭ WHERE THINGS STAND — 2026-10-13

⚠️ Counts are as of writing — run `node builders/health.mjs` (2026-10-13: 4,707
archived · 4,640 published · 1,730 JS + 294 Python).

⭐⭐⭐ **WORK IN FLIGHT: the DATA-MODEL REVIEW and its fix list** —
`docs/data-model-review.md` §6 in the repo, plus [[data-model-review]]. Kevin:
*"get our arms wrapped around everything then start fixing"*. Items 1–3 done and
verified live; **next is item 4, one published document per page — write the
plan and bring it to Kevin before building.**

Shipped 2026-10-12/13 (all verified on the live site): "Last night" no longer
emptied by the second morning run; raw archive private (Kevin's WAF rule);
slot layer and published slot figures use the three-clause slot; shot asterisk
only on shot disputes (`us`); built pages ship without comments (game page
1,021 → 238 KB); boxscore witness archive-wide (SCHEMA 5); plus Kevin's reading
fixes (Whole-game metrics, season named, two-column summary + scale key, front
door cards open lessons).

⭐⭐ **NEW STANDING RULE: [[feedback-comments-not-narrative]]** — comments say
WHAT + a one-line why/trap; narrative goes in commits/docs. Do not match the old
essay density.

⭐ **THE LESSON OF THE STRETCH: measure over the ARCHIVE before publishing, and
strip the prose before trusting a text check.** The archive run caught my goalie
bug (89 false flags) before a reader did; stripping comments exposed two tests
passing on comment text. See [[mechanize-the-review]] #85–#87.

---

# ⏭ WHERE THINGS STAND — 2026-10-11

⚠️ **EVERY COUNT BELOW IS THE COUNT ON THE DAY IT WAS WRITTEN.** Run
`node builders/health.mjs`. On 2026-10-11 it said **4,701 archived · 4,634
published · 1,706 JS + 280 Python**.

✅ **THE BOXSCORE DECISION IS RULED AND BUILT (2026-10-11 evening)** — Kevin said
*"yes"*; SCHEMA 5 takes the second witness archive-wide on three figures. Nothing
waits on Kevin. ⏭ Verify after Monday's `derive.yml` that a 2023 extract carries
`quoted.box`. See [[second-witness-league-figures]].

**What shipped in the four days to 2026-10-11**, all live and all verified by
fetching rather than by a green run:

- **The second witness** — six league figures checked against our event log, and
  it caught a real one its first day ([[second-witness-league-figures]]).
- **The player block** — four figures as graphs, refreshed NIGHTLY, with framed
  headshots and a sweater-number disc where the league has no photograph
  ([[player-card-and-reliability]]).
- **The front door is one product again** — the counting strip moved below the
  team grid and stopped speaking analyst, after the first outside review
  ([[outside-review-grok]]).
- **The drift gate runs where it can answer**, and `deploy.yml` hard-fails if a
  page would bake a figure the published archive contradicts
  ([[ingest-delivery-target]]).

⭐⭐ **THE FOUR DAYS IN ONE SENTENCE, WHICH IS THE PART WORTH CARRYING:** almost
nothing came from a plan. Kevin read the live site, found something, and the
work came out of that — and three times the MEASUREMENT reversed what I had
recommended (goaltenders over skaters, the rail backfill over the boxscore, a
front-door rewrite three prior rulings had already decided).

---

# ⏭ WHERE THINGS STAND — 2026-10-03 (evening)

⚠️ **NEVER QUOTE COUNTS FROM HERE** — run `node builders/health.mjs`.
⏭⏭ **READ `docs/status.md` §0.00 IN THE REPO FIRST.** It carries both of today's
builds in detail. **Nothing is open.** The next session starts from whatever
Kevin is reading on screen — every commit in this file's recent history began
that way.


## ⭐⭐⭐ 2026-10-04 → 10-06 — SEVEN BUILDS, ALL FROM KEVIN READING THE LIVE SITE

Every one of these started with Kevin looking at something and saying it was
wrong. **None was found by a green suite.** Commits `07de373` `0992b87` `428d146`
`34d0f2b` `9225151` `e4835db`.

| he said | what was true |
|---|---|
| *"the doors such as 'What a power play is' went to the learning page … it doesn't do that anymore"* | ALL EIGHT preview doors opened a replay frame and never had opened a lesson — two dicts named `figures`, the wrong one passed |
| *"it says 'At the whistle' but it doesn't say why the whistle would be blown"* | and "he" had no antecedent in the step at all |
| *"we need to explain the relationship between a penalty and a power play"* | the penalties page said "a skater short" SIX times and "power play" ZERO |
| *"the stick figures … just don't work for me anymore"* | and the REPLAY drew its own goaltenders with the same wireframe |
| *"is the net size scaled accurately to the rink size?"* | one unit is one foot, and a NINE-foot skater stood beside a FOUR-foot goaltender |
| *"there was a failed ingest at 3:18 eastern"* | the ingest was green; the job behind it never got a runner |

Details: [[preview-what-to-watch-for]], [[penalties-lede-open]],
[[figure-family-and-scale]], [[ingest-delivery-target]],
[[nhl-feed-inventory]]. Shapes: [[mechanize-the-review]] #69 and #70.

⭐⭐ **THE TWO THAT GENERALISE BEYOND THEIR BUILD.** *A disjunction is not a claim*
— a test asserting `rule page OR replay link` was satisfied by always giving one,
under a title that promised per-row. And *a string in a log is not a thing that
happened* — a GitHub run log carries the shell SOURCE of every step.

⏭ **OPEN, AND BOTH ARE KEVIN'S, RAISED OFF THE FEED INVENTORY:** integrate the
league's own published figures into CHECK OUR WORK as a second witness, and a
"Player to watch" card from per-player game stats. Plus: can the CONTROL rows be
diagrammed? See [[nhl-feed-inventory]] and [[preview-what-to-watch-for]].

## ✅ ① THE PIPELINE CARRIES `dataThrough`, and the nightly measure is LIVE

A reader was told *"the 8 games we hold for this game's season"* while the archive
held 21. ⭐ **A figure carried a guarantee that was true when written and expired
silently, and the prose asserted the guarantee instead of the figure.** Built,
dispatched and confirmed the same day: a 2026-27 reader is now told *"the 21 games
we have measured… up to 2 October 2026."* The stamp is derived from the extracts'
own game dates, never a clock, so the document stays a function of its input.

⚠️ **TWO THINGS I TOLD KEVIN WERE WRONG and both are settled** — ruling 7's
premise (`measures_fresh.py` does NOT run nightly) and the spec's three-way
equality (`index.json` counts preseason). [[mechanize-the-review]] #44, #45.

## ✅ ② THE PREVIEW CARD, REBUILT OVER FOUR ROUNDS OF HIS READING

⭐⭐⭐ **THE ARC IS THE LESSON. I fixed the RENDERING twice before questioning the
ENCODING, and the encoding was the fault from his first message.** The bar ran
from the league figure to the club's value, so its length was the GAP and every
bar ended on the same tick — which is what he described in round one. See #52.

The card is now a rail, a league tick and a mark at each club's own value.
Nothing in it has a length. Every figure carries `%`, every row states its own
denominator in words, and the shaded band is gone — it compared a ONE-GAME figure
against FULL-SEASON ones, so nearly every club was "outside" it in October.

Kevin, at the end: *"yes, simple, clear and easy to read, consider that done."*

## ✅ ③ EVERY WORK DOOR LANDS ON ITS OWN SECTION

`How this is counted →` went to the page header site-wide. **Nothing was wrong
with either end** — the hrefs, the ids and the shared `anchorOf` were all correct
and already tested. `how-we-measure.html` is a SHELL whose sections are drawn
after `measures.json` arrives, and a browser resolves a fragment while parsing.
#54: **the gap between two correct things.**

## ⚠️ THE ONE PICTURE A NOVICE IS SENT TO HAD NO CHECK AT ALL

`grep trackFor test/ tools/` returned NOTHING on the day it broke. ⭐ **Grep the
suite for the name of a drawing function — one command, finds blind spots
directly.** Two probes now exist, `preview-marks` and `methods-deeplink`, both in
the deploy gate; see [[looking-at-pixels]].

## ⚠️ Not mine, still open, nobody has looked

A self-check inside `npm run test:py` prints `FAIL the score sequence matches the
league at every goal (1 disagree: 1/01:00 league 1-0 vs ours 0-1)`. It predates
this work and does not affect the gate's exit code. Worth a session of its own.

# HISTORY

# ⏭ WHERE THINGS STAND — 2026-10-02

⚠️ **NEVER QUOTE COUNTS FROM HERE** — run `node builders/health.mjs`.
⏭ **Read `docs/status.md` §0.00 IN THE REPO FIRST.** It carries the open list in
detail; this is the orientation.

**The Caps opened 2 October at Carolina.** Kevin reviews the site LINE BY LINE and
the work is his list, in his order. Two commits that day (`6274295`, `592a99f`),
every change from something he saw on screen.

## ✅ FOUR THINGS SHIPPED, ALL FROM HIS READING

- **The three doors under the rink now share one layout.** A rule only the third
  door could reach was the only place the group's layout was stated —
  [[mechanize-the-review]] #35. `tools/browser/door-row.mjs` is in the deploy gate.
- **The verdict card's season sentence is DELETED**, with `mostUnusual` and
  `judgeable`. ⚠️ **Nothing ranks the six lenses any more** — the scales show
  distance, nothing names the furthest. Kevin's call, made at the rendered card.
- **A season being played IS this game's reference class**, Kevin's ruling. The
  overlay and the panel both use it — 8 games on the day, stated in every sentence.
  `finishedSeason` now guards only a yardstick BORROWED from another season.
- **A shared `/game` link names its own game**, and ⛔ **carries no result**: the
  share card is read before the page by someone who chose nothing, so the spoiler
  rule that hides the verdict behind `.ended` outranks every wording question.

## ⛔⛔⛔ AND AN OPEN ITEM AT THE TOP OF THE STATUS DOC WAS FALSE

`player-equipment` was listed as reaching readers as a raw feed key. It is never a
PRIMARY stoppage reason — only `rsn2` — and **`rsn2` has no reader**: Kevin had the
secondary reason removed from the card weeks ago. ⭐ The item was argued from the
layer's own header comment, which is true of the FUNCTION and silent about the
page. See [[mechanize-the-review]] #34 and [[verify-inherited-claims]].

⭐⭐ **The real one was beside it and bigger: ELEVEN reasons reached readers raw** in
this season alone. ✅ Kevin named all eleven; sibling keys are now ONE OBJECT each.

## ✅ THE WHOLE ARCHIVE IS SWEPT — `tools/vocab-sweep.mjs`, 4,559 games

✅ Penalties are CLEAN archive-wide (65 descriptors, 34,303 penalties). ⛔ **13
stoppage reasons reach readers raw, 491 of 201,218 (0.24%)** — and every one was
**already in `data/vocabulary-seen.json`**, which nothing had ever crossed against
the prose. ✅ `test/whistle.test.js` now holds ALL THREE lists; the 11 awaiting
Kevin's words are declared with their archive counts and may only shrink.

⛔⛔⛔ **AND THE SWEEP CORRECTED ME.** I had reported `player-equipment` as "never a
primary reason" — it is primary **155 times across 149 games**. True of 69 games,
false of 4,559. ⭐⭐ **A SEASON IS NOT THE ARCHIVE**, and this was the mirror image of
the error I had just written up, made inside its own fix. See
[[mechanize-the-review]] #38–#40.

⏭ **NEXT: six concepts, eleven keys, 380 occurrences need Kevin's words** — the
table is in `docs/status.md` §0.00. ⚠️ `chlg-league-*` is NOT the bench-challenge
object: nobody challenged a review the league started itself.

⚠️ **And I told Kevin `perGame['2026']` would arrive Monday with ~39 games. It was
already there with EIGHT**, read off this project's own doc and never checked.

# HISTORY

# ⏭ WHERE THINGS STAND — 2026-10-01 (end of day)

⚠️ **NEVER QUOTE COUNTS FROM HERE** — run `node builders/health.mjs`.
⏭ **Read `docs/status.md` §0.00 IN THE REPO FIRST.** It carries the open list, the
ruled-out list and the day's mistakes in detail; this is the orientation.

**Caps open Friday 2 October at Carolina.** Kevin reviews the site LINE BY LINE and
the work is his list, in his order. Nine commits shipped 2026-10-01, every one from
something he saw on a screen — not one from this document.

## ✅ THE SCHEMA 3 BACK-CATALOGUE PROBLEM IS CLOSED

Kevin dispatched `derive.yml`; it pulled all 4,626 raw games and re-extracted every
one. The horn reports the ice as the last play left it, archive-wide. ⭐ **The lesson
survives the fix:** a SCHEMA bump only reaches work a run actually does — the nightly
derives only what it FETCHED, so only `derive.yml` (weekly, or `workflow_dispatch`)
reaches the whole archive. It is free: local reprocessing, R2 egress free.

## ⭐⭐ THE SHAPE THAT CAME UP TWICE TODAY: A REAL CODE THAT IS NOT A SITUATION

`situationCode` is four digits the league really wrote, and twice it was read as
something it does not mean:

- **at the final horn** it describes the sheet AFTER the whistle (`0440` → "both
  goalies pulled, 4-on-4 overtime"). Fixed in the extractor: the horn inherits the
  last PLAY's situation.
- **in a shootout** it describes one shooter and one goalie (`1010`), which lit the
  board with `BOS PENALTY SHOT` and printed "BOS has pulled the goaltender". Fixed in
  `layer.js::sitAt`, the one place that answers whether an event has a situation.

⛔ **`strength.js` had already written the rule down as a guarantee the system did not
have**: *"`inShootout` removes those before strength is consulted"* — true of the
COUNTING LAYERS, where it was written, false of the scoreboard and the ice note, which
read the current event directly. See [[mechanize-the-review]] #15.

## The overlay is where the summary lives now

`#sumPanel` — the third door beside `How we counted` and `Is that a lot?`, opening at
the horn over an empty rink, carrying the SAME `<p id="verdict">` element (so
`sentenceFor`, the dot and the live `verdict-dot` gate kept their reader) plus **all
six lenses, each drawing its own scale**. See [[work-door-over-the-rink]].

⚠️ **The reference class must be a FINISHED season** — `distribution.js::finishedSeason`.
A season is over when the archive holds a game from a LATER one, which carries no
number and needs no edit next October. Without it the overlay compared tonight against
EIGHT games on 1 October.

## ⭐ The comparison states both outcomes — Kevin's own synthesis

> *Of the games where a team led that count by 8 or more, it won 848 and lost 531 of 1,379.*

He proposed it when offered a choice between a loss framing that teaches and a win
framing that reads naturally: *"if we provide both sides (so the numeric prose adds to
100)… 0 (never happens) to 100 (always happens)."* The loss figure is the LESSON (the
novice believes the better team wins); the win figure beside it stops that being grim.
The axis uses ONE VERB at both ends, because the dot must sit where the sentence says.
⛔ The win count is DERIVED (`n - count`) and only means wins because `eligible` refuses
a game whose score is level. ⛔⛔ The sentence now holds TWO numbers and the live gate
greps it — a pattern drifting one noun left draws the COMPLEMENT and looks right.

## What shipped 2026-09-29/30

**THE REPLAY ENDS ON THE HORN.** `layer.js::STILL_A_FRAME` splits two questions one list
was answering — *is this a play* (layers exclude it) and *does this get a frame*. The
horn is neither a play nor something to hide. It captions `🏁 Final`, and that caption
does not expire, because the rule was always "as long as the frame it describes" and the
last frame has no successor.

**THE LEAGUE'S WHOLE-GAME RECAP, AT THE HORN.** `gameVideo.threeMinRecap` on
`/v1/gamecenter/{id}/right-rail` — a feed we had never fetched and the ONLY one carrying
it. 68 of 68 regular-season and playoff games have one; preseason is where the gaps are.
⚠️ The field name lies: it resolves to ~302 seconds, so no surface may quote a duration.
⛔⛔ It required `ESSENTIAL`, because every feed was blocking by construction and a
hiccup on a VIDEO LINK would have cost the replay.

**⏭ RECAPS ARE FORWARD-ONLY.** `right-rail` is in no raw byte of any game archived
before 2026-09-30. Games inside the nightly's window heal themselves (a new raw changes
`src`). Backfilling the rest is a `workflow_dispatch` on ingest.yml with a wide window
and `delay=0.3` — **Kevin's call, not started.**

**ALSO SHIPPED:** the archive door redraws at the horn (it was drawn once and the
playhead kept moving); `▶ Replay` now appears however you reach the end; the work
panel's division prints a quotient that actually comes out; zone-start figures are
derived from `census` instead of typed; `test/prose-measurements.test.js` scans string
literals for typed measurements (0 today, fires 6 against the pre-fix source).

**⏭ STILL OPEN, SMALL:** the video box's summary still reads *"External video clip"*
when it is offering a whole game.

**⭐⭐ THE DAY'S LESSONS are in [[mechanize-the-review]]** — chiefly that a feed field can
be well-formed and not be about what you think, and that **a schema bump only reaches
games a run actually derives.**

# HISTORY

# ⏭ WHERE THINGS STAND — 2026-09-30 (the season is running)

⚠️ **NEVER QUOTE COUNTS FROM HERE** — run `node builders/health.mjs`. As of this
writing: 4,623 archived · 4,556 published · 1,544 JS + 237 Python.

**The season opened 29 September.** Caps open **Friday 2 October** at Carolina.
Kevin is reviewing the site line by line; the work is his list, in his order.

**THE REPLAY NOW ENDS ON THE HORN.** `game-end` was filtered off the timeline, so a
replay stopped on whatever shot happened to be last. `layer.js::STILL_A_FRAME` splits
two questions one list was answering — *is this a play* (layers exclude it) and *does
this get a frame*. The horn is not a play AND is the moment the game ends. It captions
`🏁 Final`, and that caption does not expire, because the rule was always "as long as
the frame it describes" and the last frame has no successor.

**THE LEAGUE'S WHOLE-GAME RECAP IS EMBEDDED AT THE HORN.** `gameVideo.threeMinRecap`
on `/v1/gamecenter/{id}/right-rail` — a feed we had never fetched, and the ONLY one
carrying it. 68 of 68 regular-season and playoff games have one; preseason is where the
gaps are. ⚠️ The field name lies: `threeMinRecap` resolves to ~302 seconds, so no
surface may quote a duration. ⛔⛔ Adding it required `ESSENTIAL` — every feed was
blocking by construction, so a hiccup on a VIDEO LINK would have cost the replay.

**⏭ THE ARCHIVE IS FORWARD-ONLY ON RECAPS.** `right-rail` is not in the raw bytes of
any game archived before 2026-09-30, so re-deriving cannot conjure one. Games inside the
nightly's window heal themselves (a new raw changes `src`, which re-derives). Backfilling
the rest is a `workflow_dispatch` on ingest.yml with a wide window and `delay=0.3` —
**Kevin's call, not started.**

**⭐⭐ THE DAY'S SHARPEST LESSON is in [[mechanize-the-review]]:** the feed's
`situationCode` on `game-end` describes the sheet AFTER the whistle, and I reported the
wrong label it produced TWICE as evidence the new frame worked.

# HISTORY

# ⏭ WHERE THINGS STAND — 2026-09-29

**The 2026-27 regular season opened tonight.** Five games. The archive's newest game
changes KIND — preseason to regular season — for the first time since last September,
which is the moment [[season-restart-traps]] says to distrust every rule that picks
"the newest game". First regular-season ingest: the morning of **30 September**, and
the first real test of the 10:00 Eastern target this season. Caps open **2 October**.

⏭ **KEVIN IS GOING THROUGH THE SITE LINE BY LINE.** The next session's job is his
list, in his order — not a build picked off a document. ⭐ Everything below §0.00 in
`docs/status.md` is the state; this file is the history.

⚠️ **NEVER QUOTE A COUNT FROM HERE** — run `node builders/health.mjs`.

## ⭐⭐⭐ WHAT THE LAST WEEK PROVED, and it is the thing to carry forward

**Every defect of the past five days was found by a person opening the live site.**
Not one by a suite green at 1,506 → 1,532 tests. The habit that catches them is not a
test: **open the surface and use it, in the order a reader would, once per surface.**
A sweep of 12 surfaces × 2 widths plus the replay's 48 interaction states now runs
clean — and that is a statement about STATES, not about whether the prose reads right,
which is exactly what a line-by-line read is for.

⭐⭐ The three sharpest shapes of the week, all in [[mechanize-the-review]]:
**a test that steps around a behaviour has decided to tolerate it** (#18);
**a stop at the first item cannot report the length of the list** (#20 — a halt hid 29
penalty descriptors behind reports of one); and **a comment that quotes a live
monitor's pattern arms the monitor against itself** (#25 — it would have made the
deploy gate call every dead page healthy).

---

# HISTORY — 2026-09-21, start of an earlier thread

**Live at `e6a3c82`. Gates 1,341 JS + 222 Python. Deploy, gates and the nightly ingest
all green; the front door reads `current`.** ⚠️ **Never quote a count from here** — run
`node builders/health.mjs`; the nightly moves the archive with no deploy.

⭐ **READ `docs/status.md` §0.00 IN THE REPO NEXT.** It is rewritten for this handoff and
carries the ordered do-next list. This file is the history; that one is the state.

**The three days that just happened:** hockey came back on 19 September after a quiet
summer and **broke something every day** — eight failures, every one a latent assumption
that the season never ends ([[season-restart-traps]]). The deepest: **the pipeline
modelled two outcomes, final or incomprehensible, and hockey has a third — NOT YET.**

**What shipped in them:** the face-off colour check, a ruler for test-program row 7, a
browser check that had been measuring a hidden box (plus the live defect it was hiding),
one convention for ring counts, the nav link matching the page it opens, the pipeline's
third outcome end to end, preseason games on club pages and as the front-door hero, and
**the counting ladder** ([[scrubber-navigation]]) — the strength lens and the level
control, which turned out to be one control.

**Open, in order:** row 7's parser increment (the ruler reads 20 tests / 15 files and
only a parser moves it); rows 9 and 10; two pages Kevin is still pondering
(`terrain-3d.html`, `read-the-game.html`); and the defencemen sentence, tabled.

---

# ⭐⭐ 2026-09-13/14 — MOBILE REBUILT, AND PORTRAIT IS OUT

Full record: [[mobile-landscape-ruling]]. Next build: [[red-on-red-ends]].

Kevin: *"the verdict isn't good… the replay just isn't informative on a mobile
device"*, then *"I have decided portrait isn't salvageable"*, then *"can we
replicate the laptop approach on mobile, with the controls side by side with the
rink?"*, then *"the scoreboard appears to be 2/3 the size of the rink… we need to
scale down everything on the phone."*

| | |
|---|---|
| **the audit reframed the verdict** | the drawing got **19.4%** of the phone's first screen and an EMPTY layer box got 14.2% — a budget never set. But the rink is 2.35:1 against a 0.46:1 viewport, so no portrait arrangement could ever give it more than a fifth. **Both halves true at once.** |
| **landscape alone is worse** | 3.90× the drawing, and the caption moves from 0.57 screens to **1.52**. Drawing area and everything-else trade against ONE budget in every orientation. |
| **shipped** | landscape = the laptop's two columns, rink 510×217, everything on one screen at 844×390; portrait = a rotate prompt that is **not a wall** (orientation lock is an accessibility setting, not a mistake). |
| **the type was the laptop's, exactly** | score 28.8px on both; U11's `vw` clamp **assumed viewport width IS element width**. 44px tap floor survived every line of the fix. |

⭐ **AND TAP-TO-PLAY SHIPPED FIRST** (2026-09-11): tapping the ice plays/pauses,
a double tap on the left or right steps a play. **No lag**, because chromium was
probed before a line was written — a double tap on touch AND mouse produces
`click detail=1 → click detail=2 → dblclick detail=2`, so the platform's own
detection was used instead of a 250ms window.

⛔ **Three front-door items from 2026-09-11 are still waiting on Kevin:** page
length, the `Watch the whole game` CTA, and the three populations
(4,192 / 4,100 / 3,925). The situation-vocabulary thread is still two of four.

# STATE AT 2026-09-11 (end of day) — read `docs/status.md` §0.00 next, IN THE REPO

**1,230 JS + 198 Python.** ⚠️ Never quote that from here — `node builders/health.mjs`.

## ✅ TWELVE COMMITS, ALL LIVE — the front door rebuilt around the NEWCOMER

| | |
|---|---|
| **the hero is chosen on `ha`** | `hl` counts PLAYS; the h1 promises *the counts built in front of you*, which is the ATTEMPT COUNTER. Measured over all 2,045 candidates across 717 dates: inside `[3,8]` the counter reaches a median of 3 and a **p10 of 2** — and the live hero reached **2**, the p23 of its own window, frozen till the season opens. Floor of 3 costs **one day** of p90 staleness. |
| **teaching doors 1 → 9** | 14 learn cards + 6 rule pages were behind ONE 129×27 nav link. Now: a rules strip (offside/icing/penalties), a measurement strip (slot/shifts/score/zones), and the label says *How to read hockey*. |
| **the moving rink is a door** | 26.9% of a laptop screen, the only thing that moves, cursor `auto`, click did nothing. |
| **the page says "hockey"** | it appeared ZERO times in the visible front door — once in the whole file, in the `<title>`. |
| **clubs are named** | *Montreal Canadiens at Carolina Hurricanes*, with the MTL/CAR badges still on the board an inch above — that pairing IS the lesson. |

| **the puck note** | what the rink does that a stranger reads as broken, said ABOVE the rink — *"The puck only appears where something happened … The feed we read records those moments and nothing in between."* Wide screens only, Kevin's call; it made the document SHORTER (2.61 → 2.59). |

## ⛔⛔ FOUR LIVE DEFECTS NOBODY HAD LOOKED FOR

1. **The footer claimed something the site had stopped doing**, in bold, on every
   page: *"teams are identified by colour and three-letter abbreviation only."*
   A team page showed FIVE full club names in visible text; the front door handed
   a screen-reader user all 32 via `aria-label`. The no-logos half was and is true.
2. **`drawDaily` declared `var when`** — a STRING — shadowing the page's
   `when(date)` formatter, hoisted as `undefined` on every path where `d.next` is
   null, i.e. **every dark night**. Calling it takes `$('daily').hidden = false`
   down with it and the block renders NOTHING. Latent until a door needed a date.
3. **`docs/ten-second-hero.md` was wrong in its own filename.** It claims 6–15s;
   the live loop is **21.5s**. `PACE` halved on 2026-08-29, four days after that
   table was written, and nothing re-ran it.
4. **The hero's attempts line stated WHOLE-GAME totals beside a loop showing the
   opening seconds** (CHENG: *"82 to 45 is 127 attempts before the first goal …
   the scoreboard reads 0-0"*). The builder comment had said *WHOLE GAME, NOT THE
   LOOP'S WINDOW* all along — to the code, never to the reader. ⛔ His other
   suggested fix (move it under the button) would have BROKEN the archive rate
   beside it, which is conditioned on FINAL totals — his own earlier ruling.

## ⭐⭐ THE MEASUREMENT LESSON OF THE DAY, AND IT IS ONE NOTCH STRICTER THAN THE OLD ONE

**A mutation is not evidence until it lands WHERE THE CHECK IS LOOKING.**
`nameOf(g.a) + ' at ' + nameOf(g.h)` appears THREE times in `build_index.py`, so
`replace(old, new, 1)` mutated the calendar while I was testing the hero — and the
grep I used to confirm "landed" matched an unrelated occurrence. Reported as
landed, subject untouched, a test that could not fail looking like one that could.
**Assert `s.count(old) == 1`, mutate to a UNIQUE marker, check the build's exit
code.** (And `npm run build` between edit and test, because the tests read the
BUILT page — that trap fired again today.)

## ⛔ A CLASS NAME WITH A RULE ATTACHED IS SPOKEN FOR ON EVERY PAGE

I named a new container `.lede`. The shared stylesheet carries
`.lede{max-width:62ch}` — so the grid capped at 662px of a 1240px row, `1fr`
collapsed to the longest WORD (32px wide, 605px tall), and the hero card was
pushed **527px** down. ⭐⭐ **THE REPO HAD ALREADY WRITTEN THE WARNING**:
`build_main.py:54`, *"NOT class=\"lede\" -- that name is spoken for"*, and
`render-notes.test.js` forbade it **on the game page only** — so the guard watched
a different file while the shared RULE did the damage. **Grep the repo for the
name before taking it.** Guard now covers every built page, with its own expiry.

⚠️ **And `56ch` for the grid column was not safe either**: `ch` resolves against
the container's font size while `.says` caps at 56ch of its own larger one —
597.9 vs 603.5px, **six pixels**, and the lede wrapped to three lines. The
two-line lede has ~6px of margin; any type change flips it.

## ⚠️ AND A TOOLING TRAP IN MY OWN VERIFICATION

`curl -sS --fail https://readthegame.co/game.html` → **exit 0, ZERO bytes.**
Cloudflare Pages 308s `.html` paths to the extensionless form, 308 is not a
failure, and without `-L` there is no body to fail on. Every assertion against
that file passes by examining an empty string. ⭐ **The deploy gate is NOT
affected** — `deploy.yml:803` already uses `-sSL` on `/game`. Use `-sSL`.

## ⭐ KEVIN'S RULINGS, RECORDED SO THEY ARE NOT RE-PROPOSED

- **The em dashes STAY.** He raised one ("it screams AI built this"); counting
  found **121 in the site's visible text**, so it is the house voice. His ruling:
  *"keep the em dashes, I just didn't care for the one being front and center on
  the opening line."* ⭐ **The rule is about POSITION, not punctuation** — the line
  a visitor judges the site by gets no subordinate clause. Written in the comment
  above `SAYS` in `build_index.py`, where a re-proposer would arrive.
- **"Watch" is not banned.** Of eleven visible uses, FIVE are teaching
  instructions ("watch where the faceoff goes") and stay. The rule: **it misleads
  only where nothing beside it corrects it** — so the `<title>` and a heading over
  club codes lost it; `Watch the whole game` keeps it, because a moving rink sits
  directly above. ⏸ **That CTA is HELD for the novice tester.**
  ✅ **DECIDED 2026-10-13 by Kevin: "Read the whole game"** (both the front door and a played game's preview). "Watch" implies streaming video, and the site now links REAL video (league clips), so the moving-rink exemption no longer held.

## ⏭⏭ PICK UP

1. ⏸ **Kevin is judging PAGE LENGTH** — 2.61 laptop / **4.57 phone** screens,
   against 2.01 / 3.20 that morning. ⚠️ **It inverts on 19 September**: the slate
   closes the hero card's dead 116px left column and pushes the team grid further
   down. Cheapest lever is `SHOWN` in `daily.js` (6 → 4 ≈ 134px).
2. ✅ **The CTA** is now "Read the whole game" (Kevin, 2026-10-13).
3. ⏸ **THREE POPULATIONS RENDER ON THE FRONT DOOR, ONE EXPLAINS ITSELF** —
   **4,192** games (the strip added today), **4,100** (an attempts leader exists)
   and **3,925** (a leader in the level-strength count). CHENG raised the
   4,100/3,925 gap; adding 4,192 made it sharper. **A copy call, not a defect.**
4. ⏸ **The seamlessness audit** — still two of four surfaces; the newcomer block
   and the replay's power-play pill plus `MODE()` are unread as one vocabulary.

---

# STATE AT 2026-09-10 (end of day) — read `docs/status.md` §0.00 next, IN THE REPO

## ✅ WHAT SHIPPED 2026-09-10 — twelve commits, all live

| | |
|---|---|
| **zone starts, wired** | the sixth chip. The whistle regression **did not return**, and the collision guard stayed green — so that diagnosis is **untested, not confirmed**. |
| **the front door answers itself** | more attempts lost **2,228 of 4,100**; controlled play **while level** lost **1,560 of 3,925**. Both surfaces, fractions, connective read from the data. |
| **`census.pace`** | attempts and time by strength and by score. ARCHIVE: **95.06 / 58.65 / 13.05** per 60 (PP / even / PK) and **65.55 / 58.57 / 52.61** (trail / tied / lead). |
| **`All situations`** | the tenth learn card, and the first about a CONDITION rather than a rule or a metric. |
| **the one-scope guard** | 27 modules share ONE browser scope, 135 names, nothing watched it. |

## ⛔⛔ THE LESSON OF THE DAY: A COMMITTED DERIVED FILE IS A CACHE, NOT THE ARCHIVE

CC declared `zonestart.js`'s `drawStrength` figures **stale** against
`data/measures.json` and shipped that as a finding. A hand-run derive published
**exactly the comment's numbers**. ⛔ **The comment was current; the committed
file had rotted** — `strength.js` stopped leaving situation codes unclassifiable
(`census.state.unknown`: 4,151.9 min → **0**) and every figure derived from them
moved.

⛔ **AND THE FRESHNESS GATE COULD NOT CATCH IT**: `tools/measures_fresh.py`
watches a **named list** (`slot.*`, `measured`). `census.pace` is on it now; the
rest of the census is not. **Re-derive before quoting any census figure.**

## ⭐ `derive.yml` CAN BE RUN BY HAND — `gh workflow run derive.yml --ref main`

`workflow_dispatch`, ~35 minutes, every step green. Safe when the archive is
static (it has been since 14 June): every WATCHED value reproduces, so the only
diff is the new field. **Do not wait for Monday.** Afterwards: `curl` the
published `measures.json` into `data/measures.json` and commit it.

## ⏭⏭ PICK UP — KEVIN'S OWN TOPIC, and it is an AUDIT not a build

*"Score-effects, even strength, power play/penalty kill type of information that
we need to be seamless across the site (which I'm not sure that's the case
currently)."* ⭐ **He is right to doubt it.** Four surfaces, built separately,
none referring to another: the front door's paired rates, the game page's
newcomer block, the `All situations` card, and the replay's power-play pill plus
its `MODE()` line. **Nothing has ever audited them as one vocabulary.**

## ⛔ AND ONE THING CC MUST NOT BUILD WITHOUT KEVIN

`docs/score-effects.md` §6.2 proposes a *"while the score was level"* control
**where `Even strength only` sits — and that place is empty.** Kevin removed the
situations control on 2026-09-07 with reasoning that applies word for word. ⭐ The
hold's stated expiry (*"a paragraph about why power-play shots inflate a count"*)
is now **half-met** by the `All situations` card. **His call.**

---

# STATE AT 2026-09-09 (end of day) — read `docs/status.md` §0.00 next, IN THE REPO

## ✅ WHAT SHIPPED 2026-09-09 — nine commits, all live

| | |
|---|---|
| **§5.1's daily block** | the front door's first element that is different tomorrow |
| **the game page wears the HOME PAGE'S TEMPLATE** | Kevin: *"as a site visitor I would expect the game page to look reasonably close to what I saw on the home page, no?"* |
| **the NHL highlight offer persists** | it lived for ONE frame — 3.6s — and vanished mid-read |
| **the ends note signals at the scoreboard** | a chip in the clock line, the ppill's proven shape |
| **the hero's attempts bar REMOVED** | it drew the opposite of the truth |
| **the picker's chips got columns** | and the phone had the same defect |
| **`census.shooter`** | + `docs/layer-ideas.md` and CHENG's four rulings |

⭐⭐ **AND THE DAY'S PATTERN, WHICH IS THE THING TO CARRY: Kevin found five real
defects by looking at the live site, and three of my own STATUS ROWS were wrong
about their own subject** — C6 said *"parked for the novice test"* while his own
ruling *"the offside diagram is good right now, locked in"* sat 200 lines below
it in the same file. **The rows only ever get caught when he reads one back.**


## ⏭⏭ PICK UP: the zone-start layer's PAGE WIRING, and one unexplained bug

**The reducer is done and verified** (`src/lib/layers/zonestart.js`, 9 checks,
4 mutations). ⛔ **The page wiring was built and REVERTED**: with its draw call
in `render()`, **the WHISTLE layer stopped drawing its marks** (1 ring → 0 across
the sweep). Bisected to that one line — which is guarded by `if(zoneOn)` and
**does not throw** (a try/catch caught nothing). The reducer is exonerated:
`whistle.reduce` places 44/44 and `marks()` works called directly. **It did not
ship**, and every reverted piece is listed in `status.md` §0.00.

## ⭐⭐ KEVIN'S ARCHITECTURE QUESTION, MEASURED — *"why does adding a layer touch
4 areas plus several guards?"*

Adding the lens to `LENS` turned **FOUR DERIVED GUARDS RED**, each naming the
exact next edit. ⭐ **The cost is enumerated by machine, not memory** — that half
is the architecture working. ⛔ **Two were not:** the chip markup had **no guard
at all** (the layer was registered, bundled, counted, distributed and unreachable
— nothing failed; **now guarded**); and ⏸ **`LAYER_TOKENS` is the root and is NOT
fixed** — a hand-typed array that the `DRAWS` guard checks *against*, so **two
stale lists agree and the guard passes.** A guard whose reference is itself an
enumeration goes stale in the same edit.

## ⛔⛔ THE BUNDLE IS ONE SCOPE — a module-private name is not private

`zoneOf` moved from `census.js` to `rink.js` (geometry, and census is the archive
tier the bundle excludes). `layers/whistle.js` declares its **own** `zoneOf` with
a different signature. **Two function declarations, one name, one inlined scope:
they hoist and the later wins for every caller.** Renamed `attackZone`. A
property of THIS BUILD, not of ES modules.

---

# STATE AT 2026-09-09 (earlier)

## ✅ §5.1's DAILY BLOCK IS BUILT AND LIVE — `docs/front-door.md` §12

`src/lib/daily.js` + `drawDaily`, in the hero card's **sixth grid row** (the
slack §5.4 measured). Three states, counts and no rate, the season sentence out
of `#state`. ⏰ **Only the off-season state can fire until 29 September** — the
suite is the calendar this feature does not have.

### ⭐⭐ THREE THINGS CHANGED AGAINST MY OWN DESIGN, EACH FROM A MEASUREMENT

1. ⛔ **"No games last night" is UNSAFE and I nearly shipped it.** `measureAll`
   gates on `inScope`, so an empty `recent.json` is equally what a **preseason**
   night looks like. **`describe()` shipped this exact bug in July.** ⭐ **THE
   DENOMINATOR IS THE HOCKEY, NOT OUR COMPREHENSION OF IT** — absence of a record
   is not absence of a game. The same rule, arriving through a second door.
2. ⛔ **A 16-GAME NIGHT GREW THE CARD 800px → 1,230px** with ~1,250×480 of empty
   white beside it, **past 1,144 green tests.** Capped at six + a tail to
   `calendar.html?date=` (which shows more than the block can). ⭐ The headline
   count still names the whole night — **the cap is about doors, not hockey.**
3. **No date can be computed from `startTimeUTC`.** 7pm ET = 23:00Z same day;
   10:30pm PT = 05:30Z next. The browser localises; the module never does.

⚠️ **`tools/pixels.sh` gained `RTG_PIXELS_SLATE=<date>`** — rebuilds `recent.json`
from that date's REAL extracts with the nightly's own command. Without it the
slate state is invisible until October, which is how #2 would have shipped.

⭐ **"Last night" is earned from the GAME DATES, never a timestamp** — a stalled
pipeline degrades the claim to `11 January 2026 · 1 game` instead of lying.

---

# STATE AT 2026-09-09 (late)

## ✅ §5.1 SHIPPED — this section is the record of what it was before it was built

Every ruling has landed and the data path is complete. **One block, three states,
the data picks which.** ⛔ **COUNTS, NO RATE** — the nightly figure may never sit
beside the archive figure (the reader divides and concludes eight games were
unusual). The season sentence **moves here out of `#state`**; ⚠️ the staleness
check travels with whichever block says *"last night"*. ⏰ **It shows the offseason
state for ~20 days** — `recent.json` is live and publishing `{"games":[]}`.

## ✅ SHIPPED 2026-09-09 — a long day, all live

- **The home page fold** (two columns ≥1180) — and it uncovered `.hero` having had
  **no background/border/padding for 23 days**: `d401e68` deleted the `.scale`
  block line-by-line, four orphaned declarations swallowed the next real rule.
  `test/css-parse.test.js` guards it.
- **The game page fold** — picker was BELOW THE FOLD on every laptop; now the top
  of a side column. ⭐ **One wrapper + `display:contents`**; six blocks given
  `grid-column:2` individually was measured and was a REGRESSION (rows are shared).
  ⚠️ `grid-row:1/span 30`, not `1/-1`. **And the phone's play button is above the
  fold on arrival for the first time** (1.15 → 0.81 screens).
- **`measure.mjs --slate`** + the nightly step + `recent.json` live.
- **Three live pages had no CSP** (`read-the-game.html` 743 KB among them) and the
  sweep's `if (!csp) continue` was the hole. All pinned; the skip is the claim.
- **The offseason sentence** — *"Preseason opens 19 September 2026, the regular
  season 29 September 2026"*, read from the league's own field.

---

# STATE AT 2026-09-09 (evening)

## ⏭ THE LIVE THREAD IS THE FRONT DOOR

Kevin, with a screenshot of the home page above the fold on his laptop: *"refactor
this into something that encourages daily visits, offers valuable information
right from the get go, and encourages a visitor to click into the site... put on
our website UX hats."* **`docs/front-door.md` is the design and it is waiting on
CHENG** (§7, four rulings). ⭐ **THE FINDING IS AN INVARIANT, NOT A PREFERENCE:
the front door has no element whose content is a function of the date.**

### ⭐⭐ CHENG HAS RULED ALL FOUR — and two of the rulings are worth carrying

1. ⛔ **THE DAILY BLOCK PRINTS COUNTS AND NO RATE.** My draft put `5 of the 8`
   beside the archive's `54.3%` and defended it with `a fraction never a
   percentage` — **the right convention doing the wrong job.** That guard is about
   PRECISION a small n cannot carry; the danger is **ADJACENCY** — the reader
   divides and concludes *last night was unusual*, which eight games cannot
   support. ⭐ **It is the matchup card one surface out**, and only *not printing
   them together* disarms it.
2. ✅ **"Last night" is NOT a ranking** — *a ranking picks WHICH game on grounds we
   chose; a date filter applies no rule, and a date is not an outcome.* ⛔ It
   becomes one the moment it names *the closest* / *the biggest upset*.
3. ✅ **A REMEMBERED TEAM IS PERMITTED**, first personalisation on the site.
   ⭐ **The test: does anything about the viewer reach us?** If no it is a
   preference, if yes it is measurement whatever it is called. Inspectable on the
   page · may never change a number/rate/population · degrades to today's page.
4. ✅ **`#state` splits** — season sentence up into the daily block, ledger half
   stays at the bottom. ⚠️ **The staleness check goes with whichever block says
   "last night."**

✅ **Three defects out of that one screenshot shipped first (`c56a33a`)** — the
hero's archive rate printed only with an attempts leader, so **on a 52–52 tie the
site's flagship finding rendered EMPTY and would have stayed empty for three
months**; `.sharerow` was never in the preview's hide list, and being a `100vh`
flex column it **came out of the rink** (343×86 → 343×142 at 390); and the quiet
state now says when hockey returns, read from the league's own field.

⏰ **THE CLOCK, and the record was nine days wrong**: the league's own
`regularSeasonStartDate` says **2026-09-29** (preseason 09-19). `docs/next-game.md`
§2 says 8 October and its §0.2 gate is computed from that.

⛔ **`measure.mjs` DOES NOT RUN IN THE NIGHTLY** — `ingest.yml` is daily
(fetch + `derive.py`), `derive.yml` is WEEKLY. So last night's attempts do not
exist until Monday, and that one fact decides the shape of any daily surface.

---

# STATE AT 2026-09-09 (morning)

`main` at the head of a twelve-commit run, tree clean, CI green, **1,092 JS + 189
Python**, 4,490 published of 4,553. ⚠️ **Never quote those from here** — run
`node builders/health.mjs`.

## ✅ SHIPPED 2026-09-08/09

- **B6** — a penalty ended by a goal says so on the goal's own frame, instead of a
  clock reading 1:12 and a man who vanished. **343 of 2,230 stints, 15.4%.**
- **The NHL goal highlight**, end to end — [[nhl-highlight-embed]].
- **The Workshop link** removed; the page stays, on a named unlisted ledger.
  ⛔ `read-the-game.html` is one of its three rows and **cannot be deleted** —
  35 test files boot it.
- **The tip jar** now sits on the 12 pages that cannot show a clip, and on
  neither of the 2 that can.

## ⏭ WHAT IS OPEN

1. **`goalie-eye-view`** — Kevin: *"once all that gets squared away we can discuss
   the goalie-eye-view."* **This is the next conversation.** The record calls it
   the one genuinely irreplaceable idea on the site.
2. ⛔ **The `situationCode` boundary ruling** — `tools/box-witness.mjs` is at 3 of
   176, and all three are a goal on the exact second a penalty expires. A
   one-second convention to pick, then it becomes an assertion.
3. ⚠️ **`team-season.js`'s uncheckable "7.8% of blocks made by a teammate"**.
4. **`#pbA`/`#pbH`** are parked markup nothing writes.
5. **§0.00-θ** — `refcheck.py` is blind to `§`; scoping it is Kevin's call.

## ⭐ AND K4 IS STILL OPEN — the highlight is NOT it

Kevin wondered whether the highlight resolves K4. My view, unchanged: **no.**
NHL.com already has the highlights and a link to someone else's video gives nobody
a reason to come back Tuesday. He offered the better frame himself — *"we're
getting closer to a well-rounded, excellent website which might be enough"* — and
the honest counter is that **a teaching site succeeds by making itself
unnecessary**, so the recurrence engine is the archive plus a front door that says
what is worth watching tonight. **The front door is healthy**: the hero is a median
of ONE day behind the newest published game.


**START HERE — then `docs/status.md` §0, which is an ORIENTATION written because
Kevin said *"I've lost the bubble a bit."*** NHL honest/deterministic "replay
theater" for the novice fan. **LIVE at readthegame.co.** Roles: CC = Senior Dev,
CHENG = Browser Opus (same base model, so agreement is correlated —
[[feedback-argue-the-opposite]]).

⚠️ **NEVER QUOTE COUNTS FROM MEMORY — the health block is GENERATED.** Run
`node builders/health.mjs`; `npm run gates` fails on drift.

## ⭐⭐ THE DIRECTION, IN KEVIN'S OWN WORDS (2026-08-31)
> *"What I want to focus on is educational content, aligning show me the work
> with learning cards, and making them bi-directional, adding more learning
> information to the rink (in the caption pill we just leveraged for the penalty
> is over information)."*

All three are well past started. **[[rule-diagrams]] is the live thread — read it
second**, then [[teaching-surfaces-shipped]] for the four surfaces before it.

⭐⭐ **AND HE OPENED A NEW DOOR:** *"the learning cards don't have to be specific
replay events… we have some discretion in what we overlay onto the ice."* That
became **A DIAGRAM IS NOT A MEASUREMENT** and five rule pages —
`/offside` `/icing` `/faceoffs` `/slot` `/empty-net` — plus the offside caption,
`⚡ Power play over`, and three production defects found on the way
([[power-play-endings]], [[learn-door-resolution]]).

⭐ **His verdict on the shape of it:** *"I like the integration of the learning
pages… that seems to be what I am looking for."* And on the work overlay before
it: *"it integrates the work into the UX, as opposed to a kinda bolt-on."*

## What is open, ranked
1. ⏸ **KEVIN HAS NOT REVIEWED THE FIVE DIAGRAMS.** His words closing the thread:
   *"before we debug the diagrams…"* — he expects to. ⚠️ **The empty-net figure
   was verified numerically, never SEEN** (image reads ran out); open it first.
2. ⏸ **THE PENALTIES CARD IS WRONG AND IT IS HIS CALL.** It says *"this is that
   gap — the delayed call, before the whistle"*; the door lands on the CALL, and
   in the reference game the gap holds **zero recorded events**. Reword, or a
   sixth diagram the way offside got one.
3. ⏸ **The learn cards' PROSE.** Kevin: *"we'll need to work on the learning
   cards."* The five with diagrams gained real teaching; the other four are
   untouched, and **the Blocked layer still has no card at all.**
4. ⏸ **K4 — a killer feature.** My read after building the loop: *everything is
   built and nothing is connected*, so the killer feature is the **return path**,
   not a new feature. ⛔ **STILL GATED: no novice has ever used this site**
   ([[novice-tester-scheduled]] — she is on a phone).
5. ⏸ **K1's surface** — `transition.js` is built and unwired. Text is the wrong
   medium (its sentence repeats 47×/game); it wants a MARK, which is K2's
   neighbourhood.
6. ⏸ **K2 puck trails** · **K3 who is on the ice** (73.5% agreement at a goal) ·
   **the nine faceoff dots** · the measurement page · `shotType` re-extract.
7. ⏸ **The parked block** from 2026-08-27 still hides the counters, split bar,
   goaltender and whistle/blocked panels. Kevin called it temporary.

## ⚠️ Two corrections I owe the record
- **I claimed four of five layers "change nothing" and was wrong.** I probed
  `#events`/`#lines`/`#whistles` and the parked panels and never `.lbox`, which
  IS the layer's live output. Kevin caught it with a link. The narrow true
  statement: they do not change **the ice**.
- **`docs/status.md` §A5.1 calls the unreadable `sit` bucket "five-on-three
  blindness."** Measured: it is four things — two-man advantage 34.1%,
  empty-net combinations 29.7%, **3-on-3 OT 25.8%**, shootout 10.4%.

Related: [[rule-diagrams]] · [[teaching-surfaces-shipped]] · [[restart-frames-and-k1]] ·
[[census-archive-answers]] · [[layer-ideas-and-taxonomy]] · [[next-play-shading]] ·
[[looking-at-pixels]] · [[mechanize-the-review]] · [[novice-tester-scheduled]]


---

# 2026-09-08 — STATE AT THE COMPACT

`main` at `7f0271a`, clean, **1,072 JS + 180 Python**, both CI workflows green,
verified live from a real browser. **`docs/status.md` §0.00 is the pick-up point.**

⭐ **Kevin's direction this session was UX-by-inspection**: he walked the live site
and reported what he saw — a caption sentence that raised a doubt, 479px between
an event and its own detail, an "advanced" toggle offered to a novice, a bare
lowercase `goal`, and a penalty that would not clear. **Every one was real.** Two
of them exposed defects no instrument here could see.

⏭ **OPEN AND HELD FOR HIM:**
- **The `situationCode` witness for `box.js`** — 94.1% over 46,726 events,
  measured not built. The only check that would have caught the penalty bug
  without a lucky fixture. `status.md` §0.00-η.
- **`team-season.js` cites "the 7.8% of blocks made by a teammate"** — not in
  `measures.json`, not on `quoted-figures.test.js`'s hand-written list, not
  derivable at test time. Needs a derive run or the sentence loses the number.
- **`#pbA`/`#pbH` are parked markup nothing writes** — the penalty-box row's
  renderer went 2026-08-27 and the container stayed.
- **`?strength=even` still reaches the filter** if the Situations chips are ever
  wanted back; the derived show-rule that guarded them is written down where it
  stood, because it is not a shape to rebuild from memory.
- **K4 (a killer feature) is still gated on the novice test**, which has not
  happened. See [[novice-tester-scheduled]].


# 2026-09-14 → 09-16 — the red-on-red fix, and the thread it opened

**SHIPPED.** Each net now wears the abbreviation of the club defending it
(`f35ef78`) — vertical, in the 6-unit strip behind the net, `.38` opacity,
under every mark. ⛔⛔⛔ **The same element had shipped and been deleted two hours
apart in August and NEITHER doc the record pointed at mentions it** —
`git log -S` the identifier you are about to reintroduce. See [[red-on-red-ends]].

**BUILT AND DECLINED.** Kevin asked for the scoreboard to follow the ice, I found
it was six live pairs and built it as one class (`8477719`), it worked at 1400×900,
844×350 and 390×844 — and he reversed it the next day: *"I just don't see how
switching the scoreboard aligns with anything to teach the novice the game of
hockey."* **He is right and my argument for it was a bad analogy**: a rink that
does not flip contradicts a FACT ABOUT HOCKEY; a scoreboard's left-right order is
a LAYOUT CONVENTION a novice holds no prior about. Reverted `b631b17`, with the
reason in the commit body so `git log -S hostleft` lands on a decision rather than
a bare deletion.

⭐ **THE SENTENCE WORTH KEEPING FROM THAT:** the net labels did not expose a defect
further down the page — **they made the scoreboard's job smaller.**

**ALSO SHIPPED:** the front door's three totals now say why they differ
(`3a55fb2`); the penalty band under the ice is deleted rather than hidden
(`c44373b`); `refcheck.py` could not cite `tools/*.mjs` and said *"no such file in
the repo"* about a file that exists (`95920f6`).

⏭ **AND THE THREAD IT OPENED IS NOW THE LIVE ONE** — deleting that one `<div>`
touched eleven files, Kevin asked why, and the answer was not about penalties:
[[test-tier-architecture]].

## 2026-09-17 (late) — Kevin's three live-site catches, all shipped through the release gate
- `fc7ec1d` goal label on the ice = **TEAM · GOAL — scorer** (Team · Event · Player, the page's grammar; Kevin first
  wrote it backwards and agreed). Drawn from `playSaid()`, so ice and share confirmation can't diverge; 330 goals in
  52 games measured, 0 overflow. Fallback if one ever clips: smaller FIRST line, never the assists line.
- `35b6ef6` hero loop **starts at the opening faceoff** (Kevin: "level sets everything, what a novice expects"). The
  old start (one frame before first attempt) was a counter reason that expired; `hl` = first goal's play index now.
- `4366ebc` hero **always ends on a goal**: page goal search unbounded (non-shootout), selector outward
  ([3,8] → newest with any hl → newest). Derive run by hand; freshness median 1d, p90 5, p99 128 (season openers).
⛔ Lessons: `delaysOf` recorded the bundle's EMBEDDED boot first — hidden while its loop was short. A shootout test
checking "not the last frame" stayed green with the rule deleted — assert the specific thing (stops short of THAT goal).
The "hero looks different" report was the HERO GAME changing (aa368ce), not code — check data before code.
- `ae6901d`+`79ed96e` test-program work (see [[defect-corpus-evidence]]). ⏸ **UNCOMMITTED at the compact:** the
  goalie-eye-view/Workshop deletion + the transitive orphan walk + the figure-selectability rule + the new
  `tools/browser/states.mjs` (21 files, gates green).
- ⛔⛔ **2026-09-17 KEVIN, FROM THE SITE: "we removed the surfacing of the goalie eye view and the mascot stuff a
  while ago, shouldn't they be removed from the source code?"** — DELETED: `src/goalie-eye-view.html`,
  `src/workshop.html`, `builders/build_gv.py`, `tools/figure-bench.py`, `test/goalie-view.test.js`, `figTabletop`
  (3,161 bytes shipping unreachable in BOTH replay pages because `figStyle` is a CONSTANT). Resurrection recipe in
  docs/status.md (`git log -S goalie-eye-view`). ⭐⭐ **A TEST EXISTED AND HAD A HOLE: the orphan walk collected
  links from EVERY page, including UNLISTED ones — so the unreachable Workshop kept its children looking reachable.
  One page's exemption silently excused two more.** Fixed: the walk starts at index.html and is transitive.
  ⭐ **A COMMENT ASSERTING CODE IS ALIVE IS NOT A CHECK** — marks.js said "figTabletop is NOT dead code" while
  nothing could call it; test/figures.test.js now requires every style the module ships to be selectable by a surface.


## ✅ 2026-09-26 — WHERE THE SITE IS

**4,604 games archived, 4,537 published, `dataThrough 2026-09-25`.** 1,506 JS +
231 Python tests. Run `node builders/health.mjs` before quoting any of that.

**Kevin's standing rule is closed on every surface that prints a number**
([[show-the-work-or-do-not-print-it]]): 12 doors on three static pages plus one per
replay layer, and `how-we-measure.html` carries a section for the figures the rest
of the site prints and an index of the replay's six layers in their own words.

⏭ **THE TWO OPEN THREADS:** the work door should open OVER THE RINK rather than
navigate away ([[work-door-over-the-rink]], ruled and not built), and `charging`
appears in none of the three seasons archived — five new penalty descriptors landed
in seven days and the question is whether the league changed its vocabulary
([[ingest-delivery-target]]).

---

# 2026-10-04 — WHERE THE BUILD STANDS

**Live and green at `37bf0db`.** Suite 1,628 JS + 237 Python; eight local browser
probes, two of them written today. `data/measures.json` is the published document
byte for byte: **4,226 games measured, through 2026-10-03**.

## WHAT CHANGED ON THE SITE

1. **The summary card compares the two teams.** Each lens row draws a mark per
   team on one rail, against a NEW published reference class `perTeamGame` —
   the same lenses counted per team-game rather than per game. Stoppages keeps a
   game total and a neutral mark, because a stoppage names a rule and never a
   team. The picture is the preview card's, reused so a reader learns one chart.
2. **The summary has a door in the sidebar**, beside `Copy a link to this
   moment`, reachable from the first frame with no layer chosen.
3. **A shared link carries the panel** — `summary=1`, a flag beside `preview`.
4. **The final horn carries no strength state.** No empty-net chip, no pulled-
   goalie sentence, no goaltender on the ice, over a game that is over.
5. **The site says "team", never "club"** (2026-10-03), and the archive figures
   `src/lib` argues from are now WRITTEN from the published document rather than
   retyped by a human.

## THE NIGHTLY, AFTER TWO FAILURES AND TWO FIXES

The `measure` job in `ingest.yml` pulls the whole archive, measures it, checks
the span on both sides of the publish, and commits the refreshed build input only
if `npm run gates` passes. Both of 2026-10-04's runs failed, for two different
reasons that were both mine, and both are now gated:

- three archive figures quoted in COMMENTS went stale → `tools/quoted-figures.mjs`
  writes them, in the same step, before the build;
- the health block was written BEFORE `npm run build`, so the suite it counts ran
  against stale pages → build first, and `health.mjs` refuses to write from a red
  suite.

⚠️ **THE STRUCTURAL FACT TO CARRY FORWARD:** `data/measures.json` is a build input
committed WITH the code; the game shell FETCHES the published copy, which the
nightly rewrites hours later. **Every new field in that document is absent on the
live site for one night while present in every local test and every probe.** That
cost a live defect today. Drive the page with the field deleted.

## ⭐⭐⭐ HOW TODAY WENT, WHICH IS THE PART WORTH REMEMBERING

**Five defects. All found by Kevin from the live site. None by a green suite. Two
of them while I was telling him the opposite was true.** The repeating shape is
in `mechanize-the-review.md` #55: I kept checking a property that was true and
reporting one that was not — `display` for visibility, a green deploy for a
correct page, a pass count for a green suite.

⭐ The habit that actually works on this project: **after a deploy goes green,
fetch the live page AND the live published document and render them together.**
That is what caught the per-team marks sitting on the wrong scale, and nothing
else would have.


## ⭐⭐⭐ 2026-10-06 → 10-07 — THE TWO THREADS KEVIN OPENED, BOTH BUILT

Everything in these two days started from one question of his off the feed
inventory, and **every design decision was settled by measuring rather than
arguing**. That is the pattern worth keeping.

1. **[[second-witness-league-figures]]** — six of the league's own per-team
   figures checked against our event log, published when they disagree
   (*"concur, full transparency always"*). It caught a real one its first day.
2. **[[player-card-and-reliability]]** — the preview's player block, four figures
   drawn as graphs. ⭐⭐ The measurement **inverted my recommendation**: I argued
   for goaltenders and their rates do not settle at all.
3. **[[preview-what-to-watch-for]]** — the card rebuilt: `control.html` closed
   the diagram brainstorm, four tiles, the two teams first, the player block on
   top.

⭐ **TWICE IN TWO DAYS I TOLD KEVIN SOMETHING FALSE AND THE DATA CORRECTED IT, not
my reasoning**: *"a re-extract, not a re-fetch"* (true of 47 games of 4,603) and
*"the next run re-derives the archive"* (the nightly holds pointers only). Both
were caught by looking at a published artifact and finding a key missing.
**When a claim is about what the pipeline HAS, go and read one.**

⚠️ And Kevin caught a third in one line — I quoted a reliability band instead of
the declared threshold, which flipped the answer. See [[mechanize-the-review]] #71.
