/* Deliverable check for a public URL.
   Class 04, error #9: a URL is not deliverable because a workflow ran. It must open,
   load its assets, run the experience, open Studio, and survive a save + reload.

   Usage: node tests/live-url-check.mjs <url> [preset]
*/
import {chromium} from 'playwright';

const URL_=process.argv[2];
const PRESET=process.argv[3]||'depth-carousel';
if(!URL_){console.error('usage: node tests/live-url-check.mjs <url> [preset]');process.exit(2)}

/* One deliverable check, two motion presets. The per-preset differences are the
   runtime global, the ready flag and what "the experience is on screen" means. */
const PRESETS={
  'depth-carousel':{global:'RestaurantDepthCarousel',ready:()=>document.documentElement.dataset.depthCarousel==='ready',
    label:'Depth Carousel',
    layers:()=>[...document.querySelectorAll('.dc-plate')].filter(p=>+getComputedStyle(p).opacity>.05).length,
    layerName:'carousel renders multiple depth levels',layerMin:3,layerUnit:'visible plates'},
  'anchor-scenes':{global:'RestaurantAnchorScenes',ready:()=>document.documentElement.dataset.anchorScenes==='ready',
    label:'Anchor Scenes',
    /* not just "has an image": the deployed pixels must be the real master set from
       the runtime folder, or the URL is serving something else */
    layers:()=>[...document.querySelectorAll('.sc-scene')].filter(s=>{
      const bg=getComputedStyle(s.querySelector('.sc-subject')||s).backgroundImage||'';
      return /\/assets\/anchor-scenes\/runtime\/scene-\d\d-[a-z-]+\.webp/.test(bg)}).length,
    layerName:'both master scenes resolve from the real runtime set',layerMin:2,
    layerUnit:'real master scenes'},
  'orbital-food':{global:'RestaurantOrbitalFood',ready:()=>document.documentElement.dataset.orbitalFood==='ready',
    label:'Orbital Food Slider',
    /* products composed by the preset, counted through the engine's own elements */
    layers:()=>[...document.querySelectorAll('#orbit-stage .orbit-dish[data-orbit-front]')]
      .filter(el=>+getComputedStyle(el).opacity>.05).length,
    layerName:'the whole collection is on the orbit',layerMin:6,layerUnit:'products in orbit'},
  'pizza-slice-orbit':{global:'RestaurantPizzaSliceOrbit',
    ready:()=>document.documentElement.dataset.pizzaSliceOrbit==='ready',
    label:'Pizza Slice Orbit',
    /* eight real slices from the runtime folder, and the fixed station present */
    layers:()=>{
      const ok=[...document.querySelectorAll('.ps-slice .ps-slice-img')]
        .filter(i=>/^assets\/pizza-motion\/runtime\/slices\//.test(i.getAttribute('src')||'')
          &&i.complete&&i.naturalWidth>0).length;
      return document.querySelector('.ps-station svg')?ok:0;
    },
    layerName:'eight slices load and the fixed station is drawn',layerMin:8,
    layerUnit:'slices in orbit',
    /* this preset owns its own controls and counter: the base ones are hidden */
    next:'.ps-next',counter:'.ps-counter'}
};
const SPEC=PRESETS[PRESET];
if(!SPEC){console.error(`unknown preset: ${PRESET}`);process.exit(2)}

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
try{await page.waitForFunction(g=>!!window[g],SPEC.global,{timeout:20000})}catch{runtimeUp=false}
check(`${SPEC.label} runtime present`,runtimeUp);

/* Wait for the option itself: assigning a value a <select> does not yet contain
   silently resets it to "" and the preset would never be applied. */
await page.waitForFunction(p=>!!document.querySelector(`#motion-orbital-style option[value="${p}"]`),PRESET,{timeout:20000});
await page.evaluate(p=>{
  const s=document.getElementById('motion-orbital-style');
  s.value=p;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
  window.RestaurantMotionStudio?.publish?.();
},PRESET);
await page.waitForFunction(SPEC.ready,null,{timeout:12000});
check('preset is the active motion language',
  await page.evaluate(p=>document.documentElement.dataset.orbitalMotion===p,PRESET));
await page.locator('#signature').scrollIntoViewIfNeeded();
await page.waitForTimeout(900);

/* Wait for the experience to finish arriving before judging it: sampling the instant
   after a scroll measures the network, not the build. */
await page.waitForFunction(([fn,min])=>{
  try{return (new Function(`return (${fn})()`))()>=min}catch{return false}
},[SPEC.layers.toString(),SPEC.layerMin],{timeout:15000}).catch(()=>{});
const visible=await page.evaluate(SPEC.layers);
check(SPEC.layerName,visible>=SPEC.layerMin,`${visible} ${SPEC.layerUnit}`);

const NEXT=SPEC.next||'#next-dish', COUNTER=SPEC.counter||'#dish-counter';
const readCounter=()=>page.evaluate(sel=>document.querySelector(sel)?.textContent.trim()||'',COUNTER);
const i0=await readCounter();
await page.click(NEXT);
await page.waitForTimeout(1600);
const i1=await readCounter();
check('navigation works live',i0!==i1&&!!i1,`${i0} → ${i1}`);

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

/* ---- Scroll Traveler: transversal, so it is checked whichever preset was asked for.
   This runs after the reload above, which makes it a persistence check too. ---- */
let travelerUp=true;
try{await page.waitForFunction(()=>document.documentElement.dataset.scrollTraveler==='ready',
  null,{timeout:20000})}catch{travelerUp=false}
check('Scroll Traveler is live and survived the reload',travelerUp);
if(travelerUp){
  const obj=await page.evaluate(async()=>{
    const t=window.RestaurantScrollTraveler;
    t.measure();
    const img=document.querySelector('.st-traveler .st-object');
    return {layers:document.querySelectorAll('.st-traveler').length,
      src:img?.getAttribute('src')||'',loaded:!!img&&img.complete&&img.naturalWidth>0,
      anchors:t.state().anchors.length};
  });
  check('the traveler object is the deployed runtime cut and it loaded',
    obj.loaded&&/^assets\/scroll-traveler\/runtime\//.test(obj.src),
    `${obj.src} ${obj.loaded?'loaded':'DID NOT LOAD'}`);
  check('one traveler layer with its full route resolved',
    obj.layers===1&&obj.anchors>=5,`${obj.layers} layer, ${obj.anchors} anchors`);
  const travel=await page.evaluate(async()=>{
    const t=window.RestaurantScrollTraveler;
    const doc=document.scrollingElement;
    const seen=[];
    scrollTo({top:0,behavior:'instant'});
    await new Promise(r=>setTimeout(r,500));
    t.measure();
    for(let i=0;i<=16;i++){
      scrollTo({top:(doc.scrollHeight-innerHeight)*(i/16),behavior:'instant'});
      await new Promise(r=>setTimeout(r,140));
      const st=t.state();
      seen.push({p:+st.progress.toFixed(3),chapter:st.chapter});
    }
    return {first:seen[0].p,last:seen[seen.length-1].p,
      chapters:[...new Set(seen.map(s=>s.chapter))].filter(Boolean)};
  });
  check('the object really travels when the live page is scrolled',
    travel.first<=.02&&travel.last>=.98&&travel.chapters.length>=4,
    `${travel.first} → ${travel.last} through ${travel.chapters.join(', ')}`);
}

const fatal=errors.filter(e=>!/favicon|net::ERR/i.test(e));
check('no JS errors',fatal.length===0,fatal.slice(0,3).join(' | '));

await browser.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} live checks passed`);
if(failed.length){console.error(`LIVE_URL_FAIL: ${failed.map(f=>f.name).join(' | ')}`);process.exit(1)}
console.log('LIVE_URL_DELIVERABLE');
