import * as THREE from 'three';
import { canvasTexture, makeCanvas, rng, TAU } from './utils.js';
import { CITY_HALF, PUDDLES, STORE } from '../config.js';

const JP = "'Yu Gothic UI','Yu Gothic','Hiragino Kaku Gothic ProN','Noto Sans JP','Meiryo',sans-serif";
const DISPLAY = "'Yu Mincho','YuMincho','Hiragino Mincho ProN','Noto Serif JP',serif";

function star(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function spacedText(ctx, text, x, y, spacing) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cursor = x - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, cursor + widths[i] / 2, y);
    cursor += widths[i] + spacing;
  });
}

// ---------------------------------------------------------------------------
// Toon ramp
// ---------------------------------------------------------------------------
export function makeToonGradient() {
  const data = new Uint8Array([38, 90, 152, 212, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Ground & base textures
// ---------------------------------------------------------------------------
export function makeAsphaltTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(8117);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#202b33');
    grad.addColorStop(0.45, '#18232b');
    grad.addColorStop(1, '#111b23');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Broad damp patches.
    for (let i = 0; i < 26; i++) {
      const x = R() * w;
      const y = R() * h;
      const rx = 50 + R() * 180;
      const ry = 30 + R() * 130;
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      const dark = R() > 0.45;
      g.addColorStop(0, dark ? 'rgba(8,15,21,.20)' : 'rgba(86,107,118,.08)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, R() * TAU, 0, TAU);
      ctx.fill();
    }

    // Aggregate.
    for (let i = 0; i < 26000; i++) {
      const x = R() * w;
      const y = R() * h;
      const s = 0.5 + R() * 1.9;
      const v = R();
      ctx.fillStyle = v > 0.55
        ? `rgba(154,176,187,${0.02 + R() * 0.075})`
        : `rgba(0,3,8,${0.03 + R() * 0.11})`;
      ctx.fillRect(x, y, s, s);
    }

    // Hairline cracks and old tar seams.
    ctx.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      let x = R() * w;
      let y = R() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 9; j++) {
        x += (R() - 0.5) * 54;
        y += 18 + R() * 46;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(4,8,12,${0.12 + R() * 0.2})`;
      ctx.lineWidth = 0.7 + R() * 1.2;
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const x = R() * w;
      ctx.fillStyle = 'rgba(4,8,12,.12)';
      ctx.fillRect(x, 0, 4 + R() * 9, h);
    }

    // Faint tire wear.
    for (let i = 0; i < 5; i++) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, 'rgba(45,58,67,.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, R() * h, w, 14 + R() * 30);
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeSidewalkTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(9523);
    ctx.fillStyle = '#8d8b84';
    ctx.fillRect(0, 0, w, h);
    const n = 8;
    const step = w / n;
    for (let iy = 0; iy < n; iy++) {
      for (let ix = 0; ix < n; ix++) {
        const tone = 124 + Math.floor(R() * 20);
        ctx.fillStyle = `rgb(${tone + 12},${tone + 10},${tone + 3})`;
        ctx.fillRect(ix * step + 2, iy * step + 2, step - 4, step - 4);
        // subtle wet mottling
        for (let k = 0; k < 16; k++) {
          ctx.fillStyle = R() > 0.55 ? 'rgba(255,255,255,.035)' : 'rgba(38,44,46,.045)';
          const rx = 4 + R() * 30;
          ctx.beginPath();
          ctx.ellipse(ix * step + R() * step, iy * step + R() * step, rx, rx * (0.25 + R() * 0.5), R() * TAU, 0, TAU);
          ctx.fill();
        }
      }
    }
    // Grout lines.
    ctx.strokeStyle = 'rgba(55,59,59,.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(w, i * step);
      ctx.stroke();
    }
    // Damp stains near curb.
    for (let i = 0; i < 20; i++) {
      const x = R() * w;
      const y = R() * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 15 + R() * 85);
      g.addColorStop(0, 'rgba(42,52,56,.15)');
      g.addColorStop(1, 'rgba(42,52,56,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 100, y - 100, 200, 200);
    }
    // Fine grain.
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.045)' : 'rgba(25,30,30,.04)';
      ctx.fillRect(R() * w, R() * h, 1, 1);
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeWoodTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const R = rng(4412);
    ctx.fillStyle = '#1d2028';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) {
      const shade = 25 + Math.floor(R() * 11);
      ctx.fillStyle = `rgb(${shade},${shade + 3},${shade + 8})`;
      ctx.fillRect(0, y, w, 62);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(0, y + 62, w, 2);
      for (let i = 0; i < 42; i++) {
        const yy = y + 6 + R() * 48;
        ctx.strokeStyle = R() > 0.5 ? 'rgba(255,255,255,.018)' : 'rgba(0,0,0,.08)';
        ctx.lineWidth = 0.6 + R() * 1.4;
        ctx.beginPath();
        ctx.moveTo(-20, yy);
        ctx.bezierCurveTo(w * 0.25, yy + R() * 6 - 3, w * 0.65, yy + R() * 5 - 2.5, w + 20, yy + R() * 3 - 1.5);
        ctx.stroke();
      }
    }
    const glow = ctx.createLinearGradient(0, 0, 0, h);
    glow.addColorStop(0, 'rgba(120,165,190,.05)');
    glow.addColorStop(0.5, 'rgba(0,0,0,0)');
    glow.addColorStop(1, 'rgba(0,0,0,.25)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping });
}

export function makePuddleMask() {
  const mapPx = (x) => ((x + CITY_HALF) / (CITY_HALF * 2)) * 1024;
  const mapPy = (z) => ((z + CITY_HALF) / (CITY_HALF * 2)) * 1024;
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(7001);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    // Everything visible is a paved surface. Sidewalks are excluded.
    ctx.fillStyle = 'rgba(255,255,255,.075)';
    ctx.fillRect(0, mapPy(3.18), w, h - mapPy(3.18));
    ctx.fillRect(mapPx(4.16), 0, w - mapPx(4.16), h);
    // Feather the sidewalk boundary.
    ctx.globalCompositeOperation = 'destination-out';
    const fe = 18;
    const g1 = ctx.createLinearGradient(0, mapPy(3.18) - fe, 0, mapPy(3.18) + fe);
    g1.addColorStop(0, 'rgba(0,0,0,1)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, mapPy(3.18));
    const g2 = ctx.createLinearGradient(mapPx(4.16) - fe, 0, mapPx(4.16) + fe, 0);
    g2.addColorStop(0, 'rgba(0,0,0,1)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, mapPx(4.16), h);
    ctx.globalCompositeOperation = 'source-over';

    // Wet, irregular puddle shapes.
    const drawPuddle = (p) => {
      const cx = mapPx(p.x);
      const cy = mapPy(p.z);
      const rx = (p.rx / (CITY_HALF * 2)) * w;
      const rz = (p.rz / (CITY_HALF * 2)) * h;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(p.rot || 0);
      const g = ctx.createRadialGradient(0, 0, Math.min(rx, rz) * 0.05, 0, 0, Math.max(rx, rz) * 1.02);
      g.addColorStop(0, `rgba(255,255,255,${p.alpha ?? 0.88})`);
      g.addColorStop(0.55, `rgba(255,255,255,${(p.alpha ?? 0.88) * 0.92})`);
      g.addColorStop(0.82, `rgba(255,255,255,${(p.alpha ?? 0.88) * 0.52})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, rz, 0, 0, TAU);
      ctx.fill();

      // uneven satellite lobes give the water an organic outline
      const lobes = 2 + Math.floor(R() * 3);
      for (let i = 0; i < lobes; i++) {
        const a = R() * TAU;
        const d = R() * 0.5;
        const lx = Math.cos(a) * rx * d;
        const ly = Math.sin(a) * rz * d;
        const lr = Math.min(rx, rz) * (0.25 + R() * 0.4);
        const gg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        gg.addColorStop(0, `rgba(255,255,255,${(p.alpha ?? 0.88) * 0.68})`);
        gg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.ellipse(lx, ly, lr * 1.2, lr * 0.7, R() * TAU, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    };
    PUDDLES.forEach(drawPuddle);

    // A long glossy wash along the gutter.
    const gutter = ctx.createLinearGradient(0, mapPy(3.2), 0, mapPy(4.3));
    gutter.addColorStop(0, 'rgba(255,255,255,.28)');
    gutter.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gutter;
    ctx.fillRect(0, mapPy(3.2), w, mapPy(4.3) - mapPy(3.2));
    const gutter2 = ctx.createLinearGradient(mapPx(4.2), 0, mapPx(5.5), 0);
    gutter2.addColorStop(0, 'rgba(255,255,255,.22)');
    gutter2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gutter2;
    ctx.fillRect(mapPx(4.2), 0, mapPx(5.5) - mapPx(4.2), h);

    // Rain speckle breaks up the edge.
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 500; i++) {
      const x = R() * w;
      const y = mapPy(3.0) + R() * (h - mapPy(3.0));
      ctx.fillStyle = `rgba(0,0,0,${R() * 0.08})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.5 + R() * 3, 0, TAU);
      ctx.fill();
    }
  });
}

export function makeSkyTexture() {
  return canvasTexture(2048, 1024, (ctx, w, h) => {
    const R = rng(2244);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#03060d');
    grad.addColorStop(0.27, '#07101d');
    grad.addColorStop(0.44, '#0b1929');
    grad.addColorStop(0.53, '#152a3b');
    grad.addColorStop(0.58, '#243c4c');
    grad.addColorStop(0.63, '#182b3a');
    grad.addColorStop(0.72, '#07111b');
    grad.addColorStop(1, '#02050a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Low city-light haze at the horizon.
    const glows = [
      [0.2, 0.57, 300, 'rgba(232,165,132,.11)'],
      [0.43, 0.56, 360, 'rgba(120,214,215,.12)'],
      [0.75, 0.56, 300, 'rgba(196,125,195,.10)'],
      [0.95, 0.58, 260, 'rgba(120,177,205,.09)'],
    ];
    for (const [u, v, r, col] of glows) {
      const x = u * w;
      const y = v * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Rain clouds, blurred and layered.
    ctx.save();
    ctx.filter = 'blur(26px)';
    for (let i = 0; i < 75; i++) {
      const x = R() * w;
      const y = 40 + R() * h * 0.43;
      const rx = 60 + R() * 280;
      const ry = 9 + R() * 45;
      const v = R();
      ctx.fillStyle = v > 0.4
        ? `rgba(75,104,127,${0.025 + R() * 0.075})`
        : `rgba(16,29,44,${0.08 + R() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, (R() - 0.5) * 0.15, 0, TAU);
      ctx.fill();
    }
    // A soft break in the clouds, like moonlight behind the rain.
    const moonX = w * 0.66;
    const moonY = h * 0.22;
    const moon = ctx.createRadialGradient(moonX, moonY, 2, moonX, moonY, 190);
    moon.addColorStop(0, 'rgba(220,236,245,.22)');
    moon.addColorStop(0.12, 'rgba(155,194,216,.09)');
    moon.addColorStop(0.55, 'rgba(115,164,195,.04)');
    moon.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(moonX - 240, moonY - 240, 480, 480);
    ctx.restore();

    // Faint stars seen through thinner cloud.
    for (let i = 0; i < 65; i++) {
      const x = R() * w;
      const y = R() * h * 0.38;
      ctx.fillStyle = `rgba(184,215,238,${0.03 + R() * 0.13})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.5 + R() * 1.15, 0, TAU);
      ctx.fill();
    }
  }, { wrapS: THREE.RepeatWrapping });
}

export function makeTactileTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c3a94b';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const y = 20 + i * 29;
      ctx.fillStyle = 'rgba(73,63,27,.28)';
      ctx.fillRect(0, y + 8, w, 3);
      ctx.fillStyle = 'rgba(255,237,152,.38)';
      ctx.fillRect(0, y, w, 3);
    }
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = 'rgba(90,76,33,.09)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

// ---------------------------------------------------------------------------
// Lighting / effect textures
// ---------------------------------------------------------------------------
export function makeGlowTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.09, 'rgba(255,255,255,.92)');
    g.addColorStop(0.28, 'rgba(255,255,255,.32)');
    g.addColorStop(0.62, 'rgba(255,255,255,.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeStreakTexture() {
  return canvasTexture(256, 1024, (ctx, w, h) => {
    const R = rng(730);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) {
      const x = w * (0.1 + R() * 0.8);
      const ww = 3 + R() * 24;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.16, `rgba(255,255,255,${0.12 + R() * 0.3})`);
      g.addColorStop(0.45, `rgba(255,255,255,${0.05 + R() * 0.15})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - ww / 2, 0, ww, h);
    }
    // horizontal broken glints
    for (let i = 0; i < 100; i++) {
      const y = h * (0.2 + R() * 0.75);
      const x = R() * w;
      const ww = 2 + R() * 22;
      ctx.fillStyle = `rgba(255,255,255,${0.02 + R() * 0.15})`;
      ctx.fillRect(x, y, ww, 1 + R() * 1.8);
    }
  });
}

export function makeLightPoolTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,.95)');
    g.addColorStop(0.3, 'rgba(255,255,255,.38)');
    g.addColorStop(0.65, 'rgba(255,255,255,.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeGlassStreakTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const R = rng(917);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.filter = 'blur(7px)';
    for (let i = 0; i < 5; i++) {
      const x = 80 + i * 210 + R() * 90;
      const g = ctx.createLinearGradient(x, 0, x + 260, h);
      g.addColorStop(0, 'rgba(213,245,255,0)');
      g.addColorStop(0.32, 'rgba(225,249,255,.20)');
      g.addColorStop(0.55, 'rgba(255,255,255,.065)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 70, 0);
      ctx.lineTo(x + 150, 0);
      ctx.lineTo(x + 80, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < 28; i++) {
      const x = R() * w;
      const y = R() * h;
      ctx.fillStyle = 'rgba(235,250,255,.16)';
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + R() * 1.8, 0, TAU);
      ctx.fill();
    }
  });
}

export function makeRingTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.27, w / 2, h / 2, w * 0.48);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.6, 'rgba(255,255,255,.08)');
    g.addColorStop(0.8, 'rgba(255,255,255,.9)');
    g.addColorStop(0.9, 'rgba(255,255,255,.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeSteamTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const R = rng(661);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) {
      const x = w * 0.5 + (R() - 0.5) * 85;
      const y = h * 0.62 + (R() - 0.5) * 80;
      const r = 18 + R() * 55;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.025 + R() * 0.06})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

// ---------------------------------------------------------------------------
// Signage
// ---------------------------------------------------------------------------
export function makeMainSignTexture() {
  return canvasTexture(2048, 280, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#073c3e');
    bg.addColorStop(0.55, '#04252b');
    bg.addColorStop(1, '#021a21');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // neon rim
    ctx.strokeStyle = 'rgba(118,255,222,.9)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.strokeStyle = 'rgba(118,255,222,.2)';
    ctx.lineWidth = 18;
    ctx.strokeRect(28, 28, w - 56, h - 56);
    // orange foundational stripe
    ctx.fillStyle = '#ffb15c';
    ctx.fillRect(8, h - 18, w - 16, 10);

    // star mark
    ctx.save();
    ctx.shadowColor = '#9effe6';
    ctx.shadowBlur = 26;
    star(ctx, 185, h * 0.44, 58, '#eafff7');
    ctx.restore();
    ctx.fillStyle = 'rgba(185,255,238,.86)';
    ctx.font = `600 23px ${JP}`;
    ctx.textAlign = 'center';
    spacedText(ctx, 'HOSHIZUKU', 185, h * 0.76, 7);

    ctx.save();
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(194,255,239,.9)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#f9f4e2';
    ctx.font = `700 148px ${JP}`;
    ctx.fillText('星屑マート', 320, 167);
    ctx.restore();

    ctx.fillStyle = 'rgba(161,255,229,.95)';
    ctx.font = `600 37px ${JP}`;
    ctx.textAlign = 'left';
    spacedText(ctx, 'HOSHIZUKU MART', 1160, 118, 8);
    ctx.fillStyle = 'rgba(198,236,231,.6)';
    ctx.font = `500 25px ${JP}`;
    ctx.fillText('星見通り店  /  24 HOURS', 1160, 165);

    // 24H badge
    roundRect(ctx, w - 310, 44, 232, 132, 30);
    ctx.fillStyle = 'rgba(120,255,219,.13)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,255,224,.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#f7ffe9';
    ctx.font = `800 98px ${JP}`;
    ctx.textAlign = 'center';
    ctx.fillText('24H', w - 194, 145);
    ctx.fillStyle = 'rgba(163,255,230,.72)';
    ctx.font = `500 19px ${JP}`;
    spacedText(ctx, 'ALWAYS OPEN', w - 194, 190, 3);
  });
}

export function makeSideSignTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#04252a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(118,255,222,.65)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#ffb15c';
    ctx.fillRect(6, h - 16, w - 12, 8);
    star(ctx, 80, 72, 32, '#eafff7');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f9f4e2';
    ctx.font = `700 90px ${JP}`;
    ctx.fillText('ATM ・ コピー', 140, 112);
    ctx.fillStyle = 'rgba(166,255,231,.9)';
    ctx.font = `600 34px ${JP}`;
    spacedText(ctx, 'COFFEE  /  HOT SNACK  /  DAILY GOODS', 510, 184, 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f7ffe9';
    ctx.font = `800 86px ${JP}`;
    ctx.fillText('24H', w - 44, 120);
  });
}

export function makeBladeSignTexture() {
  return canvasTexture(384, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#042a2e';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(140,255,227,.85)';
    ctx.lineWidth = 7;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#ffad5d';
    ctx.fillRect(12, h - 90, w - 24, 16);
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#baffee';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#fbf6e5';
    ctx.font = `800 170px ${JP}`;
    ctx.fillText('24', w / 2, 265);
    ctx.fillText('H', w / 2, 465);
    ctx.restore();
    star(ctx, w / 2, 610, 56, '#ffbd76');
    ctx.fillStyle = 'rgba(171,255,233,.92)';
    ctx.font = `600 35px ${JP}`;
    spacedText(ctx, 'OPEN', w / 2, 760, 10);
    ctx.font = `500 25px ${JP}`;
    ctx.fillStyle = 'rgba(220,255,245,.55)';
    ctx.fillText('星屑マート', w / 2, 856);
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.fillRect(30, 900, w - 60, 2);
  });
}

export function makeCafeSignTexture() {
  return canvasTexture(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(10,12,19,.96)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,127,185,.6)';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#ff72bb';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffd4e8';
    ctx.font = `600 120px ${DISPLAY}`;
    ctx.fillText('夜', w / 2, 250);
    ctx.fillText('凪', w / 2, 400);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,173,207,.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 470);
    ctx.lineTo(w - 90, 470);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,190,218,.9)';
    ctx.font = `500 33px ${JP}`;
    spacedText(ctx, 'COFFEE & JAZZ', w / 2, 555, 5);
    ctx.fillStyle = 'rgba(255,186,216,.55)';
    ctx.font = `400 26px ${JP}`;
    ctx.fillText('夜凪', w / 2, 660);
    ctx.fillStyle = 'rgba(255,195,220,.75)';
    ctx.font = `400 24px ${JP}`;
    spacedText(ctx, 'OPEN 18:00', w / 2, 760, 4);
  });
}

export function makeCafeNorenTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#202a3b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,236,224,.9)';
    ctx.font = `600 104px ${DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.fillText('夜 凪', w / 2, 155);
    for (let i = 1; i < 3; i++) {
      ctx.fillStyle = 'rgba(8,10,16,.75)';
      ctx.fillRect((w / 3) * i - 3, 0, 6, h);
    }
    ctx.fillStyle = 'rgba(30,9,22,.3)';
    ctx.fillRect(0, 0, w, 18);
  });
}

export function makeAmaneSignTexture() {
  return canvasTexture(384, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#15121b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,171,104,.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#ffb26f';
    ctx.shadowBlur = 34;
    ctx.fillStyle = '#ffe9c8';
    ctx.font = `600 96px ${DISPLAY}`;
    ctx.fillText('純', w / 2, 205);
    ctx.fillText('喫', w / 2, 325);
    ctx.fillText('茶', w / 2, 445);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,183,104,.9)';
    ctx.font = `600 58px ${DISPLAY}`;
    ctx.fillText('雨音', w / 2, 600);
    ctx.fillStyle = 'rgba(245,215,176,.45)';
    ctx.font = `400 24px ${JP}`;
    spacedText(ctx, 'KISSA AMANE', w / 2, 710, 2);
    ctx.font = `400 22px ${JP}`;
    ctx.fillText('珈琲・軽食', w / 2, 770);
    ctx.fillStyle = 'rgba(255,190,120,.2)';
    ctx.fillRect(42, 860, w - 84, 2);
  });
}

export function makeStreetNameTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1f5c58';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(227,250,243,.9)';
    ctx.lineWidth = 9;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#f1f7e8';
    ctx.font = `600 104px ${JP}`;
    ctx.textAlign = 'center';
    ctx.fillText('星見通り', w / 2 - 50, 128);
    ctx.fillStyle = 'rgba(213,246,239,.85)';
    ctx.font = `500 32px ${JP}`;
    ctx.fillText('HOSHIMI STREET', w / 2 - 50, 188);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#b8ebdf';
    ctx.font = `600 56px ${JP}`;
    ctx.fillText('←', w - 54, 137);
  });
}

export function makeParkingSignTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#265d91';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#eaf5ff';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = '#f5f9ff';
    ctx.font = `700 284px ${JP}`;
    ctx.textAlign = 'center';
    ctx.fillText('P', w / 2, 335);
    ctx.font = `500 34px ${JP}`;
    spacedText(ctx, 'PARKING', w / 2, 425, 6);
  });
}

export function makeVendingTopTexture(kind = 0) {
  return canvasTexture(768, 256, (ctx, w, h) => {
    if (kind === 0) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#e8483d');
      g.addColorStop(0.72, '#ff7a4d');
      g.addColorStop(1, '#ffb35a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff4e3';
      ctx.textAlign = 'left';
      ctx.font = `800 92px ${JP}`;
      ctx.fillText('あったか〜い', 38, 118);
      ctx.font = `500 31px ${JP}`;
      spacedText(ctx, 'HOT DRINKS  /  COFFEE  /  SOUP', w / 2, 186, 2);
      star(ctx, w - 80, 70, 31, 'rgba(255,246,219,.9)');
    } else {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#dff3f6');
      g.addColorStop(0.5, '#f6fbf8');
      g.addColorStop(1, '#92ddd6');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0e4e59';
      ctx.textAlign = 'left';
      ctx.font = `800 92px ${JP}`;
      ctx.fillText('つめた〜い', 38, 116);
      ctx.font = `500 30px ${JP}`;
      spacedText(ctx, 'COLD DRINKS  /  WATER  /  TEA', w / 2, 186, 2);
      ctx.fillStyle = 'rgba(10,80,89,.18)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(w - 90, 50 + i * 45, 12, 0, TAU);
        ctx.fill();
      }
    }
  });
}

export function makeVendingLightboxTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(244,253,255,.98)');
    g.addColorStop(1, 'rgba(196,237,239,.92)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#165159';
    ctx.font = `700 88px ${JP}`;
    ctx.textAlign = 'left';
    ctx.fillText('COLD', 45, 112);
    ctx.fillStyle = '#d96035';
    ctx.font = `700 67px ${JP}`;
    ctx.fillText('HOT', 420, 106);
    ctx.fillStyle = '#1d6268';
    ctx.font = `500 32px ${JP}`;
    ctx.fillText('¥130', 700, 108);
    ctx.fillStyle = 'rgba(14,74,82,.3)';
    ctx.fillRect(40, 160, w - 80, 3);
  });
}

export function makeVendingButtonStripTexture() {
  return canvasTexture(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(250,253,250,.94)';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const y = 48 + i * 132;
      ctx.fillStyle = '#2b5e64';
      ctx.beginPath();
      ctx.arc(70, y, 17, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(40,80,84,.7)';
      ctx.fillRect(115, y - 14, 250, 5);
      ctx.fillRect(115, y + 3, 175, 4);
      ctx.fillStyle = '#b84c39';
      ctx.fillRect(405, y - 20, 62, 36);
      ctx.fillStyle = '#f7f0df';
      ctx.font = `500 20px ${JP}`;
      ctx.fillText('¥', 420, y + 7);
      ctx.fillStyle = 'rgba(20,60,65,.15)';
      ctx.fillRect(20, y + 44, w - 40, 2);
    }
  });
}

export function makeDoorMatTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#323b3b';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.08)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.strokeStyle = 'rgba(180,185,176,.32)';
    ctx.lineWidth = 10;
    ctx.strokeRect(35, 35, w - 70, h - 70);
    ctx.fillStyle = 'rgba(223,229,213,.8)';
    ctx.textAlign = 'center';
    ctx.font = `600 64px ${JP}`;
    spacedText(ctx, 'WELCOME', w / 2, 238, 14);
    ctx.font = `500 34px ${JP}`;
    ctx.fillStyle = 'rgba(209,220,207,.52)';
    ctx.fillText('いらっしゃいませ', w / 2, 315);
  });
}

export function makeWindowDecalTexture(kind = 'coffee') {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const palettes = {
      coffee: ['#f7e4c9', '#2b1c14', '#9e5c3a'],
      hot: ['#ffe1ae', '#8a2d19', '#e55528'],
      atm: ['#dcf8ff', '#124955', '#36b8c9'],
      new: ['#ffdcec', '#7b2144', '#ec5f9a'],
    };
    const [bg, ink, accent] = palettes[kind] || palettes.coffee;
    ctx.fillStyle = bg;
    roundRect(ctx, 20, 20, w - 40, h - 40, 24);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(20, h - 110, w - 40, 90);
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    if (kind === 'coffee') {
      ctx.font = `600 60px ${JP}`;
      ctx.fillText('淹れたて', w / 2, 130);
      ctx.font = `800 88px ${JP}`;
      ctx.fillText('COFFEE', w / 2, 235);
      ctx.font = `500 37px ${JP}`;
      ctx.fillText('100円〜', w / 2, 302);
      ctx.fillStyle = bg;
      ctx.font = `600 29px ${JP}`;
      ctx.fillText('HOT & ICED', w / 2, h - 53);
    } else if (kind === 'hot') {
      ctx.font = `600 55px ${JP}`;
      ctx.fillText('できたて', w / 2, 124);
      ctx.font = `800 100px ${JP}`;
      ctx.fillText('HOT', w / 2, 236);
      ctx.font = `700 45px ${JP}`;
      ctx.fillText('からあげ', w / 2, 300);
      ctx.fillStyle = bg;
      ctx.font = `600 27px ${JP}`;
      ctx.fillText('FRIED CHICKEN', w / 2, h - 54);
    } else if (kind === 'atm') {
      ctx.font = `800 115px ${JP}`;
      ctx.fillText('ATM', w / 2, 200);
      ctx.font = `500 37px ${JP}`;
      ctx.fillText('24時間ご利用いただけます', w / 2, 275);
      ctx.fillStyle = bg;
      ctx.font = `600 30px ${JP}`;
      ctx.fillText('BANK  /  MONEY', w / 2, h - 54);
    } else {
      ctx.font = `600 55px ${JP}`;
      ctx.fillText('新発売', w / 2, 120);
      ctx.font = `800 96px ${JP}`;
      ctx.fillText('NEW!', w / 2, 230);
      ctx.font = `500 32px ${JP}`;
      ctx.fillText('季節限定スイーツ', w / 2, 292);
      ctx.fillStyle = bg;
      ctx.font = `600 28px ${JP}`;
      ctx.fillText('SWEETS FAIR', w / 2, h - 54);
    }
  });
}

export function makeAutomaticDoorTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(246,251,245,.9)';
    roundRect(ctx, 4, 10, w - 8, h - 20, 20);
    ctx.fill();
    ctx.fillStyle = '#2b5857';
    ctx.textAlign = 'center';
    ctx.font = `600 42px ${JP}`;
    spacedText(ctx, '自動ドア', w / 2, 74, 8);
    ctx.font = `500 26px ${JP}`;
    ctx.fillStyle = 'rgba(43,88,87,.72)';
    ctx.fillText('AUTOMATIC DOOR', w / 2, 124);
    ctx.strokeStyle = 'rgba(43,88,87,.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 177);
    ctx.lineTo(w - 60, 177);
    ctx.stroke();
    ctx.fillStyle = 'rgba(43,88,87,.8)';
    ctx.font = `600 42px ${JP}`;
    ctx.fillText('↔', w / 2, 222);
  });
}

export function makeStoreDecalTexture(kind = 'payment') {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (kind === 'payment') {
      ctx.fillStyle = 'rgba(250,250,244,.9)';
      ctx.font = `600 27px ${JP}`;
      ctx.textAlign = 'left';
      ctx.fillText('各種キャッシュレス決済', 18, 42);
      const colors = ['#286a69', '#df5b4b', '#ddb14f', '#455b84'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(60 + i * 112, 138, 42, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.82)';
        ctx.font = `600 19px ${JP}`;
        ctx.textAlign = 'center';
        ctx.fillText(['PAY', 'CARD', 'IC', 'QR'][i], 60 + i * 112, 145);
      }
    } else if (kind === 'recycle') {
      ctx.fillStyle = 'rgba(226,244,234,.94)';
      roundRect(ctx, 16, 16, w - 32, h - 32, 24);
      ctx.fill();
      ctx.fillStyle = '#28655b';
      ctx.font = `600 42px ${JP}`;
      ctx.textAlign = 'center';
      ctx.fillText('リサイクル', w / 2, 88);
      ctx.font = `500 28px ${JP}`;
      ctx.fillText('空き缶・ビン・ペットボトル', w / 2, 138);
      ctx.strokeStyle = '#28655b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(w / 2, 192, 27, 0.4, 5.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2 + 25, 173);
      ctx.lineTo(w / 2 + 40, 195);
      ctx.lineTo(w / 2 + 12, 194);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,245,229,.9)';
      roundRect(ctx, 10, 10, w - 20, h - 20, 18);
      ctx.fill();
      ctx.fillStyle = '#2a5552';
      ctx.font = `600 46px ${JP}`;
      ctx.textAlign = 'center';
      ctx.fillText(kind === 'umbrella' ? '傘立て' : 'ゴミ箱', w / 2, 102);
      ctx.font = `500 28px ${JP}`;
      ctx.fillText(kind === 'umbrella' ? 'UMBRELLA STAND' : 'PLEASE SORT', w / 2, 154);
      ctx.strokeStyle = 'rgba(42,85,82,.45)';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 180, w - 48, 44);
    }
  });
}

export function makePosterTexture(kind = 0) {
  return canvasTexture(512, 768, (ctx, w, h) => {
    if (kind === 0) {
      // convenience-store sale poster
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f9e7b9');
      g.addColorStop(1, '#f3bf86');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d9543c';
      ctx.beginPath();
      ctx.arc(w / 2, 250, 145, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,247,222,.8)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(w / 2, 250, 121, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#fff6df';
      ctx.font = `800 57px ${JP}`;
      ctx.textAlign = 'center';
      ctx.fillText('新発売', w / 2, 265);
      ctx.fillStyle = '#3e3933';
      ctx.font = `700 73px ${JP}`;
      ctx.fillText('星屑', w / 2, 470);
      ctx.font = `600 58px ${JP}`;
      ctx.fillText('プリン', w / 2, 540);
      ctx.fillStyle = '#d9543c';
      ctx.font = `600 36px ${JP}`;
      ctx.fillText('なめらか濃厚', w / 2, 610);
      ctx.fillStyle = '#f7eed4';
      ctx.fillRect(0, 665, w, 70);
      ctx.fillStyle = '#5d5548';
      ctx.font = `500 26px ${JP}`;
      ctx.fillText('期間限定 / なくなり次第終了', w / 2, 708);
    } else if (kind === 1) {
      // community notice board paper
      ctx.fillStyle = '#f5f0df';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#46605b';
      ctx.fillRect(0, 0, w, 90);
      ctx.fillStyle = '#f7f1e0';
      ctx.font = `600 45px ${JP}`;
      ctx.textAlign = 'center';
      ctx.fillText('地域のお知らせ', w / 2, 58);
      ctx.fillStyle = '#555c56';
      ctx.font = `500 25px ${JP}`;
      const lines = ['防災訓練のお知らせ', '11月12日（日）午前9時より', '星見町内会館にて実施します。', 'ご近所お誘い合わせのうえ、', 'ぜひご参加ください。', '', '星見町内会'];
      lines.forEach((line, i) => ctx.fillText(line, w / 2, 190 + i * 58));
      ctx.strokeStyle = '#c8b78b';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 120, w - 48, h - 168);
      ctx.fillStyle = '#a44e42';
      ctx.beginPath();
      ctx.arc(w - 75, h - 82, 29, 0, TAU);
      ctx.fill();
    } else if (kind === 2) {
      // missing cat / local flyer
      ctx.fillStyle = '#f7e8df';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#9e4c53';
      ctx.lineWidth = 6;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.fillStyle = '#72373d';
      ctx.textAlign = 'center';
      ctx.font = `600 52px ${JP}`;
      ctx.fillText('さがしています', w / 2, 94);
      ctx.font = `600 37px ${JP}`;
      ctx.fillText('ねこ', w / 2, 150);
      // simple cat face
      ctx.beginPath();
      ctx.arc(w / 2, 280, 95, 0, TAU);
      ctx.fillStyle = '#dac4a8';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w / 2 - 80, 220);
      ctx.lineTo(w / 2 - 45, 166);
      ctx.lineTo(w / 2 - 13, 215);
      ctx.moveTo(w / 2 + 80, 220);
      ctx.lineTo(w / 2 + 45, 166);
      ctx.lineTo(w / 2 + 13, 215);
      ctx.fillStyle = '#dac4a8';
      ctx.fill();
      ctx.fillStyle = '#3c3532';
      ctx.beginPath();
      ctx.arc(w / 2 - 32, 266, 10, 0, TAU);
      ctx.arc(w / 2 + 32, 266, 10, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#9a6b61';
      ctx.beginPath();
      ctx.arc(w / 2, 292, 9, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#5b4c43';
      ctx.font = `500 24px ${JP}`;
      ctx.fillText('茶トラ・赤い首輪', w / 2, 435);
      ctx.fillText('見かけた方はご連絡ください', w / 2, 478);
      ctx.fillStyle = '#72373d';
      ctx.font = `600 28px ${JP}`;
      ctx.fillText('090-XXXX-XXXX', w / 2, 540);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.beginPath();
        ctx.arc(w / 2 + (Math.random() - 0.5) * 30, 604 + Math.random() * 22, 3 + Math.random() * 7, 0, TAU);
        ctx.fill();
      }
    } else {
      // rain-night jazz / coffee poster
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#15212f');
      g.addColorStop(1, '#0a1019');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(143,212,219,.3)';
      ctx.lineWidth = 3;
      ctx.strokeRect(22, 22, w - 44, h - 132);
      ctx.fillStyle = '#edcdb2';
      ctx.textAlign = 'center';
      ctx.font = `500 35px ${JP}`;
      spacedText(ctx, 'RAINY NIGHT SESSION', w / 2, 135, 3);
      ctx.fillStyle = 'rgba(255,219,185,.8)';
      ctx.font = `600 58px ${DISPLAY}`;
      ctx.fillText('雨音と珈琲', w / 2, 240);
      // abstract record
      ctx.strokeStyle = 'rgba(230,170,142,.4)';
      ctx.lineWidth = 2;
      for (let r = 50; r < 210; r += 22) {
        ctx.beginPath();
        ctx.arc(w / 2, 440, r, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = '#d3836b';
      ctx.beginPath();
      ctx.arc(w / 2, 440, 35, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(235,216,194,.6)';
      ctx.font = `500 24px ${JP}`;
      ctx.fillText('夜凪  18:00 - 2:00', w / 2, 650);
      ctx.fillStyle = '#8e4339';
      ctx.fillRect(0, h - 110, w, 110);
      ctx.fillStyle = '#f3d9c4';
      ctx.font = `600 30px ${JP}`;
      ctx.fillText('COFFEE / JAZZ / NIGHT', w / 2, h - 60);
    }
  });
}

export function makeNoticeBoardTexture() {
  return canvasTexture(1024, 768, (ctx, w, h) => {
    ctx.fillStyle = '#3e4842';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#71533c';
    ctx.fillRect(22, 22, w - 44, h - 44);
    // cork speckles
    for (let i = 0; i < 4500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,227,190,.04)' : 'rgba(30,18,10,.07)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // small community notices
    const drawPaper = (x, y, ww, hh, color, title, lineColor) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.06);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, ww, hh);
      ctx.fillStyle = 'rgba(0,0,0,.09)';
      ctx.fillRect(5, 5, ww, hh);
      ctx.fillStyle = lineColor;
      ctx.font = `600 26px ${JP}`;
      ctx.textAlign = 'center';
      ctx.fillText(title, ww / 2, 42);
      ctx.fillStyle = 'rgba(43,49,45,.5)';
      for (let i = 0; i < 5; i++) ctx.fillRect(20, 75 + i * 24, ww - 40, 3);
      ctx.fillStyle = '#d34f3e';
      ctx.beginPath();
      ctx.arc(ww / 2, 12, 7, 0, TAU);
      ctx.fill();
      ctx.restore();
    };
    drawPaper(66, 74, 275, 230, '#f1ead7', '星見町内会', '#4e5d55');
    drawPaper(372, 62, 240, 210, '#e7e2d4', '防災訓練', '#5a594f');
    drawPaper(630, 85, 300, 220, '#f4e7dd', '秋の大掃除', '#7a4c48');
    drawPaper(100, 350, 300, 260, '#e6f0ed', '子猫をさがしています', '#40625d');
    drawPaper(470, 360, 300, 210, '#f5ecd0', 'スーパー特売', '#85633d');
    drawPaper(700, 450, 230, 180, '#eff2ec', 'ゴミ収集', '#526457');
    ctx.fillStyle = 'rgba(245,247,238,.85)';
    ctx.textAlign = 'center';
    ctx.font = `600 34px ${JP}`;
    ctx.fillText('星屑マート  地域掲示板', w / 2, h - 52);
    ctx.strokeStyle = 'rgba(20,30,25,.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  });
}

export function makeServiceDoorTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#465259';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(160,175,176,.38)';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.strokeStyle = 'rgba(20,30,35,.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(62, 62, w - 124, h - 124);
    ctx.fillStyle = 'rgba(220,230,222,.8)';
    ctx.textAlign = 'center';
    ctx.font = `500 34px ${JP}`;
    ctx.fillText('関係者以外', w / 2, 220);
    ctx.fillText('立入禁止', w / 2, 268);
    ctx.fillStyle = '#9e3f31';
    ctx.fillRect(w / 2 - 46, 326, 92, 92);
    ctx.fillStyle = 'rgba(245,240,225,.9)';
    ctx.font = `700 28px ${JP}`;
    ctx.fillText('STAFF', w / 2, 377);
    ctx.fillStyle = 'rgba(240,220,190,.6)';
    ctx.fillRect(w - 128, h / 2 - 7, 68, 13);
  });
}

export function makeRoadMarkTexture(kind = 'p') {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(237,242,233,.87)';
    ctx.strokeStyle = 'rgba(237,242,233,.87)';
    if (kind === 'p') {
      ctx.font = `700 380px ${JP}`;
      ctx.textAlign = 'center';
      ctx.fillText('P', w / 2, 400);
    } else if (kind === 'stop') {
      ctx.font = `700 145px ${JP}`;
      ctx.textAlign = 'center';
      ctx.fillText('止', w / 2, 200);
      ctx.fillText('ま', w / 2, 350);
      ctx.fillText('れ', w / 2, 500);
    } else if (kind === 'arrow') {
      ctx.lineWidth = 46;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 60);
      ctx.lineTo(w / 2, 170);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2, 60);
      ctx.lineTo(w / 2 - 155, 255);
      ctx.lineTo(w / 2 + 155, 255);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'slow') {
      ctx.font = `700 240px ${JP}`;
      ctx.textAlign = 'center';
      ctx.fillText('20', w / 2, 340);
    }
  });
}

export function makeAisleSignTexture(text, sub, color = '#27635e') {
  return canvasTexture(768, 256, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(248,246,233,.96)';
    roundRect(ctx, 0, 0, w, h, 32);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(0, h - 78, w, 78);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = `600 83px ${JP}`;
    ctx.fillText(text, w / 2, 128);
    ctx.fillStyle = 'rgba(250,247,234,.95)';
    ctx.font = `500 28px ${JP}`;
    spacedText(ctx, sub, w / 2, h - 30, 3);
  });
}

export function makeFridgeHeaderTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#eaf8f4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e6d68';
    ctx.font = `600 75px ${JP}`;
    ctx.textAlign = 'left';
    ctx.fillText('つめた〜い', 38, 101);
    ctx.fillStyle = '#3f7d74';
    ctx.font = `500 29px ${JP}`;
    spacedText(ctx, 'COLD DRINKS  /  WATER  /  TEA  /  JUICE', w / 2, 168, 2);
    ctx.fillStyle = '#de8a53';
    ctx.fillRect(38, 200, w - 76, 10);
    star(ctx, w - 80, 75, 33, '#e6a558');
  });
}

export function makeInteriorPosterTexture(kind = 0) {
  return canvasTexture(512, 640, (ctx, w, h) => {
    if (kind === 0) {
      ctx.fillStyle = '#e95e55';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffe9be';
      ctx.textAlign = 'center';
      ctx.font = `700 72px ${JP}`;
      ctx.fillText('からあげ', w / 2, 160);
      ctx.font = `800 104px ${JP}`;
      ctx.fillText('4個', w / 2, 300);
      ctx.font = `600 54px ${JP}`;
      ctx.fillText('¥240', w / 2, 400);
      ctx.strokeStyle = 'rgba(255,236,190,.55)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(w / 2, 500, 58, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,227,171,.8)';
      ctx.font = `500 24px ${JP}`;
      ctx.fillText('HOT SNACK', w / 2, 590);
    } else {
      ctx.fillStyle = '#f3dbc0';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3b5f54';
      ctx.textAlign = 'center';
      ctx.font = `600 48px ${JP}`;
      ctx.fillText('新発売', w / 2, 100);
      ctx.fillStyle = '#ef7f7c';
      ctx.beginPath();
      ctx.arc(w / 2, 290, 135, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff5db';
      ctx.beginPath();
      ctx.arc(w / 2, 290, 105, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#d36b4e';
      ctx.font = `700 65px ${JP}`;
      ctx.fillText('いちご', w / 2, 280);
      ctx.font = `600 55px ${JP}`;
      ctx.fillText('サンド', w / 2, 345);
      ctx.fillStyle = '#4d5b4f';
      ctx.font = `600 38px ${JP}`;
      ctx.fillText('¥360', w / 2, 510);
      ctx.font = `500 23px ${JP}`;
      ctx.fillText('SEASONAL SWEETS', w / 2, 585);
    }
  });
}

export function makePlaqueTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8b7048');
    g.addColorStop(0.28, '#d2b379');
    g.addColorStop(0.5, '#f2ddae');
    g.addColorStop(0.65, '#b89861');
    g.addColorStop(1, '#745935');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(51,37,21,.55)';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = '#2f281d';
    ctx.textAlign = 'center';
    ctx.font = `600 56px ${DISPLAY}`;
    ctx.fillText('夜雨の街角 ・ 星屑マート', w / 2, 105);
    ctx.font = `500 27px ${JP}`;
    spacedText(ctx, 'HOSHIKUZU MART  /  RAINY NIGHT CORNER', w / 2, 158, 3);
    ctx.fillStyle = 'rgba(48,38,24,.55)';
    ctx.fillRect(w / 2 - 245, 185, 490, 2);
    ctx.font = `400 20px ${JP}`;
    ctx.fillText('LIMITED DIORAMA  No. 024', w / 2, 220);
  });
}

export function makeGlowSpriteTexture() {
  return makeGlowTexture();
}
