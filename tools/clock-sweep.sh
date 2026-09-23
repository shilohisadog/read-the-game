#!/usr/bin/env bash
#
# RUN THE SUITE AGAIN WITH THE READER'S CLOCK AT THE EDGE OF A DAY.
#
# ⛔⛔ THE DEFECT THIS EXISTS FOR, 2026-09-23. `test/homepage.test.js` built a
# night three hours from `Date.now()` and asserted the page called it TONIGHT.
# That is true for twenty-one hours a day and false for three: between 21:00 and
# midnight in the runner's timezone, three hours from now is TOMORROW, the page
# correctly names the day instead, and the test fails. It failed a deploy on a
# commit that had touched nothing near it, having passed on the identical code
# ninety minutes earlier on this machine.
#
# ⭐ A TEST WHOSE ANSWER DEPENDS ON WHEN IT RUNS IS NOT A TEST OF THE PAGE, and
# the shape is worse than the flake: it is UNFALSIFIABLE most of the day. Running
# the suite at 2pm proves nothing about it, which is why it survived from the day
# the block was written until the first deploy that happened to land after nine.
#
# ⚠️ WHAT THIS CAN AND CANNOT CATCH. It moves the calendar boundary, not the
# clock: a test that reads `Date.now()` still gets the true instant, but the LOCAL
# DAY that instant falls in is now one hour away in each direction. That is the
# boundary essentially all of these defects sit on — is this fixture today or
# tomorrow, is this game tonight or last night, does this date string roll over.
# It cannot catch a test that depends on the hour itself rather than the day, and
# it does not pretend to.
#
# ⛔ AND IT IS NOT A SUBSTITUTE FOR PINNING THE CLOCK. The fix for a
# time-dependent test is to inject the instant (`run({ at })` in homepage.test.js,
# the `Date` parameter in preview-page.test.js); this is the net that finds the
# next one somebody forgets to pin.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# The zone that puts LOCAL time at the given hour, whatever the hour is in UTC.
# POSIX inverts the sign: UTC+5 is `Etc/GMT-5`. Offsets run UTC-12..UTC+14, and
# `(want - utc_hour) mod 24` always lands inside that span once folded.
zone_for() {
  local want="$1" h o
  h=$(date -u +%H)
  o=$(( (want - 10#$h + 24) % 24 ))
  [ "$o" -gt 14 ] && o=$(( o - 24 ))
  if [ "$o" -ge 0 ]; then echo "Etc/GMT-$o"; else echo "Etc/GMT+$(( -o ))"; fi
}

fail=0
# 23:xx local — a fixture "a few hours from now" is tomorrow.
# 00:xx local — a fixture "a few hours ago" was yesterday.
for want in 23 0; do
  z=$(zone_for "$want")
  printf '  clock sweep: TZ=%-12s local %s  ' "$z" "$(TZ="$z" date +%H:%M)"
  if TZ="$z" npm test >/tmp/clock-sweep.$$ 2>&1; then
    echo "ok"
  else
    echo "FAILED"
    grep -E '^not ok|error:' /tmp/clock-sweep.$$ | head -20
    fail=1
  fi
  rm -f /tmp/clock-sweep.$$
done

if [ "$fail" != 0 ]; then
  echo "::error::the suite depends on what time of day it runs — see tools/clock-sweep.sh"
  exit 1
fi
echo "  the suite is the same at both edges of a day"
