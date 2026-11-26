import * as THREE from 'three';

export function createSky(scene, assets) {
  scene.fog = new THREE.FogExp2(0x08111c, 0.014);
  const geometry = new THREE.SphereGeometry(95, 48, 28);
  const material = new THREE.MeshBasicMaterial({
    map: assets.sky,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    color: 0xffffff,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.rotation.y = Math.PI * 0.35;
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  sky.userData.isSky = true;
  scene.add(sky);

  // Soft atmospheric glows instead of flat planes so no hard edge shows.
  const makeGlow = (color, opacity, x, y, z, sx, sy) => {
    const mat = new THREE.SpriteMaterial({
      map: assets.glow,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(sx, sy, 1);
    sprite.renderOrder = -2;
    scene.add(sprite);
    return sprite;
  };
  const haze = makeGlow(0x6aa7b8, 0.08, -16, 8, -46, 60, 24);
  const haze2 = makeGlow(0x8c6f91, 0.045, 34, 7, 10, 48, 20);

  return { sky, haze, haze2 };
}
