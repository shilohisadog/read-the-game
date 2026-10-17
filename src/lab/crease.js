/**
 * LAB — the goaltender's view, rebuilt. One scene, drawn on a canvas, used by
 * lab/goalie.html (the whole view) and lab/lab.js (the replay inset).
 *
 * Frame: feet, measured from the goal line of the net being defended.
 *   d = distance out from the goal line (toward centre ice), w = to the
 *   goaltender's right as he faces out, h = height.
 * Storage (extract.py::_norm) puts the home net at x = -89 and the away net at
 * x = +89 in every period, so a shot maps with no guessing. Rotation, not a
 * mirror: w flips sign between the two nets.
 *
 * Draws only what is recorded: where each shot was taken from and what happened.
 * Never the puck's path, its height, or where in the net it went.
 */
import { FIG, sizeFor, PLAYER_FT } from '../lib/figures.js';

/* NHL sheet, in this frame. */
const GOAL_TO_END = 11, HALF_W = 42.5, CORNER = 28, BLUE = 64, CENTRE = 89;
const BOARD_H = 3.5, GLASS_H = 8;

export function frameOf(e, homeGoalie) {
  return homeGoalie ? { d: e.x + 89, w: -e.y } : { d: 89 - e.x, w: e.y };
}
export const distanceFt = s => Math.hypot(s.d, s.w);

/** Shots on goal and goals against `goalie`, up to and including event index `upto`. */
export function shotsAgainst(G, goalie, upto = Infinity) {
  const home = (G.roster[goalie] || {}).tid === G.teams.home.id;
  const out = [];
  G.events.forEach((e, i) => {
    if (i > upto || e.goalie !== goalie || e.x == null) return;
    if (e.type !== 'shot-on-goal' && e.type !== 'goal') return;
    if (e.pt === 'SO') return;
    const f = frameOf(e, home);
    out.push({ i, e, d: f.d, w: f.w, out: e.type === 'goal' ? 'goal' : 'save', who: e.actor,
               team: (G.roster[e.actor] || {}).tid, rem: e.rem, per: e.per });
  });
  return out;
}

/* Camera seats. `at` is the eye, `look` the point it looks at. */
export const SEATS = {
  crease: { label: 'His eyes',       at: [1.5, 0, 4.6],   look: [40, 0, 1.2] },
  net:    { label: 'Behind the net', at: [-9, 0, 6.2],    look: [30, 0, 0] },
  glass:  { label: 'On the glass',   at: [-4, -46, 12],   look: [26, 2, 0] },
  tv:     { label: 'TV angle',       at: [52, -78, 38],   look: [24, 0, 0] },
};

function camera(seat, W, H) {
  const [cd, cw, ch] = seat.at, [ld, lw, lh] = seat.look;
  const yaw = Math.atan2(lw - cw, ld - cd);
  const pitch = Math.atan2(lh - ch, Math.hypot(ld - cd, lw - cw));
  const focal = Math.min(H * 1.05, W * 0.62);
  return { cd, cw, ch, cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch),
           focal, ox: W / 2, oy: H * 0.5 };
}
/* World -> camera space: [depth, right, up]. */
function toCam(c, d, w, h) {
  const vd = d - c.cd, vw = w - c.cw, vh = h - c.ch;
  const d1 = vd * c.cy + vw * c.sy, w1 = -vd * c.sy + vw * c.cy;
  return [d1 * c.cp + vh * c.sp, w1, -d1 * c.sp + vh * c.cp];
}
const NEAR = 0.6;
const scr = (c, p) => ({ x: c.ox + c.focal * p[1] / p[0], y: c.oy - c.focal * p[2] / p[0], s: c.focal / p[0] });

/* Sutherland–Hodgman against the near plane, then project. */
function polygon(c, pts) {
  const cam = pts.map(p => toCam(c, p[0], p[1], p[2] || 0));
  const out = [];
  for (let k = 0; k < cam.length; k++) {
    const a = cam[k], b = cam[(k + 1) % cam.length];
    const ina = a[0] >= NEAR, inb = b[0] >= NEAR;
    if (ina) out.push(a);
    if (ina !== inb) {
      const t = (NEAR - a[0]) / (b[0] - a[0]);
      out.push([NEAR, a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])]);
    }
  }
  return out.map(p => scr(c, p));
}
function polyline(c, pts) {
  const segs = [];
  for (let k = 0; k + 1 < pts.length; k++) {
    let a = toCam(c, ...pts[k]), b = toCam(c, ...pts[k + 1]);
    if (a[0] < NEAR && b[0] < NEAR) continue;
    if (a[0] < NEAR || b[0] < NEAR) {
      const t = (NEAR - a[0]) / (b[0] - a[0]), m = [NEAR, a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
      if (a[0] < NEAR) a = m; else b = m;
    }
    segs.push([scr(c, a), scr(c, b)]);
  }
  return segs;
}
const point = (c, d, w, h = 0) => { const p = toCam(c, d, w, h); return p[0] < NEAR ? null : scr(c, p); };

function arc(cd, cw, r, a0, a1, n = 24, h = 0) {
  const pts = [];
  for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([cd + r * Math.cos(a), cw + r * Math.sin(a), h]); }
  return pts;
}
/* The boards: the whole sheet, our end at d = -11, the far end at d = 189. */
const FAR_GOAL = 178, FAR_END = FAR_GOAL + GOAL_TO_END;
function boardsOutline(h = 0) {
  const n = -GOAL_TO_END + CORNER, f = FAR_END - CORNER, cw = HALF_W - CORNER;
  return [...arc(f, -cw, CORNER, -Math.PI / 2, 0, 16, h), ...arc(f, cw, CORNER, 0, Math.PI / 2, 16, h),
    ...arc(n, cw, CORNER, Math.PI / 2, Math.PI, 16, h), ...arc(n, -cw, CORNER, Math.PI, 1.5 * Math.PI, 16, h)];
}
/* How wide the ice is at distance d (the corners round it off). */
function halfWidthAt(d) {
  const n = -GOAL_TO_END + CORNER, f = FAR_END - CORNER;
  const dx = d < n ? n - d : d > f ? d - f : 0;
  return HALF_W - CORNER + Math.sqrt(Math.max(0, CORNER * CORNER - dx * dx));
}

function fillPoly(g, P, style) {
  if (P.length < 3) return;
  g.beginPath(); g.moveTo(P[0].x, P[0].y);
  for (let k = 1; k < P.length; k++) g.lineTo(P[k].x, P[k].y);
  g.closePath(); g.fillStyle = style; g.fill();
}
function strokeLine(g, c, pts, style, ft) {
  for (const [a, b] of polyline(c, pts)) {
    const mid = (a.s + b.s) / 2;
    g.strokeStyle = style; g.lineWidth = Math.max(0.6, Math.min(ft * mid, 14));
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  }
}
function band(g, c, d, style, ft) {   // a line across the ice at distance d, `ft` wide
  const hw = halfWidthAt(d);
  fillPoly(g, polygon(c, [[d - ft / 2, -hw], [d + ft / 2, -hw], [d + ft / 2, hw], [d - ft / 2, hw]]), style);
}
function ring(g, c, cd, cw, r, style, ft) { strokeLine(g, c, arc(cd, cw, r, 0, 2 * Math.PI, 40), style, ft); }
function disc(g, c, cd, cw, r, style) { fillPoly(g, polygon(c, arc(cd, cw, r, 0, 2 * Math.PI, 20)), style); }

/**
 * Draw one frame.
 * opts: { seat, shots: [past], current: shot|null, colourOf(teamId), t, motion, labels }
 */
export function draw(g, W, H, opts) {
  const c = camera(SEATS[opts.seat] || SEATS.crease, W, H);
  g.clearRect(0, 0, W, H);
  // The building: dark stands above, a glow where the ice meets them.
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#101c27'); sky.addColorStop(0.55, '#1b2b3a'); sky.addColorStop(1, '#22374a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);

  // Glass, boards, and the yellow kick plate along their foot.
  const top = boardsOutline(GLASS_H), rim = boardsOutline(BOARD_H), kick = boardsOutline(0.7), base = boardsOutline(0);
  const L = base.length;
  for (let k = 0; k < L; k++) {
    const j = (k + 1) % L;
    fillPoly(g, polygon(c, [rim[k], rim[j], top[j], top[k]]), 'rgba(190,215,235,.10)');
    fillPoly(g, polygon(c, [kick[k], kick[j], rim[j], rim[k]]), '#f3f6f8');
    fillPoly(g, polygon(c, [base[k], base[j], kick[j], kick[k]]), '#f2c200');
  }
  strokeLine(g, c, [...rim, rim[0]], 'rgba(120,140,155,.6)', 0.15);

  // Ice.
  const ice = polygon(c, base);
  const ig = g.createLinearGradient(0, c.oy - 40, 0, H);
  ig.addColorStop(0, '#dfe9f0'); ig.addColorStop(1, '#f4f8fb');
  fillPoly(g, ice, ig);

  // Markings (feet): goal lines 2 in, blue lines and centre line 12 in.
  band(g, c, CENTRE, '#c8102e', 1);
  ring(g, c, CENTRE, 0, 15, 'rgba(31,79,168,.8)', 2 / 12);
  disc(g, c, CENTRE, 0, 0.5, '#1f4fa8');
  for (const [goal, dir] of [[FAR_GOAL, -1], [0, 1]]) {      // far end first, so ours paints over
    const at = k => goal + dir * k;
    band(g, c, goal, '#c8102e', 2 / 12);
    band(g, c, at(BLUE), '#1f4fa8', 1);
    for (const s of [-1, 1]) {
      ring(g, c, at(20), 22 * s, 15, 'rgba(200,16,46,.75)', 2 / 12);
      disc(g, c, at(20), 22 * s, 1, '#c8102e');
      disc(g, c, at(BLUE + 5), 22 * s, 1, '#c8102e');
    }
    // Crease: a 6 ft half-circle, painted blue.
    const cr = arc(goal, 0, 6, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI / 2 : 1.5 * Math.PI, 20);
    fillPoly(g, polygon(c, [[goal, -4], ...cr.map(p => [p[0], p[1]]), [goal, 4]]), 'rgba(120,180,230,.55)');
    strokeLine(g, c, cr, '#c8102e', 2 / 12);
    // The net: 6 ft wide, 4 ft tall, red pipes, white mesh, 40 in deep at the base.
    const back = goal - dir * 3.3, mid = goal - dir * 1.5;
    fillPoly(g, polygon(c, [[goal, -3, 0], [back, -2.5, 0], [back, 2.5, 0], [goal, 3, 0]]), 'rgba(255,255,255,.35)');
    fillPoly(g, polygon(c, [[goal, -3, 4], [mid, -2.6, 3.6], [back, -2.5, 0], [goal, -3, 0]]), 'rgba(255,255,255,.28)');
    fillPoly(g, polygon(c, [[goal, 3, 4], [mid, 2.6, 3.6], [back, 2.5, 0], [goal, 3, 0]]), 'rgba(255,255,255,.28)');
    strokeLine(g, c, [[goal, -3, 0], [goal, -3, 4], [goal, 3, 4], [goal, 3, 0]], '#d0102e', 0.2);
  }

  const colour = opts.colourOf || (() => '#5b6d7a');
  // Shots already faced: a disc on the ice where each was taken from. A goal keeps a red ring.
  const past = (opts.shots || []).slice().sort((a, b) => b.d - a.d);
  for (const s of past) {
    if (opts.current && s.i === opts.current.i) continue;
    disc(g, c, s.d, s.w, 1.1, colour(s.team) + 'cc');
    if (s.out === 'goal') ring(g, c, s.d, s.w, 1.9, '#e0102f', 0.45);
  }
  // The current shot: a person at true height, posed by the outcome.
  const cur = opts.current;
  if (cur) {
    const p = point(c, cur.d, cur.w);
    if (p) {
      if (cur.out === 'goal') {
        disc(g, c, cur.d, cur.w, 3.2, 'rgba(255,40,60,.28)');
        ring(g, c, cur.d, cur.w, 3.2, '#e0102f', 0.35);
      } else disc(g, c, cur.d, cur.w, 2.2, 'rgba(0,0,0,.18)');
      const size = sizeFor(PLAYER_FT) * p.s;
      FIG.mascot(g, p.x, p.y, Math.max(6, size), colour(cur.team), cur.out,
                 { t: opts.t || 0, motion: !!opts.motion, glow: cur.out === 'goal' });
      if (opts.labels !== false) {
        const txt = `${Math.round(distanceFt(cur))} ft · ${cur.out === 'goal' ? 'GOAL' : 'saved'}`;
        g.font = '700 12px system-ui,-apple-system,Segoe UI,sans-serif';
        const tw = g.measureText(txt).width + 12, ly = Math.max(14, p.y - size * 1.25 - 10);
        const lx = Math.max(tw / 2 + 4, Math.min(W - tw / 2 - 4, p.x));
        g.fillStyle = cur.out === 'goal' ? '#c8102e' : 'rgba(15,26,35,.82)';
        g.beginPath(); g.roundRect ? g.roundRect(lx - tw / 2, ly - 10, tw, 20, 10) : g.rect(lx - tw / 2, ly - 10, tw, 20); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, lx, ly + 0.5);
      }
    }
  }
}

/** A canvas sized to its box at device resolution, redrawn by `paint(g, W, H)`. */
export function mount(canvas, paint) {
  const g = canvas.getContext('2d');
  let W = 0, H = 0;
  const fit = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();
  addEventListener('resize', () => { fit(); paint(g, W, H); });
  return () => { if (!W) fit(); paint(g, W, H); };
}
