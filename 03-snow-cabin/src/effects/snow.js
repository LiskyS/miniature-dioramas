import * as THREE from 'three';
import { CABIN, SNOW_HALF, SNOW_Y } from '../config.js';

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Snowfall {
  constructor() {
    this.count = 2400;
    this.height = 18;
    this.material = null;
    this.mesh = this.build();
  }

  build() {
    const R = mulberry32(7731);
    const base = new THREE.PlaneGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.attributes.position = base.attributes.position;
    geometry.attributes.uv = base.attributes.uv;
    const xz = [];
    const phase = [];
    const speed = [];
    const size = [];
    const sway = [];
    const twinkle = [];
    const brightness = [];
    for (let i = 0; i < this.count; i++) {
      xz.push((R() - 0.5) * 35, (R() - 0.5) * 35);
      phase.push(R());
      speed.push(0.55 + R() * 1.15);
      size.push(0.035 + Math.pow(R(), 2.4) * 0.19);
      sway.push(0.12 + R() * 0.5);
      twinkle.push(0.4 + R() * 2.1);
      brightness.push(0.42 + R() * 0.52);
    }
    geometry.setAttribute('aXZ', new THREE.InstancedBufferAttribute(new Float32Array(xz), 2));
    geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array(phase), 1));
    geometry.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(new Float32Array(speed), 1));
    geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array(size), 1));
    geometry.setAttribute('aSway', new THREE.InstancedBufferAttribute(new Float32Array(sway), 1));
    geometry.setAttribute('aTwinkle', new THREE.InstancedBufferAttribute(new Float32Array(twinkle), 1));
    geometry.setAttribute('aBrightness', new THREE.InstancedBufferAttribute(new Float32Array(brightness), 1));
    geometry.instanceCount = this.count;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uHeight: { value: this.height },
        uCabinMin: { value: new THREE.Vector2(CABIN.x0 - 0.25, CABIN.z0 - 0.25) },
        uCabinMax: { value: new THREE.Vector2(CABIN.x1 + 0.25, CABIN.z1 + 0.25) },
        uRoofY: { value: 5.9 },
      },
      vertexShader: /* glsl */`
        attribute vec2 aXZ;
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aSize;
        attribute float aSway;
        attribute float aTwinkle;
        attribute float aBrightness;
        uniform float uTime;
        uniform float uHeight;
        uniform vec2 uCabinMin;
        uniform vec2 uCabinMax;
        uniform float uRoofY;
        varying vec2 vUv;
        varying float vAlpha;
        varying float vBright;
        void main() {
          float falling = mod(aPhase * uHeight + uTime * aSpeed, uHeight);
          float y = falling;
          float drift = sin(uTime * (0.22 + aSway * 0.1) + aPhase * 17.0) * aSway;
          drift += sin(uTime * 0.11 + aPhase * 5.0) * 0.22;
          vec3 world = vec3(aXZ.x + drift, y + 0.6, aXZ.y + cos(uTime * 0.17 + aPhase * 9.0) * 0.18);
          bool insideCabin = world.x > uCabinMin.x && world.x < uCabinMax.x && world.z > uCabinMin.y && world.z < uCabinMax.y;
          vec4 mv = viewMatrix * vec4(world, 1.0);
          mv.x += position.x * aSize;
          mv.y += position.y * aSize;
          gl_Position = projectionMatrix * mv;
          vUv = uv;
          float twinkle = 0.76 + 0.24 * sin(uTime * aTwinkle + aPhase * 31.0);
          float groundFade = smoothstep(0.0, 1.1, y);
          float nearFade = smoothstep(0.0, 1.3, -mv.z);
          vAlpha = insideCabin && y < uRoofY ? 0.0 : groundFade * nearFade * twinkle * aBrightness;
          vBright = aBrightness;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uOpacity;
        varying vec2 vUv;
        varying float vAlpha;
        varying float vBright;
        void main() {
          vec2 p = vUv - 0.5;
          float d = length(p) * 2.0;
          if (d > 1.0) discard;
          float core = smoothstep(1.0, 0.12, d);
          float flake = smoothstep(1.0, 0.35, d) * 0.38;
          float a = (core * 0.74 + flake) * vAlpha * uOpacity;
          if (a < 0.004) discard;
          vec3 col = mix(vec3(0.78, 0.88, 0.97), vec3(1.0, 1.0, 0.99), vBright);
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 9;
    mesh.userData.isSnow = true;
    this.material = material;
    return mesh;
  }

  update(time, opacity) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uOpacity.value = opacity;
  }
}

export class SnowSmoke {
  constructor(scene, smokeTexture, chimneyX, chimneyZ, chimneyTop, wind = 0.25) {
    this.scene = scene;
    this.items = [];
    this.timer = 0;
    this.wind = wind;
    const mat = new THREE.SpriteMaterial({
      map: smokeTexture,
      color: 0xdce9f2,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.NormalBlending,
    });
    for (let i = 0; i < 28; i++) {
      const s = new THREE.Sprite(mat.clone());
      s.position.set(chimneyX, chimneyTop, chimneyZ);
      s.scale.set(0.45, 0.5, 1);
      s.userData.phase = i / 28;
      s.userData.life = 0;
      s.visible = false;
      s.renderOrder = 6;
      scene.add(s);
      this.items.push(s);
    }
    this.cx = chimneyX;
    this.cz = chimneyZ;
    this.top = chimneyTop;
  }

  update(dt, time, amount = 1) {
    this.timer -= dt;
    for (const s of this.items) {
      if (s.userData.life > 0) {
        s.userData.life -= dt;
        const t = 1 - s.userData.life / s.userData.duration;
        s.position.y += dt * (0.42 + t * 0.26);
        s.position.x += dt * (0.2 + Math.sin(time * 0.4 + s.userData.seed) * 0.12);
        s.position.z += dt * 0.07;
        s.scale.setScalar(0.45 + t * 1.65);
        s.material.opacity = Math.sin(t * Math.PI) * 0.25 * amount;
        if (s.userData.life <= 0) s.visible = false;
      }
    }
    if (this.timer <= 0 && amount > 0.01) {
      this.timer = 0.27;
      const s = this.items.find((item) => item.userData.life <= 0);
      if (s) {
        const seed = Math.random() * 9;
        s.visible = true;
        s.userData.life = 7.5 + Math.random() * 2.5;
        s.userData.duration = s.userData.life;
        s.userData.seed = seed;
        s.position.set(this.cx + (Math.random() - 0.5) * 0.22, this.top + 0.1, this.cz + (Math.random() - 0.5) * 0.22);
        s.scale.set(0.35, 0.42, 1);
        s.material.opacity = 0.2;
      }
    }
  }
}

export function createSnowSparkles(scene, sparkTexture) {
  const count = 260;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const R = mulberry32(9933);
  for (let i = 0; i < count; i++) {
    const x = (R() - 0.5) * (SNOW_HALF * 2 - 1);
    const z = (R() - 0.5) * (SNOW_HALF * 2 - 1);
    positions[i * 3] = x;
    positions[i * 3 + 1] = SNOW_Y + 0.015 + R() * 0.05;
    positions[i * 3 + 2] = z;
    sizes[i] = 0.55 + R() * 1.7;
    phases[i] = R() * 6.28;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: sparkTexture },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */`
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      varying float vTwinkle;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (90.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
        vTwinkle = 0.6 + 0.4 * sin(uTime * 2.6 + aPhase);
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying float vTwinkle;
      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        float a = tex.a * vTwinkle * uOpacity * 0.8;
        if (a < 0.005) discard;
        gl_FragColor = vec4(vec3(0.91, 0.97, 1.0), a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 2;
  scene.add(points);
  return {
    points,
    update(time, opacity) {
      mat.uniforms.uTime.value = time;
      mat.uniforms.uOpacity.value = opacity;
    },
  };
}
