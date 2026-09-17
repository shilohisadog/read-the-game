"""Classify every mutant result into ONE outcome, first match wins, and tabulate.

Outcomes, in precedence order:
  build-error        the site no longer builds (a generator threw or a syntax error)
  suite              a JS or Python test that is NOT a pure change detector went red
  change-detector    only dom-golden.test.js / extract --verify went red
  extract-gate       only extract --validate / --vocab went red (interpret population)
  invariant          suites green, conservation() broke on a real published game
  ESCAPE:number      nothing above fired, and a published number changed on 52 real games
  ESCAPE:visible     nothing above fired, and a reader-visible change appeared in a real browser
  hidden-dom-only    nothing above fired; the DOM changed but nothing visible did
  no-observable      nothing changed anywhere we looked (equivalent, or unreachable in our samples)
  unobserved         Python mutant with no number/browser probe, all gates green
"""
import json, sys, collections as C

CHANGE_DETECTORS = {'dom-golden.test.js'}

def outcome(r):
    if r.get('error'): return 'engine-error'
    if r.get('build') not in (0, None): return 'build-error'
    js_real = [f for f in r.get('jsFail', []) if f not in CHANGE_DETECTORS]
    js_red = r.get('js') not in (0, None)
    if js_red and (js_real or not r.get('jsFail')): return 'suite'
    if r.get('py') not in (0, None): return 'suite'
    if js_red: return 'change-detector'
    if r.get('extract_verify') not in (0, None): return 'change-detector'
    if any(r.get(k) not in (0, None) for k in ('extract_validate', 'extract_vocab')): return 'extract-gate'
    gates = [k for k in r if k.startswith('gate_') and r[k] not in (0, None)]
    if gates: return 'gate:' + ','.join(g[5:] for g in gates)
    if r.get('invBroken'): return 'invariant'
    if r.get('pubExit') not in (0, None): return 'pipeline-alarm'
    if (r.get('numChanged') or 0) > 0 or (r.get('numThrew') or 0) > 0 or r.get('pubChanged'): return 'ESCAPE:number'
    if any((r.get(k) or 0) > 0 for k in ('textChanged','pxChanged','fullChanged','sText','sPx')): return 'ESCAPE:visible'
    if any((r.get(k) or 0) > 0 for k in ('domChanged','sDom')): return 'hidden-dom-only'
    if r.get('pop') == 'interpret' or r.get('lang') == 'py' or 'numChanged' not in r: return 'unobserved'
    return 'no-observable'

def load(p):
    return [json.loads(l) for l in open(p) if l.strip()]

def merged(main, *overlays):
    """Suite results from `main`; later files override/extend fields by id (probe re-runs, publish detector)."""
    rows = {r['id']: dict(r) for r in load(main)}
    for path in overlays:
        for o in load(path):
            if o['id'] in rows:
                for k, v in o.items():
                    if k in ('id', 'js', 'jsFail', 'jsFailCount', 'build', 'kind', 'pop', 'cls', 'file', 'line', 'from', 'to', 'note'): continue
                    rows[o['id']][k] = v
    for r in rows.values():                     # terrain-3d pixels are WebGL timing noise under load
        if r.get('sPages') == ['terrain-3d'] and not r.get('sDom') and not r.get('sText'): r['sPx'] = 0
    return list(rows.values())

if __name__ == '__main__':
    for path in sys.argv[1:]:
        rows = load(path)
        print(f'\n=== {path}  n={len(rows)}')
        by = C.defaultdict(C.Counter)
        for r in rows: by[r.get('pop', '?')][outcome(r)] += 1
        for pop, c in by.items():
            n = sum(c.values())
            print(f'  {pop:10} n={n:3}  ' + '  '.join(f'{k}={v}' for k, v in c.most_common()))
        killed = [r for r in rows if outcome(r) == 'suite']
        files = C.Counter(f for r in killed for f in r.get('jsFail', []))
        if killed:
            k = C.Counter(len(r.get('jsFail', [])) for r in killed if r.get('js'))
            print('  JS-killed mutants by number of failing test files:', dict(sorted(k.items())))
            print('  test files that killed most:', files.most_common(8))
