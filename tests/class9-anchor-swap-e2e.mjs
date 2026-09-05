/* CLASS 09 · PROJECT 02 — ANCHOR SWAP / SPLIT DROP
   Functional + visual + regression coverage on desktop, mobile and reduced motion.

   Project 01 taught us that getBoundingClientRect proves an element exists, not that
   it is visible. So the occlusion gate here is a real PIXEL test: the fingertip layer
   is checked against the frame buffer, not against the DOM.
*/
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
const check=(name,ok,detail='')=>{results.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function selectPreset(page,value,readyFlag){
  await page.waitForFunction(v=>!!document.querySelector(`#motion-orbital-style option[value="${v}"]`),value,{timeout:25000});
  await page.evaluate(v=>{
    const s=document.getElementById('motion-orbital-style');
    s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  },value);
  if(readyFlag)await page.waitForFunction(f=>document.documentElement.dataset[f]==='ready',readyFlag,{timeout:14000});
}
const setP=(page,p,dir=1)=>page.evaluate(([v,d])=>window.RestaurantAnchorSwap.setProgress(v,d),[p,dir]);
const stateOf=page=>page.evaluate(()=>window.RestaurantAnchorSwap.state());

async function session(label,viewport,isMobile){
  const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});

  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await page.waitForFunction(()=>!!window.RestaurantAnchorSwap,null,{timeout:25000});
  await page.waitForTimeout(700);
  const dishes=await page.locator('#orbit-stage .orbit-dish').count();

  check(`${label} · Studio exposes the Anchor Swap preset`,
    await page.evaluate(()=>!!document.querySelector('#motion-orbital-style option[value="anchor-swap"]')));

  await selectPreset(page,'anchor-swap','anchorSwap');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await setP(page,0,1);
  await page.waitForTimeout(400);

  /* ---- 1. the anchor exists, and it is the thing that does not move ---- */
  const anchor=await page.evaluate(()=>{
    const b=document.querySelector('.as-anchor-back'),f=document.querySelector('.as-anchor-front');
    const r=x=>{const q=x.getBoundingClientRect();return {w:Math.round(q.width),h:Math.round(q.height),
      x:Math.round(q.left),y:Math.round(q.top),loaded:x.complete&&x.naturalWidth>0}};
    return {back:r(b),front:r(f)};
  });
  check(`${label} · anchor is present and loaded`,
    anchor.back.loaded&&anchor.front.loaded&&anchor.back.w>120,JSON.stringify(anchor.back));

  const anchorAt=async p=>{await setP(page,p,1);await page.waitForTimeout(160);
    return page.evaluate(()=>{const q=document.querySelector('.as-anchor').getBoundingClientRect();
      return {x:+q.left.toFixed(1),y:+q.top.toFixed(1)}})};
  const a0=await anchorAt(0), a5=await anchorAt(.5), a1=await anchorAt(1);
  const drift=Math.max(Math.abs(a5.y-a0.y),Math.abs(a1.y-a0.y),Math.abs(a5.x-a0.x));
  check(`${label} · the anchor stays put while the world changes`,drift<=6,`max drift ${drift.toFixed(1)}px`);

  /* ---- 2. PIXEL gate: the fingertips really paint over the product ---- */
  await setP(page,0,1);
  await page.waitForTimeout(300);
  const occl=await (async()=>{
    const box=await page.evaluate(()=>{
      const f=document.querySelector('.as-anchor-front').getBoundingClientRect();
      const p=document.querySelector('.as-product-out').getBoundingClientRect();
      const l=Math.max(f.left,p.left),r=Math.min(f.right,p.right);
      const t=Math.max(f.top,p.top),b=Math.min(f.bottom,p.bottom);
      return (r>l&&b>t)?{x:Math.round(l),y:Math.round(t),width:Math.round(r-l),height:Math.round(b-t)}:null;
    });
    if(!box||box.width<8||box.height<8)return {overlap:false};
    /* hide the fingertips, shoot, show them, shoot: if the layer is genuinely in
       front of the product the two frames must differ inside the overlap */
    const shot=async()=>page.screenshot({clip:box});
    const withFront=await shot();
    await page.evaluate(()=>{document.querySelector('.as-anchor-front').style.visibility='hidden'});
    await page.waitForTimeout(180);
    const withoutFront=await shot();
    await page.evaluate(()=>{document.querySelector('.as-anchor-front').style.visibility=''});
    await page.waitForTimeout(180);
    return {overlap:true,box,changed:Buffer.compare(withFront,withoutFront)!==0,
      bytes:[withFront.length,withoutFront.length]};
  })();
  check(`${label} · the product sits BETWEEN the two hand layers`,
    occl.overlap&&occl.changed,occl.overlap?`overlap ${occl.box.width}x${occl.box.height}px, frame changes when the fingertips are hidden`:'no overlap between fingertips and product');

  const order=await page.evaluate(()=>{
    const z=s=>+getComputedStyle(document.querySelector(s)).zIndex;
    return {back:z('.as-anchor-back'),out:z('.as-product-out'),in:z('.as-product-in'),front:z('.as-anchor-front')};
  });
  check(`${label} · layer order back < product < front`,
    order.back<order.out&&order.out<order.in&&order.in<order.front,JSON.stringify(order));

  /* ---- 3. products ---- */
  check(`${label} · at least three products drive the anchor`,dishes>=3,`${dishes} dishes`);
  const srcs=[];
  for(const i of [0,2,4]){
    await page.evaluate(v=>window.RestaurantAnchorSwap.goTo(v),i%dishes);
    await page.waitForTimeout(1700);
    srcs.push(await page.evaluate(()=>({
      rest:window.RestaurantAnchorSwap.state().restIndex,
      src:(document.querySelector('.as-product-out').getAttribute('src')||'').split('/').pop()})));
  }
  check(`${label} · the held product actually changes`,new Set(srcs.map(x=>x.src)).size>=3,srcs.map(x=>`${x.rest}:${x.src}`).join(' '));
  await page.evaluate(()=>window.RestaurantAnchorSwap.goTo(0));
  await page.waitForTimeout(1500);

  /* ---- 4. coexistence at the crossover ---- */
  await page.evaluate(()=>window.RestaurantAnchorSwap.cancel());
  await page.waitForTimeout(900);
  await setP(page,.5,1);
  await page.waitForTimeout(280);
  const mid=await page.evaluate(()=>{
    const o=n=>+getComputedStyle(document.querySelector(n)).opacity;
    const rect=n=>{const r=document.querySelector(n).getBoundingClientRect();return {y:Math.round(r.top),h:Math.round(r.height)}};
    const clip=getComputedStyle(document.querySelector('.as-bg-b')).clipPath||'';
    return {out:o('.as-product-out'),in:o('.as-product-in'),
      outRect:rect('.as-product-out'),inRect:rect('.as-product-in'),
      bgA:o('.as-bg-a'),bgB:o('.as-bg-b'),clip:clip.slice(0,60),
      copy:o('.dish-copy')};
  });
  check(`${label} · outgoing and incoming products coexist at 50%`,
    mid.out>.2&&mid.in>.2,`out ${mid.out.toFixed(2)} · in ${mid.in.toFixed(2)}`);
  check(`${label} · they are in different places, not stacked`,
    Math.abs(mid.outRect.y-mid.inRect.y)>mid.outRect.h*.5,
    `out y ${mid.outRect.y} · in y ${mid.inRect.y} · h ${mid.outRect.h}`);
  check(`${label} · both colour worlds are on stage at 50%`,
    mid.bgA===1&&mid.bgB===1&&/polygon/.test(mid.clip),`${mid.clip}`);
  check(`${label} · copy steps aside for the crossover`,mid.copy<.2,`copy opacity ${mid.copy.toFixed(2)}`);
  await page.screenshot({path:path.join(SHOTS,`anchor-swap-${label}-03-half.png`)});

  /* ---- 5. the split really follows progress ---- */
  const edgeAt=async p=>{await setP(page,p,1);await page.waitForTimeout(140);
    return page.evaluate(()=>{
      const cp=getComputedStyle(document.querySelector('.as-bg-b')).clipPath||'';
      const h=document.querySelector('.as-bg-b').getBoundingClientRect().height||1;
      const nums=[...cp.matchAll(/(-?[\d.]+)(px|%)/g)].map(m=>m[2]==='%'?+m[1]/100*h:+m[1]);
      const ys=nums.filter((_,i)=>i%2===1);
      return ys.length?+(Math.max(...ys)/h*100).toFixed(1):NaN;
    })};
  const e0=await edgeAt(0), e25=await edgeAt(.25), e50=await edgeAt(.5), e75=await edgeAt(.75), e100=await edgeAt(1);
  check(`${label} · the split drop tracks the gesture`,
    e0<e25&&e25<e50&&e50<e75&&e75<=e100&&e100>80,`${e0} → ${e25} → ${e50} → ${e75} → ${e100} %`);

  /* ---- 6. reversible, and release can cancel or complete ---- */
  await setP(page,0,1);await page.waitForTimeout(250);
  const before=(await stateOf(page)).restIndex;
  await setP(page,.7,1);await page.waitForTimeout(200);
  await setP(page,.1,1);await page.waitForTimeout(200);
  const reversed=await stateOf(page);
  check(`${label} · dragging back reverses the transition`,
    reversed.progress<.15&&!reversed.committed&&reversed.restIndex===before,JSON.stringify(reversed));

  await page.evaluate(()=>window.RestaurantAnchorSwap.cancel());
  await page.waitForTimeout(1200);
  const afterCancel=await stateOf(page);
  const counterAfterCancel=await page.evaluate(()=>document.getElementById('dish-counter').textContent.trim());
  check(`${label} · a cancelled release commits nothing`,
    afterCancel.restIndex===before&&afterCancel.progress===0,`rest ${afterCancel.restIndex} · ${counterAfterCancel}`);

  await page.evaluate(()=>window.RestaurantAnchorSwap.step(1));
  await page.waitForTimeout(2000);
  const afterComplete=await stateOf(page);
  const counterIdx=await page.evaluate(()=>parseInt(document.getElementById('dish-counter').textContent,10)-1);
  check(`${label} · a completed gesture commits the new product`,
    afterComplete.restIndex===(before+1)%dishes&&counterIdx===afterComplete.restIndex,
    `rest ${before} → ${afterComplete.restIndex} · counter ${counterIdx}`);
  await page.screenshot({path:path.join(SHOTS,`anchor-swap-${label}-05-complete.png`)});

  /* ---- 7. real gesture ---- */
  const box=await page.locator('.orbit-shell').boundingBox();
  const gx=box.x+box.width*(isMobile?.5:.62);
  const gy=Math.min(Math.max(box.y+box.height*.45,30),viewport.height-40);
  const grabbable=await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return !!e&&!!e.closest('.orbit-shell')},[gx,gy]);
  check(`${label} · the drag surface is reachable`,grabbable,`(${gx.toFixed(0)}, ${gy.toFixed(0)})`);
  const restBefore=(await stateOf(page)).restIndex;
  if(isMobile){
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:gx,y:gy}]});
    for(let i=1;i<=14;i++){await page.waitForTimeout(16);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:gx,y:gy+i*16}]})}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{
    await page.mouse.move(gx,gy);await page.mouse.down();
    for(let i=1;i<=16;i++){await page.mouse.move(gx,gy+i*17);await page.waitForTimeout(14)}
    await page.mouse.up();
  }
  await page.waitForTimeout(1700);
  const restAfter=(await stateOf(page)).restIndex;
  check(`${label} · ${isMobile?'swipe':'drag'} completes the swap`,restAfter!==restBefore,`${restBefore} → ${restAfter}`);

  /* ---- 8. decor changes with the product ---- */
  const decor=await page.evaluate(()=>{
    const read=()=>[...document.querySelectorAll('.as-decor-front .as-decor-group:first-child .as-decor-item, .as-decor-back .as-decor-group:first-child .as-decor-item')]
      .map(e=>(e.style.backgroundImage.match(/dish-\d+-decor-[a-z]/)||[''])[0]).join('+');
    const s=window.RestaurantAnchorSwap.state();
    const first=read();
    return {first,atmo:document.querySelectorAll('.as-atmo').length,
      items:document.querySelectorAll('.as-decor-item').length,rest:s.restIndex};
  });
  await page.evaluate(()=>{const s=window.RestaurantAnchorSwap.state();window.RestaurantAnchorSwap.goTo((s.restIndex+2)%s.dishes)});
  await page.waitForTimeout(1900);
  const decor2=await page.evaluate(()=>[...document.querySelectorAll('.as-decor-front .as-decor-group:first-child .as-decor-item, .as-decor-back .as-decor-group:first-child .as-decor-item')]
    .map(e=>(e.style.backgroundImage.match(/dish-\d+-decor-[a-z]/)||[''])[0]).join('+'));
  check(`${label} · decor is rendered and belongs to the product`,
    decor.items>=4&&decor.atmo>=2,JSON.stringify({items:decor.items,atmo:decor.atmo}));
  check(`${label} · decor changes when the product changes`,decor.first!==decor2,`${decor.first} → ${decor2}`);

  /* ---- 9. copy synchronised with the committed index ---- */
  const sync=await page.evaluate(()=>{
    const idx=parseInt(document.getElementById('dish-counter').textContent,10)-1;
    const d=(window.RestaurantDefaults.dishes||[]).filter(x=>x.enabled!==false)[idx]||{};
    return {idx,title:document.getElementById('dish-title').textContent.trim(),
      price:document.querySelector('.as-price').textContent.trim(),expected:(d.price||'').trim(),
      ing:document.querySelector('.as-ingredients').textContent.trim(),
      dot:[...document.querySelectorAll('.as-dot')].findIndex(x=>x.getAttribute('aria-current')==='true')};
  });
  check(`${label} · copy, price and indicator follow the same dish`,
    !!sync.title&&sync.price===sync.expected&&!!sync.ing&&sync.dot===sync.idx,JSON.stringify(sync));

  /* ---- 10. the real dish detail ---- */
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(1300);
  const detailOpen=await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open'));
  check(`${label} · the anchored product opens the real dish`,detailOpen);
  if(detailOpen){
    await page.screenshot({path:path.join(SHOTS,`anchor-swap-${label}-06-detail.png`)});
    await page.evaluate(()=>document.querySelector('#detail-close')?.click());
    await page.waitForTimeout(1400);
  }
  check(`${label} · the scene survives the detail round trip`,
    await page.evaluate(()=>!!document.querySelector('.as-anchor-front')&&!document.getElementById('dish-detail').classList.contains('is-open')));

  /* ---- 11. no broken overflow, controls reachable ---- */
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(`${label} · no broken horizontal overflow`,overflow<=2,`${overflow}px`);
  check(`${label} · controls reachable`,
    await page.locator('#next-dish').isVisible()&&await page.locator('#explore-dish').isVisible());

  /* ---- 12. regression: Project 01 and Orbital are untouched ---- */
  await selectPreset(page,'depth-carousel','depthCarousel');
  await page.waitForTimeout(1100);
  const p01=await page.evaluate(()=>{
    const s=window.RestaurantDepthCarousel.state();
    const present=[...document.querySelectorAll('.dc-plate')].filter(e=>+getComputedStyle(e.firstElementChild).opacity>=.3).length;
    return {present,free:s.freeObjects,anchorHidden:document.querySelector('.as-scene')?.hidden===true};
  });
  check(`${label} · Project 01 still works and Anchor Swap steps aside`,
    p01.present>=(isMobile?4:5)&&p01.free>=3&&p01.anchorHidden,JSON.stringify(p01));

  await selectPreset(page,'elegant');
  await page.waitForTimeout(1000);
  const orbital=await page.evaluate(()=>({
    stage:getComputedStyle(document.getElementById('orbit-stage')).visibility!=='hidden',
    dishes:document.querySelectorAll('#orbit-stage .orbit-dish').length,
    anchorHidden:document.querySelector('.as-scene')?.hidden===true,
    depthHidden:document.querySelector('.dc-scene')?.hidden===true
  }));
  check(`${label} · Orbital is restored intact`,
    orbital.stage&&orbital.dishes===dishes&&orbital.anchorHidden&&orbital.depthHidden,JSON.stringify(orbital));
  await page.screenshot({path:path.join(SHOTS,`anchor-swap-${label}-07-orbital-regression.png`)});

  await selectPreset(page,'anchor-swap','anchorSwap');
  await page.waitForTimeout(800);
  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(600);
  check(`${label} · Restaurant Studio still opens`,
    await page.evaluate(()=>document.getElementById('studio').getAttribute('aria-hidden')==='false'));
  await page.evaluate(()=>document.querySelector('#studio-close').click());
  await page.waitForTimeout(400);

  /* ---- 13. the gesture series ---- */
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  for(const [name,p] of [['01-idle',0],['02-quarter',.25],['04-three-quarter',.75]]){
    await setP(page,p,1);await page.waitForTimeout(280);
    await page.screenshot({path:path.join(SHOTS,`anchor-swap-${label}-${name}.png`)});
  }
  await setP(page,0,1);

  const fatal=errors.filter(e=>!/favicon|net::ERR/i.test(e));
  check(`${label} · no JS errors`,fatal.length===0,fatal.slice(0,3).join(' | '));
  await context.close();
}

async function reducedMotionSession(){
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.RestaurantAnchorSwap,null,{timeout:25000});
  await page.waitForTimeout(700);
  await selectPreset(page,'anchor-swap','anchorSwap');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const s=await page.evaluate(()=>({
    anchor:!!document.querySelector('.as-anchor-front'),
    product:+getComputedStyle(document.querySelector('.as-product-out')).opacity,
    title:document.getElementById('dish-title').textContent.trim(),
    price:document.querySelector('.as-price').textContent.trim(),
    controls:!!document.querySelector('#next-dish')
  }));
  check('reduced-motion · content, anchor and navigation survive',
    s.anchor&&s.product>.8&&!!s.title&&!!s.price&&s.controls,JSON.stringify(s));
  const i0=await page.evaluate(()=>document.getElementById('dish-counter').textContent.trim());
  await page.click('#next-dish');
  await page.waitForTimeout(900);
  const i1=await page.evaluate(()=>document.getElementById('dish-counter').textContent.trim());
  check('reduced-motion · navigation still changes the dish',i0!==i1,`${i0} → ${i1}`);
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(1100);
  check('reduced-motion · the dish detail still opens',
    await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open')));
  await page.screenshot({path:path.join(SHOTS,'anchor-swap-reduced-motion.png')});
  await context.close();
}

await session('desktop',{width:1440,height:900},false);
await session('mobile',{width:390,height:844},true);
await reducedMotionSession();

await browser.close();server.close();

const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots → ${SHOTS}`);
if(failed.length){console.error(`ANCHOR_SWAP_FAIL: ${failed.map(f=>f.name).join(' | ')}`);process.exit(1)}
console.log('ANCHOR_SWAP_PASS');
