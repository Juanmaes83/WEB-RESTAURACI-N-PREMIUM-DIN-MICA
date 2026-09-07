/* PROJECT 02 — motion evidence.
   idle → slow drag → hold at 50% with both products and both worlds on stage →
   continue → snap → reverse drag → product change → dish detail.

   Usage: node tests/record-anchor-swap-video.mjs
   Output: tests/video/anchor-swap-desktop.webm · anchor-swap-mobile.webm

   IMPORTANT: Project 01 proved that a recorder can succeed while capturing the wrong
   preset. This recorder therefore treats the visible scene as a contract: before the
   narrative begins it must prove Anchor Swap is still active, the hand is visible and
   the final held-product art-direction asset is actually painted. */
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

async function anchorSceneState(page){
  return page.evaluate(()=>{
    const root=document.documentElement;
    const visible=el=>{
      if(!el)return false;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.05&&r.width>80&&r.height>80;
    };
    const scene=document.querySelector('.as-scene');
    const anchor=document.querySelector('.as-anchor');
    const out=document.querySelector('.as-product-out');
    const art=window.RestaurantAnchorSwapArtDirection?.status?.();
    return {
      mode:root.dataset.orbitalMotion||'',
      ready:root.dataset.anchorSwap||'',
      held:root.dataset.anchorHeldAssets||'',
      sceneVisible:visible(scene),
      anchorVisible:visible(anchor),
      productLoaded:!!out&&out.complete&&out.naturalWidth>0,
      productSrc:out?.getAttribute('src')||'',
      heldSrc:art?.outSrc||'',
      artReady:!!art?.ready
    };
  });
}

async function assertAnchorScene(page,phase){
  const s=await anchorSceneState(page);
  const heldMedia=/d2ol7oe51mr4n9\.cloudfront\.net/.test(s.productSrc);
  if(s.mode!=='anchor-swap'||s.ready!=='ready'||s.held!=='ready'||!s.sceneVisible||!s.anchorVisible||!s.productLoaded||!heldMedia||!s.artReady){
    throw new Error(`${phase}: recorder is not on the final Anchor Swap scene: ${JSON.stringify(s)}`);
  }
  return s;
}

async function selectPreset(page){
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await page.waitForFunction(()=>!!window.RestaurantAnchorSwap,null,{timeout:25000});
  await page.waitForFunction(()=>!!document.querySelector('#motion-orbital-style option[value="anchor-swap"]'),null,{timeout:25000});

  /* Let Studio/project restoration finish before we assert ownership of the scene.
     Then publish Anchor Swap after that restoration rather than racing it. */
  await page.waitForTimeout(1600);
  try{await page.evaluate(async()=>{await window.RestaurantStore?.loadProject?.()})}catch{}

  for(let attempt=0;attempt<3;attempt++){
    await page.evaluate(()=>{
      const s=document.getElementById('motion-orbital-style');
      s.value='anchor-swap';
      s.dispatchEvent(new Event('input',{bubbles:true}));
      s.dispatchEvent(new Event('change',{bubbles:true}));
      window.RestaurantMotionStudio?.publish?.();
    });
    await page.waitForFunction(()=>document.documentElement.dataset.anchorSwap==='ready',null,{timeout:14000});
    await page.waitForFunction(()=>document.documentElement.dataset.orbitalMotion==='anchor-swap',null,{timeout:10000});
    await page.waitForFunction(()=>document.documentElement.dataset.anchorHeldAssets==='ready',null,{timeout:14000});
    await page.locator('#signature').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    const s=await anchorSceneState(page);
    if(s.mode==='anchor-swap'&&s.sceneVisible&&s.anchorVisible&&s.productLoaded&&/d2ol7oe51mr4n9\.cloudfront\.net/.test(s.productSrc)){
      await assertAnchorScene(page,`preset attempt ${attempt+1}`);
      return;
    }
  }
  await assertAnchorScene(page,'preset final');
}

async function grabPoint(page,viewport){
  const box=await page.locator('.orbit-shell').boundingBox();
  const x=box.x+box.width*0.5;
  for(const f of [0.42,0.5,0.34,0.58]){
    const y=Math.min(Math.max(box.y+box.height*f,26),viewport.height-26);
    const ok=await page.evaluate(([px,py])=>{
      const el=document.elementFromPoint(px,py);return !!el&&!!el.closest('.orbit-shell');
    },[x,y]);
    if(ok)return {x,y,box};
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
  await assertAnchorScene(page,`${name} before narrative`);
  await script(page,context);
  const video=page.video();
  await context.close();
  const tmp=await video.path();
  const dest=path.join(OUT,`${name}.webm`);
  fs.rmSync(dest,{force:true});
  const trimmed=spawnSync('ffmpeg',['-loglevel','error','-ss','1.6','-i',tmp,'-c','copy',dest,'-y'],{encoding:'utf8'});
  if(trimmed.status!==0||!fs.existsSync(dest)||fs.statSync(dest).size<10240){
    fs.rmSync(dest,{force:true});fs.renameSync(tmp,dest);
  }else fs.rmSync(tmp,{force:true});
  console.log(`${name} → ${dest} (${Math.round(fs.statSync(dest).size/1024)}KB)`);
}

await record('anchor-swap-desktop',{width:1440,height:900},false,async page=>{
  await assertAnchorScene(page,'desktop narrative start');
  const {x:cx,y:cy}=await grabPoint(page,{width:1440,height:900});
  await page.waitForTimeout(1600);

  /* slow drag, held on the crossover so both products and both worlds read */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=15;i++){await page.mouse.move(cx,cy+i*10);await page.waitForTimeout(30)}
  await page.waitForTimeout(1500);
  for(let i=16;i<=26;i++){await page.mouse.move(cx,cy+i*10);await page.waitForTimeout(30)}
  await page.mouse.up();
  await page.waitForTimeout(1900);

  /* reverse: the world recedes and the previous product comes back */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=18;i++){await page.mouse.move(cx,cy-i*13);await page.waitForTimeout(22)}
  await page.mouse.up();
  await page.waitForTimeout(1900);

  /* a partial pull that is released below the threshold: it cancels */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=7;i++){await page.mouse.move(cx,cy+i*10);await page.waitForTimeout(28)}
  await page.mouse.up();
  await page.waitForTimeout(1600);

  await ensureDetailClosed(page);
  await assertAnchorScene(page,'desktop before button step');
  await page.click('#next-dish');
  await page.waitForTimeout(1900);
  await assertAnchorScene(page,'desktop after button step');

  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(2600);
});

await record('anchor-swap-mobile',{width:390,height:844},true,async(page,context)=>{
  await assertAnchorScene(page,'mobile narrative start');
  const cdp=await context.newCDPSession(page);
  const {x:cx,y:cy}=await grabPoint(page,{width:390,height:844});
  await page.waitForTimeout(1700);

  const swipe=async(distance,steps,delay,hold)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});
    for(let i=1;i<=steps;i++){
      await page.waitForTimeout(delay);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy+(distance*i)/steps}]});
      if(hold&&i===Math.round(steps/2))await page.waitForTimeout(hold);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };

  await swipe(190,14,30,1500);   /* slow, held on the crossover */
  await page.waitForTimeout(2100);
  await swipe(-190,12,24,0);     /* the other way */
  await page.waitForTimeout(2100);
  await swipe(60,6,26,0);        /* short pull → cancels */
  await page.waitForTimeout(1800);
  await ensureDetailClosed(page);
  await assertAnchorScene(page,'mobile before button step');
  await page.click('#next-dish');
  await page.waitForTimeout(1900);
  await assertAnchorScene(page,'mobile after button step');
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(2400);
});

await browser.close();server.close();
console.log('\nmotion evidence written to tests/video/');