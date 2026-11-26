import * as THREE from 'three';
import { cylinderBetween, meshRounded, TAU } from '../core/utils.js';

function sphere(parent, R, mat, x, y, z, sx, sy, sz, seg = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.max(8, seg * 0.7)), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function tube(parent, R, mat, points, radius, seg = 16) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, 5, false), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return { mesh: m, curve };
}

function tuft(parent, R, mat, x, y, z, size, rx = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(size * 0.45, size, 5), mat);
  m.position.set(x, y, z);
  m.rotation.x = rx;
  m.rotation.z = rz;
  m.castShadow = false;
  parent.add(m);
  return m;
}

export function buildCat(scene, R) {
  const root = new THREE.Group();
  root.name = 'post-office-cat';
  scene.add(root);
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Main body, a soft loaf shape resting on the counter.
  const body = sphere(bodyGroup, R, R.catOrange, 0, 0.14, -0.08, 0.16, 0.135, 0.29);
  // Haunch and chest add the curled, relaxed silhouette.
  sphere(bodyGroup, R, R.catOrange, 0, 0.15, -0.31, 0.185, 0.15, 0.17);
  sphere(bodyGroup, R, R.catCream, 0, 0.15, 0.12, 0.125, 0.11, 0.11);
  // Cream belly/ruff hint.
  sphere(bodyGroup, R, R.catCream, 0, 0.08, -0.01, 0.13, 0.08, 0.2);
  // Orange haunch top.
  sphere(bodyGroup, R, R.catOrangeLight, 0.02, 0.25, -0.27, 0.11, 0.06, 0.1);
  // Tucked front paws.
  for (const side of [-1, 1]) {
    sphere(bodyGroup, R, R.catWhite, side * 0.08, 0.05, 0.18, 0.065, 0.045, 0.095);
    for (let i = 0; i < 2; i++) {
      const toe = sphere(bodyGroup, R, R.catCream, side * 0.08 + (i - 0.5) * 0.04, 0.045, 0.27, 0.031, 0.027, 0.043, 10);
    }
  }
  // Body stripes, kept as subtle painted-in bands rather than hard shapes.
  for (let i = 0; i < 3; i++) {
    sphere(bodyGroup, R, R.catStripe, 0.005, 0.245 - i * 0.006, -0.16 + i * 0.11, 0.085, 0.012, 0.028, 12);
  }
  // Soft, overlapping chest fluff rather than pointed spikes.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 0.8 + Math.PI * 0.1;
    sphere(bodyGroup, R, R.catCream, Math.cos(a) * 0.13, 0.15 + Math.sin(a) * 0.025, 0.16, 0.055, 0.075, 0.03, 10);
  }

  // Head.
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.36, 0.3);
  bodyGroup.add(headGroup);
  const head = sphere(headGroup, R, R.catOrange, 0, 0, 0, 0.155, 0.135, 0.14);
  // White cheeks and muzzle, with a compact chin.
  sphere(headGroup, R, R.catCream, -0.065, -0.035, 0.075, 0.075, 0.06, 0.062, 14);
  sphere(headGroup, R, R.catCream, 0.065, -0.035, 0.075, 0.075, 0.06, 0.062, 14);
  sphere(headGroup, R, R.catWhite, 0, -0.06, 0.12, 0.068, 0.052, 0.045, 14);
  sphere(headGroup, R, R.catCream, 0, -0.105, 0.105, 0.05, 0.03, 0.035, 12);
  // Tabby M marking across the forehead.
  for (const side of [-1, 1]) {
    const stripe = sphere(headGroup, R, R.catStripe, side * 0.06, 0.055, 0.068, 0.012, 0.038, 0.02, 8);
    stripe.rotation.z = side * 0.46;
  }
  const centerStripe = sphere(headGroup, R, R.catStripe, 0, 0.07, 0.064, 0.008, 0.03, 0.016, 8);
  // Ears, each with a pink inner ear.
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.11, 4), R.catOrange);
    ear.position.set(side * 0.082, 0.11, 0.005);
    ear.rotation.z = side * -0.18;
    ear.rotation.x = -0.08;
    ear.castShadow = true;
    headGroup.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.074, 4), R.catPink);
    inner.position.set(side * 0.079, 0.105, 0.018);
    inner.rotation.z = side * -0.18;
    inner.rotation.x = -0.08;
    headGroup.add(inner);
    // Soft cheek fluff, rounded rather than spiky.
    sphere(headGroup, R, R.catCream, side * 0.11, 0.02, 0.015, 0.048, 0.036, 0.026, 10);
  }
  // Calm, open amber eyes with vertical pupils and a small catchlight.
  for (const side of [-1, 1]) {
    sphere(headGroup, R, R.catEye, side * 0.058, 0.012, 0.123, 0.031, 0.023, 0.008, 14);
    sphere(headGroup, R, R.catIris, side * 0.058, 0.011, 0.129, 0.023, 0.018, 0.007, 14);
    sphere(headGroup, R, R.catDark, side * 0.058, 0.011, 0.136, 0.006, 0.014, 0.004, 10);
    sphere(headGroup, R, R.catEyeGlint, side * 0.065, 0.02, 0.14, 0.0045, 0.0045, 0.003, 8);
  }
  // Pink nose and small mouth, set low on the muzzle.
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), R.catPink);
  nose.scale.set(0.02, 0.014, 0.012);
  nose.position.set(0, -0.035, 0.166);
  headGroup.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 4, 8, Math.PI), R.catDark);
  mouth.position.set(0, -0.06, 0.156);
  mouth.rotation.x = 0.3;
  headGroup.add(mouth);
  // Whiskers, short and fine.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const a = -0.06 + i * 0.06;
      const w = cylinderBetween(
        new THREE.Vector3(side * 0.085, -0.045, 0.15),
        new THREE.Vector3(side * (0.2 + i * 0.02), -0.015 + a, 0.17 + i * 0.012),
        0.0016,
        R.catCream,
        3
      );
      headGroup.add(w);
    }
  }
  // Collar with a tiny bell.
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.012, 5, 18), R.catCollar);
  collar.position.set(0, -0.105, -0.005);
  collar.rotation.x = 0.3;
  collar.scale.set(1, 0.78, 1);
  headGroup.add(collar);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), R.catBell);
  bell.position.set(0, -0.15, 0.04);
  headGroup.add(bell);

  // Tail, curling around the right side of the body.
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0.11, 0.07, -0.4);
  bodyGroup.add(tailGroup);
  const tail = tube(tailGroup, R, R.catOrange, [
    [0, 0, 0],
    [0.18, 0.015, 0.09],
    [0.29, 0.02, 0.25],
    [0.27, 0.03, 0.43],
    [0.15, 0.035, 0.58],
    [0.0, 0.035, 0.65],
  ], 0.047, 22);
  // Dark rings on the tail.
  for (let i = 0; i < 3; i++) {
    const t = 0.32 + i * 0.18;
    const p = tail.curve.getPoint(t);
    const tangent = tail.curve.getTangent(t);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.008, 4, 9), R.catStripe);
    ring.position.copy(p);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent.normalize());
    tailGroup.add(ring);
  }
  const tipPos = tail.curve.getPoint(1);
  const tip = sphere(tailGroup, R, R.catWhite, tipPos.x, tipPos.y, tipPos.z, 0.052, 0.05, 0.06, 12);
  // Soft tufts at the white tail tip.
  sphere(tailGroup, R, R.catWhite, tipPos.x + 0.03, tipPos.y + 0.01, tipPos.z + 0.03, 0.026, 0.024, 0.03, 8);
  sphere(tailGroup, R, R.catWhite, tipPos.x - 0.025, tipPos.y, tipPos.z + 0.04, 0.023, 0.022, 0.027, 8);

  return {
    root,
    bodyGroup,
    headGroup,
    tailGroup,
    tip,
    update(time) {
      // Slow, quiet breathing and small sleepy motions.
      const breath = 1 + Math.sin(time * 1.45) * 0.012;
      bodyGroup.scale.set(1 + Math.sin(time * 1.45) * 0.004, breath, 1 + Math.sin(time * 1.45 + 0.7) * 0.006);
      bodyGroup.position.y = Math.sin(time * 1.45) * 0.003;
      headGroup.rotation.y = Math.sin(time * 0.31 + 0.8) * 0.055;
      headGroup.rotation.x = Math.sin(time * 0.41 + 0.3) * 0.025;
      headGroup.position.y = 0.36 + Math.sin(time * 1.45 + 0.4) * 0.0025;
      // Ear twitch.
      const twitch = Math.max(0, Math.sin(time * 0.85 + 1.7) - 0.96) * 1.2;
      headGroup.rotation.z = twitch * 0.06;
      // Tail tip slow flick.
      tailGroup.rotation.y = Math.sin(time * 0.37 + 1.3) * 0.045;
      tailGroup.rotation.x = Math.sin(time * 0.49) * 0.012;
      tip.scale.set(0.052 + Math.sin(time * 0.37) * 0.003, 0.05, 0.06);
    },
  };
}
