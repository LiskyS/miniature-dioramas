import * as THREE from 'three';
import { canvasTexture, rng, TAU } from './utils.js';

const JP_SANS = "'Yu Gothic','Hiragino Kaku Gothic ProN','Noto Sans JP','Meiryo','MS Gothic',sans-serif";
const JP_SERIF = "'Yu Mincho','Hiragino Mincho ProN','Noto Serif JP','Georgia',serif";
const LATIN = "'Trebuchet MS','Gill Sans','Segoe UI',sans-serif";

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
  const data = new Uint8Array([72, 132, 185, 226, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Ground materials
// ---------------------------------------------------------------------------
export function makeSnowTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(8613);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#e8eff3');
    g.addColorStop(0.45, '#f1f5f6');
    g.addColorStop(1, '#dde8ed');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Broad, soft wind-packed patches.
    for (let i = 0; i < 55; i++) {
      const x = R() * w;
      const y = R() * h;
      const r = 40 + R() * 230;
      const cool = R() > 0.3;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
      gg.addColorStop(0, cool ? 'rgba(176,199,213,.16)' : 'rgba(255,255,255,.22)');
      gg.addColorStop(0.55, cool ? 'rgba(187,208,221,.06)' : 'rgba(255,255,255,.06)');
      gg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.35, r * 0.35, (R() - 0.5) * 0.35, 0, TAU);
      ctx.fill();
    }
    // Wind ridges.
    for (let i = 0; i < 60; i++) {
      const x = R() * w;
      const y = R() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 50, y - 5, x + 120, y + 4, x + 200 + R() * 120, y - 2);
      ctx.strokeStyle = R() > 0.5 ? 'rgba(255,255,255,.22)' : 'rgba(165,192,210,.13)';
      ctx.lineWidth = 1 + R() * 2;
      ctx.stroke();
    }
    // Fine grainy sparkle, kept gentle for an overcast day.
    for (let i = 0; i < 2800; i++) {
      const x = R() * w;
      const y = R() * h;
      const v = R();
      if (v > 0.96) {
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.fillRect(x, y, 1.1, 1.1);
      } else {
        ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,.11)' : 'rgba(167,190,206,.08)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeRoadTexture() {
  return canvasTexture(2048, 640, (ctx, w, h) => {
    const R = rng(3771);
    // Snow-covered asphalt.
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#bcc7cb');
    g.addColorStop(0.15, '#d6dfe2');
    g.addColorStop(0.5, '#b2bcc0');
    g.addColorStop(0.85, '#d7dfe2');
    g.addColorStop(1, '#bdc8cc');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Scattered asphalt showing through the packed snow.
    for (let i = 0; i < 85; i++) {
      const x = R() * w;
      const y = R() * h;
      const rx = 30 + R() * 170;
      const ry = 8 + R() * 30;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, rx);
      gg.addColorStop(0, `rgba(84,94,99,${0.025 + R() * 0.07})`);
      gg.addColorStop(1, 'rgba(84,94,99,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      ctx.fill();
    }
    // Two soft tire ruts, as if a car has passed recently.
    for (const cy of [h * 0.39, h * 0.62]) {
      for (let i = 0; i < 20; i++) {
        const x = i * (w / 19);
        const y = cy + Math.sin(i * 0.9) * 6;
        const gg = ctx.createRadialGradient(x, y, 0, x, y, 45);
        gg.addColorStop(0, 'rgba(74,84,88,.14)');
        gg.addColorStop(1, 'rgba(74,84,88,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.ellipse(x, y, 120, 30, 0, 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < 80; i++) {
        const x = R() * w;
        const y = cy + (R() - 0.5) * 45;
        ctx.strokeStyle = 'rgba(68,77,81,.17)';
        ctx.lineWidth = 1 + R() * 2.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10 + R() * 24, y + (R() - 0.5) * 4);
        ctx.stroke();
      }
    }
    // Faded center line, broken by the snow.
    ctx.save();
    ctx.globalAlpha = 0.23;
    ctx.strokeStyle = '#c5aa63';
    ctx.lineWidth = 9;
    ctx.setLineDash([80, 56]);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
    ctx.restore();
    // Snow ridges and slush at the edges.
    for (let i = 0; i < 55; i++) {
      const x = R() * w;
      const y = R() > 0.5 ? R() * h * 0.13 : h - R() * h * 0.13;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, 50 + R() * 90);
      gg.addColorStop(0, 'rgba(255,255,255,.4)');
      gg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.ellipse(x, y, 90 + R() * 80, 10 + R() * 20, 0, 0, TAU);
      ctx.fill();
    }
    // Fine texture noise.
    for (let i = 0; i < 3600; i++) {
      ctx.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(75,87,92,.08)';
      ctx.fillRect(R() * w, R() * h, 1, 1);
    }
  });
}

export function makeSidewalkTexture() {
  return canvasTexture(2048, 512, (ctx, w, h) => {
    const R = rng(6602);
    ctx.fillStyle = '#c2c9c6';
    ctx.fillRect(0, 0, w, h);
    const rows = 6;
    const cols = 28;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * (w / cols) + (r % 2 ? 28 : 0);
        const y = r * (h / rows);
        const tone = 190 + R() * 25;
        ctx.fillStyle = `rgb(${tone - 5},${tone},${tone - 6})`;
        ctx.fillRect(x + 3, y + 3, w / cols - 7, h / rows - 7);
        ctx.strokeStyle = 'rgba(105,116,112,.22)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, w / cols - 4, h / rows - 4);
      }
    }
    // Snow packed into the pavers.
    for (let i = 0; i < 110; i++) {
      const x = R() * w;
      const y = R() * h;
      const rr = 15 + R() * 80;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, rr);
      gg.addColorStop(0, 'rgba(247,250,251,.55)');
      gg.addColorStop(1, 'rgba(247,250,251,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.ellipse(x, y, rr, rr * (0.2 + R() * 0.3), 0, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = 'rgba(82,96,96,.1)';
      ctx.fillRect(R() * w, R() * h, 2 + R() * 5, 1);
    }
  });
}

// ---------------------------------------------------------------------------
// Architecture
// ---------------------------------------------------------------------------
export function makeStuccoTexture(base = '#ebd8a7') {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(4412);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // Soft plaster mottling.
    for (let i = 0; i < 120; i++) {
      const x = R() * w;
      const y = R() * h;
      const r = 20 + R() * 120;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
      const light = R() > 0.5;
      gg.addColorStop(0, light ? 'rgba(255,251,230,.05)' : 'rgba(127,115,88,.035)');
      gg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Very faint trowel drag and grain.
    for (let i = 0; i < 600; i++) {
      const x = R() * w;
      const y = R() * h;
      ctx.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.055)' : 'rgba(103,92,72,.045)';
      ctx.fillRect(x, y, 1 + R() * 2, 1);
    }
    for (let i = 0; i < 35; i++) {
      const x = R() * w;
      const y = R() * h;
      ctx.strokeStyle = 'rgba(255,255,255,.035)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 20 + R() * 70, R() * TAU, R() * TAU + 0.8);
      ctx.stroke();
    }
    // Quiet panel joints.
    ctx.strokeStyle = 'rgba(116,104,81,.09)';
    ctx.lineWidth = 2;
    for (const y of [0.27, 0.54, 0.81]) {
      ctx.beginPath();
      ctx.moveTo(0, y * h);
      ctx.lineTo(w, y * h);
      ctx.stroke();
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeRoofTileTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(5508);
    ctx.fillStyle = '#3d484b';
    ctx.fillRect(0, 0, w, h);
    const rows = 12;
    const cols = 13;
    const rh = h / rows;
    for (let row = 0; row < rows; row++) {
      const y = row * rh;
      for (let col = -1; col <= cols; col++) {
        const x = col * (w / cols);
        const tone = 58 + R() * 20;
        const g = ctx.createLinearGradient(x, y, x + w / cols, y + rh);
        g.addColorStop(0, `rgb(${tone - 8},${tone},${tone + 2})`);
        g.addColorStop(0.5, `rgb(${tone + 4},${tone + 7},${tone + 8})`);
        g.addColorStop(1, `rgb(${tone - 12},${tone - 9},${tone - 5})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x + w / cols / 2, y + rh * 0.58, w / cols * 0.55, rh * 0.58, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,26,28,.44)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + rh);
        ctx.lineTo(x, y + rh * 0.2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(187,199,198,.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + w / cols / 2, y + rh * 0.65, w / cols * 0.3, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    }
    // Overcast blue-grey weathering.
    const cold = ctx.createLinearGradient(0, 0, w, h);
    cold.addColorStop(0, 'rgba(157,177,189,.1)');
    cold.addColorStop(0.5, 'rgba(0,0,0,0)');
    cold.addColorStop(1, 'rgba(18,28,32,.2)');
    ctx.fillStyle = cold;
    ctx.fillRect(0, 0, w, h);
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeSidingTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(8731);
    ctx.fillStyle = '#d8d7cf';
    ctx.fillRect(0, 0, w, h);
    const rows = 13;
    for (let i = 0; i < rows; i++) {
      const y = i * (h / rows);
      const tone = 209 + R() * 21;
      ctx.fillStyle = `rgb(${tone},${tone - 4},${tone - 12})`;
      ctx.fillRect(0, y + 2, w, h / rows - 4);
      ctx.strokeStyle = 'rgba(89,89,82,.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      for (let k = 0; k < 6; k++) {
        ctx.strokeStyle = 'rgba(123,111,95,.045)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + 10 + R() * 30);
        ctx.bezierCurveTo(w * 0.3, y + 6 + R() * 30, w * 0.7, y + 13 + R() * 20, w, y + 8 + R() * 30);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(70,70,63,.04)';
      ctx.fillRect(R() * w, R() * h, 1, 1);
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

export function makeInteriorFloorTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const R = rng(2257);
    ctx.fillStyle = '#a7b3ae';
    ctx.fillRect(0, 0, w, h);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const y = i * (h / n);
      const tone = 159 + R() * 16;
      ctx.fillStyle = `rgb(${tone - 8},${tone},${tone - 3})`;
      ctx.fillRect(0, y + 3, w, h / n - 6);
      ctx.strokeStyle = 'rgba(101,116,111,.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, y + 2, w, h / n - 4);
      for (let k = 0; k < 24; k++) {
        ctx.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(91,106,101,.06)';
        ctx.fillRect(R() * w, y + 8 + R() * (h / n - 16), 5 + R() * 25, 1);
      }
    }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
}

// ---------------------------------------------------------------------------
// Glass overlays
// ---------------------------------------------------------------------------
export function makeFrostTexture() {
  return canvasTexture(1024, 768, (ctx, w, h) => {
    const R = rng(9932);
    ctx.clearRect(0, 0, w, h);
    const edge = ctx.createLinearGradient(0, 0, w, 0);
    edge.addColorStop(0, 'rgba(239,247,250,.56)');
    edge.addColorStop(0.11, 'rgba(239,247,250,.08)');
    edge.addColorStop(0.89, 'rgba(239,247,250,.08)');
    edge.addColorStop(1, 'rgba(239,247,250,.5)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);
    const bottom = ctx.createLinearGradient(0, h, 0, h * 0.74);
    bottom.addColorStop(0, 'rgba(245,250,252,.48)');
    bottom.addColorStop(1, 'rgba(245,250,252,0)');
    ctx.fillStyle = bottom;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    // Delicate frost ferns in the corners.
    ctx.strokeStyle = 'rgba(246,252,254,.38)';
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      let x = R() > 0.5 ? R() * 130 : w - R() * 130;
      let y = R() < 0.45 ? R() * 70 : h - R() * 120;
      const dir = x < w / 2 ? 1 : -1;
      ctx.lineWidth = 0.8;
      for (let j = 0; j < 12; j++) {
        const nx = x + dir * (5 + R() * 12);
        const ny = y + (5 + R() * 15) * (R() > 0.5 ? 1 : -1);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + dir * 7, ny + (R() - 0.5) * 12); ctx.stroke();
        x = nx; y = ny;
      }
    }
    // Condensation.
    for (let i = 0; i < 620; i++) {
      const x = R() * w;
      const y = R() * h;
      ctx.fillStyle = R() > 0.72 ? 'rgba(255,255,255,.3)' : 'rgba(227,242,247,.13)';
      ctx.beginPath();
      ctx.arc(x, y, 0.5 + R() * 2.1, 0, TAU);
      ctx.fill();
    }
  });
}

export function makeGlassStreakTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const R = rng(7710);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.filter = 'blur(8px)';
    for (let i = 0; i < 5; i++) {
      const x = 50 + i * 210 + R() * 80;
      const g = ctx.createLinearGradient(x, 0, x + 200, h);
      g.addColorStop(0, 'rgba(233,246,252,0)');
      g.addColorStop(0.3, 'rgba(233,246,252,.18)');
      g.addColorStop(0.55, 'rgba(255,255,255,.06)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 80, 0);
      ctx.lineTo(x + 150, 0);
      ctx.lineTo(x + 70, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(245,252,255,.18)';
      ctx.beginPath();
      ctx.arc(R() * w, R() * h, 0.7 + R() * 1.7, 0, TAU);
      ctx.fill();
    }
  });
}

// ---------------------------------------------------------------------------
// Signage and printed material
// ---------------------------------------------------------------------------
export function makeMainSignTexture() {
  return canvasTexture(2048, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f7f5eb';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#aab8b6';
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#c53a2f';
    ctx.fillRect(0, h - 10, w, 10);
    // Postal mark 〒.
    ctx.save();
    ctx.translate(118, 54);
    ctx.strokeStyle = '#c53a2f';
    ctx.lineWidth = 13;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(104, 0);
    ctx.moveTo(52, 0); ctx.lineTo(52, 36);
    ctx.moveTo(8, 34); ctx.lineTo(96, 34);
    ctx.moveTo(8, 34); ctx.lineTo(8, 130);
    ctx.moveTo(96, 34); ctx.lineTo(96, 130);
    ctx.stroke();
    ctx.restore();
    // Main Japanese title.
    ctx.fillStyle = '#334b47';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `700 116px ${JP_SANS}`;
    ctx.fillText('小樽豊川郵便局', 270, 105);
    ctx.fillStyle = '#677b76';
    ctx.font = `500 31px ${LATIN}`;
    ctx.fillText('OTARU TOYOKAWA POST OFFICE', 276, 184);
    ctx.fillStyle = '#9a8d74';
    ctx.font = `500 23px ${JP_SANS}`;
    ctx.textAlign = 'right';
    ctx.fillText('郵便・貯金・保険・ゆうパック', w - 36, 192);
    // A tiny snow ledge highlight.
    const top = ctx.createLinearGradient(0, 0, 0, 18);
    top.addColorStop(0, 'rgba(255,255,255,.9)');
    top.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, 18);
  });
}

export function makeEntranceHoursTexture() {
  return canvasTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f4f0e4';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#9da9a4';
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#c53a2f';
    ctx.textAlign = 'center';
    ctx.font = `700 91px ${JP_SANS}`;
    ctx.fillText('小樽豊川', w / 2, 118);
    ctx.fillText('郵便局', w / 2, 212);
    ctx.fillStyle = '#4a5e58';
    ctx.font = `500 30px ${JP_SANS}`;
    ctx.fillText('郵便・貯金・保険', w / 2, 270);
    ctx.strokeStyle = '#b9c2bc';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(90, 300); ctx.lineTo(w - 90, 300); ctx.stroke();
    ctx.fillStyle = '#5d6c66';
    ctx.font = `600 39px ${JP_SANS}`;
    ctx.fillText('平日  9:00 — 17:00', w / 2, 360);
    ctx.font = `400 27px ${JP_SANS}`;
    ctx.fillText('土日祝  9:00 — 12:30', w / 2, 408);
    ctx.fillStyle = '#8a7762';
    ctx.font = `400 22px ${LATIN}`;
    ctx.fillText('POST OFFICE / OTARU', w / 2, 460);
    ctx.fillStyle = 'rgba(247,246,238,.85)';
    ctx.beginPath(); ctx.ellipse(w / 2, 18, 170, 12, 0, 0, TAU); ctx.fill();
  });
}

export function makePostboxPlateTexture() {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#f4f0e2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#7f8a83';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#394a44';
    ctx.font = `600 30px ${JP_SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('郵便ポスト', w / 2, 54);
    ctx.font = `500 22px ${JP_SANS}`;
    ctx.fillStyle = '#6c7971';
    ctx.fillText('取集時刻', w / 2, 96);
    ctx.fillStyle = '#3e4c46';
    ctx.font = `600 34px ${JP_SANS}`;
    ctx.fillText('平日  12:30', w / 2, 150);
    ctx.fillText('土日  10:00', w / 2, 198);
    ctx.fillStyle = '#bd3a30';
    ctx.font = `700 24px ${LATIN}`;
    ctx.fillText('JAPAN POST', w / 2, 246);
    ctx.fillStyle = '#9aa39e';
    ctx.font = `400 18px ${JP_SANS}`;
    ctx.fillText('小樽豊川郵便局', w / 2, 284);
  });
}

export function makePostboxSymbolTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(248,245,234,.95)';
    ctx.lineWidth = 34;
    ctx.lineCap = 'square';
    const x = 148;
    const y = 132;
    const s = 205;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + s, y);
    ctx.moveTo(x + s / 2, y); ctx.lineTo(x + s / 2, y + 60);
    ctx.moveTo(x + 16, y + 58); ctx.lineTo(x + s - 16, y + 58);
    ctx.moveTo(x + 16, y + 58); ctx.lineTo(x + 16, y + 235);
    ctx.moveTo(x + s - 16, y + 58); ctx.lineTo(x + s - 16, y + 235);
    ctx.stroke();
  });
}

export function makeClockTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f5f2e7';
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.465, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#41524d';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.strokeStyle = '#606f68';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.4, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#384842';
    ctx.font = `600 35px ${LATIN}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      ctx.fillText(String(i), w / 2 + Math.cos(a) * w * 0.31, h / 2 + Math.sin(a) * w * 0.31);
    }
    ctx.strokeStyle = '#33443e';
    ctx.lineCap = 'round';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2 + Math.cos(-Math.PI * 0.4) * w * 0.22, h / 2 + Math.sin(-Math.PI * 0.4) * w * 0.22);
    ctx.stroke();
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2 + Math.cos(Math.PI * 0.15) * w * 0.29, h / 2 + Math.sin(Math.PI * 0.15) * w * 0.29);
    ctx.stroke();
    ctx.fillStyle = '#c23d31';
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 12, 0, TAU); ctx.fill();
  });
}

export function makePosterTexture(kind = 0) {
  return canvasTexture(840, 1180, (ctx, w, h) => {
    const R = rng(900 + kind * 97);
    if (kind === 0) {
      // New Year postcard poster.
      ctx.fillStyle = '#f7f2e6';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      g.addColorStop(0, '#bfd2d8');
      g.addColorStop(1, '#eef0e9');
      ctx.fillStyle = g;
      ctx.fillRect(30, 30, w - 60, h * 0.5);
      // snowy hill and red sun
      ctx.fillStyle = 'rgba(224,95,65,.72)';
      ctx.beginPath(); ctx.arc(w * 0.72, h * 0.2, 100, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f8f8f0';
      ctx.beginPath();
      ctx.ellipse(w * 0.4, h * 0.5, w * 0.56, 150, -0.06, 0, TAU);
      ctx.fill();
      // pine silhouettes
      for (let i = 0; i < 7; i++) {
        const x = 120 + i * 98;
        const y = h * 0.42;
        ctx.fillStyle = i % 2 ? '#4e6c64' : '#3f5d55';
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.moveTo(x, y - 150 + j * 45);
          ctx.lineTo(x + 45 - j * 8, y - 10 + j * 30);
          ctx.lineTo(x - 45 + j * 8, y - 10 + j * 30);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.fillStyle = '#3f564f';
      ctx.font = `700 124px ${JP_SERIF}`;
      ctx.textAlign = 'center';
      ctx.fillText('年賀状', w / 2, h * 0.68);
      ctx.fillStyle = '#c23d31';
      ctx.font = `600 44px ${JP_SANS}`;
      ctx.fillText('新年のご挨拶を、郵便局から。', w / 2, h * 0.75);
      ctx.fillStyle = '#6f7c74';
      ctx.font = `400 26px ${JP_SANS}`;
      ctx.fillText('小樽豊川郵便局', w / 2, h * 0.82);
      ctx.strokeStyle = '#c9c1ae';
      ctx.lineWidth = 8;
      ctx.strokeRect(22, 22, w - 44, h - 44);
    } else if (kind === 1) {
      // Postal information notice.
      ctx.fillStyle = '#f4f3e9';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c63c31';
      ctx.fillRect(0, 0, w, 150);
      ctx.fillStyle = '#f8f6ec';
      ctx.textAlign = 'center';
      ctx.font = `700 68px ${JP_SANS}`;
      ctx.fillText('郵便局からの', w / 2, 75);
      ctx.fillText('お知らせ', w / 2, 140);
      ctx.fillStyle = '#40554f';
      ctx.font = `600 52px ${JP_SANS}`;
      const lines = ['ゆうパック', '年末年始の', '受付について', 'ご利用ください'];
      lines.forEach((t, i) => ctx.fillText(t, w / 2, 300 + i * 95));
      ctx.fillStyle = '#b7c1ba';
      ctx.beginPath(); ctx.arc(w / 2, h - 180, 78, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#c23d31';
      ctx.font = `700 54px ${LATIN}`;
      ctx.fillText('POST', w / 2, h - 160);
      ctx.strokeStyle = '#c8c3b5';
      ctx.lineWidth = 7;
      ctx.strokeRect(24, 24, w - 48, h - 48);
    } else {
      // Small framed snowy station print / calendar.
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#c2d3d9');
      g.addColorStop(0.55, '#e8eae5');
      g.addColorStop(1, '#f7f4e9');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(247,248,241,.85)';
      ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.7, w * 0.65, h * 0.24, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7d918b';
      for (let i = 0; i < 6; i++) {
        const x = 80 + i * 125;
        const y = h * 0.52;
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.moveTo(x, y - 200 + j * 58);
          ctx.lineTo(x + 62 - j * 9, y - 40 + j * 42);
          ctx.lineTo(x - 62 + j * 9, y - 40 + j * 42);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.fillStyle = '#455b53';
      ctx.font = `600 36px ${JP_SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('小樽 豊川', w / 2, h * 0.84);
      ctx.font = `400 22px ${JP_SANS}`;
      ctx.fillStyle = '#7a847b';
      ctx.fillText('冬の郵便局', w / 2, h * 0.89);
    }
  });
}

export function makePlaqueTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8f7751');
    g.addColorStop(0.3, '#d5bd8c');
    g.addColorStop(0.52, '#efdfb4');
    g.addColorStop(0.72, '#b79a69');
    g.addColorStop(1, '#765e3f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(57,43,26,.45)';
    ctx.lineWidth = 5;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = '#2e2a22';
    ctx.textAlign = 'center';
    ctx.font = `600 55px ${JP_SANS}`;
    ctx.fillText('小樽豊川郵便局', w / 2, 106);
    ctx.font = `500 25px ${LATIN}`;
    ctx.fillText('OTARU TOYOKAWA POST OFFICE', w / 2, 147);
    ctx.fillStyle = 'rgba(53,41,27,.44)';
    ctx.fillRect(w / 2 - 240, 171, 480, 2);
    ctx.font = `400 20px ${LATIN}`;
    ctx.fillText('WINTER TOWN DIORAMA  ·  No. 04', w / 2, 211);
  });
}

export function makeCarPlateTexture() {
  return canvasTexture(384, 192, (ctx, w, h) => {
    ctx.fillStyle = '#f4f4e9';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#7e8a82';
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#3c705b';
    ctx.textAlign = 'center';
    ctx.font = `600 42px ${JP_SANS}`;
    ctx.fillText('小樽', w / 2, 61);
    ctx.font = `600 73px ${LATIN}`;
    ctx.fillText('580', w / 2, 135);
    ctx.font = `500 30px ${LATIN}`;
    ctx.fillText('と 42-19', w / 2, 175);
  });
}

export function makeStreetNameTexture() {
  return canvasTexture(800, 240, (ctx, w, h) => {
    ctx.fillStyle = '#2f6b78';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(238,245,241,.8)';
    ctx.lineWidth = 7;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#f2f4ed';
    ctx.textAlign = 'center';
    ctx.font = `600 62px ${JP_SANS}`;
    ctx.fillText('豊川町', w / 2, 108);
    ctx.font = `500 28px ${LATIN}`;
    ctx.fillText('TOYOKAWA  ·  OTARU', w / 2, 169);
  });
}

// ---------------------------------------------------------------------------
// Sky and effects
// ---------------------------------------------------------------------------
export function makeSkyTexture() {
  return canvasTexture(2048, 1024, (ctx, w, h) => {
    const R = rng(6221);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#879ba7');
    g.addColorStop(0.2, '#aebfc8');
    g.addColorStop(0.4, '#c9d6db');
    g.addColorStop(0.5, '#e5e9e6');
    g.addColorStop(0.56, '#eef0e9');
    g.addColorStop(0.65, '#d9e1e2');
    g.addColorStop(0.78, '#a9b7bc');
    g.addColorStop(1, '#6e7d84');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Soft cloud strata.
    ctx.save();
    ctx.filter = 'blur(25px)';
    for (let i = 0; i < 90; i++) {
      const x = R() * w;
      const y = h * (0.1 + R() * 0.34);
      const rx = 80 + R() * 300;
      const ry = 8 + R() * 40;
      const v = R();
      ctx.fillStyle = v > 0.45
        ? `rgba(238,242,240,${0.025 + R() * 0.07})`
        : `rgba(136,154,163,${0.03 + R() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, (R() - 0.5) * 0.04, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // A very pale break in the clouds, no sun disc.
    const glow = ctx.createRadialGradient(w * 0.68, h * 0.22, 10, w * 0.68, h * 0.22, 360);
    glow.addColorStop(0, 'rgba(255,250,232,.12)');
    glow.addColorStop(0.5, 'rgba(255,250,234,.04)');
    glow.addColorStop(1, 'rgba(255,250,234,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(w * 0.35, 40, w * 0.64, 500);
    // Fine atmospheric grain.
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.025)' : 'rgba(92,106,112,.025)';
      ctx.fillRect(R() * w, R() * h, 1, 1);
    }
  }, { wrapS: THREE.RepeatWrapping });
}

export function makeGlowTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.1, 'rgba(255,255,255,.92)');
    g.addColorStop(0.34, 'rgba(255,255,255,.25)');
    g.addColorStop(0.7, 'rgba(255,255,255,.055)');
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
    g.addColorStop(0.8, 'rgba(255,255,255,.85)');
    g.addColorStop(0.92, 'rgba(255,255,255,.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeSnowSparkTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.22, 'rgba(255,255,255,.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
