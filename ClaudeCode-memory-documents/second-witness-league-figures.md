---
name: second-witness-league-figures
description: "⭐⭐⭐ THE SECOND WITNESS — six of the league's own per-team figures, checked against our event log and PUBLISHED when they disagree. Kevin, 2026-10-06: *\"we'll need to figure that out and integrate it into our 'check our work'\"*, and on whether a reader is told: *\"concur, full transparency always.\"* MEASURED FIRST over 40 games: hits, giveaways, takeaways, faceoffWins and pim reproduce EXACTLY — 80 of 80 team-sides. ⛔⛔ Blocked shots matched 3 of 40 until the definition was found, and the definition was KEVIN'S OWN OBJECTION: the league credits a block only to an OPPONENT, so a puck off the shooter's own man is in nobody's total — 125 of those in 40 games. ✅ LIVE and it caught a real one its first day. ⛔ But only 47 of 4,603 games have the rail raw to check against."
metadata:
  node_type: memory
  type: project
  originSessionId: ff173db5-1717-462d-b1d1-955659c28146
  modified: 2026-10-07T14:01:02.732Z
---

# The second witness

Built 2026-10-07, `0aae53c`. Kevin raised it off the feed inventory and ruled on
the open design question in four words: *"concur, full transparency always."*

## ⭐⭐ THE MECHANISM ALREADY EXISTED, ON EXACTLY ONE FIGURE

Nothing here was invented. Three parts, all load-bearing before this:

- `extract.py` `quoted` — the league's own numbers, **copied and not computed**,
  with `src` naming the document. It carried `score` and `sog`; it now also
  carries `quoted.team` from `right-rail.teamGameStats`, **nested under its own
  `src`** because the two halves come from different documents and one label over
  both would be false about half of what it names.
- `validate()` has two verbs and a stated rule: `check` REFUSES, `note` RECORDS
  and publishes. **Refuse on what WE could have got wrong; record what the LEAGUE
  got wrong.** All six new figures are `note`: a team total disagreeing with the
  event log is two of the league's own documents disagreeing, and we replay the
  event log.
- `unreconciled` rides on the artifact and `app.js` renders ONE standing
  sentence, absent when there is nothing to say.

⭐ So the build was **widening a proven path from one figure to six**, which is
why it was a day and not a week.

## ⭐⭐⭐ MEASURED BEFORE A LINE WAS WRITTEN — 40 games, ten per season

| figure | games exact | team-sides |
|---|---|---|
| `hits` `giveaways` `takeaways` `faceoffWins` `pim` | 40/40 each | **80/80** |
| `sog` | 38/40 | 78/80 — the known boxscore self-disagreement |
| `blockedShots`, credited to the **opponent** | 39/40 | 79/80 |
| `blockedShots`, to any blocker | 3/40 | 21/80 |
| `blockedShots`, to the shooter's team | 0/40 | 1/80 |

## ⛔⛔ THE DEFINITION THAT MADE BLOCKED SHOTS AGREE WAS KEVIN'S OWN OBJECTION

I predicted the blocker's team would fit. It fits 3 of 40. **The league credits a
block only to an OPPONENT** — a puck that hits one of the shooter's own men is a
blocked-shot EVENT in nobody's total. **125 of those in 40 games, about three a
night.**

⭐ That is exactly what Kevin said on the Attempts door, 2026-09-30: *"the shot
could be deflected by a teammate, the shot could hit a teammate too, there are
(at least) 5 ways a shot attempt could end."* He was arguing about a sentence.
It turns out to be the measurable reason our count and the league's differ.
**A reader's objection to prose was a specification nobody had written down.**

## ✅ IT CAUGHT A REAL ONE ON ITS FIRST DAY, AND THE READER IS TOLD

Live on readthegame.co, STL at CHI, 6 October:

> *"the league's game summary says **28 faceoffs won for CHI**; its event log says
> **30** — we show the event log"*

Names the document (`game summary`, not `boxscore` — the noun and the document
both come from the NOTE, not from a branch per kind), the right side only (STL
agreed and is not mentioned), both numbers, and which we chose.

## ⚠️ THE SCHEMA BUMP IS THE POINT, AND I GOT ITS MECHANISM WRONG FIRST

`derive` re-reads a game only when its raw digest OR `extract.SCHEMA` has moved,
so without the bump this would have existed for games fetched from that day and
for **no other** — shipped INERT over 4,661 games with every gate green.

⛔ **BUT I TOLD KEVIN "THE NEXT RUN RE-DERIVES THE ARCHIVE" AND THAT WAS FALSE.**
The nightly `ingest` rehydrates **POINTERS ONLY** and physically cannot: it
derives only games whose raw it fetched. The full re-derive is `derive.yml`,
which pulls the whole raw archive and runs with no window — `workflow_dispatch`
plus a weekly cron at `47 15 * * 1`. **A green nightly is not a re-derived
archive**, and the evidence was right there: a 2026 game had the new key and a
2023 game did not.

## ⛔⛔⛔ AND ONLY 47 OF 4,603 GAMES CAN EVER BE CHECKED, TODAY

See [[nhl-feed-inventory]] — `right-rail` has only been STORED since 2026-09-30.
The witness is live for every game from here on and **absent** (not wrong — the
key is simply missing) on the rest. Backfilling costs ~4,556 league requests.

## ⚠️ ONE "DISAGREEMENT" THAT WAS NOT ONE

My 40-game sweep found one blocked-shot gap (UTA@NYR, one block in 24) in a game
with no flag. It was not a parse disagreement: the published extract held **315
events / 45 blocked shots** and the live feed held **316 / 46**. ⭐ **The league
amended the game after we derived it** — the behaviour priced on 2026-10-05, seen
again. *"No new games" and "nothing changed" are different questions.*

## ✅ 2026-10-11 — ARCHIVE-WIDE ON THREE FIGURES, via the boxscore

Kevin ruled *"yes"*. `extract.SCHEMA` 5 adds `quoted.box` (src
`boxscore.playerByGameStats`): hits, takeaways, blocked shots summed over the
player rows, checked on EVERY game, and a note names the PLAYERS who differ.
pim/giveaways stay rail-only (boxscore lossy, [[nhl-feed-inventory]]); faceoffs
cannot be summed. Commits `1542c27` `b422484`. Reaches old games only on the
next `derive.yml` run — a manual dispatch was refused by the permission check,
so the Monday cron does it; verify a 2023 extract carries `quoted.box`.

⛔⛔ **THE ARCHIVE MEASUREMENT CAUGHT MY BUG BEFORE A READER DID.**
`box-witness-archive.yml` (dispatch only) runs the real `derive.judge` over
every game. First run: 89 of 1,501 games flagged in 2023-24, zero elsewhere —
every one a GOALTENDER, whose boxscore row has no hits/takeaways/blockedShots
key at all, read by me as zero. My fixture test "a goaltender is summed"
asserted the wrong assumption and passed. Fixed: **a row witnesses only the
fields it carries**, and an unwitnessed player leaves both sides. Re-run: 0 of
4,634. ⭐ The 268/268 was about RECENT games; a measurement's population is
part of its claim.
