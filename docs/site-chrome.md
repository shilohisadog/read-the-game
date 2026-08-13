# Site chrome, and the front page it makes possible

*For CHENG, before any code. §1 is a decision being reversed and the record of
who made it; §2–§3 are findings from the audit; §4 onward is the proposal. The
part I most want attacked is §6 — the homepage body — because it is the part with
the least evidence behind it.*

Kevin's brief, verbatim, so the scope is his and not mine:

> *"I don't think it's novice friendly, it doesn't really explain the purpose of
> the website, I think it needs to funnel viewers to either their favorite team or
> more of an 'explore what we offer' type of branch. We need to explain the
> metrics we articulate, why we articulate those metrics, what the data shows
> (which we currently have but the presentation isn't very interesting), we need a
> 'tip jar', it's lacking page navigation."*

And the instruction that set the architecture:

> *"if the team page(s) will be more of a landing page than the home page, then we
> should be uniform/consistent in how we redesign them so they look, feel and act
> the same way."*

---

## 1. This reverses a decision, and the decision was right when it was made

`docs/homepage.md` §2 is titled **"The argument I lost, and it changes the whole
page."** I argued for a curated hero game; Kevin overruled it:

> **Kevin, 2026-08-11:** *"I think the normal use case will be for a team fan to
> come to the site and load their team's last game and watch it."*
>
> **CC:** *"He is right, and my argument was answering a question nobody asked."*

§3.3 then states, in these words: **"One link, not a hero. […] This is a demotion
and it is deliberate."** And Kevin settled a second constraint: **"clean and
uncluttered, at google.com scale. Above the fold is one object and one link."**

**The page was built exactly to that spec.** Anything below that adds a hero, a
nav bar and a branch is reversing both calls, and this section exists so that
reversal has a written trail instead of evaporating.

**What changed is not that the reasoning was wrong — it is that the premise
resolved.** The team-fan use case is real, and the mechanism that serves it is
the one Kevin chose on purpose: **the URL is the state.** `/?team=BUF` is
shareable, stateless, bookmarkable. So a team fan needs the front page **once**.
After that they have a bookmark, and the front page never sees them again.

That inverts who the front page is for. Its only recurring audience is the person
who does *not* have a bookmark: the casual fan arriving cold. Kevin reached the
same conclusion independently, which is why this is a revision rather than a
re-litigation.

**Note also what is NOT reversed.** "Two clicks from cold to watching" survives
intact — see §7.2, where the audit shows the test measures clicks, not position.

---

## 2. The finding that matters more than the homepage

**`game.html` contains zero `href` attributes. Not one link on the entire page.**

The shareable unit is a game — that is settled, and it is *why* `game.html` is the
landing page. Which means the stranger who arrives from a shared link lands on a
**dead end**: no navigation, no "what is this site", no team grid, no about, no
tip jar, no route to anything else. They watch one game and leave.

Every item on Kevin's brief — funnel, navigation, explaining the metrics, the tip
jar — is **more** needed there than on the homepage, because that is where first
contact actually happens.

Neither reviewer raised this while both of us redesigned the other page.

## 3. There are two bodies, not four

`/?team=BUF` is **`index.html` filtered**, not a separate page (`homepage.md`
§3.2: *"the same page, filtered. No new page, no new build target."*). So:

| surface | file | who lands here | its job |
|---|---|---|---|
| `/` | `index.html` | casual fan, cold | come in, look around |
| `/?team=BUF` | `index.html` | returning fan's bookmark | their games, newest first |
| `/game?game=…` | `game.html` | stranger from a shared link | one game, then *what else is here?* |

Plus six frozen workshop prototypes. **Two real bodies. One chrome.**

## 4. The seam already exists, and it makes uniformity structural

`builders/page.py::document()` is the single document shell. All eight builders
call it, and `test/document.test.js` already asserts that no page in `src/`
bypassed it — that test exists because eight of nine pages once shipped with no
viewport tag.

**So the chrome goes in `document()`, and a page cannot lack it.** This is the
same move as `place()` this morning: not "remember to add the header to every
builder", but "the header is a property of being a page here". Two failures this
week came from a rule that had to be re-applied at each use site; this one cannot
be forgotten because there is nowhere to forget it.

**CSP is not a problem, and I checked rather than assumed.** `build_main.py`
computes `_csp(html)` over the **wrapped** document and substitutes it into a
placeholder afterwards, so chrome markup and chrome CSS added inside `document()`
are inside the hashed bytes. The constraint this imposes: **chrome CSS must be
inline in the shell, never a separate stylesheet** — an external file is exactly
what the CSP forbids.

## 5. What the chrome contains

**Header** — wordmark (→ `/`) · Watch a game · Teams · How it works · About

**Footer** — the NHL attribution and the no-marks statement, the source link, and
the route to About.

Putting the footer in the shell fixes a real gap as a side effect: the
attribution and no-marks statement are on `index.html`, `game.html` and
`read-the-game.html`, but **`goalie-eye-view.html` carries no no-marks statement
at all.** Nobody would have found that by looking; it falls out of centralising.

**The game page gets LESS chrome, deliberately.** It is the one surface whose
entire job is to watch something, and a full navigation bar on a replay theatre
is a worse product. Proposal: wordmark plus a single *"What is this?"* link in the
header, full footer below the rink. **This is the piece I am least sure of** — it
is the difference between converting a stranger and interrupting a viewer, and I
have no evidence either way.

## 6. The homepage body — the part with the least evidence

Proposed order:

```
chrome header
headline (unchanged — it is good)
one-sentence purpose
HERO: one real game, its numbers, ▶ play
the lesson: "Which number you count changes the answer"
  → the three rates underneath, as evidence
the branch: I have a team · I'm new · How this works
the team grid
other ways to see a game   (ex-"Workshop")
one line of limits → full page
chrome footer
```

**6.1 The hero game is chosen by the archive, never typed.** `archive.js` already
ranks games by level-control differential, so *"the sharpest example in the
archive"* is computed and deterministic. `homepage.md` §1 flags the current
literal as *"the same shape as the hard-coded date we just pulled out of
`game.html`"* — this is where that gets fixed.

**6.2 The three rates hide their own point.** The finding is not any one number;
it is that **54.5% sits on the other side of 50% from 39.6%.** Three equal rows
flatten that. Lead with the lesson, use the rates as evidence.

CHENG proposes three labelled points on a single 0–100 scale with 50% marked, and
distinguishes it from the cumulative-k curve we refused to plot: that was ~35
points where the eye invents a trend; three labelled points cannot interpolate. I
agree, and want it ruled on explicitly rather than assumed.

**6.3 We never state the payoff.** All three rates are published as *"lost"*,
which is right for comparability — and it means the site never once says that
**the team controlling play wins three times in five (60.4%).** Currently the
reader must do the subtraction. Proposal: rows stay "lost"; the lesson sentence
states 60.4% outright.

**6.4 Cut the four "does and does not claim" boxes to one line plus a link.**
They are the moat, but they are *proof*, not *pitch*, and they currently occupy
more vertical space than everything else combined. A stranger is reading our terms
and conditions before we have shown them the product. Full text moves to §8's new
page; nothing is deleted.

**6.5 The ARI/UTA line** (CHENG): *"Arizona became Utah in 2024. Both are here,
because both played."* A novice reads two Arizonas as a bug; one sentence turns it
into the site's posture. Note `homepage.md` already carries a bolded **THIRTY-THREE,
NOT THIRTY-TWO** — the grid is rendered from the catalog at runtime and cannot be
counted from source.

## 7. Constraints the audit turned up

**7.1 Mobile.** `deploy.yml` measures real pages in a same-origin iframe at an
imposed 360 CSS px and fails on horizontal overflow. **A nav bar is the single
most likely thing to break that gate**, which is the correct outcome — but it
means the header must be designed for 360px first, not adapted to it.

**7.2 "Two clicks from cold to watching" survives.** `test/homepage.test.js`
asserts the chip's `href` is `?team=BUF` and follows it — **it counts clicks via
hrefs, not vertical position.** Moving the grid below a hero does not break it.
Recorded because this project has twice lost coverage by rewriting a test rather
than reading it first.

**7.3 The workshop has a blocker neither reviewer priced.** Five of the six views
are frozen to the reference game. Promoting them from "Workshop" to *"Other ways
to see a game"* means either labelling that plainly on each card or doing real
work to make them multi-game. **Labelling is in scope here; multi-game is not.**

## 8. New pages

**How it works** — what we count, what we refuse to count, and why. Corsi in plain
language; why there is no expected-goals number; why a blocked shot belongs to the
shooter; why a hit is not counted. This is the doctrine made public, it is already
written across `docs/`, and CHENG ranks it above the team grid in value. It is
also the natural home for the copy table, including the **`display:` provenance
category** invented this morning for sentences that describe what *we* did to the
data rather than what happened in the game — and the normalization disclosure the
page still owes belongs there.

**About / Support** — who made this, why, what it costs to run, and the tip jar.

**On the tip jar.** A plain link out (GitHub Sponsors or similar), never an
embedded widget: this site's loudest claim is that it holds nothing and fetches
nothing while you watch, and a third-party payment script would contradict that in
the one place we are proudest. Below the value, never above it.

**One caution, flagged rather than settled.** CHENG grounds the placement in *"the
NHL's terms restrict use to non-commercial."* **I do not believe anyone here has
read those terms.** His recommendation is the conservative one either way, so it
costs nothing to follow — but that reason must not harden into a settled fact by
repetition, which is exactly how `88 of 214` propagated through four artifacts. If
money becomes real, somebody reads the actual terms first.

## 9. Tests that make it non-optional

1. **Every page in `src/` carries the chrome** — extends `test/document.test.js`,
   which already proves every page came through the shell. Mutation: a builder
   that hand-writes its own body must fail.
2. **Every link in the chrome resolves to a file that exists.** `index.html` today
   links to seven pages; nothing checks they are there.
3. **`game.html` is no longer a dead end** — asserted directly, since that is the
   finding this work exists to fix, and it is currently *zero* links.
4. **Two clicks from cold to watching still holds** (§7.2), unchanged.
5. **The hero game is read from the catalog, never typed** — the same assertion
   the team grid already carries.
6. **360px overflow**, in the browser step, where it can see a stylesheet.

Each mutation-proven before it is believed. All six of today's changes went green
on their first run, which is this project's cue to distrust them.

## 10. Not in scope

Season trends; "looking ahead"; making the workshop views multi-game; the
`?team=` view getting its own file (it will want one once it has its own content —
noted as a seam, not opened); the shootout base-rate question, which Kevin has
parked.

## 11. What I want argued

**§6 is the weakest part of this document.** The chrome argument is structural and
I am confident in it. The homepage body is a design opinion about people we have
never observed — **nobody has watched a novice use this site**, and every claim in
§6 about what a newcomer needs is a hypothesis wearing a layout.

Two specific asks:

- **§5's "less chrome on the game page"** — converting a stranger versus
  interrupting a viewer, and I have no evidence.
- **§6.2's three-points-on-a-scale** — I think CHENG's distinction from the
  cumulative curve holds, but the last time this project charted something it had
  written a rule against, the rule was right.

And the thing that would beat both reviewers' opinions: **do we have any
analytics?** Referrers and landing pages would settle in five minutes whether
people arrive at `/` or at `/game` — which is the question §2 and §6 are both
guessing at.
