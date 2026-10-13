#!/usr/bin/env bash
# Publish the per-page documents, or prove the published ones are the exact
# projection of the published catalog and index. Both nightly and weekly call it.
#
#   tools/page-docs-publish.sh upload <dir>   upload <dir>/front.json, team/, calendar/
#   tools/page-docs-publish.sh verify         download all of it and run --verify
#
# Needs BUCKET and S3_ENDPOINT, plus the AWS credentials the caller already has.
set -euo pipefail
: "${BUCKET:?}" "${S3_ENDPOINT:?}"
s3() { aws s3 "$@" --endpoint-url "$S3_ENDPOINT" --no-progress; }

case "${1:-}" in
  upload)
    dir="${2:?upload needs a directory}"
    for d in team calendar; do
      s3 cp "$dir/$d/" "s3://${BUCKET}/$d/" --recursive \
        --cache-control no-cache --content-type application/json
    done
    s3 cp "$dir/front.json" "s3://${BUCKET}/front.json" \
      --cache-control no-cache --content-type application/json
    ;;
  verify)
    got=$(mktemp -d)
    for f in catalog.json index.json front.json; do s3 cp "s3://${BUCKET}/$f" "$got/$f"; done
    for d in team calendar; do s3 cp "s3://${BUCKET}/$d/" "$got/$d/" --recursive; done
    node builders/page-docs.mjs --verify "$got"
    ;;
  *) echo "usage: $0 upload <dir> | verify" >&2; exit 2 ;;
esac
