# Retired builders

These five once produced `src/read-the-game.html`. They are kept for the record
and for one piece of source that is still worth reading — they are **not part of
the build**. `builders/build_main.py` generates the main app now.

## Why they were retired

Each of `build_v1.py`, `build_alive.py` and `build_alive2.py` carries a *complete
independent template* and writes `read-the-game.html` from scratch. Nothing
records which came last, so running an earlier one silently reverts the work of
the later ones. That is not a build chain; it is three builds racing for the same
filename.

`build_css.py` is not a generator at all. It opens the shipped HTML and prepends
a `<style>` block if one isn't already there — guarded to be idempotent, which
also makes it inert. Re-running it after any regeneration is a no-op that prints
success.

`build_alive3.py` was abandoned mid-edit. Its last line reads:

```python
base=open('_alive2_template.txt').read() if False else None
```

The `if False` means the read never runs, the missing template never causes an
error, and the script exits having written nothing. It was recorded as "broken"
in the first audit; it is actually *abandoned*, which is a different thing and
was only established by reading it. (Thanks, CHENG.)

All five also use bare relative paths — `open('rich.json')` — that assume the
flat scratch directory they were written in, so none of them can run from the
repo root regardless.

## The part still worth reading

`build_alive3.py` holds `WHY_CSS` and `WHY_JS`: the high-danger "why" popup with
its distance/angle/slot diagram, factor breakdown and rule statement. That is the
**readable source** of a feature that otherwise exists only as generated markup
inside the shipped HTML. Keep it until the popup has a real home in the module
layout, then delete this directory.

See `docs/main-app-rework.md`, findings F2–F5.
