import * as THREE from 'three';
import { CABIN, SNOW_Y } from '../config.js';
import {
  addContactShadow,
  canvasTexture,
  cylinderBetween,
  makeGroup,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  roundedBoxGeo,
  rng,
  tubeFromPoints,
  TAU,
} from '../core/utils.js';

function addBox(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, {
    cast: opts.cast ?? false,
    receive: opts.receive ?? true,
    round: opts.round,
    radius: opts.radius ?? 0.03,
  });
  parent.add(m);
  return m;
}

function addRounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, { cast: opts.cast ?? false, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function makeLantern(R, assets, scale = 1) {
  const g = new THREE.Group();
  const body = meshCyl(0.18 * scale, 0.13 * scale, 0.32 * scale, R.lanternGlass, 0, 0, 0, 6);
  g.add(body);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.165 * scale, 0.12 * scale, 0.31 * scale, 6, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd79a, transparent: true, opacity: 0.45, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = 0;
  g.add(glass);
  const capTop = meshCyl(0.045 * scale, 0.21 * scale, 0.12 * scale, R.lanternMetal, 0, 0.23 * scale, 0, 6);
  const capBottom = meshCyl(0.19 * scale, 0.055 * scale, 0.09 * scale, R.lanternMetal, 0, -0.2 * scale, 0, 6);
  g.add(capTop, capBottom);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const bar = meshCyl(0.012 * scale, 0.012 * scale, 0.39 * scale, R.lanternMetal,
      Math.cos(a) * 0.16 * scale, 0, Math.sin(a) * 0.16 * scale, 4);
    g.add(bar);
  }
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.07 * scale, 0.012 * scale, 5, 10, Math.PI * 1.2), R.lanternMetal);
  hook.position.y = 0.37 * scale;
  hook.rotation.x = 0.3;
  g.add(hook);
  // snow cap
  const snowCap = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 12, 6, 0, TAU, 0, Math.PI / 2), R.snowCap);
  snowCap.position.y = 0.28 * scale;
  snowCap.scale.set(1.25, 0.25, 1.25);
  g.add(snowCap);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xffc079,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  glow.scale.set(1.1, 1.1, 1);
  g.add(glow);
  g.userData.glow = glow;
  return g;
}

function buildFence(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const z = 4.95;
  const segments = [
    [-9.4, -3.25],
    [-0.7, 4.45],
  ];
  const posts = [-9.4, -7.4, -5.4, -3.25, -0.7, 1.4, 3.4, 4.45];
  const group = new THREE.Group();
  root.add(group);
  for (const [x0, x1] of segments) {
    for (let rail = 0; rail < 2; rail++) {
      const y = SNOW_Y + 0.36 + rail * 0.3;
      const len = x1 - x0;
      const cx = (x0 + x1) / 2;
      const beam = addBox(group, len, 0.09, 0.12, R.woodTrim, cx, y, z, { cast: true });
      beam.rotation.z = (Math.random() - 0.5) * 0.012;
      // snow ridge on the top rail
      if (rail === 1) {
        const snow = addRounded(group, len * 0.97, 0.08, 0.17, 0.035, R.snowCap, cx, y + 0.09, z, { cast: false });
        snow.rotation.z = beam.rotation.z;
      }
    }
  }
  const RNG = rng(5540);
  posts.forEach((x, i) => {
    const h = 1.02 + (i % 3) * 0.06;
    const post = addRounded(group, 0.15, h, 0.15, 0.02, R.woodPlankDark, x, SNOW_Y + h / 2, z, { cast: true });
    post.rotation.z = (RNG() - 0.5) * 0.025;
    const snow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 6, 0, TAU, 0, Math.PI / 2), R.snowCap);
    snow.scale.set(1.2, 0.35, 1.1);
    snow.position.set(x, SNOW_Y + h + 0.015, z);
    group.add(snow);
  });
  // A gate stands open, half swallowed by snow.
  const gate = new THREE.Group();
  gate.position.set(-3.0, SNOW_Y + 0.55, 4.88);
  gate.rotation.y = 0.78;
  addRounded(gate, 1.65, 0.11, 0.1, 0.025, R.woodTrim, -0.7, 0.28, 0, { cast: true });
  addRounded(gate, 1.65, 0.1, 0.1, 0.025, R.woodTrim, -0.7, -0.1, 0, { cast: true });
  addRounded(gate, 0.12, 0.65, 0.1, 0.02, R.woodPlankDark, -1.42, 0.1, 0, { cast: true });
  addRounded(gate, 0.12, 0.65, 0.1, 0.02, R.woodPlankDark, 0.04, 0.1, 0, { cast: true });
  for (let i = 1; i < 4; i++) {
    addRounded(gate, 0.09, 0.6, 0.07, 0.02, R.woodPlankDark, -1.4 + i * 0.36, 0.1, 0, { cast: false });
  }
  const gateSnow = addRounded(gate, 1.5, 0.085, 0.16, 0.035, R.snowCap, -0.7, 0.36, 0, { cast: false });
  group.add(gate);
  addContactShadow(group, 14, 0.8, -1.5, z + 0.1, SNOW_Y + 0.02, 0.17);
  assembly.add(group, { start: 4.55, duration: 0.9, mode: 'rise', distance: 0.4, land: true, landAt: [-5, SNOW_Y, 4.95] });
  return root;
}

function buildSign(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(-4.7, SNOW_Y, 5.7);
  g.rotation.y = 0.16;
  root.add(g);
  for (const x of [-0.85, 0.85]) {
    const post = addRounded(g, 0.15, 2.1, 0.15, 0.025, R.woodPlankDark, x, 1.05, 0.08, { cast: true });
    const snow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 5, 0, TAU, 0, Math.PI / 2), R.snowCap);
    snow.scale.set(1.2, 0.35, 1.1);
    snow.position.set(x, 2.12, 0.08);
    g.add(snow);
  }
  addRounded(g, 2.4, 1.18, 0.12, 0.03, R.woodTrimDark, 0, 1.52, 0.1, { cast: true });
  const board = new THREE.Mesh(planeGeo(2.28, 1.08), new THREE.MeshBasicMaterial({
    map: assets.sign,
    toneMapped: false,
  }));
  board.position.set(0, 1.52, 0.17);
  board.rotation.y = 0;
  g.add(board);
  // little snow shelf along the top
  const topSnow = addRounded(g, 2.3, 0.09, 0.2, 0.03, R.snowCap, 0, 2.13, 0.16, { cast: false });
  // brace
  addBox(g, 1.9, 0.07, 0.1, R.woodTrim, 0, 0.95, 0.17, { cast: true });
  addContactShadow(g, 2.8, 1.2, 0, 0.1, 0.02, 0.26);
  assembly.add(g, { start: 4.85, duration: 0.8, mode: 'rise', distance: 0.5, land: true, landAt: [-4.7, SNOW_Y, 5.7] });
  return g;
}

function buildPathLantern(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(0.95, SNOW_Y, 5.15);
  root.add(g);
  const base = meshCyl(0.2, 0.3, 0.2, R.stoneDark, 0, 0.1, 0, 8);
  g.add(base);
  const post = meshCyl(0.055, 0.08, 2.7, R.woodTrimDark, 0, 1.42, 0, 7);
  post.castShadow = true;
  g.add(post);
  const cap = meshCyl(0.15, 0.07, 0.09, R.snowCap, 0, 2.79, 0, 8);
  g.add(cap);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.022, 5, 10, Math.PI * 0.7), R.iron);
  arm.position.set(0.17, 2.55, 0);
  arm.rotation.z = 0.5;
  g.add(arm);
  const lantern = makeLantern(R, assets, 0.85);
  lantern.position.set(0.38, 2.22, 0);
  g.add(lantern);
  const pl = new THREE.PointLight(0xffb56c, 0, 5.2, 2.0);
  pl.position.set(0.38, 2.24, 0.12);
  g.add(pl);
  assembly.addLight(pl, { start: 4.45, duration: 0.9, intensity: 5 });
  assembly.add(g, { start: 4.3, duration: 0.85, mode: 'rise', distance: 0.55, land: true, landAt: [0.95, SNOW_Y, 5.15] });
  return { group: g, light: pl, lantern };
}

function buildDoorLantern(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(CABIN.doorX0 - 0.55, SNOW_Y + 2.05, CABIN.z1 + 0.08);
  root.add(g);
  // bracket on wall
  addBox(g, 0.62, 0.06, 0.06, R.iron, 0.3, 0, 0.04, { cast: true });
  const brace = cylinderBetween(new THREE.Vector3(0.0, -0.5, 0.02), new THREE.Vector3(0.55, 0, 0.02), 0.022, R.iron, 5);
  g.add(brace);
  const lantern = makeLantern(R, assets, 0.95);
  lantern.position.set(0.62, -0.27, 0.08);
  g.add(lantern);
  const pl = new THREE.PointLight(0xffb46d, 0, 4.2, 2.0);
  pl.position.set(0.62, -0.25, 0.2);
  g.add(pl);
  assembly.addLight(pl, { start: 4.15, duration: 0.8, intensity: 4.2 });
  assembly.add(g, { start: 3.95, duration: 0.8, mode: 'rise', distance: 0.45, land: false });
  return { group: g, light: pl, lantern };
}

function buildHangingPlanter(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(-4.25, SNOW_Y + 2.75, CABIN.z1 + 0.12);
  root.add(g);
  addBox(g, 0.7, 0.07, 0.07, R.iron, 0.28, 0, 0, { cast: true });
  addBox(g, 0.035, 0.38, 0.035, R.iron, 0.62, 0.14, 0);
  for (const x of [0.22, 0.52, 0.82]) {
    addBox(g, 0.012, 0.34, 0.012, R.rope, x, -0.25, 0.03);
    const pot = meshCyl(0.12, 0.09, 0.16, R.plantPot, x, -0.46, 0.03, 8);
    g.add(pot);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 5), R.pine);
      leaf.position.set(x + (i % 2 - 0.5) * 0.1, -0.35 + i * 0.02, 0.03 + (i % 3 - 1) * 0.06);
      leaf.rotation.z = (i - 2) * 0.25;
      g.add(leaf);
    }
    const snow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 5, 0, TAU, 0, Math.PI / 2), R.snowCap);
    snow.scale.set(1.15, 0.3, 0.9);
    snow.position.set(x, -0.28, 0.03);
    g.add(snow);
  }
  assembly.add(g, { start: 4.15, duration: 0.7, mode: 'pop' });
  return g;
}

function buildWoodpile(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(4.9, SNOW_Y, -3.2);
  root.add(g);
  const RNG = rng(6632);
  // supports and lean-to
  for (const z of [-1.25, 1.25]) {
    addRounded(g, 0.15, 2.2, 0.15, 0.025, R.woodPlankDark, 0, 1.1, z, { cast: true });
  }
  addRounded(g, 0.2, 0.12, 2.8, 0.03, R.woodTrim, 0, 2.2, 0, { cast: true });
  const roof = addRounded(g, 1.8, 0.12, 3.0, 0.04, R.woodTrim, -0.35, 2.45, 0, { cast: true });
  roof.rotation.z = 0.18;
  const snowRoof = addRounded(g, 1.85, 0.12, 3.05, 0.05, R.snowCap, -0.34, 2.56, 0, { cast: false });
  snowRoof.rotation.z = 0.18;
  // Stacked logs with their ends facing the camera / east.
  const rows = 5;
  const perRow = 5;
  const logGeo = new THREE.CylinderGeometry(0.16, 0.17, 1.2, 8);
  const logMesh = new THREE.InstancedMesh(logGeo, R.bark, rows * perRow);
  logMesh.castShadow = true;
  logMesh.receiveShadow = true;
  const endGeo = new THREE.CircleGeometry(0.17, 8);
  const endMesh = new THREE.InstancedMesh(endGeo, R.logEnd, rows * perRow);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < perRow; i++) {
      const z = -0.85 + i * 0.43 + (r % 2 ? 0.1 : 0);
      const y = 0.2 + r * 0.3;
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
      p.set(-0.15 + (RNG() - 0.5) * 0.05, y, z);
      m.compose(p, q, s);
      logMesh.setMatrixAt(idx, m);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
      p.set(0.47, y, z);
      m.compose(p, q, s);
      endMesh.setMatrixAt(idx, m);
      idx++;
    }
  }
  logMesh.instanceMatrix.needsUpdate = true;
  endMesh.instanceMatrix.needsUpdate = true;
  g.add(logMesh, endMesh);
  const pileSnow = addRounded(g, 0.65, 0.16, 2.7, 0.05, R.snowCap, -0.1, 1.76, 0, { cast: false });
  pileSnow.rotation.z = -0.06;
  addContactShadow(g, 2.0, 3.0, -0.1, 0, 0.02, 0.28);
  assembly.add(g, { start: 4.85, duration: 0.9, mode: 'rise', distance: 0.6, land: true, landAt: [4.9, SNOW_Y, -3.2] });
  return root;
}

function buildAxe(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(5.75, SNOW_Y, 1.15);
  root.add(g);
  const stump = meshCyl(0.3, 0.38, 0.5, R.bark, 0, 0.25, 0, 10);
  stump.castShadow = true;
  g.add(stump);
  const top = meshCyl(0.3, 0.3, 0.03, R.logEnd, 0, 0.51, 0, 12);
  g.add(top);
  const snow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 6, 0, TAU, 0, Math.PI / 2), R.snowCap);
  snow.scale.set(0.95, 0.1, 0.8);
  snow.position.set(-0.05, 0.53, -0.05);
  g.add(snow);
  // axe leaning in the stump
  const handle = meshCyl(0.025, 0.035, 0.95, R.axeHandle, 0.12, 0.95, 0, 6);
  handle.rotation.z = -0.3;
  g.add(handle);
  const axeShape = new THREE.Shape();
  axeShape.moveTo(-0.08, -0.12);
  axeShape.lineTo(0.06, -0.19);
  axeShape.lineTo(0.32, -0.13);
  axeShape.lineTo(0.42, 0.01);
  axeShape.lineTo(0.13, 0.17);
  axeShape.lineTo(-0.08, 0.08);
  axeShape.closePath();
  const axeGeo = new THREE.ExtrudeGeometry(axeShape, {
    depth: 0.075,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 2,
    curveSegments: 3,
  });
  axeGeo.translate(0, 0, -0.0375);
  const axeHead = new THREE.Mesh(axeGeo, R.axeHead);
  axeHead.position.set(0.27, 1.33, 0);
  axeHead.rotation.z = -0.3;
  axeHead.castShadow = true;
  g.add(axeHead);
  // Small snow collar at the handle eye.
  const axeSnow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 4, 0, TAU, 0, Math.PI / 2), R.snowCap);
  axeSnow.scale.set(0.65, 0.18, 0.4);
  axeSnow.position.set(0.24, 1.48, 0.01);
  g.add(axeSnow);
  addContactShadow(g, 0.9, 0.8, 0, 0.1, 0.01, 0.25);
  assembly.add(g, { start: 5.05, duration: 0.75, mode: 'pop' });
  return g;
}

function buildSled(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(3.25, SNOW_Y, 4.45);
  g.rotation.y = 0.25;
  g.rotation.z = 0.16;
  root.add(g);
  // curved runners
  const runnerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.52, 0.02, 0),
    new THREE.Vector3(-0.42, 0.34, 0),
    new THREE.Vector3(0.38, 0.34, 0),
    new THREE.Vector3(0.55, 0.12, 0),
  ]);
  for (const x of [-0.55, 0.55]) {
    const runner = new THREE.Mesh(new THREE.TubeGeometry(runnerCurve, 12, 0.025, 5, false), R.sledRunner);
    runner.position.x = x;
    g.add(runner);
  }
  // wooden deck slats
  for (let i = 0; i < 4; i++) {
    addBox(g, 1.02, 0.07, 0.16, R.sled, 0, 0.52 + i * 0.04, -0.3 + i * 0.18, { cast: true });
  }
  for (const x of [-0.4, 0.4]) {
    addBox(g, 0.1, 0.35, 0.1, R.sled, x, 0.58, 0.25, { cast: true });
    addBox(g, 0.1, 0.08, 1.0, R.sled, x, 0.75, 0.68, { cast: true });
  }
  addRounded(g, 1.0, 0.08, 0.75, 0.04, R.snowCap, 0, 0.82, 0.12, { cast: false });
  assembly.add(g, { start: 4.65, duration: 0.8, mode: 'rise', distance: 0.5, land: true, landAt: [3.25, SNOW_Y, 4.45] });
  return g;
}

function buildWinterPot(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const pots = [
    [-4.3, 1.5, 0.9], [-1.1, 1.48, 0.7], [2.9, 1.46, 0.8],
  ];
  const group = new THREE.Group();
  root.add(group);
  pots.forEach(([x, z, s], i) => {
    const pot = meshCyl(0.15 * s, 0.22 * s, 0.3 * s, R.plantPot, x, SNOW_Y + 1.16, CABIN.z1 + 0.12, 9);
    group.add(pot);
    for (let j = 0; j < 6; j++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07 * s, 0.22 * s, 5), j % 2 ? R.pine : R.pineDark);
      leaf.position.set(x + Math.cos(j * 1.7) * 0.13 * s, SNOW_Y + 1.32 + (j % 3) * 0.06, z + Math.sin(j * 1.7) * 0.08);
      leaf.rotation.z = (j - 2.5) * 0.16;
      group.add(leaf);
    }
    const snow = new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 8, 4, 0, TAU, 0, Math.PI / 2), R.snowCap);
    snow.scale.set(1.1, 0.25, 0.8);
    snow.position.set(x, SNOW_Y + 1.24, CABIN.z1 + 0.16);
    group.add(snow);
  });
  assembly.add(group, { start: 4.25, duration: 0.7, mode: 'pop' });
  return group;
}

export function buildProps(scene, assets, R, assembly) {
  const fence = buildFence(scene, R, assembly);
  const sign = buildSign(scene, assets, R, assembly);
  const pathLantern = buildPathLantern(scene, assets, R, assembly);
  const doorLantern = buildDoorLantern(scene, assets, R, assembly);
  const hangingPlanter = buildHangingPlanter(scene, R, assembly);
  const woodpile = buildWoodpile(scene, R, assembly);
  const axe = buildAxe(scene, R, assembly);
  const sled = buildSled(scene, R, assembly);
  const pots = buildWinterPot(scene, R, assembly);

  return {
    fence,
    sign,
    pathLantern,
    doorLantern,
    hangingPlanter,
    woodpile,
    axe,
    sled,
    pots,
    update(time, dt) {
      const flicker = 0.94 + 0.06 * Math.sin(time * 4.3) + 0.03 * Math.sin(time * 11.2);
      const pathIn = Math.min(1, Math.max(0, (time - 4.45) / 0.9));
      const doorIn = Math.min(1, Math.max(0, (time - 4.15) / 0.8));
      pathLantern.light.intensity = 5 * pathIn * flicker;
      doorLantern.light.intensity = 4.2 * doorIn * (0.95 + 0.05 * Math.sin(time * 3.7 + 1.4));
      pathLantern.lantern.userData.glow.material.opacity = pathIn * (0.43 + 0.06 * Math.sin(time * 2.3));
      doorLantern.lantern.userData.glow.material.opacity = doorIn * (0.36 + 0.05 * Math.sin(time * 2.0 + 1.1));
    },
  };
}
