/* CLASS 19 — MOTION + MODULE STUDIO INTEGRATION contract.

   What has to be true of an index:

     · it shows ELEVEN engines, and the eleventh is not a rounding of the truth —
       every one of them resolves to something the page can actually reach;
     · the modules are present and visibly NOT counted among the eleven;
     · choosing a choreography from the library is the same act as choosing it in the
       select — the library owns no second selection;
     · the transversal engine toggles through the existing project state;
     · the three full-screen experiences open INSIDE the app — Phase 1B replaced the
       new tab with the in-app shell — and the library never claims they are presets;
     · filtering never hides an engine permanently, and the panel stays scrollable;
     · nothing it does disturbs the engines themselves.

   Usage: node tests/class19-motion-library-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'tests','screenshots','motion-library');
fs.mkdirSync(SHOTS,{recursive:true});
const LIB=fs.readFileSync(path.join(ROOT,'class19-motion-library.js'),'utf8');
const CODE=LIB.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^[ \t]*\/\/.*$/gm,'');

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});
  console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function openLibrary(page){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,
    null,{timeout:30000});
  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(700);
  await page.evaluate(()=>document.querySelector('#studio [data-panel="motion"]')?.click());
  await page.waitForFunction(()=>document.documentElement.dataset.motionLibrary==='ready',
    null,{timeout:25000});
  /* every runtime injects its option asynchronously; wait for the catalogue to resolve */
  await page.waitForFunction(()=>window.RestaurantMotionLibrary?.state?.().available===11,
    null,{timeout:25000}).catch(()=>{});
  await page.waitForTimeout(600);
}

{
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await openLibrary(page);

  const state=await page.evaluate(()=>window.RestaurantMotionLibrary.state());
  const engines=await page.evaluate(()=>window.RestaurantMotionLibrary.engines());

  check('the library declares eleven engines',state.count===11,`${state.count} engines`);
  check('all eleven are really reachable, not just listed',
    state.available===11,`${state.available}/11 available`);
  check('the count on screen is the count in the catalogue',
    await page.evaluate(()=>+document.querySelector('.ml-count').textContent.trim())===11
    &&await page.evaluate(()=>document.querySelectorAll('.ml-grid [data-ml-kind]').length)===11,
    'header badge and rendered cards agree');
  check('every engine carries a number, a name and its provenance',
    engines.every(e=>/^\d\d$/.test(e.n)&&e.name.length>3&&/(Class|Project)\s\d/.test(e.project)),
    engines.map(e=>e.n).join(' '));
  check('the eleven are the nine approved motors plus the two base choreographies',
    engines.filter(e=>e.kind==='preset').length===7
    &&engines.filter(e=>e.kind==='page').length===1
    &&engines.filter(e=>e.kind==='experience').length===3,
    '7 orbit presets · 1 page motion · 3 full-screen experiences');

  /* modules: present, and outside the eleven */
  const modules=await page.evaluate(()=>({
    count:window.RestaurantMotionLibrary.moduleCount(),
    cards:document.querySelectorAll('.ml-modules [data-ml-card]').length,
    insideGrid:[...document.querySelectorAll('.ml-grid [data-ml-kind]')]
      .some(c=>/social|whatsapp/.test(c.dataset.mlCard)),
    heading:document.querySelector('.ml-modules h4')?.textContent.trim()||''}));
  check('the three optional modules are listed in their own section',
    modules.count===3&&modules.cards===3,`${modules.cards} module cards`);
  check('the modules are not counted among the engines',
    !modules.insideGrid&&state.count===11,modules.heading);

  /* choosing from the library IS choosing in the select */
  const before=await page.evaluate(()=>document.getElementById('motion-orbital-style').value);
  await page.evaluate(()=>window.RestaurantMotionLibrary.activate('depth-carousel'));
  await page.waitForFunction(()=>document.documentElement.dataset.depthCarousel==='ready',
    null,{timeout:25000}).catch(()=>{});
  await page.waitForTimeout(1500);
  const after=await page.evaluate(()=>({
    select:document.getElementById('motion-orbital-style').value,
    motion:document.documentElement.dataset.orbitalMotion,
    libActive:document.documentElement.dataset.motionLibraryActive,
    cardState:document.querySelector('[data-ml-card="depth-carousel"]')?.dataset.mlState}));
  check('activating from the library moves the real selector',
    before!=='depth-carousel'&&after.select==='depth-carousel'
    &&after.motion==='depth-carousel',`${before} -> ${after.select}`);
  check('the library reflects the active engine instead of remembering it',
    after.libActive==='depth-carousel'&&after.cardState==='activo',
    `card state "${after.cardState}"`);

  /* and the reverse: changing the select updates the library */
  await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='orbital-food';s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  });
  await page.waitForTimeout(2200);
  const mirrored=await page.evaluate(()=>({
    active:document.documentElement.dataset.motionLibraryActive,
    depth:document.querySelector('[data-ml-card="depth-carousel"]').dataset.mlState,
    food:document.querySelector('[data-ml-card="orbital-food"]').dataset.mlState}));
  check('changing the selector elsewhere updates the library',
    mirrored.active==='orbital-food'&&mirrored.food==='activo'
    &&mirrored.depth==='disponible',
    `depth ${mirrored.depth} · food ${mirrored.food}`);
  check('exactly one choreography is ever marked active',
    await page.evaluate(()=>document.querySelectorAll('[data-ml-kind="preset"][data-ml-state="activo"]').length)===1,
    'one card in use');

  /* the transversal engine toggles through the existing project state */
  const t0=await page.evaluate(()=>window.RestaurantScrollTraveler.state().active);
  await page.evaluate(()=>document.querySelector('[data-ml-toggle]').click());
  await page.waitForTimeout(1400);
  const t1=await page.evaluate(()=>({
    cfg:window.RestaurantStudioConfig.get('scrollTraveler.enabled'),
    active:window.RestaurantScrollTraveler.state().active,
    pressed:document.querySelector('[data-ml-toggle]').getAttribute('aria-pressed'),
    label:document.querySelector('[data-ml-toggle]').textContent.trim()}));
  await page.evaluate(()=>document.querySelector('[data-ml-toggle]').click());
  await page.waitForTimeout(1400);
  const t2=await page.evaluate(()=>window.RestaurantScrollTraveler.state().active);
  check('the transversal engine toggles from the library, through project state',
    t0===true&&t1.active===false&&t1.cfg===false&&t1.pressed==='false'&&t2===true,
    `${t0} -> ${t1.active} -> ${t2}, button says "${t1.label}"`);
  check('turning it off does not disturb the choreography underneath',
    await page.evaluate(()=>document.getElementById('motion-orbital-style').value)==='orbital-food',
    'orbital-food still selected');

  /* The experiences open inside the app.

     This check used to assert the opposite — an anchor to labs/… with target="_blank" —
     and Phase 1B replaced that UX on purpose: a lab is evidence, not the product's
     entry point. So what is asserted now is the new contract, and just as strictly:
     a button that calls the shell, no new tab, and the page still on disk because the
     labs are kept for regression. */
  /* [data-ml-grid] is the ENGINES grid: the modules section reuses .ml-grid for layout */
  const openers=await page.evaluate(()=>[...document.querySelectorAll('[data-ml-grid] .ml-open')]
    .map(el=>({card:el.closest('[data-ml-card]').dataset.mlCard,
      tag:el.tagName,id:el.dataset.experienceOpen||'',
      href:el.getAttribute('href'),target:el.getAttribute('target')})));
  check('the three full-screen experiences open inside the app, not in a new tab',
    openers.length===3
    &&openers.every(o=>o.tag==='BUTTON'&&o.id===o.card&&!o.href&&!o.target),
    openers.map(o=>`${o.card}:${o.tag.toLowerCase()}`).join(' '));
  const shellPages=await page.evaluate(()=>
    (window.RestaurantExperienceShell?.experiences?.()||[]).map(e=>({id:e.id,url:e.url})));
  check('the shell knows all three, and their pages are still on disk for regression',
    shellPages.length===3
    &&openers.every(o=>shellPages.some(p=>p.id===o.card))
    &&shellPages.every(p=>/^labs\/.+\/index\.html$/.test(p.url)
      &&fs.existsSync(path.join(ROOT,p.url))),
    shellPages.map(p=>p.url.split('/')[1]).join(' '));
  check('no experience pretends to be an orbit preset',
    !(await page.evaluate(()=>[...document.querySelectorAll('#motion-orbital-style option')]
      .map(o=>o.value))).some(v=>['dish-stage','circular-dish-rotator','cinematic-product-rail'].includes(v)),
    'the select still holds only the seven choreographies');

  /* filtering */
  for(const [f,expect] of [['preset',7],['page',1],['experience',3],['all',11]]){
    await page.evaluate(id=>window.RestaurantMotionLibrary.setFilter(id),f);
    await page.waitForTimeout(220);
    const visible=await page.evaluate(()=>
      [...document.querySelectorAll('.ml-grid [data-ml-kind]')].filter(c=>!c.hidden).length);
    check(`filter "${f}" shows ${expect}`,visible===expect,`${visible} visible`);
  }
  check('filtering never removes a card from the DOM',
    await page.evaluate(()=>document.querySelectorAll('.ml-grid [data-ml-kind]').length)===11,
    'all eleven still present');

  /* the panel is browsable */
  const scrollable=await page.evaluate(()=>{
    const panel=document.querySelector('.studio-panel.motion-panel');
    const host=panel.closest('[class*="scroll"]')||panel.parentElement;
    const sticky=getComputedStyle(document.querySelector('.ml-filters')).position;
    return {canScroll:host.scrollHeight>host.clientHeight+40,sticky,
      libraryAbove:!!(document.querySelector('.ml-library')?.compareDocumentPosition(
        document.querySelector('.motion-card-featured'))&Node.DOCUMENT_POSITION_FOLLOWING)};
  });
  check('the panel scrolls through the whole library',scrollable.canScroll,
    'content exceeds the drawer');
  check('the filter row stays reachable while scrolling',scrollable.sticky==='sticky',
    `position:${scrollable.sticky}`);
  check('the library is the index: it sits above the per-engine cards',
    scrollable.libraryAbove,'library precedes the Orbital Menu card');

  /* the library is an index, not an engine */
  check('it owns no motion state of its own',
    !/requestAnimationFrame|gsap|ScrollTrigger/.test(CODE),'no animation loop');
  check('it holds no second selection',
    !/(activeEngine|currentEngine|selectedEngine)\s*=/.test(CODE),
    'active engine is read from the select every time');
  check('the renderer has no per-engine branch',
    !/(id===['"]dish-stage|id===['"]elegant|name===['"])/.test(CODE),
    'it switches on kind, never on identity');
  check('index.html stays untouched and the runtime loads itself',
    /class19-motion-library\.js/.test(fs.readFileSync(path.join(ROOT,'class4-runtime-guard.js'),'utf8'))
    &&!/class19-motion-library/.test(fs.readFileSync(path.join(ROOT,'index.html'),'utf8')),
    'loaded from class4-runtime-guard.js');
  check('no page errors while using the library',errors.length===0,
    errors.slice(0,2).join(' | ')||'clean');

  /* evidence */
  await page.evaluate(()=>window.RestaurantMotionLibrary.setFilter('all'));
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(600);
  await page.screenshot({path:path.join(SHOTS,'01-library-top.png')});
  await page.evaluate(()=>document.querySelector('[data-ml-card="scroll-traveler"]')
    ?.scrollIntoView({block:'center'}));
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(SHOTS,'02-library-experiences.png')});
  await page.evaluate(()=>document.querySelector('.ml-modules')?.scrollIntoView({block:'center'}));
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(SHOTS,'03-modules.png')});
  await page.evaluate(()=>window.RestaurantMotionLibrary.setFilter('experience'));
  await page.evaluate(()=>document.querySelector('.ml-filters')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(SHOTS,'04-filter-experiences.png')});
  await context.close();
}

/* ---------- mobile ---------- */
{
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await openLibrary(page);
  const mob=await page.evaluate(()=>({
    count:window.RestaurantMotionLibrary.state().count,
    cards:document.querySelectorAll('.ml-grid [data-ml-kind]').length,
    overflow:document.documentElement.scrollWidth<=innerWidth,
    columns:getComputedStyle(document.querySelector('.ml-grid')).gridTemplateColumns
      .split(' ').length}));
  check('mobile · all eleven engines are listed',mob.count===11&&mob.cards===11,
    `${mob.cards} cards`);
  check('mobile · one column, and no horizontal overflow',
    mob.columns===1&&mob.overflow,`${mob.columns} column(s)`);
  const tap=await page.evaluate(async()=>{
    const btn=[...document.querySelectorAll('.ml-activate')].find(b=>!b.disabled
      &&b.closest('[data-ml-card]').dataset.mlCard==='anchor-scenes');
    btn.click();
    await new Promise(r=>setTimeout(r,2600));
    return {select:document.getElementById('motion-orbital-style').value,
      state:document.querySelector('[data-ml-card="anchor-scenes"]').dataset.mlState};
  });
  check('mobile · choosing an engine works with a tap',
    tap.select==='anchor-scenes'&&tap.state==='activo',`${tap.select}`);
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(600);
  await page.screenshot({path:path.join(SHOTS,'mobile-01-library.png')});
  await context.close();
}

await browser.close();server.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots -> tests/screenshots/motion-library/`);
if(failed.length){
  console.error(`MOTION_LIBRARY_FAIL: ${failed.map(f=>f.name).join(' | ')}`);
  process.exit(1);
}
console.log('MOTION_LIBRARY_PASS');
