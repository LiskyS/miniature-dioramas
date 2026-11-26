import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeInOutCubic = (t) => {
  t = clamp(t, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutQuint = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);
export const easeOutBack = (t, s = 1.4) => {
  t = clamp(t, 0, 1);
  const c3 = s + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
};
export const easeOutElastic = (t) => {
  t = clamp(t, 0, 1);
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};

let MAX_ANISOTROPY = 8;
export function setMaxAnisotropy(v) {
  MAX_ANISOTROPY = Math.max(1, v || 1);
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function canvasTexture(w, h, draw, opts = {}) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = MAX_ANISOTROPY;
  tex.wrapS = opts.wrapS ?? THREE.ClampToEdgeWrapping;
  tex.wrapT = opts.wrapT ?? THREE.ClampToEdgeWrapping;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  if (opts.flipY !== undefined) tex.flipY = opts.flipY;
  tex.minFilter = opts.minFilter ?? THREE.LinearFilter;
  tex.magFilter = opts.magFilter ?? THREE.LinearFilter;
  tex.generateMipmaps = opts.generateMipmaps ?? true;
  tex.needsUpdate = true;
  return tex;
}

const roundedGeoCache = new Map();
export function roundedBoxGeo(w, h, d, r = 0.04, seg = 2) {
  const rr = Math.max(0.001, Math.min(r, w * 0.48, h * 0.48, d * 0.48));
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${rr.toFixed(3)}|${seg}`;
  if (!roundedGeoCache.has(key)) {
    roundedGeoCache.set(key, new RoundedBoxGeometry(w, h, d, seg, rr));
  }
  return roundedGeoCache.get(key);
}

const geoCache = new Map();
export function boxGeo(w, h, d) {
  const key = `b|${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}
export function planeGeo(w, h) {
  const key = `p|${w.toFixed(3)}|${h.toFixed(3)}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.PlaneGeometry(w, h));
  return geoCache.get(key);
}
export function cylGeo(rt, rb, h, seg = 8, open = false) {
  const key = `c|${rt.toFixed(3)}|${rb.toFixed(3)}|${h.toFixed(3)}|${seg}|${open}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));
  return geoCache.get(key);
}

export function meshBox(w, h, d, material, x = 0, y = 0, z = 0, opts = {}) {
  const geo = opts.round ? roundedBoxGeo(w, h, d, opts.radius ?? 0.035, opts.roundSeg ?? 2) : boxGeo(w, h, d);
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = opts.cast ?? false;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

export function meshRounded(w, h, d, r, material, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(roundedBoxGeo(w, h, d, r, opts.roundSeg ?? 2), material);
  m.position.set(x, y, z);
  m.castShadow = opts.cast ?? false;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

export function meshCyl(rt, rb, h, material, x = 0, y = 0, z = 0, seg = 8, opts = {}) {
  const m = new THREE.Mesh(cylGeo(rt, rb, h, seg, opts.open), material);
  m.position.set(x, y, z);
  m.castShadow = opts.cast ?? false;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

export function labelPlane(w, h, texture, opts = {}) {
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: opts.transparent ?? true,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.DoubleSide,
    depthWrite: false,
    alphaTest: opts.alphaTest ?? 0.01,
    toneMapped: false,
    blending: opts.blending ?? THREE.NormalBlending,
    color: opts.color ?? 0xffffff,
  });
  const mesh = new THREE.Mesh(planeGeo(w, h), mat);
  if (opts.position) mesh.position.copy(opts.position);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  mesh.renderOrder = opts.renderOrder ?? 2;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function cylinderBetween(a, b, radius, material, radialSegments = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const m = new THREE.Mesh(cylGeo(radius, radius, length, radialSegments, false), material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = false;
  m.receiveShadow = true;
  return m;
}

export function tubeFromPoints(points, radius, material, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', opts.tension ?? 0.5);
  const geo = new THREE.TubeGeometry(curve, opts.segments ?? 24, radius, opts.radialSegments ?? 5, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.userData.curve = curve;
  return mesh;
}

export function makeRadialTexture(size, stops) {
  return canvasTexture(size, size, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (const [pos, color] of stops) g.addColorStop(pos, color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeContactShadow(w = 2, d = 2, opacity = 0.36, tint = '6,10,17') {
  const tex = canvasTexture(128, 128, (ctx, cw, ch) => {
    ctx.clearRect(0, 0, cw, ch);
    const g = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.06, cw / 2, ch / 2, cw * 0.5);
    g.addColorStop(0, `rgba(${tint},${opacity * 2.2})`);
    g.addColorStop(0.35, `rgba(${tint},${opacity})`);
    g.addColorStop(0.72, `rgba(${tint},${opacity * 0.45})`);
    g.addColorStop(1, `rgba(${tint},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  });
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(planeGeo(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  m.userData.isContactShadow = true;
  return m;
}

export function addContactShadow(parent, w, d, x, z, y = 0.015, opacity = 0.36, rot = 0) {
  const m = makeContactShadow(w, d, opacity);
  m.position.set(x, y, z);
  m.rotation.z = rot;
  parent.add(m);
  return m;
}

export function setShadows(root, cast = true, receive = true) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.isGlow || o.userData.isContactShadow) return;
    o.castShadow = cast;
    o.receiveShadow = receive;
  });
}

export function tintMaterial(material, color, intensity = 1) {
  material.color.set(color).multiplyScalar(intensity);
  return material;
}

export function makeGroup(name = '') {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

export function rng(seed = 1337) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function worldPos(object) {
  object.updateWorldMatrix(true, false);
  return new THREE.Vector3().setFromMatrixPosition(object.matrixWorld);
}

export function disposeObject(object) {
  object.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
  });
}
