---
name: measures-list
description: "The LIST OF MEASURES (src/lib/registry.js) and the measures audit (docs/measures-audit.md, 2026-10-15/17) — the MEANING half of the data-model review. Rulings 1–6 built and live; 7 (per-player face-off %) open. Open this before touching any measure, label, published field or layer — it holds the publish ORDER that keeps a field change from breaking the pipeline, and four traps that each cost a failed run."
metadata:
  node_type: memory
  type: project
  originSessionId: f6288f73-1704-47fe-babc-ce2b52e78aa5
  modified: 2026-10-17T15:49:57.351Z
---

**What it is.** Kevin (2026-10-15): the layers, preview and summary picked measures at
different times by different rules — "another aspect of our data model review… a
consistent data model across the system". Audit: `docs/measures-audit.md` (§2 the
same label meaning different things, §4 are the August layers still best, §6 rulings,
§7 the list). Built: `src/lib/registry.js` — one entry per measure (name, says,
heading/layer/chip/tile wordings, counts, of, credit, unit, strength, score, scopes,
typical, witness, policy, family, `keys` per naming system, `pending`).
`test/registry.test.js` reads keys/labels from the SURFACES and the built page and
requires each to resolve to exactly one entry, and fails if a surface types a wording
the list owns. Every surface reads its wording from the list (`8b97ca2`).

**Rulings, all live and verified on readthegame.co (2026-10-15/17):**
1. The list exists (`acb7efa`, `8b97ca2`).
2. Level = strict 5-on-5 (`b3ae498`): built as a DELETION after measuring — 4-on-4 was
   1.1% of tied-score attempts, 17 verdicts in 4,310 flipped. Then "score TIED, not
   level" wording everywhere (`fc4cc3c`) — see [[feedback-hockey-lingo]].
3. Whole-game panel ranks save % (`savePct`) and offensive-zone face-offs (`ozStarts`);
   slot box divides by located attempts (`776185b`).
4. Typical shift = the MEAN, 47.8 s = 150,727,738 ÷ 3,154,714, shown as a division;
   median/band/under-a-minute DELETED — Kevin: one figure per lesson (`0463592`).
   Kevin kept "about 21 shifts a night" (a different fact, tells a story).
5. Should-it-exist pass over the six chips: all kept (Goaltending answers "how is the
   goalie doing tonight", with the boxscore witness). Attempts label is "Attempts", not
   "Control (Corsi)". WHO SHOOTS = 7th chip (`0787b58`, `layers/shooters.js`; panel row
   `perTeamGame.dmenShare`; Is-that-a-lot = printed `dmenAttempts` ← `census.shooter`).
6. Unread published keys deleted (`91ed1d0`, `17b441b`): measures.json 39.7 → 32.7 KB.
   `census.faceoffZone` and `census.state` stay TALLIED (internal witnesses tests
   cross-check endZone/pace/PP goals against), unpublished.
7. ⏳ FACE-OFFS (Kevin 2026-10-18): a SEPARATE 8th chip (Zone starts keeps its name — team/where
   vs player/who). LIVE: SCHEMA 7 keeps `lose` + `st` (100% of 264,681 face-offs name the loser;
   shotType on 100% of SOG/misses, 98.3% goals, 0% blocks — `tools/feed_fields.py` + feed-fields.yml);
   `layers/faceoffs.js`; perTeamGame.foShare; baseRates.moreFaceoffsLost (won 51.2% of 4,108);
   census.faceoffRun (1st shot 61.5% the winner → 54.4 → 52.7 → 51.8; RUN-bounded — census rule:
   no clock windows); summary row caveat in Kevin's words; door "Who takes the shots after a
   face-off"; commentary "#18 Zacha beat #61 Gauthier" (39-char line budget). Centre FO% SETTLES
   in 40 games (461 centre-seasons, r=0.684). ✅ players' season FO% LIVE 2026-10-18 (players.json `fo`,
   REGULAR_TAKER=5 a declared policy, need 29 alternate-games, boxscore 15/15); ⏭ shot type in the color line; distance on the 2D goal line. ⚠️ rail
   witness agrees 385/390 team-sides; 4 preseason ±1 and 2026020132 ±3 unexplained.

**⭐ THE PUBLISH ORDER for any change to a PUBLISHED field** (learned the hard way):
1. Make the code change.
2. Download the published extracts FRESH (a day-old copy differed in ~120 figures — the
   league amends games), run the real `node builders/measure.mjs --out <dir>`, and diff
   against the published measures.json: ONLY the intended fields may differ. Commit
   that as data/measures.json, plus `node tools/quoted-figures.mjs`, `tools/snapshots.mjs`.
3. Gate with `&&` (never `;`), push, `gh workflow run derive.yml`.
4. If the deploy ran before the derive published, its drift gate fails — then
   `gh run rerun --failed` the deploy (valid: the fix is external).

**⛔ Four traps, each cost a red run:**
- A test of a NEW published class passed against the STALE committed measures.json and
  broke the next nightly's measure job (`c5c465d` fixed). Test against the published shape.
- BEFORE DELETING A PUBLISHED KEY, grep the BARE KEY NAME in `.github/workflows` heredoc
  Python, `tools/*.py`, `builders/*.py` — a `measures.rule`-style search missed
  derive.yml's `m.get('rule')` and a derive failed pre-sync (nothing published).
- `gh run rerun` replays the ORIGINAL commit — it cannot confirm a fix pushed after.
- The nightly commits measures.json while you work: on a rebase conflict, REGENERATE
  (fresh measure) rather than pick a side.
- Also: a name inlined into a page can collide (`UNITS` did); typed lists of layers in
  test fakes blocked a 7th chip — fakes now read chips from the built page.

Related: [[data-model-review]], [[feedback-should-it-exist]], [[nhl-feed-inventory]].
