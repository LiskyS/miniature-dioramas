import * as THREE from 'three';

const VERT = /* glsl */`
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (350.0 / max(-mv.z, 1.0)), 1.0, 24.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */`
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p) * 2.0;
    if (d > 1.0) discard;
    float a = smoothstep(1.0, 0.12, d) * vAlpha;
    a *= 0.65 + 0.35 * (1.0 - d);
    gl_FragColor = vec4(vColor, a);
  }
`;

export class ConstructionFX {
  constructor(scene, assets) {
    this.scene = scene;
    this.capacity = 460;
    this.cursor = 0;
    this.alive = 0;
    this.time = 0;
    this.rings = [];
    this.ringCursor = 0;

    // Expanding water-like rings at each landing point.
    const ringMat = new THREE.MeshBasicMaterial({
      map: assets.ring,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      color: 0xa6e6da,
    });
    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ringMat.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      mesh.renderOrder = 9;
      mesh.userData.life = 0;
      mesh.userData.maxLife = 0.8;
      this.scene.add(mesh);
      this.rings.push(mesh);
    }

    // Sparks.
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.capacity * 3);
    this.colors = new Float32Array(this.capacity * 3);
    this.alphas = new Float32Array(this.capacity);
    this.sizes = new Float32Array(this.capacity);
    this.velocities = new Float32Array(this.capacity * 3);
    this.life = new Float32Array(this.capacity);
    this.maxLife = new Float32Array(this.capacity);
    for (let i = 0; i < this.capacity; i++) {
      this.positions[i * 3 + 1] = -999;
      this.alphas[i] = 0;
      this.sizes[i] = 0.18;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geo.setDrawRange(0, this.capacity);
    this.geometry = geo;
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    this.scene.add(this.points);
    this.palette = [
      new THREE.Color('#b9fff0'),
      new THREE.Color('#e9ffd4'),
      new THREE.Color('#ffd39b'),
      new THREE.Color('#bcefff'),
      new THREE.Color('#ffc6e2'),
    ];
  }

  spawn(position, strength = 1) {
    const p = position.clone();
    const ring = this.rings[this.ringCursor++ % this.rings.length];
    ring.position.set(p.x, p.y + 0.035, p.z);
    ring.scale.setScalar(0.22 * strength);
    ring.visible = true;
    ring.userData.life = 0.82;
    ring.userData.maxLife = 0.82;
    ring.material.opacity = 0.8;
    ring.material.color.set(strength > 1.4 ? 0xffd6a5 : 0x9fe8dc);

    const count = Math.round(18 + 10 * Math.min(2, strength));
    for (let i = 0; i < count; i++) {
      const idx = this.cursor++ % this.capacity;
      const angle = Math.random() * Math.PI * 2;
      const radial = (0.4 + Math.random() * 1.2) * strength;
      this.positions[idx * 3] = p.x + (Math.random() - 0.5) * 0.24;
      this.positions[idx * 3 + 1] = p.y + 0.06 + Math.random() * 0.32;
      this.positions[idx * 3 + 2] = p.z + (Math.random() - 0.5) * 0.24;
      this.velocities[idx * 3] = Math.cos(angle) * radial;
      this.velocities[idx * 3 + 1] = 0.5 + Math.random() * 1.6;
      this.velocities[idx * 3 + 2] = Math.sin(angle) * radial;
      const c = this.palette[Math.floor(Math.random() * this.palette.length)];
      this.colors[idx * 3] = c.r;
      this.colors[idx * 3 + 1] = c.g;
      this.colors[idx * 3 + 2] = c.b;
      this.life[idx] = 0.45 + Math.random() * 0.9;
      this.maxLife[idx] = this.life[idx];
      this.alphas[idx] = 1;
      this.sizes[idx] = 0.2 + Math.random() * 0.46;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
  }

  update(dt, time) {
    this.time = time;
    // Sparks
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.alphas[i] = 0;
        this.positions[i * 3 + 1] = -999;
        continue;
      }
      this.velocities[i * 3 + 1] -= dt * 1.9;
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
      this.velocities[i * 3] *= 1 - dt * 0.5;
      this.velocities[i * 3 + 2] *= 1 - dt * 0.5;
      this.alphas[i] = Math.max(0, this.life[i] / this.maxLife[i]);
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;

    for (const ring of this.rings) {
      if (!ring.visible) continue;
      ring.userData.life -= dt;
      const life = Math.max(0, ring.userData.life);
      const p = 1 - life / ring.userData.maxLife;
      const s = 0.15 + p * 1.65;
      ring.scale.setScalar(s);
      ring.material.opacity = (1 - p) * 0.7;
      if (life <= 0) ring.visible = false;
    }
  }
}
