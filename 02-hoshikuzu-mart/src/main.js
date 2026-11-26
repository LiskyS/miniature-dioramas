import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setMaxAnisotropy, easeInOutCubic, clamp } from './core/utils.js';
import { createAssets } from './core/assets.js';
import { createMaterials } from './core/materials.js';
import { PostFX } from './core/postfx.js';
import { Assembly } from './assembly.js';
import { createSky } from './world/sky.js';
import { buildBase } from './world/base.js';
import { buildStore } from './world/store.js';
import { buildNeighborhood } from './world/neighborhood.js';
import { buildStreetProps } from './world/streetProps.js';
import { RainSystem, createMist } from './effects/rain.js';
import { ConstructionFX } from './effects/construction.js';

THREE.ColorManagement.enabled = false;

const params = new URLSearchParams(window.location.search);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.25, 140);
const defaultCamera = new THREE.Vector3(20.1, 13.1, 23.2);
const defaultTarget = new THREE.Vector3(-1.5, 3.1, -0.35);
camera.position.set(29.0, 18.6, 32.5);
camera.lookAt(defaultTarget);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  stencil: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.autoClear = true;
document.body.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', '雨夜便利店街角微缩模型');

const maxAniso = renderer.capabilities.getMaxAnisotropy();
setMaxAnisotropy(maxAniso);

const assets = createAssets();
const R = createMaterials(assets);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(defaultTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 11;
controls.maxDistance = 42;
controls.minPolarAngle = 0.2;
controls.maxPolarAngle = 1.39;
controls.rotateSpeed = 0.75;
controls.zoomSpeed = 0.8;
controls.target.copy(defaultTarget);
controls.update();

const postfx = new PostFX(renderer);
postfx.setSize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);

const sky = createSky(scene, assets);

// Ambient night and a cool key light from the back-left.
const hemi = new THREE.HemisphereLight(0x718ca3, 0x0b0e13, 1.05);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9fc2f0, 1.75);
moon.position.set(-13, 19, 13);
moon.target.position.set(0, 0, 0);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -16;
moon.shadow.camera.right = 16;
moon.shadow.camera.top = 17;
moon.shadow.camera.bottom = -16;
moon.shadow.camera.near = 2;
moon.shadow.camera.far = 48;
moon.shadow.bias = -0.0004;
moon.shadow.normalBias = 0.025;
moon.shadow.radius = 2.8;
scene.add(moon, moon.target);

const rim = new THREE.DirectionalLight(0xd08bb9, 0.38);
rim.position.set(13, 9, -12);
scene.add(rim);

const assembly = new Assembly();
const base = buildBase(scene, assets, R, assembly, renderer);
const store = buildStore(scene, assets, R, assembly);
const neighborhood = buildNeighborhood(scene, assets, R, assembly);
const streetProps = buildStreetProps(scene, assets, R, assembly);

const constructionFX = new ConstructionFX(scene, assets);
assembly.onSettle = (position, item) => {
  constructionFX.spawn(position, item.start < 1.6 ? 1.6 : 1.0);
};

// All local lights live in fixed scene space from the start. Keeping the light
// count constant across the assembly avoids expensive shader recompiles when
// the store is revealed piece by piece.
scene.updateMatrixWorld(true);
const pointLights = [];
scene.traverse((o) => { if (o.isPointLight) pointLights.push(o); });
for (const light of pointLights) {
  scene.attach(light);
  light.visible = true;
  light.intensity = 0;
}

// Warm every shader (including shadow passes and the puddle reflector) before
// the first visible frame. The diorama then assembles without compilation hitches.
function prewarmShaders() {
  const visibility = new Map();
  scene.traverse((o) => visibility.set(o, o.visible));
  for (const o of visibility.keys()) o.visible = true;
  try {
    renderer.compile(scene, camera);
    const rt = new THREE.WebGLRenderTarget(32, 32, { depthBuffer: true });
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(prevTarget);
    rt.dispose();
  } catch (err) {
    console.warn('Shader prewarm skipped:', err);
  }
  for (const [o, visible] of visibility) o.visible = visible;
  for (const light of pointLights) light.intensity = 0;
}
prewarmShaders();

const rain = new RainSystem({ count: 2400 });
scene.add(rain.mesh);
const mist = createMist(assets.glow);
scene.add(mist);

// A few small bulb glows are added around the set later by the building modules.
const startTime = performance.now() / 1000;
let lastTime = startTime;
let introTime = 0;
let introActive = !params.get('skip');
let assemblyStarted = false;
let fade = 0;
let elapsed = 0;
let reflectionCamera = camera;
let shadowsFrozen = false;

const debugTimeFrozen = params.get('debugtime') === '1';
let frozenTime = debugTimeFrozen ? 0 : null;
let clockStart = null;

function stopIntro() {
  if (!introActive) return;
  introActive = false;
  controls.enabled = true;
}

renderer.domElement.addEventListener('pointerdown', stopIntro, { passive: true });
renderer.domElement.addEventListener('wheel', stopIntro, { passive: true });
renderer.domElement.addEventListener('touchstart', stopIntro, { passive: true });
controls.addEventListener('start', stopIntro);

// Orbit stays available from the first frame; the intro simply hands over.
controls.enabled = true;

function updateIntro(dt) {
  if (!introActive) return;
  introTime += dt;
  const t = clamp(introTime / 5.2, 0, 1);
  const e = easeInOutCubic(t);
  camera.position.lerpVectors(
    new THREE.Vector3(29.0, 18.6, 32.5),
    defaultCamera,
    e
  );
  controls.target.lerpVectors(new THREE.Vector3(-0.4, 3.9, -0.2), defaultTarget, e);
  if (t >= 1) {
    introActive = false;
    controls.enabled = true;
  }
}

function updateMist(time) {
  const items = mist.userData.items;
  for (const m of items) {
    const d = m.userData;
    m.position.x = d.baseX + Math.sin(time * 0.08 + d.phase) * 0.5;
    m.position.y = d.baseY + Math.sin(time * 0.14 + d.phase) * 0.22;
    m.position.z = d.baseZ + Math.cos(time * 0.06 + d.phase) * 0.35;
    m.material.opacity = 0.016 + 0.026 * (0.6 + 0.4 * Math.sin(time * 0.3 + d.phase));
    m.quaternion.copy(camera.quaternion);
  }
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
  reflectionCamera = camera;

  // Rain is present from the first frame; it grows heavier once the street is standing.
  const rainIn = 0.08 + 0.86 * clamp((elapsed - 2.8) / 4.8, 0, 1);
  rain.update(dt, elapsed, rainIn);
  updateMist(elapsed);
  base.update(elapsed, dt, camera);
  store.update(elapsed, dt, camera);
  neighborhood.update(elapsed, dt, camera);
  streetProps.update(elapsed, dt, camera);
  constructionFX.update(dt, elapsed);

  // Everything that casts shadows is static once the diorama is assembled.
  if (!shadowsFrozen && assembly.done) {
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    shadowsFrozen = true;
  }

  const bloomFade = clamp((elapsed - 1.2) / 2.8, 0, 1);
  fade = clamp(elapsed / 1.2, 0, 1);
  postfx.fade = fade;
  postfx.bloomStrength = 0.78;
  postfx.render(scene, camera, elapsed);

  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.setSize(window.innerWidth, window.innerHeight);
  postfx.setSize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    window.location.reload();
  }
});

window.__DIORAMA__ = {
  THREE,
  scene,
  camera,
  controls,
  renderer,
  assembly,
  pick(px, py) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2((px / window.innerWidth) * 2 - 1, -(py / window.innerHeight) * 2 + 1), camera);
    const hits = rc.intersectObjects(scene.children, true);
    return hits.slice(0, 14).map((h) => {
      const names = [];
      let o = h.object;
      while (o) { names.push(o.name || o.type); o = o.parent; }
      const mat = h.object.material;
      return {
        names,
        point: h.point.toArray().map((v) => +v.toFixed(2)),
        dist: +h.distance.toFixed(2),
        mat: mat ? mat.type : '',
        color: mat && mat.color ? mat.color.getHexString() : '',
        size: h.object.geometry?.boundingSphere ? h.object.geometry.boundingSphere.radius : null,
      };
    });
  },
  finish() {
    assembly.finish();
    introActive = false;
    controls.enabled = true;
    camera.position.copy(defaultCamera);
    controls.target.copy(defaultTarget);
    controls.update();
    for (let i = 0; i < 30; i++) {
      // Let the reflection and rain systems catch up on the next animation frames.
      rain.update(0, 8, 0.92);
    }
  },
  setTime(t) {
    frozenTime = Math.max(0, t);
    introActive = false;
    controls.enabled = true;
  },
  resume() {
    frozenTime = null;
    clockStart = performance.now() / 1000 - elapsed;
  },
  setView(pos, target) {
    introActive = false;
    controls.enabled = true;
    camera.position.set(pos[0], pos[1], pos[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.update();
  },
  get elapsed() { return elapsed; },
  get triangles() { return renderer.info.render.triangles; },
  get calls() { return renderer.info.render.calls; },
};

// The first frame.
postfx.fade = 0;
postfx.render(scene, camera, 0);
requestAnimationFrame(animate);
