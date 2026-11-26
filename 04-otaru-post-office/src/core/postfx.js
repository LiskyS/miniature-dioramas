import * as THREE from 'three';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

const QUAD_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BRIGHT_FRAG = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform float uThreshold;
  uniform float uKnee;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float soft = clamp(luma - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    soft = soft * soft / (4.0 * uKnee + 1e-4);
    float contribution = max(soft, luma - uThreshold) / max(luma, 1e-4);
    gl_FragColor = vec4(c * contribution, 1.0);
  }
`;

const BLUR_FRAG = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform vec2 uDirection;
  varying vec2 vUv;
  void main() {
    vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227027;
    sum += texture2D(tDiffuse, vUv + uDirection * 1.3846153846).rgb * 0.3162162162;
    sum += texture2D(tDiffuse, vUv - uDirection * 1.3846153846).rgb * 0.3162162162;
    sum += texture2D(tDiffuse, vUv + uDirection * 3.2307692308).rgb * 0.0702702703;
    sum += texture2D(tDiffuse, vUv - uDirection * 3.2307692308).rgb * 0.0702702703;
    gl_FragColor = vec4(sum, 1.0);
  }
`;

const COPY_FRAG = /* glsl */`
  uniform sampler2D tDiffuse;
  varying vec2 vUv;
  void main() { gl_FragColor = texture2D(tDiffuse, vUv); }
`;

const COMPOSITE_FRAG = /* glsl */`
  uniform sampler2D tScene;
  uniform sampler2D tDepth;
  uniform sampler2D tBloomA;
  uniform sampler2D tBloomB;
  uniform vec2 uTexel;
  uniform float uNear;
  uniform float uFar;
  uniform float uTime;
  uniform float uBloom;
  uniform float uOutline;
  uniform float uFade;
  uniform float uGrain;
  uniform float uVignette;
  varying vec2 vUv;

  float linearDepth(vec2 uv) {
    float d = texture2D(tDepth, uv).x;
    float z = d * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
  }

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspectUV = (uv - 0.5) * vec2(1.0, 0.72);
    float radius = length(aspectUV);

    // Very slight lateral colour split at the edges, like an old animation lens.
    float ca = 0.00022 * smoothstep(0.12, 0.75, radius);
    vec3 scene;
    scene.r = texture2D(tScene, uv + vec2(ca, 0.0)).r;
    scene.g = texture2D(tScene, uv).g;
    scene.b = texture2D(tScene, uv - vec2(ca, 0.0)).b;

    vec3 bloom = texture2D(tBloomA, uv).rgb;
    bloom += texture2D(tBloomB, uv).rgb * 0.62;
    bloom *= uBloom;

    vec3 color = scene + bloom * vec3(0.97, 1.01, 1.04);

    // Toon outline from depth discontinuities. A light colour-edge term catches
    // painted lettering, window frames and the tiny storefront props.
    vec2 px = uTexel * 1.08;
    float d0 = linearDepth(uv);
    float dL = linearDepth(uv - vec2(px.x, 0.0));
    float dR = linearDepth(uv + vec2(px.x, 0.0));
    float dU = linearDepth(uv - vec2(0.0, px.y));
    float dD = linearDepth(uv + vec2(0.0, px.y));
    float dUL = linearDepth(uv + vec2(-px.x, -px.y) * 1.45);
    float dDR = linearDepth(uv + vec2(px.x, px.y) * 1.45);
    float nearD = min(d0, min(min(dL, dR), min(dU, dD)));
    float farD = max(d0, max(max(dL, dR), max(dU, dD)));
    float depthEdge = smoothstep(0.026, 0.12, (farD - nearD) / max(nearD, 0.04));

    vec3 sL = texture2D(tScene, uv - vec2(px.x, 0.0)).rgb;
    vec3 sR = texture2D(tScene, uv + vec2(px.x, 0.0)).rgb;
    vec3 sU = texture2D(tScene, uv - vec2(0.0, px.y)).rgb;
    vec3 sD = texture2D(tScene, uv + vec2(0.0, px.y)).rgb;
    float lum0 = dot(scene, vec3(0.299, 0.587, 0.114));
    float lL = dot(sL, vec3(0.299, 0.587, 0.114));
    float lR = dot(sR, vec3(0.299, 0.587, 0.114));
    float lU = dot(sU, vec3(0.299, 0.587, 0.114));
    float lD = dot(sD, vec3(0.299, 0.587, 0.114));
    float lumEdge = max(max(abs(lL - lum0), abs(lR - lum0)), max(abs(lU - lum0), abs(lD - lum0)));
    float colorEdge = smoothstep(0.075, 0.34, lumEdge);
    float edge = max(depthEdge, colorEdge * 0.58);

    vec3 ink = vec3(0.050, 0.061, 0.062);
    color = mix(color, color * 0.045 + ink, edge * uOutline);

    // Painterly grade: cool shadows, warm highlights, a little extra saturation.
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec3 shadowTint = vec3(0.8, 0.9, 1.1);
    vec3 highlightTint = vec3(1.02, 1.015, 0.995);
    color *= mix(shadowTint, highlightTint, smoothstep(0.05, 0.78, luma));
    float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(gray), color, 1.1);
    color = (color - 0.5) * 1.075 + 0.5;
    color = max(color, 0.0);
    color *= 1.01;
    color = pow(max(color, 0.0), vec3(0.965));

    // Vignette and a fine print-like grain.
    float vig = smoothstep(1.03, 0.32, radius);
    color *= mix(1.0, vig, uVignette);
    float n = hash(uv * vec2(1920.0, 1080.0) + fract(uTime * 0.37) * 97.0) - 0.5;
    color += n * uGrain * (0.72 + 0.28 * (1.0 - luma));

    color *= uFade;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export class PostFX {
  constructor(renderer) {
    this.renderer = renderer;
    this.width = 1;
    this.height = 1;
    this.pixelRatio = 1;
    this.fade = 0;
    this.bloomStrength = 0.18;
    this.outlineStrength = 0.82;
    this.grainStrength = 0.012;
    this.vignetteStrength = 0.34;
    this.time = 0;

    this.quadScene = new THREE.Scene();
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadGeometry = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(this.quadGeometry, new THREE.MeshBasicMaterial());
    this.quadMesh.frustumCulled = false;
    this.quadScene.add(this.quadMesh);

    this.brightMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uThreshold: { value: 0.9 },
        uKnee: { value: 0.16 },
      },
      vertexShader: QUAD_VERT,
      fragmentShader: BRIGHT_FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.blurMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uDirection: { value: new THREE.Vector2() },
      },
      vertexShader: QUAD_VERT,
      fragmentShader: BLUR_FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.copyMaterial = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: QUAD_VERT,
      fragmentShader: COPY_FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: null },
        tDepth: { value: null },
        tBloomA: { value: null },
        tBloomB: { value: null },
        uTexel: { value: new THREE.Vector2() },
        uNear: { value: 0.3 },
        uFar: { value: 130 },
        uTime: { value: 0 },
        uBloom: { value: this.bloomStrength },
        uOutline: { value: this.outlineStrength },
        uFade: { value: 0 },
        uGrain: { value: this.grainStrength },
        uVignette: { value: this.vignetteStrength },
      },
      vertexShader: QUAD_VERT,
      fragmentShader: COMPOSITE_FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.fxaaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: FXAAShader.vertexShader,
      fragmentShader: FXAAShader.fragmentShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    this.sceneRT = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      depthBuffer: true,
      stencilBuffer: false,
      samples: 0,
    });
    this.sceneRT.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    this.sceneRT.depthTexture.format = THREE.DepthFormat;
    this.bRight = this.makeRT(1, 1, THREE.HalfFloatType);
    this.bLeft = this.makeRT(1, 1, THREE.HalfFloatType);
    this.bQuarterA = this.makeRT(1, 1, THREE.HalfFloatType);
    this.bQuarterB = this.makeRT(1, 1, THREE.HalfFloatType);
    this.ldrRT = this.makeRT(1, 1, THREE.UnsignedByteType);
  }

  makeRT(w, h, type) {
    const rt = new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
      type,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    });
    return rt;
  }

  setSize(width, height, pixelRatio) {
    const maxDpr = Math.min(pixelRatio, 1.65);
    this.pixelRatio = maxDpr;
    this.width = Math.max(1, Math.floor(width * maxDpr));
    this.height = Math.max(1, Math.floor(height * maxDpr));
    this.sceneRT.setSize(this.width, this.height);
    this.sceneRT.depthTexture.image.width = this.width;
    this.sceneRT.depthTexture.image.height = this.height;
    this.sceneRT.depthTexture.needsUpdate = true;
    const hw = Math.max(1, Math.floor(this.width / 2));
    const hh = Math.max(1, Math.floor(this.height / 2));
    const qw = Math.max(1, Math.floor(this.width / 4));
    const qh = Math.max(1, Math.floor(this.height / 4));
    this.bRight.setSize(hw, hh);
    this.bLeft.setSize(hw, hh);
    this.bQuarterA.setSize(qw, qh);
    this.bQuarterB.setSize(qw, qh);
    this.ldrRT.setSize(this.width, this.height);
    this.compositeMaterial.uniforms.uTexel.value.set(1 / this.width, 1 / this.height);
    this.fxaaMaterial.uniforms.resolution.value.set(1 / this.width, 1 / this.height);
    this.bRight.texture.generateMipmaps = false;
    this.bLeft.texture.generateMipmaps = false;
    this.bQuarterA.texture.generateMipmaps = false;
    this.bQuarterB.texture.generateMipmaps = false;
  }

  renderPass(material, target) {
    this.quadMesh.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  render(scene, camera, time = 0) {
    this.time = time;
    this.renderer.setRenderTarget(this.sceneRT);
    this.renderer.setClearColor(0xc7d3d8, 1);
    this.renderer.clear();
    this.renderer.render(scene, camera);

    // Bloom: bright-pass, two-scale gaussian.
    this.brightMaterial.uniforms.tDiffuse.value = this.sceneRT.texture;
    this.renderPass(this.brightMaterial, this.bRight);

    this.blurMaterial.uniforms.tDiffuse.value = this.bRight.texture;
    this.blurMaterial.uniforms.uDirection.value.set(1.6 / this.bRight.width, 0);
    this.renderPass(this.blurMaterial, this.bLeft);
    this.blurMaterial.uniforms.tDiffuse.value = this.bLeft.texture;
    this.blurMaterial.uniforms.uDirection.value.set(0, 1.6 / this.bRight.height);
    this.renderPass(this.blurMaterial, this.bRight);

    this.copyMaterial.uniforms.tDiffuse.value = this.bRight.texture;
    this.renderPass(this.copyMaterial, this.bQuarterA);
    this.blurMaterial.uniforms.tDiffuse.value = this.bQuarterA.texture;
    this.blurMaterial.uniforms.uDirection.value.set(2.8 / this.bQuarterA.width, 0);
    this.renderPass(this.blurMaterial, this.bQuarterB);
    this.blurMaterial.uniforms.tDiffuse.value = this.bQuarterB.texture;
    this.blurMaterial.uniforms.uDirection.value.set(0, 2.8 / this.bQuarterA.height);
    this.renderPass(this.blurMaterial, this.bQuarterA);

    const cu = this.compositeMaterial.uniforms;
    cu.tScene.value = this.sceneRT.texture;
    cu.tDepth.value = this.sceneRT.depthTexture;
    cu.tBloomA.value = this.bRight.texture;
    cu.tBloomB.value = this.bQuarterA.texture;
    cu.uNear.value = camera.near;
    cu.uFar.value = camera.far;
    cu.uTime.value = time;
    cu.uFade.value = this.fade;
    cu.uBloom.value = this.bloomStrength;
    cu.uOutline.value = this.outlineStrength;
    cu.uGrain.value = this.grainStrength;
    cu.uVignette.value = this.vignetteStrength;
    this.renderPass(this.compositeMaterial, this.ldrRT);

    this.fxaaMaterial.uniforms.tDiffuse.value = this.ldrRT.texture;
    this.quadMesh.material = this.fxaaMaterial;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  dispose() {
    this.sceneRT.dispose();
    this.sceneRT.depthTexture.dispose();
    [this.bRight, this.bLeft, this.bQuarterA, this.bQuarterB, this.ldrRT].forEach((rt) => rt.dispose());
    [
      this.brightMaterial,
      this.blurMaterial,
      this.copyMaterial,
      this.compositeMaterial,
      this.fxaaMaterial,
      this.quadGeometry,
    ].forEach((x) => x.dispose());
  }
}





