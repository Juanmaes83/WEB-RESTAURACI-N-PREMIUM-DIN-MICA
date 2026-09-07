/* PROJECT 07 PREMIUM — motion evidence.

   Desktop: idle → next → next (chromatic worlds change) → slow drag → Discover →
            fast spin → deceleration → hero landing → ingredients → CTA →
            open personalization → change the accent → close → prove the orbit
            unchanged
   Mobile:  the same proof, shorter.

   It refuses to record unless pizza-slice-orbit is active AND the premium layer is
   composing the world: a clip of the bare motor would look like premium evidence.

   Usage: node tests/record-pizza-premium-video.mjs
   Output: tests/video/pizza-premium-desktop.webm · pizza-premium-mobile.webm
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
  await page.waitForFunction(()=>document.documentElement.dataset.pizzaPremium==='ready',null,{timeout:25000});
  /* wait for the built composition before judging it, then judge it */
  await page.waitForFunction(()=>{
    const imgs=[...document.querySelectorAll('.ps-slice .ps-slice-img')];
    return imgs.length===8&&imgs.every(i=>i.complete&&i.naturalWidth>0)
      &&!!document.querySelector('.ps-station svg')
      &&(document.querySelector('.pp-name')?.textContent||'').trim().length>2;
  },null,{timeout:25000}).catch(()=>{});
  const gate=await page.evaluate(()=>{
    const s=window.RestaurantPizzaSliceOrbit?.state?.()||{};
    const pm=window.RestaurantPizzaPremium?.state?.()||{};
    return {mode:document.documentElement.dataset.orbitalMotion,count:s.count,
      premium:pm.ready,products:pm.products,
      station:!!document.querySelector('.ps-station svg'),
      world:!!document.querySelector('.pp-world'),
      headline:(document.querySelector('.pp-name')?.textContent||'').trim(),
      srcs:[...document.querySelectorAll('.ps-slice .ps-slice-img')].map(i=>i.getAttribute('src'))};
  });
  const declared=new Set(MANIFEST.slices.map(s=>s.runtimeAsset));
  if(gate.mode!=='pizza-slice-orbit'||gate.count!==8||!gate.station)
    throw new Error(`refusing to record: Pizza Slice Orbit is not on stage (${JSON.stringify(gate)})`);
  if(!gate.premium||gate.products!==8||!gate.world||gate.headline.length<3)
    throw new Error(`refusing to record: the premium layer is not composing the world (${JSON.stringify(gate)})`);
  if(gate.srcs.length!==8||!gate.srcs.every(s=>declared.has(s)))
    throw new Error('refusing to record: the slices on stage are not the declared runtime set');
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
  const trimmed=spawnSync('ffmpeg',['-loglevel','error','-ss','1.8','-i',tmp,
    '-c:v','libvpx','-b:v','2M','-cpu-used','4','-deadline','realtime','-an',dest,'-y'],{encoding:'utf8'});
  if(trimmed.status!==0||!fs.existsSync(dest)||fs.statSync(dest).size<10240){
    fs.rmSync(dest,{force:true});fs.renameSync(tmp,dest);
    console.log(`${name}: trim unavailable, keeping the raw clip`);
  }else fs.rmSync(tmp,{force:true});
  console.log(`${name} → ${dest} (${Math.round(fs.statSync(dest).size/1024)}KB)`);
}

await record('pizza-premium-desktop',{width:1440,height:900},false,async page=>{
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width*.5;
  const cy=Math.min(Math.max(box.y+box.height*.62,40),860);
  await page.waitForTimeout(2000);

  /* two deliberate steps: the whole world changes with the product */
  for(let k=0;k<2;k++){
    await page.click('.ps-next');
    await settle(page);
    await page.waitForTimeout(1900);
  }
  /* three more, to show the chromatic worlds in sequence */
  for(let k=0;k<3;k++){
    await page.click('.ps-next');
    await settle(page);
    await page.waitForTimeout(1300);
  }

  /* a slow drag, held mid-travel */
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  for(let i=1;i<=10;i++){await page.mouse.move(cx-i*11,cy);await page.waitForTimeout(44)}
  await page.waitForTimeout(1200);
  for(let i=11;i<=18;i++){await page.mouse.move(cx-i*13,cy);await page.waitForTimeout(30)}
  await page.mouse.up();
  await settle(page);
  await page.waitForTimeout(1600);

  /* DISCOVER: fast → deceleration → hero landing → story → CTA */
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.spin({target:3,turns:3}));
  await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:25000});
  await settle(page);
  await page.waitForTimeout(2800);
  /* the CTA knows the product */
  await page.evaluate(()=>window.RestaurantPizzaPremium.requestOrder());
  await page.waitForTimeout(1800);

  /* personalization, and back out again */
  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(1100);
  await page.evaluate(()=>document.querySelector('#studio [data-panel="motion"]')?.click());
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{
    const card=document.querySelector('.pp-studio');
    card?.scrollIntoView({block:'center'});
  });
  await page.waitForTimeout(1200);
  /* change the brand accent and turn the per-pizza worlds off, then on */
  await page.evaluate(()=>{
    const a=document.querySelector('.pp-studio [data-path$="brand.accent"]');
    if(a){a.value='#7cc8ff';a.dispatchEvent(new Event('input',{bubbles:true}))}
    const c=document.querySelector('.pp-studio [data-path$="perProductWorlds"]');
    if(c){c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))}
  });
  await page.waitForTimeout(2000);
  await page.evaluate(()=>{
    const c=document.querySelector('.pp-studio [data-path$="perProductWorlds"]');
    if(c){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}
  });
  await page.waitForTimeout(1600);
  await page.evaluate(()=>document.querySelector('#studio-close')?.click());
  await page.waitForTimeout(900);
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  /* the orbit is unchanged by any of that */
  await page.click('.ps-next');
  await settle(page);
  await page.waitForTimeout(1400);
  await page.click('.ps-prev');
  await settle(page);
  await page.waitForTimeout(1800);
});

await record('pizza-premium-mobile',{width:390,height:844},true,async(page,context)=>{
  const cdp=await context.newCDPSession(page);
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width*.5;
  const cy=Math.min(Math.max(box.y+box.height*.6,40),800);
  await page.waitForTimeout(1800);

  const swipe=async(distance,steps,delay,hold)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});
    for(let i=1;i<=steps;i++){
      await page.waitForTimeout(delay);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+(distance*i)/steps,y:cy}]});
      if(hold&&i===Math.round(steps/2))await page.waitForTimeout(hold);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };

  await swipe(-160,11,32,1100);
  await settle(page);
  await page.waitForTimeout(1900);
  await swipe(-150,10,28,0);
  await settle(page);
  await page.waitForTimeout(1700);

  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.spin({target:5,turns:2}));
  await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:25000});
  await settle(page);
  await page.waitForTimeout(2600);
  await page.evaluate(()=>window.RestaurantPizzaPremium.requestOrder());
  await page.waitForTimeout(2000);
});

await browser.close();server.close();
console.log('\nmotion evidence written to tests/video/');
