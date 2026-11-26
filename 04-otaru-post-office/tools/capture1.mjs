import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors=[]; page.on('pageerror', e=>errors.push(e.message)); page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('file:///F:/杂活/小樽丰川邮局.html?skip=1&debugtime=1', { waitUntil:'load' });
await page.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
await page.evaluate(()=>window.__DIORAMA__.setTime(12));
await page.waitForTimeout(500);
await page.screenshot({path:'post-office-src/shots/first-final.png'});
const views=[
 ['front-close',[9.5,5.8,13.8],[-.6,2.2,-.4]],
 ['cat-window',[6.8,3.4,8.4],[1.4,1.9,1.2]],
 ['street',[15,5.2,15.0],[2,1.2,3.0]],
 ['back',[-12,8,-14],[0,2.5,-1]],
];
for(const [name,pos,tgt] of views){await page.evaluate(([p,t])=>window.__DIORAMA__.setView(p,t),[pos,tgt]);await page.waitForTimeout(450);await page.screenshot({path:`post-office-src/shots/first-${name}.png`});}
console.log(errors);
await browser.close();
