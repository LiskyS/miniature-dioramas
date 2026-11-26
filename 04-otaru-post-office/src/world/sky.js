import * as THREE from 'three';

export function createSky(scene, assets) {
  scene.fog = new THREE.FogExp2(0xc3d1d8, 0.0125);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(95, 48, 28),
    new THREE.MeshBasicMaterial({
      map: assets.sky,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      color: 0xdde9ee,
    })
  );
  sky.rotation.y = Math.PI * 0.42;
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  scene.add(sky);

  // A few almost-invisible low cloud veils make the overcast sky feel deeper.
  const veilMat = new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xe9efec,
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    blending: THREE.NormalBlending,
  });
  for (let i = 0; i < 3; i++) {
    const veil = new THREE.Sprite(veilMat.clone());
    veil.position.set(-30 + i * 30, 7 + i * 2, -55 + i * 4);
    veil.scale.set(36 - i * 4, 9 + i * 1.5, 1);
    veil.renderOrder = -20;
    scene.add(veil);
  }

  return { sky };
}


