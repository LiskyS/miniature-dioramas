import * as THREE from 'three';
import { CAR, POLES, POST, SNOW_Y, STREET } from '../config.js';
import {
  addContactShadow,
  canvasTexture,
  meshBox,
  meshCyl,
  meshRounded,
  planeGeo,
  rng,
  tubeFromPoints,
  TAU,
} from '../core/utils.js';

function box(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = meshBox(w, h, d, mat, x, y, z, { cast: opts.cast ?? true, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function rounded(parent, w, h, d, r, mat, x, y, z, opts = {}) {
  const m = meshRounded(w, h, d, r, mat, x, y, z, { cast: opts.cast ?? true, receive: opts.receive ?? true });
  parent.add(m);
  return m;
}

function cyl(parent, rt, rb, h, mat, x, y, z, seg = 12, opts = {}) {
  const m = meshCyl(rt, rb, h, mat, x, y, z, seg, { cast: opts.cast ?? true, receive: true });
  parent.add(m);
  return m;
}

function snowCap(parent, R, x, y, z, sx, sy, sz, mat = R.snowDrift) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 6, 0, TAU, 0, Math.PI / 2), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function buildPostbox(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(STREET.postboxX, SNOW_Y + 0.155, STREET.postboxZ);
  root.add(g);
  // Dark base.
  cyl(g, 0.38, 0.42, 0.12, R.metalDark, 0, 0.06, 0, 18);
  cyl(g, 0.34, 0.38, 0.08, R.postboxDark, 0, 0.15, 0, 18);
  // Red enamel body.
  const body = cyl(g, 0.31, 0.32, 1.05, R.postbox, 0, 0.71, 0, 20);
  // Dome and rim.
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 10, 0, TAU, 0, Math.PI / 2), R.postbox);
  dome.position.set(0, 1.23, 0);
  dome.scale.set(1, 0.55, 1);
  dome.castShadow = true;
  g.add(dome);
  cyl(g, 0.34, 0.34, 0.045, R.postboxDark, 0, 1.22, 0, 20);
  // Snow cap.
  snowCap(g, R, 0, 1.41, 0, 0.34, 0.075, 0.33);
  // Front slot, hood and postal mark.
  box(g, 0.4, 0.055, 0.035, R.metalDark, 0, 1.08, 0.305, { cast: false });
  box(g, 0.44, 0.045, 0.13, R.postboxDark, 0, 1.13, 0.29, { cast: false });
  const mark = new THREE.Mesh(planeGeo(0.3, 0.3), R.postboxSymbol);
  mark.position.set(0, 0.83, 0.316);
  mark.renderOrder = 4;
  g.add(mark);
  // Collection plate.
  const plateBack = box(g, 0.31, 0.35, 0.016, R.postboxDark, 0, 0.45, 0.317, { cast: false });
  const plate = new THREE.Mesh(planeGeo(0.27, 0.31), R.postboxPlate);
  plate.position.set(0, 0.45, 0.328);
  g.add(plate);
  // Collection door seam and small lock.
  box(g, 0.22, 0.25, 0.012, R.postboxDark, 0, 0.2, 0.318, { cast: false });
  const lock = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), R.metalLight);
  lock.position.set(0.14, 0.22, 0.34);
  g.add(lock);
  // Snow mound at the base and a little drift against one side.
  snowCap(g, R, -0.24, 0.12, 0.23, 0.25, 0.09, 0.18);
  snowCap(g, R, 0.23, 0.08, 0.2, 0.2, 0.06, 0.18);
  addContactShadow(g, 1.1, 0.9, 0, 0, 0.005, 0.28);
  assembly.add(g, { start: 4.0, duration: 0.8, mode: 'rise', distance: 0.5, land: true, landAt: [STREET.postboxX, SNOW_Y, STREET.postboxZ] });
  return root;
}

function buildCar(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  g.position.set(CAR.x, SNOW_Y + 0.015, CAR.z);
  g.rotation.y = CAR.rot;
  root.add(g);
  // Wheels.
  for (const [x, z] of [[-0.68, -0.93], [0.68, -0.93], [-0.68, 0.93], [0.68, 0.93]]) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16), R.carTire);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, 0.3, z);
    tire.castShadow = true;
    g.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.19, 12), R.carHub);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, 0.3, z);
    g.add(hub);
  }
  // Body.
  const body = rounded(g, 1.5, 0.58, 2.85, 0.18, R.carBody, 0, 0.62, 0, { cast: true });
  const lower = rounded(g, 1.42, 0.2, 2.7, 0.12, R.carBodyShade, 0, 0.4, 0, { cast: true });
  // Cabin.
  rounded(g, 1.36, 0.72, 1.75, 0.2, R.carBody, 0, 1.06, -0.12, { cast: true });
  // Windows: side panes, windshield and rear glass.
  for (const x of [-0.69, 0.69]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.46), R.carGlass);
    side.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    side.position.set(x, 1.13, -0.12);
    side.renderOrder = 3;
    g.add(side);
    const frost = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.38), new THREE.MeshBasicMaterial({
      color: '#eef3f2', transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    }));
    frost.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    frost.position.set(x + x * 0.006, 1.16, -0.12);
    frost.renderOrder = 4;
    g.add(frost);
    // Side-window division and a pale beltline make the car legible at a distance.
    box(g, 0.03, 0.48, 0.1, R.carBodyShade, x + x * 0.01, 1.13, -0.12, { cast: false });
    box(g, 0.035, 0.026, 1.55, R.carHub, x + x * 0.004, 0.9, -0.12, { cast: false });
  }
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.5), R.carGlass);
  windshield.position.set(0, 1.14, 0.75);
  windshield.rotation.x = -0.18;
  windshield.renderOrder = 3;
  g.add(windshield);
  const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.42), R.carGlass);
  rearGlass.position.set(0, 1.13, -1.01);
  rearGlass.rotation.x = 0.16;
  rearGlass.rotation.y = Math.PI;
  rearGlass.renderOrder = 3;
  g.add(rearGlass);
  // Snow on roof, hood and trunk.
  rounded(g, 1.34, 0.23, 1.68, 0.09, R.carSnow, 0, 1.48, -0.13, { cast: false });
  rounded(g, 1.12, 0.125, 0.58, 0.055, R.carSnow, 0, 0.94, 1.0, { cast: false });
  rounded(g, 1.1, 0.12, 0.46, 0.05, R.carSnow, 0, 0.95, -1.1, { cast: false });
  // Snow packed along the top of the windows and the windscreen lip.
  rounded(g, 1.15, 0.055, 0.16, 0.03, R.carSnow, 0, 1.36, 0.63, { cast: false });
  rounded(g, 1.08, 0.05, 0.12, 0.025, R.carSnow, 0, 1.34, -0.93, { cast: false });
  // Bumpers, lights and plate.
  rounded(g, 1.46, 0.15, 0.18, 0.04, R.carBumper, 0, 0.44, 1.42, { cast: true });
  rounded(g, 1.42, 0.14, 0.16, 0.04, R.carBumper, 0, 0.44, -1.42, { cast: true });
  for (const x of [-0.48, 0.48]) {
    const hl = box(g, 0.17, 0.085, 0.035, R.carLight, x, 0.65, 1.445, { cast: false });
    const tl = box(g, 0.15, 0.085, 0.035, R.carTail, x, 0.65, -1.445, { cast: false });
  }
  const frontPlate = new THREE.Mesh(planeGeo(0.42, 0.21), R.carPlate);
  frontPlate.position.set(0, 0.4, 1.45);
  g.add(frontPlate);
  // Door handles and mirrors.
  for (const x of [-0.76, 0.76]) {
    box(g, 0.03, 0.04, 0.2, R.carHub, x, 0.82, 0.18, { cast: false });
    const mirror = box(g, 0.12, 0.1, 0.14, R.carBody, x + (x > 0 ? 0.08 : -0.08), 1.02, 0.55, { cast: false });
  }
  // A little slush packed on the sills rather than fins at the wheel arches.
  for (const x of [-0.7, 0.7]) {
    rounded(g, 0.06, 0.05, 0.62, 0.02, R.carSnow, x, 0.34, 0.42, { cast: false });
    rounded(g, 0.06, 0.045, 0.42, 0.02, R.carSnow, x, 0.34, -0.45, { cast: false });
  }
  addContactShadow(root, 3.1, 2.15, CAR.x, CAR.z, SNOW_Y + 0.02, 0.28, CAR.rot);
  assembly.add(g, { start: 4.65, duration: 0.9, mode: 'drop', distance: 0.55, land: true, landAt: [CAR.x, SNOW_Y, CAR.z] });
  return root;
}

function buildPoles(scene, assets, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const poleGroups = [];
  for (const spec of POLES) {
    const g = new THREE.Group();
    g.position.set(spec.x, SNOW_Y, spec.z);
    root.add(g);
    cyl(g, 0.1, 0.15, spec.h, R.powerPole, 0, spec.h / 2, 0, 10);
    cyl(g, 0.16, 0.16, 0.14, R.powerPoleDark, 0, 0.07, 0, 10);
    // Crossarms and insulators.
    const armY = spec.h - 0.75;
    box(g, 1.4, 0.1, 0.13, R.powerPoleDark, 0, armY, 0, { cast: true });
    box(g, 1.0, 0.08, 0.11, R.powerPoleDark, 0, armY - 0.45, 0, { cast: true });
    for (const x of [-0.56, -0.22, 0.22, 0.56]) {
      cyl(g, 0.045, 0.045, 0.15, R.insulator, x, armY + 0.12, 0, 6);
    }
    for (const x of [-0.38, 0.38]) {
      cyl(g, 0.04, 0.04, 0.13, R.insulator, x, armY - 0.32, 0, 6);
    }
    // Transformer on the larger poles.
    if (spec.variant === 0 || spec.variant === 2) {
      const tr = cyl(g, 0.18, 0.18, 0.48, R.transformer, 0.38, armY - 0.9, 0, 10);
      box(g, 0.18, 0.06, 0.18, R.metalDark, 0.38, armY - 1.16, 0);
      snowCap(g, R, 0.38, armY - 0.62, 0, 0.18, 0.055, 0.18);
    }
    // Snow on the crossarm and cap.
    box(g, 1.32, 0.055, 0.14, R.snowPlain, 0, armY + 0.06, 0, { cast: false });
    snowCap(g, R, 0, spec.h + 0.01, 0, 0.15, 0.06, 0.15);
    addContactShadow(g, 0.8, 0.8, 0, 0, 0.01, 0.22);
    assembly.add(g, { start: 4.55 + spec.variant * 0.09, duration: 0.9, mode: 'rise', distance: 0.55, land: true, landAt: [spec.x, SNOW_Y, spec.z] });
    poleGroups.push({ spec, group: g, armY });
  }
  // Street name plate on the front-right pole.
  const streetPole = poleGroups.find((p) => p.spec.variant === 1);
  if (streetPole) {
    box(streetPole.group, 0.92, 0.28, 0.04, R.streetName, 0.0, 2.75, 0.12, { cast: false });
    const plate = new THREE.Mesh(planeGeo(0.86, 0.24), R.streetName);
    plate.position.set(0, 2.75, 0.15);
    streetPole.group.add(plate);
  }
  // A web of sagging wires, including the crisscross seen in a Japanese street.
  const wires = new THREE.Group();
  root.add(wires);
  const wireMat = new THREE.MeshBasicMaterial({ color: '#3b4342', transparent: true, opacity: 0.9, toneMapped: false });
  const wirePoints = (a, b, sag) => [
    new THREE.Vector3(a.x, a.y, a.z),
    new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 - sag, (a.z + b.z) / 2),
    new THREE.Vector3(b.x, b.y, b.z),
  ];
  const wire = (a, b, sag, r = 0.009) => {
    const w = tubeFromPoints(wirePoints(a, b, sag), r, wireMat, { segments: 22, radialSegments: 4 });
    w.castShadow = false;
    w.receiveShadow = false;
    wires.add(w);
  };
  const p0 = POLES[0];
  const p1 = POLES[1];
  const p2 = POLES[2];
  const p3 = POLES[3];
  // Front street span.
  for (let i = 0; i < 3; i++) {
    const y = 5.45 + i * 0.24;
    wire(new THREE.Vector3(p0.x + 0.4, SNOW_Y + y, p0.z), new THREE.Vector3(p1.x + 0.4, SNOW_Y + y - 0.2, p1.z), 0.5 + i * 0.08);
  }
  wire(new THREE.Vector3(p0.x - 0.4, SNOW_Y + 5.05, p0.z), new THREE.Vector3(p1.x - 0.4, SNOW_Y + 4.9, p1.z), 0.62);
  // Long diagonal wires toward the rear.
  wire(new THREE.Vector3(p0.x + 0.3, SNOW_Y + 6.0, p0.z), new THREE.Vector3(p3.x, SNOW_Y + 5.35, p3.z), 0.9);
  wire(new THREE.Vector3(p1.x - 0.3, SNOW_Y + 5.7, p1.z), new THREE.Vector3(p2.x, SNOW_Y + 5.15, p2.z), 0.7);
  assembly.add(wires, { start: 5.0, duration: 0.9, mode: 'fade' });
  return root;
}

function buildRoadTracks(scene, R, assembly) {
  const root = new THREE.Group();
  scene.add(root);
  const g = new THREE.Group();
  root.add(g);
  const tex = canvasTexture(1024, 64, (ctx, w, h) => {
    const RNG = rng(9041);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.filter = 'blur(3px)';
    const grad = ctx.createLinearGradient(0, 16, 0, 48);
    grad.addColorStop(0, 'rgba(47,60,64,0)');
    grad.addColorStop(0.3, 'rgba(47,60,64,.4)');
    grad.addColorStop(0.7, 'rgba(47,60,64,.3)');
    grad.addColorStop(1, 'rgba(47,60,64,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 14, w, 36);
    ctx.restore();
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = 'rgba(33,46,50,.18)';
      ctx.fillRect(RNG() * w, 22 + RNG() * 18, 6 + RNG() * 16, 1 + RNG() * 2);
    }
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = 'rgba(230,238,239,.1)';
      ctx.fillRect(RNG() * w, 18 + RNG() * 24, 2 + RNG() * 12, 1);
    }
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.75, toneMapped: false });
  for (const z of [6.03, 7.37]) {
    const track = new THREE.Mesh(new THREE.PlaneGeometry(20.8, 0.34), mat.clone());
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, SNOW_Y + 0.155, z);
    track.renderOrder = 2;
    g.add(track);
  }
  assembly.add(g, { start: 1.2, duration: 0.8, mode: 'fade' });
  return root;
}

export function buildStreet(scene, assets, R, assembly) {
  const postbox = buildPostbox(scene, assets, R, assembly);
  const car = buildCar(scene, R, assembly);
  const poles = buildPoles(scene, assets, R, assembly);
  return { postbox, car, poles };
}



