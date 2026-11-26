import * as THREE from 'three';
import { CITY_HALF, LAYOUT, SIDEWALK_Y, TIMES } from '../config.js';
import {
  addContactShadow,
  canvasTexture,
  cylinderBetween,
  labelPlane,
  makeGroup,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  roundedBoxGeo,
  setShadows,
  tubeFromPoints,
  rng,
  TAU,
} from '../core/utils.js';

const JP = "'Yu Gothic UI','Yu Gothic','Hiragino Kaku Gothic ProN','Noto Sans JP','Meiryo',sans-serif";
const DISPLAY = "'Yu Mincho','YuMincho','Hiragino Mincho ProN','Noto Serif JP',serif";

function makeRoofTileTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const R = rng(3991);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#303b47');
    grad.addColorStop(0.5, '#222c37');
    grad.addColorStop(1, '#18212c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const rows = 9;
    const cols = 12;
    for (let row = 0; row < rows; row++) {
      const y = (row / rows) * h;
      const off = row % 2 ? w / cols / 2 : 0;
      for (let col = -1; col < cols + 1; col++) {
        const x = (col / cols) * w + off;
        ctx.fillStyle = `rgba(${44 + row * 2},${55 + row * 2},${66 + row * 2},.38)`;
        ctx.beginPath();
        ctx.ellipse(x + w / cols / 2, y + 8, w / cols / 2 - 1, h / rows / 2 - 2, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(118,138,153,.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + w / cols / 2, y + h / rows / 2, w / cols / 2 - 2, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(8,13,18,.4)';
      ctx.fillRect(0, y + h / rows - 5, w, 5);
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = R() > 0.5 ? 'rgba(223,240,248,.04)' : 'rgba(0,0,0,.09)';
      ctx.fillRect(R() * w, R() * h, 2, 1);
    }
    // wet highlight
    const sheen = ctx.createLinearGradient(0, 0, w, h);
    sheen.addColorStop(0, 'rgba(190,215,230,.06)');
    sheen.addColorStop(0.35, 'rgba(0,0,0,0)');
    sheen.addColorStop(0.75, 'rgba(0,0,0,.1)');
    sheen.addColorStop(1, 'rgba(190,215,230,.03)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: [3.2, 2.3] });
}

function makeNorenTexture(text, sub) {
  return canvasTexture(768, 384, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#26303c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(245,235,218,.93)';
    ctx.textAlign = 'center';
    ctx.font = `600 116px ${DISPLAY}`;
    ctx.fillText(text, w / 2, 180);
    ctx.fillStyle = 'rgba(236,217,197,.62)';
    ctx.font = `500 30px ${JP}`;
    ctx.fillText(sub, w / 2, 258);
    for (let i = 1; i < 3; i++) {
      ctx.fillStyle = 'rgba(6,9,14,.55)';
      ctx.fillRect((w / 3) * i - 3, 0, 6, h);
    }
    const fade = ctx.createLinearGradient(0, h * 0.7, 0, h);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,.3)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
  });
}

function makeAlleySignTexture() {
  return canvasTexture(768, 384, (ctx, w, h) => {
    ctx.fillStyle = '#1b2025';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,194,143,.55)';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe2bb';
    ctx.font = `600 125px ${DISPLAY}`;
    ctx.fillText('横丁', w / 2, 190);
    ctx.fillStyle = 'rgba(255,219,183,.55)';
    ctx.font = `500 26px ${JP}`;
    spaced(ctx, 'YOKOCHO  /  RAIN ALLEY', w / 2, 258, 3);
    ctx.fillStyle = 'rgba(255,141,178,.8)';
    ctx.beginPath();
    ctx.arc(w - 66, 62, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(145,239,213,.7)';
    ctx.beginPath();
    ctx.arc(w - 92, 62, 5, 0, TAU);
    ctx.fill();
  });
}

function makeLanternTexture(text) {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#d95e43');
    g.addColorStop(0.5, '#e98b5d');
    g.addColorStop(1, '#b84634');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 13; i++) {
      ctx.fillStyle = 'rgba(96,37,29,.18)';
      ctx.fillRect(0, i * 21, w, 3);
    }
    ctx.strokeStyle = 'rgba(255,218,172,.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 12, w - 40, h - 24);
    ctx.fillStyle = 'rgba(255,241,208,.94)';
    ctx.textAlign = 'center';
    ctx.font = `600 70px ${DISPLAY}`;
    ctx.fillText(text, w / 2, 126);
    ctx.fillStyle = 'rgba(255,228,186,.75)';
    ctx.font = `500 28px ${JP}`;
    ctx.textAlign = 'center';
    ctx.fillText('COFFEE', w / 2, 177);
  });
}

function makePaintedWallAd() {
  return canvasTexture(1024, 640, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.globalAlpha = 0.68;
    ctx.strokeStyle = '#d8c8a2';
    ctx.lineWidth = 8;
    ctx.strokeRect(-w * 0.44, -h * 0.42, w * 0.88, h * 0.84);
    ctx.globalAlpha = 0.54;
    ctx.strokeStyle = '#decda5';
    ctx.lineWidth = 3;
    ctx.strokeRect(-w * 0.41, -h * 0.39, w * 0.82, h * 0.78);

    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#e2d3ae';
    ctx.textAlign = 'center';
    ctx.font = `600 178px ${DISPLAY}`;
    ctx.fillText('純喫茶', 0, -86);
    ctx.font = `600 226px ${DISPLAY}`;
    ctx.fillText('雨 音', 0, 148);
    ctx.globalAlpha = 0.5;
    ctx.font = `500 34px ${JP}`;
    ctx.fillText('COFFEE  ·  JAZZ  ·  SINCE 1968', 0, 224);

    // faded coffee cup mark
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = '#ead8b5';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(-w * 0.35, h * 0.3, 45, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-w * 0.35, h * 0.3, 27, 0, TAU);
    ctx.stroke();
    ctx.restore();
  });
}

function makeCafeWindowTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.55, h * 0.4, 20, w * 0.55, h * 0.55, h * 0.72);
    g.addColorStop(0, '#ffe0a6');
    g.addColorStop(0.45, '#e8b66f');
    g.addColorStop(1, '#7e5b3d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // back bar shelves
    ctx.fillStyle = 'rgba(86,56,38,.42)';
    ctx.fillRect(0, h * 0.38, w, h * 0.12);
    ctx.fillRect(0, h * 0.63, w, h * 0.14);
    ctx.fillStyle = 'rgba(255,235,188,.25)';
    for (let i = 0; i < 14; i++) {
      const x = 45 + i * 68;
      ctx.fillRect(x, h * 0.42, 20 + (i % 3) * 6, 28 + (i % 4) * 12);
    }
    // hanging lamps
    for (let i = 0; i < 3; i++) {
      const x = w * (0.3 + i * 0.2);
      ctx.strokeStyle = 'rgba(54,35,25,.64)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h * 0.17);
      ctx.stroke();
      const lamp = ctx.createRadialGradient(x, h * 0.2, 2, x, h * 0.2, 56);
      lamp.addColorStop(0, 'rgba(255,247,210,.95)');
      lamp.addColorStop(1, 'rgba(255,188,109,0)');
      ctx.fillStyle = lamp;
      ctx.fillRect(x - 60, h * 0.1, 120, 130);
    }
    // dark silhouettes of bottles and a plant
    ctx.fillStyle = 'rgba(56,38,29,.42)';
    for (let i = 0; i < 7; i++) {
      const x = 660 + i * 38;
      ctx.fillRect(x, h * 0.48 - (i % 3) * 20, 15, 110);
      ctx.fillRect(x + 4, h * 0.45 - (i % 3) * 20, 7, 12);
    }
    ctx.fillStyle = 'rgba(37,57,42,.55)';
    ctx.beginPath();
    ctx.arc(185, 730, 48, 0, TAU);
    ctx.arc(130, 755, 34, 0, TAU);
    ctx.arc(235, 770, 27, 0, TAU);
    ctx.fill();
    // curtains at the edges
    ctx.fillStyle = 'rgba(94,58,48,.4)';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(0, 0, 75 + i * 13, h);
      ctx.fillRect(w - 115 + i * 22, 0, 80, h);
    }
    // wet shine at bottom
    const wet = ctx.createLinearGradient(0, h * 0.7, 0, h);
    wet.addColorStop(0, 'rgba(255,255,255,0)');
    wet.addColorStop(1, 'rgba(255,240,205,.18)');
    ctx.fillStyle = wet;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
  });
}

function makeRoundBarSign() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#2a1524');
    g.addColorStop(0.76, '#1a111c');
    g.addColorStop(1, 'rgba(8,7,12,.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.47, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ff8fc7';
    ctx.lineWidth = 12;
    ctx.shadowColor = '#ff5ba7';
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.4, 0, TAU);
    ctx.stroke();
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffe0ec';
    ctx.textAlign = 'center';
    ctx.font = `600 210px ${DISPLAY}`;
    ctx.fillText('夜', w / 2, h * 0.54);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,183,215,.8)';
    ctx.font = `500 38px ${JP}`;
    spaced(ctx, 'YONAGI', w / 2, h * 0.78, 6);
  });
}

function makeCafeSideAdTexture() {
  return canvasTexture(1024, 640, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.52;
    ctx.strokeStyle = '#ead6b7';
    ctx.lineWidth = 7;
    ctx.strokeRect(34, 34, w - 68, h - 68);
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = '#f0ddc1';
    ctx.textAlign = 'center';
    ctx.font = `600 150px ${DISPLAY}`;
    ctx.fillText('夜 凪', w / 2, 246);
    ctx.globalAlpha = 0.38;
    ctx.font = `500 41px ${JP}`;
    spaced(ctx, 'COFFEE  &  JAZZ', w / 2, 336, 5);
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = '#f0d8ba';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(w / 2, 452, 56, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, 452, 30, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.font = `500 28px ${JP}`;
    ctx.fillText('OPEN 18:00 — 02:00', w / 2, 548);
    ctx.globalAlpha = 1;
  });
}

function makeNeighborDoorTexture() {
  return canvasTexture(512, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffdda5');
    g.addColorStop(0.6, '#eab375');
    g.addColorStop(1, '#8c593d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // receding warm interior shelves
    ctx.fillStyle = 'rgba(74,47,32,.2)';
    ctx.fillRect(w * 0.08, h * 0.36, w * 0.84, h * 0.03);
    ctx.fillRect(w * 0.08, h * 0.52, w * 0.84, h * 0.03);
    ctx.fillRect(w * 0.08, h * 0.68, w * 0.84, h * 0.03);
    ctx.fillStyle = 'rgba(84,51,32,.32)';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(w * 0.15 + i * 0.15 * w, h * 0.44 - (i % 3) * h * 0.04, w * 0.04, h * 0.1);
    }
    // hanging lamp silhouette
    ctx.strokeStyle = 'rgba(66,43,28,.42)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.5, h * 0.18);
    ctx.stroke();
    const lamp = ctx.createRadialGradient(w * 0.5, h * 0.22, 2, w * 0.5, h * 0.22, 90);
    lamp.addColorStop(0, 'rgba(255,249,217,.7)');
    lamp.addColorStop(1, 'rgba(255,198,137,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(w * 0.2, h * 0.12, w * 0.6, h * 0.3);
    // timber frame and translucent bands
    ctx.fillStyle = 'rgba(69,49,38,.65)';
    ctx.fillRect(0, 0, 22, h);
    ctx.fillRect(w - 22, 0, 22, h);
    ctx.fillRect(0, h * 0.32, w, 13);
    ctx.fillRect(0, h * 0.7, w, 10);
    // frosted glaze
    ctx.fillStyle = 'rgba(255,243,220,.12)';
    ctx.fillRect(24, 30, w - 48, h - 60);
    // faint logo on glass
    ctx.fillStyle = 'rgba(83,52,35,.38)';
    ctx.textAlign = 'center';
    ctx.font = `500 36px ${DISPLAY}`;
    ctx.fillText('雨音', w / 2, h * 0.87);
  });
}

function spaced(ctx, text, x, y, gap) {
  const chars = [...text];
  let total = 0;
  const widths = chars.map((c) => { const w = ctx.measureText(c).width; total += w; return w; });
  total += gap * (chars.length - 1);
  let cursor = x - total / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursor + widths[i] / 2, y);
    cursor += widths[i] + gap;
  }
}

function makeWallWash(assets, color, opacity, w, h) {
  const mat = new THREE.MeshBasicMaterial({
    map: assets.lightPool,
    transparent: true,
    opacity,
    color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const m = new THREE.Mesh(planeGeo(w, h), mat);
  m.renderOrder = 4;
  m.userData.isGlow = true;
  return m;
}

function addBox(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, { cast: opts.cast ?? false, receive: opts.receive ?? true, round: opts.round, radius: opts.radius ?? 0.025 });
  parent.add(m);
  return m;
}

function addRounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, { cast: opts.cast ?? false, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function addLabelMesh(parent, w, h, texture, x, y, z, opts = {}) {
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: false,
    toneMapped: false,
    alphaTest: 0.01,
  });
  const m = new THREE.Mesh(planeGeo(w, h), mat);
  m.position.set(x, y, z);
  if (opts.rotation) m.rotation.set(...opts.rotation);
  m.renderOrder = opts.renderOrder ?? 3;
  parent.add(m);
  return m;
}

function makeCloth(texture, w, h, segX = 12, segY = 4) {
  const geo = new THREE.PlaneGeometry(w, h, segX, segY);
  const mat = new THREE.MeshToonMaterial({
    map: texture,
    side: THREE.DoubleSide,
    gradientMap: null,
    color: 0xffffff,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.baseVertex = geo.attributes.position.array.slice();
  mesh.userData.isCloth = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

function animateCloth(mesh, time, strength = 0.03) {
  const pos = mesh.geometry.attributes.position;
  const base = mesh.userData.baseVertex;
  const w = mesh.geometry.parameters.width;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3];
    const y = base[i * 3 + 1];
    const sway = Math.sin(time * 1.2 + x * 4.4 + y * 2.2) * strength * (0.35 + (y + mesh.geometry.parameters.height / 2) / mesh.geometry.parameters.height);
    pos.setZ(i, sway);
  }
  pos.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

function buildLantern(assets, R, text = '雨音', scale = 1) {
  const g = new THREE.Group();
  const tex = makeLanternTexture(text);
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xffffff });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.22 * scale, 0.5 * scale, 16, 1, true), mat);
  body.position.y = 0;
  g.add(body);
  const capMat = R.woodDark;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.135 * scale, 0.17 * scale, 0.08 * scale, 12), capMat);
  top.position.y = 0.27 * scale;
  const bottom = top.clone();
  bottom.position.y = -0.27 * scale;
  bottom.scale.set(0.9, 1, 0.9);
  g.add(top, bottom);
  // little hanging cord
  const cord = meshCyl(0.008, 0.008, 0.35, R.metalDark, 0, 0.45, 0, 5);
  g.add(cord);
  g.userData.body = body;
  return g;
}

function buildNeighbor(scene, assets, R, assembly, updateList) {
  const N = LAYOUT.neighbor;
  const root = new THREE.Group();
  root.name = 'amane-kissa';
  scene.add(root);
  const baseY = SIDEWALK_Y;
  const W = N.x1 - N.x0;
  const D = N.z1 - N.z0;
  const cx = (N.x0 + N.x1) / 2;
  const cz = (N.z0 + N.z1) / 2;
  const roofTex = makeRoofTileTexture();
  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex,
    color: '#ffffff',
    roughness: 0.5,
    metalness: 0.08,
    envMapIntensity: 0.4,
  });
  const lowerMat = R._toon('#5f5146');
  const upperMat = R.neighborWall;

  const body = new THREE.Group();
  root.add(body);
  addBox(body, W, 3.12, D, lowerMat, cx, baseY + 1.56, cz, { cast: true });
  addBox(body, W, 3.55, D, upperMat, cx, baseY + 4.895, cz, { cast: true });
  // foundation and floor band
  addRounded(body, W + 0.12, 0.18, D + 0.12, 0.025, R.curbDark, cx, baseY + 0.09, cz, { cast: true });
  addBox(body, W + 0.16, 0.18, D + 0.1, R.woodDark, cx, baseY + 3.22, cz, { cast: true });
  addBox(body, W + 0.08, 0.08, D + 0.02, R.curbDark, cx, baseY + 6.82, cz, { cast: true });
  // vertical timber facade slats
  for (let i = 0; i < 13; i++) {
    addBox(body, 0.035, 2.55, 0.035, R.woodDark,
      N.x0 + 0.2 + i * ((W - 0.4) / 12), baseY + 1.5, N.z1 + 0.015);
  }
  // upper cladding seams
  for (let i = 0; i < 5; i++) {
    addBox(body, W + 0.005, 0.02, 0.02, R.curbDark, cx, baseY + 3.5 + i * 0.68, N.z1 + 0.012);
  }
  // side wall details facing alley
  for (let i = 0; i < 4; i++) {
    addBox(body, 0.02, 1.1, 0.58, R.woodDark, N.x1 + 0.015, baseY + 4.2 + (i % 2) * 1.4, N.z0 + 2.1 + i * 1.7);
  }
  assembly.add(body, { start: 2.03, duration: 1.1, mode: 'grow', land: true, landAt: [cx, baseY, cz] });

  // Gabled tiled roof.
  const roof = new THREE.Group();
  root.add(roof);
  const eaveY = baseY + 6.95;
  const ridgeY = eaveY + 0.62;
  const roofW = W + 0.7;
  const roofD = D + 0.8;
  const slope = Math.hypot(roofW / 2, ridgeY - eaveY);
  const angle = Math.atan2(ridgeY - eaveY, roofW / 2);
  const left = addBox(roof, slope, 0.1, roofD, roofMat, cx - roofW / 4, (eaveY + ridgeY) / 2, cz, { cast: true });
  left.rotation.z = angle;
  const right = addBox(roof, slope, 0.1, roofD, roofMat, cx + roofW / 4, (eaveY + ridgeY) / 2, cz, { cast: true });
  right.rotation.z = -angle;
  // barge / eave boards
  addBox(roof, roofW + 0.16, 0.1, 0.1, R.woodDark, cx, eaveY - 0.01, N.z1 + 0.43, { cast: true });
  addBox(roof, roofW + 0.16, 0.1, 0.1, R.woodDark, cx, eaveY - 0.01, N.z0 - 0.43, { cast: true });
  const ridge = meshCyl(0.13, 0.13, roofD + 0.2, R.neighborRoof, cx, ridgeY + 0.02, cz, 10);
  ridge.rotation.x = Math.PI / 2;
  ridge.castShadow = true;
  roof.add(ridge);
  // Onigawara end caps
  for (const z of [N.z1 + 0.37, N.z0 - 0.37]) {
    const cap = addRounded(roof, 0.28, 0.3, 0.12, 0.03, R.neighborRoof, cx, ridgeY + 0.05, z, { cast: true });
  }
  // Small roof window/vent
  addRounded(roof, 0.5, 0.22, 0.2, 0.03, R.woodDark, cx + 0.55, eaveY + 0.22, N.z0 + 2.4, { cast: true });
  assembly.add(roof, { start: 2.8, duration: 0.85, mode: 'drop', distance: 1.5, land: true, landAt: [cx, baseY + 6.9, cz] });

  // Facade details and warm shop entrance.
  const facade = new THREE.Group();
  root.add(facade);
  const fz = N.z1 + 0.02;
  // Wooden frame door.
  addRounded(facade, 1.02, 2.18, 0.12, 0.03, R.woodDark, -9.78, baseY + 1.15, fz + 0.03, { cast: true });
  const neighborDoorTex = makeNeighborDoorTexture();
  const warmDoor = new THREE.Mesh(planeGeo(0.78, 1.9), new THREE.MeshBasicMaterial({
    map: neighborDoorTex,
    toneMapped: false,
    color: 0xd9c0a1,
  }));
  warmDoor.position.set(-9.78, baseY + 1.1, fz + 0.105);
  facade.add(warmDoor);
  for (let i = 0; i < 3; i++) {
    addBox(facade, 0.025, 1.7, 0.025, R.wood, -9.78 + (i - 1) * 0.26, baseY + 1.08, fz + 0.14);
  }
  // Window to the left of door, mostly hidden by vending.
  addRounded(facade, 0.78, 1.35, 0.08, 0.025, R.woodDark, -11.3, baseY + 1.5, fz + 0.02, { cast: true });
  addBox(facade, 0.66, 1.2, 0.03, R.windowCoffee ? R.neighborWindow : R.neighborWindow, -11.3, baseY + 1.5, fz + 0.07);
  for (let i = 0; i < 4; i++) {
    addBox(facade, 0.6, 0.02, 0.02, R.wood, -11.3, baseY + 1.15 + i * 0.24, fz + 0.09);
  }
  // Awning over ground floor.
  addRounded(facade, W + 0.18, 0.11, 0.78, 0.03, R.woodDark, cx, baseY + 2.9, N.z1 + 0.43, { cast: true });
  addBox(facade, W + 0.22, 0.09, 0.05, R.neighborTrim, cx, baseY + 2.83, N.z1 + 0.82);
  // little tiled canopy top detail
  for (let i = 0; i < 8; i++) {
    addBox(facade, (W + 0.1) / 8 - 0.02, 0.035, 0.07, R.neighborRoof, N.x0 + 0.1 + i * ((W - 0.2) / 8), baseY + 2.96, N.z1 + 0.8);
  }
  // Noren over the door.
  const norenTex = makeNorenTexture('雨音', 'KISSA AMANE');
  const noren = makeCloth(norenTex, 1.05, 0.48, 10, 3);
  noren.position.set(-9.78, baseY + 2.02, N.z1 + 0.24);
  noren.rotation.x = 0.03;
  facade.add(noren);
  updateList.push((time) => animateCloth(noren, time, 0.02));
  // entrance lantern
  const lantern = buildLantern(assets, R, '雨音', 0.72);
  lantern.position.set(-9.31, baseY + 2.43, N.z1 + 0.55);
  facade.add(lantern);
  // little under-awning downlights
  for (let i = 0; i < 2; i++) {
    addBox(facade, 0.18, 0.025, 0.12, R.warmLight, -11.25 + i * 1.1, baseY + 2.83, N.z1 + 0.56);
  }
  // A-board sign by the door.
  const board = new THREE.Group();
  addRounded(board, 0.42, 0.62, 0.05, 0.02, R.woodDark, 0, 0.32, 0, { cast: true });
  addBox(board, 0.36, 0.5, 0.02, R._toon('#e5dcc6'), 0, 0.33, 0.035);
  addBox(board, 0.32, 0.025, 0.01, R.woodDark, 0, 0.46, 0.05);
  addBox(board, 0.24, 0.018, 0.01, R.woodDark, 0, 0.38, 0.05);
  addBox(board, 0.18, 0.018, 0.01, R.woodDark, 0, 0.31, 0.05);
  board.position.set(-9.3, baseY + 0.02, N.z1 + 0.86);
  board.rotation.y = -0.22;
  facade.add(board);
  // Upper floor window with curtain and balcony.
  addRounded(facade, 1.1, 1.26, 0.09, 0.03, R.woodDark, -10.95, baseY + 4.72, fz + 0.03, { cast: true });
  const upperWindow = addBox(facade, 0.94, 1.1, 0.025, R.neighborWindow, -10.95, baseY + 4.72, fz + 0.09);
  const curtainMat = R._toon('#c7a78f');
  addBox(facade, 0.22, 1.06, 0.05, curtainMat, -11.27, baseY + 4.72, fz + 0.12);
  addBox(facade, 0.16, 1.01, 0.055, curtainMat, -10.7, baseY + 4.7, fz + 0.12);
  addBox(facade, 0.035, 1.1, 0.035, R.woodDark, -10.95, baseY + 4.72, fz + 0.14);
  addBox(facade, 0.94, 0.035, 0.035, R.woodDark, -10.95, baseY + 4.72, fz + 0.14);
  // balcony floor and railing
  addRounded(facade, 1.45, 0.08, 0.46, 0.02, R.woodDark, -10.9, baseY + 4.05, N.z1 + 0.18, { cast: true });
  const railMat = R.metalDark;
  for (let i = 0; i < 9; i++) {
    addBox(facade, 0.022, 0.5, 0.022, railMat, -11.55 + i * 0.16, baseY + 4.34, N.z1 + 0.37);
  }
  addBox(facade, 1.42, 0.035, 0.035, railMat, -10.9, baseY + 4.58, N.z1 + 0.37);
  // potted plants on balcony
  for (let i = 0; i < 3; i++) {
    const px = -11.38 + i * 0.36;
    addRounded(facade, 0.16, 0.2, 0.16, 0.03, R.planter, px, baseY + 4.22, N.z1 + 0.16);
    const foliage = meshCyl(0.13, 0.06, 0.28, R.foliage, px, baseY + 4.43, N.z1 + 0.16, 7, { cast: true });
    foliage.scale.z = 0.8;
    facade.add(foliage);
  }
  // Vertical neon sign.
  const sign = new THREE.Group();
  const signX = -9.38;
  addRounded(sign, 0.5, 2.25, 0.16, 0.04, R.woodDark, signX, baseY + 5.0, N.z1 + 0.1, { cast: true });
  const signFace = new THREE.Mesh(planeGeo(0.4, 2.08), R.amaneSign);
  signFace.position.set(signX, baseY + 5.0, N.z1 + 0.19);
  sign.add(signFace);
  const wash = makeWallWash(assets, 0xffb27c, 0.22, 3.0, 3.6);
  wash.position.set(-10.1, baseY + 4.4, N.z1 + 0.06);
  sign.add(wash);
  root.add(sign);

  assembly.add(facade, { start: 2.4, duration: 0.9, mode: 'fade', land: true, landAt: [-10.4, baseY, N.z1] });
  assembly.add(sign, { start: 3.24, duration: 0.8, mode: 'rise', distance: 0.7, land: false });

  // Add pale windows on the alley-side wall.
  const side = new THREE.Group();
  root.add(side);
  addBox(side, 0.02, 0.92, 0.7, R.woodDark, N.x1 + 0.015, baseY + 4.4, -1.3);
  addBox(side, 0.025, 0.8, 0.58, R.neighborWindow, N.x1 + 0.03, baseY + 4.4, -1.3);
  addBox(side, 0.02, 0.6, 0.55, R.woodDark, N.x1 + 0.012, baseY + 2.2, -2.2);
  addBox(side, 0.025, 0.46, 0.42, R._toon('#2c3a3d'), N.x1 + 0.028, baseY + 2.2, -2.2);
  addBox(side, 0.02, 0.7, 0.58, R.woodDark, N.x1 + 0.015, baseY + 4.9, -5.35);
  addBox(side, 0.025, 0.58, 0.46, R.neighborWindow, N.x1 + 0.03, baseY + 4.9, -5.35);
  addBox(side, 0.025, 0.56, 0.03, R.wood, N.x1 + 0.04, baseY + 4.9, -5.35);
  // large faded painted advertisement on the exposed flank
  const adTex = makePaintedWallAd();
  const ad = new THREE.Mesh(planeGeo(5.6, 3.5),
    new THREE.MeshBasicMaterial({ map: adTex, transparent: true, opacity: 0.76, depthWrite: false, toneMapped: false })
  );
  ad.rotation.y = Math.PI / 2;
  ad.position.set(N.x1 + 0.014, baseY + 5.15, -4.0);
  ad.renderOrder = 1;
  side.add(ad);
  // side wall lamp above the alley
  addBox(side, 0.12, 0.18, 0.3, R.metalDark, N.x1 + 0.08, baseY + 3.28, -0.4);
  addBox(side, 0.05, 0.055, 0.19, R.warmLight, N.x1 + 0.13, baseY + 3.24, -0.4);
  assembly.add(side, { start: 3.05, duration: 0.6, mode: 'fade' });

  // Downpipe and utility details.
  const pipes = new THREE.Group();
  root.add(pipes);
  const dp = meshCyl(0.045, 0.045, 6.2, R.metalGalv, N.x0 + 0.13, baseY + 3.35, N.z1 + 0.06, 8);
  pipes.add(dp);
  const elbow = tubeFromPoints([
    new THREE.Vector3(N.x0 + 0.13, baseY + 0.45, N.z1 + 0.06),
    new THREE.Vector3(N.x0 + 0.13, baseY + 0.25, N.z1 + 0.27),
  ], 0.045, R.metalGalv, { segments: 4, radialSegments: 6 });
  pipes.add(elbow);
  addRounded(pipes, 0.4, 0.25, 0.14, 0.03, R.metal, N.x0 + 0.35, baseY + 1.6, N.z1 + 0.05);
  addRounded(pipes, 0.24, 0.16, 0.1, 0.02, R.metalDark, N.x0 + 0.35, baseY + 1.35, N.z1 + 0.09);
  assembly.add(pipes, { start: 3.0, duration: 0.6, mode: 'fade' });

  // Small AC on the alley side, high up.
  const ac = new THREE.Group();
  addRounded(ac, 0.8, 0.48, 0.38, 0.04, R.vendingCold, 0, 0, 0, { cast: true });
  const grille = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), R.metalDark);
  grille.rotation.y = Math.PI / 2;
  grille.position.x = 0.2;
  ac.add(grille);
  ac.position.set(N.x1 + 0.22, baseY + 3.45, -3.8);
  ac.rotation.y = Math.PI / 2;
  root.add(ac);
  // pipes under AC
  const acPipe = tubeFromPoints([
    new THREE.Vector3(N.x1 + 0.25, baseY + 3.2, -3.8),
    new THREE.Vector3(N.x1 + 0.32, baseY + 2.6, -3.6),
    new THREE.Vector3(N.x1 + 0.3, baseY + 0.5, -3.4),
  ], 0.028, R.metalGalv, { segments: 16, radialSegments: 5 });
  root.add(acPipe);
  assembly.add(ac, { start: 3.25, duration: 0.6, mode: 'pop' });

  // Roots near the facade.
  const vines = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), i % 2 ? R.foliageLight : R.foliage);
    leaf.position.set(N.x0 + 0.45 + Math.random() * 0.7, baseY + 3.1 + Math.random() * 0.6, N.z1 + 0.12);
    leaf.scale.set(1.3, 0.7, 0.55);
    vines.add(leaf);
  }
  root.add(vines);
  assembly.add(vines, { start: 3.4, duration: 0.5, mode: 'pop' });

  // Lights.
  const underAwning = new THREE.PointLight(0xffbd7a, 0, 4.5, 2.0);
  underAwning.position.set(-10.6, baseY + 2.58, N.z1 + 0.82);
  root.add(underAwning);
  assembly.addLight(underAwning, { start: 3.1, duration: 0.8, intensity: 9, flicker: true });
  // Fake neon bloom for the vertical sign (no extra dynamic light).
  const signGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xffb177,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  signGlow.scale.set(1.9, 2.4, 1);
  signGlow.position.set(-9.38, baseY + 5.0, N.z1 + 0.35);
  sign.add(signGlow);
  const lanternLight = new THREE.PointLight(0xffbd86, 0, 2.4, 2.0);
  lanternLight.position.set(-9.31, baseY + 2.35, N.z1 + 0.7);
  // The lantern itself is emissive; the awning spot supplies the neighbouring pool of light.

  updateList.push((time) => {
    lantern.rotation.y = Math.sin(time * 0.55) * 0.08;
  });

  return { root, body, roof, facade, sign, lantern, noren, neon: signGlow };
}

function buildCafe(scene, assets, R, assembly, updateList) {
  const C = LAYOUT.cafe;
  const root = new THREE.Group();
  root.name = 'yonagi-cafe';
  scene.add(root);
  const baseY = SIDEWALK_Y;
  const W = C.x1 - C.x0;
  const D = C.z1 - C.z0;
  const cx = (C.x0 + C.x1) / 2;
  const cz = (C.z0 + C.z1) / 2;
  const body = new THREE.Group();
  root.add(body);
  addBox(body, W, 6.45, D, R.cafeWall, cx, baseY + 3.225, cz, { cast: true });
  // street-level warm base wall
  addBox(body, W + 0.02, 2.95, D - 0.8, R.cafeWallWarm, cx, baseY + 1.48, cz - 0.05, { cast: true });
  addRounded(body, W + 0.12, 0.15, D + 0.08, 0.025, R.curbDark, cx, baseY + 0.07, cz, { cast: true });
  addBox(body, W + 0.12, 0.12, D + 0.06, R.curbDark, cx, baseY + 3.08, cz, { cast: true });
  // banding / cladding
  for (let i = 0; i < 7; i++) {
    addBox(body, W + 0.025, 0.018, 0.02, R.metalDark, cx, baseY + 1.0 + i * 0.7, C.z1 + 0.012);
  }
  // corner plaster ribs
  for (const x of [C.x0 + 0.16, C.x1 - 0.16]) {
    for (let i = 0; i < 12; i++) {
      addBox(body, 0.05, 0.02, 0.15, R.curbDark, x, baseY + 0.7 + i * 0.48, C.z1 + 0.01);
    }
  }
  // west face vertical drainpipes
  const pipes = new THREE.Group();
  root.add(pipes);
  for (const z of [C.z1 - 0.35, C.z0 + 1.0, C.z0 + 4.8]) {
    const p = meshCyl(0.05, 0.05, 6.2, R.metalGalv, C.x0 - 0.07, baseY + 3.2, z, 8);
    pipes.add(p);
  }
  const westBands = [];
  for (let i = 0; i < 8; i++) {
    const m = addBox(pipes, 0.03, 0.02, D + 0.02, R.metalDark, C.x0 - 0.06, baseY + 0.9 + i * 0.65, cz);
  }
  assembly.add(body, { start: 2.16, duration: 1.0, mode: 'grow', land: true, landAt: [cx, baseY, cz] });
  assembly.add(pipes, { start: 3.0, duration: 0.6, mode: 'fade' });

  // Roof with parapet, water tank and antenna.
  const roof = new THREE.Group();
  root.add(roof);
  addBox(roof, W + 0.18, 0.18, D + 0.18, R.cafeRoof, cx, baseY + 6.52, cz, { cast: true });
  addBox(roof, W + 0.22, 0.35, 0.12, R.cafeRoof, cx, baseY + 6.73, C.z1 + 0.04, { cast: true });
  addBox(roof, W + 0.22, 0.35, 0.12, R.cafeRoof, cx, baseY + 6.73, C.z0 - 0.04, { cast: true });
  addBox(roof, 0.12, 0.35, D + 0.22, R.cafeRoof, C.x0 - 0.04, baseY + 6.73, cz, { cast: true });
  addBox(roof, 0.12, 0.35, D + 0.22, R.cafeRoof, C.x1 + 0.04, baseY + 6.73, cz, { cast: true });
  // water tank
  const tank = new THREE.Group();
  tank.position.set(C.x0 + 1.0, baseY + 7.15, C.z0 + 2.3);
  for (const dx of [-0.3, 0.3]) for (const dz of [-0.3, 0.3]) {
    tank.add(meshCyl(0.025, 0.025, 0.55, R.metalGalv, dx, -0.27, dz, 5));
  }
  const tankBody = meshCyl(0.62, 0.62, 0.8, R.metalGalv, 0, 0.02, 0, 14);
  tank.add(tankBody);
  const tankTop = meshCyl(0.64, 0.64, 0.04, R.metal, 0, 0.44, 0, 14);
  tank.add(tankTop);
  addBox(tank, 0.2, 0.45, 0.06, R.metal, 0.53, -0.05, 0);
  roof.add(tank);
  // antenna
  const antenna = new THREE.Group();
  antenna.position.set(C.x0 + 2.1, baseY + 6.8, C.z0 + 5.5);
  antenna.add(meshCyl(0.018, 0.018, 2.0, R.metal, 0, 1.0, 0, 5));
  for (let i = 0; i < 3; i++) {
    addBox(antenna, 0.8 - i * 0.2, 0.018, 0.018, R.metal, 0, 1.25 + i * 0.27, 0);
  }
  roof.add(antenna);
  // roof access bulkhead
  addRounded(roof, 1.2, 0.75, 0.9, 0.035, R.cafeWallWarm, C.x0 + 1.2, baseY + 6.92, C.z0 + 0.8, { cast: true });
  assembly.add(roof, { start: 2.9, duration: 0.85, mode: 'drop', distance: 1.6, land: true, landAt: [cx, baseY + 6.4, cz] });

  // South facade: warm bar windows and noren.
  const facade = new THREE.Group();
  root.add(facade);
  const fz = C.z1 + 0.02;
  addRounded(facade, 1.7, 1.7, 0.1, 0.03, R.woodDark, C.x0 + 1.12, baseY + 1.6, fz + 0.015, { cast: true });
  addBox(facade, 1.5, 1.48, 0.025, R.cafeWindow, C.x0 + 1.12, baseY + 1.62, fz + 0.075);
  const cafeGlassTex = makeCafeWindowTexture();
  const cafeGlass = new THREE.Mesh(planeGeo(1.46, 1.44),
    new THREE.MeshBasicMaterial({ map: cafeGlassTex, transparent: false, toneMapped: false })
  );
  cafeGlass.position.set(C.x0 + 1.12, baseY + 1.62, fz + 0.09);
  facade.add(cafeGlass);
  for (let i = 0; i < 4; i++) {
    addBox(facade, 0.032, 1.4, 0.03, R.wood, C.x0 + 0.47 + i * 0.43, baseY + 1.6, fz + 0.1);
  }
  addBox(facade, 1.5, 0.04, 0.03, R.wood, C.x0 + 1.12, baseY + 1.2, fz + 0.1);
  // curtains behind the window
  for (let i = 0; i < 2; i++) {
    addBox(facade, 0.2, 1.38, 0.03, R._toon(i ? '#6b4d47' : '#806050'), C.x0 + 0.55 + i * 1.15, baseY + 1.62, fz + 0.06);
  }
  // Door.
  addRounded(facade, 1.05, 2.25, 0.12, 0.03, R.woodDark, C.x1 - 0.9, baseY + 1.2, fz + 0.03, { cast: true });
  addBox(facade, 0.85, 2.07, 0.03, R.cafeWindow, C.x1 - 0.9, baseY + 1.18, fz + 0.1);
  for (let i = 0; i < 4; i++) {
    addBox(facade, 0.028, 1.95, 0.03, R.wood, C.x1 - 1.25 + i * 0.23, baseY + 1.18, fz + 0.13);
  }
  // Noren.
  const noren = makeCloth(assets.cafeNoren, 1.12, 0.5, 10, 3);
  noren.position.set(C.x1 - 0.9, baseY + 2.12, fz + 0.24);
  facade.add(noren);
  updateList.push((time) => animateCloth(noren, time + 1.7, 0.024));
  // Nook awning and lantern.
  addRounded(facade, 2.9, 0.1, 0.78, 0.03, R.woodDark, cx, baseY + 2.9, C.z1 + 0.42, { cast: true });
  addBox(facade, 2.94, 0.065, 0.06, R.curbDark, cx, baseY + 2.82, C.z1 + 0.82);
  const lantern = buildLantern(assets, R, '夜凪', 0.68);
  lantern.position.set(C.x0 + 0.45, baseY + 2.55, C.z1 + 0.5);
  facade.add(lantern);
  const lantern2 = buildLantern(assets, R, '珈琲', 0.48);
  lantern2.position.set(C.x1 - 1.65, baseY + 2.53, C.z1 + 0.48);
  facade.add(lantern2);
  // Window warm wall wash
  const wash = makeWallWash(assets, 0xffad79, 0.24, 2.6, 2.2);
  wash.position.set(C.x0 + 1.0, baseY + 2.1, C.z1 + 0.03);
  facade.add(wash);
  const jazzPoster = new THREE.Mesh(planeGeo(0.52, 0.7), new THREE.MeshBasicMaterial({
    map: assets.posterJazz,
    toneMapped: false,
    color: 0xb49a8a,
  }));
  jazzPoster.position.set(C.x0 + 0.42, baseY + 1.82, C.z1 + 0.055);
  facade.add(jazzPoster);

  // Upper windows.
  const upper = new THREE.Group();
  root.add(upper);
  const addUpperWindow = (x, y, w = 0.9, h = 1.1, lit = true) => {
    addRounded(upper, w + 0.13, h + 0.15, 0.09, 0.03, R.woodDark, x, y, fz + 0.02, { cast: true });
    addBox(upper, w, h, 0.025, lit ? R.cafeWindow : R.neighborWindowDark, x, y, fz + 0.08);
    addBox(upper, 0.03, h, 0.025, R.wood, x, y, fz + 0.1);
    addBox(upper, w, 0.03, 0.025, R.wood, x, y, fz + 0.1);
    // curtain
    addBox(upper, w * 0.3, h * 0.92, 0.025, R._toon('#6b4d47'), x - w * 0.3, y, fz + 0.06);
  };
  addUpperWindow(C.x0 + 0.95, baseY + 4.75, 0.95, 1.2, true);
  addUpperWindow(C.x1 - 0.85, baseY + 4.75, 0.72, 1.05, false);
  // narrow windows along west face
  for (let i = 0; i < 4; i++) {
    const z = C.z0 + 2.0 + i * 2.1;
    addBox(upper, 0.02, 0.9, 0.62, R.woodDark, C.x0 - 0.02, baseY + 4.6, z);
    addBox(upper, 0.025, 0.76, 0.5, i === 1 ? R.cafeWindow : R.neighborWindowDark, C.x0 - 0.035, baseY + 4.6, z);
    addBox(upper, 0.02, 0.62, 0.54, R.woodDark, C.x0 - 0.02, baseY + 2.2, z + 0.3);
    addBox(upper, 0.025, 0.48, 0.42, R.neighborWindowDark, C.x0 - 0.035, baseY + 2.2, z + 0.3);
  }
  assembly.add(facade, { start: 2.58, duration: 0.9, mode: 'fade', land: true, landAt: [cx, baseY, C.z1] });
  assembly.add(upper, { start: 2.82, duration: 0.8, mode: 'fade' });

  // Vertical neon sign on the south-west corner.
  const sign = new THREE.Group();
  root.add(sign);
  addRounded(sign, 0.56, 2.7, 0.16, 0.04, R.woodDark, C.x0 + 0.35, baseY + 5.1, C.z1 + 0.1, { cast: true });
  const signFace = new THREE.Mesh(planeGeo(0.46, 2.52), R.cafeSign);
  signFace.position.set(C.x0 + 0.35, baseY + 5.1, C.z1 + 0.19);
  sign.add(signFace);
  // vivid magenta edge tubes around the vertical sign
  for (const x of [C.x0 + 0.35 - 0.26, C.x0 + 0.35 + 0.26]) {
    addBox(sign, 0.022, 2.62, 0.022, R.neonPink, x, baseY + 5.1, C.z1 + 0.205);
  }
  addBox(sign, 0.54, 0.022, 0.022, R.neonPink, C.x0 + 0.35, baseY + 5.1 + 1.29, C.z1 + 0.205);
  addBox(sign, 0.54, 0.022, 0.022, R.neonPink, C.x0 + 0.35, baseY + 5.1 - 1.29, C.z1 + 0.205);
  const pinkWash = makeWallWash(assets, 0xff87c2, 0.18, 2.8, 4.1);
  pinkWash.position.set(C.x0 + 0.9, baseY + 4.9, C.z1 + 0.05);
  sign.add(pinkWash);
  // neon sign faces the side street too
  const sideSign = signFace.clone();
  sideSign.rotation.y = Math.PI / 2;
  sideSign.position.set(C.x0 + 0.07, baseY + 5.1, C.z1 - 0.05);
  sign.add(sideSign);
  // a projecting small round sign on the west face
  const roundSign = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), R.cafeWindow);
  disc.rotation.y = Math.PI / 2;
  roundSign.add(disc);
  const discRim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 24), R.metalDark);
  discRim.rotation.y = Math.PI / 2;
  roundSign.add(discRim);
  roundSign.position.set(C.x0 - 0.35, baseY + 3.9, C.z1 - 0.55);
  const bracket = meshBox(0.5, 0.035, 0.035, R.metalDark, 0, 0, 0.25);
  roundSign.add(bracket);
  root.add(roundSign);
  assembly.add(roundSign, { start: 3.45, duration: 0.6, mode: 'drop', distance: 0.7 });
  assembly.add(sign, { start: 3.28, duration: 0.85, mode: 'rise', distance: 0.9 });

  // A small blinking bar sign above the rooftop parapet.
  const roofSign = new THREE.Group();
  const roofSignTex = makeRoundBarSign();
  const roundMat = new THREE.MeshBasicMaterial({
    map: roofSignTex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const round = new THREE.Mesh(planeGeo(1.15, 1.15), roundMat);
  round.position.set(C.x0 + 0.82, baseY + 7.58, C.z1 + 0.03);
  roofSign.add(round);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.035, 6, 24), R.neonPink);
  rim.position.set(C.x0 + 0.82, baseY + 7.58, C.z1 - 0.015);
  roofSign.add(rim);
  addBox(roofSign, 0.045, 1.0, 0.045, R.metalDark, C.x0 + 0.82, baseY + 6.9, C.z1 - 0.03);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xff75bd,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  glow.scale.set(2.5, 2.5, 1);
  glow.position.set(C.x0 + 0.82, baseY + 7.58, C.z1 + 0.1);
  roofSign.add(glow);
  roof.add(roofSign);

  // warm and magenta light sources
  const shopLight = new THREE.PointLight(0xffb17c, 0, 5.5, 2.0);
  shopLight.position.set(C.x0 + 1.0, baseY + 2.1, C.z1 + 0.8);
  root.add(shopLight);
  assembly.addLight(shopLight, { start: 3.0, duration: 0.9, intensity: 11, flicker: false });
  // soft magenta aura around the vertical sign
  const cafeGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xff74bb,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  cafeGlow.scale.set(2.1, 3.3, 1);
  cafeGlow.position.set(C.x0 + 0.35, baseY + 5.05, C.z1 + 0.35);
  sign.add(cafeGlow);

  // wall-mounted AC and service clutter along the west face
  const westDetails = new THREE.Group();
  root.add(westDetails);
  for (let i = 0; i < 2; i++) {
    const ac = new THREE.Group();
    addRounded(ac, 0.78, 0.46, 0.36, 0.04, R.vendingCold, 0, 0, 0, { cast: true });
    const gr = new THREE.Mesh(new THREE.CircleGeometry(0.14, 14), R.metalDark);
    gr.rotation.y = Math.PI / 2;
    gr.position.x = 0.19;
    ac.add(gr);
    ac.position.set(C.x0 - 0.22, baseY + 2.4 + i * 1.5, C.z0 + 2.1 + i * 3.4);
    ac.rotation.y = Math.PI / 2;
    westDetails.add(ac);
  }
  // ground-level crates and pipe along the side street
  for (let i = 0; i < 3; i++) {
    addRounded(westDetails, 0.52, 0.33, 0.4, 0.03, R._toon(i === 1 ? '#5c6b59' : '#6f5348'),
      C.x0 - 0.4, baseY + 0.2 + i * 0.31, C.z1 - 1.0 - (i % 2) * 0.1, { cast: true });
  }
  addBox(westDetails, 0.02, 2.5, 0.02, R.woodDark, C.x0 - 0.54, baseY + 1.3, C.z1 - 1.0);
  assembly.add(westDetails, { start: 3.4, duration: 0.7, mode: 'fade' });

  // Lit windows and a small neon strip on the east flank, visible when the
  // model is viewed from the street side.
  const eastDetail = new THREE.Group();
  root.add(eastDetail);
  const eastX = C.x1 + 0.025;
  for (let i = 0; i < 3; i++) {
    const z = -1.9 - i * 2.55;
    const y = baseY + (i === 1 ? 4.55 : 4.2);
    addBox(eastDetail, 0.025, 1.02, 0.72, R.woodDark, eastX, y, z);
    addBox(eastDetail, 0.03, 0.88, 0.58, i === 2 ? R.neighborWindowDark : R.cafeWindow, eastX + 0.02, y, z);
    addBox(eastDetail, 0.02, 0.9, 0.025, R.woodDark, eastX + 0.035, y, z);
    addBox(eastDetail, 0.04, 0.08, 0.92, R.woodDark, eastX, y + 0.53, z);
    // a small metal shutter box
    if (i === 0) {
      addBox(eastDetail, 0.1, 0.32, 0.7, R.metalGalv, eastX + 0.04, baseY + 2.4, z);
    }
  }
  addBox(eastDetail, 0.035, 2.4, 0.04, R.neonPink, eastX + 0.02, baseY + 3.6, -0.45);
  addBox(eastDetail, 0.035, 0.8, 0.04, R.neonOrange, eastX + 0.02, baseY + 3.5, -0.75);
  for (let i = 0; i < 4; i++) {
    addBox(eastDetail, 0.03, 0.018, 3.5, R.metalDark, eastX + 0.01, baseY + 0.8 + i * 0.72, -4.3);
  }
  addBox(eastDetail, 0.03, 4.2, 0.03, R.metalGalv, eastX + 0.045, baseY + 4.2, -0.3);
  // Faded painted coffee advert on the broad east flank.
  const sideAdTex = makeCafeSideAdTexture();
  const sideAd = new THREE.Mesh(planeGeo(5.2, 3.0), new THREE.MeshBasicMaterial({
    map: sideAdTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    toneMapped: false,
  }));
  sideAd.rotation.y = Math.PI / 2;
  sideAd.position.set(eastX + 0.015, baseY + 5.15, -5.8);
  sideAd.renderOrder = 1;
  eastDetail.add(sideAd);
  assembly.add(eastDetail, { start: 3.36, duration: 0.7, mode: 'fade' });

  updateList.push((time) => {
    lantern.rotation.y = Math.sin(time * 0.45 + 1.4) * 0.09;
  });

  return { root, body, roof, facade, upper, sign, lantern, noren, neon: cafeGlow };
}

function buildAlley(scene, assets, R, assembly, updateList) {
  const N = LAYOUT.neighbor;
  const S = { x0: -7.8 };
  const root = new THREE.Group();
  root.name = 'alley';
  scene.add(root);
  const x0 = N.x1;
  const x1 = S.x0;
  const cx = (x0 + x1) / 2;
  const baseY = SIDEWALK_Y;
  // Dark stone path into the alley.
  addBox(root, x1 - x0, 0.045, 4.0, R._standard('#303637', { roughness: 0.4, metalness: 0.1 }), cx, baseY + 0.02, -1.0);
  // Back wall closes the alleyscape.
  addBox(root, x1 - x0, 3.9, 0.14, R._toon('#3b3a36'), cx, baseY + 1.95, -3.0, { cast: true });
  addBox(root, x1 - x0, 0.2, 4.3, R.curbDark, cx, baseY + 3.9, -1.0, { cast: true });
  // Door at the end.
  addBox(root, 0.62, 1.85, 0.04, R.woodDark, cx + 0.15, baseY + 0.95, -2.9);
  addBox(root, 0.48, 1.55, 0.02, R._toon('#655144'), cx + 0.15, baseY + 0.92, -2.86);
  addBox(root, 0.03, 1.5, 0.02, R.wood, cx + 0.15, baseY + 0.9, -2.82);
  // pipes and vents
  const pipe = meshCyl(0.055, 0.055, 3.1, R.metalGalv, x0 + 0.15, baseY + 1.55, -1.4, 8);
  root.add(pipe);
  const pipe2 = meshCyl(0.035, 0.035, 3.0, R.metal, x1 - 0.14, baseY + 1.5, -0.5, 7);
  root.add(pipe2);
  addBox(root, 0.4, 0.58, 0.18, R.metal, x1 - 0.28, baseY + 2.2, -1.7);
  for (let i = 0; i < 5; i++) {
    addBox(root, 0.32, 0.018, 0.02, R.metalDark, x1 - 0.28, baseY + 1.99 + i * 0.11, -1.6);
  }
  // Crates by the wall.
  for (let i = 0; i < 4; i++) {
    const c = addRounded(root, 0.55, 0.32, 0.42, 0.03, R._toon(i % 2 ? '#5b4c3d' : '#4b554e'),
      x0 + 0.45, baseY + 0.18 + (i > 1 ? 0.32 : 0), -1.0 + (i % 2) * 0.48, { cast: true });
    c.rotation.y = (i % 2) * 0.08;
  }
  // A puddle catching the local neon.
  const puddle = new THREE.Mesh(planeGeo(0.8, 1.8),
    new THREE.MeshBasicMaterial({ color: 0x1a2427, transparent: true, opacity: 0.55, depthWrite: false })
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(cx + 0.05, baseY + 0.056, -0.6);
  root.add(puddle);
  const fakeRefl = new THREE.Mesh(planeGeo(0.6, 1.7),
    new THREE.MeshBasicMaterial({
      map: assets.streak, transparent: true, opacity: 0.18, color: 0xff8f6a,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    })
  );
  fakeRefl.rotation.x = -Math.PI / 2;
  fakeRefl.rotation.z = Math.PI;
  fakeRefl.position.set(cx + 0.05, baseY + 0.062, -0.6);
  root.add(fakeRefl);
  // Noren across the alley entrance.
  const norenTex = makeNorenTexture('路地', 'RAIN ALLEY');
  const noren = makeCloth(norenTex, x1 - x0 - 0.15, 0.65, 10, 3);
  noren.position.set(cx, baseY + 2.65, 1.27);
  noren.rotation.x = 0.03;
  root.add(noren);
  updateList.push((time) => animateCloth(noren, time + 0.8, 0.025));
  // Hanging lantern.
  const lantern = buildLantern(assets, R, '雨', 0.6);
  lantern.position.set(x1 - 0.4, baseY + 2.35, 1.32);
  root.add(lantern);
  updateList.push((time) => { lantern.rotation.z = Math.sin(time * 0.6 + 0.5) * 0.08; });
  // Small illuminated alley sign at the entrance, projecting toward the street.
  const alleySign = new THREE.Group();
  addRounded(alleySign, 1.08, 0.62, 0.08, 0.025, R.woodDark, cx, baseY + 3.12, 1.82);
  const alleySignTex = makeAlleySignTexture();
  const alleyFace = new THREE.Mesh(planeGeo(1.0, 0.54),
    new THREE.MeshBasicMaterial({ map: alleySignTex, toneMapped: false })
  );
  alleyFace.position.set(cx, baseY + 3.12, 1.87);
  alleySign.add(alleyFace);
  const alleyFaceBack = alleyFace.clone();
  alleyFaceBack.rotation.y = Math.PI;
  alleyFaceBack.position.z = 1.77;
  alleySign.add(alleyFaceBack);
  for (const x of [cx - 0.33, cx + 0.33]) {
    addBox(alleySign, 0.018, 0.38, 0.018, R.metalDark, x, baseY + 3.57, 1.82);
  }
  // tiny warm halo above the sign
  const alleySignGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xffc690,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  alleySignGlow.scale.set(2.2, 1.2, 1);
  alleySignGlow.position.set(cx, baseY + 3.1, 2.02);
  alleySign.add(alleySignGlow);
  root.add(alleySign);
  // Neon strip on the store wall.
  addBox(root, 0.03, 1.1, 0.02, R.neonPink, x1 - 0.02, baseY + 2.5, -1.0);
  addBox(root, 0.03, 0.8, 0.02, R.neonOrange, x1 - 0.02, baseY + 2.3, -1.75);
  addBox(root, 0.02, 1.45, 0.02, R.neonPink, x0 + 0.01, baseY + 2.0, 0.35);
  // Steam drifting out of the alley.
  const steamMat = new THREE.SpriteMaterial({
    map: assets.steam,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    color: 0xffd4b1,
  });
  const steams = [];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Sprite(steamMat.clone());
    s.position.set(cx + (i % 2 ? 0.2 : -0.15), baseY + 0.75 + i * 0.12, 0.65 + i * 0.15);
    s.scale.set(0.85, 1.4, 1);
    s.userData.phase = i * 1.7;
    root.add(s);
    steams.push(s);
  }
  updateList.push((time) => {
    for (const s of steams) {
      const p = (time * 0.22 + s.userData.phase) % 1;
      s.position.y = baseY + 0.55 + p * 2.0;
      s.position.x = cx + (s.userData.phase % 1) * 0.35 + Math.sin(time * 0.6 + s.userData.phase) * 0.12;
      s.material.opacity = 0.025 + 0.055 * Math.sin(p * Math.PI) * (1 - p);
      s.scale.set(0.7 + p * 0.5, 1.1 + p * 1.1, 1);
    }
  });
  // Old sign and wall switches.
  addRounded(root, 0.48, 0.3, 0.1, 0.02, R.woodDark, x0 + 0.33, baseY + 2.0, -2.2);
  addBox(root, 0.38, 0.18, 0.02, R._toon('#d8cda9'), x0 + 0.33, baseY + 2.0, -2.14);
  // vent with steam will be animated elsewhere
  const vent = addBox(root, 0.32, 0.26, 0.08, R.metal, x1 - 0.16, baseY + 0.7, -2.6);
  for (let i = 0; i < 3; i++) addBox(root, 0.24, 0.02, 0.03, R.metalDark, x1 - 0.16, baseY + 0.62 + i * 0.06, -2.55);
  // Light sources.
  const lampLight = new THREE.PointLight(0xffa67b, 0, 3.6, 2.0);
  lampLight.position.set(cx, baseY + 2.35, 0.9);
  root.add(lampLight);
  assembly.addLight(lampLight, { start: 3.5, duration: 0.8, intensity: 6 });
  // The neon strip itself is emissive; a soft sprite supplies the local glow.
  const alleyPinkGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xff5aa6,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  alleyPinkGlow.scale.set(1.4, 2.2, 1);
  alleyPinkGlow.position.set(x1 - 0.3, baseY + 2.0, -1.3);
  root.add(alleyPinkGlow);

  assembly.add(root, { start: 2.5, duration: 0.9, mode: 'fade' });
  return { root, noren, lantern };
}

export function buildNeighborhood(scene, assets, R, assembly) {
  const updateList = [];
  const neighbor = buildNeighbor(scene, assets, R, assembly, updateList);
  const cafe = buildCafe(scene, assets, R, assembly, updateList);
  const alley = buildAlley(scene, assets, R, assembly, updateList);

  return {
    neighbor,
    cafe,
    alley,
    update(time, dt) {
      for (const fn of updateList) fn(time, dt);
    },
  };
}
