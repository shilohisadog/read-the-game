# Restart frames — what the replay does at a whistle

**For CHENG's review. Nothing here is built.**

Kevin, 2026-08-30, after locking in the halved pace: *"now, how to handle the
faceoffs/restarts, that's the current question."*

It started as a wrong turn. He linked a moment in WSH @ TOR
(`?game=2025021245&at=1-17:30&layer=whistle`) and asked whether anything sat
between a shot on goal and the faceoff that followed it — his guess was that the
goaltender had frozen the puck. The feed says otherwise for that whistle, and he
withdrew the question himself. What survived the goose chase is the subject of
this document: **the replay renders the most common structural boundary in
hockey as nothing at all.**

---

## 1. Method, stated first

**60 games**, pulled live from `data.readthegame.co/extract/<id>.json` on
2026-08-30. Selection: every 74th viewable row of the published `catalog.json`
(4,490 viewable / 60), which is a **systematic spread across the archive, not a
random sample**. Seasons 2023, 2024 and 2025 are all represented. 3,341
faceoffs and 2,584 stoppages in total.

⚠️ **One extract failed to download on the first pass and succeeded on retry** —
the same throttling shape `derive.yml` was hardened against on 2026-08-30. An
earlier draft of this document was written at n=59 and every figure below has
been re-derived at n=60.

⚠️ **Local fixtures were deliberately not used.** Five of the eight extracts in
`test/fixtures/` predate the 2026-08-18 penalty/miss decision, and quoting rates
off them has already produced two wrong refusals on this project. Everything
below is from the live archive.

Two definitions are used throughout and they differ:

- **restart, by adjacency** — a faceoff whose immediately preceding event is a
  stoppage. **2,503** of them.
- **restart, by pairing** — a faceoff that `whistle.js` walks *forward* to from a
  stoppage or delayed penalty, stopping at a period boundary. **2,653** of them.
  This is the reducer's own rule and is the one that matters, because it is the
  rule any implementation would import.

---

## 2. What a restart is on screen today

| | measured |
|---|---|
| timeline events per game (`EV`, after `SKIP`) | **259.1** |
| faceoffs per game | **55.7 — 21.5% of the timeline** |
| restarts per game (pairing) | **44.2 — 17.1% of frames** |
| restarts sharing the exact clock with their whistle | **2,503 of 2,503 — 100%** |
| stoppage → its restart, recorded gap | **0 seconds, 2,581 of 2,581** |
| frames captioned today (goal or penalty) | **13.9 — 5.4%** |

And this is how it is drawn:

| where | what |
|---|---|
| `app.js:17` | `SKIP` drops `stoppage` from `EV` entirely — **the playhead never lands on one**, so no caption ever narrates one |
| `app.js:683` | `cls = goal ? 'goal' : ATT.has(type) ? 'att' : 'excl'` — a faceoff is `excl` |
| `app.css:407` | `.excl{fill:var(--muted);opacity:.2}` |
| `app.js:692` | **`r = 1`** for a faceoff, against 1.7 for an attempt and 3.2 for a goal |
| `app.css:1428` | the `.cur` opacity rescue exists **only inside the blocked layer** — it does not apply in the base view |
| `app.js:1276` | `captioned(e) = goal ‖ penalty ‖ (hdOn && isHD(e))` |
| `app.js:1277` | `dwell(e) = captioned(e) ? frameMs + 900 : frameMs` |

⭐ **So, in the base view a novice actually arrives in: one frame in five is a
radius-1 grey dot at 20% opacity, arriving with no pause and no pill, and the
clock does not move across it.** Play stopping — the thing hockey does 44 times a
night, and the moment a new viewer most needs to catch up — is rendered as the
faintest mark the page can draw.

The whistle *layer* handles this well and is not the subject. The base view is.

---

## 3. Two things already ruled out, verified rather than trusted

### 3.1 ⛔ The ice may not name the stoppage — and the finding reproduces

Removed 2026-08-27 (`app.js:1785`, CHENG's finding). The recorded reason: over 53
games the clause fired on 2,354 faceoffs and on **83** of them the ice named a
different whistle than the box, because more than one whistle can pair to one
dot — `ice "icing" box "referee-or-linesman"`.

**Re-derived here on an independent 60-game sample using the reducer's own
forward-walk: 84 of 2,653 restarts — 3.2%, against the recorded 3.5%.** Same
phenomenon, same order of magnitude; the claim holds.

⚠️ At n=59 this measurement returned **exactly 83** and an earlier draft reported
it as reproducing the recorded number precisely. It was a coincidence, and
stating it would have been a striking fact that was not one.

⚠️ An adjacency-only walk of mine gave **1.2%** and was wrong — a delayed penalty
pairs forward across intervening plays, which adjacency cannot see. The two
walks are not interchangeable and §1 names which is which for that reason.

**Consequence: the *reason* stays in the whistle layer. This document proposes
nothing that names one.**

### 3.2 ⛔ A whistle bonus constant is the tier ladder coming back

My first instinct in-thread was `WHISTLE_BONUS`, extending the frame before a
stoppage. That is wrong, and `docs/event-timing.md` §7.2 is why, in its own
words:

> The tiers encode **an editorial judgement about which events matter** — a goal
> is worth 4.6 ordinary plays. That is the one kind of judgement this site
> refuses everywhere else.

`app.js:1199` states the replacement rule: **"A frame lasts as long as what is on
it takes to read"**, quantized to two states because the page has two, both
*observable properties of the frame rather than a taxonomy someone chose*. And
`captioned()` is deliberately the single source both the schedule and the
renderer read — which is what made the old *"a fifth of the replay pauses for
nothing"* defect (§4 of that doc, 19.6% of frames) structurally impossible
rather than merely guarded.

A restart bonus reintroduces exactly the ranking that was deleted.

---

## 4. What is proposed

**The pause is not added. It is earned.** Do not invent a constant; make the
restart frame carry something, and the existing machinery pays it the 900 ms it
already pays a goal.

### 4.1 A restart becomes a captioned frame

`captioned()` learns one more state: a faceoff that a whistle paired to. The
dwell follows with no new number anywhere, and the schedule and the renderer
cannot disagree because they still read one predicate.

**The claim on the frame is the boundary, never the reason.** *Play stopped and
restarted here* — nothing about icing, offside or a covered puck. That is the
line that keeps §3.1 closed: **which** whistle is ambiguous on 84 dots, **that
there was one** is unambiguous on all 2,653.

⭐ **The pairing rule must be imported from `whistle.js`, never restated in
`app.js`.** Then the base view and the layer agree by construction rather than by
two rules that have to be kept in step — the same move as `place()` and
`captioned()` itself: remove the opportunity to disagree instead of adding a
check that has to agree.

### 4.2 The restart mark stops being excluded material

A restart draw leaves `.excl`. This is a scoped slice of the standing
20%-opacity question — not *un-dim everything*, only *the draw that restarts play
is not noise*. The U10 arrival vocabulary (`jolt` / `halt` / `snatch` / `slip`)
has no entry for a faceoff and a drop is the obvious fifth.

⚠️ **`.excl` exists to protect a hierarchy and this spends some of it.** Attempts
are the base view's subject; promoting 17.1% of frames competes with them. The
exact treatment is a pixels question and is not decided here.

### 4.3 Out of scope, named so it is not silently dropped

- **Line changes.** We hold `shifts` (694 records a game, reproducing `sit` at
  97%) so we know *who*, and we have never known *where* — `on-the-ice.html`
  already refuses to fake skater coordinates in its own banner. The honest
  version is names, there is still no shifts reducer in `src/lib/`, and that is
  **C3**. Doing it through the replay writes that reducer in the wrong place.
- **The stoppage reason in the base view.** §3.1.
- **The scoreboard/rink ratio on desktop** (Kevin, same session: too large on a
  laptop). `app.css:11` caps `.wrap` at `max-width:900px`, so above ~916px the
  layout stops responding entirely. Filed as **U12**, unmeasured, unrelated.

---

## 5. What it costs

| | today | proposed |
|---|---|---|
| captioned frames per game | 13.9 | **58.1** |
| share of frames captioned | 5.4% | **22.4%** |
| replay length | ~945 s | **~985 s (+4.2%)** |

The pace Kevin just locked in is untouched — `PACE` and `CAPTION_BONUS` keep
their values. Only *which frames earn the existing bonus* changes.

⚠️ **The density is the real risk and it cannot be settled from a terminal.**
More than one frame in five carrying a pill is either the punctuation the stream
is missing or it is the new noise, and this is the category `npm run gates` is
blind to.

⚠️ **And there is no honest subset.** Captioning only *some* restarts — the
interesting ones, the long ones, the ones in the offensive zone — is a chosen
tier, which is the thing §3.2 refuses. It is all 44 or none.

---

## 6. The one design question I cannot resolve on doctrine

**Where does the beat land?**

**(A) On the faceoff frame.** The caption is on that frame, so the reading time
goes there. The pause comes *after* the draw appears. Zero new mechanism, and it
is what §4.1 literally implies.

**(B) On the frame before.** In the arena the gap sits between the last play and
the drop — shot, then dead time, then the puck falls. This is the hockey-true
rhythm, and it is what Kevin described.

**They pull against each other.** (B) needs `dwell` to look ahead and lengthen a
frame because of what comes *next*, which contradicts *"a frame lasts as long as
what is ON IT takes to read"* — nothing would be on that frame to read. (A) obeys
the rule and gets the rhythm slightly wrong.

**Doctrine note:** (B) is *not* a foreknowledge spend. The standing rule always
permitted foreknowledge to **set the pace**; the 2026-08-28 spend was needed only
to let it **point at the ice**. So (B) is admissible — it just breaks a
different rule.

**Side-channel check on (B):** could a long hold announce something? It fires
before a *whistle*, and **382 of the 648 non-whistle faceoffs** in the sample
follow a **goal** with no stoppage between them — so **no beat fires before a
goal**, and its absence announces nothing. A viewer could learn "a long hold
means a whistle is coming", which is a stoppage, not a result. `drawBoxes`'
objection does not apply.

---

## 7. What I want ruled

1. **Is "play stopped and restarted here" genuinely a different claim from
   naming the whistle, or is it §3.1's clause wearing a smaller hat?** The
   disagreement you found was about *which* whistle. Does asserting *that there
   was one* survive the same test, or does it re-open the same seam?

2. **Is "is a restart" an observable property of the frame, or a taxonomy we
   chose?** I argue observable — a whistle pairs to the dot, recorded, no
   threshold. Attack that, because the whole §3.2 escape depends on it.

3. **22.4% of frames captioned — punctuation or noise?** And is my "no honest
   subset" argument right, or is there a principled cut I have not seen?

4. **(A) or (B) in §6?** My lean is (A), on the grounds that a rule we wrote to
   kill a real 19.6% defect should not be bent three weeks later for a rhythm
   argument. I hold that weakly.

5. **§4.2 — does promoting restarts out of `.excl` damage the hierarchy `.excl`
   exists to protect?** Is there a carrier better than the caption pill for
   "play stopped" — the scrub track, the boards, something that is not a fifth
   pill?

6. **What am I not seeing?** The honest summary of this document is that I found
   a real gap, then talked myself out of the two obvious fixes using our own
   record, and what is left is the third thing. That is a shape that has been
   wrong here before.

---

## 8. What needs no re-derivation

- **Restart reasons**, as a share of the 2,503 adjacency restarts:
  `goalie-stopped-after-sog` **35.2%**, `icing` 18.7%, `puck-in-netting` 12.7%,
  `offside` 9.3%, `puck-frozen` 5.0%, `puck-in-benches` 4.7%, `puck-in-crowd`
  4.6%, `tv-timeout` 3.6%, everything else under 2%.
- **Faceoffs that are not restarts**: 382 after a goal, 264 after a penalty, 190
  period openers, 2 after a hit.
- **Stoppages carry `rsn`, and `rsn2` on 17.9% of them**; **93% of those
  secondaries are an administrative break** (TV or team timeout) and 7% say what
  actually happened. `referee-or-linesman` is the outlier — 53 occurrences, 74%
  carrying a secondary — and its copy *"the puck struck an official"* asserts a
  specific event the feed does not record, on at least 28 of those 53. **Separate
  defect, separate fix, not this document.**
