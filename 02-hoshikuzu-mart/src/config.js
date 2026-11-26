export const BASE_SIZE = 25.2;
export const CITY_HALF = 11.7;
export const ROAD_Y = 0.045;
export const SIDEWALK_Y = 0.235;

export const STORE = {
  x0: -7.8,
  x1: 2.4,
  z0: -8.4,
  z1: 1.2,
  y: SIDEWALK_Y,
  doorX0: 0.52,
  doorX1: 2.16,
  glassTop: 3.28,
  bandTop: 4.18,
  signTop: 5.18,
};

export const LAYOUT = {
  sidewalkFrontZ: 3.2,
  sidewalkEastX: 4.2,
  neighbor: { x0: -11.7, x1: -9.15, z0: -10.6, z1: 1.5, h: 7.25 },
  cafe: { x0: 8.55, x1: 11.7, z0: -10.6, z1: 0.72, h: 6.6 },
  vendingZ: 2.1,
  utilityPole: { x: 11.12, z: 2.55 },
  backPole: { x: -10.3, z: -11.05 },
  streetLamp: { x: -7.08, z: 2.98 },
  tree: { x: -11.34, z: 2.55 },
};

export const PUDDLES = [
  { x: 6.2, z: 7.4, rx: 2.9, rz: 1.6, rot: -0.12, alpha: 0.83 },
  { x: 3.1, z: 4.35, rx: 1.9, rz: 1.05, rot: 0.3, alpha: 0.78 },
  { x: 0.2, z: 7.8, rx: 2.3, rz: 1.2, rot: -0.25, alpha: 0.72 },
  { x: 8.4, z: 3.7, rx: 1.45, rz: 0.85, rot: 0.18, alpha: 0.8 },
  { x: 9.5, z: 6.0, rx: 1.5, rz: 2.4, rot: -0.08, alpha: 0.7 },
  { x: -3.1, z: 5.2, rx: 2.8, rz: 0.85, rot: 0.03, alpha: 0.64 },
  { x: 5.4, z: 1.55, rx: 0.9, rz: 2.0, rot: -0.03, alpha: 0.72 },
  { x: 7.0, z: -2.2, rx: 1.8, rz: 1.4, rot: 0.25, alpha: 0.72 },
  { x: 5.1, z: -6.9, rx: 0.95, rz: 2.6, rot: 0.02, alpha: 0.68 },
  { x: 10.2, z: -0.4, rx: 1.1, rz: 1.1, rot: -0.1, alpha: 0.6 },
  { x: 2.5, z: 9.8, rx: 2.1, rz: 1.1, rot: 0.1, alpha: 0.58 },
  { x: 9.8, z: 9.7, rx: 1.5, rz: 1.2, rot: 0.4, alpha: 0.62 },
];

export const TIMES = {
  base: 0.0,
  ground: 0.7,
  shells: 1.55,
  glazing: 2.05,
  interior: 2.35,
  fittings: 2.85,
  signage: 3.45,
  neighbor: 2.65,
  street: 3.9,
  props: 4.15,
  wires: 5.15,
  rain: 5.65,
  end: 8.4,
};
