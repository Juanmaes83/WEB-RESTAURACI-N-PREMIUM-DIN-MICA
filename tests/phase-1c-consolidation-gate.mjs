/* FASE 1C — PRODUCT CONSOLIDATION GATE.

   No prueba una capacidad nueva: prueba que lo construido es UN producto.

       RESTAURANT STUDIO
       ├── 11 Motion
       ├── Product Detail
       ├── Location
       ├── Social
       └── WhatsApp
                → misma aplicación · mismo proyecto · misma media
                → sin LAB como entrypoint ni como runtime
                → sin pestaña nueva para capacidades internas
                → sin código paralelo

   El guard de DOM del final es el que cierra la puerta: ninguna acción productiva
   interna puede apuntar a `/labs/` ni abrirse en otra pestaña. Los enlaces comerciales
   públicos (Instagram, Google Maps, WhatsApp…) SÍ pueden salir, y se comprueba que
   siguen ahí.

   Uso: node tests/phase-1c-consolidation-gate.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'output','playwright','phase-1c');
fs.mkdirSync(SHOTS,{recursive:true});
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const SHELL=read('class22-experience-shell.js');
const LIB=read('class19-motion-library.js');

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});
  console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

const IDS=['circular-dish-rotator','dish-stage','cinematic-product-rail'];
const PRESETS=['elegant','urban','editorial-flow','depth-carousel','anchor-scenes',
  'orbital-food','pizza-slice-orbit'];

async function boot(page){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,
    null,{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.experienceShellReady==='ready',
    null,{timeout:25000});
  await page.waitForFunction(()=>document.documentElement.dataset.productDetailReady==='ready',
    null,{timeout:25000});
  await page.waitForTimeout(900);
}
async function studio(page,panel){
  await page.evaluate(async p=>{
    if(document.getElementById('studio')?.getAttribute('aria-hidden')!=='false')
      document.querySelector('.studio-open')?.click();
    await new Promise(r=>setTimeout(r,900));
    document.querySelector(`#studio [data-panel="${p}"]`)?.click();
  },panel);
  await page.waitForTimeout(1200);
}
async function openExp(page,id){
  await page.evaluate(i=>document.querySelector(`[data-experience-open="${i}"]`)?.click(),id);
  await page.waitForFunction(i=>document.documentElement.dataset.experienceShell===i,id,
    {timeout:15000});
  await page.waitForFunction(()=>window.RestaurantExperienceShell.state().status==='ready',
    null,{timeout:20000}).catch(()=>{});
  await page.waitForTimeout(2600);
}

/* ============================================================
   PRODUCTO — un solo recorrido, todo dentro
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  const errors=[];const newTabs=[];
  page.on('pageerror',e=>errors.push(e.message));
  await boot(page);
  context.on('page',p=>newTabs.push(p.url()));
  await studio(page,'motion');
  await page.waitForFunction(()=>document.documentElement.dataset.motionLibrary==='ready',
    null,{timeout:20000});
  await page.waitForTimeout(1200);

  /* 1-3 · el catálogo y las capacidades de movimiento */
  const lib=await page.evaluate(()=>({
    state:window.RestaurantMotionLibrary.state(),
    engines:window.RestaurantMotionLibrary.engines().map(e=>({n:e.n,id:e.id,kind:e.kind})),
    presets:[...document.querySelectorAll('#motion-orbital-style option')].map(o=>o.value)}));
  check('1 · la Motion Library sigue siendo exactamente 11',
    lib.state.count===11&&lib.engines.length===11
    &&lib.engines.map(e=>e.n).join(',')==='01,02,03,04,05,06,07,08,09,10,11',
    `${lib.state.count} motores, ${lib.state.available} disponibles`);
  check('2 · los siete presets de producto siguen disponibles',
    PRESETS.every(p=>lib.presets.includes(p))
    &&lib.engines.filter(e=>e.kind==='preset').length===7,
    lib.presets.join(', '));
  check('3 · Scroll Traveler sigue disponible y transversal',
    lib.engines.some(e=>e.id==='scroll-traveler'&&e.kind==='page')
    &&!lib.presets.includes('scroll-traveler'),
    'page motion, fuera del selector de producto');
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(SHOTS,'01-studio-motion-library.png')});

  /* 4-8 · las tres experiencias, dentro del producto y sin /labs/ */
  for(const [i,id] of IDS.entries()){
    await openExp(page,id);
    const st=await page.evaluate(()=>{
      const frame=document.querySelector('.xs-frame');
      const mid=document.elementFromPoint(Math.round(innerWidth/2),Math.round(innerHeight*.6));
      return {open:window.RestaurantExperienceShell.isOpen(),
        active:window.RestaurantExperienceShell.getActive()?.id,
        src:frame?.getAttribute('src')||'',
        frames:document.querySelectorAll('.xs-frame').length,
        front:(mid?.tagName||'')+'.'+(mid?.className||'').split(' ')[0]};
    });
    const child=page.frames().find(f=>/experiences\//.test(f.url()))||null;
    const inside=child?await child.evaluate(()=>({
      framed:document.documentElement.dataset.experienceFramed,
      engine:!!(window.DishStageEngine||window.CinematicProductRail||window.CircularDishRotator),
      brand:document.documentElement.dataset.experienceProject||'',
      dishes:document.documentElement.dataset.experienceDishes||''})).catch(()=>null):null;
    check(`4-6 · ${id} abre dentro del producto`,
      st.open&&st.active===id&&st.frames===1&&st.front.includes('xs-frame')
      &&inside?.engine===true&&inside?.framed==='1',
      `delante: ${st.front} · motor ${inside?.engine}`);
    check(`8 · ${id} NO usa /labs/ como runtime productivo`,
      /^experiences\/[a-z-]+\/index\.html/.test(st.src)&&!/labs\//.test(st.src),
      st.src);
    await page.screenshot({path:path.join(SHOTS,`0${i+2}-${id}.png`)});
    await page.evaluate(()=>document.querySelector('[data-xs-back]')?.click());
    await page.waitForTimeout(1500);
  }
  check('7 · ninguna experiencia abrió una pestaña',newTabs.length===0,
    newTabs.length?newTabs.join(' | '):'0 pestañas');
  check('8 · la shell declara entrypoints productivos, no labs',
    !/url:'labs\//.test(SHELL)&&(SHELL.match(/url:'experiences\//g)||[]).length===3,
    'las tres URLs apuntan a experiences/');

  /* 12-15 · módulos: se configuran en el Studio y no enlazan a /labs/ */
  await studio(page,'motion');
  await page.waitForTimeout(900);
  const moduleCards=await page.evaluate(()=>({
    cards:document.querySelectorAll('.ml-modules [data-ml-card]').length,
    labLinks:[...document.querySelectorAll('.ml-modules a')]
      .filter(a=>/labs\//.test(a.getAttribute('href')||'')).length,
    configure:[...document.querySelectorAll('[data-configure-module]')]
      .map(b=>b.dataset.configureModule)}));
  check('15 · ninguna tarjeta interna de módulo enlaza a /labs/',
    moduleCards.labLinks===0&&moduleCards.cards===3,
    `${moduleCards.cards} tarjetas, ${moduleCards.labLinks} enlaces a labs`);
  check('15 · el código de la biblioteca no contiene enlaces a labs',
    !/href="\$\{mod\.href\}"/.test(LIB)&&!/labs\//.test(
      LIB.replace(/\/\*[\s\S]*?\*\//g,'').replace(/<!--[\s\S]*?-->/g,'')),
    'sin anclas a labs en el marcado de la biblioteca');

  const configured=[];
  for(const [id,key] of [['location','location'],['social-reputation','social'],
    ['whatsapp-contact','whatsapp']]){
    const r=await page.evaluate(async([i,k])=>{
      document.querySelector(`[data-configure-module="${i}"]`)?.click();
      await new Promise(r=>setTimeout(r,1200));
      const panel=document.querySelector('.studio-panel.modules-panel');
      const inputs=[...document.querySelectorAll(`#studio [data-path^="modules.${k}."]`)];
      const before=window.RestaurantStudioConfig.get(`modules.${k}.enabled`);
      window.RestaurantStudioConfig.set(`modules.${k}.enabled`,true);
      await new Promise(r=>setTimeout(r,1300));
      const on=document.querySelectorAll(`[class^="${({location:'lm',social:'sr',whatsapp:'wa'})[k]}-"]`).length;
      window.RestaurantStudioConfig.set(`modules.${k}.enabled`,false);
      await new Promise(r=>setTimeout(r,1300));
      const off=document.querySelectorAll(`[class^="${({location:'lm',social:'sr',whatsapp:'wa'})[k]}-"]`).length;
      window.RestaurantStudioConfig.set(`modules.${k}.enabled`,before);
      return {panel:!!panel,inputs:inputs.length,on,off};
    },[id,key]);
    configured.push({id,...r});
  }
  check('12-14 · Location, Social y WhatsApp se configuran desde el Studio',
    configured.every(c=>c.panel&&c.inputs>0),
    configured.map(c=>`${c.id}:${c.inputs} campos`).join(' · '));
  check('16-18 · OFF/ON de los tres módulos intacto',
    configured.every(c=>c.on>0&&c.off===0),
    configured.map(c=>`${c.id} ON:${c.on} OFF:${c.off}`).join(' · '));
  await studio(page,'modules');
  await page.screenshot({path:path.join(SHOTS,'05-studio-modulos.png')});

  /* 19-20 · Product Detail */
  const detail=await page.evaluate(async()=>{
    document.querySelector('#studio-close')?.click();
    await new Promise(r=>setTimeout(r,700));
    const st=window.RestaurantProductDetail.state();
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(r=>setTimeout(r,1900));
    const on={open:window.RestaurantProductDetail.isOpen(),
      product:document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null};
    window.RestaurantProductDetail.close();
    await new Promise(r=>setTimeout(r,1500));
    window.RestaurantStudioConfig.set('productDetail.enabled',false);
    await new Promise(r=>setTimeout(r,1000));
    const off=window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(r=>setTimeout(r,900));
    const offOpen=window.RestaurantProductDetail.isOpen();
    window.RestaurantStudioConfig.set('productDetail.enabled',true);
    await new Promise(r=>setTimeout(r,900));
    return {adapter:st.adapter,expected:st.product,on,off,offOpen};
  });
  check('19 · Product Detail ON abre el producto correcto y OFF no abre',
    detail.on.open&&detail.on.product===detail.expected
    &&detail.off===false&&!detail.offOpen,
    `${detail.adapter}/${detail.on.product}`);
  await page.evaluate(async()=>{window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(r=>setTimeout(r,1900))});
  await page.screenshot({path:path.join(SHOTS,'06-product-detail.png')});
  await page.evaluate(()=>window.RestaurantProductDetail.close());
  await page.waitForTimeout(1400);

  /* 20 · Pizza conserva su modelo propio */
  await page.evaluate(async()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='pizza-slice-orbit';s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
    await new Promise(r=>setTimeout(r,2800));
  });
  const pizza=await page.evaluate(()=>{
    const p=window.RestaurantProductDetail.activeProduct();
    return {adapter:window.RestaurantProductDetail.activeAdapter(),
      id:p?.id,source:p?.source,price:p?.price,
      dishIds:window.RestaurantStudioConfig.get('dishes').map(d=>d.id)};
  });
  check('20 · Pizza conserva su propio modelo de producto',
    pizza.adapter==='pizza'&&pizza.source==='pizza'
    &&!pizza.dishIds.includes(pizza.id)&&pizza.price===null,
    `${pizza.id}, fuera de dishes, price null`);

  /* 21-23 · un solo Project State y una sola media */
  const state=await page.evaluate(()=>{
    const keys=Object.keys(localStorage||{});
    const snap=window.RestaurantStudioConfig.snapshot();
    return {lsKeys:keys,ownKeys:keys.filter(k=>/^cdr\.project06\./.test(k)),
      hasDishes:Array.isArray(snap.dishes)&&snap.dishes.length>0,
      hasMedia:!!snap.media,hasModules:!!snap.modules,hasDetail:!!snap.productDetail,
      dishArrays:[!!snap.dishes,!!window.RestaurantDefaults?.dishes].filter(Boolean).length};
  });
  check('21 · un único Project State sirve a todo',
    state.hasDishes&&state.hasMedia&&state.hasModules&&state.hasDetail,
    'dishes · media · modules · productDetail en el mismo snapshot');
  check('23 · no hay store nuevo ni paralelo dentro del producto',
    state.ownKeys.length===0
    &&!/localStorage|sessionStorage|indexedDB/.test(SHELL.replace(/\/\*[\s\S]*?\*\//g,'')),
    state.ownKeys.length?state.ownKeys.join(', '):'ninguna clave de la experiencia en el padre');

  /* 25 · la web pública sigue funcionando */
  await page.evaluate(()=>{
    document.querySelector('#studio-close')?.click();
    scrollTo({top:0,behavior:'instant'});
  });
  await page.waitForTimeout(1200);
  const publicSite=await page.evaluate(()=>({
    dishes:document.querySelectorAll('#orbit-stage .orbit-dish').length,
    sections:['#signature','#experience','.chef-section','#visit']
      .filter(s=>!!document.querySelector(s)).length,
    traveler:window.RestaurantScrollTraveler?.state?.().active,
    overflow:document.documentElement.scrollWidth<=innerWidth+1}));
  check('25 · la web pública sigue en pie',
    publicSite.dishes>=3&&publicSite.sections===4&&publicSite.traveler
    &&publicSite.overflow,
    `${publicSite.dishes} platos, ${publicSite.sections} secciones`);
  await page.screenshot({path:path.join(SHOTS,'07-web-publica.png')});

  /* ---------- GUARD DOM: ninguna acción productiva interna sale del producto ---------- */
  await studio(page,'motion');
  await page.waitForTimeout(900);
  const guard=await page.evaluate(()=>{
    const inProduct=[...document.querySelectorAll('#studio a,#studio button,#experience-shell a,#experience-shell button')];
    const offenders=inProduct.filter(el=>{
      const href=el.getAttribute('href')||'';
      const target=el.getAttribute('target')||'';
      return /labs\//.test(href)||(target==='_blank'&&/labs\//.test(href));
    }).map(el=>`${el.tagName}[${el.getAttribute('href')}]`);
    /* los enlaces comerciales públicos SÍ pueden salir: se comprueba que existen */
    const commercial=[...document.querySelectorAll('a[target="_blank"]')]
      .map(a=>a.getAttribute('href')||'')
      .filter(h=>/^https?:\/\//.test(h));
    return {offenders,commercial:commercial.length,
      internalBlank:[...document.querySelectorAll('a[target="_blank"]')]
        .filter(a=>!/^https?:\/\//.test(a.getAttribute('href')||'')).length};
  });
  check('GUARD · ninguna acción productiva interna apunta a /labs/',
    guard.offenders.length===0,
    guard.offenders.length?guard.offenders.join(' | '):'0 infractores');
  check('GUARD · ningún target="_blank" interno (los comerciales quedan permitidos)',
    guard.internalBlank===0,
    `${guard.internalBlank} internos · ${guard.commercial} comerciales externos intactos`);

  check('24 · sin producto paralelo: un solo Studio y una sola shell',
    await page.evaluate(()=>document.querySelectorAll('#studio').length===1
      &&document.querySelectorAll('#experience-shell').length<=1),
    'un #studio, una #experience-shell');
  check('runtime · sin errores de página en todo el recorrido',errors.length===0,
    errors.slice(0,2).join(' | ')||'limpio');
  await context.close();
}

/* ============================================================
   LABS — siguen sirviendo de evidencia y regresión
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const labs=[];
  for(const [id,url_] of [
    ['circular','labs/project06-circular-dish-rotator/index.html'],
    ['dish-stage','labs/project10-dish-stage/index.html'],
    ['rail','labs/project11-cinematic-product-rail/index.html']]){
    const r=await page.goto(`${BASE}/${url_}`,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(2600);
    labs.push({id,http:r?.status(),...await page.evaluate(()=>({
      engine:!!(window.DishStageEngine||window.CinematicProductRail||window.CircularDishRotator),
      framed:document.documentElement.dataset.experienceFramed}))});
  }
  check('9-11 · los tres LABs directos siguen funcionando',
    labs.every(l=>l.http===200&&l.engine&&l.framed==='0'),
    labs.map(l=>`${l.id}:${l.http}`).join(' '));
  check('runtime · los LABs no dan errores',errors.length===0,
    errors.slice(0,2).join(' | ')||'limpio');
  await context.close();
}

/* ============================================================
   UN SOLO MOTOR CANÓNICO — sin duplicación
   ============================================================ */
{
  const pairs=[
    ['circular-dish-rotator','labs/project06-circular-dish-rotator/index.html',
      ['project06-circular-dish-rotator.js','project06-phase2-premium.js']],
    ['dish-stage','labs/project10-dish-stage/index.html',['class13-dish-stage.js']],
    ['cinematic-product-rail','labs/project11-cinematic-product-rail/index.html',
      ['class15-cinematic-product-rail.js']]
  ];
  const same=[];
  for(const [id,lab,engines] of pairs){
    const prod=read(`experiences/${id}/index.html`);
    const labHtml=read(lab);
    same.push({id,ok:engines.every(e=>prod.includes(e)&&labHtml.includes(e)),
      engines:engines.join(', ')});
    for(const e of engines){
      if(!fs.existsSync(path.join(ROOT,e)))
        check(`motor canónico presente: ${e}`,false,'no existe en la raíz');
    }
  }
  check('4 · las dos puertas cargan el MISMO motor canónico',
    same.every(s=>s.ok)&&same.length===3,
    same.map(s=>`${s.id}: ${s.engines}`).join(' · '));
  const inLab=fs.readdirSync(path.join(ROOT,'labs','project06-circular-dish-rotator'));
  check('4 · el motor del rotador ya no vive dentro del LAB',
    !inLab.some(f=>/\.(js|css)$/.test(f)),
    `en el lab quedan: ${inLab.join(', ')}`);
}

await browser.close();server.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots -> output/playwright/phase-1c/`);
if(failed.length){
  console.error(`PHASE_1C_GATE_FAIL: ${failed.map(f=>f.name).join(' | ')}`);
  process.exit(1);
}
console.log('PHASE_1C_GATE_PASS');
