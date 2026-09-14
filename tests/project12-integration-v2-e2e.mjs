/* Project 12 Integration V2 — isolated review gate.
   Does not exercise or mutate shared Restaurant/Astra modules. */
import {chromium} from 'playwright';
import {startServer} from './static-server.mjs';

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function open(viewport){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];const failures=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failures.push(`${r.failure()?.errorText||'failed'} ${r.url()}`));
  page.on('response',r=>{if(r.url().includes('/assets/kinetic-product-selector/')&&r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
  await page.goto(`${BASE}/experiences/kinetic-product-selector/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.KineticProductSelector?.state?.().ready===true&&window.RestaurantKineticProductDetail,null,{timeout:20000});
  return {context,page,errors,failures};
}

async function geometry(page){return page.evaluate(()=>{
  const bg=document.querySelector('.kps-bg').getBoundingClientRect();
  const rail=document.querySelector('.kps-rail-wrap').getBoundingClientRect();
  const hero=document.querySelector('#kps-hero').getBoundingClientRect();
  return {bgBottom:bg.bottom,railTop:rail.top,railBottom:rail.bottom,hero:{left:hero.left,right:hero.right,top:hero.top,bottom:hero.bottom,width:hero.width,height:hero.height},vw:innerWidth,vh:innerHeight,scrollWidth:document.documentElement.scrollWidth};
})}

{
  const {context,page,errors,failures}=await open({width:1440,height:900});
  const assets=await page.evaluate(()=>({thumbs:[...document.querySelectorAll('.kps-thumb img')].map(i=>({w:i.naturalWidth,h:i.naturalHeight,ok:i.complete&&i.naturalWidth>0})),hero:window.KineticProductSelector.state()}));
  check('six review assets decode',assets.thumbs.length===6&&assets.thumbs.every(x=>x.ok),JSON.stringify(assets.thumbs));
  check('six review assets have >=640px long edge',assets.thumbs.every(x=>Math.max(x.w,x.h)>=640),JSON.stringify(assets.thumbs.map(x=>`${x.w}x${x.h}`)));
  const g=await geometry(page);
  check('decorative art stops above selector rail',g.bgBottom<=g.railTop+2,`art ${Math.round(g.bgBottom)} / rail ${Math.round(g.railTop)}`);
  check('desktop hero remains dominant',g.hero.width>=450&&g.hero.height>=450,`${Math.round(g.hero.width)}x${Math.round(g.hero.height)}`);

  await page.locator('.kps-thumb[data-index="2"]').click();
  await page.waitForFunction(()=>window.KineticProductSelector.state().index===2);
  check('inactive thumbnail still selects product',await page.locator('#kps-title').innerText().then(t=>/GLAZED\s+OUTLAW/.test(t.replace(/\n/g,' '))),'03 selected');

  await page.locator('#kps-hero').click();
  await page.waitForFunction(()=>document.documentElement.dataset.kpsDetail==='open');
  check('clicking hero opens Product Detail fallback',await page.locator('#kps-product-detail').getAttribute('aria-hidden')==='false','detail open');
  check('Product Detail matches selected product',(await page.locator('#kps-detail-title').innerText()).trim()==='GLAZED OUTLAW','title matches');
  check('Product Detail exposes canonical information groups',await page.locator('#kps-detail-ingredients').innerText().then(Boolean)&&await page.locator('#kps-detail-origin').innerText().then(Boolean)&&await page.locator('#kps-detail-technique').innerText().then(Boolean)&&await page.locator('#kps-detail-pairing').innerText().then(Boolean),'fields populated');
  await page.locator('#kps-detail-close').click();
  await page.waitForFunction(()=>document.documentElement.dataset.kpsDetail==='closed');

  await page.locator('.kps-thumb[data-index="4"]').click();
  await page.waitForFunction(()=>window.KineticProductSelector.state().index===4);
  await page.locator('.kps-thumb[data-index="4"]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.kpsDetail==='open');
  check('second click on active thumbnail opens detail',(await page.locator('#kps-detail-title').innerText()).trim()==='TIDAL GOLD','05 detail');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.documentElement.dataset.kpsDetail==='closed');
  check('Escape closes detail',await page.locator('#kps-product-detail').getAttribute('aria-hidden')==='true','closed');

  check('no desktop page errors',errors.length===0,errors.join(' | ')||'clean');
  check('no desktop product asset failures',failures.length===0,failures.join(' | ')||'clean');
  await context.close();
}

for(const width of [320,360,390,430]){
  const {context,page,errors,failures}=await open({width,height:844});
  const g=await geometry(page);
  check(`${width}px has no horizontal overflow`,g.scrollWidth<=width,`${g.scrollWidth}/${width}`);
  check(`${width}px keeps art outside selector safe zone`,g.bgBottom<=g.railTop+2,`art ${Math.round(g.bgBottom)} / rail ${Math.round(g.railTop)}`);
  check(`${width}px hero stays inside viewport`,g.hero.left>=-2&&g.hero.right<=width+2&&g.hero.top>=0&&g.hero.bottom<=846,JSON.stringify(g.hero));
  check(`${width}px uses finger-sized arrows`,await page.evaluate(()=>[...document.querySelectorAll('.kps-arrow')].every(el=>{const r=el.getBoundingClientRect();return r.width>=48&&r.height>=48})),'48px+');
  await page.evaluate(()=>window.KineticProductSelector.select(5));
  await page.locator('#kps-hero').click();
  await page.waitForFunction(()=>document.documentElement.dataset.kpsDetail==='open');
  const detail=await page.locator('#kps-product-detail').boundingBox();
  check(`${width}px Product Detail is full-screen`,detail&&detail.x<=1&&detail.y<=1&&detail.width>=width-2&&detail.height>=842,detail?`${Math.round(detail.width)}x${Math.round(detail.height)}`:'missing');
  check(`${width}px detail close remains finger-sized`,await page.locator('#kps-detail-close').evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=48&&r.height>=48}),'48px+');
  await page.locator('#kps-detail-close').click();
  check(`${width}px has no page errors`,errors.length===0,errors.join(' | ')||'clean');
  check(`${width}px has no product asset failures`,failures.length===0,failures.join(' | ')||'clean');
  await context.close();
}

await browser.close();server.close();
const failed=results.filter(x=>!x.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
if(failed.length){console.error(`PROJECT12_V2_FAIL: ${failed.map(x=>x.name).join(' | ')}`);process.exit(1)}
console.log('PROJECT12_V2_PASS');
