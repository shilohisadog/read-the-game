# The nightly ingest — acquisition, convergence, and keeping the audit whole

**Status:** design, for CHENG's review. Nothing here is built.
**Date:** 2026-08-09
**Supersedes:** the "Ingest worker" language in `docs/platform-architecture.md` §The architecture and §Phase 4, which assumed a Cloudflare Worker and never confronted that the extractor is Python.

---

## What exists, and what does not

The audit that started this, stated plainly so the plan is not built on a guess:

- **`builders/extract.py` is 338 lines of Python** and is the most heavily gated
  artifact in the repo — byte-identical `--verify`, independent `--validate`
  against the raw feed, and `--vocab`, which refuses unknown feed values rather
  than guessing at them.
- **Nothing in the repo fetches anything.** Not one line, in `builders/` or
  `src/lib/`. The files in `data/` were obtained by hand. The acquisition half of
  this pipeline does not exist in any form.
- **`data/` holds exactly one game**, `2023020204`, in four raw files plus the
  extract.
- **The deploy gate forbids network calls in shipped pages**, which a multi-game
  browser must make. Details in §The CSP, below.

So this is not "extend the extractor." The extractor is the part that already
works.

---

## The decision: GitHub Actions, not a Cloudflare Worker

### 1. Doctrine decides it, before cost is considered

The extraction produces **every number on the site**. "Check our work" means a
stranger can read the code that produced them, and the reducers already ship to
their browser so they can re-run them.

**A Worker is code that is not in the thing being audited.** It would ask people
to trust a transformation they cannot see, on a project whose entire pitch is
that they never have to. That is Doctrine §2 and §3, and it settles the question
on its own. Everything below is confirmation, not argument.

*(This ordering is CHENG's correction. I led with drift, which is the weakest of
the three reasons.)*

### 2. A JS port would not be a second implementation — it would be a subordinate copy

The obvious objection to porting is "two implementations must agree." The sharper
problem is how they would be made to agree: **the port's gate would be
byte-identity against the Python output.** That makes Python the source of truth
by construction, so what you actually get is one implementation plus a copy that
*looks* authoritative and is not.

This repo has paid for that twice already. `builders/legacy/build_alive3.py` was
a second copy. The reducer inlined into the HTML was a second copy. **The wrong
number always lives in the copy nobody designated as subordinate but everyone
treats as equal.**

### 3. The scheduler comparison dissolves rather than being won

The case for Cloudflare Cron is that GitHub's scheduler is worse — scheduled
workflows get delayed under load, and GitHub disables them after 60 days of
repository inactivity.

That argument only bites if the job must *fire on time*. It does not, once the
job **converges instead of firing** (§The rolling window). A missed night is
self-healing, a delayed run is irrelevant, and Cloudflare's better cron buys
nothing while GitHub's worse cron costs nothing.

### 4. It uses credentials that already exist

`ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` and `S3_API_ENDPOINT` are already GitHub
repository secrets — R2's S3-compatible credentials, created before this
discussion started. A GitHub Actions job needs exactly those and nothing new.
A Worker would need R2 bindings and a different deployment path.

### The honest counter, recorded rather than buried

This puts the pipeline's schedule on a platform whose scheduling we do not
control, to serve data on a platform we do. And if the ingest ever needs to run
**on demand** — a user asks for a game we do not have — a Worker is the right
shape and we will have built the wrong thing.

The answer is that the scenario does not arise. On-demand fetching is against
Doctrine §1, and with a convergent window *"we do not have that game yet"* is a
temporary state that heals within a day. The honest response is to **say so on
screen**, which is §3 again, not a reason to reach for a Worker.

---

## The rolling window

**The job ingests a window, not a day.** Every run re-checks the last *N* days
and writes anything missing or changed.

This is not a workaround for GitHub's scheduler. It is the correct design
independent of where it runs, for a reason about the feed itself:

> **The NHL amends play-by-play after the fact.** Scorekeeper corrections to shot
> attribution and penalty times land days after a game. A job that only ever
> ingests yesterday permanently enshrines the first version of every game.

**This claim is CHENG's and I have not independently verified it** — doing so
needs the same game fetched days apart, which is a measurement this design should
make possible rather than assume. See §Open questions.

Properties that follow, and each is testable:

- **Idempotent.** Running twice changes nothing the second time.
- **Convergent.** Missing a night is recoverable by the next run, with no
  operator action and no backfill script.
- **Correcting.** A game amended by the league is re-extracted and republished.
- **Bounded.** The window is a constant, so cost does not grow with the season.

`N` is a parameter, not a constant to be argued about now. It should be long
enough to catch the league's correction latency, which we do not yet know.

---

## What the job does

```
for each date in the window:
    GET /v1/schedule/{date}          -> games, with gameState and gameType
    for each game whose state is FINAL:
        GET /v1/gamecenter/{id}/play-by-play
        GET /v1/gamecenter/{id}/boxscore
        GET /stats/rest/en/shiftcharts?cayenneExp=gameId={id}
        store raw bytes, unmodified, content-addressed by hash
        run extract.py
        run the validation gate against the raw feed
        run the vocabulary gate
        if clean: publish the extract and update the index
        if not:   publish nothing for this game, and say why
```

Note the schedule endpoint returns a **seven-day week**, not a single date
(verified, §What I verified). A window of ≤7 days is therefore *one* schedule
call, not seven.

### `gameState` is vocabulary, and must be gated like any other

Only games in a final state may be ingested — a game in progress has a truncated
play-by-play, and storing it as though complete is the exact class of error the
project exists to avoid.

**I have observed exactly one value: `OFF`, across 133 completed games sampled
from three separate weeks.** It is August; every game reachable from here is
finished, so the non-final states are unobserved from this machine. I will not
write down a set I have not seen.

So the gate is an **allowlist of states known to mean final**, and anything else
is refused loudly and reported — the same shape as `extract.py --vocab`, and for
the same reason. An unknown `gameState` is a fact about the feed we do not
understand yet, not a thing to be guessed at.

---

## Storage, and what is public

R2 bucket `readthegame`, already bound at `data.readthegame.co` (proxied).

```
raw/{gameId}/play-by-play.json      the league's bytes, unmodified
raw/{gameId}/boxscore.json
raw/{gameId}/shifts.json
extract/{gameId}.json               what our reducers consume
index.json                          the game list + lastIngest
```

**Raw feeds are served publicly.** This is the strongest available form of the
pitch: anyone can fetch `raw/{id}` and `extract/{id}`, diff them, and re-run the
same reducer modules their browser just ran. *Check our work* stops being a
slogan and becomes an HTTP request.

It is also the mitigation for the largest risk in the platform doc: **if
`api-web.nhle.com` changes shape again, the archive is why the site still
works.**

**`noindex` on the `raw/` prefix** (CHENG). That keeps us a verification aid
rather than a competing data source in search results, which matches the
non-commercial posture.

### Pages serves code; R2 serves data

A consequence worth stating because it is easy to get wrong later: **the nightly
job must never trigger a deploy.** New data appears because R2 has new objects,
not because the site was rebuilt. The Pages deployment changes only when code
changes. This keeps the byte-identical deploy gate meaningful — it compares
published pages against the checkout, which stops being possible if data is baked
into pages that change nightly.

---

## Staleness on screen, instead of monitoring

Neither platform's scheduler should be trusted. The answer is not to pick the
better one; it is to **make failure visible rather than silent** (CHENG).

`index.json` carries `lastIngest`, and the site renders it:

> **Data through 8 August 2026.**

A stalled pipeline is then something users see and we see, on a page we already
control, with no monitoring service, no alerting integration, and no platform
dependency. It is Doctrine §3 — honest limits stated on screen — rather than a
health check bolted on the side.

It also handles the 60-day-inactivity trap. Whatever one-line keepalive goes in
the workflow, **the thing that actually saves us is noticing**, and a stale date
on the front page is noticing.

---

## The CSP, replacing the grep

`deploy.yml` currently asserts no page calls out, like this:

```
grep -rniE 'fetch\(|XMLHttpRequest|new WebSocket|src="https?:|<link[^>]+https?:'
```

Two things are wrong with it.

**It fuses two different claims** — *never call a third party* (real doctrine)
and *never make a network request* (an artifact of one game being inlined). The
multi-game browser must do the second while still honouring the first.

**And it is a blacklist over an open vocabulary, which cannot close** (CHENG).
It misses `import()`, `new Image().src=`, `EventSource`, `navigator.sendBeacon`,
`document.createElement('script').src`, and `window["fetch"]`. This is the same
failure class as the ESM guard that could not fire: pattern-match the tokens we
thought of, then report their absence as proof of a property.

**Replace the negative assertion with a positive one the browser enforces:**

```
default-src 'self'; connect-src 'self' https://data.readthegame.co
```

The gate then asserts that string is present and correct — a positive check,
mutation-provable by corrupting it. The doctrine claim stops being something we
assert and becomes something **the browser refuses to violate**, visible to
anyone who reads the page source. Same move as pinning the ends-switch rule
rather than the pattern it usually produces.

Delivery: Cloudflare Pages supports a `_headers` file, which yields a real
response header and is strictly better than a `<meta>` tag. `_headers` is also
where `noindex` on `raw/` belongs. **Unverified from here** — see §Open questions.

---

## Permalink pages: keep the property, do not fork the renderer

The self-contained per-game page stays: one file, data inlined, no network. It is
the shareable, archivable artifact, and it preserves "save it to disk and it
still works" for a single game even though the multi-game browser retires it.

**But the drift argument that killed the JS extractor applies here too** (CHENG).
A per-game page is a second rendering path. If it is generated by anything other
than `build_main.py` with the data swapped, gated the same way, it becomes the
copy where the wrong number hides.

So: `build_main.py` grows a `--game` parameter. It does not grow a sibling.

---

## What changes in the repo

| Path | Change |
|---|---|
| `builders/fetch_nhl.py` | **new** — acquisition only. No transformation, no interpretation. Writes raw bytes. |
| `builders/extract.py` | parameterise `GAME`; keep all four gates per game |
| `builders/build_main.py` | `--game` for permalink pages |
| `builders/build_index.py` | render `lastIngest`; game list from the index |
| `.github/workflows/ingest.yml` | **new** — scheduled + `workflow_dispatch`, convergent window |
| `.github/workflows/deploy.yml` | grep → CSP assertion |
| `src/_headers` | **new** — CSP, `noindex` on `raw/` |
| `test/ingest.test.js` | **new** — window convergence, idempotence, state gating |

**Acquisition and extraction stay separate programs.** `fetch_nhl.py` is allowed
to touch the network and forbidden to interpret; `extract.py` is the reverse.
That boundary is what lets the extractor keep its byte-identical gate — it never
sees a socket, only files, exactly as today.

---

## What I verified, and what I did not

**Verified, 2026-08-09, by fetching:**

| Check | Result |
|---|---|
| `/v1/schedule/2023-11-10` | HTTP 200, 83,263 bytes |
| `/v1/score/2023-11-10` | HTTP 200, 39,751 bytes |
| `/v1/gamecenter/2023020204/play-by-play` | HTTP 200, 131,610 bytes |
| schedule returns one day or a week? | **a week** — `gameWeek` spans 7 dates |
| games on 2023-11-10 | 6, reference game present, `gameState=OFF` |
| `gameState` vocabulary | `{OFF: 133}` across 3 sampled weeks — **one value observed** |
| `gameType` vocabulary | `{2: 127, 3: 6}` — regular season and playoff |

**Not verified, and flagged rather than assumed:**

- That the NHL amends play-by-play after the fact. CHENG's claim; the design is
  correct either way, but the window size depends on it.
- The non-final `gameState` values. Unobservable in August.
- That Cloudflare Pages honours `_headers` for CSP and `X-Robots-Tag`. Documented
  behaviour, untested by us.
- Shift-chart endpoint behaviour for a game with no shift data.

---

## Open questions for CHENG

1. **Window length.** It depends on the league's correction latency, which
   nobody here has measured. Should the first version simply be *long* (say 14
   days) and instrumented, so the ingest measures the latency it was designed
   for? That turns an unverified premise into data.
2. **Change detection.** Compare content hashes of raw feeds, or re-extract every
   game in the window every night? Hashing is cheaper and gives a free
   amendment log; re-extracting is simpler and has no cache to be wrong.
3. **Does a failed vocabulary gate block one game or the whole run?** Per-game
   is obviously right for availability. But a new event type across every game in
   a night is a feed change, and publishing 6 of 7 games silently is the kind of
   partial success that reads as health.
4. **Retention of raw feeds.** Every version, or latest-plus-history-of-changes?
   Bears directly on question 2.
5. **What does the app show for a game that failed its gate?** "We have it but
   will not show it" is more honest than omission, and more confusing.
