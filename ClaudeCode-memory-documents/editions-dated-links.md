---
name: editions-dated-links
description: "✅ LIVE 2026-10-15 — a shared preview/replay/methods link names a dated EDITION (`?asof=<league game date>`) and shows forever what it showed: that night's data AND that night's pages (Kevin: keep the code; old links keep their look, defects included). ⛔ Found because Kevin's X post named Suzuki/Jenner 58.2% and the same link next morning said Anderson/Tuch 59.2%. Open it before touching seal/middleware/asof, or before a post that uses a copied link."
metadata:
  type: project
---

# Editions — dated, permanent links (built and verified 2026-10-15)

**Docs in the repo:** `docs/editions-audit.md` (five ways a link drifts; §8 = Kevin's
rulings AND the trade-offs, which he asked to have written down "so our
future-selves know what we did and why") and `docs/editions-design.md` (design;
§9 = the season-over-time requirement).

**How it works**
- `editions/<date>/` in R2: `data/` {measures, teams, players, schedule, recent}.json
  + `pages/` {preview, game, how-we-measure}.html + `manifest.json` (sha per file,
  `sealedAt`, commit, run); `editions/index.json` lists dates. Date = `dataThrough`
  = the league's GAME date (the day a game STARTED — Kevin asked; `fetch_nhl.py:216`).
- Sealed by `tools/seal-edition.mjs` + the LAST step of `deploy.yml`, only on
  `workflow_dispatch` with `seal=true`; `ingest.yml` now dispatches deploy EVERY
  night with `-f seal=true`. First seal wins (manifest exists → skip). Refuses if
  measures/teams/players name different nights. Upload order: data, pages,
  manifest, index. Immutable cache headers.
- `functions/_middleware.js`: `editionPage` serves `?asof=` on the 3 dated paths
  from the bucket; undated `/preview?game=` 302s to `editionFor` (unplayed → newest;
  PLAYED → newest dated BEFORE the game date); `cardUrl` keeps `asof` and `at` in
  og:url. Pages read `editions/<asof>/data/…` (preview `ASOF`/`withAsof`, methods,
  replay shell `LINK0.asof`); links between dated pages keep the date.
- A dated preview takes played/unplayed from the EDITION's schedule and its clock
  from `manifest.sealedAt`, so it never shows a score it did not show.
- A preview with no saved version says so ("not saved before the game … include
  the game itself"), never a silent substitute.

**Rulings (2026-10-15):** previews, summaries, methods page dated; learn pages and
lesson doors NOT (they teach); league amendments not chased (replay reads the
newest game file, comparisons come from the edition); one edition a night; start
from the build date (no backfill yet); old links keep that night's LOOK.

**⚠️ Traps**
- The first seal (`2026-10-14`) was dispatched BY HAND at ~14:12Z on 10-15 to verify
  live. Deleting objects in the bucket is Kevin's call.
- **The replay's "Copy a link" stamps the NEWEST edition, whose pages can predate
  same-day deploys** — on 10-15 a copied link opened the replay WITHOUT the color
  line. For X posts give Kevin a plain `/game?game=ID` link (accepted trade-off 4).
- The deploy's unfurl check accepts `og:url` with `&asof=` (it redirects now).
- Analytics over the season ("who was player to watch most", possession over time)
  is a NEW REQUIREMENT: "what we showed" from editions, "what happened" from walking
  game files — not built; waits on the measures audit.
