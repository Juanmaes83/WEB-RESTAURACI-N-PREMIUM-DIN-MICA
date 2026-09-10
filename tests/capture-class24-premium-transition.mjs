/* CLASS 24 · HALF ORBIT — premium transition visual audit (§19).
   Exactly six frames. Usage: node tests/capture-class24-premium-transition.mjs [baseUrl] */
import {chromium} from 'playwright';
import {startServer} from './static-server.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const DIR=path.join(path.dirname(fileURLToPath(import.meta.url)),'screenshots');
const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();

async function ready(page){
  await page.waitForFunction(()=>window.RestaurantHalfOrbit?.state?.().ready===true,null,{timeout:40000});
  await page.waitForTimeout(650);
}
async function settled(page){
  await page.waitForFunction(()=>{const s=window.RestaurantHalfOrbit?.state?.();return s&&!s.transition&&!s.dragging},null,{timeout:3000}).catch(()=>{});
}
const shot=(page,name)=>page.locator('.hos-stage').screenshot({path:path.join(DIR,name)});

{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await ctx.newPage();
  await page.goto(`${BASE}/?review=half-orbit`,{waitUntil:'domcontentloaded',timeout:45000});
  await ready(page);
  await page.evaluate(()=>window.RestaurantHalfOrbit.goTo(0));await settled(page);
  await shot(page,'01-half-orbit-rest.png');

  await page.click('.hos-next');
  await page.waitForTimeout(95);await shot(page,'02-half-orbit-anticipate.png');
  await page.waitForTimeout(320);await shot(page,'03-half-orbit-mid-transition.png');
  await settled(page);await page.waitForTimeout(120);await shot(page,'04-half-orbit-settle.png');

  /* Opposite direction, captured mid-sweep. */
  await page.evaluate(()=>window.RestaurantHalfOrbit.goTo(2));await settled(page);
  await page.click('.hos-prev');await page.waitForTimeout(360);
  await shot(page,'05-half-orbit-opposite-direction.png');
  await settled(page);
  await ctx.close();
}
{
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const page=await ctx.newPage();
  await page.goto(`${BASE}/?review=half-orbit`,{waitUntil:'domcontentloaded',timeout:45000});
  await ready(page);
  await page.evaluate(()=>window.RestaurantHalfOrbit.goTo(1));await settled(page);
  await page.locator('.hos-stage').screenshot({path:path.join(DIR,'06-half-orbit-mobile.png')});
  await ctx.close();
}
await browser.close();if(local)await new Promise(r=>local.server.close(r));
console.log('CLASS24 premium transition frames written to tests/screenshots/');
