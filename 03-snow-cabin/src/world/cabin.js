import { SnowSmoke } from '../effects/snow.js';
import { buildCabinExterior } from './cabin_exterior.js';
import { buildCabinInterior } from './cabin_interior.js';

export function buildCabin(scene, assets, R, assembly) {
  const exterior = buildCabinExterior(scene, assets, R, assembly);
  const interior = buildCabinInterior(scene, R, assembly);
  const smoke = new SnowSmoke(
    scene,
    assets.smoke,
    exterior.chimneyTop.x,
    exterior.chimneyTop.z,
    exterior.chimneyTop.y,
    0.22
  );
  return {
    exterior,
    interior,
    smoke,
    chimneyTop: exterior.chimneyTop,
    update(time, dt) {
      interior.update(time, dt);
      const smokeAmount = time < 5.9 ? 0 : Math.min(1, (time - 5.9) / 1.2);
      smoke.update(dt, time, smokeAmount);
    },
  };
}
