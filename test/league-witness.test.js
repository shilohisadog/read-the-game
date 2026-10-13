/**
 * tools/league-witness.mjs counts each disagreement with its direction. The
 * league side here is built from our own figures and then moved, so this tests
 * the comparator, not whether we agree with the league.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compare } from '../tools/league-witness.mjs';
import { measureGame } from '../builders/measure.mjs';

const G = JSON.parse(readFileSync(new URL('./fixtures/extracts/2025020501.json', import.meta.url), 'utf8'));

function leagueFromOurs(g) {
  const m = measureGame(g);
  const skaters = Object.fromEntries(m.players.map(r =>
    [String(r.p), { goals: r.g, assists: r.a, sog: r.s, powerPlayGoals: 0 }]));
  const goalies = Object.fromEntries(m.goalies.map(k =>
    [String(k.pid), { saves: k.saves, shotsAgainst: k.faced }]));
  return { skaters, goalies };
}

test('identical figures report no disagreement', () => {
  const by = compare({ [G.game.id]: leagueFromOurs(G) }, [G]);
  const yr = String(G.game.id).slice(0, 4);
  for (const fig of ['goals', 'assists', 'sog', 'saves', 'shotsAgainst']) {
    assert.equal(by[yr][fig].gamesOff, 0, `${fig} disagreed with itself`);
    assert.ok(by[yr][fig].rows > 0, `${fig} compared no rows`);
  }
});

test('a planted disagreement is counted once, with its sign', () => {
  const L = leagueFromOurs(G);
  const pid = Object.keys(L.skaters)[0];
  L.skaters[pid].assists += 2;                       // league higher -> ours under
  const gk = Object.keys(L.goalies)[0];
  L.goalies[gk].shotsAgainst -= 1;                   // league lower -> ours over
  const by = compare({ [G.game.id]: L }, [G]);
  const yr = String(G.game.id).slice(0, 4);
  assert.deepEqual([by[yr].assists.gamesOff, by[yr].assists.under, by[yr].assists.over], [1, 1, 0]);
  assert.deepEqual([by[yr].shotsAgainst.gamesOff, by[yr].shotsAgainst.over], [1, 1]);
  assert.equal(by[yr].goals.gamesOff, 0, 'an untouched figure was flagged');
});

test('a league row without the field is not compared', () => {
  const L = leagueFromOurs(G);
  const pid = Object.keys(L.skaters)[0];
  delete L.skaters[pid].goals;
  const before = compare({ [G.game.id]: leagueFromOurs(G) }, [G]);
  const after = compare({ [G.game.id]: L }, [G]);
  const yr = String(G.game.id).slice(0, 4);
  assert.equal(after[yr].goals.rows, before[yr].goals.rows - 1);
});
