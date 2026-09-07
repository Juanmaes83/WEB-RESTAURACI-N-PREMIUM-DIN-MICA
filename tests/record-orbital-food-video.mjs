/* PROJECT 03 — motion evidence.

   Desktop: idle → slow drag 0→.5 → hold → finish → next → prev → click a neighbour →
            click the hero → detail → close → change preset → Orbital baseline restored
   Mobile:  idle → partial swipe → cancel → full swipe → next → detail → close

   It refuses to record unless Orbital Food Slider is the active preset AND the
   products on stage are being composed by it: a clip of another preset would look
   like evidence and be worthless.

   Usage: node tests/record-orbital-food-video.mjs
   Output: tests/video/orbital-food-desktop.webm · orbital-food-mobile.webm
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

async function selectPreset(page,value,readyFlag){
  await page.waitForFunction(v=>!!document.querySelector(`#motion-orbital-style option[value="${v}"]`),value,{timeout:30000});
  await page.evaluate(v=>{
    const s=document.getElementById('motion-orbital-style');
    s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  },value);
  if(readyFlag)await page.waitForFunction(f=>document.documentElement.dataset[f]==='ready',readyFlag,{timeout:20000});
}

async function enter(page){
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:30000});
  await selectPreset(page,'orbital-food','orbitalFood');
  /* Hard gate — but wait for the composition to exist first: the ready flag lands
     before the renderer has painted a frame, so an immediate sample can refuse a
     preset that was about to be fine. */
  await page.waitForFunction(()=>
    document.querySelectorAll('#orbit-stage .orbit-dish[data-orbit-front]').length>=6,
    null,{timeout:20000}).catch(()=>{});
  const gate=await page.evaluate(()=>{
    const st=window.RestaurantOrbitalFood?.state?.()||{};
    return {mode:document.documentElement.dataset.orbitalMotion,ready:st.ready,
      renderer:st.usesEngineRenderer,stage:document.querySelector('.of-stage')?.hidden!==true,
      products:document.querySelectorAll('#orbit-stage .orbit-dish[data-orbit-front]').length};
  });
  if(gate.mode!=='orbital-food'||!gate.ready||!gate.renderer||!gate.stage||gate.products<6)
    throw new Error(`refusing to record: Orbital Food Slider is not composing the stage (${JSON.stringify(gate)})`);
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
}
async function ensureDetailClosed(page){
  const open=await page.evaluate(()=>document.getElementById('dish-detail')?.classList.contains('is-open'));
  if(!open)return;
  await page.evaluate(()=>document.querySelector('#detail-close')?.click());
  await page.waitForFunction(()=>!document.getElementById('dish-detail')?.classList.contains('is-open'),null,{timeout:8000});
  await page.waitForTimeout(900);
}

async function record(name,viewport,mobile,script){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,
    recordVideo:{dir:OUT,size:viewport}});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await enter(page);
  await script(page,context);
  const video=page.video();
  await context.close();
  const tmp=await video.path();
  const dest=path.join(OUT,`${name}.webm`);
  fs.rmSync(dest,{force:true});
  /* Playwright starts recording at context creation, so the clip opens on the
     browser's blank page. -c copy cannot cut it: ffmpeg seeks to the previous
     keyframe, which is frame 0, so the white lead-in survives. Re-encode the trim. */
  const trimmed=spawnSync('ffmpeg',['-loglevel','error','-ss','1.8','-i',tmp,
    '-c:v','libvpx','-b:v','2M','-cpu-used','4','-deadline','realtime','-an',dest,'-y'],{encoding:'utf8'});
  if(trimmed.status!==0||!fs.existsSync(dest)||fs.statSync(dest).size<10240){
    fs.rmSync(dest,{force:true});fs.renameSync(tmp,dest);
    console.log(`${name}: trim unavailable, keeping the raw clip`);
  }else fs.rmSync(tmp,{force:true});
  console.log(`${name} → ${dest} (${Math.round(fs.statSync(dest).size/1024)}KB)`);
}

await record('orbital-food-desktop',{width:1440,height:900},false,async page=>{
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width*.62, cy=Math.min(Math.max(box.y+box.height*.5,40),860);
  await page.waitForTimeout(1600);

  /* a slow drag held on the crossover, so both products read mid-orbit */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=12;i++){await page.mouse.move(cx-i*10,cy);await page.waitForTimeout(34)}
  await page.waitForTimeout(1700);
  for(let i=13;i<=24;i++){await page.mouse.move(cx-i*10,cy);await page.waitForTimeout(34)}
  await page.mouse.up();
  await page.waitForTimeout(1900);

  /* buttons converge on the same engine */
  await page.click('#next-dish');await page.waitForTimeout(1700);
  await page.click('#prev-dish');await page.waitForTimeout(1700);

  /* clicking a neighbour brings it to the front of the orbit */
  const neighbour=await page.evaluate(()=>{
    const els=[...document.querySelectorAll('#orbit-stage .orbit-dish')];
    const s=els.map((el,i)=>({i,f:+el.dataset.orbitFront})).sort((a,b)=>b.f-a.f)[1];
    const r=els[s.i].getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  });
  await page.mouse.click(neighbour.x,Math.min(Math.max(neighbour.y,40),860));
  await page.waitForTimeout(2100);

  /* clicking the hero opens the real dish detail */
  const hero=await page.evaluate(()=>{
    const r=document.querySelector('#orbit-stage .orbit-dish[data-orbit-hero="1"]').getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  });
  await page.mouse.click(hero.x,Math.min(Math.max(hero.y,40),860));
  await page.waitForTimeout(2600);
  await ensureDetailClosed(page);
  await page.waitForTimeout(1400);

  /* and the approved baseline comes back untouched */
  await selectPreset(page,'elegant');
  await page.waitForTimeout(2300);
});

await record('orbital-food-mobile',{width:390,height:844},true,async(page,context)=>{
  const cdp=await context.newCDPSession(page);
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width*.5, cy=Math.min(Math.max(box.y+box.height*.45,40),800);
  await page.waitForTimeout(1700);

  const swipe=async(distance,steps,delay,hold)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});
    for(let i=1;i<=steps;i++){
      await page.waitForTimeout(delay);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+(distance*i)/steps,y:cy}]});
      if(hold&&i===Math.round(steps/2))await page.waitForTimeout(hold);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };

  await swipe(-52,6,30,0);        /* a short pull that falls back */
  await page.waitForTimeout(1800);
  await swipe(-190,14,30,1500);   /* slow, held on the crossover */
  await page.waitForTimeout(2100);
  await page.click('#next-dish');
  await page.waitForTimeout(1900);
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(2500);
  await ensureDetailClosed(page);
  await page.waitForTimeout(1300);
});

await browser.close();server.close();
console.log('\nmotion evidence written to tests/video/');
