// LAB: shot files for the goaltender's view, straight from the league feed.
//   node lab/prep_shots.mjs 2026020120 2026020121 ...  ->  src/lab/data/<id>.json
// Each shot on goal or goal, in the defended net's frame:
//   d = feet out from the goal line, w = feet to the goaltender's right.
// The net is read from that period's `homeTeamDefendingSide`, not guessed.
// Shooter handedness and height come from the player's own league record.
import { mkdirSync, writeFileSync } from 'node:fs';

const API = 'https://api-web.nhle.com/v1';
const nap = ms => new Promise(r => setTimeout(r, ms));
// Polite: a pause between requests, and backing off when the league says 429.
async function get(u) {
  for (let k = 0; k < 6; k++) {
    await nap(250);
    const r = await fetch(u);
    if (r.status === 429) { await nap(2000 * 2 ** k); continue; }
    if (!r.ok) throw new Error(`${u}: ${r.status}`);
    return r.json();
  }
  throw new Error(`${u}: still rate-limited`);
}
const people = new Map();
async function person(id) {
  if (!people.has(id)) {
    const p = await get(`${API}/player/${id}/landing`).catch(() => ({}));
    people.set(id, { hand: p.shootsCatches || null, inches: p.heightInInches || null });
  }
  return people.get(id);
}

mkdirSync('src/lab/data', { recursive: true });
for (const id of process.argv.slice(2)) {
  const g = await get(`${API}/gamecenter/${id}/play-by-play`);
  const HOME = g.homeTeam.id, AB = { [g.homeTeam.id]: g.homeTeam.abbrev, [g.awayTeam.id]: g.awayTeam.abbrev };
  const roster = Object.fromEntries(g.rosterSpots.map(r => [r.playerId,
    { name: r.lastName.default, first: r.firstName.default, num: r.sweaterNumber, pos: r.positionCode, team: AB[r.teamId], tid: r.teamId }]));
  const shots = [];
  for (const p of g.plays) {
    if (p.typeDescKey !== 'shot-on-goal' && p.typeDescKey !== 'goal') continue;
    const x = p.details.xCoord, y = p.details.yCoord, gk = p.details.goalieInNetId;
    if (x == null || y == null || !gk || p.periodDescriptor.periodType === 'SO') continue;
    const who = p.details.shootingPlayerId || p.details.scoringPlayerId;
    const homeGoalie = (roster[gk] || {}).tid === HOME;
    const side = homeGoalie ? p.homeTeamDefendingSide : (p.homeTeamDefendingSide === 'left' ? 'right' : 'left');
    const f = side === 'left' ? { d: x + 89, w: -y } : { d: 89 - x, w: y };
    shots.push({ per: p.periodDescriptor.number, rem: p.timeRemaining, goalie: gk, shooter: who, sit: p.situationCode || null,
      out: p.typeDescKey === 'goal' ? 'goal' : 'save', type: p.details.shotType || null,
      d: f.d, w: f.w, x, y, side, clip: p.details.highlightClipSharingUrl || null });
  }
  for (const id of new Set(shots.flatMap(s => [s.shooter, s.goalie]))) Object.assign(roster[id] ||= {}, await person(id));
  const goalies = [...new Set(shots.map(s => s.goalie))];
  const out = { id: +id, date: g.gameDate, away: g.awayTeam.abbrev, home: g.homeTeam.abbrev,
    score: { [g.awayTeam.abbrev]: g.awayTeam.score, [g.homeTeam.abbrev]: g.homeTeam.score }, goalies, roster, shots };
  writeFileSync(`src/lab/data/${id}.json`, JSON.stringify(out));
  console.log(id, out.away, 'at', out.home, shots.length, 'shots,', shots.filter(s => s.out === 'goal').length, 'goals,',
    Object.entries(shots.reduce((m, s) => (m[s.type] = (m[s.type] || 0) + 1, m), {})).map(([k, v]) => `${k} ${v}`).join(', '));
}
