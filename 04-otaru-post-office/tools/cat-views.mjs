import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('file:///F:/杂活/小樽丰川邮局.html?skip=1&debugtime=1', { waitUntil:'load' });
await page.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
await page.evaluate(()=>window.__DIORAMA__.setTime(12));
const views=[
 ['cat-close',[2.8,2.1,2.4],[1.5,1.8,.3]],
 ['interior-wide',[3.8,2.5,1.6],[.4,1.7,-2.5]],
 ['cat-side',[2.7,1.85,1.2],[1.5,1.75,.4]],
];
for(const [name,pos,tgt] of views){await page.evaluate(([p,t])=>window.__DIORAMA__.setView(p,t),[pos,tgt]);await page.waitForTimeout(400);await page.screenshot({path:`post-office-src/shots/${name}.png`});}
await browser.close();
