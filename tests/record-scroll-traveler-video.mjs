/* PROJECT 09 — SCROLL TRAVELER motion evidence.

   One slow, continuous scroll from the start of the journey to the reservation, with
   a short hold at each chapter — because the claim being evidenced is not "there is an
   animation" but "it is the SAME object, and it travels". A cut, a jump or a fade
   would be visible in this clip, which is the point of recording it this way.

   It also reverses direction once: an object that only works forwards is a sequence of
   states, not a journey.

   It refuses to record unless the traveler is ready with its route resolved and its
   object painted — a clip of the page without the traveler would look like evidence.

   Usage: node tests/record-scroll-traveler-video.mjs
   Output: tests/video/scroll-traveler-desktop.webm · scroll-traveler-mobile.webm
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'tests','video');
fs.mkdirSync(OUT,{recursive:true});

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();

async function enter(page,expectMobile){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.scrollTraveler==='ready',
    null,{timeout:30000});
  await page.waitForFunction(()=>{
    const i=document.querySelector('.st-traveler .st-object');
    return !!i&&i.complete&&i.naturalWidth>0;
  },null,{timeout:20000});
  await page.evaluate(()=>window.RestaurantScrollTraveler.measure());
  const s=await page.evaluate(()=>window.RestaurantScrollTraveler.state());
  if(!s.active||s.anchors.length<5)
    throw new Error(`refusing to record: the route did not resolve (${s.anchors.length} anchors)`);
  if(s.mobileRoute!==expectMobile)
    throw new Error(`refusing to record: expected mobileRoute=${expectMobile}, got ${s.mobileRoute}`);
  if(!/dish-01-prawn/.test(s.asset))
    throw new Error(`refusing to record: unexpected object ${s.asset}`);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(1400);
}

/* one continuous pass, paced by requestAnimationFrame so the clip shows real motion
   rather than a series of jumps */
const journey=({seconds,holds,reverse})=>async page=>{
  await page.evaluate(async ({seconds,holds,reverse})=>{
    const t=window.RestaurantScrollTraveler;
    t.measure();
    const start=t.scrollToProgress(0);
    await new Promise(r=>setTimeout(r,900));
    t.measure();
    const doc=document.scrollingElement;
    const end=Math.min(doc.scrollHeight-innerHeight,t.scrollToProgress(1));
    scrollTo({top:start,behavior:'instant'});
    await new Promise(r=>setTimeout(r,900));

    const frame=()=>new Promise(r=>requestAnimationFrame(r));
    const glide=async(from,to,ms)=>{
      const t0=performance.now();
      for(;;){
        const k=Math.min(1,(performance.now()-t0)/ms);
        scrollTo({top:from+(to-from)*k,behavior:'instant'});
        await frame();
        if(k>=1)break;
      }
    };
    /* forward, holding where each composition resolves */
    const stops=holds.map(h=>start+(end-start)*h);
    let at=start;
    for(const s of stops){
      await glide(at,s,(seconds*1000)/stops.length);
      at=s;
      await new Promise(r=>setTimeout(r,900));
    }
    await glide(at,end,900);
    await new Promise(r=>setTimeout(r,1500));
    /* and back up again: the object has to travel in both directions */
    if(reverse){
      await glide(end,start+(end-start)*.45,reverse);
      await new Promise(r=>setTimeout(r,1200));
      await glide(start+(end-start)*.45,end,reverse*.8);
      await new Promise(r=>setTimeout(r,1200));
    }
  },{seconds,holds,reverse});
};

async function record(name,viewport,mobile,script){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,
    recordVideo:{dir:OUT,size:viewport}});
  const page=await context.newPage();
  await enter(page,mobile);
  await script(page);
  const video=page.video();
  await context.close();
  const tmp=await video.path();
  const dest=path.join(OUT,`${name}.webm`);
  fs.rmSync(dest,{force:true});
  /* a copy-trim cannot cut a webm lead-in, so re-encode */
  const trimmed=spawnSync('ffmpeg',['-loglevel','error','-ss','1.6','-i',tmp,
    '-c:v','libvpx','-b:v','2M','-cpu-used','4','-deadline','realtime','-an',dest,'-y'],
    {encoding:'utf8'});
  if(trimmed.status!==0||!fs.existsSync(dest)||fs.statSync(dest).size<10240){
    fs.rmSync(dest,{force:true});fs.renameSync(tmp,dest);
    console.log(`${name}: trim unavailable, keeping the raw clip`);
  }else fs.rmSync(tmp,{force:true});
  console.log(`${name} -> ${dest} (${Math.round(fs.statSync(dest).size/1024)}KB)`);
}

await record('scroll-traveler-desktop',{width:1440,height:900},false,
  journey({seconds:22,holds:[.14,.34,.56,.78,1],reverse:2600}));
await record('scroll-traveler-mobile',{width:390,height:844},true,
  journey({seconds:18,holds:[.14,.34,.56,.78,1],reverse:2200}));

await browser.close();server.close();
console.log('\nmotion evidence written to tests/video/');
