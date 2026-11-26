import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('file:///F:/杂活/小樽丰川邮局.html?skip=1&debugtime=1', {waitUntil:'load'});
await page.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
await page.evaluate(()=>window.__DIORAMA__.setTime(12));
await page.waitForTimeout(400);
await page.screenshot({path:'post-office-src/shots/fifth-final.png'});
await page.evaluate(()=>{const d=window.__DIORAMA__; d.controls.minDistance=0.1; d.setView([2.45,1.82,1.45],[1.55,1.78,.32]);});
await page.waitForTimeout(400);
await page.screenshot({path:'post-office-src/shots/fifth-cat.png'});
await page.close();
for (const [name,w,h] of [['portrait',900,1200],['mobile',430,900]]) {
  const p = await browser.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  await p.goto('file:///F:/杂活/小樽丰川邮局.html?skip=1&debugtime=1', {waitUntil:'load'});
  await p.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
  await p.evaluate(()=>window.__DIORAMA__.setTime(12));
  await p.waitForTimeout(350);
  await p.screenshot({path:`post-office-src/shots/fifth-${name}.png`});
  await p.close();
}
console.log(errors);
await browser.close();
