import * as THREE from 'three';

export function makeSmoothGradient() {
  const data = new Uint8Array(256);
  for (let i = 0; i < 256; i++) data[i] = i;
  const tex = new THREE.DataTexture(data, 256, 1, THREE.RedFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
