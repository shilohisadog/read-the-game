/**
 * THE COLOR LINE, PRINTED FOR READING: one period of a real game through
 * `src/lib/color.js` — the code the replay runs — as a markdown table
 * (docs/color-script.md). The middle column is a plain-English stand-in for what
 * the page shows on the ice.
 *   node tools/color-script.mjs <extract.json> [period]
 */
import { readFileSync } from 'node:fs';
import { colorNotes } from '../src/lib/color.js';
import { framed, inShootout } from '../src/lib/layer.js';
import { penName } from '../src/lib/penalties.js';

const G = JSON.parse(readFileSync(process.argv[2]));
const PER = +(process.argv[3] || 1);
const M = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url)));
const R = G.roster, HID = G.teams.home.id, AID = G.teams.away.id;
const ctx = { roster: R, homeId: HID, awayId: AID, homeAb: G.teams.home.ab, awayAb: G.teams.away.ab };
const ab = id => (id === HID ? ctx.homeAb : id === AID ? ctx.awayAb : '?');
const nm = p => (R[p] ? R[p].nm : 'a player');
const team = p => (R[p] ? R[p].tid : null);

function said(e) {
  switch (e.type) {
    case 'faceoff': return `${ab(e.own)} won the faceoff (${nm(e.actor)})`;
    case 'shot-on-goal': return `${ab(team(e.actor))} shot on goal, saved (${nm(e.actor)})`;
    case 'missed-shot': return `${ab(team(e.actor))} shot and missed the net (${nm(e.actor)})`;
    case 'blocked-shot': return team(e.blk) === team(e.actor)
      ? `A ${ab(team(e.actor))} shot hit a teammate (${nm(e.blk)})`
      : `${ab(team(e.blk))} blocked a ${ab(team(e.actor))} shot (${nm(e.blk)})`;
    case 'hit': return `${ab(e.own)} player hit an opponent (${nm(e.actor)})`;
    case 'giveaway': return `${ab(e.own)} lost the puck (${nm(e.actor)})`;
    case 'takeaway': return `${ab(e.own)} took the puck away (${nm(e.actor)})`;
    case 'goal': return `**${ab(team(e.actor))} GOAL** (${nm(e.actor)})`;
    case 'penalty': return `${ab(e.own)} penalty: ${penName(e.pen)} (${nm(e.actor)})`;
    case 'game-end': return 'Final horn';
    default: return e.type;
  }
}

const notes = colorNotes(G, ctx, M);
const rows = [];
G.events.forEach((e, n) => {
  if (e.per !== PER || !framed(e) || inShootout(e)) return;
  rows.push(`| ${e.rem} | ${said(e)} | ${notes.get(n) || ''} |`);
});
console.log('| Clock | What happened | Color |\n|---|---|---|\n' + rows.join('\n'));
console.error(`period ${PER}: ${rows.length} frames, ${rows.filter(r => !r.endsWith('|  |')).length} with a note`);
