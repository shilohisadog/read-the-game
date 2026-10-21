/**
 * While the whole-game summary is open the scoreboard reads the FINAL, whatever the
 * playhead; closing the summary hands the board back to the playhead (Kevin, 2026-10-21:
 * a summary link opened over a 0-0 pre-game board).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { rich, boot } from './helpers/page.js';

const board = d => ({ a: d.$('aSc').textContent, h: d.$('hSc').textContent,
  per: d.$('per').textContent, final: d.$('rg').classList.contains('atfinal') });

test('the summary shows the final score over a pre-game playhead, and Hide gives the board back', () => {
  const a = boot();
  const last = +a.$('scrub').max;
  const horn = a.at(last, board);
  // A second path to the final: the fixture's goals, shootout attempts aside.
  const goals = rich.events.filter(e => e.type === 'goal' && e.pt !== 'SO');
  const want = { a: goals.filter(e => e.own === rich.teams.away.id).length,
                 h: goals.filter(e => e.own === rich.teams.home.id).length };
  assert.deepEqual([+horn.a, +horn.h], [want.a, want.h], 'the board at the horn is not the final');
  assert.ok(horn.final && /^Final/.test(horn.per), 'the summary that opens itself at the horn shows no final board');
  assert.ok(want.a + want.h > 0, 'a 0-0 fixture could not tell a final board from a pre-game one');

  const pre = a.at(0, board);
  assert.doesNotMatch(pre.per, /^Final/);
  assert.equal(pre.final, false);
  a.$('sum').click();
  const open = board(a);
  assert.deepEqual([open.a, open.h], [horn.a, horn.h], 'the summary sits over a board that is not the final');
  assert.match(open.per, /^Final( · (Overtime|\dOT|Shootout))?$/);
  assert.equal(open.final, true, 'the clock, boxes and pills are not hidden');
  a.$('sum').click();
  assert.deepEqual(board(a), pre, 'Hide did not give the board back to the playhead');
  // Reopened at the horn, then left: leaving the horn closes it (app.js) and the board follows.
  a.at(last, board); a.$('sum').click();
  assert.equal(board(a).final, true);
  const mid = a.at(Math.round(last / 2), board);
  assert.equal(mid.final, false, 'the final stayed up after the summary closed');
  assert.doesNotMatch(mid.per, /^Final/);
});
