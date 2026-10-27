---
name: builders-are-the-source
description: "Read the Game: the Python builders in builders/ are the source; src/*.html is generated output. Editing the HTML directly causes builder drift — it already happened once."
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-07T08:32:25.459Z
---

**In `read-the-game`, `builders/*.py` is the source. `src/*.html` is generated output. Never hand-edit the HTML.**

**Why:** the apps are self-contained single HTML files (CSP blocks CDNs; "open the file in a browser" is the whole procedure), so the build loop is a Python builder that emits the file. During the original build the loop degraded into *regex-patching the live HTML* — quick, but each patch left the builder behind. By 2026-08-07 `build_gv.py` was the ORIGINAL generator: no seats, no cage, no player figures, no idle bob. Running it would have silently REGRESSED the goalie-eye view by ~6 rounds of work, and nothing would have flagged it. The generated file was the only copy of that work.

**How to apply:**
- Change the builder, re-run it, publish the output. If a change feels too fiddly to express in the builder, that's the signal the builder needs restructuring — not a reason to patch the HTML.
- Shared code (e.g. the player figure) lives in a Python module exporting a JS string — `builders/figures.py` — and every builder imports and inlines it. That's how single-source-of-truth works when the deliverable can't have external files.
- Each builder writes its `<script>` to a temp file and the build is followed by `node --check` on it. A self-contained artifact has no console you can see; a syntax error is a blank page. This check is the only thing standing between a typo and a dead publish. See [[hockey-legibility-build]] — I build blind, Kevin verifies pixels.
- If a builder and its output HAVE drifted, recover by extracting the current HTML back into the builder as the template (re-parameterize the embedded data with a marker), rather than re-typing it or accepting the regression.
