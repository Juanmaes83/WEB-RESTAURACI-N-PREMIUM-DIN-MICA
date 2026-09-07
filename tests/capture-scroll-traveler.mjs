/* PROJECT 09 — SCROLL TRAVELER visual evidence.

   Every frame is taken by SCROLLING the page to a canonical journey position and
   waiting for the object to settle there — never by posing the traveler. That is the
   point of the evidence: the same DOM object, driven by scroll, in nine desktop
   compositions and five mobile ones.

   It refuses to capture unless the traveler is ready, the asset actually painted, and
   the route resolved to its full set of anchors: a page without the object would
   otherwise photograph as if the journey simply had nothing in that section.

   Usage: node tests/capture-scroll-traveler.mjs
   Output: tests/screenshots/scroll-traveler/*.png
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'tests','screenshots','scroll-traveler');
fs.mkdirSync(OUT,{recursive:true});

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();

const state=page=>page.evaluate(()=>window.RestaurantScrollTraveler.state());

async function enter(page,{expectMobile}){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.scrollTraveler==='ready',
    null,{timeout:30000});
  /* the object has to have really painted, not merely been created */
  await page.waitForFunction(()=>{
    const i=document.querySelector('.st-traveler .st-object');
    return !!i&&i.complete&&i.naturalWidth>0;
  },null,{timeout:20000});
  await page.evaluate(()=>window.RestaurantScrollTraveler.measure());
  const s=await state(page);
  if(!s.active||s.anchors.length<5)
    throw new Error(`refusing to capture: the route did not resolve (${JSON.stringify(s.anchors)})`);
  if(s.mobileRoute!==expectMobile)
    throw new Error(`refusing to capture: expected mobileRoute=${expectMobile}, got ${s.mobileRoute}`);
  if(!/dish-01-prawn/.test(s.asset))
    throw new Error(`refusing to capture: unexpected traveler asset ${s.asset}`);
  return s;
}

/* `travelerSettled` can still read true from the position we just left, so the last
   word is the object itself: wait until two consecutive reads agree. */
async function restPosition(page){
  let prev=null;
  for(let i=0;i<40;i++){
    const c=await page.evaluate(()=>window.RestaurantScrollTraveler.state().current);
    if(prev&&Math.abs(c.x-prev.x)<.01&&Math.abs(c.y-prev.y)<.01
      &&Math.abs(c.scale-prev.scale)<.002&&Math.abs(c.rotation-prev.rotation)<.05)return c;
    prev=c;
    await page.waitForTimeout(90);
  }
  return prev;
}

/* Land on a route position by ANCHOR, not by a pixel offset computed up front.

   The site reveals sections with ScrollTrigger, so the document grows as the visitor
   travels and a target measured from the top of the page is stale by the time the
   browser arrives. So: aim, let it settle, re-measure, aim again — until the canonical
   progress the engine reports is the one this frame is named after. */
async function land(page,anchor,fraction){
  let s=null;
  for(let pass=0;pass<6;pass++){
    const want=await page.evaluate(([i,f])=>{
      const t=window.RestaurantScrollTraveler;
      t.measure();
      return i===null?f:t.progressForAnchor(i,f);
    },[anchor,fraction]);
    await page.evaluate(p=>window.RestaurantScrollTraveler.scrollToProgress(p),want);
    await page.waitForFunction(()=>document.documentElement.dataset.travelerSettled==='1',
      null,{timeout:15000}).catch(()=>{});
    await page.waitForTimeout(280);
    s=await state(page);s.want=want;
    if(Math.abs(s.progress-want)<=.006){
      await restPosition(page);
      s=await state(page);s.want=want;
      break;
    }
  }
  return s;
}

async function shot(page,name,anchor,fraction,log){
  const s=await land(page,anchor,fraction);
  await page.screenshot({path:path.join(OUT,`${name}.png`)});
  const off=Math.abs(s.progress-s.want);
  log.push({name,anchor,fraction,wanted:+s.want.toFixed(4),progress:s.progress,
    chapter:s.chapter,layer:s.layer,z:s.zIndex,...s.current});
  console.log(`  ${name.padEnd(32)} p=${s.progress.toFixed(3)} ${String(s.chapter).padEnd(11)}`
    +`${String(s.layer).padEnd(8)}z=${String(s.zIndex).padEnd(3)}`
    +`x=${s.current.x.toFixed(1)} y=${s.current.y.toFixed(1)} s=${s.current.scale.toFixed(2)}`
    +(off>.006?`  <- wanted ${s.want.toFixed(3)}`:''));
  if(off>.02)throw new Error(`${name}: could not land on the route position `
    +`(wanted ${s.want.toFixed(3)}, reached ${s.progress.toFixed(3)})`);
}

/* ---------- desktop: nine compositions along the route ---------- */
console.log('desktop 1440x900');
{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  await enter(page,{expectMobile:false});
  const log=[];
  /* the journey's first composition, not p=0 — at zero the object is still arriving */
  await shot(page,'01-signature-start',0,0,log);
  await shot(page,'02-between-signature-origin',0,.5,log);
  await shot(page,'03-origin-anchor',1,0,log);
  await shot(page,'04-between-origin-atmosphere',1,.5,log);
  await shot(page,'05-atmosphere-anchor',2,0,log);
  await shot(page,'06-chef-approach',2,.72,log);
  await shot(page,'07-chef-landing',3,0,log);
  await shot(page,'08-reservation-approach',3,.7,log);
  await shot(page,'09-reservation-landing',null,1,log);
  fs.writeFileSync(path.join(OUT,'desktop-route-log.json'),JSON.stringify(log,null,2));
  await context.close();
}

/* ---------- mobile: its own route, five beats ---------- */
console.log('mobile 390x844');
{
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await enter(page,{expectMobile:true});
  const log=[];
  await shot(page,'mobile-01-start',0,0,log);
  await shot(page,'mobile-02-origin',1,0,log);
  await shot(page,'mobile-03-atmosphere',2,0,log);
  await shot(page,'mobile-04-chef',3,0,log);
  await shot(page,'mobile-05-reservation',null,1,log);
  /* the traveler must never be the reason the page scrolls sideways */
  const overflow=await page.evaluate(()=>({
    doc:document.documentElement.scrollWidth,win:innerWidth,
    rect:(()=>{const r=document.querySelector('.st-traveler').getBoundingClientRect();
      return {left:Math.round(r.left),right:Math.round(r.right)}})()}));
  fs.writeFileSync(path.join(OUT,'mobile-route-log.json'),
    JSON.stringify({route:log,overflow},null,2));
  console.log(`  horizontal overflow: doc=${overflow.doc} win=${overflow.win}`);
  await context.close();
}

/* ---------- reduced motion ---------- */
console.log('reduced motion');
{
  const context=await browser.newContext({viewport:{width:1440,height:900},
    reducedMotion:'reduce'});
  const page=await context.newPage();
  const s=await enter(page,{expectMobile:false});
  if(!s.reduced)throw new Error('refusing to capture: the page does not see reduced motion');
  const at=await land(page,2,0);
  await page.screenshot({path:path.join(OUT,'reduced-motion.png')});
  console.log(`  reduced-motion.png              p=${at.progress.toFixed(3)} ${at.chapter}`);
  await context.close();
}

await browser.close();server.close();
console.log(`\nevidence -> tests/screenshots/scroll-traveler/`);
