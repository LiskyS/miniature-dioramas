import * as THREE from 'three';
import { canvasTexture, rng, TAU } from './utils.js';

const SERIF = "'Georgia','Palatino Linotype','Book Antiqua',serif";
const SANS = "'Trebuchet MS','Gill Sans','Segoe UI',sans-serif";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeToonGradient() {
  const data = new Uint8Array([46, 108, 172, 224, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Snow, ice, sky
// ---------------------------------------------------------------------------
export function makeSnowTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(8017);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#e7eff8');
    grad.addColorStop(0.4, '#f2f7fb');
    grad.addColorStop(1, '#dfeaf4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Soft, wind-sculpted snow drifts.
    for (let i = 0; i < 55; i++) {
      const x = R() * w;
      const y = R() * h;
      const r = 40 + R() * 230;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const cool = R() > 0.45;
      g.addColorStop(0, cool ? 'rgba(174,199,221,.14)' : 'rgba(255,255,255,.23)');
      g.addColorStop(0.55, cool ? 'rgba(187,208,226,.07)' : 'rgba(255,255,255,.08)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.4, r * 0.4, (R() - 0.5) * 0.5, 0, TAU);
      ctx.fill();
    }
    // Wind ripples.
    ctx.lineCap = 'round';
    for (let i = 0; i < 75; i++) {
      const x = R() * w;
      const y = R() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 50, y - 8, x + 120, y + 4, x + 190 + R() * 90, y - 2);
      ctx.strokeStyle = R() > 0.5 ? 'rgba(174,198,220,.12)' : 'rgba(255,255,255,.25)';
      ctx.lineWidth = 1 + R() * 2.5;
      ctx.stroke();
    }
    // Sparkling frost specks.
    for (let i = 0; i < 3600; i++) {
      const x = R() * w;
      const y = R() * h;
      const v = R();
      if (v > 0.94) {
        ctx.fillStyle = `rgba(255,255,255,${0.28 + R() * 0.55})`;
        ctx.fillRect(x, y, 1 + R() * 1.6, 1 + R() * 1.2);
      } else {
        ctx.fillStyle = v > 0.46 ? 'rgba(255,255,255,.18)' : 'rgba(153,180,204,.10)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Faint icy blue shade edges.
    const edge = ctx.createRadialGradient(w / 2, h / 2, w * 0.22, w / 2, h / 2, w * 0.72);
    edge.addColorStop(0, 'rgba(255,255,255,0)');
    edge.addColorStop(1, 'rgba(142,173,202,.13)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeIceTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const R = rng(3371);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#93bcd0');
    grad.addColorStop(0.35, '#b9dbe4');
    grad.addColorStop(0.65, '#8fb8cb');
    grad.addColorStop(1, '#c1dae4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // milky patches
    for (let i = 0; i < 36; i++) {
      const x = R() * w;
      const y = R() * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 30 + R() * 120);
      g.addColorStop(0, `rgba(234,247,250,${0.05 + R() * 0.12})`);
      g.addColorStop(1, 'rgba(220,241,245,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 130, y - 130, 260, 260);
    }
    // cracks
    ctx.lineCap = 'round';
    for (let i = 0; i < 17; i++) {
      let x = R() * w;
      let y = R() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        x += (R() - 0.5) * 100;
        y += (R() - 0.5) * 45;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = R() > 0.5 ? 'rgba(249,253,255,.55)' : 'rgba(44,91,113,.34)';
      ctx.lineWidth = 1.1 + R() * 2.0;
      ctx.stroke();
    }
    // Long structural fissures with pale ice along the edges.
    for (let i = 0; i < 5; i++) {
      const startX = R() * w * 0.35;
      let x = startX;
      let y = R() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 8; j++) {
        x += 24 + R() * 55;
        y += (R() - 0.5) * 34;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(48,94,115,.4)';
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.26)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    // trapped bubbles
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = 'rgba(234,247,250,.23)';
      ctx.beginPath();
      ctx.arc(R() * w, R() * h, 0.4 + R() * 2.2, 0, TAU);
      ctx.fill();
    }
    // snow settling along the top edge
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = 'rgba(245,250,253,.55)';
      ctx.beginPath();
      ctx.arc(R() * w, R() * h * 0.13, 2 + R() * 11, 0, TAU);
      ctx.fill();
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping });
}

export function makeSkyTexture() {
  return canvasTexture(2048, 1024, (ctx, w, h) => {
    const R = rng(5521);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#030812');
    grad.addColorStop(0.24, '#081425');
    grad.addColorStop(0.42, '#0c2336');
    grad.addColorStop(0.52, '#173b4f');
    grad.addColorStop(0.58, '#254f60');
    grad.addColorStop(0.64, '#112a3b');
    grad.addColorStop(0.76, '#06111e');
    grad.addColorStop(1, '#02060b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // aurora-like cold haze
    const glows = [
      [0.12, 0.5, 330, 'rgba(73,150,166,.16)'],
      [0.38, 0.52, 400, 'rgba(114,160,187,.11)'],
      [0.68, 0.49, 300, 'rgba(89,132,173,.10)'],
      [0.92, 0.54, 280, 'rgba(194,157,135,.08)'],
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
    // A storybook cloud bank.
    ctx.save();
    ctx.filter = 'blur(22px)';
    for (let i = 0; i < 80; i++) {
      const x = R() * w;
      const y = h * (0.16 + R() * 0.3);
      const rx = 45 + R() * 260;
      const ry = 8 + R() * 38;
      const v = R();
      ctx.fillStyle = v > 0.35
        ? `rgba(91,116,143,${0.035 + R() * 0.08})`
        : `rgba(12,24,39,${0.08 + R() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, (R() - 0.5) * 0.15, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // Stars, visible through thinner cloud.
    for (let i = 0; i < 150; i++) {
      const x = R() * w;
      const y = R() * h * 0.45;
      const v = R();
      ctx.fillStyle = `rgba(191,219,244,${0.04 + R() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, v > 0.92 ? 1.8 : 0.4 + v, 0, TAU);
      ctx.fill();
      if (v > 0.965) {
        ctx.strokeStyle = 'rgba(208,231,255,.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x, y + 4);
        ctx.stroke();
      }
    }
    // faint moon glow halo, which pairs with the separate moon sprite
    const mx = w * 0.72;
    const my = h * 0.23;
    const moon = ctx.createRadialGradient(mx, my, 4, mx, my, 210);
    moon.addColorStop(0, 'rgba(235,244,255,.24)');
    moon.addColorStop(0.12, 'rgba(199,221,243,.08)');
    moon.addColorStop(0.58, 'rgba(143,181,220,.035)');
    moon.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(mx - 260, my - 260, 520, 520);
  }, { wrapS: THREE.RepeatWrapping });
}

export function makeMoonTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.19, w / 2, h / 2, w * 0.48);
    g.addColorStop(0, 'rgba(247,248,236,1)');
    g.addColorStop(0.65, 'rgba(238,242,228,.95)');
    g.addColorStop(0.85, 'rgba(227,236,225,.3)');
    g.addColorStop(1, 'rgba(220,235,233,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    const R = rng(663);
    for (let i = 0; i < 18; i++) {
      const a = R() * TAU;
      const rad = R() * w * 0.28;
      ctx.fillStyle = `rgba(0,0,0,${0.03 + R() * 0.08})`;
      ctx.beginPath();
      ctx.arc(w / 2 + Math.cos(a) * rad, h / 2 + Math.sin(a) * rad, 4 + R() * 18, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}

// ---------------------------------------------------------------------------
// Cabin materials
// ---------------------------------------------------------------------------
export function makeWoodSidingTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(4489);
    ctx.fillStyle = '#4d2e21';
    ctx.fillRect(0, 0, w, h);
    const rows = 9;
    const rowH = h / rows;
    for (let row = 0; row < rows; row++) {
      const y = row * rowH;
      const base = 92 + Math.floor(R() * 22);
      const grad = ctx.createLinearGradient(0, y, 0, y + rowH);
      grad.addColorStop(0, `rgb(${base + 24},${base - 22},${base - 48})`);
      grad.addColorStop(0.2, `rgb(${base + 4},${base - 38},${base - 60})`);
      grad.addColorStop(0.58, `rgb(${Math.max(42, base - 18)},${Math.max(25, base - 56)},${Math.max(16, base - 72)})`);
      grad.addColorStop(1, `rgb(${Math.max(34, base - 40)},${Math.max(18, base - 70)},${Math.max(10, base - 82)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, y + 4, w, rowH - 9);
      // dark gap and upper highlight
      ctx.fillStyle = 'rgba(23,12,8,.72)';
      ctx.fillRect(0, y, w, 7);
      ctx.fillStyle = 'rgba(207,156,108,.14)';
      ctx.fillRect(0, y + 8, w, 2);
      // grain
      for (let i = 0; i < 34; i++) {
        const yy = y + 13 + R() * (rowH - 28);
        ctx.lineWidth = 0.6 + R() * 1.8;
        ctx.strokeStyle = R() > 0.5 ? 'rgba(255,219,172,.06)' : 'rgba(25,12,8,.16)';
        ctx.beginPath();
        ctx.moveTo(-10, yy);
        ctx.bezierCurveTo(w * 0.22, yy + (R() - 0.5) * 8, w * 0.7, yy + (R() - 0.5) * 7, w + 10, yy);
        ctx.stroke();
      }
      // knots
      for (let i = 0; i < 2; i++) {
        const x = R() * w;
        const yy = y + 18 + R() * (rowH - 36);
        ctx.strokeStyle = 'rgba(38,19,12,.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, yy, 11 + R() * 12, 5 + R() * 4, R(), 0, TAU);
        ctx.stroke();
        ctx.fillStyle = 'rgba(20,10,6,.18)';
        ctx.beginPath();
        ctx.ellipse(x, yy, 4 + R() * 3, 2 + R() * 2, 0, 0, TAU);
        ctx.fill();
      }
    }
    // cold blue rim on the top of some logs
    const vertical = ctx.createLinearGradient(0, 0, 0, h);
    vertical.addColorStop(0, 'rgba(167,195,219,.09)');
    vertical.addColorStop(0.35, 'rgba(0,0,0,0)');
    vertical.addColorStop(1, 'rgba(8,15,22,.27)');
    ctx.fillStyle = vertical;
    ctx.fillRect(0, 0, w, h);
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeVerticalPlankTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(8032);
    ctx.fillStyle = '#68402a';
    ctx.fillRect(0, 0, w, h);
    const n = 9;
    const board = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * board;
      const tone = 100 + Math.floor(R() * 22);
      const grad = ctx.createLinearGradient(x, 0, x + board, 0);
      grad.addColorStop(0, `rgb(${tone - 25},${tone - 42},${Math.max(20, tone - 56)})`);
      grad.addColorStop(0.16, `rgb(${tone + 18},${tone - 30},${Math.max(20, tone - 48)})`);
      grad.addColorStop(0.72, `rgb(${tone},${tone - 48},${Math.max(20, tone - 66)})`);
      grad.addColorStop(1, `rgb(${tone - 30},${Math.max(20, tone - 60)},${Math.max(12, tone - 76)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, 0, board - 6, h);
      ctx.fillStyle = 'rgba(21,11,7,.58)';
      ctx.fillRect(x, 0, 4, h);
      for (let k = 0; k < 14; k++) {
        const xx = x + 8 + R() * (board - 16);
        ctx.strokeStyle = R() > 0.5 ? 'rgba(249,207,160,.05)' : 'rgba(28,14,8,.13)';
        ctx.lineWidth = 0.7 + R() * 1.2;
        ctx.beginPath();
        ctx.moveTo(xx, -10);
        ctx.bezierCurveTo(xx + (R() - 0.5) * 10, h * 0.35, xx + (R() - 0.5) * 8, h * 0.7, xx, h + 10);
        ctx.stroke();
      }
      // nails
      for (const yy of [60, h - 60]) {
        ctx.fillStyle = 'rgba(24,20,16,.7)';
        ctx.beginPath();
        ctx.arc(x + board * 0.5, yy, 5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(173,160,130,.17)';
        ctx.beginPath();
        ctx.arc(x + board * 0.5 - 1, yy - 1, 2, 0, TAU);
        ctx.fill();
      }
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeRoofShingleTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(1138);
    ctx.fillStyle = '#4b342c';
    ctx.fillRect(0, 0, w, h);
    const rows = 16;
    const cols = 13;
    const rh = h / rows;
    for (let row = 0; row < rows; row++) {
      const y = row * rh;
      const off = row % 2 ? w / cols / 2 : 0;
      for (let col = -1; col <= cols; col++) {
        const x = col * (w / cols) + off;
        const tone = 63 + R() * 24;
        ctx.fillStyle = `rgb(${tone + 8},${Math.round(tone - 15)},${Math.round(tone - 24)})`;
        roundRect(ctx, x + 2, y + 4, w / cols - 5, rh - 5, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(14,18,25,.16)';
        ctx.fillRect(x + 2, y + rh - 5, w / cols - 5, 5);
        if (R() > 0.85) {
          ctx.fillStyle = 'rgba(221,233,242,.13)';
          ctx.fillRect(x + 8, y + 3, w / cols * 0.5, 2);
        }
      }
    }
    // old blue-grey weathering
    const cold = ctx.createLinearGradient(0, 0, w, h);
    cold.addColorStop(0, 'rgba(126,157,183,.14)');
    cold.addColorStop(0.5, 'rgba(0,0,0,0)');
    cold.addColorStop(1, 'rgba(15,27,40,.26)');
    ctx.fillStyle = cold;
    ctx.fillRect(0, 0, w, h);
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeStoneTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(4602);
    ctx.fillStyle = '#4e5051';
    ctx.fillRect(0, 0, w, h);
    const rows = 9;
    const rh = h / rows;
    for (let row = 0; row < rows; row++) {
      const y = row * rh;
      let x = -40 + R() * 30;
      while (x < w) {
        const bw = 70 + R() * 130;
        const tone = 100 + R() * 38;
        const blue = 2 + R() * 10;
        const g = ctx.createLinearGradient(x, y, x, y + rh);
        g.addColorStop(0, `rgb(${tone + 12},${tone + 8},${tone + 6})`);
        g.addColorStop(0.6, `rgb(${tone - 10},${tone - 8},${tone - 5 + blue})`);
        g.addColorStop(1, `rgb(${tone - 36},${tone - 34},${tone - 30 + blue})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x + bw / 2, y + rh / 2, bw / 2 - 5, rh / 2 - 4, (R() - 0.5) * 0.09, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(35,36,38,.38)';
        ctx.lineWidth = 3;
        ctx.stroke();
        // stones highlights
        ctx.strokeStyle = 'rgba(225,229,225,.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + bw * 0.42, y + rh * 0.36, bw * 0.24, Math.PI * 1.05, Math.PI * 1.9);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = 'rgba(25,27,28,.08)';
          ctx.fillRect(x + R() * bw, y + R() * rh, 2, 2);
        }
        x += bw;
      }
      ctx.fillStyle = 'rgba(31,33,34,.55)';
      ctx.fillRect(0, y + rh - 3, w, 4);
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeInteriorPlankTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(9923);
    ctx.fillStyle = '#745137';
    ctx.fillRect(0, 0, w, h);
    const planks = 7;
    const ph = h / planks;
    for (let i = 0; i < planks; i++) {
      const y = i * ph;
      const tone = 132 + R() * 28;
      const g = ctx.createLinearGradient(0, y, w, y + ph);
      g.addColorStop(0, `rgb(${tone + 22},${tone - 34},${tone - 68})`);
      g.addColorStop(0.45, `rgb(${tone - 8},${Math.max(20, tone - 58)},${Math.max(12, tone - 82)})`);
      g.addColorStop(1, `rgb(${Math.max(24, tone - 34)},${Math.max(16, tone - 80)},${Math.max(8, tone - 104)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, y + 3, w, ph - 6);
      ctx.fillStyle = 'rgba(38,24,13,.5)';
      ctx.fillRect(0, y, w, 3);
      ctx.fillStyle = 'rgba(245,197,138,.06)';
      ctx.fillRect(0, y + 5, w, 1);
      for (let k = 0; k < 22; k++) {
        const yy = y + 10 + R() * (ph - 20);
        ctx.strokeStyle = R() > 0.5 ? 'rgba(255,216,162,.05)' : 'rgba(35,18,9,.12)';
        ctx.lineWidth = 0.6 + R() * 1.4;
        ctx.beginPath();
        ctx.moveTo(-30, yy);
        ctx.bezierCurveTo(w * 0.3, yy + (R() - 0.5) * 10, w * 0.7, yy + (R() - 0.5) * 8, w + 30, yy);
        ctx.stroke();
      }
    }
    // warm varnish highlight
    const gloss = ctx.createLinearGradient(0, 0, w, h);
    gloss.addColorStop(0, 'rgba(255,210,150,.07)');
    gloss.addColorStop(0.5, 'rgba(0,0,0,0)');
    gloss.addColorStop(1, 'rgba(35,15,8,.14)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, w, h);
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeFloorBoardTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(1744);
    ctx.fillStyle = '#5c3d27';
    ctx.fillRect(0, 0, w, h);
    const n = 9;
    const bw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * bw;
      const tone = 92 + R() * 26;
      const g = ctx.createLinearGradient(x, 0, x + bw, 0);
      g.addColorStop(0, `rgb(${tone + 23},${tone - 30},${Math.max(18, tone - 58)})`);
      g.addColorStop(0.3, `rgb(${tone + 7},${tone - 46},${Math.max(14, tone - 70)})`);
      g.addColorStop(1, `rgb(${Math.max(24, tone - 22)},${Math.max(16, tone - 62)},${Math.max(9, tone - 82)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x + 3, 0, bw - 6, h);
      for (let k = 0; k < 16; k++) {
        const xx = x + 8 + R() * (bw - 16);
        ctx.strokeStyle = R() > 0.5 ? 'rgba(255,209,154,.04)' : 'rgba(24,13,6,.14)';
        ctx.lineWidth = 0.6 + R() * 1.2;
        ctx.beginPath();
        ctx.moveTo(xx, -20);
        ctx.bezierCurveTo(xx + (R() - 0.5) * 8, h * 0.3, xx + (R() - 0.5) * 10, h * 0.7, xx, h + 20);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(20,11,6,.5)';
      ctx.fillRect(x, 0, 3, h);
    }
    const light = ctx.createLinearGradient(0, 0, w, h);
    light.addColorStop(0, 'rgba(255,209,151,.07)');
    light.addColorStop(0.5, 'rgba(0,0,0,0)');
    light.addColorStop(1, 'rgba(0,0,0,.15)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeLogEndTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#a2774f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(62,38,20,.35)';
    for (let r = 14; r < 118; r += 9) {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(66,41,23,.35)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(44,25,13,.8)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 9, 0, TAU);
    ctx.stroke();
  });
}

// ---------------------------------------------------------------------------
// Fabric, rugs, decor
// ---------------------------------------------------------------------------
export function makeRugTexture() {
  return canvasTexture(1024, 768, (ctx, w, h) => {
    const R = rng(773);
    ctx.fillStyle = '#883f35';
    ctx.fillRect(0, 0, w, h);
    // woven stripes and Nordic motifs
    const bands = 9;
    for (let i = 0; i < bands; i++) {
      const y = (i / bands) * h;
      ctx.fillStyle = i % 2 ? 'rgba(224,203,167,.16)' : 'rgba(47,74,64,.22)';
      ctx.fillRect(0, y, w, h / bands * 0.22);
    }
    ctx.strokeStyle = 'rgba(236,214,179,.75)';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.strokeStyle = 'rgba(41,70,63,.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, w - 96, h - 96);
    for (let i = 0; i < 7; i++) {
      const x = 100 + i * 124;
      // diamonds
      ctx.strokeStyle = i % 2 ? 'rgba(236,214,179,.68)' : 'rgba(41,70,63,.6)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.34);
      ctx.lineTo(x + 45, h * 0.5);
      ctx.lineTo(x, h * 0.66);
      ctx.lineTo(x - 45, h * 0.5);
      ctx.closePath();
      ctx.stroke();
    }
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = R() > 0.5 ? 'rgba(255,240,212,.04)' : 'rgba(20,10,8,.05)';
      ctx.fillRect(R() * w, R() * h, 1, 1);
    }
    // fringe along top/bottom
    ctx.strokeStyle = 'rgba(233,214,184,.5)';
    ctx.lineWidth = 2;
    for (let x = 20; x < w; x += 13) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 3, 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 3, h - 18); ctx.stroke();
    }
  });
}

export function makePlaidTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#9d3d34';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(53,79,65,.65)';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(0, (i / 5) * h + 22, w, 35);
      ctx.fillRect((i / 5) * w + 22, 0, 35, h);
    }
    ctx.fillStyle = 'rgba(238,220,186,.45)';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(0, (i / 6) * h + 8, w, 7);
      ctx.fillRect((i / 6) * w + 8, 0, 7, h);
    }
    ctx.fillStyle = 'rgba(40,18,15,.18)';
    for (let i = 0; i < 4000; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1);
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeCurtainTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#a85845');
    g.addColorStop(0.18, '#c7785d');
    g.addColorStop(0.5, '#b86049');
    g.addColorStop(0.82, '#c7785d');
    g.addColorStop(1, '#a85845');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,222,178,.035)' : 'rgba(54,22,15,.06)';
      ctx.fillRect(i * (w / 24), 0, 4, h);
    }
    ctx.fillStyle = 'rgba(238,214,174,.13)';
    for (let i = 0; i < 8; i++) ctx.fillRect(0, (i / 8) * h, w, 2);
    // little embroidered pattern
    ctx.strokeStyle = 'rgba(239,218,180,.16)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = 50 + i * 100;
      ctx.beginPath();
      ctx.arc(x, h * 0.55, 17, 0, TAU);
      ctx.stroke();
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping });
}

// ---------------------------------------------------------------------------
// Glass frost and light helpers
// ---------------------------------------------------------------------------
export function makeFrostTexture() {
  return canvasTexture(1024, 768, (ctx, w, h) => {
    const R = rng(6711);
    ctx.clearRect(0, 0, w, h);
    // frosty edges
    const edge = ctx.createLinearGradient(0, 0, w, 0);
    edge.addColorStop(0, 'rgba(226,241,247,.52)');
    edge.addColorStop(0.12, 'rgba(226,241,247,.07)');
    edge.addColorStop(0.86, 'rgba(226,241,247,.08)');
    edge.addColorStop(1, 'rgba(226,241,247,.48)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);
    const bottom = ctx.createLinearGradient(0, h, 0, h * 0.72);
    bottom.addColorStop(0, 'rgba(238,247,251,.5)');
    bottom.addColorStop(1, 'rgba(238,247,251,0)');
    ctx.fillStyle = bottom;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    // frost ferns
    ctx.strokeStyle = 'rgba(242,250,253,.45)';
    ctx.lineCap = 'round';
    for (let i = 0; i < 15; i++) {
      let x = R() > 0.5 ? R() * 140 : w - R() * 140;
      let y = R() * 80;
      if (R() > 0.55) y = h - R() * 130;
      const dir = x < w / 2 ? 1 : -1;
      ctx.lineWidth = 1;
      for (let j = 0; j < 14; j++) {
        const nx = x + dir * (6 + R() * 13);
        const ny = y + (6 + R() * 18) * (R() > 0.5 ? 1 : -1);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx + dir * 8, ny + (R() - 0.5) * 16);
        ctx.stroke();
        x = nx;
        y = ny;
      }
    }
    // condensation beads
    for (let i = 0; i < 800; i++) {
      const x = R() * w;
      const y = R() * h;
      const r = 0.5 + R() * 2.2;
      ctx.fillStyle = R() > 0.7 ? 'rgba(255,255,255,.35)' : 'rgba(221,240,248,.14)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  });
}

export function makeGlassStreakTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const R = rng(2210);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.filter = 'blur(8px)';
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 180 + R() * 70;
      const g = ctx.createLinearGradient(x, 0, x + 220, h);
      g.addColorStop(0, 'rgba(217,240,255,0)');
      g.addColorStop(0.28, 'rgba(219,241,255,.20)');
      g.addColorStop(0.5, 'rgba(255,255,255,.055)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 70, 0);
      ctx.lineTo(x + 145, 0);
      ctx.lineTo(x + 75, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < 50; i++) {
      const x = R() * w;
      const y = R() * h;
      ctx.fillStyle = 'rgba(239,251,255,.2)';
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + R() * 1.8, 0, TAU);
      ctx.fill();
    }
  });
}

// ---------------------------------------------------------------------------
// General effect textures
// ---------------------------------------------------------------------------
export function makeGlowTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.08, 'rgba(255,255,255,.95)');
    g.addColorStop(0.3, 'rgba(255,255,255,.30)');
    g.addColorStop(0.65, 'rgba(255,255,255,.07)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeRingTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.26, w / 2, h / 2, w * 0.48);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.58, 'rgba(255,255,255,.08)');
    g.addColorStop(0.8, 'rgba(255,255,255,.9)');
    g.addColorStop(0.92, 'rgba(255,255,255,.1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeSmokeTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const R = rng(452);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 25; i++) {
      const x = w * 0.5 + (R() - 0.5) * 80;
      const y = h * 0.55 + (R() - 0.5) * 70;
      const r = 20 + R() * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(235,245,251,${0.02 + R() * 0.07})`);
      g.addColorStop(1, 'rgba(235,245,251,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

export function makeSnowSparkTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 14, h / 2); ctx.lineTo(w / 2 + 14, h / 2);
    ctx.moveTo(w / 2, h / 2 - 14); ctx.lineTo(w / 2, h / 2 + 14);
    ctx.stroke();
  });
}

// ---------------------------------------------------------------------------
// Signage, paintings
// ---------------------------------------------------------------------------
export function makeCabinSignTexture() {
  return canvasTexture(1024, 448, (ctx, w, h) => {
    const R = rng(884);
    ctx.fillStyle = '#5b3a25';
    ctx.fillRect(0, 0, w, h);
    // plank background
    for (let i = 0; i < 4; i++) {
      const y = (i / 4) * h;
      const tone = 105 + R() * 22;
      ctx.fillStyle = `rgb(${tone + 18},${tone - 42},${Math.max(25, tone - 68)})`;
      ctx.fillRect(0, y + 2, w, h / 4 - 4);
      ctx.fillStyle = 'rgba(30,16,8,.4)';
      ctx.fillRect(0, y, w, 3);
      for (let k = 0; k < 20; k++) {
        ctx.strokeStyle = 'rgba(240,197,142,.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(R() * w, y + 8 + R() * (h / 4 - 16));
        ctx.lineTo(R() * w, y + 8 + R() * (h / 4 - 16));
        ctx.stroke();
      }
    }
    // carved border
    ctx.strokeStyle = 'rgba(221,207,178,.42)';
    ctx.lineWidth = 6;
    ctx.strokeRect(27, 27, w - 54, h - 54);
    ctx.strokeStyle = 'rgba(31,17,9,.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(39, 39, w - 78, h - 78);
    // pine mark
    ctx.save();
    ctx.translate(148, 224);
    ctx.fillStyle = 'rgba(224,208,173,.86)';
    for (let i = 0; i < 3; i++) {
      const yy = -64 + i * 44;
      const ww = 36 + i * 22;
      ctx.beginPath();
      ctx.moveTo(0, yy - 55);
      ctx.lineTo(ww, yy + 22);
      ctx.lineTo(-ww, yy + 22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(-8, 70, 16, 38);
    ctx.restore();
    ctx.fillStyle = 'rgba(239,226,201,.9)';
    ctx.textAlign = 'left';
    ctx.font = `600 100px ${SERIF}`;
    ctx.fillText('PINE HOLLOW', 250, 210);
    ctx.fillStyle = 'rgba(196,182,155,.64)';
    ctx.font = `500 31px ${SERIF}`;
    ctx.fillText('EST. 1927  ·  WOODLAND CABIN', 254, 266);
    ctx.fillStyle = 'rgba(171,70,60,.8)';
    ctx.font = `600 27px ${SANS}`;
    ctx.fillText('PRIVATE TRAIL  /  NO TRESPASSING', 254, 337);
    // snow on top edge
    ctx.fillStyle = 'rgba(236,246,251,.75)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 82 + R() * 20, 4, 40 + R() * 18, 7 + R() * 4, 0, 0, TAU);
      ctx.fill();
    }
  });
}

export function makeFirewoodSignTexture() {
  return canvasTexture(512, 288, (ctx, w, h) => {
    ctx.fillStyle = '#6b4730';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(231,216,184,.35)';
    ctx.lineWidth = 5;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.fillStyle = 'rgba(238,224,198,.82)';
    ctx.textAlign = 'center';
    ctx.font = `600 76px ${SERIF}`;
    ctx.fillText('FIREWOOD', w / 2, 138);
    ctx.font = `500 28px ${SANS}`;
    ctx.fillText('PLEASE CLOSE THE GATE', w / 2, 192);
    ctx.fillStyle = 'rgba(235,245,250,.55)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(50 + i * 100, 10, 46, 9, 0, 0, TAU);
      ctx.fill();
    }
  });
}

export function makePaintingTexture(kind = 0) {
  return canvasTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#7b5638';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c7ac7e';
    ctx.fillRect(30, 30, w - 60, h - 60);
    ctx.save();
    ctx.beginPath();
    ctx.rect(48, 48, w - 96, h - 96);
    ctx.clip();
    if (kind === 0) {
      const grad = ctx.createLinearGradient(0, 48, 0, h - 48);
      grad.addColorStop(0, '#456176');
      grad.addColorStop(0.55, '#b3c9d2');
      grad.addColorStop(1, '#eff0df');
      ctx.fillStyle = grad;
      ctx.fillRect(48, 48, w - 96, h - 96);
      // pine silhouettes
      ctx.fillStyle = '#27463f';
      for (let i = 0; i < 9; i++) {
        const x = 80 + i * 72;
        const hh = 100 + (i % 3) * 60;
        for (let j = 0; j < 3; j++) {
          const yy = h - 140 - j * 40;
          ctx.beginPath();
          ctx.moveTo(x, yy - hh * 0.22);
          ctx.lineTo(x + 45 - j * 9, yy + 40);
          ctx.lineTo(x - 45 + j * 9, yy + 40);
          ctx.closePath();
          ctx.fill();
        }
      }
      // little red cabin
      ctx.fillStyle = '#7a4432';
      ctx.fillRect(w - 240, h - 186, 105, 72);
      ctx.fillStyle = '#4e3225';
      ctx.beginPath(); ctx.moveTo(w - 252, h - 180); ctx.lineTo(w - 187, h - 236); ctx.lineTo(w - 122, h - 180); ctx.fill();
      ctx.fillStyle = '#ffc66e';
      ctx.fillRect(w - 210, h - 158, 22, 24);
      // snow
      ctx.fillStyle = 'rgba(248,250,246,.8)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h - 95, 370, 55, 0, 0, TAU);
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
      grad.addColorStop(0, '#d7cbb6');
      grad.addColorStop(1, '#685d4d');
      ctx.fillStyle = grad;
      ctx.fillRect(48, 48, w - 96, h - 96);
      // botanical
      ctx.strokeStyle = 'rgba(60,80,65,.7)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 80);
      ctx.bezierCurveTo(w / 2 - 20, h / 2, w / 2 + 20, h / 3, w / 2 - 40, 110);
      ctx.stroke();
      ctx.fillStyle = 'rgba(72,103,78,.65)';
      for (let i = 0; i < 9; i++) {
        const t = i / 9;
        const x = w / 2 + Math.sin(t * 6) * 70;
        const y = h - 100 - t * (h - 240);
        ctx.beginPath();
        ctx.ellipse(x, y, 26, 50, 0.8 * (i % 2 ? 1 : -1), 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(250,233,202,.8)';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(w / 2 + Math.sin(i * 2.1) * 55, h - 120 - i * 42, 6, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(57,35,23,.55)';
    ctx.lineWidth = 8;
    ctx.strokeRect(36, 36, w - 72, h - 72);
    const glassy = ctx.createLinearGradient(0, 0, w, h);
    glassy.addColorStop(0, 'rgba(255,255,255,.14)');
    glassy.addColorStop(0.45, 'rgba(255,255,255,0)');
    glassy.addColorStop(1, 'rgba(0,0,0,.08)');
    ctx.fillStyle = glassy;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makePlaqueTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8f7046');
    g.addColorStop(0.3, '#d1b77f');
    g.addColorStop(0.5, '#f0ddaf');
    g.addColorStop(0.7, '#b69762');
    g.addColorStop(1, '#745834');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(47,33,18,.5)';
    ctx.lineWidth = 6;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.fillStyle = '#2d251a';
    ctx.textAlign = 'center';
    ctx.font = `600 58px ${SERIF}`;
    ctx.fillText('PINE HOLLOW', w / 2, 112);
    ctx.font = `500 27px ${SERIF}`;
    ctx.fillText('A SNOWY NIGHT  ·  WOODLAND CABIN', w / 2, 162);
    ctx.fillStyle = 'rgba(48,36,22,.45)';
    ctx.fillRect(w / 2 - 230, 186, 460, 2);
    ctx.font = `400 20px ${SANS}`;
    ctx.fillText('HANDCRAFTED DIORAMA  ·  No. 12', w / 2, 222);
  });
}

