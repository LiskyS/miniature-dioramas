import * as THREE from 'three';
import { makeToonGradient } from './textures.js';
import { makeSmoothGradient } from './gradients.js';

export function createMaterials(textures) {
  const R = {};
  const gradientMap = makeToonGradient();

  const toon = (color, opts = {}) => {
    const m = new THREE.MeshToonMaterial({
      color,
      gradientMap,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 1,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
      map: opts.map ?? null,
      alphaMap: opts.alphaMap ?? null,
      alphaTest: opts.alphaTest ?? 0,
      depthWrite: opts.depthWrite ?? true,
      fog: opts.fog ?? true,
    });
    if (opts.flatShading) m.flatShading = true;
    return m;
  };

  const standard = (color, opts = {}) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      map: opts.map ?? null,
      roughness: opts.roughness ?? 0.7,
      metalness: opts.metalness ?? 0,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 1,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
      depthWrite: opts.depthWrite ?? true,
      envMapIntensity: opts.envMapIntensity ?? 0.5,
      alphaTest: opts.alphaTest ?? 0,
      fog: opts.fog ?? true,
    });
    return m;
  };

  const basic = (color, opts = {}) => {
    const m = new THREE.MeshBasicMaterial({
      color,
      map: opts.map ?? null,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
      depthWrite: opts.depthWrite ?? true,
      blending: opts.blending ?? THREE.NormalBlending,
      alphaTest: opts.alphaTest ?? 0,
      toneMapped: false,
      fog: opts.fog ?? true,
    });
    if (opts.hdr) {
      const c = new THREE.Color(color);
      m.color.copy(c).multiplyScalar(opts.hdr);
    }
    return m;
  };

  // Base / ground
  R.baseWood = standard('#2a2c33', { map: textures.wood, roughness: 0.56, metalness: 0.16, envMapIntensity: 0.35 });
  R.baseInner = standard('#151a20', { roughness: 0.8, metalness: 0.12 });
  R.brass = standard('#a7844b', { roughness: 0.28, metalness: 0.88, envMapIntensity: 1.2 });
  R.brassDark = standard('#6e5936', { roughness: 0.4, metalness: 0.72 });
  R.asphalt = standard('#ffffff', {
    map: textures.asphalt,
    roughness: 0.38,
    metalness: 0.13,
    envMapIntensity: 0.85,
  });
  R.asphalt.envMapIntensity = 0.8;
  R.sidewalk = standard('#ffffff', { map: textures.sidewalk, roughness: 0.61, metalness: 0.04, envMapIntensity: 0.4 });
  R.curb = toon('#7e8582');
  R.curbEdge = standard('#9ca4a0', { roughness: 0.5, metalness: 0.06 });
  R.curbDark = toon('#50595b');
  R.tactile = toon('#8d8146', { map: textures.tactile });
  R.paintWhite = standard('#daded8', { roughness: 0.34, metalness: 0.02, envMapIntensity: 0.8 });
  R.paintYellow = standard('#d8b755', { roughness: 0.38, metalness: 0.02, envMapIntensity: 0.7 });
  R.wetStone = standard('#2a343b', { roughness: 0.2, metalness: 0.24, envMapIntensity: 1.1 });
  R.manhole = standard('#3b474d', { roughness: 0.3, metalness: 0.7 });
  R.drain = standard('#232b2e', { roughness: 0.4, metalness: 0.6 });

  // Exterior building
  R.storeWall = toon('#d6d0c2');
  R.storeWallSide = toon('#aba99e');
  R.storeBand = basic('#bdb8aa');
  R.storeTrim = toon('#1d4d48');
  R.storeTrimDark = toon('#113632');
  R.storeMetal = standard('#41575a', { roughness: 0.32, metalness: 0.6 });
  R.storeMetalLight = standard('#9aabaa', { roughness: 0.28, metalness: 0.52 });
  R.storeFoundation = standard('#606b68', { roughness: 0.7, metalness: 0.1 });
  R.storeRoof = standard('#313c3e', { roughness: 0.46, metalness: 0.34 });
  R.storeCanopy = standard('#263f3d', { roughness: 0.35, metalness: 0.42 });
  R.storeCanopyLip = toon('#e1ded0');
  R.glass = new THREE.MeshPhysicalMaterial({
    color: '#9ed7db',
    transparent: true,
    opacity: 0.11,
    roughness: 0.08,
    metalness: 0.12,
    envMapIntensity: 1.4,
    side: THREE.DoubleSide,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });
  R.glassInterior = new THREE.MeshPhysicalMaterial({
    color: '#b8ded8',
    transparent: true,
    opacity: 0.055,
    roughness: 0.08,
    metalness: 0.08,
    envMapIntensity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  R.doorGlass = new THREE.MeshPhysicalMaterial({
    color: '#b8e4e2',
    transparent: true,
    opacity: 0.2,
    roughness: 0.07,
    metalness: 0.15,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  R.neonMint = basic('#b7ffe9', { hdr: 2.6 });
  R.neonCyan = basic('#b9f3ff', { hdr: 2.4 });
  R.neonOrange = basic('#ffc17d', { hdr: 2.8 });
  R.neonPink = basic('#ff8fca', { hdr: 2.7 });
  R.warmLight = basic('#ffe8bd', { hdr: 2.9 });
  R.coolLight = basic('#dcf7ff', { hdr: 2.2 });
  R.redLight = basic('#ff695d', { hdr: 2.0 });

  R.signFace = basic('#ffffff', { map: textures.mainSign });
  R.signFaceSide = basic('#ffffff', { map: textures.sideSign });
  R.bladeSign = basic('#ffffff', { map: textures.bladeSign });
  R.cafeSign = basic('#ffffff', { map: textures.cafeSign });
  R.cafeNoren = toon('#ffffff', { map: textures.cafeNoren, side: THREE.DoubleSide });
  R.amaneSign = basic('#ffffff', { map: textures.amaneSign });
  R.streetName = basic('#ffffff', { map: textures.streetName });
  R.parkingSign = basic('#ffffff', { map: textures.parkingSign });
  R.vendingTopWarm = basic('#ffffff', { map: textures.vendingTopWarm });
  R.vendingTopCold = basic('#ffffff', { map: textures.vendingTopCold });
  R.vendingLightbox = basic('#ffffff', { map: textures.vendingLightbox });
  R.vendingButtons = basic('#ffffff', { map: textures.vendingButtons });
  R.doorMat = toon('#ffffff', { map: textures.doorMat });
  R.doorDecal = basic('#ffffff', { map: textures.autoDoor });
  R.paymentDecal = basic('#ffffff', { map: textures.paymentDecal, transparent: true });
  R.windowCoffee = basic('#ffffff', { map: textures.windowCoffee, transparent: true });
  R.windowHot = basic('#ffffff', { map: textures.windowHot, transparent: true });
  R.windowATM = basic('#ffffff', { map: textures.windowATM, transparent: true });
  R.windowNew = basic('#ffffff', { map: textures.windowNew, transparent: true });
  R.noticeBoard = basic('#ffffff', { map: textures.noticeBoard });
  R.posterSale = basic('#ffffff', { map: textures.posterSale });
  R.posterNotice = basic('#ffffff', { map: textures.posterNotice });
  R.posterCat = basic('#ffffff', { map: textures.posterCat });
  R.posterJazz = basic('#ffffff', { map: textures.posterJazz });
  R.roadP = basic('#ffffff', { map: textures.roadP, transparent: true, opacity: 0.88 });
  R.roadStop = basic('#ffffff', { map: textures.roadStop, transparent: true, opacity: 0.82 });
  R.roadArrow = basic('#ffffff', { map: textures.roadArrow, transparent: true, opacity: 0.72 });
  R.roadSlow = basic('#ffffff', { map: textures.roadSlow, transparent: true, opacity: 0.7 });
  R.serviceDoor = basic('#ffffff', { map: textures.serviceDoor });
  R.autoDoorDecal = basic('#ffffff', { map: textures.autoDoor, transparent: true });

  // Street / utility
  R.concrete = toon('#9b988f');
  R.concreteDark = toon('#70766f');
  R.poleConcrete = toon('#8d918d');
  R.metal = standard('#3e4a4e', { roughness: 0.4, metalness: 0.65 });
  R.metalDark = standard('#1d2529', { roughness: 0.46, metalness: 0.55 });
  R.metalGalv = standard('#8b9a9c', { roughness: 0.33, metalness: 0.7 });
  R.wire = new THREE.MeshBasicMaterial({ color: '#0b1117', fog: true });
  R.rubber = toon('#1b2023');
  R.reflector = basic('#f7b561', { hdr: 1.6 });
  R.guardWhite = standard('#dfe0d8', { roughness: 0.35, metalness: 0.22 });
  R.guardDark = toon('#234a47');
  R.wheelStop = standard('#c8ad48', { roughness: 0.4, metalness: 0.08 });
  R.trafficCone = toon('#d86644');
  R.trafficConeWhite = toon('#e8e4d8');
  R.vendingWarm = standard('#c84f43', { roughness: 0.33, metalness: 0.22 });
  R.vendingWarmDark = standard('#5b2928', { roughness: 0.4, metalness: 0.3 });
  R.vendingCold = standard('#dbe8e5', { roughness: 0.32, metalness: 0.18 });
  R.vendingColdDark = standard('#2f5559', { roughness: 0.38, metalness: 0.3 });
  R.binBody = standard('#566460', { roughness: 0.4, metalness: 0.35 });
  R.binLidGreen = toon('#4e7d66');
  R.binLidBlue = toon('#466f85');
  R.binLidOrange = toon('#ae7450');

  // Neighbor / cafe
  R.neighborWall = toon('#a49588');
  R.neighborWallLower = toon('#67554a');
  R.neighborRoof = standard('#3e3834', { roughness: 0.5, metalness: 0.1 });
  R.neighborTrim = toon('#4d3d35');
  R.neighborWindow = basic('#ffd99f', { hdr: 1.8 });
  R.neighborWindowDark = toon('#24353d');
  R.cafeWall = toon('#56606a');
  R.cafeWallWarm = toon('#6b5e58');
  R.cafeRoof = standard('#30383c', { roughness: 0.55, metalness: 0.16 });
  R.cafeWindow = basic('#ffc98f', { hdr: 1.45 });
  R.wood = toon('#604c3b');
  R.woodDark = toon('#3e322a');
  R.woodLight = toon('#8f7256');

  // Store interior
  R.interiorFloor = standard('#d9d1ba', { roughness: 0.35, metalness: 0.02, envMapIntensity: 0.55 });
  R.interiorFloorTile = toon('#d6cfbb');
  R.interiorWall = toon('#d7cdb8', { emissive: '#4b3c25', emissiveIntensity: 0.3 });
  R.interiorCeiling = toon('#d7cdb8', { emissive: '#665236', emissiveIntensity: 0.45 });
  R.interiorTrim = toon('#a3a397');
  R.shelf = standard('#d4d5cb', { roughness: 0.45, metalness: 0.2 });
  R.shelfDark = standard('#555f60', { roughness: 0.36, metalness: 0.42 });
  R.counter = standard('#c5c1b3', { roughness: 0.38, metalness: 0.1 });
  R.counterFront = toon('#7e877f');
  R.counterDark = toon('#414d4c');
  R.fridgeFrame = standard('#5c6968', { roughness: 0.35, metalness: 0.36 });
  R.fridgeBack = basic('#e3f6ef', { hdr: 1.2 });
  R.fridgeGlass = new THREE.MeshPhysicalMaterial({
    color: '#c8f1f2',
    transparent: true,
    opacity: 0.09,
    roughness: 0.04,
    metalness: 0.1,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  R.fridgeShelf = standard('#b5c9c5', { roughness: 0.3, metalness: 0.3 });
  R.interiorLight = basic('#fff1d0', { hdr: 2.5 });
  R.fridgeLight = basic('#dcfbff', { hdr: 2.1 });
  R.coffeeMachine = standard('#3e4445', { roughness: 0.25, metalness: 0.5 });
  R.coffeeMachineLight = basic('#8ef2d6', { hdr: 1.9 });
  R.hotCase = standard('#4d514d', { roughness: 0.25, metalness: 0.4 });
  R.hotGlass = new THREE.MeshPhysicalMaterial({
    color: '#ffd6a2',
    transparent: true,
    opacity: 0.14,
    roughness: 0.05,
    metalness: 0.08,
    envMapIntensity: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  R.hotFood = toon('#c9823a');
  R.hotFoodDark = toon('#8d5227');
  R.register = standard('#43494b', { roughness: 0.32, metalness: 0.46 });
  R.registerScreen = basic('#99ffda', { hdr: 1.7 });
  R.magazine = toon('#ebe2c7');
  R.basket = toon('#507b74');
  R.basketRim = toon('#d5c9a7');
  R.atm = standard('#586162', { roughness: 0.4, metalness: 0.34 });
  R.atmScreen = basic('#9eefff', { hdr: 1.8 });
  R.ceilingPanelFrame = standard('#bdc4bd', { roughness: 0.4, metalness: 0.2 });
  R.aisleSignOval = basic('#ffffff');
  R.posterInteriorHot = basic('#ffffff', { map: textures.interiorPosterHot });
  R.posterInteriorCake = basic('#ffffff', { map: textures.interiorPosterCake });
  R.fridgeHeader = basic('#ffffff', { map: textures.fridgeHeader });
  R.counterWood = standard('#8a7156', { roughness: 0.45, metalness: 0.06 });

  // Nature
  R.foliage = toon('#1f362f');
  R.foliageLight = toon('#304c3f');
  R.foliageDark = toon('#142722');
  R.trunk = toon('#362a24');
  R.planter = toon('#4a4e4b');
  R.soil = toon('#2f2a23');

  // Generic labels
  R.aisleSnack = basic('#ffffff', { map: textures.aisleSnack });
  R.aisleDrink = basic('#ffffff', { map: textures.aisleDrink });
  R.aisleDaily = basic('#ffffff', { map: textures.aisleDaily });

  // Label-only helpers
  R.labelWhite = basic('#ffffff');
  R.steam = basic('#dce7e7', { transparent: true, opacity: 0.12, depthWrite: false });

  R.gradient = gradientMap;
  R._toon = toon;
  R._standard = standard;
  R._basic = basic;
  R._smoothGradient = makeSmoothGradient();

  return R;
}
