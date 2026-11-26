import * as THREE from 'three';
import { clamp, easeOutBack, easeOutCubic, easeOutElastic, easeOutQuint } from './core/utils.js';

const EASES = {
  outCubic: easeOutCubic,
  outQuint: easeOutQuint,
  outBack: (t) => easeOutBack(t, 1.4),
  outSoftBack: (t) => easeOutBack(t, 0.8),
  elastic: easeOutElastic,
};

export class Assembly {
  constructor() {
    this.items = [];
    this.lights = [];
    this.time = 0;
    this.done = false;
    this.onSettle = null;
    this.started = false;
  }

  add(object, opts = {}) {
    const item = {
      object,
      start: opts.start ?? 0,
      duration: opts.duration ?? 0.8,
      mode: opts.mode ?? 'rise',
      distance: opts.distance ?? 2.3,
      spin: opts.spin ?? 0,
      offset: new THREE.Vector3(...(opts.offset ?? [0, 0, 0])),
      ease: EASES[opts.ease ?? 'outCubic'] ?? easeOutCubic,
      land: opts.land ?? false,
      landAt: opts.landAt ? new THREE.Vector3(...opts.landAt) : null,
      basePosition: object.position.clone(),
      baseRotation: object.rotation.clone(),
      baseScale: object.scale.clone(),
      done: false,
      started: false,
    };
    object.visible = false;
    if (item.mode === 'fade') {
      const clones = new Map();
      object.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        const isArray = Array.isArray(o.material);
        const mats = isArray ? o.material : [o.material];
        const next = mats.map((m) => {
          if (!clones.has(m)) {
            const c = m.clone();
            c.transparent = true;
            c.userData.baseOpacity = m.opacity;
            c.userData.baseDepthWrite = m.depthWrite;
            c.opacity = 0;
            c.depthWrite = false;
            c.needsUpdate = true;
            clones.set(m, c);
          }
          return clones.get(m);
        });
        o.material = isArray ? next : next[0];
      });
      object.userData._fadeMats = [...new Set(clones.values())];
    } else {
      object.traverse((o) => {
        if (o.isMesh && o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if (m.transparent && m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
          }
        }
      });
    }
    if (item.mode === 'draw') {
      object.traverse((o) => {
        if (!o.isMesh || !o.geometry || !o.geometry.index) return;
        o.userData._fullIndexCount = o.geometry.index.count;
        o.geometry.setDrawRange(0, 0);
      });
    }
    this.items.push(item);
    return object;
  }

  addLight(light, opts = {}) {
    const item = {
      light,
      start: opts.start ?? 0,
      duration: opts.duration ?? 0.7,
      target: opts.intensity ?? light.intensity,
      flicker: opts.flicker ?? false,
      spinUp: opts.spinUp ?? false,
      done: false,
    };
    light.intensity = 0;
    this.lights.push(item);
    return light;
  }

  update(time) {
    this.time = Math.max(this.time, time);
    this.started = this.time > 0.01;
    let allDone = true;
    for (const it of this.items) {
      if (it.done) continue;
      const t = time - it.start;
      if (t < 0) {
        allDone = false;
        continue;
      }
      if (!it.started) {
        it.started = true;
        it.object.visible = true;
      }
      const p = clamp(t / it.duration, 0, 1);
      const e = it.ease(p);
      const obj = it.object;
      switch (it.mode) {
        case 'grow': {
          obj.position.copy(it.basePosition);
          obj.rotation.copy(it.baseRotation);
          obj.scale.set(
            it.baseScale.x * (0.94 + 0.06 * e),
            Math.max(0.001, it.baseScale.y * e),
            it.baseScale.z * (0.94 + 0.06 * e)
          );
          break;
        }
        case 'growX': {
          obj.position.copy(it.basePosition);
          obj.scale.set(Math.max(0.001, it.baseScale.x * e), it.baseScale.y, it.baseScale.z);
          break;
        }
        case 'unfold': {
          obj.position.copy(it.basePosition);
          obj.scale.set(it.baseScale.x, it.baseScale.y, Math.max(0.001, it.baseScale.z * e));
          break;
        }
        case 'rise': {
          obj.position.copy(it.basePosition);
          obj.position.y += -it.distance * (1 - e);
          obj.rotation.copy(it.baseRotation);
          obj.rotation.y += it.spin * (1 - e);
          const s = 0.62 + 0.38 * e;
          obj.scale.set(it.baseScale.x * s, it.baseScale.y * s, it.baseScale.z * s);
          break;
        }
        case 'drop': {
          obj.position.copy(it.basePosition);
          obj.position.y += it.distance * (1 - e);
          obj.position.x += it.offset.x * (1 - e);
          obj.position.z += it.offset.z * (1 - e);
          obj.rotation.copy(it.baseRotation);
          obj.rotation.y += it.spin * (1 - e);
          const s = 0.64 + 0.36 * e;
          obj.scale.set(it.baseScale.x * s, it.baseScale.y * s, it.baseScale.z * s);
          break;
        }
        case 'pop': {
          obj.position.copy(it.basePosition);
          obj.rotation.copy(it.baseRotation);
          const s = Math.max(0.001, e);
          obj.scale.copy(it.baseScale).multiplyScalar(s);
          break;
        }
        case 'slide': {
          obj.position.copy(it.basePosition).addScaledVector(it.offset, 1 - e);
          obj.rotation.copy(it.baseRotation);
          obj.scale.copy(it.baseScale);
          break;
        }
        case 'draw': {
          obj.position.copy(it.basePosition);
          obj.traverse((o) => {
            if (!o.isMesh || o.userData._fullIndexCount === undefined) return;
            const n = Math.floor(o.userData._fullIndexCount * e);
            o.geometry.setDrawRange(0, n);
          });
          if (p >= 1) obj.traverse((o) => { if (o.geometry) o.geometry.setDrawRange(0, Infinity); });
          break;
        }
        case 'fade': {
          obj.visible = true;
          const mats = obj.userData._fadeMats;
          if (mats) {
            for (const m of mats) m.opacity = m.userData.baseOpacity * e;
          }
          break;
        }
        default: {
          obj.position.copy(it.basePosition);
          obj.rotation.copy(it.baseRotation);
          obj.scale.copy(it.baseScale);
        }
      }
      if (p >= 1) {
        it.done = true;
        obj.position.copy(it.basePosition);
        obj.rotation.copy(it.baseRotation);
        obj.scale.copy(it.baseScale);
        obj.visible = true;
        if (it.mode === 'fade') {
          const mats = obj.userData._fadeMats;
          if (mats) {
            for (const m of mats) {
              m.opacity = m.userData.baseOpacity;
              m.depthWrite = m.userData.baseDepthWrite ?? true;
            }
          }
        }
        if (it.mode === 'draw') {
          obj.traverse((o) => { if (o.geometry) o.geometry.setDrawRange(0, Infinity); });
        }
        if (it.land && this.onSettle) {
          let pos = it.landAt;
          if (!pos) {
            pos = new THREE.Vector3();
            obj.updateWorldMatrix(true, false);
            pos.setFromMatrixPosition(obj.matrixWorld);
          }
          this.onSettle(pos, it);
        }
      } else {
        allDone = false;
      }
    }
    for (const it of this.lights) {
      if (it.done) continue;
      const t = time - it.start;
      if (t < 0) { allDone = false; continue; }
      const p = clamp(t / it.duration, 0, 1);
      const e = clamp(p, 0, 1);
      let v = it.target * e;
      if (it.flicker && p < 0.9) {
        v *= 0.34 + 0.66 * (Math.sin(p * 90 + it.start * 11) > -0.2 ? 1 : 0.25);
      }
      it.light.intensity = v;
      if (p >= 1) {
        it.light.intensity = it.target;
        it.done = true;
      } else allDone = false;
    }
    if (allDone && time > 1) this.done = true;
  }

  finish() {
    this.update(9999);
    for (const it of this.items) it.done = true;
    this.lights.forEach((l) => { l.light.intensity = l.target; l.done = true; });
    this.done = true;
  }
}
