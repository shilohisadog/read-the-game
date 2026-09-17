// Detector: do published numbers move, and do the invariants hold?
// usage: node probe-numbers.mjs <clone-root> <games-dir>   -> JSON on stdout
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const [ROOT, GAMES] = process.argv.slice(2);
const imp = p => import(join(ROOT, p));
const out = { components: {}, invariants: {}, errors: [] };
const h = v => createHash('sha1').update(v).digest('hex').slice(0, 16);

try {
  const M = await imp('builders/measure.mjs');
  // The INVARIANT CHECKER comes from the untouched repo, never the mutated clone:
  // a mutant inside conservation() must not be able to disarm its own detector.
  const { conservation } = await import('/home/twojandk/projects/read-the-game/src/lib/layer.js');
  const L = {
    corsi: (await imp('src/lib/layers/corsi.js')).corsi,
    danger: (await imp('src/lib/layers/danger.js')).danger,
    blocked: (await imp('src/lib/layers/blocked.js')).blocked,
    goaltending: (await imp('src/lib/layers/goaltending.js')).goaltending,
    whistle: (await imp('src/lib/layers/whistle.js')).whistle,
    zonestart: (await imp('src/lib/layers/zonestart.js')).zonestart,
    tied: (await imp('src/lib/layers/tied.js')).tiedControl,
  };
  const files = readdirSync(GAMES).filter(f => f.endsWith('.json')).sort();
  try { out.components.measureAll = h(M.stable(M.measureAll(GAMES))); }
  catch (e) { out.components.measureAll = 'THREW:' + e.message.slice(0, 80); }
  for (const f of files) {
    const g = JSON.parse(readFileSync(join(GAMES, f), 'utf8'));
    const id = g.game.id;
    const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id,
                  homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
    try { out.components[`measureGame:${id}`] = h(M.stable(M.measureGame(g))); }
    catch (e) { out.components[`measureGame:${id}`] = 'THREW:' + e.message.slice(0, 80); }
    for (const [name, layer] of Object.entries(L)) {
      for (const evenOnly of [false, true]) {
        const key = `${name}:${evenOnly ? 'even' : 'all'}:${id}`;
        try {
          const r = layer.reduce(g.events, { ...ctx, evenOnly });
          out.components[key] = h(M.stable(r));
          if (r && r.counted && r.excluded && r.surprising) {
            const c = conservation(r, g.events.length);
            (out.invariants[`${name}:${evenOnly ? 'even' : 'all'}`] ||= []).push(c.ok ? 1 : 0);
          }
        } catch (e) { out.components[key] = 'THREW:' + e.message.slice(0, 80); }
      }
    }
  }
} catch (e) { out.errors.push(String(e && e.stack || e).slice(0, 300)); }
process.stdout.write(JSON.stringify(out));
