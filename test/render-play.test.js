/**
 * The play line under the ice (#playline): what the replay says about the play so far.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers/page.js';

test('the line runs during a play and sums the last one up at the faceoff', () => {
  const a = boot();
  const frames = a.every((d, f) => ({ type: f.ev && f.ev.type, per: f.ev && f.ev.per,
    line: d.$('playline').textContent, none: d.$('playd').classList.contains('none') }));
  let running = 0, last = 0;
  frames.forEach((f, k) => {
    assert.equal(f.none, !f.line, `frame ${k}: the row shows with nothing in it, or hides a line`);
    if (/^This play/.test(f.line)) { running++; assert.notEqual(f.type, 'faceoff', `frame ${k}`); }
    if (/^Last play/.test(f.line)) {
      last++;
      assert.equal(f.type, 'faceoff', `frame ${k}: a finished play summed up away from the restart`);
      assert.match(f.line, / · ended: /, `frame ${k}: no ending`);
    }
  });
  assert.ok(running > 50 && last > 20, `walked ${running} running and ${last} finished lines`);
  // The first faceoff of a period has no play before it in that period.
  frames.forEach((f, k) => { if (f.type === 'faceoff' && (k === 0 || frames[k - 1].per !== f.per))
    assert.equal(f.line, '', `frame ${k}: summed up a play from another period`); });
});

test('the line is not on the front door preview', () => {
  const a = boot(null, null, '?preview=1');
  a.every(d => assert.equal(d.$('playline').textContent, ''));
});

test('a zone stretch leads the line exactly when its marks stand out, and holds three or more', () => {
  const a = boot();
  const frames = a.every(d => ({ line: d.$('playline').textContent,
    inzone: new Set([...d.$('events').innerHTML.matchAll(/class="ev [^"]*\binzone\b[^"]*" data-i="(\d+)"/g)].map(m => m[1])).size }));
  let zone = 0;
  frames.forEach((f, k) => {
    const m = /^In the .*?: (\d+) events in a row/.exec(f.line);
    if (m) { zone++; assert.equal(f.inzone, +m[1], `frame ${k}: the line says ${m[1]} in a row, the ice shows ${f.inzone}`);
             assert.ok(+m[1] >= 3, `frame ${k}: a stretch of ${m[1]}`); }
    else assert.equal(f.inzone, 0, `frame ${k}: marks stand out with no stretch in the line`);
  });
  assert.ok(zone > 20, `only ${zone} zone frames walked`);
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
