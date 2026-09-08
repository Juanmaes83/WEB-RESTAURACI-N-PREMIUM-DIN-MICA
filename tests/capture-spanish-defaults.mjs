/* Evidencia visual de la Fase A: una INSTALACIÓN NUEVA en español.

   Perfil limpio, los tres módulos encendidos y ni una sola cadena de copy editada —
   que es justo lo que la suite de Class 20 no puede mostrar, porque su trabajo es
   editar. Aquí se ve lo que ve un restaurante recién instalado.

   Uso: node tests/capture-spanish-defaults.mjs [url]
   Salida: output/playwright/spanish-defaults/
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'output','playwright','spanish-defaults');
fs.mkdirSync(OUT,{recursive:true});
const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=target||local.url;
const browser=await chromium.launch();
const log=[];

async function shots(label,viewport,mobile){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!window.RestaurantStudioConfig,null,{timeout:30000});

  /* OFF: nada público */
  const off=await page.evaluate(()=>({
    lm:document.querySelectorAll('[class^="lm-"]').length,
    sr:document.querySelectorAll('[class^="sr-"]').length,
    wa:document.querySelectorAll('[class^="wa-"]').length}));
  await page.screenshot({path:path.join(OUT,`${label}-01-off-sin-modulos.png`)});

  /* ON, sin editar ni una cadena */
  await page.evaluate(()=>{
    ['location','social','whatsapp'].forEach(m=>
      window.RestaurantStudioConfig.set(`modules.${m}.enabled`,true));
  });
  await page.waitForFunction(()=>document.querySelectorAll('[class^="lm-"]').length>0
    &&document.querySelectorAll('[class^="sr-"]').length>0,null,{timeout:20000});
  await page.waitForTimeout(1200);

  const copy=await page.evaluate(()=>{
    const t=sel=>{const el=document.querySelector(sel);return el?(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim():''};
    return {location:t('[class^="lm-"]'),social:t('[class^="sr-"]'),whatsapp:t('[class^="wa-"]')};
  });

  for(const [name,sel] of [['02-location','[class^="lm-"]'],
    ['03-social','[class^="sr-"]'],['04-whatsapp','[class^="wa-"]']]){
    const el=page.locator(sel).first();
    await el.scrollIntoViewIfNeeded().catch(()=>{});
    await page.waitForTimeout(600);
    await el.screenshot({path:path.join(OUT,`${label}-${name}.png`)}).catch(async()=>{
      await page.screenshot({path:path.join(OUT,`${label}-${name}.png`)});
    });
  }

  /* Studio → Módulos, con los defaults en español */
  await page.evaluate(()=>document.querySelector('.studio-open')?.click());
  await page.waitForTimeout(900);
  await page.evaluate(()=>document.querySelector('#studio [data-panel="modules"]')?.click());
  await page.waitForTimeout(900);
  await page.screenshot({path:path.join(OUT,`${label}-05-studio-modulos.png`)});

  /* y que sobrevive a un reload */
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('[class^="lm-"]').length>0,
    null,{timeout:25000});
  await page.waitForTimeout(1000);
  const after=await page.evaluate(()=>({
    lm:document.querySelectorAll('[class^="lm-"]').length,
    title:(document.querySelector('.lm-title')?.textContent||'').trim()}));
  await page.screenshot({path:path.join(OUT,`${label}-06-tras-reload.png`)});

  log.push({label,off,copy,after,errors});
  console.log(`${label}: OFF lm/sr/wa = ${off.lm}/${off.sr}/${off.wa} · tras reload lm=${after.lm}`);
  console.log(`  location: ${copy.location.slice(0,90)}`);
  console.log(`  social:   ${copy.social.slice(0,90)}`);
  console.log(`  whatsapp: ${copy.whatsapp.slice(0,90)}`);
  if(errors.length)console.log(`  ERRORES: ${errors.slice(0,2).join(' | ')}`);
  await context.close();
}

await shots('desktop',{width:1440,height:960},false);
await shots('mobile',{width:390,height:844},true);

fs.writeFileSync(path.join(OUT,'defaults-log.json'),
  JSON.stringify({url:BASE,captured:log},null,2));
await browser.close();
local?.server?.close();
console.log(`\nevidencia → output/playwright/spanish-defaults/`);
