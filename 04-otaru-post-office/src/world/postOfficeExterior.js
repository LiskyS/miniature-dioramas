import * as THREE from 'three';
import { POST, SNOW_Y } from '../config.js';
import {
  addContactShadow,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  rng,
  tubeFromPoints,
  TAU,
} from '../core/utils.js';

const P = POST;
const W = P.x1 - P.x0;
const D = P.z1 - P.z0;
const CX = (P.x0 + P.x1) / 2;
const CZ = (P.z0 + P.z1) / 2;
const FRONT_Z = P.z1 - 0.1;

function box(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, { cast: opts.cast ?? true, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function rounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, { cast: opts.cast ?? true, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function snowCap(x, y, z, sx, sy, sz, R, parent) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2), R.snowDrift);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function panel(parent, w, h, tex, x, y, z, opts = {}) {
  const m = new THREE.Mesh(planeGeo(w, h), new THREE.MeshBasicMaterial({
    map: tex,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    depthWrite: opts.depthWrite ?? true,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
  m.position.set(x, y, z);
  m.rotation.y = opts.rotY ?? 0;
  m.renderOrder = opts.renderOrder ?? 2;
  parent.add(m);
  return m;
}

function addGlassPane(parent, assets, R, x, y, z, w, h, opts = {}) {
  const glass = new THREE.Mesh(planeGeo(w, h), opts.door ? R.glassDoor : R.glass);
  glass.position.set(x, y, z);
  glass.rotation.y = opts.rotY ?? 0;
  glass.renderOrder = 3;
  parent.add(glass);
  const frost = new THREE.Mesh(planeGeo(w, h), new THREE.MeshBasicMaterial({
    map: assets.frost,
    transparent: true,
    opacity: opts.frost ?? 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
  frost.position.set(x + (opts.frostDx ?? 0.006), y, z + (opts.frostDz ?? 0.006));
  frost.rotation.y = opts.rotY ?? 0;
  frost.renderOrder = 4;
  parent.add(frost);
  const sheen = new THREE.Mesh(planeGeo(w, h), new THREE.MeshBasicMaterial({
    map: assets.streak,
    transparent: true,
    opacity: opts.sheen ?? 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    color: 0xd9e9ee,
  }));
  sheen.position.set(x + (opts.sheenDx ?? 0.01), y, z + (opts.sheenDz ?? 0.01));
  sheen.rotation.y = opts.rotY ?? 0;
  sheen.renderOrder = 4;
  parent.add(sheen);
  return glass;
}

function addWindow(parent, assets, R, x, y, z, w, h, cols, rows, opts = {}) {
  const frame = opts.frameMat ?? R.trim;
  const t = opts.border ?? 0.09;
  const depth = opts.depth ?? 0.12;
  const zFront = z;
  // Outer frame.
  box(parent, w + t * 2, t, depth, frame, x, y + h / 2 + t / 2, zFront, { cast: true });
  box(parent, w + t * 2, t, depth, frame, x, y - h / 2 - t / 2, zFront, { cast: true });
  box(parent, t, h + t * 2, depth, frame, x - w / 2 - t / 2, y, zFront, { cast: true });
  box(parent, t, h + t * 2, depth, frame, x + w / 2 + t / 2, y, zFront, { cast: true });
  // Inner mullions.
  for (let i = 1; i < cols; i++) {
    box(parent, 0.045, h, depth * 0.62, frame, x - w / 2 + (w / cols) * i, y, zFront + 0.01);
  }
  for (let j = 1; j < rows; j++) {
    box(parent, w, 0.045, depth * 0.62, frame, x, y - h / 2 + (h / rows) * j, zFront + 0.01);
  }
  addGlassPane(parent, assets, R, x, y, zFront - 0.035, w, h, {
    frost: opts.frost ?? 0.3,
    sheen: opts.sheen ?? 0.12,
  });
  // Sill, with snow.
  const sill = box(parent, w + 0.3, 0.09, 0.24, R.trim, x, y - h / 2 - t + 0.02, zFront + 0.08, { cast: true });
  snowCap(x, y - h / 2 - t + 0.09, zFront + 0.1, (w + 0.23) * 0.48, 0.055, 0.12, R, parent);
  return { frame, glass: sill };
}

function buildFoundation(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  rounded(g, W + 0.36, 0.33, D + 0.36, 0.06, R.foundation, CX, P.floorY - 0.17, CZ, { cast: true, receive: true });
  box(g, W + 0.46, 0.13, D + 0.46, R.foundationDark, CX, SNOW_Y + 0.045, CZ, { cast: false });
  // Stone footing clumps and snow.
  const RNG = rng(6041);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const x = CX + Math.cos(a) * (W * 0.53);
    const z = CZ + Math.sin(a) * (D * 0.53);
    rounded(g, 0.5 + RNG() * 0.3, 0.2 + RNG() * 0.12, 0.36, 0.03, R.foundationDark, x, SNOW_Y + 0.1, z, { cast: false });
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    const x = CX + Math.cos(a) * (W * 0.56);
    const z = CZ + Math.sin(a) * (D * 0.52);
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), R.snowDrift);
    m.position.set(x, SNOW_Y + 0.06, z);
    m.scale.set(0.45 + RNG() * 0.5, 0.09 + RNG() * 0.08, 0.3 + RNG() * 0.3);
    g.add(m);
  }
  // Little front step landing.
  rounded(g, 2.6, 0.11, 0.75, 0.025, R.stone, -1.7, SNOW_Y + 0.18, 2.05, { cast: true });
  rounded(g, 2.2, 0.09, 0.55, 0.025, R.stone, -1.7, SNOW_Y + 0.27, 1.83, { cast: true });
  const stepSnow = snowCap(-1.7, SNOW_Y + 0.25, 2.2, 1.26, 0.05, 0.16, R, g);
  assembly.add(g, { start: 2.05, duration: 0.8, mode: 'rise', distance: 0.6, land: true, landAt: [CX, SNOW_Y, CZ] });
  return root;
}

function buildWalls(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const wallY = (P.floorY + P.wallTop) / 2;
  const wallH = P.wallTop - P.floorY;
  const stub = 0.12;
  // Back and west walls.
  box(g, W, wallH, 0.26, R.stucco, CX, wallY, P.z0 + 0.13);
  box(g, 0.26, wallH, D, R.stucco, P.x0 + 0.13, wallY, CZ);
  // East wall around a side window.
  const swZ0 = -1.25;
  const swZ1 = 0.9;
  const swY0 = 1.15;
  const swY1 = 2.82;
  box(g, 0.26, swY0 - P.floorY, D, R.stucco, P.x1 - 0.13, (P.floorY + swY0) / 2, CZ);
  box(g, 0.26, P.wallTop - swY1, D, R.stucco, P.x1 - 0.13, (swY1 + P.wallTop) / 2, CZ);
  box(g, 0.26, swY1 - swY0, swZ0 - P.z0, R.stucco, P.x1 - 0.13, (swY0 + swY1) / 2, (P.z0 + swZ0) / 2);
  box(g, 0.26, swY1 - swY0, P.z1 - swZ1, R.stucco, P.x1 - 0.13, (swY0 + swY1) / 2, (swZ1 + P.z1) / 2);
  // Front wall pieces around the openings.
  const topFrameY = P.wallTop;
  box(g, 0.45, topFrameY - P.floorY, 0.3, R.stucco, P.x0 + 0.225, (P.floorY + topFrameY) / 2, FRONT_Z);
  box(g, 0.6, topFrameY - P.floorY, 0.3, R.stucco, P.x1 - 0.3, (P.floorY + topFrameY) / 2, FRONT_Z);
  // Under the left window.
  box(g, P.leftWinX1 - P.leftWinX0, P.leftWinY0 - P.floorY, 0.3, R.stucco,
    (P.leftWinX0 + P.leftWinX1) / 2, (P.floorY + P.leftWinY0) / 2, FRONT_Z);
  // Between the left window and door.
  box(g, P.entranceX0 - P.leftWinX1, topFrameY - P.floorY, 0.3, R.stucco,
    (P.leftWinX1 + P.entranceX0) / 2, (P.floorY + topFrameY) / 2, FRONT_Z);
  // Between door and the big window.
  box(g, P.bigWinX0 - P.entranceX1, topFrameY - P.floorY, 0.3, R.stucco,
    (P.entranceX1 + P.bigWinX0) / 2, (P.floorY + topFrameY) / 2, FRONT_Z);
  // Below the big window.
  box(g, P.bigWinX1 - P.bigWinX0, P.bigWinY0 - P.floorY, 0.3, R.stucco,
    (P.bigWinX0 + P.bigWinX1) / 2, (P.floorY + P.bigWinY0) / 2, FRONT_Z);
  // Header above the opening, full width.
  box(g, W, topFrameY - P.bigWinY1, 0.34, R.stucco, CX, (P.bigWinY1 + topFrameY) / 2, FRONT_Z);
  // Front corner boards and base trim.
  for (const x of [P.x0 + 0.2, P.x1 - 0.2]) {
    box(g, 0.16, wallH + 0.06, 0.38, R.trim, x, wallY + 0.03, FRONT_Z + 0.02);
  }
  box(g, W, 0.16, 0.42, R.trim, CX, P.floorY + 0.08, FRONT_Z + 0.02);
  box(g, W + 0.06, 0.13, 0.38, R.trim, CX, P.wallTop - 0.04, FRONT_Z + 0.02);
  for (const x of [P.x0 + 0.2, P.x1 - 0.2]) {
    box(g, 0.13, wallH, 0.4, R.trim, x, wallY, P.z1 - 0.16);
    box(g, 0.13, wallH, 0.4, R.trim, x, wallY, P.z0 + 0.1);
  }
  // White service board near the side door.
  box(g, 0.08, 0.55, 0.8, R.trim, P.x1 + 0.01, 1.05, -4.15);
  // Gable triangle, front (pale yellow).
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0);
  shape.lineTo(W / 2, 0);
  shape.lineTo(0, P.ridgeY - P.wallTop);
  shape.closePath();
  const gableGeo = new THREE.ShapeGeometry(shape);
  const gable = new THREE.Mesh(gableGeo, R.stucco);
  gable.position.set(CX, P.wallTop, P.z1 - 0.16);
  gable.castShadow = true;
  gable.receiveShadow = true;
  g.add(gable);
  // White bargeboards should read as clean framing.
  for (const side of [-1, 1]) {
    const len = Math.hypot(W / 2, P.ridgeY - P.wallTop);
    const board = meshBox(0.14, 0.16, len, R.trim,
      CX + side * W / 4, P.wallTop + (P.ridgeY - P.wallTop) / 2, P.z1 - 0.03);
    board.rotation.z = side * Math.atan2(P.ridgeY - P.wallTop, W / 2);
    g.add(board);
  }
  // Snow on the gable shoulders.
  snowCap(CX - W * 0.38, P.wallTop + 0.02, P.z1 + 0.05, 0.6, 0.07, 0.18, R, g);
  snowCap(CX + W * 0.38, P.wallTop + 0.02, P.z1 + 0.05, 0.6, 0.07, 0.18, R, g);
  assembly.add(g, { start: 2.25, duration: 1.0, mode: 'grow', land: true, landAt: [CX, P.floorY, CZ] });
  return { root, group: g, swZ0, swZ1, swY0, swY1 };
}

function buildGlazing(scene, assets, R, assembly, walls) {
  const root = new THREE.Group();
  scene.add(root);
  const frames = new THREE.Group();
  root.add(frames);
  const glass = new THREE.Group();
  root.add(glass);
  // Left window, three columns by three rows.
  addWindow(frames, assets, R, (P.leftWinX0 + P.leftWinX1) / 2, (P.leftWinY0 + P.leftWinY1) / 2, FRONT_Z + 0.13,
    P.leftWinX1 - P.leftWinX0, P.leftWinY1 - P.leftWinY0, 3, 3, { frost: 0.27 });
  // Big front window bank, split by two heavy white piers.
  const bankW = P.bigWinX1 - P.bigWinX0;
  const bankY = (P.bigWinY0 + P.bigWinY1) / 2;
  const bankH = P.bigWinY1 - P.bigWinY0;
  const piers = [P.bigWinX0 + bankW / 3, P.bigWinX0 + bankW * 2 / 3];
  const glassW = bankW / 3 - 0.05;
  for (let i = 0; i < 3; i++) {
    const cx = P.bigWinX0 + (i + 0.5) * bankW / 3;
    addWindow(frames, assets, R, cx, bankY, FRONT_Z + 0.13, glassW, bankH, i === 1 ? 1 : 3, 1, { frost: 0.28, sheen: 0.15 });
  }
  for (const px of piers) {
    box(frames, 0.16, bankH + 0.22, 0.2, R.trim, px, bankY, FRONT_Z + 0.11, { cast: true });
  }
  // Big continuous sill and header trim.
  box(frames, bankW + 0.25, 0.12, 0.32, R.trim, (P.bigWinX0 + P.bigWinX1) / 2, P.bigWinY0 - 0.06, FRONT_Z + 0.14);
  box(frames, bankW + 0.25, 0.13, 0.28, R.trim, (P.bigWinX0 + P.bigWinX1) / 2, P.bigWinY1 + 0.06, FRONT_Z + 0.12);
  // East side window.
  const swCz = (walls.swZ0 + walls.swZ1) / 2;
  const swCy = (walls.swY0 + walls.swY1) / 2;
  const sx = P.x1 + 0.02;
  box(frames, 0.18, 0.1, walls.swZ1 - walls.swZ0 + 0.18, R.trim, sx + 0.06, walls.swY0 - 0.05, swCz);
  box(frames, 0.18, 0.1, walls.swZ1 - walls.swZ0 + 0.18, R.trim, sx + 0.06, walls.swY1 + 0.05, swCz);
  box(frames, 0.18, walls.swY1 - walls.swY0 + 0.2, 0.1, R.trim, sx + 0.06, swCy, walls.swZ0 - 0.05);
  box(frames, 0.18, walls.swY1 - walls.swY0 + 0.2, 0.1, R.trim, sx + 0.06, swCy, walls.swZ1 + 0.05);
  for (let i = 1; i < 3; i++) {
    box(frames, 0.06, walls.swY1 - walls.swY0, 0.08, R.trim, sx + 0.08, swCy, walls.swZ0 + (walls.swZ1 - walls.swZ0) * i / 3);
  }
  for (let j = 1; j < 3; j++) {
    box(frames, 0.09, 0.06, walls.swZ1 - walls.swZ0, R.trim, sx + 0.08, walls.swY0 + (walls.swY1 - walls.swY0) * j / 3, swCz);
  }
  addGlassPane(frames, assets, R, sx + 0.09, swCy, swCz, walls.swZ1 - walls.swZ0, walls.swY1 - walls.swY0, {
    rotY: Math.PI / 2, frost: 0.25, sheen: 0.1,
  });
  // Side window sill snow.
  snowCap(sx + 0.17, walls.swY0 - 0.04, swCz, 0.12, 0.06, (walls.swZ1 - walls.swZ0) * 0.5, R, frames);
  // Warm interior projection under the front windows.
  const glowTex = assets.glow;
  const spill = new THREE.Mesh(planeGeo(7.8, 2.4), new THREE.MeshBasicMaterial({
    map: glowTex,
    color: 0xffd7a6,
    transparent: true,
    opacity: 0.06,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0.2, SNOW_Y + 0.08, 2.8);
  spill.renderOrder = 2;
  glass.add(spill);
  assembly.add(frames, { start: 2.65, duration: 0.9, mode: 'grow', land: false });
  assembly.add(glass, { start: 2.85, duration: 0.8, mode: 'fade' });
  return { root, frames, glass };
}

function buildEntrance(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const z = P.z1 + 0.1;
  const doorW = P.entranceX1 - P.entranceX0;
  const cx = (P.entranceX0 + P.entranceX1) / 2;
  // Heavy white outer frame.
  box(g, doorW + 0.3, 0.1, 0.22, R.trim, cx, P.floorY + 0.04, z, { cast: true });
  box(g, 0.12, 2.34, 0.22, R.trim, P.entranceX0 - 0.06, P.floorY + 1.17, z);
  box(g, 0.12, 2.34, 0.22, R.trim, P.entranceX1 + 0.06, P.floorY + 1.17, z);
  box(g, doorW + 0.3, 0.12, 0.22, R.trim, cx, P.floorY + 2.34, z);
  // Two glass leaves with white stiles.
  const leafW = doorW / 2 - 0.03;
  for (const side of [-1, 1]) {
    const lx = cx + side * (doorW / 4 + 0.01);
    box(g, leafW, 2.2, 0.07, R.glassDoor, lx, P.floorY + 1.14, z + 0.02, { cast: false });
    // We build a light frame around each glass leaf.
    box(g, 0.06, 2.18, 0.09, R.trim, lx - leafW / 2 + 0.03, P.floorY + 1.14, z + 0.035);
    box(g, 0.06, 2.18, 0.09, R.trim, lx + leafW / 2 - 0.03, P.floorY + 1.14, z + 0.035);
    box(g, leafW, 0.06, 0.09, R.trim, lx, P.floorY + 2.2, z + 0.035);
    box(g, leafW, 0.12, 0.09, R.trim, lx, P.floorY + 0.09, z + 0.035);
    box(g, leafW, 0.055, 0.09, R.trim, lx, P.floorY + 1.14, z + 0.035);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 6), R.metalLight);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(lx + side * 0.22, P.floorY + 1.12, z + 0.1);
    handle.castShadow = true;
    g.add(handle);
  }
  // Glass frosted corners.
  const frost = new THREE.Mesh(planeGeo(doorW - 0.1, 2.08), new THREE.MeshBasicMaterial({
    map: assets.frost,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
  frost.position.set(cx, P.floorY + 1.14, z + 0.055);
  frost.renderOrder = 5;
  g.add(frost);
  // Small pale canopy above the entrance, beneath the sign.
  const canopy = new THREE.Group();
  canopy.position.set(-1.7, 3.22, 2.4);
  const canopyTop = rounded(canopy, 2.7, 0.13, 1.12, 0.03, R.trim, 0, 0, 0, { cast: true });
  const canopySnow = snowCap(0, 0.12, 0, 1.34, 0.12, 0.51, R, canopy);
  root.add(canopy);
  for (const sx of [-1.15, 1.15]) {
    const bracket = tubeFromPoints([
      new THREE.Vector3(-1.7 + sx, 3.05, P.z1 + 0.16),
      new THREE.Vector3(-1.7 + sx, 3.18, 2.05),
      new THREE.Vector3(-1.7 + sx, 3.27, 2.45),
    ], 0.027, R.trim, { segments: 6, radialSegments: 4 });
    root.add(bracket);
  }
  // Entrance light: a small warm globe under the canopy.
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), R.whiteGlobe);
  globe.position.set(cx, 3.03, 2.05);
  root.add(globe);
  const pl = new THREE.PointLight(0xffddb0, 0, 3.8, 2.0);
  pl.position.set(cx, 2.96, 2.03);
  root.add(pl);
  assembly.addLight(pl, { start: 4.55, duration: 0.9, intensity: 2.2 });
  // Mat at the threshold.
  const mat = new THREE.Mesh(planeGeo(1.3, 0.72), R.metalDark);
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(cx, P.floorY + 0.012, 2.32);
  root.add(mat);
  assembly.add(g, { start: 2.85, duration: 0.9, mode: 'rise', distance: 0.55, land: true, landAt: [cx, P.floorY, P.z1] });
  assembly.add(canopy, { start: 3.45, duration: 0.75, mode: 'drop', distance: 0.5, land: false });
  return { root, light: pl };
}

function buildRoof(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const halfSpan = W / 2 + 0.72;
  const rise = P.ridgeY - P.eaveY;
  const angle = Math.atan2(rise, halfSpan);
  const slopeLen = Math.hypot(halfSpan, rise);
  const zLen = D + 0.7;
  const zCenter = CZ;
  for (const side of [-1, 1]) {
    const cx = CX + side * halfSpan / 2;
    const cy = P.eaveY + rise / 2;
    const panel = box(g, slopeLen, 0.16, zLen, R.roof, cx, cy, zCenter, { cast: true });
    panel.rotation.z = -side * angle;
    const snow = box(g, slopeLen + 0.1, 0.2, zLen + 0.04, R.snow, cx + side * 0.01, cy + 0.14, zCenter, { cast: true });
    snow.rotation.z = -side * angle;
    // Eave board and snow lip.
    const eaveX = CX + side * halfSpan;
    box(g, 0.2, 0.22, zLen + 0.2, R.trim, eaveX, P.eaveY - 0.03, zCenter, { cast: true });
    snowCap(eaveX - side * 0.04, P.eaveY + 0.09, zCenter, 0.2, 0.13, zLen * 0.47, R, g);
    // Rafter tails.
    for (let i = 0; i < 11; i++) {
      box(g, 0.58, 0.07, 0.1, R.trimShade, eaveX - side * 0.12, P.eaveY - 0.08, P.z0 - 0.55 + i * 0.76);
    }
  }
  // Ridge cap.
  box(g, 0.3, 0.16, zLen + 0.1, R.trimShade, CX, P.ridgeY + 0.05, zCenter);
  snowCap(CX, P.ridgeY + 0.18, zCenter, 0.17, 0.12, zLen * 0.5, R, g);
  // White bargeboards along the front slopes.
  for (const side of [-1, 1]) {
    const board = meshBox(0.15, 0.2, slopeLen + 0.2, R.trim,
      CX + side * halfSpan / 2, P.eaveY + rise / 2, P.z1 + 0.38);
    board.rotation.z = -side * angle;
    g.add(board);
    const snowEdge = meshBox(0.18, 0.1, slopeLen + 0.16, R.snowPlain,
      CX + side * halfSpan / 2, P.eaveY + rise / 2 + 0.12, P.z1 + 0.4);
    snowEdge.rotation.z = -side * angle;
    g.add(snowEdge);
  }
  // Snow clumps at the front eave corners.
  const RNG = rng(9110);
  for (let i = 0; i < 3; i++) {
    const x = i === 0 ? P.x0 - 0.2 : i === 1 ? P.x1 + 0.2 : -1.8;
    snowCap(x, P.eaveY + 0.1, P.z1 + 0.35, 0.3 + RNG() * 0.16, 0.1, 0.18, R, g);
  }
  // Icicles under the side eaves.
  const iceGeo = new THREE.ConeGeometry(0.035, 1, 5);
  iceGeo.rotateX(Math.PI);
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: '#d7e7ec',
    roughness: 0.18,
    metalness: 0.02,
    transparent: true,
    opacity: 0.8,
    clearcoat: 0.6,
  });
  const icicles = new THREE.InstancedMesh(iceGeo, iceMat, 18);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 18; i++) {
    const side = i < 9 ? 1 : -1;
    const j = i % 9;
    const x = CX + side * (halfSpan - 0.15);
    const z = P.z0 - 0.25 + j * 0.78 + (RNG() - 0.5) * 0.2;
    const len = 0.14 + RNG() * 0.42;
    m.compose(new THREE.Vector3(x, P.eaveY - 0.17, z), new THREE.Quaternion(), new THREE.Vector3(0.7 + RNG() * 0.5, len, 0.7 + RNG() * 0.5));
    icicles.setMatrixAt(i, m);
  }
  icicles.instanceMatrix.needsUpdate = true;
  g.add(icicles);
  assembly.add(g, { start: 3.05, duration: 0.95, mode: 'drop', distance: 1.2, land: true, landAt: [CX, 4.8, CZ] });
  return root;
}

function buildSignage(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Main sign panel.
  box(g, 6.0, 0.8, 0.09, R.trim, CX, P.signY, P.z1 + 0.06, { cast: true });
  panel(g, 5.86, 0.72, assets.sign, CX, P.signY, P.z1 + 0.12);
  snowCap(CX, P.signY + 0.34, P.z1 + 0.08, 3.18, 0.065, 0.13, R, g);
  // Clock in the gable.
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.29, 32), R.clock);
  clock.position.set(CX, P.clockY, P.z1 - 0.02);
  g.add(clock);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.032, 6, 28), R.trimShade);
  rim.position.copy(clock.position);
  rim.position.z += 0.02;
  g.add(rim);
  snowCap(CX, P.clockY - 0.28, P.z1 + 0.03, 0.31, 0.05, 0.08, R, g);
  // Opening-hours plaque on the wall beside the door.
  box(g, 0.58, 0.72, 0.06, R.trim, -2.71, 2.16, P.z1 + 0.02, { cast: false });
  panel(g, 0.48, 0.6, assets.hours, -2.71, 2.16, P.z1 + 0.06);
  // Small postal mark sign on the side of the entrance.
  const mark = new THREE.Mesh(planeGeo(0.28, 0.28), R.postboxSymbol);
  mark.position.set(-2.9, 2.95, P.z1 + 0.03);
  mark.renderOrder = 3;
  g.add(mark);
  assembly.add(g, { start: 3.45, duration: 0.75, mode: 'pop' });
  return root;
}

function buildSideDetails(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Side service door.
  box(g, 0.06, 2.0, 0.82, R.trim, P.x1 + 0.02, 1.68, -4.15, { cast: true });
  box(g, 0.03, 1.82, 0.68, R.doorWood, P.x1 + 0.06, 1.65, -4.15, { cast: false });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), R.brass);
  knob.position.set(P.x1 + 0.09, 1.45, -3.87);
  g.add(knob);
  // AC unit.
  rounded(g, 0.6, 0.55, 0.88, 0.035, R.trimShade, P.x1 + 0.45, SNOW_Y + 0.45, -3.0, { cast: true });
  for (let i = 0; i < 7; i++) {
    box(g, 0.02, 0.025, 0.64, R.trimDark, P.x1 + 0.77, SNOW_Y + 0.28 + i * 0.055, -3.0, { cast: false });
  }
  snowCap(P.x1 + 0.45, SNOW_Y + 0.74, -3.0, 0.34, 0.08, 0.45, R, g);
  // Gutter downspout.
  const down = tubeFromPoints([
    new THREE.Vector3(P.x1 - 0.04, P.eaveY + 0.1, P.z1 + 0.5),
    new THREE.Vector3(P.x1 + 0.12, P.eaveY - 0.4, P.z1 + 0.5),
    new THREE.Vector3(P.x1 + 0.12, P.floorY + 0.1, P.z1 + 0.5),
    new THREE.Vector3(P.x1 + 0.12, SNOW_Y + 0.04, P.z1 + 0.5),
  ], 0.035, R.gutter, { segments: 10, radialSegments: 6 });
  g.add(down);
  // Wall vents and a tiny utility box.
  box(g, 0.05, 0.32, 0.46, R.trimShade, P.x1 + 0.02, 0.88, -1.9);
  for (let i = 0; i < 4; i++) {
    box(g, 0.02, 0.018, 0.38, R.trimDark, P.x1 + 0.05, 0.76 + i * 0.07, -1.9);
  }
  box(g, 0.14, 0.42, 0.32, R.metal, P.x1 + 0.1, 1.68, -2.55);
  // A small postal crate at the service door.
  rounded(g, 0.6, 0.4, 0.45, 0.03, R.parcel, P.x1 + 0.38, SNOW_Y + 0.27, -4.75, { cast: true });
  snowCap(P.x1 + 0.38, SNOW_Y + 0.48, -4.75, 0.3, 0.05, 0.23, R, g);
  assembly.add(g, { start: 3.55, duration: 0.8, mode: 'fade' });
  return root;
}

function buildRoofSnowDetails(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const RNG = rng(6811);
  // Snow rollers along both main roof slopes, just below the ridge.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const z = P.z0 - 0.45 + i * 0.85 + (RNG() - 0.5) * 0.2;
      const x = CX + side * (1.0 + RNG() * 0.6);
      const y = P.ridgeY - 0.25 - RNG() * 0.35;
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 5, 0, TAU, 0, Math.PI / 2), R.snow);
      m.scale.set(0.3 + RNG() * 0.2, 0.08, 0.35 + RNG() * 0.2);
      m.position.set(x, y, z);
      g.add(m);
    }
  }
  assembly.add(g, { start: 3.5, duration: 0.7, mode: 'fade' });
  return root;
}

export function buildPostOfficeExterior(scene, assets, R, assembly) {
  const foundation = buildFoundation(scene, R, assembly);
  const walls = buildWalls(scene, R, assembly);
  const glazing = buildGlazing(scene, assets, R, assembly, walls);
  const entrance = buildEntrance(scene, assets, R, assembly);
  const roof = buildRoof(scene, R, assembly);
  const signage = buildSignage(scene, assets, R, assembly);
  const sideDetails = buildSideDetails(scene, assets, R, assembly);
  const roofSnow = buildRoofSnowDetails(scene, R, assembly);
  return {
    foundation, walls, glazing, entrance, roof, signage, sideDetails, roofSnow,
    porchLight: entrance.light,
  };
}







