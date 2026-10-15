/**
 * THE WHOLE-GAME PANEL RANKS WHAT ITS LABELS SAY (Kevin's ruling 3, 2026-10-15):
 * Goaltending is each team's save percentage, Zone starts each team's
 * offensive-zone face-offs. Expected values come from a second path wherever one
 * exists: saves from the league's boxscore rows, zone starts from the box above
 * the rink.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot, rich } from './helpers/page.js';
import { measureGame } from '../builders/measure.mjs';
import { perTeamGame } from '../src/lib/archive.js';

const MEASURES = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url), 'utf8'));
const year = String(rich.game.id).slice(0, 4);
const away = rich.teams.away.id, home = rich.teams.home.id;
const ab = { [away]: rich.teams.away.ab, [home]: rich.teams.home.ab };

/** The boxscore's saves and shots faced, summed by the goaltender's team. */
function boxscoreSaves() {
  const out = { [away]: { s: 0, f: 0 }, [home]: { s: 0, f: 0 } };
  for (const [pid, [s, f]] of Object.entries(rich.quoted.players.goalies)) {
    const t = rich.roster[pid].tid; out[t].s += s; out[t].f += f;
  }
  return out;
}

function rowsAtHorn(rates) {
  const a = boot(rich, rates);
  const s = a.$('scrub'); s.value = String(s.max);
  s.oninput({ target: { value: s.value } });
  const ul = (a.$('sumBody')._kids || []).find(n => n.className === 'srows');
  const rows = (ul._kids || []).map(li => ({
    text: (li._kids[0].innerHTML || '').replace(/<[^>]+>/g, ''),
    rail: (li._kids || []).some(k => k.className === 'sscale'),
    ends: ((li._kids || []).find(k => k.className === 'sscale')?._kids || [])
      .find(k => k.className === 'sends')?._kids?.map(k => k.textContent) || [] }));
  return { a, rows, row: label => rows.find(r => r.text.startsWith(label)) };
}

test('the per-game record carries each side’s saves, matching the league’s boxscore', () => {
  const m = measureGame(rich), box = boxscoreSaves();
  const side = { h: home, a: away };
  for (const k of ['h', 'a']) {
    assert.equal(m.saves[k], box[side[k]].s, `${k} saves`);
    assert.equal(m.faced[k], box[side[k]].f, `${k} shots faced`);
  }
});

test('the save-percentage class is whole percents, and says so', () => {
  const recs = [{ id: 2025020001, date: '2025-10-08', saves: { h: 27, a: 20 }, faced: { h: 30, a: 25 }, oz: { h: 9, a: 4 } },
                { id: 2025020002, date: '2025-10-09', saves: { h: 0, a: 31 }, faced: { h: 0, a: 33 }, oz: { h: 7, a: 7 } }];
  const c = perTeamGame(recs)['2025'];
  assert.equal(c.savePct.suffix, '%');
  assert.equal(c.savePct.n, 3, 'a side that faced no shot is left out, not counted as 0%');
  assert.deepEqual([c.savePct.min, c.savePct.max], [80, 94]);   // 20/25, 31/33
  assert.equal(c.ozStarts.n, 4);
  assert.deepEqual([c.ozStarts.min, c.ozStarts.max], [4, 9]);
  assert.ok(!('goaltending' in c) && !('zonestart' in c), 'the old classes under the lens ids are gone');
});

test('⛔ Goaltending ranks each team’s save percentage, from the boxscore’s own saves', () => {
  const pt = perTeamGame([measureGame(rich)]);
  const { row } = rowsAtHorn({ ...MEASURES, perTeamGame: pt });
  const g = row('Goaltending');
  const box = boxscoreSaves();
  const want = t => `${ab[t]} ${Math.round((100 * box[t].s) / box[t].f)}%`;
  assert.ok(g.text.includes(want(away)) && g.text.includes(want(home)), g.text);
  assert.ok(!/whole game/.test(g.text), 'Goaltending is no longer a game total');
  assert.ok(g.rail, 'the row draws its scale');
  assert.ok(g.ends.every(e => e.endsWith('%')), `the scale's ends carry the unit: ${g.ends}`);
});

test('⛔ Zone starts ranks the offensive-zone face-offs the box above the rink shows', () => {
  const pt = perTeamGame([measureGame(rich)]);
  const { a, row } = rowsAtHorn({ ...MEASURES, perTeamGame: pt });
  a.$$('#rg .pk').find(c => c.dataset && c.dataset.l === 'zonestart').click();
  const boxA = a.$('lxA').textContent, boxH = a.$('lxH').textContent;
  assert.equal(a.$('lxK').textContent, 'OFFENSIVE-ZONE STARTS');
  const z = row('Zone starts');
  assert.ok(z.text.includes(`${ab[away]} ${boxA}`) && z.text.includes(`${ab[home]} ${boxH}`),
    `panel "${z.text}" vs box ${boxA}/${boxH}`);
});

test('a published document without the new classes draws those two rows with no scale', () => {
  const old = { ...MEASURES, perTeamGame: { [year]: { corsi: MEASURES.perTeamGame?.[year]?.corsi } } };
  const { row } = rowsAtHorn(old);
  for (const label of ['Goaltending', 'Zone starts']) {
    const r = row(label);
    assert.ok(r, `${label} row`);
    assert.ok(!r.rail, `${label} must not be drawn on another quantity's scale`);
    assert.ok(!/whole game/.test(r.text), `${label} must not fall back to the game total`);
  }
});
