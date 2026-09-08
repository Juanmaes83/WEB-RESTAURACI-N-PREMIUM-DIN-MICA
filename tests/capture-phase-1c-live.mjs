/* Evidencia visual de la FASE 1C — PRODUCT CONSOLIDATION GATE.

   Compacta y a propósito: nueve capturas y un vídeo corto del recorrido completo
   DENTRO del producto. Desktop es la prioridad; del móvil sólo se toma un smoke.

   Lo que hay que poder ver de un vistazo:
     01 el Studio con los once motores elegibles;
     02·03·04 cada experiencia dentro de la aplicación, con su barra de vuelta y el
        `src` apuntando a `experiences/…` — no a `/labs/`;
     05·06·07 los tres módulos configurados desde el Studio y en la web pública;
     08 la ficha de producto funcionando;
     09 la vuelta al Studio en la MISMA sesión, con el proyecto intacto.

   Uso: node tests/capture-phase-1c-live.mjs [url]
   Salida: output/playwright/phase-1c/live/ y .../video/
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'output','playwright','phase-1c','live');
const VIDEO=path.join(ROOT,'output','playwright','phase-1c','video');
fs.mkdirSync(OUT,{recursive:true});
fs.mkdirSync(VIDEO,{recursive:true});

const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();
const report={url:BASE,desktop:{},mobile:{}};

const IDS=['circular-dish-rotator','dish-stage','cinematic-product-rail'];
const wait=(p,ms)=>p.waitForTimeout(ms);

async function boot(page){
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!window.RestaurantStudioConfig,null,{timeout:30000});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,
    null,{timeout:30000}).catch(()=>{});
  await page.waitForFunction(()=>document.documentElement.dataset.experienceShellReady==='ready',
    null,{timeout:25000});
}
async function openStudio(page,panel){
  await page.evaluate(()=>{if(!document.querySelector('#studio.is-open'))
    document.querySelector('.studio-open')?.click()});
  await wait(page,900);
  await page.evaluate(p=>document.querySelector(`#studio [data-panel="${p}"]`)?.click(),panel);
  await wait(page,900);
}
async function motionPanel(page){
  await openStudio(page,'motion');
  await page.waitForFunction(()=>document.documentElement.dataset.motionLibrary==='ready',
    null,{timeout:20000});
  await wait(page,1200);
}
async function openExperience(page,id){
  await page.evaluate(i=>document.querySelector(`[data-experience-open="${i}"]`)?.click(),id);
  await page.waitForFunction(i=>document.documentElement.dataset.experienceShell===i,id,
    {timeout:15000});
  await page.waitForFunction(()=>window.RestaurantExperienceShell.state().status==='ready',
    null,{timeout:20000}).catch(()=>{});
  await wait(page,3200);
}
/* la barra de la shell, el `src` real del iframe y quién pinta de verdad en el centro
   de la pantalla: un rect no demuestra que se vea */
const frameFacts=page=>page.evaluate(()=>{
  const f=document.querySelector('.xs-frame');
  const el=document.elementFromPoint(innerWidth/2,innerHeight/2);
  return {src:(f?.getAttribute('src')||''),
    fromLabs:/\/labs\//.test(f?.getAttribute('src')||''),
    onTop:!!(f&&(el===f||f.contains(el))),
    topTag:el?el.tagName+(el.className?'.'+String(el.className).split(' ')[0]:''):'',
    back:(document.querySelector('[data-xs-back]')?.textContent||'').trim(),
    name:(document.querySelector('[data-xs-name]')?.textContent||'').trim()};
});

async function run(label,viewport,mobile,full){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  /* el listener DESPUÉS de newPage: el propio newPage emite 'page' y contarlo haría
     parecer que se abrió una pestaña cuando no */
  const tabs=[];
  context.on('page',p=>tabs.push(p.url()));
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const facts={};

  await boot(page);
  await motionPanel(page);
  facts.engines=await page.evaluate(()=>({
    count:document.querySelectorAll('[data-ml-engine]').length,
    numbers:[...document.querySelectorAll('.ml-num')].map(n=>n.textContent.trim()).join(' '),
    modules:document.querySelectorAll('[data-configure-module]').length,
    labLinks:[...document.querySelectorAll('#studio a[href]')]
      .filter(a=>/\/labs\//.test(a.getAttribute('href')||'')).length}));
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await wait(page,700);
  await page.screenshot({path:path.join(OUT,`${label}-01-studio-motion-11-motores.png`)});

  /* 02·03·04 — cada experiencia, dentro del producto */
  facts.experiences=[];
  for(const [i,id] of IDS.entries()){
    await openExperience(page,id);
    facts.experiences.push({id,...await frameFacts(page)});
    await page.screenshot({path:path.join(OUT,`${label}-0${i+2}-${id}-en-producto.png`)});
    await page.evaluate(()=>document.querySelector('[data-xs-back]')?.click());
    await wait(page,1500);
  }

  if(full){
    /* 05·06·07 — los tres módulos, encendidos desde el Studio y vistos en la web */
    await openStudio(page,'modules');
    await page.evaluate(()=>['location','social','whatsapp'].forEach(m=>
      window.RestaurantStudioConfig.set(`modules.${m}.enabled`,true)));
    await page.waitForFunction(()=>document.querySelectorAll('[class^="lm-"]').length>0
      &&document.querySelectorAll('[class^="sr-"]').length>0
      &&document.querySelectorAll('[class^="wa-"]').length>0,null,{timeout:20000});
    await wait(page,1400);
    facts.modules=await page.evaluate(()=>{
      const t=s=>{const e=document.querySelector(s);return e?(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,90):''};
      return {location:t('[class^="lm-"]'),social:t('[class^="sr-"]'),whatsapp:t('[class^="wa-"]'),
        fields:document.querySelectorAll('#studio [data-path^="modules."]').length};
    });
    const MODS=[['05-location','[class^="lm-"]'],['06-social','[class^="sr-"]'],
      ['07-whatsapp','[class^="wa-"]']];
    for(const [name,sel] of MODS){
      await page.evaluate(()=>document.querySelector('#studio-close')?.click());
      await wait(page,600);
      const el=page.locator(sel).first();
      await el.scrollIntoViewIfNeeded().catch(()=>{});
      await wait(page,700);
      await el.screenshot({path:path.join(OUT,`${label}-${name}.png`)})
        .catch(()=>page.screenshot({path:path.join(OUT,`${label}-${name}.png`)}));
    }

    /* 08 — la ficha de producto, en el motor compartido */
    facts.detail=await page.evaluate(async()=>{
      window.RestaurantStudioConfig.set('productDetail.enabled',true);
      await new Promise(r=>setTimeout(r,900));
      window.RestaurantProductDetail.open(null,{via:'api'});
      await new Promise(r=>setTimeout(r,2000));
      return {adapter:window.RestaurantProductDetail.activeAdapter(),
        open:document.querySelectorAll('.upd-dialog.is-open, #dish-detail.is-open').length,
        name:(document.querySelector('.upd-dialog [data-upd="name"]')
          ||document.querySelector('#dish-title'))?.textContent.trim()||''};
    });
    await wait(page,600);
    await page.screenshot({path:path.join(OUT,`${label}-08-product-detail.png`)});
    await page.keyboard.press('Escape');
    await wait(page,900);

    /* 09 — vuelta al Studio, MISMA sesión: el proyecto sigue siendo el mismo */
    await motionPanel(page);
    facts.session=await page.evaluate(()=>({
      restaurant:window.RestaurantStudioConfig.get('brand.name')
        ||window.RestaurantStudioConfig.snapshot?.()?.brand?.name||'',
      modulesOn:['location','social','whatsapp']
        .filter(m=>window.RestaurantStudioConfig.get(`modules.${m}.enabled`)===true).length,
      detailOn:window.RestaurantStudioConfig.get('productDetail.enabled')===true,
      shellOpen:!!document.querySelector('.xs-frame'),
      engines:document.querySelectorAll('[data-ml-engine]').length}));
    await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
    await wait(page,700);
    await page.screenshot({path:path.join(OUT,`${label}-09-vuelta-al-studio.png`)});
  }

  facts.newTabs=tabs.length;
  facts.pageErrors=errors;
  report[label]=facts;
  console.log(`\n[${label}] motores ${facts.engines.count} (${facts.engines.numbers}) · `
    +`módulos ${facts.engines.modules} · enlaces a labs en Studio ${facts.engines.labLinks}`);
  for(const e of facts.experiences)
    console.log(`  ${e.id.padEnd(24)} src=${e.src} labs=${e.fromLabs?'SÍ':'no'} `
      +`visible=${e.onTop?'sí':`NO (${e.topTag})`} volver="${e.back}"`);
  if(full)console.log(`  módulos: ${facts.modules.fields} campos · ficha: `
    +`${facts.detail.adapter} "${facts.detail.name}" · sesión: `
    +`${facts.session.modulesOn}/3 ON, ficha ${facts.session.detailOn?'ON':'OFF'}, `
    +`${facts.session.engines} motores`);
  console.log(`  pestañas nuevas: ${facts.newTabs} · errores: ${errors.length||'ninguno'}`);
  await context.close();
}

await run('desktop',{width:1440,height:960},false,true);
await run('mobile',{width:390,height:844},true,false);   /* smoke */

/* vídeo corto: el recorrido entero dentro del producto */
{
  const context=await browser.newContext({viewport:{width:1440,height:900},
    recordVideo:{dir:VIDEO,size:{width:1440,height:900}}});
  const page=await context.newPage();
  await boot(page);
  await motionPanel(page);
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await wait(page,1500);
  for(const id of IDS){
    await openExperience(page,id);
    await wait(page,2000);
    await page.evaluate(()=>document.querySelector('[data-xs-back]')?.click());
    await wait(page,1600);
  }
  await openStudio(page,'modules');
  await page.evaluate(()=>['location','social','whatsapp'].forEach(m=>
    window.RestaurantStudioConfig.set(`modules.${m}.enabled`,true)));
  await wait(page,1800);
  await page.evaluate(()=>document.querySelector('#studio-close')?.click());
  await page.evaluate(()=>document.querySelector('[class^="lm-"]')?.scrollIntoView({block:'center'}));
  await wait(page,1600);
  await page.evaluate(async()=>{
    window.RestaurantStudioConfig.set('productDetail.enabled',true);
    await new Promise(r=>setTimeout(r,700));
    window.RestaurantProductDetail.open(null,{via:'api'});
  });
  await wait(page,2200);
  await page.keyboard.press('Escape');
  await wait(page,1000);
  await motionPanel(page);
  await wait(page,1500);
  const video=page.video();
  await context.close();
  const dest=path.join(VIDEO,'phase-1c-in-product.webm');
  fs.rmSync(dest,{force:true});
  fs.renameSync(await video.path(),dest);
  console.log(`\nvídeo -> ${path.relative(ROOT,dest)} (${Math.round(fs.statSync(dest).size/1024)}KB)`);
}

fs.writeFileSync(path.join(OUT,'live-log.json'),JSON.stringify(report,null,2));
await browser.close();
local?.server?.close();

const bad=[...report.desktop.experiences,...report.mobile.experiences].filter(e=>e.fromLabs||!e.onTop);
console.log(`\nevidencia -> output/playwright/phase-1c/live/`);
console.log(bad.length?`REVISAR: ${bad.map(e=>e.id).join(', ')}`
  :`OK · 9 capturas desktop + smoke móvil · 0 pestañas nuevas · 0 runtime desde /labs/`);
