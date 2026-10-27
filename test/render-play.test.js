/**
 * The play line under the ice (#playline): what the replay says about the play so far.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, app } from './helpers/page.js';

test('the line carries the color note for its frame, and is hidden without one', () => {
  const a = boot();
  const frames = a.every(d => ({ line: d.$('playline').textContent, none: d.$('playd').classList.contains('none') }));
  frames.forEach((f, k) => assert.equal(f.none, !f.line, `frame ${k}: the row shows with nothing in it, or hides a note`));
  const said = frames.filter(f => f.line);
  // A broadcast's color analyst speaks in the gaps: some frames, never all of them.
  assert.ok(said.length > 30 && said.length < frames.length * 0.7,
    `${said.length} of ${frames.length} frames carry a note`);
  assert.ok(said.every(f => !/^This play|^Last play/.test(f.line)), 'the old play summary is still on screen');
});

test('the line is not on the front door preview', () => {
  const a = boot(null, null, '?preview=1');
  a.every(d => assert.equal(d.$('playline').textContent, ''));
});

test('a note that counts events in a row agrees with the marks that stand out on the ice', () => {
  const a = boot();
  const frames = a.every(d => ({ line: d.$('playline').textContent,
    inzone: new Set([...d.$('events').innerHTML.matchAll(/class="ev [^"]*\binzone\b[^"]*" data-i="(\d+)"/g)].map(m => m[1])).size }));
  let checked = 0;
  frames.forEach((f, k) => {
    if (f.inzone) assert.ok(f.inzone >= 3, `frame ${k}: ${f.inzone} marks stand out, fewer than a stretch`);
    const m = /stayed in the .*? for (\d+) events in a row/.exec(f.line);
    if (!m) return;
    checked++;
    assert.equal(f.inzone, +m[1], `frame ${k}: the note says ${m[1]} in a row, the ice shows ${f.inzone}`);
  });
  assert.ok(checked > 10, `only ${checked} counted notes walked`);
});

test('the line\'s state classes are its own: no other rule on the page can restyle it', async () => {
  // Defect, 2026-10-15: the zone line was toggled `zone`, which is the layer panels'
  // class, so it was drawn as a panel — left-aligned, bordered, with a ▼.
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const js = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const toggled = [...js.matchAll(/d\.classList\.toggle\('([a-z-]+)'/g)].map(m => m[1]);
  assert.ok(toggled.includes('zoned') && toggled.includes('none'), `toggles found: ${toggled}`);
  for (const c of toggled) {
    const rules = [...css.matchAll(new RegExp(`[^{}]*\\.${c}\\b[^{}]*\\{`, 'g'))].map(m => m[0].trim());
    for (const r of rules) for (const sel of r.replace('{', '').split(',')) {
      if (!new RegExp(`\\.${c}\\b`).test(sel)) continue;
      // Either it names the line, or it only reaches inside another element.
      assert.ok(/\.playd/.test(sel) || new RegExp(`\\S\\s+\\.${c}\\b`).test(sel.replace(/^#rg\s+/, '')),
        `"${sel.trim()}" can restyle the play line through .${c}`);
    }
  }
});

test('the color line does not open a source note', () => {
  // The disclosure described the site, not the event, so the event view no longer carries it.
  assert.match(app, /id="playline"/);
  assert.doesNotMatch(app, /<details class="playd"|id="playwork"|Each note comes from|Where these notes come from/);
});
