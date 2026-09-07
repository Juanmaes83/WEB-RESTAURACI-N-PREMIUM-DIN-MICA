/* PROJECT 02 PIVOT — motion evidence.
   idle → slow drag → hold at 50% with both scenes and both worlds on stage →
   continue → snap → reverse drag → a partial pull that cancels → dish detail.

   It refuses to record the wrong preset: a video of the wrong mode is a failure, not
   evidence, and that mistake has already cost us once.

   Usage: node tests/record-anchor-scenes-video.mjs
   Output: tests/video/anchor-scenes-desktop.webm · anchor-scenes-mobile.webm
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
const MANIFEST=JSON.parse(fs.readFileSync(path.join(ROOT,'assets','anchor-scenes','scenes-manifest.json'),'utf8'));

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();

async function selectPreset(page){
  await page.waitForFunction(()=>!!document.querySelector('#motion-orbital-style option[value="anchor-scenes"]'),null,{timeout:25000});
  await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='anchor-scenes';
    s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  });
  await page.waitForFunction(()=>document.documentElement.dataset.anchorScenes==='ready',null,{timeout:14000});
  /* Hard gate. The recording must be of THIS preset, with the scenes resolved, and
     the pixels on screen must be the real master photography — a clip of a proxy
     that slipped through would look like evidence and be worthless. */
  const gate=await page.evaluate(()=>{
    const painted=[...document.querySelectorAll('.sc-scene[data-kind="scene"] .sc-subject')]
      .map(el=>{const m=/url\(["']?([^"')]+)/.exec(getComputedStyle(el).backgroundImage||'');return m?m[1]:''});
    return {
      preset:document.documentElement.dataset.orbitalMotion,
      resolved:document.querySelectorAll('.sc-scene[data-kind="scene"]').length,
      staged:document.querySelector('.sc-stage')?.hidden!==true,
      painted
    };
  });
  const fromRuntime=gate.painted.length===2
    && gate.painted.every(u=>/\/assets\/anchor-scenes\/runtime\/scene-\d\d-/.test(u));
  const declared=new Set(MANIFEST.scenes.map(s=>s.runtimeAsset.split('/').pop()));
  const isReal=MANIFEST.kind==='real'&&MANIFEST.source==='MANO+OBJETO/'
    && gate.painted.every(u=>declared.has(u.split('/').pop()));
  if(gate.preset!=='anchor-scenes'||gate.resolved!==2||!gate.staged)
    throw new Error(`refusing to record: anchor-scenes is not the active, resolved preset (${JSON.stringify(gate)})`);
  if(!fromRuntime||!isReal)
    throw new Error(`refusing to record: the scenes on screen are not the real master set (${gate.painted.join(' ')})`);
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
}
async function grabPoint(page,viewport){
  const box=await page.locator('.orbit-shell').boundingBox();
  const x=box.x+box.width*0.55;
  for(const f of [0.42,0.5,0.34,0.6]){
    const y=Math.min(Math.max(box.y+box.height*f,26),viewport.height-26);
    const ok=await page.evaluate(([px,py])=>{
      const el=document.elementFromPoint(px,py);return !!el&&!!el.closest('.orbit-shell');
    },[x,y]);
    if(ok)return {x,y};
  }
  throw new Error('no grabbable point inside .orbit-shell');
}
async function ensureDetailClosed(page){
  const open=await page.evaluate(()=>document.getElementById('dish-detail')?.classList.contains('is-open'));
  if(!open)return;
  await page.evaluate(()=>document.querySelector('#detail-close')?.click());
  await page.waitForFunction(()=>!document.getElementById('dish-detail')?.classList.contains('is-open'),null,{timeout:6000});
  await page.waitForTimeout(800);
}

async function record(name,viewport,mobile,script){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,
    recordVideo:{dir:OUT,size:viewport}});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await selectPreset(page);
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

await record('anchor-scenes-desktop',{width:1440,height:900},false,async page=>{
  const {x:cx,y:cy}=await grabPoint(page,{width:1440,height:900});
  await page.waitForTimeout(1700);

  /* slow drag, held on the crossover so both scenes and both worlds read */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=16;i++){await page.mouse.move(cx,cy+i*10);await page.waitForTimeout(30)}
  await page.waitForTimeout(1600);
  for(let i=17;i<=28;i++){await page.mouse.move(cx,cy+i*10);await page.waitForTimeout(30)}
  await page.mouse.up();
  await page.waitForTimeout(1900);

  /* reverse: the previous world comes back the way it left */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=18;i++){await page.mouse.move(cx,cy-i*13);await page.waitForTimeout(22)}
  await page.mouse.up();
  await page.waitForTimeout(1900);

  /* a partial pull released below the threshold: it cancels */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=7;i++){await page.mouse.move(cx,cy+i*10);await page.waitForTimeout(28)}
  await page.mouse.up();
  await page.waitForTimeout(1700);

  await ensureDetailClosed(page);
  await page.click('#next-dish');
  await page.waitForTimeout(1900);

  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(2600);
});

await record('anchor-scenes-mobile',{width:390,height:844},true,async(page,context)=>{
  const cdp=await context.newCDPSession(page);
  const {x:cx,y:cy}=await grabPoint(page,{width:390,height:844});
  await page.waitForTimeout(1800);

  const swipe=async(distance,steps,delay,hold)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});
    for(let i=1;i<=steps;i++){
      await page.waitForTimeout(delay);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy+(distance*i)/steps}]});
      if(hold&&i===Math.round(steps/2))await page.waitForTimeout(hold);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };

  await swipe(190,14,30,1600);   /* slow, held on the crossover */
  await page.waitForTimeout(2100);
  await swipe(-190,12,24,0);     /* back the other way */
  await page.waitForTimeout(2100);
  await swipe(55,6,26,0);        /* short pull → cancels */
  await page.waitForTimeout(1800);
  await ensureDetailClosed(page);
  await page.click('#next-dish');
  await page.waitForTimeout(1900);
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(2400);
});

await browser.close();server.close();
console.log('\nmotion evidence written to tests/video/');
