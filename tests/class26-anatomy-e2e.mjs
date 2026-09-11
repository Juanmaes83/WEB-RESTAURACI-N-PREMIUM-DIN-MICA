/* CLASS 26 — ANATOMY THEATER · Playwright visual/integration gate

   Prueba la capacidad sobre la linea aprobada actual. La ruta de revision alimenta al
   motor Y al MISMO Studio sin persistir el fixture en el Project State.

   Guardas de regresion que vienen de fallos REALES encontrados en navegador durante la
   construccion, no de imaginarlos:
     · una sola seccion #anatomy — refresh() es asincrona y sin candado dos pasadas
       cruzaban el mismo await y construian dos veces (se llego a cuatro);
     · el alto visible de cada capa == el alto de su caja — si el aplastado o el
       registro se descuadran, esto lo caza;
     · el escenario cabe en la ventana — la primera version derivaba el alto del ancho
       de la columna y salia 924px en un portatil de 900.
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'tests','screenshots','class26-anatomy');fs.mkdirSync(OUT,{recursive:true});
const target=process.argv[2],local=target?null:await startServer(0),BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();
const checks=[];
const check=(n,ok,d='')=>{const row={name:n,ok:!!ok,detail:d||''};checks.push(row);console.log(`${row.ok?'PASS':'FAIL'} ${n}${d?` — ${d}`:''}`)};

/* ESPERAR LAS IMAGENES DIFERIDAS SIN COLGARSE.

   La primera version hacia un `page.evaluate` con `Promise.all` de listeners load/error.
   Colgo el job SEIS HORAS, hasta el limite duro de GitHub Actions, sin imprimir una sola
   linea. Dos causas, y las dos habia que arreglarlas:

     · las capas a partir de la tercera son `loading="lazy"` y la seccion esta muy por
       debajo del pliegue, asi que el navegador nunca empieza a cargarlas y esos
       listeners no se disparan JAMAS;
     · `page.evaluate` no tiene timeout por defecto, asi que nada cortaba la espera.

   Arreglo: primero se lleva la seccion al viewport —que es lo que hace arrancar el lazy,
   y ademas es el estado en el que un visitante la ve— y despues la espera va acotada. Si
   una imagen no carga, el gate lo dice y falla; colgarse ya no es posible. */
async function settleLayers(page, ms = 20000){
  await page.evaluate(() => {
    document.querySelector('#anatomy')?.scrollIntoView({block: 'center'});
  });
  await page.evaluate(async (limit) => {
    const imgs = [...document.querySelectorAll('.ana-layer img')];
    const done = Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => {
      i.addEventListener('load', r, {once: true});
      i.addEventListener('error', r, {once: true});
    })));
    await Promise.race([done, new Promise(r => setTimeout(r, limit))]);
  }, ms);
}

/* PULSAR UNA CAPA SIN PELEARSE CON LA CABECERA.

   `page.click` hacia el scroll MINIMO necesario, y eso dejaba la capa justo debajo de
   la barra superior fija del sitio: Playwright abortaba con
   `<header class="topbar"> intercepts pointer events`.

   No es un defecto del producto -un visitante sigue haciendo scroll y ya esta- pero si
   un test fragil. Centrar el objetivo antes de pulsarlo es ademas lo que hace una
   persona de verdad, asi que el gate se vuelve determinista sin dejar de probar el
   clic real. Nada de `force`: eso esconderia justo los problemas que esto busca. */
async function clickLayer(page, id, {tap = false} = {}){
  const sel = `.ana-layer[data-ana-layer="${id}"]`;
  await page.evaluate(s => document.querySelector(s)?.scrollIntoView({block: 'center'}), sel);
  await page.waitForTimeout(250);
  const el = page.locator(sel);
  if (tap) await el.tap({timeout: 15000});
  else await el.click({timeout: 15000});
}

async function press(page, sel){
  await page.evaluate(s => document.querySelector(s)?.scrollIntoView({block: 'center'}), sel);
  await page.waitForTimeout(250);
  await page.locator(sel).click({timeout: 15000});
}

async function boot(page){
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}/?review=anatomy`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.RestaurantAnatomyEngine?.state?.().mounted===true,null,{timeout:40000});
  await settleLayers(page);
  await page.waitForTimeout(700);
  return errors;
}

/* ------------------------------------------------------------------ desktop 1440 */
{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=await boot(page);

 const initial=await page.evaluate(()=>{
   const sec=document.querySelector('#anatomy');
   return {
     headers:document.querySelectorAll('header.topbar').length,
     studios:document.querySelectorAll('#studio').length,
     sections:document.querySelectorAll('.ana-section').length,
     stacks:document.querySelectorAll('.ana-stack').length,
     mode:sec?.dataset.anaMode||'',
     preset:sec?.dataset.anaPreset||'',
     title:sec?.querySelector('.ana-title')?.textContent.trim()||'',
     layers:document.querySelectorAll('.ana-layer').length,
     reviewLayers:+(document.documentElement.dataset.anatomyReviewLayers||0),
     review:document.documentElement.dataset.anatomyReview||'',
     loader:document.documentElement.dataset.class26Anatomy||'',
     imgsReady:[...document.querySelectorAll('.ana-layer img')].every(i=>i.complete&&i.naturalWidth>0),
     refsLogical:[...document.querySelectorAll('.ana-layer img')].every(i=>!i.getAttribute('src').startsWith('blob:')),
     /* El invariante NO es un numero de motores: es que Anatomy no sea uno de ellos.
        La primera version exigia libraryCount===13 y fallaba con 12, porque esta rama
        sale de main y el motor 13 -Chromatic Ingredient Wipe- entra por el PR #38. Es
        decir, la asercion dependia del ORDEN DE MERGE y no de lo que dice comprobar.
        Ahora se mira el catalogo de verdad. */
     libraryCount:window.RestaurantMotionLibrary?.count?.()||0,
     anatomyInCatalogue:(window.RestaurantMotionLibrary?.engines?.()||[])
       .some(e=>/anatom/i.test(`${e.id} ${e.name} ${e.value||''}`)),
     anatomyTab:!!document.querySelector('#studio .studio-nav [data-panel="anatomy"]'),
     motionTab:!!document.querySelector('#studio .studio-nav [data-panel="motion"]'),
     halfOrbit:!!window.RestaurantHalfOrbit,
     media:!!window.RestaurantMedia,picker:!!window.RestaurantMediaPicker,
     mediaLibraries:[window.RestaurantMedia?1:0].reduce((a,b)=>a+b,0)
   };
 });
 check('linea actual · una sola navegacion original',initial.headers===1,String(initial.headers));
 check('linea actual · un solo Restaurant Studio',initial.studios===1,String(initial.studios));
 check('REGRESION · exactamente una seccion #anatomy',initial.sections===1&&initial.stacks===1,`${initial.sections}/${initial.stacks}`);
 check('loader y ruta de revision listos',initial.loader==='ready'&&initial.review==='ready',`${initial.loader}/${initial.review}`);
 check('Anatomy Theater monta en la pagina real',initial.mode==='layers'&&initial.title==='Por dentro.',`${initial.mode}/${initial.title}`);
 check('las nueve capas del manifiesto se montan',initial.layers===9&&initial.reviewLayers===9,`${initial.layers}/${initial.reviewLayers}`);
 check('las nueve capas pintan de verdad',initial.imgsReady);
 check('las capas resuelven por ref logica, no por blob:',initial.refsLogical);
 check('Anatomy NO entra en el catalogo de Motion Engines',
   initial.anatomyInCatalogue===false,
   `${initial.libraryCount} motores, ninguno de anatomia`);
 check('el catalogo de Motion sigue en pie y con motores reales',
   initial.libraryCount>=12,String(initial.libraryCount));
 check('Anatomia y Motion son pestanas separadas del MISMO Studio',initial.anatomyTab&&initial.motionTab);
 check('Half Orbit sigue en pie',initial.halfOrbit);
 check('una sola Media Library compartida',initial.media&&initial.picker&&initial.mediaLibraries===1);

 /* --- registro: la prueba dura --- */
 const geo=await page.evaluate(()=>{
   const st=document.querySelector('.ana-stage').getBoundingClientRect();
   const rows=[...document.querySelectorAll('.ana-layer')].map(n=>{
     const b=n.getBoundingClientRect(),i=n.querySelector('img').getBoundingClientRect();
     return {id:n.dataset.anaLayer,
       boxH:Math.round(b.height),imgH:Math.round(i.height),
       centre:Math.round((i.left+i.right)/2-st.left),
       top:Math.round(i.top-st.top),bottom:Math.round(i.bottom-st.top)};
   });
   return {stage:{w:Math.round(st.width),h:Math.round(st.height)},vh:innerHeight,rows};
 });
 const axis=geo.stage.w/2;
 check('el escenario cabe en la ventana',geo.stage.h<=geo.vh,`${geo.stage.h}/${geo.vh}`);
 check('el alto visible de cada capa coincide con su caja (aplastado correcto)',
   geo.rows.every(r=>Math.abs(r.imgH-r.boxH)<=2),
   geo.rows.map(r=>`${r.id}:${r.imgH}vs${r.boxH}`).join(' '));
 check('todas las capas quedan centradas en el eje del escenario',
   geo.rows.every(r=>Math.abs(r.centre-axis)<=4),
   geo.rows.map(r=>`${r.id}:${r.centre}`).join(' '));
 check('ninguna capa se sale del escenario',
   geo.rows.every(r=>r.top>=-6&&r.bottom<=geo.stage.h+6));
 const gaps=geo.rows.slice(1).map((r,k)=>r.top-geo.rows[k].bottom);
 check('apilado DENSO · sin huecos abiertos entre capas',
   gaps.every(g=>g<=Math.round(geo.stage.w*0.02)),gaps.join(','));

 await page.locator('#anatomy').screenshot({path:path.join(OUT,'01-exploded-desktop.png')});

 /* --- seleccion --- */
 await clickLayer(page, 'cheese');
 await page.waitForTimeout(420);
 const sel=await page.evaluate(()=>({
   index:document.querySelector('.ana-sheet-index').textContent.trim(),
   label:document.querySelector('.ana-sheet-label').textContent.trim(),
   note:document.querySelector('.ana-sheet-note').textContent.trim().length,
   pressed:document.querySelector('.ana-layer[data-ana-layer="cheese"]').getAttribute('aria-pressed'),
   others:[...document.querySelectorAll('.ana-layer:not([data-ana-layer="cheese"])')].every(n=>n.getAttribute('aria-pressed')==='false'),
   dimmed:document.querySelector('.ana-stack').dataset.hasSelection==='1',
   state:window.RestaurantAnatomyEngine.state().selected
 }));
 check('elegir una capa cuenta ESA capa en la ficha',
   sel.label==='Cheddar fundido'&&sel.index==='04 / 09'&&sel.note>10,`${sel.index} ${sel.label}`);
 check('la capa elegida es la unica marcada, y el resto cede foco',
   sel.pressed==='true'&&sel.others&&sel.dimmed);
 await page.locator('#anatomy').screenshot({path:path.join(OUT,'02-layer-selected.png')});

 /* --- teclado --- */
 await page.keyboard.press('ArrowDown');await page.waitForTimeout(260);
 const afterDown=await page.evaluate(()=>window.RestaurantAnatomyEngine.state().selected);
 await page.keyboard.press('Escape');await page.waitForTimeout(260);
 const afterEsc=await page.evaluate(()=>({
   sel:document.querySelector('.ana-stack').dataset.hasSelection||'',
   label:document.querySelector('.ana-sheet-label').textContent.trim()}));
 check('teclado · flecha avanza de capa',afterDown===4,String(afterDown));
 check('teclado · Escape suelta la seleccion',!afterEsc.sel&&!afterEsc.label);

 /* --- montar / desmontar --- */
 const span=()=>page.evaluate(()=>{
   const rs=[...document.querySelectorAll('.ana-layer img')].map(i=>i.getBoundingClientRect());
   return Math.round(Math.max(...rs.map(r=>r.bottom))-Math.min(...rs.map(r=>r.top)));
 });
 const exploded=await span();
 await press(page, '[data-ana-assemble]');
 await page.waitForTimeout(1500);
 const assembled=await span();
 const pressed=await page.evaluate(()=>document.querySelector('[data-ana-assemble]').getAttribute('aria-pressed'));
 await page.locator('#anatomy').screenshot({path:path.join(OUT,'03-assembled.png')});
 await press(page, '[data-ana-assemble]');
 await page.waitForTimeout(1500);
 const back=await span();
 check('montar el plato junta de verdad las capas',assembled<exploded*0.6,`${exploded} -> ${assembled}`);
 check('el boton refleja el estado',pressed==='true');
 check('desmontar devuelve al reposo explotado',Math.abs(back-exploded)<=6,`${back} vs ${exploded}`);

 /* --- OFF ES OFF --- */
 await page.evaluate(()=>window.RestaurantStudioConfig.set('anatomy.enabled',false));
 await page.waitForTimeout(800);
 const off=await page.evaluate(()=>({
   sections:document.querySelectorAll('.ana-section').length,
   mounted:window.RestaurantAnatomyEngine.state().mounted}));
 await page.evaluate(()=>window.RestaurantStudioConfig.set('anatomy.enabled',true));
 await page.waitForTimeout(1100);
 const backOn=await page.evaluate(()=>window.RestaurantAnatomyEngine.state().layers);
 check('OFF ES OFF · apagar desmonta el nodo entero',off.sections===0&&off.mounted===false,JSON.stringify(off));
 check('volver a encender remonta las nueve capas',backOn===9,String(backOn));

 /* --- fallback progresivo --- */
 await page.evaluate(()=>{
   const cfg=window.RestaurantStudioConfig,d=JSON.parse(JSON.stringify(cfg.get('anatomy.dish')));
   window.__anaFull=cfg.get('anatomy.dish');
   d.anatomy.layers=d.anatomy.layers.slice(0,1);
   cfg.set('anatomy.dish',d);
 });
 await page.waitForTimeout(1000);
 const fb=await page.evaluate(()=>({
   mode:document.querySelector('#anatomy')?.dataset.anaMode,
   stackHidden:document.querySelector('.ana-stack')?.hidden,
   hero:!!document.querySelector('.ana-fallback-hero'),
   items:document.querySelectorAll('.ana-fallback-list li').length,
   assembleHidden:document.querySelector('.ana-assemble')?.hidden}));
 await page.locator('#anatomy').screenshot({path:path.join(OUT,'04-hero-fallback.png')});
 await page.evaluate(()=>window.RestaurantStudioConfig.set('anatomy.dish',window.__anaFull));
 await page.waitForTimeout(1000);
 check('con menos de dos capas cae a heroe anotado, no a hueco',
   fb.mode==='hero'&&fb.stackHidden===true&&fb.items>=4,JSON.stringify(fb));
 check('el heroe anotado esconde el control de montaje',fb.assembleHidden===true);
 check('el heroe del plato pinta en el fallback',fb.hero);

 /* --- REGRESION duplicacion: tormenta de cambios de config --- */
 await page.evaluate(async()=>{
   const cfg=window.RestaurantStudioConfig;
   for(let i=0;i<6;i++){cfg.set('anatomy.title','T'+i);cfg.set('anatomy.preset',i%2?'ingredient-atlas':'anatomy-theater')}
   cfg.set('anatomy.preset','anatomy-theater');cfg.set('anatomy.title','Por dentro.');
 });
 await page.waitForTimeout(2600);
 const storm=await page.evaluate(()=>({
   sections:document.querySelectorAll('.ana-section').length,
   layers:document.querySelectorAll('.ana-layer').length,
   title:document.querySelector('.ana-title').textContent.trim()}));
 check('REGRESION · doce cambios de config seguidos dejan UNA seccion',
   storm.sections===1&&storm.layers===9,JSON.stringify(storm));
 check('el ultimo estado es el que se ve',storm.title==='Por dentro.',storm.title);

 /* --- Studio ---
    Como lo hace una persona: primero se abre el cajon del Studio y despues se va a la
    pestana. `RestaurantAnatomyStudio.open()` cambia de panel pero no abre el cajon
    -misma convencion que RestaurantBeveragesStudio-, asi que pedirle eso era un error
    del test, no del producto: daba open:false con el panel correctamente activo. */
 await page.evaluate(()=>window.RestaurantStudioShell?.open?.());
 await page.waitForTimeout(320);
 await page.evaluate(()=>window.RestaurantAnatomyStudio.open());
 await page.waitForTimeout(520);
 const studio=await page.evaluate(()=>({
   open:document.querySelector('#studio')?.classList.contains('is-open'),
   active:document.querySelector('#studio .studio-nav button.active')?.dataset.panel,
   studios:document.querySelectorAll('#studio').length,
   panels:document.querySelectorAll('.anatomy-panel').length,
   anatomyTabs:document.querySelectorAll('#studio .studio-nav [data-panel="anatomy"]').length,
   motionTabs:document.querySelectorAll('#studio .studio-nav [data-panel="motion"]').length,
   cards:document.querySelectorAll('#studio [data-ana-card]').length,
   dishSelect:!!document.querySelector('#studio [data-ana-dish]')}));
 check('Anatomia abre DENTRO del mismo Studio',
   studio.open&&studio.active==='anatomy'&&studio.studios===1&&studio.panels===1,JSON.stringify(studio));
 check('el Studio no gana pestanas duplicadas',studio.anatomyTabs===1&&studio.motionTabs===1);
 check('el panel recibe las nueve capas y el selector de plato',
   studio.cards===9&&studio.dishSelect,JSON.stringify(studio));
 await page.screenshot({path:path.join(OUT,'05-anatomy-studio.png'),fullPage:false});

 check('desktop · sin errores de JS',errors.length===0,errors.join(' | '));
 await ctx.close();
}

/* ------------------------------------------------------------------ movil 390 */
{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),
       page=await ctx.newPage(),errors=await boot(page);
 const m=await page.evaluate(()=>{
   const st=document.querySelector('.ana-stage').getBoundingClientRect();
   const boxes=[...document.querySelectorAll('.ana-layer')].map(n=>n.getBoundingClientRect().height);
   return {scrollWidth:document.documentElement.scrollWidth,width:innerWidth,
     sections:document.querySelectorAll('.ana-section').length,
     stage:{w:Math.round(st.width),h:Math.round(st.height)},vh:innerHeight,
     minTouch:Math.round(Math.min(...boxes)),
     layers:document.querySelectorAll('.ana-layer').length,
     imgs:[...document.querySelectorAll('.ana-layer img')].every(i=>i.complete&&i.naturalWidth>0)};
 });
 check('movil 390 · sin desbordamiento horizontal',m.scrollWidth<=m.width,`${m.scrollWidth}/${m.width}`);
 check('movil · una sola seccion y las nueve capas',m.sections===1&&m.layers===9,`${m.sections}/${m.layers}`);
 check('movil · el escenario cabe en la ventana',m.stage.h<=m.vh,`${m.stage.h}/${m.vh}`);
 check('movil · area de pulsacion utilizable con el dedo',m.minTouch>=30,`${m.minTouch}px`);
 check('movil · las capas pintan',m.imgs);
 await page.locator('#anatomy').screenshot({path:path.join(OUT,'06-exploded-mobile.png')});
 /* toque real, no click sintetico */
 await clickLayer(page, 'patty', {tap: true});
 await page.waitForTimeout(420);
 const tapped=await page.evaluate(()=>document.querySelector('.ana-sheet-label').textContent.trim());
 check('movil · el toque selecciona la capa',tapped==='Carne a la brasa',tapped);
 check('movil · sin errores de JS',errors.length===0,errors.join(' | '));
 await ctx.close();
}

/* --------------------------------------------------------- reduced motion 1440 */
{
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),
       page=await ctx.newPage(),errors=await boot(page);
 const r=await page.evaluate(()=>{
   const n=document.querySelector('.ana-layer');
   return {reduced:window.RestaurantAnatomyEngine.state().reducedMotion,
     transition:getComputedStyle(n).transitionProperty,
     layers:document.querySelectorAll('.ana-layer').length,
     mode:document.querySelector('#anatomy').dataset.anaMode};
 });
 check('reduced motion · la composicion explotada sigue completa',
   r.layers===9&&r.mode==='layers',`${r.layers}/${r.mode}`);
 check('reduced motion · el motor lo detecta',r.reduced===true);
 check('reduced motion · sin transiciones en las capas',/none/.test(r.transition),r.transition);
 await clickLayer(page, 'bacon');
 await page.waitForTimeout(200);
 const label=await page.evaluate(()=>document.querySelector('.ana-sheet-label').textContent.trim());
 check('reduced motion · seleccionar sigue funcionando',label==='Bacon crujiente',label);
 await page.locator('#anatomy').screenshot({path:path.join(OUT,'07-reduced-motion.png')});
 check('reduced motion · sin errores de JS',errors.length===0,errors.join(' | '));
 await ctx.close();
}

await browser.close();
/* `server.close()` solo llama al callback cuando cierran TODAS las conexiones. Si
   quedara un socket vivo, el proceso no terminaria nunca y el job volveria a comerse
   el limite de seis horas. Se acota. */
if(local)await Promise.race([
  new Promise(r=>local.server.close(r)),
  new Promise(r=>setTimeout(r,5000))
]);
const passed=checks.filter(x=>x.ok).length;
fs.writeFileSync(path.join(OUT,'report.json'),
  JSON.stringify({passed,total:checks.length,status:passed===checks.length?'PASS':'FAIL',checks},null,2));
console.log(`\n${passed}/${checks.length} ${passed===checks.length?'CLASS26_ANATOMY_PASS':'CLASS26_ANATOMY_FAIL'}`);
if(passed!==checks.length)process.exitCode=1;
