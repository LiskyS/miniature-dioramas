import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { CITY_HALF, ROAD_Y } from '../config.js';

const WetShader = {
  name: 'WetStreetShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    tMask: { value: null },
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
  },
  vertexShader: /* glsl */`
    uniform mat4 textureMatrix;
    varying vec4 vProj;
    varying vec2 vMaskUv;
    varying vec3 vWorld;
    void main() {
      vMaskUv = uv;
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      vProj = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform sampler2D tMask;
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3 uCameraPos;
    varying vec4 vProj;
    varying vec2 vMaskUv;
    varying vec3 vWorld;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      float mask = texture2D(tMask, vMaskUv).a;
      if (mask < 0.006) discard;

      vec3 viewDir = normalize(uCameraPos - vWorld);
      float fresnel = pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 2.1);

      // Rain dimples the reflection. The offset is in clip space.
      float n = hash21(vMaskUv * 720.0 + floor(uTime * 8.0) * 0.37);
      vec2 distort = vec2(
        sin(vMaskUv.x * 140.0 + uTime * 1.3) * 0.00045,
        cos(vMaskUv.y * 190.0 - uTime * 1.7) * 0.0006
      );
      distort += (vec2(n, fract(n * 17.0)) - 0.5) * 0.00045;
      vec4 proj = vProj;
      proj.xy += distort * proj.w;

      vec3 refl = texture2DProj(tDiffuse, proj).rgb;
      // Gentle vertical blur gives the wet asphalt its soft, painted look.
      float w = 0.0024;
      refl += texture2DProj(tDiffuse, proj + vec4(0.0, w * proj.w, 0.0, 0.0)).rgb;
      refl += texture2DProj(tDiffuse, proj - vec4(0.0, w * proj.w, 0.0, 0.0)).rgb;
      refl += texture2DProj(tDiffuse, proj + vec4(0.0013 * proj.w, 0.0006 * proj.w, 0.0, 0.0)).rgb;
      refl += texture2DProj(tDiffuse, proj - vec4(0.0013 * proj.w, 0.0006 * proj.w, 0.0, 0.0)).rgb;
      refl /= 5.0;

      vec3 tinted = refl * vec3(0.78, 0.91, 0.98);
      tinted = pow(max(tinted, vec3(0.0)), vec3(1.06));
      float alpha = mask * uOpacity * (0.28 + 0.72 * fresnel);
      // A faint cool sheen over the whole wet surface.
      tinted += vec3(0.015, 0.032, 0.045) * mask;
      gl_FragColor = vec4(tinted, clamp(alpha, 0.0, 0.92));
    }
  `,
};

export function createWetStreet(maskTexture) {
  const geometry = new THREE.PlaneGeometry(CITY_HALF * 2, CITY_HALF * 2);
  const reflector = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: 512,
    textureHeight: 512,
    color: 0x889fa8,
    multisample: 0,
    shader: WetShader,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = ROAD_Y + 0.032;
  reflector.renderOrder = 2;
  reflector.material.transparent = true;
  reflector.material.depthWrite = false;
  reflector.material.uniforms.tMask.value = maskTexture;
  reflector.material.uniforms.uOpacity.value = 0;
  reflector.receiveShadow = false;
  reflector.castShadow = false;
  reflector.userData.isGroundReflection = true;
  // Reflections are soft, distorted and mostly rain-rippled; a 20 Hz refresh
  // while moving (8 Hz while the view is still) is visually indistinguishable
  // from per-frame rendering at a fraction of the draw-call cost.
  const originalBeforeRender = reflector.onBeforeRender;
  let lastReflection = -1e9;
  const lastCameraPosition = new THREE.Vector3(1e9, 1e9, 1e9);
  reflector.onBeforeRender = function (renderer, scene, camera) {
    const now = performance.now();
    const moved = lastCameraPosition.distanceToSquared(camera.position) > 0.000004;
    const interval = moved ? 58 : 125;
    if (now - lastReflection < interval) return;
    lastReflection = now;
    lastCameraPosition.copy(camera.position);
    originalBeforeRender.call(this, renderer, scene, camera);
  };
  return reflector;
}

// Rain rings: one instanced draw call, purely shader-driven.
export function createRippleField(puddles) {
  const base = new THREE.PlaneGeometry(1, 1);
  base.rotateX(-Math.PI / 2);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.attributes.position = base.attributes.position;
  geometry.attributes.uv = base.attributes.uv;

  const centers = [];
  const phases = [];
  const sizes = [];
  const speeds = [];
  let seed = 0;
  for (const p of puddles) {
    const count = Math.max(3, Math.round((p.rx * p.rz) * 1.8));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.sqrt(Math.random()) * 0.8;
      centers.push(
        p.x + Math.cos(angle) * p.rx * rad,
        ROAD_Y + 0.055,
        p.z + Math.sin(angle) * p.rz * rad
      );
      phases.push(Math.random());
      sizes.push(0.22 + Math.random() * 0.55);
      speeds.push(1.1 + Math.random() * 1.4);
      seed++;
    }
  }
  const count = phases.length;
  const aCenter = new THREE.InstancedBufferAttribute(new Float32Array(centers), 3);
  const aPhase = new THREE.InstancedBufferAttribute(new Float32Array(phases), 1);
  const aSize = new THREE.InstancedBufferAttribute(new Float32Array(sizes), 1);
  const aSpeed = new THREE.InstancedBufferAttribute(new Float32Array(speeds), 1);
  geometry.setAttribute('aCenter', aCenter);
  geometry.setAttribute('aPhase', aPhase);
  geometry.setAttribute('aSize', aSize);
  geometry.setAttribute('aSpeed', aSpeed);
  geometry.instanceCount = count;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */`
      attribute vec3 aCenter;
      attribute float aPhase;
      attribute float aSize;
      attribute float aSpeed;
      uniform float uTime;
      varying vec2 vUv;
      varying float vLife;
      void main() {
        float cycle = 2.1 / aSpeed;
        float life = fract(uTime / cycle + aPhase);
        vLife = life;
        float scale = mix(0.03, aSize, life);
        vec3 world = aCenter + vec3(position.x * scale, 0.0, position.z * scale);
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vLife;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float dist = length(p);
        if (dist > 1.0) discard;
        float ring = smoothstep(0.68, 0.86, dist) * (1.0 - smoothstep(0.9, 1.0, dist));
        float inner = smoothstep(0.2, 0.85, dist) * 0.18;
        float alpha = (ring * 0.78 + inner) * (1.0 - vLife) * smoothstep(0.0, 0.08, vLife) * uOpacity;
        gl_FragColor = vec4(vec3(0.66, 0.86, 0.96), alpha * 0.66);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  mesh.userData.isEffect = true;
  mesh.userData.count = count;
  return mesh;
}
