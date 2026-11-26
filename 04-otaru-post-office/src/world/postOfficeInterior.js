import * as THREE from 'three';
import { POST, SNOW_Y } from '../config.js';
import { buildCat } from './cat.js';
import {
  canvasTexture,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  rng,
  TAU,
  tubeFromPoints,
} from '../core/utils.js';

const P = POST;

function box(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, { cast: opts.cast ?? false, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function rounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, { cast: opts.cast ?? false, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function cyl(parent, rt, rb, h, mat, x, y, z, seg = 10) {
  const m = meshCyl(rt, rb, h, mat, x, y, z, seg, { cast: true, receive: true });
  parent.add(m);
  return m;
}

function label(parent, w, h, tex, x, y, z, opts = {}) {
  const m = new THREE.Mesh(planeGeo(w, h), new THREE.MeshBasicMaterial({
    map: tex,
    transparent: opts.transparent ?? false,
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

function localTextTexture(text, sub = '', opts = {}) {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = opts.bg ?? '#f7f4e9';
    ctx.fillRect(0, 0, w, h);
    if (opts.border !== false) {
      ctx.strokeStyle = opts.borderColor ?? '#aebbb8';
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, w - 16, h - 16);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = opts.color ?? '#435851';
    ctx.font = `700 ${opts.size ?? 92}px "Yu Gothic","Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
    ctx.fillText(text, w / 2, h / 2 - (sub ? 22 : 0));
    if (sub) {
      ctx.fillStyle = opts.subColor ?? '#89918a';
      ctx.font = `500 ${opts.subSize ?? 30}px "Trebuchet MS","Yu Gothic",sans-serif`;
      ctx.fillText(sub, w / 2, h / 2 + 66);
    }
  });
}

function buildShell(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const floorW = 8.7;
  const floorD = 6.25;
  const cx = P.x0 + 0.2 + floorW / 2;
  const cz = P.z0 + 0.2 + floorD / 2;
  // Tiled public-office floor.
  box(g, floorW, 0.08, floorD, R.interiorFloor, cx, P.floorY - 0.03, cz);
  // A quiet warm entrance mat.
  const mat = new THREE.Mesh(planeGeo(1.7, .9), R.plaid ?? R.interiorFloor);
  // Use a procedural blue-grey mat to avoid a plaid look.
  mat.material = new THREE.MeshToonMaterial({ color: '#687b79', gradientMap: R.interiorFloor.gradientMap });
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(-1.7, P.floorY + 0.026, 1.02);
  g.add(mat);
  // Back and side wall panels.
  box(g, floorW, 2.72, 0.08, R.interiorWall, cx, 1.99, P.z0 + 0.36);
  box(g, 0.08, 2.72, floorD, R.interiorWall, P.x0 + 0.3, 1.99, cz);
  box(g, 0.08, 2.72, floorD, R.interiorWall, P.x1 - 0.3, 1.99, cz);
  // Lower wainscot.
  box(g, floorW, 0.58, 0.07, R.woodLight, cx, P.floorY + 0.3, P.z0 + 0.42);
  box(g, 0.07, 0.58, floorD, R.woodLight, P.x0 + 0.36, P.floorY + 0.3, cz);
  box(g, 0.07, 0.58, floorD, R.woodLight, P.x1 - 0.36, P.floorY + 0.3, cz);
  // Ceiling, with a soft pale finish.
  box(g, floorW, 0.08, floorD, R.ceiling, cx, 3.3, cz);
  for (let i = 0; i < 3; i++) {
    box(g, floorW, 0.1, 0.15, R.woodLight, cx, 3.24, P.z0 + 1.3 + i * 1.8);
  }
  // Long ceiling light panels.
  for (const z of [-0.65, -2.55]) {
    box(g, 3.9, 0.055, 0.28, R.trimShade, cx + 0.5, 3.2, z);
    box(g, 3.75, 0.02, 0.22, R.lightPanel, cx + 0.5, 3.165, z);
  }
  // Front window interior sills and reveals.
  box(g, P.bigWinX1 - P.bigWinX0 + 0.2, 0.12, 0.28, R.trim, (P.bigWinX0 + P.bigWinX1) / 2, P.bigWinY0 + 0.02, P.z1 - 0.32);
  box(g, P.leftWinX1 - P.leftWinX0 + 0.2, 0.12, 0.28, R.trim, (P.leftWinX0 + P.leftWinX1) / 2, P.leftWinY0 + 0.02, P.z1 - 0.32);
  // Door threshold in warm wood.
  box(g, 1.55, 0.06, 0.32, R.wood, -1.7, P.floorY + 0.02, P.z1 - 0.15);
  assembly.add(g, { start: 2.9, duration: 0.9, mode: 'grow', land: false });
  return root;
}

function buildCounter(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const w = P.counterX1 - P.counterX0;
  const cx = (P.counterX0 + P.counterX1) / 2;
  const cz = (P.counterZ0 + P.counterZ1) / 2;
  const d = P.counterZ1 - P.counterZ0;
  // Brushed metal top.
  const top = rounded(g, w, 0.075, d, 0.03, R.counterMetal, cx, P.counterTop - 0.04, cz, { cast: true });
  box(g, w + 0.05, 0.035, d + 0.06, R.counterEdge, cx, P.counterTop - 0.085, cz, { cast: true });
  // Under-counter panel / drawers.
  rounded(g, w - 0.08, 0.8, 0.08, 0.025, R.counterFront, cx, P.floorY + 0.48, P.counterZ1 + 0.02, { cast: true });
  for (let i = 0; i < 3; i++) {
    const dx = P.counterX0 + 0.55 + i * 1.45;
    box(g, 1.16, 0.58, 0.04, R.counterFrontDark, dx, P.floorY + 0.5, P.counterZ1 + 0.07, { cast: false });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), R.brassDark);
    knob.position.set(dx + 0.34, P.floorY + 0.5, P.counterZ1 + 0.1);
    g.add(knob);
  }
  // A small counter sign at the front.
  const counterSign = localTextTexture('郵便窓口', 'POSTAL SERVICE', { size: 96, subSize: 30 });
  box(g, 1.5, 0.36, 0.035, R.trim, -0.05, P.floorY + 0.23, P.counterZ1 + 0.08);
  label(g, 1.42, 0.3, counterSign, -0.05, P.floorY + 0.23, P.counterZ1 + 0.1);
  // Warm reflection strip on the metal top, suggesting soft overhead light.
  const sheen = new THREE.Mesh(planeGeo(w * 0.8, 0.06), new THREE.MeshBasicMaterial({
    color: 0xffe8c6,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.set(cx, P.counterTop + 0.002, cz - 0.17);
  sheen.renderOrder = 4;
  g.add(sheen);
  // Small desk lamp at the right end.
  const lamp = new THREE.Group();
  lamp.position.set(2.95, P.counterTop, 0.18);
  cyl(lamp, 0.1, 0.13, 0.05, R.iron, 0, 0.025, 0, 12);
  cyl(lamp, 0.018, 0.018, 0.5, R.metalDark, 0, 0.27, 0, 6);
  const arm = tubeFromPoints([
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0.13, 0.6, 0.05),
    new THREE.Vector3(0.25, 0.56, 0.18),
  ], 0.018, R.metalDark, { segments: 6, radialSegments: 5 });
  lamp.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.15, 10, 1, true), R.lampShade);
  shade.position.set(0.3, 0.49, 0.22);
  shade.rotation.z = 0.2;
  lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), R.warmBulb);
  bulb.position.set(0.3, 0.43, 0.22);
  lamp.add(bulb);
  g.add(lamp);
  // A few useful little objects.
  // Postal scale.
  const scale = new THREE.Group();
  scale.position.set(-0.18, P.counterTop, 0.18);
  box(scale, 0.36, 0.06, 0.3, R.metalDark, 0, 0.04, 0);
  const dish = cyl(scale, 0.15, 0.13, 0.04, R.metalLight, 0, 0.09, 0, 16);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), R.paper);
  dial.rotation.x = -Math.PI / 2;
  dial.position.set(0, 0.062, -0.07);
  scale.add(dial);
  g.add(scale);
  // Stamp rack and ink pad.
  rounded(g, 0.32, 0.07, 0.22, 0.02, R.woodDark, 0.55, P.counterTop + 0.04, 0.18, { cast: false });
  for (let i = 0; i < 4; i++) {
    rounded(g, 0.025, 0.16, 0.025, 0.01, R.wood, 0.44 + i * 0.075, P.counterTop + 0.12, 0.14, { cast: false });
  }
  rounded(g, 0.24, 0.035, 0.17, 0.015, R.inkPad, 0.85, P.counterTop + 0.018, 0.34, { cast: false });
  // Pen cup.
  cyl(g, 0.055, 0.06, 0.16, R.penCup, 0.95, P.counterTop + 0.08, 0.12, 10);
  for (let i = 0; i < 4; i++) {
    const pen = cyl(g, 0.006, 0.006, 0.25, i % 2 ? R.redNotebook : R.blueNotebook, 0.93 + i * 0.016, P.counterTop + 0.16, 0.1 + (i % 2) * 0.03, 5);
    pen.rotation.z = (i - 1.5) * 0.09;
  }
  // Paper stacks and envelopes.
  for (let i = 0; i < 4; i++) {
    box(g, 0.46, 0.014, 0.32, R.paper, 0.55, P.counterTop + 0.014 + i * 0.014, 0.58, { cast: false });
  }
  for (let i = 0; i < 5; i++) {
    box(g, 0.22, 0.006, 0.12, R.envelope, 1.05 + (i % 2) * 0.1, P.counterTop + 0.008 + i * 0.007, 0.7, { cast: false });
  }
  rounded(g, 0.4, 0.25, 0.3, 0.02, R.parcel, 3.55, P.counterTop + 0.13, 0.35, { cast: false });
  // A small mug, for the quiet workday.
  cyl(g, 0.055, 0.06, 0.1, R.paperShade, 2.55, P.counterTop + 0.05, 0.55, 9);
  assembly.add(g, { start: 4.15, duration: 0.9, mode: 'rise', distance: 0.45, land: true, landAt: [cx, P.counterTop, cz] });
  return { root, group: g, lampWorld: new THREE.Vector3(3.25, 2.02, 0.4) };
}

function buildCatOnCounter(scene, R, assembly) {
  const cat = buildCat(scene, R);
  cat.root.position.set(P.catX, P.counterTop + 0.005, P.catZ);
  cat.root.rotation.y = 0.62;
  cat.root.scale.setScalar(1.12);
  assembly.add(cat.root, { start: 4.65, duration: 0.65, mode: 'pop', land: true, landAt: [P.catX, P.counterTop + 0.2, P.catZ] });
  return cat;
}

function buildBackShelves(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const x0 = -0.55;
  const x1 = 3.9;
  const z = -1.72;
  const y0 = P.floorY + 0.02;
  const width = x1 - x0;
  const height = 2.18;
  // Cabinet body with cubbies.
  box(g, width, 0.1, 0.48, R.woodDark, (x0 + x1) / 2, y0 + 0.04, z, { cast: true });
  box(g, width, 0.08, 0.5, R.woodDark, (x0 + x1) / 2, y0 + height, z, { cast: true });
  for (const x of [x0, x1]) {
    box(g, 0.09, height, 0.5, R.wood, x, y0 + height / 2, z, { cast: true });
  }
  box(g, width, height, 0.05, R.woodLight, (x0 + x1) / 2, y0 + height / 2, z - 0.22, { cast: false });
  const cols = 5;
  const rows = 4;
  for (let c = 1; c < cols; c++) {
    box(g, 0.055, height, 0.46, R.woodTrim ?? R.wood, x0 + (width / cols) * c, y0 + height / 2, z, { cast: false });
  }
  for (let r = 1; r < rows; r++) {
    box(g, width, 0.06, 0.46, R.wood, (x0 + x1) / 2, y0 + (height / rows) * r, z, { cast: false });
  }
  // Parcels and letter bundles in the cubbies.
  const RNG = rng(4817);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (RNG() < 0.23) continue;
      const cx = x0 + (c + 0.5) * (width / cols);
      const cy = y0 + (r + 0.5) * (height / rows);
      const type = RNG();
      if (type < 0.45) {
        const pw = 0.26 + RNG() * 0.18;
        const ph = 0.16 + RNG() * 0.12;
        rounded(g, pw, ph, 0.24, 0.015, RNG() > 0.4 ? R.parcel : R.parcelLight, cx, cy, z + 0.1, { cast: false });
        box(g, pw * 0.65, 0.02, 0.025, R.parcelTape, cx, cy + ph / 2 + 0.011, z + 0.1, { cast: false });
      } else if (type < 0.75) {
        box(g, 0.28, 0.08, 0.2, R.envelope, cx, cy, z + 0.12, { cast: false });
        box(g, 0.27, 0.06, 0.19, R.paper, cx, cy + 0.065, z + 0.12, { cast: false });
      } else {
        const jar = cyl(g, 0.06, 0.075, 0.18, R.jars[(c + r) % R.jars.length], cx, cy, z + 0.12, 8);
        cyl(g, 0.055, 0.06, 0.025, R.brassDark, cx, cy + 0.1, z + 0.12, 8);
      }
    }
  }
  // Top sign above the counter.
  const signTex = localTextTexture('郵便・ゆうパック', 'POSTAL SERVICES', {
    size: 84, subSize: 32, bg: '#f7f3e7', color: '#3e544d', borderColor: '#bdc6bb',
  });
  box(g, 3.4, 0.46, 0.06, R.trim, 1.7, 3.02, z + 0.17, { cast: true });
  label(g, 3.3, 0.4, signTex, 1.7, 3.02, z + 0.21);
  assembly.add(g, { start: 3.75, duration: 0.9, mode: 'rise', distance: 0.5, land: true, landAt: [(x0 + x1) / 2, P.floorY, z] });
  return root;
}

function buildPOBoxes(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const x = P.x0 + 0.48;
  const z0 = -1.2;
  const z1 = 1.15;
  const y0 = 1.35;
  const y1 = 2.95;
  const w = 0.16;
  box(g, w, y1 - y0 + 0.18, 0.08, R.woodDark, x, (y0 + y1) / 2, (z0 + z1) / 2);
  // Four rows of private boxes facing into the room.
  const cols = 4;
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const z = z0 + (c + 0.5) * ((z1 - z0) / cols);
      const y = y0 + (r + 0.5) * ((y1 - y0) / rows);
      box(g, 0.035, 0.27, 0.42, R.metalLight, x + 0.035, y, z, { cast: false });
      box(g, 0.018, 0.25, 0.39, R.metal, x + 0.055, y, z, { cast: false });
      const keyhole = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), R.iron);
      keyhole.position.set(x + 0.067, y - 0.02, z + 0.08);
      g.add(keyhole);
      const number = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.035), new THREE.MeshBasicMaterial({ color: '#4e5953' }));
      number.position.set(x + 0.068, y + 0.075, z - 0.1);
      number.rotation.y = Math.PI / 2;
      g.add(number);
    }
  }
  // Header sign.
  const headerTex = localTextTexture('私書箱', 'PRIVATE BOXES', { size: 80, subSize: 28, bg: '#3e514f', color: '#f3f0e4', borderColor: '#6b7c76' });
  box(g, 0.06, 0.35, 2.4, R.woodDark, x - 0.02, 3.07, (z0 + z1) / 2);
  label(g, 0.32, 0.3, headerTex, x + 0.02, 3.07, (z0 + z1) / 2, { rotY: Math.PI / 2 });
  assembly.add(g, { start: 3.95, duration: 0.9, mode: 'rise', distance: 0.45, land: true, landAt: [x, 1.5, (z0 + z1) / 2] });
  return root;
}

function buildBackWall(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Staff door.
  box(g, 0.09, 2.35, 1.3, R.trim, -3.65, 1.83, P.z0 + 0.45, { cast: false });
  box(g, 0.035, 2.15, 1.12, R.doorWood, -3.65, 1.83, P.z0 + 0.5, { cast: false });
  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.75), new THREE.MeshPhysicalMaterial({
    color: '#dbe9e9', transparent: true, opacity: 0.38, roughness: 0.16, metalness: 0.05,
    clearcoat: 0.5, side: THREE.DoubleSide, depthWrite: false,
  }));
  doorGlass.position.set(-3.65, 2.35, P.z0 + 0.52);
  g.add(doorGlass);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), R.brass);
  knob.position.set(-3.25, 1.55, P.z0 + 0.56);
  g.add(knob);
  // Noticeboard and posters.
  box(g, 2.05, 1.0, 0.06, R.woodTrim ?? R.wood, 0.1, 2.2, P.z0 + 0.48, { cast: false });
  box(g, 1.9, 0.86, 0.03, R.paperShade, 0.1, 2.2, P.z0 + 0.52, { cast: false });
  label(g, 0.72, 0.98, assets.posterNewYear, -0.68, 2.22, P.z0 + 0.55);
  label(g, 0.72, 0.98, assets.posterNotice, 0.2, 2.22, P.z0 + 0.55);
  label(g, 0.54, 0.72, assets.posterPrint, 0.83, 2.24, P.z0 + 0.55);
  // A calendar-style print on the right.
  box(g, 0.8, 1.1, 0.05, R.trim, 3.4, 2.35, P.z0 + 0.48);
  label(g, 0.69, 0.95, assets.posterPrint, 3.4, 2.35, P.z0 + 0.52);
  // A wall clock.
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), R.clock);
  clock.position.set(2.65, 3.05, P.z0 + 0.5);
  g.add(clock);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.025, 5, 20), R.trim);
  rim.position.set(2.65, 3.05, P.z0 + 0.52);
  g.add(rim);
  // A warm, small wall sconce by the noticeboard.
  const sconce = new THREE.Group();
  sconce.position.set(-1.25, 2.82, P.z0 + 0.55);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.18, 8, 1, true), R.lampShade);
  sconce.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), R.warmBulb);
  bulb.position.y = -0.03;
  sconce.add(bulb);
  g.add(sconce);
  assembly.add(g, { start: 3.55, duration: 0.85, mode: 'fade' });
  return root;
}

function buildLobby(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Bench near the entrance.
  const bench = new THREE.Group();
  bench.position.set(-3.8, P.floorY, 0.3);
  rounded(bench, 0.55, 0.12, 1.45, 0.03, R.woodLight, 0, 0.48, 0, { cast: true });
  for (const z of [-0.55, 0.55]) {
    box(bench, 0.45, 0.42, 0.08, R.woodDark, 0, 0.23, z);
  }
  g.add(bench);
  // Potted plant.
  const plant = new THREE.Group();
  plant.position.set(-4.18, P.floorY, 1.05);
  cyl(plant, 0.18, 0.22, 0.3, R.plantPot, 0, 0.15, 0, 9);
  for (let i = 0; i < 10; i++) {
    const a = i * 2.2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 4), i % 2 ? R.leaf : R.leafLight);
    leaf.scale.set(1.5, 0.18, 0.55);
    leaf.rotation.y = a;
    leaf.rotation.z = 0.3 + (i % 3) * 0.1;
    leaf.position.set(Math.cos(a) * 0.17, 0.45 + (i % 5) * 0.08, Math.sin(a) * 0.17);
    plant.add(leaf);
  }
  g.add(plant);
  // A low parcel cart by the counter.
  const cart = new THREE.Group();
  cart.position.set(4.05, P.floorY, -0.75);
  box(cart, 0.65, 0.08, 0.5, R.metal, 0, 0.35, 0);
  for (const [x, z] of [[-0.25, -0.18], [0.25, -0.18], [-0.25, 0.18], [0.25, 0.18]]) {
    box(cart, 0.05, 0.35, 0.05, R.metalDark, x, 0.18, z);
  }
  rounded(cart, 0.55, 0.35, 0.4, 0.03, R.parcel, 0, 0.55, 0, { cast: true });
  rounded(cart, 0.4, 0.22, 0.3, 0.02, R.parcelLight, 0.02, 0.82, 0.03, { cast: false });
  g.add(cart);
  // Mail sack.
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), R.mailSack);
  sack.scale.set(0.7, 1.0, 0.7);
  sack.position.set(3.5, P.floorY + 0.24, -1.45);
  sack.castShadow = true;
  g.add(sack);
  cyl(g, 0.08, 0.11, 0.18, R.mailSackDark, 3.5, P.floorY + 0.45, -1.45, 7);
  assembly.add(g, { start: 4.05, duration: 0.85, mode: 'fade' });
  return root;
}

function buildInteriorLights(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  // Main warm ceiling glow.
  const warmA = new THREE.PointLight(0xffd7a2, 0, 8.0, 2.0);
  warmA.position.set(1.0, 2.95, -0.2);
  root.add(warmA);
  assembly.addLight(warmA, { start: 4.65, duration: 1.0, intensity: 11 });
  const warmB = new THREE.PointLight(0xffddb0, 0, 8.0, 2.0);
  warmB.position.set(-1.4, 2.85, -2.4);
  root.add(warmB);
  assembly.addLight(warmB, { start: 4.55, duration: 1.1, intensity: 7.5 });
  const lampLight = new THREE.PointLight(0xffbf7a, 0, 2.8, 2.0);
  lampLight.position.set(3.25, 2.04, 0.4);
  root.add(lampLight);
  assembly.addLight(lampLight, { start: 4.9, duration: 0.7, intensity: 1.0 });
  return { root, warmA, warmB, lampLight };
}

export function buildPostOfficeInterior(scene, assets, R, assembly) {
  const shell = buildShell(scene, assets, R, assembly);
  const counter = buildCounter(scene, R, assembly);
  const cat = buildCatOnCounter(scene, R, assembly);
  const shelves = buildBackShelves(scene, R, assembly);
  const poBoxes = buildPOBoxes(scene, R, assembly);
  const backWall = buildBackWall(scene, assets, R, assembly);
  const lobby = buildLobby(scene, assets, R, assembly);
  const lights = buildInteriorLights(scene, R, assembly);
  return {
    shell, counter, cat, shelves, poBoxes, backWall, lobby, lights,
    update(time) {
      cat.update(time);
    },
  };
}


