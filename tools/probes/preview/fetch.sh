#!/bin/sh
# Pull regular-season extracts and tonight's schedule into DIR, for the probes beside this
# file. Reads only; the bucket is public. One season is ~110 MB and 1,312 files.
#   sh tools/probes/preview/fetch.sh DIR                  # 2025-26 only (§3-§6)
#   sh tools/probes/preview/fetch.sh DIR "2023 2024 2025"  # three seasons (§11: seasons.mjs, power-play.mjs)
# ⚠️ ONE POPULATION PER DIR. The §3-§6 probes read EVERY extract in DIR and assume one season;
# fetch three seasons into a different DIR, or they quietly pool 246 games a club.
set -e
DIR=${1:?usage: fetch.sh DIR [SEASONS]}
SEASONS=${2:-2025}
mkdir -p "$DIR/ex"
for f in catalog schedule; do curl -sf -o "$DIR/$f.json" "https://data.readthegame.co/$f.json"; done
node -e 'const ys = process.argv[2].split(" "); for (const g of require(process.argv[1]).games) if (g.t === 2 && ys.includes(String(g.id).slice(0, 4))) console.log(g.id)' "$DIR/catalog.json" "$SEASONS" \
  | xargs -P 8 -I{} sh -c "[ -s '$DIR/ex/{}.json' ] || curl -sf -o '$DIR/ex/{}.json' https://data.readthegame.co/extract/{}.json"
ls "$DIR/ex" | wc -l
