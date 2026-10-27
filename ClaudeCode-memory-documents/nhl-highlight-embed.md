---
name: nhl-highlight-embed
description: "SHIPPED 2026-09-08/09 — the league's own goal highlight, embedded on the goal frame. NHL terms PERMIT embedding non-commercially; the player is literally named \"NHL Embeddable Player\". ⛔ Opening it loads a full Google ad stack and a pre-roll — the static config says otherwise and LOOKING is what found it. Carries the coverage measurements, the CSP change, and why the tip jar moved."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-09T10:32:02.089Z
---

# The NHL highlight, embedded on the goal's own frame

**Kevin, 2026-09-08:** *"I think it adds enough value/entertainment (plus the
visitor doesn't leave our site) that it's worth the effort to integrate."*

## What the feed carries, measured before anything was built

Every goal play can carry `highlightClip` (a Brightcove asset id) and
`highlightClipSharingUrl` (a marketing slug ending in that same id).

| | |
|---|---|
| goals with a clip, 36 games / 3 seasons | **213 of 228 — 93.4%**, flat at 92/96/92% |
| **any other event type carrying one** | **zero**, in 11,613 plays |
| the archive after the backfill | **175 of 183 goals in a 30-game sample — 95.6%** |

⭐ **THE ID IS STORED, NEVER THE URL.** The slug's first half is editorial copy
(`min-buf-jokiharju-scores-goal-against-wild-…`); storing it would put the
league's wording inside our record and date it. Same rule as `penName`: *a feed
string is not a sentence.*

⛔ **`pptReplayUrl` IS THE ONE TO REMEMBER.** Every goal also carries a link to
NHL EDGE puck-and-player tracking sprites — `wsr.nhle.com/sprites/…/evNNN.json`.
It **403s** to a plain request and I did not try to route around it. If the league
ever opens it, **DOCTRINE §5 changes**: *"real skater coordinates aren't public,
so we don't fake them"* would stop being true, and K1 and K3 both become
answerable.

## ⭐⭐ Licensing: permitted, and I had this wrong first

[NHL Terms of Service](https://www.nhl.com/info/terms-of-service) **§7 has a
block about embedded content and permits it**: *"Any and all use of embedded NHL
Content must be for non-commercial purposes only and may be disabled by the NHL
at any time and for any reason or for no reason at all."* Prohibited: selling
access; using it *"for the purpose of gaining advertising, subscription, or other
revenue"*; a site that only aggregates clips; competing with or displacing their
services; sites requiring registration.

§8 forbids framing **nhl.com pages** — a different object from the player.

**Technically supported too:** `players.brightcove.net/6415718365001/D3UCGynRWU_default`
is titled **"NHL Embeddable Player [DO NOT DELETE]"**, has **no domain allowlist**
(the Playback API answers 200 for any origin) and **no `frame-ancestors`**.

⚠️ I told Kevin embedding was probably a licensing problem before reading the
terms. It is the opposite of a problem — they built a player for it.

## ⛔⛔ AND THE AD STACK, WHICH ONLY LOOKING FOUND

I reported **"no ad plugin (IMA) — not present"**, read off the player's static
configuration, whose plugin list genuinely contains only a GA tracker.

**In a real browser the IMA SDK loads at play time and a golf commercial runs.**
24 ad requests. **13 third-party hosts** — `imasdk.googleapis.com`,
`pubads.g.doubleclick.net`, `securepubads`, `pagead2.googlesyndication.com`,
`s0.2mdn.net`, `google-analytics`, `googletagmanager`, `onetrust`, and
Brightcove's five — on a site that otherwise ships **zero** third-party scripts.

⭐ **That is the whole design constraint.** Collapsed, the section costs a visitor
no request to anybody: the iframe is built on the first press and **torn down on
close**, which is also what stops the ad. The sentence names NHL.com and names the
advertisement **before** the press. *The CSP is not the mitigation; the collapse
is.*

## What shipped

- `extract.py` carries `clip`; `validate()` alarms on **dropping** one, never on
  the count — the league's video operation is not our business, our reading of it
  is ([[guard-where-the-archive-is]]).
- `frame-src` gains `https://players.brightcove.net`, **named not widened** — the
  site's only third-party origin. ⚠️ **Nothing guarded it**: deleting it breaks the
  feature completely and all 1,087 tests stayed green. `document.test.js` now
  derives the expected origin from `app.js` and refuses a wildcard.
- Three doors: the goal **mark**, the goal **label**, and a
  **`▶ Watch the NHL highlight`** line in the active-player row — which on a goal
  was deliberately blank, so it costs **zero layout** (measured: the row is 18px
  before and after, Play's top moves 0px at 390 and 1512).
- A `details.zone` section, the page's own idiom — **no new header CSS at all**.

## ⚠️ The tip jar, and Kevin caught me over-applying it

NHL §7 forbids embedded content used to gain *"other revenue"*. The footer's
*"buy me a coffee"* was the one sentence a careful person could point at with a
Brightcove player four blocks up the same page. **I removed it from all 14 pages;
only 2 can ever show a clip.** Kevin: *"I think it's fair and reasonable to have
the tip jar on the non-clip-capable pages."*

⭐ **The split is DERIVED, not a roster**: the caller that passes `tip=False` is
the same builder that emits `#clipbox`, and the test asks each **artifact** which
kind it is. Both directions, because *"a page with a player makes no ask"* is
satisfied by the tip jar vanishing everywhere — which was the mistake.

## The backfill

`extract.SCHEMA` + `game.ex` — see [[mechanize-the-review]]. The weekly
**`derive` workflow** is the backfill: it pulls the whole raw archive
(`--exclude 'extract/*'`) and rewrites all 4,490 extracts. ~20–30 min normally;
this one moved every file because every goal's bytes changed.

## 2026-10-01 — the recap is reachable from the summary, and the backfill is RULED OUT

Kevin: *"when the what this game was card is surfaced, we no longer have a window to
the game highlight page, we have to scroll down and click the (non-obvious) 'External
video clip' area."* Both halves were true. `#sumPanel` carries a button now, and the
section names what it holds — *"The league's recap of this game"* / *"The league's
highlight of this goal"* — instead of describing the hosting arrangement.

⛔ **A BUTTON, NEVER AN EMBED, and that is the whole bargain this feature shipped on.**
The iframe is built on open and torn down on close, so the thirteen third-party hosts
and the advertisement in front of the video are reached only by someone who pressed.
A player mounted in the panel would spend that on every finished game.

⛔⛔ **THE BACKFILL IS RULED OUT — do not propose it again without new information.**
Kevin, 2026-10-01: *"I hesitate to pull that much information from a free service the
NHL is providing."* ~4,600 requests against a league we do not pay. Games archived
before 2026-09-30 have no `right-rail` byte and keep no recap; the button simply does
not appear. New games accrue one from the nightly, which already fetches the feed.

