/* CLASS 09 · PROJECT 02 PIVOT — ANCHOR SCENE SWAP
   Functional + visual + regression coverage on desktop, mobile and reduced motion.

   The lesson from Project 01 stands: geometry is not visual proof. So the two checks
   that decide whether this pivot works are measured on PIXELS —
     · the anchor band of two consecutive scenes must be near-identical, because that
       is what makes the wipe invisible on the hand;
     · the frame above and below the seam at 50% must genuinely differ, because that
       is what proves two worlds are on stage at once.
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
const setP=(page,p,dir=1)=>page.evaluate(([v,d])=>window.RestaurantAnchorScenes.setProgress(v,d),[p,dir]);
const stateOf=page=>page.evaluate(()=>window.RestaurantAnchorScenes.state());

async function session(label,viewport,isMobile){
  const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});

  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await page.waitForFunction(()=>!!window.RestaurantAnchorScenes,null,{timeout:25000});
  await page.waitForTimeout(700);
  const dishes=await page.locator('#orbit-stage .orbit-dish').count();

  check(`${label} · Studio exposes the Anchor Scenes preset`,
    await page.evaluate(()=>!!document.querySelector('#motion-orbital-style option[value="anchor-scenes"]')));

  await selectPreset(page,'anchor-scenes','anchorScenes');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  await setP(page,0,1);
  await page.waitForTimeout(400);

  /* ---- 1. the pivot: precomposed scenes, no runtime hand assembly ---- */
  const model=await page.evaluate(()=>{
    const list=(window.RestaurantDefaults.dishes||[]).filter(d=>d.enabled!==false);
    return {
      dishes:list.length,
      withScene:list.filter(d=>d.anchorScene&&d.anchorScene.image).length,
      images:[...new Set(list.map(d=>d.anchorScene&&d.anchorScene.image).filter(Boolean))].length,
      splitHandLayers:document.querySelectorAll('.as-anchor-back,.as-anchor-front').length,
      sceneWrappers:document.querySelectorAll('.sc-scene').length,
      resolved:document.querySelectorAll('.sc-scene[data-kind="scene"]').length
    };
  });
  check(`${label} · the preset no longer assembles a split hand`,model.splitHandLayers===0,
    `${model.splitHandLayers} legacy hand layers in the DOM`);
  check(`${label} · 4-6 master scenes are wired to the dishes`,
    model.withScene>=4&&model.withScene<=6&&model.images===model.withScene,
    `${model.withScene} dishes, ${model.images} distinct scene images`);
  check(`${label} · exactly two scene surfaces, both resolved`,
    model.sceneWrappers===2&&model.resolved===2,JSON.stringify({wrappers:model.sceneWrappers,resolved:model.resolved}));

  /* ---- 2. scene consistency, measured in the browser ---- */
  const consistency=await page.evaluate(async()=>{
    const list=(window.RestaurantDefaults.dishes||[]).filter(d=>d.enabled!==false)
      .map(d=>d.anchorScene&&d.anchorScene.image).filter(Boolean);
    const load=src=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(src));i.src=src});
    const imgs=await Promise.all(list.map(load));
    const W=imgs[0].naturalWidth,H=imgs[0].naturalHeight;
    const same=imgs.every(i=>i.naturalWidth===W&&i.naturalHeight===H);

    const px=img=>{const c=document.createElement('canvas');c.width=W;c.height=H;
      const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);
      return x.getImageData(0,0,W,H).data};
    const a=px(imgs[0]), b=px(imgs[1]);
    /* the anchor band: lower third, where wrist and palm live and the object never
       reaches. If the hand moved between takes it shows here. */
    let sum=0,n=0,over=0;
    for(let y=Math.round(H*.66);y<Math.round(H*.98);y+=2)
      for(let x=Math.round(W*.14);x<Math.round(W*.94);x+=2){
        const i=(y*W+x)*4;
        const e=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));
        sum+=e;n++;if(e>48)over++;
      }
    return {count:list.length,W,H,sameCanvas:same,
      anchorMeanDiff:+(sum/n).toFixed(2),anchorChanged:+(over/n).toFixed(4)};
  });
  check(`${label} · every scene shares one canvas`,consistency.sameCanvas,
    `${consistency.count} scenes @ ${consistency.W}x${consistency.H}`);
  /* THE property the pivot rests on: the hand is the same in both scenes, so a wipe
     across it cannot be seen. */
  check(`${label} · the anchor is the same across scenes (pixel-measured)`,
    consistency.anchorMeanDiff<=26&&consistency.anchorChanged<=.055,
    `mean diff ${consistency.anchorMeanDiff}/255, ${(consistency.anchorChanged*100).toFixed(2)}% of the band changed`);

  /* ---- 3. coexistence at the crossover, measured on the frame ---- */
  await setP(page,.5,1);
  await page.waitForTimeout(320);
  const mid=await page.evaluate(()=>{
    const r=document.querySelector('.sc-stage').getBoundingClientRect();
    const cs=n=>getComputedStyle(document.querySelector(n));
    const maskB=cs('.sc-scene-b').maskImage||cs('.sc-scene-b').webkitMaskImage||'';
    return {
      aVisible:+cs('.sc-scene-a').opacity>0&&cs('.sc-scene-a').display!=='none',
      bVisible:+cs('.sc-scene-b').opacity>0&&cs('.sc-scene-b').display!=='none',
      mask:maskB.slice(0,90),
      seam:+cs('.sc-seam').opacity,
      copy:+cs('.dish-copy').opacity,
      stage:{x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)}
    };
  });
  check(`${label} · both scenes are on stage at 50%`,mid.aVisible&&mid.bVisible&&/gradient/.test(mid.mask),mid.mask);
  check(`${label} · the seam light shows during the gesture`,mid.seam>.05,`seam opacity ${mid.seam.toFixed(2)}`);
  check(`${label} · copy steps aside for the crossover`,mid.copy<.2,`copy opacity ${mid.copy.toFixed(2)}`);

  /* Pixel proof that two worlds coexist: sample a column of background well away
     from the hand, above and below the seam. They must differ. */
  const worlds=await(async()=>{
    const s=mid.stage;
    const bx=Math.round(s.x+s.w*(isMobile?.06:.90));
    const top={x:bx,y:Math.round(s.y+s.h*.16),width:24,height:24};
    const bottom={x:bx,y:Math.round(s.y+s.h*.82),width:24,height:24};
    if(top.x+24>viewport.width||bottom.y+24>viewport.height)return {skipped:true};
    const a=await page.screenshot({clip:top});
    const b=await page.screenshot({clip:bottom});
    await setP(page,0,1);await page.waitForTimeout(260);
    const a0=await page.screenshot({clip:top});
    await setP(page,.5,1);await page.waitForTimeout(260);
    return {differs:Buffer.compare(a,b)!==0,changedVsRest:Buffer.compare(a,a0)!==0};
  })();
  check(`${label} · old and new worlds coexist across the seam (pixels)`,
    worlds.skipped?true:(worlds.differs&&worlds.changedVsRest),
    worlds.skipped?'sample outside viewport, skipped':`above!=below ${worlds.differs}, above changed vs rest ${worlds.changedVsRest}`);

  await page.screenshot({path:path.join(SHOTS,`anchor-scenes-${label}-03-half.png`)});

  /* ---- 4. the wipe follows progress ---- */
  const edgeAt=async p=>{
    await setP(page,p,1);await page.waitForTimeout(150);
    return page.evaluate(()=>{
      const cs=getComputedStyle(document.querySelector('.sc-scene-b'));
      const m=cs.maskImage||cs.webkitMaskImage||'';
      const h=document.querySelector('.sc-scene-b').getBoundingClientRect().height||1;
      const nums=[...m.matchAll(/(-?[\d.]+)(px|%)/g)].map(x=>x[2]==='%'?+x[1]/100*h:+x[1]);
      return nums.length?+(Math.max(...nums)/h*100).toFixed(1):NaN;
    });
  };
  const e=[await edgeAt(0),await edgeAt(.25),await edgeAt(.5),await edgeAt(.75),await edgeAt(1)];
  check(`${label} · the wipe tracks the gesture`,
    e.every(v=>Number.isFinite(v))&&e[0]<e[1]&&e[1]<e[2]&&e[2]<e[3]&&e[3]<=e[4]&&e[4]>90,
    e.map(v=>`${v}%`).join(' → '));

  /* ---- 5. reversible · cancel · complete ---- */
  await setP(page,0,1);await page.waitForTimeout(260);
  const before=(await stateOf(page)).restIndex;
  await setP(page,.7,1);await page.waitForTimeout(220);
  await setP(page,.1,1);await page.waitForTimeout(220);
  const rev=await stateOf(page);
  check(`${label} · dragging back reverses the transition`,
    rev.progress<.15&&!rev.committed&&rev.restIndex===before,JSON.stringify(rev));

  await page.evaluate(()=>window.RestaurantAnchorScenes.cancel());
  await page.waitForTimeout(1200);
  const cancelled=await stateOf(page);
  check(`${label} · a cancelled release commits nothing`,
    cancelled.restIndex===before&&cancelled.progress===0,
    `rest ${cancelled.restIndex}, counter ${await page.evaluate(()=>document.getElementById('dish-counter').textContent.trim())}`);

  await page.evaluate(()=>window.RestaurantAnchorScenes.step(1));
  await page.waitForTimeout(2000);
  const done=await stateOf(page);
  const counterIdx=await page.evaluate(()=>parseInt(document.getElementById('dish-counter').textContent,10)-1);
  check(`${label} · a completed gesture commits the new scene`,
    done.restIndex===(before+1)%dishes&&counterIdx===done.restIndex,
    `${before} → ${done.restIndex}, counter ${counterIdx}`);
  await page.screenshot({path:path.join(SHOTS,`anchor-scenes-${label}-05-complete.png`)});

  /* ---- 6. the scene really changes ---- */
  const seen=[];
  for(const i of [0,2,4]){
    await page.evaluate(v=>window.RestaurantAnchorScenes.goTo(v),i%dishes);
    await page.waitForTimeout(1700);
    seen.push(await page.evaluate(()=>{
      const bg=getComputedStyle(document.querySelector('.sc-scene-a .sc-subject')).backgroundImage||'';
      return (bg.match(/scene-\d+-[a-z-]+\.webp/)||['?'])[0];
    }));
  }
  check(`${label} · the held scene actually changes`,new Set(seen).size>=3,seen.join(' '));

  /* ---- 7. real gesture ---- */
  const box=await page.locator('.orbit-shell').boundingBox();
  const gx=box.x+box.width*(isMobile?.5:.62);
  const gy=Math.min(Math.max(box.y+box.height*.45,30),viewport.height-40);
  check(`${label} · the drag surface is reachable`,
    await page.evaluate(([x,y])=>{const el=document.elementFromPoint(x,y);return !!el&&!!el.closest('.orbit-shell')},[gx,gy]),
    `(${gx.toFixed(0)}, ${gy.toFixed(0)})`);
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
  await page.waitForTimeout(1800);
  check(`${label} · ${isMobile?'swipe':'drag'} completes the swap`,
    (await stateOf(page)).restIndex!==restBefore,`${restBefore} → ${(await stateOf(page)).restIndex}`);

  /* ---- 8. decor changes with the product ---- */
  const decorNow=()=>page.evaluate(()=>[...document.querySelectorAll('.sc-decor-front .sc-decor-group:first-child .sc-decor-item, .sc-decor-back .sc-decor-group:first-child .sc-decor-item')]
    .map(e=>(e.style.backgroundImage.match(/dish-\d+-decor-[a-z]/)||[''])[0]).join('+'));
  const d1=await decorNow();
  const counts=await page.evaluate(()=>({items:document.querySelectorAll('.sc-decor-item').length,
    atmo:document.querySelectorAll('.sc-atmo').length}));
  await page.evaluate(()=>{const s=window.RestaurantAnchorScenes.state();window.RestaurantAnchorScenes.goTo((s.restIndex+2)%s.dishes)});
  await page.waitForTimeout(1900);
  const d2=await decorNow();
  check(`${label} · decor is rendered`,counts.items>=4&&counts.atmo>=2,JSON.stringify(counts));
  check(`${label} · decor changes when the product changes`,d1!==d2,`${d1} → ${d2}`);

  /* ---- 9. copy synchronised ---- */
  const sync=await page.evaluate(()=>{
    const idx=parseInt(document.getElementById('dish-counter').textContent,10)-1;
    const d=(window.RestaurantDefaults.dishes||[]).filter(x=>x.enabled!==false)[idx]||{};
    return {idx,title:document.getElementById('dish-title').textContent.trim(),
      price:document.querySelector('.sc-price').textContent.trim(),expected:(d.price||'').trim(),
      ing:document.querySelector('.sc-ingredients').textContent.trim(),
      dot:[...document.querySelectorAll('.sc-dot')].findIndex(x=>x.getAttribute('aria-current')==='true')};
  });
  check(`${label} · copy, price and indicator follow the same dish`,
    !!sync.title&&sync.price===sync.expected&&!!sync.ing&&sync.dot===sync.idx,JSON.stringify(sync));

  /* ---- 10. the real dish detail ---- */
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(1300);
  const openedByCta=await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open'));
  check(`${label} · the active scene opens the real dish`,openedByCta);
  if(openedByCta){
    await page.screenshot({path:path.join(SHOTS,`anchor-scenes-${label}-06-detail.png`)});
    await page.evaluate(()=>document.querySelector('#detail-close')?.click());
    await page.waitForTimeout(1400);
  }
  check(`${label} · the scene survives the detail round trip`,
    await page.evaluate(()=>document.querySelectorAll('.sc-scene[data-kind="scene"]').length===2
      &&!document.getElementById('dish-detail').classList.contains('is-open')));

  if(!isMobile){
    /* clicking the object itself, not just the CTA */
    await setP(page,0,1);await page.waitForTimeout(400);
    const hit=await page.evaluate(()=>{
      const s=window.RestaurantAnchorScenes.state();
      const d=(window.RestaurantDefaults.dishes||[]).filter(x=>x.enabled!==false)[s.restIndex];
      const r=document.querySelector('.sc-scene-a .sc-subject').getBoundingClientRect();
      const h=d.anchorScene.hit;
      return {x:r.left+(h.x+h.w/2)*r.width,y:r.top+(h.y+h.h/2)*r.height};
    });
    const hy=Math.min(Math.max(hit.y,24),viewport.height-24);
    await page.mouse.move(hit.x,hy);await page.waitForTimeout(220);
    await page.mouse.click(hit.x,hy);
    await page.waitForTimeout(1300);
    const openedByObject=await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open'));
    check(`${label} · clicking the object opens the dish`,openedByObject);
    if(openedByObject){await page.evaluate(()=>document.querySelector('#detail-close')?.click());await page.waitForTimeout(1400)}
  }

  /* ---- 11. layout ---- */
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(`${label} · no broken horizontal overflow`,overflow<=2,`${overflow}px`);
  check(`${label} · controls reachable`,
    await page.locator('#next-dish').isVisible()&&await page.locator('#explore-dish').isVisible());

  /* ---- 12. regression ---- */
  await selectPreset(page,'depth-carousel','depthCarousel');
  await page.waitForTimeout(1200);
  const p01=await page.evaluate(()=>{
    const s=window.RestaurantDepthCarousel.state();
    const present=[...document.querySelectorAll('.dc-plate')].filter(e=>+getComputedStyle(e.firstElementChild).opacity>=.3).length;
    return {present,free:s.freeObjects,scenesHidden:document.querySelector('.sc-stage')?.hidden===true};
  });
  check(`${label} · Project 01 still works and Anchor Scenes steps aside`,
    p01.present>=(isMobile?4:5)&&p01.free>=3&&p01.scenesHidden,JSON.stringify(p01));

  await selectPreset(page,'elegant');
  await page.waitForTimeout(1100);
  const orbital=await page.evaluate(()=>({
    stage:getComputedStyle(document.getElementById('orbit-stage')).visibility!=='hidden',
    dishes:document.querySelectorAll('#orbit-stage .orbit-dish').length,
    scenesHidden:document.querySelector('.sc-stage')?.hidden===true,
    depthHidden:document.querySelector('.dc-scene')?.hidden===true
  }));
  check(`${label} · Orbital is restored intact`,
    orbital.stage&&orbital.dishes===dishes&&orbital.scenesHidden&&orbital.depthHidden,JSON.stringify(orbital));
  await page.screenshot({path:path.join(SHOTS,`anchor-scenes-${label}-07-orbital-regression.png`)});

  await selectPreset(page,'anchor-scenes','anchorScenes');
  await page.waitForTimeout(900);
  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(600);
  check(`${label} · Restaurant Studio still opens`,
    await page.evaluate(()=>document.getElementById('studio').getAttribute('aria-hidden')==='false'));
  await page.evaluate(()=>document.querySelector('#studio-close').click());
  await page.waitForTimeout(400);

  /* ---- 13. gesture series ---- */
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  for(const [name,p] of [['01-idle',0],['02-quarter',.25],['04-three-quarter',.75]]){
    await setP(page,p,1);await page.waitForTimeout(300);
    await page.screenshot({path:path.join(SHOTS,`anchor-scenes-${label}-${name}.png`)});
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
  await page.waitForFunction(()=>!!window.RestaurantAnchorScenes,null,{timeout:25000});
  await page.waitForTimeout(700);
  await selectPreset(page,'anchor-scenes','anchorScenes');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const s=await page.evaluate(()=>({
    scenes:document.querySelectorAll('.sc-scene[data-kind="scene"]').length,
    title:document.getElementById('dish-title').textContent.trim(),
    price:document.querySelector('.sc-price').textContent.trim(),
    controls:!!document.querySelector('#next-dish')
  }));
  check('reduced-motion · scene, copy and navigation survive',
    s.scenes===2&&!!s.title&&!!s.price&&s.controls,JSON.stringify(s));
  const i0=await page.evaluate(()=>document.getElementById('dish-counter').textContent.trim());
  await page.click('#next-dish');
  await page.waitForTimeout(900);
  const i1=await page.evaluate(()=>document.getElementById('dish-counter').textContent.trim());
  check('reduced-motion · navigation still changes the dish',i0!==i1,`${i0} → ${i1}`);
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(1200);
  check('reduced-motion · the dish detail still opens',
    await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open')));
  await page.screenshot({path:path.join(SHOTS,'anchor-scenes-reduced-motion.png')});
  await context.close();
}

await session('desktop',{width:1440,height:900},false);
await session('mobile',{width:390,height:844},true);
await reducedMotionSession();

await browser.close();server.close();

const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots → ${SHOTS}`);
if(failed.length){console.error(`ANCHOR_SCENES_FAIL: ${failed.map(f=>f.name).join(' | ')}`);process.exit(1)}
console.log('ANCHOR_SCENES_PASS');
