/* PROJECT 01 V3 — motion evidence.
   Screenshots cannot show choreography, so this records the real interaction:
   idle → slow drag → hold at the 50% seam → continue → snap → reverse drag →
   product change → hero click. Screenshots cannot show any of that.

   Usage: node tests/record-depth-carousel-video.mjs
   Output: tests/video/depth-carousel-v3b-desktop.webm
           tests/video/depth-carousel-v3b-mobile.webm
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

/* The shell is taller than the viewport on some runners, so a naive centre point
   lands outside it: the drag is never delivered, and the release reads as a click
   that opens the dish. Clamp into the viewport and verify the point really hits. */
async function grabPoint(page,viewport){
  const box=await page.locator('.orbit-shell').boundingBox();
  const x=box.x+box.width/2;
  for(const f of [0.5,0.42,0.34,0.58,0.66]){
    const y=Math.min(Math.max(box.y+box.height*f,24),viewport.height-24);
    const ok=await page.evaluate(([px,py])=>{
      const el=document.elementFromPoint(px,py);
      return !!el&&!!el.closest('.orbit-shell');
    },[x,y]);
    if(ok)return {box,x,y};
  }
  throw new Error('no grabbable point inside .orbit-shell');
}
async function ensureDetailClosed(page){
  const open=await page.evaluate(()=>document.getElementById('dish-detail')?.classList.contains('is-open'));
  if(!open)return;
  await page.evaluate(()=>document.querySelector('#detail-close')?.click());
  await page.waitForFunction(()=>!document.getElementById('dish-detail')?.classList.contains('is-open'),null,{timeout:6000});
  await page.waitForTimeout(900);
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
await record('depth-carousel-v3b-desktop',{width:1440,height:900},false,async page=>{
  const {box,x:cx,y:cy}=await grabPoint(page,{width:1440,height:900});
  await page.waitForTimeout(1800);

  /* slow drag, then hold exactly on the seam so the two worlds are both readable */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=18;i++){await page.mouse.move(cx-i*10,cy);await page.waitForTimeout(30)}
  await page.waitForTimeout(1400);
  for(let i=19;i<=30;i++){await page.mouse.move(cx-i*10,cy);await page.waitForTimeout(30)}
  await page.mouse.up();
  await page.waitForTimeout(1900);

  /* reverse drag: world B recedes and A is revealed from the left */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=16;i++){await page.mouse.move(cx+i*16,cy);await page.waitForTimeout(20)}
  await page.mouse.up();
  await page.waitForTimeout(1900);

  await ensureDetailClosed(page);
  await page.click('#next-dish');
  await page.waitForTimeout(1900);

  /* the hero opens the real dish detail */
  const hero=await page.evaluate(()=>{
    const s=window.RestaurantDepthCarousel.state();
    const p=document.querySelectorAll('.dc-plate')[s.activeIndex];
    const r=p.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  });
  await page.mouse.move(hero.x,Math.min(hero.y,880));
  await page.waitForTimeout(700);
  await page.mouse.click(hero.x,Math.min(hero.y,880));
  await page.waitForTimeout(2600);
});

/* Mobile: two real touch swipes through CDP, so the recording shows genuine
   touch behaviour and not a synthetic mouse drag. */
await record('depth-carousel-v3b-mobile',{width:390,height:844},true,async(page,context)=>{
  const cdp=await context.newCDPSession(page);
  const {x:cx,y:cy}=await grabPoint(page,{width:390,height:844});
  await page.waitForTimeout(1900);

  const swipe=async(distance,steps,delay,hold)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});
    for(let i=1;i<=steps;i++){
      await page.waitForTimeout(delay);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-(distance*i)/steps,y:cy}]});
      if(hold&&i===Math.round(steps/2))await page.waitForTimeout(hold);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };

  await swipe(150,16,34,1300);   /* slow, with a hold on the seam */
  await page.waitForTimeout(2100);
  await swipe(-150,12,26,0);     /* back the other way */
  await page.waitForTimeout(2100);
  await swipe(220,8,10,0);       /* flick → momentum */
  await page.waitForTimeout(2300);
  await ensureDetailClosed(page);
  await page.click('#next-dish');
  await page.waitForTimeout(2200);
});

await browser.close();
server.close();
console.log('\nmotion evidence written to tests/video/');
