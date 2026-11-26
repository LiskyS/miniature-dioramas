import * as THREE from 'three';
import {
  BASE_SIZE,
  CITY_HALF,
  ROAD_Y,
  SIDEWALK_Y,
  STORE,
  LAYOUT,
  PUDDLES,
} from '../config.js';
import {
  addContactShadow,
  canvasTexture,
  labelPlane,
  makeGroup,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  rng,
  roundedBoxGeo,
  boxGeo,
  easeOutCubic,
} from '../core/utils.js';
import { createWetStreet, createRippleField } from '../effects/wetGround.js';
import { TIMES } from '../config.js';

function makeGrateTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2a3235';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#151b1e';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(16, 18 + i * 40, w - 32, 19);
    }
    ctx.strokeStyle = 'rgba(160,176,176,.25)';
    ctx.lineWidth = 5;
    ctx.strokeRect(7, 7, w - 14, h - 14);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = 'rgba(195,205,200,.035)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
}

function makeManholeTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = '#3b4548';
    ctx.beginPath();
    ctx.arc(0, 0, 244, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(154,165,159,.5)';
    for (let r = 70; r < 235; r += 28) {
      ctx.lineWidth = r % 56 === 0 ? 6 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(31,39,40,.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 80, Math.sin(a) * 80);
      ctx.lineTo(Math.cos(a) * 200, Math.sin(a) * 200);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(180,191,184,.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,154,148,.35)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 240, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function makeLandShape() {
  const H = CITY_HALF;
  const ez = 3.2;
  const ex = 4.2;
  const rad = 1.12;
  const cx = ex - rad;
  const cz = ez - rad;
  const shape = new THREE.Shape();
  shape.moveTo(-H, -ez);
  shape.lineTo(cx, -ez);
  shape.absarc(cx, -cz, rad, Math.PI / 2, 0, true);
  shape.lineTo(ex, H);
  shape.lineTo(-H, H);
  shape.closePath();
  return shape;
}

function shapeTopGeometry(shape) {
  const geo = new THREE.ShapeGeometry(shape, 28);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + 5.7) / 4.7;
    uv[i * 2 + 1] = (pos.getZ(i) + 5.7) / 4.7;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

function createCurbInstances(R) {
  const H = CITY_HALF;
  const stones = [];
  const add = (x, z, rotY, len = 0.82) => stones.push({ x, z, rotY, len });
  for (let x = -H + 0.3; x < 3.02; x += 0.82) add(x, 3.2, 0);
  const cx = 3.08;
  const cz = 2.08;
  const rad = 1.12;
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    const x = cx + Math.cos(a) * rad;
    const z = cz + Math.sin(a) * rad;
    const tx = -Math.sin(a);
    const tz = Math.cos(a);
    add(x, z, Math.atan2(-tz, tx), 0.44);
  }
  for (let z = 2.0; z > -H + 0.3; z -= 0.82) add(4.2, z, Math.PI / 2);

  const group = new THREE.Group();
  const baseGeo = roundedBoxGeo(0.82, 0.23, 0.19, 0.025, 2);
  const topGeo = roundedBoxGeo(0.8, 0.035, 0.17, 0.012, 2);
  const baseMesh = new THREE.InstancedMesh(baseGeo, R.curb, stones.length);
  const topMesh = new THREE.InstancedMesh(topGeo, R.curbEdge, stones.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  stones.forEach((st, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), st.rotY);
    p.set(st.x, 0.155, st.z);
    s.set(st.len / 0.82, 1, 1);
    m.compose(p, q, s);
    baseMesh.setMatrixAt(i, m);
    p.y = 0.283;
    m.compose(p, q, s);
    topMesh.setMatrixAt(i, m);
  });
  baseMesh.instanceMatrix.needsUpdate = true;
  topMesh.instanceMatrix.needsUpdate = true;
  baseMesh.receiveShadow = true;
  topMesh.receiveShadow = true;
  baseMesh.castShadow = false;
  topMesh.castShadow = false;
  group.add(baseMesh, topMesh);
  return group;
}

function createTactilePath(R) {
  const group = new THREE.Group();
  const geo = roundedBoxGeo(0.34, 0.028, 0.34, 0.02, 1);
  const points = [];
  for (let x = -10.9; x < 0.8; x += 0.45) points.push({ x, z: 2.53, r: 0 });
  for (let x = 0.8; x < 3.52; x += 0.45) points.push({ x, z: 2.53 - (x - 0.8) * 0.55, r: -0.35 });
  for (let z = 1.55; z > -6.9; z -= 0.45) points.push({ x: 3.62, z, r: Math.PI / 2 });
  const inst = new THREE.InstancedMesh(geo, R.tactile, points.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  points.forEach((pt, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), pt.r);
    m.compose(new THREE.Vector3(pt.x, SIDEWALK_Y + 0.018, pt.z), q, new THREE.Vector3(1, 1, 1));
    inst.setMatrixAt(i, m);
  });
  inst.instanceMatrix.needsUpdate = true;
  inst.receiveShadow = true;
  group.add(inst);
  // A tactile warning block at the crossing.
  const warn = new THREE.InstancedMesh(
    roundedBoxGeo(0.42, 0.03, 0.42, 0.02, 1),
    R.tactile,
    4
  );
  for (let i = 0; i < 4; i++) {
    m.compose(
      new THREE.Vector3(1.35 + i * 0.5, SIDEWALK_Y + 0.022, 2.94),
      new THREE.Quaternion(),
      new THREE.Vector3(1, 1, 1)
    );
    warn.setMatrixAt(i, m);
  }
  warn.instanceMatrix.needsUpdate = true;
  group.add(warn);
  return group;
}

function createGutter(R) {
  const group = new THREE.Group();
  const grateTex = makeGrateTexture();
  const grateMat = new THREE.MeshStandardMaterial({
    map: grateTex,
    roughness: 0.34,
    metalness: 0.74,
  });
  // A dark continuous channel just outside the curb.
  const front = meshBox(15.7, 0.012, 0.34, R.drain, -3.75, ROAD_Y + 0.002, 3.48);
  const east = meshBox(0.34, 0.012, 14.8, R.drain, 4.48, ROAD_Y + 0.002, -4.8);
  group.add(front, east);
  const grateGeo = planeGeo(0.82, 0.4);
  for (let i = 0; i < 5; i++) {
    const gm = new THREE.Mesh(grateGeo, grateMat);
    gm.rotation.x = -Math.PI / 2;
    gm.rotation.z = Math.PI / 2;
    gm.position.set(-9.4 + i * 3.25, ROAD_Y + 0.014, 3.48);
    gm.receiveShadow = true;
    group.add(gm);
  }
  for (let i = 0; i < 4; i++) {
    const gm = new THREE.Mesh(grateGeo, grateMat);
    gm.rotation.x = -Math.PI / 2;
    gm.position.set(4.48, ROAD_Y + 0.014, 0.4 - i * 3.1);
    gm.receiveShadow = true;
    group.add(gm);
  }
  return group;
}

function createRoadMarkings(R) {
  const group = new THREE.Group();
  const y = ROAD_Y + 0.015;
  // The zebra runs toward the viewer from the corner sidewalk.
  const stripeGeo = roundedBoxGeo(2.75, 0.016, 0.33, 0.035, 2);
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(stripeGeo, R.paintWhite);
    m.position.set(2.7, y + (i === 0 ? 0.0005 : 0), 3.55 + i * 0.77);
    m.receiveShadow = true;
    group.add(m);
  }
  // A soft stop bar and edge line.
  const stop = new THREE.Mesh(roundedBoxGeo(3.1, 0.014, 0.13, 0.02, 2), R.paintWhite);
  stop.position.set(2.7, y, 10.2);
  group.add(stop);
  const edgeLine = new THREE.Mesh(roundedBoxGeo(0.1, 0.014, 7.2, 0.02, 2), R.paintWhite);
  edgeLine.position.set(-10.9, y, 6.7);
  group.add(edgeLine);
  // Broken centre line, interrupted by the zebra.
  for (let i = 0; i < 6; i++) {
    const dash = new THREE.Mesh(roundedBoxGeo(0.85, 0.014, 0.11, 0.02, 2), R.paintWhite);
    dash.position.set(-9.9 + i * 1.5, y, 6.6);
    group.add(dash);
  }
  for (let i = 0; i < 3; i++) {
    const dash = new THREE.Mesh(roundedBoxGeo(0.85, 0.014, 0.11, 0.02, 2), R.paintWhite);
    dash.position.set(6.2 + i * 1.55, y, 6.6);
    group.add(dash);
  }
  // Side street centre dashes.
  for (let i = 0; i < 4; i++) {
    const dash = new THREE.Mesh(roundedBoxGeo(0.11, 0.014, 0.8, 0.02, 2), R.paintWhite);
    dash.position.set(6.7, y, 10.25 - i * 1.5);
    group.add(dash);
  }
  // Parking bay beside the store.
  const bay = new THREE.Group();
  const lineH = new THREE.Mesh(roundedBoxGeo(1.75, 0.015, 0.08, 0.015, 2), R.paintWhite);
  lineH.position.set(5.35, y, -5.95);
  const lineH2 = lineH.clone();
  lineH2.position.z = -2.5;
  const lineV = new THREE.Mesh(roundedBoxGeo(0.08, 0.015, 3.5, 0.015, 2), R.paintWhite);
  lineV.position.set(6.2, y, -4.225);
  bay.add(lineH, lineH2, lineV);
  group.add(bay);
  const pDecal = labelPlane(1.15, 1.15, R.roadP.map, {
    transparent: true,
    opacity: 0.82,
    rotation: [-Math.PI / 2, 0, 0],
    position: new THREE.Vector3(5.28, y + 0.003, -4.35),
    renderOrder: 2,
  });
  group.add(pDecal);
  const arrowDecal = labelPlane(1.1, 1.4, R.roadArrow.map, {
    transparent: true,
    opacity: 0.6,
    rotation: [-Math.PI / 2, 0, -Math.PI / 2],
    position: new THREE.Vector3(-2.2, y + 0.003, 8.5),
    renderOrder: 2,
  });
  group.add(arrowDecal);
  // Narrow speed marking on the side street.
  const slow = labelPlane(1.25, 1.25, R.roadSlow.map, {
    transparent: true,
    opacity: 0.48,
    rotation: [-Math.PI / 2, 0, 0],
    position: new THREE.Vector3(8.25, y + 0.002, 2.3),
    renderOrder: 2,
  });
  group.add(slow);
  // Parking wheel stop.
  const stopWheel = meshRounded(1.35, 0.18, 0.22, 0.05, R.wheelStop, 5.2, ROAD_Y + 0.1, -5.72, {
    cast: true,
    receive: true,
  });
  // dark support
  const support = meshBox(1.25, 0.03, 0.12, R.metalDark, 0, -0.08, 0.02);
  stopWheel.add(support);
  group.add(stopWheel);
  return group;
}

function createManhole(R) {
  const tex = makeManholeTexture();
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    roughness: 0.32,
    metalness: 0.62,
    alphaTest: 0.15,
  });
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.58, 32), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(-1.15, ROAD_Y + 0.022, 8.45);
  m.receiveShadow = true;
  return m;
}

function createLightSpills(assets, R) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    map: assets.lightPool,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const add = (x, z, w, h, color, opacity, rot = 0) => {
    const m = new THREE.Mesh(planeGeo(w, h), mat.clone());
    m.material.color.set(color);
    m.material.opacity = opacity;
    m.rotation.set(-Math.PI / 2, 0, rot);
    m.position.set(x, ROAD_Y + 0.072, z);
    m.renderOrder = 3;
    m.userData.isGlow = true;
    group.add(m);
    return m;
  };
  // Warm storefront glow.
  add(-2.3, 2.2, 9.5, 3.8, 0xffd19c, 0.36);
  add(1.6, 2.2, 4.1, 2.7, 0xffe1ad, 0.3);
  // Vending machines.
  add(-10.2, 2.4, 3.2, 2.2, 0xffb38e, 0.4);
  add(-10.2, 2.4, 2.3, 1.6, 0xa6edff, 0.16);
  // Street lamp.
  add(-7.08, 4.5, 5.2, 4.4, 0xffc57e, 0.34);
  // Neighbour's window / neon.
  add(-10.2, 2.2, 2.4, 2.4, 0xffa770, 0.2);
  add(-8.45, 1.5, 1.5, 3.3, 0xff93c5, 0.16);
  // Cafe.
  add(9.1, 1.6, 4.0, 2.9, 0xffb88e, 0.22);
  add(9.0, 1.6, 1.7, 3.2, 0xff8fc9, 0.12);
  return group;
}

function createReflectionStreaks(assets) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    map: assets.streak,
    transparent: true,
    opacity: 0.33,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const add = (x, z, w, l, color, opacity, rot = 0) => {
    const m = new THREE.Mesh(planeGeo(w, l), mat.clone());
    m.material.color.set(color);
    m.material.opacity = opacity;
    m.rotation.set(-Math.PI / 2, 0, rot);
    m.position.set(x, ROAD_Y + 0.084, z);
    m.renderOrder = 3;
    m.userData.isGlow = true;
    group.add(m);
    return m;
  };
  add(-2.1, 5.1, 2.8, 8.5, 0xffcf98, 0.38);
  add(1.5, 4.2, 1.5, 6.4, 0xc9f1e2, 0.25);
  add(-10.2, 3.4, 1.2, 4.6, 0xff9376, 0.4);
  add(-9.1, 3.2, 0.8, 3.8, 0x93e5e8, 0.3);
  add(-7.08, 5.0, 1.1, 6.2, 0xffbe7b, 0.26);
  add(9.05, 3.1, 1.25, 6.0, 0xff92c5, 0.22);
  add(9.6, 2.7, 1.4, 4.8, 0xffc89a, 0.28);
  add(7.9, 5.7, 1.0, 5.2, 0x9edce8, 0.14);
  return group;
}

export function buildBase(scene, assets, R, assembly, renderer) {
  const root = new THREE.Group();
  root.name = 'base';

  const baseGroup = new THREE.Group();
  const plinth = meshRounded(BASE_SIZE, 1.55, BASE_SIZE, 0.14, R.baseWood, 0, -0.775, 0, {
    cast: false,
    receive: false,
    roundSeg: 3,
  });
  baseGroup.add(plinth);
  // inset metal band
  const bandY = -0.78;
  const bandT = 0.038;
  const bandOut = BASE_SIZE / 2 + 0.007;
  const bands = [
    meshBox(BASE_SIZE + 0.014, bandT, 0.028, R.brassDark, 0, bandY, bandOut),
    meshBox(BASE_SIZE + 0.014, bandT, 0.028, R.brassDark, 0, bandY, -bandOut),
    meshBox(0.028, bandT, BASE_SIZE + 0.014, R.brassDark, bandOut, bandY, 0),
    meshBox(0.028, bandT, BASE_SIZE + 0.014, R.brassDark, -bandOut, bandY, 0),
  ];
  bands.forEach((b) => baseGroup.add(b));
  // raised wooden frame around cut city section
  const frameInset = 0.46;
  const fw = BASE_SIZE - 0.9;
  const frameY = 0.005;
  const frameParts = [
    meshBox(fw, 0.085, 0.65, R.baseInner, 0, frameY, (CITY_HALF + (CITY_HALF + 0.9)) / 2),
    meshBox(fw, 0.085, 0.65, R.baseInner, 0, frameY, -(CITY_HALF + (CITY_HALF + 0.9)) / 2),
    meshBox(0.65, 0.085, fw, R.baseInner, (CITY_HALF + (CITY_HALF + 0.9)) / 2, frameY, 0),
    meshBox(0.65, 0.085, fw, R.baseInner, -(CITY_HALF + (CITY_HALF + 0.9)) / 2, frameY, 0),
  ];
  frameParts.forEach((f) => baseGroup.add(f));
  const brassInlayY = 0.058;
  const inlayOut = CITY_HALF + 0.13;
  const inlays = [
    meshBox(CITY_HALF * 2 + 0.28, 0.012, 0.025, R.brass, 0, brassInlayY, inlayOut),
    meshBox(CITY_HALF * 2 + 0.28, 0.012, 0.025, R.brass, 0, brassInlayY, -inlayOut),
    meshBox(0.025, 0.012, CITY_HALF * 2 + 0.28, R.brass, inlayOut, brassInlayY, 0),
    meshBox(0.025, 0.012, CITY_HALF * 2 + 0.28, R.brass, -inlayOut, brassInlayY, 0),
  ];
  inlays.forEach((i) => baseGroup.add(i));

  // Front plaque.
  const plaqueGroup = new THREE.Group();
  const plaqueBack = meshRounded(4.2, 1.27, 0.09, 0.045, R.brassDark, 0, -0.67, BASE_SIZE / 2 + 0.015, {
    cast: false,
    receive: false,
  });
  plaqueGroup.add(plaqueBack);
  const plaque = labelPlane(4.02, 1.06, assets.plaque, {
    transparent: false,
    depthWrite: true,
    side: THREE.FrontSide,
    position: new THREE.Vector3(0, -0.67, BASE_SIZE / 2 + 0.065),
    renderOrder: 1,
  });
  plaqueGroup.add(plaque);
  // two little brass pins
  for (const x of [-1.9, 1.9]) {
    const pin = meshCyl(0.035, 0.035, 0.03, R.brass, x, -0.67, BASE_SIZE / 2 + 0.075, 12);
    pin.rotation.x = Math.PI / 2;
    plaqueGroup.add(pin);
  }
  baseGroup.add(plaqueGroup);
  root.add(baseGroup);
  assembly.add(baseGroup, {
    start: TIMES.base,
    duration: 1.35,
    mode: 'rise',
    distance: 3.2,
    land: true,
    landAt: [0, 0.75, 0],
  });

  // Gentle underglow.
  const underglow = new THREE.Mesh(
    planeGeo(34, 34),
    new THREE.MeshBasicMaterial({
      map: assets.glow,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x4e8296,
      toneMapped: false,
    })
  );
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = -1.75;
  underglow.renderOrder = -1;
  root.add(underglow);

  // Asphalt plane.
  const asphaltGroup = new THREE.Group();
  const asphalt = new THREE.Mesh(planeGeo(CITY_HALF * 2, CITY_HALF * 2), R.asphalt);
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.y = ROAD_Y;
  asphalt.receiveShadow = true;
  asphaltGroup.add(asphalt);
  root.add(asphaltGroup);
  assembly.add(asphaltGroup, { start: 0.55, duration: 0.95, mode: 'fade' });

  // Sidewalk slab and tiled top.
  const shape = makeLandShape();
  const slab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.225, bevelEnabled: false, steps: 1, curveSegments: 28 }),
    R.curbDark
  );
  slab.rotateX(-Math.PI / 2);
  slab.receiveShadow = true;
  const topGeo = shapeTopGeometry(shape);
  const sidewalk = new THREE.Mesh(topGeo, R.sidewalk);
  sidewalk.position.y = SIDEWALK_Y - 0.006;
  sidewalk.receiveShadow = true;
  const sidewalkGroup = new THREE.Group();
  sidewalkGroup.add(slab, sidewalk);
  root.add(sidewalkGroup);
  assembly.add(sidewalkGroup, { start: 0.72, duration: 1.0, mode: 'fade' });

  // Curb stones.
  const curbs = createCurbInstances(R);
  root.add(curbs);
  assembly.add(curbs, { start: 1.25, duration: 0.8, mode: 'fade' });

  const tactile = createTactilePath(R);
  root.add(tactile);
  assembly.add(tactile, { start: 1.52, duration: 0.7, mode: 'fade' });

  const gutter = createGutter(R);
  root.add(gutter);
  assembly.add(gutter, { start: 1.35, duration: 0.7, mode: 'fade' });

  const markings = createRoadMarkings(R);
  root.add(markings);
  assembly.add(markings, { start: 1.38, duration: 0.9, mode: 'fade' });

  const manhole = createManhole(R);
  root.add(manhole);
  assembly.add(manhole, { start: 1.55, duration: 0.65, mode: 'fade' });

  // Actual mirror reflection in puddles and wet gutters.
  const wetStreet = createWetStreet(assets.puddleMask);
  root.add(wetStreet);

  const ripples = createRippleField(PUDDLES);
  root.add(ripples);

  const spills = createLightSpills(assets, R);
  root.add(spills);
  assembly.add(spills, { start: 1.8, duration: 1.1, mode: 'fade' });

  const reflectionStreaks = createReflectionStreaks(assets);
  root.add(reflectionStreaks);
  assembly.add(reflectionStreaks, { start: 1.95, duration: 1.2, mode: 'fade' });

  // A little brick / concrete wear along the curb.
  const dirt = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(
      planeGeo(0.6 + Math.random() * 1.4, 0.08 + Math.random() * 0.2),
      new THREE.MeshBasicMaterial({
        color: 0x0b1014,
        transparent: true,
        opacity: 0.06 + Math.random() * 0.1,
        depthWrite: false,
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = Math.random() * Math.PI;
    m.position.set(-11 + Math.random() * 18, ROAD_Y + 0.02 + Math.random() * 0.004, 3.26 + Math.random() * 0.2);
    dirt.add(m);
  }
  root.add(dirt);

  scene.add(root);

  return {
    root,
    wetStreet,
    ripples,
    baseGroup,
    asphaltGroup,
    sidewalkGroup,
    underglow,
    update(time, dt, camera) {
      const t = Math.max(0, time - 1.5);
      const refl = Math.min(1, t / 2.0);
      wetStreet.material.uniforms.uTime.value = time;
      wetStreet.material.uniforms.uOpacity.value = 0.88 * refl;
      if (camera) wetStreet.material.uniforms.uCameraPos.value.copy(camera.position);
      ripples.material.uniforms.uTime.value = time;
      ripples.material.uniforms.uOpacity.value = 0.95 * refl;
      underglow.material.opacity = 0.06 + 0.08 * Math.min(1, time / 2.0);
    },
  };
}
