import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--disable-gpu-sandbox','--force-device-scale-factor=1','--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const logs=[]; page.on('console', m=>logs.push(`[${m.type()}] ${m.text()}`)); page.on('pageerror', e=>logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto('file:///F:/杂活/小樽丰川邮局.html?debugtime=1', { waitUntil:'load' });
await page.waitForTimeout(8000);
console.log(JSON.stringify({ready:await page.evaluate(()=>!!window.__DIORAMA__), logs}, null, 2));
await page.screenshot({path:'post-office-src/shots/debug-1.png'});
await browser.close();
