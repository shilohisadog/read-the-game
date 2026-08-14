# The deep-link seam

*For CHENG, before a line of URL parsing is written. §1–§3 are an audit of code
and pipeline that exist today; §4 is a measurement over 88 published extracts;
§5 onward is the design argument, which is where I expect the disagreement. The
hazards in §6 of `site-purpose.md` are the brief:*

> *"an event index is only stable while the extract is stable; a re-derive that
> changed event ordering would silently move every deep link. Either pin on
> something more durable than an array index, or state the coupling and test
> it."*
>
> *"a deep link that lands out of range must degrade to the start of the game
> with a word, never to a blank rink."*

The first hazard turns out to point at us rather than at the league (§3). The
second turns out to understate the problem: **the page does not degrade to a
blank rink today, it degrades to the final score** (§7).

---

## 1. What the page reads from the URL today

Two independent regexes, in two places, with no parser between them:

| where | what | form |
|---|---|---|
| `build_main.py:279` | `PREVIEW` | `/[?&]preview=1\b/.test(location.search)` |
| `build_main.py:1030` | `want` (game id) | `location.search.match(/[?&]game=(\d+)/)` |
| `build_main.py:1043` | `PREVIEW` **again** | the same regex, re-written |

Three reads, two of them the same test spelled twice. Adding `at=` and `layer=`
to this is how a fourth and a fifth get written. **This is the third instance in
a fortnight of the same structural fix** — `place(e)` for the shootout,
`page.py::document()` for the chrome, `page.py::csp()` for the hashes — and the
shape is identical: *one decision, made once, upstream of every path that needs
it.* The seam should start by collapsing what is already there, not by adding to
it.

## 2. What the page holds as state, and which of it is addressable

The replay's visible state is seven independent things, and only the first has
any claim to be a "position":

| state | held as | reachable today | should a link carry it? |
|---|---|---|---|
| event position | `let i` (`build_main.py:703`) | scrubber, play | **yes** — the whole point |
| four metric layers | `corsiOn` `hdOn` `goalieOn` `whistleOn` | four buttons | **yes** |
| strength mode | `evenOnly` | `.sbtn` pair | **yes, and this is not optional — see below** |
| trails | `trails` | `.tbtn` | no |
| figure style | `figStyle`, **persisted in `localStorage`** | `.fbtn` | no — it is a preference, not a claim |
| play labels | `labelsOn` (default **on**) | `#lbl` | no |
| "show me the work" panel | `workOpen` | button | see §10.5 |

**Strength mode has to be in the link, and it is the one people will forget.**
Every counted number on the page is measured under a mode; the scoreboard now
carries `MODE()` beside it precisely because CHENG caught the unqualified
version. A teaching sentence that says *"Colorado had 23 attempts to Dallas's
9 by this point"* is checkable only if the link reproduces the mode the sentence
counted under. Leave it out and the reader lands on a different number than the
one they were promised, and **the site's whole posture — check me — becomes the
thing that fails.**

The four layers are four booleans with four bespoke `setX()` functions and four
click handlers (`build_main.py:923–952`). There is no registry, so a `layer=`
parameter has to touch all four by hand, or introduce the table that should have
existed anyway.

**And the layer ids do not match the names we now use in public.** The module in
`src/lib/layers/danger.js` still declares `id: 'danger'` while its label reads
`＋ Shots from the slot`. A URL of `?layer=danger` would put the term we
deliberately removed — because it was somebody else's, with somebody else's
definition — back into the most copy-pasteable surface on the site. §8.

## 3. Is an event index stable? The threat is us, not the league

### How the pipeline actually behaves

`derive.py`'s own docstring is the relevant fact:

> *"Vocabulary and validation will both grow for months as real games teach us
> what we did not know. Every one of those lessons is a local reprocessing pass
> over bytes already in the bucket — **WE FETCH ONCE AND DERIVE MANY TIMES.**"*

An array index is therefore a pointer into an artifact we have *committed in
writing* to regenerating, by a program we have *committed in writing* to
changing.

### It has already been regenerated, and I checked

`data/rich.json` (the local reference, rebuilt after the whistle commit
`2482306`) against the live `data.readthegame.co/extract/2023020204.json`:

| | |
|---|---|
| events, local vs published | **320 vs 320** |
| positions agreeing on `(per, s, type)` | **320 / 320** |
| field sets | **identical** (17 keys, including `rsn`/`rsn2`) |

So the whole archive *was* re-derived after the extract's shape last changed,
and the indices did not move. That is real evidence and it belongs on the side
of "an index would have been fine so far."

### But nothing makes it true, and the file is young

`builders/extract.py` has nine commits. **Three of them changed the per-event
shape** (`43eb08f` clock/strength/blocker/giveaways, `3cafafb` vocabulary,
`2482306` the whistle reasons). All three *added fields*; none changed which
plays become events. The membership rule is one unguarded line — `events.append(ev)`
inside a loop over every play — and the file carries an explicit list of open
decisions right above it:

> *"still dropped, deliberately, pending a decision on what needs them: zoneCode,
> shotType, losingPlayerId, hitteePlayerId, running awaySOG/homeSOG…"*

Any future decision that *filters* — dropping `period-start`/`period-end`
markers, dropping `shootout-complete`, or admitting a play type we currently
skip — shifts every index in every game by a few positions. Silently. No error,
no 404, just a plausible-looking wrong moment. **That is the most expensive
failure available to us and we have already named it twice: a confident
explanation attached to a wrong number.**

### The league's amendments are unmeasured, and I will not pretend otherwise

`fetch_nhl.py` counts `amended` — games the league changed after we stored them
— and stores raw content-addressed *specifically* so an amendment cannot destroy
its predecessor. The machinery is there. **The measurement is not:**

| | |
|---|---|
| ingest runs in history | **15**, all between 2026-08-10 and 2026-08-14 |
| of those, during a season | **0** — `dataThrough` is 2026-06-14 |

The three archived seasons were **backfilled once, long after every game was
final**, which is the regime in which amendments are rarest. We have no basis
for a number, and any claim about amendment frequency would be invented. What we
can say is structural: an amendment re-fetches, re-derives and republishes that
game's extract, and if the amendment inserts or removes a play, that game's
indices move.

**Conclusion for §3.** The index has never moved, nothing prevents it from
moving, and the mechanism most likely to move it is a decision one of us makes
on an ordinary Tuesday.

---

## 4. How well does the game's own clock address a moment?

Measured over **88 published extracts, 27,705 events**, spread across all three
seasons (2023: 36, 2024: 28, 2025: 24). All 88 are in the catalog and
publishable; **85 regular season, 3 playoff** — thin on playoffs, and §10 says
what that costs. All 27,705 events carry `per` and `rem` — the period and the
**time remaining**, which is what the page already prints on the scoreboard
(`build_main.py:668`) and in the whistle panel (`P2 14:32`).

### Uniqueness

| pin | events sharing their key | |
|---|---|---|
| `(period, clock)` | **5,618** | 20.28% |
| `(period, clock, type)` | **220** | **0.79%** |
| `(period, clock, type, team)` | 149 | 0.54% |

21 of 88 games have no `(period, clock, type)` collision at all. The worst
single second holds **14 events**.

### Where the collisions live

| event type | n | ambiguous on `(per, clock, type)` | |
|---|---|---|---|
| faceoff | 4,851 | 0 | **0.00%** |
| takeaway | 959 | 0 | 0.00% |
| giveaway | 2,162 | 4 | 0.19% |
| blocked-shot | 2,846 | 8 | 0.28% |
| missed-shot | 2,505 | 11 | 0.44% |
| hit | 4,042 | 28 | 0.69% |
| **icing + offside** | **1,110** | **9** | **0.81%** |
| shot-on-goal | 4,523 | 61 | 1.35% |
| goal | 553 | 11 | 1.99% |
| stoppage (all) | 3,788 | 103 | 2.72% |
| **penalty** | **601** | **156** | **25.96%** |

The penalty number is not noise and it is not a defect: coincidental and
offsetting penalties are *recorded at the same second by the league* because
they are one incident. Landing on the first of them is arguably the right answer
rather than a wrong one.

### And the surprise, which changes the design

If a bare `at=<period>-<clock>` resolves to **the first event at that clock**,
does it land on the thing you meant?

| target | n | lands on it | |
|---|---|---|---|
| icing / offside | 1,110 | 1,106 | **99.6%** |
| shot-on-goal | 4,523 | 4,448 | 98.3% |
| goal | 553 | 534 | 96.6% |
| penalty | 601 | 455 | 75.7% |
| **faceoff** | **4,851** | **0** | **0.0%** |

**A faceoff is never the first event at its clock** — it always follows the
stoppage that caused it, recorded at the same second. So a bare clock can never
address a draw. This is exactly the sort of thing that would have shipped and
then been discovered by a reader, and it is why the rule needs an explicit
disambiguator rather than a "nearest event" heuristic that happens to work on
the cases I tested.

### The playoffs separately, because that is where the odd periods are

The sample above is 85 regular season to 3 playoff, and **a rate calibrated on
regular-season hockey is not validated by regular-season hockey.** Playoff
overtime is the only place periods 5 and 6 exist, and it is the case where the
period number alone means nothing. So: a second, independent sample of **79
playoff games (28,947 events, seeded random from the 251 publishable)**, then
the same games restricted to periods past regulation.

| | all playoff | playoff OT only |
|---|---|---|
| events | 28,947 | 1,211 |
| games past regulation | 14 of 79 (9 to P4, 5 to P5) | — |
| `(period, clock, type)` non-unique | **0.82%** | **0.50%** |
| most events in one second | 15 | 5 |
| faceoff — ambiguous / first-at-clock | 0.00% / **0.0%** | 0.00% / **0.0%** |
| shot-on-goal | 0.20% / 99.1% | 0.00% / 99.5% |
| goal | 0.00% / 99.8% | 0.00% / **100%** |
| icing + offside | 0.96% / 99.6% | 0.00% / **100%** |
| penalty | 32.1% / 69.5% | 33.3% / 66.7% |

**Playoff hockey behaves the same or slightly better, and overtime is the
cleanest ice in the archive** — sparser events, fewer collisions. The faceoff
result and the penalty result both reproduce exactly, which is the useful part:
they are properties of how the league records hockey, not artefacts of one
sample.

---

## 5. The three candidate pins

| | cost to build | cost to the archive | fails how |
|---|---|---|---|
| **A. array index** `at=17` | one line | none | **silently, wholesale** — every link in every game moves together, landing on a plausible wrong moment |
| **B. game clock** `at=2-14:32` | a ~15-line resolver | none — `per`/`rem` are already published on all 4,553 extracts | **locally and visibly** — off by one event *inside the same second*, same period, same clock on screen |
| **C. the feed's own `eventId`** | resolver + extract change | **a full re-derive of 4,553 games** | unknown — see below |

**C is the one that looks most rigorous and is the one I would refuse.** The
feed carries `eventId` (320 unique values in our reference game, non-monotonic)
and `sortOrder` (unique, monotonic). Neither is in our extract. Adopting either
means asserting *"the league's event identity is stable across an amendment"* —
and §3 established that **we have never observed an amendment**. That is a
borrowed guarantee: it would look durable in the code review and be unmeasured
in fact. It is the same error as inheriting somebody else's definition of "high
danger", one layer down.

### Recommendation: **B**, and here is the honest case against it

**For B:**

- It names a fact about the *game*, not a position in *our array*, so it
  survives any change to what the extract contains.
- **It is already on screen.** The page prints `P2` and `14:32`. A reader who
  follows a link can verify they arrived where the sentence said, without
  trusting us. That is the site's posture, applied to its own plumbing.
- It is human-authorable. Teaching copy is hand-written; `at=2-14:32` can be
  written and checked by eye, and `at=17` cannot.
- When it is wrong it is wrong *by one event inside one second*, and the reader
  sees the same clock they were promised.

**Against B, fairly:**

- It costs a resolver and a rule, where A costs nothing. If deep links only ever
  appear in copy *we* author, we could regenerate them ourselves whenever an
  index moved — the durability argument only bites for links a reader has
  shared. But making each concept *independently shareable* is the stated reason
  the seam exists, so that is the case that matters.
- `rem` is a feed-formatted string; the URL inherits its formatting.
- 0.79% of events need the disambiguator, and faceoffs always do.

### The proposed form

```
/game?game=2023020204&at=2-14:32&layer=whistle,corsi&strength=even
```

- **`at=<period>-<mm:ss>`**, clock = **time remaining**, the hockey convention
  and what the scoreboard shows. Period is the number: `4` is overtime, `5` may
  be a shootout or a third overtime — `periodLabel()` already knows which and
  `pt` is the only honest source (`layer.js::inShootout`).
- **`at=2-14:32+1`** selects the *second* event at that clock (0-based, omitted
  means 0). A generated "copy link to this moment" emits the ordinal only when
  it is not zero, so the common case stays readable and the rare case stays
  exact.
- **`layer=`** a comma list of stable tokens; empty/absent means none on.
- **`strength=even|all`**, defaulting to today's default.
- Resolution: *the nth event at exactly that period and clock; if no event
  exists at that clock, the last event before it.*

---

## 6. What must NOT happen: silent re-writing of the URL

The scrubber moves constantly during play. If the URL tracked it, we would push
a history entry per event and make the back button useless. **The link is an
entry point, not a mirror of state.** Read on load; write only when someone
explicitly asks for a link. That also keeps `history.replaceState` out of the
CSP conversation entirely.

## 7. Out of range degrades to a spoiler, not a blank rink

`set()` (`build_main.py:705`) is:

```js
function set(v,newest){i=Math.max(0,Math.min(EV.length-1,v));$('scrub').value=i;render(i,newest);}
```

It **clamps, silently**. So an `at=` past the end of the game does not blank the
rink — it renders the final event: final score, finished counters, and on a
shootout game the shootout notice. The page's own comment explains why that is
the worst available landing:

> *"Defaulting to the end kinda spoils the surprise" (Kevin) … the whole product
> is watching a count get MADE, and arriving at the made count is arriving after
> the thing you came for.*

So the hazard as written in `site-purpose.md` §6 is too kind to us. The rule
should be: **an unresolvable `at=` lands at the opening faceoff and says so,
in the same voice the shell already uses for a game that will not load**
(`say()` → `#gl`, *"This game could not be loaded — …"*). Something like *"That
moment isn't in this game — starting from the opening faceoff."* Three cases
need it, and they are different:

| input | what happens |
|---|---|
| `at=` malformed (`at=banana`) | start of game + word |
| clock valid, period not in this game (`at=4-03:00`, no OT) | start of game + word |
| clock in range but ordinal too high (`at=2-14:32+9`) | the last event at that clock, no word — we got the second right |

## 8. `layer=danger` would undo last week's rename

`danger.js` declares `id: 'danger'` and labels itself `＋ Shots from the slot`.
Two names for one thing is how drift starts, and the URL is the surface that
gets copied into other people's writing. Two options and I want it argued:

1. **Map at the seam** — a single token table, `slot ↔ danger`. Cheap, but
   deliberately keeps two names alive and puts the mapping somewhere it can be
   forgotten.
2. **Rename the module id to `slot`** — touches `danger.js`, the layer tests,
   and any provenance string that quotes the id. More work now, one name after.

I lean to 2, on the grounds that we removed the term because it *carried a
definition that was not ours*, and an id is not exempt from that just because it
is not rendered.

## 9. Tests — and how this one gets mechanized wrongly

The failure mode we have hit four times is **a check built from the
implementation's own model of its input, so it can only fail on cases the
implementation already handles.** Applied here, the tempting-and-useless test is:

> *build a URL from an event, resolve it, assert you get that event back.*

That is a round-trip through one function's own assumptions. It passes on a
resolver that only understands the events it generated the URL from, and it
would not have caught the faceoff result in §4 — because a generator would have
emitted the ordinal, and the bare-clock case would never have been exercised.

What should be tested instead:

1. **Resolution against real archived games, not fixtures.** Take published
   extracts and assert the *measured* rates in §4 hold — including that a bare
   clock never resolves to a faceoff. A test that encodes the surprise is worth
   more than one that encodes the intent.
2. **The index-drift property, stated and tested.** Insert and delete an event
   in a fixture and assert a clock-pinned link still resolves to the same event
   while an index-pinned one does not. This is the whole argument of §3, made
   into something that can fail.
3. **Three separate out-of-range assertions** (§7 table), each asserting *both*
   the landing position **and** the presence or absence of the word. Asserting
   the position alone passes on today's silent clamp.
4. **The parser as one function**, tested on the ugly inputs directly:
   duplicated params, `at=` with no game, `layer=` with an unknown token,
   `layer=` empty, mixed case, `strength=` garbage. Each must have a *stated*
   behaviour rather than a fallthrough.
5. **Mutations that must fire**: drop the ordinal from the resolver; make
   `strength=` a no-op; make out-of-range clamp instead of restart; swap
   remaining-time for elapsed. If any of those stays green, the test is
   decoration. **A mutation not seen to fire is not a mutation.**

## 10. What I want argued

1. **B over A** — is the durability worth a resolver, given that the index has
   demonstrably never moved? The strongest counter is that we author every deep
   link ourselves and can regenerate them, which makes §3 a hypothetical.
2. **The bare-clock rule.** `first event at that clock, ordinal to disambiguate`
   is my proposal; `last event at or before` and `require the type token` are
   both defensible and I have not measured them.
3. **`strength=` in the URL.** I argue it is mandatory because every counted
   claim is mode-relative. The counter-argument is that it makes a shared link
   carry a setting the sharer never consciously chose, and that the default
   should simply be trusted.
4. **The layer id rename** (§8), which is a cost-now-or-cost-later call.
5. **Anything addressable that I have ruled out** — trails, figure style, the
   work panel. `work=1` in particular would let a teaching sentence open the
   "show me the work" panel directly, which is arguably the most checkable
   surface on the site and the one I have excluded with the least thought.
6. **Whether the shootout should be addressable.** I expected this to be a
   hazard and it is not: `place()` returns `null` for shootout events and
   `drawNoPlace()` already states, on the ice, *"Shootout — a skills competition
   that decides the game, not play in it"* and *"Attempts are not drawn: the
   coordinates the feed records for them are not positions."* So `at=5-00:00`
   lands on an explained state rather than a blank one, and the existing
   `display:` provenance sentence does the work. The only open question is
   narrower than I thought: a period-5 clock is a shootout in the regular season
   and a third overtime in the playoffs, so **the resolver must read `pt`, never
   the period number** — the same rule `inShootout()` exists to enforce, now
   with a third caller.
