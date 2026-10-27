---
name: player-card-and-reliability
description: "⭐⭐⭐ SOMEONE TO WATCH — the preview's player block, built 2026-10-07 from Kevin's *\"maybe a 'Player to watch' card on the preview card?\"* ⭐⭐ THE MEASUREMENT CAME FIRST AND IT INVERTED MY RECOMMENDATION: I argued for GOALTENDERS (they face 30 shots a night where a skater takes two) and save fraction repeats at r=0.23 — 254 games to reach 0.8 against 82 in a season. SKATERS settle fast: at the declared TARGET of 0.7, shot attempts need 6 games, shots on goal 10, assists 24, goals 33 — all inside the club admission of 41. ⛔ Kevin caught me quoting the 0.6/0.8 SENSITIVITY PAIR instead of the threshold, which changed the answer. ✅ Four graph rows, both players on one axis, the club rows' own instrument one level down. ⚠️ It says what a player DOES, not how well."
metadata:
  node_type: memory
  type: project
  originSessionId: ff173db5-1717-462d-b1d1-955659c28146
  modified: 2026-10-07T14:01:40.465Z
---
## ✅ 2026-10-13 — THE PICK MUST BE PLAYING (commit 2adf1ae, verified live)
Kevin: naming a player who is out would be embarrassing. Measured over 2025-26
(1,312 games, 2,592 team-games): the season goal leader did not dress 196 times
(7.6%). Rule now: leader among skaters who dressed for the team's LAST game
(60/2,592, 2.3% — same-day scratches, unseeable at our nightly cadence; the card
says so). A PLAYED game's preview picks from that game's own roster (extract).
`players.json` carries `last` per row and `lastGame` per club; no dates → no block.


# The player block, and what the measurement decided

`d966014`. Kevin raised it 2026-10-06; every design question was settled by
measuring rather than arguing.

## ⭐⭐⭐ I RECOMMENDED GOALTENDERS FIRST AND THE MEASUREMENT SAID NO

My argument was sample size: *a goaltender faces 25–35 shots a night where a
skater takes two, so his rate settles in a fraction of the games.* **True, and
the conclusion is wrong.**

| goalie figure | r (alternate halves) | games to r=0.8 |
|---|---|---|
| save fraction | 0.231 | **254** |
| shots faced / game | 0.265 | 212 |
| slot share of shots faced | 0.485 | 81 |

Save fraction is nearly all noise — the spread between goaltenders is five
hundredths against huge game-to-game variation. Shots faced correlates at
**r = 0.08** chronologically because it is a property of the team in front of him
that night. ⭐ **A plausible argument about the data-generating process is not a
measurement of it**, and this is the cleanest example this project has produced.

## ⭐⭐ SKATERS SETTLE FASTER THAN CLUBS DO

2024-25, 1,312 games, 706 skaters with ≥20 games, read from **our own published
extracts** (no league requests at all), split on ALTERNATE games, through
`reliability.js::gamesToTarget`.

| figure | games @ **r=0.7** | (0.6 … 0.8) |
|---|---|---|
| faceoffs won / game | 1 | 1 … 2 |
| shot attempts / game | **6** | 4 … 10 |
| hits / game | 6 | 4 … 9 |
| shots on goal / game | **10** | 7 … 17 |
| blocks / game | 12 | 8 … 20 |
| assists / game | **24** | 16 … 41 |
| goals / game | **33** | 21 … 56 |
| takeaways / penalties | 65 / 71 | — |

Against the shipped club rows: `dmen` 23, `level5` 35, `slot` 38, admission 41.

⭐ **AND THE WITHIN-POSITION CONTROL HELD**, which is the one I expected to kill
it. I assumed the high r was just *"is he a centre"* — for faceoffs it is
(r=0.990 among forwards alone). But hits among forwards only separate 0.04–5.92
at r=0.943, and among defencemen only 0.08–4.54 at r=0.930. Real spread between
players doing the same job.

## ⛔ KEVIN CAUGHT ME QUOTING THE WRONG COLUMN, AND IT CHANGED THE ANSWER

I reported the table at **0.6 and 0.8** and concluded goals (56) and assists (41)
*"don't qualify"*. Kevin: *"why didn't we use the same r=0.7, isn't that what we
used for the team threshold?"*

`reliability.js::TARGET = 0.7` is **the one policy in that file** and the number
every published club figure is quoted at; 0.6/0.8 is the `atTarget` SENSITIVITY
PAIR published beside it. At the threshold all four of his metrics qualify and
**goals is faster than two shipped club rows**.

⭐⭐ **THE SHAPE: I QUOTED THE SENSITIVITY BAND AND OMITTED THE THRESHOLD**, and
the band straddled the decision — so the same measurement supported either
answer depending on which column I read. **When a document publishes a figure
AND its sensitivity, the figure is the claim.**

## ✅ WHAT SHIPPED, AND WHY IT IS A GRAPH

Kevin: *"let's try to put a line graph or two in those cards, walls of text just
aren't my thing … a graph does better than text, and the data clearly answers
the headline."*

So it is **the club rows' own instrument one level down** — one row per figure
with BOTH players on one axis, exactly as a club row puts both teams on one. The
axis is what skaters do over a full season, the tick is the median skater, the
ink is `games / need`, every row doors to its work.

⭐ **THE DATA ANSWERS THE HEADLINE, MEASURABLY.** A team's leading scorer runs
0.32–0.73 goals a game against a median skater at **0.13**, so the mark lands in
the right third of the axis. The picture says *this is the man who scores for
this team* without the caption asserting it.

**Selection: each team's leading goalscorer.** It is the one judgement on the
block, so it is a published function (`preview.js::watchFor`), it is PRINTED on
the card, and its test fixture puts the leader SECOND in the list with a
higher-assist player first — a renderer taking `[0]` or sorting on points fails.
⭐ It is a FACT about games already played, not a forecast, which is what makes
picking an extreme safe here; reliability governs whether the FIGURES mean
anything, not whether the pick is legitimate.

⚠️ **IT SAYS WHAT A PLAYER DOES, NOT HOW WELL.** Most of the distance between two
skaters is role and ice time. The caveat is the derivation's and travels to every
surface that draws the figure.

## ⚠️ FOUR THINGS WORTH CARRYING

- **108 of 108** per-player figures agreed with the league's own boxscore on the
  first game checked — the second-witness discipline applied to a new derivation
  before trusting it.
- `players.json` is a THIRD published document for the reason `teams.json` is a
  second: read by one page. Folding it into `measures.json` would put a few
  hundred player rows on the home page and every game page.
- ⛔ **A PLAYER ROW WEARS THE CLUB ROW'S CLOTHES AND IS NOT ONE.** Sharing the
  `pvm` class made **seven** club-row tests count seven rows where they mean
  three — nothing fails, the numbers quietly become about a different population.
  It carries `pvp`, shares the CSS, and the club assertions are scoped.
- Two gates re-aimed rather than loosened: the value spelling and the tick label
  are now the ROW's, because a club row is a SHARE reading `48%` and a player row
  is a RATE reading `0.39`. **"39%" under a heading that says "goals a game" is
  wrong by a factor of a hundred and looks entirely normal.**

See [[preview-what-to-watch-for]] for the card it sits on and
[[mechanize-the-review]] for the shapes.


## ⛔⛔⛔ AND IT SHIPPED INERT THE FIRST TIME

The first full derive after the build ran for an hour, reported **success**, and
`players.json` answered **404**: `derive.yml`'s upload step is a typed list and a
new document is not in it. Fixed with a gate that derives the publish set from
what `measure.mjs` actually writes — [[mechanize-the-review]] #75.

⚠️ **THE BLOCK ONLY APPEARS AFTER A FULL DERIVE.** The nightly writes a SLATE and
returns before `players.json`, which is correct — a players document describing
one night would be a card about three games. So the figures move weekly
(`derive.yml`, `47 15 * * 1`) and the card should eventually say what it is
measured through, the way the static pages do.

## ✅ AND IT CARRIES A DATE NOW — 2026-10-07

It was **the only figure on the site with no asOf on it**, found by fetching the
live card rather than by a red test. `players.json` publishes `through`, and the
block reads *"Counted through 6 October 2026, and refreshed weekly."*

⚠️ **THE DATE IS THE LATEST SEASON'S, NOT THE ARCHIVE'S.** `clubs` describes this
season only, so the archive's last date would be the right number for the wrong
population in every month but the first — **and the two coincide today**, which is
exactly how a figure like this ships wrong and looks right.

⭐ **THE CADENCE IS PART OF THE CLAIM.** These rows move with `derive.yml`
(`47 15 * * 1`) while the slate above them is rehydrated nightly, so
*"counted through <date>"* alone would still let a reader think two numbers on one
screen were taken at the same moment.

⚠️ A document with no `through` prints NO date. Reaching for `new Date()` there
would stamp the card with when we LOOKED, which is the distinction the stamp
exists to make — and that absent case ships first, so it has its own test.

## ✅ THE FACES, AND THE ROWS THAT NAME THE MAN — 2026-10-07

Kevin, reading the live card: *"what do you think about adding the players head
shot image? That would bring quite a bit of 'realism' to the page."* Plus two
corrections, both right:

- ⛔⛔ **"it says the team (PIT or WSH) when it should name the player."** THE
  THIRD TIME *a player row wears the club row's clothes and is not one* has cost
  something: `ab` was the colour key AND the printed label at once. Fixed at the
  SIGNATURE — `trackFor` prints `label`, falling back to `ab` — so no club row
  changed and a caller cannot pass the wrong one.
- ⛔ **"per game, not a game — that's more standard terminology."** ⭐ And the card
  was already disagreeing with itself: the goals row's sentence had said *"per
  game played"* since it shipped, two lines under a heading saying *"a game"*.

⭐⭐ **AND ONE HE DID NOT RAISE, IN HIS OWN SCREENSHOT: THE AXIS AND ITS CAPTION
PRINTED TWO DIFFERENT MAXIMA.** `trackFor` stretches the axis to hold every mark —
his own 2026-10-03 ruling, *"the game in question should be included, hence it's
the top of the scale, not outside of it"* — so a hot start BECOMES the end of the
scale (1.00) while the caption went on saying skaters ranged to 0.81. **It is the
clash that took the shaded band off the club rows, reappearing in the WORDS after
the picture was fixed.** The clause now names who, which way, and **on how many
games**, which is what makes *above the best full season* safe to read.

## ⛔⛔⛔ THE HEADSHOTS ARE COPIED, NEVER HOTLINKED — `builders/mugs.py`

Three reasons, each already a rule here: the preview's CSP was `default-src
'none'` **with no `img-src` at all** and `deploy.yml` READS those directives; the
site's own sentence is *"Nothing is fetched from the league while you watch"*; and
a hotlink is one request per READER PER PAGE VIEW on a free service where this is
~228 once and then only on a change. See [[nhl-feed-inventory]] and
[[mechanize-the-review]] #80 for the 200-that-means-absent trap that governs it.

⚠️ **THE SIZE WAS MEASURED, NOT CHOSEN**: 336px RGBA at 178,650 bytes against
**3,572** at 112px WebP; 744 KB for the whole league. The mugs are transparent
CUT-OUTS — read off the alpha channel, not inferred from one composite on a white
page — so they sit on the card's tint with no white box.

⭐ **LOOKING MOVED THEM.** Rendered below the naming sentence they sat under two
paragraphs, so a reader met the names, the clubs, the rule and the measurement
date before meeting the men. They lead the block.

## ✅ NIGHTLY, FRAMED, AND A NUMBER WHERE THERE IS NO FACE — 2026-10-07 (2)

Kevin, reading two different previews:

- *"we need to refresh the data nightly, so there's the potential of new 'players
  to watch' every game."* ⭐⭐ **IT WAS ALREADY BEING COMPUTED NIGHTLY** — the
  nightly `measure` job pulls the whole extract archive and runs archive mode,
  which writes `players.json`, and published only two of the three documents.
  See [[mechanize-the-review]] #82 for the six stale cadence comments that
  sweep then found.
- *"the headshots need to be separated and enlarged, maybe a frame around each…
  right now it doesn't look very professional."* A transparent CUT-OUT has no
  edge, so at 64px on a page tint it reads as clip art. **96px, a circular frame,
  and the ring is the CLUB'S OWN COLOUR** — `readableInk(colourOf(…))`, the same
  function the track marks use, so a man's face and his mark match on one screen.
  ⭐ The ring also restores the club identity the rows gave up when they started
  naming the player.
- ⛔⛔ *"doesn't have a headshot of Knies … but his name appears above where the
  image will go, which isn't correct."* **A cell with no frame is shorter than
  one with a frame**, and two heights in a flex row do not line up, so the
  shorter cell reads as a layout fault rather than a missing picture.

⭐⭐ **WHAT FILLS THE FRAME WHEN THERE IS NO PHOTOGRAPH IS THE SWEATER NUMBER.** A
fact about the man rather than an apology for the gap — and the one fact this
block exists to give a newcomer, **who cannot look for a face from the stands.**
Verified live on UTA at CBJ: a photograph beside a `#89` disc, which is Knies,
which is the screenshot Kevin sent.

⚠️ **IT REVERSED A RULE I HAD WRITTEN THAT MORNING** — *"no headshots at all means
NO face row"*, argued from two bare SURNAMES being furniture. True of names,
false of numbers: *look for #11 and #87* is worth saying on its own.

⚠️ **AND THE CARD'S CAVEAT MOVED TWICE**: *"refreshed weekly"* → *"refreshed each
night"*, and *"a game played since tonight's slate was listed"* → *"a game played
after that date"*, because **this same card renders for games already PLAYED**,
where the first wording was not stale but simply false.
