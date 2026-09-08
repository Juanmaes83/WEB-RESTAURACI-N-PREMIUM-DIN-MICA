/* Evidencia visual de la ficha unificada, contra la URL desplegada.

   No repite la suite: captura lo que hay que MIRAR — la ficha ON en un motor del
   grupo compartido, la misma con OFF, la de Pizza con su propio producto, la tarjeta
   del Studio, el estado tras un reload, y las dos fichas propias del GROUP B en su
   propia página. Desktop y móvil.

   Uso: node tests/capture-product-detail-live.mjs [url]
   Salida: output/playwright/product-detail/live/
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'output','playwright','product-detail','live');
fs.mkdirSync(OUT,{recursive:true});
const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();
const log=[];

const settle=(page,ms)=>page.waitForTimeout(ms);
async function boot(page,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.documentElement.dataset.productDetailReady==='ready',
    null,{timeout:30000}).catch(()=>{});
  await settle(page,1500);
}
async function preset(page,value,flag){
  await page.waitForFunction(v=>!!document.querySelector(`#motion-orbital-style option[value="${v}"]`),
    value,{timeout:30000});
  await page.evaluate(v=>{
    const s=document.getElementById('motion-orbital-style');
    s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  },value);
  if(flag)await page.waitForFunction(f=>document.documentElement.dataset[f]==='ready',flag,
    {timeout:25000}).catch(()=>{});
  await settle(page,1600);
}

async function main(label,viewport,mobile){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await boot(page,BASE+'/');

  /* ON, en el motor compartido */
  const on=await page.evaluate(async()=>{
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(r=>setTimeout(r,2000));
    return {adapter:window.RestaurantProductDetail.activeAdapter(),
      product:document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null,
      title:(document.querySelector('#dish-title')?.textContent||'').trim()};
  });
  await page.screenshot({path:path.join(OUT,`${label}-01-ficha-on-compartida.png`)});
  await page.evaluate(()=>window.RestaurantProductDetail.close());
  await settle(page,1500);

  /* OFF: el clic vuelve a ser navegación.

     Hay que pulsar un plato que NO sea el héroe: sobre el héroe, con la ficha apagada,
     lo correcto es que no pase nada, así que ese clic no demuestra nada. */
  const off=await page.evaluate(async()=>{
    window.RestaurantStudioConfig.set('productDetail.enabled',false);
    await new Promise(r=>setTimeout(r,1100));
    const activeId=window.RestaurantProductDetail.activeProduct()?.id;
    const before=window.RestaurantOrbit.getActiveIndex();
    const lateral=[...document.querySelectorAll('#orbit-stage .orbit-dish')]
      .find(d=>d.dataset.id!==activeId);
    lateral?.click();
    await new Promise(r=>setTimeout(r,1900));
    const moved=window.RestaurantOrbit.getActiveIndex()!==before;
    const heroId=window.RestaurantProductDetail.activeProduct()?.id;
    document.querySelector(`#orbit-stage .orbit-dish[data-id="${heroId}"]`)?.click();
    await new Promise(r=>setTimeout(r,1500));
    return {open:window.RestaurantProductDetail.isOpen(),moved,
      heroOpen:window.RestaurantProductDetail.isOpen()};
  });
  await page.screenshot({path:path.join(OUT,`${label}-02-ficha-off.png`)});
  await page.evaluate(()=>window.RestaurantStudioConfig.set('productDetail.enabled',true));
  await settle(page,1200);

  /* Pizza, con su propio producto */
  await preset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  const pizza=await page.evaluate(async()=>{
    const p=window.RestaurantProductDetail.activeProduct();
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(r=>setTimeout(r,1500));
    return {adapter:window.RestaurantProductDetail.activeAdapter(),
      id:p?.id,name:p?.name,price:p?.price,
      shown:(document.querySelector('.upd-dialog [data-upd="name"]')?.textContent||'').trim()};
  });
  await page.screenshot({path:path.join(OUT,`${label}-03-ficha-pizza.png`)});
  await page.evaluate(()=>window.RestaurantProductDetail.close());
  await settle(page,1200);

  /* Studio → Platos */
  await page.evaluate(async()=>{
    document.querySelector('.studio-open')?.click();
    await new Promise(r=>setTimeout(r,900));
    document.querySelector('#studio [data-panel="dishes"]')?.click();
  });
  await settle(page,1200);
  await page.evaluate(()=>document.querySelector('.upd-studio')?.scrollIntoView({block:'center'}));
  await settle(page,800);
  await page.screenshot({path:path.join(OUT,`${label}-04-studio-ficha.png`)});

  /* y tras un reload */
  await page.evaluate(()=>{
    window.RestaurantStudioConfig.set('productDetail.trigger','button');
    window.RestaurantStudioConfig.set('productDetail.fields.pairing',false);
  });
  await settle(page,2600);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.productDetailReady==='ready',
    null,{timeout:30000});
  await settle(page,1400);
  const after=await page.evaluate(()=>window.RestaurantProductDetail.state());
  await page.evaluate(async()=>{
    document.querySelector('.studio-open')?.click();
    await new Promise(r=>setTimeout(r,900));
    document.querySelector('#studio [data-panel="dishes"]')?.click();
    await new Promise(r=>setTimeout(r,800));
    document.querySelector('.upd-studio')?.scrollIntoView({block:'center'});
  });
  await settle(page,900);
  await page.screenshot({path:path.join(OUT,`${label}-05-tras-reload.png`)});

  log.push({label,on,off,pizza,afterReload:{trigger:after.trigger,pairing:after.fields.pairing},
    errors});
  console.log(`${label}: ON ${on.adapter}/${on.product} · OFF abre=${off.open} navega=${off.moved}`
    +` · pizza ${pizza.adapter}/${pizza.id} "${pizza.shown}" price=${pizza.price}`
    +` · reload trigger=${after.trigger} pairing=${after.fields.pairing}`);
  if(errors.length)console.log(`  ERRORES: ${errors.slice(0,2).join(' | ')}`);
  await context.close();
}

async function groupB(label,viewport,mobile){
  for(const [name,page_,sel] of [
    ['dish-stage','labs/project10-dish-stage/index.html','[data-ds-detail]'],
    ['product-rail','labs/project11-cinematic-product-rail/index.html','#cpr-detail']]){
    const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await boot(page,`${BASE}/${page_}`);
    const r=await page.evaluate(async(s)=>{
      const pd=window.RestaurantProductDetail;
      if(!pd)return {missing:true};
      const p=pd.activeProduct();
      pd.open(null,{via:'api'});
      await new Promise(x=>setTimeout(x,1600));
      const host=document.querySelector(s);
      return {adapter:pd.activeAdapter(),id:p?.id,name:p?.name,
        hostOpen:s==='#cpr-detail'?(host?.open===true||host?.hasAttribute('open'))
          :host?.getAttribute('aria-hidden')==='false',
        ownDialogs:document.querySelectorAll('.upd-dialog.is-open').length};
    },sel);
    await page.screenshot({path:path.join(OUT,`${label}-06-${name}.png`)});
    log.push({label,groupB:name,...r,errors});
    console.log(`${label} ${name}: ${r.adapter}/${r.id} · su ficha abierta=${r.hostOpen}`
      +` · diálogos propios=${r.ownDialogs}`);
    await context.close();
  }
}

await main('desktop',{width:1440,height:960},false);
await groupB('desktop',{width:1440,height:960},false);
await main('mobile',{width:390,height:844},true);
await groupB('mobile',{width:390,height:844},true);

fs.writeFileSync(path.join(OUT,'live-log.json'),JSON.stringify({url:BASE,log},null,2));
await browser.close();
local?.server?.close();
console.log(`\nevidencia -> output/playwright/product-detail/live/`);
