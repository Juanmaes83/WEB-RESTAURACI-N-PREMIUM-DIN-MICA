import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {startServer} from './static-server.mjs';

const local=process.env.BASE_URL?null:await startServer(0),url=process.env.BASE_URL||local.url;
try {
  for (const engine of (process.env.BROWSERS||'chromium,webkit').split(',')) {
    const browser=await ({chromium,webkit}[engine]).launch();
    try {
      const page=await browser.newPage({viewport:{width:1440,height:1000}});
      let polls=0;
      await page.route(/^https:\/\/mock-openseo\.test(?:\/.*)?$/,route=>{
        const request=route.request(),method=request.method(),requestUrl=request.url();
        let body={};
        if(method==='POST')body={jobId:'j1',status:'pending'};
        else if(requestUrl.includes('/crawl/j1')){
          polls++;
          body=polls===1?{status:'pending'}:{status:'completed',issues:[],pagesScanned:1,providerVersion:'mock-v1'};
        }
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
      });
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.locator('.studio-open').click();
      await page.locator('.studio-nav [data-panel="seo-geo"]').click();
      await page.getByText('Intelligence · Medición post-publicación',{exact:true}).click();

      const box=page.locator('[data-seo-intelligence]');
      await box.waitFor();
      assert.equal(await page.getByText('Intelligence avanzado · Release C',{exact:true}).count(),0);
      assert.match(await box.textContent(),/NOT_CONFIGURED/);
      assert.match(await box.textContent(),/NOT_CONNECTED/);
      assert.match(await box.textContent(),/NOT_MEASURED/);
      assert.equal(await box.locator('[data-crawler-http]').inputValue(),'');
      assert.equal(await box.getByRole('button',{name:'Conectar / comprobar Search Console'}).isDisabled(),true);
      assert.equal(await box.getByRole('button',{name:'Sincronizar Search Console'}).isDisabled(),true);
      assert.equal(await box.getByRole('button',{name:'Refresh manual DataForSEO'}).isDisabled(),true);

      const base=page.locator('[data-seo-path="seo.site.baseUrl"]');
      await base.fill('https://restaurant.example/');
      await base.press('Tab');
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.site.baseUrl')==='https://restaurant.example/');

      let endpoint=box.locator('[data-intelligence-endpoint]');
      await endpoint.fill('https://user:secret@mock-openseo.test');
      await endpoint.press('Tab');
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.integrations.openseo.endpoint')==='');
      endpoint=box.locator('[data-intelligence-endpoint]');
      assert.equal(await endpoint.inputValue(),'');

      await endpoint.fill('https://mock-openseo.test');
      await endpoint.press('Tab');
      await box.getByRole('button',{name:'Test OpenSEO connection'}).click();
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.integrations.openseo.status')==='CONNECTED');

      await box.getByRole('button',{name:'Run OpenSEO crawl'}).click();
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.intelligence.snapshots').length===1);
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.integrations.openseo.status')==='READY');
      assert.equal(polls,2);
      assert.match(await page.locator('[data-intelligence-snapshots]').textContent(),/1 páginas/);
      assert.equal(await page.locator('[data-gsc-date-range]').inputValue(),'28d');

      const snapshotId=await page.evaluate(()=>RestaurantStudioConfig.get('seo.intelligence.snapshots')[0].snapshotId);
      assert.equal(await page.evaluate(()=>RestaurantStudioConfig.flush()),true);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.intelligence.snapshots')?.length===1);
      await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.integrations.openseo.endpoint')==='https://mock-openseo.test');
      assert.equal(await page.evaluate(()=>RestaurantStudioConfig.get('seo.intelligence.snapshots')[0].snapshotId),snapshotId);
      assert.equal(await page.evaluate(()=>RestaurantStudioConfig.get('seo.integrations.openseo.status')),'READY');
      console.log(`${engine} Release C Studio PASS`);
    } finally { await browser.close(); }
  }
} finally { local?.server.close(); }
