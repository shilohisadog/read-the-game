---
name: nhl-feed-inventory
description: "⭐⭐⭐ WHAT THE LEAGUE FEED CARRIES — five documents a game, four FETCHED and STORED (`play-by-play`, `boxscore`, `shifts` ESSENTIAL; `right-rail` only since 2026-09-30, so the second witness covers 134 of 4,620 games). ⭐⭐⭐ MEASURED 2026-10-10 BEFORE BUILDING ON IT: the boxscore's per-player sums reproduce the rail EXACTLY on hits, takeaways and blocked shots — 268/268 team-sides — and are LOSSY on pim (236/268) and giveaways (166/268), always short, never over. ⛔ The boxscore is the one that is wrong: our own event log matches the rail 260/260 on all four. ⚠️ Faceoffs are a per-player PERCENTAGE with no denominator; the rail gives \"12/30\". So THREE of six figures can go archive-wide for zero league requests and three cannot."
metadata:
  node_type: memory
  type: reference
  originSessionId: ff173db5-1717-462d-b1d1-955659c28146
  modified: 2026-10-10T22:10:00.000Z
---

# What the NHL interface actually carries

Kevin, 2026-10-06: *"what other data is available from the NHL interface we
currently read?"* Measured against game `2026020024` read live from the league,
and against **every reader in the repo** rather than one file.

## The five documents, and how little of four of them we use

`builders/fetch_nhl.py` — `WEB = api-web.nhle.com/v1`, `STATS = api.nhle.com/stats/rest/en`.

| document | what we read | size |
|---|---|---|
| `gamecenter/{g}/play-by-play` | **almost all of it** — plays, coordinates, situation code, shot type, zone, the actor table | 134 KB |
| `shiftcharts?gameId={g}` | start/end of every shift (702 rows here) | 251 KB |
| `gamecenter/{g}/right-rail` | **ONE field** — `gameVideo.threeMinRecap` | 5 KB |
| `gamecenter/{g}/boxscore` | **NOTHING** — fetched only as the independent witness for `--validate` | 13 KB |
| `schedule/{date}` | dates and fixtures | — |

## ⛔⛔⛔ THE CLAIM THAT USED TO BE HERE WAS FALSE, AND I TOLD KEVIN IT TWICE

This section said: *"we store the RAW of all four per game, so everything below
is a re-extract away, not a re-fetch — it costs the league nothing"*, and that it
**retired** the objection that killed the recap backfill.

**Measured 2026-10-07, against the live archive: it is true of 47 games out of
4,603.** `right-rail` only began being stored when the recap was built on
2026-09-30, so every game before that has pbp + shifts + boxscore and NO rail.
A backfill of the second witness would cost **~4,556 league requests** — the same
number and the same objection Kevin already ruled on
([[nhl-highlight-embed]]: *"I hesitate to pull that much information from a free
service"*, ~4,600).

⭐ **HOW IT WAS CAUGHT, AND IT WAS NOT BY THINKING ABOUT IT.** The full re-derive
ran, and `quoted.team` appeared on a 2026 game and not on a 2023 one. Sampling
fourteen games across the whole date range showed `quoted.team` and `recap`
appearing and disappearing TOGETHER, exactly at the storage boundary. **The
inventory was right about which documents we FETCH and wrong about which we have
KEPT, and nothing in it distinguished the two.**

⭐ **THE ONE THING THAT IS GENUINELY NEW:** it is the SAME fetch. One pass over
`right-rail` delivers the witness backfill AND the recap backfill. That does not
change the request count; it changes what is on the other side of it, so the
recap ruling is worth re-putting with two payloads attached.

⚠️ Raw is NOT publicly served — `data.readthegame.co/raw/...` answers 403. Only
`extract/`, the catalog and the index are public.

## ⛔ WHAT IS THERE AND NOTHING READS IT

**Per-player game stats** — `boxscore.playerByGameStats`, per skater:
`goals, assists, points, plusMinus, pim, hits, blockedShots, giveaways,
takeaways, shifts, toi, sog, faceoffWinningPctg, powerPlayGoals`.
Per goalie: `saves, shotsAgainst, goalsAgainst` **split by strength** (even /
power-play / short-handed), plus `starter` and `toi`.

**Team totals** — `right-rail.teamGameStats`: `sog, faceoffWins (18/48),
powerPlay (0/2), pim, hits, blockedShots, giveaways, takeaways`, away/home.

**Shots by period** — `right-rail.shotsByPeriod`.

**Who was there in authority** — `right-rail.gameInfo`: named **referees and
linesmen with sweater numbers**, both **head coaches**, both teams' **scratches**.
⭐ Worth noting now that the delayed-penalty diagram draws an official.

**More video** — `gameVideo.condensedGame` and a French recap; per-goal
`discreteClip` and `highlightClipSharingUrl` (we use `highlightClip` only).

**Odds and ends** — `rosterSpots.headshot` (a player photo URL; likely refused on
the same grounds as club marks), `pptReplayUrl`, `scoringPlayerTotal` (season goal
count at that moment), the shift feed's `eventDescription` / `shiftNumber` /
`hexValue`, and `right-rail.gameReports` — ten official report links including the
faceoff comparison and TOI reports.

## ⚠️ THE CAVEATS, STATED BECAUSE AN INVENTORY IS EXACTLY WHERE I HAVE BEEN WRONG

- Measured against **ONE game**, a 2026 one. **Field availability almost certainly
  varies by era** and the 2023 games in the archive have not been checked.
- ⛔ My first pass reported `hittingPlayerId`, `winningPlayerId` and
  `scoringPlayerId` as unread because I grepped `builders/extract.py` alone.
  **`src/lib/attribution.js` reads all three.** Sweeping every reader in the repo
  is what caught it — the same shape as [[active-player-artifact]], where an
  inventory checked eleven fields against the code and took the twelfth from
  memory. **Grep the whole repo, then say "nothing reads this".**

## ⏭ KEVIN'S TWO THREADS, 2026-10-06 — brainstorm after the compact

> *"a couple items stand out. As you mention it looks we can 'check our work'
> against league published information, we'll need to figure that out and
> integrate it into our 'check our work'. also, per player game stats sounds
> interesting, maybe a 'Player to watch' card on the preview card?"*

1. **THE SECOND WITNESS.** The league publishes figures we derive ourselves —
   per-team `sog`, `hits`, `blockedShots`, `giveaways`, `takeaways`, `faceoffWins`,
   and per-goalie saves by strength. On a site whose pitch is CHECK OUR WORK, a
   number is far stronger when the league's own figure sits beside ours.
   ⚠️ `extract.py --validate` ALREADY compares against the boxscore and its header
   warns *"never treat the boxscore as ground truth"* — that argument is the
   starting point, not an obstacle: the design question is whether a disagreement
   is shown to the READER or only to us. See [[show-the-work-or-do-not-print-it]].
2. **A "PLAYER TO WATCH" CARD** on the preview, from per-player game stats.
   ⚠️ The preview is a BEFORE-the-game surface and must not spoil a result
   ([[going-public-and-the-card]]: the board reads `PRE-GAME · 0–0`), so a card
   built from THIS game's stats cannot appear there — it would have to draw on
   prior games, which is a different and larger derivation.

Neither is started. Both are Kevin's, raised unprompted off this inventory.

## ⭐⭐⭐ THE BOXSCORE IS A SECOND WITNESS WE ALREADY OWN — 2026-10-07

Kevin, on the rail backfill: *"does 5 require fetches (requests) from the NHL
site/interface? If so, I really don't want to clobber that free interface any
more than we have to."*

⭐ **THE COST OBJECTION FOUND A DESIGN I HAD MISSED.** I had framed the rail
backfill as the only way to take [[second-witness-league-figures]] archive-wide.
It is not. `boxscore` is one of the three ESSENTIAL feeds, stored for every game
since the beginning, and `playerByGameStats` carries per player:

```
"pim": 2, "hits": 2, "sog": 1, "blockedShots": 3,
"giveaways": 1, "takeaways": 0, "goals": 0, "assists": 0
```

Summed over `forwards + defense + goalies` that is **five of the six witness
figures for all 4,603 games at zero league requests.** Verified on the stored
fixture `data/box_2023020204.json`: MIN `hits 31, giveaways 4, takeaways 6,
pim 8, blocked 18` against BUF `20 / 5 / 2 / 10 / 22`.

⭐⭐ **AND IT IS A BETTER WITNESS, NOT JUST A CHEAPER ONE.** The rail gives a TEAM
total, so a disagreement says only that the game is wrong somewhere. The boxscore
decomposition **names the player**, which is also the document the player card's
own figures were checked against (108 of 108 — [[player-card-and-reliability]]).

⛔ **THE ONE IT CANNOT GIVE IS FACEOFFS.** The boxscore publishes
`faceoffWinningPctg` per player — a RATE with no denominator, so it will not sum.
That is annoyingly the exact figure that caught the live CHI disagreement (28 vs
30), so the rail is not worthless; it is just no longer the only path.

## ⏭ THE NEXT STEP IS FREE AND NOT YET RUN

Do the boxscore sums equal the rail's `teamGameStats`? We hold BOTH for the 47
games since 2026-09-30 and both are in **our own R2** — zero league requests to
answer. If they agree, the witness goes archive-wide for nothing and the backfill
shrinks to faceoffs and recaps only.

⚠️ **IT CANNOT BE RUN FROM A LAPTOP.** Checked: there are no R2 credentials in
the dev environment and the raw archive is NOT publicly readable
(`/raw/latest/<id>.json` → 404 where `/extract/<id>.json` → 200). So this runs
where the raw is — a workflow, or as a third `quoted` source in `extract.py`,
which means a SCHEMA BUMP and a full archive re-derive. That is Kevin's call.

## ⭐⭐⭐ THE MEASUREMENT, 2026-10-10 — and it changed the answer

Kevin approved measuring before building. `.github/workflows/box-rail-witness.yml`
(dispatch only, reads nothing but our own bucket), **134 games / 268 team-sides**:

| figure | boxscore sums vs rail |
|---|---|
| hits, takeaways, blocked | **268/268** ✅ |
| sog | 265/268 — the 3 are the boxscore against ITSELF |
| pim | 236/268 ⛔ |
| giveaways | 166/268 ⛔ |
| faceoffWins | impossible — a percentage per player |

⭐⭐⭐ **THE GAP HAD A SHAPE, AND THAT IS WHAT MADE IT READABLE.** Every `pim`
disagreement is **exactly 2, rail always higher**; giveaways always short by 1–3,
never over. **A systematic one-directional gap is a definition, not noise.**

⛔⛔ **AND THE BOXSCORE IS THE WRONG ONE, NOT US.** Across every game holding a
rail, **our event log reproduces it 260/260 on hits, giveaways, takeaways AND
pim**. So the boxscore's per-player decomposition DROPS events the rail and our
own count agree on. A bench minor explains some — *served by a player, committed
by the team*, so it lands in no player's `pim` — but two of three games I opened
had none, so the mechanism is not fully named.

⭐ **THE CONTROL EARNED ITS PLACE.** The tool also checks the boxscore's
per-player `sog` against the boxscore's own team block, which is KNOWN to
disagree. It returned 265/268 — **exactly the three games that disagreed with the
rail**. The rail matches the boxscore's TEAM block; the per-player sum is the
outlier. Perfect agreement there would have meant the arithmetic was not reaching
the data.

⚠️ **HAD WE SKIPPED THE MEASUREMENT**, pim and giveaways would have cried wolf
across ~4,500 games against counts that are demonstrably right. This is the
clearest case yet for [[verify-inherited-claims]] applied to one's own plan.

## ⭐ 2026-10-19 — the GOAL TRACKING REPLAY ("sprites"), measured
Every goal in the play-by-play may carry `pptReplayUrl` → `wsr.nhle.com/sprites/<season>/<game>/ev<id>.json`:
~140 frames at 10/s (~14 s), every player + the puck with x/y (1/12 ft), id, sweater, team. GOALS ONLY.
Archive count (`feed-fields.yml`, run 39220582481): 94.0% of 29,631 goals carry the link — regular
seasons 96–98%, playoffs 98.6–99.6%, preseason 87–88% (2023-24 preseason 0%). Link ≠ file: only ONE
file fetched (2025020002 ev481, 200, 140 frames). ⚠️ The server 403s unless the request claims
Referer nhl.com + a browser UA; it blocks cross-origin browsers. ⛔ nhl.com Terms (updated 2025-10-29):
§2 bars "unauthorized spidering, scraping, or harvesting"; §7 grants only "non-commercial, informational,
personal use" and bars copying "NHL Content" into a database or making derivative works without written
permission — which reads on our existing play-by-play use too, not just sprites. Kevin to decide; licensed
route = Sportradar (Official Global Data Distributor, tracking data included), SMT (tracking vendor).
✅ Kevin 2026-10-19 (IANAL): OK to pull sprites and integrate, while asking the NHL for written permission in parallel.
LAB DEMO: lab.read-the-game.pages.dev/lab/tracking.html (one file, 2025020002 ev481, Brazeau). ⚠️ COORDINATES:
league feet = (x/12 − 100, 42.5 − y/12) — the sprite y is OPPOSITE the play-by-play's (puck on the face-off dot
at sprite +21.9 vs pbp (69,−22)); then our extract's per-period turn `f` (read off the goal's sign). Shot
matched pbp to <1 ft. Frames can hold 11 objects (someone untracked). Contacts given to Kevin: NHL has NO public
permissions email — NHL.com/contact (subject "DMCA/Trademark and Copyright Requests") or NHL Enterprises, L.P.,
Attn: Legal Department, One Manhattan West, 395 9th Ave, New York NY 10001, (212) 789-2000; Sportradar via
sportradar.com/contact or developer.sportradar.com/contact → "Sales" (us-sales@sportradar.com per search, unverified).
📨 2026-10-19: Kevin SENT the permission request via NHL.com/contact (my draft: non-commercial, no ads/subscription/
betting; ~5 docs/game nightly + proposed goal sprites ~6–7/game; open source, MIT covers OUR CODE ONLY). README's
licence section now says so (it had claimed "a single-game excerpt" — false: raw for 1 game + ~11 derived extracts).
⏳ Awaiting the NHL's reply; Sportradar pricing enquiry is Kevin's.
✅ 2026-10-19 PULLED: 2026-27 season, 1,146 of 1,146 linked goals (201 games), 0 missing/refused, stored at
data.readthegame.co/track/<game>/ev<event>.json (~220 KB each, raw as published; tracking.yml run 39328420910).
Sample of 27: ~13.9 s each (one 6-on-5 file 20.9 s); the puck crosses the goal line 8.2–10.4 s in (median 9.1),
so ~9 s BEFORE + ~4–5 s after; goal-line crossing found 27/27 (a reliable sync anchor); puck in every frame; 2/27
files have frames where players drop out (as few as 1 object). ⚠️ data.readthegame.co 403s Python's default UA
(Cloudflare) — send a browser UA in scripts.
