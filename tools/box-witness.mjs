/**
 * THE LEAGUE'S OWN STRENGTH CODE, READ BACK AGAINST OUR PENALTY BOX.
 *
 * `src/lib/box.js` derives exactly one thing — that a minor ends early when its
 * team is scored on. `situationCode` is an independent record of that same fact,
 * stamped on the events by somebody who is not us. This walks the published
 * archive and asks whether the two agree.
 *
 * ⭐⭐ IT ASKS TWICE, AND THE TWO QUESTIONS ARE NOT THE SAME INSTRUMENT.
 *
 *   AGGREGATE    over every event: does the box's occupancy imply the manpower
 *                the league stamped? A broad number, and a nearly useless one.
 *   TRANSITION   at every power-play goal: does the league's code say the
 *                advantage ended, and does the box release somebody there?
 *
 * ⛔ THE AGGREGATE COULD NOT SEE THE BUG KEVIN FOUND. The bench-minor defect —
 * `?game=2025030414&at=1-07:12.1`, a Vegas bench minor still running through a
 * Carolina power-play goal — moved aggregate agreement by 24 events out of
 * 46,726, which is 0.05% against a 3% baseline of ordinary disagreement. The
 * SAME two data sources, asked at the transition, put it at 7 of 180 power-play
 * goals and showed the fix closing 4 of them. *A witness is only as sharp as the
 * question you put to it*, and the aggregate is the version that reads as
 * coverage while measuring nothing you can act on.
 *
 * ⚠️ THIS IS A MEASUREMENT SCRIPT, NOT A GATE. It needs the network and the
 * published archive; `npm run gates` does not run it. It exists so that every
 * figure in `docs/status.md` §0.00-η can be reproduced rather than quoted —
 * the previous run of this measurement reported "94.1%" and its script was not
 * kept, so the number could not be checked and had to be thrown away.
 *
 *   node tools/box-witness.mjs [--games N] [--cache DIR]
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const N = Number(arg('--games', 150));
const CACHE = arg('--cache', '');
if (CACHE) mkdirSync(CACHE, { recursive: true });

const { stints } = await import(new URL('../src/lib/box.js', import.meta.url));

async function grab(name) {
  const r = await fetch(`https://data.readthegame.co/${name}`);
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  return r.json();
}

/** One game's extract, from the cache if it is there. */
async function game(id) {
  const at = CACHE ? `${CACHE}/${id}.json` : null;
  if (at && existsSync(at)) return JSON.parse(readFileSync(at, 'utf8'));
  const g = await grab(`extract/${id}.json`);
  if (at) writeFileSync(at, JSON.stringify(g));
  return g;
}

/**
 * A SYSTEMATIC SPREAD, NOT A HEAD SLICE. The catalog is in date order and the
 * first N rows are one stretch of one season — the shape that produced this
 * project's "4×" headline out of eight games.
 */
const cat = await grab('catalog.json');
const rows = (cat.games || cat.rows || cat).filter(r => r.v === 1);
const step = Math.max(1, Math.floor(rows.length / N));
const pick = Array.from({ length: N }, (_, k) => rows[k * step]).filter(Boolean);

const diff = s => (+s[1]) - (+s[2]);              // away skaters − home skaters
const readable = e => e.sit && e.sit.length === 4 && e.sit[0] === '1' && e.sit[3] === '1';

let ev = 0, agreeDiff = 0, agreeExact = 0, pulled = 0, games = 0;
let pp = 0, sitEnded = 0, boxEnded = 0, both = 0, sitOnly = 0, boxOnly = 0;
const held = [];

for (const r of pick) {
  let g;
  try { g = await game(r.id); } catch { continue; }
  if (!g.events || !g.teams) continue;
  games++;
  const ctx = { roster: g.roster, awayId: g.teams.away.id, homeId: g.teams.home.id };
  const S = stints(g.events, ctx);

  for (let i = 0; i < g.events.length; i++) {
    const e = g.events[i];
    if (!e.sit || e.sit.length !== 4 || e.s == null) continue;
    // A PULLED GOALIE IS NOT A BOX QUESTION. `0651` is six skaters and an empty
    // net with nobody penalised anywhere; counting it as a disagreement would
    // report the box wrong about a thing it does not claim.
    if (!readable(e)) { pulled++; continue; }
    ev++;

    let aBox = 0, hBox = 0;
    for (const s of S) {
      if (e.s < s.start || e.s >= s.end) continue;
      if (s.team === ctx.awayId) aBox++; else hBox++;
    }
    // Capped at 2: a third penalty does not take a third skater off the ice.
    const aS = 5 - Math.min(aBox, 2), hS = 5 - Math.min(hBox, 2);
    if (aS - hS === diff(e.sit)) agreeDiff++;
    if (aS === +e.sit[1] && hS === +e.sit[2]) agreeExact++;

    if (e.type !== 'goal') continue;
    const d = diff(e.sit);
    if (d === 0) continue;
    const scorerAway = (e.own ?? e.tid) === ctx.awayId;
    if ((d > 0) !== scorerAway) continue;                        // short-handed goal
    const nxt = g.events.slice(i + 1).find(readable);
    if (!nxt) continue;
    pp++;
    const sitRel = Math.abs(diff(nxt.sit)) < Math.abs(d);
    const boxRel = S.some(s => s.endedBy === 'goal' && s.end === e.s);
    if (sitRel) sitEnded++;
    if (boxRel) boxEnded++;
    if (sitRel && boxRel) both++;
    else if (sitRel) { sitOnly++; held.push({ id: r.id, s: e.s, from: e.sit, to: nxt.sit, S }); }
    else if (boxRel) boxOnly++;
  }
}

const pct = (a, b) => `${(100 * a / b).toFixed(1)}%`;
console.log(`${games} games · ${ev} events with both goalies in (${pulled} skipped for a pulled goalie)\n`);
console.log('AGGREGATE — the broad number, and the one that cannot see a release bug');
console.log(`  the ADVANTAGE matches      ${agreeDiff} / ${ev} = ${pct(agreeDiff, ev)}`);
console.log(`  both SKATER COUNTS match   ${agreeExact} / ${ev} = ${pct(agreeExact, ev)}\n`);
console.log('TRANSITION — the sharp one');
console.log(`  power-play goals with a readable code on both sides   ${pp}`);
console.log(`  the league's code says the advantage ENDED            ${sitEnded}`);
console.log(`  box.js releases somebody at that instant             ${boxEnded}`);
console.log(`  they agree                                           ${both} (${pct(both, pp)})`);
console.log(`  ⛔ league says ended, box holds him                   ${sitOnly}`);
console.log(`  box releases, league says still short                ${boxOnly}`);

if (held.length) {
  /* ⭐ AND IT NAMES THE CAUSE RATHER THAN THE COUNT. Every disagreement found so
     far is a goal at the exact second a penalty expires — the league still reads
     short, our half-open interval has already opened the door. That is a
     one-second boundary question, not a rules question, and printing the
     arithmetic is what makes the difference visible without a second script. */
  console.log('\nthe ⛔ column, with the stint that was still running:');
  for (const h of held) {
    const near = h.S.filter(s => Math.abs(s.end - h.s) <= 2 || (s.start <= h.s && s.end > h.s));
    const how = near.map(s => `${s.sev} ${s.min}m ${s.start}→${s.end}`).join(' · ') || '(none near)';
    const tie = near.some(s => s.end === h.s) ? '  ⟵ EXPIRES ON THIS SECOND' : '';
    console.log(`  ${h.id} @${h.s}s  sit ${h.from}→${h.to}  ${how}${tie}`);
  }
}
