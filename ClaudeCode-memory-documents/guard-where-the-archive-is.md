---
name: guard-where-the-archive-is
description: "✅ 2026-09-19 IT PAID OFF FOR REAL: the vocabulary alarm halted the nightly ingest on four penalty descriptors the league invented over the summer, BEFORE the sync, so nothing was corrupted. ⭐ THE RULE 2026-08-21: a value the LEAGUE can invent needs a check where the WHOLE ARCHIVE is walked — not a unit test holding a copy of last year's answer. Pinned fixtures are the edit-time half and were being mistaken for the whole thing."
metadata:
  node_type: memory
  type: feedback
  modified: 2026-08-21T16:00:00.000Z
---

**Kevin, on my saying `teams.js` deserved the same fix later:**

> *"isn't this where bugs creep up 3 months from now?"*

Yes. `gameType` sat unguarded for exactly that reason and nobody found out
until a calendar needed to render it. **"Worth the same treatment eventually"
is a deferral with no trigger, which is a bug with a delay on it.**

# ⭐ The rule

> **A value the LEAGUE can invent needs a check where the WHOLE ARCHIVE is
> walked — not a unit test holding a copy of last year's answer.**

**Why:** a pinned fixture cannot notice a value it has never been told about.
It fails loudly only *after* a human notices and re-pins, which is the opposite
of what such tests usually claim.

**How to apply:** for every hand-maintained table, ask *if the league invents a
value, does anything go red where the whole archive is walked?* If the only
answer is a unit test, that is the **edit-time half** and the day-it-happens
half is missing. Say which half a test is, in the test.

## Three found in one audit, all live

| table | the league can invent | guard before | guard now |
|---|---|---|---|
| `gameType` | a new competition | **nothing at all** | `derive.py`, red |
| `TEAMS` | a relocation or expansion club | pinned fixture only | `measure.mjs`, red |
| vocabulary (`noted`) | a new stoppage reason | recorded, never alerted | `derive.py`, red on **drift** |

**The league really does mint codes:** `19`/`20` in Feb 2025 for a 4 Nations
tournament that had never been held, `9` in Feb 2026 for the Olympics — both
after this archive started, and named nowhere in the feed.

## ⭐ Three sub-rules that fell out of it

1. **Loud in the PIPELINE, never in the artifact.** None of these can reach a
   number — `inScope` keys on the id, rates use ids not abbreviations, the
   extract drops stoppage detail. So publish everything, *then* exit non-zero.
   **Withholding a game over a missing display NAME is the mistake the 73
   refused games already were** — see [[refusal-gap-32-games]].
2. **Alarm on DRIFT, never on the count.** 23 stoppage reasons are forgiven on
   every live run. A check firing on all 23 nightly would be switched off within
   a week, and then the 24th arrives invisibly. `data/vocabulary-seen.json` is
   the acknowledgement list — deliberately *not* `KNOWN_STOPPAGES`, which is
   **vetted and gets prose**; this is **seen and chosen to render raw**.
3. **Rendering raw is fine. Nobody being TOLD is not.** `whistle.js` is right
   that inventing a rule explanation for an unread value would be a guess. The
   defect was never the fallback; it was that a count printed in a CI log and a
   key in `index.json` are not a signal.

## And the docstring that was lying

`teams.js` said *"the next relocation or expansion team fails loudly instead of
rendering a blank chip."* It did not — the only check compared it to a pinned
fixture. **Corrected in place rather than deleted, because the shape of the
error is the lesson.** See [[mechanize-the-review]] for the same defect
appearing in a test I wrote hours later, after criticising this one.

---

## ⚠️ 2026-08-23 — THE OTHER HALF OF THIS RULE, LEARNED BY BREAKING PRODUCTION

"Guard where the archive is walked" is not enough. **A guard must read a source
that actually HOLDS the archive — and in this pipeline the run usually does not.**

I added `unheldTypes` (a name in `data/competitions.json` that no game carries)
on 2026-08-22. **The next morning it failed the nightly ingest**, reporting all
eight named gameTypes as *"the archive holds no game of it"* — with 4,553 games
sitting untouched in the published catalog.

It read the report's `types`, which counts games **this run had RAW for**. The
nightly rehydrates **pointers only**, so in the offseason it walks *nothing*:
`absent: 4553`, `gameTypes: {}`, every named type therefore "unheld".

**⭐ THE RULE WAS WRITTEN ONE FUNCTION AWAY AND HAD BEEN FOR MONTHS.**
`_write_catalog` merges each run's rows over the published catalog because
*"a game this run said NOTHING about must not read as a game that is gone."*
My guard read exactly that way. See [[mechanize-the-review]] — *a check built
from the implementation's own model of its input*, which is the dominant failure
mode in this repo, committed by me one day after documenting the very fact that
contradicted it ([[hockey-legibility-build]], D8).

**The correction:** every claim ABOUT THE ARCHIVE reads the merged catalog
(`_write_catalog` now returns it); `gameTypes` stays as this run's walk, which
is what it is honestly named. **The same move fixed a SILENT one**: `unnamedTypes`
was equally blind on a run that walked no raw, so a new competition entering the
archive would not have alarmed until the weekly full derive. It failed *safe*
rather than loud, which is why nobody had noticed.

> **Before writing a drift alarm, ask what its denominator is on the SMALLEST
> run that will execute it.** The whole-archive walk is the exception here, not
> the rule: `derive.yml` is weekly, the ingest is nightly and mostly sees nothing.

## ⚠️ 2026-08-27 — A VOCABULARY COLLECTED AND COMPARED TO NOTHING

`extract.py`'s `vocabulary()` has gathered `seen["penalty descKey"]` on every run
since it was written — **and had no entry in `unknown`.** So a descriptor the
league invented was recorded and alerted on by nobody: exactly the gap
`derive.py`'s `_vocabulary_seen()` describes for stoppage reasons, sitting open
one field over, in the same function.

It closed only because the page started RENDERING those keys. **A field nobody
displays is a field nobody checks.**

⭐ **AND THE SAMPLE PROVED THE POINT IMMEDIATELY.** The known set was seeded from
28 descriptors counted across 40 published games — and `data/rich.json` contains
**`kneeing`**, which is in none of the forty. *A forty-game sample did not
contain a word the reference fixture did.* That is the argument for the
archive-wide sweep in one sentence.

Standing: **noted, never blocking** — an unknown descriptor renders as itself on
the page (the `WHY` table's rule: known keys only, raw fallback), so it is a
wording gap and not a wrong number.


## ✅ 2026-09-19/20 — THE ALARM FIRED FOR REAL, AND IT WAS RIGHT

*"the feed used vocabulary we have never seen: penalty descKey ["fighting",
"instigator", "roughing-double-minor", "throwing-equipment"]"* — the nightly
ingest halted two nights running. **This is the thing this file argued for,
working.** None of the four appears in the 4,553 games archived before them; they
arrived with the first preseason games of a new season, and `fighting` is what
preseason produces. A unit test holding last year's answer would have seen none
of it.

⭐ **IT HALTS BEFORE THE SYNC**, so nothing was corrupted and the live site was
never wrong. The cost of the alarm is the archive standing still until a human
looks — which is the trade this file chose deliberately, and it is the right one.

⭐ **THE LEDGER'S OWN RULE HELD UP:** *"look at it first. If it deserves prose it
belongs in extract.py and penalties.js instead."* All four were real penalties a
broadcast names, so all four got prose rather than being acknowledged as raw.

⛔⛔ **AND THE GAP THE ALARM COULD NOT SEE: nothing kept the two lists in sync.**
`PEN` (JS prose) and `KNOWN_PENALTIES` (Python, what the alarm forgives) describe
one set in two languages, and each direction fails silently — vetted-without-prose
means the alarm forgives it AND a reader sees the raw descriptor (*"Raw on screen
is survivable; unnoticed is not"*), while prose-without-vetting renders nicely and
HIDES the value from the drift report. They happened to agree, 29 and 29, so the
new check was written against a passing state. ⭐ **It compares the SETS, not the
counts** — a length check passes when each side gains a different word.

See [[season-restart-traps]] for the other three things that broke the same day.


## ✅ IT FIRED TWICE MORE, AND THE SECOND HALF OF THE DRIFT RAN THE OTHER WAY — 2026-09-20/21

Preseason kept producing infractions the regular season rarely does, so the archive kept
meeting its first one: **`fighting`, `instigator`, `roughing-double-minor`,
`throwing-equipment`** (09-20, none in 4,553 games), then **`illegal-equipment`,
`instigator-misconduct`** (09-21, none in 4,567). ⭐ **Two nights out of three is the
shape of this, not an event.**

⛔⛔ **AND THE STOPPAGE HALF HAD THE OPPOSITE DRIFT.** A stoppage reason with no prose
falls through `RSN` to the key with its dashes turned into spaces — so
**`chlg-vis-goal-interference`, vetted since before that prose table existed, had been
reaching readers as "chlg vis goal interference"**. Vetted-without-prose hides a value
from the drift report AND puts a raw descriptor on the ice. **Prose first, then vetted,
in that order** — now true of all three challenge-style reasons plus `rink-repair`.

⚠️ **A TEST BROKE AND IT WAS RIGHT TO.** It used `rink-repair` — a REAL feed value that
simply had not been vetted yet — as its example of a FORGIVEN reason, so it depended on
our allowlist staying ignorant of it. Its sibling already had this right with
`"zamboni-on-fire"`. ⭐⭐ **A test about the UNKNOWN has to use a string the league can
never send.** The same trap in the same week: `test_fetch_nhl.py` used `LIVE` as its
example of a state we cannot read, which was the "not yet" defect in miniature.
