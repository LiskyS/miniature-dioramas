import { buildPostOfficeExterior } from './postOfficeExterior.js';
import { buildPostOfficeInterior } from './postOfficeInterior.js';

export function buildPostOffice(scene, assets, R, assembly) {
  const exterior = buildPostOfficeExterior(scene, assets, R, assembly);
  const interior = buildPostOfficeInterior(scene, assets, R, assembly);
  return {
    exterior,
    interior,
    cat: interior.cat,
    porchLight: exterior.porchLight,
    update(time, dt) {
      interior.update(time, dt);
    },
  };
}
