/* Regenera SÓLO las dos fichas afectadas por el microfix, desktop y móvil. */
import {chromium} from 'playwright';
import path from 'node:path';
const OUT=path.resolve('output/playwright/product-detail/live');
const BASE=process.argv[2].replace(/\/$/,'');
const b=await chromium.launch();
for(const [label,vp,mobile] of [['desktop',{width:1440,height:960},false],
  ['mobile',{width:390,height:844},true]]){
  const ctx=await b.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage();
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.documentElement.dataset.productDetailReady==='ready',null,{timeout:30000});
  await page.waitForTimeout(1500);
  // ficha compartida (aquí se ve la etiqueta de alérgenos)
  const shared=await page.evaluate(async()=>{
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(r=>setTimeout(r,2100));
    return {allergens:(document.querySelector('#detail-allergens')?.textContent||'').trim(),
      product:document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null};
  });
  await page.screenshot({path:path.join(OUT,`${label}-01-ficha-on-compartida.png`)});
  await page.evaluate(()=>window.RestaurantProductDetail.close());
  await page.waitForTimeout(1500);
  // ficha de Pizza
  await page.waitForFunction(()=>!!document.querySelector('#motion-orbital-style option[value="pizza-slice-orbit"]'),null,{timeout:30000});
  await page.evaluate(()=>{const s=document.getElementById('motion-orbital-style');
    s.value='pizza-slice-orbit';s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));window.RestaurantMotionStudio?.publish?.()});
  await page.waitForFunction(()=>document.documentElement.dataset.pizzaSliceOrbit==='ready',null,{timeout:25000});
  await page.waitForTimeout(2200);
  const pizza=await page.evaluate(async()=>{
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(r=>setTimeout(r,1600));
    const d=document.querySelector('.upd-dialog');
    const t=n=>(d?.querySelector(`[data-upd="${n}"]`)?.textContent||'').trim();
    return {name:t('name'),meta:t('meta'),desc:t('description'),story:t('story'),
      ing:t('ingredients').slice(0,40)};
  });
  await page.screenshot({path:path.join(OUT,`${label}-03-ficha-pizza.png`)});
  console.log(`${label}: alérgenos "${shared.allergens.slice(0,34)}" · pizza "${pizza.name}" / "${pizza.meta}" / "${pizza.desc.slice(0,48)}" / "${pizza.story}"`);
  if(errs.length)console.log('  ERRORES:',errs.slice(0,2));
  await ctx.close();
}
await b.close();
