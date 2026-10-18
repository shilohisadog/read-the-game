/**
 * LAB — a skater built on a real rigged body (Quaternius Universal Base
 * Characters, CC0: src/lab/models/ubc/LICENSE.txt), dressed in hockey gear that
 * follows its bones every frame, and posed with two-bone IK from the shot type.
 *
 * Same interface as shot3d.js::skater(): { root, pose(name, t), H }.
 * Feet throughout. Pose frame: +x his right, +y up, +z toward the net.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { POSES } from './shot3d.js';

const MODEL_M = 1.81;                          // the model's height in metres, as shipped
const FT = 3.28084;
let base = null;
export function loadPlayer(url = new URL('./models/ubc/player.gltf', import.meta.url).href) {
  base ||= new GLTFLoader().loadAsync(url).then(g => g.scene);
  return base;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const wpos = o => o.getWorldPosition(new THREE.Vector3());

/* Turn a bone by a rotation given in WORLD space. */
function turn(bone, qWorld) {
  bone.parent.getWorldQuaternion(_q);
  bone.getWorldQuaternion(_q2);
  bone.quaternion.copy(_q.invert().multiply(qWorld.clone().multiply(_q2)));
  bone.updateMatrixWorld(true);
}
/* Aim `bone` so that `child` lies along the direction to `to`. */
function aim(bone, child, to) {
  const p = wpos(bone), from = wpos(child).sub(p).normalize(), want = to.clone().sub(p).normalize();
  turn(bone, new THREE.Quaternion().setFromUnitVectors(from, want));
}
/* Two-bone IK: a (shoulder/hip) -> b (elbow/knee) -> c (hand/foot) reaching `target`, bending toward `pole`. */
function ik(a, b, c, target, pole) {
  const A = wpos(a), l1 = wpos(b).distanceTo(A), l2 = wpos(c).distanceTo(wpos(b));
  const to = target.clone().sub(A), d = Math.min(Math.max(to.length(), 1e-3), (l1 + l2) * 0.999);
  const dir = to.normalize();
  const n = pole.clone().sub(A); n.sub(dir.clone().multiplyScalar(n.dot(dir))).normalize();
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const elbow = A.clone().add(dir.clone().multiplyScalar(l1 * cosA)).add(n.multiplyScalar(l1 * sinA));
  aim(a, b, elbow);
  aim(b, c, A.clone().add(dir.multiplyScalar(d)));
}

/* Gear that follows two points: a capsule (or lathe) stretched between them. */
function between(mesh, a, b, len0) {
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  const d = b.clone().sub(a);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
  mesh.scale.y = d.length() / len0;
}
/* Orient a mesh so its +y is `up` and its +z is as close to `fwd` as possible. */
function frame(mesh, up, fwd) {
  const y = up.clone().normalize(), x = new THREE.Vector3().crossVectors(y, fwd).normalize(), z = new THREE.Vector3().crossVectors(x, y);
  mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
function numberTex(num, colour) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'); g.fillStyle = colour; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#fff'; g.font = '800 80px system-ui,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(num ?? ''), 64, 70);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function makePlayer(model, { heightIn, hand, colour, number }) {
  const H = (heightIn || 73) / 12;
  const body = SkeletonUtils.clone(model);
  const s = H / (MODEL_M * FT) * 0.97;          // a little under, since skates add height
  body.scale.setScalar(s * FT);                  // metres -> feet, then to his height
  body.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const bone = n => body.getObjectByName(n);
  const B = {};
  for (const n of ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head',
    'clavicle_l', 'upperarm_l', 'lowerarm_l', 'hand_l', 'clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r',
    'thigh_l', 'calf_l', 'foot_l', 'ball_l', 'thigh_r', 'calf_r', 'foot_r', 'ball_r']) B[n] = bone(n);
  const rest = new Map(); body.traverse(o => { if (o.isBone) rest.set(o, { q: o.quaternion.clone(), p: o.position.clone() }); });

  const root = new THREE.Group(), turnRoot = new THREE.Group();
  // The model faces +z with its own +x on its LEFT; the pose frame has +x on his right.
  turnRoot.add(body); root.add(turnRoot);

  const M = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const jersey = M(colour, 0.8), pantsM = M(0x161b24, 0.85), dark = M(0x111418, 0.5), white = M(0xf4f4f4, 0.8);
  const steel = new THREE.MeshStandardMaterial({ color: 0xd5dbe0, metalness: 0.9, roughness: 0.2 });
  const gear = new THREE.Group(); gear.matrixAutoUpdate = false; root.add(gear);   // children placed in WORLD coordinates
  const add = m => { m.castShadow = true; gear.add(m); return m; };
  const lathe = (pts, mat, seg = 28) => add(new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat));
  const cap = (r, mat) => add(new THREE.Mesh(new THREE.CapsuleGeometry(r, 1, 6, 14), mat));
  // Profiles in feet, unit height, scaled each frame between joints.
  const torso = lathe([[0.62, 0], [0.68, 0.08], [0.70, 0.35], [0.80, 0.60], [0.92, 0.80], [0.86, 0.92], [0.46, 1.0], [0.24, 1.02]], jersey);
  const stripe = lathe([[0.69, 0], [0.705, 0.5], [0.69, 1]], white, 28);
  const pants = lathe([[0.48, 0], [0.62, 0.15], [0.66, 0.55], [0.60, 0.9], [0.52, 1.0]], pantsM);
  const parts = {};
  for (const sd of ['l', 'r']) {
    parts['up' + sd] = cap(0.29, jersey); parts['lo' + sd] = cap(0.25, jersey);
    parts['glove' + sd] = add(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.46), jersey));
    parts['cuff' + sd] = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 14), dark));
    parts['th' + sd] = cap(0.33, pantsM); parts['sock' + sd] = cap(0.22, jersey);
    parts['boot' + sd] = add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 1.05), dark));
    parts['blade' + sd] = add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 1.15), steel));
    parts['num' + sd] = add(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({ map: numberTex(number, '#' + new THREE.Color(colour).getHexString()) })));
  }
  const helmet = add(new THREE.Mesh(new THREE.SphereGeometry(0.47, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.56), dark));
  const visor = add(new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.2, 24, 1, true, -0.9, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xa8cbe8, transparent: true, opacity: 0.4, metalness: 0.3, roughness: 0.05, side: THREE.DoubleSide })));
  const stickM = M(0x24282e, 0.45), tapeM = M(0xffffff, 0.9);
  const shaft = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), stickM));
  const sblade = add(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.25, 0.05), stickM));
  const tape = add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.19, 0.06), tapeM));

  const mirror = hand === 'R' ? -1 : 1;           // POSES are written for a left shot
  const lerp = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);

  function pose(name, t) {
    for (const [o, r] of rest) { o.quaternion.copy(r.q); o.position.copy(r.p); }
    root.updateMatrixWorld(true);
    const P = POSES[name], k = Math.min(1, Math.floor(t)), f = t - k;
    const a = P.keys[k], b = P.keys[Math.min(2, k + 1)];
    const blade = lerp(a.blade, b.blade, f), top = lerp(a.top, b.top, f), bot = lerp(a.bot, b.bot, f);
    // Pose frame -> world: x his right (the model's -x), mirrored for a right shot.
    const W = (x, y, z) => turnRoot.localToWorld(V(-x * mirror, y, z));     // stick side: mirrored for a right shot
    const Wb = (x, y, z) => turnRoot.localToWorld(V(-x, y, z));             // the body itself: never mirrored
    const crouch = P.crouch * H, lean = P.lean;
    const up = V(0, 1, 0), fwd = turnRoot.localToWorld(V(0, 0, 1)).sub(turnRoot.localToWorld(V(0, 0, 0))).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, up).normalize();

    // Crouch: lower the hips; the legs bend to keep the skates on the ice.
    const pel = B.pelvis, pw = wpos(pel).add(V(0, -crouch, 0));
    pel.position.copy(pel.parent.worldToLocal(pw)); pel.updateMatrixWorld(true);
    // Lean forward from the waist, and a little twist toward the stick side.
    turn(B.spine_01, new THREE.Quaternion().setFromAxisAngle(right, lean * 0.55));
    turn(B.spine_02, new THREE.Quaternion().setFromAxisAngle(right, lean * 0.45));
    turn(B.spine_03, new THREE.Quaternion().setFromAxisAngle(up, -0.35 * mirror * (1 - f * (k ? 1 : 0))));
    // Feet planted: shoulder width, the stick-side foot a little back.
    for (const [sd, sx] of [['l', -1], ['r', 1]]) {
      const foot = Wb(sx * 0.78, 0.34, sx * mirror > 0 ? 0.35 : -0.35);
      const hip = wpos(B['thigh_' + sd]);
      ik(B['thigh_' + sd], B['calf_' + sd], B['foot_' + sd], foot, hip.clone().add(fwd.clone().multiplyScalar(3)).add(V(0, 0, 0)));
    }
    // Hands on the stick: the top hand is his right for a left shot.
    const topSide = mirror > 0 ? 'r' : 'l', botSide = mirror > 0 ? 'l' : 'r';
    const hands = { [topSide]: W(top[0], H * top[1] - crouch, top[2]), [botSide]: W(bot[0], H * bot[1] - crouch, bot[2]) };
    for (const sd of ['l', 'r']) {
      const sh = wpos(B['upperarm_' + sd]), out = right.clone().multiplyScalar(sd === 'l' ? -1 : 1);
      ik(B['upperarm_' + sd], B['lowerarm_' + sd], B['hand_' + sd], hands[sd], sh.clone().add(out.multiplyScalar(2)).add(V(0, -2, 0)).sub(fwd));
    }
    // Head up, eyes on the net.
    aim(B.neck_01, B.Head, wpos(B.neck_01).add(V(0, 1, 0)).add(fwd.clone().multiplyScalar(0.25)));
    root.updateMatrixWorld(true);

    // ---- gear follows the bones
    const J = n => wpos(B[n]);
    const hipC = J('pelvis'), chest = J('spine_03'), neck = J('neck_01'), head = J('Head');
    const tBase = hipC.clone().add(V(0, 0.15, 0)), tTop = neck.clone().add(V(0, 0.22, 0));
    torso.position.copy(tBase); frame(torso, tTop.clone().sub(tBase), fwd);
    torso.scale.set(1, tBase.distanceTo(tTop), 0.9);
    stripe.position.copy(tBase).add(tTop.clone().sub(tBase).multiplyScalar(0.06)); stripe.quaternion.copy(torso.quaternion);
    stripe.scale.set(1, 0.32, 0.9);
    pants.position.copy(hipC).add(V(0, -0.9, 0)); frame(pants, tTop.clone().sub(tBase), fwd); pants.scale.set(1.12, 1.35, 0.95);
    for (const sd of ['l', 'r']) {
      const sh = J('upperarm_' + sd), el = J('lowerarm_' + sd), hd = J('hand_' + sd);
      between(parts['up' + sd], sh, el, 1.48); between(parts['lo' + sd], el, hd, 1.42);
      parts['glove' + sd].position.copy(hd).add(hd.clone().sub(el).normalize().multiplyScalar(0.12));
      frame(parts['glove' + sd], hd.clone().sub(el), fwd);
      parts['cuff' + sd].position.copy(el.clone().lerp(hd, 0.82)); frame(parts['cuff' + sd], hd.clone().sub(el), fwd);
      parts['num' + sd].position.copy(sh.clone().lerp(el, 0.4)).add(right.clone().multiplyScalar((sd === 'l' ? -1 : 1) * 0.25));
      parts['num' + sd].lookAt(parts['num' + sd].position.clone().add(right.clone().multiplyScalar(sd === 'l' ? -1 : 1)).add(fwd.clone().multiplyScalar(0.4)));
      const th = J('thigh_' + sd), kn = J('calf_' + sd), ft = J('foot_' + sd), ball = J('ball_' + sd);
      between(parts['th' + sd], th, kn.clone().lerp(th, -0.08), 1.66); between(parts['sock' + sd], kn.clone().lerp(th, 0.12), ft, 1.44);
      const toe = ball.clone().sub(ft).setY(0).normalize();
      parts['boot' + sd].position.copy(ft).setY(0.3).add(toe.clone().multiplyScalar(0.18)); frame(parts['boot' + sd], up, toe);
      parts['blade' + sd].position.copy(parts['boot' + sd].position).setY(0.07); parts['blade' + sd].quaternion.copy(parts['boot' + sd].quaternion);
    }
    helmet.position.copy(head).add(V(0, 0.42 * H / 6.1, 0)).add(fwd.clone().multiplyScalar(0.02)); frame(helmet, up, fwd);
    helmet.scale.set(0.98, 1.0, 1.1);
    visor.position.copy(helmet.position).add(V(0, -0.05, 0)); frame(visor, up, fwd);
    // The stick: from just above the top hand, through the bottom hand, to the blade.
    const bladeW = W(blade[0], blade[1], blade[2]), topW = hands[topSide];
    const along = bladeW.clone().sub(topW).normalize(), butt = topW.clone().sub(along.clone().multiplyScalar(0.35));
    between(shaft, butt, bladeW, 1); shaft.scale.x = shaft.scale.z = 1;
    const toeW = bladeW.clone().add(right.clone().multiplyScalar(-0.9 * mirror)).add(fwd.clone().multiplyScalar(0.15));
    sblade.position.copy(bladeW.clone().add(toeW).multiplyScalar(0.5)).add(V(0, 0.09, 0));
    sblade.lookAt(toeW.clone().add(V(0, 0.09, 0))); sblade.rotateY(Math.PI / 2);
    tape.position.copy(sblade.position); tape.quaternion.copy(sblade.quaternion);
    gear.matrix.copy(root.matrixWorld).invert(); gear.updateMatrixWorld(true);
    return turnRoot.worldToLocal(bladeW.clone());
  }
  return { root, pose, H };
}

/**
 * The goaltender: who was in net is recorded, and his height and catching hand;
 * where he stood and how he moved are not. So he stands in his crease in a
 * ready stance, squared to the shooter — never a save motion.
 */
export function makeGoalie(model, { heightIn, catches, colour, number }) {
  const H = (heightIn || 74) / 12;
  const body = SkeletonUtils.clone(model);
  body.scale.setScalar(H / (MODEL_M * FT) * 0.97 * FT);
  body.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const B = {};
  for (const n of ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head', 'upperarm_l', 'lowerarm_l', 'hand_l',
    'upperarm_r', 'lowerarm_r', 'hand_r', 'thigh_l', 'calf_l', 'foot_l', 'ball_l', 'thigh_r', 'calf_r', 'foot_r', 'ball_r']) B[n] = body.getObjectByName(n);
  const rest = new Map(); body.traverse(o => { if (o.isBone) rest.set(o, { q: o.quaternion.clone(), p: o.position.clone() }); });
  const root = new THREE.Group(), turnRoot = new THREE.Group(); turnRoot.add(body); root.add(turnRoot);

  const M = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const jersey = M(colour, 0.8), white = M(0xf2f2f0, 0.55), dark = M(0x141820, 0.6), pantsM = M(0x161b24, 0.85);
  const gear = new THREE.Group(); gear.matrixAutoUpdate = false; root.add(gear);
  const add = m => { m.castShadow = true; gear.add(m); return m; };
  const lathe = (pts, mat) => add(new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 28), mat));
  const cap = (r, mat) => add(new THREE.Mesh(new THREE.CapsuleGeometry(r, 1, 6, 14), mat));
  // Chest protector under the jersey makes a goaltender broad and boxy.
  const torso = lathe([[0.72, 0], [0.80, 0.1], [0.84, 0.4], [0.96, 0.62], [1.06, 0.80], [0.98, 0.93], [0.5, 1.0], [0.26, 1.02]], jersey);
  const pants = lathe([[0.58, 0], [0.74, 0.15], [0.78, 0.55], [0.70, 0.9], [0.6, 1.0]], pantsM);
  const P = {};
  for (const sd of ['l', 'r']) {
    P['up' + sd] = cap(0.33, jersey); P['lo' + sd] = cap(0.29, jersey); P['th' + sd] = cap(0.36, pantsM);
    P['pad' + sd] = add(new THREE.Mesh(new THREE.BoxGeometry(0.92, 1, 0.42), white));
    P['padband' + sd] = add(new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.16, 0.44), jersey));
    P['boot' + sd] = add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 1.05), dark));
  }
  const glove = catches === 'R' ? 'r' : 'l', block = glove === 'l' ? 'r' : 'l';
  const catcher = add(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.3, 24), white));
  const pocket = add(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.32, 20), jersey));
  const blocker = add(new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.0, 0.14), white));
  const mask = add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 20), white));
  const cageTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.strokeStyle = '#1a1f26'; g.lineWidth = 5; for (let k = 6; k < 64; k += 14) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 64); g.moveTo(0, k); g.lineTo(64, k); g.stroke(); }
    return new THREE.CanvasTexture(cv); })();
  const cage = add(new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 14, -0.8, 1.6, 1.05, 0.95),
    new THREE.MeshStandardMaterial({ map: cageTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })));
  const stickM = M(0x24282e, 0.45);
  const shaft = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), stickM));
  const paddle = add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.07), stickM));
  const sblade = add(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.3, 0.07), stickM));

  function pose() {
    for (const [o, r] of rest) { o.quaternion.copy(r.q); o.position.copy(r.p); }
    root.updateMatrixWorld(true);
    const W = (x, y, z) => turnRoot.localToWorld(V(-x, y, z));
    const up = V(0, 1, 0), fwd = turnRoot.localToWorld(V(0, 0, 1)).sub(turnRoot.localToWorld(V(0, 0, 0))).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, up).normalize();
    const crouch = 0.27 * H, lean = 0.42;
    const pel = B.pelvis; pel.position.copy(pel.parent.worldToLocal(wpos(pel).add(V(0, -crouch, -0.1)))); pel.updateMatrixWorld(true);
    turn(B.spine_01, new THREE.Quaternion().setFromAxisAngle(right, lean * 0.6));
    turn(B.spine_02, new THREE.Quaternion().setFromAxisAngle(right, lean * 0.4));
    for (const [sd, sx] of [['l', -1], ['r', 1]]) {
      const hip = wpos(B['thigh_' + sd]);
      ik(B['thigh_' + sd], B['calf_' + sd], B['foot_' + sd], W(sx * 1.25, 0.34, 0.1), hip.clone().add(fwd.clone().multiplyScalar(3)).add(right.clone().multiplyScalar(-sx * 0.8)));
    }
    // Glove open at his side, blocker holding the stick, blade flat in front of the skates.
    const sideG = glove === 'r' ? 1 : -1;
    const hands = { [glove]: W(sideG * 1.15, 0.43 * H, 0.75), [block]: W(-sideG * 1.05, 0.36 * H, 0.65) };
    for (const sd of ['l', 'r']) {
      const sh = wpos(B['upperarm_' + sd]), out = right.clone().multiplyScalar(sd === 'l' ? -1 : 1);
      ik(B['upperarm_' + sd], B['lowerarm_' + sd], B['hand_' + sd], hands[sd], sh.clone().add(out.multiplyScalar(2)).add(V(0, -2, 0)).sub(fwd));
    }
    aim(B.neck_01, B.Head, wpos(B.neck_01).add(V(0, 1, 0)).add(fwd.clone().multiplyScalar(0.45)));
    root.updateMatrixWorld(true);
    const J = n => wpos(B[n]);
    const hipC = J('pelvis'), neck = J('neck_01'), head = J('Head');
    const tBase = hipC.clone().add(V(0, 0.1, 0)), tTop = neck.clone().add(V(0, 0.2, 0));
    torso.position.copy(tBase); frame(torso, tTop.clone().sub(tBase), fwd); torso.scale.set(1, tBase.distanceTo(tTop), 0.85);
    pants.position.copy(hipC).add(V(0, -0.85, 0)); frame(pants, tTop.clone().sub(tBase), fwd); pants.scale.set(1.1, 1.3, 0.95);
    for (const sd of ['l', 'r']) {
      const sh = J('upperarm_' + sd), el = J('lowerarm_' + sd), hd = J('hand_' + sd);
      between(P['up' + sd], sh, el, 1.66); between(P['lo' + sd], el, hd, 1.58);
      const th = J('thigh_' + sd), kn = J('calf_' + sd), ft = J('foot_' + sd), ball = J('ball_' + sd);
      between(P['th' + sd], th, kn, 1.72);
      // Leg pad: from above the knee to the boot, on the front of the shin.
      const top = kn.clone().add(V(0, 0.45, 0)).add(fwd.clone().multiplyScalar(0.3)), bot = ft.clone().setY(0.2).add(fwd.clone().multiplyScalar(0.35));
      P['pad' + sd].position.copy(top).add(bot).multiplyScalar(0.5); frame(P['pad' + sd], top.clone().sub(bot), fwd);
      P['pad' + sd].scale.y = top.distanceTo(bot);
      P['padband' + sd].position.copy(top.clone().lerp(bot, 0.3)); P['padband' + sd].quaternion.copy(P['pad' + sd].quaternion);
      const toe = ball.clone().sub(ft).setY(0).normalize();
      P['boot' + sd].position.copy(ft).setY(0.3).add(toe.multiplyScalar(0.18)); frame(P['boot' + sd], up, fwd);
    }
    const gh = J('hand_' + glove), bh = J('hand_' + block);
    catcher.position.copy(gh).add(fwd.clone().multiplyScalar(0.12)); frame(catcher, fwd, up);
    pocket.position.copy(catcher.position).add(fwd.clone().multiplyScalar(0.03)); pocket.quaternion.copy(catcher.quaternion);
    blocker.position.copy(bh).add(right.clone().multiplyScalar((block === 'r' ? 1 : -1) * 0.12)).add(fwd.clone().multiplyScalar(0.1));
    frame(blocker, up, fwd);
    mask.position.copy(head).add(V(0, 0.38 * H / 6.1, 0)).add(fwd.clone().multiplyScalar(0.05)); mask.scale.set(0.95, 1.08, 1.05);
    cage.position.copy(mask.position); frame(cage, up, fwd); cage.rotateY(Math.PI / 2);
    // Goalie stick: shaft from the blocker hand down to the paddle, paddle to the blade, flat on the ice.
    const bladeHeel = W(-sideG * 0.2, 0.15, 1.35), paddleTop = bladeHeel.clone().add(V(0, 2.1, 0)).add(fwd.clone().multiplyScalar(-0.35));
    between(shaft, bh, paddleTop, 1); shaft.scale.x = shaft.scale.z = 1;
    between(paddle, paddleTop, bladeHeel, 1); paddle.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI / 2));
    sblade.position.copy(bladeHeel).add(right.clone().multiplyScalar(sideG * 0.55)).setY(0.15); frame(sblade, up, fwd);
    gear.matrix.copy(root.matrixWorld).invert(); gear.updateMatrixWorld(true);
  }
  return { root, pose, H };
}
