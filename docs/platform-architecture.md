# Read the Game as a public platform — ingestion, storage, and the honesty line

**Technical artifact for review.** How the single-game app becomes a public,
multi-game, nightly-updating site without giving up the thing that makes it worth
building.

| | |
|---|---|
| **Status** | For review — nothing implemented |
| **Author** | CC |
| **Date** | 2026-08-07 |
| **Reviewer** | CHENG |
| **Companion** | `docs/main-app-rework.md` — Phases 0–2 are unchanged and are prerequisites for everything here |

---

## What changed

Kevin set direction during the Phase 0 review:

- **Multi-game.** Nightly job pulls the previous day's games, prepares the datasets, and the app is date-selectable.
- **Public, hosted, with a real backend.** Aiming for real traffic.
- **"We are absolutely a *replay*, not a real-time educational resource."**

That last line is a positioning decision and it does more architectural work than
the other two combined, so it goes first.

## Replay, not real-time — what it buys

Everything below is simpler because we never render a game in progress:

- **No partial state.** A game is ingested once, complete, and never mutates. That
  makes every extract immutable and infinitely cacheable.
- **No provisional honesty problem.** We never have to explain that a number on
  screen is mid-flight and will change. Doctrine §2 (deterministic, same inputs →
  same outputs) holds trivially, because the inputs are frozen.
- **No polling, no websockets, no live invalidation.**
- **The teaching case is stronger anyway.** Understanding a game wants the whole
  game. "Minnesota outshot Buffalo 35–25 and lost" is not a statement you can make
  in the second period.

**Recommendation: write this into DOCTRINE.md as a rule, not a roadmap note.**
"Replay only" is the kind of constraint that quietly erodes the first time someone
asks for a live score, and it is load-bearing for half the decisions here.

## Scale

Measured from our reference game, at 32 teams × 82 games ÷ 2 = **1,312 regular-season
games per season**:

```
extract   (rich.json)         64 KB/game  ->   86.6 MB/season
raw feeds (pbp+shifts+box)   380 KB/game  ->  510.9 MB/season
both                                      ->  597.5 MB/season
app code (main app, no data)   ~27 KB      served once, cached forever
```

Two conclusions. Committing this to git was never viable — F5's "the HTML is the
source" problem would become a 600MB version-controlled problem. And the app code
is *three orders of magnitude* smaller than one season of data, which is the whole
argument for the architecture below.

---

## The architecture

```
  NHL public feed
        |
        v
  [ Ingest worker ]  nightly cron, previous day only
        |            fetch -> VALIDATE VOCABULARY -> extract -> store
        |
        +--> object storage:  raw/{gameId}.json      (the league's bytes, untouched)
        |                     extract/{gameId}.json  (our rich.json)
        |
        +--> index DB:        one row per game
                              date, teams, score, shots, goalie lines,
                              derived teaching flags
        |
        v
  [ Thin API ]  games by date / team / property  ->  reads the index only
        |
        v
  [ CDN ]  app (~27 KB) + extracts, immutable, cached hard
        |
        v
  [ Browser ]  fetch one extract  ->  RUN EVERY REDUCER HERE
```

### The line I want to defend: reducers stay in the browser

The server ingests, stores, indexes and serves. **It never computes a metric.**
Corsi, danger, save percentage, and every layer we add are derived client-side,
from the extract, by code the viewer can read.

Two reasons, and they happen to agree:

**Doctrine.** If the server computes Corsi and ships a number, we are a black box.
An open-source black box, but still one — nothing on screen would be recomputable
in front of the viewer. Doctrine §2 says *every number on screen can be recomputed
by hand from the event feed, and the app will show you how if you ask it.* That
sentence is only true if the computing happens where the asking happens.

**Cost.** Server-side computation scales with traffic. Client-side computation
scales with nothing — we serve immutable static JSON through a CDN, and 10,000
users cost approximately what 100 cost. For "hopefully tons of users" this is the
difference between a hobby bill and a real one.

I want this stated as a rule because it is very cheap to hold now and very
expensive to retrofit. The first performance complaint will produce a suggestion
to precompute layers server-side, and the answer needs to already exist.

### Where the backend genuinely earns its place

Not in rendering, and not in math. In **cross-game query**.

An index over 1,312 games a season makes this askable:

> *Show me every game where the team that got outshot won.*

That query **is** the project's thesis. Today the thesis rests on one game we
picked by hand, which makes it an anecdote. With an index it becomes a browsable
claim about the sport, and a novice can watch the pattern repeat until it stops
being a trick and starts being knowledge. Same for "games a goalie stole",
"games where the shot count lied hardest", "every game this team lost while
controlling play."

That is the feature that turns a demo into a site, and it is the only part of
this design that actually needs a database.

The index stays small — it holds *facts about* games, never their events. SQLite
or D1 is sufficient for a long time; Postgres when it isn't.

---

## The vocabulary gate — the thing most likely to hurt us

Two 2025-26 games, checked against our 2023-24 reference, already produced feed
vocabulary we had never seen:

| Value | Status in reference game |
|---|---|
| `tv-timeout` as a **primary** stoppage `reason` | Only ever appeared as `secondaryReason` |
| `puck-in-penalty-benches` | Absent entirely |

The draft whistle layer maps `reason` → teaching copy and does `if not r: continue`.
**Both of those would have been silently dropped.** At one game a human might
notice. At 1,312 games a season, nobody will ever notice.

That is a Doctrine §3 violation produced by a `continue` statement, and it is
exactly the class of error CHENG's conservation property exists to catch.

**Requirement: ingestion fails loudly on unrecognised vocabulary.** Unknown
stoppage reason, unknown penalty `descKey`, unknown event type, unknown detail
field → the game is flagged, not silently degraded. It is better to serve 1,311
games and an alert than 1,312 games where one quietly lies.

This is also cheap and testable: the vocabulary is a set, the gate is a set
difference, and the test is our two-season fixture pair.

## The feed adapter is the blast door

CHENG proposed a `feedAdapter` so ownership resolution is testable per source.
Multi-game and a public site turn that from good hygiene into structural
protection:

- `api-web.nhle.com` is **undocumented** (see Risks). It will change.
- When it does, one module changes and **the archive survives**, because we
  ingested and kept rather than fetching at view time.

Concretely: never fetch from the NHL at render time. The browser reads *our*
extract from *our* CDN. A feed change breaks tomorrow's ingestion, never
yesterday's page.

---

## What we retire, and what replaces it

The README currently promises: *"an app you can save to disk and still have work
is an app that isn't hiding anything."* **Multi-game kills that property**, and it
should be retired deliberately rather than quietly broken.

What replaces it is stronger:

> **We serve the league's raw bytes next to our extract.**

Anyone can download `raw/{gameId}.json` and `extract/{gameId}.json`, diff them,
and re-run our reducers — which are the same client-side modules their browser
just ran. "Check our work" stops being a slogan and becomes an HTTP request. That
is a better claim than inlining ever gave us, and it is only available once we're
serving files.

### Keep the old property where it is actually useful

Generate a **self-contained permalink page per game** — one file, data inlined,
no network, exactly like today's app. It's the shareable, archivable, save-it-forever
artifact for a *single* game, sitting alongside the multi-game browser. Best of
both, and it costs one build target.

---

## Video clips

The feed carries `highlightClip` (a Brightcove video ID), `highlightClipSharingUrl`
(an nhl.com page), and since 2025-26 `discreteClip` plus French variants. **Goals
only** — verified across three games, zero clips on any other event type; coverage
was 4/5, 6/6 and 8/8 goals.

Durability is encouraging: both sampled URLs resolve **200**, including the
2023-24 one nearly two and a half years later.

**Why this matters is doctrinal, not decorative.** Our stated limit is *we show you
where and what, never a fabricated how.* A clip link is a **real how** — the
league's own footage of the exact event, arriving in the same feed as the
coordinates. It's the one place the ceiling lifts without bending Doctrine §1 at
all, and it's the most inspectable thing we could possibly offer: don't believe
our attribution, *watch it*.

**Recommendation: link, never embed.** Embedding is technically trivial — the
player URL pattern is public and nhl.com sets no `frame-ancestors` or
`X-Frame-Options`, so we could ship it today. We shouldn't:

- **Rights.** That Brightcove account is the NHL's. Embedding serves their content
  off their bandwidth on our property. The field is named `highlightClip***Sharing***Url`;
  sharing is the signposted use. Absence of a technical block is not permission.
- **Supply chain.** Their player is third-party JavaScript in a page whose pitch is
  "read the code."

A thumbnail with a play affordance opening nhl.com gets most of the experience at
none of the risk. True embedding is a licensing conversation, not a code change.

**One unknown I have not resolved:** what `discreteClip` is versus `highlightClip`.
My guess is isolated-goal versus produced-package, but it is a guess, and this
project has been burned by exactly that this week. Check before using either.

---

## Risks

**The undocumented API is now the biggest risk to the venture.** Verified: `/info/api`
on nhl.com is a soft-404, and `api-web.nhle.com` roots return 404 — there is no
public API documentation, no published terms, no stated rate limits, and no
compatibility promise. Every consumer of this feed is using an internal endpoint.

Going public at scale changes our posture from "one game excerpt for demonstration"
to "a site redistributing the league's data nightly." I can't tell you whether that
is permitted; I can tell you that "hopefully tons of users" is the threshold where
the question stops being theoretical, and that it deserves an answer before it
becomes an investment.

Concrete, actionable pieces of it:

- **Logos and marks.** The only IP language found states that NHL and team logos
  and marks may not be reproduced without written consent. Our apps use team
  colours and three-letter abbreviations and no logos. **Keep that deliberate.**
- **Attribution.** Say plainly and prominently where the data comes from.
- **Rate limiting ourselves.** Nightly, previous-day only, is already a gentle
  access pattern. Keep it that way; don't backfill the archive with a firehose.
- **Archive as insurance.** Covered above: ingest and keep.

**Operational risks** that arrive with being public: a feed change mid-season is
now an incident rather than an annoyance; we need monitoring on the nightly job
(a game count that silently drops to zero is the failure to catch); and we need to
decide about analytics and abuse before rather than after.

---

## What this does to the phase plan

**Phases 0–2 are unchanged and are prerequisites.** Nothing here replaces them:

- `loadGame(gameId)` **is** the multi-game seam. It's Phase 1's boundary.
- The current app hardcodes `MINID`, `BUFID`, team colours and one embedded game.
  Multi-game bolted onto the monolith is how we get a second Finding 1.
- The reducer contract is unchanged by any of this. It just gains a data source in
  front of it.

**Retired:** the GitHub Pages target in `main-app-rework.md` Part 5. The CI
reproducibility gate survives and still matters.

**New phases, after 2:**

- **Phase 4 — Ingestion.** Worker, vocabulary gate, object storage, index schema.
  Gate: ingest a full week, byte-compare two independently-ingested runs, and prove
  the vocabulary gate fails loudly on a deliberately corrupted fixture.
- **Phase 5 — Multi-game app.** Date selection, `loadGame` over fetched extracts,
  the cross-game query surface.
- **Phase 6 — Permalink pages.** Per-game self-contained build target.

---

## Questions for CHENG

1. **Is "reducers never run server-side" the right rule to write down**, or is there
   a legitimate exception — precomputing the index's teaching flags, say — that I
   should carve out explicitly rather than leave to be argued later?
2. **Index schema:** what belongs in the row? I've listed date, teams, score, shots,
   goalie lines and derived flags. Derived flags worry me — they're computed values
   living server-side, which is exactly what rule 1 above forbids. Is that a real
   contradiction or an acceptable one?
3. **Is the vocabulary gate's failure mode right?** Flag the game and serve the rest,
   versus refuse the whole night's ingest. I lean flag-and-alert; refusing feels
   safer and would produce silent gaps in the archive instead.
4. **Storage of raw feeds — worth 511 MB/season?** It's what makes "diff our extract
   against the league's bytes" possible, which I think is the strongest honesty
   claim available to us. But it's 6× the extract size for a feature few will use.
5. **What am I not seeing about going public?** This is the part of the design
   furthest from anything the project has done before, and my confidence is
   correspondingly lowest.

## Where I am least confident

- **The whole legal posture.** I have established that the API is undocumented and
  that logos are protected. I have established nothing about whether this use is
  permitted, and I'm not the right entity to.
- **Whether the cross-game index is the product or a distraction.** I've argued it
  turns the thesis from anecdote into evidence. It's also a much bigger surface
  than the replay app, and it could eat the project.
- **Cost at real traffic.** "CDN-cheap" is right in shape, but I haven't modelled
  egress on ~87 MB/season of extracts against any actual user numbers.
- **Whether "replay only" survives contact with users.** It's the right call and
  I'd defend it — but the first person who asks for live scores will be the first
  of many.
