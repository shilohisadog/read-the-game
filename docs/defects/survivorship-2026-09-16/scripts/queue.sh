#!/usr/bin/env bash
S=/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad
cd $S
while pgrep -f "mutate.mjs run mutants-A-rerun" >/dev/null; do sleep 20; done
node mutate.mjs run mutants-redundancy.json results-redundancy.jsonl > run-redundancy.log 2>&1
node mutate.mjs run mutants-hand.json results-hand.jsonl > run-hand.log 2>&1
node mutate.mjs run mutants-B.json results-B.jsonl > run-B.log 2>&1
echo QUEUE-DONE
