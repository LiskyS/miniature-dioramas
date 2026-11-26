import * as THREE from 'three';
import { BASE_SIZE, SNOW_HALF, SNOW_Y, PLINTH_H, POST, STREET, POLES, HOUSES } from '../config.js';
import {
  canvasTexture,
  meshBox,
  meshRounded,
  planeGeo,
  addContactShadow,
  rng,
  TAU,
} from '../core/utils.js';

function addBox(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, { cast: opts.cast ?? false, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function snowLobe(parent, R, x, z, sx, sy, sz, mat = R.snowDrift) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2), mat);
  m.position.set(x, SNOW_Y - 0.01, z);
  m.scale.set(sx, sy, sz);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function footPrintTexture() {
  return canvasTexture(128, 192, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(88,111,124,.35)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.55, 18, 39, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(w * 0.4, h * 0.16, 12, 25);
    // tread
    ctx.strokeStyle = 'rgba(236,245,248,.15)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.32 + i * 15);
      ctx.lineTo(w * 0.64, h * 0.32 + i * 15);
      ctx.stroke();
    }
  });
}

function tireTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.filter = 'blur(2px)';
    ctx.fillStyle = 'rgba(66,76,80,.20)';
    ctx.fillRect(34, -10, 44, h + 20);
    ctx.fillRect(178, -10, 44, h + 20);
    ctx.filter = 'none';
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = 'rgba(52,62,66,.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(38, i * 15);
      ctx.lineTo(74, i * 15 + 6);
      ctx.moveTo(182, i * 15 + 5);
      ctx.lineTo(218, i * 15);
      ctx.stroke();
    }
  });
}

function buildPlinth(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const plinth = meshRounded(BASE_SIZE, PLINTH_H, BASE_SIZE, 0.16, R.plinth, 0, -PLINTH_H / 2, 0, {
    cast: false,
    receive: false,
    roundSeg: 3,
  });
  g.add(plinth);
  // Dark rim below the snow cap.
  g.add(meshRounded(BASE_SIZE - 0.16, 0.16, BASE_SIZE - 0.16, 0.06, R.plinthDark, 0, 0.02, 0, { cast: false, receive: false }));
  // Thin brass reveal around the top edge.
  for (const [x, z, w, d] of [
    [0, BASE_SIZE / 2 - 0.04, BASE_SIZE - 0.1, 0.025],
    [0, -BASE_SIZE / 2 + 0.04, BASE_SIZE - 0.1, 0.025],
    [BASE_SIZE / 2 - 0.04, 0, 0.025, BASE_SIZE - 0.1],
    [-BASE_SIZE / 2 + 0.04, 0, 0.025, BASE_SIZE - 0.1],
  ]) {
    g.add(meshBox(w, 0.035, d, R.brass, x, -0.17, z, { cast: false, receive: false }));
  }
  // Front brass plaque.
  g.add(meshRounded(4.8, 1.25, 0.08, 0.045, R.plaqueFrame, 0, -0.78, BASE_SIZE / 2 + 0.02, {
    cast: false, receive: false,
  }));
  const plaque = new THREE.Mesh(planeGeo(4.55, 1.07), R.plaque);
  plaque.position.set(0, -0.78, BASE_SIZE / 2 + 0.075);
  g.add(plaque);
  for (const x of [-2.05, 2.05]) {
    const screw = meshBox(0.035, 0.035, 0.02, R.brass, x, -0.78, BASE_SIZE / 2 + 0.1);
    g.add(screw);
  }
  // Soft ground shadow in the empty space under the model.
  const under = new THREE.Mesh(planeGeo(43, 43), new THREE.MeshBasicMaterial({
    map: assets.glow,
    color: 0x687880,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
  under.rotation.x = -Math.PI / 2;
  under.position.y = -PLINTH_H - 1.2;
  root.add(under);

  assembly.add(g, { start: 0, duration: 1.25, mode: 'rise', distance: 2.6, land: true, landAt: [0, 0.3, 0] });
  return { root, group: g };
}

function buildTerrain(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const slab = meshRounded(SNOW_HALF * 2 + 0.3, 0.3, SNOW_HALF * 2 + 0.3, 0.12, R.snowShade, 0, 0.17, 0, {
    cast: false, receive: true, roundSeg: 3,
  });
  g.add(slab);
  const top = new THREE.Mesh(planeGeo(SNOW_HALF * 2, SNOW_HALF * 2), R.snow);
  top.rotation.x = -Math.PI / 2;
  top.position.y = SNOW_Y;
  top.receiveShadow = true;
  g.add(top);
  // Snow lip around the display edge.
  for (const [x, z, w, d] of [
    [0, SNOW_HALF - 0.05, SNOW_HALF * 2, 0.22],
    [0, -SNOW_HALF + 0.05, SNOW_HALF * 2, 0.22],
    [SNOW_HALF - 0.05, 0, 0.22, SNOW_HALF * 2],
    [-SNOW_HALF + 0.05, 0, 0.22, SNOW_HALF * 2],
  ]) {
    const lip = meshRounded(w, 0.09, d, 0.035, R.snowDrift, x, SNOW_Y + 0.02, z, { cast: false, receive: true });
    g.add(lip);
  }
  assembly.add(g, { start: 0.48, duration: 0.9, mode: 'fade' });
  return { root, group: g };
}

function buildStreet(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  // Road strip.
  const road = new THREE.Mesh(planeGeo(21.3, STREET.roadZ1 - STREET.sidewalkZ1), R.road);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, SNOW_Y + 0.006, (STREET.sidewalkZ1 + STREET.roadZ1) / 2);
  road.receiveShadow = true;
  g.add(road);
  // Sidewalk slab.
  const swDepth = STREET.sidewalkZ1 - STREET.sidewalkZ0;
  const sidewalk = meshRounded(21.2, 0.13, swDepth, 0.035, R.sidewalk, 0, SNOW_Y + 0.06, (STREET.sidewalkZ0 + STREET.sidewalkZ1) / 2, {
    cast: false, receive: true,
  });
  g.add(sidewalk);
  // Curbs.
  const curb = meshRounded(21.3, 0.17, 0.22, 0.025, R.curb, 0, SNOW_Y + 0.085, STREET.sidewalkZ1 - 0.02, { cast: true, receive: true });
  g.add(curb);
  const roadCurb = meshRounded(21.3, 0.12, 0.16, 0.02, R.curbDark, 0, SNOW_Y + 0.05, STREET.roadZ1 - 0.02, { cast: false, receive: true });
  g.add(roadCurb);
  // A cleared stone path to the entrance.
  for (let i = 0; i < 5; i++) {
    const z = 1.98 + i * 0.55;
    const paver = meshRounded(1.9 - i * 0.04, 0.035, 0.42, 0.02, R.stone, -1.7, SNOW_Y + 0.15, z, { cast: false, receive: true });
    paver.rotation.y = (i % 2 ? 0.02 : -0.02);
    g.add(paver);
  }
  // Footprints along the cleared walk.
  const fpTex = footPrintTexture();
  const fpMat = new THREE.MeshBasicMaterial({ map: fpTex, transparent: true, depthWrite: false, opacity: 0.8 });
  for (let i = 0; i < 13; i++) {
    const fp = new THREE.Mesh(planeGeo(0.17, 0.25), fpMat);
    fp.rotation.x = -Math.PI / 2;
    fp.rotation.z = (i % 2 ? 0.14 : -0.12);
    fp.position.set(-1.85 + (i % 2 ? 0.17 : -0.17) + Math.sin(i * 1.4) * 0.06, SNOW_Y + 0.17, 2.0 + i * 0.47);
    fp.renderOrder = 2;
    g.add(fp);
  }
  // Tire marks on the sidewalk edge and road.
  const tireMat = new THREE.MeshBasicMaterial({ map: tireTexture(), transparent: true, depthWrite: false, opacity: 0.58 });
  for (const [x, rot] of [[6.4, 0.02], [-5.2, -0.025]]) {
    const t = new THREE.Mesh(planeGeo(1.15, 5.0), tireMat);
    t.rotation.x = -Math.PI / 2;
    t.rotation.z = rot;
    t.position.set(x, SNOW_Y + 0.013, 6.5);
    t.renderOrder = 2;
    g.add(t);
  }
  assembly.add(g, { start: 0.68, duration: 0.95, mode: 'fade', land: true, landAt: [0, SNOW_Y, 6.0] });
  return { root, group: g };
}

function mound(parent, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.receiveShadow = true;
  m.castShadow = false;
  parent.add(m);
  return m;
}

function buildSnowCover(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const RNG = rng(9427);
  const put = (x, y, z, sx, sy, sz, mat = R.snowDrift) => mound(g, mat, x, y, z, sx, sy, sz);

  // Deep banks around the front/side display edge. These sit below the street
  // lip and make the whole block feel packed into a thick snowfield.
  for (let i = 0; i < 9; i++) {
    const x = -10.3 + i * 2.58 + (RNG() - 0.5) * 0.55;
    put(x, SNOW_Y + 0.01, 10.75 + RNG() * 0.28, 1.3 + RNG() * 0.9, 0.24 + RNG() * 0.22, 0.62 + RNG() * 0.34);
  }
  for (let i = 0; i < 7; i++) {
    const z = -9.4 + i * 3.2 + (RNG() - 0.5) * 0.5;
    put(-10.85, SNOW_Y + 0.01, z, 0.5 + RNG() * 0.35, 0.22 + RNG() * 0.2, 1.2 + RNG() * 0.8, R.snowShade);
    put(10.85, SNOW_Y + 0.01, z, 0.5 + RNG() * 0.35, 0.22 + RNG() * 0.2, 1.2 + RNG() * 0.8, R.snowShade);
  }

  // A ploughed wall between pavement and road, with a few taller windrows.
  for (let i = 0; i < 9; i++) {
    const x = -9.7 + i * 2.4 + (RNG() - 0.5) * 0.5;
    put(x, SNOW_Y + 0.1, 4.62 + (RNG() - 0.5) * 0.2, 1.15 + RNG() * 0.8, 0.2 + RNG() * 0.18, 0.42 + RNG() * 0.25);
  }
  put(-9.6, SNOW_Y + 0.08, 5.2, 2.4, 0.42, 0.82);
  put(-6.6, SNOW_Y + 0.09, 5.1, 1.7, 0.3, 0.72, R.snowShade);
  put(7.8, SNOW_Y + 0.08, 4.95, 2.1, 0.32, 0.62);

  // Broad snow tongues across the road, leaving the darker ruts readable.
  for (const [x, z, sx, sy, sz] of [
    [-7.9, 6.1, 2.5, 0.14, 1.15],
    [-4.2, 8.8, 2.2, 0.12, 1.25],
    [-1.0, 6.3, 2.5, 0.11, 0.9],
    [2.6, 9.15, 2.2, 0.13, 1.0],
    [5.0, 8.8, 1.8, 0.1, 0.85, R.snowShade],
    [-8.0, 9.2, 1.9, 0.17, 1.0],
    [8.9, 7.8, 1.9, 0.13, 1.1],
    [-2.6, 7.35, 2.1, 0.09, 0.65, R.snowShade],
  ]) put(x, SNOW_Y + 0.015, z, sx, sy, sz);

  // Deep snow along the post-office frontage, with the stone path left clear.
  for (const [x, z, sx, sy, sz] of [
    [-4.55, 2.35, 0.7, 0.26, 0.5], [-3.8, 2.2, 0.55, 0.2, 0.38],
    [0.15, 2.2, 0.7, 0.22, 0.4], [1.2, 2.12, 0.65, 0.18, 0.34],
    [2.55, 2.18, 0.8, 0.24, 0.44], [3.75, 2.28, 0.9, 0.26, 0.55],
    [-4.35, 3.5, 0.55, 0.28, 0.42], [4.1, 3.1, 0.6, 0.24, 0.5],
    [0.35, 4.2, 0.72, 0.18, 0.4], [3.25, 4.1, 0.7, 0.2, 0.45],
  ]) put(x, SNOW_Y + 0.11, z, sx, sy, sz);

  // Snow heaped around the postbox and the parked car.
  for (const [x, z, sx, sy, sz] of [
    [-3.7, 3.62, 0.62, 0.24, 0.38], [-4.18, 3.15, 0.4, 0.2, 0.42],
    [-3.2, 3.18, 0.44, 0.18, 0.36],
  ]) put(x, SNOW_Y + 0.115, z, sx, sy, sz, R.snowShade);
  for (const x of [5.95, 7.85]) {
    for (const z of [5.98, 7.4]) put(x, SNOW_Y + 0.015, z, 0.52, 0.18, 0.48);
  }
  put(6.9, SNOW_Y + 0.02, 7.78, 1.45, 0.23, 0.48);
  put(6.0, SNOW_Y + 0.02, 6.65, 0.42, 0.2, 0.68, R.snowShade);

  // Small drifts at tree and pole bases, and against the neighbours' garden walls.
  for (const [x, z] of [[-9.0, 0.6], [8.8, 1.4]]) put(x, SNOW_Y + 0.04, z, 0.78, 0.28, 0.72, R.snowShade);
  for (const p of POLES) put(p.x, SNOW_Y + 0.03, p.z, 0.58, 0.24, 0.58);
  for (let i = 0; i < 5; i++) {
    const x = -10.0 + i * 0.9;
    put(x, SNOW_Y + 0.02, 0.52 + (RNG() - 0.5) * 0.25, 0.65, 0.22 + RNG() * 0.08, 0.42, R.snowShade);
  }
  for (let i = 0; i < 5; i++) {
    const x = 6.2 + i * 0.9;
    put(x, SNOW_Y + 0.02, 0.2 + (RNG() - 0.5) * 0.2, 0.65, 0.22 + RNG() * 0.08, 0.4);
  }

  assembly.add(g, { start: 1.08, duration: 1.0, mode: 'fade' });
  return root;
}

function buildSnowBanks(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const RNG = rng(8251);
  // Long, low ploughed banks give the road a continuous edge; the extra lobes
  // break the silhouette so it does not read as a row of identical pebbles.
  g.add(meshRounded(21.2, 0.13, 0.38, 0.1, R.snowDrift, 0, SNOW_Y + 0.07, STREET.sidewalkZ1 - 0.08, {
    cast: false, receive: true, roundSeg: 3,
  }));
  g.add(meshRounded(21.2, 0.12, 0.32, 0.09, R.snowDrift, 0, SNOW_Y + 0.06, STREET.roadZ1 - 0.1, {
    cast: false, receive: true, roundSeg: 3,
  }));
  for (let i = 0; i < 6; i++) {
    const x = -9.6 + i * 3.8 + (RNG() - 0.5) * 1.0;
    const z = STREET.sidewalkZ1 - 0.06 + (RNG() - 0.5) * 0.25;
    snowLobe(g, R, x, z, 1.3 + RNG() * 0.9, 0.13 + RNG() * 0.12, 0.32 + RNG() * 0.18);
  }
  // Front road edge, heavier ploughed piles.
  for (let i = 0; i < 6; i++) {
    const x = -10.0 + i * 4.0 + (RNG() - 0.5) * 1.2;
    const z = STREET.roadZ1 - 0.2 + (RNG() - 0.5) * 0.45;
    snowLobe(g, R, x, z, 1.5 + RNG() * 1.0, 0.18 + RNG() * 0.2, 0.42 + RNG() * 0.28);
  }
  // Snow around the base edges and building foundation.
  for (let i = 0; i < 18; i++) {
    const x = -10.4 + i * 1.25 + (RNG() - 0.5) * 0.3;
    snowLobe(g, R, x, -10.9 + RNG() * 0.3, 0.7 + RNG() * 0.5, 0.14 + RNG() * 0.11, 0.4 + RNG() * 0.2);
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    const x = Math.cos(a) * 5.2 - 0.2;
    const z = Math.sin(a) * 3.9 - 1.4;
    if (z > STREET.sidewalkZ0 - 0.5) continue;
    snowLobe(g, R, x, z, 0.42 + RNG() * 0.36, 0.09 + RNG() * 0.09, 0.32 + RNG() * 0.3);
  }
  // A few small dirty slush piles at the road edge.
  for (let i = 0; i < 8; i++) {
    const x = -9.6 + RNG() * 19.2;
    const z = STREET.sidewalkZ1 + 0.15 + RNG() * 0.5;
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 5, 0, TAU, 0, Math.PI / 2), R.snowShade);
    m.position.set(x, SNOW_Y + 0.02, z);
    m.scale.set(0.35 + RNG() * 0.4, 0.07 + RNG() * 0.06, 0.18 + RNG() * 0.25);
    g.add(m);
  }
  assembly.add(g, { start: 1.0, duration: 0.8, mode: 'fade' });
  return root;
}

function buildSnowField(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);

  const X0 = -11.28;
  const X1 = 11.28;
  const Z0 = 1.32;
  const Z1 = 11.38;
  const NX = 112;
  const NZ = 76;
  const S = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const G = (v, s) => Math.exp(-(v * v) / (2 * s * s));
  const positions = [];
  const uvs = [];
  const colors = [];
  const indices = [];

  for (let j = 0; j <= NZ; j++) {
    const v = j / NZ;
    const z = Z0 + (Z1 - Z0) * v;
    for (let i = 0; i <= NX; i++) {
      const u = i / NX;
      const x = X0 + (X1 - X0) * u;
      const onWalk = 1 - S(4.3, 5.08, z);
      let h = 0.135 + 0.075 * onWalk;
      // Snow piled against the building and toward the outside of the block.
      h += 0.1 * (1 - S(1.32, 2.55, z));
      h += 0.32 * S(9.2, 10.9, z);
      h += 0.2 * S(9.65, 11.0, Math.abs(x));
      // Soft wind ripples and tiny terrain undulations.
      h += 0.02 * Math.sin(x * 0.64 + z * 0.93);
      h += 0.014 * Math.sin(x * 1.7 - z * 0.72);
      h += 0.01 * Math.sin(x * 0.27 + z * 1.9);
      h += 0.018 * (0.5 + 0.5 * Math.sin(x * 0.82 + z * 1.45 + 0.8));
      // A low bank along the buried kerb.
      h += 0.15 * G(z - 4.9, 0.24);
      // A soft crest just inside the display edge.
      h += 0.2 * G(z - 10.15, 0.8);
      h += 0.16 * G(Math.abs(x) - 10.35, 0.55);
      // Drifts piling against the post office frontage.
      h += 0.065 * G(z - 2.15, 0.35);
      // Big, soft wind drifts across the open street.
      h += 0.12 * G(x + 7.5, 2.5) * G(z - 7.2, 1.1);
      h += 0.09 * G(x - 1.5, 2.2) * G(z - 8.9, 1.0);
      h += 0.1 * G(x + 9.2, 1.8) * G(z - 6.8, 1.2);
      h += 0.09 * G(x - 9.4, 2.0) * G(z - 8.8, 1.2);
      h += 0.11 * G(x + 8.8, 2.2) * G(z - 9.7, 1.2);
      h += 0.09 * G(x - 8.8, 2.0) * G(z - 9.6, 1.1);
      // Postbox: the lower third disappears into a wind-packed mound.
      h += 0.24 * G(x + 3.7, 0.72) * G(z - 3.15, 0.55);
      h += 0.08 * G(x + 3.7, 0.95) * G(z - 3.8, 0.46);
      // The car nestles into the roadside snow.
      h += 0.1 * G(x - 6.9, 1.5) * G(z - 6.7, 1.1);
      h += 0.07 * G(x - 6.9, 1.8) * G(z - 7.7, 0.4);
      for (const wx of [5.95, 7.85]) {
        for (const wz of [5.98, 7.4]) {
          h += 0.065 * G(x - wx, 0.42) * G(z - wz, 0.34);
        }
      }
      // Pole bases get a small collar of snow.
      for (const p of POLES) {
        if (p.z > 1.3 && p.z < 11.3) h += 0.09 * G(x - p.x, 0.38) * G(z - p.z, 0.38);
      }
      // The shovelled entrance path stays low enough for the wet stone to read.
      const path = S(-2.95, -2.5, x) * (1 - S(-0.9, -0.45, x)) *
        S(1.5, 1.95, z) * (1 - S(4.95, 5.38, z));
      h = h * (1 - path) + 0.065 * path;
      // Ridged edges where the path was cleared.
      const pathRidge = S(1.75, 2.15, z) * (1 - S(4.8, 5.25, z));
      h += 0.14 * pathRidge * (G(x + 2.95, 0.21) + G(x + 0.55, 0.21));
      // Fail-safe taper at the display edges so the slab meets the base snow.
      h *= 0.3 + 0.7 * (1 - S(11.0, 11.45, z));
      h *= 0.3 + 0.7 * (1 - S(11.0, 11.45, Math.abs(x)));
      h = Math.max(0.035, h);

      // Grey compacted tyre channels and a faint slush line down the road.
      const rutA = Math.exp(-Math.pow((z - 6.03) / 0.23, 2));
      const rutB = Math.exp(-Math.pow((z - 7.37) / 0.23, 2));
      const tread = 0.92 + 0.08 * Math.sin(x * 5.5);
      const rut = Math.min(1, (rutA + rutB) * tread);
      const slush = Math.exp(-Math.pow((z - 6.7) / 1.7, 2)) * 0.045;
      const dark = rut * 0.24 + slush;
      const shade = 1 - dark;
      const grain = 0.012 * Math.sin(x * 9.0 + z * 11.0) + 0.008 * Math.sin(x * 17.0 - z * 6.0);
      colors.push(0.96 * shade + 0.03 + grain, 0.98 * shade + 0.02 + grain, 1.0 * shade + grain);

      positions.push(x, SNOW_Y + h, z);
      uvs.push(u * 6, v * 3.2);
    }
  }
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i;
      const b = a + 1;
      const c = a + NX + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const fieldMat = R.snow.clone();
  fieldMat.vertexColors = true;
  fieldMat.color.setRGB(1.09, 1.11, 1.13);
  fieldMat.bumpMap = fieldMat.map;
  fieldMat.bumpScale = 0.065;
  fieldMat.needsUpdate = true;
  const surface = new THREE.Mesh(geo, fieldMat);
  surface.receiveShadow = true;
  surface.castShadow = false;
  g.add(surface);
  assembly.add(g, { start: 1.0, duration: 1.05, mode: 'fade' });
  return root;
}

function buildSnowDrifts(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const RNG = rng(6619);
  const put = (x, z, sx, sy, sz, mat) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), mat);
    m.position.set(x, SNOW_Y - 0.005, z);
    m.scale.set(sx, sy, sz);
    m.receiveShadow = true;
    g.add(m);
  };
  // Back rim and side rims of the display, away from the street field.
  for (let i = 0; i < 11; i++) {
    const x = -10.4 + i * 2.08 + (RNG() - 0.5) * 0.4;
    put(x, -10.9 + (RNG() - 0.5) * 0.25, 0.9 + RNG() * 0.7, 0.22 + RNG() * 0.2, 0.55 + RNG() * 0.25, R.snowDrift);
  }
  for (let i = 0; i < 6; i++) {
    const z = -9.6 + i * 2.25;
    put(-10.85, z, 0.48 + RNG() * 0.25, 0.23 + RNG() * 0.15, 1.0 + RNG() * 0.5, R.snowShade);
    put(10.85, z, 0.48 + RNG() * 0.25, 0.23 + RNG() * 0.15, 1.0 + RNG() * 0.5, R.snowShade);
  }
  // Deep windrows against the neighbours' garden walls and front doors.
  for (const [x, z, sx, sy, sz] of [
    [-9.7, 0.58, 1.25, 0.3, 0.58],
    [-8.2, 0.68, 1.15, 0.26, 0.55],
    [-6.75, 0.5, 0.95, 0.24, 0.5],
    [6.55, 0.18, 1.0, 0.25, 0.52],
    [8.1, 0.28, 1.2, 0.3, 0.56],
    [9.6, 0.12, 1.0, 0.24, 0.5],
  ]) put(x, z, sx, sy, sz, R.snowDrift);
  // Tree feet and corner heaps.
  put(-9.0, 0.6, 0.85, 0.27, 0.72, R.snowShade);
  put(8.8, 1.4, 0.8, 0.25, 0.68, R.snowShade);
  put(-10.4, 10.85, 1.2, 0.32, 0.9, R.snowDrift);
  put(10.4, 10.8, 1.1, 0.3, 0.85, R.snowDrift);
  assembly.add(g, { start: 1.12, duration: 0.95, mode: 'fade' });
  return root;
}

export function buildBase(scene, assets, R, assembly) {
  const plinth = buildPlinth(scene, assets, R, assembly);
  const terrain = buildTerrain(scene, R, assembly);
  const street = buildStreet(scene, R, assembly);
  const snowfield = buildSnowField(scene, R, assembly);
  const drifts = buildSnowDrifts(scene, R, assembly);
  return { plinth, terrain, street, snowfield, drifts };
}
