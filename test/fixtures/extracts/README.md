# Six real games, each committed for a stated reason

These are **published extracts**, copied byte-for-byte from
`https://data.readthegame.co/extract/<id>.json`. They exist because the only
real game the test suite could otherwise read is `data/rich.json` — one game,
320 events, three clock collisions — and calibrating a resolver on one game and
validating it on the same game is the failure this project has hit most often.

**What these five prove and what they do not.** They are chosen to be
*adversarial*, not representative: four of the five are among the worst cases in
the archive on some axis. A rate measured here would be meaningless. The
archive-wide claim belongs to `builders/measure.mjs`, which walks all 4,553
extracts on every pipeline run. **A test in this directory may assert a property
holds; it may never assert how often something happens.**

| game | why it is here |
|---|---|
| `2024030413` EDM@FLA 2025-06-09 | **15 events in one second, 13 of them penalties** — the worst clock collision in the sampled archive. A resolver that assumes a clock names one event fails here first. |
| `2023020207` CGY@TOR 2023-11-10 | 14 events in one second, **and period 5 is a `SO`** (shootout). |
| `2025030214` | **A double minor killed by a goal 176 seconds before it was due to expire.** At playable frame 125 the referee's clock reads `4:00` and the player actually leaves in `1:04`. The penalty display counts the ASSESSED time, because counting the served time would announce a goal that has not happened yet — this is the game where the two numbers are furthest apart. |
| `2023030222` CAR@NYR 2024-05-07 | Playoff double overtime — **period 5 is an `OT`**. Pairs with the row above: *same period number, opposite meaning.* A resolver reading the period number rather than `pt` passes one of these two and fails the other, which is the only way that bug shows itself. |
| `2023020105` COL@PIT 2023-10-26 | **Zero clock collisions** — every event uniquely addressed by `(period, clock, type)`. The case where a bare clock is exact everywhere, so a test that only ever runs on messy games cannot claim it. |
| `2025020501` CAR@PHI 2025-12-13 | An ordinary recent game that still reaches a shootout; keeps the 2025 season represented. |

`data/rich.json` (BUF@MIN 2023-11-10) serves as the sixth, ordinary case and is
already committed for other reasons.

## Keeping them honest

A committed fixture is a **frozen sample**, and the extract's shape has changed
in three of `extract.py`'s commits. If the published extract gains or loses a
field, these files do not — and the tests keep passing against a world that no
longer exists. That is worse than going red, because it still looks like
coverage.

So: **when `extract.py` changes the per-event shape, re-copy these five.** They
are copies, not derivations; there is nothing to migrate.
