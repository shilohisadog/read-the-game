/**
 * WHO WAS OFFSIDE, WHO ICED IT — the whole published archive, with the offending
 * team resolved from the RESTART DOT and checked against the penalty box.
 *
 * ⛔ "FEWER SKATERS" IS NOT "SHORT-HANDED" — the trap this repo already documented
 * (test/render-penalties.test.js: 17 goals with fewer skaters, 7 genuinely
 * short-handed, 10 of them a PULLED GOALIE). So the check runs the real box.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { stints, occupants } from '/home/twojandk/projects/read-the-game/src/lib/box.js';
const S = '/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad';
const ORIGIN = 'https://data.readthegame.co';
const LIMIT = +(process.argv[2] || 0);
const CONC = 10;

const cat = JSON.parse(readFileSync(`${S}/catalog.json`, 'utf8'));
let ids = cat.games.filter(g => g.v).map(g => g.id);
if (LIMIT) ids = ids.slice(-LIMIT);
process.stderr.write(`${ids.length} viewable games\n`);

const rows = [];
let done = 0; const failed = [];

function reduce(id, g) {
  const ev = g.events || [];
  const home = g.teams?.home?.id, away = g.teams?.away?.id;
  if (home == null || away == null) { failed.push([id, 'no teams']); return; }
  let box = null;
  try { box = stints(ev, { homeId: home, awayId: away }); } catch { box = null; }
  const serving = (tid, secs) => box ? occupants(box, secs, tid).length : null;
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i];
    if (e.type !== 'stoppage' || !/^(icing|offside)$/.test(e.rsn || '')) continue;
    const nx = ev.slice(i + 1).find(x => x.type === 'faceoff');
    // The goalies in `sit`: '0' means a pulled goalie, which is the trap.
    const sit = e.sit && e.sit.length === 4 ? e.sit : null;
    rows.push({
      id, rsn: e.rsn, s: e.s, fx: nx && nx.x != null ? nx.x : null,
      hBox: serving(home, e.s), aBox: serving(away, e.s),
      hGoalie: sit ? +sit[3] : null, aGoalie: sit ? +sit[0] : null,
      hSk: sit ? +sit[2] : null, aSk: sit ? +sit[1] : null,
    });
  }
}

async function one(id) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(`${ORIGIN}/extract/${id}.json`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      reduce(id, await r.json());
      return;
    } catch (e) { if (t === 2) failed.push([id, String(e.message)]); }
  }
}
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < ids.length) { await one(ids[next++]); if (++done % 500 === 0) process.stderr.write(`  ${done}/${ids.length}\n`); }
}));
writeFileSync(`${S}/stoppages2.json`, JSON.stringify({ games: ids.length, failed, rows }));
process.stderr.write(`done: ${rows.length} stoppages, ${failed.length} failed\n`);
