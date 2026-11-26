import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('file:///F:/杂活/小樽丰川邮局.html?skip=1&debugtime=1', { waitUntil:'load' });
await page.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
await page.evaluate(()=>window.__DIORAMA__.setTime(12));
const views=[
 ['cat-macro',[2.15,1.78,1.05],[1.55,1.75,.35]],
 ['cat-front-macro',[1.6,1.85,1.25],[1.55,1.72,.3]],
 ['counter-macro',[3.4,1.95,.9],[1.3,1.7,.2]],
];
for(const [name,pos,tgt] of views){await page.evaluate(([p,t])=>window.__DIORAMA__.setView(p,t),[pos,tgt]);await page.waitForTimeout(400);await page.screenshot({path:`post-office-src/shots/${name}.png`});}
await browser.close();
