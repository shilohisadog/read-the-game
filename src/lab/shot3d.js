/**
 * LAB — a recorded shot, seen from the crease. three.js, feet throughout.
 *
 * World: X = feet to the goaltender's right, Y = up, Z = -(feet out from the goal
 * line). The defended goal line is z = 0; the far one is z = -178.
 *
 * RECORDED, AND DRAWN: where the shot was taken from; saved or a goal; the shot
 * type; the shooter's team, number, height and handedness; who was in net.
 * NOT RECORDED, AND NOT DRAWN: the puck's path or height, its speed, where it
 * crossed the line, screens, and where the goaltender stood. So the line of fire
 * fades out at the crease, and the moment cuts from the release to the outcome.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const HALF_W = 42.5, CORNER = 28, GOAL_TO_END = 11, FAR_GOAL = 178, FAR_END = FAR_GOAL + GOAL_TO_END;
const PX = 20;                                     // ice texture: pixels per foot

/* ------------------------------------------------------------------ the rink */
function arcPts(cw, cd, r, a0, a1, n) {
  const p = [];
  for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; p.push([cw + r * Math.cos(a), cd + r * Math.sin(a)]); }
  return p;
}
/* The boards, as (w, d) points, counter-clockwise from our end. */
function outline() {
  const n = -GOAL_TO_END + CORNER, f = FAR_END - CORNER, c = HALF_W - CORNER;
  return [...arcPts(-c, n, CORNER, Math.PI, 1.5 * Math.PI, 14), ...arcPts(c, n, CORNER, 1.5 * Math.PI, 2 * Math.PI, 14),
    ...arcPts(c, f, CORNER, 0, Math.PI / 2, 14), ...arcPts(-c, f, CORNER, Math.PI / 2, Math.PI, 14)];
}

function iceTexture() {
  const W = 85 * PX, H = 200 * PX, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const P = (w, d) => [(w + HALF_W) * PX, (FAR_END - d) * PX];
  g.fillStyle = '#f3f7fa'; g.fillRect(0, 0, W, H);
  // A faint grain, so the surface reads as ice and not paper.
  for (let k = 0; k < 9000; k++) {
    g.fillStyle = `rgba(${150 + Math.random() * 40},${170 + Math.random() * 40},${190 + Math.random() * 30},${Math.random() * 0.05})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 6, 1 + Math.random() * 2);
  }
  const line = (d, ft, col) => { g.fillStyle = col; const [, y] = P(0, d); g.fillRect(0, y - ft * PX / 2, W, ft * PX); };
  const ring = (w, d, r, col, ft) => { const [x, y] = P(w, d); g.strokeStyle = col; g.lineWidth = ft * PX; g.beginPath(); g.arc(x, y, r * PX, 0, 7); g.stroke(); };
  const dot = (w, d, r, col) => { const [x, y] = P(w, d); g.fillStyle = col; g.beginPath(); g.arc(x, y, r * PX, 0, 7); g.fill(); };
  const RED = '#c8102e', BLUE = '#1f4fa8';
  line(89, 1, RED);
  g.save(); g.setLineDash([PX * 1.2, PX * 0.6]); g.strokeStyle = '#f3f7fa'; g.lineWidth = PX * 0.25;
  { const [, y] = P(0, 89); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore();
  ring(0, 89, 15, BLUE, 2 / 12); dot(0, 89, 0.5, BLUE);
  { const [x, y] = P(-HALF_W, 89); g.strokeStyle = RED; g.lineWidth = PX * 2 / 12; g.beginPath(); g.arc(x, y, 10 * PX, -Math.PI / 2, Math.PI / 2); g.stroke(); }
  for (const [goal, dir] of [[0, 1], [FAR_GOAL, -1]]) {
    const at = k => goal + dir * k;
    line(goal, 2 / 12, RED); line(at(64), 1, BLUE);
    for (const s of [-1, 1]) {
      ring(22 * s, at(20), 15, RED, 2 / 12); dot(22 * s, at(20), 1, RED); dot(22 * s, at(69), 1, RED);
      // Hash marks on the faceoff circles.
      g.fillStyle = RED;
      for (const hs of [-1, 1]) for (const vs of [-1, 1]) {
        const [x, y] = P(22 * s + hs * 2.875, at(20) + vs * 14.8); g.fillRect(x - PX / 12, y - PX, PX / 6, PX * 2 * vs * -0.5 + PX);
      }
    }
    // Crease: a 6 ft half-circle, painted blue; and the trapezoid behind the net.
    const [cx, cy] = P(0, goal);
    g.fillStyle = 'rgba(105,170,230,.6)'; g.beginPath();
    g.arc(cx, cy, 6 * PX, dir > 0 ? Math.PI : 0, dir > 0 ? 2 * Math.PI : Math.PI); g.fill();
    g.strokeStyle = RED; g.lineWidth = PX * 2 / 12; g.stroke();
    for (const s of [-1, 1]) { const a = P(9 * s, goal), b = P(14 * s, goal - dir * GOAL_TO_END); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function ribbon(pts, y0, y1, mat) {
  const pos = [], idx = [];
  pts.forEach(([w, d]) => { pos.push(w, y0, -d, w, y1, -d); });
  for (let k = 0; k < pts.length; k++) {
    const a = 2 * k, b = 2 * ((k + 1) % pts.length);
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

function net(goal, dir) {
  const grp = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xd0102e, roughness: 0.35, metalness: 0.3 });
  const z = -goal, back = dir * 3.33;              // the net's back is toward the end boards
  const path = new THREE.CurvePath();
  const v = (w, h, zz) => new THREE.Vector3(w, h, zz);
  path.add(new THREE.LineCurve3(v(-3, 0, z), v(-3, 4, z)));
  path.add(new THREE.LineCurve3(v(-3, 4, z), v(3, 4, z)));
  path.add(new THREE.LineCurve3(v(3, 4, z), v(3, 0, z)));
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(path, 60, 0.1, 10, false), red));
  const base = new THREE.CatmullRomCurve3([v(-3, 0.05, z), v(-2.6, 0.05, z + back * 0.8), v(0, 0.05, z + back), v(2.6, 0.05, z + back * 0.8), v(3, 0.05, z)]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(base, 40, 0.06, 8, false), new THREE.MeshStandardMaterial({ color: 0xeeeeee })));
  // Mesh: a fine white grid, see-through.
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2;
  for (let k = 0; k <= 64; k += 8) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 64); g.moveTo(0, k); g.lineTo(64, k); g.stroke(); }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 4);
  const mesh = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const sheet = (a, b, c, d) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    geo.computeVertexNormals(); grp.add(new THREE.Mesh(geo, mesh));
  };
  const B = (w, h, k) => [w, h, z + back * k];
  sheet(B(-3, 0, 0), B(-3, 4, 0), B(-2.4, 3, 0.6), B(-2.6, 0, 0.8));          // side
  sheet(B(3, 0, 0), B(3, 4, 0), B(2.4, 3, 0.6), B(2.6, 0, 0.8));              // side
  sheet(B(-2.4, 3, 0.6), B(2.4, 3, 0.6), B(3, 4, 0), B(-3, 4, 0));           // roof
  sheet(B(-2.6, 0, 0.8), B(2.6, 0, 0.8), B(2.4, 3, 0.6), B(-2.4, 3, 0.6));    // back
  return grp;
}

function crowdTexture() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 64;
  const g = cv.getContext('2d'); g.fillStyle = '#141c26'; g.fillRect(0, 0, 512, 64);
  const tones = ['#3a4656', '#5a4a4a', '#6b5b52', '#2e3a4a', '#7a6a5a', '#4a5568', '#8a7a6a', '#33404f'];
  for (let k = 0; k < 1400; k++) {
    g.fillStyle = tones[k % tones.length];
    const x = Math.random() * 512, y = Math.random() * 64;
    g.beginPath(); g.arc(x, y, 1.6 + Math.random() * 1.4, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/* Stands: solid stepped tiers rising away from the glass, the treads crowded. */
function stands(scene) {
  const out = outline(), rows = 16;
  const ringAt = r => out.map(([w, d]) => {
    const cx = w, cd = d - 89, L = Math.hypot(cx / 1.25, cd) || 1, grow = 7 + r * 3;
    return [w + (cx / L) * grow * 1.25, d + (cd / L) * grow];
  });
  const hAt = r => 6 + r * 2.1;
  const riser = new THREE.MeshStandardMaterial({ color: 0x10161e, roughness: 0.95, side: THREE.DoubleSide });
  const crowd = crowdTexture(); crowd.repeat.set(40, 1);
  const tread = new THREE.MeshStandardMaterial({ map: crowd, roughness: 0.95, side: THREE.DoubleSide });
  for (let r = 0; r < rows; r++) {
    const a = ringAt(r), b = ringAt(r + 1), h0 = hAt(r), h1 = hAt(r + 1);
    scene.add(ribbon(a, h0, h1, riser));
    const pos = [], uv = [], idx = [], n = a.length;
    for (let k = 0; k < n; k++) {
      pos.push(a[k][0], h1, -a[k][1], b[k][0], h1, -b[k][1]);
      uv.push(k / n, 0, k / n, 1);
    }
    for (let k = 0; k < n; k++) { const p = 2 * k, q = 2 * ((k + 1) % n); idx.push(p, q, p + 1, q, q + 1, p + 1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo, tread));
  }
}

/* ------------------------------------------------------------------ a skater */
function capsule(r, len, mat) { return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat); }
/* A limb from a to b: a capsule stretched and turned to join them. */
function limb(mesh, a, b) {
  const mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a), L = dir.length();
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  const P = mesh.geometry.parameters;   // a capsule has length + radius; a cylinder has height
  const base = P.height != null ? P.height : P.length + 2 * P.radius;
  mesh.scale.set(1, Math.max(0.05, L / base + (P.height != null ? 0 : 0.08)), 1);
}
function numberTex(num, fg, bg) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
  const g = cv.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  g.fillStyle = fg; g.font = '800 78px system-ui,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(num ?? ''), 64, 70);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* Poses, in the skater's own frame: +x his right, +y up, +z toward the net.
   Feet (H = his height in feet). Blade / hands for a LEFT shot (blade on his
   left); a right shot mirrors x. Three keys: load, contact, follow-through. */
const POSES = {
  wrist:     { lean: 0.22, crouch: 0.10, keys: [
    { blade: [-1.5, 0.05, -0.5], top: [0.05, 0.60, 0.15], bot: [-0.55, 0.47, 0.30] },
    { blade: [-1.0, 0.05, 1.1],  top: [0.10, 0.60, 0.35], bot: [-0.45, 0.47, 0.70] },
    { blade: [-0.35, 1.05, 2.4], top: [0.25, 0.70, 0.55], bot: [-0.20, 0.62, 1.05] }] },
  slap:      { lean: 0.25, crouch: 0.12, keys: [
    { blade: [-1.2, 6.8, -2.6],  top: [-0.30, 0.86, -0.30], bot: [-0.70, 0.80, -0.55] },
    { blade: [-0.9, 0.05, 0.6],  top: [0.10, 0.58, 0.25], bot: [-0.55, 0.45, 0.55] },
    { blade: [-0.2, 2.8, 3.0],   top: [0.25, 0.76, 0.60], bot: [-0.10, 0.70, 1.00] }] },
  backhand:  { lean: 0.20, crouch: 0.10, keys: [
    { blade: [1.5, 0.05, -0.4],  top: [-0.05, 0.60, 0.15], bot: [0.45, 0.47, 0.30] },
    { blade: [0.9, 0.05, 1.0],   top: [-0.10, 0.60, 0.35], bot: [0.40, 0.48, 0.65] },
    { blade: [0.4, 1.2, 2.2],    top: [-0.20, 0.70, 0.50], bot: [0.20, 0.64, 0.95] }] },
  tip:       { lean: 0.32, crouch: 0.16, keys: [
    { blade: [-0.7, 0.05, 2.0],  top: [0.05, 0.56, 0.30], bot: [-0.30, 0.46, 0.75] },
    { blade: [-0.5, 0.05, 2.2],  top: [0.05, 0.55, 0.32], bot: [-0.28, 0.45, 0.80] },
    { blade: [-0.5, 0.05, 2.2],  top: [0.05, 0.55, 0.32], bot: [-0.28, 0.45, 0.80] }] },
};
export const poseOf = type => ({ snap: 'wrist', wrist: 'wrist', slap: 'slap', backhand: 'backhand',
  'wrap-around': 'backhand', 'tip-in': 'tip', deflected: 'tip', bat: 'tip' }[type] || 'wrist');

export function skater({ heightIn, hand, colour, number }) {
  const H = (heightIn || 73) / 12;
  const jersey = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.75 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15191f, roughness: 0.6 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe9c4a0, roughness: 0.7 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xcfd6dc, metalness: 0.9, roughness: 0.25 });
  const stickM = new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.5 });
  const tape = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const root = new THREE.Group(), parts = {};
  const add = (k, m) => { parts[k] = m; m.castShadow = true; root.add(m); return m; };
  for (const s of ['L', 'R']) {
    add('thigh' + s, capsule(0.30, H * 0.12, pants)); add('shin' + s, capsule(0.19, H * 0.17, jersey));
    add('boot' + s, new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 1.0), dark));
    add('blade' + s, new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 1.15), steel));
    add('upper' + s, capsule(0.18, H * 0.11, jersey)); add('fore' + s, capsule(0.16, H * 0.10, jersey));
    add('glove' + s, capsule(0.19, 0.18, jersey));
  }
  const lathe = (pts, mat) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 28), mat);
  // Profiles in feet, bottom to top: jersey over shoulder pads, and hockey pants.
  add('torso', lathe([[0.58, 0], [0.62, 0.25], [0.60, 0.7], [0.70, 1.15], [0.78, 1.45], [0.72, 1.62], [0.45, 1.78], [0.22, 1.84]], jersey));
  add('pants', lathe([[0.50, 0], [0.62, 0.15], [0.66, 0.55], [0.60, 0.85], [0.56, 0.95]], pants));
  add('hem', new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.68, 0.22, 20), white));
  add('neck', capsule(0.18, 0.12, skin));
  add('head', new THREE.Mesh(new THREE.SphereGeometry(0.43, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), dark));   // helmet shell
  add('face', new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), skin));
  add('visor', new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x9fc6e8, transparent: true, opacity: 0.45, metalness: 0.4, roughness: 0.1 })));
  const num = new THREE.MeshStandardMaterial({ map: numberTex(number, '#ffffff', '#' + new THREE.Color(colour).getHexString()), roughness: 0.75 });
  add('numL', new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), num)); add('numR', new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), num));
  add('shaft', new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 8), stickM));
  add('stblade', new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.05), stickM));
  add('sttape', new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.06), tape));

  const mirror = hand === 'R' ? -1 : 1;    // poses are written for a left shot
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const lerp = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);

  /* Place every part for pose `name` at time t in [0, 2] across its three keys. */
  function pose(name, t) {
    const P = POSES[name], k = Math.min(1, Math.floor(t)), f = t - k;
    const a = P.keys[k], b = P.keys[Math.min(2, k + 1)];
    const blade = lerp(a.blade, b.blade, f), top = lerp(a.top, b.top, f), bot = lerp(a.bot, b.bot, f);
    const X = x => x * mirror;
    const crouch = P.crouch * H, lean = P.lean;
    const hip = V(0, H * 0.50 - crouch, -0.05), chest = V(0, 0, 0);
    const head = V(0, 0, 0);
    for (const [s, sx] of [['L', -1], ['R', 1]]) {
      const footZ = sx * mirror > 0 ? -0.55 : 0.55;
      const foot = V(sx * 0.62, 0.32, footZ), knee = V(sx * 0.55, H * 0.27 - crouch * 0.4, footZ + 0.55 + crouch * 0.4);
      const hipS = V(sx * 0.33, hip.y, hip.z);
      limb(parts['thigh' + s], hipS, knee); limb(parts['shin' + s], knee, foot);
      parts['boot' + s].position.set(foot.x, 0.27, foot.z + 0.15);
      parts['blade' + s].position.set(foot.x, 0.06, foot.z + 0.15);
    }
    parts.pants.position.set(0, hip.y - 0.45, hip.z); parts.pants.scale.set(1.0, 1, 0.8);
    // The torso tips forward from the waist by the pose's lean.
    const waist = V(0, hip.y + 0.45, hip.z + 0.02);
    parts.torso.position.copy(waist); parts.torso.rotation.set(lean, 0, 0); parts.torso.scale.set(1, (H * 0.27) / 1.84, 0.72);
    const neckTop = waist.clone().add(V(0, Math.cos(lean) * H * 0.27, Math.sin(lean) * H * 0.27));
    parts.hem.position.copy(waist).add(V(0, 0.05, 0)); parts.hem.rotation.x = lean; parts.hem.scale.set(0.9, 1, 0.75);
    limb(parts.neck, neckTop.clone().add(V(0, -0.1, 0)), neckTop.clone().add(V(0, 0.32, 0.05)));
    head.copy(neckTop).add(V(0, 0.48, 0.08));
    chest.copy(waist).add(V(0, Math.cos(lean) * H * 0.205, Math.sin(lean) * H * 0.205));
    parts.head.position.copy(head).add(V(0, 0.04, -0.02)); parts.head.scale.set(1, 1.05, 1.12);
    parts.face.position.copy(head).add(V(0, -0.06, 0.04)); parts.face.scale.set(0.92, 1.05, 0.95);
    parts.visor.position.copy(head).add(V(0, 0.06, 0.36));
    const sh = { L: V(-0.66, chest.y + 0.10, chest.z - 0.02), R: V(0.66, chest.y + 0.10, chest.z - 0.02) };
    // The top hand is his right for a left shot, the bottom hand his left.
    const hands = { [mirror > 0 ? 'R' : 'L']: V(X(top[0]), H * top[1] - crouch, top[2]),
                    [mirror > 0 ? 'L' : 'R']: V(X(bot[0]), H * bot[1] - crouch, bot[2]) };
    for (const s of ['L', 'R']) {
      const a = sh[s], h = hands[s], mid = a.clone().add(h).multiplyScalar(0.5);
      const elbow = mid.add(V((s === 'L' ? -1 : 1) * 0.35, -0.25, -0.1));
      limb(parts['upper' + s], a, elbow); limb(parts['fore' + s], elbow, h);
      parts['glove' + s].position.copy(h);
      parts['num' + s].position.copy(a.clone().lerp(elbow, 0.45)).add(V((s === 'L' ? -1 : 1) * 0.2, 0, 0.05));
      parts['num' + s].lookAt(parts['num' + s].position.clone().add(V(s === 'L' ? -1 : 1, 0, 0.6)));
    }
    // The stick: from just above the top hand, through the bottom hand, to the blade.
    const B = V(X(blade[0]), blade[1], blade[2]), T = hands[mirror > 0 ? 'R' : 'L'];
    const along = B.clone().sub(T).normalize(), butt = T.clone().sub(along.clone().multiplyScalar(0.35));
    limb(parts.shaft, butt, B); parts.shaft.scale.x = parts.shaft.scale.z = 1;
    const heel = B.clone(), toe = heel.clone().add(V(X(-0.9), 0, 0.15));
    parts.stblade.position.copy(heel.clone().add(toe).multiplyScalar(0.5)).add(V(0, 0.08, 0));
    parts.stblade.lookAt(toe.clone().add(V(0, 0.08, 0))); parts.stblade.rotateY(Math.PI / 2);
    parts.sttape.position.copy(parts.stblade.position); parts.sttape.quaternion.copy(parts.stblade.quaternion);
    return B;
  }
  return { root, pose, H };
}

/* ------------------------------------------------------------------ the scene */
export function stage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b121a);
  scene.fog = new THREE.Fog(0x0b121a, 160, 420);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x1a2230, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-30, 90, 20); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 220 });
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.5); fill.position.set(40, 70, -120); scene.add(fill);

  // Ice: the outline as a shape in (w, d), laid flat; UVs mapped to the marking texture.
  const shape = new THREE.Shape(outline().map(([w, d]) => new THREE.Vector2(w, d)));
  const geo = new THREE.ShapeGeometry(shape, 24);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (pos.getX(k) + HALF_W) / 85, (pos.getY(k) + GOAL_TO_END) / 200);
  const ice = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: iceTexture(), roughness: 0.18, metalness: 0.0, envMapIntensity: 0.6 }));
  ice.rotation.x = -Math.PI / 2; ice.receiveShadow = true; scene.add(ice);

  const O = outline();
  scene.add(ribbon(O, 0, 0.7, new THREE.MeshStandardMaterial({ color: 0xf2c200, side: THREE.DoubleSide, roughness: 0.5 })));
  scene.add(ribbon(O, 0.7, 3.5, new THREE.MeshStandardMaterial({ color: 0xf4f6f8, side: THREE.DoubleSide, roughness: 0.55 })));
  scene.add(ribbon(O, 3.5, 3.75, new THREE.MeshStandardMaterial({ color: 0x2a3644, side: THREE.DoubleSide })));
  scene.add(ribbon(O, 3.75, 9.5, new THREE.MeshPhysicalMaterial({ color: 0xcfe6f5, transparent: true, opacity: 0.12,
    roughness: 0.05, side: THREE.DoubleSide, depthWrite: false })));
  scene.add(net(0, 1), net(FAR_GOAL, -1));
  stands(scene);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.3, 600);
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    // Keep a wide horizontal view on a landscape phone and a sane one on a tall screen.
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(72) / 2) / camera.aspect));
    camera.fov = Math.min(68, Math.max(34, camera.fov));
    base = camera.fov;
    camera.updateProjectionMatrix();
  }
  let base = 50;
  return { THREE, renderer, scene, camera, size, baseFov: () => base };
}

/* The line of fire: from the blade toward the middle of the net, fading out at
   the crease edge (6 ft). Its direction, never the puck's path. */
export function lineOfFire(from) {
  const f = new THREE.Vector2(from.x, from.z), L = f.length() - 6;   // the net mouth is the origin
  if (L <= 0.5) return null;
  const dir = f.clone().multiplyScalar(-1 / f.length()), end = f.clone().add(dir.clone().multiplyScalar(L));
  const side = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(0.22);
  const cv = document.createElement('canvas'); cv.width = 8; cv.height = Math.max(32, Math.round(L * 12));
  const g = cv.getContext('2d');
  for (let y = 0; y < cv.height; y += 12) {              // dashes; canvas top = the shooter's end
    g.fillStyle = `rgba(16,28,44,${(0.85 * (1 - y / cv.height)).toFixed(3)})`; g.fillRect(0, y, 8, 7);
  }
  const tex = new THREE.CanvasTexture(cv);
  const P = (v, s) => [v.x + side.x * s, 0.03, v.y + side.y * s];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([...P(f, -1), ...P(f, 1), ...P(end, 1), ...P(f, -1), ...P(end, 1), ...P(end, -1)], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], 2));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
}
