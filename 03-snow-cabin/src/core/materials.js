import * as THREE from 'three';
import { makeSmoothGradient } from './gradients.js';

export function createMaterials(textures) {
  const R = {};
  const gradientMap = textures.toonGradient;

  const toon = (color, opts = {}) => {
    const m = new THREE.MeshToonMaterial({
      color,
      gradientMap,
      map: opts.map ?? null,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 1,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
      alphaTest: opts.alphaTest ?? 0,
      depthWrite: opts.depthWrite ?? true,
    });
    return m;
  };
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
    envMapIntensity: opts.envMapIntensity ?? 0.4,
  });
  const basic = (color, opts = {}) => {
    const m = new THREE.MeshBasicMaterial({
      color,
      map: opts.map ?? null,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
      depthWrite: opts.depthWrite ?? true,
      alphaTest: opts.alphaTest ?? 0,
      toneMapped: false,
      blending: opts.blending ?? THREE.NormalBlending,
    });
    if (opts.hdr) m.color.multiplyScalar(opts.hdr);
    return m;
  };

  // Ground and plinth
  R.plinth = standard('#2a2d33', { roughness: 0.6, metalness: 0.16, envMapIntensity: 0.25 });
  R.plinthDark = standard('#151a21', { roughness: 0.78, metalness: 0.12 });
  R.brass = standard('#ad8c54', { roughness: 0.3, metalness: 0.85, envMapIntensity: 1.0 });
  R.plinthInlay = standard('#8d774f', { roughness: 0.38, metalness: 0.6 });
  R.snow = toon('#e7eff8', { map: textures.snow });
  R.snowPlain = toon('#eef5fb');
  R.snowShade = toon('#cedce8');
  R.snowBright = toon('#f7fbff');
  R.snowDrift = new THREE.MeshToonMaterial({ color: '#f1f7fc', gradientMap });
  R.ice = new THREE.MeshPhysicalMaterial({
    color: '#d3e6ed',
    map: textures.ice,
    roughness: 0.2,
    metalness: 0.035,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.65,
    emissive: '#0e2935',
    emissiveIntensity: 0.22,
  });
  R.iceDeep = toon('#52788d');
  R.iceEdge = toon('#cae2ea');
  R.snowPath = toon('#d7e5ef');
  R.stone = toon('#ffffff', { map: textures.stone });
  R.stoneDark = toon('#6b6f70');
  R.pathStone = toon('#909594');
  R.soil = toon('#3b2c22');
  R.metalDark = standard('#363b3d', { roughness: 0.45, metalness: 0.65 });
  R.metal = standard('#727b7a', { roughness: 0.38, metalness: 0.68 });
  R.metalLight = standard('#b4b9b2', { roughness: 0.3, metalness: 0.7 });
  R.iron = standard('#2d3031', { roughness: 0.52, metalness: 0.58 });
  R.copper = standard('#a76745', { roughness: 0.33, metalness: 0.75 });
  R.woodTrim = toon('#4e3325');
  R.woodTrimDark = toon('#332117');
  R.wood = toon('#ffffff', { map: textures.woodSiding });
  R.woodPlank = toon('#ffffff', { map: textures.planks });
  R.woodPlankDark = toon('#6d5136', { map: textures.planks });
  R.woodFloor = standard('#ffffff', { map: textures.floorBoards, roughness: 0.4, metalness: 0.02, envMapIntensity: 0.28 });
  R.woodInterior = toon('#ffffff', { map: textures.interiorPlanks, emissive: '#3b2312', emissiveIntensity: 0.17 });
  R.woodInteriorLight = toon('#cbaa80', { map: textures.interiorPlanks, emissive: '#4d2d15', emissiveIntensity: 0.26 });
  R.roof = toon('#ffffff', { map: textures.shingles });
  R.shadowWood = toon('#2b1c13');
  R.logEnd = toon('#ffffff', { map: textures.logEnd });
  R.rug = toon('#ffffff', { map: textures.rug });
  R.plaid = toon('#ffffff', { map: textures.plaid, side: THREE.DoubleSide });
  R.curtain = toon('#ffffff', { map: textures.curtain, side: THREE.DoubleSide });
  R.blanketCream = toon('#d7c3a1');
  R.linen = toon('#e5dbca');
  R.fireStone = toon('#ffffff', { map: textures.stone });
  R.soot = toon('#24201d');
  R.ash = toon('#77736b');
  R.charcoal = toon('#302923');
  R.ember = basic('#ff7b3e', { hdr: 2.0 });
  R.fireGlow = basic('#ffb060', { hdr: 2.6, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  R.warmGlass = basic('#ffcf8a', { hdr: 1.6, transparent: true, opacity: 0.88, depthWrite: false });
  R.warmBulb = basic('#ffe6b2', { hdr: 2.7 });
  R.lampMetal = toon('#2f3937');
  R.copperKettle = standard('#996246', { roughness: 0.3, metalness: 0.7 });

  // Trees / nature
  R.pineDark = toon('#1d3b35');
  R.pine = toon('#2a5147');
  R.pineLight = toon('#376659');
  R.pineBlue = toon('#203d42');
  R.bark = toon('#45332a');
  R.barkLight = toon('#5b4233');
  R.bush = toon('#2e5145');
  R.bushSnow = toon('#dde9f2');
  R.berry = basic('#a2443b');
  R.branchTwig = toon('#3d2e25');

  // Snow-laden pine parts
  R.pineSnow = toon('#eaf3fa');
  R.pineSnowShade = toon('#c3d6e3');

  // Glass
  R.glass = new THREE.MeshPhysicalMaterial({
    color: '#c6dee6',
    transparent: true,
    opacity: 0.12,
    roughness: 0.08,
    metalness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  R.doorGlass = new THREE.MeshPhysicalMaterial({
    color: '#d2e4e6',
    transparent: true,
    opacity: 0.18,
    roughness: 0.07,
    metalness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Foliage and snow caps
  R.snowCap = toon('#edf5fb');
  R.snowCapShade = toon('#c8dbe7');
  R.snowGlow = basic('#d8ecf7', { transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });

  // Exterior decoration
  R.lanternGlass = basic('#ffd99c', { hdr: 1.9, transparent: true, opacity: 0.82, depthWrite: false });
  R.lanternMetal = standard('#333a37', { roughness: 0.42, metalness: 0.55 });
  R.wreath = toon('#2a4e40');
  R.wreathBerry = basic('#a33f39');
  R.sign = toon('#ffffff', { map: textures.sign });
  R.firewoodSign = toon('#ffffff', { map: textures.firewoodSign });
  R.axeHandle = toon('#805837');
  R.axeHead = standard('#8b9290', { roughness: 0.4, metalness: 0.7 });
  R.rope = toon('#b39b72');
  R.sled = toon('#925233');
  R.sledRunner = standard('#5a6261', { roughness: 0.35, metalness: 0.7 });

  // Interior furnishing
  R.cabinet = toon('#7c5a3d');
  R.cabinetDark = toon('#4b3424');
  R.counter = standard('#b78f62', { roughness: 0.37, metalness: 0.04, envMapIntensity: 0.25 });
  R.chairWood = toon('#6b452c');
  R.chairSeat = toon('#af8357');
  R.cushion = toon('#b34e3e');
  R.pillow = toon('#ddc6a1');
  R.bookshelf = toon('#5b3b28');
  R.book1 = toon('#a94c3d');
  R.book2 = toon('#456a58');
  R.book3 = toon('#c9a25d');
  R.book4 = toon('#4b5874');
  R.book5 = toon('#8e6e4e');
  R.book6 = toon('#b9ad91');
  R.plantPot = toon('#a56045');
  R.leaf = toon('#426c4a');
  R.leafLight = toon('#628a60');
  R.clockWood = toon('#5a3b27');
  R.clockFace = basic('#efe4cb');
  R.paintingFrame = toon('#6b4b30');
  R.painting = toon('#ffffff', { map: textures.painting });
  R.botanical = toon('#ffffff', { map: textures.botanical });
  R.rugEdge = toon('#6f3c31');
  R.stoneInterior = toon('#ffffff', { map: textures.stone });
  R.mantel = toon('#6b4a31');
  R.firebrick = toon('#6d5041');
  R.lampShade = basic('#ffdca7', { hdr: 1.6, transparent: true, opacity: 0.9 });
  R.wallLight = basic('#ffd6a1', { hdr: 2.2 });
  R.kitchenWhite = toon('#ded6c2');
  R.ceramic = toon('#e5ded0');
  R.apple = toon('#b4473d');
  R.orange = toon('#d48640');
  R.mug = toon('#d7c3a7');
  R.kettle = standard('#a06f4e', { roughness: 0.3, metalness: 0.65 });
  R.pot = standard('#4a5150', { roughness: 0.4, metalness: 0.55 });
  R.bowl = toon('#c5d4ce');
  R.candle = toon('#f0dfbf');
  R.candleFlame = basic('#ffd17b', { hdr: 2.6, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  R.bluePlaid = toon('#45606b', { map: textures.plaid });
  R.blanket = toon('#ffffff', { map: textures.plaid });

  // Window light / reflections
  R.glassSheen = basic('#d6ecf3', { transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  R.frost = basic('#e7f3f8', { map: null, transparent: true, opacity: 0.24, depthWrite: false });

  // Books / small accents
  R.gold = basic('#d4a758');
  R.greenGlass = basic('#5f8d7b');

  R._toon = toon;
  R._standard = standard;
  R._basic = basic;
  R._smooth = makeSmoothGradient();

  return R;
}
