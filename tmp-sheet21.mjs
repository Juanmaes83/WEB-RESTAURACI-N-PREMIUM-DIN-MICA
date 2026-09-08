import {chromium} from 'playwright';
import fs from 'node:fs';
const dir='output/playwright/product-detail/live';
const names=process.argv[2].split(','), w=+process.argv[3], cols=+process.argv[4];
const b=await chromium.launch();
const page=await(await b.newContext({viewport:{width:cols*w+40,height:1200}})).newPage();
const imgs=names.map(n=>[n,fs.readFileSync(`${dir}/${n}.png`).toString('base64')]);
await page.setContent(`<body style="margin:0;background:#111"><div id=m style="display:flex;flex-wrap:wrap;align-items:flex-start">
${imgs.map(([n,d])=>`<div style="position:relative;margin:2px"><img src="data:image/png;base64,${d}" width="${w}">
<span style="position:absolute;left:3px;bottom:2px;font:600 11px system-ui;color:#d8ff4f;background:#000b;padding:1px 5px">${n}</span></div>`).join('')}</div></body>`);
await page.waitForTimeout(1000);
await page.locator('#m').screenshot({path:process.argv[5]});
await b.close();
