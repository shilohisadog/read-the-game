"""One statement of each measurement — builders/*.

⛔⛔ WRITTEN BECAUSE FOUR OF THEM WERE WRITTEN OUT TWICE AND THE WORDS HAD ALREADY
DRIFTED. The front-door strip said *"A shot FROM inside the slot goes in 11.4% of
the time"* while the card that proves it said *"A shot TAKEN FROM inside the slot
goes in 11.4% of the time"*, and the same pair existed for shift length, score
effects and zone starts — thirteen figure placeholders across four measurements,
each typed into two separately authored sentences.

⭐ THE NUMBERS WERE NEVER THE EXPOSURE, AND THAT IS WHY NOBODY SAW IT. Both sides
substitute `__SLOT_IN_PCT__` and the rest out of the same published measurement,
so the figures could not disagree and `tools/measures_fresh.py` had them covered.
What was free to drift was the SENTENCE, which is the half no guard watched.
`build_index.py` even carried the rule in a comment — the strip "may only state
figures its card already states" — as an intention enforced by nobody.

⭐⭐ WHAT THIS PROVES, EXACTLY: every figure placeholder that `_archive()` defines
is written into prose at exactly ONE site across every builder. Not that the
prose is right, and not that the figure is fresh — those are other files' jobs.
Only that there is one copy, so there is nothing to drift against.

⭐⭐ AND IT COUNTS ONLY INSIDE STRING LITERALS, WHICH IS NOT A DETAIL. The first
draft counted raw text and went red on its own fix: the comment in
`build_index.py` explaining the collapse NAMES `__SLOT_IN_PCT__`, and a prose
mention is not a second statement of the figure. The same shape broke the
wall-clock guard in `test/fixtures.test.js` this morning — a check tripping over
the words that describe it. Python ships `tokenize`, so for `.py` there is no
hand-rolled scanner and no guessing: a use site is an occurrence inside a STRING
token, which is exactly what a placeholder is. `.mjs` has no such luxury and gets
the line classifier instead, for the reason recorded in `fixtures.test.js`:
deciding whether `/` opens a regex or divides is the one thing a hand-rolled
scanner cannot do, so it never tries.

⭐⭐ AND A NAME IS NOT A STATEMENT, WHICH THIS LEARNED THE HARD WAY ON 24
SEPTEMBER 2026. `FIGURE_DERIVATION` in `build_index.py` maps every placeholder to
the derivation that explains it, so every figure suddenly appeared in two string
literals and this went red across the board — while nothing had been written
twice. The rule was always about the SENTENCE; counting string literals was the
proxy, and the proxy broke the first time a placeholder was used as a key. So a
placeholder is STATED only where the string around it says something else too. A
string that is nothing but the placeholder is a reference — a dict key, a lookup,
an argument to `replace` — and references are what a single statement is reached
BY.

⚠️ ITS TWO LIMITS, STATED. A measurement spelled out by hand rather than through
a placeholder is invisible here — the mechanism is the placeholder, so anything
bypassing it bypasses this too. And a placeholder used once inside a function two
surfaces call would pass while printing twice, which is right: that is one
statement, rendered twice, which is the thing we want.
"""
import io
import re
import tokenize
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILDERS = sorted(
    p for p in (ROOT / "builders").iterdir()
    if p.is_file() and p.suffix in (".py", ".mjs", ".js")
)


def _strings(path):
    """Every string literal in a builder, comments excluded by construction.

    `.py` goes through the language's own tokenizer. `.mjs` cannot — see the
    module docstring — so a line counts unless it opens with comment prose.
    """
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".py":
        with io.open(path, "rb") as fh:
            return [t.string for t in tokenize.tokenize(fh.readline)
                    if t.type == tokenize.STRING]
    return [ln for ln in text.split("\n") if not re.match(r"\s*(\*|//|/\*)", ln)]


def _stated(literal, token):
    """How many times this string STATES `token`, as opposed to naming it.

    ⛔ THE DISTINCTION IS THE WHOLE RULE. `"__ZONE_ATK__"` as a dict key is how a
    map reaches the one statement; `"the club takes __ZONE_ATK__ attempts"` IS a
    statement. Counting both made this test red the day a door map was added, with
    nothing written twice — a check whose proxy had drifted from its claim.

    ⚠️ IT ASKS FOR TWO LETTERS TOGETHER, not for any character. A key written with
    a trailing comma, a colon or a space is still just a name.
    """
    if token not in literal:
        return 0
    rest = literal.replace(token, " ")
    return literal.count(token) if re.search(r"[A-Za-z]{2}", rest) else 0


def _archive_body():
    """The source of `_archive()` in build_index.py, where the figures are defined."""
    lines = (ROOT / "builders" / "build_index.py").read_text(encoding="utf-8").split("\n")
    start = next(i for i, ln in enumerate(lines) if ln.startswith("def _archive"))
    end = next(i for i in range(start + 1, len(lines))
               if lines[i] and not lines[i][0].isspace() and not lines[i].startswith("#"))
    return "\n".join(lines[start:end])


class OneStatement(unittest.TestCase):

    def test_the_extraction_found_the_figures(self):
        """⭐ Go red if the scan finds nothing, rather than passing over an empty set.

        `_archive()` is located by name and its end by the next top-level line. A
        rename or a reshape makes both lookups return something harmless-looking,
        and every assertion below would then be about zero placeholders.
        """
        keys = set(re.findall(r'"(__[A-Z0-9_]+__)"\s*:', _archive_body()))
        self.assertGreaterEqual(
            len(keys), 15,
            f"only {len(keys)} figure placeholders found in _archive() — the scan "
            "is looking at the wrong text, so nothing below proves anything")
        self.assertIn("__SLOT_IN_PCT__", keys)

    def test_no_measurement_is_stated_twice(self):
        body = _archive_body()
        keys = sorted(set(re.findall(r'"(__[A-Z0-9_]+__)"\s*:', body)))
        strings = {p: _strings(p) for p in BUILDERS}
        sources = {p: p.read_text(encoding="utf-8") for p in BUILDERS}

        # ⛔ TWO QUESTIONS, TWO COUNTS, AND CONFLATING THEM IS WHAT BROKE THIS.
        # "Is it written out twice?" is about PROSE — two sentences free to
        # drift. "Is it printed by nothing?" is about the sites that PRINT it,
        # which are prose plus one other form: `__ARCHIVE_GAMES__` is reached by
        # a direct `arch["__ARCHIVE_GAMES__"]` lookup rather than by
        # substitution, and that is a perfectly good way to print a figure and no
        # kind of second statement.
        #
        # ⛔⛔⛔ AND THE FIRST FIX FOR THAT MADE THE SECOND CHECK UNFALSIFIABLE.
        # It counted ANY reference in a string literal, and `FIGURE_DERIVATION`
        # now names every placeholder — so every figure had a reference forever,
        # and "printed by nothing" could not fire again in any condition this
        # suite runs under. Found by deleting a card's only sentence and watching
        # it stay green. A door map is a reference; only prose and a subscript
        # PRINT.
        sites, used = {}, {}
        for k in keys:
            sites[k] = sum(_stated(s, k) for ss in strings.values() for s in ss)
            defined = len(re.findall(rf'"{k}"\s*:', body))
            self.assertEqual(defined, 1,
                             f"{k} is not defined exactly once in _archive()")
            used[k] = sites[k] + sum(len(re.findall(rf'\[\s*"{k}"\s*\]', src))
                                     for src in sources.values())

        twice = {k: n for k, n in sites.items() if n > 1}
        self.assertEqual(
            twice, {},
            "a measurement is written out more than once, so the two copies are "
            "free to drift in wording while their figures stay identical — which "
            "is exactly how the slot sentence came to exist in two versions. "
            "Quote FIGURE_CLAUSE from both surfaces instead: " + repr(twice))

        never = [k for k, n in used.items() if n == 0]
        self.assertEqual(
            never, [],
            "a figure is derived from the archive and printed by nothing. Either a "
            "surface lost its sentence or the placeholder outlived it: " + repr(never))


if __name__ == "__main__":
    unittest.main()
