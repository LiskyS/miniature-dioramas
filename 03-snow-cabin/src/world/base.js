import * as THREE from 'three';
import { BASE_SIZE, SNOW_HALF, SNOW_Y, PLINTH_H, CABIN, CREEK } from '../config.js';
import {
  addContactShadow,
  canvasTexture,
  makeGroup,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  roundedBoxGeo,
  rng,
  easeOutCubic,
  TAU,
} from '../core/utils.js';

function snowRibbonGeometry(points, y, extraWidth = 0) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p.x, y, p.z)), false, 'catmullrom', 0.45);
  const samples = 54;
  const positions = [];
  const uvs = [];
  const indices = [];
  const widths = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const idx = Math.min(CREEK.length - 1, Math.round(t * (CREEK.length - 1)));
    const wRaw = CREEK[Math.max(0, Math.min(CREEK.length - 1, Math.round(t * (CREEK.length - 1))))].w;
    const w = (wRaw + extraWidth) * 0.5;
    // gentle shoreline waviness
    const wobble = 0.08 * Math.sin(t * 30 + 1.4);
    widths.push(w);
    const l = p.clone().addScaledVector(normal, -w - wobble);
    const r = p.clone().addScaledVector(normal, w + wobble);
    positions.push(l.x, l.y, l.z, r.x, r.y, r.z);
    uvs.push(0, t * 4.2, 1, t * 4.2);
    if (i < samples - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function addStonePath(root, R) {
  const group = new THREE.Group();
  root.add(group);
  const points = [
    new THREE.Vector3(-2.55, SNOW_Y + 0.02, 2.9),
    new THREE.Vector3(-2.15, SNOW_Y + 0.02, 4.3),
    new THREE.Vector3(-1.35, SNOW_Y + 0.02, 5.9),
    new THREE.Vector3(-1.25, SNOW_Y + 0.02, 7.3),
    new THREE.Vector3(-0.5, SNOW_Y + 0.02, 9.2),
    new THREE.Vector3(0.1, SNOW_Y + 0.02, 10.8),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  // A packed-snow trail underneath the stones makes the path read as a route
  // through the diorama, not a row of disconnected white pebbles.
  const samples = 42;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t).normalize();
    const n = new THREE.Vector3(-tan.z, 0, tan.x);
    const w = (0.78 + Math.sin(t * 5.2) * 0.13 + Math.sin(t * 12.0) * 0.07);
    const l = p.clone().addScaledVector(n, -w);
    const r = p.clone().addScaledVector(n, w);
    positions.push(l.x, SNOW_Y + 0.012, l.z, r.x, SNOW_Y + 0.012, r.z);
    uvs.push(0, t * 4.5, 1, t * 4.5);
    if (i < samples - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  trailGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  trailGeo.setIndex(indices);
  trailGeo.computeVertexNormals();
  const trailMat = new THREE.MeshToonMaterial({
    color: '#c9dbe7',
    gradientMap: R.snow.gradientMap,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const trail = new THREE.Mesh(trailGeo, trailMat);
  trail.receiveShadow = true;
  trail.renderOrder = 2;
  group.add(trail);

  const count = 9;
  for (let i = 0; i < count; i++) {
    const t = 0.06 + i * 0.105;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    const w = 0.68 + Math.sin(i * 2.1) * 0.17;
    const d = 0.4 + (i % 3) * 0.08;
    const paver = meshRounded(w, 0.045, d, 0.022, R.pathStone, p.x, SNOW_Y + 0.042, p.z, { cast: false, receive: true, roundSeg: 2 });
    paver.rotation.y = Math.atan2(tan.x, tan.z) + (i % 2 ? 0.18 : -0.13);
    paver.rotation.z = (i % 3 - 1) * 0.022;
    group.add(paver);
    if (i % 3 !== 1) {
      const cap = meshRounded(w * 0.53, 0.025, d * 0.44, 0.022, R.snowPlain,
        p.x + Math.sin(i) * 0.16, SNOW_Y + 0.071, p.z - 0.1, { cast: false, receive: true });
      cap.rotation.y = paver.rotation.y + 0.2;
      group.add(cap);
    }
  }
  // A few round footing stones half-buried in snow.
  for (let i = 0; i < 5; i++) {
    const t = 0.15 + i * 0.18;
    const p = curve.getPoint(t);
    const stone = meshCyl(0.16 + i * 0.02, 0.2, 0.07, R.pathStone, p.x + 0.72, SNOW_Y + 0.02, p.z + 0.27, 8);
    group.add(stone);
    const cap = meshCyl(0.11, 0.13, 0.025, R.snowPlain, p.x + 0.72, SNOW_Y + 0.055, p.z + 0.27, 8);
    group.add(cap);
  }
  // Paw / bird tracks along the path edges.
  const trackTex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(105,134,159,.42)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, 16, 23, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w / 2 - 19, h / 2 - 20, 6, 12, 0.5, 0, Math.PI * 2);
    ctx.ellipse(w / 2 + 5, h / 2 - 23, 6, 12, 0.2, 0, Math.PI * 2);
    ctx.ellipse(w / 2 - 29, h / 2 - 5, 5, 9, 0.9, 0, Math.PI * 2);
    ctx.fill();
  });
  const trackMat = new THREE.MeshBasicMaterial({ map: trackTex, transparent: true, depthWrite: false, opacity: 0.62 });
  for (let i = 0; i < 12; i++) {
    const t = 0.15 + i * 0.062;
    const p = curve.getPoint(t);
    const m = new THREE.Mesh(planeGeo(0.18, 0.25), trackMat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = 0.4 + i * 0.35;
    m.position.set(p.x + (i % 2 ? -0.55 : -0.73) + Math.sin(i * 1.4) * 0.12, SNOW_Y + 0.055, p.z + 0.18);
    m.renderOrder = 2;
    group.add(m);
  }
  return group;
}

function addIceCreek(root, R) {
  const group = new THREE.Group();
  root.add(group);
  const bankGeo = snowRibbonGeometry(CREEK, SNOW_Y + 0.011, 1.55);
  const bank = new THREE.Mesh(bankGeo, R.snowPlain);
  bank.receiveShadow = true;
  group.add(bank);
  const edgeGeo = snowRibbonGeometry(CREEK, SNOW_Y + 0.026, 0.2);
  const edge = new THREE.Mesh(edgeGeo, R.iceDeep);
  edge.receiveShadow = true;
  group.add(edge);
  const iceGeo = snowRibbonGeometry(CREEK, SNOW_Y + 0.036, 0);
  const ice = new THREE.Mesh(iceGeo, R.ice);
  ice.receiveShadow = true;
  group.add(ice);
  // Raised ice ridges and cloudy snowbanks along both shores.
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const idx = Math.min(CREEK.length - 1, Math.round(t * (CREEK.length - 1)));
    const p = CREEK[idx];
    const bankX = p.x + (i % 2 ? 1.38 : -1.38);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), R.snowDrift);
    mound.position.set(bankX, SNOW_Y + 0.015, p.z + (i % 3 - 1) * 0.18);
    mound.scale.set(0.56, 0.14, 0.38);
    mound.receiveShadow = true;
    group.add(mound);
    if (i % 2 === 0) {
      const ridge = meshRounded(0.32 + (i % 3) * 0.12, 0.12, 0.23, 0.03,
        R.iceEdge, p.x + (i % 2 ? 1.0 : -1.0), SNOW_Y + 0.07, p.z + 0.2, { cast: false });
      ridge.rotation.y = i * 0.5;
      group.add(ridge);
    }
  }
  // A few thin ice plates and snow patches riding the frozen surface.
  for (let i = 0; i < 10; i++) {
    const t = 0.1 + i * 0.085;
    const p = CREEK[Math.min(CREEK.length - 1, Math.round(t * (CREEK.length - 1)))];
    const m = meshRounded(0.24 + Math.random() * 0.45, 0.028, 0.15 + Math.random() * 0.26, 0.02, R.iceEdge,
      p.x + (Math.random() - 0.5) * p.w * 0.75, SNOW_Y + 0.058, p.z + (Math.random() - 0.5) * 0.7, { cast: false });
    m.rotation.y = Math.random() * Math.PI;
    group.add(m);
  }
  // A cool reflected sheen stripe down the ice.
  const glint = new THREE.Mesh(planeGeo(1.0, 6.6), new THREE.MeshBasicMaterial({
    color: 0x9fcfe0,
    transparent: true,
    opacity: 0.13,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  glint.rotation.x = -Math.PI / 2;
  glint.position.set(7.3, SNOW_Y + 0.059, 4.2);
  glint.rotation.z = 0.16;
  group.add(glint);
  return group;
}

function addSnowDrifts(root, R) {
  const group = new THREE.Group();
  const RNG = rng(9011);
  // Perimeter drifts and broad mounds.
  const drifts = [
    [-10.0, -8.6, 2.1, 0.35, 1.1], [-4.0, -10.2, 2.6, 0.28, 1.0],
    [3.2, -10.3, 2.4, 0.32, 1.2], [9.8, -7.6, 1.8, 0.3, 1.0],
    [10.2, 7.0, 1.8, 0.45, 1.4], [4.0, 9.6, 1.5, 0.26, 0.85],
    [-5.0, 9.8, 2.2, 0.3, 1.0], [-10.1, 6.1, 2.0, 0.42, 1.1],
    [-9.9, 1.2, 1.7, 0.24, 0.8], [9.8, -1.8, 1.6, 0.3, 0.8],
    [-3.8, 5.0, 1.6, 0.22, 0.9], [2.0, 5.9, 1.3, 0.18, 0.55],
  ];
  for (const [x, z, r, h, rz] of drifts) {
    const geo = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const m = new THREE.Mesh(geo, R.snowDrift);
    m.position.set(x, SNOW_Y - 0.04, z);
    m.scale.set(r, h, rz);
    m.receiveShadow = true;
    m.castShadow = false;
    group.add(m);
    // soft secondary lobes
    for (let i = 0; i < 2; i++) {
      const s = new THREE.Mesh(geo, R.snowDrift);
      s.position.set(x + (RNG() - 0.5) * r * 1.5, SNOW_Y - 0.02, z + (RNG() - 0.5) * rz * 1.6);
      s.scale.set(r * (0.28 + RNG() * 0.3), h * (0.45 + RNG() * 0.25), rz * (0.25 + RNG() * 0.35));
      group.add(s);
    }
  }
  // Small snow caps around the cabin's stone footing.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const x = Math.cos(a) * (CABIN.x1 - CABIN.x0) * 0.57 - 0.5;
    const z = Math.sin(a) * 3.4 - 1.7;
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), R.snowDrift);
    lobe.position.set(x, SNOW_Y - 0.02, z);
    lobe.scale.set(0.38 + RNG() * 0.35, 0.12 + RNG() * 0.1, 0.3 + RNG() * 0.4);
    lobe.receiveShadow = true;
    group.add(lobe);
  }
  // Footprints leading to the porch.
  const printTex = canvasTexture(128, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120,151,176,.35)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.55, 18, 35, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  const printMat = new THREE.MeshBasicMaterial({ map: printTex, transparent: true, depthWrite: false, opacity: 0.45 });
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(planeGeo(0.22, 0.3), printMat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = (i % 2 ? -0.2 : 0.2);
    m.position.set(-2.1 + Math.sin(i * 0.8) * 0.2 + (i % 2 ? 0.22 : -0.22), SNOW_Y + 0.045, 3.2 + i * 0.67);
    group.add(m);
  }
  // Soft contact shadows under the drifts.
  addContactShadow(group, 7.5, 3.2, -0.6, 0.8, SNOW_Y + 0.005, 0.18, 0);
  return group;
}

export function buildBase(scene, assets, R, assembly) {
  const root = new THREE.Group();
  root.name = 'snow-base';

  const plinthGroup = new THREE.Group();
  const plinth = meshRounded(BASE_SIZE, PLINTH_H, BASE_SIZE, 0.14, R.plinth, 0, -PLINTH_H / 2, 0, {
    cast: false,
    receive: false,
    roundSeg: 3,
  });
  plinthGroup.add(plinth);
  // Brass inlays around the base side.
  for (const [x, z, w, d] of [
    [0, BASE_SIZE / 2 + 0.005, BASE_SIZE + 0.02, 0.025],
    [0, -BASE_SIZE / 2 - 0.005, BASE_SIZE + 0.02, 0.025],
    [BASE_SIZE / 2 + 0.005, 0, 0.025, BASE_SIZE + 0.02],
    [-BASE_SIZE / 2 - 0.005, 0, 0.025, BASE_SIZE + 0.02],
  ]) {
    const strip = meshBox(w, 0.035, d, R.brass, x, -0.3, z);
    plinthGroup.add(strip);
  }
  // Outer snow lip / dark rim.
  const rim = meshRounded(BASE_SIZE - 0.5, 0.12, BASE_SIZE - 0.5, 0.05, R.plinthDark, 0, 0.02, 0, {
    cast: false,
    receive: false,
  });
  plinthGroup.add(rim);
  // Metal name plaque.
  const plaqueBack = meshRounded(4.5, 1.22, 0.08, 0.04, R.brass, 0, -0.73, BASE_SIZE / 2 + 0.01, {
    cast: false,
    receive: false,
  });
  plinthGroup.add(plaqueBack);
  const plaque = new THREE.Mesh(planeGeo(4.28, 1.02), new THREE.MeshBasicMaterial({
    map: assets.plaque,
    toneMapped: false,
  }));
  plaque.position.set(0, -0.73, BASE_SIZE / 2 + 0.06);
  plinthGroup.add(plaque);
  for (const x of [-2.0, 2.0]) {
    const screw = meshCyl(0.03, 0.03, 0.03, R.brass, x, -0.73, BASE_SIZE / 2 + 0.08, 12);
    screw.rotation.x = Math.PI / 2;
    plinthGroup.add(screw);
  }
  assembly.add(plinthGroup, {
    start: 0,
    duration: 1.35,
    mode: 'rise',
    distance: 3.0,
    land: true,
    landAt: [0, 0.45, 0],
  });
  root.add(plinthGroup);

  // Soft glow under the display plinth.
  const underglow = new THREE.Mesh(planeGeo(34, 34), new THREE.MeshBasicMaterial({
    map: assets.glow,
    color: 0x4f7e98,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }));
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = -PLINTH_H - 0.4;
  root.add(underglow);

  // Snow-covered top slab.
  const terrain = new THREE.Group();
  root.add(terrain);
  const snowSlab = meshRounded(SNOW_HALF * 2 + 0.2, 0.34, SNOW_HALF * 2 + 0.2, 0.12, R.snowShade,
    0, 0.14, 0, { cast: false, receive: true, roundSeg: 3 });
  terrain.add(snowSlab);
  const snowTop = new THREE.Mesh(planeGeo(SNOW_HALF * 2, SNOW_HALF * 2), R.snow);
  snowTop.rotation.x = -Math.PI / 2;
  snowTop.position.y = SNOW_Y;
  snowTop.receiveShadow = true;
  terrain.add(snowTop);
  assembly.add(terrain, { start: 0.55, duration: 1.1, mode: 'fade', land: false });

  const drifts = addSnowDrifts(root, R);
  assembly.add(drifts, { start: 0.8, duration: 0.9, mode: 'fade' });

  const path = addStonePath(root, R);
  assembly.add(path, { start: 1.15, duration: 0.9, mode: 'fade', land: true, landAt: [-1.5, SNOW_Y, 6.8] });

  const creek = addIceCreek(root, R);
  assembly.add(creek, { start: 1.0, duration: 1.0, mode: 'fade' });

  // Stone steps are built as part of the cabin's porch group.

  scene.add(root);

  return {
    root,
    underglow,
    update(time) {
      underglow.material.opacity = 0.045 + 0.045 * Math.min(1, time / 2.0);
    },
  };
}
