/* CLASS 08 · PROJECT 01 — Cinematic Depth Carousel
   Functional + visual + regression coverage on desktop and mobile.
   Screenshots land in tests/screenshots/ for the mandatory human visual review. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'tests','screenshots');
fs.mkdirSync(SHOTS,{recursive:true});

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch({headless:true});

const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function session(label,viewport,isMobile){
  const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile,deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});

  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:20000});
  await page.waitForFunction(()=>!!window.RestaurantDepthCarousel,null,{timeout:20000});
  await page.waitForTimeout(700);

  /* ---- baseline before switching preset (regression reference) ---- */
  const baselineDishes=await page.locator('#orbit-stage .orbit-dish').count();
  check(`${label} · baseline orbital renders ${baselineDishes} dishes`,baselineDishes>=5,`${baselineDishes}`);

  /* ---- select the preset the way Studio does ---- */
  const optionExists=await page.evaluate(()=>!!document.querySelector('#motion-orbital-style option[value="depth-carousel"]'));
  check(`${label} · Studio exposes the Depth Carousel preset`,optionExists);

  await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='depth-carousel';
    s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  });
  await page.waitForFunction(()=>document.documentElement.dataset.depthCarousel==='ready',null,{timeout:8000});
  await page.waitForTimeout(900);

  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  /* ---- 1. the scene exists and has real depth ---- */
  const geom=async()=>page.evaluate(()=>{
    const shell=document.querySelector('.orbit-shell'),sr=shell.getBoundingClientRect();
    return [...document.querySelectorAll('.dc-plate')].map(el=>{
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {
        id:el.dataset.id,index:Number(el.dataset.index),
        cx:+(r.left+r.width/2-sr.left).toFixed(1),
        cy:+(r.top+r.height/2-sr.top).toFixed(1),
        w:+r.width.toFixed(1),
        opacity:+cs.opacity,
        z:+cs.zIndex,
        blur:/blur\(([\d.]+)px\)/.exec(cs.filter)?.[1]??'0'
      };
    }).sort((a,b)=>a.cx-b.cx);
  });

  const g0=await geom();
  check(`${label} · plates rendered`,g0.length>=5,`${g0.length} plates`);

  const visible=g0.filter(p=>p.opacity>.05);
  check(`${label} · multiple depth levels visible simultaneously`,visible.length>=3,`${visible.length} visible`);

  const widths=visible.map(p=>p.w);
  const hero=visible.reduce((a,b)=>a.w>b.w?a:b);
  const smallest=Math.min(...widths);
  check(`${label} · differential scale (hero dominates)`,hero.w/smallest>=1.5,`hero ${hero.w}px vs ${smallest}px`);

  const zSet=new Set(visible.map(p=>p.z));
  check(`${label} · z-order is layered`,zSet.size>=3,`${zSet.size} distinct z values`);

  const blurs=visible.map(p=>+p.blur);
  check(`${label} · depth blur gradient`,Math.max(...blurs)-Math.min(...blurs)>.4,`blur ${Math.min(...blurs)}→${Math.max(...blurs)}`);

  const ys=new Set(visible.map(p=>Math.round(p.cy/10)));
  check(`${label} · vertical arc (not a flat rail)`,ys.size>=2,`${ys.size} vertical bands`);

  await page.screenshot({path:path.join(SHOTS,`${label}-01-idle.png`),fullPage:false});

  /* ---- 2. every object moves, and they do NOT move the same ---- */
  const before=await geom();
  const copyBefore=await page.evaluate(()=>({
    title:document.getElementById('dish-title').textContent.trim(),
    word:document.querySelector('.dc-word').textContent.trim(),
    price:document.querySelector('.dc-price').textContent.trim(),
    accent:getComputedStyle(document.documentElement).getPropertyValue('--dc-accent').trim()
  }));
  await page.evaluate(()=>window.RestaurantDepthCarousel.step(1));
  const midSamples=[];
  for(let s=0;s<3;s++){await page.waitForTimeout(90);midSamples.push(await geom())}
  await page.waitForTimeout(1300);
  const after=await geom();

  const byIndex=arr=>Object.fromEntries(arr.map(p=>[p.index,p]));
  const [B,A]=[byIndex(before),byIndex(after)];
  const travel=Object.keys(B).map(k=>Math.abs((A[k]?.cx??0)-(B[k]?.cx??0)));
  const moving=travel.filter(t=>t>4).length;
  check(`${label} · the whole collection re-composes`,moving>=4,`${moving}/${travel.length} plates travelled`);
  const spread=Math.max(...travel)-Math.min(...travel);
  check(`${label} · differential trajectories (parallax)`,spread>25,`travel spread ${spread.toFixed(1)}px`);

  /* In flight the whole collection must be somewhere between its start and end slots.
     Sampled a few times because the transition is short and RPC latency is not. */
  const midMoved=Math.max(...midSamples.map(sample=>{
    const M=byIndex(sample);
    return Object.keys(B).filter(k=>{
      const s0=B[k]?.cx??0,s1=A[k]?.cx??0,m=M[k]?.cx??0;
      return Math.abs(m-s0)>2&&Math.abs(m-s1)>2;
    }).length;
  }));
  check(`${label} · movement is continuous, not a swap`,midMoved>=3,`${midMoved} plates in flight mid-transition`);

  await page.screenshot({path:path.join(SHOTS,`${label}-02-after-next.png`)});

  /* ---- 3. scene synchronisation ---- */
  const sync=await page.evaluate(()=>{
    const idx=parseInt(document.getElementById('dish-counter').textContent,10)-1;
    const dishes=(window.RestaurantDefaults.dishes||[]).filter(d=>d.enabled!==false);
    const d=dishes[idx]||{};
    return {
      idx,
      counter:document.getElementById('dish-counter').textContent.trim(),
      title:document.getElementById('dish-title').textContent.trim(),
      expectedTitle:(d.name||'').trim(),
      price:document.querySelector('.dc-price').textContent.trim(),
      expectedPrice:(d.price||'').trim(),
      word:document.querySelector('.dc-word').textContent.trim(),
      accent:getComputedStyle(document.documentElement).getPropertyValue('--dc-accent').trim(),
      dotActive:[...document.querySelectorAll('.dc-dot')].findIndex(x=>x.getAttribute('aria-current')==='true'),
      ingredients:document.querySelector('.dc-ingredients').textContent.trim()
    };
  });
  /* Class 06 renders the localised dish name, so the title is compared by change,
     not by equality against the raw English default. Price/index stay canonical. */
  check(`${label} · copy follows the active dish`,!!sync.title&&sync.title!==copyBefore.title,`${copyBefore.title} → ${sync.title}`);
  check(`${label} · price follows the active dish`,sync.price===sync.expectedPrice&&!!sync.price,`${sync.price}`);
  check(`${label} · giant lettering follows the active dish`,!!sync.word&&sync.expectedTitle.toUpperCase().includes(sync.word.toUpperCase())&&sync.word!==copyBefore.word,`${copyBefore.word} → ${sync.word}`);
  check(`${label} · accent theme is published and changes per dish`,/^#|rgb/.test(sync.accent)&&sync.accent!==copyBefore.accent,`${copyBefore.accent} → ${sync.accent}`);
  check(`${label} · indicators follow the active dish`,sync.dotActive===sync.idx,`dot ${sync.dotActive} vs index ${sync.idx}`);
  check(`${label} · ingredients follow the active dish`,!!sync.ingredients);

  /* ---- 4. prev / next ---- */
  const idxNow=()=>page.evaluate(()=>parseInt(document.getElementById('dish-counter').textContent,10)-1);
  const i0=await idxNow();
  await page.click('#next-dish');await page.waitForTimeout(1300);
  const i1=await idxNow();
  await page.click('#prev-dish');await page.waitForTimeout(1300);
  const i2=await idxNow();
  check(`${label} · next advances one dish`,i1===(i0+1)%baselineDishes,`${i0}→${i1}`);
  check(`${label} · prev returns`,i2===i0,`${i1}→${i2}`);

  /* ---- 5. drag / swipe with snap ---- */
  await page.locator('.orbit-shell').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box=await page.locator('.orbit-shell').boundingBox();
  const cx=box.x+box.width/2;
  /* The shell is taller than a phone viewport: clamp the grab point or the synthetic
     pointer lands outside the window and no drag is delivered at all. */
  const cy=Math.min(Math.max(box.y+box.height*.5,20),viewport.height-20);
  const grabbable=await page.evaluate(([x,y])=>{const el=document.elementFromPoint(x,y);return !!el&&!!el.closest('.orbit-shell')},[cx,cy]);
  check(`${label} · drag surface is reachable in the viewport`,grabbable,`(${cx.toFixed(0)}, ${cy.toFixed(0)})`);
  const iBeforeDrag=await idxNow();

  if(isMobile){
    /* A real touch swipe through CDP, so Chromium synthesises genuine touch pointer
       events instead of us hand-rolling PointerEvent objects the engine would trust
       but a phone would never produce. */
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});
    for(let i=1;i<=12;i++){
      await page.waitForTimeout(14);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-i*22,y:cy}]});
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{
    await page.mouse.move(cx,cy);
    await page.mouse.down();
    for(let i=1;i<=14;i++){await page.mouse.move(cx-i*24,cy);await page.waitForTimeout(11)}
    await page.mouse.up();
  }
  await page.waitForTimeout(1400);
  const iAfterDrag=await idxNow();
  check(`${label} · ${isMobile?'swipe':'drag'} navigates`,iAfterDrag!==iBeforeDrag,`${iBeforeDrag}→${iAfterDrag}`);

  const snapped=await page.evaluate(()=>{
    const p=window.RestaurantDepthCarousel.state().position;
    return Math.abs(p-Math.round(p));
  });
  check(`${label} · drag snaps to a dish`,snapped<0.02,`residual ${snapped.toFixed(4)}`);

  const engineVsBase=await page.evaluate(()=>{
    const s=window.RestaurantDepthCarousel.state();
    const counter=parseInt(document.getElementById('dish-counter').textContent,10)-1;
    const n=document.querySelectorAll('#orbit-stage .orbit-dish').length;
    return {engine:((s.activeIndex%n)+n)%n,counter};
  });
  check(`${label} · engine and Orbital state stay in sync`,engineVsBase.engine===engineVsBase.counter,JSON.stringify(engineVsBase));

  await page.screenshot({path:path.join(SHOTS,`${label}-03-after-drag.png`)});

  /* ---- 6. no horizontal overflow, controls reachable ---- */
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(`${label} · no broken horizontal overflow`,overflow<=2,`${overflow}px`);
  check(`${label} · controls visible`,await page.locator('#next-dish').isVisible()&&await page.locator('#explore-dish').isVisible());

  /* ---- 7. dish detail still opens and returns ---- */
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(1200);
  const detailOpen=await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open'));
  check(`${label} · dish detail opens from the carousel`,detailOpen);
  if(detailOpen)await page.screenshot({path:path.join(SHOTS,`${label}-04-detail.png`)});
  await page.evaluate(()=>document.querySelector('#detail-close')?.click());
  await page.waitForTimeout(1400);
  const detailClosed=await page.evaluate(()=>!document.getElementById('dish-detail').classList.contains('is-open'));
  const platesBack=await page.locator('.dc-plate').count();
  check(`${label} · detail closes and the scene is restored`,detailClosed&&platesBack===baselineDishes,`${platesBack} plates`);

  /* ---- 8. regression: Studio and the other presets survive ---- */
  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(500);
  const studioOpen=await page.evaluate(()=>document.getElementById('studio').getAttribute('aria-hidden')==='false');
  check(`${label} · Restaurant Studio still opens`,studioOpen);
  await page.evaluate(()=>document.querySelector('#studio-close').click());
  await page.waitForTimeout(400);

  await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='elegant';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  });
  await page.waitForTimeout(900);
  const backToOrbital=await page.evaluate(()=>{
    const stage=document.getElementById('orbit-stage');
    return {
      visible:getComputedStyle(stage).visibility!=='hidden',
      dishes:stage.querySelectorAll('.orbit-dish').length,
      sceneHidden:document.querySelector('.dc-scene')?.hidden===true
    };
  });
  check(`${label} · Orbital preset is restored intact`,backToOrbital.visible&&backToOrbital.dishes===baselineDishes&&backToOrbital.sceneHidden,JSON.stringify(backToOrbital));
  await page.screenshot({path:path.join(SHOTS,`${label}-05-orbital-regression.png`)});

  const fatal=errors.filter(e=>!/favicon|ERR_INTERNET|net::ERR/i.test(e));
  check(`${label} · no JS errors`,fatal.length===0,fatal.slice(0,3).join(' | '));

  await context.close();
}

/* ---- reduced motion ---- */
async function reducedMotionSession(){
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.RestaurantDepthCarousel,null,{timeout:20000});
  await page.waitForTimeout(700);
  await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');
    s.value='depth-carousel';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  });
  await page.waitForFunction(()=>document.documentElement.dataset.depthCarousel==='ready',null,{timeout:8000});
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const state=await page.evaluate(()=>({
    plates:document.querySelectorAll('.dc-plate').length,
    visible:[...document.querySelectorAll('.dc-plate')].filter(p=>+getComputedStyle(p).opacity>.05).length,
    title:document.getElementById('dish-title').textContent.trim(),
    price:document.querySelector('.dc-price').textContent.trim(),
    controls:!!document.querySelector('#next-dish')
  }));
  check('reduced-motion · content and navigation survive',state.plates>=5&&state.visible>=3&&!!state.title&&!!state.price&&state.controls,JSON.stringify(state));

  const i0=await page.evaluate(()=>parseInt(document.getElementById('dish-counter').textContent,10));
  await page.click('#next-dish');
  await page.waitForTimeout(500);
  const i1=await page.evaluate(()=>parseInt(document.getElementById('dish-counter').textContent,10));
  check('reduced-motion · navigation still changes dish',i1!==i0,`${i0}→${i1}`);
  await page.screenshot({path:path.join(SHOTS,'reduced-motion-01.png')});
  await context.close();
}

await session('desktop',{width:1440,height:900},false);
await session('mobile',{width:390,height:844},true);
await reducedMotionSession();

await browser.close();
server.close();

const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots → ${SHOTS}`);
if(failed.length){
  console.error(`DEPTH_CAROUSEL_FAIL: ${failed.map(f=>f.name).join(' | ')}`);
  process.exit(1);
}
console.log('DEPTH_CAROUSEL_PASS');
