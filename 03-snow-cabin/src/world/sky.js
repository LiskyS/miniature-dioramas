import * as THREE from 'three';

export function createSky(scene, assets) {
  scene.fog = new THREE.FogExp2(0x091523, 0.0125);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(95, 48, 28),
    new THREE.MeshBasicMaterial({
      map: assets.sky,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      color: 0xffffff,
    })
  );
  sky.rotation.y = Math.PI * 0.35;
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  scene.add(sky);

  // Storybook moon, sitting in the upper-left sky from the default view.
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.glow,
    color: 0xaacbe9,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  halo.position.set(-45, 12.5, -30);
  halo.scale.set(26, 26, 1);
  halo.renderOrder = -20;
  scene.add(halo);
  halo.name = 'moon-halo';

  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.moon,
    color: 0xeaf3ff,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  moon.position.set(-45, 12.5, -29.5);
  moon.scale.set(8.2, 8.2, 1);
  moon.renderOrder = -19;
  moon.name = 'moon';
  scene.add(moon);

  const moonHaze = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets.smoke,
    color: 0xb9d1e5,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
    toneMapped: false,
  }));
  moonHaze.position.set(-38, 11.5, -29);
  moonHaze.scale.set(18, 6, 1);
  moonHaze.renderOrder = -18;
  scene.add(moonHaze);

  return { sky, moon, halo, moonHaze };
}
