---
name: asset-caching-open
description: "✅ (a) SHIPPED 2026-08-21 — and the premise was inverted: the data was ALREADY cached heuristically, in the form that can go stale. OPEN DECISION, measured not built (2026-08-20). What a game view costs, why nothing is cacheable today, and the finding that dissolves the doctrine problem: no-cache is not no-store. Artifact is docs/asset-caching.md."
metadata:
  node_type: memory
  type: project
  modified: 2026-08-21T00:00:00.000Z
---

**Nothing built. The artifact is `docs/asset-caching.md` §1–8, CHENG-reviewed.**
Raised while cleaning up `build_main.py`; parked behind C1.

## ⭐ THE FINDING: `no-cache` IS NOT `no-store`

Two measurements, and neither means anything alone:

- **The origin honours conditional requests** — `If-None-Match` and
  `If-Modified-Since` both return **304, body 0 bytes** (curl).
- **The browser never sends one** — three navigations in one context, including
  the *same* extract URL twice, every data request a **200 with a full body**.

The cause is the absence of `Cache-Control`: nothing is stored, and **a response
that was never stored has nothing to revalidate.** The 304 capability exists and
is unreachable.

> **`Cache-Control: no-cache` stores the response and revalidates before EVERY
> use.** Never stale, saves the whole body, costs one round trip — and needs **no
> TTL chosen by us.**

That dissolves CHENG's doctrinal objection (caching `index.json` would cache the
site's claim about its own currency) **and** the amendment problem (a re-derive
rewrites published extracts — it ran three times in one week) at once. No number
to bound, which is the chosen-constant defect avoided rather than managed.

## What a view actually costs (measured against production)

| surface | wire bytes |
|---|---|
| game view (`?game=…`) | doc 106,161 + extract 13,843 + measures 1,138 ≈ **121,100** |
| front door | index + catalog **65,640** + measures + index.json 11,788 + hero iframe (game.html 106,161 + extract) ≈ **198,600** |

⚠️ **A game view does NOT fetch the catalog** — `build_main.py` only grabs it when
no `?game=` is named. An earlier draft pooled the two paths and inflated the
game-view figure by a third.

Throttled real browser, stopwatch to a drawn rink: **1.2s fast 4G · 1.8s slow 4G
· 4.4s slow 3G.**

## The ranking

1. **(a) `no-cache` on the data files + an ETag on the HTML.** Header work,
   minutes, no code, no doctrine question. `/` and `/game` have **no ETag** and
   `max-age=0`, so every repeat view is a full 106 KB.
2. **C1 first** (CHENG): discovery is what makes (b) worth doing.
3. **(b) externalise the renderer, WITH content-hashing as a precondition.**
   ⭐ Cloudflare Pages already gives non-HTML `max-age=14400` + ETag + edge
   caching (`/lib/rink.js` proves it) — so (b) gets caching free **and inherits a
   four-hour window in which a visitor's HTML and JS can disagree while both stay
   individually valid.** `app.<sha>.js` makes the pairing atomic.

`read-the-game.html` keeps inlining either way — and note **"works with the
network unplugged" is NOT doctrine**: it is absent from DOCTRINE.md's nine rules,
reachable from one Workshop card, and its real job is keeping the deploy's
browser probe simple. See [[hockey-legibility-build]].


# ✅ BUILT 2026-08-21 — and §8.1's diagnosis was backwards

**The data was never uncacheable.** Every object carried `Last-Modified` and none
carried `Cache-Control` — the precondition for **heuristic freshness** (RFC 9111
§4.2.2), where the browser invents a lifetime because we declined to state one.
Chrome's is **10% of the object's age**.

Measured in a real Chromium against production, **5 of 5 data files answered with
the origin NEVER ASKED** — 1 ms against a 59–68 ms forced-network control on the
same URL in the same session. `derive.py` rewrote the whole archive three times
in one week, so a returning visitor could hold a number we had corrected, for up
to **9 days** on a file untouched for three months. And `index.json` drives the
freshness line, so **the site could state a stale claim about its own currency**
— CHENG's own hypothetical objection, describing the state we were already in.

**So `no-cache` does not add caching. It BOUNDS caching that was already
happening**, and it costs a round trip (~55 ms; 400 ms on slow 3G) on repeat
views. Measured after: every file revalidates and returns **243–321 bytes**
instead of a full body. Shipped on four upload sites plus `r2-cache.yml` to
backfill the 4,553 objects already in the bucket — `--cache-control` only stamps
new writes and `s3 sync` compares size and mtime, not metadata.

**Cross-browser, measured with a server that counts its own hits:** Chromium and
Firefox agree on every row, heuristic included. So *"browsers differ"* is NOT the
argument — the real one is that **the heuristic window is proportional to file
age**, unbounded and growing, in every browser.

⭐ **`max-age=3600` is a defensible alternative and Kevin's instinct for it was
reasonable**: it saves ~400 ms of a 3,335 ms slow-3G repeat load. The remaining
~2.9 s is the **106 KB HTML, which carries no validator at all** — Cloudflare
Pages sends HTML with no ETag and no Last-Modified, so **the ETag-on-HTML idea is
not achievable** and that line item is dead. **Content-hashed URLs are the only
option that is both free and never stale**, which this finding promotes from
optimisation to the actual goal.

**Two instrument failures worth keeping:** Resource Timing blanks every *size*
field cross-origin without `Timing-Allow-Origin`, so `transferSize` read 0 for a
fetch that provably hit the network — **duration is not blanked**. And §8.1 read
a `200` as proof of a download when a cache hit is reported as 200 too: the
instrument could not separate *"fetched again"* from *"never asked for"*, and the
write-up picked one. See [[mechanize-the-review]].
