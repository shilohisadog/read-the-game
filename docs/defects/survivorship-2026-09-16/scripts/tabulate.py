"""Print every figure docs/survivorship-experiment.md quotes, from data/ alone.

    python3 docs/defects/survivorship-2026-09-16/scripts/tabulate.py

Written after the run, to make the write-up checkable. It reads only committed
files and runs nothing else; the other scripts in this folder are the engine as
it was run, with paths into a scratch directory that no longer exists.
"""
import json, collections as C
from pathlib import Path

D = Path(__file__).resolve().parent.parent / 'data'
def L(name): return [json.loads(l) for l in open(D / name) if l.strip()]
def J(name): return json.load(open(D / name))

GOLDEN = 'dom-golden.test.js'
CAUGHT = ('suite', 'build-error')

def noise(r):
    """terrain-3d screenshots are WebGL timing noise under load; a pixel-only change there is not a change."""
    return r.get('sPages') == ['terrain-3d'] and not r.get('sDom') and not r.get('sText')

def seen(r):
    return bool(r) and any(r.get(k) for k in ('sDom', 'sText', 'sPx')) and not noise(r)

fin = J('final-syntactic.json')
F = {r['id']: r for r in fin}

print('== 1. random single-token mutants, by function and outcome')
print('   seeds:', dict(C.Counter(r['id'].split('-')[0] for r in fin)), ' n =', len(fin))
by = C.defaultdict(C.Counter)
for r in fin: by[r['pop']][r['final']] += 1
for pop, c in by.items():
    n = sum(c.values()); k = sum(c[x] for x in CAUGHT)
    print(f'   {pop:10} n={n:3}  caught by suite/build {k} ({round(100*k/n)}%)  ' + '  '.join(f'{a}={b}' for a, b in sorted(c.items())))

print('\n== 2. caught by suite/build, by kind of change')
cls = C.defaultdict(C.Counter)
for r in fin: cls[r['cls']][r['final'] in CAUGHT] += 1
for k, c in sorted(cls.items()):
    print(f'   {k:10} {c[True]} of {c[True] + c[False]}')

print('\n== 3. the escapes')
for r in fin:
    if r['final'].startswith('ESCAPE'):
        print(f"   {r['id']:14} {r['file']}:{r['line']}  {r['from']!r}->{r['to']!r}  {r['final']}  {r['pubChanged'] or r.get('sPages')}")

print('\n== 4. redundancy: the ONE test file that caught it removed (39 = every seed-20260916 mutant caught by exactly one non-golden JS file)')
red = L('results-redundancy.jsonl'); probes = {r['id']: r for r in L('results-redundancy-probes.jsonl')}
out = C.defaultdict(C.Counter)
for r in red:
    base = r['id'][:-2]; p = probes.get(base + '-P') or r
    fails = [x for x in (r.get('jsFail') or []) if x != 'doc-paths.test.js']   # removing a file trips doc-paths; probed separately
    if r.get('py') not in (0, None) or [x for x in fails if x != GOLDEN]: o = 'another test still catches it'
    elif GOLDEN in fails: o = 'DOM golden only'
    elif (r.get('numChanged') or 0) > 0 or F[base].get('pubChanged'): o = 'a number changes, nothing fires'
    elif seen(p): o = 'visible in a browser, nothing fires'
    else: o = 'nothing observable in any snapshot'
    out[r['pop']][o] += 1
for pop, c in out.items(): print(f'   {pop:10} n={sum(c.values())}  ' + '  '.join(f'{a}: {b}' for a, b in c.items()))
snap = sum(c['nothing observable in any snapshot'] for c in out.values())
proven = sum(sum(c.values()) for p, c in out.items() if p != 'interpret')
print(f'   test-proven JS defects invisible to the DOM golden, 47 browser states and the numbers: {snap} of {proven}')

print('\n== 5. hand-written mutants')
hand = {m['id']: m for m in J('mutants-hand.json')['mutants']}
pub = {r['id']: r for r in L('publish-hand.jsonl')}
for r in L('results-hand.jsonl'):
    m = hand[r['id']]
    fired = [f'js:{",".join(r["jsFail"])}' if r.get('js') else '', 'py' if r.get('py') else '',
             ' '.join(k[5:] for k in r if k.startswith('gate_') and r[k])]
    fired = ' '.join(x for x in fired if x) or '-- nothing --'
    extra = f" | browser: text {r.get('textChanged')} dom {r.get('domChanged')}" if m['kind'] == 'control' else ''
    print(f"   {r['id']:5} {m['kind']:10} {fired[:90]}{extra}   ({m['note'][:70]})")

print('\n== 6. code reading of the 30 "nothing observable" (adjudicated against the code)')
adj = J('code-reading-adjudicated.json')
print('   adjudicated:', dict(C.Counter(a['adjudicated'] for a in adj)))
print('   CC exact', sum(a['cc'] == a['adjudicated'] for a in adj), 'of', len(adj),
      '· CHENG exact', sum(a['cheng'] == a['adjudicated'] for a in adj), 'of', len(adj),
      '· CC and CHENG agreed', sum(a['cc'] == a['cheng'] for a in adj))

print('\n== 7. Kevin\'s blind review')
sc = J('review-scored.json')['scored']
vis = [s for s in sc if s[3] == 'real' and s[1] != 'BC3']
ctl = [s for s in sc if s[1] == 'BC3']; null = [s for s in sc if s[3] == 'NULL']; num = [s for s in sc if s[3] == 'number']
noticed = [s for s in vis if s[7] == 'noticed']
print(f'   planted visual differences noticed: {len(noticed)} of {len(vis)}; judged the planted one wrong: {sum(s[8] == "picked planted" for s in noticed)} of {len(noticed)}')
print('   noticed, px changed:', sorted(s[2] for s in noticed), ' missed:', sorted(s[2] for s in vis if s[7] != 'noticed'))
print('   text control (BC3):', ctl[0][7], '· identical control:', null[0][5])
print('   numbers:', dict(C.Counter(s[8] for s in num)), 'of', len(num))
