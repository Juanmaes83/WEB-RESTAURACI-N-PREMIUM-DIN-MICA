/* PROJECT 01 V2 — motion evidence.
   Screenshots cannot show choreography, so this records the real interaction:
   idle → slow drag → mid-transition → release → momentum → snap → next → side pick.

   Usage: node tests/record-depth-carousel-video.mjs
   Output: tests/video/depth-carousel-v2-desktop.webm
           tests/video/depth-carousel-v2-mobile.webm
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

async function selectPreset(page){
  await page.waitForFunction(()=>!!document.querySelector('#motion-orbital-style option[value="depth-carousel"]'),null,{timeout:25000});
  await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='depth-carousel';
    s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  });
  await page.waitForFunction(()=>document.documentElement.dataset.depthCarousel==='ready',null,{timeout:12000});
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
}

async function record(name,viewport,mobile,script){
  const context=await browser.newContext({
    viewport,isMobile:mobile,hasTouch:mobile,
    recordVideo:{dir:OUT,size:viewport}
  });
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
     browser's blank white page. Trim it when ffmpeg is available; otherwise keep
     the raw clip rather than failing the run over a cosmetic lead-in. */
  const trimmed=spawnSync('ffmpeg',['-loglevel','error','-ss','1.1','-i',tmp,'-c','copy',dest,'-y'],{encoding:'utf8'});
  if(trimmed.status!==0||!fs.existsSync(dest)||fs.statSync(dest).size<10240){
    fs.rmSync(dest,{force:true});
    fs.renameSync(tmp,dest);
    console.log(`${name} → ${dest} (untrimmed: ffmpeg unavailable)`);
  }else{
    fs.rmSync(tmp,{force:true});
  }
  console.log(`${name} → ${dest} (${Math.round(fs.statSync(dest).size/1024)}KB)`);
}

/* Desktop: a slow deliberate drag so the intermediate state is readable, then a
   flick to show momentum, then a button step and a side pick. */
await record('depth-carousel-v2-desktop',{width:1440,height:900},false,async page=>{
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width/2, cy=Math.min(box.y+box.height*.5,880);
  await page.waitForTimeout(1400);

  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=26;i++){await page.mouse.move(cx-i*15,cy);await page.waitForTimeout(26)}
  await page.waitForTimeout(500);                       /* hold mid-transition */
  await page.mouse.up();
  await page.waitForTimeout(1800);

  await page.mouse.move(cx,cy);                         /* flick → momentum */
  await page.mouse.down();
  for(let i=1;i<=10;i++){await page.mouse.move(cx-i*40,cy);await page.waitForTimeout(9)}
  await page.mouse.up();
  await page.waitForTimeout(2000);

  await page.click('#next-dish');                       /* button step */
  await page.waitForTimeout(1800);

  const plates=await page.locator('.dc-plate').all();   /* pick a side object */
  for(const p of plates){
    const b=await p.boundingBox();
    if(b&&b.x>box.x+box.width*.62&&b.y>0&&b.y<820){await p.click({force:true});break}
  }
  await page.waitForTimeout(2200);
});

/* Mobile: two real touch swipes through CDP, so the recording shows genuine
   touch behaviour and not a synthetic mouse drag. */
await record('depth-carousel-v2-mobile',{width:390,height:844},true,async(page,context)=>{
  const cdp=await context.newCDPSession(page);
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width/2, cy=Math.min(box.y+box.height*.5,780);
  await page.waitForTimeout(1600);

  const swipe=async(distance,steps,delay)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});
    for(let i=1;i<=steps;i++){
      await page.waitForTimeout(delay);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-(distance*i)/steps,y:cy}]});
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };

  await swipe(190,18,30);          /* slow, readable */
  await page.waitForTimeout(2200);
  await swipe(230,8,10);           /* fast flick → momentum */
  await page.waitForTimeout(2400);
  await page.click('#next-dish');
  await page.waitForTimeout(2200);
});

await browser.close();
server.close();
console.log('\nmotion evidence written to tests/video/');
