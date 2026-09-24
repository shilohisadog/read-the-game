# THE ONE WAY THIS REPO ASKS A FRESH DEPLOYMENT FOR A PAGE.
#
# Usage, from a workflow step whose working directory is the repo root:
#
#     . tools/edge-fetch.sh
#     edge_fetch "<path-with-any-query>" <destination-file> [retry404]
#
# `URL` must name the deployment being checked. `VISITOR_UA` is optional and
# defaults below. Returns 0 having written the body, or 1 having printed the
# reason.
#
# ⛔⛔⛔ WHY IT IS A FILE AND NOT A FUNCTION IN THE STEP THAT NEEDED IT FIRST.
# 2026-09-24: `deploy.yml` had two ways of fetching from a candidate. The page
# loop used a helper that waits out a 404; the unfurl check, added later with
# `functions/_middleware.js`, used a bare one-shot `curl`. A deploy failed
# because `/preview.html` answered 404 on the candidate — while
# `/preview.html?game=...`, fetched from the SAME deployment seconds earlier
# through the SAME step, answered 200 and carried the right title. Both URLs
# served 200 minutes later.
#
# ⭐ The rule had been written down the day before and applied to one of the two
# spellings. GitHub Actions steps cannot share a shell function, so the second
# spelling was not laziness — it was the only thing available in the step. A file
# is the thing that was available and nobody reached for.
#
# ⛔⛔ THE RULE ITSELF, AND IT HAS BEEN WRONG TWICE BY BEING NARROWED. It first
# read "retry 5xx but never 404, because a missing file is a real answer" — true
# before a Worker sat in front of the assets. With Functions, the Worker goes
# live before the asset manifest finishes propagating, `next()` finds no asset,
# and the honest 404 it passes through is indistinguishable from a real one. The
# second version narrowed the retry to the ROOT, reasoning that "a named page
# that 404s IS a missing file"; eight hours later `/faceoffs.html` 404'd on a
# candidate that served it 200 minutes afterwards.
#
# ⭐⭐ THE RULE THAT SURVIVED BOTH: **the asset manifest does not propagate
# atomically, so any path can be briefly absent, and "is this missing or is this
# slow?" cannot be answered from one response. It is answered by waiting.** The
# cause is not hidden by waiting — it is reported 72 seconds later by the "never
# became available" line, naming the path and the last code seen.
#
# ⚠️ CALLERS THAT SHOULD NOT PASS `retry404`: anything with its own outer retry
# loop, where a 404 is one cheap attempt of many rather than a verdict. Making
# each attempt wait 72 seconds turns a two-minute poll into half an hour.

# The agent a real visitor sends. Checked once against all nine pages: they are
# byte-identical under a Chrome agent and under curl's default.
# ⭐ THE WAIT IS A PARAMETER WITH A PRODUCTION DEFAULT, so the behaviour can be
# tested without the test taking seventy-two seconds. `test/edge-fetch.test.js`
# sets it to 0 and serves 404 twice then 200. That proves the RETRYING, which is
# the claim; it does not prove the sleep is six seconds, and does not pretend to.
: "${EDGE_WAIT:=6}"

: "${VISITOR_UA:=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36}"

edge_fetch() {  # edge_fetch <path> <destination> [retry404]
  local path="$1" dest="$2" retry404="${3:-}" code i
  for i in $(seq 1 12); do
    # 000 is curl's code for a transport failure, which for a hostname minutes
    # old usually means DNS has not propagated yet -- another thing to wait out
    # rather than report as a broken site.
    code=$(curl -sS -A "$VISITOR_UA" -H 'Accept: text/html' \
                -o "$dest" -w '%{http_code}' -L "$URL/$path") || code=000
    case "$code" in
      200)     return 0 ;;
      5*|000)  echo "    attempt $i: HTTP $code — edge not ready"; sleep "$EDGE_WAIT" ;;
      404)     if [ -n "$retry404" ]; then
                 echo "    attempt $i: HTTP 404 — the route is not resolving yet"
                 sleep "$EDGE_WAIT"
               else
                 echo "::error::/$path returned HTTP 404"; return 1
               fi ;;
      *)       echo "::error::/$path returned HTTP $code"; return 1 ;;
    esac
  done
  echo "::error::/$path never became available (last HTTP $code)"
  return 1
}
