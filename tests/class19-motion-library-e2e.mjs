/* CLASS 19 — MOTION + MODULE STUDIO INTEGRATION contract.

   Class 24 evolves the truthful catalogue from eleven to TWELVE engines:
   eight selectable product choreographies, one transversal page motion and three
   complete experiences. This suite proves the library remains only an index — no
   second selection, no persistence and no motion of its own.

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
  await page.waitForFunction(()=>window.RestaurantMotionLibrary?.state?.().available===12,
    null,{timeout:25000}).catch(()=>{});
  await page.waitForTimeout(600);
}

{
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await openLibrary(page);

  const state=await page.evaluate(()=>window.RestaurantMotionLibrary.state());
  const engines=await page.evaluate(()=>window.RestaurantMotionLibrary.engines());
  check('the library declares twelve engines',state.count===12,`${state.count} engines`);
  check('all twelve are really reachable, not just listed',state.available===12,`${state.available}/12 available`);
  check('the count on screen is the count in the catalogue',
    await page.evaluate(()=>+document.querySelector('.ml-count').textContent.trim())===12
    &&await page.evaluate(()=>document.querySelectorAll('.ml-grid [data-ml-kind]').length)===12,
    'header badge and rendered cards agree');
  check('every engine carries a number, a name and its provenance',
    engines.every(e=>/^\d\d$/.test(e.n)&&e.name.length>3&&/(Class|Project)\s\d/.test(e.project)),
    engines.map(e=>e.n).join(' '));
  check('the catalogue is 8 product presets + 1 page motion + 3 experiences',
    engines.filter(e=>e.kind==='preset').length===8
    &&engines.filter(e=>e.kind==='page').length===1
    &&engines.filter(e=>e.kind==='experience').length===3,
    '8 presets · 1 page motion · 3 full-screen experiences');
  check('Half Orbit is engine 12 and resolves to a real preset',
    engines.some(e=>e.n==='12'&&e.id==='half-orbit'&&e.kind==='preset'&&e.status.available),
    'half-orbit available');

  const modules=await page.evaluate(()=>({
    count:window.RestaurantMotionLibrary.moduleCount(),
    cards:document.querySelectorAll('.ml-modules [data-ml-card]').length,
    insideGrid:[...document.querySelectorAll('.ml-grid [data-ml-kind]')]
      .some(c=>/social|whatsapp/.test(c.dataset.mlCard)),
    heading:document.querySelector('.ml-modules h4')?.textContent.trim()||''}));
  check('the three optional modules are listed in their own section',
    modules.count===3&&modules.cards===3,`${modules.cards} module cards`);
  check('the modules are not counted among the engines',!modules.insideGrid&&state.count===12,modules.heading);

  const grouped=await page.evaluate(()=>window.RestaurantMotionGovernance?.state?.());
  check('Motion Studio separates product / transversal / experiences',
    grouped?.grouped===true&&grouped.groups.join(',')==='preset,page,experience',grouped?.groups?.join(',')||'not grouped');

  const before=await page.evaluate(()=>document.getElementById('motion-orbital-style').value);
  await page.evaluate(()=>window.RestaurantMotionLibrary.activate('half-orbit'));
  await page.waitForFunction(()=>window.RestaurantHalfOrbit?.state?.().ready===true,
    null,{timeout:25000}).catch(()=>{});
  await page.waitForTimeout(1000);
  const half=await page.evaluate(()=>({
    select:document.getElementById('motion-orbital-style').value,
    motion:document.documentElement.dataset.orbitalMotion,
    libActive:document.documentElement.dataset.motionLibraryActive,
    cardState:document.querySelector('[data-ml-card="half-orbit"]')?.dataset.mlState,
    half:window.RestaurantHalfOrbit?.state?.()}));
  check('activating Half Orbit from the library moves the real selector',
    before!=='half-orbit'&&half.select==='half-orbit'&&half.motion==='half-orbit',`${before} -> ${half.select}`);
  check('the library reflects Half Orbit instead of remembering it',
    half.libActive==='half-orbit'&&half.cardState==='activo'&&half.half?.ready===true,
    `card ${half.cardState} · runtime ${half.half?.ready}`);

  await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='orbital-food';s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));window.RestaurantMotionStudio?.publish?.();
  });
  await page.waitForTimeout(1800);
  const mirrored=await page.evaluate(()=>({
    active:document.documentElement.dataset.motionLibraryActive,
    half:document.querySelector('[data-ml-card="half-orbit"]').dataset.mlState,
    food:document.querySelector('[data-ml-card="orbital-food"]').dataset.mlState}));
  check('changing the selector elsewhere updates the library',
    mirrored.active==='orbital-food'&&mirrored.food==='activo'&&mirrored.half==='disponible',
    `half ${mirrored.half} · food ${mirrored.food}`);
  check('exactly one product choreography is marked active',
    await page.evaluate(()=>document.querySelectorAll('[data-ml-kind="preset"][data-ml-state="activo"]').length)===1,
    'one card in use');

  /* Page motion is opt-in. It starts OFF, then toggles independently through Project State. */
  const t0=await page.evaluate(()=>({cfg:window.RestaurantStudioConfig.get('scrollTraveler.enabled'),active:window.RestaurantScrollTraveler.state().active}));
  await page.evaluate(()=>document.querySelector('[data-ml-toggle]').click());await page.waitForTimeout(1000);
  const t1=await page.evaluate(()=>({cfg:window.RestaurantStudioConfig.get('scrollTraveler.enabled'),
    active:window.RestaurantScrollTraveler.state().active,
    pressed:document.querySelector('[data-ml-toggle]').getAttribute('aria-pressed')}));
  await page.evaluate(()=>document.querySelector('[data-ml-toggle]').click());await page.waitForTimeout(1000);
  const t2=await page.evaluate(()=>({cfg:window.RestaurantStudioConfig.get('scrollTraveler.enabled'),active:window.RestaurantScrollTraveler.state().active}));
  check('the transversal engine is OFF by default and toggles through project state',
    t0.cfg===false&&t0.active===false&&t1.active===true&&t1.cfg===true&&t1.pressed==='true'&&t2.active===false&&t2.cfg===false,
    `${t0.active} -> ${t1.active} -> ${t2.active}`);
  check('turning page motion on/off does not disturb product choreography',
    await page.evaluate(()=>document.getElementById('motion-orbital-style').value)==='orbital-food','orbital-food still selected');

  const openers=await page.evaluate(()=>[...document.querySelectorAll('[data-ml-grid] .ml-open')]
    .map(el=>({card:el.closest('[data-ml-card]').dataset.mlCard,tag:el.tagName,
      id:el.dataset.experienceOpen||'',href:el.getAttribute('href'),target:el.getAttribute('target')})));
  check('the three full-screen experiences open inside the app, not a new tab',
    openers.length===3&&openers.every(o=>o.tag==='BUTTON'&&o.id===o.card&&!o.href&&!o.target),
    openers.map(o=>`${o.card}:${o.tag.toLowerCase()}`).join(' '));
  const shellPages=await page.evaluate(()=>
    (window.RestaurantExperienceShell?.experiences?.()||[]).map(e=>({id:e.id,url:e.url})));
  const labsOnDisk=fs.readdirSync(path.join(ROOT,'labs'))
    .filter(d=>fs.existsSync(path.join(ROOT,'labs',d,'index.html'))).length;
  check('the shell opens productive entrypoints and labs remain on disk',
    shellPages.length===3&&openers.every(o=>shellPages.some(p=>p.id===o.card))
    &&shellPages.every(p=>p.url===`experiences/${p.id}/index.html`&&fs.existsSync(path.join(ROOT,p.url)))
    &&labsOnDisk>=3,`${shellPages.length} product pages · ${labsOnDisk} labs intact`);
  check('no complete experience pretends to be a product preset',
    !(await page.evaluate(()=>[...document.querySelectorAll('#motion-orbital-style option')].map(o=>o.value)))
      .some(v=>['dish-stage','circular-dish-rotator','cinematic-product-rail'].includes(v)),
    'selector contains only product choreographies');

  for(const [f,expect] of [['preset',8],['page',1],['experience',3],['all',12]]){
    await page.evaluate(id=>window.RestaurantMotionLibrary.setFilter(id),f);await page.waitForTimeout(180);
    const visible=await page.evaluate(()=>[...document.querySelectorAll('.ml-grid [data-ml-kind]')].filter(c=>!c.hidden).length);
    check(`filter "${f}" shows ${expect}`,visible===expect,`${visible} visible`);
  }
  check('filtering never removes a card from the DOM',
    await page.evaluate(()=>document.querySelectorAll('.ml-grid [data-ml-kind]').length)===12,'all twelve still present');

  const scrollable=await page.evaluate(()=>{
    const panel=document.querySelector('.studio-panel.motion-panel');
    const host=panel.closest('[class*="scroll"]')||panel.parentElement;
    const sticky=getComputedStyle(document.querySelector('.ml-filters')).position;
    return {canScroll:host.scrollHeight>host.clientHeight+40,sticky,
      libraryAbove:!!(document.querySelector('.ml-library')?.compareDocumentPosition(
        document.querySelector('.motion-card-featured'))&Node.DOCUMENT_POSITION_FOLLOWING)};
  });
  check('the panel scrolls through the whole library',scrollable.canScroll,'content exceeds drawer');
  check('the filter row stays reachable while scrolling',scrollable.sticky==='sticky',`position:${scrollable.sticky}`);
  check('the library remains the index above per-engine cards',scrollable.libraryAbove,'library first');

  check('the library owns no motion state of its own',!/requestAnimationFrame|gsap|ScrollTrigger/.test(CODE),'no animation loop');
  check('the library holds no second selection',!/(activeEngine|currentEngine|selectedEngine)\s*=/.test(CODE),'active read from selector');
  check('the renderer has no per-engine branch',!/(id===['"]dish-stage|id===['"]elegant|id===['"]half-orbit|name===['"])/.test(CODE),'renderer switches on kind');
  check('index.html stays free of engine runtimes and the library runtime loads itself',
    /class19-motion-library\.js/.test(fs.readFileSync(path.join(ROOT,'class4-runtime-guard.js'),'utf8'))
    &&!/class19-motion-library/.test(fs.readFileSync(path.join(ROOT,'index.html'),'utf8')),'runtime guard owns Class19 entry');
  check('no page errors while using the library',errors.length===0,errors.slice(0,2).join(' | ')||'clean');

  await page.evaluate(()=>window.RestaurantMotionLibrary.setFilter('all'));
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(500);await page.screenshot({path:path.join(SHOTS,'01-library-top.png')});
  await page.evaluate(()=>document.querySelector('[data-ml-card="half-orbit"]')?.scrollIntoView({block:'center'}));
  await page.waitForTimeout(400);await page.screenshot({path:path.join(SHOTS,'02-half-orbit.png')});
  await page.evaluate(()=>document.querySelector('.ml-modules')?.scrollIntoView({block:'center'}));
  await page.waitForTimeout(400);await page.screenshot({path:path.join(SHOTS,'03-modules.png')});
  await context.close();
}

{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();await openLibrary(page);
  const mob=await page.evaluate(()=>({count:window.RestaurantMotionLibrary.state().count,
    cards:document.querySelectorAll('.ml-grid [data-ml-kind]').length,
    overflow:document.documentElement.scrollWidth<=innerWidth,
    columns:getComputedStyle(document.querySelector('.ml-grid')).gridTemplateColumns.split(' ').length}));
  check('mobile · all twelve engines are listed',mob.count===12&&mob.cards===12,`${mob.cards} cards`);
  check('mobile · one column and no horizontal overflow',mob.columns===1&&mob.overflow,`${mob.columns} column(s)`);
  const tap=await page.evaluate(async()=>{
    const btn=[...document.querySelectorAll('.ml-activate')].find(b=>!b.disabled
      &&b.closest('[data-ml-card]').dataset.mlCard==='half-orbit');
    btn.click();await new Promise(r=>setTimeout(r,1800));
    return {select:document.getElementById('motion-orbital-style').value,
      state:document.querySelector('[data-ml-card="half-orbit"]').dataset.mlState,
      runtime:window.RestaurantHalfOrbit?.state?.().ready};
  });
  check('mobile · choosing Half Orbit works with a tap',
    tap.select==='half-orbit'&&tap.state==='activo'&&tap.runtime===true,`${tap.select}`);
  await page.evaluate(()=>document.querySelector('.ml-library')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(400);await page.screenshot({path:path.join(SHOTS,'mobile-01-library.png')});
  await context.close();
}

await browser.close();server.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log('screenshots -> tests/screenshots/motion-library/');
if(failed.length){console.error(`MOTION_LIBRARY_FAIL: ${failed.map(f=>f.name).join(' | ')}`);process.exit(1)}
console.log('MOTION_LIBRARY_PASS');
