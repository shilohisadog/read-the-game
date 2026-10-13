#!/usr/bin/env bash
# Fail when a game the archive refuses still has a published extract. The sync
# never deletes, so a game published once and refused later would keep a
# replay the catalog says we do not hold. Read-only: removing one is a person's call.
#
#   tools/refused-extracts-check.sh <index.json>
#
# Needs BUCKET and S3_ENDPOINT, plus the AWS credentials the caller already has.
set -euo pipefail
: "${BUCKET:?}" "${S3_ENDPOINT:?}"
index="${1:?usage: $0 <index.json>}"

refused=$(python3 -c "import json,sys;print('\n'.join(str(g) for g in json.load(open(sys.argv[1]))['archive']['refusedGames']))" "$index" | sort)
listing=$(aws s3 ls "s3://${BUCKET}/extract/" --endpoint-url "$S3_ENDPOINT")
held=$(echo "$listing" | awk '{print $4}' | sed -n 's/\.json$//p' | sort)
[ -n "$held" ] || { echo "::error::the extract listing came back empty"; exit 1; }
stale=$(comm -12 <(echo "$refused") <(echo "$held"))
if [ -n "$stale" ]; then
  echo "::error::refused games with a published extract (a replay the catalog says we do not hold): $(echo $stale)"
  exit 1
fi
echo "  $(echo "$refused" | grep -c . || true) refused games, none with a published extract ($(echo "$held" | wc -l) extracts listed)"
