import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('file:///F:/杂活/小樽丰川邮局.html?skip=1&debugtime=1', { waitUntil:'load' });
await page.waitForFunction(()=>window.__DIORAMA__, null, {timeout:60000});
await page.evaluate(()=>window.__DIORAMA__.setView([18.4,10.0,22.6],[-.3,2.5,-.3]));
for (const t of [0.4,1.2,2.0,2.8,3.7,4.5,5.2,6.4,10.0]) {
  await page.evaluate((t)=>window.__DIORAMA__.setTime(t), t);
  await page.waitForTimeout(180);
  await page.screenshot({path:`post-office-src/shots/tl-${String(t).replace('.','_')}.png`});
}
console.log(await page.evaluate(()=>({done:window.__DIORAMA__.assembly.done, items:window.__DIORAMA__.assembly.items.length})));
await browser.close();
