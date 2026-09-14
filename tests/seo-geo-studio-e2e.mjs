import {chromium,webkit,devices} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startServer} from './static-server.mjs';
const local=process.env.BASE_URL?null:await startServer(0),url=process.env.BASE_URL||local.url;
const out='output/playwright/seo-geo';fs.mkdirSync(out,{recursive:true});
try{
 for(const engine of (process.env.BROWSERS||'chromium,webkit').split(',')){
  const browser=await ({chromium,webkit}[engine]).launch();
  try{
   const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||String(e)));
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.RestaurantStudioConfig?.get('seo.pages.home.seo.title.updatedAt'));
   assert.equal(await page.locator('.seo-panel').count(),0,'panel is built only on demand');
   await page.locator('.studio-open').click();await page.locator('.studio-nav [data-panel="seo-geo"]').click();
   await page.waitForSelector('.seo-panel:visible');
   const title=page.locator('#seo-seo-pages-home-seo-title-value');
   assert.equal(await title.getAttribute('readonly'),'');
   const edit=async(path,value)=>{const input=page.locator(`[data-seo-path="${path}"]`);await input.fill(value);await input.blur();};
   await page.locator('.seo-card summary').filter({hasText:'Negocio'}).click();
   await edit('brand.name','Mesa Clara');await edit('modules.location.address.city','Altea');
   await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.pages.home.seo.title.value')==='Mesa Clara | Restaurante en Altea');
   await page.locator('[data-seo-mode="title"]').click();await edit('seo.pages.home.seo.title.value','Mi título personal');
   await edit('brand.name','Mar Nuevo');await edit('modules.location.address.city','Valencia');
   assert.equal(await title.inputValue(),'Mi título personal');
   await page.locator('[data-seo-mode="title"]').click();assert.equal(await title.inputValue(),'Mar Nuevo | Restaurante en Valencia');
   await page.locator('.studio-nav [data-panel="project"]').click();
   await page.locator('#undo-btn').click();assert.equal(await title.inputValue(),'Mi título personal');
   await page.locator('#redo-btn').click();assert.equal(await title.inputValue(),'Mar Nuevo | Restaurante en Valencia');
   await page.locator('.studio-nav [data-panel="seo-geo"]').click();
   await edit('seo.site.baseUrl','https://restaurant.example.org/');
   await page.locator('.seo-card summary').filter({hasText:'Revisión y privacidad'}).click();
   await page.locator('[data-seo-confirm]').click();assert.equal(await page.evaluate(()=>RestaurantStudioConfig.get('seo.business.publicDataConfirmed')),true);
   await edit('modules.location.address.city','Calpe');assert.equal(await page.evaluate(()=>RestaurantStudioConfig.get('seo.business.publicDataConfirmed')),false);
   await page.locator('[data-seo-mode="description"]').click();await edit('seo.pages.home.seo.description.value','<img src=x onerror=alert(1)> Texto propio.');
   assert.equal(await page.locator('.seo-serp img').count(),0,'untrusted text cannot create HTML');
   const json=await page.locator('[data-seo-schema]').textContent();assert.equal(JSON.parse(json)['@type'],'Restaurant');assert.equal(JSON.parse(json).aggregateRating,undefined);
   await page.waitForFunction(()=>document.querySelector('#studio-status').dataset.state==='saved');
   assert.equal(await page.evaluate(async()=>(await RestaurantStore.loadProject()).config.seo.pages.home.seo.description.value),'<img src=x onerror=alert(1)> Texto propio.');
   await page.locator('.studio-nav [data-panel="project"]').click();
   const downloadPromise=page.waitForEvent('download');await page.locator('#export-config').click();const download=await downloadPromise;const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
   assert.equal(exported.project.config.seo.pages.home.seo.description.mode,'custom');
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.pages.home.seo.description.mode')==='custom');
   await page.locator('.studio-open').click();await page.locator('.studio-nav [data-panel="seo-geo"]').click();
   assert.equal(await title.inputValue(),'Mar Nuevo | Restaurante en Calpe');
   // Import goes through the existing Project import, not a feature-specific loader.
   await page.locator('.studio-nav [data-panel="project"]').click();page.once('dialog',d=>d.accept());
   await page.locator('#import-config').setInputFiles({name:'seo-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
   await page.waitForFunction(()=>RestaurantStudioConfig.get('seo.pages.home.seo.description.mode')==='custom');
   await page.locator('.studio-nav [data-panel="seo-geo"]').click();
   await page.screenshot({path:`${out}/${engine}-desktop.png`});
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${out}/${engine}-mobile.png`});
   assert.equal(await page.locator('.seo-panel').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true,'panel has no horizontal overflow');
   assert.equal(await page.locator('meta[name="keywords"]').count(),0);
   assert.deepEqual(errors,[]);await context.close();console.log(`${engine.toUpperCase()} SEO STUDIO PASS: inheritance / custom / reset / undo / redo / privacy / persistence / export / import / mobile`);
  }finally{await browser.close();}
 }
}finally{local?.server.close();}
