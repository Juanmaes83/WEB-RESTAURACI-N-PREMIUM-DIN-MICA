/* CLASS 21 — UNIFIED PRODUCT DETAIL contract.

   La ficha es del Product Engine, así que lo que se prueba no es "un modal se abre":

     · ON abre y OFF devuelve exactamente la navegación anterior;
     · abre el producto CORRECTO, y un producto lateral navega primero;
     · el motor no cambia su geometría por tener ficha;
     · una sola ficha, nunca dos a la vez;
     · un único Project State: persistencia, import/export y undo/redo;
     · Pizza usa su propio modelo y no se convierte en un plato normal;
     · un campo que el producto no tiene se oculta, no se inventa;
     · accesibilidad: Escape, botón, foco que vuelve;
     · y Scroll Traveler no se entera de nada.

   Uso: node tests/class21-unified-product-detail-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'output','playwright','product-detail');
fs.mkdirSync(SHOTS,{recursive:true});
const SRC=fs.readFileSync(path.join(ROOT,'class21-unified-product-detail.js'),'utf8');
const CODE=SRC.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^[ \t]*\/\/.*$/gm,'');

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});
  console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};
const near=(a,b,t)=>Math.abs(a-b)<=t;

async function boot(page,{reduced=false}={}){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,
    null,{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.productDetailReady==='ready',
    null,{timeout:25000});
  await page.waitForTimeout(900);
}
const state=page=>page.evaluate(()=>window.RestaurantProductDetail.state());
const settle=(page,ms=1600)=>page.waitForTimeout(ms);
async function selectPreset(page,value,flag){
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
  await page.waitForTimeout(1200);
}

/* ============================================================
   1. DESKTOP — contrato, ON/OFF, producto correcto, motor intacto
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await boot(page);

  const s0=await state(page);
  check('contrato · la capacidad arranca y elige adaptador',
    s0.ready&&s0.adapter==='orbit',`adaptador ${s0.adapter}`);
  check('contrato · expone open/close/isOpen y nada más que haga falta',
    await page.evaluate(()=>['open','close','isOpen']
      .every(k=>typeof window.RestaurantProductDetail[k]==='function')),
    'RestaurantProductDetail.open/close/isOpen');
  /* el orden es el contrato: gana el primero que matchea, y Pizza se apodera del
     escenario, así que va antes que el genérico */
  const registered=await page.evaluate(()=>window.RestaurantProductDetail.adapters());
  check('contrato · los cuatro adaptadores, en orden de precedencia',
    registered.join(',')==='pizza,orbit,dish-stage,product-rail',registered.join(' · '));

  /* 1. ON abre detail */
  const opened=await page.evaluate(async()=>{
    const r=window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,1700));
    return {r,open:window.RestaurantProductDetail.isOpen(),
      flag:document.documentElement.dataset.dishDetail,
      dialogs:document.querySelectorAll('#dish-detail.is-open,.upd-dialog.is-open').length,
      inVisual:document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null};
  });
  check('1 · ON abre la ficha',opened.r===true&&opened.open&&opened.flag==='open',
    `dishDetail=${opened.flag}`);
  /* 3. producto correcto · 8. sin ficha duplicada */
  check('3 · abre el producto activo correcto',
    opened.inVisual===s0.product,`${opened.inVisual} === ${s0.product}`);
  check('8 · nunca hay dos fichas abiertas',opened.dialogs===1,
    `${opened.dialogs} ficha abierta`);
  /* preserva la transición premium: el plato REAL viaja a la ficha */
  check('visual · el plato real viaja a la ficha (Flip preservado)',
    opened.inVisual!==null&&await page.evaluate(()=>
      !!document.querySelector('#detail-visual .orbit-dish')),
    'el nodo del plato está dentro de #detail-visual');
  await page.screenshot({path:path.join(SHOTS,'desktop-01-ficha-on.png')});

  /* 6. Escape cierra · 7. el foco vuelve */
  const focusBefore=await page.evaluate(()=>{
    const btn=document.querySelector('#explore-dish');
    btn?.focus();return document.activeElement?.id||''});
  await page.keyboard.press('Escape');
  await settle(page,1500);
  const afterEsc=await page.evaluate(()=>({
    open:window.RestaurantProductDetail.isOpen(),
    flag:document.documentElement.dataset.dishDetail}));
  check('6 · Escape cierra la ficha',!afterEsc.open&&afterEsc.flag==='closed',
    `dishDetail=${afterEsc.flag}`);

  /* 5. un producto lateral navega primero y no abre la ficha equivocada */
  const lateral=await page.evaluate(async()=>{
    const dishes=window.RestaurantOrbit.getDishes();
    const activeId=dishes[window.RestaurantOrbit.getActiveIndex()].id;
    const other=dishes.find(d=>d.id!==activeId);
    window.RestaurantProductDetail.open(other.id,{via:'api'});
    await new Promise(x=>setTimeout(x,420));
    const early={open:window.RestaurantProductDetail.isOpen(),
      inVisual:document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null};
    await new Promise(x=>setTimeout(x,2600));
    return {asked:other.id,activeId,early,
      late:{open:window.RestaurantProductDetail.isOpen(),
        inVisual:document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null}};
  });
  check('5 · un producto lateral no abre una ficha equivocada de inmediato',
    lateral.early.inVisual!==lateral.activeId,
    `pedido ${lateral.asked}, activo era ${lateral.activeId}, temprano: ${lateral.early.inVisual}`);
  check('5 · y cuando abre, abre el producto que se pidió',
    !lateral.late.open||lateral.late.inVisual===lateral.asked,
    `tarde: ${lateral.late.inVisual}`);
  await page.evaluate(()=>window.RestaurantProductDetail.close());
  await settle(page);

  /* 4. la navegación del motor sigue intacta */
  const nav=await page.evaluate(async()=>{
    const before=window.RestaurantOrbit.getActiveIndex();
    const p0=window.RestaurantOrbit.getProgress();
    document.querySelector('#next-dish').click();
    await new Promise(x=>setTimeout(x,1800));
    return {before,after:window.RestaurantOrbit.getActiveIndex(),
      p0,p1:window.RestaurantOrbit.getProgress(),
      open:window.RestaurantProductDetail.isOpen()};
  });
  check('4 · la navegación del motor sigue intacta y no abre ficha',
    nav.after!==nav.before&&!nav.open,`${nav.before} -> ${nav.after}`);

  /* 2. OFF no abre — ni por API, ni por CTA, ni por clic en el producto */
  const off=await page.evaluate(async()=>{
    window.RestaurantStudioConfig.set('productDetail.enabled',false);
    await new Promise(x=>setTimeout(x,1000));
    const api=window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,900));
    const afterApi=window.RestaurantProductDetail.isOpen();
    document.querySelector('#explore-dish')?.click();
    await new Promise(x=>setTimeout(x,1200));
    const afterCta=window.RestaurantProductDetail.isOpen();
    const dish=document.querySelector('#orbit-stage .orbit-dish');
    dish?.click();
    await new Promise(x=>setTimeout(x,1200));
    return {flag:document.documentElement.dataset.productDetailEnabled,
      api,afterApi,afterCta,afterClick:window.RestaurantProductDetail.isOpen(),
      dishDetail:document.documentElement.dataset.dishDetail};
  });
  check('2 · OFF no abre por API, ni por el CTA, ni al pulsar el producto',
    off.api===false&&!off.afterApi&&!off.afterCta&&!off.afterClick
    &&off.dishDetail==='closed',
    `flag=${off.flag}, dishDetail=${off.dishDetail}`);
  /* y la navegación con OFF es exactamente la de antes */
  const offNav=await page.evaluate(async()=>{
    const before=window.RestaurantOrbit.getActiveIndex();
    document.querySelector('#next-dish').click();
    await new Promise(x=>setTimeout(x,1800));
    return {before,after:window.RestaurantOrbit.getActiveIndex(),
      open:window.RestaurantProductDetail.isOpen()};
  });
  check('2 · con OFF el clic sigue siendo navegación',
    offNav.after!==offNav.before&&!offNav.open,
    `${offNav.before} -> ${offNav.after}`);
  await page.screenshot({path:path.join(SHOTS,'desktop-02-ficha-off.png')});

  /* La diferencia entre "apagada" y "roto": con OFF, un plato lateral tiene que seguir
     navegando y el héroe no tiene que abrir. Detener todos los clics del escenario
     dejaba la carta inmóvil, y el check anterior no lo veía porque usaba #next-dish. */
  const offClicks=await page.evaluate(async()=>{
    window.RestaurantStudioConfig.set('productDetail.enabled',false);
    await new Promise(x=>setTimeout(x,1100));
    const activeId=window.RestaurantProductDetail.activeProduct()?.id;
    const before=window.RestaurantOrbit.getActiveIndex();
    const lateral=[...document.querySelectorAll('#orbit-stage .orbit-dish')]
      .find(d=>d.dataset.id!==activeId);
    lateral?.click();
    await new Promise(x=>setTimeout(x,1900));
    const nav={before,after:window.RestaurantOrbit.getActiveIndex(),
      opened:window.RestaurantProductDetail.isOpen()};
    const heroId=window.RestaurantProductDetail.activeProduct()?.id;
    document.querySelector(`#orbit-stage .orbit-dish[data-id="${heroId}"]`)?.click();
    await new Promise(x=>setTimeout(x,1600));
    return {nav,heroOpened:window.RestaurantProductDetail.isOpen()};
  });
  check('2 · con OFF un plato lateral sigue navegando y el héroe no abre ficha',
    offClicks.nav.after!==offClicks.nav.before&&!offClicks.nav.opened
    &&!offClicks.heroOpened,
    `navegación ${offClicks.nav.before} -> ${offClicks.nav.after}, héroe abre ${offClicks.heroOpened}`);
  const onHero=await page.evaluate(async()=>{
    window.RestaurantStudioConfig.set('productDetail.enabled',true);
    await new Promise(x=>setTimeout(x,1100));
    const heroId=window.RestaurantProductDetail.activeProduct()?.id;
    document.querySelector(`#orbit-stage .orbit-dish[data-id="${heroId}"]`)?.click();
    await new Promise(x=>setTimeout(x,2100));
    const shown=document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null;
    window.RestaurantProductDetail.close();
    await new Promise(x=>setTimeout(x,1500));
    return {heroId,shown};
  });
  check('3 · con ON el clic en el héroe abre exactamente ese producto',
    onHero.shown===onHero.heroId,`${onHero.shown} === ${onHero.heroId}`);

  /* trigger: sólo botón / sólo producto */
  const triggers=await page.evaluate(async()=>{
    const out={};
    window.RestaurantStudioConfig.set('productDetail.enabled',true);
    window.RestaurantStudioConfig.set('productDetail.trigger','button');
    await new Promise(x=>setTimeout(x,900));
    out.productBlocked=window.RestaurantProductDetail.open(null,{via:'product'})===false;
    out.buttonAllowed=window.RestaurantProductDetail.open(null,{via:'button'})!==false;
    await new Promise(x=>setTimeout(x,1700));
    window.RestaurantProductDetail.close();
    await new Promise(x=>setTimeout(x,1400));
    window.RestaurantStudioConfig.set('productDetail.trigger','product');
    await new Promise(x=>setTimeout(x,900));
    out.buttonBlocked=window.RestaurantProductDetail.open(null,{via:'button'})===false;
    out.productAllowed=window.RestaurantProductDetail.open(null,{via:'product'})!==false;
    await new Promise(x=>setTimeout(x,1700));
    window.RestaurantProductDetail.close();
    await new Promise(x=>setTimeout(x,1400));
    window.RestaurantStudioConfig.set('productDetail.trigger','product-and-button');
    await new Promise(x=>setTimeout(x,700));
    return out;
  });
  check('apertura · el disparador configurado es el que manda',
    triggers.productBlocked&&triggers.buttonAllowed
    &&triggers.buttonBlocked&&triggers.productAllowed,
    'button bloquea producto y product bloquea botón');

  /* 18. campos vacíos no se inventan · campos apagados se ocultan */
  const fieldsOn=await page.evaluate(async()=>{
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,1800));
    const vis=sel=>{const n=document.querySelector(sel);if(!n)return null;
      const host=n.closest('.detail-columns > div')||n;
      return !(host.hidden||n.hidden)};
    return {ingredients:vis('#detail-ingredients'),pairing:vis('#detail-pairing'),
      story:vis('#class6-story')};
  });
  const fieldsOff=await page.evaluate(async()=>{
    ['ingredients','pairing','story'].forEach(f=>
      window.RestaurantStudioConfig.set(`productDetail.fields.${f}`,false));
    await new Promise(x=>setTimeout(x,1200));
    window.RestaurantProductDetail.applyFields();
    const vis=sel=>{const n=document.querySelector(sel);if(!n)return null;
      const host=n.closest('.detail-columns > div')||n;
      return !(host.hidden||n.hidden)};
    return {ingredients:vis('#detail-ingredients'),pairing:vis('#detail-pairing'),
      story:vis('#class6-story'),
      description:vis('#detail-description')};
  });
  check('campos · un campo apagado se oculta y el resto sigue',
    fieldsOn.ingredients&&fieldsOn.pairing&&!fieldsOff.ingredients
    &&!fieldsOff.pairing&&!fieldsOff.story&&fieldsOff.description,
    'ingredientes, maridaje e historia ocultos; descripción visible');
  await page.screenshot({path:path.join(SHOTS,'desktop-03-campos-apagados.png')});
  await page.evaluate(async()=>{
    ['ingredients','pairing','story'].forEach(f=>
      window.RestaurantStudioConfig.set(`productDetail.fields.${f}`,true));
    await new Promise(x=>setTimeout(x,900));
    window.RestaurantProductDetail.close();
  });
  await settle(page);

  /* 18. un campo que el producto NO tiene se oculta aunque esté activado.

     Se prueba en la ficha del Product Engine y con el producto de Pizza, cuyos campos
     vacíos son reales: en la ficha compartida el contenido lo escribe Class 06, que
     sólo relee su configuración ante eventos del Studio y no ante un `set`
     programático, así que allí se estaría midiendo su refresco y no esta regla. */
  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  const emptyFields=await page.evaluate(async()=>{
    const product=window.RestaurantProductDetail.activeProduct();
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,1300));
    const dlg=document.querySelector('.upd-dialog');
    const read=name=>{
      const el=dlg?.querySelector(`[data-upd="${name}"]`);
      const host=el?.closest('[data-upd-block]')||el;
      return {hidden:!!(el?.hidden||host?.hidden),text:(el?.textContent||'').trim()};
    };
    const out={product:{},fields:window.RestaurantProductDetail.fields()};
    ['ingredients','origin','technique','pairing','allergens','story']
      .forEach(f=>{out.product[f]={value:product?.[f]||'',...read(f)}});
    window.RestaurantProductDetail.close();
    await new Promise(x=>setTimeout(x,700));
    return out;
  });
  const emptyOnes=Object.entries(emptyFields.product).filter(([,v])=>!v.value);
  const filledOnes=Object.entries(emptyFields.product).filter(([,v])=>!!v.value);
  check('18 · un campo vacío se oculta en lugar de inventarse',
    emptyOnes.length>0
    &&emptyOnes.every(([f,v])=>v.hidden&&v.text===''&&emptyFields.fields[f]!==false)
    &&filledOnes.every(([,v])=>!v.hidden),
    `vacíos y ocultos: ${emptyOnes.map(([f])=>f).join(', ')||'ninguno'}`
      +` · con contenido y visibles: ${filledOnes.map(([f])=>f).join(', ')||'ninguno'}`);

  /* 9. un único Project State */
  check('9 · no hay segundo Product State ni almacenamiento propio',
    !/localStorage|sessionStorage|indexedDB/.test(CODE)
    &&/RestaurantStudioConfig/.test(CODE)
    &&!/(activeProductId|selectedProduct|currentProduct)\s*=/.test(CODE),
    'RestaurantStudioConfig, y el producto activo se pregunta al motor');
  check('9 · el producto activo se lee del motor, no de un estado propio',
    /RestaurantOrbit\?\.getActiveIndex/.test(CODE)
    &&/data-orbit-hero="1"/.test(CODE),
    'índice del motor + la excepción documentada del héroe');

  /* 19. Scroll Traveler intacto */
  const traveler=await page.evaluate(()=>window.RestaurantScrollTraveler?.state?.()||null);
  check('19 · Scroll Traveler sigue vivo e intacto',
    !!traveler&&traveler.active&&traveler.anchors.length===5,
    traveler?`${traveler.anchors.length} anclas, activo ${traveler.active}`:'ausente');
  check('19 · la ficha no se mete en Scroll Traveler',
    !/ScrollTraveler|scrollTraveler/.test(CODE),'ninguna referencia');

  /* 16. cambio de motor */
  const across=[];
  for(const [preset,flag] of [['depth-carousel','depthCarousel'],
    ['anchor-scenes','anchorScenes'],['orbital-food','orbitalFood']]){
    await selectPreset(page,preset,flag);
    const r=await page.evaluate(async()=>{
      const before=window.RestaurantProductDetail.state();
      window.RestaurantProductDetail.open(null,{via:'api'});
      await new Promise(x=>setTimeout(x,2200));
      const opened=window.RestaurantProductDetail.isOpen();
      const shown=document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null;
      window.RestaurantProductDetail.close();
      await new Promise(x=>setTimeout(x,1500));
      return {adapter:before.adapter,expected:before.product,opened,shown};
    });
    across.push({preset,...r});
  }
  check('16 · la misma ficha, el mismo contrato, en cada motor',
    across.every(a=>a.adapter==='orbit'&&a.opened&&a.shown===a.expected),
    across.map(a=>`${a.preset}:${a.shown}`).join(' '));

  /* 17. Pizza usa su propio modelo */
  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  const pizza=await page.evaluate(async()=>{
    const st=window.RestaurantProductDetail.state();
    const product=window.RestaurantProductDetail.activeProduct();
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,1400));
    const dlg=document.querySelector('.upd-dialog');
    const priceEl=dlg?.querySelector('[data-upd="price"]');
    const engineIndex=window.RestaurantPizzaSliceOrbit.state().activeIndex;
    const cfgName=window.RestaurantStudioConfig.get('pizzaSliceOrbit.products')[engineIndex].name;
    return {adapter:st.adapter,source:product?.source,id:product?.id,
      name:product?.name,price:product?.price,demo:product?.demoContent,
      open:dlg?.classList.contains('is-open'),
      shownName:(dlg?.querySelector('[data-upd="name"]')?.textContent||'').trim(),
      priceHidden:!!priceEl?.hidden,priceText:(priceEl?.textContent||'').trim(),
      engineIndex,cfgName,
      dishIds:window.RestaurantStudioConfig.get('dishes').map(d=>d.id)};
  });
  check('17 · Pizza usa su propio registro de producto',
    pizza.adapter==='pizza'&&pizza.source==='pizza'
    &&!pizza.dishIds.includes(pizza.id)&&pizza.name===pizza.cfgName,
    `${pizza.id} (${pizza.name}), no está en dishes`);
  check('17 · y abre la ficha del Product Engine con ese producto',
    pizza.open&&pizza.shownName===pizza.cfgName,`"${pizza.shownName}"`);
  check('17 · price:null no se renderiza como cero',
    pizza.price===null&&pizza.priceHidden&&pizza.priceText==='',
    'bloque de precio oculto');
  await page.screenshot({path:path.join(SHOTS,'desktop-04-pizza.png')});

  /* accesibilidad del diálogo propio: Escape, botón, foco que vuelve */
  const a11y=await page.evaluate(async()=>{
    const dlg=document.querySelector('.upd-dialog');
    const role=dlg?.getAttribute('role'),modal=dlg?.getAttribute('aria-modal');
    const focused=document.activeElement?.className||'';
    dlg?.querySelector('[data-upd-close]')?.click();
    await new Promise(x=>setTimeout(x,600));
    return {role,modal,focused,open:dlg?.classList.contains('is-open')};
  });
  check('a11y · el diálogo propio es un dialog modal y su botón cierra',
    a11y.role==='dialog'&&a11y.modal==='true'&&!a11y.open,
    `role=${a11y.role} aria-modal=${a11y.modal}`);
  const escPizza=await page.evaluate(async()=>{
    const trigger=document.querySelector('.ps-next')||document.querySelector('#next-dish');
    trigger?.focus();
    const before=document.activeElement?.className||'';
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,900));
    const inside=document.activeElement?.className||'';
    return {before,inside};
  });
  await page.keyboard.press('Escape');
  await settle(page,900);
  const focusBack=await page.evaluate(()=>({
    open:window.RestaurantProductDetail.isOpen(),
    active:document.activeElement?.className||''}));
  check('7 · Escape cierra el diálogo propio y devuelve el foco al disparador',
    !focusBack.open&&focusBack.active===escPizza.before,
    `foco: ${escPizza.before} -> ${escPizza.inside} -> ${focusBack.active}`);

  check('runtime · sin errores de página en toda la pasada',errors.length===0,
    errors.slice(0,2).join(' | ')||'limpio');
  await context.close();
}

/* ============================================================
   2. PROJECT STATE — persistencia, import/export, undo/redo
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  await boot(page);

  /* 10. persistencia tras reload */
  await page.evaluate(()=>{
    window.RestaurantStudioConfig.set('productDetail.enabled',false);
    window.RestaurantStudioConfig.set('productDetail.trigger','button');
    window.RestaurantStudioConfig.set('productDetail.fields.origin',false);
  });
  await page.waitForTimeout(2600);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.productDetailReady==='ready',
    null,{timeout:30000});
  await page.waitForTimeout(1000);
  const persisted=await state(page);
  check('10 · la configuración sobrevive a un reload',
    persisted.enabled===false&&persisted.trigger==='button'
    &&persisted.fields.origin===false,
    `enabled=${persisted.enabled} trigger=${persisted.trigger} origin=${persisted.fields.origin}`);

  /* 11. import / export */
  const exported=await page.evaluate(()=>{
    const snap=window.RestaurantStudioConfig.snapshot();
    return {hasBlock:!!snap.productDetail,
      json:JSON.stringify(snap.productDetail)};
  });
  check('11 · el export global incluye la configuración de la ficha',
    exported.hasBlock&&/"trigger":"button"/.test(exported.json),exported.json);

  /* 12. undo / redo sobre el MISMO historial */
  await page.evaluate(()=>{
    window.RestaurantStudioConfig.set('productDetail.enabled',true);
  });
  await page.waitForTimeout(1400);
  const beforeUndo=(await state(page)).enabled;
  await page.evaluate(()=>document.querySelector('#undo-btn')?.click());
  await page.waitForTimeout(1500);
  const afterUndo=(await state(page)).enabled;
  await page.evaluate(()=>document.querySelector('#redo-btn')?.click());
  await page.waitForTimeout(1500);
  const afterRedo=(await state(page)).enabled;
  check('12 · Undo y Redo mueven esta configuración en el historial compartido',
    beforeUndo===true&&afterUndo===false&&afterRedo===true,
    `${beforeUndo} -> undo ${afterUndo} -> redo ${afterRedo}`);

  /* la tarjeta vive en el Studio existente, en el panel de Platos */
  const studio=await page.evaluate(async()=>{
    document.querySelector('.studio-open')?.click();
    await new Promise(x=>setTimeout(x,900));
    document.querySelector('#studio [data-panel="dishes"]')?.click();
    await new Promise(x=>setTimeout(x,900));
    const card=document.querySelector('.upd-studio');
    return {card:!!card,
      inDishes:!!card?.closest('.studio-panel[data-panel="dishes"]'),
      panels:[...document.querySelectorAll('.studio-panel')].map(p=>p.dataset.panel),
      paths:[...document.querySelectorAll('.upd-studio [data-path]')].map(i=>i.dataset.path)};
  });
  check('studio · la tarjeta es nativa del panel de Platos, sin panel nuevo',
    studio.card&&studio.inDishes
    &&studio.panels.filter(p=>p==='dishes').length===1,
    `paneles: ${studio.panels.join(', ')}`);
  check('studio · los nueve controles escriben por data-path',
    studio.paths.length===9&&studio.paths.every(p=>p.startsWith('productDetail.')),
    studio.paths.length+' controles');
  await page.evaluate(()=>document.querySelector('.upd-studio')?.scrollIntoView({block:'center'}));
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(SHOTS,'desktop-05-studio.png')});
  await context.close();
}

/* ============================================================
   3. MOBILE
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await boot(page);
  const mob=await page.evaluate(async()=>{
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,2000));
    return {open:window.RestaurantProductDetail.isOpen(),
      shown:document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null,
      expected:window.RestaurantProductDetail.state().product,
      overflow:document.documentElement.scrollWidth<=innerWidth};
  });
  check('13/14 · móvil: abre el producto correcto y no desborda',
    mob.open&&mob.shown===mob.expected&&mob.overflow,
    `${mob.shown}, overflow ${!mob.overflow}`);
  await page.screenshot({path:path.join(SHOTS,'mobile-01-ficha-on.png')});
  await page.evaluate(()=>window.RestaurantProductDetail.close());
  await page.waitForTimeout(1400);
  const mobOff=await page.evaluate(async()=>{
    window.RestaurantStudioConfig.set('productDetail.enabled',false);
    await new Promise(x=>setTimeout(x,1000));
    const dish=document.querySelector('#orbit-stage .orbit-dish');
    dish?.click();
    await new Promise(x=>setTimeout(x,1400));
    return {open:window.RestaurantProductDetail.isOpen()};
  });
  check('14 · móvil: con OFF el toque no abre ficha',!mobOff.open,'sin ficha');
  await page.screenshot({path:path.join(SHOTS,'mobile-02-ficha-off.png')});
  await context.close();
}

/* ============================================================
   4. REDUCED MOTION
   ============================================================ */
{
  const context=await browser.newContext({viewport:{width:1440,height:960},
    reducedMotion:'reduce'});
  const page=await context.newPage();
  await boot(page);
  const s=await state(page);
  const rm=await page.evaluate(async()=>{
    window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,1800));
    const open=window.RestaurantProductDetail.isOpen();
    const shown=document.querySelector('#detail-visual .orbit-dish')?.dataset.id||null;
    window.RestaurantProductDetail.close();
    await new Promise(x=>setTimeout(x,1400));
    return {open,shown,closed:!window.RestaurantProductDetail.isOpen()};
  });
  check('15 · reduced motion: la ficha abre, muestra el producto y cierra',
    s.reduced&&rm.open&&rm.shown===s.product&&rm.closed,
    `reduced=${s.reduced}, producto ${rm.shown}`);
  await page.evaluate(async()=>{window.RestaurantProductDetail.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,1600))});
  await page.screenshot({path:path.join(SHOTS,'desktop-06-reduced-motion.png')});
  await context.close();
}

/* ============================================================
   5. GROUP B — los dos motores con ficha propia, en su propia página

   Se adaptan al CONTRATO, no al marcado: `open()` dispara su propio disparador
   aprobado y su ficha se abre tal como estaba. Si el contrato no existiera en su
   página, su adaptador sería código muerto — así que eso también se comprueba.
   ============================================================ */
for(const [label,page_,adapterId,detailSel] of [
  ['dish-stage','labs/project10-dish-stage/index.html','dish-stage','[data-ds-detail]'],
  ['product-rail','labs/project11-cinematic-product-rail/index.html','product-rail','#cpr-detail']]){
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}/${page_}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.productDetailReady==='ready',
    null,{timeout:25000}).catch(()=>{});
  await page.waitForTimeout(2400);

  const present=await page.evaluate(()=>!!window.RestaurantProductDetail);
  check(`${label} · el contrato existe en su propia página`,present,
    present?'RestaurantProductDetail cargado':'AUSENTE: el adaptador sería código muerto');

  const r=present?await page.evaluate(async(sel)=>{
    const pd=window.RestaurantProductDetail;
    const st=pd.state();
    const product=pd.activeProduct();
    const opened=pd.open(null,{via:'api'});
    await new Promise(x=>setTimeout(x,1500));
    const host=document.querySelector(sel);
    const hostOpen=sel==='#cpr-detail'
      ?(host?.open===true||host?.hasAttribute('open'))
      :host?.getAttribute('aria-hidden')==='false';
    return {adapter:st.adapter,product:product?.id||null,name:product?.name||null,
      opened,isOpen:pd.isOpen(),hostOpen,
      ownDialogs:document.querySelectorAll('.upd-dialog.is-open').length};
  },detailSel):{};
  check(`${label} · el contrato elige su adaptador y lee su producto activo`,
    r.adapter===adapterId&&!!r.product,`${r.adapter} · ${r.product}`);
  check(`${label} · abre SU ficha aprobada, no una nueva`,
    r.opened===true&&r.isOpen===true&&r.hostOpen===true&&r.ownDialogs===0,
    `su ficha abierta: ${r.hostOpen}, diálogos propios creados: ${r.ownDialogs}`);
  await page.screenshot({path:path.join(SHOTS,`groupb-${label}-ficha-on.png`)});

  const closed=present?await page.evaluate(async()=>{
    window.RestaurantProductDetail.close();
    await new Promise(x=>setTimeout(x,1100));
    return !window.RestaurantProductDetail.isOpen();
  }):false;
  check(`${label} · y cierra por el contrato`,closed,'cerrada');

  const offB=present?await page.evaluate(async()=>{
    /* en su página no hay Studio: manda la plantilla, y apagarla debe bastar */
    window.RestaurantDefaults.productDetail.enabled=false;
    const blocked=window.RestaurantProductDetail.open(null,{via:'api'})===false;
    await new Promise(x=>setTimeout(x,900));
    const open=window.RestaurantProductDetail.isOpen();
    window.RestaurantDefaults.productDetail.enabled=true;
    return {blocked,open};
  }):{};
  check(`${label} · OFF no abre tampoco aquí`,offB.blocked&&!offB.open,'refusada');
  check(`${label} · sin errores de página`,errors.length===0,
    errors.slice(0,2).join(' | ')||'limpio');
  await context.close();
}

await browser.close();server.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots -> output/playwright/product-detail/`);
if(failed.length){
  console.error(`PRODUCT_DETAIL_FAIL: ${failed.map(f=>f.name).join(' | ')}`);
  process.exit(1);
}
console.log('PRODUCT_DETAIL_PASS');
