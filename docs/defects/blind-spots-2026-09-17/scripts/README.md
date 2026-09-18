# The scripts, as run

⚠️ **These are the measurement AS IT WAS RUN, not a library.** They carry absolute paths
into a scratch directory and are kept so a reader can check the method, and so the next
run does not start from a description of one. `tools/mutate.mjs`'s header records what
happened the last time this repo kept only the description: the engine had to be rebuilt.

- `stability.mjs` — the same page captured N times; the states must be byte-identical.
- `walk.mjs` — the first version of the all-frames × all-layers sweep. **It now lives in
  the repo as `walkFrames` in `tools/browser/states.mjs`**; this copy is what produced the
  numbers in the README beside it.
- `canary.mjs` — proves the walk is sensitive before any silence from it is believed.
- `measure-walk.mjs` — plants each surviving escape in a worktree, rebuilds, walks.
- `hit.mjs` — the hittable fraction of a clickable mark, on a 9×9 grid over its own box.
- `state-canaries.mjs` — a planted defect per claim in `judgeStates`, run against the
  states check itself. Every one was seen red.
