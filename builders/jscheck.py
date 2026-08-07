#!/usr/bin/env python3
"""Parse the script a builder is about to ship, and refuse to write it if it won't run.

A self-contained artifact has no console anyone will read. A syntax error is a
blank page, and the only symptom is "it didn't work."

The builders used to write the extracted <script> to a temp file and print the
path, leaving a human to run `node --check` by hand. That is not a gate, and it
failed exactly as you would expect: an indented `import` line slipped past the
ESM stripper into a shipped bundle, and everything stayed green because nothing
ran the check.

Two details that matter:

  .cjs, deliberately. `node --check` decides module-vs-script from the file
  extension and the nearest package.json. This repo declares "type": "module",
  so checking a `.js` file inside it would PARSE ESM AS VALID and accept the
  very `import` statements we are trying to catch. Forcing `.cjs` makes the
  check mean "does this parse as a browser script", which is the actual
  question.

  Parse, don't pattern-match. Grepping for `import ` catches the forms you
  thought of. Parsing catches the ones you didn't -- indented imports, no space
  before the brace, multi-line import blocks, `export`, and anything else ESM
  that a formatter might introduce later.
"""
import pathlib, subprocess, tempfile


class JSSyntaxError(RuntimeError):
    pass


def check_script(js: str, label: str = "script") -> None:
    """Raise JSSyntaxError if `js` does not parse as a classic browser script."""
    tmp = pathlib.Path(tempfile.gettempdir()) / f"rtg.{label}.check.cjs"
    tmp.write_text(js)
    r = subprocess.run(["node", "--check", str(tmp)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        detail = (r.stderr or r.stdout).strip()
        raise JSSyntaxError(
            f"{label}: the generated script does not parse as a browser script.\n"
            f"{detail}\n"
            f"(checked as {tmp} -- .cjs forces script semantics; a .js file in this "
            f"repo would parse as ESM and accept the import statements we are "
            f"trying to catch)")
