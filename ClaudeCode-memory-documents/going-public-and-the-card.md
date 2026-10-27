---
name: going-public-and-the-card
description: "🚀 THE SITE IS PUBLIC — Kevin posted the first link to X on 2026-10-04, with a 14s screen capture. Until then every reader was Kevin; now a stranger can arrive cold, on a phone, from a timeline. ⭐⭐⭐ WRITING THE POST FOUND A REAL DEFECT: his sentence 'every number on screen opens to how it was worked out' was FALSE of the screen the link opens — twelve numbers, zero links — so he held the post and it was fixed first. ✅ The sharing card (`tools/card.mjs`) is our own rink drawn by `furniture()`, deliberately WITHOUT shot marks, stamped with its artwork's sha in a PNG tEXt chunk. ⚠️ MEASURED LANDING FACTS nobody had looked at: `&summary=1` opens the panel over HIDDEN ICE; phone portrait meets the rotate prompt with `Show it anyway` 236px down; `og:url` omits the parameter. ✅ BOTH CLOSED 2026-10-04 by Kevin: `&summary=1` IS the intended landing (*"that was the intent of the post"*), and the phone rendering is fine (*"as good as the site can look on mobile"*) — he read the real post on his own device."
metadata: 
  node_type: memory
  type: project
  modified: 2026-10-04T18:23:10.914Z
  originSessionId: ff173db5-1717-462d-b1d1-955659c28146
---

# The site went public on 2026-10-04

Kevin posted the first link to this site anywhere public, on X, with a 14-second
screen capture of the replay running:

> A real NHL game (Capitals at Lightning, 3 October 2026), replayed one event at
> a time. Every number on screen opens to how it was worked out.
> Nothing modelled, nothing invented.
> `https://readthegame.co/game?game=2026020024&summary=1`

**This changes the project's standing more than any build in it.** Every reader
before this evening was Kevin, who knows what everything is and arrives through
a terminal. See [[novice-tester-scheduled]] — the novice test was the planned way
to learn this, and the public post got there first.

## ⭐⭐⭐ WRITING THE POST WAS A TEST OF THE PRODUCT, AND THE PRODUCT FAILED IT

His sentence — *every number on screen opens to how it was worked out* — was
checked against the live page before he sent it. **It was false.** The summary
panel that link opens held **twelve numbers and zero links**, and both work doors
under the rink were `visibility: hidden`, because they sit in the layer row and
the default layer is `Just events`. A reader could have falsified it in ten
seconds, on a site whose whole pitch is CHECK OUR WORK.

He held the post; the doors were built; the sentence is now true and verified
live. The full shape is [[mechanize-the-review]] #67, and the rule it broke is
[[show-the-work-or-do-not-print-it]] — **declared "closed on every surface" on
2026-09-24, and re-opened twice since by new surfaces that did not carry a door.**

⭐⭐ **THE PRACTICE WORTH REPEATING: write the public sentence first, then go and
falsify it.** It found what 1,654 tests and ten probes did not, because they ask
"is this surface right" and the sentence asks "is the whole claim true of the
first thing anybody sees."

## ✅ The sharing card — `tools/card.mjs`, `src/card.png`

The page had **no image at all**; `twitter:card` was `summary`, a text-only box.

⛔ **THE REASON RECORDED FOR THAT HAD EXPIRED.** `builders/page.py` said *"no
og:image yet: we have no artwork we are allowed to ship, since club marks are off
the table by design."* The card is drawn by `furniture()` — the same function
that paints the ice on every replay — and carries no club mark, no logo, no
sweater colour. "A reason that expired without being re-examined" again; see
[[next-play-shading]].

⛔⛔ **IT DRAWS NO SHOTS, ON PURPOSE.** One image serves every link on the site
and sits beside a title naming ONE game, so any scatter of marks would be read as
that game's chart. Inventing positions would break the promise the card prints.
It is the empty sheet, the slot at the opacity the product uses, the wordmark,
and `Nothing modelled, nothing invented.`

⭐ **THE PNG CARRIES ITS OWN PROVENANCE** — the artwork's sha in a `tEXt` chunk —
so `--check` answers from the file alone, with no sidecar to keep in step. It is
**not** part of `npm run build` (a rasteriser is not byte-identical across
machines); `npm run card -- --check` is in `npm run gates`. CRC32 is hand-rolled:
this Node has no `zlib.crc32` and the repo takes no dependencies.

⚠️ **TWO OF ITS THREE DEFECTS WERE ONLY VISIBLE BY LOOKING AT THE PNG** — the
rink ran behind the footer type, and the ice carried blue-line bands the base ice
does not draw. See [[looking-at-pixels]].

## ⚠️ WHAT A STRANGER ACTUALLY MEETS — measured, because nobody had looked

None of these is a defect. All of them were assumptions until the post forced the
measurement.

| | |
|---|---|
| the unfurl | game-specific, built at build time — a crawler gets it with no JS |
| spoilers | none: the board reads `PRE-GAME · 0–0`, so "No result here." holds |
| `&summary=1` | opens the panel **over hidden ice** — numbers, not the replay |
| phone portrait | the rotate prompt; `Show it anyway` sits 236px down, and after one tap the first metric row is at y=410, above the fold |
| `og:url` | declares the canonical **without** `&summary=1` |

See [[mobile-landscape-ruling]] — the portrait ruling was made for a reader who
chose to come. It has never been weighed against a reader arriving cold from a
timeline, and that is now the population.

## ✅ RULED 2026-10-04 (evening) — BOTH LANDING QUESTIONS ARE CLOSED

**`&summary=1` IS THE INTENDED LANDING.** Kevin: *"for that X post, I wanted to
show the summary page first, since that was the intent of the post."* The post is
ABOUT the numbers and the doors under them, so landing on the replay would have
been landing somewhere other than what the words promise. ⭐ **The mismatch I
raised was between the VIDEO and the link; Kevin's intent was the POST and the
link, and those agree.** Not a defect, and not to be re-proposed.

**AND THE PHONE IS FINE.** Kevin checked the post on his own phone: *"it looked
pretty good (as good as the site can look on mobile), so we're ok there."* That
is a reading of the REAL artefact in the REAL place, which outranks my measured
`236px` worry — see [[mobile-landscape-ruling]], whose ruling therefore stands
unchanged for a timeline audience too.

## 〰️ THE ORIGINAL QUESTION, FOR THE RECORD — now answered

**Is `&summary=1` the right landing for a cold visitor?** The post's words and
the video both promise the replay; the link opens a card of numbers with the rink
hidden behind it. Dropping the parameter lands them on the ice with `▶ Press
Play`. Kevin chose the parameter deliberately when it was built — *"a discrete
link to social media at that state of the site"* — so this is a product question,
not a defect.

## ✅ 2026-10-13 — the card DOES unfurl on X (first time it was ever tested)

Kevin pasted `/preview?game=…` with no media; X's composer showed no card at
first, then showed it. Every check from our side was clean (tags server-side
via `functions/_middleware.js`, Twitterbot UA 200 in 0.3s, card.png 1200x630).
⚠️ **X's card can lag the paste — wait or re-paste before hunting for a defect.**
The only anomaly found, `/robots.txt` answering with the home page's HTML, was
fixed (`c07f355`, real allow-all file); whether it mattered is unknown. The
10-04 post carried a video, and X shows no card on a post with media.

## 2026-10-14 — a preview-page post, and what landed

Kevin posted MTL at WSH with the preview link; the post I wrote is 280 X
characters exactly (a link counts 23; a "•" counts 2, so hyphens). It used three
figures read off the live page, "six games in" as the honest frame, "every chart"
not "every number" (the records line has no door), and the two teams' own
hashtags. Result: 26 views, 1 comment, 1 like — a lot for his account. ⭐ The
pattern for future posts: the preview page, a few verified figures, no forecast.

## ⭐ 2026-10-15 — the second post (MTL at WSH REPLAY) and two X lessons

- **X caches a card IMAGE by its URL.** The card was redrawn 10-13 but posts still
  showed the empty rink: the address `card.png` never changed. Fixed: `page.py`
  `CARD_URL = card.png?v=<sha256[:10]>`, test in `test/card.test.js`. X ALSO caches
  per posted link: append `&src=x` (ignored by the page, still 23 chars) for a fresh
  unfurl. Kevin: "it worked".
- **The post that shipped** (279 chars): hook first for non-followers ("A hockey
  replay that explains itself, inventing nothing."), "written notes like a color
  analyst" (Kevin: bare "color commentary" over-promises a voice), a VERBATIM quote
  of the page's note, the plain replay link (NOT the share button's — it stamps an
  edition older than same-day deploys), #GoHabsGo #ALLCAPS. Kevin catches
  non-verbatim quotes and over-promises; count with links = 23.
