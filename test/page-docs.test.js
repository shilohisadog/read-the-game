/**
 * The per-page documents are an exact projection of the catalog and index:
 * every row reaches every slice it belongs to, verbatim, and nothing else does.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pageDocs, STATUS_KEYS } from '../src/lib/page-docs.js';
import { heroOf, newestOf, teamsIn } from '../src/lib/front.js';
import { differences } from '../builders/page-docs.mjs';

// A season's mix: club games in two months, a refused game, a preseason game,
// an Olympic game (country codes, out of scope), and a row whose boxscore was
// unreadable so it has no teams.
const ROWS = [
  { id: 2025010007, d: '2025-09-28', t: 1, a: 'BUF', h: 'PIT', v: 1, hl: 5 },
  { id: 2025020001, d: '2025-10-07', t: 2, a: 'BUF', h: 'PIT', v: 1, as: 2, hs: 3, hl: 12 },
  { id: 2025020002, d: '2025-10-07', t: 2, a: 'TOR', h: 'MTL', v: 0, r: 'clock' },
  { id: 2025020003, d: '2025-10-09', t: 2, a: 'PIT', h: 'TOR', v: 1, as: 1, hs: 4 },
  { id: 2025020004, d: '2025-10-09', t: 2, v: 0, r: 'boxscore' },
  { id: 2025090001, d: '2026-02-12', t: 9, a: 'CAN', h: 'USA', v: 1, hl: 4 },
];
const INDEX = { games: [{ id: 1, date: '2025-10-07', type: 2 }], lastRun: '2025-10-10T07:00:00Z',
  dataThrough: '2025-10-09', halted: null, coverage: { windowDays: 14, finalInWindow: 3 },
  archive: { games: 6 }, run: { derived: 1 } };
const docs = () => pageDocs({ games: ROWS }, INDEX);

test('every row with a team reaches each of its teams’ documents, verbatim, once', () => {
  const d = docs();
  const teams = Object.keys(d).filter(k => k.startsWith('team/'));
  assert.deepEqual(teams.sort(), ['BUF', 'CAN', 'MTL', 'PIT', 'TOR', 'USA'].map(t => `team/${t}.json`));
  let placed = 0;
  for (const k of teams) {
    const { team, games } = d[k];
    for (const g of games) {
      assert.ok(g.a === team || g.h === team, `${g.id} filed under ${team}`);
      assert.ok(ROWS.includes(g), 'a row was rebuilt rather than copied');
    }
    placed += games.length;
  }
  const expected = ROWS.reduce((n, g) => n + new Set([g.a, g.h].filter(Boolean)).size, 0);
  assert.equal(placed, expected, 'a team row was lost or duplicated');
});

test('the months partition the dated rows, verbatim', () => {
  const d = docs();
  const months = Object.keys(d).filter(k => k.startsWith('calendar/'));
  const all = months.flatMap(k => d[k].games);
  assert.equal(all.length, ROWS.length, 'a row was lost or duplicated across months');
  for (const k of months) for (const g of d[k].games) assert.equal(k, `calendar/${g.d.slice(0, 7)}.json`);
  assert.ok(all.every(g => ROWS.includes(g)));
});

test('the front door carries the selections the pages make, and the status line', () => {
  const f = docs()['front.json'];
  assert.deepEqual(f.teams, teamsIn(ROWS));
  assert.deepEqual(f.teams, ['BUF', 'MTL', 'PIT', 'TOR'], 'regular-season and playoff games name a team, refused or not');
  assert.equal(f.hero.game.id, 2025010007, 'preseason with an `hl` in the loop window is the hero');
  assert.deepEqual(f.hero, heroOf(ROWS));
  assert.equal(f.newest.id, 2025090001, 'the newest viewable game of any kind');
  assert.deepEqual(f.calendar.held, ['2025-09', '2025-10', '2026-02']);
  assert.equal(f.calendar.months.length, 6, 'September to February, the empty months included');
  assert.deepEqual(Object.keys(f.status), STATUS_KEYS);
  assert.equal(f.status.dataThrough, '2025-10-09');
  assert.equal(f.status.halted, null);
  assert.ok(!JSON.stringify(f).includes('"games":[{"id":1'), 'the index game list leaked in');
});

test('a missing index field is null, never absent and never guessed', () => {
  const f = pageDocs({ games: ROWS }, { lastRun: 'x' })['front.json'];
  assert.deepEqual(f.status, { dataThrough: null, lastRun: 'x', halted: null, coverage: null });
});

test('newestOf breaks a date tie by the higher id', () => {
  const g = newestOf([{ id: 5, d: '2025-10-01', v: 1 }, { id: 9, d: '2025-10-01', v: 1 },
                      { id: 12, d: '2025-10-01', v: 0 }]);
  assert.equal(g.id, 9);
});

test('--verify passes the written set and names a changed, missing or extra file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rtg-pagedocs-'));
  writeFileSync(join(dir, 'catalog.json'), JSON.stringify({ games: ROWS }));
  writeFileSync(join(dir, 'index.json'), JSON.stringify(INDEX));
  execFileSync('node', ['builders/page-docs.mjs', dir]);
  assert.deepEqual(differences(dir), []);
  execFileSync('node', ['builders/page-docs.mjs', '--verify', dir]);

  const buf = join(dir, 'team/BUF.json');
  writeFileSync(buf, readFileSync(buf, 'utf8').replace('"as":2', '"as":5'));
  writeFileSync(join(dir, 'team/ZZZ.json'), '{}');
  unlinkSync(join(dir, 'calendar/2026-02.json'));
  assert.deepEqual(differences(dir),
    ['differs  team/BUF.json', 'extra    team/ZZZ.json', 'missing  calendar/2026-02.json'].sort());
  assert.throws(() => execFileSync('node', ['builders/page-docs.mjs', '--verify', dir], { stdio: 'pipe' }));
});
