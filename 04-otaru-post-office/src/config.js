export const BASE_SIZE = 24.4;
export const SNOW_HALF = 11.55;
export const SNOW_Y = 0.34;
export const PLINTH_H = 1.52;

export const POST = {
  x0: -4.9,
  x1: 4.5,
  z0: -5.3,
  z1: 1.8,
  floorY: 0.66,
  wallTop: 4.12,
  eaveY: 4.05,
  ridgeY: 6.7,
  entranceX0: -2.4,
  entranceX1: -1.0,
  entranceZ: 1.86,
  leftWinX0: -4.45,
  leftWinX1: -2.85,
  leftWinY0: 1.06,
  leftWinY1: 2.86,
  bigWinX0: -0.6,
  bigWinX1: 3.9,
  bigWinY0: 1.06,
  bigWinY1: 3.0,
  signY: 3.55,
  clockY: 5.3,
  counterX0: -0.7,
  counterX1: 3.85,
  counterZ0: 0.05,
  counterZ1: 0.85,
  counterTop: 1.58,
  catX: 1.62,
  catZ: 0.38,
  catY: 1.6,
};

export const STREET = {
  sidewalkZ0: 1.8,
  sidewalkZ1: 4.9,
  roadZ1: 10.15,
  baseFront: 11.55,
  curbH: 0.12,
  postboxX: -3.7,
  postboxZ: 3.15,
};

export const HOUSES = {
  left: { x: -8.1, z: -2.25, w: 4.3, d: 4.9, h: 3.9, rot: 0.05, color: '#d8d0bd' },
  right: { x: 8.15, z: -2.7, w: 4.15, d: 5.15, h: 3.65, rot: -0.06, color: '#b9c5c3' },
};

export const BACK_HOUSES = [
  { x: -9.0, z: -9.0, w: 3.8, d: 3.2, h: 3.5, color: '#b7b8b1', roof: '#4a4f4c' },
  { x: -5.0, z: -9.5, w: 4.0, d: 3.4, h: 4.1, color: '#d3c8b5', roof: '#3c4648' },
  { x: -0.6, z: -9.2, w: 4.4, d: 3.3, h: 3.8, color: '#c3c6be', roof: '#4d5151' },
  { x: 3.9, z: -9.5, w: 4.2, d: 3.2, h: 4.2, color: '#c8bda9', roof: '#3d4547' },
  { x: 8.2, z: -9.0, w: 3.9, d: 3.3, h: 3.6, color: '#aeb9b8', roof: '#465052' },
];

export const POLES = [
  { x: -8.8, z: 5.55, h: 7.2, variant: 0 },
  { x: 8.9, z: 4.75, h: 6.7, variant: 1 },
  { x: -7.7, z: -7.6, h: 6.2, variant: 2 },
  { x: 7.4, z: -7.8, h: 6.5, variant: 3 },
];

export const CAR = {
  x: 6.9,
  y: 0.34,
  z: 6.7,
  rot: Math.PI / 2 + 0.06,
  color: '#516b6b',
  w: 1.65,
  l: 3.0,
};

export const TIMES = {
  base: 0.0,
  ground: 0.5,
  road: 0.75,
  snowbanks: 1.05,
  houses: 1.5,
  postOffice: 2.1,
  roof: 3.15,
  sign: 3.45,
  interior: 3.4,
  counter: 4.15,
  cat: 4.7,
  street: 4.4,
  postbox: 4.0,
  car: 4.7,
  snow: 6.1,
  end: 10.1,
};


