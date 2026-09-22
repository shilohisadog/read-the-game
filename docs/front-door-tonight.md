# Tonight on the front door — the whole night, not the first game in it

**Written 2026-09-22 as a plan for review; §4's three decisions are ruled by
Kevin and the plan is otherwise unchanged.** Nothing is built. It changes the
daily block that `docs/front-door.md` §5 designed and §12 built, and it must not
break a ruling that document made, so that ruling is answered first (§2).

**WHAT PROMPTED IT, for a reader arriving cold.** The front door carries one
block whose content changes with the date (`src/lib/daily.js`, rendered by
`drawDaily` in `builders/build_index.py`). On 21 September it read *"Next: BUF at
PIT, Monday, September 21 at 7:00 PM."* The live `schedule.json` held **eight**
games that night. Kevin, from the live site: *"I know there are more games tonight
than that."* It shows one by design — `nextFixture` returns `rows[0]` — and the
audit found two more things wrong with the block that bite from **29 September**.

---

## 1. Three defects, one of them eight days out

1. **One game of eight.** The `upcoming` state names the first fixture and stops.
2. ⛔ **In season, the forward look disappears on every game day.** `daily()`
   returns `slate` whenever `recent.json` holds games, and `slate` carries
   `next: null`. In preseason `recent.json` is empty (preseason is out of scope for
   it), so *Next* is what a reader sees. From the regular season's first morning
   most days hold results, and tonight's games vanish from the front door.
3. **The schedule never reaches past today.** The nightly's window is 14 days and
   the league's `/v1/schedule/{date}` answers with the week STARTING at that date,
   so `schedule_urls` asks for exactly two weeks and the second ends on the run's
   own date. `upcoming` therefore only ever holds today's unplayed games. On a night
   with none, the block cannot name the next one — and once tonight's last game
   starts, there is nothing to show until the next ingest.

## 2. The ruling this has to answer

`docs/front-door.md` §12.3: *"The block names the next fixture rather than
counting a slate for the same reason: a count over a window we cannot date
honestly is a number with no population."* A 7 pm Eastern game is 23:00Z the same
day and a 10:30 pm Pacific one is 05:30Z the next, so no UTC date names a night,
and the module refused to invent one.

⭐ **The league already dates it, and we throw the date away.** `classify()` in
`builders/fetch_nhl.py` attaches `week.date` to every game — *"The league's own
labelling of which day this game belongs to … a 22:00 Pacific game belongs to its
game date, not to the following UTC day"* — and the loop that builds `upcoming`
copies seven fields and not that one. **Carrying it gives the night an honest
population: the games the league lists for 21 September.** Nothing is derived from
a clock, so §12.3's objection does not apply, and its reasoning is kept: the
module still formats no time; the browser still does.

⚠️ **And "Tonight" is earned, like "Last night".** §12.5 earns *Last night* from
the game dates rather than from a timestamp. The same rule here: the block says
*Tonight* only when the league's date for the night equals the reader's local
date; otherwise it names the day (*"Tuesday, September 22"*). A reader in Europe,
for whom a 7 pm Eastern game starts after midnight, gets the day's name rather
than a false *tonight*.

## 3. The plan

### 3.1 Pipeline — `builders/fetch_nhl.py` (takes effect at the next ingest)

- **A1. Carry the league's date** onto each `upcoming` fixture: one field,
  `"date": g.get("date")`.
- **A2. One more schedule request** — the week starting the day after the window
  ends — so `upcoming` holds up to seven days ahead. **+1 request per night** to a
  feed we do not pay for; `schedule_urls`' own docstring is about asking for as
  little as possible, and one request buys the next night on every quiet day and
  the club preview's *next game* (`docs/preview-and-corsi.md` §10) later.
  `schedule.json` is **1,789 bytes for 8 fixtures** today (~224 bytes each); a
  regular-season week is about 50 games, so roughly **11 KB**. Its only reader is
  the front door, and it loads in parallel with a 467 KB catalog.

### 3.2 Module — `src/lib/daily.js` (pure, fixture-tested)

- **B1. `nextNight(schedule, now)` replaces `nextFixture`.** Group valid fixtures
  by the league `date`; the next night is the earliest date that still has a
  fixture whose start is after `now`. Return **every fixture of that night**, each
  marked `started` when its start has passed — so at 9 pm the night reads *8 games,
  5 under way* rather than shrinking to the three late ones.
- **B2. Shape:** `night: { date, count, fixtures (capped at SHOWN), more }` — the
  count is the whole night, the same rule as §12.2 (*a block saying "6 games" on a
  sixteen-game night would be a false claim about hockey to save a layout*).
- **B3. `slate` carries `night` too**, which is defect 2's fix. The module stays
  pure and returns both; what fits is the renderer's decision.
- **B4. Preseason is named** from `gameType` (1), per fixture, because a
  late-September night can mix preseason and regular season.
- **B5. ⚠️ THE DEPLOY SEAM.** The site deploys on push; the pipeline change takes
  effect at the next ingest, so for up to a day the page reads a `schedule.json`
  with no `date` on its fixtures. **`nextNight` degrades to today's behaviour —
  the single next fixture — when fixtures carry no date**, and a test holds that
  shape. The same seam as every published-document change on this site.

### 3.3 Renderer — `drawDaily` in `builders/build_index.py`

| state | kicker | body |
|---|---|---|
| `upcoming` (no results held) | **`Tonight · 8 preseason games`**, or the day's name when it is not the reader's today | up to six rows, `BUF at PIT · 7:00 PM` in the reader's time, *under way* once started; `2 more tonight` tail |
| `slate` (results held) | unchanged: `Last night · 11 games` and its rows | **plus one line**: `Tonight · 13 games from 7:00 PM` — see §4 Q2 |
| `offseason` | unchanged | unchanged |

- **C1. Tonight's rows are not doors,** and must not look like them. Every `.drow`
  is an anchor into a replay (*"each row is a door"*, `build_index.py` stylesheet);
  a future game has no replay and no page. They render as plain text in a distinct
  style — no border-on-hover, no pointer — until a destination exists (§4 Q1).
- **C2. The tail has no page to go to.** The slate's tail links to
  `calendar.html?date=`, which shows games we HOLD and never reads `schedule.json`
  (only `src/index.html` does), so it has nothing for a future date. So the rest of the night opens in place (`<details>`), which grows the card
  only when the reader asks — the §12.2 layout problem arises only on request.
- **C3. "The last night we hold — see it →"** stays in the `upcoming` state, as today.

### 3.4 Tests, written first — `test/daily.test.js`, `test/test_fetch_nhl.py`, `test/homepage.test.js`

Each seen to fail against the mutation beside it before it is kept.

| claim | the mutation that must turn it red |
|---|---|
| the league date reaches `upcoming` | drop the field in the copy loop |
| the schedule reaches past today (A2) | remove the extra URL |
| the night is every fixture on its league date | return `rows[0]` (today's code) |
| the count is the whole night, the rows are capped | print `fixtures.length` as the count |
| a started game stays in its night, marked | filter `startTimeUTC > now` per fixture |
| the next night skips a night whose games have all started | pick the earliest date regardless |
| ⛔ no date is derived from a clock — the night is the league's | group by `startTimeUTC.slice(0,10)` |
| a fixture with no `date` degrades to the single next fixture (B5) | throw, or render an empty night |
| `slate` carries the night (defect 2) | return `night: null` from `slate` |
| preseason is named per fixture | label the night from its first fixture |
| *Tonight* only when the league date is the reader's local date | always print *Tonight* |
| tonight's rows are not anchors | render them as `.drow` anchors |
| a team page gets no daily block (existing guard) | call `drawDaily` from the team branch |

⛔ **And the layout, which no unit test can see** — §12.2's own lesson. A browser
measurement at **1900 px** and at **568 × 320** (the landscape phone the portrait
ruling left) on a quiet night, a 16-game night and a results-plus-tonight morning:
the card must not grow past the heights §12.2 measured (800 px quiet, 1,010 px
capped), and nothing may clip. `tools/pixels.sh` can already rebuild a slate from
a real date; it needs the same for `schedule.json`.

## 4. Decisions — ✅ ALL THREE RULED BY KEVIN, 2026-09-22

**Q1. Tonight's rows — text now, or doors to the club pages? ✅ TEXT.** A club link is a
real destination today, but the club page has nothing about the coming game yet;
the preview card (`docs/preview-and-corsi.md` §12) is what would make it worth the
click. **Recommend: text now; the rows become doors when the preview ships**, so a
link never lands on a page that says nothing about why it was followed.

**Q2. In season — one line, or rows? ✅ ONE LINE.** The results rows already fill the slack
beside the rink (§12.2: ~440 px at 1900, 42 px a row). Tonight's rows beneath them
would push the card toward the 16-row height §12.2 rejected. **Recommend: one line
in season** — *Tonight · 13 games from 7:00 PM* — which opens to the list in
place; rows only when there are no results to show. To be confirmed by the layout
measurement, not by this argument.

**Q3. Is +1 request per night acceptable? ✅ YES.** It is the whole of the pipeline change
that isn't a field copy, and the club preview needs it anyway.

## 5. CHENG's review — 2026-09-22, endorsed with four additions

He called the core right — *"the league's own date is already fetched and
discarded in a copy loop … the same shape as the `hl` field and `drew`, a fact
the pipeline holds and throws away"* — and added four things, all adopted.

**5.1 B5 must ANNOUNCE its degradation.** *"Nothing distinguishes 'the pipeline
hasn't run yet' from 'the pipeline is broken.' Both render one fixture,
indefinitely, with no signal … the observed failure mode on this site is that
nobody notices — the stale `#start` link, the hero's fixed string, the parked
strength control."*

⭐ **Adopted, and placed one step earlier than he proposed.** He suggested the
health block, beside the ledger. The ledger is READER-FACING copy — *Data through
20 September. Checked daily.* — and *"fixtures with a league date: 0 of 13"* is
not a sentence for a novice. The run can do better than report it: `ingest.yml`
already carries a **pre-sync check** that refuses to publish (*"games without a
date, so dataThrough is unreliable"*), and the same block gains

- ⛔ every fixture in `upcoming` carries a `date`, or the run does not publish;
- ⚠️ a warning when every fixture shares ONE date, which is what A2 silently not
  working looks like — the check that would otherwise pass forever;
- the counts printed beside the others, so a reader of the log sees the span.

Vacuous when `upcoming` is empty, which is five months of the year.

**5.2 C2 — the disclosure is CLOSED on first paint, and the closed height is the
budget.** §12.2's numbers are what every visitor sees, so the browser check
measures it closed; the open height is a separate figure that exists only on
request. **And the summary carries the count** — `2 more tonight`, not a bare
chevron: *"the difference between a disclosure and a mystery box."*
He also sharpened WHY there is no page to link: **`calendar.html` shows games we
HOLD, and a future night is by definition games we do not hold.** A page would
mean teaching the calendar to read `schedule.json` — a second data source and a
second notion of what a game is.

**5.3 One more test, as a PROPERTY.** Not *this row is not an anchor* but: **no
row rendered in the `upcoming` state produces an `href` at all**, so a future
change that adds one fails on arrival rather than passing the instance check.

**5.4 The Europe case is a correct oddity, not a defect.** A reader for whom a
7 pm Eastern game starts after midnight sees the day's name rather than *Tonight*
— *"it isn't their tonight"* — and it follows from §12.5's rule rather than a new
one.

⭐ **And the fixture path is the only way to see this before the season starts.**
A 16-game night and a results-plus-tonight morning are the two states that break
the layout, and neither exists in September; `tools/pixels.sh` can already rebuild
a slate from a real date and needs the same for `schedule.json`.

## 6. What this does not touch

The `offseason` state, the hero, the one-live-preview rule (§5.3), the phone's
portrait prompt, and every computed number — nothing here counts, rates or
compares; it lists what the league has scheduled.
