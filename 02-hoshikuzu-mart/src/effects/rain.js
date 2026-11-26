import * as THREE from 'three';
import { CITY_HALF, STORE, LAYOUT } from '../config.js';

function inside(x, z, r, pad = 1.2) {
  return x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad;
}

export class RainSystem {
  constructor(opts = {}) {
    this.count = opts.count ?? 2300;
    this.height = 18;
    this.width = 36;
    this.depth = 36;
    this.time = 0;
    this.mesh = this.build();
  }

  build() {
    const rng = mulberry32(8841);
    const base = new THREE.PlaneGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.attributes.position = base.attributes.position;
    geometry.attributes.uv = base.attributes.uv;

    const xz = [];
    const phase = [];
    const speed = [];
    const len = [];
    const wid = [];
    const alpha = [];
    let placed = 0;
    let guard = 0;
    while (placed < this.count && guard < this.count * 30) {
      guard++;
      const x = (rng() - 0.5) * this.width;
      const z = (rng() - 0.5) * this.depth;
      if (inside(x, z, STORE, 0.4)) continue;
      if (inside(x, z, LAYOUT.neighbor, 0.4)) continue;
      if (inside(x, z, LAYOUT.cafe, 0.4)) continue;
      xz.push(x, z);
      phase.push(rng());
      const near = rng();
      speed.push(5.8 + near * 5.2);
      len.push(0.24 + near * 0.7 + rng() * 0.28);
      wid.push(0.012 + near * 0.017);
      alpha.push(0.14 + rng() * 0.32 + near * 0.18);
      placed++;
    }
    const instanceCount = placed;
    const aXZ = new THREE.InstancedBufferAttribute(new Float32Array(xz), 2);
    const aPhase = new THREE.InstancedBufferAttribute(new Float32Array(phase), 1);
    const aSpeed = new THREE.InstancedBufferAttribute(new Float32Array(speed), 1);
    const aLen = new THREE.InstancedBufferAttribute(new Float32Array(len), 1);
    const aWid = new THREE.InstancedBufferAttribute(new Float32Array(wid), 1);
    const aAlpha = new THREE.InstancedBufferAttribute(new Float32Array(alpha), 1);
    geometry.setAttribute('aXZ', aXZ);
    geometry.setAttribute('aPhase', aPhase);
    geometry.setAttribute('aSpeed', aSpeed);
    geometry.setAttribute('aLen', aLen);
    geometry.setAttribute('aWid', aWid);
    geometry.setAttribute('aAlpha', aAlpha);
    geometry.instanceCount = instanceCount;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHeight: { value: this.height },
        uOpacity: { value: 0 },
        uWind: { value: 0.11 },
      },
      vertexShader: /* glsl */`
        attribute vec2 aXZ;
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aLen;
        attribute float aWid;
        attribute float aAlpha;
        uniform float uTime;
        uniform float uHeight;
        uniform float uWind;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          float y = mod(aPhase * uHeight - uTime * aSpeed, uHeight);
          vec3 world = vec3(aXZ.x, y, aXZ.y);
          world.x += uWind * y * 0.28;
          vec4 mv = viewMatrix * vec4(world, 1.0);
          mv.x += position.x * aWid;
          mv.y += position.y * aLen;
          mv.x += position.y * aLen * 0.12;
          gl_Position = projectionMatrix * mv;
          vUv = uv;
          float edge = smoothstep(0.0, 1.0, y / 2.0) * (1.0 - smoothstep(uHeight - 5.0, uHeight, y));
          float distFade = smoothstep(0.0, 2.2, -mv.z);
          vAlpha = aAlpha * edge * distFade;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uOpacity;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          float across = smoothstep(0.0, 0.26, vUv.x) * (1.0 - smoothstep(0.74, 1.0, vUv.x));
          across *= smoothstep(0.0, 0.35, vUv.x) * smoothstep(0.0, 0.35, 1.0 - vUv.x);
          float along = smoothstep(0.0, 0.13, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
          along *= 0.45 + 0.55 * smoothstep(0.0, 0.5, 1.0 - vUv.y);
          float a = across * along * vAlpha * uOpacity;
          if (a < 0.004) discard;
          gl_FragColor = vec4(vec3(0.64, 0.82, 0.98), a);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 8;
    mesh.userData.isRain = true;
    mesh.userData.count = instanceCount;
    return mesh;
  }

  update(dt, time, opacity) {
    this.time = time;
    const u = this.mesh.material.uniforms;
    u.uTime.value = time;
    u.uOpacity.value = opacity;
  }

  setOpacity(v) {
    this.mesh.material.uniforms.uOpacity.value = v;
  }
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Slow, weightless rain mist for the alley and beneath the eaves.
export function createMist(glowTexture) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    color: 0x93b6c5,
    side: THREE.DoubleSide,
  });
  const items = [];
  const R = mulberry32(2199);
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat.clone());
    m.material.opacity = 0.018 + R() * 0.035;
    const x = (R() - 0.5) * 26;
    const z = (R() - 0.5) * 26;
    const baseY = 0.4 + R() * 3.2;
    m.position.set(x, baseY, z);
    m.scale.set(2 + R() * 6, 1.2 + R() * 3.2, 1);
    m.userData = {
      baseX: x,
      baseY,
      baseZ: z,
      phase: R() * 7,
      drift: 0.1 + R() * 0.25,
    };
    m.renderOrder = 5;
    group.add(m);
    items.push(m);
  }
  group.userData.items = items;
  group.userData.isMist = true;
  return group;
}
