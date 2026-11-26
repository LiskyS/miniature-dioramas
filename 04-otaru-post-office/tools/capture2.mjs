import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors=[]; page.on('pageerror', e=>errors.push(e.message)); page.on('console', m=>{if(m.type()==='error') errors.push(m.text());});
await page.goto('file:///F:/杂活/小樽丰川邮局.html?skip=1&debugtime=1', { waitUntil:'load' });
await page.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
await page.evaluate(()=>window.__DIORAMA__.setTime(12));
await page.waitForTimeout(500);
await page.screenshot({path:'post-office-src/shots/second-final.png'});
const views=[
 ['front-close',[9.5,5.6,13.6],[-.6,2.1,-.4]],
 ['cat-window',[6.2,3.2,8.6],[1.4,1.85,1.1]],
 ['entry',[1.2,4.0,8.0],[-1.5,2.0,.6]],
];
for(const [name,pos,tgt] of views){await page.evaluate(([p,t])=>window.__DIORAMA__.setView(p,t),[pos,tgt]);await page.waitForTimeout(450);await page.screenshot({path:`post-office-src/shots/second-${name}.png`});}
console.log(errors);
await browser.close();
