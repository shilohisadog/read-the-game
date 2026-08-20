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
