import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {startServer} from './static-server.mjs';
const local=process.env.BASE_URL?null:await startServer(0),url=process.env.BASE_URL||local.url;
try {
  for (const engine of (process.env.BROWSERS||'chromium,webkit').split(',')) {
    const browser=await ({chromium,webkit}[engine]).launch();
    try {
      const page=await browser.newPage({viewport:{width:1440,height:1000}});
      await page.route('https://mock-openseo.test/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(route.request().method()==='POST'?{issues:[],pagesScanned:1}:{})}));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.locator('.studio-open').click();
      await page.locator('.studio-nav [data-panel="seo-geo"]').click();
      const box=page.locator('[data-seo-intelligence]');
      assert.match(await box.textContent(),/NOT_CONFIGURED/);
      await box.locator('[data-intelligence-endpoint]').fill('https://mock-openseo.test');
      await box.getByRole('button',{name:'Test OpenSEO connection'}).click();
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.integrations.openseo.status')==='CONNECTED');
      await box.getByRole('button',{name:'Run OpenSEO crawl'}).click();
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.intelligence.snapshots').length===1);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.intelligence.snapshots').length===1);
      console.log(`${engine} Release C Studio PASS`);
    } finally { await browser.close(); }
  }
} finally { local?.server.close(); }
