/* PROJECT 12 — KINETIC PRODUCT SELECTOR product gate.
   Validates rendered assets, interaction parity, finite autoplay and Studio/Shell integration. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'tests','screenshots','kinetic-product-selector');
fs.mkdirSync(SHOTS,{recursive:true});
const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function direct(viewport={width:1440,height:900}){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];const network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>network.push(`${r.url()} :: ${r.failure()?.errorText||'failed'}`));
  page.on('response',r=>{if(r.url().includes('/assets/kinetic-product-selector/')&&r.status()>=400)network.push(`${r.status()} ${r.url()}`)});
  await page.goto(`${BASE}/experiences/kinetic-product-selector/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.KineticProductSelector?.state?.().ready===true,null,{timeout:20000});
  return {context,page,errors,network};
}

{
  const {context,page,errors,network}=await direct();
  const init=await page.evaluate(()=>({state:window.KineticProductSelector.state(),thumbs:document.querySelectorAll('.kps-thumb').length,title:document.getElementById('kps-title').innerText.replace(/\n/g,' ').trim(),tag:document.getElementById('kps-tagline').textContent.trim(),active:document.querySelectorAll('.kps-thumb.is-active').length,loaded:[...document.querySelectorAll('.kps-thumb img')].map(i=>({complete:i.complete,w:i.naturalWidth,h:i.naturalHeight})),hero:document.getElementById('kps-hero').getBoundingClientRect(),arrows:[...document.querySelectorAll('.kps-arrow')].map(b=>getComputedStyle(b).display!=='none'&&b.getBoundingClientRect().width>0)}));
  check('exactly six products render',init.state.count===6&&init.thumbs===6,`${init.thumbs} thumbnails`);
  check('all six approved assets decode',init.state.assetsReady&&init.loaded.length===6&&init.loaded.every(x=>x.complete&&x.w>0&&x.h>0),JSON.stringify(init.loaded));
  check('initial product is Midnight Wagyu',init.state.id==='midnight-wagyu'&&/MIDNIGHT\s+WAGYU/.test(init.title)&&init.tag==='DARK. BOLD. UNEXPECTED.',init.state.id);
  check('exactly one thumbnail is active',init.active===1,`${init.active} active`);
  check('thumbnail and hero are the same asset',init.state.hero===init.state.activeThumb,init.state.hero);
  check('hero is visually dominant on desktop',init.hero.height>=450&&init.hero.width>=450,`${Math.round(init.hero.width)}x${Math.round(init.hero.height)}`);
  check('visible previous and next arrows exist',init.arrows.length===2&&init.arrows.every(Boolean),JSON.stringify(init.arrows));

  for(let i=0;i<6;i++){
    await page.locator(`.kps-thumb[data-index="${i}"]`).click();
    await page.waitForFunction(index=>{const s=window.KineticProductSelector.state();const h=document.getElementById('kps-hero');return s.index===index&&h.complete&&h.naturalWidth>0},i);
    const state=await page.evaluate(()=>window.KineticProductSelector.state());
    const active=await page.evaluate(()=>({count:document.querySelectorAll('.kps-thumb.is-active').length,pressed:[...document.querySelectorAll('.kps-thumb')].filter(b=>b.getAttribute('aria-pressed')==='true').length}));
    check(`click ${i+1} renders the matching hero`,state.index===i&&state.heroNaturalWidth>0&&state.hero===state.activeThumb&&active.count===1&&active.pressed===1,`${state.id} ${state.heroNaturalWidth}px`);
  }
  check('final product exposes CTA',await page.evaluate(()=>document.getElementById('kps-stage').classList.contains('is-final')&&document.getElementById('kps-cta').getAttribute('aria-hidden')==='false'),'CTA visible');

  await page.locator('#kps-prev').click();check('visible previous arrow changes product',(await page.evaluate(()=>window.KineticProductSelector.state().index))===4,'06 -> 05');
  await page.locator('#kps-next').click();check('visible next arrow changes product',(await page.evaluate(()=>window.KineticProductSelector.state().index))===5,'05 -> 06');

  await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await page.waitForTimeout(60);
  check('global keyboard navigation changes exactly one product',(await page.evaluate(()=>window.KineticProductSelector.state().index))===1,'ArrowRight -> 02');

  await page.mouse.move(980,500);await page.mouse.down();await page.mouse.move(760,500,{steps:6});await page.mouse.up();await page.waitForTimeout(80);
  check('mouse drag/swipe changes product',(await page.evaluate(()=>window.KineticProductSelector.state().index))===2,'drag left -> 03');

  await page.locator('#kps-nav [data-kps-nav="story"]').click();check('OUR STORY has a visible action',await page.locator('#kps-story-panel').evaluate(el=>el.classList.contains('is-open')),'story panel opens');
  await page.locator('#kps-bag').click();check('BAG has a visible action',await page.locator('#kps-bag-panel').evaluate(el=>el.classList.contains('is-open')),'bag panel opens');
  await page.locator('#kps-nav [data-kps-nav="order"]').click();await page.waitForTimeout(450);check('ORDER navigates to final CTA',(await page.evaluate(()=>window.KineticProductSelector.state().index))===5&&await page.locator('#kps-cta').isVisible(),'final product selected');
  await page.locator('#kps-cta').click();check('CTA has visible fallback action',await page.locator('#kps-toast').evaluate(el=>el.classList.contains('is-visible')),'toast visible');

  await page.evaluate(()=>{window.KineticProductSelector.select(4);window.KineticProductSelector.startAutoplay()});
  await page.waitForTimeout(2300);
  const autoplay=await page.evaluate(()=>window.KineticProductSelector.state());
  check('autoplay stops and holds on product 06',autoplay.index===5&&autoplay.autoplay===false,`${autoplay.index+1} / autoplay ${autoplay.autoplay}`);

  check('no product asset network failures',network.length===0,network.join(' | ')||'clean');
  check('no page errors in direct experience',errors.length===0,errors.join(' | ')||'clean');
  await page.screenshot({path:path.join(SHOTS,'01-desktop.png'),fullPage:true});await context.close();
}

{
  const {context,page,errors,network}=await direct({width:390,height:844});
  const mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth<=innerWidth,thumbs:document.querySelectorAll('.kps-thumb').length,hero:document.getElementById('kps-hero').getBoundingClientRect(),rail:document.getElementById('kps-rail').getBoundingClientRect(),loaded:[...document.querySelectorAll('.kps-thumb img')].every(i=>i.complete&&i.naturalWidth>0)}));
  check('mobile keeps six selectors and no page overflow',mobile.thumbs===6&&mobile.overflow&&mobile.loaded,`${mobile.thumbs} thumbs`);
  check('mobile hero remains visible and substantial',mobile.hero.left>=-2&&mobile.hero.right<=392&&mobile.hero.bottom<=846&&mobile.hero.height>=260,JSON.stringify(mobile.hero));
  check('mobile rail remains reachable',mobile.rail.bottom<=846&&mobile.rail.top>650,`rail top ${Math.round(mobile.rail.top)}`);
  await page.locator('#kps-next').click();check('mobile visible arrow changes product',(await page.evaluate(()=>window.KineticProductSelector.state().index))===1,'next -> 02');
  check('no mobile asset network failures',network.length===0,network.join(' | ')||'clean');check('no page errors on mobile',errors.length===0,errors.join(' | ')||'clean');
  await page.screenshot({path:path.join(SHOTS,'02-mobile.png'),fullPage:true});await context.close();
}

/* Studio + shell integration: one Project State, config edit reaches the Experience. */
{
  const context=await browser.newContext({viewport:{width:1440,height:960}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:30000});
  await page.locator('.studio-open').click();await page.waitForTimeout(650);await page.locator('#studio button[data-panel="motion"]').click();
  await page.waitForFunction(()=>window.RestaurantMotionLibrary?.state?.().count===17&&document.documentElement.dataset.kpsStudio==='ready',null,{timeout:25000});
  const library=await page.evaluate(()=>({count:window.RestaurantMotionLibrary.state().count,card:!!document.querySelector('[data-ml-card="kinetic-product-selector"]'),button:!!document.querySelector('[data-ml-card="kinetic-product-selector"] [data-kps-configure]'),shell:window.RestaurantExperienceShell.experiences().some(e=>e.id==='kinetic-product-selector')}));
  check('Motion Library exposes Kinetic Product Selector as engine 17',library.count===17&&library.card,`${library.count} engines`);check('Studio exposes personalization',library.button,'Personalizar present');check('Experience Shell knows Project 12',library.shell,'shell registry present');
  await page.locator('[data-ml-card="kinetic-product-selector"] [data-kps-configure]').click();await page.locator('[data-kps-product="0"] [data-kps-key="name"]').fill('NIGHT TEST');await page.locator('[data-kps-product="0"] [data-kps-key="name"]').dispatchEvent('input');await page.waitForTimeout(180);
  const saved=await page.evaluate(()=>window.RestaurantStudioConfig.get('kineticProductSelector.products')[0].name);check('personalization writes to existing Project State',saved==='NIGHT TEST',saved);
  await page.locator('[data-kps-preview]').click();await page.waitForFunction(()=>document.querySelector('.xs-frame')?.contentWindow?.KineticProductSelector?.state?.().ready===true,null,{timeout:20000});
  const child=await page.evaluate(()=>({framed:document.querySelector('.xs-frame').contentDocument.documentElement.dataset.kpsSource,title:document.querySelector('.xs-frame').contentDocument.getElementById('kps-title').innerText.replace(/\n/g,' ').trim(),frames:document.querySelectorAll('.xs-frame').length,loaded:document.querySelector('.xs-frame').contentWindow.KineticProductSelector.state().heroNaturalWidth>0}));
  check('shell passes personalized Project State and loaded media',child.framed==='project'&&child.title==='NIGHT TEST'&&child.frames===1&&child.loaded,`${child.title} · ${child.frames} frame`);check('no page errors while configuring/opening engine',errors.length===0,errors.join(' | ')||'clean');
  await page.screenshot({path:path.join(SHOTS,'03-studio-shell.png'),fullPage:true});await context.close();
}

await browser.close();server.close();const failed=results.filter(r=>!r.ok);console.log(`\n${results.length-failed.length}/${results.length} checks passed`);if(failed.length){console.error(`KPS_FAIL: ${failed.map(x=>x.name).join(' | ')}`);process.exit(1)}console.log('KPS_PASS');
