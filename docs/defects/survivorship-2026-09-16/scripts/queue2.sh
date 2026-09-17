#!/usr/bin/env bash
S=/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad
cd $S
while pgrep -f "mutate.mjs run mutants-redundancy-probes" >/dev/null; do sleep 15; done
rm -f results-B-probes.jsonl
node mutate.mjs run mutants-B-probes.json results-B-probes.jsonl > run-bp.log 2>&1
echo QUEUE2-DONE
