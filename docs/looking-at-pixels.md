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

## 6. What still has no automated gate

`deploy.yml` measures horizontal overflow of the outer document at an imposed
360px, with a canary that must fail. That is real, and it cannot see inside the
hero: the preview is a page within a page, so a rink squashed to a sliver costs
the outer document not one pixel of width.

A step that reaches into the frame has been written twice and gone red in CI
both times — *"the probe never reported"*, while the identical shell body passes
locally. The diagnostic run then showed the actual cause, and it was not the
probe at all: **the local server answered 404 for every file**, so Chrome was
measuring nothing. That step currently runs as a labelled `(diagnostic)` with
`continue-on-error: true` and judges nothing, because a step that cannot fail
must never be described as protection.

Until it earns its exit code back, the only thing standing between us and a
fourth rendering defect is `test/render.test.js` — which pins the *mechanism*
(`min(Xvw,<today>)` chrome, a bounded flex column, the media query) and was
mutation-checked six ways — **plus running this script and looking.**
