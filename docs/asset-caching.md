# Caching — what a game view actually costs

**Status: measured, nothing built, nothing decided.** This is the artifact for
CHENG's review. Written 2026-08-20, after `914e638` made `src/app.js` a real
file — which is what put the question on the table, and is itself unrelated to
anything here (that change was byte-identical).

## 1. How this was measured

A real Chromium at 390×844, CDP network throttling, against **production** —
not the local build. Three profiles, and the stopwatch runs until the rink
actually has hockey on it (`#rink` non-empty), not merely until `load`.

| profile | down / RTT | DOMContentLoaded | **rink drawn** |
|---|---|---|---|
| fast 4G | 4 Mbps / 100 ms | 574 ms | **1,222 ms** |
| slow 4G | 1.5 Mbps / 150 ms | 1,042 ms | **1,760 ms** |
| slow 3G | 400 kbps / 400 ms | 3,377 ms | **4,402 ms** |

## 2. What a single game view transfers

| asset | wire bytes | cache headers today |
|---|---|---|
| the `game.html` document | **106,161** | `public, max-age=0, must-revalidate` · **no ETag** · `cf-cache-status: DYNAMIC` |
| …of which `<script>` | ~89,000 | inlined, so it rides the document |
| …of which `<style>` | ~14,900 | inlined |
| `catalog.json` | **65,640** | **no `Cache-Control` at all** · ETag + Last-Modified · DYNAMIC |
| | | ⚠️ **and §8.2 corrects this: a game view does NOT fetch the catalog** |
| `extract/<id>.json` | 13,843 | **no `Cache-Control`** · ETag · DYNAMIC |
| `measures.json` | 1,138 | **no `Cache-Control`** · ETag · DYNAMIC |
| **total** | **≈ 186,800** | **none of it is cacheable** |

**Confirmed by navigation, not inferred:** loading a second game in the same
browser context transferred the identical 106,161 bytes again. `?game=A` and
`?game=B` are separate cache entries, the document forbids caching, and the
89 KB of JavaScript inside it is byte-identical between them.

`cf-cache-status: DYNAMIC` on every data file also means **Cloudflare is not
edge-caching them either** — every catalog request reaches R2.

## 3. ⭐ CC's own framing was wrong, and the correction matters

CC raised this as *"externalise the script so it can be cached"* and was about to
propose that first. **The data files are the cheaper and larger win**, and they
need no code, no CSP work, and no doctrinal argument:

- `catalog.json` is **65,640 bytes on every page view** — the second-largest
  thing a visitor downloads — and carries **no `Cache-Control` header at all**.
- So does `measures.json`, and so does every extract.

Leading with the harder change would have bought less for more.

## 4. Three candidates, ranked by what they cost us

**(a) `Cache-Control` on the data files.** A header configuration on R2 /
Cloudflare. No code, no CSP, no build change, no doctrine question. Removes
65 KB + 1 KB from every repeat view and lets the edge serve them.

**(b) Externalise the renderer from `game.html`, content-hashed.** Removes
~89 KB gz from every game-to-game navigation. `read-the-game.html` keeps
inlining, so the Workshop's offline page and the deploy's browser probe are
untouched. One source, two packagings — "one renderer, no second place for a
wrong number to hide" survives, because that property comes from a single source
template and not from how each page is packaged. **Costs:** the CSP is
hash-pinned over the exact script bytes and needs rework; the deploy's
stylesheet gate uses the inlined page and wants a look.

**(c) Nothing for the HTML itself.** It must stay fresh — `max-age=0` is
correct for a document whose content changes with the archive.

## 5. ⭐ The tension CC wants ruled, and it is a doctrine question

**A published extract is not immutable in practice.** `derive.yml` re-derives the
whole archive whenever extraction changes, and it ran **three times this week**
— `sides`, the penalty detail, and `miss`. Each rewrite changes the bytes of
games already published.

So `Cache-Control: immutable` on extracts would serve a **corrected number as
stale**, on a site whose entire claim is that the numbers are right. A rate that
is wrong for a day because we cached it is a worse failure here than on almost
any other site.

Three ways out, unranked:

1. **Short TTL + revalidation** — cheap, keeps a round trip, mostly-correct.
2. **Content-hashed data URLs** (`extract/<id>.<hash>.json`), with the hash
   carried in the catalog. Immutable and always correct, at the cost of the
   catalog growing a field and the ingest growing a step.
3. **Cache the catalog aggressively and the extracts barely**, on the grounds
   that the catalog changes once a night and an extract is the thing we correct.

## 6. The case for doing NOTHING, which CC thinks is genuinely arguable

**On a decent connection the page is already fast.** 1.2 seconds to a drawn rink
on 4G is fine, and every number in §2 is invisible at that speed. Caching adds
moving parts — a hash in the catalog, a CSP rework, a second request — to a
build whose largest current defect is that **4,417 games cannot be searched for**
(C1). Discovery is worth more to a novice than 89 KB.

The counter is one measurement: **4.4 seconds on slow 3G**, and the reader this
site is built for is on a phone. Whether that reader is on slow 3G is not
something we know.

## 7. What CC would like ruled

1. **Is (a) simply obviously right?** It looks free. CC can see no argument
   against putting `Cache-Control` on `measures.json` and the catalog, and wants
   the argument if there is one.
2. **§5** — what is the honest caching policy for a file we sometimes correct?
   Is option 2 worth its complexity, or is a short TTL the honest answer?
3. **§6** — is any of this worth doing before C1?

---

# 8. CHENG's review, and what checking it found — 2026-08-20

He named a verification gap: §2 said *"none of it is cacheable"* and sized the
catalog's saving, but only the **document** had been measured by navigation. He
was right, and closing it changed the recommendation more than his review did.

## 8.1 ⭐ `no-cache` dissolves Q1 entirely — it is not `no-store`

Two measurements, and they only mean something together.

**The origin honours conditional requests.** Hand it the ETag and it answers:

```
If-None-Match: "f14b69…"      -> HTTP 304, body 0 bytes
If-Modified-Since: <lastmod>  -> HTTP 304, body 0 bytes
```

**The browser never sends one.** Three navigations in one context — including
the *same* extract URL twice — and every data request was a **200 with a full
body**. Nothing 304s in practice.

The cause is the absence of `Cache-Control`: with no freshness directive the
response is not stored, and a response that was never stored has nothing to
revalidate. **The 304 capability exists and is unreachable.**

Which means the header we need is not a TTL at all:

> **`Cache-Control: no-cache` stores the response and revalidates it before
> EVERY use.** It never serves a stale byte. It costs one round trip and saves
> the whole body.

That answers CHENG's doctrinal objection without needing his bound. There is no
TTL to keep shorter than the freshness claim, because **nothing is ever served
without asking the origin first**. `index.json` cannot report a stale
`lastRun`; a corrected extract is picked up on the next request. The amendment
problem and the freshness problem both disappear, and neither needs a number
chosen by us — the thing this project distrusts most.

Content-hashed URLs remain the way to remove the *round trip* as well. That is
now an optimisation, not a correctness requirement.

## 8.2 ⚠️ CC's own §2 table was wrong: a game view does not fetch the catalog

`build_main.py:162` reads `want ? Promise.resolve(want) : grab(catalog)` — the
catalog is fetched **only when no `?game=` is given**. Measured, a deep-linked
game view requests exactly the extract and `measures.json`.

| surface | wire bytes |
|---|---|
| **game view** (`?game=…`) | doc 106,161 + extract 13,843 + measures 1,138 = **≈ 121,100** |
| **front door** | index + catalog 65,640 + measures + index.json 11,788 + the hero iframe (game.html 106,161 + its extract) = **≈ 198,600** |

So the catalog's 65 KB is a **front-door** cost, not a per-game one. §2 pooled
two different paths and inflated the game-view figure by a third.

## 8.3 The freshness sentence is date-granular TODAY, and that is not the bound

Live, right now: *"Data through 14 June 2026. No games in the last 14 days."*
Date-granular, so CHENG's rule would permit hours of TTL.

**But `describe()` has branches that are hour-granular** — `Checked daily. Last
checked N hours ago` — reached when the pipeline is **stale or halted**, which is
exactly when a cached claim does the most damage. A TTL chosen from what shipped
today would be wrong on the day it mattered. 8.1's `no-cache` is immune to this
by construction.

## 8.4 ⚠️ "Already ratified" is not what the document says

CHENG: content-hashed extract URLs *"were already ratified in the multi-game
design,"* like A6 — decided and never built.

`docs/nightly-ingest.md` §Q4 ratifies content-addressing for the **raw store**,
and leaves the extract at a fixed path **in the same code block**:

```
raw/{gameId}/{sha256}/play-by-play.json     every version, immutable
raw/{gameId}/latest.json                    pointer to the current hashes
extract/{gameId}.json                        <-- fixed path, mutable
index.json
```

The reasoning he quotes is real, and it was about preserving **history** against
overwrite, not about caching. So content-hashing the extract is a **new
proposal**, not an owed one — which matters, because "we already agreed this"
carries weight that "this is a good idea" has to earn. His second claim checks
out: the pipeline already hashes, at `game.src.{boxscore,play-by-play,shifts}`.

## 8.5 His ETag finding is real, and Pages already does better for non-HTML

| | `Cache-Control` | ETag | edge |
|---|---|---|---|
| `/` and `/game` (HTML) | `public, max-age=0, must-revalidate` | **none** | DYNAMIC |
| `/lib/rink.js` (from the same `src/` publish) | `public, max-age=14400, must-revalidate` | **yes** | **REVALIDATED** |

Cloudflare Pages already applies a four-hour TTL, an ETag and edge caching to
non-HTML assets. Only the HTML gets `max-age=0` with no validator.

## 8.6 ⭐ Which makes (b) cheaper AND more dangerous than §4 said

**Cheaper:** externalise the renderer and it inherits `max-age=14400` + ETag +
edge caching automatically. No header configuration at all.

**More dangerous:** that is a **four-hour window in which a visitor's HTML and
JavaScript can disagree.** A deploy ships new markup while the browser and the
edge still hold the previous `app.js` — and the failure is silent, because both
files are individually valid. On this site that is the worst class of defect
there is.

So **content-hashing is not an optimisation for (b), it is a precondition.**
`app.<sha>.js` with `immutable` makes the pairing atomic: new markup can only
ever reference the bytes it was built against. §4 ranked (b) as "medium cost,
89 KB benefit"; it is really "medium cost, and it must not ship without the
hash."

## 8.7 Where that leaves the three questions

**Q1 — (a) now, as `no-cache`, not as a TTL.** No number to choose, no stale
claim possible, no doctrine question. It converts every repeat data fetch into an
empty-bodied 304.

**Q2 — the honest answer is 8.1 plus content-hashing later.** `no-cache` is
correct today and forever; hashed URLs later remove the round trip. Short TTL is
not needed and should not be reached for.

**Q3 — agreed, C1 first, and CHENG's reason is better than the doc's.**
Discovery makes (b) worth more: almost nobody navigates game-to-game today
because there is no way to find a second game. C1 makes (b) matter; (b) does
nothing for C1. Add the ETag on HTML alongside (a) — it is nearly free and it
helps the one URL everybody hits.
