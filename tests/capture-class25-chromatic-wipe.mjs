/* CLASS 25 · CHROMATIC INGREDIENT WIPE — visual evidence (§24).
   Five frames + one short clip. Usage: node tests/capture-class25-chromatic-wipe.mjs [baseUrl] */
import {chromium} from 'playwright';
import {startServer} from './static-server.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const DIR=path.join(path.dirname(fileURLToPath(import.meta.url)),'screenshots');
const VID=path.join(path.dirname(fileURLToPath(import.meta.url)),'video');
const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();
const ready=async page=>{await page.waitForFunction(()=>window.RestaurantChromaticWipe?.state?.().ready===true,null,{timeout:40000});await page.waitForTimeout(650)};
const settled=async page=>{await page.waitForFunction(()=>{const s=window.RestaurantChromaticWipe?.state?.();return s&&!s.transition&&!s.dragging},null,{timeout:3000}).catch(()=>{})};
const shot=(page,n)=>page.locator('.cw-stage').screenshot({path:path.join(DIR,n)});
const atProgress=(page,lo,hi)=>page.waitForFunction(([a,b])=>{const s=window.RestaurantChromaticWipe.state();return s.transition&&s.progress>a&&s.progress<b},[lo,hi],{timeout:3000}).catch(()=>{});

{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await ctx.newPage();
  await page.goto(`${BASE}/?review=chromatic-wipe`,{waitUntil:'domcontentloaded'});
  await ready(page);await page.evaluate(()=>window.RestaurantChromaticWipe.goTo(0));await settled(page);
  await shot(page,'01-initial-world.png');
  await page.click('.cw-next');await atProgress(page,0.46,0.56);await shot(page,'02-wipe-midpoint.png');
  await settled(page);await page.waitForTimeout(120);await shot(page,'03-incoming-world.png');
  await page.evaluate(()=>window.RestaurantChromaticWipe.goTo(3));await settled(page);
  await page.click('.cw-prev');await atProgress(page,0.4,0.6);await shot(page,'04-reverse-wipe.png');
  await settled(page);
  await ctx.close();
}
{
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const page=await ctx.newPage();
  await page.goto(`${BASE}/?review=chromatic-wipe`,{waitUntil:'domcontentloaded'});
  await ready(page);await page.evaluate(()=>window.RestaurantChromaticWipe.goTo(2));await settled(page);
  await page.locator('.cw-stage').screenshot({path:path.join(DIR,'05-mobile.png')});
  await ctx.close();
}
/* Short clip: initial → next → next → prev → drag. */
{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:VID,size:{width:1440,height:900}}});
  const page=await ctx.newPage();
  await page.goto(`${BASE}/?review=chromatic-wipe`,{waitUntil:'domcontentloaded'});
  await ready(page);await page.evaluate(()=>window.RestaurantChromaticWipe.goTo(0));await settled(page);
  await page.waitForTimeout(700);
  await page.click('.cw-next');await settled(page);await page.waitForTimeout(500);
  await page.click('.cw-next');await settled(page);await page.waitForTimeout(500);
  await page.click('.cw-prev');await settled(page);await page.waitForTimeout(500);
  const bb=await page.locator('.cw-stage').boundingBox();
  await page.mouse.move(bb.x+bb.width*0.5,bb.y+bb.height*0.72);await page.mouse.down();
  for(let i=1;i<=10;i++){await page.mouse.move(bb.x+bb.width*0.5-360*i/10,bb.y+bb.height*0.72,{steps:1});await page.waitForTimeout(20)}
  await page.mouse.up();await settled(page);await page.waitForTimeout(600);
  await ctx.close();
}
await browser.close();if(local)await new Promise(r=>local.server.close(r));
console.log('CLASS25 evidence written to tests/screenshots + tests/video');
