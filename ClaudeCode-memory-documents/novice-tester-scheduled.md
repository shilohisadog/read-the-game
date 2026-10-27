---
name: novice-tester-scheduled
description: "Kevin's wife reviews the site once presentable, ON HER PHONE while he uses a laptop — THE OBJECTIVE FUNCTION for every below-the-rink trade. ⭐⭐ 2026-09-08: FIVE OF THE SEVEN HOLDS WERE CLOSED BY KEVIN IN ONE MESSAGE (B1, B2, B7, C6 locked; B6 built) — **a hold is a claim about what evidence is needed, and it expires like any other reason.** Still gated: E1 (undecided, and a trap I walked into), E2 (the test must run the one-direction CONTROL), and the below-rink layout. 390×844 is an unverified proxy."
metadata:
  node_type: memory
  type: project
---

## ⛔ 2026-09-13 — SHE WILL BE REVIEWING LANDSCAPE, BECAUSE PORTRAIT IS OUT

Kevin used the site on his own phone first and ruled: *"I have decided portrait
isn't salvageable, there's no way that portrait will work for a novice, heck it
doesn't work for me and I know what it's trying to show."* The game page now asks
a phone held upright to rotate, and gives landscape the laptop's two columns.

**This changes what her session tests.** 390×844 is no longer the proxy — the
surface is **844×350 or so**, after browser chrome. *Does she understand what she
is watching* is still the question; *can she read it upright* has been answered
without her, by the person who already knows what the page is trying to show.

⚠️ **And the rotate prompt has its own thing to watch for:** whether she rotates,
or presses *Show it anyway* and gets the cramped page we decided was unusable.
That is a measurement only a session can make.

See [[mobile-landscape-ruling]].

## ⭐⭐ 2026-09-08 — FIVE OF THE SEVEN HOLDS WERE CLOSED BY KEVIN IN ONE MESSAGE

Asked what the novice test was actually gating, I listed seven items. He settled
five of them from the live site in a single reply:

| | his ruling |
|---|---|
| **B1 — ends** | *"leave it as is, teams change ends each period."* As-played, settled. |
| **B2 — the controls** | *"the controls are real good right now, they are locked in."* |
| **B7 — benches** | *"the ice is fine in its current view, locked in the way it is."* |
| **C6 — the offside diagram** | *"the offside diagram is good right now, locked in."* |
| **B6 — the penalty countdown** | reopened by his own observation and **BUILT the same day** |

⭐⭐ **FOUR OF THOSE NEEDED A DECISION, NOT A TESTER**, and the list had been
carrying them for weeks behind an event that has not happened. **A hold is a claim
about what evidence is needed, and it expires like any other reason** — the same
shape as every other expired reason this project has caught, applied to the
scheduling of work rather than to a fact.

**What genuinely remains gated:** **E1** (Kevin, 2026-09-08: *"that's something
we'll have to continue to discuss, I haven't decided which way I lean yet
either"*), **E2**, and the below-rink layout generally.

⚠️ **AND E1 IS ALSO A TRAP FOR ME, NOT ONLY FOR THE PRODUCT.** I recommended
building it without checking §E, which already records the decline — see
[[verify-inherited-claims]].


**Kevin, 2026-08-14:** *"I have a built in tester here at home, my wife is a
casual hockey fan and I'm going to ask her to review the site, once it's in
presentable shape."*

This changes how every design argument on this project should be written.
"**Nobody has watched a novice use this site**" has been the standing caveat on
every funnel claim — see [[mechanize-the-review]], where I once invented a fact
about user behaviour ("a layer nobody turns on") to argue *against* building
something. It is no longer a permanent unknown. It is a date.

**So the honest response is not to guess harder. It is to say which decisions
should not be guessed at all**, and `docs/site-purpose.md` §9 splits the work
accordingly:

**BUILD BEFORE THE TEST** — cheap, or justified independently of what she says:
- the five-second loop (an audience with no surface at all) — **done**
- the deep-link seam (a mechanism, useful whatever the copy turns out to be)
- naming the concepts (the absence was a measured fact, not an opinion)
- schedule storage (plumbing, invisible until it renders)

**HOLD FOR THE TEST** — where being wrong is expensive to undo:
- how much explanation a novice wants *before* pressing play
- whether the three-rate scale reads as insight or as homework
- whether "control" lands at all, or needs a different word
- whether the layer toggles are discoverable without being told they exist

**How to apply.** When a design question is really a question about a person,
check which list it belongs on before writing eight sections on a hunch. And when
the test happens, what it produces is EVIDENCE — the first this project will have
about its actual audience — so record what she did and where she stalled, not
what she said she liked.

One limit worth keeping (CHENG): traffic data would tell us where people land and
whether they leave. **It would not tell us whether the homepage is
novice-friendly.** No volume of referrers substitutes for watching one person use
it.

## ⭐ SHE IS ON A PHONE, AND THAT DECIDES EVERY LAYOUT TRADE

**Kevin, 2026-08-17:** *"I use a laptop but my wife will use her phone to view
the site. That said, we have to find a good balance between the two platforms."*

This is not a detail — it is the **objective function** for every below-the-rink
decision, and it had already caused a wrong call before he said it. The blocked
card's header layout was measured correctly at two viewports (inline 320px
desktop / 538 phone; stacked 341 / 516) and decided for the laptop, *because that
is the screen Kevin describes his own viewing from.* **The audience the site
exists for is on the smaller one.** See [[mechanize-the-review]] — the
measurement was right and the target was wrong, which is a failure class no
technique here can catch.

**How to apply.** Before measuring any layout trade, write down whose screen
wins. On this project the phone usually does, and "balance" means the laptop
should not be made *worse* — not that the two count equally. And **390×844 is a
proxy nobody has verified**: her actual device is unknown, and a 360px-wide phone
would change several calls already made. Worth asking before the next round of
below-the-rink work.

## Two items added to the hold list, 2026-08-20

**E1 — names on the pre-game frame.** Kevin, looking at the new empty pre-game
ice: *"doesn't our data tell us who is on the ice?"* It does — **6 per team at
s=0, 25 of 25 games**, by name and position. It does **not** tell us WHERE:
no skater has a coordinate at 20:00, `losingPlayerId` is dropped so the centre
opposite the draw-winner cannot be placed, and Rule 76 constrains the other eight
without determining them. **Figures refused on doctrine** — the first invented
figure makes every honest one unverifiable. **Names declined for now** because
twelve unfamiliar surnames are unusable by the reader we build for, and the value
pays off DURING play (which is C3). ⭐ **Filed here because it is the
objective-function trap:** a fan wants the starting units and can use them; she
has heard of none of them. If she asks *"who are these guys?"*, build it that
afternoon.

**E2 — the novice test must run the ONE-DIRECTION control, not only the
as-played default** (CHENG). The control's sentence carries all the load, because
nothing on screen shows the ends changing — and its weakness would be invisible
in a test of the default. See [[ends-switching-reopened]].
