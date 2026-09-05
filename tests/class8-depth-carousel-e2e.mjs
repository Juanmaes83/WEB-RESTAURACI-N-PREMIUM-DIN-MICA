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
        vl:+r.left.toFixed(1),vr:+r.right.toFixed(1),
        free:el.classList.contains('is-free'),
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

  await page.screenshot({path:path.join(SHOTS,`v2-${label}-01-idle.png`),fullPage:false});
  /* =====================================================================
     VISUAL DIRECTION V2 — the checks that guard the human review criteria.
     ===================================================================== */

  const freeCount=await page.evaluate(()=>document.querySelectorAll('.dc-plate.is-free').length);
  check(`${label} · V2 free objects (transparent assets, no card)`,freeCount>=3,`${freeCount} free objects`);
  const framedLeak=await page.evaluate(()=>[...document.querySelectorAll('.dc-plate.is-free img')]
    .some(i=>{const c=getComputedStyle(i);return c.borderRadius!=='0px'||c.boxShadow!=='none'}));
  check(`${label} · V2 free objects carry no circular card`,!framedLeak);

  const orbitalSilenced=await page.evaluate(()=>{
    const gone=s=>[...document.querySelectorAll(s)].every(e=>getComputedStyle(e).display==='none');
    return {rings:gone('.orbit-ring'),mark:gone('.orbit-center-mark'),glow:gone('.orbit-glow'),
      heading:gone('.orbital-top'),stage:getComputedStyle(document.getElementById('orbit-stage')).visibility==='hidden'};
  });
  check(`${label} · V2 Orbital language is silenced`,Object.values(orbitalSilenced).every(Boolean),JSON.stringify(orbitalSilenced));

  const worlds=await page.evaluate(()=>[...document.querySelectorAll('.dc-bg')].map(b=>b.style.background));
  check(`${label} · V2 every dish owns a distinct colour world`,new Set(worlds).size===worlds.length,`${new Set(worlds).size}/${worlds.length} distinct`);

  const wordBox=await page.evaluate(()=>{
    const w=[...document.querySelectorAll('.dc-word')].sort((a,b)=>+getComputedStyle(b).opacity-+getComputedStyle(a).opacity)[0];
    const r=w.getBoundingClientRect();
    return {h:r.height/innerHeight,w:r.width/innerWidth,opacity:+getComputedStyle(w).opacity,text:w.textContent};
  });
  /* Desktop carries the lettering on the height axis; a 390x844 portrait cannot —
     a word at 35% of that height leaves room for nothing else, so on mobile the
     word is sized to the width axis and deliberately runs past both edges. */
  const wordOk=isMobile?(wordBox.h>=.12&&wordBox.w>=.7):(wordBox.h>=.25&&wordBox.w>=.45);
  check(`${label} · V2 lettering is architectural, not decoration`,wordOk&&wordBox.opacity>.12,
    `${(wordBox.h*100).toFixed(0)}% viewport height, ${(wordBox.w*100).toFixed(0)}% width, "${wordBox.text}"`);

  /* occlusion: visible plates must overlap AND sit at different depths */
  const overlaps=(()=>{
    const vis=g0.filter(p=>p.opacity>.2);
    let pairs=0;
    for(let i=0;i<vis.length;i++)for(let j=i+1;j<vis.length;j++){
      const a=vis[i],b=vis[j];
      if(Math.min(a.vr,b.vr)-Math.max(a.vl,b.vl)>18&&a.z!==b.z)pairs++;
    }
    return pairs;
  })();
  check(`${label} · V2 objects occlude each other`,overlaps>=2,`${overlaps} overlapping pairs at different depths`);

  const offscreen=g0.filter(p=>p.opacity>.15&&(p.vl<0||p.vr>viewport.width)).length;
  check(`${label} · V2 the collection continues past the frame`,offscreen>=1,`${offscreen} plates cropped by the viewport`);

  /* asymmetry: the left and right neighbours must not be mirror images */
  const asym=await page.evaluate(()=>{
    const t=window.RestaurantDepthCarousel.sampleTrack.bind(null);
    const L=t(-1),R=t(1),L2=t(-2),R2=t(2),H=t(0);
    return {dyNeighbour:Math.abs(L.y-R.y),dyFar:Math.abs(L2.y-R2.y),
      dxL:Math.abs(H.x-L.x),dxR:Math.abs(R.x-H.x),dsFar:Math.abs(L2.s-R2.s)};
  });
  check(`${label} · V2 composition is asymmetric`,(asym.dyFar>6||asym.dsFar>.02)&&Math.abs(asym.dxL-asym.dxR)>0.5,JSON.stringify(asym));

  /* depth must not come mainly from blur */
  const heroW=Math.max(...g0.filter(p=>p.opacity>.5).map(p=>p.w));
  const midBlur=Math.max(...g0.filter(p=>p.opacity>.6&&p.w<heroW*.95).map(p=>+p.blur));
  const midW=Math.max(...g0.filter(p=>p.opacity>.6&&p.w<heroW*.95).map(p=>p.w));
  check(`${label} · V2 depth is not carried by blur`,midBlur<=1.4&&heroW/midW>=1.35,`neighbour blur ${midBlur}px, hero/neighbour ${(heroW/midW).toFixed(2)}x`);

  /* the scene reacts to the gesture, not to the committed index */
  const continuous=await page.evaluate(()=>{
    const read=()=>({
      accent:getComputedStyle(document.documentElement).getPropertyValue('--dc-accent').trim(),
      bgs:[...document.querySelectorAll('.dc-bg')].map(b=>+getComputedStyle(b).opacity),
      words:[...document.querySelectorAll('.dc-word')].filter(w=>+getComputedStyle(w).opacity>.06).length,
      copy:+getComputedStyle(document.querySelector('.dish-copy')).opacity,
      counter:document.getElementById('dish-counter').textContent.trim()
    });
    const at0=read();
    window.RestaurantDepthCarousel.setPosition(0.5);
    const mid=read();
    window.RestaurantDepthCarousel.setPosition(0.94);
    const late=read();
    window.RestaurantDepthCarousel.setPosition(0);
    return {at0,mid,late};
  });
  const blended=continuous.mid.bgs.filter(o=>o>.3).length;
  check(`${label} · V2 background crossfades with the gesture`,blended>=2,`${blended} colour worlds blended at 50% of a drag`);
  check(`${label} · V2 accent interpolates during the drag`,
    continuous.mid.accent!==continuous.at0.accent&&continuous.late.accent!==continuous.mid.accent,
    `${continuous.at0.accent} → ${continuous.mid.accent} → ${continuous.late.accent}`);
  check(`${label} · V2 only one giant word on screen at a time`,
    continuous.at0.words<=1&&continuous.mid.words<=1&&continuous.late.words<=1,
    `${continuous.at0.words}/${continuous.mid.words}/${continuous.late.words}`);
  check(`${label} · V2 copy dips mid-gesture instead of flickering`,continuous.mid.copy<continuous.at0.copy-.1,
    `${continuous.at0.copy} → ${continuous.mid.copy}`);
  check(`${label} · V2 the scene moves before the index commits`,continuous.mid.counter===continuous.at0.counter,
    `counter held at ${continuous.mid.counter}`);

  await page.evaluate(()=>window.RestaurantDepthCarousel.setPosition(0.44));
  await page.waitForTimeout(320);
  await page.screenshot({path:path.join(SHOTS,`v2-${label}-02-mid-drag.png`)});
  await page.evaluate(()=>window.RestaurantDepthCarousel.goTo(0));
  await page.waitForTimeout(1200);


  /* ---- 2. every object moves, and they do NOT move the same ---- */
  const before=await geom();
  const copyBefore=await page.evaluate(()=>({
    title:document.getElementById('dish-title').textContent.trim(),
    word:[...document.querySelectorAll('.dc-word')].sort((a,b)=>+getComputedStyle(b).opacity-+getComputedStyle(a).opacity)[0]?.textContent.trim()||'',
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

  await page.screenshot({path:path.join(SHOTS,`v2-${label}-03-next-product.png`)});

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
      word:[...document.querySelectorAll('.dc-word')].sort((a,b)=>+getComputedStyle(b).opacity-+getComputedStyle(a).opacity)[0]?.textContent.trim()||'',
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

  await page.screenshot({path:path.join(SHOTS,`v2-${label}-04-after-drag.png`)});

  /* V2 regression: during a multi-index momentum flight the base engine writes
     title/description while this engine writes price/ingredients. If they are driven
     by different indices they disagree mid-air — visible in the V2 motion recording
     as "Gamba roja salvaje / €22 / ARTICHOKE". Sample the flight and require that no
     title is ever shown with two different prices. */
  const pairs=[];
  await page.evaluate(()=>window.RestaurantDepthCarousel.goTo(0));
  await page.waitForTimeout(1500);
  await page.evaluate(()=>window.RestaurantDepthCarousel.goTo(3));
  for(let i=0;i<12;i++){
    pairs.push(await page.evaluate(()=>({
      title:document.getElementById('dish-title').textContent.trim(),
      price:document.querySelector('.dc-price').textContent.trim(),
      ing:document.querySelector('.dc-ingredients').textContent.trim()
    })));
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1400);
  const mapping=new Map();
  let conflict=null;
  for(const p of pairs){
    if(!p.title)continue;
    const seen=mapping.get(p.title);
    if(seen&&seen!==`${p.price}|${p.ing}`)conflict=`${p.title}: "${seen}" vs "${p.price}|${p.ing}"`;
    mapping.set(p.title,`${p.price}|${p.ing}`);
  }
  check(`${label} · V2 title and price never disagree in flight`,!conflict,conflict||`${pairs.length} samples, ${mapping.size} dishes`);


  /* ---- 6. no horizontal overflow, controls reachable ---- */
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(`${label} · no broken horizontal overflow`,overflow<=2,`${overflow}px`);
  check(`${label} · controls visible`,await page.locator('#next-dish').isVisible()&&await page.locator('#explore-dish').isVisible());

  /* ---- 7. dish detail still opens and returns ---- */
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(1200);
  const detailOpen=await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open'));
  check(`${label} · dish detail opens from the carousel`,detailOpen);
  if(detailOpen)await page.screenshot({path:path.join(SHOTS,`v2-${label}-05-detail.png`)});
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
  await page.screenshot({path:path.join(SHOTS,`v2-${label}-06-orbital-regression.png`)});

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
  await page.screenshot({path:path.join(SHOTS,'v2-reduced-motion-01.png')});
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
