#!/bin/sh
# Pull the 2025-26 regular season extracts and tonight's schedule into DIR, for the
# probes beside this file. Reads only; the bucket is public. ~110 MB, 1,312 files.
#   sh tools/probes/preview/fetch.sh DIR && node tools/probes/preview/club-profiles.mjs DIR
set -e
DIR=${1:?usage: fetch.sh DIR}
mkdir -p "$DIR/ex"
for f in catalog schedule; do curl -sf -o "$DIR/$f.json" "https://data.readthegame.co/$f.json"; done
node -e 'for (const g of require(process.argv[1]).games) if (g.t === 2 && String(g.id).startsWith("2025")) console.log(g.id)' "$DIR/catalog.json" \
  | xargs -P 8 -I{} sh -c "[ -s '$DIR/ex/{}.json' ] || curl -sf -o '$DIR/ex/{}.json' https://data.readthegame.co/extract/{}.json"
ls "$DIR/ex" | wc -l
