import * as THREE from 'three';
import { CABIN, SNOW_Y } from '../config.js';
import {
  addContactShadow,
  canvasTexture,
  makeGroup,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  roundedBoxGeo,
  tubeFromPoints,
  TAU,
} from '../core/utils.js';

const C = CABIN;
const FLOOR = C.floorY;
const WALL_H = C.wallTop - C.floorY;
const RIDGE_X = (C.x0 + C.x1) / 2;
const HALF_W = (C.x1 - C.x0) / 2;

function addBox(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, {
    cast: opts.cast ?? true,
    receive: opts.receive ?? true,
    round: opts.round,
    radius: opts.radius ?? 0.025,
  });
  parent.add(m);
  return m;
}

function addRounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, {
    cast: opts.cast ?? true,
    receive: opts.receive ?? true,
  });
  parent.add(m);
  return m;
}

function addLabel(parent, w, h, texture, x, y, z, rotation = [0, 0, 0], opts = {}) {
  const m = new THREE.Mesh(planeGeo(w, h), new THREE.MeshBasicMaterial({
    map: texture,
    transparent: opts.transparent ?? true,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
    alphaTest: 0.01,
    blending: opts.blending ?? THREE.NormalBlending,
  }));
  m.position.set(x, y, z);
  m.rotation.set(...rotation);
  m.renderOrder = opts.renderOrder ?? 2;
  parent.add(m);
  return m;
}

function makeTriangleGable(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  return geo;
}

function makeSnowCap(x, y, z, sx, sy, sz, R) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 7, 0, TAU, 0, Math.PI / 2), R.snowCap);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.receiveShadow = true;
  return m;
}

function addWindowPanel(parent, assets, R, x, y, z, w, h, opts = {}) {
  const glass = new THREE.Mesh(planeGeo(w, h), R.glass);
  glass.position.set(x, y, z);
  glass.renderOrder = 2;
  parent.add(glass);
  if (opts.frost !== false) {
    const frost = new THREE.Mesh(planeGeo(w * 1.01, h * 1.01), new THREE.MeshBasicMaterial({
      map: assets.frost,
      transparent: true,
      opacity: opts.frostOpacity ?? 0.38,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }));
    frost.position.set(x, y, z + (z > C.z1 - 0.1 ? 0.012 : 0.012));
    frost.renderOrder = 3;
    parent.add(frost);
  }
  const streak = new THREE.Mesh(planeGeo(w * 1.02, h * 1.02), new THREE.MeshBasicMaterial({
    map: assets.glassStreak,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    color: 0xbcd8e6,
  }));
  streak.position.set(x, y, z + 0.02);
  streak.renderOrder = 3;
  parent.add(streak);
  return glass;
}

function addWindowFrame(parent, R, x, y, z, w, h, opts = {}) {
  const t = opts.thickness ?? 0.075;
  const depth = opts.depth ?? 0.11;
  const mat = opts.mat ?? R.woodTrimDark;
  addBox(parent, w + t * 2, t, depth, mat, x, y + h / 2 + t / 2, z, { cast: true });
  addBox(parent, w + t * 2, t, depth, mat, x, y - h / 2 - t / 2, z, { cast: true });
  addBox(parent, t, h + t * 2, depth, mat, x - w / 2 - t / 2, y, z, { cast: true });
  addBox(parent, t, h + t * 2, depth, mat, x + w / 2 + t / 2, y, z, { cast: true });
  if (opts.mullionX !== undefined) {
    for (const mx of opts.mullionX) {
      addBox(parent, t * 0.7, h, depth * 0.8, mat, mx, y, z);
    }
  }
  if (opts.mullionY !== undefined) {
    for (const my of opts.mullionY) {
      addBox(parent, w, t * 0.6, depth * 0.8, mat, x, my, z);
    }
  }
}

function buildFoundation(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const stoneMat = R.stone;
  addRounded(g, 9.0, 0.34, 6.1, 0.045, stoneMat, -0.5, SNOW_Y + 0.17, -1.7, { cast: true, receive: true });
  addRounded(g, 9.2, 0.15, 6.3, 0.04, R.stoneDark, -0.5, SNOW_Y + 0.04, -1.7, { cast: false, receive: true });
  // Slight irregular stone footings.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = -0.5 + Math.cos(a) * 4.7;
    const z = -1.7 + Math.sin(a) * 3.2;
    addRounded(g, 0.55 + (i % 3) * 0.2, 0.2 + (i % 2) * 0.08, 0.4, 0.04, R.stoneDark, x, SNOW_Y + 0.1, z, { cast: true });
  }
  const drift = makeSnowCap(-0.5, SNOW_Y + 0.27, -1.7, 4.3, 0.06, 2.9, R);
  g.add(drift);
  assembly.add(g, { start: 2.05, duration: 0.85, mode: 'rise', distance: 0.7, land: true, landAt: [-0.5, SNOW_Y, -1.7] });
  return root;
}

function buildExteriorWalls(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);

  // Stone foundation is handled separately; these are the log walls.
  const wallY = FLOOR + WALL_H / 2;
  addBox(g, 8.6, WALL_H, 0.3, R.wood, -0.5, wallY, C.z0 + 0.16, { cast: true });
  addBox(g, 0.3, WALL_H, 5.6, R.wood, C.x0 + 0.15, wallY, -1.7, { cast: true });

  // East wall, split around a large side window.
  const swZ0 = -2.3;
  const swZ1 = -0.1;
  const swY0 = 0.95;
  const swY1 = 2.98;
  const eastDepth = 5.6;
  addBox(g, 0.3, 0.35, eastDepth, R.wood, C.x1 - 0.15, FLOOR + 0.175, -1.7, { cast: true });
  addBox(g, 0.3, C.wallTop - swY1, eastDepth, R.wood, C.x1 - 0.15, swY1 + (C.wallTop - swY1) / 2, -1.7, { cast: true });
  // rear solid segment
  addBox(g, 0.3, swY1 - swY0, swZ0 - C.z0, R.wood, C.x1 - 0.15, (swY0 + swY1) / 2, (C.z0 + swZ0) / 2, { cast: true });
  // front solid segment
  addBox(g, 0.3, swY1 - swY0, C.z1 - swZ1, R.wood, C.x1 - 0.15, (swY0 + swY1) / 2, (swZ1 + C.z1) / 2, { cast: true });

  // Front framing: left return and right return, with a broad glazed opening.
  addBox(g, 0.9, WALL_H, 0.3, R.wood, C.x0 + 0.45, wallY, C.z1 - 0.14, { cast: true });
  addBox(g, 0.55, WALL_H, 0.3, R.wood, C.x1 - 0.275, wallY, C.z1 - 0.14, { cast: true });
  // door bay is a solid timber panel with the arched door applied on top
  addBox(g, 2.0, 2.5, 0.24, R.woodPlank, -2.9, FLOOR + 1.25, C.z1 - 0.12, { cast: true });
  addBox(g, 2.0, 0.65, 0.24, R.wood, -2.9, C.wallTop - 0.325, C.z1 - 0.12, { cast: true });
  addBox(g, 2.0, 0.4, 0.24, R.wood, -2.9, FLOOR + 0.2, C.z1 - 0.12, { cast: true });
  // Corner log columns and exposed ends.
  for (const [x, z] of [[C.x0 + 0.1, C.z1 - 0.06], [C.x1 - 0.1, C.z1 - 0.06], [C.x0 + 0.1, C.z0 + 0.06], [C.x1 - 0.1, C.z0 + 0.06]]) {
    addBox(g, 0.34, WALL_H + 0.08, 0.34, R.woodTrimDark, x, wallY, z, { cast: true });
    for (let i = 0; i < 10; i++) {
      const log = meshCyl(0.11, 0.11, 0.22, R.bark, x, FLOOR + 0.2 + i * 0.31, z + (z > -1 ? 0.18 : -0.18), 7);
      log.rotation.x = Math.PI / 2;
      g.add(log);
    }
  }
  // Heavy header and sill beams on the front.
  addBox(g, 8.65, 0.22, 0.38, R.woodTrim, -0.5, C.glassTop + 0.05, C.z1 - 0.02, { cast: true });
  addBox(g, 8.65, 0.18, 0.34, R.woodTrim, -0.5, FLOOR + 0.1, C.z1 - 0.02, { cast: true });
  addBox(g, 8.65, 0.36, 0.3, R.wood, -0.5, C.wallTop - 0.18, C.z1 - 0.06, { cast: true });
  // Main window lower rail and posts.
  addBox(g, 5.4, 0.15, 0.3, R.woodTrim, 0.7, 0.9, C.z1 + 0.01, { cast: true });

  assembly.add(g, { start: 2.3, duration: 1.0, mode: 'grow', land: true, landAt: [-0.5, FLOOR, -1.7] });
  return { root, group: g, swZ0, swZ1, swY0, swY1 };
}

function buildGlazing(scene, assets, R, assembly, walls) {
  const root = new THREE.Group();
  scene.add(root);
  const frame = new THREE.Group();
  root.add(frame);
  const glass = new THREE.Group();
  root.add(glass);
  const z = C.z1 + 0.09;
  // Main front windows: two large panes between heavy timber posts.
  addWindowFrame(frame, R, -0.65, 2.0, z, 2.3, 2.2, { mullionX: [-0.65], mullionY: [2.55] });
  addWindowFrame(frame, R, 2.05, 2.0, z, 2.45, 2.2, { mullionX: [2.05], mullionY: [2.55] });
  addWindowPanel(glass, assets, R, -0.65, 2.0, z + 0.01, 2.3, 2.2, { frostOpacity: 0.35 });
  addWindowPanel(glass, assets, R, 2.05, 2.0, z + 0.01, 2.45, 2.2, { frostOpacity: 0.32 });
  // Vertical mullions at the edges of the glass wall.
  for (const x of [-1.82, 0.62, 3.3]) {
    addBox(frame, 0.11, 2.22, 0.14, R.woodTrim, x, 2.0, z, { cast: true });
  }
  // Side window (a real opening in the east wall).
  const sx = C.x1 + 0.015;
  const swZ0 = walls.swZ0;
  const swZ1 = walls.swZ1;
  const swY0 = walls.swY0;
  const swY1 = walls.swY1;
  const swCz = (swZ0 + swZ1) / 2;
  const swCy = (swY0 + swY1) / 2;
  const sideFrame = new THREE.Group();
  frame.add(sideFrame);
  addBox(sideFrame, 0.18, 0.12, swZ1 - swZ0 + 0.2, R.woodTrim, sx + 0.06, swY0 - 0.06, swCz);
  addBox(sideFrame, 0.18, 0.12, swZ1 - swZ0 + 0.2, R.woodTrim, sx + 0.06, swY1 + 0.06, swCz);
  addBox(sideFrame, 0.18, swY1 - swY0 + 0.2, 0.12, R.woodTrim, sx + 0.06, swCy, swZ0 - 0.06);
  addBox(sideFrame, 0.18, swY1 - swY0 + 0.2, 0.12, R.woodTrim, sx + 0.06, swCy, swZ1 + 0.06);
  addBox(sideFrame, 0.16, swY1 - swY0, 0.09, R.woodTrim, sx + 0.08, swCy, swCz);
  const sideGlass = new THREE.Mesh(planeGeo(swZ1 - swZ0, swY1 - swY0), R.glass);
  sideGlass.rotation.y = Math.PI / 2;
  sideGlass.position.set(sx + 0.1, swCy, swCz);
  sideGlass.renderOrder = 2;
  glass.add(sideGlass);
  const sideFrost = new THREE.Mesh(planeGeo(swZ1 - swZ0, swY1 - swY0), new THREE.MeshBasicMaterial({
    map: assets.frost,
    transparent: true,
    opacity: 0.27,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
  sideFrost.rotation.y = Math.PI / 2;
  sideFrost.position.set(sx + 0.12, swCy, swCz);
  sideFrost.renderOrder = 3;
  glass.add(sideFrost);
  const sideSheen = new THREE.Mesh(planeGeo(swZ1 - swZ0, swY1 - swY0), new THREE.MeshBasicMaterial({
    map: assets.glassStreak,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    color: 0xc3dce7,
  }));
  sideSheen.rotation.y = Math.PI / 2;
  sideSheen.position.set(sx + 0.13, swCy, swCz);
  sideSheen.renderOrder = 3;
  glass.add(sideSheen);
  // Window planters outside the sill (they double as the low cottage window boxes).
  const boxGroup = new THREE.Group();
  root.add(boxGroup);
  for (const x of [-0.65, 2.05]) {
    const w = x === -0.65 ? 2.15 : 2.2;
    const planter = addRounded(boxGroup, w, 0.24, 0.36, 0.03, R.woodTrimDark, x, 0.79, C.z1 + 0.28, { cast: true });
    const soil = addBox(boxGroup, w * 0.92, 0.03, 0.3, R.soil, x, 0.92, C.z1 + 0.28);
    const snow = makeSnowCap(x, 0.93, C.z1 + 0.28, w * 0.48, 0.08, 0.19, R);
    boxGroup.add(snow);
    for (let i = 0; i < 6; i++) {
      const plantMat = i % 2 ? R.pine : R.pineDark;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38 + (i % 2) * 0.08, 5), plantMat);
      leaf.position.set(x - 0.75 + i * 0.3, 1.02, C.z1 + 0.28 + (i % 2 ? 0.06 : -0.04));
      leaf.rotation.z = (i - 2.5) * 0.11;
      boxGroup.add(leaf);
    }
    const berries = addBox(boxGroup, 0.3, 0.12, 0.16, R.wreath, x + 0.2, 1.03, C.z1 + 0.31);
  }
  // Snow ledge above each window.
  for (const x of [-0.65, 2.05]) {
    const snowLedge = makeSnowCap(x, C.glassTop + 0.2, C.z1 + 0.16, 1.18, 0.08, 0.2, R);
    boxGroup.add(snowLedge);
  }
  assembly.add(frame, { start: 2.65, duration: 0.8, mode: 'grow', land: false });
  assembly.add(glass, { start: 2.85, duration: 0.7, mode: 'fade' });
  assembly.add(boxGroup, { start: 3.65, duration: 0.7, mode: 'pop' });
  return { root, glass, frame, boxGroup };
}

function buildDoor(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const cx = (C.doorX0 + C.doorX1) / 2;
  const z = C.z1 + 0.14;
  const w = C.doorX1 - C.doorX0;
  // Dark timber recess and trim.
  addBox(g, w + 0.42, 0.16, 0.24, R.woodTrimDark, cx, FLOOR + 0.05, C.z1 + 0.02);
  addBox(g, 0.18, 2.25, 0.24, R.woodTrimDark, C.doorX0 - 0.08, FLOOR + 1.125, C.z1 + 0.02);
  addBox(g, 0.18, 2.25, 0.24, R.woodTrimDark, C.doorX1 + 0.08, FLOOR + 1.125, C.z1 + 0.02);
  addBox(g, w + 0.42, 0.18, 0.26, R.woodTrimDark, cx, FLOOR + 2.51, C.z1 + 0.02);
  // Plank door, slightly weathered.
  addRounded(g, w, 1.85, 0.09, 0.025, R.woodPlank, cx, FLOOR + 0.925, z, { cast: true });
  // Vertical seams and iron straps.
  for (let i = 0; i < 4; i++) {
    addBox(g, 0.026, 1.72, 0.02, R.woodTrimDark, C.doorX0 + 0.17 + i * 0.28, FLOOR + 0.94, z + 0.06);
  }
  for (let i = 0; i < 3; i++) {
    addBox(g, w * 0.92, 0.055, 0.04, R.iron, cx, FLOOR + 0.4 + i * 0.62, z + 0.07);
  }
  // Small inset glazed window, glowing warm from the interior.
  addRounded(g, 0.5, 0.52, 0.025, 0.02, R.woodTrimDark, cx, FLOOR + 1.42, z + 0.08);
  addBox(g, 0.4, 0.42, 0.02, R.warmGlass, cx, FLOOR + 1.42, z + 0.1);
  addBox(g, 0.026, 0.4, 0.026, R.woodTrimDark, cx, FLOOR + 1.42, z + 0.12);
  addBox(g, 0.38, 0.026, 0.026, R.woodTrimDark, cx, FLOOR + 1.42, z + 0.12);
  // Arched fanlight above the door. It is a warm glowing half-circle set into
  // a solid arched wooden surround.
  const archY = FLOOR + 1.85;
  const archR = 0.6;
  const archGlass = new THREE.Mesh(new THREE.CircleGeometry(archR * 0.82, 24, 0, Math.PI), new THREE.MeshBasicMaterial({
    color: '#ffd39c',
    transparent: true,
    opacity: 0.8,
    toneMapped: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  }));
  archGlass.position.set(cx, archY, z + 0.07);
  g.add(archGlass);
  // arched trim
  const archCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(cx - archR, archY, z + 0.08),
    new THREE.Vector3(cx, archY + archR * 2.0, z + 0.08),
    new THREE.Vector3(cx + archR, archY, z + 0.08)
  );
  const archTrim = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 20, 0.06, 5, false), R.woodTrimDark);
  g.add(archTrim);
  // Radial muntins on the fanlight.
  for (let i = 0; i < 3; i++) {
    const a = Math.PI * (0.2 + i * 0.3);
    const bar = meshBox(0.032, archR * 0.78, 0.03, R.woodTrimDark,
      cx + Math.cos(a) * archR * 0.38, archY + Math.sin(a) * archR * 0.38, z + 0.09);
    bar.rotation.z = a - Math.PI / 2;
    g.add(bar);
  }
  addBox(g, archR * 1.2, 0.04, 0.09, R.woodTrimDark, cx, archY, z + 0.09);
  // A rustic evergreen wreath.
  const wreath = new THREE.Group();
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 6, 18), R.wreath);
  wreath.add(torus);
  const RNG = mulberry32(3432);
  for (let i = 0; i < 9; i++) {
    const a = RNG() * TAU;
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.032, 5, 4), R.berry);
    berry.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.045);
    wreath.add(berry);
  }
  for (let i = 0; i < 7; i++) {
    const a = RNG() * TAU;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 5), R.pine);
    leaf.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.02);
    leaf.rotation.z = a - Math.PI / 2;
    wreath.add(leaf);
  }
  wreath.position.set(cx, FLOOR + 1.17, z + 0.14);
  g.add(wreath);
  // Door hardware.
  addBox(g, 0.1, 0.1, 0.05, R.iron, C.doorX1 - 0.17, FLOOR + 1.1, z + 0.13);
  addBox(g, 0.2, 0.035, 0.035, R.iron, C.doorX1 - 0.26, FLOOR + 1.1, z + 0.17);
  // Snow packed against the threshold.
  const thresholdSnow = makeSnowCap(cx, 0.7, C.z1 + 0.42, 0.68, 0.055, 0.2, R);
  g.add(thresholdSnow);
  // A worn mat on the porch.
  const mat = new THREE.Mesh(planeGeo(1.45, 0.8), new THREE.MeshStandardMaterial({
    color: '#8f5a3d',
    roughness: 0.85,
  }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(cx, 0.69, 2.0);
  g.add(mat);
  assembly.add(g, { start: 2.95, duration: 0.85, mode: 'rise', distance: 0.55, land: true, landAt: [cx, FLOOR, C.z1] });
  return { root, group: g, doorLightAnchor: new THREE.Vector3(cx, FLOOR + 2.2, z) };
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGables(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const width = C.x1 - C.x0;
  const h = C.ridgeY - C.wallTop;
  const frontGeo = makeTriangleGable(width, h);
  const front = new THREE.Mesh(frontGeo, R.woodPlank);
  front.position.set(-0.5, C.wallTop, C.z1 - 0.14);
  front.castShadow = true;
  front.receiveShadow = true;
  g.add(front);
  const back = front.clone();
  back.position.z = C.z0 + 0.14;
  back.rotation.y = Math.PI;
  g.add(back);
  // edge beams
  const long = Math.hypot(width / 2, h);
  for (const side of [-1, 1]) {
    const beam = meshBox(0.16, 0.17, long, R.woodTrimDark,
      -0.5 + side * width / 4, C.wallTop + h / 2, C.z1 - 0.08);
    beam.rotation.z = side * Math.atan2(h, width / 2);
    g.add(beam);
  }
  // Round attic window.
  const attic = new THREE.Group();
  const moonMat = new THREE.MeshBasicMaterial({ color: '#ffdca8', toneMapped: false, transparent: true, opacity: 0.92, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.48, 24), moonMat);
  disc.position.set(-0.5, C.wallTop + 1.15, C.z1 - 0.11);
  g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.055, 6, 24), R.woodTrimDark);
  rim.position.copy(disc.position);
  rim.position.z += 0.03;
  g.add(rim);
  addBox(g, 0.05, 0.9, 0.05, R.woodTrimDark, -0.5, C.wallTop + 1.15, C.z1 - 0.06);
  addBox(g, 0.9, 0.05, 0.05, R.woodTrimDark, -0.5, C.wallTop + 1.15, C.z1 - 0.06);
  const atticSnow = makeSnowCap(-0.5, C.wallTop + 0.68, C.z1 - 0.02, 0.52, 0.07, 0.13, R);
  g.add(atticSnow);
  assembly.add(g, { start: 3.05, duration: 0.8, mode: 'grow', land: false });
  return root;
}

function buildRoof(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const eave = 3.62;
  const halfSpan = HALF_W + 0.7;
  const rise = C.ridgeY - eave;
  const angle = Math.atan2(rise, halfSpan);
  const slopeLen = Math.hypot(halfSpan, rise);
  const zLen = 7.35;
  const zCenter = -1.68;
  for (const side of [-1, 1]) {
    const cx = RIDGE_X + side * halfSpan / 2;
    const cy = eave + rise / 2;
    const panel = addBox(g, slopeLen, 0.14, zLen, R.roof, cx, cy, zCenter, { cast: true });
    panel.rotation.z = side * -angle;
    const snow = addBox(g, slopeLen + 0.12, 0.18, zLen + 0.04, R.snowCap, cx + side * 0.015, cy + 0.13, zCenter + 0.01, { cast: true });
    snow.rotation.z = side * -angle;
    // snow eaves lip
    const eaveX = RIDGE_X + side * halfSpan;
    const snowLip = addRounded(g, 0.6, 0.16, zLen + 0.15, 0.07, R.snowPlain, eaveX - side * 0.18, eave + 0.02, zCenter, { cast: false });
    snowLip.rotation.z = side * -angle * 0.2;
    // rafter tails
    for (let i = 0; i < 10; i++) {
      addBox(g, 0.55, 0.08, 0.12, R.woodTrimDark, eaveX - side * 0.12, eave - 0.03, -5.1 + i * 0.72, { cast: true });
    }
  }
  // Ridge cap, trim and drifts.
  addRounded(g, 0.28, 0.2, zLen, 0.08, R.woodTrimDark, RIDGE_X, C.ridgeY + 0.06, zCenter, { cast: true });
  addRounded(g, 0.34, 0.14, zLen + 0.1, 0.06, R.snowPlain, RIDGE_X, C.ridgeY + 0.21, zCenter, { cast: false });
  const RNG = mulberry32(9241);
  for (let i = 0; i < 12; i++) {
    const z = -5.2 + i * 0.63;
    const drift = makeSnowCap(RIDGE_X + (RNG() - 0.5) * 0.2, C.ridgeY + 0.27, z, 0.2 + RNG() * 0.1, 0.1, 0.28, R);
    g.add(drift);
  }
  // Snow-filled timber rakes across the front gable.
  for (const side of [-1, 1]) {
    const board = meshBox(0.16, 0.22, slopeLen + 0.3, R.woodTrimDark,
      RIDGE_X + side * halfSpan / 2, eave + rise / 2 - 0.08, C.z1 + 0.64);
    board.rotation.z = side * -angle;
    g.add(board);
    const snowRake = meshBox(0.2, 0.12, slopeLen + 0.22, R.snowPlain,
      RIDGE_X + side * halfSpan / 2, eave + rise / 2 + 0.05, C.z1 + 0.66);
    snowRake.rotation.z = side * -angle;
    g.add(snowRake);
  }
  // Snow clumps along the side eaves.
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const z = -5.05 + Math.floor(i / 2) * 1.04 + (RNG() - 0.5) * 0.2;
    const x = RIDGE_X + side * (halfSpan - 0.04);
    const clump = makeSnowCap(x, eave + 0.12, z, 0.24 + RNG() * 0.1, 0.13, 0.44 + RNG() * 0.16, R);
    g.add(clump);
  }
  // Icicles hang from the long side eaves, where the snow lip is deepest.
  const iceGeo = new THREE.ConeGeometry(0.045, 1, 5);
  iceGeo.rotateX(Math.PI);
  const iceMat = R._standard('#bfdce7', { roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.82 });
  const icicles = new THREE.InstancedMesh(iceGeo, iceMat, 26);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 26; i++) {
    const side = i < 13 ? 1 : -1;
    const j = i % 13;
    const x = RIDGE_X + side * (halfSpan - 0.12);
    const z = -4.9 + j * 0.55 + (RNG() - 0.5) * 0.18;
    const y = eave - 0.16;
    const len = 0.16 + RNG() * 0.48;
    m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(0.7 + RNG() * 0.7, len, 0.7 + RNG() * 0.7));
    icicles.setMatrixAt(i, m);
  }
  icicles.instanceMatrix.needsUpdate = true;
  g.add(icicles);
  assembly.add(g, { start: 3.18, duration: 0.85, mode: 'drop', distance: 1.4, land: true, landAt: [-0.5, 4.5, -1.7] });
  return root;
}

function buildChimney(scene, R, assets, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const x = C.chimneyX;
  const z = C.chimneyZ;
  const bottom = SNOW_Y + 0.05;
  const top = C.chimneyTop;
  const stoneTex = assets.stone.clone();
  stoneTex.needsUpdate = true;
  stoneTex.wrapS = THREE.RepeatWrapping;
  stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(1.15, 2.8);
  const chimneyStone = R._toon('#d0c8ba', { map: stoneTex });
  addRounded(g, 1.18, top - bottom, 1.05, 0.05, chimneyStone, x, bottom + (top - bottom) / 2, z, { cast: true, receive: true });
  // A heavy stone shoulder and a corbelled crown.
  addRounded(g, 1.42, 0.3, 1.26, 0.04, R.stoneDark, x, bottom + 0.9, z, { cast: true });
  addRounded(g, 1.35, 0.16, 1.22, 0.04, R.stoneDark, x, top - 0.04, z, { cast: true });
  addRounded(g, 1.15, 0.18, 1.08, 0.035, R.stoneDark, x, top + 0.08, z, { cast: true });
  addBox(g, 0.55, 0.17, 0.55, R.metalDark, x, top + 0.23, z, { cast: true });
  const snow = makeSnowCap(x, top + 0.26, z, 0.72, 0.15, 0.66, R);
  g.add(snow);
  // irregular protruding stones
  const RNG = mulberry32(4781);
  for (let i = 0; i < 20; i++) {
    const a = RNG() * TAU;
    const yy = bottom + 0.9 + RNG() * (top - bottom - 1.4);
    const px = x + Math.cos(a) * 0.6;
    const pz = z + Math.sin(a) * 0.52;
    const stone = addRounded(g, 0.2 + RNG() * 0.22, 0.2 + RNG() * 0.17, 0.14 + RNG() * 0.14, 0.03,
      R.stoneDark, px, yy, pz, { cast: false });
  }
  // A pale band of snow tucked into the chimney's windward side.
  const sideSnow = makeSnowCap(x - 0.45, top - 0.34, z + 0.12, 0.37, 0.1, 0.36, R);
  g.add(sideSnow);
  // Snow on top and a metal flue.
  const flue = meshCyl(0.15, 0.18, 0.25, R.metalDark, x, top + 0.4, z, 8);
  g.add(flue);
  assembly.add(g, { start: 3.35, duration: 0.95, mode: 'rise', distance: 1.4, land: true, landAt: [x, 3.5, z] });
  return { root, smokeOrigin: new THREE.Vector3(x, top + 0.6, z), group: g };
}

function buildPorch(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const deck = new THREE.Group();
  root.add(deck);
  const deckY = 0.59;
  addRounded(deck, 8.6, 0.18, 1.56, 0.035, R.woodFloor, -0.5, deckY, 1.82, { cast: true, receive: true });
  // plank grooves
  for (let i = 0; i < 15; i++) {
    addBox(deck, 0.012, 0.012, 1.48, R.woodTrimDark, -4.4 + i * 0.55, deckY + 0.093, 1.82, { cast: false });
  }
  // stone piers under the deck
  for (const [x, z] of [[-4.3, 2.35], [3.3, 2.35], [-0.5, 1.75]]) {
    addRounded(deck, 0.56, 0.34, 0.55, 0.04, R.stoneDark, x, SNOW_Y + 0.13, z, { cast: true });
  }
  // Steps
  for (let i = 0; i < 3; i++) {
    const topY = 0.29 + i * 0.12;
    const h = Math.max(0.1, topY - SNOW_Y + 0.04);
    const stair = addRounded(deck, 2.1 - i * 0.05, h, 0.32, 0.035, R.stone,
      -2.7, SNOW_Y + h / 2 - 0.01, 3.0 - i * 0.29, { cast: true });
    const cap = makeSnowCap(-2.7, SNOW_Y + h + 0.02, 3.0 - i * 0.29, 1.02, 0.06, 0.12, R);
    deck.add(cap);
  }
  // An open timber porch frame: it shelters the entry without hiding the
  // arched door and fanlight from the viewer.
  const canopy = new THREE.Group();
  const beamY = FLOOR + 2.92;
  addRounded(canopy, 2.7, 0.2, 0.26, 0.035, R.woodTrimDark, -3.05, beamY, C.z1 + 1.4, { cast: true });
  addRounded(canopy, 2.74, 0.09, 0.32, 0.03, R.snowPlain, -3.05, beamY + 0.14, C.z1 + 1.4, { cast: false });
  for (const x of [-1.2, 1.2]) {
    const postX = -3.05 + x;
    const post = addRounded(canopy, 0.17, 2.83, 0.17, 0.03, R.woodTrimDark,
      postX, FLOOR + 1.415, C.z1 + 1.4, { cast: true });
    const snowCap = makeSnowCap(postX, FLOOR + 2.83, C.z1 + 1.4, 0.2, 0.08, 0.18, R);
    canopy.add(snowCap);
    const brace = tubeFromPoints([
      new THREE.Vector3(postX, FLOOR + 2.62, C.z1 + 1.4),
      new THREE.Vector3(postX + (x > 0 ? -0.35 : 0.35), FLOOR + 2.58, C.z1 + 1.02),
      new THREE.Vector3(postX + (x > 0 ? -0.7 : 0.7), FLOOR + 2.56, C.z1 + 0.55),
    ], 0.035, R.woodTrimDark, { segments: 8, radialSegments: 4 });
    canopy.add(brace);
    // Low side rails, kept clear of the steps.
    addRounded(deck, 0.11, 0.84, 0.11, 0.025, R.woodTrimDark, postX, FLOOR + 0.83, C.z1 + 1.4, { cast: true });
    addRounded(deck, 0.09, 0.08, 0.9, 0.02, R.woodTrim, postX, FLOOR + 0.68, C.z1 + 0.95, { cast: true });
    addRounded(deck, 0.09, 0.08, 0.9, 0.02, R.woodTrim, postX, FLOOR + 1.07, C.z1 + 0.95, { cast: true });
  }
  root.add(canopy);
  // Side rails at the outer ends of the deck.
  for (const [x, z0, z1] of [[-4.3, 1.2, 2.4], [3.3, 1.2, 2.4]]) {
    for (let r = 0; r < 2; r++) {
      addRounded(deck, 0.1, 0.08, z1 - z0, 0.02, R.woodTrim, x, FLOOR + 0.25 + r * 0.33, (z0 + z1) / 2, { cast: true });
    }
    addBox(deck, 0.1, 0.75, 0.1, R.woodTrimDark, x, FLOOR + 0.38, z0);
    addBox(deck, 0.1, 0.75, 0.1, R.woodTrimDark, x, FLOOR + 0.38, z1);
    const snow = makeSnowCap(x, FLOOR + 0.6, (z0 + z1) / 2, 0.08, 0.06, 0.62, R);
    deck.add(snow);
  }
  assembly.add(deck, { start: 3.35, duration: 0.8, mode: 'rise', distance: 0.6, land: true, landAt: [-0.5, SNOW_Y, 1.8] });
  assembly.add(canopy, { start: 3.6, duration: 0.8, mode: 'drop', distance: 0.8, land: false });
  return root;
}

function buildExteriorDecor(scene, R, assets, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Shutters beside the main windows.
  for (const x of [-1.96, 3.45]) {
    const shutter = addRounded(g, 0.36, 2.15, 0.08, 0.03, R.woodPlankDark, x, 2.0, C.z1 + 0.13, { cast: true });
    for (let i = 0; i < 6; i++) {
      addBox(g, 0.28, 0.055, 0.02, R.woodTrimDark, x, 1.12 + i * 0.33, C.z1 + 0.19);
    }
    const snow = makeSnowCap(x, 3.09, C.z1 + 0.15, 0.22, 0.06, 0.08, R);
    g.add(snow);
  }
  // Heavy iron hardware and a small address plaque.
  addBox(g, 0.55, 0.26, 0.04, R.iron, C.doorX1 + 0.28, FLOOR + 1.8, C.z1 + 0.16);
  // A warm exterior wall light above the door, separate from props lantern.
  const lampBack = addRounded(g, 0.3, 0.42, 0.12, 0.04, R.iron, C.doorX0 - 0.27, FLOOR + 2.02, C.z1 + 0.12, { cast: true });
  addBox(g, 0.15, 0.25, 0.05, R.warmBulb, C.doorX0 - 0.27, FLOOR + 2.02, C.z1 + 0.21);
  const shower = makeSnowCap(C.doorX0 - 0.27, FLOOR + 2.26, C.z1 + 0.12, 0.2, 0.06, 0.1, R);
  g.add(shower);
  assembly.add(g, { start: 3.8, duration: 0.8, mode: 'fade' });
  return root;
}

function buildExteriorGlow(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const group = new THREE.Group();
  root.add(group);
  const mat = new THREE.MeshBasicMaterial({
    map: assets.glow,
    color: 0xff9c50,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const add = (x, z, w, d, op) => {
    const m = new THREE.Mesh(planeGeo(w, d), mat.clone());
    m.material.opacity = op;
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, SNOW_Y + 0.045, z);
    m.renderOrder = 3;
    group.add(m);
    return m;
  };
  add(-0.4, 2.6, 7.8, 3.0, 0.11);
  add(-2.7, 3.2, 3.2, 2.0, 0.08);
  add(2.4, 1.8, 3.0, 2.2, 0.075);
  add(4.4, -1.1, 2.2, 2.5, 0.055);
  // Actual soft warm light on the snow. It stays outside the walls.
  const spill = new THREE.PointLight(0xff9d58, 0, 8.5, 2.0);
  spill.position.set(0.2, 1.4, 2.1);
  root.add(spill);
  assembly.addLight(spill, { start: 4.9, duration: 1.2, intensity: 4.5 });
  assembly.add(group, { start: 4.7, duration: 1.0, mode: 'fade' });
  return { root, spill };
}

export function buildCabinExterior(scene, assets, R, assembly) {
  const foundation = buildFoundation(scene, R, assembly);
  const walls = buildExteriorWalls(scene, R, assembly);
  const glazing = buildGlazing(scene, assets, R, assembly, walls);
  const door = buildDoor(scene, assets, R, assembly);
  const gables = buildGables(scene, R, assembly);
  const roof = buildRoof(scene, R, assembly);
  const chimney = buildChimney(scene, R, assets, assembly);
  const porch = buildPorch(scene, R, assembly);
  const decor = buildExteriorDecor(scene, R, assets, assembly);
  const glow = buildExteriorGlow(scene, assets, R, assembly);
  return {
    foundation,
    walls,
    glazing,
    door,
    gables,
    roof,
    chimney,
    porch,
    decor,
    glow,
    chimneyTop: chimney.smokeOrigin,
    spillLight: glow.spill,
  };
}
