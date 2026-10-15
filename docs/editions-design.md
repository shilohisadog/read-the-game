# Editions — technical design, 2026-10-15

**Status: DESIGN FOR REVIEW. Nothing is built.** Follows `docs/editions-audit.md`;
its §8 holds Kevin's rulings and the trade-offs taken. In one line: **one edition
a night, holding that night's data and that night's code; a dated link shows
exactly what that edition showed — figures, players, wording and look.**

## 1. What an edition is

```
editions/2026-10-14/                       ← the date is `dataThrough`: games it covers
  manifest.json                            ← what this edition is (below)
  data/measures.json  teams.json  players.json  schedule.json  recent.json
  pages/preview.html  game.html  how-we-measure.html
editions/index.json                        ← every sealed date, newest last
```

- **Data**: the five documents the dated pages read (167 KB). Not the catalog,
  index or lessons — no dated page reads them. Not the game files: a shared
  replay reads the newest one (ruling 2).
- **Pages**: the three dated pages exactly as deployed that night (422 KB). The
  code is inline in each, so **storing the page stores the code**; this is ruling
  3 ("keep the code that was live that night") without depending on Cloudflare
  keeping old deploys — its retention of them is unverified.
- **manifest.json**: `{date, dataThrough, sealedAt, commit, run, files: {path:
  sha256}}`. The hashes make an edition checkable, the commit makes the code
  findable in git.
- **Size**: ~590 KB a night, ~215 MB a year before compression (pages gzip to
  125 KB).

## 2. Sealing: written once, never changed

The seal is the last step of `deploy.yml`, **only when the nightly ingest started
the deploy**, after the live site has been verified:

1. Read `dataThrough` from the published `measures.json`. If
   `editions/<dataThrough>/manifest.json` exists, stop: **first seal wins**.
2. Copy the five data documents from the bucket and the three pages from the
   checkout. The deploy step already proves the checkout byte-identical to what is
   live, so the pages are what readers were served.
3. Upload the data and pages first, then the manifest, then `index.json` — the
   same order the raw feeds use (blobs first, pointer last), so an edition with a
   manifest is always complete.
4. Upload with `cache-control: public, max-age=31536000, immutable`.

Changes needed elsewhere: the ingest must dispatch the deploy **every night**,
not only when the learn pages changed (`ingest.yml:1164`). `deploy.yml` already
skips the upload when nothing changed, and the seal runs either way.

⚠️ A code push that deploys during the day does not seal; it never changes
`dataThrough`. Something shared between that deploy and the next night is shown
as the night's edition (§8, ruling 4).

## 3. Serving a dated link

`readthegame.co/preview?game=X&asof=2026-10-14` → the middleware
(`functions/_middleware.js`, already the site's only server code) sees `asof` on
one of the three dated paths and answers with `editions/2026-10-14/pages/
preview.html` from the bucket. The address stays `readthegame.co`, so the query
string reaches the stored page.

- The stored page reads its data from `editions/<asof>/data/…`: the page's data
  fetch (`grab`) takes the edition prefix when `asof` is present. **Only pages
  built after this change know to do that**, which is why editions start at the
  build date (ruling 5).
- Its links to the other dated pages (preview → methods page, preview → replay)
  carry `asof`, so a dated preview opens a methods page of the same night.
- The middleware's part must stay small and stable: it serves editions written
  by code years older than itself. Contract: `(path, asof)` → stored page, or
  pass through.
- **No edition for that date** (before the build, or a night that never sealed):
  serve the current page with a line saying no saved version exists for that
  date. Never a silent substitution.

## 4. Links without a date

- **The preview, before its game**: reads the newest sealed edition (from
  `index.json`), not the loose files, then **writes `asof` into its own address**
  (`history.replaceState`). Whatever a reader copies is the permanent link.
  Cost: between the nightly publish and the seal (minutes), the undated preview
  shows the previous night.
- **The preview, after its game**: opens the last edition dated **before** the
  game's date — what the preview said going in.
- **The replay's "Copy a link to this moment"**: adds the newest `asof`, so its
  summary scales stay those of that night.
- **The methods page and the replay without a date**: current, as today.

## 5. The link card

The middleware rewrites `og:url` to `https://readthegame.co/{page}?game=ID`
(`functions/_middleware.js:187`), dropping every other parameter. It must keep
`asof` (and should keep `at`, which it drops today).

## 6. Failure modes, and what happens

| Failure | Result |
|---|---|
| The seal step fails | No edition that night; links stamp the previous edition. The deploy is unaffected (the seal runs after verification). |
| The middleware cannot read the bucket | Pass through to the current page, saying no saved version could be loaded. |
| A stored page has a defect | It keeps it — accepted in ruling 3. |
| Two nightly runs share a `dataThrough` | The first seals; the second stops at step 1. |
| The league amends a game in an edition | The replay shows the amendment; the edition's comparisons do not move (ruling 2). |

## 7. Tests (written after review)

1. Seal: a second seal of the same date changes nothing; a missing manifest means
   the edition is not listed.
2. A dated page fetches only from `editions/<asof>/`, and a fetch to the loose
   files from a dated page fails the test.
3. The middleware serves the stored page for each dated path, passes through
   otherwise, and never answers an error for a missing edition.
4. Links inside a dated page carry `asof`; `og:url` keeps it.
5. The preview's address gains `asof` after load; a played preview resolves to
   the last edition before its game.
6. A browser check after the first real seal: the dated preview's figures match
   the edition's `teams.json` by hand, not by the same code.

## 8. Not yet verified

- Pages Functions reading R2 directly (a binding) versus fetching
  `data.readthegame.co` — either works on paper; the binding avoids a public hop.
- Whether a stored page served at `readthegame.co` passes its own
  Content-Security-Policy when it fetches `editions/…` (same data origin, so it
  should).
- The 10:00 Eastern target is unaffected: the seal runs after readers already
  have the night's pages.
