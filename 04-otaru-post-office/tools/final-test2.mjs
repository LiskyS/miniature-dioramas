import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const errors=[], requests=[];
let page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', e=>errors.push(e.message)); page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
page.on('request', r=>{if(!r.url().startsWith('file://')) requests.push(r.url());});
const t0=Date.now();
await page.goto('file:///F:/杂活/小樽丰川邮局.html', {waitUntil:'load'});
await page.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
const ready=Date.now()-t0;
await page.waitForTimeout(11000);
const frames=await page.evaluate(async()=>{const a=[];let last=performance.now(),start=last;await new Promise(r=>{function t(n){a.push(n-last);last=n;if(n-start<4000)requestAnimationFrame(t);else r();}requestAnimationFrame(t);});return a;});
const sorted=[...frames].sort((a,b)=>a-b);const q=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
const perf={frames:frames.length,median:+q(.5).toFixed(1),p90:+q(.9).toFixed(1),p99:+q(.99).toFixed(1),max:+Math.max(...frames).toFixed(1),long50:frames.filter(x=>x>50).length};
const state=await page.evaluate(()=>{const d=window.__DIORAMA__;return {
  title:document.title, done:d.assembly.done, elapsed:+d.elapsed.toFixed(2), catVisible:d.postOffice.cat.root.visible,
  catScale:+d.postOffice.cat.bodyGroup.scale.y.toFixed(4), snow:+d.snow.material.uniforms.uOpacity.value.toFixed(2),
  canvases:document.querySelectorAll('canvas').length,
  visibleDivs:[...document.querySelectorAll('div')].filter(e=>getComputedStyle(e).display!=='none').length,
  lights:d.scene.children.filter(o=>o.isPointLight).map(o=>+o.intensity.toFixed(2)),
  meshes:(()=>{let n=0;d.scene.traverse(o=>{if(o.isMesh)n++});return n})(),
  tris:d.triangles, minD:d.controls.minDistance, pan:d.controls.enablePan
};});
await page.screenshot({path:'F:/杂活/小樽丰川邮局-预览.png'});
await page.evaluate(()=>{const d=window.__DIORAMA__; d.controls.minDistance=0.1; d.setView([2.45,1.82,1.45],[1.55,1.78,.32]);});
await page.waitForTimeout(500);
await page.screenshot({path:'F:/杂活/小樽丰川邮局-猫咪细节.png'});
await page.evaluate(()=>{const d=window.__DIORAMA__; d.controls.minDistance=5; d.setView([2.0,3.4,4.6],[-.15,2.0,-.1]);});
await page.waitForTimeout(400);
await page.screenshot({path:'F:/杂活/小樽丰川邮局-室内细节.png'});
await page.close();
// portrait smoke
const p = await browser.newPage({ viewport:{width:900,height:1200} });
await p.goto('file:///F:/杂活/小樽丰川邮局.html?skip=1&debugtime=1', {waitUntil:'load'});
await p.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
await p.evaluate(()=>window.__DIORAMA__.setTime(12));
await p.waitForTimeout(350);
await p.screenshot({path:'post-office-src/shots/final-portrait.png'});
await p.close();
console.log(JSON.stringify({ready,state,perf,requests,errors},null,2));
await browser.close();
