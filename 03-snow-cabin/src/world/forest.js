import * as THREE from 'three';
import { SNOW_Y, TREES, ROCKS } from '../config.js';
import {
  addContactShadow,
  makeGroup,
  meshCyl,
  meshRounded,
  rng,
  tubeFromPoints,
  TAU,
} from '../core/utils.js';

const unitCone = new THREE.ConeGeometry(1, 1, 9, 1, false);
const unitConeFlat = unitCone.index ? unitCone.toNonIndexed() : unitCone;
unitConeFlat.computeVertexNormals();
const unitBlob = new THREE.IcosahedronGeometry(1, 1);
const unitBlobFlat = unitBlob.index ? unitBlob.toNonIndexed() : unitBlob;
unitBlobFlat.computeVertexNormals();

const tmpQ = new THREE.Quaternion();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpM = new THREE.Matrix4();
const up = new THREE.Vector3(0, 1, 0);

function matrixAt(p, q, s) {
  tmpQ.copy(q);
  return new THREE.Matrix4().compose(p, tmpQ, s);
}

function makePine(R, spec, simple = false) {
  const root = new THREE.Group();
  root.position.set(spec.x, SNOW_Y, spec.z);
  const h = spec.h;
  const spread = h * (0.21 + (spec.variant % 3) * 0.018);
  const tiers = simple ? 4 : (h > 8 ? 8 : 7);
  const greenMats = [R.pine, R.pineDark, R.pineBlue, R.pineLight];
  const greenMaterial = R._toon('#ffffff', { side: THREE.DoubleSide });
  const snowMaterial = R._toon('#eef6fc', { side: THREE.DoubleSide });
  const green = new THREE.InstancedMesh(unitConeFlat, greenMaterial, tiers);
  const snow = new THREE.InstancedMesh(unitConeFlat, snowMaterial, tiers);
  green.castShadow = true;
  green.receiveShadow = true;
  snow.castShadow = true;
  snow.receiveShadow = true;
  const blobs = [];
  const RNG = rng(spec.x * 941 + spec.z * 137 + 2);
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const y = h * (0.14 + t * 0.68);
    const tierH = h * (0.19 - t * 0.075);
    const r = spread * (1 - t * 0.82) * (0.88 + RNG() * 0.18);
    tmpQ.setFromAxisAngle(up, RNG() * TAU);
    tmpP.set(0, y, 0);
    tmpS.set(r, tierH, r);
    tmpM.compose(tmpP, tmpQ, tmpS);
    green.setMatrixAt(i, tmpM);
    const c = greenMats[i % greenMats.length] || R.pine;
    green.setColorAt(i, c.color ?? new THREE.Color('#2a5147'));
    // Snow cap sits on the upper half of each green tier.
    const snowH = tierH * (0.4 + RNG() * 0.08);
    tmpP.set(0, y + tierH * 0.29, 0);
    tmpS.set(r * (1.04 + RNG() * 0.04), snowH, r * (1.04 + RNG() * 0.04));
    tmpQ.setFromAxisAngle(up, RNG() * TAU);
    tmpM.compose(tmpP, tmpQ, tmpS);
    snow.setMatrixAt(i, tmpM);
    // Chunky snow clumps around the tier rim.
    const blobCount = simple ? 5 : 8;
    for (let b = 0; b < blobCount; b++) {
      const a = (b / blobCount) * TAU + RNG() * 0.4;
      const rr = r * (0.76 + RNG() * 0.2);
      blobs.push({
        p: new THREE.Vector3(Math.cos(a) * rr, y + tierH * 0.22 + RNG() * tierH * 0.13, Math.sin(a) * rr),
        s: new THREE.Vector3(r * (0.12 + RNG() * 0.09), r * (0.055 + RNG() * 0.045), r * (0.13 + RNG() * 0.09)),
      });
    }
  }
  green.instanceMatrix.needsUpdate = true;
  if (green.instanceColor) green.instanceColor.needsUpdate = true;
  snow.instanceMatrix.needsUpdate = true;
  root.add(green, snow);
  const trunk = meshCyl(h * 0.014, h * 0.032, h * 0.74, R.bark, 0, h * 0.37, 0, 7, {
    cast: true,
    receive: true,
  });
  root.add(trunk);
  // White branch-tip snow.
  const blobMesh = new THREE.InstancedMesh(unitBlobFlat, R.snowCap, blobs.length);
  blobMesh.castShadow = false;
  blobMesh.receiveShadow = true;
  blobs.forEach((b, i) => {
    tmpP.copy(b.p);
    tmpQ.setFromAxisAngle(up, RNG() * TAU);
    tmpM.compose(tmpP, tmpQ, b.s);
    blobMesh.setMatrixAt(i, tmpM);
  });
  blobMesh.instanceMatrix.needsUpdate = true;
  root.add(blobMesh);
  // Snow around the roots.
  const baseSnow = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2), R.snowDrift);
  baseSnow.scale.set(spread * 0.55, 0.18, spread * 0.45);
  baseSnow.position.y = -0.02;
  root.add(baseSnow);
  return root;
}

function makeBush(R, x, z, scale = 1, berries = false) {
  const root = new THREE.Group();
  root.position.set(x, SNOW_Y - 0.01, z);
  const RNG = rng(x * 232 + z * 71);
  const parts = new THREE.InstancedMesh(unitBlobFlat, R._toon('#ffffff'), 5);
  parts.castShadow = true;
  parts.receiveShadow = true;
  const snow = new THREE.InstancedMesh(unitBlobFlat, R.snowCap, 4);
  snow.castShadow = false;
  snow.receiveShadow = true;
  const greenColors = ['#294f43', '#1d3c35', '#396250'];
  for (let i = 0; i < 5; i++) {
    const a = RNG() * TAU;
    const r = (0.12 + RNG() * 0.3) * scale;
    const p = new THREE.Vector3(Math.cos(a) * r, (0.1 + RNG() * 0.2) * scale, Math.sin(a) * r);
    const s = new THREE.Vector3((0.25 + RNG() * 0.22) * scale, (0.18 + RNG() * 0.16) * scale, (0.22 + RNG() * 0.18) * scale);
    tmpM.compose(p, new THREE.Quaternion(), s);
    parts.setMatrixAt(i, tmpM);
    parts.setColorAt(i, new THREE.Color(greenColors[i % 3]));
  }
  parts.instanceMatrix.needsUpdate = true;
  if (parts.instanceColor) parts.instanceColor.needsUpdate = true;
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Vector3((RNG() - 0.5) * 0.65 * scale, (0.24 + RNG() * 0.18) * scale, (RNG() - 0.5) * 0.5 * scale);
    const s = new THREE.Vector3((0.23 + RNG() * 0.18) * scale, (0.08 + RNG() * 0.08) * scale, (0.2 + RNG() * 0.14) * scale);
    tmpM.compose(p, new THREE.Quaternion(), s);
    snow.setMatrixAt(i, tmpM);
  }
  snow.instanceMatrix.needsUpdate = true;
  root.add(parts, snow);
  if (berries) {
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.035 * scale, 6, 5), R.berry);
      b.position.set((RNG() - 0.5) * 0.65 * scale, (0.28 + RNG() * 0.35) * scale, (RNG() - 0.5) * 0.5 * scale);
      root.add(b);
    }
  }
  return root;
}

function makeRock(R, spec) {
  const root = new THREE.Group();
  root.position.set(spec.x, SNOW_Y - 0.05, spec.z);
  const RNG = rng(spec.x * 87 + spec.z * 113);
  const count = 2 + Math.floor(RNG() * 3);
  const rockMat = R._toon('#6c7474');
  for (let i = 0; i < count; i++) {
    const geo = new THREE.DodecahedronGeometry(1, 0);
    const m = new THREE.Mesh(geo, i === 0 ? rockMat : R._toon(i % 2 ? '#7b8181' : '#5d6668'));
    m.position.set((RNG() - 0.5) * spec.s * 0.8, (0.12 + RNG() * 0.18) * spec.s, (RNG() - 0.5) * spec.s * 0.6);
    m.scale.set(spec.s * (0.35 + RNG() * 0.3), spec.s * (0.25 + RNG() * 0.2), spec.s * (0.3 + RNG() * 0.25));
    m.rotation.set(RNG() * 0.6, RNG() * TAU, RNG() * 0.4);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
  }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2), R.snowDrift);
  cap.position.set(0, spec.s * 0.38, 0);
  cap.scale.set(spec.s * 0.5, spec.s * 0.14, spec.s * 0.38);
  cap.receiveShadow = true;
  root.add(cap);
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 5, 0, TAU, 0, Math.PI / 2), R.snowCap);
    s.position.set((RNG() - 0.5) * spec.s * 0.7, spec.s * (0.3 + RNG() * 0.15), (RNG() - 0.5) * spec.s * 0.5);
    s.scale.set(spec.s * (0.1 + RNG() * 0.16), spec.s * 0.055, spec.s * (0.1 + RNG() * 0.12));
    root.add(s);
  }
  addContactShadow(root, spec.s * 0.7, spec.s * 0.5, 0, 0, 0.01, 0.26);
  return root;
}

function makeSnowLog(R, x, z, angle, length = 3.2) {
  const root = new THREE.Group();
  root.position.set(x, SNOW_Y + 0.16, z);
  const log = meshCyl(0.22, 0.27, length, R.bark, 0, 0, 0, 9, { cast: true, receive: true });
  log.rotation.z = Math.PI / 2;
  log.rotation.y = angle;
  root.add(log);
  const snow = meshRounded(length * 0.92, 0.13, 0.32, 0.06, R.snowCap, 0, 0.24, 0, { cast: false });
  snow.rotation.y = angle;
  root.add(snow);
  const endMat = R.logEnd;
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.26, 12), endMat);
    cap.rotation.y = Math.PI / 2 * side;
    cap.position.set(Math.cos(angle) * length / 2 * side, 0, Math.sin(angle) * length / 2 * side);
    root.add(cap);
  }
  return root;
}

export function buildForest(scene, assets, R, assembly) {
  const root = new THREE.Group();
  root.name = 'snow-forest';
  scene.add(root);
  const updateList = [];

  const background = new THREE.Group();
  root.add(background);
  const bgSpecs = [
    [-10.2, -9.7, 6.8, 0.7, 1], [-5.1, -10.7, 7.2, 0.72, 2], [-1.3, -10.4, 5.6, 0.58, 0],
    [3.0, -10.6, 6.5, 0.65, 1], [7.8, -9.9, 7.1, 0.7, 2], [10.1, -6.8, 5.3, 0.55, 0],
    [10.4, 5.8, 4.4, 0.48, 2], [-10.4, 8.0, 4.8, 0.5, 1],
  ];
  bgSpecs.forEach(([x, z, h, s, variant], i) => {
    const tree = makePine(R, { x, z, h, s, variant }, true);
    background.add(tree);
  });
  assembly.add(background, { start: 1.35, duration: 1.25, mode: 'fade' });

  const trees = [];
  TREES.forEach((spec, i) => {
    const tree = makePine(R, spec, false);
    root.add(tree);
    const start = 1.5 + i * 0.16;
    assembly.add(tree, { start, duration: 0.95, mode: 'grow', land: i < 4 });
    trees.push(tree);
  });

  const rocks = new THREE.Group();
  root.add(rocks);
  ROCKS.forEach((spec, i) => {
    const rock = makeRock(R, spec);
    rocks.add(rock);
    assembly.add(rock, { start: 1.9 + i * 0.09, duration: 0.7, mode: 'pop' });
  });

  const bushes = new THREE.Group();
  root.add(bushes);
  const bushSpecs = [
    [-5.7, 2.8, 1.3, false], [-6.5, 1.8, 1.1, true], [4.8, 1.6, 1.2, true],
    [5.7, 2.9, 0.9, false], [-7.6, 6.0, 1.1, false], [3.9, 5.4, 0.8, true],
    [-3.4, 9.1, 1.0, false], [10.3, -1.8, 0.8, false], [-9.2, -0.8, 1.2, false],
    [2.5, 9.4, 0.8, false], [4.4, 8.8, 0.65, true],
  ];
  bushSpecs.forEach(([x, z, s, berries], i) => {
    const bush = makeBush(R, x, z, s, berries);
    bushes.add(bush);
    assembly.add(bush, { start: 2.0 + i * 0.07, duration: 0.55, mode: 'pop' });
  });

  const logs = new THREE.Group();
  root.add(logs);
  const log1 = makeSnowLog(R, -6.7, 7.5, 0.3, 3.0);
  const log2 = makeSnowLog(R, 4.5, 8.8, -0.5, 2.6);
  logs.add(log1, log2);
  assembly.add(logs, { start: 3.1, duration: 0.8, mode: 'fade' });

  // A couple of fallen branches tucked into the tree line.
  const twigs = new THREE.Group();
  const twigSpecs = [
    [-8.0, 8.3, 0.2], [-6.5, 8.9, -0.4], [7.1, 8.6, 0.6],
  ];
  for (const [x, z, rot] of twigSpecs) {
    const t = tubeFromPoints([
      new THREE.Vector3(x - 0.7, SNOW_Y + 0.07, z),
      new THREE.Vector3(x - 0.2, SNOW_Y + 0.09, z + 0.06),
      new THREE.Vector3(x + 0.55, SNOW_Y + 0.06, z + 0.12),
    ], 0.028, R.bark, { segments: 6, radialSegments: 4 });
    t.rotation.y = rot;
    twigs.add(t);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4, 0, TAU, 0, Math.PI / 2), R.snowCap);
    cap.scale.set(0.55, 0.045, 0.1);
    cap.position.set(x, SNOW_Y + 0.11, z + 0.05);
    twigs.add(cap);
  }
  root.add(twigs);
  assembly.add(twigs, { start: 3.4, duration: 0.5, mode: 'fade' });

  // A loose snowy boulder sits at the base edge for silhouette interest.
  const farRock = makeRock(R, { x: 10.1, z: 8.9, s: 0.85, rot: 0.2 });
  root.add(farRock);
  assembly.add(farRock, { start: 2.5, duration: 0.7, mode: 'pop' });

  return {
    root,
    background,
    trees,
    update(time, dt) {
      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        const sway = Math.sin(time * 0.18 + i * 1.7) * 0.004;
        t.rotation.z = sway;
        t.rotation.x = Math.cos(time * 0.14 + i) * 0.003;
      }
    },
  };
}
