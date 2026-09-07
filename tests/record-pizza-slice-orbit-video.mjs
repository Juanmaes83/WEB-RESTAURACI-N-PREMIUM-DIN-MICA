/* PROJECT 07 — motion evidence.

   Desktop: idle → slow partial drag → hold ~50% → cancel → one step → several steps
            → DISCOVER → multi-turn travel → deceleration → exact result
            → switch to Orbital Food Slider and prove it still works
   Mobile:  real swipe → complete → discover → result

   It refuses to record unless pizza-slice-orbit is the active preset with all eight
   slices on stage: a clip of another preset would look like evidence and be worthless.

   Usage: node tests/record-pizza-slice-orbit-video.mjs
   Output: tests/video/pizza-slice-orbit-desktop.webm · pizza-slice-orbit-mobile.webm
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
const MANIFEST=JSON.parse(fs.readFileSync(path.join(ROOT,'assets','pizza-motion','slices-manifest.json'),'utf8'));

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
const settle=page=>page.waitForFunction(()=>{
  const s=window.RestaurantPizzaSliceOrbit.state();
  return !s.animating&&!s.spinning&&!s.dragging;
},null,{timeout:25000});

async function enter(page){
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:30000});
  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  const gate=await page.evaluate(()=>{
    const s=window.RestaurantPizzaSliceOrbit?.state?.()||{};
    const imgs=[...document.querySelectorAll('.ps-slice .ps-slice-img')];
    return {mode:document.documentElement.dataset.orbitalMotion,ready:s.ready,count:s.count,
      stage:document.querySelector('.ps-stage')?.hidden!==true,
      station:!!document.querySelector('.ps-station svg'),
      srcs:imgs.map(i=>i.getAttribute('src'))};
  });
  const declared=new Set(MANIFEST.slices.map(s=>s.runtimeAsset));
  if(gate.mode!=='pizza-slice-orbit'||!gate.ready||gate.count!==8||!gate.stage||!gate.station)
    throw new Error(`refusing to record: Pizza Slice Orbit is not on stage (${JSON.stringify(gate)})`);
  if(gate.srcs.length!==8||!gate.srcs.every(s=>declared.has(s)))
    throw new Error(`refusing to record: the slices on stage are not the declared runtime set`);
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1600);
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

await record('pizza-slice-orbit-desktop',{width:1440,height:900},false,async page=>{
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width*.5;
  const cy=Math.min(Math.max(box.y+box.height*.62,40),860);
  await page.waitForTimeout(1700);

  /* a slow partial drag, held around half a slice, then let go short so it returns */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=9;i++){await page.mouse.move(cx-i*11,cy);await page.waitForTimeout(46)}
  await page.waitForTimeout(1500);
  await page.mouse.up();
  await settle(page);
  await page.waitForTimeout(1200);

  /* now a drag that completes */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=16;i++){await page.mouse.move(cx-i*15,cy);await page.waitForTimeout(30)}
  await page.mouse.up();
  await settle(page);
  await page.waitForTimeout(1300);

  /* several deliberate steps, one slice at a time */
  for(let k=0;k<3;k++){
    await page.click('.ps-next');
    await settle(page);
    await page.waitForTimeout(700);
  }
  await page.click('.ps-prev');
  await settle(page);
  await page.waitForTimeout(1200);

  /* DISCOVER: real multi-turn travel to a deterministic slice */
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.spin({target:6,turns:3}));
  await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:25000});
  await settle(page);
  await page.waitForTimeout(2400);

  /* and the approved preset comes back untouched */
  await selectPreset(page,'orbital-food','orbitalFood');
  await page.waitForTimeout(1400);
  await page.click('#next-dish');
  await page.waitForTimeout(2200);
});

await record('pizza-slice-orbit-mobile',{width:390,height:844},true,async(page,context)=>{
  const cdp=await context.newCDPSession(page);
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width*.5;
  const cy=Math.min(Math.max(box.y+box.height*.6,40),800);
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

  await swipe(-40,5,34,0);          /* a short pull that returns */
  await settle(page);
  await page.waitForTimeout(1500);
  await swipe(-170,12,32,1200);     /* slow, held mid-travel, then completing */
  await settle(page);
  await page.waitForTimeout(1600);
  await swipe(-150,10,26,0);
  await settle(page);
  await page.waitForTimeout(1300);

  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.spin({target:2,turns:2}));
  await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:25000});
  await settle(page);
  await page.waitForTimeout(2400);
});

await browser.close();server.close();
console.log('\nmotion evidence written to tests/video/');
