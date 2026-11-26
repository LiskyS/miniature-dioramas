import { chromium } from 'playwright-core';
import fs from 'node:fs';
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
await page.waitForTimeout(10500);
const state1=await page.evaluate(()=>{const d=window.__DIORAMA__;return {
  elapsed:+d.elapsed.toFixed(2), done:d.assembly.done, camera:d.camera.position.toArray().map(v=>+v.toFixed(2)),
  dist:+d.camera.position.distanceTo(d.controls.target).toFixed(2), minD:d.controls.minDistance, maxD:+d.controls.maxDistance.toFixed(1),
  catVisible:d.postOffice.cat.root.visible, catScale:+d.postOffice.cat.bodyGroup.scale.y.toFixed(4),
  lights:d.scene.children.filter(o=>o.isPointLight).map(o=>+o.intensity.toFixed(2)),
  snow:+d.snow.material.uniforms.uOpacity.value.toFixed(2),
  canvases:document.querySelectorAll('canvas').length,
  visibleDivs:[...document.querySelectorAll('div')].filter(e=>getComputedStyle(e).display!=='none').length,
  meshes:(()=>{let n=0;d.scene.traverse(o=>{if(o.isMesh)n++});return n})(),
  title:document.title
};});
await page.screenshot({path:'F:/杂活/小樽丰川邮局-预览.png'});
// breathing check
const b1=await page.evaluate(()=>+window.__DIORAMA__.postOffice.cat.bodyGroup.scale.y.toFixed(5));
await page.waitForTimeout(700);
const b2=await page.evaluate(()=>+window.__DIORAMA__.postOffice.cat.bodyGroup.scale.y.toFixed(5));
// interactions
const before=await page.evaluate(()=>window.__DIORAMA__.camera.position.toArray().map(v=>+v.toFixed(3)));
await page.mouse.move(820,510); await page.mouse.down(); await page.mouse.move(930,540,{steps:12}); await page.mouse.up();
await page.waitForTimeout(600);
const afterDrag=await page.evaluate(()=>window.__DIORAMA__.camera.position.toArray().map(v=>+v.toFixed(3)));
await page.mouse.wheel(0,-800); await page.waitForTimeout(800);
const afterZoom=await page.evaluate(()=>{const d=window.__DIORAMA__;return {pos:d.camera.position.toArray().map(v=>+v.toFixed(2)), dist:+d.camera.position.distanceTo(d.controls.target).toFixed(2)};});
await page.evaluate(()=>window.__DIORAMA__.setView([3.3,3.6,4.5],[-.15,2.1,-.1]));
await page.waitForTimeout(500);
await page.screenshot({path:'F:/杂活/小樽丰川邮局-室内细节.png'});
// perf sample
const frames=await page.evaluate(async()=>{const a=[];let last=performance.now(),start=last;await new Promise(r=>{function t(n){a.push(n-last);last=n;if(n-start<5000)requestAnimationFrame(t);else r();}requestAnimationFrame(t);});return a;});
const sorted=[...frames].sort((a,b)=>a-b);const q=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
const perf={frames:frames.length,median:+q(.5).toFixed(1),p90:+q(.9).toFixed(1),p99:+q(.99).toFixed(1),max:+Math.max(...frames).toFixed(1),long50:frames.filter(x=>x>50).length};
console.log(JSON.stringify({ready,state1,breathing:[b1,b2],before,afterDrag,afterZoom,perf,requests,errors,warnings},null,2));
await browser.close();
