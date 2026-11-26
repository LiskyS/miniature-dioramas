import * as THREE from 'three';
import { STORE, SIDEWALK_Y, TIMES } from '../config.js';
import {
  addContactShadow,
  boxGeo,
  canvasTexture,
  cylinderBetween,
  cylGeo,
  labelPlane,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  roundedBoxGeo,
  setShadows,
  tubeFromPoints,
  rng,
} from '../core/utils.js';

const S = STORE;
const FLOOR_Y = 0.45;
const CEIL_Y = 3.31;
const WALL_TOP = S.bandTop;
const ROOF_Y = 4.22;

function makeInteriorFloorTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#b8b09f';
    ctx.fillRect(0, 0, w, h);
    const n = 4;
    const step = w / n;
    for (let iy = 0; iy < n; iy++) {
      for (let ix = 0; ix < n; ix++) {
        ctx.fillStyle = (ix + iy) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(47,51,46,.045)';
        ctx.fillRect(ix * step, iy * step, step, step);
      }
    }
    ctx.strokeStyle = 'rgba(91,88,77,.38)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(w, i * step); ctx.stroke();
    }
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.045)' : 'rgba(38,39,32,.035)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: [3.8, 3.8] });
}

function makeCounterMenuTexture() {
  return canvasTexture(1024, 384, (ctx, w, h) => {
    ctx.fillStyle = '#1b2c2a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(248,214,165,.6)';
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#ffe6bc';
    ctx.textAlign = 'left';
    ctx.font = `600 58px ${"'Yu Gothic','Meiryo',sans-serif"}`;
    ctx.fillText('HOT SNACK', 44, 86);
    ctx.fillStyle = 'rgba(255,196,122,.72)';
    ctx.font = `500 26px ${"'Yu Gothic','Meiryo',sans-serif"}`;
    ctx.fillText('できたてをお持ち帰りください', 44, 128);
    ctx.fillStyle = 'rgba(130,231,205,.85)';
    ctx.font = `500 28px ${"'Yu Gothic','Meiryo',sans-serif"}`;
    ctx.fillText('からあげ  ¥240', 44, 194);
    ctx.fillText('フランク  ¥180', 44, 238);
    ctx.fillText('おでん    ¥110〜', 44, 282);
    ctx.fillStyle = 'rgba(255,227,178,.85)';
    ctx.font = `500 27px ${"'Yu Gothic','Meiryo',sans-serif"}`;
    ctx.fillText('COFFEE  ¥100〜', 560, 194);
    ctx.fillText('LATTE   ¥180', 560, 238);
    ctx.fillText('お茶     ¥120', 560, 282);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fillRect(530, 156, 2, 150);
    ctx.textAlign = 'right';
    ctx.font = `500 22px ${"'Yu Gothic','Meiryo',sans-serif"}`;
    ctx.fillStyle = 'rgba(234,229,207,.38)';
    ctx.fillText('HOSHIKUZU MART', w - 44, h - 34);
  });
}

function makeShelfHeaderTexture() {
  return canvasTexture(1024, 192, (ctx, w, h) => {
    ctx.fillStyle = '#f5efdf';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8a5a42';
    ctx.fillRect(0, h - 28, w, 28);
    ctx.fillStyle = '#335d57';
    ctx.textAlign = 'center';
    ctx.font = `600 58px ${"'Yu Gothic','Meiryo',sans-serif"}`;
    ctx.fillText('お菓子・日用品・季節の商品', w / 2, 78);
    ctx.fillStyle = 'rgba(51,93,87,.52)';
    ctx.font = `500 22px ${"'Yu Gothic','Meiryo',sans-serif"}`;
    ctx.fillText('SWEETS  /  DAILY GOODS  /  SEASONAL', w / 2, 120);
  });
}

function addBox(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, {
    cast: opts.cast ?? false,
    receive: opts.receive ?? true,
    round: opts.round,
    radius: opts.radius ?? 0.03,
    roundSeg: opts.roundSeg ?? 2,
  });
  parent.add(m);
  return m;
}

function addRounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, {
    cast: opts.cast ?? false,
    receive: opts.receive ?? true,
    roundSeg: opts.roundSeg ?? 2,
  });
  parent.add(m);
  return m;
}

function addLabel(parent, w, h, mat, x, y, z, rotation = [0, 0, 0], opts = {}) {
  const m = new THREE.Mesh(planeGeo(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.set(...rotation);
  m.renderOrder = opts.renderOrder ?? 2;
  m.castShadow = false;
  m.receiveShadow = false;
  parent.add(m);
  return m;
}

function textureLabel(parent, w, h, texture, x, y, z, rotation = [0, 0, 0], opts = {}) {
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.DoubleSide,
    depthWrite: false,
    alphaTest: opts.alphaTest ?? 0.01,
    toneMapped: false,
  });
  return addLabel(parent, w, h, mat, x, y, z, rotation, opts);
}

function instancedFromList(geometry, material, list) {
  const mesh = new THREE.InstancedMesh(geometry, material, list.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  list.forEach((it, i) => {
    p.set(...(it.p || [0, 0, 0]));
    if (it.r) q.setFromEuler(new THREE.Euler(it.r[0], it.r[1], it.r[2]));
    else if (it.q) q.set(...it.q);
    else q.identity();
    s.set(...(it.s || [1, 1, 1]));
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    if (it.color !== undefined) mesh.setColorAt(i, new THREE.Color(it.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

function buildACUnit(parent, R, w = 1.05, h = 0.67, d = 0.38, x = 0, y = 0, z = 0, flip = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const body = addRounded(g, w, h, d, 0.06, R.vendingCold, 0, 0, 0, { cast: true });
  const grille = new THREE.Mesh(new THREE.CircleGeometry(h * 0.34, 20), R.metalDark);
  grille.rotation.y = Math.PI / 2 * flip;
  grille.position.set((d / 2 + 0.006) * flip, -0.02, 0);
  g.add(grille);
  const fan = new THREE.Group();
  const blades = [];
  for (let i = 0; i < 3; i++) {
    const blade = meshBox(h * 0.28, 0.012, 0.07, R.metalGalv, 0, 0, 0);
    blade.rotation.x = 0;
    blade.rotation.z = (i / 3) * Math.PI * 2;
    blade.position.z = 0;
    blades.push(blade);
    fan.add(blade);
  }
  fan.rotation.y = Math.PI / 2 * flip;
  g.add(fan);
  const pipe = meshCyl(0.025, 0.025, 0.8, R.metalGalv, 0, -h / 2 - 0.38, -d * 0.3, 6);
  g.add(pipe);
  // wall bracket
  addBox(g, w + 0.1, 0.04, 0.08, R.metal, 0, -h / 2 + 0.02, -d / 2 - 0.04);
  g.userData.fan = fan;
  parent.add(g);
  return g;
}

function buildRoof(parent, R, assets, assembly) {
  const roof = new THREE.Group();
  parent.add(roof);
  const w = S.x1 - S.x0 + 0.16;
  const d = S.z1 - S.z0 + 0.16;
  const cx = (S.x0 + S.x1) / 2;
  const cz = (S.z0 + S.z1) / 2;
  const slab = addRounded(roof, w, 0.18, d, 0.04, R.storeRoof, cx, ROOF_Y + 0.04, cz, {
    cast: true,
    receive: true,
    roundSeg: 2,
  });
  // parapet ring
  const py = ROOF_Y + 0.2;
  const ph = 0.22;
  addBox(roof, w, ph, 0.12, R.storeRoof, cx, py, S.z1 + 0.02, { cast: true });
  addBox(roof, w, ph, 0.12, R.storeRoof, cx, py, S.z0 - 0.02, { cast: true });
  addBox(roof, 0.12, ph, d, R.storeRoof, S.x0 - 0.02, py, cz, { cast: true });
  addBox(roof, 0.12, ph, d, R.storeRoof, S.x1 + 0.02, py, cz, { cast: true });
  // membrane seams
  const seamMat = R._toon('#3a4547');
  for (let i = 0; i < 6; i++) {
    addBox(roof, w - 0.3, 0.012, 0.018, seamMat, cx, ROOF_Y + 0.136, S.z0 + 0.8 + i * 1.45);
  }
  for (let i = 0; i < 4; i++) {
    addBox(roof, 0.018, 0.012, d - 0.25, seamMat, S.x0 + 1.0 + i * 2.2, ROOF_Y + 0.137, cz);
  }
  // Rooftop air conditioners with top-mounted fans and louvred sides.
  const roofMetal = R._standard('#667373', { roughness: 0.4, metalness: 0.4 });
  const makeRoofAC = (w, h, d, x, y, z, phase = 0) => {
    const ac = new THREE.Group();
    ac.position.set(x, y, z);
    addRounded(ac, w, h, d, 0.05, roofMetal, 0, 0, 0, { cast: true });
    addBox(ac, w - 0.06, h * 0.65, 0.035, R.metalDark, 0, -0.02, d * 0.5 + 0.02);
    for (let i = 0; i < 7; i++) {
      addBox(ac, w - 0.14, 0.018, 0.02, R.metalGalv, 0, -h * 0.28 + i * (h * 0.09), d * 0.5 + 0.045);
    }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.34, w * 0.34, 0.025, 18), R.metalDark);
    top.position.set(0, h * 0.5 + 0.015, -d * 0.05);
    ac.add(top);
    for (let i = 0; i < 5; i++) {
      const bar = addBox(ac, w * 0.52, 0.016, 0.025, R.metalGalv, 0, h * 0.5 + 0.04, -d * 0.05 + 0.0);
      bar.rotation.y = (i / 5) * Math.PI;
      bar.scale.z = 0.9;
    }
    const pipe = meshCyl(0.035, 0.035, 0.35, R.metalGalv, w * 0.38, -h * 0.3, d * 0.34, 5);
    ac.add(pipe);
    roof.add(ac);
    return ac;
  };
  makeRoofAC(1.3, 0.66, 0.8, -5.4, ROOF_Y + 0.55, -6.1);
  makeRoofAC(0.95, 0.54, 0.65, -2.7, ROOF_Y + 0.49, -4.8);
  // ducts and vents
  addRounded(roof, 2.2, 0.22, 0.35, 0.04, R.metalGalv, -6.25, ROOF_Y + 0.33, -5.0, { cast: true });
  const vent = meshCyl(0.22, 0.24, 0.52, R.metal, 0.8, ROOF_Y + 0.35, -6.7, 12, { cast: true });
  roof.add(vent);
  const cap = meshCyl(0.42, 0.3, 0.1, R.metalDark, 0.8, ROOF_Y + 0.64, -6.7, 12);
  roof.add(cap);
  const vent2 = meshCyl(0.15, 0.17, 0.8, R.metal, 1.2, ROOF_Y + 0.45, -5.7, 10);
  roof.add(vent2);
  // roof access hatch
  addRounded(roof, 0.9, 0.12, 0.9, 0.04, R.metalDark, 0.2, ROOF_Y + 0.2, -7.2, { cast: true });
  // small service lamp
  const roofLamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), R.warmLight);
  roofLamp.position.set(-0.7, ROOF_Y + 0.17, 0.6);
  roof.add(roofLamp);
  // cables across roof
  const c1 = tubeFromPoints([
    new THREE.Vector3(S.x0 + 0.4, ROOF_Y + 0.24, -4),
    new THREE.Vector3(-2.7, ROOF_Y + 0.3, -3.2),
    new THREE.Vector3(S.x1 - 0.2, ROOF_Y + 0.22, -2.6),
  ], 0.018, R.rubber, { segments: 16, radialSegments: 4 });
  roof.add(c1);
  // roof railing at the back.
  for (let i = 0; i < 5; i++) {
    addBox(roof, 0.035, 0.7, 0.035, R.metalGalv, S.x0 + 0.6 + i * 1.7, ROOF_Y + 0.52, S.z0 + 0.18);
  }
  addBox(roof, 7.0, 0.035, 0.035, R.metalGalv, S.x0 + 4.1, ROOF_Y + 0.86, S.z0 + 0.18);
  assembly.add(roof, { start: 2.28, duration: 0.88, mode: 'drop', distance: 1.6, land: true });
  return roof;
}

function buildShell(storeRoot, R, assembly) {
  const shell = {};
  const base = new THREE.Group();
  storeRoot.add(base);
  // plinth
  addRounded(base, S.x1 - S.x0 + 0.35, 0.19, S.z1 - S.z0 + 0.35, 0.035, R.storeFoundation,
    (S.x0 + S.x1) / 2, S.y + 0.08, (S.z0 + S.z1) / 2, { cast: true, receive: true });
  // subtle step
  addRounded(base, S.x1 - S.x0 + 0.12, 0.08, S.z1 - S.z0 + 0.12, 0.02, R.curbDark,
    (S.x0 + S.x1) / 2, S.y + 0.2, (S.z0 + S.z1) / 2, { cast: false });
  assembly.add(base, { start: 1.48, duration: 0.7, mode: 'rise', distance: 0.9, land: true, landAt: [-2.7, 0.4, -3.6] });

  // main walls / volume
  const walls = new THREE.Group();
  storeRoot.add(walls);
  const wallH = WALL_TOP - (S.y + 0.16);
  const midY = S.y + 0.16 + wallH / 2;
  // back wall
  addBox(walls, S.x1 - S.x0, wallH, 0.18, R.storeWallSide, (S.x0 + S.x1) / 2, midY, S.z0 + 0.1, { cast: true });
  // west wall
  addBox(walls, 0.18, wallH, S.z1 - S.z0, R.storeWallSide, S.x0 + 0.1, midY, (S.z0 + S.z1) / 2, { cast: true });
  // east solid wall rear half
  addBox(walls, 0.18, wallH, 5.4, R.storeWallSide, S.x1 - 0.1, midY, S.z0 + 2.7, { cast: true });
  // upper band across front and side (the luminous white parapet)
  addBox(walls, S.x1 - S.x0, S.bandTop - S.glassTop, 0.32, R.storeBand,
    (S.x0 + S.x1) / 2, (S.glassTop + S.bandTop) / 2, S.z1 - 0.05, { cast: true });
  addBox(walls, 0.32, S.bandTop - S.glassTop, 6.4, R.storeBand, S.x1 - 0.02, (S.glassTop + S.bandTop) / 2, -1.7, { cast: true });
  // front kick panel
  addBox(walls, S.x1 - S.x0, 0.38, 0.24, R.storeTrimDark, (S.x0 + S.x1) / 2, S.y + 0.36, S.z1 - 0.03, { cast: true });
  // side kick panel
  addBox(walls, 0.24, 0.38, 6.3, R.storeTrimDark, S.x1 - 0.03, S.y + 0.36, -1.65, { cast: true });
  // dark green pilasters at the ends
  addBox(walls, 0.3, S.bandTop - S.y - 0.1, 0.34, R.storeTrim, S.x0 + 0.05, (S.y + 0.16 + WALL_TOP) / 2, S.z1 - 0.03, { cast: true });
  addBox(walls, 0.34, S.bandTop - S.y - 0.1, 0.34, R.storeTrim, S.x1 - 0.03, (S.y + 0.16 + WALL_TOP) / 2, S.z1 - 0.03, { cast: true });
  // east corner green column
  addBox(walls, 0.34, WALL_TOP - S.y - 0.1, 0.34, R.storeTrim, S.x1 - 0.02, (S.y + 0.16 + WALL_TOP) / 2, S.z1 - 0.02, { cast: true });
  // wall panel grooves
  for (let i = 0; i < 5; i++) {
    addBox(walls, 0.022, 2.0, 0.012, R.storeTrimDark, S.x0 + 0.25 + i * 0.9, 2.6, S.z1 + 0.01);
  }
  // roof edge trim under sign
  addBox(walls, S.x1 - S.x0 + 0.2, 0.12, 0.3, R.storeTrim, (S.x0 + S.x1) / 2, S.bandTop + 0.02, S.z1 - 0.02, { cast: true });
  // light metal seams and a mint strip break up the white fascia
  for (let i = 0; i < 8; i++) {
    addBox(walls, 0.022, S.bandTop - S.glassTop - 0.04, 0.018, R.storeTrimDark,
      S.x0 + 0.7 + i * 1.15, (S.glassTop + S.bandTop) / 2, S.z1 + 0.115);
  }
  addBox(walls, S.x1 - S.x0 + 0.04, 0.022, 0.025, R.neonMint, (S.x0 + S.x1) / 2, S.glassTop + 0.03, S.z1 + 0.12);
  addBox(walls, S.x1 - S.x0 + 0.04, 0.018, 0.025, R.neonOrange, (S.x0 + S.x1) / 2, S.bandTop - 0.06, S.z1 + 0.12);
  // small louvred vents on the side of the fascia
  for (let i = 0; i < 4; i++) {
    addBox(walls, 0.04, 0.28, 0.46, R.storeTrimDark, S.x1 + 0.13, 3.74, -4.6 + i * 1.4);
  }
  // cladding seams on the side wall
  for (let i = 0; i < 7; i++) {
    addBox(walls, 0.012, 0.025, 1.25, R.storeTrimDark, S.x1 + 0.005, S.y + 0.75 + i * 0.36, -6.3);
  }
  assembly.add(walls, { start: 1.62, duration: 1.0, mode: 'grow', land: true, landAt: [-2.7, 0.5, -3.6] });

  // Glazing frame structure.
  const frames = new THREE.Group();
  storeRoot.add(frames);
  const frameMat = R.storeMetal;
  const frontZ = S.z1 + 0.055;
  const mullions = [-7.66, -6.06, -4.46, -2.86, -1.26, S.doorX0 - 0.06, S.doorX1 + 0.06, 2.36];
  for (const x of mullions) {
    addBox(frames, 0.075, 2.8, 0.13, frameMat, x, 1.94, frontZ, { cast: true });
  }
  addBox(frames, S.x1 - S.x0 - 0.2, 0.1, 0.16, frameMat, -2.7, 0.58, frontZ, { cast: true });
  addBox(frames, S.x1 - S.x0 - 0.2, 0.12, 0.16, frameMat, -2.7, 3.27, frontZ, { cast: true });
  // Side glazing.
  const sideX = S.x1 + 0.055;
  for (let i = 0; i < 4; i++) {
    addBox(frames, 0.13, 2.8, 0.075, frameMat, sideX, 1.94, -3.15 + i * 1.35, { cast: true });
  }
  addBox(frames, 0.16, 0.1, 5.2, frameMat, sideX, 0.58, -1.05, { cast: true });
  addBox(frames, 0.16, 0.12, 5.2, frameMat, sideX, 3.27, -1.05, { cast: true });
  // corner vertical beam
  addBox(frames, 0.18, 2.8, 0.18, R.storeTrim, S.x1 + 0.02, 1.94, S.z1 + 0.02, { cast: true });
  assembly.add(frames, { start: 1.96, duration: 0.8, mode: 'grow', land: false });

  // Glass.
  const glass = new THREE.Group();
  storeRoot.add(glass);
  const frontGlass = new THREE.Mesh(planeGeo(6.95, 2.64), R.glass);
  frontGlass.position.set(-3.43, 1.94, frontZ + 0.02);
  frontGlass.rotation.y = 0;
  frontGlass.renderOrder = 1;
  glass.add(frontGlass);
  const sideGlass = new THREE.Mesh(planeGeo(4.3, 2.64), R.glass);
  sideGlass.position.set(sideX + 0.02, 1.94, -1.0);
  sideGlass.rotation.y = Math.PI / 2;
  sideGlass.renderOrder = 1;
  glass.add(sideGlass);
  assembly.add(glass, { start: 2.16, duration: 0.7, mode: 'fade' });

  // window reflection sheen
  const sheenMat = new THREE.MeshBasicMaterial({
    map: null,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    color: 0xbfe8ef,
  });
  const sheenTex = storeRoot.userData.glassStreak;
  return { base, walls, frames, glass, sheenMat };
}

function buildEntrance(storeRoot, R, assets, assembly, outerLights) {
  const g = new THREE.Group();
  storeRoot.add(g);
  const z = S.z1 + 0.08;
  const doorW = S.doorX1 - S.doorX0;
  const cx = (S.doorX0 + S.doorX1) / 2;
  // Header and jambs
  addBox(g, doorW + 0.14, 0.3, 0.18, R.storeTrim, cx, 3.38, z, { cast: true });
  addBox(g, 0.09, 2.88, 0.12, R.storeMetalLight, S.doorX0 - 0.045, 1.94, z + 0.04, { cast: true });
  addBox(g, 0.09, 2.88, 0.12, R.storeMetalLight, S.doorX1 + 0.045, 1.94, z + 0.04, { cast: true });
  // two glass door panels with frames
  const doorOffsets = [-0.53, 0.53];
  for (let i = 0; i < 2; i++) {
    const dx = cx + doorOffsets[i] * 0.72;
    const panel = new THREE.Mesh(planeGeo(doorW / 2 - 0.12, 2.64), R.doorGlass);
    panel.position.set(dx, 1.94, z + 0.06);
    panel.renderOrder = 1;
    g.add(panel);
    addBox(g, doorW / 2 - 0.08, 0.07, 0.08, R.storeMetal, dx, 0.61, z + 0.08);
    addBox(g, doorW / 2 - 0.08, 0.07, 0.08, R.storeMetal, dx, 3.24, z + 0.08);
    addBox(g, 0.055, 2.58, 0.06, R.storeMetal, dx - (doorW / 4 - 0.04), 1.94, z + 0.08);
    addBox(g, 0.055, 2.58, 0.06, R.storeMetal, dx + (doorW / 4 - 0.04), 1.94, z + 0.08);
    // long pull handle
    addBox(g, 0.025, 0.95, 0.045, R.storeMetalLight, dx + (i === 0 ? 0.27 : -0.27), 1.55, z + 0.16);
  }
  // central seam
  addBox(g, 0.035, 2.58, 0.04, R.storeMetalDark ?? R.storeTrimDark, cx, 1.94, z + 0.08);
  // sensor and tiny LED
  addRounded(g, 0.36, 0.2, 0.14, 0.02, R.storeMetal, cx, 3.21, z + 0.15, { cast: false });
  const sensorLed = addRounded(g, 0.055, 0.055, 0.04, 0.015, R.coolLight, cx - 0.1, 3.21, z + 0.23);
  sensorLed.material = sensorLed.material.clone();
  sensorLed.material.color.setRGB(0.7, 1.1, 1.0);
  const doorDecal = textureLabel(g, 0.9, 0.45, assets.autoDoor, cx, 2.9, z + 0.12, [0, 0, 0], { opacity: 0.82 });
  // entrance floor inside and threshold
  addBox(g, doorW + 0.15, 0.035, 0.25, R.metalGalv, cx, S.y + 0.22, S.z1 + 0.03);
  const mat = new THREE.Mesh(planeGeo(2.05, 0.9), R.doorMat);
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(cx, S.y + 0.03, S.z1 + 0.75);
  mat.receiveShadow = true;
  g.add(mat);
  // Outside entrance light
  const light = new THREE.PointLight(0xffd49e, 14, 6.5, 2.0);
  light.position.set(cx, 3.2, z + 0.55);
  storeRoot.add(light);
  assembly.addLight(light, { start: 3.3, duration: 0.7, intensity: 8, flicker: true });
  if (outerLights) outerLights.push(light);
  // small awning-like hood
  addRounded(g, doorW + 0.35, 0.1, 0.7, 0.03, R.storeCanopy, cx, 3.5, z + 0.36, { cast: true });
  addBox(g, doorW + 0.35, 0.045, 0.07, R.warmLight, cx, 3.45, z + 0.7);
  assembly.add(g, { start: 2.28, duration: 0.9, mode: 'rise', distance: 0.8, land: true, landAt: [cx, S.y, S.z1 + 0.4] });
  return { group: g, sensorLed, light };
}

function buildCanopy(storeRoot, R, assembly) {
  const g = new THREE.Group();
  storeRoot.add(g);
  const w = S.x1 - S.x0 + 0.3;
  const zCenter = S.z1 + 0.58;
  addRounded(g, w, 0.12, 1.22, 0.04, R.storeCanopy, (S.x0 + S.x1) / 2, 3.43, zCenter, {
    cast: true,
    receive: true,
    roundSeg: 2,
  });
  addBox(g, w, 0.1, 0.08, R.storeTrim, (S.x0 + S.x1) / 2, 3.37, S.z1 + 1.18);
  addBox(g, w, 0.025, 0.045, R.warmLight, (S.x0 + S.x1) / 2, 3.455, S.z1 + 1.21);
  // brackets
  for (let i = 0; i < 5; i++) {
    const x = S.x0 + 0.9 + i * 2.2;
    const bracket = new THREE.Mesh(cylGeo(0.028, 0.028, 0.85, 5), R.storeMetal);
    bracket.position.set(x, 3.15, S.z1 + 0.42);
    bracket.rotation.x = -0.75;
    g.add(bracket);
  }
  // underside downlights
  const underMat = new THREE.MeshBasicMaterial({
    map: null,
    color: 0xffdca8,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  for (let i = 0; i < 4; i++) {
    const x = S.x0 + 1.7 + i * 2.3;
    const m = new THREE.Mesh(planeGeo(0.35, 0.35), underMat);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, 3.355, S.z1 + 0.72);
    g.add(m);
    const bulb = meshCyl(0.09, 0.09, 0.02, R.warmLight, x, 3.36, S.z1 + 0.72, 12);
    g.add(bulb);
  }
  // vertical valance strips
  addBox(g, w, 0.08, 0.02, R.neonMint, (S.x0 + S.x1) / 2, 3.3, S.z1 + 1.19);
  assembly.add(g, { start: 2.8, duration: 0.8, mode: 'drop', distance: 0.9, land: true });
  return g;
}

function buildSignage(storeRoot, R, assets, assembly) {
  const main = new THREE.Group();
  storeRoot.add(main);
  const z = S.z1 + 0.18;
  const w = S.x1 - S.x0 - 0.05;
  const cy = 4.7;
  addRounded(main, w, 1.09, 0.22, 0.06, R.storeTrimDark, (S.x0 + S.x1) / 2, cy, z, {
    cast: true,
    roundSeg: 2,
  });
  const face = new THREE.Mesh(planeGeo(w - 0.1, 0.99), R.signFace);
  face.position.set((S.x0 + S.x1) / 2, cy + 0.01, z + 0.12);
  main.add(face);
  // framing strips
  addBox(main, w - 0.05, 0.035, 0.025, R.storeMetal, (S.x0 + S.x1) / 2, cy + 0.52, z + 0.13);
  addBox(main, w - 0.05, 0.025, 0.025, R.neonMint, (S.x0 + S.x1) / 2, cy - 0.53, z + 0.13);
  // support brackets
  for (let i = 0; i < 4; i++) {
    addBox(main, 0.045, 0.32, 0.07, R.storeMetal, S.x0 + 1.2 + i * 2.55, cy - 0.64, z - 0.02);
  }
  assembly.add(main, { start: 3.18, duration: 0.9, mode: 'rise', distance: 1.1, land: true, landAt: [-2.65, 4.2, 1.2] });

  // Side sign at the top of the east facade.
  const side = new THREE.Group();
  storeRoot.add(side);
  const sideCz = -2.2;
  addRounded(side, 0.2, 1.08, 5.6, 0.06, R.storeTrimDark, S.x1 + 0.06, cy, sideCz, { cast: true });
  const sideFace = new THREE.Mesh(planeGeo(5.5, 0.98), R.signFaceSide);
  sideFace.position.set(S.x1 + 0.17, cy + 0.01, sideCz);
  sideFace.rotation.y = Math.PI / 2;
  side.add(sideFace);
  addBox(side, 0.025, 0.03, 5.55, R.neonMint, S.x1 + 0.19, cy - 0.53, sideCz);
  assembly.add(side, { start: 3.32, duration: 0.85, mode: 'rise', distance: 0.8, land: false });

  // Blade sign near the corner.
  const blade = new THREE.Group();
  storeRoot.add(blade);
  const bx = S.x1 + 0.28;
  const bz = 0.36;
  addRounded(blade, 0.18, 2.55, 0.94, 0.05, R.storeTrimDark, bx, 4.75, bz, { cast: true });
  const bladeFace = new THREE.Mesh(planeGeo(0.84, 2.4), R.bladeSign);
  bladeFace.position.set(bx + 0.1, 4.75, bz);
  bladeFace.rotation.y = Math.PI / 2;
  blade.add(bladeFace);
  const bladeFace2 = bladeFace.clone();
  bladeFace2.position.x = bx - 0.1;
  bladeFace2.rotation.y = -Math.PI / 2;
  blade.add(bladeFace2);
  // little sparkle at top
  const topGlow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), R.neonOrange);
  topGlow.position.set(bx, 6.1, bz);
  blade.add(topGlow);
  assembly.add(blade, { start: 3.62, duration: 0.9, mode: 'drop', distance: 1.0, land: true, landAt: [bx, 4.1, bz] });
  return { main, side, blade, face, sideFace, bladeFace, bladeFace2 };
}

function buildExteriorDetails(storeRoot, R, assets, assembly) {
  const g = new THREE.Group();
  storeRoot.add(g);
  // Front window vinyls.
  const winPositions = [
    [-6.3, 1.55, 'windowCoffee', 0.78],
    [-3.85, 1.5, 'windowHot', 0.78],
    [-1.7, 1.58, 'windowNew', 0.72],
  ];
  for (const [x, y, key, size] of winPositions) {
    const decal = textureLabel(g, size, size, assets[key], x, y, S.z1 + 0.155, [0, 0, 0], { opacity: 0.94 });
    decal.renderOrder = 3;
  }
  const atm = textureLabel(g, 0.8, 0.8, assets.windowATM, -0.66, 1.72, S.z1 + 0.155, [0, 0, 0], { opacity: 0.9 });
  atm.renderOrder = 3;
  // Payment sticker strip at the bottom of the glass.
  const pay = textureLabel(g, 1.65, 0.82, assets.paymentDecal, -4.95, 0.95, S.z1 + 0.155, [0, 0, 0], { opacity: 0.84 });
  pay.renderOrder = 3;
  // a small "24H" label at the door side
  const smallLabel = textureLabel(g, 0.62, 0.31, assets.vendingLightbox, 0.05, 2.45, S.z1 + 0.155, [0, 0, 0], { opacity: 0.55 });
  smallLabel.renderOrder = 3;

  // Service wall on the east side: notice board.
  const boardBack = addRounded(g, 1.65, 1.24, 0.12, 0.03, R.storeTrimDark, S.x1 + 0.11, 1.57, -4.2, {
    cast: true,
  });
  boardBack.rotation.y = Math.PI / 2;
  const board = textureLabel(g, 1.52, 1.12, assets.noticeBoard, S.x1 + 0.185, 1.57, -4.2, [0, Math.PI / 2, 0], { opacity: 0.96 });
  board.renderOrder = 2;
  addBox(g, 0.025, 0.03, 1.6, R.neonMint, S.x1 + 0.2, 2.18, -4.2);
  // service lamp over board
  const serviceLight = addRounded(g, 0.12, 0.24, 0.12, 0.02, R.warmLight, S.x1 + 0.18, 2.42, -4.2);
  // posters further along the side wall
  const poster1 = textureLabel(g, 0.68, 1.02, assets.posterJazz, S.x1 + 0.105, 1.25, -5.55, [0, Math.PI / 2, 0], { opacity: 0.9 });
  poster1.renderOrder = 2;
  const poster2 = textureLabel(g, 0.68, 1.02, assets.posterNotice, S.x1 + 0.105, 1.1, -6.5, [0, Math.PI / 2, 0], { opacity: 0.84 });
  poster2.renderOrder = 2;

  // AC unit on the solid east wall.
  const ac = buildACUnit(g, R, 1.08, 0.7, 0.36, S.x1 + 0.27, 2.15, -7.2, 1);
  ac.rotation.x = 0;
  // Rotate to face east: the unit's fan points +z, rotate -PI/2 so +z -> +x.
  ac.rotation.y = -Math.PI / 2;
  // pipes along wall
  const pipeMat = R.metalGalv;
  const pipes = [
    [S.x1 + 0.12, -3.55],
    [S.x1 + 0.12, -7.95],
  ];
  for (const [x, z] of pipes) {
    const p = meshCyl(0.05, 0.05, 3.1, pipeMat, x, 1.65, z, 8);
    g.add(p);
  }
  const elbow = tubeFromPoints([
    new THREE.Vector3(S.x1 + 0.17, 0.4, -3.55),
    new THREE.Vector3(S.x1 + 0.25, 0.25, -3.45),
    new THREE.Vector3(S.x1 + 0.28, 0.2, -3.2),
  ], 0.05, pipeMat, { segments: 8, radialSegments: 6 });
  g.add(elbow);
  // Downspouts at the front corner.
  for (const [x, z] of [[S.x0 + 0.17, S.z1 + 0.14], [S.x1 - 0.18, S.z1 + 0.14]]) {
    const dp = meshCyl(0.045, 0.045, 3.4, R.storeMetal, x, 2.05, z, 8);
    g.add(dp);
  }
  // exterior vents under the sign
  for (let i = 0; i < 3; i++) {
    const vent = addBox(g, 0.65, 0.22, 0.03, R.storeTrimDark, -5.0 + i * 2.5, 3.55, S.z1 + 0.11);
    for (let j = 0; j < 4; j++) addBox(g, 0.52, 0.012, 0.035, R.storeMetalLight, -5.0 + i * 2.5, 3.48 + j * 0.045, S.z1 + 0.135);
  }
  // CCTV under the canopy.
  const cam = new THREE.Group();
  const camBody = meshRounded(0.24, 0.16, 0.2, 0.03, R.storeWall, 0, 0, 0, { cast: true });
  camBody.rotation.x = -0.2;
  cam.add(camBody);
  const lens = meshCyl(0.045, 0.055, 0.07, R.metalDark, 0, -0.04, 0.12, 10);
  lens.rotation.x = Math.PI / 2;
  cam.add(lens);
  const led = meshCyl(0.012, 0.012, 0.015, R.coolLight, 0.06, 0.02, 0.12, 8);
  led.rotation.x = Math.PI / 2;
  cam.add(led);
  cam.position.set(1.6, 3.26, S.z1 + 0.7);
  g.add(cam);
  // under-canopy small standing poster frames around window
  const posterFrame1 = addRounded(g, 0.6, 0.92, 0.08, 0.02, R.storeMetal, -6.78, 2.0, S.z1 + 0.12, { cast: true });
  poster1.rotation.set(0, Math.PI / 2, 0);
  const salePoster = textureLabel(g, 0.53, 0.82, assets.posterSale, -6.77, 2.0, S.z1 + 0.17, [0, 0, 0], { opacity: 0.98 });
  salePoster.renderOrder = 3;

  assembly.add(g, { start: 3.42, duration: 0.8, mode: 'fade' });
  return { group: g, serviceLight };
}

function buildInterior(storeRoot, R, assets, assembly) {
  const interior = {};
  const all = new THREE.Group();
  storeRoot.add(all);
  const floorTex = makeInteriorFloorTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.32,
    metalness: 0.02,
    envMapIntensity: 0.6,
  });
  // Shell floor and ceiling.
  const shell = new THREE.Group();
  storeRoot.add(shell);
  const floor = new THREE.Mesh(planeGeo(S.x1 - S.x0 - 0.36, S.z1 - S.z0 - 0.36), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((S.x0 + S.x1) / 2, FLOOR_Y - 0.01, (S.z0 + S.z1) / 2);
  floor.receiveShadow = true;
  shell.add(floor);
  const matBorder = addBox(shell, S.x1 - S.x0 - 0.4, 0.06, 0.45, R.interiorTrim,
    (S.x0 + S.x1) / 2, FLOOR_Y + 0.02, S.z1 - 0.36);
  const ceilingSlab = addBox(shell, S.x1 - S.x0 - 0.2, 0.12, S.z1 - S.z0 - 0.2, R.interiorCeiling,
    (S.x0 + S.x1) / 2, CEIL_Y + 0.13, (S.z0 + S.z1) / 2);
  // Ceiling beams
  for (let i = 0; i < 4; i++) {
    addBox(shell, S.x1 - S.x0 - 0.5, 0.12, 0.12, R.ceilingPanelFrame, (S.x0 + S.x1) / 2, CEIL_Y + 0.015, S.z0 + 1.4 + i * 2.15);
  }
  // Interior wall cladding, back wall and west.
  addBox(shell, S.x1 - S.x0 - 0.3, 2.7, 0.08, R.interiorWall, (S.x0 + S.x1) / 2, 1.8, S.z0 + 0.2);
  addBox(shell, 0.08, 2.7, S.z1 - S.z0 - 0.25, R.interiorWall, S.x0 + 0.22, 1.8, (S.z0 + S.z1) / 2);
  // dark skirting anchors the warm interior
  addBox(shell, S.x1 - S.x0 - 0.35, 0.14, 0.09, R.counterDark, (S.x0 + S.x1) / 2, FLOOR_Y + 0.08, S.z0 + 0.26);
  addBox(shell, 0.09, 0.14, S.z1 - S.z0 - 0.3, R.counterDark, S.x0 + 0.27, FLOOR_Y + 0.08, (S.z0 + S.z1) / 2);
  // Floor entrance mat.
  const matMat = new THREE.MeshStandardMaterial({ color: 0x4a5250, roughness: 0.9 });
  addRounded(shell, 2.05, 0.018, 1.15, 0.03, matMat, (S.doorX0 + S.doorX1) / 2, FLOOR_Y + 0.012, 0.35, {
    cast: false,
  });
  // small floor direction strips
  for (let i = 0; i < 3; i++) {
    addBox(shell, 0.65, 0.006, 0.07, R.curbEdge, -1.2 + i * 1.0, FLOOR_Y + 0.018, 0.9 - i * 0.38);
  }
  assembly.add(shell, { start: 2.2, duration: 0.75, mode: 'grow', land: false });

  // Ceiling light fixtures — long luminous bars.
  const lightsGroup = new THREE.Group();
  storeRoot.add(lightsGroup);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff0d2, toneMapped: false });
  lampMat.color.multiplyScalar(1.42);
  const lampFrameMat = R.ceilingPanelFrame;
  for (let row = 0; row < 5; row++) {
    const z = S.z0 + 1.15 + row * 1.85;
    addBox(lightsGroup, 7.8, 0.06, 0.18, lampFrameMat, -4.15, CEIL_Y - 0.015, z);
    addBox(lightsGroup, 7.55, 0.025, 0.11, lampMat, -4.15, CEIL_Y - 0.05, z);
  }
  // ceiling vents
  for (let i = 0; i < 4; i++) {
    addBox(lightsGroup, 0.5, 0.02, 0.3, R.metalLight, -6.4 + i * 2.4, CEIL_Y - 0.08, 0.1);
  }
  assembly.add(lightsGroup, { start: 2.35, duration: 0.6, mode: 'pop' });

  // Interior lights.
  const warmLights = [];
  const lightPositions = [
    [-5.6, -5.3],
    [-2.2, -2.2],
    [0.9, -3.9],
  ];
  for (let i = 0; i < lightPositions.length; i++) {
    const [x, z] = lightPositions[i];
    const pl = new THREE.PointLight(0xffd39e, 0, 8.5, 2.0);
    pl.position.set(x, 2.9, z);
    storeRoot.add(pl);
    assembly.addLight(pl, { start: 2.65 + i * 0.08, duration: 0.9, intensity: 14, flicker: i === 0 });
    warmLights.push(pl);
  }
  const coolLight = new THREE.PointLight(0xc9f4ff, 0, 6.5, 2.0);
  coolLight.position.set(-4.8, 2.2, -6.5);
  storeRoot.add(coolLight);
  assembly.addLight(coolLight, { start: 2.7, duration: 0.8, intensity: 8, flicker: false });

  // Fridge bank.
  const fridgeGroup = new THREE.Group();
  storeRoot.add(fridgeGroup);
  const fridgeW = 6.72;
  const fridgeX0 = -7.44;
  const fridgeFrontZ = S.z0 + 0.72;
  addBox(fridgeGroup, fridgeW, 2.65, 0.08, R.fridgeBack, fridgeX0 + fridgeW / 2, 1.82, S.z0 + 0.27);
  // Frame body.
  addBox(fridgeGroup, fridgeW + 0.12, 0.14, 0.75, R.fridgeFrame, fridgeX0 + fridgeW / 2, 0.55, S.z0 + 0.64);
  addBox(fridgeGroup, fridgeW + 0.12, 0.16, 0.75, R.fridgeFrame, fridgeX0 + fridgeW / 2, 3.0, S.z0 + 0.64);
  addBox(fridgeGroup, fridgeW + 0.12, 2.55, 0.12, R.fridgeFrame, fridgeX0 + fridgeW / 2, 1.8, S.z0 + 0.25);
  // Vertical dividers and shelf strips.
  const divMat = R.fridgeFrame;
  for (let i = 0; i <= 7; i++) {
    addBox(fridgeGroup, 0.055, 2.37, 0.09, divMat, fridgeX0 + (i / 7) * fridgeW, 1.79, fridgeFrontZ);
  }
  for (let level = 0; level < 4; level++) {
    addBox(fridgeGroup, fridgeW, 0.045, 0.06, R.fridgeShelf, fridgeX0 + fridgeW / 2, 0.95 + level * 0.5, fridgeFrontZ - 0.01);
  }
  addBox(fridgeGroup, fridgeW, 0.05, 0.06, R.fridgeShelf, fridgeX0 + fridgeW / 2, 0.63, fridgeFrontZ);
  // Fridge lights under shelves.
  for (let level = 0; level < 4; level++) {
    addBox(fridgeGroup, fridgeW - 0.15, 0.02, 0.022, R.fridgeLight, fridgeX0 + fridgeW / 2, 0.96 + level * 0.5, fridgeFrontZ + 0.02);
  }
  // Bottle products.
  const bottleGeo = new THREE.CylinderGeometry(0.055, 0.05, 1, 6);
  const bottleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const bottleColors = ['#e6f5ec', '#8fc9ba', '#e6ad57', '#d97b5d', '#84b3db', '#d8d0a8', '#b6e0cb', '#cf6e63'];
  const bottles = [];
  const productBoxes = [];
  const productBoxMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: R.gradient });
  for (let bay = 0; bay < 7; bay++) {
    const bx = fridgeX0 + (bay + 0.5) * (fridgeW / 7);
    for (let level = 0; level < 4; level++) {
      const shelfY = 0.73 + level * 0.5;
      for (let col = 0; col < 5; col++) {
        const x = bx - 0.27 + col * 0.135;
        const tall = 0.2 + ((bay * 5 + level * 7 + col) % 3) * 0.045;
        const color = bottleColors[(bay + level * 3 + col * 2) % bottleColors.length];
        const isBox = (bay + col + level) % 7 === 0;
        if (isBox) {
          productBoxes.push({
            p: [x, shelfY + 0.11, fridgeFrontZ - 0.16],
            s: [0.12, 0.22, 0.1],
            color: ['#eadfbf', '#d46f69', '#518f82'][(bay + col) % 3],
          });
        } else {
          bottles.push({
            p: [x, shelfY + tall / 2 + 0.06, fridgeFrontZ - 0.16],
            s: [1, tall, 1],
            color,
          });
        }
      }
    }
  }
  // add little price rails
  for (let level = 0; level < 4; level++) {
    addBox(fridgeGroup, fridgeW - 0.25, 0.05, 0.015, R.counter, fridgeX0 + fridgeW / 2, 0.88 + level * 0.5, fridgeFrontZ + 0.04);
  }
  const fridgeGlass = new THREE.Mesh(planeGeo(fridgeW - 0.1, 2.35), R.fridgeGlass);
  fridgeGlass.position.set(fridgeX0 + fridgeW / 2, 1.78, fridgeFrontZ + 0.03);
  fridgeGroup.add(fridgeGlass);
  // dark green canopy over the glowing fridge bank
  addBox(fridgeGroup, fridgeW + 0.2, 0.42, 0.3, R.storeTrimDark, fridgeX0 + fridgeW / 2, 3.02, S.z0 + 0.48);
  addBox(fridgeGroup, fridgeW + 0.08, 0.025, 0.025, R.fridgeLight, fridgeX0 + fridgeW / 2, 2.82, fridgeFrontZ + 0.08);
  textureLabel(fridgeGroup, 6.2, 0.27, assets.fridgeHeader, fridgeX0 + fridgeW / 2, 3.04, S.z0 + 0.66, [0, 0, 0], { opacity: 1 });
  // warm/cool divider accents
  addBox(fridgeGroup, 0.025, 2.3, 0.03, R.neonMint, fridgeX0 - 0.04, 1.75, fridgeFrontZ + 0.05);
  addBox(fridgeGroup, 0.025, 2.3, 0.03, R.neonMint, fridgeX0 + fridgeW + 0.04, 1.75, fridgeFrontZ + 0.05);
  // fridge frame mounting
  assembly.add(fridgeGroup, { start: 2.48, duration: 0.9, mode: 'rise', distance: 0.7, land: true, landAt: [-4.1, 0.4, -7.6] });

  // Shelving rows.
  const shelves = new THREE.Group();
  storeRoot.add(shelves);
  const boardList = [];
  const legList = [];
  const shelvingRows = [
    { z: -5.35, x0: -7.15, w: 4.5, levels: 3, h: 1.48 },
    { z: -3.22, x0: -7.15, w: 4.5, levels: 3, h: 1.36 },
    { z: -1.35, x0: -7.15, w: 3.3, levels: 2, h: 0.86 },
  ];
  for (const row of shelvingRows) {
    const depth = 0.62;
    for (let l = 0; l < row.levels; l++) {
      const y = 0.48 + (l * row.h) / (row.levels + 0.2);
      boardList.push({ p: [row.x0 + row.w / 2, y, row.z], s: [row.w, 0.065, depth] });
    }
    boardList.push({ p: [row.x0 + row.w / 2, 0.48 + row.h, row.z], s: [row.w, 0.055, depth + 0.04] });
    for (const x of [row.x0, row.x0 + row.w]) {
      legList.push({ p: [x, 0.45 + row.h / 2, row.z - depth / 2 + 0.02], s: [0.055, row.h, 0.055] });
      legList.push({ p: [x, 0.45 + row.h / 2, row.z + depth / 2 - 0.02], s: [0.055, row.h, 0.055] });
    }
    // product rows on each level
    const cols = Math.floor(row.w / 0.22);
    for (let l = 0; l < row.levels; l++) {
      const y = 0.56 + (l * row.h) / (row.levels + 0.2);
      for (let c = 0; c < cols; c++) {
        const x = row.x0 + 0.17 + c * 0.21;
        for (let d = 0; d < 2; d++) {
          const z = row.z - 0.15 + d * 0.25;
          const h = 0.14 + ((c + l) % 3) * 0.055;
          const w = 0.1 + ((c * 3 + d) % 3) * 0.018;
          const colors = ['#d9685e', '#e3be5b', '#73a78e', '#6f93bd', '#e8d8b1', '#b27fa2', '#d58d52', '#90b4aa'];
          productBoxes.push({
            p: [x, y + h / 2 + 0.03, z],
            s: [w, h, 0.12],
            color: colors[(c * 3 + l + d * 2) % colors.length],
          });
        }
      }
    }
    // shelf edge price/receipt rail
    addBox(shelves, row.w, 0.055, 0.025, R.counter, row.x0 + row.w / 2, 0.53, row.z + depth / 2 + 0.015);
  }
  const boardMesh = instancedFromList(boxGeo(1, 1, 1), R.shelf, boardList);
  const legMesh = instancedFromList(boxGeo(1, 1, 1), R.shelfDark, legList);
  shelves.add(boardMesh, legMesh);
  // warm under-shelf strips make the products legible through the glass
  for (const row of shelvingRows) {
    for (let l = 0; l < row.levels; l++) {
      const y = 0.48 + (l * row.h) / (row.levels + 0.2) - 0.04;
      addBox(shelves, row.w - 0.08, 0.018, 0.018, R.warmLight, row.x0 + row.w / 2, y, row.z + 0.32);
    }
  }
  // aisle hanging signs
  const aisle1 = textureLabel(shelves, 1.65, 0.55, assets.aisleSnack, -4.7, 2.65, -4.25, [0, 0, 0], { opacity: 0.98 });
  const aisle2 = textureLabel(shelves, 1.55, 0.52, assets.aisleDrink, -4.7, 2.62, -2.25, [0, 0, 0], { opacity: 0.98 });
  aisle1.material.side = THREE.DoubleSide;
  aisle2.material.side = THREE.DoubleSide;
  // little chains
  for (const x of [-5.2, -4.2]) {
    for (const z of [-4.25, -2.25]) {
      addBox(shelves, 0.012, 0.4, 0.012, R.metalDark, x, 2.98, z);
    }
  }
  assembly.add(shelves, { start: 2.68, duration: 0.9, mode: 'rise', distance: 0.7, land: true, landAt: [-4.5, 0.4, -4.5] });

  // Magazine rack near the front glass.
  const mags = new THREE.Group();
  storeRoot.add(mags);
  const magColors = ['#e9b354', '#538d8a', '#c95f6a', '#e5d7b0', '#657eaa', '#b47a9a', '#d48c55'];
  const magList = [];
  for (let row = 0; row < 2; row++) {
    addBox(mags, 2.55, 0.06, 0.55, R.shelf, -5.55, 0.57 + row * 0.34, -0.15);
    for (let i = 0; i < 6; i++) {
      for (let d = 0; d < 2; d++) {
        magList.push({
          p: [-6.52 + i * 0.34, 0.765 + row * 0.34, -0.32 + d * 0.34],
          s: [0.22, 0.3, 0.024],
          r: [-0.22, 0.04 * d, 0.02],
          color: magColors[(i + row * 2 + d) % magColors.length],
        });
      }
    }
  }
  const magMesh = instancedFromList(boxGeo(1, 1, 1), R.labelWhite, magList);
  mags.add(magMesh);
  // white cover bands make the coloured blocks read as magazines
  const bandList = magList.map((m, i) => ({
    p: [m.p[0], m.p[1] + 0.065, m.p[2] + 0.015],
    s: [0.17, 0.035, 0.005],
    r: m.r,
    color: i % 4 === 0 ? '#fff1ce' : '#e7e2d2',
  }));
  const bandMesh = instancedFromList(boxGeo(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), bandList);
  mags.add(bandMesh);
  addBox(mags, 0.045, 0.7, 0.65, R.shelfDark, -6.88, 0.7, -0.1);
  addBox(mags, 0.045, 0.7, 0.65, R.shelfDark, -4.18, 0.7, -0.1);
  assembly.add(mags, { start: 3.05, duration: 0.7, mode: 'rise', distance: 0.4, land: false });

  // Low ice-cream freezer by the front glass.
  const freezer = new THREE.Group();
  storeRoot.add(freezer);
  addRounded(freezer, 1.48, 0.74, 0.68, 0.05, R.counter, -2.0, FLOOR_Y + 0.38, -0.25, { cast: true, roundSeg: 2 });
  addRounded(freezer, 1.38, 0.05, 0.58, 0.03, R.coolLight, -2.0, FLOOR_Y + 0.77, -0.25, { cast: false });
  addBox(freezer, 1.28, 0.012, 0.47, R._basic('#bfeef2'), -2.0, FLOOR_Y + 0.8, -0.25);
  const freezerGlass = new THREE.Mesh(planeGeo(1.3, 0.5), R.fridgeGlass);
  freezerGlass.rotation.x = -Math.PI / 2;
  freezerGlass.position.set(-2.0, FLOOR_Y + 0.82, -0.25);
  freezer.add(freezerGlass);
  const tubGeom = new THREE.CylinderGeometry(0.075, 0.06, 0.16, 8);
  for (let i = 0; i < 5; i++) {
    const tub = new THREE.Mesh(tubGeom, [R._basic('#f5a0ad'), R._basic('#f5d28e'), R._basic('#b4d4a4'), R._basic('#b0c3de')][i % 4]);
    tub.position.set(-2.55 + i * 0.26, FLOOR_Y + 0.76, -0.3);
    freezer.add(tub);
  }
  for (let i = 0; i < 2; i++) {
    addBox(freezer, 0.58, 0.02, 0.04, R.counterDark, -2.35 + i * 0.7, FLOOR_Y + 0.82, 0.0);
  }
  const freezerLamp = new THREE.PointLight(0xbfefff, 0, 1.8, 2.0);
  freezerLamp.position.set(-2.0, FLOOR_Y + 0.9, 0.2);
  freezer.add(freezerLamp);
  // The freezer face is emissive already; no dynamic light is registered here.
  assembly.add(freezer, { start: 3.0, duration: 0.7, mode: 'rise', distance: 0.35, land: false });

  // Checkout counter and warm food equipment near the east window.
  const counterGroup = new THREE.Group();
  storeRoot.add(counterGroup);
  const counterZ = -2.55;
  addRounded(counterGroup, 0.9, 0.94, 2.5, 0.04, R.counterFront, 1.58, FLOOR_Y + 0.47, counterZ, {
    cast: true,
    roundSeg: 2,
  });
  addBox(counterGroup, 0.96, 0.08, 2.6, R.counterWood, 1.58, FLOOR_Y + 0.97, counterZ);
  // register
  addRounded(counterGroup, 0.5, 0.28, 0.45, 0.03, R.register, 1.55, FLOOR_Y + 1.14, -2.15, { cast: true });
  const screen = addBox(counterGroup, 0.38, 0.26, 0.025, R.registerScreen, 1.55, FLOOR_Y + 1.38, -1.91);
  screen.rotation.x = -0.14;
  addBox(counterGroup, 0.3, 0.035, 0.2, R.metalDark, 1.46, FLOOR_Y + 1.04, -1.8);
  // scanner
  addRounded(counterGroup, 0.2, 0.1, 0.25, 0.02, R.metalDark, 1.8, FLOOR_Y + 1.02, -1.55, { cast: false });
  // coffee machine
  addRounded(counterGroup, 0.5, 0.72, 0.48, 0.04, R.coffeeMachine, 1.68, FLOOR_Y + 1.38, -3.1, { cast: true });
  addBox(counterGroup, 0.3, 0.17, 0.02, R.coffeeMachineLight, 1.68, FLOOR_Y + 1.52, -2.86);
  addBox(counterGroup, 0.16, 0.05, 0.08, R.metalGalv, 1.68, FLOOR_Y + 1.15, -2.92);
  // hot snack warmer
  addRounded(counterGroup, 0.72, 0.5, 0.62, 0.03, R.hotCase, 1.5, FLOOR_Y + 1.25, -1.55, { cast: true });
  const hotGlass = new THREE.Mesh(planeGeo(0.64, 0.38), R.hotGlass);
  hotGlass.position.set(1.5, FLOOR_Y + 1.45, -1.24);
  hotGlass.renderOrder = 2;
  counterGroup.add(hotGlass);
  const hotInner = new THREE.Mesh(planeGeo(0.58, 0.27), new THREE.MeshBasicMaterial({ color: 0xffb771, toneMapped: false }));
  hotInner.position.set(1.5, FLOOR_Y + 1.42, -1.545);
  counterGroup.add(hotInner);
  for (let i = 0; i < 4; i++) {
    addRounded(counterGroup, 0.105, 0.075, 0.075, 0.02, R.hotFood, 1.3 + i * 0.13, FLOOR_Y + 1.32, -1.49, { cast: false });
  }
  // cup stack / warmer case under counter
  for (let i = 0; i < 4; i++) {
    addRounded(counterGroup, 0.16, 0.12, 0.16, 0.025, R.counter, 1.2 + i * 0.15, FLOOR_Y + 1.08, -3.55, { cast: false });
  }
  // counter support shelves and under lights
  addBox(counterGroup, 0.08, 0.11, 2.55, R.interiorLight, 1.12, FLOOR_Y + 1.07, counterZ);
  assembly.add(counterGroup, { start: 2.88, duration: 0.9, mode: 'rise', distance: 0.55, land: true, landAt: [1.5, 0.45, -2.5] });

  // Hanging menu board above the counter, visible through the side glazing.
  const menuGroup = new THREE.Group();
  storeRoot.add(menuGroup);
  const menuTex = makeCounterMenuTexture();
  addRounded(menuGroup, 0.07, 0.62, 2.0, 0.02, R.storeTrimDark, 1.48, 2.62, -2.45);
  const menuA = new THREE.Mesh(planeGeo(1.92, 0.55), new THREE.MeshBasicMaterial({ map: menuTex, toneMapped: false }));
  menuA.position.set(1.53, 2.62, -2.45);
  menuA.rotation.y = Math.PI / 2;
  menuGroup.add(menuA);
  const menuB = menuA.clone();
  menuB.position.x = 1.43;
  menuB.rotation.y = -Math.PI / 2;
  menuGroup.add(menuB);
  for (const z of [-3.3, -1.6]) {
    addBox(menuGroup, 0.012, 0.33, 0.012, R.metalDark, 1.48, 2.98, z);
  }
  assembly.add(menuGroup, { start: 3.24, duration: 0.6, mode: 'pop' });

  // Pale shelf header above the central aisles.
  const shelfHeader = new THREE.Group();
  const headerTex = makeShelfHeaderTexture();
  const headerMesh = new THREE.Mesh(planeGeo(3.8, 0.5), new THREE.MeshBasicMaterial({ map: headerTex, toneMapped: false }));
  headerMesh.position.set(-4.85, 1.62, -5.02);
  shelfHeader.add(headerMesh);
  addBox(shelfHeader, 3.9, 0.04, 0.08, R.storeTrimDark, -4.85, 1.87, -5.02);
  storeRoot.add(shelfHeader);
  assembly.add(shelfHeader, { start: 3.34, duration: 0.5, mode: 'pop' });

  // ATM along the west wall (visible from the front-left window).
  const atm = new THREE.Group();
  storeRoot.add(atm);
  addRounded(atm, 0.56, 1.4, 0.72, 0.04, R.atm, S.x0 + 0.62, FLOOR_Y + 0.72, -2.35, { cast: true });
  addBox(atm, 0.02, 0.56, 0.4, R.atmScreen, S.x0 + 0.9, FLOOR_Y + 1.16, -2.35);
  addBox(atm, 0.02, 0.18, 0.34, R.interiorLight, S.x0 + 0.9, FLOOR_Y + 0.85, -2.35);
  textureLabel(atm, 0.62, 0.31, assets.windowATM, S.x0 + 0.62, 2.35, -2.35, [0, Math.PI / 2, 0], { opacity: 0.9 });
  assembly.add(atm, { start: 3.0, duration: 0.7, mode: 'rise', distance: 0.4, land: false });

  // Baskets by the entrance.
  const baskets = new THREE.Group();
  storeRoot.add(baskets);
  for (let i = 0; i < 5; i++) {
    addRounded(baskets, 0.46, 0.12, 0.34, 0.04, R.basket, 1.78, FLOOR_Y + 0.1 + i * 0.11, -0.52, { cast: false });
    addBox(baskets, 0.47, 0.015, 0.35, R.basketRim, 1.78, FLOOR_Y + 0.15 + i * 0.11, -0.52);
  }
  assembly.add(baskets, { start: 3.18, duration: 0.6, mode: 'rise', distance: 0.3, land: false });

  // Staff door at the back, right of fridges.
  const staff = new THREE.Group();
  storeRoot.add(staff);
  addBox(staff, 0.78, 2.1, 0.06, R.storeTrimDark, 1.15, FLOOR_Y + 1.05, S.z0 + 0.16);
  textureLabel(staff, 0.62, 0.62, assets.serviceDoor, 1.15, FLOOR_Y + 1.1, S.z0 + 0.2, [0, 0, 0], { opacity: 0.8 });
  const staffLamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), R.warmLight);
  staffLamp.position.set(0.65, FLOOR_Y + 2.25, S.z0 + 0.2);
  staff.add(staffLamp);
  assembly.add(staff, { start: 2.9, duration: 0.7, mode: 'rise', distance: 0.4, land: false });

  // Interior posters add colour to the walls.
  const posters = new THREE.Group();
  storeRoot.add(posters);
  textureLabel(posters, 0.6, 0.78, assets.interiorPosterHot, -0.35, 1.6, S.z0 + 0.26, [0, 0, 0], { opacity: 1 });
  textureLabel(posters, 0.55, 0.7, assets.interiorPosterCake, 1.55, 1.45, S.z0 + 0.26, [0, 0, 0], { opacity: 1 });
  textureLabel(posters, 0.5, 0.7, assets.aisleDaily, S.x0 + 0.28, 2.2, -4.3, [0, Math.PI / 2, 0], { opacity: 0.94 });
  assembly.add(posters, { start: 3.2, duration: 0.7, mode: 'fade' });

  // Hanging promo banners near the glass.
  const banners = new THREE.Group();
  storeRoot.add(banners);
  const bannerColors = ['#b95850', '#2f746a', '#c69144', '#5c6d96'];
  for (let i = 0; i < 4; i++) {
    const banner = addBox(banners, 0.55, 0.13, 0.012, new THREE.MeshBasicMaterial({ color: bannerColors[i], toneMapped: false }),
      -6.1 + i * 0.72, 2.86, -0.72);
    banner.rotation.y = 0.02 * (i - 1.5);
    addBox(banners, 0.012, 0.23, 0.012, R.metalDark, -6.1 + i * 0.72, 3.0, -0.72);
  }
  assembly.add(banners, { start: 3.28, duration: 0.55, mode: 'pop' });

  // Product instances.
  const productsGroup = new THREE.Group();
  storeRoot.add(productsGroup);
  const boxesMesh = instancedFromList(boxGeo(1, 1, 1), productBoxMat, productBoxes);
  const bottlesMesh = instancedFromList(bottleGeo, bottleMat, bottles);
  productsGroup.add(boxesMesh, bottlesMesh);
  assembly.add(productsGroup, { start: 3.1, duration: 0.75, mode: 'pop', land: false });

  // Tiny price cards / shelf signage.
  const priceGroup = new THREE.Group();
  storeRoot.add(priceGroup);
  for (let i = 0; i < 12; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    addBox(priceGroup, 0.16, 0.09, 0.01, i % 3 === 0 ? R.neonOrange : R.counter, -6.8 + col * 0.55, 0.69 + row * 0.5, -2.9);
  }
  assembly.add(priceGroup, { start: 3.25, duration: 0.5, mode: 'pop' });

  // steam planes from the hot case
  const steamGroup = new THREE.Group();
  const steamMat = new THREE.MeshBasicMaterial({
    map: assets.steam,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    color: 0xffe2c0,
    side: THREE.DoubleSide,
  });
  const steams = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(planeGeo(0.32, 0.4), steamMat.clone());
    m.position.set(1.4 + i * 0.06, FLOOR_Y + 1.65, -1.32);
    m.userData.phase = i * 1.7;
    m.material.opacity = 0.06;
    steamGroup.add(m);
    steams.push(m);
  }
  storeRoot.add(steamGroup);
  assembly.add(steamGroup, { start: 3.35, duration: 0.6, mode: 'pop' });

  // Interior ambient fill is provided by the ceiling panels and point lights.
  const fill = new THREE.PointLight(0xffd9b0, 0, 12, 1.6);
  fill.position.set(-2.5, 1.8, -2.5);

  // Neon-tinted strips flanking the door frame.
  const doorGlow = new THREE.Group();
  storeRoot.add(doorGlow);
  addBox(doorGlow, 0.03, 2.4, 0.02, R.neonMint, S.doorX0 - 0.1, 1.93, S.z1 + 0.18);
  addBox(doorGlow, 0.03, 2.4, 0.02, R.neonOrange, S.doorX1 + 0.1, 1.93, S.z1 + 0.18);
  assembly.add(doorGlow, { start: 3.42, duration: 0.6, mode: 'fade' });

  interior.update = (time) => {
    for (const m of steams) {
      const p = (time * 0.32 + m.userData.phase) % 1;
      m.position.y = FLOOR_Y + 1.55 + p * 0.9;
      m.position.x = 1.4 + Math.sin(time * 0.8 + m.userData.phase) * 0.08;
      m.material.opacity = 0.03 + 0.09 * (1 - p) * Math.sin(p * Math.PI);
      m.quaternion.copy(storeRoot.userData.camera?.quaternion ?? new THREE.Quaternion());
    }
  };
  interior.warmLights = warmLights;
  return interior;
}

function buildBackService(storeRoot, R, assets, assembly) {
  const g = new THREE.Group();
  storeRoot.add(g);
  const z = S.z0 - 0.015;
  const y0 = SIDEWALK_Y;
  // staff door and small access canopy
  addRounded(g, 1.02, 2.14, 0.1, 0.03, R.storeMetal, -2.8, y0 + 1.2, z, { cast: true, roundSeg: 2 });
  const doorTex = new THREE.MeshBasicMaterial({ map: assets.serviceDoor, toneMapped: false });
  const door = new THREE.Mesh(planeGeo(0.86, 1.98), doorTex);
  door.position.set(-2.8, y0 + 1.2, z - 0.06);
  door.rotation.y = Math.PI;
  g.add(door);
  for (let i = 0; i < 4; i++) {
    addBox(g, 0.82, 0.018, 0.02, R.storeMetalLight, -2.8, y0 + 0.75 + i * 0.42, z - 0.08);
  }
  addBox(g, 0.1, 0.2, 0.1, R.warmLight, -2.4, y0 + 2.45, z - 0.15);
  addRounded(g, 1.5, 0.08, 0.62, 0.03, R.storeCanopy, -2.8, y0 + 2.82, z - 0.22, { cast: true });
  // wall ventilation and service pipes
  addBox(g, 1.1, 0.62, 0.12, R.storeMetal, 1.3, y0 + 2.55, z - 0.07);
  for (let i = 0; i < 6; i++) {
    addBox(g, 0.94, 0.035, 0.03, R.storeMetalLight, 1.3, y0 + 2.3 + i * 0.09, z - 0.14);
  }
  const pipeMat = R.metalGalv;
  const p1 = meshCyl(0.045, 0.045, 3.4, pipeMat, -7.6, y0 + 1.9, z - 0.15, 8);
  g.add(p1);
  const p2 = meshCyl(0.045, 0.045, 3.4, pipeMat, 2.22, y0 + 1.9, z - 0.15, 8);
  g.add(p2);
  // crates and a green dumpster
  const dumpster = new THREE.Group();
  addRounded(dumpster, 1.1, 0.95, 0.8, 0.045, R._toon('#3d5b4a'), 0, 0.5, 0, { cast: true });
  addRounded(dumpster, 1.16, 0.12, 0.86, 0.03, R._toon('#314a3c'), 0, 1.0, 0, { cast: true });
  addBox(dumpster, 0.9, 0.12, 0.03, R.metalDark, 0, 0.65, 0.415);
  addBox(dumpster, 0.2, 0.2, 0.03, R.metalGalv, 0, 0.85, 0.42);
  for (let i = 0; i < 2; i++) {
    const wheel = meshCyl(0.08, 0.08, 0.05, R.rubber, (i ? 0.42 : -0.42), 0.06, 0.35, 8);
    wheel.rotation.x = Math.PI / 2;
    dumpster.add(wheel);
  }
  dumpster.position.set(-6.6, y0, -9.3);
  g.add(dumpster);
  const crateColors = ['#6d5540', '#5d6253', '#735b44'];
  for (let i = 0; i < 5; i++) {
    const x = 0.65 + (i % 2) * 0.45;
    const y = y0 + 0.16 + Math.floor(i / 2) * 0.34;
    const zOff = -9.05 - (i % 3) * 0.12;
    const c = addRounded(g, 0.55, 0.32, 0.44, 0.03, R._toon(crateColors[i % 3]), x, y, zOff, { cast: true });
    addBox(g, 0.46, 0.025, 0.02, R.woodDark, x, y + 0.08, zOff + 0.23);
  }
  // rolled hose, drain, small puddle
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 6, 14), R.rubber);
  hose.rotation.x = -Math.PI / 2;
  hose.position.set(-5.6, y0 + 0.04, -8.85);
  g.add(hose);
  const puddle = new THREE.Mesh(planeGeo(1.5, 0.7),
    new THREE.MeshBasicMaterial({ color: 0x1d262a, transparent: true, opacity: 0.55, depthWrite: false })
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-3.8, y0 + 0.055, -9.2);
  g.add(puddle);
  // cool wall sign
  addRounded(g, 0.8, 0.22, 0.04, 0.02, R.storeTrimDark, 1.3, y0 + 3.22, z - 0.02);
  const lamp = new THREE.PointLight(0xffd0a0, 0, 4.8, 2.0);
  lamp.position.set(-2.8, y0 + 2.6, -8.8);
  g.add(lamp);
  assembly.addLight(lamp, { start: 4.2, duration: 0.8, intensity: 4 });
  addContactShadow(g, 1.7, 1.5, -6.6, -9.3, y0 + 0.02, 0.35);
  addContactShadow(g, 1.8, 1.4, 0.9, -9.15, y0 + 0.02, 0.3);
  assembly.add(g, { start: 3.15, duration: 0.8, mode: 'fade' });
  return g;
}


export function buildStore(scene, assets, R, assembly) {
  const storeRoot = new THREE.Group();
  storeRoot.name = 'hoshikuzu-mart';
  storeRoot.userData.glassStreak = assets.glassStreak;
  scene.add(storeRoot);

  const outerLights = [];
  const shell = buildShell(storeRoot, R, assembly);
  // window sheen on front and side
  const sheenMatFront = new THREE.MeshBasicMaterial({
    map: assets.glassStreak,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    color: 0xc7edf1,
  });
  const sheenFront = new THREE.Mesh(planeGeo(6.8, 2.55), sheenMatFront);
  sheenFront.position.set(-3.4, 1.95, S.z1 + 0.14);
  sheenFront.renderOrder = 3;
  storeRoot.add(sheenFront);
  const sheenSide = sheenFront.clone();
  sheenSide.material = sheenMatFront.clone();
  sheenSide.material.opacity = 0.11;
  sheenSide.geometry = planeGeo(4.15, 2.5);
  sheenSide.position.set(S.x1 + 0.13, 1.95, -1.0);
  sheenSide.rotation.y = Math.PI / 2;
  storeRoot.add(sheenSide);
  assembly.add(sheenFront, { start: 2.3, duration: 0.8, mode: 'fade' });
  assembly.add(sheenSide, { start: 2.35, duration: 0.8, mode: 'fade' });

  const entrance = buildEntrance(storeRoot, R, assets, assembly, outerLights);
  const canopy = buildCanopy(storeRoot, R, assembly);
  // Canopy downlight spills.
  for (let i = 0; i < 4; i++) {
    if (i !== 0 && i !== 2) continue;
    const pl = new THREE.PointLight(0xffc886, 0, 5.0, 2.0);
    pl.position.set(S.x0 + 1.7 + i * 2.3, 3.25, S.z1 + 0.82);
    storeRoot.add(pl);
    const I = i === 2 ? 4.5 : 3.0;
    assembly.addLight(pl, { start: 2.95 + i * 0.06, duration: 0.7, intensity: I });
    outerLights.push(pl);
  }
  const roof = buildRoof(storeRoot, R, assets, assembly);
  const signage = buildSignage(storeRoot, R, assets, assembly);
  const exterior = buildExteriorDetails(storeRoot, R, assets, assembly);
  const interior = buildInterior(storeRoot, R, assets, assembly);
  buildBackService(storeRoot, R, assets, assembly);

  // soft fake wall shadow strip under canopy and around the base
  const shadowGroup = new THREE.Group();
  storeRoot.add(shadowGroup);
  addContactShadow(shadowGroup, 12.2, 3.6, -2.6, 2.25, S.y + 0.012, 0.28, 0);
  addContactShadow(shadowGroup, 3.0, 8.8, 2.9, -3.8, S.y + 0.013, 0.28, 0);
  assembly.add(shadowGroup, { start: 3.05, duration: 1.0, mode: 'fade' });

  // Small interior clock above the door.
  const clock = new THREE.Group();
  addBox(clock, 0.45, 0.22, 0.04, R.storeTrimDark, 0, 0, 0);
  const clockFace = new THREE.Mesh(planeGeo(0.38, 0.16), new THREE.MeshBasicMaterial({
    color: 0xffe4bb,
    toneMapped: false,
  }));
  clockFace.position.z = 0.025;
  clock.add(clockFace);
  clock.position.set(1.3, 3.06, S.z1 - 0.2);
  exterior.group.add(clock);

  // A faint external wall wash.
  const wash = new THREE.PointLight(0x9dcbd0, 0, 9, 2.0);
  wash.position.set(-1.2, 5.2, 3.2);

  // Dynamic pieces.
  let glitchTimer = 0;
  let signBaseIntensity = 1;
  let sensorPhase = 0;

  return {
    root: storeRoot,
    lights: outerLights,
    warmLights: interior.warmLights,
    update(time, dt, camera) {
      storeRoot.userData.camera = camera;
      // Restrained neon life: an occasional quick flutter, then steady.
      glitchTimer -= dt;
      let flick = 1;
      if (glitchTimer < 0) {
        if (Math.sin(time * 0.74 + 1.2) > 0.9993) glitchTimer = 0.22;
      }
      if (glitchTimer > 0) flick = 0.68 + 0.32 * Math.abs(Math.sin(time * 61.0));
      R.signFace.color.setScalar(0.94 + 0.06 * flick);
      R.signFaceSide.color.setScalar(0.9 + 0.1 * flick);
      R.bladeSign.color.setScalar(0.92 + 0.08 * flick);
      // LED on the door sensor
      sensorPhase += dt * 2.7;
      const pulse = 0.55 + 0.45 * Math.pow(Math.max(0, Math.sin(sensorPhase)), 6);
      entrance.sensorLed.material.color.setRGB(0.7 * pulse, 1.1 * pulse, 1.0 * pulse);
      interior.update(time);
      sheenFront.material.opacity = 0.13 + 0.035 * Math.sin(time * 0.35);
      sheenSide.material.opacity = 0.09 + 0.025 * Math.sin(time * 0.31 + 2.1);
    },
  };
}
