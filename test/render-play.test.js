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
