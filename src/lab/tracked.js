/**
 * LAB — the tracked goal. While the replay plays, a goal with a league tracking
 * file is shown from it: on the step into the ~9 s before the goal, every
 * tracked player and the puck are laid over the same rink at quarter speed, the
 * play's marks dim and their numbers go, the clock counts down with it, and the recorded events in
 * that window are tagged as the clock passes them. At the goal-line crossing it
 * hands back to the replay's goal frame. Stepping or scrubbing onto a goal offers
 * "See it tracked" instead; so does reduced motion.
 *
 * Coordinates: league feet = (x/12 - 100, 42.5 - y/12) (the file's y runs
 * opposite to the play-by-play's); `turn` is our extract's per-period rotation,
 * read off the goal's own sign; the replay's AX/AY then place it on screen.
 */
import { colourOf, inkOn, readableInk } from '../lib/teams.js';

const ORIGIN = 'https://data.readthegame.co';
export const SPEED = 0.25;
const LOOKAHEAD_S = 40;          // start loading a goal's file this far ahead, in game seconds
const TAG_MS = 1600;
const WORDS = { 'shot-on-goal': 'Shot on goal', 'missed-shot': 'Missed the net', 'blocked-shot': 'Blocked',
  hit: 'Hit', giveaway: 'Giveaway', takeaway: 'Takeaway', faceoff: 'Face-off' };
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const css = document.createElement('style');
css.textContent = `
#rg.labtrk #events,#rg.labtrk #netmen,#rg.labtrk #lines,#rg.labtrk #puck,#rg.labtrk #labels,#rg.labtrk #cue,#rg.labtrk #draws,#rg.labtrk #whistles{opacity:.18;transition:opacity .4s}
#rg.labtrk .evn,#rg.labtrk .whn,#rg.labtrk .zsn,#rg.labtrk .shotft{display:none}
#labtrack text{pointer-events:none}
#labtrack .tn{font-size:1.5px;font-weight:800;text-anchor:middle;dominant-baseline:central}
#labtrack .tag{font-size:2.6px;font-weight:800;fill:#0f1a23;paint-order:stroke;stroke:#fff;stroke-width:.9px;text-anchor:middle}
#labtrack .tsc{font-size:2.4px;font-weight:800;paint-order:stroke;stroke:#fff;stroke-width:.8px;text-anchor:middle}
#labtrack .tpk{fill:#0e1216;stroke:#fff;stroke-width:.3}
#rg .who .wtr{margin-left:8px;font:inherit;font-weight:700;border:0;border-radius:99px;padding:3px 10px;background:#7c3aed;color:#fff;cursor:pointer}`;
document.head.appendChild(css);

const index = new Map(), files = new Map(), plans = new Map();
const gidOf = G => String(G.game && G.game.id);

function goalsOf(gid) {
  if (!index.has(gid)) index.set(gid, fetch(`${ORIGIN}/track/${gid}/goals.json`)
    .then(r => (r.ok ? r.json() : [])).catch(() => []));
  return index.get(gid);
}
function fileOf(gid, ev) {
  const k = gid + ':' + ev;
  if (!files.has(k)) files.set(k, fetch(`${ORIGIN}/track/${gid}/ev${ev}.json`)
    .then(r => (r.ok ? r.json() : null)).catch(() => null));
  return files.get(k);
}
const lg = o => ({ x: o.x / 12 - 100, y: 42.5 - o.y / 12 });

/** A goal's plan: its frames, the goal-line frame `k`, seconds of build-up `before`, and the turn. */
function plan(G, e) {
  if (plans.has(e)) return plans.get(e);
  const gid = gidOf(G);
  const p = goalsOf(gid).then(rows => {
    const row = rows.find(r => r.per === e.per && r.clock === e.clock && (r.scorer == null || r.scorer === e.actor));
    return row ? fileOf(gid, row.ev) : null;
  }).then(frames => {
    if (!Array.isArray(frames) || !frames.length || e.x == null) return null;
    let k = -1;
    for (let j = 1; j < frames.length; j++) {
      const a = frames[j - 1].onIce['1'], b = frames[j].onIce['1'];
      if (a && b && Math.abs(lg(b).x) > 89 && Math.abs(lg(a).x) <= 89 && Math.abs(lg(b).y) <= 3.5) { k = j; break; }
    }
    if (k < 0) return null;
    const turn = Math.sign(e.x) === Math.sign(lg(frames[k].onIce['1']).x) ? 1 : -1;
    return { e, frames, k, before: (frames[k].timeStamp - frames[0].timeStamp) / 10, turn, ready: true };
  });
  p.then(v => { p.value = v; });
  plans.set(e, p);
  return p;
}
const ready = e => { const p = plans.get(e); return p && p.value ? p.value : null; };

/* ---------------------------------------------------------------- state */
let last = null, run = null;
const sameStretch = (EV, a, b) => { for (let j = a + 1; j < b; j++) if (EV[j].type === 'faceoff' || EV[j].type === 'stoppage') return false; return EV[a].per === EV[b].per; };
function goalAhead(f) {
  const { EV, i } = f;
  for (let g = i + 1; g < EV.length; g++) {
    if (EV[g].per !== EV[i].per || EV[g].s - EV[i].s > LOOKAHEAD_S) return -1;
    if (EV[g].type === 'goal') return sameStretch(EV, i, g) ? g : -1;
  }
  return -1;
}

function layer() {
  let g = $('labtrack');
  if (!g) {
    const ice = $('ice'); if (!ice) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'labtrack';
    ice.insertBefore(g, $('labels'));
  }
  return g;
}
function end() {
  if (run && run.raf) cancelAnimationFrame(run.raf);
  run = null;
  const g = $('labtrack'); if (g) g.innerHTML = '';
  const rg = $('rg'); if (rg) rg.classList.remove('labtrk');
}

/** Lay the plan over the rink from the file's first frame to the goal line, then call `done`. */
function start(P, f, inWindow, done) {
  end();
  const { G, AX, AY } = f, R = G.roster, per = P.e.per;
  // The two colours the replay already chose to contrast (set on #rg), not the raw club colours.
  const cs = getComputedStyle($('rg')), pick = (v, ab) => cs.getPropertyValue(v).trim() || colourOf(ab);
  const col = { [G.teams.home.id]: pick('--home', G.teams.home.ab), [G.teams.away.id]: pick('--away', G.teams.away.ab) };
  const at = o => { const p = lg(o); return { x: AX(P.turn * p.x, per), y: AY(P.turn * p.y, per) }; };
  const t0 = P.frames[0].timeStamp, tGoal = P.frames[P.k].timeStamp;
  const remGoal = (() => { const [m, s] = String(P.e.rem || '0:0').split(':').map(Number); return m * 60 + s; })();
  const stars = new Set([P.e.actor, P.e.a1, P.e.a2].filter(Boolean).map(Number));
  const tags = inWindow.map(e => ({ e, at: tGoal - (P.e.s - e.s) * 10, shown: null }));
  $('rg').classList.add('labtrk');
  // Kevin: own it — name the goal, and say the strength in words, not only on the scoreboard.
  const sc = R[P.e.actor] || {}, ab = t => (t === G.teams.home.id ? G.teams.home.ab : G.teams.away.ab);
  const WHO = `Tracked \u00b7 #${sc.n || ''} ${sc.nm || ''}\u2019s goal`;
  const SAY = `The last ${Math.round(P.before)} seconds before the goal: every player and the puck, `
    + `10 times a second, at a quarter of real speed.${strength(P.e, G, ab)}`;
  const began = performance.now();
  run = { done };
  const tick = now => {
    if (!run) return;
    const tt = t0 + ((now - began) / 1000) * SPEED * 10;          // tracked time, in tenths
    let j = 0; while (j < P.k && P.frames[j + 1].timeStamp <= tt) j++;
    const F = P.frames[j].onIce, out = [];
    for (const o of Object.values(F)) {
      if (!o.playerId) continue;
      const s = at(o), r = R[o.playerId] || {}, c = col[o.teamId] || '#5b6d7a', gk = r.pos === 'G', star = stars.has(Number(o.playerId));
      // Home in its colour, away in white with a coloured rim: the away team wears white in the NHL,
      // and two clubs with similar colours (TBL and NYR) stay apart.
      const away = Number(o.teamId) === Number(G.teams.away.id);
      const fill = away ? '#fff' : c, rim = away ? c : (gk ? '#0f1a23' : '#fff'), ink = away ? readableInk(c) : inkOn(c);
      out.push(`<circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${gk ? 1.7 : star ? 1.6 : 1.35}" fill="${fill}" stroke="${rim}" stroke-width="${away ? (star ? .7 : .45) : (star ? .55 : .25)}"/>`
        + `<text class="tn" x="${s.x.toFixed(2)}" y="${s.y.toFixed(2)}" fill="${ink}">${esc(o.sweaterNumber)}</text>`);
      if (Number(o.playerId) === Number(P.e.actor)) out.push(`<text class="tsc" x="${s.x.toFixed(2)}" y="${(s.y - 2.6).toFixed(2)}" fill="${c}">${esc(r.nm || '')}</text>`);
    }
    const pk = F['1'];
    if (pk) {
      const s = at(pk);
      out.push(`<circle class="tpk" cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r=".6"/>`);
      for (const t of tags) {
        if (t.shown == null && tt >= t.at) t.shown = now;
        if (t.shown != null && now - t.shown < TAG_MS) out.push(`<text class="tag" x="${s.x.toFixed(2)}" y="${(s.y + 4).toFixed(2)}">${esc(WORDS[t.e.type] || '')}</text>`);
      }
    }
    const g = layer(); if (g) g.innerHTML = out.join('');
    $('rg').classList.add('labtrk');
    const line = $('playline'); if (line && line.textContent !== SAY) line.textContent = SAY;
    const who = $('who'); if (who && who.textContent !== WHO) { who.textContent = WHO; who.className = 'who plain'; }
    const clk = $('clk'); if (clk) { const r = Math.max(0, Math.floor(remGoal + (tGoal - P.frames[j].timeStamp) / 10)); clk.textContent = `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`; }
    if (j >= P.k) { const d = run.done; run.raf = null; if (d) d(); return; }
    if (hold && !/Pause/.test($('play').textContent)) { end(); hold = null; return; }
    run.raf = requestAnimationFrame(tick);
  };
  run.raf = requestAnimationFrame(tick);
  return (P.before * 1000) / SPEED;
}

/** " NYR has a power play: 5 skaters to TBL's 4." from the goal's own situation code, or "". */
function strength(e, G, ab) {
  const [ag, as, hs, hg] = String(e.sit || '').split('').map(Number);
  if (![ag, as, hs, hg].every(Number.isFinite)) return '';
  const home = e.own === G.teams.home.id, us = home ? G.teams.home.id : G.teams.away.id, them = home ? G.teams.away.id : G.teams.home.id;
  const mine = home ? hs : as, theirs = home ? as : hs, theirG = home ? ag : hg;
  if (theirG === 0) return ` ${ab(them)} has pulled its goaltender: the net is empty.`;
  if (mine > theirs) return ` ${ab(us)} has a power play: ${mine} skaters to ${ab(them)}\u2019s ${theirs}.`;
  if (mine < theirs) return ` ${ab(us)} is short-handed: ${mine} skaters to ${ab(them)}\u2019s ${theirs}.`;
  return '';
}

/* ---------------------------------------------------------------- the hooks */
let hold = null;   // { i, g, ms, finished }
export const tracked = {
  frame(f) {
    last = f;
    // Anything but the overlay's own hold ends it: a scrub, a step, the goal frame.
    if (run && !(hold && f.i === hold.i && f.how === 'play')) end();
    if (hold && f.i !== hold.i) hold = null;
    const g = goalAhead(f);
    if (g >= 0) plan(f.G, f.EV[g]);
    if (f.cur && f.cur.type === 'goal') { plan(f.G, f.cur); offer(f); }
  },
  next(i) {
    const f = last;
    if (hold && hold.i === i) { const g = hold.g; hold = null; end(); return g; }
    // Only `step()` calls this, and only while playing.
    if (!f || f.REDUCED) return i + 1;
    const g = goalAhead(f);
    if (g < 0) return i + 1;
    const P = ready(f.EV[g]);
    const nxt = f.EV[i + 1];
    if (!P || !nxt || nxt.s < f.EV[g].s - P.before) return i + 1;
    const inWindow = f.EV.slice(i + 1, g).filter(e => WORDS[e.type]);
    const ms = start(P, f, inWindow, () => {});
    hold = { i, g, ms };
    return i;
  },
  extra(e, base) {
    if (hold && last && last.EV[hold.i] === e) return Math.max(0, hold.ms - (base || 0));
    return 0;
  },
};

/* Stepping or scrubbing onto a goal (or reduced motion): offer it instead. */
function offer(f) {
  const w = $('who'); if (!w || f.playing && !f.REDUCED) return;
  const e = f.cur;
  plan(f.G, e).then(P => {
    if (!P || !last || last.cur !== e || w.querySelector('.wtr')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'wtr';
    b.textContent = '▶ See it tracked';
    b.onclick = ev => { ev.stopPropagation(); start(P, last, [], () => setTimeout(end, 1500)); };
    w.appendChild(b);
  });
}
