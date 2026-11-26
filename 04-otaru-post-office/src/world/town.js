import * as THREE from 'three';
import { BACK_HOUSES, HOUSES, SNOW_Y } from '../config.js';
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

function snow(parent, R, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), R.snowDrift);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function windowOnFront(parent, R, x, y, z, w, h, cols, rows, warm = false) {
  box(parent, w + 0.14, h + 0.14, 0.07, R.trim, x, y, z + 0.04);
  const glass = new THREE.Mesh(planeGeo(w, h), warm ? R.houseWindowWarm : R.houseWindowDark);
  glass.position.set(x, y, z + 0.085);
  parent.add(glass);
  for (let i = 1; i < cols; i++) {
    box(parent, 0.035, h, 0.04, R.trim, x - w / 2 + (w / cols) * i, y, z + 0.1, { cast: false });
  }
  for (let j = 1; j < rows; j++) {
    box(parent, w, 0.035, 0.04, R.trim, x, y - h / 2 + (h / rows) * j, z + 0.1, { cast: false });
  }
  box(parent, w + 0.2, 0.07, 0.18, R.trim, x, y - h / 2 - 0.06, z + 0.08, { cast: false });
  snow(parent, R, x, y - h / 2 - 0.02, z + 0.1, w * 0.52, 0.04, 0.08);
}

function windowOnSide(parent, R, x, y, z, w, h, cols, rows, face = 1, warm = false) {
  box(parent, 0.07, h + 0.14, w + 0.14, R.trim, x, y, z);
  const glass = new THREE.Mesh(planeGeo(w, h), warm ? R.houseWindowWarm : R.houseWindowDark);
  glass.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2;
  glass.position.set(x + face * 0.045, y, z);
  parent.add(glass);
  for (let i = 1; i < cols; i++) {
    box(parent, 0.04, h, 0.035, R.trim, x + face * 0.06, y, z - w / 2 + (w / cols) * i, { cast: false });
  }
  for (let j = 1; j < rows; j++) {
    box(parent, 0.04, 0.035, w, R.trim, x + face * 0.06, y - h / 2 + (h / rows) * j, z, { cast: false });
  }
  box(parent, 0.18, 0.07, w + 0.2, R.trim, x + face * 0.04, y - h / 2 - 0.06, z, { cast: false });
  snow(parent, R, x + face * 0.08, y - h / 2 - 0.02, z, 0.08, 0.04, w * 0.52);
}

function buildDetailedHouse(scene, R, assembly, spec, frontGable, detail = true) {
  const root = new THREE.Group();
  root.position.set(spec.x, SNOW_Y, spec.z);
  root.rotation.y = spec.rot || 0;
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const w = spec.w;
  const d = spec.d;
  const h = spec.h;
  const wallMat = spec.wallMat;
  // Foundation and porch step.
  box(g, w + 0.18, 0.34, d + 0.18, R.stoneDark, 0, 0.17, 0, { cast: false });
  box(g, w, h, d, wallMat, 0, 0.34 + h / 2, 0, { cast: true });
  // White base trim and corner boards.
  box(g, w + 0.08, 0.12, d + 0.08, R.trimShade, 0, 0.38, 0, { cast: false });
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) {
    box(g, 0.11, h, 0.12, R.trim, x, 0.34 + h / 2, d / 2 + 0.02, { cast: false });
  }
  // A small entrance on the front.
  const doorX = -w * 0.22;
  box(g, 0.9, 1.8, 0.08, R.woodDark, doorX, 1.15, d / 2 + 0.05);
  const doorGlass = new THREE.Mesh(planeGeo(0.5, 0.5), R.houseWindowWarm);
  doorGlass.position.set(doorX, 1.5, d / 2 + 0.1);
  g.add(doorGlass);
  box(g, 1.6, 0.1, 0.7, R.trim, doorX, 0.48, d / 2 + 0.32);
  snow(g, R, doorX, 0.53, d / 2 + 0.4, 0.8, 0.04, 0.22);
  // Front windows.
  windowOnFront(g, R, w * 0.23, 1.55, d / 2 + 0.02, 1.15, 0.9, 3, 2, detail && spec.warm);
  windowOnFront(g, R, -w * 0.2, 2.72, d / 2 + 0.02, 1.25, 0.8, 3, 2, detail && !spec.warm);
  // Side windows visible from the camera.
  windowOnSide(g, R, w / 2 + 0.02, 1.7, -0.3, 1.0, 0.8, 2, 2, 1, false);
  windowOnSide(g, R, -w / 2 - 0.02, 2.5, 0.2, 0.8, 0.65, 2, 2, -1, detail && spec.warm);
  // Japanese balcony on the second floor.
  if (detail) {
    const by = 2.24;
    box(g, 2.45, 0.1, 0.6, R.wood, w * 0.12, by, d / 2 + 0.32);
    box(g, 2.35, 0.08, 0.05, R.trimShade, w * 0.12, by + 0.5, d / 2 + 0.59, { cast: false });
    for (let i = 0; i < 7; i++) {
      box(g, 0.04, 0.52, 0.04, R.trimShade, w * 0.12 - 1.1 + i * 0.36, by + 0.26, d / 2 + 0.59, { cast: false });
    }
    snow(g, R, w * 0.12, by + 0.1, d / 2 + 0.35, 1.25, 0.06, 0.28);
    // A small laundry pole, empty in the snow.
    box(g, 2.0, 0.035, 0.035, R.metal, w * 0.12, by + 1.2, d / 2 + 0.55, { cast: false });
  }
  // Downspout and AC unit.
  box(g, 0.08, 2.6, 0.08, R.metal, w / 2 + 0.06, 1.6, d / 2 - 0.22);
  rounded(g, 0.55, 0.48, 0.78, 0.035, R.trimShade, w / 2 + 0.38, 0.66, -0.8, { cast: true });
  snow(g, R, w / 2 + 0.38, 0.92, -0.8, 0.32, 0.06, 0.42);
  // Roof.
  const roofBase = 0.34 + h;
  const roofH = spec.roofH ?? 1.45;
  if (frontGable) {
    const overhang = 0.45;
    const half = w / 2 + overhang;
    const angle = Math.atan2(roofH, half);
    const slope = Math.hypot(half, roofH);
    for (const side of [-1, 1]) {
      const m = box(g, slope, 0.13, d + 0.8, R.houseRoof, side * half / 2, roofBase + roofH / 2, 0, { cast: true });
      m.rotation.z = -side * angle;
      const s = box(g, slope + 0.05, 0.16, d + 0.86, R.snow, side * half / 2, roofBase + roofH / 2 + 0.14, 0, { cast: true });
      s.rotation.z = -side * angle;
    }
    // Front gable triangle.
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(0, roofH);
    shape.closePath();
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), wallMat);
    gable.position.set(0, roofBase, d / 2);
    g.add(gable);
    for (const side of [-1, 1]) {
      const trim = box(g, 0.13, 0.15, slope, R.trim, side * half / 2, roofBase + roofH / 2, d / 2 + 0.42);
      trim.rotation.z = -side * angle;
    }
    // A small gable vent.
    box(g, 0.38, 0.28, 0.04, R.trimShade, 0, roofBase + 0.8, d / 2 + 0.02);
  } else {
    const overhang = 0.45;
    const half = d / 2 + overhang;
    const angle = Math.atan2(roofH, half);
    const slope = Math.hypot(half, roofH);
    for (const side of [-1, 1]) {
      const m = box(g, w + 0.85, 0.13, slope, R.houseRoof, 0, roofBase + roofH / 2, side * half / 2, { cast: true });
      m.rotation.x = side * angle;
      const s = box(g, w + 0.9, 0.16, slope + 0.05, R.snow, 0, roofBase + roofH / 2 + 0.14, side * half / 2, { cast: true });
      s.rotation.x = side * angle;
    }
    // Gable ends.
    for (const side of [-1, 1]) {
      const shape = new THREE.Shape();
      shape.moveTo(-d / 2, 0);
      shape.lineTo(d / 2, 0);
      shape.lineTo(0, roofH);
      shape.closePath();
      const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), wallMat);
      gable.rotation.y = side * Math.PI / 2;
      gable.position.set(side * (w / 2), roofBase, 0);
      g.add(gable);
    }
  }
  // Snow clumps along the eaves.
  const RNG = rng(spec.x * 41 + spec.z * 73);
  for (let i = 0; i < 8; i++) {
    snow(g, R, -w / 2 + 0.4 + i * (w - 0.8) / 7, roofBase + (frontGable ? roofH + 0.12 : 0.02), d / 2 + 0.45 + RNG() * 0.12, 0.3 + RNG() * 0.2, 0.06, 0.18);
  }
  // Garden wall and hedge at the street, with a gap for the entrance.
  const wallZ = d / 2 + 0.75;
  if (detail) {
    const xL = -w / 2 - 0.2;
    const xR = w / 2 + 0.2;
    const gateL = doorX - 0.8;
    const gateR = doorX + 0.8;
    const segments = [[xL, gateL], [gateR, xR]];
    for (const [a, b] of segments) {
      if (b - a < 0.25) continue;
      const cw = b - a;
      const ccx = (a + b) / 2;
      box(g, cw, 0.65, 0.18, R.blockWall, ccx, 0.337, wallZ, { cast: true });
      for (let i = 0; i < 4; i++) {
        box(g, cw, 0.012, 0.19, R.blockJoint, ccx, 0.45 + i * 0.15, wallZ + 0.01, { cast: false });
      }
      snow(g, R, ccx, 0.66, wallZ, cw * 0.5 - 0.06, 0.055, 0.1);
      rounded(g, cw * 0.86, 0.42, 0.42, 0.16, R.hedge, ccx, 0.58, wallZ + 0.34, { cast: false });
      snow(g, R, ccx, 0.8, wallZ + 0.34, cw * 0.43 - 0.05, 0.045, 0.2);
    }
    for (const gx of [gateL, gateR]) {
      box(g, 0.15, 0.92, 0.2, R.blockWall, gx, 0.47, wallZ, { cast: true });
      snow(g, R, gx, 0.94, wallZ, 0.11, 0.045, 0.1);
    }
  }
  // Snow at the foundation.
  for (let i = 0; i < 8; i++) {
    snow(g, R, -w / 2 + i * w / 7, 0.36, d / 2 + 0.15, 0.3 + RNG() * 0.2, 0.07, 0.2);
  }
  addContactShadow(g, w + 0.9, d + 0.9, 0, 0, 0.01, 0.24);
  assembly.add(g, { start: 1.7 + (spec.delay ?? 0), duration: 0.95, mode: 'rise', distance: 0.65, land: true, landAt: [spec.x, SNOW_Y, spec.z] });
  return root;
}

function buildTree(scene, R, assembly, x, z, height, kind = 'bare') {
  const g = new THREE.Group();
  g.position.set(x, SNOW_Y, z);
  scene.add(g);
  if (kind === 'pine') {
    const trunk = meshCyl(0.11, 0.18, height * 0.68, R.branch, 0, height * 0.34, 0, 7, { cast: true, receive: true });
    g.add(trunk);
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      const y = height * 0.34 + t * height * 0.46;
      const r = height * (0.25 - t * 0.17);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, height * 0.24, 9), R.hedge);
      cone.position.y = y;
      cone.castShadow = true;
      g.add(cone);
      const snowCone = new THREE.Mesh(new THREE.ConeGeometry(r * 1.02, height * 0.09, 9), R.snowPlain);
      snowCone.position.y = y + height * 0.065;
      g.add(snowCone);
    }
    snow(g, R, 0, 0.12, 0, 0.8, 0.12, 0.6);
  } else {
    const trunk = meshCyl(0.08, 0.14, height * 0.62, R.branch, 0, height * 0.31, 0, 6, { cast: true, receive: true });
    g.add(trunk);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.3;
      const len = height * (0.22 + (i % 3) * 0.05);
      const branch = tubeFromPoints([
        new THREE.Vector3(0, height * (0.4 + (i % 4) * 0.08), 0),
        new THREE.Vector3(Math.cos(a) * len * 0.5, height * (0.52 + (i % 3) * 0.06), Math.sin(a) * len * 0.5),
        new THREE.Vector3(Math.cos(a) * len, height * (0.65 + (i % 4) * 0.06), Math.sin(a) * len),
      ], 0.027, R.branch, { segments: 6, radialSegments: 4 });
      g.add(branch);
      const twig = tubeFromPoints([
        new THREE.Vector3(0, height * (0.4 + (i % 4) * 0.08), 0),
        new THREE.Vector3(Math.cos(a + 0.5) * len * 0.5, height * (0.58 + (i % 3) * 0.06), Math.sin(a + 0.5) * len * 0.5),
        new THREE.Vector3(Math.cos(a + 0.9) * len * 0.9, height * (0.72 + (i % 3) * 0.05), Math.sin(a + 0.9) * len * 0.9),
      ], 0.017, R.branch, { segments: 5, radialSegments: 4 });
      g.add(twig);
      snow(g, R, Math.cos(a) * len * 0.54, height * (0.58 + (i % 3) * 0.06), Math.sin(a) * len * 0.54, 0.2, 0.03, 0.08);
    }
    snow(g, R, 0, 0.12, 0, 0.7, 0.1, 0.55);
  }
  assembly.add(g, { start: 2.1, duration: 0.9, mode: 'grow', land: false });
  return g;
}

export function buildTown(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const left = buildDetailedHouse(scene, R, assembly, {
    ...HOUSES.left, wallMat: R.sidingCream, warm: true, delay: 0,
  }, false, true);
  const right = buildDetailedHouse(scene, R, assembly, {
    ...HOUSES.right, wallMat: R.sidingSage, warm: false, delay: 0.15,
  }, true, true);
  // Back row of small houses, simplified and hazy.
  const back = new THREE.Group();
  scene.add(back);
  const backSpecs = [
    { ...BACK_HOUSES[0], wallMat: R.sidingBlue, warm: false, delay: 0 },
    { ...BACK_HOUSES[1], wallMat: R.sidingCream, warm: true, delay: 0.1 },
    { ...BACK_HOUSES[2], wallMat: R.sidingSage, warm: false, delay: 0.2 },
    { ...BACK_HOUSES[3], wallMat: R.sidingWarm, warm: false, delay: 0.3 },
    { ...BACK_HOUSES[4], wallMat: R.sidingBlue, warm: false, delay: 0.4 },
  ];
  backSpecs.forEach((spec, i) => {
    buildDetailedHouse(scene, R, assembly, {
      ...spec, rot: (i % 2 ? 1 : -1) * 0.04, roofH: 1.25,
    }, i % 2 === 1, false);
  });
  // Side garden fences and a small block wall between houses.
  for (const [x, z, rot] of [
    [-6.0, 0.9, 0.03], [6.0, 0.6, -0.03],
  ]) {
    const wall = new THREE.Group();
    wall.position.set(x, SNOW_Y, z);
    wall.rotation.y = rot;
    scene.add(wall);
    box(wall, 0.85, 0.82, 2.8, R.blockWall, 0, 0.41, 0, { cast: true });
    for (let i = 0; i < 5; i++) {
      box(wall, 0.86, 0.012, 0.04, R.blockJoint, 0, 0.18 + i * 0.14, 1.4, { cast: false });
    }
    snow(wall, R, 0, 0.87, 0, 0.45, 0.06, 1.35);
    assembly.add(wall, { start: 2.0, duration: 0.8, mode: 'rise', distance: 0.4, land: false });
  }
  // A pair of garden trees and a snowy pine.
  buildTree(scene, R, assembly, -9.0, 0.6, 4.2, 'bare');
  buildTree(scene, R, assembly, 8.8, 1.4, 3.8, 'bare');
  buildTree(scene, R, assembly, -9.7, -5.3, 4.5, 'pine');
  buildTree(scene, R, assembly, 9.4, -6.5, 4.0, 'pine');
  return { left, right };
}
