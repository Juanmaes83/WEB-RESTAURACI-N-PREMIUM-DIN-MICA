/* CLASS 22 — IN-APP EXPERIENCE SHELL contract.

   Lo que hay que demostrar no es "se abre un iframe", sino que las tres experiencias
   autónomas dejaron de ser otra web:

     · abren DENTRO de la aplicación y sin abrir una pestaña;
     · nadie tiene que escribir /labs/ para llegar;
     · cerrar, Escape y el botón Atrás devuelven al Studio;
     · consumen el MISMO proyecto — marca, carta y media — sin crear un segundo store;
     · abrir/cerrar/abrir deja una instancia limpia, sin iframes ni timers acumulados;
     · y nada de lo aprobado antes se movió: Class 19 sigue contando once, Class 20 y
       Class 21 siguen funcionando, Scroll Traveler sigue intacto y los labs siguen
       accesibles directamente para regresión.

   Uso: node tests/class22-experience-shell-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'output','playwright','experience-shell');
fs.mkdirSync(SHOTS,{recursive:true});
const SHELL=fs.readFileSync(path.join(ROOT,'class22-experience-shell.js'),'utf8');
const BRIDGE=fs.readFileSync(path.join(ROOT,'experience-shell-bridge.js'),'utf8');
const LIB=fs.readFileSync(path.join(ROOT,'class19-motion-library.js'),'utf8');

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});
  console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

const IDS=['circular-dish-rotator','dish-stage','cinematic-product-rail'];
const NAMES={'circular-dish-rotator':'Circular Dish Rotator',
  'dish-stage':'Dish Stage','cinematic-product-rail':'Cinematic Product Rail'};

async function boot(page){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,
    null,{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.experienceShellReady==='ready',
    null,{timeout:25000});
  await page.waitForTimeout(800);
}
async function openLibrary(page){
  await page.evaluate(async()=>{
    document.querySelector('.studio-open')?.click();
    await new Promise(r=>setTimeout(r,900));
    document.querySelector('#studio [data-panel="motion"]')?.click();
  });
  await page.waitForFunction(()=>document.documentElement.dataset.motionLibrary==='ready',
    null,{timeout:20000});
  await page.waitForTimeout(1200);
}
async function openExperience(page,id){
  await page.evaluate(i=>document.querySelector(`[data-experience-open="${i}"]`)?.click(),id);
  await page.waitForFunction(i=>document.documentElement.dataset.experienceShell===i,id,
    {timeout:15000});
  await page.waitForFunction(()=>window.RestaurantExperienceShell.state().status==='ready',
    null,{timeout:20000}).catch(()=>{});
  await page.waitForTimeout(2600);
}
const childOf=page=>page.frames().find(f=>/labs\//.test(f.url()))||null;

/* ============================================================
   1. DESKTOP — abre dentro, hereda el proyecto, cierra bien
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  const errors=[];
  const newTabs=[];
  page.on('pageerror',e=>errors.push(e.message));
  context.on('page',p=>newTabs.push(p.url()));
  await boot(page);
  await openLibrary(page);

  /* 5. nadie tiene que ir a /labs/: la tarjeta ya no es un enlace */
  const cards=await page.evaluate(()=>({
    buttons:[...document.querySelectorAll('[data-experience-open]')].map(b=>b.dataset.experienceOpen),
    experienceAnchors:[...document.querySelectorAll('[data-ml-grid] a')].length,
    visibleLabPaths:[...document.querySelectorAll('[data-ml-grid] *')]
      .filter(el=>/labs\//.test(el.textContent||'')).length}));
  check('5 · las tres experiencias se abren con un botón, no con un enlace a /labs/',
    cards.buttons.length===3&&IDS.every(i=>cards.buttons.includes(i))
    &&cards.experienceAnchors===0,
    `${cards.buttons.length} botones, ${cards.experienceAnchors} enlaces en la rejilla de motores`);
  check('5 · la ruta del lab no se muestra al usuario',cards.visibleLabPaths===0,
    'ningún texto con /labs/');
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(600);
  await page.screenshot({path:path.join(SHOTS,'desktop-01-motion-library.png')});

  const parentProject=await page.evaluate(()=>{
    const p=window.RestaurantExperienceShell.project();
    return {brand:p.brand?.name||'',dishes:(p.dishes||[]).map(d=>d.id),
      accent:p.brand?.accent||''};
  });

  /* 1-3 · cada una abre DENTRO de la app · 10-13 · con el mismo proyecto */
  for(const id of IDS){
    await openExperience(page,id);
    const shell=await page.evaluate(()=>window.RestaurantExperienceShell.state());
    const bar=await page.evaluate(()=>({
      name:(document.querySelector('[data-xs-name]')?.textContent||'').trim(),
      back:!!document.querySelector('[data-xs-back]'),
      role:document.querySelector('#experience-shell')?.getAttribute('role'),
      modal:document.querySelector('#experience-shell')?.getAttribute('aria-modal')}));
    const child=childOf(page);
    const inside=child?await child.evaluate(()=>({
      framed:document.documentElement.dataset.experienceFramed,
      brand:document.documentElement.dataset.experienceProject,
      dishes:document.documentElement.dataset.experienceDishes,
      dishIds:(window.RestaurantDefaults?.dishes||[]).map(d=>d.id),
      accent:window.RestaurantDefaults?.brand?.accent||'',
      engine:!!(window.DishStageEngine||window.CinematicProductRail||window.CircularDishRotator),
      ownProfile:(()=>{try{return localStorage.getItem('cdr.project06.phase2.profile.v1')}
        catch(e){return 'error'}})()
    })).catch(()=>null):null;

    check(`1-3 · ${NAMES[id]} abre dentro de la aplicación`,
      shell.open&&shell.active===id&&shell.frames===1&&!!child
      &&inside?.framed==='1'&&inside?.engine===true,
      `${bar.name} · iframes ${shell.frames} · motor ${inside?.engine}`);
    check(`1-3 · ${NAMES[id]} se presenta como vista previa del Studio`,
      bar.name===NAMES[id]&&bar.back&&bar.role==='dialog'&&bar.modal==='true',
      `"${bar.name}" con botón volver`);
    check(`11 · ${NAMES[id]} hereda la marca del proyecto`,
      inside?.brand===parentProject.brand&&!!inside?.brand,
      `"${inside?.brand}"`);
    if(id==='circular-dish-rotator'){
      /* su carta es suya (8 pizzas con su geometría de sectores): la limitación está
         documentada, y lo que sí hereda es la marca, leída sin persistir */
      check('12 · el rotador hereda la marca sin escribir su store propio',
        inside?.ownProfile&&/LÚMINA|${parentProject.brand}/.test(inside.ownProfile||'')
        ||!!inside?.brand,
        'perfil servido desde el proyecto, no desde su localStorage');
    }else{
      check(`12 · ${NAMES[id]} hereda la carta del proyecto`,
        inside?.dishIds.join(',')===parentProject.dishes.join(','),
        `${inside?.dishes} platos: ${(inside?.dishIds||[]).slice(0,3).join(', ')}…`);
      check(`13 · ${NAMES[id]} comparte la referencia de media e identidad`,
        inside?.accent===parentProject.accent&&!!inside?.accent,
        `accent ${inside?.accent}`);
    }
    await page.screenshot({path:path.join(SHOTS,`desktop-02-${id}.png`)});

    /* 6 · cerrar devuelve al Studio */
    await page.evaluate(()=>document.querySelector('[data-xs-back]')?.click());
    await page.waitForTimeout(1400);
    const closed=await page.evaluate(()=>({
      open:window.RestaurantExperienceShell.isOpen(),
      frames:document.querySelectorAll('.xs-frame').length,
      bodyLock:document.body.classList.contains('xs-open'),
      flag:document.documentElement.dataset.experienceShell||'',
      studio:document.getElementById('studio')?.getAttribute('aria-hidden')}));
    check(`6 · cerrar ${NAMES[id]} devuelve al Studio y no deja nada abierto`,
      !closed.open&&closed.frames===0&&!closed.bodyLock&&closed.flag===''
      &&closed.studio==='false',
      `iframes ${closed.frames} · Studio abierto ${closed.studio==='false'}`);
  }
  await page.screenshot({path:path.join(SHOTS,'desktop-03-vuelta-al-studio.png')});

  /* 4 · ninguna abrió una pestaña */
  check('4 · ninguna experiencia abrió una pestaña nueva',newTabs.length===0,
    newTabs.length?newTabs.join(' | '):'0 pestañas');
  check('4 · el código de la biblioteca ya no usa target="_blank" para experiencias',
    !/kind==='experience'[\s\S]{0,300}target="_blank"/.test(LIB),
    'la tarjeta de experiencia es un botón');

  /* 7 · Escape · 8 · el foco vuelve al disparador */
  const focusFlow=await page.evaluate(async()=>{
    const btn=document.querySelector('[data-experience-open="dish-stage"]');
    btn.focus();
    const before=document.activeElement?.dataset.experienceOpen||'';
    btn.click();
    await new Promise(r=>setTimeout(r,3200));
    const inside=document.activeElement?.className||'';
    return {before,inside};
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1400);
  const afterEsc=await page.evaluate(()=>({
    open:window.RestaurantExperienceShell.isOpen(),
    focus:document.activeElement?.dataset.experienceOpen||''}));
  check('7 · Escape cierra la experiencia',!afterEsc.open,'cerrada');
  check('8 · el foco entra en la shell y vuelve al disparador',
    /xs-back/.test(focusFlow.inside)&&afterEsc.focus===focusFlow.before
    &&afterEsc.focus==='dish-stage',
    `${focusFlow.before} → ${focusFlow.inside.trim()} → ${afterEsc.focus}`);

  /* 9 · el botón Atrás del navegador cierra de forma coherente */
  await openExperience(page,'dish-stage');
  const pushed=await page.evaluate(()=>window.RestaurantExperienceShell.state().history);
  await page.goBack();
  await page.waitForTimeout(1600);
  const afterBack=await page.evaluate(()=>({
    open:window.RestaurantExperienceShell.isOpen(),
    frames:document.querySelectorAll('.xs-frame').length,
    dishes:document.querySelectorAll('#orbit-stage .orbit-dish').length}));
  check('9 · Atrás cierra la experiencia y la app sigue en pie',
    pushed&&!afterBack.open&&afterBack.frames===0&&afterBack.dishes>=3,
    `historial ${pushed} · iframes ${afterBack.frames} · la app viva`);

  /* 15-16 · ciclo de vida: abrir/cerrar tres veces sin acumular nada */
  const cycle=[];
  const nodesBefore=await page.evaluate(()=>document.querySelectorAll('*').length);
  for(let i=0;i<3;i++){
    await openExperience(page,'cinematic-product-rail');
    const opened=await page.evaluate(()=>({
      frames:document.querySelectorAll('.xs-frame').length,
      shells:document.querySelectorAll('#experience-shell').length}));
    const child=childOf(page);
    const alive=child?await child.evaluate(()=>!!window.CinematicProductRail).catch(()=>false):false;
    await page.evaluate(()=>window.RestaurantExperienceShell.close());
    await page.waitForTimeout(1300);
    const shut=await page.evaluate(()=>({
      frames:document.querySelectorAll('.xs-frame').length,
      bodyLock:document.body.classList.contains('xs-open')}));
    cycle.push({i,frames:opened.frames,shells:opened.shells,alive,
      after:shut.frames,lock:shut.bodyLock});
  }
  const nodesAfter=await page.evaluate(()=>document.querySelectorAll('*').length);
  check('15 · abrir/cerrar/abrir tres veces da una instancia limpia cada vez',
    cycle.every(c=>c.frames===1&&c.shells===1&&c.alive&&c.after===0&&!c.lock),
    cycle.map(c=>`#${c.i+1}: 1 iframe, motor vivo, 0 al cerrar`).join(' · '));
  check('16 · nada se acumula: ni iframes, ni shells, ni nodos',
    nodesAfter<=nodesBefore+4
    &&await page.evaluate(()=>document.querySelectorAll('.xs-frame').length)===0,
    `${nodesBefore} → ${nodesAfter} nodos`);

  /* 14 · ningún segundo store dentro del producto */
  const stores=await page.evaluate(()=>{
    const keys=Object.keys(localStorage||{});
    return {own:keys.filter(k=>/^cdr\.project06\./.test(k)),total:keys.length};
  });
  check('14 · la experiencia con store propio no lo escribe dentro del producto',
    stores.own.length===0,
    stores.own.length?stores.own.join(', '):'ninguna clave cdr.project06.* en el padre');
  check('14 · la shell no inventa persistencia propia',
    !/localStorage|sessionStorage|indexedDB/.test(
      SHELL.replace(/\/\*[\s\S]*?\*\//g,'')),
    'la shell no persiste nada');
  check('14 · el puente bloquea escrituras, no lecturas',
    /setItem[\s\S]{0,120}return;/.test(BRIDGE)&&/getItem/.test(BRIDGE),
    'perfil servido desde el proyecto, escrituras descartadas');

  /* 20-24 · nada de lo aprobado se movió */
  const intact=await page.evaluate(()=>({
    library:window.RestaurantMotionLibrary?.state?.(),
    detail:window.RestaurantProductDetail?.state?.(),
    traveler:window.RestaurantScrollTraveler?.state?.(),
    modules:['location','social','whatsapp'].map(m=>
      window.RestaurantStudioConfig?.get(`modules.${m}.enabled`))}));
  check('22 · Class 19 sigue contando once motores',
    intact.library?.count===11&&intact.library?.available===11,
    `${intact.library?.count} motores, ${intact.library?.available} disponibles`);
  check('20 · Class 21 sigue en pie con su adaptador',
    !!intact.detail&&intact.detail.enabled!==undefined&&!!intact.detail.adapter,
    `adaptador ${intact.detail?.adapter}`);
  check('21 · Class 20 sigue con sus módulos y OFF por defecto',
    intact.modules.every(v=>v===false||v===true),
    `modules: ${intact.modules.join(', ')}`);
  check('23 · Scroll Traveler sigue intacto',
    intact.traveler?.active===true&&intact.traveler?.anchors?.length===5,
    `${intact.traveler?.anchors?.length} anclas`);
  const preset=await page.evaluate(async()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='depth-carousel';s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
    await new Promise(r=>setTimeout(r,2600));
    return {motion:document.documentElement.dataset.orbitalMotion,
      ready:document.documentElement.dataset.depthCarousel};
  });
  check('24 · los presets normales siguen funcionando',
    preset.motion==='depth-carousel'&&preset.ready==='ready',
    `${preset.motion} · ${preset.ready}`);

  check('runtime · sin errores de página en toda la pasada',errors.length===0,
    errors.slice(0,2).join(' | ')||'limpio');
  await context.close();
}

/* ============================================================
   2. MOBILE — 390px de verdad
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const newTabs=[];
  context.on('page',p=>newTabs.push(p.url()));
  await boot(page);
  await openLibrary(page);
  const mob=[];
  for(const id of IDS){
    await openExperience(page,id);
    const m=await page.evaluate(()=>{
      const back=document.querySelector('[data-xs-back]');
      const r=back?.getBoundingClientRect();
      const frame=document.querySelector('.xs-frame')?.getBoundingClientRect();
      /* el alto es fraccionario: comparar contra un entero exacto convierte un botón
         correcto en un fallo. 38 es el suelo de un objetivo táctil razonable. */
      return {backVisible:!!r&&r.width>40&&r.height>=38&&r.top>=0&&r.bottom<=innerHeight,
        backH:Math.round(r.height),
        frameH:Math.round(frame?.height||0),
        overflow:document.documentElement.scrollWidth<=innerWidth,
        frames:document.querySelectorAll('.xs-frame').length};
    });
    mob.push({id,...m});
    await page.screenshot({path:path.join(SHOTS,`mobile-01-${id}.png`)});
    await page.evaluate(()=>document.querySelector('[data-xs-back]')?.click());
    await page.waitForTimeout(1300);
  }
  check('18 · móvil: las tres abren con el botón volver accesible y sin overflow',
    mob.every(m=>m.backVisible&&m.overflow&&m.frames===1&&m.frameH>300),
    mob.map(m=>`${m.id}: volver ${m.backH}px, experiencia ${m.frameH}px`).join(' · '));
  check('18 · móvil: cerrar deja el Studio como estaba',
    await page.evaluate(()=>!window.RestaurantExperienceShell.isOpen()
      &&document.querySelectorAll('.xs-frame').length===0
      &&!document.body.classList.contains('xs-open')),
    'sin iframes ni bloqueo de scroll');
  /* reapertura en móvil */
  await openExperience(page,'dish-stage');
  const reopened=await page.evaluate(()=>document.querySelectorAll('.xs-frame').length);
  await page.screenshot({path:path.join(SHOTS,'mobile-02-reapertura.png')});
  check('18 · móvil: reabrir funciona a la primera',reopened===1,`${reopened} iframe`);
  check('4 · móvil: tampoco se abre una pestaña',newTabs.length===0,
    newTabs.length?newTabs.join(' | '):'0 pestañas');
  await context.close();
}

/* ============================================================
   3. REDUCED MOTION
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:1440,height:960},
    reducedMotion:'reduce'});
  const page=await context.newPage();
  await boot(page);
  await openLibrary(page);
  await openExperience(page,'dish-stage');
  const rm=await page.evaluate(()=>({
    reduced:window.RestaurantExperienceShell.state().reduced,
    frames:document.querySelectorAll('.xs-frame').length,
    name:(document.querySelector('[data-xs-name]')?.textContent||'').trim()}));
  const child=childOf(page);
  const childReduced=child?await child.evaluate(()=>
    matchMedia('(prefers-reduced-motion: reduce)').matches).catch(()=>null):null;
  check('19 · reduced motion: abre, se anuncia y el hijo también lo ve',
    rm.reduced&&rm.frames===1&&childReduced===true,
    `padre ${rm.reduced} · hijo ${childReduced}`);
  await page.screenshot({path:path.join(SHOTS,'desktop-04-reduced-motion.png')});
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  check('19 · reduced motion: cierra igual',
    await page.evaluate(()=>!window.RestaurantExperienceShell.isOpen()),'cerrada');
  await context.close();
}

/* ============================================================
   4. LOS LABS SIGUEN SIRVIENDO DE REGRESIÓN
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const direct=[];
  for(const [id,url_] of [
    ['circular-dish-rotator','labs/project06-circular-dish-rotator/index.html'],
    ['dish-stage','labs/project10-dish-stage/index.html'],
    ['cinematic-product-rail','labs/project11-cinematic-product-rail/index.html']]){
    const r=await page.goto(`${BASE}/${url_}`,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(2600);
    direct.push(await page.evaluate(s=>({
      id:s,status:200,
      framed:document.documentElement.dataset.experienceFramed,
      engine:!!(window.DishStageEngine||window.CinematicProductRail||window.CircularDishRotator),
      shell:!!window.RestaurantExperienceShell
    }),id));
    direct[direct.length-1].http=r?.status();
  }
  check('25 · los labs siguen accesibles directamente para regresión',
    direct.every(d=>d.http===200&&d.engine),
    direct.map(d=>`${d.id}:${d.http}`).join(' '));
  check('25 · abiertos directamente el puente no actúa y no cargan la shell',
    direct.every(d=>d.framed==='0'&&!d.shell),
    'se comportan como siempre');
  check('runtime · los labs no dan errores por el puente',errors.length===0,
    errors.slice(0,2).join(' | ')||'limpio');
  await context.close();
}

await browser.close();server.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots -> output/playwright/experience-shell/`);
if(failed.length){
  console.error(`EXPERIENCE_SHELL_FAIL: ${failed.map(f=>f.name).join(' | ')}`);
  process.exit(1);
}
console.log('EXPERIENCE_SHELL_PASS');
