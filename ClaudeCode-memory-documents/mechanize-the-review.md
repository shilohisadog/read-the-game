---
name: mechanize-the-review
description: "⭐⭐⭐ THE MOST VALUABLE FILE HERE — ~100 numbered shapes, newest first. THE dominant failure mode: **a check that tests a narrower claim than it announces.** ⚠️ Read the TOP of the body and stop; the rest is case law. NEWEST (#82, 2026-10-07): **A CADENCE IS A SECOND SURFACE** — asked to refresh a document nightly, I found the nightly job ALREADY COMPUTED IT and published only two of three; **check whether the thing is already being made and thrown away.** Then the card's *"refreshed weekly"* went false the same hour, and sweeping the class found SIX more comments wrong for four days — the costliest ARGUED FROM the stale cadence, out by a factor of seven while its conclusion stayed correct. ⚠️ And when a gate becomes inconvenient, SHARPEN it: forbid the whole tree and the extracts by name rather than deleting the guard. (#81b): **A PROBE THAT READS TOO EARLY REPORTS A DEFECT THAT IS ITS OWN** — `naturalWidth 0x0` on images that were HTTP 200; it returned as soon as the `<img>` existed. *Not loaded yet* and *never loaded* are different answers. (#81, 2026-10-07): **I CHECKED IN ONE ENVIRONMENT AND SHIPPED TO ANOTHER** — a test imported Pillow at module scope, green on this laptop and `ModuleNotFoundError` on the gates runner, over a dependency none of its claims needed. **Ask what the test is a test OF and cut what the claim does not need.** ⛔ And **A SKIP IS NOT A PASS**: the two tests that did need it would have vanished from a green run. ⭐ My own check of that skip blocked PIL with `find_module`, removed in 3.12, so it blocked nothing — **a negative control that cannot fire reads exactly like a passing one.** (#80): **A MISSING THING THAT ANSWERS 200** — the league's CDN answers a player it never photographed with 302 to a default silhouette that then answers 200, so `curl -L` downloads a stranger and a status check calls it a headshot. 222 of 228 players have one and SIX DO NOT, all established men the league has not re-shot in a new sweater. **Ask what a service does when the thing is ABSENT, and tell absence from presence by CONTENT, not status.** (#79, 2026-10-07): **MY OWN MEMORY INDEX WAS OVER ITS SIZE LIMIT AND SEVEN LINES SILENTLY DID NOT LOAD** — MEMORY.md was 26.7KB against 24.4KB, so Kevin's last seven standing preferences were invisible every session. #68 said the index is the load-bearing surface; it is also the one with a BUDGET, and exceeding it fails quietly in the direction of looking fine. (#78): **A LABEL IS NOT ALWAYS THE FIX, AND TWO INDIVIDUALLY-CORRECT SURFACES CAN BE FALSE TOGETHER** — the front door's heading earned the word *Tonight* against the reader's calendar and each fixture row rendered its own start correctly, and under TZ=UTC they read *Tonight · 3 games* over *2:00 AM*, which is tomorrow. Adding a timezone label leaves that intact. **Ask what two correct statements say WHEN READ TOGETHER.** (#77): **A STEP THAT WRITES TO TWO PLACES HAS A FAILURE WINDOW BETWEEN THEM** — one step publishes to R2 then commits to git; it died in between, origin and repo stayed apart, and `npm run gates` was green because nothing in gates reads the origin. ⭐ And **A DATE STAMP IS NOT A VINTAGE**: both copies declared the same `dataThrough` and 35 figures differed, so the fix I had proposed (label the vintage) would have changed nothing. (#76): **A GATE CALLED ONE LINE TOO LATE CANNOT ANSWER** — the freshness check ran immediately AFTER the `cp` that overwrote the file it was checking, so it compared a copy against its own source and printed *everything matches* over a six-figure drift. **Ask what a check's INPUT is at the moment it runs, not what it compares.** ⚠️ And its sibling: a check that cannot fetch must not report a pass — exit a distinct code and say the question went unanswered. (#75): **A DOCUMENT CAN BE BUILT, COMMITTED TO NOTHING, AND 404 FOR EVERY READER** — `players.json` written, suite green, derive SUCCESS, upload step a typed `for f in …` list. **Four times now the pipeline has reported success over something that never reached a reader** — name the artifact the change was for and GO AND FETCH IT. (#74): **A RULE CORRECT FOR EVERY CASE THAT EXISTED WHEN IT WAS WRITTEN** — four in one day. **The tell is a rule with no subject in it** (all doors, all figures, all values). (#73): **AN ASSERTION CAN PASS FOR THE WRONG REASON AND ONLY DELETING SOMETHING ELSE SHOWS IT** — a whole-page regex in a test named for one part. (#72): **`git checkout <file>` DESTROYED UNCOMMITTED WORK AGAIN**, and `checkout … || cp backup` is WORSE — the fallback runs only when the destruction fails. **Make the `cp` first.** (#71): **I QUOTED THE SENSITIVITY BAND AND OMITTED THE THRESHOLD**, and the band straddled the decision. (#70): **A STRING IN A LOG IS NOT A THING THAT HAPPENED** — a run log carries the SHELL SOURCE of every step. **Ask what would make this condition FALSE and find a run where it was.** (#69): **AN `OR` OVER BOTH POSSIBLE ANSWERS IS SATISFIED BY ALWAYS GIVING ONE** — a disjunction is not a claim; say which ROW gets WHICH. (#68): **THE INDEX IS A SECOND SURFACE AND IT IS THE LOAD-BEARING ONE** — a correction is not finished until the pointer is re-read. (#67): **THE SENTENCE YOU ARE ABOUT TO PUBLISH IS A TEST OF THE PRODUCT**, and a rule declared CLOSED is closed as of a DATE, not forever. (#65–#66): **A FIX APPLIED TO THE THING AND NOT TO THE KEY THAT DESCRIBES IT**; **one constant written twice in two unit contexts is two constants**. (#55–#64): **I CHECKED A PROPERTY THAT WAS TRUE AND REPORTED ONE THAT WAS NOT** (display is not visibility); **ask what the real device sends, not what your driver sends**; **a flaky canary is worse than no canary**; **the committed document is not the published one, for one night**. (#44–#54): **I FIXED THE RENDERING TWICE BEFORE QUESTIONING THE ENCODING**; a ruling's premise can be MINE and false; **a mutation is not evidence until it lands WHERE THE CHECK IS LOOKING.**"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-10-07T18:30:00.000Z
---

## #100–103 — 2026-10-21 → 26, the tracked goal and challenges

- **#100 A MATCH SCORED BY THE DISTANCE IT MINIMISED.** "The shot moment = the tracked frame nearest the
  recorded spot" was validated by "median 1.2 ft from the recorded spot" — a number the rule CHOOSES to be small.
  On Panarin it picked a frame 0.7 s early (mid-carry; the real release was 8 ft from the league's spot). Fix:
  define the event by a SECOND property the selection does not optimise (puck speed: carry → faster than a
  skater) and report agreement on that. Shape: never validate a selection with the quantity it selects on.
- **#101 A TEST WRITTEN FROM THE CODE'S CURRENT BEHAVIOUR.** The Goals-mode Prev/Next test's comment said
  "goal line → the next goal's first frame" — it DOCUMENTED the bug (the goal frame unreachable by Next). Write
  the walk from what a viewer expects, then run it against the old code and watch it fail.
- **#102 THE HARNESS READS THE BUILT PAGE.** `test/helpers/page.js` loads `src/read-the-game.html`, which inlines
  app.js: an app.js edit is invisible to page tests until `python3 builders/build_main.py`. A debug print that
  never appears means "not built", not "not called".
- **#103 A RE-SWEEP THAT MISSED A FIELD.** The first challenge sweep read only `rsn`; 101 challenges sit in `rsn2`
  behind "referee-or-linesman". Caught only because the archive count disagreed with an earlier per-season
  count (15 vs 18). When two counts of the same thing differ, find the difference before going on.
  Also this stretch: a new inline helper `commas` collided with an existing name (#85–90 shape); the derive
  drift check fired on league amendments (refresh committed measures from published — `measures-list`).

## #96–99 — 2026-10-21, four in one day

- **#96 A PROBE THAT READ TEXT, ON A PAGE SHOWING AN ERROR SCREEN.** The lab's Goals-mode probe logged healthy
  DOM values (scrub, clock, line) while the shell had replaced the page with "This game could not be loaded"
  (`EV[-1].per` at pre-game). The text was still in the hidden DOM. Fix: screenshot as well, and add an
  `err` field reading the visible body. Shape: verifying an attribute is not verifying what is SEEN.
- **#97 WATCHING "THE LATEST RUN" INSTEAD OF THIS COMMIT'S RUN.** GitHub did not start the push-triggered
  lab run (twice today, and main runs lagged ~2 min); `gh run list --limit 1` returned an older run, it
  was already green, and I reported "deployed". Fix: `gh run list --commit <sha>`, dispatch if absent,
  then curl the served file for a marker of the change.
- **#98 A GATE THAT LIVES ONLY IN THE DEPLOY.** The no-network-page grep (`fetch\(`, case-insensitive)
  is in deploy.yml `verify`, not `npm run gates`, so local gates passed and the deploy refused a helper
  NAMED `trkFetch(`. Fix taken: rename, not loosen. Open: move that grep into gates.
- **#99 A REGEX GUARD MET A LEGITIMATE READ.** `clock.test.js` forbids any `e.clock` (elapsed) in the page;
  the tracked goal must read it once to match goals.json. Fix: exempt the ONE exact expression and keep
  the rest forbidden — never rename the field access to slip past the regex.

## #91–95 — 2026-10-15, five in one day

- **#91 A REVIEW THAT ASKED ABOUT A MOMENT, NEVER ABOUT TIME.** The data-model review
  (three passes: duplicates, correctness, efficiency) never asked what happens to a
  document over time — every published doc is overwritten nightly, so a shared link
  drifted. Kevin: "shouldn't our data model discussion have surfaced these issues?"
  Yes. Ask LIFETIME as a pass of its own.
- **#92 A CLASS NAME IN A SHARED STYLESHEET INHERITS ANOTHER COMPONENT.** Toggling
  `zone` on the play line pulled in the layer panels' `.zone` styles (left-aligned,
  bordered, ▼). Kevin saw it live; tests had none. Now a test that no other rule can
  reach the line through its state classes. Same family as the bundle's one-scope
  name collisions (`zoneOf`, `tally`, `where`, `attempts`, `span`, `each` all hit
  today — grep `(function|const|let|var) NAME` across src/ before naming).
- **#93 A FIXED ADDRESS FOR CHANGING CONTENT.** X cached `card.png` by URL; the new
  picture never reached a post. Content-hash the URL.
- **#94 A FAKE THAT TYPED THE PAGE'S BUTTONS.** `test/helpers/page.js` hard-coded the
  trails buttons `['off','all']`; renaming one broke tests for the wrong reason.
  Now read from the built page.
- **#95 A CHECKER'S GLOB AGAIN (repeat of the tools/*.mjs gap).** refcheck never
  globbed `functions/`, so a real citation read "no such file". Widened the glob,
  never deleted the citation.
- Also: a sentence pairing a RULE with DATA can contradict itself ("may not change
  … 0 seconds into their shift") — when the data shows the exception, drop the
  number, keep the rule.

## #89 — MY PUSH RACED THE NIGHTLY, AND A `;` PUSHED PAST A RED GATE

2026-10-13. (1) A scheduled nightly published measures.json and then lost its
`git push` to a commit of mine landing on main in between: bucket ahead of repo,
next deploy refused (the #77 two-writes window, opened by a RACE, not a crash).
Fixed in ingest.yml: the refresh is a function that, on a rejected push, resets
to the newest main, rebuilds, re-gates and pushes again (x3) — not a rebase,
because both sides regenerate src/ and would conflict. ⚠️ `set -e` is OFF
inside a function called from `||`, so every command there needs `|| return 1`.
(2) I wrote `gates > log; ...; git push` with `;` and pushed a red tree. **Gate
and push in one `&&` chain, always** (`gates && { commit && push; } || report`).
(3) An UNQUOTED heredoc (`<<EOF`) carrying markdown ran every `backticked` name
as a shell command and blanked it from a doc, and the gates passed. **Prose goes
through a quoted heredoc (`<<'EOF'`) or a script file, never `<<EOF`.**

## #88 — A NEW NAME IN A SHARED SCOPE SILENTLY REPLACES AN OLD ONE

2026-10-13, item 4. The page scripts are one big closure each, and twice in an
hour a name I added shadowed one already there: a `held` parameter under
`drawMonth`'s own `var held = 0` count (`held.forEach is not a function`), and a
`rowsOf` helper that REPLACED the calendar's `rowsOf` row-renderer (`appendChild([])`).
Neither failed at parse time; both only failed when a test walked the DOM.
**Before adding a name to an inline page script, grep the page for it.**
Same day, #86 again: `test/browser-checks.test.js` wrote a typed copy of the game
page's `pick()` as its fixture, so it kept passing after the page stopped having
`pick()`; the release gate caught it. Drive tools with the BUILT page.

## #87 — A FIX TO ONE SURFACE IS NOT A FIX TO THE CLASS

2026-10-12. The front door's "What we count" cards opened a replay under a line
promising "the lesson behind it" — the SAME defect fixed on the preview card on
2026-10-04, through the same shared href rule. Kevin: *"I thought we fixed the
card-->replay issue once before?"* ⭐ **When a shared rule is wrong in one
caller, grep every caller of it before calling the defect fixed.**

## #86 — A FIXTURE TYPED FROM THE ASSUMPTION CANNOT TEST THE ASSUMPTION

2026-10-12, twice. (a) My boxscore-witness test "a goaltender is summed" gave the
goalie row a `hits` field; real goalie rows have none, and reading the absent
key as zero flagged 89 games — caught only by running over the ARCHIVE. (b) Two
home-page tests pinned a sentence from `refusedInWindow: 1`, a value the pipeline
never produced. ⭐ **A value typed into a fixture must be one the real writer can
produce; measure over the archive before publishing.**

## #85 — A TEXT CHECK THAT PASSES ON COMMENTS

2026-10-12. Stripping comments from the built pages turned two long-green tests
red: one found "All credited to the shooter." only in a COMMENT saying the old
panel used to say it; one found `@keyframes` on the lessons page only in prose.
⭐ **A presence check over shipped source must strip comments first, or prose
about the thing satisfies it.** The rewritten motion check then found a real gap.


## #84 — TWO SIBLING RULES, ONE WITH A DERIVED BOUND AND ONE WITH NONE

2026-10-11. A deploy failed on code that had passed the same probe hours earlier,
which is the signature of a flaky check rather than a defect. `one-tap` reported
*"pkn ran 6 times for one tap, 1ms apart (417, 417, 417, 418, 418, 418)"* — and
**the rule's own comment calls six `pkn` starts at one instant CORRECT**: they
are six different elements, one per lens counter. The six were made in one loop
that straddled a millisecond, so three landed at 417 and three at 418. **3+3
reads as a double draw and is six.** The canary in that same run drew all six in
ONE beat, which is the control proving the subject's six are normal.

⭐⭐⭐ **THE CAUSE IS AN ASYMMETRY BETWEEN TWO RULES IN ONE FILE.** The BEATS rule
takes a bound derived from the experiment — half the hold the probe itself
presses for, because *a press held for `hold` ms IS the gap between the two
reports*. The per-NAME rule, four lines away, had `gap > 0`: **no bound at all.**
One rule had thought about tolerance and its sibling had not, and nothing made
that visible because both were green for weeks.

⭐ **THE FIX IS THE SIBLING'S OWN BOUND, NOT A CONSTANT.** A number picked here
would stop describing the experiment the moment `hold` moved. Measured on both
sides: **1ms** of clock jitter across six synchronous elements against the
**108–116ms** the real defect and the canary both produce. Checked at the
boundary — 45ms clean, 46ms fires — and the real defect at 116ms still fires.

⛔ **AND THE EXISTING TEST COULD NOT SEE IT.** *"Six counters ticking together are
six elements, not six repeats"* placed all six at ONE instant, so it exercised
the rule precisely where no bound is needed. **A test written from the happy
reading never meets the tolerance question.** The production reading is a test
case now.

⚠️ **THE TELL, FOR NEXT TIME:** when a check compares timestamps, ask what its
tolerance is and where that number came from. `> 0` is not a tolerance; it is the
absence of one, and it survives review because it looks like rigour.


## #83 — THREE PRIOR RULINGS STOPPED ME, AND ALL THREE WERE RIGHT

2026-10-09, rewriting the front door so it stops speaking analyst. Two attempts,
each killed by a gate somebody had written for exactly that mistake:

- **"in an hour" instead of "per 60 minutes."** `test/learn.test.js` carries the
  sentence *"in an hour" was rejected once* in its own failure message. It is the
  sport's unit, and the two condition cards are deliberately parallel. ⛔ **I
  reintroduced a declined wording without running `git log -S`**, which is this
  file's own rule for anything brought back — logged after `red-on-red`, and
  broken by me here.
- **A separate front-door sentence**, so each audience could have its own words.
  `test/test_one_statement.py` exists to forbid precisely that: *"a measurement
  written out more than once, so the two copies are free to drift in wording
  while their figures stay identical — which is how the slot sentence came to
  exist in two versions."*

⭐⭐⭐ **THE ANSWER WAS BETTER THAN THE THING I WAS REACHING FOR.** One sentence,
with the TERM OF ART moved to the card that defines it and the plain definition
left in the shared clause. Both surfaces improve, nothing drifts, and no ruling
is overturned. **When a gate blocks you twice, the design is wrong, not the
gate.**

⚠️ **AND I OVER-CORRECTED IN THREE PLACES, WHICH IS ITS OWN LESSON.**
  - I banned `per 60` from the front door and then had to unban the spelled-out
    form. **An explicitly spelled unit is not a term of art**; *per 60 minutes of
    play* is four ordinary words where *his per-60* is shorthand.
  - I tightened the figure gate from SUBSET to EQUALITY and the build refused:
    the shifts card legitimately states a figure the strip has never shown. **A
    card may teach more than a strip advertises.**
  - I rewrote the zone card too, and it has no jargon in it. **Wordy is not
    jargon.** Polish beyond the brief, colliding with three gates for nobody.

⭐ **THE GAP THE WHOLE EPISODE EXPOSED:** 81 homepage tests passed on a page
whose sections were in the wrong order and whose cards spoke analyst, because
**every one asked about a SECTION and none about the SEQUENCE** — and none about
the vocabulary a stranger meets first. Four presence checks all pass on any
arrangement whatsoever.


## #82 — A CADENCE IS A SECOND SURFACE, AND SIX OF THEM WERE WRONG FOR FOUR DAYS

2026-10-07. Kevin asked for the player figures to refresh nightly. ⭐⭐ **THEY WERE
ALREADY BEING COMPUTED NIGHTLY AND SIMPLY NOT PUBLISHED** — the nightly `measure`
job pulls the whole extract archive and runs archive mode, which writes
`players.json`, and then uploaded only two of the three documents. One name in
one `for f in` list. **Before building the thing, check whether it is already
being made and thrown away.**

⛔ **THE CARD'S OWN SENTENCE WENT FALSE THE SAME HOUR.** *"refreshed weekly"* is a
caption describing a pipeline, and nothing goes red when the pipeline moves. Its
TEST demanded `/weekly/` and went red, which is exactly what a caption claim is
written for — the one case in this family that was instrumented.

⛔⛔ **AND SWEEPING THE CLASS FOUND SIX MORE, ALL OLDER THAN THE CHANGE.**
`measure.mjs`, `preview.js`, `build_main.py`, `printed.js`, `derivation.js` and
`learn-doors.mjs` each said `measures.json`/`teams.json` is rebuilt **weekly**;
the nightly job has rebuilt both since **2026-10-03**, so every one had been
wrong for four days with nothing red. ⭐ **The costliest ARGUED FROM the cadence**:
`preview.js` justified its nightly tail with *"up to seven days and ~3 games
short"*. The tail is still right and still needed — the gap is a day, never zero,
weekly again in the offseason — but **the magnitude inside its own justification
was out by a factor of seven**, which is the kind of stale comment that survives
a reading because the conclusion is still correct.

⚠️ **AND WHEN A GATE BECOMES INCONVENIENT, SHARPEN IT.** The nightly's publish
test forbade EVERY `aws s3 sync … ingest/… s3:` in that job, to stop 0.4 GB of
extracts being re-uploaded. 744 KB of headshots now legitimately needs one. The
answer is not to delete the guard: it forbids **the whole tree and the extracts
by name** and admits a narrow named directory. Its document list stopped being
typed too — derived from `writeFileSync(join(out, …))`, **not** from
`join(out, …)`, which also matches the `catalog.json` the builder READS.


## #81b — A PROBE THAT READS TOO EARLY REPORTS A DEFECT THAT IS ITS OWN

Checking a SECOND preview, my browser probe reported `naturalWidth 0x0` for both
headshots — bytes that never arrived. They had arrived: `curl` gave HTTP 200 and
3,692 bytes for the same URL. **The probe returned as soon as the `<img>`
elements EXISTED, which is before they load**, and the first page I checked had
simply been faster.

⭐ **"NOT LOADED YET" AND "NEVER LOADED" ARE DIFFERENT ANSWERS AND ONLY ONE IS A
BUG.** The probe now waits for `complete && naturalWidth > 0` and **says so when
the wait runs out**, so a timeout can never again be read as a zero. Same family
as `captureBeyondViewport` restarting CSS animations — ⚠️ **the instrument is in
the picture**, and the second time it has nearly cost a false report.


## #81 — I CHECKED IN ONE ENVIRONMENT AND SHIPPED TO ANOTHER

2026-10-07. `test/test_mugs.py` imported `PIL` at module scope. Pillow is on this
laptop, so twelve tests passed and `npm run gates` was green; the gates runner has
no Pillow, so the file raised `ModuleNotFoundError` and the push went red —
**on a dependency that none of the claims in that file actually needs.**

⭐⭐ **THE FIX IS NOT TO INSTALL THE DEPENDENCY EVERYWHERE AND MOVE ON.** Everything
the file is really about — a redirect is not followed, a placeholder is not a
face, a trade refetches, a timeout is retried rather than recorded as absent — is
about **bytes**, decided before any decoder sees them. The encoder became an
injected argument, ten of twelve tests hand it a stand-in, and the file now runs
anywhere. **Ask what the test is a test OF, and cut everything the claim does not
need.**

⛔ **AND A SKIP IS NOT A PASS.** The two tests that genuinely are about the picture
(112px WebP, alpha intact) keep the real encoder and `skipUnless` Pillow. Left
there, CI would have been green on a claim nobody checked — Shape 10 wearing a
different hat — so `gates.yml` and `deploy.yml` install Pillow and the log is
checked for `OK` with no `(skipped=…)`.

⭐ **AND MY CHECK OF THE SKIP PROVED NOTHING, FIRST TIME.** I blocked PIL with a
`meta_path` finder implementing `find_module` — removed in Python 3.12 — so the
import succeeded, the run reported `skipped 0`, and I nearly read that as *the
tests still run*. **A negative control that cannot fire reads exactly like a
passing one.** Reran with `find_spec`: 12 run, 0 failures, exactly 2 skipped,
named.


## #80 — A MISSING THING THAT ANSWERS 200, AND A REDIRECT AS THE REAL ANSWER

2026-10-07, building the headshots. Ask the league's CDN for a player it has never
photographed and it answers **302 to `/mugs/nhl/default-skater.png`**, which
answers **200** with a perfectly good grey silhouette, byte-identical for every
club. So both obvious implementations are wrong in the same direction:

- `curl -L`, and urllib's default, FOLLOW the redirect and download a stranger;
- a status check sees 200 and calls it a headshot.

Either ships a card showing a generic outline under a named player, with every
gate green. ⭐ **THE NUMBERS SAY IT IS NOT HYPOTHETICAL: 222 of 228 published
players have a headshot and SIX DO NOT** — Knies, Kreider, Evangelista, Stanley,
Tolvanen, Marchenko. Not rookies: established men the league has not re-shot **in
a new sweater**, because the asset path carries the club. Six well-known faces
replaced by a silhouette.

⭐⭐⭐ **THE SHAPE: ASK WHAT A SERVICE DOES WHEN THE THING IS ABSENT, AND MAKE
ABSENCE DISTINGUISHABLE BY CONTENT RATHER THAN BY STATUS.** This repo already
logs *production answers 200 for ANY missing path* about our own host; the same
trap, on somebody else's, cost nothing only because it was looked for. Two
independent rules, because one is not enough: **refuse redirects** (the URL we
asked for either exists or it does not) **and compare every body against the
placeholder's own bytes**, fetched each run rather than typed, since a CDN that
stopped redirecting and started serving the default directly would walk straight
back in.

⚠️ **AND A NEW WRITER IS AS INVISIBLE AS A NEW DOCUMENT WAS** (#75). The publish
gate derived its set from `measure.mjs`'s `.json` files, so a directory written by
a different builder sat in exactly the blind spot that 404'd `players.json`. The
sibling gate derives the directory name from the builder — and also requires the
page's CSP to permit an image at all, since `default-src 'none'` blocks them
outright and a blocked image is a silent blank on the reader's machine.


## #79 — MY OWN MEMORY INDEX WAS OVER ITS SIZE LIMIT AND SEVEN LINES DID NOT LOAD

2026-10-07. `MEMORY.md` was **26,692 bytes against a 24,400 limit**, and the
loader said so in one line I had been reading past: *"Only part of it was loaded:
7 of 98 lines were cut off."* The seven were the tail of **Kevin's standing
preferences** — including *go to root under pushback*, *run the seams*, and
*you wrote all of it*. They had been invisible in every session since the file
crossed the limit.

⭐⭐⭐ **#68 SAID THE INDEX IS THE LOAD-BEARING SURFACE. IT IS ALSO THE ONE WITH A
BUDGET, AND EXCEEDING IT FAILS QUIETLY IN THE DIRECTION OF LOOKING FINE** — a
file that is 90% loaded reads exactly like a file that is loaded.

⛔ **THE CAUSE WAS INDEX ENTRIES ARGUING INSTEAD OF POINTING.** One line — the
pointer to THIS file — was **5,863 characters**, a condensed essay where a
pointer belongs. Five lines held 10KB between them. Fixed by compressing them to
what the index is for (what the file is, and the single hook that decides whether
to open it); 26.7KB → 18.8KB with every one of 73 files still pointed at.

⚠️ **THE DISCIPLINE: AN INDEX ENTRY THAT STARTS ARGUING HAS MOVED DETAIL INTO THE
WRONG FILE.** The detail is not lost — it is in the topic file, which is where it
can be long. And **check the budget, not just the correspondence**: 73 files, 73
pointers, no orphans and no dead links was all TRUE while a quarter of the file
was not loading.


## #78 — A LABEL IS NOT ALWAYS THE FIX, AND TWO CORRECT SURFACES CAN BE FALSE TOGETHER

2026-10-07, fixing the clock the first outside reviewer caught. The obvious read
is *an unlabelled time*, and the obvious fix is a timezone label. Both are right
and **the label alone leaves the defect standing.**

- `nightWord` compares the league's date to the READER's calendar and only then
  says *Tonight*. **Correct.**
- each fixture row renders its own start in the reader's zone. **Correct.**
- under `TZ=UTC` the page said *Tonight · 3 games* over `EDM at ANA · 2:00 AM`,
  which for that reader is **tomorrow**.

⭐⭐ **A RECURRENCE OF #54 — THE GAP BETWEEN TWO CORRECT THINGS** — and worth a
number of its own because the first instance was two values at one moment, and
this is two SENTENCES on one screen. **Ask what two correct statements say when
read together**, which is a question no assertion about either one can ask.

⭐ **AND THE SECOND HALF OF THE FIX NEEDED ITS OWN TEST TO HAVE ANY TEETH.** A row
now names its local day only when it DISAGREES with the night's — so the loud
test (*it says Thursday*) would pass a `dayNote` that returned a constant. The
quiet test (*it says nothing for the reader it is already right for*) is what
makes the pair a claim. Each of the three mutations kills exactly one test.


## #77 — A STEP THAT WRITES TO TWO PLACES HAS A FAILURE WINDOW BETWEEN THEM

2026-10-07. `ingest.yml`'s refresh step **publishes the measurement to R2** and
then **commits `data/measures.json` to git**. The 15:49 run published, then failed
at the health block before the commit — correctly, the suite was red. Origin
moved, repo did not, and **nothing was red about the difference**: `npm run gates`
passes on a stale repo because nothing in `gates` reads the origin. The deploy
shipped `slot.html` baking 171,027 attempts while the front door fetched 171,026.

⭐⭐⭐ **AND A DATE STAMP IS NOT A VINTAGE.** I had written the diagnosis down as
*one measurement, two vintages* and proposed stamping the front door with
`__MEASURED_UP_TO__`. Measured: both copies declared `dataThrough: 2026-10-06`
AND `measured: 4244`, and **35 figures differed** — the league had reclassified
one shot-on-goal as a blocked shot after we measured. **The fix I had recorded
would have labelled both copies identically and changed nothing.** Two documents
can agree on every label they carry and disagree on the content.

⚠️ **THE HABIT:** when two surfaces print one measurement, the question is not
*are they stamped* but *is there one gate that reads BOTH and requires them to
agree* — and where does it run.


## #76 — A GATE CALLED ONE LINE TOO LATE CANNOT ANSWER

2026-10-07, under #77. `tools/measures_fresh.py` compares the committed
measurement against the published one, and it is a good instrument: run by hand
against the repo it named the drift exactly. It was called from `ingest.yml`
**immediately after** `cp ingest/measures.json data/measures.json`.

So it compared a file the step had just overwritten **against the document that
file came from**. It could only ever catch a failed PUBLISH — never a stale repo,
which is the one case its own error message tells a human to fix. It printed
*"every quoted figure already matches the published file"* over a six-figure
disagreement.

⭐⭐⭐ **ASK WHAT A CHECK'S INPUT IS AT THE MOMENT IT RUNS, NOT WHAT IT COMPARES.**
The comparison was right, the subject was wrong, and reading the tool teaches you
nothing — only reading the step around it does. **A correct instrument in the
wrong position is indistinguishable from no instrument, and it is worse, because
it prints a pass.**

⚠️ **ITS SIBLING, AND IT HAD NEVER BEEN RUN:** what the tool said when it could
not FETCH. The exception escaped, so an origin hiccup aborted a step named for
staleness with a traceback — on the wrong side of the only distinction that
matters. A failed fetch is **not** a fresh file and **not** a drift: it exits a
distinct code and says *this check answered NOTHING; it is not a pass*. The
behaviour was unreachable until the comparison became a pure function of two
dicts, which is why nobody had checked it.

⭐ **AND MY COMMENT PROMISED A CODE THE CODE DID NOT PRODUCE.** I wrote "exit 2"
beside a `sys.exit("a string")`, which prints and exits **1**. The test asserted
the 2 the comment had promised and caught it — *name the property the claim is
about, then check THAT one*, applied to my own prose.


## #75 — A DOCUMENT CAN BE BUILT, COMMITTED TO NOTHING, AND 404 FOR EVERY READER

2026-10-07, and it is **#74 living in the deploy path**, where no test in the
suite can reach it.

`players.json` was written by `measure.mjs`, the suite was green, a full
`derive.yml` ran for an hour and reported **success** — and the site answered
**404**. The upload step is a shell `for f in catalog.json measures.json
teams.json index.json`, a typed list of the documents that existed when somebody
wrote it. A new archive document is **invisible by default**, and the only
symptom is a feature that quietly does nothing.

⭐ **IT WAS CAUGHT BY ASKING FOR THE ARTIFACT, NOT BY READING THE RUN.** The run
was green at every level. `curl players.json` was 404. ⚠️ Same family as *"a
green deploy is not a correct page for a reader"* and *"a green ingest is not a
re-derived archive"* — **three times now, the pipeline has reported success over
a thing that did not reach a reader.** The habit that works is: name the artifact
the change was for, and go and fetch it.

✅ **THE GATE DERIVES THE SET FROM THE WRITER** rather than being a second list to
keep in step: whatever `measure.mjs` writes into `--out` must appear in some
workflow's upload list. ⚠️ It reads the `for f in …` lists and not the whole file,
because a name in a comment or in an `--exclude` is not a name that gets
uploaded — and this gate exists exactly because the words about the code and the
code disagreed. It does not care WHICH workflow publishes it: that is a judgement
about what the document means; reaching the bucket at all is not.

## #74 — A RULE THAT WAS CORRECT FOR EVERY CASE THAT EXISTED WHEN IT WAS WRITTEN

2026-10-07, **four times in one day**, which is what makes it a shape rather than
four bugs. Each was right, stayed right while nothing moved, and went silently
wrong the moment a second case arrived:

- `.pvtile .pvdoors{margin-top:auto}` pushed the door block to the bottom of the
  tile. Perfect while a tile had ONE. The merged tile has two, so the FIRST one
  absorbed all the free space and shoved the second measurement to the floor.
- A door labelled **"See an attempt being counted"**, written when it opened a
  replay frame. The destination became a DIAGRAM and the label kept promising the
  old one. ⛔ And it had exempted itself from the only test that checks a door's
  promise, which reads labels of the form *"What a … is"* and skips the rest.
- `person()` multiplied a figure by the crop factor. Invisible because every
  cropped diagram drew no people and every diagram with people was full-width —
  at `k=0.495` it drew a **3-foot man**. A latent bug that can only fire on a
  figure nobody has drawn yet.
- `trackFor` spelled every value as `pct(v)+'%'`. Correct for a club row, which
  is a SHARE. A player row is a RATE: `0.39` would have rendered **"39%"** under
  a heading saying *goals a game* — wrong by a factor of a hundred, and it looks
  entirely normal.

⭐ **THE TELL IS A RULE WITH NO SUBJECT IN IT.** Each one said what to do without
saying *to what*: all door blocks, all figures, all values. ⭐ **THE FIX IS THE
SAME EVERY TIME — make the thing carry its own answer**: `:last-child`, a per-key
label, size as geometry, `row.fmt`. ⚠️ And the defaults stay, so nothing existing
changed; what changed is that a second kind of row can now disagree with the
first.

## #73 — AN ASSERTION CAN PASS FOR THE WRONG REASON, AND ONLY DELETING SOMETHING ELSE SHOWS IT

2026-10-07. `test/preview-page.test.js`'s **attempt-partition** test ended with
`assert.match(textOf(ids.pv), /48 of every 100/)` over the WHOLE card. It passed
for months. The string it matched was the **HITS tile's** sentence — *"the puck
less in 48 of every 100 games"* — one text node, single-spaced. The attempts tile
renders its own 48 as a `<p>` plus a `<span>`, which the harness joins with a
space, so `"48  of every 100"` never matched and never had to.

**Both figures are 48 this week by coincidence.** The test was named for one tile
and satisfied by another, and nothing could have revealed that except removing
the unrelated tile — which Kevin asked for, for unrelated reasons.

⭐ **THE SHAPE: A WHOLE-PAGE REGEX IN A TEST NAMED FOR ONE PART.** Scope the
assertion to the thing the test is about; a page-wide match is a claim about the
page. ⚠️ Same family as #65's second surface, arriving from the other direction:
there, one fix missed a second surface; here, one assertion was ANSWERED by one.

## #72 — `git checkout <file>` DESTROYED UNCOMMITTED WORK, AGAIN

2026-10-07. The rule has been in this file since #44–#47: *mutate against a `cp`
backup, never `git checkout`*. I wrote `git checkout src/lib/preview.js` to undo a
one-line mutation on a file holding ~80 lines of uncommitted new code, and it
took all of it — `watchFor`, `PLAYER_ROWS`, the model line.

⛔ **THE FALLBACK I WROTE MADE IT WORSE**: `git checkout … || cp $SP/pv.bak …`.
The `cp` never ran *because the checkout succeeded*. **A fallback after a
destructive command runs only when the destruction fails.**

⭐ What caught it: the suite went from green to three failures *after* restoring,
which is the signal to check what "restoring" did rather than what the mutation
did. ⚠️ Knowing a rule is not following it; the only defence that worked was
making the backup FIRST, which I then did for every later mutation that day.

## #71 — I QUOTED THE SENSITIVITY BAND AND OMITTED THE THRESHOLD

2026-10-07, caught by Kevin in one line: *"why didn't we use the same r=0.7,
isn't that what we used for the team threshold?"*

I reported a reliability table at **0.6 and 0.8** and concluded two of Kevin's
four chosen metrics *"don't qualify"*. `reliability.js::TARGET = 0.7` is **the one
policy in that file** and the number every published club figure is quoted at;
0.6/0.8 is the `atTarget` pair published *beside* it to show sensitivity. At the
threshold **all four qualify**, and one is faster than two shipped club rows.

⭐⭐ **THE BAND STRADDLED THE DECISION**, so the same measurement supported either
answer depending on which column I read — and I had read the columns that were
not the claim. **When a document publishes a figure AND its sensitivity, the
figure is the claim; the band is how much it would move.** ⚠️ The tell: I was
quoting two numbers where the surfaces quote one.

## #70c — TAKING A SIDE RESOLVES A CONFLICT AND LOSES THE OTHER SIDE'S WORK

2026-10-06, twice in one session, and the second time it cost the commit.

The nightly `measure` job commits to `main` while I am working, so a push is
rejected and a rebase conflicts on `docs/status.md` — whose GENERATED health block
carries a timestamp that moves every run. I resolved it with
`git checkout --ours -- docs/status.md`.

⛔ **THAT TAKES THE WHOLE FILE.** The health block was three lines of a ninety-line
change; the rest of my §0.00 handoff went with it, and the rebase then dropped the
commit as EMPTY and said *"Successfully rebased"*. **A green rebase is not a kept
change.** Found only because I grepped the file for my own heading afterwards.

⭐ **THE RULE: AFTER RESOLVING BY TAKING A SIDE, GREP FOR SOMETHING YOU WROTE.**
`git status` is clean and the rebase reports success in exactly this case. The
first occurrence the same day was harmless — the conflicted files were GENERATED
pages, where taking either side and rebuilding is correct — and that is precisely
what made the second one feel safe. **The two cases look identical and are not: a
generated file can be rebuilt, a written one cannot.**

⚠️ Related and already recorded: *restoring the source is not restoring the build*
— on that same rebase I took the nightly's `src/*.html` and had to `npm run build`
before they carried my source changes at all.

## #70 — A STRING IN A LOG IS NOT A THING THAT HAPPENED

2026-10-05. Kevin: *"there was a failed ingest at 3:18 eastern this afternoon,
can you look into that please."*

The diagnosis that held: the `ingest` job was green through all seventeen steps;
the `measure` job behind it **never got a runner** (`runner=` empty, zero steps),
sat fifteen minutes to the second, and GitHub cancelled it, which takes the run
red. Infrastructure, not our code.

### ⛔⛔⛔ THE TWO THINGS I GOT WRONG, WHICH ARE THE POINT

**ONE — I read a log and believed it.** I grepped the run log, found
`nothing new this run — no index written`, and told Kevin the run had found
nothing. **A GITHUB LOG CONTAINS THE SHELL SOURCE OF EVERY STEP.** I had matched
the text of an `echo` inside a branch that never executed. The run had in fact
derived a game. *The distinguishing mark was there and I did not use it:* echoed
source lines carry the `^[[36;1m` escape and real output does not.

**TWO — the fix would have shipped INERT.** I then gated the job on
`ingest/index.json` existing, copying the ledger step three hundred lines above
that gates on exactly that. But derive writes the index on EVERY run, **including
one that derived nothing**, so the condition could never be false. Caught only by
going and looking at the derived-0 runs instead of assuming.

⭐⭐⭐ **THE RULE: ASK WHAT WOULD MAKE THIS CONDITION FALSE, AND FIND A RUN WHERE IT
WAS.** A gate nobody has seen fire is a gate nobody has tested. This is shape 10
(*a check that cannot fail in the conditions you run it under*) committed in a
workflow instead of a test.

⭐ The honest signal was the derive report's own `run.derived`, which correlates
exactly with which of the day's six runs produced a commit. And **unknown means
MEASURE**: a missing or malformed index falls back to running the job, because
skipping on a question you could not answer trades a wasted job for a silently
unmeasured amendment, and only one of those is recoverable.

⚠️ **AND THE FIX DOES NOT PREVENT THE FAILURE THAT PROMPTED IT** — that run
derived a game and its job had real work. Say so in the commit. What it removes is
the other kind of red: two of six runs that day derived nothing and still pulled
373 MB and ran `npm run gates`. **A red ingest that means nothing teaches us to
stop reading red ingests**, which is how a publish halt went unquestioned for 31
hours in September ([[ingest-delivery-target]]).

## #70b — A RATIO TO THE NEAREST OBJECT IS NOT A SCALE

Same two days, in the drawing. Kevin: *"is the net size scaled accurately to the
rink size?"* **The rink is 200x85 units for 200x85 FEET — one unit is one foot —
and nobody had ever measured anything against that.** The net was right but for a
depth typed by eye; the PEOPLE were a nine-foot skater beside a four-foot
goaltender, because the goaltender had been sized to fit the goal mouth.

⭐⭐ **FITTING A PERSON TO A PIECE OF EQUIPMENT** is how that happened, and the rule
that enforced it (*fill under 90% of the mouth*) could not see the skater standing
next to him. A rule written against the nearest object cannot notice that the
object and the subject are both wrong.

Full detail, including the four art defects that only rendering found and the
ruler-not-subject bug, in [[figure-family-and-scale]] and [[looking-at-pixels]].

## #69 — AN `OR` OVER BOTH ANSWERS IS SATISFIED BY ALWAYS GIVING ONE

2026-10-04. Kevin, from the live preview page: *"I thought the doors such as
'What a power play is' went to the learning page for a power play, it doesn't do
that anymore."*

**All eight doors on that card opened a replay frame. None had ever opened a rule
page** — no version of `src/preview.html` in the repo's history contains a link
to one. It shipped that way on the same day Kevin asked that the cards serve as
front doors to the lessons.

### The check that let it live

```js
/* titled: "every tile and every measure row is a door into the lesson behind it" */
assert.match(d.href, /^\/(offside|penalties)\.html$|^\/game\.html\?game=\d+&at=/);
```

⭐⭐⭐ **THE TITLE MAKES A PER-ROW CLAIM AND THE ASSERTION MAKES A SET-MEMBERSHIP
ONE.** Both destinations are legitimate for *some* row, so a disjunction over
them is true no matter how the rows are distributed — including all of them on
one side. **A check that enumerates the acceptable answers must also say which
subject gets which.** This is the dominant failure mode of this repo stated in
its purest form yet: *a check that tests a narrower claim than it announces* —
except here it is not narrower, it is a DIFFERENT claim that happens to be
implied by the right one.

⭐ **THE TELL, FOR NEXT TIME: a regex with a `|` in it, in a loop over
subjects.** If the alternation exists because different subjects need different
answers, the loop is the wrong shape — the expectation belongs per subject.

### The defect itself: one name, two meanings, passed positionally

`_card_href(cid, doors, figures)` implemented *owns a diagram → lead to the
diagram*. Two unrelated things in `build_index.py` are called `figures`:
`_fig_json()`, the rule diagrams keyed by CARD ID (6 keys), and
`learn-doors.json["figures"]`, measured figure VALUES (one key, `unreached`).
`_learn()` passed the first; `_preview_doors()` passed the second. **Same
function, same question, opposite answer, and Python checks nothing.**

⭐⭐ **THE FIX IS THE SIGNATURE, NOT THE CALL.** Correcting the one bad call site
would have left the next caller the same trap. `_card_href(cid, doors)` now reads
the document that defines the set, so **there is no argument to get wrong.** Same
instinct as [[feedback-mechanism-not-policy]]: remove the degree of freedom
rather than police it. Related: `own` means 4+ different things
([[restart-frames-and-k1]]) — a shared name whose meaning depends on the caller.

### ⭐ AND THE SURFACE THAT WAS RIGHT IS AN ORACLE

`what-you-can-see.html` reads the same rule down a different path and was correct
for all eleven days. So *"the preview and the learn page must send one lesson to
one place"* is a check **neither surface can satisfy alone**, and it fires on
exactly the bug class that occurred. ⚠️ It would NOT catch `_card_href` itself
being wrong — proven by planting that mutation, where both surfaces agreed and
the test passed — so the per-row assertions carry that half. **Write down which
half of the claim each check owns, then verify by planting BOTH mutations.**

## #68 — THE INDEX IS A SECOND SURFACE, AND IT IS THE LOAD-BEARING ONE

2026-10-04, picking up from a manual compact. CC gave Kevin a todo list with
**"Active player — written up, not built. 92.8% of frames carry a player the page
never shows"** on it. Kevin, in nine words: *"I think 4 was closed a while ago,
no?"*

It shipped long ago. `app.js::who()` renders it on **97.6% of playable frames**
(22,661 of 23,207) and `test/active-player.test.js` has guarded it the whole
time.

⛔⛔⛔ **AND HE HAD ALREADY CAUGHT THIS EXACT CLAIM, FROM THIS EXACT SOURCE, ON
2026-09-10** — *"we have the active player line currently?"* — when CC published
it into `docs/status.md` as one of four "unturned stones". That day the topic
file [[active-player-artifact]] was corrected and `docs/status.md` was corrected.
**The MEMORY.md pointer to the topic file was not.** For twenty-four days the
index line argued the opposite of the file it pointed at.

⭐⭐⭐ **WHY THAT IS NOT A COSMETIC LAG.** `MEMORY.md` is the part that enters
context every session; a topic file is opened only when its pointer makes it look
worth opening. **So the pointer is not a summary of the claim — for most sessions
it IS the claim.** Correcting the file and leaving the pointer leaves the wrong
version as the only version anybody reads, which is strictly worse than having
written nothing.

⭐⭐ **THIS IS #65–#66 IN A DIFFERENT MATERIAL.** That one was CSS: the ice
stopped drawing a mark and the LEGEND kept teaching it. This one is prose about
prose. The shape does not care what it is made of — **a key, a caption, a doc and
an INDEX ENTRY are all second surfaces describing a first, and fixing the first
does not fix them.** The question to ask after any correction: *what else
describes this, and does the thing that LOADS describe it correctly?*

⭐ **WHAT TO DO WHEN ONE IS CAUGHT: SWEEP THE CLASS, THEN REPORT THE SWEEP.**
Every "not built / unwired / parked" pointer in the index was checked against the
repo the same minute: K1 genuinely built-and-unwired (blocked by Kevin's own
2026-08-16 subline ruling), caching genuinely unbuilt (there is no `src/_headers`
at all), layers-follow-the-layer unbuilt, two workshop pages genuinely awaiting a
ruling. **Seven clean, one rotten.** One stale pointer is an anecdote; the sweep
is what says whether the index can be trusted at all.

⚠️ **NOTHING CAN GO RED HERE.** There is no suite over memory and no gate that
reads it. The defence is a habit, stated as a rule: **after correcting a topic
file, re-read its index line in the same breath, and re-read the description
field too — recall is driven by that string, not by the body.**

## #55 — I CHECKED A PROPERTY THAT WAS TRUE AND REPORTED ONE THAT WAS NOT

2026-10-04, and this is the day's whole shape. **Five defects, all found by Kevin
from the live site, none by a green suite, and two of them while I was telling
him the opposite was true.**

Kevin: *"I don't see the 'Show Summary' button."* I measured `#sum` in a browser
and replied: *"The button IS there — I measured it mid-replay at (575, 402)."*
It was `visibility: hidden`. I had read `display` and a bounding rect, **both of
which are true of an element nobody can see.** He came back with the cause
himself — *"so a viewer doesn't have to enable a layer to get to it"* — and he
was right: `#rg .lbox.empty .lxw{visibility:hidden}` hides that row until a layer
is chosen, and `Just events` is the default.

⭐⭐⭐ **THE SAME ERROR THREE TIMES IN ONE DAY, in three different materials:**

| I checked | and reported | what was actually true |
|---|---|---|
| `display` + a bounding box | "the button is visible" | `visibility: hidden` |
| `gates` and `deploy` both green | "it is live and correct" | the PUBLISHED document had not caught up |
| the suite's PASS count | "1,623 tests" | one test was failing; the real figure is 1,624 |

⭐⭐ **THE RULE: NAME THE PROPERTY THE CLAIM IS ABOUT, THEN CHECK THAT ONE.**
"Visible" is not "has a box". "Deployed" is not "correct for a reader". "Counted"
is not "green". Every one of these was a check that answered a neighbouring
question confidently.

⚠️ And `looking-at-pixels.md` has logged **"verifying an ATTRIBUTE is not
verifying VISIBILITY"** since September. Knowing the shape did not stop me using
`display` as a proxy an hour after writing a probe about it.

---

## #56 — A TREADMILL WITH NOBODY ON IT IS JUST A STOPPED JOB

2026-10-04. `quoted-figures.test.js` holds seven hand-written sentences in
`src/lib` to `measures.json`, and its header stated the design out loud: *"this
goes red naming the file and both figures, and somebody updates the sentence —
which is the entire point."* True while `measures.json` moved WEEKLY and a human
regenerated it. **I made the job nightly and put an unattended machine in that
loop.** Both of the night's ingests failed on three counts that live in COMMENTS
and that no reader ever sees — a DOCUMENTATION freshness check blocking the DATA
freshness commit the job exists to make.

⭐⭐ **THE STEP'S OWN COMMENT PREDICTED IT AND ITS PREMISE WAS FALSE.** It said
these were the *"ONE THING NOT GENERATED AND CANNOT BE"*. Every one is a field of
the published document or one subtraction from it. **When you write down that
something will break later, check the reason you give — "cannot" is a claim.**

⭐ The fix is `tools/quoted-figures.mjs`, which WRITES them, with the test
importing its claim list rather than restating it. A treadmill is not a guard —
`prose-measurements.test.js` already said so, one tier over.

---

## #57 — A DIAGNOSTIC DOWNSTREAM OF THE THING THAT DIES IS NOT A DIAGNOSTIC

2026-10-04, and it cost the whole first investigation. The measure step ends with
`npm run gates` behind a carefully written `::error::` that names the likely cause
and the fix. The job never reached it: `builders/health.mjs` runs earlier, counts
the suite with `execFileSync`, **which throws on a non-zero exit** — so the first
failing test killed it with 300KB of truncated TAP and the log said only *"Error:
Command failed: sh -c node --test"*.

⚠️ **AND FIXING IT CAUSED THE NEXT FAILURE.** Made to count-and-continue, it
then WROTE a pass count taken while the suite was red — a figure that was never
true, written by the guard whose whole purpose is that this number cannot go
stale silently. **Three behaviours in one day: throw → write a wrong number →
refuse with a named reason.** Only the third tells the next reader what to do.

⭐ The underlying ordering defect: `health.mjs` RUNS THE SUITE, the suite reads
the BUILT pages, and the step wrote the block BEFORE `npm run build`. **If a tool
runs the suite, everything the suite reads must already be current.**

---

## #58 — THE COMMITTED DOCUMENT IS NOT THE PUBLISHED ONE, FOR ONE NIGHT

2026-10-04. ⛔⛔⛔ **I shipped the exact defect the feature existed to prevent, and
`gates` and `deploy` were both green over it.**

The summary card places a team's count on a per-team-game distribution. The
fallback read `by && perTeam ? perTeam[id] : own[id]` — so with no `perTeamGame`
in the document, each team's count was drawn on the GAME class: 61 attempts
against a scale of 88–144 two-team totals, clamped to the left edge, under an
axis labelled with the wrong population. **Live for about twenty minutes.**

⭐⭐⭐ **THE GAP IS STRUCTURAL AND APPLIES TO EVERY NEW FIELD.**
`data/measures.json` is a build input committed WITH the code. The shell FETCHES
the published document from the data origin, which the nightly rewrites hours
later. **So a new field is present in every local test and every browser probe,
and absent on the live site, for one night.** A fallback that degrades to a
DIFFERENT POPULATION is invisible in exactly the place it is wrong.

⭐ **TWO RULES.** A split and its reference class travel together or neither does
— no class means draw the old, coarser, correct thing. And **drive the page with
the new field DELETED**, which is the only check that sees the live state.

⚠️ It was found by curling `data.readthegame.co/measures.json` after the deploy
went green. **Checking the live page after a green deploy is not belt-and-braces
on this project; it is the only instrument that sees this class of defect.**

---

## #59 — A CANARY WRITTEN AGAINST AN INSTANCE DIES WITH THE INSTANCE

2026-10-04. `door-row`'s canary restored its defect declaration for declaration:
`.lxw` laid out as a block while `.lxwe` — the only door declaring its own
`display` — stayed flex, which is the divergence Kevin had seen. Then the summary
door moved to the sidebar and `.lxwe` went with it. The injection now made every
remaining door block TOGETHER: no divergence, probe green, **canary ACCEPTED**.

⭐⭐ **A canary must restore the SHAPE of the defect, not its instance.** The
shape is "one door in this row is laid out unlike its neighbour", and
`#rg .lxw + .lxw` names it without naming any door. Any canary that names a
specific class is a canary with an expiry date nobody wrote down.

⚠️ Related, same day: a probe whose own first version **ran green against the
collision it was written for.** It harvested class names by walking `className`,
and the elements in question are built as an HTML STRING, which the fake document
does not parse into nodes. It saw the rail, the band, the marks and the ends —
everything except the one element that was wrong.

---

## #60 — A TWO-LETTER CLASS NAME IN A SHARED STYLESHEET

2026-10-04. Kevin: *"something is amiss with the font size."* I had named a new
chip `class="sc"`. `#rg .sc` is **the scoreboard's score** — `font-size:1.8rem`,
`font-weight:800` — so every team count on the summary card rendered at 28.8px
beside a 14.4px label.

⭐⭐ **THE TELL WAS ALREADY ON SCREEN THE DAY BEFORE.** `css-orphans.test.js`
reported `.sa` and `.snone` as unproduced and said NOTHING about `.sh` or `.sc`,
which meant those two were already known to the page. I read the asymmetry as
noise. **A check that answers about four of five names is telling you something
about the fifth.**

⭐ The gate is about OWNERSHIP, not a banned-name list: a class worn inside
`.srows` must be reachable only through `.srows`. Plus: an element carrying a
figure a reader reads should declare its own `font-size`, so the next collision
cannot be silent.


## #48 — A GUARD THAT GUESSES THE CAUSE SENDS THE READER TO THE WRONG FILE

2026-10-03. The nightly `measure` job refuses to push a tree that fails
`npm run gates`. I wrote its error message to assert WHY: *"almost certainly a
figure in src/lib/sentence.js or src/lib/layers/blocked.js that
quoted-figures.test.js holds to the published file."*

The first real failure was a **shallow clone**. `npm run refcheck` reads
revision-pinned citations out of the design docs and a shallow clone cannot
resolve a single one; 17 of 117 broke. Both named files were perfectly fine. The
real cause had printed itself twenty lines above my message, with the YAML fix.

⭐⭐ **A GUARD STATES WHAT IT OBSERVED AND POINTS AT THE EVIDENCE. It does not
diagnose.** My sentence was a plausible story written months before the failure,
and it competed with the correct answer already on screen. It names the candidate
as a candidate now and says to read the gate that failed.

⭐⭐⭐ **AND `refcheck` IS THE THING TO COPY.** It knows which of its own failures
is an ENVIRONMENT problem rather than a subject problem, and says so: *"THIS CLONE
IS SHALLOW, so no revision-pinned citation can be read at all. The breaks above
are almost certainly this and not the documents. Fix the CHECKOUT, not the docs"*
— with the YAML. That is why this cost one CI run instead of an afternoon reading
documents that were correct. A tool that can tell "my inputs are wrong" from "my
subject is wrong" should say which.

⚠️ **AND THE PRECONDITION WAS KNOWN IN TWO FILES AND IN NEITHER AS A RULE.**
`gates.yml` and `deploy.yml` had both carried `fetch-depth: 0` since they were
written. The `ingest` job legitimately does not need it — its own step called
"gates" is the Python suite alone — so the gate is spelled against WHAT A JOB
RUNS, not against a list of jobs. Three jobs answer to it.

## #52 — I FIXED THE RENDERING TWICE BEFORE QUESTIONING THE ENCODING

2026-10-03. Kevin said four times, over four rounds, that he could not read the
preview card. Each time I repaired how it was DRAWN; the fault was what it was
drawing.

| he said | I fixed | what was actually wrong |
|---|---|---|
| *"something is amiss with our calculations"* | the bar was 3% opaque so the band showed through | rendering — real, but not it |
| *"I don't know what the 35 and 37 mean"* | added a sentence naming each denominator | copy — real, but not it |
| *"lines stop at the same point, numbers say 40 / 25"* | **the bar became a mark at the value** | ⭐ THE ENCODING |
| *"remove the shading… 'outside it' can't be true"* | **the band went** | ⭐ THE ENCODING |

⭐⭐⭐ **WHEN A READER SAYS "I STILL CANNOT READ IT" A SECOND TIME, STOP REPAIRING
THE DRAWING AND ASK WHAT IT ENCODES.** The bar ran from the LEAGUE FIGURE to the
club's value, so its length was the GAP — and with both clubs below the league
every bar ended on the tick, which is precisely what he was describing from the
first message. I had the information to find it in round one and spent two rounds
polishing a chart that was answering the wrong question.

⭐⭐ **A VALUE ON A TRUNCATED AXIS HAS EXACTLY ONE HONEST ENCODING: WHERE IT SITS.**
The axis starts at the lowest club-season, not at zero, so a bar grown from the
left edge gives the lowest club NO BAR AT ALL and makes every length a lie about
its own proportion. That is why round 3 could not be fixed with a different bar,
and it is the reusable rule.

⭐ **AND THE BAND WAS A POPULATION MISMATCH WEARING A PICTURE.** It was the spread
of FULL-SEASON club figures; the mark is a club after ONE GAME. The caption said a
mark past it was "beyond anything a full season has produced" — literally true,
and it means nearly every club is outside it in October, so the card announced
sampling noise in the language of a record. #45's rule, in a chart: **ask what
population each side of a comparison counts.**

## #53 — A CHECK WRITTEN AGAINST THE EASY STATE APPROVES WHAT IT FORBIDS

2026-10-03, three times in one afternoon, all mine, all caught only by mutating.

- **THE BAND.** Kevin had it removed, so I wrote "exactly one rect may span the
  track, and that is the rail". Restoring the band PASSED — because with every
  club inside the range the band spans the WHOLE axis, x=0 width=100,
  geometrically identical to the rail. It is only a region when the axis is wider
  than the range, **which is exactly when it was drawn and exactly when it
  misled.** The fixture has to put a club outside.
- **THE PROBE'S LOCATOR.** It found the mark by `rect[stroke]`, so deleting the
  outline — the one thing holding a mark drawn at 1/35 opacity — ALSO deleted the
  probe's ability to find it. The mutation was caught as *"this row is not being
  checked"*, never as *"the mark is invisible"*. ⭐ **A locator that disappears
  with the defect cannot report the defect.**
- **THE VISIBILITY RULE.** "Differs from the track" was satisfied by the white
  NOTCH the opaque backdrop leaves when the outline goes — about 20 per channel,
  carrying none of the club's colour. Measured properly: 150 with the outline, 20
  without, threshold 60.

⚠️ And a fourth, in the canary: it moved only the stroked rect while the probe had
been changed to locate the FILL, so **the canary displaced something the check was
no longer looking at** and passed. Every time the probe changes, re-run the canary.

## #54 — THE GAP BETWEEN TWO CORRECT THINGS

2026-10-03. Every `How this is counted →` door on the site landed on the page
header. Kevin found it by pressing one.

**Nothing was wrong with either end.** The preview writes
`/how-we-measure.html#m-<key>`; the methods page gives each section
`id="m-<key>"`; both call `anchorOf` so they cannot drift; and
`test/methods.test.js` already proved every door has a section waiting. I verified
all sixteen ids exist at runtime before changing anything. They do.

⭐⭐⭐ **THE PAGE IS A SHELL. Its sections are drawn after `measures.json` arrives,
and a browser resolves a fragment while PARSING the document — when the host is
still empty. It finds nothing, gives up, and never looks again.** No test of
either end could ever have seen it, because neither end is wrong.

⭐ **THE TELL: a behaviour nobody owns, between two things that are each correct
and each tested.** Ask what has to be TRUE AT THE SAME MOMENT, not what has to be
right. Only a browser can answer that, which is why the check is a probe.

⚠️ **AND ONE OF MY OWN CLAIMS WENT UNCHECKED UNTIL I MUTATED IT.** The fix moves
focus as well as the scroll, the comment said so, and the probe measured only
scroll — deleting the two focus lines passed clean. **A claim nothing checks is a
comment.**

⛔ **THE CSP-PINS-SCRIPT-BY-HASH TRAP, SECOND TIME.** Editing the page's data
origin to point at a local fixture changes the script's bytes, the hash no longer
matches, the browser refuses the whole script and the page renders EMPTY — which
looks exactly like a failed fetch. `door-row` paid for this in September and I
walked into it again. **Strip the CSP before touching anything else.**

## #50 — A NUMBER WITH NO NOUN, AND A SUITE THAT ONLY CHECKS NUMBERS

2026-10-03, Kevin on the preview card after the opacity fix: *"I still have no
idea what the line graph or the numbers are telling me. For example, on the shot
attempts by defensemen section, I don't know what the 35 and 37 mean."* He wrote
the ruling that card was built from.

⛔⛔⛔ **AND THE MISSING THING WAS NOT A `%` SIGN. THE THREE ROWS LOOK IDENTICAL
AND ARE TWO DIFFERENT KINDS OF SHARE.** `level5`'s denominator is BOTH SIDES'
attempts (league 50% by construction); `dmen` and `slot` are shares of the club's
OWN attempts — and `slot`'s league figure happened to sit at 50% this season,
reading exactly like the one that is 50% by construction. Nothing on the card
said which was which.

⭐⭐⭐ **NOTHING IN 1,600 TESTS COULD HAVE SEEN IT, AND THE REASON GENERALISES:
EVERY TEST ON THAT CARD RECONCILES NUMBERS, AND THE DEFECT WAS THAT THE NUMBERS
HAD NO NOUNS.** A suite that checks arithmetic is structurally blind to meaning.
The repo already had the answer one module over — `archive.js::perGame` welds a
`noun` and a `what` to every published distribution, for exactly this reason —
and the preview card was built without it.

⭐ **THE GATE DERIVES THE ANSWER INDEPENDENTLY AND THEN READS THE PROSE.**
`denominatorOf` feeds each row's own `ofGame` a record whose two sides differ, so
"n is both sides" and "n is this club's" are told apart by ARITHMETIC; the
sentence must then match what the reducer does. Two paths, meeting only in the
test — which is the only shape that makes a check on copy worth anything. It also
requires BOTH kinds to be present, since a list exercising one kind makes the rule
untested.

## #51 — "SUBJECTIVE" IS A DEFECT, AND THE FIX IS THE MEASUREMENT, NOT A SOFTER WORD

2026-10-03. The preview said *"Which teams do better than this over a season is
mostly luck."* Kevin: *"we need to rephrase that sentence, since saying '....is
mostly luck....' is quite subjective, which we don't do."*

⭐ **THE WORD WAS A GLOSS ON A REAL MEASUREMENT AND THE MEASUREMENT WAS ALREADY
PUBLISHED.** A club's own figure for those rows does not hold steady between the
halves of a season; `settle.admission` says it would take more than 41 games —
more than half a season — before it did. The sentence says that now, and reads the
figure from the document rather than naming one. **When a judgement word appears
in copy, look for the number it is standing in for; on this site it usually
exists.**

⛔⛔ **AND NO BANNED-WORD ASSERTION. MINE WENT RED ON MY OWN COMMENT.** The first
draft of the gate was `doesNotMatch(html, /is mostly luck/)` and it failed
instantly — on the comment above it explaining why the phrase had gone. The page
ships its comments, so a scan for a string finds the prose ABOUT the string.
**Fourth instance of monitor-armed-against-itself, in a check written hours after
I wrote up the third.** The positive rules — the note states what was measured,
and it reads the figure from the published document — carry the whole claim.

## #49 — AN OPACITY THAT IS DATA LETS THE BACKDROP MASQUERADE AS THE MARK

2026-10-03. Kevin, on tonight's preview: *"definitely looks like something is
amiss with our calculations, or else I don't understand how to read the line
graphs."* Nothing was amiss with the calculations — the measure conserves to
exactly 50.00% over 7,872 club-games, and I checked that FIRST because it was the
claim he made.

The club bar's fill is `fill-opacity: games / need`. That ramp is Kevin's, it is
derived, and it is right. But on a PREVIEW in October the ratio is 1/35, so the
bar was painted at **three per cent** — and what a reader saw inside the outline
was the shaded band behind it. The band's edge then landed mid-bar as a crisp
colour step, and **a step inside a bar reads as a fill level**, which is the one
thing it was not. Confirmed before touching anything: the step is at x≈965px in
his screenshot and the band edge computes to x=970px.

⭐⭐⭐ **A MARK WHOSE OPACITY CARRIES MEANING COMPOSITES WITH WHATEVER IS BEHIND
IT, AND THE RESULT MEANS NOTHING.** Two correct designs — a trust ramp and a
measured backdrop — produce a third thing nobody designed. The fix is layering,
not either design: an opaque backdrop under the translucent fill. Ask of any
translucent element: **what is behind it, and could that be mistaken for its
contents?**

⚠️ **AND THE FIX CREATED THE NEXT ONE.** An opaque bar hides the band where they
overlap — and in this very card both bars lie across the band's lower edge, which
is exactly what the caption tells the reader to look for. A region that can be
occluded cannot carry a boundary; the edges are their own marks now, drawn last.
Same trap as the league tick, whose own comment already says *"it was invisible
because it was drawn FIRST. SVG has no z-index; paint order is document order."*

⛔⛔⛔ **AND `grep trackFor test/ tools/` RETURNED NOTHING.** 1,600 tests, fourteen
browser probes, and the one picture on the page a novice is sent to had **no check
of any kind**. ⭐ **Grepping the suite for the name of a drawing function is a
cheap way to find a blind spot, and I had never done it.** The new probe is pixels
on purpose: every structural fact about that markup was true while the picture was
unreadable.

⚠️ Three faults in the probe itself, all found by mutating it:
- **Its fixture put the league figure BETWEEN the two clubs**, because
  `leagueShares` sums over the clubs present and the fixture held only the two in
  the game — so four of six bars had ZERO WIDTH and it reported a pass on the rest.
- **Its canary ran at script-parse time, before the page had drawn anything**, so
  it removed nothing and subject and canary were the same page. This repo's canary
  shape in a THIRD costume: after one the CSP blocked (#…) and one that set only
  `display`, now **a canary that fires before the thing it breaks exists**. Hook
  the canary to the measurement, never to a clock.
- It demanded 24px of span and silently skipped every bar narrower than that.

## #44 — A RULING'S PREMISE CAN BE MINE, AND FALSE

2026-10-03. Kevin's ruling 7 approved a nightly commit of `data/measures.json` to
`main`. The reason I gave him: *"if the published document moves nightly and the
committed copy does not, `tools/measures_fresh.py` goes red every night."*

**It does not run nightly.** It runs in `derive.yml`, weekly, in the same job that
refreshes the copy. The red that justified the commit cannot happen. And the
commit creates a different one: refreshing that file cascades into 16 snapshot
banners, the health block, 7 built pages — all generated, all fine — plus the
hand-written arguments in `sentence.js` and `blocked.js` that
`test/quoted-figures.test.js` holds to the published figures. Counts like
*"1,567 of 3,946 games"* move every night and are SENTENCES, not generated.
`deploy.yml` runs gates before deploying, so the commit would have failed the
deploy it dispatched and left `main` red for Kevin.

⭐⭐⭐ **A RULING IS ONLY AS GOOD AS THE FACTS I HANDED OVER, AND I AM THE ONE WHO
CAN CHECK THEM.** He ruled correctly on what I told him. Before building on a
ruling, re-verify the claims I made to GET it — `grep` for where the check
actually runs, not where I think it runs. This is #43's shape pointed the other
way: there I hedged an absolute without checking the domain; here I asserted a
mechanism without checking the wiring, and it was load-bearing for a decision.

⭐ **BUILT AS RULED AND MADE SAFE, THEN FLAGGED.** The job regenerates everything
generated, runs `npm run gates`, and pushes only a tree that passes.

✅ **KEVIN CONFIRMED THE NIGHTLY COMMIT, and the cost I warned him about was
WRONG — measured, not guessed.** I told him it was *"~24 generated files of churn
a night"*. The first real run committed **2 files, 2 lines**: the measurement, and
the health block's timestamp. The 16 snapshot banners and the built pages did not
move, because they quote the archive's HEADLINE figures and only a census count
had changed. The commit only grows on a night when a figure a page prints actually
moves — which is the night you want a commit.

⚠️⚠️ **SO I OVERSTATED A COST WHILE ARGUING AGAINST A RULING OF HIS, AND THE
NUMBER WAS AVAILABLE.** Same shape as #43 and #44: a figure asserted from how the
mechanism looks rather than from running it. A cost offered as a reason to
reconsider a decision has to be MEASURED, because its only job is to move the
decision. His answer was immediate — *"having the learn pages up to a week behind
is a non-starter"* — and he was right on the product question regardless.

## #45 — THE FIX'S OWN CHECK REPRODUCED THE DEFECT IT WAS FIXING

2026-10-03. The defect: `of: d.n` is how many games the MEASUREMENT covers, and
six surfaces labelled it an ARCHIVE count — **two quantities over different
populations, one label.** The spec's one-line check, which I wrote:

    derive(catalog rows) == measures dataThrough == index dataThrough

`index.json`'s `dataThrough` is the newest game date over EVERY game held;
`fetch_nhl.py` says so in its own comment. 385 of the index's 4,639 games are
preseason, 41 more exhibition. The measurement covers the 4,213 in scope and
published. **Two populations, equated.** Measured: between 2026-09-26 and
2026-10-01 the newest game held was preseason 2026-09-26 while the newest in
scope was 2026-06-14 — three and a half months apart, both correct. The check
would have been red for all of preseason, and a red that is not a fault is an
alarm that gets switched off.

⭐⭐⭐ **WRITING THE FIX IS NOT PROTECTION FROM THE FAULT. The hour I best
understood this shape is the hour I rebuilt it.** Same as #38, where I disproved
a false open item and then made its mirror image inside the fix, twice. ⭐ The
tell to look for: an `==` between two documents. **Ask what POPULATION each side
counts before asking whether they agree.** The built check is equality where the
population is the same and a DIRECTION (`index >= measured`, because the index is
a superset) where it is not — and a test exists whose only job is to stop someone
tightening it back to the spec.

## #46 — A GATE SATISFIED BY THE COMMENT EXPLAINING THE THING IT CHECKS

2026-10-03. I asserted `/needs: ingest/` appeared in a workflow job. Mutating it
to `# needs: ingest` — a job with no chain at all, so the nightly measurement
would silently never run — **passed**: the text was still in the file. The job is
more comment than code on purpose, which makes it worse here, not better.

This repo had logged the shape twice in the OTHER direction (a comment quoting a
live monitor's pattern arms the monitor against itself; a dumped DOM turns a
comment into text a deploy gate judges). This is the third face: **prose
explaining a wiring fact accepted AS the fact.** Fix: strip comment lines first,
then assert the job still has a `runs-on:` so the strip cannot have eaten it, and
anchor every assertion to the start of a line.

⚠️ And two more from the same hour, both mine:
- **A TABLE GATE THAT SAMPLES SOME OF ITS ROWS.** The cross-language date check
  used seven specimen dates; mutating `September` to `Septembre` passed, because
  no specimen fell in September. One date per month now, and all twelve mutations
  verified. Any gate over a TABLE must read every row.
- **A STEP-OUTPUT REFERENCE TO A STEP THAT DOES NOT EXIST IS `''`, AND `'' != '2'`
  IS TRUE.** Deleting `id: sync` makes `needs.ingest.outputs.synced == '1'` false
  and the whole job skips forever — green, no error. Four gates written minutes
  earlier all passed: each checked the reference was THERE, none that it pointed
  at anything. Now generic over every workflow, asserting both the step exists
  and something writes that name to `$GITHUB_OUTPUT`.

## #47 — `git checkout <file>` TO UNDO A MUTATION, ON A FILE FULL OF UNCOMMITTED WORK

2026-10-03. Mid mutation-testing I reverted a `sed` with
`git checkout test/workflows.test.js` and destroyed ~170 lines of new tests I had
just written and not committed. The tell was in the next line of output: the
suite went from 12 tests to 7.

⭐ **MUTATE AGAINST A COPY, REVERT FROM THE COPY.** `cp f $SCRATCH/f.bak` before
the first mutation and `cp $SCRATCH/f.bak f` after each one. `git checkout` is
only safe on a file whose work is already committed, which during a build is
almost never true.

## #37 — TWO LISTS DESCRIBING ONE VOCABULARY ROT IN OPPOSITE DIRECTIONS AT ONCE

2026-10-02. `extract.py`'s `KNOWN_STOPPAGES` is what we have VETTED; `whistle.js`'s
`WHY` is what we can SAY. Two halves of one claim, and nothing compared them.

⛔⛔⛔ **BOTH HALVES WERE WRONG, IN OPPOSITE WAYS, SIMULTANEOUSLY.** Four keys were
vetted with no prose ever written — and **being on an allowlist is what stops a
value being REPORTED as unknown**, so those four went quiet in every run report and
stayed raw on screen. **Vetting without prose is strictly worse than never vetting
at all.** Meanwhile `skater-puck-frozen` had prose and no vetting, so a reason the
page explains in full was reported as unknown vocabulary 10 times in one season.

⭐ **THE RULE WAS ALREADY WRITTEN DOWN — AS A COMMENT.** `extract.py` says *"Prose
first, in `src/lib/layers/whistle.js`, then vetted here."* A comment describing an
order nothing enforced. **When you find a comment stating a procedure across two
files, that is a gate waiting to be written**, and the gap it is guarding is
probably already open. Check both directions: I would have written only the one I
was thinking about, and the other had been broken for months.

⭐⭐ **AND A PAIR THAT MUST AGREE IS ONE OBJECT, NOT TWO THAT MATCH.** The feed
splits reasons by side (`chlg-vis-off-side` / `chlg-hm-off-side`, the two
`net-dislodged` keys). Three times one half was worded and the other left raw.
Making them one object under two keys makes the relationship structural. ⚠️ The
test must assert IDENTITY (`assert.equal` on the reference), because `deepEqual`
passes on two objects that happen to agree — which is exactly the state being
made impossible.

⏭ **AND THE THIRD LIST IS THE ARCHIVE.** Both lists live in the repo, so the gate
cannot see a value neither has heard of. See #19 and [[guard-where-the-archive-is]].

## #41 — "WE HAVE NOT CONFIRMED THAT" IS A TODO, AND THE ARCHIVE OFTEN ALREADY ANSWERS IT

2026-10-02. `whistle.js` carried a note for months: *"`vis` ALMOST CERTAINLY MEANS
THE VISITING SIDE — the sibling keys are `home-timeout` and `visitor-timeout` — but
the name does not say so, because which bench challenged is not something we have
confirmed."* An honest refusal to claim what we could not support — and nobody ever
asked whether it could be supported.

Kevin's wording for a new card named the side. Rather than take the ruling alone, I
asked what the archive could say. **An unsuccessful coach's challenge draws a
delay-of-game penalty against the team that challenged, and the feed names it
`delaying-game-unsuccessful-challenge`.** Across 4,559 games: **214 of 214** such
penalties after a `chlg-hm-*` stoppage land on the HOME team, every `chlg-vis-*` on
the away team, no counterexample.

⭐⭐ **A "not confirmed" comment is a deferral with no trigger** —
[[feedback-development-discipline]]'s *a bug with a delay on it*, applied to
evidence. The right habit when writing one: say what WOULD confirm it. Here the
answer was one query away and had been for three seasons.

⭐⭐⭐ **AND THE STRUCTURAL LESSON: SHARING AN OBJECT IS A STATEMENT THAT A
DIFFERENCE CANNOT BE SAID.** The day before, I made `chlg-hm-*` and `chlg-vis-*` one
object under two keys so the pair could not drift — correct, and correct ONLY while
the side was unsayable. The moment it became sayable the sharing was a lie. The pair
is now held by DIFFERENCE instead: the two copies must agree in nothing but the side.
⚠️ Ask of every shared object: *what is it asserting is indistinguishable, and is
that still true?*

⚠️ A key that LOOKS like a sibling is not one when the ACTOR differs:
`chlg-league-*` would have printed *"challenged"* about a review the league started
itself. One line, and it would have been wrong.

✅ **AND A TEST BROKE, WHICH WAS THE TEST WORKING.** A Python test used `ice-scrape`
as its specimen of *forgiven but not vetted*; giving it words made it the wrong KIND
of value and the test went red. **A specimen chosen for a PROPERTY must fail when it
stops having that property** — one that silently drifts leaves the test green while
measuring nothing.

## #43 — I REACHED FOR "NOT QUITE ACHIEVABLE" INSTEAD OF CHECKING THE DOMAIN

2026-10-03. Kevin wanted no lag at all between the archive and the measurement. I
wrote: *"'There should never be a lag' isn't quite achievable — the derive takes
~40 minutes, and the archive can gain a game while it runs."* He replied: *"no
offense, but this is a cop out — we scheduled the derive, ingest, etc. in the
middle of the night... for exactly that reason. I don't buy it."*

**He was right, and it was wrong twice.**

⛔ **I imported an assumption from systems that are not this one.** "A job takes
time, so the world moves under it" is true of a continuously-updating service.
Hockey has a quiet window every single night: the last game ends ~01:30 ET, the
ingest fires 02:47 ET, the earliest possible puck drop is ~12:00 ET. **The archive
is static for ~10 hours by construction.** A job inside it sees a frozen archive
and the lag is ZERO, not bounded. The schedule had been built around that fact and
I had not looked at it.

⛔ **And the number was wrong anyway.** The 40 minutes is *pull raw* + *re-extract
4,600 games*. The MEASURE step runs over local extracts and is cheap — 0.4 GB, free
egress. Two different jobs welded together, and the welding was the only reason the
measurement was weekly.

⭐⭐⭐ **THE SHAPE: hedging an absolute is a claim, and it needs evidence like any
other.** "Not quite achievable", "there will always be some", "you can't fully
prevent" — these FEEL like engineering humility and are often an untested
assumption wearing it. Before writing one, check whether the domain actually has
the property that makes it true. ⚠️ A user who says *"I don't buy it"* about a
limit is usually telling you they know something about the domain that you did
not check.

⭐ **AND THE DOMAIN OFTEN ALREADY SOLVED IT.** The quiet window, the converging
14-day ingest window, `coverage` comparing the league's schedule to the archive —
all already built, all load-bearing for the answer, none of them in my head when I
reached for the hedge.

## #42 — TWO QUANTITIES, ONE LABEL, AND EVERY FIXTURE MAKES THEM EQUAL

2026-10-03, Kevin from the live site: *"Since we hold 21 games, we certainly
shouldn't say '8 games we hold'."*

`sitsIn` returns `of: d.n` — how many games the MEASUREMENT covers. Two panels
printed it as *"the N games **we hold**"*, a claim about the ARCHIVE. **The label
was wrong the day it was written and could not be observed**, because the two
numbers are equal for every reference class the code had ever used: a finished
season's measurement is complete. 2023 1400=1400, 2024 1398=1398, 2025 1394=1394,
2026 **21 vs 8**.

⭐⭐⭐ **THE RULING MADE IT VISIBLE; THE LABEL MADE IT WRONG.** When a change
"causes" a defect, ask whether it created the fault or merely reached it. Here a
weekly `derive` against a nightly archive only EXPOSED a sentence that had never
been true of anything but a complete measurement. Fixing the cadence would have
left the lie in place for the next gap.

⛔⛔ **AND THE TEST GAP IS THE SAME SHAPE.** Every fixture builds its
distributions FROM its fixture games, so held == measured in every test that
exists. **A mislabel between two quantities is invisible while every fixture makes
them equal.** The fix is a FIXTURE, not an assertion: one where the two
deliberately differ. Ask of any pair of quantities: *is there a fixture where
these differ, and if not, what claim about them is currently untestable?*

⚠️ **A BANNED-WORD LIST IS NOT THE RULE.** My first assertion only forbade "we
hold" and caught a second instance BY LUCK — that sentence said *"all 4,200 games
in the archive"* and happened to carry the phrase nine words later. The positive
form is the rule: **every figure must be LABELLED with what it is**, in the clause
that carries it.

⭐ **FIX THE CLASS, NOT THE SENTENCE.** Kevin quoted one sentence; sweeping
rendered prose for *a number adjacent to an archive claim* found **six surfaces**.
Grep the built pages, not the file you were pointed at.

## #38 — A SEASON IS NOT THE ARCHIVE (and I made #34's mirror image inside #34's fix)

2026-10-02. Having just written up #34 — an open item said `player-equipment` reached
readers and I disproved it — I reported the opposite with equal confidence: *"it is
never a primary stoppage reason."* Then Kevin said **sweep the whole archive**.

⛔⛔⛔ **It is primary 155 times across 149 games**, the single largest raw descriptor
in the archive. True of the 69 games of the current season I had counted; false of
the 4,559 I had not. I also wrote a code comment saying a sibling key *"has not
appeared in the archive"* — false when written, 6 occurrences.

⭐ **THE RULE: a claim about what the league has NEVER sent is only ever as wide as
what you counted, and the population must be in the sentence.** "Never" from one
season is not "never". Both my comments now carry the correction rather than the
claim. See [[verify-inherited-claims]] — and note that my own fresh measurement
deceived me exactly as an inherited doc would have.

## #39 — A DRIFT ALARM GOES QUIET AT THE MOMENT THE DEBT IS CREATED

Same sweep. All 13 reasons reaching readers raw were **already in
`data/vocabulary-seen.json`** — the ledger written where the whole archive IS walked.
Complete, accurate, and **no check had ever crossed it against the prose table**.

`derive.py` explains why it looked finished: *"the alarm is on DRIFT. Twenty-three
known values are not news; a twenty-fourth is."* ⭐ **Right for ingest, wrong for a
reader.** The ingest question is *did the league invent a word*; the reader question
is *did anyone ever write the word down* — and **a value stops being news the moment
it is forgiven, which is the same moment it starts rendering as a feed key.**

⭐ **Ask of every forgiveness list: what becomes TRUE about the product when a value
lands on it, and is anything watching THAT?** The fix is a declared, dated,
shrink-only exception list carrying each item's archive count, so the debt is visible
and a NEW value still goes red.

## #40 — A `sed` THE SHELL REFUSES STILL EXITS 0, AND THE STEP GOES GREEN

Same day, found by reading a **passing** deploy log. A guard I had shipped that
morning reads `og:description` back off the live page and fails on a digit. Written
with a `:` delimiter in a pattern containing `og:description`, so sed refused the
expression, substituted nothing, and `case "" in *[0-9]*)` matched nothing and
carried on. **A guard that read nothing approved everything**, in a step whose name
says it checks the share card.

⛔ Two halves, and both are needed: fix the delimiter, AND **make an empty extraction
a failure**. Also ⚠️ the sweep tool written that same hour reported two fields as
"✅ every one has prose" that it had never looked at — it read the league's field
names and the extract renames them. **Zero values, zero gaps, a tick.**

⭐ **THE GENERAL RULE: any check with an EXTRACTION STEP needs an assertion that the
extraction found something.** Parsing, grepping, field-reading, sweeping — the empty
result is indistinguishable from the clean result unless you say so out loud.

⚠️ **And the test I wrote for it was broader than its own name**, demanding a `-z`
guard on every `case` including one whose catch-all `*)` already made it safe. A
check that demands guards where none are needed teaches people to add noise, and the
next real finding arrives in a file full of it.

## #34 — AN OPEN ITEM IS A CLAIM, AND IT AGES LIKE ONE

2026-10-02. The top of `docs/status.md` said a stoppage reason absent from the
`WHY` table *"is on screen as a feed key right now"*, and named the fix. I was
one command from writing the copy when I checked the archive instead.

**It was false.** `player-equipment` is never a PRIMARY reason — it arrives only as
`rsn2`, the secondary one — and `rsn2` **has no reader**. The extractor carries it,
the layer publishes it, a test asserts it survives the reduce, and nothing renders
it, because Kevin had the secondary reason removed from the card weeks earlier.
Copy written for it would have been copy nothing shows.

⭐⭐ **A LAYER'S OWN HEADER IS NOT EVIDENCE ABOUT THE PAGE.** The item was argued
from `whistle.js`'s comment — *"a reason absent from this table still renders raw"*
— which is true of the FUNCTION and says nothing about whether any surface reaches
that path with that value. Same shape as #15. The question "does a reader see this"
is answered by rendering, or by counting what the archive actually holds.

⭐ **AND THE REAL DEFECT WAS BESIDE IT, BIGGER.** Counting instead: eleven OTHER
reasons reach readers raw, 47 of 2,857 stoppages across 69 games — `chlg hm goal
interference`, `home timeout`, `net dislodged offensive skater`. The 2026-09-21 fix
that gave three descriptors words wrote in its own comment *"the sibling keys are
`home-timeout` and `visitor-timeout`"* — **it named the sibling pattern and closed
one side of it**, leaving the keys it cited as evidence unworded (#17 again).
⏭ A list is the unit. Fix one member, report the LENGTH (#20).

## #35 — THE ONLY PLACE A COMMON LAYOUT IS STATED MUST NOT BE A RULE ONLY ONE SIBLING REACHES

2026-10-02, Kevin from the live site: the third of three buttons in one row did
not line up. All three boxes were identical; the LABEL in the third sat 5px from
its left edge against 89–102px.

The base rule declared no `display` at all, so the two always-present buttons took
the UA's `block` for a `<button>` — which centres its contents on both axes by
machinery no other display type has. The third is hidden until the horn, so **its
reveal rule HAD to name a display value**, and whichever it named was going to
differ from a default nobody had written down.

⭐ **THE SHAPE, GENERALLY: when a property is set only in the branch that reveals
one variant, that branch is silently also the only statement of the whole group's
layout.** The fix is to state it on the shared rule so the variant's rule has
nothing left to choose. ⚠️ Nothing in the suite can see this: it is a computed
style and a box, and the fake document has neither. See [[looking-at-pixels]].

## #36 — A CANARY THE PAGE'S OWN POLICY BLOCKS IS A CANARY THAT CANNOT SING

Same build. The probe written for #35 injected the defect as a `<style>` before
`</body>` and the canary **PASSED** — reported as "the check works" at exactly the
moment it did not. The page's CSP pins `style-src` to two hashes, so the injected
rule was refused and the canary measured an unmodified page.

⛔ Two rules came out of it: **strip the policy from BOTH copies**, so the only
difference between subject and canary is the rule under test; and **a canary may
not be a shorter version of the defect** — the first draft set only `display`,
leaving the live `align-items:center` applying to the one flex sibling, so it
would have rendered centred and passed even unblocked.

⭐ The general form: **a canary asserts that your instrument can fail. Anything
that can silently neutralise the injection — a CSP, a cache, a build step that
regenerates the file — breaks that assertion without breaking the run.**

## #29 — A TEST CAN ASSERT THE DEFECT, AND PASS

2026-10-01. A summary panel opened at the horn and never returned: reach the end,
step back, come forward again and it was gone for the life of the page. Kevin
found it inside an hour doing the ordinary thing.

The flag was `sumShown`, set on the FIRST arrival. **The comment above it argued
for DISMISSAL, the code implemented SHOWN ONCE, and the name was a third thing
again.** And the test — mine, written minutes earlier — asserted that returning to
the horn left the panel shut, and was green.

⭐ **THE TELL: the test and the code agreed with each other and with nothing else.**
It was written FROM the implementation, so it could only ever restate it. See
[[name-the-path-to-the-expectation]]: if the expectation has no source but the code,
the test is a mirror. When a comment and the code it sits on describe different
rules, **the comment is usually the requirement** — write the test from the comment.

## #30 — A RULE IN TWO PLACES, ONLY ONE OF THEM LOAD-BEARING

Same day. The shootout refusal went into `endsNoteShowing` AND into the page's own
branch — and the page branches first, so deleting the predicate's copy killed no
test. A mutation survived in code that looked guarded.

⭐ The fix is not to delete the unreached one: a predicate should be right for its
NEXT caller. The fix is to **exercise it directly**, with a unit test, so it cannot
quietly stop being right. ⚠️ And the tell was available for free — the mutant
survived while three others died.

## #31 — A PICTURE CHECKED AGAINST ITS NEIGHBOUR IN THE SAME PICTURE

Six rows each drew a rail, a band (the middle half) and a dot. The first test
asserted each dot sat on the correct SIDE of its own band — and a mutant pinning
every dot to the band's LEFT EDGE passed, because the edge satisfies "inside the
middle half" and "not to the right of it" simultaneously.

⭐ **The expectation had no path that did not run through the drawing itself.** The
repair is the published document: position computed from the archive's own
`min`/`max` and the count printed in the row, neither supplied by the page. Three
mutants die on it now, each naming the arithmetic.

## #32 — ADDING A SECOND NUMBER TO PROSE A GATE READS

The verdict sentence carried ONE figure before `of`; Kevin's compromise gave it two
— *"it won 848 and lost 531 of 1,379"*. `tools/browser/verdict-dot.mjs` greps that
prose on the LIVE site to check the dot against the figure.

⛔⛔ **A pattern drifting one noun to the left would still parse**, still return a
plausible count and a plausible n, and draw the dot at the COMPLEMENT — 61.5% where
the sentence says 38.5%. Right-looking and exactly backwards. This is the same file
whose rewording stopped a deploy on `0c8dc6f`.

⭐ Two defences, and both are cheap: keep the clause the gate reads VERBATIM inside
the new wording so the anchor moves one word and no further, and make the guard
**name the other number and refuse to equal it**.

## #33 — A RULE EXPRESSED IN GAME TIME, MET A STRETCH WITH NONE

The ends note stands down once ninety seconds of play have passed since the period
began. **The shootout clock does not run** — every attempt carries the same second —
so the window never closed and a note written to show briefly showed on every frame.

⭐ The shape: a threshold in units the domain usually supplies, applied where the
domain supplies none. Ask of any time-boxed rule *which parts of this game have no
time*, and of any per-event rule *which parts have no events*.

## #28 — A FALLBACK WRITTEN FOR *ABSENT* DOES NOT COVER *THIN*

2026-10-01. `measures.json` publishes a per-game histogram for every season the
archive holds, with no minimum n. Two surfaces read it and both asked only
**does the key exist**. That was a correct reading of the wrong question for
exactly as long as the season in progress had no games in the archive — and the
derive Kevin dispatched gave 2026 a key built from **eight** games. The live
overlay went from *"the middle half of the 1,394 games we hold for the 2025-26
season"* to *"the middle half of the 8 games we hold for this game's season"*,
with every test green, because every fixture described a FINISHED season and
nothing described the transition.

⭐ **THE SHAPE: a branch whose condition is a PROXY for the thing you mean.**
"Has a key" was standing in for "is a usable reference class". A proxy holds
until the world produces the case that separates them, and a season opening is
exactly that case — the same family as [[season-restart-traps]]'s *when the
newest game changes kind, every rule that picks "the newest game" is a suspect*.

⭐ **THE FIX CARRIED NO NUMBER, AND THAT IS WHY IT WILL HOLD.** A minimum n would
have been a threshold with no source. A season is over when the archive holds a
game from a LATER one — a fact the published document already states in its own
keys. The current season is always the highest key, so no future October needs
an edit.

⚠️ **AND THE FALLBACK'S OWN SELECTION HAD TO BE FILTERED THE SAME WAY** — with the
unfinished season refused as "own", it was still a key, sat at distance ZERO from
itself, and the nearest-season sort would have chosen it every time. **A fix that
refuses a value in one place and re-admits it in the ranking next door has not
removed the defect.** Check every path that can reach the rejected value.

⭐ **A GUARD THAT ONLY REFUSES IS CHEAP TO SATISFY.** Each test boots twice off ONE
histogram with a single difference — whether a later season key exists — and pins
BOTH sides. The refusal half alone passes forever on a page that simply never
prints the comparison; see [[name-the-path-to-the-expectation]].

⛔ **AND RESTORING THE SOURCE IS NOT RESTORING THE BUILD.** After reverting a
mutation in `src/lib/`, `/* MUTANT */` was still baked into both committed HTML
pages — the builders had run. The restore is source + `npm run build`, confirmed
by grepping the built pages. Companion to the `git checkout --` lesson below.

## ⏭ READ THIS BLOCK AND STOP — the rest is 141 sections of evidence

⚠️ **THIS FILE IS 211KB AND APPEND-ONLY.** It is the corpus, not the lesson. Everything
that generalises is here; below is the case law, worth opening only when a specific shape
is in question.

**THE ONE RULE: a check that tests a narrower claim than it announces.** Every entry
below is an instance. The recurring ways it happens, in the order they have cost most:

1. ⭐⭐⭐ **A mutation is not evidence until it lands WHERE THE CHECK IS LOOKING.** Assert
   `count == 1`, mutate to a UNIQUE marker, check the build exit code. (Editing the
   source when the test reads the BUILT page is the commonest version — twice in one day.)
   ⛔⛔⛔ **AND `git checkout --` IS NOT AN UNDO FOR A MUTATION.** 2026-09-30: I reverted
   two files whose REAL changes were not committed yet, so the mutation and the feature
   went together — the next two "mutations" then ran against an empty feature and both
   "fired" for the wrong reason. Restore from a FILE BACKUP taken before the first
   mutation; git's undo is only an undo for work git already has. The tell was the pass
   count dropping, not the mutation result, which looked exactly right.
2. ⭐⭐⭐ **Verifying a proxy is not verifying the thing.** An `[hidden]` attribute is not
   invisibility; a box that measures 0x0 satisfies every judgement about it; `textContent`
   reports hidden text. Read the computed value. ([[looking-at-pixels]])
3. ⭐⭐ **A state must NAME THE SUBJECT it needs and go red if it never found one.**
   Written after a probe sampled a faceoff to test figure code; violated four days later
   by a check that measured a hidden box for a week.
4. ⭐⭐ **A test whose SPECIMEN is a real value is hostage to the rule it tests** — `LIVE`
   as the example of an unreadable state, `rink-repair` as a forgiven one. Use a string
   the world can never send.
5. ⭐⭐ **A test can demand the WRONG ANSWER and pass forever.** Two found so far. Watch
   especially for behaviour stated as a REASON for something else — a premise nobody
   re-reads as a claim.
   ⛔⛔⛔ **AND A VERSION STAMP ONLY REACHES WORK THE RUN ACTUALLY DOES.** 2026-09-30/10-01:
   `extract.SCHEMA` exists so "a field added without bumping it never reaches the
   archive". The half nobody wrote down is that bumping it does not reach the archive
   either — the nightly derives only what it FETCHED (`derived 64, absent 4558`), and a
   game that reads `unchanged` is never re-derived whatever the stamp says. The fix
   landed on new games and left every old one untouched, and **I told Kevin the morning
   run would clear it without checking.** Before claiming a migration applied, read the
   artefact back: `ex` on a game that was NOT in the window.
6. ⭐ **The ruler is wrong more often than the subject.** Assume the instrument is broken
   first: three probes in one day announced clean measurements of a dead page.
   ⭐⭐⭐ **AND A FEED'S FIELD CAN BE WELL-FORMED AND NOT BE ABOUT WHAT YOU THINK.**
   2026-09-30: the NHL's `situationCode` on `game-end` parses perfectly and describes the
   sheet AFTER the whistle — `0440` read as "both goaltenders pulled, four a side", which
   put a pulled-goalie sentence under the rink and labelled 3-on-3 overtime "4-on-4". I
   reported that label TWICE as evidence the new frame worked. **The tell was that it
   disagreed with its neighbours**: 13 of 25 games differ from the last play, with values
   like `0101` that are not hockey at all. When a field is parsed rather than displayed,
   compare it against the same field on the events around it before trusting it.
7. ⭐ **A cost measured on SYNTHETIC data measures the synthesis**, and always **check
   which WAY an error points** — the flattering direction is the one to distrust.
8. ⭐⭐ **A FIXTURE IS A SECOND IMPLEMENTATION OF THE PRODUCER'S CONTRACT, and nobody
   diffs the two.** Test the input step and the consumer step and the transform BETWEEN
   them can be missing entirely, with both suites green: the consumer's fixture simply
   writes the shape the producer never emits. Cure: one test per published document that
   asks the real producer for it. See §139, 2026-09-23.
9. ⭐⭐⭐ **WHEN A DOC AND THE CODE BOTH STATE A METHOD, DIFF THE NUMBERS THEY PRODUCE.**
   The doc specified centring, the code argued its way out of it in a comment, and the
   disagreement was PRINTED in both files for weeks — three counts where two matched and
   one did not. Nobody compares a doc's table to a published document. **Two numbers that
   should be equal and are not is the cheapest defect signal in the repo, and the matching
   ones are what make the mismatch meaningful.** See §140.

21. ⭐⭐⭐ **A FILE IS NOT A SINGLE VOICE — two comments in one file disagreed for
   eighteen days, 2026-09-28.** `zonestart.js` says *"⛔ THE UNCONTROLLED TABLE MAY
   NOT BE QUOTED ON A SURFACE"* and, forty lines below it, *"⏭ the exact match is
   `census.faceoffZone` … the door moves."* The second was copied into
   `docs/status.md` as a planned build and stood there for four days. ⭐ **When a
   note PLANS work, check it against the rules stated ABOVE it in its own file.**
   Shape #9 — *when a doc and the code both state a method, diff what they
   produce* — with both statements inside one file, which is the version no
   cross-file check can reach. ⭐⭐ And the plan was not merely wrong: it was
   pointing at a real gap (*the layer has no figure of its own*) and wrong about
   the remedy. **A stale plan can be right about the symptom and wrong about the
   cure, and the symptom is what makes it survive review.**

22. ⭐⭐ **WHEN TWO NUMBERS DISAGREE ON ONE SCREEN, ASK WHETHER THEY SHOULD BE
   EQUAL BEFORE MAKING THEM EQUAL, 2026-09-28.** A panel printed *"the 1,394 games
   we hold for the 2025-26 season"* and, one line below, *"Counted over 4,192
   games."* The tempting repair is one number. It would have been wrong: the lead
   is season-scoped because pooling seasons moves a game's rank by 12.5 places
   against a random-draw p50 of about 5, and the sections are archive-wide.
   **Equal numbers would have meant a measurement re-scoped to match prose.** The
   repair was to make each say what it is the population OF.
   ⭐ The defect was a BARE COUNT — a figure attached to no subject, so the nearer
   sentence claims it. ⚠️ And the check holds the STRUCTURE (two populations, each
   naming its subject, still different) rather than judging the reading, and says
   so in its own header — see the narrower-claim rule at the top of this file.

23. ⭐⭐⭐ **CLOSURE HAS TWO DIRECTIONS AND ONLY ONE WAS GATED, 2026-09-28.**
   `test/lib-closure.test.js` checks that a page inlines everything its modules
   NEED — a missing one is a clean build and a render-time throw, which is why it
   exists. Nothing checked the reverse: that everything a page inlines is needed.
   **An unused module is not WRONG, only heavy, so no correctness gate can see
   it.** `index.html` and `calendar.html` each carried the whole of `archive.js`
   plus its two imports to call a one-line predicate — 18.7KB and 18.6KB gzipped,
   23.6% and 35.5% of two pages.
   ⭐⭐ **AND THE DOCS ASSERTED THE ANSWER IN THE WRONG DIRECTION**: *"code neither
   page currently executes."* The front door executes it. The only way to find out
   was to DELETE it and watch the page throw `inScope is not defined` — reading
   the imports said nothing, because the page's own inline script was the caller.
   ⭐ **A property nothing asserts is a property you can only learn by breaking
   something.** When a gate enforces one side of a two-sided relation, ask what
   the other side would look like if it were violated — and whether anything at
   all would say so. See [[work-door-over-the-rink]] for the pair of gates.

24. ⭐⭐⭐ **A DECLARED BLIND SPOT IS HONEST; AN UNDECLARED ONE READS AS COVERAGE,
   2026-09-28.** `prose-constants.test.js` states in its own header exactly what
   it cannot see — *"the anchor is the UNIT; a bare 33 is not seen"* — and that
   limit is fine, because a reader of the file knows to look elsewhere. It had a
   second limit it never stated: a quantity split across a string concatenation
   (`'… ours — 33 '` + `'feet from the net…'`) exists only in the join, and
   nothing in the repo reassembles one. Two typed constants sat in that gap for
   weeks under a green gate whose whole subject is typed constants.
   ⭐⭐ **THE FIX IS TO REFUSE THE SHAPE, NOT TO RECONSTRUCT IT.** Joining adjacent
   literals means parsing expressions, and a half-built joiner reports
   confidently about text it assembled wrongly — the failure `lib-closure` and
   the clock-sweep net both paid for. The rule became: a number and its unit may
   not sit on opposite sides of a `+`. Always decidable, and the fix at every
   call site is to move one space. ⭐ **When a scan comes back clean, ask what
   shape of the thing it is looking for would not survive its own tokeniser.**

25. ⭐⭐⭐ **A COMMENT THAT QUOTES A LIVE MONITOR'S PATTERN ARMS THE MONITOR AGAINST
   ITSELF, 2026-09-29.** `tools/browser/watch-a-game.mjs` decides whether a
   deployed page booted by grepping the game line out of a **dumped DOM** — where
   comments are text. A comment I wrote explaining that parser quoted its regex
   and the joining word verbatim, so the parser matched THE COMMENT, read a
   sentence containing the joining word, and would have reported every dead page
   as healthy. Caught by `shell.test.js` before it shipped.
   ⭐⭐ Third spelling in one day of **a scanner that reads the explanation as
   data** — the other two were my own probes (a regex counting `<h1>` inside CSS
   comments, on a page that inlines its own source; a sweep flagging
   "shots-on-goal share" as a machine identifier). The new half is that the
   reader here was **production monitoring**, not a test. ⭐ Describe a live
   pattern in words; never paste it into a file that pattern will be run over.

26. ⭐⭐ **A CHECK THAT CAN ONLY PASS IN CONDITIONS THAT EXPIRE, 2026-09-29** —
   shape 10 in its other direction. `preview-page.test.js` asserted the page says
   *"the regular season starts 29 September 2026"* and never pinned its clock. On
   29 September the season started, the page correctly stopped promising a start
   date, and the check went red **against right code**. ⭐ A test whose subject is
   a BEFORE state must own the instant it runs at — the harness had taken a clock
   argument since the test directly below it was written, and this one never
   passed one. It read as green for as long as hockey was out of season.

27. ⭐⭐ **THE FIX CAN BREAK THE THING IT EXPLAINS, 2026-09-29.** The goal ticks on
   the scrubber were unnamed, so a caption went under the bar — inside
   `.scrubwrap`, which is the box `.gticks` is positioned against at
   `bottom:3px`. The caption made that box 28px taller and pushed every tick 28px
   down, **off the bar and onto the caption**: measured at 979–988 against a bar
   ending at 973. ⭐ Ask of any element added to explain another: *what is the
   explained thing positioned against, and did I just change it?* The cure was a
   sibling; the gate holds the CONTAINMENT rather than the pixels, because the
   containment is the cause and is visible in markup.

18. ⭐⭐⭐ **A TEST THAT STEPS AROUND A BEHAVIOUR HAS DECIDED TO TOLERATE IT, 2026-09-28.**
   `renderWork` returned early at `at < 0` — the frame every replay OPENS on — so `How
   we counted` was a blank box with a Hide button in the state a careful novice meets
   first. My own test had carried the sentence for weeks, in the file that found it:
   *"a panel opened on the pre-game frame is empty by design — and three assertions
   about its contents failed for that reason before they could say anything."* Three
   assertions hit the defect and the repair was to move the playhead past it.
   **"By design" was doing the work of a decision nobody made.**
   ⭐ **THE TELL IS A WORKAROUND WITH A JUSTIFICATION ATTACHED.** When a test has to
   avoid a state to make its assertion, ask whether the STATE is right — not whether
   the assertion can dodge it. Nothing had to be invented to fix this one: the early
   return was over-broad rather than load-bearing, which is the usual shape.

19. ⭐⭐ **WHEN A CHECK COMPARES TWO LISTS, ASK WHAT THE THIRD ONE IS, 2026-09-28.**
   `measure.test.js` asserted the SELECTOR's lens ids equal the RECORD's — both six,
   both right — while the PUBLISHED TABLE carried five, so one layer of six had no
   archive answer for eighteen days. Three lists in the loop and only two ever compared.
   ⭐⭐ **AND THE TYPED LIST WAS A REPAIR'S TWIN.** *"The list is asked of the reducer
   rather than typed"* had been applied four days earlier — to the file the defect was
   found in — and the identical shape survived one directory away in `archive.js`.
   **A repair belongs to a CLASS, not to a file: grep for the shape before closing it.**

20. ⭐⭐⭐ **A STOP AT THE FIRST ITEM CANNOT REPORT THE LENGTH OF THE LIST, 2026-09-28.**
   The nightly halted on the first unknown penalty descriptor, so every drift report
   was a report of ONE. Four nights were spent fixing one word each and concluding the
   vocabulary had drifted by one word. The halt came off on 09-25; the first
   archive-wide sweep under the new contract reported **twenty-nine**, all of them
   already in the archive — `spearing`, `checking-from-behind`, `illegal-check-to-head`,
   ordinary regular-season infractions sitting in three full seasons, never vetted.
   ⭐ It also ANSWERED a question a comment had asked in the wrong direction: *"either
   the feed spells it differently or the league changed descriptors, and the second
   means more are coming."* They had already come. What was missing was never the
   words — it was the COUNT. **A guard that aborts on its first finding is an alarm
   with no dial: it can tell you something is wrong and never how much.** See also
   [[ingest-delivery-target]] and [[guard-where-the-archive-is]].
   ⚠️ Measured before fixing, so the size is on the record: 175 games sampled, 1,274
   penalties, 8 with no prose — 0.6% of penalties, 4.6% of games.

15. ⭐⭐⭐ **A DOCUMENT THAT ASSERTS A BEHAVIOUR THE PIPELINE DOES NOT HAVE — and the
   tell is that you fixed the same symptom three times, 2026-09-25.** Two files said
   derive's drift alarm fires *"after publishing"*; `ingest.yml` ran derive as an
   ordinary step, so exit 1 halted the job before the sync and the archive did not
   publish for 31 hours. The claim was TRUE OF THE FUNCTION and false of the system
   around it — the hardest kind to see, because the code you are reading does exactly
   what the comment says.

   ⛔⛔ **THE RECURRENCE IS THE SIGNAL AND I MISSED IT THREE TIMES.** It halted on
   09-19, 09-21 and 09-23. Every fix touched the vocabulary files and NO WORKFLOW:
   the recurring EVENT (a new word) was handled correctly, and the recurring COST (a
   stale site) was paid without being examined. ⭐ **Ask of any second occurrence:
   what did I fix, and what did I pay? If the answer to the second is "the same thing
   again", the fix was to the event and not to the cost.**

   ⭐ And the same exit code meant the OPPOSITE thing in the neighbouring workflow,
   because `| tee` under the default shell reports tee's status — so the weekly alarm
   had never fired once. Two implementations of one contract, neither matching the
   doc, and the fix for the pipe half was written out thirteen lines below the step
   that needed it, applied to its neighbour. See [[deploy-cloudflare]].

   ⭐⭐ **THE GATE THAT CLOSES IT IS ABOUT ORDER, because order is what was wrong.**
   `test/workflows.test.js` compares the step index of the alarm against the step
   index of the sync, in both files. It also reads every workflow for a status
   swallowed by a pipe — and found two more live instances in `deploy.yml` within a
   minute of existing.

13. ⭐⭐⭐ **THE NARROWER-CLAIM RULE APPLIED TO THE CHECK YOU ARE WRITING RIGHT NOW,
   2026-09-24. Four instances in one afternoon, three of them inside checks written
   that same hour.** The rule is not a thing that happens to old tests.

   - *"a printed figure does not carry a description of its own"* read `printed()`'s
     OUTPUT — which is built field by field, so a typed `count` could never appear
     there. It reported the rule as kept while the rule was broken. **Read at the
     place the rule is about**: the table, not the projection of it.
   - `test_one_statement.py`, after its first fix, counted "any reference in a string
     literal" — and the door map I had just added names every placeholder, so *"a
     figure is printed by nothing"* **could not fire in any condition this suite runs
     under.** Shape 10 created by the very edit meant to repair the check.
   - Two tests announced *"the Learn More row renders a link per card"* and scanned
     every `<a href=` in the PANEL. A second row of links made them red — the same
     defect arriving as a FALSE ALARM, which is the lucky half of it and the only
     half that announces itself.
   - A mutation harness reported *"NOT CAUGHT"* for a mutation the BUILD had refused:
     it ran `npm run build`, ignored the exit code, and tested a stale page. Same
     shape as the `git add &&` defect, third spelling.

   ⭐⭐ **THE ONLY THING THAT SURFACED ANY OF THEM WAS MUTATION.** Two of the four were
   found by the mutation the gate was written for and would otherwise have shipped
   green. A gate nobody has mutated is a gate nobody has read.

14. ⭐⭐⭐ **BUILD A CHECK THAT IS NOT CIRCULAR, OR ADMIT THE OTHERS PROVE ONLY THE
   RENDERER.** Twelve "show the work" doors were checked by tests computed from the
   same table the builder writes the doors from. Every one passes with every door
   aimed at the wrong figure — and a door that resolves and describes a DIFFERENT
   measurement is worse than no door. The check that works reads the two ends
   INDEPENDENTLY: the numbers off the built page (Python substitution) and the
   numbers behind the door (JavaScript `methods()`), and requires one in common. It
   caught a real mis-aim within the hour: three measurements share the word "slot"
   and 46.7% would have opened on *r = 0.72 over 38 games*. ⚠️ Its one declared
   exception carries a check on the REASON for the exception, not just the exception.

10b. ⭐⭐⭐ **AND ITS SHARPER TWIN, 2026-09-24: A CHECK WHOSE OUTCOME NOTHING IN THE
   REPO CONTROLS.** The `stalled` fixture built an index at exactly
   `Date.now() - 4 * 86400000` and asserted "4 days ago". `ago()` floors on 24
   hours, so exactly four days sits ON the boundary: it held only while the render
   instant was >= the module-load instant, and the wall clock is not monotonic. Red
   under clock-sweep and green on identical code **in the same UTC minute**. The
   sweep found it and the sweep cannot fix it — no timezone makes an unpinned delta
   safe. ⭐ **Ask of any fixture built by arithmetic: what is the MARGIN, and who
   owns the quantity it is measured against?** Pin the instant, then put the offset
   in the middle of its band, not on the edge. ⛔ And the net for it taught its own
   lesson: the first draft stripped comments so the token could be found in code
   alone, and **desynced on a regex literal containing a double quote**, swallowing
   ninety lines and reporting two clean files. *A check that needs a parser it does
   not have reports confidently about the wrong text.* It classifies LINES now.
   See §142.

10. ⭐⭐⭐ **A CHECK THAT CANNOT FAIL IN THE CONDITIONS YOU RUN IT UNDER.** Not "flaky" —
   **unfalsifiable**. A test asserting a fixture three hours out is "tonight" could not
   fail for twenty-one hours of every day, so running it at 2pm proved nothing about it,
   and it survived from the day it was written until the first deploy that landed after
   nine at night. Ask of any check that touches a clock, a timezone, a locale or an empty
   population: **what would have to be true for this to go red, and have I ever been
   there?** Then make it true once, on purpose. `tools/clock-sweep.sh` is the standing
   net for the time-of-day case. See §141.

11. ⭐⭐⭐ **A CHEAP PROXY STANDING IN FOR THE REAL MEASUREMENT, AND ITS OUTPUT
   REPORTED AS THE FACT.** Three in one day, 2026-09-24, all mine, all stated to
   Kevin as verified: `len()` of a dict in `learn-figures.json` reported as "the
   rule pages carry 7–16 figures" — **those are a DIAGRAM's keys**, and five of
   six rule pages carry no figures at all; a regex for `%` and thousands
   separators reported as "6 figures" where there are **17**, because it saw no
   small integers; and `GET /workers/scripts` returning 200 reported as "not a
   permissions problem", which is Workers Scripts **Read** where the deploy needs
   **Edit**. ⭐ **Before quoting a count, open the thing you counted.** The cure
   that worked: substitute every figure with a unique marker, rebuild, and grep
   the BUILT pages — a measurement that cannot be satisfied by the wrong object.

12. ⭐⭐⭐ **THE FLATTERING DIRECTION, APPLIED TO AN ABSENCE.** [[verify-inherited-claims]]
   says a disagreement has a direction and I take the one that flatters. On
   2026-09-24 there was no disagreement — there was a SILENCE, two days with no
   scheduled ingest run, and two readings fitted it: *the scheduler is broken*
   and *I edited the schedule yesterday*. I took the one that made the build I
   was about to start urgent, and wrote it into three files and a commit message.
   My own commit explained the silence. ⭐ **An absence is where this is hardest
   to catch, because there is no second figure to argue with.** The check not
   run: `git log` on the file, before blaming the platform that reads it.

⛔ **Everything in this repo was written by CC.** "An earlier author" is never the right
phrase — [[feedback-you-wrote-all-of-it]].

---

## ⛔⛔⛔ 2026-09-11 — THE RULE GOT ONE NOTCH STRICTER, AND FOUR MORE OF MINE WERE VACUOUS

### ⭐⭐⭐ A MUTATION IS NOT EVIDENCE UNTIL IT LANDS **WHERE THE CHECK IS LOOKING**

The old rule was *"a mutation that produces no failure is not evidence until you
show the mutation LANDED."* Not enough. `nameOf(g.a) + ' at ' + nameOf(g.h)`
appears **THREE times** in `build_index.py` — hero, calendar, one more — so
`s.replace(old, new, 1)` mutated the calendar while I was testing the hero, and
the `grep -c` I used to confirm it matched an *unrelated* occurrence. Reported as
landed, subject untouched: **a test that could not fail looked like one that
could.**

**THE PROCEDURE:** assert `s.count(old) == 1` before writing · mutate to a
**unique marker** and grep for THAT · check the build's **exit code** (a failed
build leaves the previous artifact and the stale page passes) · and `npm run
build` between edit and test, because the tests read the **BUILT** page.

### ⛔ FOUR OF MY OWN CHECKS, VACUOUS, ALL FOUND BY MUTATING

1. **A length check markup could satisfy.** `h1[1].length > 60` on raw inner
   HTML — a new `<span class="by">` handed it 29 characters of *tag*. Replaced
   with the properties the 60 stood in for (ends as a sentence, ≥8 words, ≥2
   sentences). ⭐ **And lowering/raising such a number to suit is the same defect
   as the nav-parity `>= 5` floor**, which was a cache of the code.
2. **"The front door says hockey" — the FOOTER already passed it.** The legal
   line has always said "the National Hockey League". **It would have passed on
   the exact defect it was written for.**
3. **A strip test that went red for the WRONG REASON.** Adding `hidden` to the
   section broke my `<section class="learnin">` regex rather than being detected.
   *A check that goes red for the wrong reason is one refactor from going green
   for the wrong reason.*
4. **A scan that could not tell code from words about code — AGAIN.** My
   `var when` shadowing guard failed against the FIXED code, because the comment
   explaining the fix contains `var when`. `hero-loop.test.js` already strips
   comments for the identical reason.

### ⭐ AND WHEN A MUTATION SURVIVES, ASK WHETHER THE MUTATION WAS VALID

Two survived and only one was a gap: swapping `__SHIFT_N__` for `__SHIFT_PER__`
was **allowed correctly** — `__SHIFT_PER__` IS on that card. The other was real:
deleting a denominator left two bare rates and every general assertion green,
because *"a share with no base rate loses the argument"* cannot be expressed as a
count of numbers. Pinned on SHAPE (a figure in the thousands) so re-deriving moves
the numbers without touching the check.

### ⛔⛔ AND A NAME WITH A RULE ATTACHED IS SPOKEN FOR — THE WARNING EXISTED

I took `class="lede"` for a new container. The shared stylesheet has carried
`.lede{max-width:62ch}` all along, so the grid capped at 662px of a 1240px row
and the hero card was pushed **527px** down the page — **with every test green.**
`build_main.py:54` says *"NOT class=\"lede\" -- that name is spoken for"* and
`render-notes.test.js` forbids it **on the game page only**, so the guard that
knew about the name was reading a different file while the shared RULE did the
damage. ⭐ **A guard scoped to the page where a defect was first paid for does
not cover the rule that caused it.** Widen to the surface the rule ships on.

### ⚠️ AND A VERIFICATION COMMAND THAT MEASURED AN EMPTY STRING

`curl -sS --fail https://<site>/game.html` → **exit 0, ZERO bytes.** Cloudflare
Pages 308s `.html` paths to the extensionless form, 308 is not a failure, and
without `-L` there is no body to fail on. **Use `-sSL`.** ⭐ The repo's own deploy
gate was checked rather than assumed and already does.

---

## ⛔⛔ 2026-09-10 (later) — THE SHAPE THAT APPEARED TWICE IN ONE HOUR

**AN ASSERTION THAT A VALUE *APPEARS* IS ALMOST NEVER THE CLAIM BEING MADE ABOUT
IT.** The blue-line card's first guard asserted both figures were present in the
blurb; a card with the two of them **swapped** passes it perfectly, while telling
a reader that defending a zone produces nearly twice the attempts. Caught only by
mutating the copy. The score-effects card's guard was written knowing it, and its
three figures are each tied to their subject by name.

⭐ **Present-ness is what a check degrades to when the assertion is written from
the OUTPUT rather than from the claim.** Both drafts were written by looking at
the rendered card and asking "what is in it", instead of asking "what would a
wrong version of this look like". The second question is the test.

⭐ **AND THE CONTROL FOR A GUARD THAT CANNOT FAIL.** A cross-table check
(`endZone` against `faceoffZone`) held only because no painted faceoff dot lies
between |x| 25 and 60 — so moving the code's end-zone cut from 60 to 25 changed
nothing and the guard was decoration. The fix was to MANUFACTURE the failure: a
synthetic draw at x=40 that the two tables must disagree about. *When a mutation
lands nowhere, the guard needs a control, not a shrug.*

## ⛔⛔ 2026-09-10 — A TEST THAT COULD NOT PROVE ITS OWN NAME, because TWO guards cover it

`census.pace` got a check called *"the pace population is corsi's, not a type
test"*. Swapping `isAttempt(i)` for a literal type test left it **green** — the
block's own `e.pt !== 'SO'` wrapper already excludes the shootout, and outside the
shootout corsi drops no event carrying an attempt type. **The two guards are
redundant, so no single mutation can fail it, and only removing BOTH does.**

⭐ **THE FIX IS THE NAME, NOT THE TEST.** The composite claim — *no shootout
attempt may reach these rates, however many guards it takes* — is worth
asserting. Wearing the narrower name is the project's dominant failure mode, and
it is the exact shape `census.shooter`'s own population check shipped INERT in
one day earlier. ⚠️ **Redundant guards make a test unfalsifiable one mutation at
a time. Mutate the pair.**

## ⛔ 2026-09-10 — A GUARD WITH THE BUG IT EXISTS TO CATCH, INSIDE IT

A new check forbade two learn cards opening the same frame, with the ruled
icing/faceoff pair as the exception. It **sorted the pairs it found and compared
them against an unsorted literal**, so the exception never matched and it
reported the one collision this project deliberately keeps. Third instance of
*over-broad or mis-normalised pattern inside the very guard against it* — the
others were the destructuring hole-watch matching an indented `const {ab, own,
opp}`, and a shadow scan counting function-locals as top-level.

## ⛔⛔ 2026-09-10 — A MUTATION THAT TESTED NOTHING, TWICE, FOR TWO DIFFERENT REASONS

1. **Wrong file.** Mutated `census.js` to prove a bundle-collision guard could
   fail. `census.js` is not in `LIB`, so the guard correctly ignored it and the
   silence was mine, not the check's.
2. **Wrong artifact.** Mutated `src/app.js` to prove a caption guard could fail.
   `layer-copy.test.js` reads the **BUILT** page, so without `npm run build`
   between edit and test the mutation never reached the subject. **Two of three
   mutations reported clean, and I nearly recorded that as a finding.**

⭐ **A MUTATION THAT PRODUCES NO FAILURE IS NOT EVIDENCE UNTIL YOU HAVE SHOWN THE
MUTATION LANDED.** Same discipline as the check itself.

## ⛔⛔ 2026-09-10 — THE CHECK RAN AND ITS RESULT WAS NOT WHAT GATED THE ACTION

`npm run gates > log 2>&1; echo "EXIT=$?"; git add -A && git commit && git push`
— the `&&` chain hangs off `git add`, so `GATES EXIT=1` printed, scrolled past,
and a commit with a stale generated block went out **red in CI**. CHENG: *"that's
the fit-gate-grading-an-error-page shape in a shell one-liner — the check ran and
its result wasn't what gated the action."*

⭐ **THE FIX IS MECHANICAL, NOT DISCIPLINARY:** `npm run gates && git commit …`,
so the gate is the thing the chain depends on.

---

## ⛔⛔ 2026-09-09 — A GUARD WHOSE REFERENCE IS ITSELF AN ENUMERATION

**The sharpest instrument finding in a while, and Kevin's question produced it:**
*"why does adding a layer touch 4 different areas, plus several guards? I thought
we just went through a code cleanup."*

Measured rather than defended. Adding a lens to `LENS` — the one place an id is
typed — turned **FOUR DERIVED GUARDS RED**, each naming the exact next edit. ⭐
**That half is the architecture working: the cost is enumerated by machine, not
by memory.** Two were not working.

1. ⛔ **The chip markup had NO guard at all.** The layer was registered, bundled,
   counted and distributed — and unreachable from the interface. Nothing failed.
   **Now guarded**, both halves mutation-checked.
2. ⛔⛔ **`LAYER_TOKENS` is a hand-typed array, and the `DRAWS` guard checks
   against IT.** So when both go stale they AGREE and the guard passes. ⭐ **A
   GUARD WHOSE REFERENCE IS ITSELF AN ENUMERATION GOES STALE IN THE SAME EDIT AS
   THE THING IT GUARDS.** That is a new shape — not "the check is too weak" but
   "the check's yardstick moves with the subject." **Still open**; deriving it
   from one layer list makes four of eight lists disappear.

## ⛔⛔ 2026-09-09 — THE BUNDLE IS ONE SCOPE, so a module-private name is not private

`zoneOf` moved from `census.js` to `rink.js`. `layers/whistle.js` declares its
**own** `zoneOf(x, homeAb, awayAb)` — same name, three arguments, a different
question. **The browser bundle inlines every module into ONE SCOPE**, so two
function declarations with one name do not coexist: they hoist and the later wins
for every caller in the file. Renamed `attackZone`. ⚠️ **A property of THIS BUILD,
not of ES modules** — and invisible to node, which imports the modules separately.

## ⚠️ 2026-09-09 — A CHECK THAT COULD NOT FAIL ON THE DATA IT RAN AGAINST

`census.shooter`'s *"the population is corsi's"* passed with the reducer replaced
by a local type test, **because none of the three fixtures we own contains an
event corsi drops.** The check named the right property and was inert. Fixed by
appending one shootout attempt to a real stream — the population that matters,
because every attempt there is unblocked and from the slot, so admitting it moves
the blocked rate **in the direction that looks like a finding**.

## ⚠️ 2026-09-09 — A TEST THAT ONLY VISITS THE FRAME WHERE A CONTROL WORKS

Every check in `render-clip.test.js` was green through the highlight vanishing
after 3.6 seconds, **because every one drives the playhead TO the goal frame and
stops.** A test that only visits the frame where a control works cannot see that
it works nowhere else. Hit-target defect, fourth form.


## ⭐⭐ 2026-09-09 (late) — THE DENOMINATOR MISTAKE CAME BACK THROUGH A SECOND DOOR

I was one commit from shipping **"No games last night"** on the front door.
`measureAll` gates on `inScope`, so an empty `recent.json` is equally what a
night of **preseason** looks like — the league plays a full card, we hold none of
it, and the sentence is a false claim about hockey.

⭐ **`describe()` SHIPPED THIS EXACT BUG IN JULY** and the rule is already written
in capitals in the file I was editing: **THE DENOMINATOR IS THE HOCKEY, NOT OUR
COMPREHENSION OF IT.** It announced *"no games in the last 14 days"* over a full
preseason slate, all 56 of which sat in a state we had never observed.
**Absence of a record is not absence of a game.** A rule I had read that morning
did not stop me writing the same sentence in a new module — it was building the
RENDERER that surfaced it, not reviewing the design.

## ⛔⛔ 2026-09-09 — 1,144 GREEN TESTS AND THE LAYOUT WAS BROKEN ON THE ORDINARY CASE

The daily block printed every game of a night. A **16-game night — the league's
maximum, and 13 January 2024 is a real one** — grew the hero card from 800px to
**1,230px** and left roughly **1,250 × 480 of empty white** beside the list,
because the rink beside it does not grow. Every unit test was green, as they had
to be: the fake document has no CSS and cannot see a pixel.

⭐ **AND PRODUCTION COULD NOT HAVE SHOWN ME EITHER.** It is the off-season;
`recent.json` publishes `{"games":[]}` until 29 September, so the state carrying
the whole feature was unreachable from a screenshot of the live site for three
more weeks. **A feature whose main state the calendar hides needs its harness
taught the state** — `tools/pixels.sh` gained `RTG_PIXELS_SLATE=<date>`, which
rebuilds the document from that date's REAL extracts using the nightly's own
command, so the fixture is production's data through production's code path.



## ⛔⛔ 2026-09-13/14 — A PROBE WHOSE SUBJECT IS "THE FIRST MATCH" HAS ITS SUBJECT CHOSEN BY FILE ORDER

**Three of my own checks failed a CORRECT stylesheet in one afternoon**, all the
same shape, none of them about the thing they were named for:

- `scoreboard.test.js` matched `@media (max-width:520px)` and demanded a brace
  **immediately after it**. The board's narrow shape was extended to the
  landscape phone by appending a second condition — a comma is a media query OR —
  and the file **threw at import**: *"no 520px query carries the board"*, which
  is the failure it was written to report when the RULES were gone.
- `u11-mobile.test.js` took the FIRST `#rg:not(.preview) .rinkbox{…}` in **two
  places**. A new landscape rule became that first, so every assertion about the
  full-bleed rink was reporting on a rule with no opinion about bleed.

All three now find their subject **by what it does** (`filter(body =>
body.includes('margin-inline'))`) and assert there is exactly one, so an
ambiguous document fails loudly instead of being resolved by position.

> **Name the subject by its content, count the matches, and fail when the count
> is not one.** `indexOf` and a bare `exec` both answer "whichever came first",
> which is a fact about the file rather than about the code.

⭐ **AND A MUTATION CAUGHT A CHECK OF MINE PASSING FOR THE WRONG REASON, AGAIN.**
Deleting `doorOpened=false` from the ice's click handler left the suite green:
the early return I was testing **clears the flag itself**, so the "not sticky"
assertion was reading a flag that was down either way. It now raises it with a
lone press that no gesture follows. *A check placed after the mechanism it is
testing may be testing nothing.*

# ⛔⛔ 2026-09-09 — A FIRST-MATCH QUERY STANDING IN FOR A SET (three instances)

CHENG's count, and the third arrived the same day: `querySelector('.zone')`
reported the disclosures hidden — **there are FIVE and two are on screen**;
`#rg .newcomer` matches **TWO** and I quoted its 268px from element one; and
earlier, `re.search` found one `<style>` block so the CSP pinned it while
`game.html`'s real stylesheet went unhashed.

⭐ **THE HABIT: when the subject of a measurement is a class, ask the page how
many wear it BEFORE reading anything off one of them.** *An inventory is a walk;
a checklist is a guess about what the walk would find.* The fix that worked was
enumerating **every visible direct child of `#rg .wrap`** rather than querying the
names I expected.

✅ **And the tool that measures by selector now counts first** —
`tools/pixels.sh`'s `box()` returns `"N MATCHES — this figure would be about the
first"` instead of silently describing element one. Its two selectors are singular
*counted*, not assumed.

# ⛔⛔ THE SAME DAY: 1,100 TESTS, AND NOTHING RAN THE DRIVER

`builders/measure.mjs`'s `main()` read `declined` without destructuring it, so
from 2026-09-03 **every weekly archive run wrote both documents and then threw**.
Everything below that line never executed — the situation-code alert, the whole
JSON summary, and `process.exit(1)`, which the file's own comment calls *THE
ALERT*. ⛔ **And the job reported success**: the step is `… | tee measured.json`
and a `run:` block's default shell is `bash -e {0}` **without `-o pipefail`**, so
the pipeline returns tee's zero. Confirmed in the 2026-09-08 log — green, stack
trace inside it.

⭐ **A unit test of the parts cannot fail on a reference the parts never make.**
Every test called `measureAll`; none ran the CLI. The suite runs the driver now.
⚠️ **And naming `shell: bash` is the only spelling that carries `-o pipefail`** —
worth checking anywhere else a workflow pipes a command whose exit code matters.


# ⭐⭐ 2026-09-09 — §H5: A COST MEASURED ON SYNTHETIC DATA MEASURES THE SYNTHESIS

Asked what per-game attempts would add to `catalog.json` (a document every visitor
fetches), I filled the new fields with a **constant** and gzip said **+1.6 KB** —
which made the expensive option look free. Real attempt counts run ~35–85; with a
realistic spread the same measurement says **+15.7 KB, TEN TIMES MORE.**
⚠️ **Compression measures ENTROPY, so a placeholder that repeats is not standing
in for a field that varies.** CHENG: *"gzip estimates measured on synthetic data
measure the synthesis"* — the fit gate grading an error page, again.

## ⭐⭐ AND THE HALF THAT IS NOT ABOUT GZIP — CHECK WHICH WAY THE ERROR POINTS

**Three numbers were wrong in one thread and ALL THREE erred in the direction that
supported the argument I was making** — the headline's width (I said ~400px, it is
603), the share of the viewport (I said three quarters was gutter, it is half),
and the gzip figure. CHENG: *"measurement errors that happen to support the
measurer are the ones to watch, and noticing the DIRECTION rather than just the
magnitude is the right catch."*

⭐ **The question to ask before quoting a number: if this were wrong, which way
would it be wrong, and is that the way I want?**

## ⛔ AND AN INSTRUMENT ROW: `ingest.yml`'s upload partition check

It proves its sync filters partition before trusting them — but `expected.txt` is
built by `--dryrun`-ing the sync over **whatever is on disk**. So a document that
should never have been in `ingest/` lands in `p1.txt` and `expected.txt` alike,
partitions cleanly, and publishes. **It asks whether the passes COVER the files,
never whether the files are the ones we meant to publish.** Latent, and it is the
precondition on `docs/front-door.md` §6.1.1: adding `measure.mjs` to the nightly
the obvious way would overwrite the archive-wide `measures.json` with an
eight-game version, silently, every night — and the hero's own sentence reads that
document, so the front door would start saying *"Across 8 games in this archive…"*

## ⭐ THE PREVIEW HIDE LIST — an enumeration that predicted its own failure

`.sharerow` shipped visible in the hero for months. The guard was a hand-written
array of class names, and **its own comment said** *"a rule that hides a WRAPPER is
a rule nobody has to remember to extend… the preview is exactly the surface where
nobody would notice it was not."* It derives now: **every control the built page
can produce must be inside something the preview hides.**


## ⭐⭐⭐ 2026-09-08/09 — THREE TIMES ONE FEATURE, A CLAIM ABOUT A HIT TARGET SURVIVED A CHECK IT COULD NOT FAIL

The goal-highlight door had to be clickable. Every version was green and **the
thing a person presses was dead** — three separate times, each a different way of
never testing the hit path:

| # | what was green | what a person got |
|---|---|---|
| 1 | the MARK handler passed both directions | **the label was never wired** — `drawLabel` writes into `#labels`, a different group from `#events`, 106×21px against a 6px ring. Kevin pressed the label, which is what anybody would press. |
| 2 | "verified" the scroll with Playwright | I used **`click({force: true})`**, which **disables the actionability check** — the exact check that would have reported it. |
| 3 | two tests and the golden walk, all green | all three dispatched **`{target:{dataset:{i}}}`** — the carrier handed straight to the handler. A browser hands over the **innermost** element, and a goal is a `<g data-i>` around a `<path>`, so `ev.target.dataset.i` was undefined. **Ordinary marks are a bare `<circle>` carrying it, which is why every mark except goals worked.** |

⭐⭐ **THE RULE: *a test that constructs the ideal event tests the handler's
arithmetic and never its hit path.*** `markClick` in `test/helpers/page.js` now
states a browser's delivery shape once — a child with no dataset and a `closest`
that answers the carrier — and `leaf: false` keeps the bare-circle path covered so
a fix that only walks up cannot stop answering for the marks that never needed it.

⛔ **AND THE OLDER READER HAD THE SAME BUG, LIVE.** `app.js`'s slot why-card used
the identical shape. Measured on production before touching anything: clicking a
**goal's** mark with the slot layer on left `#whyBk` at `display:none` and
`#whyContent` empty — while the page's own caption says *"Click a ring to see the
distance and angle it was measured by."* Shipped for months. *A fix that teaches
one site about a variety and leaves its sibling*, again — both go through one
`markAt` now.

## ⭐⭐ `extract.SCHEMA` — an extract is a pure function of (raws, extractor)

`derive.py` skipped a game when the stored extract's `src` digests matched the
raws. **Correct about the FEED, silent about US:** an extractor that learns a
field would never reach a game whose extract is already stored, and the run
reports `unchanged` and exits 0. `game.ex` is the other half.

⚠️ **AND I OVERSTATED IT, THEN CORRECTED IT BEFORE COMMITTING.** Both CI paths
dodge it — `derive.yml` pulls with `--exclude 'extract/*'`, `ingest.yml` pulls
only pointers — so neither ever has a stored extract to compare. It was **one
workflow flag away** from silent, which is worth holding explicitly; it was not a
live bug, and the tidier story was the wrong one.

`test_extract_schema.py` pins the emitted key set so the bump cannot be forgotten
— and **that pin caught my own guess on its first run** (I wrote `boxscore`; the
key is `quoted`).

## ⛔ TWO MORE INERT GUARDS, BOTH FOUND BY MUTATION

A guard no fixture can pose is green forever. Both needed a game **constructed**
for them ([[stale-fixtures]] is the same family):

- **a clip on a non-goal** — no fixture has one, so widening the branch passed
  everything.
- **`box.js`'s expiry-on-a-goal-second** — dropping `endedBy === 'goal'` was inert
  until a penalty was planted on the SCORING team so it expires on the goal's own
  second, where `box.js` correctly leaves `endedBy: 'time'`.


## ⭐⭐⭐ 2026-09-03 — A STATIC CHECK **CAN** BE TWO-SIDED, and the control need not be static

I could not see how to give a static check the property the runtime probe has:
its second half, the control proving the probe can *fail*. CHENG: **feed the same
checker a fixture that VIOLATES the rule and assert it is rejected.** Same shape
as the deploy gate's 900px canary — deliberately wrong input, step fails if it
passes. It generalises to *any* static check.

`test/sx-scope.test.js` is the worked example: four spellings a real violation
could take (plain, indented, namespace, dynamic) **plus three innocent lines it
must NOT flag**, because a checker that catches everything passes the real
assertion for the wrong reason. Plus a third test asserting the *subject* still
exists, so the file cannot go green because the danger was removed.

## ⚠️⚠️ 2026-09-03 — PROSE IMPERSONATING CODE (the rule pointing the other way)

The canon says *a check that cannot tell code from the WORDS ABOUT the code is
not a check about code.* This is its inverse and it **broke production tests**: a
comment I added to `rinkart.js` quoted the build's library marker and `boot`'s
exact opening line. **Both are load-bearing strings** — the builder scans output
for unsubstituted markers, and `render-ends.test.js` requires its probe anchor to
appear EXACTLY ONCE. Quoting them shipped a second copy of each. Three tests went
red and **all three were right**.

⭐ **A comment in a file that ships is part of the artifact.** Describe a
load-bearing token; do not spell it.

## ⚠️⚠️ 2026-09-03 — I PUSHED A RED TREE

`git commit` chained after `npm run gates` with `&&`-style sequencing that never
read the exit code. Three failures went out. **Check the gate's exit code in a
variable and refuse to commit on non-zero** — the convenience of one command line
is not worth a red push.

## ⭐⭐ 2026-09-03 — NEVER MEASURE AN UNPARSEABLE FILE WITH A REGEX

**Four false findings on `src/app.js` in one review**, every one from
text-matching, because the file is a template and cannot be parsed. `70 write
sites` was `data-i="${k}"` matching `i\s*=`; `24 bindings` missed a mid-line
declaration; "toggles held by repetition" missed that `pick()` **is** a correct
path; and a "defect" was already documented in `syncPick` as deliberate. My own
`tools/tiers.mjs` then matched the *word* "document" in comments and called ten
pure modules impure.

⭐ **The generalisation Kevin drew, and it is the sharpest thing in the review:**
*a codebase that can only be analysed by regex will be analysed by regex, badly.*
The architecture did not merely make the review hard — **it selected the wrong
instrument and then hid the consequences.** Real defects become hard to find and
imaginary ones cheap to invent.

## ⭐⭐ 2026-08-28 (later) — §H4, AND THREE DEFECTS THAT WERE THE TEST'S FAULT

Five defects reached a green suite in one day. Three were the CHECK, not the code.

⭐ **A TEST THAT BRANCHES ON THE DATA IS NOT A TEST OF EITHER BRANCH — now §H4.**
`const U = mostUnusual(...); if (U) {…} else {…}`. Nine fixture games made the
reference game ORDINARY, the else-branch ran, and the finding branch was **never
executed by anything in the suite** — while a browser threw
`Cannot access 'ESC' before initialization`, aborted boot and left a **dead
scrubber on every game page**. ⚠️ *The shape reads as thorough coverage*, which
is what makes it worse than no test. Fix: a second test that CONSTRUCTS each
branch and renders it.

⭐ **ASSERT THE CLAIM IN THE TEST'S OWN NAME.** The nameless-document case
asserted only `doesNotMatch(/whistle|corsi/)` — "no lens id reached the reader" —
which a page wrongly printing *"every count sat inside the middle half"*
satisfies completely. Named for one claim, asserting a weaker one, and the
weaker one was true of the defect.

⭐ **A GUARD MUST ASK THE QUESTION, NOT A NEIGHBOUR OF IT.** `some(d => d.n)`
(distributions exist) where the question was `judgeable()` (a lens can be
judged). **One null carried two facts** — nothing stood out, and nothing could be
judged — and the page called a game ordinary without having checked.

⚠️ **AND `#rg .board` IS STATIC MARKUP**, so using it as a boot check reports
success on a page whose script never ran. Third false positive of the day; the
trap `tools/pixels.sh` documents in its own header.

⭐ **THE OTHER TWO, for the record:** a HARNESS that could not tell `.pkl` from
the whole chip made an entire defect class invisible (old harness + broken page =
25 of 25 green), and a RULE STATED TWICE (the near-miss predicate lived in the
page and again in the test guarding it) went red about the wrong thing the day
the page was corrected.

## ⭐ 2026-08-28 — A SLASH PROMISES NOTHING; A PLUS IS AN EQUATION

Kevin asked for two club figures to be joined with `+` instead of a slash. The
separator was the whole request — and **changing it made a claim the old one
never did**, which two of five layers could not keep: Goaltending's figures are
FRACTIONS whose denominators sum to the counted events while the numerators sum
to the saves (34 vs 32), and Blocked credits a teammate's block to **neither**
club (7.8%). ⭐ *A punctuation change can be an arithmetic change.* And
**`A + B = N counted + M other = T` is a chain of equals asserting N = T** — one
`=` per line.

⚠️ **AND THE HARNESS WAS THE DEFECT'S ACCOMPLICE, AGAIN.** `chip.textContent`
gained a live count, so the work panel's heading shipped *"How Goaltending10 is
counted"*. The fake chip stored its label in its own `textContent`, making
`.pkl` and the whole chip one string — **so two caption tests were passing on a
coupling the DOM does not have, and the new test would have passed on the broken
page: old harness + broken page = 25 of 25 green.** ⭐ **The mutation that proves
an instrument is sometimes a mutation in the INSTRUMENT, not in the app.**

⚠️ **AND `git checkout <file>` ATE UNCOMMITTED WORK MID-MUTATION-RUN.** It
reverts to HEAD, not to the pre-mutation state, so a mutate/revert loop silently
deleted every edit of that session's file. **Revert from a copy outside the
repo.** Same family as *a backup that was a FILE deleted `builders/`*.

**CHENG's sharpening of [[verify-inherited-claims]], 2026-08-07, and the more useful version of it.**

Four unverified claims surfaced in one week on Read the Game:

1. The blocked-shot flip (CC's, inherited from memory) — shipped a wrong Corsi count.
2. `build_alive3.py` "permanently broken" (CC's) — I grepped for `open(` and never read the 55-line file; it was abandoned behind an `if False`.
3. "BUF `+x`, MIN `−x`, all three periods, no exceptions" (CHENG's) — false; 90 of 91.
4. A third-party doc's row-limit figure, taken at face value.

**Three of the four were made by whoever was currently playing the checker.** CHENG made his while reviewing mine — and made it *while holding the counterexample in his own output*: the query that established the `Math.abs()` defect returned exactly one event with the sign opposite its attacking direction, and he wrote "no exceptions" about that same dataset. He had derived "always" from per-period means, which is the identical error he had just filed against the README's "38 of 44 blocks were in the blocker's D-zone."

**The conclusion is NOT "be more careful."** Care is what already failed, four times, in the people whose job was care. The conclusion is:

> **The reviewer role confers no immunity, so the review must be mechanized too.**

**How to apply:**
- **A claim that matters gets pinned in a test, not in prose.** `test/attribution.test.js` test 3 pins CC's claim about the feed; `test/rink.test.js` pins CHENG's about normalization. Neither depends on anyone being alert.
- **Pin the RULE, not the pattern it usually produces.** "BUF shots are +x" is a pattern with an exception. "Normalized (x,y) == raw (x,y) flipped iff `homeTeamDefendingSide=='right'`, checked positionally against the raw feed" is the rule, and it is exact. Statistical invariants sleep through the cases that matter.
- **Separate symptom tests from invariant tests, and say which is which in the file.** A symptom test catches the known defect returning. An invariant test catches the world changing underneath a still-passing symptom test. When several go red at once, the invariant is the signal and the symptom test is noise — write that down beside the test, because the person reading the red output is under time pressure.
- **Guard the counterexample.** The one real long shot (P3 11:33, Owen Power, 159 ft from BUF's own end, `zoneCode:'D'`) now looks like a bug to anyone who doesn't know the history. It has its own test saying "this is real data, do not fix it."
- **Watch for "always"/"never"/"no exceptions" in your own output.** That is the phrase that marks the error, and in three of four cases the disconfirming data was already on screen.

**A fifth failure, different in kind and worth its own name (2026-08-07): TRUE is not UNUSUAL.**
I found that Levi allowed no even-strength goal in the reference game, verified it was true, and built a causal story on it — "Minnesota's offence was special teams." It reproduces perfectly and means nothing: a league-average goalie blanks 18 shots about **one start in five**, and the goal clustering was a 23.6% / 21.6% outcome found by looking *after* seeing it, on n=2 goals. Verification caught nothing because the claim was true; what I skipped was asking whether it was *unusual*. **Only the second test licenses an explanation.** Now DOCTRINE.md rule 8: any rate the app shows carries a base rate. Rule 9 came from the same review — *selective honesty is worse than none, because it looks rigorous*.

**THE RULE, and it is the most useful thing on this page (CHENG, 2026-08-07):**

> **When a check returns the answer you wanted, that is the moment to mutation-test it — not the moment to write it up.**

My failures cluster in the **verification step**, not the implementation. The implementations have been consistently sound; the checks have been wrong five times, and every one of them returned the reassuring answer:

1. `strip_lib()` regex ended its match at `\Z`, deleted everything after the last library block, and reported **"0 lines changed"** — the exact answer I wanted for a refactor.
2. Mutating `own` to `d.get(...) or 0` only turned nulls into zeros, which the additive gate permits by design — reported **ADDITIVE ONLY**.
3. `node ... | tail -4; echo $?` read `tail`'s exit code, reporting **exit=0** on a gate that had correctly failed. Done twice.
4. `npm run gates` passed on node 20 and failed on node 22; because it is an `&&` chain, four gates never ran. **"All gates pass" was true of one machine.**
5. The ESM leak guard `/^import /m` encoded the *same* assumption as the stripper it was checking (column zero + trailing space), so it could only fail on inputs the builder already handled. An indented import shipped with 28/28 green.
6. **43 tests passed while the app was blank.** Phase 2 deleted a variable the renderer still used; the script PARSED, the modules were correct, and every test checked either a module in isolation or the *text* of the bundle. Nothing executed it. Kevin found it by opening the page. Fixed by `test/smoke.test.js`, which runs the bundle against a dumb DOM stub.
7. **That stub then returned `[]` from `querySelectorAll`,** silently leaving every picker unwired — so the strength toggle would have shipped untested by the very test written to catch untested UI. Same shape, one level down.
8. Six assertions in `figures.test.js` were wrong before any code was — including a scale check that read digits out of colour hex (`#0d141b` contains `141`, larger than any coordinate and constant across sizes, giving a ratio of exactly 1.00).

**Corollary worth its own line: TEST THE TEST'S REACH, not just its verdict.** #6 and #7 both had green suites that did not touch the thing they were named for. Ask "what would this fail on?" before "did it pass?"

**The generalizable shape of #5: a test that shares an assumption with its subject tests the assumption once, not twice.** Prefer *parsing* over pattern-matching, and validate the OUTPUT rather than the input — `node --check` on the generated bundle catches every ESM form, including the ones nobody thought of. (Force `.cjs`: this repo is `"type": "module"`, so checking a `.js` file inside it parses ESM as *valid* and accepts exactly what you are trying to catch.)

**And #4's structural answer is CI on a clean checkout, across versions** — `.github/workflows/gates.yml`, node 20 and 22, plus `git diff --exit-code` so a stale generated file cannot mask a broken builder.

What actually changed this week is not that more was caught — it is that the catching stopped depending on who was paying attention.

---

**2026-08-08 — the sharpest instance yet, and the lesson is NOT "discount CHENG."**

Reviewing the live site, CHENG filed one finding with two halves. They landed opposite ways, and the pairing is the point.

- **The headline was wrong.** *"`undefined` is on screen in 100% of strength exclusions. Live right now."* It is not, and never was. His probe built `ctx` as `{ roster, homeId, awayId }` — copied from what `corsi.reduce` destructures — while `whyNotEven` documents and uses `homeAb`/`awayAb`. The app supplies them (`CTX` at build time from `G.teams`). Running the **live bundle's own code with its own CTX and its own `upto()`**: 101 strength reasons, **zero** placeholders. His fifth harness error on this project — and the same author had, three paragraphs earlier, correctly caught himself on the fourth.
- **The second half, in the same sentence, was real and shipped.** The copy quoted skater counts in the feed's away-then-home order while naming whichever team held the advantage. Those coincide only when that is the away team, so `1451` rendered *"BUF were on the power play — 4 skaters against 5"* — the advantaged team described as having fewer players. **36 of 103.** Fixed in `471ce57`.

**So: a false severity claim and a true defect, from the same reviewer, in the same breath.** Confidence and volume ("100%", "live right now", "before anyone else sees the site") tracked the *wrong* half. Verify each claim separately; never grade a review as a unit.

**How to apply, beyond re-verifying:**
- **Reproduce against the artifact under review, not a reconstruction of it.** Downloading the live page and executing its own bundle settled in one run what argument would not have. Byte-compare first, so you know you are testing the same thing the reviewer saw.
- **A false finding still marks a real hazard.** `whyNotEven` genuinely does emit `undefined` for an under-specified `ctx` — no shipped page hits it, but the multi-game platform will add callers. CHENG's suggested guard went in anyway, mutation-proven by withholding the abbreviations. **Fix the trap the wrong finding walked into.**
- **Every existing test asked whether a reason EXISTED; none read one.** Same shape as #5 and #7 — structure checked, content unchecked. When a string is user-facing copy, assert what it *says*.
- **Pin the rule exhaustively over the input domain, not over the data you have.** The count-ordering test runs all of `KNOWN_SITUATIONS`, including `1560`/`1450`/`1540`, which never occur in the reference game and are precisely the branches nobody would notice were wrong.
- **When a careful reader misreads your fixture, the fixture's comment is the defect.** CHENG summed `nCounted + nSurprising` from the Phase 1 golden and got a total that would not reconcile, because `surprising` became a labelled *subset* of `counted` in Phase 2. He caught it himself; the header now states the arithmetic outright rather than implying it.

**CHENG's own post-mortem, and it supersedes the looser version of this rule:**

> **Before asserting a defect is on screen, execute the shipped artifact. Not the module the artifact imports. Reading a function's destructuring is not reading its interface.**

Three specifications of `ctx` were available — what `corsi.reduce` destructures (narrowest), what the module's doc comment states, and what the app actually passes. He read the narrowest and reported a 100% failure rate against his own reconstruction.

**And state the check, not an intensity.** *"Executed the shipped bundle with the app's own CTX: 0 undefined"* is checkable. *"100%, live right now"* is a feeling wearing a number. In this exchange every confidence marker was attached to the unverified half and none to the verified one.

**FALSE RED vs FALSE GREEN — the distinction is worth keeping (CHENG, and he is right that it is the most useful thing in the exchange).** My deploy gate diffed against the cached production alias, so it asserted something about Cloudflare's cache invalidation while claiming to assert something about us. That is a **false red**, and it is the more dangerous kind: a false green is eventually corrected by reality, whereas a false red teaches you to distrust a working gate, and the third time it cries wolf someone ships past it. The fix was to split one fused claim into two — *"does this deployment contain the right bytes"* (immutable `<hash>.pages.dev`) and *"does production resolve to this deployment"* (hostname, cache defeated). **When a gate fails, first ask which claim it actually tested.**

**The dominant failure mode on this project, both sides, is now verification rather than implementation** — by a wide margin. The implementations keep holding up; the checks keep being wrong in the reassuring direction.

**Structural reason to grade claims individually:** a bundled review carries a single trust level, so a false headline drags a true defect down with it. Had this review been discounted as a unit, the skater-count bug would still be live — in the exact sentence a novice reads to learn why 49 attempts vanished.


---

# 2026-08-10 — two categories worth naming

## CORRECT-BY-ACCIDENT (CHENG's framing, and it is the more useful of the two)

Three times now a behaviour has been right for a reason nobody chose:

1. The high-danger count came to 44 either way, because `|y|=35` failed the slot test independently of the distance bug.
2. Ends-switch normalization held 90 times out of 91.
3. `classify()` already filtered the schedule week down to the window — correct, and **completely untested**. Measured live: a 3-day window sits inside a returned 7-day week holding 47 games, of which 23 are in range. Counting the response would have reported a permanent phantom shortfall of 24 games, which in season looks like a busy backlog rather than a bug.

> **Correct-by-accident and correct-by-design are indistinguishable from the output. Only a mutation separates them.**

So the rule is not "test the things that look wrong." **An untested correct behaviour carries no more evidence than an untested incorrect one, and the next refactor has nothing to fail against.** In all three cases the number on screen was fine and the reason it was fine was luck.

Corollary from the same review: **the fix is sometimes the test, not the code.**

## FALSE REDS — now the dominant failure mode on my side, five in one day

Every one of them: **the check tested a narrower or later claim than the one it announced.**

1. **Cached production alias.** Diffed against a hostname with an edge cache; the upload was faithful and the alias had switched. Was testing Cloudflare's cache invalidation while claiming to test us.
2. **A missing `dig` binary** read as "the domain does not exist." A control query would have caught it in one command — and did, later, when `google.co` also came back empty from the same RDAP path.
3. **An f-string quoting a removed field.** `cmp` had already proved the sync byte-correct; the step died on a decoration.
4. **The apex checked seconds after deploy.** Retry covered "not ready" (5xx) but not "ready and briefly stale" (200 with the previous bytes).
5. **The `file://` browser gate.** Proved the script was permitted by the CSP; a real visitor could not read the data at all.

**A false red is more corrosive than a false green.** A false green is eventually corrected by reality; a false red teaches you to distrust a working gate, and the third time it cries wolf someone ships past a real one. Kevin absorbed the email noise for all five.

**The one true red** — the live-visitor check catching the CORS bug within 60 seconds of the deploy, naming the fix in the error — is what the others should have looked like: assert the claim you are announcing, against the artifact a user actually touches.

## A LINT YOU CAN RUN ON PROSE (CHENG, and it caught me in one reading)

> **A definition with an embedded exception is a conflated field.**

`lastRun — when the pipeline last completed WITHOUT HALTING` beside `dataThrough — the date of the most recent game held`. One carries a carve-out; one does not. I had diagnosed exactly this in `lastIngest` and then re-derived it one level up in its replacement. Applies to prose, schemas and function names alike.

**And the migration rule, which I wrote and then violated in the same document:**
> **"It will be fine after the next run" is how a broken empty state ships.**

It was not fine after the next run, because `unchanged` is the steady state of a converging pipeline. Both belong in `DOCTRINE.md` beside the conservation rule — CHENG asked, and it is still undone.

---

## 2026-08-11 — THE DOMINANT FAILURE MODE, named properly at last

Seven instances in two days, all one shape: **a check tested a narrower or
different claim than the one it announced.** CHENG's phrasing is the sharpest we
have, and it caught him too:

> **A rule calibrated on a sample cannot be validated by that sample.**

Data with no counterexample in it *reads as confirmation and is actually silence*.

**The allowlists.** `FINAL_STATES` held one word (`OFF`) from 133 offseason games
— `FINAL` sits on every preseason game and halted a whole backfill.
`KNOWN_SITUATIONS` held the eight codes one November game contained; a season has
nineteen. `gameType` was enumerated {1,2,3}; the season contained 9 (the
Olympics). Each time the fix is **pin the RULE, not the pattern** — but note the
sting: converting the situation codes to a decode rule fixed the failure mode and
NOT the sampling that fed it, so the new rule was *itself* too narrow (it tied
one-shooter-one-goalie to shootouts; it is also a penalty shot in regulation).

**The conflated ledgers.** Games in an unrecognised state sat OUTSIDE the only
equation that could fail, so 90 refusals in 100 left the ledger closing perfectly
and the front page reporting health. The halt rule was quietly load-bearing for
that hole. **The rule got weaker and the accounting got stronger, which is the
correct trade** (CHENG).

**The hypotheses that fit the failures.** Excluding empty-net goals explained 9
refused games and would have broken ~500 passing ones — the Cup final alone
killed it. Then the play-by-play's running SOG counter "explained" 20 more, and
disagreed with the boxscore in 6 of 90 *passing* games at the same rate. **I made
the identical error twice, one message apart**, having just described the first
one in those exact words.
→ **Before any fix, test it against the cases that currently PASS.**

**And a gate I wrote to catch a wrong date gave a FALSE GREEN on its first run**,
reporting success while the live page displayed "CAR at VGK · Nov 10 2023". It
never confirmed it was looking at the build just deployed, and its guard grepped
for the format the FIXED code emits — so it could only fire on a page already
correct. **A check whose expectation is typed rather than derived is the defect it
exists to catch, one level up.**

Still undone, and CHENG has now asked twice: put *a definition with an embedded
exception is a conflated field* and *"it will be fine after the next run" is how a
broken empty state ships* into `DOCTRINE.md`, along with the sample rule above.

---

## 2026-08-11, later: the fix that broke the thing it fixed

Two more instances, and the first is the cleanest specimen of the whole pattern.

**The catalog merge.** `_write_catalog` replaced instead of merging; I found it,
reproduced it, wrote three tests, fixed it, pushed it. The next scheduled run
published a catalog of **zero games** and took the game page down. The merge was
right. The nightly rehydrates pointers and `index.json` from R2 and had never
been asked to bring `catalog.json` down, so the merge had nothing to merge into.
**I repaired the function and never checked that the input it merges into
arrives.** The tests all passed and tested the narrower claim.
→ **A merge is only as good as the baseline it is handed** — so pin the ORDERING
between the pull and the run, not the correctness of the merge.

**The gate that caught it had the same defect inside it.** The deploy's visitor
check derives what the page should say FROM `catalog.json` — built that way on
purpose, after a hard-coded expectation gave a false green. But the derivation ran
inside `$(...)` feeding `read`, and **`read` succeeds on empty input**: the
IndexError printed a traceback and the step carried on with a blank expectation.
The comparison below it is `case "$line" in *"$want"*`, and **an empty `$want`
matches every string alive.** The check that exists to prove the page shows the
RIGHT game was vacuous; it went red only because a different branch caught the
error text first.
→ **An empty expectation is not a passing one.** Any derived expectation must be
asserted non-empty before the comparison that would otherwise be defeated by it.
→ And the older sting again: *correct by accident is indistinguishable from
correct by design until the accident stops happening.*

**The scheduling asymmetry, which is new and general.** Every check that could
have caught the empty catalog lived in `deploy`. Deploy runs **on push**. The
damage arrived **on a schedule**. A gate only guards the events that trigger it,
so the question to ask of any new check is not "is it correct" but **"what has to
happen for it to run, and is that the same set of things that can break this?"**
The ingest now makes the visitor-facing assertion itself, unconditionally.

---

## 2026-08-11, evening: instances nine and ten, both inside the guard

**Nine — the phone gate graded a 500px screen and called it 360.** The step passed
`--window-size=360,740`; headless Chrome enforces a minimum window width and gave
it 500. It measured 485 against 500, went green, and printed *"at 360px"* for a
screen forty per cent wider than the one it named. At a real 360px, 485px of
content scrolls sideways — **the gate would have missed the exact defect it was
built for**, and it landed in the step written to prevent this class of defect.

→ **Do not REQUEST the conditions of a measurement; IMPOSE them, then assert them.**
The width now comes from a same-origin iframe of exactly 360 CSS pixels, and the
step fails if the measured frame is not the width it claims. The missing assertion
is what let the first version lie.

**Ten — the mutation was built and never run.** I added a canary (a 900px div in a
360px frame, which must be reported as overflowing) to prove the comparison could
fail. It went into the loop that CREATES the probes and not the loop that MEASURES
them. It was written to disk, framed, never looked at; the step went green and the
commit message asserted a guarantee that did not exist.

> **A MUTATION THAT HAS NOT BEEN SEEN TO FIRE IS NOT A MUTATION.**

Its whole job is turning a green into evidence, and it can only do that if its
failure is observed at least once. **Read the log for the mutation's own line, not
for the step's exit code — the exit code is precisely what is lying.** Confirmed
on the next run: `canary: 900px in 360px correctly reported as overflow`.

**And a third, of a different shape, the same evening: a fix that silently did
nothing.** The homepage said *"loses SLIGHTLY more often"* — prose asserting an
effect size three lines above the exact figure and its denominator. The publication
rule was applied to the digits and then walked around by an adverb. The first fix
targeted the whole sentence, which spans two Python string literals, so the replace
matched nothing, the build succeeded and all 238 tests passed — **because nothing
tested that copy.** A replace that must match should assert that it matched.

---

## 2026-08-11, late: the copy has no gate, and a positive rule beats a blacklist

**Kevin caught a defect in a sentence, not in a number.** Describing an icing I
wrote *"they aren't allowed to change **tired** players."* Three of those clauses
are the rulebook (Rule 81). `tired` is a state of those players on that shift that
the feed never recorded — **and I wrote it in the same message where I said that
line was easy to cross.**

> **Every number on this site has a check that can fail. No prose does.**

That is the gap, and it is structural rather than a lapse. The fix is structural
too: **the teaching copy is a DATA TABLE with provenance**, every row naming
`rule: NHL Rule 81` or `field: rsn`, so the sentences are reviewable as a set
instead of found by reading code.

**My first fix was a banned-word list, and CHENG was right to reject it as the
gate.** It is a blacklist over an open vocabulary — the same form as the `fetch(`
grep and the ESM guard, both of which passed while the thing they guarded was
broken. `tired` is banned; *gassed*, *worn down*, *looking for a change* are not.
Worse, a green blacklist reads as *"the copy was checked"*.

> **The standard is POSITIVE: every sentence's subject is a rule, a recorded
> field, or a count. Never a player, a team, or a moment.**

It cannot be evaded by synonym, and it explains *why* `tired` fails rather than
listing it. Enforced by requiring provenance on every row; the word list survives
only as a regression test for the one defect actually shipped.

**And writing the copy as data caught a second error immediately.** My test
asserted icing was "the length of the ice" — my own prose. The rule is from behind
the **centre line** past the far goal line. Loose prose survives being read; a
table row has to be right.

## The tenth instance, and what finally generalised

Nine and ten (the phone gate, above) plus this one produced two rules that are
worth more than the incident list:

> **Do not REQUEST the conditions of a measurement; IMPOSE them, then assert them.**
>
> **A mutation that has not been seen to fire is not a mutation.**

And a third, from CHENG, that covers the whole family:

> **A parameter with no source in the data is a model wearing a UI control.**

That one killed `recent` trails (choosing N), the five-event placement window
(fitted to a sample), and would have killed the 500px phone check had it been
stated earlier.

---

## 2026-08-11, later still — the rule that came out of RENDERING the whistle layer

The layer was correct, twenty-tests green, and **invisible**. When it was finally
drawn on the ice, `test/clock.test.js` — a guard written months earlier for an
unrelated reason — failed immediately: the layer stamped whistles with `clock`,
which is *elapsed*, on a page whose every other clock shows *remaining*. That guard
is written over the shipped bundle, so it could not see the field until the field
reached the page.

> **A reducer with no renderer is a reducer nothing checks.**

Corollary, and it is the actionable half: **a module's tests bound what the module
returns, never what a viewer sees.** Ship the render in the same change as the
reducer, or accept that the half with no gate is the half that ships wrong.

The second finding was the same shape as *a rate with no base rate*: **whistles
stack.** A faceoff happens at one of nine dots, so 44 stoppages draw as 8 rings —
the ice shows eight and means forty-four. A mark that silently represents N things
is a number the page is not saying.

> **A mark drawn once per event, on a surface with few positions, is a count with
> no denominator.**

And the practice held again: **all eight new render tests passed on their first
run**, which is this project's cue to distrust them. Four mutations to the shipped
bundle — draw unconditionally, remove the trails skip, return no marks, drop the
teaching sentence — each killed exactly the test written for it. Only then were
they believed.

---

## 2026-08-12/13 — what a day of visual work taught, and it is not about pixels

Twenty commits on the game page, with Kevin sending screen captures. Four new
patterns, and the first two are the ones to carry.

### A test loses coverage when it is REWRITTEN, and nothing says so

Twice in one day. Rewriting the net-tag test into a goaltender test took the net
GEOMETRY assertions with it — behind the goal line, six feet across — which
guarded an error shipped for the rink's whole life and fixed two commits earlier.
And a trails test counted ELEMENTS carrying `data-i` while meaning EVENTS, which
stopped being the same number the moment one event could draw three nodes.

> **When a test is repurposed, whatever else it was quietly holding goes with it.
> Ask what the old test was guarding that the new one is not.**

### A mutation that does NOT fire is a finding, not a nuisance

Three times this session a mutation survived, and each survival was a real defect:

- a legibility test announced "each tag" and checked "at least one" — and fixing
  it exposed `inkOn` giving Anaheim **2.73:1**, under WCAG's floor, on a shipped
  homepage surface. The threshold (Rec. 601 luma > 0.6) was a number we chose;
  picking the ink that MEASURABLY contrasts more takes the worst case to 4.96:1
  and needs no threshold at all.
- a copy gate walked only the branches its four fixtures happened to reach, so a
  causal connective dropped into the drawn-game clause passed untouched. It walks
  a 13-case matrix now AND asserts the matrix yields 13 DISTINCT outputs, so it
  cannot silently collapse into one test repeated.
- a render test accepted EITHER goal line, written loosely to avoid depending on
  which end the reference game's icings restart in.

> **A loose assertion written to dodge a fact about the fixture is an assertion
> about nothing.** The fixture had icings at both ends the whole time.

### Visual judgement cannot be derived, and I proved it twice in one hour

The net tags were asked to "face each other". I derived the rotation from the
transform algebra — SVG's y-axis points down, positive rotation is clockwise,
+90 carries a glyph's top to +x — and shipped the opposite of what was wanted.
Twice. The algebra is correct; it answers a different question than the one a
viewer is asking. Which way a label APPEARS to face is not settled by where its
ascenders point.

The same day: I predicted, while building the sweater convention, that visitors'
blocked shots would lose their colour and judged it a minor tradeoff. Rendered at
real size it read as a third team on the ice.

> **Three screen captures produced three defects the whole 317-test suite could
> not see.** Pixels are a class of evidence, not a nicety, and a prediction about
> how something will look is worth less than one look.

### And the worst one was in prose about USERS

Arguing against building icing/offside teaching, I wrote "a layer nobody turns
on". Nobody has watched a novice use this site at all. **I invented a fact about
user behaviour and used it to argue against work** — the exact failure this file
polices in numbers, committed where there is no gate. Kevin caught it in one
sentence: the difficulty of a concept does not shrink because a toggle defaults
to off.

> **The rule generalises: an unfounded claim is not safer for being about people
> instead of data. It is less safe, because nothing checks it.**

### Two smaller ones worth keeping

**Names written in SCREEN terms become lies under a reflection**, without a
character changing. `netL`/`netR` held data facts; reflecting the rink made both
wrong. Anything positional is now DERIVED from which side of centre it falls on.

**A refusal is not a finding about the thing you were measuring.** The nightly
went red with "HTTP 403" under a step named *a visitor can still find a game* —
Cloudflare had begun blocking `Python-urllib`, and the check reported it as the
archive being broken. 403 now has its own branch and its own words.


---

## 2026-08-13/14 — a week of building a SITE, and the checks that were shaped like their subjects

Twenty-three commits. The instances below are all one family and the family now
has a name that fits every member.

### A CHECK BUILT FROM THE IMPLEMENTATION'S MODEL OF ITS INPUT — the fourth instance

Adding a shared header put a second `<style>` in `<head>`. `_csp` used
`re.search` — **first match only** — silently assuming a document holds exactly
one `<style>` and one `<script>`, true of every page here until that moment. The
policy pinned the CHROME's 957 bytes and left `game.html`'s own **14 KB
stylesheet unhashed**: a browser would have refused it and rendered the page
completely unstyled.

**Both CSP tests encoded the SAME assumption as the builder they were checking,
so they stayed green while it was broken.** That is the ESM guard, the `fetch(`
grep and the conservation loophole again — a check written from the
implementation's own model of the input can only fail on cases the
implementation already handles.

> **A MISSING hash is worse than a stale one.** A stale hash blanks the page; a
> missing hash UNSTYLES it, so it renders and merely looks broken — and nothing
> in a fake DOM can see either.

Fixed by set equality, which is *derived from the artifact* rather than from the
builder's assumptions: every shipped block must be pinned, and nothing may be
pinned that is not shipped. The original stale-hash coverage was mutation-proven
to survive the rewrite.

### A CHOSEN CONSTANT THAT DRIFTS IS A TEST THAT WILL LIE LATER

`shell.length < inlined.length / 1.5` guarded "no game is compiled into the
shell". Both pages share the whole app, so **as the app grows the ratio drifts
toward 1** — it went red on a *copy change that renamed a layer*, which has
nothing to do with an embedded game. **Loosening the constant would have bought a
few months and taught nothing.**

And looking at it found a second defect: the paired pattern matched
`"rosterSpots"`, a key from the RAW feed that `rich.json` does not have — **dead
weight inside a live assertion, reading as coverage** while only the other half
worked.

> **When a test fails for a reason unrelated to its claim, the constant is the
> defect — not the threshold.** Replace it with the structural claim (the inlined
> page carries `boot({"game"`, the shell carries neither that nor the shift
> charts) and derive any remaining size check from a real artifact's length.

### A MUTATION SURVIVES BECAUSE THE FIXTURE CANNOT DISCRIMINATE — third instance

Reading the hero's score from the *home* side instead of the *featured team's*
changed nothing, because **in my fixture the featured club WAS the home side.**
A rule calibrated on a sample, validated by that sample — in a test twenty
minutes old, written by someone who had catalogued the pattern that morning.

### TESTS THAT PASS BY NOT RUNNING — two, self-caught, same afternoon

- an assertion on `ids.hero.hidden` that read **`undefined` on exactly the paths
  it was checking** (the fake only creates ids the script asks for)
- a loop of `.then()` calls that **returned nothing**, so node finished the test
  before any assertion ran

> **Ask of every new test: what would make this go red?** Both of these were
> green and empty.

### A TEST CAN FAIL CORRECTLY AGAINST A PAGE THAT CANNOT SATISFY IT

My test for the drawn rate went red against the INLINED page — which makes no
network requests, so it has no curve and structurally cannot have a rate. Not a
bug in the test, not a bug in the page: **a real property difference between two
artifacts the test assumed were interchangeable.** Widening the harness to supply
rates keeps the assertion honest for the pages that CAN have one, rather than
weakening it for all of them.

Related, same day: **two smoke tests were silently riding on the boot state.**
They passed because the app happened to open at the end, so "drive to the end for
the golden numbers" was free. Changing where the app starts would have turned
them red for a reason unrelated to what they test. Now one pins the opening and
one drives to the end deliberately.

### AND THE ENVIRONMENT GETS MODELLED, NOT DEFENDED AGAINST

The bundle legitimately reads `location`. When that broke 33 tests, the fix was
to put `location` in the fake — not `typeof location !== 'undefined'` in the
app. Defensive code written to satisfy a harness makes the harness less like the
world, which is the only thing it is for. It was also the seam that made the
preview mode testable.

---

## The reviewer's errors this week, and they are one error

CHENG filed two findings from **reading a symbol's definition instead of
following what executes**: `_csp` "still duplicated" (grepped for `def`, not the
implementation) and the boot "still at the last event" (read `let i=EV.length-1`,
a declaration, not the initialization path that overwrites it). Both caught before
he asserted them. **Third variant of the same error on this project** — the
destructured `ctx` was the first.

And his first mutation was **confounded by editing the BUILT artifact directly**,
so three tests fired on stale CSP hashes and page divergence rather than on the
thing he was probing — and the test he was actually after never ran. Had he
stopped there he would have reported "the boot fix has no test" from noise.

> **Mutate the SOURCE and rebuild, or the failures are noise.**

## Two errors of mine that were about ARGUMENTS, not code

**"A position is a fraction, so it carries its denominator."** I replaced
`top 10%` with `4th of 32` on that reasoning. **Thirty-two is always thirty-two**
— it counts the FIELD, not the games, so `4th of 32` on six games renders
identically to `4th of 32` on sixty, which is precisely the defect I had just
diagnosed in the percentile. The convention's content was never "show a
fraction"; it is **SHOW THE SAMPLE SIZE**, and a rank never does.

> **A fix that preserves the SHAPE of a rule while losing its PURPOSE is the same
> failure one level up.**

**A borrowed term of art.** "High-danger" has published definitions elsewhere
that are not ours, so our count disagrees with one a reader looks up and they
conclude we are **wrong rather than different**. Renamed to "shots from the
slot". The general form: *a name that borrows authority also inherits somebody
else's definition, and the reader will hold us to theirs.*

## A rule that FROZE, which is a literal in disguise

The homepage hero was `featured[0]` — the archive's largest level-control upset —
and **only 2 games in 4,119 clear that threshold**, so the slot would have read
*19 February 2024* for years. Kevin spotted it as a stale date; the data made it
sharper.

> **A rule that updates twice per three seasons is a literal with extra steps.**
> Check the UPDATE FREQUENCY of a derived choice, not just that it is derived.

Recency turned out to be *more* deterministic, not less: already implemented,
cannot be typed, refreshes nightly with no deploy. And choosing what to SHOW by
date biases no measurement — nothing is computed from the selection.

## One rule, six use sites, three misses

**"The shootout is not play"** had to be re-applied at every use site, and the
drawing path, the per-game sentence and the base rate all missed it — each found
by a different person looking at a different thing. The counting paths got it
because they were written together; everything written afterwards had to
remember.

> **Whatever decides that something is out of scope should decide it ONCE,
> upstream of every path that could disagree.** `place(e)` is now the only way
> the renderer can obtain a coordinate, and it consults the same predicate the
> counters use.

Third instance of this shape in one week, with the chrome (`page.py::document`)
and the `inShootout` predicate itself.

---

## 2026-08-14 (late) — the deep-link seam, the preview, and three that only a browser could see

**THE DOMINANT FAILURE MODE GAINED A SECOND FORM: a check that cannot SEE.** The
older one is a check built from the implementation's own model of its input. This
one is a check that has no instrument for the axis in question. Both go green and
both read as coverage. The preview shipped broken **three times with 423 tests
passing**, and the fix each time was to LOOK — see [[looking-at-pixels]].

**A test can be vacuous today and wrong tomorrow at the same time.** I wrote
`?at=3-00:00.99` to assert "an out-of-range link does not deliver the final
score". It passed while `at=` was ignored entirely, and it would have FAILED
against a correct resolver — because `3-00:00` is a real clock and clipping a
too-high ordinal to the last event at that clock is the behaviour I had
specified. A test written against unimplemented behaviour can pass for the wrong
reason now and force the implementation to be wrong later. Caught by asking what
would happen once the code existed, not by running it.

**And the replacement was the better test:** an implementation that apologises on
every inexact landing apologises on most honest links. *A clock nothing happened
at is a perfectly good moment.* The risk nobody was covering was the opposite of
the one I had written down.

**A FAKE THAT INVENTS A DEFAULT MAKES ASSERTIONS ABOUT IT VACUOUS.** Four test
fakes handed back elements with `hidden: false`, so `assert.equal(el.hidden,
false)` passed against a page that never wrote the element. Removing the default
(leaving it `undefined`) makes the same assertion require a real write, and all
412 tests still passed — which is the proof none of them were leaning on it.
**The structural fix beat the audit**: the class became impossible rather than
something to stay vigilant about.

**A TEST ANCHORED ON A LINE OF THE IMPLEMENTATION LOSES ITS SUBJECT.**
`shell.test.js` pinned `drawRink();set(0,false);` to find the end of `boot()`. It
went red on an edit it had no opinion about, with a message about ITSELF ("boot
must still end where this test thinks it does") rather than about the two pages
it exists to compare. The temptation each time is to re-anchor it. It counts
braces now. Same shape: a `preview` test that was a regex over the shell's source
went red when the spelling changed, having never observed a request in its life —
it runs the bootstrap and watches the network now, paired against the ordinary
page which MUST ask for the file preview must not.

**"A SERVER ANSWERED" AND "MY SERVER ANSWERED" ARE DIFFERENT FACTS.** Two red
deploys chasing a CI-only failure — lazy iframes, nesting, browser version, all
wrong. An earlier step in the same job already held the port; my server died on
bind, `>/dev/null 2>&1` swallowed the traceback, and Chrome measured 404s from
someone else's directory. **The fix that generalises is not the new port, it is
the sentinel**: write a file only this run could have written, fetch it back,
compare. One check would have turned two red deploys into one clear error.
Corollary: **suppressing stderr on a background process hides the only thing
that can explain it.**

**A MUTATION NOT SEEN TO FIRE IS NOT A MUTATION, AGAIN.** Twelve mutations on the
seam: eleven killed, and the twelfth SURVIVED — `firstAtClock` went into
`measure.mjs` untested and blanking it passed a full suite run. Four more on the
preview pace: three killed, and the fourth (a fixed 44-event window) survived,
which is the only reason the window test exists. **Both survivors were code I had
just written and believed in.**

**THE ARGUMENT-LEVEL ERROR OF THE WEEK, and Kevin caught it.** I kept the `hit`
label's second line under my own rule — "a second line that says whether it
COUNTS is the work" — and Kevin: *"I don't think it adds any value (except to the
'hits' counter that we don't track anyway)."* Exactly right. "Not a shot"
corrects a misreading of a number **that is not on the screen**. The rule
sharpened to: *a second line is earned only when it corrects a misreading of a
counter the viewer CAN SEE MOVING.* And the failure mode has a name now —
**explaining a metric we do not show is noise wearing the shape of rigour**,
which is more dangerous than plain noise because it reads as thoroughness.

**I CLAIMED A DOC EDIT IN A COMMIT MESSAGE AND THEN DID NOT MAKE IT.** `dae6e50`
said "docs/looking-at-pixels.md §6 is corrected"; it was not. Written while
intending to make the edit, pushed without it. Same defect the file is about: a
statement that reads as verified and is not. Corrected in `e991896`, in the open.
**Before writing "and X is updated" in a commit message, check that X is in the
diff.**

**AND THE ONE THAT COST THE MOST TIME: I ANNOUNCED WORK AS DONE WITHOUT PUSHING
IT.** "Committed as `9f4ff62`" — and `origin/main` was still on the previous
commit, so nothing I had built had reached the site. Kevin found out by reloading
and seeing no change. **Committed is not shipped. Verify `origin/main`, then the
deploy, then the live bytes.**

---

## 2026-08-14 (evening) — three checks found INCAPABLE of failing, in one afternoon

Fixing two live rendering defects (D1, D2) turned up three separate checks that
were not weak but **structurally unable to fire**. None was found by reading
code. Each was found by adding an instrument and watching what it said.

1. **`no team is painted from anything but the teams table` inspected ZERO
   rules.** It read `app.match(/<style>…/)[1]` — the FIRST style block — which
   has been the shared chrome since the day the chrome shipped. It then looped
   over rules looking for `.att`, `.tm`, `.ba` and found none, asserting nothing.
   Confirmed by mutation: restoring the old expression prints *"only 0
   team-selecting rules found to inspect"*. `page.py::csp` made the identical
   `re.search`-where-`re.findall`-was-meant mistake on the same document.
   **Fix shape: join every block, and assert a MINIMUM COUNT of things inspected.**

2. **Every CSP-refusal grep in `deploy.yml` was reading an empty stream.** Chrome
   routes console output nowhere without `--enable-logging=stderr --log-level=0`.
   The step named *"the index is permitted to run under its own CSP"* had greped
   that log since it was written and could never have matched. Half of it was
   real — the placeholder comparison — and that half was doing all the work.

3. **Then the pattern was wrong, twice.** With the console finally captured:
   `'Content Security Policy'` matched an INFORMATIONAL message (a warning, not a
   denial); `'Refused to'` matched nothing, because **Chrome changed the wording**
   — it now says *"Applying inline style violates the following Content Security
   Policy directive"*. The clause both eras share is `violates the following
   Content Security Policy`, and it excludes the warnings.

**What actually worked: installing a browser locally and printing every console
message verbatim.** Three CI round-trips produced three wrong guesses; one local
run produced the answer. The lesson in [[looking-at-pixels]] generalises past
layout — **any question about what a browser does is answered by running one.**

**THE CANARY EARNED ITS KEEP THREE TIMES.** It went red on the logging flags,
then on the first wording, then on the second — each time correctly announcing
*"this step cannot see a violation"* rather than passing while blind. A canary is
not decoration on a console-grep; it is the only thing standing between "nothing
was refused" and "nothing was heard". And a canary must be placed where it CAN
WIN: the D2 canary injected `.vtrack{display:inline}` before `</head>` and lost
the cascade to the page's own stylesheet, which lives inside `<body>` — it
measured a healthy 541px and would have gone green in the other direction.

**A DIRECTIVE THAT CANNOT TAKE EFFECT IS THE CSP-SHAPED VERSION OF THIS.**
`frame-ancestors 'self'` shipped in a `<meta>` policy with a comment calling it
protection against other sites framing us. It is one of three directives a meta
policy silently drops. Worse than absent: it reads as a promise. Removed, and
`test/shell.test.js` now forbids all three by name.

**AND THE FINDING THAT IS NOT ABOUT TESTS AT ALL.** Cloudflare injects its Web
Analytics beacon into this site's HTML — **only for browser user-agents**. The
deploy step `fetch the live site back and diff it against the repo` uses curl,
gets bytes identical to the repo, and passes; a Chrome agent gets an extra
`<script>`. Our own `script-src` refuses it, so *"this page calls nobody" is held
by the CSP, not by the HTML being clean.* Verified both ways with curl. This is
the project's most-repeated defect shape — **a check measuring something other
than what a visitor receives** — found still open inside a step written to close
it. On the build list as C; the deploy reports it every run as a `::warning::`.

**Also relearned:** `npm run gates` runs the tests BEFORE the build, so a builder
change needs `npm run build` first or the suite grades yesterday's `src/`.

---

## 2026-08-15 — the blocked-shots layer, and three failures of my own instruments

**A CHECK BUILT FROM THE INPUT'S OWN MODEL, caught only because the mutation
survived.** The blocked layer credits a block to the DEFENDING team — `e.own` is
the shooter's. My test for it looped the counted set asserting
`roster[e.blk].tid !== e.own`, which is a fact about **the data** and never reads
the tally. Replacing `t[blocker.tid]++` with `t[e.own]++` left it green. This is
the blocked-shot flip that once shipped a wrong flagship number, in mirror image,
and the test written for it could not see it. **Fix shape: compare the tally
against an expectation derived independently of the reducer, and assert the
fixture is not symmetric** — otherwise a flipped tally is indistinguishable from
a correct one.

**A MUTATION WHOSE RESULT WAS MEANINGLESS.** One mutation left an unterminated
template literal; the build failed, `src/` kept yesterday's bytes, and the tests
passed against stale HTML. I read that as "the test is weak" and nearly wrote it
down as a finding. **Every mutation on a BUILT artifact must assert the build
succeeded before its result means anything.** "Passes by not running", inside the
mutation harness itself.

**AND THE DEFECT THE SUITE STRUCTURALLY COULD NOT SEE.** The layer dims attempts
it does not count. With trails on *Current moment* — the default — the only mark
on the ice IS the current one, so it dimmed the play the viewer is watching to
20% and left the rink empty. Found by rendering it and reading a computed
opacity; invisible to 443 passing tests. Converted into something the suite CAN
see: the `.cur` class is asserted in the markup and the stylesheet's exemption is
asserted by pattern, so the pixel finding leaves a mechanical trace. See
[[looking-at-pixels]].

**A TEST ON PROSE IS SOMETIMES THE RIGHT INSTRUMENT.** The blocked layer must
publish no win rate — the blocks leader is the attempts trailer 81.7% of the
time, so the number is *uninterpretable, not merely uncertain* (CHENG). Nothing
structural stops one appearing; it would arrive as a plausible sentence somebody
adds. So the test greps the panel's rendered copy for `won|lost|win rate`, and
`archive.js` does the same for its own `what` strings. **When the property is "we
never say X", assert on the words.**

**One that worked without me:** `deeplink-render.test.js` carried the comment
*"this is the one that will notice the FIFTH layer"* and went red the moment the
layer existed. A test that names the future case it is waiting for.

---

## 2026-08-16 — R, and two axes I kept conflating

**A PROBE THAT EMITS A STATE FOR THE SHELL TO PARSE WILL BREAK ON A STATE IT DID
NOT ANTICIPATE.** The preview gate reported `rg.className` and the step parsed
the title positionally. `#rg` had carried exactly one class in preview forever;
the newcomer commit gave it a second, the title became `PREV newcomer preview 287
184 …`, and **every box failed identically — including the canary**, which is what
made it look environmental. Re-running in place failed the same way, and *that*
is what ruled the environment out. The fix is not a wider regex: **ask the probe
the QUESTION and have it emit the ANSWER** (`preview` / not), keeping the state
only as a space-free diagnostic. Same family as the swallowed `Address already in
use` — that step also suppressed the browser's stderr, so "the probe never
reported" could name a symptom and never a cause. It prints title, stderr and
HTTP status now; any one would have found this in one run.

**HONEST AND LEGIBLE ARE DIFFERENT AXES, AND I OPTIMISED THE WRONG ONE.** I
proposed surfacing "the layer this game is unusual on", defended on *derived, not
chosen*. Kevin killed it: *"let's not decide for the viewer what they should
consider unusual — the initial viewer doesn't know what they don't know."*
Derived-not-chosen answers **is this claim true?**; it does not answer **can this
reader use it?** Three faults: "unusual" is stated in a vocabulary the novice has
not learned; a filter that hides on ordinary games **teaches absence**; and
usualness is the LAST thing learned, not the first. The hook must be a fact about
the sport, true of every game, needing no prior knowledge — which is what
eventually lets a viewer judge unusual for themselves.

This is the SECOND time in two days I conflated two axes and CHENG or Kevin
separated them. The first was the verdict card: I argued *position on the page*
when the live question was *position in time* (a conclusion cannot exist in the
first period). **When a design argument feels stuck, check whether two different
axes are being argued as one.**

**A TEST WHOSE OUTCOME YOU CAN PREDICT PRODUCES NO INFORMATION.** I proposed
holding the first-visit mechanism for the novice test. Kevin wrote down the novice tester's likely
responses — *"where should I click", "why should I click there", "what's corsi"* —
which is the whole finding. And **a first visit is not renewable**: one person has
exactly one. Build the thing, then test it; testing an obviously-unfinished page
spends a subject on a result that was free. The safeguard against baking in our
guesses is his own rule — **mechanism not policy**: build the seam, put a draft
in it, let the test revise the words rather than the machinery.

**A TERNARY READ AT ONE STATE ONLY EXERCISES ONE BRANCH.** The singular/plural
mutation on the even-strength note SURVIVED because the reference game drops 49
and the test read one frame. It now walks to the frame where exactly one has
dropped, and fails if no such frame exists.

**AND THE COPY GATE I NEARLY BROKE THE SAME WAY IT WAS BROKEN BEFORE.** Moving
copy from markup into runtime strings, I extended a changelog-voice grep to cover
the whole script — which is a grep over source comments that legitimately discuss
the app's history, the exact failure the original author had hit and *documented
one test above the one I was editing*. Read what a VISITOR is shown, in each state
that shows it.

**COPY FAILS WITHOUT A STACK TRACE, and two kinds shipped in one afternoon.**
*Prose that enumerates a list rots*: the game page's opening paragraph named four
layers when there were five, and had done since the blocked-shots layer shipped —
nothing can check a sentence for being out of date, so the fix is structural (say
"add a layer below", let the buttons be the list, and forbid the enumeration in a
test). And *a sentence can be correct in isolation and wrong where it lands*:
splitting the greeting put "Here is why that is worth doing" immediately after
"Why add a layer?", so the block asked a question and announced its own answer,
with every test green. **Render the bundle and read the assembled text back** —
the source is a template holding the answer in pieces, so runtime is the only
place it can be proofread. Same argument as the pixels harness; see
[[looking-at-pixels]].

## 2026-08-16 (later) — A TEST WHOSE SUBJECT IS A CONSTANT IS TESTING THE ANSWER

CHENG's lint, after the `#start` defect, and it is the sharpest formulation this
file has:

> **A literal id can't see a relationship; it only ever knew the answer, not the
> question.**

`#start` said *"New to hockey? Start with the game at the top"* and pointed at a
**different game** for a week. Its href was set from `featured[0]`, correct when
written; §5.2 made the hero *most-recent* and the href stayed behind. **Both
halves stayed individually right and only the relationship broke** — and the test
asserted `game.html?game=2023020867`, so it went green straight through the
change it should have caught. **It certified the defect.**

The narrower failure mode, worth stating precisely: **a relationship spread
across two tests, each pinning its own constant, is untested.** The hero's id was
pinned in one test and `#start`'s in another, and nothing asserted they were the
same. The fix is to assert the *relationship* — frame, button and link name ONE
game — with no id in the test at all, so the selection rule can change again.

`render.test.js`'s nextup test is the same problem solved correctly by whoever
wrote it: it reads both clubs off the scoreboard, asserts the nav agrees, **and
then forbids the literal from appearing in the source at all.**

## A FAKE THAT INVENTS ELEMENTS DOES NOT MERELY MAKE ASSERTIONS VACUOUS — IT CONCEALS A CRASH

`homepage.test.js` had:

```js
getElementById(id) { return (ids[id] = ids[id] || make('div#' + id)); },
```

**It manufactured an element for any id ever asked for.** So when `#start` was
deleted from the markup and `$('start').href = …` was left in the script, the
tests assigned happily to a phantom — and a browser would have thrown
`Cannot set property of null` and **taken the entire hero down with it.** 463
tests green over a page whose front door would not render.

The fake now parses the ids out of the built page and returns `null` for
anything else, exactly as a browser does. **It caught the crash on the next run,
against the real artifact.** Same rule as the game page's fake, whose `hidden` is
deliberately *absent* rather than `false`: **a fake that cannot express the
failing state makes every assertion about it worthless.** Two fakes, two shapes,
one rule.

## A MUTATION THAT BREAKS THE HARNESS MEASURES THE HARNESS

Testing CHENG's requirement that a condition note must vanish when its condition
ends, the first mutation used `window.__stuck`. The fake document has no
`window`, so boot threw and **96 tests "failed"** — a result with nothing to do
with the claim, and one that reads as a kill. Redone with a module-scoped
variable: killed by exactly one test, the `1551` control case. **Companion to the
older rule that every mutation must build first.**

## PROSE THAT REFERS TO ANOTHER ELEMENT HAS A DEPENDENCY NOTHING IN A TEXT FILE CAN SEE

Three instances now, all found by rendering rather than reading:

| the sentence | what it depended on | how it broke |
|---|---|---|
| *"control, shots from the slot, goaltending, or why play stopped"* | a **count** of layers | a fifth layer arrived |
| *"start with the game at the top"* | another element's **identity** | the hero changed rule |
| *"Press ▶ Play from start **below**"* | a **position** | true at 390×844 by 171px, **false at 360×640 by 21px** |

The structural fix in each case was to stop making the claim: let the buttons be
the list, give the link and the hero one source, quote the button's label instead
of its location. **A sentence that asserts no position cannot have a stale one.**

## AND THE STYLESHEET CAN BE THE THING DOING THE DAMAGE

`Goalie Stopped After Sog` looked like a copy defect in the builder. Half of it
was `text-transform:capitalize` on `.rsn` and `.whtally` — which, applied to the
*written* label that replaced the raw key, gives **"Goaltender Covered The
Puck"**. The fix would have silently half-worked. `::first-letter` suits both a
written name and the raw string an unknown key still falls back to.

**Before declaring a copy fix done, render it.** The builder is not the last
thing that edits the words.

## ⭐ FOUR HAND-WRITTEN FAKES OF ONE DOCUMENT, AT FOUR FIDELITIES

`render.test.js`'s `boot()` fake fired only `addEventListener` handlers (the
TRANSPORT assigns `.onclick`) and answered `setTimeout` with `0`, dropping the
callback. Both fixed — the timer is captured in **one slot** (`clearTimeout`
really cancels, so a queue would let a cancelled frame fire later) and
`advance(n)` **returns how many frames actually moved**, so a dead timer cannot
be mistaken for a quiet one.

**I then reported this as "the play loop had never run once in that file" and
"the whole transport was unclickable in tests". BOTH WERE WRONG**, and CHENG's
follow-up is what found it: *which existing assertions were passing only because
the harness was inert?*

| fake | fires `onclick` | runs timers |
|---|---|---|
| `goalie-view.test.js` | yes | **yes** — `timers.push` + `tick(n)`, i.e. exactly what I "added" |
| `smoke.test.js` | yes | no |
| `delaysOf` (inside `render.test.js`, forty lines away) | calls it directly | yes, with a tick budget |
| **`boot()` (`render.test.js`)** | **no** | **no** |

**The capability was not missing from the project. It was missing from ONE COPY
of the document, three feet from a copy that had it.** Same shape as builder
drift, and the reason `src/*.html` is generated rather than hand-edited.

**Divergence and absence want different fixes**, which is the whole reason the
distinction was worth the twenty minutes.

## AND THE FOLLOW-UP IS MECHANICAL, SO ANSWER IT MECHANICALLY

*"Which existing assertions were passing only because the harness was inert?"* is
not a question to reason about. **`throw` inside the newly-reachable code
(`step()`, the `play` and `work` onclick handlers), rebuild, and read off which
tests fail.** Any pre-existing test in the list was reaching that code all along;
any test NOT in the list never touched it.

**Answer here: none.** All four pre-existing failures reach the handlers for real
— one through `delaysOf`, three through `smoke.test.js`'s already-correct fake.
The repaired paths had *no* pre-existing tests, so there was nothing to convert
from vacuous to real.

**The probe is cheap and it beats an argument.** It also cost me two published
claims, which is the point: I had asserted a negative about coverage without an
instrument for it — the exact failure this file's title is about.

## A TEST THAT ARRIVES WHERE IT ALREADY WAS IS TRUE FOR THE WRONG REASON

The mutation that survived the first pass was the central one: *does a jump bump
the attempt counters?* The test jumped to a frame it **had already rendered**, so
`prevA` already equalled the count there and `a > prevA` was false **whatever the
code did**. Green under the fix and green under the mutation.

This is *impose the conditions of a measurement, don't request them* in its
sneakiest form: the action was right (a jump), and the STATE the action needed to
be observable in was never set up.

The real case was the one the feature exists for — the **deep link**.
`?at=3-05:00` zeroes `prevA`/`prevH` and lands the playhead where fifty attempts
are already on the board. And the test now asserts it **landed on more than
twenty attempts**, so it cannot pass by arriving somewhere nothing had happened.

**Ask of any passing test: what state would have to be true for this assertion to
be able to fail? Then check that the test creates it.**

## POINTER-EVENTS: NONE IS DEAD-CODE DETECTION

`$('caption').addEventListener('click', …)` had **never fired once.** `#rg
.caption` carries `pointer-events:none` — it floats over the ice and would
otherwise swallow clicks meant for the marks underneath — and nothing overrode
it. It was also wrong on its own terms: it opened the why-card for the last slot
shot whatever the caption was describing.

**Fourth instance of dead weight reading as coverage** (the `goal` row in `LAB`,
`rosterSpots` in shell.test.js, an assertion on `undefined` in
homepage.test.js) — and the **first found by reading the stylesheet rather than
the script.** Same lesson as `text-transform:capitalize`: the CSS is part of the
program, and it can make a listener unreachable as easily as it can rewrite a
word.

## A RULE APPLIED TO ONE ELEMENT OF TWO, BECAUSE THE OTHER HAD NO SUBJECT

`?team=WSH` served the whole front-door pitch above the club the visitor had
named in the URL — 0.90 screens at 1100px, 1.24 at 390px, the club's own name
below the fold at both.

**The rule was already there and already written down**, one branch away:

```js
drawGrid(games);
/* ONLY ON THE FRONT DOOR. A fan who asked for BUF is not looking for a
   Dallas game; the hero exists for the visitor who has not chosen. */
drawHero(cat, measures);
```

It covered the hero and not the thesis, and **not because anyone decided that.**
`drawTeam` clears the page with `main.textContent = ''`, and the thesis, its
heading and the rates scale sat **outside `#main`** — so the team view had no way
to say *"and not that."* The rule stopped at the boundary of the mechanism that
could express it.

**The fix is a subject, not three hidings.** One `<section id="argument">`, hidden
by one line. Hiding the three children individually would have worked identically
today and left the next element added above `#main` to be missed the same way,
which is exactly how this arose.

**The shape to look for: a correct rule whose scope is set by what the code can
address rather than by what the rule means.** Ask of any conditional behaviour —
*could this rule reach everything it should, or only everything it can?*

## AND THE REORDER THAT CAUSED IT WAS MEASURED — AT ONE ENTRY POINT

Moving the thesis from screen 4.53 to 0.50 was right for the front door, checked
at three viewports, and put it in front of the `?team=` visitor too. **One page,
two audiences, and the measurement covered one of them.** `?team=` is not exotic:
it is the ONLY link out of a game page into a list.

**A page with more than one entry point has more than one layout to measure**, and
viewport width is not the axis that varies — the URL is.

## AND THE THREE-WAY PUSH CHECK HAS A STALE-CACHE HOLE — IN BOTH DIRECTIONS

The habit (origin matches local · blob in the remote tree · fetches back over the
wire) reported a **false negative** on `docs/blocked-card.md`: local 13,933
bytes, `raw.githubusercontent.com` 7,923. The push was fine — the blob sha in
`origin/main` matched `git hash-object` exactly and the GitHub **API** reported
the right size. **raw.githubusercontent.com serves a cached copy for a few
minutes.**

**The dangerous direction is the other one.** Step 3 usually greps the wire for a
marker. If the marker already existed in an EARLIER section of the same file, a
stale copy passes the check while missing everything just added — the check goes
green on the old bytes.

**So step 3 compares the whole file, never greps for a phrase:**

```
curl ".../<path>?cb=$(git rev-parse HEAD)" -o /tmp/wire && diff -q /tmp/wire <path>
```

The commit sha as a cache-buster and `diff` rather than `grep`. And when the wire
still disagrees, `git ls-tree origin/main -- <path>` against
`git hash-object <path>` is the authority — content-addressed, so it cannot be
stale and cannot be fooled.

## ⭐⭐ A NEW CLASS: THE MEASUREMENT WAS RIGHT AND THE OBJECTIVE FUNCTION WAS WRONG

Two header layouts for the blocked card, measured in a real browser at two
viewports: **inline 320px desktop / 538px phone; stacked 341px / 516px.** Correct
numbers. I took the inline one, and wrote the reason into the source: *"Kevin's
stated viewing perspective is the laptop."*

Then Kevin: he uses a laptop, and the novice tester will use a phone.
**The audience the whole site exists for is on the
smaller screen**, so 21px of laptop buys 22px of phone and the trade reverses.

**CHENG: this is the first failure in this project that none of our techniques
could have caught.** Mutation testing cannot see it. Cross-validation cannot.
Three-viewport measurement cannot — *it produced the correct numbers and the
wrong conclusion.* Every prior entry in this file is a bad measurement or a
vacuous check. This is a **good measurement pointed at the wrong target**, and
more measuring makes it worse rather than better, because each run reconfirms the
number.

**The only defence is procedural:**

> **State who the reader is BEFORE you measure, not after.**

It nearly shipped — one question away. And it will recur: **every layout trade
has an implicit reader, and the one who is easiest to imagine is the one who
already understands the product.**

## ⭐ WHEN A SENTENCE EXISTS TO PREVENT A MISREADING, ASK WHETHER AN INVARIANT CAN

The blocked card carried *"a share of the attempts taken, not a rate of
winning"* — a disclaimer against reading a bare `27.8%` beside two team names as
a win rate. Deleted, and replaced by a **test**: no figure on that card may
appear without a denominator on the same row.

> **A disclaimer decays.** It gets edited, shortened, falls below a fold on a
> phone, or stops matching the thing it guards. **An invariant cannot.**

*"A guard rather than an apology."* Same shape as the CSP replacing the `fetch(`
grep, and `place()` replacing three filter sites (CHENG).

The precondition matters: the sentence was only safe to delete because the frame
had changed underneath it — every figure now names its own denominator, so the
misreading it guarded against was no longer available. **Delete the disclaimer
when the invariant makes it unnecessary, not when it is merely inconvenient.**

## ⭐⭐ THE SIGNATURE BUG, NAMED (CHENG, 2026-08-17): TWO HALVES CORRECT, THE RELATIONSHIP UNSTATED

Five instances now, and CHENG's framing is the one to keep:

> **Both halves individually correct; the relationship between them never
> written down anywhere.**

1. `#start` and `featured[0]` — prose naming a game the page chose separately.
2. The script's click handler and `pointer-events:none` — a listener that could
   never fire.
3. The counting path and the drawing path (shootout coordinates), fixed by
   `place()`.
4. **`dwell` asking `isHD(e)` while the caption asked `hdOn && isHD(cur)`** — a
   pause built to give a caption room, firing when there was no caption. 19.6%
   of a replay.
5. **`dwell` (a `setTimeout`) and the caption (a CSS animation)** — 2067 ms of
   text over a 1300 ms frame, so the caption **finished on the NEXT play, 6 of
   6.** The site's whole claim is that what is on screen traces to a recorded
   event; this made the caption *wrong about the ice*, not merely slow.

**All five were found by looking at the running artifact. None by reading code.**

The fix shape is always the same: **one source both readers consult**, not a
third check that has to agree. `captioned()` for the pace, `place()` for
coordinates. And where the two halves live in different languages — JS and a
stylesheet — **the number must live in the one the tests can see**, pushed to
the other. A duration that lives only in CSS is invisible to a render harness
that has no stylesheet.

## ⭐ A TEST CAN PASS BECAUSE THE FIXTURE SITS AT THE EXTREME OF A DISTRIBUTION

*"The preview is not a metronome"* asserted the first 14 waits were not all
equal. Under a new pacing rule it **still passed** — and CHENG had predicted it
would, calling that evidence the design was right.

**Measured instead of assumed, over 59 games spread across the archive:** the
property held in **15.3%** of games (was 72.9% under the old rule), median index
of the first qualifying event **26**, against a 7-event window. It passed on the
reference game because that game carries a penalty at **index 2 — the minimum of
the distribution.**

> **When a test's subject is a property of the DATA, ask what fraction of the
> corpus has it. One fixture is one sample.**

Sibling of *a test whose subject is a CONSTANT is testing the answer* and of *a
test that arrives where it already was is true for the wrong reason*. The repair
was not to delete the test but to **move the guard to a population where the
property is guaranteed** — the whole replay rather than the opening window.

## A RENAME VERIFIED BY GREPPING FOR THE DEPARTED TERM

`⚡ Shot from the slot · #16 Dorofeyev from the slot` — **31 of 31 captions**,
live, for however long since the *high danger* → *shots from the slot* rename.
The trailing clause had been the sentence's only mention of the slot; after the
rename it said it twice.

> **A grep can prove a word is gone. It cannot see that removing it left a
> sentence saying the same thing in both halves.**

The assertion that replaces the grep is CHENG's and is deliberately crude: **no
caption may contain the same three-word phrase twice.** It reads rendered output,
which is the only surface the defect ever existed on.

## ⭐⭐ A STALE `.pyc` SERVED A REVERTED MUTANT — AND IT DEFEATS MUTATION TESTING ITSELF

2026-08-17. CI failed *"the working tree must be unchanged by a build"* while
every local build reproduced the wrong output. The cause:

```
2026-08-17 11:24:48.947  19039  builders/page.py
2026-08-17 11:24:48.339  10868  builders/__pycache__/page.cpython-312.pyc
```

**CPython invalidates bytecode on (source mtime in WHOLE SECONDS, source size).**
A mutation cycle rewrote `page.py` inside the same second as the last compile,
and that mutation changed **only letter case**, so the size matched too. Both
checks passed, the stale `.pyc` was reused, and **the mutant kept shipping into
every build after it had been reverted.**

> **A mutation can read as KILLED while the test ran against different code, or
> as REVERTED while the mutant is still live.** Nothing you do at the source file
> can see it.

This is *a mutation not seen to fire is not a mutation* with a cause no
inspection of the diff can reach. **Only IMPORTED modules are cached** — the
entry script never is — so `build_main.py` mutations were never exposed and
`page.py`'s were.

**The fixes, both needed:**
- `PYTHONDONTWRITEBYTECODE=1`, **exported for the whole chain**. Written before
  the first command only, `&&` does not carry it to the rest — caught by
  listing the directory afterwards, not by assuming.
- **Probe that the mutant reached the ARTIFACT before believing any verdict.**
  The re-run greps the built page for the mutant string first; a verdict on a
  build that never contained the mutation is a verdict about nothing.

## THE SAME SIGNAL FOR TWO DIFFERENT FAILURES

The deploy's production check breaks its retry loop only when *fetch AND compare*
both succeed, so **content that never matches exhausts the retries and reports
"never served this deployment"** — which reads as DNS and sends you to the wrong
dashboard. Three failures were content; one was propagation; the message was
identical. Cost a wasted re-run.

> **When one message can be emitted by two different causes, it is not a
> diagnosis.** Same shape as the caption's `on` class standing for both "showing"
> and "shown once, hours ago".

## AND THE RULE APPLIED TO THE INSTANCE THAT FAILED, AGAIN

The email fence needed normalising at **five** comparison sites. The first pass
fixed the two in the step that failed; the next run failed at the third; a
`grep -n 'cmp -s'` found the remaining two. **Enumerate the sites, then change
them all** — the `?team=` defect in one sentence.

## ⭐ A TEST THAT GOES RED WHEN THE CLAIM GETS STRONGER IS PINNING A SPELLING

`assert.match(h, /Not affiliated with or endorsed by the NHL/)` broke when Kevin
asked to **widen** the disclaimer. The page got more careful and the suite called
it a regression.

> **Assert the CLAIM, not one wording of it.** Three refusals are made
> (affiliated / endorsed / a product of), the league is named, and the clubs are
> covered too — all of which survive any rewording that keeps the promise.

Same family as *a chosen constant that drifts* and *a test whose subject is a
CONSTANT is testing the answer*. The tell is a literal string in an assertion
about a **commitment** rather than about a format.

## RETIRING A TEST: THE DOCTRINE OUTLIVES THE ELEMENT THAT CARRIED IT

Cutting the home page's three-bar scale took **twelve** tests with it. Ten died
with their subject and the deletion is recorded in the file where it happened —
not silently, because ten disappearing assertions look identical to erosion.

**Two were RETARGETED instead**, and the rule is the one to keep:

> **Ask what the test was protecting, then ask whether that thing still exists
> anywhere.** *"The page states what it is"* moved to the `<h1>` the sentence
> became. *"Every rate carries its denominator"* moved to the hero caption — the
> only place the front page still prints a figure — and now requires the
> reference class **in the same sentence** as the rate.

Same move as the attribution guard following *"All credited to the shooter"* onto
a different surface when the ice sublines were retired.

## ⭐ A CANARY MUST MUTATE SOMETHING THE SUBJECT ACTUALLY CONTAINS

The broken-link canary did `html.replace('read-the-game.html', 'no-such-app.html')`
to prove the link checker fires. When the workshop list moved to its own page the
index stopped containing that filename, so **the replace changed nothing and the
canary reported that the check was broken** — a false alarm that reads exactly
like a real one.

> **Assert the mutation's target is present BEFORE mutating.** A canary is a
> mutation and inherits *a mutation not seen to fire is not a mutation*.

## `new URL("/x.html", base)` RESOLVES AGAINST THE ORIGIN, NOT THE BASE

The nav gained root-relative hrefs and the link checker reported existing files as
missing. Third instance this session of the same shape — **a checker right that
something is not a page and wrong about what that means** (the others: `mailto:`
read as a missing page, and `never served this deployment` emitted for a content
mismatch). Strip the leading slash, and prefer *what namespace is this in?* over
*does this string look like a path?*

## A SCOPE THAT WAS RIGHT WHILE THE CONTENT WAS IN ONE PLACE

*"No page in src/ ships unlinked"* scanned **index.html only**, which was correct
while every link lived there. The workshop list moved one page out and the test
called nine reachable pages orphans. **When content moves, re-ask what population
the test was ever meant to cover** — the answer was "linked from anywhere a
reader can get to", and it had been silently equal to "linked from the index".

---

## 2026-08-17 (late) — the harness, the mutation that missed, and a failure with no bypass

### ⭐ A MUTATION THAT FIRES AT THE WRONG SITE LOOKS EXACTLY LIKE A DEAD TEST
Canarying the preview's new layer, both mutations "survived" and I was one step
from writing up *"the test measures nothing."* **The canary was broken.** The
string `corsiOn=true;setCorsi();` appears **twice** in the builder — once in the
deep-link handler, once in the preview block — and `replace(a, b, 1)` hit the
first. The mutation fired, the build changed, the artifact contained it, and it
was in code the test's URL never reaches.
**The rule this adds to "a mutation not seen to fire is not a mutation":
ASSERT THE ANCHOR IS UNIQUE.** `assert s.count(a) == 1` before replacing. A
count of one is the cheapest possible proof that you mutated the thing you meant
to. Every canary in this session now does it.

### ⭐ A HARNESS ASSEMBLED TWICE IS THE SAME DEFECT AS A RULE IMPLEMENTED TWICE
The page gained one global (`window`, so a framed preview can post its totals to
the parent). **Six test files construct the page bundle with their own
`new Function(...)` call**, listing the injected globals separately. Three of
them went red **against a page that was correct**, with `window is not defined`.
This is the "four hand-written fakes of one document at four fidelities" entry,
grown to six. `render.test.js` now builds it in ONE place for both its harnesses;
the other four were widened. **Count the constructions before adding a global.**

### A FAKE THAT CANNOT EXPRESS A STATE MAKES EVERY ASSERTION ABOUT IT VACUOUS
Third instance (after `localStorage` always answering null, and `hidden` absent
from `el()`). The page asks `window.parent !== window` to decide whether it is
framed; a fake with no `window` cannot answer, so the behaviour was untestable
rather than untested. **Model the state, do not defend against its absence.**

### AND THE MIRROR: DO NOT ASSERT THROUGH A FAKE WHAT ONLY THE MARKUP CARRIES
I asserted the game page's default board label via `boot()` and it failed —
the fake's elements start empty, because that text is a **text node the document
ships with**, not something the script writes. Asserting it there measures the
harness's ignorance. **It is checked against the built HTML instead.** Ask where
the value actually comes from before choosing the instrument.

### A LAZY ID REGISTRY MAKES "NEVER TOUCHED" STRONGER THAN "EMPTY"
`homepage.test.js` registers an id the first time the page asks for it. So
`!ids.herosub` proves the page never even reached for the element — a stronger
claim than `textContent === ''`, and the correct assertion for "absent until the
number arrives". Asserting `.textContent` on it threw instead.

### A MANUFACTURED PROPERTY IS THE INVENTS-ELEMENTS DEFECT WEARING A DISGUISE
The hero accepts attempt totals only from the frame it made
(`e.source !== f.contentWindow`). Giving every fake element a `contentWindow`
would have made that check pass for any sender — **two `undefined`s comparing
equal is a guard that cannot fail.** Only `tag === 'iframe'` gets one.

### `$?` AFTER A PIPE REPORTS THE LAST COMMAND IN THE PIPELINE
`npm run build 2>&1 | tail -3; echo $?` printed `0` for a build that exits `1`.
I nearly reported "the broken-link check is a warning, not a gate". **Redirect to
a file and check the exit code directly** when the exit code IS the finding.

### ⭐ A NEW FAILURE SHAPE: TWO CORRECT FIGURES, ONE UNSANCTIONED RATIO
`attemptMix.byType` publishes shots-on-goal and goals. Dividing them looks
exactly like the archive save fraction and is wrong by 0.58 points, because 5.9%
of goals in play are empty-net. **CHENG diagnosed the project's signature bug —
two paths to one quantity, one carries the rule — and it is NOT that.** `byType`
is correct; corsi is *obliged* to count an empty-net goal as an attempt (9 of 9
verified). Both operands are blameless.
> **Two published figures, each correct, whose ratio is a third quantity nobody
> computed or sanctioned — and the division is available, plausible and wrong.
> There is nothing to delete.**
**The fix is therefore different in kind: publish the sanctioned number in the
same object as the counts that invite the wrong one.** Supply the right figure
rather than warn against the wrong one — *an invariant instead of a disclaimer*,
one level up. Corollary: **check the diagnosis before applying its prescription**,
even when it comes from CHENG and even when the shape is one we genuinely have.

### THE EMPTY-POPULATION RULE APPLIES TO RENDERING, NOT JUST TO NUMBERS
`archive.js` refuses a rate over an empty population because *"0 reads as a
finding."* The control bar did the opposite: `tot = a+h||1` dodged the division
by zero **and drew the result anyway**, so at 0-0 the whole bar rendered in the
home colour and every game's opening faceoff announced that one team held all the
control. **A proportion of nothing, drawn as certainty.** Look for the doctrine
you already have one file over before inventing a guard.

### A TEST WHOSE SUBJECT IS A TYPED ID IS PINNING ITS OWN ANSWER
`NEWEST_ID` in the home-page fixtures is **derived the way the page derives it**
(newest, in scope, published) rather than typed. A literal would silently name
the wrong game the moment a newer row joined the fixture, with every assertion
still green.

### AND A CLAIM IN MEMORY DESCRIBED A CAPABILITY, NOT A SHIPPED FEATURE
*"Search, team filter and calendar are all one `.filter()`"* sat in the
architecture notes for months and read as a description of the UI. **None of them
exist.** It described what the data SHAPE makes cheap. It survived because nobody
ever tried to use it — found only because an outside review said discovery felt
thin and I went to check. See [[verify-inherited-claims]].

## 2026-08-18 — ⭐ A NEW CLASS: RIGHT QUESTION, BIG ENOUGH SAMPLE, STRUCTURALLY BLIND INSTRUMENT

The catalogue so far was about tests that could not fail, checks with no
instrument for their axis, and objective functions chosen wrong. This one is
different and none of those techniques catch it: **the sample was not too small
and the code was not wrong.**

`docs/on-the-ice.md` said three published games lack shift charts, from a
230-game uniform sample. **It is 155 games in three populations, the largest 97.**

> **Shift absence is DATE-SHAPED — when it happens it takes every game that
> night. A uniform random sample answers "how often", which was never the
> question. The question was "where".**

One probe per date, all 715 dates, found it in one pass: 2023 preseason entire
(97), the 2025-04-08..14 window entire (55 + one straggler), two all-star
exhibitions. 2024 and 2025 preseason DO carry shifts, 10 of 10 each — so 2023's
is an outage, not a rule about exhibition hockey.

**Then re-run the claims that shared the discredited instrument, not just the
one that failed.** §3's faceoff-coordinate claim came from the same 230 games. It
held and grew: **52,742 of 52,742 across 928 extracts covering all 715 dates.**
*A claim that survives a better instrument is worth more than the same claim
asserted twice.*

### ⭐ AND THE GENERALIZATION BROKE, WHICH IS THE MORE USEFUL HALF
CHENG stated the rule as *"coverage failures in this feed are date-shaped
because they are endpoint outages, so any 'X is present in N of N' claim needs a
date-covering probe."* Four suspect claims were re-probed over **299,981 events**:

- `rem` — 299,981 of 299,981.
- `sit` — 23 gaps, falling on **exactly the 15 2023-preseason dates.** The rule
  working.
- **`blk` — four absences on four dates across three seasons. No cluster.**

**A per-date probe cannot find four events in 300,000; only reading every event
does.** So there are at least two shapes — *date-shaped when it is an endpoint
outage, event-shaped when it is an individual record* — and the first question is
**"which shape is this?"**, never "how big is my sample?"

**The code had already survived it.** `blocked.js` said *"'always so far' is not
'always'"* and pushed unresolvable blockers into `unknown`. The evidence was from
the weak instrument; the caution was right anyway, and **that branch fires on
four real archived events.** A comment that distrusts its own evidence is worth
more than one quoting a bigger number.

### ASSERTING A PROPERTY EXISTS IS NOT ASSERTING A DIFFERENCE
The learn page's two card groups must be *visibly distinct*. The test asserted
`.grid.learn.ours .card{border-left:` — and **survived a mutation setting the
accent to the same colour as every other card's edge.** A border-left existed; it
distinguished nothing. The axis was *difference*, and the instrument only saw
*presence*. Fixed by comparing the accent token against the default edge token
AND against `.limits`, so the test states the relationship — *the marked group
reuses the token that already means "our claim"* — instead of a literal.

### AN EMPTY FETCH FAILS A DIFF AND LOOKS EXACTLY LIKE A CONTENT MISMATCH
`curl -s ... -o live.html` wrote **0 bytes** and the diff against local reported
a difference. It read as "the deploy shipped the wrong bytes" and was "the
request returned nothing". `-s` hid the status. **Print the status and the byte
count before believing a diff** — the failure was upstream of the comparison.

### CLOUDFLARE PAGES 308s EVERY `.html` URL, AND STRIPS `email_off`
`/what-you-can-see.html` answers **308**, not 200, redirecting to the
extensionless path — so **every internal link on this site takes a redirect
hop**, and a `curl` without `-L` measures the redirect rather than the page. The
query string DOES survive (verified on a real door: `/game?game=…&at=…&layer=…`,
200). And a whole-file live-vs-local diff will always show one difference:
Cloudflare consumes the `<!--email_off-->` markers, which is the directive
working. Any "live == local" check must expect exactly that.

## 2026-08-18 (later) — ⭐ THE THEME OF THE DAY: THE INSTRUMENT SAW *PRESENCE* WHERE THE QUESTION WAS *REALITY*

Five separate times, in one session, on my own work. Different surfaces, one shape.

### ⭐ A CONDITIONAL ASSERTION IS A TEST THAT DECIDES WHETHER TO BE ONE
The attacking-direction test checked the arrow against `id="netHome"` in the
rendered rink. **`netGlyph(id, gx, col)` takes that id and never emits it**, so
the regex could never match — and the whole check sat behind `if (homeNet)`,
passing while a mutation flipped both arrows. **Never guard an assertion on
finding its own anchor.** Assert the anchor exists, THEN assert about it.

### A STRING IN THE SOURCE IS NOT A THING ON THE PAGE
`assert.ok(SHELL.includes('class="rulel'))` **survived commenting the draw out**
— the string was still there, inside `<!--line class="rulel`. Moving it to the
render harness did not help: **the fake document keeps `innerHTML` as an
unparsed string**, so a "render-level" check was still a string check. Anchoring
on `<line class="rulel` — the element actually opening — killed it.

### ⭐ TWO INDEX SPACES THAT MATCH BY COINCIDENCE SURVIVE EVERY EXISTENCE CHECK
The restart label paired whistles with `x.spotId === i`. **`i` indexes EV, the
PLAYABLE events (269 of 320); `spotId` indexes the whole game.** Different
spaces. It matched often enough to render plausible labels and to survive
*three* mutations. Only a **count** separated coincidence from correctness:
**44 placed whistles, 44 labelled frames.** Anything that is right "sometimes"
passes every existence check and fails a total.

### A COUNT CAN DISCRIMINATE WHEN A PREDICATE CANNOT
Crediting the SHOOTER's club instead of the blocker's satisfies "an abbreviation
is present" perfectly. The two are separable only by tally — **18 blocks against
22** in the reference game — derived from the roster, never typed. *Assert the
one number that differs between the right answer and the plausible one.*

### PRESENCE IS NOT DIFFERENCE
`.grid.learn.ours .card{border-left:` survived setting the accent to the SAME
colour as every other card's edge. A border existed; it distinguished nothing.
Fixed by comparing the accent against the default edge AND against `.limits`, so
the test states the relationship rather than a literal.

## AND FIVE SMALLER ONES, EACH PAID FOR ONCE

- **VERIFY THE MUTATION REACHED THE ARTIFACT THE TEST READS.** I confirmed a
  mutation in `src/game.html`; `render.test.js` reads `src/read-the-game.html`.
  Both are written by `build_main.py`. *"A mutation not seen to fire" now also
  means "seen in the wrong file".*
- **EQUIVALENT MUTANTS ARE THE CANARY'S FAULT, NOT THE TEST'S.**
  `cur.lines && cur.lines.length` vs `cur.lines` loops zero times either way;
  reformatting `4s` as `0:04` carries the same value. Don't "fix" a test for
  those — say they are equivalent.
- **SCOPE THE SCAN TO THE SURFACE.** "No player name in the base view" caught
  nine forwards, because a GOAL names its scorer in every view. `plabel` was the
  surface; `glab`/`plabsub` are a different rule.
- **MATCH THE THRESHOLD TO THE INSTRUMENT.** `xs.length > 20` failed at 16 —
  some attempts render as an SvgPen `<g>` with no `cx`, so circles never see
  them all. Set the bar to what the instrument can collect and say why.
- **A COUNT INSIDE A TEST'S OWN TITLE ROTS LIKE PROSE.** *"on all three
  surfaces"* stayed true-sounding after the tally row was deleted. Same
  dependency as a sentence counting cards on a page.

## ⭐ AND THE OTHER DIRECTION: EXISTING TESTS EARNED THEIR KEEP, THREE TIMES

Worth recording because the catalogue is otherwise all failures.

- **A copy regression I introduced.** Renaming cards to "The faceoff it forces"
  and "The delayed penalty" silently removed the concept words *Faceoffs* and
  *Penalties* — and a test asserting the learn page NAMES what the site teaches
  caught both.
- **A decision defended itself nine days later.** My first restart label used a
  second line; *"on the ice, the ONLY second line left is a goal's assists"*
  failed it, carrying Kevin's 2026-08-16 call that on-ice subtext was crowding.
  Neither of us remembered it.
- **Doctrine held under an instruction to delete it.** Trimming the stoppage
  card would have removed the rule citation; *"the provenance travels with it"*
  failed, so it was flagged to Kevin instead of quietly dropped.

**A test that encodes WHY is a decision that can defend itself. One that encodes
only WHAT is a fixture.**

## AND TWO ABOUT THE HARNESS, NOT THE CODE

- **AN EMPTY FETCH FAILS A DIFF AND LOOKS EXACTLY LIKE A CONTENT MISMATCH.**
  `curl -s -o live.html` wrote **0 bytes** and the diff read as "the deploy
  shipped wrong bytes". `-s` hid the status. **Print status and byte count
  before believing a diff.**
- **CLOUDFLARE PAGES 308s EVERY `.html` URL** to the extensionless path, so every
  internal link takes a redirect hop and a `curl` without `-L` measures the
  redirect. The query string DOES survive (verified on a real door). And a
  live-vs-local diff always shows one difference: Cloudflare consumes the
  `<!--email_off-->` markers. Expect exactly that and nothing else.

## ⭐ 2026-08-19 — A CHECK I ADDED REFUSED 864 GAMES, VERIFIED 8-OF-8 FIRST

The worst thing shipped this project so far, and the cheapest possible lesson.

`validate()` gained *"penalties credited to the offending team"* — `own` must
equal the committing player's team, checked against `rosterSpots`. **Verified 8
of 8 on the reference game, mutation-tested, committed with a message about
measuring rather than assuming.** Then it ran over 4,553 games and refused 864.

    "failedChecks": { "penalties credited to the offending team": 864 }

**A BENCH MINOR HAS NO COMMITTING PLAYER.** Too many men on the ice is committed
by the TEAM: the feed carries `servedByPlayerId` and no `committedByPlayerId`, so
`team_of.get(None)` never equalled a real team id. **843 games that were
published the day before became unreachable**, evenly spread across all three
seasons — 334/302/343, which is a regression signature, not a population.

### Why 8-of-8 could not see it

The reference game contains **no bench minor**. The sample was not too small; it
was *the wrong sample* — it could not contain the case that breaks the check, at
any size. This is the instrument-shape lesson again, and the same sentence covers
three separate failures this week:

> **A check that passes on the sample cannot see the case the sample does not
> contain.** True of test fixtures, of layout modes, and of the reference game.

### The repair shape, which is the reusable part

**Check what CAN be checked and COUNT what cannot** — do not weaken the
comparison until it passes:

    penalties credited to the offending team (8 of 8 checked vs rosterSpots;
    0 have no committing player -- a bench minor is served, not committed)

A skipped case that is counted stays visible (doctrine 9). A comparison loosened
until it goes green does not, and looks identical in the log.

**The regression test carries BOTH halves** — a bench minor must not refuse the
game, AND the penalty that still can be checked must still fire — because
*"stopped refusing" is also what a deleted check looks like.* Mutated in both
directions.

### How it was caught, which matters

Not by a test. By writing a status document and noticing the live catalog said
**3,574 published** where memory said **4,417**. *Reconciling a number against a
written record found a defect that 559 tests and a green pipeline did not.*

## ⭐ THE CLASS IS NOT THE SWEATER — a test that read the label off the wrong attribute

Kevin: *"text says CAR, visual shows Vegas."* The blocked-shot figure was drawn
in the SHOOTER's colours while the label named the BLOCKER.

Fixing it, the first test asserted the figure's **CSS class**. A mutation that
corrected the class and left the **jersey colour** as the shooter's **passed
every assertion** — which is Kevin's exact reported symptom, green.

> **An element can carry the right identity in the attribute a test reads and the
> wrong one in the pixels a person sees.** Assert the thing that is looked at.

Fixed by tying colour to class: each side must use exactly one jersey across ALL
figures, so a blocked shot in the other team's colour puts two jerseys under one
side.

**And its count guard earned its place by FAILING first.** I asserted the two
sides block different amounts so a count could tell blocker from shooter. They do
not — the reference game blocks **22–22**, and the assertion said so instead of
passing vacuously. What separates them is that the two *distributions* differ:
blockers 22–22, shooters 26–18. **A guard that refuses to be vacuous is worth
more than the assertion it protects.**

## ⭐ 2026-08-20 — I INVENTED A DEFINITION AND KEVIN CAUGHT IT COLD

The archive surfaced a feed value nobody had seen: `failed-bank-attempt`. I
glossed it in one line — *"a bank off the boards that didn't come off"* — with
**nothing behind it**. Kevin, who knows hockey: *"this is a new one to me."*

**The gloss was wrong in its specifics.** Measured: **23 of 24 are AT OR PAST the
goal line**, a median 3 ft past it and 8 ft off centre — *behind the net* —
against **1.4%** for every other missed shot. Not the boards. A 68× positional
concentration, which is about as clean a signature as this feed produces.

> **A raw feed key paraphrased into fluent English is a claim, and it inherits
> none of the key's authority.** `field:` provenance covers the VALUE. The
> sentence I write around it is mine, and it needs its own evidence.

What can honestly be said and what cannot: the coordinates are evidence about
WHERE; **the feed does not define its own vocabulary**, so the scorer's intent is
not something a position can prove. Say where, do not invent why.

This is the same failure as the `display:`/`rule:` distinction the project
already enforces — I had quietly claimed authorship of the league's taxonomy once
before in the same week (calling `missed-shot` "our category"), and CHENG caught
that one. Twice in a week, same shape.

## ⭐ A NULL RESULT READ OFF A RUN THAT EXAMINED NOTHING

Nearly reported *"the six values are the whole vocabulary"* from
`index.json`'s `noted` — which was empty. It was empty because **the NIGHTLY had
overwritten it**: `ingest.yml` holds pointers only, judges almost nothing, and
its ledger correctly said `published 0, refused 0`.

Caught by looking at the numbers beside the answer rather than the answer alone.
The real vocabulary came from the derive run's own log — the run that actually
walked 4,553 games — and it held **four more values**, including the
`hit-crossbar` Kevin had predicted from its absence.

> **Before believing a null, check the denominator of the thing that produced
> it.** "Nothing was found" and "nothing was looked at" are the same output.

## THE VOCABULARY GATE PAID FOR ITSELF ON ITS FIRST RUN

`KNOWN_MISSES` was written as **strictly what had been observed**, with a test
that fails if anyone pads it — because a plausible-looking `hit-crossbar` added
by hand would have HIDDEN the real one from the report. That is exactly what
happened in the good direction: the gate surfaced four unseen values on the first
derive, unprompted.

**And a fixture expired.** The "unfamiliar value" test used `hit-crossbar` as its
stand-in; the archive promoted it to known, and the test began asserting that a
known value was unknown. **A fixture pinned to a value the world can promote has
an expiry date** — the replacement is invented and will stay invented.

**Also: the league's vocabulary changes under us.** `failed-bank-attempt` is zero
in 2023 across 881 missed shots, then 9 and 15 in the seasons after. Same shape
as `tv-timeout` becoming a primary reason in 2025-26. That is the whole argument
for `noted` existing rather than a static list.

---

# 2026-08-20/21 — B1, two refactors, and a caching audit

## ⭐ A test written to protect a term can pass with the term REMOVED

The boot's opening frame carried `|| PREVIEW`, on the reasoning that a blank rink
must never reach the front page. A mutation showed the term was **unobservable**:
`if(PREVIEW)` sets its own opening frame synchronously in BOTH branches, before
anything paints. **The test written to protect it passed with it gone.**

The fix was not a better test. **The code was deleted as dead**, and the claim
worth keeping — *the hero opens on hockey* — was re-pointed at the real hazard
and mutated until it fired. Same family as the check-with-no-instrument, seen
from the other side: here the guard was imaginary and the instrument agreed.

## ⭐ A PAIR OF TESTS WHERE NEITHER IS SAFE ALONE

B1's rotation and invariance tests. Invariance is satisfied by a flip that does
**nothing**; "it flipped" is satisfied by a flip that **also moved the
arithmetic**. Proven by mutating in opposite directions — `DIR`→identity reddens
one, applying the flip inside `upto()` reddens the other, and each time the OTHER
test stayed green. Neither alone means anything. **Write the pair, and show each
half failing at what the other half cannot see.**

## ⭐ ASSERT THE EXACT RELATIONSHIP, NOT "DIFFERENT"

`SX(x)=100-x`, so a 180° rotation must make the two screen positions **sum to
200** and the y pair to 85. A flip that moved a mark anywhere else passes
`assert.notEqual` and fails this. *"It changed"* is the weakest true thing a test
can say.

## ⭐ A REFACTOR'S SYMPTOM CAN POINT AT THE WRONG STAGE

Splitting the 3,678-line test file, a helper that lifted `const X = {...};`
closed on `\n}\n` — but a const-object closes on `};`. The lift silently
swallowed everything down to the next function, and the failure surfaced as
**"anchor not found"** two stages later. I went looking at the anchors.

Also: the first attempt computed line boundaries **before** removing a shared
fixture and applied them **after**, cutting inside test bodies. **Anchor on
unique strings, never on line numbers that another edit can move.**

## ⭐ MODULARITY IS A MEASUREMENT INSTRUMENT

The split found two helpers that were **pretending to be local**: `CURVE_AND_MIX`
reached from three files, and `paceOf` reached by the transport tests across a
file boundary. In one 3,678-line file that coupling is invisible. Across
boundaries it is a `ReferenceError`. **The boundary is the test.**

And the size was **producing** the defect the file complained about: its own
comments record *"four hand-written fakes of one document at four fidelities"*,
and the reason other suites grew their own fakes is that the good harness was not
importable.

## A GUARD CAUGHT MY OWN COPY, AND THE GUARD WON

A new note said the marks were *"no longer comparable"* and tripped the
changelog-voice check on `no longer`. **The guard is worth more than my
sentence** — reword, never weaken. *"after that they are shooting the other
way"* also says it in hockey terms instead of ours.

## A LABEL THAT CONTRADICTS ITSELF NEEDS A NEW LABEL, NOT A NOTE

"Keep every mark" is false when the trail clears each period. I nearly shipped a
note explaining it. **The label states the truth instead** — *Keep this period* —
which is the invariant-over-disclaimer rule applied to a button.

## CHECK A PERMANENT SENTENCE BEFORE SHIPPING IT

A time-boxed note that is wrong is wrong for 90 seconds; **an ungated one is
wrong on every frame of every game.** CC believed NHL 3-on-3 overtime keeps the
long change — which would have made *"the teams switch ends every period"* false
in every regular-season OT game. The data cleared it (25/25 and 19/19). **The
check passing is the point; the belief was wrong and I would not have known.**

## A FAKE DOCUMENT CANNOT SEE A LABEL ONLY THE MARKUP SETS

Half a mode-dependent assertion was untestable because one label came from
markup and the other from JS. **Set both from one place**, and the harness can
speak for both.

## ⭐ DESCRIBING TWO FILES FROM ONE FILE'S EVIDENCE (CHENG)

The caching doc said *"none of it is cacheable"* and sized the catalog's saving —
but only the **document** had been measured by navigation. The catalog carried an
ETag, so it might already have been costing a round trip rather than a body.
**A table that pools measured and inferred rows reads as all-measured.**

## ⭐ A CAPABILITY THAT EXISTS AND IS UNREACHABLE — MEASURE BOTH ENDS

Closing that gap: the origin **does** honour `If-None-Match` → 304, 0 bytes
(curl). The browser **never sends one** → every request a 200 with a full body
(browser). Neither measurement alone is the finding. The cause is that with no
`Cache-Control` the response is never stored, and **a response that was never
stored has nothing to revalidate.**

Which produced the answer: **`no-cache` is not `no-store`.** It stores and
revalidates before every use — never stale, saves the body, and needs **no TTL
chosen by us**. Reaching for a number would have been the chosen-constant defect
in a new place.


## 2026-08-21 — ⭐ A TEST CAN NAME A BEHAVIOUR AND NEVER REACH IT

Two guards in the same twelve lines had tests whose names described them
exactly, and **mutating either left the whole suite green.**

```
find(x => x.kind === 'sog')   ->  unreconciled[0]      588 pass, 0 fail
if (!sides.length) return;    ->  if (!sides.length){}  588 pass, 0 fail
```

The test aimed at the first passed a note of a *different* kind — which returns
at an **earlier** guard, so execution never arrived at either line under test. It
was green because of code it was not testing.

**What made this findable was mutating, and nothing else would have.** Coverage
would have shown the lines as executed: they run on every other test.

The fix in both cases was a fixture that **has to travel past the earlier
guard**: a list where the sog note sits *second* (so `[0]` picks the wrong one and
silently discloses nothing), and a sog note whose sides all agree (so the
sentence builds out of nothing and prints *"its boxscore reports , its event log
."*).

> **Ask what a test would do if the line it names were deleted — then delete it
> and look.** A test whose subject is guarded by an earlier `return` is testing
> the return.

## And a fixture that stood in for a case WITHOUT ITS DEFINING PROPERTY

`test_a_stub_that_parses_perfectly_is_still_refused` was the Olympic case: a feed
with nothing in it to replay. Its fixture was a **normal feed with a wrong
boxscore** — so it tested *"the boxscore disagrees"* while reading, for two
years, as *"there is nothing to replay"*. Those were the same verdict then, so
nothing showed. The moment they became different verdicts the fixture was on the
wrong side, and the test that would have caught the regression was the one
asserting the old behaviour.

Real stubs carry **goals and zero shot events**, 33 of 33 preseason and 30 of 30
gameType 9, a median of 12–15 plays. None of that was in the fixture.

> Same family as *a check that passes on the sample cannot see the case the
> sample does not contain* — but one level up: **the sample was named after a
> case it did not resemble.**

## And the duplication that made the blast radius look like a real failure

`regulation_plays()` had been **re-typed in three places**. Adding a field to the
feed broke three shootout tests for a reason with nothing to do with shootouts,
which is a long way to walk from symptom to cause. There is now one definition.


## 2026-08-21 (later) — ⭐ A TEST WHOSE NAME PROMISES MORE THAN IT CHECKS

I criticised `teams.js` for a docstring claiming *"fails loudly instead of
rendering a blank chip"* when the only check was a pinned fixture. **Hours
later I wrote the identical defect:** a test called *"the shipped block agrees
with the suite that is running right now"* which only asserted the number was
plausible. Set the doc back to the stale `567 / 130` and **the whole suite
stayed green.**

A test inside `node --test` has no access to the run's own total, so it
*cannot* do what the name said. Renamed to what it does — present, parses,
still delimited — and the real comparison lives in `npm run health --check`,
which runs both suites and exits 1.

> **The name is a claim. Mutate the thing the name promises, and if nothing
> reddens, the name is wrong — not merely the coverage.**

## And three of my own that would each have shipped quietly

**A gate that counted a DIFFERENT suite.** `health.mjs` ran `node --test test/`
where `npm test` runs `node --test test/*.test.js`: 609 against 608. *A gate
comparing a number to a different population's number is worse than no gate.*
The commands are now read from `package.json`, never retyped — the same fix
`measure.test.js` already uses for its import roots.

**A confident `NaN`.** `unittest` writes *"Ran N tests"* to **stderr**, and
reading only stdout produced `NaN Python tests` in the generated line, formatted
exactly like a real figure.

**A module that hung the suite by being imported.** `health.mjs` did its work at
top level and `suiteCounts()` shells out to `npm test` — so a test importing
`block()` ran the suite, which ran that test, which ran the suite. Two minutes
of silence and nothing on screen to say why. **A module that DOES something when
you import it cannot be tested by the thing it does.** Guarded with
`import.meta.url === pathToFileURL(process.argv[1]).href`.

## ⭐ AND THE TIMEZONE GUARD THAT ONLY WORKED WHERE I WAS SITTING

`'2023-11-10'` parses as UTC midnight, so `new Date(s).getDay()` answers for the
**ninth** anywhere in the Americas — a calendar rotated one column for most of
its readers. I wrote the guard, starred it, then checked what it did elsewhere:

```
mutated, TZ=UTC                 0 failures      <- CI runs UTC
mutated, TZ=Asia/Tokyo          0 failures
mutated, TZ=Europe/London       0 failures
mutated, TZ=America/Los_Angeles 2 failures      <- my machine
```

**The instrument was my own environment.** It looks identical to a real guard
locally and is inert everywhere else. The timezone is now IMPOSED via
`process.env.TZ`, and the test first proves the lever is connected — the same
date must give different answers in the two zones — so a runtime that ignored
the variable fails loudly instead of passing vacuously.

> Generalises the canon entry *impose the conditions of a measurement, do not
> request them*: **also ask which conditions you are silently inheriting.**

## 2026-08-21 (C1) — ⭐ THE DOMINANT SHAPE OF THE DAY: *a check that NAMES the cases it covers, and a new case nobody added to the list*

Three defects in one afternoon, same shape, three different layers. Each list was
written against the cases that existed and each was silently wrong the moment a
fourth arrived.

1. **A DISCLOSURE that rendered only when it was not the whole story.** The night
   list labelled an out-of-scope group only when the night held **more than one**
   group — correct for the "NHL" label, which names nothing on its own, and wrong
   for the other one, **because that label is a disclosure and not a
   convenience.** 24 September 2023 is twelve preseason games and nothing else,
   so it rendered twelve rows with no statement anywhere that none of them
   counts — and **60 of the 62 out-of-scope dates are that shape.** 623 tests
   green. Found by opening the page.
2. **A deploy gate exempting `index|game` BY FILENAME**, while the comment beside
   the list already stated the real reason: *their guarantee is a hash-pinned CSP
   the browser enforces, which is stronger than any grep.* That reason is a
   PROPERTY OF THE PAGE. The list was the defect, not the third page.
3. **A browser CSP probe that loaded `index.html`**, with the live checks naming
   `index` and `game`. A stale hash is **a blank page that passes every grep** —
   live, 200, byte-identical to the repo, and inert.

> **When a check enumerates its subjects, ask what makes each one belong. If that
> answer is a property, read the property. A list is a cache of a rule, and it
> goes stale silently.**

### ⭐ AND THE COROLLARY THAT IS ALREADY IN THIS FILE, FOUND AGAIN: reading the property is only HALF a fix
Exempting a page because its policy declares the reach lets **a page that
declares a reach it never uses exempt itself from the check meant to hold it.**
Two pages were already in that state (they inherited `connect-src <data origin>`
from a shared builder and fetch nothing). Mutating **every** page to "allowed"
did not turn the new gate red. The honest rule asserts **both directions**:
declaring and calling out must be the same set, and either alone fails.

### ⭐ A CANARY PAID ON ITS FIRST RUN, AGAINST THE PROBE I HAD JUST WRITTEN
Every run of the new CSP gate breaks one page on purpose and **requires the red
before trusting the green** — because that grep had spent months unable to match
anything (without `--enable-logging=stderr --log-level=0` Chrome routes no
console message to stderr, so *0 violations* was indistinguishable from *0
observations*). The very first canary reddened for the wrong reason: the walk
loaded **`file://$f` with a RELATIVE path**, so Chrome read the directory as a
HOSTNAME, fetched nothing, and reported eleven clean pages in a row. Green, fast,
measuring nothing. Same family as [[looking-at-pixels]]'s preview-never-booted.

### The fixture whose two orderings coincided — *a test that arrives where it already was*, again
`otherInMonth` sorts by count desc, then type asc. My fixture had 2 preseason and
1 Olympic, so **both orderings produce the same list** and deleting the count
from the sort left it green. Made the bigger group the higher type; the mutation
then reddened. **Check that a fixture can DISTINGUISH the rule from its
alternatives, not merely satisfy it.**

### `str.replace` cannot fail — it just does not happen
Extracting shared page helpers substituted them into the new page and not the old
one, so `index.html` went to disk with a literal `__HELPERS__` where its script
belongs. **And `--verify` could not catch it, because the byte comparison is
against a file built the same wrong way** — a reproducibility gate is blind to a
defect that reproduces. `build_index.py` now refuses to write any page still
carrying a `__NAME__` placeholder.

### A grammar rule that cannot be wrong for a value nobody has seen
*"4 Olympics games"* — see [[discovery-c1]]. The general lesson: **when a
sentence has to embed a value someone else controls, choose a construction that
needs no agreement with it** (a colon, an apposition) rather than one that
happens to work for today's values. Then assert it uniformly, **including where
the natural phrasing would read fine**, because a rule right by luck for some
inputs is the one that breaks on the next input.

## 2026-08-22/23 — ⭐ THE DOMINANT FAILURE MODE, COMMITTED BY ME, ONE DAY AFTER I DOCUMENTED THE FACT THAT REFUTES IT

**I broke production.** `unheldTypes` read the report's per-run `types`; the
nightly rehydrates pointers only, so in the offseason it walks nothing and the
guard accused all eight named gameTypes. Full account in
[[guard-where-the-archive-is]]. The part that belongs here:

> **The rule was written one function away and had been for months** —
> `_write_catalog`: *"a game this run said NOTHING about must not read as a game
> that is gone."* And **D8, which I wrote the same afternoon, states in my own
> words that derive does not see the whole archive.**

**Before writing a drift alarm, ask what its denominator is on the SMALLEST run
that will execute it.**

### ⭐ AND THE ALARMS WERE NEVER ALARMS — a whole class, found by one mutation
Setting `bad = False` in `derive.py` — which **disarms the gameType alarm, the
vocabulary alarm and the unheld-name alarm at once** — left all 150 Python tests
green. The test guarding it is named
`test_and_the_run_goes_RED_rather_than_only_recording_it`, and its own docstring
says *"a line in index.json nobody reads is not 'loudly'. The exit code is."*
**It asserts the ledger and the publication and never the exit code.**

It was **untestable, not merely untested**: the logic sat inside `main()` behind
`argparse` and a `FileStore`. Extracted as `verdict(out, say)`, with each alarm
now asserted **alone** so no one of them can carry the other two.

> **When a name promises an OUTCOME (red, refused, blocked), the test must
> assert the outcome, not the evidence for it. And if the outcome is unreachable
> from a test, that is the bug — extract it.**

### A control that REPORTS an effect it is not having
`Situations` in the base view: toggling "Even strength only" left the board and
the rink **identical — 59 SVG shapes before and after** — and printed *"49
attempts have dropped out so far."* **Worse than clutter**, on a site whose
product is legibility. Found by measuring both states, not by looking once.

### ⚠️ I WALKED INTO THE TRAP `tools/pixels.sh` DOCUMENTS, IN ITS OWN WORDS
My local harness measured a page whose extract 404'd, so `boot()` never ran and
every layer button was dead — and it reported tidy geometry for an **error
page**. That file's docstring describes exactly this, from three earlier runs.
**Any harness that renders this app must refuse to report unless `#rg` carries a
class**, and mine now does. See [[looking-at-pixels]].

### ⚠️ A BACKUP THAT WAS A FILE, NOT A DIRECTORY — I DELETED `builders/`
`cp -r builders /tmp/b.bak` silently failed because `/tmp/b.bak` was a
pre-existing FILE from a week earlier; the restore then replaced the directory
with it. `git checkout` recovered the committed state and I re-applied four
uncommitted builder edits from the conversation. **Back up individual FILES to
distinct paths, and never `rm -rf` a tracked directory in a loop.**

### A regex that matched more than it named
`/0s earlier/` also matches *"10s earlier"*, so a correct page failed a correct
assertion. `(?<!\d)` fixed it. **A test that fails on right code is as expensive
as one that passes on wrong code** — it spends the trust you need when a real
failure arrives.

## 2026-08-25 — A GATE KEYED TO A SENTENCE, AND THREE MORE BLIND CHECKS

⭐ **THE DEPLOY GATE DECIDED "DID THE PAGE BOOT" BY GREPPING `#gl` FOR THE WORD
`final`** — and the same commit stopped the game line printing the result. All
five probes reported never-booted and the deploy failed **on a site that was
working perfectly.** *A gate keyed to a SENTENCE fails when the sentence is
edited, which is not a property of the thing it watches.* Both detectors now
read `#rg`'s hidden state, which `reveal()` owns. ⭐ **AND NOTHING TIED THE TWO
FILES TOGETHER**: a test now reads the pattern out of the YAML and asserts the
page renders it — *and that the un-booted PLACEHOLDER does not*, because a marker
both states satisfy cannot tell boot from no-boot.

⭐ **A DEFINITION IS NOT A USE.** I asserted a `<clipPath>` EXISTED; the mutation
deleted the `clip-path=` attribute from the group and both definitions sat there
unused with the test green. **Assert the application, never the declaration.**

⭐ **THE CATALOG-FIELD GATE COULD NOT SEE A FIELD FROM A HELPER.** `EVERY FIELD
derive.py PUTS ON A CATALOG ROW HAS A READER` slices from the `row = {...}`
literal, so `**_hl(...)` never entered the field set — it would have reported a
clean sweep while carrying an unread field. **That is D10 committed inside the
guard written to stop D10.** Found by asking what its denominator was, *not* by
it going red: it could not go red.

⚠️ **A MONITOR MATCHED A STALE SUCCESS AND I REPORTED A GREEN DEPLOY THAT HAD
FAILED.** The dedup keyed on `"deploy: success"`, which had been true YESTERDAY.
⭐ **CHECK CI BY COMMIT SHA, never by workflow name** — `gh run list --json
headSha --jq 'select(.headSha|startswith("..."))'`.

⚠️ **AND MY OWN FIX QUOTED THE OLD BROKEN LINE IN ITS COMMENT**, so a raw scan
found `/final/.test(gl` in prose and failed a correct file. Fourth instance of
*a check that cannot tell code from the words about code.* **Strip BOTH comment
syntaxes** — YAML's `#` and the embedded script's `/* */`.



---

# 2026-08-25 (later) — A CORRECT INSTRUMENT MEASURING AN ABSENT SUBJECT

⭐ **THE NEW CATALOGUE ENTRY, and it is distinct from a vacuous assertion and
from a mirror.** `deploy.yml`'s *"the pages fit a phone"* step frames `game.html`
at **exactly 360px** — the width where the scoreboard overflowed by 25px — and
was **green while that shipped**. It fetched `catalog.json`, `measures.json` and
`index.json` and **never the extract**, the one file `game.html` needs to render
anything. So the page 404'd, D9 hid the app, `.board` measured **0px**,
`scrollWidth == clientWidth`, PASS.

⭐ **A CORRECT FIX DISARMED A DISTANT CHECK.** D9 was right to hide the app when
there is no game — and `#rg` is what the fit gate measures, so hiding it took the
gate's subject with it, **one workflow away from the change**. H3 with the
container's contents being *a check in another file*, which no enumeration of the
markup would ever surface.

⭐ **AND CHENG'S DISTINCTION IS THE REUSABLE PART:**

> A canary proves the **RULER** works. It says nothing about whether the
> **SUBJECT** is there. A 900px element overflowing a 360px frame proves the
> comparison functions. An empty `#rg` at height 0 also "fits". Both are true at
> once, and the gate cannot tell them apart.

The repair is two canaries: the existing one for the ruler, and `gamenosubj` —
a copy of the page whose extract path cannot resolve, **literally the state the
gate was in** — which must report a zero subject. Proven three ways before
shipping: the OLD page fails, the new page passes, the canary fires.

⚠️ **The step's own comment predicted it**: *"an empty page overflows nothing —
it would pass while proving nothing."* Written about the data files, while the
one file that mattered never made the list. `tools/pixels.sh` learned this lesson
and fetches a window of forty extracts; the gate did not.

## ⚠️ BACKTICKS IN AN UNQUOTED HEREDOC ARE COMMAND SUBSTITUTION

The probe heredocs are `<<HTML` not `<<'HTML'` so they can interpolate `$WIDTH`
— which means bash also runs anything in backticks. A JS comment quoting a word
that way printed `fits: command not found` four times. **And the SIBLING step had
the identical bug for weeks**, printing `rg.className: command not found` into
every PASSING log — exactly the noise that trains a reader to skim. Both fixed;
both heredocs then **extracted from the workflow and run in bash** to prove they
expand clean.

## ⚠️ A MUTATION SEEN NOT TO FIRE, AND THE RIGHT RESPONSE WAS TO DELETE THE CHECK

Removing the direction indicator, I guarded against over-reach with
`assert.match(app, /attackDirection/)` — "the shared derivation survived".
Gutting `shotDir` left it **green**: the identifier appears all over the inlined
library and in prose. **A string that survives its own subject's deletion is not
a check about the subject.** Measured instead: stubbing `attackDirection` to
return 1 reddens **six** tests across goaltending, danger and rink. It is well
guarded where it is USED — so the weak restatement was **deleted**, and the
measurement justifying its absence written where the assertion had been.

## ⚠️ A FIXTURE THAT DOES NOT CONTAIN THE CHANGE UNDER TEST PROVES NOTHING

To prove refcheck's new shallow-clone detection, I ran it in a real
`git clone --depth 1`. It reported exit 1 and no message — because **the clone
carried the COMMITTED refcheck**, which predates the detection. I nearly logged
that as evidence. Copying the working-tree version in gave exit 3 and the
message.

## ⭐ GREEN ON A LAPTOP, RED ON A RUNNER

refcheck's revision-pinned citations read history with `git show`.
`actions/checkout@v4` is **shallow by default**, so all twelve failed in CI with
*"no builders/build_main.py at revision 29f4c30"* — **nothing wrong with the
documents.** Two repairs, because there were two faults: `fetch-depth: 0`, and
**the tool now tells the two apart** — it detects the shallow clone, names the
fix, and exits **3** rather than 1, because *"the environment could not check
this"* and *"this claim is false"* must not share an exit code. Conflating them
is how a correct file gets edited to satisfy a broken instrument.

---

## 2026-08-26 — ⭐ A GUARD THAT COULD NOT HAVE WORKED, AND THE FAKE COULD NOT SAY SO

Building the collapse, the auto-open carried a *has the reader touched this*
flag, set by guarding the assignment:

```js
function openZone(d){d._auto=true;d.open=true;d._auto=false;}
d.addEventListener('toggle',()=>{if(!d._auto)d.rtgTouched=true;});
```

**The `toggle` event fires for a PROGRAMMATIC change too, and the spec queues it
as a task** — so `_auto` is already `false` by the time the handler runs. The
guard was inert. ⚠️ **And `npm test` could never have told me**: the fake
document does not fire `toggle` at all, so the flag simply stayed unset there and
every assertion passed for a reason that has nothing to do with the browser.

**A fake that omits an event cannot fail a test about that event's timing.** New
entry in the catalogue and a cousin of *a check with no instrument for the axis
in question*.

⭐ **THE FIX WAS TO DELETE THE FLAG, NOT TO REPAIR IT.** The only way to close the
drawer is to press its summary, and the only way to reach a layer row is with the
drawer open — so every call arriving with a layer on and the drawer SHUT came
from boot, which is the deep link and the one case it exists for. *A state
machine with one reachable path does not need a flag to tell it which path it is
on.*

## AND A FIX THAT NO TEST COULD SEE, FOUND BY MUTATION

CHENG's blocked-key finding (the key painted the HOST's colour for a mark whose
dot carries the SHOOTER's) was **fixed and shipped into a suite that could not
tell whether the fix was there** — deleting `.k-blkv` reddened nothing. The
mutation is what said so; the guard was written after. ⚠️ **A correctness fix with
no mutation run against it is a fix you are trusting, not one you have checked.**

⭐ CHENG also counted it: **blocked-shot attribution has now gone astray three
times on one event type** — the folklore flip that shipped a wrong Corsi count,
the figure that named the blocker instead of the shooter, and this key. *The key
and the mark were derived independently and one of them chose the wrong team*,
all three times.

## ENUMERATE WHAT IS INSIDE A CONTAINER **BEFORE** REMOVING IT

Kevin removed the Narration and Players controls. Both removals were safe only
because the consequence had been written down two rounds earlier:
- **narration off was the ONE state where the caption pill announced a goal.** It
  survives because `place()` returns nothing for a SHOOTOUT event — so the branch
  is still reached on the ~6% of games decided in one, and its test now boots the
  shootout fixture instead of pressing a control that no longer exists.
- **`figTabletop` is NOT dead code** — `goalie-eye-view.html` offers both figures
  and carries its own copy. Now asserted, so a later reader cannot take the
  removal as licence to delete it.

## ⚠️ 2026-08-27 — SIX INSTRUMENT FAILURES IN ONE SESSION, five of them mine

The largest single crop this project has produced, and they cluster into two
shapes. **Every one was found by mutation or by a number that made no sense —
none by reading the code.**

### THE MIRROR, in its purest form yet

A caption test asserted the rendered name matched the chip that was pressed. I
mutated the code to name the wrong thing. **The suite stayed green.**

The fake's chips were bare stubs with an **empty `textContent`**, so the test
compared the fake's empty label against the fake's empty output — and matched.
**Expectation and subject came from the same empty source.** The fake reads each
chip's real label out of the built page now, and only then did the mutation fire.

⭐ **It took three attempts to see**, because the first two times I assumed the
mutation had not applied. *A mutation that appears not to fire is either a bad
mutation or a dead test — verify which before moving on.*

### THE SLICE THAT LOST ITS SUBJECT

A CSS assertion read `PAGE_CSS.split('@media(max-width:520px)')[0]` to get "the
wide rules". That **drops every rule written after the query**, including the one
under test. Putting the bug back changed nothing.

⭐ **A slice that lost its subject passes everything.** The fix asserts the slice
still CONTAINS the rule before judging it — one line, and it converts a silent
pass into a loud failure.

### FOUR PROBES THAT MEASURED SOMETHING ELSE

* **`?g=` is not a parameter this page accepts** — it is `?game=`. Several probes
  silently measured the DEFAULT game. A *"40 games, none overflow"* sweep was
  **one game, forty times.**
* **`stints(events, {})`** destructures `{homeId, awayId}`, so with an empty
  context **no penalty could ever be released** — the first count said *0 of 332
  ended by a goal* against box.js's own documented 45. A number that contradicts
  the module's own docstring is the instrument, not the finding.
* **An injected `<style>` against production** was dropped by the CSP, so a
  measurement of Kevin's idea reported **"saves 0px"** — plausible, silent, and
  arguing against a change that in fact saved 159px. **A probe that MUTATES the
  page cannot run against production.**
* **A test anchored on its NEIGHBOUR**: `<div class="transport">…<p class="verdict"`
  broke when a caption was inserted between them. *A test that fails because a
  neighbour moved is reporting on the wrong subject.* Anchored on the
  transport's own last child now.

### AND ONE GUARD ADDED BECAUSE `str.replace` CANNOT FAIL

`build_main.py` now asserts no `__MARKER__` survives substitution, **where the
substitution is made**, and a test asserts it again on the artifact. Kept even
after the change that motivated it was reverted — it was the half worth keeping.

## 2026-08-27 (later) — A RULE THAT WAS ALREADY A CHECKLIST LINE, AND A FIGURE QUOTED FROM n=300

### ⭐ H3 EXISTED, IN WRITING, AND DID NOT FIRE

*When you hide or move a container, enumerate what was inside it* was **H3 of
`docs/status.md` §H**, written three days earlier. Parking `.pboxes` then hid
`#caption` — the pill that announces a penalty, an unplaced goal and a slot
shot, **a child of that row** — for a whole commit, while `dwell()` still held
the replay 2.2s to make room for it. The SAME park took the front door's split
bar, because the hero wears the `corsi` class a game-page rule keyed on.

CHENG's read was that the rule *"keeps getting stated correctly and applied
late, so it belongs in a checklist rather than in memory."* It was already in
the checklist. ⭐ **A rule that has been written down and then broken is not
under-stated; it is UN-INSTRUMENTED** — which is this file's whole thesis, and
the reason the answer was `test/park.test.js` and not a fourth checklist line.

**The instrument, worth reusing in shape:** read the shipped stylesheet, group
declarations by selector context, take the LAST display per context, call a
class dark when `#rg .cls` ends at `none` and nothing anywhere lights it. Then
walk the markup with a **TAG STACK** — ancestry is the whole question and no
regex can see it — and fail on any id the renderer writes into that sits inside
a dark container without being on a ledger. ⭐ **THE LEDGER IS THE ENUMERATION**:
a live element in a parked container is not automatically wrong (a whole zone is
parked on purpose), so the check is *every one is listed, with a reason*, and
adding a line IS the act that was missing. A second test fails when a listed id
returns to the light, so the ledger cannot rot.
⭐ **Proven against the real defect, not a synthetic one** — run at the parent
commit it names `caption`; at the fix it is silent. **The mutation was a git
revision**, which is the strongest form available.
⚠️ **And its limit is written on it:** it does not compare specificity across
differing contexts, so `.cbar` — parked on the game page, lit on the front door
by one `:not(.preview)` — reads as lit, and its six children are deliberately
NOT on the ledger. *A ledger line the instrument cannot support is worse than a
gap it names.*

### ⭐ KEVIN REFUSED A NUMBER FROM DOMAIN KNOWLEDGE AND WAS RIGHT

I reported **"8.7% of games use more than two goaltenders, 0.7% use four"** from
n=300. Kevin: *"I have a hard time believing this… once or twice a season you
see a third goalie enter the game, I have never seen a 4th."*

**The figure moved AWAY from his expectation — 8.7% → 12.2% ±1.4 over 2,096
games — and he was still right about the reporting.** Two separable errors:

⚠️ **A COUNT WEARING A RATE'S CLOTHES.** `0.7% use four goaltenders` was **two
games**. A single-digit numerator rendered as a percentage to one decimal place
is Doctrine §8's failure in better clothes. The honest form is the one his
objection took: *two in a thousand, and both are both-clubs-changed* — then it
is checkable, and checking it by NAME is what confirmed it.
**Rule: a figure from a sample states its n and its interval, or it is not
quoted; a percentage with a single-digit numerator is reported as the count.**

⚠️ **AND THE LABEL WAS WRONG, WHICH IS WHAT MADE THE NUMBER UNBELIEVABLE.** The
field counts *a second goaltender FACING A SHOT* — the starter was pulled, about
five times a club a season, routine. **The emergency backup goaltender is a
different and far rarer event and `goalieInNetId` cannot distinguish it at all.**
Against the EBUG reading my sentence invited, 8.7% is absurd. **The measurement
was defensible and its label was not** — and a label is what a reader checks
against the world.

⭐ **The disjoint control is the reusable bit.** Three strides over one ordered
catalog walked 8.7 → 12.0 → 13.3, which looked like structure. Same stride,
offset 2, **zero overlap**: 10.9% ±1.9 against 13.3% ±2.1. Stride aliasing
refuted, ordinary variance confirmed — and the control was run *because the walk
looked like structure*, which is the right trigger.

## 2026-08-27 (second half) — WHEN A QUESTION BEATS A DEFENCE

⭐ **KEVIN ASKED "WHY WOULD IT DO THAT?" AND THE ANSWER WAS THAT IT DOES NOT.**
I argued against opening a panel by default because *"a ledger reading 0 counted
+ 3 not counted at the opening faceoff"* would be a wall. He asked why it would
do that. It does not — the panel is EMPTY until the playhead reaches the first
event. **I had asserted a rendering without looking at it**, in a session whose
own commits keep saying to look.

⚠️ **AND LOOKING FOUND SOMETHING WORSE THAN THE THING I INVENTED**: the slot
ledger was a **3,176px wall**, 276 exclusions in 49 rows, 32 appearing exactly
once — the identical defect I had fixed in the `surprising` bucket two commits
earlier, sitting in `excluded`, unnoticed because **I had only ever looked at
eleven events.**

### ⭐ THE DEFECTS A SMALL SAMPLE CANNOT SHOW

Every one of these was invisible at the frame I happened to screenshot:
* the 49-row wall (needs the whole game)
* the deploy gate's clip that a local pass missed — **the gate renders the
  REFERENCE game and every local probe was on a FETCHED one.** Two games, two
  string lengths, and the gate was measuring the one I was not. The local
  harness now renders both.
* a club with **zero** of something vanishing from the footer, because `b.h &&`
  treats a numeric 0 as falsy. On a panel closing with *"nothing is dropped
  quietly."* **EMPTY is a real absence; ZERO is a measured none; truthiness
  cannot tell them apart.**

### ⭐ A TEST THAT FOLLOWS A CLAIM SURVIVES A REWRITE; ONE THAT PINS A MECHANISM DOES NOT

`build.test.js` asserts the page tells a reader who a blocked attempt belongs
to — **the claim, not the string** — and it went red the moment the work panel
stopped hard-coding that sentence. That is the check WORKING, and it earned the
`.lat` attribution span every layer now carries.

⚠️ The inverse, same day: a test pinned `summarise(L.excluded)` as the mechanism
for "the grouping is the layer's, not the page's". It went red on a change that
kept the claim, which is a smaller failure than the reverse but is the same
family. **Pin the outcome; name the mechanism in the message.**

### ⚠️ AND I WROTE A FALSE SENTENCE INTO A DELETION

Retiring a test, I wrote *"the pairing itself is not untested — `spotId` is
asserted in whistle.test.js."* It was not: `spotId` had NO reader anywhere once
that test went, so the deletion removed the field's only mention. Checking
turned a wrong sentence into a removal. ⭐ **A claim written while deleting is
still a claim, and the moment you are least likely to check one.**

⚠️ **AND THE DELETION HAD NO GUARD.** A mutation putting the removed clause back
on the ice passed all 753 tests, which is what a deletion with no assertion
always does. The guard is a PAIR — the box names the stoppage, the ice does not
name that same one — because either half alone passes on a broken page.

### ⚠️ TWO SLICES THAT LOST THEIR SUBJECT, IN ONE TEST

`/if\(id==='whistle'\)\{[\s\S]*?\n /` ended at the branch's own COMMENT, and the
content check then looked for `'STOPPAGE` where the built string has no quote.
**A slice now asserts that it contains what it claims to be reading.**

### ⚠️ A CHECK THAT COULD NOT TELL ITS SUBJECT FROM ITS BACKGROUND

*"The de-hyphenated key must not appear"* was a proxy for *a machine string
reached a reader*, and it holds only while the de-hyphenated key DIFFERS from
the copy we authored. It does not for `offside` ("an offside call") or
`hand-pass` ("a hand pass"), and it went red on correct copy. It now applies
only where it discriminates — which still includes the case it was written for.

### ⚠️ AND ONE ASSERTION COMPARED A VALUE TO ITSELF

`assert.equal(a.$('n_none'), undefined_or_empty(a))` where that function
returned `a.$('n_none')`. The fake mints an element for any id asked of it, so
the absence had to be asserted against the MARKUP. **A check written in a hurry
at the end of a good test is where this hides.**

### ⭐ TWO FAKE-DOM FIDELITY GAPS, BOTH IN THE PERMISSIVE DIRECTION

`textContent` was a plain field, so `el.textContent = 34` stored a NUMBER where
a browser stores `"34"`; and it did not decode entities, so `&mdash;` arrived as
seven literal characters the page then escaped into `&amp;mdash;`. **A harness
able to produce a string the DOM never would either invents defects or hides
them.** Both fakes now coerce and decode.

⭐⭐ **2026-08-30 — I FIXED ONE OF TWO SURFACES AND THE COMMIT MESSAGE CLAIMED
BOTH.** R2 throttling killed the derive on `aws s3 sync` (1 failed object of
18,216, then 2 — `sync` exits 1 on ANY single transfer). I hardened the PULL in
both workflows and wrote *"both surfaces"* — meaning both surfaces of the READ.
The next run cleared the pull, derived 4,192 games, measured them, then died on
**PutObject** with the identical error. ⭐ **THE REPAIR IS STRUCTURAL, NOT ANOTHER
ENTRY**: retry config moved from the STEP to the JOB, because *step env is an
enumeration and an enumeration is a list somebody has to remember to extend*; and
in `ingest.yml` the retry went INSIDE the `sync()` helper so all three ordered
passes inherit it. Two properties of that helper were **proven at a shell rather
than reasoned about** — it must still return non-zero when it gives up (`set -e`
stopping a failed pass is what makes "a pointer implies its bytes" a guarantee),
and its warning must go to **stderr** because `dry()` parses its stdout as
filenames.
⚠️ **AND A TIDY EXPLANATION WAS WRONG.** R2 says *"the same object"*, and content
addressing does create one — a shifts blob fetched **202 times** because 202
games share its hash. **None of the failures was that object.** I recorded the
hypothesis as refuted in the workflow comment rather than letting the neat story
stand.
⚠️ **I ALSO GUESSED A `sed`/replace TARGET INSTEAD OF READING IT** and the patch
did not apply — the same class as `str.replace` silently not happening.

⭐ **2026-08-30 — A WEAK MUTATION AND A TEST HOLE LOOK IDENTICAL.** Five mutations
fired nothing on the census; three were **real holes** and two were **weak
mutations** (`aw/(al||1)` is integral by luck on the fixture; the shootout turned
out to be guarded twice). ⚠️ **"Nothing fired" means two very different things and
must be resolved, not recorded as coverage.** The three real holes: a window
capped at 6 events; **coverage alone passing a broken control** (let the WINNER
define which end is fixed — every draw lands in `won`, `lost` empties, and the
population is still perfectly covered); and a shootout test that was
**structurally vacuous** because a shootout contains no faceoffs at all.

---

## 2026-08-31 — THE COMMONEST VALUES WERE IN THE GOOD HALF, so the defect hid

Kevin, on `?game=2025021245&at=2-09:26`, reading `TOR · High and wide`: **"what
was high and wide?"** The answer is *a shot*, and the label never said so — the
`VGK · Blocked it` defect again, a label whose grammar lost its subject. C8 gave
four of ten missed-shot values a subject and six of them nothing.

⭐ **WHY NO TEST AND NO WALKTHROUGH FOUND IT: `wide-left` and `wide-right` are
74.4% of missed shots and both read "Shot went wide".** Walking a game mostly
shows working copy. Measured: **22.8%, 5.9 a game, named nothing.**

⚠️ **AND TWO WERE AMBIGUOUS, NOT MERELY SUBJECTLESS.** `LAB.hit` is the word
`Hit` — a body check, same surface, same `CLUB · phrase` grammar — so
`TOR · Hit the post` invited exactly the wrong reading of 9.8% of missed shots.
**Both strings were individually correct English**, which is why only a claim
about the PAIR could catch it: the guard now parses `LAB.hit` out of the bundle
and forbids any miss phrase from opening with it.

⭐ **THE FIX SHAPE: ASSERT THE PROPERTY OVER THE WHOLE TABLE, never the ten
strings.** `/^Shot\b/` for every value turns a future entry added with the same
omission red. A per-value test cannot ask a question that spans the set.

## ⚠️ A MUTATION THAT DID NOT APPLY, REPORTED AS "13 PASS" — AGAIN

Building `transition.js` I ran seven mutations; one perl substitution silently
failed to match and I **nearly logged its green as a result about an unmutated
file**. This project already has the rule (*a mutation not seen to fire is not a
mutation*) and it still happened, because nothing enforced it.

⭐ **THE INSTRUMENT VERSION, and it is three lines**: copy the file outside the
repo, apply the edit, **`cmp -s` against the copy and print `DID NOT APPLY` if
they match**, then run, then restore. Every mutation run since prints one line
per mutation and cannot report a phantom. *Do not trust an edit you did not see
change bytes.*

## ⭐ A REACHABLE BOUNDARY IS A HOLE; AN UNREACHABLE ONE IS A WEAK MUTATION

`endToEnd` compares `Math.abs(x) <= BLUE_LINE_X`. My tests used 24 and 26 and
**never 25**, so loosening `<=` to `<` passed a green suite. The question that
settles which it is, is about the DATA: **29 of 15,543 located events sit at
exactly |x| = 25** — 0.19%. Reachable, so a hole. *Rare is not absent; ask the
archive before calling a surviving mutation weak.*

## ⛔ A FIELD WHOSE MEANING CHANGES WITH THE ROW CANNOT BE COMPARED ACROSS ROWS

The obvious K1 sentence was *"Toronto now"* — the acting team changes on 45.0% of
transitions. It is **unsafe**, and Kevin's own specimen is the proof. `own` is
the SHOOTER on a blocked shot, the OFFENDING team on a penalty, the WINNER on a
faceoff, the team LOSING it on a giveaway, and **the HITTER on a hit — who by
rule has no puck.** 41.0% of team-change transitions touch a hit.
⭐ **This is `one-measure.md`'s rule applied to a FIELD instead of a metric:
never two wearing one label.** Two of these meanings were already written down in
this repo, in two different files, and nobody had put them side by side.

## ⭐ THE SUITE STOPPED ME FROM OVERRIDING KEVIN'S OWN RULING, AND THAT IS THE POINT

K1's first build put its sentence on `.plabsub`; `render-labels.test.js` went red
because **Kevin retired event sublines on 2026-08-16** — *"it still looks crowded
to me."* I reverted rather than editing the guard. **A red test that encodes a
person's decision is not an obstacle; it is the decision still working.** Check
`git log -S` for the reason before touching a guard that surprises you.

---

## 2026-08-31 — four features, and the mutations found five real holes

⭐⭐ **CHECKING THE INGREDIENTS IS NOT CHECKING THE DISH.** The Learn More row's
tests verified the *map* the links are built from and never the rendered `href`.
A mutation dropping `#${c.id}` — so every link landed on the top of the learn
page instead of the card — **passed the whole suite.** Same file, second hole:
printing `c.id` instead of `c.title` also passed, and this repo has shipped a raw
`descKey` to a screen before. Assert the rendered artifact, not its inputs.

⭐⭐ **A GUARD CAN BE RIGHT FOR THE WRONG REASON, AND THAT HIDES THE GUARD THAT
MATTERS.** `penaltyKilled`'s window was `s.end > prev.s`, which is **empty
whenever two consecutive frames share a second** — exactly what a goal and its
restarting faceoff do. So goal-ended power plays were refused by *"no stint ended
here"* instead of by `endedBy === 'goal'`, and a mutation disabling the
`endedBy` check — the entire point of the rule — **survived 857 green tests.**
Closing the window at both ends moved the archive count 205 → 210.

⭐ **A TEST THAT ONLY ASSERTS AN ABSENCE IS SATISFIED BY SILENCE.** My "a power
play scored on is not a kill" test drove the page with `oninput` and asserted the
caption did *not* say "Penalty killed" — but **a drag never fires a caption at
all**, so it held on a page rendering nothing and could not have failed. Pair
every refusal with the same shape that succeeds.

⭐ **WHEN A FIXTURE CANNOT REACH A BRANCH, CONSTRUCT THE CONDITION.** `rich.json`
has **zero** power-play→even transitions across a period boundary (the archive
has 4 in 327) and **zero** icings with a second whistle before the faceoff, so
three guards were unexercised and mutations deleting them all survived. And
where the fixture *can* reach it, move the test to a fixture that does: none of
`rich`'s four kills lands on a slot shot, though **14.8% do** archive-wide, so
the caption-precedence test moved to `2025030214`, already in the repo.

⭐ **DISTINGUISH A WEAK MUTATION FROM A HOLE, IN THE SOURCE.** `aside: now.home`
→ `aside: 5` survives and **no test could kill it**: every power play in
`KNOWN_SITUATIONS` is five-on-four, so a kill always lands on five-on-five. It is
read from the code anyway, against a strength the league has not invented yet —
and that is written beside it so nobody hunts for the missing test.

⚠️ **AND A PROXY IN THE HARNESS STOPPED TRACKING THE THING IT STOOD FOR.**
"Did this frame speak" compared the caption's `innerHTML` to the previous
frame's. That held only while every caption carried a player name and was
therefore unique. The icing caption says **one of two sentences 7.8 times a
game**, the pill is never cleared, and two icings into the same end wrote the
identical string — so two real captions read as silence and tripped the pace
invariant. **The fake counts assignments now; the write is the event, the text
was a shadow of it.**

⭐ **AND MY OWN §H RULE BROKE AGAIN, CAUGHT ONLY BY A MUTATION.**
`assert.match(ruleFor('#rg .ppill'), /line-height:1/)` passed against a rule
mutated to `line-height:normal` — because the **comment inside that rule quotes
the declaration** while explaining why it is load-bearing. *A check that cannot
tell code from the words about the code is not a check about code.* `ruleFor`
strips comments now, in both files that have one.

---

## 2026-08-31/09-01 — five rule diagrams, and the assumption that broke five times

⭐⭐ **"EVERY X DOES Y" IS ALMOST ALWAYS "AN X THAT DOES Y MUST DO IT RIGHT."**
Each new figure broke an assumption the previous ones had left standing, and it
was the same shape every time. The **second** figure showed three page-level
tests only ever read `offside.html`. The **third** showed four tests assumed
every figure animates or lights a line — a MAP has nothing to move, and forcing
motion would be decoration. The **fourth** showed annotation was sized in rink
units. The **fifth** showed badges drawn on top of the very net the figure was
about. *The Nth instance of a thing is the audit of the tests written for the
first.* Each fix keeps a **count** so the scoped claim cannot go vacuous.

⚠️ **A MUTATION CAN SURVIVE FOR A FIXTURE REASON, AND THAT IS NOT THE TEST'S
FAULT.** Dropping `OFFSIDE.has(e)` from `captioned()` passed 902 tests because
the reference game's only offside shares a frame with a penalty expiry, so
another term kept the dwell long. The invariant was sound; **the fixture could
not express the case**. The answer is to assert the relationship structurally
(every map the caption chain branches on is a term in `captioned()`), not to
weaken the invariant — and to say out loud that the fixture cannot reach it.

⚠️ **A MUTATION EXPERIMENT THAT MUTATED A GENERATED FILE PROVED NOTHING.** I
edited `data/learn-figures.json` and then ran the build to see whether a guard
fired — but the build REGENERATES that file, so the mutation was erased before
anything read it. "The build accepted it" was an artifact of my own harness.
**Mutate the SOURCE of a generated artifact, or you are testing the generator's
ability to overwrite you.**

⚠️ **AND A WAIT LOOP REPORTED THE PREVIOUS COMMIT'S CI AS THIS ONE'S.** `until
the last two runs are complete` ran before GitHub had created the new runs, saw
the old completed ones, and exited green. **Wait on the sha you pushed, not on
"the most recent runs"** — a proxy that stopped tracking its referent, in my own
tooling this time.

⭐ **AN ASSUMPTION ABOUT PRESENTATION LIVING INSIDE A REDUCER IS A BUG WITH A
COMMENT.** `penaltyKilled` refused every goal-ended power play "because the goal
caption owns that frame anyway" — and that was the REASON one ending in five went
unsaid. A reducer reports what happened; which frame says it is the caller's.

⭐ **A GUARD MADE UNNECESSARY BY A FIX SHOULD BE REPLACED, NOT DELETED.** When
`SKIP` became derived from `NOT_A_PLAY` the two could no longer disagree, so the
comparison was replaced by an assertion on the DERIVATION — a literal creeping
back is the regression now.

⭐ **AND THE COUNTER-RULE: DO NOT COLLAPSE A TEST'S INDEPENDENT RESTATEMENT.**
The same set is hand-typed in eight test files. Those stay. A test that imports
the implementation's own model of its input is the dominant failure mode here;
duplication in a test is a feature.

⚠️ **`npm run health` CAUGHT ME WITH MY OWN RULE.** Adding 11 tests and not
regenerating the block turned gates AND deploy red on push. Regenerating is a
step AFTER writing tests, not orientation at the start of a session.

## ⭐⭐ 2026-09-04 — SIX EXTRACTIONS, AND EVERY COVERAGE ASSUMPTION WAS WRONG

**A WALK COVERS THE STATE IT WAS BOOTED INTO, AND NOTHING ELSE.** Three times a
golden-DOM fixture was found not to cover the cluster about to move: `#whyContent`
opens on a **click**, `#workBody` on a **choice**, and the marks loop's
period-scoping branch needs a **control moved off its default**. Each time the
fixture was green, comprehensive-looking, and blind to exactly the code in
question. **Check coverage BEFORE the move** — that habit caught all three.

⛔ **UNREACHABLE CODE IS INVISIBLE TO A PARSER, A PROBE, AND AN OUTPUT DIFF.** An
off-by-one left a statement sitting after a `return`, naming three variables its
module does not have. `node --check` passed (it parses). A behavioural smoke test
passed (it never runs). The rendered-DOM golden passed (the page was unaffected).
Only reading the generated file found it — surfaced because the NEXT splice
asserted its boundary and failed. **Assert boundaries you think you know.**

⚠️ **A TEST WAS A MIRROR TWICE IN A ROW ON SIX LINES.** Draft 1 asserted where a
shot line STARTS; draft 2 that two clubs get DIFFERENT nets. One sign flip
survived both — swapping satisfies "different". Draft 3 derives the expected net
from `attackDirection` in the rule's own module. ⭐ **Weak properties read exactly
like strong ones until something mutates**, and this happened the same day I
quoted the name-the-path rule at someone else.

⭐ **TWO INSTRUMENTS, PROVEN COMPLEMENTARY RATHER THAN ARGUED.** Delete a full
stop from a rendered sentence: every unit test stays green (they assert the claim,
not the punctuation) and the golden names it at `#iceNote frame 254`. **The golden
catches "the text changed"; the unit test catches "the text is wrong".**

⚠️ **A GENERATED FIGURE NOTHING VERIFIES IS A HAND-TYPED FIGURE WITH BETTER
MANNERS.** `tools/tiers.mjs --check` compared only the table ROWS, so the moment
the block gained a generated sentence, that sentence could drift silently. It
compares the whole block now, stamp masked.

⚠️ **AND A CHECK MATCHED A BARE NUMBER WITH NO CONTEXT** — the snapshot gate
demanded an archive-staleness banner on `architecture.md` because a tier's LINE
COUNT (3,957) equalled a retired archive population. ⭐ **A generated block cannot
QUOTE anything**, so generated blocks are excluded from prose checks now.

⚠️⚠️ **THE BUILDER WAS DELETING THE WORD "export" FROM PROSE AND SHIPPING IT.**
`body.replace("export ", "")` is a blanket replace; `rinkart.js` says "the obvious
alternative — export only drawing functions" in a comment, and the page shipped
that sentence with the word missing for as long as it existed. **The guard for it
existed and its sample missed the file** — `build.test.js` checked five modules
named by hand. *A rule derived from a sample is still a sample*, and the sample
was a typed list.

⚠️ **I TYPED LINE COUNTS INTO TWO COMMIT MESSAGES BEFORE MEASURING THEM.** The fix
is not care, it is **ORDER**: measure, then write the sentence around the number.

## ⛔⛔ 2026-09-05/07 — THE FAKE DOM CANNOT FAIL ON ABSENCE
`test/helpers/page.js`'s `getElementById` **invents** an element for any id it has
never heard of. So **any test whose subject is *this exists* or *this did not
throw* measures nothing there**, and a DELETION experiment reports success no
matter what was deleted. ⚠️ **I ran exactly that** — removed the whole `#zLayers`
block, got *"booted"*, and only then checked the fake; with `getElementById`
returning `null` for the removed ids it throws at boot. Then **23 tests drove a
deleted control for a day and not one threw**; they failed with *"the layer
appears"*. Written at the top of the harness now. **To ask whether something is
still needed, hand `boot` a document that returns null for what you removed.**

## ⭐⭐ THE GAP WAS THE INTERSECTION OF TWO CORRECT CHECKS
The strength control shipped wired behind `display:none` for ten days.
`layers.test.js` asserts the show-rule names exactly the layers whose reducers
read `evenOnly` — derived, correct, **blind to ancestry**. `park.test.js` walks
ancestry *"because ANCESTRY is the whole question"* — and **records only elements
with an `id`**, modelling *live* as *written to by id*; the buttons are
`<button class="lyr sbtn">`. **Neither was wrong; neither could see it.** That is
a different failure from a check being too weak, and "add a stronger check" was
the wrong instinct. ⭐ New rule in `park.test.js`: **no CSS rule may set a display
that a parked ancestor makes inert** — signalled by a *state-gated reveal* (a
`display:none` default plus a context switching it on), because the first draft
flagged nine of which one was real.

## ⭐⭐ ENUMERATING IS NOT READING WHAT YOU ENUMERATED
Twice the instrument fired and a person accepted it. **`#nSit` was on park's
ledger** with the sentence *"the even-strength note"* — nobody asked whether the
CONTROL that note describes had gone dark too. **`.lds` was recorded in the same
file as serving `.zref`** — and I blanket-stripped the class anyway, taking two
`.areas` cards with it. ⚠️ **Both my over-deletions this week were blanket
regexes over markup I had already been told was shared.**

## ⭐ AND A DELIBERATE PARK LOOKS EXACTLY LIKE AN ACCIDENTAL BURIAL
The slot tip and the strength control were both invisible; only one by accident.
The tip has a THIRD rule — `#rg.slot .hint{display:none}` in the 2026-08-27 park
block, later and equally specific — so it is parked ON PURPOSE (Kevin's *"hide,
not remove"*). **I restored it, wrote a confident comment that its gate had never
fired, and the browser said otherwise.** Only looking separates the two.


---

# ⛔⛔ 2026-09-07 — A PENALTY VARIETY LEARNED IN ONE PLACE AND NOT THE OTHER

**Kevin found it on the live site**, not in a review: *"CAR was on the power play,
and they scored. That event should remove the VGK penalty, but it doesn't."*
`?game=2025030414&at=1-07:12.1`.

`src/lib/box.js` had `const ENDS_ON_GOAL = 'MIN';` compared with `===`. The
penalty was a **bench minor** (`sev: 'BEN'`, too many men, no named player), so it
could never match — and Rule 16.2 terminates a bench minor on a power-play goal
exactly as it does a player's.

⭐⭐ **THE COMMENT TWENTY LINES ABOVE THE BROKEN RULE ALREADY ARGUED THE RIGHT
PRINCIPLE.** Its words: *"THE CONDITION IS THE SEVERITY, NOT THE MISSING NAME"* —
written when bench minors were let INTO the box, on exactly this reasoning. The
release rule, in the same function, was never re-read. **A fix that teaches one
site about a variety and leaves its sibling is a bug with a correct explanation
sitting above it.**

## ⭐ AND MEASURING IT FOUND A SECOND ON THE SAME FIVE LINES

I fetched **150 published games from the live archive** rather than trusting the
fixtures — 1,117 stints:

- **37 bench minors, 4 live at a power-play goal.** All wrong.
- **20 four-minute penalties, every one a `high-sticking-double-minor`, 5 scored
  on.** Rule 16.3: a double minor loses its FIRST minor only. We released the
  player outright — full strength on the page while the real team was still a
  skater down. **About one game in thirty.**

⭐ **`endedBy` stays `'time'` for the halved case, and that is the model.** The
goal SHORTENS the stint; it does not END it, because the kill is still on.
`strength.js` reads `endedBy` to say why a power play finished. *Do not widen a
vocabulary to record something no consumer asked about.*

## ⚠️ WHY NOTHING CAUGHT EITHER — AND THE INSTRUMENT THAT WOULD

**No fixture contains the case.** Eight fixture games hold 2 bench minors, 0 live
at a power-play goal; 3 four-minute penalties, 0 scored on. ⭐ **A suite whose
coverage is a handful of real games is blind to any rule the games happen not to
exercise, and nothing announces which rules those are.**

✅ **`situationCode` IS AN INDEPENDENT WITNESS TO OUR BOX** — the league telling us
how many skaters were on. Built as `tools/box-witness.mjs` (a measurement script,
not a gate; it needs the network).

⚠️⚠️ **THE OLD "94.1% OVER 46,726 EVENTS" IS WITHDRAWN.** The population reproduces
exactly and the rate does not, and the script was never kept — a figure whose
derivation nobody can walk, which is the defect one level up from the one it was
describing. That is why the tool is in the repo now.

⭐⭐ **AND THE AGGREGATE WAS THE WRONG QUESTION ENTIRELY.** The same two data
sources, over one systematic sample of 150 games:

| | before the box fix | after |
|---|---|---|
| aggregate — the advantage matches, 45,478 events | 96.8% | 96.9% |
| ⛔ transition — league says the advantage ended, box holds him | **7 of 176** | **3** |

**The bug moved the aggregate by 10 events — 0.02% — against a 3% baseline.** The
transition caught it and showed the fix closing four. ⭐ *A witness is only as
sharp as the question put to it, and the broad version reads as coverage while
measuring nothing anybody can act on.*

⭐ **The 3 that remain are one cause, not three**: each is a goal at the exact
second a penalty expires, where the league still reads short and our half-open
interval has already opened the door. A one-second boundary convention, not a
rules disagreement. `docs/status.md` §0.00-η.

# ⭐⭐ AND THREE MORE INSTRUMENT SHAPES, ALL 2026-09-07

**A scanner blind to the channel the data actually uses reports a clean corpus
forever.** `tools/jslex.mjs` dropped template text; **all 19** feet-phrases in
`src/lib` are template literals, so a prose scan would have matched **zero** and
been green. Caught before writing the check, by asking which token type the
corpus actually uses. `walk` emits `tstr` now, with its own control.

**A check can forbid the fix to the problem it describes.**
`layer-copy.test.js` asserted `app.includes(l.counts)` — an EVALUATED string
against the bundle's SOURCE text — so it enforced *a layer description may never
be computed*, and went red on the interpolation that fixed the drift its own
header is about. Removed; the claim it reached for is asserted on the RENDERED
caption, which is strictly stronger.

⚠️ **And a test coupled to a LITERAL is not a test about a relationship.** Two
tests pinned the greeting saying *"Play from start"* while its own comment claimed
it quoted the button *"verbatim"* — nothing tied the two. Now the greeting reads
`PLAY_REST`, and the tests assert it contains whatever the MARKUP's button says.
⛔ **My first attempt read `$('play').textContent` and that is the wrong seam:**
the fake document invents an element for any id and gives it an empty
`textContent`, so the guard passed and the greeting rendered `Press <b></b>` under
test while a browser was fine. **The fake-DOM absence trap in a new costume.**

# ⛔⛔⛔ 2026-09-16 — SIX AUTHORS WROTE THE RULE DOWN AND NONE OF THEM COULD MAKE IT FAIL

`test/helpers/page.js` documents its own worst property: **`getElementById`
INVENTS an element for any id it has never heard of**, so a page that queries
something which does not exist gets a working stub instead of `null`. Every
consequence follows: a click on a deleted control is a silent no-op, and a
deletion experiment reports success no matter what was deleted.

**Six test files carry prose about this defect** — `lbox`, `render-labels`,
`deeplink-render`, `render-board`, `smoke`, `homepage`. `smoke.test.js` says it
plainest: *"the fake invents an element for any id, so the clicks silently did
nothing rather than failing."* `deeplink-render.test.js` warns that *"a fake that
keeps modelling a deleted control is how 23 tests drove a ghost for a day in
August"* — **directly above a fake that models a deleted control.**

**Standing mechanical checks enforcing any of it: ZERO.**

> ⭐⭐⭐ **PROSE IS NOT AN INSTRUMENT, and six independent rediscoveries is a
> MEASUREMENT rather than an anecdote.** Each author hit the hazard, understood
> it, wrote it down, and fixed their own call site. *A defect fixed in one call
> site is not fixed; it is a search nobody ran.*

**It cost, on the day it was found:** `render-ends.test.js`'s ends-invariance test
clicked five layer controls deleted by `70f41db` and announced *"every layer is
switched on"* while running with none; three of its ten observables were parked
panels comparing `"" === ""`; and a fourth, `nSit`, is an id no page has.

## ⭐⭐ And the rule that explains why no amount of review would have caught it

> **COVERAGE IS VISIBLE TO READING. COUPLING IS ONLY VISIBLE TO DELETION.**

The September audit asked *does this assertion test what its name claims* and
found eight instruments that covered less than their name implied. It never asked
*what does this assertion depend on that is not its subject* — and that is the
one that bit. `render-strength-pill.test.js` asserting *"the team chip is the
penalty box's, not a second implementation"* reads as a **good** test: a DRY
check, well argued, honestly named. Nothing about reading it says it breaks when
penalties move off the ice. **The first question is a review; the second is a
mutation.** See [[test-tier-architecture]].

## ⚠️ Two smaller ones from the same day, both about instruments lying

- **`refcheck.py` said "no such file in the repo"** about `tools/dom-golden.mjs`
  — a file that exists, at a line saying exactly what was claimed. `SOURCE_GLOBS`
  had `builders/*.mjs` and `tools/*.sh` and `tools/*.py` but **not
  `tools/*.mjs`**. ⭐ **A glob that stops matching reports the WRONG answer rather
  than no answer** — and this one tells an author their correct citation is
  broken, so the cheapest way to green the gate is to **delete a true citation**.
  An instrument that pays you to remove evidence.
- **My own audit instrument was wrong first**, twice: it matched `get(` (flagging
  Map lookups and URL parameters) and compared against one built page when tests
  target fourteen. **A check about the suite has to be as careful as a check about
  the app.**

## ⛔⛔ 2026-09-16 — FIVE DEFECTS IN MY OWN MUTATION-EXPERIMENT INSTRUMENTS (all caught before reporting)

1. **A DOM fingerprint of `body.outerHTML` includes inline `<script>`** — so EVERY code mutant "changed the
   DOM" (74 of 74 states, identical signature across unrelated mutants). ⭐ *An identical count across
   unrelated subjects is the signature of an instrument measuring itself.* Strip scripts.
2. **The invariant checker imported `conservation()` from the MUTATED clone** — a mutant inside the
   checker disarmed its own detector. Checkers must come from the untouched tree.
3. **The numbers probe fingerprinted `measureAll()` but not `main()`** — the step that computes the
   PUBLISHED census/team figures. Three "nothing observable" mutants were wrong published numbers.
   ⭐ *Probe the artifact that ships, not the function before it.*
4. **WebGL (`terrain-3d`) screenshots flake under CPU load** though deterministic when idle — a
   determinism baseline taken idle does not certify a detector used under load.
5. **Deleting a test file tripped `doc-paths.test.js`** (docs NAME the file) — 20 "still caught" were
   the deletion, not a second catch.
Plus: a positive CONTROL made invisible by CSS `text-transform` ("Period"→"PERIOD"); JS UTF-16 offsets vs
Python code points (7 astral chars in app.js); and ⛔ **my SEALED code-reading calls misread which token
changed** twice — the same-model check was worse than the human/CHENG cross-check. See [[defect-corpus-evidence]].


## ⛔⛔ 2026-09-17 — WHAT BUILDING THE TEST PROGRAM TAUGHT, ALL FROM MY OWN WORK

- **T1 (unknown id throws) found THREE ghost tests on day one** — "every layer is switched on" clicked
  rows deleted weeks earlier, so it compared "" with "". A permissive fake is not a detail.
- **A non-vacuity guard in every rewritten test** (`the box never showed a figure — this compared
  nothing`) fired TWICE on my own rewrites. Write it first.
- **A plant must be per-page.** A leak planted on `globalThis` was shared by both fake pages in one
  process and proved nothing until moved inside the page script.
- **A ratchet needs a sentinel read that is known to exist** — and the sentinel goes stale when its
  subject is deleted (cA → slotSay). Fail on FALL too, so slack cannot be spent later.
- **Counting catchers: decide whether a change detector (DOM golden) counts BEFORE counting**; I told
  Kevin "1 alone" counting the golden, the right answer was 3.
- **`npm run gates >/dev/null && git commit -q` failed SILENTLY twice** (stale health count; then
  unknown). I called a test "flaky" from ONE unsaved failure; 18 runs never reproduced it. Log gates
  output every time; stale generated blocks (health.mjs, tiers.mjs) are the usual cause.
- **"Reads the scoreboard as an independent path"** was a second SPELLING of the same field
  (`periodLabel(e)` formats `e.per`) — check an independence claim before honouring it.
- **An expired reason can hide inside a product rule**: removing hidden counters exposed THREE hero
  rules justified by "the counter" (two dropped, one kept on new grounds by Kevin).

## 2026-09-17 (late) — four more, all from moving checks or deleting code

⭐⭐ **AN EXEMPTION LEDGER MUST NOT FEED THE WALK IT EXCUSES.** The orphan-page test collected links from every
page including the UNLISTED ones, so an unreachable page kept its children reachable: one written exemption
silently excused two more pages for weeks. Reachability is transitive FROM THE FRONT DOOR or it is not
reachability.
⭐ **A COMMENT ASSERTING CODE IS ALIVE IS NOT A CHECK.** `marks.js`: "figTabletop is NOT dead code" — nothing
could call it; the selector is a CONSTANT.
⭐⭐ **WHEN THE TOOL CANNOT ANSWER THE QUESTION, CHANGE THE TOOL.** I said a general unreachable-code rule was
beyond a lexer; Kevin: *"this sounds like we don't currently use the right tool, so we can't solve the real
problem."* Static analysis would have MISSED it anyway (`FIG[figStyle]` is a computed key). The instrument that
answers it is RUNTIME COVERAGE over a walk of the real pages.
⛔ **`spawnSync` FOR A BROWSER BLOCKS NODE'S EVENT LOOP**, so an in-process server never answers and every probe
reports "the probe did not run" — a defect bash could not have, one process per server.
⛔ **CUTTING CODE BY "UP TO THE NEXT `def`" TOOK THE CONSTANTS BETWEEN THEM.** Three builds failed on
NameError before I cut at the DEDENT instead. Read the diff of a mechanical deletion, every time.

## 2026-09-17/18 — row 8: measuring an instrument instead of trusting its name

⭐⭐⭐ **A STATE NAMED BY A POSITION IS NOT A STATE — NAME THE SUBJECT AND FAIL IF YOU DID NOT ENTER IT.**
My browser states sampled "0.55 of the scrub". On the reference game that is frame 147, a FACEOFF, and a
figure is drawn only for the CURRENT ATTEMPT — so six states written to exercise the figure code all looked
at a circle and reported clean, reproducible hashes. 135 of 269 frames draw a figure; it entered none. The
rewrite seeks its subject and goes red when it never finds one: **entering is the first claim.**
⭐⭐ **PROVE THE INSTRUMENT BEFORE BELIEVING ITS SILENCE.** "0 of 10 escapes caught" means nothing until the
walk is shown deterministic (3/3 byte-identical) AND sensitive (3 planted changes move 93, 945 and 938 of
1,884 frame-states). Only then is a silence a finding about the SUBJECT.
⛔⛔ **A MUTATION THAT CANNOT LAND IS NOT EVIDENCE — AND THE PAGE'S OWN POLICY CAN BE WHY.** A canary planted
as `style="pointer-events:none"` edited the source, passed the build, shipped into the page and did NOTHING:
`style-src` is hash-pinned with no 'unsafe-inline', so **inline style attributes are inert on every page of
this site.** Re-planted as the SVG presentation attribute, it fired. Same family as §"lands where the check
is looking", with a new cause: the sandbox silently discards the change.
⭐⭐ **A READING IS ABOUT THE SURFACE YOU THINK IT RENDERS ON.** Two readers marked a change to
`Math.sin(t*1.7…)` "real, a reader could see it". `T` is `let T=0`, never assigned again — no animation loop
exists — and the renderer is an SVG pen that IGNORES shadowBlur by documented design. Both "escapes" were
equivalent. **Ask what actually executes before adjudicating what a reader would see.**
⭐⭐ **A PROBE THAT WALKS ONE SPECIMEN IS EVIDENCE ABOUT ONE SPECIMEN.** A threshold defect in `teams.js`
moves exactly 1 of 33 clubs (PHI, contrast 3.55). No state, layer or gesture on the reference game could ever
show it. When a check is blind, ask whether it needs a new STATE or a new SPECIMEN — they are different
budgets and I reached for the wrong one first.
⚠️ **"CAN A PERSON PRESS THIS" IS A FRACTION, NOT A BOOLEAN.** A mark drawn as a figure is 33% hittable
(44 marks, 32–35%, same at laptop and landscape-phone width); its bbox CENTRE is a gap, and pressing there
reports a broken door on a page whose door is fine. Sweep, press a point that really is the target, and carry
the fraction — the `force:true` trap has a sibling, which is aiming at geometry that is not there.
⭐ **AN UNUSED-EXPORT SWEEP HAS THE SAME HOLE AS A CALL GRAPH.** It found two dead exports and would have
deleted a live one: `disputedCount` is inlined into two pages by the PYTHON BUILDER as a string. Cousin of
`FIG[figStyle]`, and the reason the code-level rule has to be runtime coverage.

## 2026-09-18 — the stoppage attribution, and a warning nobody had wired to a check

⭐⭐⭐ **A PROXY THAT DISAGREES WITH A RULE IS EVIDENCE ABOUT THE PROXY FIRST.** Checking "who
iced the puck" against the rulebook's own prediction (a short-handed team may ice legally,
so the offender should almost never be short-handed) came out at **4.91%** — five times what
the rule allows — and I was one step from concluding my mapping was backwards. The proxy was
the fault: I read "short-handed" off the skater counts in `sit`, which is **the pulled-goalie
trap this repo had already documented** (5.62% of icings have a goalie pulled). Against the
real penalty box it fell to 0.43%. **The repo had the warning written down and I reached for
the proxy anyway** — [[verify-inherited-claims]] again, from the other side.
⭐⭐ **AND CHECK A MAPPING IN BOTH DIRECTIONS WHERE THE RULES LET YOU.** Icing's offender is
short-handed 0.43% against 1.30%; offside, which has no exemption, flips to 1.93% against
9.71%. Reversed, both contradict the rulebook. One prediction could be luck.
⭐⭐ **TEST A FALLBACK AGAINST THE CASES YOU CAN ALREADY ANSWER.** For the 5.60% of offsides
no dot can attribute, "the last located play says which end the rush was going" sounded
obviously right — run against the 3,816 we CAN name it agreed **54.38%** of the time, and got
WORSE the deeper the play was. It would have shipped and been wrong half the time on a
teaching page. Same shape as [[refusal-gap-32-games]]: fitted to the failures, never tested
against the successes.
⭐⭐ **A MARK ASSERTS A PLACE — Kevin, sending back a build I was pleased with.** I had made
an icing restart "one frame about the whistle", so the ice label read `CAR · Iced the puck`
with a leader line to the face-off dot. An icing **has no coordinate at all**; the dot is the
RESTART. His stated reason was the duplication; the real one is stronger and is doctrine.
⛔ **THE MARK, THE LABEL AND THE LINE UNDER THE RINK ARE ONE SURFACE.** Moving the label's
club without the line's put two clubs on one frame — the draw is won by the offending club
only 45.1% / 50.0% of the time — and `active-player.test.js` caught it.
⛔⛔ **A WARNING WITH NO CHECK BEHIND IT IS A THING YOU REMEMBER OR YOU DO NOT.** Every CI run
had been printing *"Node.js 20 is deprecated"* for weeks; it scrolls past the top of a log
nobody reads when the job is green. Kevin caught it in a run summary. The fix was five
minutes; **the defect was that nothing was asserting it**, so `test/workflows.test.js` now
holds the action pins as a ledger with reasons. ⭐ And pin to the FIRST major that fixes the
problem, not the newest — v5/v5/v6 here, where v7s were three ahead and every major between
is unrelated breaking change (`setup-node@v5` already carries one).


## ⭐⭐⭐ 2026-09-18 — THREE CHECKS EXPOSED BY AN UNRELATED CHANGE, AND A HELPER WHOSE NAME LIED

Adding goal ticks to the scrubber turned four things red that had nothing to do
with goal ticks. **Every one was a check asserting less than its name claimed**,
and none of them had a test of its own to catch it — *an unrelated edit is the
only reason they were ever found.*

- **`why-popup` read the FIRST `classList.contains('…')` ANYWHERE in the bundle**
  and called it "the class the backdrop listener closes on". True only while the
  backdrop happened to own the first one. A new delegated listener earlier in the
  file made the assertion about `gtick`, and it failed with a message about the ✕
  button. ⭐ **Anchor a claim about ONE listener to that listener** —
  `/\$\('whyBk'\)\.addEventListener\([\s\S]{0,400}?classList\.contains\('([a-z]+)'\)/`.
- **`render-transport` anchored on the scrubber being the transport's LAST
  element** (`<input class="scrub"…>\s*</div>`). It had already been fixed once
  for anchoring on a NEIGHBOUR, and its own comment says so. Wrapping the input
  broke it again, throwing on `[0]` of a null. ⭐ *Anchor on the thing that OPENS
  around your subject, not on what happens to close after it.*
- **⛔⛔ `frameOf(a)` IS NOT THE CURRENT FRAME.** It walks the scrub from zero
  looking for the first frame whose clip box carries an id — the first GOAL CLIP —
  so it answered `73` for every press, including presses that had moved the page
  correctly. **It also MUTATES the page it is asked about.** Two tests I had just
  written passed against it while proving nothing; the observable that matters is
  what `set()` writes, `#scrub.value`. ⭐ **A name is not a specification** — read
  a helper before trusting what it sounds like ([[verify-inherited-claims]]).
- **TWO OF THE REPO'S THREE FAKE DOMs COULD NOT EXPRESS `createElement`.** The page
  builds the ticks as nodes (a `style` ATTRIBUTE is inert here — hash-pinned
  `style-src` — so positions go through CSSOM). `deeplink-render` failed 22 tests
  at once, and `shell` reported ***"a permalink cost a catalog round trip"*** — a
  message about the wrong subject entirely, because that fake watches the NETWORK
  and a boot failure looks like a fetch decision. ⭐ *A fake that cannot express
  what the page does makes every assertion made through it vacuous* — and when it
  fails, it fails with a lie about causation.

## ⛔⛔ AND TWICE IN ONE DAY MY OWN COMMENT BROKE MY OWN CHECK

The fifth and sixth instances of the same trap in this repo, both self-inflicted
while *explaining* a change:

- an explanatory comment in `app.css` **quoted a disclosure tag literally**;
  `app.css` is inlined into the page, so the zone-counting tests counted my prose
  as markup and two tests went red.
- a new check scanned all of `app.js` for the copy phrase it was retiring — and
  matched the **comment that quotes the phrase to explain why it went**.

⭐ **Scan the STRING, not the file.** Pull the copy out first
(`/\bzonestart:'((?:[^'\\]|\\.)*)'/`) the way `layer-copy.test.js` does. *A
check that cannot tell code from the words about the code is not a check about
code* — and the words about the code are exactly what a careful author adds.


## ⛔⛔ 2026-09-20 — A RULE COPIED ONE NOTCH STRONGER THAN ITS SOURCE, THEN ENFORCED

`competitions.js::isLeague` says preseason, the all-star games, the Olympics and
the 4 Nations are *"archived, derived and VIEWABLE, and never enter a computed
number"* — a rule about **rates**. A fixture comment in `homepage.test.js`
rewrote it as *"Out of scope: preseason, and the Olympics. **Neither may reach a
surface**"* — a rule about **visibility**, which the function it cites never
made. `build_index.py` then applied the stronger reading to *"the last night we
hold"*, which is not a computed number, and the live front door told visitors the
archive stopped in June while `/game` opened last night's game.

⭐⭐ **A COMMENT RESTATING A RULE IS A SECOND COPY, AND IT DRIFTS THE WAY ANY
SECOND COPY DOES — by getting STRONGER.** Nobody weakens a rule when paraphrasing
it; they tighten it, and the tightened version is what the next reader enforces.
Kevin found it by asking the right question of his own repo: *"this isn't true
(and I don't remember why we said this)."*
⭐ **The test for it:** does this comment say more than the function it names? If
so, cite the function and stop. [[verify-inherited-claims]].

## ⛔ AND A HELPER THAT DOCUMENTED ITS OWN GAP WAS DEPENDED ON ANYWAY

`recentGameIds` opens with *"a WINDOW, never a prediction of the page's pick."*
`sitecopy` used it as exactly that prediction — the extracts it copies are what
let the sandboxed game page boot at all. The disclaimer was accurate, prominent,
and load-bearing in the wrong direction for three years.

⭐ **A DOCSTRING THAT NAMES A LIMIT IS NOT A GUARD AGAINST IT.** Where a caller
needs the thing the limit excludes, write the function that provides it — here,
`defaultGameId`, which **runs the page's own `pick()`** extracted from the built
page rather than restating the rule. ⭐⭐ And the new check **runs both rules and
compares answers** rather than grepping for the filter: a regex asserting
"neither mentions `inScope`" passes on two rules that disagree for some other
reason.

⭐⭐ **THE GATE THAT REFUSED TO MEASURE IS THE ONLY REASON ANY OF THIS WAS FOUND.**
`phone-fit` failed with *"game.html laid out with NO SUBJECT — this gate measured
a page with nothing on it, which is how a 25px overflow shipped."* An instrument
that shrugged at an empty page would have reported "it fits" on a page a visitor
could not use. **Build the refusal into the check, not into the reader.**


## ⛔⛔ A SECOND TEST FOUND DEMANDING THE WRONG ANSWER — 2026-09-21

`homepage.test.js` asserted **"three in-scope games, preseason excluded"** and that a
preseason opponent **"must not appear"** on a club page. That is the defect Kevin
reported from the live site, written down as a requirement and **green every day it was
wrong**. [[stale-fixtures]] records the first of these. Inverted, not patched.

⭐⭐ **THE SHAPE TO WATCH: a test that states the behaviour as a REASON for something
else.** The same file gave *"`#teams-h`, its note and the empty `.teams` div all stay on
screen when a team is chosen"* as the GROUND for revealing "Or browse by date" from
script. **The empty box was known, used as an argument, and never questioned** — a defect
can hide for months as a premise nobody reads as a claim.

## ⚠️ FIXTURES AND SPECIMENS GO STALE WHEN A RULE WIDENS

Three in one day, all the same shape — **a test whose EXAMPLE is a real value is hostage
to the rule it is testing**:

- `LIVE` used as the example of "a state we cannot read" — which was the defect;
- `rink-repair` used as the example of a forgiven stoppage reason, so vetting the real
  value broke it (the sibling had it right with `"zamboni-on-fire"`);
- *"an archive holding nothing we may show"* built by dropping viewable type-02 games,
  which stopped describing an empty archive the moment preseason became showable.

⭐ **The claim usually survives; the fixture has to widen with the rule.** Each was fixed
by making the specimen something the league can never send, or by asserting the fixture
did not strip everything.

## ⭐ TRIPWIRES CC LEFT FOR ITSELF, AND BOTH FIRED — 2026-09-21

`deeplink-render.test.js` carried *"the situations chips are back — if that is
deliberate, this test should read their pressed state again rather than only the
scoreboard"*, written on the day the chips were removed. Restoring them turned it red,
so the restoration read `aria-pressed` again **instead of rediscovering the need**. And
`render-notes.test.js` pins the number of disclosure zones *"as a tripwire, not a
target… so a zone cannot be added without someone reading the two properties above and
deciding they hold for it"* — which forced the new Counting drawer to be read against
both before 5 became 6.

⛔ **NOT "an earlier author" — CC wrote both, in earlier sessions.** See
[[feedback-you-wrote-all-of-it]]. A tripwire is worth leaving precisely because the self
that meets it will not remember writing it.


---

## §139 — 2026-09-23 ⛔⛔ THE TRANSFORM BETWEEN TWO TESTED STEPS WAS MISSING, AND BOTH SUITES WERE GREEN

**What shipped.** `census.js` gained five counters — penalties, offsides, power-play
chances, PP goals, SH goals — for the preview card's three league rows. `censusGame`
counts them. `censusAdd` sums them. `censusRates`, the ONLY projection that reaches
`measures.json`, never published them. The rows could not draw on any archive, ever.
Kevin found it from the live site: an empty card.

**Why 1,400 tests missed it.** The suites covered the step before and the step after.

- `test/census.test.js` drove `censusGame` and `censusAdd` — four tests, all good — and
  stopped one call short of publication. Its last test is even NAMED for the published
  form: *"the archive folds the three, and a rate is counts over the census games"*. It
  never calls `censusRates`. Shape 1 of this file, in the plainest possible form: the
  name announces the document, the check tests the accumulator.
- `test/preview.test.js` drove the consumer, and its fixture **hand-wrote**
  `census: { whistles: {...} }`. That is the whole defect: a fixture is free to invent
  the producer's output, so it asserts the consumer reads a shape **nothing produces**.

⭐⭐ **THE GENERALISATION.** A pipeline of A → transform → B, with A and B both under
test, does not test the transform. And a hand-written fixture at B is not neutral — it is
a SECOND, UNCHECKED IMPLEMENTATION of what A emits, which is why the gap is invisible
rather than merely uncovered. The more careful the fixture, the more convincing the lie.

✅ **The cure, both halves.** A test that asserts the published projection carries every
key the accumulator holds — derived from the accumulator, not from a list typed in the
test, so a counter added upstream is published or the test fails. And one end-to-end test
in the consumer's suite that builds a REAL producer output and feeds it in. Each kills
only itself when the projection is removed. The second is the only test in that file that
would have caught this.

⚠️ **Third instance in three days of the same family.** `reliability.js` called `of`
instead of `ofGame` and the fixture defined whichever name the code asked for
([[verify-inherited-claims]]); `preview.test.js` was green while the live renderer showed
three wrong sentences, because the module was tested and the RENDERER had no test at all.
**Ask what the fixture is standing in for, and whether anything checks that it stands in
correctly.**


---

## §140 — 2026-09-23 ⛔⛔⛔ THE CODE TALKED ITSELF OUT OF THE METHOD THE DOC SPECIFIED

**What shipped.** `src/lib/reliability.js` decides which measures describe a CLUB and
which describe HOCKEY — the split the whole preview card rests on. It pooled three
seasons of club-seasons **without centring them**. `docs/preview-and-corsi.md` §11.2
specifies the opposite in as many words: *"each season centred before pooling so a
league-wide shift is not read as a club trait."*

⛔ **AND THE CODE ARGUED FOR THE OMISSION IN A COMMENT**, which is what made it survive
review: *"CENTRED PER SEASON IS NOT NEEDED HERE and would be a second rule: a league-wide
shift between years moves both halves of the same point together."* The sentence is TRUE
and it is **the mechanism of the bias**, not a reason there is none. A confident comment
stating a real fact and drawing the wrong conclusion is far harder to catch than a bare
mistake — it reads as having been thought about.

⭐⭐ **THE EVIDENCE WAS PRINTED IN BOTH FILES THE WHOLE TIME.** The doc's table said the
slot row needs **37** games. The published document said **42**. And `dmen` (23) and
`level5` (35) matched **exactly**, because their league level barely moves between
seasons. *Two agree, one disagrees, and the one that disagrees is the one that drifts* —
that is not ambiguous, it is a signature. Nobody diffed a doc's table against a published
document, so it sat there for weeks.

**What it cost, in one afternoon.** `missed` was measured at r = 0.748 / 33 games, shipped
as a club row, and pulled four hours later: centred it needs **113**. The league's miss
rate rose 15% across three seasons and the pooled estimate was reading that drift as club
character. `slot` had been dropped at 42 and came back at **38**.

⛔ **THE VENUE CONTROL I WROTE FOR IT TESTED THE WRONG THING TOO** — shape 1 of this file,
in the same commit. *"A club's home figure and its away figure differ by 0.14 of a point"*
is arithmetically correct and answers a narrower question than it announces: a
league-wide home−away gap **cancels** any bias that inflates both clubs in a building
equally, which is exactly what one scorer's threshold does. Asked properly — does the home
club's figure co-move with its visitors' inside one building? — it scored 0.732 against
0.449 for the known scorer-judged control.

✅ **THE TEST THAT NOW HOLDS IT makes the two answers differ in SIGN, not in magnitude.**
Two seasons at different league levels, each club's halves perfectly anti-correlated
within a season: uncentred reads **r = +0.95** (the most reliable thing in hockey),
centred is negative and settles at no number of games. Its paired half proves centring is
a no-op on a measure whose league level is flat — which is exactly why nobody noticed.

⚠️ **AND THE FIXTURES COULD NOT HAVE CAUGHT IT.** `test/preview.test.js` writes `settle`
values into its fixtures rather than computing them, so every downstream test agreed with
whatever the instrument said. A fixture that hard-codes the output of the thing under test
cannot fail with it. [[show-the-work-or-do-not-print-it]]

---

## §141 — A TEST THAT IS UNFALSIFIABLE FOR TWENTY-ONE HOURS A DAY (2026-09-23)

⛔⛔ **WHAT HAPPENED.** A deploy failed on `test/homepage.test.js` — two tests,
on a commit that had touched nothing near them, ninety minutes after the
identical code went green on this machine. The block builds a night three hours
from `Date.now()` and asserts the page calls it **Tonight**. Between 21:00 and
midnight in the runner's timezone, three hours from now is TOMORROW, the page
correctly names the day instead, and the assertion fails. CI runs in UTC; the
deploy landed at 21:45Z.

⭐⭐ **THE SHAPE, AND IT IS WORSE THAN "FLAKY".** The test was **unfalsifiable for
twenty-one hours out of every twenty-four.** Running it at 2pm proved nothing
about it — not "usually passes", but *cannot fail*. That is the same family as a
guard asserting a figure is PRESENT rather than CORRECT (§12) and a probe that
never entered its subject (§7.2): a check whose failing case is unreachable in
the conditions you run it under. **Ask of any time-, locale- or
environment-dependent check: under what conditions can this fail, and have I ever
been in them?**

✅ **THE FIX IS TO PIN THE CLOCK, BOUND AS A PARAMETER.** `run({ at })` in
`homepage.test.js` now binds a `Date` subclass into the page's `new Function`,
exactly as `preview-page.test.js` does — ⛔ never a global swapped and restored,
which always loses the race against a `.then` (§‑the preview harness's own note).
⚠️ And the pinned instant is built from LOCAL components (`new Date(2026, 8, 23,
13, 0, 0)`), because a fixed UTC instant still lands on a different calendar DAY
depending on where the suite runs — which is the bug itself.

✅ **AND A NET FOR THE NEXT ONE: `tools/clock-sweep.sh`, in `npm run gates`.**
It runs the whole suite twice more with `TZ` chosen so local time is 23:xx and
00:xx *whatever the hour is in UTC*, which moves the calendar boundary an hour
either side of every fixture. 6.6s a pass. **Proven both ways before it shipped:**
it reproduces the exact two CI failures against the unfixed code and passes
against the fixed code, in four timezones.

⚠️ It catches boundary-of-the-DAY dependence, not dependence on the hour itself,
and it says so in its own header rather than implying more.

Related shape for the index: **9. A check that cannot fail in the conditions you
run it under.** Time of day, timezone, locale, an empty fixture, a document that
predates the field. Ask what would have to be true for a red, then make it true
once on purpose.


---

## ⛔⛔ 2026-09-24 §142 — THE FIXTURE ON THE BOUNDARY, AND THE STRIPPER THAT DESYNCED

**The defect.** `test/homepage.test.js` FRESH_CASES `stalled`:
`lastRun: new Date(Date.now() - 4 * 86400000).toISOString()`, asserting the page
says *"4 days ago"*. `ago()` in `ingest-state.js` is `Math.floor(h / 24)`. Exactly
four days is the floor boundary. elapsed = 96h + (render_now − module_now), so the
assertion is a claim that **the wall clock did not step backwards between two reads
in the same process**. Any backwards correction, of any size, makes it 95.999…h and
the page says "3 days ago" — the right answer to the wrong fixture.

**How it surfaced.** `tools/clock-sweep.sh`, built the day before for shape 10, went
red on the GMT+8 pass at 08:33 UTC and green on the identical code at 08:33 UTC in
the next run. ⭐ **Two runs in the same UTC minute disagreeing is not a time-of-day
effect and not flakiness — it is a knife edge**, and the diagnosis came from the
failure TEXT ("3 days ago", one less) rather than from re-running.

**The fix.** Pinned with the `at` the harness already carried, offset **4 days 12
hours** — the middle of the band. Proven both ways: drop the pin → "102 days ago";
`Math.floor(h / 24) + 1` in the built page → "5 days ago".

### ⭐⭐ AND THE NET FOR IT WAS WRONG FIRST, IN A NEW WAY

The guard: no test source may build a fixture out of the wall clock. First draft
walked the source stripping `/* */`, `//` and strings so the token could be found in
code alone. It reported **two offenders that were clean**. Cause: line 34 of
`homepage.test.js` is a REGEX LITERAL containing a `"`. The walker read it as an
opening string and swallowed the next ninety lines, so the comments explaining the
removal came through as "code".

⭐⭐ **Deciding whether `/` opens a regex or divides is the one thing a hand-rolled
scanner cannot do, and every JS-scanning check in this repo inherits that.** The cure
was not a better walker: it was to stop needing one. **A line is prose if it begins
with `*`, `//` or `/*`** — this repo's JSDoc style without exception, and a
classifier that cannot desync because it never carries state across lines.

⚠️ **AND IT NAMES ITS OWN HOLES**, because the previous version of this rule was
broken by a check that announced more than it proved: `new Date()` with no args is
still allowed (three fixtures legitimately mean "now" and sit 36h clear of the only
threshold reading them — ARITHMETIC is what puts a value on a boundary); a clock
captured into a variable first escapes it; and a multi-line string whose
continuation begins with `*` would be forgiven.

⛔ **One more trap, found by mutating:** the test's own NAME is a code line, and the
scan reads its own file. Spelling the banned token in the title made the guard fail
on itself. Renamed; the token is spelled out in the comment above, where it is prose.

### ⚠️ AND I MASKED A RED GATE THE SAME MORNING

`npm run gates 2>&1 | tail -40` reports **tail's** exit code. The suite was red and
the pipe said 0. That is the `git add &&` defect from 2026-09-10 in a new spelling,
committed the morning after reading the entry about it. ⭐ **Never put a gate on the
left of a pipe.**


---

## ⛔⛔⛔ 2026-09-24 §143 — THE SAME CHECK WRITTEN TWICE, AND THE HALF THAT GOT THE FIX

**Three separate instances in one day of ONE defect: a rule applied to one of the
two places that needed it.**

1. **`deploy.yml` had two ways of fetching from a candidate.** The page loop's
   helper waits out a 404 — with the whole history of the rule above it, from
   09-23 when it was wrong twice. The unfurl check, added later with
   `functions/_middleware.js`, used a bare one-shot `curl` and failed a deploy
   when `/preview.html` 404'd while `/preview.html?game=...` answered 200 **from
   the same deployment, in the same step, seconds earlier.** ⭐ **Actions steps
   cannot share a shell function, so the second spelling was not laziness — a
   FILE was the only thing that would have worked and nobody reached for one.**
   `tools/edge-fetch.sh` now, with a gate that no bare `curl` hits a candidate.
2. **The front door and its card stated four measurements each in their own
   words** — "A shot FROM inside the slot" vs "A shot TAKEN FROM inside the
   slot". ⭐ The NUMBERS could never drift (both substitute the same placeholder
   from the same document), so `measures_fresh.py` was guarding the safe half.
   **The exposure was the sentence.** `FIGURE_CLAUSE` + `test_one_statement.py`.
3. **`archive.js` carries a `what` on every measurement and `census.js` carried
   none** — nine sub-objects, zero sentences — which is *why* the census-backed
   derivations were hand-written in `methods.js`. A module-shaped gap, invisible
   as long as you only look at one figure at a time.

### ⭐⭐ AND TWO GUARDS I WROTE THAT DAY WERE VACUOUS IN THE SAME WAY

- **The Cloudflare preflight tested READ and concluded about WRITE**, printing
  *"not a permissions problem at this level"* on the very run where Edit was
  missing. Shape 2, inside the step whose entire purpose was to stop a refusal
  being guessed at. ⭐ **There is no read-only call that establishes a write
  permission — the write IS the probe**, and the step after it reads the pair.
- **The edge-fetch test pointed at production for a 404 that production does not
  give.** `readthegame.co` answers **200 for any missing path**, so the branch
  under test was never entered. ⭐ **To test a 404 you have to serve one.**

### ⚠️ Three mechanical traps, cheap to re-learn the hard way

- **A gate on the left of a pipe reports the pipe's exit code.** `npm run gates
  2>&1 | tail -40` said 0 over a red suite.
- **`pkill -f <pattern>` matches the shell running it** when the pattern appears
  in its own command line. It killed the edit it was clearing the way for.
- **A synchronous child process and an in-process server are a deadlock**, always:
  `execFileSync` blocks the event loop the server needs to accept the connection.
- **`curl` without `-L` says 308 for every page on this site.** Production reads
  as broken when it is fine.

## §144 — 2026-09-24: FOUR NARROW CHECKS IN ONE AFTERNOON, AND WHAT MADE EACH VISIBLE

Recorded because the common factor is not carelessness; it is that **each check
was written in the same hour as the thing it checks, by someone holding the
implementation in mind.** The implementation is exactly what makes the narrower
reading feel like the claim.

**(1) Reading the projection instead of the source.** The rule was "an entry in
`PRINTED` must not type its own `count`/`of` — the description is read from the
published document." The test iterated `printed(MEASURES)`, the resolver's
output. `printed()` constructs its result field by field, so a typed `count` on
the table can never reach it: the test was structurally incapable of failing.
**Caught by mutating** — adding `count:` to an entry and watching every test stay
green. Fix: export the table and read it. Cost: 10 minutes, because the mutation
was run.

**(2) A repair that made the other half unfalsifiable.** `test_one_statement.py`
counted a placeholder's occurrences in string literals. Adding `FIGURE_DERIVATION`
— a map keyed by every placeholder — made every figure appear twice, so the test
went red across the board with nothing written twice. The first fix ("count only
where the string says something else too") was right for the *stated twice* half
and silently broke the *printed by nothing* half: the door map now guarantees
every figure a reference forever. **Caught by deleting a card's only sentence and
watching the suite stay green.** The real fix is two counts for two questions:
prose statements for "written twice", prose OR a subscript lookup for "printed by
nothing". ⭐ **A single count answering two questions gets one of them wrong.**

**(3) The false alarm — the only self-announcing member of the family.** Two
tests named "the Learn More row" and scanned the whole panel. A second row of
links broke them. Nothing they were about had changed. ⭐ **When a test goes red
for a change it has no business seeing, the test is reading too wide** — and that
is the cheapest signal this failure mode ever gives, because the alternative is
the same defect passing forever.

**(4) A harness that hid a working gate.** `npm run build >/dev/null 2>&1` then
`node --test`, with no check on the build's exit code. A mutation the BUILD
refused was reported as "NOT CAUGHT", which reads as a missing gate and invites
writing a second one. The build refusing a mutation IS the gate firing. Now the
harness prints "BUILD REFUSED IT (that is a gate too)". ⛔ Third spelling of the
`git add &&` defect: **an exit code discarded by a pipeline is a green light you
did not earn.**

## §145 — 2026-09-25: FOUR HALTS, THREE CORRECT FIXES, AND THE QUESTION NOBODY ASKED

The nightly ingest stopped on a new penalty descriptor on 09-19, 09-21, 09-23 and
09-25. The first three were fixed correctly — read the word, give it prose in
`src/lib/penalties.js`, add it to `KNOWN_PENALTIES`. That IS the right fix for a
new feed value, and the design deliberately refuses to pre-load guesses, so
preseason producing the archive's first `fighting` or `charging` is the system
working.

⛔⛔⛔ **WHAT NOBODY ASKED FOR SIX DAYS: why is a LABEL stopping the ARCHIVE?** It
should not have been. `data/vocabulary-seen.json` said the exit fires *"after
publishing, because none of this can reach a number and withholding the archive
over a label is the mistake the 73 refused games already were."* `derive.py` said
*"the archive is published in full and the RUN goes red."* Both were true of
derive.py, which writes everything before it alarms, and false of `ingest.yml`,
which ran derive as an ordinary step. The fourth halt cost 31 hours of a stale
site before anyone compared the sentence to the behaviour.

⭐⭐⭐ **THE DIAGNOSTIC QUESTION, and it is cheap: on a SECOND occurrence, ask what
you fixed and what you PAID.** Here the answer was "I fixed the word" and "I paid
a stopped pipeline" — four times. A fix that addresses the event and never the
cost is a fix that guarantees the next occurrence. Three commits, none touching a
workflow, is what that looks like in a log.

⚠️ **AND THE ARTEFACT RECORDED THE COST AS WEATHER.** `KNOWN_PENALTIES`' comment
says the descriptors *"halted the nightly ingest"* — written as a fact of life.
Prose that describes a recurring failure without questioning it is how a
workaround becomes the design. The same sentence, read as a claim rather than as
background, is the whole defect.

⭐ **WHY A COMMENT COULD NEVER HAVE CAUGHT IT.** Every halt looked like the system
working: the alarm's own text says the run should go red, and it did. What nobody
checked was what did NOT happen — the sync. An assertion about a step that is
skipped has no output to be wrong in. The gate has to compare POSITIONS.

⛔ **THE PIPE HALF, AND IT IS THE THIRD LOGGED INSTANCE OF THE CLASS.**
`derive.yml` ran `derive.py | tee derived.json` under the default `bash -e {0}`,
which has no `-o pipefail`, so the step reported tee's status and the weekly
alarm never fired. `ingest.yml`'s fetch step carries a comment reading *"This
exact mistake is logged twice in this project's history against `| tail`; writing
it a third time while implementing the design that warns about it would be quite
something."* It was written a third time, one file over, in the step directly
above a comment explaining the trap. The new gate found two MORE instances in
`deploy.yml` immediately. **Documented twice, live in three places.**

## §146 — SHAPE #16: A CHECK THE BUILD CANNOT MAKE, BECAUSE THE BUILD ERASES THE QUESTION

2026-09-26. Both page inliners **strip `import` lines** — node reads `src/lib/*.js`
as real modules for the tests, the browser gets them concatenated. So a page that
inlines `preview.js` and not the file `preview.js` imports from **builds cleanly**
and throws `leagueRows is not defined` when a reader opens it.

⭐⭐⭐ **THE TELL: THE BUILDER HAD BEEN WARNING ABOUT IT IN PROSE FOR WEEKS.**
`build_methods` carries the sentence *"a module this page needs and does not name
is a `ReferenceError` at render time rather than a build failure — which is
exactly how this broke the moment the anchor moved into a file of its own."* It
then happened again, to `preview.html`, the moment `leagueRows` moved into a file
of its own. **A comment that describes a failure mode is a defect waiting for its
second instance.** Same family as §145: a hazard recorded as a fact of life.

⚠️ **AND THE CHECK HAS TO READ THE BUILDER, NOT THE BUILT PAGE.** By the time the
modules are concatenated, "which file was this name supposed to come from" has
been ERASED — every name resolves. The artifact that can be wrong is the LIST.
A gate pointed at the output would have been vacuous.

⭐⭐ **ORDER IS PART OF THE CLAIM AND HIDES BEHIND HOISTING.** `function`
declarations hoist across the concatenation, so a wrong order works; a top-level
`const` does not. A graph that happens to be all functions passes by luck until
one module grows a table. `test/lib-closure.test.js` checks both, and found two
live instances on its first run.

## §147 — A DESIGN NOTE WRITTEN FROM A THING’S NAME RATHER THAN FROM THE THING

2026-09-26. `memory/work-door-over-the-rink.md` said the overlay should show
*"the layer’s `work` sections, one to three, unabridged"*. True, and it never
mentions that **two different renderers draw those sections** — because I wrote it
from the doors’ NAMES in `layer-rules.json` without opening what renders them.
Built to that note, the panel covered three layers of six: it opened on Control,
put the layer’s name in its heading, and drew an empty body. Every test passed.

⭐⭐ **THE REPAIR IS THE INVARIANT, NOT THE SYMPTOM.** The test is not "the overlay
works"; it is *every anchor a layer’s door names is answered by one of the two
tables* — descriptors on one side, tables resolved against the published document
on the other, neither derived from the other. Plus a second check that **both**
tables are load-bearing, because the first one passes in a world where one table
answers everything, which is exactly the world the defect lived in.

## §148 — SHAPE #17: A FIX THAT ADDRESSES A NARROWER PROPERTY THAN THE ONE THAT BROKE

2026-09-27, and it is §#15's sibling on the REPAIR side rather than the check side.

Kevin's first screenshot showed the replay overlay ending part-way down the layer
box, slicing a line of type. I measured it, found it slicing a BUTTON one viewport
wider, fixed it with `min-height:100%`, wrote a gate, proved the gate by mutation,
and called it done. **The gate was sound and the fix was half a fix.** An hour
later his second screenshot showed the same panel 563px TALLER than its card,
burying every transport control.

⭐⭐⭐ **THE TELL: I NAMED THE PROPERTY AS A BOUND.** "At least as tall as the
card" is a floor, and a floor only ever closes one side. The property that was
actually true of a correct overlay was **"exactly the card"** — and `inset:0`
closes both failures with one declaration, where `min-height` closes one and is
silent about the other. A fix stated as an inequality is worth re-reading: ask
what the other direction does.

⚠️ **AND THE GATE INHERITED THE NARROWNESS.** The test asserted `min-height:100%`,
so it would have gone on passing through the second defect forever. When the fix
widened, the test was RETARGETED rather than left standing beside the new one —
two checks, one of them weaker and still green, is how a suite comes to disagree
with itself about what it guarantees.

⭐ Cheap diagnostic, and it would have caught this in a minute: **having found a
defect at one extreme of a range, go and look at the other extreme before writing
the fix.** The panel was too short; nobody asked what happens when it is too tall,
and the answer was on the same page one layer away.

## §149 — THE HARNESS IS BLIND AND KEVIN IS NOT: FOUR FOR FOUR

2026-09-26 to 09-28. The `Is that a lot?` overlay shipped with four defects. Every
one was found by Kevin opening the live site; **not one was found by a suite that
was green at 1,506, 1,513, 1,517 and 1,520 tests through all of them.** They were
not obscure: a panel that drew nothing for half the layers, a panel showing the
wrong layer, a panel slicing a button in half, a panel burying every transport
control.

⭐⭐⭐ **WHAT THEY HAVE IN COMMON IS NOT "LAYOUT".** Two of the four are pure
logic — which table an anchor belongs to, and which function redraws on a layer
change — and the harness could see both. They have in common that **I verified the
NUMBERS survived a move and never verified the EXPERIENCE did.** Every check I
wrote asked "is this figure right"; none asked "what does a reader meet first,
and does it make sense where they meet it".

⏭ The cheap habit that would have caught all four, and it is not a test:
**open the thing and use it, in the order a reader would, once per surface.** I
did that after the first defect and found the second. I did not do it after the
second and shipped the third and fourth.

## §150 — A LABEL CONSTRUCTED FROM A KEY, BESIDE A LABEL THE ARCHIVE PUBLISHES

Small and worth the line. The overlay had to name a season; the key is `2025`, so
I wrote `2025 + '–' + '11'`-shaped code and shipped **"the 2025–11 season"** — for
as long as it took to read the rendered sentence. The document already carries
`population: "NHL regular season and playoffs, 2025-26"`.

⭐ The rule is [[feedback-no-hardcoded-values]] one turn out: **a LABEL is
published data too.** If the archive names a thing, the page reads the name; a
label assembled from a key is a second statement of a convention, and it goes
wrong the first time the convention has an exception.


## #61 — EVERY PROBE DROVE THE CONTROL WITH HALF OF A GESTURE NO HAND CAN MAKE

2026-10-04, the SIXTH defect of the day Kevin found from the live site. *"When I
tap the scrubber to a different time, the replay appears to go through two loops
for each event."*

**A native range reports one tap TWICE.** Measured with a real mouse press:

```
pointerdown=280   input=110   pointerup=110   change=110
```

`oninput` drew frame 110 as a scrub, `onchange` drew it again as a jump, 108ms
later. The label's entrance animation ran twice, 117ms apart.

⭐⭐⭐ **THE REASON NOTHING HERE COULD SEE IT: every probe and every test in the
repo drives the scrubber by dispatching `input` ALONE.** 1,636 tests and nine
browser probes, and not one of them had ever sent the pair a hand sends. The
blind spot was even WRITTEN DOWN — `src/lib/scrub.js` has said since it was
written that *"synthetic clicks do not drive a native range"* — and it was read
as a limitation to live with rather than as a list of behaviour nobody was
testing.

⭐⭐ **ASK WHAT THE REAL DEVICE SENDS, NOT WHAT YOUR DRIVER SENDS.** A driver that
can only produce part of a gesture quietly defines the behaviour you test. The
fix was `tools/browser/cdp.mjs`, ~160 lines of DevTools protocol over
`node:net`, no dependency, which presses with a TRUSTED event.

⭐ **AND THE DEBUGGER IS NOT A PAGE SCRIPT.** The live page's CSP refuses an
injected `<script>`, which is why probes strip it from a local copy — but
`Runtime.evaluate` installs a listener on the LIVE site where no injection can
go. That is how this fix was verified on the deployed bytes rather than inferred
from a green deploy.


## #62 — THE DAMAGE WAS NOT A DOM STATE, SO NO DOM ASSERTION COULD REACH IT

Same defect. **The document after two draws is byte-identical to the document
after one.** What the reader sees is an ANIMATION RESTARTING — and `innerHTML`,
class lists, positions and boxes are all identical in both cases.

⭐⭐ `document.getAnimations()` cannot see it either: a 0.28s fade restarted 117ms
in is never two animations at one instant. **The START is the only observable**,
so the check counts `animationstart`.

⭐⭐⭐ **AND THE FIRST VERSION OF THE CHECK WAS STILL THE WRONG PROPERTY.** It asked
"did any animation run twice", which the memo half of the fix (`put`) makes
FALSE on a doubled page: only the subtrees whose markup differs get rewritten,
so the label fades once and the mark merely appears and then pops a beat later.
No name repeats, and the reader still sees two loops. **The property is the
SPREAD between beats** — one tap must arrive in one beat. #55's rule, met again
one layer in: naming the property is not a thing you do once per defect.


## #63 — A FLAKY CANARY IS WORSE THAN NO CANARY

The canary for that probe was wrong THREE times and **every wrong version
passed**, which is the only direction that matters.

| version | why it did not sing |
|---|---|
| synchronous from `pointerdown` | ran BEFORE the page's own handler |
| `setTimeout(…, 0)` | slipped past the release when the probe ran after eight others |
| `queueMicrotask` | ran before the page's handler too |

⭐⭐⭐ **THE MIDDLE ONE IS THE WORST.** It reproduced the defect when run alone and
not under load. **A canary that sings most of the time is believed, and the one
run that matters is the one where it is silent.** If a canary's evidence depends
on timing, it is not evidence.

⭐⭐ **TWO FACTS ABOUT ORDER, both measured, both of which had to be stopped
being assumed:**
- **The shell wires its controls AFTER its fetch.** `#scrub` is in the static
  markup, so an injected script finds it at parse time and registers FIRST,
  while the page assigns its `on*` properties only once the extract arrives —
  and a property handler is a listener registered when the property was set.
- **Microtasks drain BETWEEN listeners, not after the dispatch.** The JS stack
  empties as each listener returns, so a microtask queued by the first listener
  runs before the second.

⭐ **THE SHIPPED CANARY ASSUMES NO ORDER AT ALL** — two synthetic reports
dispatched from the real one, so the page draws at the press whichever way the
listeners run. **When a canary needs an ordering to work, make it work under
both orderings instead of measuring which one holds today.**

⭐ And the thing that ended three rounds of guessing: **the canary now PRINTS
WHAT IT SAW.** "THE CANARY PASSED" with no trace cost three wrong fixes; the
event sequence and the beats named the cause in one run.


## #64 — AN ENTRANCE ANIMATION IS STATE, AND REPLACING AN ELEMENT RESETS IT

The second half of the same fix, and a rule worth having on its own: **writing
`innerHTML` with the SAME STRING is not a no-op.** The nodes are new, so every
CSS animation on them starts again.

⭐ `drawNetmen` had reasoned this out for the goaltenders since the day it was
written — *"a goaltender flickering three hundred times a game"* — and was **the
only drawing function in a 4,900-line file that had.** It was the one thing on
the ice that did not flicker twice on a tap. A correct rule stated at one
instance protects that instance and nothing else; generalising it into `put`
fixed the label, the shot line, the face-off rings and the whistle geometry at
once.

⚠️ **AND A MEMO KEYED BY ELEMENT NEEDS EVERY WRITER TO GO THROUGH IT.** A second
writer assigning `innerHTML` directly leaves the memo holding a string that is
not on screen, and the next `put` of that string is SKIPPED — stale content,
permanently. `#draws` and `#whistles` each have two writers; a test asserts no
direct assignment survives.


## #65 — A FIX APPLIED TO THE THING AND NOT TO THE KEY THAT DESCRIBES IT

2026-10-04, from Kevin's line-by-line read of the live sidebar: *"is the colour
combination for 'blocked' in the sidebar correct?"*

It was not, and the way it was wrong is the lesson. `marks.js` had carried this
since September:

> a blocked shot is an attempt, ANNOTATED, and the annotation is a separate ring
> rather than the mark's own stroke … drawn the old way **a visitor's blocked
> shot is a white dot with an orange ring and no team colour anywhere on it,
> which on the ice reads as a third club**

Kevin had found THAT one in a real game too. The ice was repaired. **The legend
was not** — `.k-blkv` stayed exactly as the sentence describes it, so for a month
the key taught a reader to recognise a mark the rink had stopped drawing.

⭐⭐⭐ **A KEY, A CAPTION, A HELP PANEL AND A DOC ARE SECOND SURFACES THAT DESCRIBE
A FIRST ONE. Fixing the first does not fix them, and nothing goes red.** Ask, on
every render fix: *what else on this site claims to show this?* ✅ The gate is
`test/key-matches-the-ice.test.js` — every swatch must be made of the colours the
rink paints its mark with, **both directions**, since the shipped defect was the
key having a colour the ice does NOT.

⚠️ **AND ONE REASONED EXEMPTION, WHICH MUST BE ABLE TO GO STALE LOUDLY.** The
puck's white stroke is a CONTRAST device against blue lines and red lines; the
key sits on white, where drawing it would be a rule whose only job is to pass the
test. So it is exempted by name, with its reason — and the test asserts the
exempted colour is still on the ice, or the exemption is deleted. A dead
exemption goes on excusing whatever takes its place.

⭐ **A SECOND SPELLING OF A FIX CAN BE WORSE THAN THE DEFECT, AND ONLY LOOKING
SAYS SO.** The obvious repair — a second `box-shadow` ring — grew the swatch 3px
in every direction, and the row is built for 10px discs: measured in a browser,
the two blocked glyphs overlapped by 6px and the second ran 3px into its own
label. A gradient puts the club at the disc's edge and keeps the box.


## #66 — ONE CONSTANT WRITTEN TWICE IN TWO UNIT CONTEXTS IS TWO CONSTANTS

Same read. Kevin: *"the scale number on the right isn't aligned to the right,
it's like 3/4 of the way."*

It was at **78%**, and 78% is `.7rem / .9rem`. The rail and its axis-ends row
each carried `max-width:34ch`, and **`ch` resolves against the element's OWN
font-size** — so one number, written twice, produced two widths and the
right-hand label stopped short of the rail it labels.

⭐⭐ **THE SISTER SURFACE NEVER HAD IT, AND THAT IS THE TELL.** The preview card's
`.pvends` is a GRID CELL: it takes the track's width by construction rather than
restating it. When two surfaces draw the same picture and only one is wrong, read
the right one first — it usually contains the fix.

⭐ **AND THE SAME SHAPE IN A GATE, THE SAME DAY.** `tools/browser/door-row.mjs`
held a THIRD copy of the summary door's label, beside the two the page already
ships (`app.js` and `builders/build_main.py`). Renaming the door correctly in
both shipped places **failed the release gate**. A check that restates a value
instead of reading it is a copy that can disagree with the thing it checks; both
that probe and the overlay tests now read the label off the built markup.


## #67 — THE SENTENCE YOU ARE ABOUT TO PUBLISH IS A TEST OF THE PRODUCT

2026-10-04. Kevin drafted the first public post about this site and showed it
before sending:

> A real NHL game … **every number on screen opens to how it was worked out.**

⭐⭐⭐ **I CHECKED THE CLAIM AGAINST THE SCREEN THE LINK OPENS, AND IT WAS FALSE.**
Measured live: the summary panel held twelve numbers and **zero links**, and both
work doors under the rink were `visibility: hidden` — they sit in the layer row
and the default layer is `Just events`. A reader could have falsified it in ten
seconds, on a site whose entire pitch is CHECK OUR WORK.

**The house rule — every number carries a door to its derivation — had been
"closed on every surface" since 2026-09-24.** The summary card then moved into an
overlay (10-01) and gained a mark per club (10-04), and neither change brought a
door with it. **A rule declared closed is closed as of a date, not forever; every
new surface re-opens it, and nothing goes red.**

⭐⭐ **THE PRACTICE: WRITE THE PUBLIC SENTENCE FIRST, THEN GO AND FALSIFY IT.**
Marketing copy is the only artefact that states the product's promises in one
line, out loud, where a stranger will test them. It found a real gap that 1,650
tests, nine probes and a year of doctrine did not — because every one of those
asks "is this surface right" and the sentence asks "is the whole claim true of
the first thing anybody sees."

⚠️ **AND IT HAS A SECOND USE: IT NAMES THE LANDING STATE.** Checking the post
also measured what a stranger actually meets — the ice hidden behind the panel
on a link carrying `summary=1`, and a rotate prompt on a phone in portrait.
Neither is a defect; both are things nobody had looked at, because nobody on the
team arrives cold.

⛔ **A COUNT OF TOKENS IN `textContent` IS NOT A COUNT OF WHAT IS ON SCREEN.**
Adjacent nodes concatenate with no separator, so "63" then "37" then "95" reads
as `633795` and a regex reports two numbers where a reader sees four. It cost a
round of re-measuring. Use the elements, not the text.

# ⛔ #90 — 2026-10-14: A PROBE'S OWN FIXTURE IS A SECOND COPY OF THE DATA SHAPE

Two nightly deploys failed at `preview-marks` a day after the 7-row team section
shipped green. The probe draws the preview from made-up teams
(`tools/browser/preview-marks.mjs::fixture`), typed when there were 3 rows; the
new sogShare/shiftLength rows had no data there, so they drew no mark. The
push-time deploy PASSED because the published measures.json did not admit those
rows yet — the failure waited for the data to catch up with the code. **Adding a
field to a reader means auditing every fixture that feeds that reader, browser
probes included.** Guard: `test/browser-checks.test.js` runs `preview()` over the
probe's fixture with every CLUB_ROWS row admitted and requires a value.
⚠️ Local repro first said "drew no rows" for BOTH versions: `/tmp/rtg-pixels/libs`
was gone (WSL restart) and Chrome could not start. Restore with the apt-get
download + dpkg-deb lines in `tools/pixels.sh`, then export LD_LIBRARY_PATH.
Check the instrument before reading its verdict (looking-at-pixels).
