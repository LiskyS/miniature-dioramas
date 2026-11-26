import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setMaxAnisotropy, clamp, easeInOutCubic, smoothstep } from './core/utils.js';
import { createAssets } from './core/assets.js';
import { createMaterials } from './core/materials.js';
import { PostFX } from './core/postfx.js';
import { Assembly } from './assembly.js';
import { createSky } from './world/sky.js';
import { buildBase } from './world/base.js';
import { buildForest } from './world/forest.js';
import { buildProps } from './world/props.js';
import { buildCabin } from './world/cabin.js';
import { Snowfall, createSnowSparkles } from './effects/snow.js';
import { ConstructionFX } from './effects/construction.js';

THREE.ColorManagement.enabled = false;

const params = new URLSearchParams(window.location.search);

const viewAspect = window.innerWidth / window.innerHeight;
const frameScale = Math.min(2.2, Math.max(1, 1.05 / viewAspect));
const defaultTarget = new THREE.Vector3(-0.2, 2.8, -0.4);
const defaultCamera = new THREE.Vector3(19.1, 12.15, 23.4)
  .sub(defaultTarget)
  .multiplyScalar(frameScale)
  .add(defaultTarget);
const introTarget = new THREE.Vector3(-0.3, 4.1, -0.2);
const introCamera = new THREE.Vector3(28.7, 18.6, 33.2)
  .sub(introTarget)
  .multiplyScalar(Math.min(2.3, frameScale * 1.04))
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
renderer.domElement.setAttribute('aria-label', '雪夜森林木屋微缩模型');

setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

const assets = createAssets();
const R = createMaterials(assets);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(introTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.062;
controls.enablePan = false;
controls.minDistance = 10.5;
controls.maxDistance = Math.max(45, defaultCamera.distanceTo(defaultTarget) + 22);
controls.minPolarAngle = 0.22;
controls.maxPolarAngle = 1.38;
controls.rotateSpeed = 0.72;
controls.zoomSpeed = 0.82;
controls.enabled = true;
controls.update();

const postfx = new PostFX(renderer);
postfx.setSize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, dprCap));
postfx.outlineStrength = 1.15;
postfx.bloomStrength = 0.62;
postfx.grainStrength = 0.019;
postfx.vignetteStrength = 0.5;

const sky = createSky(scene, assets);
scene.fog.density = Math.min(0.0125, 0.0125 * 32 / defaultCamera.distanceTo(defaultTarget));

// Cold moonlit night, with a warm pocket of light inside the cabin.
const hemi = new THREE.HemisphereLight(0x8baecf, 0x11161d, 0.62);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xc2dcff, 1.9);
moon.position.set(-14, 20, 13);
moon.target.position.set(-0.5, 1.7, -1.2);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -15;
moon.shadow.camera.right = 15;
moon.shadow.camera.top = 15;
moon.shadow.camera.bottom = -15;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 55;
moon.shadow.bias = -0.00035;
moon.shadow.normalBias = 0.035;
moon.shadow.radius = 2.4;
scene.add(moon, moon.target);
const rim = new THREE.DirectionalLight(0x83a9cf, 0.34);
rim.position.set(14, 8, 16);
scene.add(rim);

const assembly = new Assembly();
const base = buildBase(scene, assets, R, assembly);
const forest = buildForest(scene, assets, R, assembly);
const props = buildProps(scene, assets, R, assembly);
const cabin = buildCabin(scene, assets, R, assembly);

const snow = new Snowfall();
scene.add(snow.mesh);
const sparkles = createSnowSparkles(scene, assets.spark);
const constructionFX = new ConstructionFX(scene, assets);
assembly.onSettle = (position, item) => {
  constructionFX.spawn(position, item.start < 2.0 ? 1.7 : 1.05);
};

// ---------------------------------------------------------------------------
// Shader and light prewarm
// ---------------------------------------------------------------------------
// Keep the number of point lights constant for the whole performance. This
// avoids shader recompiles when the cabin's interior, lanterns, and fire appear.
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

// Compile the post-processing programs while the screen is still dark.
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
  const t = clamp(introTime / 5.4, 0, 1);
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

  base.update(elapsed);
  forest.update(elapsed, dt);
  cabin.update(elapsed, dt);
  props.update(elapsed, dt);

  const snowIn = clamp((elapsed - 4.7) / 2.4, 0, 1);
  snow.update(elapsed, snowIn * 0.9);
  sparkles.update(elapsed, smoothstep(5.8, 7.2, elapsed) * 0.85);
  constructionFX.update(dt, elapsed);

  if (!shadowsFrozen && assembly.done) {
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    shadowsFrozen = true;
  }

  fade = clamp(elapsed / 1.15, 0, 1);
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
  cabin,
  snow,
  forest,
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

// First visible frame is intentionally black; the model appears with the
// camera move and the assembly animation.
requestAnimationFrame(animate);
