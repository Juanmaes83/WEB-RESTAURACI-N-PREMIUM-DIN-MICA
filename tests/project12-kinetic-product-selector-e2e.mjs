/* PROJECT 12 — KINETIC PRODUCT SELECTOR product gate.
   Usage: node tests/project12-kinetic-product-selector-e2e.mjs */
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
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}experiences/kinetic-product-selector/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.KineticProductSelector?.state?.().ready===true,null,{timeout:15000});
  return {context,page,errors};
}

{
  const {context,page,errors}=await direct();
  const init=await page.evaluate(()=>({state:window.KineticProductSelector.state(),thumbs:document.querySelectorAll('.kps-thumb').length,title:document.getElementById('kps-title').innerText.replace(/\n/g,' ').trim(),tag:document.getElementById('kps-tagline').textContent.trim(),active:document.querySelectorAll('.kps-thumb.is-active').length}));
  check('exactly six products render',init.state.count===6&&init.thumbs===6,`${init.thumbs} thumbnails`);
  check('initial product is Midnight Wagyu',init.state.id==='midnight-wagyu'&&/MIDNIGHT\s+WAGYU/.test(init.title)&&init.tag==='DARK. BOLD. UNEXPECTED.',`${init.state.id}`);
  check('exactly one thumbnail is active',init.active===1,`${init.active} active`);
  check('thumbnail and hero are the same asset',init.state.hero===init.state.activeThumb,`${init.state.hero}`);

  for(let i=0;i<6;i++){
    await page.locator(`.kps-thumb[data-index="${i}"]`).click();await page.waitForTimeout(90);
    const state=await page.evaluate(()=>window.KineticProductSelector.state());
    const active=await page.evaluate(()=>({count:document.querySelectorAll('.kps-thumb.is-active').length,pressed:[...document.querySelectorAll('.kps-thumb')].filter(b=>b.getAttribute('aria-pressed')==='true').length}));
    check(`click ${i+1} keeps one hero/one active selector`,state.index===i&&state.hero===state.activeThumb&&active.count===1&&active.pressed===1,state.id);
  }
  check('final product exposes CTA',await page.evaluate(()=>document.getElementById('kps-stage').classList.contains('is-final')&&document.getElementById('kps-cta').getAttribute('aria-hidden')==='false'),'CTA visible');

  await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await page.waitForTimeout(80);
  check('keyboard navigation changes exactly one product',await page.evaluate(()=>window.KineticProductSelector.state().index)===1,'ArrowRight -> 02');
  check('no page errors in direct experience',errors.length===0,errors.join(' | ')||'clean');
  await page.screenshot({path:path.join(SHOTS,'01-desktop.png'),fullPage:true});
  await context.close();
}

{
  const {context,page,errors}=await direct({width:390,height:844});
  const mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth<=innerWidth,thumbs:document.querySelectorAll('.kps-thumb').length,hero:document.getElementById('kps-hero').getBoundingClientRect(),rail:document.getElementById('kps-rail').getBoundingClientRect()}));
  check('mobile keeps six selectors and no page overflow',mobile.thumbs===6&&mobile.overflow,`${mobile.thumbs} thumbs`);
  check('mobile hero remains inside viewport',mobile.hero.left>=-2&&mobile.hero.right<=392&&mobile.hero.bottom<=846,JSON.stringify(mobile.hero));
  check('mobile rail remains reachable',mobile.rail.bottom<=846&&mobile.rail.top>650,`rail top ${Math.round(mobile.rail.top)}`);
  check('no page errors on mobile',errors.length===0,errors.join(' | ')||'clean');
  await page.screenshot({path:path.join(SHOTS,'02-mobile.png'),fullPage:true});await context.close();
}

/* Studio + shell integration: one Project State, config edit reaches the Experience. */
{
  const context=await browser.newContext({viewport:{width:1440,height:960}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:30000});
  await page.locator('.studio-open').click();await page.waitForTimeout(650);await page.locator('#studio [data-panel="motion"]').click();
  await page.waitForFunction(()=>window.RestaurantMotionLibrary?.state?.().count===17&&document.documentElement.dataset.kpsStudio==='ready',null,{timeout:25000});
  const library=await page.evaluate(()=>({count:window.RestaurantMotionLibrary.state().count,card:!!document.querySelector('[data-ml-card="kinetic-product-selector"]'),button:!!document.querySelector('[data-ml-card="kinetic-product-selector"] [data-kps-configure]'),shell:window.RestaurantExperienceShell.experiences().some(e=>e.id==='kinetic-product-selector')}));
  check('Motion Library exposes Kinetic Product Selector as engine 17',library.count===17&&library.card,`${library.count} engines`);
  check('Studio exposes a dedicated personalization action',library.button,'Personalizar present');
  check('Experience Shell knows the new productive entrypoint',library.shell,'shell registry present');

  await page.locator('[data-ml-card="kinetic-product-selector"] [data-kps-configure]').click();
  await page.locator('[data-kps-product="0"] [data-kps-key="name"]').fill('NIGHT TEST');
  await page.locator('[data-kps-product="0"] [data-kps-key="name"]').dispatchEvent('input');await page.waitForTimeout(180);
  const saved=await page.evaluate(()=>window.RestaurantStudioConfig.get('kineticProductSelector.products')[0].name);
  check('personalization writes to existing Project State',saved==='NIGHT TEST',saved);

  await page.locator('[data-kps-preview]').click();
  await page.waitForFunction(()=>document.querySelector('.xs-frame')?.contentWindow?.KineticProductSelector?.state?.().ready===true,null,{timeout:15000});
  const child=await page.evaluate(()=>({framed:document.querySelector('.xs-frame').contentDocument.documentElement.dataset.kpsSource,title:document.querySelector('.xs-frame').contentDocument.getElementById('kps-title').innerText.replace(/\n/g,' ').trim(),frames:document.querySelectorAll('.xs-frame').length}));
  check('shell passes personalized Project State into the engine',child.framed==='project'&&child.title==='NIGHT TEST'&&child.frames===1,`${child.title} · ${child.frames} frame`);
  check('no page errors while configuring/opening the engine',errors.length===0,errors.join(' | ')||'clean');
  await page.screenshot({path:path.join(SHOTS,'03-studio-shell.png'),fullPage:true});await context.close();
}

await browser.close();server.close();
const failed=results.filter(r=>!r.ok);console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
if(failed.length){console.error(`KPS_FAIL: ${failed.map(x=>x.name).join(' | ')}`);process.exit(1)}
console.log('KPS_PASS');