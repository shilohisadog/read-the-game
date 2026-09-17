"""Is the published output POSSIBLE AT ALL? Range checks on measures.json and teams.json.

    python3 tools/published_ranges.py <dir-or-json> [...]   -> exit 1 on any violation
    python3 tools/published_ranges.py --fixtures             -> measure the committed
        test extracts with THIS checkout's code, then check what it would publish

WHERE IT RUNS (docs/test-program.md §5): `--fixtures` in `npm run gates`, so a
change to src/lib that makes the output impossible fails the commit; and on the
whole archive in derive.yml, BEFORE the sync, so it never reaches the bucket.
Re-planted 2026-09-17: 4 of the 5 escapes fail it, on the 52-game sample AND on
the 8 committed fixtures -- which is what lets the commit stage carry it.

WHY THIS EXISTS. docs/survivorship-experiment.md planted 187 one-token defects and
five of them changed the published numbers with every test green -- nothing
anywhere asserted on these two files. Three or four of the five broke something no
right answer is needed to see: a count of -4,641, a share of 8.7, a sentence
reading "NaN(n counts SHOTS FACED...", a histogram with buckets past its own max.
docs/test-program.md §3.1 calls this the RANGE kind of check: it has no witness,
and it can still fail the way this output actually broke.

WHAT IT CANNOT SEE, so green is not read as more than it is: a figure that is
wrong but possible. The fifth escape moved a correlation from 0.183 to 0.209,
and nothing here can tell.

THE RULES ARE ABOUT WHAT THE DOCUMENTS MEAN, NOT FITTED TO WHAT THEY HOLD:
  1. no string carries NaN, undefined, Infinity or [object
  2. every number is finite and >= 0 -- except a correlation `r`, in [-1, 1]
  3. a proportion {count, n}: count <= n, and a `rate` beside them IS count / n
  4. a histogram {counts}: whole non-negative counts that sum to its `n`, one
     bucket per value from `start` to `max`
  5. a row with a `share` is a row of fractions: share, blocked, missed, onGoal,
     goal each in [0, 1] or null
  6. a pace row {attempts, minutes, per60}: per60 is attempts per 60 minutes,
     within what the published rounding allows
  7. a goalie never saves more shots than he faced
"""
import json
import math
import sys
from pathlib import Path

DOCS = ('measures.json', 'teams.json')
BAD_WORDS = ('NaN', 'undefined', 'Infinity', '[object ')
SIGNED = {'r'}
FRACTION_ROW = ('share', 'blocked', 'missed', 'onGoal', 'goal')


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def check(doc, name):
    out = []

    def bad(path, msg):
        out.append(f'{name}:{".".join(map(str, path))}: {msg}')

    def walk(v, path):
        key = next((p for p in reversed(path) if isinstance(p, str)), None)
        if isinstance(v, str):
            for w in BAD_WORDS:
                if w in v:
                    bad(path, f'the string carries {w!r}: {v[:80]!r}')
        elif is_num(v):
            if not math.isfinite(v):
                bad(path, f'not a finite number: {v}')
            elif key in SIGNED:
                if not -1 <= v <= 1:
                    bad(path, f'a correlation outside [-1, 1]: {v}')
            elif v < 0:
                bad(path, f'negative: {v}')
        elif isinstance(v, list):
            for i, x in enumerate(v):
                walk(x, path + [i])
        elif isinstance(v, dict):
            rules(v, path)
            for k, x in v.items():
                walk(x, path + [k])

    def rules(d, path):
        count, n = d.get('count'), d.get('n')
        if is_num(count) and is_num(n):
            if count > n:
                bad(path, f'count {count} is more than its n {n}')
            rate = d.get('rate')
            if is_num(rate):
                if not 0 <= rate <= 1:
                    bad(path, f'rate {rate} is not a fraction')
                elif n > 0 and abs(rate - count / n) > 1e-9:
                    bad(path, f'rate {rate} is not count/n = {count / n}')
        counts = d.get('counts')
        if isinstance(counts, list):
            if not all(isinstance(c, int) and not isinstance(c, bool) and c >= 0 for c in counts):
                bad(path, 'a histogram bucket is not a whole non-negative count')
            elif is_num(n) and sum(counts) != n:
                bad(path, f'the buckets sum to {sum(counts)}, not its n {n}')
            start, mx = d.get('start'), d.get('max')
            if is_num(start) and is_num(mx) and len(counts) != mx - start + 1:
                bad(path, f'{len(counts)} buckets for the values {start}..{mx}')
        if 'share' in d:
            for k in FRACTION_ROW:
                x = d.get(k)
                if x is not None and not (is_num(x) and 0 <= x <= 1):
                    bad(path + [k], f'{x!r} in a row of fractions')
        # THE INTERVAL COMES FROM THE ROUNDING, NOT FROM A TOLERANCE THAT PASSED.
        # src/lib/census.js publishes minutes to 0.1 and per60 to 0.001, from the
        # unrounded seconds -- so per60 need only be possible for SOME minutes the
        # printed one could have been. A fixed 0.0015 failed six real rows.
        if all(is_num(d.get(k)) for k in ('attempts', 'minutes', 'per60')) and d['minutes'] > 0.05:
            lo = d['attempts'] * 60 / (d['minutes'] + 0.05) - 0.0005
            hi = d['attempts'] * 60 / (d['minutes'] - 0.05) + 0.0005
            if not lo - 1e-9 <= d['per60'] <= hi + 1e-9:
                bad(path, f'per60 {d["per60"]} is not attempts per 60 minutes (between {lo:.3f} and {hi:.3f})')
        if is_num(d.get('saves')) and is_num(d.get('faced')) and d['saves'] > d['faced']:
            bad(path, f'saves {d["saves"]} exceed shots faced {d["faced"]}')

    walk(doc, [])
    return out


def measure_fixtures():
    """Run builders/measure.mjs over test/fixtures/extracts into a scratch dir."""
    import subprocess
    import tempfile
    root = Path(__file__).resolve().parent.parent
    work = Path(tempfile.mkdtemp(prefix='ranges-'))
    (work / 'extract').symlink_to(root / 'test' / 'fixtures' / 'extracts')
    r = subprocess.run(['node', str(root / 'builders' / 'measure.mjs'), '--out', str(work)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout[-800:], r.stderr[-800:])
        sys.exit(f'::error::measure.mjs exited {r.returncode} on the committed fixtures')
    return work


def main(argv):
    if argv == ['--fixtures']:
        import shutil
        work = measure_fixtures()
        try:
            return main([str(work)])
        finally:
            shutil.rmtree(work, ignore_errors=True)
    files = []
    for a in argv:
        p = Path(a)
        files += [p / d for d in DOCS] if p.is_dir() else [p]
    if not files:
        sys.exit(__doc__)
    problems, checked = [], 0
    for f in files:
        if not f.exists():
            problems.append(f'{f}: missing -- a range check with nothing to read would pass on anything')
            continue
        try:
            doc = json.loads(f.read_text())
        except ValueError as e:
            problems.append(f'{f}: not JSON ({e})')
            continue
        checked += 1
        problems += check(doc, f.name)
    for p in problems[:40]:
        print(f'::error::{p}')
    if len(problems) > 40:
        print(f'  ...and {len(problems) - 40} more')
    if problems:
        return 1
    print(f'  published ranges: {checked} document(s), every value possible')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
