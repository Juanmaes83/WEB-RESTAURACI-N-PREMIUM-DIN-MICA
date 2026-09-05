/* Deliverable check for a public URL.
   Class 04, error #9: a URL is not deliverable because a workflow ran. It must open,
   load its assets, run the experience, open Studio, and survive a save + reload.

   Usage: node tests/live-url-check.mjs <url> [preset]
*/
import {chromium} from 'playwright';

const URL_=process.argv[2];
const PRESET=process.argv[3]||'depth-carousel';
if(!URL_){console.error('usage: node tests/live-url-check.mjs <url> [preset]');process.exit(2)}

const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();
const errors=[],failedAssets=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).host===new URL(URL_).host)failedAssets.push(`${r.status()} ${r.url()}`)});

const resp=await page.goto(URL_,{waitUntil:'domcontentloaded',timeout:45000});
check('HTTP 200',resp?.status()===200,String(resp?.status()));

await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
check('experience boots (dishes rendered)',true);
check('no failed same-origin assets',failedAssets.length===0,failedAssets.slice(0,3).join(' | '));

const notBlank=await page.evaluate(()=>document.body.innerText.trim().length>200);
check('not a blank screen',notBlank);

/* The preset is loaded dynamically by class4-runtime-guard, so it lands after boot. */
let runtimeUp=true;
try{await page.waitForFunction(()=>!!window.RestaurantDepthCarousel,null,{timeout:20000})}catch{runtimeUp=false}
check('Depth Carousel runtime present',runtimeUp);

/* Wait for the option itself: assigning a value a <select> does not yet contain
   silently resets it to "" and the preset would never be applied. */
await page.waitForFunction(p=>!!document.querySelector(`#motion-orbital-style option[value="${p}"]`),PRESET,{timeout:20000});
await page.evaluate(p=>{
  const s=document.getElementById('motion-orbital-style');
  s.value=p;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
  window.RestaurantMotionStudio?.publish?.();
},PRESET);
await page.waitForFunction(()=>document.documentElement.dataset.depthCarousel==='ready',null,{timeout:12000});
await page.locator('#signature').scrollIntoViewIfNeeded();
await page.waitForTimeout(900);

const visible=await page.evaluate(()=>[...document.querySelectorAll('.dc-plate')].filter(p=>+getComputedStyle(p).opacity>.05).length);
check('carousel renders multiple depth levels',visible>=3,`${visible} visible plates`);

const i0=await page.evaluate(()=>document.getElementById('dish-counter').textContent.trim());
await page.click('#next-dish');
await page.waitForTimeout(1400);
const i1=await page.evaluate(()=>document.getElementById('dish-counter').textContent.trim());
check('navigation works live',i0!==i1,`${i0} → ${i1}`);

await page.evaluate(()=>document.querySelector('.studio-open').click());
await page.waitForTimeout(700);
check('Studio opens',await page.evaluate(()=>document.getElementById('studio').getAttribute('aria-hidden')==='false'));

/* Persistence: change the brand name, wait for the store, reload, verify it survived. */
const stamp=`LAB-${Date.now()%100000}`;
await page.evaluate(v=>{
  const input=document.querySelector('[data-path="brand.name"]');
  input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
},stamp);
await page.waitForTimeout(2500);
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
await page.waitForTimeout(1200);
const persisted=await page.evaluate(()=>document.querySelector('[data-path="brand.name"]')?.value||'');
check('save + reload persists',persisted===stamp,`${persisted||'(empty)'} vs ${stamp}`);

const presetRestored=await page.evaluate(()=>document.getElementById('motion-orbital-style')?.value);
check('preset survives reload',presetRestored===PRESET,String(presetRestored));

const fatal=errors.filter(e=>!/favicon|net::ERR/i.test(e));
check('no JS errors',fatal.length===0,fatal.slice(0,3).join(' | '));

await browser.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} live checks passed`);
if(failed.length){console.error(`LIVE_URL_FAIL: ${failed.map(f=>f.name).join(' | ')}`);process.exit(1)}
console.log('LIVE_URL_DELIVERABLE');
