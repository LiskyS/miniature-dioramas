import * as THREE from 'three';
import { canvasTexture, TAU } from '../core/utils.js';

const flameVert = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flameFrag = /* glsl */`
  uniform float uTime;
  uniform float uSeed;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    float x = vUv.x * 2.0 - 1.0;
    float y = vUv.y;
    float time = uTime * 1.2 + uSeed * 9.0;
    float n = noise(vec2(y * 4.2 - time * 1.7, vUv.x * 3.3 + uSeed));
    float n2 = noise(vec2(vUv.x * 6.0 + time * 0.6, y * 5.4 - time * 2.2));
    float waver = sin(time * 3.1 + y * 8.0) * 0.08 * (1.0 - y);
    float xx = x + waver + (n - 0.5) * 0.23 * (0.3 + y);
    float width = mix(0.47, 0.025, pow(clamp(y, 0.0, 1.0), 0.7));
    width *= 0.7 + n2 * 0.55;
    float body = smoothstep(width, width * 0.08, abs(xx));
    float envelope = smoothstep(0.0, 0.08, y) * (1.0 - smoothstep(0.7, 1.0, y));
    float tongues = 0.58 + 0.42 * smoothstep(0.3, 0.8, n2 + 0.18 * sin(y * 17.0 - time * 4.2));
    float flicker = 0.8 + 0.2 * sin(time * 7.0 + n * 9.0);
    float alpha = body * envelope * tongues * flicker * uIntensity;

    // Add a small detached lick of flame at the top.
    float tip = smoothstep(0.05, 0.24, sin(y * 11.0 - time * 5.0) * 0.5 + 0.5);
    alpha *= mix(1.0, tip * 1.4, smoothstep(0.45, 0.95, y));

    vec3 color = mix(uColorA, uColorB, smoothstep(0.06, 0.7, y));
    color *= 0.92 + 0.95 * (1.0 - y) * body;
    gl_FragColor = vec4(color, alpha);
  }
`;

function makeFlameMaterial(timeUniform, seed, intensity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uSeed: { value: seed },
      uIntensity: { value: intensity },
      uColorA: { value: new THREE.Color('#ff4a0f') },
      uColorB: { value: new THREE.Color('#ffd27a') },
    },
    vertexShader: flameVert,
    fragmentShader: flameFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export class FireplaceFire {
  constructor(scene, x, y, z, scale = 1) {
    this.group = new THREE.Group();
    this.group.position.set(x, y, z);
    this.group.scale.setScalar(scale);
    scene.add(this.group);
    this.time = { value: 0 };
    this.planes = [];
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.translate(0, 0.5, 0);
      const mat = makeFlameMaterial(this.time, i * 1.83 + 0.33, i === 1 ? 0.82 : 0.62);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = (i / 3) * Math.PI;
      mesh.position.z = i === 0 ? 0.06 : 0;
      mesh.scale.set(0.92, 1.04, 1);
      mesh.renderOrder = 4;
      this.group.add(mesh);
      this.planes.push(mesh);
    }
    // Core glow.
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff9b47,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), glowMat);
    glow.position.set(0, 0.28, -0.04);
    this.group.add(glow);
    this.glow = glow;

    // Camera-facing fire halo: this reads clearly through the side window
    // where the flat flame planes are seen at a grazing angle.
    const haloTexture = canvasTexture(128, 128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,241,200,.95)');
      g.addColorStop(0.18, 'rgba(255,174,80,.55)');
      g.addColorStop(0.55, 'rgba(255,108,38,.16)');
      g.addColorStop(1, 'rgba(255,80,24,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture,
      color: 0xffb060,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }));
    this.halo.position.set(0, 0.55, 0.1);
    this.halo.scale.set(0.95, 1.15, 1);
    this.halo.renderOrder = 5;
    this.group.add(this.halo);

    // Hearth light, positioned just in front of the fire.
    this.light = new THREE.PointLight(0xff8f4e, 0, 8.5, 2.0);
    this.light.position.set(0, 0.65, 0.78);
    this.group.add(this.light);
    this.baseIntensity = 9;

    // Rising sparks.
    const count = 50;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = 0.1 + Math.random() * 0.95;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
      phases[i] = Math.random();
      speeds[i] = 0.14 + Math.random() * 0.4;
      sizes[i] = 0.5 + Math.random() * 1.8;
    }
    const sparksGeo = new THREE.BufferGeometry();
    sparksGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sparksGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    sparksGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    sparksGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.sparkMaterial = new THREE.ShaderMaterial({
      uniforms: this.time,
      vertexShader: /* glsl */`
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aSize;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          float life = fract(uTime * aSpeed + aPhase);
          vec3 p = position;
          p.y = 0.15 + life * 1.5;
          p.x += sin(uTime * 1.8 + aPhase * 20.0) * 0.14 * life;
          p.z += cos(uTime * 1.2 + aPhase * 14.0) * 0.08 * life;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (120.0 / max(1.0, -mv.z));
          gl_Position = projectionMatrix * mv;
          vAlpha = (1.0 - life) * smoothstep(0.0, 0.1, life);
        }
      `,
      fragmentShader: /* glsl */`
        varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p) * 2.0;
          if (d > 1.0) discard;
          float a = smoothstep(1.0, 0.05, d) * vAlpha;
          if (a < 0.02) discard;
          gl_FragColor = vec4(vec3(2.0, 0.8, 0.22), a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparksGeo, this.sparkMaterial);
    sparks.frustumCulled = false;
    sparks.renderOrder = 5;
    this.group.add(sparks);
    this.sparks = sparks;
    this.enabled = false;
    this.group.visible = false;
  }

  setVisible(v) {
    this.enabled = v;
    this.group.visible = v;
    this.light.intensity = v ? this.baseIntensity : 0;
  }

  update(time, dt) {
    if (!this.enabled) return;
    this.time.value = time;
    const flicker = 1 + 0.11 * Math.sin(time * 8.1) + 0.07 * Math.sin(time * 13.7 + 1.8) + 0.05 * Math.sin(time * 3.2);
    this.light.intensity = this.baseIntensity * flicker;
    this.light.color.setHSL(0.07 + 0.008 * Math.sin(time * 2.6), 0.88, 0.57);
    this.glow.material.opacity = 0.16 + 0.04 * flicker;
    this.halo.material.opacity = 0.1 + 0.035 * flicker;
    this.halo.scale.set(0.9 + 0.04 * flicker, 1.08 + 0.05 * flicker, 1);
    this.planes[0].rotation.y = 0.03 * Math.sin(time * 0.7);
    this.planes[1].rotation.y = Math.PI / 3 + 0.04 * Math.sin(time * 0.55 + 1.0);
    this.planes[2].rotation.y = -Math.PI / 3 + 0.04 * Math.sin(time * 0.6 + 2.0);
  }
}

export function createWindowLightStreak(texture, color = 0xffa65a, opacity = 0.3) {
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  return mat;
}

export function makeCandleGlowMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xffd881,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

export function makeSoftFireSprite(texture) {
  const mat = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffb168,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  return new THREE.Sprite(mat);
}

