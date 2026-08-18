# The learn page as doors — every claim becomes a link into a real game

**Kevin, standing direction:**

> *"The Workshop page is how I want the What you can see page to become. Click a
> card and you get game examples and explanation for each card."*

Everything below is **measured against the shipped page and the reference game**,
and every URL in it was produced by the real formatter and parsed back by the
real parser. Nothing here is typed by hand — that is the whole point.

---

## 1. The defect, stated exactly

`what-you-can-see.html` lists eight things and ends with this sentence:

> *"Every one of them is a toggle on a real game, and every one shows the events
> it counted and the events it did not."*

**The page contains zero links to any game.** Every `href` on it is chrome:

| href | count |
|---|---|
| `/` | 2 |
| `/workshop.html`, `/what-you-can-see.html`, `/#teams` | 1 each |
| `mailto:`, github, buymeacoffee | 1 each |

So the page makes a promise about a thing a reader cannot reach from it. This is
not a missing feature; **it is a sentence that is false on the production site**,
and it has been since the content moved off the home page.

## 2. All eight are in one game, and that is measured

The eight items are two groups kept deliberately apart — the league's rules, and
our own measurements. Every one occurs in `data/rich.json` (**game 2023020204,
MIN @ BUF, 2023-11-10**, published, `v: 1` in the live catalog):

| the page says | in the reference game |
|---|---|
| Icing | **8** |
| Offside | **1** |
| Faceoffs | **55** |
| Penalties | 8, plus **4 delayed** |
| The empty net | **20 events** at `sit=0651` |
| Control | **135** counted attempts |
| Shots from the slot | **44** counted |
| Goaltending | **60** counted |

**No card has to be invented or omitted.** That was not a given — the page could
easily have promised something this game does not contain, and the offside
(exactly one) shows how close it came.

## 3. ⭐ The doors, generated and round-tripped

Produced by `deeplink.format()` and parsed back by `deeplink.parse()` — **all
five checked round-trip exactly, ordinal included**:

| card | moment | link |
|---|---|---|
| Icing | P1 15:02 stoppage | `?game=2023020204&at=1-15:02.1&layer=whistle&strength=all` |
| Faceoffs | P1 15:02 faceoff | `?game=2023020204&at=1-15:02.2&layer=whistle&strength=all` |
| Offside | P1 04:48 stoppage | `?game=2023020204&at=1-04:48.1&layer=whistle&strength=all` |
| Penalties | P1 19:39 delayed-penalty | `?game=2023020204&at=1-19:39&layer=whistle&strength=all` |
| The empty net | P3 01:40, goalie pulled | `?game=2023020204&at=3-01:40&layer=goaltending&strength=all` |
| Control | P1 18:40 shot on goal | `?game=2023020204&at=1-18:40.1&layer=corsi&strength=all` |
| Shots from the slot | P1 16:03, x=83 y=−11 | `?game=2023020204&at=1-16:03&layer=slot&strength=all` |
| Goaltending | P1 18:40 shot on goal | `?game=2023020204&at=1-18:40.1&layer=goaltending&strength=all` |

**⭐ The icing and its faceoff are the same clock, separated only by the
ordinal** — `.1` is the whistle, `.2` is the restart. The URL itself carries the
lesson the card is trying to teach: the punishment for icing is *where play
resumes*, and it resumes at that same instant. Nothing was arranged to make that
true; it fell out of asking the formatter for two adjacent events.

### 3.1 The rule that picks each moment, because "first" was not good enough

A first attempt used *"the first event of the right type"*. It put **three cards
on the identical event** — Control, Slot and Goaltending all landed on `1-18:40`,
the first shot on goal — which is both a template smell and, for the slot card,
simply wrong: that shot was at **x=29**, a point shot the slot layer does not
count.

**The rule that works is to ask the layer what it counts:**

- **A measurement card's door is the first event that layer's own reducer puts in
  `counted`.** The slot card moved to `x=83, y=−11`, a shot that is in the slot,
  because the danger layer says so. This is the same derivation the hero already
  uses to find where its loop should start.
- **A rules card's door is the first event carrying that reason in the feed** —
  `rsn === 'icing'`, `type === 'delayed-penalty'`, a `sit` code with a pulled
  goalie. Read, not decided.

Corsi and goaltending still share `1-18:40`, and that is left alone: **the first
attempt of the game and the first shot the goalie faced are genuinely the same
event.** Forcing them apart would be arranging the evidence.

## 4. The language boundary, and why a node step is the honest answer

`deeplink.format()` is **JavaScript**; `build_index.py` is **Python**. Restating
the URL rules in Python — the `rem` clock, the ordinal that only appears when a
moment is ambiguous, the layer vocabulary derived from the layer ids — is a
second implementation of a shared rule in a second language. **That is exactly
what `builders/measure.mjs` exists to prevent**, and its header is written about
this case.

**Proposal:**

```
  builders/learn-doors.mjs   reads data/rich.json, calls the real reducers and
                             deeplink.format(), writes data/learn-doors.json
  build_index.py             reads that JSON and renders the cards
```

The JSON is **committed**, so `npm run build:check` catches drift the moment the
layers or the formatter change and the doors are not regenerated — the same guard
that already keeps `src/*.html` honest.

### 4.1 A type seam that will bite the tests

**`parse()` returns `game` as a string; the extract carries `game.id` as a
number.** Both are correct in their own context and `===` across them is false. I
wrote that bug into my own verification harness within five minutes of touching
the seam, which is reasonable evidence that a test comparing them will too. It
should be coerced explicitly and stated where it is coerced.

## 5. One game or many — the tension, honestly

**For one game:** learning to read hockey means watching *one* game closely.
Eight cards into eight different games is eight cold starts. The page's own copy
already says *"a real game"*, singular. And a build-time example from a file on
disk is verifiable at build time, which an archive-wide pick is not.

**Against one game:** the site holds **4,417 published games** and the front door
already struggles to say so. Eight cards all leading to one November night makes
a large archive look like a demo — and **discovery is already this project's
biggest open gap.**

**My recommendation is one game for the doors, because the alternative buys
variety with a build-time guarantee** — but this is a product call and the
counter-argument is not weak.

## 6. What can break, and the gate that cannot exist

- **The reference game could stop publishing.** A re-judge that refuses it would
  break all eight links at once. `build_B.py` and `build_rules.py` already carry
  this exposure; adding eight production links raises the cost. **A cheap live
  gate is available**: assert `2023020204` is `v: 1` in the published catalog.
- **Link-checking by HTTP status is useless here.** Unknown URLs return **200
  with the home page** — the soft 404 already recorded. So a checker that fetches
  a door and sees 200 has learned nothing. **The check has to be that the game id
  is published and the moment exists in the extract**, both of which are
  answerable offline against `data/rich.json`.

## 7. Verification this will need

- **A test that every card's href parses** — through the real `parse()`, with
  `problems` empty. A door that does not parse is a card that opens onto an error.
- **A test that each measurement card's moment is in that layer's `counted`**,
  driven by the reducer rather than a literal index. A mutation moving a card to
  an uncounted event must fail, or the rule in §3.1 is decoration.
- **A test that the icing card and the faceoff card share a clock and differ by
  ordinal** — that is the one relationship on the page, and a test that pins two
  separate literals cannot see it.
- **A test that the promise sentence and the card count agree**, since prose that
  refers to another element by count has a dependency nothing in a text file can
  see, and this page already broke exactly that way.
- **Look at it.** `tools/pixels.sh`, both widths — 390×844 first, because the
  novice tester is on a phone and eight cards is a scroll.

## 8. What I want ruled

1. **One game, or spread across the archive?** §5. I recommend one; the
   discovery argument against it is real.
2. **Is `whistle` the right layer for all four rules cards?** It names icing and
   offside; it is less obviously the right lens for a delayed penalty or an
   empty net, and the empty-net card is currently pointed at `goaltending`.
3. **Do the cards keep the two-group split** — the league's rules vs our
   measurements? It is the page's best idea and a card grid may blur it.
4. **Does this page also become the home for the blocked-shots lesson?**
   `docs/one-measure.md` §8 parked it here — *a box score counts shots on goal,
   and 51.9% of attempts never reach the goalie* — and it is a ninth card in a
   page that is being rebuilt as cards.
