export const BASE_SIZE = 23.6;
export const SNOW_HALF = 11.2;
export const SNOW_Y = 0.31;
export const PLINTH_H = 1.45;

export const CABIN = {
  x0: -4.8,
  x1: 3.8,
  z0: -4.5,
  z1: 1.1,
  floorY: 0.65,
  wallTop: 3.7,
  ridgeY: 6.1,
  porchZ: 2.55,
  doorX0: -3.35,
  doorX1: -2.05,
  doorTop: 2.75,
  glassTop: 3.2,
  fireplaceX: 1.8,
  fireplaceZ: -4.18,
  chimneyX: 1.8,
  chimneyZ: -4.75,
  chimneyTop: 7.25,
};

export const TIMES = {
  base: 0.0,
  ground: 0.55,
  trees: 1.45,
  cabin: 2.15,
  glazing: 2.6,
  roof: 3.2,
  porch: 3.55,
  interior: 3.9,
  furniture: 4.5,
  fire: 5.6,
  outside: 4.9,
  fence: 5.2,
  snow: 6.2,
  end: 9.6,
};

export const TREES = [
  { x: -8.4, z: -7.4, h: 9.1, s: 1.07, variant: 0 },
  { x: -6.4, z: -9.1, h: 7.4, s: 0.9, variant: 1 },
  { x: -2.3, z: -8.8, h: 8.2, s: 1.0, variant: 2 },
  { x: 2.4, z: -9.3, h: 9.4, s: 1.1, variant: 0 },
  { x: 6.7, z: -7.2, h: 8.7, s: 1.03, variant: 1 },
  { x: 9.3, z: -4.0, h: 6.7, s: 0.82, variant: 2 },
  { x: 10.2, z: 0.7, h: 4.9, s: 0.63, variant: 0 },
  { x: -9.2, z: -1.2, h: 7.2, s: 0.87, variant: 1 },
  { x: -9.5, z: 4.3, h: 5.4, s: 0.7, variant: 2 },
  { x: 9.9, z: 7.5, h: 3.3, s: 0.43, variant: 1 },
  { x: -9.7, z: 8.2, h: 3.4, s: 0.45, variant: 0 },
];

export const ROCKS = [
  { x: -7.5, z: 1.8, s: 1.4, rot: 0.2 },
  { x: -6.4, z: 2.6, s: 0.75, rot: 1.4 },
  { x: 5.7, z: -2.6, s: 1.0, rot: -0.4 },
  { x: 6.7, z: 0.8, s: 0.8, rot: 0.7 },
  { x: 8.2, z: 5.3, s: 1.15, rot: 1.2 },
  { x: -3.0, z: 7.2, s: 0.7, rot: -0.6 },
  { x: 2.5, z: 7.0, s: 0.62, rot: 0.3 },
];

export const CREEK = [
  { x: 9.0, z: -1.0, w: 1.7 },
  { x: 8.3, z: 1.0, w: 2.0 },
  { x: 7.4, z: 3.1, w: 1.8 },
  { x: 7.7, z: 5.0, w: 1.45 },
  { x: 6.8, z: 7.1, w: 1.9 },
  { x: 5.6, z: 9.0, w: 2.1 },
  { x: 5.4, z: 10.7, w: 2.4 },
];
