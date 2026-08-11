# The catalog

*Reviewed by CHENG and BUILT. Live at `https://data.readthegame.co/catalog.json`.*
*Sections 1–7 describe what shipped; §6 records the four points he argued and how
they were resolved.*

The archive holds 1,534 games and publishes 1,463 of them as extracts. The catalog is the document that makes the archive navigable —
the spine that search, team filtering and the season calendar all hang off.

Written against the live archive, not against intentions:
`https://data.readthegame.co/index.json`.

---

## 1. What it is for

Three features, and the sizing is what makes the design possible:

- **search** — a game, by team or date
- **a season calendar**
- **filter by team**

There is no server. Pages serves static files, R2 serves objects, and there is
no database. So every query must be answerable from data the browser already
holds — which sounds like a constraint until you size a row:

```
{"id":2025030416,"d":"2026-06-14","a":"CAR","h":"VGK","as":3,"hs":0,"t":3,"v":1}
```

~70 bytes. A season is ~1,400 games, so ~100 KB, maybe 20 KB gzipped. **The
whole feature list is one fetch and an array in memory.** Filter-by-team is a
`.filter()`, the calendar is a `groupBy(date)`, search is a string match. No
index, no search service, no D1, and the holds-nothing property survives intact.

## 2. Where it lives

**A single `catalog.json`.** 1,534 rows, 149 KB raw and 18 KB gzipped — one
fetch. No sharding and no manifest: CHENG's point is that a second document is
one that can disagree with the first, and it would buy nothing at 100 KB that it
does not also cost at 1 MB.

**Not in `index.json`.** That document is the *pipeline's* health record — it has
a contract, a test, and a live consumer on the front page. The catalog is
*content*. Folding one into the other is precisely the conflation
`docs/ingest-state.md` was written about, and this project has now paid for that
mistake three times in a week.

The season comes from the game id — `2025030416` is season 2025, type 03 — so it
needs no separate lookup and cannot disagree with the id.

## 3. The row, and the one decision I most want attacked

```json
{"id":2025030416,"d":"2026-06-14","a":"CAR","h":"VGK",
 "as":3,"hs":0,"ash":23,"hsh":22,"t":3,"v":1}
{"id":2025090001,"d":"2026-02-11","a":"SVK","h":"FIN",
 "as":4,"hs":1,"ash":25,"hsh":40,"t":9,"v":0,"r":"validation"}
```

`as/hs` score and `ash/hsh` shots on goal, both quoted from the boxscore;
`v` viewable; `r` which gate refused it.

**Where does the score come from?**

It is *not* in the extract. `rich.json` carries events; the score is derived from
them — and correctly deriving it now means *goals scored in play, plus one to
whoever converted more shootout attempts*, a rule that lives in `layer.js` and
was verified against six games this afternoon.

So a catalog built in Python from extracts would need a **second implementation
of the score rule**, in a second language, and the two would drift. That is the
same defect as a second renderer, one level down, and this project shipped a
wrong Corsi number exactly that way.

**Proposal: the catalog quotes the boxscore.** The league's own statement of the
score, copied, not recomputed. `derive` already holds all three feeds when it
runs, so this costs nothing — and `validate()` already asserts that our derived
score agrees with that boxscore, so the two remain tied together by a check that
can fail rather than by a rule written twice.

The catalog therefore says what the league says. The extract says what we can
show you. A disagreement between them is a refusal, not a silent choice.

## 4. Refused games are IN the catalog

A game appears with `v: 0` and which gate stopped it when we hold it but cannot
show it — 71 games today: 39 truncated feeds (30 of them the 2026 Winter
Olympics) and 32 that fail one boxscore check for reasons recorded in the
memory note on the refusal gap.

The tempting design is to list only what is viewable, so every row is a working
link. That would make the calendar a **map of our successes**, and September
would show empty where 56 preseason games were played.

Doctrine §9 — selective honesty is worse than none, because it looks rigorous.
The calendar is the one place a visitor is already looking, which makes it the
right place to admit what we cannot show. **Nobody else's schedule page does
that, because nobody else has anything to admit.**

## 5. Who builds it

`derive`, in the same pass, because it is the only stage that has already read
every feed. A separate builder would re-read 633 MB to learn what derive knew
and threw away.

This makes the catalog a **cache of the extracts**, which are a cache of the raw.
Neither is authoritative and both are rebuildable — so a field we want in three
months is a reprocessing pass, not a re-fetch. That property is the whole reason
the backfill was worth doing early.

## 6. The four points argued, and how they resolved

1. **Quoting the boxscore** — ACCEPTED, and CHENG sharpened it: quoting the
   authority is not a compromise against one source of truth, it *is* the source
   of truth and the correct direction of dependency. It also converts a silent
   disagreement into a loud one. His requirement was taken too: the quote is
   stored IN the extract as a `quoted` block tagged with its source, so the
   catalog builder and the validator cannot reach for the boxscore independently
   and drift over which field.

2. **Refused rows** — KEPT, with his correction: `v: 0` alone would re-merge
   refused with absent at the surface after they were split upstream. The row
   carries which gate stopped it. The confusion risk lives entirely in the copy,
   not in the decision.

3. **Sharding** — DROPPED. Premature, and a manifest is a second document that
   can disagree with the first. One file until it hurts.

4. **Shots on goal** — ADDED. Doctrine §8 governs *rates*, not counts, and
   23–22 is a count. It is also the count the site exists to explain: "MIN
   outshot BUF 35–25 and lost" is the thesis, so withholding it from the browse
   surface would hide the number the game view answers. My instinct here was
   precious rather than principled.

---

## 7. What counts, once anything is computed

**Settled (Kevin, 2026-08-11): base rates — and any other calculation — cover NHL
regular season and playoffs only.** `gameType` 2 and 3. Preseason, the Olympics,
the 4 Nations Face-Off and any other offshoot are archived, listed and viewable,
and never enter a computed number.

The archive holds them because the ingest deliberately does not filter — a
decision made at fetch time costs a request to the league to undo, one made at
the point of use costs a line. This is that line, and it is the second time
carrying `gameType` has paid: we would otherwise have silently dropped the
Olympics without knowing, and will meet the 4 Nations Face-Off in 2024-25.

A base rate is also **scoped to the season the game was played in**, not pooled
across the archive. Precision is not the reason — one season is 71,266 shots and
gives a save-percentage base rate to ±0.0011, against an effect size of .038, so
it is already 35 standard errors and three seasons would only take it to
±0.0006. Pooling seasons instead introduces a bias more data cannot fix: hockey
is not stationary, and a normal averaged across eras describes no season in
particular.

Where more seasons genuinely help is CONDITIONAL base rates, which slice thin —
a high-danger 5-on-3 normal is ±0.017 on a single season, an order of magnitude
worse and unstable year to year.

---

## Appendix: decisions taken today that have not been reviewed

Flagged because they were unilateral and several rewrote things CHENG designed.

- **The halt rule was rewritten.** It fired when the same unknown `gameState`
  appeared in more than one game. `FINAL` sits on all 56 preseason games in a
  sampled season, so a backfill halted before fetching a byte. It now fires only
  on *total* incomprehension — the window holds games and not one is in a state
  we know. Narrower on purpose, and only safe because of the next item.

- **The coverage ledger gained a second law.** Games in an unrecognised state
  were excluded from `finalInWindow`, so they sat outside the only equation that
  could fail — 90 refusals in 100 left the ledger closing perfectly and the front
  page reporting health. Now `gamesInWindow = finalInWindow + unknownStateInWindow`.

- **The front page was saying something false.** With every game unreadable,
  `finalInWindow` is 0 and it announced "No games in the last 14 days" over a
  full slate.

- **Situation codes became a rule instead of a list**, then the rule was itself
  too narrow — it tied one-shooter-against-one-goalie to shootouts, and 44 games
  carry it in regulation because that is also a **penalty shot**. A rule derived
  from a sample is still a sample.

- **The shootout is excluded from all three layers**, and the scoreboard adds one
  goal for the shootout rather than one per successful attempt.

- **Refusal is split three ways** — published, refused, absent — because the
  nightly holds pointers for the whole archive and raw for one night of it.

Two things are known-unfinished and stated rather than hidden: the situation-code
decode is **verified by rule but not against an independent witness** (a first
attempt at cross-checking against shifts agreed 82% of the time, spread evenly
across games, which points at the comparison), and **40 games fail one boxscore
check** for a reason I cannot yet explain and have not widened the gate to
accommodate.
