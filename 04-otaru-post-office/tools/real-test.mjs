import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors=[], warnings=[], requests=[];
page.on('pageerror', e=>errors.push(e.message));
page.on('console', m=>{if(m.type()==='error')errors.push(m.text()); if(m.type()==='warning')warnings.push(m.text());});
page.on('request', r=>{if(!r.url().startsWith('file://')) requests.push(r.url());});
const t0=Date.now();
await page.goto('file:///F:/杂活/小樽丰川邮局.html', {waitUntil:'load'});
await page.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
const ready=Date.now()-t0;
const frames = await page.evaluate(async () => {
  const out=[]; let last=performance.now(); const start=last;
  await new Promise(resolve=>{function tick(now){out.push(now-last); last=now; if(now-start<10500) requestAnimationFrame(tick); else resolve();} requestAnimationFrame(tick);});
  return out;
});
await page.screenshot({path:'post-office-src/shots/real-final.png'});
const state = await page.evaluate(()=>{const d=window.__DIORAMA__; const cat=d.postOffice.cat; return {
  elapsed:+d.elapsed.toFixed(2), done:d.assembly.done, camera:d.camera.position.toArray().map(v=>+v.toFixed(2)),
  catPos: cat.root.position.toArray().map(v=>+v.toFixed(2)), catScale:+cat.bodyGroup.scale.y.toFixed(4),
  catVisible:cat.root.visible, fireNone:true,
  canvases:document.querySelectorAll('canvas').length,
  visibleDivs:[...document.querySelectorAll('div')].filter(e=>getComputedStyle(e).display!=='none').length,
  lights:d.scene.children.filter(o=>o.isPointLight).length,
  snowOpacity:d.snow.material.uniforms.uOpacity.value,
  pointIntensities:d.scene.children.filter(o=>o.isPointLight).map(o=>+o.intensity.toFixed(2)),
  meshes:(()=>{let n=0;d.scene.traverse(o=>{if(o.isMesh)n++});return n})()
};});
const sorted=[...frames].sort((a,b)=>a-b); const q=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
const stats={frames:frames.length, median:+q(.5).toFixed(1), p90:+q(.9).toFixed(1), p99:+q(.99).toFixed(1), max:+Math.max(...frames).toFixed(1), long50:frames.filter(x=>x>50).length};
console.log(JSON.stringify({ready,state,stats,requests,errors,warnings},null,2));
await browser.close();
