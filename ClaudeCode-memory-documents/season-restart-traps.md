---
name: season-restart-traps
description: "⚠️⚠️ 2026-09-19/20/21 — hockey came back after a quiet summer and EIGHT things broke in three days, every one a latent assumption that the season never ends. ⭐⭐ THE RULE: when the newest game in the archive changes KIND, every rule that picks 'the newest game' is a suspect. Preseason is not new (294 viewable since 2023-09-23) — what is new is that the NEWEST game is preseason, for about a fortnight every September."
metadata: 
  node_type: memory
  type: project
  originSessionId: 8f9d1658-c867-4634-b583-bc00a74d9ec7
  modified: 2026-09-20T22:17:35.892Z
---

The archive had not gained a game since the Cup final on **2026-06-14**. Preseason
resumed on **2026-09-19** and four things broke inside two days. Regular season
opens 29 September. **This recurs every year**, so the list below is a checklist,
not a war story.

## ⭐⭐ THE ONE RULE

**When the newest game in the archive changes KIND, every rule that picks "the
newest game" is a suspect.** Three of the four failures were one question — *which
is the newest game we can show?* — answered by two different rules that **agreed
only while hockey was out of season**. None was a new bug; all were latent for up
to three years and invisible because the newest viewable game was always a playoff
game.

⚠️ **PRESEASON IS NOT NEW.** The archive has held **294 viewable preseason games
since 2023-09-23**. What changes for a fortnight each September is which kind of
game is *newest*. So "we handle preseason" is not the question; "what picks the
newest game, and do they all agree" is.

## WHAT BROKE, IN ORDER

**1a — ⛔⛔ THE 09-19 HALT WAS FALSE, AND ITS OWN ERROR MESSAGE LIED ABOUT WHY —
corrected 2026-09-20.** *"none of the 7 games in the window are in a state we
recognise as final (saw `FUT`×7) — we can no longer read this feed; refusing the
whole run"*. Seven preseason openers read at 14:15 UTC, every one starting at
23:00 UTC. **The feed was readable. Nothing had been PLAYED.** `ingest.yml`
hard-coded *"the run halted on a feed vocabulary change"* for that exit code, so
the halt wore the other halt's label — and **CC believed it and wrote it here**,
because the genuine vocabulary halt the next night appeared to confirm it.
⭐⭐ **A claim from your OWN instrument is the hardest kind to doubt**, and the
rule is the same: [[verify-inherited-claims]]. The root cause under all of it:
**the pipeline modelled two outcomes — final, or incomprehensible — and hockey
has a third: NOT YET.** Fixed 2026-09-20 in `fetch_nhl.py` (a `pending` bucket,
plus a start-time test that needs no vocabulary), the halt (now also requires a
game we cannot account for AT ALL), the front door's denominator, and the
workflow, which now prints the halt's own reason.

**1b — the vocabulary alarm halted the nightly ingest ONCE, on 09-20, and that is
it WORKING.** *"the feed used vocabulary we have never seen: penalty descKey
["fighting", "instigator", "roughing-double-minor", "throwing-equipment"]"*. A
value the LEAGUE can invent, caught by an archive-wide sweep rather than a unit
test holding last year's answer ([[guard-where-the-archive-is]]). None of the four
appears in the 4,553 games archived before it — `fighting` is what preseason
produces. ⭐ It halts BEFORE the sync, so nothing was corrupted and the live site
was never wrong; the cost was the archive standing still. ⚠️ **Nothing kept the JS
prose table (`PEN`) and the Python vetted list (`KNOWN_PENALTIES`) in sync**, and
each direction fails silently: vetted-without-prose means the alarm forgives it AND
a reader sees the raw descriptor; prose-without-vetting hides it from the drift
report. Now checked as SETS — *a length check passes when each side gains a
different word.*

**2 — `phone-fit` failed with "game.html laid out with NO SUBJECT".** `sitecopy`
took its extracts from `recentGameIds`, which **says in its own docstring** it is
*"a WINDOW, never a prediction of the page's pick"* — and was depended on as
exactly that, because those extracts are what let the page boot. Window: `t === 2
|| t === 3`. Page: `v` and nothing else. ⭐⭐ **THE GATE WAS RIGHT, AND REFUSING TO
MEASURE IS THE ONLY REASON THIS WAS CAUGHT** — *"this gate measured a page with
nothing on it, which is how a 25px overflow shipped."* An instrument that shrugged
would have reported "it fits" on a page a visitor could not use. Fixed by running
the PAGE'S OWN `pick()`, extracted from the built page rather than restated.

**3 — the front door said the archive stops in June.** Rendered live, adjacent:
*"Next CAR at FLA, Sunday, September 20 at 7:00 PM. The last night we hold is 14
June 2026 — see it →"*, while `/game` opened a game from the 20th. ⛔⛔ **A RATES
PREDICATE DOING DUTY AS A VISIBILITY RULE.** `inScope` is the population a rate may
pool; `competitions.js::isLeague` states it exactly — preseason, the all-star
games, the Olympics and the 4 Nations are *"archived, derived and VIEWABLE, and
never enter a computed number"*. "The last night we hold" is not a computed number.
⭐ Kevin on the fixture comment that encoded the stronger reading (*"Neither may
reach a surface"*): **"this isn't true (and I don't remember why we said this)"** —
traced to a true rule copied one notch stronger than its source, then enforced in
the stronger form. [[verify-inherited-claims]].

**4 — Kevin, from the live site: "a novice won't know what a double minor is."**
Not a season bug, but it arrived with the same preseason games. See
[[penalties-lede-open]].

## ⭐⭐ THE ROOT CAUSE UNDER MOST OF IT — found 2026-09-21

**The pipeline modelled two outcomes: a game is FINAL, or its state is something we
cannot read. Hockey has a third, and it is the commonest of all — the game has not been
played.** Conflating "not yet" with "incomprehensible" produced three separate failures:

- the 09-19 **false halt** (7 openers, all `FUT` at 14:15 UTC, starting at 23:00 UTC:
  *"we can no longer read this feed"* about hockey nobody had played);
- the front door telling visitors **"6 are listed in a state we don't recognise yet"**
  about games that were `LIVE` or hadn't started, and counting them in *games played*;
- a **halt that would recur every September**, and after any break longer than the window.

✅ Fixed in one pass: a `pending` bucket in `fetch_nhl.py`, a three-term conservation law
(`gamesInWindow = final + pending + unknown`), a halt that now also requires a game we
cannot account for AT ALL, and a denominator that subtracts the unplayed.

⭐ **PENDING_STATES HOLDS ONLY WHAT THE FEED HAS SENT US** — `FUT` and `LIVE`. `PRE` and
`CRIT` are documented and unobserved, so neither is listed. They are still handled, by
the one test that needs no vocabulary: **a game whose start time is in the future has not
been played, whatever it is called.** Only a game that has STARTED in a state we have
never seen falls to `unknown` — which is exactly the population the halt is for.

## ⛔⛔ AND THE FALSE HALT WORE THE OTHER HALT'S LABEL

`ingest.yml` hard-coded `::error::the run halted on a feed vocabulary change` for that
exit code, with a comment still describing the correlation halt `fetch_nhl.py` had
already replaced. **CC believed its own CI error line**, wrote it into `docs/status.md`
and into this file, and the genuine vocabulary halt the next night appeared to confirm
it. ⭐⭐ **A claim from your OWN instrument is the hardest kind to doubt.** The step now
prints the halt's own reason; a second copy of a sentence is free to drift from the
first, and it did. [[verify-inherited-claims]]

## ⚠️ `inScope` KEPT DOING VISIBILITY DUTY — three times, and the rule was already written

`isLeague` says these competitions are *"archived, derived and VIEWABLE, and never enter
a computed number"*. Three surfaces used it as a visibility rule anyway: the front door's
dark-night door (09-20), **a club page's game list** (09-21, Kevin: *"I would have
expected preseason game(s) to appear… even though we don't count them in any numbers"*
— WSH 260 → 279 rows), and the front-door hero (09-21, ruled: a preseason game MAY be
the hero; it was showing a game from 9 JUNE).
⛔⛔ **The correction for the first was written into `build_index.py` on 09-20 — "inScope
IS A PREDICATE ABOUT NUMBERS AND THIS IS NOT A NUMBER" — about 560 lines from the second
one. Writing a rule down is not applying it, and a one-line "swept and found sound" is
not a search.**
⭐ The line now has a name: `competitions.js::isClubGame` (types 01/02/03) answers *are
these the clubs this site is about*, as against `isLeague`'s *may a rate pool this*.
Found because widening the hero to a bare "is it viewable" handed the door to the
fixture's OLYMPIC game — **the tests caught a scope nobody had ruled on**.

## ⏭ THE CHECKLIST FOR NEXT SEPTEMBER

- Every rule that picks "newest / featured / the last night we hold". Two of them
  now run each other's answer and must agree (`homepage.test.js`, the dark-night
  door vs `pick()` from the built game page).
- Anything filtering `gameType` / `inScope`: ask **is this a claim about a NUMBER
  or about what we SHOW?** Only the first may use `inScope`.
- ⏭ **Known residue:** `pick()` is pure `v`, so `/game` could open an exhibition —
  11 exist (All-Star, Four Nations, two singletons). It needs a February week with
  no other games, so it is near-unreachable, and it is the last place these two
  rules still differ.
- Surfaces that assume a game HAS rates. Verified fine: the verdict card says *"the
  card shows no comparison, so there is no dot to place"* and falls back.
- `daily.js` was already preseason-aware from an earlier fix — check it stays so.

**Swept and found sound:** `calendar.js` buckets competitions deliberately; the two
differing "published" counts (`health.mjs` all-viewable vs `measure.mjs` in-scope)
are correct as they stand, because measures.json only covers league games.

Related: [[guard-where-the-archive-is]] · [[hockey-legibility-build]] ·
[[mechanize-the-review]] · [[looking-at-pixels]] · [[verify-inherited-claims]].
