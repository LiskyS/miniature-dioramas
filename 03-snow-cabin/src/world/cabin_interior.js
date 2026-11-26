import * as THREE from 'three';
import { CABIN } from '../config.js';
import { FireplaceFire } from '../effects/fire.js';
import {
  addContactShadow,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  tubeFromPoints,
  TAU,
} from '../core/utils.js';

const C = CABIN;
const FLOOR = C.floorY;
const CEIL = 3.26;

function box(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, {
    cast: opts.cast ?? false,
    receive: opts.receive ?? true,
    round: opts.round,
  });
  parent.add(m);
  return m;
}

function rounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, {
    cast: opts.cast ?? true,
    receive: opts.receive ?? true,
  });
  parent.add(m);
  return m;
}

function cyl(parent, rt, rb, h, mat, x, y, z, seg = 8) {
  const m = meshCyl(rt, rb, h, mat, x, y, z, seg, { cast: true, receive: true });
  parent.add(m);
  return m;
}

function makeChair(R, x, z, rotY = 0, withCushion = true) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR, z);
  g.rotation.y = rotY;
  // legs
  for (const [lx, lz] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) {
    box(g, 0.07, 0.47, 0.07, R.chairWood, lx, 0.235, lz, { cast: true });
  }
  rounded(g, 0.56, 0.08, 0.54, 0.035, R.chairWood, 0, 0.49, 0, { cast: true });
  if (withCushion) {
    rounded(g, 0.48, 0.07, 0.45, 0.035, R.cushion, 0, 0.55, 0.01, { cast: true });
  }
  // back posts and slats
  for (const lx of [-0.24, 0.24]) {
    box(g, 0.07, 0.65, 0.07, R.chairWood, lx, 0.8, -0.24, { cast: true });
  }
  for (let i = 0; i < 3; i++) {
    box(g, 0.46, 0.055, 0.055, R.chairWood, 0, 0.62 + i * 0.21, -0.24, { cast: true });
  }
  return g;
}

function addBookRow(g, R, x, y, z, count, maxW, depth, alongZ = false) {
  const colors = [R.book1, R.book2, R.book3, R.book4, R.book5, R.book6];
  let cursor = -maxW / 2;
  for (let i = 0; i < count; i++) {
    const w = 0.08 + (i * 7 % 5) * 0.025;
    const h = 0.36 + (i * 11 % 7) * 0.045;
    const d = depth * (0.72 + (i % 3) * 0.1);
    if (cursor + w > maxW / 2) break;
    const bx = alongZ ? x : x + cursor + w / 2;
    const bz = alongZ ? z + cursor + w / 2 : z;
    const bw = alongZ ? depth * 0.8 : w;
    const bd = alongZ ? w : depth;
    box(g, bw, h, bd, colors[i % colors.length], bx, y + h / 2, bz, { cast: false });
    cursor += w + 0.012;
  }
}

function buildFrameShelves(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Floor with thick warm planks.
  box(g, 8.18, 0.08, 5.18, R.woodFloor, -0.5, FLOOR - 0.02, -1.72, { receive: true });
  // Interior back wall panel and side panels.
  box(g, 8.18, CEIL - FLOOR - 0.06, 0.07, R.woodInterior, -0.5, (FLOOR + CEIL) / 2, C.z0 + 0.315);
  box(g, 0.07, CEIL - FLOOR - 0.06, 5.18, R.woodInterior, C.x0 + 0.315, (FLOOR + CEIL) / 2, -1.72);
  // East wall around the side window opening.
  const swZ0 = -2.3;
  const swZ1 = -0.1;
  const swY0 = 0.95;
  const swY1 = 2.98;
  box(g, 0.07, CEIL - FLOOR - 0.06, swZ0 - C.z0, R.woodInterior, C.x1 - 0.315, (FLOOR + CEIL) / 2, (C.z0 + swZ0) / 2);
  box(g, 0.07, CEIL - FLOOR - 0.06, C.z1 - swZ1, R.woodInterior, C.x1 - 0.315, (FLOOR + CEIL) / 2, (swZ1 + C.z1) / 2);
  box(g, 0.07, swY0 - FLOOR, swZ1 - swZ0, R.woodInterior, C.x1 - 0.315, (FLOOR + swY0) / 2, (swZ0 + swZ1) / 2);
  box(g, 0.07, CEIL - swY1, swZ1 - swZ0, R.woodInterior, C.x1 - 0.315, (swY1 + CEIL) / 2, (swZ0 + swZ1) / 2);
  // Ceiling.
  box(g, 8.18, 0.08, 5.18, R.woodInterior, -0.5, CEIL, -1.72, { receive: true });
  // Heavy ceiling beams.
  for (let i = 0; i < 4; i++) {
    box(g, 8.2, 0.16, 0.18, R.woodTrimDark, -0.5, CEIL - 0.12, -4.0 + i * 1.6, { cast: true });
  }
  // Baseboards and corner trim.
  box(g, 8.15, 0.11, 0.08, R.woodTrimDark, -0.5, FLOOR + 0.08, C.z0 + 0.4, { cast: false });
  box(g, 0.08, 0.11, 5.1, R.woodTrimDark, C.x0 + 0.4, FLOOR + 0.08, -1.72, { cast: false });
  box(g, 0.08, 0.11, 5.1, R.woodTrimDark, C.x1 - 0.4, FLOOR + 0.08, -1.72, { cast: false });
  // Interior window sills and header trim.
  box(g, 5.2, 0.12, 0.34, R.woodTrim, 0.72, FLOOR + 0.25, C.z1 - 0.28, { cast: true });
  box(g, 5.2, 0.14, 0.24, R.woodTrim, 0.72, C.glassTop - 0.04, C.z1 - 0.24, { cast: true });
  // Interior curtains, tied to the sides.
  for (const x of [-1.6, 3.05]) {
    const curtain = new THREE.Mesh(planeGeo(0.52, 2.25), R.curtain);
    curtain.position.set(x, FLOOR + 1.55, C.z1 - 0.3);
    curtain.rotation.y = 0;
    g.add(curtain);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.018, 4, 8), R.gold);
    tie.position.set(x, FLOOR + 1.22, C.z1 - 0.25);
    tie.rotation.y = Math.PI / 2;
    g.add(tie);
  }
  // A simple curtain rod.
  cyl(g, 0.025, 0.025, 5.1, R.iron, 0.72, C.glassTop - 0.13, C.z1 - 0.32, 6).rotation.z = Math.PI / 2;
  // A little entry mat inside.
  const mat = new THREE.Mesh(planeGeo(1.5, 0.8), R.plaid);
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(-2.7, FLOOR + 0.03, 0.32);
  g.add(mat);
  // Curtain and sill plants.
  for (const x of [-1.28, 2.7]) {
    const pot = meshCyl(0.13, 0.16, 0.2, R.plantPot, x, FLOOR + 0.35, C.z1 - 0.22, 8);
    g.add(pot);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), i % 2 ? R.leaf : R.leafLight);
      leaf.scale.set(1.2, 0.5, 0.8);
      leaf.position.set(x + (i % 3 - 1) * 0.11, FLOOR + 0.51 + (i % 2) * 0.06, C.z1 - 0.22);
      g.add(leaf);
    }
  }
  assembly.add(g, { start: 2.65, duration: 1.0, mode: 'grow', land: false });
  return root;
}

function buildFireplace(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const x = C.fireplaceX;
  const z = C.fireplaceZ;
  const stoneTex = R.stoneInterior.map.clone();
  stoneTex.needsUpdate = true;
  stoneTex.wrapS = THREE.RepeatWrapping;
  stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(0.68, 0.54);
  const fireplaceStone = R._toon('#b8b0a4', { map: stoneTex });
  // Hearth and stone surround.
  rounded(g, 2.8, 0.1, 1.0, 0.035, fireplaceStone, x, FLOOR + 0.05, z + 0.55, { cast: true });
  // Side stone piers.
  rounded(g, 0.5, 1.36, 0.52, 0.04, fireplaceStone, x - 0.83, FLOOR + 0.76, z + 0.19, { cast: true });
  rounded(g, 0.5, 1.36, 0.52, 0.04, fireplaceStone, x + 0.83, FLOOR + 0.76, z + 0.19, { cast: true });
  // Lintel and chimney breast.
  rounded(g, 2.16, 0.33, 0.55, 0.04, fireplaceStone, x, FLOOR + 1.43, z + 0.18, { cast: true });
  rounded(g, 2.15, 0.86, 0.44, 0.035, fireplaceStone, x, FLOOR + 2.0, z + 0.08, { cast: true });
  // Geometric stones break up the broad front of the hearth.
  for (const [sx, sy, sw, sh] of [
    [0.98, 2.58, 0.34, 0.18], [1.45, 2.74, 0.22, 0.24], [2.55, 2.56, 0.3, 0.2],
    [2.32, 2.82, 0.24, 0.17], [0.57, 0.94, 0.24, 0.2], [3.03, 1.22, 0.25, 0.22],
  ]) {
    const stone = rounded(g, sw, sh, 0.08, 0.025, R.stoneDark, sx, sy, z + 0.39, { cast: false });
  }
  // Dark firebox back and sides.
  box(g, 1.35, 1.28, 0.12, R.soot, x, FLOOR + 0.74, z + 0.05, { receive: true });
  box(g, 0.08, 1.26, 0.45, R.soot, x - 0.7, FLOOR + 0.74, z + 0.19);
  box(g, 0.08, 1.26, 0.45, R.soot, x + 0.7, FLOOR + 0.74, z + 0.19);
  // Interior floor of firebox and ash bed.
  rounded(g, 1.36, 0.08, 0.58, 0.02, R.firebrick, x, FLOOR + 0.12, z + 0.22, { cast: false });
  // Mantel.
  rounded(g, 2.55, 0.13, 0.58, 0.03, R.woodTrim, x, FLOOR + 1.62, z + 0.17, { cast: true });
  // Painting in front of the stone breast, above the mantel.
  box(g, 1.35, 0.58, 0.04, R.paintingFrame, x, FLOOR + 1.98, z + 0.53, { cast: false });
  const art = new THREE.Mesh(planeGeo(1.19, 0.43), new THREE.MeshBasicMaterial({ map: R.painting.map, toneMapped: false }));
  art.position.set(x, FLOOR + 1.98, z + 0.56);
  g.add(art);
  // Mantel candles and evergreen swag.
  for (const dx of [-0.92, 0.92]) {
    cyl(g, 0.04, 0.05, 0.18, R.candle, x + dx, FLOOR + 1.78, z + 0.39, 8);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 6), R.candleFlame);
    flame.position.set(x + dx, FLOOR + 1.92, z + 0.39);
    g.add(flame);
  }
  for (let i = 0; i < 12; i++) {
    const px = x - 1.05 + i * 0.18;
    const sprig = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 5), i % 3 ? R.pine : R.pineDark);
    sprig.position.set(px, FLOOR + 1.72 + Math.sin(i * 1.7) * 0.03, z + 0.37);
    sprig.rotation.z = Math.PI / 2 + (i % 2 ? 0.3 : -0.3);
    g.add(sprig);
    if (i % 4 === 0) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), R.berry);
      berry.position.set(px, FLOOR + 1.68, z + 0.41);
      g.add(berry);
    }
  }
  // Floor logs sit in front of the flame so the fire reads as a burning pile.
  for (let i = 0; i < 3; i++) {
    const log = cyl(g, 0.08, 0.1, 1.06, i === 1 ? R.charcoal : R.woodTrimDark,
      x + (i - 1) * 0.06, FLOOR + 0.16 + i * 0.07, z + 0.58 + i * 0.03, 7);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i - 1) * 0.12;
  }
  // Iron andirons at the outer edge of the firebox.
  for (const dx of [-0.72, 0.72]) {
    box(g, 0.06, 0.26, 0.08, R.iron, x + dx, FLOOR + 0.25, z + 0.46);
    box(g, 0.42, 0.05, 0.07, R.iron, x + dx, FLOOR + 0.37, z + 0.46);
  }
  const ash = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 6, 0, TAU, 0, Math.PI / 2), R.ash);
  ash.scale.set(1.2, 0.12, 0.5);
  ash.position.set(x, FLOOR + 0.13, z + 0.5);
  g.add(ash);
  for (let i = 0; i < 11; i++) {
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.025 + Math.random() * 0.03, 5, 4), R.ember);
    ember.position.set(x - 0.45 + Math.random() * 0.9, FLOOR + 0.2, z + 0.48 + Math.random() * 0.18);
    g.add(ember);
  }
  // Hearth glow decal on the floor (animated with the fire).
  const hearthGlow = new THREE.Mesh(planeGeo(2.8, 1.5), new THREE.MeshBasicMaterial({
    color: 0xff8b3f,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  hearthGlow.rotation.x = -Math.PI / 2;
  hearthGlow.position.set(x, FLOOR + 0.08, z + 1.0);
  g.add(hearthGlow);
  // A little firewood basket to the right.
  const basket = new THREE.Group();
  basket.position.set(x + 1.65, FLOOR, z + 0.8);
  const basketBody = cyl(basket, 0.3, 0.24, 0.26, R.cabinetDark, 0, 0.16, 0, 8);
  basketBody.scale.z = 0.75;
  for (let i = 0; i < 5; i++) {
    const log = cyl(basket, 0.055, 0.06, 0.6, R.bark, -0.12 + i * 0.06, 0.31 + (i % 2) * 0.08, 0.02, 6);
    log.rotation.z = 0.35 + i * 0.1;
    log.rotation.y = 0.4;
  }
  g.add(basket);
  addContactShadow(g, 2.6, 1.2, x, z + 0.8, FLOOR + 0.02, 0.26);
  assembly.add(g, { start: 3.15, duration: 0.95, mode: 'grow', land: true, landAt: [x, FLOOR, z] });

  const fire = new FireplaceFire(scene, x, FLOOR + 0.2, z + 0.36, 0.9);
  fire.setVisible(false);
  return { root, group: g, fire, hearthGlow, fireWorld: new THREE.Vector3(x, FLOOR + 0.5, z + 0.5) };
}

function buildKitchen(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const x = -3.95;
  const zc = -2.12;
  // Lower cabinet run.
  rounded(g, 0.92, 0.78, 3.05, 0.035, R.cabinet, x, FLOOR + 0.4, zc, { cast: true });
  rounded(g, 1.04, 0.14, 3.15, 0.03, R.counter, x + 0.03, FLOOR + 0.86, zc, { cast: true });
  // Cabinet doors.
  for (const z of [-3.32, -2.58, -1.84, -1.1]) {
    box(g, 0.055, 0.66, 0.58, R.cabinetDark, x + 0.46, FLOOR + 0.43, z, { cast: false });
    box(g, 0.04, 0.055, 0.055, R.brass, x + 0.5, FLOOR + 0.43, z + 0.18);
  }
  // Sink and faucet.
  box(g, 0.05, 0.03, 0.55, R.metalDark, x + 0.08, FLOOR + 0.94, -1.05, { cast: false });
  box(g, 0.3, 0.04, 0.42, R.metal, x + 0.02, FLOOR + 0.9, -1.05, { cast: false });
  const faucet = tubeFromPoints([
    new THREE.Vector3(x + 0.2, FLOOR + 0.94, -1.05),
    new THREE.Vector3(x + 0.2, FLOOR + 1.22, -1.05),
    new THREE.Vector3(x + 0.02, FLOOR + 1.32, -1.05),
    new THREE.Vector3(x - 0.08, FLOOR + 1.21, -1.05),
  ], 0.02, R.copper, { segments: 8, radialSegments: 5 });
  g.add(faucet);
  // Cast-iron range top and oven.
  box(g, 0.82, 0.06, 0.82, R.metalDark, x + 0.02, FLOOR + 0.96, -2.95, { cast: false });
  for (const dz of [-0.2, 0.2]) {
    cyl(g, 0.12, 0.12, 0.025, R.iron, x + 0.02, FLOOR + 1.0, -2.95 + dz, 12);
  }
  box(g, 0.6, 0.48, 0.04, R.iron, x + 0.47, FLOOR + 0.52, -2.95, { cast: false });
  box(g, 0.45, 0.035, 0.03, R.metalLight, x + 0.5, FLOOR + 0.72, -2.95);
  // Kettle on the range.
  const kettle = cyl(g, 0.13, 0.16, 0.18, R.kettle, x + 0.02, FLOOR + 1.08, -2.98, 12);
  const spout = tubeFromPoints([
    new THREE.Vector3(x + 0.12, FLOOR + 1.1, -2.98),
    new THREE.Vector3(x + 0.25, FLOOR + 1.2, -2.98),
  ], 0.025, R.kettle, { segments: 4, radialSegments: 5 });
  g.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 4, 10, Math.PI), R.iron);
  handle.position.set(x + 0.02, FLOOR + 1.2, -2.98);
  g.add(handle);
  // Range hood and chimney.
  rounded(g, 0.88, 0.18, 0.88, 0.03, R.metalDark, x - 0.02, FLOOR + 2.35, -2.95, { cast: true });
  box(g, 0.5, 0.55, 0.35, R.metal, x - 0.12, FLOOR + 2.7, -2.95);
  for (let i = 0; i < 6; i++) {
    box(g, 0.55, 0.025, 0.03, R.metalLight, x + 0.3, FLOOR + 1.72 + i * 0.11, -2.95);
  }
  // Open shelves with pottery and jars on the back wall above the counter.
  for (let s = 0; s < 2; s++) {
    const y = FLOOR + 2.0 + s * 0.43;
    box(g, 0.54, 0.06, 2.25, R.woodTrim, x - 0.24, y, -2.45, { cast: true });
    for (let i = 0; i < 7; i++) {
      const z = -3.38 + i * 0.3;
      if (s === 0) {
        const jar = cyl(g, 0.09, 0.1, 0.18 + (i % 3) * 0.05, i % 2 ? R.ceramic : R.greenGlass, x - 0.24, y + 0.14, z, 8);
      } else {
        const plate = cyl(g, 0.13, 0.13, 0.018, R.ceramic, x - 0.24, y + 0.025, z, 12);
        plate.rotation.z = Math.PI / 2;
        plate.position.x -= 0.08;
      }
    }
  }
  // Hanging copper pots from the ceiling beam over the counter.
  const rail = cyl(g, 0.018, 0.018, 1.8, R.iron, x + 0.35, FLOOR + 2.38, -2.0, 5);
  rail.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const z = -2.75 + i * 0.62;
    cyl(g, 0.006, 0.006, 0.35, R.iron, x + 0.35, FLOOR + 2.18, z, 4);
    const pot = cyl(g, 0.13 - i * 0.015, 0.16 - i * 0.015, 0.16, R.copper, x + 0.35, FLOOR + 1.96, z, 10);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.035, 12), R.iron);
    pan.position.set(x + 0.35, FLOOR + 1.9, z);
    g.add(pan);
  }
  // A chopping board, bread and a small bowl.
  box(g, 0.5, 0.04, 0.35, R.chairSeat, x + 0.1, FLOOR + 0.95, -1.65, { cast: false });
  const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), R.book3);
  loaf.scale.set(1.6, 0.7, 1);
  loaf.position.set(x + 0.12, FLOOR + 1.03, -1.64);
  g.add(loaf);
  // Sconce over the kitchen, warm and practical.
  const sconce = new THREE.Group();
  sconce.position.set(x - 0.3, FLOOR + 2.12, -0.75);
  const bracket = box(sconce, 0.28, 0.05, 0.05, R.iron, 0, 0, 0);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.15, 8, 1, true), R.lampShade);
  shade.position.set(0.18, -0.16, 0);
  sconce.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), R.wallLight);
  bulb.position.set(0.18, -0.18, 0);
  sconce.add(bulb);
  g.add(sconce);
  addContactShadow(g, 1.5, 3.4, x, zc, FLOOR + 0.02, 0.23);
  assembly.add(g, { start: 3.55, duration: 1.0, mode: 'rise', distance: 0.65, land: true, landAt: [x, FLOOR, zc] });
  return { root, group: g };
}

function buildDining(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const rug = new THREE.Mesh(planeGeo(4.3, 3.15), R.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-1.2, FLOOR + 0.025, -1.16);
  const g = new THREE.Group();
  root.add(g);
  g.add(rug);
  // Table.
  const tx = -1.2;
  const tz = -1.15;
  rounded(g, 2.25, 0.12, 1.02, 0.035, R.chairWood, tx, FLOOR + 0.78, tz, { cast: true });
  for (const [dx, dz] of [[-0.92, -0.36], [0.92, -0.36], [-0.92, 0.36], [0.92, 0.36]]) {
    box(g, 0.11, 0.72, 0.11, R.chairWood, tx + dx, FLOOR + 0.38, tz + dz, { cast: true });
  }
  // Chairs.
  const ch1 = makeChair(R, tx - 1.55, tz, Math.PI / 2);
  const ch2 = makeChair(R, tx + 1.55, tz, -Math.PI / 2);
  g.add(ch1, ch2);
  // Table settings: plates, mugs, candle and a little evergreen centerpiece.
  for (const dx of [-0.68, 0.68]) {
    const plate = cyl(g, 0.25, 0.22, 0.035, R.ceramic, tx + dx, FLOOR + 0.86, tz, 16);
    const inner = cyl(g, 0.18, 0.18, 0.012, R.kitchenWhite, tx + dx, FLOOR + 0.882, tz, 16);
    for (const [mx, mz] of [[-0.12, 0.15], [0.12, 0.15]]) {
      cyl(g, 0.055, 0.06, 0.11, R.mug, tx + dx + mx, FLOOR + 0.9, tz + mz, 9);
    }
  }
  // Centerpiece bowl and greenery.
  cyl(g, 0.25, 0.2, 0.12, R.bowl, tx, FLOOR + 0.9, tz, 14);
  for (let i = 0; i < 6; i++) {
    const sprig = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 5), i % 2 ? R.pine : R.pineDark);
    sprig.position.set(tx + (i - 2.5) * 0.07, FLOOR + 1.06, tz + Math.sin(i * 1.8) * 0.08);
    sprig.rotation.z = (i - 2.5) * 0.22;
    g.add(sprig);
  }
  for (let i = 0; i < 4; i++) {
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), R.berry);
    berry.position.set(tx + (i - 1.5) * 0.11, FLOOR + 1.03, tz + 0.12);
    g.add(berry);
  }
  // Candle in a glass holder.
  cyl(g, 0.075, 0.07, 0.2, R.glassSheen, tx, FLOOR + 0.92, tz + 0.24, 10);
  cyl(g, 0.045, 0.045, 0.14, R.candle, tx, FLOOR + 0.91, tz + 0.24, 8);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 6), R.candleFlame);
  flame.position.set(tx, FLOOR + 1.02, tz + 0.24);
  g.add(flame);
  addContactShadow(g, 2.8, 2.2, tx, tz, FLOOR + 0.03, 0.2);
  // Pendant lamp above the table.
  const pendant = new THREE.Group();
  pendant.position.set(tx, 0, tz);
  cyl(pendant, 0.015, 0.015, 0.62, R.iron, 0, CEIL - 0.31, 0, 5);
  cyl(pendant, 0.18, 0.24, 0.24, R.lampMetal, 0, CEIL - 0.68, 0, 10);
  cyl(pendant, 0.2, 0.2, 0.025, R.lampShade, 0, CEIL - 0.8, 0, 10);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), R.warmBulb);
  bulb.position.set(0, CEIL - 0.76, 0);
  pendant.add(bulb);
  g.add(pendant);
  assembly.add(g, { start: 3.8, duration: 0.9, mode: 'rise', distance: 0.5, land: true, landAt: [tx, FLOOR, tz] });
  return { root, group: g, pendant, tablePos: new THREE.Vector3(tx, FLOOR + 1.4, tz) };
}

function buildLiving(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Classic high-back armchair, turned toward the hearth.
  const chair = new THREE.Group();
  chair.position.set(0.1, FLOOR, -2.0);
  chair.rotation.y = 2.48;
  rounded(chair, 0.92, 0.18, 0.78, 0.08, R.chairWood, 0, 0.3, 0, { cast: true });
  for (const [x, z] of [[-0.34, -0.28], [0.34, -0.28], [-0.34, 0.28], [0.34, 0.28]]) {
    box(chair, 0.09, 0.34, 0.09, R.chairWood, x, 0.17, z, { cast: true });
  }
  rounded(chair, 0.8, 0.14, 0.62, 0.04, R.cushion, 0, 0.43, 0.02, { cast: true });
  rounded(chair, 0.9, 0.85, 0.15, 0.08, R.chairWood, 0, 0.72, -0.33, { cast: true });
  rounded(chair, 0.68, 0.45, 0.12, 0.03, R.plaid, 0, 0.78, -0.23, { cast: true });
  for (const x of [-0.42, 0.42]) {
    rounded(chair, 0.16, 0.36, 0.68, 0.035, R.chairWood, x, 0.4, 0.03, { cast: true });
  }
  const throwBlanket = new THREE.Mesh(planeGeo(0.7, 0.65), R.plaid);
  throwBlanket.rotation.x = -0.3;
  throwBlanket.rotation.z = 0.1;
  throwBlanket.position.set(0.2, 0.65, 0.25);
  chair.add(throwBlanket);
  g.add(chair);
  addContactShadow(g, 3.0, 2.3, 0.4, -2.0, FLOOR + 0.02, 0.24);
  assembly.add(g, { start: 4.0, duration: 0.9, mode: 'rise', distance: 0.4, land: true, landAt: [0.1, FLOOR, -2.0] });
  return root;
}

function buildBookshelf(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const x = -2.35;
  const z = -4.12;
  const y0 = FLOOR + 0.03;
  // Back-wall bookcase: visible through the broad front window.
  box(g, 1.75, 2.1, 0.05, R.cabinetDark, x, y0 + 1.05, z - 0.16, { cast: false });
  for (const dx of [-0.86, 0.86]) {
    box(g, 0.09, 2.1, 0.38, R.bookshelf, x + dx, y0 + 1.05, z, { cast: true });
  }
  for (const y of [0.05, 0.58, 1.11, 1.64, 2.08]) {
    box(g, 1.75, 0.06, 0.38, R.woodTrim, x, y0 + y, z, { cast: true });
  }
  for (let s = 0; s < 3; s++) {
    const shelfY = y0 + 0.58 + s * 0.53;
    addBookRow(g, R, x, shelfY + 0.045, z + 0.03, 9 + s * 2, 1.55, 0.24, false);
  }
  // Top trim and ornaments.
  box(g, 1.86, 0.07, 0.42, R.woodTrimDark, x, y0 + 2.14, z, { cast: true });
  cyl(g, 0.11, 0.14, 0.2, R.plantPot, x - 0.48, y0 + 2.27, z + 0.02, 8);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), i % 2 ? R.leaf : R.leafLight);
    leaf.scale.set(1.2, 0.55, 0.8);
    leaf.position.set(x - 0.48 + Math.sin(i * 1.8) * 0.07, y0 + 2.42 + (i % 3) * 0.06, z + 0.03 + Math.cos(i * 1.8) * 0.08);
    g.add(leaf);
  }
  // A small ceramic jug and candle on the other side.
  cyl(g, 0.09, 0.12, 0.22, R.ceramic, x + 0.5, y0 + 2.28, z + 0.02, 8);
  cyl(g, 0.035, 0.04, 0.2, R.candle, x + 0.72, y0 + 2.27, z + 0.04, 8);
  assembly.add(g, { start: 4.05, duration: 0.85, mode: 'rise', distance: 0.45, land: true, landAt: [x, FLOOR, z] });
  return root;
}

function buildDecor(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Wall clock above the back kitchen side.
  const cx = 3.15;
  const cy = 2.66;
  box(g, 0.05, 0.55, 0.55, R.clockWood, cx, cy, C.z0 + 0.39, { cast: false });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.21, 20), R.clockFace);
  face.position.set(cx, cy, C.z0 + 0.43);
  g.add(face);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const tick = box(g, 0.012, 0.035, 0.01, R.iron, cx + Math.cos(a) * 0.16, cy + Math.sin(a) * 0.16, C.z0 + 0.45, { cast: false });
  }
  const hand1 = box(g, 0.014, 0.14, 0.012, R.iron, cx, cy + 0.05, C.z0 + 0.46, { cast: false });
  hand1.rotation.z = 0.4;
  const hand2 = box(g, 0.011, 0.09, 0.012, R.iron, cx - 0.04, cy, C.z0 + 0.46, { cast: false });
  hand2.rotation.z = 1.2;
  // Botanical print above the side table.
  const print = new THREE.Mesh(planeGeo(0.5, 0.66), R.botanical);
  print.position.set(3.49, 2.42, -2.55);
  print.rotation.y = -Math.PI / 2;
  g.add(print);
  // A tall corner plant near the front, visible through the window.
  const plant = new THREE.Group();
  plant.position.set(-4.12, FLOOR, 0.55);
  cyl(plant, 0.25, 0.3, 0.38, R.plantPot, 0, 0.19, 0, 9);
  cyl(plant, 0.035, 0.05, 1.2, R.bark, 0, 0.92, 0, 5);
  for (let i = 0; i < 11; i++) {
    const a = i * 2.1;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25, 7, 4), i % 3 ? R.leaf : R.leafLight);
    leaf.scale.set(1.6, 0.25, 0.7);
    leaf.rotation.y = a;
    leaf.rotation.z = 0.35 + (i % 3) * 0.1;
    leaf.position.set(Math.cos(a) * 0.28, 0.8 + (i % 5) * 0.16, Math.sin(a) * 0.28);
    plant.add(leaf);
  }
  g.add(plant);
  // Lantern on a side table / floor near the hearth.
  const lantern = new THREE.Group();
  lantern.position.set(0.9, FLOOR + 0.02, -3.35);
  cyl(lantern, 0.11, 0.14, 0.26, R.iron, 0, 0.18, 0, 6);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.2, 6, 1, true), R.lanternGlass);
  glow.position.y = 0.19;
  lantern.add(glow);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 4, 9, Math.PI), R.iron);
  handle.position.y = 0.35;
  lantern.add(handle);
  g.add(lantern);
  // Hand-thrown pottery on a small wall shelf.
  box(g, 0.3, 0.06, 0.8, R.woodTrim, -4.48, 2.03, -3.45, { cast: true });
  for (let i = 0; i < 3; i++) {
    cyl(g, 0.09, 0.12 - i * 0.015, 0.22 + i * 0.04, i % 2 ? R.ceramic : R.greenGlass, -4.5, 2.17, -3.7 + i * 0.25, 8);
  }
  // A stack of books by the hearth.
  for (let i = 0; i < 4; i++) {
    box(g, 0.42 - i * 0.03, 0.06, 0.32, [R.book2, R.book1, R.book4, R.book5][i], 0.92, FLOOR + 0.08 + i * 0.06, -2.95, { cast: false });
  }
  assembly.add(g, { start: 4.2, duration: 0.85, mode: 'fade' });
  return root;
}

function buildInteriorLights(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const pendant = new THREE.PointLight(0xffc07c, 0, 12.0, 2.0);
  pendant.position.set(-1.2, 2.45, -1.15);
  root.add(pendant);
  assembly.addLight(pendant, { start: 4.15, duration: 1.0, intensity: 9.5 });
  const fill = new THREE.PointLight(0xffd6a3, 0, 12.0, 2.0);
  fill.position.set(0.2, 2.25, -0.65);
  root.add(fill);
  assembly.addLight(fill, { start: 4.0, duration: 1.2, intensity: 4.2 });
  return { root, pendant, fill };
}

export function buildCabinInterior(scene, R, assembly) {
  const shell = buildFrameShelves(scene, R, assembly);
  const fireplace = buildFireplace(scene, R, assembly);
  const kitchen = buildKitchen(scene, R, assembly);
  const dining = buildDining(scene, R, assembly);
  const living = buildLiving(scene, R, assembly);
  const bookshelf = buildBookshelf(scene, R, assembly);
  const decor = buildDecor(scene, R, assembly);
  const lights = buildInteriorLights(scene, R, assembly);
  let fireStarted = false;
  return {
    shell,
    fireplace,
    kitchen,
    dining,
    living,
    bookshelf,
    decor,
    lights,
    fire: fireplace.fire,
    update(time, dt) {
      if (!fireStarted && time >= 5.6) {
        fireStarted = true;
        fireplace.fire.setVisible(true);
      }
      fireplace.fire.update(time, dt);
      if (fireStarted) {
        const flicker = 0.8 + 0.2 * Math.sin(time * 7.3) * Math.sin(time * 2.1 + 0.7);
        fireplace.hearthGlow.material.opacity = 0.055 + 0.025 * flicker;
      }
      const lightFlicker = 0.96 + 0.04 * Math.sin(time * 3.2 + 0.6);
      const pendantIn = Math.min(1, Math.max(0, (time - 4.15) / 1.0));
      const fillIn = Math.min(1, Math.max(0, (time - 4.0) / 1.2));
      lights.pendant.intensity = 9.5 * pendantIn * (0.98 + 0.02 * Math.sin(time * 2.0));
      lights.fill.intensity = 4.2 * fillIn * lightFlicker;
    },
  };
}
