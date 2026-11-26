import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setMaxAnisotropy, clamp, smoothstep, easeInOutCubic } from './core/utils.js';
import { createAssets } from './core/assets.js';
import { createMaterials } from './core/materials.js';
import { PostFX } from './core/postfx.js';
import { Assembly } from './assembly.js';
import { createSky } from './world/sky.js';
import { buildBase } from './world/base.js';
import { buildPostOffice } from './world/postOffice.js';
import { buildTown } from './world/town.js';
import { buildStreet } from './world/street.js';
import { Snowfall, createSnowSparkles } from './effects/snow.js';
import { ConstructionFX } from './effects/construction.js';

THREE.ColorManagement.enabled = false;

const params = new URLSearchParams(window.location.search);
const viewAspect = window.innerWidth / window.innerHeight;
const frameScale = Math.min(2.2, Math.max(1, 1.05 / viewAspect));
const defaultTarget = new THREE.Vector3(-0.3, 2.5, -0.3);
const defaultCamera = new THREE.Vector3(18.4, 10.0, 22.6)
  .sub(defaultTarget)
  .multiplyScalar(frameScale)
  .add(defaultTarget);
const introTarget = new THREE.Vector3(-0.2, 3.3, -0.1);
const introCamera = new THREE.Vector3(27.2, 15.8, 31.0)
  .sub(introTarget)
  .multiplyScalar(Math.min(2.25, frameScale * 1.04))
  .add(introTarget);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.3, 320);
camera.position.copy(introCamera);
camera.lookAt(defaultTarget);

const dprCap = window.innerWidth < 760 ? 1.35 : 1.6;
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  stencil: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.autoClear = true;
document.body.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', '小樽豊川郵便局冬日雪景微缩模型');

setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

const assets = createAssets();
const R = createMaterials(assets);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(introTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.062;
controls.enablePan = false;
controls.minDistance = 5.0;
controls.maxDistance = Math.max(45, defaultCamera.distanceTo(defaultTarget) + 22);
controls.minPolarAngle = 0.23;
controls.maxPolarAngle = 1.37;
controls.rotateSpeed = 0.72;
controls.zoomSpeed = 0.82;
controls.enabled = true;
controls.update();

const postfx = new PostFX(renderer);
postfx.setSize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, dprCap));
postfx.bloomStrength = 0.16;
postfx.outlineStrength = 0.82;
postfx.grainStrength = 0.011;
postfx.vignetteStrength = 0.28;

const sky = createSky(scene, assets);
scene.fog.density = Math.min(0.011, 0.011 * 32 / defaultCamera.distanceTo(defaultTarget));

// Soft overcast daylight: broad sky fill, one very weak key for form, and a cool rim.
const hemi = new THREE.HemisphereLight(0xd8e7ef, 0x77827f, 0.92);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xeff5f5, 0.76);
key.position.set(-15, 20, 12);
key.target.position.set(-0.5, 1.5, -0.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -15;
key.shadow.camera.right = 15;
key.shadow.camera.top = 15;
key.shadow.camera.bottom = -15;
key.shadow.camera.near = 1;
key.shadow.camera.far = 55;
key.shadow.bias = -0.00035;
key.shadow.normalBias = 0.035;
key.shadow.radius = 4.2;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xb9d1dc, 0.23);
rim.position.set(12, 8, 13);
scene.add(rim);
// A very soft front bounce keeps the facade from going muddy under the
// overcast key, without losing the cool exterior mood.
const facadeFill = new THREE.DirectionalLight(0xf2ede1, 0.16);
facadeFill.position.set(5, 9, 17);
scene.add(facadeFill);
const coolFill = new THREE.DirectionalLight(0xbccbd3, 0.12);
coolFill.position.set(-6, 5, -14);
scene.add(coolFill);

const assembly = new Assembly();
const base = buildBase(scene, assets, R, assembly);
const town = buildTown(scene, assets, R, assembly);
const postOffice = buildPostOffice(scene, assets, R, assembly);
const street = buildStreet(scene, assets, R, assembly);

const snow = new Snowfall();
scene.add(snow.mesh);
const sparkles = createSnowSparkles(scene, assets.spark);
const constructionFX = new ConstructionFX(scene, assets);
assembly.onSettle = (position, item) => {
  constructionFX.spawn(position, item.start < 2.0 ? 1.6 : 1.0);
};

// ---------------------------------------------------------------------------
// Shader and light prewarm
// ---------------------------------------------------------------------------
scene.updateMatrixWorld(true);
const pointLights = [];
scene.traverse((o) => {
  if (o.isPointLight) pointLights.push(o);
});
for (const light of pointLights) {
  scene.attach(light);
  light.visible = true;
  light.intensity = 0;
}

function prewarmShaders() {
  const visibility = new Map();
  scene.traverse((o) => visibility.set(o, o.visible));
  for (const o of visibility.keys()) o.visible = true;
  try {
    renderer.compile(scene, camera);
    const rt = new THREE.WebGLRenderTarget(64, 64, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
    });
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(prev);
    rt.dispose();
  } catch (err) {
    console.warn('Shader prewarm skipped:', err);
  }
  for (const [o, visible] of visibility) o.visible = visible;
  for (const light of pointLights) light.intensity = 0;
  renderer.shadowMap.needsUpdate = true;
}
prewarmShaders();

postfx.fade = 0;
postfx.render(scene, camera, 0);

let introActive = !params.get('skip');
if (!introActive) {
  camera.position.copy(defaultCamera);
  controls.target.copy(defaultTarget);
  controls.update();
}
const debugTimeFrozen = params.get('debugtime') === '1';
let frozenTime = debugTimeFrozen ? 0 : null;
let clockStart = null;
let elapsed = 0;
let introTime = 0;
let assemblyStarted = false;
let fade = 0;
let shadowsFrozen = false;
let lastTime = performance.now() / 1000;

function stopIntro() {
  if (!introActive) return;
  introActive = false;
}

renderer.domElement.addEventListener('pointerdown', stopIntro, { passive: true });
renderer.domElement.addEventListener('wheel', stopIntro, { passive: true });
renderer.domElement.addEventListener('touchstart', stopIntro, { passive: true });
controls.addEventListener('start', stopIntro);

function updateIntro(dt) {
  if (!introActive) return;
  introTime += dt;
  const t = clamp(introTime / 5.1, 0, 1);
  const e = easeInOutCubic(t);
  camera.position.lerpVectors(introCamera, defaultCamera, e);
  controls.target.lerpVectors(introTarget, defaultTarget, e);
  if (t >= 1) introActive = false;
}

function animate() {
  const now = performance.now() / 1000;
  let dt = Math.min(0.05, now - lastTime);
  lastTime = now;

  if (frozenTime !== null) {
    elapsed = frozenTime;
    dt = 0;
  } else {
    if (clockStart === null) clockStart = now;
    elapsed = now - clockStart;
  }

  updateIntro(dt);
  if (!assemblyStarted) {
    assemblyStarted = true;
    assembly.update(0);
  }
  assembly.update(elapsed);
  controls.update();

  postOffice.update(elapsed, dt);
  base.update?.(elapsed);
  town.update?.(elapsed, dt);
  street.update?.(elapsed, dt);

  const snowIn = clamp((elapsed - 5.45) / 2.3, 0, 1);
  snow.update(elapsed, snowIn * 0.84);
  sparkles.update(elapsed, smoothstep(6.2, 7.8, elapsed) * 0.55);
  constructionFX.update(dt, elapsed);

  if (!shadowsFrozen && assembly.done) {
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    shadowsFrozen = true;
  }

  fade = clamp(elapsed / 1.05, 0, 1);
  postfx.fade = fade;
  postfx.render(scene, camera, elapsed);

  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const cap = window.innerWidth < 760 ? 1.35 : 1.6;
  const effDpr = Math.min(window.devicePixelRatio || 1, cap);
  renderer.setPixelRatio(effDpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  postfx.setSize(window.innerWidth, window.innerHeight, effDpr);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') window.location.reload();
});

window.__DIORAMA__ = {
  THREE,
  scene,
  camera,
  controls,
  renderer,
  assembly,
  postOffice,
  town,
  street,
  snow,
  setView(pos, target) {
    introActive = false;
    camera.position.set(pos[0], pos[1], pos[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.update();
  },
  setTime(t) {
    frozenTime = Math.max(0, t);
    introActive = false;
    controls.enabled = true;
  },
  finish() {
    assembly.finish();
    introActive = false;
    camera.position.copy(defaultCamera);
    controls.target.copy(defaultTarget);
    controls.update();
  },
  pick(px, py) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2((px / window.innerWidth) * 2 - 1, -(py / window.innerHeight) * 2 + 1), camera);
    return rc.intersectObjects(scene.children, true).slice(0, 10).map((h) => ({
      type: h.object.type,
      name: h.object.name,
      point: h.point.toArray().map((v) => +v.toFixed(2)),
      distance: +h.distance.toFixed(2),
    }));
  },
  get elapsed() { return elapsed; },
  get triangles() { return renderer.info.render.triangles; },
  get calls() { return renderer.info.render.calls; },
};

requestAnimationFrame(animate);







