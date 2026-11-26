import * as THREE from 'three';

export function createMaterials(textures) {
  const gradientMap = textures.toonGradient;
  const R = {};
  const toon = (color, opts = {}) => new THREE.MeshToonMaterial({
    color,
    gradientMap,
    map: opts.map ?? null,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
  });
  const standard = (color, opts = {}) => new THREE.MeshStandardMaterial({
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
    envMapIntensity: opts.envMapIntensity ?? 0.55,
  });
  const basic = (color, opts = {}) => new THREE.MeshBasicMaterial({
    color,
    map: opts.map ?? null,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
    alphaTest: opts.alphaTest ?? 0,
    toneMapped: opts.toneMapped ?? false,
    blending: opts.blending ?? THREE.NormalBlending,
  });

  // Ground and display base
  R.plinth = standard('#343a3c', { roughness: 0.62, metalness: 0.1 });
  R.plinthDark = standard('#171d20', { roughness: 0.72, metalness: 0.08 });
  R.brass = standard('#b1925d', { roughness: 0.3, metalness: 0.75 });
  R.plaqueFrame = standard('#806a46', { roughness: 0.35, metalness: 0.65 });
  R.snow = toon('#eef4f7', { map: textures.snow });
  R.snowPlain = toon('#f3f7f9');
  R.snowDrift = toon('#edf3f6');
  R.snowShade = toon('#d4e0e7');
  R.snowBright = toon('#fbfdff');
  R.road = toon('#c7d0d1', { map: textures.road });
  R.sidewalk = toon('#d4dcda', { map: textures.sidewalk });
  R.curb = toon('#a9b1b1');
  R.curbDark = toon('#7d8788');
  R.stone = toon('#aab1b0');
  R.stoneDark = toon('#747f80');
  R.asphalt = toon('#667174');

  // Post office
  R.stucco = toon('#ffffff', { map: textures.stucco });
  R.stuccoWarm = toon('#f0e7c9', { map: textures.stuccoWarm });
  R.trim = toon('#f8f5e9');
  R.trimShade = toon('#dfe2d8');
  R.trimDark = toon('#b9bfb7');
  R.foundation = toon('#adb0aa');
  R.foundationDark = toon('#808784');
  R.roof = toon('#ffffff', { map: textures.roofTile });
  R.roofDark = toon('#596163', { map: textures.roofTile });
  R.gutter = standard('#d9ddda', { roughness: 0.45, metalness: 0.45 });
  R.doorWood = toon('#806445');
  R.doorWoodDark = toon('#5f4b35');
  R.interiorWall = toon('#e4d4b8');
  R.interiorWallShade = toon('#d9cbb4');
  R.interiorFloor = toon('#ffffff', { map: textures.interiorFloor });
  R.ceiling = toon('#f2f0e7');
  R.counterMetal = standard('#96a19e', { roughness: 0.26, metalness: 0.58, envMapIntensity: 1.0 });
  R.counterEdge = standard('#939c9a', { roughness: 0.28, metalness: 0.55 });
  R.counterFront = toon('#9e8463');
  R.counterFrontDark = toon('#8d7b5e');
  R.metalDark = standard('#545e5d', { roughness: 0.4, metalness: 0.55 });
  R.metal = standard('#8d9694', { roughness: 0.34, metalness: 0.52 });
  R.metalLight = standard('#bdc4c0', { roughness: 0.3, metalness: 0.5 });
  R.iron = standard('#3f4745', { roughness: 0.5, metalness: 0.5 });
  R.brassDark = standard('#8b744c', { roughness: 0.36, metalness: 0.65 });
  R.postbox = standard('#c23d32', { roughness: 0.38, metalness: 0.18 });
  R.postboxDark = standard('#8c2b24', { roughness: 0.42, metalness: 0.2 });
  R.postboxCap = toon('#f7f4e9');
  R.warmBulb = basic('#ffe5b7', { transparent: true, opacity: 0.92 });
  R.lightPanel = basic('#fff2d4');
  R.lampShade = basic('#f4e7c4');
  R.whiteGlobe = basic('#faf4de');
  R.glass = new THREE.MeshPhysicalMaterial({
    color: '#d9e9ec',
    transparent: true,
    opacity: 0.14,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  R.glassDoor = new THREE.MeshPhysicalMaterial({
    color: '#e4f0ef',
    transparent: true,
    opacity: 0.16,
    roughness: 0.07,
    metalness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
    envMapIntensity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  R.frost = basic('#edf6f8', { transparent: true, opacity: 0.3, depthWrite: false });
  R.glassStreak = basic('#e8f4f8', { transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });

  // Signs and paper
  R.sign = basic('#ffffff', { map: textures.sign, transparent: false });
  R.hours = basic('#ffffff', { map: textures.hours });
  R.postboxPlate = basic('#ffffff', { map: textures.postboxPlate });
  R.postboxSymbol = basic('#ffffff', { map: textures.postboxSymbol, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  R.clock = basic('#ffffff', { map: textures.clock, transparent: true });
  R.posterNewYear = basic('#ffffff', { map: textures.posterNewYear });
  R.posterNotice = basic('#ffffff', { map: textures.posterNotice });
  R.posterPrint = basic('#ffffff', { map: textures.posterPrint });
  R.carPlate = basic('#ffffff', { map: textures.carPlate });
  R.streetName = basic('#ffffff', { map: textures.streetName });
  R.plaque = basic('#ffffff', { map: textures.plaque });
  R.paper = toon('#f2eee1');
  R.paperShade = toon('#e4dece');
  R.envelope = toon('#f4f0e3');
  R.parcel = toon('#b9926c');
  R.parcelLight = toon('#c7a783');
  R.parcelTape = toon('#c5bca7');
  R.mailSack = toon('#8c4e42');
  R.mailSackDark = toon('#653934');
  R.stampRed = basic('#c23c30');
  R.inkPad = toon('#3a4140');
  R.penCup = toon('#8d9d98');
  R.jars = [toon('#97b3aa'), toon('#d8c6a0'), toon('#b8896e'), toon('#91aab8')];

  // Cat
  R.catOrange = toon('#d58a4b');
  R.catOrangeLight = toon('#e7a567');
  R.catOrangeDark = toon('#b96e39');
  R.catStripe = toon('#ad6435');
  R.catCream = toon('#f5ead8');
  R.catWhite = toon('#fbf6eb');
  R.catPink = toon('#d99b97');
  R.catDark = toon('#3b302a');
  R.catCollar = toon('#5f7f7a');
  R.catBell = toon('#d8aa57');
  R.catEye = toon('#3b322b');
  R.catIris = toon('#d6a03f');
  R.catEyeGlint = basic('#fff9ea');

  // Neighbours and street
  R.sidingCream = toon('#f4eedf', { map: textures.siding });
  R.sidingSage = toon('#d8ded3', { map: textures.siding });
  R.sidingBlue = toon('#cfdadd', { map: textures.siding });
  R.sidingWarm = toon('#e4d4ba', { map: textures.siding });
  R.houseWall = toon('#e8e0cf');
  R.houseRoof = toon('#4e5859', { map: textures.roofTile });
  R.houseRoofWarm = toon('#625b50', { map: textures.roofTile });
  R.houseWindowDark = standard('#66777b', { roughness: 0.22, metalness: 0.2 });
  R.houseWindowWarm = basic('#f2ce91');
  R.wood = toon('#8c7251');
  R.woodDark = toon('#5b4b39');
  R.woodLight = toon('#b29872');
  R.blockWall = toon('#aeb1ac');
  R.blockJoint = toon('#8f9691');
  R.hedge = toon('#526c5c');
  R.hedgeLight = toon('#6f8774');
  R.shrub = toon('#5b7562');
  R.branch = toon('#5b4c3d');
  R.branchSnow = toon('#edf4f7');
  R.powerPole = toon('#777d78');
  R.powerPoleDark = toon('#565d5a');
  R.wire = new THREE.LineBasicMaterial({ color: '#3e4545', transparent: true, opacity: 0.82 });
  R.insulator = toon('#e7e5da');
  R.transformer = standard('#8e9691', { roughness: 0.45, metalness: 0.35 });
  R.carBody = standard('#6d8581', { roughness: 0.4, metalness: 0.3 });
  R.carBodyShade = standard('#526a67', { roughness: 0.44, metalness: 0.26 });
  R.carGlass = standard('#9db1b2', { roughness: 0.14, metalness: 0.3, transparent: true, opacity: 0.58 });
  R.carTire = standard('#262b2c', { roughness: 0.85, metalness: 0.0 });
  R.carHub = standard('#b5b9b5', { roughness: 0.35, metalness: 0.6 });
  R.carLight = basic('#fff4d3');
  R.carTail = basic('#b64a43');
  R.carBumper = standard('#6e7978', { roughness: 0.5, metalness: 0.2 });
  R.carSnow = toon('#f2f7f9');
  R.glassWarm = new THREE.MeshPhysicalMaterial({
    color: '#f0d9b4',
    transparent: true,
    opacity: 0.35,
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Office small things
  R.cardboard = toon('#b4966f');
  R.cardboardDark = toon('#967b59');
  R.tin = standard('#aeb3ad', { roughness: 0.35, metalness: 0.55 });
  R.plantPot = toon('#a58b6f');
  R.leaf = toon('#4d6c55');
  R.leafLight = toon('#69836b');
  R.redNotebook = toon('#a54b42');
  R.blueNotebook = toon('#4d6d7a');
  R.greenNotebook = toon('#607c65');
  R.catCushion = toon('#b9a98e');

  R._toon = toon;
  R._standard = standard;
  R._basic = basic;
  return R;
}


