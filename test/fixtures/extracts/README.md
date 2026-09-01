# Eight real games, each committed for a stated reason

These are **published extracts**, copied byte-for-byte from
`https://data.readthegame.co/extract/<id>.json`. They exist because the only
real game the test suite could otherwise read is `data/rich.json` — one game,
320 events, three clock collisions — and calibrating a resolver on one game and
validating it on the same game is the failure this project has hit most often.

**What these prove and what they do not.** They are chosen to be
*adversarial*, not representative: four of the five are among the worst cases in
the archive on some axis. A rate measured here would be meaningless. The
archive-wide claim belongs to `builders/measure.mjs`, which walks all 4,553
extracts on every pipeline run. **A test in this directory may assert a property
holds; it may never assert how often something happens.**

| game | why it is here |
|---|---|
| `2024030413` EDM@FLA 2025-06-09 | **15 events in one second, 13 of them penalties** — the worst clock collision in the sampled archive. A resolver that assumes a clock names one event fails here first. |
| `2023020207` CGY@TOR 2023-11-10 | 14 events in one second, **and period 5 is a `SO`** (shootout). ⚠️ It also holds a **genuine short-handed goal** (P2 18:54, 4-on-5 with a Toronto player in the box) — which is not why it is here, and which for a long time it appeared not to hold at all; see *Keeping them honest*. |
| `2025030214` | **A double minor killed by a goal 176 seconds before it was due to expire.** At playable frame 125 the referee's clock reads `4:00` and the player actually leaves in `1:04`. The penalty display counts the ASSESSED time, because counting the served time would announce a goal that has not happened yet — this is the game where the two numbers are furthest apart. |
| `2025030223` | **A short-handed goal, and a bench minor.** The only fixture where a team scores while one of its own players is in the box — the goal the SHORT-HANDED tag exists for — and it also carries an `unsportsmanlike-conduct-bench` penalty, which the feed records with no committing player. Pairs with `2024020543`, which holds the trap. |
| `2023030222` CAR@NYR 2024-05-07 | Playoff double overtime — **period 5 is an `OT`**. Pairs with the row above: *same period number, opposite meaning.* A resolver reading the period number rather than `pt` passes one of these two and fails the other, which is the only way that bug shows itself. |
| `2023020105` COL@PIT 2023-10-26 | **Zero clock collisions** — every event uniquely addressed by `(period, clock, type)`. The case where a bare clock is exact everywhere, so a test that only ever runs on messy games cannot claim it. |
| `2025020501` CAR@PHI 2025-12-13 | An ordinary recent game that still reaches a shootout; keeps the 2025 season represented. |
| `2024020543` 2025-01-25 | **The pulled-goalie trap, twice.** Two goals at `sit=0651` — the away goaltender pulled for a sixth skater while the home side scores with five, so the scoring team has FEWER skaters and nobody in its box. A short-handed badge driven by `sit` alone reads backwards here. Over 46 published games this is the commoner case: 17 fewer-skaters goals, 7 short-handed, **10 this**. |

`data/rich.json` (BUF@MIN 2023-11-10) serves as the sixth, ordinary case and is
already committed for other reasons.

## Keeping them honest

A committed fixture is a **frozen sample**, and the extract's shape has changed
in three of `extract.py`'s commits. If the published extract gains or loses a
field, these files do not — and the tests keep passing against a world that no
longer exists. That is worse than going red, because it still looks like
coverage.

So: **when `extract.py` changes the per-event shape, re-copy them.** They are
copies, not derivations; there is nothing to migrate.

## ⚠️⚠️ AND ON 2026-09-01 THAT IS EXACTLY WHAT HAPPENED

The paragraph above was written, and then broken. **Five of the seven were copies
of an older extractor's output** — same games, same raw feeds (`game.src` hashes
identical), missing the top-level `sides` key and missing `pen`, `min`, `sev`,
`zone`, `drew` on every penalty and `miss` on every missed shot.

**It had already produced a false test.** `render-penalties.test.js` asserted that
`2023020207`'s fewer-skaters goal was NOT short-handed. It is: with the correct
extract there is a Toronto player in the box. The stale file had no penalty
durations, so `stints()` computed an empty box, so a genuinely short-handed goal
looked like the pulled-goalie trap it was being used as. The test demanded the
wrong answer and stayed green for as long as the data was wrong.

⭐ **A RULE WRITTEN DOWN AND THEN BROKEN IS UN-INSTRUMENTED, NOT UNDER-STATED.**
This section named the failure mode, predicted the symptom — *"it still looks like
coverage"* — and prescribed the fix, and none of that made anything fire.
`test/fixtures.test.js` is the instrument: fixtures are compared **against each
other**, and a field that every event of a type carries in one file and no event
carries in another is two vintages of extractor in one directory. It needs no
network and no version stamp, and it was proven to go red on the five stale files
and green on the refreshed ones.

⛔ **Its blind spot, stated:** if every fixture were stale at the same vintage it
says nothing. Mixing is what it catches, and mixing is how the drift arrives.
The stronger check — byte-comparing each fixture against the published archive —
belongs where the archive is walked (`.github/workflows/derive.yml`), not in a
unit test that must not fetch.
