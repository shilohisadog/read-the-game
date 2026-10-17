/**
 * LAB — replay prototypes, switched on from the address or the lab panel.
 *   ?viz=follow          the camera eases toward the zone of the current play
 *   ?viz=crease          a shot on goal or a goal also shown from the crease
 *   &seat=crease|net|glass|tv   which camera the inset uses
 * app.js calls LAB.frame() at the end of every render (lab branch only).
 */
import { shotsAgainst, draw, SEATS } from './crease.js';
import { colourOf } from '../lib/teams.js';

const q = new URLSearchParams(location.search);
const on = new Set((q.get('viz') || '').split(/[ ,+]/).filter(Boolean));
let seat = SEATS[q.get('seat')] ? q.get('seat') : 'net';   // the inset is small: the net-camera keeps context
let last = null;

function save() {
  const u = new URL(location.href);
  if (on.size) u.searchParams.set('viz', [...on].join(',')); else u.searchParams.delete('viz');
  if (seat !== 'net') u.searchParams.set('seat', seat); else u.searchParams.delete('seat');
  history.replaceState(history.state, '', u);
}

/* ---------------------------------------------------------------- the panel */
const css = document.createElement('style');
css.textContent = `
.labp{position:fixed;bottom:8px;right:8px;z-index:9999;background:#7c3aed;color:#fff;border-radius:10px;
  font:600 12px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 6px 18px rgba(60,20,120,.35)}
.labp summary{list-style:none;cursor:pointer;padding:6px 10px;letter-spacing:.08em;font-weight:800}
.labp summary::-webkit-details-marker{display:none}
.labp .b{padding:4px 10px 10px;display:grid;gap:6px;min-width:150px}
.labp label{display:flex;gap:6px;align-items:center;cursor:pointer}
.labp select{font:inherit;border-radius:6px;border:0;padding:3px}
.labcam{position:relative;overflow:hidden;border-radius:inherit}
.labcam>#ice{transform-origin:0 0;transition:transform .9s cubic-bezier(.3,.1,.2,1);will-change:transform}
.labins{position:absolute;width:38%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;
  box-shadow:0 6px 20px rgba(10,20,30,.35);border:2px solid #fff;opacity:0;transition:opacity .35s;pointer-events:none;z-index:5}
.labins.show{opacity:1}
.labins canvas{display:block;width:100%;height:100%}
.labins i{position:absolute;left:6px;bottom:5px;font:700 10px/1 system-ui;color:#fff;background:rgba(15,26,35,.6);
  padding:3px 6px;border-radius:5px;font-style:normal;letter-spacing:.04em}
#rg .labcam .labzoom{position:absolute;left:6px;top:6px;right:auto;bottom:auto;z-index:6;font:700 10px/1 system-ui;border:0;
  border-radius:99px;padding:4px 8px;min-height:0;min-width:0;width:auto;height:auto;background:rgba(15,26,35,.55);color:#fff;
  cursor:pointer;box-shadow:none}
@media (prefers-reduced-motion:reduce){.labcam>#ice{transition:none}.labins{transition:none}}`;
document.head.appendChild(css);

const panel = document.createElement('details');
panel.className = 'labp';
panel.innerHTML = `<summary>LAB</summary><div class="b">
  <label><input type="checkbox" data-k="follow"> Follow the play</label>
  <label><input type="checkbox" data-k="crease"> Shots from the crease</label>
  <label>Seat <select>${Object.entries(SEATS).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join('')}</select></label>
</div>`;
document.body.appendChild(panel);
panel.querySelectorAll('input').forEach(b => {
  b.checked = on.has(b.dataset.k);
  b.onchange = () => { b.checked ? on.add(b.dataset.k) : on.delete(b.dataset.k); save(); apply(); };
});
const pick = panel.querySelector('select');
pick.value = seat;
pick.onchange = () => { seat = pick.value; save(); apply(); };

/* ---------------------------------------------------------------- the camera */
const ZOOM = 1.7;
let cam = null, full = false, aim = null;
function ensureCam() {
  if (cam) return cam;
  const ice = document.getElementById('ice');
  if (!ice) return null;
  const wrap = document.createElement('div');
  wrap.className = 'labcam';
  ice.parentNode.insertBefore(wrap, ice);
  wrap.appendChild(ice);
  const btn = document.createElement('button');
  btn.className = 'labzoom'; btn.type = 'button';
  btn.onclick = e => { e.stopPropagation(); full = !full; aimAt(aim); };
  wrap.appendChild(btn);
  cam = { wrap, ice, btn };
  return cam;
}
/* The rink is 200 x 85 units. A zone, not the exact point, so the view moves
   when play changes zones rather than on every event. */
function aimAt(p) {
  const c = ensureCam(); if (!c) return;
  const following = on.has('follow');
  c.btn.hidden = !following;
  c.btn.textContent = full ? 'Follow' : 'Full rink';
  if (!following || full || !p) { c.ice.style.transform = ''; return; }
  const vw = 200 / ZOOM, vh = 85 / ZOOM;
  const x0 = p.x < 75 ? 0 : p.x > 125 ? 200 - vw : 100 - vw / 2;
  const y0 = Math.max(0, Math.min(85 - vh, (p.y < 30 ? 15 : p.y > 55 ? 70 : 42.5) - vh / 2));
  const px = c.wrap.clientWidth / 200;
  c.ice.style.transform = `scale(${ZOOM}) translate(${(-x0 * px).toFixed(1)}px,${(-y0 * px).toFixed(1)}px)`;
}
function markAt() {
  const m = document.querySelector('#events .cur');
  if (!m) return null;
  const b = m.getBBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, el: m };
}
/* Where the mark is ON SCREEN, as fractions of the visible rink (after the zoom). */
function onScreen(p) {
  if (!p || !p.el || !cam) return null;
  const r = p.el.getBoundingClientRect(), w = cam.wrap.getBoundingClientRect();
  return { fx: (r.left + r.width / 2 - w.left) / w.width, fy: (r.top + r.height / 2 - w.top) / w.height };
}

/* ---------------------------------------------------------------- the inset */
let ins = null;
function ensureInset() {
  if (ins) return ins;
  const c = ensureCam(); if (!c) return null;
  const box = document.createElement('div');
  box.className = 'labins';
  box.innerHTML = '<canvas></canvas><i></i>';
  c.wrap.appendChild(box);
  ins = { box, cv: box.querySelector('canvas'), tag: box.querySelector('i') };
  return ins;
}
function inset(f, p) {
  const n = ensureInset(); if (!n) return;
  const e = f.cur;
  const shot = on.has('crease') && e && e.goalie && (e.type === 'shot-on-goal' || e.type === 'goal');
  n.box.classList.toggle('show', !!shot);
  if (!shot) return;
  const k = f.G.events.indexOf(e);
  const shots = shotsAgainst(f.G, e.goalie, k < 0 ? Infinity : k);
  const current = shots.find(s => s.e === e) || null;
  // The corner farthest from the shot on screen, so the inset never covers the play it shows.
  const at = onScreen(p) || { fx: 0, fy: 1 };
  const left = at.fx > 0.5, top = at.fy > 0.5;
  n.box.style.left = left ? '8px' : ''; n.box.style.right = left ? '' : '8px';
  n.box.style.top = top ? '8px' : ''; n.box.style.bottom = top ? '' : '8px';
  const r = n.cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  n.cv.width = Math.round(r.width * dpr); n.cv.height = Math.round(r.height * dpr);
  const g = n.cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const AB = { [f.G.teams.away.id]: f.G.teams.away.ab, [f.G.teams.home.id]: f.G.teams.home.ab };
  draw(g, r.width, r.height, { seat, shots, current, colourOf: t => colourOf(AB[t]), t: 0, motion: false });
  const gk = f.G.roster[e.goalie] || {};
  n.tag.textContent = `${SEATS[seat].label.toUpperCase()} · ${gk.nm || ''}`;
}

/* ---------------------------------------------------------------- the frame */
function apply() {
  if (!last) return;
  const p = markAt();
  if (p) aim = p;
  aimAt(aim);
  inset(last, p);
}
/* ---------------------------------------------------------------- the goalie view
   On a goal (and, with viz=saves, on a save) a button beside the highlight opens
   the shot from the crease over the replay. Lab: only games with a shot file. */
const GOAL_HOLD = 3000;                      // a goal holds this much longer while playing
let shotFile = null, shotFileFor = null;
function hasShotFile(G) {
  const id = G.game && G.game.id;
  if (shotFileFor !== id) { shotFileFor = id; shotFile = fetch(`/lab/data/${id}.json`, { method: 'HEAD' }).then(r => r.ok).catch(() => false); }
  return shotFile;
}
css.textContent += `
#rg .who .wgv{margin-left:8px;font:inherit;font-weight:700;border:0;border-radius:99px;padding:3px 10px;background:#0f1a23;color:#fff;cursor:pointer}
.labgv{position:fixed;inset:3vh 3vw;z-index:10000;border-radius:16px;overflow:hidden;background:#0b121a;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.labgv iframe{border:0;width:100%;height:100%;display:block}
.labgv .x{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:2;font:700 12px/1 system-ui;border:0;border-radius:99px;
  padding:6px 12px;background:rgba(255,255,255,.92);color:#0f1a23;cursor:pointer}
.labgvbg{position:fixed;inset:0;z-index:9999;background:rgba(5,10,15,.55)}
@media (max-height:500px),(max-width:700px){.labgv{inset:0;border-radius:0}}`;
function openGoalieView(f, e) {
  if (f.playing) document.getElementById('play').click();            // pause the replay
  const bg = document.createElement('div'); bg.className = 'labgvbg';
  const box = document.createElement('div'); box.className = 'labgv';
  const u = new URLSearchParams({ embed: 1, game: f.G.game.id, per: e.per, rem: e.rem, shooter: e.actor, seat: 'crease' });
  box.innerHTML = `<iframe title="The shot from the crease" src="/lab/shot.html?${u}"></iframe><button class="x" type="button">Back to the replay</button>`;
  const close = () => { box.remove(); bg.remove(); removeEventListener('keydown', esc); };
  const esc = k => { if (k.key === 'Escape') close(); };
  box.querySelector('.x').onclick = close; bg.onclick = close; addEventListener('keydown', esc);
  document.body.append(bg, box);
}
function goalieButton(f) {
  const e = f.cur, w = document.getElementById('who');
  if (!w || !e) return;
  const kind = e.type === 'goal' || (on.has('saves') && e.type === 'shot-on-goal');
  if (!kind || !e.goalie || w.querySelector('.wgv')) return;
  hasShotFile(f.G).then(ok => {
    if (!ok || last.cur !== e || w.querySelector('.wgv')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'wgv';
    b.textContent = '\u25B6 Goalie view';
    b.onclick = ev => { ev.stopPropagation(); openGoalieView(last, e); };
    w.appendChild(b);
  });
}
window.LAB = {
  frame(f) { last = f; apply(); goalieButton(f); },
  extra: e => (e && e.type === 'goal' ? GOAL_HOLD : 0),
};
