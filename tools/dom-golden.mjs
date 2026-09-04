/**
 * THE RENDERED PAGE, FRAME BY FRAME, AS A FIXTURE — the safety argument for
 * decomposing `boot()`.
 *
 * ⛔ WHY IT HAD TO EXIST. Step 1 was safe because `build_main.py --verify` proved
 * the artifact did not change: the refactor was a provable no-op, so the suite
 * was confirming rather than protecting. **Moving a cluster out of `boot` changes
 * the bytes by construction**, so step 2 cannot inherit that argument and must
 * not be run as though it could. This replaces *byte-identical source* with
 * *byte-identical output*, which is the property anyone actually cares about.
 *
 * ⭐ THE PRECEDENT IS THIS REPO'S OWN, AND IT WORKED. `test/fixtures/phase1-golden.json`
 * was captured from the shipped implementation before the layer extraction moved
 * any code, pinning every tally at every scrubber position. CHENG's condition for
 * step 2 was the same one that fixture already embodies: capture at EVERY
 * playhead position, not one. A refactor that lands the right final DOM through a
 * different intermediate one is a real regression when the intermediate is the
 * product — and this page's product is the intermediate.
 *
 * ⚠️ WHAT IT CANNOT SEE, so green is not read as more than it is. The fake
 * document has no CSS and no layout, so nothing about size, position or
 * `display:none` reaches it. CHENG's own note on the boundary: the failures this
 * misses — a stylesheet stranding an element the script correctly wrote — are
 * caused by editing the stylesheet, and step 2 does not edit the stylesheet.
 * `tools/pixels.sh` and the browser step in `deploy.yml` own that risk.
 *
 * ⚠️ AND IT IS A CHANGE DETECTOR, NOT A CORRECTNESS CLAIM. A deliberate change to
 * what the page renders makes this red, correctly, and is accepted by
 * regenerating. **Regenerating without reading what moved is how this guard
 * dies**, so the writer prints the elements and frames that changed rather than
 * rewriting in silence.
 *
 *   node tools/dom-golden.mjs           regenerate, reporting what moved
 *   node tools/dom-golden.mjs --check   compare only, non-zero on difference
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { boot } from '../test/helpers/page.js';
import { LAYER_TOKENS } from '../src/lib/deeplink.js';

export const FIXTURE = new URL('../test/fixtures/dom-golden.json', import.meta.url);

const h = s => createHash('sha256').update(s).digest('hex').slice(0, 12);

/**
 * One element's whole observable state, hashed.
 *
 * Everything the fake records and the page can write: markup, text, classes,
 * form value, and the three attributes the controls carry. A field left out here
 * is a field a refactor could change without this noticing, which is why the
 * list is written out rather than taken from `Object.keys` — a fake that gains a
 * field should make someone decide whether it belongs, not silently widen the
 * check.
 */
const state = el => h(JSON.stringify([
  el._html, el._text, [...el.classList._c].sort(), el.value,
  el.hidden ?? null, el.disabled ?? null, el.getAttribute('aria-pressed'),
]));

/**
 * The whole game, every scrubber position.
 *
 * Elements that never change across the game are stored once rather than 269
 * times — 55 of the 86 are constant, and a fixture that repeats them is 3.1 MB
 * of noise around 127 KB of signal. The shape says which is which, so a constant
 * that starts varying is as loud as a value that moves.
 */
export function capture() {
  const a = boot(null, null, '');
  const frames = a.every(d => {
    const o = {};
    for (const [id, el] of d.byId) o[id] = state(el);
    return o;
  });
  const el = fold(frames);
  return { frames: frames.length, elements: Object.keys(el).length, el,
           popup: popupPass(), layers: layerPass(el), controls: controlPass(el) };
}

/**
 * ⛔⛔ THE WALK COVERS ONE POINT IN A SPACE OF CONTROLS, AND THE REST OF THE SPACE
 * CONTAINS BRANCHES NOTHING HAS EVER EXECUTED.
 *
 * Third time the same discovery, so it is stated as a rule rather than fixed
 * again: `#whyContent` was missing because it opens on a CLICK, `#workBody`
 * because it opens on a CHOICE, and these because they need a control MOVED off
 * its default. **A default boot is one point; every control multiplies the space
 * and the walk visits none of the other points.**
 *
 * Concretely, in the marks loop inside `render`: `if (trails==='off' && k!==i)
 * continue;` and `if (ASPLAYED && trails==='all' && e.per!==cur.per) continue;`.
 * The second line has never run in this fixture. `?ends=fixed` moves every mark
 * on the ice, and `?strength=even` changes what the ledger admits.
 *
 * ⚠️ AXES, NOT COMBINATIONS, AND THE DIFFERENCE IS STATED SO GREEN IS NOT READ AS
 * MORE THAN IT IS. Each control is moved off its default ON ITS OWN. Two controls
 * interacting — even strength WITH trails accumulating, at fixed ends — is not
 * covered, and would be 2x2x2x6 walks rather than a handful. What this catches is
 * a branch that never executes; what it does not catch is a branch that only
 * misbehaves in company.
 */
function controlPass(base) {
  const out = {};
  const walks = {
    'trails=all': () => { const a = boot(null, null, ''); a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click(); return a; },
    'strength=even': () => boot(null, null, '?strength=even'),
    'ends=fixed': () => boot(null, null, '?ends=fixed'),
  };
  for (const [name, mk] of Object.entries(walks)) {
    const a = mk();
    const frames = a.every(d => {
      const o = {};
      for (const [id, el] of d.byId) o[id] = state(el);
      return o;
    });
    const full = fold(frames), el = {};
    for (const [id, v] of Object.entries(full))
      if (JSON.stringify(v) !== JSON.stringify(base[id])) el[id] = v;
    out[name] = { frames: frames.length, el };
  }
  return out;
}

/** Per-element hashes, storing the unchanging ones once instead of 269 times. */
function fold(frames) {
  const out = {};
  for (const id of [...new Set(frames.flatMap(Object.keys))].sort()) {
    const col = frames.map(f => f[id] ?? '-');
    out[id] = new Set(col).size === 1 ? col[0] : col;
  }
  return out;
}

/**
 * ⛔⛔ THE WHOLE LAYER SYSTEM WAS OUTSIDE THIS FIXTURE, AND THE PANEL IT GUARDS
 * IS THE ONE SURFACE THIS PROJECT'S PROMISE RESTS ON.
 *
 * The base walk boots with no layer selected, so `whichPick()` answers `none`:
 * `#workBody` was never written at all, and the layer box under the rink —
 * `#lxA`, `#lxK`, `#lxH`, `#lxN` — held one value for all 269 frames. Five
 * layers times 269 frames is 1,345 renderings of the show-me-the-work panel,
 * every one of them unguarded, in a fixture that already claimed to pin what the
 * page draws.
 *
 * Second time the same way. `#whyContent` was missing because it opens on a
 * click; this is missing because it opens on a CHOICE. ⭐ The rule generalises
 * past interaction: **a walk covers the state it was booted into, and nothing
 * else.** A default boot is a single point in a space of options.
 *
 * The layer vocabulary comes from `deeplink.js`, which derives it from the layer
 * objects themselves — so a sixth layer is captured the day it exists rather
 * than the day somebody remembers to add it to a list here.
 */
function layerPass(base) {
  const out = {};
  for (const layer of LAYER_TOKENS) {
    const a = boot(null, null, `?layer=${layer}`);
    a.$('work').click();                       // the panel has no deep-link key
    const frames = a.every(d => {
      const o = {};
      for (const [id, el] of d.byId) o[id] = state(el);
      return o;
    });
    /* ⭐ STORED AS A DELTA AGAINST THE BASE WALK, and the reason is legibility
       before size. About 85% of every layer walk is identical to the base -- a
       layer changes what is ON the ice and in the panel, not the scoreboard or
       the clock -- so a full capture is 855 KB in which the interesting 15% is
       invisible. As a delta each layer's entry is a list of exactly the elements
       that layer moves: thirteen to seventeen of eighty-eight, readable in the
       fixture itself. An element that stops differing disappears from the delta,
       and the key comparison catches that too. */
    const full = fold(frames), el = {};
    for (const [id, v] of Object.entries(full))
      if (JSON.stringify(v) !== JSON.stringify(base[id])) el[id] = v;
    out[layer] = { frames: frames.length, el };
  }
  return out;
}

/**
 * ⛔⛔ A SCRUBBER WALK DOES NOT TOUCH A SURFACE THAT OPENS ON A CLICK, AND THE
 * FIRST VERSION OF THIS FILE DID NOT NOTICE.
 *
 * `#whyContent` was **absent from the walk entirely** — 269 frames, 86 elements,
 * and the why-popup's markup was written by none of them, because it renders only
 * when a viewer clicks a slot shot. So the golden was about to be offered as the
 * safety argument for extracting the very cluster it gave zero coverage of.
 *
 * That is the canary distinction exactly: the ruler was working and the subject
 * was never measured. **The general rule this earns: every surface that opens on
 * an interaction needs its own pass, and a walk that only drags the scrubber must
 * not be described as covering the page.** The work panel and the layer controls
 * are the same shape and will each need one.
 *
 * The pass needs `?layer=slot`, because the handler is
 * `if (hdOn && isHD(EV[k])) showWhy(k)` — with the layer off, every click is a
 * no-op and a capture taken that way would be 269 recorded silences.
 */
function popupPass() {
  const a = boot(null, null, '?layer=slot');
  const events = a.$('events'), content = a.$('whyContent'), back = a.$('whyBk');
  const at = {};
  const n = a.every(() => 0).length;      // scrubber positions, read from the page
  let rendered = 0;
  for (let k = 0; k < n; k++) {
    a.at(k, () => {});
    const before = content.writes;
    for (const fn of events._on.click || []) fn({ target: { dataset: { i: String(k) } } });
    /* `writes` rather than the backdrop's class: nothing ever CLOSES the popup
       during this pass, so `whyBk` stays `on` after the first open and would
       report every later click as a render. The write is the signal itself —
       the same correction `innerHTML`'s write counter records in page.js. */
    if (content.writes > before) { at[k] = state(content) + '/' + state(back); rendered++; }
  }
  return { clicks: n, rendered, at };
}

/** Every (element, frame) where two captures disagree. */
export function differences(gold, made) {
  const out = [];
  const ids = [...new Set([...Object.keys(gold.el), ...Object.keys(made.el)])].sort();
  for (const id of ids) {
    const g = gold.el[id], m = made.el[id];
    if (g === undefined) { out.push({ id, at: null, was: '(absent)', now: 'present' }); continue; }
    if (m === undefined) { out.push({ id, at: null, was: 'present', now: '(absent)' }); continue; }
    const ga = Array.isArray(g), ma = Array.isArray(m);
    if (!ga && !ma) { if (g !== m) out.push({ id, at: 'all frames', was: g, now: m }); continue; }
    const n = Math.max(ga ? g.length : gold.frames, ma ? m.length : made.frames);
    for (let k = 0; k < n; k++) {
      const a = ga ? g[k] : g, b = ma ? m[k] : m;
      if (a !== b) { out.push({ id, at: k, was: a, now: b }); break; }   // first frame only
    }
  }
  /* AND THE INTERACTION PASS. Left out of the first version, which would have
     made the popup's coverage decorative: captured, stored, never compared. */
  const g = gold.popup || { at: {} }, m = made.popup || { at: {} };
  if (g.rendered !== m.rendered)
    out.push({ id: 'whyContent', at: 'renders', was: `${g.rendered} clicks rendered`,
               now: `${m.rendered} clicks rendered` });
  for (const k of [...new Set([...Object.keys(g.at), ...Object.keys(m.at)])].sort((x, y) => x - y))
    if (g.at[k] !== m.at[k]) {
      out.push({ id: 'whyContent', at: `click ${k}`, was: g.at[k] ?? '(no render)', now: m.at[k] ?? '(no render)' });
      break;
    }

  /* AND EVERY LAYER'S OWN WALK. Compared per layer so a message names which one
     moved -- "the work panel changed" over five layers is a sentence a reader
     then has to go and disambiguate by hand. */
  for (const [kind, gw, mw] of [['layer', gold.layers || {}, made.layers || {}],
                               ['control', gold.controls || {}, made.controls || {}]])
    for (const name of [...new Set([...Object.keys(gw), ...Object.keys(mw)])].sort()) {
      if (!gw[name]) { out.push({ id: `${kind}:${name}`, at: null, was: '(not captured)', now: 'present' }); continue; }
      if (!mw[name]) { out.push({ id: `${kind}:${name}`, at: null, was: 'present', now: '(not captured)' }); continue; }
      for (const d of elementDiffs(gw[name], mw[name])) out.push({ ...d, id: `${name}/${d.id}` });
    }
  return out;
}

/** Element-by-element difference between two folded walks. */
function elementDiffs(gold, made) {
  const out = [];
  for (const id of [...new Set([...Object.keys(gold.el), ...Object.keys(made.el)])].sort()) {
    const g = gold.el[id], m = made.el[id];
    if (g === undefined) { out.push({ id, at: null, was: '(absent)', now: 'present' }); continue; }
    if (m === undefined) { out.push({ id, at: null, was: 'present', now: '(absent)' }); continue; }
    const ga = Array.isArray(g), ma = Array.isArray(m);
    if (!ga && !ma) { if (g !== m) out.push({ id, at: 'all frames', was: g, now: m }); continue; }
    const n = Math.max(ga ? g.length : gold.frames, ma ? m.length : made.frames);
    for (let k = 0; k < n; k++) {
      const a = ga ? g[k] : g, b = ma ? m[k] : m;
      if (a !== b) { out.push({ id, at: k, was: a, now: b }); break; }
    }
  }
  return out;
}

export const read = () => JSON.parse(readFileSync(FIXTURE, 'utf8'));

if (import.meta.url === `file://${process.argv[1]}`) {
  const made = capture();
  const check = process.argv.includes('--check');
  if (!existsSync(FIXTURE)) {
    if (check) { console.error('::error::no golden fixture — run `node tools/dom-golden.mjs`'); process.exit(1); }
    writeFileSync(FIXTURE, JSON.stringify(made));
    console.log(`  golden written: ${made.frames} frames, ${made.elements} elements`);
    process.exit(0);
  }
  const diff = differences(read(), made);
  if (!diff.length) { console.log(`  rendered DOM unchanged: ${made.frames} frames, ${made.elements} elements`); process.exit(0); }
  const lines = diff.map(d => `    #${d.id}  ${d.at === null ? '' : `frame ${d.at}`}  ${d.was} -> ${d.now}`);
  if (check) {
    console.error(`::error::the rendered DOM changed at ${diff.length} element(s) — `
      + 'if that was deliberate, run `node tools/dom-golden.mjs` and read what it prints');
    console.error(lines.join('\n'));
    process.exit(1);
  }
  console.log(`  ${diff.length} element(s) changed — READ THIS BEFORE COMMITTING:`);
  console.log(lines.join('\n'));
  writeFileSync(FIXTURE, JSON.stringify(made));
  console.log('  golden rewritten.');
}
