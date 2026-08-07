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

**Write down the teaching reason, not the engineering ones.** Everything above —
immutable extracts, no polling, trivial determinism — is a *consequence*, and
consequences look negotiable the moment somebody offers to solve them. The
unanswerable argument is the one about what the product is for:

> **"Minnesota outshot Buffalo 35–25 and lost" is not a sentence you can say in the
> second period.**

The thesis requires a finished game. Live scores aren't a feature request against
this product; they're a different product.

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

### The rule: every displayed number is re-derived in the browser

> **No number on screen comes from the server. The server may index, but every
> indexed claim must be re-derivable client-side by the same reducer — and the app
> verifies it on load. Disagreement is an error, not a rounding difference.**

*(This wording is CHENG's, and it replaces my original "reducers never run
server-side." See the amendment at the end for why mine was wrong — it is worth
reading before citing this section, because the difference is load-bearing.)*

The rule is about **recomputability**, not **location**. Location is only a proxy:
it happens to enforce recomputability, which is why forbidding server-side
computation feels right, but the proxy breaks the moment you need an index.

Under the correct rule, an index entry is **a cache of a client-side computation,
never an independent source of truth.** A teaching flag isn't a displayed number —
it is a *search predicate*, and its only power is deciding which games to show
you. When the game opens, the browser runs the same reducer against the extract and
confirms it.

Three properties follow, none of which the location-based rule had:

- **It is mutation-testable.** Corrupt one index row, open that game, watch the
  client raise. The location rule could only ever be enforced by code review.
- **It kills the precompute retrofit at the root.** Precomputing Corsi server-side
  becomes *permitted* — and pointless, because the client recomputes it anyway and
  saves nothing. The rule doesn't have to win that argument; it makes the argument
  not worth having.
- **At scale the index audits itself.** Every user who opens a game verifies one
  row. 1,312 rows, checked continuously by ordinary traffic, for free. That is a
  better integrity story than any server-side test suite.

**Cost still points the same way.** Client-side derivation scales with nothing — we
serve immutable JSON through a CDN, and 10,000 users cost about what 100 do.

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

**Schema rule, following from the recomputability rule above.** Every column is
either **a fact copied from the feed** (date, teams, score, shot counts) or **a
flag re-derivable by a named reducer**. Store the reducer's name and version
beside the flag, so the client knows what to re-run. Anything that fits neither
category does not belong in the row.

### The index is the first feature that asks for trust — and the fix that repays it

Today every number is checkable because there is one game and its events are right
there on screen. *"Show me every game where the outshot team won"* is a claim about
1,312 games that **no user can verify by hand.** The project's epistemic pitch
would quietly stop applying at exactly the feature I think might be the product.

Client-side re-derivation is what repays that trust — each row becomes checkable
the moment you open it. This has to be designed in rather than added later, and it
is the load-bearing reason to fix the rule now.

### Always show the base rate — a filter that shows only exceptions teaches a falsehood

**This is a doctrine requirement, not a UX preference.**

"Every game where the team that got outshot won" surfaces **only confirming
instances**. A novice browsing that list learns *shot count doesn't matter*, and
that is **false**. Shot volume correlates with winning. Our reference game is
interesting *precisely because it is an exception*. An index that surfaces only
exceptions manufactures a false impression out of entirely true rows — which is
what Doctrine §1 forbids in spirit even when every individual row is honest.

The fix is one number:

> **347 of 1,312 games — 26%**

That converts a cherry-pick into a statistic, and it is a better teaching moment
than the list ever was: *usually the shot count tells you who won; here are the
times it lied, and here is how often that happens.* Doctrine §3 — honest limits
stated on screen — applied to a query result.

**Every cross-game filter ships with its base rate, or it doesn't ship.**

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

**Requirement: unrecognised vocabulary fails loudly.** Unknown stoppage reason,
penalty `descKey`, event type or detail field → flagged, never silently degraded.
Better to serve 1,311 games and an alert than 1,312 where one quietly lies.

### The gate belongs on *publication*, never on ingestion

My first draft asked whether to flag one game or refuse the whole night's ingest.
That was a false binary — the two operations should never be coupled.

**Always ingest. Always store the raw bytes. Never refuse.** The archive is the
mitigation for this document's biggest risk, and refusing ingestion on unknown
vocabulary means *the night the NHL ships a new event type is the night we
permanently lose that game*, with no guarantee it can be re-fetched later. That is
the worst possible coupling: the gate would fire exactly when the data is most
novel and least replaceable.

So: raw and extract are stored unconditionally. The game is **held out of the
index**, and an alert fires. The cost is a day's delay on one game, never a hole in
the archive.

**Version the vocabulary set, and hold flagged games in a queue rather than a
graveyard.** Add `puck-in-penalty-benches` to the set, re-run, and the game
publishes itself. Without that, every unknown value becomes manual archaeology six
months later.

This is cheap and testable: the vocabulary is a set, the gate is a set difference,
and the test is our two-season fixture pair plus a deliberately corrupted fixture.

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
My guess is isolated-goal versus produced-package — but it is a guess about an
undocumented field's semantics, which is the *precise shape* of the blocked-shot
defect: a plausible belief about a feed field, never tested, propagated into code.
Same standard applies. **Derive it empirically across several games and pin it with
a test, or don't use the field.**

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

## Immutability is a property to prove, not to assume

"Ingested once and never mutates" is a claim about *our* behaviour, and stated as
pure upside it hides a cost: the NHL revises play-by-play after the fact —
scorekeeper corrections to shot attribution, penalty times, occasionally
coordinates. Freezing an extract **locks in the league's errors permanently and
silently**, and permalink pages make it worse by baking a snapshot into a file.

Two cheap mitigations, both worth doing:

- **Ingest at T+24h**, past the correction window, rather than immediately.
- **Store a fetch timestamp and a feed hash per game**, so re-ingestion is possible
  and any change is visible rather than a mystery.

**Evidence that this works:** re-fetching our 2023-24 reference game today returns
a payload hash-identical to the copy archived in this repo (`bcfea175…`, 320 plays
both times). That does *not* test the correction window — the game is two and a
half years old and long past it — but it does establish that settled games are
stable, which is precisely what makes a T+24h ingest a durable artifact, and it
demonstrates the hash check is trivially feasible.

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
4. ~~**Storage of raw feeds — worth 511 MB/season?**~~ **Settled: keep them, not a
   close call.** I had filed this as "6× storage for a feature few will use," which
   undersells it by a category. The raw archive is *the mitigation for the biggest
   risk in this document* — if the feed changes shape or disappears, the archive is
   the only reason the site still exists. "Diff our extract against the league's
   bytes" is the *second* benefit. The cost framing was also wrong: ~600 MB/season
   of object storage is a cent or two a month, and egress is near zero because
   almost nobody pulls raw files. Cheapest insurance in the design.
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

---

# Amendment — after CHENG's review

CHENG verified the arithmetic and the vocabulary claim before answering (extract
64.5 KB → 86.6 MB/season exact; raw 493 MB from pbp+shifts, 511 MB including
boxscore). He also sharpened the vocabulary finding: in the reference game
`tv-timeout` appears **8 times as `secondaryReason` and zero times as primary**,
and `puck-in-penalty-benches` is absent entirely — so a mapping built from that
game alone *would have looked complete*.

The corrections are folded into the body above rather than left as trailing notes,
because the rule in particular is the sentence everything downstream will cite.
What changed:

**The rule was stated wrong, and the contradiction I flagged dissolves once it's
fixed.** I wrote "reducers never run server-side," which is a rule about
*location*, then justified it with Doctrine §2, which is a rule about
*recomputability*. Those aren't the same. Location is a proxy that happens to
enforce recomputability — and it breaks exactly where I noticed it breaking, at the
index. The corrected rule permits an index, requires every indexed claim to be
re-derived client-side on load, and is mutation-testable rather than
review-enforced. It also disarms the precompute retrofit better than mine did: not
by forbidding it, but by making it pointless.

**The vocabulary gate belongs on publication, not ingestion.** My Q3 offered a
false binary. Refusing ingestion would mean losing data on precisely the night it
is most novel and least replaceable.

**Raw feeds are insurance, not a nice-to-have.** My cost framing was wrong by a
category.

**A filter that surfaces only exceptions teaches a falsehood.** This is CHENG's
best catch and I had missed it entirely. Every cross-game filter now ships with its
base rate. See the section above — it is a doctrine requirement, not a UX note.

**Immutability can make us wrong.** It locks in the league's post-game corrections.
Mitigated by T+24h ingest and a stored fetch timestamp plus feed hash.

**Still open, unchanged by this review:** the legal posture around an undocumented
API and redistribution at scale, which remains the biggest risk here and is not an
engineering question. And whether the cross-game index is the product or a
distraction — CHENG's trust point makes it *safer*, not smaller.

**Order of work is unchanged.** Findings 1 and 4 from `main-app-rework.md` are
still the next code written.
