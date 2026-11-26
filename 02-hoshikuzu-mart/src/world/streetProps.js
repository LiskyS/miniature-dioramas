import * as THREE from 'three';
import { CITY_HALF, LAYOUT, SIDEWALK_Y, ROAD_Y, TIMES } from '../config.js';
import {
  addContactShadow,
  boxGeo,
  canvasTexture,
  cylinderBetween,
  makeGroup,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  roundedBoxGeo,
  rng,
  setShadows,
  tubeFromPoints,
  TAU,
} from '../core/utils.js';

function addBox(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, {
    cast: opts.cast ?? false,
    receive: opts.receive ?? true,
    round: opts.round ?? false,
    radius: opts.radius ?? 0.025,
  });
  parent.add(m);
  return m;
}

function addRounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, { cast: opts.cast ?? false, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function addPlane(parent, w, h, mat, x, y, z, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(planeGeo(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.set(...rot);
  m.receiveShadow = false;
  parent.add(m);
  return m;
}

function textureMat(texture, opts = {}) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: opts.transparent ?? true,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
    alphaTest: 0.01,
  });
}

function makeVendingDisplayTexture() {
  return canvasTexture(512, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#9dd7d7');
    g.addColorStop(0.45, '#e5f5ef');
    g.addColorStop(1, '#b4d2cf');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const gl = ctx.createRadialGradient(w * 0.44, h * 0.18, 10, w * 0.44, h * 0.2, h * 0.6);
    gl.addColorStop(0, 'rgba(255,255,255,.9)');
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(47,100,102,.44)';
    ctx.font = `600 34px 'Yu Gothic','Meiryo',sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('あったか〜い', w / 2, 66);
    ctx.fillStyle = 'rgba(42,80,82,.45)';
    for (let i = 0; i < 4; i++) {
      const y = 230 + i * 195;
      ctx.fillRect(22, y, w - 44, 5);
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.fillRect(46 + j * 88, y - 55, 58, 28);
        ctx.fillStyle = 'rgba(42,80,82,.45)';
        ctx.font = `500 20px 'Yu Gothic','Meiryo',sans-serif`;
        ctx.fillText('¥130', 75 + j * 88, y + 26);
      }
    }
    // dark side mask and rim
    const edge = ctx.createLinearGradient(0, 0, w, 0);
    edge.addColorStop(0, 'rgba(20,45,49,.35)');
    edge.addColorStop(0.15, 'rgba(20,45,49,0)');
    edge.addColorStop(0.85, 'rgba(20,45,49,0)');
    edge.addColorStop(1, 'rgba(20,45,49,.35)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeUtilityPlateTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e0b649';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3c3827';
    ctx.lineWidth = 8;
    ctx.strokeRect(7, 7, w - 14, h - 14);
    ctx.fillStyle = '#2d332e';
    ctx.textAlign = 'center';
    ctx.font = `700 50px 'Yu Gothic','Meiryo',sans-serif`;
    ctx.fillText('感電注意', w / 2, 92);
    ctx.font = `500 29px 'Yu Gothic','Meiryo',sans-serif`;
    ctx.fillText('高圧電流が流れています', w / 2, 146);
    ctx.fillStyle = '#7f2e25';
    ctx.font = `500 22px 'Yu Gothic','Meiryo',sans-serif`;
    ctx.fillText('星見町電力区  No.24-117', w / 2, 198);
  });
}

function makeStreetNoticeTexture() {
  return canvasTexture(384, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f2ecdc';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#48665d';
    ctx.fillRect(0, 0, w, 72);
    ctx.fillStyle = '#f4ecdb';
    ctx.textAlign = 'center';
    ctx.font = `600 32px 'Yu Gothic','Meiryo',sans-serif`;
    ctx.fillText('星見町内会', w / 2, 46);
    ctx.fillStyle = '#4f514b';
    ctx.font = `500 22px 'Yu Gothic','Meiryo',sans-serif`;
    const lines = ['夜間の安全運転を', '心がけましょう。', '', '星見通り商店会', '11月のお知らせ'];
    lines.forEach((line, i) => ctx.fillText(line, w / 2, 150 + i * 55));
    ctx.strokeStyle = 'rgba(73,91,83,.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 96, w - 48, h - 140);
    ctx.fillStyle = '#ca5446';
    ctx.beginPath();
    ctx.arc(w - 70, h - 72, 24, 0, TAU);
    ctx.fill();
  });
}

function makeSmallSignTexture(text, bg, fg) {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.font = `600 72px 'Yu Gothic','Meiryo',sans-serif`;
    ctx.fillText(text, w / 2, 140);
    ctx.font = `500 25px 'Yu Gothic','Meiryo',sans-serif`;
    ctx.fillText('HOSHIMI', w / 2, 193);
  });
}

function buildStreetLamp(scene, assets, R, assembly, lightList) {
  const root = new THREE.Group();
  scene.add(root);
  const base = SIDEWALK_Y;
  const g = new THREE.Group();
  g.position.set(LAYOUT.streetLamp.x, base, LAYOUT.streetLamp.z);
  root.add(g);
  addRounded(g, 0.44, 0.14, 0.44, 0.04, R.curbDark, 0, 0.07, 0, { cast: true });
  const plinth = meshCyl(0.2, 0.28, 0.42, R.storeTrim, 0, 0.32, 0, 10);
  plinth.castShadow = true;
  g.add(plinth);
  const pole = meshCyl(0.075, 0.11, 3.55, R.storeTrim, 0, 2.28, 0, 10);
  pole.castShadow = true;
  g.add(pole);
  // thin gold banding
  for (const y of [0.9, 1.7, 2.5]) {
    const ring = meshCyl(0.09, 0.09, 0.045, R.brass, 0, y, 0, 10);
    g.add(ring);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.02, 0),
    new THREE.Vector3(0, 4.24, 0.18),
    new THREE.Vector3(0, 4.3, 0.64),
    new THREE.Vector3(0, 4.2, 1.08),
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.065, 6, false), R.storeTrim);
  arm.castShadow = true;
  g.add(arm);
  // lantern
  const lamp = new THREE.Group();
  lamp.position.set(0, 3.98, 1.12);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffe1ac, toneMapped: false });
  const glass = meshCyl(0.23, 0.17, 0.4, lightMat, 0, 0, 0, 6);
  lamp.add(glass);
  const top = meshCyl(0.02, 0.3, 0.17, R.storeTrim, 0, 0.27, 0, 6);
  lamp.add(top);
  const bottom = meshCyl(0.21, 0.02, 0.12, R.storeTrim, 0, -0.25, 0, 6);
  lamp.add(bottom);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const rib = meshCyl(0.016, 0.016, 0.44, R.storeTrim, Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19, 5);
    lamp.add(rib);
  }
  g.add(lamp);
  // warm glow billboard
  const glowMat = new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xffd6a0,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(1.5, 1.5, 1);
  glow.position.set(0, 3.98, 1.12);
  g.add(glow);
  // light cone
  const coneMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color('#ffd6a2') }, uOpacity: { value: 0.055 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
      void main(){ float a = (1.0-vUv.y) * smoothstep(0.0,0.2,vUv.y) * smoothstep(0.0,0.35,abs(vUv.x-0.5)); gl_FragColor=vec4(uColor,a*uOpacity); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.8, 24, 1, true), coneMat);
  cone.position.set(0, 2.35, 0.55);
  cone.rotation.x = Math.PI;
  cone.renderOrder = 4;
  g.add(cone);
  const light = new THREE.PointLight(0xffc17b, 0, 9.5, 2.0);
  light.position.set(0, 4.0, 1.1);
  g.add(light);
  assembly.addLight(light, { start: 3.85, duration: 0.9, intensity: 9, flicker: true });
  lightList.push({ light, glow, baseIntensity: 9, phase: 0.6 });
  g.scale.setScalar(0.9);
  assembly.add(g, { start: 3.7, duration: 0.85, mode: 'rise', distance: 1.4, land: true, landAt: [LAYOUT.streetLamp.x, base, LAYOUT.streetLamp.z] });
  return { root, g, light, lamp, glow };
}

function buildGuardrail(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const base = SIDEWALK_Y;
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.55, base + 0.95, 3.03),
    new THREE.Vector3(3.25, base + 1.0, 3.03),
    new THREE.Vector3(3.72, base + 0.97, 2.9),
    new THREE.Vector3(4.02, base + 0.85, 2.55),
    new THREE.Vector3(4.08, base + 0.65, 1.65),
  ]);
  for (let r = 0; r < 2; r++) {
    const pts = path.getPoints(28).map((p) => new THREE.Vector3(p.x, p.y - r * 0.36, p.z));
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 26, 0.045, 7, false), R.guardWhite);
    tube.castShadow = true;
    root.add(tube);
  }
  const postPositions = [0, 0.22, 0.46, 0.7, 0.9, 1];
  for (let i = 0; i < postPositions.length; i++) {
    const t = postPositions[i];
    const p = path.getPoint(t);
    const post = meshCyl(0.045, 0.055, 0.98, R.guardDark, p.x, base + 0.5, p.z, 7);
    post.castShadow = true;
    root.add(post);
    const cap = meshCyl(0.07, 0.055, 0.07, R.guardWhite, p.x, base + 1.0, p.z, 7);
    root.add(cap);
    const reflector = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 5), R.reflector);
    reflector.position.set(p.x, base + 0.74, p.z + 0.055);
    root.add(reflector);
  }
  assembly.add(root, { start: 3.9, duration: 0.8, mode: 'rise', distance: 0.5, land: true, landAt: [3.5, base, 2.8] });
  return root;
}

function buildStreetSign(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const base = SIDEWALK_Y;
  const g = new THREE.Group();
  g.position.set(3.82, base, 2.5);
  root.add(g);
  const pole = meshCyl(0.035, 0.045, 2.45, R.metalGalv, 0, 1.22, 0, 8);
  pole.castShadow = true;
  g.add(pole);
  addRounded(g, 0.55, 0.09, 0.09, 0.02, R.metalDark, 0, 2.4, 0, { cast: true });
  const street = addPlane(g, 1.16, 0.3, textureMat(assets.streetName), 0, 2.32, 0.055);
  street.rotation.y = 0.08;
  const streetBack = street.clone();
  streetBack.rotation.y = Math.PI + 0.08;
  streetBack.position.z = -0.055;
  g.add(streetBack);
  const parking = addPlane(g, 0.44, 0.44, textureMat(assets.parkingSign), 0.1, 1.82, 0.04);
  parking.rotation.y = -0.1;
  // a small one-way arrow lower down
  const signTex = makeSmallSignTexture('一方通行', '#294d79', '#ecf5fa');
  const oneWay = addPlane(g, 0.5, 0.25, textureMat(signTex), -0.02, 1.35, 0.04);
  oneWay.rotation.y = 0.04;
  assembly.add(g, { start: 4.02, duration: 0.7, mode: 'rise', distance: 0.55, land: true, landAt: [3.82, base, 2.5] });
  return root;
}

function makeCansMesh(rows = 4, cols = 5, w = 0.6) {
  const list = [];
  const colors = ['#e8aa4f', '#72a18b', '#b85f56', '#e8dfc4', '#708eae', '#c87d9b', '#d5c55e'];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      list.push({
        x: -w / 2 + 0.07 + c * ((w - 0.14) / Math.max(1, cols - 1)),
        y: 0.84 + r * 0.27,
        color: colors[(r * 2 + c) % colors.length],
        h: 0.16 + ((r + c) % 3) * 0.03,
      });
    }
  }
  const geo = new THREE.CylinderGeometry(0.035, 0.032, 1, 6);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const inst = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  list.forEach((it, i) => {
    m.compose(new THREE.Vector3(it.x, it.y, 0.375), q, new THREE.Vector3(1, it.h, 1));
    inst.setMatrixAt(i, m);
    inst.setColorAt(i, new THREE.Color(it.color));
  });
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  return inst;
}

function buildVending(scene, assets, R, assembly, lights) {
  const root = new THREE.Group();
  scene.add(root);
  const base = SIDEWALK_Y;
  const X = -10.55;
  const Z = 2.1;
  const g = new THREE.Group();
  g.position.set(X, base, Z);
  root.add(g);
  addRounded(g, 1.06, 1.96, 0.8, 0.07, R.vendingWarm, 0, 0.98, 0, { cast: true });
  addRounded(g, 0.94, 0.32, 0.05, 0.03, R.vendingWarmDark, 0, 1.81, 0.405);
  addRounded(g, 0.94, 0.34, 0.04, 0.02, R.vendingWarm, 0, 1.98, 0.39);
  // header lightbox
  const warmHeaderMat = new THREE.MeshBasicMaterial({
    map: assets.vendingTopWarm,
    color: 0xd5c2b4,
    toneMapped: false,
  });
  const header = new THREE.Mesh(planeGeo(0.98, 0.3), warmHeaderMat);
  header.position.set(0, 1.98, 0.43);
  g.add(header);
  // inner illuminated display
  const displayMat = new THREE.MeshBasicMaterial({
    map: makeVendingDisplayTexture(),
    color: 0xd0e5df,
    toneMapped: false,
  });
  addBox(g, 0.7, 1.03, 0.04, displayMat, -0.1, 1.27, 0.335);
  // product rows
  const canMesh = makeCansMesh(4, 5, 0.62);
  canMesh.position.x = -0.1;
  g.add(canMesh);
  // dark shelf rails in front of the rows
  for (let i = 0; i < 4; i++) {
    addBox(g, 0.62, 0.012, 0.02, R.vendingWarmDark, -0.1, 0.82 + i * 0.27, 0.383);
  }
  // dark display surround keeps the lightbox from blooming open
  addBox(g, 0.035, 1.08, 0.035, R.vendingWarmDark, -0.46, 1.27, 0.39);
  addBox(g, 0.035, 1.08, 0.035, R.vendingWarmDark, 0.11, 1.27, 0.39);
  addBox(g, 0.6, 0.025, 0.035, R.vendingWarmDark, -0.18, 0.77, 0.39);
  // glass
  const glass = new THREE.Mesh(planeGeo(0.64, 0.98), R.fridgeGlass);
  glass.position.set(-0.17, 1.28, 0.405);
  glass.renderOrder = 2;
  g.add(glass);
  // button strip
  const btnMat = new THREE.MeshBasicMaterial({ map: assets.vendingButtons, color: 0xb9c4b8, toneMapped: false });
  const btn = new THREE.Mesh(planeGeo(0.2, 1.1), btnMat);
  btn.position.set(0.32, 1.2, 0.363);
  g.add(btn);
  // side coin / bill panel
  addBox(g, 0.17, 0.38, 0.04, R.metalDark, 0.36, 0.7, 0.37);
  addBox(g, 0.1, 0.055, 0.02, R.metalGalv, 0.36, 0.77, 0.395);
  addBox(g, 0.06, 0.075, 0.01, R.neonOrange, 0.36, 0.69, 0.395);
  // dispenser
  addBox(g, 0.68, 0.24, 0.06, R.metalDark, -0.08, 0.36, 0.38);
  addBox(g, 0.59, 0.15, 0.04, R._basic('#0b0f12'), -0.08, 0.34, 0.415);
  // lower side vents
  for (let i = 0; i < 4; i++) addBox(g, 0.32, 0.017, 0.01, R.vendingWarmDark, 0.15, 0.5 + i * 0.045, 0.405);
  // legs
  for (const x of [-0.43, 0.43]) addBox(g, 0.08, 0.06, 0.5, R.metalDark, x, 0.03, 0);
  // side label
  const sideLabel = new THREE.Mesh(planeGeo(0.5, 0.9), basicTexture(assets.vendingLightbox, 0.72));
  sideLabel.position.set(-0.54, 1.0, 0.16);
  sideLabel.rotation.y = -Math.PI / 2;
  g.add(sideLabel);
  // glow light
  const pl = new THREE.PointLight(0xffaa82, 0, 4.0, 2.0);
  pl.position.set(0, 1.1, 0.8);
  g.add(pl);
  assembly.addLight(pl, { start: 4.0, duration: 0.8, intensity: 3.5, flicker: false });
  lights.push({ light: pl, baseIntensity: 3.5 });
  // tiny red LED
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), R.redLight);
  led.position.set(0.46, 1.84, 0.43);
  g.add(led);
  addContactShadow(g, 1.55, 1.2, 0, 0, 0.012, 0.35, 0);
  assembly.add(g, { start: 3.96, duration: 0.85, mode: 'rise', distance: 0.9, land: true, landAt: [X, base, Z] });
  return root;
}

function basicTexture(texture, opacity = 1) {
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
}

function buildUmbrellaStand(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const base = SIDEWALK_Y;
  const g = new THREE.Group();
  g.position.set(-0.2, base, 1.68);
  root.add(g);
  addBox(g, 0.64, 0.035, 0.36, R.metalDark, 0, 0.03, 0, { cast: false });
  // stand cage
  for (const x of [-0.28, 0.28]) {
    for (const z of [-0.15, 0.15]) {
      const bar = meshCyl(0.012, 0.012, 0.57, R.metalGalv, x, 0.3, z, 5);
      g.add(bar);
    }
  }
  for (const y of [0.12, 0.58]) {
    addBox(g, 0.6, 0.018, 0.33, R.metalGalv, 0, y, 0);
  }
  const umbrellas = [
    { x: -0.18, color: '#cfe8e4', transparent: true, handle: '#3d4b4c' },
    { x: 0.03, color: '#d4b04a', transparent: false, handle: '#5a452e' },
    { x: 0.22, color: '#8d4a53', transparent: false, handle: '#45302f' },
  ];
  for (let i = 0; i < umbrellas.length; i++) {
    const u = umbrellas[i];
    const mat = new THREE.MeshToonMaterial({
      color: u.color,
      gradientMap: R.gradient,
      transparent: u.transparent,
      opacity: u.transparent ? 0.42 : 1,
    });
    const shaft = meshCyl(0.007, 0.007, 1.0, R.metalGalv, u.x, 0.55, 0, 4);
    g.add(shaft);
    const canopy = meshCyl(0.018, 0.068, 0.58, mat, u.x, 0.84, 0, 8);
    g.add(canopy);
    const tip = meshCyl(0.009, 0.014, 0.11, R.metalGalv, u.x, 1.17, 0, 4);
    g.add(tip);
    const tie = meshCyl(0.044, 0.04, 0.025, R._toon(u.handle), u.x, 0.78, 0, 8);
    g.add(tie);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.011, 5, 8, Math.PI), R._toon(u.handle));
    handle.position.set(u.x, 0.11, 0);
    handle.rotation.z = Math.PI / 2;
    g.add(handle);
  }
  const label = new THREE.Mesh(planeGeo(0.34, 0.16), textureMat(assets.umbrellaDecal, { opacity: 0.8 }));
  label.position.set(0, 0.39, 0.185);
  g.add(label);
  addContactShadow(g, 0.9, 0.55, 0, 0, 0.012, 0.3);
  assembly.add(g, { start: 3.9, duration: 0.7, mode: 'rise', distance: 0.5, land: false });
  return root;
}

function buildTrashBins(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const base = SIDEWALK_Y;
  const g = new THREE.Group();
  g.position.set(3.48, base, -4.8);
  root.add(g);
  const bins = [
    { z: 0.36, color: R.binLidGreen, label: 'PET' },
    { z: 0, color: R.binLidBlue, label: 'CAN' },
    { z: -0.36, color: R.binLidOrange, label: 'BOTTLE' },
  ];
  bins.forEach((b, i) => {
    addRounded(g, 0.34, 0.62, 0.34, 0.04, R.binBody, 0, 0.31, b.z, { cast: true });
    const lid = addRounded(g, 0.38, 0.08, 0.38, 0.03, b.color, 0, 0.64, b.z, { cast: true });
    addBox(g, 0.11, 0.027, 0.12, R.metalDark, 0, 0.69, b.z);
    const label = new THREE.Mesh(planeGeo(0.27, 0.4), basicTexture(assets.recycleDecal, 0.8));
    label.position.set(0.176, 0.37, b.z);
    label.rotation.y = Math.PI / 2;
    g.add(label);
  });
  addContactShadow(g, 0.8, 1.3, 0, 0, 0.012, 0.3);
  assembly.add(g, { start: 4.1, duration: 0.7, mode: 'rise', distance: 0.55, land: true, landAt: [3.48, base, -4.8] });
  return root;
}

function buildBicycle(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const base = SIDEWALK_Y;
  const g = new THREE.Group();
  g.position.set(3.5, base, -2.0);
  g.rotation.y = -0.05;
  g.rotation.z = 0.035;
  root.add(g);
  const frameMat = R._standard('#d8c6a4', { roughness: 0.36, metalness: 0.35 });
  const darkMat = R.metalDark;
  const rimMat = R.metalGalv;
  const wheelGeo = new THREE.TorusGeometry(0.34, 0.026, 7, 22);
  for (const z of [-0.58, 0.62]) {
    const wheel = new THREE.Mesh(wheelGeo, R.rubber);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.35, z);
    wheel.castShadow = true;
    g.add(wheel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.012, 5, 22), rimMat);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(0, 0.35, z);
    g.add(rim);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const spoke = cylinderBetween(
        new THREE.Vector3(0, 0.35, z),
        new THREE.Vector3(0, 0.35 + Math.sin(a) * 0.285, z + Math.cos(a) * 0.285),
        0.0045,
        rimMat,
        3
      );
      g.add(spoke);
    }
    // fender
    const fender = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.017, 5, 18, Math.PI * 0.75), R._toon('#333b3c'));
    fender.rotation.set(0, Math.PI / 2, 0.35);
    fender.position.set(0, 0.35, z);
    g.add(fender);
  }
  const p = (x, y, z) => new THREE.Vector3(x, y, z);
  const tubes = [
    [p(0, 0.36, -0.58), p(0, 0.9, -0.3)],
    [p(0, 0.36, -0.58), p(0, 0.48, -0.05)],
    [p(0, 0.48, -0.05), p(0, 0.9, -0.3)],
    [p(0, 0.48, -0.05), p(0, 0.72, 0.42)],
    [p(0, 0.72, 0.42), p(0, 0.9, -0.3)],
    [p(0, 0.72, 0.42), p(0, 0.36, 0.62)],
    [p(0, 0.9, -0.3), p(0, 1.02, -0.36)],
  ];
  tubes.forEach(([a, b]) => {
    const m = cylinderBetween(a, b, 0.026, frameMat, 6);
    m.castShadow = true;
    g.add(m);
  });
  // handlebar stem and bars
  const stem = cylinderBetween(p(0, 0.72, 0.42), p(0, 0.97, 0.39), 0.02, darkMat, 5);
  g.add(stem);
  const barCurve = new THREE.CatmullRomCurve3([
    p(-0.24, 0.97, 0.36), p(-0.09, 1.0, 0.39), p(0.09, 1.0, 0.39), p(0.24, 0.97, 0.36),
  ]);
  const bars = new THREE.Mesh(new THREE.TubeGeometry(barCurve, 10, 0.018, 5, false), darkMat);
  g.add(bars);
  // saddle
  addRounded(g, 0.2, 0.055, 0.34, 0.03, R._toon('#5a3e2d'), 0, 1.02, -0.37, { cast: true });
  const saddlePost = cylinderBetween(p(0, 0.9, -0.3), p(0, 1.0, -0.36), 0.018, darkMat, 5);
  g.add(saddlePost);
  // basket at front
  const basket = new THREE.Group();
  basket.position.set(0, 0.93, 0.62);
  addRounded(basket, 0.38, 0.25, 0.3, 0.03, R.metalGalv, 0, 0, 0, { cast: true });
  for (let i = 0; i < 3; i++) {
    addBox(basket, 0.34, 0.012, 0.012, R.metalDark, 0, -0.08 + i * 0.08, 0.16);
  }
  g.add(basket);
  // folded transparent umbrella in basket
  const umbMat = new THREE.MeshPhysicalMaterial({
    color: '#bcdedb', transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.05, side: THREE.DoubleSide,
    depthWrite: false,
  });
  const umb = meshCyl(0.02, 0.07, 0.68, umbMat, 0.04, 1.12, 0.64, 8);
  umb.rotation.z = -0.16;
  g.add(umb);
  const umbTip = meshCyl(0.009, 0.012, 0.22, R.metalGalv, 0.1, 1.5, 0.64, 4);
  umbTip.rotation.z = -0.16;
  g.add(umbTip);
  // kickstand
  const kick = cylinderBetween(p(0, 0.45, -0.08), p(0.22, 0.08, -0.18), 0.012, darkMat, 5);
  g.add(kick);
  addContactShadow(g, 1.25, 1.7, 0, 0, 0.012, 0.34, 0.02);
  assembly.add(g, { start: 4.28, duration: 0.95, mode: 'rise', distance: 1.0, spin: 0.15, land: true, landAt: [3.5, base, -2.0] });
  return root;
}

function buildUtilityPole(scene, assets, R, assembly, lightList) {
  const root = new THREE.Group();
  scene.add(root);
  const front = LAYOUT.utilityPole;
  const back = LAYOUT.backPole;
  const frontBase = ROAD_Y;
  const backBase = SIDEWALK_Y;
  const plates = [];
  const buildPole = (x, z, baseY, h, main = true) => {
    const g = new THREE.Group();
    g.position.set(x, baseY, z);
    const pole = meshCyl(0.115, 0.22, h, R.poleConcrete, 0, h / 2, 0, 10);
    pole.castShadow = true;
    pole.receiveShadow = true;
    g.add(pole);
    // concrete footing
    const foot = meshCyl(0.32, 0.4, 0.35, R.concrete, 0, 0.15, 0, 10);
    foot.receiveShadow = true;
    g.add(foot);
    // metal bands
    for (let i = 0; i < 7; i++) {
      const band = meshCyl(0.125 + i * 0.009, 0.125 + i * 0.009, 0.025, R.metalDark, 0, 1.1 + i * 1.08, 0, 8);
      g.add(band);
    }
    // climbing steps
    for (let i = 0; i < 7; i++) {
      addBox(g, 0.24, 0.022, 0.025, R.metalGalv, 0.18, 1.15 + i * 0.85, 0, { cast: false });
    }
    // crossarms
    const armY = h - 0.55;
    addBox(g, 2.6, 0.11, 0.12, R.woodDark, 0, armY, 0, { cast: true });
    addBox(g, 1.8, 0.09, 0.1, R.woodDark, 0, armY - 0.62, 0, { cast: true });
    // insulators
    for (let i = 0; i < 3; i++) {
      for (const side of [-1, 1]) {
        const ins = meshCyl(0.05, 0.055, 0.14, R.vendingCold, side * (0.55 + i * 0.55), armY + 0.12, 0, 7);
        g.add(ins);
      }
    }
    // transformer and cable spool
    if (main) {
      const t = meshCyl(0.25, 0.25, 0.72, R.metalGalv, 0.38, 5.1, 0, 12);
      t.castShadow = true;
      g.add(t);
      const capT = meshCyl(0.28, 0.28, 0.06, R.metalDark, 0.38, 5.49, 0, 12);
      g.add(capT);
      const bracket = addBox(g, 0.65, 0.06, 0.16, R.metal, 0.28, 4.72, 0);
      const spool = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.1, 7, 16), R.rubber);
      spool.rotation.y = Math.PI / 2;
      spool.position.set(-0.27, 6.4, 0.05);
      g.add(spool);
      // lamp arm at top
      addBox(g, 0.9, 0.05, 0.05, R.metalDark, 0.4, h - 0.12, 0.1);
      const ledLamp = meshRounded(0.32, 0.08, 0.14, 0.02, R.coolLight, 0.75, h - 0.24, 0.1, { cast: false });
      g.add(ledLamp);
    }
    // signs
    if (main) {
      const plateTex = makeUtilityPlateTexture();
      const plate = addPlane(g, 0.5, 0.28, textureMat(plateTex), 0.01, 2.05, 0.225);
      plate.renderOrder = 3;
      const noticeTex = makeStreetNoticeTexture();
      const notice = addPlane(g, 0.34, 0.44, textureMat(noticeTex), -0.1, 2.65, 0.23);
      notice.rotation.z = -0.02;
      const cat = addPlane(g, 0.28, 0.4, basicTexture(assets.posterCat, 0.82), 0.08, 3.2, 0.22);
      cat.renderOrder = 3;
    }
    // small warning stripes at base
    for (let i = 0; i < 4; i++) {
      addBox(g, 0.07, 0.22, 0.02, i % 2 ? R.paintYellow : R.metalDark, 0.13, 0.55 + i * 0.24, 0.205);
    }
    plates.push(g);
    root.add(g);
    return { g, h };
  };
  const f = buildPole(front.x, front.z, frontBase, 9.35, true);
  const b = buildPole(back.x, back.z, backBase, 8.65, false);
  assembly.add(f.g, { start: 3.87, duration: 1.05, mode: 'rise', distance: 1.8, land: true, landAt: [front.x, frontBase, front.z] });
  assembly.add(b.g, { start: 4.0, duration: 1.05, mode: 'rise', distance: 1.5, land: false });

  // Wires.
  const wires = new THREE.Group();
  scene.add(wires);
  const cables = [];
  const addCable = (points, start, dur) => {
    const mesh = tubeFromPoints(points, 0.018, R.wire, { segments: 28, radialSegments: 5, tension: 0.4 });
    wires.add(mesh);
    assembly.add(mesh, { start, duration: dur, mode: 'draw', land: false });
    return mesh;
  };
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * 0.18;
    const y1 = frontBase + 8.85 - Math.abs(i - 1.5) * 0.18;
    const y2 = backBase + 8.25 - Math.abs(i - 1.5) * 0.16;
    addCable([
      new THREE.Vector3(front.x + off, y1, front.z + off),
      new THREE.Vector3(4.2 + off, (y1 + y2) / 2 - 0.7, 2.8 + off),
      new THREE.Vector3(-2.4 + off, (y1 + y2) / 2 - 1.1, -3.4 + off),
      new THREE.Vector3(back.x + off, y2, back.z + off),
    ], 5.05 + i * 0.09, 0.9);
  }
  // Service drops to the café and store roof.
  addCable([
    new THREE.Vector3(front.x - 0.9, frontBase + 8.7, front.z),
    new THREE.Vector3(9.7, frontBase + 8.1, 4.6),
    new THREE.Vector3(10.6, LAYOUT.cafe.h - 2.2, 0.8),
  ], 5.4, 0.8);
  addCable([
    new THREE.Vector3(front.x - 1.1, frontBase + 8.85, front.z + 0.2),
    new THREE.Vector3(7.4, 6.4, 2.0),
    new THREE.Vector3(3.2, 4.8, 1.3),
  ], 5.5, 0.8);
  // Slack loop on the pole.
  addCable([
    new THREE.Vector3(front.x + 0.15, frontBase + 7.1, front.z + 0.1),
    new THREE.Vector3(front.x + 0.7, frontBase + 6.5, front.z + 0.4),
    new THREE.Vector3(front.x + 0.1, frontBase + 6.0, front.z + 0.1),
  ], 5.7, 0.6);

  // Ground-level cable box at the utility pole.
  const cabinet = new THREE.Group();
  cabinet.position.set(front.x - 0.08, frontBase, front.z + 0.55);
  addRounded(cabinet, 0.52, 0.75, 0.34, 0.035, R.metalGalv, 0, 0.65, 0, { cast: true });
  addBox(cabinet, 0.36, 0.04, 0.02, R.metalDark, 0, 0.78, 0.18);
  addBox(cabinet, 0.4, 0.04, 0.02, R.metalDark, 0, 0.48, 0.18);
  root.add(cabinet);
  assembly.add(cabinet, { start: 4.25, duration: 0.6, mode: 'fade' });

  // The pole-top luminaire is represented by an emissive plane and a sprite;
  // no extra dynamic point light is needed out here in the rain.
  const topGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xd8f1ff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  topGlow.scale.set(1.3, 1.3, 1);
  topGlow.position.set(0.7, 9.1, 0.1);
  f.g.add(topGlow);

  return { root, front: f, back: b, wires, cabinet };
}

function buildTree(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const base = SIDEWALK_Y;
  const g = new THREE.Group();
  g.position.set(LAYOUT.tree.x, base, LAYOUT.tree.z);
  root.add(g);
  // tree grate and planter
  addBox(g, 0.78, 0.028, 0.78, R.metalDark, 0, 0.018, 0, { receive: true });
  for (let i = -2; i <= 2; i++) {
    addBox(g, 0.7, 0.008, 0.028, R.metal, 0, 0.038, i * 0.15);
  }
  addRounded(g, 0.68, 0.24, 0.68, 0.04, R.planter, 0, 0.13, 0, { cast: true });
  addBox(g, 0.56, 0.02, 0.56, R.soil, 0, 0.26, 0);
  // trunk
  const trunkPts = [
    new THREE.Vector3(0, 0.25, 0),
    new THREE.Vector3(0.04, 1.05, 0.01),
    new THREE.Vector3(-0.06, 1.85, -0.03),
    new THREE.Vector3(0.1, 2.48, 0.05),
  ];
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunkPts), 12, 0.085, 6, false), R.trunk);
  trunk.castShadow = true;
  g.add(trunk);
  const branches = [
    [[0.02, 1.8, 0], [0.72, 2.38, 0.18]],
    [[0.0, 2.0, 0], [-0.68, 2.45, -0.2]],
    [[0.07, 2.3, 0.02], [0.12, 3.08, 0.32]],
    [[0.0, 1.75, 0], [-0.45, 2.2, 0.42]],
  ];
  for (const [a, b] of branches) {
    const br = cylinderBetween(new THREE.Vector3(...a), new THREE.Vector3(...b), 0.028, R.trunk, 5);
    br.castShadow = true;
    g.add(br);
  }
  // canopy clusters
  const leaves = new THREE.Group();
  const RNG = rng(8221);
  const clusters = [
    [0.22, 2.72, 0.06, 0.5], [-0.4, 2.58, -0.12, 0.44], [0.02, 3.1, 0.08, 0.45],
    [0.54, 2.44, 0.28, 0.34], [-0.57, 2.8, 0.05, 0.33], [0.12, 3.4, -0.02, 0.32],
    [-0.22, 2.36, 0.36, 0.31], [0.38, 3.16, -0.26, 0.3], [-0.18, 3.26, 0.3, 0.28],
    [0.56, 2.9, 0.02, 0.28],
  ];
  clusters.forEach(([x, y, z, s], i) => {
    const geo = new THREE.IcosahedronGeometry(0.48, 1);
    const m = new THREE.Mesh(geo, i % 3 === 0 ? R.foliageLight : i % 3 === 1 ? R.foliage : R.foliageDark);
    m.position.set(x, y, z);
    m.scale.set(s * 1.2, s * 0.78, s);
    m.rotation.set(RNG() * 1.2, RNG() * 6.28, RNG() * 1.2);
    m.castShadow = true;
    m.receiveShadow = true;
    leaves.add(m);
  });
  g.add(leaves);
  // a few wet fallen leaves around the tree
  const leafGeo = new THREE.CircleGeometry(0.075, 5);
  leafGeo.scale(1, 0.48, 1);
  leafGeo.rotateX(-Math.PI / 2);
  const leafMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: R.gradient });
  const leafInst = new THREE.InstancedMesh(leafGeo, leafMat, 18);
  const lm = new THREE.Matrix4();
  const lq = new THREE.Quaternion();
  const lc = ['#8a563d', '#6d4735', '#9b6948', '#51624e'];
  for (let i = 0; i < 18; i++) {
    const a = RNG() * TAU;
    const r = 0.35 + RNG() * 1.45;
    lq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), RNG() * TAU);
    lm.compose(
      new THREE.Vector3(Math.cos(a) * r, 0.03, Math.sin(a) * r),
      lq,
      new THREE.Vector3(0.65 + RNG() * 0.8, 1, 0.6 + RNG() * 0.8)
    );
    leafInst.setMatrixAt(i, lm);
    leafInst.setColorAt(i, new THREE.Color(lc[i % lc.length]));
  }
  leafInst.instanceMatrix.needsUpdate = true;
  if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;
  g.add(leafInst);
  // a couple of warm lights caught in the leaves
  addContactShadow(g, 1.2, 1.1, 0, 0.15, 0.02, 0.28);
  assembly.add(g, { start: 4.15, duration: 1.1, mode: 'rise', distance: 1.3, spin: 0.1, land: true, landAt: [LAYOUT.tree.x, base, LAYOUT.tree.z] });
  return { root, g, leaves };
}

export function buildStreetProps(scene, assets, R, assembly) {
  const lightList = [];
  const streetLamp = buildStreetLamp(scene, assets, R, assembly, lightList);
  const guardrail = buildGuardrail(scene, R, assembly);
  const streetSign = buildStreetSign(scene, assets, R, assembly);
  const vending = buildVending(scene, assets, R, assembly, lightList);
  const umbrellaStand = buildUmbrellaStand(scene, assets, R, assembly);
  const bins = buildTrashBins(scene, assets, R, assembly);
  const bicycle = buildBicycle(scene, R, assembly);
  const pole = buildUtilityPole(scene, assets, R, assembly, lightList);
  const tree = buildTree(scene, R, assembly);

  return {
    streetLamp,
    guardrail,
    streetSign,
    vending,
    umbrellaStand,
    bins,
    bicycle,
    pole,
    tree,
    lights: lightList,
    update(time, dt) {
      for (const item of lightList) {
        if (!item.light) continue;
        if (item.baseIntensity) {
          const flicker = 1 + 0.018 * Math.sin(time * 7.3 + (item.phase || 0)) + 0.008 * Math.sin(time * 23.1);
          item.light.intensity = item.baseIntensity * flicker;
        }
      }
      // tree sway
      tree.leaves.rotation.z = Math.sin(time * 0.38) * 0.012;
      tree.leaves.rotation.x = Math.sin(time * 0.31 + 1.3) * 0.015;
      streetLamp.glow.material.opacity = 0.72 + 0.08 * Math.sin(time * 2.1);
    },
  };
}
