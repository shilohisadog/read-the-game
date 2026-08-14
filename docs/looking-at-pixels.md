# Looking at pixels

*Why `tools/pixels.sh` exists, what it can tell you, and the two ways it lied to
me before it worked.*

```
tools/pixels.sh                 # 360 and 1100
tools/pixels.sh 360 768 1400    # any widths
```

## 1. The three failures that bought it

The five-second preview on the front door shipped broken three times in a row,
and **all 419 tests were green through every one of them**:

| Kevin saw | the cause |
|---|---|
| *"a blur of activity, looks like it's 100x real-time"* | 44 events in five seconds — 115ms each, eleven times the page's own teaching pace |
| *"the bottom 1/3 of the rink is clipped off within the frame"* | a fixed `aspect-ratio` on the iframe; the rink scales with width, the chrome's height does not |
| *"doesn't look to be scaling properly"* on mobile | the scoreboard was **87px in both** a 856px-wide frame and a 287px one |

Each fix was reasoned carefully and each was wrong, because **the reasoning had
no contact with a rendered page**. The unit tests could not help: the fake
document they run against has no CSS and no layout, so `display:none` is
invisible to it and so is every question about size or position. That limitation
is stated in `test/layers.test.js` and it is real — the tests are not weak, they
are *blind on this axis*.

The measurement that ended it took one run:

```
frame 856x462 (desktop)   scoreboard 87px   19% of the box
frame 287x155 (phone)     scoreboard 87px   56% of the box
```

The board's type is set in `rem`, and `rem` does not care how wide the frame is.
Nobody was going to derive that from the source.

## 2. What it does

Builds the site, serves it locally, opens it in a real Chromium at the widths
you name, and prints the geometry of the front door's preview plus a screenshot
of the whole page and of the hero alone.

```
360px  {"booted":true,"frame":"287x184","board":"287x49","rinkBox":"273x117",
        "scrollsSideways":false,"tallerThanFrame":false}
```

**It asserts nothing.** It has no opinion about what looks good and it is not a
check on production. It shows you the page and prints its measurements; the
judging is yours. That is the whole point — the failures above were failures of
*seeing*, not of rigour.

## 3. Why it is not a dependency

`package.json` says *"Zero dependencies, deliberately. `npm test` runs node's
built-in runner."* That stays true. Playwright and its browser install into a
scratch directory outside the repo (`$RTG_PIXELS_WORK`, default
`/tmp/rtg-pixels`), nothing in `npm run gates` imports any of it, and the repo
gains one shell script.

On a stock Ubuntu/WSL image Chromium is missing three shared libraries and
`playwright install-deps` wants root. `apt-get download` does not, so the script
fetches `libnspr4`, `libnss3` and `libasound2`, unpacks them with `dpkg-deb -x`,
and puts the directory on `LD_LIBRARY_PATH`. No privileges, nothing installed
system-wide.

## 4. The two ways it lied

**It measured a page that had never booted.** The harness rewrites the data
origin to a relative path so the local copy can fetch, which means the shell
asks for `/extract/<id>.json`. Without that file it 404s, `boot()` never runs,
the preview class is never added — and the harness cheerfully reported tidy
geometry for an **error page**. Three "no change" runs after a real CSS edit.

> So it fetches a real extract, and `booted` is reported first. If `#rg` does not
> carry the `preview` class, the numbers describe something else and the script
> says so in the same breath.

This is the layout-shaped version of a defect this project has hit repeatedly: a
check that cannot fail because the thing it measures never ran.

**Its server outlived its directory.** The first version did `rm -rf site &&
mkdir site` before each run. A `python3 -m http.server` already running holds the
old directory as its working directory, so replacing the inode leaves it serving
a deleted tree — and the screenshots came back **byte-identical after a real CSS
change**. The script no longer removes the directory.

## 5. The CSP comes off, and that is not a shortcut

The policy is hash-pinned over the script's exact bytes, and rewriting the data
origin changes those bytes — so the hash would no longer match and the browser
would refuse the page. A blank screenshot proves nothing. The CSP is stripped
for the same reason and in the same way `deploy.yml` strips it before framing a
page, and its correctness is a separate claim, asserted by set-equality in
`test/shell.test.js`.

Which means: **this tool cannot tell you the CSP is right.** It can tell you the
layout is.

## 6. What the automated gate does now, and what it took

`deploy.yml` measures horizontal overflow of the outer document at an imposed
360px, with a canary that must fail. That is real, and it cannot see inside the
hero: the preview is a page within a page, so a rink squashed to a sliver costs
the outer document not one pixel of width.

A second step now reaches into the frame. It renders the preview at a phone box
and a desktop box and fails on sideways scroll, on vertical crop, and on a
scoreboard taking more than a third of the taste — with a canary at 287×60 that
the step **fails if it accepts**.

**It went red twice first, and the cause was none of the things I guessed.** Not
the probe, not the nested iframes, not the browser version. A diagnostic run
said it in one line:

```
OSError: [Errno 98] Address already in use
LISTEN 0 5 0.0.0.0:8098  users:(("python3",pid=2634,fd=3))
    prev.html 404 / game.html 404 / extract 404
```

An earlier step in the same job already runs `http.server 8098` and never stops
it. My server died on bind, `>/dev/null 2>&1` swallowed the traceback, and
Chrome dutifully measured 404s out of somebody else's directory. I had copied
the port from that step without checking it was free, then spent two round trips
theorising about lazy iframes.

The fix that generalises is not the new port. It is that **the step proves the
server is its own** before believing anything: it writes a file only this run
could have written, fetches it back, and compares. *"A server answered"* and
*"my server answered"* are different facts, and only one of them was true. That
single check would have turned two red deploys into one clear error message.

Both halves were run locally before it was pushed — with a decoy already holding
the port (exit 1, naming the port) and with the port free (exit 0, canary
correctly rejected). Which is the same discipline as the rest of this file:
**look at it, rather than reason about it.**

## 7. A third probe, and the same lie in a new costume

The gate for the verdict dot (§D2) went red on its first run with *"none of the
five newest games drew a rate"* — five games in a row, which is a suspicious
number. Three of the five provably have one: running `sentenceFor` against the
live `measures.json` and the real extracts returns a rate for `2025030416`,
`2025030413` and `2025030412`.

So the message was wrong, and it was wrong in a way this file has already named
once. The probe asked `if (!document.getElementById('verdict'))` to decide
whether the page had loaded — but **`<p id="verdict">` is in the static markup**,
so an empty one answers *yes*. Every failure, whatever its cause, came out
labelled "this game has no comparison to show", which is a legitimate state. The
step reported the wrong reason five times and I nearly believed it.

The cause underneath was different again: the probe set `iframe.src` from
`location.search` **after** load, and under `--virtual-time-budget` the clock
runs ahead of a navigation the document did not start with. The measurement
fired against a frame that had never booted. The preview gate in §6 bakes its
`src` into the markup and works; this one now does the same.

Two rules fall out, and neither is about iframes:

- **A probe needs a field for "did the thing under test run at all"**, separate
  from every field about what it found. `booted` is now its own number in the
  reported tuple, read off `#gl` — which `boot()` writes and the static page
  leaves as `—`. Without it, a broken harness and a legitimate empty state are
  the same observation.
- **A diagnostic that can only produce one explanation is not a diagnostic.**
  Five identical messages should have been read as "this probe has one exit",
  not as five facts about hockey.
