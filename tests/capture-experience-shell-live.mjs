/* Evidencia visual de la Fase 1B, contra la URL desplegada.

   Lo que hay que poder ver de un vistazo: la biblioteca, cada experiencia DENTRO de la
   aplicación con su barra "Volver al Studio", la vuelta al Studio, y que en ningún
   momento se abre otra pestaña. Desktop y móvil, más un vídeo corto del recorrido.

   Uso: node tests/capture-experience-shell-live.mjs [url]
   Salida: output/playwright/experience-shell/live/
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'output','playwright','experience-shell','live');
const VIDEO=path.join(ROOT,'output','playwright','experience-shell','video');
fs.mkdirSync(OUT,{recursive:true});
fs.mkdirSync(VIDEO,{recursive:true});
const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();
const log=[];

const IDS=['circular-dish-rotator','dish-stage','cinematic-product-rail'];

async function ready(page){
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,
    null,{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.experienceShellReady==='ready',
    null,{timeout:25000});
  await page.evaluate(async()=>{
    document.querySelector('.studio-open')?.click();
    await new Promise(r=>setTimeout(r,900));
    document.querySelector('#studio [data-panel="motion"]')?.click();
  });
  await page.waitForFunction(()=>document.documentElement.dataset.motionLibrary==='ready',
    null,{timeout:20000});
  await page.waitForTimeout(1400);
}
async function openIt(page,id){
  await page.evaluate(i=>document.querySelector(`[data-experience-open="${i}"]`)?.click(),id);
  await page.waitForFunction(i=>document.documentElement.dataset.experienceShell===i,id,
    {timeout:15000});
  await page.waitForFunction(()=>window.RestaurantExperienceShell.state().status==='ready',
    null,{timeout:20000}).catch(()=>{});
  await page.waitForTimeout(3000);
}

async function shots(label,viewport,mobile){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  /* el listener va DESPUÉS de crear la página: el propio `newPage` emite un evento
     'page' y contarlo haría parecer que se abrió una pestaña cuando no */
  const tabs=[];
  context.on('page',p=>tabs.push(p.url()));
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await ready(page);
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(OUT,`${label}-01-motion-library.png`)});

  for(const id of IDS){
    await openIt(page,id);
    const info=await page.evaluate(()=>({
      name:(document.querySelector('[data-xs-name]')?.textContent||'').trim(),
      back:(document.querySelector('[data-xs-back]')?.textContent||'').trim(),
      frames:document.querySelectorAll('.xs-frame').length,
      url:location.href.replace(location.origin,'')}));
    await page.screenshot({path:path.join(OUT,`${label}-02-${id}.png`)});
    log.push({label,id,...info});
    /* volver con su propio botón (la ergonomía táctil la asserta la suite: 42px) */
    await page.evaluate(()=>document.querySelector('[data-xs-back]')?.click());
    await page.waitForTimeout(1500);
  }
  await page.screenshot({path:path.join(OUT,`${label}-03-vuelta-al-studio.png`)});
  /* reapertura, para que se vea que no degrada */
  await openIt(page,'dish-stage');
  await page.screenshot({path:path.join(OUT,`${label}-04-reapertura.png`)});
  await page.evaluate(()=>window.RestaurantExperienceShell.close());
  await page.waitForTimeout(1200);

  console.log(`${label}: pestañas nuevas ${tabs.length} · `
    +log.filter(l=>l.label===label).map(l=>`${l.id}(${l.frames} iframe)`).join(' '));
  if(errors.length)console.log(`  ERRORES: ${errors.slice(0,2).join(' | ')}`);
  await context.close();
  return tabs.length;
}

const tabsDesktop=await shots('desktop',{width:1440,height:960},false);
const tabsMobile=await shots('mobile',{width:390,height:844},true);

/* vídeo corto del recorrido completo, desktop */
{
  const context=await browser.newContext({viewport:{width:1440,height:900},
    recordVideo:{dir:VIDEO,size:{width:1440,height:900}}});
  const page=await context.newPage();
  await ready(page);
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(1600);
  for(const id of IDS){
    await openIt(page,id);
    await page.waitForTimeout(2200);
    await page.evaluate(()=>document.querySelector('[data-xs-back]')?.click());
    await page.waitForTimeout(1800);
  }
  const video=page.video();
  await context.close();
  const tmp=await video.path();
  const dest=path.join(VIDEO,'experience-shell-desktop.webm');
  fs.rmSync(dest,{force:true});
  fs.renameSync(tmp,dest);
  console.log(`vídeo -> ${path.relative(ROOT,dest)} (${Math.round(fs.statSync(dest).size/1024)}KB)`);
}

fs.writeFileSync(path.join(OUT,'live-log.json'),
  JSON.stringify({url:BASE,newTabs:{desktop:tabsDesktop,mobile:tabsMobile},log},null,2));
await browser.close();
local?.server?.close();
console.log(`\nevidencia -> output/playwright/experience-shell/live/`);
